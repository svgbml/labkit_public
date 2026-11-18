# Wijzigingen

Wat er per versie is veranderd. Dit bestand is de bron voor het paneel "Wat is er nieuw"
in de app: `python tools/build_changelog.py` zet het om in `tools/nt/97_news.js`.

Schrijf per versie een kopje `## <versie> — <datum>` en daaronder korte regels die met `- ` beginnen.
Elke regel is één zin in het Nederlands en heeft een vertaling nodig in `i18n/en.json`.

## Nog niet uitgebracht

- Elke tool hoort nu bij een fase van het experiment: voorbereiden, uitvoeren of analyseren.
- Tabs boven de zijbalk filteren de tools en de startpagina op die fase, met een eigen kleur per fase.
- In de kop van elke tool staat een kruimelpad van fase naar groep naar tool.
- Onder aan een tool staan de vervolgstappen die er meestal op volgen.
- Zoekresultaten en het opdrachtpalet laten nu ook de beschrijving en de tags van een tool zien.
- Je kunt maximaal zes tools vastzetten in een balk boven het werkvlak.
- Elke tool heeft een eigen pictogram in de zijbalk en op de startpagina.
- Tools met veel instellingen tonen de geavanceerde velden pas na een klik op "Meer instellingen".
- Bij het eerste bezoek loopt een korte rondleiding langs zoeken, fasen, werkstromen en instellingen.
- Na een update laat een paneel zien wat er nieuw is.

## 1.18.1 — 2026-11-16

- Labels bij de ladder in de geleditor wijken alleen nog uit voor hun directe buren.
- Labels worden niet meer afgesneden aan de rand van de afbeelding.

## 1.18.0 — 2026-11-16

- De geleditor herkent de ladder in een foto automatisch.
- Je kunt een virtuele ladder naast de gel zetten als die op de foto ontbreekt.
- De foto wordt automatisch bijgesneden tot de gel zelf.

## 1.17.0 — 2026-11-15

- De geleditor heeft zoom en een verstelbare bijsnijdkader gekregen.
- Putjes in de gel worden herkend, ook bij meerdere ladders naast elkaar.

## 1.16.0 — 2026-11-15

- Je kunt een uitkomst doorsturen naar een andere tool.
- Elke berekening heeft een link gekregen waarmee je hem terugvindt.
- Zes nieuwe modules en een reeks verbeteringen in bestaande tools.

## 1.15.0 — 2026-11-14

- Eenentwintig nieuwe tools.
- Het opdrachtpalet opent overal met Ctrl+K.
- Je kunt de invoer van een tool delen als link of QR-code.
- Ongedaan maken werkt per tool met Ctrl+Z.
- Rapporten zijn te bewaren als Word-bestand.
