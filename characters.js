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
    observe(slot);
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
