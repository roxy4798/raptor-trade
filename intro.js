/* Raptor v10 opening: raw WebGL 3D tunnel + wireframe signal chart (bars = real signals-per-close counts). Loaded sync at top of <body>. */
(function(){'use strict';
var doc=document,root=doc.documentElement;var I18N=window.RaptorLang||{t:function(k){return k;}};
if(/[?&]intro=0/.test(location.search)||matchMedia('(prefers-reduced-motion: reduce)').matches||root.classList.contains('motion-off'))return;
root.classList.add('intro-lock');
var D=window.RAPTOR_DATA||null,counts=D?.series?.signals_per_close?.map(function(c){return c.count})||[];
try{var j=JSON.parse(doc.getElementById('raptor-data').textContent);D=j;counts=j.series.signals_per_close.map(function(c){return c.count});}catch(e){}
var nSig=D?D.kpis.total:0;
var ov=doc.createElement('div');ov.id='intro';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label','Raptor Trade intro');
ov.innerHTML='<canvas aria-hidden="true"></canvas><div class="in-vig"></div><div class="in-holo" aria-hidden="true"><i class="in-holo-a"></i><i class="in-holo-b"></i><i class="in-holo-c"></i><i class="in-holo-spark"></i><i class="in-holo-spark spark-b"></i><i class="in-holo-spark spark-c"></i><b class="in-holo-core"><img src="branding/official-raptor-logo.webp" alt=""></b></div>'+
'<div class="in-top"><span class="in-brand"><img src="branding/official-raptor-logo.webp" alt="" width="42" height="42"><strong>RAPTOR <em>TRADE</em></strong></span><button type="button" class="in-skip">SKIP ›</button></div>'+
'<div class="in-mid"><div class="in-kick"><span class="in-kick-dot"></span> INTRODUCING / SIGNAL OBSERVATORY V11</div><img class="in-brand-art" src="branding/official-raptor-logo.webp" alt="Raptor Trade official emblem"><p class="in-title">Hunt the<span>momentum.</span></p><div class="in-spec"><span>RAPTOR / SNAPSHOT MODE</span><span>4H / CLOSED CANDLE</span><span>SNAPSHOT ONLY</span></div></div>'+
'<div class="in-bot"><div class="in-terminal-log" aria-hidden="true"><span class="in-log-left">CORE // 4H SIGNAL ENGINE</span><span class="in-log-center">HISTORY, NOT A LIVE FEED</span><span class="in-log-right">RT.2026 / 01</span></div><div class="in-stat"><span class="in-pct">0</span><i>%</i><em class="in-msg">Booting</em></div><div class="in-bar"><i></i></div>'+
'<button type="button" class="in-enter" hidden>ENTER TERMINAL ↗</button><p class="in-hint">PRESS ENTER TO OPEN THE TERMINAL</p></div>';
doc.body.insertBefore(ov,doc.body.firstChild);
var q=function(s){return ov.querySelector(s)},cv=q('canvas'),pct=q('.in-pct'),msg=q('.in-msg'),bar=q('.in-bar i'),btn=q('.in-enter');
var loaded=doc.readyState==='complete',entered=false,ready=false,done=false;
addEventListener('load',function(){loaded=true});
/* ---------- math (column-major) ---------- */
function mul(a,b){var o=new Float32Array(16);for(var c=0;c<4;c++)for(var r=0;r<4;r++){var s=0;for(var k=0;k<4;k++)s+=a[k*4+r]*b[c*4+k];o[c*4+r]=s}return o}
function persp(fov,a,n,f){var t=1/Math.tan(fov/2);return new Float32Array([t/a,0,0,0,0,t,0,0,0,0,(f+n)/(n-f),-1,0,0,2*f*n/(n-f),0])}
function tr(x,y,z){return new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,x,y,z,1])}
function rx(a){var c=Math.cos(a),s=Math.sin(a);return new Float32Array([1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1])}
function ry(a){var c=Math.cos(a),s=Math.sin(a);return new Float32Array([c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1])}
/* ---------- GL ---------- */
var gl=null;try{gl=cv.getContext('webgl',{antialias:true,alpha:true,powerPreference:'high-performance'})}catch(e){}
var W=0,H=0,dpr=1,P,N,pBuf,lBuf,lCount=0,pg,lg,loc={};
function sh(t,s){var o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);return o}
function prog(v,f){var p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,v));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,f));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw 0;return p}
function initGL(){
 pg=prog('attribute vec3 a;attribute float k;uniform mat4 P,V;uniform float z,px,w;varying float c,f;void main(){float L=60.;float zz=mod(a.z*L+z,L)-L;vec4 v=V*vec4(a.x,a.y,zz,1.);gl_Position=P*v;float d=-v.z;f=smoothstep(L,L*.5,d)*smoothstep(.3,2.,d);c=k;gl_PointSize=clamp(px/max(d,.6)*(1.+w*1.6),1.,22.);}',
 'precision mediump float;varying float c,f;void main(){vec2 q=gl_PointCoord-.5;float r=length(q);if(r>.5)discard;vec3 A=vec3(.78,1.,.3),B=vec3(.21,.94,1.),C=vec3(.55,.36,1.);vec3 col=c<.4?A:(c<.75?B:C);gl_FragColor=vec4(col,(1.-r*2.)*f);}');
 lg=prog('attribute vec3 p;attribute vec3 c;uniform mat4 M;varying vec3 v;void main(){v=c;gl_Position=M*vec4(p,1.);}','precision mediump float;varying vec3 v;uniform float a;void main(){gl_FragColor=vec4(v,a);}');
 N=Math.round(Math.min(2400,Math.max(700,innerWidth*innerHeight/1100)));
 var d=new Float32Array(N*4);for(var i=0;i<N;i++){var an=Math.random()*6.2832,r=1.8+Math.pow(Math.random(),1.6)*12;d[i*4]=Math.cos(an)*r;d[i*4+1]=Math.sin(an)*r*.7;d[i*4+2]=Math.random();d[i*4+3]=Math.random()}
 pBuf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,pBuf);gl.bufferData(gl.ARRAY_BUFFER,d,gl.STATIC_DRAW);
 /* wireframe chart */
 var L=[],cy=[.21,.94,1],li=[.78,1,.3],gr=[.18,.28,.45],mx=Math.max.apply(null,counts),n=counts.length;
 function ln(a,b,c){L.push(a[0],a[1],a[2],c[0],c[1],c[2],b[0],b[1],b[2],c[0],c[1],c[2])}
 for(var g=-5;g<=5;g++){ln([g,0,-3],[g,0,3],gr);ln([-5,0,g*.6],[5,0,g*.6],gr)}
 var prev=null;counts.forEach(function(ct,i){var x=(i-(n-1)/2)*1.2,h=ct?.5+ct*.6:.12,w=.3,col=(ct===mx&&mx>0)?li:cy;
  var b=[[x-w,0,-w],[x+w,0,-w],[x+w,0,w],[x-w,0,w]],t=b.map(function(p){return[p[0],h,p[2]]});
  for(var e=0;e<4;e++){ln(b[e],b[(e+1)%4],col);ln(t[e],t[(e+1)%4],col);ln(b[e],t[e],col)}
  var tp=[x,h,0];if(prev)ln(prev,tp,li);prev=tp});
 lBuf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,lBuf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(L),gl.STATIC_DRAW);lCount=L.length/6;
 gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.clearColor(0,0,0,0);
}
function size(){dpr=Math.min(window.devicePixelRatio||1,innerWidth<820?1.75:2);W=innerWidth;H=innerHeight;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);if(gl){gl.viewport(0,0,cv.width,cv.height)}}
var okGL=false;if(gl){try{initGL();okGL=true}catch(e){okGL=false}}
size();addEventListener('resize',size);addEventListener('orientationchange',function(){setTimeout(size,250)});
var px=0,py=0,tx=0,ty=0;
function pm(e){var t=e.touches?e.touches[0]:e;tx=t.clientX/W*2-1;ty=t.clientY/H*2-1}
addEventListener('pointermove',pm,{passive:true});addEventListener('touchmove',pm,{passive:true});
/* ---------- loop ---------- */
var t0=performance.now(),last=t0,zc=0,warp=0,warpT=0,prog_=0,enterAt=0,msgs=[[0,'Preparing visual system'],[25,I18N.t('intro25',{n:nSig})],[50,I18N.t('intro50')],[75,I18N.t('intro75')],[100,I18N.t('intro100')]];
function frame(now){if(done)return;requestAnimationFrame(frame);var dt=Math.min(.05,(now-last)/1000);last=now;var T=(now-t0)/1000;
 /* progress: eased time, capped at 92 until page fully loaded */
 var tgt=Math.min(100,T/2.8*100);if(!loaded)tgt=Math.min(tgt,92);prog_+=(tgt-prog_)*Math.min(1,dt*6);
 var p=Math.min(100,Math.round(prog_));if(prog_>99.4)p=100;pct.textContent=p;bar.style.transform='scaleX('+p/100+')';
 for(var i=msgs.length-1;i>=0;i--)if(p>=msgs[i][0]){if(msg.textContent!==msgs[i][1])msg.textContent=msgs[i][1];break}
 if(p>=100&&!ready){ready=true;ov.classList.add('ready');btn.hidden=false;try{btn.focus({preventScroll:true})}catch(e){}}
 px+=(tx-px)*.06;py+=(ty-py)*.06;warp+=(warpT-warp)*Math.min(1,dt*(entered?3.2:2));
 if(!okGL)return;
 zc+=(3+warp*60)*dt;
 var a=W/H,fov=(50+warp*35)*Math.PI/180,Pm=persp(fov,a,.1,120),dist=Math.max(7.5,9.8/a),k=entered?Math.min(1,(now-enterAt)/1100):0,ease=k*k*(3-2*k);
 gl.clear(gl.COLOR_BUFFER_BIT);
 gl.useProgram(pg);var V=mul(rx(py*.1),ry(px*.1)),ap=gl.getAttribLocation(pg,'a'),ak=gl.getAttribLocation(pg,'k');
 gl.bindBuffer(gl.ARRAY_BUFFER,pBuf);gl.enableVertexAttribArray(ap);gl.vertexAttribPointer(ap,3,gl.FLOAT,false,16,0);gl.enableVertexAttribArray(ak);gl.vertexAttribPointer(ak,1,gl.FLOAT,false,16,12);
 gl.uniformMatrix4fv(gl.getUniformLocation(pg,'P'),false,Pm);gl.uniformMatrix4fv(gl.getUniformLocation(pg,'V'),false,V);
 gl.uniform1f(gl.getUniformLocation(pg,'z'),zc);gl.uniform1f(gl.getUniformLocation(pg,'px'),cv.height*.032);gl.uniform1f(gl.getUniformLocation(pg,'w'),warp);
 gl.drawArrays(gl.POINTS,0,N);
 gl.disableVertexAttribArray(ak);
 gl.useProgram(lg);var al=gl.getAttribLocation(lg,'p'),ac=gl.getAttribLocation(lg,'c');
 var M=mul(Pm,mul(tr(0,-1.5+ease*1.5,-dist*(1-ease*.85)),mul(rx(-.4+py*.25),ry(T*.32+px*.9+ease*3))));
 gl.bindBuffer(gl.ARRAY_BUFFER,lBuf);gl.enableVertexAttribArray(al);gl.vertexAttribPointer(al,3,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(ac);gl.vertexAttribPointer(ac,3,gl.FLOAT,false,24,12);
 gl.uniformMatrix4fv(gl.getUniformLocation(lg,'M'),false,M);gl.uniform1f(gl.getUniformLocation(lg,'a'),Math.min(1,T/1.2)*(1-ease*.6)*.95);
 gl.drawArrays(gl.LINES,0,lCount);gl.disableVertexAttribArray(ac);
}
requestAnimationFrame(frame);
/* ---------- exit ---------- */
function finish(){if(done)return;done=true;ov.classList.add('gone');root.classList.remove('intro-lock');root.classList.add('dashboard-entered');try{var e=gl&&gl.getExtension('WEBGL_lose_context');if(e)e.loseContext()}catch(x){}
 try{dispatchEvent(new Event('raptor:intro-done'))}catch(x){}setTimeout(function(){ov.remove()},900);}
function enter(){if(entered||!ready)return;entered=true;enterAt=performance.now();warpT=1;ov.classList.add('leaving');setTimeout(finish,1500)}
btn.addEventListener('click',function(e){e.stopPropagation();enter()});
ov.addEventListener('click',function(e){if(ready&&!e.target.closest('.in-skip'))enter()});
q('.in-skip').addEventListener('click',function(e){e.stopPropagation();entered=true;ov.classList.add('leaving');setTimeout(finish,350)});
addEventListener('keydown',function(e){if(done)return;if(e.key==='Enter'||e.key===' '){e.preventDefault();enter()}else if(e.key==='Escape'){finish()}});
/* safety: never trap the user */
setTimeout(function(){if(!done&&!ready){ready=true;prog_=100;ov.classList.add('ready');btn.hidden=false}},9000);
})();
