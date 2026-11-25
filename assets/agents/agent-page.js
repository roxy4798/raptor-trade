/* Raptor Trade — shared AI agent page framework (v1.0.0).
   Adapted from the Stage 6d-verified staging shell (staging.js).
   Parameterized by the agent's config.json object: the build step
   embeds it in <script id="agent-config" type="application/json"> and
   the full roster in <script id="roster-config">; if the embedded
   JSON is absent this script fetches CONFIG_URL (assets/agents/
   config.json, relative to the rendered page) instead.
   ONE active renderer per open page. The .riv is lazy-loaded ONLY
   when its agent page opens (the directory page never loads this
   file, never loads rive.js, and never fetches a .riv).
   Loader is honest: it HEAD-probes the .riv and goes live only when
   the file loads AND the canvas has drawn its first non-black frame;
   until then the stage stays on the labelled STATIC PREVIEW and the
   badge stays LOADING — except for the runtime's own Free-tier
   splash: the white RIVE wordmark the runtime draws for ~1.5 s after
   onLoad is shown uncovered (the preview steps aside while it is
   visible, then returns for the black gap before the first character
   frame). Nothing here fakes the wordmark: the branding shown is
   always the runtime's own drawing.
   GSAP (vendor/gsap.min.js) is optional — every GSAP call is
   guarded; the page works without it.
   Interaction model (natural, not debug-style):
   - pointer over the stage -> lookX / lookY ViewModel numbers (-1..+1)
     + focus boolean true on enter, false on leave
   - tap / click on the stage (or Enter/Space when focused) -> interact trigger
   - selecting this agent's card -> entrance + greet trigger
   No new libraries. Rive Free runtime vendored locally. */
(function () {
  'use strict';

  /* ---------------- config: embedded JSON first, fetch fallback ---------------- */
  var CONFIG_URL = '../../assets/agents/config.json'; // rendered-page-relative; template previews resolve the same way
  function readEmbedded(id) {
    var el = document.getElementById(id);
    if (!el) return null;
    try { return JSON.parse(el.textContent || 'null'); } catch (e) { return null; }
  }
  var AGENT = readEmbedded('agent-config');
  var ROSTER = readEmbedded('roster-config');
  // Fallbacks when the template was previewed without a build: the
  // <html data-agent> slug + the config fetch below.
  if (!AGENT) {
    var slug = (document.documentElement.getAttribute('data-agent') || '').toLowerCase();
    AGENT = { slug: slug, name: (slug || 'AGENT').toUpperCase(), num: '??',
              color: '#e879f9', color2: null, riv: null, state_machine: null,
              status: 'coming_soon', portrait: '' };
  }
  var RIV_PATH = AGENT.riv || null; // relative to assets/agents/, e.g. "riv/prism.riv"
  var STATE_MACHINE = AGENT.state_machine || null;
  // On a rendered page (dist/agents/<slug>/index.html) the .riv lives at
  // ../../assets/agents/<riv>. The build step rewrites RIV_PATH to that
  // relative path via the {{RIV_URL}} placeholder; when it is still the
  // config-relative form, resolve it against the agents/ asset dir.
  var RIV_URL = RIV_PATH;
  if (RIV_URL && RIV_URL.indexOf('/') !== 0 && RIV_URL.indexOf('assets/') !== 0 &&
      RIV_URL.indexOf('../') !== 0 && RIV_URL.indexOf('http') !== 0) {
    // Served from assets/agents/ (template preview) or dist/agents/<slug>/
    // (rendered page): try the asset-dir-relative path first; the HEAD
    // probe below falls back to the config-relative path if it 404s.
    RIV_URL = '../../assets/agents/' + RIV_URL;
  }

  /* ---------------- i18n: mirror the existing pattern ---------------- */
  // Same storage key ('raptorLang') and same CustomEvent ('raptor:lang')
  // as language-v14.js / research.js. Chrome strings live in the I18N
  // dict below (data-i18n); per-agent strings are emitted by the build
  // step as data-en / data-id attributes on .agent-i18n elements.
  var I18N = {
    en: {
      'skip': 'Skip to character stage', 'nav.dashboard': 'Dashboard',
      'nav.research': 'Research', 'nav.agents': 'AI Agents',
      'hero.eyebrow': 'RAPTOR TRADE · AI AGENTS', 'lang.label': 'Language',
      'motion.label': 'Motion', 'stage.heading': 'Character stage',
      'badge.loading': 'LOADING', 'badge.loadingSub': '— checking for the live Rive file…',
      'stage.hint': 'Move your pointer — the character follows · Tap for a gesture',
      'stage.previewNote': 'Portrait shown while the live character loads; the live rig replaces it once its first frame is drawn.',
      'dev.toggle': 'Dev controls', 'dev.title': 'State machine — raw controls',
      'dev.note': 'State buttons enable when the live Rive file loads.',
      'roster.title': 'AI Agents', 'roster.back': '← Back to the AI Agents directory',
      'footer.motto': 'OBSERVE. VERIFY. DECIDE.',
      'footer.disclaimer': 'Research only — this page never filters, approves, or blocks a signal. Nothing here is financial advice. Rive runtime vendored locally; no CDN, no build step on this page.',
      'footer.agent': 'Agent {num} of 12',
      'badge.live': 'LIVE RIVE', 'badge.static': 'STATIC PREVIEW',
      'badge.splash': 'showing the Rive splash…',
      'badge.firstFrame': 'live file loaded, drawing the first frame…',
      'roster.liveNote': '{name} is live.',
      'roster.soonNote': '{name} is not rigged yet — only PRISM has a rig so far. Coming soon.'
    },
    id: {
      'skip': 'Lewati ke panggung karakter', 'nav.dashboard': 'Dashboard',
      'nav.research': 'Riset', 'nav.agents': 'Agen AI',
      'hero.eyebrow': 'RAPTOR TRADE · AGEN AI', 'lang.label': 'Bahasa',
      'motion.label': 'Gerak', 'stage.heading': 'Panggung karakter',
      'badge.loading': 'MEMUAT', 'badge.loadingSub': '— memeriksa file Rive live…',
      'stage.hint': 'Gerakkan pointer — karakter mengikuti · Ketuk untuk gestur',
      'stage.previewNote': 'Potret ditampilkan selama karakter live dimuat; rig live menggantikannya setelah frame pertamanya tergambar.',
      'dev.toggle': 'Kontrol dev', 'dev.title': 'State machine — kontrol mentah',
      'dev.note': 'Tombol state aktif saat file Rive live dimuat.',
      'roster.title': 'Agen AI', 'roster.back': '← Kembali ke direktori Agen AI',
      'footer.motto': 'AMATI. VERIFIKASI. PUTUSKAN.',
      'footer.disclaimer': 'Hanya riset — halaman ini tidak pernah memfilter, menyetujui, atau memblokir sinyal. Bukan nasihat finansial. Runtime Rive di-vendor lokal; tanpa CDN, tanpa build step di halaman ini.',
      'footer.agent': 'Agen {num} dari 12',
      'badge.live': 'LIVE RIVE', 'badge.static': 'PRATINJAU STATIS',
      'badge.splash': 'menampilkan splash Rive…',
      'badge.firstFrame': 'file live dimuat, menggambar frame pertama…',
      'roster.liveNote': '{name} sudah live.',
      'roster.soonNote': '{name} belum di-rig — baru PRISM yang punya rig sejauh ini. Segera hadir.'
    }
  };
  function lang() {
    try { var l = localStorage.getItem('raptorLang'); if (l === 'id' || l === 'en') return l; } catch (e) {}
    return 'en';
  }
  function t(key, vars) {
    var dict = I18N[lang()] || I18N.en;
    var s = dict[key]; if (s == null) s = I18N.en[key] || key;
    return String(s).replace(/\{(\w+)\}/g, function (_, k) { return vars && vars[k] != null ? vars[k] : ''; });
  }
  function applyI18n() {
    var l = lang();
    document.documentElement.setAttribute('lang', l);
    document.documentElement.dataset.lang = l;
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n]'), function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    Array.prototype.forEach.call(document.querySelectorAll('.agent-i18n[data-en]'), function (el) {
      var v = l === 'id' ? (el.getAttribute('data-id') || el.getAttribute('data-en')) : el.getAttribute('data-en');
      if (v != null) el.textContent = v;
    });
    Array.prototype.forEach.call(document.querySelectorAll('#lang-switch [data-lang]'), function (btn) {
      var on = btn.getAttribute('data-lang') === l;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-pressed', String(on));
    });
    var foot = document.querySelector('.foot-status [data-i18n="footer.agent"]');
    if (foot) foot.textContent = t('footer.agent', { num: AGENT.num });
  }
  function setLang(next) {
    if (next !== 'id' && next !== 'en') return;
    try { localStorage.setItem('raptorLang', next); } catch (e) {}
    applyI18n();
    try { window.dispatchEvent(new CustomEvent('raptor:lang', { detail: { lang: next } })); } catch (e) {}
  }

  /* ---------------- adaptive render tiers (from staging.js) ---------------- */
  function renderTier() {
    var w = window.innerWidth;
    var reduced = false;
    try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    if (reduced) return { name: 'static', dprCap: 1, particles: 0 };
    if (w <= 430) return { name: 'mobile', dprCap: 2, particles: 10 };
    if (w <= 1024) return { name: 'tablet', dprCap: 1.5, particles: 12 };
    return { name: 'desktop', dprCap: 1.5, particles: 16 };
  }
  function applyDprCap(inst) {
    if (!inst || typeof inst.resizeDrawingSurfaceToCanvas !== 'function') return false;
    try {
      var rect = $('rive-canvas').getBoundingClientRect();
      if (!rect.width || !rect.height) return false;
      inst.resizeDrawingSurfaceToCanvas(renderTier().dprCap);
      return true;
    } catch (e) { log('dpr cap error', e); return false; }
  }

  var state = {
    motionEnabled: false, // set by initMotion() from prefers-reduced-motion / stored raptorMotionOff
    riveLoaded: false,
    riveInstance: null,
    stageVisible: true,
    tabVisible: true,
    pointerOverStage: false,
    look: { x: 0, y: 0 },
    lookTarget: { x: 0, y: 0 },
    parallax: { x: 0, y: 0 },
    parallaxTarget: { x: 0, y: 0 },
    explainOn: false,
    focusOn: false,
    lastInteraction: null,
    lastEntranceAt: 0,
    lastTouchUpAt: 0,
    lookRaf: 0,
    riveLoadAt: 0,
    liveSwapped: false,
    firstFrame: null,
    splash: { seen: false, firstAtMs: null, lastAtMs: null, ended: false,
              previewHiddenForSplash: false },
  };
  var particleTweens = [];

  /* ---------------- helpers ---------------- */
  function $(id) { return document.getElementById(id); }
  function log() { if (window.console) console.log.apply(console, ['[agent-page]'].concat([].slice.call(arguments))); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function hasGsap() { return typeof window.gsap !== 'undefined'; }
  function vm() { return state.riveInstance && state.riveInstance.viewModelInstance; }

  /* ---------------- roster strip (all 12, status-aware) ---------------- */
  // The build step pre-renders {{ROSTER_HTML}}; this only builds the
  // strip when the slot is empty (template preview / missing build).
  // live -> <a> to the agent page; coming_soon -> <button> that reports
  // honestly and never navigates; strategy_core -> RAPTOR, flagged
  // STRATEGY CORE, also a button until its page exists.
  function buildRoster(agents) {
    var grid = $('roster-grid');
    if (!grid || grid.children.length) return;
    agents.forEach(function (a) {
      var live = a.status === 'live';
      var core = a.status === 'strategy_core';
      var isCurrent = a.slug === AGENT.slug;
      var el = document.createElement(live ? 'a' : 'button');
      el.type = live ? '' : 'button';
      el.className = 'agent-btn' + (live ? '' : ' coming-soon') + (core ? ' flagship' : '') + (isCurrent ? ' is-current' : '');
      el.setAttribute('aria-pressed', isCurrent ? 'true' : 'false');
      el.setAttribute('aria-label', a.num + ' ' + a.name + (live ? ', live' : core ? ', strategy core, coming soon' : ', coming soon — not rigged yet'));
      if (live) el.href = '../' + a.slug + '/';
      var img = document.createElement('img');
      img.src = '../../assets/' + a.portrait;
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.width = 450; img.height = 540;
      el.appendChild(img);
      var meta = document.createElement('div');
      meta.className = 'agent-meta';
      var num = document.createElement('div');
      num.className = 'agent-num';
      num.textContent = 'AGENT ' + a.num;
      var name = document.createElement('div');
      name.className = 'agent-name';
      name.textContent = a.name;
      var tag = document.createElement('span');
      if (core) { tag.className = 'agent-tag core'; tag.textContent = 'STRATEGY CORE'; }
      else { tag.className = 'agent-tag ' + (live ? 'live' : 'soon'); tag.textContent = live ? 'LIVE' : 'COMING SOON'; }
      meta.appendChild(num); meta.appendChild(name); meta.appendChild(tag);
      el.appendChild(meta);
      if (!live) {
        el.addEventListener('click', function () {
          var note = document.querySelector('.roster-note');
          if (note) note.textContent = t('roster.soonNote', { name: a.name });
        });
      }
      grid.appendChild(el);
    });
  }
  function loadRoster() {
    if (ROSTER && ROSTER.agents) { buildRoster(ROSTER.agents); return; }
    fetch(CONFIG_URL).then(function (r) { return r.json(); }).then(function (cfg) {
      ROSTER = cfg;
      buildRoster(cfg.agents || []);
    }).catch(function () { /* roster stays as the build rendered it (or empty) */ });
  }

  /* ---------------- GSAP entrance + particles (guarded, optional) ---------------- */
  function playEntrance() {
    if (!hasGsap() || !state.motionEnabled) return;
    var media = $('stage-media');
    try {
      window.gsap.fromTo(media,
        { opacity: 0, y: 26, scale: 0.985 },
        { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'power3.out', overwrite: 'auto',
          clearProps: 'transform,opacity' });
      state.lastEntranceAt = Date.now();
    } catch (e) { log('entrance error', e); }
  }
  function buildParticles(count) {
    var host = $('particles');
    if (!host || host.childNodes.length) return;
    var n = typeof count === 'number' ? count : 16;
    for (var i = 0; i < n; i++) {
      var dot = document.createElement('span');
      var size = 2 + Math.round(Math.random() * 3);
      dot.className = 'particle' + (Math.random() < 0.35 ? ' cyan' : '');
      dot.style.width = size + 'px';
      dot.style.height = size + 'px';
      dot.style.left = (4 + Math.random() * 92) + '%';
      dot.style.top = (6 + Math.random() * 80) + '%';
      host.appendChild(dot);
    }
  }
  function startParticles() {
    if (!hasGsap() || !state.motionEnabled) return;
    stopParticles();
    buildParticles(renderTier().particles);
    try {
      Array.prototype.forEach.call(document.querySelectorAll('.particle'), function (dot) {
        particleTweens.push(window.gsap.to(dot, {
          y: -(6 + Math.random() * 14),
          x: (Math.random() * 12 - 6),
          opacity: 0.25 + Math.random() * 0.5,
          duration: 6 + Math.random() * 6,
          repeat: -1, yoyo: true, ease: 'sine.inOut',
        }));
      });
    } catch (e) { log('particles error', e); }
  }
  function stopParticles() {
    particleTweens.forEach(function (t) { try { t.kill(); } catch (e) {} });
    particleTweens = [];
  }

  /* ---------------- motion toggle ---------------- */
  function applyMotion() {
    document.documentElement.classList.toggle('motion-off', !state.motionEnabled);
    var tgl = $('motion-toggle');
    if (tgl) tgl.setAttribute('aria-pressed', state.motionEnabled ? 'true' : 'false');
    var st = $('motion-state');
    if (st) st.textContent = state.motionEnabled ? 'ON' : 'OFF';
    if (state.motionEnabled) {
      startParticles();
    } else {
      stopParticles();
      state.parallax.x = 0; state.parallax.y = 0;
      state.parallaxTarget.x = 0; state.parallaxTarget.y = 0;
      var media = $('stage-media');
      if (media) { media.style.setProperty('--px', '0px'); media.style.setProperty('--py', '0px'); }
      if (state.lookRaf) { cancelAnimationFrame(state.lookRaf); state.lookRaf = 0; }
    }
    if (state.riveInstance) {
      if (state.motionEnabled && state.stageVisible && state.tabVisible) {
        state.riveInstance.play();
      } else {
        if (typeof state.riveInstance.pause === 'function') state.riveInstance.pause();
        if (typeof state.riveInstance.stopRendering === 'function') state.riveInstance.stopRendering();
      }
    }
  }
  function initMotion() {
    var prefersReduced = false;
    try { prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    var storedOff = null;
    try { storedOff = localStorage.getItem('raptorMotionOff'); } catch (e) {}
    // Stored dashboard preference wins; otherwise respect reduced-motion.
    state.motionEnabled = storedOff === '1' ? false : storedOff === '0' ? true : !prefersReduced;
    var tgl = $('motion-toggle');
    if (tgl) tgl.addEventListener('click', function () {
      state.motionEnabled = !state.motionEnabled;
      try { localStorage.setItem('raptorMotionOff', state.motionEnabled ? '0' : '1'); } catch (e) {}
      applyMotion();
      log('motion', state.motionEnabled ? 'ON' : 'OFF');
    });
    applyMotion();
  }

  /* ---------------- Rive: cleanup + loader ---------------- */
  function cleanupRive() {
    if (!state.riveInstance) return;
    try {
      if (typeof state.riveInstance.stopRendering === 'function') state.riveInstance.stopRendering();
      if (typeof state.riveInstance.cleanup === 'function') state.riveInstance.cleanup();
    } catch (e) { log('cleanup error', e); }
    state.riveInstance = null;
    state.riveLoaded = false;
  }

  /* ViewModel writers — each guarded so a missing/renamed property never
     breaks the page. API NOTE (@rive-app/canvas 2.55.1, vendored):
     number/boolean/trigger take ONLY the property path and return the
     property object — a value passed as a second argument is SILENTLY
     IGNORED. Assign on the returned object (.value = ...) and fire a
     trigger with .trigger(). */
  function setBoolean(name, value) {
    var v = vm();
    if (!v || typeof v.boolean !== 'function') return false;
    try {
      var prop = v.boolean(name);
      if (!prop) return false;
      prop.value = value;
      return true;
    } catch (e) { log('boolean error', name, e); return false; }
  }
  function setNumber(name, value) {
    var v = vm();
    if (!v || typeof v.number !== 'function') return false;
    try {
      var prop = v.number(name);
      if (!prop) return false;
      prop.value = value;
      return true;
    } catch (e) { log('number error', name, e); return false; }
  }
  function fireTrigger(name) {
    var v = vm();
    if (!v || typeof v.trigger !== 'function') return false;
    try {
      var prop = v.trigger(name);
      if (!prop || typeof prop.trigger !== 'function') return false;
      prop.trigger();
      return true;
    } catch (e) { log('trigger error', name, e); return false; }
  }
  // Public helpers (verification + the PRISM page's Explain wiring).
  function setLook(x, y) {
    state.lookTarget.x = clamp(+x || 0, -1, 1);
    state.lookTarget.y = clamp(+y || 0, -1, 1);
    state.look.x = state.lookTarget.x;
    state.look.y = state.lookTarget.y;
    if (state.riveLoaded) { setNumber('lookX', state.look.x); setNumber('lookY', state.look.y); }
    return { x: state.look.x, y: state.look.y };
  }
  function getLook() {
    var v = vm();
    if (!v || typeof v.number !== 'function') return null;
    try {
      var nx = v.number('lookX'), ny = v.number('lookY');
      return { lookX: nx && typeof nx.value !== 'undefined' ? nx.value : null,
               lookY: ny && typeof ny.value !== 'undefined' ? ny.value : null };
    } catch (e) { return { error: String(e) }; }
  }
  function fire(name) {
    if (name === 'greet' || name === 'interact') {
      state.lastInteraction = 'probe:' + name;
      return fireTrigger(name);
    }
    return false;
  }
  function setExplain(on) {
    state.explainOn = on;
    setBoolean('explain', on);
    var stage = $('stage');
    if (stage) stage.classList.toggle('is-explaining', on);
    if (!on && state.riveLoaded && !state.pointerOverStage) {
      state.focusOn = false;
      setBoolean('focus', false);
    }
    return state.explainOn;
  }

  function enableStateButtons() {
    Array.prototype.forEach.call(document.querySelectorAll('.state-btn'), function (btn) {
      btn.disabled = false;
      btn.setAttribute('aria-disabled', 'false');
      btn.title = 'Trigger the ' + btn.dataset.state.toUpperCase() + ' state';
      btn.addEventListener('click', function () { fireState(btn.dataset.state, btn); });
    });
    var note = document.querySelector('.controls-note');
    if (note) note.textContent = 'Live Rive file loaded. States drive the ' + (AGENT.name || 'agent') + ' state machine.';
  }
  function fireState(name, btn) {
    state.lastInteraction = 'dev:' + name;
    try {
      if (name === 'greet' || name === 'interact') {
        fireTrigger(name);
      } else if (name === 'focus' || name === 'explain' || name === 'paused') {
        var current = btn.classList.toggle('active');
        setBoolean(name, current);
        if (name === 'focus') state.focusOn = current;
        if (name === 'explain') { state.explainOn = current; var st = $('stage'); if (st) st.classList.toggle('is-explaining', current); }
        var r = state.riveInstance;
        if (name === 'paused' && current && r && typeof r.pause === 'function') r.pause();
        if (name === 'paused' && !current && r && typeof r.play === 'function') r.play();
      }
    } catch (e) { log('state fire error', name, e); }
  }

  /* ---------------- first-frame gate + Rive Free splash gate ---------------- */
  // Ported from staging.js (Stage 6 fix + branding addendum, 26 Nov 2026).
  // Thresholds sit far from both the black window (mean 0–0.64) and the
  // first character frame (mean ~19–37, fracBright ~0.23). Fallback: swap
  // anyway after 8 s so the page can never stick on LOADING; the swap
  // records fallback:true so verification can tell the paths apart.
  var FIRST_FRAME_MEAN_MIN = 10;
  var FIRST_FRAME_FRAC_MIN = 0.05;
  var FIRST_FRAME_CONFIRM_FRAMES = 2;
  var FIRST_FRAME_FALLBACK_MS = 8000;
  var SPLASH_WHITE_MIN = 15;
  var SPLASH_SEEN_FRAMES = 2;
  var SPLASH_END_QUIET_MS = 350;

  function sampleCanvasMean(canvas, probeCtx, probeCanvas) {
    try {
      probeCtx.drawImage(canvas, 0, 0, probeCanvas.width, probeCanvas.height);
      var d = probeCtx.getImageData(0, 0, probeCanvas.width, probeCanvas.height).data;
      var sum = 0, bright = 0, white = 0, n = probeCanvas.width * probeCanvas.height;
      for (var i = 0; i < d.length; i += 4) {
        var m = Math.max(d[i], d[i + 1], d[i + 2]);
        sum += (d[i] + d[i + 1] + d[i + 2]) / 3;
        if (m > 30) bright++;
        if (d[i] > 200 && d[i + 1] > 200 && d[i + 2] > 200) white++;
      }
      return { mean: sum / n, fracBright: bright / n, whiteN: white };
    } catch (e) {
      return null;
    }
  }
  function setBadgeLoading(text) {
    var badge = document.querySelector('.stage-badge');
    if (badge) badge.innerHTML = '<strong>' + t('badge.loading') + '</strong><span> &mdash; ' + text + '</span>';
  }
  function hidePreviewForSplash() {
    if (state.liveSwapped || state.splash.previewHiddenForSplash) return;
    state.splash.previewHiddenForSplash = true;
    $('static-preview').hidden = true;
    setBadgeLoading(t('badge.splash'));
    log('Rive splash visible — preview hidden so the branding shows');
  }
  function showPreviewAfterSplash() {
    if (state.liveSwapped || !state.splash.previewHiddenForSplash) return;
    state.splash.previewHiddenForSplash = false;
    $('static-preview').hidden = false;
    setBadgeLoading(t('badge.firstFrame'));
    log('Rive splash over — preview back for the gap before the first frame');
  }
  function goLive(inst, canvas, confirmed) {
    if (state.liveSwapped) return;
    state.liveSwapped = true;
    var msSinceLoad = Math.round(performance.now() - state.riveLoadAt);
    state.firstFrame = { confirmed: !!confirmed, msSinceLoad: msSinceLoad, fallback: !confirmed };
    $('static-preview').hidden = true;
    var badge = document.querySelector('.stage-badge');
    badge.classList.remove('loading');
    badge.innerHTML = '<strong>' + t('badge.live') + '</strong><span> &mdash; ' + (RIV_PATH || '') + ' loaded</span>';
    enableStateButtons();
    if (!state.motionEnabled && typeof inst.pause === 'function') inst.pause();
    log('Rive live: first frame ' + (confirmed ? 'confirmed' : 'fallback') + ' ' + msSinceLoad + ' ms after onLoad:', RIV_PATH);
  }
  function startFirstFrameProbe(inst, canvas) {
    if (!state.motionEnabled && typeof inst.play === 'function') inst.play();
    var probeCanvas = document.createElement('canvas');
    probeCanvas.width = 128;
    probeCanvas.height = 128;
    var probeCtx = probeCanvas.getContext('2d');
    if (!probeCtx) {
      setTimeout(function () { goLive(inst, canvas, false); }, FIRST_FRAME_FALLBACK_MS);
      return;
    }
    var goodFrames = 0;
    var splashFrames = 0;
    var splashLastSeenWall = 0;
    var stopped = false;
    var lastPlayRetry = performance.now();
    var fallbackTimer = setTimeout(function () {
      stopped = true;
      goLive(inst, canvas, false);
    }, FIRST_FRAME_FALLBACK_MS);
    (function tick() {
      if (stopped || state.liveSwapped) return;
      var s = sampleCanvasMean(canvas, probeCtx, probeCanvas);
      if (s) {
        var msSinceLoad = Math.round(performance.now() - state.riveLoadAt);
        var isSplashFrame = s.mean < FIRST_FRAME_MEAN_MIN && s.whiteN >= SPLASH_WHITE_MIN;
        if (!state.splash.seen) {
          if (isSplashFrame) {
            splashFrames++;
            if (splashFrames >= SPLASH_SEEN_FRAMES) {
              state.splash.seen = true;
              state.splash.firstAtMs = msSinceLoad;
              state.splash.lastAtMs = msSinceLoad;
              splashLastSeenWall = performance.now();
              hidePreviewForSplash();
            }
          } else {
            splashFrames = 0;
          }
        } else if (!state.splash.ended) {
          if (isSplashFrame) {
            state.splash.lastAtMs = msSinceLoad;
            splashLastSeenWall = performance.now();
          } else if (s.mean < FIRST_FRAME_MEAN_MIN &&
                     performance.now() - splashLastSeenWall >= SPLASH_END_QUIET_MS) {
            state.splash.ended = true;
            showPreviewAfterSplash();
          }
        }
        if (s.mean > FIRST_FRAME_MEAN_MIN && s.fracBright > FIRST_FRAME_FRAC_MIN) {
          goodFrames++;
          if (goodFrames >= FIRST_FRAME_CONFIRM_FRAMES) {
            clearTimeout(fallbackTimer);
            stopped = true;
            goLive(inst, canvas, true);
            return;
          }
        } else {
          goodFrames = 0;
          if (!state.motionEnabled && typeof inst.play === 'function' &&
              performance.now() - lastPlayRetry > 2000) {
            lastPlayRetry = performance.now();
            inst.play();
          }
        }
      } else {
        goodFrames = 0;
        splashFrames = 0;
      }
      requestAnimationFrame(tick);
    })();
  }

  function loadRive() {
    var canvas = $('rive-canvas');
    if (!canvas) return;
    var tier = renderTier();
    var dpr = Math.min(window.devicePixelRatio || 1, tier.dprCap);
    canvas.width = Math.round(696 * dpr);
    canvas.height = Math.round(832 * dpr);
    try {
      if (typeof rive === 'undefined' || !rive.RuntimeLoader) {
        log('Rive runtime not available; staying in static preview.');
        return;
      }
      // The wasm lives beside rive.js in assets/agents/; the rendered
      // page resolves it relative to the page (../../assets/agents/).
      rive.RuntimeLoader.setWasmUrl('../../assets/agents/rive.wasm');
      cleanupRive();
      var inst = new rive.Rive({
        src: RIV_URL,
        canvas: canvas,
        autoplay: state.motionEnabled,
        autoBind: true,
        stateMachines: STATE_MACHINE,
        onLoad: function () {
          state.riveInstance = inst;
          state.riveLoaded = true;
          state.riveLoadAt = performance.now();
          canvas.hidden = false;
          applyDprCap(inst);
          setBadgeLoading(t('badge.firstFrame'));
          startFirstFrameProbe(inst, canvas);
          log('Rive loaded (first frame pending):', RIV_URL);
        },
        onLoadError: function (e) {
          log('Rive load error (staying static):', e);
        },
      });
      state.riveInstance = inst;
    } catch (e) {
      log('Rive init error (staying static):', e);
    }
  }
  function setStaticBadge() {
    var badge = document.querySelector('.stage-badge');
    if (!badge) return;
    badge.classList.remove('loading');
    badge.innerHTML = '<strong>' + t('badge.static') + '</strong><span> &mdash; ' +
      (RIV_PATH ? 'live Rive file not found (' + RIV_PATH + '); showing the portrait still.'
                : 'no live Rive file for this agent yet; showing the portrait still.') + '</span>';
  }
  function tryLoadRive() {
    if (!RIV_PATH) { setStaticBadge(); log('No .riv configured for this agent — static preview mode.'); return; }
    // Try the rendered-page path first, then the config-relative path
    // (template preview from assets/agents/).
    fetch(RIV_URL, { method: 'HEAD' }).then(function (resp) {
      if (resp && resp.ok) { loadRive(); return; }
      if (RIV_URL !== RIV_PATH) {
        fetch(RIV_PATH, { method: 'HEAD' }).then(function (resp2) {
          if (resp2 && resp2.ok) { RIV_URL = RIV_PATH; loadRive(); }
          else { setStaticBadge(); log('No .riv (' + RIV_PATH + ') — static preview mode.'); }
        }).catch(function () { setStaticBadge(); });
      } else {
        setStaticBadge();
        log('No .riv (' + RIV_PATH + ' ' + (resp ? resp.status : 'no response') + ') — static preview mode.');
      }
    }).catch(function (err) {
      setStaticBadge();
      log('Could not check for .riv (' + err + ') — static preview mode.');
    });
  }

  /* ---------------- natural interaction: pointer tracking ---------------- */
  function lookTick() {
    state.lookRaf = 0;
    var dx = state.lookTarget.x - state.look.x;
    var dy = state.lookTarget.y - state.look.y;
    state.look.x += dx * 0.35;
    state.look.y += dy * 0.35;
    if (Math.abs(state.look.x) < 0.005 && Math.abs(state.lookTarget.x) < 0.005) state.look.x = state.lookTarget.x;
    if (Math.abs(state.look.y) < 0.005 && Math.abs(state.lookTarget.y) < 0.005) state.look.y = state.lookTarget.y;
    if (state.riveLoaded) {
      setNumber('lookX', state.look.x);
      setNumber('lookY', state.look.y);
    }
    var pdx = state.parallaxTarget.x - state.parallax.x;
    var pdy = state.parallaxTarget.y - state.parallax.y;
    state.parallax.x += pdx * 0.08;
    state.parallax.y += pdy * 0.08;
    if (Math.abs(state.parallax.x) < 0.02 && Math.abs(state.parallaxTarget.x) < 0.02) state.parallax.x = state.parallaxTarget.x;
    if (Math.abs(state.parallax.y) < 0.02 && Math.abs(state.parallaxTarget.y) < 0.02) state.parallax.y = state.parallaxTarget.y;
    var media = $('stage-media');
    if (media) {
      media.style.setProperty('--px', state.parallax.x.toFixed(2) + 'px');
      media.style.setProperty('--py', state.parallax.y.toFixed(2) + 'px');
    }
    if (Math.abs(dx) > 0.002 || Math.abs(dy) > 0.002 || Math.abs(pdx) > 0.02 || Math.abs(pdy) > 0.02) {
      state.lookRaf = requestAnimationFrame(lookTick);
    }
  }
  function kickLookLoop() {
    if (!state.lookRaf) state.lookRaf = requestAnimationFrame(lookTick);
  }
  function setLookTargetFromEvent(ev) {
    var media = $('stage-media');
    if (!media) return;
    var rect = media.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    var nx = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    var ny = ((ev.clientY - rect.top) / rect.height) * 2 - 1;
    state.lookTarget.x = clamp(nx, -1, 1);
    state.lookTarget.y = clamp(-ny, -1, 1);
    state.parallaxTarget.x = clamp(nx, -1, 1) * 8;
    state.parallaxTarget.y = clamp(ny, -1, 1) * 6;
    kickLookLoop();
  }
  function initStageInteraction() {
    var media = $('stage-media');
    if (!media) return;
    media.addEventListener('pointermove', function (ev) {
      if (ev.pointerType === 'touch') return;
      state.lastInteraction = 'pointer';
      setLookTargetFromEvent(ev);
    });
    media.addEventListener('pointerenter', function () {
      state.pointerOverStage = true;
      if (state.riveLoaded && !state.focusOn) {
        state.focusOn = true;
        setBoolean('focus', true);
      }
    });
    media.addEventListener('pointerleave', function () {
      state.pointerOverStage = false;
      state.lookTarget.x = 0;
      state.lookTarget.y = 0;
      state.parallaxTarget.x = 0;
      state.parallaxTarget.y = 0;
      kickLookLoop();
      if (state.riveLoaded && state.focusOn && !state.explainOn) {
        state.focusOn = false;
        setBoolean('focus', false);
      }
    });
    media.addEventListener('pointerup', function (ev) {
      if (ev.pointerType !== 'touch') return;
      state.lastTouchUpAt = Date.now();
      tapGesture();
    });
    media.addEventListener('click', function () {
      if (Date.now() - state.lastTouchUpAt < 700) return;
      tapGesture();
    });
    function tapGesture() {
      state.lastInteraction = 'tap';
      fireTrigger('interact');
      if (hasGsap() && state.motionEnabled) {
        try {
          window.gsap.fromTo('#rive-canvas, #static-preview',
            { scale: 1 }, { scale: 1.015, duration: 0.18, yoyo: true, repeat: 1, ease: 'sine.inOut', overwrite: 'auto',
              clearProps: 'transform' });
        } catch (e) { log('tap pulse error', e); }
      }
    }
    media.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        state.lastInteraction = 'tap';
        fireTrigger('interact');
      }
    });
  }

  /* ---------------- dev panel toggle ---------------- */
  function initDevPanel() {
    var toggle = $('dev-toggle');
    var body = $('dev-body');
    if (!toggle || !body) return;
    toggle.addEventListener('click', function () {
      var open = body.hidden;
      body.hidden = !open;
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? 'Hide dev controls' : t('dev.toggle');
    });
  }

  /* ---------------- pause plumbing: offscreen + tab hide + navigation ---------------- */
  function initPausePlumbing() {
    if ('IntersectionObserver' in window && $('stage')) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          state.stageVisible = entry.isIntersecting;
          applyMotion();
        });
      }, { threshold: 0.05 });
      io.observe($('stage'));
    }
    document.addEventListener('visibilitychange', function () {
      state.tabVisible = !document.hidden;
      applyMotion();
    });
    // Renderer cleaned up on navigation: one active renderer per page.
    window.addEventListener('pagehide', function () { cleanupRive(); });
    window.addEventListener('beforeunload', function () { cleanupRive(); });
    var resizeTimer = 0;
    window.addEventListener('resize', function () {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        resizeTimer = 0;
        if (state.riveInstance && state.riveLoaded) applyDprCap(state.riveInstance);
      }, 300);
    });
    // Reduced-motion flips mid-visit: stop the character + particles.
    try {
      window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', function (e) {
        if (e.matches) { state.motionEnabled = false; applyMotion(); }
      });
    } catch (err) {}
  }

  /* ---------------- language switch ---------------- */
  function initLangSwitch() {
    var box = $('lang-switch');
    if (!box) return;
    box.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-lang]');
      if (btn) setLang(btn.getAttribute('data-lang'));
    });
    window.addEventListener('raptor:lang', function (e) {
      if (e.detail && (e.detail.lang === 'id' || e.detail.lang === 'en')) applyI18n();
    });
    applyI18n();
  }

  /* ---------------- boot ---------------- */
  function boot() {
    initLangSwitch();
    initMotion();
    initStageInteraction();
    initDevPanel();
    initPausePlumbing();
    loadRoster();
    tryLoadRive(); // lazy: the .riv is fetched only when its agent page opens
    playEntrance();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Verification hook (read-only): mirrors window.__staging from the PoC.
  window.__agentPage = {
    get agent() { return AGENT.slug; },
    get mode() { return state.riveLoaded ? 'live' : 'static-preview'; },
    get motionEnabled() { return state.motionEnabled; },
    get riveLoaded() { return state.riveLoaded; },
    get firstFrame() { return state.firstFrame; },
    get splash() { return { seen: state.splash.seen, firstAtMs: state.splash.firstAtMs,
                            lastAtMs: state.splash.lastAtMs, ended: state.splash.ended,
                            previewHiddenForSplash: state.splash.previewHiddenForSplash }; },
    get liveSwapped() { return state.liveSwapped; },
    get look() { return { x: state.look.x, y: state.look.y, targetX: state.lookTarget.x, targetY: state.lookTarget.y }; },
    get explainOn() { return state.explainOn; },
    get focusOn() { return state.focusOn; },
    get lastInteraction() { return state.lastInteraction; },
    get lastEntranceAt() { return state.lastEntranceAt; },
    get gsapLoaded() { return hasGsap(); },
    get stageVisible() { return state.stageVisible; },
    get tabVisible() { return state.tabVisible; },
    get renderTier() {
      var tier = renderTier();
      return { name: tier.name, dprCap: tier.dprCap, particles: tier.particles,
               devicePixelRatio: window.devicePixelRatio || 1,
               backingW: (function () { var c = $('rive-canvas'); return c ? c.width : null; })(),
               backingH: (function () { var c = $('rive-canvas'); return c ? c.height : null; })() };
    },
    get parallax() { return { x: state.parallax.x, y: state.parallax.y,
                              targetX: state.parallaxTarget.x, targetY: state.parallaxTarget.y }; },
    setLook: setLook,
    getLook: getLook,
    fire: fire,
    setExplain: setExplain,
    cleanupRive: cleanupRive,
  };
})();
