/* Raptor Trade — motion layer (decorative only; never reads or changes data).
   Libraries (vendored in /vendor, no CDN needed at runtime):
   - GSAP + ScrollTrigger  : timeline choreography, scroll-triggered reveals, SVG line draw
   - CountUp.js            : KPI number ticker (final text is restored verbatim)
   - vanilla-tilt.js       : 3D tilt + glare on KPI cards
   - tsParticles (slim)    : subtle network-particle backdrop
   Everything degrades gracefully: if a library is missing the page simply
   shows the CSS-only effects; if the user prefers reduced motion, nothing runs. */
(function(){
"use strict";
var d = document, root = d.documentElement;
var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
var fine = window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches;
var wide = window.innerWidth > 760;
if(reduce || root.classList.contains("motion-off") || !window.gsap) return;

var gsap = window.gsap;
if(window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
var ST = window.ScrollTrigger || null;
root.classList.add("gx");
var $  = function(s, c){ return (c||d).querySelector(s); };
var $$ = function(s, c){ return [].slice.call((c||d).querySelectorAll(s)); };
var ease = "power3.out";

/* Use the actual geometric SVG length in pixels. A unit dash-array
   is NOT interpreted as full path length by modern Chromium and caused
   the entire performance curve to vanish in the previous build. */
$$("svg polyline").forEach(function(p){
  var len = 0;
  try { len = p.getTotalLength(); } catch(e) {}
  if(len > 0){
    p.setAttribute("pathLength", "1");
    p.dataset.lineLength = String(len);
    p.style.strokeDasharray = len + "px";
  }
});

/* ---------- 1. intro timeline ---------- */
var tl = gsap.timeline({defaults:{ease:ease}});
tl.from(".topline", {yPercent:-100, opacity:0, duration:.7})
  .from("header .brand > *", {y:24, opacity:0, duration:.8, stagger:.1}, "-=.4")
  .from("header .tagline", {y:16, opacity:0, duration:.7}, "-=.55")
  .from("header .pill", {y:14, opacity:0, scale:.94, duration:.6, stagger:.08}, "-=.5")
  .from(".kpi", {y:46, opacity:0, scale:.94, duration:.9, stagger:.09, ease:"back.out(1.5)",
          clearProps:"transform,opacity"}, "-=.35");

/* ---------- 2. KPI number ticker (CountUp.js) ---------- */
var CU = window.countUp && window.countUp.CountUp;
if(CU){
  $$(".kpi-value").forEach(function(el, i){
    var orig = el.textContent, m = orig.match(/(\d[\d,]*\.?\d*)/);
    if(!m) return;
    var raw = m[1], val = parseFloat(raw.replace(/,/g,""));
    var cu = new CU(el, val, {
      startVal:0, decimalPlaces:(raw.split(".")[1]||"").length, duration:1.8,
      useGrouping: raw.indexOf(",")>-1, separator:",",
      prefix: orig.slice(0, m.index), suffix: orig.slice(m.index + raw.length)
    });
    gsap.delayedCall(.9 + i*.1, function(){
      cu.start(function(){ el.textContent = orig; });
    });
  });
}

/* ---------- 3. KPI sparklines ---------- */
$$(".kpi .spark").forEach(function(svg, i){
  var rects = $$("rect", svg), line = $("polyline", svg), area = $("polygon", svg), dot = $("circle", svg);
  var t = gsap.timeline({delay:1.1 + i*.1, defaults:{ease:ease}});
  if(rects.length) t.from(rects, {scaleY:0, transformOrigin:"50% 100%", duration:.7, stagger:.06});
  if(line) t.fromTo(line, {strokeDashoffset:Number(line.dataset.lineLength||1)}, {strokeDashoffset:0, duration:1.1, ease:"power2.inOut"}, 0);
  if(area) t.from(area, {opacity:0, duration:.8}, .5);
  if(dot)  t.from(dot, {scale:0, transformOrigin:"50% 50%", duration:.5, ease:"back.out(3)"}, 1);
});

/* ---------- 4. scroll-triggered section reveals ---------- */
function reveal(el){
  var go = function(){ gsap.from(el, {y:48, opacity:0, scale:.985, duration:.95, ease:ease, clearProps:"transform,opacity"}); };
  if(ST) ST.create({trigger:el, start:"top 90%", once:true, onEnter:go}); else go();
}
$$("section.card:not(:first-of-type), .two-col > .card, footer").forEach(reveal);

/* performance section: bars + equity curve choreography */
(function(){
  var sec = $(".perf-grid"); if(!sec) return;
  var run = function(){
    var t = gsap.timeline({defaults:{ease:ease}});
    t.from(sec.closest("section"), {y:40, opacity:0, duration:.8, clearProps:"transform,opacity"})
     .from(".bar-row", {x:-24, opacity:0, duration:.6, stagger:.1}, "-=.4")
     .from(".bar-fill", {scaleX:0, transformOrigin:"0% 50%", duration:1.2, stagger:.1, ease:"power4.out"}, "<.1")
     .from(".chip", {y:10, opacity:0, scale:.9, duration:.5, stagger:.08}, "-=.7");
    var eq = $(".equity");
    if(eq){
      var line = $("polyline[stroke]", eq), area = $("polygon", eq);
      var dots = $$("circle", eq), txt = $$("text", eq);
      t.from($$("line", eq), {opacity:0, duration:.6, stagger:.05}, 0.2)
       .from(txt, {opacity:0, y:6, duration:.6, stagger:.03}, 0.5);
      if(line) t.fromTo(line, {strokeDashoffset:Number(line.dataset.lineLength||1)}, {strokeDashoffset:0, duration:2, ease:"power2.inOut"}, .5);
      if(area) t.from(area, {opacity:0, duration:1.2}, 1.2);
      if(dots.length) t.from(dots, {scale:0, opacity:0, transformOrigin:"50% 50%", duration:.6,
        stagger:{each:.4}, ease:"elastic.out(1,.5)"}, .55);
    }
  };
  if(ST) ST.create({trigger:sec, start:"top 92%", once:true, onEnter:run}); else run();
})();

/* ---------- 5. table: stagger rows on first view and after every re-sort ---------- */
var tbody = $("#signal-rows");
function rowsIn(){
  var rows = $$("tr", tbody);
  gsap.fromTo(rows, {opacity:0, x:-22, filter:"blur(4px)"},
    {opacity:1, x:0, filter:"blur(0px)", duration:.6, stagger:.045, ease:ease, clearProps:"filter,transform,opacity"});
}
if(tbody){
  gsap.set($$("tr", tbody), {opacity:0});
  if(ST) ST.create({trigger:tbody, start:"top 92%", once:true, onEnter:rowsIn}); else rowsIn();
  var firstDone = false;
  new MutationObserver(function(){ if(firstDone) rowsIn(); }).observe(tbody, {childList:true});
  setTimeout(function(){ firstDone = true; }, 1500);
}

/* ---------- 6. scroll progress bar ---------- */
var bar = d.createElement("div");
bar.className = "scroll-progress"; bar.setAttribute("aria-hidden","true");
d.body.appendChild(bar);
if(ST){
  gsap.fromTo(bar, {scaleX:0}, {scaleX:1, ease:"none", transformOrigin:"0% 50%",
    scrollTrigger:{trigger:d.body, start:"top top", end:"bottom bottom", scrub:.3}});
}

/* ---------- 7. pointer-driven effects (desktop only) ---------- */
if(fine){
  /* card / row / metric spotlight */
  d.addEventListener("pointermove", function(e){
    var c = e.target.closest && e.target.closest(".card, tbody tr, .metric");
    if(!c) return;
    var r = c.getBoundingClientRect();
    c.style.setProperty("--mx", (e.clientX - r.left) + "px");
    c.style.setProperty("--my", (e.clientY - r.top) + "px");
  }, {passive:true});

  /* cursor glow with GSAP quickTo (smooth follow) */
  var glow = d.createElement("div");
  glow.className = "cursor-glow"; glow.setAttribute("aria-hidden","true");
  d.body.appendChild(glow);
  gsap.set(glow, {xPercent:-50, yPercent:-50});
  var qx = gsap.quickTo(glow, "x", {duration:.7, ease:"power3"}),
      qy = gsap.quickTo(glow, "y", {duration:.7, ease:"power3"});
  d.addEventListener("pointermove", function(e){ qx(e.clientX); qy(e.clientY); glow.classList.add("on"); }, {passive:true});
  d.documentElement.addEventListener("pointerleave", function(){ glow.classList.remove("on"); });

  /* 3D tilt + glare on KPI cards (vanilla-tilt) — started only after the intro
     so GSAP and the tilt never fight over the same transform */
  if(window.VanillaTilt){
    tl.eventCallback("onComplete", function(){
      window.VanillaTilt.init($$(".kpi"), {
        max:9, speed:500, perspective:900, scale:1.025,
        glare:true, "max-glare":.16
      });
    });
  }

  /* magnetic pull on header pills */
  $$("header .pill").forEach(function(p){
    var mx = gsap.quickTo(p, "x", {duration:.5, ease:"power3"}), my = gsap.quickTo(p, "y", {duration:.5, ease:"power3"});
    p.addEventListener("pointermove", function(e){
      var r = p.getBoundingClientRect();
      mx((e.clientX - (r.left + r.width/2)) * .12); my((e.clientY - (r.top + r.height/2)) * .25);
    });
    p.addEventListener("pointerleave", function(){ mx(0); my(0); });
  });
}

/* ---------- 8. modal: GSAP entrance (replaces the CSS one) ---------- */
var backdrop = $("#modal-backdrop");
if(backdrop){
  new MutationObserver(function(){
    if(!backdrop.classList.contains("open")) return;
    var modal = $(".modal", backdrop);
    gsap.fromTo(modal, {y:36, opacity:0, scale:.96}, {y:0, opacity:1, scale:1, duration:.55, ease:"power4.out", clearProps:"transform,opacity"});
    gsap.fromTo($$(".metric", modal), {y:14, opacity:0}, {y:0, opacity:1, duration:.45, stagger:.025, delay:.2, ease:ease, clearProps:"transform,opacity"});
  }).observe(backdrop, {attributes:true, attributeFilter:["class"]});
}

/* ---------- 9. particle backdrop (tsParticles) ---------- */
if(window.tsParticles && wide && fine){
  var host = d.createElement("div");
  host.id = "fx-particles"; host.setAttribute("aria-hidden","true");
  d.body.insertBefore(host, d.body.firstChild);
  try{
    var p = window.tsParticles.load({
      id:"fx-particles",
      options:{
        fullScreen:{enable:false}, fpsLimit:45, detectRetina:true,
        background:{color:"transparent"},
        particles:{
          number:{value:46, density:{enable:true, width:1200, height:800}},
          color:{value:["#b9f38a","#66dbc3","#91d5a4"]},
          opacity:{value:{min:.18,max:.5}},
          size:{value:{min:1,max:2.2}},
          move:{enable:true, speed:.35, outModes:{default:"out"}},
          links:{enable:true, distance:150, color:"#b9f38a", opacity:.14, width:1}
        },
        interactivity:{events:{onHover:{enable:true, mode:"grab"}},
          modes:{grab:{distance:170, links:{opacity:.4}}}}
      }
    });
    if(p && p.catch) p.catch(function(){});
  }catch(e){}
}
})();
