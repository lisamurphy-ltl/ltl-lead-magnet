// POST /api/eb-checkout — create a Stripe Checkout session for the $97 Briefing.
import Stripe from "stripe";

function baseUrl(req) {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, "");
  const proto = req.headers["x-forwarded-proto"] || "https";
  return proto + "://" + req.headers["host"];
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  if (!process.env.STRIPE_SECRET_KEY) { res.status(500).json({ error: "Stripe not configured yet" }); return; }
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const amount = parseInt(process.env.PRICE_AMOUNT_CENTS || "9700", 10);
    const base = baseUrl(req);
    const lineItem = process.env.STRIPE_PRICE_ID
      ? { price: process.env.STRIPE_PRICE_ID, quantity: 1 }
      : { quantity: 1, price_data: { currency: "usd", unit_amount: amount, product_data: { name: "The Efficiency Briefing", description: "Your interactive operations diagnostic + your top 3 fixes, built for your own AI." } } };
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [lineItem],
      payment_method_types: ["card"],
      allow_promotion_codes: true,
      success_url: base + "/Efficiency-Briefing?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: base + "/Efficiency-Briefing",
    });
    res.status(200).json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message || "Checkout failed" });
  }
}
