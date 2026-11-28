/* Raptor Trade — Paper Trading page.
   Renders paper_trading.json (design doc §7.1, built by build.py from
   the paper-trading engine's output). Read-only: this page never
   touches the scanner, the engine, or publication. Missing data is
   shown as —, never estimated. No dummy data: when the engine file is
   absent (HTTP 404) the page shows the "awaiting first run" state.
   Bilingual (EN/ID): UI strings live in the T dictionary; the
   preference is shared with the main page through the same
   localStorage key (raptorLang). A ?data=<path> query param may point
   the page at an alternate JSON file (used by local render checks). */
(function () {
  "use strict";

  var DATA = null;

  /* ---------------------------------------------------------- language */
  var T = {
    en: {
      "rail.account": "Account", "rail.positions": "Positions",
      "rail.history": "History", "rail.liquidations": "Liquidations",
      "rail.skipped": "Skipped", "rail.fees": "Fees",
      "rail.research": "Research", "rail.home": "Home",
      "rail.homeAria": "Back to Signal Observatory",
      "banner.title": "PAPER TRADING — SIMULATION",
      "banner.sub": "Virtual money only. No real orders, no real funds.",
      "loading": "Loading paper trading data…",
      "loadError.title": "Paper trading data could not be loaded.",
      "loadError.sub": "The paper trading file (paper_trading.json) could not be parsed. The signal dashboard is unaffected.",
      "retry": "Retry",
      "awaiting.title": "Awaiting the first paper trading run.",
      "awaiting.sub": "The paper trading engine has not published its first result yet. This page fills in automatically once the engine runs — no positions, no trades, nothing simulated so far.",
      "hero.eyebrow": "PAPER TRADING · VIRTUAL $100 · LONG ONLY",
      "hero.title": "Simulated trading, <span>real signals</span>",
      "hero.sub": "Every production 4H LONG SIGNAL opens a virtual LONG position at a realistic post-signal price: $2 margin, TP +2%, no stop loss, cross margin. Positions close only on TP or liquidation. Nothing here moves real money.",
      "hero.disclaimer": "Simulation results are not trading results. Leverage and maintenance-margin data are labeled where they are estimates — see the constraints at the bottom of this page.",
      "sec.account.kicker": "01 — Account",
      "sec.account.title": "Account Summary",
      "sec.account.sub": "Virtual account across both wallets. Equity = wallet balance + unrealized PnL of open positions.",
      "sec.positions.kicker": "02 — Open positions",
      "sec.positions.title": "Open Positions",
      "sec.positions.sub": "Virtual LONG positions currently open. Mark price comes from the mark-price stream, sampled once per engine tick; TP triggers on the first 1m close at or above the TP price.",
      "sec.history.kicker": "03 — Trade history",
      "sec.history.title": "Closed Positions",
      "sec.history.sub": "Every closed virtual trade: TP exits and liquidations. Net PnL is after entry fee, exit/liquidation fee, and funding.",
      "sec.liq.kicker": "04 — Liquidations",
      "sec.liq.title": "Liquidation History",
      "sec.liq.sub": "Cross margin puts the whole sub-wallet at risk: when the margin ratio reaches 100%, all open positions in that wallet close at the triggering mark price.",
      "sec.skipped.kicker": "05 — Skipped signals",
      "sec.skipped.title": "Skipped Signals",
      "sec.skipped.sub": "Production signals that did NOT open a virtual position, and why. Skips are fail-closed: no price is ever invented to open a position.",
      "sec.fees.kicker": "06 — Costs & performance",
      "sec.fees.title": "Fees, Funding & Stats",
      "sec.fees.sub": "Costs use the public Binance VIP 0 schedule (taker 0.05%). Funding accrues from the mark-price stream (sampled once per engine tick) at each 8h settlement.",
      "panel.equity": "Equity curve",
      "panel.equity.sub": "Total virtual equity over time, from the $100 start. The dashed line is the starting balance.",
      "panel.costs": "Fees & funding breakdown",
      "panel.costs.sub": "Totals across all closed trades and open positions. A negative funding total means the virtual account paid funding; a positive total means it received funding.",
      "panel.feeds": "Data feeds & constraints",
      "th.symbol": "Symbol", "th.side": "Side", "th.entry": "Entry",
      "th.mark": "Mark", "th.tp": "TP", "th.lev": "Leverage",
      "th.size": "Size", "th.unrl": "Unreal. PnL (floating)", "th.roi": "ROI",
      "th.margin": "Margin", "th.feed": "Entry feed",
      "th.exitReason": "Exit", "th.exit": "Exit", "th.holding": "Holding",
      "th.gross": "Gross PnL", "th.net": "Net PnL", "th.fees": "Fees",
      "th.funding": "Funding", "th.time": "Time (WIB)",
      "th.wallet": "Wallet", "th.marginRatio": "Margin ratio",
      "th.posClosed": "Positions closed", "th.loss": "Loss",
      "th.reason": "Reason", "th.detail": "Detail",
      "th.signalTime": "Signal time (WIB)",
      "open.empty": "No open positions right now.",
      "closed.empty": "No closed trades yet.",
      "liq.empty": "No liquidations so far.",
      "skip.empty": "No skipped signals so far.",
      "foot.1": "Paper trading data is computed on the Raptor Trade VM from production 4H signals and official Binance data. Nothing here is a trading recommendation, and no virtual result predicts real trading.",
      "foot.2": "← Back to Signal Observatory",
      "foot.3": "AI Research →",
      "acct.initial": "Initial balance", "acct.balance": "Wallet balance",
      "acct.equity": "Total equity", "acct.available": "Available balance",
      "acct.used": "Used margin", "acct.ratio": "Margin ratio",
      "acct.return": "Total return",
      "acct.note": "Open positions: {o} · Closed: {c} · Skipped: {s}",
      "stat.tp": "TP hit rate", "stat.win": "Win rate",
      "stat.pf": "Profit factor", "stat.dd": "Max drawdown",
      "stat.holding": "Avg holding time", "stat.opened": "Positions opened",
      "stat.closedTp": "Closed by TP", "stat.liq": "Liquidated",
      "stat.skipped": "Signals skipped",
      "stat.ofClosed": "of {n} closed", "stat.positions": "positions",
      "fee.total": "Total fees", "fee.funding": "Total funding",
      "fee.netClosed": "Net PnL (closed)", "fee.unrl": "Unrealized PnL (floating)",
      "fee.noteFees": "Entry + exit / liquidation fees",
      "fee.noteFunding": "Paid (−) / received (+) at 8h settlements",
      "fee.noteNet": "After fees and funding",
      "fee.noteUnrl": "Mark-to-market, not yet realized",
      "feeds.mark": "Mark price", "feeds.funding": "Funding",
      "feeds.lastMark": "Last mark update",
      "eq.start": "Start", "eq.peak": "Peak", "eq.now": "Now",
      "eq.points": "{n} points",
      "open.count": "{n} open position(s) · {m} margin in use",
      "closed.count": "{n} closed trade(s)",
      "skip.count": "{n} skipped signal(s)",
      "venue.equity": "Equity", "venue.balance": "Wallet balance",
      "venue.available": "Available", "venue.used": "Used margin",
      "venue.ratio": "Margin ratio", "venue.return": "Total return",
      "venue.sub": "Sub-wallets: {s}",
      "lev.default": "{x}x (default 20x)",
      "reason.leverage_unknown": "Leverage unknown",
      "reason.below_min_notional": "Below min notional",
      "reason.below_1_contract": "Below 1 contract",
      "reason.zero_qty": "Zero quantity",
      "reason.insufficient_available_balance": "Insufficient balance",
      "reason.duplicate_signal": "Duplicate signal",
      "reason.no_1m_data": "No 1m data",
      "reason.no_mark_price": "No mark price",
      "reason.funding_unavailable": "Funding unavailable",
      "reason.symbol_not_in_universe": "Symbol not in universe",
      "reason.excluded_symbol": "Excluded symbol",
      "hero.meta": "Updated {t} · Config: ${i} virtual · $2 margin / position · TP +2% · leverage {lev} · MMR {mmr}",
      "data.freshness": "Data as of {t} WIB · Snapshot — updated when the engine publishes a new tick, then synced to this site about every 5 min. This page does not auto-refresh — reload for the latest snapshot.",
      "motion.on": "MOTION ON", "motion.off": "MOTION OFF"
    },
    id: {
      "rail.account": "Akun", "rail.positions": "Posisi",
      "rail.history": "Riwayat", "rail.liquidations": "Likuidasi",
      "rail.skipped": "Dilewati", "rail.fees": "Biaya",
      "rail.research": "Riset", "rail.home": "Beranda",
      "rail.homeAria": "Kembali ke Signal Observatory",
      "banner.title": "PAPER TRADING — SIMULASI",
      "banner.sub": "Uang virtual saja. Tanpa order nyata, tanpa dana nyata.",
      "loading": "Memuat data paper trading…",
      "loadError.title": "Data paper trading tidak bisa dimuat.",
      "loadError.sub": "File paper trading (paper_trading.json) tidak bisa diproses. Dashboard sinyal tidak terpengaruh.",
      "retry": "Coba lagi",
      "awaiting.title": "Menunggu run paper trading pertama.",
      "awaiting.sub": "Engine paper trading belum menerbitkan hasil pertamanya. Halaman ini terisi otomatis begitu engine berjalan — belum ada posisi, belum ada trade, belum ada yang disimulasikan.",
      "hero.eyebrow": "PAPER TRADING · VIRTUAL $100 · LONG ONLY",
      "hero.title": "Trading simulasi, <span>sinyal nyata</span>",
      "hero.sub": "Setiap LONG SIGNAL 4H produksi membuka posisi virtual LONG pada harga realistis pasca-sinyal: margin $2, TP +2%, tanpa stop loss, cross margin. Posisi tutup hanya saat TP atau likuidasi. Tidak ada uang nyata yang bergerak di sini.",
      "hero.disclaimer": "Hasil simulasi bukan hasil trading. Data leverage dan maintenance margin diberi label bila berupa estimasi — lihat batasan di bawah halaman ini.",
      "sec.account.kicker": "01 — Akun",
      "sec.account.title": "Ringkasan Akun",
      "sec.account.sub": "Akun virtual di kedua wallet. Equity = saldo wallet + PnL belum terealisasi dari posisi terbuka.",
      "sec.positions.kicker": "02 — Posisi terbuka",
      "sec.positions.title": "Posisi Terbuka",
      "sec.positions.sub": "Posisi virtual LONG yang sedang terbuka. Harga mark berasal dari stream mark-price, diambil sekali per tick engine; TP terpicu pada close 1m pertama di atau di atas harga TP.",
      "sec.history.kicker": "03 — Riwayat trade",
      "sec.history.title": "Posisi Tertutup",
      "sec.history.sub": "Setiap trade virtual yang tertutup: exit TP dan likuidasi. PnL bersih sudah dikurangi fee entry, fee exit/likuidasi, dan funding.",
      "sec.liq.kicker": "04 — Likuidasi",
      "sec.liq.title": "Riwayat Likuidasi",
      "sec.liq.sub": "Cross margin mempertaruhkan seluruh sub-wallet: saat margin ratio mencapai 100%, semua posisi terbuka di wallet itu tutup pada harga mark pemicu.",
      "sec.skipped.kicker": "05 — Sinyal dilewati",
      "sec.skipped.title": "Sinyal yang Dilewati",
      "sec.skipped.sub": "Sinyal produksi yang TIDAK membuka posisi virtual, beserta alasannya. Dilewati dengan fail-closed: harga tidak pernah dikarang untuk membuka posisi.",
      "sec.fees.kicker": "06 — Biaya & performa",
      "sec.fees.title": "Biaya, Funding & Statistik",
      "sec.fees.sub": "Biaya memakai jadwal publik Binance VIP 0 (taker 0,05%). Funding terakru dari stream mark-price (diambil sekali per tick engine) di setiap settlement 8 jam.",
      "panel.equity": "Kurva equity",
      "panel.equity.sub": "Total equity virtual dari waktu ke waktu, mulai dari $100. Garis putus-putus adalah saldo awal.",
      "panel.costs": "Rincian biaya & funding",
      "panel.costs.sub": "Total seluruh trade tertutup dan posisi terbuka. Total funding negatif berarti akun virtual membayar funding; positif berarti menerima funding.",
      "panel.feeds": "Feed data & batasan",
      "th.symbol": "Simbol", "th.side": "Sisi", "th.entry": "Entry",
      "th.mark": "Mark", "th.tp": "TP", "th.lev": "Leverage",
      "th.size": "Ukuran", "th.unrl": "PnL belum real. (floating)", "th.roi": "ROI",
      "th.margin": "Margin", "th.feed": "Feed entry",
      "th.exitReason": "Exit", "th.exit": "Keluar", "th.holding": "Durasi",
      "th.gross": "PnL kotor", "th.net": "PnL bersih", "th.fees": "Biaya",
      "th.funding": "Funding", "th.time": "Waktu (WIB)",
      "th.wallet": "Wallet", "th.marginRatio": "Margin ratio",
      "th.posClosed": "Posisi tertutup", "th.loss": "Rugi",
      "th.reason": "Alasan", "th.detail": "Detail",
      "th.signalTime": "Waktu sinyal (WIB)",
      "open.empty": "Tidak ada posisi terbuka saat ini.",
      "closed.empty": "Belum ada trade tertutup.",
      "liq.empty": "Belum ada likuidasi.",
      "skip.empty": "Belum ada sinyal yang dilewati.",
      "foot.1": "Data paper trading dihitung di VM Raptor Trade dari sinyal 4H produksi dan data resmi Binance. Tidak ada di sini yang merupakan rekomendasi trading, dan tidak ada hasil virtual yang memprediksi trading nyata.",
      "foot.2": "← Kembali ke Signal Observatory",
      "foot.3": "Riset AI →",
      "acct.initial": "Saldo awal", "acct.balance": "Saldo wallet",
      "acct.equity": "Total equity", "acct.available": "Saldo tersedia",
      "acct.used": "Margin terpakai", "acct.ratio": "Margin ratio",
      "acct.return": "Total return",
      "acct.note": "Posisi terbuka: {o} · Tertutup: {c} · Dilewati: {s}",
      "stat.tp": "TP hit rate", "stat.win": "Win rate",
      "stat.pf": "Profit factor", "stat.dd": "Max drawdown",
      "stat.holding": "Rata-rata durasi", "stat.opened": "Posisi dibuka",
      "stat.closedTp": "Tertutup oleh TP", "stat.liq": "Terlikuidasi",
      "stat.skipped": "Sinyal dilewati",
      "stat.ofClosed": "dari {n} tertutup", "stat.positions": "posisi",
      "fee.total": "Total biaya", "fee.funding": "Total funding",
      "fee.netClosed": "PnL bersih (tertutup)", "fee.unrl": "PnL belum terealisasi (floating)",
      "fee.noteFees": "Fee entry + exit / likuidasi",
      "fee.noteFunding": "Dibayar (−) / diterima (+) tiap settlement 8 jam",
      "fee.noteNet": "Setelah biaya dan funding",
      "fee.noteUnrl": "Mark-to-market, belum terealisasi",
      "feeds.mark": "Harga mark", "feeds.funding": "Funding",
      "feeds.lastMark": "Update mark terakhir",
      "eq.start": "Awal", "eq.peak": "Puncak", "eq.now": "Sekarang",
      "eq.points": "{n} titik",
      "open.count": "{n} posisi terbuka · margin terpakai {m}",
      "closed.count": "{n} trade tertutup",
      "skip.count": "{n} sinyal dilewati",
      "venue.equity": "Equity", "venue.balance": "Saldo wallet",
      "venue.available": "Tersedia", "venue.used": "Margin terpakai",
      "venue.ratio": "Margin ratio", "venue.return": "Total return",
      "venue.sub": "Sub-wallet: {s}",
      "lev.default": "{x}x (default 20x)",
      "reason.leverage_unknown": "Leverage tidak diketahui",
      "reason.below_min_notional": "Di bawah min notional",
      "reason.below_1_contract": "Di bawah 1 kontrak",
      "reason.zero_qty": "Kuantitas nol",
      "reason.insufficient_available_balance": "Saldo tidak cukup",
      "reason.duplicate_signal": "Sinyal duplikat",
      "reason.no_1m_data": "Tidak ada data 1m",
      "reason.no_mark_price": "Tidak ada harga mark",
      "reason.funding_unavailable": "Funding tidak tersedia",
      "reason.symbol_not_in_universe": "Simbol di luar universe",
      "reason.excluded_symbol": "Simbol dikecualikan",
      "hero.meta": "Diperbarui {t} · Konfigurasi: ${i} virtual · margin $2 / posisi · TP +2% · leverage {lev} · MMR {mmr}",
      "data.freshness": "Data per {t} WIB · Snapshot — diperbarui saat engine menerbitkan tick baru, lalu disinkronkan ke situs ini sekitar tiap 5 menit. Halaman ini tidak auto-refresh — muat ulang untuk snapshot terbaru.",
      "motion.on": "MOTION ON", "motion.off": "MOTION OFF"
    }
  };

  function lang() {
    try {
      var l = localStorage.getItem("raptorLang");
      if (l === "id" || l === "en") return l;
    } catch (e) { /* private mode — default */ }
    return "en";
  }
  function t(key, vars) {
    var dict = T[lang()] || T.en;
    var s = dict[key];
    if (s == null) s = T.en[key];
    if (s == null) return key;
    return String(s).replace(/\{(\w+)\}/g, function (_, k) {
      return vars && vars[k] != null ? vars[k] : "";
    });
  }
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function num(v, d) {
    if (v == null || v === "" || isNaN(Number(v))) return "—";
    return Number(v).toLocaleString(lang() === "id" ? "id-ID" : "en-US",
      { minimumFractionDigits: d == null ? 2 : d, maximumFractionDigits: d == null ? 2 : d });
  }
  function money(v) { return v == null || isNaN(Number(v)) ? "—" : "$" + num(v, 2); }
  function moneySigned(v) {
    if (v == null || isNaN(Number(v))) return "—";
    return (Number(v) >= 0 ? "+$" : "−$") + num(Math.abs(v), 2);
  }
  function pct(v, d) {
    if (v == null || isNaN(Number(v))) return "—";
    var s = num(v, d == null ? 1 : d);
    return (Number(v) >= 0 ? "+" : "−") + s.replace(/^−/, "") + "%";
  }
  function pctPlain(v, d) {
    if (v == null || isNaN(Number(v))) return "—";
    return num(v, d == null ? 1 : d) + "%";
  }
  function price(p) {
    if (p == null || isNaN(Number(p))) return "—";
    var v = Number(p);
    if (v >= 1000) return num(v, 2);
    if (v >= 100) return num(v, 3);
    if (v >= 1) return num(v, 4);
    return num(v, 6);
  }
  function cls(v) { return v == null ? "" : (Number(v) > 0 ? "pos" : (Number(v) < 0 ? "neg" : "")); }
  function fmtWib(ts) {
    if (!ts) return "—";
    try {
      return new Intl.DateTimeFormat(lang() === "id" ? "id-ID" : "en-GB", {
        timeZone: "Asia/Jakarta", day: "numeric", month: "short",
        hour: "2-digit", minute: "2-digit", hour12: false
      }).format(new Date(Number(ts) * 1000));
    } catch (e) { return "—"; }
  }
  function fmtHolding(sec) {
    if (sec == null || isNaN(Number(sec))) return "—";
    var s = Math.round(Number(sec));
    var d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600),
        m = Math.floor(s % 3600 / 60);
    if (d > 0) return d + "d " + h + "h";
    if (h > 0) return h + "h " + m + "m";
    if (m > 0) return m + "m";
    return s + "s";
  }
  function reasonLabel(code) {
    var k = "reason." + code;
    return T[lang()] && T[lang()][k] ? T[lang()][k] : (T.en[k] || code);
  }

  /* ---------------------------------------------------------- render */
  function statCard(label, value, note, valueCls) {
    return '<div class="stat-card"><p class="stat-label">' + esc(label) +
      '</p><p class="stat-value ' + (valueCls || "") + '">' + esc(value) +
      '</p><p class="stat-note">' + esc(note || "") + "</p></div>";
  }

  function renderAccount() {
    var tot = DATA.totals || {};
    var accts = DATA.accounts || {};
    var usd = accts["USD-M"] || {};
    var coin = accts["COIN-M"] || {};
    var open = DATA.open_positions || [];
    var closed = DATA.closed_positions || [];
    var skipped = DATA.skipped || [];
    var used = open.reduce(function (a, p) { return a + (Number(p.margin_used) || 0); }, 0);
    var avail = 0, ratio = null;
    Object.keys(accts).forEach(function (k) {
      avail += Number(accts[k].available) || 0;
    });
    var ratios = Object.keys(accts).map(function (k) { return Number(accts[k].margin_ratio_pct); })
      .filter(function (v) { return !isNaN(v); });
    var maxRatio = ratios.length ? Math.max.apply(null, ratios) : null;
    $("acct-stats").innerHTML =
      statCard(t("acct.initial"), money(tot.initial), "") +
      statCard(t("acct.balance"), money(sumField(accts, "wallet_balance")),
        t("acct.note", { o: open.length, c: closed.length, s: skipped.length })) +
      statCard(t("acct.equity"), money(tot.equity),
        t("acct.return") + ": " + pct(tot.total_return_pct),
        cls(tot.total_return_pct)) +
      statCard(t("acct.available"), money(avail), "") +
      statCard(t("acct.used"), money(used),
        open.length + " " + t("stat.positions")) +
      statCard(t("acct.ratio"), maxRatio == null ? "—" : pctPlain(maxRatio),
        maxRatio != null && maxRatio >= 100 ? "LIQUIDATED" : "", maxRatio != null && maxRatio >= 80 ? "warn" : "") +
      statCard(t("acct.return"), pct(tot.total_return_pct),
        "", cls(tot.total_return_pct));
    $("venue-cards").innerHTML = ["USD-M", "COIN-M"].map(function (name) {
      var a = accts[name] || {};
      var subs = a.sub_wallets || {};
      var subTxt = Object.keys(subs).map(function (k) {
        return k + " " + money(subs[k].balance);
      }).join(" · ") || "—";
      return '<div class="panel card"><p class="venue-name">' + esc(name) +
        '</p><p class="venue-equity ' + cls(a.total_return_pct) + '">' +
        esc(money(a.equity)) + '</p><p class="stat-note">' + esc(t("venue.return")) +
        ": " + esc(pct(a.total_return_pct)) + "</p><div class=\"venue-rows\">" +
        venueRow(t("venue.balance"), money(a.wallet_balance)) +
        venueRow(t("venue.available"), money(a.available)) +
        venueRow(t("venue.used"), money(a.used_margin)) +
        venueRow(t("venue.ratio"), a.margin_ratio_pct == null ? "—" : pctPlain(a.margin_ratio_pct)) +
        "</div><p class=\"venue-sub\">" + esc(t("venue.sub", { s: subTxt })) + "</p></div>";
    }).join("");
    renderEquity();
  }
  function sumField(accts, field) {
    var s = 0, any = false;
    Object.keys(accts).forEach(function (k) {
      if (accts[k][field] != null) { s += Number(accts[k][field]) || 0; any = true; }
    });
    return any ? s : null;
  }
  function venueRow(label, value) {
    return '<div class="venue-row"><span>' + esc(label) + "</span><span>" +
      esc(value) + "</span></div>";
  }

  function renderEquity() {
    var curve = DATA.equity_curve || [];
    var box = $("equity-chart");
    var initial = (DATA.totals || {}).initial;
    if (!curve.length || initial == null) {
      box.innerHTML = '<p class="table-empty">' + esc(t("closed.empty")) + "</p>";
      $("equity-meta").textContent = "";
      return;
    }
    var W = 720, H = 260, PL = 8, PR = 8, PT = 14, PB = 26;
    var vals = curve.map(function (p) { return Number(p.equity_total); });
    var min = Math.min.apply(null, vals.concat([initial]));
    var max = Math.max.apply(null, vals.concat([initial]));
    if (max - min < 0.01) { max = min + 1; }
    var pad = (max - min) * 0.08; min -= pad; max += pad;
    function X(i) { return PL + (curve.length === 1 ? W / 2 : i * (W - PL - PR) / (curve.length - 1)); }
    function Y(v) { return PT + (1 - (v - min) / (max - min)) * (H - PT - PB); }
    var pts = curve.map(function (p, i) { return X(i).toFixed(1) + "," + Y(Number(p.equity_total)).toFixed(1); }).join(" ");
    var area = PL + "," + Y(initial).toFixed(1) + " " + pts + " " + X(curve.length - 1).toFixed(1) + "," + Y(initial).toFixed(1);
    var last = curve[curve.length - 1];
    var peak = Math.max.apply(null, vals);
    var up = Number(last.equity_total) >= initial;
    box.innerHTML =
      '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Equity curve">' +
      '<line x1="' + PL + '" y1="' + Y(initial).toFixed(1) + '" x2="' + (W - PR) + '" y2="' + Y(initial).toFixed(1) +
      '" stroke="rgba(242,197,120,.6)" stroke-dasharray="5 4" stroke-width="1"/>' +
      '<polygon points="' + area + '" fill="' + (up ? "rgba(171,237,119,.10)" : "rgba(255,117,138,.10)") + '"/>' +
      '<polyline points="' + pts + '" fill="none" stroke="' + (up ? "#abed77" : "#ff758a") +
      '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<circle cx="' + X(curve.length - 1).toFixed(1) + '" cy="' + Y(Number(last.equity_total)).toFixed(1) +
      '" r="4" fill="' + (up ? "#abed77" : "#ff758a") + '"/>' +
      '<text x="' + PL + '" y="' + (H - 8) + '" fill="#819495" font-size="11" font-family="JetBrains Mono, monospace">' +
      esc(t("eq.start")) + " $" + num(initial, 2) + "</text>" +
      '<text x="' + (W - PR) + '" y="' + (H - 8) + '" fill="#819495" font-size="11" font-family="JetBrains Mono, monospace" text-anchor="end">' +
      esc(t("eq.now")) + " $" + num(last.equity_total, 2) + "</text>" +
      '<text x="' + (W / 2) + '" y="' + (H - 8) + '" fill="#819495" font-size="11" font-family="JetBrains Mono, monospace" text-anchor="middle">' +
      esc(t("eq.peak")) + " $" + num(peak, 2) + "</text></svg>";
    $("equity-meta").textContent = t("eq.points", { n: curve.length }) +
      " · " + t("eq.start") + " $" + num(initial, 2) + " · " +
      t("eq.peak") + " $" + num(peak, 2) + " · " +
      t("eq.now") + " $" + num(last.equity_total, 2);
  }

  function renderOpen() {
    var open = DATA.open_positions || [];
    var used = open.reduce(function (a, p) { return a + (Number(p.margin_used) || 0); }, 0);
    $("open-count").textContent = t("open.count", { n: open.length, m: money(used) });
    $("open-empty").hidden = open.length > 0;
    $("open-body").innerHTML = open.map(function (p) {
      var lev = p.leverage;
      var levTxt = lev != null ? lev + "x" : "—";
      if (p.leverage_label) levTxt += " · " + p.leverage_label.replace("LEVERAGE-DEFAULT-20x", "default-20x");
      return "<tr><td class=\"sym\">" + esc(p.symbol) + "<small>" + esc(p.market || "") +
        " · " + esc(fmtWib(p.entry_ts)) + "</small></td>" +
        "<td><span class=\"side-long\">LONG</span></td>" +
        "<td class=\"num\">" + esc(price(p.entry_price)) + "</td>" +
        "<td class=\"num\">" + esc(price(p.mark_price)) + "</td>" +
        "<td class=\"num\">" + esc(price(p.tp_price)) + "</td>" +
        "<td class=\"num\">" + esc(levTxt) + "</td>" +
        "<td class=\"num\">" + esc(p.qty == null ? "—" : num(p.qty, p.qty < 1 ? 4 : 2)) + "<br><small class=\"muted\">" +
        esc(money(p.notional)) + "</small></td>" +
        "<td class=\"num " + cls(p.unrealized_pnl) + "\">" + esc(moneySigned(p.unrealized_pnl)) + "</td>" +
        "<td class=\"num " + cls(p.roi_pct) + "\">" + esc(pct(p.roi_pct)) + "</td>" +
        "<td class=\"num\">" + esc(money(p.margin_used)) + "</td>" +
        "<td>" + esc(p.entry_feed || "—") + "</td></tr>";
    }).join("");
  }

  function renderClosed() {
    var closed = DATA.closed_positions || [];
    $("closed-count").textContent = t("closed.count", { n: closed.length });
    $("closed-empty").hidden = closed.length > 0;
    $("closed-body").innerHTML = closed.map(function (c) {
      var badge = c.exit_reason === "LIQUIDATION"
        ? '<span class="exit-liq">LIQUIDATION</span>'
        : '<span class="exit-tp">TP</span>';
      return "<tr><td class=\"sym\">" + esc(c.symbol) + "<small>" + esc(c.market || "") +
        " · " + esc(fmtWib(c.entry_ts)) + "</small></td>" +
        "<td>" + badge + "</td>" +
        "<td class=\"num\">" + esc(price(c.entry_price)) + "</td>" +
        "<td class=\"num\">" + esc(price(c.exit_price)) + "</td>" +
        "<td class=\"num\">" + esc(fmtHolding(c.holding_sec)) + "</td>" +
        "<td class=\"num " + cls(c.gross_pnl) + "\">" + esc(moneySigned(c.gross_pnl)) + "</td>" +
        "<td class=\"num " + cls(c.net_pnl) + "\">" + esc(moneySigned(c.net_pnl)) + "</td>" +
        "<td class=\"num " + cls(c.roi_net_pct) + "\">" + esc(pct(c.roi_net_pct)) + "</td>" +
        "<td class=\"num\">" + esc(money(c.fees_total)) + "</td>" +
        "<td class=\"num " + cls(c.funding_total) + "\">" + esc(moneySigned(c.funding_total)) + "</td></tr>";
    }).join("");
  }

  function renderLiquidations() {
    var liq = DATA.liquidations || [];
    $("liq-empty").hidden = liq.length > 0;
    $("liq-body").innerHTML = liq.map(function (l) {
      return "<tr><td>" + esc(fmtWib(l.ts)) + "</td><td>" + esc(l.wallet || "—") + "</td>" +
        "<td class=\"num neg\">" + esc(pctPlain(l.margin_ratio_pct)) + "</td>" +
        "<td class=\"num\">" + esc(l.positions_closed == null ? "—" : String(l.positions_closed)) + "</td>" +
        "<td class=\"num neg\">" + esc(moneySigned(l.loss)) + "</td></tr>";
    }).join("");
  }

  function renderSkipped() {
    var sk = DATA.skipped || [];
    $("skip-count").textContent = t("skip.count", { n: sk.length });
    $("skip-empty").hidden = sk.length > 0;
    $("skip-body").innerHTML = sk.map(function (s) {
      return "<tr><td class=\"sym\">" + esc(s.symbol) + "<small>" + esc(s.market || "") + "</small></td>" +
        "<td>" + esc(fmtWib(s.signal_ts)) + "</td>" +
        "<td><span class=\"reason-code\">" + esc(reasonLabel(s.reason)) + "</span><br><small class=\"muted\">" +
        esc(s.reason || "") + "</small></td>" +
        "<td class=\"detail\">" + esc(s.detail || "—") + "</td></tr>";
    }).join("");
  }

  function renderFeesStats() {
    var st = DATA.stats || {};
    var closed = DATA.closed_positions || [];
    var open = DATA.open_positions || [];
    var netClosed = closed.reduce(function (a, c) { return a + (Number(c.net_pnl) || 0); }, 0);
    var unrl = open.reduce(function (a, p) { return a + (Number(p.unrealized_pnl) || 0); }, 0);
    $("stats-grid").innerHTML =
      statCard(t("stat.tp"), st.tp_hit_rate_pct == null ? "—" : pctPlain(st.tp_hit_rate_pct),
        t("stat.ofClosed", { n: closed.length })) +
      statCard(t("stat.win"), st.win_rate_pct == null ? "—" : pctPlain(st.win_rate_pct),
        t("stat.ofClosed", { n: closed.length })) +
      statCard(t("stat.pf"), st.profit_factor == null ? "—" : num(st.profit_factor, 2), "") +
      statCard(t("stat.dd"), st.max_drawdown_pct == null ? "—" : pctPlain(st.max_drawdown_pct, 2), "") +
      statCard(t("stat.holding"), fmtHolding(st.avg_holding_sec), "") +
      statCard(t("stat.opened"), String(st.positions_opened == null ? open.length + closed.length : st.positions_opened), "") +
      statCard(t("stat.closedTp"), String(st.positions_closed_tp == null ? 0 : st.positions_closed_tp), "") +
      statCard(t("stat.liq"), String(st.positions_liquidated == null ? 0 : st.positions_liquidated), "") +
      statCard(t("stat.skipped"), String(st.signals_skipped == null ? (DATA.skipped || []).length : st.signals_skipped), "");
    $("fees-body").innerHTML = '<div class="fee-rows">' +
      feeRow(t("fee.total"), money(st.total_fees), t("fee.noteFees"), "") +
      feeRow(t("fee.funding"), moneySigned(st.total_funding), t("fee.noteFunding"), cls(st.total_funding)) +
      feeRow(t("fee.netClosed"), moneySigned(netClosed), t("fee.noteNet"), cls(netClosed)) +
      feeRow(t("fee.unrl"), moneySigned(unrl), t("fee.noteUnrl"), cls(unrl)) +
      "</div>";
    var feeds = DATA.feeds || {};
    var lastMark = feeds.last_mark_ts ? fmtWib(feeds.last_mark_ts) : "—";
    $("feeds-line").textContent = t("feeds.mark") + ": " + (feeds.mark_price || "—") +
      " · " + t("feeds.funding") + ": " + (feeds.funding || "—") +
      " · " + t("feeds.lastMark") + ": " + lastMark;
    var cons = DATA.constraints || [];
    $("constraints-list").innerHTML = cons.map(function (c) {
      return "<li>" + esc(c) + "</li>";
    }).join("");
  }
  function feeRow(label, value, note, valueCls) {
    return '<div class="fee-row"><p class="fee-label">' + esc(label) +
      '</p><p class="fee-value ' + (valueCls || "") + '">' + esc(value) +
      '</p><p class="fee-note">' + esc(note) + "</p></div>";
  }

  function renderHero() {
    var cfg = DATA.config || {};
    var lev = (cfg.leverage_mode || "—").replace("default-20x", "20x default");
    $("hero-meta").textContent = t("hero.meta", {
      t: fmtWib(DATA.generated_ts),
      i: cfg.initial_balance_usd == null ? "100" : String(cfg.initial_balance_usd),
      lev: lev, mmr: cfg.mmr_mode || "—"
    });
    $("data-freshness").textContent = t("data.freshness", { t: fmtWib(DATA.generated_ts) });
  }

  function renderAll() {
    renderStatic();
    if (!DATA) return;
    renderHero();
    renderAccount();
    renderOpen();
    renderClosed();
    renderLiquidations();
    renderSkipped();
    renderFeesStats();
  }
  function renderStatic() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-i18n]"), function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-i18n-html]"), function (el) {
      el.innerHTML = t(el.getAttribute("data-i18n-html"));
    });
    Array.prototype.forEach.call(document.querySelectorAll(".rail-link[data-section]"), function (a) {
      var sp = a.querySelector("span");
      var v = sp ? sp.textContent : t("rail." + a.getAttribute("data-section"));
      a.setAttribute("aria-label", v);
      a.title = v;
    });
    var home = document.querySelector('.rail-link[href="index.html"]');
    if (home) { home.setAttribute("aria-label", t("rail.homeAria")); home.title = t("rail.homeAria"); }
    updateLangButtons();
    refreshMotionToggle();
  }
  function updateLangButtons() {
    var l = lang();
    Array.prototype.forEach.call(document.querySelectorAll("#lang-switch [data-lang]"), function (btn) {
      var on = btn.getAttribute("data-lang") === l;
      btn.classList.toggle("active", on);
      btn.setAttribute("aria-pressed", String(on));
    });
    var lbl = document.querySelector(".lang-switch-label");
    if (lbl) lbl.textContent = l === "id" ? "Bahasa" : "Language";
  }
  function setLang(next) {
    if (next !== "id" && next !== "en") return;
    try { localStorage.setItem("raptorLang", next); } catch (e) {}
    document.documentElement.setAttribute("lang", next);
    document.documentElement.dataset.lang = next;
    renderAll();
  }
  var refreshMotionToggle = function () {};
  function initMotionToggle() {
    var btn = $("motion-toggle");
    if (!btn) return;
    refreshMotionToggle = function () {
      var off = false;
      try { off = localStorage.getItem("raptorMotionOff") === "1"; } catch (e) {}
      document.documentElement.classList.toggle("motion-off", off);
      var txt = btn.querySelector(".motion-text");
      if (txt) txt.textContent = t(off ? "motion.off" : "motion.on");
      btn.setAttribute("aria-pressed", String(off));
    };
    btn.addEventListener("click", function () {
      var off = !document.documentElement.classList.contains("motion-off");
      try { localStorage.setItem("raptorMotionOff", off ? "1" : "0"); } catch (e) {}
      refreshMotionToggle();
    });
    refreshMotionToggle();
  }

  /* ---------------------------------------------------------- load */
  function showError() {
    $("loading").hidden = true;
    $("load-error").hidden = false;
    $("awaiting").hidden = true;
    $("app").hidden = true;
  }
  function showAwaiting() {
    $("loading").hidden = true;
    $("load-error").hidden = true;
    $("awaiting").hidden = false;
    $("app").hidden = true;
  }
  function boot(data) {
    if (!data || typeof data !== "object" || !data.accounts || !data.totals ||
        !Array.isArray(data.open_positions) || !Array.isArray(data.closed_positions)) {
      showError();
      return;
    }
    DATA = data;
    $("loading").hidden = true;
    $("load-error").hidden = true;
    $("awaiting").hidden = true;
    $("app").hidden = false;
    renderAll();
  }
  function dataUrl() {
    try {
      var q = new URLSearchParams(window.location.search).get("data");
      if (q) return q;
    } catch (e) {}
    return "paper_trading.json";
  }
  function load() {
    $("loading").hidden = false;
    $("load-error").hidden = true;
    $("awaiting").hidden = true;
    $("app").hidden = true;
    fetch(dataUrl(), { cache: "no-store" })
      .then(function (r) {
        if (r.status === 404) { showAwaiting(); return null; }
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (d) { if (d) boot(d); })
      .catch(function () { showError(); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initMotionToggle();
    renderStatic();
    var langBox = $("lang-switch");
    if (langBox) {
      langBox.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-lang]");
        if (btn) setLang(btn.getAttribute("data-lang"));
      });
    }
    $("retry-load").addEventListener("click", load);
    load();
  });
})();
