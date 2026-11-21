# Labkit BML: working rules

Lab calculator and gel-editor web app (Dutch first, English via a runtime translation layer), published to GitHub Pages from `web/` and packaged for Windows with Tauri.

## Roadmap work
- The plan lives in `docs/ROADMAP.md`: steps `S0`–`S263` (plus `S204a`) of ~30 minutes each; idea numbers (`#n`) refer to `docs/ideas.md`.
- Work comes in **batches** (the *Cloud sessions* table in the roadmap): one cloud session does one batch, in order, on the batch's lead model. Steps in the batch whose *Model* column is cheaper go to a subagent of that model; a step never runs on a cheaper model than its column says.
- Don't add features to a tool that isn't on Vue yet; that waits for its phase-15 conversion. New tools are built in Vue straight away.
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

## Vue (de overstap die loopt)
- De app gaat stap voor stap over op **Vue 3**. Vue komt uit npm en wordt door Vite in `build/app.bundle.js` meegenomen (zie *De Vite-bundel* hieronder): geen CDN, en de app blijft vanaf `file://` werken.
- De laag eronder is `src/lib/bridge.js`. `lkVueMount('#host', options)` zet een component op een host *binnen* een tool en geeft die host `data-notr`.
- **Mount alleen het bewerkbare deel van een tool**, niet de hele `<section>`: de kop (`.tool-head`) en de bronregel (`p.src`) blijven gewone HTML, zodat hun bestaande vertaalsleutels blijven gelden.
- **Houd de element-id's van de oude tool aan.** Delen via een link, ongedaan maken, de invoeropslag en `tests/validate.py` zetten `.value` en sturen een `input`- en `change`-event; daar reageert `v-model` op. Verander je een id, dan breekt dat alles.
- `calc.<tool>` blijft bestaan (als lege functie mag), want de rest van de app roept dat aan na delen, ongedaan maken en bij het openen.
- Een omgezette tool houdt zijn validatiegeval in `tests/validate.py`: de uitkomsten mogen niet veranderen.
- **Het rekenwerk gaat ongewijzigd mee.** Die functies staan achter de 276 validatiegevallen met gepubliceerde referentiewaarden (ISO 8655, GUM, NEB, Laemmli, Hanahan); opnieuw uitschrijven levert niets op en zet die waarden op het spel. Alleen de weergave wordt opnieuw opgebouwd.

## De Vite-bundel
- De Vue-code staat in `src/` en wordt door Vite gebundeld: `npm run build:vue` → `build/app.bundle.js` (één IIFE, geen hash, alles erin). `tools/insert_tools.py` (aangeroepen door `tools/build.py`) zet die inhoud in de gegenereerde `web/index.html`.
- **Geen `dist/`, geen code-splitting, geen dynamische `import()`.** `web/index.html` moet vanaf `file://` werken en alle vijf de testsuites openen de app zo; vanaf `file://` zijn ES-modules geblokkeerd (nagemeten). Daarom ook geen hashnamen en hoeft `web/sw.js` niets te weten van de bundel.
- `build/app.bundle.js` gaat mee in de repo, net als `web/index.html` zelf: wie alleen de niet-Vue tools aanpast heeft dan nog steeds alleen Python nodig. Verander je iets in `src/`, draai dan `npm run build` (bundel + `tools/build.py`); `npm run check` doet de bundel en alle tests.
- Vue zit in de bundel en de bundel gaat in `index.html`, dus de MIT-melding staat als banner in de code; de volledige tekst staat in `licenses/vue-LICENSE.txt`.
- In lib-modus vervangt Vite `process.env.NODE_ENV` niet zelf; die `define` staat in `vite.config.js` en zonder hem valt de app om met "process is not defined".

## De gedeelde Vue-componenten (`src/lib/ui.js`)
- **Bouw een uitkomst niet als string HTML met `v-html`.** Dat was de snelle weg bij de eerste tools en is teruggedraaid: je raakt het declaratieve renderen kwijt en elke tool herhaalt dezelfde stukjes. Gebruik de componenten, die `lkVueMount()` zelf registreert:
  - `<lk-note kind="info|warn|bad|ok">` een melding · `<lk-kv :rows="[[label, waarde], …]">` de uitkomstenlijst
  - `<lk-big :label :value :sub :chip :chip-kind :cls :top>` het grote getal bovenaan; bevat het getal opmaak (de exponent uit `sci()`), geef het dan als `:html` mee in plaats van `:value`
  - `<lk-field v-model="x" :label for-id unit inputmode cls :span>` een veld met label en eenheid; `:label-html` voor een label met opmaak erin (`K<sub>sp</sub>`), al vertaald meegegeven
  - `<lk-table :cols="[{h, num}]" :rows="[[cel, …] | {cells, cls}]">` een tabel · `<lk-steps :steps>` een werkwijze · `<lk-formula :html>` de formuleregel
- De klassen zijn die van de bestaande opmaak (`note`, `kv`, `big`, `mini`, `f`, `inu`), zodat alle thema's en `tests/layout_audit.py` blijven werken.
- Een waarde mag HTML zijn, want de tool maakt die zelf; tekst van de gebruiker hoort daarom eerst door `esc()`.
- Zet de berekende maten in één `computed` (bijv. `m()`) en laat de andere computeds daar alleen uit lezen; dan staat het rekenwerk één keer in het bestand.
- Opmaak in een template-string hoort geschreven te worden als `&lt;sub&gt;`: anders ziet de template-compiler er een element in. Vue geeft het gedecodeerd door, dus `tHtml()` krijgt gewoon `<sub>`.

## Een bewerkbare tabel in Vue
- Gebruik **`<lk-etable table-id="xx-tbl" :cols="cols" v-model:rows="rows" add-id="xx-tbl-add">`** in plaats van `ET()`. De kolomopgave is dezelfde (`{h, t:'txt'|'num'|'sel'|'col', w, o, d}`), dus een tool die om gaat ruilt alleen `ET(...)` voor de component en houdt de rijen zelf bij. De component zet zelf de haken op `TBLDEF[id]` (`set`/`push`/`get`/`blank`/`inputCols`) en `ADDBTN[id]`, en vertaalt de labels van een keuzelijst met `trPlain()` terwijl de waarde de Nederlandse naam blijft (de tool zoekt daarmee op in `OSMI`, `CHEM`, …). De toevoegknop blijft van de tool, want die staat buiten de tabel.
- Drie dingen buiten de tool schrijven in een `tbody`: `tblRestore()` zet een bewaarde tabel terug, `addRow(tbl,row,tool)` laat een andere tool er een rij in duwen, en het plakken van een blok uit Excel vult de invoervelden. Bij een tabel die Vue rendert draait `innerHTML` bij de volgende render terug.
- Daarom mag een `TBLDEF`-ingang `set(vals)` en `push(row)` meegeven; die wijzen naar de component. Zet de instantie op `window` (`window.__oplosVm`) zodat `index.html` erbij kan, en laat `row` een lege functie zijn — niemand gebruikt die dan nog.
- Plakken zet de waarden rechtstreeks en stuurt sinds S202 **per cel** een `input`-event, want `v-model` ziet de andere cellen anders niet veranderen. Dat werkt alleen zolang de rijen er al zijn: de handler klikte de toevoegknop en las de DOM op de volgende regel uit, en Vue rendert pas op de volgende tick. Geeft een tabel `get()` en `blank()` mee, dan zet de handler sinds S204a de rijen als waarden via `set()` en kan hij wel meegroeien. `inputCols` zegt daarbij welke kolom bij het hoeveelste invoerveld hoort, want een keuzelijst telt niet mee.
- **Let op waar de code staat.** `addRow()` staat in `tools/nt/99_app.js`, dus binnen de NT-markers: een haak die je in `web/index.html` zet is bij de volgende `tools/insert_tools.py` weer weg. `tblRestore()` en de plak-handler staan wel echt in `index.html`.

## Translation in Vue
- De DOM-vertaallaag komt niet in een Vue-boom (die heeft `data-notr`), dus de component vertaalt zelf:
  - `t('tekst')` voor platte tekst. Zelfde sleutels als de rest van de app, dus `i18n/en.json` blijft gewoon gelden. Een getal in de tekst wordt `{#}`, dus `t('Kies ' + n + ' cijfers')` zoekt `Kies {#} cijfers` op.
  - `tHtml('tekst met <b>opmaak</b>')` als er inline tags in zitten: dan is de sleutel de innerHTML, net zoals de DOM-laag een heel element opzoekt. `t()` zou `<` en `>` als entiteit in de sleutel zetten.
  - `uv(waarde)` om tekst van de gebruiker letterlijk te laten staan, `lkNumIn(waarde)` voor een getal in een voorbeeldwaarde (dat deed `i18nValue` eerst zelf).
- **Eén sleutel per zin.** Een zin in stukjes vertalen levert sleutels op die in geen enkele taal te maken zijn.
- `tests/i18n_vue.py` controleert statisch dat elke letterlijke `t('…')` en `tHtml('…')` een sleutel in `i18n/en.json` heeft, en meldt samengestelde teksten zodat je die zelf nakijkt.
- De MutationObserver van de vertaallaag slaat sinds S225 **alles over wat binnen een `data-notr` staat**, niet alleen de host zelf. Een wijziging in een Vue-boom komt bij de observer aan als de host niet de target is (een nieuwe rij in een `tbody`, een tekstknoop in een cel), en `i18nWalk()` keek alleen naar het element dat hij kreeg: een getal als `0.179` ging dan weer terug naar `0,179`, want `i18nNum()` ziet een punt met drie cijfers erachter als een Nederlands duizendtal.
- Zet de motor zelf een invoerveld van een Vue-tool (zoals de geleditor doet), dan hoort daar de omzetting van `i18nValue` bij en daarna een `input`-event; zie `gfSetIn()` in `web/index.html`.

## Een tool waarvan de toestand buiten Vue blijft (de geleditor)
- Het beeldwerk van de *Gelfoto-editor* staat in `web/index.html` en houdt zijn toestand in `gf`, een gewoon object. De componenten in `src/tools/gelfoto/` lezen daaruit; `src/tools/gelfoto/tick.js` heeft één reactieve teller en `window.__gfRefresh` laat de motor die optikken. `gfLanesTable()`, `gfBandsTable()` en `gfMarksTable()` zijn niets anders meer dan die tik.
- **Laat elke computed zelf `this.tick` lezen** (de mixin `gfMix`), en zet er geen keten van computeds op: geeft een computed bij een nieuwe tik hetzelfde object terug (`gf.vl`, `gf.lanes`), dan waarschuwt Vue zijn afhankelijkheden niet en blijft de weergave staan. Geef van een lijst een verse kopie terug (`gf.bands.slice()`), want de motor wijzigt de lijst zelf.
- Let op wanneer een veld er al is: een veld dat Vue pas later neerzet (het eigen-ladderveld achter een `v-if`) is er nog niet, dus kiest "ladder uit een foto" de ladder via `window.__gfLadVm.setLadder()` en doet de detectie in de `$nextTick` daarna.

## How the app is built
- **`web/index.html` is generated (since S265); never edit it by hand.** Its source is `src/shell/index.html` (head, nav, inline JS) with `<!-- @include … -->` lines for files under `src/shell/`: all CSS is in `src/shell/styles/app.css` and each hand-written tool section in `src/shell/sections/<id>.html` (since S266). `npm run build` (Vite bundle + `python tools/build.py`) writes it; `python tools/build.py` alone is enough when `src/` (outside `src/shell/`) did not change. CI runs `python tools/build.py --check` and fails when the committed `web/index.html` is out of date, so commit the regenerated file with your change.
- Code that used to be "edited in place in `index.html`" (the helpers, the gel-editor and timer engines, the DOM translation layer, `tblRestore()`, the paste handler, `gfSetIn()`) now lives in `src/shell/index.html` until phase 16 moves it into `src/lib/` and `src/engines/`. Where this file says `web/index.html` for such code, read `src/shell/index.html`.
- Newer tools are modules in `tools/nt/` (`NN_id.json` + `.html` + `.js`), injected by `python tools/insert_tools.py` between `<!-- NT:id -->` / `/* NT:id */` markers. **Never edit inside those markers in `index.html`**: change the module file and re-run the insert. A module with `"lib":true` is JS only.
- New features of the UX layer go in `tools/nt/99z_ux.js`; generated data comes from a build script: `tools/nt/98_valid.js` from `python tools/build_validated.py`, `tools/nt/99ya_icon.js` from `python tools/build_icons.py` (sources in `tools/icons/`), `tools/nt/97_news.js` from `python tools/build_changelog.py` (source `CHANGELOG.md`).
- Stages (prepare/perform/analyse) live in `tools/nt/99y_stage.js`; `tests/stages_check.py` fails when a tool has no stage.
- An icon is a CSS mask on `::before`, never an `<svg>` inside a nav link or tile: the translation layer uses the link's whole innerHTML as its key, so an extra element there breaks existing keys.
- Removing a tool: delete its module files, then also remove its id from `const TOOLS=[…]`, `const TAGS={…}` and `SYN` in `tools/nt/99_app.js` (insert_tools does not remove those).

## Translation (Dutch → English)
- All UI text is written in Dutch. Every new Dutch string needs an entry in `i18n/en.json` (append; keep the existing order), then `python tools/build_i18n.py` (writes `web/i18n-en.js` and the cache hash).
- Numbers in text become `{#}` in keys. Dynamic values inside a sentence must be wrapped with `ud(value)` so the key gets `{*}`; text that must never be translated gets `data-notr`.
- `tests/i18n_collect.py` fails on any untranslated string.

## Tests
- `tests/validate.py` (results against published reference data; writes `tests/VALIDATIE.md`), `tests/layout_audit.py`, `tests/robust_audit.py`, `tests/i18n_collect.py`, `tests/i18n_vue.py`, `tests/perf_budget.py`.
- `tests/validate.py` doet het zware werk op een echte gel en is daar soms wisselvallig: een enkel geval dat één keer afbreekt, draai je opnieuw voordat je het als fout rapporteert.
- Setup: `pip install playwright==1.48.0 scipy statsmodels scikit-posthocs opencv-python-headless numpy && python -m playwright install --with-deps chromium`.
- New calculations need a validation case in `tests/validate.py` with a cited source.

## Conventions
- No external libraries or CDNs: everything stays in `web/`, works offline and from `file://`.
- Use the existing helpers (`$`, `$$`, `num`, `esc`, `note`, `appModal`, `toolSnap`/`toolApply`, `lkMainWatch`, `jget`/`jset`) and theme variables (`--accent`, `--surface`, …) so all themes keep working.
- Version bumps only via `python tools/bump_version.py x.y.z`, and only when asked (it sets `APPVER` in `src/shell/index.html` and in the generated file).
