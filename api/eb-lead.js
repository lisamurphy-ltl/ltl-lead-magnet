// POST /api/eb-lead — best-effort capture after the reveal.
//  - Emails the one-page Briefing to the buyer, BCC admin (via Resend).
//  - Mirrors "biggest leak + why" + the result into GoHighLevel.
// Always returns 200 so the tool never breaks if a key is missing.
const LAB_URL = process.env.LAB_URL || "https://hoursback.limitedtolimitless.com/TimeBriefSolution";
const ADMIN_BCC = process.env.ADMIN_BCC || "admin@limitedtolimitless.com";
const FROM = process.env.RESEND_FROM || "Lisa Murphy <lisa@limitedtolimitless.com>";
const GHL_TAGS = ["briefing-buyer", "icp-b-buyer"];

function money(n) { return "$" + Number(n || 0).toLocaleString("en-US"); }
function esc(s) { return String(s == null ? "" : s).replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]); }

function briefingHtml(d) {
  const rows = (d.perTask || []).map((x, i) =>
    '<tr><td style="padding:6px 10px;border-bottom:1px solid #eee">' + (i + 1) + ". " + esc(x.task) +
    '</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;color:#f59e0b;font-weight:600">' + money(x.annual) + "/yr</td></tr>").join("");
  const top3 = (d.top3 || []).map((x) => "<li><b>" + esc(x.task) + "</b> — " + money(x.annual) + "/yr</li>").join("");
  return [
    '<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;color:#0A1020">',
    '<h1 style="font-family:Georgia,serif;color:#0A1020">Your Efficiency Briefing</h1>',
    '<p style="font-size:18px">You\'re leaking <b style="color:#ef4444;font-size:22px">' + money(d.leakTotalYr) + '</b> a year on work AI can take off your plate.</p>',
    "<h3>Fix these three first</h3><ul>" + top3 + "</ul>",
    '<p><b>Start here:</b> ' + esc(d.numberOneMove) + "</p>",
    '<h3>Full picture</h3><table style="width:100%;border-collapse:collapse">' + rows + "</table>",
    d.believedLeak ? '<p style="color:#6F7E98;margin-top:16px"><i>Your gut said: "' + esc(d.believedLeak) + '"</i></p>' : "",
    '<p style="margin-top:24px">When you\'re ready to install all ten with me — live, in one day — that\'s the Live Lab: <a href="' + LAB_URL + '">' + LAB_URL + "</a></p>",
    '<p style="font-family:Georgia,serif;color:#34A8C0;font-size:18px">Be Limitless. Be Bold.</p>',
    "</div>",
  ].join("");
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ ok: false }); return; }
  let d = req.body;
  if (typeof d === "string") { try { d = JSON.parse(d); } catch (e) { d = {}; } }
  d = d || {};

  if (process.env.RESEND_API_KEY && d.email) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": "Bearer " + process.env.RESEND_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM, to: [d.email], bcc: [ADMIN_BCC], subject: "Your Efficiency Briefing — " + money(d.leakTotalYr) + "/yr to recover", html: briefingHtml(d) }),
      });
    } catch (e) { /* non-fatal */ }
  }

  if (process.env.GHL_INBOUND_WEBHOOK_URL) {
    try {
      await fetch(process.env.GHL_INBOUND_WEBHOOK_URL, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "briefing_completed", email: d.email, name: d.name, tags: GHL_TAGS, leak_total_yr: d.leakTotalYr, number_one_move: d.numberOneMove, biggest_leak_belief: d.believedLeak, is_team: d.isTeam, top3: d.top3 }),
      });
    } catch (e) { /* non-fatal */ }
  }

  res.status(200).json({ ok: true });
}
