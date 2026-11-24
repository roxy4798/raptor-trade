/* Raptor Trade v36 — density overlay (build-owned, Jenni).
   Groups the Deep-Dive Terminal signal list by 4H close WITHOUT editing
   Raka's experience-v23.js: a MutationObserver re-groups #ddt-list after
   every renderList() rebuild (search / filter / select). Group headers
   are inserted between items; the .ddt-item buttons themselves are never
   touched, so his click handlers keep working.
   Also: capture-phase reveal for the DDT "open detail" button — the main
   table expands the selected signal's close group BEFORE the DDT handler
   looks the row up (app.js window.RaptorDensity.revealSignal). */
(function () {
  "use strict";
  var DATA = window.RAPTOR_DATA || { signals: [] };
  if (!DATA.signals.length) return;
  var BY_SID = {};
  DATA.signals.forEach(function (s) { BY_SID[s.signal_id] = s; });
  var GROUP_PAGE = 25;
  var collapsed = {};  /* close_ts -> true */
  var expanded = {};   /* close_ts -> true (show all, not just GROUP_PAGE) */
  var list = document.getElementById("ddt-list");
  if (!list) return;

  function lang() {
    return window.RaptorLang && window.RaptorLang.get() === "id" ? "id" : "en";
  }
  var T = {
    en: { signals: "signals", continued: "positive", reversed: "negative",
          mean: "mean", showAll: "Show all", showLess: "Show less", of: "of" },
    id: { signals: "sinyal", continued: "positif", reversed: "negatif",
          mean: "rata-rata", showAll: "Tampilkan semua",
          showLess: "Tampilkan lebih sedikit", of: "dari" }
  };
  function t(k) { return (T[lang()] || T.en)[k] || T.en[k] || k; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }
  function closeStr(s) {
    return lang() === "id" ? (s.close_wib + " WIB") : (s.close_utc + " UTC");
  }
  /* v43 (25 Nov 2026, Raka: no +30m anywhere): DDT group stats are
     +4H-based — counts of evaluated +4H returns above/below zero +
     their mean (PERCENT, not the old tracker net fraction). */
  function groupStats(rows) {
    var cont = 0, rev = 0, rets = [];
    rows.forEach(function (s) {
      var h = (s.tf || {}).h4 || {};
      if (h.status === "evaluated" && h.return_pct !== null && h.return_pct !== undefined) {
        if (h.return_pct > 0) cont++; else rev++;
        rets.push(h.return_pct);
      }
    });
    var mean = rets.length
      ? rets.reduce(function (a, b) { return a + b; }, 0) / rets.length : null;
    return { n: rows.length, cont: cont, rev: rev, mean: mean };
  }
  function filtering() {
    var q = document.getElementById("ddt-search");
    if (q && q.value.trim() !== "") return true;
    var active = document.querySelector('.ddt-filter[aria-pressed="true"]');
    return !!active && active.getAttribute("data-filter") !== "all";
  }

  function groupList() {
    var items = Array.prototype.slice.call(list.querySelectorAll(".ddt-item"));
    /* Drop previous group chrome (headers + more buttons); items stay. */
    Array.prototype.slice.call(
      list.querySelectorAll(".close-group-head, .close-group-more")
    ).forEach(function (el) { el.remove(); });
    if (!items.length) return;
    var groups = [], cur = null;
    items.forEach(function (it) {
      var s = BY_SID[it.getAttribute("data-sid")];
      var ts = s ? s.close_ts : 0;
      if (!cur || cur.ts !== ts) { cur = { ts: ts, items: [], sigs: [] }; groups.push(cur); }
      cur.items.push(it);
      if (s) cur.sigs.push(s);
    });
    var latestTs = groups[0].ts;
    var activeTs = null;
    var active = list.querySelector(".ddt-item.is-active");
    if (active) {
      var as = BY_SID[active.getAttribute("data-sid")];
      if (as) activeTs = as.close_ts;
    }
    var isFiltering = filtering();
    groups.forEach(function (g) {
      var isCollapsed = isFiltering ? false
        : (g.ts === activeTs ? false
        : (collapsed[g.ts] !== undefined ? collapsed[g.ts] : (g.ts !== latestTs)));
      var st = groupStats(g.sigs);
      var stats = "";
      if (st.mean !== null) {
        stats = ' &middot; <span class="gh-stat">' + st.cont + " " + t("continued") + "</span>"
          + ' &middot; <span class="gh-stat">' + st.rev + " " + t("reversed") + "</span>"
          + ' &middot; <span class="gh-stat">' + t("mean") + " "
          + (st.mean >= 0 ? "+" : "") + st.mean.toFixed(2) + "%</span>";
      }
      var head = document.createElement("div");
      head.className = "close-group-head ddt-group-head";
      head.setAttribute("data-close-ts", g.ts);
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "close-group-toggle";
      btn.setAttribute("aria-expanded", String(!isCollapsed));
      btn.setAttribute("data-close-ts", g.ts);
      btn.innerHTML = '<span class="gh-chev">' + (isCollapsed ? "▸" : "▾") + "</span>"
        + '<span class="gh-close">' + esc(closeStr(g.sigs[0])) + "</span>"
        + '<span class="gh-count">' + st.n + " " + t("signals") + "</span>" + stats;
      btn.addEventListener("click", function () {
        collapsed[g.ts] = !isCollapsed;
        groupList();
      });
      head.appendChild(btn);
      list.insertBefore(head, g.items[0]);
      var showAll = !!expanded[g.ts];
      g.items.forEach(function (it, i) {
        it.style.display = (isCollapsed || (!showAll && i >= GROUP_PAGE)) ? "none" : "";
      });
      if (!isCollapsed && g.items.length > GROUP_PAGE) {
        var more = document.createElement("button");
        more.type = "button";
        more.className = "close-group-more ddt-group-more";
        more.setAttribute("data-close-ts", g.ts);
        more.textContent = showAll ? t("showLess")
          : t("showAll") + " " + g.items.length + " ("
          + Math.min(GROUP_PAGE, g.items.length) + " " + t("of") + " " + g.items.length + ")";
        more.addEventListener("click", function () {
          if (expanded[g.ts]) delete expanded[g.ts];
          else expanded[g.ts] = true;
          groupList();
        });
        list.insertBefore(more, g.items[g.items.length - 1].nextSibling);
      }
    });
  }

  /* Re-group after every renderList() rebuild. Disconnect while grouping:
     our own insertions would otherwise re-trigger the observer forever. */
  var observer = new MutationObserver(function () {
    observer.disconnect();
    groupList();
    observer.observe(list, { childList: true });
  });
  observer.observe(list, { childList: true });
  groupList();

  /* DDT "open detail" looks the row up in the main table. If that signal's
     close group is collapsed, the row is not in the DOM and the DDT falls
     back to a plain scroll. Reveal it first (capture phase runs before
     the button's own handler). */
  document.addEventListener("click", function (e) {
    var btn = e.target && e.target.closest ? e.target.closest("#v23-open-modal") : null;
    if (!btn) return;
    if (!window.RaptorDensity || !window.RaptorTerminal) return;
    var sel = window.RaptorTerminal.getSelected && window.RaptorTerminal.getSelected();
    if (sel) window.RaptorDensity.revealSignal(sel.signal_id);
  }, true);

  window.RaptorDensityDDT = {
    expandAll: function () {
      Object.keys(collapsed).forEach(function (k) { collapsed[k] = false; });
      DATA.signals.forEach(function (s) { expanded[s.close_ts] = true; });
      groupList();
    },
    getState: function () {
      return {
        collapsed: Object.keys(collapsed).filter(function (k) { return collapsed[k]; }),
        expanded: Object.keys(expanded)
      };
    }
  };
})();
