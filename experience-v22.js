(function(){
'use strict';
var DATA = window.RAPTOR_DATA || {signals:[],kpis:{},meta:{},health:{}};
var LANG = window.RaptorLang || {get:function(){return 'en';},onChange:function(){},useWIB:function(){return false;}};
var signals = (DATA.signals||[]).slice().sort(function(a,b){ return (b.close_ts||0)-(a.close_ts||0); });
if(!signals.length) return;
var state = {search:'', filter:'all', selected: signals[0].signal_id, tab:'official'};
var chart = null, resizeObs = null;
var Q = {
  section: document.getElementById('deep-terminal'),
  top: document.getElementById('ddt-top-metrics'),
  search: document.getElementById('ddt-search'),
  filters: document.getElementById('ddt-filters'),
  list: document.getElementById('ddt-list'),
  detail: document.getElementById('ddt-detail'),
  gauges: document.getElementById('ddt-gauges'),
  recent: document.getElementById('ddt-recent')
 };

var TXT = {
  en: {
    terminalKicker:'00 / ADVANCED TERMINAL', terminalTitle:'Deep-Dive Terminal', terminalMeta:'HIGH-CLARITY SIGNAL REVIEW / PROFESSIONAL MODE',
    search:'Search ticker or setup...', fAll:'ALL', fLong:'LONG', fStrong:'STRONG', fNoData:'NO DATA',
    signalFinder:'SIGNAL FINDER', latestHigh:'LATEST HIGH-CONFIDENCE ALERT', launch:'Launch Deep-Dive Terminal',
    interactive:'Interactive Focus Canvas', official:'Official PNG', derivedNote:'Derived focus canvas from the exported signal metrics — a guided visual aid, not a live exchange chart.',
    pngLeft:'Original source chart PNG preserved', pngRight:'visual review only',
    monitored:'Monitored Universe', audited:'Audited 4H Signals', bias:'Directional Bias', schedule:'Scheduled Scanning Cycle',
    contracts:'Contracts', delivered:'Delivered', verified:'100% closed-bar verified', bullish:'Bullish', bullishPair:'LONG • SHORT',
    latestPanel:'Signal Deep-Dive',
    alertClose:'Alert Close', invalidation:'Invalidation', rvol:'Relative Volume', atr:'ATR (14)', rsi:'RSI (4H)', cycle:'Cycle Close',
    officialSource:'Original 4H source PNG', indicators:'Indicators: EMA 20 (Cyan) · EMA 50 (Amber) · Breakout Level · Relative Volume', status:'Status: Closed 4H bar audited',
    marketConfluence:'Market Confluence Gauges', latestVerified:'Latest Verified 4H Closed Alerts', clickLoad:'Click to load in terminal',
    dirBias:'Directional Bias', long:'LONG', short:'SHORT', quality:'Quality Tier Confluence', strong:'Strong', standard:'Standard',
    noData:'Insufficient Data', ready:'Ready for review', noMatches:'No signals match the current search or filter.',
    officialTabDesc:'Best for exact chart reading and publication review.',
    interactiveTabDesc:'Best for a calmer visual review of key signal levels.',
    setupBreakout:'Bullish Breakout', setupVolume:'Unusual Volume', setupTrend:'Trend Reversal', setupMomentum:'Momentum Continuation',
    timeLabel:'Close', qualityLabel:'Tier', marketLabel:'Market'
  },
  id: {
    terminalKicker:'00 / TERMINAL LANJUTAN', terminalTitle:'Terminal Deep-Dive', terminalMeta:'TINJAUAN SINYAL BERKEJERNIHAN TINGGI / MODE PROFESIONAL',
    search:'Cari ticker atau setup...', fAll:'SEMUA', fLong:'LONG', fStrong:'STRONG', fNoData:'TANPA DATA',
    signalFinder:'PENCARI SINYAL', latestHigh:'ALERT HIGH-CONFIDENCE TERBARU', launch:'Buka Terminal Deep-Dive',
    interactive:'Kanvas Fokus Interaktif', official:'PNG Resmi', derivedNote:'Kanvas fokus ini diturunkan dari metrik sinyal hasil ekspor — alat bantu visual, bukan chart exchange live.',
    pngLeft:'PNG chart sumber asli tetap dipertahankan', pngRight:'hanya untuk review visual',
    monitored:'Universe Dipantau', audited:'Sinyal 4J Diaudit', bias:'Bias Arah', schedule:'Siklus Pemindaian Berikutnya',
    contracts:'Kontrak', delivered:'Terkirim', verified:'100% candle tutup terverifikasi', bullish:'Bullish', bullishPair:'LONG • SHORT',
    latestPanel:'Deep-Dive Sinyal',
    alertClose:'Harga Tutup', invalidation:'Level Invalidasi', rvol:'Volume Relatif', atr:'ATR (14)', rsi:'RSI (4J)', cycle:'Penutupan Siklus',
    officialSource:'PNG sumber 4J asli', indicators:'Indikator: EMA 20 (Sian) · EMA 50 (Amber) · Level Breakout · Volume Relatif', status:'Status: Candle 4J tertutup sudah diaudit',
    marketConfluence:'Gauge Konfluensi Pasar', latestVerified:'Alert 4J Tertutup Terverifikasi Terbaru', clickLoad:'Klik untuk memuat ke terminal',
    dirBias:'Bias Arah', long:'LONG', short:'SHORT', quality:'Konfluensi Tier Kualitas', strong:'Strong', standard:'Standar',
    noData:'Data Tidak Cukup', ready:'Siap direview', noMatches:'Tidak ada sinyal yang cocok dengan pencarian atau filter saat ini.',
    officialTabDesc:'Terbaik untuk membaca chart dengan presisi dan review publikasi.',
    interactiveTabDesc:'Terbaik untuk review visual level-level sinyal yang lebih tenang.',
    setupBreakout:'Breakout Bullish', setupVolume:'Volume Tidak Biasa', setupTrend:'Pembalikan Tren', setupMomentum:'Lanjutan Momentum',
    timeLabel:'Tutup', qualityLabel:'Tier', marketLabel:'Market'
  }
};
function t(k){ var m=TXT[LANG.get()]||TXT.en; return m[k] || TXT.en[k] || k; }
function num(n,d){ if(n===null||n===undefined||Number.isNaN(Number(n))) return LANG.get()==='id'?'N/A':'N/A'; return Number(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}); }
function pct(n,d){ if(n===null||n===undefined||Number.isNaN(Number(n))) return 'N/A'; var sign=Number(n)>0?'+':''; return sign+num(n,d)+'%'; }
/* v40b (25 Nov 2026): money() used to force fixed decimals by magnitude
   band (>=100 -> 2dp, >=1 -> 4dp, <1 -> 6dp), padding tick-aligned
   closes with trailing zeros ($97.8500, $0.062970). It now mirrors the
   main table's fmtPrice (app.js) / fmt_price (build.py) exactly — one
   price format across the product: >=10000 -> 0dp, >=100 -> 2dp,
   below 100 -> 6 significant digits with trailing zeros stripped. */
function money(n){ if(n===null||n===undefined||Number.isNaN(Number(n))) return 'N/A'; var v=Number(n), abs=Math.abs(v); if(abs>=10000) return '$'+v.toLocaleString("en-US",{maximumFractionDigits:0}); if(abs>=100) return '$'+v.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}); return '$'+String(Number(v.toPrecision(6))); }
function formatClose(s){ return LANG.useWIB&&LANG.useWIB() ? (s.close_wib+' WIB') : (s.close_utc+' UTC'); }
function qualityOf(s){ return (s.rvol||0)>=3 || (s.breakout_margin||0)>=3 || (s.chg_4h||0)>=5 ? 'strong' : 'standard'; }
function hasNoData(s){ return !s.tracker || s.tracker.r30===null || s.tracker.r30===undefined; }
function setupOf(s){ if((s.breakout_margin||0)>=1 && (s.chg_4h||0)>=3) return t('setupBreakout'); if((s.rvol||0)>=5) return t('setupVolume'); if((s.chg_4h||0)>=2) return t('setupTrend'); return t('setupMomentum'); }
function getFiltered(){ return signals.filter(function(s){
  var q=((s.symbol||'')+' '+setupOf(s)+' '+(qualityOf(s))).toLowerCase();
  var okSearch=!state.search || q.indexOf(state.search)>=0;
  var okFilter=true;
  if(state.filter==='long') okFilter=true;
  else if(state.filter==='strong') okFilter=qualityOf(s)==='strong';
  else if(state.filter==='nodata') okFilter=hasNoData(s);
  return okSearch && okFilter;
}); }
function selectedSignal(){ var list=getFiltered(); var found=signals.find(function(s){ return s.signal_id===state.selected; }); if(found && list.some(function(s){return s.signal_id===found.signal_id;})) return found; if(list[0]){ state.selected=list[0].signal_id; return list[0]; } return signals[0]; }
function nextClose(){
  var now = new Date();
  var utcH = now.getUTCHours();
  var nextH = (Math.floor(utcH/4)+1)*4;
  var next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0,0,0,0));
  if(nextH >= 24){ next.setUTCDate(next.getUTCDate()+1); nextH -= 24; }
  next.setUTCHours(nextH);
  return next;
}
function countdownText(){
  var diff=Math.max(0, nextClose()-new Date());
  var h=Math.floor(diff/3600000), m=Math.floor(diff%3600000/60000), s=Math.floor(diff%60000/1000);
  return [h,m,s].map(function(v){return (v<10?'0':'')+v;}).join(':');
}
function nextCloseLabel(){
  var dt=nextClose();
  var opts={day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false};
  if(LANG.useWIB&&LANG.useWIB()) return new Intl.DateTimeFormat('en-GB',Object.assign({timeZone:'Asia/Jakarta'},opts)).format(dt).replace(',', '')+' WIB';
  return new Intl.DateTimeFormat('en-GB',Object.assign({timeZone:'UTC'},opts)).format(dt).replace(',', '')+' UTC';
}
function renderSectionText(){
  var kicker=document.querySelector('.ddt-kicker'); if(kicker) kicker.textContent=t('terminalKicker');
  var title=document.querySelector('.ddt-title'); if(title) title.innerHTML=t('terminalTitle')+'<span class="section-heading-period">.</span>';
  var meta=document.querySelector('.ddt-meta'); if(meta) meta.textContent=t('terminalMeta');
  var label=document.querySelector('.ddt-panel-label'); if(label) label.textContent=t('signalFinder');
  if(Q.search){ Q.search.placeholder=t('search'); Q.search.setAttribute('aria-label',t('search')); }
}
function renderTop(){
  var total=signals.length;
  var longs=total;
  var shorts=0;
  var strong=signals.filter(function(s){return qualityOf(s)==='strong';}).length;
  var strongPct=total? strong/total*100 : 0;
  var metrics=[
    {label:t('monitored'), val:'<b>'+num(DATA.health?.eligible||DATA.kpis?.eligible||0,0)+'</b><span>'+t('contracts')+'</span>', sub:'Binance USD-M & COIN-M · 4H'},
    {label:t('audited'), val:'<b>'+num(total,0)+'</b><span class="accent">'+t('delivered')+'</span>', sub:t('verified')},
    {label:t('bias'), val:'<b class="accent">'+num(total?longs/total*100:0,1)+'%</b><span>'+t('bullish')+'</span>', sub:longs+' '+t('long')+' · '+shorts+' '+t('short')},
    {label:t('schedule'), val:'<strong>'+countdownText()+'</strong>', sub:(LANG.get()==='id'?'Tutup berikutnya: ':'Next close: ')+nextCloseLabel()}
  ];
  Q.top.innerHTML=metrics.map(function(m){ return '<div class="ddt-metric"><div class="ddt-metric-label">'+m.label+'</div><div class="ddt-metric-value">'+m.val+'</div><div class="ddt-metric-sub">'+m.sub+'</div></div>'; }).join('');
}
function renderFilters(){
  var list=[['all',t('fAll'),'('+signals.length+')'],['long',t('fLong'),'('+signals.length+')'],['strong',t('fStrong'),'('+signals.filter(function(s){return qualityOf(s)==='strong';}).length+')'],['nodata',t('fNoData'),'('+signals.filter(hasNoData).length+')']];
  Q.filters.innerHTML=list.map(function(f){ return '<button type="button" class="ddt-filter" data-filter="'+f[0]+'" aria-pressed="'+String(state.filter===f[0])+'">'+f[1]+' '+f[2]+'</button>'; }).join('');
  Array.prototype.forEach.call(Q.filters.querySelectorAll('.ddt-filter'),function(btn){ btn.onclick=function(){ state.filter=btn.getAttribute('data-filter'); renderList(); renderSide(); }; });
}
function renderList(){
  var list=getFiltered();
  if(!list.length){ Q.list.innerHTML='<div class="ddt-empty">'+t('noMatches')+'</div>'; return; }
  Q.list.innerHTML=list.map(function(s){
    var q=qualityOf(s), noData=hasNoData(s), active=state.selected===s.signal_id;
    return '<button type="button" class="ddt-item'+(active?' is-active':'')+'" data-sid="'+s.signal_id+'">'
      +'<div class="ddt-item-main">'
      +'<div class="ddt-item-head"><span class="ddt-item-symbol">'+s.symbol+'</span><span class="ddt-item-price">'+money(s.price)+'</span></div>'
      +'<div class="ddt-item-setup">'+setupOf(s)+'</div>'
      +'<div class="ddt-item-foot"><div class="ddt-badges">'
      +'<span class="ddt-badge long">'+t('long')+'</span>'
      +'<span class="ddt-badge '+q+'">'+t(q)+'</span>'
      +'<span class="ddt-badge '+(noData?'nodata':'data')+'">'+(noData?t('fNoData'):('RVOL '+num(s.rvol,2)+'x'))+'</span>'
      +'</div><span class="ddt-item-time">'+formatClose(s)+'</span></div></div></button>';
  }).join('');
  Array.prototype.forEach.call(Q.list.querySelectorAll('.ddt-item'),function(btn){ btn.onclick=function(){ state.selected=btn.getAttribute('data-sid'); renderList(); renderDetail(); if(window.gsap && !document.documentElement.classList.contains('motion-off')){ gsap.fromTo(Q.detail,{opacity:.85,y:8},{opacity:1,y:0,duration:.32,ease:'power2.out'}); } }; });
}
function metricBox(label, value){ return '<div class="t"><span>'+label+'</span><strong>'+value+'</strong></div>'; }
function renderDetail(){
  var s=selectedSignal(); if(!s) return;
  var q=qualityOf(s), noData=hasNoData(s);
  var invalidation=s.breakout_level || s.open || null;
  var chartViews='';
  chartViews += '<div class="ddt-chart-view '+(state.tab==='interactive'?'is-active':'')+'" data-view="interactive"><div class="ddt-interactive-wrap"><div class="ddt-interactive-note">'+t('derivedNote')+'</div><div class="ddt-interactive-chart" id="ddt-interactive-chart"><div class="fallback" id="ddt-interactive-fallback"></div></div><div class="ddt-legend-row"><span><i></i>'+t('officialTabDesc')+'</span><span><i class="ema20"></i>EMA20 '+money(s.ema20)+'</span><span><i class="ema50"></i>EMA50 '+money(s.ema50)+'</span><span><i class="breakout"></i>Breakout '+money(s.breakout_level)+'</span></div></div></div>';
  chartViews += '<div class="ddt-chart-view '+(state.tab==='official'?'is-active':'')+'" data-view="official"><div class="ddt-image-frame">'+(s.chart?'<img src="'+s.chart+'" alt="Official 4H signal chart for '+s.symbol+'">':'<div class="ddt-empty" style="margin:18px">Chart unavailable.</div>')+'</div><div class="ddt-image-caption"><span>'+t('pngLeft')+'</span><span>'+t('pngRight')+'</span></div></div>';
  Q.detail.innerHTML=''
    +'<div class="ddt-detail-top">'
      +'<div class="ddt-focus-card">'
        +'<div class="ddt-focus-kicker">'+t('latestHigh')+'</div>'
        +'<div class="ddt-focus-time">'+formatClose(s)+'</div>'
        +'<div class="ddt-focus-symbol">'+s.symbol+'</div>'
        +'<div class="ddt-focus-market">'+(s.market||'USD-M')+' · 4H CLOSED BAR</div>'
        +'<div class="ddt-badges"><span class="ddt-badge long">'+t('long')+'</span><span class="ddt-badge '+q+'">'+t(q)+'</span></div>'
        +'<div class="ddt-focus-setup">'+setupOf(s)+'</div>'
        +'<div class="ddt-focus-meta">'
          +'<div class="m"><span>'+t('alertClose')+'</span><strong>'+money(s.price)+'</strong></div>'
          +'<div class="m"><span>'+t('invalidation')+'</span><strong>'+money(invalidation)+' '+(s.breakout_margin!=null?'('+pct(s.breakout_margin,2)+')':'')+'</strong></div>'
          +'<div class="m"><span>'+t('rvol')+'</span><strong>'+num(s.rvol,2)+'x RVOL</strong></div>'
          +'<div class="m"><span>'+t('cycle')+'</span><strong>'+formatClose(s)+'</strong></div>'
        +'</div>'
        +'<a class="ddt-focus-cta" href="#signals">'+t('launch')+' <span aria-hidden="true">→</span></a>'
      +'</div>'
      +'<div class="ddt-chart-wrap">'
        +'<div class="ddt-chart-head"><div class="ddt-chart-title"><b>'+s.symbol+'</b><small>'+(s.market||'USD-M')+' · 4H</small><div class="vals"><span class="ema20">EMA20</span><span class="ema50">EMA50</span></div></div>'
          +'<div class="ddt-chart-tabs"><button type="button" class="ddt-tab" data-tab="interactive" aria-pressed="'+String(state.tab==='interactive')+'">'+t('interactive')+'</button><button type="button" class="ddt-tab" data-tab="official" aria-pressed="'+String(state.tab==='official')+'">'+t('official')+'</button></div></div>'
        +'<div class="ddt-chart-metrics">'
          +metricBox(t('alertClose'), money(s.price))
          +metricBox(t('invalidation'), money(invalidation))
          +metricBox(t('rvol'), num(s.rvol,2)+'x RVOL')
          +metricBox(t('atr'), pct(s.atr14_pct,2))
          +metricBox(t('rsi'), num(s.rsi_4h,1))
        +'</div>'
        +'<div class="ddt-chart-surface">'+chartViews+'</div>'
        +'<div class="ddt-footer-strip"><span>'+t('indicators')+'</span><b>'+(noData?t('ready'):(t('status')+' · +30m '+pct((s.tracker?.r30||0)*100,2)))+'</b></div>'
      +'</div>'
    +'</div>';
  Array.prototype.forEach.call(Q.detail.querySelectorAll('.ddt-tab'),function(btn){ btn.onclick=function(){ state.tab=btn.getAttribute('data-tab'); renderDetail(); }; });
  if(state.tab==='interactive') initInteractiveChart(s);
}
function initInteractiveChart(s){
  var mount=document.getElementById('ddt-interactive-chart'); if(!mount) return;
  if(chart){ try{ chart.remove(); }catch(e){} chart=null; }
  var fallback=document.getElementById('ddt-interactive-fallback');
  if(window.LightweightCharts && mount.clientWidth>0){
    if(fallback) fallback.style.display='none';
    chart = window.LightweightCharts.createChart(mount,{layout:{background:{color:'#030913'},textColor:'#8ba2b2',fontFamily:'Inter, sans-serif'},rightPriceScale:{borderColor:'rgba(122,146,165,.22)'},timeScale:{borderColor:'rgba(122,146,165,.22)',timeVisible:false,secondsVisible:false,barSpacing:16,fixLeftEdge:true,fixRightEdge:true},grid:{vertLines:{color:'rgba(80,112,138,.12)'},horzLines:{color:'rgba(80,112,138,.12)'}},crosshair:{mode:0},handleScroll:false,handleScale:false});
    var line = chart.addLineSeries({color:'#5cf2d1',lineWidth:3,priceLineVisible:false,lastValueVisible:true,crosshairMarkerVisible:true});
    var ema20 = chart.addLineSeries({color:'#46dfda',lineWidth:2,priceLineVisible:false,lastValueVisible:false,crosshairMarkerVisible:false});
    var ema50 = chart.addLineSeries({color:'#ffb140',lineWidth:2,priceLineVisible:false,lastValueVisible:false,crosshairMarkerVisible:false});
    var vol = chart.addHistogramSeries({color:'rgba(71,212,255,.35)',priceFormat:{type:'volume'},priceScaleId:''});
    var base=Number(s.open||s.price||1), p=Number(s.price||base), e20=Number(s.ema20||base), e50=Number(s.ema50||base), br=Number(s.breakout_level||base);
    var pts=[base, (base+e50)/2, e50, (e50+e20)/2, e20, (e20+br)/2, br, (br+p)/2, p];
    var data=pts.map(function(v,i){return {time:i+1, value:v};});
    line.setData(data);
    ema20.setData(data.map(function(_,i){ return {time:i+1, value:e20}; }));
    ema50.setData(data.map(function(_,i){ return {time:i+1, value:e50}; }));
    vol.setData(data.map(function(_,i){ return {time:i+1, value: Math.max(1,(s.rvol||1)*(i+1)/2), color: i===data.length-1 ? 'rgba(171,237,119,.76)' : 'rgba(61,214,255,.35)'}; }));
    chart.timeScale().fitContent();
    if(resizeObs) resizeObs.disconnect();
    resizeObs=new ResizeObserver(function(){ if(chart) chart.applyOptions({width:mount.clientWidth,height:mount.clientHeight}); });
    resizeObs.observe(mount);
  } else if(fallback){
    fallback.innerHTML='';
    var bars=[.24,.38,.32,.46,.41,.62,.57,.7,.88];
    bars.forEach(function(h){ var i=document.createElement('i'); i.style.height=(h*78+16)+'%'; fallback.appendChild(i); });
  }
}
function renderGauges(){
  var total=signals.length||1;
  var strong=signals.filter(function(s){return qualityOf(s)==='strong';}).length;
  var standard=total-strong;
  var longPct=100, strongPct=strong/total*100;
  Q.gauges.innerHTML=''
    +'<div class="ddt-card-title"><h3>'+t('marketConfluence')+'</h3><small>'+num(DATA.health?.eligible||DATA.kpis?.eligible||0,0)+' Pairs</small></div>'
    +'<div class="ddt-gauge-block">'
      +'<div class="ddt-gauge-item"><div class="ddt-gauge-head"><span>'+t('dirBias')+'</span><span class="v">'+num(longPct,1)+'% '+t('long')+'</span></div><div class="ddt-bar"><i style="width:'+longPct+'%"></i></div><div class="ddt-legend-chips"><span><b>'+t('long')+':</b> '+signals.length+'</span><span class="negv"><b>'+t('short')+':</b> 0</span></div></div>'
      +'<div class="ddt-gauge-item"><div class="ddt-gauge-head"><span>'+t('quality')+'</span><span class="v">'+num(strongPct,1)+'% '+t('strong')+'</span></div><div class="ddt-bar"><i style="width:'+strongPct+'%;background:linear-gradient(90deg,#aa78ff,#4d90ff)"></i></div><div class="ddt-legend-chips"><span class="strongv"><b>'+t('strong')+':</b> '+strong+'</span><span class="stdv"><b>'+t('standard')+':</b> '+standard+'</span></div></div>'
    +'</div>';
}
function renderRecent(){
  var top=signals.slice(0,6);
  Q.recent.innerHTML='<div class="ddt-card-title"><h3>'+t('latestVerified')+'</h3><small>'+t('clickLoad')+'</small></div><div class="ddt-recent-list">'+top.map(function(s){ return '<button type="button" class="ddt-recent-item" data-sid="'+s.signal_id+'"><div class="name"><b>'+s.symbol+'</b><span>'+setupOf(s)+'</span></div><span class="px">'+money(s.price)+'</span><span class="rv">'+num(s.rvol,2)+'x RVOL</span></button>'; }).join('')+'</div>';
  Array.prototype.forEach.call(Q.recent.querySelectorAll('.ddt-recent-item'),function(btn){ btn.onclick=function(){ state.selected=btn.getAttribute('data-sid'); renderList(); renderDetail(); window.location.hash='deep-terminal'; }; });
}
function renderSide(){ renderDetail(); renderGauges(); renderRecent(); }
function renderAll(){ renderSectionText(); renderTop(); renderFilters(); renderList(); renderSide(); }
if(Q.search){ Q.search.addEventListener('input',function(){ state.search=String(this.value||'').trim().toLowerCase(); renderList(); renderSide(); }); }
LANG.onChange(renderAll);
renderAll();
setInterval(renderTop,1000);
if(window.gsap && Q.section && !document.documentElement.classList.contains('motion-off')){
  var els=Q.section.querySelectorAll('.ddt-metric,.ddt-sidebar,.ddt-detail,.ddt-gauges,.ddt-recent');
  gsap.from(els,{opacity:0,y:18,duration:.65,stagger:.05,ease:'power2.out',clearProps:'opacity,transform'});
}
})();
