/* Raptor data sync — v38 (24 Nov 2026, build-owned).
 *
 * The page's dataset (signals, KPIs, tracker results) is a build-time
 * snapshot embedded in the HTML, so an open page goes stale: Raka's
 * 13:00 WIB screenshot still showed n=348 after the backfill had
 * pushed n=355 at 12:26. The live price column ticks via WebSocket,
 * but nothing re-fetched the dataset.
 *
 * This layer polls the tiny content-stable meta.json (same directory,
 * no-store) — first check 5s after load, then every 5 min, plus on
 * tab visibility change — and compares it against the embedded data.
 * When the remote data is newer it shows a bottom toast with the new
 * counts and a one-tap Reload button. It NEVER reloads on its own:
 * a surprise reload while he is reading would lose his place (modal,
 * DDT selection, scroll). Dismissing hides the toast for that data
 * version only; a newer version shows it again. Fetch failures are
 * silent (offline) — the next poll retries.
 *
 * Works on both pages: main page reads window.RAPTOR_DATA, research
 * page reads window.RaptorResearchSync.getFingerprint() (exposed by
 * research.js once its data has loaded).
 */
(function () {
  'use strict';
  var POLL_MS = 5 * 60 * 1000;
  var FIRST_MS = 5000;
  var dismissedFor = null;
  var shownFor = null;
  var toastEl = null;

  function lang() {
    try {
      var l = (document.documentElement.lang || '').toLowerCase();
      if (l.indexOf('id') === 0) return 'id';
      var stored = window.localStorage && window.localStorage.getItem('raptorLang');
      if (stored) return stored === 'id' ? 'id' : 'en';
    } catch (e) { /* private mode: fall through */ }
    return 'en';
  }
  var T = {
    en: { avail: 'New data available', reload: 'Reload', close: 'Dismiss' },
    id: { avail: 'Data baru tersedia', reload: 'Muat ulang', close: 'Tutup' }
  };

  /* Embedded fingerprint for this page, or null when the page data
     has not loaded yet (research page fetches async). */
  function embedded() {
    var D = window.RAPTOR_DATA;
    if (D && D.kpis) {
      var lastTs = 0;
      (D.signals || []).forEach(function (s) {
        if (s.close_ts > lastTs) lastTs = s.close_ts;
      });
      return {
        page: 'main',
        total: D.kpis.total, n_eval: D.kpis.n_eval, wins: D.kpis.wins,
        mean_net: Math.round(D.kpis.mean_net * 10000) / 10000,
        last_signal_ts: lastTs
      };
    }
    if (window.RaptorResearchSync && window.RaptorResearchSync.getFingerprint) {
      var f = window.RaptorResearchSync.getFingerprint();
      if (f) { f.page = 'research'; return f; }
    }
    return null;
  }

  function differs(a, b) {
    if (!a || !b) return false;
    var keys = a.page === 'research'
      ? ['research_n_signals', 'research_n_eval30', 'research_n_paired']
      : ['total', 'n_eval', 'wins', 'mean_net', 'last_signal_ts'];
    for (var i = 0; i < keys.length; i++) {
      if (a[keys[i]] !== b[keys[i]]) return true;
    }
    return false;
  }

  function fmtPct(x, d) {
    return (x >= 0 ? '+' : '') + x.toFixed(d) + '%';
  }

  function summary(meta, page) {
    if (page === 'research') {
      return meta.research_n_signals + ' signals · ' +
        meta.research_n_paired + ' paired';
    }
    var win = meta.n_eval ? (meta.wins / meta.n_eval * 100) : 0;
    return meta.total + ' signals · win rate ' + win.toFixed(1) +
      '% · mean net ' + fmtPct(meta.mean_net, 2);
  }

  function ensureStyle() {
    if (document.getElementById('raptor-sync-style')) return;
    var st = document.createElement('style');
    st.id = 'raptor-sync-style';
    st.textContent =
      '#raptor-sync-toast{position:fixed;left:50%;bottom:18px;transform:translateX(-50%) translateY(80px);' +
      'display:flex;align-items:center;gap:10px;max-width:min(92vw,620px);padding:10px 12px 10px 14px;' +
      'background:#0c1620;border:1px solid rgba(185,243,138,.45);border-radius:12px;' +
      'box-shadow:0 10px 32px rgba(0,0,0,.55);color:#e8f2e4;font:13px/1.35 Inter,system-ui,sans-serif;' +
      'z-index:9999;opacity:0;transition:transform .35s ease,opacity .35s ease;pointer-events:none}' +
      '#raptor-sync-toast.show{transform:translateX(-50%) translateY(0);opacity:1;pointer-events:auto}' +
      '#raptor-sync-toast .rsync-dot{width:8px;height:8px;border-radius:50%;background:#b9f38a;flex:none;' +
      'box-shadow:0 0 0 0 rgba(185,243,138,.5);animation:rsyncPulse 2s infinite}' +
      '@keyframes rsyncPulse{0%{box-shadow:0 0 0 0 rgba(185,243,138,.45)}70%{box-shadow:0 0 0 7px rgba(185,243,138,0)}100%{box-shadow:0 0 0 0 rgba(185,243,138,0)}}' +
      '#raptor-sync-toast .rsync-text{flex:1;min-width:0}' +
      '#raptor-sync-toast button{flex:none;cursor:pointer;border-radius:8px;font:600 12px/1 Inter,system-ui,sans-serif}' +
      '#raptor-sync-toast .rsync-reload{padding:8px 12px;border:0;background:#b9f38a;color:#0a1206}' +
      '#raptor-sync-toast .rsync-dismiss{padding:8px 9px;border:1px solid rgba(255,255,255,.18);background:transparent;color:#9fb3a8}';
    document.head.appendChild(st);
  }

  function showToast(meta, page) {
    ensureStyle();
    var t = T[lang()];
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.id = 'raptor-sync-toast';
      toastEl.setAttribute('role', 'status');
      toastEl.innerHTML =
        '<span class="rsync-dot"></span><span class="rsync-text"></span>' +
        '<button type="button" class="rsync-reload"></button>' +
        '<button type="button" class="rsync-dismiss" aria-label="' + t.close + '">✕</button>';
      toastEl.querySelector('.rsync-reload').addEventListener('click', function () {
        window.location.reload();
      });
      toastEl.querySelector('.rsync-dismiss').addEventListener('click', function () {
        dismissedFor = shownFor;
        hideToast();
      });
      document.body.appendChild(toastEl);
    }
    toastEl.querySelector('.rsync-text').textContent =
      t.avail + ' — ' + summary(meta, page);
    toastEl.querySelector('.rsync-reload').textContent = t.reload;
    toastEl.classList.add('show');
  }

  function hideToast() {
    if (toastEl) toastEl.classList.remove('show');
  }

  function checkNow() {
    var emb = embedded();
    if (!emb) return Promise.resolve('not-ready');
    return fetch('meta.json', { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (meta) {
        var key = JSON.stringify(meta);
        if (!differs(emb, meta)) {
          if (shownFor === key) hideToast();
          shownFor = null;
          return 'current';
        }
        if (dismissedFor === key) return 'dismissed';
        shownFor = key;
        showToast(meta, emb.page);
        return 'new-data';
      })
      .catch(function () { return 'fetch-failed'; });
  }

  window.RaptorDataSync = {
    checkNow: checkNow,
    getState: function () {
      return { shownFor: shownFor, dismissedFor: dismissedFor };
    }
  };

  setTimeout(checkNow, FIRST_MS);
  setInterval(checkNow, POLL_MS);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) checkNow();
  });
})();
