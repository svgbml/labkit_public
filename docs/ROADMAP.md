# LabKit roadmap

The ideas chosen from [ideas.md](ideas.md) (the `#` numbers), planned as **steps of about 30 minutes each**. Each step ends with a working app and runs `python tools/check.py --quick` (the full `tools/check.py` at the end of every phase). Then you can say "do step S12" or "do the next 3 steps".

**Status:** ✅ done · ⏳ planned · ✖ dropped
**Total:** 201 steps (S1–S201) ≈ 100 hours. Every chosen idea number appears in at least one step. Steps within a phase are in a sensible order; steps marked *(needs Sx)* depend on an earlier step.

**Progress:** S0 done. **Phase 1 (S1–S12) done**, **phase 2 (S13–S20) done**, phase 3 running: S21–S28 done, S29–S36 still to do. After each phase the full `python tools/check.py` passed (validation, layout in Dutch and English, robustness, translations, startup). Phases 12–14 (S147–S201) were added later and have not been started.

## Decisions
- **#13 shared layout** applies per *type* of tool. Picture-generating tools (schemes, diagrams, gel figures) share one layout; calculators keep their own.
- **Gel editor:** keep automatic ladder band detection, and keep editing the numbers/text next to each ladder band.
- **Removed:** chain of custody, reagent stock, freezer boxes, label sheets and the GHS label. Organisation is merged into Bench. The experiment planner stays (#240 was not chosen).
- **HIrisPlex-S:** LabKit prepares, checks and exports the genotype sheet and reports the outcome, but does **not** predict eye, hair or skin colour itself. The regression coefficients behind the system are not published and part of the method is covered by a patent, so the prediction stays with the Erasmus MC webtool. Re-implementing it from guessed coefficients would produce numbers that look official and are wrong.
- **NCBI:** lookups go straight from the browser to NCBI's E-utilities, which do send `Access-Control-Allow-Origin: *`, so no proxy or server is needed. They are optional and off by default, they send only an rs number or accession plus a tool name (**never an e-mail address unless the user types one**), everything is cached locally, and the request queue respects 3 requests per second (10 with a user-supplied API key). From a `file://` copy the browser blocks them; that is handled as a normal failure case, not a bug.
- **Clustal Omega:** stays at EBI. It is a compiled program with its own clustering and HMM alignment, so LabKit reads and analyses its output (`.aln`, `.pim`, `.dnd`), converts between alignment formats and checks the input before you upload it. LabKit's own engine does pairwise alignment and small multiple alignments, and says plainly that it is not a replacement.
- **Chromatograms:** no re-basecalling. The `.ab1` file already contains the sequencer's basecalls and peak positions, so LabKit reads those, labels them automatically and lets you edit every label. Heterozygotes are called on top of that from the peak heights.
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
| S13 | 21 | New *Gelplanner* tool: gel tray, comb and wells drawn top-down; sample name, colour and volume per well | ✅ `tools/nt/48_gplan.*`: tray on scale (length capped), comb, wells with name/colour/volume, PNG export; `ET` gained a `col` colour column |
| S14 | 21, 24 | Ladder drawn next to the wells; SDS-PAGE mode with prestained ladder look | ✅ Ladder strip beside the gel (log-linear positions), gel type agarose/SDS-PAGE with prestained ladder colours and the matching unit |
| S15 | 22 | Predicted gel: bands from expected sizes, log migration per agarose % and ladder | ✅ Second canvas with the expected gel (UV for DNA, Coomassie for SDS); positions from the ladder, the gel percentage gives the out-of-range warning |
| S16 | 23, 28 | Well capacity check (comb, thickness) and loading dye volume + dye fronts on the prediction | ✅ Well volume from comb/gel dimensions (fill to 80%), per-lane dye volume from the dye strength, warning over capacity, dye fronts on the expected gel |
| S17 | 25, 26 | Agarose % advisor from the fragment range and a casting recipe card for the tray size | ✅ Percentage advice from the expected bands (with "use this"), casting card with gel volume, agarose, buffer and stain; printable via the toolbar print button |
| S18 | 27 | Run time estimate from voltage, length and fragment sizes | ✅ Field strength + estimated run time as a range, "stop when the front is at … cm", warnings above 10 and below 3 V/cm and when the smallest fragment outruns the dye front |
| S19 | 228 | Gel loading scheme (`plaad`) opens in / is replaced by the Gelplanner; move its tests | ✅ `plaad` removed; `#plaad` redirects to `#gplan` via a `GONE` map; workflow, next-tool map, stages and icons follow. It had no validation cases of its own; 267/267 still pass |
| S20 | 203 | SDS-PAGE samples tool sends samples to the Gelplanner (SDS mode) | ✅ "Stuur monsters door naar: Gelplanner" under the SDS table; sets SDS mode, ladder lane and comb, and puts the dye strength at 1× because the sample buffer is already in the loading volume |

## Phase 3: preparation, picture tools and plates (16 steps)
| Step | Ideas | What | Done when |
|---|---|---|---|
| S21 | 13 | Shared layout for picture tools: preview left/top, options panel, export bar (PNG/SVG/copy/print) | ✅ `.picwrap` + `data-picbar` in `tools/nt/01_pic.js`; export bar PNG/SVG/copy/print, with a real canvas→SVG recorder (vectors, not a wrapped bitmap). Gelplanner converted |
| S22 | 13 | Move dilution scheme, pipetting scheme and PCR programme onto the shared layout | ✅ `pverd`, `ppip` and `pprog` on `.picwrap` with the shared export bar; stacking breakpoint raised to 1100 px so the options column stays wide enough |
| S23 | 13 | Move staining scheme and plate layout onto the shared layout | ✅ `stain` on `.picwrap`; `plaat` keeps its editor layout (its interactive plate is the preview) but gets the shared bar, as do the drawings in `oplossing`, `bpa`, `qplate`, `plan` and `stat` — every drawing in the app now exports the same way |
| S24 | 34, 225 | Dilution series drawing: tubes, arrows, volumes, colour fading | ✅ Tubes, arrows, volumes, fading and plating dishes were already drawn by earlier work; added a series colour (via a new `col` argument on `pTube`) and a note that the fade is indicative, not proportional |
| S25 | 35, 227 | PCR programme as a temperature–time graph with bracketed cycles | ✅ The graph with bracketed cycles existed; the x-axis is now a real time axis (step width ∝ duration, with a minimum so short steps stay readable), labels fitted to the step width, PNG/SVG export via the shared bar |
| S26 | 36, 229 | Staining protocol as an illustrated timeline | ✅ The box grid became a horizontal timeline: bar width ∝ time, a reagent drop per step (outlined for rinse/decolourise), a time axis and the expected result; PNG/SVG via the shared bar |
| S27 | 33, 192 | Tube rack picture for master mixes (PCR mix, pipetting scheme) | ✅ Shared `pRack` in `01_pic.js`; rack with master-mix tube + one tube per reaction in the PCR mix, and one tube per column in the pipetting scheme. Both capped at a maximum number of tubes |
| S28 | 29 | Shared plate designer, part 1: plate formats 6–384, select and colour wells, legend | ✅ `plateDesigner()` in `tools/nt/02_plate.js`: own state per instance, formats 6–384, groups with legend, click and drag (mouse and touch), `get`/`set`/`draw`/`size`. Verified standalone; it gets its first mount at S33 |
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

| Step | Ideas | What | Done when |
|---|---|---|---|
| S147 | 296 | ABIF parser as a lib module: big-endian header, tag directory, typed values; metadata out (sample, date, instrument, dye set) | A test `.ab1` gives the right sample name and read length |
| S148 | 296 | Read the data tags: channel order from `FWO_`, traces `DATA.9–12`, basecalls `PBAS.2`, peak positions `PLOC.2`, quality `PCON.2` | One object with 4 traces and n bases = n positions |
| S149 | 296, 303 | New *Chromatogram* tool: drop/choose a file, metadata card, sequence panel; FASTA and pasted text as fallback | File opens, sequence readable |
| S150 | 297, 332 | Canvas trace rendering: 4 channels, zoom, pan, overview strip, decimation to ~2 points per pixel | Smooth over a 900-base read |
| S151 | 298, 309 | Automatic base labels at the peak positions, each one editable, original call kept and the edit marked | Label changes and stays after a reload |
| S152 | 299 | Quality bars per base, colour-coded, plus a trim suggestion with an adjustable window and threshold | Trim marks the expected ends on a test read |
| S153 | 300, 301 | Sequence panel synced to the trace both ways, range selection, copy as FASTA, reverse complement toggle | Click-to-trace and copy both work |
| S154 | 304, 305 | Export PNG/SVG of the window, trimmed FASTA, and a print layout in rows of 60 bases | One printed page looks right |
| S155 | 306, 307 | Secondary-peak ratio per position with an adjustable threshold, heterozygotes as IUPAC codes in sequence and trace | A known het sample is called R/Y correctly |
| S156 | 308, 310 | SNP table per read (position, genotype, 4 peak heights, ratio, quality) and the warning flags, slippage included | Table exports; flags fire on a bad read |
| S157 | 309 | Override panel: change any call by hand, see what was original, reset per position or all | Overrides survive a reload |
| S158 | 311 | Reference sequence input and an anchored banded alignment of the read against it | Alignment finds the right offset on a shifted test read |
| S159 | 312, 313 | Variant list in reference coordinates with `g.` notation and rs numbers from the assay | Known SNP shows up with its rs number |
| S160 | 317, 318, 319 | Assay definition format (amplicon, SNPs, alleles, strand), an editor for your own panel, one built-in teaching panel, automatic strand flip | Own panel can be saved and reused |
| S161 | 302, 314 | Two reads of one sample side by side and forward/reverse confirmation with disagreements highlighted | A deliberate mismatch is flagged |
| S162 | 315, 316 | Batch drop of many files to a genotype table per sample, and the per-SNP overlay across samples | 10 files give 10 rows |
| S163 | 331, 333 | Move parsing and alignment into a Web Worker and load the whole module lazily | `perf_budget.py` startup unchanged; UI stays responsive on 20 files |
| S164 | 321, 322, 328 | HIrisPlex-S genotype sheet: 41 SNPs in order, `0/1/2/NA`, per-SNP allele check, panel switch IrisPlex / HIrisPlex / HIrisPlex-S | Sheet fills and validates by hand |
| S165 | 321, 323 | Fill the sheet from the called genotypes (needs S160), count `NA`s and warn per sub-model | Autofill matches a hand-filled sheet |
| S166 | 324, 325, 327 | Export in the webtool's `.csv` layout, copy button, link and explanation, and the note about not predicting locally | Exported file matches the official template header |
| S167 | 326 | Result sheet for the returned probabilities, with a summary and a figure for the report | Report section renders |
| S168 | 329, 330 | Worked example sample and saving a whole case (reads, calls, assay, sheet, results) as one project file | Example runs end to end without a sequencer |
| S169 | 320 | SNaPshot / SBE mode: read peaks per dye and size instead of per base | A `.fsa`-style SBE run gives one genotype per SNP |

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

| Step | Ideas | What | Done when |
|---|---|---|---|
| S170 | 334, 335 | Parsers for Clustal `.aln`, aligned FASTA, PHYLIP, NEXUS, MSF and PIR into one alignment model | A real `.aln` opens with the right names and length |
| S171 | 336, 366 | Alignment viewer: grid, sticky name column, position ruler, virtual rendering of visible cells only | Smooth on a 5000-column alignment |
| S172 | 337 | Colour schemes: ClustalX groups, nucleotides, identity shading, colourblind-safe variant | All four work in all five themes |
| S173 | 338, 339 | Conservation row and plot per column, consensus with an adjustable threshold | Recomputed row matches the file's own `* : .` line |
| S174 | 340, 341, 342 | Gap statistics per sequence and column, overview strip, column details on click | Clicking a column shows the counts |
| S175 | 343, 345 | Motif search with highlights; reorder by name, by identity or by hand | Search finds a known motif in every sequence |
| S176 | 346 | Difference view against a chosen reference (dots where identical) | Toggle switches cleanly |
| S177 | 344 | Trim and mask: gap-percentage filter, crop to a region, export the trimmed alignment | Trimmed export reopens correctly |
| S178 | 347, 348 | Percent identity matrix with heatmap, and pairwise identity with gap-handling options | Matrix matches a Clustal `.pim` for a test set |
| S179 | 349 | Conserved region finder with a threshold, sending a region to the primer tools (needs S42) | Region lands in the primer card |
| S180 | 350, 351 | Variant table in reference numbering, and inserting a called Sanger read into the alignment (needs S158) | Own read shows its variant in context |
| S181 | 352 | Translate a nucleotide alignment to protein in a chosen frame, codon-aware columns | Protein view matches a known translation |
| S182 | 353, 354 | Newick / `.dnd` reader, tree drawing (rectangular and radial) with branch lengths and export | A Clustal guide tree draws correctly |
| S183 | 355, 356 | Neighbour-joining tree from the identity matrix, and tree beside the alignment in one row order | NJ tree matches a worked example |
| S184 | 357, 359 | Pairwise Needleman-Wunsch and Smith-Waterman with BLOSUM62/PAM250/DNA scoring and gap settings | Validation case against a published alignment |
| S185 | 358, 360 | Small progressive multiple alignment for a handful of short sequences, with the note on when to use EBI instead | Five short sequences align sensibly; note visible |
| S186 | 361 | FASTA input builder with checks: duplicate names, illegal characters, mixed types, long names, empty sequences, line endings | Every check fires on a deliberately broken input |
| S187 | 362, 363 | Hand-off to EBI (copy, link, which files to bring back) and format conversion both ways | Round trip Clustal → FASTA → Clustal is lossless |
| S188 | 364 | Figure export of the alignment or a region as PNG/SVG with adjustable block width, plus print layout | One printed page looks right |
| S189 | 365 | Project file holding alignment, tree and settings | Reopens with everything in place |
| S190 | 367, 368 | Parsing and the identity matrix in a Web Worker; load the module only when an alignment is opened | `perf_budget.py` startup unchanged |

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

| Step | Ideas | What | Done when |
|---|---|---|---|
| S191 | 369, 370 | New *Sequentie* tool: reverse, complement, reverse complement with full IUPAC handling; paste clean-up of numbers, spaces and FASTA headers, multi-FASTA record by record | Reverse complement of an ambiguous test sequence is correct |
| S192 | 371, 372 | Output options (DNA/RNA, case, line width, plain or FASTA) and the facts panel (length, GC%, counts, MW, Tm) | GC% and MW match a validation case |
| S193 | 373 | Six-frame translation with a genetic code choice, ORFs and stop codons marked | Known ORF found in a test sequence |
| S194 | 374, 375, 376 | Restriction sites from the digest enzyme list (needs S45), send-to buttons, and receiving a selection from other tools | Sequence travels to the alignment tool |
| S195 | 377, 385, 386 | The online switch with its explanation, identification by tool name only, and the three failure cases handled plainly | Switch off = no requests at all; failures show a readable message |
| S196 | 378, 379 | dbSNP lookup by rs number: gene, chromosome position, reference and alternative alleles, HGVS, functional class, frequency table | rs1805007 returns MC1R, chr16 and its alleles |
| S197 | 380, 381 | Reference sequence and region fetch by accession, into the reference field of the chromatogram and alignment tools | An `NM_` accession lands as the reference |
| S198 | 383, 384 | Local cache of all lookups and a rate-limited request queue (3/s, 10/s with a key) with an API key field | Second lookup of the same rs number makes no request |
| S199 | 382 | Automatic allele and strand labelling of called peaks from dbSNP data (needs S160) | A reverse-strand SNP is labelled correctly without manual flipping |
| S200 | 387, 388 | Fill an assay panel from a list of rs numbers, and batch-verify the 41 HIrisPlex-S SNPs against dbSNP (needs S164) | All 41 come back with alleles and positions |
| S201 | 389, 390 | The confirmation note on every looked-up genotype, and exporting the cache as an offline pack | Offline pack reopens with the switch off |

---

## Suggested start
1. **S1–S3** stages and colours (the new structure everything else hangs on).
2. **S13–S18** Gelplanner (the most-wanted visual for preparation).
3. **S62–S69** gel editor quick wins before the big rebuild.
4. **S134, S137** safety nets (size budget, error reports) early, because they're cheap.
5. **S191** the reverse complement tool. One step, no dependencies, useful immediately.
6. **S170–S173** the alignment viewer, if you mostly need to read `.aln` files: four steps give a coloured alignment with conservation.
7. **S147–S151** the chromatogram reader, if SNP work is the nearest practical: these five steps already give a working trace viewer with automatic, editable base labels.
