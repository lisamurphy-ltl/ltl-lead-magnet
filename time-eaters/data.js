/* =====================================================================
   LtL — Time-Calculator (free tool) — DATA & CONFIG
   ---------------------------------------------------------------------
   Lisa: this is the ONE file to edit for content + capture settings.
   Everything below is plain English. Change text inside the quotes.

   The 10 tasks + prompts below are the REAL Hour-Back Pack (copy-paste
   prompts verbatim). `hoursDefault` (typical time spent) and `recoverPct`
   (share AI gives back) are conservative estimates grounded in the pack's
   documented time-saved ranges (shown as `savesNote`). Tune those two
   numbers any time — the math, flow and capture all keep working.
   ===================================================================== */

const CONFIG = {
  brand: {
    name: "Limited to Limitless",
    signoff: "Be Limitless. Be Bold.",
    briefingUrl: "/efficiency-briefing", // $97 Briefing — same origin so the free tool's answers carry forward
  },

  // ---- LEAD CAPTURE -------------------------------------------------
  // PRIMARY capture = the embedded GoHighLevel form (Form 44). It writes
  // the contact straight into GHL natively — no API key needed.
  // The user's first name is collected by the tool (for the dynamic
  // results headline) and pre-filled into the form.
  capture: {
    // The GHL form embed (from plan-2-profit.limitedtolimitless.com).
    ghlForm: {
      embedUrl: "https://plan-2-profit.limitedtolimitless.com/widget/form/41QFur34nXbgSafBsYiH",
      scriptUrl: "https://plan-2-profit.limitedtolimitless.com/js/form_embed.js",
      formId: "41QFur34nXbgSafBsYiH",
      height: 882,
      // Optional: if Form 44 has hidden fields with these "Query Keys",
      // the leak data flows into the contact too. Harmless if absent.
      prefillKeys: { firstName: "first_name", email: "email", leakTotal: "leak_total", believedLeak: "believed_leak" },
    },
    endpoint: "/api/lead",   // optional secondary serverless capture (only used if you wire it)
    leadTag: "icp-b-lead",   // GHL tag for these leads
    ranPromptTag: "ran-prompt", // GHL tag when a prompt is copied
  },

  // 10× defensibility ceiling (shared with the $97 tool). A single
  // task's recovered time can never be shown above this multiple.
  maxReturnMultiple: 10,

  // ---- COPY: opt-in / intro (PRD §6, cold + problem-aware) -----------
  intro: {
    eyebrow: "Free · about 2 minutes · no signup to start",
    ctaShort: "Start free →",
    headline: "The work that lands back on your desk every week.",
    headlineAccent: "Let's take it off your plate.",
    subhead: "A 2-minute check that shows where your hours leak — plus two prompts you can run today. Not a course. Not a manual.",
    agitation: "You hired people. You're still the one checking everything. The same tasks circle back to your desk, and every week they quietly cost you the same hours — and the same money — all over again.",
    turn: "There's a faster way. See exactly where your time is going, and start plugging the biggest leaks in the next few minutes.",
    whatTitle: "Here's what you'll walk away with",
    bullets: [
      "A straight read on how ready your operation is to hand work to AI.",
      "The exact tasks quietly eating your week — ranked by what they cost you.",
      "Two prompts you can run today — real, usable output, not theory.",
    ],
    guide: "I rebuilt my business to run for me — on autopilot — instead of running me.",
    guideName: "— Lisa Murphy, MBA · Limited to Limitless",
    cta: "Show me where my hours go →",
  },

  // ---- The 10 Hour-Back Pack tasks (real prompts) -------------------
  // recoverPct = share of that task's time AI gives back (0–1, never 1.0)
  // savesNote  = the pack's documented time-saved range (for credibility)
  tasks: [
    {
      id: "inbox",
      label: "Email & inbox triage",
      hint: "Sorting, deciding and replying — every single day",
      hoursDefault: 1, cadence: "day",
      recoverPct: 0.45,
      promptName: "The Inbox Triage Sorter",
      savesNote: "Typically saves 15–30 min per inbox session",
      prompt:
`Act as my executive operations filter. Review the email or message below and sort it into one of five categories: Reply Now, Reply Later, Delegate, Archive, or Decision Needed. Then draft the next best action in my voice: direct, warm, and clear.

Context about my business: [insert business type, audience, current priority]
My communication style: [insert 3-5 words]
Email/message: [paste message]

Return: category, why, next action, draft reply if needed, and estimated time saved.`,
    },
    {
      id: "meetings",
      label: "Meetings that run long",
      hint: "Calls that drift because no one came with a decision",
      hoursDefault: 4, cadence: "week",
      recoverPct: 0.35,
      promptName: "The Meeting Shrinker",
      savesNote: "Typically saves 30–60 min per meeting",
      prompt:
`Act as a meeting architect. Turn the meeting details below into a tight agenda designed to reach a decision or produce a clear next action.

Meeting topic: [insert topic]
Attendees: [insert names/roles]
Current problem or decision: [insert issue]
Time available: [insert time limit]

Return: purpose, decision needed, time-blocked agenda, pre-meeting questions, async options, and follow-up template.`,
    },
    {
      id: "followups",
      label: "Meeting notes & follow-ups",
      hint: "Writing up who-owns-what after every call",
      hoursDefault: 3, cadence: "week",
      recoverPct: 0.50,
      promptName: "The Follow-Up Loop Closer",
      savesNote: "Typically saves 20–45 min per meeting",
      prompt:
`Act as my post-meeting follow-up assistant. Based on the notes below, create a concise follow-up that confirms decisions, owners, deadlines, and unresolved questions.

Meeting notes: [paste notes]
People involved: [insert names/roles]
Tone: direct, supportive, clear

Return: decisions made, action items with owners/deadlines, open questions, risks, and a ready-to-send follow-up.`,
    },
    {
      id: "referrals",
      label: "Asking for referrals",
      hint: "Drafting the ask so it actually lands",
      hoursDefault: 1.5, cadence: "week",
      recoverPct: 0.55,
      promptName: "The Referral Ask Builder",
      savesNote: "Typically saves 45–90 min per referral push",
      prompt:
`Act as my referral message strategist. Create a clear, relationship-safe referral ask for the person described below.

My business helps: [insert ideal client and outcome]
Best-fit referral looks like: [insert signs and pain points]
Person I am asking: [insert relationship/context]
Offer or next step: [insert workshop, call, audit, or resource]

Return: direct ask, who-to-look-for line, forwardable intro, softer version, and follow-up if they say yes.`,
    },
    {
      id: "leadnurture",
      label: "Following up with warm leads",
      hint: "Reconnecting before they go cold",
      hoursDefault: 3, cadence: "week",
      recoverPct: 0.50,
      promptName: "The Lead Nurture Check-In",
      savesNote: "Typically saves 30–60 min per follow-up block",
      prompt:
`Act as my warm lead nurture assistant. Draft a thoughtful check-in message that reconnects without pressure and moves the conversation toward a useful next step.

Lead context: [how we met, what they needed, previous conversation]
Their likely current problem: [insert best understanding]
My relevant offer/resource: [insert offer, workshop, guide, or call]
Tone: direct, warm, not salesy

Return: short check-in, personal version, resource angle, low-pressure CTA, and versions for email and DM/text.`,
    },
    {
      id: "testimonials",
      label: "Capturing testimonials & proof",
      hint: "Turning scattered client praise into usable proof",
      hoursDefault: 1, cadence: "week",
      recoverPct: 0.50,
      promptName: "The Testimonial Extractor",
      savesNote: "Typically saves 30–45 min per testimonial",
      prompt:
`Act as my client proof strategist. Review the client feedback below and extract usable testimonial language without exaggerating or changing the meaning.

Client feedback: [paste feedback, notes, or transcript]
My offer/context: [insert offer or service]

Return: 3 testimonial options, short proof line, specific result, claims needing confirmation, and permission-request message.`,
    },
    {
      id: "relationships",
      label: "Managing your network",
      hint: "Remembering who to nurture this week",
      hoursDefault: 2, cadence: "week",
      recoverPct: 0.50,
      promptName: "The Relationship Map Refresher",
      savesNote: "Typically saves 60–120 min per week",
      prompt:
`Act as my relationship asset mapper. Use the contact list or notes below to identify warm relationships, referral partners, dormant leads, and people who should receive value this week.

Current business priority: [insert goal]
Contact notes/list: [paste names and context]

Return: top 5 people to contact, why each matters, best message angle, suggested next step, and one relationship to stop over-investing in right now.`,
    },
    {
      id: "sundaybrief",
      label: "Weekly planning",
      hint: "Setting the week before it sets you",
      hoursDefault: 2, cadence: "week",
      recoverPct: 0.50,
      promptName: "The Sunday Clarity Brief",
      savesNote: "Typically saves 1–2 hours per week",
      prompt:
`Act as my weekly operating strategist. Build a Sunday Clarity Brief that helps me enter the week with priorities, boundaries, decisions, and recovery space already named.

Top business goal this month: [insert goal]
Known commitments this week: [insert meetings/deadlines]
Current pressure points: [insert fires/bottlenecks]

Return: top 3 priorities, what must not get attention, decisions to pre-make, tasks to remove/shorten/delegate, one recovery boundary, and Monday first move.`,
    },
    {
      id: "decisionfloor",
      label: "Re-planning under pressure",
      hint: "Rebuilding the plan when a week goes sideways",
      hoursDefault: 2, cadence: "week",
      recoverPct: 0.50,
      promptName: "The Decision Floor Builder",
      savesNote: "Typically saves 1–3 hours in heavy weeks",
      prompt:
`Act as my decision-floor strategist. Help me define the minimum viable actions that keep my business moving during a demanding week.

Current season or constraint: [insert travel, launch, illness, client surge]
Business non-negotiables: [insert revenue, delivery, sales, leadership, admin]
What usually falls apart first: [insert weak point]

Return: minimum viable week, minimum viable day, three non-negotiables, what can wait, what to communicate, and reset plan.`,
    },
    {
      id: "fridaydebrief",
      label: "Weekly review & debrief",
      hint: "Finding what worked before you repeat the week",
      hoursDefault: 1.5, cadence: "week",
      recoverPct: 0.50,
      promptName: "The Friday Profit Debrief",
      savesNote: "Typically saves 45–90 min per week",
      prompt:
`Act as my Friday Profit Debrief partner. Review my week and identify what worked, what leaked time, and what needs to change next week.

This week's wins: [insert wins]
This week's friction: [insert delays/interruption]
Revenue or sales movement: [insert booked calls/proposals/cash]
Energy level: [insert honest answer]

Return: what created value, what wasted time, one operational leak, one decision before Monday, one leadership behavior to repeat, and a 5-sentence operating log summary.`,
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
    sub: "You just plugged two leaks. The Efficiency Briefing maps all ten — across your whole team — and builds them into systems that run for you, on autopilot.",
    cta: "See the full picture — the $97 Efficiency Briefing →",
  },
};
