/* =====================================================================
   LtL — $97 EFFICIENCY BRIEFING (the Tripwire) — DATA & CONFIG
   ---------------------------------------------------------------------
   Lisa: this is the ONE file to edit for content + numbers.
   Everything is plain English. Change the text inside the "quotes" and
   the numbers after the colons. Save, re-upload, done.

   This is the COMPLEX (paid) calculator. The free Time-Calculator is the
   simple one. Here every task can be scored, multiplied across a team,
   turned into dollars, ranked, and built into a reusable AI project.

   The 10 tasks + prompts are the REAL Hour-Back Pack (same as the free
   tool). For the paid tool each one also carries:
     - recoverMin / recoverMax : the [floor, ceiling] the AI brain must
       stay inside when it personalises the % of time AI gives back.
       (The clamp does the accuracy — a cheap model is plenty.)
     - benchmark : a real "before → after with AI" anchor for the schedule
       and for the show-your-work line.
     - project   : the starter the tool hands him to BUILD this task into a
       reusable project in his own AI (instructions + context + sample).
   ===================================================================== */

const CONFIG = {
  brand: {
    name: "Limited to Limitless",
    signoff: "Be Limitless. Be Bold.",
    // Where "not ready for $97" buyers go (the free workshop off-ramp):
    offRampUrl: "https://hoursback.limitedtolimitless.com/",
    // The next rung up after the Briefing (soft bridge only — never the high-ticket):
    labUrl: "https://hoursback.limitedtolimitless.com/TimeBriefSolution",
  },

  // ---- PRICE ---------------------------------------------------------
  price: {
    amount: 97,            // dollars
    currencyCode: "usd",
    label: "$97",
    productName: "The Efficiency Briefing",
    // Paste your Stripe Payment Link here (https://buy.stripe.com/...). When set, the
    // "Show me my number" button goes straight to it. Leave "" to use the built-in
    // Stripe Checkout function (/api/eb-checkout). Stripe product: prod_UmxDujUWUDZtrc.
    paymentLinkUrl: "",   // Empty = use /api/eb-checkout (server-created session) so the
                          // ?session_id={CHECKOUT_SESSION_ID} return URL reliably unlocks after paying.
                          // (The Payment Link's redirect wasn't returning session_id → buyers bounced to sales.)
    // TEST MODE: when true the tool is FREE and open so you can work through it
    // end-to-end (payment skipped, nothing saved to leads). Flip to false to go
    // LIVE — the "Show me my number" button then sends buyers to the link above.
    testMode: false,
  },

  // ---- THE MATH (per task → annual $) --------------------------------
  // weeklyHours × recover% × (owner + team heads) × blendedRate × weeksPerYear
  // Owner and team are scored separately then summed. Arithmetic is always
  // shown inline so the skeptic can check it.
  math: {
    weeksPerYear: 52,
    defaultBlendedRate: 35,     // $/hour — ONE firm-wide AVERAGE (his to change)
    // Two recovery paths shown on the dashboard (research-verified, conservative):
    // DIY with prompts ≈ 30% (AI-assist studies land 25–40%); done-with-you systems
    // + automation ≈ 65–70% (process-automation studies land 60–95%).
    diyRecover: 0.30,
    doneRecoverLow: 0.65,
    doneRecoverHigh: 0.70,
    // 10× defensibility ceiling: we never PRESENT a return above this
    // multiple of the $97 price. Keeps the number believable.
    maxReturnMultiple: 10,
    // A task can never recover more hours than are spent on it, and the
    // brain may never return 100%. Hard floor/ceiling on any recover%:
    recoverHardFloor: 0.10,
    recoverHardCeiling: 0.70,
  },

  // ---- THE 10 HOUR-BACK TASKS ---------------------------------------
  // recoverPct  = default share of the task's time AI gives back (0–1)
  // recoverMin/Max = the band the AI brain must stay inside
  // benchmark   = real "before → after with AI" anchor (for schedule + proof)
  tasks: [
    {
      id: "inbox",
      label: "Email & inbox triage",
      hint: "The inbox that never empties — and only you clear it.",
      hoursDefault: 1, cadence: "day",
      recoverPct: 0.45, recoverMin: 0.30, recoverMax: 0.60,
      promptName: "The Inbox Triage Sorter",
      savesNote: "Typically saves 15–30 min per inbox session",
      benchmark: "An inbox that sorts and drafts itself — instead of running through you.",
      defaultCadence: "Daily — first thing",
      prompt:
`Act as my executive operations filter. Review the email or message below and sort it into one of five categories: Reply Now, Reply Later, Delegate, Archive, or Decision Needed. Then draft the next best action in my voice: direct, warm, and clear.

Context about my business: [insert business type, audience, current priority]
My communication style: [insert 3-5 words]
Email/message: [paste message]

Return: category, why, next action, draft reply if needed, and estimated time saved.`,
      project: {
        instructions: "You are my inbox triage partner. Every message I paste, you sort into Reply Now / Reply Later / Delegate / Archive / Decision Needed, then draft the next action in my voice.",
        context: "My business, my audience, my current priority, and my communication style (3–5 words).",
        sample: "A typical email I get and how I'd want it handled.",
      },
    },
    {
      id: "meetings",
      label: "Meetings that run long",
      hint: "Calls that eat the afternoon and end with no decision.",
      hoursDefault: 4, cadence: "week",
      recoverPct: 0.35, recoverMin: 0.25, recoverMax: 0.50,
      promptName: "The Meeting Shrinker",
      savesNote: "Typically saves 30–60 min per meeting",
      benchmark: "Calls that arrive with an agenda and leave with a decision.",
      defaultCadence: "Before each meeting",
      prompt:
`Act as a meeting architect. Turn the meeting details below into a tight agenda designed to reach a decision or produce a clear next action.

Meeting topic: [insert topic]
Attendees: [insert names/roles]
Current problem or decision: [insert issue]
Time available: [insert time limit]

Return: purpose, decision needed, time-blocked agenda, pre-meeting questions, async options, and follow-up template.`,
      project: {
        instructions: "You are my meeting architect. From the details I give you, build a tight, decision-focused agenda and a follow-up template.",
        context: "The kinds of meetings I run and who attends them.",
        sample: "One real meeting topic and the decision it needed to reach.",
      },
    },
    {
      id: "followups",
      label: "Meeting notes & follow-ups",
      hint: "The recap you owe everyone that never gets written.",
      hoursDefault: 3, cadence: "week",
      recoverPct: 0.50, recoverMin: 0.35, recoverMax: 0.65,
      promptName: "The Follow-Up Loop Closer",
      savesNote: "Typically saves 20–45 min per meeting",
      benchmark: "Raw notes become a ready-to-send recap — not another to-do.",
      defaultCadence: "Right after each call",
      prompt:
`Act as my post-meeting follow-up assistant. Based on the notes below, create a concise follow-up that confirms decisions, owners, deadlines, and unresolved questions.

Meeting notes: [paste notes]
People involved: [insert names/roles]
Tone: direct, supportive, clear

Return: decisions made, action items with owners/deadlines, open questions, risks, and a ready-to-send follow-up.`,
      project: {
        instructions: "You are my follow-up loop closer. From raw notes you produce decisions, owners, deadlines, open questions, and a ready-to-send recap.",
        context: "Who's usually in my meetings and the tone I send recaps in.",
        sample: "A set of messy notes from a real meeting.",
      },
    },
    {
      id: "referrals",
      label: "Asking for referrals",
      hint: "The ask you keep meaning to send — and never do.",
      hoursDefault: 1.5, cadence: "week",
      recoverPct: 0.55, recoverMin: 0.40, recoverMax: 0.65,
      promptName: "The Referral Ask Builder",
      savesNote: "Typically saves 45–90 min per referral push",
      benchmark: "A clear, relationship-safe ask you don't have to agonise over.",
      defaultCadence: "Weekly — one ask",
      prompt:
`Act as my referral message strategist. Create a clear, relationship-safe referral ask for the person described below.

My business helps: [insert ideal client and outcome]
Best-fit referral looks like: [insert signs and pain points]
Person I am asking: [insert relationship/context]
Offer or next step: [insert workshop, call, audit, or resource]

Return: direct ask, who-to-look-for line, forwardable intro, softer version, and follow-up if they say yes.`,
      project: {
        instructions: "You are my referral ask builder. You write clear, relationship-safe referral asks plus a forwardable intro and a follow-up.",
        context: "Who my ideal client is and what a best-fit referral looks like.",
        sample: "A person I'd actually ask, and our relationship.",
      },
    },
    {
      id: "leadnurture",
      label: "Following up with warm leads",
      hint: "Warm leads going cold while you're heads-down.",
      hoursDefault: 3, cadence: "week",
      recoverPct: 0.50, recoverMin: 0.35, recoverMax: 0.60,
      promptName: "The Lead Nurture Check-In",
      savesNote: "Typically saves 30–60 min per follow-up block",
      benchmark: "Warm leads nudged forward — without the blank-page stall.",
      defaultCadence: "Twice a week",
      prompt:
`Act as my warm lead nurture assistant. Draft a thoughtful check-in message that reconnects without pressure and moves the conversation toward a useful next step.

Lead context: [how we met, what they needed, previous conversation]
Their likely current problem: [insert best understanding]
My relevant offer/resource: [insert offer, workshop, guide, or call]
Tone: direct, warm, not salesy

Return: short check-in, personal version, resource angle, low-pressure CTA, and versions for email and DM/text.`,
      project: {
        instructions: "You are my warm-lead nurture assistant. You draft no-pressure check-ins that move toward a next step, in email and DM versions.",
        context: "How I usually meet leads and the offers I can point them to.",
        sample: "A real warm lead and where we left off.",
      },
    },
    {
      id: "testimonials",
      label: "Capturing testimonials & proof",
      hint: "Glowing praise that never makes it anywhere useful.",
      hoursDefault: 1, cadence: "week",
      recoverPct: 0.50, recoverMin: 0.35, recoverMax: 0.60,
      promptName: "The Testimonial Extractor",
      savesNote: "Typically saves 30–45 min per testimonial",
      benchmark: "Client praise turned into usable, ready-to-post proof.",
      defaultCadence: "Weekly — as praise comes in",
      prompt:
`Act as my client proof strategist. Review the client feedback below and extract usable testimonial language without exaggerating or changing the meaning.

Client feedback: [paste feedback, notes, or transcript]
My offer/context: [insert offer or service]

Return: 3 testimonial options, short proof line, specific result, claims needing confirmation, and permission-request message.`,
      project: {
        instructions: "You are my client proof strategist. From raw praise you extract honest, usable testimonial lines and a permission-request message.",
        context: "My offer and the kind of results clients get.",
        sample: "A chunk of real client feedback.",
      },
    },
    {
      id: "relationships",
      label: "Managing your network",
      hint: "The people you meant to reach out to — and forgot.",
      hoursDefault: 2, cadence: "week",
      recoverPct: 0.50, recoverMin: 0.35, recoverMax: 0.60,
      promptName: "The Relationship Map Refresher",
      savesNote: "Typically saves 60–120 min per week",
      benchmark: "A ranked list of who to reach out to — no more 'who am I forgetting?'",
      defaultCadence: "Weekly — Monday",
      prompt:
`Act as my relationship asset mapper. Use the contact list or notes below to identify warm relationships, referral partners, dormant leads, and people who should receive value this week.

Current business priority: [insert goal]
Contact notes/list: [paste names and context]

Return: top 5 people to contact, why each matters, best message angle, suggested next step, and one relationship to stop over-investing in right now.`,
      project: {
        instructions: "You are my relationship asset mapper. Each week you tell me the top 5 people to contact and why, from my notes.",
        context: "My current business priority and the kind of contacts I keep.",
        sample: "A slice of my contact notes.",
      },
    },
    {
      id: "sundaybrief",
      label: "Weekly planning",
      hint: "Mondays that start in reaction, not control.",
      hoursDefault: 2, cadence: "week",
      recoverPct: 0.50, recoverMin: 0.35, recoverMax: 0.60,
      promptName: "The Sunday Clarity Brief",
      savesNote: "Typically saves 1–2 hours per week",
      benchmark: "A clear week, planned before it plans you.",
      defaultCadence: "Weekly — Sunday",
      prompt:
`Act as my weekly operating strategist. Build a Sunday Clarity Brief that helps me enter the week with priorities, boundaries, decisions, and recovery space already named.

Top business goal this month: [insert goal]
Known commitments this week: [insert meetings/deadlines]
Current pressure points: [insert fires/bottlenecks]

Return: top 3 priorities, what must not get attention, decisions to pre-make, tasks to remove/shorten/delegate, one recovery boundary, and Monday first move.`,
      project: {
        instructions: "You are my weekly operating strategist. Every Sunday you turn my month goal and this week's commitments into a clear brief.",
        context: "My current month goal and what a normal week looks like.",
        sample: "A real week's commitments and pressure points.",
      },
    },
    {
      id: "decisionfloor",
      label: "Re-planning under pressure",
      hint: "When the week breaks, everything's urgent and nothing's clear.",
      hoursDefault: 2, cadence: "week",
      recoverPct: 0.50, recoverMin: 0.35, recoverMax: 0.60,
      promptName: "The Decision Floor Builder",
      savesNote: "Typically saves 1–3 hours in heavy weeks",
      benchmark: "A calm reset plan when a week goes sideways.",
      defaultCadence: "As needed — when a week goes sideways",
      prompt:
`Act as my decision-floor strategist. Help me define the minimum viable actions that keep my business moving during a demanding week.

Current season or constraint: [insert travel, launch, illness, client surge]
Business non-negotiables: [insert revenue, delivery, sales, leadership, admin]
What usually falls apart first: [insert weak point]

Return: minimum viable week, minimum viable day, three non-negotiables, what can wait, what to communicate, and reset plan.`,
      project: {
        instructions: "You are my decision-floor strategist. When a week gets demanding you define my minimum viable week and day.",
        context: "My business non-negotiables and what usually falls apart first.",
        sample: "A recent week that went sideways.",
      },
    },
    {
      id: "fridaydebrief",
      label: "Weekly review & debrief",
      hint: "Another week gone with no read on what worked.",
      hoursDefault: 1.5, cadence: "week",
      recoverPct: 0.50, recoverMin: 0.35, recoverMax: 0.60,
      promptName: "The Friday Profit Debrief",
      savesNote: "Typically saves 45–90 min per week",
      benchmark: "A structured debrief that turns this week into next week's plan.",
      defaultCadence: "Weekly — Friday",
      prompt:
`Act as my Friday Profit Debrief partner. Review my week and identify what worked, what leaked time, and what needs to change next week.

This week's wins: [insert wins]
This week's friction: [insert delays/interruption]
Revenue or sales movement: [insert booked calls/proposals/cash]
Energy level: [insert honest answer]

Return: what created value, what wasted time, one operational leak, one decision before Monday, one leadership behavior to repeat, and a 5-sentence operating log summary.`,
      project: {
        instructions: "You are my Friday Profit Debrief partner. Each Friday you turn my week into lessons and one decision before Monday.",
        context: "What I count as a win and the friction I tend to hit.",
        sample: "A real week's wins and friction.",
      },
    },
  ],

  // ---- THE AI PLATFORMS (the build walkthrough adapts per platform) --
  // Alphabetical, no preference — any "projects" AI works.
  // Universal guidance shown on every portfolio move (team rollout + threading).
  buildGuide: {
    teamSteps: [
      "Name one owner for this project — the person who keeps its instructions sharp.",
      "Share it: on a Team/Business plan, add your people to the project so everyone runs the same one. Solo plan? Send them the Instructions + Context to rebuild it in minutes.",
      "Make it the standard — this task now always runs through this project, so the output is consistent no matter who does it.",
      "Tune it monthly: paste in one great result and one weak one, and ask the AI to tighten the Instructions.",
    ],
    threadSteps: [
      "Treat the project as home base — it holds the Instructions and Context so you never re-explain.",
      "Start a fresh chat inside the project for each job — one thread per inbox clear-out, per meeting, per week.",
      "Name each thread by date or subject so you can find and reuse it later.",
      "When a thread gets long or wanders, start a new one — your project setup is always right there.",
    ],
  },

  platforms: [
    {
      id: "chatgpt", name: "ChatGPT Projects",
      steps: [
        "Open ChatGPT and click your name → Projects → New project. Name it after the task.",
        "Open the project, click the settings, and paste the Instructions below into 'Instructions'.",
        "Add your Context and Sample as project files or as a first message.",
        "Start a chat inside the project — it now remembers everything you set up.",
      ],
    },
    {
      id: "claude", name: "Claude Projects",
      steps: [
        "Open Claude, click Projects → Create project. Name it after the task.",
        "In the project, paste the Instructions below into the 'Project instructions' / custom instructions box.",
        "Add your Context and Sample to the project knowledge.",
        "Start a chat in the project — it carries your setup every time.",
      ],
    },
    {
      id: "gemini", name: "Gemini Gems",
      steps: [
        "Open Gemini, go to Gems → New Gem. Name it after the task.",
        "Paste the Instructions below into the Gem's instructions.",
        "Add your Context and Sample into the instructions or knowledge.",
        "Save the Gem and chat with it — it stays set up for this one job.",
      ],
    },
  ],

  // ---- COPY: the sales page (value before price) --------------------
  sales: {
    eyebrow: "The Efficiency Briefing · about 5 minutes · interactive",
    headline: "You're making money. The question is how much you're quietly handing back every week.",
    subhead: "Not a course. Not a PDF. A working diagnostic that turns the hours your team loses on repeatable work into a real dollar number — then hands you the three fixes worth building first.",
    problem: "You can't see the leak because it's spread across ten tasks and a few people. No single fire — just a steady bleed. That's exactly why it's survived this long.",
    turn: "The Briefing puts a number on it — by task, by person, in real dollars — and shows its math so you can check every line.",
    whatTitle: "What you walk away with",
    stack: [
      "Your total leak — hours and dollars, scored task by task across your whole team.",
      "Your top 3 fixes, ranked by what they're actually costing you.",
      "Your #1 move — the single highest-value place to start.",
      "A plain-English, step-by-step build for each of the three — turned into a reusable project in your own AI (ChatGPT, Claude, or Gemini).",
      "An editable weekly schedule so the fixes actually get used.",
    ],
    proof: "Jason went from 60+ to 45 hours a week — then doubled his monthly sales by day 90.",
    proofAttribution: "— Jason, insurance agency owner",
    guide: "I've run a business that leaned on me for everything — and rebuilt it to run for me, on autopilot. I'll walk you through doing the same with yours.",
    guideName: "— Lisa Murphy, MBA · Limited to Limitless",
    priceLine: "One flat $97. No subscription. Yours to keep.",
    cta: "Show me my number →",
    offRamp: "Not ready for this yet? Start with the free Reclaim Your Hours workshop →",
  },

  // ---- COPY: the reveal + roadmap -----------------------------------
  reveal: {
    title: "Here's where your hours — and your dollars — are going.",
    meterNote: "This isn't a one-time cost. It's leaking every week you wait — no fake countdown, just the real recurring number.",
    top3Title: "Fix these three first",
    numberOneTitle: "Start here",
    gutTitle: "Your gut said one thing. The numbers said another.",
    restTitle: "Also leaking (lower priority)",
  },

  // ---- LEAD CAPTURE --------------------------------------------------
  // The buyer's email comes from Stripe Checkout. We email the one-page
  // Briefing, BCC admin@limitedtolimitless.com, and push a note + tags to
  // GHL. "Biggest leak + why" is mirrored to a sheet for Lisa's read.
  capture: {
    adminBcc: "admin@limitedtolimitless.com",
    fromEmail: "Lisa Murphy <admin@limitedtolimitless.com>",   // must be a Resend-verified sender
    ghlTags: ["briefing-buyer", "icp-b-buyer"],
  },
};

// Make available to the browser (app.js) and, when bundled, to functions.
if (typeof window !== "undefined") { window.LTL_CONFIG = CONFIG; }
if (typeof module !== "undefined") { module.exports = CONFIG; }
