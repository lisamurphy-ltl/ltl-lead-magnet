// GET /api/eb-verify?session_id=... — confirm a Checkout session was paid.
import Stripe from "stripe";

export default async function handler(req, res) {
  const sid = (req.query && req.query.session_id) || "";
  if (!sid) { res.status(400).json({ paid: false, error: "Missing session_id" }); return; }
  if (!process.env.STRIPE_SECRET_KEY) { res.status(500).json({ paid: false, error: "Stripe not configured" }); return; }
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(sid);
    const paid = session && session.payment_status === "paid";
    const details = (session && session.customer_details) || {};
    const out = { paid: !!paid, email: details.email || "", name: details.name || "", contactId: sid };
    if (paid && process.env.GHL_INBOUND_WEBHOOK_URL) {
      try {
        await fetch(process.env.GHL_INBOUND_WEBHOOK_URL, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event: "briefing_purchased", email: out.email, name: out.name, tags: ["briefing-buyer", "icp-b-buyer"], amount: (session.amount_total || 0) / 100 }),
        });
      } catch (e) { /* non-fatal */ }
    }
    res.status(200).json(out);
  } catch (err) {
    res.status(500).json({ paid: false, error: err.message || "Verify failed" });
  }
}
