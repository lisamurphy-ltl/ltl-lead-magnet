/* =====================================================================
   LtL — Free Lead Magnet — DATA & CONFIG
   ---------------------------------------------------------------------
   Lisa: this is the ONE file to edit for content + capture settings.
   Everything below is plain English. Change text inside the quotes.

   ⚠ PLACEHOLDER CONTENT: the 10 tasks, their recover-% and the prompt
   text are reasonable defaults grounded in the spec, NOT the final
   Hour-Back Pack copy. Replace the `recoverPct`, `hoursDefault` and
   `prompt` fields with the real Hour-Back Pack values when ready.
   The math, flow and capture all work regardless of these numbers.
   ===================================================================== */

const CONFIG = {
  brand: {
    name: "Limited to Limitless",
    signoff: "Be Limitless. Be Bold.",
    briefingUrl: "https://plan-to-profit.limitedtolimitless.com/plan_your_profits", // $97 Briefing / next step
  },

  // ---- LEAD CAPTURE GATEWAY -------------------------------------------
  // The email gate POSTs to /api/lead. That serverless function reads
  // the env vars below (set them in Vercel → Settings → Environment Vars).
  // Nothing here needs to change for capture to work — the server reads
  // its own env. This block only controls front-end behaviour.
  capture: {
    endpoint: "/api/lead",   // serverless function path
    leadTag: "icp-b-lead",   // GHL tag added on opt-in
    ranPromptTag: "ran-prompt", // GHL tag added when a prompt is copied
  },

  // 10× defensibility ceiling (shared with the $97 tool). A single
  // task's recovered time can never be shown above this multiple.
  maxReturnMultiple: 10,

  // ---- COPY: opt-in / intro (PRD §6, cold + problem-aware) -----------
  intro: {
    eyebrow: "A 2-minute check — not a course, not a manual",
    headline: "The work that lands back on your desk every week.",
    headlineAccent: "Let's take it off your plate.",
    subhead:
      "A 2-minute read on where your hours actually leak — plus two prompts you can run today.",
    agitation:
      "You hired people. You still check everything. The same tasks keep circling back to you, and every week they cost you the same hours over again.",
    turn: "There's a way to see exactly where it's going — and start fixing it in the next few minutes.",
    bullets: [
      "A straight read on how ready your operation is to hand work to AI.",
      "The exact tasks quietly eating your week — ranked by what they cost you.",
      "Two prompts that produce a real result today.",
    ],
    cta: "Show me where my hours go →",
  },

  // ---- The 10 Hour-Back tasks (PLACEHOLDER values — see warning above)
  // recoverPct = share of that task's time AI gives back (0–1, never 1.0)
  tasks: [
    {
      id: "inbox",
      label: "Email & inbox triage",
      hint: "Sorting, replying, chasing — still doing it yourself",
      hoursDefault: 5, cadence: "day",
      recoverPct: 0.70,
      promptName: "Inbox Triage Sorter",
      prompt:
`You are my inbox chief of staff. I'll paste a batch of emails below.
For each one, give me: (1) a one-line summary, (2) priority [Now / Today / This week / Delegate / Ignore],
(3) a ready-to-send reply draft in my voice — [describe your tone in 3 words].
Group the output by priority. My role: [your role]. My business: [what you do].
Emails:
[paste your emails here]`,
    },
    {
      id: "meetings",
      label: "Meeting notes & follow-ups",
      hint: "Writing up notes and chasing action items after every call",
      hoursDefault: 4, cadence: "week",
      recoverPct: 0.60,
      promptName: "Meeting Shrinker",
      prompt:
`Turn this raw meeting transcript/notes into: (1) a 5-bullet summary,
(2) a decisions list, (3) an action table [Owner | Task | Due date],
(4) a short follow-up email to attendees in my voice.
Context: meeting was about [topic]; attendees [names/roles].
Notes:
[paste your notes or transcript here]`,
    },
    {
      id: "followups",
      label: "Client & sales follow-ups",
      hint: "Remembering who to chase and writing the nudge",
      hoursDefault: 3, cadence: "week",
      recoverPct: 0.65,
      promptName: "Follow-Up Loop Closer",
      prompt:
`Act as my follow-up assistant. Here is a list of people I owe a follow-up and where we left off.
For each, write a short, warm, specific follow-up message in my voice [tone in 3 words],
plus a suggested send-time. Keep each under 90 words.
List:
[name — last contact — what's outstanding]`,
    },
    {
      id: "proposals",
      label: "Proposals & quotes",
      hint: "Building each one mostly from scratch",
      hoursDefault: 3, cadence: "week",
      recoverPct: 0.55,
      promptName: "Proposal Drafter",
      prompt:
`Draft a proposal for [client] who needs [problem/outcome]. Use this structure:
situation → desired outcome → our approach → scope → timeline → investment options (good/better/best) → next step.
My services: [list]. My pricing logic: [describe]. Keep it confident and plain-spoken.`,
    },
    {
      id: "reporting",
      label: "Client reporting & status updates",
      hint: "Pulling the same updates together every week",
      hoursDefault: 3, cadence: "week",
      recoverPct: 0.60,
      promptName: "Status Report Builder",
      prompt:
`Build a client status update from these raw notes. Output: (1) headline progress in one line,
(2) what we did, (3) what's next, (4) anything we need from them, (5) a confident closing line.
Client: [name]. Reporting period: [dates].
Raw notes:
[paste here]`,
    },
    {
      id: "scheduling",
      label: "Scheduling & calendar wrangling",
      hint: "Back-and-forth to find a time",
      hoursDefault: 2, cadence: "week",
      recoverPct: 0.75,
      promptName: "Calendar Coordinator",
      prompt:
`Write 3 scheduling messages I can send to book [meeting type] with [who]:
one offering specific slots, one for a reschedule, one gentle nudge if no reply.
My availability: [describe]. Tone: [3 words].`,
    },
    {
      id: "invoicing",
      label: "Invoicing & payment chasing",
      hint: "Raising invoices and following up on late ones",
      hoursDefault: 2, cadence: "week",
      recoverPct: 0.60,
      promptName: "Invoice & AR Nudge",
      prompt:
`Write a 3-step payment follow-up sequence (friendly reminder → firm nudge → final notice)
for an invoice to [client] for [amount], [days] overdue. Keep me professional and easy to pay.
Include a one-line subject for each.`,
    },
    {
      id: "content",
      label: "Content & social posts",
      hint: "Writing posts and repurposing what you already said",
      hoursDefault: 3, cadence: "week",
      recoverPct: 0.60,
      promptName: "Content Repurposer",
      prompt:
`Take this one idea and turn it into a week of content: 1 short article, 3 LinkedIn posts,
and 2 short-form video hooks. Keep my voice [3 words]. Audience: [who].
Core idea:
[paste your idea/notes here]`,
    },
    {
      id: "onboarding",
      label: "Hiring & onboarding docs",
      hint: "Writing role docs and onboarding from scratch",
      hoursDefault: 2, cadence: "week",
      recoverPct: 0.50,
      promptName: "Onboarding Doc Builder",
      prompt:
`Draft an onboarding checklist + first-30-days plan for a new [role] in my business [what you do].
Include: tools to set up, who to meet, the first small win, and how I'll know they're on track.`,
    },
    {
      id: "sops",
      label: "SOPs & process documentation",
      hint: "Writing down how things should be done",
      hoursDefault: 3, cadence: "week",
      recoverPct: 0.60,
      promptName: "SOP Writer",
      prompt:
`Turn this messy description of how I do [task] into a clean step-by-step SOP a new hire could follow.
Include: purpose, when to use it, numbered steps, common mistakes, and a quality check.
How I currently do it:
[describe in your own words]`,
    },
  ],

  // ---- $ translations shown on the results screen --------------------
  translations: {
    workWeeksPerYear: 48,      // for "weeks back" framing
    firstHireAnnualCost: 45000, // used for "fund a first hire" framing
  },

  // ---- Teasers: free → paid (PRD §4a) -------------------------------
  teasers: {
    solo: "That was just 2 small areas of your daily work — and look what it's already costing you. The full picture is in the Efficiency Briefing.",
    team: "Want to see the real waste happening right under your fingers — multiplied across your whole team? That's the Efficiency Briefing.",
  },

  bridge: {
    line: "That was one. You're still holding the rest.",
    sub: "You just plugged two leaks. The Efficiency Briefing maps all ten — across your whole team — and builds them into systems that run without you.",
    cta: "See the full picture — the $97 Efficiency Briefing →",
  },
};
