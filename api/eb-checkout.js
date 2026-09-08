// POST /api/eb-checkout — create a Stripe Checkout session for the $97 Briefing.
//
// Body {} ................... normal $97 checkout (promo box shown on Stripe's page).
// Body { code, email } ...... PARTNER / CLIENT PASS: one shared code word Lisa hands out.
//   Each email may use it ONCE. Stripe can't enforce "once per email" on its own, so we
//   check Stripe's own records (completed Checkout sessions for that email) before
//   opening a $0 session locked to that email with the pass coupon pre-applied.
import Stripe from "stripe";

const PASS_CODE = (process.env.PASS_CODE || "LTLPASS").trim().toUpperCase();
// 100%-off coupon "Partner / Client pass" — restricted to the Briefing product.
const PASS_COUPON = process.env.PASS_COUPON || "PzWt1T9u";

function baseUrl(req) {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, "");
  const proto = req.headers["x-forwarded-proto"] || "https";
  return proto + "://" + req.headers["host"];
}

function readBody(req) {
  const b = req.body;
  if (!b) return {};
  if (typeof b === "string") { try { return JSON.parse(b); } catch (e) { return {}; } }
  return b;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Has this email already had a free (pass) run? Any completed session that either
// carries our pass metadata or completed at $0 counts.
async function emailAlreadyUsedPass(stripe, email) {
  let starting_after;
  for (let page = 0; page < 5; page++) {
    const params = { customer_details: { email }, status: "complete", limit: 100 };
    if (starting_after) params.starting_after = starting_after;
    const list = await stripe.checkout.sessions.list(params);
    for (const s of list.data) {
      if ((s.metadata && s.metadata.pass_code) || s.amount_total === 0) return true;
    }
    if (!list.has_more) break;
    starting_after = list.data[list.data.length - 1].id;
  }
  return false;
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }
  if (!process.env.STRIPE_SECRET_KEY) { res.status(500).json({ error: "Stripe not configured yet" }); return; }
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const amount = parseInt(process.env.PRICE_AMOUNT_CENTS || "9700", 10);
    const base = baseUrl(req);
    // Use the real live price (product prod_UmxDujUWUDZtrc) so the OWNERTEST promo
    // code + product reporting apply correctly. Env var overrides if set.
    const priceId = process.env.STRIPE_PRICE_ID || "price_1TnNJELeweUh8LMaPG3xu6qa";
    const lineItem = priceId
      ? { price: priceId, quantity: 1 }
      : { quantity: 1, price_data: { currency: "usd", unit_amount: amount, product_data: { name: "The Efficiency Briefing", description: "Your interactive operations diagnostic + your top 3 fixes, built for your own AI." } } };

    const params = {
      mode: "payment",
      line_items: [lineItem],
      payment_method_types: ["card"],
      success_url: base + "/efficiency-briefing?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: base + "/efficiency-briefing",
    };

    const body = readBody(req);
    const code = String(body.code || "").trim().toUpperCase();
    const email = String(body.email || "").trim().toLowerCase();

    if (code || email) {
      // ---- Partner / client pass path ----
      if (!code || code !== PASS_CODE) { res.status(400).json({ error: "That code isn't valid." }); return; }
      if (!EMAIL_RE.test(email)) { res.status(400).json({ error: "Please enter a valid email address." }); return; }
      if (await emailAlreadyUsedPass(stripe, email)) {
        res.status(409).json({ error: "This code has already been used with that email. Each email can use it once." });
        return;
      }
      params.discounts = [{ coupon: PASS_COUPON }];   // pre-applied; can't combine with allow_promotion_codes
      params.customer_email = email;                   // locks the email on Stripe's page
      params.metadata = { pass_code: PASS_CODE, pass_email: email };
    } else {
      params.allow_promotion_codes = true;            // normal $97 path (OWNERTEST etc.)
    }

    const session = await stripe.checkout.sessions.create(params);
    res.status(200).json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message || "Checkout failed" });
  }
}
