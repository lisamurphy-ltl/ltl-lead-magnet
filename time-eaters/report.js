/* LtL Time-Calculator — branded PDF report (uses pdfmake, lazy-loaded).
   Builds one attractive PDF: cover → their time-leak results → their 2
   priority prompts → the full Hour-Back Pack (all 10 prompts). */
(function () {
  "use strict";
  const NAVY = "#0A1020", INK = "#EEF3FB", STEEL = "#7DC0F0", EMBER = "#FF8A3D",
        MUTED = "#9DB0CE", BOXBG = "#0e1a33", LINE = "#1d2c4d", PROMPTINK = "#dbe6f5";
  const money = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("en-US");

  function promptBox(text) {
    return {
      table: { widths: ["*"], body: [[ { text: text, font: "Roboto", fontSize: 8.5, color: PROMPTINK, preserveLeadingSpaces: true, lineHeight: 1.25 } ]] },
      layout: {
        fillColor: () => BOXBG, hLineColor: () => LINE, vLineColor: () => LINE,
        hLineWidth: () => 1, vLineWidth: () => 1,
        paddingTop: () => 9, paddingBottom: () => 9, paddingLeft: () => 11, paddingRight: () => 11,
      },
      margin: [0, 4, 0, 12],
    };
  }

  function promptBlock(p, accent) {
    return [
      { text: p.promptName, color: accent || STEEL, fontSize: 14, bold: true, margin: [0, 6, 0, 1] },
      { text: (p.label || "") + (p.savesNote ? "  ·  " + p.savesNote : ""), color: MUTED, fontSize: 9, margin: [0, 0, 0, 5] },
      promptBox(p.prompt || ""),
    ];
  }

  window.LtLReport = {
    generate(d) {
      const rowsBody = [[
        { text: "Task", color: MUTED, fontSize: 9, bold: true },
        { text: "Hrs/wk", color: MUTED, fontSize: 9, bold: true, alignment: "right" },
        { text: "AI recovers", color: MUTED, fontSize: 9, bold: true, alignment: "right" },
        { text: "$/year", color: MUTED, fontSize: 9, bold: true, alignment: "right" },
      ]].concat((d.rows || []).map((r) => [
        { text: r.label, color: INK, fontSize: 10 },
        { text: (Math.round(r.weeklyHours * 10) / 10).toString(), color: INK, fontSize: 10, alignment: "right" },
        { text: Math.round(r.recoverPct * 100) + "%", color: INK, fontSize: 10, alignment: "right" },
        { text: money(r.annual), color: EMBER, fontSize: 10, bold: true, alignment: "right" },
      ]));

      const top2Blocks = [];
      (d.top2 || []).forEach((p, i) => {
        top2Blocks.push({ text: `Priority ${i + 1} — worth ${money(p.annual)}/yr`, color: EMBER, fontSize: 10, bold: true, margin: [0, 8, 0, 0] });
        promptBlock(p, STEEL).forEach((x) => top2Blocks.push(x));
      });

      const allBlocks = [];
      (d.allTasks || []).forEach((p, i) => {
        promptBlock(p, STEEL).forEach((x) => allBlocks.push(x));
      });

      const dd = {
        pageSize: "LETTER",
        pageMargins: [44, 54, 44, 54],
        background: (cur, size) => ({ canvas: [{ type: "rect", x: 0, y: 0, w: size.width, h: size.height, color: NAVY }] }),
        defaultStyle: { font: "Roboto", color: INK, fontSize: 11, lineHeight: 1.3 },
        footer: (cur, total) => ({
          columns: [
            { text: "Be Limitless. Be Bold.", color: MUTED, fontSize: 8, margin: [44, 0, 0, 0] },
            { text: `${cur} / ${total}`, color: MUTED, fontSize: 8, alignment: "right", margin: [0, 0, 44, 0] },
          ],
        }),
        content: [
          // ---- COVER ----
          { text: "LIMITED TO LIMITLESS", color: STEEL, fontSize: 11, characterSpacing: 3, margin: [0, 60, 0, 0] },
          { text: "Your Hour-Back Report", color: INK, fontSize: 34, bold: true, margin: [0, 10, 0, 2] },
          { text: d.name ? "Prepared for " + d.name : "Your personalized time-leak read", color: MUTED, fontSize: 13, margin: [0, 0, 0, 30] },
          { text: money(d.leakTotalYr), color: EMBER, fontSize: 60, bold: true, margin: [0, 0, 0, 0] },
          { text: "leaking from your top 2 tasks every year", color: MUTED, fontSize: 13, margin: [0, 2, 0, 26] },
          { canvas: [{ type: "line", x1: 0, y1: 0, x2: 200, y2: 0, lineColor: EMBER, lineWidth: 2 }] },
          { text: d.date || "", color: MUTED, fontSize: 10, margin: [0, 16, 0, 0] },
          { text: "Inside: your time-leak breakdown, your 2 install-today prompts, and the full Hour-Back Pack.", color: INK, fontSize: 11, margin: [0, 24, 0, 0] },

          // ---- RESULTS ----
          { text: "Where your hours go", color: INK, fontSize: 22, bold: true, pageBreak: "before", margin: [0, 0, 0, 8] },
          { text: "Your own wasted time, turned into dollars — the math is shown, nothing hidden.", color: MUTED, fontSize: 11, margin: [0, 0, 0, 12] },
          {
            table: { headerRows: 1, widths: ["*", "auto", "auto", "auto"], body: rowsBody },
            layout: { fillColor: (r) => (r === 0 ? "#13213f" : null), hLineColor: () => LINE, vLineColor: () => LINE, hLineWidth: () => 0.7, vLineWidth: () => 0, paddingTop: () => 7, paddingBottom: () => 7, paddingLeft: () => 8, paddingRight: () => 8 },
            margin: [0, 0, 0, 14],
          },
          { text: [ { text: "Total leak (top 2 priorities): ", color: INK, fontSize: 13 }, { text: money(d.leakTotalYr) + " / year", color: EMBER, fontSize: 13, bold: true } ], margin: [0, 0, 0, 10] },
          d.numberOneMove ? { text: "Start here: " + d.numberOneMove + " — your #1 move.", color: STEEL, fontSize: 12, bold: true, margin: [0, 0, 0, 8] } : {},
          d.believedLeak ? { text: "You named your biggest leak as: “" + d.believedLeak + "”", color: MUTED, italics: true, fontSize: 10, margin: [0, 0, 0, 0] } : {},

          // ---- YOUR 2 PROMPTS ----
          { text: "Your 2 install-today prompts", color: INK, fontSize: 22, bold: true, pageBreak: "before", margin: [0, 0, 0, 6] },
          { text: "Mapped to your biggest leaks. Paste into ChatGPT, Claude or Gemini and fill in the [brackets].", color: MUTED, fontSize: 11, margin: [0, 0, 0, 6] },
          ...top2Blocks,

          // ---- FULL HOUR-BACK PACK ----
          { text: "The full Hour-Back Pack", color: INK, fontSize: 22, bold: true, pageBreak: "before", margin: [0, 0, 0, 6] },
          { text: "All 10 copy-paste prompts to reclaim time across your week.", color: MUTED, fontSize: 11, margin: [0, 0, 0, 6] },
          ...allBlocks,

          { text: "Ready to build these into systems that run without you? That's the Efficiency Briefing.", color: STEEL, fontSize: 12, bold: true, margin: [0, 14, 0, 0] },
        ],
      };

      const safeName = (d.name || "Your").replace(/[^a-z0-9]+/gi, "-");
      window.pdfMake.createPdf(dd).download(`${safeName}-Hour-Back-Report.pdf`);
    },
  };
})();
