# LabKit ideas

LabKit organised around the four stages of lab work, plus a rework pass over the existing tools and a performance section. **Every idea has a number**, so you can say "do 12, 47 and 103".

**Size:** 🟢 small (hours) · 🟡 medium (a day or two) · 🔴 large (a week+)
**Value:** ⭐ nice · ⭐⭐ clearly better · ⭐⭐⭐ changes how people use LabKit

| Section | Numbers |
|---|---|
| [Top picks](#top-picks) | references only |
| [0. Structure and navigation](#0-structure-and-navigation) | 1–20 |
| [1. Preparation](#1-preparation-make-it-look-good-make-it-clear) | 21–60 |
| [2. Execution](#2-execution-help-while-youre-doing-it) | 61–90 |
| [3. Analysing](#3-analysing-better-results-better-visuals) | 91–150 |
| [4. Reworking existing tools](#4-reworking-existing-tools) | 151–235 |
| [5. Internal work](#5-internal-work-candidates-for-removal) | 236–242 |
| [6. Performance](#6-performance) | 243–275 |
| [7. Quality, accessibility and dev](#7-quality-accessibility-and-development) | 276–295 |

---

## Top picks

- **#91–#100** Gel editor rebuild: guided mode, direct manipulation, figure presets, project files.
- **#21** Visual gel loading diagram and **#22** predicted gel.
- **#1** Stage-based navigation (Prepare · Do · Analyse).
- **#61** Bench mode, with **#62** step checklists and **#63** timers built into steps.
- **#121** Figure maker and **#124** significance brackets.
- **#236** Remove the internal tools.
- **#243** Lazy-initialise tools and **#244** template the hidden tools.

---

## 0. Structure and navigation

| # | Idea | Size | Value |
|---|---|---|---|
| 1 | **Stages as the main navigation:** *Prepare*, *Do* and *Analyse* tabs, with the subject groups (DNA, Microbiology, …) as filters inside each stage. A tool can sit in more than one stage. | 🟡 | ⭐⭐⭐ |
| 2 | **Experiment flow carries data forward:** DNA concentration → PCR mix → gel loading plan → gel editor (expected bands pre-filled). Builds on the existing workflows. | 🔴 | ⭐⭐⭐ |
| 3 | **"Today" panel on the start page:** running timers, the active workflow step, the last gel and the last result. | 🟢 | ⭐⭐ |
| 4 | **Stage colour coding:** a subtle accent per stage, so you always know which mode you're in. | 🟢 | ⭐ |
| 5 | **Projects:** group tool inputs, gels and notes under a project name (e.g. "Practicum week 3"), and switch between projects in one click. Builds on *Sessie opslaan*. | 🔴 | ⭐⭐⭐ |
| 6 | **Custom workflows:** build your own workflow by picking tools in order, then save and share it as a link. | 🟡 | ⭐⭐ |
| 7 | **Workflow templates per course:** ready-made sets for BML practicum modules (e.g. "Moleculaire biologie jaar 2"). | 🟡 | ⭐⭐ |
| 8 | **"Next tool" suggestions:** at the bottom of each tool, show the 2–3 tools people usually use next (DNA quant → PCR mix, gel). | 🟢 | ⭐⭐ |
| 9 | **Global search that understands questions:** "how much NaCl for 500 mL 0.9%" opens the solution tool with the values filled in. | 🔴 | ⭐⭐ |
| 10 | **Search results show a preview** of the tool's description and tags, and support synonyms in both languages. | 🟢 | ⭐ |
| 11 | **Pinned tools bar:** pin up to 6 tools as icons in the header for one-tap access on phones. | 🟢 | ⭐⭐ |
| 12 | **Simple / expert toggle per tool:** hide advanced fields (θ-correction, custom models) until you need them. | 🟡 | ⭐⭐⭐ |
| 13 | **Consistent tool layout:** every tool has the same zones (inputs, result, chart, method/source, actions), in the same place. | 🟡 | ⭐⭐ |
| 14 | **Onboarding tour on first visit:** a 4-step overlay showing search, favourites, workflows and settings. | 🟢 | ⭐ |
| 15 | **What's new panel** after an update, with 3–5 highlights and a link to the full changelog. | 🟢 | ⭐ |
| 16 | **Tool icons:** a small, consistent icon per tool (pipette, gel, plate, curve) in nav and cards for faster scanning. | 🟡 | ⭐⭐ |
| 17 | **Breadcrumb in the header:** Stage › Group › Tool, so you can go up one level. | 🟢 | ⭐ |
| 18 | **Keyboard-first navigation:** `g` then a letter jumps to a stage, `?` shows all shortcuts. | 🟢 | ⭐ |
| 19 | **Share a whole workflow run** (all inputs of all steps) as one link or QR code. | 🟡 | ⭐⭐ |
| 20 | **Tablet layout:** two-column mode with the tool list on the left and the tool on the right, optimised for iPad on the bench. | 🟡 | ⭐⭐ |

---

## 1. Preparation: make it look good, make it clear

The goal is pictures and plans you can print, paste in the lab journal or show a supervisor. Today most prep tools only output tables and numbers.

### Gels
| # | Idea | Size | Value |
|---|---|---|---|
| 21 | **Realistic gel loading diagram:** a top-down gel with combs and wells. Each well gets a sample name, colour and volume, and the ladder is drawn next to it. Export as PNG/SVG. | 🟡 | ⭐⭐⭐ |
| 22 | **Predicted gel:** draw what the gel should look like from the expected sizes at the chosen agarose % and ladder. You can then compare it with the real photo. | 🟡 | ⭐⭐⭐ |
| 23 | **Well capacity check** for the chosen comb, well width and gel thickness. | 🟢 | ⭐⭐ |
| 24 | **SDS-PAGE version** of the loading diagram, with a prestained ladder look. | 🟢 | ⭐⭐ |
| 25 | **Agarose % advisor:** pick a % from your expected fragment range, and show the separation range of each %. | 🟢 | ⭐⭐ |
| 26 | **Gel casting recipe card:** agarose grams, buffer volume, stain volume for the chosen tray size. | 🟢 | ⭐⭐ |
| 27 | **Run time estimate** from the voltage, gel length and fragment sizes, with a "when to stop" moment for the dye front. | 🟡 | ⭐ |
| 28 | **Loading dye calculator:** volume of 6X dye per sample, with a picture of the colour fronts (bromophenol blue, xylene cyanol) on the predicted gel. | 🟢 | ⭐ |

### Plates and schemes
| # | Idea | Size | Value |
|---|---|---|---|
| 29 | **One shared plate designer** for 6/12/24/48/96/384-well plates, used by every plate tool. Drag to fill replicates; auto-fill a dilution across a row. | 🔴 | ⭐⭐⭐ |
| 30 | **Plate templates:** standard curve in duplicate + blanks + samples in triplicate, in one click. | 🟢 | ⭐⭐ |
| 31 | **Pipetting order view:** numbered or animated fill order, so you don't lose your place. | 🟡 | ⭐⭐ |
| 32 | **Multichannel mode:** plan and show where a multichannel pipette helps (whole rows or columns). | 🟡 | ⭐⭐ |
| 33 | **Tube rack picture** for master mixes and series: coloured tubes with labels and volumes. | 🟡 | ⭐⭐ |
| 34 | **Dilution series drawing:** tubes with arrows and volumes, with the colour fading as the concentration drops. | 🟢 | ⭐⭐ |
| 35 | **PCR programme as a temperature–time graph** with the cycles bracketed. | 🟢 | ⭐⭐ |
| 36 | **Staining protocol as an illustrated timeline:** reagent drops, timing, rinse steps. | 🟡 | ⭐ |
| 37 | **Plate map print:** A4 with the plate drawing, legend and a table of well contents, ready to tape next to the reader. | 🟢 | ⭐⭐ |
| 38 | **Transfer randomised layouts:** randomise sample positions on a plate to avoid edge effects, with a printable key. | 🟢 | ⭐ |
| 39 | **Edge-effect warning:** flag layouts that put the standards or controls only in outer wells. | 🟢 | ⭐ |

### Recipes, reagents and calculations
| # | Idea | Size | Value |
|---|---|---|---|
| 40 | **Recipe library:** PBS, TAE, TBE, RIPA, LB, SOC, Laemmli and more, scaled to any volume, as a printable card. | 🟡 | ⭐⭐⭐ |
| 41 | **"I have this stock" mode:** enter your actual stocks once; every recipe and mix uses them. | 🟡 | ⭐⭐ |
| 42 | **Custom recipes:** save your own recipe and share it as a link. | 🟡 | ⭐⭐ |
| 43 | **Hydrate-aware weighing:** pick a salt and the app offers the hydrates you might have on the shelf, with the right molar mass. | 🟢 | ⭐⭐ |
| 44 | **pH adjustment helper:** approximately how much HCl/NaOH to reach the target pH for common buffers. | 🟡 | ⭐ |
| 45 | **Autoclave / filter advice** per recipe (what can be autoclaved, what must be filter-sterilised, what to add afterwards). | 🟢 | ⭐⭐ |
| 46 | **Primer card:** sequence, Tm, GC%, length, self-dimer and hairpin warning, printable. | 🟢 | ⭐ |
| 47 | **Primer pair checker:** Tm difference, cross-dimers, expected product size on a pasted template. | 🟡 | ⭐⭐ |
| 48 | **In-silico PCR:** paste a template sequence and primers, and see the product and where the primers bind. | 🟡 | ⭐⭐ |
| 49 | **In-silico digest:** paste a sequence, pick enzymes, and see the fragments (and send them to the predicted gel, #22). | 🟡 | ⭐⭐⭐ |
| 50 | **Simple plasmid map:** a circular drawing with features, restriction sites and primers from a pasted sequence or GenBank file. | 🔴 | ⭐⭐ |
| 51 | **Reaction scaling with overage:** every master mix has a "+10% / +1 reaction" switch and shows the reasoning. | 🟢 | ⭐⭐ |
| 52 | **Antibody dilution planner:** from the datasheet dilution and the number of blots/wells, the volume of antibody and buffer. | 🟢 | ⭐⭐ |
| 53 | **Cell culture media prep:** medium + FBS % + pen/strep + supplements for any volume. | 🟢 | ⭐⭐ |
| 54 | **Competent-cell / transformation prep card** with timings and temperatures. | 🟢 | ⭐ |
| 55 | **Safety card per protocol:** GHS pictograms of all reagents in a recipe on one card (reuses the GHS tool). | 🟡 | ⭐⭐ |
| 56 | **Material list:** every Preparation tool can output "what to get from the cupboard" (tubes, tips, reagents) as a checklist. | 🟡 | ⭐⭐ |
| 57 | **Time plan per experiment:** from the chosen workflow, an estimate of hands-on and waiting time with a simple Gantt bar. | 🟡 | ⭐⭐ |
| 58 | **Protocol export:** combine the Preparation outputs (recipes, schemes, diagrams) into one printable protocol document. | 🟡 | ⭐⭐⭐ |
| 59 | **QR code on printed protocols** that reopens the exact inputs in LabKit. | 🟢 | ⭐⭐ |
| 60 | **Sample sheet import:** paste a list of sample names once and reuse it in plates, gels and master mixes. | 🟡 | ⭐⭐⭐ |

---

## 2. Execution: help while you're doing it

The goal: usable with gloves, at arm's length, on a phone or tablet next to the bench.

| # | Idea | Size | Value |
|---|---|---|---|
| 61 | **Bench mode:** large step cards, tap or swipe to go to the next step, the screen stays on (Wake Lock), high contrast. | 🟡 | ⭐⭐⭐ |
| 62 | **Step checklist from any scheme:** "add 12.5 µL buffer to tubes 1–8 ✓". | 🟡 | ⭐⭐⭐ |
| 63 | **Timers built into steps,** several running at once, shown in a bar at the top on every page. | 🟢 | ⭐⭐⭐ |
| 64 | **Timer presets:** gel run, incubation, centrifuge, staining, saved per user. | 🟢 | ⭐⭐ |
| 65 | **Timer alarms that also work with the screen off** (notification + vibration). | 🟢 | ⭐⭐ |
| 66 | **Large-button counter:** big tap zones, volume-key option, sound per tap, separate counters per category. | 🟢 | ⭐⭐ |
| 67 | **Hemocytometer guide:** a Neubauer grid drawing that highlights the next square and sums up as you count. | 🟡 | ⭐⭐ |
| 68 | **Colony counting from a photo:** auto-detect colonies on a plate photo, then correct by tapping. | 🔴 | ⭐⭐⭐ |
| 69 | **Cell counting from a microscope photo:** detect cells, and separate live and dead (trypan blue) by colour. | 🔴 | ⭐⭐ |
| 70 | **Centrifuge quick card:** your own rotors saved, with big rpm ↔ × g. | 🟢 | ⭐ |
| 71 | **Master mix progress:** tick off reactions as you pipette, and see the remaining volume. | 🟢 | ⭐⭐ |
| 72 | **Plate filling assistant:** tap a well when it's filled; the plate drawing shows progress and the next well. | 🟡 | ⭐⭐⭐ |
| 73 | **Gel loading assistant:** the same for gel wells, in the loading-diagram view (#21). | 🟢 | ⭐⭐ |
| 74 | **Run notes per step:** text plus a photo, stored locally and sent to the report later. | 🟡 | ⭐⭐ |
| 75 | **Camera shortcut** in the gel editor, colony counter and notes (rear camera on phones). | 🟢 | ⭐⭐ |
| 76 | **Deviation log:** quickly note "used 11 µL instead of 10"; the deviation shows in the report. | 🟢 | ⭐⭐ |
| 77 | **Voice input for numbers** (e.g. dictate absorbance readings into a table). | 🟡 | ⭐ |
| 78 | **Read-aloud mode** for the current step, for when your hands are busy. | 🟢 | ⭐ |
| 79 | **Glove-friendly input:** a big numeric keypad overlay on touch devices for number fields. | 🟡 | ⭐⭐ |
| 80 | **Quick convert overlay:** a floating mini-calculator for units and dilutions, reachable from any tool. | 🟡 | ⭐⭐ |
| 81 | **Pipette choice inline:** next to every pipetting volume, show the best pipette (from *Welke pipet?*). | 🟢 | ⭐⭐ |
| 82 | **"Below 1 µL" warning everywhere,** with the intermediate dilution advice the dilution tool already gives. | 🟢 | ⭐⭐ |
| 83 | **Incubator / water bath reminders** linked to the timeline of the current workflow. | 🟢 | ⭐ |
| 84 | **Live OD tracking:** enter OD readings over time, and the app predicts when the target OD is reached. | 🟡 | ⭐⭐⭐ |
| 85 | **Cell passage reminder:** from the passage planner, a reminder on the day the cells reach confluence. | 🟢 | ⭐ |
| 86 | **Spill/emergency card per protocol:** what to do with the reagents in use (from GHS P-sentences). | 🟢 | ⭐ |
| 87 | **Multi-device:** open the same run on the laptop (analysis) and the phone (bench), synced via a link or QR code, without a server (WebRTC). | 🔴 | ⭐⭐ |
| 88 | **Offline indicator** and the guarantee that everything at the bench works without a network. | 🟢 | ⭐ |
| 89 | **Dark-room mode:** red-tinted UI for use near a gel imager or a fluorescence microscope. | 🟢 | ⭐ |
| 90 | **Lock the screen layout** in bench mode so an accidental swipe doesn't navigate away. | 🟢 | ⭐ |

---

## 3. Analysing: better results, better visuals

### 3a. Gel editor rebuild (the main analysis tool)

**Problem:** six numbered sections and 68 controls stacked on one long page. Laning, ladder setup, measuring, styling and export are all visible at once, and most actions mean scrolling away from the image.

| # | Idea | Size | Value |
|---|---|---|---|
| 91 | **Canvas-first layout:** a large image, a left toolbar (Crop · Lanes · Ladder · Bands · Labels · Export) and a right panel that changes with the active tool; a bottom sheet on phones. | 🔴 | ⭐⭐⭐ |
| 92 | **Guided mode, 4 steps:** Crop & straighten → Lanes → Ladder → Measure. Auto-detection runs first; you only correct it. An "Expert" toggle shows everything. | 🟡 | ⭐⭐⭐ |
| 93 | **Direct manipulation:** drag lane borders, drag band markers, double-click to measure, zoom around the cursor. | 🔴 | ⭐⭐⭐ |
| 94 | **Undo/redo for every edit,** with a visible history. | 🟡 | ⭐⭐⭐ |
| 95 | **Lane labels typed on the image;** Tab moves to the next lane; paste a list of names from Excel. | 🟢 | ⭐⭐⭐ |
| 96 | **Figure style presets:** Lab journal · Report · Publication · Poster. | 🟡 | ⭐⭐⭐ |
| 97 | **Project files (`.labkitgel`)** with the photo, lanes, ladder and labels, to reopen later. | 🟡 | ⭐⭐⭐ |
| 98 | **Gel library:** recent gels with thumbnails, stored locally. | 🟡 | ⭐⭐ |
| 99 | **Before/after slider** for contrast and background correction. | 🟢 | ⭐⭐ |
| 100 | **Auto-enhance with a list of what was applied** (honest editing). | 🟡 | ⭐⭐ |
| 101 | **Integrity notice** of the adjustments in the export or its metadata, following journal image rules; a warning for non-linear edits. | 🟢 | ⭐⭐ |
| 102 | **Compare with the predicted gel (#22):** expected bands marked, missing and extra bands highlighted. | 🟡 | ⭐⭐⭐ |
| 103 | **Multiple gels in one figure,** with shared labels and A/B lettering. | 🟡 | ⭐⭐ |
| 104 | **Lane intensity profiles** under each lane, with peaks linked to bands. | 🟡 | ⭐⭐ |
| 105 | **Western blot mode:** chemiluminescence look, protein ladder, loading-control normalisation handed to the WB tool. | 🔴 | ⭐⭐ |
| 106 | **Keyboard shortcuts** (L lanes, B band, C crop, +/− zoom, arrows to nudge). | 🟢 | ⭐⭐ |
| 107 | **Smart crop:** detect the gel edges and the well row, and crop to "wells to dye front". | 🟡 | ⭐⭐ |
| 108 | **Perspective correction** for photos taken at an angle with a phone (four-corner warp). | 🟡 | ⭐⭐⭐ |
| 109 | **Smile/curved-lane correction:** follow bent lanes instead of assuming straight vertical lanes. | 🔴 | ⭐⭐ |
| 110 | **Saturation warning:** highlight overexposed pixels, so densitometry isn't trusted on clipped bands. | 🟢 | ⭐⭐⭐ |
| 111 | **Band labels on the image:** size labels next to the bands (e.g. "~1.2 kb") with smart placement. | 🟡 | ⭐⭐ |
| 112 | **Highlight / arrow / box annotations** (e.g. point at the band of interest). | 🟢 | ⭐⭐ |
| 113 | **Colour-to-greyscale options** for UV-trans and blue-light photos (choose the channel that gives the best contrast). | 🟢 | ⭐⭐ |
| 114 | **Pseudo-colour LUTs** (for presentations), with a warning not to use them for quantification. | 🟢 | ⭐ |
| 115 | **Export as an editable SVG** (image + vector labels), so text stays editable. | 🟡 | ⭐⭐ |
| 116 | **Copy straight into the lab journal** with the labels and a caption sentence. | 🟢 | ⭐⭐ |
| 117 | **Auto-generated figure legend:** "1% agarose gel, 100 V 45 min, ladder NEB 1 kb; lane 1–4 …". | 🟢 | ⭐⭐⭐ |
| 118 | **Result table per lane:** band sizes, relative intensity, ng estimate; export to Excel. | 🟢 | ⭐⭐ |
| 119 | **Ladder library editor:** add and share your own ladder definitions. | 🟢 | ⭐⭐ |
| 120 | **Touch gestures:** pinch to zoom, two-finger rotate, long-press to add a band. | 🟡 | ⭐⭐ |

### 3b. Charts and figures
| # | Idea | Size | Value |
|---|---|---|---|
| 121 | **Figure maker:** drop outputs from any tool into panels A–D and export one PNG/PDF/SVG at 300–600 dpi. | 🔴 | ⭐⭐⭐ |
| 122 | **One chart style system** for every tool (fonts, error bars, palettes). | 🟡 | ⭐⭐⭐ |
| 123 | **SVG export for every chart.** | 🟡 | ⭐⭐ |
| 124 | **Significance brackets** drawn automatically from the statistics output. | 🟡 | ⭐⭐⭐ |
| 125 | **Bar + dot plots by default** (show the replicates). | 🟢 | ⭐⭐ |
| 126 | **Plate heatmaps** for ELISA, qPCR and 96-well results, with outliers marked. | 🟢 | ⭐⭐ |
| 127 | **Chart editor panel:** axis titles, ranges, log scale, legend position, colours, all per chart and remembered. | 🟡 | ⭐⭐⭐ |
| 128 | **Box, violin and scatter plots** in the statistics tool. | 🟡 | ⭐⭐ |
| 129 | **Error bar choice** (SD, SEM, 95% CI), always labelled in the legend. | 🟢 | ⭐⭐ |
| 130 | **Chart theme matching the report** (font, size) so all figures look alike. | 🟢 | ⭐⭐ |
| 131 | **Data table under each chart** that can be toggled and copied. | 🟢 | ⭐ |
| 132 | **Annotate charts:** add text, arrows and reference lines (e.g. LOD line). | 🟡 | ⭐⭐ |
| 133 | **Overlay several runs** (e.g. growth curves of three days) in one chart. | 🟡 | ⭐⭐ |
| 134 | **Colour-blind preview** of any figure before export. | 🟢 | ⭐ |
| 135 | **Poster export:** large size and font presets. | 🟢 | ⭐ |

### 3c. Calculations and data
| # | Idea | Size | Value |
|---|---|---|---|
| 136 | **Plate-reader import wizard** (BioTek, Tecan, Thermo exports) → standard curve, ELISA, Z′, qPCR. | 🔴 | ⭐⭐⭐ |
| 137 | **qPCR instrument import** (Bio-Rad CFX, QuantStudio, LightCycler) with automatic well mapping. | 🟡 | ⭐⭐⭐ |
| 138 | **NanoDrop export import** → DNA/RNA quality tools. | 🟢 | ⭐⭐ |
| 139 | **Flow cytometry summary import** (exported population %). | 🟡 | ⭐ |
| 140 | **Result interpretation lines** in plain language under each result. | 🟡 | ⭐⭐ |
| 141 | **Replicate checker:** flag CV > x% and Grubbs outliers wherever replicates are entered. | 🟢 | ⭐⭐ |
| 142 | **Results to the report in one click** (figure + table + method sentence). | 🟡 | ⭐⭐ |
| 143 | **Method sentence generator** for the methods section. | 🟡 | ⭐⭐ |
| 144 | **Uncertainty everywhere:** propagate input uncertainty to the result (± value) in core calculators. | 🔴 | ⭐⭐ |
| 145 | **Unit-consistent results:** let the user pick the output unit of every result. | 🟡 | ⭐⭐ |
| 146 | **Significant figures by default:** round every result to sensible significant figures, with a "show more" toggle. | 🟢 | ⭐⭐ |
| 147 | **Compare with a reference range:** mark results outside an expected range (e.g. 260/280 < 1.8). | 🟢 | ⭐⭐ |
| 148 | **Batch mode:** run a calculator on a pasted table of samples (e.g. 24 DNA concentrations at once). | 🟡 | ⭐⭐⭐ |
| 149 | **Export to Excel with formulas** instead of only values, so the calculation is traceable. | 🟡 | ⭐⭐ |
| 150 | **Practicum answer check:** enter your own calculated answer and see if it matches (with the steps). | 🟢 | ⭐⭐ |

---

## 4. Reworking existing tools

Rework ideas per existing tool. Grouped by the current menu groups. Many reuse ideas from above.

### Solutions
| # | Tool | Rework idea | Size | Value |
|---|---|---|---|---|
| 151 | Verdunning | Show a **visual of the two tubes** (stock → final) with liquid levels, and solve for any missing field without an explicit "solve for" choice. | 🟢 | ⭐⭐ |
| 152 | Verdunning | **Serial mode** in the same tool (1:10 ×5), merging it with the dilution schedule. | 🟡 | ⭐⭐ |
| 153 | Oplossing & buffer | Connect to the **recipe library (#40)**, with checkboxes per component so you can tick off what's weighed. | 🟡 | ⭐⭐⭐ |
| 154 | Oplossing & buffer | **Weighing order + balance tips** (weigh the small amounts on an analytical balance). | 🟢 | ⭐ |
| 155 | Eenheden omrekenen | A **two-way live converter** (type in any box, the others update), with a molar mass lookup. | 🟢 | ⭐⭐ |
| 156 | Molmassa | **Name lookup** for common reagents (type "Tris" → C4H11NO3), and show the hydrate options. | 🟡 | ⭐⭐ |
| 157 | pH-buffer | A **buffer picker:** choose a target pH and get suitable buffers (pKa within ±1), with a recipe from stock solutions. | 🟡 | ⭐⭐ |
| 158 | pH-buffer | **Temperature correction** of the pKa (Tris!). | 🟢 | ⭐⭐ |
| 159 | Titratiecurve | **Interactive curve:** drag the titrant volume and see pH and species distribution live; overlay the measured points. | 🟡 | ⭐⭐ |
| 160 | Osmolariteit | **Preset media** (PBS, saline, DMEM) and a "make isotonic" helper. | 🟢 | ⭐ |
| 161 | Kjeldahl / waterhardheid / Ksp / buffercapaciteit | **Merge into one "Chemistry calculators" tool** with tabs, to slim down the menu. | 🟡 | ⭐⭐ |

### Assays
| # | Tool | Rework idea | Size | Value |
|---|---|---|---|---|
| 162 | Standaardcurve | **Model comparison:** fit linear/quadratic/4PL/5PL at once and recommend the best by AIC and residuals. | 🟡 | ⭐⭐⭐ |
| 163 | Standaardcurve | **Residual plot + outlier flag,** and the option to exclude a point by clicking it. | 🟢 | ⭐⭐⭐ |
| 164 | Standaardcurve | **Unknowns outside the range** clearly marked, with a dilution suggestion to bring them inside. | 🟢 | ⭐⭐ |
| 165 | Enzymkinetiek | **One input table → all plots** (MM, LB, Hanes, Eadie) side by side, with nonlinear fit as the main answer and the linearisations as teaching aids. | 🟡 | ⭐⭐ |
| 166 | Enzymkinetiek | **Inhibition comparison:** fit several inhibitor concentrations together and show the type with confidence. | 🟡 | ⭐⭐ |
| 167 | Spectrofotometrie | **Wavelength presets** per assay (Bradford 595, BCA 562, Lowry 750, NADH 340) with ε values. | 🟢 | ⭐⭐ |
| 168 | Dosis-respons | **Several compounds in one chart** with IC50 ± CI for each and a comparison test. | 🟡 | ⭐⭐ |
| 169 | Chromatografie / interne standaard | **Peak table import** from a CSV export, and a chromatogram sketch from the peak list. | 🟡 | ⭐ |
| 170 | ELISA | Use the **shared plate designer (#29)** and plate heatmap (#126); automatic blank subtraction and duplicate CV. | 🟡 | ⭐⭐⭐ |
| 171 | Z′-factor | **Plate view of controls** and a traffic-light verdict (excellent / acceptable / poor). | 🟢 | ⭐ |
| 172 | Eiwitzuiveringstabel | **Bar chart of yield and purification fold per step,** and an SDS-PAGE lane sketch per step. | 🟢 | ⭐⭐ |

### Microbiology and cells
| # | Tool | Rework idea | Size | Value |
|---|---|---|---|---|
| 173 | Verdunningsreeks & KVE | **Plate drawing per dilution** with the countable range (30–300) highlighted; pick the right plates automatically. | 🟡 | ⭐⭐⭐ |
| 174 | Verdunningsreeks & KVE | Link to **colony counting from a photo (#68).** | 🟢 | ⭐⭐ |
| 175 | Groeicurve | **Live mode (#84)** and automatic log-phase detection with the fitted region shown. | 🟡 | ⭐⭐⭐ |
| 176 | Groeicurves vergelijken | **Statistical comparison of µmax and lag** between conditions, with error bars. | 🟡 | ⭐⭐ |
| 177 | Telkamer | **Grid diagram + per-square entry (#67)** and a viability split. | 🟡 | ⭐⭐ |
| 178 | Telkamer / Teller / Viabiliteit | **Merge into one "Cell counting" tool** with modes (Bürker, Neubauer, trypan blue). | 🟡 | ⭐⭐ |
| 179 | Cellen uitzaaien | **Plate/flask picture** with the cell number per well and the volume of suspension to add. | 🟢 | ⭐⭐ |
| 180 | Celpassageplanner | **Calendar view** of the expected passages, with a reminder (#85). | 🟢 | ⭐ |
| 181 | Antibiotica-gevoeligheid | **Visual MIC plate** (turbid vs clear wells by tapping) and EUCAST breakpoints per species with a version note. | 🟡 | ⭐⭐⭐ |
| 182 | Antibiotica-gevoeligheid | **Zone measurement on a photo:** tap the disc and the edge, and the zone diameter is measured. | 🟡 | ⭐⭐ |
| 183 | MPN | **Tube picture** where you tap positive tubes instead of typing a code. | 🟢 | ⭐⭐ |
| 184 | Microscoop-kalibratie | **Measure on a photo:** calibrate with a micrometer photo, then measure cells on other photos. | 🟡 | ⭐⭐ |
| 185 | Flowcytometrie | **Panel builder with a spectrum overlap view** for the chosen fluorochromes. | 🔴 | ⭐⭐ |
| 186 | Transfectie | **Plate-format presets** (6/12/24/96) and a mastermix for N wells. | 🟢 | ⭐ |
| 187 | Desinfectietest | **Log-reduction chart** over contact time with the pass/fail threshold. | 🟢 | ⭐ |

### DNA and protein
| # | Tool | Rework idea | Size | Value |
|---|---|---|---|---|
| 188 | DNA-kwantificatie | **Batch mode (#148)** and the purity verdict as a colour badge (260/280, 260/230). | 🟢 | ⭐⭐⭐ |
| 189 | DNA-kwantificatie | **"Make it X ng/µL" button:** the dilution to reach a target concentration. | 🟢 | ⭐⭐ |
| 190 | Primers oplossen | **Read the synthesis report** (nmol, MW) by pasting it, and give the volume for 100 µM. | 🟢 | ⭐⭐ |
| 191 | PCR-mastermix | **Kit presets** (NEB Taq, Q5, Phusion, OneTaq, DreamTaq) with their own buffer, Mg and polymerase volumes. | 🟢 | ⭐⭐⭐ |
| 192 | PCR-mastermix | **Tube rack picture (#33)** and a checklist (#62). | 🟢 | ⭐⭐ |
| 193 | PCR-cyclus | **Annealing temperature from the primers** (link with the primer checker #47) and the programme graph (#35). | 🟢 | ⭐⭐ |
| 194 | Gradiënt-PCR | **Gel prediction per column** to plan which annealing temperatures to test. | 🟢 | ⭐ |
| 195 | qPCR-analyse | **Instrument import (#137)**, plate heatmap and replicate outlier removal by tapping. | 🟡 | ⭐⭐⭐ |
| 196 | qPCR-analyse | **Efficiency from a standard curve in the same tool,** used automatically in Pfaffl. | 🟢 | ⭐⭐ |
| 197 | qPCR-analyse | **Fold-change chart with significance brackets (#124).** | 🟢 | ⭐⭐ |
| 198 | qPCR-smeltcurve | **Overlay all wells** with the single-peak / multi-peak verdict per well. | 🟢 | ⭐⭐ |
| 199 | qPCR-plaatindeling | Use the **shared plate designer (#29)** and export to the instrument's import format. | 🟡 | ⭐⭐ |
| 200 | cDNA-synthese | **Kit presets** and a reminder for the no-RT control. | 🟢 | ⭐ |
| 201 | RNA-kwaliteit | **A virtual electropherogram** from the 28S/18S ratio and a RIN-like quality badge. | 🟢 | ⭐ |
| 202 | Agarosegel & bandgrootte | **Merge into the gel editor** as "measure from sizes" (without a photo) and the predicted gel (#22). | 🟡 | ⭐⭐ |
| 203 | SDS-PAGE monsters | **Loading diagram (#24)** and a sample-buffer + reducing agent calculation per sample. | 🟢 | ⭐⭐ |
| 204 | Western blot-normalisatie | **Import band intensities from the gel editor** (WB mode #105) instead of typing them. | 🟡 | ⭐⭐⭐ |
| 205 | Ligatie | **Insert:vector ratio picture** and a recommended ratio per cloning type (sticky, blunt, TA). | 🟢 | ⭐ |
| 206 | Transformatie & blauw-wit | **Plate picture** with blue/white counts by tapping, and an efficiency badge. | 🟢 | ⭐ |
| 207 | Restrictiedigestie | **In-silico digest (#49)** with buffer compatibility for double digests and star-activity warnings. | 🟡 | ⭐⭐⭐ |

### Forensic
| # | Tool | Rework idea | Size | Value |
|---|---|---|---|---|
| 208 | STR-profielcontrole | **Electropherogram-style view** of the entered peaks per locus. | 🟡 | ⭐⭐ |
| 209 | Forensische matchkans / mengprofiel / verwantschap | **Shared allele frequency table** (choose the population once for all forensic tools). | 🟡 | ⭐⭐ |
| 210 | Bloedvlekpatronen | **Draw the stains on a photo/diagram** and show the convergence point visually. | 🟡 | ⭐⭐ |
| 211 | Tijd sinds overlijden | **Henssge nomogram drawing** with the result plotted on it. | 🟢 | ⭐⭐ |
| 212 | Forensic group | **One "case" view:** the tool results of one case together, exported as a report. | 🟡 | ⭐ |

### Data and statistics
| # | Tool | Rework idea | Size | Value |
|---|---|---|---|---|
| 213 | Statistiek | **"Which test?" wizard:** answer 3–4 questions (groups, paired, normal?) and get the right test opened. | 🟡 | ⭐⭐⭐ |
| 214 | Statistiek | **Report sentence in APA style** (t(18) = 2.31, p = .033, d = 1.03). | 🟢 | ⭐⭐⭐ |
| 215 | Statistiek | **Assumption checks shown inline** (normality, equal variances) with what to do if they fail. | 🟢 | ⭐⭐ |
| 216 | Statistiek | **Long-format data paste** (group column + value column) as well as columns per group. | 🟢 | ⭐⭐ |
| 217 | Bland-Altman | **Proportional bias test** and a log-ratio option. | 🟢 | ⭐ |
| 218 | ROC-curve | **Optimal cut-off picker** on the curve (Youden) with a confusion matrix. | 🟢 | ⭐⭐ |
| 219 | Kaplan-Meier | **Number-at-risk table under the chart.** | 🟢 | ⭐⭐ |
| 220 | Significante cijfers | **Practice mode** with random questions. | 🟢 | ⭐ |

### Quality
| # | Tool | Rework idea | Size | Value |
|---|---|---|---|---|
| 221 | Pipetkalibratie | **Pipette profiles** (serial number, history over time) and a pass/fail certificate PDF. | 🟡 | ⭐⭐ |
| 222 | Westgard | **Rule violations marked on the chart** with an explanation of each rule. | 🟢 | ⭐⭐ |
| 223 | Meetonzekerheid | **Uncertainty budget pie chart** showing the largest contributor. | 🟢 | ⭐⭐ |
| 224 | Methodevalidatie | **Validation report template** with all parameters on one page. | 🟡 | ⭐⭐ |

### Protocols (schemes)
| # | Tool | Rework idea | Size | Value |
|---|---|---|---|---|
| 225 | Verdunningsschema | **Tube drawing (#34)** and a checklist (#62). | 🟢 | ⭐⭐ |
| 226 | Pipetteerschema | **Drag-and-drop rows** and kit templates shared with the PCR mastermix (#191). | 🟡 | ⭐⭐ |
| 227 | PCR-programma | **Temperature–time graph (#35)** and export to a thermocycler-like printout. | 🟢 | ⭐⭐ |
| 228 | Gel-laadschema | **Becomes the realistic loading diagram (#21).** | 🟡 | ⭐⭐⭐ |
| 229 | Kleuringsschema | **Illustrated timeline (#36)** and a bench-mode checklist (#61). | 🟡 | ⭐ |
| 230 | GHS-etiket | **Label size presets** (tube, bottle, A4) and a lookup of common chemicals' H/P-sentences. | 🟡 | ⭐⭐ |

### Bench
| # | Tool | Rework idea | Size | Value |
|---|---|---|---|---|
| 231 | Timers | **Persistent timer bar on every page (#63)** and presets (#64). | 🟢 | ⭐⭐⭐ |
| 232 | Centrifuge | **Saved rotors (#70)** and a balance diagram (where to put the counterweight tubes). | 🟢 | ⭐⭐ |
| 233 | Welke pipet? | **Inline everywhere (#81)** rather than only a separate tool. | 🟢 | ⭐⭐ |
| 234 | Plaatindeling | **Becomes the shared plate designer (#29).** | 🔴 | ⭐⭐⭐ |
| 235 | Rapport / labjournaal | **Drag to reorder sections, add free text and photos (#74),** and a nicer print template with a cover page. | 🟡 | ⭐⭐ |

---

## 5. Internal work (candidates for removal)

These tools serve lab administration rather than doing or analysing experiments.

| # | Idea | Size | Value |
|---|---|---|---|
| 236 | **Remove Chain of custody** (`tools/nt/25_coc`), with its translations and validation rows. | 🟢 | ⭐⭐ |
| 237 | **Remove Reagent stock** (`60_stock`). | 🟢 | ⭐ |
| 238 | **Remove Freezer boxes** (`88_cryo`). | 🟢 | ⭐ |
| 239 | **Remove Label sheets** (`89_labels`); keep the QR/barcode generator as a helper for the Preparation tools that need it. | 🟢 | ⭐ |
| 240 | **Fold Experiment planner** (`61_plan`) into bench mode and workflows (#61, #57). | 🟡 | ⭐⭐ |
| 241 | **Alternative: a "Show internal tools" toggle** in Settings (off by default) instead of deleting. | 🟢 | ⭐ |
| 242 | **Clean up menu groups** after removal (e.g. merge Organisation into Bench). | 🟢 | ⭐ |

---

## 6. Performance

Measured on the current branch (localhost, Chromium): the page is 830 KB of HTML with about 10.7k DOM nodes and 92 tool sections; 46 canvases are drawn at startup, and tool setup takes ~170 ms.

### Loading
| # | Idea | Size | Expected gain |
|---|---|---|---|
| 243 | **Lazy-initialise tools:** run each tool's setup on its first open. | 🔴 | −100–150 ms script; 46 fewer canvas draws |
| 244 | **Template the hidden tools:** keep their HTML in `<template>` until first opened (DOM ~10.7k → ~1.5k nodes). | 🔴 | Faster parse, style and layout; less memory |
| 245 | **Split the JS per stage,** loading the gel editor only when opened. | 🔴 | Smaller first download |
| 246 | **Preload the English dictionary in idle time** for an instant language switch. | 🟢 | Instant switch |
| 247 | **Brotli/gzip check** for the Pages and desktop builds. | 🟢 | ~70% less transfer |
| 248 | **Remove the internal tools** (#236–#240). | 🟢 | Less HTML/JS |
| 249 | **Critical CSS for the start page first,** the rest after first paint. | 🟡 | Earlier first paint |
| 250 | **Minify the build output** (keep readable source, ship minified `index.html`). | 🟡 | −25–35% bytes |
| 251 | **Image assets as SVG or WebP** (icons, demo gel) and lazy-load the demo gel only when requested. | 🟢 | Smaller download |
| 252 | **Service worker precache of the gel editor and dictionary in idle time** after the first visit. | 🟢 | Instant later opens, offline |
| 253 | **Faster startup of the desktop app:** check the Tauri window shows immediately with a light splash. | 🟢 | Perceived speed |

### Runtime
| # | Idea | Size | Expected gain |
|---|---|---|---|
| 254 | **Gel image processing in a Web Worker** with `OffscreenCanvas`. | 🟡 | No freezes on big photos |
| 255 | **Downscaled preview, full resolution for measuring and export.** | 🟢 | 4–10× faster redraws |
| 256 | **Layered gel canvas** (image / lanes / bands / labels) so only the changed layer redraws. | 🟡 | Smooth dragging |
| 257 | **Fits in a worker** (4PL/5PL, statistics, titration) with debounced input. | 🟢 | No lag while typing |
| 258 | **Only redraw visible charts;** skip hidden tools on theme changes. | 🟢 | Faster theme switch |
| 259 | **Diff-based undo and history** for large tables. | 🟢 | Less memory |
| 260 | **requestAnimationFrame batching** for chart redraws triggered by fast typing. | 🟢 | Smoother input |
| 261 | **Virtualised long tables** (e.g. 2000-row imports) so only visible rows are in the DOM. | 🟡 | Big tables stay fast |
| 262 | **Cache translated canvas text per language** across redraws (extend the existing cache). | 🟢 | Faster English charts |
| 263 | **Avoid layout thrash:** read sizes first, then write (audit hot paths with the performance panel). | 🟡 | Fewer forced layouts |
| 264 | **Passive event listeners** for scroll/touch on the gel canvas. | 🟢 | Smoother scrolling |
| 265 | **Release memory of the gel editor** when you leave it (drop the large image buffers). | 🟢 | Less memory on phones |
| 266 | **Throttle localStorage writes** (batch saves of inputs every few hundred ms). | 🟢 | Less main-thread work |
| 267 | **IndexedDB for large data** (gel photos, history, projects) instead of localStorage strings. | 🟡 | Larger, faster storage |
| 268 | **WebAssembly for the heaviest image steps** (background subtraction, peak finding) if a worker isn't enough. | 🔴 | Large photos in milliseconds |

### Guard rails
| # | Idea | Size |
|---|---|---|
| 269 | **Bundle size budget** in `perf_budget.py` (fail on more than 5% growth). | 🟢 |
| 270 | **Gel editor benchmark** on the realistic test gel in CI. | 🟢 |
| 271 | **Lighthouse on a mobile preset** as well as desktop. | 🟢 |
| 272 | **Low-end phone profile** (4× CPU throttle) in `perf_budget.py`. | 🟢 |
| 273 | **Memory check:** heap size after opening all tools and the gel editor stays under a limit. | 🟢 |
| 274 | **Interaction timing (INP) test:** typing in the heaviest tools responds within 100 ms. | 🟡 |
| 275 | **Performance dashboard** in the CI summary (startup, size and gel benchmark over time). | 🟡 |

---

## 7. Quality, accessibility and development

| # | Idea | Size | Value |
|---|---|---|---|
| 276 | **Split source from build:** CSS, core JS and older tools into `src/`, assembled by one build script (single-file output stays). | 🔴 | ⭐⭐⭐ |
| 277 | **Move every remaining in-place tool into `tools/nt/` modules,** so all tools are edited the same way. | 🔴 | ⭐⭐ |
| 278 | **Unit tests for the pure calculation functions** (fast, no browser needed), alongside the UI validation. | 🟡 | ⭐⭐ |
| 279 | **Visual regression screenshots** of key tools and the gel editor in CI. | 🟡 | ⭐⭐ |
| 280 | **Screen-reader pass:** results announced via `aria-live`, charts with a text summary. | 🟡 | ⭐⭐ |
| 281 | **Full keyboard use of the gel editor and plate designer.** | 🟡 | ⭐⭐ |
| 282 | **Contrast check of all themes** in CI (WCAG AA). | 🟢 | ⭐⭐ |
| 283 | **Reduced-motion respect** for all new animations. | 🟢 | ⭐ |
| 284 | **Error reporting without a server:** "Copy error report" button with version, tool and inputs, for GitHub issues. | 🟢 | ⭐⭐ |
| 285 | **Feedback link per tool** that opens a pre-filled GitHub issue. | 🟢 | ⭐ |
| 286 | **Changelog generated from commits** and shown in the app (#15). | 🟢 | ⭐ |
| 287 | **Third language** (e.g. German or French) once the i18n flow is proven. | 🟡 | ⭐ |
| 288 | **Source citation per result** (which formula, which reference) consistent across tools. | 🟡 | ⭐⭐ |
| 289 | **Data export/import of everything** (settings, history, projects) as one file for moving to a new device. | 🟢 | ⭐⭐ |
| 290 | **Signed Windows installer** so the "unknown publisher" warning disappears. | 🟡 | ⭐⭐ |
| 291 | **macOS and Linux desktop builds** from the same Tauri setup. | 🟡 | ⭐ |
| 292 | **Auto-update for the desktop app** through the Tauri updater instead of downloading a new installer. | 🟡 | ⭐⭐ |
| 293 | **Teacher mode:** share a link that locks inputs to an exercise and hides the answer until submitted. | 🟡 | ⭐⭐ |
| 294 | **Usage-free analytics alternative:** an optional, local "most used tools" overview to decide what to improve next. | 🟢 | ⭐ |
| 295 | **CLAUDE.md for the repo** describing the build, the NT modules and the i18n rules, so future changes stay consistent. | 🟢 | ⭐⭐ |

---

## Suggested order

1. **#236–#242** Remove the internal tools. *(quick, and it simplifies everything after)*
2. **#92, #95, #96, #97, #110** Gel editor quick wins: guided mode, label typing, presets, project files, saturation warning.
3. **#21, #22, #49** Loading diagram, predicted gel and in-silico digest. *(links Preparation to Analysing)*
4. **#1, #12** Stage navigation and simple/expert toggle.
5. **#61–#63, #231** Bench mode, checklists and the timer bar.
6. **#29, #170, #199, #234** The shared plate designer.
7. **#243, #244, #254** Lazy-init, templates and the gel worker.
8. **#91, #93** The canvas-first gel editor rebuild.
9. **#121, #122, #124** Figure maker, shared chart style and significance brackets.
