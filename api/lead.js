/* LtL Lead Magnet — lead capture gateway (Vercel serverless function)
   ---------------------------------------------------------------------
   POST /api/lead  → captures a lead and fans it out to whatever is wired.
   Everything is OPTIONAL and driven by environment variables, so the
   endpoint works the moment it's deployed and gets "smarter" as you add
   keys in Vercel → Settings → Environment Variables:

     GHL_WEBHOOK_URL   GoHighLevel "Inbound Webhook" URL (NO api key needed).
                       Paste the URL GHL gives you — leads POST straight in.
     RESEND_API_KEY    Resend key for transactional email.
     RESEND_FROM       e.g. "LtL <hello@limitedtolimitless.com>" (verified domain).
     ADMIN_BCC         defaults to admin@limitedtolimitless.com

   With NOTHING set, it still returns success and logs the lead (visible in
   Vercel → your project → Logs), so no lead is ever lost during testing.
   ===================================================================== */

const ADMIN_BCC = process.env.ADMIN_BCC || "admin@limitedtolimitless.com";

export default async function handler(req, res) {
  // CORS (safe for a public lead form)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  // Always log — this is the safety net.
  console.log("[LtL lead]", JSON.stringify(body));

  const results = {};

  // 1) GoHighLevel inbound webhook (no key required) -----------------
  if (process.env.GHL_WEBHOOK_URL) {
    try {
      const r = await fetch(process.env.GHL_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      results.ghl = r.ok ? "sent" : `error ${r.status}`;
    } catch (e) { results.ghl = "error " + e.message; }
  } else {
    results.ghl = "skipped (set GHL_WEBHOOK_URL)";
  }

  // 2) Resend transactional email (lead + BCC admin) ----------------
  // Only fire on a real opt-in (has email + not the ran-prompt event).
  const isOptin = body.email && body.event !== "ran-prompt";
  if (isOptin && process.env.RESEND_API_KEY) {
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + process.env.RESEND_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || "Limited to Limitless <onboarding@resend.dev>",
          to: [body.email],
          bcc: [ADMIN_BCC],
          subject: "Your Efficiency read — where your hours go",
          html: resultEmail(body),
        }),
      });
      results.email = r.ok ? "sent" : `error ${r.status}`;
    } catch (e) { results.email = "error " + e.message; }
  } else if (isOptin) {
    results.email = "skipped (set RESEND_API_KEY)";
  }

  return res.status(200).json({ ok: true, results });
}

function fmt(n) { return "$" + Number(n || 0).toLocaleString("en-US"); }

function resultEmail(b) {
  const top = (b.top2 || []).map(
    (t, i) => `<tr><td style="padding:6px 0;color:#9aa6bf">${i + 1}. ${escapeHtml(t.task)}</td>
      <td style="padding:6px 0;text-align:right;color:#D4AF37;font-weight:700">${fmt(t.annual)}/yr</td></tr>`
  ).join("");
  return `
  <div style="font-family:Inter,Arial,sans-serif;background:#060A16;color:#F4F1E9;padding:28px;border-radius:14px;max-width:520px">
    <h1 style="font-family:'Barlow Condensed',Arial;color:#D4AF37;font-size:28px;margin:0 0 8px">${escapeHtml(b.name || "Here")}, here's your time leak.</h1>
    <p style="color:#9aa6bf;margin:0 0 18px">From your top 2 tasks alone:</p>
    <div style="font-family:'Barlow Condensed',Arial;font-size:44px;font-weight:700;color:#D4AF37">${fmt(b.leakTotalYr)}<span style="font-size:16px;color:#9aa6bf"> / year</span></div>
    <table style="width:100%;margin-top:18px;border-collapse:collapse">${top}</table>
    <p style="color:#9aa6bf;margin-top:18px">You named: <em>“${escapeHtml((b.believedLeak || "").slice(0, 120))}”</em></p>
    <p style="margin-top:18px">That was just two small areas of your week. The full picture — across your whole team, built into systems that run without you — is in the <strong>Efficiency Briefing</strong>.</p>
    <p style="color:#6E7A93;margin-top:24px;font-size:13px;letter-spacing:1px">BE LIMITLESS. BE BOLD.</p>
  </div>`;
}

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
