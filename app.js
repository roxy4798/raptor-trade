// Raptor Trade table/modal layer (Raka) — BUILD-OWNED EDITS by Jenni, 23 Nov 2026:
//  * renderRows appends a Live price cell per row (live-prices.js fills it).
//  * Empty-state colspan 9 -> 10 (Live column). Modal gains a Live Price
//    metric row after Close Price. See JENNI-CHANGES.md.
//  * v36 (23 Nov 2026): renderRows groups rows by 4H close when sorted by
//    close_ts (default): collapsible close-group headers with mini-stats,
//    25 rows per group + Show all / Show less. Other sorts render flat, as
//    before. Exposes window.RaptorDensity (revealSignal/expandAll/
//    collapseAll/getState) for the DDT overlay + verification suites.
(function(){
"use strict";
var DATA = window.RAPTOR_DATA || {signals:[]};
var I18N = window.RaptorLang || {t:function(k){return k;}, get:function(){return 'en';}, useWIB:function(){return false;}, onChange:function(){}};
var SIGNALS = {};
DATA.signals.forEach(function(s){ SIGNALS[s.signal_id] = s; });
var LATEST_TS = DATA.signals.length ? Math.max.apply(null, DATA.signals.map(function(s){ return s.close_ts; })) : null;
var currentModalSid = null;

var cdEl = document.getElementById("countdown");
function pad(n){ return (n<10?"0":"")+n; }
function tick(){
  if(!cdEl) return;
  var now = new Date();
  var utcH = now.getUTCHours();
  var nextH = (Math.floor(utcH/4)+1)*4;
  var next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0,0,0,0));
  if(nextH >= 24){ next.setUTCDate(next.getUTCDate()+1); nextH -= 24; }
  next.setUTCHours(nextH);
  var diff = Math.max(0, next - now);
  var h = Math.floor(diff/3600000), m = Math.floor(diff%3600000/60000), s = Math.floor(diff%60000/1000);
  cdEl.textContent = pad(h)+":"+pad(m)+":"+pad(s);
}
tick(); setInterval(tick, 1000);

var tbody = document.getElementById("signal-rows");
var sortState = {key:"close_ts", dir:-1};
var tableSearch = "", tableFilter = "all";

/* ---- v36 close grouping (build-owned) ----
   Groups apply only in the default close_ts sort; any other column sort
   renders the flat list, as before — grouping by close under a different
   sort would be incoherent. Collapse/expand state lives here so it
   survives every applyTable() re-render. */
var GROUP_PAGE = 25;
var collapsedGroups = {};   // close_ts -> true (group hidden); default: all but latest
var expandedGroups = {};    // close_ts -> true (show all rows, not just GROUP_PAGE)
var groupDefaultsDone = false;
var GROUP_T = {
  en: {signals:"signals", continued:"continued", reversed:"reversed", mean:"mean",
       showAll:"Show all", showLess:"Show less", of:"of"},
  id: {signals:"sinyal", continued:"lanjut", reversed:"berbalik", mean:"rata-rata",
       showAll:"Tampilkan semua", showLess:"Tampilkan lebih sedikit", of:"dari"}
};
function groupT(k){ return (GROUP_T[I18N.get()==="id"?"id":"en"]||GROUP_T.en)[k]||GROUP_T.en[k]||k; }
function groupStats(list){
  var cont=0, rev=0, nets=[];
  list.forEach(function(s){
    var c = s.tracker && s.tracker.classification;
    if(c==="PUMP CONTINUED") cont++;
    else if(c==="REVERSAL") rev++;
    if(s.tracker && s.tracker.net!==null && s.tracker.net!==undefined) nets.push(s.tracker.net*100);
  });
  var mean = nets.length ? nets.reduce(function(a,b){return a+b;},0)/nets.length : null;
  return {n:list.length, cont:cont, rev:rev, mean:mean};
}
function groupHeadHtml(ts, st, collapsed, closeStr){
  var stats = "";
  if(st.mean!==null) stats = ' &middot; <span class="gh-stat">'+st.cont+' '+groupT("continued")+'</span> &middot; <span class="gh-stat">'+st.rev+' '+groupT("reversed")+'</span> &middot; <span class="gh-stat">'+groupT("mean")+' '+(st.mean>=0?"+":"")+st.mean.toFixed(2)+'%</span>';
  return '<tr class="close-group-head" data-close-ts="'+ts+'"><td colspan="10"><button type="button" class="close-group-toggle" aria-expanded="'+(!collapsed)+'" data-close-ts="'+ts+'"><span class="gh-chev">'+(collapsed?"▸":"▾")+'</span><span class="gh-close">'+closeStr+'</span><span class="gh-count">'+st.n+' '+groupT("signals")+'</span>'+stats+'</button></td></tr>';
}
var SORT_KEYS = { "symbol": function(s){ return s.symbol; }, "close_ts": function(s){ return s.close_ts; }, "price": function(s){ return s.price; }, "chg_4h": function(s){ return s.chg_4h; }, "rvol": function(s){ return s.rvol; }, "breakout_margin": function(s){ return s.breakout_margin; }, "rsi_4h": function(s){ return s.rsi_4h; }, "r30": function(s){ return s.tracker ? s.tracker.r30 : null; } };
function glyph(v){ if(v===null||v===undefined) return ""; if(v>0) return "▲ "; if(v<0) return "▼ "; return "— "; }
function fmtPct(v){ if(v===null||v===undefined) return I18N.t('na'); return (v>=0?"+":"")+v.toFixed(2)+"%"; }
function fmtPctG(v){ if(v===null||v===undefined) return I18N.t('na'); if(v===0) return "— 0.00%"; return glyph(v)+fmtPct(v); }
function fmtPctFracG(v){ if(v===null||v===undefined) return I18N.t('na'); return fmtPctG(v*100); }
function fmtPrice(v){ if(v===null||v===undefined) return I18N.t('na'); if(Math.abs(v)>=10000) return v.toLocaleString("en-US",{maximumFractionDigits:0}); if(Math.abs(v)>=100) return v.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}); return String(Number(v.toPrecision(6))); }
function clsOf(v){ if(v===null||v===undefined) return "na"; return v>=0 ? "up" : "down"; }
function badgeInfo(c){ var map = {"PUMP CONTINUED":[I18N.t('badgeGood'),"good"], "REVERSAL":[I18N.t('badgeBad'),"bad"], "SIDEWAYS":[I18N.t('badgeNeutral'),"neutral"], "INSUFFICIENT DATA":[I18N.t('badgeWarn'),"warn"]}; return map[c] || [I18N.t('badgeUnknown'),"neutral"]; }
function badgeOf(c){ var e=badgeInfo(c); return '<span class="badge '+e[1]+'">'+e[0]+'</span>'; }
function closeCellHtml(s){ return I18N.useWIB() ? '<span class="close-wib">'+s.close_wib+' WIB</span>' : '<span class="close-utc">'+s.close_utc+' UTC</span>'; }
function closeText(s){ return I18N.useWIB() ? (s.close_wib+' WIB') : (s.close_utc+' UTC'); }
function rowHtml(s){
    var t = s.tracker;
    var r30 = (t && t.r30!==null && t.r30!==undefined) ? fmtPctFracG(t.r30) : I18N.t('na');
    var r30c = (t && t.r30!==null && t.r30!==undefined) ? clsOf(t.r30*100) : "na";
    var latest = (s.close_ts === LATEST_TS) ? ' class="latest"' : "";
    return '<tr data-sid="'+s.signal_id+'" tabindex="0" role="button" aria-label="Details '+s.symbol+'"'+latest+'>'
      +'<td class="sym"><span class="sym-name">'+s.symbol+'</span><span class="sym-mkt">'+s.market+'</span></td>'
      +'<td class="num">'+closeCellHtml(s)+'</td>'
      +'<td class="num" data-sort="'+s.price+'">'+fmtPrice(s.price)+'</td>'
      +'<td class="num '+clsOf(s.chg_4h)+'" data-sort="'+s.chg_4h+'">'+fmtPctG(s.chg_4h)+'</td>'
      +'<td class="num" data-sort="'+(s.rvol??'')+'">'+(s.rvol===null||s.rvol===undefined?I18N.t('na'):s.rvol.toFixed(2)+"x")+'</td>'
      +'<td class="num '+clsOf(s.breakout_margin)+'" data-sort="'+(s.breakout_margin??'')+'">'+fmtPctG(s.breakout_margin)+'</td>'
      +'<td class="num" data-sort="'+(s.rsi_4h??'')+'">'+(s.rsi_4h===null||s.rsi_4h===undefined?I18N.t('na'):s.rsi_4h.toFixed(1))+'</td>'
      +'<td class="num '+r30c+'" data-sort="'+(t&&t.r30!=null?t.r30*100:'')+'">'+r30+'</td>'
      +'<td>'+badgeOf(t ? t.classification : null)+'</td>'
      +'<td class="live-cell num" data-live-symbol="'+s.symbol+'" data-live-market="'+s.market+'" data-live-close="'+(s.price??'')+'"><span class="live-dot connecting"></span><span class="live-price">\u2026</span></td></tr>';
}
function renderRows(list){
  if(!list.length){ tbody.innerHTML = '<tr class="empty-state"><td class="no-results" colspan="10">'+(I18N.get()==='id'?'Tidak ada sinyal yang cocok. Coba simbol atau filter lain.':'No signals match this search. Try another symbol or filter.')+'</td></tr>'; return; }
  if(sortState.key !== "close_ts"){ tbody.innerHTML = list.map(rowHtml).join(""); return; }
  /* Grouped by close (default sort only). The list is already close_ts
     desc, so groups are contiguous. */
  var filtering = tableSearch !== "" || tableFilter !== "all";
  var groups = [], cur = null;
  list.forEach(function(s){
    if(!cur || cur.ts !== s.close_ts){ cur = {ts:s.close_ts, rows:[]}; groups.push(cur); }
    cur.rows.push(s);
  });
  var latestTs = groups.length ? groups[0].ts : null;
  var html = "";
  groups.forEach(function(g){
    var collapsed = filtering ? false : (collapsedGroups[g.ts]!==undefined ? collapsedGroups[g.ts] : (g.ts !== latestTs));
    html += groupHeadHtml(g.ts, groupStats(g.rows), collapsed, closeText(g.rows[0]));
    if(collapsed) return;
    var showAll = !!expandedGroups[g.ts];
    var shown = showAll ? g.rows : g.rows.slice(0, GROUP_PAGE);
    html += shown.map(rowHtml).join("");
    if(g.rows.length > GROUP_PAGE){
      html += '<tr class="close-group-more" data-close-ts="'+g.ts+'"><td colspan="10"><button type="button" class="close-group-more-btn" data-close-ts="'+g.ts+'">'
        + (showAll ? groupT("showLess") : groupT("showAll")+" "+g.rows.length+" ("+shown.length+" "+groupT("of")+" "+g.rows.length+")")
        + '</button></td></tr>';
    }
  });
  tbody.innerHTML = html;
}
function applyTable(){
  var fn = SORT_KEYS[sortState.key];
  var list = DATA.signals.filter(function(s){
    var q = (s.symbol + " " + s.market).toLowerCase();
    var cl = s.tracker && s.tracker.classification;
    return q.indexOf(tableSearch) !== -1 && (tableFilter === "all" || (tableFilter === "evaluated" && !!s.tracker && s.tracker.r30 !== null && s.tracker.r30 !== undefined) || (tableFilter === "insufficient" && (!s.tracker || cl === "INSUFFICIENT DATA")));
  });
  list.sort(function(a,b){ var va=fn(a), vb=fn(b); if(va===null||va===undefined) return vb===null||vb===undefined ? 0 : 1; if(vb===null||vb===undefined) return -1; if(typeof va === "string") return sortState.dir * va.localeCompare(vb); return sortState.dir * (va-vb); });
  renderRows(list);
  var results = document.getElementById("results-label"); if(results) results.textContent = list.length + " / " + DATA.signals.length + " " + I18N.t('results');
  document.querySelectorAll("th[data-sort]").forEach(function(th){ var active = th.getAttribute("data-sort") === sortState.key; th.querySelector(".arrow").textContent = active ? (sortState.dir===1 ? " ▲" : " ▼") : ""; th.setAttribute("aria-sort", active ? (sortState.dir===1?"ascending":"descending") : "none"); });
}
function sortBy(key){ if(!SORT_KEYS[key]) return; if(sortState.key === key) sortState.dir *= -1; else {sortState.key = key; sortState.dir = key === "symbol" ? 1 : -1;} applyTable(); }
document.querySelectorAll("th[data-sort]").forEach(function(th){ th.setAttribute("tabindex", "0"); th.addEventListener("click", function(){sortBy(th.getAttribute("data-sort"));}); th.addEventListener("keydown", function(e){ if(e.key === "Enter" || e.key === " "){ e.preventDefault();sortBy(th.getAttribute("data-sort")); }}); });
window.addEventListener("raptor:filter", function(e){ var detail = e.detail || {}; if(typeof detail.search === "string") tableSearch = detail.search.trim().toLowerCase(); if(detail.filter === "all" || detail.filter === "evaluated" || detail.filter === "insufficient") tableFilter = detail.filter; applyTable(); });
applyTable();

var backdrop = document.getElementById("modal-backdrop"); var modalBody = document.getElementById("modal-body"); var previousFocus = null;
function metric(label, value, cls){ return '<div class="metric"><div class="ml">'+label+'</div><div class="mv num '+(cls||"")+'">'+value+'</div></div>'; }
function fmtBps(v){ return (v===null||v===undefined) ? I18N.t('na') : v.toFixed(1)+" bps"; }
function fmtUsd(v){ if(v===null||v===undefined) return I18N.t('na'); return "$"+Math.round(v).toLocaleString("en-US"); }
function fmtUsdC(v){ if(v===null||v===undefined) return I18N.t('na'); if(v>=1e9) return "$"+(v/1e9).toFixed(2)+"B"; if(v>=1e6) return "$"+(v/1e6).toFixed(2)+"M"; if(v>=1e3) return "$"+(v/1e3).toFixed(1)+"k"; return "$"+Math.round(v).toLocaleString("en-US"); }
/* Book snapshot delay (24 Nov 2026, Raka approved): the live book_top10
   behind spread/impact/depth was captured after the close (median ~5 min
   under flood); book_delay_s comes from decisions validation asof_ms.
   ID mode uses a decimal comma + "mnt"/"dtk". */
function fmtBookDelay(sec){
  if(sec===null||sec===undefined) return I18N.t('metricBookNone');
  var isId = I18N.get()==="id"; var d;
  if(sec < 60) d = Math.round(sec)+" "+I18N.t('bookSec');
  else { var m = (sec/60).toFixed(1); if(isId) m = m.replace(".", ","); d = m+" "+I18N.t('bookMin'); }
  return I18N.t('metricBookDelayVal', {d: d});
}
function openModal(sid){
  var s = SIGNALS[sid]; if(!s) return; currentModalSid=sid;
  if(!backdrop.classList.contains("open")) previousFocus = document.activeElement;
  var t = s.tracker;
  var chartHtml = s.chart ? '<div class="chart-viewer" id="chart-viewer"><div class="chart-viewer-toolbar"><span>'+I18N.t('modalChart')+'</span><div class="chart-actions"><button type="button" id="chart-zoom" aria-pressed="false">'+I18N.t('modalZoom')+'</button><a href="'+s.chart+'" download="'+s.symbol+'-4h-chart.png" target="_blank" rel="noopener noreferrer">'+I18N.t('modalSave')+'</a></div></div><div class="chart-viewport" id="chart-viewport"><img class="chart" src="'+s.chart+'" loading="eager" decoding="async" alt="Historical 4H candlestick chart for '+s.symbol+'; original exported PNG, not a live chart"></div></div>' : '<p class="muted">Chart not available.</p>';
  var trkHtml;
  if(!t){ trkHtml = '<p class="muted">'+I18N.t('modalNoTracker')+'</p>'; }
  else if(t.r30===null || t.r30===undefined){ var reason = I18N.get()==='id' ? (t.insufficient_reason||'data 1m tidak lengkap') : (t.insufficient_reason_en||'incomplete 1m data'); trkHtml = '<p class="muted">'+I18N.t('modalInsuff',{reason:reason})+'</p>'; }
  else { trkHtml = '<div class="tracker-grid">'
      + metric("+1m", fmtPctFracG(t.r1), clsOf(t.r1!==null&&t.r1!==undefined ? t.r1*100 : null))
      + metric("+5m", fmtPctFracG(t.r5), clsOf(t.r5!==null&&t.r5!==undefined ? t.r5*100 : null))
      + metric("+15m", fmtPctFracG(t.r15), clsOf(t.r15!==null&&t.r15!==undefined ? t.r15*100 : null))
      + metric("+30m", fmtPctFracG(t.r30), clsOf(t.r30*100))
      + metric("Net +30m", fmtPctFracG(t.net), clsOf(t.net!==null&&t.net!==undefined ? t.net*100 : null))
      + metric("MFE", fmtPctFracG(t.mfe), clsOf(t.mfe!==null&&t.mfe!==undefined ? t.mfe*100 : null))
      + metric("MAE", fmtPctFracG(t.mae), clsOf(t.mae!==null&&t.mae!==undefined ? t.mae*100 : null))
      + metric("Classification", badgeOf(t.classification), "")
      + '</div>'; }
  var hh = (s.hh!==null&&s.hh!==undefined) ? s.hh+"/4" : I18N.t('na'); var hl = (s.hl!==null&&s.hl!==undefined) ? s.hl+"/4" : I18N.t('na');
  var liq = s.liq_validated===true ? I18N.t('yes') : (s.liq_validated===false ? I18N.t('noInfo') : I18N.t('na'));
  modalBody.innerHTML = '<div class="modal-head"><div><h3 id="modal-title">'+s.symbol+' <span class="muted" style="font-weight:400;font-size:14px">'+s.market+'</span></h3>'
    +'<div class="sub">'+I18N.t('modalSignal')+' &middot; '+I18N.t('closeOnly')+' '+closeText(s)+'</div></div>'
    +'<button class="modal-close" id="modal-close" aria-label="Close">&times;</button></div>' + chartHtml
    + '<div class="metric-grid">'
    + metric(I18N.t('metricClose'), fmtPrice(s.price))
    + metric(I18N.t('metricLive'), '<span data-live-symbol="'+s.symbol+'" data-live-market="'+s.market+'" data-live-close="'+(s.price??'')+'" data-live-modal="1"><span class="live-dot connecting"></span><span class="live-price">\u2026</span></span>')
    + metric(I18N.t('metricOpen'), fmtPrice(s.open))
    + metric(I18N.t('metricChg'), fmtPctG(s.chg_4h), clsOf(s.chg_4h))
    + metric(I18N.t('metricEMA20'), fmtPrice(s.ema20))
    + metric(I18N.t('metricEMA50'), fmtPrice(s.ema50))
    + metric(I18N.t('metricEMA500'), fmtPrice(s.ema500))
    + metric(I18N.t('metricRVOL'), (s.rvol===null||s.rvol===undefined)?I18N.t('na'):s.rvol.toFixed(2)+"x")
    + metric(I18N.t('metricTB'), (s.taker_buy===null||s.taker_buy===undefined)?I18N.t('na'):s.taker_buy.toFixed(2))
    + metric(I18N.t('metricATR'), (s.atr14_pct===null||s.atr14_pct===undefined)?I18N.t('na'):s.atr14_pct.toFixed(2)+"%")
    + metric(I18N.t('metricBL'), fmtPrice(s.breakout_level))
    + metric(I18N.t('metricBM'), fmtPctG(s.breakout_margin), clsOf(s.breakout_margin))
    + metric(I18N.t('metricHH'), hh+" &middot; "+hl)
    + metric(I18N.t('metricRSI5'), (s.rsi_5m===null||s.rsi_5m===undefined)?I18N.t('na'):s.rsi_5m.toFixed(1))
    + metric(I18N.t('metricRSI15'), (s.rsi_15m===null||s.rsi_15m===undefined)?I18N.t('na'):s.rsi_15m.toFixed(1))
    + metric(I18N.t('metricRSI1H'), (s.rsi_1h===null||s.rsi_1h===undefined)?I18N.t('na'):s.rsi_1h.toFixed(1))
    + metric(I18N.t('metricRSI4H'), (s.rsi_4h===null||s.rsi_4h===undefined)?I18N.t('na'):s.rsi_4h.toFixed(1))
    + metric(I18N.t('metricSpread'), fmtBps(s.spread))
    + metric(I18N.t('metricImpact'), fmtBps(s.impact))
    + metric(I18N.t('metricDepth'), fmtUsd(s.depth))
    + metric(I18N.t('metricBookDelay'), fmtBookDelay(s.book_delay_s))
    + metric(I18N.t('metricLiq'), liq)
    + metric(I18N.t('metricVol4H'), fmtUsdC(s.quote_volume))
    + metric(I18N.t('metricVol24H'), fmtUsdC(s.qv24h))
    + '</div>' + '<div class="tracker-box"><h4>'+I18N.t('modalTracker')+'</h4>' + trkHtml + '</div>';
  backdrop.classList.add("open"); document.body.style.overflow = "hidden"; try { history.replaceState(null, "", "#sig="+s.symbol+"_"+Math.round(s.close_ts)); } catch(e){}
  var zoomBtn=document.getElementById('chart-zoom'); if(zoomBtn)zoomBtn.addEventListener('click',function(){ var wrap=document.getElementById('chart-viewer'); var isZoomed=wrap.classList.toggle('zoomed'); zoomBtn.setAttribute('aria-pressed',String(isZoomed)); zoomBtn.textContent=isZoomed?I18N.t('modalFit'):I18N.t('modalZoom'); var frame=document.getElementById('chart-viewport');if(frame){frame.scrollTop=0;frame.scrollLeft=0;} });
  backdrop.scrollTop=0; document.getElementById("modal-close").addEventListener("click", closeModal); document.getElementById("modal-close").focus({preventScroll:true});
}
function closeModal(){ if(!backdrop.classList.contains("open")) return; backdrop.classList.remove("open"); document.body.style.overflow = ""; currentModalSid = null; if(previousFocus && typeof previousFocus.focus === "function") previousFocus.focus({preventScroll:true}); try { history.replaceState(null, "", location.pathname); } catch(e){} }
function openFromHash(){ var m = location.hash.match(/^#sig=([A-Z0-9]+)_(\d+)$/); if(!m) return; var s = DATA.signals.filter(function(x){ return x.symbol===m[1] && String(Math.round(x.close_ts))===m[2]; })[0]; if(s) openModal(s.signal_id); }
backdrop.addEventListener("click", function(e){ if(e.target === backdrop) closeModal(); });
document.addEventListener("keydown", function(e){ if(e.key === "Escape") closeModal(); if(e.key === "Tab" && backdrop.classList.contains("open")){ var nodes = Array.prototype.slice.call(modalBody.querySelectorAll('button,[href],[tabindex]:not([tabindex="-1"])')); if(!nodes.length) return; if(e.shiftKey && document.activeElement === nodes[0]){e.preventDefault();nodes[nodes.length-1].focus();} else if(!e.shiftKey && document.activeElement === nodes[nodes.length-1]){e.preventDefault();nodes[0].focus();} } });
tbody.addEventListener("click", function(e){ var tr = e.target.closest("tr[data-sid]"); if(tr) openModal(tr.getAttribute("data-sid")); });
tbody.addEventListener("keydown", function(e){ if(e.key === "Enter" || e.key === " "){ e.preventDefault(); var tr = e.target.closest("tr[data-sid]"); if(tr) openModal(tr.getAttribute("data-sid")); } });
/* v36: group toggle + show-all delegation (group rows carry no data-sid,
   so the modal handler above ignores them). */
tbody.addEventListener("click", function(e){
  var tg = e.target.closest(".close-group-toggle");
  if(tg){ e.stopPropagation(); var ts = tg.getAttribute("data-close-ts"); collapsedGroups[ts] = tg.getAttribute("aria-expanded")==="true"; applyTable(); return; }
  var more = e.target.closest(".close-group-more-btn");
  if(more){ e.stopPropagation(); var mts = more.getAttribute("data-close-ts"); if(expandedGroups[mts]) delete expandedGroups[mts]; else expandedGroups[mts]=true; applyTable(); }
});
/* v36: public hook for the DDT overlay (density-v36.js) + test suites.
   revealSignal expands the signal's close group + pagination so its row
   exists in the DOM (no-op in a flat sort, where all rows are present).
   It does NOT clear an active table search/filter. */
window.RaptorDensity = {
  revealSignal: function(sid){ var s = SIGNALS[sid]; if(!s) return false; if(sortState.key !== "close_ts") return !!tbody.querySelector('tr[data-sid="'+sid+'"]'); collapsedGroups[s.close_ts]=false; expandedGroups[s.close_ts]=true; applyTable(); return !!tbody.querySelector('tr[data-sid="'+sid+'"]'); },
  expandAll: function(){ DATA.signals.forEach(function(s){ collapsedGroups[s.close_ts]=false; expandedGroups[s.close_ts]=true; }); applyTable(); },
  collapseAll: function(){ DATA.signals.forEach(function(s){ collapsedGroups[s.close_ts]=true; delete expandedGroups[s.close_ts]; }); applyTable(); },
  getState: function(){ return {sortKey: sortState.key, collapsed: Object.keys(collapsedGroups).filter(function(k){return collapsedGroups[k];}), expanded: Object.keys(expandedGroups)}; }
};
window.addEventListener('raptor:lang',function(){ applyTable(); if(currentModalSid && backdrop.classList.contains('open')) openModal(currentModalSid); });
openFromHash();
})();
