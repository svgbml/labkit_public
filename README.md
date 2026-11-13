# Labkit BML

Rekentools en een gelfoto-editor voor het biomedisch laboratorium. Gemaakt voor de praktijk bij Biomedisch Laboratoriumonderzoek, met de nadruk op microbiologie, DNA-werk en forensisch onderzoek. Alles draait lokaal: er gaan geen gegevens of foto's naar een server.

## Gebruiken

| Vorm | Hoe |
|---|---|
| **Web-app** | Open `https://svgbml.github.io/labkit_public/`. In Chrome of Edge: menu → *App installeren*. Daarna werkt hij ook offline, op pc, laptop en telefoon. |
| **Windows-programma** | Download onder *Releases* `Labkit-BML-x.y.z-setup.exe` (installatie) of `…-portable.exe` (zonder installatie). |
| **Zelf starten** | `npm install` en daarna `npm start` (Electron), of `npm run web` voor de web-app op je eigen computer. |

## Tools

**Oplossingen:** verdunning (C₁V₁ = C₂V₂), oplossing en buffer uit recept (PBS, TBE, Tris-NaCl).
**Assays:** standaardcurve (lineair, kwadratisch, 4PL voor ELISA), enzymkinetiek (activiteit uit ΔA/min, Michaelis-Menten-fit, Lineweaver-Burk, Hanes-Woolf, remmingstype en Kᵢ).
**Microbiologie:** groeicurve (OD₆₀₀ of KVE, automatische exponentiële fase, µ, verdubbelingstijd, lag-fase).
**qPCR-analyse:** relatieve expressie met 2^−ΔΔCt (Livak) en Pfaffl, met herhalingen, SD en grafiek.
**Forensisch:** degradatie-index, man/vrouw-verhouding en STR-input uit een kwantificatiekit (DNA-kwantificatie).
**Microbiologie en cellen:** verdunningsreeks en KVE/mL, telkamer (Bürker, Neubauer, Fuchs-Rosenthal), teller met toetsen 1–9.
**DNA:** A₂₆₀-kwantificatie en normaliseren naar STR-input, PCR-mastermix, PCR-cyclus (Tₘ via nearest-neighbor met zout- en Mg²⁺-correctie, programma, amplificatie, qPCR-efficiëntie), agarosegel en bandgrootte, gelfoto-editor, ligatie.
**Bench:** centrifuge (rpm ↔ × g), meerdere timers met meldingen, plaatindeling.

### Gelfoto-editor

- Contrast, helderheid, inverteren, rechtzetten, draaien, spiegelen en bijsnijden
- Automatische lanedetectie; lanen verslepen, toevoegen en een naam geven
- Automatische ladderdetectie met 100 bp-, 100 bp plus-, 1 kb-ladder of een eigen ladder (bp of kDa)
- Automatisch rechtzetten en lanedetectie die ook lege lanen vindt (via de vaste kamafstand)
- Banden meten met semi-logaritmische interpolatie, of alle banden in één keer meten; putjes worden overgeslagen
- Densitometrie: relatieve bandintensiteit per meting
- De gel zelf blijft onbewerkt: alle tekst, streepjes en metingen staan in de witte marge eromheen
- Export als PNG of JPG op 1×, 2× of 3× resolutie, met losse schakelaars voor titel, lanelabels, ladderwaarden, streepjes, eenheid, metingen en witte rand

### Handig

- Elke tabel en grafiek heeft een knop **Kopieer naar Excel** (tabel of grafiekdata, met Nederlandse decimalen) of **Kopieer grafiek** (als afbeelding)
- Tabellen vullen door een blok te plakken uit Excel of de plaatlezer
- **Sessie opslaan / openen** als bestand, om je werk naar een andere computer mee te nemen
- Resultaten kopiëren of downloaden als CSV (Excel, met puntkomma)
- Invoer, tabellen, plaatindeling, timers en teller worden onthouden op het apparaat; wissen kan onderaan het menu

## Validatie

`tests/validate.py` voert voor elke tool gepubliceerde ruwe data in via de echte interface en vergelijkt de uitkomst met de bron (FDA BAM, Cold Spring Harbor, NEB, Thermo Fisher, Sigma-Aldrich, R-dataset Puromycin, Livak/Pfaffl, Biopython, SciPy). Het resultaat staat in [`tests/VALIDATIE.md`](tests/VALIDATIE.md) en wordt bij elke wijziging opnieuw gecontroleerd door GitHub Actions.

## Projectstructuur

```
web/            de app (één HTML-bestand) + manifest, service worker en iconen
electron/       desktopschil die web/index.html laadt
build/icon.png  programma-icoon
.github/        workflows: web-app naar GitHub Pages, Windows-build bij een nieuwe versie, validatie bij elke wijziging
tests/          validatiescript, testgel en validatierapport
```

## Nieuwe versie uitbrengen

1. Pas `web/index.html` aan, verhoog `version` in `package.json` en `CACHE` in `web/sw.js`.
2. Push naar `main`: de web-app wordt automatisch bijgewerkt.
3. Zodra een nieuwe versie in `package.json` op `main` staat, bouwt GitHub Actions de Windows-installers en zet ze bij *Releases* (handmatig kan ook via Actions → "Windows-programma bouwen" → Run workflow).

## Bronnen voor de berekeningen

Elke tool vermeldt onderaan zijn bron. De belangrijkste: FDA Bacteriological Analytical Manual (hoofdstuk 3), Marienfeld (telkamers), Eppendorf Application Note 279 (A₂₆₀), NEB-protocollen (PCR, ligatie), Thermo Fisher (gelpercentages, Bradford), Sigma-Aldrich (centrifuge, enzymassay), Cold Spring Harbor Protocols (PBS) en Bio-Rad (TBE).

## Ideeën voor volgende versies

- Plaatlezer-export inlezen en koppelen aan plaatindeling en standaardcurve
- Protocolmodus met stappen, checklist en ingebouwde timers
- Restrictieknip-planner die de verwachte banden op de gel voorspelt
- Eén PDF-verslag voor je labjournaal met berekeningen, curves en gelfoto
- Bandmassa schatten uit de ladder (ng per band) naast de relatieve intensiteit
- Plaatlezer-export (CSV) direct inlezen in standaardcurve en plaatindeling
- Statistiek op ΔCt-waarden (t-toets) in de qPCR-analyse

Berekeningen zijn hulpmiddelen; controleer resultaten altijd tegen het protocol van je practicum.
