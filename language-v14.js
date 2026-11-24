// Raptor Trade language pack v14 (Raka) — BUILD-OWNED EDITS by Jenni, 23 Nov 2026:
//  * observatoryDesc/kpiTotalSub parameterized: {closesWord}/{closes} now come
//    from window.RAPTOR_DATA.series (was hardcoded "eight"/"delapan", "8 closes").
//  * observatoryDesc live sentence updated for the live price layer.
//  * Added thLive/metricLive/liveNote/liveStale/liveUnavailable/liveUpdated keys.
//  * 24 Nov 2026 audit round 1: chip labels matched by tone class (was positional,
//    duplicated "Insufficient Data"); round 3: kpiAvgSub + perfFine1 now use the
//    NET-data count (series.n_eval) with an honest split of the rest
//    (curveCaveat helper) — the old text claimed every non-curve signal
//    "could not be evaluated", wrong for the 28 evaluated-but-no-net ones.
// See JENNI-CHANGES.md. v21-source/language-v14.js stays pristine.
(function(){
'use strict';
var d=document;
var lang='en';
try{lang=localStorage.getItem('raptorLang')||lang;}catch(e){}
if(lang!=='id'&&lang!=='en')lang='en';
var subs=[];
var MAP={
  en:{
    langLabel:'Language', langEN:'EN', langID:'ID',
    marketOverview:'MARKET OVERVIEW', motionOn:'MOTION ON', motionOff:'MOTION OFF',
    heroEyebrow:'THE 4H SIGNAL TERMINAL', heroTitle:'Hunt the<br><span class="raptor">momentum<span class="hero-fullstop">.</span></span>',
    tagline:'A high-clarity command center for closed-candle LONG signals across Binance Futures. Every alert. Every condition. Every outcome.',
    exploreSignals:'EXPLORE SIGNALS <span aria-hidden="true">↗</span>', exportCsv:'EXPORT CSV <span aria-hidden="true">↓</span>',
    trust1:'4H CLOSED CANDLES', trust2:'READ ONLY', trust3:'NO AUTO-ORDERS',
    signalRadar:'SIGNAL RADAR', radarCenterTop:'RAPTOR SIGNAL ENGINE', radarCenterBottom:'4H / CLOSED-CANDLE INTELLIGENCE', radarField:'SIGNAL FIELD', radarOrbit:'ORBIT / SCAN', radarUniverse:'UNIVERSE AT EXPORT',
    snapshotTitle:'SNAPSHOT DATA', nextClose:'NEXT 4H CLOSE (UTC GRID)', countdown:'COUNTDOWN', dataExported:'DATA EXPORTED', recentSignals:'RECENT SIGNALS', preparingSignalSummary:'Preparing signal summary...',
    observatoryKicker:'3D / 4H SIGNAL HISTORY', observatoryTitle:'Signal Observatory', observatoryDesc:'Explore signal counts across {closesWord} historical closed 4H candles. Interactive visual history with the exact {closesWord} exported counts. Live prices after each signal update from the Binance public stream.', observatoryStatus:'SNAPSHOT MODEL · LOCAL DATA',
    obsOverlay1:'SELECT A CANDLE FROM THE TIMELINE', obsOverlay2:'HISTORICAL · NOT LIVE', obsSideTitle:'TELEMETRY / EXPORT', obsSideNote:'VISUAL ONLY · NO ORDER EXECUTION<br>Quality scales automatically with device capabilities.',
    sectionCommandKicker:'01 / COMMAND OVERVIEW', atAGlance:'At a glance', historicalTracker:'HISTORICAL TRACKER / 4H SIGNALS',
    kpiTotal:'Total 4H Signals', kpiTotalSub:'since first signal {date} · {closes} 4H closes', kpi24h:'Signals 24h', kpi24hSub:'24h before export · of {total} total', kpiWin:'+30m Win Rate', kpiWinSub:'{wins} of {eval} evaluable signals · n={eval} · tracker classification', kpiAvg:'Avg Net +30m', kpiAvgSub:'n={eval} with net data · median +{median}% · after simulated fees', kpiEligible:'Eligible Symbols', kpiEligibleSub:'of {universe} universe contracts · {gap} gap-blocked',
    performanceKicker:'02 / PERFORMANCE ANALYTICS', performanceTitle:'+30 Min Performance', performanceNote:'tracker results, per evaluable signal · n={eval} of {total}', perSignal:'Per signal — +30m return', cumulativeCurve:'Cumulative net +30m curve',
    chipUp:'Continued Up', chipSide:'Sideways', chipReversed:'Reversed', chipNoData:'Insufficient Data', perfFine1:'Cumulative net +30m, compounded in signal order, from {net} signals with net data. {caveat}', perfFine2:'+30m return is measured from the signal close price. Sample is still small (n={eval} evaluated of {total} signals) — not enough to judge strategy quality.',
    signalsKicker:'03 / SIGNAL INTELLIGENCE', signalsTitle:'Signal History', signalsNote:'{total} 4H signals · click a column to sort, click a row for details + chart', searchPlaceholder:'Search symbol or market...', filterAll:'ALL', filterEvaluated:'EVALUATED', filterNoData:'NO DATA', results:'RESULTS',
    thSymbol:'Symbol', thClose:'Close (UTC)', thPrice:'Price', thChg:'Chg 4H', thBreakout:'Breakout', thTracker:'Tracker Result', thLive:'Live',
    filtersKicker:'04 / STRATEGY LOGIC', filtersTitle:'Active Filters', filtersNote:'RULES 4H v2.1.2',
    systemKicker:'05 / SYSTEM TELEMETRY', systemTitle:'System Status', systemNote:'reported at dashboard export, not a browser live feed',
    footerMotto:'OBSERVE. VERIFY. DECIDE.', footerRight:'INDEPENDENT SIGNAL RESEARCH / 2026', footerDataSource:'<b>Data source:</b> Binance Futures Mainnet (USD-M + COIN-M), official 4H candles + dstream WebSocket. Prices and tracker results are computed from the same local data as the signal engine.', footerDisclaimer:'<b>Disclaimer:</b> this is not financial advice. Signals are READ ONLY and never open orders automatically. There is no evidence this strategy is profitable — the performance figures above are historical tracker results from a small sample, not a promise of future results. Always do your own research.',
    closeOnly:'close', snapshotUnavailable:'Export timestamp unavailable', exportedLessThanMinute:'Exported less than a minute ago', exportedMin:'Exported {m} min ago', exportedHM:'Exported {h} h {m} m ago', exportedD:'Exported {d} d ago',
    badgeGood:'Continued Up', badgeBad:'Reversed', badgeNeutral:'Sideways', badgeWarn:'Insufficient Data', badgeUnknown:'Not evaluated',
    modalChart:'4H CANDLE CHART · ORIGINAL SNAPSHOT', modalZoom:'ZOOM TO DETAIL', modalFit:'FIT ENTIRE CHART', modalSave:'SAVE PNG ↗',
    modalSignal:'4H LONG SIGNAL', metricClose:'Close Price', metricLive:'Live Price', metricOpen:'Open', metricChg:'Chg 4H', metricEMA20:'EMA 20', metricEMA50:'EMA 50', metricEMA500:'EMA 500', metricRVOL:'RVOL', metricTB:'Taker-Buy (info)', metricATR:'ATR 14', metricBL:'Breakout Level', metricBM:'Breakout Margin', metricHH:'Structure HH / HL', metricRSI5:'RSI 5m', metricRSI15:'RSI 15m', metricRSI1H:'RSI 1h', metricRSI4H:'RSI 4h', metricSpread:'Spread', metricImpact:'Impact', metricDepth:'Depth', metricBookDelay:'Book snapshot', metricBookDelayVal:'+{d} after close', metricBookNone:'not recorded', bookMin:'min', bookSec:'s', metricLiq:'Liquidity Validated', metricVol4H:'4H Volume', metricVol24H:'24h Volume',
    modalTracker:'Tracker Evaluation (+30 minutes)', modalNoTracker:'Not evaluated by the tracker yet.', modalInsuff:'Insufficient data for evaluation: {reason}', yes:'Yes', noInfo:'No (info only)', na:'N/A', liveNote:'Live prices stream directly from the Binance public feed in your browser; signal values, tracker results, and KPIs remain the historical snapshot.', liveStale:'stale', liveUnavailable:'live unavailable', liveUpdated:'updated {time}',
    insightKicker:'01b / PLAIN-LANGUAGE SUMMARY', insightTitle:'What the data says', insightNote:'auto-computed from this snapshot', biggestMove:'Biggest 4H move', highestRVOL:'Highest RVOL', best30:'Best +30m result', busiestClose:'Busiest 4H close', latestSignal:'Latest signal', outcomeMix:'Outcome mix', signalsPerClose:'Signals per 4H close (UTC)', howToRead:'How to read the table', continuedUp:'Continued up (≥ +1% at +30m)', sideways:'Sideways (small move)', reversed:'Reversed (≤ −1% at +30m)', noData:'No data (1m candles incomplete)', noDataDesc:'“No data” means the tracker could not measure, not that the signal lost.', clusters:'Signals cluster around volatile closes; quiet closes produce none.', guideChg:'Price change of the signal candle (open → close).', guideRVOL:'Volume ÷ 60-bar median. Rule needs ≥ 1.3x.', guideBreakout:'How far the close is above the previous 20-bar high.', guideRSI:'Momentum 0–100. Above 80 = very stretched.', guide30:'Return 30 min after the signal close (tracker).',
    insightSummary:'<b>{tot}</b> long signals so far; <b>{last24}</b> in the last 24 h. Only <b>{eval}</b> have a +30m result, and <b>{wins}</b> of those continued up (avg net <b>{mean}%</b>, median {median}%). The other <b>{nIns}</b> lack complete 1-minute data, so they are <b>not failures</b>. Sample is far too small to judge the strategy.',
    intro25:'Loading {n} historical signals', intro50:'Syncing UTC clock', intro75:'Preparing the signal observatory', intro100:'Snapshot terminal ready',
    closeAria:'{time}, {count} signals. Select candle {index}.', historicalSignals:'{time} · {count} HISTORICAL SIGNALS',
    obsTooltip:'CLOSE {idx} / {len} · {time} · {count} historical signals'
  },
  id:{
    langLabel:'Bahasa', langEN:'EN', langID:'ID', marketOverview:'IKHTISAR PASAR', motionOn:'GERAK ON', motionOff:'GERAK OFF',
    heroEyebrow:'TERMINAL SINYAL 4J', heroTitle:'Buru<br><span class="raptor">momentum<span class="hero-fullstop">.</span></span>', tagline:'Pusat komando berkejernihan tinggi untuk sinyal LONG closed-candle di Binance Futures. Setiap alert. Setiap kondisi. Setiap hasil.', exploreSignals:'EKSPLOR SINYAL <span aria-hidden="true">↗</span>', exportCsv:'EKSPOR CSV <span aria-hidden="true">↓</span>', trust1:'CANDLE 4J SUDAH TUTUP', trust2:'HANYA BACA', trust3:'TANPA AUTO-ORDER', signalRadar:'RADAR SINYAL', radarCenterTop:'MESIN SINYAL RAPTOR', radarCenterBottom:'4J / INTELIJEN CLOSED-CANDLE', radarField:'LAPANGAN SINYAL', radarOrbit:'ORBIT / PINDAI', radarUniverse:'UNIVERSE SAAT EKSPOR', snapshotTitle:'DATA SNAPSHOT', nextClose:'PENUTUPAN 4J BERIKUTNYA', countdown:'HITUNG MUNDUR', dataExported:'DATA DIEKSPOR', recentSignals:'SINYAL TERBARU', preparingSignalSummary:'Menyiapkan ringkasan sinyal...', observatoryKicker:'3D / RIWAYAT SINYAL 4J', observatoryTitle:'Observatorium Sinyal', observatoryDesc:'Jelajahi jumlah sinyal di {closesWord} candle 4J historis yang sudah tutup. Visual riwayat interaktif dengan {closesWord} jumlah yang diekspor secara akurat. Harga live setelah tiap sinyal diperbarui dari stream publik Binance.', observatoryStatus:'MODEL SNAPSHOT · DATA LOKAL', obsOverlay1:'PILIH CANDLE DARI LINIMASA', obsOverlay2:'HISTORIS · BUKAN LIVE', obsSideTitle:'TELEMETRI / EKSPOR', obsSideNote:'HANYA VISUAL · TANPA EKSEKUSI ORDER<br>Kualitas menyesuaikan kemampuan perangkat secara otomatis.', sectionCommandKicker:'01 / IKHTISAR KOMANDO', atAGlance:'Sekilas', historicalTracker:'PELACAK HISTORIS / SINYAL 4J', kpiTotal:'Total Sinyal 4J', kpiTotalSub:'sejak sinyal pertama {date} · {closes} penutupan 4J', kpi24h:'Sinyal 24j', kpi24hSub:'24j sebelum ekspor · dari total {total}', kpiWin:'Win Rate +30m', kpiWinSub:'{wins} dari {eval} sinyal yang bisa dievaluasi · n={eval} · klasifikasi tracker', kpiAvg:'Rata-rata Net +30m', kpiAvgSub:'n={eval} dengan data net · median +{median}% · setelah fee simulasi', kpiEligible:'Simbol Layak', kpiEligibleSub:'dari {universe} kontrak universe · {gap} terblokir gap', performanceKicker:'02 / ANALITIK KINERJA', performanceTitle:'Performa +30 Menit', performanceNote:'hasil tracker, per sinyal yang dapat dievaluasi · n={eval} dari {total}', perSignal:'Per sinyal — return +30m', cumulativeCurve:'Kurva net kumulatif +30m', chipUp:'Lanjut Naik', chipSide:'Sideways', chipReversed:'Berbalik', chipNoData:'Data Tidak Cukup', perfFine1:'Net kumulatif +30m, dikompaun sesuai urutan sinyal, dari {net} sinyal dengan data net. {caveat}', perfFine2:'Return +30m diukur dari harga penutupan sinyal. Sampel masih kecil (n={eval} dievaluasi dari {total} sinyal) — belum cukup untuk menilai kualitas strategi.', signalsKicker:'03 / INTELIJENSI SINYAL', signalsTitle:'Riwayat Sinyal', signalsNote:'{total} sinyal 4J · klik kolom untuk mengurutkan, klik baris untuk detail + chart', searchPlaceholder:'Cari simbol atau market...', filterAll:'SEMUA', filterEvaluated:'DIEVALUASI', filterNoData:'TANPA DATA', results:'HASIL', thSymbol:'Simbol', thClose:'Tutup (WIB)', thPrice:'Harga', thChg:'Perubahan 4J', thBreakout:'Breakout', thTracker:'Hasil Tracker', thLive:'Live', filtersKicker:'04 / LOGIKA STRATEGI', filtersTitle:'Filter Aktif', filtersNote:'ATURAN 4J v2.1.2', systemKicker:'05 / TELEMETRI SISTEM', systemTitle:'Status Sistem', systemNote:'dilaporkan saat dashboard diekspor, bukan feed live browser', footerMotto:'AMATI. VERIFIKASI. PUTUSKAN.', footerRight:'RISET SINYAL INDEPENDEN / 2026', footerDataSource:'<b>Sumber data:</b> Binance Futures Mainnet (USD-M + COIN-M), candle 4J resmi + WebSocket dstream. Harga dan hasil tracker dihitung dari data lokal yang sama dengan mesin sinyal.', footerDisclaimer:'<b>Disclaimer:</b> ini bukan nasihat finansial. Sinyal bersifat HANYA BACA dan tidak pernah membuka order otomatis. Belum ada bukti strategi ini menguntungkan — angka performa di atas adalah hasil tracker historis dari sampel kecil, bukan janji hasil masa depan. Selalu lakukan riset sendiri.', closeOnly:'tutup', snapshotUnavailable:'Timestamp ekspor tidak tersedia', exportedLessThanMinute:'Diekspor kurang dari semenit lalu', exportedMin:'Diekspor {m} menit lalu', exportedHM:'Diekspor {h} jam {m} menit lalu', exportedD:'Diekspor {d} hari lalu', badgeGood:'Lanjut Naik', badgeBad:'Berbalik', badgeNeutral:'Sideways', badgeWarn:'Data Tidak Cukup', badgeUnknown:'Belum dievaluasi', modalChart:'CHART CANDLE 4J · SNAPSHOT ASLI', modalZoom:'ZOOM DETAIL', modalFit:'PAS SELURUH CHART', modalSave:'SIMPAN PNG ↗', modalSignal:'SINYAL LONG 4J', metricClose:'Harga Tutup', metricLive:'Harga Live', metricOpen:'Open', metricChg:'Perubahan 4J', metricEMA20:'EMA 20', metricEMA50:'EMA 50', metricEMA500:'EMA 500', metricRVOL:'RVOL', metricTB:'Taker-Buy (info)', metricATR:'ATR 14', metricBL:'Level Breakout', metricBM:'Margin Breakout', metricHH:'Struktur HH / HL', metricRSI5:'RSI 5m', metricRSI15:'RSI 15m', metricRSI1H:'RSI 1j', metricRSI4H:'RSI 4j', metricSpread:'Spread', metricImpact:'Impact', metricDepth:'Depth', metricBookDelay:'Snapshot order book', metricBookDelayVal:'+{d} setelah close', metricBookNone:'tidak direkam', bookMin:'mnt', bookSec:'dtk', metricLiq:'Likuiditas Tervalidasi', metricVol4H:'Volume 4J', metricVol24H:'Volume 24j', modalTracker:'Evaluasi Tracker (+30 menit)', modalNoTracker:'Belum dievaluasi oleh tracker.', modalInsuff:'Data tidak cukup untuk evaluasi: {reason}', yes:'Ya', noInfo:'Tidak (info saja)', na:'N/A', liveNote:'Harga live di-stream langsung dari feed publik Binance di browser Anda; nilai sinyal, hasil tracker, dan KPI tetap snapshot historis.', liveStale:'stale', liveUnavailable:'live tidak tersedia', liveUpdated:'diperbarui {time}', insightKicker:'01b / RINGKASAN BAHASA SEDERHANA', insightTitle:'Apa kata data', insightNote:'dihitung otomatis dari snapshot ini', biggestMove:'Pergerakan 4J terbesar', highestRVOL:'RVOL tertinggi', best30:'Hasil +30m terbaik', busiestClose:'Penutupan 4J tersibuk', latestSignal:'Sinyal terbaru', outcomeMix:'Komposisi hasil', signalsPerClose:'Sinyal per penutupan 4J (WIB)', howToRead:'Cara membaca tabel', continuedUp:'Lanjut naik (≥ +1% pada +30m)', sideways:'Sideways (gerakan kecil)', reversed:'Berbalik (≤ −1% pada +30m)', noData:'Tanpa data (candle 1m tidak lengkap)', noDataDesc:'“Tanpa data” berarti tracker tidak bisa mengukur, bukan berarti sinyal rugi.', clusters:'Sinyal cenderung muncul saat penutupan volatil; saat sepi biasanya tidak ada.', guideChg:'Perubahan harga candle sinyal (open → close).', guideRVOL:'Volume ÷ median 60-bar. Aturan butuh ≥ 1.3x.', guideBreakout:'Seberapa jauh harga tutup berada di atas high 20-bar sebelumnya.', guideRSI:'Momentum 0–100. Di atas 80 = sangat stretched.', guide30:'Return 30 menit setelah candle sinyal tutup (tracker).', insightSummary:'Sejauh ini ada <b>{tot}</b> sinyal long; <b>{last24}</b> dalam 24 jam terakhir. Hanya <b>{eval}</b> yang punya hasil +30m, dan <b>{wins}</b> di antaranya lanjut naik (avg net <b>{mean}%</b>, median {median}%). Sisanya <b>{nIns}</b> belum punya data 1 menit yang lengkap, jadi itu <b>bukan kegagalan</b>. Sampelnya masih terlalu kecil untuk menilai strategi.', intro25:'Memuat {n} sinyal historis', intro50:'Sinkronisasi jam WIB', intro75:'Menyiapkan observatorium sinyal', intro100:'Terminal snapshot siap', closeAria:'{time}, {count} sinyal. Pilih candle {index}.', historicalSignals:'{time} · {count} SINYAL HISTORIS', obsTooltip:'PENUTUPAN {idx} / {len} · {time} · {count} sinyal historis' }
};
function format(str,obj){return String(str).replace(/\{(\w+)\}/g,function(_,k){return obj&&obj[k]!=null?obj[k]:'';});}
function t(key,obj){var dict=MAP[lang]||MAP.en;var s=dict[key];if(s==null)s=(MAP.en||{})[key]||key;return format(s,obj||{});}
// Number words for the parameterized close count (Jenni, 23 Nov 2026);
// falls back to digits past twenty. Used by updateStatic for
// observatoryDesc ({closesWord}) and kpiTotalSub ({closes}).
var NUM_WORDS={en:['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty'],id:['nol','satu','dua','tiga','empat','lima','enam','tujuh','delapan','sembilan','sepuluh','sebelas','dua belas','tiga belas','empat belas','lima belas','enam belas','tujuh belas','delapan belas','sembilan belas','dua puluh']};
function numWord(n){var w=(NUM_WORDS[lang]||NUM_WORDS.en)[n];return (w!==undefined)?w:String(n);}
// Cumulative-curve caveat (Jenni, audit round 3, 24 Nov 2026): the
// curve covers only the NET-data signals (series.n_eval), not every
// gross-evaluable signal (kpis.n_eval). The old fineprint claimed
// every non-curve signal "could not be evaluated (incomplete 1m
// data)" — wrong for the 28 that WERE evaluated and only lack net
// data (spread unavailable at signal time). Split them honestly,
// with correct singular/plural in both languages.
function curveCaveat(data){
  var id=get()==='id';
  var gross=(data.kpis&&data.kpis.n_eval)||0;
  var net=(data.series&&data.series.n_eval)||0;
  var noNet=gross-net, missing=((data.kpis&&data.kpis.total)||0)-gross;
  var out=[];
  if(noNet>0)out.push(noNet+' '+(id?'sinyal yang sudah dievaluasi tidak punya data net (spread tidak tersedia saat sinyal)':('evaluated signal'+(noNet===1?' has':'s have')+' no net data (spread unavailable at signal time)')));
  if(missing>0)out.push(missing+' '+(id?'sinyal tidak bisa dievaluasi (data 1m tidak lengkap)':('signal'+(missing===1?'':'s')+' could not be evaluated (incomplete 1m data)')));
  if(!out.length)return id?'Kurva ini mencakup semua sinyal yang dievaluasi.':'This curve covers every evaluable signal.';
  return out.join('; ')+' — '+(id?'kurva ini tidak mewakili semua sinyal.':'this curve does not represent all signals.');
}
function get(){return lang;}
function useWIB(){return lang==='id';}
function set(next){if(next!=='id'&&next!=='en')return;lang=next;try{localStorage.setItem('raptorLang',lang);}catch(e){}
d.documentElement.setAttribute('lang',lang==='id'?'id':'en');d.documentElement.dataset.lang=lang;updateButtons();updateStatic();subs.forEach(function(fn){try{fn(lang);}catch(e){}});window.dispatchEvent(new CustomEvent('raptor:lang',{detail:{lang:lang}}));}
function onChange(fn){subs.push(fn);}
function updateButtons(){d.querySelectorAll('[data-lang]').forEach(function(btn){var on=btn.getAttribute('data-lang')===lang;btn.classList.toggle('active',on);btn.setAttribute('aria-pressed',String(on));});}
function qs(sel){return d.querySelector(sel)}
function setHTML(sel,html){var el=qs(sel);if(el)el.innerHTML=html}
function setText(sel,txt){var el=qs(sel);if(el)el.textContent=txt}
function updateStatic(){
  var data=window.RAPTOR_DATA||{kpis:{},meta:{}};
  // Close count from the embedded series (Jenni, 23 Nov 2026). If it cannot
  // be determined, observatoryDesc/kpiTotalSub are left untouched below so
  // the correct server-rendered values stay — never write a wrong number.
  var closesN=(data.series&&data.series.signals_per_close)?data.series.signals_per_close.length:0;
  setText('.topline-location b','RAPTOR / INTELLIGENCE');
  var spans=d.querySelectorAll('.topline-location span'); if(spans[1]) spans[1].textContent=t('marketOverview');
  setHTML('.topline-market','BINANCE FUTURES <span class="tiny-dot"></span> 4H / LONG');
  setText('.lang-switch-label',t('langLabel'));
  setHTML('.eyebrow', '<span class="eyebrow-line"></span> '+t('heroEyebrow')+' <span class="eyebrow-index">/ 001</span>');
  setHTML('.brand h1', t('heroTitle'));
  setText('.tagline',t('tagline'));
  setHTML('.primary-btn',t('exploreSignals'));
  setHTML('#export-csv',t('exportCsv'));
  var trust=d.querySelector('.hero-trust'); if(trust) trust.innerHTML='<span class="trust-item"><span class="trust-check">✓</span>'+t('trust1')+'</span><span class="trust-divider"></span><span class="trust-item"><span class="trust-check">✓</span>'+t('trust2')+'</span><span class="trust-divider"></span><span class="trust-item"><span class="trust-check">✓</span>'+t('trust3')+'</span>';
  var rh=d.querySelector('.radar-header'); if(rh) rh.innerHTML='<span><span class="radar-led"></span> '+t('signalRadar')+'</span><span>3D / 04H</span>';
  setText('.radar-center-top',t('radarCenterTop')); var rsmall=qs('.radar-center small'); if(rsmall) rsmall.textContent=t('radarCenterBottom');
  var tech=d.querySelectorAll('.radar-tech span'); if(tech[0]) tech[0].textContent=t('radarField'); if(tech[1]) tech[1].textContent=t('radarOrbit');
  var rf=qs('.radar-footer'); if(rf) rf.innerHTML='<span>'+t('radarUniverse')+' <strong id="radar-universe">'+Number(data.kpis.eligible||0).toLocaleString('en-US')+'</strong></span><span class="radar-bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span><span>UTC SYNC</span>';
  setText('#snapshot-status',t('snapshotTitle'));
  var meta=d.querySelectorAll('.hero-meta-block > span'); if(meta[0])meta[0].textContent=t('nextClose'); if(meta[1])meta[1].textContent=t('countdown'); if(meta[2])meta[2].textContent=t('dataExported');
  setHTML('.tape-label','<span class="tape-label-dot"></span> '+t('recentSignals')); setText('.tape-placeholder',t('preparingSignalSummary'));
  var ok=qs('.obs-kicker'); if(ok) ok.innerHTML='<span class="obs-pulse"></span> '+t('observatoryKicker');
  var oh=qs('.observatory .obs-heading h2'); if(oh) oh.innerHTML=t('observatoryTitle')+'<span style="color:var(--fx-lime)">.</span>'; var op=qs('.observatory .obs-heading p'); if(op&&closesN>0)op.textContent=t('observatoryDesc',{closesWord:numWord(closesN)}); setText('#obs-status',t('observatoryStatus')); var ov=d.querySelectorAll('.obs-overlay span'); if(ov[0])ov[0].innerHTML='<span class="obs-cross">⊕</span> '+t('obsOverlay1'); if(ov[1])ov[1].textContent=t('obsOverlay2'); setText('.obs-side-title',t('obsSideTitle')); var osn=qs('.obs-side-note'); if(osn) osn.innerHTML=t('obsSideNote');
  var sh=d.querySelector('.kpi-heading'); if(sh){sh.querySelector('.section-kicker').textContent=t('sectionCommandKicker'); sh.querySelector('h2').innerHTML=t('atAGlance')+'<span class="section-heading-period">.</span>'; sh.querySelector('.heading-meta').textContent=t('historicalTracker');}
  var kpis=d.querySelectorAll('.kpi');
  if(kpis[0]){kpis[0].querySelector('.kpi-label').textContent=t('kpiTotal');if(closesN>0)kpis[0].querySelector('.kpi-sub').innerHTML=t('kpiTotalSub',{date:data.kpis.first_signal_date||'',closes:closesN});}
  if(kpis[1]){kpis[1].querySelector('.kpi-label').textContent=t('kpi24h');kpis[1].querySelector('.kpi-sub').innerHTML=t('kpi24hSub',{total:data.kpis.total||0});}
  if(kpis[2]){kpis[2].querySelector('.kpi-label').textContent=t('kpiWin');kpis[2].querySelector('.kpi-sub').innerHTML=t('kpiWinSub',{wins:data.kpis.wins||0,eval:data.kpis.n_eval||0});}
  if(kpis[3]){kpis[3].querySelector('.kpi-label').textContent=t('kpiAvg');kpis[3].querySelector('.kpi-sub').innerHTML=t('kpiAvgSub',{eval:(data.series&&data.series.n_eval)||0,median:Number(data.kpis.median_net||0).toFixed(2)});} /* JENNI audit round 3: mean/median net are computed over the NET-data signals (series.n_eval), not the gross-evaluable count (kpis.n_eval) — the sub used to claim n=355 for an average over 327. */
  if(kpis[4]){kpis[4].querySelector('.kpi-label').textContent=t('kpiEligible');kpis[4].querySelector('.kpi-sub').innerHTML=t('kpiEligibleSub',{universe:data.kpis.universe_total||0,gap:data.kpis.gap_blocked||0});}
  var perf=qs('#performance'); if(perf){perf.querySelector('.section-kicker').textContent=t('performanceKicker'); perf.querySelector('h2').innerHTML=t('performanceTitle')+' <span class="h2-note">'+t('performanceNote',{eval:data.kpis.n_eval||0,total:data.kpis.total||0})+'</span>'; perf.querySelectorAll('.sub-h')[0].textContent=t('perSignal'); perf.querySelectorAll('.sub-h')[1].textContent=t('cumulativeCurve'); /* JENNI FIX 24 Nov 2026: build.py renders FOUR chips (Up/Sideways/Reversed/NoData) but this assumed THREE by index, overwriting the Reversed chip with the NoData label+count — "Insufficient Data: 7" twice, "Reversed: 27" lost. Match by tone class and keep the server-rendered <b>count</b> as the single source. */ perf.querySelectorAll('.chip').forEach(function(c){var b=c.querySelector('b');if(!b)return;var lbl=c.classList.contains('good')?t('chipUp'):c.classList.contains('bad')?t('chipReversed'):c.classList.contains('warn')?t('chipNoData'):t('chipSide');c.innerHTML=lbl+': '+b.outerHTML;}); var fps=perf.querySelectorAll('.fineprint'); if(fps[0])fps[0].textContent=t('perfFine1',{net:(data.series&&data.series.n_eval)||0,caveat:curveCaveat(data)}); /* JENNI audit round 3: the curve covers only the NET-data signals; the old fineprint used the gross count and claimed every non-curve signal "could not be evaluated" — wrong for the 28 that were evaluated and only lack net data. */ if(fps[1])fps[1].textContent=t('perfFine2',{eval:data.kpis.n_eval||0,total:data.kpis.total||0}); }
  var sig=qs('#signals'); if(sig){sig.querySelector('.section-kicker').textContent=t('signalsKicker'); sig.querySelector('h2').innerHTML=t('signalsTitle')+' <span class="h2-note">'+t('signalsNote',{total:data.kpis.total||0})+'</span>'; var inp=qs('#signal-search'); if(inp){inp.placeholder=t('searchPlaceholder'); inp.setAttribute('aria-label',t('searchPlaceholder'));} var fbs=d.querySelectorAll('.filter-btn'); if(fbs[0])fbs[0].childNodes[0].textContent=t('filterAll')+' '; if(fbs[1])fbs[1].textContent=t('filterEvaluated'); if(fbs[2])fbs[2].textContent=t('filterNoData'); var th=sig.querySelectorAll('thead th'); if(th[0])th[0].childNodes[0].textContent=t('thSymbol'); if(th[1])th[1].childNodes[0].textContent=t('thClose'); if(th[2])th[2].childNodes[0].textContent=t('thPrice'); if(th[3])th[3].childNodes[0].textContent=t('thChg'); if(th[5])th[5].childNodes[0].textContent=t('thBreakout'); if(th[8])th[8].childNodes[0].textContent=t('thTracker'); if(th[9])th[9].childNodes[0].textContent=t('thLive');}
  var fil=qs('#filters'); if(fil){fil.querySelector('.section-kicker').textContent=t('filtersKicker'); fil.querySelector('h2').innerHTML=t('filtersTitle')+' <span class="h2-note">'+t('filtersNote')+'</span>';}
  var sys=qs('#system'); if(sys){sys.querySelector('.section-kicker').textContent=t('systemKicker'); sys.querySelector('h2').innerHTML=t('systemTitle')+' <span class="h2-note">'+t('systemNote')+'</span>';}
  var foot=qs('footer'); if(foot){foot.querySelector('.footer-brand small').textContent=t('footerMotto'); foot.querySelector('.footer-right').textContent=t('footerRight'); var ps=foot.querySelectorAll('p'); if(ps[0]) ps[0].innerHTML=t('footerDataSource'); if(ps[1]) ps[1].innerHTML=t('footerDisclaimer'); if(ps[2]){ var ts=Number(data.meta.generated_ts||0); if(ts){ var when=t('dataExported')+': '+(useWIB()?formatLocal(ts,'Asia/Jakarta',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false})+' WIB':formatLocal(ts,'UTC',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false})+' UTC'); ps[2].textContent='Raptor Trade · '+when+' · '+(get()==='id'?'dashboard diperbarui manual pada setiap deploy; pengiriman alert dikonfigurasi ke WhatsApp saat ekspor':'dashboard updated manually on each deploy; alert delivery was configured for WhatsApp at export'); } }}
  d.querySelectorAll('[data-v15-history]').forEach(function(el){
    el.textContent=el.closest('#signals')?(get()==='id'?'SNAPSHOT / TANPA ORDER LIVE':'SNAPSHOT / NO LIVE ORDERS'):(get()==='id'?'JEJAK HISTORIS':'HISTORICAL TRACE');
  });
  // Navigation labels and actual control captions also follow the chosen language.
  var isIndonesian=get()==='id';
  var navNames=isIndonesian?['Ikhtisar','Performa','Sinyal','Aturan','Sistem']:['Overview','Performance','Signals','Rules','System'];
  d.querySelectorAll('.rail-nav .rail-link').forEach(function(a,i){if(navNames[i]){a.querySelector('span').textContent=navNames[i];a.setAttribute('aria-label',navNames[i]);a.title=navNames[i];}});
  var obsc=qs('.observatory');
  if(obsc){
    var st=obsc.querySelectorAll('.obs-side-title');if(st[1])st[1].textContent=isIndonesian?'MODE VISUALISASI':'VISUALIZATION MODE';
    var lm=obsc.querySelectorAll('.obs-metric>span');var names=isIndonesian?['Penutupan 4J','Sinyal','Puncak / Tutup']:['4H Closes','Signals','Peak / Close'];
    lm.forEach(function(x,i){if(names[i])x.textContent=names[i];});
    var modes=obsc.querySelectorAll('.obs-mode');var captions=isIndonesian?['01 / MEDAN ORBIT','02 / MATRIKS DATA','03 / INTI SINYAL','↻ RESET KAMERA']:['01 / ORBIT FIELD','02 / DATA MATRIX','03 / SIGNAL CORE','↻ RESET CAMERA'];
    modes.forEach(function(b,i){if(captions[i])b.textContent=captions[i];});
  }
  if(fil){
    var rules=fil.querySelectorAll('.rules-list li');
    var localRules=isIndonesian?[
      '<b>Candle 4J sudah tutup</b> — evaluasi hanya pada penutupan, bukan saat candle masih berjalan.',
      '<b>Breakout:</b> harga tutup di atas high 20 candle sebelumnya dan di atas open candle ini.',
      '<b>Volume:</b> volume candle minimal 1,3× median 60 candle (RVOL ≥ 1,3×).',
      '<b>Dedup:</b> satu sinyal per simbol dalam tiga penutupan (12 jam) — hanya sinyal terbaru.',
      '<b>Simbol dikecualikan:</b> USDCUSDT dan USDBRLUSDT tidak menghasilkan sinyal — instrumen yang terkait mata uang, bukan target pump.',
      '<b>Data lengkap:</b> minimal 61 candle 4J berturut-turut tanpa gap; jika ada gap, tidak ada sinyal.',
      '<b>Info saja:</b> EMA 20 / 50 / 500, ATR 14, taker-buy, momentum HH/HL, RSI 5m / 15m / 1j / 4j, likuiditas live (spread, impact, depth).'
    ]:[
      '<b>4H candle closed</b> — evaluation only at the close, never intra-candle.',
      '<b>Breakout:</b> close above the previous 20-bar high, and close above this bar\'s open.',
      '<b>Volume:</b> this bar\'s volume at least 1.3x the 60-bar median (RVOL ≥ 1.3x).',
      '<b>Dedup:</b> one signal per symbol per 3 closes (12 hours) — once only, the fresh one.',
      '<b>Excluded symbols:</b> USDCUSDT + USDBRLUSDT never signal — fiat-anchored instruments (stablecoin / forex rate), not pump targets.',
      '<b>Complete data:</b> at least 61 consecutive 4H bars with no gaps; any gap means no signal.',
      '<b>Info only:</b> EMA 20 / 50 / 500, ATR 14, taker-buy, momentum HH/HL, RSI 5m / 15m / 1h / 4h, live liquidity (spread, impact, depth).'
    ];
    rules.forEach(function(li,i){if(localRules[i])li.innerHTML=localRules[i];});
    var fh=fil.querySelectorAll('.sub-h');if(fh[0])fh[0].textContent=isIndonesian?'Syarat — semuanya harus lolos':'Gates — all must pass';if(fh[1])fh[1].textContent=isIndonesian?'Info saja — dihitung dan dicatat, bukan filter':'Info only — computed & logged, never blocks';
    var note=fil.querySelector('.integrity-note');if(note)note.innerHTML=isIndonesian?'<strong>Catatan data historis:</strong> Riwayat ekspor ini masih memuat USDCUSDT dan USDBRLUSDT, meskipun aturan pengecualian tersebut tertulis di atas. Rekaman tetap dipertahankan. Periksa waktu penerapan aturan sebelum menyimpulkan.':'<strong>Historical-data note:</strong> This exported history includes USDCUSDT and USDBRLUSDT despite the exclusion rule listed above. Records are retained unchanged. Check the timing of the rule rollout before drawing conclusions.';
  }
  if(sys){
    var rows=sys.querySelectorAll('.hrow');var labels=isIndonesian?['WebSocket Mainnet (dstream)','Usia heartbeat saat ekspor','Koneksi ulang WS','Uptime layanan','Backfill','Candle hilang (MDTUSDT, Okt)']:['Mainnet WebSocket (dstream)','Heartbeat age at export','WS reconnects','Service uptime','Backfill','Missing bars (MDTUSDT, Oct)'];
    rows.forEach(function(r,i){if(labels[i])r.querySelector('span').textContent=labels[i];});
    if(rows[0])rows[0].querySelector('.hval').textContent=isIndonesian?'Terhubung saat ekspor':'Connected at export';
    if(rows[4])rows[4].querySelector('.hval').textContent=isIndonesian?'selesai':'complete';
    var p=sys.querySelector('.fineprint');if(p)p.textContent=isIndonesian?'Scanner berjalan 24/7 pada data Binance Futures Mainnet (file resmi Binance Vision + WebSocket), sesuai kondisi yang dicatat dalam ekspor. Telegram dijeda pada konfigurasi yang diunggah; notifikasi dikonfigurasi ke WhatsApp.':'Scanner runs 24/7 on Binance Futures Mainnet data (official Binance Vision files + WebSocket) as recorded in this export. Telegram was paused in the uploaded configuration; notifications were configured for WhatsApp.';
  }
  var motionBtn=qs('#motion-toggle .motion-text'); if(motionBtn){ motionBtn.textContent=d.documentElement.classList.contains('motion-off')?t('motionOff'):t('motionOn'); }
}
function formatLocal(ts,timeZone,opts){return new Intl.DateTimeFormat(get()==='id'?'id-ID':'en-GB',Object.assign({timeZone:timeZone},opts||{})).format(new Date(ts*1000));}
window.RaptorLang={t:t,get:get,set:set,onChange:onChange,useWIB:useWIB,formatLocal:formatLocal};
d.addEventListener('DOMContentLoaded',function(){
  updateButtons(); updateStatic();
  var wrap=d.querySelector('.topline-tools');
  var box=d.getElementById('lang-switch');
  if(!box && wrap){
    box=d.createElement('div'); box.className='lang-switch'; box.id='lang-switch';
    box.setAttribute('role','group');box.setAttribute('aria-label','Language / Bahasa');
    box.innerHTML='<span class="lang-switch-label">'+t('langLabel')+'</span><button type="button" class="lang-btn" data-lang="en" aria-pressed="false">EN</button><button type="button" class="lang-btn" data-lang="id" aria-pressed="false">ID</button>';
    wrap.insertBefore(box, d.getElementById('motion-toggle'));
  }
  if(box && !box.dataset.langBound){
    box.dataset.langBound='1';
    box.addEventListener('click',function(e){var btn=e.target.closest('[data-lang]'); if(btn) set(btn.getAttribute('data-lang'));});
  }
  updateButtons();
  updateStatic();

});
set(lang);
})();
