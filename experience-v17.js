(()=>{'use strict';
const doc=document, root=doc.documentElement;
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const $=(s,b=doc)=>b.querySelector(s);
const $$=(s,b=doc)=>Array.from(b.querySelectorAll(s));
const isOff=()=>root.classList.contains('motion-off')||reduce.matches;

/* Recent signals ticker: keep it always moving, but react with speed/glow during touch/hover. */
function initTicker(){
  const tape=$('.market-tape'),track=$('#signal-tape'); if(!tape||!track)return;
  const alive=()=>{ if(isOff()) {tape.classList.remove('v17-speed','v17-glow'); return;} tape.classList.add('v17-glow'); setTimeout(()=>tape.classList.remove('v17-glow'),1200); };
  ['pointerenter','pointerdown','touchstart'].forEach(ev=>tape.addEventListener(ev,()=>{ if(isOff())return; tape.classList.add('v17-speed'); alive(); clearTimeout(tape._slow); tape._slow=setTimeout(()=>tape.classList.remove('v17-speed'),1800); },{passive:true}));
  tape.addEventListener('pointerleave',()=>{ clearTimeout(tape._slow); tape._slow=setTimeout(()=>tape.classList.remove('v17-speed'),260); },{passive:true});
  document.addEventListener('visibilitychange',()=>{ track.style.animationPlayState=document.hidden||isOff()?'paused':'running'; });
  const sync=()=>{ track.style.animationPlayState=isOff()?'paused':'running'; };
  $('#motion-toggle')?.addEventListener('click',()=>requestAnimationFrame(sync)); reduce.addEventListener?.('change',sync); sync();
}

/* Stronger tactile interaction: tilt, ripple, and alive state across cards, KPI, hero, and observatory surfaces. */
function initTactile(){
  const surfaces=$$('.kpi,.card,.market-tape,.table-wrap,.perf-col,.hero-copy,.hero-visual,.hero-bottom,.observatory,.tracker-box,.health-card,.lang-btn,.rail-link,.obs-mode,.filter-btn');
  surfaces.forEach(el=>{
    if(!el.classList.contains('v16-tactile')) el.classList.add('v16-tactile');
    let raf=0;
    const update=(cx,cy)=>{
      const r=el.getBoundingClientRect();
      const px=(cx-r.left)/Math.max(1,r.width), py=(cy-r.top)/Math.max(1,r.height);
      const rx=((.5-py)*4.5).toFixed(2)+'deg', ry=((px-.5)*5.5).toFixed(2)+'deg';
      el.style.setProperty('--v17-rx',rx); el.style.setProperty('--v17-ry',ry);
      el.style.setProperty('--v16-px',(px*100).toFixed(2)+'%'); el.style.setProperty('--v16-py',(py*100).toFixed(2)+'%');
      el.classList.add('v17-engaged'); el.classList.add('v16-touched');
    };
    const clear=()=>{el.classList.remove('v17-engaged','v16-touched'); el.style.removeProperty('--v17-rx'); el.style.removeProperty('--v17-ry');};
    el.addEventListener('pointermove',ev=>{ if(isOff())return; if(raf)cancelAnimationFrame(raf); raf=requestAnimationFrame(()=>update(ev.clientX,ev.clientY)); },{passive:true});
    el.addEventListener('pointerenter',ev=>{ if(isOff())return; update(ev.clientX,ev.clientY); },{passive:true});
    el.addEventListener('pointerleave',clear,{passive:true});
    el.addEventListener('pointerdown',ev=>{ if(isOff())return; update(ev.clientX,ev.clientY); const r=el.getBoundingClientRect(); const ripple=doc.createElement('span'); ripple.className='v17-ripple'; ripple.style.left=(ev.clientX-r.left)+'px'; ripple.style.top=(ev.clientY-r.top)+'px'; el.appendChild(ripple); ripple.addEventListener('animationend',()=>ripple.remove(),{once:true}); setTimeout(()=>ripple.remove(),900); },{passive:true});
  });
}

/* Ambient pointer orb to make the interface feel more alive on desktop. */
function initPointerOrb(){
  if(matchMedia('(pointer:fine)').matches===false) return;
  const orb=doc.createElement('div'); orb.className='v17-pointer-orb'; doc.body.appendChild(orb);
  let raf=0,x=window.innerWidth/2,y=window.innerHeight/2,tx=x,ty=y;
  const render=()=>{raf=0; x+=(tx-x)*.22; y+=(ty-y)*.22; orb.style.transform=`translate(${x-15}px,${y-15}px)`; if(Math.abs(tx-x)+Math.abs(ty-y)>.25) raf=requestAnimationFrame(render); };
  doc.addEventListener('pointermove',ev=>{ if(isOff())return; tx=ev.clientX; ty=ev.clientY; doc.body.classList.add('v17-pointer-live'); if(!raf) raf=requestAnimationFrame(render); },{passive:true});
  doc.addEventListener('pointerleave',()=>doc.body.classList.remove('v17-pointer-live'));
  const sync=()=>doc.body.classList.toggle('v17-pointer-live',false);
  $('#motion-toggle')?.addEventListener('click',()=>requestAnimationFrame(sync));
}

/* Make radar and observatory visibly react to interaction. */
function initRadarAlive(){
  $$('.radar-stage,#obs-viewport').forEach(host=>{
    const on=()=>{ if(!isOff()) host.classList.add('v17-hot'); };
    const off=()=>host.classList.remove('v17-hot');
    ['pointerenter','pointerdown','touchstart'].forEach(ev=>host.addEventListener(ev,on,{passive:true}));
    ['pointerleave','touchend','touchcancel'].forEach(ev=>host.addEventListener(ev,off,{passive:true}));
  });
}

/* Rotate emphasis across key data highlights so the page never feels dead. */
function initLiveCycle(){
  const groups=['.kpi','.ins-hl .hl','.hrow','.obs-legend-item','.bar-row'];
  let timers=[];
  const clear=()=>{timers.forEach(clearInterval); timers=[]; $$('.v16-live').forEach(n=>n.classList.remove('v16-live'));};
  const start=()=>{
    clear(); if(isOff()) return;
    groups.forEach((sel,gi)=>{ const nodes=$$(sel).filter(Boolean); if(!nodes.length) return; let i=0; const tick=()=>{nodes.forEach(n=>n.classList.remove('v16-live')); nodes[i%nodes.length]?.classList.add('v16-live'); setTimeout(()=>nodes[i%nodes.length]?.classList.remove('v16-live'),1800); i++;}; tick(); timers.push(setInterval(tick,2100+gi*260)); });
  };
  start(); reduce.addEventListener?.('change',start); $('#motion-toggle')?.addEventListener('click',()=>setTimeout(start,30)); document.addEventListener('visibilitychange',()=>{ if(document.hidden) clear(); else start();});
}

/* Curve panel gets extra responsiveness during touch/hover. */
function initCurveAlive(){
  const panel=$('.v16-curve-panel'), svg=$('.v16-equity'); if(!panel||!svg) return;
  const pulse=()=>{ if(isOff())return; panel.classList.add('v17-hot'); clearTimeout(panel._t); panel._t=setTimeout(()=>panel.classList.remove('v17-hot'),900); };
  ['pointermove','pointerdown','touchstart','focus'].forEach(ev=>svg.addEventListener(ev,pulse,{passive:true}));
}

function init(){ initTicker(); initTactile(); initPointerOrb(); initRadarAlive(); initLiveCycle(); initCurveAlive(); root.classList.add('v17-ready'); }
if(doc.readyState==='loading') doc.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
