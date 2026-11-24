/* Raptor native HTML5 Canvas backup chart.
   Draws only authentic Binance OHLCV delivered by the same REST/WS provider.
   Never fabricates candles if TradingView charting engine is blocked. */
(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s);
window.RaptorNativeChart=function(mount){
 const cvs=document.createElement('canvas');cvs.className='v24-native-canvas';cvs.style.cssText='width:100%;height:100%;display:block;touch-action:pan-y';cvs.tabIndex=0;cvs.setAttribute('aria-label','Interactive 4H Binance Futures candlestick chart. Drag to pan, use mouse wheel or pinch to zoom.');
 mount.append(cvs);const ctx=cvs.getContext('2d',{alpha:false});
 let W=600,H=320,from=0,to=0,pressed=false,dragX=0,hover=-1,markers=[],pending=0,removed=false;
 const data={candle:[],ema20:[],ema50:[],volume:[],priceLines:[]};
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 const tint='rgba(90,141,162,.22)';
 function resize(){if(removed)return;const r=mount.getBoundingClientRect();W=Math.max(280,Math.floor(r.width));H=Math.max(260,Math.floor(r.height));const dpr=Math.min(2,window.devicePixelRatio||1);cvs.width=W*dpr;cvs.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);drawLater();}
 function drawLater(){if(pending||removed)return;pending=requestAnimationFrame(draw)}
 function emaAt(map,time){const a=data[map];let l=0,r=a.length-1;while(l<=r){const m=(l+r)>>1;if(a[m].time<time)l=m+1;else r=m-1;}return a[l]?.time===time?a[l].value:null}
 function draw(){pending=0;if(removed)return;
  ctx.fillStyle='#050c14';ctx.fillRect(0,0,W,H);
  const rows=data.candle;if(!rows.length)return;
  const L=48,R=W-80,T=18,B=H-27,volHeight=Math.max(48,Math.floor(H*.19)),volBase=B,priceBottom=B-volHeight-12;
  const maxIndex=rows.length-1;const f=clamp(Math.floor(from),0,maxIndex),e=clamp(Math.ceil(to),f,maxIndex);
  const visible=rows.slice(f,e+1);const cw=(R-L)/Math.max(1,visible.length);
  if(cw<=0)return;
  const prices=[];for(const r of visible)prices.push(r.high,r.low);
  for(const p of data.priceLines) if(p.price>0)prices.push(p.price);
  let hi=Math.max(...prices),lo=Math.min(...prices),padding=(hi-lo)*.09||hi*.001||1;
  hi+=padding;lo-=padding;
  const Y=v=>T+(hi-v)/(hi-lo)*(priceBottom-T);
  const X=i=>L+(i+.5)*cw;
  ctx.strokeStyle='rgba(80,132,151,.13)';ctx.lineWidth=1;ctx.setLineDash([]);
  ctx.font='10px ui-monospace,monospace';ctx.textAlign='right';ctx.fillStyle='#83a4b1';
  for(let j=0;j<5;j++){const y=T+j*(priceBottom-T)/4;ctx.beginPath();ctx.moveTo(L,y);ctx.lineTo(R,y);ctx.stroke();ctx.fillText((hi-j*(hi-lo)/4).toPrecision(6),W-6,y+3)}
  ctx.textAlign='center';
  for(let j=0;j<5;j++){const i=Math.round(j*(visible.length-1)/4);const x=X(i);ctx.beginPath();ctx.moveTo(x,T);ctx.lineTo(x,B);ctx.stroke();const d=new Date(visible[i].time*1000);const loc=window.RaptorLang?.get?.()==='id'?'id-ID':'en-GB';const zone=loc==='id-ID'?'Asia/Jakarta':'UTC';ctx.fillText(new Intl.DateTimeFormat(loc,{day:'2-digit',month:'short',timeZone:zone}).format(d),x,B+18)}
  const maxVol=Math.max(1,...visible.map(r=>{const v=data.volume.find(v=>v.time===r.time);return v?.value||0;}));
  visible.forEach((r,i)=>{
    const x=X(i),up=r.close>=r.open,col=up?'#3ce1bf':'#ef6778',bodyW=Math.max(1,Math.min(16,cw*.66));
    const wickT=Y(r.high),wickB=Y(r.low),yo=Y(r.open),yc=Y(r.close);
    ctx.strokeStyle=col;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,wickT);ctx.lineTo(x,wickB);ctx.stroke();
    ctx.fillStyle=col;ctx.fillRect(x-bodyW/2,Math.min(yo,yc),bodyW,Math.max(1,Math.abs(yc-yo)));
    const vv=data.volume.find(v=>v.time===r.time)?.value||0;
    ctx.fillStyle=up?'rgba(58,215,185,.44)':'rgba(239,103,120,.44)';
    ctx.fillRect(x-bodyW/2,volBase-vv/maxVol*(volHeight-5),bodyW,vv/maxVol*(volHeight-5));
  });
  [['ema20','#35dad3'],['ema50','#ffad42']].forEach(([key,color])=>{
    ctx.lineWidth=1.7;ctx.strokeStyle=color;ctx.beginPath();let started=false;
    for(let i=0;i<visible.length;i++){const v=emaAt(key,visible[i].time);if(v==null)continue;const x=X(i),y=Y(v);if(!started){ctx.moveTo(x,y);started=true}else ctx.lineTo(x,y)}
    if(started)ctx.stroke();
  });
  data.priceLines.forEach((p)=>{const y=Y(p.price);if(y<T||y>priceBottom)return;ctx.strokeStyle=p.color||'#a6f58a';ctx.lineWidth=1;ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(L,y);ctx.lineTo(R,y);ctx.stroke();ctx.setLineDash([]);ctx.textAlign='left';ctx.fillStyle=p.color||'#a6f58a';/* v42: the attribution sits top-left (T+12); a price line near the top (the signal close usually is) printed its title on top of it. Flip the title below the line when it would land in the attribution band. */ctx.fillText(p.title||'',L+6,y<T+30?y+14:y-4)});
  markers.forEach(m=>{const i=visible.findIndex(r=>r.time===m.time);if(i<0)return;const x=X(i),y=Y(visible[i].low)+12;ctx.fillStyle='#c6ff4d';ctx.beginPath();ctx.moveTo(x,y-8);ctx.lineTo(x-5,y+2);ctx.lineTo(x+5,y+2);ctx.closePath();ctx.fill();ctx.textAlign='center';ctx.fillText('SIGNAL',x,y+16)});
  if(hover>=0&&hover<visible.length){const r=visible[hover],x=X(hover);ctx.lineWidth=1;ctx.strokeStyle='rgba(90,219,255,.56)';ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(x,T);ctx.lineTo(x,B);ctx.stroke();ctx.setLineDash([]);
    const fmtDate=new Intl.DateTimeFormat(window.RaptorLang?.get?.()==='id'?'id-ID':'en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hour12:false,timeZone:window.RaptorLang?.get?.()==='id'?'Asia/Jakarta':'UTC'}).format(new Date(r.time*1000));const txt=`${fmtDate} ${window.RaptorLang?.get?.()==='id'?'WIB':'UTC'}  O ${r.open.toPrecision(6)}  H ${r.high.toPrecision(6)}  L ${r.low.toPrecision(6)}  C ${r.close.toPrecision(6)}`;
    ctx.fillStyle='rgba(2,13,24,.90)';ctx.fillRect(L+3,T+3,Math.min(R-L-6,580),27);
    ctx.fillStyle='#b8d9e4';ctx.textAlign='left';ctx.font='10px ui-monospace,monospace';ctx.fillText(txt.slice(0,Math.floor((R-L)/5.8)),L+9,T+19);
  }
  /* Attribution sits in the plot's top-left headroom (the 9% price padding keeps
     it clear of candles). It used to sit at the bottom-left (H-8), on the SAME
     row as the time-axis labels (B+18 = H-9) and at the SAME x as the first
     label — so the two texts collided into a garbled "17 BINANCE 4H · REAL
     OHLCV" blob (audit 24 Nov 2026). The hover tooltip may briefly cover it. */
  ctx.textAlign='left';ctx.font='700 10px ui-monospace,monospace';ctx.fillStyle='#829dae';ctx.fillText(window.RaptorLang?.get?.()==='id'?'BINANCE 4J · OHLCV ASLI':'BINANCE 4H · REAL OHLCV',L+3,T+12);
 }
 function series(key){return {
   setData(arr){data[key]=Array.isArray(arr)?arr.slice():[];if(key==='candle'&&!to){from=Math.max(0,arr.length-65);to=arr.length+3}drawLater()},
   update(row){const a=data[key];if(a.length&&a[a.length-1].time===row.time)a[a.length-1]=row;else a.push(row);if(key==='candle'&&to>=a.length-2){to=a.length+3;from=Math.max(0,to-65)}drawLater()},
   createPriceLine(p){data.priceLines.push(p);drawLater();return p},
   priceScale(){return {applyOptions(){}}}
 };}
 const seriesTypes=['candle','ema20','ema50','volume'];let next=0;
 const chart={
  addSeries(){return series(seriesTypes[next++]||'volume')},
  applyOptions(opts){if(opts?.width||opts?.height)resize()},
  remove(){removed=true;cancelAnimationFrame(pending);cvs.remove()},
  timeScale(){return {fitContent(){from=Math.max(0,data.candle.length-75);to=data.candle.length+3;drawLater()},setVisibleLogicalRange(r){from=r.from;to=r.to;drawLater()}}}
 };
 // Binding is intentionally explicit; the backend still supplies the only OHLCV.
 function where(e){const r=cvs.getBoundingClientRect();const cnt=Math.max(1,Math.min(data.candle.length-1,Math.floor(to))-Math.max(0,Math.floor(from))+1);return clamp(Math.round((e.clientX-r.left-48)/(Math.max(1,r.width-128))*cnt),0,cnt-1)}
 cvs.addEventListener('pointerdown',e=>{pressed=true;dragX=e.clientX;if(e.pointerType==='mouse')cvs.setPointerCapture(e.pointerId)});
 cvs.addEventListener('pointermove',e=>{hover=where(e);if(pressed){const dx=(e.clientX-dragX)/14;dragX=e.clientX;from-=dx;to-=dx;if(from<0){to-=from;from=0}if(to>data.candle.length+3){const d=to-data.candle.length-3;from-=d;to-=d}}drawLater()},{passive:true});
 ['pointerup','pointercancel','pointerleave'].forEach(type=>cvs.addEventListener(type,()=>{pressed=false;if(type==='pointerleave')hover=-1;drawLater()}));
 cvs.addEventListener('wheel',e=>{e.preventDefault();const mid=(from+to)/2,width=clamp(to-from+(e.deltaY>0?8:-8),18,Math.min(data.candle.length,150));from=clamp(mid-width/2,0,Math.max(0,data.candle.length-width));to=from+width;drawLater()},{passive:false});
 cvs.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();const delta=e.key==='ArrowLeft'?-5:5;from+=delta;to+=delta;from=clamp(from,0,Math.max(0,data.candle.length-20));to=from+60;drawLater()}});
 resize();
 return {chart, LW:{createSeriesMarkers:()=>{return null;}},_native:{setMarkers:m=>{markers=m;drawLater()}},
   candle:chart.addSeries(),ema20:chart.addSeries(),ema50:chart.addSeries(),volume:chart.addSeries()};
};
})();
