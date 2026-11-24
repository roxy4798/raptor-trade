/* Raptor Trade — AI Research Dashboard (Phase 3).
   Renders research.json (built by build.py from the Phase 1+2
   research state). Read-only: this page never touches the scanner,
   the pipeline, or publication. Missing data is shown as N/A,
   never estimated. Statistics follow the backend's sample rules.
   Bilingual (EN/ID, research v2.2.0): UI strings live in the T
   dictionary; agent prose renders text/text_en (and *_id twins for
   English-base learnings) per the active language. */
(function () {
  "use strict";

  var DATA = null;
  var SELECTED_ID = null;
  var EXPLORER_SORT = { key: "signal_ts", dir: -1 };

  /* ---- v36: close grouping (Structure at Scale) ---- */
  /* Group open/closed + show-all state, keyed by close_ts (signal_ts).
     In-memory only — no localStorage. */
  var GROUP_PAGE_SIZE = 25;
  var GROUP_COLLAPSED = {};
  var GROUP_EXPANDED = {};
  var GROUP_SHOW_ALL = {};

  /* ---------------------------------------------------------- language */
  /* Research-page language switch (EN/ID). The main page's
     language-v14.js is deliberately NOT loaded here: its
     updateStatic() rewrites main-page selectors (.eyebrow, .rail-nav,
     #signals, footer) that exist on this page with different content,
     and would corrupt them (it also throws on the research footer,
     which has no .footer-brand). The preference itself is shared with
     the main page through the same localStorage key, so the research
     page follows the language chosen on the main page. */
  var T = {
    en: {
      "rail.overview": "Overview", "rail.signals": "Signals",
      "rail.insights": "Insights", "rail.learning": "Learning",
      "rail.timeline": "Timeline", "rail.explorer": "Explorer",
      "rail.home": "Home",
      "rail.homeAria": "Back to Signal Observatory",
      "loading": "Loading research data…",
      "loadError.title": "Research data could not be loaded.",
      "loadError.sub": "The research file (research.json) was not found or could not be parsed. The signal dashboard is unaffected.",
      "retry": "Retry",
      "empty.title": "No signals analyzed yet.",
      "empty.sub": "The research pipeline analyzes each published signal within minutes. This page fills in automatically once the first analysis lands.",
      "hero.eyebrow": "AI RESEARCH INTELLIGENCE · CONTINUOUS LEARNING",
      "hero.title": "What the signals <span>teach us</span>",
      "hero.sub": "Six research agents observe every published 4H signal and learn from real outcomes. This page never filters, approves, or blocks a signal — publication is decided by the scanner alone.",
      "hero.disclaimer": "Correlation is not causation. Every statistic below carries its sample size; small samples are observations, not conclusions.",
      "motion.on": "MOTION ON", "motion.off": "MOTION OFF",
      "motion.ariaOn": "Turn visual motion on",
      "motion.ariaOff": "Turn visual motion off",
      "motion.reduced": "Reduced motion enabled in your device settings",
      "sec.overview.kicker": "01 — Research overview",
      "sec.overview.title": "Research Overview",
      "sec.overview.sub": "How much has been analyzed, how complete the outcomes are, and what the pipeline knows so far.",
      "sec.signals.kicker": "02 — Signal intelligence",
      "sec.signals.title": "Individual Signal Intelligence",
      "sec.signals.sub": "Six-agent analysis for one signal at a time. Pick a signal to inspect its structure, risks, order flow, market context, liquidity, and outcomes.",
      "sec.insights.kicker": "03 — Research insights",
      "sec.insights.title": "Research Insights",
      "sec.insights.sub": "Feature versus outcome, across every evaluable signal. Buckets follow the backend's sample rules (n<5: no statistics). These are associations — never proof that a feature causes an outcome.",
      "sec.learning.kicker": "04 — Learning evaluations",
      "sec.learning.title": "Learning Evaluations",
      "sec.learning.sub": "How results differ across horizons, how much single outcomes move the averages, whether exhaustion markers relate to outcomes — and what the six agents have actually learned so far. Every number carries its sample size, and every panel updates automatically as new signals are evaluated.",
      "sec.timeline.kicker": "05 — Continuous learning",
      "sec.timeline.title": "Continuous Learning Timeline",
      "sec.timeline.sub": "How the research system itself has evolved. Version comparison starts at v2.0.0 — the v1.0.0 archive is no longer available. 1H context for older signals is reconstructed from the official Binance archive and always labeled HISTORICAL RECONSTRUCTION — it never replaces the frozen live snapshot.",
      "sec.explorer.kicker": "06 — Data explorer",
      "sec.explorer.title": "Research Data Explorer",
      "sec.explorer.sub": "Explore every analyzed signal. Filters here only shape this table — they never affect which signals are published.",
      "panel.agents": "Research coverage per agent",
      "panel.agents.sub": "Each agent is scored independently — one agent's missing data never blocks another.",
      "panel.regimes": "Market regime at signal time",
      "panel.regimes.sub": "BTC regime recorded when each signal was published.",
      "panel.outcomes": "Outcome completeness",
      "panel.outcomes.sub": "Share of mature signals with an evaluated outcome per horizon.",
      "panel.hypotheses": "Hypotheses",
      "panel.hypotheses.sub": "A hypothesis needs n≥10 on both buckets and a ≥2pp mean-net gap — and still requires out-of-sample validation.",
      "panel.quality": "Data quality",
      "panel.quality.sub": "Snapshot coverage and the per-input missing-data profile. Missing data is reported, never interpolated.",
      "panel.horizons": "Outcome by horizon",
      "panel.horizons.sub": "All evaluable signals per horizon — n differs because data completeness differs. For the same-cohort comparison, see Paired horizons below.",
      "panel.outliers": "Outlier influence on the average",
      "panel.outliers.sub": "Mean versus median versus trimmed mean — and what the single largest outcome contributes.",
      "panel.markers": "Reversal markers, one by one",
      "panel.markers.sub": "Each exhaustion marker compared with and without it. Buckets with n<5 show no statistics.",
      "panel.paired": "Paired horizons — same signals, all four readings",
      "panel.paired.sub": "Only signals with every horizon evaluated, in gross returns so horizons are comparable. The cleanest read of how performance changes over time — at the cost of a smaller sample.",
      "panel.distribution": "Distribution & contributions",
      "panel.distribution.sub": "Where the +30m net outcomes sit, and how much each signal contributes to the total sum.",
      "panel.agentsEval": "Agent learning evaluation",
      "panel.agentsEval.sub": "Each agent's observations tested against actual outcomes. Everything here is exploratory — no predictive accuracy is claimed for any agent, and out-of-sample validation is not possible yet (holdout plan: once n reaches 40, the first 20 signals become the discovery set).",
      "panel.cases": "Case examples — BULLA & IDOL",
      "panel.cases.sub": "Research illustrations of how two signals behaved across horizons. Examples only — never the basis for a strategy conclusion.",
      "panel.summary": "Learning summary — auto-generated",
      "panel.summary.sub": "What the evidence supports so far, what failed to hold, what changed since the previous evaluation, and what cannot be concluded yet. Regenerated from the current data on every build — nothing here is written by hand.",
      "panel.checkpoints": "Research checkpoints",
      "panel.checkpoints.sub": "Progress toward the next evaluation checkpoint. A “complete outcome” means all four horizons (+30m/+1H/+4H/+8H) evaluated for the same signal. Checkpoints mark progress only — they are not a claim of statistical significance.",
      "panel.registry": "Hypothesis registry",
      "panel.registry.sub": "Hypotheses are recorded frozen the moment they first appear, and tested only on signals published after that moment. The exploration/validation split freezes once 40 evaluable signals exist (whole 4H closes until ≥20 evaluable signals = discovery set).",
      "panel.clusters": "Close clusters — signals grouped by 4H close",
      "panel.clusters.sub": "Signals on the same 4H close share market conditions, so outcomes within a close are not independent. This panel shows how signals and outcomes distribute across closes — and how concentrated the dataset is in a few market periods.",
      "panel.milestones": "Milestones",
      "panel.versions": "Analysis versions",
      "panel.versions.sub": "Each research version is archived immutably before it is replaced, so analyses can always be compared.",
      "panel.recos": "What the data suggests next",
      "panel.recos.sub": "Development recommendations, grounded in the current evidence — not promises.",
      "search.signals": "Search symbol…",
      "search.explorer": "Search symbol…",
      "filter.allOutcomes": "All outcomes",
      "filter.continued": "Continued",
      "filter.reversal": "Reversal",
      "filter.sideways": "Sideways",
      "filter.pending": "Not evaluated yet",
      "filter.allRegimes": "All regimes",
      "filter.up": "BTC trending up",
      "filter.ranging": "BTC ranging",
      "filter.down": "BTC trending down",
      "th.symbol": "Symbol", "th.close": "Close (WIB)",
      "th.price": "Price", "th.net30": "+30m net", "th.r4h": "+4H",
      "th.rvol": "RVOL", "th.markers": "Markers",
      "th.regime": "BTC regime", "th.oi": "OI 24h",
      "th.spread": "Spread", "th.agents": "Agents",
      "explorer.empty": "No signals match these filters.",
      "explorer.count": "{n} of {total} signals",
      "foot.1": "Research data is computed on the Raptor Trade VM from official Binance Futures Mainnet data and the project's own tracker. Nothing here is a trading recommendation, and no AI score gates publication.",
      "foot.2": "← Back to Signal Observatory",
      "ov.researchV": "research v", "ov.lastAnalysis": "last analysis",
      "ov.stat1": "Signals analyzed",
      "ov.stat1n": "of {n} published signals",
      "ov.stat2": "Outcomes (+30m)",
      "ov.stat2n": "evaluable signals with a +30m outcome; the rest are pending or lack 1m candles",
      "ov.stat3": "Win rate (+30m)",
      "ov.stat3n": "PUMP CONTINUED share, n={n}",
      "ov.stat4": "Mean net (+30m)",
      "ov.stat4n": "after spread + 8 bps fees (simulation, not profit)",
      "ov.stat5": "Hypotheses",
      "ov.stat5n": "0 validated — none has passed the bar yet",
      "ov.stat6": "Snapshot coverage",
      "ov.stat6n": "signals with a complete analysis snapshot",
      "ov.agentBreakout": "Breakout", "ov.agentReversal": "Reversal",
      "ov.agentOrderflow": "Order Flow",
      "ov.agentRegime": "Market Regime",
      "ov.agentLiquidity": "Liquidity",
      "ov.legendComplete": "Complete", "ov.legendPartial": "Partial",
      "ov.legendMiss": "Unavailable / error",
      "ov.regimeUp": "BTC trending up",
      "ov.regimeRanging": "BTC ranging",
      "ov.regimeDown": "BTC trending down",
      "ov.mature": "{e}/{m} mature",
      "ov.hypEmpty": "No hypothesis is currently being tested. The bar is strict on purpose: n≥10 on both buckets and a ≥2pp mean-net gap, plus out-of-sample validation. With {n} evaluable outcomes, nothing has cleared it yet.",
      "ov.dqDecisions": "Decisions values",
      "ov.dqSignalBar": "Signal bar",
      "ov.dqMtf1h": "1H context (1m)",
      "ov.dqOi": "Open Interest",
      "ov.dqFunding": "Funding rate",
      "ov.dqBtcRegime": "BTC regime",
      "ov.dqBreadth": "Market breadth",
      "ov.dqSpread": "Spread",
      "ov.dqImpact": "$10k impact",
      "ov.dqDepth": "Top depth",
      "ov.dqMissing": "{m}/{n} missing ({p}%)",
      "bucket.noStats": "n<5 — no statistics",
      "bucket.none": "No bucket has enough samples yet (n≥5 required).",
      "bucket.win": "win",
      "scatter.aria": "Scatter: {x} versus +30m net return",
      "sig.continued": "Continued", "sig.reversed": "Reversed",
      "sig.sideways": "Sideways", "sig.pending": "Pending",
      "sig.noMatch": "No signals match.",
      "hz.pending": "pending", "hz.unavailable": "unavailable",
      "hz.backfilled": " · backfilled from official Binance archive",
      "hz.live": " · recorded live",
      "det.close": "Close", "det.price": "price",
      "det.analyzed": "analyzed",
      "det.agent1": "1 · Breakout Intelligence",
      "det.agent2": "2 · Reversal Intelligence",
      "det.agent3": "3 · Order Flow Intelligence",
      "det.agent4": "4 · Market Regime Intelligence",
      "det.agent5": "5 · Liquidity Intelligence",
      "det.agent6": "6 · Performance Learning",
      "det.rcNote": "1H context is a HISTORICAL RECONSTRUCTION from the official Binance 1m archive ({files}, method v{ver}) — it is NOT the original live snapshot and is used for exploratory research only, never as prospective validation evidence.",
      "det.bodyRange": "Body / range",
      "det.pctOfRange": "% of range",
      "det.upperWick": "Upper wick",
      "det.breakoutMargin": "Breakout margin",
      "det.emaRow": "EMA 20 / 50 / 500",
      "det.emaAligned": "EMA aligned (bullish)",
      "det.yes": "Yes", "det.no": "No",
      "det.rsi4h": "RSI 4H",
      "det.macd": "MACD histogram",
      "det.rising": " (rising)",
      "det.atr": "ATR14",
      "det.resGap": "Resistance gap",
      "det.consecUp": "Consecutive up bars",
      "det.h1ctx": "1H context before signal",
      "det.histRecon": " (HISTORICAL RECONSTRUCTION)",
      "det.riskLevel": "Risk level (marker count)",
      "det.markersObs": "Markers observed",
      "det.histCtx": "Historical context",
      "det.histCtxVal": "n={n} similar signals, win {w}%",
      "det.histCtxNone": "insufficient historical context",
      "det.riskNote": "Risk level counts exhaustion markers — it is NOT a probability of reversal.",
      "det.takerBuy": "Taker-buy",
      "det.imbalance": "Imbalance",
      "det.deltaBar": "Volume delta (signal bar)",
      "det.deltaCum": "Cumulative delta (5 prior bars)",
      "det.oi": "Open Interest",
      "det.oiAsOf": " (as of {t} WIB)",
      "det.oiChg": "OI change 24h",
      "det.lsRatio": "Long/short ratio",
      "det.funding": "Funding rate",
      "det.btcRegime": "BTC regime",
      "det.btcChg": "BTC 4H change",
      "det.btcRsi": "BTC RSI 4H",
      "det.btcAtr": "BTC ATR14",
      "det.btcCorr": "BTC correlation (60 bars)",
      "det.brGreen": "Breadth: green bars",
      "det.brGreenVal": "% of {n} symbols",
      "det.brBreakouts": "Breadth: breakouts",
      "det.brMedian": "Breadth: median 4H change",
      "det.spread": "Spread",
      "det.topDepth": "Top depth",
      "det.impact10k": "$10k impact",
      "det.slipMethod": "Slippage method",
      "det.slipReal": "Real order-book levels",
      "det.slipBands": "Depth-band bound",
      "det.slipLinear": "Linear estimate",
      "det.slipRow": "Slippage ($1k / $10k / $50k)",
      "det.upperBound": " (upper bound)",
      "det.bookExhausted": " (book exhausted)",
      "det.barShare": "Bar share of 24h volume",
      "det.bookSnap": "Book snapshot",
      "det.bookYes": "recorded at signal time",
      "det.bookDelay": "recorded {d} after close",
      "det.bookMin": "min",
      "det.bookSec": "s",
      "det.bookNo": "not recorded (signals before 23 Nov 2026)",
      "det.perfNote": "+30m comes from the tracker (pre-registered rules). +1H is read from local 1m candles; +4H/+8H from local 4H candles. MFE/MAE are the best/worst moves inside each window.",
      "ins.meta": "Signals: {n} · evaluable (+30m): {e} · missing feature data: {m} · period: {p}<br>Buckets with n<5 show no statistics. Association only — not evidence of causation.",
      "ins.rvolT": "RVOL vs outcome",
      "ins.rvolS": "Does a bigger volume spike mean the pump continues?",
      "ins.rvolX": "RVOL (log scale)",
      "ins.markT": "Reversal markers vs outcome",
      "ins.markS": "Do exhaustion markers predict reversals? So far the markers show no clear pattern — they stay research variables.",
      "ins.markX": "Exhaustion markers (count)",
      "ins.emaT": "EMA alignment vs outcome",
      "ins.emaS": "Signals above EMA20 > EMA50 > EMA500 versus the rest.",
      "ins.regT": "BTC market regime vs outcome",
      "ins.regS": "How signals perform when BTC is trending up, ranging, or trending down.",
      "ins.oiT": "Open Interest change vs outcome",
      "ins.oiS": "Does rising open interest before the signal relate to momentum continuation?",
      "ins.oiX": "OI change 24h (%)",
      "ins.imbT": "Order flow imbalance vs outcome",
      "ins.imbS": "Taker buy/sell imbalance at the signal bar versus the +30m result.",
      "ins.imbX": "Imbalance (−1 sell … +1 buy)",
      "ins.sprT": "Spread vs outcome",
      "ins.sprS": "Does a wider spread eat the net result after costs?",
      "ins.sprX": "Spread (bps)",
      "ins.brkT": "Breakout strength vs outcome",
      "ins.brkS": "How far the close cleared the 20-bar high, versus the +30m result.",
      "ins.brkX": "Breakout margin (%)",
      "lr.hzNet30": "+30m net (after spread + fees)",
      "lr.hz1h": "+1H (gross)", "lr.hz4h": "+4H (gross)",
      "lr.hz8h": "+8H (gross)",
      "lr.thHorizon": "Horizon", "lr.thN": "n",
      "lr.thMean": "Mean", "lr.thMedian": "Median",
      "lr.thGte": "≥ +1%", "lr.thLte": "≤ −1%",
      "lr.hzNote": "“Win rate” is only defined for +30m (tracker classification). Other horizons show descriptive shares — not win rates. Net is simulated only for +30m; longer horizons are gross returns.",
      "lr.notEnough": "Not enough evaluable outcomes yet (n<5).",
      "lr.outMean": "Mean net (+30m)",
      "lr.outMedian": "Median net (+30m)",
      "lr.outTrimmed": "Trimmed mean (drop top/bottom 10%)",
      "lr.outExMax": "Mean without the largest outcome",
      "lr.outLargest": "Largest single outcome",
      "lr.outLargestOf": " ({p}% of the total sum)",
      "lr.outRange": "Range (min … max)",
      "lr.outNote": "With n={n}, one big outcome can dominate the average. Compare the mean with the median and the trimmed mean before reading anything into it.",
      "lr.mkRsi": "RSI overbought (≥80)",
      "lr.mkWick": "Upper wick rejection (≥40%)",
      "lr.mkOver": "Overextended vs ATR (≥2×)",
      "lr.mkPara": "Parabolic 3-bar (+15%)",
      "lr.mkAtr": "ATR spike (≥1.5× median)",
      "lr.mkVol": "Volume divergence",
      "lr.mkThMarker": "Exhaustion marker",
      "lr.mkThWith": "With marker",
      "lr.mkThWithout": "Without marker",
      "lr.mkStats": "n={n} · win {w}% · mean {m}",
      "lr.mkNote": "Markers stay research variables. A gap between “with” and “without” at these sample sizes is an observation, not evidence that the marker predicts anything.",
      "lr.pairedNotEnough": "Not enough signals with all four horizons evaluated yet (n<5).",
      "lr.pairedIntro": "Paired cohort: <b>{n}</b> of {total} signals, across {closes} distinct 4H closes. Excluded: no +30m {m30}, no +1H {m1}, no +4H {m4}, no +8H {m8} (a signal can miss more than one horizon).",
      "lr.thMfe": "Mean MFE", "lr.thMae": "Mean MAE",
      "lr.pairedNote": "MFE/MAE are the average best/worst excursions within each horizon (+4H/+8H from 4H-bar extremes, not ticks). Gross returns throughout — compare with the +30m net table above, not against it.",
      "lr.trajTitle": "Momentum trajectories",
      "lr.trajContinued": "Continued",
      "lr.trajReversed": "Reversed",
      "lr.trajFull": "— of which: full reversal",
      "lr.trajLate": "Late bloom",
      "lr.trajNever": "Never up",
      "lr.distTitle": "Distribution of +30m net outcomes (n={n})",
      "lr.mvwTitle": "Mean vs win rate",
      "lr.mvwWin": "Win rate (+30m)",
      "lr.mvwMean": "Mean net",
      "lr.mvwMedian": "Median net",
      "lr.contribTitle": "Contribution of every signal to the total",
      "lr.thSignal": "Signal", "lr.thNet": "Net",
      "lr.thShare": "Share of sum",
      "lr.contribNote": "Shares above 100% mean one signal outweighs the entire net sum — the rest of the signals cancel each other out.",
      "lr.verdAssociation": "Association observed",
      "lr.verdNoClear": "No clear association",
      "lr.verdConsistent": "Consistent with hypothesis",
      "lr.verdAgainst": "Against hypothesis",
      "lr.verdInsuff": "Not enough data",
      "lr.verdNoData": "No data yet",
      "lr.verdNotEval": "Not evaluable",
      "lr.agBreakout": "Breakout Intelligence",
      "lr.agReversal": "Reversal Intelligence",
      "lr.agOrderflow": "Order Flow Intelligence",
      "lr.agRegime": "Market Regime Intelligence",
      "lr.agLiquidity": "Liquidity Intelligence",
      "lr.agPerformance": "Performance Learning",
      "lr.thObservation": "Observation",
      "lr.thVerdict": "Verdict",
      "lr.thEvidence": "Evidence",
      "lr.aeIntro": "Evaluated at n={n} evaluable +30m outcomes. ",
      "lr.siSentence": "The {ne} evaluable signals come from {ce} distinct 4H closes; the {np} paired signals from {cp}.",
      "lr.casesEmpty": "No BULLA/IDOL outcomes evaluated yet.",
      "lr.th30net": "+30m net",
      "lr.th1h": "+1H", "lr.th4h": "+4H", "lr.th8h": "+8H",
      "lr.thMfeMae": "MFE / MAE (+30m)",
      "lr.caseNote": "Same rule set, opposite paths — that is why single examples never justify a strategy change.",
      "lr.caseNote2": "BULLA's best +8H: {b}; IDOL's worst +8H: {i}. ",
      "lr.sumTopics": "Monitored topics",
      "lr.thTopic": "Topic", "lr.thStatus": "Status",
      "lr.thRead": "Current read",
      "lr.stObserved": "observed", "lr.stMixed": "mixed",
      "lr.stInsuff": "insufficient", "lr.stNoData": "no_data",
      "lr.sumWorked": "What holds up",
      "lr.sumWorkedEmpty": "Nothing has met the bar yet — no finding is presented as working.",
      "lr.sumFailed": "What failed to hold",
      "lr.sumFailedEmpty": "No tested pattern has failed yet.",
      "lr.sumChanged": "What changed since the previous evaluation",
      "lr.sumChangedEmpty": "No material change recorded.",
      "lr.sumInconcl": "Not yet concludable",
      "lr.sumInconclEmpty": "Everything evaluated has a verdict.",
      "lr.sumBased": "Based on {e} evaluable +30m outcomes and {p} paired-cohort signals. “What holds up” lists exploratory associations only — nothing here is a predictive claim.",
      "lr.cpComplete": "Complete outcomes (paired cohort)",
      "lr.cpCloses": "Distinct 4H closes behind them",
      "lr.cpNext": "Next checkpoint",
      "lr.cpAllReached": "all reached",
      "lr.cpNextVal": "{n} signals ({p}%)",
      "lr.cpNone": "No checkpoint reached yet — the first is at 40 complete outcomes.",
      "lr.cpReached": "Checkpoint {n} signals",
      "lr.regPending": "Exploration/validation split not frozen yet.",
      "lr.regSplit": "Split frozen {d} — first {n} evaluable signals are the discovery set.",
      "lr.regEmpty": "No hypothesis has passed the sample bar yet (n≥10 both buckets + ≥2pp gap). When one does, it is recorded here frozen, before any new data tests it.",
      "lr.thId": "ID",
      "lr.thHyp": "Hypothesis (frozen at registration)",
      "lr.thVal": "Validation on newer data",
      "lr.regAwaiting": "awaiting_validation",
      "lr.regValidated": "validated",
      "lr.regRejected": "rejected",
      "lr.regHolds": "holds",
      "lr.regNotHolds": "does_not_hold",
      "lr.regValN": " (n {a} vs {b})",
      "lr.clEval": "Signals evaluated (+30m net)",
      "lr.clClosesAll": "Unique 4H closes (all signals)",
      "lr.clClosesEval": "Unique 4H closes (evaluable)",
      "lr.clLargest": "Largest single close",
      "lr.clLargestVal": "{n} signals ({p}%)",
      "lr.clTop3": "Top 3 closes combined",
      "lr.clTop3Val": "{p}% of all signals",
      "lr.clRecon": "1H context reconstructed",
      "lr.clReconVal": "{n}/{total} signals (HISTORICAL RECONSTRUCTION)",
      "lr.thCloseWib": "4H close (WIB)",
      "lr.thSignals": "Signals",
      "lr.thEvaluable": "Evaluable",
      "lr.thWins": "Wins",
      "lr.thMeanNet": "Mean net +30m",
      "lr.thMeanGross": "Mean gross +30m",
      "lr.clSplitNote": " The exploration/validation split keeps whole closes together, so no close is ever split between the two sets.",
      "tl.noArchive": "No archive available.",
      "tl.thVersion": "Version", "tl.thRecords": "Records",
      "tl.thOi": "OI", "tl.thFunding": "Funding",
      "tl.thDepth": "Depth bands",
      "tl.verNote": "Coverage counts grow as archive files publish — the same analysis record gains OI the next day and funding the next month.",
      "tl.recoFunding": "<strong>Funding rate arrives in December.</strong> The monthly archive file will fill the funding bucket automatically — no action needed, just patience.",
      "tl.recoOi": "<strong>Open Interest coverage is still filling in</strong> ({m} signals missing). Daily archive files publish a day late; the pipeline retries automatically.",
      "tl.recoH1": "<strong>The +1H horizon is still filling in</strong> ({p}% complete). Evaluated horizons are now sticky, and the daily backfill recovers the rest from the official Binance archive as each day's file publishes — backfilled outcomes are labeled as such.",
      "tl.recoHyp": "<strong>Keep accumulating outcomes.</strong> With n={n} evaluable signals, no hypothesis has passed the bar (n≥10 both buckets + ≥2pp gap). The system is working as designed — it refuses to invent patterns from small samples.",
      "tl.recoTrend": "<strong>No signal has fired in a BTC uptrend yet.</strong> The regime comparison is one-sided until the market turns — treat the TRENDING_DOWN vs RANGING contrast as provisional.",
      "tl.recoMarkers": "<strong>Reversal markers stay research variables.</strong> Early results show no clear predictive pattern; changing or dropping markers on {n} outcomes would be overfitting.",
      "lbl.searchSignals": "Search signals",
      "lbl.searchExplorer": "Search explorer",
      "lbl.filterOutcome": "Filter by outcome",
      "lbl.filterRegime": "Filter by BTC regime",
      "grp.signal": "1 signal",
      "grp.signals": "{n} signals",
      "grp.continued": "{n} continued",
      "grp.reversed": "{n} reversed",
      "grp.mean": "mean {v}",
      "grp.showAll": "Show all {n}",
      "grp.showLess": "Show less"
    },
    id: {
      "rail.overview": "Ikhtisar", "rail.signals": "Sinyal",
      "rail.insights": "Insight", "rail.learning": "Pembelajaran",
      "rail.timeline": "Linimasa", "rail.explorer": "Explorer",
      "rail.home": "Beranda",
      "rail.homeAria": "Kembali ke Observatorium Sinyal",
      "loading": "Memuat data riset…",
      "loadError.title": "Data riset tidak bisa dimuat.",
      "loadError.sub": "File riset (research.json) tidak ditemukan atau tidak bisa diproses. Dashboard sinyal tidak terpengaruh.",
      "retry": "Coba lagi",
      "empty.title": "Belum ada sinyal yang dianalisis.",
      "empty.sub": "Pipeline riset menganalisis tiap sinyal yang dipublikasikan dalam hitungan menit. Halaman ini terisi otomatis begitu analisis pertama tersedia.",
      "hero.eyebrow": "INTELIJEN RISET AI · PEMBELAJARAN BERKELANJUTAN",
      "hero.title": "Apa yang <span>diajarkan sinyal</span>",
      "hero.sub": "Enam agent riset mengamati setiap sinyal 4J yang dipublikasikan dan belajar dari hasil nyata. Halaman ini tidak pernah memfilter, menyetujui, atau memblokir sinyal — publikasi diputuskan oleh scanner saja.",
      "hero.disclaimer": "Korelasi bukan kausalitas. Setiap statistik di bawah ini menyertakan ukuran sampelnya; sampel kecil adalah observasi, bukan kesimpulan.",
      "motion.on": "GERAK ON", "motion.off": "GERAK OFF",
      "motion.ariaOn": "Nyalakan gerak visual",
      "motion.ariaOff": "Matikan gerak visual",
      "motion.reduced": "Gerak minimal diaktifkan di pengaturan perangkat Anda",
      "sec.overview.kicker": "01 — Ikhtisar riset",
      "sec.overview.title": "Ikhtisar Riset",
      "sec.overview.sub": "Seberapa banyak yang sudah dianalisis, seberapa lengkap hasilnya, dan apa yang diketahui pipeline sejauh ini.",
      "sec.signals.kicker": "02 — Intelijen sinyal",
      "sec.signals.title": "Intelijen Sinyal per Sinyal",
      "sec.signals.sub": "Analisis enam agent untuk satu sinyal dalam satu waktu. Pilih sinyal untuk memeriksa struktur, risiko, arus order, konteks pasar, likuiditas, dan hasilnya.",
      "sec.insights.kicker": "03 — Insight riset",
      "sec.insights.title": "Insight Riset",
      "sec.insights.sub": "Fitur versus hasil, di semua sinyal yang bisa dievaluasi. Bucket mengikuti aturan sampel backend (n<5: tanpa statistik). Ini adalah asosiasi — bukan bukti bahwa suatu fitur menyebabkan hasil.",
      "sec.learning.kicker": "04 — Evaluasi pembelajaran",
      "sec.learning.title": "Evaluasi Pembelajaran",
      "sec.learning.sub": "Bagaimana hasil berbeda antar horizon, seberapa besar satu hasil menggerakkan rata-rata, apakah marker exhaustion berkaitan dengan hasil — dan apa yang sebenarnya sudah dipelajari keenam agent sejauh ini. Setiap angka menyertakan ukuran sampelnya, dan setiap panel diperbarui otomatis saat sinyal baru dievaluasi.",
      "sec.timeline.kicker": "05 — Pembelajaran berkelanjutan",
      "sec.timeline.title": "Linimasa Pembelajaran Berkelanjutan",
      "sec.timeline.sub": "Bagaimana sistem riset itu sendiri berevolusi. Perbandingan versi dimulai dari v2.0.0 — arsip v1.0.0 sudah tidak tersedia. Konteks 1J untuk sinyal lama direkonstruksi dari arsip resmi Binance dan selalu dilabeli REKONSTRUKSI HISTORIS — tidak pernah menggantikan snapshot live yang sudah dibekukan.",
      "sec.explorer.kicker": "06 — Penjelajah data",
      "sec.explorer.title": "Penjelajah Data Riset",
      "sec.explorer.sub": "Jelajahi setiap sinyal yang dianalisis. Filter di sini hanya membentuk tabel ini — tidak pernah memengaruhi sinyal mana yang dipublikasikan.",
      "panel.agents": "Cakupan riset per agent",
      "panel.agents.sub": "Setiap agent dinilai secara independen — data yang hilang dari satu agent tidak pernah memblokir agent lain.",
      "panel.regimes": "Rezim pasar saat sinyal",
      "panel.regimes.sub": "Rezim BTC yang dicatat saat tiap sinyal dipublikasikan.",
      "panel.outcomes": "Kelengkapan hasil",
      "panel.outcomes.sub": "Porsi sinyal yang sudah matang dan punya hasil tervalidasi per horizon.",
      "panel.hypotheses": "Hipotesis",
      "panel.hypotheses.sub": "Hipotesis butuh n≥10 di kedua bucket dan selisih mean-net ≥2pp — dan tetap butuh validasi out-of-sample.",
      "panel.quality": "Kualitas data",
      "panel.quality.sub": "Cakupan snapshot dan profil data hilang per input. Data yang hilang dilaporkan, tidak pernah diinterpolasi.",
      "panel.horizons": "Hasil per horizon",
      "panel.horizons.sub": "Semua sinyal yang bisa dievaluasi per horizon — n berbeda karena kelengkapan datanya berbeda. Untuk perbandingan kohort yang sama, lihat Horizon berpasangan di bawah.",
      "panel.outliers": "Pengaruh outlier terhadap rata-rata",
      "panel.outliers.sub": "Mean versus median versus trimmed mean — dan kontribusi satu hasil terbesar.",
      "panel.markers": "Marker reversal, satu per satu",
      "panel.markers.sub": "Tiap marker exhaustion dibandingkan dengan dan tanpa marker. Bucket dengan n<5 tidak menampilkan statistik.",
      "panel.paired": "Horizon berpasangan — sinyal yang sama, keempat pembacaan",
      "panel.paired.sub": "Hanya sinyal yang keempat horizonnya tervalidasi, dalam return gross agar antar horizon bisa dibandingkan. Pembacaan paling bersih tentang bagaimana performa berubah seiring waktu — dengan mengorbankan ukuran sampel.",
      "panel.distribution": "Distribusi & kontribusi",
      "panel.distribution.sub": "Di mana letak hasil net +30m, dan seberapa besar kontribusi tiap sinyal terhadap total.",
      "panel.agentsEval": "Evaluasi pembelajaran agent",
      "panel.agentsEval.sub": "Observasi tiap agent diuji terhadap hasil sebenarnya. Semuanya di sini bersifat eksploratif — tidak ada klaim akurasi prediktif untuk agent mana pun, dan validasi out-of-sample belum memungkinkan (rencana holdout: begitu n mencapai 40, 20 sinyal pertama menjadi discovery set).",
      "panel.cases": "Contoh kasus — BULLA & IDOL",
      "panel.cases.sub": "Ilustrasi riset tentang bagaimana dua sinyal berperilaku di berbagai horizon. Hanya contoh — bukan dasar kesimpulan strategi.",
      "panel.summary": "Ringkasan pembelajaran — dibuat otomatis",
      "panel.summary.sub": "Apa yang didukung bukti sejauh ini, apa yang gagal bertahan, apa yang berubah sejak evaluasi sebelumnya, dan apa yang belum bisa disimpulkan. Dibuat ulang dari data terkini di setiap build — tidak ada yang ditulis tangan.",
      "panel.checkpoints": "Checkpoint riset",
      "panel.checkpoints.sub": "Progres menuju checkpoint evaluasi berikutnya. “Hasil lengkap” berarti keempat horizon (+30m/+1H/+4H/+8H) tervalidasi untuk sinyal yang sama. Checkpoint hanya menandai progres — bukan klaim signifikansi statistik.",
      "panel.registry": "Registri hipotesis",
      "panel.registry.sub": "Hipotesis dicatat beku begitu pertama kali muncul, dan hanya diuji pada sinyal yang dipublikasikan setelah momen itu. Split eksplorasi/validasi membeku begitu 40 sinyal yang bisa dievaluasi tercapai (seluruh penutupan 4J hingga ≥20 sinyal yang bisa dievaluasi = discovery set).",
      "panel.clusters": "Klaster penutupan — sinyal dikelompokkan per penutupan 4J",
      "panel.clusters.sub": "Sinyal pada penutupan 4J yang sama berbagi kondisi pasar, jadi hasil dalam satu penutupan tidak independen. Panel ini menunjukkan bagaimana sinyal dan hasil tersebar antar penutupan — dan seberapa terkonsentrasi dataset ini pada beberapa periode pasar.",
      "panel.milestones": "Milestone",
      "panel.versions": "Versi analisis",
      "panel.versions.sub": "Setiap versi riset diarsipkan secara immutable sebelum digantikan, sehingga analisis selalu bisa dibandingkan.",
      "panel.recos": "Apa yang disarankan data selanjutnya",
      "panel.recos.sub": "Rekomendasi pengembangan, berdasarkan bukti saat ini — bukan janji.",
      "search.signals": "Cari simbol…",
      "search.explorer": "Cari simbol…",
      "filter.allOutcomes": "Semua hasil",
      "filter.continued": "Lanjut naik",
      "filter.reversal": "Berbalik",
      "filter.sideways": "Sideways",
      "filter.pending": "Belum dievaluasi",
      "filter.allRegimes": "Semua rezim",
      "filter.up": "BTC naik",
      "filter.ranging": "BTC sideways",
      "filter.down": "BTC turun",
      "th.symbol": "Simbol", "th.close": "Tutup (WIB)",
      "th.price": "Harga", "th.net30": "Net +30m", "th.r4h": "+4H",
      "th.rvol": "RVOL", "th.markers": "Marker",
      "th.regime": "Rezim BTC", "th.oi": "OI 24j",
      "th.spread": "Spread", "th.agents": "Agent",
      "explorer.empty": "Tidak ada sinyal yang cocok dengan filter ini.",
      "explorer.count": "{n} dari {total} sinyal",
      "foot.1": "Data riset dihitung di VM Raptor Trade dari data resmi Binance Futures Mainnet dan tracker proyek sendiri. Tidak ada di sini yang merupakan rekomendasi trading, dan tidak ada skor AI yang menghalangi publikasi.",
      "foot.2": "← Kembali ke Observatorium Sinyal",
      "ov.researchV": "riset v", "ov.lastAnalysis": "analisis terakhir",
      "ov.stat1": "Sinyal dianalisis",
      "ov.stat1n": "dari {n} sinyal yang dipublikasikan",
      "ov.stat2": "Hasil (+30m)",
      "ov.stat2n": "sinyal yang bisa dievaluasi dengan hasil +30m; sisanya masih menunggu atau kekurangan candle 1m",
      "ov.stat3": "Tingkat menang (+30m)",
      "ov.stat3n": "Porsi Lanjut Naik, n={n}",
      "ov.stat4": "Rata-rata net (+30m)",
      "ov.stat4n": "setelah spread + fee 8 bps (simulasi, bukan profit)",
      "ov.stat5": "Hipotesis",
      "ov.stat5n": "0 tervalidasi — belum ada yang lolos ambang batas",
      "ov.stat6": "Cakupan snapshot",
      "ov.stat6n": "sinyal dengan snapshot analisis yang lengkap",
      "ov.agentBreakout": "Breakout", "ov.agentReversal": "Reversal",
      "ov.agentOrderflow": "Arus Order",
      "ov.agentRegime": "Rezim Pasar",
      "ov.agentLiquidity": "Likuiditas",
      "ov.legendComplete": "Lengkap", "ov.legendPartial": "Sebagian",
      "ov.legendMiss": "Tidak tersedia / error",
      "ov.regimeUp": "BTC naik",
      "ov.regimeRanging": "BTC sideways",
      "ov.regimeDown": "BTC turun",
      "ov.mature": "{e}/{m} matang",
      "ov.hypEmpty": "Belum ada hipotesis yang sedang diuji. Ambang batasnya sengaja ketat: n≥10 di kedua bucket dan selisih mean-net ≥2pp, ditambah validasi out-of-sample. Dengan {n} hasil yang bisa dievaluasi, belum ada yang lolos.",
      "ov.dqDecisions": "Nilai decisions",
      "ov.dqSignalBar": "Bar sinyal",
      "ov.dqMtf1h": "Konteks 1J (1m)",
      "ov.dqOi": "Open Interest",
      "ov.dqFunding": "Funding rate",
      "ov.dqBtcRegime": "Rezim BTC",
      "ov.dqBreadth": "Breadth pasar",
      "ov.dqSpread": "Spread",
      "ov.dqImpact": "Impact $10k",
      "ov.dqDepth": "Depth teratas",
      "ov.dqMissing": "{m}/{n} hilang ({p}%)",
      "bucket.noStats": "n<5 — tanpa statistik",
      "bucket.none": "Belum ada bucket yang punya cukup sampel (butuh n≥5).",
      "bucket.win": "win",
      "scatter.aria": "Scatter: {x} versus return net +30m",
      "sig.continued": "Lanjut naik", "sig.reversed": "Berbalik",
      "sig.sideways": "Sideways", "sig.pending": "Menunggu",
      "sig.noMatch": "Tidak ada sinyal yang cocok.",
      "hz.pending": "menunggu", "hz.unavailable": "tidak tersedia",
      "hz.backfilled": " · di-backfill dari arsip resmi Binance",
      "hz.live": " · direkam live",
      "det.close": "Tutup", "det.price": "harga",
      "det.analyzed": "dianalisis",
      "det.agent1": "1 · Intelijen Breakout",
      "det.agent2": "2 · Intelijen Reversal",
      "det.agent3": "3 · Intelijen Arus Order",
      "det.agent4": "4 · Intelijen Rezim Pasar",
      "det.agent5": "5 · Intelijen Likuiditas",
      "det.agent6": "6 · Pembelajaran Kinerja",
      "det.rcNote": "Konteks 1J adalah REKONSTRUKSI HISTORIS dari arsip 1m resmi Binance ({files}, metode v{ver}) — ini BUKAN snapshot live asli dan hanya dipakai untuk riset eksploratif, tidak pernah sebagai bukti validasi prospektif.",
      "det.bodyRange": "Body / range",
      "det.pctOfRange": "% dari range",
      "det.upperWick": "Wick atas",
      "det.breakoutMargin": "Margin breakout",
      "det.emaRow": "EMA 20 / 50 / 500",
      "det.emaAligned": "EMA selaras (bullish)",
      "det.yes": "Ya", "det.no": "Tidak",
      "det.rsi4h": "RSI 4J",
      "det.macd": "Histogram MACD",
      "det.rising": " (naik)",
      "det.atr": "ATR14",
      "det.resGap": "Jarak ke resistance",
      "det.consecUp": "Bar naik berurutan",
      "det.h1ctx": "Konteks 1J sebelum sinyal",
      "det.histRecon": " (REKONSTRUKSI HISTORIS)",
      "det.riskLevel": "Level risiko (jumlah marker)",
      "det.markersObs": "Marker teramati",
      "det.histCtx": "Konteks historis",
      "det.histCtxVal": "n={n} sinyal serupa, win {w}%",
      "det.histCtxNone": "konteks historis belum cukup",
      "det.riskNote": "Level risiko menghitung marker exhaustion — ini BUKAN probabilitas reversal.",
      "det.takerBuy": "Taker-buy",
      "det.imbalance": "Imbalance",
      "det.deltaBar": "Volume delta (bar sinyal)",
      "det.deltaCum": "Delta kumulatif (5 bar sebelumnya)",
      "det.oi": "Open Interest",
      "det.oiAsOf": " (per {t} WIB)",
      "det.oiChg": "Perubahan OI 24j",
      "det.lsRatio": "Rasio long/short",
      "det.funding": "Funding rate",
      "det.btcRegime": "Rezim BTC",
      "det.btcChg": "Perubahan BTC 4J",
      "det.btcRsi": "RSI BTC 4J",
      "det.btcAtr": "ATR14 BTC",
      "det.btcCorr": "Korelasi BTC (60 bar)",
      "det.brGreen": "Breadth: bar hijau",
      "det.brGreenVal": "% dari {n} simbol",
      "det.brBreakouts": "Breadth: breakout",
      "det.brMedian": "Breadth: median perubahan 4J",
      "det.spread": "Spread",
      "det.topDepth": "Depth teratas",
      "det.impact10k": "Impact $10k",
      "det.slipMethod": "Metode slippage",
      "det.slipReal": "Level order book asli",
      "det.slipBands": "Batas band kedalaman",
      "det.slipLinear": "Estimasi linear",
      "det.slipRow": "Slippage ($1k / $10k / $50k)",
      "det.upperBound": " (batas atas)",
      "det.bookExhausted": " (book habis)",
      "det.barShare": "Porsi bar terhadap volume 24j",
      "det.bookSnap": "Snapshot order book",
      "det.bookYes": "direkam saat sinyal",
      "det.bookDelay": "direkam {d} setelah close",
      "det.bookMin": "mnt",
      "det.bookSec": "dtk",
      "det.bookNo": "tidak direkam (sinyal sebelum 23 Nov 2026)",
      "det.perfNote": "+30m berasal dari tracker (aturan pra-registrasi). +1H dibaca dari candle 1m lokal; +4H/+8H dari candle 4J lokal. MFE/MAE adalah pergerakan terbaik/terburuk dalam tiap jendela.",
      "ins.meta": "Sinyal: {n} · bisa dievaluasi (+30m): {e} · data fitur hilang: {m} · periode: {p}<br>Bucket dengan n<5 tidak menampilkan statistik. Hanya asosiasi — bukan bukti kausalitas.",
      "ins.rvolT": "RVOL vs hasil",
      "ins.rvolS": "Apakah lonjakan volume yang lebih besar berarti pump berlanjut?",
      "ins.rvolX": "RVOL (skala log)",
      "ins.markT": "Marker reversal vs hasil",
      "ins.markS": "Apakah marker exhaustion memprediksi reversal? Sejauh ini marker tidak menunjukkan pola yang jelas — mereka tetap variabel riset.",
      "ins.markX": "Marker exhaustion (jumlah)",
      "ins.emaT": "Keselarasan EMA vs hasil",
      "ins.emaS": "Sinyal di atas EMA20 > EMA50 > EMA500 versus sisanya.",
      "ins.regT": "Rezim pasar BTC vs hasil",
      "ins.regS": "Bagaimana performa sinyal saat BTC naik, sideways, atau turun.",
      "ins.oiT": "Perubahan Open Interest vs hasil",
      "ins.oiS": "Apakah kenaikan open interest sebelum sinyal berkaitan dengan kelanjutan momentum?",
      "ins.oiX": "Perubahan OI 24j (%)",
      "ins.imbT": "Imbalance arus order vs hasil",
      "ins.imbS": "Imbalance taker buy/sell pada bar sinyal versus hasil +30m.",
      "ins.imbX": "Imbalance (−1 jual … +1 beli)",
      "ins.sprT": "Spread vs hasil",
      "ins.sprS": "Apakah spread yang lebih lebar menggerus hasil net setelah biaya?",
      "ins.sprX": "Spread (bps)",
      "ins.brkT": "Kekuatan breakout vs hasil",
      "ins.brkS": "Seberapa jauh harga tutup melewati high 20-bar, versus hasil +30m.",
      "ins.brkX": "Margin breakout (%)",
      "lr.hzNet30": "Net +30m (setelah spread + fee)",
      "lr.hz1h": "+1H (gross)", "lr.hz4h": "+4H (gross)",
      "lr.hz8h": "+8H (gross)",
      "lr.thHorizon": "Horizon", "lr.thN": "n",
      "lr.thMean": "Mean", "lr.thMedian": "Median",
      "lr.thGte": "≥ +1%", "lr.thLte": "≤ −1%",
      "lr.hzNote": "“Win rate” hanya didefinisikan untuk +30m (klasifikasi tracker). Horizon lain menampilkan porsi deskriptif — bukan win rate. Net hanya disimulasikan untuk +30m; horizon yang lebih panjang adalah return gross.",
      "lr.notEnough": "Hasil yang bisa dievaluasi belum cukup (n<5).",
      "lr.outMean": "Mean net (+30m)",
      "lr.outMedian": "Median net (+30m)",
      "lr.outTrimmed": "Trimmed mean (buang 10% atas/bawah)",
      "lr.outExMax": "Mean tanpa hasil terbesar",
      "lr.outLargest": "Hasil tunggal terbesar",
      "lr.outLargestOf": " ({p}% dari total)",
      "lr.outRange": "Rentang (min … max)",
      "lr.outNote": "Dengan n={n}, satu hasil besar bisa mendominasi rata-rata. Bandingkan mean dengan median dan trimmed mean sebelum menarik kesimpulan apa pun.",
      "lr.mkRsi": "RSI overbought (≥80)",
      "lr.mkWick": "Penolakan wick atas (≥40%)",
      "lr.mkOver": "Terlalu jauh vs ATR (≥2×)",
      "lr.mkPara": "Parabolik 3-bar (+15%)",
      "lr.mkAtr": "Lonjakan ATR (≥1,5× median)",
      "lr.mkVol": "Divergensi volume",
      "lr.mkThMarker": "Marker exhaustion",
      "lr.mkThWith": "Dengan marker",
      "lr.mkThWithout": "Tanpa marker",
      "lr.mkStats": "n={n} · win {w}% · mean {m}",
      "lr.mkNote": "Marker tetap variabel riset. Selisih antara “dengan” dan “tanpa” pada ukuran sampel seperti ini adalah observasi, bukan bukti bahwa marker memprediksi apa pun.",
      "lr.pairedNotEnough": "Sinyal yang keempat horizonnya tervalidasi belum cukup (n<5).",
      "lr.pairedIntro": "Kohort berpasangan: <b>{n}</b> dari {total} sinyal, di {closes} penutupan 4J yang berbeda. Dikecualikan: tanpa +30m {m30}, tanpa +1H {m1}, tanpa +4H {m4}, tanpa +8H {m8} (satu sinyal bisa kehilangan lebih dari satu horizon).",
      "lr.thMfe": "Mean MFE", "lr.thMae": "Mean MAE",
      "lr.pairedNote": "MFE/MAE adalah rata-rata ekskursi terbaik/terburuk dalam tiap horizon (+4H/+8H dari ekstrem bar 4J, bukan tick). Return gross di seluruhnya — bandingkan dengan tabel net +30m di atas, bukan melawannya.",
      "lr.trajTitle": "Trajektori momentum",
      "lr.trajContinued": "Berlanjut",
      "lr.trajReversed": "Berbalik",
      "lr.trajFull": "— di antaranya: berbalik penuh",
      "lr.trajLate": "Terlambat naik",
      "lr.trajNever": "Tidak pernah naik",
      "lr.distTitle": "Distribusi hasil net +30m (n={n})",
      "lr.mvwTitle": "Mean vs win rate",
      "lr.mvwWin": "Win rate (+30m)",
      "lr.mvwMean": "Mean net",
      "lr.mvwMedian": "Median net",
      "lr.contribTitle": "Kontribusi tiap sinyal terhadap total",
      "lr.thSignal": "Sinyal", "lr.thNet": "Net",
      "lr.thShare": "Porsi dari total",
      "lr.contribNote": "Porsi di atas 100% berarti satu sinyal mengalahkan seluruh total net — sinyal-sinyal lainnya saling meniadakan.",
      "lr.verdAssociation": "Asosiasi teramati",
      "lr.verdNoClear": "Tidak ada asosiasi jelas",
      "lr.verdConsistent": "Konsisten dengan hipotesis",
      "lr.verdAgainst": "Bertentangan dengan hipotesis",
      "lr.verdInsuff": "Data belum cukup",
      "lr.verdNoData": "Belum ada data",
      "lr.verdNotEval": "Tidak bisa dievaluasi",
      "lr.agBreakout": "Intelijen Breakout",
      "lr.agReversal": "Intelijen Reversal",
      "lr.agOrderflow": "Intelijen Arus Order",
      "lr.agRegime": "Intelijen Rezim Pasar",
      "lr.agLiquidity": "Intelijen Likuiditas",
      "lr.agPerformance": "Pembelajaran Kinerja",
      "lr.thObservation": "Observasi",
      "lr.thVerdict": "Putusan",
      "lr.thEvidence": "Bukti",
      "lr.aeIntro": "Dievaluasi pada n={n} hasil +30m yang bisa dievaluasi. ",
      "lr.siSentence": "{ne} sinyal yang bisa dievaluasi berasal dari {ce} penutupan 4J yang berbeda; {np} sinyal berpasangan dari {cp}.",
      "lr.casesEmpty": "Belum ada hasil BULLA/IDOL yang dievaluasi.",
      "lr.th30net": "Net +30m",
      "lr.th1h": "+1H", "lr.th4h": "+4H", "lr.th8h": "+8H",
      "lr.thMfeMae": "MFE / MAE (+30m)",
      "lr.caseNote": "Aturan yang sama, jalur yang berlawanan — itulah kenapa satu contoh tidak pernah bisa membenarkan perubahan strategi.",
      "lr.caseNote2": "+8H terbaik BULLA: {b}; +8H terburuk IDOL: {i}. ",
      "lr.sumTopics": "Topik yang dipantau",
      "lr.thTopic": "Topik", "lr.thStatus": "Status",
      "lr.thRead": "Pembacaan saat ini",
      "lr.stObserved": "teramati", "lr.stMixed": "campuran",
      "lr.stInsuff": "belum cukup", "lr.stNoData": "belum ada data",
      "lr.sumWorked": "Apa yang bertahan",
      "lr.sumWorkedEmpty": "Belum ada yang memenuhi ambang batas — tidak ada temuan yang disajikan sebagai berhasil.",
      "lr.sumFailed": "Apa yang gagal bertahan",
      "lr.sumFailedEmpty": "Belum ada pola yang diuji gagal.",
      "lr.sumChanged": "Apa yang berubah sejak evaluasi sebelumnya",
      "lr.sumChangedEmpty": "Tidak ada perubahan material yang tercatat.",
      "lr.sumInconcl": "Belum bisa disimpulkan",
      "lr.sumInconclEmpty": "Semua yang dievaluasi sudah punya putusan.",
      "lr.sumBased": "Berdasarkan {e} hasil +30m yang bisa dievaluasi dan {p} sinyal kohort berpasangan. “Apa yang bertahan” hanya berisi asosiasi eksploratif — tidak ada di sini yang merupakan klaim prediktif.",
      "lr.cpComplete": "Hasil lengkap (kohort berpasangan)",
      "lr.cpCloses": "Penutupan 4J berbeda di baliknya",
      "lr.cpNext": "Checkpoint berikutnya",
      "lr.cpAllReached": "semua tercapai",
      "lr.cpNextVal": "{n} sinyal ({p}%)",
      "lr.cpNone": "Belum ada checkpoint tercapai — yang pertama di 40 hasil lengkap.",
      "lr.cpReached": "Checkpoint {n} sinyal",
      "lr.regPending": "Split eksplorasi/validasi belum membeku.",
      "lr.regSplit": "Split membeku {d} — {n} sinyal pertama yang bisa dievaluasi adalah discovery set.",
      "lr.regEmpty": "Belum ada hipotesis yang lolos ambang sampel (n≥10 di kedua bucket + selisih ≥2pp). Begitu ada, hipotesis itu dicatat beku di sini, sebelum data baru mengujinya.",
      "lr.thId": "ID",
      "lr.thHyp": "Hipotesis (dibekukan saat registrasi)",
      "lr.thVal": "Validasi pada data yang lebih baru",
      "lr.regAwaiting": "menunggu validasi",
      "lr.regValidated": "tervalidasi",
      "lr.regRejected": "ditolak",
      "lr.regHolds": "berlaku",
      "lr.regNotHolds": "tidak berlaku",
      "lr.regValN": " (n {a} vs {b})",
      "lr.clEval": "Sinyal yang dievaluasi (net +30m)",
      "lr.clClosesAll": "Penutupan 4J unik (semua sinyal)",
      "lr.clClosesEval": "Penutupan 4J unik (yang bisa dievaluasi)",
      "lr.clLargest": "Penutupan tunggal terbesar",
      "lr.clLargestVal": "{n} sinyal ({p}%)",
      "lr.clTop3": "3 penutupan teratas digabung",
      "lr.clTop3Val": "{p}% dari semua sinyal",
      "lr.clRecon": "Konteks 1J direkonstruksi",
      "lr.clReconVal": "{n}/{total} sinyal (REKONSTRUKSI HISTORIS)",
      "lr.thCloseWib": "Penutupan 4J (WIB)",
      "lr.thSignals": "Sinyal",
      "lr.thEvaluable": "Bisa dievaluasi",
      "lr.thWins": "Menang",
      "lr.thMeanNet": "Mean net +30m",
      "lr.thMeanGross": "Mean gross +30m",
      "lr.clSplitNote": " Split eksplorasi/validasi menjaga seluruh penutupan tetap bersama, jadi tidak ada penutupan yang pernah terbelah antara kedua set.",
      "tl.noArchive": "Arsip tidak tersedia.",
      "tl.thVersion": "Versi", "tl.thRecords": "Rekaman",
      "tl.thOi": "OI", "tl.thFunding": "Funding",
      "tl.thDepth": "Band depth",
      "tl.verNote": "Jumlah cakupan bertambah seiring file arsip terbit — rekaman analisis yang sama mendapat OI keesokan harinya dan funding bulan berikutnya.",
      "tl.recoFunding": "<strong>Funding rate tiba di bulan Desember.</strong> File arsip bulanan akan mengisi bucket funding secara otomatis — tidak perlu tindakan, cukup bersabar.",
      "tl.recoOi": "<strong>Cakupan Open Interest masih terisi</strong> ({m} sinyal hilang). File arsip harian terbit sehari kemudian; pipeline mencoba ulang secara otomatis.",
      "tl.recoH1": "<strong>Horizon +1H masih terisi</strong> ({p}% lengkap). Horizon yang sudah dievaluasi kini bersifat sticky, dan backfill harian memulihkan sisanya dari arsip resmi Binance saat file tiap harinya terbit — hasil backfill dilabeli.",
      "tl.recoHyp": "<strong>Terus kumpulkan hasil.</strong> Dengan n={n} sinyal yang bisa dievaluasi, belum ada hipotesis yang lolos ambang batas (n≥10 di kedua bucket + selisih ≥2pp). Sistem bekerja sesuai desain — sistem menolak mengarang pola dari sampel kecil.",
      "tl.recoTrend": "<strong>Belum ada sinyal yang muncul saat BTC uptrend.</strong> Perbandingan rezim masih satu sisi sampai pasar berbalik — anggap kontras TRENDING_DOWN vs RANGING sebagai sementara.",
      "tl.recoMarkers": "<strong>Marker reversal tetap variabel riset.</strong> Hasil awal tidak menunjukkan pola prediktif yang jelas; mengubah atau menghapus marker berdasarkan {n} hasil akan menjadi overfitting.",
      "lbl.searchSignals": "Cari sinyal",
      "lbl.searchExplorer": "Cari di explorer",
      "lbl.filterOutcome": "Filter berdasarkan hasil",
      "lbl.filterRegime": "Filter berdasarkan rezim BTC",
      "grp.signal": "1 sinyal",
      "grp.signals": "{n} sinyal",
      "grp.continued": "{n} lanjut naik",
      "grp.reversed": "{n} berbalik",
      "grp.mean": "rata-rata {v}",
      "grp.showAll": "Tampilkan semua {n}",
      "grp.showLess": "Tampilkan lebih sedikit"
    }
  };

  /* Bucket labels: data keys are English/code-like; the ID column gives
     the translated label. Unknown keys fall back to the key itself. */
  var BUCKET_LABELS = {
    "aligned": { en: "aligned", id: "selaras" },
    "not_aligned": { en: "not_aligned", id: "tidak selaras" },
    "TRENDING_UP": { en: "TRENDING_UP", id: "BTC naik" },
    "RANGING": { en: "RANGING", id: "BTC sideways" },
    "TRENDING_DOWN": { en: "TRENDING_DOWN", id: "BTC turun" },
    "falling_-10%+": { en: "falling_-10%+", id: "turun 10%+" },
    "flat": { en: "flat", id: "datar" },
    "rising_10%+": { en: "rising_10%+", id: "naik 10%+" },
    "sell ≤ −0.10": { en: "sell ≤ −0.10", id: "jual ≤ −0,10" },
    "balanced": { en: "balanced", id: "seimbang" },
    "buy ≥ +0.10": { en: "buy ≥ +0.10", id: "beli ≥ +0,10" },
    "tight_<2": { en: "tight_<2", id: "ketat <2" },
    "normal_2-10": { en: "normal_2-10", id: "normal 2–10" },
    "wide_10+": { en: "wide_10+", id: "lebar 10+" },
    "<0.5%": { en: "<0.5%", id: "<0,5%" },
    "0.5–2%": { en: "0.5–2%", id: "0,5–2%" }
  };
  function bucketLabel(name) {
    var m = BUCKET_LABELS[name];
    if (!m) return name;
    return lang() === "id" ? m.id : m.en;
  }

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
  /* Bilingual data field: idVal is the Indonesian value, enVal the
     English twin. Falls back to whichever exists (v2.1.0 records have
     no twins yet — they render in their original language). */
  function bi(idVal, enVal) {
    if (lang() === "id") return idVal == null ? enVal : idVal;
    return enVal == null ? idVal : enVal;
  }
  /* The backend stores "DATA UNAVAILABLE" as a language-neutral status
     token inside otherwise-translated prose ("orderflow: funding rate
     DATA UNAVAILABLE (arsip bulanan...)"). Map it when rendering
     Indonesian so the sentence reads fully in ID; EN mode keeps the
     token as-is (audit 24 Nov 2026). */
  function localizeTokens(txt) {
    if (lang() !== "id" || !txt) return txt;
    return txt.split("DATA UNAVAILABLE").join("DATA TIDAK TERSEDIA");
  }
  /* Verdict codes are stored raw in the data; the agent-evaluation table
     maps them to labels, and so does the learning summary below. */
  function verdictLabel(code) {
    var map = { association: "lr.verdAssociation",
      no_clear_association: "lr.verdNoClear",
      consistent: "lr.verdConsistent", inconsistent: "lr.verdAgainst",
      insufficient_data: "lr.verdInsuff", no_data: "lr.verdNoData",
      not_evaluable: "lr.verdNotEval" };
    return map[code] ? t(map[code]) : null;
  }
  /* Free-form backend prose (e.g. topic details "BTC TRENDING_DOWN vs
     RANGING: no_clear_association; BTC TRENDING_UP: no_data") embeds raw
     verdict codes mid-sentence. Replace any known code with its
     translated label; unknown text passes through untouched. */
  function localizeVerdictCodes(txt) {
    if (!txt) return txt;
    return txt.replace(/\b(no_clear_association|insufficient_data|not_evaluable|association|consistent|inconsistent|no_data)\b/g, function (code) {
      return verdictLabel(code) || code;
    });
  }
  /* Learning-summary findings arrive as one pre-formatted string,
     "Observation — verdict_code (n A vs B)", identical in text/text_id.
     Split the verdict code out and render the translated label instead
     of the raw snake_case code. Non-finding items (e.g. the "changed"
     baseline sentence) fall back to the free-form replacer, which
     leaves plain sentences untouched. */
  function localizeSummaryItem(txt) {
    var m = /^(.*) — ([a-z_]+)( \(n \d+ vs \d+\))?$/.exec(txt || "");
    if (m) {
      var lbl = verdictLabel(m[2]);
      if (lbl) return m[1] + " — " + lbl + (m[3] || "");
    }
    return localizeVerdictCodes(txt);
  }
  /* The momentum topic detail embeds raw trajectory names mid-sentence
     ("n_paired=29: continued 3, reversed 5 (full reversal 5),
     late_bloom 12, never_up 9"). Map them in ID mode; EN keeps the
     English names. "full reversal" is replaced first — it contains
     "reversal", not "reversed", but order keeps the mapping safe. */
  function localizeTrajectories(txt) {
    if (lang() !== "id" || !txt) return txt;
    return txt
      .replace(/\bfull reversal\b/g, "berbalik penuh")
      .replace(/\blate_bloom\b/g, "naik terlambat")
      .replace(/\bnever_up\b/g, "tidak pernah naik")
      .replace(/\bcontinued\b/g, "lanjut naik")
      .replace(/\breversed\b/g, "berbalik");
  }
  /* Slippage method codes are stored raw (real_levels / bands_bound /
     linear_estimate); render a friendly label in both languages. */
  function slipMethodLabel(code) {
    var map = { real_levels: "det.slipReal", bands_bound: "det.slipBands",
      linear_estimate: "det.slipLinear" };
    return map[code] ? t(map[code]) : code;
  }
  /* Book snapshot delay (24 Nov 2026, Raka approved): asof_ms is when the
     live book_top10 was captured; the close is sig.signal_ts. Median
     ~5 min under flood. ID mode uses a decimal comma + "mnt"/"dtk". */
  function fmtBookDelay(sec) {
    if (sec == null) return null;
    var isId = lang() === "id";
    if (sec < 60) return Math.round(sec) + " " + t("det.bookSec");
    var m = (sec / 60).toFixed(1);
    if (isId) m = m.replace(".", ",");
    return m + " " + t("det.bookMin");
  }
  function bookDelayText(sig) {
    var b = sig.snapshot && sig.snapshot.book_top10;
    if (!b || !b.present) return t("det.bookNo");
    if (b.asof_ms && sig.signal_ts) {
      var sec = Math.max(0, b.asof_ms / 1000 - sig.signal_ts);
      return t("det.bookDelay", { d: fmtBookDelay(sec) });
    }
    return t("det.bookYes");
  }
  function updateLangButtons() {
    var l = lang();
    Array.prototype.forEach.call(
      document.querySelectorAll("#lang-switch [data-lang]"), function (btn) {
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
    updateLangButtons();
    renderAll();
  }
  var refreshMotionToggle = function () {}; // replaced by initMotionToggle
  function renderStatic() {
    Array.prototype.forEach.call(
      document.querySelectorAll("[data-i18n]"), function (el) {
        el.textContent = t(el.getAttribute("data-i18n"));
      });
    Array.prototype.forEach.call(
      document.querySelectorAll("[data-i18n-html]"), function (el) {
        el.innerHTML = t(el.getAttribute("data-i18n-html"));
      });
    Array.prototype.forEach.call(
      document.querySelectorAll("[data-i18n-ph]"), function (el) {
        el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph")));
      });
    Array.prototype.forEach.call(
      document.querySelectorAll(".rail-link[data-section]"), function (a) {
        var sp = a.querySelector("span");
        var v = sp ? sp.textContent : t("rail." + a.getAttribute("data-section"));
        a.setAttribute("aria-label", v);
        a.title = v;
      });
    var home = document.querySelector('.rail-link[href="index.html"]');
    if (home) {
      home.setAttribute("aria-label", t("rail.homeAria"));
      home.title = t("rail.homeAria");
    }
    updateLangButtons();
    refreshMotionToggle();
  }
  function renderAll() {
    renderStatic();
    if (!DATA) return;
    renderOverview();
    renderSignalList($("signal-search") ? $("signal-search").value : "");
    renderSignalDetail();
    renderInsights();
    renderLearning();
    renderTimeline();
    renderExplorer();
    watchReveals();
  }

  /* ---------------------------------------------------------- helpers */
  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function fmtNum(x, dec) {
    if (x == null || !isFinite(x)) return null;
    return x.toLocaleString("en-US", {
      minimumFractionDigits: dec == null ? 2 : dec,
      maximumFractionDigits: dec == null ? 2 : dec });
  }

  function fmtPct(x, dec) {
    var v = fmtNum(x, dec);
    return v == null ? null : (x > 0 ? "+" : "") + v + "%";
  }

  function fmtPrice(x) {
    if (x == null || !isFinite(x)) return null;
    if (x >= 1000) return fmtNum(x, 2);
    if (x >= 1) return fmtNum(x, 4);
    if (x >= 0.01) return fmtNum(x, 5);
    return fmtNum(x, 6);
  }

  function fmtUsd(x) {
    if (x == null || !isFinite(x)) return null;
    if (Math.abs(x) >= 1e6) return "$" + fmtNum(x / 1e6, 1) + "M";
    if (Math.abs(x) >= 1e3) return "$" + fmtNum(x / 1e3, 1) + "k";
    return "$" + fmtNum(x, 0);
  }

  function fmtWib(ts) {
    if (ts == null) return null;
    try {
      return new Intl.DateTimeFormat(lang() === "id" ? "id-ID" : "en-GB", {
        timeZone: "Asia/Jakarta", day: "2-digit", month: "short",
        hour: "2-digit", minute: "2-digit", hour12: false
      }).format(new Date(ts * 1000));
    } catch (e) { return null; }
  }

  function fmtDate(ts) {
    if (ts == null) return null;
    try {
      return new Intl.DateTimeFormat(lang() === "id" ? "id-ID" : "en-GB", {
        timeZone: "Asia/Jakarta", day: "2-digit", month: "short",
        year: "numeric"
      }).format(new Date(ts * 1000));
    } catch (e) { return null; }
  }

  function na(v) {
    return v == null ? '<span class="na">N/A</span>' : esc(v);
  }

  function clsOf(sig) {
    var h = sig.performance && sig.performance.h30m;
    return h && h.status === "evaluated" ? h.classification : null;
  }

  function net30Of(sig) {
    var h = sig.performance && sig.performance.h30m;
    return h && h.status === "evaluated" ? h.net_pct : null;
  }

  function r4hOf(sig) {
    var h = sig.performance && sig.performance.h4;
    return h && h.status === "evaluated" ? h.return_pct : null;
  }

  function statusBadge(status) {
    var map = { "COMPLETED": "st-completed", "PARTIAL DATA": "st-partial",
                "UNAVAILABLE": "st-unavailable", "ERROR": "st-error" };
    var cls = map[status] || "st-unavailable";
    return '<span class="status-badge ' + cls + '">' +
      esc(status || "UNKNOWN") + "</span>";
  }

  function kvRow(label, valueHtml) {
    return "<tr><th>" + esc(label) + "</th><td>" +
      (valueHtml == null ? '<span class="na">N/A</span>' : valueHtml) +
      "</td></tr>";
  }

  /* ---------------------------------------------------------- charts */
  function bucketChart(buckets, order) {
    var html = "";
    var any = false;
    order.forEach(function (name) {
      var b = buckets ? buckets[name] : null;
      if (!b) {
        html += '<div class="bucket-row"><span class="bucket-name">' +
          esc(bucketLabel(name)) + '</span><span class="bucket-empty">' + t("bucket.noStats") + "</span>" +
          '<span class="bucket-val"></span></div>';
        return;
      }
      any = true;
      var win = b.win_rate_pct == null ? 0 : b.win_rate_pct;
      var mean = b.mean_net30_pct;
      var neg = mean != null && mean < 0;
      html += '<div class="bucket-row"><span class="bucket-name">' +
        esc(bucketLabel(name)) + '</span><span class="bucket-track"><i class="' +
        (neg ? "neg-fill" : "") + '" style="width:' +
        Math.max(2, Math.min(100, win)) + '%"></i></span>' +
        '<span class="bucket-val">' + t("bucket.win") + " " + fmtNum(win, 0) + '% · ' +
        (mean == null ? "—" : fmtPct(mean, 2)) + " · n=" + b.n +
        "</span></div>";
    });
    if (!any) {
      html += '<p class="bucket-empty">' + t("bucket.none") + "</p>";
    }
    return html;
  }

  function scatterChart(points, opts) {
    // points: [{x, y, cls, label}]; opts: {xLabel, logX}
    var W = 340, H = 200, P = { l: 38, r: 8, t: 10, b: 26 };
    var xs = points.map(function (p) { return opts.logX ? Math.log10(Math.max(p.x, 0.01)) : p.x; });
    var ys = points.map(function (p) { return p.y; });
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
    var minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    if (minX === maxX) { minX -= 1; maxX += 1; }
    if (minY === maxY) { minY -= 1; maxY += 1; }
    var padX = (maxX - minX) * 0.08, padY = (maxY - minY) * 0.15;
    minX -= padX; maxX += padX; minY -= padY; maxY += padY;
    function sx(v) { return P.l + (v - minX) / (maxX - minX) * (W - P.l - P.r); }
    function sy(v) { return H - P.b - (v - minY) / (maxY - minY) * (H - P.t - P.b); }
    var colors = { "PUMP CONTINUED": "#abed77", "REVERSAL": "#ff758a",
                   "SIDEWAYS": "#819495" };
    var out = '<svg class="chart-svg" viewBox="0 0 ' + W + " " + H +
      '" role="img" aria-label="' + esc(t("scatter.aria", { x: opts.xLabel })) + '">';
    out += '<line class="grid" x1="' + P.l + '" y1="' + sy(0) + '" x2="' +
      (W - P.r) + '" y2="' + sy(0) + '"/>';
    out += '<line class="axis" x1="' + P.l + '" y1="' + P.t + '" x2="' +
      P.l + '" y2="' + (H - P.b) + '"/>';
    out += '<line class="axis" x1="' + P.l + '" y1="' + (H - P.b) +
      '" x2="' + (W - P.r) + '" y2="' + (H - P.b) + '"/>';
    out += '<text x="4" y="' + (sy(maxY) + 3) + '">' + fmtNum(maxY, 0) + '%</text>';
    out += '<text x="4" y="' + (sy(minY) + 3) + '">' + fmtNum(minY, 0) + '%</text>';
    out += '<text x="' + P.l + '" y="' + (H - 6) + '">' +
      (opts.logX ? fmtNum(Math.pow(10, minX), 1) + "×" : fmtNum(minX, 1)) + "</text>";
    out += '<text x="' + (W - P.r) + '" y="' + (H - 6) +
      '" text-anchor="end">' +
      (opts.logX ? fmtNum(Math.pow(10, maxX), 0) + "×" : fmtNum(maxX, 1)) + "</text>";
    out += '<text x="' + (W / 2) + '" y="' + (H - 16) +
      '" text-anchor="middle">' + esc(opts.xLabel) + "</text>";
    points.forEach(function (p) {
      var cx = sx(opts.logX ? Math.log10(Math.max(p.x, 0.01)) : p.x);
      var cy = sy(p.y);
      out += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) +
        '" r="4" fill="' + (colors[p.cls] || "#a3b4b4") +
        '" fill-opacity="0.85"><title>' + esc(p.label) + "</title></circle>";
    });
    out += "</svg>";
    return out;
  }

  /* ---------------------------------------------------------- overview */
  function renderOverview() {
    var ov = DATA.overview;
    var signals = DATA.signals;
    var first = signals.length ? signals[0].signal_ts : null;
    var last = signals.length ? signals[signals.length - 1].signal_ts : null;
    var lastAnalysis = DATA.meta.last_analysis_ts;
    $("hero-meta").textContent =
      (signals.length ? fmtDate(first) + " – " + fmtDate(last) + "  ·  " : "") +
      t("ov.researchV") + (DATA.meta.research_version || "?") +
      "  ·  " + t("ov.lastAnalysis") + " " + (fmtWib(lastAnalysis) || "N/A") + " WIB";

    var overall = ov.overall || {};
    var stats = [
      { label: t("ov.stat1"), value: String(ov.n_analyzed == null ? 0 : ov.n_analyzed),
        note: t("ov.stat1n", { n: ov.n_signals == null ? "?" : ov.n_signals }) },
      { label: t("ov.stat2"), value: String(ov.n_evaluable_30m == null ? 0 : ov.n_evaluable_30m),
        note: t("ov.stat2n") },
      { label: t("ov.stat3"), value: overall.win_rate_pct == null ? "N/A" : fmtNum(overall.win_rate_pct, 1) + "%",
        note: t("ov.stat3n", { n: ov.n_evaluable_30m == null ? 0 : ov.n_evaluable_30m }) },
      { label: t("ov.stat4"), value: overall.mean_net30_pct == null ? "N/A" : fmtPct(overall.mean_net30_pct, 2),
        note: t("ov.stat4n") },
      { label: t("ov.stat5"), value: String((ov.hypotheses || []).length),
        note: t("ov.stat5n") },
      { label: t("ov.stat6"), value: ov.snapshot_coverage_pct == null ? "N/A" : fmtNum(ov.snapshot_coverage_pct, 0) + "%",
        note: t("ov.stat6n") },
    ];
    $("overview-stats").innerHTML = stats.map(function (s) {
      return '<div class="stat-card card"><p class="stat-label">' + esc(s.label) +
        '</p><p class="stat-value">' + esc(s.value) +
        '</p><p class="stat-note">' + esc(s.note) + "</p></div>";
    }).join("");

    // Per-agent coverage
    var agents = ["breakout", "reversal", "orderflow", "regime", "liquidity"];
    var names = { breakout: t("ov.agentBreakout"), reversal: t("ov.agentReversal"),
                  orderflow: t("ov.agentOrderflow"), regime: t("ov.agentRegime"),
                  liquidity: t("ov.agentLiquidity") };
    var cov = ov.per_agent_coverage || {};
    var n = ov.n_analyzed || 1;
    $("agent-coverage").innerHTML = agents.map(function (a) {
      var d = cov[a] || {};
      var ok = d.COMPLETED || 0, part = d["PARTIAL DATA"] || 0,
          miss = (d.UNAVAILABLE || 0) + (d.ERROR || 0) + (d.MISSING || 0);
      return '<div class="cov-row"><span class="cov-name">' + names[a] +
        '</span><span class="cov-bar"><i class="b-ok" style="width:' + (ok / n * 100) +
        '%"></i><i class="b-part" style="width:' + (part / n * 100) +
        '%"></i><i class="b-miss" style="width:' + (miss / n * 100) +
        '%"></i></span><span class="cov-val">' + ok + " / " + part + " / " + miss +
        "</span></div>";
    }).join("") +
      '<div class="cov-legend"><span><i style="background:var(--pos)"></i>' + t("ov.legendComplete") + '</span>' +
      '<span><i style="background:var(--warn)"></i>' + t("ov.legendPartial") + '</span>' +
      '<span><i style="background:var(--neg)"></i>' + t("ov.legendMiss") + '</span></div>';

    // Regime distribution
    var regimes = ov.regime_distribution || {};
    var order = ["TRENDING_UP", "RANGING", "TRENDING_DOWN"];
    var rlabels = { TRENDING_UP: t("ov.regimeUp"), RANGING: t("ov.regimeRanging"),
                    TRENDING_DOWN: t("ov.regimeDown") };
    var total = order.reduce(function (s, k) { return s + (regimes[k] || 0); }, 0) || 1;
    $("regime-dist").innerHTML = order.map(function (k) {
      var c = regimes[k] || 0;
      return '<div class="cov-row"><span class="cov-name">' + rlabels[k] +
        '</span><span class="cov-bar"><i class="b-ok" style="width:' +
        (c / total * 100) + '%"></i></span><span class="cov-val">' + c +
        " (" + fmtNum(c / total * 100, 0) + "%)</span></div>";
    }).join("");

    // Outcome completeness
    var oc = ov.outcome_completeness || {};
    var horizons = [["h30m", "+30m"], ["h1", "+1H"], ["h4", "+4H"], ["h8", "+8H"]];
    $("outcome-completeness").innerHTML = horizons.map(function (h) {
      var d = oc[h[0]] || {};
      var pct = d.completeness_pct == null ? 0 : d.completeness_pct;
      return '<div class="cov-row"><span class="cov-name">' + h[1] +
        '</span><span class="cov-bar"><i class="b-ok" style="width:' + pct +
        '%"></i></span><span class="cov-val">' +
        t("ov.mature", { e: d.evaluated == null ? 0 : d.evaluated,
                         m: d.mature == null ? 0 : d.mature }) + "</span></div>";
    }).join("");

    // Hypotheses
    var hyps = ov.hypotheses || [];
    $("hypotheses").innerHTML = hyps.length === 0
      ? '<p class="panel-sub" style="margin:0">' +
        t("ov.hypEmpty", { n: ov.n_evaluable_30m || 0 }) + "</p>"
      : hyps.map(function (h) {
          return "<p><strong>" + esc(h.feature || "?") + "</strong>: " +
            esc(h.observation || "") + "<br><span class='muted'>" +
            esc(h.status || "") + "</span></p>";
        }).join("");

    // Data quality
    var dq = DATA.data_quality || {};
    var profile = dq.missing_data_profile || {};
    var keys = Object.keys(profile).sort(function (a, b) {
      return (profile[b].missing_pct || 0) - (profile[a].missing_pct || 0);
    });
    var labels = { decisions: t("ov.dqDecisions"), signal_bar: t("ov.dqSignalBar"),
      ema20: "EMA20", atr14: "ATR14", macd: "MACD", mtf_1h: t("ov.dqMtf1h"),
      open_interest: t("ov.dqOi"), funding_rate: t("ov.dqFunding"),
      btc_regime: t("ov.dqBtcRegime"), breadth: t("ov.dqBreadth"),
      spread: t("ov.dqSpread"), impact_10k: t("ov.dqImpact"), depth: t("ov.dqDepth") };
    $("data-quality").innerHTML =
      '<ul class="missing-list">' + keys.map(function (k) {
        var p = profile[k];
        return "<li><span>" + esc(labels[k] || k) + "</span><span class='num'>" +
          t("ov.dqMissing", { m: p.missing || 0, n: p.n || 0,
                              p: fmtNum(p.missing_pct || 0, 0) }) + "</span></li>";
      }).join("") + "</ul>";
  }

  /* ---------------------------------------------------------- signals */
  function signalRowHtml(sig) {
    var cls = clsOf(sig);
    var clsLabel = { "PUMP CONTINUED": [t("sig.continued"), "cls-continued"],
      "REVERSAL": [t("sig.reversed"), "cls-reversal"],
      "SIDEWAYS": [t("sig.sideways"), "cls-sideways"] }[cls] ||
      [t("sig.pending"), "cls-pending"];
    return '<button type="button" class="signal-item' +
      (sig.signal_id === SELECTED_ID ? " active" : "") +
      '" data-id="' + esc(sig.signal_id) + '" role="option" aria-selected="' +
      (sig.signal_id === SELECTED_ID) + '"><span><span class="sym">' +
      esc(sig.symbol) + '</span><br><span class="meta">' +
      esc(fmtWib(sig.signal_ts) || "") + ' WIB</span></span><span class="cls ' +
      clsLabel[1] + '">' + clsLabel[0] + "</span></button>";
  }

  /* ---- v36: close grouping helpers ---- */
  function groupByClose(list) {
    var groups = [];
    var map = {};
    list.forEach(function (s) {
      var key = s.signal_ts;
      if (!map[key]) {
        map[key] = { close_ts: key, signals: [] };
        groups.push(map[key]);
      }
      map[key].signals.push(s);
    });
    groups.sort(function (a, b) { return b.close_ts - a.close_ts; });
    return groups;
  }
  function latestCloseTs() {
    var max = null;
    DATA.signals.forEach(function (s) {
      if (max == null || s.signal_ts > max) max = s.signal_ts;
    });
    return max;
  }
  function groupHeadLabel(closeTs, sigs) {
    var cont = 0, rev = 0, sum = 0, nNet = 0;
    sigs.forEach(function (s) {
      var c = clsOf(s);
      if (c === "PUMP CONTINUED") cont++;
      if (c === "REVERSAL") rev++;
      var net = net30Of(s);
      if (net != null) { sum += net; nNet++; }
    });
    var label = (fmtWib(closeTs) || "") + " WIB · " +
      (sigs.length === 1 ? t("grp.signal")
        : t("grp.signals", { n: sigs.length }));
    if (nNet > 0) {
      label += " · " + t("grp.continued", { n: cont }) +
        " · " + t("grp.reversed", { n: rev }) +
        " · " + t("grp.mean", { v: fmtPct(sum / nNet, 2) });
    }
    return label;
  }
  function groupIsOpen(g, forceOpen) {
    if (forceOpen) return true;
    if (g.signals.some(function (s) { return s.signal_id === SELECTED_ID; }))
      return true;
    if (GROUP_EXPANDED[g.close_ts]) return true;
    if (GROUP_COLLAPSED[g.close_ts]) return false;
    return g.close_ts === latestCloseTs();
  }
  function toggleGroup(closeTs, open) {
    if (open) {
      delete GROUP_COLLAPSED[closeTs];
      GROUP_EXPANDED[closeTs] = true;
    } else {
      GROUP_COLLAPSED[closeTs] = true;
      delete GROUP_EXPANDED[closeTs];
    }
  }
  function toggleShowAll(closeTs) {
    if (GROUP_SHOW_ALL[closeTs]) delete GROUP_SHOW_ALL[closeTs];
    else GROUP_SHOW_ALL[closeTs] = true;
  }
  function groupHeadButtonHtml(g, open) {
    return '<button type="button" class="close-group-head" data-close="' +
      g.close_ts + '" aria-expanded="' + open + '"><span class="cg-chev">' +
      (open ? "▾" : "▸") + '</span><span class="cg-label">' +
      esc(groupHeadLabel(g.close_ts, g.signals)) + "</span></button>";
  }
  function groupMoreButtonHtml(g) {
    var total = g.signals.length;
    if (total <= GROUP_PAGE_SIZE) return "";
    var all = !!GROUP_SHOW_ALL[g.close_ts];
    return '<button type="button" class="close-group-more" data-close="' +
      g.close_ts + '">' +
      (all ? t("grp.showLess")
        : t("grp.showAll", { n: total })) + "</button>";
  }

  function renderSignalList(filter) {
    var list = DATA.signals.slice().reverse();
    if (filter) {
      var q = filter.toLowerCase();
      list = list.filter(function (s) {
        return s.symbol.toLowerCase().indexOf(q) !== -1;
      });
    }
    var forceOpen = !!filter;
    var groups = groupByClose(list);
    var html = "";
    groups.forEach(function (g) {
      var open = groupIsOpen(g, forceOpen);
      html += groupHeadButtonHtml(g, open);
      if (open) {
        var showAll = !!GROUP_SHOW_ALL[g.close_ts];
        var items = showAll ? g.signals
          : g.signals.slice(0, GROUP_PAGE_SIZE);
        html += '<div class="close-group-items" data-close="' + g.close_ts + '">' +
          items.map(signalRowHtml).join("") + "</div>";
        html += groupMoreButtonHtml(g);
      }
    });
    $("signal-list").innerHTML = list.length ? html
      : '<p class="muted" style="padding:8px;font-size:13px">' + t("sig.noMatch") + "</p>";
    Array.prototype.forEach.call(
      $("signal-list").querySelectorAll(".signal-item"), function (el) {
        el.addEventListener("click", function () {
          selectSignal(el.getAttribute("data-id"));
        });
      });
    Array.prototype.forEach.call(
      $("signal-list").querySelectorAll(".close-group-head"), function (el) {
        el.addEventListener("click", function () {
          var closeTs = +el.getAttribute("data-close");
          var open = el.getAttribute("aria-expanded") !== "true";
          toggleGroup(closeTs, open);
          renderSignalList($("signal-search").value);
        });
      });
    Array.prototype.forEach.call(
      $("signal-list").querySelectorAll(".close-group-more"), function (el) {
        el.addEventListener("click", function () {
          toggleShowAll(+el.getAttribute("data-close"));
          renderSignalList($("signal-search").value);
        });
      });
  }

  function agentCard(title, section, kvPairs, extraHtml) {
    if (!section) return "";
    var html = '<div class="agent-card card"><h4>' + esc(title) + " " +
      statusBadge(section.status) + "</h4>";
    if (kvPairs && kvPairs.length) {
      html += '<table class="kv">' + kvPairs.map(function (p) {
        return kvRow(p[0], p[1]);
      }).join("") + "</table>";
    }
    if (extraHtml) html += extraHtml;
    var obs = section.observations || [];
    if (obs.length) {
      html += '<ul class="obs-list">' + obs.slice(0, 4).map(function (o) {
        return '<li class="' + (o.severity === "notable" ? "notable" : "") +
          '">' + esc(bi(o.text, o.text_en)) + "</li>";
      }).join("") + "</ul>";
    }
    if (section.notes) {
      html += '<p class="notes">' + esc(localizeTokens(bi(section.notes, section.notes_en))) + "</p>";
    }
    var miss = section.missing || [];
    var missEn = section.missing_en || [];
    if (miss.length) {
      html += '<ul class="missing">' + miss.map(function (m, i) {
        return "<li>" + esc(localizeTokens(bi(m, missEn[i]))) + "</li>";
      }).join("") + "</ul>";
    }
    return html + "</div>";
  }

  function horizonCell(label, h) {
    if (!h || h.status !== "evaluated") {
      var reason = h && h.status === "pending" ? t("hz.pending") :
        (h && h.reason ? bi(h.reason, h.reason_en) : t("hz.unavailable"));
      return '<div class="outcome-cell"><p class="lbl">' + label +
        '</p><p class="val na">N/A</p><p class="sub">' + esc(reason) + "</p></div>";
    }
    var net = h.net_pct != null ? fmtPct(h.net_pct, 2) : fmtPct(h.return_pct, 2);
    var cls = h.classification || "";
    var color = cls === "PUMP CONTINUED" ? "pos" :
      cls === "REVERSAL" ? "neg" : "";
    var src = h.source === "vision-backfill"
      ? t("hz.backfilled")
      : (h.source === "local_1m" ? t("hz.live") : "");
    return '<div class="outcome-cell"><p class="lbl">' + label +
      '</p><p class="val ' + color + '">' + esc(net || "—") +
      '</p><p class="sub">' + esc(cls || "") +
      (h.mfe_pct != null ? " · MFE " + fmtPct(h.mfe_pct, 2) : "") +
      (h.mae_pct != null ? " · MAE " + fmtPct(h.mae_pct, 2) : "") + esc(src) + "</p></div>";
  }

  function renderSignalDetail() {
    var sig = DATA.signals.filter(function (s) {
      return s.signal_id === SELECTED_ID;
    })[0] || DATA.signals[DATA.signals.length - 1];
    if (!sig) { $("signal-detail").innerHTML = ""; return; }
    SELECTED_ID = sig.signal_id;
    var d = (sig.snapshot && sig.snapshot.decisions) || {};
    var br = (sig.breakout && sig.breakout.metrics) || {};
    var rv = sig.reversal || {};
    var of = (sig.orderflow && sig.orderflow.metrics) || {};
    var rg = (sig.regime && sig.regime.metrics) || {};
    var lq = (sig.liquidity && sig.liquidity.metrics) || {};
    var oi = of.open_interest || null;
    var fd = of.funding || null;
    var btc = rg.btc || {};
    var breadth = rg.breadth || {};

    var head = '<div class="detail-head card"><h3><span class="sym">' +
      esc(sig.symbol) + '</span> <span class="muted">· ' + esc(sig.market) +
      "</span></h3><p class='detail-meta'>" + t("det.close") + " " +
      esc(fmtWib(sig.signal_ts) || "") + " WIB · " + t("det.price") + " <span class='num'>" +
      esc(fmtPrice(d.close) || "N/A") + "</span> (" +
      esc(fmtPct(d.chg_4h_pct, 2) || "N/A") + ") · RVOL <span class='num'>" +
      esc(fmtNum(d.rvol, 2) || "N/A") + "×</span> · " + t("det.analyzed") + " " +
      esc(fmtWib(sig.analyzed_ts) || "") + " WIB · " + t("ov.researchV") +
      esc(sig.research_version || "?") + " " + statusBadge(sig.status) +
      "</p></div>";

    var cards = "";
    var rc = sig.reconstruction || null;
    var rcNote = rc == null ? "" :
      '<p class="notes">' + t("det.rcNote", {
        files: esc((rc.files || []).join(", ")),
        ver: esc(rc.method_version || "?") }) + "</p>";
    cards += agentCard(t("det.agent1"), sig.breakout, [
      [t("det.bodyRange"), br.body_pct == null ? null : fmtNum(br.body_pct, 0) + t("det.pctOfRange")],
      [t("det.upperWick"), br.upper_wick_pct == null ? null : fmtNum(br.upper_wick_pct, 0) + "%"],
      [t("det.breakoutMargin"), br.breakout_margin_pct == null ? null : fmtPct(br.breakout_margin_pct, 2)],
      [t("det.emaRow"), [fmtPrice(br.ema20), fmtPrice(br.ema50), fmtPrice(br.ema500)].map(function (v) { return v || "N/A"; }).join(" · ")],
      [t("det.emaAligned"), br.ema_aligned_bullish == null ? null : (br.ema_aligned_bullish ? t("det.yes") : t("det.no"))],
      [t("det.rsi4h"), br.rsi_4h == null ? null : fmtNum(br.rsi_4h, 1)],
      [t("det.macd"), br.macd_histogram == null ? null : fmtNum(br.macd_histogram, 4) + (br.macd_rising ? t("det.rising") : "")],
      [t("det.atr"), br.atr14_pct == null ? null : fmtNum(br.atr14_pct, 1) + "%"],
      [t("det.resGap"), br.resistance_gap_pct == null ? null : fmtPct(br.resistance_gap_pct, 2)],
      [t("det.consecUp"), br.consecutive_up_bars == null ? null : String(br.consecutive_up_bars)],
      [t("det.h1ctx"), rc == null || rc.mtf_1h == null ? null :
        fmtPct(rc.mtf_1h.chg_1h_pct, 2) + t("det.histRecon")],
    ], rcNote);
    var markersHtml = (rv.markers || []).length
      ? '<ul class="obs-list">' + rv.markers.map(function (m) {
          return '<li class="notable">' + esc(bi(m.text, m.text_en)) + "</li>";
        }).join("") + "</ul>" : "";
    cards += agentCard(t("det.agent2"), sig.reversal, [
      [t("det.riskLevel"), rv.risk_level || null],
      [t("det.markersObs"), (rv.markers_observed == null ? null : rv.markers_observed + " / 6")],
      [t("det.histCtx"), rv.historical_context && rv.historical_context.n != null
        ? t("det.histCtxVal", { n: rv.historical_context.n,
                                w: fmtNum(rv.historical_context.win_rate_pct, 0) })
        : t("det.histCtxNone")],
    ], markersHtml +
      '<p class="notes">' + t("det.riskNote") + "</p>");
    cards += agentCard(t("det.agent3"), sig.orderflow, [
      [t("det.takerBuy"), of.taker_buy == null ? null : fmtNum(of.taker_buy, 2)],
      [t("det.imbalance"), of.imbalance == null ? null : fmtNum(of.imbalance, 2)],
      [t("det.deltaBar"), of.delta_signal_bar_quote == null ? null : fmtUsd(of.delta_signal_bar_quote) + " (" + fmtPct(of.delta_signal_bar_pct, 1) + ")"],
      [t("det.deltaCum"), of.delta_cum_5bar_before_quote == null ? null : fmtUsd(of.delta_cum_5bar_before_quote)],
      [t("det.oi"), oi ? fmtUsd(oi.open_interest_usd) + t("det.oiAsOf", { t: fmtWib(oi.asof_ts) || "?" }) : null],
      [t("det.oiChg"), of.oi_chg_24h_pct == null ? null : fmtPct(of.oi_chg_24h_pct, 1)],
      [t("det.lsRatio"), oi && oi.count_ls_ratio != null ? fmtNum(oi.count_ls_ratio, 2) : null],
      [t("det.funding"), fd ? fmtNum(fd.funding_rate_pct, 4) + "% / 8h" : null],
    ]);
    cards += agentCard(t("det.agent4"), sig.regime, [
      [t("det.btcRegime"), rg.btc_regime || null],
      [t("det.btcChg"), btc.chg_4h_pct == null ? null : fmtPct(btc.chg_4h_pct, 2)],
      [t("det.btcRsi"), btc.rsi_4h == null ? null : fmtNum(btc.rsi_4h, 1)],
      [t("det.btcAtr"), btc.atr14_pct == null ? null : fmtNum(btc.atr14_pct, 1) + "%"],
      [t("det.btcCorr"), rg.btc_correlation_60bar == null ? null : fmtNum(rg.btc_correlation_60bar, 2)],
      [t("det.brGreen"), breadth.pct_green == null ? null : fmtNum(breadth.pct_green, 0) + t("det.brGreenVal", { n: breadth.n_symbols || "?" })],
      [t("det.brBreakouts"), breadth.pct_breakout == null ? null : fmtNum(breadth.pct_breakout, 1) + "%"],
      [t("det.brMedian"), breadth.median_chg_pct == null ? null : fmtPct(breadth.median_chg_pct, 2)],
    ]);
    var slip = lq.slippage_estimate_bps || {};
    var slipRows = Object.keys(slip).map(function (k) {
      var v = slip[k];
      return k + ": " + fmtPct(v.est_total_bps, 0) +
        (v.bound ? t("det.upperBound") : "") + (v.complete === false ? t("det.bookExhausted") : "");
    }).join(" · ");
    cards += agentCard(t("det.agent5"), sig.liquidity, [
      [t("det.spread"), lq.spread_bps == null ? null : fmtNum(lq.spread_bps, 2) + " bps (" + (lq.spread_band || "?") + ")"],
      [t("det.topDepth"), lq.top_depth_usd == null ? null : fmtUsd(lq.top_depth_usd) + " (" + (lq.depth_band || "?") + ")"],
      [t("det.impact10k"), lq.impact_bps_10k == null ? null : fmtNum(lq.impact_bps_10k, 1) + " bps (" + (lq.impact_band || "?") + ")"],
      [t("det.slipMethod"), lq.slippage_method ? slipMethodLabel(lq.slippage_method) : null],
      [t("det.slipRow"), slipRows || null],
      [t("det.barShare"), lq.bar_share_of_24h_pct == null ? null : fmtNum(lq.bar_share_of_24h_pct, 0) + "%"],
      [t("det.bookSnap"), bookDelayText(sig)],
    ]);
    var pf = sig.performance || {};
    cards += '<div class="agent-card card"><h4>' + t("det.agent6") + "</h4>" +
      '<div class="outcome-grid">' +
      horizonCell("+30m", pf.h30m) + horizonCell("+1H", pf.h1) +
      horizonCell("+4H", pf.h4) + horizonCell("+8H", pf.h8) +
      '</div><p class="notes">' + t("det.perfNote") + "</p></div>";

    $("signal-detail").innerHTML = head +
      '<div class="agent-grid">' + cards + "</div>";
  }

  function selectSignal(id) {
    SELECTED_ID = id;
    renderSignalList($("signal-search").value);
    renderSignalDetail();
    watchReveals();
  }

  /* ---------------------------------------------------------- insights */
  function insightMeta(sigCount, evaluable, missingCount, period) {
    return '<p class="insight-meta">' + t("ins.meta", {
      n: sigCount, e: evaluable, m: missingCount, p: esc(period) }) + "</p>";
  }

  function scatterPoints(getX, logX) {
    var pts = [], missing = 0;
    DATA.signals.forEach(function (s) {
      var x = getX(s), y = net30Of(s);
      if (x == null || y == null) { missing += 1; return; }
      pts.push({ x: x, y: y, cls: clsOf(s),
                 label: s.symbol + ": " + fmtPct(y, 2) });
    });
    return { pts: pts, missing: missing };
  }

  function renderInsights() {
    var L = DATA.learnings || {};
    var buckets = L.buckets || {};
    var signals = DATA.signals;
    var period = signals.length
      ? fmtDate(signals[0].signal_ts) + " – " + fmtDate(signals[signals.length - 1].signal_ts)
      : "—";
    var evaluable = (L.n_evaluable_30m == null ? 0 : L.n_evaluable_30m);
    var dec = function (s) { return (s.snapshot && s.snapshot.decisions) || {}; };
    var insights = [];

    function add(title, sub, bucketHtml, scatterHtml, missingCount) {
      insights.push('<div class="insight-card card"><h3>' + esc(title) +
        '</h3><p class="insight-sub">' + esc(sub) + "</p>" + bucketHtml +
        scatterHtml + insightMeta(signals.length, evaluable, missingCount, period) +
        "</div>");
    }

    var s1 = scatterPoints(function (s) { return dec(s).rvol; }, true);
    add(t("ins.rvolT"), t("ins.rvolS"),
      bucketChart(buckets.rvol, ["<2x", "2-5x", "5-10x", "10x+"]),
      s1.pts.length > 1 ? scatterChart(s1.pts, { xLabel: t("ins.rvolX"), logX: true }) : "",
      s1.missing);
    var s2 = scatterPoints(function (s) { return s.reversal ? s.reversal.markers_observed : null; }, false);
    add(t("ins.markT"), t("ins.markS"),
      bucketChart(buckets.exhaustion_markers, ["0", "1-2", "3+"]),
      s2.pts.length > 1 ? scatterChart(s2.pts, { xLabel: t("ins.markX") }) : "",
      s2.missing);
    add(t("ins.emaT"), t("ins.emaS"),
      bucketChart(buckets.ema_aligned, ["aligned", "not_aligned"]),
      "", 0);
    add(t("ins.regT"), t("ins.regS"),
      bucketChart(buckets.btc_regime, ["TRENDING_UP", "RANGING", "TRENDING_DOWN"]),
      "", 0);
    var s5 = scatterPoints(function (s) {
      var m = s.orderflow && s.orderflow.metrics;
      return m ? m.oi_chg_24h_pct : null;
    }, false);
    add(t("ins.oiT"), t("ins.oiS"),
      bucketChart(buckets.oi_chg_24h_pct, ["falling_-10%+", "flat", "rising_10%+"]),
      s5.pts.length > 1 ? scatterChart(s5.pts, { xLabel: t("ins.oiX") }) : "",
      s5.missing);
    var s6 = scatterPoints(function (s) {
      var m = s.orderflow && s.orderflow.metrics;
      return m ? m.imbalance : null;
    }, false);
    add(t("ins.imbT"), t("ins.imbS"),
      bucketChart(buckets.orderflow_imbalance,
        ["sell ≤ −0.10", "balanced", "buy ≥ +0.10"]),
      s6.pts.length > 1 ? scatterChart(s6.pts, { xLabel: t("ins.imbX") }) : "",
      s6.missing);
    var s7 = scatterPoints(function (s) { return dec(s).spread_bps; }, false);
    add(t("ins.sprT"), t("ins.sprS"),
      bucketChart(buckets.spread_bps, ["tight_<2", "normal_2-10", "wide_10+"]),
      s7.pts.length > 1 ? scatterChart(s7.pts, { xLabel: t("ins.sprX") }) : "",
      s7.missing);
    var s8 = scatterPoints(function (s) { return dec(s).breakout_margin_pct; }, false);
    add(t("ins.brkT"), t("ins.brkS"),
      bucketChart(buckets.breakout_strength,
        ["<0.5%", "0.5–2%", "2–5%", "5%+"]),
      s8.pts.length > 1 ? scatterChart(s8.pts, { xLabel: t("ins.brkX") }) : "",
      s8.missing);

    $("insight-grid").innerHTML = insights.join("");
  }

  /* ------------------------------------------------- learning (Phase 4) */
  function renderLearning() {
    var L = DATA.learnings || {};
    var hz = L.horizons || {};
    var rows = [["net30", t("lr.hzNet30")],
                ["r1h", t("lr.hz1h")], ["r4h", t("lr.hz4h")],
                ["r8h", t("lr.hz8h")]].map(function (r) {
      var d = hz[r[0]] || {};
      var n = d.n_evaluated == null ? 0 : d.n_evaluated;
      var cell = function (v, dec) {
        return v == null ? "—" : fmtPct(v, dec == null ? 2 : dec);
      };
      return "<tr><td>" + r[1] + "</td><td>" + n + "</td><td>" +
        cell(d.mean_pct) + "</td><td>" + cell(d.median_pct) + "</td><td>" +
        (d.pct_gte_1pct == null ? "—" : fmtNum(d.pct_gte_1pct, 0) + "%") +
        "</td><td>" +
        (d.pct_lte_neg_1pct == null ? "—" : fmtNum(d.pct_lte_neg_1pct, 0) + "%") +
        "</td></tr>";
    }).join("");
    $("learning-horizons").innerHTML =
      '<table class="version-table"><thead><tr><th>' + t("lr.thHorizon") + "</th><th>" +
      t("lr.thN") + "</th><th>" + t("lr.thMean") + "</th><th>" + t("lr.thMedian") +
      "</th><th>" + t("lr.thGte") + "</th><th>" + t("lr.thLte") +
      "</th></tr></thead><tbody>" +
      rows + "</tbody></table>" +
      "<p class='panel-sub' style='margin-top:12px'>" + t("lr.hzNote") + "</p>";

    var out = L.outliers || {};
    var mc = out.max_contributor || {};
    $("learning-outliers").innerHTML = out.mean_pct == null
      ? '<p class="panel-sub" style="margin:0">' + t("lr.notEnough") + "</p>"
      : '<ul class="missing-list">' +
        "<li><span>" + t("lr.outMean") + "</span><span class='num'>" + fmtPct(out.mean_pct, 2) + "</span></li>" +
        "<li><span>" + t("lr.outMedian") + "</span><span class='num'>" + fmtPct(out.median_pct, 2) + "</span></li>" +
        "<li><span>" + t("lr.outTrimmed") + "</span><span class='num'>" + fmtPct(out.trimmed_mean_10pct_pct, 2) + "</span></li>" +
        "<li><span>" + t("lr.outExMax") + "</span><span class='num'>" + fmtPct(out.mean_excluding_max_pct, 2) + "</span></li>" +
        "<li><span>" + t("lr.outLargest") + "</span><span class='num'>" + esc(mc.symbol || "—") + " " + fmtPct(mc.net_pct, 2) +
          t("lr.outLargestOf", { p: fmtNum(mc.share_of_sum_pct, 0) }) + "</span></li>" +
        "<li><span>" + t("lr.outRange") + "</span><span class='num'>" + fmtPct(out.min_pct, 2) + " … " + fmtPct(out.max_pct, 2) + "</span></li>" +
        "</ul>" +
        "<p class='panel-sub' style='margin-top:12px'>" + t("lr.outNote", { n: out.n }) + "</p>";

    var pm = L.per_marker || {};
    var labels = { rsi_overbought: t("lr.mkRsi"),
      wick_rejection: t("lr.mkWick"),
      overextended_atr: t("lr.mkOver"),
      parabolic_3bar: t("lr.mkPara"),
      atr_spike: t("lr.mkAtr"),
      volume_divergence: t("lr.mkVol") };
    var mrows = Object.keys(labels).map(function (code) {
      var d = pm[code] || {};
      var fmt = function (s) {
        return s == null ? t("bucket.noStats")
          : t("lr.mkStats", { n: s.n, w: fmtNum(s.win_rate_pct, 0),
                              m: fmtPct(s.mean_net30_pct, 2) });
      };
      return "<tr><td>" + labels[code] + "</td><td>" + fmt(d.with) +
        "</td><td>" + fmt(d.without) + "</td></tr>";
    }).join("");
    $("learning-markers").innerHTML =
      '<table class="version-table"><thead><tr><th>' + t("lr.mkThMarker") +
      "</th><th>" + t("lr.mkThWith") + "</th><th>" + t("lr.mkThWithout") +
      "</th></tr></thead><tbody>" +
      mrows + "</tbody></table>" +
      "<p class='panel-sub' style='margin-top:12px'>" + t("lr.mkNote") + "</p>";

    /* --- Phase 4.1: paired horizons (same cohort, gross) --- */
    var ph = L.paired_horizons || {};
    var phz = ph.horizons || {};
    var pcell = function (v) {
      return v == null ? "—" : fmtPct(v, 2);
    };
    var prows = [["r30", "+30m"], ["r1h", "+1H"], ["r4h", "+4H"],
                 ["r8h", "+8H"]].map(function (r) {
      var d = phz[r[0]] || {};
      return "<tr><td>" + r[1] + "</td><td>" + pcell(d.mean_pct) +
        "</td><td>" + pcell(d.median_pct) + "</td><td>" +
        (d.pct_gte_1pct == null ? "—" : fmtNum(d.pct_gte_1pct, 0) + "%") +
        "</td><td>" + pcell(d.mean_mfe_pct) + "</td><td>" +
        pcell(d.mean_mae_pct) + "</td></tr>";
    }).join("");
    var traj = (ph.trajectories || {}).counts || {};
    var tdefs = (ph.trajectories || {}).definitions || {};
    var tdefsEn = (ph.trajectories || {}).definitions_en || {};
    var trows = [["continued", t("lr.trajContinued")],
                 ["reversed", t("lr.trajReversed")],
                 ["full_reversal", t("lr.trajFull")],
                 ["late_bloom", t("lr.trajLate")],
                 ["never_up", t("lr.trajNever")]].map(function (r) {
      var def = bi(tdefs[r[0]], tdefsEn[r[0]]);
      return "<li><span>" + r[1] +
        (def ? " <span style='color:var(--text-3)'>(" +
          esc(def) + ")</span>" : "") +
        "</span><span class='num'>" + (traj[r[0]] == null ? "—" : traj[r[0]]) +
        "</span></li>";
    }).join("");
    var excl = ph.excluded || {};
    $("learning-paired").innerHTML = ph.n_paired == null || ph.n_paired < 5
      ? '<p class="panel-sub" style="margin:0">' + t("lr.pairedNotEnough") + "</p>"
      : "<p class='panel-sub' style='margin:0 0 12px'>" +
        t("lr.pairedIntro", { n: ph.n_paired, total: ph.n_total,
          closes: ph.distinct_closes == null ? "?" : ph.distinct_closes,
          m30: excl.missing_h30m || 0, m1: excl.missing_h1 || 0,
          m4: excl.missing_h4 || 0, m8: excl.missing_h8 || 0 }) + "</p>" +
        '<table class="version-table"><thead><tr><th>' + t("lr.thHorizon") +
        "</th><th>" + t("lr.thMean") + "</th><th>" + t("lr.thMedian") +
        "</th><th>" + t("lr.thGte") + "</th><th>" + t("lr.thMfe") +
        "</th><th>" + t("lr.thMae") + "</th></tr></thead><tbody>" +
        prows + "</tbody></table>" +
        "<p class='panel-sub' style='margin-top:12px'>" + t("lr.pairedNote") + "</p>" +
        "<h4 style='margin:16px 0 4px'>" + t("lr.trajTitle") + "</h4>" +
        '<ul class="missing-list">' + trows + "</ul>" +
        (ph.sample_note ? "<p class='panel-sub' style='margin-top:12px'>" +
          esc(bi(ph.sample_note, ph.sample_note_en)) + "</p>" : "");

    /* --- Phase 4.1: distribution, contributions, mean vs win --- */
    var dist = out.distribution_net30 || {};
    var dkeys = ["<−5%", "−5..−1%", "−1..+1%", "+1..+5%", ">+5%"];
    var drows = dkeys.map(function (k) {
      var c = dist[k] || 0;
      var w = out.n ? Math.round(c / out.n * 100) : 0;
      return "<li><span>" + esc(k) + "</span><span class='num'>" + c +
        " <span style='color:var(--text-3)'>(" + w + "%)</span></span></li>";
    }).join("");
    var contribs = out.contributions || [];
    var maxAbs = 0;
    contribs.forEach(function (c) {
      maxAbs = Math.max(maxAbs, Math.abs(c.net_pct || 0));
    });
    var crows = contribs.map(function (c) {
      var w = maxAbs ? Math.round(Math.abs(c.net_pct) / maxAbs * 100) : 0;
      var col = c.net_pct >= 0 ? "var(--pos)" : "var(--neg)";
      return "<tr><td>" + esc(c.symbol) + "</td><td>" +
        "<div style='background:" + col + ";height:8px;border-radius:99px;width:" +
        w + "%;min-width:2px'></div></td><td>" + fmtPct(c.net_pct, 2) +
        "</td><td>" + (c.share_of_sum_pct == null ? "—" :
          fmtNum(c.share_of_sum_pct, 0) + "%") + "</td></tr>";
    }).join("");
    var mvw = out.mean_vs_win || {};
    $("learning-distribution").innerHTML = out.n == null || out.n < 5
      ? '<p class="panel-sub" style="margin:0">' + t("lr.notEnough") + "</p>"
      : "<h4 style='margin:0 0 4px'>" + t("lr.distTitle", { n: out.n }) + "</h4>" +
        '<ul class="missing-list">' + drows + "</ul>" +
        "<h4 style='margin:16px 0 4px'>" + t("lr.mvwTitle") + "</h4>" +
        '<ul class="missing-list">' +
        "<li><span>" + t("lr.mvwWin") + "</span><span class='num'>" +
        fmtNum(mvw.win_rate_pct, 1) + "%</span></li>" +
        "<li><span>" + t("lr.mvwMean") + "</span><span class='num'>" +
        fmtPct(mvw.mean_net_pct, 2) + "</span></li>" +
        "<li><span>" + t("lr.mvwMedian") + "</span><span class='num'>" +
        fmtPct(mvw.median_net_pct, 2) + "</span></li></ul>" +
        (mvw.note ? "<p class='panel-sub' style='margin-top:8px'>" +
          esc(bi(mvw.note, mvw.note_en)) + "</p>" : "") +
        "<h4 style='margin:16px 0 4px'>" + t("lr.contribTitle") + "</h4>" +
        '<table class="version-table"><thead><tr><th>' + t("lr.thSignal") +
        "</th><th></th><th>" + t("lr.thNet") + "</th><th>" + t("lr.thShare") +
        "</th></tr></thead><tbody>" +
        crows + "</tbody></table>" +
        "<p class='panel-sub' style='margin-top:12px'>" + t("lr.contribNote") + "</p>";

    /* --- Phase 4.1: agent learning evaluation --- */
    var ae = L.agent_evaluation || {};
    var ags = ae.agents || {};
    var verdicts = {
      association: [t("lr.verdAssociation"), "var(--pos)"],
      no_clear_association: [t("lr.verdNoClear"), "var(--text-3)"],
      consistent: [t("lr.verdConsistent"), "var(--pos)"],
      inconsistent: [t("lr.verdAgainst"), "var(--neg)"],
      insufficient_data: [t("lr.verdInsuff"), "var(--warn)"],
      no_data: [t("lr.verdNoData"), "var(--warn)"],
      not_evaluable: [t("lr.verdNotEval"), "var(--text-3)"]
    };
    var agOrder = ["breakout", "reversal", "orderflow", "regime",
                   "liquidity", "performance"];
    var agLabels = { breakout: t("lr.agBreakout"),
      reversal: t("lr.agReversal"), orderflow: t("lr.agOrderflow"),
      regime: t("lr.agRegime"), liquidity: t("lr.agLiquidity"),
      performance: t("lr.agPerformance") };
    var agHtml = agOrder.map(function (key) {
      var ag = ags[key];
      if (!ag) return "";
      var frows = (ag.findings || []).map(function (f) {
        var v = verdicts[f.verdict] || [f.verdict, "var(--text-3)"];
        return "<tr><td>" + esc(bi(f.observation, f.observation_en)) + "</td><td><span style='color:" +
          v[1] + "'>" + v[0] + "</span></td><td>" + esc(bi(f.detail, f.detail_en) || "") +
          "</td></tr>";
      }).join("");
      return "<h4 style='margin:16px 0 4px'>" + esc(agLabels[key] || ag.label) + "</h4>" +
        "<p class='panel-sub' style='margin:0 0 8px'>" + esc(bi(ag.basis, ag.basis_en) || "") +
        "</p>" +
        '<table class="version-table"><thead><tr><th>' + t("lr.thObservation") +
        "</th><th>" + t("lr.thVerdict") + "</th><th>" + t("lr.thEvidence") +
        "</th></tr></thead><tbody>" +
        frows + "</tbody></table>";
    }).join("");
    var si = ae.sample_independence || {};
    $("learning-agents").innerHTML =
      "<p class='panel-sub' style='margin:0 0 4px'>" +
      t("lr.aeIntro", { n: ae.as_of_n_evaluable_30m == null ? "?" : ae.as_of_n_evaluable_30m }) +
      esc(bi(ae.anti_lookahead, ae.anti_lookahead_en) || "") + "</p>" +
      "<p class='panel-sub' style='margin:0 0 4px'>" +
      esc(bi(ae.validation, ae.validation_en) || "") + "</p>" +
      (si.note == null ? "" :
        "<p class='panel-sub' style='margin:0 0 12px'>" + esc(bi(si.note_id, si.note)) +
        " " + t("lr.siSentence", {
          ne: si.n_evaluable == null ? "?" : si.n_evaluable,
          ce: si.distinct_closes_evaluable == null ? "?" : si.distinct_closes_evaluable,
          np: si.n_paired == null ? "?" : si.n_paired,
          cp: si.distinct_closes_paired == null ? "?" : si.distinct_closes_paired }) + "</p>") +
      agHtml;

    /* --- Phase 4.1: case examples (BULLA / IDOL) --- */
    var cases = out.case_examples || [];
    var caseRows = cases.map(function (c) {
      var cell = function (v) {
        return v == null ? "—" : fmtPct(v, 2);
      };
      return "<tr><td>" + esc(c.symbol) + "<br><span style='color:var(--text-3)'>" +
        esc(fmtWib(c.signal_ts) || "") + " WIB</span></td><td>" +
        cell(c.net30_pct) + "</td><td>" + cell(c.r1h_pct) + "</td><td>" +
        cell(c.r4h_pct) + "</td><td>" + cell(c.r8h_pct) + "</td><td>" +
        cell(c.mfe30_pct) + " / " + cell(c.mae30_pct) + "</td></tr>";
    }).join("");
    var bullas = cases.filter(function (c) {
      return c.symbol === "BULLAUSDT" && c.r8h_pct != null; });
    var idols = cases.filter(function (c) {
      return c.symbol === "IDOLUSDT" && c.r8h_pct != null; });
    var caseNote = t("lr.caseNote");
    if (bullas.length && idols.length) {
      var bBest = bullas.reduce(function (a, b) {
        return a.r8h_pct > b.r8h_pct ? a : b; });
      var iWorst = idols.reduce(function (a, b) {
        return a.r8h_pct < b.r8h_pct ? a : b; });
      caseNote = t("lr.caseNote2", { b: fmtPct(bBest.r8h_pct, 2),
                                     i: fmtPct(iWorst.r8h_pct, 2) }) + caseNote;
    }
    $("learning-cases").innerHTML = cases.length === 0
      ? '<p class="panel-sub" style="margin:0">' + t("lr.casesEmpty") + "</p>"
      : '<div style="overflow-x:auto"><table class="version-table">' +
        "<thead><tr><th>" + t("lr.thSignal") + "</th><th>" + t("lr.th30net") +
        "</th><th>" + t("lr.th1h") + "</th><th>" + t("lr.th4h") +
        "</th><th>" + t("lr.th8h") + "</th><th>" + t("lr.thMfeMae") +
        "</th></tr></thead><tbody>" + caseRows + "</tbody></table></div>" +
        "<p class='panel-sub' style='margin-top:12px'>" + caseNote + "</p>";

    /* --- Phase 4.2: learning summary (auto-generated) --- */
    var sum = L.learning_summary || {};
    var sumList = function (items, empty) {
      if (!items || items.length === 0) {
        return '<p class="panel-sub" style="margin:0 0 8px">' + empty + "</p>";
      }
      return "<ul class='missing-list'>" + items.map(function (it) {
        return "<li><span>" + esc(localizeSummaryItem(bi(it.text_id, it.text))) + "</span></li>";
      }).join("") + "</ul>";
    };
    var topics = sum.topics || {};
    var topicStatus = { observed: t("lr.stObserved"),
      mixed: t("lr.stMixed"), insufficient: t("lr.stInsuff"),
      no_data: t("lr.stNoData") };
    var topicRows = Object.keys(topics).map(function (k) {
      var tpc = topics[k] || {};
      var badge = tpc.status === "observed" ? "var(--pos)"
        : tpc.status === "mixed" ? "var(--warn)" : "var(--text-3)";
      return "<tr><td>" + esc(bi(tpc.label_id, tpc.label) || k) + "</td><td>" +
        '<span style="color:' + badge + '">' +
        esc(topicStatus[tpc.status] || tpc.status || "—") +
        "</span></td><td>" + esc(localizeTrajectories(localizeVerdictCodes(bi(tpc.detail_id, tpc.detail))) || "—") + "</td></tr>";
    }).join("");
    $("learning-summary").innerHTML =
      "<h4 style='margin:0 0 8px'>" + t("lr.sumTopics") + "</h4>" +
      '<div style="overflow-x:auto"><table class="version-table">' +
      "<thead><tr><th>" + t("lr.thTopic") + "</th><th>" + t("lr.thStatus") +
      "</th><th>" + t("lr.thRead") + "</th></tr></thead><tbody>" +
      topicRows + "</tbody></table></div>" +
      "<h4 style='margin:16px 0 8px'>" + t("lr.sumWorked") + "</h4>" +
      sumList(sum.worked, t("lr.sumWorkedEmpty")) +
      "<h4 style='margin:16px 0 8px'>" + t("lr.sumFailed") + "</h4>" +
      sumList(sum.failed, t("lr.sumFailedEmpty")) +
      "<h4 style='margin:16px 0 8px'>" + t("lr.sumChanged") + "</h4>" +
      sumList(sum.changed, t("lr.sumChangedEmpty")) +
      "<h4 style='margin:16px 0 8px'>" + t("lr.sumInconcl") + "</h4>" +
      sumList(sum.inconclusive, t("lr.sumInconclEmpty")) +
      "<p class='panel-sub' style='margin-top:12px'>" +
      t("lr.sumBased", { e: (sum.based_on || {}).n_evaluable_30m || 0,
                         p: (sum.based_on || {}).n_paired || 0 }) + "</p>";

    /* --- Phase 4.2: research checkpoints --- */
    var cps = L.checkpoints || {};
    var cur = cps.current_n_paired == null ? 0 : cps.current_n_paired;
    var nxt = cps.next_threshold;
    var pct = nxt == null ? 100 : Math.min(100, Math.round(cur / nxt * 100));
    var reachedRows = (cps.reached || []).map(function (r) {
      return "<li><span>" + t("lr.cpReached", { n: r.threshold }) + "</span><span class='num'>" +
        fmtDate(r.reached_ts) + "</span></li>";
    }).join("");
    var pairedCloses = (L.clusters || {}).n_paired_closes;
    $("learning-checkpoints").innerHTML =
      "<ul class='missing-list'>" +
      "<li><span>" + t("lr.cpComplete") + "</span><span class='num'>" + cur + "</span></li>" +
      "<li><span>" + t("lr.cpCloses") + "</span><span class='num'>" +
        (pairedCloses == null ? "—" : pairedCloses) + "</span></li>" +
      "<li><span>" + t("lr.cpNext") + "</span><span class='num'>" +
        (nxt == null ? t("lr.cpAllReached") : t("lr.cpNextVal", { n: nxt, p: pct })) + "</span></li>" +
      "</ul>" +
      '<div class="cov-bar" style="margin:12px 0"><i style="width:' + pct + '%"></i></div>' +
      (reachedRows === ""
        ? '<p class="panel-sub" style="margin:0">' + t("lr.cpNone") + "</p>"
        : "<ul class='missing-list'>" + reachedRows + "</ul>");

    /* --- Phase 4.2: hypothesis registry --- */
    var reg = L.hypothesis_registry || {};
    var entries = reg.entries || [];
    var split = reg.split;
    var regStatus = { awaiting_validation: t("lr.regAwaiting"),
      validated: t("lr.regValidated"), rejected: t("lr.regRejected") };
    var regVerdict = { holds: t("lr.regHolds"),
      does_not_hold: t("lr.regNotHolds") };
    var regRows = entries.map(function (e) {
      var v = e.validation || {};
      var st = e.status === "validated" ? "var(--pos)"
        : e.status === "rejected" ? "var(--neg)" : "var(--warn)";
      return "<tr><td>" + esc(e.id) + "</td><td>" + esc(bi(e.text, e.text_en) || "") +
        "</td><td><span style='color:" + st + "'>" + esc(regStatus[e.status] || e.status) +
        "</span></td><td>" + (v.verdict == null ? "—" : esc(regVerdict[v.verdict] || v.verdict) +
        t("lr.regValN", { a: v.n_best, b: v.n_worst })) + "</td></tr>";
    }).join("");
    $("learning-registry").innerHTML =
      (split == null
        ? '<p class="panel-sub" style="margin:0 0 12px">' +
          esc(bi(reg.split_pending_note_id, reg.split_pending_note) ||
              t("lr.regPending")) + "</p>"
        : '<p class="panel-sub" style="margin:0 0 12px">' +
          t("lr.regSplit", { d: fmtDate(split.frozen_ts),
                             n: split.discovery_n }) + "</p>") +
      (entries.length === 0
        ? '<p class="panel-sub" style="margin:0">' + t("lr.regEmpty") + "</p>"
        : '<div style="overflow-x:auto"><table class="version-table">' +
          "<thead><tr><th>" + t("lr.thId") + "</th><th>" + t("lr.thHyp") +
          "</th><th>" + t("lr.thStatus") + "</th><th>" + t("lr.thVal") +
          "</th></tr></thead><tbody>" +
          regRows + "</tbody></table></div>");

    /* --- OLV: close clusters (signals grouped by 4H close) --- */
    var cl = L.clusters || {};
    var conc = cl.concentration || {};
    var nRecon = DATA.signals.filter(function (s) {
      return s.reconstruction != null;
    }).length;
    var clRows = (cl.outcome_by_close || []).map(function (c) {
      return "<tr><td>" + esc(fmtWib(c.close_ts) || "?") + " WIB</td><td>" +
        c.n_signals + "</td><td>" + c.n_evaluable + "</td><td>" +
        c.wins + "</td><td>" + fmtPct(c.mean_net30_pct, 2) + "</td><td>" +
        fmtPct(c.mean_r30_pct, 2) + "</td></tr>";
    }).join("");
    $("learning-clusters").innerHTML =
      "<ul class='missing-list'>" +
      "<li><span>" + t("lr.clEval") + "</span><span class='num'>" +
        (cl.n_evaluable == null ? "—" : cl.n_evaluable) + "</span></li>" +
      "<li><span>" + t("lr.clClosesAll") + "</span><span class='num'>" +
        (cl.n_unique_closes == null ? "—" : cl.n_unique_closes) + "</span></li>" +
      "<li><span>" + t("lr.clClosesEval") + "</span><span class='num'>" +
        (cl.n_evaluable_closes == null ? "—" : cl.n_evaluable_closes) + "</span></li>" +
      "<li><span>" + t("lr.clLargest") + "</span><span class='num'>" +
        (conc.largest_close_n == null ? "—" : t("lr.clLargestVal", {
          n: conc.largest_close_n,
          p: fmtNum(conc.largest_close_share_pct, 1) })) + "</span></li>" +
      "<li><span>" + t("lr.clTop3") + "</span><span class='num'>" +
        (conc.top3_close_share_pct == null ? "—" : t("lr.clTop3Val", {
          p: fmtNum(conc.top3_close_share_pct, 1) })) + "</span></li>" +
      "<li><span>" + t("lr.clRecon") + "</span><span class='num'>" +
        t("lr.clReconVal", { n: nRecon, total: DATA.signals.length }) +
        "</span></li>" +
      "</ul>" +
      '<div style="overflow-x:auto;margin-top:12px"><table class="version-table">' +
      "<thead><tr><th>" + t("lr.thCloseWib") + "</th><th>" + t("lr.thSignals") +
      "</th><th>" + t("lr.thEvaluable") + "</th><th>" + t("lr.thWins") +
      "</th><th>" + t("lr.thMeanNet") + "</th><th>" + t("lr.thMeanGross") +
      "</th></tr></thead><tbody>" +
      clRows + "</tbody></table></div>" +
      "<p class='panel-sub' style='margin-top:12px'>" + esc(bi(cl.note_id, cl.note) || "") +
      t("lr.clSplitNote") + "</p>";
  }

  /* ---------------------------------------------------------- timeline */
  function renderTimeline() {
    $("milestones").innerHTML = (DATA.timeline || []).map(function (m) {
      return "<li><span class='t-date'>" + esc(m.date) + "</span><h4>" +
        esc(bi(m.title_id, m.title)) + "</h4><p>" + esc(bi(m.text_id, m.text)) + "</p></li>";
    }).join("");

    var versions = DATA.versions || [];
    var rows = versions.map(function (v) {
      if (v.n_records == null) {
        return "<tr><td>" + esc(v.version) + "</td><td colspan='4' style='font-family:var(--font-sans)'>" +
          esc(bi(v.note, v.note_en) || t("tl.noArchive")) + "</td></tr>";
      }
      return "<tr><td>v" + esc(v.version) + "</td><td>" + v.n_records +
        "</td><td>" + v.oi_coverage + "/" + v.n_records +
        "</td><td>" + v.funding_coverage + "/" + v.n_records +
        "</td><td>" + v.bands_coverage + "/" + v.n_records + "</td></tr>";
    }).join("");
    $("version-compare").innerHTML =
      '<table class="version-table"><thead><tr><th>' + t("tl.thVersion") +
      "</th><th>" + t("tl.thRecords") + "</th><th>" + t("tl.thOi") +
      "</th><th>" + t("tl.thFunding") + "</th><th>" + t("tl.thDepth") +
      "</th></tr></thead><tbody>" +
      rows + "</tbody></table>" +
      "<p class='panel-sub' style='margin-top:12px'>" + t("tl.verNote") + "</p>";

    var recos = [];
    var dq = DATA.data_quality || {};
    var prof = dq.missing_data_profile || {};
    var nEval = DATA.overview.n_evaluable_30m || 0;
    if ((prof.funding_rate || {}).missing === (prof.funding_rate || {}).n) {
      recos.push(t("tl.recoFunding"));
    }
    if ((prof.open_interest || {}).missing > 0) {
      recos.push(t("tl.recoOi", { m: (prof.open_interest || {}).missing || 0 }));
    }
    var oc = DATA.overview.outcome_completeness || {};
    if ((oc.h1 || {}).completeness_pct != null && oc.h1.completeness_pct < 100) {
      recos.push(t("tl.recoH1", { p: fmtNum(oc.h1.completeness_pct, 0) }));
    }
    if ((DATA.overview.hypotheses || []).length === 0) {
      recos.push(t("tl.recoHyp", { n: nEval }));
    }
    var regimes = DATA.overview.regime_distribution || {};
    if (!regimes.TRENDING_UP) {
      recos.push(t("tl.recoTrend"));
    }
    recos.push(t("tl.recoMarkers", { n: nEval }));
    $("recommendations").innerHTML = recos.map(function (r) {
      return "<li>" + r + "</li>";
    }).join("");
  }

  /* ---------------------------------------------------------- explorer */
  function explorerValue(sig, key) {
    var d = (sig.snapshot && sig.snapshot.decisions) || {};
    var m = (sig.orderflow && sig.orderflow.metrics) || {};
    var rg = (sig.regime && sig.regime.metrics) || {};
    switch (key) {
      case "symbol": return sig.symbol;
      case "signal_ts": return sig.signal_ts;
      case "price": return d.close;
      case "net30": return net30Of(sig);
      case "r4h": return r4hOf(sig);
      case "rvol": return d.rvol;
      case "markers": return sig.reversal ? sig.reversal.markers_observed : null;
      case "regime": return rg.btc_regime;
      case "oi": return m.oi_chg_24h_pct;
      case "spread": return d.spread_bps;
      default: return null;
    }
  }

  /* v36: one explorer data row (extracted so renderExplorer can emit
     grouped or flat lists from the same markup) */
  function explorerRowHtml(s) {
    var d = (s.snapshot && s.snapshot.decisions) || {};
    var m = (s.orderflow && s.orderflow.metrics) || {};
    var rg = (s.regime && s.regime.metrics) || {};
    var net = net30Of(s), r4h = r4hOf(s);
    var dots = ["breakout", "reversal", "orderflow", "regime", "liquidity"].map(function (a) {
      var st = s[a] && s[a].status;
      var cls = st === "COMPLETED" ? "dot-ok" :
        st === "PARTIAL DATA" ? "dot-part" : "dot-miss";
      return '<i class="' + cls + '" title="' + esc(a) + ": " + esc(st || "?") + '"></i>';
    }).join("");
    return '<tr data-id="' + esc(s.signal_id) + '"><td>' + esc(s.symbol) +
      "</td><td>" + esc(fmtWib(s.signal_ts) || "—") +
      "</td><td>" + esc(fmtPrice(d.close) || "—") +
      "</td><td class='" + (net == null ? "" : net >= 0 ? "pos" : "neg") + "'>" +
      (net == null ? '<span class="na">N/A</span>' : fmtPct(net, 2)) +
      "</td><td class='" + (r4h == null ? "" : r4h >= 0 ? "pos" : "neg") + "'>" +
      (r4h == null ? '<span class="na">N/A</span>' : fmtPct(r4h, 2)) +
      "</td><td>" + (d.rvol == null ? "—" : fmtNum(d.rvol, 2) + "×") +
      "</td><td>" + ((s.reversal && s.reversal.markers_observed) == null ? "—" : s.reversal.markers_observed + "/6") +
      "</td><td>" + esc(rg.btc_regime || "—") +
      "</td><td>" + (m.oi_chg_24h_pct == null ? '<span class="na">N/A</span>' : fmtPct(m.oi_chg_24h_pct, 1)) +
      "</td><td>" + (d.spread_bps == null ? "—" : fmtNum(d.spread_bps, 1) + " bps") +
      '</td><td><span class="agent-dots">' + dots + "</span></td></tr>";
  }

  function renderExplorer() {
    var q = ($("explorer-search").value || "").toLowerCase();
    var outF = $("explorer-outcome").value;
    var regF = $("explorer-regime").value;
    var rows = DATA.signals.filter(function (s) {
      if (q && s.symbol.toLowerCase().indexOf(q) === -1) return false;
      if (outF) {
        var c = clsOf(s);
        if (outF === "__pending__") { if (c) return false; }
        else if (c !== outF) return false;
      }
      if (regF) {
        var rg = (s.regime && s.regime.metrics) || {};
        if (rg.btc_regime !== regF) return false;
      }
      return true;
    });
    rows.sort(function (a, b) {
      var va = explorerValue(a, EXPLORER_SORT.key);
      var vb = explorerValue(b, EXPLORER_SORT.key);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      var cmp = typeof va === "string" ? va.localeCompare(vb) : va - vb;
      return cmp * EXPLORER_SORT.dir;
    });
    $("explorer-count").textContent = t("explorer.count", { n: rows.length, total: DATA.signals.length });
    $("explorer-empty").hidden = rows.length > 0;
    /* v36: group by 4H close ONLY on the default chronological sort.
       Any other sort key renders the flat list exactly as before. */
    var grouped = EXPLORER_SORT.key === "signal_ts";
    var html = "";
    if (grouped) {
      var anyFilter = !!q || !!outF || !!regF;
      var groups = groupByClose(rows);
      groups.forEach(function (g) {
        var open = groupIsOpen(g, anyFilter);
        html += '<tr class="close-group-head"><td colspan="11">' +
          groupHeadButtonHtml(g, open) + "</td></tr>";
        if (open) {
          var showAll = !!GROUP_SHOW_ALL[g.close_ts];
          var items = showAll ? g.signals
            : g.signals.slice(0, GROUP_PAGE_SIZE);
          html += items.map(explorerRowHtml).join("");
          if (g.signals.length > GROUP_PAGE_SIZE) {
            html += '<tr class="close-group-more"><td colspan="11">' +
              groupMoreButtonHtml(g) + "</td></tr>";
          }
        }
      });
    } else {
      html = rows.map(explorerRowHtml).join("");
    }
    $("explorer-body").innerHTML = html;
    Array.prototype.forEach.call(
      $("explorer-body").querySelectorAll("tr[data-id]"), function (el) {
        el.addEventListener("click", function () {
          selectSignal(el.getAttribute("data-id"));
          document.getElementById("signals").scrollIntoView({ behavior: "smooth" });
        });
      });
    Array.prototype.forEach.call(
      $("explorer-body").querySelectorAll(".close-group-head"), function (el) {
        el.addEventListener("click", function () {
          var closeTs = +el.getAttribute("data-close");
          var open = el.getAttribute("aria-expanded") !== "true";
          toggleGroup(closeTs, open);
          renderExplorer();
        });
      });
    Array.prototype.forEach.call(
      $("explorer-body").querySelectorAll(".close-group-more"), function (el) {
        el.addEventListener("click", function () {
          toggleShowAll(+el.getAttribute("data-close"));
          renderExplorer();
        });
      });
    Array.prototype.forEach.call(
      $("explorer-table").querySelectorAll("th[data-sort]"), function (th) {
        var key = th.getAttribute("data-sort");
        var base = th.textContent.replace(/ [▲▼]$/, "");
        th.innerHTML = esc(base) + (EXPLORER_SORT.key === key
          ? ' <span class="arrow">' + (EXPLORER_SORT.dir === 1 ? "▲" : "▼") + "</span>" : "");
      });
  }

  /* -------------------------------------------------- rail spy + reveal (v33) */
  function initRailSpy() {
    var links = Array.prototype.slice.call(
      document.querySelectorAll(".rail-link[data-section]"));
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = {};
    links.forEach(function (l) { map[l.getAttribute("data-section")] = l; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var link = map[en.target.id];
        if (!link) return;
        links.forEach(function (l) { l.classList.toggle("active", l === link); });
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  var revealIO = null;
  function watchReveals() {
    if (!("IntersectionObserver" in window)) return;
    if (document.documentElement.classList.contains("motion-off")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!revealIO) {
      revealIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add("is-in-view");
          revealIO.unobserve(en.target);
        });
      // Threshold 0 (not 0.08): the Learning section is ~16,500px tall
      // and its Distribution panel ~11,300px — with a ratio threshold
      // the visible fraction can never reach it, so the whole section
      // stayed opacity:0 forever (audit 24 Nov 2026). Any visibility
      // now triggers the reveal; the 15% rootMargin still pre-reveals.
      }, { threshold: 0, rootMargin: "0px 0px 15% 0px" });
    }
    // NOTE: .section is deliberately NOT observed — a section is a
    // container, never a reveal unit; its panels/cards reveal
    // individually. Observing sections stuck the whole Learning
    // section invisible (see threshold note above).
    var els = document.querySelectorAll(
      ".panel, .stat-card, .insight-card, .agent-card, .detail-head");
    Array.prototype.forEach.call(els, function (el) {
      if (el.classList.contains("reveal")) return;
      el.classList.add("reveal");
      revealIO.observe(el);
    });
  }

  /* Motion toggle — mirrors the main page (experience.js):
     html.motion-off + localStorage raptorMotionOff, shared key. */
  function initMotionToggle() {
    var root = document.documentElement;
    var btn = document.getElementById("motion-toggle");
    if (!btn) return;
    var reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)").matches;
    if (reduced) root.classList.add("motion-off");
    function refresh() {
      var off = reduced || root.classList.contains("motion-off");
      btn.querySelector(".motion-text").textContent =
        off ? t("motion.off") : t("motion.on");
      btn.querySelector(".motion-icon").textContent = off ? "⏸" : "✳";
      btn.setAttribute("aria-pressed", String(off));
      btn.setAttribute("aria-label",
        off ? t("motion.ariaOn") : t("motion.ariaOff"));
      btn.title = reduced ? t("motion.reduced") : "";
      btn.disabled = reduced;
    }
    refreshMotionToggle = refresh;
    btn.addEventListener("click", function () {
      var off = !root.classList.contains("motion-off");
      root.classList.toggle("motion-off", off);
      try {
        localStorage.setItem("raptorMotionOff", off ? "1" : "0");
      } catch (e) { /* private mode — session only */ }
      if (off) {
        // reveal everything immediately — nothing stays invisible
        Array.prototype.forEach.call(
          document.querySelectorAll(".reveal"), function (el) {
            el.classList.add("is-in-view");
          });
      } else {
        watchReveals();
      }
      refresh();
    });
    refresh();
  }

  /* ---------------------------------------------------------- boot */
  function showError() {
    $("loading").hidden = true;
    $("load-error").hidden = false;
    $("empty-state").hidden = true;
    $("app").hidden = true;
  }

  function boot(data) {
    DATA = data;
    if (!data.signals || data.signals.length === 0) {
      $("loading").hidden = true;
      $("empty-state").hidden = false;
      return;
    }
    SELECTED_ID = data.signals[data.signals.length - 1].signal_id;
    renderAll();
    $("loading").hidden = true;
    $("app").hidden = false;
    initRailSpy();
  }

  function load() {
    $("loading").hidden = false;
    $("load-error").hidden = true;
    fetch("research.json", { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(boot)
      .catch(function () { showError(); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initMotionToggle();
    renderStatic();
    var langBox = document.getElementById("lang-switch");
    if (langBox) {
      langBox.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-lang]");
        if (btn) setLang(btn.getAttribute("data-lang"));
      });
    }
    $("retry-load").addEventListener("click", load);
    $("signal-search").addEventListener("input", function () {
      renderSignalList(this.value);
    });
    $("explorer-search").addEventListener("input", renderExplorer);
    $("explorer-outcome").addEventListener("change", renderExplorer);
    $("explorer-regime").addEventListener("change", renderExplorer);
    Array.prototype.forEach.call(
      $("explorer-table").querySelectorAll("th[data-sort]"), function (th) {
        th.addEventListener("click", function () {
          var key = th.getAttribute("data-sort");
          if (EXPLORER_SORT.key === key) EXPLORER_SORT.dir *= -1;
          else { EXPLORER_SORT.key = key; EXPLORER_SORT.dir = -1; }
          renderExplorer();
        });
      });
    load();
  });

  /* v38: fingerprint for the browser-side data sync layer
     (data-sync.js polls meta.json and compares). Null until the
     research data has loaded. */
  window.RaptorResearchSync = {
    getFingerprint: function () {
      if (!DATA) return null;
      return {
        research_n_signals: DATA.overview.n_signals,
        research_n_eval30: DATA.learnings.n_evaluable_30m,
        research_n_paired: DATA.learnings.paired_horizons.n_paired
      };
    }
  };

  /* v36 test hook: lets verification suites expand all groups before
     counting rows. DATA-null guarded (no-op before the page loads). */
  window.RaptorResearchDensity = {
    expandAll: function () {
      if (!DATA) return;
      DATA.signals.forEach(function (s) {
        delete GROUP_COLLAPSED[s.signal_ts];
        GROUP_EXPANDED[s.signal_ts] = true;
        GROUP_SHOW_ALL[s.signal_ts] = true;
      });
      renderSignalList($("signal-search").value);
      renderExplorer();
    },
    collapseAll: function () {
      if (!DATA) return;
      DATA.signals.forEach(function (s) {
        delete GROUP_EXPANDED[s.signal_ts];
        delete GROUP_SHOW_ALL[s.signal_ts];
        GROUP_COLLAPSED[s.signal_ts] = true;
      });
      renderSignalList($("signal-search").value);
      renderExplorer();
    },
    getState: function () {
      var groups = DATA ? groupByClose(DATA.signals) : [];
      var open = {};
      groups.forEach(function (g) {
        open[g.close_ts] = groupIsOpen(g, false);
      });
      return {
        groups: groups.length,
        latestClose: DATA ? latestCloseTs() : null,
        open: open,
        showAll: Object.keys(GROUP_SHOW_ALL).map(Number),
        collapsed: Object.keys(GROUP_COLLAPSED).map(Number)
      };
    }
  };
})();
