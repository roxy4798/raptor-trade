/**
 * RAPTOR SIGNAL OBSERVATORY / THREE.JS ENGINE v10
 * Official THREE 0.180.0 ESM, no external addon dependencies.
 * All bars are generated from the provided historical 4H-close counts.
 * Controls: pointer drag to orbit, click a 3D bar, keyboard-accessible timeline.
 * Dynamic import is intentional: offline/static fallback remains fully usable.
 * No realtime market data, scanner, trading logic, WebSocket or order execution.
 */
const root=document.documentElement;
const reduceQuery=matchMedia('(prefers-reduced-motion: reduce)');
const isPaused=()=>reduceQuery.matches||root.classList.contains('motion-off');
const data=window.RAPTOR_DATA?.series?.signals_per_close||[];
const mountHero=document.querySelector('#radar-three');
const mountObs=document.querySelector('#obs-canvas');
const wrapper=document.querySelector('#observatory');
let booted=false,booting=false;
async function bootThree(){
  if(!mountHero||!mountObs||!data.length||isPaused()||booted||booting)return;
  booting=true;
  try{
    const THREE=await import('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js');
    if(isPaused())return;
    initialize(THREE);booted=true;
  }catch(error){console.info('Raptor Three.js unavailable; native radar and historical CSS chart retained.',error?.message||error);}
  finally{booting=false;}
}
bootThree();
reduceQuery.addEventListener?.('change',bootThree);
document.querySelector('#motion-toggle')?.addEventListener('click',()=>requestAnimationFrame(bootThree));
function initialize(THREE){
  const C={lime:0xbfff19,cyan:0x08eaff,violet:0x347981,blue:0x153e4a,white:0xeafff3};
  const desktop=innerWidth>760;
  const color=(hex)=>new THREE.Color(hex);
  const rnd=(()=>{let n=112233;return()=>((n=(1664525*n+1013904223)>>>0)/4294967296)})();
  const lerp=(x,y,k)=>x+(y-x)*k;
  const disposable=[];
  const wire=(geometry,hex=C.cyan,opacity=.36)=>new THREE.LineSegments(new THREE.EdgesGeometry(geometry),new THREE.LineBasicMaterial({color:hex,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending}));
  const line=(pts,hex=C.cyan,opacity=.32)=>{
    const g=new THREE.BufferGeometry().setFromPoints(pts);
    return new THREE.Line(g,new THREE.LineBasicMaterial({color:hex,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending}));
  };
  const torus=(radius,tube,hex,alpha=.75)=>new THREE.Mesh(new THREE.TorusGeometry(radius,tube,6,160),new THREE.MeshBasicMaterial({color:hex,transparent:true,opacity:alpha,depthWrite:false,blending:THREE.AdditiveBlending}));
  const material=(hex,glow=hex,op=1)=>new THREE.MeshStandardMaterial({color:hex,metalness:.55,roughness:.26,emissive:glow,emissiveIntensity:.23,transparent:op<1,opacity:op});
  function createStage(initialMount,kind){
    let mount=initialMount;
    let renderer;
    try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:desktop,powerPreference:'high-performance',preserveDrawingBuffer:false});}
    catch(e){console.info('Raptor renderer unavailable',e);return null;}
    const isHero=kind==='hero';
    renderer.setClearColor(0x050913,0);
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.45;
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,isHero?1.6:desktop?1.65:1.25));
    renderer.domElement.setAttribute('aria-hidden','true');
    mount.appendChild(renderer.domElement);
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(isHero?45:40,1,.1,120);
    camera.position.set(0,isHero?1:1.65,isHero?10.5:8.9);camera.lookAt(0,isHero?0:-.3,0);
    scene.add(new THREE.AmbientLight(C.white,1.08));
    const lamp=new THREE.PointLight(C.cyan,24,26);lamp.position.set(4,5,7);scene.add(lamp);
    const rim=new THREE.PointLight(C.violet,8,22);rim.position.set(-5,-2,-4);scene.add(rim);
    const limeLight=new THREE.PointLight(C.lime,13,15);limeLight.position.set(-2,0,5);scene.add(limeLight);
    const field=new THREE.Group();scene.add(field);
    const core=new THREE.Group();field.add(core);
    // Faceted core, fine geo wireframe, refractive internal shell and oscillating rings.
    const crystalGeo=new THREE.IcosahedronGeometry(isHero?.88:.25,1);
    const crystal=new THREE.Mesh(crystalGeo,material(0x0c2931,C.cyan,isHero?.2:.055));core.add(crystal);
    const crystalWire=wire(crystalGeo,C.cyan,isHero?.23:.07);core.add(crystalWire);
    const inner=new THREE.Mesh(new THREE.IcosahedronGeometry(isHero?.53:.12,0),new THREE.MeshBasicMaterial({color:C.lime,wireframe:true,transparent:true,opacity:isHero?.16:.01,depthWrite:false,blending:THREE.AdditiveBlending}));core.add(inner);
    const facets=new THREE.Mesh(new THREE.DodecahedronGeometry(isHero?.96:.22,0),new THREE.MeshBasicMaterial({color:C.violet,wireframe:true,transparent:true,opacity:isHero?.07:.015,depthWrite:false}));core.add(facets);
    const rings=[];
    (isHero?[1.92,2.31]:[]).forEach((r,i)=>{
      const ring=torus(r,i===1?.011:.018,[C.cyan,C.lime,C.violet][i],i===1?.58:.48);
      ring.rotation.set(.78+i*.46,.35+i*.5,.45+i*.3);
      core.add(ring);rings.push(ring);
      const orbit=new THREE.Mesh(new THREE.TorusGeometry(r,.036,5,60,Math.PI*.43),new THREE.MeshBasicMaterial({color:[C.lime,C.cyan,C.violet][i],transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending}));
      ring.add(orbit);
    });
    // Geodesic sweeps and orbital signal nodes.
    const nodes=[];
    for(let i=0;i<(isHero?5:3);i++){
      const g=new THREE.Group(),r=isHero?2.7+i*.15:3.2+i*.1;
      const p=new THREE.Mesh(new THREE.OctahedronGeometry(i%3===0?.12:.07,0),new THREE.MeshBasicMaterial({color:i%2?C.cyan:C.lime,transparent:true,opacity:.92,blending:THREE.AdditiveBlending}));
      g.add(p);field.add(g);nodes.push({group:g,r,a:rnd()*Math.PI*2,s:.08+rnd()*.28});
    }
    // Distribution of stable deterministic stars: no fake market metrics attached.
    const count=isHero?(desktop?100:60):(desktop?125:65),points=new Float32Array(count*3),cols=new Float32Array(count*3);
    for(let i=0;i<count;i++){
      const a=rnd()*Math.PI*2,ph=Math.acos(2*rnd()-1),r=(isHero?3.1:3.7)+rnd()*(isHero?2.1:3.1);
      points[i*3]=r*Math.sin(ph)*Math.cos(a);points[i*3+1]=r*Math.cos(ph)*.83;points[i*3+2]=r*Math.sin(ph)*Math.sin(a);
      const c=color(i%8===0?C.violet:i%3===0?C.lime:C.cyan);cols[i*3]=c.r;cols[i*3+1]=c.g;cols[i*3+2]=c.b;
    }
    const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(points,3));pg.setAttribute('color',new THREE.BufferAttribute(cols,3));
    const stars=new THREE.Points(pg,new THREE.PointsMaterial({size:isHero?.026:.031,transparent:true,opacity:.34,vertexColors:true,blending:THREE.AdditiveBlending,depthWrite:false,sizeAttenuation:true}));
    field.add(stars);
    // Graduated orbital dotted meridians: clean technical geometry, less visual clutter.
    for(let j=0;j<(isHero?3:0);j++){
      const pts=[];for(let i=0;i<60;i++){
        const a=i/59*Math.PI*2,r=3.04+j*.19;
        pts.push(new THREE.Vector3(Math.cos(a)*r,Math.sin(a)*r*.51,Math.sin(a*2+j)*.13));
      }
      const arc=line(pts,j%2?C.cyan:C.violet,.06);arc.rotation.set(j*.19,j*.38,j*.17);field.add(arc);
    }
    // Actual time series: eight column values, including truthful zero counts.
    const bars=[];
    if(!isHero){
      data.forEach((row,i)=>{
        const c=row.count===Math.max(...data.map(r=>r.count))?C.lime:C.cyan;
        const geo=new THREE.BoxGeometry(.54,1,.54);
        const mesh=new THREE.Mesh(geo,material(c,c,.9));
        mesh.userData={index:i,row};mesh.position.y=0;
        const edge=wire(geo,C.white,.6);mesh.add(edge);
        const plate=new THREE.Mesh(new THREE.BoxGeometry(.61,.055,.61),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.26,blending:THREE.AdditiveBlending,depthWrite:false}));field.add(plate);
        field.add(mesh);bars.push({mesh,edge,plate,index:i,height:.12+row.count*.66,target:new THREE.Vector3(),targetScale:new THREE.Vector3(1,.1,1)});
      });
      const floor=new THREE.GridHelper(12,20,C.blue,C.blue);
      floor.material.transparent=true;floor.material.opacity=.11;floor.position.y=-2.2;field.add(floor);
    }
    function layoutBars(mode){
      bars.forEach((b,i)=>{
        const theta=Math.PI*2*(i/bars.length)-Math.PI*.55;
        const orbitMode=mode==='orbit',coreMode=mode==='core';
        const x=orbitMode?Math.cos(theta)*3:coreMode?Math.cos(theta)*3.35:(i-3.5)*1.05;
        const z=orbitMode?Math.sin(theta)*1.25:coreMode?Math.sin(theta)*1.8:0;
        const ht=b.height*(coreMode?.9:1);
        b.target.set(x,-1.62+ht/2,z);
        b.targetScale.set(coreMode?.64:1,ht,coreMode?.64:1);
        b.plate.userData.target=new THREE.Vector3(x,-1.64,z);
      });
    }
    layoutBars('matrix');
    let observed=true,visible=false,mode='matrix',targetYaw=0,targetPitch=0,dragYaw=0,dragPitch=0,selected=-1,hover=-1;
    let box=mount.getBoundingClientRect(),w=0,h=0;
    function resize(){box=mount.getBoundingClientRect();const width=Math.max(2,Math.round(box.width)),height=Math.max(2,Math.round(box.height));if(width===w&&height===h)return;
      w=width;h=height;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);
    }
    const ro=typeof ResizeObserver!=='undefined'?new ResizeObserver(resize):null;ro?.observe(mount);resize();
    const observer=typeof IntersectionObserver!=='undefined'?new IntersectionObserver(es=>{visible=es[0]?.isIntersecting??false},{threshold:.01}):null;
    observer?.observe(mount);if(!observer)visible=true;
    let pointerStart=null,moved=false;
    if(!isHero){
      const viewport=document.querySelector('#obs-viewport');
      const ray=new THREE.Raycaster(),mouse=new THREE.Vector2(),tip=document.querySelector('#obs-tooltip');
      const hit=(event)=>{box=renderer.domElement.getBoundingClientRect();
        mouse.set((event.clientX-box.left)/box.width*2-1,-(event.clientY-box.top)/box.height*2+1);
        ray.setFromCamera(mouse,camera);return ray.intersectObjects(bars.map(b=>b.mesh),false)[0]?.object?.userData?.index??-1;
      };
      function showTip(i,ev){if(i<0){tip.hidden=true;return}const row=data[i];tip.hidden=false;
        const time=I18N.useWIB()?`${row.close_wib} WIB`:`${row.close_utc||new Date(row.close_ts*1000).toISOString().slice(0,16).replace('T',' ')} UTC`;
        tip.textContent=I18N.t('obsTooltip',{idx:i+1,len:data.length,time:time,count:row.count});
        const r=viewport.getBoundingClientRect();tip.style.left=Math.min(Math.max(8,ev.clientX-r.left+14),Math.max(8,r.width-220))+'px';
        tip.style.top=Math.min(Math.max(8,ev.clientY-r.top-54),r.height-76)+'px';
      }
      viewport.addEventListener('pointerdown',ev=>{if(ev.target.closest('button')||isPaused())return;
        pointerStart={x:ev.clientX,y:ev.clientY,yaw:targetYaw,pitch:targetPitch};moved=false;
        if(ev.pointerType==='mouse')viewport.setPointerCapture(ev.pointerId);
        viewport.classList.add('dragging');
      });
      viewport.addEventListener('pointermove',ev=>{
        if(pointerStart){const dx=ev.clientX-pointerStart.x,dy=ev.clientY-pointerStart.y;
          if(Math.abs(dx)+Math.abs(dy)>5)moved=true;
          if(moved){targetYaw=pointerStart.yaw+dx*.0065;targetPitch=THREE.MathUtils.clamp(pointerStart.pitch+dy*.0045,-.8,.8);tip.hidden=true;}
        }else if(ev.pointerType==='mouse'){hover=hit(ev);showTip(hover,ev);}
      },{passive:true});
      const finish=ev=>{if(!pointerStart)return;if(!moved){const index=hit(ev);if(index>=0)wrapper.dispatchEvent(new CustomEvent('raptor:obs-choose',{detail:{index}}));}
        pointerStart=null;viewport.classList.remove('dragging');};
      viewport.addEventListener('pointerup',finish);viewport.addEventListener('pointercancel',()=>{pointerStart=null;viewport.classList.remove('dragging');});
      viewport.addEventListener('pointerleave',()=>{hover=-1;tip.hidden=true;if(pointerStart){pointerStart=null;viewport.classList.remove('dragging');}});
      wrapper.addEventListener('raptor:obs-select',e=>{selected=e.detail.index;targetYaw=-(selected/data.length)*Math.PI*.48;});
      wrapper.addEventListener('raptor:obs-mode',e=>{mode=e.detail.mode;layoutBars(mode);});
      wrapper.addEventListener('raptor:obs-reset',()=>{targetYaw=0;targetPitch=0;dragYaw=0;dragPitch=0;selected=-1;mode='matrix';layoutBars(mode);
        wrapper.querySelectorAll('[data-obs-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.obsMode===mode)));});
    }
    const clock=new THREE.Clock();let frameNumber=0,lastDraw=0;
    // Single loop per canvas; rendering auto-stops when tab hidden, out of view or Motion OFF.
    function tick(now){
      if(!renderer.domElement.isConnected){renderer.setAnimationLoop(null);dispose();return;}
      if(isPaused()||document.hidden||!visible)return;
      if(now-lastDraw<(isHero?1000/38:1000/(desktop?45:30)))return;
      const dt=Math.min(.05,(now-lastDraw)/1000||.016);lastDraw=now;const t=clock.getElapsedTime();frameNumber++;
      field.rotation.y+=(kind==='hero'?.085:.035)*dt;
      core.rotation.y+=.17*dt;core.rotation.x=Math.sin(t*.2)*.12;
      core.position.y=Math.sin(t*.62)*.12;
      crystal.rotation.y+=dt*.12;inner.rotation.x+=dt*.17;inner.rotation.y-=dt*.22;
      facets.rotation.y-=dt*.11;
      rings.forEach((r,i)=>{r.rotation.z+=dt*(i%2?-.14:.12);r.rotation.x+=dt*.022;});
      nodes.forEach((n,i)=>{const a=t*n.s+n.a;n.group.position.set(Math.sin(a)*n.r,Math.sin(a*1.23+i)*.72,Math.cos(a)*n.r*.75);});
      stars.rotation.y-=dt*.006;
      if(!isHero){
        dragYaw=lerp(dragYaw,targetYaw,.075);dragPitch=lerp(dragPitch,targetPitch,.075);
        field.rotation.y=dragYaw+Math.sin(t*.13)*.015;
        field.rotation.x=dragPitch;
        core.scale.setScalar(lerp(core.scale.x,mode==='core'?1.1:mode==='matrix'?.6:1,.04));
        bars.forEach(b=>{
          b.mesh.position.lerp(b.target,.07);b.mesh.scale.lerp(b.targetScale,.075);b.plate.position.lerp(b.plate.userData.target,.07);
          const sel=b.index===selected||b.index===hover;
          b.mesh.material.emissiveIntensity=lerp(b.mesh.material.emissiveIntensity,sel?1.4:.45,.11);
          b.edge.material.opacity=lerp(b.edge.material.opacity,sel?.95:.5,.13);
          b.mesh.rotation.y+=sel?dt*.6:dt*.025;
        });
      }
      if(isHero){field.rotation.y=Math.sin(t*.14)*.23;field.rotation.x=Math.cos(t*.24)*.11;}
      renderer.render(scene,camera);
    }
    renderer.setAnimationLoop(tick);
    const onContextLost=e=>{e.preventDefault();renderer.setAnimationLoop(null);if(isHero)document.querySelector('.radar-stage')?.classList.remove('three-ready');else wrapper?.classList.remove('three-ready');};
    renderer.domElement.addEventListener('webglcontextlost',onContextLost,false);
    function dispose(){observer?.disconnect();ro?.disconnect();
      scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});
      renderer.dispose();renderer.domElement.remove();
    }
    function transfer(nextMount){
      if(!nextMount||!renderer.domElement.isConnected)return false;
      ro?.unobserve(mount);observer?.unobserve(mount);
      mount=nextMount;nextMount.appendChild(renderer.domElement);
      ro?.observe(mount);observer?.observe(mount);
      w=0;h=0;resize();visible=true;
      return true;
    }
    return{dispose,resize,transfer,setActive:n=>observed=n};
  }
  // Optional cinematic Three.js overlay on the native shader intro.
  // Static and WebGL-only fallbacks remain functional if the CDN cannot load.
  let introStage=null;
  const intro=document.querySelector('#intro:not(.gone)');
  function startDashboard(){
    // The mobile dashboard uses a lightweight animated CSS radar. Never create
    // a hidden extra hero WebGL canvas on phones; retain 3D Observatory where
    // supported and keep the full hero 3D experience on larger screens.
    const compactHero=matchMedia('(max-width:650px)').matches;
    let hero=null;
    if(compactHero){
      introStage?.dispose();
    }else{
      hero=introStage&&introStage.transfer(mountHero)?introStage:createStage(mountHero,'hero');
    }
    introStage=null;
    if(hero)document.querySelector('.radar-stage')?.classList.add('three-ready');
    const obs=createStage(mountObs,'observatory');
    if(obs){wrapper.classList.add('three-ready');document.querySelector('#obs-status').textContent='3D MODEL READY · SNAPSHOT DATA';const hint=wrapper.querySelector('.obs-overlay span');if(hint)hint.textContent='⊕ DRAG TO ORBIT · SELECT A CANDLE';}
    addEventListener('pagehide',()=>{hero?.dispose();obs?.dispose();},{once:true});
  }
  if(intro){
    const layer=document.createElement('div');layer.className='in-3d-layer';layer.setAttribute('aria-hidden','true');
    intro.insertBefore(layer,intro.querySelector('.in-vig'));
    introStage=createStage(layer,'hero');
    if(introStage)intro.classList.add('three-intro-active');
    addEventListener('raptor:intro-done',()=>{
      startDashboard();layer.remove();
    },{once:true});
    addEventListener('pagehide',()=>introStage?.dispose(),{once:true});
  }else startDashboard();
}
