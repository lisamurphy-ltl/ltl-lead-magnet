# LtL — Time-Calculator ("Where does your time go?")

The free front-door tool for the Limited to Limitless funnel: a 2-minute
time-leak read + two copy-paste prompts, with capture handled by an embedded
**GoHighLevel form (Form 44)**. Built to the LtL Time-Calculator PRD.

> Naming: this is the **Time-Calculator**. "Lead magnet" is a generic category
> (there will be several tools) — don't use it as the product name.

Live: **https://hoursback.limitedtolimitless.com/time-eaters**

## What it does (the flow)
1. Hook (cold, problem-aware)
2. Name the time-eaters (the 10 Hour-Back tasks)
3. Gut read — "biggest leak & why" (captured *before* any number)
4. Hours per task (/day or /week)
5. Your pay rate (+ optional team)
6. Live money meter — **your waste only** + solo/team teaser
7. **Gate**: first name (for the personalised headline) → **GHL Form 44** (capture)
8. Results + roadmap (top 2 priorities, #1 move, gut-vs-data, $ translations)
9. The 2 prompts (copy-paste only — no auto-run, per spec)
10. Bridge → the $97 Efficiency Briefing

## Files
- `time-eaters/index.html` · `styles.css` · `app.js` — the front end (served at `/time-eaters`)
- `time-eaters/data.js` — **the only file you edit for content** (tasks, prompts, copy, links, the GHL form)
- `api/lead.js` — OPTIONAL secondary capture (only used if you wire it; GHL form is primary)

## Capture (how leads are saved)
Primary capture is the **embedded GHL Form 44** — it writes the contact straight
into GoHighLevel natively, no API key needed. The tool collects the user's first
name (for the dynamic "[Name] — this is your time leak" headline) and pre-fills it
into the form.

**Form 44 setup:** in GHL, set the form's "On submit" action to **show a message**
(not redirect) so the tool can advance to the results screen. The tool also shows
an "I've submitted — show my results →" button as a reliable fallback.

**Optional — flow the leak data into the contact:** add hidden fields to Form 44
with Query Keys `leak_total` and `believed_leak` (and `first_name`). The tool
pre-fills them via the form URL. Change the keys in `data.js` →
`CONFIG.capture.ghlForm.prefillKeys` if your form uses different ones.

## ⚠ Before full launch — drop in the real content
1. **Real Hour-Back Pack numbers + prompts.** The 10 tasks, their `recoverPct`,
   default hours, and prompt text in `data.js` are reasonable PLACEHOLDERS.
   Replace them with the real Hour-Back Pack values. The math/flow work as-is.
2. **The $97 Briefing link.** Set `CONFIG.brand.briefingUrl` in `data.js`.

**Be Limitless. Be Bold.**
