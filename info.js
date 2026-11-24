/* Raptor info layer — computed from window.RAPTOR_DATA, language-aware. */
(function(){'use strict';
var D=window.RAPTOR_DATA, I18N=window.RaptorLang||{t:function(k){return k;}, useWIB:function(){return false;}, onChange:function(){}}; if(!D)return;
var K=D.kpis,S=D.series,G=D.signals||[];
function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e}
function f(n,d){return Number(n).toFixed(d)}
function top(k){return G.reduce(function(a,b){return (b[k]!=null&&(a==null||b[k]>a[k]))?b:a},null)}
function closeText(v){ return I18N.useWIB() ? (v.close_wib+' WIB') : (v.close_utc+' UTC'); }
var ev=G.filter(function(s){return s.tf&&s.tf.h4&&s.tf.h4.status==='evaluated'&&s.tf.h4.return_pct!=null});
var bestR=ev.reduce(function(a,b){return !a||b.tf.h4.return_pct>a.tf.h4.return_pct?b:a},null);
var TFS=(D.tf_summary&&D.tf_summary.horizons)||{}; var H4=TFS.h4||{};
var mv=top('chg_4h'),rv=top('rvol'),lat=G[0];
/* v43 (25 Nov 2026, Raka: no +30m anywhere): the outcome mix is +4H-based —
   evaluated +4H returns above/below zero + signals whose +4H is still
   pending. The tracker classes (K.classes) are no longer displayed. */
var nPos=0,nNeg=0; G.forEach(function(s){ var h=(s.tf||{}).h4||{}; if(h.status==='evaluated'&&h.return_pct!==null&&h.return_pct!==undefined){ if(h.return_pct>0)nPos++; else nNeg++; } });
var tot=K.total||G.length, nPend=Math.max(0,tot-nPos-nNeg);
var maxC=Math.max.apply(null,S.signals_per_close.map(function(c){return c.count})); var busy=S.signals_per_close.filter(function(c){return c.count===maxC})[0];
/* v37b: time labels must never sit on adjacent columns — with the
   columns now sharing the cell (min-width:0), adjacent "HH:MM" labels
   overlap (the max bar at i=16 sat next to the every-3rd label at 15,
   and the last bar at 19 next to the one at 18). Keep last + max
   first, then every 3rd unless adjacent to a kept label.
   r5 (24 Nov 2026): distance-2 is NOT enough — a "HH:MM" label is
   ~31px but at 320px two columns are only ~24px, so the max label
   at 16 overlapped the 3rd-label at 18 by 5px once closes reached
   22. Minimum gap is now 3 columns, and the sweep step grows with
   the close count (one close every 4h) so the label count stays
   bounded as closes accrue. */
var lastIdx=S.signals_per_close.length-1, maxIdx=S.signals_per_close.indexOf(busy);
var step=Math.max(3,Math.ceil(S.signals_per_close.length/7));
var labelIdx={}; labelIdx[lastIdx]=1;
if(maxIdx!==lastIdx&&Math.abs(maxIdx-lastIdx)>=step)labelIdx[maxIdx]=1;
for(var li=0;li<=lastIdx;li+=step){ if(labelIdx[li])continue; var adj=false; for(var k in labelIdx){ if(Math.abs(+k-li)<step){adj=true;break} } if(!adj)labelIdx[li]=1; }
/* v37c: the 294 flood bar is a 24x outlier — scaling to it crushes the
   other 19 closes into 3–14px crumbs and leaves the chart 90% empty
   ("tidak rapih dan tidak enak dilihat"). Scale to capC, the highest
   count BELOW the max (12 now), and render the max bar broken off at
   88% with a break mark (see density-v36.css) + its true "294" label,
   so the distribution of normal closes is actually visible. When
   there is no outlier (all counts equal) capC == maxC and no bar is
   broken. */
var capC=0; S.signals_per_close.forEach(function(c){ if(c.count<maxC&&c.count>capC)capC=c.count; }); if(!capC)capC=maxC;
var sec=el('section','card insight'); sec.id='insight';
function render(){
  sec.innerHTML='<div class="ins-head"><div><div class="section-kicker">'+I18N.t('insightKicker')+'</div><h2>'+I18N.t('insightTitle')+' <span class="h2-note">'+I18N.t('insightNote')+'</span></h2></div></div>'+
  '<p class="ins-sum">'+I18N.t('insightSummary',{tot:tot,last24:K.last24,n4h:H4.n||0,mean4h:(H4.mean==null?'N/A':(H4.mean>=0?'+':'')+f(H4.mean,2)),median4h:(H4.median==null?'N/A':f(H4.median,2)),npos:nPos})+'</p>'+
  '<div class="ins-hl">'+
  (mv?'<div class="hl"><small>'+I18N.t('biggestMove')+'</small><strong class="up">▲ +'+f(mv.chg_4h,2)+'%</strong><span>'+mv.symbol+' · '+closeText(mv)+'</span></div>':'')+
  (rv?'<div class="hl"><small>'+I18N.t('highestRVOL')+'</small><strong>'+f(rv.rvol,2)+'x</strong><span>'+rv.symbol+' · volume vs 60-bar median</span></div>':'')+
  (bestR?'<div class="hl"><small>'+I18N.t('bestTf4h')+'</small><strong class="up">▲ +'+f(bestR.tf.h4.return_pct,2)+'%</strong><span>'+bestR.symbol+' · gross</span></div>':'')+
  (busy?'<div class="hl"><small>'+I18N.t('busiestClose')+'</small><strong>'+maxC+' signals</strong><span>'+(I18N.useWIB()?busy.close_wib+' WIB': new Date(busy.close_ts*1000).toISOString().slice(8,10)+' '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][new Date(busy.close_ts*1000).getUTCMonth()]+' '+String(new Date(busy.close_ts*1000).getUTCHours()).padStart(2,'0')+':00 UTC')+'</span></div>':'')+
  (lat?'<div class="hl"><small>'+I18N.t('latestSignal')+'</small><strong>'+lat.symbol.replace('USDT','')+'</strong><span>'+closeText(lat)+' · RSI 4h '+f(lat.rsi_4h,1)+'</span></div>':'')+
  '</div><div class="ins-grid">'+
  '<div><h3>'+I18N.t('outcomeMix')+'</h3><div class="mix" role="img" aria-label="Outcome mix">'+
  /* v43: three +4H segments (positive / negative / pending) replace the
     four tracker-classification segments. Segments use flex-grow so the
     2px gaps never clip the smallest segment. */
  [[nPos,'#c6ff4d'],[nNeg,'#ff5d73'],[nPend,'#ffb02e']].map(function(a,i){return '<i style="--i:'+i+';flex:'+a[0]+' 1 0%;background:'+a[1]+'"></i>'}).join('')+'</div>'+
  '<ul class="mix-leg"><li><em style="background:#c6ff4d"></em>'+I18N.t('mixPos')+'<b>'+nPos+' · '+f(nPos/tot*100,0)+'%</b></li><li><em style="background:#ff5d73"></em>'+I18N.t('mixNeg')+'<b>'+nNeg+' · '+f(nNeg/tot*100,0)+'%</b></li><li><em style="background:#ffb02e"></em>'+I18N.t('mixPend')+'<b>'+nPend+' · '+f(nPend/tot*100,0)+'%</b></li></ul>'+
  '<p class="ins-note">'+I18N.t('mixPendNote')+'</p></div>'+
  '<div><h3>'+I18N.t('signalsPerClose')+'</h3><div class="cl">'+
  /* v37: the 294 flood bar overflowed the 130px chart and its label bled
     into the guide column ("tumpang tindih"). Bar heights now use a
     square-root scale capped at 68% so count + time labels fit inside
     the column (bar + labels must fit the column height — the overflow
     mechanism); time labels render only for labelIdx (v37b: every 3rd
     close + max + last, de-adjacent — never two neighbouring columns,
     or the "HH:MM" labels overlap once the columns share the cell).
     v37c: the sqrt scale is taken against capC (the highest count
     below the max), not maxC — otherwise the 294 outlier crushes the
     other closes into crumbs. The max bar is drawn broken at 88% with
     a break mark and its true count label (full label stays in the
     title attr). */
  S.signals_per_close.map(function(c,i){ var isOut=c.count===maxC&&maxC>capC; var p=isOut?88:(capC?Math.sqrt(c.count)/Math.sqrt(capC)*68:0); var label=I18N.useWIB()? c.close_wib+' WIB' : new Date(c.close_ts*1000).toISOString().slice(11,16)+' UTC'; var short=I18N.useWIB()?c.close_wib.slice(-5):new Date(c.close_ts*1000).toISOString().slice(11,16); var showLabel=!!labelIdx[i]; return '<div class="'+(c.count===maxC?'max ':'')+(isOut?'broken ':'')+(c.count?'':'zero')+'" title="'+label+': '+c.count+' signal(s)"><span>'+c.count+'</span><i style="--i:'+i+';height:'+Math.max(p,3)+'%"></i><small>'+(showLabel?short:'')+'</small></div>'; }).join('')+'</div>'+
  '<p class="ins-note">'+I18N.t('clusters')+'</p></div>'+
  '<div><h3>'+I18N.t('howToRead')+'</h3><dl class="guide">'+
  '<div><dt>'+I18N.t('thChg')+'</dt><dd>'+I18N.t('guideChg')+'</dd></div>'+
  '<div><dt>RVOL</dt><dd>'+I18N.t('guideRVOL')+'</dd></div>'+
  '<div><dt>'+I18N.t('thBreakout')+'</dt><dd>'+I18N.t('guideBreakout')+'</dd></div>'+
  '<div><dt>RSI 4h</dt><dd>'+I18N.t('guideRSI')+'</dd></div>'+
  '<div><dt>TF</dt><dd>'+I18N.t('guideTf')+'</dd></div></dl></div></div>';
}
var anchor=document.getElementById('performance'); if(anchor)anchor.parentNode.insertBefore(sec,anchor);
if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){sec.classList.add('in');io.disconnect()}})},{threshold:.25});io.observe(sec)}else sec.classList.add('in');
/* v41: the +30m column is gone — index 7 is now the +4H TF column.
   All six TF columns (7–12) share the TF tooltip; deco()'s t[7] meter
   now colours the +4H cell (same scale, same colours). */
var tips={4:'Relative volume vs 60-bar median (rule: ≥ 1.3x)',3:'4H candle change, open to close',5:'Close above previous 20-bar high',6:'RSI on 4H. ≥ 80 is very stretched',7:'Return 4 hours after the signal (research horizon)',8:'Return 12 hours after the signal',9:'Return 1 day after the signal',10:'Return 2 days after the signal',11:'Return 3 days after the signal',12:'Return 1 week after the signal'};
/* v41b: scope to the signals table — the TF summary table added a
   second thead (7 th's) BEFORE it, so the unscoped selector shifted
   every tooltip by 7 (SYMBOL showed the +4H tip). Caught by the live
   browser check 01:47–01:50 WIB 25 Nov. */
document.querySelectorAll('#signals thead th').forEach(function(th,i){if(tips[i])th.title=tips[i]});
function m(td,v,max,col){if(td.dataset.fx||v===''||isNaN(v))return;td.dataset.fx=1;td.classList.add('fx-m');td.style.setProperty('--p',Math.max(3,Math.min(100,Math.abs(v)/max*100)));td.style.setProperty('--c',col)}
function deco(){document.querySelectorAll('#signal-rows tr').forEach(function(tr){var t=tr.children;if(t.length<8)return; m(t[3],parseFloat(t[3].dataset.sort),30,'#c6ff4d');m(t[4],parseFloat(t[4].dataset.sort),20,'#35f0ff'); var r=parseFloat(t[6].dataset.sort);m(t[6],r,100,r>=80?'#ffb02e':r>=70?'#c6ff4d':'#35f0ff'); var x=parseFloat(t[7].dataset.sort);m(t[7],x,10,x>=0?'#c6ff4d':'#ff5d73')})}
render(); deco(); var tb=document.getElementById('signal-rows'); if(tb)new MutationObserver(deco).observe(tb,{childList:true}); var tw=document.querySelector('.table-wrap'); if(tw && !document.querySelector('.fx-leg'))tw.insertAdjacentHTML('afterend','<div class="fx-leg"><span style="--c:#35f0ff">normal</span><span style="--c:#c6ff4d">strong</span><span style="--c:#ffb02e">RSI ≥ 80 stretched</span><span style="--c:#ff5d73">negative</span><em style="font-style:normal">· meter length is scaled per column, for quick scanning</em></div>');
window.addEventListener('raptor:lang',render);
})();
