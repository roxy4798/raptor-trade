/**
 * Raptor Trade v10 | motion conductor.
 * One motion language. The intro-to-terminal transition is the single choreography cue;
 * no duplicated GSAP/particle/cursor/scroll loops. Never edits trading data.
 * Reduced motion, low-power devices and tab visibility explicitly respected.
 */
(()=>{'use strict';
 const root=document.documentElement;
 const $=(selector,parent=document)=>parent.querySelector(selector);
 const $$=(selector,parent=document)=>Array.from(parent.querySelectorAll(selector));
 const prefersReduced=matchMedia('(prefers-reduced-motion: reduce)');
 const finePointer=matchMedia('(hover: hover) and (pointer: fine)');
 const off=()=>prefersReduced.matches||root.classList.contains('motion-off');
 root.classList.add('v10-ready');
 // Move the details dialog out of the .wrap stacking context so it can cover the mobile rail.
 const backdrop=$('#modal-backdrop');if(backdrop&&backdrop.parentElement!==document.body)document.body.appendChild(backdrop);
 const intro=$('#intro');
 if(!intro)root.classList.add('dashboard-entered');
 const staged=$$('.kpi,.insight,.performance-card,.signals-card,#performance,#signals,#filters,#system,.observatory,.section-heading,.two-col>.card,footer')
   .filter((el,i,all)=>all.indexOf(el)===i && !el.closest('#intro') && !el.closest('.mission-hero'));
 staged.forEach((el,i)=>{el.dataset.rtReveal='';el.style.setProperty('--rt-delay',`${Math.min((i%4)*65,195)}ms`);});
 let revealIO=null;
 if('IntersectionObserver' in window){
   revealIO=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{
     if(!isIntersecting)return;target.classList.add('rt-visible');revealIO.unobserve(target);
   }),{threshold:.07,rootMargin:'0px 0px -6% 0px'});
 }
 let started=false;
 function revealAll(){staged.forEach(el=>el.classList.add('rt-visible'));}
 function enterDashboard(){
   if(started)return;started=true;root.classList.add('dashboard-entered');
   if(off()||!revealIO){revealAll();return;}
   staged.forEach(el=>revealIO.observe(el));
   // Everything above the fold must appear without waiting for an IntersectionObserver callback.
   requestAnimationFrame(()=>staged.forEach(el=>{if(el.getBoundingClientRect().top<innerHeight*.85)el.classList.add('rt-visible');}));
   const gsap=window.gsap;
   if(gsap){
     gsap.timeline({defaults:{ease:'power3.out'},delay:.04})
       .from('.hero-identity',{y:9,opacity:0,duration:.48,clearProps:'transform,opacity'},0)
       .from('.mission-hero .eyebrow',{y:8,opacity:0,duration:.45,clearProps:'transform,opacity'},.08)
       .from('.mission-hero .brand h1',{y:15,opacity:0,duration:.65,clearProps:'transform,opacity'},.14)
       .from('.mission-hero .tagline',{y:12,opacity:0,duration:.58,clearProps:'transform,opacity'},.26)
       .from('.hero-buttons>*',{y:9,opacity:0,duration:.57,stagger:.09,clearProps:'transform,opacity'},.38)
       .from('.hero-trust',{opacity:0,duration:.5,clearProps:'opacity'},.47)
       .from('.radar-header,.radar-footer',{opacity:0,duration:.62,stagger:.08,clearProps:'opacity'},.2);
   }
 }
 if(intro) addEventListener('raptor:intro-done',()=>requestAnimationFrame(enterDashboard),{once:true});
 else requestAnimationFrame(enterDashboard);
 // Safety: never keep the application content hidden when a transition was skipped.
 addEventListener('pageshow',()=>{if(!$('#intro:not(.gone)'))enterDashboard();});
 prefersReduced.addEventListener?.('change',()=>{if(off())revealAll();});
 $('#motion-toggle')?.addEventListener('click',()=>{
   if(!off()&&!root.classList.contains('intro-lock')){
     $$('[data-rt-reveal]').forEach(el=>{el.classList.add('rt-visible');});
   }
 });
 // Device-friendly single-pointer pipeline: one listener + one rAF, no new WebGL context.
 const cursor=document.createElement('div');cursor.className='rt-pointer-glow';cursor.setAttribute('aria-hidden','true');document.body.append(cursor);
 let pointerX=-500,pointerY=-500,screenX=-500,screenY=-500,pointerScheduled=false;
 const applyPointer=()=>{
   pointerScheduled=false;
   if(!finePointer.matches||off()||document.hidden||root.classList.contains('intro-lock')){
     cursor.classList.remove('rt-on');return;
   }
   screenX=pointerX;screenY=pointerY;
   cursor.style.transform=`translate3d(${screenX-210}px,${screenY-210}px,0)`;
   cursor.classList.add('rt-on');
 };
 document.addEventListener('pointermove',ev=>{
   if(ev.pointerType==='touch')return;
   pointerX=ev.clientX;pointerY=ev.clientY;
   const panel=ev.target.closest?.('.card,.observatory,.market-tape,header.mission-hero');
   if(panel&&!off()){
     const box=panel.getBoundingClientRect();
     panel.style.setProperty('--rt-light-x',`${ev.clientX-box.left}px`);
     panel.style.setProperty('--rt-light-y',`${ev.clientY-box.top}px`);
   }
   if(!pointerScheduled){pointerScheduled=true;requestAnimationFrame(applyPointer);}
 },{passive:true});
 document.addEventListener('pointerleave',()=>cursor.classList.remove('rt-on'));
 // Interactions have one scale and timing: native pointer events and CSS transforms.
 document.addEventListener('pointerdown',ev=>{
   if(off()||root.classList.contains('intro-lock'))return;
   const hit=ev.target.closest?.('.primary-btn,.secondary-btn,.filter-btn,.obs-mode,.obs-legend-item');
   if(!hit)return;
   const bounds=hit.getBoundingClientRect(),dot=document.createElement('span');
   dot.className='rt-ripple';
   dot.style.setProperty('--rt-rx',`${ev.clientX-bounds.left}px`);
   dot.style.setProperty('--rt-ry',`${ev.clientY-bounds.top}px`);
   hit.append(dot);dot.addEventListener('animationend',()=>dot.remove(),{once:true});
 },{passive:true});
 $('#observatory')?.addEventListener('raptor:obs-mode',ev=>{
   const pressed=$(`[data-obs-mode="${ev.detail.mode}"]`);
   if(!pressed||off())return;
   pressed.classList.remove('rt-border-pulse');void pressed.offsetWidth;
   pressed.classList.add('rt-border-pulse');
   pressed.addEventListener('animationend',()=>pressed.classList.remove('rt-border-pulse'),{once:true});
 });
 // Scroll progress is a compositor transform, at most once per animation frame.
 const bar=document.createElement('div');bar.className='rt-reading-progress';bar.setAttribute('aria-hidden','true');document.body.append(bar);
 let scrollQueued=false;
 function updateScroll(){scrollQueued=false;const range=Math.max(1,document.documentElement.scrollHeight-innerHeight);
   bar.style.transform=`scaleX(${Math.max(0,Math.min(1,scrollY/range))})`;
 }
 addEventListener('scroll',()=>{if(!scrollQueued){scrollQueued=true;requestAnimationFrame(updateScroll);}},{passive:true});
 addEventListener('resize',()=>{if(!scrollQueued){scrollQueued=true;requestAnimationFrame(updateScroll);}},{passive:true});
 updateScroll();
 // Draw real SVG history curves only when their parent is in view.
 function drawChart(container){
   if(off())return;
   $$('svg polyline[stroke]',container).forEach(path=>{
     if(path.dataset.rtDrawn)return;
     let length=0;try{length=path.getTotalLength();}catch(e){}
     if(!(length>20))return;path.dataset.rtDrawn='1';
     const prevDash=path.style.strokeDasharray,prevOffset=path.style.strokeDashoffset;
     path.style.strokeDasharray=String(length);path.style.strokeDashoffset=String(length);
     const anim=path.animate([{strokeDashoffset:String(length)},{strokeDashoffset:'0'}],{duration:1200,easing:'cubic-bezier(.22,1,.36,1)',fill:'forwards'});
     anim.finished.then(()=>{path.style.strokeDasharray=prevDash;path.style.strokeDashoffset=prevOffset;anim.cancel();}).catch(()=>{});
   });
 }
 if('IntersectionObserver' in window){
   const chartsIO=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{
     if(!isIntersecting)return;drawChart(target);chartsIO.unobserve(target);
   }),{threshold:.17});
   $$('.perf-grid,.equity').forEach(el=>chartsIO.observe(el));
 }
 // Respect OS motion changes for all visual layers, without touching signal data.
 document.addEventListener('visibilitychange',()=>{if(document.hidden)cursor.classList.remove('rt-on');});
 window.RaptorExperienceV10={get entered(){return started},get reduced(){return off()}};
})();
