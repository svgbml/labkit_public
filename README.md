# Labkit BML

Rekentools en een gelfoto-editor voor het biomedisch laboratorium. Gemaakt voor de praktijk bij Biomedisch Laboratoriumonderzoek, met de nadruk op microbiologie, DNA-werk en forensisch onderzoek. Alles draait lokaal: er gaan geen gegevens of foto's naar een server.

## Gebruiken

| Vorm | Hoe |
|---|---|
| **Web-app** | Open `https://svgbml.github.io/labkit/`. In Chrome of Edge: menu → *App installeren*. Daarna werkt hij ook offline, op pc, laptop en telefoon. |
| **Windows-programma** | Download onder *Releases* `Labkit-BML-x.y.z-setup.exe` (installatie) of `…-portable.exe` (zonder installatie). |
| **Zelf starten** | `npm install` en daarna `npm start` (Electron), of `npm run web` voor de web-app op je eigen computer. |

## Tools

**Oplossingen:** verdunning (C₁V₁ = C₂V₂), oplossing en buffer uit recept (PBS, TBE, Tris-NaCl).
**Assays:** standaardcurve (lineair, kwadratisch, 4PL voor ELISA), enzymkinetiek (activiteit uit ΔA/min, Michaelis-Menten-fit, Lineweaver-Burk, Hanes-Woolf, remmingstype en Kᵢ).
**Microbiologie en cellen:** verdunningsreeks en KVE/mL, telkamer (Bürker, Neubauer, Fuchs-Rosenthal), teller met toetsen 1–9.
**DNA:** A₂₆₀-kwantificatie en normaliseren naar STR-input, PCR-mastermix, PCR-cyclus (Tₘ, programma, amplificatie, qPCR-efficiëntie), agarosegel en bandgrootte, gelfoto-editor, ligatie.
**Bench:** centrifuge (rpm ↔ × g), meerdere timers met meldingen, plaatindeling.

### Gelfoto-editor

- Contrast, helderheid, inverteren, rechtzetten, draaien, spiegelen en bijsnijden
- Automatische lanedetectie; lanen verslepen, toevoegen en een naam geven
- Automatische ladderdetectie met 100 bp-, 100 bp plus-, 1 kb-ladder of een eigen ladder (bp of kDa)
- Banden meten met semi-logaritmische interpolatie
- Export als PNG of JPG op 1×, 2× of 3× resolutie, met losse schakelaars voor titel, lanelabels, ladderwaarden, streepjes, eenheid, metingen, lanelijnen en witte rand

### Handig

- Tabellen vullen door een blok te plakken uit Excel of de plaatlezer
- Resultaten kopiëren of downloaden als CSV (Excel, met puntkomma)
- Invoer wordt onthouden op het apparaat; wissen kan onderaan het menu

## Projectstructuur

```
web/            de app (één HTML-bestand) + manifest, service worker en iconen
electron/       desktopschil die web/index.html laadt
build/icon.png  programma-icoon
.github/        workflows: web-app naar GitHub Pages, Windows-build bij een versietag
```

## Nieuwe versie uitbrengen

1. Pas `web/index.html` aan, verhoog `version` in `package.json` en `CACHE` in `web/sw.js`.
2. Push naar `main`: de web-app wordt automatisch bijgewerkt.
3. Maak een tag, bijvoorbeeld `git tag v1.2.0 && git push --tags`: GitHub Actions bouwt de Windows-installers en zet ze bij *Releases*.

## Bronnen voor de berekeningen

Elke tool vermeldt onderaan zijn bron. De belangrijkste: FDA Bacteriological Analytical Manual (hoofdstuk 3), Marienfeld (telkamers), Eppendorf Application Note 279 (A₂₆₀), NEB-protocollen (PCR, ligatie), Thermo Fisher (gelpercentages, Bradford), Sigma-Aldrich (centrifuge, enzymassay), Cold Spring Harbor Protocols (PBS) en Bio-Rad (TBE).

## Ideeën voor volgende versies

- Densitometrie: relatieve bandintensiteit per lane in de gelfoto-editor
- ΔΔCt (relatieve genexpressie) bij de PCR-tools
- Forensische qPCR-kwantificatie: degradatie-index en man/totaal-verhouding naast de STR-input
- Plaatlezer-export inlezen en koppelen aan plaatindeling en standaardcurve
- Protocolmodus met stappen, checklist en ingebouwde timers
- Groeicurve (OD₆₀₀ → groeisnelheid en generatietijd)
- Restrictieknip-planner die de verwachte banden op de gel voorspelt
- Eén PDF-verslag voor je labjournaal met berekeningen, curves en gelfoto
- Sessies opslaan en openen als bestand

Berekeningen zijn hulpmiddelen; controleer resultaten altijd tegen het protocol van je practicum.
