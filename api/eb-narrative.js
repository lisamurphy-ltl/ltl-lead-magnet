// POST /api/eb-narrative — AI-written, hyper-personalized dashboard narrative via
// OpenRouter, in Lisa's voice, using the owner's real figures. Keyless (no
// OPENROUTER_API_KEY) → { narrative: null } and the browser keeps its rich
// deterministic narrative. Numbers only ever come from the client; the model
// never invents durations.
export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ narrative: null }); return; }
  if (!process.env.OPENROUTER_API_KEY) { res.status(200).json({ narrative: null }); return; }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const s = (body && body.summary) || {};
  if (!s.leakTotal) { res.status(200).json({ narrative: null }); return; }

  const model = process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-haiku";
  const usd = (n) => "$" + Number(n || 0).toLocaleString("en-US");

  const sys = [
    "You are Lisa Murphy, founder of Limited to Limitless, writing a short executive briefing for a professional-services business owner who just ran a time-leak diagnostic.",
    "Voice: direct, warm, grounded, confident; plain language; short sentences. NO hype or clichés; never the words 'leverage', 'unlock', 'game-changer', or 'transform'; no fake urgency.",
    "NEVER invent durations or minutes/hours-per-task — use only the numbers provided. Make it feel written for THEM, using their real figures.",
    "Name the problem, the cost, and where to start — do NOT give step-by-step solutions (those come on a later screen).",
    'Return ONLY valid JSON: {"narrative":["para1","para2","para3"]} — exactly 3 short paragraphs (2–4 sentences each), plain text, no markdown.',
  ].join(" ");

  const user = "Owner's diagnostic:\n" + JSON.stringify({
    annual_leak: usd(s.leakTotal),
    daily_burn: usd(s.daily),
    hours_back_per_year: s.hoursYr,
    blended_rate_per_hour: usd(s.rate),
    has_team: !!s.isTeam,
    biggest_single_leak: s.numberOneMove,
    what_they_guessed_was_worst: s.believedLeak || "(not provided)",
    top_categories: (s.top || []).map((t) => t.label + " — " + usd(t.annual) + "/yr (" + t.pct + "%)"),
  }, null, 2);

  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": "Bearer " + process.env.OPENROUTER_API_KEY, "Content-Type": "application/json", "X-Title": "LtL Efficiency Briefing" },
      body: JSON.stringify({ model, temperature: 0.6, max_tokens: 700, response_format: { type: "json_object" }, messages: [{ role: "system", content: sys }, { role: "user", content: user }] }),
    });
    if (!r.ok) { res.status(200).json({ narrative: null }); return; }
    const data = await r.json();
    const txt = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    let parsed = null;
    try { parsed = JSON.parse(txt); } catch (e) { const m = txt && txt.match(/\{[\s\S]*\}/); if (m) { try { parsed = JSON.parse(m[0]); } catch (e2) { parsed = null; } } }
    const arr = parsed && Array.isArray(parsed.narrative) ? parsed.narrative.filter((x) => typeof x === "string" && x.trim()).slice(0, 4) : null;
    res.status(200).json({ narrative: arr && arr.length ? arr : null });
  } catch (err) {
    res.status(200).json({ narrative: null });
  }
}
