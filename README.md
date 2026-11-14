# Labkit BML

Rekentools, statistiek, schema's en een gelfoto-editor voor het biomedisch laboratorium. Gemaakt voor de praktijk bij Biomedisch Laboratoriumonderzoek: microbiologie, celbiologie, DNA-werk en forensisch onderzoek.

Alles draait lokaal op je eigen apparaat. Er gaan geen gegevens, metingen of foto's naar een server.

## Installeren

| Vorm | Hoe |
|---|---|
| **Web-app** | Open [svgbml.github.io/labkit_public](https://svgbml.github.io/labkit_public/). In Chrome of Edge kun je hem via het menu installeren (*App installeren*); daarna werkt hij ook offline. |
| **Windows** | Download onder [Releases](../../releases/latest) `Labkit-BML-x.y.z-setup.exe` (installatie) of `…-portable.exe` (zonder installatie, gebruikt de WebView2 die in Windows 10 en 11 zit). Het programma is niet ondertekend: kies bij de Windows-waarschuwing *Meer informatie → Toch uitvoeren*. |

## Tools

De startpagina toont alle tools per categorie, met zoeken, favorieten en je laatst gebruikte tools.

**Oplossingen**
- Verdunning (C₁V₁ = C₂V₂)
- Oplossing en buffer uit een recept, met stappenschema als afbeelding
- Eenheden omrekenen (M, g/L, % w/v, ppm)
- Molmassa uit een formule (met haakjes en kristalwater)
- pH-buffer (Henderson-Hasselbalch)
- Titratiecurve (ook meerwaardige zuren, met equivalentiepunten)
- Osmolariteit, ionsterkte en normaliteit
- Kjeldahl: stikstof en ruw eiwit

**Assays**
- Standaardcurve: lineair, kwadratisch, 4PL en 5PL, met LOD en LOQ en import van een 96-wells-plaatexport
- Enzymkinetiek: activiteit uit ΔA/min, Michaelis-Menten, Lineweaver-Burk, Hanes-Woolf, remmingstype
- Spectrofotometrie: Lambert-Beer en eiwitconcentratie uit A₂₈₀ (ε uit de sequentie)
- Dosis-respons: IC₅₀/EC₅₀ met een 4PL-fit

**Microbiologie en cellen**
- Verdunningsreeks en KVE/mL
- Groeicurve en groeicurves vergelijken (gemodificeerd Gompertz-model)
- Inoculum: cultuur verdunnen naar een start-OD
- Antibiotica-gevoeligheid: MIC uit een microdilutiereeks en S/I/R uit MIC of remzone
- Telkamer en teller
- Cellen uitzaaien (plaat of fles op dichtheid inzetten)
- Microscoop-kalibratie (oculairmicrometer ijken)
- MPN (meest waarschijnlijk aantal) met betrouwbaarheidsinterval
- Sterilisatie: D-waarde, z-waarde en F₀
- Celpassageplanner (tijd tot confluent en splitratio)

**DNA en eiwit**
- DNA-kwantificatie, inclusief forensische kwantificatie (degradatie-index)
- Primers oplossen, PCR-mastermix en PCR-cyclus (Tm via nearest-neighbor)
- qPCR-analyse (ΔΔCt en Pfaffl, met import van een Ct-export) en smeltcurve-analyse
- Agarosegel en bandgrootte
- Gelfoto-editor: automatische lane- en ladderdetectie, rechtzetten, bandgrootte, densitometrie met achtergrondcorrectie, Rf, massa per band uit de massaladder, DNA- en eiwitladders
- SDS-PAGE-laadschema en western blot-normalisatie
- Ligatie, transformatie en blauw-witscreening
- RNA-kwaliteit (concentratie, zuiverheid, 28S:18S), cDNA-synthese (RT-mix) en qPCR-plaatindeling

**Forensisch**
- Forensische matchkans (Hardy-Weinberg, productregel, θ-correctie)
- STR-profielcontrole (PHR, stutter, drempels, aantal bijdragers)
- Y-STR- en mtDNA-frequentie (telmethode met bovengrens)
- Verwantschapsindex (PI, CPI, kans op vaderschap)
- Bloedvlekpatronen (inslaghoek, convergentie, hoogte van de oorsprong)
- Tijd sinds overlijden (Henssge)
- Chain of custody-formulier met barcodes

**Kwaliteit**
- Pipetkalibratie (gravimetrisch, ISO 8655)
- Westgard-regels en Levey-Jennings-kaart
- Meetonzekerheid (onzekerheidsbudget)
- Methodevalidatie (CV, terugvinding, lineariteit, LOD/LOQ)

**Data**
- Statistiek met de volledige toetsingsprocedure:
  - beschrijvende statistiek en betrouwbaarheidsinterval
  - normaliteit (Lilliefors) en uitbijters (Grubbs, Dixon)
  - t-toetsen en F-toets, Wilcoxon
  - ANOVA met Tukey, Kruskal-Wallis met Dunn, tweeweg-ANOVA
  - lineaire regressie, χ²-toets
  - steekproefgrootte (power)

**Protocollen** (afbeeldingen voor protocol en labjournaal, met eigen tekst)
- Verdunningsschema
- Pipetteerschema voor elke reactie of mengsel: volumes of stock- en eindconcentraties, automatisch aanvullen, mastermix en sjablonen (PCR, qPCR, restrictiedigest, ligatie, BSA-standaardreeks, kweekmedium)
- PCR-programma
- Gel-laadschema
- Kleuringsschema (Gram, Ziehl-Neelsen, sporen of eigen kleuring)
- GHS-etiket met pictogrammen en H- en P-zinnen

**Organisatie**
- Reagensvoorraad met waarschuwingen voor vervaldatum en minimumvoorraad
- Experimentplanner (tijdlijn, wachtstappen als timers)
- Rapport / labjournaal: invoer, uitkomsten en bronnen van meerdere tools in één afdrukbaar rapport

**Bench**
- Centrifuge (rpm ↔ × g)
- Timers met meldingen
- Plaatindeling met tekst per putje, onbeperkt groepen met eigen kleuren en paletten, ronde of vierkante putjes en export als afbeelding
- Instellingen: taal (Nederlands of Engels), thema (licht, donker, papier, hoog contrast, leisteen), dichtheid, tekstgrootte, accentkleur en kleurenpaletten

### Handig om te weten

- Elke tool heeft tags (bijvoorbeeld PCR, Eiwit, Kloneren). Klik op een tag om alle tools rond dat onderwerp te zien; de zoekbalk zoekt ook op tags.
- De app is beschikbaar in het Nederlands en het Engels (*Instellingen & updates → Taal / Language*). Bij de eerste start volgt de taal je browser of Windows. In het Engels gebruiken getallen een punt als decimaalteken, ook bij kopiëren naar Excel en in CSV-exports.
- De app controleert bij het starten of er een nieuwe versie is en meldt dat bovenaan. De web-app vernieuwt zichzelf; het Windows-programma haalt de nieuwe installer op. Uitzetten kan bij *Instellingen & updates*.
- Tabellen en grafieken kopieer je met één klik naar Excel, met decimalen in de gekozen taal. Grafieken kun je ook als afbeelding kopiëren.
- Een blok uit Excel of een plaatlezer kun je direct in een tabel plakken.
- Invoer wordt op je apparaat onthouden. Met *Sessie opslaan* bewaar je alles als bestand, eventueel onder een projectnaam.

## Validatie

Bij elke wijziging draait [`tests/validate.py`](tests/validate.py) automatisch. Het script voert gepubliceerde of onafhankelijk berekende data in via de echte interface en vergelijkt de uitkomst met de bron. Het resultaat staat per controle met bronvermelding in [`tests/VALIDATIE.md`](tests/VALIDATIE.md). Daarnaast controleert [`tests/layout_audit.py`](tests/layout_audit.py) elke tool op drie schermbreedtes op overlappende of afgesneden tekst, ook in de gegenereerde afbeeldingen, en vult [`tests/robust_audit.py`](tests/robust_audit.py) elk invoerveld met randgevallen (leeg, nul, negatief, tekst, extreem groot) om vastlopers en onzinuitvoer te vinden. [`tests/i18n_collect.py`](tests/i18n_collect.py) doorloopt alle tools in het Engels en faalt zodra er een tekst zonder vertaling verschijnt; de vertalingen staan in [`i18n/en.json`](i18n/en.json) en worden met `python tools/build_i18n.py` in de app gezet.

Referenties zijn onder meer:
- FDA BAM, NIST, Cold Spring Harbor
- NEB, Thermo Fisher, Bio-Rad, Sigma-Aldrich
- Livak en Pfaffl, Zwietering
- R-datasets en SciPy, statsmodels, scikit-posthocs en Biopython

## Zelf bouwen

```
npm install
npm run web      # web-app lokaal
npm start        # desktopversie (Tauri; vereist Rust)
npm run dist     # Windows-installer
```

Projectindeling: `web/` bevat de app (één HTML-bestand met manifest en service worker), `src-tauri/` de desktopschil, `tests/` de validatie en `.github/workflows/` de publicatie naar GitHub Pages, de Windows-build en de validatie.

## Disclaimer

Labkit is een hulpmiddel. Controleer uitkomsten altijd tegen het protocol van je practicum of laboratorium. Breekpunten, ladderwaarden en kitgegevens kunnen per versie of leverancier verschillen.
