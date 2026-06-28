// GET /api/eb-admin            -> { paymentConfigured }
// GET /api/eb-admin?code=XXXX  -> { ok } true only if XXXX === ADMIN_CODE (owner link)
export default async function handler(req, res) {
  const code = (req.query && req.query.code) || "";
  const configured = !!process.env.STRIPE_SECRET_KEY;
  const adminCode = process.env.ADMIN_CODE || "";
  if (code) {
    const ok = adminCode.length > 0 && code === adminCode;
    res.status(200).json({ ok, owner: ok, paymentConfigured: configured });
    return;
  }
  res.status(200).json({ ok: false, paymentConfigured: configured });
}
