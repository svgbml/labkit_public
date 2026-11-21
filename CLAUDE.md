# Labkit BML: working rules

Lab calculator and gel-editor web app (Dutch first, English via a dictionary looked up at runtime), published to GitHub Pages from `web/` and packaged for Windows with Tauri. Every tool is a Vue 3 component; all code lives in `src/` and is built into one generated `web/index.html`.

## Skills
These skills are on the account, so cloud sessions have them too.
- Before starting a task, check the available skills and use every one that fits the task, instead of doing it from scratch.
- Always use the ponytail skill (full level) for coding tasks.
- Whenever you write or edit prose meant for readers (documents, reports, emails, articles, README/docs text, Markdown or HTML prose), finish it with the humanizer skill and then the clean-user-facing-text skill. Not for code, commands, short chat replies, or translation keys in `i18n/en.json`.
- Whenever you write, outline, revise or review fiction or other narrative creative writing, use the storyscope-fiction skill first (plan and draft with it), then humanizer and clean-user-facing-text as above.
- If a `graphify-out/` knowledge graph exists, read `graphify-out/GRAPH_REPORT.md` first and use the graph to find files before searching by hand. Don't build one unless asked.

## Roadmap work
- The plan lives in `docs/ROADMAP.md`: steps `S0`–`S272` (plus `S204a`) of ~30 minutes each; idea numbers (`#n`) refer to `docs/ideas.md`.
- Work comes in **batches** (the *Cloud sessions* table in the roadmap): one cloud session does one batch, in order, on the batch's lead model. Steps in the batch whose *Model* column is cheaper go to a subagent of that model; a step never runs on a cheaper model than its column says.
- New tools are built as Vue components in `src/tools/`, with imports, not as global code.
- Do exactly the steps you are asked to do, in order. If a step depends on one that isn't done (*needs Sx*), stop and report that instead of doing both.
- After each step: run `python tools/check.py --quick`; it must pass. At the end of a phase (or when asked), run the full `python tools/check.py`.
- Mark the step ✅ in `docs/ROADMAP.md` (add a one-line note if something was left out), then **commit once per step** with the message `S<n>: <short summary>`.
- Work on the branch you were started on. Never push to or merge into `main`; never change GitHub Pages or release settings.
- If a step turns out much bigger than 30 minutes, finish a sensible part, mark it 🔨 with what is left, and stop.

## Cloud runs and model use
- A cloud session cannot choose its own model, so it runs on the environment's default. This account is on a plan where every session shares one usage limit, so **hand mechanical work to cheaper subagents** (`Agent` with `model: "haiku"` or `"sonnet"`) and keep the expensive reasoning for yourself.
- **Haiku:** collecting lists (tool ids, names, existing strings), bulk searches, running a test suite and reporting its output, repeating one clearly-specified edit across many files, drafting translations for strings you hand over.
- **Sonnet:** a self-contained step whose design is already settled, writing a validation case from a source you name, moving a tool onto a layout that already exists.
- **Yourself:** designing a new tool or layout, anything touching the i18n rules, the gel editor, performance work, and any step where you still have to decide what "done" means.
- Check a subagent's work before committing it, and run `python tools/check.py --quick` yourself rather than trusting a report of it.
- At most about three subagents at a time; parallel work multiplies usage instead of saving it.

## How the app is built
- **`web/index.html` is generated; never edit it by hand.** Its source is `src/shell/index.html`: the head, the nav, one small inline script (the language pick, which loads `web/i18n-en.js` with `document.write` when the language is English) and `<!-- @include … -->` lines for `src/shell/styles/app.css` and every tool section in `src/shell/sections/<id>.html`. The `<!-- @bundle -->` line becomes the Vite bundle, which holds **all JavaScript**.
- `npm run build` writes everything: `tools/build_validated.py`, then Vite (`src/` → `build/app.bundle.js`), then `python tools/build.py` (`build_i18n.py` + `build_html.py`). After a change to `en.json` only, `python tools/build.py` is enough. CI runs a fresh `vite build` and `python tools/build.py --check`, and fails when the committed `build/app.bundle.js` or `web/index.html` is out of date, so commit both with your change.
- **No `dist/`, no code splitting, no dynamic `import()`.** `web/index.html` must work from `file://` and every test suite opens it that way; ES modules are blocked from `file://`. So the bundle is one IIFE without hash, inlined into the page, and `web/sw.js` knows nothing about it.
- Vue is in the bundle and the bundle is in `index.html`, so its MIT notice is a banner in the code; the full text is in `licenses/vue-LICENSE.txt`. In lib mode Vite does not replace `process.env.NODE_ENV` itself; the `define` in `vite.config.js` does, and without it the app fails with "process is not defined".

## Where the code is
- `src/main.js` imports everything **in load order**; a module may use at load time only what is imported above it:
  1. `src/lib/`: `i18n.js` first (the dictionary lookup, `trPlain`, `trCanvas` and the canvas patch, `tStatic`), then `helpers.js` (`$`, `$$`, `num`, `fmt`, `sig`, `sci`, `vol`, `esc`, `note`, `kv`, `calc`, colours), `fit.js` (`nums`, `mean`, `sd`, `linreg`, `lmfit`), `chart.js` (`chart`, `barChart`, `inp`), `parse.js` (`parseCols`), `storage.js` (`jget`/`jset`); `bridge.js` and `ui.js` are the Vue layer.
  2. `src/engines/`: state that lives outside Vue and is shared by tools: `gelfoto.js` (the gel editor, `gf`), `timers.js` (timers keep running when you switch tool), `plate.js` (the plate designer `plateDesigner()`).
  3. `src/legacy/`: older code moved verbatim from the former inline scripts (`core.js`: `APPVER`, `TOOLS`, routing; `app.js`: export, paste, copy to Excel, sessions, statistics, `TAGS`, …) and the former `tools/nt/` modules (`src/legacy/nt/`: `99_app.js` with `SYN`, `addRow()`, `appModal()`, `toolSnap`/`toolApply`; `99y_stage.js` stages; `99z_ux.js` the UX layer).
  4. `src/generated/`: `valid.js` (`build_validated.py` from `tests/VALIDATIE.md`), `icons.js` (`build_icons.py` from `tools/icons/`), `news.js` (`build_changelog.py` from `CHANGELOG.md`), written through `tools/genmod.py` only when their content changes.
  5. `src/legacy/init.js` last: it calls `start()` from `src/mount.js` (every component on its host) and then the old start-up sequence.
- **Globals.** The older code reads helpers and state as global names. A module therefore puts its top-level names on `window`: `expose({...})` from `src/lib/global.js` for stateless code, `live({...})` (a getter/setter) for code with state, so `timers = …` or `gfIntensity = …` in one file is seen everywhere. Every file in `src/legacy/` and `src/engines/` ends with such a list: **a new top-level name there must be added to it**, or other files will not see it. Never move code with a module-level `let` that other files assign to into `expose()`: the variable would split in two.
- Module code is strict: no implicit globals, no top-level `this`, and a function declared inside a block is local to that block.
- Adding a tool: a section in `src/shell/sections/<id>.html` plus its `@include` line, a nav link in `src/shell/index.html`, its id in `TOOLS` (`src/legacy/core.js`) and `TAGS` (`src/legacy/app.js`), a stage (`99y_stage.js`; `tests/stages_check.py` fails without one), an icon (`tools/icons/`, then `python tools/build_icons.py`), and the component in `src/tools/` mounted in `src/mount.js`. Removing one: undo all of those.
- An icon is a CSS mask on `::before`, never an `<svg>` inside a nav link or tile: a nav link's whole innerHTML is its translation key, so an extra element breaks the existing keys.

## Vue components
- `mountTool('#host', Component)` in `src/mount.js` puts a component on a host *inside* a tool section and gives the host `data-notr`. **Mount only the editable part of a tool**, not the whole `<section>`: the heading (`.tool-head`) and the source line (`p.src`) stay plain HTML in `src/shell/sections/`.
- **Keep the element ids of a tool.** Sharing a link, undo, the input store and `tests/validate.py` set `.value` and send an `input` and a `change` event; `v-model` reacts to that. A changed id breaks all of it.
- `calc.<tool>` keeps existing (an empty function is fine), because the rest of the app calls it after sharing, undo and on opening; a component recalculates itself.
- **The calculation code moves unchanged.** Those functions are behind the 286 validation checks with published reference values (ISO 8655, GUM, NEB, Laemmli, Hanahan); rewriting them gains nothing and puts those values at risk. Only the display is rebuilt. A tool keeps its validation case in `tests/validate.py`, and its results may not change.

### Shared components (`src/lib/ui.js`)
- **Don't build a result as an HTML string with `v-html`.** Use the components, which `mountTool()` registers:
  - `<lk-note kind="info|warn|bad|ok">` a message · `<lk-kv :rows="[[label, value], …]">` the result list
  - `<lk-big :label :value :sub :chip :chip-kind :cls :top>` the big number on top; if the number contains markup (the exponent from `sci()`), pass it as `:html` instead of `:value`
  - `<lk-field v-model="x" :label for-id unit inputmode cls :span>` a field with label and unit; `:label-html` for a label with markup (`K<sub>sp</sub>`), already translated
  - `<lk-table :cols="[{h, num}]" :rows="[[cell, …] | {cells, cls}]">` a table · `<lk-steps :steps>` a procedure · `<lk-formula :html>` the formula line
- The classes are those of the existing styles (`note`, `kv`, `big`, `mini`, `f`, `inu`), so all themes and `tests/layout_audit.py` keep working.
- A value may be HTML, because the tool makes it; user text therefore goes through `esc()` first.
- Put the computed quantities in one `computed` (e.g. `m()`) and let the other computeds only read from it.
- Markup inside a template string is written as `&lt;sub&gt;`, or the template compiler sees an element; Vue passes it on decoded, so `tHtml()` gets a plain `<sub>`.

### An editable table
- Use **`<lk-etable table-id="xx-tbl" :cols="cols" v-model:rows="rows" add-id="xx-tbl-add">`**. Columns are `{h, t:'txt'|'num'|'sel'|'col', w, o, d}`. The component sets the hooks on `TBLDEF[id]` (`set`/`push`/`get`/`blank`/`inputCols`) and `ADDBTN[id]`, and translates the labels of a select with `trPlain()` while the value stays the Dutch name (the tool looks it up in `OSMI`, `CHEM`, …). The add button belongs to the tool, outside the table.
- Three things outside a tool write into a table: `tblRestore()` (`src/legacy/app.js`) puts a saved table back, `addRow(tbl,row,tool)` (`src/legacy/nt/99_app.js`) lets another tool push a row, and pasting a block from Excel fills the inputs. With a table that Vue renders, `innerHTML` is undone on the next render, so a `TBLDEF` entry passes `set(vals)` and `push(row)` that point at the component; put the instance on `window` (`window.__oplosVm`) when other code needs it.
- Pasting sets the values and sends an `input` event **per cell**. If a table passes `get()` and `blank()`, the paste handler sets the rows as values via `set()` and the table can grow; `inputCols` says which column belongs to which input, because a select does not count.

### A tool whose state stays outside Vue (the gel editor)
- The image work of the *Gelfoto-editor* is in `src/engines/gelfoto.js` and keeps its state in `gf`, a plain object. The components in `src/tools/gelfoto/` read from it; `src/tools/gelfoto/tick.js` has one reactive counter, and `window.__gfRefresh` lets the engine bump it.
- **Let every computed read `this.tick` itself** (the `gfMix` mixin) and don't chain computeds: when a computed returns the same object on a new tick (`gf.vl`, `gf.lanes`), Vue does not notify its dependents. Return a fresh copy of a list (`gf.bands.slice()`), because the engine changes the list in place.
- A field that Vue renders later (behind a `v-if`) does not exist yet: "ladder from a photo" therefore sets the ladder via `window.__gfLadVm.setLadder()` and detects in the `$nextTick` after.
- When the engine sets an input of a Vue tool, it converts the value with `i18nValue` and sends an `input` event; see `gfSetIn()`. Its status line goes through `gfStatus(...sentences)`, one translation key per sentence.

## Translation (Dutch → English)
- All UI text is written in Dutch; `i18n/en.json` maps Dutch keys to English. Add new entries at the end (keep the order and the one-entry-per-line format), then `python tools/build.py` (writes `web/i18n-en.js` and the cache hash).
- **There is no DOM walker that translates afterwards** (no MutationObserver since S271). Whatever puts text on the page translates it itself:
  - in a component: `t('tekst')` for plain text, `tHtml('tekst met <b>opmaak</b>')` when it has inline tags (the key is then the innerHTML);
  - in other code: `trPlain('tekst')`, or build the DOM and call `tStatic(el)` once on it (same keys; it skips anything inside `data-notr`; `appModal()` already does this for its dialog). Static HTML in `src/shell/` is translated by one `tStatic(document.body)` at start-up; a language switch reloads the page;
  - on a canvas: nothing to do, `fillText`/`strokeText`/`measureText` go through `trCanvas`.
- Key format: numbers become `{#}` (`t('Kies ' + n + ' cijfers')` looks up `Kies {#} cijfers`). A user value inside a sentence is wrapped with `uv(value)` (or `ud(value)` in HTML) so the key gets `{*}` and the value stays as it is. `lkNumIn(value)` writes a number in an example value in the user's notation. `data-notr` means: never translate this.
- **One key per sentence.** Translating a sentence in pieces gives keys that no language can fill; build optional sentences as separate keys (see `gfStatus`).
- Example data that a user sees (sample names such as *Controle*, *Monster 1*) also goes through `trPlain()`, so English users see English examples. A name the code looks things up with stays Dutch as the value and is only translated for display.

## Tests
- `tests/validate.py` (results against published reference data; writes `tests/VALIDATIE.md`), `tests/layout_audit.py` (also with `LABKIT_LANG=en`), `tests/robust_audit.py`, `tests/i18n_collect.py`, `tests/i18n_vue.py`, `tests/paste_check.py`, `tests/stages_check.py`, `tests/perf_budget.py`. `python tools/check.py` runs them all, `--quick` the fast subset.
- `tests/i18n_collect.py` walks every tool in English and fails on a missing translation **and** on any text on the page that is still a Dutch key (a place that forgot to translate). With `--collect` it gathers the Dutch texts into `i18n/missing.json`. `tests/i18n_vue.py` checks statically that every literal `t('…')`/`tHtml('…')` has a key, and lists composed texts for you to check.
- `tests/validate.py` does real work on a gel image and is sometimes flaky: rerun a single case that fails once before reporting it. On this Windows machine the browser tests can hang or crash on a page load when free memory is low (see *Known bugs* in the roadmap); rerun once before treating that as a bug.
- Setup: `pip install playwright==1.48.0 scipy statsmodels scikit-posthocs opencv-python-headless numpy && python -m playwright install --with-deps chromium`.
- New calculations need a validation case in `tests/validate.py` with a cited source.

## Conventions
- No external libraries or CDNs at runtime: everything is in the bundle or in `web/`, works offline and from `file://`.
- Use the existing helpers (`$`, `$$`, `num`, `esc`, `note`, `appModal`, `toolSnap`/`toolApply`, `lkMainWatch`, `jget`/`jset`) and theme variables (`--accent`, `--surface`, …) so all themes keep working.
- Version bumps only via `python tools/bump_version.py x.y.z`, and only when asked (it sets the version in `package.json`, `APPVER` in `src/legacy/core.js` and the generated page, `web/sw.js`, `tauri.conf.json` and `Cargo.toml`).
