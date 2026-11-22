/* Raptor Trade v24 — Real Binance 4H Futures live chart
   Exact selected-symbol REST candles + 4H WebSocket updates.
   Snapshot markers remain immutable; no synthetic OHLCV is ever generated.
   Only one WebSocket/chart is active, with cleanup on selection/tab changes.

   JENNI build-owned change (23 Nov 2026, v25): Binance's WAF returns
   HTTP 403 (HTML error page) to the Pages Worker's REST fetch from
   every Cloudflare colo — the Worker path cannot load candles. Candle
   history is now fetched FIRST from the Binance WebSocket API
   (wss://ws-fapi/ws-dapi …/v1, klines method — same official 4H OHLCV
   arrays as REST, no CORS/WAF issue in browsers), with the Worker REST
   endpoint kept as fallback. Row validation is unchanged and shared by
   both paths (normalizeRows); no synthetic OHLCV is ever generated.
 */
(()=>{'use strict';
const D=window.RAPTOR_DATA||{};
const L=window.RaptorLang||{get:()=>"en",useWIB:()=>false};
const $=(s,r=document)=>r.querySelector(s);
const streamHosts={'USD-M':'wss://fstream.binance.com/ws/','COIN-M':'wss://dstream.binance.com/ws/'};
const REST_HOSTS={'USD-M':'https://fapi.binance.com/fapi/v1/klines','COIN-M':'https://dapi.binance.com/dapi/v1/klines'};
const INTERVAL=14400;
let current=null;
let serial=0;
let lastSignal=null;
let wsEnabled=true;
const isID=()=>L.get()==='id';
const str=(en,id)=>isID()?id:en;
const money=n=>Number.isFinite(n)?new Intl.NumberFormat('en-US',{maximumFractionDigits:n>=100?2:n>=1?4:6}).format(n):'—';
function safeSet(id,text){const e=$('#'+id);if(e)e.textContent=text;}
function signalMarket(s){return s.market==='COIN-M'?'COIN-M':'USD-M';}
function parseRow(row){
 if(!Array.isArray(row)||row.length<6)return null;
 const t=Number(row[0]),o=Number(row[1]),h=Number(row[2]),l=Number(row[3]),c=Number(row[4]),v=Number(row[5]);
 if(!Number.isFinite(t)||t<1e12||![o,h,l,c,v].every(Number.isFinite)||Math.min(o,h,l,c)<=0||v<0||h<Math.max(o,c,l)||l>Math.min(o,c,h))return null;
 // Binance 4H openTime is aligned in UTC, no arbitrary time zones.
 if(t% (INTERVAL*1000)!==0)return null;
 return {time:t/1000,open:o,high:h,low:l,close:c,volume:v};
}
function calcEMA(values,period){
 // EMA starts at SMA(period), with no artificial warm-up points.
 const k=2/(period+1),out=[];let sum=0,last=null;
 for(let i=0;i<values.length;i++){
  sum+=values[i].close;
  if(i<period-1)continue;
  if(i===period-1)last=sum/period;
  else last=values[i].close*k+last*(1-k);
  out.push({time:values[i].time,value:last});
 }
 return out;
}
function marketCandle(s){return Math.floor((Number(s.close_ts)-1)/INTERVAL)*INTERVAL;}
function alignment(s,rows){
 const target=marketCandle(s),match=rows.find(r=>r.time===target);
 if(!match) return {match:null,note:str('Signal candle not found in returned window; original PNG remains available.','Candle sinyal tidak ditemukan pada rentang data; PNG asli tetap tersedia.')};
 const difference=Math.abs(match.close-s.price)/Math.max(s.price,1e-10)*100;
 return {match,note:difference<=0.1
  ?str(`Historical signal matched • ${new Date(target*1000).toISOString().slice(0,16).replace('T',' ')} UTC`,`Candle historis cocok • ${new Date(target*1000).toISOString().slice(0,16).replace('T',' ')} UTC`)
  :str(`Snapshot/exchange close discrepancy: ${difference.toFixed(3)}%. Compare with original PNG.`,`Harga tutup snapshot/exchange berbeda ${difference.toFixed(3)}%. Bandingkan dengan PNG asli.`),difference};
}
function status(kind,message){
 const n=$('#v24-live-status');if(!n)return;
 n.dataset.state=kind;n.textContent=message;
}
function note(text){safeSet('v24-live-alignment',text)}
function setQuote(c,live=false){safeSet('v24-live-quote',Number.isFinite(c)?(live?str('Live 4H: ','Live 4J: '):str('Latest 4H: ','4J terbaru: '))+money(c):'—')}
function cleanup(){
 if(!current)return;
 current.dead=true;
 clearTimeout(current.reconnect);
 clearTimeout(current.refresh);
 clearTimeout(current.emaTimer);
 clearInterval(current.wsStaleTimer);
 current.abort?.abort();
 try{current.socket?.close(1000,'Changed selection')}catch{}
 try{current.resize?.disconnect()}catch{}
 try{current.observe?.disconnect()}catch{}
 try{current.chart?.remove()}catch{}
 current=null;
}
function fail(message){status('error',str('OFFLINE · ','OFFLINE · ')+message);note(str('Live candles unavailable. Use Official PNG to review the original signal.','Candle live tidak tersedia. Pilih PNG Resmi untuk melihat sinyal asli.'));
 const mount=$('#v24-live-chart');if(!mount)return;
 mount.innerHTML='<div class="v24-live-unavailable"><span aria-hidden="true">◉</span><strong>'+str('Live candlestick feed unavailable','Data candlestick live tidak tersedia')+'</strong><p id="v24-error-message"></p><button type="button" id="v24-show-png">'+str('Show Official PNG','Lihat PNG Resmi')+'</button></div>';
 safeSet('v24-error-message',message);
 $('#v24-show-png')?.addEventListener('click',()=>window.RaptorTerminal?.setMode('source'));
}
function normalizeRows(arr){
 if(!Array.isArray(arr))throw new Error('Invalid JSON market payload');
 const rows=arr.map(parseRow).filter(Boolean).sort((a,b)=>a.time-b.time);
 const dedup=rows.filter((row,i)=>i===0||row.time!==rows[i-1].time);
 if(dedup.length<20)throw new Error('Not enough official 4H candles for indicators');
 return dedup;
}
// --- 4H candle history ---------------------------------------------
// History comes FIRST from the same-origin snapshot klines-4h.json:
// the last 200 closed 4H bars per signal, exported by build.py from
// the same Mainnet candles the engine evaluates. Why not live from
// Binance: the Worker REST proxy is blocked by Binance's CloudFront
// WAF (403 on Cloudflare egress IPs), the browser cannot call REST
// directly (no CORS), and the futures WebSocket API has NO klines
// method at all (only depth / ticker.book / ticker.price — verified
// from Binance's docs, 23 Nov 2026; the live error on Raka's phone
// said "Method /fapi/v1/klines is invalid"). The snapshot refreshes
// via the auto-sync cron (every 5 min when it changes, i.e. at each
// 4H close); the live kline stream still supplies the current
// partial bar, so the chart stays live where it matters. Cached in
// memory for 5 min; a failed refresh falls back to the stale copy
// rather than the (blocked) Worker.
let snapshotCache=null,snapshotPromise=null,snapshotFetchedAt=0;
function loadSnapshot(){
 if(snapshotCache&&Date.now()-snapshotFetchedAt<=5*60*1000)
   return Promise.resolve(snapshotCache);
 if(!snapshotPromise){
   snapshotPromise=fetch('klines-4h.json',{cache:'no-store',headers:{Accept:'application/json'}})
     .then(response=>{if(!response.ok)throw new Error('HTTP '+response.status);return response.json();})
     .then(data=>{snapshotCache=data;snapshotFetchedAt=Date.now();return data;})
     .catch(error=>{snapshotPromise=null;throw error;});
 }
 return snapshotPromise;
}
async function candles(s,abort){
 const qs=new URLSearchParams({symbol:s.symbol,market:signalMarket(s),limit:'600'});
 const targets=['/api/futures/klines?'+qs.toString()];
 // Local preview is not running a Cloudflare Worker; direct Binance REST is a fallback.
 if(location.protocol==='file:' || location.hostname==='localhost' || location.hostname==='127.0.0.1'){
   targets.push(REST_HOSTS[signalMarket(s)]+'?symbol='+encodeURIComponent(s.symbol)+'&interval=4h&limit=600');
 }
 let snapErr='not tried';
 // 1. Same-origin snapshot (present for every signal symbol).
 try{
   const snap=await loadSnapshot();
   const arr=snap[s.symbol];
   if(!Array.isArray(arr))throw new Error('symbol not in snapshot');
   return normalizeRows(arr);
 }catch(e){
   snapErr=e?.message||String(e);
   if(snapshotCache&&Array.isArray(snapshotCache[s.symbol])){
     try{return normalizeRows(snapshotCache[s.symbol]);}catch{}
   }
 }
 // 2. Worker REST proxy (and direct REST on local preview).
 let lastError='Data feed unavailable';
 for(const target of targets){
   try{
     const response=await fetch(target,{signal:abort.signal,headers:{Accept:'application/json'},cache:'no-store'});
     if(!response.ok){let msg='HTTP '+response.status;try{const j=await response.json();if(typeof j?.error==='string')msg=j.error;}catch{}lastError=msg;continue;}
     const payload=await response.json();
     if(!Array.isArray(payload) && (payload.symbol!==s.symbol || payload.market!==signalMarket(s) || payload.interval!=='4h'))throw new Error('Unexpected symbol or interval returned by market endpoint');
     const arr=Array.isArray(payload)?payload:payload.klines;
     return normalizeRows(arr);
   }catch(e){if(e?.name==='AbortError')throw e;lastError=e?.message||String(e);}
 }
 // Both paths failed: report each, so the next screenshot diagnoses it.
 throw new Error('Snapshot: '+snapErr+' | Worker: '+lastError);
}
function createChart(c){
 const LW=window.LightweightCharts;
 const mount=$('#v24-live-chart');if(!mount)throw new Error('Chart mount missing');
 if(!LW?.createChart || !LW.CandlestickSeries || !LW.LineSeries || !LW.HistogramSeries){if(window.RaptorNativeChart)return window.RaptorNativeChart(mount); throw new Error('Chart renderer unavailable');}
 const chart=LW.createChart(mount,{
  width:Math.max(250,mount.clientWidth),height:Math.max(260,mount.clientHeight),
  layout:{background:{type:'solid',color:'#050c14'},textColor:'#91adb9',fontFamily:'JetBrains Mono, ui-monospace, monospace',fontSize:11,attributionLogo:true},
  grid:{vertLines:{color:'rgba(79,134,151,.10)'},horzLines:{color:'rgba(79,134,151,.12)'}},
  crosshair:{mode:LW.CrosshairMode?.Normal??0,vertLine:{color:'rgba(66,216,231,.32)',labelBackgroundColor:'#133646'},horzLine:{color:'rgba(66,216,231,.32)',labelBackgroundColor:'#133646'}},
  rightPriceScale:{borderColor:'rgba(105,146,166,.24)',scaleMargins:{top:.07,bottom:.23}},
  timeScale:{borderColor:'rgba(105,146,166,.24)',timeVisible:true,secondsVisible:false,barSpacing:9,lockVisibleTimeRangeOnResize:true,rightOffset:6},
  localization:{locale:isID()?'id-ID':'en-GB',timeFormatter:epoch=>{
    const date=new Date(epoch*1000);
    return new Intl.DateTimeFormat(isID()?'id-ID':'en-GB',{timeZone:isID()?'Asia/Jakarta':'UTC',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:false}).format(date)+(isID()?' WIB':' UTC');
  }},
  handleScroll:{mouseWheel:true,pressedMouseMove:true,horzTouchDrag:true,vertTouchDrag:false},
  handleScale:{mouseWheel:true,pinch:true,axisPressedMouseMove:true},
 });
 const candle=chart.addSeries(LW.CandlestickSeries,{upColor:'#35d5bd',downColor:'#f16273',borderUpColor:'#35d5bd',borderDownColor:'#f16273',wickUpColor:'#35d5bd',wickDownColor:'#f16273',lastValueVisible:true,priceLineVisible:true});
 const ema20=chart.addSeries(LW.LineSeries,{color:'#33d9d0',lineWidth:2,lastValueVisible:false,priceLineVisible:false,crosshairMarkerVisible:false});
 const ema50=chart.addSeries(LW.LineSeries,{color:'#ffa93c',lineWidth:2,lastValueVisible:false,priceLineVisible:false,crosshairMarkerVisible:false});
 const volume=chart.addSeries(LW.HistogramSeries,{priceFormat:{type:'volume'},priceScaleId:'volume',priceLineVisible:false,lastValueVisible:false});
 volume.priceScale().applyOptions({scaleMargins:{top:.80,bottom:0},visible:false});
 return {chart,candle,ema20,ema50,volume,LW};
}
function paint(c,rows,s){
 c.rows=rows;
 c.candle.setData(rows.map(({time,open,high,low,close})=>({time,open,high,low,close})));
 c.volume.setData(rows.map(r=>({time:r.time,value:r.volume,color:r.close>=r.open?'rgba(49,207,174,.45)':'rgba(241,98,115,.45)'})));
 const a=calcEMA(rows,20),b=calcEMA(rows,50);
 c.ema20.setData(a);c.ema50.setData(b);
 c.candle.createPriceLine({price:s.price,color:'rgba(198,255,85,.9)',lineStyle:2,lineWidth:1,axisLabelVisible:true,title:str('4H SIGNAL CLOSE','TUTUP SINYAL 4J')});
 if(Number.isFinite(s.breakout_level)&&s.breakout_level>0){c.candle.createPriceLine({price:s.breakout_level,color:'rgba(77,203,255,.8)',lineStyle:2,lineWidth:1,axisLabelVisible:true,title:'BREAKOUT'});}
 const align=alignment(s,rows);note(align.note);
 if(align.match){
   const markers=[{time:align.match.time,position:'belowBar',shape:'arrowUp',color:'#c8ff55',text:str('HIST SIGNAL','SINYAL HIST')}];
   if(c._native)c._native.setMarkers(markers);
   else if(typeof c.LW.createSeriesMarkers==='function')c.markers=c.LW.createSeriesMarkers(c.candle,markers);
 }
 const last=rows[rows.length-1];setQuote(last.close);
 const start=align.match?Math.max(0,rows.findIndex(r=>r.time===align.match.time)-40):Math.max(0,rows.length-72);
 const end=rows.length-1;
 try{c.chart.timeScale().setVisibleLogicalRange({from:Math.max(0,start),to:end+6});}catch{c.chart.timeScale().fitContent()}
}
function updateFromWS(c,raw,s){
 const k=raw.k;
 if(raw.s!==s.symbol||!k||k.i!=='4h')return false;
 const r=parseRow([k.t,k.o,k.h,k.l,k.c,k.v]);if(!r)return false;
 const last=c.rows[c.rows.length-1];
 if(r.time<last.time)return false;
 if(r.time>last.time+INTERVAL)return 'gap';
 if(r.time===last.time)c.rows[c.rows.length-1]=r;
 else c.rows.push(r);
 c.candle.update({time:r.time,open:r.open,high:r.high,low:r.low,close:r.close});
 c.volume.update({time:r.time,value:r.volume,color:r.close>=r.open?'rgba(49,207,174,.45)':'rgba(241,98,115,.45)'});
 const a=calcEMA(c.rows,20),b=calcEMA(c.rows,50);
 if(a.length)c.ema20.update(a[a.length-1]);
 if(b.length)c.ema50.update(b[b.length-1]);
 setQuote(r.close,true);
 return true;
}
function startWebsocket(c,s){
 if(current!==c||c.dead||document.hidden)return;
 const url=streamHosts[signalMarket(s)]+s.symbol.toLowerCase()+'@kline_4h';
 let socket;
 try{socket=new WebSocket(url)}catch(e){status('offline',str('WS UNAVAILABLE · snapshot candles loaded','WS TIDAK TERSEDIA · candle historis termuat'));return}
 c.socket=socket;
 status('connecting',str('CANDLES READY · connecting live stream…','CANDLE SIAP · menghubungkan stream live…'));
 socket.onopen=()=>{if(current!==c||c.dead)return; c.attempt=0;status('connecting',str('WS CONNECTED · awaiting market tick','WS TERHUBUNG · menanti data pasar'));};
 socket.onmessage=e=>{
  if(current!==c||c.dead)return;
  let msg;try{msg=JSON.parse(e.data)}catch{return}
  // Some WS endpoints wrap messages in {data}.
  if(msg?.data)msg=msg.data;
  const result=updateFromWS(c,msg,s);
  if(result==='gap'){onRender(s,'live');return;}
  if(result===true){
   c.lastTick=Date.now();
   status('live',str('LIVE · Binance Futures 4H candle','LIVE · candle 4J Binance Futures'));
  }
 };
 const retry=()=>{
   if(current!==c||c.dead||document.hidden)return;
   if(c.socket!==socket)return;
   c.socket=null;
   status('offline',str('RECONNECTING · last confirmed candle preserved','MENGHUBUNGKAN ULANG · candle terakhir dipertahankan'));
   const delay=Math.min(30000,1500*Math.pow(2,Math.min(c.attempt++,5)));
   c.reconnect=setTimeout(()=>startWebsocket(c,s),delay);
 };
 socket.onerror=()=>{if(current!==c)return;status('offline',str('WEBSOCKET ERROR · retrying','KESALAHAN WEBSOCKET · mencoba lagi'));};
 socket.onclose=()=>{if(current!==c||c.dead)return;retry()};
}
async function load(s,version){
 if(!$('#v24-live-shell'))return;
 const c={id:version,signal:s,dead:false,attempt:0,socket:null,abort:new AbortController(),rows:[]};
 current=c;
 status('connecting',str('FETCHING REAL BINANCE FUTURES 4H CANDLES','MEMUAT CANDLE 4J BINANCE FUTURES ASLI'));
 try{
  const rows=await candles(s,c.abort);
  if(current!==c||c.dead)return;
  const built=createChart(c);
  Object.assign(c,built);
  paint(c,rows,s);
  c.resize=new ResizeObserver(()=>{if(current!==c||c.dead)return;const e=$('#v24-live-chart');if(e)c.chart.applyOptions({width:Math.max(250,e.clientWidth),height:Math.max(260,e.clientHeight)})});
  c.resize.observe($('#v24-live-chart'));
  // HTTP candles are current as of response time, but not proof of live WS.
  status('connecting',str('CANDLES LOADED · connecting WS…','CANDLE TERSEDIA · menghubungkan WS…'));
  c.wsStaleTimer=setInterval(()=>{if(current!==c||c.dead||!c.lastTick||document.hidden)return;if(Date.now()-c.lastTick>120000 && c.socket?.readyState===1){status('offline',str('WS IDLE · waiting for new market tick','WS DIAM · menunggu data transaksi baru'));}},20000);
  startWebsocket(c,s);
 }catch(e){if(e?.name==='AbortError'||current!==c)return;cleanup();fail(e?.message||str('Could not fetch official 4H candles','Tidak bisa mengambil candle 4J resmi'));}
}
function onRender(s,mode){
 lastSignal=s;
 serial++;
 cleanup();
 if(mode!=='live')return;
 const version=serial;
 // Defer to allow DOM to reflow after the previous chart was removed.
 requestAnimationFrame(()=>{if(version!==serial||!$('#v24-live-shell'))return;load(s,version);});
}
window.RaptorLiveChart={onRender,openSignal:(sid)=>{const result=window.RaptorTerminal?.openSignal(sid,'live');if(result){$('#deep-terminal')?.scrollIntoView({behavior:'smooth',block:'start'})}return result;},_parseRow:parseRow,_calcEMA:calcEMA,_marketCandle:marketCandle};
// The original v23 script loads before this script; restore its initial live tab.
const initial=window.RaptorTerminal?.getSelected?.();
if(initial && window.RaptorTerminal?.getMode?.()==='live')onRender(initial,'live');
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){if(current?.socket){const old=current.socket;current.socket=null;try{old.close(1000,'Page hidden')}catch{}};clearTimeout(current?.reconnect);if(current)current.reconnect=null;}
 else if(current&&!current.dead&&!current.socket)startWebsocket(current,current.signal);
});
// Modal historical PNG remains unchanged; add a distinct explicit live-navigation action.
const modal=$('#modal-body');
function decorateModal(){
 if(!modal||!modal.querySelector('.modal-head')||modal.querySelector('#v24-modal-live'))return;
 const h=modal.querySelector('#modal-title');if(!h)return;
 const symbol=h.textContent.trim().split(/\s+/)[0];
 const hash=(location.hash||'').match(/^#sig=([A-Z0-9]+)_(\d+)$/);
 const match=(D.signals||[]).find(s=>s.symbol===symbol&&(!hash||(s.symbol===hash[1]&&Math.round(s.close_ts)===Number(hash[2]))));
 if(!match)return;
 const button=document.createElement('button');
 button.type='button';button.id='v24-modal-live';button.className='v24-modal-live';button.textContent=str('OPEN LIVE 4H CHART ↗','BUKA CHART LIVE 4J ↗');
 button.addEventListener('click',()=>{
  modal.querySelector('#modal-close')?.click();
  window.RaptorLiveChart?.openSignal(match.signal_id);
 });
 modal.querySelector('.modal-head').insertBefore(button,modal.querySelector('.modal-close'));
}
if(modal){new MutationObserver(decorateModal).observe(modal,{childList:true});decorateModal()}
window.addEventListener('raptor:lang',()=>{
 // v23 rerenders itself; the next onRender will rebuild chart using the selected language.
 setTimeout(()=>{const btn=$('#v24-modal-live');if(btn)btn.textContent=str('OPEN LIVE 4H CHART ↗','BUKA CHART LIVE 4J ↗')},0)
});
})();
