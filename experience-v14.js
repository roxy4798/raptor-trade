(()=>{'use strict';
  const doc=document.documentElement;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const motionOff=()=>doc.classList.contains('motion-off')||reduce.matches;
  const $=(s,b=document)=>b.querySelector(s);
  const $$=(s,b=document)=>Array.from(b.querySelectorAll(s));
  function waveList(sel,cls='rt14-live',dur=1800){
    let i=0,timer=0; const nodes=()=>$$(sel).filter(Boolean);
    const step=()=>{ if(motionOff()) return; const arr=nodes(); if(!arr.length) return; arr.forEach(n=>n.classList.remove(cls)); arr[i%arr.length].classList.add(cls); setTimeout(()=>arr[i%arr.length]?.classList.remove(cls),dur-250); i++; };
    step(); timer=setInterval(step,dur);
    document.addEventListener('visibilitychange',()=>{if(document.hidden) clearInterval(timer); else {step(); timer=setInterval(step,dur);}}, {once:true});
  }
  function liveAria(){ document.body.classList.toggle('rt14-live-ready',!motionOff()); }
  // v20: cyclic emphasis on text and rows is retired. The motion setting remains active.
  document.addEventListener('DOMContentLoaded',()=>{ liveAria(); $('#motion-toggle')?.addEventListener('click',()=>requestAnimationFrame(liveAria)); reduce.addEventListener?.('change',liveAria); });
})();
