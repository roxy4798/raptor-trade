/** RAPTOR TRADE v20 — quiet content, living optics.
 * Stable text & controls, decorative compositor layers only.
 * No modification to financial data, chart geometry, ticker values, or underlying interactions.
 */
(()=>{'use strict';
const d=document,root=d.documentElement;
const $=(s,c=d)=>c.querySelector(s);
const reduced=matchMedia('(prefers-reduced-motion:reduce)');
const still=()=>reduced.matches||root.classList.contains('motion-off')||d.hidden;
const targets=['#signals','#performance','.insight','#filters','#system'];
function init(){
  for(const sel of targets){
    const node=$(sel);if(!node||$('.v20-light-track',node))continue;
    node.classList.add('v20-optical-surface');
    const light=d.createElement('span');light.className='v20-light-track';light.setAttribute('aria-hidden','true');
    node.prepend(light);
  }
  $('.v16-curve-panel')?.classList.add('v20-curve');
  // Do not create a second ticker. The original duplicate-group marquee remains responsible.
  const ticker=$('#signal-tape');
  if(ticker){
    const sync=()=>ticker.style.animationPlayState=still()?'paused':'running';
    d.addEventListener('visibilitychange',sync);
    reduced.addEventListener?.('change',sync);
    $('#motion-toggle')?.addEventListener('click',()=>requestAnimationFrame(sync));
    sync();
  }
  root.classList.add('v20-optical-precision');
}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
