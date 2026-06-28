// POST /api/eb-brain — the bounded "brain". Personalises the build starters for
// the buyer's top 3 tasks via ONE swappable provider (OpenRouter). The client
// sends the task templates in the body, so this function needs no shared data.
// The dollar math stays deterministic in the browser; the model only rewrites
// the project STARTERS. No key set, or any failure → { builds: null } (templates).
export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ builds: null }); return; }
  if (!process.env.OPENROUTER_API_KEY) { res.status(200).json({ builds: null }); return; }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const isTeam = !!(body && body.isTeam);
  const tasks = ((body && body.tasks) || []).filter((t) => t && t.id);
  if (!tasks.length) { res.status(200).json({ builds: null }); return; }
  const knownIds = tasks.map((t) => t.id);

  const model = process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-haiku";
  const taskBrief = tasks.map((t) => ({ id: t.id, label: t.label, hint: t.hint, template: t.template }));

  const sys = [
    "You write setup text for reusable AI 'projects' that a busy professional-services business owner will paste into ChatGPT, Claude, or Gemini.",
    "Audience: a non-technical owner who is the bottleneck in their business and fears delegating. Tone: plain, warm, direct, 4th-grade readable. No hype, no jargon, never the word 'leverage' or 'unlock'.",
    isTeam ? "They have a small team." : "They work mostly solo.",
    "For each task, rewrite the starter into: instructions (what the AI should always do, 2-4 sentences), context (what info the owner should add, one line), sample (what example to include, one line). Keep any [bracketed] fill-in cues.",
    "Return ONLY valid JSON, no prose, in this exact shape:",
    '{ "builds": { "<taskId>": { "starter": { "instructions": "...", "context": "...", "sample": "..." } } } }',
  ].join(" ");
  const user = "Tasks:\n" + JSON.stringify(taskBrief, null, 2);

  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": "Bearer " + process.env.OPENROUTER_API_KEY, "Content-Type": "application/json", "X-Title": "LtL Efficiency Briefing" },
      body: JSON.stringify({ model, temperature: 0.5, max_tokens: 1200, response_format: { type: "json_object" }, messages: [{ role: "system", content: sys }, { role: "user", content: user }] }),
    });
    if (!r.ok) { res.status(200).json({ builds: null }); return; }
    const data = await r.json();
    const txt = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    let parsed = null;
    try { parsed = JSON.parse(txt); } catch (e) { const m = txt && txt.match(/\{[\s\S]*\}/); if (m) { try { parsed = JSON.parse(m[0]); } catch (e2) { parsed = null; } } }
    if (!parsed || !parsed.builds) { res.status(200).json({ builds: null }); return; }
    const clean = {};
    Object.keys(parsed.builds).forEach((id) => {
      const s = parsed.builds[id] && parsed.builds[id].starter;
      if (knownIds.indexOf(id) >= 0 && s && (s.instructions || s.context || s.sample)) {
        clean[id] = { starter: { instructions: String(s.instructions || ""), context: String(s.context || ""), sample: String(s.sample || "") } };
      }
    });
    res.status(200).json({ builds: Object.keys(clean).length ? clean : null });
  } catch (err) {
    res.status(200).json({ builds: null });
  }
}
