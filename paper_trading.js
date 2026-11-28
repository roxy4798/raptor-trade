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
      "rail.orders": "Orders",
      "rail.history": "History", "rail.liquidations": "Liquidations",
      "rail.skipped": "Skipped", "rail.fees": "Fees",
      "rail.intel": "Intelligence", "rail.system": "System",
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
      "hero.sub": "Every production 4H LONG SIGNAL opens a virtual LONG position at a realistic post-signal price: $2 margin, TP +2% (+40% gross ROI at 20x fixed leverage), no stop loss, cross margin. Positions close only on TP or liquidation. Nothing here moves real money.",
      "hero.disclaimer": "Simulation results are not trading results. Leverage and maintenance-margin data are labeled where they are estimates — see the constraints at the bottom of this page.",
      "sec.account.kicker": "01 — Account",
      "sec.account.title": "Account Summary",
      "sec.account.sub": "Virtual account across both wallets. Equity = wallet balance + unrealized PnL of open positions.",
      "sec.positions.kicker": "02 — Open positions",
      "sec.positions.title": "Open Positions",
      "sec.positions.sub": "Virtual LONG positions currently open. Mark price is evaluated on every live markPrice update (continuous, event-driven — liquidation is checked on each update); TP fires the moment a live best bid reaches the TP price.",
      "sec.orders.kicker": "03 — Order history",
      "sec.orders.title": "Order History",
      "sec.orders.sub": "Every open attempt is an order: FILLED (with fill price and detection-to-fill latency — the time from signal detection to fill, not exchange matching latency) or REJECTED with the real reason. Orders are distinct from trades: a FILLED order becomes a position; a REJECTED order never does.",
      "sec.history.kicker": "04 — Trade history",
      "sec.history.title": "Closed Positions",
      "sec.history.sub": "Every closed virtual trade: TP exits and liquidations. Net PnL is after entry fee, exit/liquidation fee, and funding.",
      "sec.liq.kicker": "05 — Liquidations",
      "sec.liq.title": "Liquidation History",
      "sec.liq.sub": "Cross margin puts the whole sub-wallet at risk: when the margin ratio reaches 100%, all open positions in that wallet close at the triggering mark price.",
      "sec.skipped.kicker": "06 — Skipped signals",
      "sec.skipped.title": "Skipped Signals",
      "sec.skipped.sub": "Production signals that did NOT open a virtual position, and why. Skips are fail-closed: no price is ever invented to open a position.",
      "sec.fees.kicker": "07 — Costs & performance",
      "sec.fees.title": "Fees, Funding & Stats",
      "sec.fees.sub": "Costs use the public Binance VIP 0 schedule (taker 0.05%). Funding accrues from the mark-price stream at each contract's own settlement boundary (typically every 8h, per contract — never assumed).",
      "sec.intel.kicker": "08 — Performance intelligence",
      "sec.intel.title": "Performance Intelligence",
      "sec.intel.sub": "Thin by design for now: the numbers below are computed from the running simulation. Agent insights and recommendations arrive through the daily and weekly paper-trading reports (read-only — agents never change the strategy, add a stop loss, close a position, or auto-optimize the experiment).",
      "sec.system.kicker": "09 — System health",
      "sec.system.title": "System Health",
      "sec.system.sub": "Live market-data health. When data disconnects or goes stale, new entries pause (never a fill on a stale quote), position state is kept, and the gap is reconciled after recovery — positions are never assumed safe while monitoring is interrupted.",
      "panel.margin": "Margin analysis",
      "panel.margin.sub": "Per-venue cross-margin state. The margin ratio is the most at-risk (highest) sub-wallet ratio in that venue; a venue stops opening when its sub-wallets are stopped or its available balance falls below the $2.02 needed for one position.",
      "panel.pnl": "PnL analytics",
      "panel.pnl.sub": "Price change, gross ROI, and net ROI are three different numbers: a TP close is +2% price, +40% gross ROI at 20x, and a lower net ROI after entry/exit fees and funding. Unrealized PnL is floating (mark-to-market), not yet realized.",
      "panel.exec": "Execution analytics",
      "panel.exec.sub": "Built only from recorded orders — no estimated latency, no fabricated fills. Partial fills are not modeled (the engine fills whole orders at the live best bid/ask); depth-based fills are UNAVAILABLE until the depth feed is subscribed.",
      "panel.learning": "What the research agents are learning",
      "panel.learning.sub": "Fourteen topics, studied from the paper-trading ledgers (positions, trades, skips, funding, liquidations, execution records) — the same evidence the daily and weekly reports are built from.",
      "panel.gaps": "Monitoring gaps",
      "panel.gaps.sub": "Every interruption of market-data monitoring, with its reconciliation outcome. A gap reconciles once fresh marks exist for every open symbol, or after the 30s bounded wait (then marked incomplete).",
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
      "th.venue": "Venue", "th.used": "Used margin",
      "th.available": "Available", "th.status": "Status",
      "th.orderState": "State", "th.fill": "Fill price / reason",
      "th.latency": "Detection-to-fill",
      "th.gapStart": "Gap start (WIB)", "th.gapDur": "Duration",
      "th.gapReason": "Reason", "th.gapOpen": "Open at gap",
      "th.gapLiq": "Liquidations on reconcile", "th.gapMarks": "Marks",
      "open.empty": "No open positions right now.",
      "closed.empty": "No closed trades yet.",
      "liq.empty": "No liquidations so far.",
      "skip.empty": "No skipped signals so far.",
      "orders.empty": "No orders yet.",
      "gaps.empty": "No monitoring gaps so far.",
      "orders.count": "{f} filled · {r} rejected · {n} total",
      "order.filled": "FILLED", "order.rejected": "REJECTED",
      "exec.avg": "Avg detection-to-fill",
      "exec.median": "Median detection-to-fill",
      "exec.max": "Max detection-to-fill",
      "exec.filled": "Orders filled", "exec.rejected": "Orders rejected",
      "exec.rejects": "Top rejection reasons: {s}",
      "exec.rejectsNone": "No rejections recorded.",
      "pnl.realized": "Realized net PnL", "pnl.unrealized": "Unrealized PnL (floating)",
      "pnl.gross": "Gross PnL (closed)", "pnl.fees": "Total fees",
      "pnl.funding": "Total funding",
      "intel.win": "Win rate", "intel.pf": "Profit factor",
      "intel.tp": "TP hit rate", "intel.dd": "Max drawdown",
      "intel.ttp": "Avg time to TP", "intel.holding": "Avg holding time",
      "sys.ws": "WebSocket", "sys.healthy": "Data healthy",
      "sys.paused": "Entries paused", "sys.msgAge": "Last message age",
      "sys.gaps": "Monitoring gaps",
      "sys.yes": "Yes", "sys.no": "No", "sys.unknown": "Unknown",
      "sys.connected": "Connected", "sys.disconnected": "Disconnected",
      "margin.stopped": "STOPPED", "margin.active": "Active",
      "margin.exhausted": "Capital exhausted",
      "margin.partial": "Active · {n} stopped",
      "gaps.marksOk": "Fresh", "gaps.marksIncomplete": "Incomplete",
      "learn.1": "Trading performance (win rate, profit factor, net PnL)",
      "learn.2": "Entry quality (fill vs signal price, detection-to-fill)",
      "learn.3": "Execution quality (spread, slippage, rejections)",
      "learn.4": "TP hit rate and time to profit",
      "learn.5": "Floating loss while positions are open",
      "learn.6": "Capital growth over the experiment",
      "learn.7": "Capital efficiency (margin use vs return)",
      "learn.8": "Portfolio exposure (open positions, venues)",
      "learn.9": "Max drawdown and recovery",
      "learn.10": "Liquidation risk (margin ratio, stopped wallets)",
      "learn.11": "Market conditions around entries and exits",
      "learn.12": "Strategy weaknesses the fills expose",
      "learn.13": "Net profitability after all costs",
      "learn.14": "Consistency across closes and venues",
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
      "fee.noteFunding": "Paid (−) / received (+) at each contract's settlement",
      "fee.noteNet": "After fees and funding",
      "fee.noteUnrl": "Mark-to-market, not yet realized",
      "feeds.mark": "Mark price", "feeds.funding": "Funding",
      "feeds.lastMark": "Last mark update",
      "feeds.runnerLive": "Runner: live WS (event-driven) · Signal tail ~{s}s poll",
      "feeds.runnerTick": "Runner: 1m tick (replay / diagnostic)",
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
      "reason.wallet_stopped": "Wallet stopped",
      "reason.capital_exhausted": "Capital exhausted",
      "exhausted.title": "CAPITAL EXHAUSTED — no new positions",
      "exhausted.sub": "All virtual capital is gone. A liquidated sub-wallet is never topped up or reset — the experiment stops opening positions, and the loss history below is kept.",
      "stopped.title": "Stopped sub-wallets",
      "stopped.sub": "A liquidated sub-wallet stops operating forever — no top-up, no reset. Its loss history stays visible in the liquidation history below.",
      "stopped.badge": "STOPPED — no top-up",
      "stopped.wallet": "Wallet", "stopped.balance": "Balance at stop",
      "stopped.deficit": "Liquidation deficit",
      "stopped.when": "Stopped (WIB)",
      "stopped.empty": "No stopped sub-wallets.",
      "hero.meta": "Updated {t} · Config: ${i} virtual · $2 margin / position · TP +2% price · leverage {lev} · MMR {mmr}",
      "data.freshness": "Data as of {t} WIB · Snapshot — updated whenever the engine records an event (entry, TP, liquidation, funding), then synced to this site about every 5 min. This page does not auto-refresh — reload for the latest snapshot.",
      "motion.on": "MOTION ON", "motion.off": "MOTION OFF"
    },
    id: {
      "rail.account": "Akun", "rail.positions": "Posisi",
      "rail.orders": "Order",
      "rail.history": "Riwayat", "rail.liquidations": "Likuidasi",
      "rail.skipped": "Dilewati", "rail.fees": "Biaya",
      "rail.intel": "Intelijen", "rail.system": "Sistem",
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
      "hero.sub": "Setiap LONG SIGNAL 4H produksi membuka posisi virtual LONG pada harga realistis pasca-sinyal: margin $2, TP +2% (+40% ROI bruto di leverage 20x), tanpa stop loss, cross margin. Posisi tutup hanya saat TP atau likuidasi. Tidak ada uang nyata yang bergerak di sini.",
      "hero.disclaimer": "Hasil simulasi bukan hasil trading. Data leverage dan maintenance margin diberi label bila berupa estimasi — lihat batasan di bawah halaman ini.",
      "sec.account.kicker": "01 — Akun",
      "sec.account.title": "Ringkasan Akun",
      "sec.account.sub": "Akun virtual di kedua wallet. Equity = saldo wallet + PnL belum terealisasi dari posisi terbuka.",
      "sec.positions.kicker": "02 — Posisi terbuka",
      "sec.positions.title": "Posisi Terbuka",
      "sec.positions.sub": "Posisi virtual LONG yang sedang terbuka. Harga mark dievaluasi pada setiap update markPrice live (kontinu, event-driven — likuidasi diperiksa di setiap update); TP terpicu saat bid live terbaik mencapai harga TP.",
      "sec.orders.kicker": "03 — Riwayat order",
      "sec.orders.title": "Riwayat Order",
      "sec.orders.sub": "Setiap percobaan buka posisi adalah satu order: FILLED (dengan harga fill dan latensi deteksi-ke-fill — waktu dari deteksi sinyal sampai fill, bukan latensi matching exchange) atau REJECTED dengan alasan sebenarnya. Order berbeda dari trade: order FILLED menjadi posisi; order REJECTED tidak pernah jadi posisi.",
      "sec.history.kicker": "04 — Riwayat trade",
      "sec.history.title": "Posisi Tertutup",
      "sec.history.sub": "Setiap trade virtual yang tertutup: exit TP dan likuidasi. PnL bersih sudah dikurangi fee entry, fee exit/likuidasi, dan funding.",
      "sec.liq.kicker": "05 — Likuidasi",
      "sec.liq.title": "Riwayat Likuidasi",
      "sec.liq.sub": "Cross margin mempertaruhkan seluruh sub-wallet: saat margin ratio mencapai 100%, semua posisi terbuka di wallet itu tutup pada harga mark pemicu.",
      "sec.skipped.kicker": "06 — Sinyal dilewati",
      "sec.skipped.title": "Sinyal yang Dilewati",
      "sec.skipped.sub": "Sinyal produksi yang TIDAK membuka posisi virtual, beserta alasannya. Dilewati dengan fail-closed: harga tidak pernah dikarang untuk membuka posisi.",
      "sec.fees.kicker": "07 — Biaya & performa",
      "sec.fees.title": "Biaya, Funding & Statistik",
      "sec.fees.sub": "Biaya memakai jadwal publik Binance VIP 0 (taker 0,05%). Funding terakru dari stream mark-price pada setiap boundary settlement kontraknya sendiri (umumnya tiap 8 jam, per kontrak — bukan asumsi).",
      "sec.intel.kicker": "08 — Intelijen performa",
      "sec.intel.title": "Intelijen Performa",
      "sec.intel.sub": "Sengaja tipis untuk sekarang: angka di bawah dihitung dari simulasi yang sedang jalan. Insight dan rekomendasi agent datang lewat laporan paper-trading harian dan mingguan (read-only — agent tidak pernah mengubah strategi, menambah stop loss, menutup posisi, atau mengoptimasi eksperimen secara otomatis).",
      "sec.system.kicker": "09 — Kesehatan sistem",
      "sec.system.title": "Kesehatan Sistem",
      "sec.system.sub": "Kesehatan market data live. Saat data putus atau kedaluwarsa, entry baru dijeda (tidak pernah fill pada harga kedaluwarsa), state posisi dipertahankan, dan gap direkonsiliasi setelah pulih — posisi tidak pernah dianggap aman selama monitoring terputus.",
      "panel.margin": "Analisis margin",
      "panel.margin.sub": "State cross-margin per venue. Margin ratio adalah rasio sub-wallet paling berisiko (tertinggi) di venue itu; venue berhenti membuka saat sub-wallet-nya berhenti atau saldo tersedianya di bawah $2,02 yang dibutuhkan untuk satu posisi.",
      "panel.pnl": "Analisis PnL",
      "panel.pnl.sub": "Perubahan harga, ROI bruto, dan ROI bersih adalah tiga angka berbeda: penutupan TP adalah +2% harga, +40% ROI bruto di 20x, dan ROI bersih yang lebih rendah setelah fee entry/exit dan funding. PnL belum terealisasi masih floating (mark-to-market), belum terealisasi.",
      "panel.exec": "Analisis eksekusi",
      "panel.exec.sub": "Dibangun hanya dari order yang tercatat — tanpa latensi estimasi, tanpa fill yang dikarang. Partial fill tidak dimodelkan (engine mengisi seluruh order pada best bid/ask live); fill berbasis depth UNAVAILABLE sampai feed depth di-subscribe.",
      "panel.learning": "Yang dipelajari para agent riset",
      "panel.learning.sub": "Empat belas topik, dipelajari dari ledger paper-trading (posisi, trade, skip, funding, likuidasi, catatan eksekusi) — bukti yang sama dengan yang dipakai laporan harian dan mingguan.",
      "panel.gaps": "Gap monitoring",
      "panel.gaps.sub": "Setiap interupsi monitoring market data, beserta hasil rekonsiliasinya. Gap direkonsiliasi begitu mark segar tersedia untuk semua simbol terbuka, atau setelah jeda terbatas 30 detik (lalu ditandai tidak lengkap).",
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
      "th.venue": "Venue", "th.used": "Margin terpakai",
      "th.available": "Tersedia", "th.status": "Status",
      "th.orderState": "State", "th.fill": "Harga fill / alasan",
      "th.latency": "Deteksi-ke-fill",
      "th.gapStart": "Mulai gap (WIB)", "th.gapDur": "Durasi",
      "th.gapReason": "Alasan", "th.gapOpen": "Terbuka saat gap",
      "th.gapLiq": "Likuidasi saat rekonsiliasi", "th.gapMarks": "Mark",
      "open.empty": "Tidak ada posisi terbuka saat ini.",
      "closed.empty": "Belum ada trade tertutup.",
      "liq.empty": "Belum ada likuidasi.",
      "skip.empty": "Belum ada sinyal yang dilewati.",
      "orders.empty": "Belum ada order.",
      "gaps.empty": "Belum ada gap monitoring.",
      "orders.count": "{f} filled · {r} rejected · {n} total",
      "order.filled": "FILLED", "order.rejected": "REJECTED",
      "exec.avg": "Rata-rata deteksi-ke-fill",
      "exec.median": "Median deteksi-ke-fill",
      "exec.max": "Maks deteksi-ke-fill",
      "exec.filled": "Order filled", "exec.rejected": "Order rejected",
      "exec.rejects": "Alasan penolakan teratas: {s}",
      "exec.rejectsNone": "Tidak ada penolakan tercatat.",
      "pnl.realized": "PnL bersih terealisasi", "pnl.unrealized": "PnL belum terealisasi (floating)",
      "pnl.gross": "PnL kotor (tertutup)", "pnl.fees": "Total biaya",
      "pnl.funding": "Total funding",
      "intel.win": "Win rate", "intel.pf": "Profit factor",
      "intel.tp": "TP hit rate", "intel.dd": "Max drawdown",
      "intel.ttp": "Rata-rata waktu ke TP", "intel.holding": "Rata-rata durasi",
      "sys.ws": "WebSocket", "sys.healthy": "Data sehat",
      "sys.paused": "Entry dijeda", "sys.msgAge": "Umur pesan terakhir",
      "sys.gaps": "Gap monitoring",
      "sys.yes": "Ya", "sys.no": "Tidak", "sys.unknown": "Tidak diketahui",
      "sys.connected": "Terhubung", "sys.disconnected": "Terputus",
      "margin.stopped": "STOPPED", "margin.active": "Aktif",
      "margin.exhausted": "Modal habis",
      "margin.partial": "Aktif · {n} berhenti",
      "gaps.marksOk": "Segar", "gaps.marksIncomplete": "Tidak lengkap",
      "learn.1": "Performa trading (win rate, profit factor, PnL bersih)",
      "learn.2": "Kualitas entry (fill vs harga sinyal, deteksi-ke-fill)",
      "learn.3": "Kualitas eksekusi (spread, slippage, penolakan)",
      "learn.4": "TP hit rate dan waktu ke profit",
      "learn.5": "Floating loss selama posisi terbuka",
      "learn.6": "Pertumbuhan modal selama eksperimen",
      "learn.7": "Efisiensi modal (pemakaian margin vs return)",
      "learn.8": "Eksposur portofolio (posisi terbuka, venue)",
      "learn.9": "Max drawdown dan pemulihan",
      "learn.10": "Risiko likuidasi (margin ratio, wallet berhenti)",
      "learn.11": "Kondisi pasar di sekitar entry dan exit",
      "learn.12": "Kelemahan strategi yang terungkap dari fill",
      "learn.13": "Profitabilitas bersih setelah semua biaya",
      "learn.14": "Konsistensi antar close dan antar venue",
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
      "fee.noteFunding": "Dibayar (−) / diterima (+) tiap settlement kontrak",
      "fee.noteNet": "Setelah biaya dan funding",
      "fee.noteUnrl": "Mark-to-market, belum terealisasi",
      "feeds.mark": "Harga mark", "feeds.funding": "Funding",
      "feeds.lastMark": "Update mark terakhir",
      "feeds.runnerLive": "Runner: live WS (event-driven) · Ekor sinyal poll ~{s} dtk",
      "feeds.runnerTick": "Runner: tick 1m (replay / diagnostik)",
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
      "reason.wallet_stopped": "Wallet berhenti",
      "reason.capital_exhausted": "Modal habis",
      "exhausted.title": "CAPITAL EXHAUSTED — tidak ada posisi baru",
      "exhausted.sub": "Seluruh modal virtual habis. Sub-wallet yang terlikuidasi tidak pernah di-top-up atau di-reset — eksperimen berhenti membuka posisi, dan riwayat kerugiannya tetap disimpan.",
      "stopped.title": "Sub-wallet yang berhenti",
      "stopped.sub": "Sub-wallet yang terlikuidasi berhenti beroperasi selamanya — tanpa top-up, tanpa reset. Riwayat kerugiannya tetap terlihat di riwayat likuidasi di bawah.",
      "stopped.badge": "BERHENTI — tanpa top-up",
      "stopped.wallet": "Wallet", "stopped.balance": "Saldo saat berhenti",
      "stopped.deficit": "Defisit likuidasi",
      "stopped.when": "Berhenti (WIB)",
      "stopped.empty": "Tidak ada sub-wallet yang berhenti.",
      "hero.meta": "Diperbarui {t} · Konfigurasi: ${i} virtual · margin $2 / posisi · TP +2% harga · leverage {lev} · MMR {mmr}",
      "data.freshness": "Data per {t} WIB · Snapshot — diperbarui setiap kali engine mencatat event (entry, TP, likuidasi, funding), lalu disinkronkan ke situs ini sekitar tiap 5 menit. Halaman ini tidak auto-refresh — muat ulang untuk snapshot terbaru.",
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
  function assetNum(v) {
    // A margin-asset amount (e.g. BTC 0.00003333): up to 8 decimals,
    // trailing zeros trimmed, never rendered as $.
    if (v == null || isNaN(Number(v))) return "—";
    var s = Number(v).toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
    return s === "" || s === "-0" ? "0" : s;
  }
  function usdVal(v, fallback) {
    // Prefer the USD-denominated field when the engine provides one
    // (COIN-M records are coin-denominated); fall back to the raw
    // field so older JSON (e.g. the render fixture) is unchanged.
    if (v != null && !isNaN(Number(v))) return Number(v);
    return fallback;
  }
  function pct(v, d) {
    if (v == null || isNaN(Number(v))) return "—";
    var s = num(v, d == null ? 1 : d);
    // toLocaleString emits ASCII "-" for negatives (both locales), not
    // the Unicode "−" used for the sign — strip either, else a negative
    // renders as "−-45.0%" (caught by the real-engine render check,
    // 29 Nov 2026; the fixture's own -45.0% liquidation ROI showed it).
    return (Number(v) >= 0 ? "+" : "−") + s.replace(/^[−-]/, "") + "%";
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
    var used = open.reduce(function (a, p) { return a + (Number(usdVal(p.margin_used_usd, p.margin_used)) || 0); }, 0);
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
        // Stablecoin sub-wallets are ~$1:1; coin sub-wallets show the
        // raw asset amount (a BTC balance rendered as "$0.00" would lie).
        var stable = ["USDT", "USDC", "USD1", "U"].indexOf(k) >= 0;
        var w = subs[k];
        var txt = k + " " + (stable ? money(w.balance) : assetNum(w.balance));
        if (w.status === "stopped") txt += " · " + t("stopped.badge");
        return txt;
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
    var used = open.reduce(function (a, p) { return a + (Number(usdVal(p.margin_used_usd, p.margin_used)) || 0); }, 0);
    $("open-count").textContent = t("open.count", { n: open.length, m: money(used) });
    $("open-empty").hidden = open.length > 0;
    $("open-body").innerHTML = open.map(function (p) {
      var lev = p.leverage;
      var levTxt = lev != null ? lev + "x" : "—";
      if (p.leverage_label) levTxt += " · " + p.leverage_label;
      return "<tr><td class=\"sym\">" + esc(p.symbol) + "<small>" + esc(p.market || "") +
        " · " + esc(fmtWib(p.entry_ts)) + "</small></td>" +
        "<td><span class=\"side-long\">LONG</span></td>" +
        "<td class=\"num\">" + esc(price(p.entry_price)) + "</td>" +
        "<td class=\"num\">" + esc(price(p.mark_price)) + "</td>" +
        "<td class=\"num\">" + esc(price(p.tp_price)) + "</td>" +
        "<td class=\"num\">" + esc(levTxt) + "</td>" +
        "<td class=\"num\">" + esc(p.qty == null ? "—" : num(p.qty, p.qty < 1 ? 4 : 2)) + "<br><small class=\"muted\">" +
        esc(money(p.notional)) + "</small></td>" +
        "<td class=\"num " + cls(usdVal(p.unrealized_pnl_usd, p.unrealized_pnl)) + "\">" + esc(moneySigned(usdVal(p.unrealized_pnl_usd, p.unrealized_pnl))) + "</td>" +
        "<td class=\"num " + cls(p.roi_pct) + "\">" + esc(pct(p.roi_pct)) + "</td>" +
        "<td class=\"num\">" + esc(money(usdVal(p.margin_used_usd, p.margin_used))) + "</td>" +
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
        "<td class=\"num " + cls(usdVal(c.gross_pnl_usd, c.gross_pnl)) + "\">" + esc(moneySigned(usdVal(c.gross_pnl_usd, c.gross_pnl))) + "</td>" +
        "<td class=\"num " + cls(usdVal(c.net_pnl_usd, c.net_pnl)) + "\">" + esc(moneySigned(usdVal(c.net_pnl_usd, c.net_pnl))) + "</td>" +
        "<td class=\"num " + cls(c.roi_net_pct) + "\">" + esc(pct(c.roi_net_pct)) + "</td>" +
        "<td class=\"num\">" + esc(money(usdVal(c.fees_total_usd, c.fees_total))) + "</td>" +
        "<td class=\"num " + cls(usdVal(c.funding_total_usd, c.funding_total)) + "\">" + esc(moneySigned(usdVal(c.funding_total_usd, c.funding_total))) + "</td></tr>";
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

  /* Margin analysis (section 01 panel): per-venue cross-margin state
     from DATA.accounts. */
  function renderMargin() {
    var accts = DATA.accounts || {};
    $("margin-body").innerHTML = Object.keys(accts).map(function (m) {
      var a = accts[m];
      var subs = a.sub_wallets || {};
      var keys = Object.keys(subs);
      var stopped = keys.filter(function (k) {
        return subs[k].status === "stopped";
      }).length;
      var status;
      if ((DATA.experiment_status || "ACTIVE") === "CAPITAL EXHAUSTED") {
        status = t("margin.exhausted");
      } else if (stopped > 0 && stopped === keys.length) {
        status = t("margin.stopped");
      } else if (stopped > 0) {
        status = t("margin.partial", { n: stopped });
      } else {
        status = t("margin.active");
      }
      return "<tr><td class=\"sym\">" + esc(m) + "</td>" +
        "<td class=\"num\">" + esc(pctPlain(a.margin_ratio_pct)) + "</td>" +
        "<td class=\"num\">" + esc(money(a.used_margin)) + "</td>" +
        "<td class=\"num\">" + esc(money(a.available)) + "</td>" +
        "<td>" + esc(status) + "</td></tr>";
    }).join("");
  }

  /* Order history (section 03) + execution analytics panel. Orders
     are the FILLED/REJECTED lifecycle records, newest first. */
  function renderOrders() {
    var orders = (DATA.orders || []).slice().reverse();
    var filled = orders.filter(function (o) { return o.state === "FILLED"; });
    var rejected = orders.filter(function (o) { return o.state === "REJECTED"; });
    $("order-count").textContent = t("orders.count", {
      f: filled.length, r: rejected.length, n: orders.length });
    $("orders-empty").hidden = orders.length > 0;
    $("orders-body").innerHTML = orders.map(function (o) {
      var state = o.state === "FILLED" ? t("order.filled") : t("order.rejected");
      var fill = o.state === "FILLED" ? price(o.fill_price) : reasonLabel(o.reject_reason);
      var lev = o.leverage == null ? "—" : String(o.leverage) + "x";
      return "<tr><td class=\"sym\">" + esc(o.symbol) + "<small>" + esc(o.market || "") + "</small></td>" +
        "<td><span class=\"" + (o.state === "FILLED" ? "pos" : "neg") + "\">" + esc(state) + "</span></td>" +
        "<td class=\"num\">" + esc(fill) + "</td>" +
        "<td class=\"num\">" + esc(fmtHolding(o.detection_to_fill_sec)) + "</td>" +
        "<td class=\"num\">" + esc(lev) + "</td>" +
        "<td>" + esc(fmtWib(o.ts)) + "</td></tr>";
    }).join("");
    var lat = filled.map(function (o) { return Number(o.detection_to_fill_sec); })
      .filter(function (v) { return !isNaN(v); }).sort(function (a, b) { return a - b; });
    var avg = lat.length ? lat.reduce(function (a, b) { return a + b; }, 0) / lat.length : null;
    var med = lat.length ? lat[Math.floor(lat.length / 2)] : null;
    var max = lat.length ? lat[lat.length - 1] : null;
    $("exec-stats").innerHTML =
      statCard(t("exec.avg"), fmtHolding(avg), "") +
      statCard(t("exec.median"), fmtHolding(med), "") +
      statCard(t("exec.max"), fmtHolding(max), "") +
      statCard(t("exec.filled"), String(filled.length), "") +
      statCard(t("exec.rejected"), String(rejected.length), "");
    var counts = {};
    rejected.forEach(function (o) {
      counts[o.reject_reason || "unknown"] = (counts[o.reject_reason || "unknown"] || 0) + 1;
    });
    var top = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 3);
    $("exec-rejects").textContent = top.length ?
      t("exec.rejects", { s: top.map(function (k) { return reasonLabel(k) + " ×" + counts[k]; }).join(", ") }) :
      t("exec.rejectsNone");
  }

  /* PnL analytics (section 07 panel): price change / gross ROI / net
     ROI are three different numbers — the panel shows realized net,
     unrealized (floating), gross, fees, and funding side by side. */
  function renderPnl() {
    var st = DATA.stats || {};
    var closed = DATA.closed_positions || [];
    var open = DATA.open_positions || [];
    var netClosed = closed.reduce(function (a, c) { return a + (Number(usdVal(c.net_pnl_usd, c.net_pnl)) || 0); }, 0);
    var grossClosed = closed.reduce(function (a, c) { return a + (Number(usdVal(c.gross_pnl_usd, c.gross_pnl)) || 0); }, 0);
    var unrl = open.reduce(function (a, p) { return a + (Number(usdVal(p.unrealized_pnl_usd, p.unrealized_pnl)) || 0); }, 0);
    $("pnl-stats").innerHTML =
      statCard(t("pnl.realized"), moneySigned(netClosed), "", cls(netClosed)) +
      statCard(t("pnl.unrealized"), moneySigned(unrl), "", cls(unrl)) +
      statCard(t("pnl.gross"), moneySigned(grossClosed), "", cls(grossClosed)) +
      statCard(t("pnl.fees"), money(st.total_fees), "") +
      statCard(t("pnl.funding"), moneySigned(st.total_funding), "", cls(st.total_funding));
  }

  /* Performance intelligence (section 08): thin by design — the
     numbers come from the running simulation; the learning topics are
     the 14 topics the research agents study from the ledgers. */
  function renderIntel() {
    var st = DATA.stats || {};
    var closed = DATA.closed_positions || [];
    var tpClosed = closed.filter(function (c) { return c.exit_reason === "TP"; });
    var ttp = tpClosed.length ? tpClosed.reduce(function (a, c) {
      return a + (Number(c.exit_ts) - Number(c.entry_ts)); }, 0) / tpClosed.length : null;
    $("intel-stats").innerHTML =
      statCard(t("intel.win"), st.win_rate_pct == null ? "—" : pctPlain(st.win_rate_pct), t("stat.ofClosed", { n: closed.length })) +
      statCard(t("intel.pf"), st.profit_factor == null ? "—" : num(st.profit_factor, 2), "") +
      statCard(t("intel.tp"), st.tp_hit_rate_pct == null ? "—" : pctPlain(st.tp_hit_rate_pct), t("stat.ofClosed", { n: closed.length })) +
      statCard(t("intel.dd"), st.max_drawdown_pct == null ? "—" : pctPlain(st.max_drawdown_pct, 2), "") +
      statCard(t("intel.ttp"), fmtHolding(ttp), "") +
      statCard(t("intel.holding"), fmtHolding(st.avg_holding_sec), "");
    var items = [];
    for (var i = 1; i <= 14; i++) items.push("<li>" + esc(t("learn." + i)) + "</li>");
    $("learning-list").innerHTML = items.join("");
  }

  /* System health (section 09): live feed health + monitoring gaps. */
  function renderSystem() {
    var feeds = DATA.feeds || {};
    var gaps = DATA.monitoring_gaps || [];
    var ws = feeds.ws_connected === true ? t("sys.connected") :
      (feeds.ws_connected === false ? t("sys.disconnected") : t("sys.unknown"));
    var healthy = feeds.data_healthy === true ? t("sys.yes") :
      (feeds.data_healthy === false ? t("sys.no") : t("sys.unknown"));
    var paused = feeds.entry_paused === true ? t("sys.yes") :
      (feeds.entry_paused === false ? t("sys.no") : t("sys.unknown"));
    var age = feeds.last_msg_age_sec == null ? "—" : num(feeds.last_msg_age_sec, 1) + "s";
    $("system-stats").innerHTML =
      statCard(t("sys.ws"), ws, "") +
      statCard(t("sys.healthy"), healthy, "", feeds.data_healthy === false ? "neg" : "") +
      statCard(t("sys.paused"), paused, "", feeds.entry_paused === true ? "neg" : "") +
      statCard(t("sys.msgAge"), age, "") +
      statCard(t("sys.gaps"), String(gaps.length), "");
    $("gaps-empty").hidden = gaps.length > 0;
    $("gaps-body").innerHTML = gaps.slice().reverse().map(function (g) {
      return "<tr><td>" + esc(fmtWib(g.start_ts)) + "</td>" +
        "<td class=\"num\">" + esc(fmtHolding(g.duration_sec)) + "</td>" +
        "<td>" + esc(g.reason || "—") + "</td>" +
        "<td class=\"num\">" + esc(g.open_positions_at_gap == null ? "—" : String(g.open_positions_at_gap)) + "</td>" +
        "<td class=\"num\">" + esc(g.liquidations_on_reconcile == null ? "—" : String(g.liquidations_on_reconcile)) + "</td>" +
        "<td>" + esc(g.marks_incomplete ? t("gaps.marksIncomplete") : t("gaps.marksOk")) + "</td></tr>";
    }).join("");
  }

  function renderFeesStats() {
    var st = DATA.stats || {};
    var closed = DATA.closed_positions || [];
    var open = DATA.open_positions || [];
    var netClosed = closed.reduce(function (a, c) { return a + (Number(usdVal(c.net_pnl_usd, c.net_pnl)) || 0); }, 0);
    var unrl = open.reduce(function (a, p) { return a + (Number(usdVal(p.unrealized_pnl_usd, p.unrealized_pnl)) || 0); }, 0);
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
    var feedsTxt = t("feeds.mark") + ": " + (feeds.mark_price || "—") +
      " · " + t("feeds.funding") + ": " + (feeds.funding || "—") +
      " · " + t("feeds.lastMark") + ": " + lastMark;
    // Monitoring cadence, from the engine's own feeds fields (never
    // hardcoded here): the live service tails the sent log on a ~1s
    // poll and evaluates on every WS update; the 1m tick is the
    // replay/diagnostic path. Absent on older JSON — line stays short.
    if (feeds.runner === "service-live-ws") {
      feedsTxt += " · " + t("feeds.runnerLive", {
        s: feeds.sent_log_poll_sec == null ? "~1" : String(feeds.sent_log_poll_sec) });
    } else if (feeds.runner === "tick-1m") {
      feedsTxt += " · " + t("feeds.runnerTick");
    }
    $("feeds-line").textContent = feedsTxt;
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
    var lev = cfg.leverage_label ||
      (cfg.leverage_mode || "—").replace("default-20x", "FIXED LEVERAGE 20x");
    var mmr = cfg.mmr_label ||
      (cfg.mmr_mode || "—").replace("conservative-2.5%", "ESTIMATED MMR 2.5%");
    $("hero-meta").textContent = t("hero.meta", {
      t: fmtWib(DATA.generated_ts),
      i: cfg.initial_balance_usd == null ? "100" : String(cfg.initial_balance_usd),
      lev: lev, mmr: mmr
    });
    $("data-freshness").textContent = t("data.freshness", { t: fmtWib(DATA.generated_ts) });
  }

  /* Liquidation policy (Raka 01:41 WIB): stopped sub-wallets + the
     CAPITAL EXHAUSTED banner. stopped_wallets is the permanent record;
     fall back to sub-wallets with status "stopped" for old data. */
  function renderStopped() {
    var stopped = DATA.stopped_wallets || [];
    if (!stopped.length) {
      Object.keys(DATA.accounts || {}).forEach(function (m) {
        var subs = (DATA.accounts[m] || {}).sub_wallets || {};
        Object.keys(subs).forEach(function (a) {
          var w = subs[a];
          if (w.status === "stopped") {
            stopped.push({ market: m, asset: a, ts: w.stopped_ts,
              reason: w.stopped_reason, balance_at_stop: w.balance,
              liquidation_deficit: w.liquidation_deficit,
              liquidation_deficit_usd: w.liquidation_deficit_usd });
          }
        });
      });
    }
    var panel = $("stopped-panel");
    var banner = $("capital-exhausted");
    var exhausted = (DATA.experiment_status || "ACTIVE") === "CAPITAL EXHAUSTED";
    if (banner) {
      banner.hidden = !exhausted;
      if (exhausted) {
        banner.querySelector("strong").textContent = t("exhausted.title");
        banner.querySelector("span").textContent = t("exhausted.sub");
      }
    }
    if (!panel) return;
    panel.hidden = stopped.length === 0;
    if (!stopped.length) return;
    $("stopped-body").innerHTML = stopped.map(function (w) {
      var stable = ["USDT", "USDC", "USD1", "U"].indexOf(w.asset) >= 0;
      var bal = stable ? money(w.balance_at_stop) : assetNum(w.balance_at_stop);
      var defUsd = w.liquidation_deficit_usd;
      var def = defUsd != null ? money(defUsd) :
        (stable ? money(w.liquidation_deficit) : assetNum(w.liquidation_deficit));
      return "<tr><td class=\"sym\">" + esc(w.market + " · " + w.asset) +
        ' <span class="wallet-stopped">' + esc(t("stopped.badge")) + "</span></td>" +
        '<td class="num">' + esc(bal) + "</td>" +
        '<td class="num">' + esc(def) + "</td>" +
        '<td class="num">' + esc(w.ts ? fmtWib(w.ts) : "—") + "</td></tr>";
    }).join("");
  }

  function renderAll() {
    renderStatic();
    if (!DATA) return;
    renderHero();
    renderStopped();
    renderAccount();
    renderMargin();
    renderOpen();
    renderOrders();
    renderClosed();
    renderLiquidations();
    renderSkipped();
    renderFeesStats();
    renderPnl();
    renderIntel();
    renderSystem();
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
