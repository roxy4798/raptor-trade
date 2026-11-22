# Raptor Trade — Signal Observatory

Public dashboard for the Raptor Trade 4H LONG SIGNAL system (Binance Futures
Mainnet, read-only research signals).

**This repository is generated automatically.** Every push is produced by the
dashboard build on Muse's VM (`build.py` + `sync_to_github.py`). Do not edit
files here by hand — manual edits are overwritten on the next sync. Design
changes go through the dashboard build, not this repo.

- Live site: https://raptor-trade.pages.dev/
- Cloudflare Pages auto-deploys on every push (Git integration).
- Signal data is a historical snapshot, rebuilt from the live signal log and
  tracker. The Live price column streams directly from Binance in the
  visitor's browser.

Not financial advice. Signals are read-only and never open orders.
