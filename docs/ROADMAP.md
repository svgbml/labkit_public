# LabKit roadmap

The ideas chosen from [ideas.md](ideas.md) (the `#` numbers), planned as **steps of about 30 minutes each**. Each step ends with a working app and runs `python tools/check.py --quick` (the full `tools/check.py` at the end of every phase or batch). From here on the work is done in **cloud sessions, one batch per session** (see *Cloud sessions* below), not step by step by hand.

**Status:** ✅ done · 🔨 started, something left (the row says what) · ⏳ planned · ✖ dropped · *(partly there: …)* = earlier releases already cover part of the step; it is still open

**Model** (last column) is the cheapest model that can do the step well, so the shared usage limit lasts longer. Done steps show "—".
- **Haiku**: purely mechanical work, such as generated files, a fixed format to copy or a small toggle (3 open steps).
- **Sonnet**: the default. The design is settled and the step extends something that already exists, such as most rework steps (76 open steps).
- **Opus 5**: the step needs real decisions or has to stay numerically correct, such as parsers, statistics, merging tools, i18n, most gel-editor and performance steps (54 open steps).
- **Opus 5.5**: only the architecture steps that everything else builds on, such as new shells and layouts, image analysis, undo, sync, lazy loading, and the alignment engine (24 open steps).

**Total:** 274 steps (S0–S272, plus S204a) ≈ 135 hours; **113 done, 157 open, 4 dropped** (S143–S146, replaced by phase 16). Every chosen idea number appears in at least one step. Steps marked *(needs Sx)* depend on an earlier step.

## Where it stands (checked 2026-11-21)

| Phase | Steps | Status |
|---|---|---|
| Phase 0 clean-up | S0 | ✅ done |
| Phase 1 navigation and app shell | S1–S12 | ✅ done |
| Phase 2 preparation, gels | S13–S20 | ✅ done |
| Phase 3 picture tools and plates | S21–S36 | ✅ done |
| Phase 4 recipes and sequences | S37–S47 | **part done:** S37–S40 ✅, S41–S47 open |
| Phases 5–11 | S48–S146 | ⏳ not started (S45, S54, S82, S91, S93 partly there) |
| Phases 12–14 Sanger, alignment, sequence toolbox | S147–S201 | ⏳ not started |
| Phase 15 the remaining tools onto Vue | S202–S263 (+S204a) | ✅ done (batches V1a–V7 merged on 2026-11-21, S263 the same day) |
| Phase 16 one source, one translation path | S264–S272 | ✅ done (batches K1–K3, 2026-11-21; replaces S143–S146) |

**Checkmark audit.** Every ✅ in this file has its own `S<n>:` commit, and every `S<n>:` commit
in the history has its ✅. Nothing is ticked that wasn't done, and nothing done is unticked.
Releases 1.4–1.18 were built before this roadmap, so a few open steps are already partly covered.
Those rows now say so in *(partly there: …)*, so a session can build on that instead of starting
over:
- **S45:** the buffer check for a double digest exists in *Restrictiedigestie*. Cutting a pasted sequence does not.
- **S54:** the pipette limit already shows in *PCR-mastermix*, *Ligatie*, *SDS-PAGE monsters*, *cDNA-synthese*, *Primers oplossen* and *Verdunning*.
- **S82:** the canvas-to-SVG recorder from S21 exists, but only 14 of the 47 canvases have the export bar.
- **S91:** *Standaardcurve* reads a pasted plate grid, but not per instrument.
- **S93:** *qPCR-analyse* reads a pasted Ct table by its header, but not per instrument.

At the last full `python tools/check.py` (2026-11-21, after S272, end of phase 16): **286 of 286 validation checks**, 0 layout problems in Dutch and 2 in English (the known label overflow in *PCR-mastermix*), 0 untranslated texts (including the new leftover-Dutch check), start-up 413/459 ms. `tests/robust_audit.py` could not finish on this machine: the browser runs out of memory while loading a page (see *Known bugs*). By the owner's decision (2026-11-21) that failure is **not blocking** on this machine and the test is not rerun here; it still runs in CI on GitHub.

### Vue migration: how far it is

| Part | Done | Left |
|---|---|---|
| Foundation: Vite bundle, `src/lib/bridge.js`, shared components in `src/lib/ui.js` (incl. `lk-etable`), `t()`/`tHtml()`, `tests/i18n_vue.py` | ✅ | — |
| Calculation tools on Vue | **all 87**: every tool of phase 15 is converted (S202–S262, batches V1a–V7), plus *pH bijstellen* and *Celkweekmedium klaarmaken* (built in Vue at S40) | — |
| App shell (start page, Instellingen, navigation) | ✅ S263 (`Start.vue`, `Settings.vue`) | — |
| Phase 15 steps | 63 of 63 | — |
| Leftovers of the old build | ✅ phase 16: `web/index.html` is generated from `src/shell/`, all JavaScript is in the bundle (`src/lib/`, `src/engines/`, `src/legacy/`), `tools/nt/` and `insert_tools.py` are gone, and there is one translation path without an observer (`t()`/`tHtml()`/`trPlain()` and `tStatic()` for DOM built outside Vue) | — |

Four of the converted tools (*Significante cijfers*, *Welke pipet?*, *Z′-factor*,
*Restrictiedigestie*) were done as groundwork before phase 15 had step numbers, so they have no
`S<n>` commit of their own.

**Rules from now on:**
- Every tool is on Vue, so the old rule (no features on a tool that isn't on Vue yet) has done its job.
- **Phase 16 is done.** There is one place for code (`src/`) and one way to translate; see `CLAUDE.md`. The calculation code that is still global lives in `src/legacy/`: new code goes in a real module with imports, and a tool that is touched anyway may move its part of `src/legacy/` next to its component.
- A new tool (phases 12–14, the plasmid map, the figure maker) is built in Vue, in `src/`.

## Cloud sessions

Development continues in cloud sessions. **One session = one batch below, started on the batch's
lead model.**
- Steps inside a batch that need a cheaper model go to a subagent of that model (`Agent` with `model: "sonnet"` or `"haiku"`). The lead checks that work and runs the checks itself, as `CLAUDE.md` says.
- A step whose model is *higher* than the batch's lead never sits in that batch.

**How to start one:** give the session the brief *"Do batch X from `docs/ROADMAP.md`, in order,
following `CLAUDE.md`."* The session:
- commits once per step (`S<n>: …`) and marks each step ✅;
- runs the full `python tools/check.py` at the end of the batch;
- stops at the end of the batch, or earlier if something it needs isn't done.

**Running them side by side.** Every session appends to `i18n/en.json`, rebuilds
`web/index.html` and `build/app.bundle.js`, and ticks off rows in this file, so two sessions
always meet in those files. Those conflicts are easy to resolve (regenerate, keep both rows), but
resolving them costs usage, and with one shared usage limit parallel sessions only spend it
faster. So:
- Run **one session at a time, at most two**, and two only when the column *Parallel with* allows it.
- Merge one before starting the next.

**Size.** A batch is **at most 6 steps** (about 1.5–2 hours). Usage per step rises as a session
gets longer, because every turn resends the whole context, so two short sessions cost less than
one long one. A session reads `CLAUDE.md` and only *its own* rows of this file, not the whole
roadmap. **Measure first:** run V1a alone and check how much of the 5-hour limit it used before
planning how many sessions fit in one window.

**Order.** Wave 1 finished the Vue migration (done). Wave 2 (phase 16) removes what is left of the
old build, so that every later step has one place to put code and one way to translate it; it
runs before every other wave, the *any time* batches included. After that the feature waves follow
in order, and the *any time* batches can be slotted in when that is more useful. Within a pair
(a/b/c) do *a* first unless the row says otherwise.

| Batch | Lead model | Steps (in this order) | Needs | Parallel with |
|---|---|---|---|---|
| **Wave 1: finish Vue** | | | | |
| V1a ✅ | Sonnet | S205–S209 chemistry tools | — | one other V batch |
| V1b ✅ | Sonnet | S210–S214 analysis tools | — | one other V batch |
| V2a ✅ | Sonnet | S215–S219 microbiology | — | one other V batch |
| V2b ✅ | Sonnet | S220–S224 cell culture | — | one other V batch |
| V3a ✅ | Sonnet | S227–S232 molecular biology, part 1 | — | one other V batch |
| V3b ✅ | Sonnet | S233–S237 molecular biology, part 2 | — | one other V batch |
| V4a ✅ | Sonnet | S238–S242 forensics, part 1 | — | one other V batch |
| V4b ✅ | Sonnet | S243–S247 forensics, part 2 | — | one other V batch |
| V5a ✅ | Sonnet | S250–S254 statistics tools and quality | — | one other V batch |
| V5b ✅ | Sonnet | S257–S262 schemes, planner, report, plate, centrifuge, timers | — | one other V batch |
| V6 ✅ | Opus 5 | S248–S249 *Statistiek*, S255–S256 *Gelplanner*, then S263 the app shell (last) | all other V batches before S263 | one V batch |
| V7 ✅ | Opus 5 | S225–S226 *Gelfoto-editor* on Vue | — | one V batch |
| **Wave 2: one source, one translation path (phase 16)** | | | | |
| K1 ✅ | Opus 5.5 | S264 inventory and target layout, S265 generated `index.html`, S266 (Sonnet) sections and CSS into source files | Wave 1 | — |
| K2 ✅ | Opus 5.5 | S267 (Opus 5) shared helpers, S268 engines, S269 (Sonnet) `tools/nt/` into `src/` and `insert_tools.py` retired | K1 | — |
| K3 ✅ | Opus 5.5 | S270 (Opus 5) static text through `t()`, S271 DOM translation layer removed, S272 (Sonnet) rules and docs | K2 | — |
| **Wave 3: finish phase 4** | | | | |
| P1 ✅ | Opus 5 | S42, S43 (Sonnet), S44, S45: primers, in-silico PCR and digest | K3 | E2, *any time* batches |
| P2 ✅ | Sonnet | S41, S47: overage switch, material list and protocol export | K3 | P1 |
| P3 ✅ | Opus 5.5 | S46 plasmid map (new tool, Vue) | S45 | — |
| **Wave 4: execution and gel editor** | | | | |
| E1 | Opus 5.5 | S48 bench shell, S49 (Opus 5), S50 (Sonnet) | K3 | G1a |
| E2 | Sonnet | S51–S55, S58 | E1 | P1, G1a, G1b |
| E3 | Opus 5 | S56, S57, S60 | E1 | G1a, G1b |
| E4 | Opus 5.5 | S59 colony counting, S61 multi-device sync | E1; S104 for the CFU link | — |
| G1a | Opus 5 | S62–S65 (S63, S65 by Sonnet) | K3 | E1–E3 |
| G1b | Opus 5 | S66–S68 (S66, S68 by Sonnet) | G1a | E2, E3 |
| G2 | Opus 5.5 | S69–S74 (S71, S72 are Opus 5): guided mode, canvas-first layout, direct manipulation, undo | G1b | — |
| G3 | Opus 5.5 | S75–S79 (S75, S78 are Opus 5) | G2 | — |
| **Wave 5: charts, data, rework, workflows** | | | | |
| C1a | Opus 5.5 | S80 chart style system, then S81–S84 (Opus 5 / Sonnet) | K3 | — |
| C1b | Opus 5 | S85–S88 | C1a | R1, R2a |
| C2 | Opus 5.5 | S89–S90 figure maker (new tool, Vue) | C1b | R1, R2a, R2b |
| C3 | Opus 5 | S91–S93, S96: imports and core-calculator extras | C1b | R1 |
| C4 | Sonnet | S94, S95 | C3 | R1, R2a, R2b |
| R1 | Sonnet | S97, S98, S101–S104 | K3 | C1b–C4 |
| R2a | Sonnet | S106–S110 | K3 | C1b, C2, C4 |
| R2b | Sonnet | S111, S112, S115, S116 | K3 | C2, C4 |
| R3 | Opus 5 | S99, S100, S105, S113, S114: tool merges and statistics | K3 | — |
| W1 | Opus 5.5 | S117–S118 data flow and projects, then S119–S121 (Opus 5) | K3 | — |
| **Wave 6: performance and quality** | | | | |
| Q1a | Sonnet | S134–S137 (S136 by Haiku) | K3 (then *any time*; cheap safety nets) | anything |
| Q1b | Sonnet | S138, S139, S141 | K3 (then *any time*) | anything |
| Q2 | Opus 5 | S140, S142 | K3 | — |
| F1a | Opus 5.5 | **Re-plan phase 10 first** (lazy init and DOM templates may be largely solved by mounting a component only when its tool opens, which phase 16 makes possible), then S125–S127 | K3 | — |
| F1b | Opus 5 | S122–S124, S128 | F1a | — |
| F1c | Opus 5.5 | S129–S133 (S130, S131 are Opus 5) | F1b | — |
| **Any time (after K3): new tools, built in Vue** | | | | |
| SQ1 | Sonnet | S191–S193 sequence toolbox; S194 after S45 | K3 | anything |
| SQ2 | Opus 5 | S195, S198, then S196, S197 (Sonnet): NCBI switch, cache, lookups | SQ1 | SA1a, AL1 |
| SA1a | Opus 5 | S147–S152 chromatogram reader (S149, S151, S152 by Sonnet) | K3 | SQ1, AL1 |
| SA1b | Opus 5 | S153–S157 (S153, S154, S156, S157 by Sonnet) | SA1a | SQ1, AL1 |
| SA2 | Opus 5.5 | S158–S161 (S159, S161 are Opus 5): alignment to the reference, assay format | SA1b | — |
| SA3 | Sonnet | S162, S164–S168 (S166 by Haiku): batch and HIrisPlex-S sheet | SA2 | AL2a–AL2c |
| SA4 | Opus 5 | S163, S169, then S199 and S200–S201 (Sonnet) | SA3, SQ2 | — |
| AL1 | Opus 5.5 | S170–S171 alignment parsers and viewer | K3 | SQ1, SA1a |
| AL2a | Sonnet | S172–S176 (S176 by Haiku) | AL1 | SA3 |
| AL2b | Sonnet | S177–S179, S181 (S179 after S42) | AL2a | SA3 |
| AL2c | Sonnet | S186–S189 | AL2b | SA3 |
| AL3 | Opus 5 | S180 (after S158), S182–S184, S190 | AL2c | — |
| AL4 | Opus 5.5 | S185 small progressive alignment | AL3 | — |

**Route through the usage limit:** K1–K3 (phase 16) are done. Next Q1a–Q1b on Sonnet (cheap
safety nets), then the rest wave by wave.

## Decisions
- **Vue 3 (besloten tijdens de run van fase 4).** De app gaat op Vue. Eerst stond Vue als los bestand in `web/vendor/` om een bouwstap te vermijden; dat is **herzien**: Vue komt nu uit npm en Vite bundelt `src/` tot één IIFE in `build/app.bundle.js`, die `tools/insert_tools.py` in `web/index.html` zet. Dus wél een bouwstap (`npm run build:vue`), nog steeds geen CDN, en de app werkt nog steeds vanaf `file://` — daarom één bundel zonder `dist/`, zonder code-splitting en zonder hashnamen, want vanaf `file://` zijn ES-modules geblokkeerd. De omzetting gaat per tool; de rest van de app blijft intussen werken. De vertaallaag van de DOM kan niet in een Vue-boom komen, dus een component vertaalt zelf met `t()` / `tHtml()` tegen dezelfde `i18n/en.json`, en `tests/i18n_vue.py` controleert dat statisch. Een omgezette tool houdt zijn element-id's en zijn validatiegeval, zodat delen, ongedaan maken, de invoeropslag en de validatie blijven werken. Zie `CLAUDE.md`.
- **#13 shared layout** applies per *type* of tool. Picture-generating tools (schemes, diagrams, gel figures) share one layout; calculators keep their own.
- **Gel editor:** keep automatic ladder band detection, and keep editing the numbers/text next to each ladder band.
- **Removed:** chain of custody, reagent stock, freezer boxes, label sheets and the GHS label. Organisation is merged into Bench. The experiment planner stays (#240 was not chosen).
- **HIrisPlex-S:** LabKit prepares, checks and exports the genotype sheet and reports the outcome, but does **not** predict eye, hair or skin colour itself. The regression coefficients behind the system are not published and part of the method is covered by a patent, so the prediction stays with the Erasmus MC webtool. Re-implementing it from guessed coefficients would produce numbers that look official and are wrong.
- **NCBI:** lookups go straight from the browser to NCBI's E-utilities, which do send `Access-Control-Allow-Origin: *`, so no proxy or server is needed. They are optional and off by default, they send only an rs number or accession plus a tool name (**never an e-mail address unless the user types one**), everything is cached locally, and the request queue respects 3 requests per second (10 with a user-supplied API key). From a `file://` copy the browser blocks them; that is handled as a normal failure case, not a bug.
- **Clustal Omega:** stays at EBI. It is a compiled program with its own clustering and HMM alignment, so LabKit reads and analyses its output (`.aln`, `.pim`, `.dnd`), converts between alignment formats and checks the input before you upload it. LabKit's own engine does pairwise alignment and small multiple alignments, and says plainly that it is not a replacement.
- **Chromatograms:** no re-basecalling. The `.ab1` file already contains the sequencer's basecalls and peak positions, so LabKit reads those, labels them automatically and lets you edit every label. Heterozygotes are called on top of that from the peak heights.
- **✖ Dropped:** #230 GHS label sizes (tool removed), #86 spill card (needed GHS data).
- **Phase 16 target layout (S264, measured 2026-11-21).** What `web/index.html` (1,27 MB) is made of, outside the 63 NT blocks and the Vue bundle (~250 KB):

  | Piece | Size | Goes to | Step |
  |---|---|---|---|
  | `<head>` + `<style>` (themes, layout, all tool CSS) | 34 KB | `src/shell/styles/app.css`, pulled in by the shell template | S266 |
  | `<nav>` (groups + links; `insert_tools.py` adds the NT links and moves *rmp*) | 9 KB | stays in the shell template until S269 makes the nav data | S269 |
  | 39 hand-written `<section>`s (`verdunning` … `micro`; each is now a `.tool-head`, a Vue host and a `p.src`; only *oplossing*, *pcr*, *ppip* and *gelfoto* have extra ids: `chem-list`, `o-btitle`, `o-note`, `bs-cv`, `qr-cv`, `ppr-cv`, the `gf-app-*` hosts, `gf-stage`, the zoom bar) | 34 KB | `src/shell/sections/<id>.html`, one per tool, included in the same order | S266 |
  | Inline JS 1: language pick + `document.write` of `i18n-en.js` | 1 KB | stays inline (must run before the parser goes on) | — |
  | Inline JS 2: the DOM translation layer (`i18nKey`, `trPlain`, `trCanvas` + the canvas patch, `i18nWalk`, `i18nStart`, the MutationObserver, `i18nCollect`) | 10 KB | `trPlain`/`trCanvas`/`i18nKey` to `src/lib/i18n.js` (S267); the walker and observer are removed | S267, S271 |
  | Inline JS 3: helpers (`$`, `num`, `fmt`, `sig`, `sci`, `vol`, `esc`, `note`, `kv`, `calc`), routing (`TOOLS`, `route`), audio, the timer engine | 16 KB | helpers to `src/lib/`, routing to `src/lib/router.js`, timer engine to `src/engines/timers.js` | S267, S268 |
  | Inline JS 4: charts and fitting (`chart`, `barChart`, `linreg`, `lmfit`, distributions), the gel-editor engine (`gf`, `gfProc`, detection, dragging, ~60 `gf*` functions), export, paste, storage (`jget`/`jset`, `tblSnap`/`tblRestore`), statistics, protocol drawing (`pTube`, `pArrow`, …), the init sequence at the end | 147 KB | `src/lib/` (charts, stats, storage, export, paste), `src/engines/gelfoto.js`, `src/engines/protocol-draw.js`; the init sequence becomes `src/main.js` | S267, S268 |
  | `tools/nt/`: 57 JS modules (6 libraries, 45 tools with `calc` code and data, `99_app`, `99y_stage`, `99z_ux`, and the generated `97_news`, `98_valid`, `99ya_icon`) | ~480 KB with their HTML | libraries to `src/lib/`, tool data next to the component, generated files to `src/generated/` | S269 |

  **Globals.** 318 top-level names live in the inline JS; **201 of them are read by `src/`** (the components reach them as globals) and 66 by `tools/nt/`. The ones other code depends on most: `calc`, `current`, `TOOLS`, `TAGS`, `TBLDEF`/`ADDBTN`, `gf` + the `gf*` functions, `timers`/`addTimer`/`renderTimers`, `chart`/`barChart`, `jget`/`jset`/`pstore`, `tblSnap`/`tblRestore`, `trPlain`/`trCanvas`/`i18nValue`/`i18nWalk`, `LANG`. So S267–S268 move code into modules **and keep putting these names on `window`**, until a later step changes the callers; nothing is renamed in this phase.

  **Still translated by the DOM walker:** every `.tool-head` (`h2` + description) and `p.src` of all 92 tools, the nav, the start-page tiles outside `Start.vue`, and the buttons the UX layer and `decorateXL()` add (*Kopieer naar Excel*, chart and picture bars, *Meer instellingen*, the result bar). That is the list S270 works through.

  **Target layout.**
  ```
  src/shell/index.html          the page skeleton: head, nav, <main> with @include lines, inline JS (until S267/S268)
  src/shell/styles/app.css      all CSS
  src/shell/sections/<id>.html  one tool section each
  src/lib/      helpers, i18n (t, trPlain), storage, charts, stats, router      (S267)
  src/engines/  gelfoto, timers, plate designer, protocol drawing              (S268)
  src/tools/    the Vue components (as now) + their data                     (S269)
  src/generated/ news, valid, icons                                           (S269)
  build/app.bundle.js           Vite output (as now)
  web/index.html                generated by `npm run build` (tools/build.py); never edited by hand
  ```
  `@include` lines are expanded by the build, not by Vite, so the shell, CSS and sections never make the bundle stale. The build check: `python tools/build.py --check` regenerates `web/index.html` in memory and fails when the committed file differs. **S265–S272 still fit as planned**; the only change is that the nav stays in the template until S269.

---

## Phase 0: clean-up (done)
| Step | Ideas | What | Status | Model |
|---|---|---|---|---|
| S0 | 236–239, 242, 248 | Remove chain of custody, stock, freezer boxes, label sheets and GHS label; move planner and report into Bench; clean TOOLS, TAGS, synonyms, validation | ✅ | — |

## Phase 1: navigation and app shell (12 steps)
| Step | Ideas | What | Done when | Model |
|---|---|---|---|---|
| S1 | 1 | Assign every tool to one or more stages (Prepare · Do · Analyse) in a `STAGES` map | ✅ `STAGES` in `tools/nt/99y_stage.js`; `tests/stages_check.py` (in `tools/check.py`) lists tools without one | — |
| S2 | 1 | Stage tabs above the sidebar; selecting a stage filters the nav and start page | ✅ Tabs in the sidebar head filter nav and start page; choice kept in `labkit:v1:stage` | — |
| S3 | 4, 17 | Stage accent colours and a breadcrumb (Stage › Group › Tool) in the tool header | ✅ `--stv/--stu/--sta` per theme (5 checked), breadcrumb chip + group link + nav accent | — |
| S4 | 8 | "Next tool" suggestions at the bottom of each tool (hand-picked map) | ✅ `NEXT` map in `99z_ux.js` on 85 tools, translated | — |
| S5 | 10 | Search and command palette show the description and tags of each hit | ✅ Description + tags on search hits and in the palette, checked in NL and EN | — |
| S6 | 11 | Pinned tools bar (up to 6 icons in the header), pin from the tool toolbar | ✅ Max 6 pins in `labkit:v1:pins`, pin button in the tool toolbar; the bar sits at the top of the work area (the sticky phone bar has no room at 375 px) and scrolls sideways | — |
| S7 | 16 | Icon set: a small consistent SVG icon per tool (part 1: 45 tools) | ✅ 45 tools; icons are a CSS mask on `::before` (an injected `<svg>` would break the translation keys of a nav link); sources in `tools/icons/`, built by `tools/build_icons.py` | — |
| S8 | 16 | Icons part 2 (remaining tools) + dark-theme check | ✅ All 87 nav entries have an icon (77 shapes); checked in the dark and contrast themes | — |
| S9 | 12 | Simple/expert toggle infrastructure (`data-expert` fields hidden in simple mode) + apply to 5 tools | ✅ `data-expert` + "Meer instellingen" per tool in `labkit:v1:expert`; applied to spec, dna, oligo, pcr, reeks. A field with a non-default value stays visible | — |
| S10 | 12 | Apply simple/expert to 15 more tools with many fields | ✅ 15 more tools (31 fields), 20 in total; one toggle per block of settings | — |
| S11 | 14 | Onboarding tour (4 steps: search, stages, workflows, settings) on first visit | ✅ Spotlight tour with 4 steps, keyboard-operable, replay button in Instellingen; a step without a visible target (phone) falls back to a centred card | — |
| S12 | 15, 286 | What's new panel after an update + changelog page generated from a `CHANGELOG.md` | ✅ `CHANGELOG.md` -> `tools/build_changelog.py` -> `tools/nt/97_news.js`; panel after a version change, full list from Instellingen. Nothing on a first visit | — |

## Phase 2: preparation, gels (8 steps)
| Step | Ideas | What | Done when | Model |
|---|---|---|---|---|
| S13 | 21 | New *Gelplanner* tool: gel tray, comb and wells drawn top-down; sample name, colour and volume per well | ✅ `tools/nt/48_gplan.*`: tray on scale (length capped), comb, wells with name/colour/volume, PNG export; `ET` gained a `col` colour column | — |
| S14 | 21, 24 | Ladder drawn next to the wells; SDS-PAGE mode with prestained ladder look | ✅ Ladder strip beside the gel (log-linear positions), gel type agarose/SDS-PAGE with prestained ladder colours and the matching unit | — |
| S15 | 22 | Predicted gel: bands from expected sizes, log migration per agarose % and ladder | ✅ Second canvas with the expected gel (UV for DNA, Coomassie for SDS); positions from the ladder, the gel percentage gives the out-of-range warning | — |
| S16 | 23, 28 | Well capacity check (comb, thickness) and loading dye volume + dye fronts on the prediction | ✅ Well volume from comb/gel dimensions (fill to 80%), per-lane dye volume from the dye strength, warning over capacity, dye fronts on the expected gel | — |
| S17 | 25, 26 | Agarose % advisor from the fragment range and a casting recipe card for the tray size | ✅ Percentage advice from the expected bands (with "use this"), casting card with gel volume, agarose, buffer and stain; printable via the toolbar print button | — |
| S18 | 27 | Run time estimate from voltage, length and fragment sizes | ✅ Field strength + estimated run time as a range, "stop when the front is at … cm", warnings above 10 and below 3 V/cm and when the smallest fragment outruns the dye front | — |
| S19 | 228 | Gel loading scheme (`plaad`) opens in / is replaced by the Gelplanner; move its tests | ✅ `plaad` removed; `#plaad` redirects to `#gplan` via a `GONE` map; workflow, next-tool map, stages and icons follow. It had no validation cases of its own; 267/267 still pass | — |
| S20 | 203 | SDS-PAGE samples tool sends samples to the Gelplanner (SDS mode) | ✅ "Stuur monsters door naar: Gelplanner" under the SDS table; sets SDS mode, ladder lane and comb, and puts the dye strength at 1× because the sample buffer is already in the loading volume | — |

## Phase 3: preparation, picture tools and plates (16 steps)
| Step | Ideas | What | Done when | Model |
|---|---|---|---|---|
| S21 | 13 | Shared layout for picture tools: preview left/top, options panel, export bar (PNG/SVG/copy/print) | ✅ `.picwrap` + `data-picbar` in `tools/nt/01_pic.js`; export bar PNG/SVG/copy/print, with a real canvas→SVG recorder (vectors, not a wrapped bitmap). Gelplanner converted | — |
| S22 | 13 | Move dilution scheme, pipetting scheme and PCR programme onto the shared layout | ✅ `pverd`, `ppip` and `pprog` on `.picwrap` with the shared export bar; stacking breakpoint raised to 1100 px so the options column stays wide enough | — |
| S23 | 13 | Move staining scheme and plate layout onto the shared layout | ✅ `stain` on `.picwrap`; `plaat` keeps its editor layout (its interactive plate is the preview) but gets the shared bar, as do the drawings in `oplossing`, `bpa`, `qplate`, `plan` and `stat` — every drawing in the app now exports the same way | — |
| S24 | 34, 225 | Dilution series drawing: tubes, arrows, volumes, colour fading | ✅ Tubes, arrows, volumes, fading and plating dishes were already drawn by earlier work; added a series colour (via a new `col` argument on `pTube`) and a note that the fade is indicative, not proportional | — |
| S25 | 35, 227 | PCR programme as a temperature–time graph with bracketed cycles | ✅ The graph with bracketed cycles existed; the x-axis is now a real time axis (step width ∝ duration, with a minimum so short steps stay readable), labels fitted to the step width, PNG/SVG export via the shared bar | — |
| S26 | 36, 229 | Staining protocol as an illustrated timeline | ✅ The box grid became a horizontal timeline: bar width ∝ time, a reagent drop per step (outlined for rinse/decolourise), a time axis and the expected result; PNG/SVG via the shared bar | — |
| S27 | 33, 192 | Tube rack picture for master mixes (PCR mix, pipetting scheme) | ✅ Shared `pRack` in `01_pic.js`; rack with master-mix tube + one tube per reaction in the PCR mix, and one tube per column in the pipetting scheme. Both capped at a maximum number of tubes | — |
| S28 | 29 | Shared plate designer, part 1: plate formats 6–384, select and colour wells, legend | ✅ `plateDesigner()` in `tools/nt/02_plate.js`: own state per instance, formats 6–384, groups with legend, click and drag (mouse and touch), `get`/`set`/`draw`/`size`. Verified standalone; it gets its first mount at S33 | — |
| S29 | 29 | Plate designer part 2: drag to fill replicates, auto-fill a dilution across a row | ✅ "Herhalingen" (1–8) + richting: één klik of sleep vult meteen 2–8 replica's naast of onder elkaar, afgekapt aan de plaatrand; rij- en kolomkoppen zijn knoppen die de hele rij/kolom vullen (ook met de gum); "Reeks…" zet een verdunningsreeks neer met een eigen concentratielabel per putje (nieuwe `vals` in de toestand, meegetekend op canvas). Gecontroleerd met muis én aanraking in NL en EN | — |
| S30 | 30, 37 | Plate templates (standards in duplicate + blanks + samples) and A4 plate map print | ✅ `PLTPL` met 4 sjablonen in `02_plate.js`: ELISA-standaardcurve (7 standaarden + blanco in duplo in kolom 1–2, monsters in 3–12), qPCR in triplo (28 monsters + controle en NTC in rij H), MIC-titratie (1:1–1:512 met groei- en steriliteitscontrole) en buitenrij als buffer (elk formaat). "Plaatkaart" drukt op A4 liggend af: tekening, legenda met aantal putjes per groep en een tabel van alle gelabelde putjes; groepsnamen die de app zelf geeft worden vertaald, zelfgetypte namen blijven staan | — |
| S31 | 31, 32 | Pipetting order view and multichannel planning | ✅ Vinkje "Vulorde" zet in elk gevuld putje het stapnummer (ook in de tekening, de PNG/SVG en op de plaatkaart); de orde loopt per groep, want per groep pak je één keer tips, en binnen een groep volgt hij de gekozen richting. Eronder staat het meerkanaalsadvies: welke kolommen en rijen helemaal één groep zijn en dus in één streek kunnen, hoeveel putjes los overblijven, welke richting het snelst is en welke kolom door twee groepen niet in één streek kan | — |
| S32 | 38, 39 | Randomised layout with a key, and edge-effect warning | ✅ "Randomiseren…" wisselt de gevulde putjes onderling van groep en label met een sleutelnummer (xorshift32, dus hetzelfde nummer geeft dezelfde indeling terug); desgewenst maar één groep, zodat standaarden en controles blijven staan. "Sleutel…" toont en print label → putje met het sleutelnummer erbij, en het nummer staat ook op de plaatkaart. Randwaarschuwing per groep: hoeveel putjes op de buitenrand liggen en of één groep er veel vaker staat dan een andere (dan zit het verschil deels in de plaats), met een knop "Buitenrand leegmaken". Bij 6 en 12 putjes is álles rand, dus dan geen waarschuwing | — |
| S33 | 234 | Plate layout tool becomes the plate designer | ✅ `plaat` gebruikt nu `plateDesigner`: de eigen plaatcode (drie lagen monkey-patching op `renderPlate`, `groups`/`wells`/`selG`/`wText`) is weg en alle plaatcode van de tool staat in één blok ná de module, want die moet eerst gedefinieerd zijn. De ontwerper kreeg wat `plaat` extra had: vorm van de putjes, kleurkiezer + aantal per groep in de legenda, "+ kleur toevoegen" met een kleur die genoeg verschilt, automatische labels (St1, Mo2) en een tekstmodus per putje met Enter naar het volgende. De tool houdt titel, palet, legenda in de afbeelding, toelichting, tabel/CSV en de grote tekening, en krijgt er sjablonen, reeks, vulorde, randomiseren en de plaatkaart bij (plus 384 putjes). Oude sessies migreren: `plate.wells`/`groups` en de aparte `wt`-tekst gaan over naar `vals`. `tests/validate.py`, `layout_audit.py` en `i18n_collect.py` draaien nu op de ontwerper-API | — |
| S34 | 170 | ELISA tool uses the plate designer | ✅ De plaatontwerper staat nu in *ELISA-plaatanalyse* als tweede manier om de plaatindeling te vullen, in beide richtingen gekoppeld aan het tekstvak `el-l`; de berekening leest nog steeds dat vak, dus de uitkomsten zijn ongewijzigd (ELISA-validatie 4PL blijft 1000 pg/mL, 267/267). Verven kiest de soort (B/S/M), het nummer komt van replicaatblokken: aangrenzende putjes van dezelfde soort zijn één replicaat en krijgen samen één nummer, in de gekozen richting. Daarvoor mag `opts.autoLabel` van de ontwerper nu een functie zijn. Zelf getypte namen gaan altijd voor, en "Replicaten opnieuw nummeren" wist die weer | — |
| S35 | 199 | qPCR plate layout uses the plate designer + instrument export format | ✅ De gegenereerde indeling komt nu in de plaatontwerper (één groep per doelgen, de naam van het putje is het monster, de taak volgt uit die naam: St1…Stn, NTC, anders monster) en is daarna met de hand bij te stellen; tekening, mastermixen en plaatlijst lezen de ontwerper. Alleen de velden die de indeling bepalen vullen de plaat opnieuw, dus de exportvorm of de marge wist je eigen wijzigingen niet meer. Drie exportvormen: eigen tabel, Applied Biosystems (tab, Well Position/Sample Name/Target Name/Task met UNKNOWN/STANDARD/NTC) en Bio-Rad CFX (komma, Well/Target/Content/Sample met Unkn/Std/NTC); kolomnamen en taakwoorden blijven onvertaald en komma's in een naam worden aangehaald. Ook een i18n-lek weg: de genaam zat eerder in de vertaalsleutel van de legenda en de mastermixregel | — |
| S36 | 60 | Sample sheet: paste names once, reuse in plates, gels and master mixes | ✅ Eén monsterlijst in `labkit:v1:samples`, te openen met een knop "Monsters…" uit drie tools. Een tool meldt met `smpUse(id, fn)` hoe hij de namen toepast: *Plaatindeling* geeft elk replicaatblok van de gekozen groep de volgende naam (nieuwe `P.blocks()` in de ontwerper: aangrenzende putjes van dezelfde groep zijn één blok, in de gekozen richting), de *Gelplanner* maakt één laan per naam met de volumes en kleur van de bestaande lanen, en de *qPCR-plaatindeling* vult het monsterveld en vult de plaat opnieuw. Scheiden op regel, komma, puntkomma of tab; "Alleen bewaren" laat de tool ongemoeid | — |

## Phase 4: preparation, recipes and sequences (11 steps)
| Step | Ideas | What | Done when | Model |
|---|---|---|---|---|
| S37 | 40 | Recipe library data: 15 common buffers and media with sources | ✅ `tools/nt/03_recipe.js`: 16 recepten (`RECIPES`), met per recept een naam, een stap over pH/vloeistof/steriliseren en de bron (`RECNAME`, `PH`, `RECSRC`). Nieuw: TBS, TBS-T, TE, TAE 50×, SSC 20×, Tris-glycine-SDS 10×, Towbin, carbonaat-, citraat- en fosfaatbuffer, LB, LB-agar en SOC. De keuzelijst wordt uit de bibliotheek gebouwd en de bron staat onder de stappen. Validatie van 4 recepten (TAE 50×, Tris-glycine-SDS 10×, SOC naast de bestaande PBS en TBE) tegen de gepubliceerde g/L. Drie i18n-lekken opgeruimd: de componentlijst in de stap en de afgebroken regels van het stappenschema op het canvas leverden eerder een sleutel per recept op, en een volume ≤ 0 geeft nu geen massa meer | — |
| S38 | 40, 153 | Recipe library UI in *Oplossing & buffer*: scale to volume, tick-off per component, printable card | ✅ Zes knoppen voor een snel eindvolume (50–500 mL, 1 en 2 L); de massa schaalt lineair mee omdat een recept op concentratie staat. Een vinkje per component met voortgang ("2 van de 4 afgewogen") en een gedimde rij als hij af is; de vinkjes gaan uit zodra het recept of het volume verandert. "Receptkaart afdrukken" geeft een A4-kaart met het volume, een tabel met concentratie, massa en een leeg afvinkvakje, de werkwijze, de bron en een regel voor bereider, datum en houdbaarheid | — |
| S39 | 43, 45, 154 | Hydrate options, autoclave/filter advice, weighing order tips | ✅ Hydraatkeuze bestond al (`HYD`); de bibliotheek vult hem nu aan met soda (Na₂CO₃ watervrij / ·H₂O / ·10H₂O) via `RECHYD`. `RECSTER` geeft per recept steriliteitsadvies met een reden: autoclaveerbaar of juist niet (Tween en SDS breken af, methanol is brandbaar, carbonaat verliest CO₂), antibiotica onder 50 °C en glucose in SOC apart steriel gefiltreerd. Balansadvies per component uit het 2s-criterium (USP <41>): onder 20 mg geen 1% op een 0,1 mg-balans, dus stock maken; tot 2 g analytische balans; daarboven is een precisiebalans genoeg. Daaronder de weegorde: eerst het kleine werk op de analytische balans | — |
| S40 | 44, 53 | pH adjustment helper and cell culture media prep | ✅ Twee nieuwe tools, de eerste die als Vue-component zijn gebouwd in plaats van omgezet. *pH bijstellen*: hoeveel sterk zuur of sterke base een buffer nodig heeft om op de doel-pH te komen, uit f(zuur) = 1/(1+10^(pH−pKₐ)), met 8 buffersystemen, beide richtingen (vanaf de vrije base of het vrije zuur) en een waarschuwing als de doel-pH meer dan 1 eenheid van de pKₐ ligt. Gevalideerd tegen de Tris-Cl-tabel van Sambrook & Russell (70/60/42 mL geconcentreerd HCl → 68/61/44, binnen 3–5%, wat klopt voor een schatting zonder activiteitscoëfficiënten) en tegen het halfequivalentiepunt van acetaat. *Celkweekmedium klaarmaken*: basismedium, FBS, pen/strep, glutamine en een eigen supplement voor elk eindvolume, met percentages over het eindvolume | — |
| S41 | 51, 52, 54 | Overage switch on all master mixes, antibody dilution planner, transformation prep card | ✅ *Overmaatschakelaar*: `overage(n, mode, pct)` in `src/lib/overage.js` (`pct` = n × (1 + pct/100), `plus1` = n + 1, `none` = n, met een uitlegzin) en de gedeelde component `lk-overage` (select met % marge / +1 reactie / geen, met de uitleg eronder). Erop gezet bij PCR-mastermix (q-ov), Restrictiedigestie (dg-ov), Pipetteerschema (pp-ov), Cellen uitzaaien (sd-ov), Transfectie (trf-ov), cDNA-synthese (cd-ov, ook voor de no-RT-mix), qPCR-plaatindeling (qp2-ov) en Flowcytometrie (fc-ov; het veld *Overmaat* heet daar nu *Extra marge*); standaard `pct`, dus alle bestaande uitkomsten zijn gelijk gebleven. *Antistofverdunning* in *Verdunning* (ab-d, ab-v/ab-u, ab-k, ab-ov, ab-x; totaal = V × factor, antistof = totaal / N, buffer = rest); validatie: 1:1000, 2 × 10 mL + 10% → 22 µL en 21,978 mL, met +1 reactie 30 µL. *Transformatiekaart* in *Transformatie* (tf-n, tf-cells, knop tf-card): de acht stappen van het NEB-protocol C2987H met totalen cellen en SOC, en een A4 met hokjes, temperatuur, tijd en Uitgevoerd door/Datum. Niet gedaan: geen andere tools met een mastermix gevonden; de tekst boven de PCR-uitkomst kreeg twee zinnen (nieuwe vertaalsleutels). | — |
| S42 | 46 | Primer card (Tm, GC%, length, self-dimer, hairpin) in *Primers oplossen* | ✅ Nieuw blok *Primerkaart*: één primer per regel (naam en sequentie), per primer lengte, GC%, Tm (nearest-neighbor, standaard van PCR-cyclus) en de ΔG°37 van het sterkste zelfdimeer en de stabielste haarspeld, met 3′-eind apart; waarschuwingen volgens de grenzen van Premier Biosoft plus GC-klem en reeksen van 5 dezelfde basen. "Primerkaart afdrukken" geeft een A4. Rekenwerk in `src/lib/primer.js` (ook voor S43/S44); validatie: zelfdimeer GAATTC tegen de ΔG-tabel van SantaLucia 1998. Mismatches en bulges telt het model niet mee | — |
| S43 | 47 | Primer pair checker (Tm difference, cross-dimers) | ✅ In *Primerkaart* kies je bij twee of meer primers een forward en een reverse; daaronder staan ΔT<sub>m</sub> (waarschuwing boven 5 °C), de ΔG van de kruisdimeer (3′-eind apart, grenzen als bij de zelfdimeer) en de startwaarde voor annealing (laagste T<sub>m</sub> − 5 °C), en het paar komt ook op de afgedrukte kaart; validatie: kruisdimeer CGTTGA/TCAACG tegen SantaLucia 1998 | — |
| S44 | 48, 193, 194 | In-silico PCR on a pasted template; annealing temperature into PCR cycle and gradient PCR | ✅ *PCR-cyclus* heeft een blok *In-silico PCR*: template plakken (ook FASTA), lineair of circulair; een primer bindt waar zijn laatste 15 basen precies passen, afwijkingen aan de 5′-kant worden geteld en zitten in het product. Toont het verwachte product (forward + reverse), alle bindingsplaatsen met streng en positie, bijproducten tot 10 kb en een knop die de productgrootte als ampliconlengte overneemt (extensietijd). *Gradiënt-PCR* kreeg "Rond de annealingtemperatuur uit PCR-cyclus" (T_a ± 6 °C, gewenst T_a en ±3 °C). Validatie: productgrootte lineair en circulair over het nulpunt. Niet gedaan: de gel per kolom (#194) en mismatches in het 3′-anker | — |
| S45 | 49, 207 | In-silico digest with an enzyme list (~40 enzymes), double-digest buffer check, send fragments to the predicted gel *(partly there: the buffer check for a double digest exists in Restrictiedigestie)* | ✅ *Restrictiedigestie* heeft een blok *In-silico digestie*: sequentie plakken (ook FASTA), lineair of circulair, geknipt met enzym 1 en 2 uit de keuzelijsten, die nu 50 enzymen tellen (`src/lib/digest.js`: plaats, knipposities in REBASE-notatie, temperatuur, NEB-buffer; type uiteinde volgt uit de knipposities; BsaI/BsmBI ook op de onderste streng). Toont knipplaatsen per enzym en de fragmenten met begin, einde en enzym aan elke kant; "Stuur naar de Gelplanner" maakt een laan met de fragmenten als verwachte banden. De bestaande check op temperatuur kreeg een buffercontrole erbij (melding als de aanbevolen buffers verschillen). NEBcutter is vanuit de cloud niet bereikbaar, dus vergeleken met Biopython Bio.Restriction (REBASE, dezelfde enzymdata): alle 50 enzymen gelijk op pFA6a-kanMX6 en een willekeurige 20 kb-sequentie; validatie met vier digesties van pFA6a-kanMX6 (`tests/fixtures/pFA6a-kanMX6.fa`). Niet gedaan: Dam/Dcm-methylering en de activiteit in een tweede buffer (alleen de aanbevolen buffer) | — |
| S46 | 50 | Plasmid map (circular drawing, features, sites, primers) from sequence or GenBank | ✅ Nieuwe tool *Plasmidekaart* (`src/tools/Plasmid.vue`, id-voorvoegsel `pl-`): plak een sequentie, FASTA of GenBank-bestand en krijg een ronde kaart met de kenmerken als gekleurde pijlen, de knipplaatsen erbuiten en de primers erbinnen, plus tabellen met kenmerken, knipplaatsen en primerbindingen. `src/lib/genbank.js` leest LOCUS, FEATURES (met /label, /gene, /product, afgebroken regels, complement, join en een kenmerk over het nulpunt) en ORIGIN; `src/lib/plasmidmap.js` tekent en plaatst de labels links en rechts zonder overlap. Knipplaatsen komen uit `digest.js` (S45, standaard alleen de enzymen die één keer knippen, hoogstens 40 op de kaart), primerbindingen uit `primer.js` (S44). De tekening gaat door de gedeelde exportbalk, dus PNG, SVG (echte vectoren: 84 paden, geen bitmap), kopiëren en afdrukken werken. Validatie tegen het GenBank-bestand van pFA6a-kanMX6 en Biopython (REBASE). Onderweg een fout uit S41 gevonden en hersteld: *PCR-mastermix* riep `lkNumIn` aan in zijn sjabloon zonder die te ontsluiten, waardoor de pipetteerregel niet verscheen | — |
| S47 | 56, 58, 59 | Material list, protocol export of preparation outputs, QR code on printed protocols | ✅ Materiaallijst: `matRegister`/`matList` in `src/lib/material.js`; *Oplossing & buffer*, *PCR-mastermix*, *Restrictiedigestie*, *Celkweekmedium* en *Gelplanner* melden een lijst (item en hoeveelheid, uit wat de tool al berekent), alleen zichtbaar in het afdrukprotocol. *Rapport* heeft de vakjes *Materiaallijst opnemen* en *QR-code per tool* en de knop *Alle voorbereidingstools* (voorbereiden-tools die je recent gebruikte, anders alle); `rpDoc` krijgt een optioneel zesde argument `{mat, qr}` (zonder is de uitvoer gelijk), zet bovenaan één gezamenlijke *Materiaallijst* per tool en per tool een afvinklijst *Materiaal*. `qrSvg(text, px)` bouwt een inline QR uit `qrMatrix`; per tool staat hij rechtsboven met de deellink als die niet langer is dan 1500 tekens. Validatie: PBS-materiaallijst, QR en protocol. Weggelaten: de lijst op het scherm; de Gelplanner kent geen tankbuffervolume, dus alleen gel, agarose, ladder en laadbuffer; Word-export (docx) gebruikt `rpDoc` en krijgt de lijst en QR mee. | — |

## Phase 5: execution (13 steps)
| Step | Ideas | What | Done when | Model |
|---|---|---|---|---|
| S48 | 61 | Bench mode shell: full-screen step cards, swipe/tap, Wake Lock, high contrast | ✅ `Bench.vue` is een laag over de hele app (`openBench({title, steps})`): één stap per kaart in zwart/wit/geel, vegen of de grote knop, een lijstweergave met vinkjes, Escape/pijltjes, Wake Lock (met melding als de browser die niet geeft). Eerste bron: *Experimentplanner*, waar een wachtstap een knop krijgt die zijn timer start | — |
| S49 | 62 | Step checklists generated from pipetting scheme, master mix and dilution scheme | Tick-off persists per run | Opus 5 |
| S50 | 62, 61 | Checklists for recipe cards and the Gelplanner; open them in bench mode | 5 tools feed bench mode | Sonnet |
| S51 | 71, 72 | Master mix progress and plate filling assistant (tap wells as filled) | Progress shown *(needs S28)* | Sonnet |
| S52 | 73 | Gel loading assistant in the Gelplanner | *(needs S13)* | Sonnet |
| S53 | 74, 76 | Run notes (text + photo) and deviation log, sent to the report | Notes in report | Sonnet |
| S54 | 81, 82, 233 | Pipette advice and < 1 µL warning inline next to every pipetting volume *(partly there: pipette limit already in PCR-mastermix, Ligatie, SDS-PAGE, cDNA, Primers oplossen, Verdunning)* | Shown in all mixing tools | Sonnet |
| S55 | 70, 232 | Saved rotors and a centrifuge balance diagram | Rotor profiles persist | Sonnet |
| S56 | 83, 85, 180 | Reminders linked to the workflow timeline; passage calendar | Notifications fire | Opus 5 |
| S57 | 84, 175 | Live OD tracking with target-time prediction; log-phase detection in the growth curve | Prediction updates per reading | Opus 5 |
| S58 | 88, 89 | Offline indicator and dark-room (red) mode | Toggle in header/settings | Sonnet |
| S59 | 68, 174 | Colony counting from a photo (detect, tap to correct), linked to dilution series & CFU | Count within 10% on test images | Opus 5.5 |
| S60 | 69 | Cell counting from a microscope photo (live/dead by colour) | Count on test images | Opus 5 |
| S61 | 87 | Multi-device sync of one run over WebRTC with a QR pairing code | Phone and laptop stay in sync | Opus 5.5 |

## Phase 6: gel editor rebuild (18 steps)
Automatic ladder detection stays, and every ladder label (number or text) stays editable.

| Step | Ideas | What | Done when | Model |
|---|---|---|---|---|
| S62 | 97 | Project files `.labkitgel` (photo, lanes, ladder, labels, settings) save/open | Reopened gel is identical | Opus 5 |
| S63 | 98 | Gel library with thumbnails (IndexedDB) | Recent gels listed | Sonnet |
| S64 | 95 | Type lane labels on the image; Tab to next lane; paste a list | Labels editable in place | Opus 5 |
| S65 | 110 | Saturation warning overlay | Clipped pixels highlighted | Sonnet |
| S66 | 117, 118 | Auto figure legend and result table per lane (Excel copy) | Legend + table | Sonnet |
| S67 | 119 | Ladder library editor: add/share custom ladders | Custom ladder used by detection | Opus 5 |
| S68 | 96 | Figure style presets (journal, report, publication, poster) | One click restyles the export | Sonnet |
| S69 | 92 | Guided mode: 4 steps, auto-detect first, "Expert" shows all | New users finish a gel in 4 screens | Opus 5.5 |
| S70 | 91 | Canvas-first layout part 1: big image, toolbar, context panel (desktop) | All existing functions reachable | Opus 5.5 |
| S71 | 91 | Canvas-first layout part 2: bottom sheet on phones | Usable at 375 px | Opus 5 |
| S72 | 93 | Direct manipulation part 1: drag lane borders, zoom around cursor | Drag + zoom | Opus 5 |
| S73 | 93, 120 | Direct manipulation part 2: drag/add bands, double-click to measure, touch gestures | Mouse + touch | Opus 5.5 |
| S74 | 94 | Undo/redo with visible history | Every edit undoable | Opus 5.5 |
| S75 | 99, 100, 101 | Before/after slider, auto-enhance with list of edits, integrity notice in the export | Edits listed | Opus 5 |
| S76 | 107, 108 | Smart crop and perspective correction | Angled phone photo straightened | Opus 5.5 |
| S77 | 109, 104 | Curved-lane correction and lane intensity profiles | Profile under each lane | Opus 5.5 |
| S78 | 111, 112, 113, 114 | Band size labels, annotations (arrows, boxes), channel choice, pseudo-colour LUTs | All in the Labels panel | Opus 5 |
| S79 | 102, 103, 115, 116, 202, 204 | Compare with predicted gel, multiple gels per figure, SVG export, copy with caption; agarose tool and WB normalisation connect to the editor | WB intensities flow to normalisation | Opus 5.5 |

## Phase 7: charts, figures and data (17 steps)
| Step | Ideas | What | Done when | Model |
|---|---|---|---|---|
| S80 | 122, 130 | Shared chart style system (fonts, sizes, palettes) applied to the chart helper | All charts use it | Opus 5.5 |
| S81 | 129, 125 | Error bar choice (SD/SEM/CI) and bar + dot plots | Labelled in legend | Sonnet |
| S82 | 123 | SVG export for every chart *(partly there: SVG recorder from S21; 14 of 47 canvases have the bar)* | SVG opens in Inkscape | Sonnet |
| S83 | 127 | Chart editor panel (titles, ranges, log axis, legend, colours) | Remembered per chart | Opus 5 |
| S84 | 124 | Significance brackets from statistics output | Stars drawn on bar charts | Sonnet |
| S85 | 128 | Box, violin and scatter plots in Statistics | 3 new plot types | Opus 5 |
| S86 | 126, 131 | Plate heatmaps and toggleable data tables under charts | Heatmap for plate tools | Sonnet |
| S87 | 132, 133 | Chart annotations and overlaying several runs | Text/arrows/lines | Sonnet |
| S88 | 134, 135 | Colour-blind preview and poster export | Preview toggle | Sonnet |
| S89 | 121 | Figure maker part 1: canvas, drop outputs from tools | Panels placed | Opus 5.5 |
| S90 | 121 | Figure maker part 2: A–D lettering, alignment, PNG/PDF/SVG export | 600 dpi export | Opus 5 |
| S91 | 136 | Plate-reader import wizard part 1: parser for 3 formats *(partly there: Standaardcurve reads a pasted plate grid)* | Test files parse | Opus 5 |
| S92 | 136 | Import wizard part 2: map wells → standard curve, ELISA, Z′ | Data lands in the tool | Opus 5 |
| S93 | 137, 195 | qPCR instrument import (CFX, QuantStudio, LightCycler) *(partly there: qPCR-analyse reads a pasted Ct table by its header)* | Ct tables import | Opus 5 |
| S94 | 138, 139 | NanoDrop and flow summary import | Both import | Sonnet |
| S95 | 140, 147, 141 | Interpretation lines, reference ranges, replicate checker | Shown in 10 tools | Sonnet |
| S96 | 142, 143, 149, 150, 146, 145, 148, 144 | Results to report, method sentences, Excel with formulas, answer check, sig figs, output units, batch mode, uncertainty propagation (in 2–3 sub-steps if needed) | Each in the core calculators | Opus 5 |

## Phase 8: rework existing tools (20 steps)
| Step | Ideas | What | Model |
|---|---|---|---|
| S97 | 151, 152, 155 | Dilution: tube visual, serial mode; live two-way unit converter | Sonnet |
| S98 | 156, 157, 158 | Molar mass name lookup; buffer picker; Tris temperature correction | Sonnet |
| S99 | 159, 160, 161 | Interactive titration curve; osmolarity presets; merge chemistry calculators into one tool | Opus 5 |
| S100 | 162, 163 | Standard curve: compare models (AIC) and residual plot with click-to-exclude | Opus 5 |
| S101 | 164, 167, 171, 172 | Out-of-range unknowns, wavelength presets, Z′ verdict, purification chart | Sonnet |
| S102 | 165, 166 | Enzyme kinetics: all plots from one table; inhibition comparison | Sonnet |
| S103 | 168, 169 | Dose-response multi-compound; chromatography peak import | Sonnet |
| S104 | 173, 176 | CFU plate drawing with countable range; growth curve comparison stats | Sonnet |
| S105 | 177, 178 | One cell-counting tool with grid entry (merges telkamer, teller, viability) | Opus 5 |
| S106 | 179, 181, 183 | Seeding picture; visual MIC plate with EUCAST note; MPN tap tubes | Sonnet |
| S107 | 184, 187 | Measure cells on calibrated photos; disinfection log-reduction chart | Sonnet |
| S108 | 188, 189, 190 | DNA quant batch + purity badge + "make it X ng/µL"; read primer synthesis report | Sonnet |
| S109 | 191, 200 | PCR mastermix and cDNA kit presets | Sonnet |
| S110 | 196, 197, 198 | qPCR efficiency from standard curve; fold-change chart; melt curve overlay | Sonnet |
| S111 | 201, 205, 206 | Virtual electropherogram; ligation ratio picture; transformation plate tap-count | Sonnet |
| S112 | 208, 209, 210 | STR electropherogram view; shared allele frequency table; bloodstain drawing | Sonnet |
| S113 | 213, 215, 216 | Statistics "which test?" wizard, inline assumption checks, long-format paste | Opus 5 |
| S114 | 214, 217, 218, 219, 220 | APA sentence; Bland-Altman bias; ROC cut-off; Kaplan-Meier risk table; sig-fig practice | Opus 5 |
| S115 | 221, 222 | Pipette profiles + certificate; Westgard violations on the chart | Sonnet |
| S116 | 223, 224, 226 | Uncertainty pie chart; validation report template; pipetting scheme drag rows + kit templates | Sonnet |

## Phase 9: structure and workflows (5 steps)
| Step | Ideas | What | Model |
|---|---|---|---|
| S117 | 2 | Data flow between workflow steps (DNA conc → PCR → Gelplanner → gel editor) | Opus 5.5 |
| S118 | 5 | Projects: group inputs, gels and notes under a name; switch projects | Opus 5.5 |
| S119 | 6, 7 | Custom workflows (pick tools, save, share) and course workflow templates | Opus 5 |
| S120 | 19 | Share a whole workflow run as one link/QR | Opus 5 |
| S121 | 9 | Search that understands questions ("500 mL 0.9% NaCl" opens the tool with values filled in) | Opus 5 |

## Phase 10: performance (12 steps)
| Step | Ideas | What | Model |
|---|---|---|---|
| S122 | 246, 247, 251 | Idle preload of the English dictionary; check compression; SVG/WebP assets and lazy demo gel | Opus 5 |
| S123 | 250, 252, 253 | Minified build output; idle precache of heavy parts; desktop splash | Opus 5 |
| S124 | 249 | Critical CSS for the start page first | Opus 5 |
| S125 | 243 | Lazy-initialise tools, part 1: init registry + 30 tools | Opus 5.5 |
| S126 | 243 | Lazy init part 2: remaining tools; startup test updated | Sonnet |
| S127 | 244 | Template hidden tools (DOM 10.7k → ~1.5k nodes), part 1 | Opus 5.5 |
| S128 | 244 | Templates part 2 + fix tools that read hidden DOM (report, search) | Opus 5 |
| S129 | 254, 255, 265 | Gel processing in a Web Worker; downscaled preview; free memory on leave | Opus 5.5 |
| S130 | 256, 263, 264 | Layered gel canvas; layout-thrash audit; passive listeners | Opus 5 |
| S131 | 257, 258, 260, 262 | Fits in a worker; redraw only visible charts; rAF batching; canvas text cache | Opus 5 |
| S132 | 259, 261, 266, 267 | Diff undo; virtual tables; throttled saves; IndexedDB storage | Opus 5.5 |
| S133 | 268 | WebAssembly for the heaviest image steps (only if S129 isn't enough) | Opus 5.5 |

## Phase 11: quality, tests and dev (9 steps)
| Step | Ideas | What | Model |
|---|---|---|---|
| S134 | 269, 273 | Bundle size budget and memory check in `perf_budget.py` | Sonnet |
| S135 | 270, 271, 274 | Gel editor benchmark, mobile Lighthouse, typing-latency (INP) test | Sonnet |
| S136 | 275 | Performance summary in the CI run | Haiku |
| S137 | 284, 285, 289 | Copy error report, feedback link per tool, export/import everything | Sonnet |
| S138 | 278 | Unit tests for pure calculation functions | Sonnet |
| S139 | 279 | Visual regression screenshots for key tools and the gel editor | Sonnet |
| S140 | 280, 281, 282, 283 | Screen-reader results, keyboard gel editor/plate designer, theme contrast check, reduced motion | Opus 5 |
| S141 | 288, 294 | Consistent source citation per result; local "most used tools" overview | Sonnet |
| S142 | 292 | Desktop auto-update via the Tauri updater | Opus 5 |
| S143–S146 | 276, 277 | ✖ Split source from build and move all in-place tools into modules: **moved forward and replaced by phase 16 (S264–S272)**, because after the Vue migration it blocks every feature step instead of waiting until the end | — |

## Phase 12: Sanger and SNP analysis (23 steps)

New block from ideas #296–#333. Needs nothing from the other phases, so it can run on its own; S154 and S162 are nicer after the figure maker (S87) and the batch mode, but work without them.

### Who does what (phase 12, in plain words)

| Step | Who does it |
|---|---|
| 1. Open the `.ab1` file and draw the four coloured traces | LabKit |
| 2. Put the letters above the peaks | LabKit — they are already in the file, it only reads them |
| 3. Correct a letter that is wrong | You. LabKit keeps the original next to it |
| 4. Decide whether a position is a heterozygote | LabKit proposes it from the peak heights, you confirm |
| 5. Say which allele is which, on the right strand | LabKit, from the assay file or from dbSNP (S199) |
| 6. Check the forward read against the reverse read | LabKit |
| 7. Fill in and check the HIrisPlex-S sheet | LabKit |
| 8. **Predict eye, hair and skin colour** | **The Erasmus MC webtool. LabKit does not do this** |
| 9. Summary and figure for the report | LabKit |

**Deliberately not in LabKit:** basecalling from scratch (the sequencer already did it), the colour prediction itself (the formula is not public), and any result presented as a clinical or forensic conclusion. Every automatic call is a proposal you can see the evidence for and change.

| Step | Ideas | What | Done when | Model |
|---|---|---|---|---|
| S147 | 296 | ABIF parser as a lib module: big-endian header, tag directory, typed values; metadata out (sample, date, instrument, dye set) | A test `.ab1` gives the right sample name and read length | Opus 5 |
| S148 | 296 | Read the data tags: channel order from `FWO_`, traces `DATA.9–12`, basecalls `PBAS.2`, peak positions `PLOC.2`, quality `PCON.2` | One object with 4 traces and n bases = n positions | Opus 5 |
| S149 | 296, 303 | New *Chromatogram* tool: drop/choose a file, metadata card, sequence panel; FASTA and pasted text as fallback | File opens, sequence readable | Sonnet |
| S150 | 297, 332 | Canvas trace rendering: 4 channels, zoom, pan, overview strip, decimation to ~2 points per pixel | Smooth over a 900-base read | Opus 5 |
| S151 | 298, 309 | Automatic base labels at the peak positions, each one editable, original call kept and the edit marked | Label changes and stays after a reload | Sonnet |
| S152 | 299 | Quality bars per base, colour-coded, plus a trim suggestion with an adjustable window and threshold | Trim marks the expected ends on a test read | Sonnet |
| S153 | 300, 301 | Sequence panel synced to the trace both ways, range selection, copy as FASTA, reverse complement toggle | Click-to-trace and copy both work | Sonnet |
| S154 | 304, 305 | Export PNG/SVG of the window, trimmed FASTA, and a print layout in rows of 60 bases | One printed page looks right | Sonnet |
| S155 | 306, 307 | Secondary-peak ratio per position with an adjustable threshold, heterozygotes as IUPAC codes in sequence and trace | A known het sample is called R/Y correctly | Opus 5 |
| S156 | 308, 310 | SNP table per read (position, genotype, 4 peak heights, ratio, quality) and the warning flags, slippage included | Table exports; flags fire on a bad read | Sonnet |
| S157 | 309 | Override panel: change any call by hand, see what was original, reset per position or all | Overrides survive a reload | Sonnet |
| S158 | 311 | Reference sequence input and an anchored banded alignment of the read against it | Alignment finds the right offset on a shifted test read | Opus 5.5 |
| S159 | 312, 313 | Variant list in reference coordinates with `g.` notation and rs numbers from the assay | Known SNP shows up with its rs number | Opus 5 |
| S160 | 317, 318, 319 | Assay definition format (amplicon, SNPs, alleles, strand), an editor for your own panel, one built-in teaching panel, automatic strand flip | Own panel can be saved and reused | Opus 5.5 |
| S161 | 302, 314 | Two reads of one sample side by side and forward/reverse confirmation with disagreements highlighted | A deliberate mismatch is flagged | Opus 5 |
| S162 | 315, 316 | Batch drop of many files to a genotype table per sample, and the per-SNP overlay across samples | 10 files give 10 rows | Sonnet |
| S163 | 331, 333 | Move parsing and alignment into a Web Worker and load the whole module lazily | `perf_budget.py` startup unchanged; UI stays responsive on 20 files | Opus 5 |
| S164 | 321, 322, 328 | HIrisPlex-S genotype sheet: 41 SNPs in order, `0/1/2/NA`, per-SNP allele check, panel switch IrisPlex / HIrisPlex / HIrisPlex-S | Sheet fills and validates by hand | Sonnet |
| S165 | 321, 323 | Fill the sheet from the called genotypes (needs S160), count `NA`s and warn per sub-model | Autofill matches a hand-filled sheet | Sonnet |
| S166 | 324, 325, 327 | Export in the webtool's `.csv` layout, copy button, link and explanation, and the note about not predicting locally | Exported file matches the official template header | Haiku |
| S167 | 326 | Result sheet for the returned probabilities, with a summary and a figure for the report | Report section renders | Sonnet |
| S168 | 329, 330 | Worked example sample and saving a whole case (reads, calls, assay, sheet, results) as one project file | Example runs end to end without a sequencer | Sonnet |
| S169 | 320 | SNaPshot / SBE mode: read peaks per dye and size instead of per base | A `.fsa`-style SBE run gives one genotype per SNP | Opus 5 |

## Phase 13: alignment and Clustal Omega (21 steps)

Ideas #334–#368. Clustal Omega itself stays at EBI: it is a compiled program with its own clustering and HMM alignment, so LabKit reads and analyses its output, converts formats, checks its input, and has a small alignment engine for a handful of short sequences. S180 is better after S158 (the alignment code from phase 12 is reused).

### Who does what (phase 13, in plain words)

| Step | Who does it |
|---|---|
| 1. Collect the sequences and check them (names, characters, DNA or protein) | LabKit |
| 2. Make a clean FASTA to upload | LabKit |
| 3. **Align many or long sequences** | **Clustal Omega at EBI. LabKit does not do this** |
| 4. Align two sequences, or a few short ones | LabKit itself, no internet needed |
| 5. Read the `.aln`, `.pim` and `.dnd` files back in | LabKit |
| 6. Colours, conservation, consensus, identity matrix, variant table, tree | LabKit |
| 7. Figure and print layout for the report | LabKit |

**Deliberately not in LabKit:** a copy of Clustal Omega's own alignment algorithm. LabKit's engine is for small jobs and says so where you use it.

| Step | Ideas | What | Done when | Model |
|---|---|---|---|---|
| S170 | 334, 335 | Parsers for Clustal `.aln`, aligned FASTA, PHYLIP, NEXUS, MSF and PIR into one alignment model | A real `.aln` opens with the right names and length | Opus 5 |
| S171 | 336, 366 | Alignment viewer: grid, sticky name column, position ruler, virtual rendering of visible cells only | Smooth on a 5000-column alignment | Opus 5.5 |
| S172 | 337 | Colour schemes: ClustalX groups, nucleotides, identity shading, colourblind-safe variant | All four work in all five themes | Sonnet |
| S173 | 338, 339 | Conservation row and plot per column, consensus with an adjustable threshold | Recomputed row matches the file's own `* : .` line | Sonnet |
| S174 | 340, 341, 342 | Gap statistics per sequence and column, overview strip, column details on click | Clicking a column shows the counts | Sonnet |
| S175 | 343, 345 | Motif search with highlights; reorder by name, by identity or by hand | Search finds a known motif in every sequence | Sonnet |
| S176 | 346 | Difference view against a chosen reference (dots where identical) | Toggle switches cleanly | Haiku |
| S177 | 344 | Trim and mask: gap-percentage filter, crop to a region, export the trimmed alignment | Trimmed export reopens correctly | Sonnet |
| S178 | 347, 348 | Percent identity matrix with heatmap, and pairwise identity with gap-handling options | Matrix matches a Clustal `.pim` for a test set | Sonnet |
| S179 | 349 | Conserved region finder with a threshold, sending a region to the primer tools (needs S42) | Region lands in the primer card | Sonnet |
| S180 | 350, 351 | Variant table in reference numbering, and inserting a called Sanger read into the alignment (needs S158) | Own read shows its variant in context | Opus 5 |
| S181 | 352 | Translate a nucleotide alignment to protein in a chosen frame, codon-aware columns | Protein view matches a known translation | Sonnet |
| S182 | 353, 354 | Newick / `.dnd` reader, tree drawing (rectangular and radial) with branch lengths and export | A Clustal guide tree draws correctly | Opus 5 |
| S183 | 355, 356 | Neighbour-joining tree from the identity matrix, and tree beside the alignment in one row order | NJ tree matches a worked example | Opus 5 |
| S184 | 357, 359 | Pairwise Needleman-Wunsch and Smith-Waterman with BLOSUM62/PAM250/DNA scoring and gap settings | Validation case against a published alignment | Opus 5 |
| S185 | 358, 360 | Small progressive multiple alignment for a handful of short sequences, with the note on when to use EBI instead | Five short sequences align sensibly; note visible | Opus 5.5 |
| S186 | 361 | FASTA input builder with checks: duplicate names, illegal characters, mixed types, long names, empty sequences, line endings | Every check fires on a deliberately broken input | Sonnet |
| S187 | 362, 363 | Hand-off to EBI (copy, link, which files to bring back) and format conversion both ways | Round trip Clustal → FASTA → Clustal is lossless | Sonnet |
| S188 | 364 | Figure export of the alignment or a region as PNG/SVG with adjustable block width, plus print layout | One printed page looks right | Sonnet |
| S189 | 365 | Project file holding alignment, tree and settings | Reopens with everything in place | Sonnet |
| S190 | 367, 368 | Parsing and the identity matrix in a Web Worker; load the module only when an alignment is opened | `perf_budget.py` startup unchanged | Opus 5 |

## Phase 14: sequence toolbox and NCBI lookups (11 steps)

Ideas #369–#390. **S191 is cheap and independent**, so it is a good one to pull forward: the reverse complement tool needs nothing from any other step. The NCBI part (S195–S201) is optional online behaviour; LabKit keeps working with the switch off.

### Who does what (phase 14, in plain words)

| Step | Who does it |
|---|---|
| 1. Reverse complement, translation, GC%, cleaning up a pasted sequence | LabKit, always, offline |
| 2. Look up what an rs number means (gene, position, which alleles exist) | NCBI, if you turn the switch on. LabKit asks and shows the answer |
| 3. Fetch a reference sequence by accession number | NCBI, same switch |
| 4. Decide your genotype from the peaks | LabKit, as before |
| 5. Match your two peaks to the right alleles and the right strand | LabKit, using NCBI's allele definitions |
| 6. Confirm the genotype | You |

**What leaves your computer:** the rs number or accession you ask about, and a tool name. No e-mail address unless you type one in yourself, and nothing about your samples, your results or you.
**Needs internet, and the published site or the Windows app.** Opened as a plain local file the browser blocks the request; LabKit then says so and you paste the sequence by hand.

| Step | Ideas | What | Done when | Model |
|---|---|---|---|---|
| S191 | 369, 370 | New *Sequentie* tool: reverse, complement, reverse complement with full IUPAC handling; paste clean-up of numbers, spaces and FASTA headers, multi-FASTA record by record | Reverse complement of an ambiguous test sequence is correct | Sonnet |
| S192 | 371, 372 | Output options (DNA/RNA, case, line width, plain or FASTA) and the facts panel (length, GC%, counts, MW, Tm) | GC% and MW match a validation case | Sonnet |
| S193 | 373 | Six-frame translation with a genetic code choice, ORFs and stop codons marked | Known ORF found in a test sequence | Sonnet |
| S194 | 374, 375, 376 | Restriction sites from the digest enzyme list (needs S45), send-to buttons, and receiving a selection from other tools | Sequence travels to the alignment tool | Sonnet |
| S195 | 377, 385, 386 | The online switch with its explanation, identification by tool name only, and the three failure cases handled plainly | Switch off = no requests at all; failures show a readable message | Opus 5 |
| S196 | 378, 379 | dbSNP lookup by rs number: gene, chromosome position, reference and alternative alleles, HGVS, functional class, frequency table | rs1805007 returns MC1R, chr16 and its alleles | Sonnet |
| S197 | 380, 381 | Reference sequence and region fetch by accession, into the reference field of the chromatogram and alignment tools | An `NM_` accession lands as the reference | Sonnet |
| S198 | 383, 384 | Local cache of all lookups and a rate-limited request queue (3/s, 10/s with a key) with an API key field | Second lookup of the same rs number makes no request | Opus 5 |
| S199 | 382 | Automatic allele and strand labelling of called peaks from dbSNP data (needs S160) | A reverse-strand SNP is labelled correctly without manual flipping | Opus 5 |
| S200 | 387, 388 | Fill an assay panel from a list of rs numbers, and batch-verify the 41 HIrisPlex-S SNPs against dbSNP (needs S164) | All 41 come back with alleles and positions | Sonnet |
| S201 | 389, 390 | The confirmation note on every looked-up genotype, and exporting the cache as an offline pack | Offline pack reopens with the switch off | Sonnet |

---

## Phase 15: the remaining tools onto Vue (63 steps)

> **Paths in this phase are from before phase 16.** What a row says is in `web/index.html` now lives in `src/legacy/core.js` or `src/legacy/app.js` (or, for the gel editor, timers and plate designer, in `src/engines/`; shared helpers in `src/lib/`); what it says is in `tools/nt/NN_x.js` is now `src/legacy/nt/NN_x.js`; generated files are in `src/generated/`. Notes about the DOM translation layer and its MutationObserver no longer apply: since S271 there is no observer.

**Af (2026-11-21):** alle 63 stappen. Elke rekentool en de app-schil (startpagina en
Instellingen) staan op Vue; de laag eronder is `src/lib/bridge.js` met de gedeelde componenten
in `src/lib/ui.js` en `t()` / `tHtml()` tegen dezelfde woordenlijst. Zie `CLAUDE.md`.

**Wat S204a opleverde voor de rest van de fase.** Negentien tabellen in zeventien tools komen
nog uit `ET()`. Die ruilen nu alleen `ET(...)` voor `<lk-etable>`; de twee fouten die daar
onderweg uit kwamen (een geplakt blok dat groter is dan de tabel liet rijen vallen, en een
kolom verschuiving bij een tabel die met een keuzelijst begint) zijn in de gedeelde laag
opgelost en hoeven niet per tool opnieuw gevonden te worden.

**Hoe een stap eruitziet.** Dit is een verhuizing, geen herontwerp:
- Het **rekenwerk gaat ongewijzigd mee.** Die functies zitten achter de validatiegevallen met
  gepubliceerde referentiewaarden; opnieuw uitschrijven levert niets op en zet die waarden op
  het spel. Alleen de weergave wordt opnieuw opgebouwd, met de gedeelde componenten in plaats
  van een string HTML.
- De **element-id's blijven** zoals ze zijn. Delen via een link, ongedaan maken, de
  invoeropslag en `tests/validate.py` zetten `.value` en sturen een `input`-event; verander je
  een id, dan breekt dat alles.
- De **kop en de bronregel blijven gewone HTML** in `tools/nt/<tool>.html`; Vue krijgt alleen
  de host ertussen. Zo blijven die vertaalsleutels gelden.
- Een **tekening op een canvas blijft met de tekencontext gemaakt.** Vue beheert de velden
  eromheen en tekent na elke render opnieuw (zie *Assaykwaliteit* als voorbeeld).
- Tekst die eerst deel was van een groter element heeft daarna vaak een **eigen vertaalsleutel**
  nodig; `tests/i18n_vue.py` wijst die aan.
- **Klaar is:** dezelfde uitkomsten, het validatiegeval van de tool nog groen, en
  `python tools/check.py` groen in het Nederlands en het Engels.

De stappen staan per navgroep bij elkaar, zodat je een hele groep in één keer kunt afmaken.
De drie zwaarste tools (*Statistiek*, *Gelplanner*, *Gelfoto-editor*) zijn in twee stappen
gesplitst; loopt een stap toch uit, splits hem dan verder in plaats van hem half af te maken.

| Step | Ideas | What | Done when | Model |
|---|---|---|---|---|
| S202 | — | *Oplossing & buffer* naar Vue | ✅ `src/tools/Oplossing.vue`; de tabel, de stappen, het advies en de receptkaart zitten in de component, `oBalance()` en de hydraatvormen blijven in `tools/nt/05_oplos.js`. `addRow()` in `tools/nt/99_app.js` en `tblRestore()` gaan via de `push`/`set`-haken op `TBLDEF`. Het stappenschema op het canvas blijft gewone HTML | — |
| S203 | — | *Buffercapaciteit*, *Oplosbaarheid (Ksp)* naar Vue | ✅ `src/tools/Bufcap.vue` en `src/tools/Ksp.vue`; het rekenwerk (`bcNbar`/`bcCb`/`bcBeta`, `KSP`/`kspSolve`) blijft onveranderd in de modules staan. `lk-field` kreeg `label-html` en `lk-big` een `html`-waarde, want `sci()` levert een exponent in een `<sup>` | — |
| S204 | — | *Verdunning*, *Osmolariteit & ionsterkte* naar Vue | ✅ `src/tools/Verdunning.vue` en `src/tools/Osmo.vue`. `pipAdvies()` is gesplitst in `pipAdviesDeel()` zodat een Vue-tool het advies met `tHtml()` kan vertalen. *Osmolariteit* wachtte op S204a en is daarmee de eerste tool op `lk-etable` | — |
| S204a | — | Gedeelde Vue-tabel in plaats van `ET()` | ✅ `lk-etable` in `src/lib/ui.js`: dezelfde kolomopgave (`{h, t:'txt'\|'num'\|'sel'\|'col', w, o, d}`), en hij zet zelf `TBLDEF[id]` met `set`/`push`/`get`/`blank`. De plak-handler in `web/index.html` klikt nu de toevoegknop en leest de DOM meteen daarna uit; Vue rendert pas op de volgende tick, dus voor een Vue-tabel moet die handler de rijen via de haken zetten. *Osmolariteit & ionsterkte* is de eerste gebruiker. De 19 andere `ET()`-tabellen kunnen nu een voor een om | — |
| S205 | — | *Titratiecurve*, *pH-buffer* naar Vue | ✅ `src/tools/Titr.vue` en `src/tools/Hh.vue`; `titrPH` blijft in `tools/nt/51_titr.js`. De vertaal-observer in `web/index.html` sloeg alleen een `data-notr`-element zelf over, niet wat erin zit, en zette in het Engels `2.175 g` terug naar `2,175 g`; hij slaat nu alles binnen `[data-notr]` over (geldt voor elke Vue-tool) | Sonnet |
| S206 | — | *Waterhardheid (EDTA-titratie)*, *Molmassa* naar Vue | ✅ `src/tools/Edta.vue` en `src/tools/Molm.vue`; `ATOM` en `parseFormula` blijven in `web/index.html`. Het rekenwerk van *Waterhardheid* stond los in `calc.edta` en staat nu ongewijzigd in de component. **Let op voor latere stappen:** `tools/nt/99_app.js` hangt de *Stuur door naar*-balk achter `calc[tool]` voor elke tool in `SEND`; een Vue-tool vervangt `calc[tool]`, dus die balk rendert de component nu zelf (`data-send="molm:0"`) | Sonnet |
| S207 | — | *Kjeldahl (eiwit uit stikstof)*, *Eenheden omrekenen* naar Vue | ✅ `src/tools/Kjel.vue` en `src/tools/Units.vue`; het rekenwerk stond bij beide los in `calc.<id>` en staat nu ongewijzigd in de component. Het `list="un-chem"` op het molmassaveld wees naar een datalist die nergens bestond en is weggelaten | Sonnet |
| S208 | — | *Enzymkinetiek* naar Vue | ✅ `src/tools/Enzym.vue` met `lk-etable` voor `#k-tbl`; `mmFit()` blijft in `web/index.html`. Drie fouten in de gedeelde laag die elke Vue-tool raakten: `toolApply()` (delen, ongedaan maken) zette een `lk-etable` leeg en stuurde een veld alleen `change`, waar `v-model` niet op reageert (nu `set()` en ook `input`); en de invoeropslag zette bewaarde waarden terug vóór de bundel de velden maakte, dus `mountTool()` doet dat nu na het mounten. Het validatiegeval *Puromycin* vult de tabel via `__tbl()` in plaats van `innerHTML` | Sonnet |
| S209 | — | *Standaardcurve* naar Vue | ✅ `src/tools/Curve.vue`; `fitCurve()`, `coef()`, `parsePlate()` en `colList()` blijven in `web/index.html`, de plaatlezer-import is een methode van de component. `lk-etable` kreeg een berekende kolom (`{h, t:'out', k, num}`, inhoud via de slot `#out`), die niet meetelt in `inputCols`. De *Stuur monsters door naar*-balk rendert de component zelf. Kleine afwijking: bij een mislukte fit tonen de terugberekende cellen nu `–` in plaats van een oude waarde | Sonnet |
| S210 | — | *ELISA-plaatanalyse* naar Vue | ✅ `src/tools/Elisa.vue`; het rekenwerk staat ongewijzigd in één computed, `elGrid`/`elBlocks` blijven in `tools/nt/94_elisa.js`. De plaatontwerper blijft gewone DOM op `#el-pld`, met dezelfde tweerichtingskoppeling naar het tekstvak | Sonnet |
| S211 | — | *Interne standaard & standaardadditie* naar Vue | ✅ `src/tools/Istd.vue`; de drie tabellen zijn `lk-etable` en blijven alle drie in de DOM (`v-show`), `isdFit()` blijft in `tools/nt/76_istd.js` | Sonnet |
| S212 | — | *Eiwitzuiveringstabel* naar Vue | ✅ `src/tools/Purif.vue`; de tabel is `lk-etable`, `ASAT` en het rekenwerk staan ongewijzigd in de component (niemand anders gebruikte ze) | Sonnet |
| S213 | — | *Chromatografie (HPLC/GC)* naar Vue | ✅ `src/tools/Chrom.vue`; de tabel is `lk-etable` en het rekenwerk staat ongewijzigd in één computed. Beginwaarden met drie decimalen (0,075) gaan met een komma door `lkNumIn`, anders leest het Engels ze als duizendtallen | Sonnet |
| S214 | — | *Spectrofotometrie*, *Dosis-respons (IC50/EC50)* naar Vue | ✅ `src/tools/Spec.vue` en `src/tools/Ic50.vue`. *Spectrofotometrie* stond nog in `web/index.html`: `calc.spec` en de listener op `#sp-seq` zijn daar weg (een watcher in de component), `AAM` blijft globaal. Het rekenwerk staat ongewijzigd in één computed per tool | Sonnet |
| S215 | — | *Verdunningsreeks & KVE* naar Vue | ✅ `src/tools/Reeks.vue`; het rekenwerk is dat van de oude `calc.reeks()`. De tellingen blijven in de globale `reeksCounts` (bewaard door `tblSnap()`, gezet door `tests/validate.py`) en `buildReeks()` laadt ze in de component. Getallen in de uitkomst gaan door `lkNumIn()`. Open: de knop *Kopieer naar Excel* die de UX-laag bij elke tabel zet blijft in een Vue-boom Nederlands (geldt ook voor eerdere tools) | Sonnet |
| S216 | — | *Flowcytometrie (panel & controles)* naar Vue | ✅ `src/tools/Facs.vue`; de antilichamentabel staat op `lk-etable` (`fc-tbl`), het rekenwerk is dat van de oude `calc.facs()` en `tools/nt/95_facs.js` is leeg op een opmerking na | Sonnet |
| S217 | — | *Antibiotica-gevoeligheid* naar Vue | ✅ `src/tools/Mic.vue`; `mi-tbl` en `mz-tbl` staan op `lk-etable`, hun vaste `TBLDEF`/`ADDBTN`-ingangen zijn weg. `micOf()` en de S/I/R-regels gaan ongewijzigd mee. Open (gedeeld, ook *Osmolariteit* en *Verdunningsreeks*): de UX-laag verbergt `data-expert`-velden voordat de Vue-bundel draait, dus in een Vue-tool staan die velden altijd open | Sonnet |
| S218 | — | *Groeicurve* naar Vue | ✅ `src/tools/Groei.vue`; `gc-tbl` op `lk-etable` (nieuwe optie `numbered` voor de kolom #), de grafiek blijft `chart()` en `calc.groei()` tekent opnieuw. De twee validatiegevallen vullen de tabel nu met `__tbl()` in plaats van `gcRow()`; verwachte waarden ongewijzigd. `lk-etable` zet in het Engels voortaan een punt in een getal dat van buiten komt (een teruggezette tabel las 0,077 als 77) | Sonnet |
| S219 | — | *Transfectie (Lipofectamine 3000)* naar Vue | ✅ `src/tools/Transfect.vue`; het rekenwerk, `TRF_SEED`/`TRF_MED` en de stappen gaan ongewijzigd mee, `tools/nt/81_transfect.js` is leeg op een opmerking na. Geen nieuwe vertaalsleutels nodig | Sonnet |
| S220 | — | *Telkamer*, *Celpassageplanner* naar Vue | ✅ Zelfde uitkomsten; validatie blijft staan | Sonnet |
| S221 | — | *Desinfectietest (log-reductie)*, *Sterilisatie (D, z, F₀)* naar Vue | ✅ Zelfde uitkomsten; validatie blijft staan | Sonnet |
| S222 | — | *Groeicurves vergelijken*, *Viabiliteit (trypaanblauw)* naar Vue | ✅ Zelfde uitkomsten; validatie blijft staan | Sonnet |
| S223 | — | *Cellen uitzaaien*, *MPN (meest waarschijnlijk aantal)* naar Vue | ✅ Zelfde uitkomsten; validatie blijft staan | Sonnet |
| S224 | — | *Microscoop-kalibratie*, *Inoculum (OD verdunnen)*, *Teller* naar Vue | ✅ Zelfde uitkomsten; validatie blijft staan | Sonnet |
| S225 | — | *Gelfoto-editor* naar Vue, deel 1: de velden en de uitkomsten; het beeldwerk op het canvas blijft | ✅ `src/tools/gelfoto/`: `GfImage.vue` (foto kiezen en bijstellen), `GfLadder.vue` (ladder, eenheid, meten), `GfDens.vue` (achtergrond, front, massa per band), `GfMarks.vue` (de gemeten banden, met de kolommen rel. int., R<sub>f</sub> en ng die eerst met `insertCell()` werden aangeplakt) en `GfFormat.vue` (opmaak en export). Het beeldwerk (`gfProc`, `gfRender`, de detectie, het slepen) blijft in `web/index.html`; `window.__gfRefresh` tikt de componenten op, want `gf` is geen reactief object. De lanentabel, de bandentabel en "ladder uit een foto" zijn nog gewone HTML (S226). Twee dingen die de hele Vue-overstap raken: de MutationObserver van de vertaallaag slaat nu alles binnen een `data-notr` over (een wijziging binnen een Vue-boom komt daar aan als de host zelf niet de target is, en 0.179 werd dan weer 0,179), en `gfSetIn()` zet een veld van buiten Vue met een input-event erachter | — |
| S226 | — | *Gelfoto-editor* naar Vue, deel 2: de laanbewerking en de ladderlabels | ✅ `GfLanes.vue` (aantal, lanebreedte en de lanentabel met naam, ladderlane en weghalen), `GfBands.vue` (de ladderlane kiezen, de banden met hun grootte en hun label, samenvoegen/splitsen en de symbolen) en `GfVirtual.vue` ("ladder uit een foto": herkennen, het voorbeeld, de groottes en de virtuele ladder naast de gel). De detectie en het slepen blijven in `web/index.html`; de losse listeners zijn motorfuncties geworden (`gfLaneLad`, `gfLaneDel`, `gfBandBp`, `gfBandMerge`, `gfBandSplit`, `gfBandDel`, `gfVlFile`, `gfVlSizes`, `gfVlUse`). Twee dingen om te weten bij een tool waarvan de toestand buiten Vue blijft: elke computed moet zelf de tik lezen (een computed die hetzelfde object teruggeeft waarschuwt zijn afhankelijkheden niet, dus een lijst gaat als kopie) en een veld achter een `v-if` bestaat nog niet als de motor het wil zetten, vandaar `window.__gfLadVm.setLadder()`. Staat ook in `CLAUDE.md` | — |
| S227 | — | *PCR-cyclus* naar Vue | ✅ `src/tools/Pcrcyclus.vue`, host `#y-app`; alle `y-*`-id's blijven. `primerInfo()` kreeg een tweede parameter met de zoutinstellingen (leest anders de DOM), `yTa` werd `window.__pcrVm.taAuto` voor de knop in het PCR-programma, en de i18n-observer slaat mutaties binnen `data-notr` over (anders werd het Engelse `1.833` weer `1,833`). Niet gehaald: het *Meer instellingen*-knopje (de expert-velden blijven zichtbaar, net als bij *Osmolariteit*) en de vertaling van de door de UX-laag toegevoegde knoppen *Kopieer naar Excel* en de grafiekknoppen | Sonnet |
| S228 | — | *DNA-kwantificatie* naar Vue | ✅ `src/tools/Dna.vue`, host `#dna-app`; alle `n-*`-, `m-*`-, `p-*`- en `fq-*`-id's blijven. De forensische qPCR-kwantificatie (`fqCalc` + de wrapper om `calc.dna`) zat in dezelfde sectie en is het vierde paneel van de component geworden; `calc.dna` is een lege functie. De knoppen *Stuur door naar* (`SEND.dna`, `#n-out .big`, `#m-ng`) staan nu in de component en gebruiken de bestaande klik-afhandeling. Uitkomsten in NL en EN regel voor regel gelijk aan de oude tool. Niet gehaald: het *Meer instellingen*-knopje (de expert-velden A₃₂₀ en weglengte blijven zichtbaar) | Sonnet |
| S229 | — | *Agarosegel & bandgrootte* naar Vue | ✅ `src/tools/Gel.vue`, host `#g-app`; alle `g-*`- en `b-*`-id's blijven (de ladderinvoeren houden `data-bp`, geen id). `GELR`, `LADDERS` en `LEX` blijven globals in `web/index.html` voor Gelplanner en Gelfoto-editor; `calc.gel` tekent de curve opnieuw. De ladderbanden zijn gewone invoervelden (geen ET), dus geen TBLDEF-haak nodig. Niet gehaald (geaccepteerd): *Meer instellingen* verbergt de `data-expert`-velden niet in de Vue-boom. | Sonnet |
| S230 | — | *qPCR-plaatindeling* naar Vue | ✅ `src/tools/Qplate.vue` (host `#qp-app`): velden, tekening, mastermixen en exportknop; alle `qp2-*`-id's blijven. De plaatontwerper `#qp2-pld` blijft een DOM-widget buiten de Vue-boom (zo blijven zijn knoppen vertaald) en meldt wijzigingen via `window.__qpVm.onPlate()`; `qpRows`/`qpExport`/`QPEXP` blijven in `tools/nt/46_qplate.js`. Bekend: "Monsters…"-knop en picbar-knoppen komen uit de UX-laag. Validatie onveranderd (286/286) | Sonnet |
| S231 | — | *Transformatie & blauw-wit* naar Vue | ✅ `src/tools/Transf.vue` (host `#tf-app`): velden, plaattellingen en uitkomsten; de id's `tf-lv`, `tf-vng`, `tf-used`, `tf-tot`, `tf-range`, `tf-tbl`, `tf-add` en `tf-out` blijven. De plaattellingen zijn een `lk-etable` (haken op `TBLDEF`/`ADDBTN` komen uit de component, de oude `tfRow`/`TFDATA` en de `'tf-tbl'`-ingangen in `web/index.html` zijn weg); `tests/validate.py` zet de rijen nu met `__tbl('tf-tbl',…,'transf')`. `calc.transf` is een lege functie. Eén nieuwe sleutel in `i18n/en.json`. Niet gehaald: de verwijderknop in de tabel blijft Nederlands. | Sonnet |
| S232 | — | *qPCR-analyse (ΔΔCt)* naar Vue | ✅ `src/tools/Qpcr.vue` (host `#qpc-app`, want `#qp-app` is van de plaatindeling): velden, Ct-tabel, Ct-export inlezen (`qpImport` is nu `doImport()`) en uitkomst; alle `qp-*`-id's blijven. De Ct-tabel is een `lk-etable` (haken op `TBLDEF`/`ADDBTN` komen uit de component, `QPDATA`/`qpRow`/`calc.qpcr` en de `'qp-tbl'`-ingangen in `web/index.html` zijn weg); `barChart()` blijft een global (ook de Western-blot gebruikt hem) en wordt vanuit `draw()` aangeroepen, ook via `calc.qpcr`. `window.__qpcrVm` is de instantie; `tests/validate.py` zet de rijen met `__tbl('qp-tbl',…,'qpcr')` (waarden ongewijzigd). Vijf nieuwe sleutels in `i18n/en.json` (meldingen die eerder onvertaald waren). Niet gehaald: het *Meer instellingen*-knopje (de expert-velden blijven zichtbaar) en de vertaling van de door de UX-laag toegevoegde knoppen | Sonnet |
| S233 | — | *PCR-mastermix* naar Vue | ✅ `src/tools/Pcr.vue` op host `#q-app`; de rekenregels van `calc.pcr()` zijn ongewijzigd overgenomen. De tabel is een eigen `<table>` en geen `lk-etable`, want elke rij heeft berekende kolommen (per reactie, mix) en een voet met water/totaal/template; `TBLDEF['q-tbl']` in `index.html` heeft `set`/`push`/`get`/`blank`/`inputCols` die naar `window.__pcrVm` wijzen. `QPRE`, `qRow`, `loadQ`, kopiëren en CSV zijn naar de component verhuisd; `qRack()` (buizenrek op `#qr-cv`) blijft in `index.html` en wordt door `draw()` aangeroepen. `toolApply()` (`tools/nt/99_app.js`) gebruikt nu `def.set` als die er is, zodat delen en ongedaan maken ook een Vue-tabel terugzetten | Sonnet |
| S234 | — | *cDNA-synthese (RT-mix)*, *Gradiënt-PCR* naar Vue | ✅ `src/tools/Cdna.vue` (host `#cd-app`) en `src/tools/Gradient.vue` (host `#gr-app`); `tools/nt/45_cdna.js` en `93_gradient.js` zijn leeg op een commentaar na, want alle rekenwerk zat in de oude `calc.*` en staat nu in de `computed` van de component. De monstertabel van cDNA is een `lk-etable` (`cd-tbl`, knop `cd-tbl-add`, dus `addRow()` uit de monsterlijst werkt nog), de mix- en monstertabel in `#cd-out` zijn `lk-table`. De tabellen van Gradiënt-PCR zijn `lk-table` en de curve wordt na elke render met `chart()` getekend (`calc.gradient` in `main.js` roept `draw()` aan). Beginwaarden komen uit `storeGet()`; alle id's en de validatiegevallen zijn ongewijzigd. `mountTool(sel, opts, {pip: tool})` laat de pipetteergrens (`pipScan`) na elke render opnieuw zoeken; die hing aan `calc[tool]`, dat de bundel later overschrijft (ook bij PCR-mastermix uit S233), en accepteert nu ook `0.55 µL` in het Engels | Sonnet |
| S235 | — | *RNA-kwaliteit*, *qPCR-smeltcurve* naar Vue | ✅ `src/tools/Rnaq.vue` (host `#rq-app`) en `src/tools/Melt.vue` (host `#ml-app`); het rekenwerk van `calc.rnaq()` en `calc.melt()` is ongewijzigd naar de `computed` verhuisd, `meltPeaks()`, `parseCols()` en `smooth()` blijven globale functies in `index.html`. RNA-kwaliteit gebruikt `lk-field`, `lk-big`, `lk-kv` (met chips in de waarde), `lk-note` en `lk-formula`; de smelttabel `#ml-res` is een eigen `<table>` (id behouden voor het validatiegeval) en de −dF/dT-curve op `#ml-cv` wordt na elke render met `chart()` getekend (`calc.melt` in `main.js` roept `draw()` aan). De voorbeelddata van de smeltcurve worden nu door de component gemaakt (de IIFE in `index.html` is weg). Beginwaarden uit `storeGet()`; alle id's en beide validatiegevallen ongewijzigd. | Sonnet |
| S236 | — | *SDS-PAGE monsters*, *Ligatie* naar Vue | ✅ `src/tools/Sds.vue` (host `#ss-app`) en `src/tools/Ligatie.vue` (host `#l-app`), beide met `{pip: …}` zodat de pipetteergrens (`pipScan`) blijft werken; het rekenwerk is ongewijzigd naar de `computed` verhuisd. De monstertabel van SDS is een `lk-etable` (`ss-tbl`, knop `ss-add`), de uitkomst een `lk-table` (wrapper-id `ss-res`); `ssRow`/`SSDATA` en het `TBLDEF`-item zijn weg en "Stuur monsters door" (`tools/nt/99_app.js`) gebruikt `TBLDEF['ss-tbl'].set()`. Het SDS-validatiegeval zet zijn rij nu met `__tbl()` in plaats van `tbody.innerHTML`; de uitkomsten zijn gelijk. | Sonnet |
| S237 | — | *Western blot-normalisatie*, *Primers oplossen* naar Vue | ✅ `src/tools/Wb.vue` (host `#wb-app`) en `src/tools/Oligo.vue` (host `#ol-app`, met `{pip: 'oligo'}` voor de pipetteergrens); het rekenwerk van `calc.wb()` en `calc.oligo()` is ongewijzigd naar de `computed` verhuisd. Beide tabellen zijn een eigen `<table>` (Controle-keuzelijst met waarden 0/1, respectievelijk een berekende buffer-kolom) met `set`/`push`/`get`/`blank`/`inputCols` op `TBLDEF['wb-tbl']` en `['ol-tbl']` (via `window.__wbVm`/`__olVm`); de staafgrafiek op `#wb-cv` blijft `barChart()` en wordt na elke render getekend (`calc.wb` in `main.js` roept `draw()` aan). "Stuur monsters door → Western blot" (`tools/nt/99_app.js`) gebruikt `TBLDEF['wb-tbl'].set()`; het oligo-validatiegeval zet zijn rij met `__tbl()`; de uitkomsten zijn gelijk. | Sonnet |
| S238 | — | *Bloedalcohol (Widmark)* naar Vue | ✅ `src/tools/Widmark.vue`; de drankentabel is een `lk-etable`, de curve tekent na elke render met `chart()`. `wdT()`/`wdHM()` blijven in `tools/nt/70_widmark.js` | Sonnet |
| S239 | — | *Mengprofiel & LR* naar Vue | ✅ `src/tools/Mix.vue`; de locustabel is een `lk-etable`. `mxTok()` en `mxLR()` blijven in `tools/nt/96_mix.js` | Sonnet |
| S240 | — | *Entomologie (graaddagen)* naar Vue | ✅ `src/tools/Ento.vue`; de curve tekent na elke render met `chart()`. `enDay()` blijft in `tools/nt/72_ento.js` | Sonnet |
| S241 | — | *Lichaamslengte uit botten* naar Vue | ✅ `src/tools/Stature.vue`; het intervaldiagram tekent na elke render met `pShow()`. `SLF`, `SLN` en `SLR` blijven in `tools/nt/71_stature.js` | Sonnet |
| S242 | — | *Glasvergelijking (brekingsindex)* naar Vue | ✅ `src/tools/Glass.vue`; de tekening gaat na elke render met `pShow()`. `glF()` blijft in `tools/nt/73_glass.js` | Sonnet |
| S243 | — | *STR-profielcontrole* naar Vue | ✅ `src/tools/Strchk.vue` op `lk-etable`; de beoordeling per locus komt ongewijzigd uit `calc.strchk`. De knop *Kopieer naar Excel* die `99z_ux` bij elke tabel zet blijft in een Vue-boom Nederlands (geldt voor alle Vue-tools; hoort bij de app-shell) | Sonnet |
| S244 | — | *Bloedvlekpatronen* naar Vue | ✅ `src/tools/Bpa.vue` op `lk-etable`; rekenwerk en tekening ongewijzigd uit `calc.bpa`. De knoppenbalk onder de tekening staat in de template (zonder `data-picbar`, dat zou bij het opstarten met Nederlandse `innerHTML` gevuld worden) | Sonnet |
| S245 | — | *Tijd sinds overlijden* naar Vue | ✅ `src/tools/Pmi.vue`; Henssge en de curve ongewijzigd uit `calc.pmi`. Daarbij in `web/index.html` een fout in de DOM-vertaallaag hersteld: de MutationObserver keek alleen of het gewijzigde element zelf `data-notr` had, niet een voorouder, en zette na een herrender in het Engels `0.365` terug naar `0,365` (gold voor alle Vue-tools) | Sonnet |
| S246 | — | *Verwantschapsindex*, *Hardy-Weinberg & forensische kengetallen* naar Vue | ✅ `src/tools/Kin.vue` (op `lk-etable`, rekenwerk uit `calc.kin`) en `src/tools/Hwe.vue`; `hwStats()`, `hwExact()` en `hwRng()` blijven onveranderd in `tools/nt/74_hwe.js` | Sonnet |
| S247 | — | *Forensische matchkans*, *Y-STR / mtDNA-frequentie* naar Vue | ✅ `src/tools/Rmp.vue` en `src/tools/Ystr.vue`; `betaInvUp()` blijft in `tools/nt/23_ystr.js`. De matchkanstabel heeft een uitkomstkolom tussen de invoer, dus hij staat in de component zelf (geen `lk-etable`) en zet dezelfde `TBLDEF`-haken; `rmRow` en `RMDATA` zijn uit `web/index.html`. Het validatiegeval vult de tabel nu via `__tbl()` in plaats van met `rmRow`; referentiewaarde ongewijzigd | Sonnet |
| S248 | — | *Statistiek* naar Vue, deel 1: de toetsen t, ANOVA en Kruskal-Wallis | ✅ `src/tools/Stat.vue`: de elf panelen met velden (met `v-show`, niet `v-if`, want validate.py en de invoeropslag zetten ook velden van een toets die niet gekozen is), de tabel per groep en de uitkomst van *Beschrijvend*, de drie t-toetsen, Wilcoxon, ANOVA en Kruskal-Wallis. Het rekenwerk blijft in `web/index.html`; de vier andere toetsen leveren tot S249 nog HTML via `statOut2()`. Drie dingen in de i18n-laag erbij: de observer liep via een mutatie tóch een Vue-boom in en draaide een getal dat de component al had omgezet terug, `tHtml()` liet de markeringen van `uv()` staan en zette getallen zonder sleutel niet om, en de Excel- en verslagbalken vertalen zichzelf nu (ze worden in een Vue-boom ingevoegd). 352 uitkomsten in NL en EN vergeleken: gelijk, op zes vertalingen die er nu wel zijn | — |
| S249 | — | *Statistiek* naar Vue, deel 2: de rest: chi-kwadraat, regressie, power en de post-hoc | ✅ De tweeweg-ANOVA, de lineaire regressie, de power en de χ²-toets staan ook in `src/tools/Stat.vue`; `statOut2()` is uit `web/index.html` verdwenen. De tekeningen van de regressie en de power worden na elke render opnieuw gemaakt, zoals bij de ANOVA. `lk-table` kreeg `table-id`, want `tests/validate.py` zoekt `#st-tukey`, `#st-dunn` en `#st-a2` op id op (dat miste in S248). Alle 17 validatiegevallen van Statistiek kloppen; vier meldingen en de formuleregel van de tweeweg-ANOVA zijn nu ook vertaald | — |
| S250 | — | *Overlevingscurve (Kaplan-Meier)* naar Vue | ✅ `src/tools/Km.vue`. `kmFit()` blijft en de log-ranktoets staat nu in `kmLogrank()` in `tools/nt/86_km.js`; de curve wordt na elke render met `chart()` getekend, net als bij de Z'-factor | — |
| S251 | — | *ROC-curve & diagnostische test*, *Bland-Altman (methodevergelijking)* naar Vue | ✅ `src/tools/Roc.vue` en `src/tools/Bland.vue`. De berekening staat nu als `rocCalc()` in `tools/nt/85_roc.js` en als `blandPairs()` en `blandCalc()` in `tools/nt/84_bland.js`, ongewijzigd uit `calc.roc` en `calc.bland`; de grafieken worden na elke render met `chart()` getekend, net als bij Kaplan-Meier | — |
| S252 | — | *Westgard / Levey-Jennings* naar Vue | ✅ `src/tools/Westgard.vue`. De berekening staat nu als `westgardCalc()` in `tools/nt/31_westgard.js`, ongewijzigd uit `calc.westgard`; de kaart wordt na elke render met `chart()` getekend, net als bij Kaplan-Meier | — |
| S253 | — | *Methodevalidatie* naar Vue | ✅ `src/tools/Mval.vue`. De berekening staat nu als `mvalCalc()` in `tools/nt/33_mval.js`, ongewijzigd uit `calc.mval`; de kalibratielijn wordt na elke render met `chart()` getekend, net als bij Kaplan-Meier | — |
| S254 | — | *Meetonzekerheid*, *Pipetkalibratie* naar Vue | ✅ `src/tools/Munc.vue` en `src/tools/Pipcal.vue`. De berekening staat nu als `muncCalc()` in `tools/nt/32_munc.js` en als `pipcalCalc()` in `tools/nt/30_pipcal.js`, ongewijzigd uit `calc.munc` en `calc.pipcal`; de bronnentabel van Meetonzekerheid is een `<lk-etable>` en de balken worden na elke render met `pShow()` getekend | — |
| S255 | — | *Gelplanner* naar Vue, deel 1: de gel van bovenaf en de laantabel | ✅ `src/tools/Gelplan.vue`: de instellingen, de laantabel (op `lk-etable`, met de monsterlijst via de `set`-haak op `TBLDEF`) en de uitkomstenlijst onder de gel. Het tekenwerk blijft op het canvas: `calc.gplan()` is `gpDrawTop()` geworden en wordt na elke render aangeroepen. De verwachte gel, de receptkaart en de looptijd schrijven tot S256 nog zelf in hun host. `lkPicBar()` in de brug maakt de knoppenbalk onder een tekening, want `[data-picbar]` wordt één keer bij het opstarten gevuld. Twee dingen die elke Vue-tool raken: `mountTool()` legt de standaardwaarden van de velden vast (`defaultValue`, anders gold elk veld als veranderd) en `xpInit()` in `tools/nt/99z_ux.js` draait ook na een render, zodat de velden met `data-expert` weer verborgen worden en hun knop krijgen — daardoor komt een veld dat van zijn standaard afwijkt nu meteen tevoorschijn in plaats van pas bij het opstarten. 38 uitkomsten in NL en EN vergeleken: gelijk | — |
| S256 | — | *Gelplanner* naar Vue, deel 2: de verwachte gel, het slotvolume en de looptijd | ✅ De verwachte gel, de receptkaart voor het gieten en de looptijd staan ook in `src/tools/Gelplan.vue`; in `tools/nt/48_gplan.js` blijven de twee tekeningen (`gpDrawTop`, `gpDrawPredict`) en het rekenwerk eronder (`gpFronts`, `gpSizes`, `GPSTAIN`, `gpSpeed`, `gpMin`). De tekening van de verwachte gel staat nu op `v-show` in plaats van op een `style.display` van buiten. 38 uitkomsten in NL en EN vergeleken: gelijk | — |
| S257 | — | *Pipetteerschema* naar Vue | ✅ `src/tools/Pipetteer.vue`; eigen tabel (een kolom per buis past niet in `lk-etable`) met eigen plak-handler. `PPRE`, `ppMigrate` en het buizenrek (`ppRack`, gewone HTML) blijven in `web/index.html`; `#pp-cv._data` blijft gezet | Sonnet |
| S258 | — | *PCR-programma* naar Vue | ✅ `src/tools/PcrProgramma.vue`; `PGDEF`, `pgSecs`, `pgFmt` en (voor *PCR-cyclus*) `mmss2`/`yTa` blijven in `web/index.html`; de stappen blijven in `pstore` | Sonnet |
| S259 | — | *Verdunningsschema* naar Vue | ✅ `src/tools/Verdunningsschema.vue`; de tekenhulpjes (`pTube`, `pArrow`, `pNum`, …) blijven in `web/index.html` | Sonnet |
| S260 | — | *Kleuringsschema* naar Vue | ✅ `src/tools/Kleuringsschema.vue`, de tabel op `lk-etable`; alleen de sjablonen (`STN`) blijven in `tools/nt/44_stain.js`. Geen validatiegeval (het is een tekening) | Sonnet |
| S261 | — | *Experimentplanner*, *Rapport / labjournaal* naar Vue | ✅ `src/tools/Planner.vue` (tabel op `lk-etable`) en `src/tools/Rapport.vue`. `rpTools`, `rpSection`, `rpDoc` en `rpPrint` blijven globaal in `tools/nt/62_report.js`, want de afdrukknoppen van andere tools gebruiken ze; het rapportdocument zelf blijft een string | Sonnet |
| S262 | — | *Plaatindeling*, *Centrifuge*, *Timers* naar Vue | ✅ `src/tools/Centrifuge.vue`, `Timers.vue`, `Plaatindeling.vue`. De timer-motor (`timers`, `addTimer`, tik, piep, opslag) blijft globaal in `web/index.html`, want hij loopt door in andere tools; de plaatontwerper in `#w-pld` en `plateImg()` blijven de gedeelde motor (`plaatInit()` in `tools/nt/04_plaat.js`). Het open punt dat hier stond (de MutationObserver vertaalde getallen in een Vue-boom opnieuw) is opgelost in S225 en vervallen met S271: er is geen observer meer | Sonnet |
| S263 | — | Startpagina en Instellingen naar Vue (de app-schil, geen rekentool) | ✅ `src/tools/Start.vue` en `src/tools/Settings.vue`. De startpagina was `bentoRender()` plus twee lagen erop (fasefilter in `99y_stage.js`, werkstroomtegel in `99z_ux.js`); die drie staan nu in één component, met dezelfde opbouw (`#bento-rest > .tile`, `#bento-q`) voor het kruimelpad en de rondleiding. Instellingen houdt alle id's; `applyUI()` en `checkUpdate()` blijven in `web/index.html`. Gecontroleerd in NL en EN: zoeken, tags, fasen, favorieten, werkstromen, thema, terugzetten en opslag | Opus 5 |

## Phase 16: one source, one translation path (9 steps)

Ideas #276, #277 (taken over from S143–S146). Every tool is on Vue, but the old build is still
underneath it: `web/index.html` is source *and* output, `tools/nt/` modules are pasted in between
markers, and static text is still translated by the DOM walker while Vue components use `t()`.
Several open points from phase 15 only exist because of that mix (the *Kopieer naar Excel* button
and chart buttons that stay Dutch in a Vue tree, the `data-notr` workarounds for numbers flipping
back to `0,179`). This phase ends with **one place for code (`src/`), one generated
`web/index.html`, and one way to translate (`t()` / `tHtml()`)**.

What does not change: the calculation functions move file by file **unchanged** (they carry the
validation cases), the element ids stay, the app keeps working from `file://` as one IIFE bundle,
and `i18n/en.json` keeps its keys. Each step ends with `python tools/check.py --quick` green; the
end of each batch with the full check (286/286).

| Step | Ideas | What | Done when | Model |
|---|---|---|---|---|
| S264 | 276 | Inventory and target layout: list everything that still lives in `web/index.html` outside the NT markers (39 sections, ~173 KB JS, ~34 KB CSS) and in `tools/nt/`, with for each piece where it goes in `src/`, which globals other code still reads (`gf`, `timers`, `TBLDEF`, `calc`, `chart()`, …) and which text the DOM walker still translates. Write the target layout under *Decisions* | ✅ The list and the target layout are under *Decisions* (*Phase 16 target layout*); S265–S272 still fit, except that the nav stays in the shell template until S269 | Opus 5.5 |
| S265 | 276 | `web/index.html` becomes a build output: a shell template in `src/` plus the CSS and the bundle, written by one build script (`npm run build`); `insert_tools.py` is called from it for now. CI fails when the committed `index.html` is out of date | ✅ Source is `src/shell/index.html`; `npm run build` = Vite + `python tools/build.py` (build_validated → build_i18n → insert_tools, which now reads the template, expands `@include` lines and fills in the i18n hash). The generated file is byte-for-byte the old one. CI runs `vite build` + `git diff --exit-code build/app.bundle.js` and `python tools/build.py --check`. `bump_version.py` sets `APPVER` in the template too. Full check runs at the end of K1 | Opus 5.5 |
| S266 | 276 | Move the 39 hand-written `<section>`s and the inline CSS out of `index.html` into source files in `src/` | ✅ CSS in `src/shell/styles/app.css`, the 39 sections in `src/shell/sections/<id>.html`, pulled in by `@include` lines in the same order; the generated `web/index.html` is unchanged byte for byte. Done by the lead instead of a Sonnet subagent: a 20-line split script was cheaper than a brief | Sonnet |
| S267 | 277 | Shared helpers out of the inline JS into `src/lib/` modules (`$`, `num`, `esc`, `note`, `chart()`, `barChart()`, storage, `toolSnap`/`toolApply`, …), still exposed on `window` where other code reads them | ✅ The stateless helpers are in `src/lib/` (`helpers.js`, `fit.js`, `chart.js` with `barChart`, `parse.js`, `storage.js`), put on `window` by `expose()`. The bundle now sits **before** the inline scripts and mounts in `LabkitVue.start()` where it used to be, so the load order of `calc[tool]` is unchanged. Left inline, because they hold state that old code assigns to: routing (`TOOLS`, `current`), audio, the export/paste/copy handlers, `tblSnap`/`storeGet`, statistics and protocol drawing; they move with S268/S269. `toolSnap`/`toolApply` are in `tools/nt/99_app.js` (S269) | Opus 5 |
| S268 | 277 | The engines into `src/`: the gel-editor engine (`gf`, `gfProc`, detection, dragging), the timer engine and the plate designer, each as one module with the same `window` hooks the components use now | ✅ `src/engines/gelfoto.js` (the main engine plus the four gelfoto add-on blocks, which override `gfIntensity`), `src/engines/timers.js` (audio, timer loop, notifications, saving) and `src/engines/plate.js` (`tools/nt/02_plate.js` + `04_plaat.js`, now deleted), moved verbatim. They put their names on `window` with `live()` (getter/setter), because `timers`, `tid` and `gfIntensity` are reassigned. A static check with `@babel/parser` found no implicit globals (module code is strict). 286/286; timers, plate and the demo gel checked in the browser. `LADDERS` stays inline with the rest of the gel tool data (S269) | Opus 5.5 |
| S269 | 277 | The 57 JS modules of `tools/nt/` into `src/` (calculation libraries as plain modules the components import; the generated files from `build_validated.py`, `build_icons.py` and `build_changelog.py` written into `src/generated/`). Retire the NT markers and `tools/insert_tools.py` | ✅ `tools/nt/` and `tools/insert_tools.py` are gone; `tools/build_html.py` only expands `@include`, inserts the bundle and the i18n hash. **All JavaScript except the language pick and the DOM translation layer is now in the bundle**, imported by `src/main.js` in the old load order: `src/legacy/core.js` and `app.js` (the two remaining inline scripts, verbatim), `src/legacy/nt/*.js` (the 51 former JS modules, verbatim; the 3 generated ones are in `src/generated/`), `src/legacy/init.js` (`start()` from `src/mount.js`, then the old start-up). Each legacy file puts its top-level names on `window` with `live()`; an AST check (`@babel/parser`) found no duplicate names, block functions, top-level `this` or implicit globals. Tool HTML in `src/shell/sections/`, nav, `TOOLS` and `TAGS` written out statically; generated files in `src/generated/` via `tools/genmod.py`. Not done: the calculation code is still global (`src/legacy/`), not imported by the components; that is a later clean-up, not needed for S270–S271. Done by the lead (Opus 5.5) instead of Sonnet: the load-order and strict-mode questions were not mechanical | Sonnet |
| S270 | — | All remaining static text through `t()` / `tHtml()`: tool headings, source lines, the nav and the buttons the UX layer adds (*Kopieer naar Excel*, chart and picture bars, *Meer instellingen*), keeping the existing keys | ✅ Measured first what the walker still translated (tool heads, sources, nav, crumbs, tags, the plate designer, gel-editor messages, the tour, modals). Non-Vue code that builds DOM now translates it itself: `tStatic(root)` (one explicit pass over a fresh fragment, same keys as `tHtml()`; skips `data-notr`) in the plate designer, `appModal()` and the tour, `trPlain()` in `gfStatus()` (now one key per sentence; 20 missing gel-editor keys added) and the plate dialogs. `tests/i18n_collect.py` has a new check: in English, any text on the page that is still a Dutch key fails it. That check found 13 older gaps inside Vue tools (Dutch example names such as *Controle*/*Behandeld*/*Monster 1*, a formula, the delete button of `lk-etable`, the `{#} u {#} min` duration), fixed with `trPlain()`/`tHtml()`. With the observer switched off (`LK_NOMO=1`) the check finds 0. Static shell HTML (heads, sources, nav) is still translated once at start-up; S271 makes that an explicit `tStatic()` call too | Opus 5 |
| S271 | — | Remove the DOM translation layer (`i18nWalk`, its MutationObserver, lazy translation of hidden tools, `ud()` / `{*}` where no longer needed) and the `data-notr` workarounds; `tests/i18n_vue.py` becomes the one static check | ✅ The translation script is now `src/lib/i18n.js`, the first module of the bundle (only the language pick with `document.write` of `i18n-en.js` stays inline). Gone: the MutationObserver, the lazy translation of hidden tools (`__i18nPend`, `i18nIdle`, `i18nEnsure`) and the `data-notr` guard of S225 that existed only for the observer. `i18nStart()` now does one explicit `tStatic(document.body)`; a language switch reloads the page, so that is all. Start-up time unchanged (EN 460 ms). `tests/perf_budget.py` now checks that every tool heading is English instead of waiting for the lazy pass; `tests/i18n_collect.py` (the leftover-Dutch check of S270) finds 0. Kept on purpose: `ud()`/`{*}` (still the key format for values in a sentence) and `data-notr` (still means: do not translate). The full check at the end of K3 covers the layout audit | Opus 5.5 |
| S272 | — | Rewrite the build and translation rules in `CLAUDE.md` and both READMEs for the new layout (no more "edit in place", NT markers or walker rules) and remove the stale notes from phase 15 rows that pointed at those | ✅ `CLAUDE.md` rewritten for the new layout (build, where code lives, one translation section, tests); both READMEs updated; a note above phase 15 maps the old paths, and the open point of S262 is closed. Done by the lead instead of Sonnet: it needed the context of K1–K3 | Sonnet |

## What to pick up next

Follow the batch order in *Cloud sessions* above. In short:
1. ~~**K1, K2, K3**~~ ✅ phase 16 is done (2026-11-21).
2. **Q1a, Q1b** (Sonnet) when there is room: size budget, error reports and tests are cheap safety nets.
3. Then wave by wave: **P** (phase 4), **E/G** (bench mode and gel editor), **C/R/W**, **F**.
4. The *any time* batches (**SQ1**, **AL1**, **SA1a**) after K3, when sequence or SNP work is the nearest practical need; SQ1 is one Sonnet session and immediately useful.

## Known bugs (not fixed yet)

Bugs found along the way that fall outside the batch that found them. Fix one in its own commit
(`fix: …`) and remove its row here; a bug in a tool that is not on Vue yet can also be fixed during
that tool's conversion.

| Found | Where | Bug | Notes |
|---|---|---|---|
| 2026-11-21, batch V1a | *PCR-mastermix* (`pcr`), English | `tests/layout_audit.py` with `LABKIT_LANG=en` reports two labels overflowing their field at 390 px wide: *Reaction volume* and *Template per reaction* (`overloop … 11>3`). The full `tools/check.py` fails on this. | Not caused by V1a: the commit before it (`5de083d`) shows the same two on the same machine. Seen on Windows; the earlier cloud run (Linux) had 0, so font metrics are the likely cause. Probably fixed by shorter English labels or letting those labels wrap. *PCR-mastermix* goes to Vue at S233. |
| 2026-11-21, batches K2–K3 | `tests/robust_audit.py`, `tests/i18n_collect.py` (Windows) | Now and then the next `page.goto` never reaches `DOMContentLoaded`. **Cause found:** the renderer dies with `Received fatal exception 0xe0000008` (Chromium's out-of-memory code on Windows) while loading the app; Playwright then waits until its time-out. It hits the K1 and K2 builds as well as K3 (the K2 build crashed the same way in a run alongside K3, after passing twice when more memory was free), so it is this machine's memory pressure, not the code. | Rerun when more memory is free (close other programs). To see it: `DEBUG=pw:browser` and look for `0xe0000008`. Each page load draws and analyses the demo gel (`gfDemo()`) on large canvases even when that tool is not open, which makes every navigation a memory peak; lazy start-up of tools (phase 10, batch F1a) would lower it. |
