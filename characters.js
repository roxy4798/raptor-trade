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

  /* Short skill name per agent — shown on the portrait itself so
     every character carries its name wherever it appears
     (Raka 25 Nov 2026: "Setiap karakternya harus muncul namanya"). */
  var NAMES = {
    "01": "BREAKOUT", "02": "REVERSAL", "03": "ORDER FLOW",
    "04": "MARKET REGIME", "05": "LIQUIDITY", "06": "PERFORMANCE",
    "07": "PUMP IGNITION", "08": "MISSED OPPORTUNITY",
    "09": "FILTER DISCOVERY", "10": "VALIDATION",
    "11": "TAKE PROFIT & EXIT", "12": "RISK & PORTFOLIO"
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
       portraits; a nameplate under section-head portraits. Coverage
       minis already sit next to the agent name in their row. */
    var label = NAMES[n] || "";
    if (label && slot.classList.contains("agent-char--team")) {
      var rib = document.createElement("span");
      rib.className = "char-ribbon";
      rib.textContent = label;
      slot.appendChild(rib);
    } else if (label && slot.classList.contains("agent-char--head")) {
      var plate = document.createElement("span");
      plate.className = "char-nameplate";
      plate.textContent = "AGENT " + n + " — " + label;
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
    window.gsap.from(slot, {
      x: dir * dist, rotation: dir * 6, opacity: 0,
      duration: 0.7, delay: delay, ease: "back.out(1.4)",
      scrollTrigger: { trigger: slot, start: "top 88%", once: true },
      onComplete: function () { slot.dataset.entered = "1"; }
    });
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
