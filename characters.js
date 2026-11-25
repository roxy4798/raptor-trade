/* Raptor Trade — Premium Animated AI Research Team.
   12 unique futuristic humanoid robot characters, one per research
   agent, rendered as inline SVG with CSS idle animation only.
   Pure frontend: no backend load, no network fetches, no data
   dependency. Characters never show research activity — idle
   motion only (bob, blink, core breathing, slow holo ring).
   Respects the page motion toggle (html.motion-off) and
   prefers-reduced-motion. Animations pause when off-screen.
   Raka approved 25 Nov 2026 17:28 WIB (frontend visual only;
   research freeze stays active). */
(function () {
  "use strict";

  /* id, name, role (en/id), accent, accent2, head, torso, shoulders,
     core, legs, accessory, section anchor, flagship. */
  var AGENTS = [
    { id: "01", name: "Breakout Intelligence",
      roleEn: "Breakout strength, RVOL & EMA alignment",
      roleId: "Kekuatan breakout, RVOL & EMA alignment",
      accent: "#22d3ee", accent2: "#a5f3fc",
      head: "visor", torso: "broad", shoulders: "angular", core: "tri-up",
      legs: "legs", acc: "chevrons", section: "overview", bob: 5.4 },
    { id: "02", name: "Reversal Intelligence",
      roleEn: "Reversal markers & momentum exhaustion",
      roleId: "Penanda reversal & kelelahan momentum",
      accent: "#a78bfa", accent2: "#ddd6fe",
      head: "crown", torso: "slim", shoulders: "rounded", core: "ring",
      legs: "legs", acc: "uturn", section: "overview", bob: 6.1 },
    { id: "03", name: "Order Flow Intelligence",
      roleEn: "Taker flow, imbalance & open interest",
      roleId: "Arus taker, imbalance & open interest",
      accent: "#4ade80", accent2: "#bbf7d0",
      head: "dome", torso: "slim", shoulders: "none", core: "orb",
      legs: "hover", acc: "waves", section: "overview", bob: 4.8 },
    { id: "04", name: "Market Regime Intelligence",
      roleEn: "BTC trend, breadth & correlation",
      roleId: "Tren BTC, breadth & korelasi",
      accent: "#facc15", accent2: "#fef08a",
      head: "halo", torso: "broad", shoulders: "angular", core: "hex",
      legs: "legs", acc: "orbit", section: "overview", bob: 5.8 },
    { id: "05", name: "Liquidity Intelligence",
      roleEn: "Spread, depth & slippage",
      roleId: "Spread, depth & slippage",
      accent: "#60a5fa", accent2: "#bfdbfe",
      head: "split", torso: "broad", shoulders: "rounded", core: "bars",
      legs: "legs", acc: "depthbars", section: "overview", bob: 5.0 },
    { id: "06", name: "Performance Learning",
      roleEn: "Outcomes, checkpoints & hypotheses",
      roleId: "Outcome, checkpoint & hipotesis",
      accent: "#fb7185", accent2: "#fecdd3",
      head: "dome", torso: "slim", shoulders: "none", core: "diamond",
      legs: "hover", acc: "nodes", section: "overview", bob: 6.4 },
    { id: "07", name: "Pump Ignition Intelligence",
      roleEn: "First pump → next-candle continuation",
      roleId: "Pump pertama → continuation candle berikutnya",
      accent: "#fb923c", accent2: "#fcd34d",
      head: "horned", torso: "broad", shoulders: "winged", core: "flame",
      legs: "legs", acc: "flamefins", section: "ignition", bob: 4.6,
      flagship: true },
    { id: "08", name: "Missed Opportunity Intelligence",
      roleEn: "Which gate blocked the winners",
      roleId: "Gate mana yang memblokir winner",
      accent: "#a3e635", accent2: "#d9f99d",
      head: "visor", torso: "slim", shoulders: "none", core: "ring",
      legs: "hover", acc: "target", section: "missed", bob: 5.6 },
    { id: "09", name: "Filter Discovery & Optimization",
      roleEn: "Shadow Lab: virtual filter trials",
      roleId: "Shadow Lab: uji filter virtual",
      accent: "#e879f9", accent2: "#f5d0fe",
      head: "dome", torso: "broad", shoulders: "rounded", core: "hex",
      legs: "legs", acc: "flask", section: "ridethewave", bob: 5.2 },
    { id: "10", name: "Independent Strategy Validation",
      roleEn: "Look-ahead, leakage & overfitting checks",
      roleId: "Cek look-ahead, leakage & overfitting",
      accent: "#cbd5e1", accent2: "#f1f5f9",
      head: "crown", torso: "broad", shoulders: "angular", core: "shield",
      legs: "legs", acc: "shieldcheck", section: "validation", bob: 6.0 },
    { id: "11", name: "Take Profit & Exit Intelligence",
      roleEn: "TP-before-SL & exit efficiency",
      roleId: "TP-before-SL & efisiensi exit",
      accent: "#2dd4bf", accent2: "#99f6e4",
      head: "visor", torso: "slim", shoulders: "none", core: "diamond",
      legs: "hover", acc: "exitdoor", section: "exit", bob: 4.9 },
    { id: "12", name: "Risk & Portfolio Intelligence",
      roleEn: "Drawdown, sizing & portfolio risk",
      roleId: "Drawdown, sizing & risiko portfolio",
      accent: "#f87171", accent2: "#fecaca",
      head: "horned", torso: "broad", shoulders: "winged", core: "tri-down",
      legs: "legs", acc: "scale", section: "risk", bob: 5.7 }
  ];

  var uid = 0;

  function defs(u, a) {
    return "<defs>" +
      '<linearGradient id="body-' + u + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#3d4b55"/>' +
      '<stop offset=".55" stop-color="#1e2830"/>' +
      '<stop offset="1" stop-color="#121a20"/></linearGradient>' +
      '<linearGradient id="edge-' + u + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#5b6c78"/>' +
      '<stop offset="1" stop-color="#28343e"/></linearGradient>' +
      '<linearGradient id="acc-' + u + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + a.accent2 + '"/>' +
      '<stop offset="1" stop-color="' + a.accent + '"/></linearGradient>' +
      '<radialGradient id="core-' + u + '" cx=".5" cy=".42" r=".65">' +
      '<stop offset="0" stop-color="' + a.accent2 + '"/>' +
      '<stop offset=".55" stop-color="' + a.accent + '"/>' +
      '<stop offset="1" stop-color="' + a.accent + '" stop-opacity=".55"/>' +
      "</radialGradient>" +
      '<radialGradient id="plat-' + u + '" cx=".5" cy=".5" r=".5">' +
      '<stop offset="0" stop-color="' + a.accent + '" stop-opacity=".28"/>' +
      '<stop offset="1" stop-color="' + a.accent + '" stop-opacity="0"/>' +
      "</radialGradient></defs>";
  }

  function platform(u, a) {
    return '<ellipse cx="60" cy="136" rx="32" ry="5" fill="url(#plat-' + u + ')"/>' +
      '<ellipse cx="60" cy="136" rx="32" ry="5" fill="none" stroke="' + a.accent +
      '" stroke-opacity=".35" stroke-width="1"/>';
  }

  function holoRing(a) {
    return '<g class="char-ring" style="--dur:26s">' +
      '<ellipse cx="60" cy="80" rx="46" ry="54" fill="none" stroke="' + a.accent +
      '" stroke-opacity=".16" stroke-width="1" transform="rotate(-18 60 80)"/>' +
      "</g>";
  }

  function legs(a) {
    return '<rect x="48" y="110" width="8" height="18" rx="3" fill="url(#edge-' + a.u + ')"/>' +
      '<rect x="64" y="110" width="8" height="18" rx="3" fill="url(#edge-' + a.u + ')"/>' +
      '<rect x="43" y="126" width="16" height="5" rx="2.5" fill="url(#edge-' + a.u + ')"/>' +
      '<rect x="61" y="126" width="16" height="5" rx="2.5" fill="url(#edge-' + a.u + ')"/>';
  }

  function hoverRing(a) {
    return '<ellipse cx="60" cy="129" rx="18" ry="4.5" fill="none" stroke="' +
      a.accent + '" stroke-opacity=".5" stroke-width="1.5"/>';
  }

  function core(a) {
    var inner = "";
    if (a.core === "flame") {
      inner = '<g class="char-flame" style="--dur:1.9s">' +
        '<path d="M60,70 C64,76 68,78 68,84 A8,8 0 1,1 52,84 C52,78 56,76 60,70 Z" fill="url(#core-' + a.u + ')"/>' +
        '<path d="M60,78 C62,81 64,82 64,85 A4,4 0 1,1 56,85 C56,82 58,81 60,78 Z" fill="' + a.accent2 + '" fill-opacity=".85"/>' +
        "</g>";
    } else if (a.core === "orb") {
      inner = '<circle cx="60" cy="82" r="7.5" fill="url(#core-' + a.u + ')"/>' +
        '<circle cx="60" cy="82" r="3" fill="' + a.accent2 + '"/>';
    } else if (a.core === "ring") {
      inner = '<circle cx="60" cy="82" r="8" fill="none" stroke="' + a.accent + '" stroke-width="2.5"/>' +
        '<circle cx="60" cy="82" r="2.6" fill="' + a.accent2 + '"/>';
    } else if (a.core === "diamond") {
      inner = '<polygon points="60,71 70,82 60,93 50,82" fill="url(#core-' + a.u + ')"/>';
    } else if (a.core === "hex") {
      inner = '<polygon points="60,73 68,77.5 68,86.5 60,91 52,86.5 52,77.5" fill="url(#core-' + a.u + ')"/>';
    } else if (a.core === "tri-up") {
      inner = '<polygon points="60,71 70,90 50,90" fill="url(#core-' + a.u + ')"/>';
    } else if (a.core === "tri-down") {
      inner = '<polygon points="50,72 70,72 60,91" fill="url(#core-' + a.u + ')"/>';
    } else if (a.core === "bars") {
      inner = '<g class="char-bars" style="--dur:2.6s">' +
        '<rect x="49" y="84" width="5" height="8" rx="1" fill="url(#acc-' + a.u + ')"/>' +
        '<rect x="57.5" y="79" width="5" height="13" rx="1" fill="url(#acc-' + a.u + ')"/>' +
        '<rect x="66" y="74" width="5" height="18" rx="1" fill="url(#acc-' + a.u + ')"/>' +
        "</g>";
    } else if (a.core === "shield") {
      inner = '<path d="M60,71 L69,74 V82 C69,88 65,91 60,92 C55,91 51,88 51,82 V74 Z" fill="url(#core-' + a.u + ')"/>' +
        '<path d="M55.5,82 L58.5,85 L65,77" fill="none" stroke="#0a1206" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    }
    return '<g class="char-core" style="--dur:2.9s;--del:-.7s">' + inner + "</g>";
  }

  function shoulders(a) {
    if (a.shoulders === "angular") {
      return '<polygon points="33,66 47,59 44,75" fill="url(#edge-' + a.u + ')"/>' +
        '<polygon points="87,66 73,59 76,75" fill="url(#edge-' + a.u + ')"/>';
    }
    if (a.shoulders === "rounded") {
      return '<ellipse cx="38" cy="68" rx="7.5" ry="6" fill="url(#edge-' + a.u + ')"/>' +
        '<ellipse cx="82" cy="68" rx="7.5" ry="6" fill="url(#edge-' + a.u + ')"/>';
    }
    if (a.shoulders === "winged") {
      return '<path d="M37,70 L20,56 L30,74 Z" fill="url(#edge-' + a.u + ')"/>' +
        '<path d="M83,70 L100,56 L90,74 Z" fill="url(#edge-' + a.u + ')"/>';
    }
    return "";
  }

  function torso(a) {
    var body = "";
    if (a.torso === "broad") {
      body = '<path d="M36,64 L84,64 L88,102 L32,102 Z" fill="url(#body-' + a.u + ')" stroke="rgba(255,255,255,.12)" stroke-width="1"/>' +
        '<path d="M42,70 L78,70 L80,96 L40,96 Z" fill="rgba(255,255,255,.03)"/>';
    } else if (a.torso === "slim") {
      body = '<rect x="46" y="62" width="28" height="42" rx="7" fill="url(#body-' + a.u + ')" stroke="rgba(255,255,255,.12)" stroke-width="1"/>';
    } else {
      body = '<rect x="42" y="60" width="36" height="46" rx="17" fill="url(#body-' + a.u + ')" stroke="rgba(255,255,255,.12)" stroke-width="1"/>';
    }
    var rim = a.flagship
      ? '<path d="M36,64 L84,64" fill="none" stroke="#fbbf24" stroke-opacity=".7" stroke-width="1.5"/>'
      : "";
    var arms = '<rect x="30" y="70" width="7" height="26" rx="3.5" fill="url(#edge-' + a.u + ')"/>' +
      '<circle cx="33.5" cy="100" r="4" fill="url(#edge-' + a.u + ')"/>' +
      '<rect x="83" y="70" width="7" height="26" rx="3.5" fill="url(#edge-' + a.u + ')"/>' +
      '<circle cx="86.5" cy="100" r="4" fill="url(#edge-' + a.u + ')"/>';
    var rivets = '<circle cx="40" cy="98" r="1.2" fill="rgba(255,255,255,.28)"/>' +
      '<circle cx="80" cy="98" r="1.2" fill="rgba(255,255,255,.28)"/>';
    return body + rim + shoulders(a) + arms + rivets + core(a);
  }

  function head(a) {
    var eyes = "";
    var extra = "";
    if (a.head === "visor") {
      eyes = '<rect class="char-eyes" x="48" y="33" width="24" height="6" rx="3" fill="' + a.accent + '"/>';
      extra = '<line x1="60" y1="24" x2="60" y2="18" stroke="' + a.accent + '" stroke-width="1.5"/>' +
        '<circle cx="60" cy="16.5" r="2" fill="' + a.accent2 + '"/>';
      return '<rect x="43" y="24" width="34" height="26" rx="8" fill="url(#body-' + a.u + ')" stroke="rgba(255,255,255,.14)" stroke-width="1"/>' + extra + eyes;
    }
    if (a.head === "crown") {
      eyes = '<rect class="char-eyes" x="48" y="33" width="24" height="6" rx="3" fill="' + a.accent + '"/>';
      extra = '<polygon points="48,24 52,11 56,24" fill="url(#edge-' + a.u + ')"/>' +
        '<polygon points="58,24 60,8 62,24" fill="url(#edge-' + a.u + ')"/>' +
        '<polygon points="64,24 68,11 72,24" fill="url(#edge-' + a.u + ')"/>';
      return extra + '<rect x="43" y="24" width="34" height="26" rx="8" fill="url(#body-' + a.u + ')" stroke="rgba(255,255,255,.14)" stroke-width="1"/>' + eyes;
    }
    if (a.head === "dome") {
      eyes = '<rect class="char-eyes" x="48" y="33" width="24" height="6" rx="3" fill="' + a.accent + '"/>';
      extra = '<line x1="60" y1="22" x2="60" y2="14" stroke="' + a.accent + '" stroke-width="1.5"/>' +
        '<circle cx="60" cy="12.5" r="2" fill="' + a.accent2 + '"/>';
      return '<path d="M43,50 L43,38 A17,17 0 0,1 77,38 L77,50 Z" fill="url(#body-' + a.u + ')" stroke="rgba(255,255,255,.14)" stroke-width="1"/>' + extra + eyes;
    }
    if (a.head === "horned") {
      eyes = '<rect class="char-eyes" x="48" y="33" width="24" height="6" rx="3" fill="' + a.accent + '"/>';
      extra = '<polygon points="44,30 29,19 45,21" fill="url(#edge-' + a.u + ')"/>' +
        '<polygon points="76,30 91,19 75,21" fill="url(#edge-' + a.u + ')"/>';
      return extra + '<rect x="43" y="24" width="34" height="26" rx="8" fill="url(#body-' + a.u + ')" stroke="rgba(255,255,255,.14)" stroke-width="1"/>' + eyes;
    }
    if (a.head === "halo") {
      eyes = '<g class="char-eyes"><circle cx="52" cy="36" r="2.6" fill="' + a.accent + '"/><circle cx="68" cy="36" r="2.6" fill="' + a.accent + '"/></g>';
      extra = '<ellipse cx="60" cy="15" rx="15" ry="3.5" fill="none" stroke="' + a.accent + '" stroke-opacity=".85" stroke-width="1.5"/>';
      return extra + '<rect x="43" y="24" width="34" height="26" rx="8" fill="url(#body-' + a.u + ')" stroke="rgba(255,255,255,.14)" stroke-width="1"/>' + eyes;
    }
    /* split */
    eyes = '<g class="char-eyes"><rect x="49" y="33" width="9" height="5" rx="2.5" fill="' + a.accent + '"/><rect x="62" y="33" width="9" height="5" rx="2.5" fill="' + a.accent + '"/></g>';
    return '<rect x="43" y="24" width="34" height="26" rx="8" fill="url(#body-' + a.u + ')" stroke="rgba(255,255,255,.14)" stroke-width="1"/>' + eyes;
  }

  function accessory(a) {
    var acc = a.accent, acc2 = a.accent2;
    if (a.acc === "chevrons") {
      return '<g class="char-acc" style="--dur:3.4s">' +
        '<polygon points="54,10 60,4 66,10 60,7.5" fill="' + acc + '" fill-opacity=".9"/>' +
        '<polygon points="54,16 60,10 66,16 60,13.5" fill="' + acc + '" fill-opacity=".6"/>' +
        "</g>";
    }
    if (a.acc === "uturn") {
      return '<g class="char-acc" style="--dur:4.2s">' +
        '<path d="M46,16 A14,14 0 1,1 74,16" fill="none" stroke="' + acc + '" stroke-width="2.5" stroke-linecap="round"/>' +
        '<polygon points="74,10 78,17 70,17" fill="' + acc + '"/>' +
        "</g>";
    }
    if (a.acc === "waves") {
      return '<g class="char-wave" style="--dur:2.8s">' +
        '<path d="M82,34 q6,-4 12,0 t12,0" fill="none" stroke="' + acc + '" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M82,42 q6,-4 12,0 t12,0" fill="none" stroke="' + acc + '" stroke-opacity=".6" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M82,50 q6,-4 12,0 t12,0" fill="none" stroke="' + acc + '" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/>' +
        "</g>";
    }
    if (a.acc === "orbit") {
      return '<ellipse cx="60" cy="38" rx="26" ry="12" fill="none" stroke="' + acc + '" stroke-opacity=".4" stroke-width="1" transform="rotate(-16 60 38)"/>' +
        '<g class="char-orbit" style="--dur:9s"><circle cx="60" cy="20" r="2.6" fill="' + acc2 + '"/></g>';
    }
    if (a.acc === "depthbars") {
      return '<g class="char-bars" style="--dur:3s">' +
        '<rect x="14" y="90" width="4.5" height="14" rx="1" fill="url(#acc-' + a.u + ')" fill-opacity=".55"/>' +
        '<rect x="21" y="83" width="4.5" height="21" rx="1" fill="url(#acc-' + a.u + ')" fill-opacity=".75"/>' +
        '<rect x="28" y="76" width="4.5" height="28" rx="1" fill="url(#acc-' + a.u + ')"/>' +
        "</g>";
    }
    if (a.acc === "nodes") {
      return '<g class="char-nodes" style="--dur:3.6s">' +
        '<line x1="88" y1="70" x2="97" y2="80" stroke="' + acc + '" stroke-opacity=".5"/>' +
        '<line x1="97" y1="80" x2="89" y2="92" stroke="' + acc + '" stroke-opacity=".5"/>' +
        '<circle cx="88" cy="70" r="3" fill="' + acc + '"/>' +
        '<circle cx="97" cy="80" r="2.5" fill="' + acc2 + '"/>' +
        '<circle cx="89" cy="92" r="3" fill="' + acc + '"/>' +
        "</g>";
    }
    if (a.acc === "flamefins") {
      return '<g class="char-flame" style="--dur:2.1s">' +
        '<path d="M33,58 C35,53 39,52 39,57 A3.5,3.5 0 1,1 32,57 C32,54 33,55 33,58 Z" fill="' + acc + '"/>' +
        '<path d="M87,58 C89,53 93,52 93,57 A3.5,3.5 0 1,1 86,57 C86,54 87,55 87,58 Z" fill="' + acc + '"/>' +
        "</g>" +
        '<g class="char-ember" style="--dur:2.4s;--del:0s"><circle cx="52" cy="10" r="1.6" fill="' + acc2 + '"/></g>' +
        '<g class="char-ember" style="--dur:2.9s;--del:-1.1s"><circle cx="64" cy="6" r="1.3" fill="' + acc + '"/></g>' +
        '<g class="char-ember" style="--dur:2.6s;--del:-.5s"><circle cx="70" cy="12" r="1.4" fill="' + acc2 + '"/></g>';
    }
    if (a.acc === "target") {
      return '<g class="char-ring2" style="--dur:14s">' +
        '<circle cx="60" cy="12" r="7.5" fill="none" stroke="' + acc + '" stroke-width="1.5"/>' +
        '<line x1="60" y1="1" x2="60" y2="5" stroke="' + acc + '" stroke-width="1.5"/>' +
        '<line x1="60" y1="19" x2="60" y2="23" stroke="' + acc + '" stroke-width="1.5"/>' +
        '<line x1="49" y1="12" x2="53" y2="12" stroke="' + acc + '" stroke-width="1.5"/>' +
        '<line x1="67" y1="12" x2="71" y2="12" stroke="' + acc + '" stroke-width="1.5"/>' +
        '<circle cx="60" cy="12" r="1.8" fill="' + acc2 + '"/>' +
        "</g>";
    }
    if (a.acc === "flask") {
      return '<g class="char-acc" style="--dur:4s">' +
        '<path d="M92,66 L92,72 A8,8 0 1,1 78,72 L78,66 L84,66 L84,60 L86,60 L86,66 Z" fill="' + acc + '" fill-opacity=".14" stroke="' + acc + '" stroke-width="1.5"/>' +
        '<g class="char-bubble" style="--dur:2.2s"><circle cx="84" cy="76" r="1.6" fill="' + acc2 + '"/></g>' +
        '<g class="char-bubble" style="--dur:2.8s;--del:-1.2s"><circle cx="88" cy="74" r="1.2" fill="' + acc2 + '"/></g>' +
        "</g>";
    }
    if (a.acc === "shieldcheck") {
      return '<g class="char-acc" style="--dur:4.4s">' +
        '<path d="M26,64 L35,67 V74 C35,79 31,82 26,83 C21,82 17,79 17,74 V67 Z" fill="' + acc + '" fill-opacity=".14" stroke="' + acc + '" stroke-width="1.5"/>' +
        '<path d="M21.5,74 L24.5,77 L30.5,70.5" fill="none" stroke="' + acc2 + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
        "</g>";
    }
    if (a.acc === "exitdoor") {
      return '<g class="char-acc" style="--dur:3.8s">' +
        '<path d="M88,98 V78 A7,7 0 0,1 102,78 V98" fill="none" stroke="' + acc + '" stroke-width="1.8"/>' +
        '<path d="M90,86 L99,86 M95,82 L99,86 L95,90" fill="none" stroke="' + acc2 + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
        "</g>";
    }
    /* scale */
    return '<g class="char-sway" style="--dur:5s">' +
      '<line x1="90" y1="62" x2="90" y2="82" stroke="' + acc + '" stroke-width="1.6"/>' +
      '<line x1="79" y1="66" x2="101" y2="66" stroke="' + acc + '" stroke-width="1.6"/>' +
      '<path d="M79,66 L74,76 A6,6 0 0,0 84,76 Z" fill="' + acc + '" fill-opacity=".3" stroke="' + acc + '" stroke-width="1"/>' +
      '<path d="M101,66 L96,76 A6,6 0 0,0 106,76 Z" fill="' + acc + '" fill-opacity=".3" stroke="' + acc + '" stroke-width="1"/>' +
      '<circle cx="90" cy="62" r="2" fill="' + acc2 + '"/>' +
      "</g>";
  }

  function build(a) {
    uid += 1;
    a.u = "c" + uid;
    var lang = (document.documentElement.lang || "en").toLowerCase();
    var role = lang === "id" ? a.roleId : a.roleEn;
    var label = "Agent " + a.id + " — " + a.name + ": " + role;
    var svg = '<svg viewBox="0 0 120 144" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' +
      label.replace(/"/g, "&quot;") + '">' +
      defs(a.u, a) +
      holoRing(a) +
      platform(a.u, a) +
      '<g class="char-bob" style="--dur:' + a.bob + 's;--del:-' + (uid % 3) + 's">' +
      (a.legs === "hover" ? hoverRing(a) : legs(a)) +
      '<rect x="55" y="52" width="10" height="11" fill="url(#edge-' + a.u + ')"/>' +
      torso(a) + head(a) + accessory(a) +
      "</g></svg>";
    return svg;
  }

  function byId(id) {
    for (var i = 0; i < AGENTS.length; i++) {
      if (AGENTS[i].id === id) return AGENTS[i];
    }
    return null;
  }

  function renderSlot(el) {
    if (!el || el.getAttribute("data-char-done") === "1") return;
    var cfg = byId(el.getAttribute("data-agent"));
    if (!cfg) return;
    el.setAttribute("data-char-done", "1");
    var html = build(cfg);
    if (el.getAttribute("aria-hidden") === "true") {
      html = html.replace('role="img"', 'aria-hidden="true"');
    }
    el.innerHTML = html;
  }

  function renderAll(root) {
    var nodes = (root || document).querySelectorAll(".agent-char[data-agent]");
    for (var i = 0; i < nodes.length; i++) renderSlot(nodes[i]);
  }

  function observe() {
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        entries[i].target.classList.toggle(
          "char-paused", !entries[i].isIntersecting);
      }
    }, { rootMargin: "80px" });
    var nodes = document.querySelectorAll(".agent-char[data-agent]");
    for (var i = 0; i < nodes.length; i++) io.observe(nodes[i]);
    if ("MutationObserver" in window) {
      var mo = new MutationObserver(function (muts) {
        for (var j = 0; j < muts.length; j++) {
          var added = muts[j].addedNodes;
          for (var k = 0; k < added.length; k++) {
            var n = added[k];
            if (n.nodeType !== 1) continue;
            if (n.classList && n.classList.contains("agent-char")) {
              renderSlot(n); io.observe(n);
            }
            var inner = n.querySelectorAll ? n.querySelectorAll(".agent-char[data-agent]") : [];
            for (var m = 0; m < inner.length; m++) {
              renderSlot(inner[m]); io.observe(inner[m]);
            }
          }
        }
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }
  }

  renderAll();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", observe);
  } else {
    observe();
  }

  window.RaptorCharacters = { render: renderAll, agents: AGENTS };
})();
