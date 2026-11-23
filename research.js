/* Raptor Trade — AI Research Dashboard (Phase 3).
   Renders research.json (built by build.py from the Phase 1+2
   research state). Read-only: this page never touches the scanner,
   the pipeline, or publication. Missing data is shown as N/A,
   never estimated. Statistics follow the backend's sample rules. */
(function () {
  "use strict";

  var DATA = null;
  var SELECTED_ID = null;
  var EXPLORER_SORT = { key: "signal_ts", dir: -1 };

  /* ---------------------------------------------------------- helpers */
  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function fmtNum(x, dec) {
    if (x == null || !isFinite(x)) return null;
    return x.toLocaleString("en-US", {
      minimumFractionDigits: dec == null ? 2 : dec,
      maximumFractionDigits: dec == null ? 2 : dec });
  }

  function fmtPct(x, dec) {
    var v = fmtNum(x, dec);
    return v == null ? null : (x > 0 ? "+" : "") + v + "%";
  }

  function fmtPrice(x) {
    if (x == null || !isFinite(x)) return null;
    if (x >= 1000) return fmtNum(x, 2);
    if (x >= 1) return fmtNum(x, 4);
    if (x >= 0.01) return fmtNum(x, 5);
    return fmtNum(x, 6);
  }

  function fmtUsd(x) {
    if (x == null || !isFinite(x)) return null;
    if (Math.abs(x) >= 1e6) return "$" + fmtNum(x / 1e6, 1) + "M";
    if (Math.abs(x) >= 1e3) return "$" + fmtNum(x / 1e3, 1) + "k";
    return "$" + fmtNum(x, 0);
  }

  function fmtWib(ts) {
    if (ts == null) return null;
    try {
      return new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Jakarta", day: "2-digit", month: "short",
        hour: "2-digit", minute: "2-digit", hour12: false
      }).format(new Date(ts * 1000));
    } catch (e) { return null; }
  }

  function fmtDate(ts) {
    if (ts == null) return null;
    try {
      return new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Jakarta", day: "2-digit", month: "short",
        year: "numeric"
      }).format(new Date(ts * 1000));
    } catch (e) { return null; }
  }

  function na(v) {
    return v == null ? '<span class="na">N/A</span>' : esc(v);
  }

  function clsOf(sig) {
    var h = sig.performance && sig.performance.h30m;
    return h && h.status === "evaluated" ? h.classification : null;
  }

  function net30Of(sig) {
    var h = sig.performance && sig.performance.h30m;
    return h && h.status === "evaluated" ? h.net_pct : null;
  }

  function r4hOf(sig) {
    var h = sig.performance && sig.performance.h4;
    return h && h.status === "evaluated" ? h.return_pct : null;
  }

  function statusBadge(status) {
    var map = { "COMPLETED": "st-completed", "PARTIAL DATA": "st-partial",
                "UNAVAILABLE": "st-unavailable", "ERROR": "st-error" };
    var cls = map[status] || "st-unavailable";
    return '<span class="status-badge ' + cls + '">' +
      esc(status || "UNKNOWN") + "</span>";
  }

  function kvRow(label, valueHtml) {
    return "<tr><th>" + esc(label) + "</th><td>" +
      (valueHtml == null ? '<span class="na">N/A</span>' : valueHtml) +
      "</td></tr>";
  }

  /* ---------------------------------------------------------- charts */
  function bucketChart(buckets, order) {
    var html = "";
    var any = false;
    order.forEach(function (name) {
      var b = buckets ? buckets[name] : null;
      if (!b) {
        html += '<div class="bucket-row"><span class="bucket-name">' +
          esc(name) + '</span><span class="bucket-empty">n&lt;5 — no statistics</span>' +
          '<span class="bucket-val"></span></div>';
        return;
      }
      any = true;
      var win = b.win_rate_pct == null ? 0 : b.win_rate_pct;
      var mean = b.mean_net30_pct;
      var neg = mean != null && mean < 0;
      html += '<div class="bucket-row"><span class="bucket-name">' +
        esc(name) + '</span><span class="bucket-track"><i class="' +
        (neg ? "neg-fill" : "") + '" style="width:' +
        Math.max(2, Math.min(100, win)) + '%"></i></span>' +
        '<span class="bucket-val">win ' + fmtNum(win, 0) + '% · ' +
        (mean == null ? "—" : fmtPct(mean, 2)) + " · n=" + b.n +
        "</span></div>";
    });
    if (!any) {
      html += '<p class="bucket-empty">No bucket has enough samples yet (n≥5 required).</p>';
    }
    return html;
  }

  function scatterChart(points, opts) {
    // points: [{x, y, cls, label}]; opts: {xLabel, logX}
    var W = 340, H = 200, P = { l: 38, r: 8, t: 10, b: 26 };
    var xs = points.map(function (p) { return opts.logX ? Math.log10(Math.max(p.x, 0.01)) : p.x; });
    var ys = points.map(function (p) { return p.y; });
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
    var minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    if (minX === maxX) { minX -= 1; maxX += 1; }
    if (minY === maxY) { minY -= 1; maxY += 1; }
    var padX = (maxX - minX) * 0.08, padY = (maxY - minY) * 0.15;
    minX -= padX; maxX += padX; minY -= padY; maxY += padY;
    function sx(v) { return P.l + (v - minX) / (maxX - minX) * (W - P.l - P.r); }
    function sy(v) { return H - P.b - (v - minY) / (maxY - minY) * (H - P.t - P.b); }
    var colors = { "PUMP CONTINUED": "#abed77", "REVERSAL": "#ff758a",
                   "SIDEWAYS": "#819495" };
    var out = '<svg class="chart-svg" viewBox="0 0 ' + W + " " + H +
      '" role="img" aria-label="Scatter: ' + esc(opts.xLabel) +
      ' versus +30m net return">';
    out += '<line class="grid" x1="' + P.l + '" y1="' + sy(0) + '" x2="' +
      (W - P.r) + '" y2="' + sy(0) + '"/>';
    out += '<line class="axis" x1="' + P.l + '" y1="' + P.t + '" x2="' +
      P.l + '" y2="' + (H - P.b) + '"/>';
    out += '<line class="axis" x1="' + P.l + '" y1="' + (H - P.b) +
      '" x2="' + (W - P.r) + '" y2="' + (H - P.b) + '"/>';
    out += '<text x="4" y="' + (sy(maxY) + 3) + '">' + fmtNum(maxY, 0) + '%</text>';
    out += '<text x="4" y="' + (sy(minY) + 3) + '">' + fmtNum(minY, 0) + '%</text>';
    out += '<text x="' + P.l + '" y="' + (H - 6) + '">' +
      (opts.logX ? fmtNum(Math.pow(10, minX), 1) + "×" : fmtNum(minX, 1)) + "</text>";
    out += '<text x="' + (W - P.r) + '" y="' + (H - 6) +
      '" text-anchor="end">' +
      (opts.logX ? fmtNum(Math.pow(10, maxX), 0) + "×" : fmtNum(maxX, 1)) + "</text>";
    out += '<text x="' + (W / 2) + '" y="' + (H - 16) +
      '" text-anchor="middle">' + esc(opts.xLabel) + "</text>";
    points.forEach(function (p) {
      var cx = sx(opts.logX ? Math.log10(Math.max(p.x, 0.01)) : p.x);
      var cy = sy(p.y);
      out += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) +
        '" r="4" fill="' + (colors[p.cls] || "#a3b4b4") +
        '" fill-opacity="0.85"><title>' + esc(p.label) + "</title></circle>";
    });
    out += "</svg>";
    return out;
  }

  /* ---------------------------------------------------------- overview */
  function renderOverview() {
    var ov = DATA.overview;
    var signals = DATA.signals;
    var first = signals.length ? signals[0].signal_ts : null;
    var last = signals.length ? signals[signals.length - 1].signal_ts : null;
    var lastAnalysis = DATA.meta.last_analysis_ts;
    $("hero-meta").textContent =
      (signals.length ? fmtDate(first) + " – " + fmtDate(last) + "  ·  " : "") +
      "research v" + (DATA.meta.research_version || "?") +
      "  ·  last analysis " + (fmtWib(lastAnalysis) || "N/A") + " WIB";

    var overall = ov.overall || {};
    var stats = [
      { label: "Signals analyzed", value: String(ov.n_analyzed == null ? 0 : ov.n_analyzed),
        note: "of " + (ov.n_signals == null ? "?" : ov.n_signals) + " published signals" },
      { label: "Outcomes (+30m)", value: String(ov.n_evaluable_30m == null ? 0 : ov.n_evaluable_30m) + " evaluable",
        note: "signals with a +30m outcome; the rest are pending or lack 1m candles" },
      { label: "Win rate (+30m)", value: overall.win_rate_pct == null ? "N/A" : fmtNum(overall.win_rate_pct, 1) + "%",
        note: "PUMP CONTINUED share, n=" + (ov.n_evaluable_30m == null ? 0 : ov.n_evaluable_30m) },
      { label: "Mean net (+30m)", value: overall.mean_net30_pct == null ? "N/A" : fmtPct(overall.mean_net30_pct, 2),
        note: "after spread + 8 bps fees (simulation, not profit)" },
      { label: "Hypotheses", value: String((ov.hypotheses || []).length),
        note: "0 validated — none has passed the bar yet" },
      { label: "Snapshot coverage", value: ov.snapshot_coverage_pct == null ? "N/A" : fmtNum(ov.snapshot_coverage_pct, 0) + "%",
        note: "signals with a complete analysis snapshot" },
    ];
    $("overview-stats").innerHTML = stats.map(function (s) {
      return '<div class="stat-card card"><p class="stat-label">' + esc(s.label) +
        '</p><p class="stat-value">' + esc(s.value) +
        '</p><p class="stat-note">' + esc(s.note) + "</p></div>";
    }).join("");

    // Per-agent coverage
    var agents = ["breakout", "reversal", "orderflow", "regime", "liquidity"];
    var names = { breakout: "Breakout", reversal: "Reversal",
                  orderflow: "Order Flow", regime: "Market Regime",
                  liquidity: "Liquidity" };
    var cov = ov.per_agent_coverage || {};
    var n = ov.n_analyzed || 1;
    $("agent-coverage").innerHTML = agents.map(function (a) {
      var d = cov[a] || {};
      var ok = d.COMPLETED || 0, part = d["PARTIAL DATA"] || 0,
          miss = (d.UNAVAILABLE || 0) + (d.ERROR || 0) + (d.MISSING || 0);
      return '<div class="cov-row"><span class="cov-name">' + names[a] +
        '</span><span class="cov-bar"><i class="b-ok" style="width:' + (ok / n * 100) +
        '%"></i><i class="b-part" style="width:' + (part / n * 100) +
        '%"></i><i class="b-miss" style="width:' + (miss / n * 100) +
        '%"></i></span><span class="cov-val">' + ok + " / " + part + " / " + miss +
        "</span></div>";
    }).join("") +
      '<div class="cov-legend"><span><i style="background:var(--pos)"></i>Complete</span>' +
      '<span><i style="background:var(--warn)"></i>Partial</span>' +
      '<span><i style="background:var(--neg)"></i>Unavailable / error</span></div>';

    // Regime distribution
    var regimes = ov.regime_distribution || {};
    var order = ["TRENDING_UP", "RANGING", "TRENDING_DOWN"];
    var rlabels = { TRENDING_UP: "BTC trending up", RANGING: "BTC ranging",
                    TRENDING_DOWN: "BTC trending down" };
    var total = order.reduce(function (s, k) { return s + (regimes[k] || 0); }, 0) || 1;
    $("regime-dist").innerHTML = order.map(function (k) {
      var c = regimes[k] || 0;
      return '<div class="cov-row"><span class="cov-name">' + rlabels[k] +
        '</span><span class="cov-bar"><i class="b-ok" style="width:' +
        (c / total * 100) + '%"></i></span><span class="cov-val">' + c +
        " (" + fmtNum(c / total * 100, 0) + "%)</span></div>";
    }).join("");

    // Outcome completeness
    var oc = ov.outcome_completeness || {};
    var horizons = [["h30m", "+30m"], ["h1", "+1H"], ["h4", "+4H"], ["h8", "+8H"]];
    $("outcome-completeness").innerHTML = horizons.map(function (h) {
      var d = oc[h[0]] || {};
      var pct = d.completeness_pct == null ? 0 : d.completeness_pct;
      return '<div class="cov-row"><span class="cov-name">' + h[1] +
        '</span><span class="cov-bar"><i class="b-ok" style="width:' + pct +
        '%"></i></span><span class="cov-val">' + (d.evaluated == null ? 0 : d.evaluated) +
        "/" + (d.mature == null ? 0 : d.mature) + " mature</span></div>";
    }).join("");

    // Hypotheses
    var hyps = ov.hypotheses || [];
    $("hypotheses").innerHTML = hyps.length === 0
      ? '<p class="panel-sub" style="margin:0">No hypothesis is currently being tested. ' +
        'The bar is strict on purpose: n≥10 on both buckets and a ≥2pp mean-net gap, ' +
        'plus out-of-sample validation. With ' + (ov.n_evaluable_30m || 0) +
        ' evaluable outcomes, nothing has cleared it yet.</p>'
      : hyps.map(function (h) {
          return "<p><strong>" + esc(h.feature || "?") + "</strong>: " +
            esc(h.observation || "") + "<br><span class='muted'>" +
            esc(h.status || "") + "</span></p>";
        }).join("");

    // Data quality
    var dq = DATA.data_quality || {};
    var profile = dq.missing_data_profile || {};
    var keys = Object.keys(profile).sort(function (a, b) {
      return (profile[b].missing_pct || 0) - (profile[a].missing_pct || 0);
    });
    var labels = { decisions: "Decisions values", signal_bar: "Signal bar",
      ema20: "EMA20", atr14: "ATR14", macd: "MACD", mtf_1h: "1H context (1m)",
      open_interest: "Open Interest", funding_rate: "Funding rate",
      btc_regime: "BTC regime", breadth: "Market breadth",
      spread: "Spread", impact_10k: "$10k impact", depth: "Top depth" };
    $("data-quality").innerHTML =
      '<ul class="missing-list">' + keys.map(function (k) {
        var p = profile[k];
        return "<li><span>" + esc(labels[k] || k) + "</span><span class='num'>" +
          (p.missing || 0) + "/" + (p.n || 0) + " missing (" +
          fmtNum(p.missing_pct || 0, 0) + "%)</span></li>";
      }).join("") + "</ul>";
  }

  /* ---------------------------------------------------------- signals */
  function signalRowHtml(sig) {
    var cls = clsOf(sig);
    var clsLabel = { "PUMP CONTINUED": ["Continued", "cls-continued"],
      "REVERSAL": ["Reversed", "cls-reversal"],
      "SIDEWAYS": ["Sideways", "cls-sideways"] }[cls] ||
      ["Pending", "cls-pending"];
    return '<button type="button" class="signal-item' +
      (sig.signal_id === SELECTED_ID ? " active" : "") +
      '" data-id="' + esc(sig.signal_id) + '" role="option" aria-selected="' +
      (sig.signal_id === SELECTED_ID) + '"><span><span class="sym">' +
      esc(sig.symbol) + '</span><br><span class="meta">' +
      esc(fmtWib(sig.signal_ts) || "") + ' WIB</span></span><span class="cls ' +
      clsLabel[1] + '">' + clsLabel[0] + "</span></button>";
  }

  function renderSignalList(filter) {
    var list = DATA.signals.slice().reverse();
    if (filter) {
      var q = filter.toLowerCase();
      list = list.filter(function (s) {
        return s.symbol.toLowerCase().indexOf(q) !== -1;
      });
    }
    $("signal-list").innerHTML = list.length ? list.map(signalRowHtml).join("")
      : '<p class="muted" style="padding:8px;font-size:13px">No signals match.</p>';
    Array.prototype.forEach.call(
      $("signal-list").querySelectorAll(".signal-item"), function (el) {
        el.addEventListener("click", function () {
          selectSignal(el.getAttribute("data-id"));
        });
      });
  }

  function agentCard(title, section, kvPairs, extraHtml) {
    if (!section) return "";
    var html = '<div class="agent-card card"><h4>' + esc(title) + " " +
      statusBadge(section.status) + "</h4>";
    if (kvPairs && kvPairs.length) {
      html += '<table class="kv">' + kvPairs.map(function (p) {
        return kvRow(p[0], p[1]);
      }).join("") + "</table>";
    }
    if (extraHtml) html += extraHtml;
    var obs = section.observations || [];
    if (obs.length) {
      html += '<ul class="obs-list">' + obs.slice(0, 4).map(function (o) {
        return '<li class="' + (o.severity === "notable" ? "notable" : "") +
          '">' + esc(o.text) + "</li>";
      }).join("") + "</ul>";
    }
    if (section.notes) {
      html += '<p class="notes">' + esc(section.notes) + "</p>";
    }
    var miss = section.missing || [];
    if (miss.length) {
      html += '<ul class="missing">' + miss.map(function (m) {
        return "<li>" + esc(m) + "</li>";
      }).join("") + "</ul>";
    }
    return html + "</div>";
  }

  function horizonCell(label, h) {
    if (!h || h.status !== "evaluated") {
      var reason = h && h.status === "pending" ? "pending" :
        (h && h.reason ? h.reason : "unavailable");
      return '<div class="outcome-cell"><p class="lbl">' + label +
        '</p><p class="val na">N/A</p><p class="sub">' + esc(reason) + "</p></div>";
    }
    var net = h.net_pct != null ? fmtPct(h.net_pct, 2) : fmtPct(h.return_pct, 2);
    var cls = h.classification || "";
    var color = cls === "PUMP CONTINUED" ? "pos" :
      cls === "REVERSAL" ? "neg" : "";
    var src = h.source === "vision-backfill"
      ? " · backfilled from official Binance archive"
      : (h.source === "local_1m" ? " · recorded live" : "");
    return '<div class="outcome-cell"><p class="lbl">' + label +
      '</p><p class="val ' + color + '">' + esc(net || "—") +
      '</p><p class="sub">' + esc(cls || "") +
      (h.mfe_pct != null ? " · MFE " + fmtPct(h.mfe_pct, 2) : "") +
      (h.mae_pct != null ? " · MAE " + fmtPct(h.mae_pct, 2) : "") + esc(src) + "</p></div>";
  }

  function renderSignalDetail() {
    var sig = DATA.signals.filter(function (s) {
      return s.signal_id === SELECTED_ID;
    })[0] || DATA.signals[DATA.signals.length - 1];
    if (!sig) { $("signal-detail").innerHTML = ""; return; }
    SELECTED_ID = sig.signal_id;
    var d = (sig.snapshot && sig.snapshot.decisions) || {};
    var br = (sig.breakout && sig.breakout.metrics) || {};
    var rv = sig.reversal || {};
    var of = (sig.orderflow && sig.orderflow.metrics) || {};
    var rg = (sig.regime && sig.regime.metrics) || {};
    var lq = (sig.liquidity && sig.liquidity.metrics) || {};
    var oi = of.open_interest || null;
    var fd = of.funding || null;
    var btc = rg.btc || {};
    var breadth = rg.breadth || {};

    var head = '<div class="detail-head card"><h3><span class="sym">' +
      esc(sig.symbol) + '</span> <span class="muted">· ' + esc(sig.market) +
      "</span></h3><p class='detail-meta'>Close " +
      esc(fmtWib(sig.signal_ts) || "") + " WIB · price <span class='num'>" +
      esc(fmtPrice(d.close) || "N/A") + "</span> (" +
      esc(fmtPct(d.chg_4h_pct, 2) || "N/A") + ") · RVOL <span class='num'>" +
      esc(fmtNum(d.rvol, 2) || "N/A") + "×</span> · analyzed " +
      esc(fmtWib(sig.analyzed_ts) || "") + " WIB · research v" +
      esc(sig.research_version || "?") + " " + statusBadge(sig.status) +
      "</p></div>";

    var cards = "";
    var rc = sig.reconstruction || null;
    var rcNote = rc == null ? "" :
      '<p class="notes">1H context is a HISTORICAL RECONSTRUCTION from the official Binance ' +
      "1m archive (" + esc((rc.files || []).join(", ")) + ", method v" +
      esc(rc.method_version || "?") + ") — it is NOT the original live snapshot and is " +
      "used for exploratory research only, never as prospective validation evidence.</p>";
    cards += agentCard("1 · Breakout Intelligence", sig.breakout, [
      ["Body / range", br.body_pct == null ? null : fmtNum(br.body_pct, 0) + "% of range"],
      ["Upper wick", br.upper_wick_pct == null ? null : fmtNum(br.upper_wick_pct, 0) + "%"],
      ["Breakout margin", br.breakout_margin_pct == null ? null : fmtPct(br.breakout_margin_pct, 2)],
      ["EMA 20 / 50 / 500", [fmtPrice(br.ema20), fmtPrice(br.ema50), fmtPrice(br.ema500)].map(function (v) { return v || "N/A"; }).join(" · ")],
      ["EMA aligned (bullish)", br.ema_aligned_bullish == null ? null : (br.ema_aligned_bullish ? "Yes" : "No")],
      ["RSI 4H", br.rsi_4h == null ? null : fmtNum(br.rsi_4h, 1)],
      ["MACD histogram", br.macd_histogram == null ? null : fmtNum(br.macd_histogram, 4) + (br.macd_rising ? " (rising)" : "")],
      ["ATR14", br.atr14_pct == null ? null : fmtNum(br.atr14_pct, 1) + "%"],
      ["Resistance gap", br.resistance_gap_pct == null ? null : fmtPct(br.resistance_gap_pct, 2)],
      ["Consecutive up bars", br.consecutive_up_bars == null ? null : String(br.consecutive_up_bars)],
      ["1H context before signal", rc == null || rc.mtf_1h == null ? null :
        fmtPct(rc.mtf_1h.chg_1h_pct, 2) + " (HISTORICAL RECONSTRUCTION)"],
    ], rcNote);
    var markersHtml = (rv.markers || []).length
      ? '<ul class="obs-list">' + rv.markers.map(function (m) {
          return '<li class="notable">' + esc(m.text) + "</li>";
        }).join("") + "</ul>" : "";
    cards += agentCard("2 · Reversal Intelligence", sig.reversal, [
      ["Risk level (marker count)", rv.risk_level || null],
      ["Markers observed", (rv.markers_observed == null ? null : rv.markers_observed + " / 6")],
      ["Historical context", rv.historical_context && rv.historical_context.n != null
        ? ("n=" + rv.historical_context.n + " similar signals, win " + fmtNum(rv.historical_context.win_rate_pct, 0) + "%")
        : "insufficient historical context"],
    ], markersHtml +
      '<p class="notes">Risk level counts exhaustion markers — it is NOT a probability of reversal.</p>');
    cards += agentCard("3 · Order Flow Intelligence", sig.orderflow, [
      ["Taker-buy", of.taker_buy == null ? null : fmtNum(of.taker_buy, 2)],
      ["Imbalance", of.imbalance == null ? null : fmtNum(of.imbalance, 2)],
      ["Volume delta (signal bar)", of.delta_signal_bar_quote == null ? null : fmtUsd(of.delta_signal_bar_quote) + " (" + fmtPct(of.delta_signal_bar_pct, 1) + ")"],
      ["Cumulative delta (5 prior bars)", of.delta_cum_5bar_before_quote == null ? null : fmtUsd(of.delta_cum_5bar_before_quote)],
      ["Open Interest", oi ? fmtUsd(oi.open_interest_usd) + " (as of " + (fmtWib(oi.asof_ts) || "?") + " WIB)" : null],
      ["OI change 24h", of.oi_chg_24h_pct == null ? null : fmtPct(of.oi_chg_24h_pct, 1)],
      ["Long/short ratio", oi && oi.count_ls_ratio != null ? fmtNum(oi.count_ls_ratio, 2) : null],
      ["Funding rate", fd ? fmtNum(fd.funding_rate_pct, 4) + "% / 8h" : null],
    ]);
    cards += agentCard("4 · Market Regime Intelligence", sig.regime, [
      ["BTC regime", rg.btc_regime || null],
      ["BTC 4H change", btc.chg_4h_pct == null ? null : fmtPct(btc.chg_4h_pct, 2)],
      ["BTC RSI 4H", btc.rsi_4h == null ? null : fmtNum(btc.rsi_4h, 1)],
      ["BTC ATR14", btc.atr14_pct == null ? null : fmtNum(btc.atr14_pct, 1) + "%"],
      ["BTC correlation (60 bars)", rg.btc_correlation_60bar == null ? null : fmtNum(rg.btc_correlation_60bar, 2)],
      ["Breadth: green bars", breadth.pct_green == null ? null : fmtNum(breadth.pct_green, 0) + "% of " + (breadth.n_symbols || "?") + " symbols"],
      ["Breadth: breakouts", breadth.pct_breakout == null ? null : fmtNum(breadth.pct_breakout, 1) + "%"],
      ["Breadth: median 4H change", breadth.median_chg_pct == null ? null : fmtPct(breadth.median_chg_pct, 2)],
    ]);
    var slip = lq.slippage_estimate_bps || {};
    var slipRows = Object.keys(slip).map(function (k) {
      var v = slip[k];
      return k + ": " + fmtPct(v.est_total_bps, 0) +
        (v.bound ? " (upper bound)" : "") + (v.complete === false ? " (book exhausted)" : "");
    }).join(" · ");
    cards += agentCard("5 · Liquidity Intelligence", sig.liquidity, [
      ["Spread", lq.spread_bps == null ? null : fmtNum(lq.spread_bps, 2) + " bps (" + (lq.spread_band || "?") + ")"],
      ["Top depth", lq.top_depth_usd == null ? null : fmtUsd(lq.top_depth_usd) + " (" + (lq.depth_band || "?") + ")"],
      ["$10k impact", lq.impact_bps_10k == null ? null : fmtNum(lq.impact_bps_10k, 1) + " bps (" + (lq.impact_band || "?") + ")"],
      ["Slippage method", lq.slippage_method || null],
      ["Slippage ($1k / $10k / $50k)", slipRows || null],
      ["Bar share of 24h volume", lq.bar_share_of_24h_pct == null ? null : fmtNum(lq.bar_share_of_24h_pct, 0) + "%"],
      ["Book snapshot", (sig.snapshot && sig.snapshot.book_top10 && sig.snapshot.book_top10.present)
        ? "recorded at signal time" : "not recorded (signals before 23 Nov 2026)"],
    ]);
    var pf = sig.performance || {};
    cards += '<div class="agent-card card"><h4>6 · Performance Learning</h4>' +
      '<div class="outcome-grid">' +
      horizonCell("+30m", pf.h30m) + horizonCell("+1H", pf.h1) +
      horizonCell("+4H", pf.h4) + horizonCell("+8H", pf.h8) +
      '</div><p class="notes">+30m comes from the tracker (pre-registered rules). ' +
      "+1H is read from local 1m candles; +4H/+8H from local 4H candles. " +
      "MFE/MAE are the best/worst moves inside each window.</p></div>";

    $("signal-detail").innerHTML = head +
      '<div class="agent-grid">' + cards + "</div>";
  }

  function selectSignal(id) {
    SELECTED_ID = id;
    renderSignalList($("signal-search").value);
    renderSignalDetail();
    watchReveals();
  }

  /* ---------------------------------------------------------- insights */
  function insightMeta(sigCount, evaluable, missingCount, period) {
    return '<p class="insight-meta">Signals: ' + sigCount +
      " · evaluable (+30m): " + evaluable +
      " · missing feature data: " + missingCount +
      " · period: " + esc(period) + "<br>Buckets with n&lt;5 show no " +
      "statistics. Association only — not evidence of causation.</p>";
  }

  function scatterPoints(getX, logX) {
    var pts = [], missing = 0;
    DATA.signals.forEach(function (s) {
      var x = getX(s), y = net30Of(s);
      if (x == null || y == null) { missing += 1; return; }
      pts.push({ x: x, y: y, cls: clsOf(s),
                 label: s.symbol + ": " + fmtPct(y, 2) });
    });
    return { pts: pts, missing: missing };
  }

  function renderInsights() {
    var L = DATA.learnings || {};
    var buckets = L.buckets || {};
    var signals = DATA.signals;
    var period = signals.length
      ? fmtDate(signals[0].signal_ts) + " – " + fmtDate(signals[signals.length - 1].signal_ts)
      : "—";
    var evaluable = (L.n_evaluable_30m == null ? 0 : L.n_evaluable_30m);
    var dec = function (s) { return (s.snapshot && s.snapshot.decisions) || {}; };
    var insights = [];

    function add(title, sub, bucketHtml, scatterHtml, missingCount) {
      insights.push('<div class="insight-card card"><h3>' + esc(title) +
        '</h3><p class="insight-sub">' + esc(sub) + "</p>" + bucketHtml +
        scatterHtml + insightMeta(signals.length, evaluable, missingCount, period) +
        "</div>");
    }

    var s1 = scatterPoints(function (s) { return dec(s).rvol; }, true);
    add("RVOL vs outcome",
      "Does a bigger volume spike mean the pump continues?",
      bucketChart(buckets.rvol, ["<2x", "2-5x", "5-10x", "10x+"]),
      s1.pts.length > 1 ? scatterChart(s1.pts, { xLabel: "RVOL (log scale)", logX: true }) : "",
      s1.missing);
    var s2 = scatterPoints(function (s) { return s.reversal ? s.reversal.markers_observed : null; }, false);
    add("Reversal markers vs outcome",
      "Do exhaustion markers predict reversals? So far the markers show no clear pattern — they stay research variables.",
      bucketChart(buckets.exhaustion_markers, ["0", "1-2", "3+"]),
      s2.pts.length > 1 ? scatterChart(s2.pts, { xLabel: "Exhaustion markers (count)" }) : "",
      s2.missing);
    add("EMA alignment vs outcome",
      "Signals above EMA20 > EMA50 > EMA500 versus the rest.",
      bucketChart(buckets.ema_aligned, ["aligned", "not_aligned"]),
      "", 0);
    add("BTC market regime vs outcome",
      "How signals perform when BTC is trending up, ranging, or trending down.",
      bucketChart(buckets.btc_regime, ["TRENDING_UP", "RANGING", "TRENDING_DOWN"]),
      "", 0);
    var s5 = scatterPoints(function (s) {
      var m = s.orderflow && s.orderflow.metrics;
      return m ? m.oi_chg_24h_pct : null;
    }, false);
    add("Open Interest change vs outcome",
      "Does rising open interest before the signal relate to momentum continuation?",
      bucketChart(buckets.oi_chg_24h_pct, ["falling_-10%+", "flat", "rising_10%+"]),
      s5.pts.length > 1 ? scatterChart(s5.pts, { xLabel: "OI change 24h (%)" }) : "",
      s5.missing);
    var s6 = scatterPoints(function (s) {
      var m = s.orderflow && s.orderflow.metrics;
      return m ? m.imbalance : null;
    }, false);
    add("Order flow imbalance vs outcome",
      "Taker buy/sell imbalance at the signal bar versus the +30m result.",
      bucketChart(buckets.orderflow_imbalance,
        ["sell ≤ −0.10", "balanced", "buy ≥ +0.10"]),
      s6.pts.length > 1 ? scatterChart(s6.pts, { xLabel: "Imbalance (−1 sell … +1 buy)" }) : "",
      s6.missing);
    var s7 = scatterPoints(function (s) { return dec(s).spread_bps; }, false);
    add("Spread vs outcome",
      "Does a wider spread eat the net result after costs?",
      bucketChart(buckets.spread_bps, ["tight_<2", "normal_2-10", "wide_10+"]),
      s7.pts.length > 1 ? scatterChart(s7.pts, { xLabel: "Spread (bps)" }) : "",
      s7.missing);
    var s8 = scatterPoints(function (s) { return dec(s).breakout_margin_pct; }, false);
    add("Breakout strength vs outcome",
      "How far the close cleared the 20-bar high, versus the +30m result.",
      bucketChart(buckets.breakout_strength,
        ["<0.5%", "0.5–2%", "2–5%", "5%+"]),
      s8.pts.length > 1 ? scatterChart(s8.pts, { xLabel: "Breakout margin (%)" }) : "",
      s8.missing);

    $("insight-grid").innerHTML = insights.join("");
  }

  /* ------------------------------------------------- learning (Phase 4) */
  function renderLearning() {
    var L = DATA.learnings || {};
    var hz = L.horizons || {};
    var rows = [["net30", "+30m net (after spread + fees)"],
                ["r1h", "+1H (gross)"], ["r4h", "+4H (gross)"],
                ["r8h", "+8H (gross)"]].map(function (r) {
      var d = hz[r[0]] || {};
      var n = d.n_evaluated == null ? 0 : d.n_evaluated;
      var cell = function (v, dec) {
        return v == null ? "—" : fmtPct(v, dec == null ? 2 : dec);
      };
      return "<tr><td>" + r[1] + "</td><td>" + n + "</td><td>" +
        cell(d.mean_pct) + "</td><td>" + cell(d.median_pct) + "</td><td>" +
        (d.pct_gte_1pct == null ? "—" : fmtNum(d.pct_gte_1pct, 0) + "%") +
        "</td><td>" +
        (d.pct_lte_neg_1pct == null ? "—" : fmtNum(d.pct_lte_neg_1pct, 0) + "%") +
        "</td></tr>";
    }).join("");
    $("learning-horizons").innerHTML =
      '<table class="version-table"><thead><tr><th>Horizon</th><th>n</th>' +
      "<th>Mean</th><th>Median</th><th>≥ +1%</th><th>≤ −1%</th></tr></thead><tbody>" +
      rows + "</tbody></table>" +
      "<p class='panel-sub' style='margin-top:12px'>“Win rate” is only defined for +30m " +
      "(tracker classification). Other horizons show descriptive shares — not win rates. " +
      "Net is simulated only for +30m; longer horizons are gross returns.</p>";

    var out = L.outliers || {};
    var mc = out.max_contributor || {};
    $("learning-outliers").innerHTML = out.mean_pct == null
      ? '<p class="panel-sub" style="margin:0">Not enough evaluable outcomes yet (n&lt;5).</p>'
      : '<ul class="missing-list">' +
        "<li><span>Mean net (+30m)</span><span class='num'>" + fmtPct(out.mean_pct, 2) + "</span></li>" +
        "<li><span>Median net (+30m)</span><span class='num'>" + fmtPct(out.median_pct, 2) + "</span></li>" +
        "<li><span>Trimmed mean (drop top/bottom 10%)</span><span class='num'>" + fmtPct(out.trimmed_mean_10pct_pct, 2) + "</span></li>" +
        "<li><span>Mean without the largest outcome</span><span class='num'>" + fmtPct(out.mean_excluding_max_pct, 2) + "</span></li>" +
        "<li><span>Largest single outcome</span><span class='num'>" + esc(mc.symbol || "—") + " " + fmtPct(mc.net_pct, 2) +
          " (" + fmtNum(mc.share_of_sum_pct, 0) + "% of the total sum)</span></li>" +
        "<li><span>Range (min … max)</span><span class='num'>" + fmtPct(out.min_pct, 2) + " … " + fmtPct(out.max_pct, 2) + "</span></li>" +
        "</ul>" +
        "<p class='panel-sub' style='margin-top:12px'>With n=" + out.n +
        ", one big outcome can dominate the average. Compare the mean with the median and " +
        "the trimmed mean before reading anything into it.</p>";

    var pm = L.per_marker || {};
    var labels = { rsi_overbought: "RSI overbought (≥80)",
      wick_rejection: "Upper wick rejection (≥40%)",
      overextended_atr: "Overextended vs ATR (≥2×)",
      parabolic_3bar: "Parabolic 3-bar (+15%)",
      atr_spike: "ATR spike (≥1.5× median)",
      volume_divergence: "Volume divergence" };
    var mrows = Object.keys(labels).map(function (code) {
      var d = pm[code] || {};
      var fmt = function (s) {
        return s == null ? "n&lt;5 — no stats"
          : "n=" + s.n + " · win " + fmtNum(s.win_rate_pct, 0) + "% · mean " +
            fmtPct(s.mean_net30_pct, 2);
      };
      return "<tr><td>" + labels[code] + "</td><td>" + fmt(d.with) +
        "</td><td>" + fmt(d.without) + "</td></tr>";
    }).join("");
    $("learning-markers").innerHTML =
      '<table class="version-table"><thead><tr><th>Exhaustion marker</th>' +
      "<th>With marker</th><th>Without marker</th></tr></thead><tbody>" +
      mrows + "</tbody></table>" +
      "<p class='panel-sub' style='margin-top:12px'>Markers stay research variables. " +
      "A gap between “with” and “without” at these sample sizes is an observation, " +
      "not evidence that the marker predicts anything.</p>";

    /* --- Phase 4.1: paired horizons (same cohort, gross) --- */
    var ph = L.paired_horizons || {};
    var phz = ph.horizons || {};
    var pcell = function (v) {
      return v == null ? "—" : fmtPct(v, 2);
    };
    var prows = [["r30", "+30m"], ["r1h", "+1H"], ["r4h", "+4H"],
                 ["r8h", "+8H"]].map(function (r) {
      var d = phz[r[0]] || {};
      return "<tr><td>" + r[1] + "</td><td>" + pcell(d.mean_pct) +
        "</td><td>" + pcell(d.median_pct) + "</td><td>" +
        (d.pct_gte_1pct == null ? "—" : fmtNum(d.pct_gte_1pct, 0) + "%") +
        "</td><td>" + pcell(d.mean_mfe_pct) + "</td><td>" +
        pcell(d.mean_mae_pct) + "</td></tr>";
    }).join("");
    var traj = (ph.trajectories || {}).counts || {};
    var tdefs = (ph.trajectories || {}).definitions || {};
    var trows = [["continued", "Continued"], ["reversed", "Reversed"],
                 ["full_reversal", "— of which: full reversal"],
                 ["late_bloom", "Late bloom"],
                 ["never_up", "Never up"]].map(function (r) {
      return "<li><span>" + r[1] +
        (tdefs[r[0]] ? " <span style='color:var(--text-3)'>(" +
          esc(tdefs[r[0]]) + ")</span>" : "") +
        "</span><span class='num'>" + (traj[r[0]] == null ? "—" : traj[r[0]]) +
        "</span></li>";
    }).join("");
    var excl = ph.excluded || {};
    $("learning-paired").innerHTML = ph.n_paired == null || ph.n_paired < 5
      ? '<p class="panel-sub" style="margin:0">Not enough signals with all four horizons evaluated yet (n&lt;5).</p>'
      : "<p class='panel-sub' style='margin:0 0 12px'>Paired cohort: <b>" +
        ph.n_paired + "</b> of " + ph.n_total + " signals, across " +
        (ph.distinct_closes == null ? "?" : ph.distinct_closes) +
        " distinct 4H closes. Excluded: " +
        "no +30m " + (excl.missing_h30m || 0) + ", no +1H " +
        (excl.missing_h1 || 0) + ", no +4H " + (excl.missing_h4 || 0) +
        ", no +8H " + (excl.missing_h8 || 0) +
        " (a signal can miss more than one horizon).</p>" +
        '<table class="version-table"><thead><tr><th>Horizon</th><th>Mean</th>' +
        "<th>Median</th><th>≥ +1%</th><th>Mean MFE</th><th>Mean MAE</th>" +
        "</tr></thead><tbody>" + prows + "</tbody></table>" +
        "<p class='panel-sub' style='margin-top:12px'>MFE/MAE are the average best/worst " +
        "excursions within each horizon (+4H/+8H from 4H-bar extremes, not ticks). " +
        "Gross returns throughout — compare with the +30m net table above, not against it.</p>" +
        "<h4 style='margin:16px 0 4px'>Momentum trajectories</h4>" +
        '<ul class="missing-list">' + trows + "</ul>" +
        (ph.sample_note ? "<p class='panel-sub' style='margin-top:12px'>" +
          esc(ph.sample_note) + "</p>" : "");

    /* --- Phase 4.1: distribution, contributions, mean vs win --- */
    var dist = out.distribution_net30 || {};
    var dkeys = ["<−5%", "−5..−1%", "−1..+1%", "+1..+5%", ">+5%"];
    var drows = dkeys.map(function (k) {
      var c = dist[k] || 0;
      var w = out.n ? Math.round(c / out.n * 100) : 0;
      return "<li><span>" + esc(k) + "</span><span class='num'>" + c +
        " <span style='color:var(--text-3)'>(" + w + "%)</span></span></li>";
    }).join("");
    var contribs = out.contributions || [];
    var maxAbs = 0;
    contribs.forEach(function (c) {
      maxAbs = Math.max(maxAbs, Math.abs(c.net_pct || 0));
    });
    var crows = contribs.map(function (c) {
      var w = maxAbs ? Math.round(Math.abs(c.net_pct) / maxAbs * 100) : 0;
      var col = c.net_pct >= 0 ? "var(--pos)" : "var(--neg)";
      return "<tr><td>" + esc(c.symbol) + "</td><td>" +
        "<div style='background:" + col + ";height:8px;border-radius:99px;width:" +
        w + "%;min-width:2px'></div></td><td>" + fmtPct(c.net_pct, 2) +
        "</td><td>" + (c.share_of_sum_pct == null ? "—" :
          fmtNum(c.share_of_sum_pct, 0) + "%") + "</td></tr>";
    }).join("");
    var mvw = out.mean_vs_win || {};
    $("learning-distribution").innerHTML = out.n == null || out.n < 5
      ? '<p class="panel-sub" style="margin:0">Not enough evaluable outcomes yet (n&lt;5).</p>'
      : "<h4 style='margin:0 0 4px'>Distribution of +30m net outcomes (n=" +
        out.n + ")</h4>" +
        '<ul class="missing-list">' + drows + "</ul>" +
        "<h4 style='margin:16px 0 4px'>Mean vs win rate</h4>" +
        '<ul class="missing-list">' +
        "<li><span>Win rate (+30m)</span><span class='num'>" +
        fmtNum(mvw.win_rate_pct, 1) + "%</span></li>" +
        "<li><span>Mean net</span><span class='num'>" +
        fmtPct(mvw.mean_net_pct, 2) + "</span></li>" +
        "<li><span>Median net</span><span class='num'>" +
        fmtPct(mvw.median_net_pct, 2) + "</span></li></ul>" +
        (mvw.note ? "<p class='panel-sub' style='margin-top:8px'>" +
          esc(mvw.note) + "</p>" : "") +
        "<h4 style='margin:16px 0 4px'>Contribution of every signal to the total</h4>" +
        '<table class="version-table"><thead><tr><th>Signal</th><th></th>' +
        "<th>Net</th><th>Share of sum</th></tr></thead><tbody>" +
        crows + "</tbody></table>" +
        "<p class='panel-sub' style='margin-top:12px'>Shares above 100% mean one signal " +
        "outweighs the entire net sum — the rest of the signals cancel each other out.</p>";

    /* --- Phase 4.1: agent learning evaluation --- */
    var ae = L.agent_evaluation || {};
    var ags = ae.agents || {};
    var verdicts = {
      association: ["Association observed", "var(--pos)"],
      no_clear_association: ["No clear association", "var(--text-3)"],
      consistent: ["Consistent with hypothesis", "var(--pos)"],
      inconsistent: ["Against hypothesis", "var(--neg)"],
      insufficient_data: ["Not enough data", "var(--warn)"],
      no_data: ["No data yet", "var(--warn)"],
      not_evaluable: ["Not evaluable", "var(--text-3)"]
    };
    var agOrder = ["breakout", "reversal", "orderflow", "regime",
                   "liquidity", "performance"];
    var agHtml = agOrder.map(function (key) {
      var ag = ags[key];
      if (!ag) return "";
      var frows = (ag.findings || []).map(function (f) {
        var v = verdicts[f.verdict] || [f.verdict, "var(--text-3)"];
        return "<tr><td>" + esc(f.observation) + "</td><td><span style='color:" +
          v[1] + "'>" + v[0] + "</span></td><td>" + esc(f.detail || "") +
          "</td></tr>";
      }).join("");
      return "<h4 style='margin:16px 0 4px'>" + esc(ag.label) + "</h4>" +
        "<p class='panel-sub' style='margin:0 0 8px'>" + esc(ag.basis || "") +
        "</p>" +
        '<table class="version-table"><thead><tr><th>Observation</th>' +
        "<th>Verdict</th><th>Evidence</th></tr></thead><tbody>" +
        frows + "</tbody></table>";
    }).join("");
    var si = ae.sample_independence || {};
    $("learning-agents").innerHTML =
      "<p class='panel-sub' style='margin:0 0 4px'>Evaluated at n=" +
      (ae.as_of_n_evaluable_30m == null ? "?" : ae.as_of_n_evaluable_30m) +
      " evaluable +30m outcomes. " + esc(ae.anti_lookahead || "") + "</p>" +
      "<p class='panel-sub' style='margin:0 0 4px'>" +
      esc(ae.validation || "") + "</p>" +
      (si.note == null ? "" :
        "<p class='panel-sub' style='margin:0 0 12px'>" + esc(si.note) +
        " The " + (si.n_evaluable == null ? "?" : si.n_evaluable) +
        " evaluable signals come from " +
        (si.distinct_closes_evaluable == null ? "?" : si.distinct_closes_evaluable) +
        " distinct 4H closes; the " +
        (si.n_paired == null ? "?" : si.n_paired) + " paired signals from " +
        (si.distinct_closes_paired == null ? "?" : si.distinct_closes_paired) + ".</p>") +
      agHtml;

    /* --- Phase 4.1: case examples (BULLA / IDOL) --- */
    var cases = out.case_examples || [];
    var caseRows = cases.map(function (c) {
      var cell = function (v) {
        return v == null ? "—" : fmtPct(v, 2);
      };
      return "<tr><td>" + esc(c.symbol) + "<br><span style='color:var(--text-3)'>" +
        esc(fmtWib(c.signal_ts) || "") + " WIB</span></td><td>" +
        cell(c.net30_pct) + "</td><td>" + cell(c.r1h_pct) + "</td><td>" +
        cell(c.r4h_pct) + "</td><td>" + cell(c.r8h_pct) + "</td><td>" +
        cell(c.mfe30_pct) + " / " + cell(c.mae30_pct) + "</td></tr>";
    }).join("");
    var bullas = cases.filter(function (c) {
      return c.symbol === "BULLAUSDT" && c.r8h_pct != null; });
    var idols = cases.filter(function (c) {
      return c.symbol === "IDOLUSDT" && c.r8h_pct != null; });
    var caseNote = "Same rule set, opposite paths — that is why single " +
      "examples never justify a strategy change.";
    if (bullas.length && idols.length) {
      var bBest = bullas.reduce(function (a, b) {
        return a.r8h_pct > b.r8h_pct ? a : b; });
      var iWorst = idols.reduce(function (a, b) {
        return a.r8h_pct < b.r8h_pct ? a : b; });
      caseNote = "BULLA's best +8H: " + fmtPct(bBest.r8h_pct, 2) +
        "; IDOL's worst +8H: " + fmtPct(iWorst.r8h_pct, 2) + ". " + caseNote;
    }
    $("learning-cases").innerHTML = cases.length === 0
      ? '<p class="panel-sub" style="margin:0">No BULLA/IDOL outcomes evaluated yet.</p>'
      : '<div style="overflow-x:auto"><table class="version-table">' +
        "<thead><tr><th>Signal</th><th>+30m net</th>" +
        "<th>+1H</th><th>+4H</th><th>+8H</th><th>MFE / MAE (+30m)</th>" +
        "</tr></thead><tbody>" + caseRows + "</tbody></table></div>" +
        "<p class='panel-sub' style='margin-top:12px'>" + caseNote + "</p>";

    /* --- Phase 4.2: learning summary (auto-generated) --- */
    var sum = L.learning_summary || {};
    var sumList = function (items, empty) {
      if (!items || items.length === 0) {
        return '<p class="panel-sub" style="margin:0 0 8px">' + empty + "</p>";
      }
      return "<ul class='missing-list'>" + items.map(function (it) {
        return "<li><span>" + esc(it.text) + "</span></li>";
      }).join("") + "</ul>";
    };
    var topics = sum.topics || {};
    var topicRows = Object.keys(topics).map(function (k) {
      var t = topics[k] || {};
      var badge = t.status === "observed" ? "var(--pos)"
        : t.status === "mixed" ? "var(--warn)" : "var(--text-3)";
      return "<tr><td>" + esc(t.label || k) + "</td><td>" +
        '<span style="color:' + badge + '">' + esc(t.status || "—") +
        "</span></td><td>" + esc(t.detail || "—") + "</td></tr>";
    }).join("");
    $("learning-summary").innerHTML =
      "<h4 style='margin:0 0 8px'>Monitored topics</h4>" +
      '<div style="overflow-x:auto"><table class="version-table">' +
      "<thead><tr><th>Topic</th><th>Status</th><th>Current read</th></tr></thead><tbody>" +
      topicRows + "</tbody></table></div>" +
      "<h4 style='margin:16px 0 8px'>What holds up</h4>" +
      sumList(sum.worked, "Nothing has met the bar yet — no finding is presented as working.") +
      "<h4 style='margin:16px 0 8px'>What failed to hold</h4>" +
      sumList(sum.failed, "No tested pattern has failed yet.") +
      "<h4 style='margin:16px 0 8px'>What changed since the previous evaluation</h4>" +
      sumList(sum.changed, "No material change recorded.") +
      "<h4 style='margin:16px 0 8px'>Not yet concludable</h4>" +
      sumList(sum.inconclusive, "Everything evaluated has a verdict.") +
      "<p class='panel-sub' style='margin-top:12px'>Based on " +
      ((sum.based_on || {}).n_evaluable_30m || 0) + " evaluable +30m outcomes and " +
      ((sum.based_on || {}).n_paired || 0) + " paired-cohort signals. " +
      "“What holds up” lists exploratory associations only — nothing here is a predictive claim.</p>";

    /* --- Phase 4.2: research checkpoints --- */
    var cps = L.checkpoints || {};
    var cur = cps.current_n_paired == null ? 0 : cps.current_n_paired;
    var nxt = cps.next_threshold;
    var pct = nxt == null ? 100 : Math.min(100, Math.round(cur / nxt * 100));
    var reachedRows = (cps.reached || []).map(function (r) {
      return "<li><span>Checkpoint " + r.threshold + " signals</span><span class='num'>" +
        fmtDate(r.reached_ts) + "</span></li>";
    }).join("");
    var pairedCloses = (L.clusters || {}).n_paired_closes;
    $("learning-checkpoints").innerHTML =
      "<ul class='missing-list'>" +
      "<li><span>Complete outcomes (paired cohort)</span><span class='num'>" + cur + "</span></li>" +
      "<li><span>Distinct 4H closes behind them</span><span class='num'>" +
        (pairedCloses == null ? "—" : pairedCloses) + "</span></li>" +
      "<li><span>Next checkpoint</span><span class='num'>" +
        (nxt == null ? "all reached" : nxt + " signals (" + pct + "%)") + "</span></li>" +
      "</ul>" +
      '<div class="cov-bar" style="margin:12px 0"><i style="width:' + pct + '%"></i></div>' +
      (reachedRows === ""
        ? '<p class="panel-sub" style="margin:0">No checkpoint reached yet — the first is at 40 complete outcomes.</p>'
        : "<ul class='missing-list'>" + reachedRows + "</ul>");

    /* --- Phase 4.2: hypothesis registry --- */
    var reg = L.hypothesis_registry || {};
    var entries = reg.entries || [];
    var split = reg.split;
    var regRows = entries.map(function (e) {
      var v = e.validation || {};
      var st = e.status === "validated" ? "var(--pos)"
        : e.status === "rejected" ? "var(--neg)" : "var(--warn)";
      return "<tr><td>" + esc(e.id) + "</td><td>" + esc(e.text || "") +
        "</td><td><span style='color:" + st + "'>" + esc(e.status) +
        "</span></td><td>" + (v.verdict == null ? "—" : esc(v.verdict) +
        " (n " + v.n_best + " vs " + v.n_worst + ")") + "</td></tr>";
    }).join("");
    $("learning-registry").innerHTML =
      (split == null
        ? '<p class="panel-sub" style="margin:0 0 12px">' +
          esc(reg.split_pending_note || "Exploration/validation split not frozen yet.") + "</p>"
        : '<p class="panel-sub" style="margin:0 0 12px">Split frozen ' + fmtDate(split.frozen_ts) +
          " — first " + split.discovery_n + " evaluable signals are the discovery set.</p>") +
      (entries.length === 0
        ? '<p class="panel-sub" style="margin:0">No hypothesis has passed the sample bar yet (n≥10 both buckets + ≥2pp gap). When one does, it is recorded here frozen, before any new data tests it.</p>'
        : '<div style="overflow-x:auto"><table class="version-table">' +
          "<thead><tr><th>ID</th><th>Hypothesis (frozen at registration)</th>" +
          "<th>Status</th><th>Validation on newer data</th></tr></thead><tbody>" +
          regRows + "</tbody></table></div>");

    /* --- OLV: close clusters (signals grouped by 4H close) --- */
    var cl = L.clusters || {};
    var conc = cl.concentration || {};
    var nRecon = DATA.signals.filter(function (s) {
      return s.reconstruction != null;
    }).length;
    var clRows = (cl.outcome_by_close || []).map(function (c) {
      return "<tr><td>" + esc(fmtWib(c.close_ts) || "?") + " WIB</td><td>" +
        c.n_signals + "</td><td>" + c.n_evaluable + "</td><td>" +
        c.wins + "</td><td>" + fmtPct(c.mean_net30_pct, 2) + "</td><td>" +
        fmtPct(c.mean_r30_pct, 2) + "</td></tr>";
    }).join("");
    $("learning-clusters").innerHTML =
      "<ul class='missing-list'>" +
      "<li><span>Signals evaluated (+30m net)</span><span class='num'>" +
        (cl.n_evaluable == null ? "—" : cl.n_evaluable) + "</span></li>" +
      "<li><span>Unique 4H closes (all signals)</span><span class='num'>" +
        (cl.n_unique_closes == null ? "—" : cl.n_unique_closes) + "</span></li>" +
      "<li><span>Unique 4H closes (evaluable)</span><span class='num'>" +
        (cl.n_evaluable_closes == null ? "—" : cl.n_evaluable_closes) + "</span></li>" +
      "<li><span>Largest single close</span><span class='num'>" +
        (conc.largest_close_n == null ? "—" : conc.largest_close_n + " signals (" +
          fmtNum(conc.largest_close_share_pct, 1) + "%)") + "</span></li>" +
      "<li><span>Top 3 closes combined</span><span class='num'>" +
        (conc.top3_close_share_pct == null ? "—" : fmtNum(conc.top3_close_share_pct, 1) + "% of all signals") + "</span></li>" +
      "<li><span>1H context reconstructed</span><span class='num'>" +
        nRecon + "/" + DATA.signals.length +
        " signals (HISTORICAL RECONSTRUCTION)</span></li>" +
      "</ul>" +
      '<div style="overflow-x:auto;margin-top:12px"><table class="version-table">' +
      "<thead><tr><th>4H close (WIB)</th><th>Signals</th><th>Evaluable</th>" +
      "<th>Wins</th><th>Mean net +30m</th><th>Mean gross +30m</th></tr></thead><tbody>" +
      clRows + "</tbody></table></div>" +
      "<p class='panel-sub' style='margin-top:12px'>" + esc(cl.note || "") +
      " The exploration/validation split keeps whole closes together, so no close " +
      "is ever split between the two sets.</p>";
  }

  /* ---------------------------------------------------------- timeline */
  function renderTimeline() {
    $("milestones").innerHTML = (DATA.timeline || []).map(function (m) {
      return "<li><span class='t-date'>" + esc(m.date) + "</span><h4>" +
        esc(m.title) + "</h4><p>" + esc(m.text) + "</p></li>";
    }).join("");

    var versions = DATA.versions || [];
    var rows = versions.map(function (v) {
      if (v.n_records == null) {
        return "<tr><td>" + esc(v.version) + "</td><td colspan='4' style='font-family:var(--font-sans)'>" +
          esc(v.note || "No archive available.") + "</td></tr>";
      }
      return "<tr><td>v" + esc(v.version) + "</td><td>" + v.n_records +
        "</td><td>" + v.oi_coverage + "/" + v.n_records +
        "</td><td>" + v.funding_coverage + "/" + v.n_records +
        "</td><td>" + v.bands_coverage + "/" + v.n_records + "</td></tr>";
    }).join("");
    $("version-compare").innerHTML =
      '<table class="version-table"><thead><tr><th>Version</th><th>Records</th>' +
      "<th>OI</th><th>Funding</th><th>Depth bands</th></tr></thead><tbody>" +
      rows + "</tbody></table>" +
      "<p class='panel-sub' style='margin-top:12px'>Coverage counts grow as archive files publish — " +
      "the same analysis record gains OI the next day and funding the next month.</p>";

    var recos = [];
    var dq = DATA.data_quality || {};
    var prof = dq.missing_data_profile || {};
    var nEval = DATA.overview.n_evaluable_30m || 0;
    if ((prof.funding_rate || {}).missing === (prof.funding_rate || {}).n) {
      recos.push("<strong>Funding rate arrives in December.</strong> The monthly archive file " +
        "will fill the funding bucket automatically — no action needed, just patience.");
    }
    if ((prof.open_interest || {}).missing > 0) {
      recos.push("<strong>Open Interest coverage is still filling in</strong> (" +
        ((prof.open_interest || {}).missing || 0) + " signals missing). Daily archive files " +
        "publish a day late; the pipeline retries automatically.");
    }
    var oc = DATA.overview.outcome_completeness || {};
    if ((oc.h1 || {}).completeness_pct != null && oc.h1.completeness_pct < 100) {
      recos.push("<strong>The +1H horizon is still filling in</strong> (" +
        fmtNum(oc.h1.completeness_pct, 0) + "% complete). Evaluated horizons are now sticky, " +
        "and the daily backfill recovers the rest from the official Binance archive as each " +
        "day's file publishes — backfilled outcomes are labeled as such.");
    }
    if ((DATA.overview.hypotheses || []).length === 0) {
      recos.push("<strong>Keep accumulating outcomes.</strong> With n=" + nEval +
        " evaluable signals, no hypothesis has passed the bar (n≥10 both buckets + ≥2pp gap). " +
        "The system is working as designed — it refuses to invent patterns from small samples.");
    }
    var regimes = DATA.overview.regime_distribution || {};
    if (!regimes.TRENDING_UP) {
      recos.push("<strong>No signal has fired in a BTC uptrend yet.</strong> The regime " +
        "comparison is one-sided until the market turns — treat the TRENDING_DOWN vs RANGING " +
        "contrast as provisional.");
    }
    recos.push("<strong>Reversal markers stay research variables.</strong> Early results show " +
      "no clear predictive pattern; changing or dropping markers on " + nEval +
      " outcomes would be overfitting.");
    $("recommendations").innerHTML = recos.map(function (r) {
      return "<li>" + r + "</li>";
    }).join("");
  }

  /* ---------------------------------------------------------- explorer */
  function explorerValue(sig, key) {
    var d = (sig.snapshot && sig.snapshot.decisions) || {};
    var m = (sig.orderflow && sig.orderflow.metrics) || {};
    var rg = (sig.regime && sig.regime.metrics) || {};
    switch (key) {
      case "symbol": return sig.symbol;
      case "signal_ts": return sig.signal_ts;
      case "price": return d.close;
      case "net30": return net30Of(sig);
      case "r4h": return r4hOf(sig);
      case "rvol": return d.rvol;
      case "markers": return sig.reversal ? sig.reversal.markers_observed : null;
      case "regime": return rg.btc_regime;
      case "oi": return m.oi_chg_24h_pct;
      case "spread": return d.spread_bps;
      default: return null;
    }
  }

  function renderExplorer() {
    var q = ($("explorer-search").value || "").toLowerCase();
    var outF = $("explorer-outcome").value;
    var regF = $("explorer-regime").value;
    var rows = DATA.signals.filter(function (s) {
      if (q && s.symbol.toLowerCase().indexOf(q) === -1) return false;
      if (outF) {
        var c = clsOf(s);
        if (outF === "__pending__") { if (c) return false; }
        else if (c !== outF) return false;
      }
      if (regF) {
        var rg = (s.regime && s.regime.metrics) || {};
        if (rg.btc_regime !== regF) return false;
      }
      return true;
    });
    rows.sort(function (a, b) {
      var va = explorerValue(a, EXPLORER_SORT.key);
      var vb = explorerValue(b, EXPLORER_SORT.key);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      var cmp = typeof va === "string" ? va.localeCompare(vb) : va - vb;
      return cmp * EXPLORER_SORT.dir;
    });
    $("explorer-count").textContent = rows.length + " of " + DATA.signals.length + " signals";
    $("explorer-empty").hidden = rows.length > 0;
    $("explorer-body").innerHTML = rows.map(function (s) {
      var d = (s.snapshot && s.snapshot.decisions) || {};
      var m = (s.orderflow && s.orderflow.metrics) || {};
      var rg = (s.regime && s.regime.metrics) || {};
      var net = net30Of(s), r4h = r4hOf(s);
      var dots = ["breakout", "reversal", "orderflow", "regime", "liquidity"].map(function (a) {
        var st = s[a] && s[a].status;
        var cls = st === "COMPLETED" ? "dot-ok" :
          st === "PARTIAL DATA" ? "dot-part" : "dot-miss";
        return '<i class="' + cls + '" title="' + esc(a) + ": " + esc(st || "?") + '"></i>';
      }).join("");
      return '<tr data-id="' + esc(s.signal_id) + '"><td>' + esc(s.symbol) +
        "</td><td>" + esc(fmtWib(s.signal_ts) || "—") +
        "</td><td>" + esc(fmtPrice(d.close) || "—") +
        "</td><td class='" + (net == null ? "" : net >= 0 ? "pos" : "neg") + "'>" +
        (net == null ? '<span class="na">N/A</span>' : fmtPct(net, 2)) +
        "</td><td class='" + (r4h == null ? "" : r4h >= 0 ? "pos" : "neg") + "'>" +
        (r4h == null ? '<span class="na">N/A</span>' : fmtPct(r4h, 2)) +
        "</td><td>" + (d.rvol == null ? "—" : fmtNum(d.rvol, 2) + "×") +
        "</td><td>" + ((s.reversal && s.reversal.markers_observed) == null ? "—" : s.reversal.markers_observed + "/6") +
        "</td><td>" + esc(rg.btc_regime || "—") +
        "</td><td>" + (m.oi_chg_24h_pct == null ? '<span class="na">N/A</span>' : fmtPct(m.oi_chg_24h_pct, 1)) +
        "</td><td>" + (d.spread_bps == null ? "—" : fmtNum(d.spread_bps, 1) + " bps") +
        '</td><td><span class="agent-dots">' + dots + "</span></td></tr>";
    }).join("");
    Array.prototype.forEach.call(
      $("explorer-body").querySelectorAll("tr"), function (el) {
        el.addEventListener("click", function () {
          selectSignal(el.getAttribute("data-id"));
          document.getElementById("signals").scrollIntoView({ behavior: "smooth" });
        });
      });
    Array.prototype.forEach.call(
      $("explorer-table").querySelectorAll("th[data-sort]"), function (th) {
        var key = th.getAttribute("data-sort");
        var base = th.textContent.replace(/ [▲▼]$/, "");
        th.innerHTML = esc(base) + (EXPLORER_SORT.key === key
          ? ' <span class="arrow">' + (EXPLORER_SORT.dir === 1 ? "▲" : "▼") + "</span>" : "");
      });
  }

  /* -------------------------------------------------- rail spy + reveal (v33) */
  function initRailSpy() {
    var links = Array.prototype.slice.call(
      document.querySelectorAll(".rail-link[data-section]"));
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = {};
    links.forEach(function (l) { map[l.getAttribute("data-section")] = l; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var link = map[en.target.id];
        if (!link) return;
        links.forEach(function (l) { l.classList.toggle("active", l === link); });
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  var revealIO = null;
  function watchReveals() {
    if (!("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!revealIO) {
      revealIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add("is-in-view");
          revealIO.unobserve(en.target);
        });
      }, { threshold: 0.08, rootMargin: "0px 0px -4% 0px" });
    }
    var els = document.querySelectorAll(
      ".section, .panel, .stat-card, .insight-card, .agent-card, .detail-head");
    Array.prototype.forEach.call(els, function (el) {
      if (el.classList.contains("reveal")) return;
      el.classList.add("reveal");
      revealIO.observe(el);
    });
  }

  /* ---------------------------------------------------------- boot */
  function showError() {
    $("loading").hidden = true;
    $("load-error").hidden = false;
    $("empty-state").hidden = true;
    $("app").hidden = true;
  }

  function boot(data) {
    DATA = data;
    if (!data.signals || data.signals.length === 0) {
      $("loading").hidden = true;
      $("empty-state").hidden = false;
      return;
    }
    SELECTED_ID = data.signals[data.signals.length - 1].signal_id;
    renderOverview();
    renderSignalList("");
    renderSignalDetail();
    renderInsights();
    renderLearning();
    renderTimeline();
    renderExplorer();
    $("loading").hidden = true;
    $("app").hidden = false;
    initRailSpy();
    watchReveals();
  }

  function load() {
    $("loading").hidden = false;
    $("load-error").hidden = true;
    fetch("research.json", { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(boot)
      .catch(function () { showError(); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    $("retry-load").addEventListener("click", load);
    $("signal-search").addEventListener("input", function () {
      renderSignalList(this.value);
    });
    $("explorer-search").addEventListener("input", renderExplorer);
    $("explorer-outcome").addEventListener("change", renderExplorer);
    $("explorer-regime").addEventListener("change", renderExplorer);
    Array.prototype.forEach.call(
      $("explorer-table").querySelectorAll("th[data-sort]"), function (th) {
        th.addEventListener("click", function () {
          var key = th.getAttribute("data-sort");
          if (EXPLORER_SORT.key === key) EXPLORER_SORT.dir *= -1;
          else { EXPLORER_SORT.key = key; EXPLORER_SORT.dir = -1; }
          renderExplorer();
        });
      });
    load();
  });
})();
