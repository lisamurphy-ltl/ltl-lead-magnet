/* =====================================================================
   LtL — $97 Efficiency Briefing — APP / FLOW
   Renders everything from window.LTL_CONFIG (data.js). No build step.
   Flow: sales page → Stripe Checkout → unlock → diagnose → reveal +
   roadmap (math shown) → build the top 3 into AI projects → schedule.
   ===================================================================== */
(function () {
  "use strict";
  var CFG = window.LTL_CONFIG;
  var app = document.getElementById("app");

  /* ---------- tiny helpers ---------- */
  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "class") e.className = attrs[k];
      else if (k === "html") e.innerHTML = attrs[k];
      else if (k.slice(0, 2) === "on" && typeof attrs[k] === "function") e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c != null) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function usd(n) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Math.round(n)); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function fmtHours(n) { return (Math.round(n * 10) / 10).toLocaleString("en-US"); }

  /* ---------- state ---------- */
  var state = {
    unlocked: false,
    email: "",
    name: "",
    contactId: "",
    isTeam: null,
    teamHeads: 2,
    picks: {},          // id -> { ownerHours, teamHours, cadence }
    believedLeak: "",
    rate: CFG.math.defaultBlendedRate,
    results: null,
    platform: CFG.platforms[0].id,
    aiBuilds: null,     // populated by /api/brain when available
  };

  /* ---------- boot ---------- */
  function boot() {
    var y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();
    var sg = document.getElementById("footerSignoff"); if (sg) sg.textContent = CFG.brand.signoff;
    var qs = new URLSearchParams(location.search);
    var sid = qs.get("session_id");
    var adminCode = qs.get("admin");
    if (adminCode) { adminUnlock(adminCode); }                 // owner / admin link
    else if (qs.get("preview") === "1") { previewMaybe(); }    // pre-launch preview only
    else if (sid) { verifyAndUnlock(sid); }                    // paid customer
    else { renderSales(); }
  }

  /* ================= SALES PAGE ================= */
  function renderSales() {
    clear(app); appMode(false);
    var s = CFG.sales;
    var hero = h("section", { class: "section hero" }, [
      h("img", { class: "seo-badge", src: "/Efficiency-Briefing/assets/briefing-badge.png", alt: "The Efficiency Briefing", width: "168", height: "168", style: "display:block;margin:0 auto 8px" }),
      h("p", { class: "eyebrow" }, [s.eyebrow]),
      h("h1", { html: '<span class="chrome">' + s.headline + "</span>" }),
      h("p", { class: "lede" }, [s.subhead]),
    ]);

    var body = h("section", { class: "card" }, [
      h("p", {}, [s.problem]),
      h("p", { html: "<b>" + s.turn + "</b>" }),
      h("h2", { class: "step-title" }, [s.whatTitle]),
      h("ul", { class: "stack" }, s.stack.map(function (x) { return h("li", {}, [x]); })),
      h("div", { class: "grid-2", style: "margin-top:20px" }, [
        h("blockquote", { class: "proof" }, [s.proof, h("cite", {}, [s.proofAttribution])]),
        h("p", { class: "guide-line", html: "<b>" + s.guide + "</b><br>" + s.guideName }),
      ]),
      h("div", { class: "btn-row" }, [
        h("button", { class: "btn", id: "buyBtn", onclick: startCheckout }, [s.cta]),
      ]),
      h("p", { class: "price-line" }, [s.priceLine]),
      h("div", { class: "offramp" }, [h("a", { href: CFG.brand.offRampUrl }, [s.offRamp])]),
    ]);

    app.appendChild(hero);
    app.appendChild(body);
  }

  function startCheckout() {
    var link = CFG.price && CFG.price.paymentLinkUrl;
    if (link) { location.href = link; return; }   // Stripe Payment Link, if configured
    var btn = document.getElementById("buyBtn");
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Opening secure checkout…'; }
    fetch("/api/eb-checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.url) { location.href = d.url; }
        else { throw new Error(d && d.error ? d.error : "No checkout URL"); }
      })
      .catch(function (err) {
        if (btn) { btn.disabled = false; btn.textContent = CFG.sales.cta; }
        flash("Couldn't open checkout: " + err.message + ". (Is Stripe connected yet?)");
      });
  }

  /* ================= UNLOCK ================= */
  function verifyAndUnlock(sid) {
    clear(app); appMode(false);
    app.appendChild(h("p", { class: "notice" }, [h("span", { class: "spinner" }), " Confirming your purchase…"]));
    fetch("/api/eb-verify?session_id=" + encodeURIComponent(sid))
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.paid) {
          state.unlocked = true;
          state.email = d.email || "";
          state.name = d.name || "";
          state.contactId = d.contactId || "";
          history.replaceState({}, "", location.pathname); // drop session_id from URL
          startFlow();
        } else { renderUnverified(); }
      })
      .catch(function () { renderUnverified(); });
  }
  function renderUnverified() {
    clear(app); appMode(false);
    app.appendChild(h("section", { class: "card notice" }, [
      h("h2", {}, ["We couldn't confirm that purchase."]),
      h("p", { class: "error" }, ["If you were charged, email admin@limitedtolimitless.com and we'll sort it fast."]),
      h("div", { class: "btn-row" }, [h("button", { class: "btn btn--ghost", onclick: renderSales }, ["Back to the Briefing"])]),
    ]));
  }

  /* ================= OWNER / ADMIN ACCESS ================= */
  function adminUnlock(code) {
    clear(app); appMode(false);
    app.appendChild(h("p", { class: "notice" }, [h("span", { class: "spinner" }), " Checking owner access…"]));
    fetch("/api/eb-admin?code=" + encodeURIComponent(code))
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.ok) { state.unlocked = true; state.admin = true; state.preview = true; try { history.replaceState({}, "", location.pathname); } catch (e) {} ownerBanner(); startFlow(); }
        else { renderSales(); flash("That owner code didn't match."); }
      })
      .catch(function () { renderSales(); flash("Couldn't verify owner access."); });
  }
  function previewMaybe() {
    // Payment is live once a Stripe link is wired → close the public ?preview bypass.
    // (Owner/testing: use promo code OWNERTEST at checkout for a free $0 unlock.)
    if (CFG.price && CFG.price.paymentLinkUrl) { renderSales(); flash("Payment is live — buy, or use code OWNERTEST at checkout, to unlock."); return; }
    fetch("/api/eb-admin").then(function (r) { return r.ok ? r.json() : { paymentConfigured: false }; })
      .then(function (d) {
        if (d && d.paymentConfigured) { renderSales(); flash("Preview is off now that payment is live — use your owner link."); }
        else { state.unlocked = true; state.preview = true; previewBanner(); startFlow(); }
      })
      .catch(function () { state.unlocked = true; state.preview = true; previewBanner(); startFlow(); });
  }
  function ownerBanner() {
    var b = h("div", { style: "position:fixed;top:0;left:0;right:0;z-index:60;text-align:center;background:#f59e0b;color:#0f1216;font:700 12px/1.5 Inter,sans-serif;padding:6px;letter-spacing:.04em" }, ["OWNER ACCESS — full tool, no charge, nothing saved to leads."]);
    document.body.appendChild(b); document.body.style.paddingTop = "28px";
  }

  /* ================= CARRY-FORWARD (from the free Time-Calculator, same origin) ================= */
  function readHandoff() {
    try { var raw = localStorage.getItem("ltl_timecalc_v1"); if (!raw) return null; var d = JSON.parse(raw); return (d && d.selected && d.selected.length) ? d : null; } catch (e) { return null; }
  }
  function applyHandoff(d) {
    if (d.name) state.name = state.name || d.name;
    if (d.email) state.email = state.email || d.email;
    state.isTeam = !!d.isTeam;
    if (d.believedLeak) state.believedLeak = d.believedLeak;
    var r = parseFloat(d.payRate); if (r > 0) state.rate = r;
    (d.selected || []).forEach(function (id) {
      var t = byId(id); if (!t) return;
      var hh = d.hours && d.hours[id];
      state.picks[id] = {
        ownerHours: hh && hh.value != null && hh.value !== "" ? Math.max(0, parseFloat(hh.value) || t.hoursDefault) : t.hoursDefault,
        cadence: hh && hh.cadence ? hh.cadence : t.cadence,
        heads: d.isTeam ? 2 : 1,
      };
    });
    state.fromFree = true;
  }
  function startFlow() {
    var hs = readHandoff();
    if (hs) { applyHandoff(hs); renderDeeper(); }   // came from the free tool → skip to the deeper questions
    else { renderBranch(); }                          // direct visitor → full guided intake
  }

  /* ---- deeper intake (carried from the free tool): confirm all 10 + people per task ---- */
  function renderDeeper() {
    var first = state.name ? (", " + String(state.name).split(" ")[0]) : "";
    var rows = CFG.tasks.map(function (t) {
      var on = !!state.picks[t.id];
      var p = state.picks[t.id] || { ownerHours: t.hoursDefault, cadence: t.cadence, heads: state.isTeam ? 2 : 1 };
      var chk = h("input", { type: "checkbox", checked: on ? "checked" : null, "aria-label": t.label });
      var hoursInput = h("input", { type: "number", min: "0", step: "0.5", value: p.ownerHours, style: "max-width:80px" });
      var cad = h("div", { class: "toggle-cadence" }, [mkCadBtn(p, "day", "/day"), mkCadBtn(p, "week", "/week")]);
      var headsInput = h("input", { type: "number", min: "1", step: "1", value: p.heads, style: "max-width:64px", title: "people who do this" });
      hoursInput.addEventListener("input", function (e) { p.ownerHours = Math.max(0, parseFloat(e.target.value || "0")); });
      headsInput.addEventListener("input", function (e) { p.heads = Math.max(1, parseInt(e.target.value || "1", 10)); });
      var detail = h("div", { style: "display:" + (on ? "flex" : "none") + ";flex-wrap:wrap;gap:10px 16px;align-items:center;margin-top:10px;padding-left:29px" }, [
        h("div", { class: "hours-controls" }, [hoursInput, cad]),
        h("div", { class: "hours-controls" }, ["×", headsInput, h("span", { class: "h-sub" }, ["people do this"])]),
      ]);
      var row = h("div", { class: "task-pick" + (on ? " is-on" : ""), style: "display:block" }, []);
      var head = h("label", { style: "display:flex;align-items:flex-start;gap:11px;cursor:pointer" }, [chk, h("span", {}, [h("span", { class: "t-label" }, [t.label]), h("br"), h("span", { class: "t-hint" }, [t.benchmark])])]);
      chk.addEventListener("change", function (e) {
        if (e.target.checked) { state.picks[t.id] = p; detail.style.display = "flex"; row.classList.add("is-on"); }
        else { delete state.picks[t.id]; detail.style.display = "none"; row.classList.remove("is-on"); }
      });
      row.appendChild(head); row.appendChild(detail);
      return row;
    });
    shell("hours",
      h("div", {}, [
        h("h2", { class: "step-title" }, ["Welcome back" + first + " — let's complete the picture."]),
        h("p", { class: "step-help" }, ["We carried over everything you told the free tool. Now confirm every task that lands on your operation — and how many people touch each one. That's what fills your full dashboard."]),
      ]),
      [
        h("div", { class: "tasklist" }, rows),
        h("div", { class: "btn-row" }, [h("button", { class: "btn", onclick: function () {
          if (!Object.keys(state.picks).length) { flash("Keep at least one task to see your dashboard."); return; }
          computeAndReveal();
        } }, ["Build my dashboard →"])]),
      ]
    );
  }

  /* ================= STEP CHROME ================= */
  var STEPS = ["branch", "tasks", "gut", "hours", "rate", "reveal"];
  function progress(active) {
    var i = STEPS.indexOf(active);
    return h("div", { class: "progress" }, STEPS.map(function (_, idx) {
      return h("span", { class: idx < i ? "done" : idx === i ? "active" : "" });
    }));
  }
  function shell(activeStep, titleEl, kids) {
    clear(app); appMode(false);
    var sec = h("section", { class: "section" }, [progress(activeStep), h("div", { class: "card" }, [titleEl].concat(kids))]);
    app.appendChild(sec);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---- 1. solo / team branch ---- */
  function renderBranch() {
    shell("branch",
      h("div", {}, [h("h2", { class: "step-title" }, ["First — is it just you, or a team?"]), h("p", { class: "step-help" }, ["This decides whether we multiply the leak across people."])],
      ),
      [
        h("div", { class: "btn-row" }, [
          h("button", { class: "btn", onclick: function () { state.isTeam = false; renderTasks(); } }, ["It's mostly me"]),
          h("button", { class: "btn", onclick: function () { state.isTeam = true; renderTasks(); } }, ["I have a team"]),
        ]),
        h("p", { class: "step-help", style: "text-align:center;margin-top:18px" }, ["Solo is fine — we'll lean on what these hours cost you, and what your first hire would cost."]),
      ]
    );
  }

  /* ---- 2. name the time-eaters ---- */
  function renderTasks() {
    var list = h("div", { class: "tasklist" }, CFG.tasks.map(function (t) {
      var on = !!state.picks[t.id];
      var row = h("label", { class: "task-pick" + (on ? " is-on" : ""), "data-id": t.id }, [
        h("input", { type: "checkbox", checked: on ? "checked" : null }),
        h("span", {}, [h("span", { class: "t-label" }, [t.label]), h("br"), h("span", { class: "t-hint" }, [t.hint])]),
      ]);
      row.querySelector("input").addEventListener("change", function (e) {
        if (e.target.checked) { state.picks[t.id] = state.picks[t.id] || { ownerHours: t.hoursDefault, cadence: t.cadence, heads: state.isTeam ? 2 : 1 }; row.classList.add("is-on"); }
        else { delete state.picks[t.id]; row.classList.remove("is-on"); }
      });
      return row;
    }));
    shell("tasks",
      h("div", {}, [h("h2", { class: "step-title" }, ["Which of these eat your week?"]), h("p", { class: "step-help" }, ["Pick every one that lands on your plate. These are the ten AI can take off it."])],
      ),
      [list, h("div", { class: "btn-row" }, [
        h("button", { class: "btn btn--ghost", onclick: renderBranch }, ["Back"]),
        h("button", { class: "btn", onclick: function () {
          if (!Object.keys(state.picks).length) { flash("Pick at least one task to see your number."); return; }
          renderGut();
        } }, ["Next →"]),
      ])]
    );
  }

  /* ---- 3. gut read (before any number) ---- */
  function renderGut() {
    var ta;
    shell("gut",
      h("div", {}, [h("h2", { class: "step-title" }, ["Before the numbers — your gut."]), h("p", { class: "step-help" }, ["Where do you think your biggest leak is, and why? One or two lines."])],
      ),
      [
        (function () { ta = h("textarea", { rows: "3", placeholder: "e.g. Probably the inbox — it never ends and I won't let anyone else touch it." }, []); ta.value = state.believedLeak; return ta; })(),
        h("div", { class: "btn-row" }, [
          h("button", { class: "btn btn--ghost", onclick: renderTasks }, ["Back"]),
          h("button", { class: "btn", onclick: function () { state.believedLeak = ta.value.trim(); renderHours(); } }, ["Next →"]),
        ]),
      ]
    );
  }

  /* ---- 4. hours per task ---- */
  function renderHours() {
    var ids = Object.keys(state.picks);
    var teamHeadsField = null;
    if (state.isTeam) {
      teamHeadsField = h("div", { class: "field" }, [
        h("label", {}, ["How many teammates also do these tasks? ", h("span", { class: "sub" }, ["(roughly)"])]),
        h("input", { type: "number", min: "1", step: "1", value: state.teamHeads, oninput: function (e) { state.teamHeads = Math.max(1, parseInt(e.target.value || "1", 10)); } }),
      ]);
    }
    var rows = ids.map(function (id) {
      var t = byId(id), p = state.picks[id];
      var ownerInput = h("input", { type: "number", min: "0", step: "0.5", value: p.ownerHours, "aria-label": "hours" });
      ownerInput.addEventListener("input", function (e) { p.ownerHours = Math.max(0, parseFloat(e.target.value || "0")); });
      var cad = h("div", { class: "toggle-cadence" }, [mkCadBtn(p, "day", "/day"), mkCadBtn(p, "week", "/week")]);
      return h("div", { class: "hours-row" }, [
        h("div", {}, [h("div", { class: "h-name" }, [t.label]), h("div", { class: "h-sub" }, [t.benchmark])]),
        h("div", { class: "hours-controls" }, [ownerInput, cad]),
      ]);
    });
    var kids = [];
    if (teamHeadsField) kids.push(teamHeadsField);
    kids.push(h("div", {}, rows));
    kids.push(h("div", { class: "btn-row" }, [
      h("button", { class: "btn btn--ghost", onclick: renderGut }, ["Back"]),
      h("button", { class: "btn", onclick: renderRate }, ["Next →"]),
    ]));
    shell("hours",
      h("div", {}, [h("h2", { class: "step-title" }, ["How many hours — honestly?"]), h("p", { class: "step-help" }, ["Per day or per week, your call. Round numbers are fine; the benchmark under each is your sanity check."])],
      ),
      kids
    );
  }
  function mkCadBtn(p, val, txt) {
    var b = h("button", { class: p.cadence === val ? "on" : "", onclick: function () { p.cadence = val; b.parentNode.querySelectorAll("button").forEach(function (x) { x.classList.remove("on"); }); b.classList.add("on"); } }, [txt]);
    return b;
  }
  function labelWrap(label, ctrl) { return h("div", { style: "display:grid;gap:4px;justify-items:end" }, [h("span", { class: "h-sub" }, [label]), ctrl]); }

  /* ---- 5. rate (salary → $) ---- */
  function renderRate() {
    var rateInput = h("input", { type: "number", min: "1", step: "1", value: state.rate });
    rateInput.addEventListener("input", function (e) { state.rate = Math.max(1, parseFloat(e.target.value || "1")); });
    var salaryInput = h("input", { type: "number", min: "0", step: "1000", placeholder: "e.g. 55000" });
    salaryInput.addEventListener("input", function (e) {
      var sal = parseFloat(e.target.value || "0");
      if (sal > 0) { state.rate = Math.round((sal / (52 * 40)) * 100) / 100; rateInput.value = state.rate; }
    });
    shell("rate",
      h("div", {}, [h("h2", { class: "step-title" }, ["Last thing — what's an hour of this work worth?"]), h("p", { class: "step-help" }, ["One firm-wide average is enough. Use a blended hourly rate, or let us work it out from a salary."])],
      ),
      [
        h("div", { class: "field" }, [h("label", {}, ["Average blended rate ", h("span", { class: "sub" }, ["($ per hour of this work)"])]), h("div", { class: "inline" }, ["$", rateInput, h("span", { class: "h-sub" }, ["/ hour"])])]),
        h("div", { class: "field" }, [h("label", {}, ["Don't know the rate? Enter an average annual salary ", h("span", { class: "sub" }, ["(we'll convert it)"])]), h("div", { class: "inline" }, ["$", salaryInput, h("span", { class: "h-sub" }, ["/ year"])])]),
        h("div", { class: "btn-row" }, [
          h("button", { class: "btn btn--ghost", onclick: renderHours }, ["Back"]),
          h("button", { class: "btn", onclick: computeAndReveal }, ["Show me my number →"]),
        ]),
      ]
    );
  }

  /* ================= COMPUTE ================= */
  function weeklyHours(hrs, cadence) { return cadence === "day" ? hrs * 5 : hrs; }

  function compute() {
    var weeks = CFG.math.weeksPerYear, rate = state.rate;
    var per = Object.keys(state.picks).map(function (id) {
      var t = byId(id), p = state.picks[id];
      var ownerWk = weeklyHours(p.ownerHours, p.cadence);
      var heads = Math.max(1, parseInt(p.heads, 10) || 1);   // people doing this task (incl. owner)
      var pct = clamp(t.recoverPct, CFG.math.recoverHardFloor, CFG.math.recoverHardCeiling);
      var spentWk = ownerWk * heads;
      var recWk = Math.min(spentWk, spentWk * pct);
      var annual = recWk * rate * weeks;
      return {
        id: id, label: t.label, hint: t.hint, benchmark: t.benchmark, short: t.label.split(/\s|&|\//)[0],
        pct: pct, ownerWk: ownerWk, heads: heads, spentWk: spentWk, recWk: recWk, recYr: recWk * weeks, annual: annual,
        math: fmtHours(ownerWk) + " hrs × " + heads + (heads === 1 ? " person" : " ppl") + " × " + Math.round(pct * 100) + "% × " + usd(rate) + "/hr × " + weeks + " wks",
      };
    });
    per.sort(function (a, b) { return b.annual - a.annual; });
    var totalAnnual = per.reduce(function (s, x) { return s + x.annual; }, 0);
    var totalRecWk = per.reduce(function (s, x) { return s + x.recWk; }, 0);
    per.forEach(function (x) { x.pctOfTotal = totalAnnual ? (x.annual / totalAnnual * 100) : 0; });
    var one = per[0];
    var believedMatchesOne = false;
    if (state.believedLeak && one) {
      var lc = state.believedLeak.toLowerCase();
      believedMatchesOne = one.label.toLowerCase().split(/\W+/).some(function (w) { return w.length > 3 && lc.indexOf(w) >= 0; });
    }
    return { per: per, totalAnnual: totalAnnual, totalRecWk: totalRecWk, totalRecYr: totalRecWk * weeks, one: one, believedMatchesOne: believedMatchesOne };
  }

  function normalizePicksToWeekly() {
    // convert every pick to weekly hours so the dashboard sliders are 1:1
    Object.keys(state.picks).forEach(function (id) {
      var p = state.picks[id];
      p.ownerHours = Math.round(weeklyHours(p.ownerHours, p.cadence) * 2) / 2;
      p.cadence = "week";
      if (!p.heads) p.heads = 1;
    });
  }

  function computeAndReveal() {
    normalizePicksToWeekly();
    state.results = compute();
    renderReveal();
    mirrorCapture();         // send results + "biggest leak + why" to Lisa (fire-and-forget)
    fetchBuilds();           // ask the AI brain to personalise the build starters (optional)
  }

  /* ================= REVEAL + ROADMAP ================= */
  function heat(i) { return ["#ef4444", "#f59e0b", "#fbbf24", "#fb7185", "#f97316", "#8b95a7"][Math.min(i, 5)]; }
  function escText(s) { return String(s == null ? "" : s).replace(/[<>&"]/g, function (c) { return ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]; }); }
  function usdK(n) { n = Math.round(n); var a = Math.abs(n); if (a >= 1000) { var k = n / 1000; var d = a < 10000 ? 1 : 0; return "$" + (Math.round(k * Math.pow(10, d)) / Math.pow(10, d)) + "K"; } return "$" + n.toLocaleString("en-US"); }
  function animateTo(el, to, fmt) {
    var from = (el._cur == null ? to : el._cur); el._cur = to;
    if (Math.abs(to - from) < 1) { el.textContent = fmt(to); return; }
    var start = null, dur = 850;
    function step(ts) { if (!start) start = ts; var p = Math.min((ts - start) / dur, 1); var e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(from + (to - from) * e); if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(to); }
    requestAnimationFrame(step);
  }
  function appMode(on) { document.body.classList.toggle("dash-mode", !!on); }
  function ctrlInput(label, min, max, step, val, fmt, desc, onChange) {
    var valEl = h("span", { class: "ctrl-val" }, [fmt(val)]);
    var r = h("input", { type: "range", min: min, max: max, step: step, value: val });
    r.addEventListener("input", function (e) { var v = parseFloat(e.target.value); valEl.textContent = fmt(v); onChange(v); });
    var kids = [h("div", { class: "ctrl-top" }, [h("span", { class: "ctrl-label" }, [label]), valEl]), r];
    if (desc) kids.push(h("div", { class: "ctrl-desc" }, [desc]));
    return h("div", { class: "ctrl" }, kids);
  }
  function teamBadge(heads) {
    var op = Math.round(1 / (1 + heads) * 100);
    return h("div", { class: "badge" }, [
      h("div", { class: "badge-bar" }, [h("i", { style: "width:" + op + "%" }, []), h("i", {}, [])]),
      h("div", { class: "badge-legend", html: '<b class="a">1</b> you · <b class="r">' + heads + "</b> team" }),
    ]);
  }
  function buildBars(per) {
    var items = per.slice(0, 6), W = 320, H = 200, L = 8, R = 8, T = 24, B = 30, cw = W - L - R, ch = H - T - B;
    var max = items.length ? items[0].annual : 1, n = items.length, slot = cw / Math.max(1, n), bw = Math.min(46, slot * 0.6);
    var grid = "";
    for (var g = 1; g <= 3; g++) { var gy = T + ch * (g / 3); grid += '<line class="grid-line" x1="' + L + '" y1="' + gy.toFixed(1) + '" x2="' + (W - R) + '" y2="' + gy.toFixed(1) + '"/>'; }
    var bars = items.map(function (x, i) {
      var bh = max ? (x.annual / max) * ch : 0, cx = L + slot * i + slot / 2, y = T + (ch - bh), col = heat(i);
      return '<rect x="' + (cx - bw / 2).toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(1, bh).toFixed(1) + '" rx="3" fill="' + col + '"/>' +
        '<text class="ax" x="' + cx.toFixed(1) + '" y="' + (y - 6).toFixed(1) + '" text-anchor="middle" fill="' + col + '" style="font-weight:700">' + usdK(x.annual) + '</text>' +
        '<text class="ax" x="' + cx.toFixed(1) + '" y="' + (H - 12) + '" text-anchor="middle">' + escText(x.short) + '</text>';
    }).join("");
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">' + grid + bars + "</svg>";
  }
  function buildArea(total) {
    var W = 320, H = 200, L = 42, R = 10, T = 12, B = 26, cw = W - L - R, ch = H - T - B, pts = [];
    for (var m = 0; m <= 12; m++) { pts.push([L + (m / 12) * cw, T + ch - (m / 12) * ch]); }
    var line = "M" + pts.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" L");
    var area = line + " L" + (L + cw) + "," + (T + ch) + " L" + L + "," + (T + ch) + " Z", grid = "";
    for (var g = 0; g <= 2; g++) { var gy = T + ch * (g / 2); grid += '<line class="grid-line" x1="' + L + '" y1="' + gy.toFixed(1) + '" x2="' + (W - R) + '" y2="' + gy.toFixed(1) + '"/>'; }
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><linearGradient id="leakGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ef4444" stop-opacity="0.4"/><stop offset="1" stop-color="#ef4444" stop-opacity="0.04"/></linearGradient></defs>' + grid +
      '<path d="' + area + '" fill="url(#leakGrad)"/><path d="' + line + '" fill="none" stroke="#ef4444" stroke-width="2.5"/>' +
      '<text class="ax" x="' + (L - 5) + '" y="' + (T + 4) + '" text-anchor="end">' + usdK(total) + '</text>' +
      '<text class="ax" x="' + (L - 5) + '" y="' + (T + ch + 2) + '" text-anchor="end">$0</text>' +
      '<text class="ax" x="' + L + '" y="' + (H - 8) + '">now</text>' +
      '<text class="ax" x="' + (L + cw) + '" y="' + (H - 8) + '" text-anchor="end">12 mo</text></svg>';
  }

  function renderReveal() {
    clear(app); appMode(true);
    var ui = {}; state.tab = state.tab || "breakdown";

    /* ---------- SIDEBAR ---------- */
    var sbBody = h("div", { class: "sb-body" }, []);
    var setup = h("div", { class: "sb-sec" }, [h("h3", { class: "sec-head" }, ["Your Setup"])]);
    setup.appendChild(ctrlInput("Blended rate", 15, 150, 1, state.rate, function (v) { return "$" + v + "/hr"; },
      "What an hour of this work costs you, on average.", function (v) { state.rate = v; update(); }));
    sbBody.appendChild(setup);
    var hsec = h("div", { class: "sb-sec" }, [h("h3", { class: "sec-head" }, ["Hours & People Per Task"])]);
    Object.keys(state.picks).forEach(function (id) {
      var t = byId(id), p = state.picks[id];
      var ctrl = ctrlInput(t.label, 0, 40, 0.5, p.ownerHours, function (v) { return fmtHours(v) + " h/wk"; }, null, function (v) { p.ownerHours = v; update(); });
      var hv = h("span", { class: "ctrl-val" }, [p.heads + (p.heads === 1 ? " person" : " people")]);
      var hr = h("input", { type: "range", min: "1", max: "25", step: "1", value: p.heads });
      hr.addEventListener("input", function (e) { p.heads = parseInt(e.target.value, 10) || 1; hv.textContent = p.heads + (p.heads === 1 ? " person" : " people"); update(); });
      ctrl.appendChild(h("div", { class: "ctrl-top", style: "margin-top:9px" }, [h("span", { class: "ctrl-label" }, ["People doing it"]), hv]));
      ctrl.appendChild(hr);
      hsec.appendChild(ctrl);
    });
    sbBody.appendChild(hsec);
    var side = h("aside", { class: "shell-side" }, [
      h("div", { class: "sb-logo" }, [h("div", { class: "sb-mark" }, ["L"]), h("div", {}, [h("div", { class: "sb-name" }, ["EFFICIENCY"]), h("div", { class: "sb-sub" }, ["Time-Leak Simulator"])])]),
      sbBody,
      h("div", { class: "sb-foot" }, [h("button", { class: "reset-btn", onclick: function () { resetInputs(); } }, ["Reset to defaults"])]),
    ]);

    /* ---------- MAIN ---------- */
    ui.sub = h("p", { class: "sub" }, [""]);
    var body = h("div", { class: "main-body" }, []);
    function kpi(cls, icon, lbl, desc) {
      var big = h("div", { class: "kpi-big" }, ["$0"]), prog = h("i", {}, []);
      return { big: big, prog: prog, card: h("div", { class: "kpi " + cls }, [h("span", { class: "kpi-ico" }, [icon]), big, h("div", { class: "kpi-lbl" }, [lbl]), h("div", { class: "kpi-desc" }, [desc]), h("div", { class: "kpi-prog" }, [prog])]) };
    }
    ui.k1 = kpi("is-danger", "🔴", "Annual leak", "Recoverable cost lost to manual work every year");
    ui.k2 = kpi("is-danger", "⏱", "Hours back / year", "Hours AI can hand back to you");
    ui.k3 = kpi("is-accent", "📉", "Daily burn rate", "Bleeding every working day you wait");
    ui.k4 = kpi("is-accent", "💸", "Return on $97", "What this Briefing pays back, yearly");
    body.appendChild(h("div", { class: "kpi-row" }, [ui.k1.card, ui.k2.card, ui.k3.card, ui.k4.card]));
    ui.secRow = h("div", { class: "kpi-row-2" }, []);
    body.appendChild(ui.secRow);

    ui.tabBreak = h("button", { class: "tab", onclick: function () { setTab("breakdown"); } }, ["Leak breakdown"]);
    ui.tabNarr = h("button", { class: "tab", onclick: function () { setTab("narrative"); } }, ["Narrative report"]);
    body.appendChild(h("div", { class: "tabs" }, [ui.tabBreak, ui.tabNarr]));

    ui.barHost = h("div", {}, []); ui.areaHost = h("div", {}, []);
    ui.catGrid = h("div", { class: "cat-grid" }, []);
    ui.paneBreak = h("div", { class: "tabpane" }, [
      h("div", { class: "chart-grid" }, [
        h("div", { class: "chart-card" }, [h("h2", {}, ["Leak by Category"]), h("p", { class: "ch-sub" }, ["Annual cost lost, task by task"]), ui.barHost]),
        h("div", { class: "chart-card" }, [h("h2", {}, ["Cumulative Leak Build"]), h("p", { class: "ch-sub" }, ["How the loss stacks across the year"]), ui.areaHost]),
      ]),
      ui.catGrid,
    ]);
    ui.narrBody = h("div", { class: "narr-wrap" }, []);
    ui.paneNarr = h("div", { class: "tabpane hidden" }, [ui.narrBody]);
    body.appendChild(ui.paneBreak); body.appendChild(ui.paneNarr);

    var main = h("main", { class: "shell-main" }, [
      h("header", { class: "main-head" }, [
        h("div", {}, [h("h1", {}, ["Efficiency Briefing"]), ui.sub]),
        h("span", { class: "pill leak-pulse" }, [h("span", { class: "dot" }), "Live leak active"]),
      ]),
      body,
    ]);

    app.appendChild(h("div", { class: "shell" }, [side, main]));

    [ui.k1, ui.k2, ui.k3, ui.k4].forEach(function (k) { k.big._cur = 0; });
    setTab(state.tab);
    update(true);

    /* ---------- inner ---------- */
    function setTab(t) {
      state.tab = t;
      ui.tabBreak.classList.toggle("on", t === "breakdown");
      ui.tabNarr.classList.toggle("on", t === "narrative");
      ui.paneBreak.classList.toggle("hidden", t !== "breakdown");
      ui.paneNarr.classList.toggle("hidden", t !== "narrative");
    }
    function resetInputs() {
      Object.keys(state.picks).forEach(function (id) { var t = byId(id); state.picks[id].ownerHours = Math.round(weeklyHours(t.hoursDefault, t.cadence) * 2) / 2; state.picks[id].cadence = "week"; });
      state.rate = CFG.math.defaultBlendedRate; if (state.isTeam) state.teamHeads = 2;
      renderReveal();
    }
    function update(initial) {
      state.results = compute(); var R = state.results;
      var anyTeam = R.per.some(function (x) { return x.heads > 1; });
      ui.sub.textContent = "Real-time leak model · " + R.per.length + " task" + (R.per.length === 1 ? "" : "s") + " · " + (anyTeam ? "Team model" : "Solo operator");
      animateTo(ui.k1.big, R.totalAnnual, usd);
      animateTo(ui.k2.big, R.totalRecYr, function (v) { return fmtHours(v) + " hrs"; });
      animateTo(ui.k3.big, R.totalAnnual / 260, usd);
      var roi = Math.min(R.totalAnnual / CFG.price.amount, CFG.math.maxReturnMultiple);
      ui.k4.big._cur = R.totalAnnual; ui.k4.big.textContent = (roi >= CFG.math.maxReturnMultiple ? CFG.math.maxReturnMultiple + "×+" : Math.round(roi) + "×");
      ui.k1.prog.style.width = Math.min(100, R.totalAnnual / 200000 * 100) + "%";
      ui.k2.prog.style.width = Math.min(100, R.totalRecYr / 5000 * 100) + "%";
      ui.k3.prog.style.width = Math.min(100, (R.totalAnnual / 260) / 2000 * 100) + "%";
      ui.k4.prog.style.width = Math.min(100, roi / 10 * 100) + "%";
      clear(ui.secRow);
      R.per.slice(0, 5).forEach(function (x, i) {
        ui.secRow.appendChild(h("div", { class: "kpi" }, [
          h("div", { class: "kpi-sub-num", style: "color:" + heat(i) }, [usdK(x.annual)]),
          h("div", { class: "kpi-lbl" }, [x.label]),
          h("div", { class: "kpi-desc" }, [Math.round(x.pct * 100) + "% recoverable · " + fmtHours(x.recWk) + " hrs/wk back"]),
        ]));
      });
      ui.barHost.innerHTML = buildBars(R.per);
      ui.areaHost.innerHTML = buildArea(R.totalAnnual);
      clear(ui.catGrid);
      R.per.forEach(function (x, i) {
        var col = heat(i);
        ui.catGrid.appendChild(h("div", { class: "cat-card" }, [
          h("div", { class: "cat-head" }, [h("span", { class: "cat-name" }, [x.label]), h("span", { class: "cat-pct", style: "color:" + col }, [Math.round(x.pctOfTotal) + "%"])]),
          h("div", { class: "cat-big", style: "color:" + col }, [usdK(x.annual)]),
          h("div", { class: "cat-hrs" }, [fmtHours(x.recYr) + " hrs lost/yr"]),
          h("div", { class: "cat-bar" }, [h("i", { style: "width:" + Math.max(4, x.pctOfTotal) + "%;background:" + col }, [])]),
          h("div", { class: "cat-desc" }, [x.benchmark]),
        ]));
      });
      buildNarrative(R);
      Array.prototype.forEach.call(document.querySelectorAll('input[type="range"]'), function (r) { r.style.setProperty("--fill", (r.value - r.min) / (r.max - r.min) * 100 + "%"); });
    }
    function buildNarrative(R) {
      clear(ui.narrBody);
      var one = R.one, top3 = R.per.slice(0, 3), sum3 = top3.reduce(function (s, x) { return s + x.annual; }, 0);
      var anyTeam = R.per.some(function (x) { return x.heads > 1; });
      ui.narrBody.appendChild(h("div", { class: "brief-hd" }, [
        h("div", { class: "ico" }, ["📊"]),
        h("div", {}, [h("h2", {}, ["Executive Briefing — Your Time-Leak"]), h("p", {}, ["Limited to Limitless · " + R.per.length + " tasks · " + (anyTeam ? "Team model" : "Solo operator")])]),
      ]));
      var paras = [
        "Every working day, your operation quietly bleeds <b class='red'>" + usd(R.totalAnnual / 260) + "</b> in recoverable cost — not from tools or ads, but from the manual work buried in your week. Across " + R.per.length + " task" + (R.per.length === 1 ? "" : "s") + (anyTeam ? " across your team" : "") + ", that overhead compounds into <b class='red'>" + usd(R.totalAnnual) + "</b> a year.",
        "Your money bleeds fastest from <b>" + escText(one.label) + "</b> — about <b class='amber'>" + usd(one.annual) + "</b> a year, roughly " + Math.round(one.pctOfTotal) + "% of the whole leak. " + (state.believedLeak ? (R.believedMatchesOne ? "Your gut already knew it — you named this as your worst leak. Trust that and start there." : "You guessed elsewhere (&ldquo;" + escText(state.believedLeak) + "&rdquo;), but the math points here. The leak you can't see is the one that's survived this long.") : "It's the first thing to hand to AI."),
        "Fix your top three — <b>" + top3.map(function (x) { return escText(x.label); }).join(", ") + "</b> — and you pull back about <b class='amber'>" + usd(sum3) + "</b> a year. These aren't new costs to find; they're hours you already pay for, spent on work a well-built AI assistant can carry. The next screen turns each one into a reusable project in your own AI, step by step.",
      ];
      paras.forEach(function (txt, i) { ui.narrBody.appendChild(h("div", { class: "narr-para" }, [h("span", { class: "n" }, [String(i + 1)]), h("p", { html: txt })])); });
      var rows = R.per.map(function (x, i) {
        return h("tr", {}, [
          h("td", { html: '<span class="dot-s" style="background:' + heat(i) + '"></span>' + escText(x.label) }),
          h("td", { class: "sum-num", style: "color:" + heat(i) }, [usd(x.annual)]),
          h("td", { class: "sum-num" }, [Math.round(x.recYr).toLocaleString("en-US")]),
          h("td", { class: "sum-num" }, [Math.round(x.pctOfTotal) + "%"]),
        ]);
      });
      rows.push(h("tr", { class: "total" }, [h("td", {}, ["TOTAL ANNUAL LEAK"]), h("td", { class: "sum-num" }, [usd(R.totalAnnual)]), h("td", { class: "sum-num" }, [Math.round(R.totalRecYr).toLocaleString("en-US")]), h("td", { class: "sum-num" }, ["100%"])]));
      ui.narrBody.appendChild(h("div", { class: "sum" }, [
        h("div", { class: "sum-hd" }, ["Leak Summary — Quick Reference"]),
        h("table", {}, [h("thead", {}, [h("tr", {}, [h("th", {}, ["Category"]), h("th", {}, ["Annual $"]), h("th", {}, ["Hours/yr"]), h("th", {}, ["Share"])])]), h("tbody", {}, rows)]),
      ]));
      ui.narrBody.appendChild(h("div", { class: "cta-block" }, [
        h("h3", {}, ["The business case in one number"]),
        h("div", { class: "cta-num" }, [usd(R.totalAnnual)]),
        h("p", { html: "These are hours you're already paying for — consumed by manual work across your week" + (R.per.some(function (x) { return x.heads > 1; }) ? " and team" : "") + ". Recover just 30% and that's <b class='amber'>" + usd(R.totalAnnual * 0.3) + "/yr</b>. At 50%, <b class='amber'>" + usd(R.totalAnnual * 0.5) + "/yr</b>. That's the conversation — not the $97, but the cost of leaving the leak running." }),
        h("div", { style: "margin-top:18px" }, [h("button", { class: "btn", onclick: renderBuild }, ["Build my top 3 →"])]),
      ]));
    }
  }

  /* ================= BUILD THE TOP 3 ================= */
  function fetchBuilds() {
    var tasks = state.results.per.slice(0, 3).map(function (x) { var t = byId(x.id); return { id: t.id, label: t.label, hint: t.hint, template: t.project }; });
    fetch("/api/eb-brain", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks: tasks, isTeam: state.isTeam }),
    }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d && d.builds) { state.aiBuilds = d.builds; if (document.getElementById("buildArea")) renderBuildArea(); } })
      .catch(function () { /* fixed-template fallback already shown */ });
  }

  function renderBuild() {
    clear(app); appMode(false);
    var tabs = h("div", { class: "platform-tabs" }, CFG.platforms.map(function (pf) {
      return h("button", { class: pf.id === state.platform ? "on" : "", onclick: function () { state.platform = pf.id; renderBuild(); } }, [pf.name]);
    }));
    var intro = h("section", { class: "card" }, [
      h("h2", { class: "step-title" }, ["Now build the three — into your own AI."]),
      h("p", { class: "step-help" }, ["Pick where you work below. For each fix you get a copy-paste starter and dead-simple steps to turn it into a reusable project. Edit anything — these are starting points, not gospel."]),
      tabs,
    ]);
    app.appendChild(intro);
    app.appendChild(h("section", { id: "buildArea" }, []));
    renderBuildArea();
    app.appendChild(h("section", { class: "card", style: "text-align:center" }, [
      h("div", { class: "btn-row" }, [h("button", { class: "btn", onclick: renderSchedule }, ["Set my schedule →"])]),
    ]));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // top-level so fetchBuilds() can refresh it when the AI brain responds
  function renderBuildArea() {
    var host = document.getElementById("buildArea"); if (!host) return; clear(host);
    var top3 = state.results.per.slice(0, 3);
    var pf = CFG.platforms.filter(function (p) { return p.id === state.platform; })[0];
    top3.forEach(function (x, i) {
      var t = byId(x.id);
      var ai = state.aiBuilds && state.aiBuilds[x.id];
      var starter = ai && ai.starter ? ai.starter : null;
      var steps = (ai && ai.steps) ? ai.steps : pf.steps;
      var instructions = starter ? starter.instructions : t.project.instructions;
      var context = starter ? starter.context : t.project.context;
      var sample = starter ? starter.sample : t.project.sample;
      host.appendChild(h("section", { class: "card build-block" }, [
        h("h3", {}, ["#" + (i + 1) + " · " + t.label, ai ? h("span", { class: "tag-ai" }, ["personalised"]) : null]),
        h("p", { class: "step-help" }, ["Build this as a " + pf.name + " project. Steps:"]),
        h("ol", { class: "steps" }, steps.map(function (st) { return h("li", {}, [st]); })),
        starterBox("Instructions (paste into the project)", instructions),
        starterBox("Context to add", context),
        starterBox("Sample to include", sample),
        h("p", { class: "edit-note" }, ["✏️ Tailor the bracketed bits to your business before you save."]),
      ]));
    });
  }

  function starterBox(title, text) {
    var pre = h("pre", {}, [text]);
    var btn = h("button", { class: "copy-btn", onclick: function () {
      navigator.clipboard.writeText(text).then(function () { btn.textContent = "Copied ✓"; setTimeout(function () { btn.textContent = "Copy"; }, 1500); });
    } }, ["Copy"]);
    return h("div", { class: "starter" }, [h("div", { class: "starter-box" }, [h("h4", {}, [title]), btn, pre])]);
  }

  /* ================= SCHEDULE ================= */
  function renderSchedule() {
    clear(app); appMode(false);
    var top3 = state.results.per.slice(0, 3);
    var rows = top3.map(function (x) {
      var t = byId(x.id);
      return h("tr", {}, [
        h("td", {}, [t.label]),
        h("td", {}, [h("input", { type: "text", value: t.defaultCadence })]),
        h("td", { class: "h-sub" }, [t.benchmark]),
      ]);
    });
    app.appendChild(h("section", { class: "card" }, [
      h("h2", { class: "step-title" }, ["A cadence you'll actually keep."]),
      h("p", { class: "step-help" }, ["Here's a starting rhythm for your top 3, grounded in real before/after benchmarks. Edit the 'When' column to fit your week, then screenshot it or print this page."]),
      h("table", { class: "sched" }, [
        h("thead", {}, [h("tr", {}, [h("th", {}, ["Fix"]), h("th", {}, ["When"]), h("th", {}, ["Why it's worth it"])])]),
        h("tbody", {}, rows),
      ]),
    ]));
    app.appendChild(h("section", { class: "card", style: "text-align:center" }, [
      h("h2", {}, ["That's your Briefing."]),
      h("p", { class: "guide-line" }, ["We've emailed a copy to " + (state.email || "your inbox") + ". When you're ready to install all ten with me — live, in one day — that's the next step."]),
      h("div", { class: "btn-row" }, [
        h("button", { class: "btn", onclick: function () { window.print(); } }, ["Print / save my Briefing"]),
        h("a", { class: "btn btn--ghost", href: CFG.brand.labUrl }, ["See the Live Lab →"]),
      ]),
      h("p", { class: "signoff", style: "margin-top:20px" }, [CFG.brand.signoff]),
    ]));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ================= CAPTURE ================= */
  function previewBanner() {
    var b = h("div", { style: "position:fixed;top:0;left:0;right:0;z-index:60;text-align:center;background:rgba(255,138,61,0.92);color:#1a0d03;font:600 13px/1.4 Inter,sans-serif;padding:6px" }, ["PREVIEW MODE — no payment, no data saved. Add ?preview=1 to any URL to see this. Remove it for the real $97 flow."]);
    document.body.appendChild(b);
    document.body.style.paddingTop = "28px";
  }

  function mirrorCapture() {
    if (state.preview) return;          // never capture in preview
    var R = state.results;
    var payload = {
      email: state.email, name: state.name, contactId: state.contactId,
      believedLeak: state.believedLeak, isTeam: state.isTeam,
      leakTotalYr: Math.round(R.totalAnnual),
      top3: R.per.slice(0, 3).map(function (x) { return { task: x.label, annual: Math.round(x.annual) }; }),
      numberOneMove: R.one ? R.one.label : "",
      perTask: R.per.map(function (x) { return { task: x.label, annual: Math.round(x.annual), recWk: Math.round(x.recWk * 10) / 10 }; }),
    };
    try {
      fetch("/api/eb-lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), keepalive: true }).catch(function () {});
    } catch (e) {}
  }

  /* ---------- misc ---------- */
  function byId(id) { return CFG.tasks.filter(function (t) { return t.id === id; })[0]; }
  function flash(msg) {
    var n = h("div", { class: "card error", style: "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:50;max-width:90%" }, [msg]);
    document.body.appendChild(n); setTimeout(function () { n.remove(); }, 4200);
  }

  boot();
})();
