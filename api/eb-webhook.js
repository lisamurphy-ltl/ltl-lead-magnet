// POST /api/eb-webhook — OPTIONAL Stripe backstop. Records the purchase in GHL
// even if the buyer closes the tab before the success redirect. Active only when
// STRIPE_WEBHOOK_SECRET is set. Needs the raw body, so the parser is turned off.
import Stripe from "stripe";

export const config = { api: { bodyParser: false } };

function rawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).end(); return; }
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) { res.status(200).json({ skipped: true }); return; }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  let event;
  try {
    const buf = await rawBody(req);
    event = stripe.webhooks.constructEvent(buf, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    res.status(400).send("Webhook signature failed: " + err.message); return;
  }
  if (event.type === "checkout.session.completed" && process.env.GHL_INBOUND_WEBHOOK_URL) {
    const s = event.data.object;
    const det = s.customer_details || {};
    try {
      await fetch(process.env.GHL_INBOUND_WEBHOOK_URL, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "briefing_purchased", email: det.email, name: det.name, tags: ["briefing-buyer", "icp-b-buyer"], amount: (s.amount_total || 0) / 100 }),
      });
    } catch (e) { /* non-fatal */ }
  }
  res.status(200).json({ received: true });
}
