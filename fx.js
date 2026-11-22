/* Raptor v8 FX layer: WebGL aurora shader, custom cursor, magnetic buttons, text scramble, split-text, spotlight, bursts. Decorative only — never alters data. */
(function(){'use strict';
var root=document.documentElement,RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
var off=function(){return RM||root.classList.contains('motion-off')};
function ready(f){document.readyState!=='loading'?f():addEventListener('DOMContentLoaded',f)}
ready(function(){
 try{shader()}catch(e){}
 try{progress()}catch(e){} try{spot()}catch(e){} 
 try{magnet()}catch(e){}  (function(){var go=function(){try{split()}catch(e){}};root.classList.contains('intro-lock')?addEventListener('raptor:intro-done',go,{once:true}):go()})(); try{click()}catch(e){} try{scrollFx()}catch(e){}
});
/* 1. WebGL fragment shader (fbm aurora, mouse reactive). Ref: MDN WebGL API */
function shader(){
 if(RM)return;var c=document.createElement('canvas');c.id='fx-bg';document.body.prepend(c);
 var gl=c.getContext('webgl',{alpha:true,antialias:false,powerPreference:'low-power'});if(!gl){c.remove();return}
 var vs='attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
 var fs='precision mediump float;uniform vec2 r,m;uniform float t;'+
 'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}'+
 'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}'+
 'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p*=2.02;a*=.5;}return v;}'+
 'void main(){vec2 uv=gl_FragCoord.xy/r;vec2 q=uv*vec2(r.x/r.y,1.)*2.2;float T=t*.08;'+
 'vec2 w=vec2(fbm(q+T+m*.6),fbm(q-T+3.1));float f=fbm(q+2.2*w+vec2(0.,T));'+
 'vec3 a=vec3(.78,1.,.30),b=vec3(.21,.94,1.),c=vec3(.55,.36,1.),d=vec3(1.,.24,.94);'+
 'vec3 col=mix(c,b,smoothstep(.2,.7,f));col=mix(col,a,smoothstep(.55,.95,w.x));col=mix(col,d,smoothstep(.7,1.,w.y)*.5);'+
 'float ln=smoothstep(.02,0.,abs(fract(uv.x*28.+T*3.)-.5)-.49)*0.0;'+
 'float d2=distance(uv,m);float glow=.18/(d2*6.+.4);'+
 'float inten=smoothstep(.35,.9,f)*.42+glow*.25;'+
 'float vig=smoothstep(1.1,.2,length(uv-.5));'+
 'gl_FragColor=vec4(col*inten*vig*.55+vec3(.01,.02,.05)*(1.-vig),1.);}';
 function sh(t,s){var o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);return o}
 var pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,vs));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(pr);
 if(!gl.getProgramParameter(pr,gl.LINK_STATUS)){c.remove();return}
 gl.useProgram(pr);var b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
 var l=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,2,gl.FLOAT,false,0,0);
 var uR=gl.getUniformLocation(pr,'r'),uM=gl.getUniformLocation(pr,'m'),uT=gl.getUniformLocation(pr,'t');
 var mx=.5,my=.5,sx=.5,sy=.5,S=.5;
 function rs(){c.width=Math.max(2,innerWidth*S|0);c.height=Math.max(2,innerHeight*S|0);gl.viewport(0,0,c.width,c.height)}
 rs();addEventListener('resize',rs);
 addEventListener('pointermove',function(e){mx=e.clientX/innerWidth;my=1-e.clientY/innerHeight},{passive:true});
 var t0=performance.now(),raf;
 (function loop(now){raf=requestAnimationFrame(loop);if(document.hidden||off())return;
  sx+=(mx-sx)*.05;sy+=(my-sy)*.05;gl.uniform2f(uR,c.width,c.height);gl.uniform2f(uM,sx,sy);gl.uniform1f(uT,(now-t0)/1000);gl.drawArrays(gl.TRIANGLES,0,3)})(t0);
}
/* 2. scroll progress */
function progress(){var p=document.createElement('div');p.id='fx-progress';document.body.appendChild(p);
 function u(){var h=root.scrollHeight-innerHeight;p.style.transform='scaleX('+(h>0?scrollY/h:0)+')'}addEventListener('scroll',u,{passive:true});u()}
/* 3. spotlight vars on cards */
function spot(){document.addEventListener('pointermove',function(e){var c=e.target.closest&&e.target.closest('.card');if(!c)return;
 var r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px')},{passive:true})}
/* 4. custom cursor */
function cursor(){if(RM||!matchMedia('(pointer:fine)').matches||innerWidth<=820)return;
 var d=document.createElement('div'),r=document.createElement('div');d.id='fx-dot';r.id='fx-ring';document.body.append(d,r);root.classList.add('fx-on');
 var x=0,y=0,rx=0,ry=0;addEventListener('pointermove',function(e){x=e.clientX;y=e.clientY;d.style.transform='translate('+x+'px,'+y+'px)'},{passive:true});
 (function l(){requestAnimationFrame(l);rx+=(x-rx)*.16;ry+=(y-ry)*.16;r.style.transform='translate('+rx+'px,'+ry+'px)'})();
 document.addEventListener('pointerover',function(e){r.classList.toggle('hot',!!(e.target.closest&&e.target.closest('a,button,tr[data-sid],input,th,.filter-btn')))})}
/* 5. magnetic buttons */
function magnet(){document.querySelectorAll('.primary-btn,.secondary-btn,.motion-toggle,.rail-link').forEach(function(b){
 b.addEventListener('pointermove',function(e){if(off())return;var r=b.getBoundingClientRect();b.style.transform='translate('+((e.clientX-r.left-r.width/2)*.25)+'px,'+((e.clientY-r.top-r.height/2)*.35)+'px)'});
 b.addEventListener('pointerleave',function(){b.style.transform=''})})}
/* 6. text scramble on headings, once when visible */
function scramble(){var G='!<>-_\\/[]{}—=+*^?#01',els=document.querySelectorAll('.section-kicker,.eyebrow,.radar-header span:first-child,.hero-meta-block span');
 if(!('IntersectionObserver' in window)||RM)return;
 var io=new IntersectionObserver(function(es){es.forEach(function(en){if(!en.isIntersecting)return;io.unobserve(en.target);run(en.target)})},{threshold:.5});
 els.forEach(function(e){io.observe(e)});
 function run(el){var nodes=[],w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);while(w.nextNode())if(w.currentNode.nodeValue.trim())nodes.push([w.currentNode,w.currentNode.nodeValue]);
  var f=0,N=22;var iv=setInterval(function(){f++;nodes.forEach(function(n){var s=n[1],o='';for(var i=0;i<s.length;i++)o+=(s[i]===' '||i<s.length*f/N)?s[i]:G[Math.random()*G.length|0];n[0].nodeValue=o});if(f>=N){clearInterval(iv);nodes.forEach(function(n){n[0].nodeValue=n[1]})}},34)}}
/* 7. split-text hero reveal (GSAP) */
function split(){
 var el=document.querySelector('.mission-hero h1 .raptor');
 if(!el||off()||!window.gsap)return;
 // Keep the clipped gradient as one layer. Splitting into glyph spans hides the gradient in Chromium.
 gsap.fromTo(el,{y:30,opacity:0,filter:'blur(8px)'},
  {y:0,opacity:1,filter:'blur(0px)',duration:1.1,ease:'power3.out',clearProps:'transform,opacity,filter'});
}
/* 8. click ripple + particle burst */
function click(){document.addEventListener('pointerdown',function(e){if(off())return;
 var b=e.target.closest&&e.target.closest('.primary-btn,.secondary-btn');if(b){var r=b.getBoundingClientRect(),s=Math.max(r.width,r.height),p=document.createElement('span');p.className='fx-ripple';p.style.cssText='width:'+s+'px;height:'+s+'px;left:'+(e.clientX-r.left-s/2)+'px;top:'+(e.clientY-r.top-s/2)+'px';b.appendChild(p);setTimeout(function(){p.remove()},650)}
 return;var C=['#c6ff4d','#35f0ff','#8b5cff','#ff3df0'];
 for(var i=0;i<14;i++){var d=document.createElement('i');d.className='fx-burst';d.style.setProperty('--c',C[i%4]);d.style.left=e.clientX+'px';d.style.top=e.clientY+'px';document.body.appendChild(d);
  var a=Math.PI*2*i/14,k=40+Math.random()*60;gsap.to(d,{x:Math.cos(a)*k,y:Math.sin(a)*k,opacity:0,scale:.2,duration:.7+Math.random()*.3,ease:'power3.out',onComplete:function(){this.targets()[0].remove()}})}})}
/* 9. scroll-driven parallax & stagger (GSAP ScrollTrigger) */
function scrollFx(){if(RM||!window.gsap||!window.ScrollTrigger)return;gsap.registerPlugin(ScrollTrigger);
 gsap.to('.hero-visual',{yPercent:-12,ease:'none',scrollTrigger:{trigger:'.mission-hero',start:'top top',end:'bottom top',scrub:.6}});
 gsap.to('.hero-copy',{yPercent:8,opacity:.5,ease:'none',scrollTrigger:{trigger:'.mission-hero',start:'top top',end:'bottom top',scrub:.6}});
 gsap.from('tbody#signal-rows tr',{opacity:0,x:-40,filter:'blur(6px)',duration:.7,ease:'power3.out',stagger:.06,scrollTrigger:{trigger:'#signals',start:'top 70%',once:true}});
 gsap.from('.kpi',{opacity:0,y:50,scale:.92,duration:.8,ease:'back.out(1.6)',stagger:.1,scrollTrigger:{trigger:'#metrics',start:'top 85%',once:true}})}
})();
