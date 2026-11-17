# LabKit: optimisations, UI changes and ideas

Based on a review of v1.18.1 (measured in Chromium on localhost, 2026-11-17).
✅ = done on branch `perf/lazy-i18n-and-ux`. Still open: lazy-initialising tools, the plate-reader import wizard and splitting source from build (all 🔴) · 🟢 small · 🟡 medium · 🔴 large

## 1. Performance

| | Idea | Why |
|---|---|---|
| ✅ | **Lazy English translation.** At startup only the active tool and the headers of the others are translated. The rest is translated when a tool opens, before a report reads it, or in idle time. | English startup took **1,891 ms against 357 ms for Dutch**, because all 92 tools (10.7k DOM nodes) were walked before first paint. The i18n step now takes ~15 ms. |
| ✅ | **Load the English dictionary only when needed.** Move `I18N_EN` (395 KB, a third of `index.html`) to `en.json` and fetch it only when the language is English. | Dutch users download and parse ~33% less. It needs one `await` before `i18nStart()`. The service worker already caches it for offline use. |
| ✅ | **Merge the three MutationObservers on `<main>`** (`decorateXL`, `a11yFix`, `reportBtns`) into one, limited to the active section. | Every result re-render now triggers three debounced scans of the whole app. |
| 🔴 | **Lazy-initialise tools.** Run each tool's setup on its first open instead of at load. | Tool setup is the largest remaining startup cost (~170 ms), and 46 canvases are drawn in hidden sections. |
| ✅ | **One version script:** `tools/bump_version.py` sets all five places. | The version is in five places today, and a missed `sw.js` bump leaves users on a stale cache. |

## 2. UI / UX

| | Idea | Why |
|---|---|---|
| ✅ | **Phone header: magnifier button instead of "Ctrl+K: search everything".** | Phones have no Ctrl+K, and the hint took a third of the header. It still opens the command palette. |
| ✅ | **Phone: tool toolbar (Undo / Share / Copy link) above the title.** | It used to float beside the title and squeeze it onto two lines. |
| ✅ | **Phone start page: tags as one swipeable row.** | About 30 tag chips pushed Favourites and Recent below the fold. |
| ✅ | **Phone navigation: a "Tools" sheet grouped by category** instead of a horizontal strip with 91 links. | Scrolling sideways through 91 links to find one tool is the weakest part of mobile use. |
| ✅ | **Sticky result bar on phones.** Pin the main outcome (for example *Mean volume 99.993 µL ✓ passes*) to the bottom of the screen. | On phones the result sits below long input forms, so you can't see it change while you type. |
| ✅ | **"Automatic" theme that follows the system's light/dark setting** (`prefers-color-scheme`). | There are 5 themes, but none follows the OS. Dark mode at night is now a manual switch. |
| ✅ | **Collapsible groups in the desktop sidebar**, remembered per user. | The sidebar is 91 links long. Most users live in 2–3 groups. |
| ✅ | **"Validated" badge per tool**, linking to its rows in `VALIDATIE.md`. | The validation work is a strong point but invisible inside the app. It builds trust for practicum and audits. |
| ✅ | **Clearer empty and error states.** Show a short inline message ("enter at least 4 weighings") instead of a blank or NaN result. | `robust_audit.py` already finds these cases, so the message is cheap to add once a case is caught. |

## 3. Features

- ✅ **Workflows / chains:** saved sequences such as *DNA quant → PCR mix → gel loading → gel editor*, built on the existing forwarding between tools.
- ✅ **Unit-aware inputs everywhere:** typing `50 mM` or `0.5 µg/µL` in any concentration field converts it automatically.
- ✅ **Recent calculations per tool**, not just recent tools: one click restores the inputs from last Tuesday's practicum.
- ✅ **Print-friendly view per tool** (A4, inputs, results and source on one page) as a lighter option than the full report.
- 🔴 **Plate-reader import wizard** shared by Standard curve, ELISA, qPCR and Z′. Each tool parses its own format today.

## 4. Codebase / development framework

- 🔴 **Split the source from the build.** `web/index.html` (1.2 MB) is edited directly *and* is the build output, which makes diffs and reviews hard. Moving the CSS, core JS and older tools into `src/` (like `tools/nt/` already does) and assembling with one `build.py` keeps the single-file output and makes changes reviewable.
- ✅ **One `npm run check` command:** `tools/check.py` builds and then runs every test (`--quick` for a fast subset).
- ✅ **Lighthouse CI** like in the Leeromgeving repo, so performance regressions (like the English startup) are caught automatically.
- ✅ **Startup-time test:** `tests/perf_budget.py` checks DOMContentLoaded against a budget in both languages, that the dictionary loads only for English, and that lazy translation finishes. It also runs in CI.
