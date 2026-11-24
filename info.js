/* Raptor info layer — computed from window.RAPTOR_DATA, language-aware. */
(function(){'use strict';
var D=window.RAPTOR_DATA, I18N=window.RaptorLang||{t:function(k){return k;}, useWIB:function(){return false;}, onChange:function(){}}; if(!D)return;
var K=D.kpis,S=D.series,G=D.signals||[];
function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e}
function f(n,d){return Number(n).toFixed(d)}
function top(k){return G.reduce(function(a,b){return (b[k]!=null&&(a==null||b[k]>a[k]))?b:a},null)}
function closeText(v){ return I18N.useWIB() ? (v.close_wib+' WIB') : (v.close_utc+' UTC'); }
var ev=G.filter(function(s){return s.tracker&&s.tracker.r30!=null});
var bestR=ev.reduce(function(a,b){return !a||b.tracker.r30>a.tracker.r30?b:a},null);
var mv=top('chg_4h'),rv=top('rvol'),lat=G[0];
var nIns=K.classes['INSUFFICIENT DATA']||0,nUp=K.classes['PUMP CONTINUED']||0,nSw=K.classes['SIDEWAYS']||0,nRev=K.classes['REVERSAL']||0,tot=K.total||G.length;
var maxC=Math.max.apply(null,S.signals_per_close.map(function(c){return c.count})); var busy=S.signals_per_close.filter(function(c){return c.count===maxC})[0];
/* v37b: time labels must never sit on adjacent columns — with the
   columns now sharing the cell (min-width:0), adjacent "HH:MM" labels
   overlap (the max bar at i=16 sat next to the every-3rd label at 15,
   and the last bar at 19 next to the one at 18). Keep last + max
   first, then every 3rd unless adjacent to a kept label. */
var lastIdx=S.signals_per_close.length-1, maxIdx=S.signals_per_close.indexOf(busy);
var labelIdx={}; labelIdx[lastIdx]=1;
if(maxIdx!==lastIdx&&Math.abs(maxIdx-lastIdx)>1)labelIdx[maxIdx]=1;
for(var li=0;li<=lastIdx;li+=3){ if(labelIdx[li])continue; var adj=false; for(var k in labelIdx){ if(Math.abs(+k-li)<=1){adj=true;break} } if(!adj)labelIdx[li]=1; }
var sec=el('section','card insight'); sec.id='insight';
function render(){
  sec.innerHTML='<div class="ins-head"><div><div class="section-kicker">'+I18N.t('insightKicker')+'</div><h2>'+I18N.t('insightTitle')+' <span class="h2-note">'+I18N.t('insightNote')+'</span></h2></div></div>'+
  '<p class="ins-sum">'+I18N.t('insightSummary',{tot:tot,last24:K.last24,eval:K.n_eval,wins:K.wins,mean:(K.mean_net>=0?'+':'')+f(K.mean_net,2),median:f(K.median_net,2),nIns:nIns})+'</p>'+
  '<div class="ins-hl">'+
  (mv?'<div class="hl"><small>'+I18N.t('biggestMove')+'</small><strong class="up">▲ +'+f(mv.chg_4h,2)+'%</strong><span>'+mv.symbol+' · '+closeText(mv)+'</span></div>':'')+
  (rv?'<div class="hl"><small>'+I18N.t('highestRVOL')+'</small><strong>'+f(rv.rvol,2)+'x</strong><span>'+rv.symbol+' · volume vs 60-bar median</span></div>':'')+
  (bestR?'<div class="hl"><small>'+I18N.t('best30')+'</small><strong class="up">▲ +'+f(bestR.tracker.r30*100,2)+'%</strong><span>'+bestR.symbol+' · before fees</span></div>':'')+
  (busy?'<div class="hl"><small>'+I18N.t('busiestClose')+'</small><strong>'+maxC+' signals</strong><span>'+(I18N.useWIB()?busy.close_wib+' WIB': new Date(busy.close_ts*1000).toISOString().slice(8,10)+' '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][new Date(busy.close_ts*1000).getUTCMonth()]+' '+String(new Date(busy.close_ts*1000).getUTCHours()).padStart(2,'0')+':00 UTC')+'</span></div>':'')+
  (lat?'<div class="hl"><small>'+I18N.t('latestSignal')+'</small><strong>'+lat.symbol.replace('USDT','')+'</strong><span>'+closeText(lat)+' · RSI 4h '+f(lat.rsi_4h,1)+'</span></div>':'')+
  '</div><div class="ins-grid">'+
  '<div><h3>'+I18N.t('outcomeMix')+'</h3><div class="mix" role="img" aria-label="Outcome mix">'+
  /* v37: REVERSAL was missing from the bar + legend (the 3-category list
     predates it) — the bar summed to ~92%. Segments use flex-grow so the
     2px gaps never clip the smallest segment. */
  [[nUp,'#c6ff4d'],[nSw,'#35f0ff'],[nRev,'#ff5d73'],[nIns,'#ffb02e']].map(function(a,i){return '<i style="--i:'+i+';flex:'+a[0]+' 1 0%;background:'+a[1]+'"></i>'}).join('')+'</div>'+
  '<ul class="mix-leg"><li><em style="background:#c6ff4d"></em>'+I18N.t('continuedUp')+'<b>'+nUp+' · '+f(nUp/tot*100,0)+'%</b></li><li><em style="background:#35f0ff"></em>'+I18N.t('sideways')+'<b>'+nSw+' · '+f(nSw/tot*100,0)+'%</b></li><li><em style="background:#ff5d73"></em>'+I18N.t('reversed')+'<b>'+nRev+' · '+f(nRev/tot*100,0)+'%</b></li><li><em style="background:#ffb02e"></em>'+I18N.t('noData')+'<b>'+nIns+' · '+f(nIns/tot*100,0)+'%</b></li></ul>'+
  '<p class="ins-note">'+I18N.t('noDataDesc')+'</p></div>'+
  '<div><h3>'+I18N.t('signalsPerClose')+'</h3><div class="cl">'+
  /* v37: the 294 flood bar overflowed the 130px chart and its label bled
     into the guide column ("tumpang tindih"). Bar heights now use a
     square-root scale (the count labels still show true numbers) capped
     at 68% so count + time labels fit inside the column, and time
     labels render only for labelIdx (v37b: every 3rd close + max + last,
     de-adjacent — never two neighbouring columns, or the "HH:MM"
     labels overlap once the columns share the cell).
     (full label stays in the title attr). */
  S.signals_per_close.map(function(c,i){ var p=maxC?Math.sqrt(c.count)/Math.sqrt(maxC)*68:0; var label=I18N.useWIB()? c.close_wib+' WIB' : new Date(c.close_ts*1000).toISOString().slice(11,16)+' UTC'; var short=I18N.useWIB()?c.close_wib.slice(-5):new Date(c.close_ts*1000).toISOString().slice(11,16); var showLabel=!!labelIdx[i]; return '<div class="'+(c.count===maxC?'max ':'')+(c.count?'':'zero')+'" title="'+label+': '+c.count+' signal(s)"><span>'+c.count+'</span><i style="--i:'+i+';height:'+Math.max(p,3)+'%"></i><small>'+(showLabel?short:'')+'</small></div>'; }).join('')+'</div>'+
  '<p class="ins-note">'+I18N.t('clusters')+'</p></div>'+
  '<div><h3>'+I18N.t('howToRead')+'</h3><dl class="guide">'+
  '<div><dt>'+I18N.t('thChg')+'</dt><dd>'+I18N.t('guideChg')+'</dd></div>'+
  '<div><dt>RVOL</dt><dd>'+I18N.t('guideRVOL')+'</dd></div>'+
  '<div><dt>'+I18N.t('thBreakout')+'</dt><dd>'+I18N.t('guideBreakout')+'</dd></div>'+
  '<div><dt>RSI 4h</dt><dd>'+I18N.t('guideRSI')+'</dd></div>'+
  '<div><dt>+30m</dt><dd>'+I18N.t('guide30')+'</dd></div></dl></div></div>';
}
var anchor=document.getElementById('performance'); if(anchor)anchor.parentNode.insertBefore(sec,anchor);
if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){sec.classList.add('in');io.disconnect()}})},{threshold:.25});io.observe(sec)}else sec.classList.add('in');
var tips={4:'Relative volume vs 60-bar median (rule: ≥ 1.3x)',3:'4H candle change, open to close',5:'Close above previous 20-bar high',6:'RSI on 4H. ≥ 80 is very stretched',7:'Return 30 min after signal close (tracker)'};
document.querySelectorAll('thead th').forEach(function(th,i){if(tips[i])th.title=tips[i]});
function m(td,v,max,col){if(td.dataset.fx||v===''||isNaN(v))return;td.dataset.fx=1;td.classList.add('fx-m');td.style.setProperty('--p',Math.max(3,Math.min(100,Math.abs(v)/max*100)));td.style.setProperty('--c',col)}
function deco(){document.querySelectorAll('#signal-rows tr').forEach(function(tr){var t=tr.children;if(t.length<8)return; m(t[3],parseFloat(t[3].dataset.sort),30,'#c6ff4d');m(t[4],parseFloat(t[4].dataset.sort),20,'#35f0ff'); var r=parseFloat(t[6].dataset.sort);m(t[6],r,100,r>=80?'#ffb02e':r>=70?'#c6ff4d':'#35f0ff'); var x=parseFloat(t[7].dataset.sort);m(t[7],x,10,x>=0?'#c6ff4d':'#ff5d73')})}
render(); deco(); var tb=document.getElementById('signal-rows'); if(tb)new MutationObserver(deco).observe(tb,{childList:true}); var tw=document.querySelector('.table-wrap'); if(tw && !document.querySelector('.fx-leg'))tw.insertAdjacentHTML('afterend','<div class="fx-leg"><span style="--c:#35f0ff">normal</span><span style="--c:#c6ff4d">strong</span><span style="--c:#ffb02e">RSI ≥ 80 stretched</span><span style="--c:#ff5d73">negative</span><em style="font-style:normal">· meter length is scaled per column, for quick scanning</em></div>');
window.addEventListener('raptor:lang',render);
})();
