/* Raptor Trade — TradingView tab for the Deep-Dive Terminal (build-owned).
   Adds a 4th DDT chart tab embedding TradingView's Advanced Chart widget
   (iframe) for the selected signal's Binance perpetual symbol, at 4H.
   experience-v23.js / experience-v24.js are never edited: this layer
   observes #ddt-detail rebuilds and re-injects the tab after each render.
   Limits (stated to the user): the widget cannot show the signal lines
   or EMA from our snapshot, and for symbols TradingView does not list,
   the tab shows TradingView's own empty state. */
(()=>{'use strict';
const TV_SCRIPT='https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const detail=$('#ddt-detail');
const T=window.RaptorTerminal;
if(!detail||!T)return;
const lang=()=>window.RaptorLang&&window.RaptorLang.get()==='id'?'id':'en';
const STR={
 en:{tab:'TradingView',
     desc:'TradingView chart · 4H · no signal lines or EMA here · empty means TradingView does not list this symbol yet.',
     loading:'Loading TradingView chart…',
     failed:'TradingView did not load — check your connection, or use the LIVE 4H tab.'},
 id:{tab:'TradingView',
     desc:'Chart TradingView · 4H · tanpa garis sinyal & EMA · kosong berarti TradingView belum melisting simbol ini.',
     loading:'Memuat chart TradingView…',
     failed:'TradingView tidak termuat — periksa koneksi, atau pakai tab LIVE 4H.'}};
const t=k=>STR[lang()][k];
let tvActive=false,lastMode=T.getMode(),loadedSid=null,loadTimer=null;

/* Binance perpetual on TradingView: BINANCE:<BASE>.P (USD-M and COIN-M alike). */
function tvSymbol(sig){
 const base=String(sig.symbol||'').toUpperCase().replace(/_PERP$/,'');
 return 'BINANCE:'+base+'.P';
}
function injectTab(){
 const tabs=$('.ddt-chart-tabs',detail);if(!tabs)return;
 let btn=$('.ddt-tab[data-mode="tradingview"]',tabs);
 if(!btn){
  btn=document.createElement('button');
  btn.type='button';btn.className='ddt-tab';btn.dataset.mode='tradingview';
  btn.textContent=t('tab');
  btn.addEventListener('click',activateTV);
  tabs.appendChild(btn);
 }
 btn.setAttribute('aria-pressed',String(tvActive));
}
function setCaption(){
 const cap=$('.v23-chart-caption>span',detail);
 if(cap&&cap.textContent!==t('desc'))cap.textContent=t('desc');
}
function loadWidget(sig){
 const surface=$('.ddt-chart-surface',detail);if(!surface)return;
 surface.classList.remove('v24-live-surface');
 surface.classList.add('tv-surface');
 surface.innerHTML='<div class="tv-widget-wrap"><div class="tradingview-widget-container tv-chart"><div class="tradingview-widget-container__widget"></div><div class="tv-loading">'+t('loading')+'</div></div></div>';
 const box=$('.tradingview-widget-container__widget',surface);
 const sc=document.createElement('script');
 sc.type='text/javascript';sc.async=true;sc.src=TV_SCRIPT;
 sc.textContent=JSON.stringify({symbol:tvSymbol(sig),interval:'240',theme:'dark',style:'1',locale:lang()==='id'?'id':'en',timezone:'Asia/Jakarta',autosize:true,allow_symbol_change:true,hide_side_toolbar:false,details:false,hotlist:false,calendar:false,support_host:'https://www.tradingview.com'});
 box.appendChild(sc);
 loadedSid=sig.signal_id;
 clearInterval(loadTimer);
 let n=0;
 loadTimer=setInterval(()=>{
  n++;
  const frame=$('.tradingview-widget-container__widget iframe',surface);
  const load=$('.tv-loading',surface);
  if(frame){if(load)load.remove();clearInterval(loadTimer);loadTimer=null;}
  else if(n>=30){if(load)load.textContent=t('failed');clearInterval(loadTimer);loadTimer=null;}
 },500);
}
function activateTV(){
 tvActive=true;
 const sig=T.getSelected();if(!sig)return;
 $$('.ddt-tab',detail).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode==='tradingview')));
 setCaption();
 loadWidget(sig);
}
function onDetailChanged(){
 const mode=T.getMode();
 if(mode!==lastMode){tvActive=false;lastMode=mode;}
 injectTab();
 if(!tvActive)return;
 const sig=T.getSelected();if(!sig)return;
 /* Rebuilds (signal change, language change) wipe the widget: restore it. */
 if(!$('.tv-widget-wrap',detail)||loadedSid!==sig.signal_id)activateTV();
 else{
  $$('.ddt-tab',detail).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode==='tradingview')));
  setCaption();
 }
}
/* Any click on one of his tabs (capture phase, before his handler) leaves TV mode. */
detail.addEventListener('click',e=>{
 const tab=e.target.closest&&e.target.closest('.ddt-tab');
 if(tab&&tab.dataset.mode!=='tradingview')tvActive=false;
},true);
/* API calls from elsewhere (e.g. the modal's "open live chart" button) leave TV mode. */
const _setMode=T.setMode.bind(T),_openSignal=T.openSignal.bind(T);
T.setMode=v=>{tvActive=false;return _setMode(v);};
T.openSignal=(sid,v)=>{tvActive=false;return _openSignal(sid,v);};
const io=new MutationObserver(onDetailChanged);
io.observe(detail,{childList:true,subtree:true});
injectTab();
window.RaptorTVTab={isActive:()=>tvActive,symbol:()=>{const s=T.getSelected();return s?tvSymbol(s):null}};
})();
