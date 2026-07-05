/* LtL Time-Calculator — branded PDF report (pdfmake, lazy-loaded).
   Cover page = dark navy (brand). All other pages = light / print-friendly
   so it doesn't burn ink when printed. Contents: cover → time-leak results
   → their 2 priority prompts → the full Hour-Back Pack (all 10). */
(function () {
  "use strict";
  // dark cover palette
  const NAVY = "#0A1020", COVER_TITLE = "#FFFFFF", COVER_SUB = "#9DB0CE", COVER_STEEL = "#9fc6ea";
  // light/content palette (print-friendly)
  const INK = "#22304d", HEAD = "#12213e", MUTED = "#5d6c87", EMBER = "#D2691E", STEEL = "#235a9e",
        BOXBG = "#f4f7fc", BOXLINE = "#d9e2f0", BOXINK = "#2b3753", TBLHEAD = "#eef3fb";

  const money = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("en-US");

  function promptBox(text) {
    // Render line-by-line (a stack) so EVERY line shows — a single text node
    // with embedded newlines was collapsing to one line in some renderers.
    const lines = String(text || "").split(/\r?\n/);
    return {
      table: {
        widths: ["*"],
        body: [[ {
          stack: lines.map((l) => ({ text: l === "" ? " " : l, fontSize: 8.5, color: BOXINK, preserveLeadingSpaces: true, lineHeight: 1.3, margin: [0, 0, 0, 0] })),
        } ]],
      },
      layout: {
        fillColor: () => BOXBG, hLineColor: () => BOXLINE, vLineColor: () => BOXLINE,
        hLineWidth: () => 1, vLineWidth: () => 1,
        paddingTop: () => 10, paddingBottom: () => 10, paddingLeft: () => 12, paddingRight: () => 12,
      },
      margin: [0, 4, 0, 14],
      unbreakable: true,
    };
  }

  function promptBlock(out, p) {
    out.push({ text: p.promptName, color: STEEL, fontSize: 14, bold: true, margin: [0, 8, 0, 1] });
    out.push({ text: (p.label || "") + (p.savesNote ? "  ·  " + p.savesNote : ""), color: MUTED, fontSize: 9, margin: [0, 0, 0, 5] });
    out.push(promptBox(p.prompt || ""));
  }

  window.LtLReport = {
    generate(d) {
      const content = [];

      // ---------- COVER (dark navy) ----------
      content.push({ text: "LIMITED TO LIMITLESS", color: COVER_STEEL, fontSize: 11, characterSpacing: 3, margin: [0, 80, 0, 0] });
      content.push({ text: "Your Hour-Back Report", color: COVER_TITLE, fontSize: 34, bold: true, margin: [0, 12, 0, 2] });
      content.push({ text: d.name ? "Prepared for " + d.name : "Your personalized time-leak read", color: COVER_SUB, fontSize: 13, margin: [0, 0, 0, 34] });
      content.push({ text: money(d.leakTotalYr), color: EMBER, fontSize: 62, bold: true, margin: [0, 0, 0, 0] });
      content.push({ text: "leaking from your top 2 tasks every year", color: COVER_SUB, fontSize: 13, margin: [0, 2, 0, 28] });
      content.push({ canvas: [{ type: "line", x1: 0, y1: 0, x2: 210, y2: 0, lineColor: EMBER, lineWidth: 2 }] });
      content.push({ text: d.date || "", color: COVER_SUB, fontSize: 10, margin: [0, 18, 0, 0] });
      content.push({ text: "Inside: your time-leak breakdown, your 2 install-today prompts, and the full Hour-Back Pack.", color: "#cdd8ea", fontSize: 11, margin: [0, 26, 0, 0] });

      // ---------- RESULTS (light) ----------
      content.push({ text: "Where your hours go", color: HEAD, fontSize: 22, bold: true, pageBreak: "before", margin: [0, 0, 0, 8] });
      content.push({ text: "Your own wasted time, turned into dollars — the math is shown, nothing hidden.", color: MUTED, fontSize: 11, margin: [0, 0, 0, 14] });

      const rowsBody = [[
        { text: "Task", color: MUTED, fontSize: 9, bold: true },
        { text: "Hrs/wk", color: MUTED, fontSize: 9, bold: true, alignment: "right" },
        { text: "AI recovers", color: MUTED, fontSize: 9, bold: true, alignment: "right" },
        { text: "$ / year", color: MUTED, fontSize: 9, bold: true, alignment: "right" },
      ]].concat((d.rows || []).map((r) => [
        { text: r.label, color: INK, fontSize: 10 },
        { text: (Math.round(r.weeklyHours * 10) / 10).toString(), color: INK, fontSize: 10, alignment: "right" },
        { text: Math.round(r.recoverPct * 100) + "%", color: INK, fontSize: 10, alignment: "right" },
        { text: money(r.annual), color: EMBER, fontSize: 10, bold: true, alignment: "right" },
      ]));
      content.push({
        table: { headerRows: 1, widths: ["*", "auto", "auto", "auto"], body: rowsBody },
        layout: {
          fillColor: (r) => (r === 0 ? TBLHEAD : null),
          hLineColor: () => BOXLINE, vLineColor: () => BOXLINE,
          hLineWidth: (i) => (i === 1 ? 1 : 0.5), vLineWidth: () => 0,
          paddingTop: () => 7, paddingBottom: () => 7, paddingLeft: () => 8, paddingRight: () => 8,
        },
        margin: [0, 0, 0, 16],
      });
      content.push({ text: [ { text: "Total leak (top 2 priorities): ", color: INK, fontSize: 13 }, { text: money(d.leakTotalYr) + " / year", color: EMBER, fontSize: 13, bold: true } ], margin: [0, 0, 0, 12] });
      if (d.numberOneMove) content.push({ text: "Start here: " + d.numberOneMove + " — your #1 move.", color: STEEL, fontSize: 12, bold: true, margin: [0, 0, 0, 10] });
      if (d.believedLeak) content.push({ text: "You named your biggest leak as: “" + d.believedLeak + "”", color: MUTED, italics: true, fontSize: 10, margin: [0, 0, 0, 0] });

      // ---------- YOUR 2 PROMPTS (light) ----------
      content.push({ text: "Your 2 install-today prompts", color: HEAD, fontSize: 22, bold: true, margin: [0, 24, 0, 6] });
      content.push({ text: "Mapped to your biggest leaks. Paste into Claude, Gemini, or your favorite AI, then fill in the [brackets].", color: MUTED, fontSize: 11, margin: [0, 0, 0, 4] });
      (d.top2 || []).forEach((p, i) => {
        content.push({ text: `Priority ${i + 1} — worth ${money(p.annual)}/yr`, color: EMBER, fontSize: 10, bold: true, margin: [0, 10, 0, 0] });
        promptBlock(content, p);
      });

      // ---------- FULL HOUR-BACK PACK (light) ----------
      content.push({ text: "The full Hour-Back Pack", color: HEAD, fontSize: 22, bold: true, margin: [0, 24, 0, 4] });
      content.push({ text: "All 10 copy-paste prompts to reclaim time across your week.", color: MUTED, fontSize: 11, margin: [0, 0, 0, 2] });
      (d.allTasks || []).forEach((p) => promptBlock(content, p));
      content.push({ text: "Ready to build these into systems that run without you? That's the Efficiency Briefing.", color: STEEL, fontSize: 12, bold: true, margin: [0, 16, 0, 0] });

      const dd = {
        pageSize: "LETTER",
        pageMargins: [46, 54, 46, 54],
        background: (cur, size) => (cur === 1 ? { canvas: [{ type: "rect", x: 0, y: 0, w: size.width, h: size.height, color: NAVY }] } : null),
        defaultStyle: { font: "Roboto", color: INK, fontSize: 11, lineHeight: 1.3 },
        footer: (cur, total) => cur === 1 ? null : ({
          columns: [
            { text: "Be Limitless. Be Bold.", color: MUTED, fontSize: 8, margin: [46, 0, 0, 0] },
            { text: `${cur} / ${total}`, color: MUTED, fontSize: 8, alignment: "right", margin: [0, 0, 46, 0] },
          ],
        }),
        content: content,
      };

      const safeName = (d.name || "Your").replace(/[^a-z0-9]+/gi, "-");
      const built = window.pdfMake.createPdf(dd);
      // Mobile browsers block the blob "download" (shows "page can't be downloaded"),
      // so open the PDF in a new tab where the phone's own save/share works.
      const isMobile = /Android|iPhone|iPad|iPod|IEMobile|Mobile/i.test(navigator.userAgent || "");
      if (d._preview) { built.getDataUrl((url) => d._preview(url)); }
      else if (isMobile) { built.open(); }
      else { built.download(`${safeName}-Hour-Back-Report.pdf`); }
    },
  };
})();
