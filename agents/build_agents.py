"""Raptor Trade AI Agents — shared build module (framework v1.0.0).

Renders the /agents/ directory and one page per live agent from
assets/agents/config.json + assets/agents/template.html, and copies
assets/agents/ (config, templates, css, js, vendored Rive runtime,
.riv rigs) to <dist>/assets/agents/.

Public entry point (wired blind by build.py — do not change the
signature):

    def build_all(dist_dir, config_path, research_state_dir):

Research content ({{SECTIONS_HTML}}) is baked from the LIVE research
state at build time — read fresh from research_state_dir on every run,
never from the prism-content.json spec (that file is only the
cross-check reference). Every figure carries per-figure provenance
(source file + key); a missing datum renders as "no data", never an
estimate. No research state file is ever written. No deploy, no
network, no new libraries. Rp0.

Standalone test (does NOT run the repo's build.py):

    python3 build_agents.py --out /tmp/prism-dist-test \
        --config assets/agents/config.json \
        --state /home/hatch/workspace/pump-hunter-alerts/research/state

Layout note (found while building, 26 Nov 2026): the framework
contract (agents/FRAMEWORK.md) puts agent assets under
dist/assets/agents/ with {{ASSET_BASE}} = ../../assets/ on agent
pages. This module implements exactly that contract. The repo's
build.py ALSO flat-copies assets/agents/* into dist/agents/ (harmless
duplication — different filenames from the rendered pages), but it
does NOT create dist/assets/ for style.css / vendor/ / branding/ /
characters/, which the template also references via {{ASSET_BASE}}.
That is a cross-track wiring question for the coordinator, not
something this module can fix without breaking its contract — see
agents/changes-prism-page.md.
"""

from __future__ import annotations

import argparse
import html
import json
import math
import re
import shutil
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

WIB = timezone(timedelta(hours=7))
MODULE_VERSION = "1.0.0"

# ---------------------------------------------------------------------------
# Small helpers
# ---------------------------------------------------------------------------

MINUS = "\u2212"  # dashboard style: U+2212, not ASCII hyphen


def esc(s) -> str:
    """HTML-escape text for element content AND double-quoted attributes."""
    if s is None:
        return ""
    return html.escape(str(s), quote=True)


def _num(x):
    """Return x as a float/int, or None when missing / not numeric."""
    if x is None:
        return None
    if isinstance(x, bool):
        return None
    try:
        return float(x)
    except (TypeError, ValueError):
        return None


def fmt_pct(x, dec: int = 2) -> str:
    """Signed percent, e.g. +0.61% / -1.71% (U+2212 minus). None -> no data."""
    v = _num(x)
    if v is None:
        return "no data"
    sign = "+" if v >= 0 else MINUS
    return f"{sign}{abs(v):.{dec}f}%"


def fmt_pp(x, dec: int = 2) -> str:
    """Signed percentage-point gap, e.g. +0.33pp / -0.54pp."""
    v = _num(x)
    if v is None:
        return "no data"
    sign = "+" if v >= 0 else MINUS
    return f"{sign}{abs(v):.{dec}f}pp"


def fmt_int(x) -> str:
    v = _num(x)
    if v is None:
        return "no data"
    return str(int(v))


def fmt_ts_wib(ts) -> str:
    """Epoch seconds -> '25 Nov 2026 12:05 WIB'. None/invalid -> 'no data'."""
    v = _num(ts)
    if v is None:
        return "no data"
    try:
        return datetime.fromtimestamp(v, WIB).strftime("%d %b %Y %H:%M WIB")
    except (ValueError, OverflowError, OSError):
        return "no data"


def fmt_ts_wib_short(ts) -> str:
    """Epoch seconds -> '23 Nov 23:00 WIB' (no year)."""
    v = _num(ts)
    if v is None:
        return "no data"
    try:
        return datetime.fromtimestamp(v, WIB).strftime("%d %b %H:%M WIB")
    except (ValueError, OverflowError, OSError):
        return "no data"


def now_wib_str() -> str:
    return datetime.now(WIB).strftime("%d %b %Y %H:%M WIB")


def get(d, *keys, default=None):
    """Nested dict lookup; returns default when any step is missing."""
    cur = d
    for k in keys:
        if not isinstance(cur, dict) or k not in cur:
            return default
        cur = cur[k]
    return cur


def file_mtime_wib(path: Path) -> str:
    try:
        return fmt_ts_wib(path.stat().st_mtime)
    except OSError:
        return "no data"


def bi(en: str, id_: str) -> str:
    """Bilingual inline span (framework pattern: agent-page.js swaps
    .agent-i18n[data-en] textContent on language change). Plain text
    only — never put markup inside."""
    return (f'<span class="agent-i18n" data-en="{esc(en)}" '
            f'data-id="{esc(id_)}">{esc(en)}</span>')


def bip(en: str, id_: str) -> str:
    """Bilingual paragraph (plain text only)."""
    return (f'<p class="agent-i18n" data-en="{esc(en)}" '
            f'data-id="{esc(id_)}">{esc(en)}</p>')


def section_head(kicker_en: str, kicker_id: str, h2_en: str, h2_id: str) -> str:
    return (f'<p class="section-kicker">{bi(kicker_en, kicker_id)}</p>\n'
            f'<h2>{bi(h2_en, h2_id)}</h2>')


def src_line(source: str) -> str:
    """Per-figure provenance line under a fact / KPI."""
    return f'<dd class="src">Source: {esc(source)}</dd>'


# ---------------------------------------------------------------------------
# Research state loading (read-only, fresh on every build)
# ---------------------------------------------------------------------------

def _load_json(path: Path):
    try:
        with path.open(encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


def load_research_state(state_dir) -> dict:
    """Read every research state file PRISM's page needs. Missing files
    or keys yield None and render as 'no data' — never an estimate."""
    state_dir = Path(state_dir)
    learnings = _load_json(state_dir / "learnings.json") or {}
    shadow = _load_json(state_dir / "shadow_lab.json") or {}
    split = _load_json(state_dir / "stock_crypto_split.json") or {}
    registry = _load_json(state_dir / "hypotheses.json") or {}
    baseline = _load_json(state_dir / "observation_baseline.json") or {}
    ignition_file = _load_json(state_dir / "ignition_research.json") or {}
    ph_file = _load_json(state_dir / "ignition" / "hypotheses_ph.json") or {}

    # Ignition hypotheses: prefer the dedicated registry file
    # (state/ignition/hypotheses_ph.json); fall back to the copy
    # embedded in learnings.json ignition_research.
    ig_embedded = get(learnings, "ignition_research") or {}
    ph_list = get(ph_file, "hypotheses") or get(ig_embedded, "hypotheses_ph") or []
    ih_list = get(ig_embedded, "hypotheses") or []

    # PRISM grep, computed live (not copied from the spec): how many
    # times does 'prism' appear in the state files the page cites?
    grep_files = [
        "shadow_lab.json", "hypotheses.json", "learnings.json",
        "ignition/hypotheses.json", "ignition/hypotheses_ph.json",
        "stock_crypto_split.json", "asset_class.json",
    ]
    grep_counts = {}
    for rel in grep_files:
        p = state_dir / rel
        try:
            text = p.read_text(encoding="utf-8", errors="ignore")
            grep_counts[rel] = text.lower().count("prism")
        except OSError:
            grep_counts[rel] = None
    grep_total = sum(c or 0 for c in grep_counts.values())

    return {
        "dir": state_dir,
        "learnings": learnings,
        "shadow": shadow,
        "split": split,
        "registry": registry,
        "baseline": baseline,
        "ignition_file": ignition_file,
        "ph": ph_list,
        "ih": ih_list,
        "ignition": ig_embedded,
        "grep_counts": grep_counts,
        "grep_total": grep_total,
        # Per-file "as of" stamps for the provenance foot.
        "asof": {
            "learnings": fmt_ts_wib(get(learnings, "updated_ts"))
                         or file_mtime_wib(state_dir / "learnings.json"),
            "learnings_mtime": file_mtime_wib(state_dir / "learnings.json"),
            "shadow": fmt_ts_wib(get(shadow, "generated_ts")),
            "split": fmt_ts_wib(get(split, "generated_ts")),
            "ignition": fmt_ts_wib(get(ig_embedded, "generated_ts")),
            "ph_mtime": file_mtime_wib(state_dir / "ignition" / "hypotheses_ph.json"),
            "registry_mtime": file_mtime_wib(state_dir / "hypotheses.json"),
        },
    }


# ---------------------------------------------------------------------------
# Roster strip + directory cards (server-rendered, status-aware)
# ---------------------------------------------------------------------------

STATUS_LABEL = {
    "live": "LIVE",
    "strategy_core": "STRATEGY CORE",
    "coming_soon": "COMING SOON",
}


def roster_count_en(agents) -> str:
    """'1 live · 11 coming soon' — strategy_core counts as coming soon
    until its page exists (it has no live page yet)."""
    n_live = sum(1 for a in agents if a.get("status") == "live")
    n_rest = len(agents) - n_live
    live_word = "live"
    rest_word = "coming soon"
    return f"{n_live} {live_word} \u00b7 {n_rest} {rest_word}"


def build_roster(agents, current_slug: str) -> str:
    """12-agent roster strip for an agent page. Shape mirrors the
    client-side fallback in agent-page.js buildRoster() (same classes,
    same tags), except image URLs use the correct path: the config
    portrait already starts with 'assets/', so the page-relative
    prefix is '../../' (not '../../assets/'). RAPTOR carries BOTH the
    STRATEGY CORE and the COMING SOON tag (FRAMEWORK.md), where the
    JS fallback shows only one — the pre-rendered strip is what
    ships, so the honest two-tag form wins."""
    out = []
    for a in agents:
        slug = a.get("slug", "")
        status = a.get("status", "coming_soon")
        live = status == "live"
        core = status == "strategy_core"
        current = slug == current_slug
        img = (f'<img src="../../{esc(a.get("portrait", ""))}" alt="" '
               f'loading="lazy" decoding="async" width="450" height="540">')
        if core:
            tags = ('<span class="agent-tag core">STRATEGY CORE</span>'
                    '<span class="agent-tag soon">COMING SOON</span>')
            aria_note = ", strategy core, coming soon"
        elif live:
            tags = '<span class="agent-tag live">LIVE</span>'
            aria_note = ", live"
        else:
            tags = '<span class="agent-tag soon">COMING SOON</span>'
            aria_note = ", coming soon \u2014 not rigged yet"
        meta = (f'<div class="agent-meta">'
                f'<div class="agent-num">AGENT {esc(a.get("num", ""))}</div>'
                f'<div class="agent-name">{esc(a.get("name", ""))}</div>'
                f'{tags}</div>')
        cls = "agent-btn"
        if not live:
            cls += " coming-soon"
        if core:
            cls += " flagship"
        if current:
            cls += " is-current"
        aria = (f'{esc(a.get("num", ""))} {esc(a.get("name", ""))}{aria_note}')
        pressed = "true" if current else "false"
        if live:
            out.append(
                f'<a class="{cls}" href="../{esc(slug)}/" '
                f'aria-pressed="{pressed}" aria-label="{aria}">{img}{meta}</a>')
        else:
            out.append(
                f'<button class="{cls}" type="button" '
                f'aria-pressed="{pressed}" aria-label="{aria}">{img}{meta}</button>')
    return "\n      ".join(out)


def build_directory_cards(agents) -> str:
    """12 cards for /agents/. Live agents link to their page; the rest
    are <article> (no link, no dead page). RAPTOR additionally shows
    STRATEGY CORE. Portraits resolve to ../assets/characters/... from
    dist/agents/index.html."""
    out = []
    for a in agents:
        slug = a.get("slug", "")
        status = a.get("status", "coming_soon")
        live = status == "live"
        core = status == "strategy_core"
        img = (f'<img src="../{esc(a.get("portrait", ""))}" alt="" '
               f'loading="lazy" width="900" height="1080">')
        spec = bi(a.get("specialization_en", ""), a.get("specialization_id", ""))
        desc = bi(a.get("desc_en", ""), a.get("desc_id", ""))
        if live:
            tags = '<span class="agent-tag live">LIVE</span>'
            cls = "agent-card is-live"
        elif core:
            tags = ('<span class="agent-tag core">STRATEGY CORE</span>'
                    '<span class="agent-tag soon">COMING SOON</span>')
            cls = "agent-card is-core"
        else:
            tags = '<span class="agent-tag soon">COMING SOON</span>'
            cls = "agent-card is-soon"
        inner = (f'{img}\n'
                 f'<span class="agent-num">AGENT {esc(a.get("num", ""))}</span>\n'
                 f'<span class="agent-name">{esc(a.get("name", ""))}</span>\n'
                 f'<span class="agent-spec">{spec}</span>\n'
                 f'<span class="agent-desc">{desc}</span>\n'
                 f'{tags}')
        style = f' style="--agent-accent:{esc(a.get("color", "#e879f9"))}"'
        if live:
            out.append(f'<a class="{cls}" href="{esc(slug)}/"{style}>\n{inner}</a>')
        else:
            out.append(f'<article class="{cls}"{style}>\n{inner}</article>')
    return "\n    ".join(out)


# ---------------------------------------------------------------------------
# Template rendering
# ---------------------------------------------------------------------------

_PLACEHOLDER_RE = re.compile(r"\{\{[A-Z0-9_]+\}\}")


def _check_no_placeholders(text: str, where: str) -> None:
    left = sorted(set(_PLACEHOLDER_RE.findall(text)))
    if left:
        raise ValueError(f"unreplaced placeholders in {where}: {left}")


def _portrait_rel(agent: dict) -> str:
    """{{PORTRAIT_PATH}} as the template concatenates it:
    {{ASSET_BASE}}{{PORTRAIT_PATH}} must yield
    ../../assets/characters/agent-NN.jpg. The config portrait already
    starts with 'assets/', so strip that one leading segment here —
    emitting the config value verbatim would produce the broken
    ../../assets/assets/characters/... (framework-contract bug found
    26 Nov 2026; see changes-prism-page.md)."""
    p = agent.get("portrait", "")
    if p.startswith("assets/"):
        p = p[len("assets/"):]
    return p


def render_agent_page(template: str, agent: dict, cfg: dict,
                      sections_html: str, roster_html: str) -> str:
    color = agent.get("color", "#e879f9")
    color2 = agent.get("color2")
    # The style element: omit the --agent-accent-2 declaration when
    # color2 is null (FRAMEWORK.md).
    if color2:
        style_el = (f"<style>:root{{--agent-accent:{esc(color)};"
                    f"--agent-accent-2:{esc(color2)};}}</style>")
    else:
        style_el = f"<style>:root{{--agent-accent:{esc(color)};}}</style>"
    old_style = ("<style>:root{--agent-accent:{{AGENT_COLOR}};"
                 "--agent-accent-2:{{AGENT_COLOR2}};}</style>")
    if old_style in template:
        template = template.replace(old_style, style_el)
    status = agent.get("status", "coming_soon")
    rive = agent.get("riv")
    rive_tag = ('<script src="../../assets/agents/rive.js"></script>'
                if rive else "")
    subs = {
        "AGENT_SLUG": agent.get("slug", ""),
        "AGENT_NUM": agent.get("num", ""),
        "AGENT_NAME": agent.get("name", ""),
        "AGENT_COLOR": color,
        "AGENT_COLOR2": color2 or "",
        "AGENT_TITLE_EN": agent.get("title_en", ""),
        "AGENT_SPEC_EN": agent.get("specialization_en", ""),
        "AGENT_SPEC_ID": agent.get("specialization_id", ""),
        "AGENT_TAGLINE_EN": agent.get("tagline_en", ""),
        "AGENT_TAGLINE_ID": agent.get("tagline_id", ""),
        "AGENT_ENV_EN": agent.get("environment_en", ""),
        "AGENT_ENV_ID": agent.get("environment_id", ""),
        "AGENT_STATUS": status,
        "AGENT_STATUS_LABEL_EN": STATUS_LABEL.get(status, status.upper()),
        "PORTRAIT_PATH": _portrait_rel(agent),
        "RIV_PATH": rive or "",
        "STATE_MACHINE": agent.get("state_machine") or "",
        "ASSET_BASE": "../../assets/",
        "SITE_BASE": "../",
        "SECTIONS_HTML": sections_html,
        "ROSTER_HTML": roster_html,
        "ROSTER_COUNT_EN": roster_count_en(cfg.get("agents", [])),
        "AGENT_CONFIG_JSON": json.dumps(agent, ensure_ascii=False,
                                        separators=(",", ":")),
        "ROSTER_CONFIG_JSON": json.dumps(cfg, ensure_ascii=False,
                                         separators=(",", ":")),
        "RIVE_SCRIPT_TAG": rive_tag,
    }
    out = template
    for key, val in subs.items():
        out = out.replace("{{" + key + "}}", val)
    _check_no_placeholders(out, f"agent page {agent.get('slug', '')}")
    return out


def copy_agents_assets(agents_dir: Path, dest_dir: Path) -> None:
    """Copy assets/agents/ to <dist>/assets/agents/ — exactly the
    contract set: config, templates, css, js, vendored Rive runtime,
    riv/ rigs. The build script itself (build_agents.py, helpers,
    __pycache__) is NOT shipped to dist."""
    dest_dir.mkdir(parents=True, exist_ok=True)
    for name in ("config.json", "template.html", "directory-template.html",
                 "agent-page.css", "agent-page.js", "rive.js",
                 "rive.wasm", "rive_fallback.wasm"):
        src = agents_dir / name
        if src.is_file():
            shutil.copyfile(src, dest_dir / name)
    riv_src = agents_dir / "riv"
    if riv_src.is_dir():
        riv_dst = dest_dir / "riv"
        riv_dst.mkdir(parents=True, exist_ok=True)
        for src in riv_src.glob("*"):
            if src.is_file():
                shutil.copyfile(src, riv_dst / src.name)
        for old in riv_dst.glob("*"):
            if old.is_file() and not (riv_src / old.name).exists():
                old.unlink()


# ---------------------------------------------------------------------------
# PRISM sections (2-7) — baked from live research state
# ---------------------------------------------------------------------------

# Extra gates, as stored in shadow_lab.json configs[].extra_gate.
GATE_LABEL = {
    None: "\u2014",
    "ema_aligned": "EMA aligned",
    "momentum": "Momentum HH/HL",
    "taker_buy": "Taker-buy \u2265 0.55",
    "rsi_lt_85": "RSI 4H < 85",
}

CHART_STYLE = """<style>
/* PRISM page additions (baked with the sections, framework CSS untouched):
   .agent-section is a grid item with min-width:auto in agent-page.css,
   so a wide nowrap table forced the whole section (and page) to the
   table's min-content width (~990px) — horizontal overflow at 1440
   and 390. min-width:0 lets the .prism-table-wrap scroll internally
   instead; non-number cells may wrap, numbers stay nowrap. */
.agent-section{min-width:0}
.prism-table-wrap{min-width:0}
table.prism-table th,table.prism-table td{white-space:normal}
table.prism-table td.num,table.prism-table th.num{white-space:nowrap}
.prism-chart-wrap{margin-top:12px}
.prism-chart-toggles{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 4px}
.prism-toggle{cursor:pointer;background:var(--bg-2);color:var(--text-1);border:1px solid var(--line-strong);border-radius:999px;padding:8px 14px;font-size:.85rem;font-weight:700;min-height:40px}
.prism-toggle[aria-pressed="true"]{background:var(--agent-accent);color:#060b17;border-color:var(--agent-accent)}
.prism-chart-note{color:var(--text-2);font-size:.88rem;margin:8px 0 0}
.prism-table-wrap{overflow-x:auto;margin-top:12px}
table.prism-table{width:100%;border-collapse:collapse;font-size:.85rem;color:var(--text-2)}
table.prism-table th,table.prism-table td{padding:7px 8px;border-top:1px solid var(--line);text-align:left;vertical-align:top;white-space:nowrap}
table.prism-table td.num,table.prism-table th.num{text-align:right}
table.prism-table th{color:var(--text-1);font-size:.78rem;letter-spacing:.04em;text-transform:uppercase}
table.prism-table td.cfg{color:var(--text-1);font-weight:700}
.prism-verdict{font-weight:700;letter-spacing:.03em}
.prism-verdict.holds{color:var(--pos)}
.prism-verdict.nohold{color:var(--neg)}
.prism-verdict.incon{color:var(--warn)}
.prism-code{display:block;white-space:pre-wrap;word-break:break-word;background:rgba(0,0,0,.35);border:1px solid var(--line);border-radius:8px;padding:10px 12px;font-family:var(--font-mono);font-size:.78rem;color:var(--text-2);margin:8px 0}
.agent-section ul.prism-list{margin:0 0 10px;padding-left:20px;color:var(--text-2);font-size:.95rem}
.agent-section ul.prism-list li{margin-bottom:6px}
.agent-section ul.prism-list li:last-child{margin-bottom:0}
</style>"""

HONESTY_EN = (
    "PRISM-specific finding in the research state: none. No finding, "
    "metric, or capability on this page is PRISM-specific \u2014 everything "
    "shown is the shared Shadow Lab / Ignition / split research that "
    "PRISM\u2019s domain (Filter Discovery & Optimization) works with. "
    "A missing datum is shown as \u201cno data\u201d, never estimated.")
HONESTY_ID = (
    "Temuan spesifik PRISM di research state: tidak ada. Tidak ada "
    "temuan, metrik, atau kapabilitas di halaman ini yang spesifik "
    "PRISM \u2014 semua yang ditampilkan adalah riset bersama Shadow Lab / "
    "Ignition / split yang menjadi domain PRISM (Filter Discovery & "
    "Optimization). Datum yang tidak ada ditampilkan sebagai "
    "\u201cno data\u201d, tidak pernah diestimasi.")


def _configs(state: dict) -> list:
    cfgs = get(state["shadow"], "configs") or []
    return [c for c in cfgs if isinstance(c, dict) and c.get("id")]


def _cfg_by_id(state: dict, cid: str):
    for c in _configs(state):
        if c.get("id") == cid:
            return c
    return None


def _chart_series(state: dict) -> list:
    """One row per config A0-A9 with all three mean-net series."""
    rows = []
    for c in _configs(state):
        ov = c.get("overall") or {}
        dc = c.get("discovery") or {}
        rows.append({
            "id": c.get("id", "?"),
            "label": c.get("label", ""),
            "pooled": {"mean": _num(get(ov, "mean_net4h_pct")),
                       "n": _num(get(ov, "n")),
                       "n_net": _num(get(ov, "n_net"))},
            "ex_flood": {"mean": _num(get(ov, "ex_flood_mean_net4h_pct")),
                         "n": _num(get(ov, "ex_flood_n")),
                         "n_net": None},
            "discovery": {"mean": _num(get(dc, "mean_net4h_pct")),
                          "n": _num(get(dc, "n")),
                          "n_net": _num(get(dc, "n_net"))},
        })
    return rows


def _chart_svg(rows: list, series: str = "pooled") -> str:
    """Hand-rolled SVG bar chart (no library). Server-renders the
    pooled series; the inline toggle script re-renders the same
    geometry for ex-flood / discovery from the embedded JSON."""
    means = [r[s]["mean"] for r in rows for s in ("pooled", "ex_flood", "discovery")]
    means = [m for m in means if m is not None]
    lo = math.floor((min(means) if means else -2) - 0.2)
    hi = math.ceil((max(means) if means else 1) + 0.2)
    W, H = 720, 360
    ML, MR, MT, MB = 46, 10, 30, 56
    plot_w, plot_h = W - ML - MR, H - MT - MB

    def Y(v):
        return MT + (hi - v) / (hi - lo) * plot_h

    y0 = Y(0)
    parts = [f'<svg id="prism-chart-svg" viewBox="0 0 {W} {H}" width="100%" '
             f'role="img" aria-label="Shadow Lab mean net +4H per filter '
             f'config A0 to A9" style="display:block">']
    parts.append(f'<text x="14" y="{MT + plot_h / 2}" fill="#7f8fa8" '
                 f'font-size="11" text-anchor="middle" '
                 f'transform="rotate(-90 14 {MT + plot_h / 2})">'
                 f'Mean net +4H (%)</text>')
    for g in range(lo, hi + 1):
        y = Y(g)
        strong = ' stroke="#94a3b8" stroke-opacity="0.45"' if g == 0 else \
            ' stroke="#94a3b8" stroke-opacity="0.14"'
        parts.append(f'<line x1="{ML}" y1="{y:.1f}" x2="{W - MR}" '
                     f'y2="{y:.1f}"{strong} stroke-width="1"/>')
        parts.append(f'<text x="{ML - 6}" y="{y + 4:.1f}" fill="#7f8fa8" '
                     f'font-size="11" text-anchor="end">{g}</text>')
    parts.append('<g id="prism-chart-bars">')
    parts.append(_chart_bars_svg(rows, series, ML, plot_w, Y, y0))
    parts.append('</g>')
    parts.append('</svg>')
    return "".join(parts)


def _chart_bars_svg(rows, series, ml, plot_w, Y, y0) -> str:
    band = plot_w / max(len(rows), 1)
    bar_w = 42
    out = []
    for i, r in enumerate(rows):
        d = r[series]
        mean = d["mean"]
        if mean is None:
            continue
        x = ml + i * band + (band - bar_w) / 2
        y_top, h = (Y(mean), y0 - Y(mean)) if mean >= 0 else (y0, Y(mean) - y0)
        fill = "#2ebd85" if mean >= 0 else "#ef5468"
        stroke = (' stroke="#e879f9" stroke-width="2"'
                  if r["id"] == "A0" else "")
        n_txt = f'n={int(d["n"])}' if d["n"] is not None else "n=no data"
        n_net = (f' (n_net={int(d["n_net"])})'
                 if d.get("n_net") is not None else "")
        tip = (f'{r["id"]} \u2014 {r["label"]}\n'
               f'Mean net +4H: {fmt_pct(mean)}\n{n_txt}{n_net}')
        lab_y = y_top - 6 if mean >= 0 else y_top + h + 16
        out.append(
            f'<g><title>{esc(tip)}</title>'
            f'<rect x="{x:.1f}" y="{y_top:.1f}" width="{bar_w}" '
            f'height="{max(h, 1):.1f}" fill="{fill}"{stroke} rx="2"/>'
            f'<text x="{x + bar_w / 2:.1f}" y="{lab_y:.1f}" fill="#e8edf7" '
            f'font-size="12" font-weight="700" text-anchor="middle">'
            f'{fmt_pct(mean)}</text></g>')
        cx = ml + i * band + band / 2
        out.append(
            f'<text x="{cx:.1f}" y="326" fill="#e8edf7" font-size="12" '
            f'font-weight="700" text-anchor="middle">{esc(r["id"])}</text>'
            f'<text x="{cx:.1f}" y="342" fill="#7f8fa8" font-size="11" '
            f'text-anchor="middle">{esc(n_txt)}</text>')
    return "".join(out)


def _chart_html(state: dict, flood_txt: str) -> str:
    """Chart block: flood warning, SVG, 3-way toggle, series note,
    full data table. Toggle is a small inline script (no library) that
    re-renders the bars group from the embedded JSON."""
    rows = _chart_series(state)
    if not rows:
        return (f'<h3>{bi("Shadow Lab chart", "Grafik Shadow Lab")}</h3>\n'
                f'<p class="panel-honest">{bi("no data",
                "no data")}</p>')
    data_json = json.dumps({"rows": rows}, ensure_ascii=False)
    # JSON inside <script type="application/json"> must NOT be
    # HTML-escaped (esc() would turn " into &quot; and break
    # JSON.parse). Only a literal </script> could break out, and the
    # chart data never contains it — assert that instead.
    assert "</script" not in data_json.lower(), "chart data contains </script"
    # Small-n warning figures come from the live rows, never hardcoded.
    small = [r for r in rows if r["id"] in ("A4", "A5", "A7", "A9")]
    small_txt = ", ".join(
        f"{r['id']} n={int(r['pooled']['n'])}" for r in small
        if r["pooled"]["n"] is not None)
    a7 = next((r for r in rows if r["id"] == "A7"), None)
    a7_disc_n = _num(get(a7, "discovery", "n")) if a7 else None
    warn_en = (f"Pooled bars are flood-dominated: one close "
               f"({flood_txt}) drives the pool, so most pooled bars are "
               f"negative even though the same configs look positive "
               f"ex-flood and on discovery. Small-n configs ({small_txt}) "
               f"are the least stable \u2014 A7\u2019s discovery n is "
               f"{fmt_int(a7_disc_n)}.")
    warn_id = (f"Batang pooled didominasi flood: satu close "
               f"({flood_txt}) menggerakkan pool, sehingga sebagian besar "
               f"batang pooled negatif walau config yang sama terlihat "
               f"positif ex-flood dan di discovery. Config n kecil "
               f"({small_txt}) paling tidak stabil \u2014 n discovery A7 "
               f"hanya {fmt_int(a7_disc_n)}.")
    notes = {
        "pooled": {
            "en": f"Pooled: every signal counts once. {flood_txt} drives the pool.",
            "id": f"Pooled: setiap sinyal dihitung sekali. {flood_txt} menggerakkan pool."},
        "ex_flood": {
            "en": "Ex-flood: the flood close removed. Same configs, smaller n \u2014 read the n on every bar.",
            "id": "Ex-flood: close flood dibuang. Config sama, n lebih kecil \u2014 baca n di setiap batang."},
        "discovery": {
            "en": "Discovery (pre-flood closes only): closes before the flood. A config that looks good here must still be confirmed on validation closes.",
            "id": "Discovery (hanya close sebelum flood): close sebelum flood. Config yang terlihat bagus di sini tetap harus dikonfirmasi di close validasi."},
    }
    trows = []
    for r in rows:
        def cell(s):
            d = r[s]
            if d["mean"] is None:
                return '<td class="num">no data</td>'
            n = f' (n={int(d["n"])})' if d["n"] is not None else ""
            return f'<td class="num">{fmt_pct(d["mean"])}{n}</td>'
        trows.append(
            f'<tr><td class="cfg">{esc(r["id"])}</td>'
            f'<td>{esc(r["label"])}</td>'
            f'{cell("pooled")}{cell("ex_flood")}{cell("discovery")}</tr>')
    table = (
        '<div class="prism-table-wrap"><table class="prism-table">'
        '<thead><tr><th>Config</th>'
        f'<th>{bi("Filter", "Filter")}</th>'
        f'<th class="num">{bi("Pooled mean +4H", "Rata-rata pooled +4J")}</th>'
        f'<th class="num">{bi("Ex-flood mean +4H", "Rata-rata ex-flood +4J")}</th>'
        f'<th class="num">{bi("Discovery mean +4H", "Rata-rata discovery +4J")}</th>'
        '</tr></thead><tbody>' + "".join(trows) + '</tbody></table></div>')
    script = f"""<script>
(function () {{
  'use strict';
  var data = JSON.parse(document.getElementById('prism-chart-data').textContent);
  var rows = data.rows;
  var notes = {json.dumps(notes, ensure_ascii=False)};
  var W = 720, ML = 46, MT = 30, MB = 56, PLOT_W = 664, PLOT_H = 274;
  var all = [];
  rows.forEach(function (r) {{ ['pooled','ex_flood','discovery'].forEach(function (s) {{ if (r[s].mean != null) all.push(r[s].mean); }}); }});
  var lo = Math.floor(Math.min.apply(null, all.length ? all : [-2]) - 0.2);
  var hi = Math.ceil(Math.max.apply(null, all.length ? all : [1]) + 0.2);
  function Y(v) {{ return MT + (hi - v) / (hi - lo) * PLOT_H; }}
  var y0 = Y(0);
  function escHtml(s) {{ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }}
  function fmtPct(v) {{ if (v == null) return 'no data'; return (v >= 0 ? '+' : '\\u2212') + Math.abs(v).toFixed(2) + '%'; }}
  function render(series) {{
    var band = PLOT_W / rows.length, barW = 42, out = '';
    rows.forEach(function (r, i) {{
      var d = r[series];
      if (d.mean == null) return;
      var x = ML + i * band + (band - barW) / 2;
      var yTop = d.mean >= 0 ? Y(d.mean) : y0;
      var h = d.mean >= 0 ? y0 - Y(d.mean) : Y(d.mean) - y0;
      var fill = d.mean >= 0 ? '#2ebd85' : '#ef5468';
      var stroke = r.id === 'A0' ? ' stroke="#e879f9" stroke-width="2"' : '';
      var nTxt = d.n != null ? 'n=' + Math.round(d.n) : 'n=no data';
      var nNet = d.n_net != null ? ' (n_net=' + Math.round(d.n_net) + ')' : '';
      var tip = r.id + ' \\u2014 ' + r.label + '\\nMean net +4H: ' + fmtPct(d.mean) + '\\n' + nTxt + nNet;
      var labY = d.mean >= 0 ? yTop - 6 : yTop + h + 16;
      out += '<g><title>' + escHtml(tip) + '</title><rect x="' + x.toFixed(1) + '" y="' + yTop.toFixed(1) + '" width="' + barW + '" height="' + Math.max(h, 1).toFixed(1) + '" fill="' + fill + '"' + stroke + ' rx="2"/><text x="' + (x + barW / 2).toFixed(1) + '" y="' + labY.toFixed(1) + '" fill="#e8edf7" font-size="12" font-weight="700" text-anchor="middle">' + fmtPct(d.mean) + '</text></g>';
      var cx = ML + i * band + band / 2;
      out += '<text x="' + cx.toFixed(1) + '" y="326" fill="#e8edf7" font-size="12" font-weight="700" text-anchor="middle">' + escHtml(r.id) + '</text><text x="' + cx.toFixed(1) + '" y="342" fill="#7f8fa8" font-size="11" text-anchor="middle">' + escHtml(nTxt) + '</text>';
    }});
    document.getElementById('prism-chart-bars').innerHTML = out;
    var lang = 'en';
    try {{ lang = document.documentElement.lang === 'id' ? 'id' : 'en'; }} catch (e) {{}}
    document.getElementById('prism-chart-note').textContent = notes[series][lang];
    document.querySelectorAll('#prism-chart-toggles [data-series]').forEach(function (b) {{
      b.setAttribute('aria-pressed', String(b.getAttribute('data-series') === series));
    }});
  }}
  document.getElementById('prism-chart-toggles').addEventListener('click', function (e) {{
    var b = e.target.closest('[data-series]');
    if (b) render(b.getAttribute('data-series'));
  }});
  window.addEventListener('raptor:lang', function (e) {{
    var cur = document.querySelector('#prism-chart-toggles [aria-pressed="true"]');
    if (cur) render(cur.getAttribute('data-series'));
  }});
  // Initial note language: the page may load with raptorLang=id stored.
  (function () {{
    var lang = 'en';
    try {{ lang = document.documentElement.lang === 'id' ? 'id' : 'en'; }} catch (e) {{}}
    document.getElementById('prism-chart-note').textContent = notes.pooled[lang];
  }})();
}})();
</script>"""
    return f"""<div class="prism-chart-wrap">
<h3>{bi("Shadow Lab \u2014 mean net +4H per filter config (A0\u2013A9)", "Shadow Lab \u2014 rata-rata net +4J per config filter (A0\u2013A9)")}</h3>
<p class="panel-honest">{bi(warn_en, warn_id)}</p>
{_chart_svg(rows, "pooled")}
<div class="prism-chart-toggles" id="prism-chart-toggles" role="group" aria-label="Chart series">
<button type="button" class="prism-toggle" data-series="pooled" aria-pressed="true">{bi("Pooled", "Pooled")}</button>
<button type="button" class="prism-toggle" data-series="ex_flood" aria-pressed="false">{bi("Ex-flood", "Ex-flood")}</button>
<button type="button" class="prism-toggle" data-series="discovery" aria-pressed="false">{bi("Discovery (pre-flood closes only)", "Discovery (hanya close sebelum flood)")}</button>
</div>
<p class="prism-chart-note" id="prism-chart-note">{esc(notes["pooled"]["en"])}</p>
<script type="application/json" id="prism-chart-data">{data_json}</script>
{table}
<p class="panel-foot">{bi("Hover a bar for config, label, mean net +4H and n. No continuation-rate overlay: different denominator logic. Source: shadow_lab.json configs[].overall + configs[].discovery.", "Arahkan kursor ke batang untuk config, label, rata-rata net +4J, dan n. Tanpa overlay continuation rate: logika denominator berbeda. Sumber: shadow_lab.json configs[].overall + configs[].discovery.")}</p>
{script}
</div>"""


def _flood_text(state: dict) -> str:
    """'23 Nov 23:00 WIB, 294 of 436 signals, 67.43%' — all live."""
    L = state["learnings"]
    flood_ts = get(state["shadow"], "flood_close_ts")
    n = _num(get(L, "clusters", "concentration", "largest_close_n"))
    share = _num(get(L, "clusters", "concentration", "largest_close_share_pct"))
    total = _num(get(L, "n_analyzed"))
    if flood_ts is None or n is None or share is None or total is None:
        return "no data"
    return (f"{fmt_ts_wib_short(flood_ts)}, {int(n)} of {int(total)} "
            f"signals, {share:.2f}%")


def _section_identity(state: dict, agent: dict) -> str:
    cfgs = _configs(state)
    rows = []
    for c in cfgs:
        ov = c.get("overall") or {}
        rows.append(
            f'<tr><td class="cfg">{esc(c.get("id", "?"))}</td>'
            f'<td>{esc(c.get("label", ""))}</td>'
            f'<td class="num">{esc(c.get("rvol_min", "no data"))}</td>'
            f'<td class="num">{esc(c.get("lookback", "no data"))}</td>'
            f'<td>{esc(GATE_LABEL.get(c.get("extra_gate"), str(c.get("extra_gate"))))}</td>'
            f'<td class="num">{fmt_int(get(ov, "n"))}</td>'
            f'<td class="num">{fmt_int(c.get("dedup_suppressed"))}</td></tr>')
    table = ("<div class=\"prism-table-wrap\"><table class=\"prism-table\">"
             "<thead><tr><th>Config</th>"
             f"<th>{bi('Filter', 'Filter')}</th>"
             f"<th class=\"num\">{bi('RVOL \u2265', 'RVOL \u2265')}</th>"
             f"<th class=\"num\">{bi('Lookback', 'Lookback')}</th>"
             f"<th>{bi('Extra gate', 'Gate tambahan')}</th>"
             f"<th class=\"num\">{bi('Signals', 'Sinyal')}</th>"
             f"<th class=\"num\">{bi('Dedup suppressed', 'Dedup ditekan')}</th>"
             "</tr></thead><tbody>" + "".join(rows) + "</tbody></table></div>"
             if rows else
             f"<p>{bi('no data', 'no data')}</p>")
    role_en = agent.get("desc_en", "")
    role_id = agent.get("desc_id", "")
    return f"""<section class="agent-section" id="identity">
{section_head("AGENT 09 \u00b7 IDENTITY", "AGEN 09 \u00b7 IDENTITAS", "Identity & Specialization", "Identitas & Spesialisasi")}
{bip(role_en, role_id)}
{bip("PRISM\u2019s domain is the Shadow Lab \u2014 replaying published production signals under alternative filter configs (A0\u2013A9) to discover which filter rules and combinations improve +4H outcomes, with frozen hypotheses (LH1\u2013LH7) validated only on later closes. Research only: no production filter, no automatic scanner change, no gates.",
     "Domain PRISM adalah Shadow Lab \u2014 memutar ulang sinyal produksi yang diterbitkan dengan config filter alternatif (A0\u2013A9) untuk menemukan aturan dan kombinasi filter mana yang memperbaiki hasil +4J, dengan hipotesis beku (LH1\u2013LH7) yang divalidasi hanya pada close berikutnya. Hanya riset: tanpa filter produksi, tanpa perubahan scanner otomatis, tanpa gate.")}
<h3>{bi("Configs under test (frozen)", "Config yang diuji (beku)")}</h3>
{table}
<p class="panel-foot">{bi("Source: shadow_lab.json configs[] (labels, RVOL, lookback, extra gate, dedup_suppressed, overall n).", "Sumber: shadow_lab.json configs[] (label, RVOL, lookback, gate tambahan, dedup_suppressed, overall n).")}</p>
<p class="panel-honest"><strong>{bi("PRISM-specific finding in the research state: none.", "Temuan spesifik PRISM di research state: tidak ada.")}</strong> {bi("No finding, metric, or capability on this page is PRISM-specific \u2014 everything shown is the shared Shadow Lab / Ignition / split research that PRISM\u2019s domain (Filter Discovery & Optimization) works with. A missing datum is shown as \u201cno data\u201d, never estimated.", "Tidak ada temuan, metrik, atau kapabilitas di halaman ini yang spesifik PRISM \u2014 semua yang ditampilkan adalah riset bersama Shadow Lab / Ignition / split yang menjadi domain PRISM (Filter Discovery & Optimization). Datum yang tidak ada ditampilkan sebagai \u201cno data\u201d, tidak pernah diestimasi.")}</p>
</section>"""


def _section_overview(state: dict) -> str:
    L, S = state["learnings"], state["shadow"]
    n_an = _num(get(L, "n_analyzed"))
    n_ev = _num(get(L, "n_evaluable_30m"))
    win = _num(get(L, "overall", "win_rate_pct"))
    mean30 = _num(get(L, "overall", "mean_net30_pct"))
    med30 = _num(get(L, "overall", "median_net30_pct"))
    n_paired = _num(get(L, "checkpoints", "current_n_paired"))
    n_eval_cl = _num(get(L, "clusters", "n_evaluable_closes"))
    n_uniq_cl = _num(get(L, "clusters", "n_unique_closes"))
    cal = get(S, "calibration") or {}
    dedup = _num(get(cal, "dedup_vs_sent_log", "match_pct"))
    raw = _num(get(cal, "raw_vs_decisions", "match_pct"))
    n_missing = _num(get(cal, "dedup_vs_sent_log", "n_missing_in_replay"))
    n_replay_only = _num(get(cal, "dedup_vs_sent_log", "n_replay_only_not_sent"))
    outl = (get(L, "outliers", "contributions") or [None])[0] or {}
    out_sym, out_net = outl.get("symbol"), _num(outl.get("net_pct"))
    out_share = _num(outl.get("share_of_sum_pct"))
    flood = _flood_text(state)
    a0 = _cfg_by_id(state, "A0") or {}
    a0d = a0.get("discovery") or {}
    facts = [
        ("Signals analysed", "Sinyal dianalisis",
         fmt_int(n_an), "learnings.json n_analyzed"),
        ("Evaluable at +30m", "Dapat dievaluasi pada +30m",
         fmt_int(n_ev), "learnings.json n_evaluable_30m"),
        ("Win rate (+30m)", "Win rate (+30m)",
         fmt_pct(win), "learnings.json overall.win_rate_pct"),
        ("Mean net (+30m)", "Rata-rata net (+30m)",
         f"{fmt_pct(mean30)} (median {fmt_pct(med30)})",
         "learnings.json overall.mean_net30_pct / median_net30_pct"),
        ("Paired signals (all four horizons)", "Sinyal paired (keempat horizon)",
         fmt_int(n_paired), "learnings.json checkpoints.current_n_paired"),
        ("Evaluable closes / unique closes", "Close yang dapat dievaluasi / close unik",
         f"{fmt_int(n_eval_cl)} / {fmt_int(n_uniq_cl)}",
         "learnings.json clusters.n_evaluable_closes / n_unique_closes"),
        ("Replay calibration (dedup vs sent log)",
         "Kalibrasi replay (dedup vs sent log)",
         f"{fmt_pct(dedup)} ({fmt_int(n_missing)} missing in replay, "
         f"{fmt_int(n_replay_only)} replay-only not sent)",
         "shadow_lab.json calibration.dedup_vs_sent_log.match_pct"),
        ("Replay calibration (raw vs decisions)",
         "Kalibrasi replay (raw vs decisions)",
         fmt_pct(raw), "shadow_lab.json calibration.raw_vs_decisions.match_pct"),
        ("A0 baseline, discovery cohort", "A0 baseline, kohort discovery",
         f"{fmt_pct(get(a0d, 'mean_net4h_pct'))} mean net +4H \u00b7 "
         f"{fmt_pct(get(a0d, 'continuation_rate_pct'))} continuation "
         f"(n={fmt_int(get(a0d, 'n'))})",
         "shadow_lab.json configs[A0].discovery"),
    ]
    dl = "".join(
        f'<div><dt>{bi(a, b)}</dt><dd>{esc(v)}</dd>{src_line(s)}</div>'
        for a, b, v, s in facts)
    outlier_en = (f"One outlier dominates the mean: {out_sym} "
                  f"{fmt_pct(out_net)} contributes {fmt_pct(out_share)} of "
                  f"the summed net.") if out_sym else "no data"
    outlier_id = (f"Satu outlier mendominasi rata-rata: {out_sym} "
                  f"{fmt_pct(out_net)} menyumbang {fmt_pct(out_share)} "
                  f"dari total net.") if out_sym else "no data"
    return f"""<section class="agent-section" id="overview">
{section_head("RESEARCH OVERVIEW", "RINGKASAN RISET", "Research Overview", "Ringkasan Riset")}
{bip("The Shadow Lab is a replay simulation from local 4H candles \u2014 not production signals, not trading advice. A0 calibration must match the scanner at \u2265 99% before other configs are interpreted.",
     "Shadow Lab adalah simulasi replay dari candle 4J lokal \u2014 bukan sinyal produksi, bukan nasihat trading. Kalibrasi A0 harus cocok \u2265 99% dengan scanner sebelum config lain diinterpretasikan.")}
{bip("Cohort definitions change every number. Discovery = closes before the flood; validation = flood + later closes. A config that looks good on discovery must be confirmed on validation.",
     "Definisi kohort mengubah setiap angka. Discovery = close sebelum flood; validation = flood + close berikutnya. Config yang terlihat bagus di discovery harus dikonfirmasi di validation.")}
{bip(f"The flood fact, up front: one close \u2014 {flood} \u2014 produced those signals. Every pooled figure is flood-dominated; pooled, close-weighted, and ex-flood perspectives are shown side by side, and losing closes are never dropped.",
     f"Fakta flood, di depan: satu close \u2014 {flood} \u2014 menghasilkan sinyal-sinyal itu. Setiap angka pooled didominasi flood; perspektif pooled, close-weighted, dan ex-flood ditampilkan berdampingan, dan close yang merugi tidak pernah dibuang.")}
<dl class="facts">{dl}</dl>
<p class="panel-honest">{bi(outlier_en, outlier_id)} {bi("Signals on the same close share market conditions, so the effective sample is smaller than n.", "Sinyal pada close yang sama berbagi kondisi pasar, sehingga sampel efektif lebih kecil dari n.")}</p>
</section>"""


def _lh_gap_text(state: dict, h: dict) -> str:
    """Discovery gap vs A0, derived (not a stored field): stored config
    discovery value minus stored A0 discovery value."""
    a0 = _cfg_by_id(state, "A0") or {}
    a0d = a0.get("discovery") or {}
    cfg = _cfg_by_id(state, h.get("config", "")) or {}
    cd = cfg.get("discovery") or {}
    gm = _num(get(cd, "mean_net4h_pct"))
    am = _num(get(a0d, "mean_net4h_pct"))
    gc = _num(get(cd, "continuation_rate_pct"))
    ac = _num(get(a0d, "continuation_rate_pct"))
    gap_m = (gm - am) if (gm is not None and am is not None) else None
    gap_c = (gc - ac) if (gc is not None and ac is not None) else None
    n_c = _num(get(cd, "n"))
    n_a = _num(get(a0d, "n"))
    parts = []
    if gap_m is not None:
        parts.append(f"mean {fmt_pp(gap_m)}")
    if gap_c is not None:
        parts.append(f"continuation {fmt_pp(gap_c)}")
    n_txt = (f"({h.get('config', '?')} n={fmt_int(n_c)}, "
             f"A0 n={fmt_int(n_a)})")
    return (" \u00b7 ".join(parts) + " " + n_txt) if parts else "no data"


def _verdict_chip(status: str) -> str:
    if status == "holds":
        return '<span class="prism-verdict holds">HOLDS</span>'
    if status == "does_not_hold":
        return '<span class="prism-verdict nohold">DOES NOT HOLD</span>'
    if status == "inconclusive":
        return '<span class="prism-verdict incon">INCONCLUSIVE</span>'
    return f'<span class="prism-verdict">{esc(status or "no data")}</span>'


def _ph_ih_item(h: dict, kind: str) -> str:
    v = h.get("validation_after_created") or {}
    gap = _num(v.get("gap_pp"))
    ma, mb = _num(v.get("mean_a")), _num(v.get("mean_b"))
    na, nb = _num(v.get("n_a")), _num(v.get("n_b"))
    detail = (f"gap {fmt_pp(gap)} "
              f"(A {fmt_pct(ma)} n={fmt_int(na)} \u00b7 "
              f"B {fmt_pct(mb)} n={fmt_int(nb)})")
    text_en = h.get("text_en") or h.get("text") or ""
    text_id = h.get("text") or text_en
    return (f'<li><strong>{esc(h.get("id", "?"))}</strong> '
            f'({esc(h.get("feature", ""))} \u00b7 '
            f'{esc(h.get("metric", ""))}) \u2014 '
            f'{_verdict_chip(h.get("status", ""))}<br>'
            f'{bi(text_en, text_id)}<br>'
            f'<span style="color:var(--text-3);font-size:.85rem">{esc(detail)}'
            f'</span></li>')


def _section_latest(state: dict, bake_n_eval) -> str:
    L, S = state["learnings"], state["shadow"]
    ig = state["ignition"]
    recs = get(ig, "recommendations") or []
    n_rec = len(recs)
    n_rec_ins = sum(1 for r in recs
                    if (r.get("kind") or r.get("status")) == "INSUFFICIENT EVIDENCE")
    lhs = get(S, "hypotheses") or []
    n_lh = len(lhs)
    banner_en = (f"INSUFFICIENT EVIDENCE \u2014 no validated filter. "
                 f"All {n_rec} Ignition recommendations are INSUFFICIENT "
                 f"EVIDENCE ({n_rec_ins} of {n_rec}), all {n_lh} Shadow Lab "
                 f"hypotheses (LH1\u2013LH{n_lh}) are awaiting validation, "
                 f"and n={fmt_int(bake_n_eval)} is too small for "
                 f"out-of-sample or walk-forward validation. Every pattern "
                 f"below is an observation or hypothesis, not a conclusion.")
    banner_id = (f"INSUFFICIENT EVIDENCE \u2014 belum ada filter yang "
                 f"tervalidasi. Semua {n_rec} rekomendasi Ignition adalah "
                 f"INSUFFICIENT EVIDENCE ({n_rec_ins} dari {n_rec}), "
                 f"semua {n_lh} hipotesis Shadow Lab (LH1\u2013LH{n_lh}) "
                 f"menunggu validasi, dan n={fmt_int(bake_n_eval)} terlalu "
                 f"kecil untuk validasi out-of-sample atau walk-forward. "
                 f"Setiap pola di bawah ini adalah observasi atau hipotesis, "
                 f"bukan kesimpulan.")
    lh_rows = []
    lh1_flag = ""
    for h in lhs:
        gap_txt = _lh_gap_text(state, h)
        val = h.get("validation_after_created") or {}
        post = (f"post-freeze: baseline n={fmt_int(val.get('n_baseline'))}, "
                f"config n={fmt_int(val.get('n_config'))}")
        lh_rows.append(
            f'<tr><td class="cfg">{esc(h.get("id", "?"))}</td>'
            f'<td>{bi(h.get("text_en") or h.get("text") or "",
                       h.get("text") or h.get("text_en") or "")}</td>'
            f'<td>{esc(gap_txt)}</td>'
            f'<td><span class="chip">{esc((h.get("status") or "no data").upper().replace("_", " "))}</span><br>'
            f'<span style="color:var(--text-3);font-size:.8rem">{esc(post)}</span></td></tr>')
        # LH1 honesty flag: a directional mean_net4h claim whose
        # discovery gap is negative is NOT supported on the
        # pre-registered discovery cohort.
        if h.get("id") == "LH1" and h.get("kind") == "directional" \
                and h.get("metric") == "mean_net4h":
            a0 = _cfg_by_id(state, "A0") or {}
            a4 = _cfg_by_id(state, "A4") or {}
            gm = _num(get(a4.get("discovery") or {}, "mean_net4h_pct"))
            am = _num(get(a0.get("discovery") or {}, "mean_net4h_pct"))
            if gm is not None and am is not None and gm - am < 0:
                lh1_flag = bip(
                    f"Flag on LH1: its frozen claim is NOT supported on the "
                    f"pre-registered discovery cohort (A4 {fmt_pct(gm)} vs A0 "
                    f"{fmt_pct(am)}, gap {fmt_pp(gm - am)}). Its positive "
                    f"overall gap comes from the flood-dominated pool. Never "
                    f"read an LH claim without its status and gap.",
                    f"Tanda pada LH1: klaim bekunya TIDAK didukung kohort "
                    f"discovery yang sudah pra-registrasi (A4 {fmt_pct(gm)} vs "
                    f"A0 {fmt_pct(am)}, selisih {fmt_pp(gm - am)}). Selisih "
                    f"overall yang positif berasal dari pool yang didominasi "
                    f"flood. Jangan pernah membaca klaim LH tanpa status dan "
                    f"selisihnya.")
    lh_table = ("<div class=\"prism-table-wrap\"><table class=\"prism-table\">"
                "<thead><tr><th>ID</th>"
                f"<th>{bi('Claim (frozen)', 'Klaim (beku)')}</th>"
                f"<th>{bi('Discovery gap vs A0', 'Selisih discovery vs A0')}</th>"
                f"<th>{bi('Status', 'Status')}</th>"
                "</tr></thead><tbody>" + "".join(lh_rows) + "</tbody></table></div>"
                if lh_rows else f"<p>{bi('no data', 'no data')}</p>")
    ph_items = "".join(_ph_ih_item(h, "PH") for h in state["ph"])
    ih_items = "".join(_ph_ih_item(h, "IH") for h in state["ih"])
    nc = get(ig, "next_candle") or {}
    pooled = get(nc, "pooled") or {}
    exf = get(nc, "ex_flood") or {}
    return f"""<section class="agent-section" id="latest">
{section_head("LATEST INTELLIGENCE", "INTELIGENSI TERBARU", "Latest Intelligence", "Inteligensi Terbaru")}
<p class="panel-honest"><strong>{bi(banner_en, banner_id)}</strong></p>
<h3>{bi("Shadow Lab hypotheses LH1\u2013LH7 (frozen)", "Hipotesis Shadow Lab LH1\u2013LH7 (beku)")}</h3>
{lh_table}
{lh1_flag}
<p class="panel-foot">{bi("Discovery gap = stored config discovery value minus stored A0 discovery value (shadow_lab.json configs[].discovery); derived, not a stored field. Validation uses only closes after each hypothesis was created (25 Nov 2026 10:57 WIB).", "Selisih discovery = nilai discovery config tersimpan dikurangi nilai discovery A0 tersimpan (shadow_lab.json configs[].discovery); turunan, bukan field tersimpan. Validasi hanya memakai close setelah setiap hipotesis dibuat (25 Nov 2026 10:57 WIB).")}</p>
<h3>{bi("Ignition PH1\u2013PH6 (validation closes)", "Ignition PH1\u2013PH6 (close validasi)")}</h3>
<ul class="prism-list">{ph_items or "<li>no data</li>"}</ul>
<h3>{bi("Ignition IH1\u2013IH6 (validation closes)", "Ignition IH1\u2013IH6 (close validasi)")}</h3>
<ul class="prism-list">{ih_items or "<li>no data</li>"}</ul>
<p class="panel-honest">{bi("PH5 \u201cholds\u201d and IH5 \u201cholds\u201d are single descriptive validation reads, not validated filters \u2014 they still sit under the INSUFFICIENT EVIDENCE banner above. Nothing in this section is a recommendation: no ADD FILTER language. That route runs only through the weekly report on Raka\u2019s approval.", "PH5 \u201cholds\u201d dan IH5 \u201cholds\u201d adalah satu bacaan validasi deskriptif, bukan filter tervalidasi \u2014 keduanya tetap berada di bawah banner INSUFFICIENT EVIDENCE di atas. Tidak ada bagian di seksi ini yang merupakan rekomendasi: tanpa bahasa ADD FILTER. Jalur itu hanya lewat laporan mingguan atas persetujuan Raka.")}</p>
<h3>{bi("Ignition next candle (+4H)", "Ignition candle berikutnya (+4J)")}</h3>
<dl class="facts">
<div><dt>{bi("Pooled mean net (execution entry)", "Rata-rata net pooled (entry eksekusi)")}</dt><dd>{fmt_pct(get(pooled, "mean_net_exec_pct"))} \u00b7 continuation {fmt_pct(get(pooled, "continuation_rate_pct"))} (n={fmt_int(get(pooled, "n"))}, {fmt_int(get(pooled, "n_closes"))} closes)</dd>{src_line("learnings.json ignition_research.next_candle.pooled")}</div>
<div><dt>{bi("Ex-flood mean net (execution entry)", "Rata-rata net ex-flood (entry eksekusi)")}</dt><dd>{fmt_pct(get(exf, "mean_net_exec_pct"))} \u00b7 continuation {fmt_pct(get(exf, "continuation_rate_pct"))} (n={fmt_int(get(exf, "n"))}, n_net={fmt_int(get(exf, "n_net"))})</dd>{src_line("learnings.json ignition_research.next_candle.ex_flood")}</div>
<div><dt>{bi("Ignition recommendations", "Rekomendasi Ignition")}</dt><dd>{fmt_int(n_rec)} \u00d7 INSUFFICIENT EVIDENCE</dd>{src_line("learnings.json ignition_research.recommendations")}</div>
</dl>
</section>"""


def _section_metrics(state: dict) -> str:
    L, S, SP = state["learnings"], state["shadow"], state["split"]
    a0 = _cfg_by_id(state, "A0") or {}
    a0d, a0o = a0.get("discovery") or {}, a0.get("overall") or {}
    cal = get(S, "calibration") or {}
    kpis = [
        ("Signals analysed", "Sinyal dianalisis",
         fmt_int(get(L, "n_analyzed")), "learnings.json n_analyzed"),
        ("Evaluable at +30m", "Dapat dievaluasi +30m",
         fmt_int(get(L, "n_evaluable_30m")), "learnings.json n_evaluable_30m"),
        ("Win rate (+30m)", "Win rate (+30m)",
         fmt_pct(get(L, "overall", "win_rate_pct")),
         "learnings.json overall.win_rate_pct"),
        ("Mean net (+30m)", "Rata-rata net (+30m)",
         fmt_pct(get(L, "overall", "mean_net30_pct")),
         "learnings.json overall.mean_net30_pct"),
        ("A0 discovery mean net +4H", "A0 discovery rata-rata net +4J",
         fmt_pct(get(a0d, "mean_net4h_pct")),
         "shadow_lab.json configs[A0].discovery.mean_net4h_pct"),
        ("A0 discovery continuation", "A0 discovery continuation",
         fmt_pct(get(a0d, "continuation_rate_pct")),
         "shadow_lab.json configs[A0].discovery.continuation_rate_pct"),
        ("Replay calibration", "Kalibrasi replay",
         fmt_pct(get(cal, "dedup_vs_sent_log", "match_pct")),
         "shadow_lab.json calibration.dedup_vs_sent_log.match_pct"),
        ("Flood share (one close)", "Pangsa flood (satu close)",
         fmt_pct(get(L, "clusters", "concentration", "largest_close_share_pct")),
         "learnings.json clusters.concentration.largest_close_share_pct"),
    ]
    tiles = "".join(
        f'<div class="kpi"><p class="kpi-label">{bi(a, b)}</p>'
        f'<p class="kpi-value">{esc(v)}</p>'
        f'<p class="kpi-sub">{esc(s)}</p></div>'
        for a, b, v, s in kpis)
    groups = get(SP, "groups") or {}
    split_rows = []
    for key, label_en, label_id in (
            ("crypto", "CRYPTO", "CRYPTO"),
            ("stock_token", "SAHAM (stock_token)", "SAHAM (stock_token)"),
            ("other_traditional", "OTHER", "OTHER"),
            ("uncertain", "UNCERTAIN", "UNCERTAIN")):
        g = groups.get(key) or {}
        agg = g.get("aggregates") or {}
        pooled = agg.get("pooled") or {}
        exf = agg.get("ex_flood") or {}
        rec = g.get("reconciliation") or {}
        split_rows.append(
            f'<div><dt>{bi(label_en, label_id)}</dt>'
            f'<dd>{fmt_int(g.get("n"))} signals \u00b7 pooled mean net '
            f'{fmt_pct(get(pooled, "mean_net_exec_pct"))} \u00b7 ex-flood '
            f'{fmt_pct(get(exf, "mean_net_exec_pct"))} '
            f'(n={fmt_int(get(exf, "n"))})</dd>'
            f'{src_line("stock_crypto_split.json groups." + key + ".aggregates")}'
            f'</div>' if g else
            f'<div><dt>{bi(label_en, label_id)}</dt><dd>no data</dd></div>')
    split_total = _num(get(SP, "n_signals"))
    split_closes = _num(get(SP, "n_closes"))
    crypto = groups.get("crypto") or {}
    stock = groups.get("stock_token") or {}
    c_rec, s_rec = crypto.get("reconciliation") or {}, stock.get("reconciliation") or {}
    recon_en = (
        f"Reconciliation: CRYPTO {fmt_int(crypto.get('n'))} + SAHAM "
        f"{fmt_int(stock.get('n'))} + OTHER "
        f"{fmt_int((groups.get('other_traditional') or {}).get('n'))} + "
        f"UNCERTAIN {fmt_int((groups.get('uncertain') or {}).get('n'))} = "
        f"{fmt_int(split_total)} = split n_signals ({fmt_int(split_closes)} "
        f"closes). EMA known only from existing signal analyses (crypto "
        f"{fmt_int(c_rec.get('ema_known_n'))}/{fmt_int(crypto.get('n'))}, "
        f"stock {fmt_int(s_rec.get('ema_known_n'))}/{fmt_int(stock.get('n'))}); "
        f"OI from the daily archive with 1-day lag (crypto "
        f"{fmt_int(c_rec.get('oi_known_n'))}/{fmt_int(crypto.get('n'))}, "
        f"stock {fmt_int(s_rec.get('oi_known_n'))}/{fmt_int(stock.get('n'))}); "
        f"slices with n<5 are not reported.")
    recon_id = (
        f"Rekonsiliasi: CRYPTO {fmt_int(crypto.get('n'))} + SAHAM "
        f"{fmt_int(stock.get('n'))} + OTHER "
        f"{fmt_int((groups.get('other_traditional') or {}).get('n'))} + "
        f"UNCERTAIN {fmt_int((groups.get('uncertain') or {}).get('n'))} = "
        f"{fmt_int(split_total)} = split n_signals ({fmt_int(split_closes)} "
        f"close). EMA hanya dari analisis sinyal yang ada (crypto "
        f"{fmt_int(c_rec.get('ema_known_n'))}/{fmt_int(crypto.get('n'))}, "
        f"saham {fmt_int(s_rec.get('ema_known_n'))}/{fmt_int(stock.get('n'))}); "
        f"OI dari arsip harian dengan lag 1 hari (crypto "
        f"{fmt_int(c_rec.get('oi_known_n'))}/{fmt_int(crypto.get('n'))}, "
        f"saham {fmt_int(s_rec.get('oi_known_n'))}/{fmt_int(stock.get('n'))}); "
        f"potongan n<5 tidak dilaporkan.")
    return f"""<section class="agent-section" id="metrics">
{CHART_STYLE}
{section_head("RELEVANT METRICS & INTERACTIVE CHARTS", "METRIK RELEVAN & GRAFIK INTERAKTIF", "Relevant Metrics & Interactive Charts", "Metrik Relevan & Grafik Interaktif")}
<div class="kpis">{tiles}</div>
{_chart_html(state, _flood_text(state))}
<h3>{bi("SAHAM vs CRYPTO \u2014 kept separate, never merged", "SAHAM vs CRYPTO \u2014 tetap terpisah, tidak pernah digabung")}</h3>
<dl class="facts">{''.join(split_rows)}</dl>
<p class="panel-foot">{bi(recon_en, recon_id)}</p>
</section>"""


def _section_history(state: dict) -> str:
    L, S = state["learnings"], state["shadow"]
    ls = get(L, "learning_summary") or {}
    worked = ls.get("worked") or []
    failed = ls.get("failed") or []
    inconclusive = ls.get("inconclusive") or []
    based = ls.get("based_on") or {}
    lh_created = None
    for h in get(S, "hypotheses") or []:
        if h.get("created_ts"):
            lh_created = fmt_ts_wib(h.get("created_ts"))
            break
    ph_created = None
    for h in state["ph"]:
        if h.get("created_ts"):
            ph_created = fmt_ts_wib(h.get("created_ts"))
            break
    ih_created = None
    for h in state["ih"]:
        if h.get("created_ts"):
            ih_created = fmt_ts_wib(h.get("created_ts"))
            break
    base = state["baseline"]
    base_n = _num(get(base, "coverage", "n_analyzed"))
    base_at = base.get("captured_at") or "no data"
    cps = get(L, "checkpoints", "reached") or []
    cp_txt = (f"{len(cps)} checkpoints reached (40 / 60 / 100) \u2014 progress "
              f"markers only, not significance claims; current n_paired = "
              f"{fmt_int(get(L, 'checkpoints', 'current_n_paired'))}.")
    cp_txt_id = (f"{len(cps)} checkpoint tercapai (40 / 60 / 100) \u2014 hanya "
                 f"penanda progres, bukan klaim signifikansi; n_paired saat "
                 f"ini = {fmt_int(get(L, 'checkpoints', 'current_n_paired'))}.")
    worked_items = "".join(
        f"<li>{esc(w.get('text_en') or w.get('text') or '')} "
        f"[{esc(w.get('topic', ''))}]</li>" for w in worked)
    failed_items = "".join(
        f"<li>{esc(w.get('text_en') or w.get('text') or '')} "
        f"[{esc(w.get('topic', ''))}]</li>" for w in failed)
    incon_items = "".join(
        f"<li>{esc(w.get('text_en') or w.get('text') or '')} "
        f"[{esc(w.get('topic', ''))}]</li>" for w in inconclusive)
    topics = (ls.get("topics") or {})
    topic_items = "".join(
        f"<li><strong>{esc(t.get('label_en') or t.get('label') or k)}</strong>"
        f" \u2014 {esc(t.get('detail_en') or t.get('detail') or 'no data')}</li>"
        for k, t in topics.items() if isinstance(t, dict))
    return f"""<section class="agent-section" id="history">
{section_head("HISTORICAL FINDINGS", "TEMUAN HISTORIS", "Historical Findings", "Temuan Historis")}
{bip("No PRISM-over-time series exists in the state, so there is no trend / history chart. This section is a dated list of frozen verdicts, not a timeline.",
     "Tidak ada deret waktu per-agen PRISM di state, jadi tidak ada grafik tren / histori. Seksi ini adalah daftar verdict beku ber-tanggal, bukan timeline.")}
<ul class="prism-list">
<li><strong>{esc(lh_created or "no data")}</strong> \u2014 {bi("LH1\u2013LH7 frozen (awaiting_validation); validation uses only closes after creation.", "LH1\u2013LH7 dibekukan (awaiting_validation); validasi hanya memakai close setelah pembuatan.")}</li>
<li><strong>{esc(ph_created or "no data")}</strong> \u2014 {bi("PH1\u2013PH6 frozen and first-validated: PH5 holds, PH1/PH2/PH3/PH6 do not hold, PH4 inconclusive (validation closes only; flood-dominated).", "PH1\u2013PH6 dibekukan dan divalidasi pertama kali: PH5 holds, PH1/PH2/PH3/PH6 do not hold, PH4 inconclusive (hanya close validasi; didominasi flood).")}</li>
<li><strong>{esc(ih_created or "no data")}</strong> \u2014 {bi("IH1\u2013IH6 first-validated: IH5 holds, IH3 inconclusive, the rest do not hold.", "IH1\u2013IH6 divalidasi pertama kali: IH5 holds, IH3 inconclusive, sisanya do not hold.")}</li>
<li><strong>23 Nov 2026</strong> \u2014 {bi(f"7-day observation baseline (week-0) frozen; n_analyzed = {fmt_int(base_n)} at capture ({esc(str(base_at))}). {cp_txt}", f"Baseline observasi 7 hari (week-0) dibekukan; n_analyzed = {fmt_int(base_n)} saat capture ({esc(str(base_at))}). {cp_txt_id}")}</li>
</ul>
<h3>{bi("Learning summary", "Ringkasan pembelajaran")}</h3>
{bip(f"Based on n_analyzed={fmt_int(based.get('n_analyzed'))}, n_evaluable_30m={fmt_int(based.get('n_evaluable_30m'))}, n_paired={fmt_int(based.get('n_paired'))}. No finding \u201cworked\u201d as a filter claim \u2014 the {len(worked)} \u201cworked\u201d items below are reversal-marker consistencies, not filter recommendations.",
     f"Berdasarkan n_analyzed={fmt_int(based.get('n_analyzed'))}, n_evaluable_30m={fmt_int(based.get('n_evaluable_30m'))}, n_paired={fmt_int(based.get('n_paired'))}. Tidak ada temuan yang \u201cworked\u201d sebagai klaim filter \u2014 {len(worked)} item \u201cworked\u201d di bawah ini adalah konsistensi marker reversal, bukan rekomendasi filter.")}
<p><strong>{bi(f"Worked ({len(worked)})", f"Worked ({len(worked)})")}</strong></p>
<ul class="prism-list">{worked_items or "<li>no data</li>"}</ul>
<p><strong>{bi(f"Failed / no clear association ({len(failed)})", f"Gagal / tanpa asosiasi jelas ({len(failed)})")}</strong></p>
<ul class="prism-list">{failed_items or "<li>no data</li>"}</ul>
<p><strong>{bi(f"Inconclusive / no data ({len(inconclusive)})", f"Inconclusive / no data ({len(inconclusive)})")}</strong></p>
<ul class="prism-list">{incon_items or "<li>no data</li>"}</ul>
<h3>{bi("Topics", "Topik")}</h3>
<ul class="prism-list">{topic_items or "<li>no data</li>"}</ul>
<p class="panel-foot">{bi("Source: learnings.json learning_summary + checkpoints; shadow_lab.json hypotheses; ignition/hypotheses_ph.json; observation_baseline.json. Do not present the flood close (294 signals) as 294 independent pieces of evidence \u2014 it is one market condition.", "Sumber: learnings.json learning_summary + checkpoints; shadow_lab.json hypotheses; ignition/hypotheses_ph.json; observation_baseline.json. Jangan sajikan close flood (294 sinyal) sebagai 294 bukti independen \u2014 itu satu kondisi pasar.")}</p>
</section>"""


def _section_evidence(state: dict, bake_ts: str) -> str:
    L, S, SP = state["learnings"], state["shadow"], state["split"]
    ig = state["ignition"]
    asof = state["asof"]
    grep = state["grep_counts"]
    grep_total = state["grep_total"]
    if grep_total == 0:
        honesty = HONESTY_EN
        honesty_id = HONESTY_ID
        grep_result = ("0 hits in every file; a repo-wide grep -ri 'prism' "
                       "over research/state/ (*.json, *.jsonl) also returned "
                       "no matching file.")
        grep_result_id = ("0 hit di setiap file; grep -ri 'prism' di seluruh "
                          "research/state/ (*.json, *.jsonl) juga tidak "
                          "menemukan file yang cocok.")
    else:
        per_file = ", ".join(
            f"{f}: {c}" for f, c in grep.items() if c)
        honesty = (f"PRISM appears {grep_total} time(s) in the research "
                   f"state ({per_file}) \u2014 see the grep counts below. "
                   f"Nothing on this page presents a shared-lab result as "
                   f"PRISM\u2019s own discovery.")
        honesty_id = (f"PRISM muncul {grep_total} kali di research state "
                      f"({per_file}) \u2014 lihat hitungan grep di bawah. "
                      f"Tidak ada di halaman ini yang menyajikan hasil lab "
                      f"bersama sebagai penemuan PRISM sendiri.")
        grep_result = f"{grep_total} hit(s) in total ({per_file})."
        grep_result_id = f"Total {grep_total} hit ({per_file})."
    grep_cmd = ("grep -ri -c 'prism' \\\n"
                "  ~/workspace/pump-hunter-alerts/research/state/shadow_lab.json \\\n"
                "  ~/workspace/pump-hunter-alerts/research/state/hypotheses.json \\\n"
                "  ~/workspace/pump-hunter-alerts/research/state/learnings.json \\\n"
                "  ~/workspace/pump-hunter-alerts/research/state/ignition/hypotheses.json \\\n"
                "  ~/workspace/pump-hunter-alerts/research/state/ignition/hypotheses_ph.json \\\n"
                "  ~/workspace/pump-hunter-alerts/research/state/stock_crypto_split.json \\\n"
                "  ~/workspace/pump-hunter-alerts/research/state/asset_class.json")
    n_eval = _num(get(L, "n_evaluable_30m"))
    n_uniq = _num(get(L, "clusters", "n_unique_closes"))
    n_eval_cl = _num(get(L, "clusters", "n_evaluable_closes"))
    flood_share = _num(get(L, "clusters", "concentration", "largest_close_share_pct"))
    caveats = [
        ("Descriptive only, flood-dominated: one close = "
         f"{fmt_pct(flood_share)} of signals. Pooled / close-weighted / "
         "ex-flood side by side; losing closes never dropped.",
         "Hanya deskriptif, didominasi flood: satu close = "
         f"{fmt_pct(flood_share)} sinyal. Pooled / close-weighted / ex-flood "
         "berdampingan; close yang merugi tidak pernah dibuang."),
        (f"No validated filter: {len(get(ig, 'recommendations') or [])} \u00d7 "
         "INSUFFICIENT EVIDENCE; 7 \u00d7 awaiting_validation; "
         f"n={fmt_int(n_eval)} too small for out-of-sample or walk-forward "
         "validation.",
         f"Belum ada filter tervalidasi: {len(get(ig, 'recommendations') or [])} \u00d7 "
         "INSUFFICIENT EVIDENCE; 7 \u00d7 awaiting_validation; "
         f"n={fmt_int(n_eval)} terlalu kecil untuk validasi out-of-sample "
         "atau walk-forward."),
        (f"Outcomes are not fully independent (same-close signals share "
         f"market conditions; effective sample < n; {fmt_int(n_eval_cl)} "
         "evaluable closes).",
         f"Hasil tidak sepenuhnya independen (sinyal pada close yang sama "
         f"berbagi kondisi pasar; sampel efektif < n; {fmt_int(n_eval_cl)} "
         "close yang dapat dievaluasi)."),
        ("Entry is a simulation: buy at ask +5bps slippage on the signal "
         "close; the close is a benchmark, not a guaranteed execution "
         "price. Funding NOT in net (Oct 2026 measured bounds: single-8h "
         "|funding| median 0.0050%, p95 0.0840%, max 2.00%).",
         "Entry adalah simulasi: beli di ask +5bps slippage pada close "
         "sinyal; close adalah benchmark, bukan harga eksekusi yang "
         "dijamin. Funding TIDAK masuk net (batas terukur Okt 2026: "
         "single-8h |funding| median 0,0050%, p95 0,0840%, maks 2,00%)."),
        (f"Close-count reconciliation: learnings {fmt_int(n_uniq)} unique "
         f"closes \u00b7 ignition {fmt_int(get(ig, 'n_closes'))} \u00b7 Shadow "
         f"Lab {fmt_int(get(S, 'n_closes'))} (incl. backfill-only) \u00b7 split "
         f"{fmt_int(get(SP, 'n_closes'))} \u2014 different universes, do not "
         "force them to match.",
         f"Rekonsiliasi jumlah close: learnings {fmt_int(n_uniq)} close unik "
         f"\u00b7 ignition {fmt_int(get(ig, 'n_closes'))} \u00b7 Shadow Lab "
         f"{fmt_int(get(S, 'n_closes'))} (termasuk backfill-only) \u00b7 split "
         f"{fmt_int(get(SP, 'n_closes'))} \u2014 universe berbeda, jangan "
         "dipaksakan sama."),
        (f"Snapshot timing: only learnings.json ({asof['learnings_mtime']}) "
         f"reflects the latest close; Shadow Lab ({asof['shadow']}), "
         f"Ignition ({asof['ignition']}), split ({asof['split']}) may predate "
         "it. Figures from different files are different snapshots \u2014 "
         "label each figure with its source file.",
         f"Waktu snapshot: hanya learnings.json ({asof['learnings_mtime']}) "
         f"yang mencerminkan close terbaru; Shadow Lab ({asof['shadow']}), "
         f"Ignition ({asof['ignition']}), split ({asof['split']}) mungkin "
         f"lebih lama. Angka dari file berbeda adalah snapshot berbeda \u2014 "
         "beri label sumber file pada setiap angka."),
        ("No PRISM-specific finding exists (grep 0 hits) \u2014 no "
         "shared-lab result may be presented as PRISM\u2019s own discovery.",
         "Tidak ada temuan spesifik PRISM (grep 0 hit) \u2014 tidak ada hasil "
         "lab bersama yang boleh disajikan sebagai penemuan PRISM sendiri."),
        ("Research freeze active \u2014 this page is frontend only: no "
         "scanner / strategy / filter / research-logic change, no state "
         "file written, $0 spent.",
         "Freeze riset aktif \u2014 halaman ini hanya frontend: tanpa "
         "perubahan scanner / strategi / filter / logika riset, tanpa file "
         "state yang ditulis, $0 dikeluarkan."),
    ]
    caveat_items = "".join(
        f"<li>{bi(a, b)}</li>" for a, b in caveats)
    missing = [
        ("No PRISM-specific finding, metric, or capability exists in the "
         "research state.",
         "Tidak ada temuan, metrik, atau kapabilitas spesifik PRISM di "
         "research state."),
        ("No per-agent time series (no trend chart).",
         "Tidak ada deret waktu per-agen (tanpa grafik tren)."),
        ("No November funding data (archive lands in December \u2014 "
         "October bounds only).",
         "Tidak ada data funding November (arsip terbit Desember \u2014 hanya "
         "batas Oktober)."),
        ("No BTC TRENDING_UP signals yet; no funding-rate finding (no_data).",
         "Belum ada sinyal BTC TRENDING_UP; tidak ada temuan funding rate "
         "(no_data)."),
        ("No OI data for the newest signals (daily archive, 1-day lag).",
         "Tidak ada data OI untuk sinyal terbaru (arsip harian, lag 1 hari)."),
        ("Validation data for LH1\u2013LH7 is ~empty (2 baseline closes; "
         "0\u20134 config signals post-freeze).",
         "Data validasi LH1\u2013LH7 hampir kosong (2 close baseline; 0\u20134 "
         "sinyal config pasca-freeze)."),
        (f"{fmt_int((_num(get(L, 'n_analyzed')) or 0) - (_num(get(L, 'n_evaluable_30m')) or 0))} "
         "of the analysed signals still have no +30m outcome yet.",
         f"{fmt_int((_num(get(L, 'n_analyzed')) or 0) - (_num(get(L, 'n_evaluable_30m')) or 0))} "
         "dari sinyal yang dianalisis masih belum punya outcome +30m."),
    ]
    missing_items = "".join(f"<li>{bi(a, b)}</li>" for a, b in missing)
    return f"""<section class="agent-section" id="evidence">
{section_head("EVIDENCE & RESEARCH LIMITATIONS", "BUKTI & BATASAN RISET", "Evidence & Research Limitations", "Bukti & Batasan Riset")}
<h3>{bi("Provenance", "Provenans")}</h3>
<dl class="facts">
<div><dt>shadow_lab.json</dt><dd>{bi("Configs A0\u2013A9, LH1\u2013LH7, calibration. Generated", "Config A0\u2013A9, LH1\u2013LH7, kalibrasi. Dibuat")} {esc(asof['shadow'])}.</dd>{src_line("~/workspace/pump-hunter-alerts/research/state/shadow_lab.json")}</div>
<div><dt>learnings.json</dt><dd>{bi("Totals, ignition_research, validation_status. Updated", "Total, ignition_research, validation_status. Diperbarui")} {esc(asof['learnings'])}.</dd>{src_line("~/workspace/pump-hunter-alerts/research/state/learnings.json")}</div>
<div><dt>ignition/hypotheses_ph.json</dt><dd>{bi("PH1\u2013PH6. File modified", "PH1\u2013PH6. File diubah")} {esc(asof['ph_mtime'])}.</dd>{src_line("~/workspace/pump-hunter-alerts/research/state/ignition/hypotheses_ph.json")}</div>
<div><dt>stock_crypto_split.json + asset_class.json</dt><dd>{bi("SAHAM vs CRYPTO split. Split generated", "Split SAHAM vs CRYPTO. Split dibuat")} {esc(asof['split'])}.</dd>{src_line("~/workspace/pump-hunter-alerts/research/state/stock_crypto_split.json")}</div>
<div><dt>hypotheses.json</dt><dd>{bi("Top-level registry is EMPTY (entries: []) and learnings.json hypothesis_registry.n_registered = 0. LH1\u2013LH7 live ONLY in shadow_lab.json \u2014 do not cite hypotheses.json as their source.", "Registri tingkat atas KOSONG (entries: []) dan learnings.json hypothesis_registry.n_registered = 0. LH1\u2013LH7 hanya ada di shadow_lab.json \u2014 jangan jadikan hypotheses.json sebagai sumbernya.")}</dd>{src_line("~/workspace/pump-hunter-alerts/research/state/hypotheses.json")}</div>
</dl>
<h3>{bi("PRISM grep", "Grep PRISM")}</h3>
<code class="prism-code">{esc(grep_cmd)}</code>
<p>{bi("Result: ", "Hasil: ")}{bi(grep_result, grep_result_id)} {bi("This matches the Stage 6d cross-check (21/21 panel figures, \u201cPRISM-specific finding: none (grep 0 hits)\u201d).", "Ini cocok dengan cross-check Stage 6d (21/21 angka panel, \u201cPRISM-specific finding: none (grep 0 hits)\u201d).")}</p>
<h3>{bi("Caveats", "Caveat")}</h3>
<ul class="prism-list">{caveat_items}</ul>
<h3>{bi("Missing data \u2014 shown as \u201cno data\u201d, never filled in", "Data yang tidak ada \u2014 ditampilkan sebagai \u201cno data\u201d, tidak pernah diisi")}</h3>
<ul class="prism-list">{missing_items}</ul>
<p class="panel-honest"><strong>{bi(honesty, honesty_id)}</strong></p>
<p class="panel-foot">{bi(f"Snapshot baked from the research state on {bake_ts}. Figures are a static snapshot; the live research state may have moved since this build.", f"Snapshot dibuat dari research state pada {bake_ts}. Angka-angka adalah snapshot statis; research state live mungkin sudah bergerak sejak build ini.")}</p>
</section>"""


def build_prism_sections(state: dict, agent: dict, bake_ts: str) -> str:
    """Sections 2-7 for PRISM, in order. Section 1 (character stage)
    lives in the shared template."""
    n_eval = _num(get(state["learnings"], "n_evaluable_30m"))
    return "\n".join([
        _section_identity(state, agent),
        _section_overview(state),
        _section_latest(state, n_eval),
        _section_metrics(state),
        _section_history(state),
        _section_evidence(state, bake_ts),
    ])


def build_generic_sections(agent: dict) -> str:
    """Fallback for a future live agent with no content builder yet:
    honest 'no data' sections, never invented content."""
    head = section_head("IDENTITY", "IDENTITAS",
                        "Identity & Specialization", "Identitas & Spesialisasi")
    return f"""<section class="agent-section" id="identity">
{head}
{bip(f"{agent.get('name', 'This agent')} has no research content baked yet. No finding is shown rather than an invented one.",
     f"{agent.get('name', 'Agen ini')} belum punya konten riset yang di-bake. Tidak ada temuan yang ditampilkan daripada temuan yang dikarang.")}
<p class="panel-honest">{bi("no data", "no data")}</p>
</section>"""


def build_agent_sections(agent: dict, state: dict, bake_ts: str) -> str:
    if agent.get("slug") == "prism":
        return build_prism_sections(state, agent, bake_ts)
    return build_generic_sections(agent)


# ---------------------------------------------------------------------------
# Public entry point + standalone CLI
# ---------------------------------------------------------------------------

def build_all(dist_dir, config_path, research_state_dir):
    """Render the agents directory + one page per live agent.

    dist_dir: output root (e.g. dist/); config_path: assets/agents/
    config.json; research_state_dir: research/state/ (read fresh on
    every run). Returns a summary dict. Import-safe: no side effects
    on import; all work happens here.
    """
    dist_dir = Path(dist_dir)
    config_path = Path(config_path)
    agents_dir = config_path.parent
    with config_path.open(encoding="utf-8") as f:
        cfg = json.load(f)
    agents = cfg.get("agents", [])
    template = (agents_dir / "template.html").read_text(encoding="utf-8")
    dir_template = (agents_dir / "directory-template.html").read_text(encoding="utf-8")
    state = load_research_state(research_state_dir)
    bake_ts = now_wib_str()

    copy_agents_assets(agents_dir, dist_dir / "assets" / "agents")

    agents_out = dist_dir / "agents"
    agents_out.mkdir(parents=True, exist_ok=True)
    dir_html = (dir_template
                .replace("{{ASSET_BASE}}", "../assets/")
                .replace("{{SITE_BASE}}", "../")
                .replace("{{AGENT_CARDS_HTML}}", build_directory_cards(agents))
                .replace("{{CONFIG_URL}}", "../assets/agents/config.json"))
    _check_no_placeholders(dir_html, "directory")
    (agents_out / "index.html").write_text(dir_html, encoding="utf-8")

    built = []
    for agent in agents:
        if agent.get("status") != "live":
            continue
        sections = build_agent_sections(agent, state, bake_ts)
        roster = build_roster(agents, current_slug=agent.get("slug", ""))
        page = render_agent_page(template, agent, cfg, sections, roster)
        out = agents_out / agent.get("slug", "") / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(page, encoding="utf-8")
        built.append(agent.get("slug", ""))
    return {
        "version": MODULE_VERSION,
        "dist_dir": str(dist_dir),
        "agents_built": built,
        "directory": str(agents_out / "index.html"),
        "bake_ts_wib": bake_ts,
        "state": {
            "n_analyzed": get(state["learnings"], "n_analyzed"),
            "n_evaluable_30m": get(state["learnings"], "n_evaluable_30m"),
            "prism_grep_total": state["grep_total"],
        },
    }


def main(argv=None) -> int:
    p = argparse.ArgumentParser(
        description="Build Raptor Trade /agents/ pages (framework v1.0.0).")
    p.add_argument("--out", required=True, help="output dir (dist root)")
    p.add_argument("--config", required=True,
                   help="path to assets/agents/config.json")
    p.add_argument("--state", required=True,
                   help="research state dir (read fresh, never written)")
    args = p.parse_args(argv)
    summary = build_all(args.out, args.config, args.state)
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
