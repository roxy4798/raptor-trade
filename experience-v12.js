/** RAPTOR v12: final consistency controls and fault-tolerant chart preview. */
(()=>{'use strict';
 const ob=document.querySelector('#observatory');
 const legend=document.querySelector('#obs-legend');
 if(ob && legend){
  // data matrix is the legible default; preserves the 8 historical samples and original data order.
  ob.dataset.mode='matrix';
  ob.querySelectorAll('[data-obs-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.obsMode==='matrix')));
  // Sync highlighted bars with the same selected legend index, including keyboard selection.
  ob.addEventListener('raptor:obs-select',ev=>{
   const i=Number(ev.detail?.index);
   ob.querySelectorAll('.obs-fallback-column').forEach((el,j)=>el.classList.toggle('is-selected',j===i));
  });
  legend.addEventListener('pointerover',ev=>{const b=ev.target.closest('.obs-legend-item');if(!b)return;
   const i=Number(b.dataset.index);ob.querySelectorAll('.obs-fallback-column').forEach((el,j)=>el.classList.toggle('is-hover',j===i));
  });
  legend.addEventListener('pointerleave',()=>ob.querySelectorAll('.obs-fallback-column').forEach(el=>el.classList.remove('is-hover')));
 }
 // Historical chart pixels are deliberately untouched. Images must preserve aspect ratio.
 document.addEventListener('error',ev=>{
  const img=ev.target;if(!(img instanceof HTMLImageElement)||!img.matches('.modal img.chart'))return;
  img.insertAdjacentHTML('afterend','<p role="status" class="muted" style="padding:18px">The original chart PNG could not be loaded. Historical metrics below are still available.</p>');img.hidden=true;
 },true);
 document.documentElement.classList.add('v12-ready');
})();
