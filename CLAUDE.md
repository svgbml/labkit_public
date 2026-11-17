# Labkit BML: working rules

Lab calculator and gel-editor web app (Dutch first, English via a runtime translation layer), published to GitHub Pages from `web/` and packaged for Windows with Tauri.

## Roadmap work
- The plan lives in `docs/ROADMAP.md`: steps `S1`–`S146` of ~30 minutes each; idea numbers (`#n`) refer to `docs/ideas.md`.
- Do exactly the steps you are asked to do, in order. If a step depends on one that isn't done (*needs Sx*), stop and report that instead of doing both.
- After each step: run `python tools/check.py --quick`; it must pass. At the end of a phase (or when asked), run the full `python tools/check.py`.
- Mark the step ✅ in `docs/ROADMAP.md` (add a one-line note if something was left out), then **commit once per step** with the message `S<n>: <short summary>`.
- Work on the branch you were started on. Never push to or merge into `main`; never change GitHub Pages or release settings.
- If a step turns out much bigger than 30 minutes, finish a sensible part, mark it 🔨 with what is left, and stop.

## How the app is built
- `web/index.html` is both source and build output (~830 KB). Older tools are edited in place.
- Newer tools are modules in `tools/nt/` (`NN_id.json` + `.html` + `.js`), injected by `python tools/insert_tools.py` between `<!-- NT:id -->` / `/* NT:id */` markers. **Never edit inside those markers in `index.html`**: change the module file and re-run the insert. A module with `"lib":true` is JS only.
- New features of the UX layer go in `tools/nt/99z_ux.js`; generated data in `tools/nt/98_valid.js` comes from `python tools/build_validated.py`.
- Removing a tool: delete its module files, then also remove its id from `const TOOLS=[…]`, `const TAGS={…}` and `SYN` in `tools/nt/99_app.js` (insert_tools does not remove those).

## Translation (Dutch → English)
- All UI text is written in Dutch. Every new Dutch string needs an entry in `i18n/en.json` (append; keep the existing order), then `python tools/build_i18n.py` (writes `web/i18n-en.js` and the cache hash).
- Numbers in text become `{#}` in keys. Dynamic values inside a sentence must be wrapped with `ud(value)` so the key gets `{*}`; text that must never be translated gets `data-notr`.
- `tests/i18n_collect.py` fails on any untranslated string.

## Tests
- `tests/validate.py` (results against published reference data; writes `tests/VALIDATIE.md`), `tests/layout_audit.py`, `tests/robust_audit.py`, `tests/i18n_collect.py`, `tests/perf_budget.py`.
- Setup: `pip install playwright==1.48.0 scipy statsmodels scikit-posthocs opencv-python-headless numpy && python -m playwright install --with-deps chromium`.
- New calculations need a validation case in `tests/validate.py` with a cited source.

## Conventions
- No external libraries or CDNs: everything stays in `web/`, works offline and from `file://`.
- Use the existing helpers (`$`, `$$`, `num`, `esc`, `note`, `appModal`, `toolSnap`/`toolApply`, `lkMainWatch`, `jget`/`jset`) and theme variables (`--accent`, `--surface`, …) so all themes keep working.
- Version bumps only via `python tools/bump_version.py x.y.z`, and only when asked.
