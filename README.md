# LtL — Free Lead Magnet ("Where does your time go?")

The free front-door tool for the Limited to Limitless funnel: a 2-minute
time-leak read + two copy-paste prompts, with an email-capture gateway that
feeds GoHighLevel and (optionally) Resend. Built to the **LtL Lead Magnet PRD**.

## What it does (the flow)
1. Hook / opt-in (cold, problem-aware)
2. Name the time-eaters (the 10 Hour-Back tasks)
3. Gut read — "biggest leak & why" (captured *before* any number)
4. Hours per task (/day or /week)
5. Your pay rate (+ optional team)
6. Live money meter — **your waste only** + solo/team teaser
7. **Email gate** → lead capture (the gateway)
8. Results + roadmap (top 2 priorities, #1 move, gut-vs-data, $ translations)
9. The 2 prompts (copy-paste only — no auto-run, per spec)
10. Bridge → the $97 Efficiency Briefing

## Files
- `index.html` · `styles.css` · `app.js` — the front end
- `data.js` — **the only file you edit for content** (tasks, prompts, copy, links)
- `api/lead.js` — the lead-capture serverless function (the gateway)

## ⚠ Before launch — two things to drop in
1. **Real Hour-Back Pack numbers + prompts.** The 10 tasks, their `recoverPct`,
   default hours, and prompt text in `data.js` are reasonable PLACEHOLDERS.
   Replace them with the real Hour-Back Pack values. Everything else works as-is.
2. **The $97 Briefing link.** Set `CONFIG.brand.briefingUrl` in `data.js`.

## Lead capture (the gateway) — environment variables on Vercel
Set these in **Vercel → Project → Settings → Environment Variables**
(none are required for the page to work; capture gets "smarter" as you add them):

| Variable | What it does |
|---|---|
| `GHL_WEBHOOK_URL` | GoHighLevel **Inbound Webhook** URL. No API key needed — leads POST straight in, tagged `icp-b-lead`. |
| `RESEND_API_KEY` | Resend key for the transactional result email. |
| `RESEND_FROM` | e.g. `Limited to Limitless <hello@limitedtolimitless.com>` (verified domain). |
| `ADMIN_BCC` | Defaults to `admin@limitedtolimitless.com` (BCC on result emails → GHL notes). |

With nothing set, every lead is still logged (Vercel → Logs) and queued in the
browser, so no lead is lost while you wire things up.

**Be Limitless. Be Bold.**
