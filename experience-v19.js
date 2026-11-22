/* v19: Compact responsive signal detail terminal.
   Reparents existing data/PNG without changing them. No new alerts or synthetic prices. */
(()=>{'use strict';
 const modal=document.getElementById('modal-body'); if(!modal)return;
 const root=document.documentElement;
 const still=()=>root.classList.contains('motion-off')||window.matchMedia('(prefers-reduced-motion:reduce)').matches;
 const isID=()=>(window.RaptorLang?.get?.()||'en')==='id';
 let activeTab=0;
 const grp=[[0,6],[6,12],[12,16],[16,22]];
 const tabs=()=>isID()?['HARGA','MOMENTUM','RSI','LIKUIDITAS']:['PRICE','MOMENTUM','RSI','LIQUIDITY'];
 function decorate(){
   if(!modal.querySelector('.chart-viewer') || modal.querySelector('.v19-detail-layout'))return;
   const viewer=modal.querySelector('.chart-viewer'),metrics=modal.querySelector('.metric-grid');
   if(!metrics)return;
   const wrap=document.createElement('div');wrap.className='v19-detail-layout';
   const left=document.createElement('div');left.className='v19-chart-side';
   const right=document.createElement('div');right.className='v19-metrics-side';
   const heading=document.createElement('div');heading.className='v19-section-heading';
   const tabsWrap=document.createElement('div');tabsWrap.className='v19-tablist';tabsWrap.setAttribute('role','tablist');tabsWrap.setAttribute('aria-label','Indicator categories');
   const items=Array.from(metrics.children),pages=[];const tabButtons=[];
   grp.forEach(([a,b],i)=>{
     const tab=document.createElement('button');tab.className='v19-tab';tab.type='button';tab.setAttribute('role','tab');tab.id='v19-tab-'+i;tab.setAttribute('aria-controls','v19-panel-'+i);tab.dataset.index=i;
     const pg=document.createElement('div');pg.className='metric-grid v19-metric-page';pg.id='v19-panel-'+i;pg.setAttribute('role','tabpanel');pg.setAttribute('aria-labelledby',tab.id);
     items.slice(a,b).forEach(m=>pg.append(m));
     tabsWrap.append(tab);pages.push(pg);tabButtons.push(tab);
   });
   const stamp=document.createElement('span');stamp.className='v19-compact-flag';stamp.textContent='SNAPSHOT · 4H';
   const head=modal.querySelector('.modal-head'); if(head){const close=head.querySelector('.modal-close');head.insertBefore(stamp,close)}
   const chartFoot=document.createElement('div');chartFoot.className='v19-chart-foot';chartFoot.innerHTML='<span></span><b>1080 × 1350 PNG</b>';
   const trk=modal.querySelector('.tracker-box');
   modal.insertBefore(wrap,viewer);
   wrap.append(left,right);left.append(viewer,chartFoot);right.append(heading,tabsWrap,...pages);if(trk)right.append(trk);
   const active=Math.max(0,Math.min(3,activeTab));
   const select=(idx,focus=false)=>{activeTab=idx;pages.forEach((page,i)=>{const on=i===idx;page.hidden=!on;tabButtons[i].setAttribute('aria-selected',String(on));tabButtons[i].tabIndex=on?0:-1;});
     if(focus)tabButtons[idx].focus({preventScroll:true});};
   tabButtons.forEach((btn,i)=>{
     btn.addEventListener('click',()=>select(i));
     btn.addEventListener('keydown',ev=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(ev.key))return;ev.preventDefault();select(ev.key==='Home'?0:ev.key==='End'?3:(i+(ev.key==='ArrowRight'?1:3))%4,true)})
   });
   function localize(){heading.innerHTML=isID()?'INDIKATOR PASAR <small>DATA HISTORIS</small>':'MARKET INDICATORS <small>HISTORICAL DATA</small>';
     tabButtons.forEach((btn,i)=>btn.textContent=tabs()[i]);chartFoot.firstElementChild.textContent=isID()?'Ketuk chart untuk memperbesar':'Tap chart to enlarge';}
   localize();select(active);
   modal._v19Localize=localize;
   const viewport=viewer.querySelector('.chart-viewport');
   if(viewport){viewport.tabIndex=0; viewport.setAttribute('role','button');viewport.setAttribute('aria-label',isID()?'Perbesar atau kecilkan chart':'Zoom chart in or out');
     viewport.addEventListener('click',ev=>{if(!ev.target.closest('button,a')) viewer.querySelector('#chart-zoom')?.click()});
     viewport.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();viewer.querySelector('#chart-zoom')?.click()}});
     viewport.addEventListener('pointerdown',ev=>{if(still())return;const rect=viewport.getBoundingClientRect(),r=document.createElement('span');r.className='v19-touch-ripple';r.style.left=(ev.clientX-rect.left)+'px';r.style.top=(ev.clientY-rect.top+viewport.scrollTop)+'px';viewport.appendChild(r);r.addEventListener('animationend',()=>r.remove(),{once:true});setTimeout(()=>r.remove(),850)},{passive:true});
   }
 }
 const observer=new MutationObserver(decorate);observer.observe(modal,{childList:true});
 // Track motion uses exact offset between the duplicated signal groups for a seamless loop.
 const tape=document.getElementById('signal-tape');
 function syncTape(){ if(!tape)return; const items=tape.querySelectorAll('.tape-item');if(items.length<2)return;const half=Math.floor(items.length/2);const distance=items[half].offsetLeft-items[0].offsetLeft; if(distance>0)tape.style.setProperty('--v19-distance-neg',(-distance)+'px');}
 window.addEventListener('load',syncTape);requestAnimationFrame(syncTape);
 if(tape&&window.ResizeObserver){const ro=new ResizeObserver(syncTape);ro.observe(tape.parentElement)}

 window.addEventListener('raptor:lang',()=>{requestAnimationFrame(()=>{modal._v19Localize?.();decorate()})});
 decorate();
})();
