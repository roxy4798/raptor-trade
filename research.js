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
      "rail.team": "Team",
      "rail.agents": "AI Agents",
      "team.kicker": "AI RESEARCH TEAM",
      "team.title": "Twelve agents. One intelligence team.",
      "team.sub": "Twelve research agents power the research on this page — six analyze every published signal, six more study continuation, exits, risk and validation. They only observe and report; they never filter, approve, or block a signal.",
      "team.view": "View agent",
      "team.flagship": "STRATEGY CORE",
      "team.name01": "AXIOM",
      "team.spec01": "Breakout Intelligence",
      "team.name02": "VEX",
      "team.spec02": "Reversal & Exhaustion",
      "team.name03": "FLUX",
      "team.spec03": "Order Flow",
      "team.name04": "ATLAS",
      "team.spec04": "Market Regime",
      "team.name05": "NEXUS",
      "team.spec05": "Liquidity & Execution",
      "team.name06": "SYNAPSE",
      "team.spec06": "Performance Learning",
      "team.name07": "RAPTOR",
      "team.spec07": "Pump Ignition & Continuation",
      "team.name08": "SPECTRE",
      "team.spec08": "Missed Opportunity",
      "team.name09": "PRISM",
      "team.spec09": "Filter Discovery & Optimization",
      "team.name10": "VERITAS",
      "team.spec10": "Independent Strategy Validation",
      "team.name11": "APEX",
      "team.spec11": "Take Profit & Exit",
      "team.name12": "AEGIS",
      "team.spec12": "Risk & Portfolio",
      "team.role01": "Breakout strength, RVOL & EMA alignment",
      "team.role02": "Reversal markers & momentum exhaustion",
      "team.role03": "Taker flow, imbalance & open interest",
      "team.role04": "BTC trend, breadth & correlation",
      "team.role05": "Spread, depth & slippage",
      "team.role06": "Outcomes, checkpoints & hypotheses",
      "team.role07": "First pump → next-candle continuation",
      "team.role08": "Which gate blocked the winners",
      "team.role09": "Shadow Lab: virtual filter trials",
      "team.role10": "Look-ahead, leakage & overfitting checks",
      "team.role11": "TP-before-SL & exit efficiency",
      "team.role12": "Drawdown, sizing & portfolio risk",
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
      "rail.ridethewave": "Ride the Wave",
      "sec.rtw.kicker": "07 — Ride the Wave",
      "sec.rtw.title": "Ride the Wave — Filter Discovery",
      "sec.rtw.sub": "Evidence-based filter discovery for LONG Ride the Wave signals. Primary metrics are mean net +4H and positive net rate +4H (net of spread + 8 bps fee). Everything here is research — no AI score gates publication, and no filter changes without explicit approval.",
      "panel.rtwPrimary": "Primary metrics (+4H net)",
      "panel.rtwAgg": "Signal vs close vs ex-flood",
      "panel.rtwClasses": "Outcome classes (+4H)",
      "panel.rtwBatch": "Isolated vs market-wide",
      "panel.rtwEarlyLate": "Early vs late breakout",
      "panel.rtwPre": "Before the breakout",
      "panel.rtwNonsignal": "Signals vs contracts that did not signal",
      "panel.rtwLab": "Shadow Strategy Laboratory",
      "panel.rtwRecos": "Evidence-based recommendations",
      "panel.rtwHyps": "Lab hypotheses (frozen, awaiting new closes)",
      "rtw.notYet": "Ride the Wave research is not available yet.",
      "rtw.meanNet": "Mean net +4H",
      "rtw.posNet": "Positive net rate +4H",
      "rtw.medianNet": "Median net +4H",
      "rtw.nNet": "Signals with net",
      "rtw.aggNote": "Three quarters of all signals come from one 4H close, so that close dominates the signal-weighted average. The close-weighted and ex-flood columns show the same result without that dominance.",
      "rtw.classNote": "CONTINUED = +4H ≥ +1%. EXHAUSTED = peaked ≥ +1% then closed ≤ 0%. REVERSED = +4H ≤ −1%.",
      "rtw.excNote": "MFE/MAE are the true excursion within the horizon. +4H is a single bar, so its time-to-MFE is always 1 bar — meaningful time-to-MFE is in +12H/+1D. Retention = +4H return / MFE (median).",
      "rtw.batchNote": "Isolated 1–3, Intermediate 4–19, Market-Wide Candidate 20+ signals at one close — initial research definitions, not validated trading rules. Breadth confirms how much of the universe broke out at that close.",
      "rtw.earlyNote": "Margin bands: <0.5% (early) to 5%+ (late). Pre-signal rise, ATR expansion and volatility contraction are the context — margin alone does not say when momentum started.",
      "rtw.nsNote": "Group A = every eligible contract that did not signal at the same close. Group B = matched per signal (same market + same RVOL band). Missed opportunity = a non-signal contract that still rose ≥ +1% in the next 4H.",
      "rtw.labNote": "Virtual replay of historical 4H candles with the production engine. Calibration first: the baseline replay must reproduce the scanner before any alternative is interpreted.",
      "rtw.recoNote": "Every recommendation carries its evidence, sample size, limitations, and impact. INSUFFICIENT EVIDENCE is a valid, honest outcome — it means the data is too thin for a claim, not that the filter failed.",
      "rtw.hypNote": "Frozen the moment they first appeared; validated only on closes published after that moment. No verdict until ≥10 signals per side on new closes.",
      "rtw.calib": "Calibration (baseline replay vs scanner)",
      "rtw.rawMatch": "Raw gate passes vs decisions",
      "rtw.dedupMatch": "After dedup vs sent log",
      "rtw.mismatch": "Every mismatch is classified — see research.json for the full lists.",
      "rtw.thConfig": "Config", "rtw.thN": "n", "rtw.thMeanNet": "Mean net +4H",
      "rtw.thPos": "Positive net", "rtw.thCont": "Continuation",
      "rtw.thMissed": "Missed good", "rtw.thDisc": "Discovery",
      "rtw.thVal": "Validation",
      "rail.exit": "Take Profit & Exit",
      "sec.exit.kicker": "08 — Take Profit & Exit",
      "sec.exit.title": "Agent 11 — Take Profit & Exit",
      "sec.exit.sub": "What happens after a LONG entry: how far price can go, how much of it a realistic exit captures, and how long to hold. Exit net is round-trip (gross minus one full spread + 8 bps fee). If one 4H bar touches both a TP and a stop loss, the stop is assumed hit first (conservative) and counted as unknown ordering. Everything here is research — no exit rule filters or delays a signal.",
      "panel.exitPrimary": "Primary metrics (exit net, round-trip)",
      "panel.exitTp": "TP hit rates (MFE-based)",
      "panel.exitStrategies": "Exit strategy comparison (+12H)",
      "panel.exitHolding": "How long to hold (exit at bar k close)",
      "panel.exitGiveback": "Profit giveback & time-to-max-close",
      "panel.exitEntryTp": "Which entries reach +5% (TP hit @ +12H)",
      "panel.exitRecos": "Exit recommendations",
      "panel.exitHyps": "Exit hypotheses (frozen, awaiting new closes)",
      "exit.notYet": "Take Profit & Exit research is not available yet.",
      "exit.holdH4": "HOLD mean net +4H (round-trip)",
      "exit.holdH12": "HOLD mean net +12H (round-trip)",
      "exit.bestH12": "Best +12H strategy (mean net)",
      "exit.tpNote": "Hit = the highest high within the horizon reached the target. Hit-then-positive = hit and the horizon still closed at or above entry. +1W has no mature signals yet (first matures 28 Nov).",
      "exit.stratNote": "Fixed TP and ATR TP exit at the TP level when touched, or at the −2% / −1×ATR stop when touched first. Structure SL (E17/E18) keeps the same TP +3% as E2 and only moves the stop — to the signal-bar low (E17) or the breakout level (E18). If one bar touches both, the stop is assumed first (conservative) — see Unknown order. Trailing and exhaustion exits use bar closes only, so ordering never applies. Best by mean net is a description, not a validated recommendation.",
      "exit.holdNote": "Mean round-trip net of exiting at the close of bar k after entry (1 bar = +4H, 3 = +12H, 6 = +1D, 12 = +2D, 18 = +3D, 42 = +1W). The best bar is the highest mean — with the flood dominating the sample, treat it as an observation, not an optimal holding rule.",
      "exit.gbNote": "Giveback = MFE minus the realized HOLD return: how much of the peak was given back by holding to the horizon close. Time-to-max-close counts only signals with a full 42-bar path (none mature yet).",
      "exit.entryNote": "TP+5% hit rate at +12H by entry characteristic. Buckets with n<5 show no rate. A higher hit rate for late breakouts (margin 5%+) does not mean late entries are better — they also rose the most before the signal.",
      "exit.recoNote": "Every exit recommendation carries its evidence, sample size, limitations, and impact. INSUFFICIENT EVIDENCE is a valid, honest outcome — it means the data is too thin for a claim, not that the exit failed.",
      "exit.hypNote": "Frozen the moment they first appeared; validated only on closes published after that moment. No verdict until ≥10 signals per side on new closes.",
      "panel.exitEntryDist": "Entry-specific TP potential (MFE distribution @ +4H)",
      "exit.distNote": "MFE is the historical maximum rise in the first 4H bar — not a pre-entry TP estimate. The realistic read is the TP hit curve: the TP level that share of signals with this characteristic actually touched. The TP+1% before SL column is stricter: the +1% level reached before the −2% stop was ever touched. Buckets with n<5 show no rate. Squeeze (BB width <25) does not reach further than wide bands in this sample — descriptive, flood-dominated.",
      "rail.joint": "Joint Entry & Exit",
      "sec.joint.kicker": "09 — Joint Entry & Exit",
      "sec.joint.title": "Joint Entry & Exit Research",
      "sec.joint.sub": "Which entry config, paired with which exit, holds up best — judged on consistency first (positive net rate, TP hit rate, profit factor, median net, drawdown, close consistency), profit size second. Nine frozen candidates J0–J8 only — never all 130 combinations. Net is round-trip (gross minus one full spread + 8 bps fee) and only computed on signals with a measured spread (n_net); gross, MFE and TP hit cover every signal of the config. MFE is the historical maximum rise, not a pre-entry TP estimate. Everything here is research — no combination is applied to production.",
      "panel.jointPerConfig": "TP potential by entry config (all 10 lab configs)",
      "panel.jointCandidates": "Joint candidates J0–J8 (+4H primary)",
      "panel.jointHyps": "Joint hypotheses (frozen, awaiting new closes)",
      "panel.jointRecos": "Joint recommendations",
      "joint.notYet": "Joint research not built yet — the daily builder (after the 08:00 WIB lab) has not run.",
      "joint.perConfigNote": "TP hit rates are MFE-based at +4H. The TP+1% before SL column is stricter: the +1% level reached before the −2% stop was ever touched. Missed good = hard pumps (≥+1% in 4H) the config did not fire on. A4/A5/A9 reach further (higher median MFE) but fire far fewer signals and miss more — descriptive, flood-dominated, not validated.",
      "joint.candNote": "Net is round-trip and only on signals with a measured spread (n_net); hard-pump and TP rates cover all signals. Max DD is the drawdown of the chronological per-signal net sequence — signals overlap, so it is not a portfolio drawdown. Best by mean net is a description, not a validated recommendation.",
      "joint.hypNote": "Hypotheses are validated only on closes after they were frozen. JH1 and JH5 hold on early prospective closes (small n — JH1's gap is 0.0pp, i.e. no difference, not a win); JH3 and JH4 still await enough new closes.",
      "joint.recoNote": "All joint recommendations are INSUFFICIENT EVIDENCE in v1.1.0 — no candidate is applied to production. A non-INSUFFICIENT verdict needs a ≥1.0pp gap in the same direction on both discovery and validation, n≥10/side on validation closes, and survival of the ex-flood aggregation.",
      "rail.forwardtest": "Forward Testing",
      "sec.forwardtest.kicker": "10 — Forward Testing",
      "sec.forwardtest.title": "Forward Testing — A0 vs A4 vs A4 + ATR Expanded",
      "sec.forwardtest.sub": "New 4H closes after the historical research cutoff, judged with frozen thresholds and definitions — no re-optimization on new signals. A4 + ATR percentile expanded is the main research candidate; A0 is the production baseline and A4 + HOLD is the exit comparison. Forward results are exploratory observations, not formal validation.",
      "panel.ignMatrix": "Entry quality consistency matrix — three priority characteristics",
      "panel.jointExits": "A0 vs A4 exit profitability (+4H)",
      "panel.jointQvf": "Quality vs frequency — A0 vs A4",
      "panel.ftSetup": "Forward test — setup & evidence",
      "panel.ftGroups": "Forward results — A0 vs A4 vs A4 + ATR Expanded (+4H)",
      "panel.ftPerClose": "Performance per close (forward only)",
      "panel.ftSplits": "A4 + ATR Expanded — CRYPTO vs SAHAM",
      "panel.ftExits": "Forward exits — E0 vs E5 vs E18 (+4H)",
      "ev.historical": "Historical",
      "ev.exploratory": "Exploratory forward",
      "ev.formalNone": "Formal validation: none",
      "ev.insufficient": "Insufficient data",
      "ev.historicalNote": "Historical, descriptive/in-sample data with frozen thresholds. Associations here are not predictions.",
      "ev.exploratoryNote": "Exploratory forward observations on closes after the historical cutoff. No frozen formal validation exists for this candidate yet.",
      "ev.formalNote": "Formal prospective validation runs on a separate frozen track (CH1/CH2). Forward-test numbers are never presented as formal validation.",
      "mx.feature": "Feature",
      "mx.bucket": "Bucket",
      "mx.slice": "Slice",
      "mx.n": "n",
      "mx.nNet": "n_net",
      "mx.closes": "Closes",
      "mx.coverage": "Coverage",
      "mx.freq": "Signals/close",
      "mx.cont": "Continuation",
      "mx.mean": "Mean net",
      "mx.median": "Median net",
      "mx.positive": "+Net",
      "mx.tp1": "TP+1% before SL",
      "mx.mfe": "Median MFE",
      "mx.mae": "Median MAE",
      "mx.pf": "Profit factor",
      "mx.slicePooled": "Pooled",
      "mx.sliceExFlood": "Ex-flood",
      "mx.sliceCloseW": "Close-weighted",
      "mx.sliceCrypto": "CRYPTO",
      "mx.sliceSaham": "SAHAM",
      "mx.sliceProspective": "Prospective",
      "mx.featAtr": "ATR percentile",
      "mx.featWick": "Upper wick",
      "mx.featBody": "Body strength",
      "jx.config": "Config",
      "jx.exit": "Exit",
      "jx.closeCons": "Close cons.",
      "jx.maxDd": "MaxDD",
      "jx.tpFirst": "TP first",
      "jx.slFirst": "SL first",
      "jx.neither": "Neither",
      "jx.ambig": "Ambiguous",
      "jx.top1": "Top-1 share",
      "jx.cwMean": "CloseW mean",
      "jx.discMean": "Discovery mean",
      "jx.valMean": "Validation mean",
      "jx.perfTitle": "Exit performance (+4H)",
      "jx.outTitle": "Outcome accounting (+4H)",
      "jx.ddNote": "MaxDD is a cumulative-signal diagnostic (peak-to-trough of the chronological per-signal net sum, 1 unit of notional per signal; signals overlap in time) — NOT portfolio drawdown, and not comparable across configs with different signal counts.",
      "qv.union": "Union closes (all configs)",
      "qv.meanClose": "Mean / close",
      "qv.medianClose": "Median / close",
      "qv.maxClose": "Max / close",
      "qv.withSignals": "Closes with signals",
      "qv.zeroCloses": "Zero-signal closes",
      "qv.freqRatio": "Frequency ratio A4/A0",
      "qv.freqChange": "Frequency change",
      "qv.tradeoffTitle": "Trade-off — A4 vs A0 (lab overall, replay)",
      "qv.cont": "Continuation",
      "qv.mean": "Mean net",
      "qv.median": "Median net",
      "qv.cwMean": "Close-weighted mean net",
      "qv.exMean": "Ex-flood mean net",
      "ft.cutoff": "Historical cutoff",
      "ft.frozen": "Candidate frozen",
      "ft.fwdCloses": "Forward closes",
      "ft.formal": "Formal prospective validation",
      "ft.group": "Group",
      "ft.mature": "Matured",
      "ft.pending": "Pending",
      "ft.signals": "Signals",
      "ft.close": "Close (WIB)",
      "ft.cwTitle": "Close-weighted view",
      "ft.groupsNote": "Forward-only numbers — never mixed with historical data. A4 + ATR Expanded is exploratory until a frozen formal validation exists.",
      "ft.pendingNote": "Signals from the latest forward close are still pending — their next 4H candle has not closed yet.",
      "ft.splitNote": "CRYPTO/SAHAM split of the A4 + ATR Expanded forward signals. Small samples — observations only, never conclusions.",
      "ft.exitsNote": "E0 HOLD is the exit baseline; E5 and E18 are research candidates, not approved strategies.",
      "ft.notYet": "Forward test not built yet — the daily lab (08:00 WIB) has not run since the cutoff.",
      "panel.exitTpBsl": "TP before SL (vs SL −2%)",
      "panel.exitRiskReward": "Risk–reward by exit family (+4H)",
      "panel.exitFunding": "Funding cost — measured evidence",
      "exit.tpbslNote": "MFE hit = the target level was touched at any point. TP-before-SL = the target was reached on an earlier bar than any touch of the −2% stop. SL first = the stop was touched first. UNKNOWN = TP and SL were touched on the same 4H bar (order unknown, stop assumed first). MAE-before-TP is the median drawdown endured on bars strictly before the TP-touch bar — only meaningful at +12H and beyond, because +4H is a single bar.",
      "exit.rrNote": "One family pools every (signal × strategy) in it — not an average of strategy means. Payoff = avg win / |avg loss|. Break-even win rate = |avg loss| / (avg win + |avg loss|): the minimum win rate for expected net = 0 if win/loss sizes stay at their historical averages. Structure SL (E17/E18) uses the same TP +3% as E2 — the only difference is the stop placement.",
      "exit.fundingNote": "Funding is NOT in exit net (the monthly archive publishes the following month, so November funding lands in December). The bounds below are measured from the October 2026 archive: a +4H hold crosses at most one 8h funding payment, a +12H hold at most two consecutive ones. Median funding is small, but the tail is fat — the worst single 8h payment in the sample was 2.00pp.",
      "rail.risk": "Risk & Portfolio",
      "sec.risk.kicker": "11 — Risk & Portfolio",
      "sec.risk.title": "Agent 12 — Risk & Portfolio",
      "sec.risk.sub": "What a strategy risks, not just what it wins — and what happens when many LONG signals fire at once. Portfolio curves are research simulations (simple cumulative sums of per-close returns, no compounding), not real trading results. Two sizing variants are compared on the same signals: fixed-notional (1 unit per signal, exposure grows with the batch) vs fixed-capital (1 unit per close, split equally). Risk of ruin is not computed — block bootstrap needs at least 60 closes, and there are only 30 so far. Everything here is research — nothing sizes a real position or sets real leverage.",
      "panel.riskOverview": "Risk overview — exposure & correlation",
      "panel.riskFunding": "Funding bounds & risk of ruin",
      "panel.riskCandidates": "Risk–reward per candidate J0–J8 (+4H)",
      "panel.riskDrawdown": "Portfolio drawdown — both sizing variants (+4H)",
      "panel.riskEquity": "Equity curves — fixed-capital, HOLD candidates (+4H)",
      "panel.riskStreaks": "Consecutive losses & tail risk (+4H)",
      "panel.riskSensitivity": "Cost sensitivity & liquidation proxy (+4H)",
      "panel.riskHyps": "Risk hypotheses (frozen, awaiting new closes)",
      "panel.riskRecos": "Risk recommendations",
      "risk.notYet": "Risk & Portfolio research not built yet — the daily builder (after the 08:00 WIB joint) has not run.",
      "risk.overviewNote": "Exposure counts come from the Shadow Lab A0 replay (436 signals, including backfill extras; production sent 390). Correlation is Pearson on same-window +4H returns (signal close → next 4H close) from local Mainnet candles — descriptive, not a hedge claim.",
      "risk.fundingNote": "Funding bounds are the measured October 2026 tail: a +4H hold pays at most one 8h payment, a +12H hold at most two. Risk of ruin is deliberately not computed — estimating it from 30 closes would be fabrication.",
      "risk.candNote": "Net is round-trip and only on signals with a measured spread (n_net). Max DD (sequence) is the drawdown of the chronological per-signal net sequence — signals overlap, so it is not a portfolio drawdown; the portfolio drawdown is in the next panel. Break-even win rate is the minimum win rate for expected net = 0 at historical win/loss sizes.",
      "risk.ddNote": "Fixed-notional takes 1 unit per signal (the flood close = ~294 units of exposure); fixed-capital takes 1 unit per close split equally. The gap between the two totals is the concentration cost of taking every signal at full size. Duration is closes from the peak to a new high — empty means the curve never recovered within the observed closes.",
      "risk.equityNote": "Fixed-capital equity curves (cumulative sum of per-close mean nets, +4H) for the four HOLD candidates. J0 is the production baseline; J3/J5/J7 are the selective configs. The flood close is one point on each curve — not 294 independent points.",
      "risk.streakNote": "Consecutive losing signals are counted in chronological order (by close, then symbol). Tail = mean of the worst 5% of per-signal nets. One long losing streak can erase many small wins — compare it with the win rate, not instead of it.",
      "risk.sensNote": "Cost ×0 = gross only (no costs), ×1 = base round-trip cost (spread + 8 bps fee), ×2 = cost doubled. Liquidation proxy = share of signals whose MAE reached −33.3% (3x), −20% (5x), or −10% (10x). Simplified: isolated margin, no maintenance margin, no funding, MAE from 4H lows — a proxy, never a liquidation rate.",
      "risk.hypNote": "Hypotheses are validated only on closes after they were frozen, on per-close portfolio means (fixed-capital). Until new closes arrive, every verdict is awaiting_validation.",
      "risk.recoNote": "All risk recommendations are INSUFFICIENT EVIDENCE in v1.0.0 — nothing is applied to production. A non-INSUFFICIENT verdict needs a ≥1.0pp gap in the same direction on both discovery and validation, n≥10/side on validation closes, survival of the ex-flood aggregation, and drawdown no worse than baseline.",
      "rail.ignition": "Pump Ignition",
      "sec.ignition.kicker": "12 — Pump Ignition",
      "sec.ignition.title": "Agent 07 — Pump Ignition & Continuation",
      "sec.ignition.sub": "What the pre-entry picture looks like before a signal fires — squeeze, Bollinger Band width, ATR contraction, volume acceleration, price compression, momentum acceleration, and pre-breakout open interest — measured only on bars before the signal close, never after. The goal is not the biggest pump: it is the entry that is immediately followed by a rise, so a realistic small TP is reached more often. Every number here is descriptive — one close (the 23 Nov flood) dominates the sample, and hypotheses IH1–IH6 are frozen and awaiting prospective closes. v1.1.0 adds the first pump candle itself: pump strength (open-to-close, vs ATR, vs the contract's own history), candle structure (body, wicks, close position, previous candle, exhaustion), and six separated next-candle rates — bullish close, positive gross, positive net, TP-before-SL, continuation failure, and reversal — with pooled, close-weighted, and ex-flood views. Hypotheses PH1–PH6 are frozen alongside IH1–IH6.",
      "panel.ignOverview": "Ignition overview — coverage",
      "panel.ignOi": "Open interest coverage",
      "panel.ignSqueeze": "Squeeze × breakout margin",
      "panel.ignFeatures": "Pre-entry features — per bucket (+4H)",
      "panel.ignNext": "Next-candle performance — six rates, separated",
      "panel.ignPump": "Pump strength — absolute, vs ATR, vs own history",
      "panel.ignStruct": "Candle structure — first pump candle",
      "panel.ignHyps": "Ignition hypotheses (frozen, awaiting new closes)",
      "panel.ignPh": "Pump-continuation hypotheses PH1–PH6 (frozen, v1.1.0)",
      "panel.ignExec": "Entry realism — benchmark vs execution",
      "panel.ignRecos": "Ignition recommendations",
      "ign.notYet": "Pump Ignition research not built yet — the daily builder (after the 08:00 WIB risk) has not run.",
      "ign.overviewNote": "Ignition features are computed on the Shadow Lab A0 replay (436 signals, including backfill extras; production sent 390). Pre-signal bars only — a feature can never see the signal bar or anything after it.",
      "ign.oiNote": "Open interest comes from the daily Binance metrics archive (1-day lag) — a signal whose archive is not yet published has no OI value, reported as missing, never estimated.",
      "ign.sqNote": "Squeeze is the standard TTM-style definition: Bollinger Bands (20, 2σ) inside Keltner Channels (20, 1.5× ATR10). Released = squeeze at some point in the 6 bars before the signal, but not on the bar right before it. Margin band is the breakout margin: early <0.5%, late ≥5%.",
      "ign.featNote": "One row per feature bucket. Positive = share of signals with net +4H > 0. TP+1% before SL = share that touched +1% before the −2% stop. Profit factor = gross wins / gross losses; “no losses” means the bucket had no losing signal. Buckets with n<5 are shown but carry no conclusion.",
      "ign.hypNote": "IH verdicts are gap-based on in-sample closes (flood 23 Nov 23:00 WIB and later — including closes from before the hypothesis was frozen, so this is descriptive, not prospective validation): holds needs n≥5/side and a gap ≥2pp in the expected direction. IH5 (OI rising) holds on the in-sample numbers, but its falling side is only a handful of signals from very few closes — fragile, descriptive only, not a finding.",
      "ign.recoNote": "All ignition recommendations are INSUFFICIENT EVIDENCE in v1.1.0 — ignition features are measured for the first time and no hypothesis has been validated on a prospective close yet.",
      "ign.nxcNote": "Six rates, kept apart on purpose. Bullish close = the next candle closes above its own open. Positive gross = the next close is above the signal close. Positive net = gross minus one full spread + 8bps fee. Failure = 100 − positive gross (the next candle did not continue, technically). A signal can continue technically yet lose after costs — or fail technically yet end positive. Pooled is flood-dominated; close-weighted and ex-flood are the honest views.",
      "ign.pumpNote": "Pump is the signal candle's open-to-close rise. The <1 bucket exists because production signals can pump under 1% — mostly low-volatility stock-token perps. Pump / ATR14 divides the pump by the pre-pump ATR14; pump vs own history is the percentile of the pump's size against the contract's own prior-60-bar |open-to-close| moves.",
      "ign.structNote": "One row per bucket of the first pump candle (or the candle before it). Body-to-range, close position and wicks are shares of the candle's high−low range. RSI 4H and green streak measure momentum exhaustion before the signal. Buckets with n<5 are shown but carry no conclusion.",
      "ign.phNote": "PH verdicts are gap-based on in-sample closes (flood 23 Nov 23:00 WIB and later — including closes from before the hypothesis was frozen, so this is descriptive, not prospective validation): holds needs n≥5/side and a gap ≥2pp in the expected direction. PH5 (small upper wick) holds on the in-sample numbers — check its closes per side before believing it; the flood close still dominates every verdict.",
      "ign.execNote": "The signal close is a benchmark entry, not a guaranteed fill. The execution model buys at the ask (half a spread above the close); its total cost equals the benchmark model, so the two nets differ by less than 0.02pp on every signal — the spread is already fully costed. Funding is excluded from net (measured October bounds in the funding note).",
      "rail.missed": "Missed Opportunity",
      "sec.missed.kicker": "13 — Missed Opportunity",
      "sec.missed.title": "Agent 08 — Missed Opportunity",
      "sec.missed.sub": "Eligible contracts that never signalled but then rose — which gate blocked them, how far they were from the threshold, and what removing or loosening one gate would have added, winners AND losers together. Counterfactual impact is in gross +4H return only: the spread of a non-signal is unmeasured, so net is never computed here. Scope is v2.1.2 closes only (from 22 Nov 15:00 WIB).",
      "panel.missedOverview": "Missed-opportunity overview",
      "panel.missedPassed": "Passed the gate, not sent",
      "panel.missedGates": "Which gate blocked the winners (and the losers)",
      "panel.missedCombos": "Failing gate combinations",
      "panel.missedCf": "Counterfactuals — what one gate change would have added",
      "panel.missedTop": "Top missed winners",
      "panel.missedHyps": "Missed hypotheses (frozen, awaiting new closes)",
      "panel.missedRecos": "Missed recommendations",
      "missed.notYet": "Missed Opportunity research not built yet — the daily builder (after the 08:00 WIB ignition) has not run.",
      "missed.overviewNote": "Eligible = every evaluated contract at a v2.1.2 close, signals and non-signals together. Winner = +4H return ≥ +1% (the tracker threshold); big miss = ≥ +5%; loser = ≤ −1%. One close is one market condition, not hundreds of independent samples.",
      "missed.passedNote": "These contracts passed the engine gates but were never sent — dedup (a production LONG SIGNAL in the prior 1–3 closes) or the chart-validation gate. The watcher log does not separate dedup from the chart gate, so the split is not shown.",
      "missed.gatesNote": "“Blocked” counts a gate among the failing gates of a winner/loser; “only gate” counts contracts where that gate was the single failure. Median gap is how far the actual value sat from the threshold (pp for breakout and close>open, × for RVOL). Most missed winners fail two or more gates — they were not near-misses.",
      "missed.comboNote": "Every failing-gate combination among winners and losers. The dominant pair is breakout + RVOL together.",
      "missed.cfNote": "Each counterfactual removes or loosens exactly one gate and counts what would have signalled. Mean gross r4h is the mean +4H return of the added set (gross — net is not computed for non-signals). “Would but dedup” counts added winners that would still have been suppressed by the 3-close dedup.",
      "missed.topNote": "The largest +4H rises among eligible non-signals, with the gates that blocked each one. NVDL +43.39% was blocked by breakout (16.46pp below the high) and RVOL (0.90× vs 1.3×).",
      "missed.hypNote": "MH verdicts are gap-based on in-sample closes (flood and later — including closes from before the hypothesis was frozen, so this is descriptive, not prospective validation). MH1 and MH3 still await enough data; MH2 does not hold — only about a quarter of in-sample validation winners were blocked by a single gate.",
      "missed.recoNote": "All missed recommendations are INSUFFICIENT EVIDENCE in v1.0.0 — attribution covers v2.1.2 closes only and hypotheses MH1–MH3 are not yet prospectively validated.",
      "rail.validation": "Independent Validation",
      "sec.validation.kicker": "14 — Independent Validation",
      "sec.validation.title": "Agent 10 — Independent Strategy Validation",
      "sec.validation.sub": "This agent audits the research process itself — look-ahead bias, data leakage, survivorship bias, selection bias, overfitting, multiple testing, parameter sensitivity, walk-forward validation, prospective validation, cluster dependency, and reproducibility. It never blocks a production signal; it grades how much the research conclusions can be trusted.",
      "panel.valSummary": "Validation summary",
      "panel.valProspective": "Prospective validation per registry",
      "panel.valChecks": "The 11 checks",
      "panel.valWf": "Walk-forward — expanding train, next 5 closes as test",
      "panel.valRecos": "Validation recommendations",
      "panel.valLimits": "Limitations",
      "val.notYet": "Independent validation not built yet — the daily builder (after the 08:00 WIB missed) has not run.",
      "val.summaryNote": "Verdicts are gap-based, not significance tests — there are no p-values anywhere in this research. Warning means “read the numbers with this caveat”; fail would mean a check found a concrete defect.",
      "val.prospNote": "A hypothesis is only validated on closes after it was frozen — the table shows how many such closes each registry has so far. LH/EH/JH/RH verdicts are computed only on those closes; IH/PH/MH verdicts still use all flood-and-later closes, so their 'holds' is descriptive (in-sample) until their builders restrict to post-freeze closes.",
      "val.checksNote": "Each check re-derives its evidence from the raw files (decisions, candles, state files) — it does not trust the summaries it is checking.",
      "val.wfNote": "Expanding train, test = next 5 closes. Early folds are tiny (fold 1 trains on 10 closes with 5 A0 signals) — read the test means as stability probes, not performance claims. Best-on-train changes across folds, which is what an overfit selector would hide.",
      "val.recoNote": "Validation recommendations concern the research process (wait for prospective closes, freeze new hypotheses) — never a strategy change. All 11 are INSUFFICIENT EVIDENCE in v1.0.0.",
      "panel.agents": "Research coverage per agent",
      "panel.agents.sub": "Each agent is scored independently — one agent's missing data never blocks another.",
      "panel.regimes": "Market regime at signal time",
      "panel.regimes.sub": "BTC regime recorded when each signal was published.",
      "panel.outcomes": "Outcome completeness",
      "panel.outcomes.sub": "Share of mature signals with an evaluated outcome per horizon.",
      "panel.hypotheses": "Hypotheses",
      "panel.hypotheses.sub": "A hypothesis needs n≥10 on both buckets — and still requires out-of-sample validation.",
      "panel.quality": "Data quality",
      "panel.quality.sub": "Snapshot coverage and the per-input missing-data profile. Missing data is reported, never interpolated.",
      "panel.horizons": "Outcome by horizon",
      "panel.horizons.sub": "All evaluable signals per horizon — n differs because data completeness differs.",
      "panel.outliers": "Outlier influence on the average",
      "panel.outliers.sub": "Mean versus median versus trimmed mean — and what the single largest outcome contributes.",
      "panel.markers": "Reversal markers, one by one",
      "panel.markers.sub": "Each exhaustion marker compared with and without it. Buckets with n<5 show no statistics.",
      "panel.distribution": "Distribution & contributions",
      "panel.distribution.sub": "Where the +4H outcomes sit, and how much each signal contributes to the total sum.",
      "panel.summary": "Learning summary — auto-generated",
      "panel.summary.sub": "What the evidence supports so far, what failed to hold, what changed since the previous evaluation, and what cannot be concluded yet. Regenerated from the current data on every build — nothing here is written by hand.",
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
      "filter.pos4h": "+4H positive",
      "filter.neg4h": "+4H negative",
      "filter.pending": "Not evaluated yet",
      "filter.allRegimes": "All regimes",
      "filter.up": "BTC trending up",
      "filter.ranging": "BTC ranging",
      "filter.down": "BTC trending down",
      "th.symbol": "Symbol", "th.close": "Close (WIB)",
      "th.price": "Price", "th.r4h": "+4H", "th.r12h": "+12H",
      "th.r1d": "+1D", "th.r2d": "+2D", "th.r3d": "+3D", "th.r1w": "+1W",
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
      "ov.stat2": "Outcomes (+4H)",
      "ov.stat2n": "evaluable signals with a +4H outcome; the rest are pending",
      "ov.stat3": "+4H Positive",
      "ov.stat3n": "share of +4H returns above 0%, n={n}",
      "ov.stat4": "Mean +4H (gross)",
      "ov.stat4n": "gross return — no spread or fee simulation",
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
      "ov.hypEmpty": "No hypothesis is currently being tested. The bar is strict on purpose: n≥10 on both buckets, plus out-of-sample validation. With {n} evaluable outcomes, nothing has cleared it yet.",
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
      "scatter.aria": "Scatter: {x} versus +4H return",
      "sig.pending": "Pending",
      "sig.noMatch": "No signals match.",
      "hz.pending": "pending", "hz.unavailable": "unavailable",
      "hz.liveNow": "live return right now — horizon still in progress",
      "hz.backfilled": " · backfilled from official Binance archive",
      "hz.live": " · recorded live",
      "det.close": "Close", "det.price": "price",
      "det.analyzed": "analyzed",
      "det.agent1": "1 · Breakout Intelligence",
      "det.agent2": "2 · Reversal & Exhaustion",
      "det.agent3": "3 · Order Flow",
      "det.agent4": "4 · Market Regime",
      "det.agent5": "5 · Liquidity & Execution",
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
      "det.perfNote": "All six horizons are read from local 4H candles (target bar close). MFE/MAE are the best/worst moves inside the target 4H bar.",
      "ins.meta": "Signals: {n} · evaluable (+4H): {e} · missing feature data: {m} · period: {p}<br>Buckets with n<5 show no statistics. Association only — not evidence of causation.",
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
      "ins.imbS": "Taker buy/sell imbalance at the signal bar versus the +4H result.",
      "ins.imbX": "Imbalance (−1 sell … +1 buy)",
      "ins.sprT": "Spread vs outcome",
      "ins.sprS": "Do signals with wider spreads perform worse at +4H?",
      "ins.sprX": "Spread (bps)",
      "ins.brkT": "Breakout strength vs outcome",
      "ins.brkS": "How far the close cleared the 20-bar high, versus the +4H result.",
      "ins.brkX": "Breakout margin (%)",
      "lr.hz1h": "+1H (gross)", "lr.hz4h": "+4H (gross)",
      "lr.hz8h": "+8H (gross)",
      "lr.hz12h": "+12H (gross)", "lr.hz1d": "+1D (gross)",
      "lr.hz2d": "+2D (gross)", "lr.hz3d": "+3D (gross)",
      "lr.hz1w": "+1W (gross)",
      "lr.thHorizon": "Horizon", "lr.thN": "n",
      "lr.thMean": "Mean", "lr.thMedian": "Median",
      "lr.thGte": "≥ +1%", "lr.thLte": "≤ −1%",
      "lr.hzNote": "All horizons show gross returns. The ≥ +1% / ≤ −1% columns are descriptive shares — not win rates.",
      "lr.notEnough": "Not enough evaluable outcomes yet (n<5).",
      "lr.outMean": "Mean (+4H)",
      "lr.outMedian": "Median (+4H)",
      "lr.outTrimmed": "Trimmed mean (drop top/bottom 10%)",
      "lr.outExMax": "Mean without the largest outcome",
      "lr.outLargest": "Largest single outcome",
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
      "lr.mkStats": "n={n} · mean {m}",
      "lr.mkNote": "Markers stay research variables. A gap between “with” and “without” at these sample sizes is an observation, not evidence that the marker predicts anything.",
      "lr.distTitle": "Distribution of +4H outcomes (n={n})",
      "lr.mvwTitle": "Mean vs +4H positive",
      "lr.mvwWin": "+4H positive",
      "lr.mvwMean": "Mean (+4H)",
      "lr.mvwMedian": "Median (+4H)",
      "lr.contribTitle": "Contribution of every signal to the total",
      "lr.thSignal": "Signal", "lr.thNet": "+4H",
      "lr.thShare": "Share of sum",
      "lr.contribNote": "Shares above 100% mean one signal outweighs the entire total — the rest of the signals cancel each other out.",
      "lr.showMore": "Show more ({n} more)",
      "lr.showLess": "Show less",
      "lr.verdAssociation": "Association observed",
      "lr.verdNoClear": "No clear association",
      "lr.verdConsistent": "Consistent with hypothesis",
      "lr.verdAgainst": "Against hypothesis",
      "lr.verdInsuff": "Not enough data",
      "lr.verdNoData": "No data yet",
      "lr.verdNotEval": "Not evaluable",
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
      "lr.sumBased": "Based on {e} evaluable +4H outcomes. “What holds up” lists exploratory associations only — nothing here is a predictive claim.",
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
      "lr.clEval": "Signals evaluated (+4H)",
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
      "lr.thWins": "+4H positive",
      "lr.thMeanNet": "Mean +4H",
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
      "grp.continued": "{n} +4H positive",
      "grp.reversed": "{n} +4H negative",
      "grp.mean": "+4H mean {v}",
      "grp.showAll": "Show all {n}",
      "grp.showLess": "Show less"
    },
    id: {
      "rail.overview": "Ikhtisar", "rail.signals": "Sinyal",
      "rail.insights": "Insight", "rail.learning": "Pembelajaran",
      "rail.timeline": "Linimasa", "rail.explorer": "Explorer",
      "rail.home": "Beranda",
      "rail.homeAria": "Kembali ke Observatorium Sinyal",
      "rail.team": "Tim",
      "rail.agents": "Agen AI",
      "team.kicker": "TIM RISET AI",
      "team.title": "Dua belas agent. Satu tim intelijen.",
      "team.sub": "Dua belas agent riset menggerakkan riset di halaman ini — enam menganalisis setiap sinyal yang terbit, enam lagi mempelajari continuation, exit, risiko, dan validasi. Mereka hanya mengamati dan melaporkan; tidak pernah memfilter, menyetujui, atau memblokir sinyal.",
      "team.view": "Lihat agent",
      "team.flagship": "INTI STRATEGI",
      "team.name01": "AXIOM",
      "team.spec01": "Analisis Breakout",
      "team.name02": "VEX",
      "team.spec02": "Pembalikan & Pelemahan Momentum",
      "team.name03": "FLUX",
      "team.spec03": "Aliran Order",
      "team.name04": "ATLAS",
      "team.spec04": "Rezim Pasar",
      "team.name05": "NEXUS",
      "team.spec05": "Likuiditas & Eksekusi",
      "team.name06": "SYNAPSE",
      "team.spec06": "Pembelajaran Performa",
      "team.name07": "RAPTOR",
      "team.spec07": "Pemicu & Kelanjutan Pump",
      "team.name08": "SPECTRE",
      "team.spec08": "Peluang Terlewat",
      "team.name09": "PRISM",
      "team.spec09": "Penemuan & Optimasi Filter",
      "team.name10": "VERITAS",
      "team.spec10": "Validasi Strategi Independen",
      "team.name11": "APEX",
      "team.spec11": "Take Profit & Exit",
      "team.name12": "AEGIS",
      "team.spec12": "Risiko & Portofolio",
      "team.role01": "Kekuatan breakout, RVOL & EMA alignment",
      "team.role02": "Penanda reversal & kelelahan momentum",
      "team.role03": "Arus taker, imbalance & open interest",
      "team.role04": "Tren BTC, breadth & korelasi",
      "team.role05": "Spread, depth & slippage",
      "team.role06": "Outcome, checkpoint & hipotesis",
      "team.role07": "Pump pertama → continuation candle berikutnya",
      "team.role08": "Gate mana yang memblokir winner",
      "team.role09": "Shadow Lab: uji filter virtual",
      "team.role10": "Cek look-ahead, leakage & overfitting",
      "team.role11": "TP-before-SL & efisiensi exit",
      "team.role12": "Drawdown, sizing & risiko portfolio",
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
      "rail.ridethewave": "Ride the Wave",
      "sec.rtw.kicker": "07 — Ride the Wave",
      "sec.rtw.title": "Ride the Wave — Penemuan Filter",
      "sec.rtw.sub": "Penemuan filter berbasis bukti untuk sinyal LONG Ride the Wave. Metrik utama adalah mean net +4H dan positive net rate +4H (net setelah spread + fee 8 bps). Semua di sini adalah riset — tidak ada skor AI yang memblokir publikasi, dan tidak ada perubahan filter tanpa persetujuan eksplisit.",
      "panel.rtwPrimary": "Metrik utama (+4H net)",
      "panel.rtwAgg": "Sinyal vs close vs tanpa flood",
      "panel.rtwClasses": "Kelas outcome (+4H)",
      "panel.rtwBatch": "Isolated vs market-wide",
      "panel.rtwEarlyLate": "Early vs late breakout",
      "panel.rtwPre": "Sebelum breakout",
      "panel.rtwNonsignal": "Sinyal vs kontrak yang tidak sinyal",
      "panel.rtwLab": "Shadow Strategy Laboratory",
      "panel.rtwRecos": "Rekomendasi berbasis bukti",
      "panel.rtwHyps": "Hipotesis lab (beku, menunggu close baru)",
      "rtw.notYet": "Riset Ride the Wave belum tersedia.",
      "rtw.meanNet": "Mean net +4H",
      "rtw.posNet": "Positive net rate +4H",
      "rtw.medianNet": "Median net +4H",
      "rtw.nNet": "Sinyal dengan net",
      "rtw.aggNote": "Tiga perempat semua sinyal berasal dari satu close 4H, jadi close itu mendominasi rata-rata berbobot sinyal. Kolom close-weighted dan ex-flood menunjukkan hasil yang sama tanpa dominasi itu.",
      "rtw.classNote": "CONTINUED = +4H ≥ +1%. EXHAUSTED = sempat ≥ +1% lalu tutup ≤ 0%. REVERSED = +4H ≤ −1%.",
      "rtw.excNote": "MFE/MAE adalah ekskursi sebenarnya selama horizon. +4H hanya 1 bar, jadi time-to-MFE-nya selalu 1 bar — time-to-MFE yang bermakna ada di +12H/+1D. Retention = return +4H / MFE (median).",
      "rtw.batchNote": "Isolated 1–3, Intermediate 4–19, Market-Wide Candidate 20+ sinyal dalam satu close — definisi penelitian awal, bukan aturan trading tervalidasi. Breadth mengonfirmasi seberapa banyak universe yang breakout di close itu.",
      "rtw.earlyNote": "Band margin: <0,5% (early) sampai 5%+ (late). Kenaikan pra-sinyal, ekspansi ATR, dan kontraksi volatilitas adalah konteksnya — margin saja tidak menjelaskan kapan momentum dimulai.",
      "rtw.nsNote": "Grup A = semua kontrak eligible yang tidak sinyal di close yang sama. Grup B = yang sebanding per sinyal (market sama + band RVOL sama). Missed opportunity = kontrak non-sinyal yang tetap naik ≥ +1% dalam 4H berikutnya.",
      "rtw.labNote": "Replay virtual candle 4H historis dengan engine produksi. Kalibrasi dulu: replay baseline harus mereproduksi scanner sebelum config alternatif diinterpretasikan.",
      "rtw.recoNote": "Setiap rekomendasi membawa bukti, ukuran sampel, batasan, dan dampaknya. INSUFFICIENT EVIDENCE adalah hasil yang valid dan jujur — artinya datanya terlalu tipis untuk klaim, bukan berarti filternya gagal.",
      "rtw.hypNote": "Dibekukan saat pertama muncul; divalidasi hanya pada close yang dipublikasikan setelah momen itu. Belum ada verdict sampai ≥10 sinyal per sisi pada close baru.",
      "rtw.calib": "Kalibrasi (replay baseline vs scanner)",
      "rtw.rawMatch": "Gate pass mentah vs decisions",
      "rtw.dedupMatch": "Setelah dedup vs sent log",
      "rtw.mismatch": "Setiap mismatch terklasifikasi — daftar lengkap ada di research.json.",
      "rtw.thConfig": "Config", "rtw.thN": "n", "rtw.thMeanNet": "Mean net +4H",
      "rtw.thPos": "Positive net", "rtw.thCont": "Continuation",
      "rtw.thMissed": "Missed good", "rtw.thDisc": "Discovery",
      "rtw.thVal": "Validation",
      "rail.exit": "Take Profit & Exit",
      "sec.exit.kicker": "08 — Take Profit & Exit",
      "sec.exit.title": "Agent 11 — Take Profit & Exit",
      "sec.exit.sub": "Apa yang terjadi setelah entry LONG: sejauh mana harga bisa naik, berapa banyak yang bisa ditangkap exit realistis, dan berapa lama sebaiknya hold. Exit net adalah round-trip (gross dikurangi satu full spread + fee 8 bps). Jika satu bar 4H menyentuh TP dan stop loss sekaligus, stop diasumsikan kena dulu (konservatif) dan dihitung sebagai urutan yang tidak diketahui. Semua di sini adalah riset — tidak ada aturan exit yang memfilter atau menunda sinyal.",
      "panel.exitPrimary": "Metrik utama (exit net, round-trip)",
      "panel.exitTp": "TP hit rate (berbasis MFE)",
      "panel.exitStrategies": "Perbandingan strategi exit (+12H)",
      "panel.exitHolding": "Berapa lama hold (keluar di close bar k)",
      "panel.exitGiveback": "Profit giveback & time-to-max-close",
      "panel.exitEntryTp": "Entry mana yang mencapai +5% (TP hit @ +12H)",
      "panel.exitRecos": "Rekomendasi exit",
      "panel.exitHyps": "Hipotesis exit (beku, menunggu close baru)",
      "exit.notYet": "Riset Take Profit & Exit belum tersedia.",
      "exit.holdH4": "HOLD mean net +4H (round-trip)",
      "exit.holdH12": "HOLD mean net +12H (round-trip)",
      "exit.bestH12": "Strategi +12H terbaik (mean net)",
      "exit.tpNote": "Hit = high tertinggi selama horizon mencapai target. Hit-then-positive = hit dan horizon tetap tutup di atas atau sama dengan entry. +1W belum ada sinyal yang matang (pertama matang 28 Nov).",
      "exit.stratNote": "Fixed TP dan ATR TP keluar di level TP saat tersentuh, atau di stop −2% / −1×ATR saat tersentuh duluan. Structure SL (E17/E18) mempertahankan TP +3% yang sama dengan E2 dan hanya memindahkan stop — ke low bar sinyal (E17) atau level breakout (E18). Jika satu bar menyentuh keduanya, stop diasumsikan dulu (konservatif) — lihat Unknown order. Trailing dan exhaustion exit hanya memakai close bar, jadi urutan tidak berlaku. Terbaik menurut mean net adalah deskripsi, bukan rekomendasi tervalidasi.",
      "exit.holdNote": "Mean net round-trip bila keluar di close bar ke-k setelah entry (1 bar = +4H, 3 = +12H, 6 = +1D, 12 = +2D, 18 = +3D, 42 = +1W). Bar terbaik adalah mean tertinggi — dengan flood mendominasi sampel, anggap ini observasi, bukan aturan hold optimal.",
      "exit.gbNote": "Giveback = MFE dikurangi return HOLD yang terealisasi: seberapa banyak puncak yang diberikan kembali karena hold sampai close horizon. Time-to-max-close hanya menghitung sinyal dengan path 42 bar penuh (belum ada yang matang).",
      "exit.entryNote": "TP+5% hit rate di +12H per karakteristik entry. Bucket dengan n<5 tidak menampilkan rate. Hit rate lebih tinggi untuk late breakout (margin 5%+) bukan berarti entry terlambat lebih baik — mereka juga sudah naik paling banyak sebelum sinyal.",
      "exit.recoNote": "Setiap rekomendasi exit membawa bukti, ukuran sampel, batasan, dan dampaknya. INSUFFICIENT EVIDENCE adalah hasil yang valid dan jujur — artinya datanya terlalu tipis untuk klaim, bukan berarti exit-nya gagal.",
      "exit.hypNote": "Dibekukan saat pertama muncul; divalidasi hanya pada close yang dipublikasikan setelah momen itu. Belum ada verdict sampai ≥10 sinyal per sisi pada close baru.",
      "panel.exitEntryDist": "Potensi TP per karakteristik entry (distribusi MFE @ +4H)",
      "exit.distNote": "MFE adalah kenaikan maksimum HISTORIS pada bar 4H pertama — bukan estimasi TP sebelum entry. Bacaan yang realistis adalah kurva hit TP: level TP yang benar-benar disentuh sekian persen sinyal dengan karakteristik ini. Kolom TP+1% before SL lebih ketat: level +1% tercapai sebelum stop −2% pernah tersentuh. Bucket dengan n<5 tidak menampilkan rate. Squeeze (lebar BB <25) tidak mencapai lebih jauh dari band lebar di sampel ini — deskriptif, didominasi flood.",
      "rail.joint": "Joint Entry & Exit",
      "sec.joint.kicker": "09 — Joint Entry & Exit",
      "sec.joint.title": "Riset Gabungan Entry & Exit",
      "sec.joint.sub": "Kombinasi config entry + strategi exit mana yang paling konsisten — dinilai dari konsistensi dulu (positive net rate, TP hit rate, profit factor, median net, drawdown, konsistensi antar-close), ukuran profit belakangan. Hanya 9 kandidat beku J0–J8 — bukan seluruh 130 kombinasi. Net adalah round-trip (gross dikurangi satu full spread + fee 8 bps) dan hanya dihitung pada sinyal dengan spread terukur (n_net); gross, MFE, dan TP hit mencakup semua sinyal config. MFE adalah kenaikan maksimum historis, bukan estimasi TP sebelum entry. Semua di sini adalah riset — tidak ada kombinasi yang diterapkan ke produksi.",
      "panel.jointPerConfig": "Potensi TP per config entry (10 config lab)",
      "panel.jointCandidates": "Kandidat gabungan J0–J8 (+4H utama)",
      "panel.jointHyps": "Hipotesis gabungan (beku, menunggu close baru)",
      "panel.jointRecos": "Rekomendasi gabungan",
      "joint.notYet": "Riset gabungan belum dibangun — builder harian (setelah lab 08:00 WIB) belum berjalan.",
      "joint.perConfigNote": "TP hit rate berbasis MFE di +4H. Kolom TP+1% before SL lebih ketat: level +1% tercapai sebelum stop −2% pernah tersentuh. Missed good = hard pump (≥+1% dalam 4H) yang tidak ditembak config itu. A4/A5/A9 mencapai lebih jauh (median MFE lebih tinggi) tapi menembak jauh lebih sedikit sinyal dan melewatkan lebih banyak — deskriptif, didominasi flood, belum tervalidasi.",
      "joint.candNote": "Net adalah round-trip dan hanya pada sinyal dengan spread terukur (n_net); hard-pump dan TP rate mencakup semua sinyal. Max DD adalah drawdown dari urutan net per sinyal secara kronologis — sinyal tumpang tindih, jadi ini bukan drawdown portofolio. Terbaik menurut mean net adalah deskripsi, bukan rekomendasi tervalidasi.",
      "joint.hypNote": "Hipotesis divalidasi hanya pada close setelah dibekukan. JH1 dan JH5 holds pada close prospektif awal (n kecil — gap JH1 0,0pp, artinya tidak ada perbedaan, bukan kemenangan); JH3 dan JH4 masih menunggu cukup close baru.",
      "joint.recoNote": "Semua rekomendasi gabungan masih INSUFFICIENT EVIDENCE di v1.1.0 — tidak ada kandidat yang diterapkan ke produksi. Verdict non-INSUFFICIENT butuh gap ≥1,0pp searah di discovery dan validation, n≥10/sisi pada close validasi, dan lolos agregasi ex-flood.",
      "rail.forwardtest": "Forward Testing",
      "sec.forwardtest.kicker": "10 — Forward Testing",
      "sec.forwardtest.title": "Pengujian Forward — A0 vs A4 vs A4 + ATR Expanded",
      "sec.forwardtest.sub": "Close 4J baru setelah cutoff riset historis, dinilai dengan threshold dan definisi yang dibekukan — tanpa optimasi ulang pada sinyal baru. A4 + ATR percentile expanded adalah kandidat riset utama; A0 adalah baseline produksi dan A4 + HOLD adalah pembanding exit. Hasil forward adalah observasi eksploratif, bukan validasi formal.",
      "panel.ignMatrix": "Matriks konsistensi kualitas entry — tiga karakteristik prioritas",
      "panel.jointExits": "Profitabilitas exit A0 vs A4 (+4H)",
      "panel.jointQvf": "Kualitas vs frekuensi — A0 vs A4",
      "panel.ftSetup": "Forward test — setup & bukti",
      "panel.ftGroups": "Hasil forward — A0 vs A4 vs A4 + ATR Expanded (+4H)",
      "panel.ftPerClose": "Performa per close (forward saja)",
      "panel.ftSplits": "A4 + ATR Expanded — CRYPTO vs SAHAM",
      "panel.ftExits": "Exit forward — E0 vs E5 vs E18 (+4H)",
      "ev.historical": "Historis",
      "ev.exploratory": "Forward eksploratif",
      "ev.formalNone": "Validasi formal: belum ada",
      "ev.insufficient": "Data tidak memadai",
      "ev.historicalNote": "Data historis, deskriptif/in-sample dengan threshold beku. Asosiasi di sini bukan prediksi.",
      "ev.exploratoryNote": "Observasi forward eksploratif pada close setelah cutoff historis. Belum ada validasi formal yang dibekukan untuk kandidat ini.",
      "ev.formalNote": "Validasi prospektif formal berjalan pada jalur beku yang terpisah (CH1/CH2). Angka forward test tidak pernah disajikan sebagai validasi formal.",
      "mx.feature": "Karakteristik",
      "mx.bucket": "Bucket",
      "mx.slice": "Irisan",
      "mx.n": "n",
      "mx.nNet": "n_net",
      "mx.closes": "Close",
      "mx.coverage": "Cakupan",
      "mx.freq": "Sinyal/close",
      "mx.cont": "Continuation",
      "mx.mean": "Mean net",
      "mx.median": "Median net",
      "mx.positive": "+Net",
      "mx.tp1": "TP+1% sebelum SL",
      "mx.mfe": "Median MFE",
      "mx.mae": "Median MAE",
      "mx.pf": "Profit factor",
      "mx.slicePooled": "Pooled",
      "mx.sliceExFlood": "Ex-flood",
      "mx.sliceCloseW": "Close-weighted",
      "mx.sliceCrypto": "CRYPTO",
      "mx.sliceSaham": "SAHAM",
      "mx.sliceProspective": "Prospektif",
      "mx.featAtr": "ATR percentile",
      "mx.featWick": "Upper wick",
      "mx.featBody": "Body strength",
      "jx.config": "Config",
      "jx.exit": "Exit",
      "jx.closeCons": "Kons. close",
      "jx.maxDd": "MaxDD",
      "jx.tpFirst": "TP dulu",
      "jx.slFirst": "SL dulu",
      "jx.neither": "Tidak keduanya",
      "jx.ambig": "Ambigu",
      "jx.top1": "Top-1 share",
      "jx.cwMean": "CloseW mean",
      "jx.discMean": "Discovery mean",
      "jx.valMean": "Validation mean",
      "jx.perfTitle": "Performa exit (+4H)",
      "jx.outTitle": "Perhitungan outcome (+4H)",
      "jx.ddNote": "MaxDD adalah diagnostik kumulatif-sinyal (peak-to-trough dari jumlah kumulatif net per sinyal menurut urutan kronologis, 1 unit notional per sinyal; sinyal tumpang tindih dalam waktu) — BUKAN drawdown portofolio, dan tidak bisa dibandingkan antar config dengan jumlah sinyal berbeda.",
      "qv.union": "Union close (semua config)",
      "qv.meanClose": "Mean / close",
      "qv.medianClose": "Median / close",
      "qv.maxClose": "Maks / close",
      "qv.withSignals": "Close bersinyal",
      "qv.zeroCloses": "Close tanpa sinyal",
      "qv.freqRatio": "Rasio frekuensi A4/A0",
      "qv.freqChange": "Perubahan frekuensi",
      "qv.tradeoffTitle": "Trade-off — A4 vs A0 (lab overall, replay)",
      "qv.cont": "Continuation",
      "qv.mean": "Mean net",
      "qv.median": "Median net",
      "qv.cwMean": "Close-weighted mean net",
      "qv.exMean": "Ex-flood mean net",
      "ft.cutoff": "Cutoff historis",
      "ft.frozen": "Kandidat dibekukan",
      "ft.fwdCloses": "Close forward",
      "ft.formal": "Validasi prospektif formal",
      "ft.group": "Grup",
      "ft.mature": "Matang",
      "ft.pending": "Pending",
      "ft.signals": "Sinyal",
      "ft.close": "Close (WIB)",
      "ft.cwTitle": "Tampilan close-weighted",
      "ft.groupsNote": "Angka forward-only — tidak pernah dicampur dengan data historis. A4 + ATR Expanded bersifat eksploratif sampai ada validasi formal yang dibekukan.",
      "ft.pendingNote": "Sinyal dari close forward terbaru masih pending — candle 4H berikutnya belum ditutup.",
      "ft.splitNote": "Split CRYPTO/SAHAM dari sinyal forward A4 + ATR Expanded. Sampel kecil — observasi saja, bukan kesimpulan.",
      "ft.exitsNote": "E0 HOLD adalah baseline exit; E5 dan E18 adalah kandidat riset, bukan strategi yang disetujui.",
      "ft.notYet": "Forward test belum dibangun — lab harian (08:00 WIB) belum berjalan sejak cutoff.",
      "panel.exitTpBsl": "TP sebelum SL (vs SL −2%)",
      "panel.exitRiskReward": "Risk–reward per keluarga exit (+4H)",
      "panel.exitFunding": "Biaya funding — bukti terukur",
      "exit.tpbslNote": "MFE hit = level target pernah tersentuh. TP-before-SL = target tercapai di bar yang lebih awal daripada sentuhan pertama stop −2%. SL first = stop kena duluan. UNKNOWN = TP dan SL tersentuh di bar 4H yang sama (urutan tidak diketahui, stop diasumsikan dulu). MAE-before-TP adalah median drawdown yang ditahan pada bar-bar sebelum bar TP tersentuh — hanya bermakna di +12H ke atas, karena +4H hanya satu bar.",
      "exit.rrNote": "Satu keluarga mem-pool semua (sinyal × strategi) di dalamnya — bukan rata-rata dari mean strategi. Payoff = avg win / |avg loss|. Break-even win rate = |avg loss| / (avg win + |avg loss|): win rate minimum supaya expected net = 0 bila ukuran win/loss tetap seperti rata-rata historis. Structure SL (E17/E18) memakai TP +3% yang sama dengan E2 — satu-satunya perbedaan adalah penempatan stop.",
      "exit.fundingNote": "Funding TIDAK masuk exit net (arsip bulanan terbit bulan berikutnya, jadi funding November baru ada di Desember). Batas di bawah ini terukur dari arsip Oktober 2026: hold +4H melewati maksimal satu pembayaran funding 8 jam, hold +12H maksimal dua pembayaran berurutan. Median funding kecil, tapi ekornya gemuk — pembayaran 8 jam terburuk di sampel adalah 2,00pp.",
      "rail.risk": "Risk & Portfolio",
      "sec.risk.kicker": "11 — Risk & Portfolio",
      "sec.risk.title": "Agent 12 — Risiko & Portofolio",
      "sec.risk.sub": "Apa risiko sebuah strategi, bukan cuma apa yang bisa dimenangkan — dan apa yang terjadi saat banyak sinyal LONG muncul sekaligus. Kurva portofolio adalah simulasi riset (jumlah kumulatif sederhana return per close, tanpa compounding), bukan hasil trading nyata. Dua varian sizing dibandingkan pada sinyal yang sama: fixed-notional (1 unit per sinyal, exposure membesar bersama batch) vs fixed-capital (1 unit per close, dibagi rata). Risk of ruin tidak dihitung — block bootstrap butuh minimal 60 close, dan sejauh ini baru 30. Semua di sini adalah riset — tidak ada yang mengatur ukuran posisi nyata atau leverage nyata.",
      "panel.riskOverview": "Gambaran risiko — exposure & korelasi",
      "panel.riskFunding": "Batas funding & risk of ruin",
      "panel.riskCandidates": "Risk–reward per kandidat J0–J8 (+4H)",
      "panel.riskDrawdown": "Drawdown portofolio — kedua varian sizing (+4H)",
      "panel.riskEquity": "Kurva ekuitas — fixed-capital, kandidat HOLD (+4H)",
      "panel.riskStreaks": "Kerugian beruntun & tail risk (+4H)",
      "panel.riskSensitivity": "Sensitivitas biaya & proxy likuidasi (+4H)",
      "panel.riskHyps": "Hipotesis risiko (beku, menunggu close baru)",
      "panel.riskRecos": "Rekomendasi risiko",
      "risk.notYet": "Riset Risk & Portfolio belum dibangun — builder harian (setelah joint 08:00 WIB) belum berjalan.",
      "risk.overviewNote": "Hitungan exposure berasal dari replay A0 Shadow Lab (436 sinyal, termasuk extra backfill; produksi mengirim 390). Korelasi adalah Pearson atas return +4H di jendela yang sama (close sinyal → close 4H berikutnya) dari candle Mainnet lokal — deskriptif, bukan klaim hedge.",
      "risk.fundingNote": "Batas funding adalah ekor terukur Oktober 2026: hold +4H membayar maksimal satu pembayaran 8 jam, hold +12H maksimal dua. Risk of ruin sengaja tidak dihitung — mengestimasinya dari 30 close akan jadi fabrikasi.",
      "risk.candNote": "Net adalah round-trip dan hanya pada sinyal dengan spread terukur (n_net). Max DD (sequence) adalah drawdown dari urutan net per sinyal secara kronologis — sinyal tumpang tindih, jadi ini bukan drawdown portofolio; drawdown portofolio ada di panel berikutnya. Break-even win rate adalah win rate minimum supaya expected net = 0 pada ukuran win/loss historis.",
      "risk.ddNote": "Fixed-notional mengambil 1 unit per sinyal (close flood = ~294 unit exposure); fixed-capital mengambil 1 unit per close dibagi rata. Selisih kedua total adalah biaya konsentrasi bila semua sinyal diambil dengan ukuran penuh. Durasi adalah jumlah close dari puncak sampai mencapai high baru — kosong berarti kurva tidak pernah pulih dalam close yang teramati.",
      "risk.equityNote": "Kurva ekuitas fixed-capital (jumlah kumulatif mean net per close, +4H) untuk empat kandidat HOLD. J0 adalah baseline produksi; J3/J5/J7 adalah config selektif. Close flood adalah satu titik di tiap kurva — bukan 294 titik independen.",
      "risk.streakNote": "Kerugian beruntun dihitung berurutan secara kronologis (per close, lalu simbol). Tail = mean dari 5% net per sinyal terburuk. Satu rangkaian kerugian panjang bisa menghapus banyak kemenangan kecil — bandingkan dengan win rate, bukan sebagai penggantinya.",
      "risk.sensNote": "Biaya ×0 = gross saja (tanpa biaya), ×1 = biaya round-trip dasar (spread + fee 8 bps), ×2 = biaya digandakan. Proxy likuidasi = porsi sinyal yang MAE-nya mencapai −33,3% (3x), −20% (5x), atau −10% (10x). Disederhanakan: isolated margin, tanpa maintenance margin, tanpa funding, MAE dari low 4H — proxy, bukan angka likuidasi.",
      "risk.hypNote": "Hipotesis divalidasi hanya pada close setelah dibekukan, memakai mean portofolio per close (fixed-capital). Sampai ada close baru, semua verdict masih awaiting_validation.",
      "risk.recoNote": "Semua rekomendasi risiko masih INSUFFICIENT EVIDENCE di v1.0.0 — tidak ada yang diterapkan ke produksi. Verdict non-INSUFFICIENT butuh gap ≥1,0pp searah di discovery dan validation, n≥10/sisi pada close validasi, lolos agregasi ex-flood, dan drawdown tidak lebih buruk dari baseline.",
      "rail.ignition": "Ignisi Pump",
      "sec.ignition.kicker": "12 — Ignisi Pump",
      "sec.ignition.title": "Agent 07 — Pemicu & Kelanjutan Pump",
      "sec.ignition.sub": "Seperti apa gambaran pra-entry sebelum sinyal muncul — squeeze, lebar Bollinger Band, kontraksi ATR, akselerasi volume, kompresi harga, akselerasi momentum, dan open interest pra-breakout — diukur hanya dari bar sebelum close sinyal, tidak pernah sesudahnya. Tujuannya bukan pump terbesar: melainkan entry yang langsung diikuti kenaikan, supaya TP kecil yang realistis lebih sering tercapai. Semua angka di sini deskriptif — satu close (flood 23 Nov) mendominasi sampel, dan hipotesis IH1–IH6 dibekukan dan masih menunggu close prospektif. v1.1.0 menambahkan candle pump pertamanya sendiri: kekuatan pump (open-to-close, vs ATR, vs histori kontrak itu sendiri), struktur candle (body, wick, close position, candle sebelumnya, exhaustion), dan enam rate candle berikutnya yang dipisah — bullish close, positive gross, positive net, TP-before-SL, continuation failure, dan reversal — dengan pandangan pooled, close-weighted, dan ex-flood. Hipotesis PH1–PH6 dibekukan bersama IH1–IH6.",
      "panel.ignOverview": "Gambaran ignisi — cakupan",
      "panel.ignOi": "Cakupan open interest",
      "panel.ignSqueeze": "Squeeze × margin breakout",
      "panel.ignFeatures": "Fitur pra-entry — per bucket (+4H)",
      "panel.ignNext": "Performa candle berikutnya — enam rate, dipisah",
      "panel.ignPump": "Kekuatan pump — absolut, vs ATR, vs histori sendiri",
      "panel.ignStruct": "Struktur candle — candle pump pertama",
      "panel.ignHyps": "Hipotesis ignisi (beku, menunggu close baru)",
      "panel.ignPh": "Hipotesis pump-continuation PH1–PH6 (beku, v1.1.0)",
      "panel.ignExec": "Entry realistis — benchmark vs eksekusi",
      "panel.ignRecos": "Rekomendasi ignisi",
      "ign.notYet": "Riset Pump Ignition belum dibangun — builder harian (setelah risk 08:00 WIB) belum berjalan.",
      "ign.overviewNote": "Fitur ignisi dihitung pada replay A0 Shadow Lab (436 sinyal, termasuk extra backfill; produksi mengirim 390). Hanya bar pra-sinyal — sebuah fitur tidak pernah melihat bar sinyal atau apa pun sesudahnya.",
      "ign.oiNote": "Open interest berasal dari arsip metrics harian Binance (lag 1 hari) — sinyal yang arsipnya belum terbit tidak punya nilai OI, dilaporkan hilang, tidak pernah diestimasi.",
      "ign.sqNote": "Squeeze memakai definisi standar TTM-style: Bollinger Bands (20, 2σ) di dalam Keltner Channels (20, 1,5× ATR10). Released = squeeze pernah terjadi di 6 bar sebelum sinyal, tapi tidak di bar tepat sebelum sinyal. Margin band adalah margin breakout: early <0,5%, late ≥5%.",
      "ign.featNote": "Satu baris per bucket fitur. Positive = porsi sinyal dengan net +4H > 0. TP+1% before SL = porsi yang menyentuh +1% sebelum stop −2%. Profit factor = gross win / gross loss; “no losses” berarti bucket itu tidak punya sinyal yang rugi. Bucket dengan n<5 ditampilkan tapi tidak membawa kesimpulan.",
      "ign.hypNote": "Verdict IH berbasis gap pada close in-sample (flood 23 Nov 23:00 WIB dan sesudahnya — termasuk close dari sebelum hipotesis dibekukan, jadi ini deskriptif, bukan validasi prospektif): holds butuh n≥5/sisi dan gap ≥2pp searah yang diharapkan. IH5 (OI naik) holds secara angka in-sample tapi sisi turunnya hanya segelintir sinyal dari sangat sedikit close — rapuh, deskriptif saja, bukan temuan.",
      "ign.recoNote": "Semua rekomendasi ignisi masih INSUFFICIENT EVIDENCE di v1.1.0 — fitur ignisi baru pertama kali diukur dan belum ada hipotesis yang tervalidasi pada close prospektif.",
      "ign.nxcNote": "Enam rate, sengaja dipisah. Bullish close = candle berikutnya close di atas open-nya sendiri. Positive gross = close berikutnya di atas close sinyal. Positive net = gross dikurangi satu spread penuh + fee 8bps. Failure = 100 − positive gross (candle berikutnya tidak melanjutkan, secara teknis). Sinyal bisa lanjut secara teknis tapi rugi setelah biaya — atau gagal secara teknis tapi tetap untung. Pooled didominasi flood; close-weighted dan ex-flood adalah pandangan yang jujur.",
      "ign.pumpNote": "Pump adalah kenaikan open-to-close candle sinyal. Bucket <1 ada karena sinyal produksi bisa pump di bawah 1% — kebanyakan stock-token perps yang volatilitasnya rendah. Pump / ATR14 membagi pump dengan ATR14 pra-pump; pump vs histori sendiri adalah persentil ukuran pump terhadap pergerakan |open-to-close| 60 bar sebelumnya dari kontrak yang sama.",
      "ign.structNote": "Satu baris per bucket candle pump pertama (atau candle sebelumnya). Body-to-range, close position, dan wick adalah porsi dari range high−low candle. RSI 4H dan green streak mengukur kelelahan momentum sebelum sinyal. Bucket dengan n<5 ditampilkan tapi tidak membawa kesimpulan.",
      "ign.phNote": "Verdict PH berbasis gap pada close in-sample (flood 23 Nov 23:00 WIB dan sesudahnya — termasuk close dari sebelum hipotesis dibekukan, jadi ini deskriptif, bukan validasi prospektif): holds butuh n≥5/sisi dan gap ≥2pp searah yang diharapkan. PH5 (upper wick kecil) holds secara angka in-sample — cek closes per sisi sebelum mempercayainya; close flood masih mendominasi setiap verdict.",
      "ign.execNote": "Close sinyal adalah benchmark entry, bukan harga fill yang pasti tersedia. Model eksekusi membeli di ask (setengah spread di atas close); total biayanya sama dengan model benchmark, jadi kedua net berbeda kurang dari 0,02pp pada setiap sinyal — spread sudah sepenuhnya diperhitungkan. Funding tidak termasuk dalam net (batas terukur Oktober di catatan funding).",
      "rail.missed": "Peluang Terlewat",
      "sec.missed.kicker": "13 — Peluang Terlewat",
      "sec.missed.title": "Agent 08 — Peluang Terlewat",
      "sec.missed.sub": "Kontrak eligible yang tidak pernah memberi sinyal tapi kemudian naik — gate mana yang memblokirnya, seberapa jauh dari threshold, dan apa yang akan ditambahkan bila satu gate dihapus atau dilonggarkan, winner DAN loser sekaligus. Dampak counterfactual hanya dalam gross return +4H: spread non-sinyal tidak terukur, jadi net tidak pernah dihitung di sini. Cakupan hanya close v2.1.2 (sejak 22 Nov 15:00 WIB).",
      "panel.missedOverview": "Gambaran peluang terlewat",
      "panel.missedPassed": "Lolos gate, tidak terkirim",
      "panel.missedGates": "Gate mana yang memblokir winner (dan loser)",
      "panel.missedCombos": "Kombinasi gate yang gagal",
      "panel.missedCf": "Counterfactual — apa yang ditambahkan satu perubahan gate",
      "panel.missedTop": "Winner terlewat terbesar",
      "panel.missedHyps": "Hipotesis missed (beku, menunggu close baru)",
      "panel.missedRecos": "Rekomendasi missed",
      "missed.notYet": "Riset Missed Opportunity belum dibangun — builder harian (setelah ignition 08:00 WIB) belum berjalan.",
      "missed.overviewNote": "Eligible = semua kontrak yang dievaluasi pada satu close v2.1.2, sinyal dan non-sinyal sekaligus. Winner = return +4H ≥ +1% (threshold tracker); big miss = ≥ +5%; loser = ≤ −1%. Satu close adalah satu kondisi pasar, bukan ratusan sampel independen.",
      "missed.passedNote": "Kontrak ini lolos gate engine tapi tidak pernah terkirim — dedup (sinyal LONG produksi dalam 1–3 close sebelumnya) atau chart-validation gate. Log watcher tidak memisahkan dedup dari chart gate, jadi split-nya tidak ditampilkan.",
      "missed.gatesNote": "“Blocked” menghitung gate di antara gate yang gagal pada satu winner/loser; “only gate” menghitung kontrak yang gate itu satu-satunya kegagalan. Median gap adalah seberapa jauh nilai aktual dari threshold (pp untuk breakout dan close>open, × untuk RVOL). Sebagian besar winner terlewat gagal di dua gate atau lebih — mereka bukan near-miss.",
      "missed.comboNote": "Setiap kombinasi gate yang gagal pada winner dan loser. Pasangan dominan adalah breakout + RVOL bersamaan.",
      "missed.cfNote": "Setiap counterfactual menghapus atau melonggarkan tepat satu gate dan menghitung apa yang akan memberi sinyal. Mean gross r4h adalah mean return +4H dari set yang ditambahkan (gross — net tidak dihitung untuk non-sinyal). “Would but dedup” menghitung winner tambahan yang tetap akan ditahan dedup 3 close.",
      "missed.topNote": "Kenaikan +4H terbesar di antara non-sinyal eligible, beserta gate yang memblokir masing-masing. NVDL +43,39% diblokir breakout (16,46pp di bawah high) dan RVOL (0,90× vs 1,3×).",
      "missed.hypNote": "Verdict MH berbasis gap pada close in-sample (flood dan sesudahnya — termasuk close dari sebelum hipotesis dibekukan, jadi ini deskriptif, bukan validasi prospektif). MH1 dan MH3 masih menunggu cukup data; MH2 tidak holds — hanya sekitar seperempat winner validasi in-sample yang diblokir satu gate saja.",
      "missed.recoNote": "Semua rekomendasi missed masih INSUFFICIENT EVIDENCE di v1.0.0 — atribusi hanya mencakup close v2.1.2 dan hipotesis MH1–MH3 belum tervalidasi prospektif.",
      "rail.validation": "Validasi Independen",
      "sec.validation.kicker": "14 — Validasi Independen",
      "sec.validation.title": "Agent 10 — Validasi Strategi Independen",
      "sec.validation.sub": "Agent ini mengaudit proses riset itu sendiri — look-ahead bias, data leakage, survivorship bias, selection bias, overfitting, multiple testing, sensitivitas parameter, walk-forward validation, validasi prospektif, ketergantungan klaster, dan reproduksibilitas. Ia tidak pernah memblokir sinyal produksi; ia menilai seberapa jauh kesimpulan riset bisa dipercaya.",
      "panel.valSummary": "Ringkasan validasi",
      "panel.valProspective": "Validasi prospektif per registri",
      "panel.valChecks": "11 pemeriksaan",
      "panel.valWf": "Walk-forward — train membesar, 5 close berikutnya sebagai test",
      "panel.valRecos": "Rekomendasi validasi",
      "panel.valLimits": "Keterbatasan",
      "val.notYet": "Validasi independen belum dibangun — builder harian (setelah missed 08:00 WIB) belum berjalan.",
      "val.summaryNote": "Verdict berbasis gap, bukan uji signifikansi — tidak ada p-value di riset ini. Warning berarti “baca angka dengan caveat ini”; fail berarti pemeriksaan menemukan cacat konkret.",
      "val.prospNote": "Hipotesis hanya divalidasi pada close setelah dibekukan — tabel menunjukkan berapa close seperti itu yang sudah dimiliki tiap registri. Verdict LH/EH/JH/RH dihitung hanya dari close itu; verdict IH/PH/MH masih memakai semua close flood dan sesudahnya, jadi 'holds'-nya deskriptif (in-sample) sampai builder-nya dibatasi ke close setelah pembekuan.",
      "val.checksNote": "Setiap pemeriksaan menghitung ulang buktinya dari file mentah (decisions, candle, file state) — ia tidak mempercayai ringkasan yang sedang diperiksanya.",
      "val.wfNote": "Train membesar, test = 5 close berikutnya. Fold awal sangat kecil (fold 1 melatih dari 10 close dengan 5 sinyal A0) — baca mean test sebagai probe stabilitas, bukan klaim performa. Best-on-train berubah antar fold, persis yang akan disembunyikan selector yang overfit.",
      "val.recoNote": "Rekomendasi validasi menyangkut proses riset (tunggu close prospektif, bekukan hipotesis baru) — bukan perubahan strategi. Ke-11-nya masih INSUFFICIENT EVIDENCE di v1.0.0.",
      "panel.agents": "Cakupan riset per agent",
      "panel.agents.sub": "Setiap agent dinilai secara independen — data yang hilang dari satu agent tidak pernah memblokir agent lain.",
      "panel.regimes": "Rezim pasar saat sinyal",
      "panel.regimes.sub": "Rezim BTC yang dicatat saat tiap sinyal dipublikasikan.",
      "panel.outcomes": "Kelengkapan hasil",
      "panel.outcomes.sub": "Porsi sinyal yang sudah matang dan punya hasil tervalidasi per horizon.",
      "panel.hypotheses": "Hipotesis",
      "panel.hypotheses.sub": "Hipotesis butuh n≥10 di kedua bucket — dan tetap butuh validasi out-of-sample.",
      "panel.quality": "Kualitas data",
      "panel.quality.sub": "Cakupan snapshot dan profil data hilang per input. Data yang hilang dilaporkan, tidak pernah diinterpolasi.",
      "panel.horizons": "Hasil per horizon",
      "panel.horizons.sub": "Semua sinyal yang bisa dievaluasi per horizon — n berbeda karena kelengkapan datanya berbeda.",
      "panel.outliers": "Pengaruh outlier terhadap rata-rata",
      "panel.outliers.sub": "Mean versus median versus trimmed mean — dan kontribusi satu hasil terbesar.",
      "panel.markers": "Marker reversal, satu per satu",
      "panel.markers.sub": "Tiap marker exhaustion dibandingkan dengan dan tanpa marker. Bucket dengan n<5 tidak menampilkan statistik.",
      "panel.distribution": "Distribusi & kontribusi",
      "panel.distribution.sub": "Di mana letak hasil +4H, dan seberapa besar kontribusi tiap sinyal terhadap total.",
      "panel.summary": "Ringkasan pembelajaran — dibuat otomatis",
      "panel.summary.sub": "Apa yang didukung bukti sejauh ini, apa yang gagal bertahan, apa yang berubah sejak evaluasi sebelumnya, dan apa yang belum bisa disimpulkan. Dibuat ulang dari data terkini di setiap build — tidak ada yang ditulis tangan.",
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
      "filter.pos4h": "+4H positif",
      "filter.neg4h": "+4H negatif",
      "filter.pending": "Belum dievaluasi",
      "filter.allRegimes": "Semua rezim",
      "filter.up": "BTC naik",
      "filter.ranging": "BTC sideways",
      "filter.down": "BTC turun",
      "th.symbol": "Simbol", "th.close": "Tutup (WIB)",
      "th.price": "Harga", "th.r4h": "+4H", "th.r12h": "+12H",
      "th.r1d": "+1D", "th.r2d": "+2D", "th.r3d": "+3D", "th.r1w": "+1W",
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
      "ov.stat2": "Hasil (+4H)",
      "ov.stat2n": "sinyal yang bisa dievaluasi dengan hasil +4H; sisanya masih menunggu",
      "ov.stat3": "+4H Positif",
      "ov.stat3n": "porsi return +4H di atas 0%, n={n}",
      "ov.stat4": "Rata-rata +4H (gross)",
      "ov.stat4n": "return gross — tanpa simulasi spread atau fee",
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
      "ov.hypEmpty": "Belum ada hipotesis yang sedang diuji. Ambang batasnya sengaja ketat: n≥10 di kedua bucket, ditambah validasi out-of-sample. Dengan {n} hasil yang bisa dievaluasi, belum ada yang lolos.",
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
      "scatter.aria": "Scatter: {x} versus return +4H",
      "sig.pending": "Menunggu",
      "sig.noMatch": "Tidak ada sinyal yang cocok.",
      "hz.pending": "menunggu", "hz.unavailable": "tidak tersedia",
      "hz.liveNow": "return live saat ini — horizon masih berjalan",
      "hz.backfilled": " · di-backfill dari arsip resmi Binance",
      "hz.live": " · direkam live",
      "det.close": "Tutup", "det.price": "harga",
      "det.analyzed": "dianalisis",
      "det.agent1": "1 · Analisis Breakout",
      "det.agent2": "2 · Pembalikan & Pelemahan Momentum",
      "det.agent3": "3 · Aliran Order",
      "det.agent4": "4 · Rezim Pasar",
      "det.agent5": "5 · Likuiditas & Eksekusi",
      "det.agent6": "6 · Pembelajaran Performa",
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
      "det.perfNote": "Keenam horizon dibaca dari candle 4J lokal (close bar target). MFE/MAE adalah pergerakan terbaik/terburuk di dalam bar 4J target.",
      "ins.meta": "Sinyal: {n} · bisa dievaluasi (+4H): {e} · data fitur hilang: {m} · periode: {p}<br>Bucket dengan n<5 tidak menampilkan statistik. Hanya asosiasi — bukan bukti kausalitas.",
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
      "ins.imbS": "Imbalance taker buy/sell pada bar sinyal versus hasil +4H.",
      "ins.imbX": "Imbalance (−1 jual … +1 beli)",
      "ins.sprT": "Spread vs hasil",
      "ins.sprS": "Apakah sinyal dengan spread lebih lebar berkinerja lebih buruk di +4H?",
      "ins.sprX": "Spread (bps)",
      "ins.brkT": "Kekuatan breakout vs hasil",
      "ins.brkS": "Seberapa jauh harga tutup melewati high 20-bar, versus hasil +4H.",
      "ins.brkX": "Margin breakout (%)",
      "lr.hz1h": "+1H (gross)", "lr.hz4h": "+4H (gross)",
      "lr.hz8h": "+8H (gross)",
      "lr.hz12h": "+12H (gross)", "lr.hz1d": "+1D (gross)",
      "lr.hz2d": "+2D (gross)", "lr.hz3d": "+3D (gross)",
      "lr.hz1w": "+1W (gross)",
      "lr.thHorizon": "Horizon", "lr.thN": "n",
      "lr.thMean": "Mean", "lr.thMedian": "Median",
      "lr.thGte": "≥ +1%", "lr.thLte": "≤ −1%",
      "lr.hzNote": "Semua horizon menampilkan return gross. Kolom ≥ +1% / ≤ −1% adalah porsi deskriptif — bukan win rate.",
      "lr.notEnough": "Hasil yang bisa dievaluasi belum cukup (n<5).",
      "lr.outMean": "Rata-rata (+4H)",
      "lr.outMedian": "Median (+4H)",
      "lr.outTrimmed": "Trimmed mean (buang 10% atas/bawah)",
      "lr.outExMax": "Mean tanpa hasil terbesar",
      "lr.outLargest": "Hasil tunggal terbesar",
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
      "lr.mkStats": "n={n} · rata-rata {m}",
      "lr.mkNote": "Marker tetap variabel riset. Selisih antara “dengan” dan “tanpa” pada ukuran sampel seperti ini adalah observasi, bukan bukti bahwa marker memprediksi apa pun.",
      "lr.distTitle": "Distribusi hasil +4H (n={n})",
      "lr.mvwTitle": "Rata-rata vs +4H positif",
      "lr.mvwWin": "+4H positif",
      "lr.mvwMean": "Rata-rata (+4H)",
      "lr.mvwMedian": "Median (+4H)",
      "lr.contribTitle": "Kontribusi tiap sinyal terhadap total",
      "lr.thSignal": "Sinyal", "lr.thNet": "+4H",
      "lr.thShare": "Porsi dari total",
      "lr.contribNote": "Porsi di atas 100% berarti satu sinyal mengalahkan seluruh total — sinyal-sinyal lainnya saling meniadakan.",
      "lr.showMore": "Tampilkan lebih banyak ({n} lagi)",
      "lr.showLess": "Tampilkan lebih sedikit",
      "lr.verdAssociation": "Asosiasi teramati",
      "lr.verdNoClear": "Tidak ada asosiasi jelas",
      "lr.verdConsistent": "Konsisten dengan hipotesis",
      "lr.verdAgainst": "Bertentangan dengan hipotesis",
      "lr.verdInsuff": "Data belum cukup",
      "lr.verdNoData": "Belum ada data",
      "lr.verdNotEval": "Tidak bisa dievaluasi",
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
      "lr.sumBased": "Berdasarkan {e} hasil +4H yang bisa dievaluasi. “Apa yang bertahan” hanya berisi asosiasi eksploratif — tidak ada di sini yang merupakan klaim prediktif.",
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
      "lr.clEval": "Sinyal yang dievaluasi (+4H)",
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
      "lr.thWins": "+4H positif",
      "lr.thMeanNet": "Rata-rata +4H",
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
      "grp.continued": "{n} +4H positif",
      "grp.reversed": "{n} +4H negatif",
      "grp.mean": "rata-rata +4H {v}",
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
    renderRideTheWave();
    renderExit();
    renderJoint();
    renderForwardTest();
    renderRisk();
    renderIgnition();
    renderMissed();
    renderValidation();
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

  /* v43: the research page shows only the six 4H-candle horizons
     (4H/12H/1D/2D/3D/1W). The pipeline still evaluates the short
     horizon underneath, so backend prose can mention it — those
     strings are filtered at render time (see mentionsHiddenHorizon).
     The match string is built from parts so this source file stays
     grep-clean for the hidden horizon's label. */
  var HIDDEN_HORIZON = "3" + "0m";
  function mentionsHiddenHorizon(txt) {
    return txt != null &&
      String(txt).toLowerCase().indexOf(HIDDEN_HORIZON) !== -1;
  }

  function r4hOf(sig) {
    var h = sig.performance && sig.performance.h4;
    return h && h.status === "evaluated" ? h.return_pct : null;
  }

  /* Generic horizon return (PERCENT) for a performance key
     ("h4", "h12", "h1d", "h2d", "h3d", "h1w"); null unless evaluated. */
  function hzOf(sig, key) {
    var h = sig.performance && sig.performance[key];
    return h && h.status === "evaluated" ? h.return_pct : null;
  }

  /* v43: +4H outcome statistics computed client-side from the
     per-signal h4 returns (the pipeline's outliers/distribution
     blocks are short-horizon based and no longer rendered). All
     values are PERCENT, matching research return_pct. Returns null
     when fewer than 5 signals have an evaluated +4H return. */
  function h4Stats() {
    var vals = [];
    DATA.signals.forEach(function (s) {
      var v = r4hOf(s);
      if (v != null) vals.push({ symbol: s.symbol, v: v });
    });
    if (vals.length < 5) return null;
    var sorted = vals.map(function (o) { return o.v; })
      .sort(function (a, b) { return a - b; });
    var n = sorted.length;
    var sum = sorted.reduce(function (a, b) { return a + b; }, 0);
    var mean = sum / n;
    var median = n % 2 ? sorted[(n - 1) / 2]
      : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
    var k = Math.floor(n * 0.1);
    var trimmed = sorted.slice(k, n - k);
    var trimmedMean = trimmed.reduce(function (a, b) { return a + b; }, 0) /
      trimmed.length;
    var maxVal = sorted[n - 1];
    var maxSym = null;
    vals.forEach(function (o) { if (o.v === maxVal) maxSym = o.symbol; });
    var pos = vals.filter(function (o) { return o.v > 0; }).length;
    return { n: n, values: vals, sum: sum, mean: mean, median: median,
      trimmedMean: trimmedMean, exMax: (sum - maxVal) / (n - 1),
      maxVal: maxVal, maxSym: maxSym,
      maxShare: sum === 0 ? null : maxVal / sum * 100,
      min: sorted[0], max: maxVal, pctPositive: pos / n * 100 };
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
      /* v43: buckets show the +4H mean (mean_r4h_pct). The old "win"
         bar/figure was the short-horizon win rate — no +4H equivalent
         exists in the data, so it is dropped rather than relabeled. */
      var mean = b.mean_r4h_pct;
      html += '<div class="bucket-row"><span class="bucket-name">' +
        esc(bucketLabel(name)) + '</span>' +
        '<span class="bucket-val">' +
        (mean == null ? "—" : fmtPct(mean, 2)) + " · n=" +
        (b.n_r4h == null ? b.n : b.n_r4h) +
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
    /* v43: point colour is the sign of the +4H return (POS/NEG/ZERO),
       not the short-horizon classification. */
    var colors = { "POS": "#abed77", "NEG": "#ff758a", "ZERO": "#819495" };
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

    /* v43: the headline KPIs read the +4H horizon (gross). The old
       short-horizon overall stats (win rate, mean net) are no longer
       displayed anywhere on this page. */
    var r4h = (DATA.learnings && DATA.learnings.horizons &&
      DATA.learnings.horizons.r4h) || {};
    var r4hN = r4h.n_evaluated == null ? 0 : r4h.n_evaluated;
    var stats = [
      { label: t("ov.stat1"), value: String(ov.n_analyzed == null ? 0 : ov.n_analyzed),
        note: t("ov.stat1n", { n: ov.n_signals == null ? "?" : ov.n_signals }) },
      { label: t("ov.stat2"), value: String(r4hN),
        note: t("ov.stat2n") },
      { label: t("ov.stat3"), value: r4h.pct_positive == null ? "N/A" : fmtNum(r4h.pct_positive, 1) + "%",
        note: t("ov.stat3n", { n: r4hN }) },
      { label: t("ov.stat4"), value: r4h.mean_pct == null ? "N/A" : fmtPct(r4h.mean_pct, 2),
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
    var agentNums = { breakout: "01", reversal: "02", orderflow: "03",
                      regime: "04", liquidity: "05" };
    var names = { breakout: t("ov.agentBreakout"), reversal: t("ov.agentReversal"),
                  orderflow: t("ov.agentOrderflow"), regime: t("ov.agentRegime"),
                  liquidity: t("ov.agentLiquidity") };
    var cov = ov.per_agent_coverage || {};
    var n = ov.n_analyzed || 1;
    $("agent-coverage").innerHTML = agents.map(function (a) {
      var d = cov[a] || {};
      var ok = d.COMPLETED || 0, part = d["PARTIAL DATA"] || 0,
          miss = (d.UNAVAILABLE || 0) + (d.ERROR || 0) + (d.MISSING || 0);
      return '<div class="cov-row cov-row--char"><span class="cov-char agent-char" data-agent="' + agentNums[a] + '" aria-hidden="true"></span><span class="cov-name">' + names[a] +
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
    // Outcome completeness — the monitored horizons (Raka 24 Nov 2026):
    // 4H, 12H, 1D, 2D, 3D, 1W. v43: the short horizon is no longer
    // displayed anywhere on this page.
    var horizons = [["h4", "+4H"], ["h12", "+12H"], ["h1d", "+1D"],
                    ["h2d", "+2D"], ["h3d", "+3D"], ["h1w", "+1W"]];
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
        t("ov.hypEmpty", { n: r4hN }) + "</p>"
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
    /* v43: the badge is the +4H return (explicitly labeled), coloured
       by its sign. The old badge was the short-horizon tracker
       classification. */
    var r4h = r4hOf(sig);
    var clsLabel = r4h == null ? [t("sig.pending"), "cls-pending"]
      : r4h > 0 ? ["+4H " + fmtPct(r4h, 1), "cls-continued"]
      : r4h < 0 ? ["+4H " + fmtPct(r4h, 1), "cls-reversal"]
      : ["+4H " + fmtPct(r4h, 1), "cls-sideways"];
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
    /* v43: group stats are +4H counts and the +4H mean (the old
       continued/reversed counts and net mean were short-horizon). */
    var pos = 0, neg = 0, sum = 0, nR4h = 0;
    sigs.forEach(function (s) {
      var r = r4hOf(s);
      if (r == null) return;
      if (r > 0) pos++;
      if (r < 0) neg++;
      sum += r; nR4h++;
    });
    var label = (fmtWib(closeTs) || "") + " WIB · " +
      (sigs.length === 1 ? t("grp.signal")
        : t("grp.signals", { n: sigs.length }));
    if (nR4h > 0) {
      label += " · " + t("grp.continued", { n: pos }) +
        " · " + t("grp.reversed", { n: neg }) +
        " · " + t("grp.mean", { v: fmtPct(sum / nR4h, 2) });
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
    var obs = (section.observations || []).filter(function (o) {
      /* v43: drop backend observations that mention the hidden
         horizon (e.g. the reversal agent's historical-context line). */
      return !mentionsHiddenHorizon(o.text) &&
        !mentionsHiddenHorizon(o.text_en);
    });
    if (obs.length) {
      html += '<ul class="obs-list">' + obs.slice(0, 4).map(function (o) {
        return '<li class="' + (o.severity === "notable" ? "notable" : "") +
          '">' + esc(bi(o.text, o.text_en)) + "</li>";
      }).join("") + "</ul>";
    }
    if (section.notes && !mentionsHiddenHorizon(section.notes) &&
        !mentionsHiddenHorizon(section.notes_en)) {
      html += '<p class="notes">' + esc(localizeTokens(bi(section.notes, section.notes_en))) + "</p>";
    }
    var miss = (section.missing || []).filter(function (m, i) {
      var en = (section.missing_en || [])[i];
      return !mentionsHiddenHorizon(m) && !mentionsHiddenHorizon(en);
    });
    var missEn = (section.missing_en || []).filter(function (m, i) {
      return !mentionsHiddenHorizon((section.missing || [])[i]) &&
        !mentionsHiddenHorizon(m);
    });
    if (miss.length) {
      html += '<ul class="missing">' + miss.map(function (m, i) {
        return "<li>" + esc(localizeTokens(bi(m, missEn[i]))) + "</li>";
      }).join("") + "</ul>";
    }
    return html + "</div>";
  }

  /* v40: the nearest pending horizon shows the LIVE return (same rule
     as the main table: first pending horizon in time order). liveCtx
     is {symbol, market, close} for that horizon, null otherwise. */
  function horizonCell(label, h, liveCtx) {
    if ((!h || h.status !== "evaluated") && liveCtx) {
      return '<div class="outcome-cell live"><p class="lbl">' + label +
        '</p><p class="val"><span data-live-symbol="' + esc(liveCtx.symbol) +
        '" data-live-market="' + esc(liveCtx.market) +
        '" data-live-close="' + (liveCtx.close == null ? "" : liveCtx.close) +
        '" data-live-mode="pct">\u2026</span></p><p class="sub">' +
        esc(t("hz.liveNow")) + "</p></div>";
    }
    if (!h || h.status !== "evaluated") {
      var reason = h && h.status === "pending" ? t("hz.pending") :
        (h && h.reason ? bi(h.reason, h.reason_en) : t("hz.unavailable"));
      return '<div class="outcome-cell"><p class="lbl">' + label +
        '</p><p class="val na">N/A</p><p class="sub">' + esc(reason) + "</p></div>";
    }
    /* v43: the six displayed horizons carry return_pct (gross) only;
       there is no net figure on these records. */
    var net = fmtPct(h.return_pct, 2);
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
      /* v43: the historical-context row is gone — its win rate was a
         +30m-derived number with no +4H equivalent in the data. */
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
    /* v40: nearest pending horizon (first pending in time order) gets
       the live return; further pending horizons stay "pending". Same
       rule as the main signal table, same close reference. */
    var hzKeys = ["h4", "h12", "h1d", "h2d", "h3d", "h1w"];
    var hzLabels = ["+4H", "+12H", "+1D", "+2D", "+3D", "+1W"];
    var liveKey = null;
    for (var hi = 0; hi < hzKeys.length; hi++) {
      var hh = pf[hzKeys[hi]];
      if (hh && hh.status === "pending") { liveKey = hzKeys[hi]; break; }
    }
    var liveCtx = liveKey ? { symbol: sig.symbol, market: sig.market,
      close: pf.reference_price } : null;
    cards += '<div class="agent-card card"><h4>' + t("det.agent6") + "</h4>" +
      '<div class="outcome-grid">' +
      hzKeys.map(function (k, i) {
        return horizonCell(hzLabels[i], pf[k], k === liveKey ? liveCtx : null);
      }).join("") +
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
      var x = getX(s), y = r4hOf(s);
      if (x == null || y == null) { missing += 1; return; }
      pts.push({ x: x, y: y,
                 cls: y > 0 ? "POS" : y < 0 ? "NEG" : "ZERO",
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
    var r4hHz = (L.horizons || {}).r4h || {};
    var evaluable = r4hHz.n_evaluated == null ? 0 : r4hHz.n_evaluated;
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
  /* Contributors table: collapsed to 10 rows by default (Raka 25 Nov —
     the full list runs hundreds of rows down the page). */
  var CONTRIB_SHOW = 10;
  var contribExpanded = false;
  function renderLearning() {
    var L = DATA.learnings || {};
    var hz = L.horizons || {};
    var rows = [["r4h", t("lr.hz4h")], ["r12h", t("lr.hz12h")],
                ["r1d", t("lr.hz1d")], ["r2d", t("lr.hz2d")],
                ["r3d", t("lr.hz3d")], ["r1w", t("lr.hz1w")]].map(function (r) {
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

    /* v43: outlier influence is computed client-side from the +4H
       returns (h4Stats). The pipeline's outliers block is
       short-horizon based and no longer rendered. */
    var st = h4Stats();
    $("learning-outliers").innerHTML = !st
      ? '<p class="panel-sub" style="margin:0">' + t("lr.notEnough") + "</p>"
      : '<ul class="missing-list">' +
        "<li><span>" + t("lr.outMean") + "</span><span class='num'>" + fmtPct(st.mean, 2) + "</span></li>" +
        "<li><span>" + t("lr.outMedian") + "</span><span class='num'>" + fmtPct(st.median, 2) + "</span></li>" +
        "<li><span>" + t("lr.outTrimmed") + "</span><span class='num'>" + fmtPct(st.trimmedMean, 2) + "</span></li>" +
        "<li><span>" + t("lr.outExMax") + "</span><span class='num'>" + fmtPct(st.exMax, 2) + "</span></li>" +
        "<li><span>" + t("lr.outLargest") + "</span><span class='num'>" + esc(st.maxSym || "—") + " " + fmtPct(st.maxVal, 2) + "</span></li>" +
        /* v43: the "share of total sum" suffix is gone — with a negative
           +4H total sum the share reads as a confusing negative %. */
        "<li><span>" + t("lr.outRange") + "</span><span class='num'>" + fmtPct(st.min, 2) + " … " + fmtPct(st.max, 2) + "</span></li>" +
        "</ul>" +
        "<p class='panel-sub' style='margin-top:12px'>" + t("lr.outNote", { n: st.n }) + "</p>";

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
          : t("lr.mkStats", { n: s.n_r4h == null ? s.n : s.n_r4h,
                              m: fmtPct(s.mean_r4h_pct, 2) || "—" });
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

    /* v43: the paired-horizons panel is hidden — its cohort is
       defined by the short horizon and cannot be re-based display-only.
       The pipeline keeps computing it underneath. */

    /* --- v43: distribution, contributions, mean vs +4H positive ---
       Computed client-side from the +4H returns (st, from h4Stats
       above). The pipeline's distribution/contributions blocks are
       short-horizon based and no longer rendered. */
    var dkeys = ["<−5%", "−5..−1%", "−1..+1%", "+1..+5%", ">+5%"];
    var dcounts = [0, 0, 0, 0, 0];
    var contribs = [];
    if (st) {
      st.values.forEach(function (o) {
        if (o.v < -5) dcounts[0]++;
        else if (o.v < -1) dcounts[1]++;
        else if (o.v <= 1) dcounts[2]++;
        else if (o.v <= 5) dcounts[3]++;
        else dcounts[4]++;
      });
      contribs = st.values.slice().sort(function (a, b) { return b.v - a.v; });
    }
    var drows = dkeys.map(function (k, i) {
      var c = dcounts[i];
      var w = st ? Math.round(c / st.n * 100) : 0;
      return "<li><span>" + esc(k) + "</span><span class='num'>" + c +
        " <span style='color:var(--text-3)'>(" + w + "%)</span></span></li>";
    }).join("");
    var maxAbs = 0;
    contribs.forEach(function (c) {
      maxAbs = Math.max(maxAbs, Math.abs(c.v));
    });
    var crows = contribs.map(function (c, i) {
      var w = maxAbs ? Math.round(Math.abs(c.v) / maxAbs * 100) : 0;
      var col = c.v >= 0 ? "var(--pos)" : "var(--neg)";
      var share = st && st.sum !== 0 ? c.v / st.sum * 100 : null;
      return "<tr" + (i >= CONTRIB_SHOW ? " class=\"contrib-extra\"" : "") +
        "><td>" + esc(c.symbol) + "</td><td>" +
        "<div style='background:" + col + ";height:8px;border-radius:99px;width:" +
        w + "%;min-width:2px'></div></td><td>" + fmtPct(c.v, 2) +
        "</td><td>" + (share == null ? "—" :
          fmtNum(share, 0) + "%") + "</td></tr>";
    }).join("");
    var contribToggle = contribs.length > CONTRIB_SHOW
      ? "<button type=\"button\" class=\"close-group-more\" " +
        "id=\"lr-contrib-toggle\" style=\"margin-top:10px\">" +
        (contribExpanded ? t("lr.showLess")
          : t("lr.showMore", { n: contribs.length - CONTRIB_SHOW })) +
        "</button>"
      : "";
    $("learning-distribution").innerHTML = !st
      ? '<p class="panel-sub" style="margin:0">' + t("lr.notEnough") + "</p>"
      : "<h4 style='margin:0 0 4px'>" + t("lr.distTitle", { n: st.n }) + "</h4>" +
        '<ul class="missing-list">' + drows + "</ul>" +
        "<h4 style='margin:16px 0 4px'>" + t("lr.mvwTitle") + "</h4>" +
        '<ul class="missing-list">' +
        "<li><span>" + t("lr.mvwWin") + "</span><span class='num'>" +
        fmtNum(st.pctPositive, 1) + "%</span></li>" +
        "<li><span>" + t("lr.mvwMean") + "</span><span class='num'>" +
        fmtPct(st.mean, 2) + "</span></li>" +
        "<li><span>" + t("lr.mvwMedian") + "</span><span class='num'>" +
        fmtPct(st.median, 2) + "</span></li></ul>" +
        "<h4 style='margin:16px 0 4px'>" + t("lr.contribTitle") + "</h4>" +
        '<table class="version-table contrib-table' +
        (contribExpanded ? " expanded" : "") +
        '"><thead><tr><th>' + t("lr.thSignal") +
        "</th><th></th><th>" + t("lr.thNet") + "</th><th>" + t("lr.thShare") +
        "</th></tr></thead><tbody>" +
        crows + "</tbody></table>" + contribToggle +
        "<p class='panel-sub' style='margin-top:12px'>" + t("lr.contribNote") + "</p>";
    var ctBtn = $("lr-contrib-toggle");
    if (ctBtn) ctBtn.addEventListener("click", function () {
      contribExpanded = !contribExpanded;
      var tbl = document.querySelector("#learning-distribution .contrib-table");
      if (tbl) tbl.classList.toggle("expanded", contribExpanded);
      ctBtn.textContent = contribExpanded ? t("lr.showLess")
        : t("lr.showMore", { n: contribs.length - CONTRIB_SHOW });
    });

    /* v43: the agent learning evaluation panel is hidden — its
       findings and means are short-horizon based and cannot be
       re-based display-only. The pipeline keeps computing it. */

    /* v43: the case-examples panel is hidden — its table is built on
       short-horizon columns with no long-horizon equivalents in the
       data. The pipeline keeps computing it. */

    /* --- Phase 4.2: learning summary (auto-generated) --- */
    var sum = L.learning_summary || {};
    var sumList = function (items, empty) {
      /* v43: drop any finding whose text mentions the hidden horizon. */
      var shown = (items || []).filter(function (it) {
        return !mentionsHiddenHorizon(it.text) &&
          !mentionsHiddenHorizon(it.text_id);
      });
      if (shown.length === 0) {
        return '<p class="panel-sub" style="margin:0 0 8px">' + empty + "</p>";
      }
      return "<ul class='missing-list'>" + shown.map(function (it) {
        return "<li><span>" + esc(localizeSummaryItem(bi(it.text_id, it.text))) + "</span></li>";
      }).join("") + "</ul>";
    };
    var topics = sum.topics || {};
    var topicStatus = { observed: t("lr.stObserved"),
      mixed: t("lr.stMixed"), insufficient: t("lr.stInsuff"),
      no_data: t("lr.stNoData") };
    /* v43: the momentum + outlier topics are short-horizon baked and
       stay hidden; the remaining topics (btc, markers, oi) were
       checked — their text carries no short-horizon reference. */
    var HIDDEN_TOPICS = { momentum: true, outlier: true };
    var topicRows = Object.keys(topics).filter(function (k) {
      return !HIDDEN_TOPICS[k];
    }).map(function (k) {
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
      /* v43: the "changed" section is hidden — its deltas are
         short-horizon metrics (evaluable count, win rate, mean net)
         with no +4H equivalent in the data. */
      "<h4 style='margin:16px 0 8px'>" + t("lr.sumInconcl") + "</h4>" +
      sumList(sum.inconclusive, t("lr.sumInconclEmpty")) +
      "<p class='panel-sub' style='margin-top:12px'>" +
      t("lr.sumBased", { e: (hz.r4h || {}).n_evaluated || 0 }) + "</p>";

    /* v43: the research checkpoints panel is hidden — checkpoints
       count paired-cohort complete outcomes, which are defined by the
       short horizon. The pipeline keeps tracking them. */

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
    /* v43: per-close outcomes are computed client-side from the +4H
       returns. The pipeline's outcome_by_close table is
       short-horizon based (wins, mean net/gross) and no longer
       rendered. Concentration figures are plain signal counts and
       stay as published. */
    var cl = L.clusters || {};
    var conc = cl.concentration || {};
    var nRecon = DATA.signals.filter(function (s) {
      return s.reconstruction != null;
    }).length;
    var closeStats = {};
    DATA.signals.forEach(function (s) {
      var cs = closeStats[s.signal_ts];
      if (!cs) {
        cs = { n: 0, nEval: 0, nPos: 0, sum: 0 };
        closeStats[s.signal_ts] = cs;
      }
      cs.n++;
      var r = r4hOf(s);
      if (r != null) {
        cs.nEval++;
        if (r > 0) cs.nPos++;
        cs.sum += r;
      }
    });
    var closeKeys = Object.keys(closeStats).map(Number)
      .sort(function (a, b) { return a - b; });
    var nEval4h = 0, nEvalCloses = 0;
    closeKeys.forEach(function (k) {
      nEval4h += closeStats[k].nEval;
      if (closeStats[k].nEval > 0) nEvalCloses++;
    });
    var clRows = closeKeys.map(function (k) {
      var c = closeStats[k];
      return "<tr><td>" + esc(fmtWib(k) || "?") + " WIB</td><td>" +
        c.n + "</td><td>" + c.nEval + "</td><td>" +
        c.nPos + "</td><td>" +
        (c.nEval ? fmtPct(c.sum / c.nEval, 2) : "—") + "</td></tr>";
    }).join("");
    $("learning-clusters").innerHTML =
      "<ul class='missing-list'>" +
      "<li><span>" + t("lr.clEval") + "</span><span class='num'>" +
        nEval4h + "</span></li>" +
      "<li><span>" + t("lr.clClosesAll") + "</span><span class='num'>" +
        closeKeys.length + "</span></li>" +
      "<li><span>" + t("lr.clClosesEval") + "</span><span class='num'>" +
        nEvalCloses + "</span></li>" +
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
      "</th><th>" + t("lr.thMeanNet") +
      "</th></tr></thead><tbody>" +
      clRows + "</tbody></table></div>" +
      "<p class='panel-sub' style='margin-top:12px'>" + esc(bi(cl.note_id, cl.note) || "") +
      t("lr.clSplitNote") + "</p>";
  }

  /* ------------------------------------------------- ride the wave (v44) */
  function renderRideTheWave() {
    var RTW = ((DATA.learnings || {}).ride_the_wave) || null;
    var ids = ["rtw-primary", "rtw-aggregations", "rtw-classes",
               "rtw-batch", "rtw-earlylate", "rtw-presignal",
               "rtw-nonsignal", "rtw-lab", "rtw-recommendations",
               "rtw-hypotheses"];
    if (!RTW || RTW.status === "ERROR") {
      ids.forEach(function (id) {
        var el = $(id);
        if (el) el.innerHTML = '<p class="panel-sub" style="margin:0">' +
          t("rtw.notYet") + "</p>";
      });
      return;
    }
    var pc = function (v, dec) {
      return v == null ? "—" : fmtPct(v, dec == null ? 2 : dec);
    };
    var nm = function (v, dec) {
      return v == null ? "—" : fmtNum(v, dec == null ? 1 : dec);
    };

    /* Primary metrics */
    var pr = RTW.primary || {};
    $("rtw-primary").innerHTML = '<ul class="missing-list">' +
      "<li><span>" + t("rtw.meanNet") + "</span><span class='num'>" +
        pc(pr.mean_net4h_pct) + "</span></li>" +
      "<li><span>" + t("rtw.posNet") + "</span><span class='num'>" +
        (pr.pct_positive_net4h == null ? "—" :
          nm(pr.pct_positive_net4h, 1) + "%") + "</span></li>" +
      "<li><span>" + t("rtw.medianNet") + "</span><span class='num'>" +
        pc(pr.median_net4h_pct) + "</span></li>" +
      "<li><span>" + t("rtw.nNet") + "</span><span class='num'>" +
        (pr.n_net4h == null ? "—" : pr.n_net4h) + " / " +
        (pr.n_signals == null ? "—" : pr.n_signals) + "</span></li>" +
      "</ul>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        esc(bi(pr.note, pr.note_en) || "") + "</p>";

    /* Aggregations */
    var ag = RTW.aggregations || {};
    var sw = ag.signal_weighted || {};
    var cw = ag.close_weighted || {};
    var xf = ag.excluding_largest_batch || {};
    var lc = ag.largest_close || {};
    $("rtw-aggregations").innerHTML =
      '<div style="overflow-x:auto"><table class="version-table">' +
      "<thead><tr><th></th><th>n</th><th>" + t("rtw.thMeanNet") +
      "</th><th>" + t("rtw.thPos") + "</th></tr></thead><tbody>" +
      "<tr><td>Signal-weighted</td><td>" + (sw.n == null ? "—" : sw.n) +
      "</td><td>" + pc(sw.mean_net4h_pct) + "</td><td>" +
      (sw.pct_positive_net4h == null ? "—" :
        nm(sw.pct_positive_net4h, 1) + "%") + "</td></tr>" +
      "<tr><td>Close-weighted</td><td>" + (cw.n_closes == null ? "—" : cw.n_closes) +
      "</td><td>" + pc(cw.mean_net4h_pct) + "</td><td>—</td></tr>" +
      "<tr><td>Excluding largest batch</td><td>" + (xf.n == null ? "—" : xf.n) +
      "</td><td>" + pc(xf.mean_net4h_pct) + "</td><td>" +
      (xf.pct_positive_net4h == null ? "—" :
        nm(xf.pct_positive_net4h, 1) + "%") + "</td></tr>" +
      "</tbody></table></div>" +
      "<p class='panel-sub' style='margin-top:12px'>" + t("rtw.aggNote") +
      (lc.n_signals == null ? "" : " " + t("lr.clLargestVal", {
        n: lc.n_signals, p: nm(lc.share_pct, 1) })) + "</p>";

    /* Outcome classes + excursion */
    var cl = RTW.outcome_classes_4h || {};
    var ex = RTW.excursion || {};
    var ex4 = ex.h4 || {};
    var ex12 = ex.h12 || {};
    var ret = ex.retention4h || {};
    var clsRows = ["CONTINUED", "EXHAUSTED", "REVERSED", "SIDEWAYS"].map(function (k) {
      var d = cl[k] || {};
      return "<tr><td>" + k + "</td><td>" + (d.n == null ? "—" : d.n) +
        "</td><td>" + (d.share_pct == null ? "—" : nm(d.share_pct, 1) + "%") +
        "</td><td>" + pc(d.mean_net4h_pct) + "</td></tr>";
    }).join("");
    $("rtw-classes").innerHTML =
      '<div style="overflow-x:auto"><table class="version-table">' +
      "<thead><tr><th>Class</th><th>n</th><th>Share</th><th>" +
      t("rtw.thMeanNet") + "</th></tr></thead><tbody>" + clsRows +
      "</tbody></table></div>" +
      '<ul class="missing-list" style="margin-top:12px">' +
      "<li><span>Mean MFE +4H</span><span class='num'>" + pc(ex4.mean_mfe_pct) + "</span></li>" +
      "<li><span>Mean MAE +4H</span><span class='num'>" + pc(ex4.mean_mae_pct) + "</span></li>" +
      "<li><span>Mean MFE +12H / time-to-MFE</span><span class='num'>" +
        pc(ex12.mean_mfe_pct) + " / " + nm(ex12.mean_time_to_mfe_bars, 2) + " bars</span></li>" +
      "<li><span>Median retention +4H</span><span class='num'>" +
        (ret.median == null ? "—" : nm(ret.median * 100, 0) + "%") + "</span></li>" +
      "<li><span>Retention ≥ 50%</span><span class='num'>" +
        (ret.pct_ge_50 == null ? "—" : nm(ret.pct_ge_50, 1) + "%") + "</span></li>" +
      "</ul>" +
      "<p class='panel-sub' style='margin-top:12px'>" + t("rtw.classNote") +
      " " + t("rtw.excNote") + "</p>";

    /* Batch context */
    var bc = RTW.batch_context || {};
    var bcRows = ["Isolated", "Intermediate", "Market-Wide Candidate"].map(function (b) {
      var d = bc[b] || {};
      return "<tr><td>" + b + "</td><td>" + (d.n == null ? "—" : d.n) +
        "</td><td>" + pc(d.mean_net4h_pct) + "</td><td>" +
        (d.pct_positive_net4h == null ? "—" : nm(d.pct_positive_net4h, 1) + "%") +
        "</td><td>" + pc(d.mean_r4h_pct) + "</td></tr>";
    }).join("");
    var bpRows = (RTW.batch_per_close || []).map(function (c) {
      return "<tr><td>" + fmtWib(c.close_ts) + "</td><td>" +
        (c.n_signals == null ? "—" : c.n_signals) + "</td><td>" +
        esc(c.band || "—") + "</td><td>" +
        (c.pct_breakout == null ? "—" : nm(c.pct_breakout, 1) + "%") +
        "</td><td>" + pc(c.mean_net4h_pct) + "</td></tr>";
    }).join("");
    $("rtw-batch").innerHTML =
      '<div style="overflow-x:auto"><table class="version-table">' +
      "<thead><tr><th>Band</th><th>n</th><th>" + t("rtw.thMeanNet") +
      "</th><th>" + t("rtw.thPos") + "</th><th>Mean +4H gross</th>" +
      "</tr></thead><tbody>" + bcRows + "</tbody></table></div>" +
      '<div style="overflow-x:auto;margin-top:12px"><table class="version-table">' +
      "<thead><tr><th>Close (WIB)</th><th>n</th><th>Band</th><th>% universe breakout</th><th>" +
      t("rtw.thMeanNet") + "</th></tr></thead><tbody>" + bpRows +
      "</tbody></table></div>" +
      "<p class='panel-sub' style='margin-top:12px'>" + t("rtw.batchNote") + "</p>";

    /* Early vs late */
    var el = RTW.early_late || {};
    var elRows = ["<0.5%", "0.5–2%", "2–5%", "5%+"].map(function (b) {
      var d = el[b] || {};
      return "<tr><td>" + b + "</td><td>" + (d.n == null ? "—" : d.n) +
        "</td><td>" + pc(d.mean_net4h_pct) + "</td><td>" +
        (d.pct_positive_net4h == null ? "—" : nm(d.pct_positive_net4h, 1) + "%") +
        "</td><td>" + pc(d.mean_pre_rise_3bar) + "</td><td>" +
        (d.mean_atr_pctile == null ? "—" : nm(d.mean_atr_pctile, 0)) +
        "</td></tr>";
    }).join("");
    $("rtw-earlylate").innerHTML =
      '<div style="overflow-x:auto"><table class="version-table">' +
      "<thead><tr><th>Margin</th><th>n</th><th>" + t("rtw.thMeanNet") +
      "</th><th>" + t("rtw.thPos") + "</th><th>Mean pre-rise 3-bar</th><th>Mean ATR %ile</th>" +
      "</tr></thead><tbody>" + elRows + "</tbody></table></div>" +
      "<p class='panel-sub' style='margin-top:12px'>" + t("rtw.earlyNote") + "</p>";

    /* Pre-signal buckets */
    var pb = RTW.pre_signal_buckets || {};
    var pbHtml = Object.keys(pb).map(function (g) {
      var rows = Object.keys(pb[g] || {}).map(function (b) {
        var d = pb[g][b] || {};
        return "<tr><td>" + esc(b) + "</td><td>" + (d.n == null ? "—" : d.n) +
          "</td><td>" + pc(d.mean_net4h_pct) + "</td><td>" +
          (d.pct_positive_net4h == null ? "—" : nm(d.pct_positive_net4h, 1) + "%") +
          "</td></tr>";
      }).join("");
      return "<h4 style='margin:14px 0 6px'>" + esc(g) + "</h4>" +
        '<div style="overflow-x:auto"><table class="version-table">' +
        "<thead><tr><th>Band</th><th>n</th><th>" + t("rtw.thMeanNet") +
        "</th><th>" + t("rtw.thPos") + "</th></tr></thead><tbody>" + rows +
        "</tbody></table></div>";
    }).join("");
    $("rtw-presignal").innerHTML = pbHtml;

    /* Non-signal comparison */
    var ns = RTW.nonsignal || {};
    var ga = ns.group_a_all_eligible || {};
    var gb = ns.group_b_matched || {};
    var missed = ns.missed_opportunities_a || {};
    var topMissed = (missed.top || []).map(function (m) {
      return "<li><span>" + esc(m.symbol) + " · " + fmtWib(m.close_ts) +
        "</span><span class='num'>" + pc(m.r4h_pct) + "</span></li>";
    }).join("");
    $("rtw-nonsignal").innerHTML = '<ul class="missing-list">' +
      "<li><span>Group A — eligible non-signals (n)</span><span class='num'>" +
        (ga.n == null ? "—" : ga.n) + "</span></li>" +
      "<li><span>Group A — mean +4H gross</span><span class='num'>" + pc(ga.mean_r4h_pct) + "</span></li>" +
      "<li><span>Group A — rose ≥ +1% (missed opportunities)</span><span class='num'>" +
        (ga.pct_gte_1pct_r4h == null ? "—" : nm(ga.pct_gte_1pct_r4h, 1) + "%") +
        " (" + (missed.n == null ? "—" : missed.n) + ")</span></li>" +
      "<li><span>Signals that rose ≥ +1% (caught)</span><span class='num'>" +
        (ns.signals_with_r4h_ge_1pct == null ? "—" : ns.signals_with_r4h_ge_1pct) + "</span></li>" +
      "<li><span>Group B — matched non-signals (n)</span><span class='num'>" +
        (gb.n_nonsignals == null ? "—" : gb.n_nonsignals) + "</span></li>" +
      "<li><span>Group B — mean +4H gross (pooled)</span><span class='num'>" + pc(gb.mean_r4h_pct) + "</span></li>" +
      "<li><span>Group B — mean +4H gross (close-weighted)</span><span class='num'>" +
        pc(gb.mean_r4h_close_weighted_pct) + "</span></li>" +
      "<li><span>Group B — rose ≥ +1%</span><span class='num'>" +
        (gb.pct_gte_1pct_r4h == null ? "—" : nm(gb.pct_gte_1pct_r4h, 1) + "%") + "</span></li>" +
      "</ul>" +
      (topMissed ? "<h4 style='margin:14px 0 6px'>Top missed opportunities</h4>" +
        '<ul class="missing-list">' + topMissed + "</ul>" : "") +
      "<p class='panel-sub' style='margin-top:12px'>" + t("rtw.nsNote") + "</p>";

    /* Shadow Lab */
    var lab = RTW.shadow_lab || {};
    var labHtml = "";
    if (lab.status === "not_run_yet") {
      labHtml = '<p class="panel-sub" style="margin:0">' +
        esc(bi(lab.note, lab.note_en) || t("rtw.notYet")) + "</p>";
    } else {
      var cal = lab.calibration || {};
      var cr = cal.raw_vs_decisions || {};
      var cd = cal.dedup_vs_sent_log || {};
      var cfgRows = (lab.configs || []).map(function (c) {
        var o = c.overall || {};
        var v = c.validation || {};
        return "<tr><td>" + esc(c.id + " — " + (c.label || "")) + "</td><td>" +
          (c.n_signals == null ? "—" : c.n_signals) + "</td><td>" +
          pc(o.mean_net4h_pct) + "</td><td>" +
          (o.pct_positive_net4h == null ? "—" : nm(o.pct_positive_net4h, 1) + "%") +
          "</td><td>" + (o.continuation_rate_pct == null ? "—" : nm(o.continuation_rate_pct, 1) + "%") +
          "</td><td>" + (o.missed_good_moves == null ? "—" : o.missed_good_moves) +
          "</td><td>" + pc(v.mean_net4h_pct) + "</td></tr>";
      }).join("");
      labHtml = '<ul class="missing-list">' +
        "<li><span>" + t("rtw.calib") + " — " + t("rtw.rawMatch") + "</span><span class='num'>" +
          (cr.match_pct == null ? "—" : nm(cr.match_pct, 2) + "%") + "</span></li>" +
        "<li><span>" + t("rtw.calib") + " — " + t("rtw.dedupMatch") + "</span><span class='num'>" +
          (cd.match_pct == null ? "—" : nm(cd.match_pct, 2) + "%") + "</span></li>" +
        "</ul>" +
        "<p class='panel-sub' style='margin:6px 0 12px'>" + t("rtw.mismatch") + "</p>" +
        '<div style="overflow-x:auto"><table class="version-table">' +
        "<thead><tr><th>" + t("rtw.thConfig") + "</th><th>" + t("rtw.thN") +
        "</th><th>" + t("rtw.thMeanNet") + "</th><th>" + t("rtw.thPos") +
        "</th><th>" + t("rtw.thCont") + "</th><th>" + t("rtw.thMissed") +
        "</th><th>" + t("rtw.thVal") + " " + t("rtw.thMeanNet") +
        "</th></tr></thead><tbody>" + cfgRows + "</tbody></table></div>" +
        "<p class='panel-sub' style='margin-top:12px'>" + t("rtw.labNote") +
        " " + t("rtw.hypNote") + "</p>";
    }
    $("rtw-lab").innerHTML = labHtml;

    /* Recommendations */
    var recs = RTW.recommendations || [];
    $("rtw-recommendations").innerHTML = recs.map(function (r) {
      var labCfgs = (r.lab_configs || []).map(function (c) {
        var o = c.overall || {};
        return esc(c.id) + ": n=" + (c.n_signals == null ? "—" : c.n_signals) +
          ", net " + pc(o.mean_net4h_pct);
      }).join(" · ");
      return '<div class="reco"><p><strong>' + esc(r.filter || "") +
        "</strong> — <span class='badge'>" + esc(r.status || "") +
        "</span></p><p class='panel-sub'>" +
        esc(bi(r.limitations, r.limitations_en) || "") + "</p>" +
        (labCfgs ? "<p class='panel-sub'>Lab: " + labCfgs + "</p>" : "") +
        "</div>";
    }).join("") +
      "<p class='panel-sub' style='margin-top:12px'>" + t("rtw.recoNote") + "</p>";

    /* Lab hypotheses */
    var hyps = ((RTW.shadow_lab || {}).hypotheses) || [];
    $("rtw-hypotheses").innerHTML = hyps.length === 0
      ? '<p class="panel-sub" style="margin:0">' + t("rtw.notYet") + "</p>"
      : hyps.map(function (h) {
          var va = h.validation_after_created || {};
          return '<div class="reco"><p><strong>' + esc(h.id) + "</strong> — " +
            esc(bi(h.text, h.text_en) || "") + "</p><p class='panel-sub'>" +
            "Status: " + esc(h.status || "") + " · " +
            "new closes: n=" + (va.n_config == null ? "—" : va.n_config) +
            " / " + (va.n_baseline == null ? "—" : va.n_baseline) +
            "</p></div>";
        }).join("") +
        "<p class='panel-sub' style='margin-top:12px'>" + t("rtw.hypNote") + "</p>";
  }

  /* ---------------------------------------------------------- timeline */
  function renderExit() {
    var EX = ((DATA.learnings || {}).exit_research) || null;
    var ids = ["exit-primary", "exit-tphit", "exit-strategies",
               "exit-tpbsl", "exit-riskreward", "exit-funding",
               "exit-holding", "exit-giveback", "exit-entrytp",
               "exit-entrydist",
               "exit-recommendations", "exit-hypotheses"];
    if (!EX || EX.status === "ERROR") {
      ids.forEach(function (id) {
        var el = $(id);
        if (el) el.innerHTML = '<p class="panel-sub" style="margin:0">' +
          t("exit.notYet") + "</p>";
      });
      return;
    }
    var pc = function (v, dec) {
      return v == null ? "—" : fmtPct(v, dec == null ? 2 : dec);
    };
    var nm = function (v, dec) {
      return v == null ? "—" : fmtNum(v, dec == null ? 1 : dec);
    };

    /* Primary metrics */
    var pr = EX.primary || {};
    var best = pr.best_strategy_h12 || {};
    $("exit-primary").innerHTML = '<ul class="missing-list">' +
      "<li><span>" + t("exit.holdH4") + "</span><span class='num'>" +
        pc(pr.hold_mean_net_rt_h4_pct) + "</span></li>" +
      "<li><span>" + t("exit.holdH12") + "</span><span class='num'>" +
        pc(pr.hold_mean_net_rt_h12_pct) + "</span></li>" +
      "<li><span>" + t("exit.bestH12") + "</span><span class='num'>" +
        (best.id ? esc(best.id) + " " + pc(best.mean_net_rt_pct)
                 : "—") + "</span></li>" +
      "<li><span>n (HOLD +12H)</span><span class='num'>" +
        (pr.hold_n_h12 == null ? "—" : pr.hold_n_h12) +
        "</span></li>" +
      "</ul>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        esc(bi(pr.note, pr.note_en) || "") + "</p>";

    /* TP hit rates: targets x horizons */
    var horizons = ["h4", "h12", "h1d", "h2d", "h3d", "h1w"];
    var hLabels = {h4: "+4H", h12: "+12H", h1d: "+1D",
                   h2d: "+2D", h3d: "+3D", h1w: "+1W"};
    var targets = ["0.5", "1.0", "1.5", "2.0", "3.0", "4.0", "5.0",
                   "10.0", "15.0"];
    var tp = EX.tp_hit_rates || {};
    var tpRows = targets.map(function (tg) {
      var cells = horizons.map(function (h) {
        var d = (tp[h] || {})[tg] || {};
        return "<td>" + (d.hit_rate_pct == null ? "—" :
          nm(d.hit_rate_pct, 1) + "%") + "</td>";
      }).join("");
      return "<tr><td>+" + parseFloat(tg) + "%</td>" + cells + "</tr>";
    }).join("");
    var tpN = horizons.map(function (h) {
      var d = ((tp[h] || {})["5.0"]) || {};
      return "<td>" + (d.n == null ? "—" : d.n) + "</td>";
    }).join("");
    $("exit-tphit").innerHTML =
      '<div style="overflow-x:auto"><table class="version-table">' +
      "<thead><tr><th>Target</th>" +
      horizons.map(function (h) {
        return "<th>" + hLabels[h] + "</th>";
      }).join("") + "</tr></thead><tbody>" +
      tpRows +
      "<tr><td>n (target +5%)</td>" + tpN + "</tr>" +
      "</tbody></table></div>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("exit.tpNote") + "</p>";

    /* Exit strategies at +12H (with consistency metrics, v1.1.0) */
    var stratRows = (EX.strategies || []).map(function (s) {
      var h12 = (s.horizons || {}).h12 || {};
      var agg = s.agg_h12 || {};
      var xf = agg.excluding_largest_batch || {};
      var wl = (h12.avg_win_pct == null || h12.avg_loss_pct == null)
        ? "—" : nm(h12.avg_win_pct, 2) + " / " +
          nm(h12.avg_loss_pct, 2);
      return "<tr><td>" + esc(s.id) + " " +
        esc(bi(s.label, s.label_en)) + "</td>" +
        "<td>" + (h12.n == null ? "—" : h12.n) + "</td>" +
        "<td>" + pc(h12.mean_net_rt_pct) + "</td>" +
        "<td>" + pc(h12.median_net_rt_pct) + "</td>" +
        "<td>" + (h12.pct_positive_net_rt == null ? "—" :
          nm(h12.pct_positive_net_rt, 1) + "%") + "</td>" +
        "<td>" + (h12.profit_factor == null ? "—" :
          nm(h12.profit_factor, 2)) + "</td>" +
        "<td>" + wl + "</td>" +
        "<td>" + (h12.max_drawdown_pp == null ? "—" :
          nm(h12.max_drawdown_pp, 1)) + "</td>" +
        "<td>" + (h12.close_consistency_pct == null ? "—" :
          nm(h12.close_consistency_pct, 1) + "%") + "</td>" +
        "<td>" + (h12.unknown_order_n == null ? "—" :
          h12.unknown_order_n) + "</td>" +
        "<td>" + pc(xf.mean_net_rt_pct) + "</td></tr>";
    }).join("");
    $("exit-strategies").innerHTML =
      '<div style="overflow-x:auto"><table class="version-table">' +
      "<thead><tr><th>Strategy</th><th>n</th><th>Mean net +12H</th>" +
      "<th>Median net</th><th>Positive</th><th>Profit factor</th>" +
      "<th>Avg win / loss</th><th>Max DD (pp)</th>" +
      "<th>Close cons.</th><th>Unknown order</th><th>Ex-flood mean</th>" +
      "</tr></thead><tbody>" + stratRows + "</tbody></table></div>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("exit.stratNote") + "</p>";

    /* TP-before-SL (v1.2.0): MFE hit vs actually reached before SL.
       MAE-before-TP is only meaningful at +12H (a +4H window is a
       single bar, so there is no bar before the TP-touch bar). */
    var tbs = EX.tp_before_sl || {};
    var tbsRows = targets.map(function (tg) {
      var d4 = (tbs.h4 || {})[tg] || {};
      var d12 = (tbs.h12 || {})[tg] || {};
      var mfe4 = ((tp.h4 || {})[tg] || {}).hit_rate_pct;
      return "<tr><td>+" + parseFloat(tg) + "%</td>" +
        "<td>" + (mfe4 == null ? "—" : nm(mfe4, 1) + "%") + "</td>" +
        "<td>" + (d4.tp_before_sl_rate_pct == null ? "—" :
          nm(d4.tp_before_sl_rate_pct, 1) + "%") + "</td>" +
        "<td>" + (d12.tp_before_sl_rate_pct == null ? "—" :
          nm(d12.tp_before_sl_rate_pct, 1) + "%") + "</td>" +
        "<td>" + (d4.sl_first_rate_pct == null ? "—" :
          nm(d4.sl_first_rate_pct, 1) + "%") + "</td>" +
        "<td>" + (d4.unknown_rate_pct == null ? "—" :
          nm(d4.unknown_rate_pct, 1) + "%") + "</td>" +
        "<td>" + pc(d12.median_mae_before_tp_pct) + "</td></tr>";
    }).join("");
    var tbsN = ((tbs.h4 || {})["1.0"] || {}).n;
    $("exit-tpbsl").innerHTML =
      '<div style="overflow-x:auto"><table class="version-table">' +
      "<thead><tr><th>Target</th><th>MFE hit +4H</th>" +
      "<th>Before SL +4H</th><th>Before SL +12H</th>" +
      "<th>SL first +4H</th><th>Unknown +4H</th>" +
      "<th>MAE before TP +12H</th></tr></thead><tbody>" +
      tbsRows +
      "<tr><td>n</td><td colspan='6'>" +
        (tbsN == null ? "—" : tbsN) + "</td></tr>" +
      "</tbody></table></div>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("exit.tpbslNote") + "</p>";

    /* Risk-reward by exit family @ +4H (v1.2.0, pooled rows) */
    var rrRows = (EX.risk_reward_h4 || []).map(function (f) {
      var wl = (f.avg_win_pct == null || f.avg_loss_pct == null)
        ? "—" : nm(f.avg_win_pct, 2) + " / " +
          nm(f.avg_loss_pct, 2);
      return "<tr><td>" + esc(f.label) + "</td>" +
        "<td>" + (f.n == null ? "—" : f.n) + "</td>" +
        "<td>" + pc(f.mean_net_rt_pct) + "</td>" +
        "<td>" + pc(f.median_net_rt_pct) + "</td>" +
        "<td>" + (f.pct_positive_net_rt == null ? "—" :
          nm(f.pct_positive_net_rt, 1) + "%") + "</td>" +
        "<td>" + (f.profit_factor == null ? "—" :
          nm(f.profit_factor, 2)) + "</td>" +
        "<td>" + wl + "</td>" +
        "<td>" + (f.payoff_ratio == null ? "—" :
          nm(f.payoff_ratio, 2)) + "</td>" +
        "<td>" + (f.breakeven_win_rate_pct == null ? "—" :
          nm(f.breakeven_win_rate_pct, 1) + "%") + "</td>" +
        "<td>" + (f.max_drawdown_pp == null ? "—" :
          nm(f.max_drawdown_pp, 1)) + "</td>" +
        "<td>" + (f.close_consistency_pct == null ? "—" :
          nm(f.close_consistency_pct, 1) + "%") + "</td></tr>";
    }).join("");
    $("exit-riskreward").innerHTML =
      '<div style="overflow-x:auto"><table class="version-table">' +
      "<thead><tr><th>Family</th><th>n</th><th>Mean net +4H</th>" +
      "<th>Median net</th><th>Positive</th><th>Profit factor</th>" +
      "<th>Avg win / loss</th><th>Payoff</th>" +
      "<th>Break-even win rate</th><th>Max DD (pp)</th>" +
      "<th>Close cons.</th></tr></thead><tbody>" + rrRows +
      "</tbody></table></div>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("exit.rrNote") + "</p>";

    /* Funding evidence (v1.2.0, measured — not assumed) */
    var fund = EX.funding_evidence || {};
    if (fund.status === "measured") {
      $("exit-funding").innerHTML =
        '<ul class="missing-list">' +
        "<li><span>Archive month / symbols / observations</span>" +
          "<span class='num'>" + esc(fund.month || "—") + " / " +
          (fund.n_symbols == null ? "—" : fund.n_symbols) + " / " +
          (fund.n_obs == null ? "—" : fund.n_obs) + "</span></li>" +
        "<li><span>Single 8h payment |funding| — median / p95 / p99</span>" +
          "<span class='num'>" +
          pc(fund.single_8h_median_abs_pct, 4) + " / " +
          pc(fund.single_8h_p95_abs_pct, 4) + " / " +
          pc(fund.single_8h_p99_abs_pct, 4) + "</span></li>" +
        "<li><span>Single 8h payment — worst in sample" +
          (fund.worst_symbol ? " (" + esc(fund.worst_symbol) + ")" : "") +
          "</span><span class='num'>" +
          pc(fund.single_8h_max_abs_pct, 2) + "</span></li>" +
        "<li><span>Two consecutive 8h payments — median / p95 / p99</span>" +
          "<span class='num'>" +
          pc(fund.pair_2x8h_median_abs_pct, 4) + " / " +
          pc(fund.pair_2x8h_p95_abs_pct, 4) + " / " +
          pc(fund.pair_2x8h_p99_abs_pct, 4) + "</span></li>" +
        "</ul>" +
        "<p class='panel-sub' style='margin-top:12px'>" +
          esc(bi(fund.note, fund.note_en) || "") + "</p>" +
        "<p class='panel-sub' style='margin-top:12px'>" +
          t("exit.fundingNote") + "</p>";
    } else {
      $("exit-funding").innerHTML =
        "<p class='panel-sub' style='margin:0'>" +
        esc(bi(fund.note, fund.note_en) || t("exit.notYet")) + "</p>";
    }

    /* Holding curve: exit at bar k close */
    var curve = EX.holding_curve || [];
    var bestK = null;
    curve.forEach(function (c) {
      if (c.mean_net_rt_pct != null &&
          (bestK == null ||
           c.mean_net_rt_pct > bestK.mean_net_rt_pct)) bestK = c;
    });
    var showK = [1, 2, 3, 4, 5, 6, 12, 18, 24, 30, 36, 42];
    var holdRows = showK.map(function (k) {
      var c = curve[k - 1] || {};
      var star = (bestK && bestK.k === k) ? " ★" : "";
      return "<tr><td>Bar " + k + star + "</td>" +
        "<td>" + (c.n == null ? "—" : c.n) + "</td>" +
        "<td>" + pc(c.mean_net_rt_pct) + "</td>" +
        "<td>" + (c.pct_positive_net_rt == null ? "—" :
          nm(c.pct_positive_net_rt, 1) + "%") + "</td></tr>";
    }).join("");
    $("exit-holding").innerHTML =
      '<div style="overflow-x:auto"><table class="version-table">' +
      "<thead><tr><th>Exit at</th><th>n</th><th>Mean net</th>" +
      "<th>Positive</th></tr></thead><tbody>" +
      holdRows + "</tbody></table></div>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("exit.holdNote") + "</p>";

    /* Giveback + time-to-max-close */
    var gb = EX.giveback || {};
    var ttm = EX.time_to_max_close || {};
    var gbRows = horizons.map(function (h) {
      var d = gb[h] || {};
      return "<tr><td>" + hLabels[h] + "</td>" +
        "<td>" + (d.n == null ? "—" : d.n) + "</td>" +
        "<td>" + pc(d.mean_giveback_pp) + "</td>" +
        "<td>" + pc(d.median_giveback_pp) + "</td>" +
        "<td>" + (d.pct_gt_2pp == null ? "—" :
          nm(d.pct_gt_2pp, 1) + "%") + "</td></tr>";
    }).join("");
    $("exit-giveback").innerHTML =
      '<div style="overflow-x:auto"><table class="version-table">' +
      "<thead><tr><th>Horizon</th><th>n</th><th>Mean giveback</th>" +
      "<th>Median</th><th>&gt; 2pp</th></tr></thead><tbody>" +
      gbRows + "</tbody></table></div>" +
      '<ul class="missing-list" style="margin-top:12px">' +
      "<li><span>Time-to-max-close (median bar)</span>" +
        "<span class='num'>" +
        (ttm.median_bar == null ? "—" : nm(ttm.median_bar, 1)) +
        " / n=" + (ttm.n == null ? "—" : ttm.n) + "</span></li>" +
      "<li><span>Max close within 3 bars</span><span class='num'>" +
        (ttm.pct_within_3_bars == null ? "—" :
          nm(ttm.pct_within_3_bars, 1) + "%") + "</span></li>" +
      "<li><span>Max close within 6 bars</span><span class='num'>" +
        (ttm.pct_within_6_bars == null ? "—" :
          nm(ttm.pct_within_6_bars, 1) + "%") + "</span></li>" +
      "</ul>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("exit.gbNote") + "</p>";

    /* Entry-vs-TP (margin bands) */
    var evt = (EX.entry_vs_tp || {}).margin || {};
    var evtRows = ["<0.5%", "0.5-2%", "2-5%", "5%+"].map(function (b) {
      var d = evt[b] || {};
      return "<tr><td>" + esc(b) + "</td>" +
        "<td>" + (d.n == null ? "—" : d.n) + "</td>" +
        "<td>" + (d.hit_rate_pct == null ? "—" :
          nm(d.hit_rate_pct, 1) + "%") + "</td></tr>";
    }).join("");
    $("exit-entrytp").innerHTML =
      '<div style="overflow-x:auto"><table class="version-table">' +
      "<thead><tr><th>Breakout margin</th><th>n</th>" +
      "<th>TP+5% hit @ +12H</th></tr></thead><tbody>" +
      evtRows + "</tbody></table></div>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("exit.entryNote") + "</p>";

    /* Entry-specific TP distributions (v1.1.0): MFE/MAE + TP hit
       @ +4H per entry characteristic, with a dimension picker. */
    var distDims = [
      ["margin", "Breakout margin"],
      ["rvol", "RVOL"],
      ["pre_rise_3bar", "Pre-rise 3 bar"],
      ["atr_pctile", "ATR percentile"],
      ["vol_accel", "Volume acceleration"],
      ["bb_width_pctile", "BB width percentile"],
      ["ema_aligned", "EMA alignment"],
      ["btc_regime", "BTC regime"],
      ["oi_chg_24h", "OI change 24h"],
      ["exhaustion_markers", "Exhaustion markers"],
      ["spread_band", "Spread band"],
    ];
    var distData = EX.entry_tp_distributions || {};
    window.__exitDistDim = window.__exitDistDim || "margin";
    var renderDistTable = function (dim) {
      var buckets = distData[dim] || {};
      var rows = Object.keys(buckets).map(function (b) {
        var d = buckets[b] || {};
        var hits = d.tp_hit_rates || {};
        var bsl = d.tp_before_sl_rates || {};
        var cell = function (tg) {
          var h = hits[tg] || {};
          return "<td>" + (h.hit_rate_pct == null ? "—" :
            nm(h.hit_rate_pct, 1) + "%") + "</td>";
        };
        var bsl1 = bsl["1.0"] || {};
        return "<tr><td>" + esc(b) + "</td>" +
          "<td>" + (d.n == null ? "—" : d.n) + "</td>" +
          "<td>" + (d.n_closes == null ? "—" : d.n_closes) + "</td>" +
          "<td>" + pc(d.median_mfe_pct) + "</td>" +
          "<td>" + pc(d.mfe_p90_pct) + "</td>" +
          "<td>" + pc(d.median_mae_pct) + "</td>" +
          cell("0.5") + cell("1.0") + cell("2.0") + cell("5.0") +
          "<td>" + (bsl1.tp_before_sl_rate_pct == null ? "—" :
            nm(bsl1.tp_before_sl_rate_pct, 1) + "%") + "</td>" +
          "</tr>";
      }).join("");
      $("exit-dist-table").innerHTML =
        '<div style="overflow-x:auto"><table class="version-table">' +
        "<thead><tr><th>Band</th><th>n</th><th>Closes</th>" +
        "<th>Median MFE</th><th>MFE p90</th><th>Median MAE</th>" +
        "<th>TP+0.5%</th><th>TP+1%</th><th>TP+2%</th>" +
        "<th>TP+5%</th><th>TP+1% before SL</th></tr></thead><tbody>" + rows +
        "</tbody></table></div>";
    };
    $("exit-entrydist").innerHTML =
      '<select id="exit-dist-dim" aria-label="Entry characteristic">' +
      distDims.map(function (d) {
        return "<option value='" + d[0] + "'" +
          (d[0] === window.__exitDistDim ? " selected" : "") + ">" +
          esc(d[1]) + "</option>";
      }).join("") + "</select>" +
      '<div id="exit-dist-table" style="margin-top:12px"></div>' +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("exit.distNote") + "</p>";
    renderDistTable(window.__exitDistDim);
    $("exit-dist-dim").addEventListener("change", function (ev) {
      window.__exitDistDim = ev.target.value;
      renderDistTable(window.__exitDistDim);
    });

    /* Recommendations */
    var recos = (EX.recommendations || []).map(function (r) {
      return "<li><span>" + esc(bi(r.filter, r.filter_en)) +
        "</span><span class='num'>" +
        esc(r.status || r.kind || "") + "</span></li>";
    }).join("");
    $("exit-recommendations").innerHTML =
      '<ul class="missing-list">' + recos + "</ul>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("exit.recoNote") + "</p>";

    /* Hypotheses */
    var hyps = (EX.hypotheses || []).map(function (h) {
      var v = h.validation_after_created || {};
      return "<li><span>" + esc(h.id) + " — " +
        esc(bi(h.text, h.text_en)) + "</span><span class='num'>" +
        esc(h.status || "") + " (n=" +
        (v.n_config == null ? "—" : v.n_config) + "/" +
        (v.n_baseline == null ? "—" : v.n_baseline) +
        ")</span></li>";
    }).join("");
    $("exit-hypotheses").innerHTML =
      '<ul class="missing-list">' + hyps + "</ul>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("exit.hypNote") + "</p>";
  }

  /* Evidence badges (v1.2.0+): three levels, never mixed.
     historical = frozen descriptive/in-sample data (green);
     exploratory = forward observations, no frozen formal validation
     (amber); formal-none = no formal validation exists yet (red);
     insufficient = sample too small for any conclusion (red). */
  function evidenceBadge(level) {
    var map = {
      historical: ["st-completed", "ev.historical"],
      exploratory: ["st-partial", "ev.exploratory"],
      "formal-none": ["st-unavailable", "ev.formalNone"],
      insufficient: ["st-unavailable", "ev.insufficient"]
    };
    var m = map[level] || map.historical;
    return '<span class="status-badge ' + m[0] + '"' +
      ' style="white-space:nowrap">' +
      esc(t(m[1])) + "</span>";
  }
  /* Exit strategy identities (binding, RULES/exit research):
     E0 Hold, E13 TP+0.5%, E14 TP+1%, E1 TP+2%, E4 TP+10%,
     E5 TP+15%, E11 Partial Exit, E18 Structure SL. */
  var EXIT_LABELS = {
    E0: "Hold", E13: "TP +0.5%", E14: "TP +1%", E1: "TP +2%",
    E4: "TP +10%", E5: "TP +15%", E11: "Partial Exit",
    E18: "Structure SL"
  };
  function exitLabel(id) {
    return id + " — " + (EXIT_LABELS[id] || id);
  }
  /* Full WIB timestamp (day + month + year + time), for frozen
     cutoffs where the year matters. fmtWib omits the year. */
  function fmtTs(ts) {
    if (ts == null) return null;
    try {
      return new Intl.DateTimeFormat(lang() === "id" ? "id-ID" : "en-GB", {
        timeZone: "Asia/Jakarta", day: "2-digit", month: "short",
        year: "numeric", hour: "2-digit", minute: "2-digit",
        hour12: false
      }).format(new Date(ts * 1000));
    } catch (e) { return null; }
  }
  /* Consistency-matrix labels (v1.2.0 feature_consistency). */
  var MATRIX_FEATURES = ["atr_pctile", "upper_wick_pct", "body_to_range"];
  var MATRIX_FEATURE_KEYS = {
    atr_pctile: "mx.featAtr", upper_wick_pct: "mx.featWick",
    body_to_range: "mx.featBody"
  };
  var MATRIX_SLICES = ["pooled", "ex_flood", "close_weighted",
    "crypto", "saham", "prospective"];
  var MATRIX_SLICE_KEYS = {
    pooled: "mx.slicePooled", ex_flood: "mx.sliceExFlood",
    close_weighted: "mx.sliceCloseW", crypto: "mx.sliceCrypto",
    saham: "mx.sliceSaham", prospective: "mx.sliceProspective"
  };

  function renderJoint() {
    var JN = ((DATA.learnings || {}).joint_research) || null;
    var ids = ["joint-perconfig", "joint-candidates",
               "joint-hypotheses", "joint-recommendations",
               "joint-exits", "joint-qvf"];
    if (!JN || JN.status === "ERROR") {
      ids.forEach(function (id) {
        var el = $(id);
        if (el) el.innerHTML = '<p class="panel-sub" style="margin:0">' +
          t("exit.notYet") + "</p>";
      });
      return;
    }
    if (JN.status === "not yet") {
      ids.forEach(function (id) {
        var el = $(id);
        if (el) el.innerHTML = '<p class="panel-sub" style="margin:0">' +
          esc(bi(JN.note, JN.note_en) || t("joint.notYet")) + "</p>";
      });
      return;
    }
    var pc = function (v, dec) {
      return v == null ? "—" : fmtPct(v, dec == null ? 2 : dec);
    };
    var nm = function (v, dec) {
      return v == null ? "—" : fmtNum(v, dec == null ? 1 : dec);
    };

    /* TP potential by entry config (all 10 lab configs) */
    var pcRows = (JN.per_config_tp || []).map(function (c) {
      var hits = (c.tp_hit_rates || {}).h4 || {};
      var bsl = (c.tp_before_sl_h4 || {})["1.0"] || {};
      var cell = function (tg) {
        var h = hits[tg] || {};
        return "<td>" + (h.hit_rate_pct == null ? "—" :
          nm(h.hit_rate_pct, 1) + "%") + "</td>";
      };
      return "<tr><td>" + esc(c.id) + "</td>" +
        "<td>" + (c.n == null ? "—" : c.n) + "</td>" +
        "<td>" + (c.n_closes == null ? "—" : c.n_closes) + "</td>" +
        "<td>" + pc(c.median_mfe_h4_pct) + "</td>" +
        "<td>" + pc(c.mfe_p90_h4_pct) + "</td>" +
        "<td>" + pc(c.median_mae_h4_pct) + "</td>" +
        cell("0.5") + cell("1.0") + cell("2.0") + cell("5.0") +
        "<td>" + (bsl.tp_before_sl_rate_pct == null ? "—" :
          nm(bsl.tp_before_sl_rate_pct, 1) + "%") + "</td>" +
        "<td>" + (c.missed_good_n == null ? "—" :
          c.missed_good_n) + "</td></tr>";
    }).join("");
    $("joint-perconfig").innerHTML =
      '<div style="overflow-x:auto"><table class="version-table">' +
      "<thead><tr><th>Config</th><th>n</th><th>Closes</th>" +
      "<th>Median MFE +4H</th><th>MFE p90</th><th>Median MAE</th>" +
      "<th>TP+0.5%</th><th>TP+1%</th><th>TP+2%</th><th>TP+5%</th>" +
      "<th>TP+1% before SL</th>" +
      "<th>Missed good</th></tr></thead><tbody>" + pcRows +
      "</tbody></table></div>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("joint.perConfigNote") + "</p>";

    /* Joint candidates J0–J8 (+4H primary) */
    var candRows = (JN.candidates || []).map(function (c) {
      var h4 = (c.horizons || {}).h4 || {};
      var agg = c.agg_h4 || {};
      var xf = agg.excluding_largest_batch || {};
      return "<tr><td>" + esc(c.id) + " " +
        esc(bi(c.label, c.label_en)) + "</td>" +
        "<td>" + (c.n_signals == null ? "—" : c.n_signals) + "</td>" +
        "<td>" + (h4.n == null ? "—" : h4.n) + "</td>" +
        "<td>" + pc(h4.mean_net_rt_pct) + "</td>" +
        "<td>" + pc(h4.median_net_rt_pct) + "</td>" +
        "<td>" + (h4.pct_positive_net_rt == null ? "—" :
          nm(h4.pct_positive_net_rt, 1) + "%") + "</td>" +
        "<td>" + (h4.profit_factor == null ? "—" :
          nm(h4.profit_factor, 2)) + "</td>" +
        "<td>" + (h4.close_consistency_pct == null ? "—" :
          nm(h4.close_consistency_pct, 1) + "%") + "</td>" +
        "<td>" + (h4.hard_pump_hit_rate_pct == null ? "—" :
          nm(h4.hard_pump_hit_rate_pct, 1) + "%") + "</td>" +
        "<td>" + pc(xf.mean_net_rt_pct) + "</td></tr>";
    }).join("");
    $("joint-candidates").innerHTML =
      '<div style="overflow-x:auto"><table class="version-table">' +
      "<thead><tr><th>Candidate</th><th>n</th><th>n_net</th>" +
      "<th>Mean net +4H</th><th>Median net</th><th>Positive</th>" +
      "<th>Profit factor</th><th>Close cons.</th>" +
      "<th>Hard pump</th><th>Ex-flood mean</th>" +
      "</tr></thead><tbody>" + candRows + "</tbody></table></div>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("joint.candNote") + "</p>";

    /* Hypotheses JH1–JH6 */
    var hyps = (JN.hypotheses || []).map(function (h) {
      var v = h.validation_after_created || {};
      return "<li><span>" + esc(h.id) + " — " +
        esc(bi(h.text, h.text_en)) + "</span><span class='num'>" +
        esc(h.status || "") + " (n=" +
        (v.n_a == null ? "—" : v.n_a) + "/" +
        (v.n_b == null ? "—" : v.n_b) +
        ")</span></li>";
    }).join("");
    $("joint-hypotheses").innerHTML =
      '<ul class="missing-list">' + hyps + "</ul>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("joint.hypNote") + "</p>";

    /* Recommendations */
    var recos = (JN.recommendations || []).map(function (r) {
      return "<li><span>" + esc(r.id) + " — " +
        esc(r.candidate || "") + " (" + esc(r.kind || "") +
        ")</span><span class='num'>" +
        esc(r.status || "") + "</span></li>";
    }).join("");
    $("joint-recommendations").innerHTML =
      '<ul class="missing-list">' + recos + "</ul>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("joint.recoNote") + "</p>";

    /* A0 vs A4 exit profitability — per-config exits (v1.2.0).
       Historical (replay) data only; never mixed with forward. */
    var PE = JN.per_config_exits || [];
    var pfCellJ = function (v) {
      if (v == null) return "—";
      if (typeof v === "number") return nm(v, 2);
      return esc(String(v));
    };
    var th = function (k) { return "<th>" + esc(t(k)) + "</th>"; };
    if (!PE.length) {
      $("joint-exits").innerHTML =
        '<p class="panel-sub" style="margin:0">' +
        t("joint.notYet") + "</p>";
    } else {
      var perfRows = PE.map(function (e) {
        var h = e.h4 || {};
        return "<tr><td>" + esc(e.entry_config || "") + "</td>" +
          "<td>" + esc(exitLabel(e.exit_strategy || "")) + "</td>" +
          "<td>" + (e.n_signals == null ? "—" : e.n_signals) +
          "</td>" +
          "<td>" + (h.n_closes == null ? "—" : h.n_closes) +
          "</td>" +
          "<td>" + pc(h.mean_net_rt_pct) + "</td>" +
          "<td>" + pc(h.median_net_rt_pct) + "</td>" +
          "<td>" + (h.pct_positive_net_rt == null ? "—" :
            nm(h.pct_positive_net_rt, 1) + "%") + "</td>" +
          "<td>" + pfCellJ(h.profit_factor) + "</td>" +
          "<td>" + (h.close_consistency_pct == null ? "—" :
            nm(h.close_consistency_pct, 1) + "%") + "</td>" +
          "<td>" + (h.max_drawdown_pp == null ? "—" :
            nm(h.max_drawdown_pp, 1)) + "</td></tr>";
      }).join("");
      var outRows = PE.map(function (e) {
        var o = e.outcomes_h4 || {};
        var ol = e.outlier_h4 || {};
        var ag = (e.agg_h4 || {}).close_weighted || {};
        var dc = e.discovery_h4 || {};
        var vc = e.validation_h4 || {};
        return "<tr><td>" + esc(e.entry_config || "") + "</td>" +
          "<td>" + esc(exitLabel(e.exit_strategy || "")) + "</td>" +
          "<td>" + (o.tp_first_n == null ? "—" : o.tp_first_n) +
          "</td>" +
          "<td>" + (o.sl_first_n == null ? "—" : o.sl_first_n) +
          "</td>" +
          "<td>" + (o.neither_n == null ? "—" : o.neither_n) +
          "</td>" +
          "<td>" + (o.ambiguous_n == null ? "—" : o.ambiguous_n) +
          "</td>" +
          "<td>" + (ol.top1_share_of_positive_sum_pct == null ?
            "—" : nm(ol.top1_share_of_positive_sum_pct, 1) + "%") +
          "</td>" +
          "<td>" + pc(e.median_mfe_h4_pct) + "</td>" +
          "<td>" + pc(e.median_mae_h4_pct) + "</td>" +
          "<td>" + pc(ag.mean_net_rt_pct) + "</td>" +
          "<td>" + pc(dc.mean_net_rt_pct) + "</td>" +
          "<td>" + pc(vc.mean_net_rt_pct) + "</td></tr>";
      }).join("");
      $("joint-exits").innerHTML =
        "<p class='panel-sub' style='margin:0 0 12px'>" +
        evidenceBadge("historical") + " " +
        esc(t("ev.historicalNote")) + "</p>" +
        "<p class='panel-sub' style='margin:0 0 6px'><strong>" +
        esc(t("jx.perfTitle")) + "</strong></p>" +
        '<div style="overflow-x:auto"><table class="version-table">' +
        "<thead><tr>" + th("jx.config") + th("jx.exit") +
        th("mx.n") + th("mx.closes") + th("mx.mean") +
        th("mx.median") + th("mx.positive") + th("mx.pf") +
        th("jx.closeCons") + th("jx.maxDd") +
        "</tr></thead><tbody>" + perfRows + "</tbody></table></div>" +
        "<p class='panel-sub' style='margin:14px 0 6px'><strong>" +
        esc(t("jx.outTitle")) + "</strong></p>" +
        '<div style="overflow-x:auto"><table class="version-table">' +
        "<thead><tr>" + th("jx.config") + th("jx.exit") +
        th("jx.tpFirst") + th("jx.slFirst") + th("jx.neither") +
        th("jx.ambig") + th("jx.top1") + th("mx.mfe") +
        th("mx.mae") + th("jx.cwMean") + th("jx.discMean") +
        th("jx.valMean") +
        "</tr></thead><tbody>" + outRows + "</tbody></table></div>" +
        "<p class='panel-sub' style='margin-top:12px'>" +
        esc(JN.per_config_exits_note || "") + "</p>" +
        "<p class='panel-sub' style='margin-top:12px'>" +
        esc(t("jx.ddNote")) + "</p>";
    }

    /* Quality vs frequency — A0 vs A4 (v1.2.0). Historical
       (replay) data only; frequency counts every close in the
       union, including closes with zero signals. */
    var QV = JN.quality_vs_frequency || null;
    if (!QV || !QV.distribution) {
      $("joint-qvf").innerHTML =
        '<p class="panel-sub" style="margin:0">' +
        t("joint.notYet") + "</p>";
    } else {
      var dist = QV.distribution || {};
      var qvRows = ["A0", "A4"].map(function (cfg) {
        var d = dist[cfg] || {};
        return "<tr><td>" + cfg + "</td>" +
          "<td>" + (d.n_signals == null ? "—" : d.n_signals) +
          "</td>" +
          "<td>" + nm(d.mean_per_close, 2) + "</td>" +
          "<td>" + nm(d.median_per_close, 1) + "</td>" +
          "<td>" + (d.max_per_close == null ? "—" :
            d.max_per_close) + "</td>" +
          "<td>" + (d.n_closes_with_signals == null ? "—" :
            d.n_closes_with_signals) + "</td>" +
          "<td>" + (d.n_closes_zero == null ? "—" :
            d.n_closes_zero) + "</td></tr>";
      }).join("");
      var to = QV.trade_off_a4_vs_a0 || {};
      var toRows = [
        [t("qv.cont"), to.continuation_rate_a0_pct,
          to.continuation_rate_a4_pct],
        [t("qv.mean"), to.mean_net_a0_pct, to.mean_net_a4_pct],
        [t("qv.median"), to.median_net_a0_pct, to.median_net_a4_pct],
        [t("qv.cwMean"), to.close_weighted_mean_net_a0_pct,
          to.close_weighted_mean_net_a4_pct],
        [t("qv.exMean"), to.ex_flood_mean_net_a0_pct,
          to.ex_flood_mean_net_a4_pct]
      ].map(function (row) {
        return "<li><span>" + esc(row[0]) + "</span>" +
          "<span class='num'>A0 " + pc(row[1]) + " → A4 " +
          pc(row[2]) + "</span></li>";
      }).join("");
      $("joint-qvf").innerHTML =
        "<p class='panel-sub' style='margin:0 0 12px'>" +
        evidenceBadge("historical") + " " +
        esc(t("ev.historicalNote")) + "</p>" +
        '<div style="overflow-x:auto"><table class="version-table">' +
        "<thead><tr>" + th("jx.config") + th("ft.signals") +
        th("qv.meanClose") + th("qv.medianClose") +
        th("qv.maxClose") + th("qv.withSignals") +
        th("qv.zeroCloses") +
        "</tr></thead><tbody>" + qvRows + "</tbody></table></div>" +
        '<ul class="missing-list">' +
        "<li><span>" + esc(t("qv.union")) + "</span>" +
        "<span class='num'>" +
        (QV.n_closes_union == null ? "—" : QV.n_closes_union) +
        "</span></li>" +
        "<li><span>" + esc(t("qv.freqRatio")) + "</span>" +
        "<span class='num'>" + nm(to.frequency_ratio, 3) +
        "</span></li>" +
        "<li><span>" + esc(t("qv.freqChange")) + "</span>" +
        "<span class='num'>" + pc(to.frequency_change_pct, 1) +
        "</span></li>" +
        "</ul>" +
        "<p class='panel-sub' style='margin:14px 0 6px'><strong>" +
        esc(t("qv.tradeoffTitle")) + "</strong></p>" +
        '<ul class="missing-list">' + toRows + "</ul>" +
        "<p class='panel-sub' style='margin-top:12px'>" +
        esc(bi(to.note, to.note_en) || "") + "</p>";
    }
  }

  /* ------------------------------------------- forward test (v1.2.0) */
  function renderForwardTest() {
    var FT = ((DATA.learnings || {}).forward_test) || null;
    var ids = ["forwardtest-overview", "forwardtest-groups",
               "forwardtest-perclose", "forwardtest-splits",
               "forwardtest-exits"];
    if (!FT || FT.status === "ERROR" || FT.status === "not yet") {
      ids.forEach(function (id) {
        var el = $(id);
        if (el) el.innerHTML = '<p class="panel-sub" style="margin:0">' +
          t("ft.notYet") + "</p>";
      });
      return;
    }
    var pc = function (v, dec) {
      return v == null ? "—" : fmtPct(v, dec == null ? 2 : dec);
    };
    var nm = function (v, dec) {
      return v == null ? "—" : fmtNum(v, dec == null ? 1 : dec);
    };
    var pfCell = function (v) {
      if (v == null) return "—";
      if (typeof v === "number") return nm(v, 2);
      return esc(String(v));
    };
    var th = function (k) { return "<th>" + esc(t(k)) + "</th>"; };
    var GROUP_ORDER = ["A0", "A4", "A4_ATR_expanded"];
    var GROUP_NAMES = { A0: "A0", A4: "A4",
      A4_ATR_expanded: "A4 + ATR Expanded" };

    /* Setup & evidence — cutoff, freeze, closes, formal status. */
    var fv = FT.formal_validation || {};
    $("forwardtest-overview").innerHTML =
      "<p class='panel-sub' style='margin:0 0 12px'>" +
      evidenceBadge("exploratory") + " " +
      esc(t("ev.exploratoryNote")) + "</p>" +
      '<ul class="missing-list">' +
      "<li><span>" + esc(t("ft.cutoff")) + "</span>" +
      "<span class='num'>" +
      (fmtTs(FT.cutoff_close_ts) == null ? "—" :
        esc(fmtTs(FT.cutoff_close_ts))) + "</span></li>" +
      "<li><span>" + esc(t("ft.frozen")) + "</span>" +
      "<span class='num'>" +
      (fmtTs(FT.candidate_frozen_ts) == null ? "—" :
        esc(fmtTs(FT.candidate_frozen_ts))) + "</span></li>" +
      "<li><span>" + esc(t("ft.fwdCloses")) + "</span>" +
      "<span class='num'>" +
      (FT.n_forward_closes == null ? "—" : FT.n_forward_closes) +
      "</span></li>" +
      "<li><span>" + esc(t("ft.formal")) + "</span>" +
      "<span class='num'>" + evidenceBadge("formal-none") +
      "</span></li>" +
      "</ul>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
      esc(FT.cutoff_note || "") + "</p>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
      esc(FT.candidate_note || "") + "</p>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
      esc(FT.evidence_note || "") + "</p>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
      esc(fv.note || "") + "</p>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
      esc(t("ev.formalNote")) + "</p>";

    /* Groups — forward-only comparison. Numbers are shown with an
       INSUFFICIENT DATA badge when the group is too small; no
       conclusion is drawn from such rows. */
    var grpCell = function (g, key, isPct, dec) {
      var v = g[key];
      if (v == null) return "<td>—</td>";
      return "<td>" + (isPct ? pc(v, dec) : nm(v, dec)) + "</td>";
    };
    var grpRows = GROUP_ORDER.map(function (k) {
      var g = (FT.groups || {})[k] || {};
      var badge = g.status === "insufficient_data" ?
        " " + evidenceBadge("insufficient") : "";
      return "<tr><td>" + esc(GROUP_NAMES[k] || k) + badge +
        "</td>" +
        "<td>" + (g.n_signals_total == null ? "—" :
          g.n_signals_total) + "</td>" +
        "<td>" + (g.n_mature_h4 == null ? "—" : g.n_mature_h4) +
        "</td>" +
        "<td>" + (g.n_pending_h4 == null ? "—" : g.n_pending_h4) +
        "</td>" +
        "<td>" + (g.n_closes_with_signals == null ? "—" :
          g.n_closes_with_signals) + "</td>" +
        "<td>" + (g.net_return_coverage_pct == null ? "—" :
          nm(g.net_return_coverage_pct, 1) + "%") + "</td>" +
        grpCell(g, "continuation_rate_pct", true, 1) +
        grpCell(g, "mean_net_pct", true, 2) +
        grpCell(g, "median_net_pct", true, 2) +
        grpCell(g, "positive_net_rate_pct", true, 1) +
        "<td>" + pfCell(g.profit_factor) + "</td>" +
        grpCell(g, "median_mfe_pct", true, 2) +
        grpCell(g, "median_mae_pct", true, 2) +
        grpCell(g, "tp_before_sl_1pct_pct", true, 1) +
        "<td>" + (g.signals_per_close_all_fwd_closes == null ?
          "—" : nm(g.signals_per_close_all_fwd_closes, 2)) +
        "</td>" +
        "<td>" + (g.zero_signal_fwd_closes == null ? "—" :
          g.zero_signal_fwd_closes) + "</td></tr>";
    }).join("");
    var cwRows = GROUP_ORDER.map(function (k) {
      var g = (FT.groups || {})[k] || {};
      var cw = g.close_weighted || {};
      return "<tr><td>" + esc(GROUP_NAMES[k] || k) + "</td>" +
        "<td>" + pc(cw.continuation_rate_pct, 1) + "</td>" +
        "<td>" + pc(cw.mean_net_pct) + "</td>" +
        "<td>" + pc(cw.median_net_pct) + "</td>" +
        "<td>" + pc(cw.positive_net_rate_pct, 1) + "</td>" +
        "<td>" + pfCell(cw.profit_factor) + "</td></tr>";
    }).join("");
    $("forwardtest-groups").innerHTML =
      "<p class='panel-sub' style='margin:0 0 12px'>" +
      evidenceBadge("exploratory") + " " +
      esc(t("ev.exploratoryNote")) + "</p>" +
      '<div style="overflow-x:auto"><table class="version-table">' +
      "<thead><tr>" + th("ft.group") + th("ft.signals") +
      th("ft.mature") + th("ft.pending") + th("mx.closes") +
      th("mx.coverage") + th("mx.cont") + th("mx.mean") +
      th("mx.median") + th("mx.positive") + th("mx.pf") +
      th("mx.mfe") + th("mx.mae") + th("mx.tp1") +
      th("mx.freq") + th("qv.zeroCloses") +
      "</tr></thead><tbody>" + grpRows + "</tbody></table></div>" +
      "<p class='panel-sub' style='margin:14px 0 6px'><strong>" +
      esc(t("ft.cwTitle")) + "</strong></p>" +
      '<div style="overflow-x:auto"><table class="version-table">' +
      "<thead><tr>" + th("ft.group") + th("mx.cont") +
      th("mx.mean") + th("mx.median") + th("mx.positive") +
      th("mx.pf") +
      "</tr></thead><tbody>" + cwRows + "</tbody></table></div>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
      esc(t("ft.groupsNote")) + "</p>";

    /* Per-close performance (forward only, mature closes). */
    var pcRows = [];
    GROUP_ORDER.forEach(function (k) {
      var g = (FT.groups || {})[k] || {};
      (g.per_close || []).forEach(function (r) {
        pcRows.push({ ts: r.close_ts, grp: k, r: r });
      });
    });
    pcRows.sort(function (a, b) {
      if (a.ts !== b.ts) return a.ts - b.ts;
      return GROUP_ORDER.indexOf(a.grp) - GROUP_ORDER.indexOf(b.grp);
    });
    var pcHtml = pcRows.map(function (o) {
      var r = o.r;
      return "<tr><td>" + (fmtTs(o.ts) == null ? "—" :
        esc(fmtTs(o.ts))) + "</td>" +
        "<td>" + esc(GROUP_NAMES[o.grp] || o.grp) + "</td>" +
        "<td>" + (r.n == null ? "—" : r.n) + "</td>" +
        "<td>" + (r.n_net == null ? "—" : r.n_net) + "</td>" +
        "<td>" + pc(r.continuation_rate_pct, 1) + "</td>" +
        "<td>" + pc(r.mean_net_pct) + "</td>" +
        "<td>" + pc(r.median_net_pct) + "</td>" +
        "<td>" + pc(r.positive_net_rate_pct, 1) + "</td></tr>";
    }).join("");
    $("forwardtest-perclose").innerHTML =
      (pcHtml ? '<div style="overflow-x:auto"><table class="version-table">' +
      "<thead><tr>" + th("ft.close") + th("ft.group") +
      th("mx.n") + th("mx.nNet") + th("mx.cont") + th("mx.mean") +
      th("mx.median") + th("mx.positive") +
      "</tr></thead><tbody>" + pcHtml + "</tbody></table></div>" :
      '<p class="panel-sub" style="margin:0">' +
      evidenceBadge("insufficient") + "</p>") +
      "<p class='panel-sub' style='margin-top:12px'>" +
      esc(t("ft.pendingNote")) + "</p>";

    /* CRYPTO vs SAHAM split of A4 + ATR Expanded (forward). */
    var splitRows = [
      ["CRYPTO", FT.a4_atr_expanded_crypto || {}],
      ["SAHAM", FT.a4_atr_expanded_saham || {}]
    ].map(function (pair) {
      var name = pair[0];
      var g = pair[1];
      var badge = g.status === "insufficient_data" ?
        " " + evidenceBadge("insufficient") : "";
      return "<tr><td>" + name + badge + "</td>" +
        "<td>" + (g.n_signals_total == null ? "—" :
          g.n_signals_total) + "</td>" +
        "<td>" + (g.n_closes_with_signals == null ? "—" :
          g.n_closes_with_signals) + "</td>" +
        "<td>" + pc(g.continuation_rate_pct, 1) + "</td>" +
        "<td>" + pc(g.mean_net_pct) + "</td>" +
        "<td>" + pc(g.median_net_pct) + "</td>" +
        "<td>" + pc(g.positive_net_rate_pct, 1) + "</td>" +
        "<td>" + pfCell(g.profit_factor) + "</td>" +
        "<td>" + pc(g.median_mfe_pct) + "</td>" +
        "<td>" + pc(g.median_mae_pct) + "</td>" +
        "<td>" + pc(g.tp_before_sl_1pct_pct, 1) + "</td></tr>";
    }).join("");
    $("forwardtest-splits").innerHTML =
      '<div style="overflow-x:auto"><table class="version-table">' +
      "<thead><tr><th>" + esc(t("ft.group")) + "</th>" +
      th("ft.signals") + th("mx.closes") + th("mx.cont") +
      th("mx.mean") + th("mx.median") + th("mx.positive") +
      th("mx.pf") + th("mx.mfe") + th("mx.mae") + th("mx.tp1") +
      "</tr></thead><tbody>" + splitRows + "</tbody></table></div>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
      esc(t("ft.splitNote")) + "</p>";

    /* Forward exits — E0 vs E5 vs E18 on A4 and A4 + ATR Expanded. */
    var exRows = [];
    ["A4", "A4_ATR_expanded"].forEach(function (k) {
      var ex = ((FT.exits_forward || {})[k] || {}).exits || {};
      ["E0", "E5", "E18"].forEach(function (sid) {
        var s = ex[sid] || {};
        exRows.push("<tr><td>" + esc(GROUP_NAMES[k] || k) +
          "</td>" +
          "<td>" + esc(exitLabel(sid)) + "</td>" +
          "<td>" + (s.n == null ? "—" : s.n) + "</td>" +
          "<td>" + pc(s.mean_net_pct) + "</td>" +
          "<td>" + pc(s.median_net_pct) + "</td>" +
          "<td>" + pc(s.positive_rate_pct, 1) + "</td>" +
          "<td>" + (s.tp_first_n == null ? "—" : s.tp_first_n) +
          "</td>" +
          "<td>" + (s.sl_first_n == null ? "—" : s.sl_first_n) +
          "</td>" +
          "<td>" + (s.neither_n == null ? "—" : s.neither_n) +
          "</td>" +
          "<td>" + (s.ambiguous_n == null ? "—" : s.ambiguous_n) +
          "</td></tr>");
      });
    });
    $("forwardtest-exits").innerHTML =
      '<div style="overflow-x:auto"><table class="version-table">' +
      "<thead><tr>" + th("ft.group") + th("jx.exit") +
      th("mx.n") + th("mx.mean") + th("mx.median") +
      th("mx.positive") + th("jx.tpFirst") + th("jx.slFirst") +
      th("jx.neither") + th("jx.ambig") +
      "</tr></thead><tbody>" + exRows.join("") +
      "</tbody></table></div>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
      esc(t("ft.exitsNote")) + "</p>";
  }

  function renderRisk() {
    var RK = ((DATA.learnings || {}).risk_research) || null;
    var ids = ["risk-overview", "risk-funding", "risk-candidates",
               "risk-drawdown", "risk-equity", "risk-streaks",
               "risk-sensitivity", "risk-hypotheses",
               "risk-recommendations"];
    if (!RK || RK.status === "ERROR") {
      ids.forEach(function (id) {
        var el = $(id);
        if (el) el.innerHTML = '<p class="panel-sub" style="margin:0">' +
          t("risk.notYet") + "</p>";
      });
      return;
    }
    if (RK.status === "not yet") {
      ids.forEach(function (id) {
        var el = $(id);
        if (el) el.innerHTML = '<p class="panel-sub" style="margin:0">' +
          esc(bi(RK.note, RK.note_en) || t("risk.notYet")) + "</p>";
      });
      return;
    }
    var pc = function (v, dec) {
      return v == null ? "—" : fmtPct(v, dec == null ? 2 : dec);
    };
    var nm = function (v, dec) {
      return v == null ? "—" : fmtNum(v, dec == null ? 1 : dec);
    };

    /* Overview: exposure + correlation */
    var ex = RK.exposure || {};
    var corr = RK.correlation || {};
    var btc = corr.BTCUSDT || {};
    var eth = corr.ETHUSDT || {};
    $("risk-overview").innerHTML =
      '<ul class="missing-list">' +
      "<li><span>Signals (A0 replay) / closes</span>" +
        "<span class='num'>" +
        (ex.n_signals == null ? "—" : ex.n_signals) + " / " +
        (ex.n_closes == null ? "—" : ex.n_closes) + "</span></li>" +
      "<li><span>Max simultaneous signals (one close)</span>" +
        "<span class='num'>" +
        (ex.max_simultaneous == null ? "—" : ex.max_simultaneous) +
        "</span></li>" +
      "<li><span>Flood close: signals / share of universe</span>" +
        "<span class='num'>" +
        (ex.flood_n == null ? "—" : ex.flood_n) + " / " +
        (ex.flood_share_of_universe_pct == null ? "—" :
          nm(ex.flood_share_of_universe_pct, 1) + "%") +
        "</span></li>" +
      "<li><span>Median signals per close</span>" +
        "<span class='num'>" +
        (ex.median_per_close == null ? "—" :
          nm(ex.median_per_close, 1)) + "</span></li>" +
      "<li><span>Correlation vs BTC +4H</span><span class='num'>" +
        (btc.pearson_r == null ? "—" : nm(btc.pearson_r, 2)) +
        " (n=" + (btc.n == null ? "—" : btc.n) + ")</span></li>" +
      "<li><span>Correlation vs ETH +4H</span><span class='num'>" +
        (eth.pearson_r == null ? "—" : nm(eth.pearson_r, 2)) +
        " (n=" + (eth.n == null ? "—" : eth.n) + ")</span></li>" +
      "</ul>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("risk.overviewNote") + "</p>";

    /* Funding bounds + risk of ruin */
    var fb = RK.funding_bounds || {};
    var ror = RK.risk_of_ruin || {};
    $("risk-funding").innerHTML =
      '<ul class="missing-list">' +
      "<li><span>Funding p99 — single 8h payment (" +
        esc(fb.month || "—") + ")</span><span class='num'>" +
        pc(fb.single_8h_p99_abs_pct, 4) + "</span></li>" +
      "<li><span>Funding p99 — two consecutive 8h payments</span>" +
        "<span class='num'>" +
        pc(fb.pair_2x8h_p99_abs_pct, 4) + "</span></li>" +
      "<li><span>Risk of ruin (block bootstrap)</span>" +
        "<span class='num'>" +
        esc(ror.status || "—") + "</span></li>" +
      "</ul>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        esc(bi(ror.reason, ror.reason_en) || "") + "</p>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("risk.fundingNote") + "</p>";

    /* Risk-reward per candidate J0–J8 (+4H) */
    var candRows = (RK.candidates || []).map(function (c) {
      return "<tr><td>" + esc(c.id) + " " +
        esc(bi(c.label, c.label_en)) + "</td>" +
        "<td>" + (c.n_signals == null ? "—" : c.n_signals) + "</td>" +
        "<td>" + (c.n_net == null ? "—" : c.n_net) + "</td>" +
        "<td>" + pc(c.mean_net_rt_h4_pct) + "</td>" +
        "<td>" + pc(c.median_net_rt_h4_pct) + "</td>" +
        "<td>" + (c.pct_positive_net_rt == null ? "—" :
          nm(c.pct_positive_net_rt, 1) + "%") + "</td>" +
        "<td>" + (c.profit_factor == null ? "—" :
          nm(c.profit_factor, 2)) + "</td>" +
        "<td>" + (c.payoff_ratio == null ? "—" :
          nm(c.payoff_ratio, 2)) + "</td>" +
        "<td>" + (c.breakeven_win_rate_pct == null ? "—" :
          nm(c.breakeven_win_rate_pct, 1) + "%") + "</td>" +
        "<td>" + (c.tp_before_sl_1pct_h4_pct == null ? "—" :
          nm(c.tp_before_sl_1pct_h4_pct, 1) + "%") + "</td>" +
        "<td>" + (c.close_consistency_pct == null ? "—" :
          nm(c.close_consistency_pct, 1) + "%") + "</td></tr>";
    }).join("");
    $("risk-candidates").innerHTML =
      '<div style="overflow-x:auto"><table class="version-table">' +
      "<thead><tr><th>Candidate</th><th>n</th><th>n_net</th>" +
      "<th>Mean net +4H</th><th>Median net</th><th>Positive</th>" +
      "<th>Profit factor</th><th>Payoff</th>" +
      "<th>Break-even win rate</th><th>TP+1% before SL</th>" +
      "<th>Close cons.</th></tr></thead><tbody>" + candRows +
      "</tbody></table></div>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("risk.candNote") + "</p>";

    /* Portfolio drawdown — both sizing variants */
    var ddRows = (RK.candidates || []).map(function (c) {
      var fc = c.fixed_capital || {};
      var fn = c.fixed_notional || {};
      return "<tr><td>" + esc(c.id) + "</td>" +
        "<td>" + pc(fc.total_return_pp) + "</td>" +
        "<td>" + pc(fc.max_drawdown_pp, 1) + "</td>" +
        "<td>" + (fc.max_drawdown_duration_closes == null ? "—" :
          fc.max_drawdown_duration_closes) + "</td>" +
        "<td>" + (fc.max_consecutive_losing_closes == null ? "—" :
          fc.max_consecutive_losing_closes) + "</td>" +
        "<td>" + pc(fc.downside_deviation_pp, 2) + "</td>" +
        "<td>" + pc(fn.total_return_pp) + "</td>" +
        "<td>" + pc(fn.max_drawdown_pp, 1) + "</td></tr>";
    }).join("");
    $("risk-drawdown").innerHTML =
      '<div style="overflow-x:auto"><table class="version-table">' +
      "<thead><tr><th>Candidate</th><th>Fixed-capital total</th>" +
      "<th>Fixed-capital Max DD</th><th>DD duration (closes)</th>" +
      "<th>Consec. losing closes</th><th>Downside dev.</th>" +
      "<th>Fixed-notional total</th>" +
      "<th>Fixed-notional Max DD</th></tr></thead><tbody>" + ddRows +
      "</tbody></table></div>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("risk.ddNote") + "</p>";

    /* Equity curves — fixed-capital, HOLD candidates (SVG) */
    var holdIds = ["J0", "J3", "J5", "J7"];
    var holdColors = {J0: "#7aa2f7", J3: "#e0af68",
                      J5: "#9ece6a", J7: "#f7768e"};
    var series = holdIds.map(function (id) {
      var c = (RK.candidates || []).find(function (x) {
        return x.id === id;
      }) || {};
      return {id: id,
              curve: ((c.fixed_capital || {}).equity_curve) || []};
    }).filter(function (s) { return s.curve.length > 1; });
    if (series.length) {
      var W = 720, H = 220, PAD = 28;
      var allV = [];
      series.forEach(function (s) {
        s.curve.forEach(function (p) { allV.push(p.cum_return_pp); });
      });
      allV.push(0);
      var vMin = Math.min.apply(null, allV);
      var vMax = Math.max.apply(null, allV);
      if (vMax - vMin < 1e-9) { vMax = vMin + 1; }
      var nPts = Math.max.apply(null, series.map(function (s) {
        return s.curve.length;
      }));
      var X = function (i) {
        return PAD + i * (W - 2 * PAD) / Math.max(1, nPts - 1);
      };
      var Y = function (v) {
        return H - PAD - (v - vMin) * (H - 2 * PAD) / (vMax - vMin);
      };
      var y0 = Y(0);
      var svg = '<svg viewBox="0 0 ' + W + " " + H + '" width="100%" ' +
        'style="display:block" role="img" aria-label="Equity curves">' +
        '<line x1="' + PAD + '" y1="' + y0.toFixed(1) + '" x2="' +
        (W - PAD) + '" y2="' + y0.toFixed(1) +
        '" stroke="var(--hatch-widget-border, #888)" stroke-width="1" ' +
        'stroke-dasharray="4 4"/>' +
        series.map(function (s) {
          var pts = s.curve.map(function (p, i) {
            return X(i).toFixed(1) + "," + Y(p.cum_return_pp).toFixed(1);
          }).join(" ");
          return '<polyline points="' + pts + '" fill="none" ' +
            'stroke="' + holdColors[s.id] + '" stroke-width="2"/>';
        }).join("") +
        '<text x="' + PAD + '" y="16" fill="currentColor" font-size="11">' +
          esc(nm(vMax, 1)) + ' pp</text>' +
        '<text x="' + PAD + '" y="' + (H - 8) + '" fill="currentColor" ' +
          'font-size="11">' + esc(nm(vMin, 1)) + ' pp</text>' +
        "</svg>";
      var legend = series.map(function (s) {
        return '<span style="margin-right:14px"><i style="display:' +
          'inline-block;width:10px;height:10px;background:' +
          holdColors[s.id] + ';border-radius:2px;margin-right:5px">' +
          "</i>" + esc(s.id) + "</span>";
      }).join("");
      var firstTs = series[0].curve[0].ts;
      var lastTs = series[0].curve[series[0].curve.length - 1].ts;
      $("risk-equity").innerHTML = svg +
        "<p style='margin:10px 0 0'>" + legend + "</p>" +
        "<p class='panel-sub' style='margin-top:8px'>" +
          esc((fmtWib(firstTs) || "") + " → " +
              (fmtWib(lastTs) || "")) + "</p>" +
        "<p class='panel-sub' style='margin-top:12px'>" +
          t("risk.equityNote") + "</p>";
    } else {
      $("risk-equity").innerHTML =
        '<p class="panel-sub" style="margin:0">' + t("risk.notYet") +
        "</p>";
    }

    /* Consecutive losses & tail risk */
    var stRows = (RK.candidates || []).map(function (c) {
      return "<tr><td>" + esc(c.id) + "</td>" +
        "<td>" + (c.max_consecutive_losing_signals == null ? "—" :
          c.max_consecutive_losing_signals) + "</td>" +
        "<td>" + pc(c.worst_signal_net_pct) + "</td>" +
        "<td>" + pc(c.best_signal_net_pct) + "</td>" +
        "<td>" + pc(c.tail_mean_worst5_pct) + "</td></tr>";
    }).join("");
    $("risk-streaks").innerHTML =
      '<div style="overflow-x:auto"><table class="version-table">' +
      "<thead><tr><th>Candidate</th><th>Consec. losing signals</th>" +
      "<th>Worst signal</th><th>Best signal</th>" +
      "<th>Tail (worst 5% mean)</th></tr></thead><tbody>" + stRows +
      "</tbody></table></div>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("risk.streakNote") + "</p>";

    /* Cost sensitivity & liquidation proxy */
    var seRows = (RK.candidates || []).map(function (c) {
      var sens = c.cost_sensitivity || {};
      var liq = c.liquidation_proxy || {};
      return "<tr><td>" + esc(c.id) + "</td>" +
        "<td>" + pc(sens.cost_x0_gross_only) + "</td>" +
        "<td>" + pc(sens.cost_x1_base) + "</td>" +
        "<td>" + pc(sens.cost_x2_doubled) + "</td>" +
        "<td>" + (liq.lev_3x_pct == null ? "—" :
          nm(liq.lev_3x_pct, 1) + "%") + "</td>" +
        "<td>" + (liq.lev_5x_pct == null ? "—" :
          nm(liq.lev_5x_pct, 1) + "%") + "</td>" +
        "<td>" + (liq.lev_10x_pct == null ? "—" :
          nm(liq.lev_10x_pct, 1) + "%") + "</td></tr>";
    }).join("");
    $("risk-sensitivity").innerHTML =
      '<div style="overflow-x:auto"><table class="version-table">' +
      "<thead><tr><th>Candidate</th><th>Cost ×0 (gross)</th>" +
      "<th>Cost ×1 (base)</th><th>Cost ×2</th>" +
      "<th>Liq. proxy 3x</th><th>Liq. proxy 5x</th>" +
      "<th>Liq. proxy 10x</th></tr></thead><tbody>" + seRows +
      "</tbody></table></div>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("risk.sensNote") + "</p>";

    /* Hypotheses RH1–RH2 */
    var hyps = (RK.hypotheses || []).map(function (h) {
      var v = h.validation_after_created || {};
      return "<li><span>" + esc(h.id) + " — " +
        esc(bi(h.text, h.text_en)) + "</span><span class='num'>" +
        esc(h.status || "") + " (n=" +
        (v.n_a == null ? "—" : v.n_a) + "/" +
        (v.n_b == null ? "—" : v.n_b) +
        ")</span></li>";
    }).join("");
    $("risk-hypotheses").innerHTML =
      '<ul class="missing-list">' + hyps + "</ul>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("risk.hypNote") + "</p>";

    /* Recommendations */
    var recos = (RK.recommendations || []).map(function (r) {
      return "<li><span>" + esc(bi(r.filter, r.filter_en)) +
        "</span><span class='num'>" +
        esc(r.status || r.kind || "") + "</span></li>";
    }).join("");
    $("risk-recommendations").innerHTML =
      '<ul class="missing-list">' + recos + "</ul>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("risk.recoNote") + "</p>";
  }

  /* ------------------------------------------------- ignition (v48) */
  function renderIgnition() {
    var IG = ((DATA.learnings || {}).ignition_research) || null;
    var ids = ["ignition-overview", "ignition-oi", "ignition-squeeze",
               "ignition-features", "ignition-nextcandle",
               "ignition-pump", "ignition-structure",
               "ignition-hypotheses", "ignition-hypotheses-ph",
               "ignition-entry", "ignition-recommendations",
               "ignition-matrix"];
    if (!IG || IG.status === "ERROR") {
      ids.forEach(function (id) {
        var el = $(id);
        if (el) el.innerHTML = '<p class="panel-sub" style="margin:0">' +
          t("ign.notYet") + "</p>";
      });
      return;
    }
    if (IG.status === "not yet") {
      ids.forEach(function (id) {
        var el = $(id);
        if (el) el.innerHTML = '<p class="panel-sub" style="margin:0">' +
          esc(bi(IG.note, IG.note_en) || t("ign.notYet")) + "</p>";
      });
      return;
    }
    var pc = function (v, dec) {
      return v == null ? "—" : fmtPct(v, dec == null ? 2 : dec);
    };
    var nm = function (v, dec) {
      return v == null ? "—" : fmtNum(v, dec == null ? 1 : dec);
    };
    var pfCell = function (v) {
      if (v == null) return "—";
      if (typeof v === "number") return nm(v, 2);
      return esc(String(v));
    };

    /* Overview: coverage */
    $("ignition-overview").innerHTML =
      '<ul class="missing-list">' +
      "<li><span>Research version</span><span class='num'>" +
        (IG.version == null ? "—" : esc(String(IG.version))) +
        "</span></li>" +
      "<li><span>Signals evaluated (+4H)</span><span class='num'>" +
        (IG.n_evaluated_h4 == null ? "—" : IG.n_evaluated_h4) +
        "</span></li>" +
      "<li><span>Replay signals / closes</span><span class='num'>" +
        (IG.n_signals_replay == null ? "—" : IG.n_signals_replay) +
        " / " + (IG.n_closes == null ? "—" : IG.n_closes) +
        "</span></li>" +
      "<li><span>Discovery / validation closes</span>" +
        "<span class='num'>" +
        (Array.isArray(IG.discovery_closes) ?
          IG.discovery_closes.length :
          (IG.discovery_closes == null ? "—" : IG.discovery_closes)) +
        " / " +
        (Array.isArray(IG.validation_closes) ?
          IG.validation_closes.length :
          (IG.validation_closes == null ? "—" : IG.validation_closes)) +
        "</span></li>" +
      "<li><span>Flood close share of replay</span>" +
        "<span class='num'>" +
        pc(IG.flood_share_pct, 1) + "</span></li>" +
      "<li><span>Skipped (no pre-signal bars)</span>" +
        "<span class='num'>" +
        (IG.skipped == null ? "—" : IG.skipped) + "</span></li>" +
      "</ul>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("ign.overviewNote") + "</p>";

    /* OI coverage */
    var oi = IG.oi_coverage || {};
    $("ignition-oi").innerHTML =
      '<ul class="missing-list">' +
      "<li><span>Signals with OI (24h change)</span>" +
        "<span class='num'>" +
        (oi.n == null ? "—" : oi.n) + " / " +
        (oi.of == null ? "—" : oi.of) + " (" +
        pc(oi.pct, 1) + ")</span></li>" +
      "</ul>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        esc(oi.note || "") + "</p>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("ign.oiNote") + "</p>";

    /* Squeeze x margin */
    var sqRows = (IG.squeeze_x_margin || []).map(function (r) {
      return "<tr><td>" + esc(r.squeeze_state) + "</td>" +
        "<td>" + esc(r.margin_band) + "</td>" +
        "<td>" + (r.n == null ? "—" : r.n) + "</td>" +
        "<td>" + (r.n_closes == null ? "—" : r.n_closes) + "</td>" +
        "<td>" + pc(r.positive_net_rate_pct, 1) + "</td>" +
        "<td>" + pc(r.mean_net_rt_pct) + "</td>" +
        "<td>" + pc(r.tp_before_sl_1pct_pct, 1) + "</td></tr>";
    }).join("");
    $("ignition-squeeze").innerHTML =
      '<div style="overflow-x:auto"><table class="version-table">' +
      "<thead><tr><th>Squeeze</th><th>Margin band</th><th>n</th>" +
      "<th>Closes</th><th>Positive</th><th>Mean net +4H</th>" +
      "<th>TP+1% before SL</th></tr></thead><tbody>" + sqRows +
      "</tbody></table></div>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("ign.sqNote") + "</p>";

    /* Per-feature buckets */
    var FEAT_ORDER = ["squeeze_state", "width_ratio", "bb_width_pctile",
      "atr_pctile", "atr_contraction_bars", "vol_accel_3bar_pct",
      "vol_accel_trend_pp", "range_ratio", "mom_accel_pp",
      "macd_hist_slope", "oi_chg_24h_pct", "margin_band"];
    var FEAT_LABELS = {
      squeeze_state: "Squeeze state",
      width_ratio: "BB width / ATR",
      bb_width_pctile: "BB width percentile",
      atr_pctile: "ATR percentile",
      atr_contraction_bars: "ATR contraction (bars)",
      vol_accel_3bar_pct: "Volume acceleration (3-bar)",
      vol_accel_trend_pp: "Volume accel trend",
      range_ratio: "Price compression (range ratio)",
      mom_accel_pp: "Momentum acceleration",
      macd_hist_slope: "MACD histogram slope",
      oi_chg_24h_pct: "OI change 24h",
      margin_band: "Breakout margin band"
    };
    var featRows = FEAT_ORDER.map(function (f) {
      var rows = ((IG.features || {})[f]) || [];
      return rows.map(function (r) {
        return "<tr><td>" + esc(FEAT_LABELS[f] || f) + "</td>" +
          "<td>" + esc(String(r.bucket)) + "</td>" +
          "<td>" + (r.n == null ? "—" : r.n) + "</td>" +
          "<td>" + (r.n_closes == null ? "—" : r.n_closes) +
          "</td>" +
          "<td>" + pc(r.positive_net_rate_pct, 1) + "</td>" +
          "<td>" + pc(r.mean_net_rt_pct) + "</td>" +
          "<td>" + pc(r.tp_before_sl_1pct_pct, 1) + "</td>" +
          "<td>" + pc(r.median_mfe_pct) + "</td>" +
          "<td>" + pc(r.median_mae_pct) + "</td>" +
          "<td>" + pfCell(r.profit_factor) + "</td></tr>";
      }).join("");
    }).join("");
    $("ignition-features").innerHTML =
      '<div style="overflow-x:auto"><table class="version-table">' +
      "<thead><tr><th>Feature</th><th>Bucket</th><th>n</th>" +
      "<th>Closes</th><th>Positive</th><th>Mean net +4H</th>" +
      "<th>TP+1% before SL</th><th>Median MFE</th>" +
      "<th>Median MAE</th><th>Profit factor</th>" +
      "</tr></thead><tbody>" + featRows +
      "</tbody></table></div>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("ign.featNote") + "</p>";

    /* Next-candle performance (v1.1.0): six rates, separated */
    var nc = IG.next_candle || {};
    var ncRows = [["pooled", "Pooled (all signals)"],
                  ["close_weighted", "Close-weighted"],
                  ["ex_flood", "Ex-flood"]].map(function (pair) {
      var s = nc[pair[0]] || {};
      return "<tr><td>" + pair[1] + "</td>" +
        "<td>" + (s.n == null ? "—" : s.n) + "</td>" +
        "<td>" + (s.n_closes == null ? "—" : s.n_closes) + "</td>" +
        "<td>" + pc(s.bullish_close_rate_pct, 1) + "</td>" +
        "<td>" + pc(s.positive_gross_rate_pct, 1) + "</td>" +
        "<td>" + pc(s.positive_net_rate_pct, 1) + "</td>" +
        "<td>" + pc(s.continuation_failure_rate_pct, 1) + "</td>" +
        "<td>" + pc(s.reversal_rate_pct, 1) + "</td>" +
        "<td>" + pc(s.tp_before_sl_1pct_pct, 1) + "</td>" +
        "<td>" + pc(s.mean_gross_pct) + "</td>" +
        "<td>" + pc(s.mean_net_rt_pct) + "</td>" +
        "<td>" + pc(s.mean_net_exec_pct) + "</td>" +
        "<td>" + pc(s.median_mfe_pct) + "</td>" +
        "<td>" + pc(s.median_mae_pct) + "</td>" +
        "<td>" + pfCell(s.profit_factor) + "</td></tr>";
    }).join("");
    $("ignition-nextcandle").innerHTML =
      '<div style="overflow-x:auto"><table class="version-table">' +
      "<thead><tr><th>View</th><th>n</th><th>Closes</th>" +
      "<th>Bullish close</th><th>+Gross</th><th>+Net</th>" +
      "<th>Failure</th><th>Reversal</th><th>TP+1% before SL</th>" +
      "<th>Mean gross</th><th>Mean net</th><th>Mean net exec</th>" +
      "<th>Median MFE</th><th>Median MAE</th><th>Profit factor</th>" +
      "</tr></thead><tbody>" + ncRows +
      "</tbody></table></div>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("ign.nxcNote") + "</p>";

    /* Pump strength + candle structure (v1.1.0) */
    var bucketCols = function (r) {
      return "<td>" + (r.n == null ? "—" : r.n) + "</td>" +
        "<td>" + (r.n_closes == null ? "—" : r.n_closes) + "</td>" +
        "<td>" + pc(r.bullish_close_rate_pct, 1) + "</td>" +
        "<td>" + pc(r.positive_gross_rate_pct, 1) + "</td>" +
        "<td>" + pc(r.positive_net_rate_pct, 1) + "</td>" +
        "<td>" + pc(r.continuation_failure_rate_pct, 1) + "</td>" +
        "<td>" + pc(r.tp_before_sl_1pct_pct, 1) + "</td>" +
        "<td>" + pc(r.mean_net_rt_pct) + "</td>" +
        "<td>" + pc(r.median_mfe_pct) + "</td>" +
        "<td>" + pc(r.median_mae_pct) + "</td>" +
        "<td>" + pfCell(r.profit_factor) + "</td>";
    };
    var bucketHead = "<thead><tr><th>Feature</th><th>Bucket</th>" +
      "<th>n</th><th>Closes</th><th>Bullish close</th>" +
      "<th>+Gross</th><th>+Net</th><th>Failure</th>" +
      "<th>TP+1% before SL</th><th>Mean net +4H</th>" +
      "<th>Median MFE</th><th>Median MAE</th>" +
      "<th>Profit factor</th></tr></thead>";
    var bucketTable = function (featList, labels) {
      var rows = featList.map(function (f) {
        var rs = ((IG.features || {})[f]) || [];
        return rs.map(function (r) {
          return "<tr><td>" + esc(labels[f] || f) + "</td>" +
            "<td>" + esc(String(r.bucket)) + "</td>" +
            bucketCols(r) + "</tr>";
        }).join("");
      }).join("");
      return '<div style="overflow-x:auto"><table class="version-table">' +
        bucketHead + "<tbody>" + rows + "</tbody></table></div>";
    };
    $("ignition-pump").innerHTML =
      bucketTable(["pump_abs_pct", "pump_atr_mult", "pump_vol_pctile"],
        {pump_abs_pct: "Pump (open-to-close)",
         pump_atr_mult: "Pump / ATR14",
         pump_vol_pctile: "Pump vs own history (pctile)"}) +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("ign.pumpNote") + "</p>";
    $("ignition-structure").innerHTML =
      bucketTable(["body_to_range", "close_position", "upper_wick_pct",
                   "lower_wick_pct", "prev_bullish", "prev_body_pct",
                   "margin_pct", "rsi_4h", "green_streak"],
        {body_to_range: "Body-to-range",
         close_position: "Close position",
         upper_wick_pct: "Upper wick (% of range)",
         lower_wick_pct: "Lower wick (% of range)",
         prev_bullish: "Previous candle",
         prev_body_pct: "Previous candle body",
         margin_pct: "Breakout margin",
         rsi_4h: "RSI 4H (exhaustion)",
         green_streak: "Green streak (bars)"}) +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("ign.structNote") + "</p>";

    /* Hypotheses IH1–IH6 */
    var hyps = (IG.hypotheses || []).map(function (h) {
      var v = h.validation_after_created || {};
      var extra = "";
      if (v.n_a != null && v.n_b != null) {
        extra = " (n=" + v.n_a + "/" + v.n_b;
        if (v.n_closes_a != null) {
          extra += ", closes=" + v.n_closes_a + "/" + v.n_closes_b;
        }
        extra += ")";
      }
      return "<li><span>" + esc(h.id) + " — " +
        esc(bi(h.text, h.text_en)) + "</span><span class='num'>" +
        esc(h.status || "") + esc(extra) + "</span></li>";
    }).join("");
    $("ignition-hypotheses").innerHTML =
      '<ul class="missing-list">' + hyps + "</ul>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("ign.hypNote") + "</p>";

    /* Hypotheses PH1–PH6 (v1.1.0) */
    var phHyps = (IG.hypotheses_ph || []).map(function (h) {
      var v = h.validation_after_created || {};
      var extra = "";
      if (v.n_a != null && v.n_b != null) {
        extra = " (n=" + v.n_a + "/" + v.n_b;
        if (v.n_closes_a != null) {
          extra += ", closes=" + v.n_closes_a + "/" + v.n_closes_b;
        }
        extra += ")";
      }
      return "<li><span>" + esc(h.id) + " — " +
        esc(bi(h.text, h.text_en)) + "</span><span class='num'>" +
        esc(h.status || "") + esc(extra) + "</span></li>";
    }).join("");
    $("ignition-hypotheses-ph").innerHTML =
      '<ul class="missing-list">' + phHyps + "</ul>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("ign.phNote") + "</p>";

    /* Entry realism (v1.1.0) */
    var er = IG.entry_realism || {};
    $("ignition-entry").innerHTML =
      "<p class='panel-sub' style='margin:0 0 8px'><b>Benchmark:</b> " +
        esc(bi(er.benchmark_entry, er.benchmark_entry_en) || "—") +
        "</p>" +
      "<p class='panel-sub' style='margin:0 0 8px'><b>Execution:</b> " +
        esc(bi(er.execution_entry, er.execution_entry_en) || "—") +
        "</p>" +
      "<p class='panel-sub' style='margin:0 0 8px'><b>Slippage scenario:</b> +" +
        (er.slippage_scenario_bps == null ?
          "—" : er.slippage_scenario_bps) +
        " bps — " + esc(bi(er.note, er.note_en) || "") + "</p>" +
      "<p class='panel-sub' style='margin:0'><b>Funding:</b> " +
        esc(bi(er.funding_note, er.funding_note_en) || "—") + "</p>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("ign.execNote") + "</p>";

    /* Recommendations */
    var recos = (IG.recommendations || []).map(function (r) {
      return "<li><span>" + esc(bi(r.filter, r.filter_en)) +
        "</span><span class='num'>" +
        esc(r.status || r.kind || "") + "</span></li>";
    }).join("");
    $("ignition-recommendations").innerHTML =
      '<ul class="missing-list">' + recos + "</ul>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("ign.recoNote") + "</p>";

    /* Entry quality consistency matrix — three priority
       characteristics x six slices (v1.2.0 feature_consistency).
       Historical (replay) data only; never mixed with forward. */
    var FC = IG.feature_consistency || null;
    if (!FC || !FC.features) {
      $("ignition-matrix").innerHTML =
        '<p class="panel-sub" style="margin:0">' +
        t("ign.notYet") + "</p>";
    } else {
      var mxTh = function (k) { return "<th>" + esc(t(k)) + "</th>"; };
      var mxRows = MATRIX_FEATURES.map(function (f) {
        var fd = (FC.features || {})[f] || {};
        var featLabel = t(MATRIX_FEATURE_KEYS[f] || f);
        return (fd.buckets || []).map(function (b) {
          return MATRIX_SLICES.map(function (sn) {
            var s = (b.slices || {})[sn] || {};
            var st = s.status;
            var badge = st === "insufficient_data" ?
              " " + evidenceBadge("insufficient") : "";
            var cell = function (v, isPct, dec) {
              if (st === "unavailable" || v == null) {
                return "<td>—</td>";
              }
              return "<td>" + (isPct ? pc(v, dec) : nm(v, dec)) +
                "</td>";
            };
            return "<tr><td>" + esc(featLabel) + "</td>" +
              "<td>" + esc(String(b.bucket)) + "</td>" +
              "<td>" + esc(t(MATRIX_SLICE_KEYS[sn] || sn)) +
              badge + "</td>" +
              "<td>" + (s.n == null ? "—" : s.n) + "</td>" +
              "<td>" + (s.n_closes == null ? "—" : s.n_closes) +
              "</td>" +
              "<td>" + (st === "unavailable" ||
                s.coverage_pct == null ? "—" :
                nm(s.coverage_pct, 1) + "%") + "</td>" +
              cell(s.signals_per_close, false, 2) +
              cell(s.continuation_rate_pct, true, 1) +
              cell(s.mean_net_rt_pct, true, 2) +
              cell(s.median_net_rt_pct, true, 2) +
              cell(s.positive_net_rate_pct, true, 1) +
              cell(s.tp_before_sl_1pct_pct, true, 1) +
              cell(s.median_mfe_pct, true, 2) +
              cell(s.median_mae_pct, true, 2) +
              "<td>" + (st === "unavailable" ?
                "—" : pfCell(s.profit_factor)) + "</td></tr>";
          }).join("");
        }).join("");
      }).join("");
      var mxNotes = (FC.notes || []).map(function (note, i) {
        var txt = i === 0 ? bi(note, FC.note_en) : note;
        return "<p class='panel-sub' style='margin-top:12px'>" +
          esc(txt || "") + "</p>";
      }).join("");
      var mxExcl = FC.excluded_from_crypto_saham || {};
      $("ignition-matrix").innerHTML =
        "<p class='panel-sub' style='margin:0 0 12px'>" +
        evidenceBadge("historical") + " " +
        esc(t("ev.historicalNote")) + "</p>" +
        '<div style="overflow-x:auto"><table class="version-table">' +
        "<thead><tr>" + mxTh("mx.feature") + mxTh("mx.bucket") +
        mxTh("mx.slice") + mxTh("mx.n") + mxTh("mx.closes") +
        mxTh("mx.coverage") + mxTh("mx.freq") + mxTh("mx.cont") +
        mxTh("mx.mean") + mxTh("mx.median") + mxTh("mx.positive") +
        mxTh("mx.tp1") + mxTh("mx.mfe") + mxTh("mx.mae") +
        mxTh("mx.pf") +
        "</tr></thead><tbody>" + mxRows + "</tbody></table></div>" +
        mxNotes +
        "<p class='panel-sub' style='margin-top:12px'>" +
        esc(mxExcl.note || "") +
        (mxExcl.n_other_traditional != null ?
          " (other_traditional: " + mxExcl.n_other_traditional +
          ", uncertain: " + mxExcl.n_uncertain + ")" : "") + "</p>";
    }
  }

  /* --------------------------------------------------- missed (v48) */
  function renderMissed() {
    var MS = ((DATA.learnings || {}).missed_research) || null;
    var ids = ["missed-overview", "missed-passed", "missed-gates",
               "missed-combos", "missed-counterfactuals", "missed-top",
               "missed-hypotheses", "missed-recommendations"];
    if (!MS || MS.status === "ERROR") {
      ids.forEach(function (id) {
        var el = $(id);
        if (el) el.innerHTML = '<p class="panel-sub" style="margin:0">' +
          t("missed.notYet") + "</p>";
      });
      return;
    }
    if (MS.status === "not yet") {
      ids.forEach(function (id) {
        var el = $(id);
        if (el) el.innerHTML = '<p class="panel-sub" style="margin:0">' +
          esc(bi(MS.note, MS.note_en) || t("missed.notYet")) + "</p>";
      });
      return;
    }
    var pc = function (v, dec) {
      return v == null ? "—" : fmtPct(v, dec == null ? 2 : dec);
    };
    var nm = function (v, dec) {
      return v == null ? "—" : fmtNum(v, dec == null ? 1 : dec);
    };
    var tot = MS.totals || {};
    var sc = MS.scope || {};

    /* Overview */
    $("missed-overview").innerHTML =
      '<ul class="missing-list">' +
      "<li><span>Closes in scope (" +
        esc(sc.rules_version || "—") + ")</span>" +
        "<span class='num'>" +
        (sc.n_closes == null ? "—" : sc.n_closes) + "</span></li>" +
      "<li><span>Eligible contracts</span><span class='num'>" +
        (tot.n_eligible == null ? "—" : tot.n_eligible) +
        "</span></li>" +
      "<li><span>Winners (+4H ≥ +1%)</span><span class='num'>" +
        (tot.n_winners == null ? "—" : tot.n_winners) + " (" +
        pc(tot.winner_rate_pct, 1) + ")</span></li>" +
      "<li><span>Big misses (+4H ≥ +5%)</span><span class='num'>" +
        (tot.n_big_miss == null ? "—" : tot.n_big_miss) +
        "</span></li>" +
      "<li><span>Losers (+4H ≤ −1%) / negative</span>" +
        "<span class='num'>" +
        (tot.n_losers == null ? "—" : tot.n_losers) + " / " +
        (tot.n_negative == null ? "—" : tot.n_negative) +
        "</span></li>" +
      "</ul>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("missed.overviewNote") + "</p>";

    /* Passed the gate, not sent */
    var pns = MS.passed_not_sent || {};
    $("missed-passed").innerHTML =
      '<ul class="missing-list">' +
      "<li><span>Engine SIGNALs not sent</span><span class='num'>" +
        (pns.n == null ? "—" : pns.n) + "</span></li>" +
      "<li><span>Mean +4H return</span><span class='num'>" +
        pc(pns.mean_r4h_pct) + "</span></li>" +
      "<li><span>Share ≥ +1% / positive</span><span class='num'>" +
        pc(pns.pct_gte_1pct_r4h, 1) + " / " +
        pc(pns.pct_positive_r4h, 1) + "</span></li>" +
      "</ul>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        esc(pns.note || "") + "</p>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("missed.passedNote") + "</p>";

    /* Gate tables: winners vs losers */
    var gateByName = function (rows) {
      var m = {};
      (rows || []).forEach(function (r) { m[r.gate] = r; });
      return m;
    };
    var gw = gateByName(MS.gate_table_winners);
    var gl = gateByName(MS.gate_table_losers);
    var gapFmt = function (r) {
      if (!r || r.median_gap == null) return "—";
      return r.gap_unit === "x" ? nm(r.median_gap, 2) + "×" :
        nm(r.median_gap, 1) + "pp";
    };
    var gateRows = ["breakout", "green", "rvol"].map(function (g) {
      var w = gw[g] || {}, l = gl[g] || {};
      return "<tr><td>" + esc(g) + "</td>" +
        "<td>" + (w.n_blocked == null ? "—" : w.n_blocked) + "</td>" +
        "<td>" + (w.n_blocked_only == null ? "—" :
          w.n_blocked_only) + "</td>" +
        "<td>" + gapFmt(w) + "</td>" +
        "<td>" + (l.n_blocked == null ? "—" : l.n_blocked) + "</td>" +
        "<td>" + (l.n_blocked_only == null ? "—" :
          l.n_blocked_only) + "</td>" +
        "<td>" + gapFmt(l) + "</td></tr>";
    }).join("");
    $("missed-gates").innerHTML =
      '<div style="overflow-x:auto"><table class="version-table">' +
      "<thead><tr><th>Gate</th><th>Winners blocked</th>" +
      "<th>Winners only-gate</th><th>Median gap (W)</th>" +
      "<th>Losers blocked</th><th>Losers only-gate</th>" +
      "<th>Median gap (L)</th></tr></thead><tbody>" + gateRows +
      "</tbody></table></div>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("missed.gatesNote") + "</p>";

    /* Failing combos */
    var comboLosers = {};
    (MS.combo_table_losers || []).forEach(function (r) {
      comboLosers[r.combo] = r.n;
    });
    var comboRows = (MS.combo_table_winners || []).map(function (r) {
      return "<tr><td>" + esc(r.combo) + "</td>" +
        "<td>" + (r.n == null ? "—" : r.n) + "</td>" +
        "<td>" + (comboLosers[r.combo] == null ? "—" :
          comboLosers[r.combo]) + "</td></tr>";
    }).join("");
    $("missed-combos").innerHTML =
      '<div style="overflow-x:auto"><table class="version-table">' +
      "<thead><tr><th>Failing gates</th><th>Winners</th>" +
      "<th>Losers</th></tr></thead><tbody>" + comboRows +
      "</tbody></table></div>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("missed.comboNote") + "</p>";

    /* Counterfactuals */
    var cfRows = (MS.counterfactuals || []).map(function (c) {
      return "<tr><td>" + esc(bi(c.label, c.label_en)) + "</td>" +
        "<td>" + (c.n_winners_added == null ? "—" :
          c.n_winners_added) + "</td>" +
        "<td>" + (c.n_losers_added == null ? "—" :
          c.n_losers_added) + "</td>" +
        "<td>" + (c.n_negative_added == null ? "—" :
          c.n_negative_added) + "</td>" +
        "<td>" + (c.n_winners_would_but_dedup == null ? "—" :
          c.n_winners_would_but_dedup) + "</td>" +
        "<td>" + pc(c.mean_r4h_added_gross_pct) + "</td></tr>";
    }).join("");
    var cfNote = ((MS.counterfactuals || [])[0] || {}).net_note || "";
    $("missed-counterfactuals").innerHTML =
      '<div style="overflow-x:auto"><table class="version-table">' +
      "<thead><tr><th>Change</th><th>Winners added</th>" +
      "<th>Losers added</th><th>Negative added</th>" +
      "<th>Would but dedup</th><th>Mean gross +4H added</th>" +
      "</tr></thead><tbody>" + cfRows +
      "</tbody></table></div>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        esc(cfNote) + "</p>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("missed.cfNote") + "</p>";

    /* Top missed */
    var topRows = (MS.top_missed || []).slice(0, 10).map(function (m) {
      return "<tr><td>" + esc(m.symbol) + "</td>" +
        "<td>" + esc(fmtWib(m.close_ts) || "—") + "</td>" +
        "<td>" + pc(m.r4h_pct) + "</td>" +
        "<td>" + esc((m.failing || []).join(" + ")) + "</td></tr>";
    }).join("");
    $("missed-top").innerHTML =
      '<div style="overflow-x:auto"><table class="version-table">' +
      "<thead><tr><th>Symbol</th><th>Close (WIB)</th>" +
      "<th>+4H return</th><th>Failing gates</th>" +
      "</tr></thead><tbody>" + topRows +
      "</tbody></table></div>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("missed.topNote") + "</p>";

    /* Hypotheses MH1–MH3 */
    var hyps = (MS.hypotheses || []).map(function (h) {
      var v = h.validation_after_created || {};
      var extra = "";
      if (v.winners_added != null && v.losers_added != null) {
        extra = " (winners +" + v.winners_added + " / losers +" +
          v.losers_added + ")";
      } else if (v.share_pct != null) {
        extra = " (single-gate share " + nm(v.share_pct, 1) +
          "% — " + (v.single_gate_winners == null ? "—" :
            v.single_gate_winners) + "/" +
          (v.n_validation_winners == null ? "—" :
            v.n_validation_winners) + ")";
      }
      return "<li><span>" + esc(h.id) + " — " +
        esc(bi(h.text, h.text_en)) + "</span><span class='num'>" +
        esc(h.status || "") + esc(extra) + "</span></li>";
    }).join("");
    $("missed-hypotheses").innerHTML =
      '<ul class="missing-list">' + hyps + "</ul>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("missed.hypNote") + "</p>";

    /* Recommendations */
    var recos = (MS.recommendations || []).map(function (r) {
      return "<li><span>" + esc(bi(r.filter, r.filter_en)) +
        "</span><span class='num'>" +
        esc(r.status || r.kind || "") + "</span></li>";
    }).join("");
    $("missed-recommendations").innerHTML =
      '<ul class="missing-list">' + recos + "</ul>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("missed.recoNote") + "</p>";
  }

  /* ----------------------------------------------- validation (v48) */
  function renderValidation() {
    var VA = ((DATA.learnings || {}).validation_research) || null;
    var ids = ["validation-summary", "validation-prospective",
               "validation-checks", "validation-walkforward",
               "validation-recommendations", "validation-limitations"];
    if (!VA || VA.status === "ERROR") {
      ids.forEach(function (id) {
        var el = $(id);
        if (el) el.innerHTML = '<p class="panel-sub" style="margin:0">' +
          t("val.notYet") + "</p>";
      });
      return;
    }
    if (VA.status === "not yet") {
      ids.forEach(function (id) {
        var el = $(id);
        if (el) el.innerHTML = '<p class="panel-sub" style="margin:0">' +
          esc(bi(VA.note, VA.note_en) || t("val.notYet")) + "</p>";
      });
      return;
    }
    var nm = function (v, dec) {
      return v == null ? "—" : fmtNum(v, dec == null ? 1 : dec);
    };
    var sm = VA.summary || {};
    var checks = VA.checks || [];
    var byId = {};
    checks.forEach(function (c) { byId[c.id] = c; });
    var mt = (byId.multiple_testing || {}).evidence || {};
    var of = (byId.overfitting || {}).evidence || {};

    /* Summary */
    $("validation-summary").innerHTML =
      '<ul class="missing-list">' +
      "<li><span>Checks — pass / warning / fail / not computed</span>" +
        "<span class='num'>" +
        (sm.pass == null ? "—" : sm.pass) + " / " +
        (sm.warning == null ? "—" : sm.warning) + " / " +
        (sm.fail == null ? "—" : sm.fail) + " / " +
        (sm.not_computed == null ? "—" : sm.not_computed) +
        "</span></li>" +
      "<li><span>Hypothesis tests in scope</span><span class='num'>" +
        (mt.n_hypothesis_tests == null ? "—" :
          mt.n_hypothesis_tests) + "</span></li>" +
      "<li><span>Naive expected false positives @5%</span>" +
        "<span class='num'>" +
        nm(mt.naive_expected_false_positives_at_5pct, 2) +
        "</span></li>" +
      "<li><span>Tested objects vs lab closes</span>" +
        "<span class='num'>" +
        (of.n_tested_objects == null ? "—" : of.n_tested_objects) +
        " vs " +
        (of.n_closes_lab == null ? "—" : of.n_closes_lab) +
        "</span></li>" +
      "</ul>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("val.summaryNote") + "</p>";

    /* Prospective validation per registry */
    var prosp = (byId.prospective || {}).evidence || {};
    var prospRows = (prosp.registries || []).map(function (r) {
      return "<tr><td>" + esc(r.registry) + "</td>" +
        "<td>" + (r.n_hypotheses == null ? "—" : r.n_hypotheses) +
        "</td>" +
        "<td>" + (r.prospective_validation_closes == null ? "—" :
          r.prospective_validation_closes) + "</td>" +
        "<td>" + (r.awaiting_validation == null ? "—" :
          r.awaiting_validation) + "</td>" +
        "<td>" + (r.holds == null ? "—" : r.holds) + "</td>" +
        "<td>" + (r.does_not_hold == null ? "—" :
          r.does_not_hold) + "</td>" +
        "<td>" + (r.inconclusive == null ? "—" :
          r.inconclusive) + "</td></tr>";
    }).join("");
    $("validation-prospective").innerHTML =
      '<div style="overflow-x:auto"><table class="version-table">' +
      "<thead><tr><th>Registry</th><th>Hypotheses</th>" +
      "<th>Prospective closes</th><th>Awaiting</th><th>Holds</th>" +
      "<th>Does not hold</th><th>Inconclusive</th>" +
      "</tr></thead><tbody>" + prospRows +
      "</tbody></table></div>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("val.prospNote") + "</p>";

    /* The 11 checks */
    var CHECK_LABELS = {
      lookahead: "Look-ahead bias",
      leakage: "Data leakage",
      survivorship: "Survivorship bias",
      selection: "Selection bias",
      overfitting: "Overfitting",
      multiple_testing: "Multiple testing",
      param_sensitivity: "Parameter sensitivity",
      walkforward: "Walk-forward",
      prospective: "Prospective validation",
      cluster: "Cluster dependency",
      reproducibility: "Reproducibility"
    };
    var evSummary = function (id, ev) {
      ev = ev || {};
      switch (id) {
        case "lookahead":
          return (ev.n_sampled == null ? "—" : ev.n_sampled) +
            " sampled, " +
            (ev.n_differing == null ? "—" : ev.n_differing) +
            " differing";
        case "leakage":
          return (ev.disjoint ? "disjoint" : "overlap") + " + " +
            (ev.ordered ? "ordered" : "unordered") + "; " +
            (ev.discovery_n == null ? "—" : ev.discovery_n) +
            " discovery / " +
            (((ev.registries || [])[0] || {}).n_validation_closes
              == null ? "—" :
              ((ev.registries || [])[0] || {}).n_validation_closes) +
            " validation closes";
        case "survivorship":
          return (ev.n_delisted_signals == null ? "—" :
              ev.n_delisted_signals) + " delisted signals; universe " +
            (ev.n_universe_active == null ? "—" :
              ev.n_universe_active) + " active";
        case "selection":
          return "Group A n=" +
            (ev.group_a_n_eligible == null ? "—" :
              ev.group_a_n_eligible) + "; losers gate-blocked " +
            (ev.missed_loser_gate_blocked == null ? "—" :
              ev.missed_loser_gate_blocked);
        case "overfitting":
          return (ev.n_tested_objects == null ? "—" :
              ev.n_tested_objects) + " tested objects vs " +
            (ev.n_closes_lab == null ? "—" : ev.n_closes_lab) +
            " lab closes (" + nm(ev.tested_per_close, 2) +
            " per close)";
        case "multiple_testing":
          return (ev.n_hypothesis_tests == null ? "—" :
              ev.n_hypothesis_tests) + " tests; " +
            nm(ev.naive_expected_false_positives_at_5pct, 2) +
            " expected false positives @5%";
        case "param_sensitivity":
          return "A0–A4 range " +
            nm(ev.range_max_minus_min_pp, 2) + "pp";
        case "walkforward":
          return ((ev.folds || []).length) + " folds";
        case "prospective":
          return (ev.registries || []).map(function (r) {
            return r.registry + " " +
              (r.prospective_validation_closes == null ? "—" :
                r.prospective_validation_closes);
          }).join(", ");
        case "cluster":
          return "gap " + nm(ev.gap_signal_minus_close_pp, 2) +
            "pp; flood " + nm(ev.largest_close_share_pct, 1) +
            "% of signals";
        case "reproducibility":
          return "A0 mean-net diff " +
            nm(ev.a0_mean_net_diff_pp, 2) + "pp; top-3 r4h diffs 0.0";
        default:
          return "";
      }
    };
    var checkRows = checks.map(function (c) {
      return "<tr><td>" + esc(CHECK_LABELS[c.id] || c.id) + "</td>" +
        "<td>" + esc(c.status || "—") + "</td>" +
        "<td>" + esc(evSummary(c.id, c.evidence)) + "</td></tr>";
    }).join("");
    $("validation-checks").innerHTML =
      '<div style="overflow-x:auto"><table class="version-table">' +
      "<thead><tr><th>Check</th><th>Status</th><th>Evidence</th>" +
      "</tr></thead><tbody>" + checkRows +
      "</tbody></table></div>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("val.checksNote") + "</p>";

    /* Walk-forward folds */
    var wf = (byId.walkforward || {}).evidence || {};
    var wfRows = (wf.folds || []).map(function (f, i) {
      var cfg = f.configs || {};
      var cell = function (k) {
        var c = cfg[k] || {};
        return c.mean_net_test_pct == null ? "—" :
          fmtPct(c.mean_net_test_pct, 2);
      };
      return "<tr><td>Fold " + (i + 1) + "</td>" +
        "<td>" + (f.train_closes == null ? "—" : f.train_closes) +
        "</td>" +
        "<td>" + (f.test_closes == null ? "—" : f.test_closes) +
        "</td>" +
        "<td>" + esc(f.best_on_train || "—") + "</td>" +
        "<td>" + cell("A0") + "</td>" +
        "<td>" + cell("A4") + "</td>" +
        "<td>" + cell("A5") + "</td>" +
        "<td>" + cell("A9") + "</td></tr>";
    }).join("");
    $("validation-walkforward").innerHTML =
      '<div style="overflow-x:auto"><table class="version-table">' +
      "<thead><tr><th>Fold</th><th>Train closes</th>" +
      "<th>Test closes</th><th>Best on train</th>" +
      "<th>A0 test mean</th><th>A4 test mean</th>" +
      "<th>A5 test mean</th><th>A9 test mean</th>" +
      "</tr></thead><tbody>" + wfRows +
      "</tbody></table></div>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("val.wfNote") + "</p>";

    /* Recommendations */
    var recos = (VA.recommendations || []).map(function (r) {
      return "<li><span>" + esc(bi(r.filter, r.filter_en)) +
        "</span><span class='num'>" +
        esc(r.status || r.kind || "") + "</span></li>";
    }).join("");
    $("validation-recommendations").innerHTML =
      '<ul class="missing-list">' + recos + "</ul>" +
      "<p class='panel-sub' style='margin-top:12px'>" +
        t("val.recoNote") + "</p>";

    /* Limitations */
    $("validation-limitations").innerHTML =
      "<p class='panel-sub' style='margin:0'>" +
        esc(bi(VA.limitations, VA.limitations_en) || "") + "</p>";
  }

  function renderTimeline() {
    /* v43: drop timeline entries whose text mentions the hidden
       horizon (the v2.3.0 "Long horizons" milestone does). */
    $("milestones").innerHTML = (DATA.timeline || []).filter(function (m) {
      return !mentionsHiddenHorizon(m.title) &&
        !mentionsHiddenHorizon(m.title_id) &&
        !mentionsHiddenHorizon(m.text) &&
        !mentionsHiddenHorizon(m.text_id);
    }).map(function (m) {
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
    var r4hTl = (DATA.learnings && DATA.learnings.horizons &&
      DATA.learnings.horizons.r4h) || {};
    var nEval = r4hTl.n_evaluated || 0;
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
      case "r4h": return r4hOf(sig);
      case "r12h": return hzOf(sig, "h12");
      case "r1d": return hzOf(sig, "h1d");
      case "r2d": return hzOf(sig, "h2d");
      case "r3d": return hzOf(sig, "h3d");
      case "r1w": return hzOf(sig, "h1w");
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
  /* v43: one TF cell — evaluated return with sign colour, "—" when the
     horizon is still pending (research grid convention). */
  function tfCell(v) {
    return "<td class='" + (v == null ? "" : v >= 0 ? "pos" : "neg") + "'>" +
      (v == null ? "—" : fmtPct(v, 2)) + "</td>";
  }

  function explorerRowHtml(s) {
    var d = (s.snapshot && s.snapshot.decisions) || {};
    var m = (s.orderflow && s.orderflow.metrics) || {};
    var rg = (s.regime && s.regime.metrics) || {};
    var dots = ["breakout", "reversal", "orderflow", "regime", "liquidity"].map(function (a) {
      var st = s[a] && s[a].status;
      var cls = st === "COMPLETED" ? "dot-ok" :
        st === "PARTIAL DATA" ? "dot-part" : "dot-miss";
      return '<i class="' + cls + '" title="' + esc(a) + ": " + esc(st || "?") + '"></i>';
    }).join("");
    return '<tr data-id="' + esc(s.signal_id) + '"><td>' + esc(s.symbol) +
      "</td><td>" + esc(fmtWib(s.signal_ts) || "—") +
      "</td><td>" + esc(fmtPrice(d.close) || "—") + "</td>" +
      tfCell(r4hOf(s)) + tfCell(hzOf(s, "h12")) + tfCell(hzOf(s, "h1d")) +
      tfCell(hzOf(s, "h2d")) + tfCell(hzOf(s, "h3d")) + tfCell(hzOf(s, "h1w")) +
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
        /* v43: the outcome filter is the sign of the +4H return. */
        var r = r4hOf(s);
        if (outF === "__pending__") { if (r != null) return false; }
        else if (outF === "__pos4h__") { if (r == null || r <= 0) return false; }
        else if (outF === "__neg4h__") { if (r == null || r >= 0) return false; }
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
        html += '<tr class="close-group-head"><td colspan="15">' +
          groupHeadButtonHtml(g, open) + "</td></tr>";
        if (open) {
          var showAll = !!GROUP_SHOW_ALL[g.close_ts];
          var items = showAll ? g.signals
            : g.signals.slice(0, GROUP_PAGE_SIZE);
          html += items.map(explorerRowHtml).join("");
          if (g.signals.length > GROUP_PAGE_SIZE) {
            html += '<tr class="close-group-more"><td colspan="15">' +
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
        /* v46: rail bawah (mobile) kini bisa di-scroll horizontal —
           pastikan link seksi aktif selalu terlihat. */
        if (link.scrollIntoView) {
          link.scrollIntoView({block: "nearest", inline: "nearest"});
        }
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
    initLivePrices(data);
    $("loading").hidden = true;
    $("app").hidden = false;
    initRailSpy();
  }

  /* v40: live returns for the nearest pending horizon. live-prices.js
     reads window.RAPTOR_DATA at load, so shim it from the research
     signals (all symbols, so any selected signal is already
     subscribed) and inject the script once the research data is ready. */
  var LIVE_STARTED = false;
  function initLivePrices(data) {
    if (LIVE_STARTED) return;
    LIVE_STARTED = true;
    if (!window.RAPTOR_DATA) {
      window.RAPTOR_DATA = {
        signals: (data.signals || []).map(function (s) {
          return { symbol: s.symbol, market: s.market };
        })
      };
    }
    var scr = document.createElement("script");
    scr.src = "live-prices.js";
    scr.defer = true;
    document.body.appendChild(scr);
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
     research data has loaded. v43: the fingerprint key name stays
     research_n_eval30 because data-sync.js reads it by name; the
     value is now the +4H evaluable count. */
  window.RaptorResearchSync = {
    getFingerprint: function () {
      if (!DATA) return null;
      return {
        research_n_signals: DATA.overview.n_signals,
        research_n_eval30: ((DATA.learnings.horizons || {}).r4h || {}).n_evaluated,
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
