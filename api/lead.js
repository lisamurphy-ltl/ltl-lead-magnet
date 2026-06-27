/* LtL Time-Calculator — optional secondary capture (Vercel serverless function)
   ---------------------------------------------------------------------
   POST /api/lead  → captures a lead and fans it out to whatever is wired.
   Everything is OPTIONAL and driven by environment variables, so the
   endpoint works the moment it's deployed and gets "smarter" as you add
   keys in Vercel → Settings → Environment Variables:

     RESEND_API_KEY    Resend key for the transactional result email.
     RESEND_FROM       e.g. "LtL <hello@limitedtolimitless.com>" (verified domain).
     ADMIN_BCC         defaults to admin@limitedtolimitless.com (BCC = your copy of every lead).
     NOTION_TOKEN      Notion internal-integration secret (logs each lead to your database).
     NOTION_DB_ID      The "Time-Calculator Leads" Notion database id.
     GHL_WEBHOOK_URL   (optional) GoHighLevel inbound webhook — only if you also want
                       the rich data posted to GHL (Form 44 already captures the contact).

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

  // 3) Notion — log the full tool result to your own database ---------
  if (isOptin && process.env.NOTION_TOKEN && process.env.NOTION_DB_ID) {
    try {
      const top2txt = (body.top2 || []).map((t) => `${t.task} ($${Number(t.annual||0).toLocaleString("en-US")}/yr)`).join("; ");
      const r = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + process.env.NOTION_TOKEN,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parent: { database_id: process.env.NOTION_DB_ID },
          properties: {
            "Name": { title: [{ text: { content: String(body.name || "Lead").slice(0, 200) } }] },
            "Email": { email: body.email || null },
            "Leak $/yr": { number: Math.round(Number(body.leakTotalYr) || 0) },
            "#1 Move": { rich_text: [{ text: { content: String(body.numberOneMove || "").slice(0, 1900) } }] },
            "Top 2": { rich_text: [{ text: { content: top2txt.slice(0, 1900) } }] },
            "Biggest leak (their words)": { rich_text: [{ text: { content: String(body.believedLeak || "").slice(0, 1900) } }] },
            "Team?": { checkbox: !!body.isTeam },
            "Source": { rich_text: [{ text: { content: String(body.source || "time-calculator") } }] },
          },
        }),
      });
      results.notion = r.ok ? "logged" : `error ${r.status}`;
    } catch (e) { results.notion = "error " + e.message; }
  } else if (isOptin) {
    results.notion = "skipped (set NOTION_TOKEN + NOTION_DB_ID)";
  }

  return res.status(200).json({ ok: true, results });
}

function fmt(n) { return "$" + Number(n || 0).toLocaleString("en-US"); }

function resultEmail(b) {
  const top = (b.top2 || []).map(
    (t, i) => `<tr><td style="padding:6px 0;color:#9aa6bf">${i + 1}. ${escapeHtml(t.task)}</td>
      <td style="padding:6px 0;text-align:right;color:#FF8A3D;font-weight:700">${fmt(t.annual)}/yr</td></tr>`
  ).join("");
  return `
  <div style="font-family:Inter,Arial,sans-serif;background:#05080F;color:#EEF3FB;padding:28px;border-radius:14px;max-width:520px">
    <h1 style="font-family:'Barlow Condensed',Arial;color:#7DC0F0;font-size:28px;margin:0 0 8px">${escapeHtml(b.name || "Here")}, here's your time leak.</h1>
    <p style="color:#9db0ce;margin:0 0 18px">From your top 2 tasks alone:</p>
    <div style="font-family:'Barlow Condensed',Arial;font-size:44px;font-weight:700;color:#FF8A3D">${fmt(b.leakTotalYr)}<span style="font-size:16px;color:#9db0ce"> / year</span></div>
    <table style="width:100%;margin-top:18px;border-collapse:collapse">${top}</table>
    <p style="color:#9aa6bf;margin-top:18px">You named: <em>“${escapeHtml((b.believedLeak || "").slice(0, 120))}”</em></p>
    <p style="margin-top:18px">That was just two small areas of your week. The full picture — across your whole team, built into systems that run without you — is in the <strong>Efficiency Briefing</strong>.</p>
    <p style="color:#6E7A93;margin-top:24px;font-size:13px;letter-spacing:1px">BE LIMITLESS. BE BOLD.</p>
  </div>`;
}

function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
