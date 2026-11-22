/* Raptor Signal Observatory DOM layer — language-aware. */
(()=>{'use strict';
  const root=document.documentElement;
  const ds=window.RAPTOR_DATA||{};
  const series=ds.series?.signals_per_close||[];
  const I18N=window.RaptorLang||{t:k=>k,useWIB:()=>false};
  const $=(s,b=document)=>b.querySelector(s);
  const all=(s,b=document)=>Array.from(b.querySelectorAll(s));
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const motionOff=()=>root.classList.contains('motion-off')||reduced.matches;
  const ob=$('#observatory'); if(!ob)return;
  const viewport=$('#obs-viewport'),fallback=$('#obs-fallback'),legend=$('#obs-legend');
  let selected=-1;
  $('#obs-closes').textContent=String(series.length); $('#obs-signal-count').textContent=String(series.reduce((n,r)=>n+Number(r.count||0),0)); $('#obs-peak').textContent=String(Math.max(0,...series.map(s=>Number(s.count||0))));
  const max=Math.max(1,...series.map(s=>Number(s.count||0)));
  function timeLabel(c, short){ if(I18N.useWIB()) return short?c.close_wib.replace(/^\d+ \w+ /,''):c.close_wib+' WIB'; var dt=new Date(c.close_ts*1000); var month=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][dt.getUTCMonth()]; var label=dt.getUTCDate()+' '+month+' '+String(dt.getUTCHours()).padStart(2,'0')+':00'; return short?String(dt.getUTCHours()).padStart(2,'0')+':00':label+' UTC'; }
  function renderLegend(){ legend.innerHTML=''; fallback.innerHTML=''; series.forEach((c,i)=>{ const bar=document.createElement('div');bar.className='obs-fallback-column';bar.style.setProperty('--idx',i); const inner=document.createElement('span');inner.className='obs-fallback-bar';inner.style.setProperty('--signal-height',Math.round(178*(Number(c.count||0)/max))+'px'); const label=document.createElement('span');label.className='obs-fallback-label';label.textContent=String(c.count); bar.append(inner,label);fallback.append(bar); const b=document.createElement('button');b.type='button';b.className='obs-legend-item'+(c.count===0?' zero':'');b.dataset.index=String(i); b.setAttribute('aria-pressed','false');b.setAttribute('aria-label',I18N.t('closeAria',{time:timeLabel(c,false),count:c.count,index:i+1})); const n=document.createElement('b');n.textContent=String(c.count); const t=document.createElement('small');t.textContent=timeLabel(c,true); b.append(n,t);b.addEventListener('click',()=>select(i));legend.append(b); }); }
  function select(i){ if(i<0||i>=series.length)return; selected=i; all('.obs-legend-item',legend).forEach((b,k)=>b.setAttribute('aria-pressed',String(k===i))); const d=series[i]; $('#obs-status').textContent=I18N.t('historicalSignals',{time:timeLabel(d,false),count:d.count}); ob.dispatchEvent(new CustomEvent('raptor:obs-select',{detail:{index:i}})); }
  renderLegend();
  ob.addEventListener('raptor:obs-choose',e=>select(e.detail.index));
  const buttons=all('[data-obs-mode]',ob);
  buttons.forEach(b=>b.addEventListener('click',()=>{ buttons.forEach(c=>c.setAttribute('aria-pressed',String(c===b))); const mode=b.dataset.obsMode; ob.dataset.mode=mode; ob.dispatchEvent(new CustomEvent('raptor:obs-mode',{detail:{mode}})); }));
  $('#obs-reset')?.addEventListener('click',()=>{ ob.dispatchEvent(new CustomEvent('raptor:obs-reset')); ob.dataset.mode='matrix';buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.obsMode==='matrix')));select(0);ob.dispatchEvent(new CustomEvent('raptor:obs-mode',{detail:{mode:'matrix'}})); });
  ob.dataset.mode='matrix';
  if('IntersectionObserver' in window){ const io=new IntersectionObserver(entries=>{entries.forEach(e=>{ if(e.isIntersecting){e.target.classList.add('is-in-view');io.unobserve(e.target);} })},{rootMargin:'0px 0px -4% 0px',threshold:.10}); all('.observatory,.insight,.signals-card,.performance-card,#metrics').forEach(el=>io.observe(el)); }
  legend.addEventListener('keydown',e=>{ if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return; e.preventDefault(); const old=selected>=0?selected:0; const n=e.key==='Home'?0:e.key==='End'?series.length-1:(old+(e.key==='ArrowRight'?1:-1)+series.length)%series.length; select(n); legend.children[n]?.focus(); });
  const modeText=$('.motion-text');
  function syncMotion(){ ob.classList.toggle('obs-still',motionOff()); if(modeText)modeText.textContent=root.classList.contains('motion-off')?I18N.t('motionOff'):I18N.t('motionOn'); }
  reduced.addEventListener?.('change',syncMotion); $('#motion-toggle')?.addEventListener('click',()=>requestAnimationFrame(syncMotion)); syncMotion();
  if(window.gsap&&!motionOff()){ const once=()=>{ if(ob.dataset.animateDone)return;ob.dataset.animateDone='1'; window.gsap.from('.obs-heading > div:first-child,.obs-status',{opacity:0,y:14,duration:.7,ease:'power3.out',stagger:.12}); window.gsap.from('.obs-legend-item',{opacity:0,y:11,duration:.6,stagger:.055,ease:'power2.out',delay:.2}); }; if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){io.disconnect();once();}},{threshold:.18});io.observe(ob)}else once(); }
  window.addEventListener('raptor:lang',()=>{ renderLegend(); select(Math.max(0,selected)); syncMotion(); });
  select(0);
  window.RaptorObservatory={select,get data(){return series},get selected(){return selected}};
})();
