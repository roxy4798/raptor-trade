/** Raptor Trade v16 — kinetic interaction without synthetic market data.
 * Inspired by GSAP quickTo / Observer and MDN rAF and transform/opacity principles.
 * The existing exported curve vertices, counts, performance and PNG charts remain untouched.
 */
(()=>{'use strict';
const doc=document, root=doc.documentElement;
const $=(q,parent=doc)=>parent.querySelector(q), $$=(q,parent=doc)=>[...parent.querySelectorAll(q)];
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const isOff=()=>reduced.matches||root.classList.contains('motion-off')||doc.hidden;
const isID=()=>window.RaptorLang?.get?.()==='id';
const data=window.RAPTOR_DATA||{};
const L=(en,id)=>isID()?id:en;
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));

// A chart scrubber follows the exact original SVG line; the tooltip always reports a REAL exported sample.
function setupCurve(){
 const svg=$('svg.equity'), history=data.series?.cum_net_curve||[];
 if(!svg||history.length<2)return;
 const source=$('polyline[points]:not(.v15-trace)',svg);
 if(!source)return;
 const pts=source.getAttribute('points').trim().split(/\s+/).map(p=>p.split(',').map(Number));
 if(pts.length!==history.length||pts.some(p=>p.length!==2||!p.every(Number.isFinite)))return;
 const parent=svg.closest('.perf-col');if(!parent)return;
 parent.classList.add('v16-curve-panel');
 svg.classList.add('v16-equity');svg.setAttribute('tabindex','0');
 svg.setAttribute('aria-label',L('Interactive historical cumulative net curve. Use pointer or arrow keys to inspect recorded samples.','Kurva net kumulatif historis interaktif. Gunakan sentuhan atau tombol panah untuk memeriksa sampel.'));
 let selected=0, active=false, stickyTouch=false, target={x:pts[0][0],y:pts[0][1]}, current={...target}, raf=0, lastPaint=0;
 const ns='http://www.w3.org/2000/svg';
 function element(tag,attrs){const e=doc.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));return e;}
 const g=element('g',{'class':'v16-scrub-graphics','aria-hidden':'true'});
 const vertical=element('line',{'class':'v16-scrub-line',x1:pts[0][0],x2:pts[0][0],y1:20,y2:161});
 const horizontal=element('line',{'class':'v16-scrub-horizontal',x1:52,x2:548,y1:pts[0][1],y2:pts[0][1]});
 const halo=element('circle',{'class':'v16-scrub-halo',r:17,cx:pts[0][0],cy:pts[0][1]});
 const outer=element('circle',{'class':'v16-scrub-outer',r:7,cx:pts[0][0],cy:pts[0][1]});
 const inner=element('circle',{'class':'v16-scrub-core',r:3,cx:pts[0][0],cy:pts[0][1]});
 g.append(vertical,horizontal,halo,outer,inner);svg.append(g);
 const hint=doc.createElement('span');hint.className='v16-hint';
 const heading=$('.sub-h',parent); heading?.append(hint);
 const tip=doc.createElement('div');tip.className='v16-curve-tooltip';tip.id='v16-curve-tooltip';tip.setAttribute('role','status');tip.setAttribute('aria-live','polite');parent.append(tip);
 const readout=doc.createElement('div');readout.className='v16-curve-readout';parent.append(readout);
 const formatNum=n=>(n>=0?'+':'')+Number(n).toFixed(2)+'%';
 const formatLabel=(item,i)=>i===0?L('START','AWAL'):(item.symbol||'—');
 const fmtTime=ts=>{
   if(!ts)return '';
   const date=new Date(ts*1000);
   const opts={day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',timeZone:isID()?'Asia/Jakarta':'UTC',hour12:false};
   return new Intl.DateTimeFormat(isID()?'id-ID':'en-GB',opts).format(date)+' '+(isID()?'WIB':'UTC');
 };
 function translate(){
   if(heading && hint.parentElement!==heading)heading.append(hint);
   hint.textContent=L('HOVER / DRAG / TAP TO INSPECT','ARAHKAN / GESER / SENTUH');
   svg.setAttribute('aria-label',L('Interactive historical cumulative net curve. Use pointer or arrow keys to inspect recorded samples.','Kurva net kumulatif historis interaktif. Gunakan sentuhan atau tombol panah untuk memeriksa sampel.'));
   drawLabel();
 }
 function drawLabel(){
   const item=history[selected],value=formatNum(item.cum_net_pct);
   tip.innerHTML=`<span class="v16-tip-overline">${L('HISTORICAL SAMPLE','SAMPEL HISTORIS')} ${String(selected+1).padStart(2,'0')} / ${history.length}</span><strong>${formatLabel(item,selected)}</strong><span class="v16-tip-value ${Number(item.cum_net_pct)<0?'negative':''}">${value}</span><small>${selected===0?L('Cumulative net baseline','Titik awal net kumulatif'):fmtTime(item.close_ts)}</small>`;
   readout.innerHTML=`<span>${L('SELECTED SAMPLE','SAMPEL DIPILIH')} <b>${formatLabel(item,selected)}</b></span><strong>${value}</strong>`;
 }
 function setSelected(n){ selected=clamp(n,0,pts.length-1);const p=pts[selected];target.x=p[0];target.y=p[1];drawLabel();root.classList.toggle('v16-curve-focus',active); if(!isOff())requestFrame();else drawFrame(true); }
 function drawFrame(force){
   if(!force){current.x+=(target.x-current.x)*.34;current.y+=(target.y-current.y)*.34;}else{current={...target};}
   const x=current.x,y=current.y;
   vertical.setAttribute('x1',x);vertical.setAttribute('x2',x);
   horizontal.setAttribute('y1',y);horizontal.setAttribute('y2',y);
   for(const c of [halo,outer,inner]){c.setAttribute('cx',x);c.setAttribute('cy',y)}
   // Tooltip in a fixed region of the card, rather than following the pointer over chart labels.
   const r=svg.getBoundingClientRect();
   const width=parent.getBoundingClientRect().width;
   const offsetLeft=r.left-parent.getBoundingClientRect().left;
   const xPx=offsetLeft+(x/560)*r.width;
   const opposite=xPx>width*.52?Math.min(112,width*.31):Math.max(width-112,width*.69);
   tip.style.setProperty('--tip-x',clamp(opposite,95,Math.max(95,width-95))+'px');
 }
 function frame(now){raf=0;if(isOff()){drawFrame(true);return;}drawFrame(false);
   if(Math.abs(current.x-target.x)+Math.abs(current.y-target.y)>.08)requestFrame(); }
 function requestFrame(){if(!raf)raf=requestAnimationFrame(frame);}
 function localX(clientX){
   const ctm=svg.getScreenCTM();if(!ctm)return pts[selected][0];
   const p=svg.createSVGPoint();p.x=clientX;p.y=0;
   return clamp(p.matrixTransform(ctm.inverse()).x,pts[0][0],pts[pts.length-1][0]);
 }
 function nearestX(x){let best=0,dist=Infinity;
   pts.forEach((v,i)=>{const d=Math.abs(x-v[0]);if(d<dist){best=i;dist=d;}});return best;
 }
 function locationOnOriginalCurve(x){
   for(let i=0;i<pts.length-1;i++){
     if(x<=pts[i+1][0]){const a=pts[i],b=pts[i+1],fraction=clamp((x-a[0])/(b[0]-a[0]),0,1);
       return {x:x,y:a[1]+(b[1]-a[1])*fraction};}
   }
   return {x:pts[pts.length-1][0],y:pts[pts.length-1][1]};
 }
 function inspect(ev){
   active=true;if(ev.pointerType==='touch')stickyTouch=true;
   parent.classList.add('v16-chart-active');
   const x=localX(ev.clientX),n=nearestX(x);
   if(selected!==n){selected=n;drawLabel();}
   target=locationOnOriginalCurve(x); // visual marker only: tooltip reports nearest EXPORTED data point
   drawFrame(true); // touch / pointer aligns with the actual curve immediately
 }
 svg.addEventListener('pointerenter',inspect,{passive:true});svg.addEventListener('pointermove',inspect,{passive:true});
 svg.addEventListener('pointerdown',ev=>{inspect(ev);if(ev.pointerType!=='mouse')ev.preventDefault();},{passive:false});
 svg.addEventListener('pointerleave',ev=>{if(stickyTouch)return;active=false;parent.classList.remove('v16-chart-active');});
 svg.addEventListener('pointercancel',ev=>{if(stickyTouch)return;active=false;parent.classList.remove('v16-chart-active');});
 doc.addEventListener('pointerdown',ev=>{if(stickyTouch && !svg.contains(ev.target)){stickyTouch=false;active=false;parent.classList.remove('v16-chart-active');}},{passive:true});
 svg.addEventListener('keydown',ev=>{if(['ArrowRight','ArrowLeft','Home','End'].includes(ev.key)){ev.preventDefault();active=true;parent.classList.add('v16-chart-active');setSelected(ev.key==='Home'?0:ev.key==='End'?pts.length-1:selected+(ev.key==='ArrowRight'?1:-1));}});
 svg.addEventListener('focus',()=>{active=true;parent.classList.add('v16-chart-active');drawLabel();});
 svg.addEventListener('blur',()=>{active=false;parent.classList.remove('v16-chart-active');});
 window.addEventListener('raptor:lang',translate);reduced.addEventListener?.('change',()=>drawFrame(true));
 $('#motion-toggle')?.addEventListener('click',()=>requestAnimationFrame(()=>drawFrame(true)));
 translate();setSelected(0);drawFrame(true);
 window.RaptorCurveV16={get selected(){return selected},get points(){return pts.map(a=>a.slice())},select:setSelected};
}

// Performance bar focus: tactile physical feedback, source value is always from existing text.
function setupBars(){
 const barbox=$('.bars');if(!barbox)return;
 const rows=$$('.bar-row',barbox);let chosen=-1;
 const label=doc.createElement('div');label.className='v16-bar-explainer';barbox.after(label);
 const update=i=>{chosen=i;rows.forEach((r,n)=>{r.classList.toggle('v16-bar-selected',n===i);r.setAttribute('aria-pressed',String(i===n));});
  const row=rows[i];if(!row){label.textContent=L('TOUCH OR HOVER A RETURN TO INSPECT','SENTUH ATAU ARAHKAN KE RETURN');return;}
  label.innerHTML=`<span>${$('.bar-sym',row)?.textContent||'—'}</span><strong>${$('.bar-val',row)?.textContent||'—'}</strong><small>${L('Recorded +30m change · historical','Perubahan +30m · historis')}</small>`;
 };
 rows.forEach((row,i)=>{
   row.setAttribute('tabindex','0');row.setAttribute('role','button');row.setAttribute('aria-label',`${$('.bar-sym',row)?.textContent} ${$('.bar-val',row)?.textContent} historical result`);
   row.addEventListener('pointerenter',()=>{if(!isOff())update(i);});
   row.addEventListener('pointermove',ev=>{const r=row.getBoundingClientRect();row.style.setProperty('--v16-x',((ev.clientX-r.left)/r.width*100).toFixed(1)+'%');},{passive:true});
   row.addEventListener('click',()=>update(i));
   row.addEventListener('focus',()=>update(i));
   row.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();update(i);}});
 });
 window.addEventListener('raptor:lang',()=>update(chosen));update(-1);
}

// Snapshot histogram: link the summary bars to the actual 4H Signal Observatory (no new values).
function setupHistogram(){
 const sec=$('#insight');if(!sec)return;
 const host=$('.cl',sec);if(!host)return;
 const series=data.series?.signals_per_close||[];
 const tip=doc.createElement('div');tip.className='v16-histo-readout';host.after(tip);
 let current=-1;
 function choose(i,persist){
   if(!series[i])return;current=i;
   $$('.cl>div',sec).forEach((el,j)=>{el.classList.toggle('v16-histo-active',j===i);el.setAttribute('aria-pressed',String(j===i))});
   const d=series[i],time=isID()?d.close_wib+' WIB':new Date(d.close_ts*1000).toLocaleString('en-GB',{timeZone:'UTC',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:false})+' UTC';
   tip.innerHTML=`<span>${L('4H HISTORICAL CLOSE','PENUTUPAN HISTORIS 4J')}</span><strong>${time} <b>${d.count} ${L('signals','sinyal')}</b></strong>`;
   if(persist)window.RaptorObservatory?.select?.(i);
 }
 function bind(){
   const newHost=$('.cl',sec);if(newHost&&tip.previousElementSibling!==newHost)newHost.after(tip);
   const bars=$$('.cl>div',sec);
   bars.forEach((el,i)=>{el.setAttribute('role','button');el.setAttribute('tabindex','0');el.setAttribute('aria-label',`${L('Historical close','Penutupan historis')} ${i+1}, ${series[i]?.count||0} ${L('signals','sinyal')}`);
    el.addEventListener('pointerenter',()=>choose(i,false));
    el.addEventListener('click',()=>choose(i,true));
    el.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();choose(i,true);}});
   });
   choose(current>=0?current:0,false);
 }
 bind();
 // Info.js redraws the summary on language switch; rebind after it finishes.
 window.addEventListener('raptor:lang',()=>setTimeout(bind,0));
}

// Pointer magnetism is visual-only and applied to independent elements, never table text or numeric data.
function setupTactile(){
 const targets=$$('.kpi,.ins-hl .hl,.perf-col,.obs-mode,.rail-link,.lang-btn');
 targets.forEach(el=>{
   el.classList.add('v16-tactile');
   let pending=0;
   el.addEventListener('pointermove',ev=>{
     if(isOff()||ev.pointerType==='touch')return;
     const r=el.getBoundingClientRect(),x=(ev.clientX-r.left)/r.width,y=(ev.clientY-r.top)/r.height;
     if(pending)return;
     pending=requestAnimationFrame(()=>{pending=0;el.style.setProperty('--v16-px',`${(x*100).toFixed(1)}%`);el.style.setProperty('--v16-py',`${(y*100).toFixed(1)}%`);el.style.setProperty('--v16-ax',`${((x-.5)*3).toFixed(2)}deg`);el.style.setProperty('--v16-ay',`${((.5-y)*2).toFixed(2)}deg`);});
   },{passive:true});
   el.addEventListener('pointerenter',()=>{if(!isOff())el.classList.add('v16-touched')});
   el.addEventListener('pointerleave',()=>{el.classList.remove('v16-touched');el.style.removeProperty('--v16-ax');el.style.removeProperty('--v16-ay');});
   el.addEventListener('pointerdown',()=>{if(!isOff()){el.classList.add('v16-tap');setTimeout(()=>el.classList.remove('v16-tap'),360)}},{passive:true});
 });
}

// Energy responds to actual pointer and touch, without inventing any signal events.
function setupRadarTouch(){
  $$('.radar-stage,#obs-viewport').forEach(host=>{
    const glow=doc.createElement('span');glow.className='v16-gesture-glow';glow.setAttribute('aria-hidden','true');host.append(glow);
    let frame=0,x=50,y=50;
    const move=ev=>{
      if(isOff())return;const r=host.getBoundingClientRect();
      x=clamp((ev.clientX-r.left)/Math.max(1,r.width)*100,0,100);y=clamp((ev.clientY-r.top)/Math.max(1,r.height)*100,0,100);
      host.classList.add('v16-gesture-active');
      if(frame)return;
      frame=requestAnimationFrame(()=>{frame=0;host.style.setProperty('--v16-gesture-x',x.toFixed(2)+'%');host.style.setProperty('--v16-gesture-y',y.toFixed(2)+'%');});
    };
    host.addEventListener('pointermove',move,{passive:true});
    host.addEventListener('pointerleave',ev=>{if(ev.pointerType!=='touch')host.classList.remove('v16-gesture-active')},{passive:true});
    host.addEventListener('pointerdown',ev=>{
      if(isOff())return;move(ev);
      const dot=doc.createElement('span');dot.className='v16-impact';dot.setAttribute('aria-hidden','true');
      dot.style.left=x.toFixed(2)+'%';dot.style.top=y.toFixed(2)+'%';host.append(dot);
      dot.addEventListener('animationend',()=>dot.remove(),{once:true});
      setTimeout(()=>dot.remove(),850);
    },{passive:true});
  });
}

// Existing SVG curves, grid and status labels are never replaced. Keep accessibility switches coherent.
function init(){setupCurve();setupBars();setupHistogram();setupTactile();setupRadarTouch();root.classList.add('v16-ready');}
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
