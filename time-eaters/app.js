/* LtL Time-Calculator — app logic (vanilla JS, no build step) */
(function () {
  "use strict";
  const $app = document.getElementById("app");
  const $topbar = document.getElementById("topbar");
  const $progress = document.getElementById("progressFill");
  const $toast = document.getElementById("toast");
  const STORE_KEY = "ltl_timecalc_v1";

  // ---------- state ----------
  const params = new URLSearchParams(location.search);
  const state = loadState() || {
    selected: [],
    other: "",
    believedLeak: "",
    hours: {},          // id -> {value, cadence}
    payRate: "",
    isTeam: false,
    teamAvg: "",
    name: params.get("name") || "",
    email: params.get("email") || "",
    captured: false,
    ranPrompts: [],
  };
  let step = 0;

  // ---------- helpers ----------
  function saveState() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {} }
  function loadState() { try { return JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) { return null; } }
  const money = (n) => "$" + Math.round(n).toLocaleString("en-US");
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function toast(msg) { $toast.textContent = msg; $toast.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(() => $toast.classList.remove("show"), 2200); }
  function weeklyHours(h) { if (!h) return 0; const v = parseFloat(h.value) || 0; return h.cadence === "day" ? v * 5 : v; }

  // ---------- the math ----------
  function computeRows() {
    const rate = parseFloat(state.payRate) || 0;
    const rows = state.selected.map((id) => {
      const t = CONFIG.tasks.find((x) => x.id === id);
      const wk = weeklyHours(state.hours[id]);
      const recoveredWk = wk * t.recoverPct;
      const annual = recoveredWk * rate * 52;
      return { task: t, weeklyHours: wk, recoverPct: t.recoverPct, recoveredWk, rate, annual };
    });
    rows.sort((a, b) => b.annual - a.annual);
    const top2 = rows.slice(0, 2);
    const leakTotalYr = top2.reduce((s, r) => s + r.annual, 0);
    return { rows, top2, leakTotalYr };
  }

  // ---------- navigation ----------
  const STEPS = ["intro", "tasks", "gutread", "hours", "rates", "meter", "gate", "results", "prompts", "bridge"];
  function go(i) { step = Math.max(0, Math.min(STEPS.length - 1, i)); saveState(); render(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function next() { go(step + 1); }
  function back() { go(step - 1); }

  // ---------- render ----------
  function render() {
    const name = STEPS[step];
    $topbar.hidden = name === "intro";
    const pct = step === 0 ? 0 : (step / (STEPS.length - 1)) * 100;
    $progress.style.width = pct + "%";
    ({ intro, tasks, gutread, hours, rates, meter, gate, results, prompts, bridge })[name]();
  }

  function screen(html) { $app.innerHTML = `<section class="screen">${html}</section>`; }

  // Brand hero art ("Where Your Hours Go" — chrome infinity + clock)
  function heroImg() {
    return `<img class="hero-img" src="/time-eaters/assets/where-your-hours-go.png"
      alt="Where your hours go — win hours back. Limited to Limitless." width="1024" height="1024" />`;
  }

  // ===== 0. INTRO / opt-in hook =====
  function intro() {
    const c = CONFIG.intro;
    screen(`
      <header class="lp-head center-head">
        <span class="wordmark">Limited <span class="amp">to</span> Limitless</span>
      </header>
      <h1 class="sr-only">Free Time Calculator — see where your hours go and win them back</h1>
      <section class="hero">
        <div class="hero-halo" aria-hidden="true"></div>
        <span class="eyebrow pill">${esc(c.eyebrow)}</span>
        ${heroImg()}
        <p class="hero-h">${esc(c.headline)} <span class="shimmer">${esc(c.headlineAccent)}</span></p>
        <p class="hero-sub">${esc(c.subhead)}</p>
        <div class="hero-name">
          <input type="text" id="heroName" placeholder="First, what's your first name?" value="${esc(state.name)}" aria-label="Your first name" autocomplete="given-name" />
          <button class="btn" id="goHero" type="button" ${state.name.trim() ? "" : "disabled"}>${esc(c.cta)}</button>
        </div>
        <p class="privacy">🔒 No signup to start · about 2 minutes</p>
        <button class="scroll-cue" id="scrollDown" type="button" aria-label="Read more">▾</button>
      </section>
      <section class="lp">
        <p class="lp-agitate">${esc(c.agitation)}</p>
        <p class="lp-turn">${esc(c.turn)}</p>
        <div class="card lp-card">
          <h2 class="lp-h">${esc(c.whatTitle)}</h2>
          <ul class="bullets">${c.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
        </div>
        <blockquote class="lp-guide">“${esc(c.guide)}”<cite>${esc(c.guideName)}</cite></blockquote>
        <div class="final-cta">
          <button class="btn lg" id="go" type="button" ${state.name.trim() ? "" : "disabled"}>${esc(c.cta)}</button>
          <p class="privacy" id="finalHint">${state.name.trim() ? "🔒 " + esc(c.eyebrow) : "↑ Enter your first name above to start"}</p>
        </div>
      </section>
    `);
    const launch = () => { if (state.name.trim()) next(); };
    const nameEl = document.getElementById("heroName");
    const heroBtn = document.getElementById("goHero");
    const botBtn = document.getElementById("go");
    const hint = document.getElementById("finalHint");
    const sync = () => {
      const ok = !!state.name.trim();
      heroBtn.disabled = !ok; botBtn.disabled = !ok;
      hint.textContent = ok ? "🔒 " + c.eyebrow : "↑ Enter your first name above to start";
    };
    nameEl.oninput = (e) => { state.name = e.target.value; sync(); saveState(); };
    nameEl.onkeydown = (e) => { if (e.key === "Enter") launch(); };
    heroBtn.onclick = launch;
    botBtn.onclick = launch;
    sync();
    document.getElementById("scrollDown").onclick = () =>
      document.querySelector(".lp").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ===== 1. NAME THE TIME-EATERS =====
  function tasks() {
    screen(`
      <div class="step-label">Step 1 of 7</div>
      <h2 class="title">Which of these do <em>you</em> still do?</h2>
      <p class="sub">Tap every one you still handle yourself — even if you only do part of it. Pick as many as you want.</p>
      <div class="stack" id="list">
        ${CONFIG.tasks.map((t) => `
          <button class="choice ${state.selected.includes(t.id) ? "sel" : ""}" data-id="${t.id}">
            <span class="box"></span>
            <span class="c-main"><span class="c-label">${esc(t.label)}</span><span class="c-hint">${esc(t.hint)}</span></span>
          </button>`).join("")}
        <label class="field" style="margin-top:4px">
          <span class="lbl">Something else eating your time? <small>(optional — type it here)</small></span>
          <input type="text" id="other" placeholder="e.g. payroll, bookkeeping…" value="${esc(state.other)}" />
        </label>
      </div>
      <div class="btn-row">
        <button class="btn secondary back" id="back">Back</button>
        <button class="btn" id="nextBtn" ${state.selected.length ? "" : "disabled"}>Continue</button>
      </div>
    `);
    document.querySelectorAll(".choice[data-id]").forEach((el) => {
      el.onclick = () => {
        const id = el.dataset.id;
        const i = state.selected.indexOf(id);
        if (i >= 0) state.selected.splice(i, 1); else state.selected.push(id);
        el.classList.toggle("sel");
        document.getElementById("nextBtn").disabled = state.selected.length === 0;
        saveState();
      };
    });
    document.getElementById("other").oninput = (e) => { state.other = e.target.value; saveState(); };
    document.getElementById("back").onclick = back;
    document.getElementById("nextBtn").onclick = () => { if (state.selected.length) next(); };
  }

  // ===== 2. GUT READ (before any number) =====
  function gutread() {
    screen(`
      <div class="step-label">Step 2 of 7</div>
      <h2 class="title">Before we do the math —</h2>
      <p class="sub">Which one feels like your <strong>biggest</strong> time-suck, and why? Don't overthink it. Go with your gut.</p>
      <label class="field">
        <textarea id="gut" placeholder="e.g. Email — I lose my whole morning to it and it never ends…">${esc(state.believedLeak)}</textarea>
      </label>
      <p class="note">One line is plenty — or skip it. Later, we'll show you whether the numbers agree with your gut.</p>
      <div class="btn-row">
        <button class="btn secondary back" id="back">Back</button>
        <button class="btn" id="next">Continue</button>
      </div>
    `);
    document.getElementById("gut").oninput = (e) => { state.believedLeak = e.target.value; saveState(); };
    document.getElementById("back").onclick = back;
    document.getElementById("next").onclick = next;
  }

  // ===== 3. HOURS PER TASK =====
  function hours() {
    const rows = state.selected.map((id) => {
      const t = CONFIG.tasks.find((x) => x.id === id);
      if (!state.hours[id]) state.hours[id] = { value: t.hoursDefault, cadence: t.cadence };
      const h = state.hours[id];
      return `
        <div class="hours-row">
          <div class="hr-name">${esc(t.label)}<span class="hr-wk" data-wk="${id}"></span></div>
          <div class="hr-controls">
            <input class="hr-hours" type="number" min="0" step="0.5" value="${esc(h.value)}" data-id="${id}" aria-label="hours for ${esc(t.label)}" />
            <select class="hr-cad" data-id="${id}" aria-label="how often for ${esc(t.label)}">
              <option value="day" ${h.cadence === "day" ? "selected" : ""}>hrs per day</option>
              <option value="week" ${h.cadence === "week" ? "selected" : ""}>hrs per week</option>
            </select>
          </div>
        </div>`;
    }).join("");
    screen(`
      <div class="step-label">Step 3 of 7</div>
      <h2 class="title">How long does each one take you?</h2>
      <p class="sub">Best guess is fine — round numbers work. Type the hours, then choose <strong>per day</strong> or <strong>per week</strong> from the dropdown.</p>
      <div class="card" style="margin-top:18px">${rows}</div>
      <p class="note">Example: 1 hour <strong>a day</strong> on email = about 5 hours a week.</p>
      <div class="btn-row">
        <button class="btn secondary back" id="back">Back</button>
        <button class="btn" id="next">Continue</button>
      </div>
    `);
    const updateWk = (id) => {
      const el = document.querySelector(`[data-wk="${id}"]`);
      if (!el) return;
      const wk = weeklyHours(state.hours[id]);
      el.textContent = wk > 0 ? `≈ ${(+wk.toFixed(1))} hrs/week` : "";
    };
    state.selected.forEach(updateWk);
    document.querySelectorAll('.hr-hours').forEach((inp) => {
      inp.oninput = (e) => { state.hours[e.target.dataset.id].value = e.target.value; updateWk(e.target.dataset.id); saveState(); };
    });
    document.querySelectorAll('.hr-cad').forEach((sel) => {
      sel.onchange = (e) => { state.hours[e.target.dataset.id].cadence = e.target.value; updateWk(e.target.dataset.id); saveState(); };
    });
    document.getElementById("back").onclick = back;
    document.getElementById("next").onclick = next;
  }

  // ===== 4. PAY RATES =====
  function rates() {
    screen(`
      <div class="step-label">Step 4 of 7</div>
      <h2 class="title">What's one hour of your time worth?</h2>
      <p class="sub">This turns your hours into dollars. A rough number is perfect.</p>
      <label class="field">
        <span class="lbl">One hour of your time = $<small> per hour</small></span>
        <div class="input-row"><span class="prefix">$</span><input class="grow" type="number" min="0" step="5" id="pay" placeholder="type a number, e.g. 150" value="${esc(state.payRate)}" /></div>
        <div class="chips" id="payChips">
          ${[75,150,250,400].map((v)=>`<button class="chip ${String(state.payRate)===String(v)?"sel":""}" data-pay="${v}">$${v}</button>`).join("")}
        </div>
        <p class="helper">Not sure? Easy way to guess: <strong>what would you pay someone really good to do your job for an hour?</strong> Most owners land between $75 and $400.</p>
      </label>
      <label class="field" style="margin-top:22px">
        <span class="lbl">Do other people help with any of these?</span>
      </label>
      <div class="stack" style="margin-top:8px">
        <button class="choice radio ${state.isTeam ? "" : "sel"}" data-team="0"><span class="box"></span><span class="c-main"><span class="c-label">It's just me right now</span></span></button>
        <button class="choice radio ${state.isTeam ? "sel" : ""}" data-team="1"><span class="box"></span><span class="c-main"><span class="c-label">I have a team</span></span></button>
      </div>
      <div id="teamWrap" style="${state.isTeam ? "" : "display:none"}">
        <label class="field">
          <span class="lbl">What do you pay your team, on average? <small>(per hour — optional)</small></span>
          <div class="input-row"><span class="prefix">$</span><input class="grow" type="number" min="0" step="5" id="teamavg" placeholder="a rough average, e.g. 40" value="${esc(state.teamAvg)}" /></div>
        </label>
      </div>
      <p class="note">This free read shows <strong>just your own</strong> wasted time. What it's costing across your whole team is in the full Efficiency Briefing.</p>
      <div class="btn-row">
        <button class="btn secondary back" id="back">Back</button>
        <button class="btn" id="next" ${state.payRate ? "" : "disabled"}>See my number</button>
      </div>
    `);
    const pay = document.getElementById("pay");
    const syncChips = () => document.querySelectorAll("#payChips .chip").forEach((c) => c.classList.toggle("sel", String(c.dataset.pay) === String(state.payRate)));
    pay.oninput = (e) => { state.payRate = e.target.value; document.getElementById("next").disabled = !state.payRate; syncChips(); saveState(); };
    document.querySelectorAll("#payChips .chip").forEach((c) => {
      c.onclick = () => { state.payRate = c.dataset.pay; pay.value = c.dataset.pay; document.getElementById("next").disabled = false; syncChips(); saveState(); };
    });
    document.querySelectorAll("[data-team]").forEach((b) => {
      b.onclick = () => {
        state.isTeam = b.dataset.team === "1";
        document.querySelectorAll("[data-team]").forEach((x) => x.classList.remove("sel"));
        b.classList.add("sel");
        document.getElementById("teamWrap").style.display = state.isTeam ? "" : "none";
        saveState();
      };
    });
    const ta = document.getElementById("teamavg");
    if (ta) ta.oninput = (e) => { state.teamAvg = e.target.value; saveState(); };
    document.getElementById("back").onclick = back;
    document.getElementById("next").onclick = () => { if (state.payRate) next(); };
  }

  // ===== 5. THE LIVE METER (your waste only) + teaser =====
  function meter() {
    const { top2, leakTotalYr } = computeRows();
    const teaser = state.isTeam ? CONFIG.teasers.team : CONFIG.teasers.solo;
    const one = top2[0];
    screen(`
      <div class="step-label">Step 5 of 7</div>
      <h2 class="title">Here's what those tasks cost you —</h2>
      <p class="sub">Just from the time you could hand to AI. Your waste only.</p>
      <div class="card" style="margin-top:18px">
        <div class="meter">
          <div class="money" id="ticker">$0</div>
          <div class="per">leaking out of your year</div>
        </div>
        ${one ? `<div class="mathline">${esc(one.task.label)}: <b>${one.weeklyHours.toFixed(1)} hrs/wk</b> × <b>${Math.round(one.recoverPct * 100)}%</b> recoverable × <b>${money(one.rate)}</b>/hr × 52 = <b>${money(one.annual)}/yr</b></div>` : ""}
        <div class="tick">Built from your top 2 leaks — the math is shown, nothing hidden.</div>
      </div>
      <div class="teaser">${esc(teaser)}</div>
      <div class="btn-row">
        <button class="btn secondary back" id="back">Back</button>
        <button class="btn" id="next">Unlock my full results →</button>
      </div>
    `);
    countUp(document.getElementById("ticker"), leakTotalYr);
    document.getElementById("back").onclick = back;
    document.getElementById("next").onclick = next;
  }

  function countUp(el, target) {
    const dur = 1100, t0 = performance.now();
    function frame(t) {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = money(target * eased);
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // ===== 6. THE GATE — name (for dynamic headline) → GHL Form 44 capture =====
  function gate() {
    const { leakTotalYr } = computeRows();

    // Phase A — email only (we already have their first name from page 1).
    // Fires our capture (Resend + records) BEFORE the GHL form so the
    // redirect can't skip it.
    if (!state._gateFormShown) {
      const emailOk = (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test((v || "").trim());
      const ready = () => emailOk(state.email);
      const who = state.name.trim() ? esc(state.name.trim()) + " — where" : "Where";
      screen(`
        <div class="step-label">Step 6 of 7</div>
        <h2 class="title">${who} should we send your results?</h2>
        <p class="sub">Your full breakdown, your top 2 priorities, and <strong>2 prompts you can run today</strong> — sent to your inbox and shown on the next screen.</p>
        <div class="card" style="margin-top:18px">
          <div class="badge">${money(leakTotalYr)}/yr identified</div>
          <label class="field"><span class="lbl">Email</span>
            <input type="email" id="email" placeholder="you@company.com" value="${esc(state.email)}" /></label>
          <div class="stack" style="margin-top:18px">
            <button class="btn" id="toForm" ${ready() ? "" : "disabled"}>Continue →</button>
          </div>
          <div class="trust">🔒 We'll never spam you. One-click unsubscribe.</div>
        </div>
        <div class="btn-row"><button class="btn secondary back" id="back">Back</button></div>
      `);
      const emailEl = document.getElementById("email");
      const btn = document.getElementById("toForm");
      const refresh = () => { btn.disabled = !ready(); };
      const proceed = () => {
        if (!ready()) return;
        captureLead();              // → /api/lead (Resend + our records) before the GHL form
        state._gateFormShown = true; saveState(); render();
      };
      emailEl.oninput = (e) => { state.email = e.target.value.trim(); refresh(); saveState(); };
      emailEl.onkeydown = (e) => { if (e.key === "Enter") proceed(); };
      btn.onclick = proceed;
      document.getElementById("back").onclick = back;
      return;
    }

    // Phase B — the GoHighLevel form (native capture into GHL).
    const g = CONFIG.capture.ghlForm;
    const k = g.prefillKeys || {};
    const qs = new URLSearchParams();
    if (k.firstName) qs.set(k.firstName, state.name || "");
    if (k.email && state.email) qs.set(k.email, state.email);
    if (k.leakTotal) qs.set(k.leakTotal, String(Math.round(leakTotalYr)));
    if (k.believedLeak && state.believedLeak) qs.set(k.believedLeak, state.believedLeak.slice(0, 200));
    const src = g.embedUrl + (qs.toString() ? "?" + qs.toString() : "");
    screen(`
      <div class="step-label">Step 6 of 7</div>
      <h2 class="title">${esc(state.name)} — where should we send your results?</h2>
      <p class="sub">Pop in your details below. Your full breakdown + your 2 prompts unlock on the next screen.</p>
      <div class="badge" style="display:inline-block;margin:6px 0 14px">${money(leakTotalYr)}/yr identified</div>
      <div class="ghl-wrap">
        <iframe src="${src}"
          id="inline-${g.formId}"
          data-layout="{'id':'INLINE'}"
          data-form-id="${g.formId}"
          data-height="${g.height}"
          title="Time-Calculator form"
          style="width:100%;height:${g.height}px;border:none;border-radius:12px;background:transparent"></iframe>
      </div>
      <div class="stack" style="margin-top:16px">
        <button class="btn" id="reveal">I've submitted — show my results →</button>
      </div>
      <div class="trust">🔒 We'll never spam you. One-click unsubscribe.</div>
      <div class="btn-row"><button class="btn secondary back" id="back">Back</button></div>
    `);
    loadGhlScript(g.scriptUrl);

    // Best-effort: auto-advance when the GHL form reports a submission.
    if (window.__ltlFormMsg) window.removeEventListener("message", window.__ltlFormMsg);
    window.__ltlFormMsg = (e) => {
      try {
        const s = typeof e.data === "string" ? e.data : JSON.stringify(e.data || "");
        if (/submitt|submission|form.?submit/i.test(s)) advanceFromGate();
      } catch (_) {}
    };
    window.addEventListener("message", window.__ltlFormMsg);

    document.getElementById("reveal").onclick = advanceFromGate;
    document.getElementById("back").onclick = () => { state._gateFormShown = false; saveState(); render(); };
  }

  function loadGhlScript(url) {
    if (document.querySelector('script[data-ltl-ghl]')) return;
    const s = document.createElement("script");
    s.src = url; s.async = true; s.setAttribute("data-ltl-ghl", "1");
    document.body.appendChild(s);
  }

  function advanceFromGate() {
    if (state.captured) { next(); return; }
    state.captured = true; saveState();
    captureLead(); // optional secondary (only does anything if you wire /api/lead)
    next();
  }

  // ---- the lead-capture call (the gateway) ----
  async function captureLead() {
    const { top2, leakTotalYr } = computeRows();
    const payload = {
      source: "time-calculator",
      name: state.name,
      email: state.email,
      believedLeak: state.believedLeak,
      leakTotalYr: Math.round(leakTotalYr),
      isTeam: state.isTeam,
      teamAvgRate: state.teamAvg || null,
      payRate: state.payRate || null,
      numberOneMove: top2[0] ? top2[0].task.label : null,
      top2: top2.map((r) => ({ task: r.task.label, annual: Math.round(r.annual) })),
      tasksSelected: state.selected,
      otherTask: state.other || null,
      tags: [CONFIG.capture.leadTag],
      capturedAt: new Date().toISOString(),
    };
    state.captured = true; saveState();
    try {
      const res = await fetch(CONFIG.capture.endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("bad status " + res.status);
    } catch (e) {
      // Never block the felt win — queue locally so no lead is lost.
      try {
        const q = JSON.parse(localStorage.getItem("ltl_lead_queue") || "[]");
        q.push(payload); localStorage.setItem("ltl_lead_queue", JSON.stringify(q));
      } catch (_) {}
    }
  }

  // ===== 7. RESULTS + ROADMAP =====
  function results() {
    const { top2, leakTotalYr } = computeRows();
    const tr = CONFIG.translations;
    const monthly = leakTotalYr / 12;
    const hoursWk = top2.reduce((s, r) => s + r.recoveredWk, 0);
    const hirePct = Math.round((leakTotalYr / tr.firstHireAnnualCost) * 100);
    const one = top2[0];
    const gutCmp = state.believedLeak
      ? `<p class="gutline">You felt it was: “${esc(state.believedLeak.slice(0, 90))}”. The numbers point to <strong style="color:var(--gold)">${esc(one.task.label)}</strong> as your #1 move.</p>` : "";
    screen(`
      <div class="step-label">Step 7 of 7 — your results</div>
      <h2 class="title">${esc(state.name || "Here")} — this is your time leak.</h2>
      <div class="card" style="margin-top:16px">
        <div class="meter"><div class="money">${money(leakTotalYr)}</div><div class="per">per year, from your top 2 tasks alone</div></div>
        <div class="mathline">That's about <b>${money(monthly)}/month</b> · <b>${hoursWk.toFixed(1)} hours back every week</b>${hirePct > 0 ? ` · enough to fund <b>~${Math.min(hirePct, 100)}%</b> of a first hire` : ""}</div>
      </div>
      <h3 style="margin-top:26px;font-size:20px">Fix these first</h3>
      ${top2.map((r, i) => `
        <div class="priority ${i === 0 ? "one" : ""}">
          <span class="rank">${i + 1}</span>
          <span class="p-main"><strong>${esc(r.task.label)}</strong><br><span class="c-hint" style="color:var(--muted)">${r.weeklyHours.toFixed(1)} hrs/wk · ${Math.round(r.recoverPct * 100)}% recoverable</span></span>
          <span class="p-val">${money(r.annual)}/yr</span>
        </div>`).join("")}
      ${one ? `<div class="teaser"><strong>Start here:</strong> ${esc(one.task.label)} — worth ${money(one.annual)}/yr on its own.</div>` : ""}
      ${gutCmp}
      <div class="btn-row"><button class="btn" id="next">Get my 2 prompts →</button></div>
    `);
    document.getElementById("next").onclick = next;
  }

  // ===== 8. THE 2 PROMPTS (copy-paste) =====
  function prompts() {
    const { top2 } = computeRows();
    screen(`
      <div class="step-label">Your install-today prompts</div>
      <h2 class="title">Two prompts you can run right now.</h2>
      <p class="sub">Mapped to your top 2 leaks. Copy one, paste it into ChatGPT, Claude or Gemini, and fill in the <span style="color:var(--gold)">[brackets]</span>. Edit freely — they're a starting point.</p>
      ${top2.map((r) => `
        <div class="prompt-card">
          <div class="p-head">
            <span class="p-name">${esc(r.task.promptName)}</span>
            <button class="copy-btn" data-id="${r.task.id}">Copy prompt</button>
          </div>
          <div class="c-hint" style="color:var(--muted);margin-bottom:8px">For: ${esc(r.task.label)}${r.task.savesNote ? ` · <span style="color:var(--gold)">${esc(r.task.savesNote)}</span>` : ""}</div>
          <pre data-prompt="${r.task.id}">${esc(r.task.prompt)}</pre>
        </div>`).join("")}
      <div class="stack" style="margin-top:8px">
        <button class="btn" id="dl">📥 Download your full Hour-Back Report (PDF)</button>
      </div>
      <p class="note" style="text-align:center">Your results, your 2 prompts, <strong>and all 10 Hour-Back prompts</strong> — in one branded PDF to keep.</p>
      <div class="btn-row">
        <button class="btn secondary back" id="back">Back</button>
        <button class="btn secondary" id="next">What's next →</button>
      </div>
    `);
    document.getElementById("dl").onclick = (e) => downloadReport(e.currentTarget);
    document.querySelectorAll(".copy-btn").forEach((b) => {
      b.onclick = async () => {
        const id = b.dataset.id;
        const text = CONFIG.tasks.find((t) => t.id === id).prompt;
        try { await navigator.clipboard.writeText(text); }
        catch (e) {
          const pre = document.querySelector(`pre[data-prompt="${id}"]`);
          const range = document.createRange(); range.selectNode(pre);
          const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
          try { document.execCommand("copy"); } catch (_) {} sel.removeAllRanges();
        }
        b.textContent = "Copied ✓"; b.classList.add("done");
        toast("Prompt copied — paste it into your AI");
        if (!state.ranPrompts.includes(id)) { state.ranPrompts.push(id); saveState(); flagRanPrompt(id); }
      };
    });
    document.getElementById("back").onclick = back;
    document.getElementById("next").onclick = next;
  }

  async function downloadReport(btn) {
    const label = btn ? btn.innerHTML : "";
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Building your PDF…'; }
    try {
      await ensurePdfMake();
      const { rows, top2, leakTotalYr } = computeRows();
      window.LtLReport.generate({
        name: state.name,
        leakTotalYr,
        rows: rows.map((r) => ({ label: r.task.label, weeklyHours: r.weeklyHours, recoverPct: r.recoverPct, annual: r.annual })),
        top2: top2.map((r) => ({ label: r.task.label, promptName: r.task.promptName, savesNote: r.task.savesNote, prompt: r.task.prompt, annual: r.annual })),
        numberOneMove: top2[0] ? top2[0].task.label : "",
        believedLeak: state.believedLeak,
        allTasks: CONFIG.tasks.map((t) => ({ promptName: t.promptName, label: t.label, savesNote: t.savesNote, prompt: t.prompt })),
        date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      });
      toast("Your Hour-Back Report is downloading");
    } catch (e) {
      toast("Couldn't build the PDF — please try again");
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = label; }
    }
  }

  function ensurePdfMake() {
    return new Promise((resolve, reject) => {
      if (window.pdfMake && window.pdfMake.vfs) return resolve();
      const add = (src) => new Promise((ok, no) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = no; document.body.appendChild(s); });
      add("https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.10/pdfmake.min.js")
        .then(() => add("https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.10/vfs_fonts.js"))
        .then(resolve).catch(reject);
    });
  }

  function flagRanPrompt(id) {
    try {
      fetch(CONFIG.capture.endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "time-calculator", event: "ran-prompt", email: state.email, promptId: id, tags: [CONFIG.capture.ranPromptTag] }),
        keepalive: true,
      });
    } catch (e) {}
  }

  // ===== 9. THE BRIDGE → $97 Briefing =====
  function bridge() {
    const b = CONFIG.bridge;
    screen(`
      <div class="eyebrow">One leak down</div>
      <h2 class="title">${esc(b.line)}</h2>
      <p class="lede">${esc(b.sub)}</p>
      <div class="stack">
        <button class="btn secondary" id="dl2">📥 Download your Hour-Back Report (PDF)</button>
        <a class="btn" href="${esc(CONFIG.brand.briefingUrl)}" target="_blank" rel="noopener">${esc(b.cta)}</a>
        <button class="btn secondary" id="restart2">Start over</button>
      </div>
      <p class="privacy" style="margin-top:24px">${esc(CONFIG.brand.signoff)}</p>
    `);
    document.getElementById("dl2").onclick = (e) => downloadReport(e.currentTarget);
    document.getElementById("restart2").onclick = restart;
  }

  // ---------- restart ----------
  function restart() {
    localStorage.removeItem(STORE_KEY);
    location.href = location.pathname;
  }
  document.getElementById("restartBtn").onclick = restart;

  // ---------- boot ----------
  // GHL form redirect lands here: ?reveal=1 jumps straight to results
  // (their inputs persist in this browser, so we can rebuild the result).
  if (params.get("reveal") === "1" && state.selected.length) {
    state.captured = true; saveState();
    step = STEPS.indexOf("results");
  } else if (state.selected.length && !state.captured) {
    step = 1; // resume mid-flow
  }
  render();
})();
