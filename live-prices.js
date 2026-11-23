/* Raptor Trade — live price layer (Jenni, 23 Nov 2026, v23).
   Streams live prices for signaled symbols straight from the Binance
   public feed in the visitor's browser. No backend, no keys, no proxy.
   Snapshot data (signals, tracker results, KPIs) is untouched — this
   layer only fills the "Live" table column, the modal "Live Price"
   row, and the LIVE badge. It NEVER fabricates a price: no tick means
   connecting / stale / unavailable, shown honestly.
   Primary: miniTicker WebSocket per market (USD-M fstream, COIN-M
   dstream), connected to the bare /ws endpoint with a JSON SUBSCRIBE
   after open. The combined /stream?streams= URL carried all 331
   USD-M symbols (~10KB) and was rejected in practice — every USD-M
   cell showed "live unavailable" in the 24 Nov audit — while the
   short COIN-M URL and the single-stream kline WS worked. SUBSCRIBE
   carries the stream list in the message body, not the URL.
   Fallback: REST ticker/price batch poll every 5s while a market's
   WebSocket is down, chunked at 100 symbols per request for the
   same URL-length reason. */
(function(){
'use strict';
var DATA = window.RAPTOR_DATA || {signals: []};
var I18N = window.RaptorLang || {t: function(k){ return k; }, get: function(){ return 'en'; }};
var STALE_MS = 15000;
var WS_CONNECT_TIMEOUT_MS = 8000;
var REST_POLL_MS = 5000;
var UNAVAILABLE_AFTER_MS = 30000;
var STARTED_AT = Date.now();

/* ---- symbol universe: unique symbols per market ---- */
var MARKETS = {}; /* market -> {symbols:[], ws:null, wsFailed:false, restFailed:false, transportUpAt:0, reconnectAt:0, attempts:0} */
(DATA.signals || []).forEach(function(s){
  if(!s || !s.symbol) return;
  var m = s.market || 'USD-M';
  if(!MARKETS[m]) MARKETS[m] = {symbols: [], ws: null, wsFailed: false, restFailed: false, transportUpAt: 0, reconnectTimer: null, attempts: 0, restTimer: null};
  if(MARKETS[m].symbols.indexOf(s.symbol) === -1) MARKETS[m].symbols.push(s.symbol);
});
var MARKET_NAMES = Object.keys(MARKETS);
if(!MARKET_NAMES.length) return; /* no signals, nothing to stream */

var WS_URL = {'USD-M': 'wss://fstream.binance.com/ws', 'COIN-M': 'wss://dstream.binance.com/ws'};
var REST_URL = {'USD-M': 'https://fapi.binance.com/fapi/v1/ticker/price', 'COIN-M': 'https://dapi.binance.com/dapi/v1/ticker/price'};

/* ---- price store: key "SYMBOL|MARKET" -> {price, lastTick} ---- */
var prices = {};
var lastUpdateAt = 0; /* ms of the last successful tick/REST update, any symbol */
function keyOf(symbol, market){ return symbol + '|' + (market || 'USD-M'); }
function marketDown(m){
  var st = MARKETS[m];
  return !!(st && st.wsFailed && st.restFailed);
}
function symbolState(symbol, market){
  var p = prices[keyOf(symbol, market)];
  if(!p || p.price === null || p.price === undefined){
    if(marketDown(market)) return 'unavailable';
    if(Date.now() - STARTED_AT > UNAVAILABLE_AFTER_MS) return 'unavailable';
    return 'connecting';
  }
  if(Date.now() - p.lastTick > STALE_MS) return 'stale';
  return 'live';
}

/* ---- formatting (mirrors app.js fmtPrice) ---- */
function fmtLivePrice(v){
  if(v === null || v === undefined || !isFinite(v)) return null;
  if(Math.abs(v) >= 10000) return v.toLocaleString('en-US', {maximumFractionDigits: 0});
  if(Math.abs(v) >= 100) return v.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  return String(Number(v.toPrecision(6)));
}
function fmtChg(live, close){
  if(close === null || close === undefined || !isFinite(close) || close === 0) return null;
  var pct = (live - close) / close * 100;
  if(!isFinite(pct)) return null;
  var glyph = pct > 0 ? '\u25B2 ' : (pct < 0 ? '\u25BC ' : '\u2014 ');
  return {text: glyph + (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%', cls: pct >= 0 ? 'up' : 'down'};
}

/* ---- DOM rendering ---- */
function cellHtml(symbol, market, closeRef){
  var state = symbolState(symbol, market);
  var p = prices[keyOf(symbol, market)];
  if(state === 'connecting'){
    return '<span class="live-dot connecting"></span><span class="live-price">\u2026</span>';
  }
  if(state === 'unavailable'){
    return '<span class="live-dot unavailable"></span><span class="live-price">\u2014</span><span class="live-tag">' + I18N.t('liveUnavailable') + '</span>';
  }
  var priceTxt = fmtLivePrice(p.price);
  var chg = fmtChg(p.price, closeRef);
  var out = '<span class="live-dot ' + state + '"></span><span class="live-price">' + (priceTxt === null ? '\u2014' : priceTxt) + '</span>';
  if(chg) out += '<span class="live-chg ' + chg.cls + '">' + chg.text + '</span>';
  if(state === 'stale') out += '<span class="live-tag">' + I18N.t('liveStale') + '</span>';
  return out;
}
function renderEl(el){
  var symbol = el.getAttribute('data-live-symbol');
  var market = el.getAttribute('data-live-market') || 'USD-M';
  var closeRaw = el.getAttribute('data-live-close');
  var closeRef = (closeRaw === null || closeRaw === '') ? null : parseFloat(closeRaw);
  var html = cellHtml(symbol, market, closeRef);
  if(el._liveHtml !== html){ el.innerHTML = html; el._liveHtml = html; }
}
function globalState(){
  var anyLive = false, anyStale = false, anyConnecting = false;
  MARKET_NAMES.forEach(function(m){
    MARKETS[m].symbols.forEach(function(sym){
      var st = symbolState(sym, m);
      if(st === 'live') anyLive = true;
      else if(st === 'stale') anyStale = true;
      else if(st === 'connecting') anyConnecting = true;
    });
  });
  if(anyLive) return 'live';
  if(anyStale) return 'stale';
  if(anyConnecting) return 'connecting';
  return 'unavailable';
}
var lastNoteHtml = null;
function renderChrome(){
  var gs = globalState();
  var badgeDot = document.getElementById('live-badge-dot');
  if(badgeDot) badgeDot.className = 'live-dot ' + gs;
  var thDot = document.getElementById('live-th-dot');
  if(thDot) thDot.className = 'live-dot ' + gs;
  var note = document.getElementById('live-note');
  if(note){
    var html = I18N.t('liveNote');
    if(lastUpdateAt){
      var time = new Date(lastUpdateAt).toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false});
      html += ' <span class="live-updated">\u00B7 ' + I18N.t('liveUpdated', {time: time}) + '</span>';
    }
    if(html !== lastNoteHtml){ note.innerHTML = html; lastNoteHtml = html; }
  }
}
function renderAll(){
  var els = document.querySelectorAll('[data-live-symbol]');
  for(var i = 0; i < els.length; i++) renderEl(els[i]);
  renderChrome();
}
function renderSymbol(symbol, market){
  var els = document.querySelectorAll('[data-live-symbol]');
  for(var i = 0; i < els.length; i++){
    var el = els[i];
    if(el.getAttribute('data-live-symbol') === symbol && (el.getAttribute('data-live-market') || 'USD-M') === market) renderEl(el);
  }
  renderChrome();
}

/* ---- tick intake (shared by WS + REST) ---- */
function onPrice(symbol, market, price, via){
  var v = parseFloat(price);
  if(!isFinite(v)) return;
  var k = keyOf(symbol, market);
  /* Always refresh lastTick, even when the price is unchanged — a tick
     proves the feed is alive. renderEl's HTML cache skips redundant DOM writes. */
  prices[k] = {price: v, lastTick: Date.now()};
  lastUpdateAt = Date.now();
  var st = MARKETS[market];
  if(st){
    if(via === 'ws') st.wsFailed = false;
    if(via === 'rest') st.restFailed = false;
    if(!st.transportUpAt) st.transportUpAt = Date.now();
  }
  renderSymbol(symbol, market);
}

/* ---- WebSocket (primary): bare /ws + SUBSCRIBE ---- */
function connectWs(market){
  var st = MARKETS[market];
  if(!st || typeof WebSocket === 'undefined') return;
  try{ if(st.ws){ st.ws.close(); } }catch(e){}
  var ws;
  try{ ws = new WebSocket(WS_URL[market] || WS_URL['USD-M']); }catch(e){ onWsDown(market); return; }
  st.ws = ws;
  var opened = false;
  var timer = setTimeout(function(){
    if(!opened && ws.readyState === WebSocket.CONNECTING){ try{ ws.close(); }catch(e){} }
  }, WS_CONNECT_TIMEOUT_MS);
  ws.onopen = function(){
    opened = true; clearTimeout(timer);
    st.attempts = 0; st.wsFailed = false;
    if(!st.transportUpAt) st.transportUpAt = Date.now();
    /* Subscribe after connect — the stream list goes in the message
       body, not the URL (see header note). */
    try{
      ws.send(JSON.stringify({method: 'SUBSCRIBE',
        params: st.symbols.map(function(s){ return s.toLowerCase() + '@miniTicker'; }),
        id: 1}));
    }catch(e){ /* send failed: onclose/onerror will drive the retry */ }
    renderAll();
  };
  ws.onmessage = function(ev){
    var msg;
    try{ msg = JSON.parse(ev.data); }catch(e){ return; }
    /* /stream wraps events in msg.data; /ws sends the event directly.
       The SUBSCRIBE ack {result:null,id:1} has no .s and is ignored. */
    var d = (msg && msg.data) || msg;
    if(d && d.s && d.c !== undefined) onPrice(String(d.s), market, d.c, 'ws');
  };
  var down = function(){ clearTimeout(timer); onWsDown(market); };
  ws.onerror = down;
  ws.onclose = down;
}
function onWsDown(market){
  var st = MARKETS[market];
  if(!st) return;
  st.wsFailed = true;
  if(st.ws){ try{ st.ws.onopen = st.ws.onmessage = st.ws.onerror = st.ws.onclose = null; }catch(e){} st.ws = null; }
  if(st.reconnectTimer) return;
  var delay = Math.min(1000 * Math.pow(2, st.attempts), 30000);
  st.attempts++;
  st.reconnectTimer = setTimeout(function(){
    st.reconnectTimer = null;
    connectWs(market);
  }, delay);
  renderAll();
}

/* ---- REST fallback (only while a market's WS is not open) ----
   Chunked at 100 symbols per request: one 331-symbol ?symbols=
   array is ~8KB of URL, the same length problem as the old WS URL. */
function restPoll(market){
  var st = MARKETS[market];
  if(!st || typeof fetch === 'undefined') return;
  if(st.ws && st.ws.readyState === WebSocket.OPEN) return; /* WS healthy: no polling */
  var base = REST_URL[market] || REST_URL['USD-M'];
  var chunks = [];
  for(var i = 0; i < st.symbols.length; i += 100) chunks.push(st.symbols.slice(i, i + 100));
  var pending = chunks.length, anyOk = false;
  function finish(){
    pending--;
    if(pending === 0 && !anyOk){ st.restFailed = true; renderAll(); }
  }
  chunks.forEach(function(syms){
    var url = base + '?symbols=' + encodeURIComponent(JSON.stringify(syms));
    fetch(url).then(function(res){
      if(!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then(function(rows){
      if(!Array.isArray(rows)) throw new Error('unexpected payload');
      anyOk = true;
      st.restFailed = false;
      if(!st.transportUpAt) st.transportUpAt = Date.now();
      rows.forEach(function(r){
        if(r && r.symbol && r.price !== undefined) onPrice(String(r.symbol), market, r.price, 'rest');
      });
      renderAll();
      finish();
    }).catch(function(){ finish(); });
  });
}

/* ---- boot ---- */
MARKET_NAMES.forEach(function(m){
  connectWs(m);
  setInterval(function(){ restPoll(m); }, REST_POLL_MS);
  setTimeout(function(){ restPoll(m); }, 1500); /* early REST probe: covers WS-blocked networks fast */
});
setInterval(renderAll, 1000); /* staleness transitions + re-apply after re-renders */
if('MutationObserver' in window){
  var mo = new MutationObserver(function(){ renderAll(); });
  mo.observe(document.body, {childList: true, subtree: true});
}
window.addEventListener('raptor:lang', function(){
  var els = document.querySelectorAll('[data-live-symbol]');
  for(var i = 0; i < els.length; i++) els[i]._liveHtml = null; /* labels changed: force re-render */
  lastNoteHtml = null;
  renderAll();
});
renderAll();

/* Read-only debug handle (no control surface). */
window.RaptorLive = {getState: function(){
  var out = {markets: {}, lastUpdateAt: lastUpdateAt};
  MARKET_NAMES.forEach(function(m){
    var st = MARKETS[m];
    out.markets[m] = {symbols: st.symbols.length, wsOpen: !!(st.ws && st.ws.readyState === WebSocket.OPEN), wsFailed: st.wsFailed, restFailed: st.restFailed};
  });
  return out;
}};
})();
