/** RAPTOR TRADE V15 — coordinated ambient motion director.
 * All financial numbers, graph coordinates and chart images are immutable.
 * Exactly one timeline-driven table audit scanner; all other motion is compositor CSS.
 * Motion OFF and OS reduced motion suppress decorative movement.
 */
(()=>{'use strict';
 const root=document.documentElement,doc=document;
 const qs=(s,el=doc)=>el.querySelector(s), all=(s,el=doc)=>Array.from(el.querySelectorAll(s));
 const reduce=window.matchMedia('(prefers-reduced-motion:reduce)');
 const isStill=()=>reduce.matches||root.classList.contains('motion-off')||doc.hidden;
 const motionBtn=qs('#motion-toggle');
 root.classList.add('v15-installed');
 // Single aria-hidden backdrop, no duplicate canvas or new WebGL context.
 const ambient=doc.createElement('div');ambient.className='v15-ambient';ambient.setAttribute('aria-hidden','true');doc.body.prepend(ambient);
 // Stabilize content that was incorrectly translated rather than changing data layout.
 const stage=qs('.radar-stage');
 if(stage){
   const rings=['','alt'];rings.forEach(s=>{const r=doc.createElement('span');r.className='radar-hud-line '+s;r.setAttribute('aria-hidden','true');stage.insertBefore(r,stage.firstChild);});
   // Deterministic small visual dots: NOT real market events.
   for(let i=0;i<20;i++){
     let x=13+((i*41)%74),y=12+((i*59)%73),sz=i%6===0?3:2;
     const p=doc.createElement('span');p.className='v15-dot'+(i%4===0?' lime':'');
     p.style.cssText=`--x:${x}%;--y:${y}%;--sz:${sz}px;--duration:${4+(i%5)*.9}s;--delay:${-(i%7)*.65}s`;
     p.setAttribute('aria-hidden','true');stage.append(p);
   }
 }
 // Panel overlay is an independent animated layer and never transforms actual content.
 const panels=all('.mission-hero,.observatory,.card,.kpi,.perf-col,.insight,.obs-side,.tracker-box,.chart-viewer,.metric');
 panels.forEach((el,i)=>{
   if(el.classList.contains('v15-panel'))return;
   el.classList.add('v15-panel');el.style.setProperty('--v15-phase',`${-((i%8)*1.05).toFixed(2)}s`);
   if(!el.matches('.metric')){
     const surface=doc.createElement('span');surface.className='v15-surface';surface.setAttribute('aria-hidden','true');el.prepend(surface);
     if(el.matches('.kpi,.card,.observatory')){const corner=doc.createElement('span');corner.className='v15-corner';corner.setAttribute('aria-hidden','true');el.append(corner);}
   }
 });
 // Scroll scene: pause decorative surface animation outside viewport.
 let visiblePanelCount=0;
 const visible=new IntersectionObserver(entries=>{
   for(const e of entries){e.target.classList.toggle('v15-in-view',e.isIntersecting);}
   visiblePanelCount=all('.v15-panel.v15-in-view').length;
 },{rootMargin:'25px 0px',threshold:0});
 panels.forEach(el=>visible.observe(el));

 // Historical curve: copy exactly the original polyline vertices to a separate luminous trace.
 const equity=qs('svg.equity');
 if(equity){
   const original=equity.querySelector('polyline[points]');
   if(original && !equity.querySelector('.v15-trace')){
     const shine=original.cloneNode(true);
     shine.removeAttribute('id');shine.classList.add('v15-trace');shine.setAttribute('aria-hidden','true');
     equity.insertBefore(shine,original.nextSibling);
   }
   const circles=all('circle',equity);
   circles.forEach((orig,i)=>{
     const ring=doc.createElementNS('http://www.w3.org/2000/svg','circle');
     ring.setAttribute('cx',orig.getAttribute('cx'));ring.setAttribute('cy',orig.getAttribute('cy'));
     ring.setAttribute('r','7.2');ring.setAttribute('class','v15-marker-ring');ring.style.animationDelay=`${-i*.85}s`;
     ring.setAttribute('aria-hidden','true');orig.parentNode.insertBefore(ring,orig);
   });
 }
 // Deterministic audit scan of existing history. Does not highlight anything as a new alert.
 let auditIndex=0;
 const audit=()=>{
   const tbody=qs('#signal-rows');
   if(isStill()||!tbody||!qs('#signals')?.classList.contains('v15-in-view')){
     all('.v15-audit-scan',tbody||doc).forEach(el=>el.classList.remove('v15-audit-scan'));return;
   }
   const rows=all('tr[data-sid]',tbody);
   rows.forEach(el=>el.classList.remove('v15-audit-scan'));
   if(rows.length) rows[(auditIndex++)%rows.length].classList.add('v15-audit-scan');
 };
 // v20: legacy row scanner retired; only optical panel beams remain animated.
 const auditTimer=null;
 // Pause decorative animation on hidden document via CSS root flag.
 const visibility=()=>{root.classList.toggle('v15-document-hidden',doc.hidden);if(doc.hidden)all('.v15-audit-scan').forEach(e=>e.classList.remove('v15-audit-scan'));};
 doc.addEventListener('visibilitychange',visibility);visibility();
 // Respect text language after translation, without changing timestamps or signal values.
 function localize(){
   const isId=(window.RaptorLang?.get?.()||'en')==='id';
   all('.v15-original-chart-note').forEach(el=>{el.textContent=isId?'Gambar chart asli menggunakan label waktu WIB. Data gambar tidak diubah.':'Original source chart PNG contains WIB time labels. Website signal times use UTC; source image is preserved.';});
 }
 window.addEventListener('raptor:lang',localize);
 // Mutation: each time a source chart modal is opened, decorate, never re-render the chart.
 const modal=qs('#modal-body');
 if(modal){
   const mo=new MutationObserver(()=>{
     if(!modal.querySelector('.chart-viewer')||modal.querySelector('.v15-original-chart-note'))return;
     const viewer=modal.querySelector('.chart-viewer');
     const note=doc.createElement('div');note.className='v15-original-chart-note';viewer.appendChild(note);
     localize();
   });
   mo.observe(modal,{childList:true});
 }
 // Use one compositor clock for gentle timeline awareness: CSS durations are integer multiples.
 const refresh=()=>{
   if(isStill())root.classList.add('v15-paused');else root.classList.remove('v15-paused');
   if(isStill()) all('.v15-audit-scan').forEach(e=>e.classList.remove('v15-audit-scan'));
 };
 motionBtn?.addEventListener('click',()=>requestAnimationFrame(refresh));
 reduce.addEventListener?.('change',refresh);doc.addEventListener('visibilitychange',refresh);refresh();
 window.RaptorV15={get enabled(){return !isStill()},get panelsVisible(){return visiblePanelCount},get historicalCount(){return Number(window.RAPTOR_DATA?.kpis?.total||0)}};
})();
