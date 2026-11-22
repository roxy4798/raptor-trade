(()=>{'use strict';
  const doc=document.documentElement;
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionOff=()=>doc.classList.contains('motion-off')||reduce.matches;
  const $=(s,b=document)=>b.querySelector(s);
  const $$=(s,b=document)=>Array.from(b.querySelectorAll(s));

  function installParallax(el,map={x:'--rx',y:'--ry',xs:null,ys:null},intensity=18){
    if(!el) return;
    let raf=0,lastX=0,lastY=0;
    const apply=()=>{raf=0;el.style.setProperty(map.x,`${lastX}px`);el.style.setProperty(map.y,`${lastY}px`);if(map.xs) el.style.setProperty(map.xs,`${(parseFloat(lastX)*0.45).toFixed(2)}px`);if(map.ys) el.style.setProperty(map.ys,`${(parseFloat(lastY)*0.45).toFixed(2)}px`);};
    const move=e=>{
      if(motionOff()) return;
      const r=el.getBoundingClientRect();
      const px=((e.clientX-r.left)/r.width-.5)*2;
      const py=((e.clientY-r.top)/r.height-.5)*2;
      lastX=(px*intensity).toFixed(2);lastY=(py*intensity).toFixed(2);
      if(!raf) raf=requestAnimationFrame(apply);
    };
    const leave=()=>{lastX=0;lastY=0;if(!raf) raf=requestAnimationFrame(apply);};
    el.addEventListener('pointermove',move,{passive:true});
    el.addEventListener('pointerleave',leave,{passive:true});
  }

  function seedParticles(host,className,count,spread={x:[8,92],y:[10,90],size:[2,5],dur:[3.5,8],delay:[0,4]}){
    if(!host) return;
    host.querySelectorAll('.'+className).forEach(n=>n.remove());
    const frag=document.createDocumentFragment();
    for(let i=0;i<count;i++){
      const n=document.createElement('span');
      n.className=className;
      const rand=(a,b)=>a+Math.random()*(b-a);
      n.style.setProperty('--x',rand(...spread.x).toFixed(2)+'%');
      n.style.setProperty('--y',rand(...spread.y).toFixed(2)+'%');
      n.style.setProperty('--size',rand(...spread.size).toFixed(2)+'px');
      n.style.setProperty('--dur',rand(...spread.dur).toFixed(2)+'s');
      n.style.setProperty('--delay',(-rand(...spread.delay)).toFixed(2)+'s');
      frag.appendChild(n);
    }
    host.appendChild(frag);
  }

  function cycleRows(){
    const tbody=$('#signal-rows'); if(!tbody) return;
    let idx=0; let timer=0;
    const pulse=()=>{
      if(motionOff()) return;
      const rows=$$('tr',tbody).filter(r=>!r.classList.contains('empty-state'));
      if(!rows.length) return;
      rows.forEach(r=>r.classList.remove('rt13-cycle'));
      rows[idx%rows.length].classList.add('rt13-cycle');
      idx++;
    };
    pulse();
    timer=setInterval(pulse,2600);
    document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInterval(timer);}else{pulse();timer=setInterval(pulse,2600);}});
  }

  function accentCards(){
    $$('.card,.metric,.hrow,.tracker-box').forEach((el,i)=>el.style.setProperty('transition-delay',`${Math.min(i*12,180)}ms`));
  }

  function sync(){
    doc.classList.toggle('v13-enhanced',!motionOff());
    if(!motionOff()){
      seedParticles($('.radar-stage'),'radar-micro',14);
      seedParticles($('#obs-viewport'),'obs-spark',10,{x:[8,92],y:[8,78],size:[3,6],dur:[3.5,7],delay:[0,4.5]});
    }else{
      $$('.radar-micro,.obs-spark').forEach(n=>n.remove());
    }
  }

  document.addEventListener('DOMContentLoaded',()=>{
    installParallax($('.radar-stage'),{x:'--rx',y:'--ry',xs:'--rxs',ys:'--rys'},7);
    installParallax($('#obs-viewport'),{x:'--ox',y:'--oy'},5);
    accentCards();
    // Row auto-pulsing retired in v20: table content stays optically stable.
    sync();
    $('#motion-toggle')?.addEventListener('click',()=>requestAnimationFrame(sync));
    reduce.addEventListener?.('change',sync);

    const obs=$('#observatory');
    if(obs){
      obs.addEventListener('raptor:obs-select',e=>{
        const i=e?.detail?.index;
        const cols=$$('.obs-fallback-column',obs); cols.forEach((c,k)=>c.classList.toggle('is-active',k===i));
      });
    }

    const mo=new MutationObserver(()=>{
      const open=document.querySelector('.modal-backdrop.open');
      if(open && !motionOff()) doc.classList.add('rt13-modal-open');
      else doc.classList.remove('rt13-modal-open');
    });
    const modal=$('#modal-backdrop'); if(modal) mo.observe(modal,{attributes:true,attributeFilter:['class']});
  });
})();
