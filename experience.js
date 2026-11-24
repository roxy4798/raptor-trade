/* RAPTOR TRADE / command interface — interactive UX layer.
   Purely local UI enhancement: never modifies signal data or connects to an exchange. */
(function(){
'use strict';
var d=document, root=d.documentElement, DATA=window.RAPTOR_DATA || {signals:[],meta:{},kpis:{}};
var I18N=window.RaptorLang||{t:function(k){return k;},get:function(){return 'en';},useWIB:function(){return false;}};
var $=function(s){return d.querySelector(s);};
var $$=function(s){return Array.prototype.slice.call(d.querySelectorAll(s));};
var reduced=!!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

function pad(n){return String(n).padStart(2,'0');}
function nextCloseTime(){
  var now=new Date(), hr=now.getUTCHours(), next=(Math.floor(hr/4)+1)*4;
  var end=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()));
  if(next===24){end.setUTCDate(end.getUTCDate()+1);next=0;}
  end.setUTCHours(next);
  return end;
}
function formatExportDate(ts, tz, lang){
  var fmt=new Intl.DateTimeFormat(lang==='id'?'id-ID':'en-GB',{timeZone:tz,day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false});
  return fmt.format(new Date(ts*1000)).replace('.',':');
}
function clockTick(){
  var time=$('#world-clock'), useWIB=I18N.useWIB();
  if(time){
    try{
      if(useWIB) time.textContent='WIB '+new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Jakarta',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date());
      else time.textContent='UTC '+new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date());
    }catch(e){ time.textContent=useWIB?'WIB / UTC+7':'UTC'; }
  }
  var next=nextCloseTime(), w=$('#next-close-wib'), u=$('#next-close-utc');
  if(w) w.textContent=pad((next.getUTCHours()+7)%24)+':00 WIB';
  if(u) u.textContent=pad(next.getUTCHours())+':00 UTC';
  if(w) w.style.display=useWIB?'inline':'none';
  if(u) u.style.display=useWIB?'none':'inline';
  var ex=$('#exported-time');
  if(ex){
    var ts=DATA.meta&&Number(DATA.meta.generated_ts||0);
    if(ts){ ex.textContent = useWIB ? formatExportDate(ts,'Asia/Jakarta','id')+' WIB' : formatExportDate(ts,'UTC','en')+' UTC'; }
  }
}
function snapshotTick(){
  var el=$('#snapshot-age');if(!el)return;
  var stamp=DATA.meta && Number(DATA.meta.generated_ts);
  if(!stamp){el.textContent=I18N.t('snapshotUnavailable');return;}
  var age=Math.max(0,Math.floor(Date.now()/1000-stamp));
  if(age<60) el.textContent=I18N.t('exportedLessThanMinute');
  else if(age<3600) el.textContent=I18N.t('exportedMin',{m:Math.floor(age/60)});
  else if(age<86400) el.textContent=I18N.t('exportedHM',{h:Math.floor(age/3600),m:Math.floor(age%3600/60)});
  else el.textContent=I18N.t('exportedD',{d:Math.floor(age/86400)});
}
clockTick();snapshotTick();
setInterval(clockTick,1000);setInterval(snapshotTick,30000);
window.addEventListener('raptor:lang',function(){clockTick();snapshotTick();});

var ticker=$('#signal-tape');
if(ticker && DATA.signals.length){
  ticker.textContent='';
  var picks=DATA.signals.slice().sort(function(a,b){return b.close_ts-a.close_ts;}).slice(0,8);
  function addItem(s,clone){
    var item=d.createElement('span');item.className='tape-item';
    if(clone)item.setAttribute('aria-hidden','true');
    var sym=d.createElement('strong');sym.textContent=s.symbol;
    var change=d.createElement('em');var v=s.chg_4h;
    change.textContent=(v>=0?'+':'')+v.toFixed(2)+'%';
    var tag=d.createElement('span');tag.textContent=s.market;
    var sep=d.createElement('i');sep.setAttribute('aria-hidden','true');
    item.append(sym,change,tag,sep);ticker.appendChild(item);
  }
  picks.forEach(function(s){addItem(s,false);}); picks.forEach(function(s){addItem(s,true);});
}
var universe=$('#radar-universe'); if(universe && DATA.kpis) universe.textContent=Number(DATA.kpis.eligible||0).toLocaleString('en-US');
$$('.kpi').forEach(function(card,i){if(card.querySelector('.kpi-number'))return; var n=d.createElement('span');n.className='kpi-number';n.textContent=pad(i+1)+' / 05';card.appendChild(n);});

var search=$('#signal-search'), switches=$$('.filter-btn'), active='all';
function filterChange(){window.dispatchEvent(new CustomEvent('raptor:filter',{detail:{search:search?search.value:'',filter:active}}));}
if(search){search.addEventListener('input',filterChange);}
switches.forEach(function(btn){btn.addEventListener('click',function(){
  active=btn.dataset.filter || 'all';
  switches.forEach(function(b){var selected=b===btn;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
  filterChange();
});});
d.addEventListener('keydown',function(e){
  var tag=d.activeElement && d.activeElement.tagName;
  if(e.key==='/' && !e.ctrlKey && !e.metaKey && !e.altKey && tag!=='INPUT' && tag!=='TEXTAREA' && tag!=='SELECT' && !$('#modal-backdrop').classList.contains('open')){e.preventDefault();if(search){search.focus();search.select();}}
});
var allCount=$('#all-count');if(allCount)allCount.textContent=DATA.signals.length;

var exportButton=$('#export-csv');
if(exportButton)exportButton.addEventListener('click',function(){
  var keys=['symbol','market','close_wib','close_utc','close_ts','price','open','chg_4h','rvol','breakout_margin','rsi_4h','taker_buy','atr14_pct','quote_volume','tracker_classification','tracker_r30','tracker_net','tf_h4','tf_h12','tf_h1d','tf_h2d','tf_h3d','tf_h1w'];
  function cell(v){ if(v===null||v===undefined)return '""'; var str=String(v); if(/^[=+@\-]/.test(str) && isNaN(Number(str)))str="'"+str; return '"'+str.replace(/"/g,'""')+'"'; }
  var rows=[keys.join(',')];
  (DATA.signals||[]).forEach(function(s){ var tr=s.tracker||{}; rows.push(keys.map(function(k){ if(k==='tracker_classification')return cell(tr.classification); if(k==='tracker_r30')return cell(tr.r30); if(k==='tracker_net')return cell(tr.net); if(k.indexOf('tf_')===0){ var h=(s.tf||{})[k.slice(3)]; return cell(h&&h.status==='evaluated'?h.return_pct/100:null); } return cell(s[k]); }).join(',')); });
  var file=new Blob(['\ufeff',rows.join('\r\n')],{type:'text/csv;charset=utf-8'});
  var url=URL.createObjectURL(file),anchor=d.createElement('a');
  anchor.href=url;anchor.download='raptor-trade-signals-'+new Date((DATA.meta.generated_ts||Date.now()/1000)*1000).toISOString().slice(0,10)+'.csv';
  d.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(function(){URL.revokeObjectURL(url);},4000);
});

var motion=$('#motion-toggle');
function motionRefresh(){
  var off=reduced || root.classList.contains('motion-off');
  if(motion){ motion.querySelector('.motion-text').textContent=off?I18N.t('motionOff'):I18N.t('motionOn');
    motion.querySelector('.motion-icon').textContent=off?'⏸':'✳';
    motion.setAttribute('aria-pressed',String(off)); motion.setAttribute('aria-label',off?'Turn visual motion on':'Turn visual motion off'); motion.title=reduced?'Reduced motion enabled in your device settings':''; motion.disabled=reduced; }
}
if(reduced)root.classList.add('motion-off');
try{ if(localStorage.getItem('raptorMotionOff')==='1') root.classList.add('motion-off'); }catch(e){}
motionRefresh();
if(motion)motion.addEventListener('click',function(){ var off=!root.classList.contains('motion-off'); root.classList.toggle('motion-off',off); try{localStorage.setItem('raptorMotionOff',off?'1':'0');}catch(e){} if(window.gsap){window.gsap.globalTimeline.paused(off);} motionRefresh(); });
window.addEventListener('raptor:lang',motionRefresh);

var anchors=$$('.rail-link[data-section]');
if('IntersectionObserver' in window){
  var observer=new IntersectionObserver(function(entries){ entries.forEach(function(entry){ if(!entry.isIntersecting)return; anchors.forEach(function(a){var on=a.dataset.section===entry.target.id; a.classList.toggle('active',on); if(on)a.setAttribute('aria-current','location'); else a.removeAttribute('aria-current');}); }); },{rootMargin:'-15% 0px -65% 0px',threshold:0});
  ['overview','performance','signals','filters','system'].forEach(function(id){var node=d.getElementById(id); if(node)observer.observe(node);});
}
})();
