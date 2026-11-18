# LabKit roadmap

The ideas chosen from [ideas.md](ideas.md) (the `#` numbers), planned as **steps of about 30 minutes each**. Each step ends with a working app and runs `python tools/check.py --quick` (the full `tools/check.py` at the end of every phase). Then you can say "do step S12" or "do the next 3 steps".

**Status:** ✅ done · ⏳ planned · ✖ dropped
**Total:** 146 steps to go (S1–S146) ≈ 73 hours; S0 is done. Every chosen idea number appears in at least one step. Steps within a phase are in a sensible order; steps marked *(needs Sx)* depend on an earlier step.

## Decisions
- **#13 shared layout** applies per *type* of tool. Picture-generating tools (schemes, diagrams, gel figures) share one layout; calculators keep their own.
- **Gel editor:** keep automatic ladder band detection, and keep editing the numbers/text next to each ladder band.
- **Removed:** chain of custody, reagent stock, freezer boxes, label sheets and the GHS label. Organisation is merged into Bench. The experiment planner stays (#240 was not chosen).
- **✖ Dropped:** #230 GHS label sizes (tool removed), #86 spill card (needed GHS data).

---

## Phase 0: clean-up (done)
| Step | Ideas | What | Status |
|---|---|---|---|
| S0 | 236–239, 242, 248 | Remove chain of custody, stock, freezer boxes, label sheets and GHS label; move planner and report into Bench; clean TOOLS, TAGS, synonyms, validation | ✅ |

## Phase 1: navigation and app shell (12 steps)
| Step | Ideas | What | Done when |
|---|---|---|---|
| S1 | 1 | Assign every tool to one or more stages (Prepare · Do · Analyse) in a `STAGES` map | ✅ `STAGES` in `tools/nt/99y_stage.js`; `tests/stages_check.py` (in `tools/check.py`) lists tools without one |
| S2 | 1 | Stage tabs above the sidebar; selecting a stage filters the nav and start page | ✅ Tabs in the sidebar head filter nav and start page; choice kept in `labkit:v1:stage` |
| S3 | 4, 17 | Stage accent colours and a breadcrumb (Stage › Group › Tool) in the tool header | ✅ `--stv/--stu/--sta` per theme (5 checked), breadcrumb chip + group link + nav accent |
| S4 | 8 | "Next tool" suggestions at the bottom of each tool (hand-picked map) | ✅ `NEXT` map in `99z_ux.js` on 85 tools, translated |
| S5 | 10 | Search and command palette show the description and tags of each hit | ✅ Description + tags on search hits and in the palette, checked in NL and EN |
| S6 | 11 | Pinned tools bar (up to 6 icons in the header), pin from the tool toolbar | ✅ Max 6 pins in `labkit:v1:pins`, pin button in the tool toolbar; the bar sits at the top of the work area (the sticky phone bar has no room at 375 px) and scrolls sideways |
| S7 | 16 | Icon set: a small consistent SVG icon per tool (part 1: 45 tools) | ✅ 45 tools; icons are a CSS mask on `::before` (an injected `<svg>` would break the translation keys of a nav link); sources in `tools/icons/`, built by `tools/build_icons.py` |
| S8 | 16 | Icons part 2 (remaining tools) + dark-theme check | ✅ All 87 nav entries have an icon (77 shapes); checked in the dark and contrast themes |
| S9 | 12 | Simple/expert toggle infrastructure (`data-expert` fields hidden in simple mode) + apply to 5 tools | ✅ `data-expert` + "Meer instellingen" per tool in `labkit:v1:expert`; applied to spec, dna, oligo, pcr, reeks. A field with a non-default value stays visible |
| S10 | 12 | Apply simple/expert to 15 more tools with many fields | ✅ 15 more tools (31 fields), 20 in total; one toggle per block of settings |
| S11 | 14 | Onboarding tour (4 steps: search, stages, workflows, settings) on first visit | ✅ Spotlight tour with 4 steps, keyboard-operable, replay button in Instellingen; a step without a visible target (phone) falls back to a centred card |
| S12 | 15, 286 | What's new panel after an update + changelog page generated from a `CHANGELOG.md` | ✅ `CHANGELOG.md` -> `tools/build_changelog.py` -> `tools/nt/97_news.js`; panel after a version change, full list from Instellingen. Nothing on a first visit |

## Phase 2: preparation, gels (8 steps)
| Step | Ideas | What | Done when |
|---|---|---|---|
| S13 | 21 | New *Gelplanner* tool: gel tray, comb and wells drawn top-down; sample name, colour and volume per well | PNG export of the loading diagram |
| S14 | 21, 24 | Ladder drawn next to the wells; SDS-PAGE mode with prestained ladder look | Agarose and SDS-PAGE diagrams |
| S15 | 22 | Predicted gel: bands from expected sizes, log migration per agarose % and ladder | Predicted gel image beside the plan |
| S16 | 23, 28 | Well capacity check (comb, thickness) and loading dye volume + dye fronts on the prediction | Warning over capacity; dye fronts drawn |
| S17 | 25, 26 | Agarose % advisor from the fragment range and a casting recipe card for the tray size | Recipe card printable |
| S18 | 27 | Run time estimate from voltage, length and fragment sizes | "Stop when" estimate shown |
| S19 | 228 | Gel loading scheme (`plaad`) opens in / is replaced by the Gelplanner; move its tests | Old links redirect; validation passes |
| S20 | 203 | SDS-PAGE samples tool sends samples to the Gelplanner (SDS mode) | One click from SDS samples to diagram |

## Phase 3: preparation, picture tools and plates (16 steps)
| Step | Ideas | What | Done when |
|---|---|---|---|
| S21 | 13 | Shared layout for picture tools: preview left/top, options panel, export bar (PNG/SVG/copy/print) | Component used by Gelplanner |
| S22 | 13 | Move dilution scheme, pipetting scheme and PCR programme onto the shared layout | 3 tools converted, tests pass |
| S23 | 13 | Move staining scheme and plate layout onto the shared layout | All picture tools consistent |
| S24 | 34, 225 | Dilution series drawing: tubes, arrows, volumes, colour fading | Drawing in the dilution scheme |
| S25 | 35, 227 | PCR programme as a temperature–time graph with bracketed cycles | Graph export |
| S26 | 36, 229 | Staining protocol as an illustrated timeline | Timeline export |
| S27 | 33, 192 | Tube rack picture for master mixes (PCR mix, pipetting scheme) | Rack drawn with labels and volumes |
| S28 | 29 | Shared plate designer, part 1: plate formats 6–384, select and colour wells, legend | Designer component standalone |
| S29 | 29 | Plate designer part 2: drag to fill replicates, auto-fill a dilution across a row | Drag-fill works with mouse and touch |
| S30 | 30, 37 | Plate templates (standards in duplicate + blanks + samples) and A4 plate map print | Template + print |
| S31 | 31, 32 | Pipetting order view and multichannel planning | Numbered fill order; row/column hints |
| S32 | 38, 39 | Randomised layout with a key, and edge-effect warning | Randomise button; warning shown |
| S33 | 234 | Plate layout tool becomes the plate designer | Old data migrates |
| S34 | 170 | ELISA tool uses the plate designer | Same results, validation passes |
| S35 | 199 | qPCR plate layout uses the plate designer + instrument export format | Exports CSV for import |
| S36 | 60 | Sample sheet: paste names once, reuse in plates, gels and master mixes | Names appear in 3 tools |

## Phase 4: preparation, recipes and sequences (11 steps)
| Step | Ideas | What | Done when |
|---|---|---|---|
| S37 | 40 | Recipe library data: 15 common buffers and media with sources | Data file + validation of 3 recipes |
| S38 | 40, 153 | Recipe library UI in *Oplossing & buffer*: scale to volume, tick-off per component, printable card | Card prints |
| S39 | 43, 45, 154 | Hydrate options, autoclave/filter advice, weighing order tips | Shown per recipe |
| S40 | 44, 53 | pH adjustment helper and cell culture media prep | Both calculators |
| S41 | 51, 52, 54 | Overage switch on all master mixes, antibody dilution planner, transformation prep card | 3 features |
| S42 | 46 | Primer card (Tm, GC%, length, self-dimer, hairpin) in *Primers oplossen* | Card export |
| S43 | 47 | Primer pair checker (Tm difference, cross-dimers) | Warnings shown |
| S44 | 48, 193, 194 | In-silico PCR on a pasted template; annealing temperature into PCR cycle and gradient PCR | Product size + binding sites |
| S45 | 49, 207 | In-silico digest with an enzyme list (~40 enzymes), double-digest buffer check, send fragments to the predicted gel | Fragments match NEBcutter for a test plasmid |
| S46 | 50 | Plasmid map (circular drawing, features, sites, primers) from sequence or GenBank | Map export |
| S47 | 56, 58, 59 | Material list, protocol export of preparation outputs, QR code on printed protocols | One printable protocol |

## Phase 5: execution (13 steps)
| Step | Ideas | What | Done when |
|---|---|---|---|
| S48 | 61 | Bench mode shell: full-screen step cards, swipe/tap, Wake Lock, high contrast | Works on phone |
| S49 | 62 | Step checklists generated from pipetting scheme, master mix and dilution scheme | Tick-off persists per run |
| S50 | 62, 61 | Checklists for recipe cards and the Gelplanner; open them in bench mode | 5 tools feed bench mode |
| S51 | 71, 72 | Master mix progress and plate filling assistant (tap wells as filled) | Progress shown *(needs S28)* |
| S52 | 73 | Gel loading assistant in the Gelplanner | *(needs S13)* |
| S53 | 74, 76 | Run notes (text + photo) and deviation log, sent to the report | Notes in report |
| S54 | 81, 82, 233 | Pipette advice and < 1 µL warning inline next to every pipetting volume | Shown in all mixing tools |
| S55 | 70, 232 | Saved rotors and a centrifuge balance diagram | Rotor profiles persist |
| S56 | 83, 85, 180 | Reminders linked to the workflow timeline; passage calendar | Notifications fire |
| S57 | 84, 175 | Live OD tracking with target-time prediction; log-phase detection in the growth curve | Prediction updates per reading |
| S58 | 88, 89 | Offline indicator and dark-room (red) mode | Toggle in header/settings |
| S59 | 68, 174 | Colony counting from a photo (detect, tap to correct), linked to dilution series & CFU | Count within 10% on test images |
| S60 | 69 | Cell counting from a microscope photo (live/dead by colour) | Count on test images |
| S61 | 87 | Multi-device sync of one run over WebRTC with a QR pairing code | Phone and laptop stay in sync |

## Phase 6: gel editor rebuild (18 steps)
Automatic ladder detection stays, and every ladder label (number or text) stays editable.

| Step | Ideas | What | Done when |
|---|---|---|---|
| S62 | 97 | Project files `.labkitgel` (photo, lanes, ladder, labels, settings) save/open | Reopened gel is identical |
| S63 | 98 | Gel library with thumbnails (IndexedDB) | Recent gels listed |
| S64 | 95 | Type lane labels on the image; Tab to next lane; paste a list | Labels editable in place |
| S65 | 110 | Saturation warning overlay | Clipped pixels highlighted |
| S66 | 117, 118 | Auto figure legend and result table per lane (Excel copy) | Legend + table |
| S67 | 119 | Ladder library editor: add/share custom ladders | Custom ladder used by detection |
| S68 | 96 | Figure style presets (journal, report, publication, poster) | One click restyles the export |
| S69 | 92 | Guided mode: 4 steps, auto-detect first, "Expert" shows all | New users finish a gel in 4 screens |
| S70 | 91 | Canvas-first layout part 1: big image, toolbar, context panel (desktop) | All existing functions reachable |
| S71 | 91 | Canvas-first layout part 2: bottom sheet on phones | Usable at 375 px |
| S72 | 93 | Direct manipulation part 1: drag lane borders, zoom around cursor | Drag + zoom |
| S73 | 93, 120 | Direct manipulation part 2: drag/add bands, double-click to measure, touch gestures | Mouse + touch |
| S74 | 94 | Undo/redo with visible history | Every edit undoable |
| S75 | 99, 100, 101 | Before/after slider, auto-enhance with list of edits, integrity notice in the export | Edits listed |
| S76 | 107, 108 | Smart crop and perspective correction | Angled phone photo straightened |
| S77 | 109, 104 | Curved-lane correction and lane intensity profiles | Profile under each lane |
| S78 | 111, 112, 113, 114 | Band size labels, annotations (arrows, boxes), channel choice, pseudo-colour LUTs | All in the Labels panel |
| S79 | 102, 103, 115, 116, 202, 204 | Compare with predicted gel, multiple gels per figure, SVG export, copy with caption; agarose tool and WB normalisation connect to the editor | WB intensities flow to normalisation |

## Phase 7: charts, figures and data (17 steps)
| Step | Ideas | What | Done when |
|---|---|---|---|
| S80 | 122, 130 | Shared chart style system (fonts, sizes, palettes) applied to the chart helper | All charts use it |
| S81 | 129, 125 | Error bar choice (SD/SEM/CI) and bar + dot plots | Labelled in legend |
| S82 | 123 | SVG export for every chart | SVG opens in Inkscape |
| S83 | 127 | Chart editor panel (titles, ranges, log axis, legend, colours) | Remembered per chart |
| S84 | 124 | Significance brackets from statistics output | Stars drawn on bar charts |
| S85 | 128 | Box, violin and scatter plots in Statistics | 3 new plot types |
| S86 | 126, 131 | Plate heatmaps and toggleable data tables under charts | Heatmap for plate tools |
| S87 | 132, 133 | Chart annotations and overlaying several runs | Text/arrows/lines |
| S88 | 134, 135 | Colour-blind preview and poster export | Preview toggle |
| S89 | 121 | Figure maker part 1: canvas, drop outputs from tools | Panels placed |
| S90 | 121 | Figure maker part 2: A–D lettering, alignment, PNG/PDF/SVG export | 600 dpi export |
| S91 | 136 | Plate-reader import wizard part 1: parser for 3 formats | Test files parse |
| S92 | 136 | Import wizard part 2: map wells → standard curve, ELISA, Z′ | Data lands in the tool |
| S93 | 137, 195 | qPCR instrument import (CFX, QuantStudio, LightCycler) | Ct tables import |
| S94 | 138, 139 | NanoDrop and flow summary import | Both import |
| S95 | 140, 147, 141 | Interpretation lines, reference ranges, replicate checker | Shown in 10 tools |
| S96 | 142, 143, 149, 150, 146, 145, 148, 144 | Results to report, method sentences, Excel with formulas, answer check, sig figs, output units, batch mode, uncertainty propagation (in 2–3 sub-steps if needed) | Each in the core calculators |

## Phase 8: rework existing tools (20 steps)
| Step | Ideas | What |
|---|---|---|
| S97 | 151, 152, 155 | Dilution: tube visual, serial mode; live two-way unit converter |
| S98 | 156, 157, 158 | Molar mass name lookup; buffer picker; Tris temperature correction |
| S99 | 159, 160, 161 | Interactive titration curve; osmolarity presets; merge chemistry calculators into one tool |
| S100 | 162, 163 | Standard curve: compare models (AIC) and residual plot with click-to-exclude |
| S101 | 164, 167, 171, 172 | Out-of-range unknowns, wavelength presets, Z′ verdict, purification chart |
| S102 | 165, 166 | Enzyme kinetics: all plots from one table; inhibition comparison |
| S103 | 168, 169 | Dose-response multi-compound; chromatography peak import |
| S104 | 173, 176 | CFU plate drawing with countable range; growth curve comparison stats |
| S105 | 177, 178 | One cell-counting tool with grid entry (merges telkamer, teller, viability) |
| S106 | 179, 181, 183 | Seeding picture; visual MIC plate with EUCAST note; MPN tap tubes |
| S107 | 184, 187 | Measure cells on calibrated photos; disinfection log-reduction chart |
| S108 | 188, 189, 190 | DNA quant batch + purity badge + "make it X ng/µL"; read primer synthesis report |
| S109 | 191, 200 | PCR mastermix and cDNA kit presets |
| S110 | 196, 197, 198 | qPCR efficiency from standard curve; fold-change chart; melt curve overlay |
| S111 | 201, 205, 206 | Virtual electropherogram; ligation ratio picture; transformation plate tap-count |
| S112 | 208, 209, 210 | STR electropherogram view; shared allele frequency table; bloodstain drawing |
| S113 | 213, 215, 216 | Statistics "which test?" wizard, inline assumption checks, long-format paste |
| S114 | 214, 217, 218, 219, 220 | APA sentence; Bland-Altman bias; ROC cut-off; Kaplan-Meier risk table; sig-fig practice |
| S115 | 221, 222 | Pipette profiles + certificate; Westgard violations on the chart |
| S116 | 223, 224, 226 | Uncertainty pie chart; validation report template; pipetting scheme drag rows + kit templates |

## Phase 9: structure and workflows (5 steps)
| Step | Ideas | What |
|---|---|---|
| S117 | 2 | Data flow between workflow steps (DNA conc → PCR → Gelplanner → gel editor) |
| S118 | 5 | Projects: group inputs, gels and notes under a name; switch projects |
| S119 | 6, 7 | Custom workflows (pick tools, save, share) and course workflow templates |
| S120 | 19 | Share a whole workflow run as one link/QR |
| S121 | 9 | Search that understands questions ("500 mL 0.9% NaCl" opens the tool with values filled in) |

## Phase 10: performance (12 steps)
| Step | Ideas | What |
|---|---|---|
| S122 | 246, 247, 251 | Idle preload of the English dictionary; check compression; SVG/WebP assets and lazy demo gel |
| S123 | 250, 252, 253 | Minified build output; idle precache of heavy parts; desktop splash |
| S124 | 249 | Critical CSS for the start page first |
| S125 | 243 | Lazy-initialise tools, part 1: init registry + 30 tools |
| S126 | 243 | Lazy init part 2: remaining tools; startup test updated |
| S127 | 244 | Template hidden tools (DOM 10.7k → ~1.5k nodes), part 1 |
| S128 | 244 | Templates part 2 + fix tools that read hidden DOM (report, search) |
| S129 | 254, 255, 265 | Gel processing in a Web Worker; downscaled preview; free memory on leave |
| S130 | 256, 263, 264 | Layered gel canvas; layout-thrash audit; passive listeners |
| S131 | 257, 258, 260, 262 | Fits in a worker; redraw only visible charts; rAF batching; canvas text cache |
| S132 | 259, 261, 266, 267 | Diff undo; virtual tables; throttled saves; IndexedDB storage |
| S133 | 268 | WebAssembly for the heaviest image steps (only if S129 isn't enough) |

## Phase 11: quality, tests and dev (9 steps)
| Step | Ideas | What |
|---|---|---|
| S134 | 269, 273 | Bundle size budget and memory check in `perf_budget.py` |
| S135 | 270, 271, 274 | Gel editor benchmark, mobile Lighthouse, typing-latency (INP) test |
| S136 | 275 | Performance summary in the CI run |
| S137 | 284, 285, 289 | Copy error report, feedback link per tool, export/import everything |
| S138 | 278 | Unit tests for pure calculation functions |
| S139 | 279 | Visual regression screenshots for key tools and the gel editor |
| S140 | 280, 281, 282, 283 | Screen-reader results, keyboard gel editor/plate designer, theme contrast check, reduced motion |
| S141 | 288, 294 | Consistent source citation per result; local "most used tools" overview |
| S142 | 292 | Desktop auto-update via the Tauri updater |
| S143–S146 | 276, 277 | Split source from build and move all in-place tools into modules (4 steps, best done last or right before Phase 10) |

---

## Suggested start
1. **S1–S3** stages and colours (the new structure everything else hangs on).
2. **S13–S18** Gelplanner (the most-wanted visual for preparation).
3. **S62–S69** gel editor quick wins before the big rebuild.
4. **S134, S137** safety nets (size budget, error reports) early, because they're cheap.
