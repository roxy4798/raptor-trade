/* Raptor Trade — Premium Animated AI Research Team (anime portraits).
   12 unique anime characters, one per research agent, generated as
   portraits (assets/characters/agent-NN.jpg, 900x1080, 5:6) and
   rendered into every .agent-char[data-agent] slot: the team strip,
   the six section heads, and the overview coverage minis.
   Pure frontend: static images, no backend load. Idle motion only —
   a gentle bob (transform) — the portraits are raster images, so
   there is no blink/core animation. Characters never show research
   activity. Respects the page motion toggle (html.motion-off) and
   prefers-reduced-motion. Animations pause when off-screen.
   Replaces the v50 inline-SVG robot builder (robots retired on
   Raka's order 25 Nov 2026 18:12 WIB: "saya ingin anime aja
   karakternya"). Research freeze stays active. */
(function () {
  "use strict";

  var uid = 0;

  /* IntersectionObserver: pause the bob while a slot is off-screen. */
  var io = ("IntersectionObserver" in window) ? new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        e.target.classList.toggle("char-paused", !e.isIntersecting);
      });
    }, { rootMargin: "80px" }) : null;

  function observe(slot) {
    if (io) io.observe(slot);
  }

  /* Personal identity per agent (Raka 25 Nov 2026 19:50 WIB — approved
     personal names; name = primary identity, specialization = subtitle).
     color = the agent's canonical color, used for its name everywhere. */
  var IDENTITY = {
    "01": { name: "AXIOM",   short: "BREAKOUT",           spec: "Breakout Intelligence",               color: "#22d3ee" },
    "02": { name: "VEX",     short: "REVERSAL",           spec: "Reversal & Exhaustion",               color: "#a78bfa" },
    "03": { name: "FLUX",    short: "ORDER FLOW",         spec: "Order Flow",             color: "#4ade80" },
    "04": { name: "ATLAS",   short: "MARKET REGIME",      spec: "Market Regime",          color: "#facc15" },
    "05": { name: "NEXUS",   short: "LIQUIDITY",          spec: "Liquidity & Execution",              color: "#60a5fa" },
    "06": { name: "SYNAPSE", short: "PERFORMANCE",        spec: "Performance Learning",                color: "#fb7185" },
    "07": { name: "RAPTOR",  short: "PUMP IGNITION",      spec: "Pump Ignition & Continuation",          color: "#fcd34d" },
    "08": { name: "SPECTRE", short: "MISSED OPPORTUNITY", spec: "Missed Opportunity",     color: "#a3e635" },
    "09": { name: "PRISM",   short: "FILTER DISCOVERY",   spec: "Filter Discovery & Optimization",     color: "#e879f9" },
    "10": { name: "VERITAS", short: "VALIDATION",         spec: "Independent Strategy Validation",     color: "#cbd5e1" },
    "11": { name: "APEX",    short: "TAKE PROFIT & EXIT", spec: "Take Profit & Exit",     color: "#2dd4bf" },
    "12": { name: "AEGIS",   short: "RISK & PORTFOLIO",    spec: "Risk & Portfolio",       color: "#f87171" }
  };

  function renderSlot(slot) {
    if (!slot || slot.dataset.charDone) return;
    var n = slot.getAttribute("data-agent");
    if (!n) return;
    slot.dataset.charDone = "1";
    uid += 1;
    var img = document.createElement("img");
    img.src = "characters/agent-" + n + ".jpg";
    img.alt = "";
    img.draggable = false;
    img.loading = "lazy";
    /* Stagger the bob so the team never moves in lockstep. */
    img.style.setProperty("--dur", (4.6 + (uid % 5) * 0.5) + "s");
    img.style.setProperty("--del", (-(uid % 3)) + "s");
    slot.appendChild(img);
    /* Name on the character: a ribbon across the bottom of team
       portraits (personal name, primary + specialization subtitle);
       a nameplate under section-head portraits (AGENT NN — NAME +
       specialization subtitle). Coverage minis already sit next to
       the agent name in their row. */
    var id = IDENTITY[n] || null;
    if (id && slot.classList.contains("agent-char--team")) {
      var rib = document.createElement("span");
      rib.className = "char-ribbon";
      rib.style.setProperty("--rac", id.color);
      var rn = document.createElement("span");
      rn.className = "rib-name";
      rn.textContent = id.name;
      var rs = document.createElement("span");
      rs.className = "rib-spec";
      rs.textContent = id.short;
      rib.appendChild(rn);
      rib.appendChild(rs);
      slot.appendChild(rib);
    } else if (id && slot.classList.contains("agent-char--head")) {
      var plate = document.createElement("span");
      plate.className = "char-nameplate";
      plate.style.setProperty("--rac", id.color);
      var pt = document.createElement("span");
      pt.className = "plate-tag";
      pt.textContent = "AGENT " + n + " — ";
      var pn = document.createElement("span");
      pn.className = "plate-name";
      pn.textContent = id.name;
      var ps = document.createElement("span");
      ps.className = "plate-spec";
      ps.textContent = id.spec;
      plate.appendChild(pt);
      plate.appendChild(pn);
      plate.appendChild(ps);
      slot.parentNode.insertBefore(plate, slot.nextSibling);
    }
    observe(slot);
    setupMotion(slot);
  }

  /* ---- lively motion (GSAP 3.15, vendored in vendor/gsap.min.js
     + vendor/ScrollTrigger.min.js) ----
     The portraits themselves keep the CSS idle bob (transform-only,
     motion-aware). GSAP adds the two things CSS can't do cleanly:
     (1) a run-in entrance — each character dashes in from the side
     with a lean when it scrolls into view (ScrollTrigger, once);
     (2) a hop on hover/tap. All GSAP work targets the SLOT, never
     the img, so it never fights the CSS bob. If GSAP failed to load,
     or motion is off, everything degrades to static portraits +
     CSS bob. Research: GSAP 3.15 recommended 25 Nov 2026 (12M+
     sites, ScrollTrigger industry standard, free since 3.13);
     Motion mini animate() runner-up; Lottie rejected (can't animate
     a raster JPG). */
  var gsapReady = false;
  var enterIO = null; /* shared entrance observer (v55): fires the
    gsap.to only when a slot truly enters the viewport */
  function motionOK() {
    if (document.documentElement.classList.contains("motion-off")) return false;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    return !!(window.gsap && window.ScrollTrigger);
  }
  function setupMotion(slot) {
    if (!motionOK()) return;
    if (!gsapReady) {
      window.gsap.registerPlugin(window.ScrollTrigger);
      gsapReady = true;
      /* If the OS reduced-motion setting flips on mid-visit, stop
         every character tween and clear it back to the static pose. */
      if (window.matchMedia) {
        window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", function (e) {
          if (e.matches && window.gsap) {
            window.gsap.killTweensOf(".agent-char");
            window.gsap.set(".agent-char", { clearProps: "all" });
          }
        });
      }
    }
    var isHead = slot.classList.contains("agent-char--head");
    var isCov = slot.classList.contains("cov-char");
    var isTeam = slot.classList.contains("agent-char--team");
    var dist = isCov ? 40 : 120;
    var dir = isHead ? 1 : -1; /* head slots live on the right: run in from the right */
    var delay = isTeam ? ((uid - 1) % 12) * 0.05 : 0; /* team cascade, one by one */
    slot.dataset.entered = "";
    /* v55 — the dash-in never showed, two causes found by frame
       sampling (25 Nov 2026): (1) gsap.from() + ScrollTrigger never
       rendered its start pose before the trigger fired; (2) after
       fixing that with gsap.set + gsap.to, the ScrollTrigger STILL
       fired at page load — while the research data was still
       loading, the page was short, so all 18 team/head slots sat
       inside the "top 88%" band; the once:true triggers fired +
       killed themselves and the tween completed before the user ever
       scrolled (probe: entered='1', 0 active tweens, only the 5
       late-rendered coverage triggers left). Fix: keep the gsap.set
       start pose, but trigger the gsap.to with an Intersection-
       Observer — the same pattern the page already uses for .reveal
       and .char-paused — which fires only when the slot truly
       enters the viewport, however tall the page grows. */
    window.gsap.set(slot, { x: dir * dist, rotation: dir * 6, opacity: 0 });
    if (!("IntersectionObserver" in window)) {
      /* No observer: show the portrait, no entrance. */
      window.gsap.set(slot, { clearProps: "all" });
      slot.dataset.entered = "1";
    } else {
      if (!enterIO) {
        enterIO = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (!en.isIntersecting) return;
            var t = en.target;
            var s = t.classList.contains("agent-char") ? t : t.querySelector(".agent-char");
            if (!s || s.dataset.entered === "1") return;
            enterIO.unobserve(t);
            var d = s.classList.contains("agent-char--team") ? ((+s.getAttribute("data-agent") - 1) % 12) * 0.05 : 0;
            window.gsap.to(s, {
              x: 0, rotation: 0, opacity: 1,
              duration: 0.7, delay: d, ease: "back.out(1.4)",
              onComplete: function () { s.dataset.entered = "1"; }
            });
          });
        }, { rootMargin: "0px 0px -12% 0px", threshold: 0 });
      }
      /* Observe the slot's PARENT (team card / section head / coverage
         row), not the slot itself: a slot parked at ±120px can sit
         entirely outside main's overflow-x:clip bounds (the head
         slots sit +120px right of main's edge), so its own rect never
         intersects the viewport and an observer on the slot would
         never fire — the head portraits stayed invisible. The parent
         is always inside main, so it intersects reliably. */
      enterIO.observe(slot.parentNode || slot);
    }
    var hop = function () {
      if (!motionOK() || slot.dataset.entered !== "1") return;
      window.gsap.to(slot, { y: -10, rotation: 2, duration: 0.35, ease: "back.out(2)", yoyo: true, repeat: 1, overwrite: "auto" });
    };
    slot.addEventListener("mouseenter", hop);
    slot.addEventListener("click", hop);
  }

  function renderAll(root) {
    var slots = (root || document).querySelectorAll(".agent-char[data-agent]");
    for (var i = 0; i < slots.length; i++) renderSlot(slots[i]);
  }

  function init() {
    renderAll(document);
    /* Coverage rows are rendered by research.js after the data loads,
       so keep watching for slots added later. */
    if ("MutationObserver" in window) {
      var mo = new MutationObserver(function (muts) {
        muts.forEach(function (m) {
          for (var i = 0; i < m.addedNodes.length; i++) {
            var node = m.addedNodes[i];
            if (node.nodeType !== 1) continue;
            if (node.classList && node.classList.contains("agent-char")) {
              renderSlot(node);
            } else if (node.querySelectorAll) {
              renderAll(node);
            }
          }
        });
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.RaptorCharacters = { renderAll: renderAll, renderSlot: renderSlot };
})();
