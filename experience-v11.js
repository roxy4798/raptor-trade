/** Raptor v11 / coherent micro-interactions. Exactly one brand palette, one motion preference.
 * The v10 dashboard director owns scroll reveals; this module augments only non-overlapping details.
 * It never mutates snapshot data, signal sorting or modal state. */
(()=>{'use strict';
const doc=document,root=doc.documentElement;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const fine=matchMedia('(hover:hover) and (pointer:fine)');
const canMove=()=>!reduced.matches&&!root.classList.contains('motion-off')&&!doc.hidden;
const atmosphere=doc.createElement('div');atmosphere.id='rt-atmosphere';atmosphere.setAttribute('aria-hidden','true');doc.body.insertBefore(atmosphere,doc.body.firstChild);
for(const panel of doc.querySelectorAll('.mission-hero,.observatory,.card')){
 const edge=doc.createElement('span');edge.className='rt-telemetry-line';edge.setAttribute('aria-hidden','true');panel.append(edge);
 if(panel.matches('.mission-hero,.observatory')){const tick=doc.createElement('span');tick.className='rt-ambient-tick';tick.setAttribute('aria-hidden','true');panel.append(tick);}
}
// Visuals derive from brand colors, not market sentiment or generated trading data.
let pointerX=innerWidth*.7,pointerY=innerHeight*.24,scheduled=false;
function tickPointer(){scheduled=false;if(!fine.matches||!canMove())return;
 root.style.setProperty('--env-x',`${(pointerX/Math.max(1,innerWidth)*100).toFixed(2)}%`);
 root.style.setProperty('--env-y',`${(pointerY/Math.max(1,innerHeight)*100).toFixed(2)}%`);
}
doc.addEventListener('pointermove',event=>{if(event.pointerType==='touch'||!canMove())return;
 pointerX=event.clientX;pointerY=event.clientY;if(!scheduled){scheduled=true;requestAnimationFrame(tickPointer);}
},{passive:true});
// Subtle spatial reflex on the radar frame. No transform is applied to its canvas or to text.
const heroVisual=doc.querySelector('.hero-visual');
if(heroVisual){
 const stage=heroVisual.querySelector('.radar-stage');
 heroVisual.addEventListener('pointermove',event=>{
  if(!fine.matches||!canMove()||!stage)return;
  const rect=heroVisual.getBoundingClientRect(),x=(event.clientX-rect.left)/Math.max(rect.width,1)-.5,y=(event.clientY-rect.top)/Math.max(rect.height,1)-.5;
  stage.style.setProperty('--radar-tilt-y',`${(x*3).toFixed(2)}deg`);
  stage.style.setProperty('--radar-tilt-x',`${(-y*3).toFixed(2)}deg`);
 },{passive:true});
 heroVisual.addEventListener('pointerleave',()=>{stage?.style.removeProperty('--radar-tilt-y');stage?.style.removeProperty('--radar-tilt-x');});
}
// Present an explicit semantic signal snapshot label. Never imply historical values are live.
const time=doc.querySelector('#snapshot-status');if(time)time.title='Historical export. Live market data is not connected.';
const official=doc.querySelector('.rail-logo');if(official)official.title='Raptor Trade · official supplied emblem';
const mark=doc.querySelector('.hero-identity-mark img');if(mark)mark.setAttribute('aria-label','Official Raptor Trade emblem');
// The data-oriented visualization already has a native HTML accessible history selector.
// Keep its labels active even if the enhancement is unable to create a GPU context.
const fallbackLabel=doc.querySelector('#obs-viewport');
if(fallbackLabel)fallbackLabel.setAttribute('aria-description','Eight actual historical four-hour candle counts. Use the candle buttons to select a point. Drag the scene to rotate it when the GPU renderer is supported.');
root.classList.add('v11-ready');
})();
