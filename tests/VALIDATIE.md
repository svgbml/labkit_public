# Validatie Labkit BML

Automatisch gegenereerd op 2026-11-13 door `tests/validate.py`.
Elke rij voert gepubliceerde of onafhankelijk berekende data in via de interface van Labkit en vergelijkt de getoonde uitkomst met de referentie.

**Resultaat: 51 van 51 controles binnen tolerantie.**

| Tool | Dataset | Grootheid | Referentie | Labkit | Afwijking | Status | Bron |
|---|---|---|---:|---:|---:|---|---|
| Verdunning | 50X TAE naar 500 mL 1X | stock (mL) | 10 | 10 | +0.00% | ✅ | C₁V₁ = C₂V₂; 50X-stock volgens Bio-Rad Bulletin 6205 |
| Oplossing & buffer | PBS 1X, 1 L | NaCl (g) | 8 | 8,006 | +0.08% | ✅ | Cold Spring Harbor Protocols, PBS (8 g NaCl, 0,2 g KCl, 1,44 g Na₂HPO₄, 0,24 g KH₂PO₄) |
| Oplossing & buffer | PBS 1X, 1 L | KCl (g) | 0,2 | 0,2013 | +0.64% | ✅ | Cold Spring Harbor Protocols, PBS (8 g NaCl, 0,2 g KCl, 1,44 g Na₂HPO₄, 0,24 g KH₂PO₄) |
| Oplossing & buffer | PBS 1X, 1 L | Na₂HPO₄ (g) | 1,44 | 1,42 | -1.39% | ✅ | Cold Spring Harbor Protocols, PBS (8 g NaCl, 0,2 g KCl, 1,44 g Na₂HPO₄, 0,24 g KH₂PO₄) |
| Oplossing & buffer | PBS 1X, 1 L | KH₂PO₄ (g) | 0,24 | 0,245 | +2.07% | ✅ | Cold Spring Harbor Protocols, PBS (8 g NaCl, 0,2 g KCl, 1,44 g Na₂HPO₄, 0,24 g KH₂PO₄) |
| Oplossing & buffer | TBE 10X, 1 L | Tris (g) | 108 | 107,8 | -0.17% | ✅ | Bio-Rad Bulletin 6205 (108 g Tris, 55 g boorzuur per liter) |
| Oplossing & buffer | TBE 10X, 1 L | boorzuur (g) | 55 | 55,03 | +0.05% | ✅ | Bio-Rad Bulletin 6205 (108 g Tris, 55 g boorzuur per liter) |
| Standaardcurve | Bradford, kwadratisch | Lysaat A in meetbuis (µg/mL) | 468,2 | 468 | -0.04% | ✅ | Thermo Fisher NanoDrop One Bradford-protocol (BSA 0–1500 µg/mL); referentie: NumPy polyfit |
| Standaardcurve | ELISA, 4PL | terugberekend (IU/L) | 300 | 300 | +0.00% | ✅ | Kim e.a., Biol Proced Online 2018 (A = −0,00767; B = 0,942; C = 710; D = 4,17) |
| Enzymkinetiek | Puromycin (behandeld) | Vmax | 212,7 | 213 | +0.15% | ✅ | Treloar 1974 via R-dataset Puromycin (Bates & Watts 1988); referentie: SciPy curve_fit |
| Enzymkinetiek | Puromycin (behandeld) | Km (mM) | 0,06412 | 0,0641 | -0.03% | ✅ | Treloar 1974 via R-dataset Puromycin (Bates & Watts 1988); referentie: SciPy curve_fit |
| Enzymkinetiek | LDH-activiteit uit ΔA/min | U/mL | 0,3859 | 0,386 | +0.04% | ✅ | Sigma-Aldrich, Enzymatic Assay of L-Lactic Dehydrogenase (3 mL totaal, 0,1 mL enzym, ε 6,22) |
| Verdunningsreeks & KVE | FDA BAM-voorbeeld | KVE/mL | 2,441e+04 | 2,441e+04 | +0.00% | ✅ | FDA BAM hoofdstuk 3: 1:100 → 232, 244; 1:1000 → 33, 28; N = 24.409 |
| Groeicurve | Kiemgetallen E. coli | verdubbelingstijd (min) | 26,96 | 27 | +0.15% | ✅ | Microbial growth study material (KVV): log KVE 6,0–8,7 over 2–6 h, generatietijd ≈ 26 min; regressie: 26,96 min |
| Groeicurve | OD₆₀₀, twee punten in log-fase | verdubbelingstijd (min) | 30 | 30 | +0.00% | ✅ | Science Insights rekenvoorbeeld: OD 0,05 → 0,8 in 2 h, µ = 1,39 h⁻¹, t_d = 30 min |
| Groeicurve | OD₆₀₀, twee punten in log-fase | µ (h⁻¹) | 1,386 | 1,386 | +0.00% | ✅ | Science Insights rekenvoorbeeld: OD 0,05 → 0,8 in 2 h, µ = 1,39 h⁻¹, t_d = 30 min |
| Telkamer | Neubauer, erytrocyten | cellen/mL | 5,2800e+09 | 5,2800e+09 | +0.00% | ✅ | ProSciTech: 528 cellen in 5 groepsvakken (0,2 mm²), 1:200 → 5,28 × 10⁶/µL |
| Telkamer | Neubauer, leukocyten | cellen/mL | 7,8000e+06 | 7,8000e+06 | +0.00% | ✅ | ProSciTech: 156 cellen in 4 grote vakken, 1:20 → 7800/µL |
| DNA-kwantificatie | A₂₆₀ → concentratie | ng/µL | 425 | 425 | +0.00% | ✅ | Pearson rekenvoorbeeld: A₂₆₀ 0,85 bij 1:10, dsDNA → 425 ng/µL |
| DNA-kwantificatie | ng/µL → nM | nM | 75,8 | 75,8 | +0.00% | ✅ | Pearson rekenvoorbeeld: 50 ng/µL, 1000 bp → 75,8 nM |
| PCR-mastermix | NEB Taq, 25 en 50 µL | buffer (µL) | 2,5 | 2,5 | +0.00% | ✅ | NEB-protocol M0273: 2,5 / 0,5 / 0,5 / 0,5 / 0,125 µL per 25 µL; Taq 0,25 µL per 50 µL |
| PCR-mastermix | NEB Taq, 25 en 50 µL | dNTP (µL) | 0,5 | 0,5 | +0.00% | ✅ | NEB-protocol M0273: 2,5 / 0,5 / 0,5 / 0,5 / 0,125 µL per 25 µL; Taq 0,25 µL per 50 µL |
| PCR-mastermix | NEB Taq, 25 en 50 µL | primer F (µL) | 0,5 | 0,5 | +0.00% | ✅ | NEB-protocol M0273: 2,5 / 0,5 / 0,5 / 0,5 / 0,125 µL per 25 µL; Taq 0,25 µL per 50 µL |
| PCR-mastermix | NEB Taq, 25 en 50 µL | Taq 25 µL (µL) | 0,125 | 0,125 | +0.00% | ✅ | NEB-protocol M0273: 2,5 / 0,5 / 0,5 / 0,5 / 0,125 µL per 25 µL; Taq 0,25 µL per 50 µL |
| PCR-mastermix | NEB Taq, 25 en 50 µL | Taq 50 µL (µL) | 0,25 | 0,25 | +0.00% | ✅ | NEB-protocol M0273: 2,5 / 0,5 / 0,5 / 0,5 / 0,125 µL per 25 µL; Taq 0,25 µL per 50 µL |
| PCR-cyclus | Primer-Tm (nearest-neighbor) | Tm forward (°C) | 65,22 | 65,2 | -0.03% | ✅ | Biopython Tm_NN (SantaLucia 1998, 50 mM Na⁺, 1,5 mM Mg²⁺, 0,8 mM dNTP, 0,2 µM primer) |
| PCR-cyclus | Primer-Tm (nearest-neighbor) | Tm reverse (°C) | 64,15 | 64,1 | -0.08% | ✅ | Biopython Tm_NN (SantaLucia 1998, 50 mM Na⁺, 1,5 mM Mg²⁺, 0,8 mM dNTP, 0,2 µM primer) |
| PCR-cyclus | qPCR-efficiëntie uit helling | efficiëntie bij −3,80 (%) | 83,3 | 83,3 | +0.00% | ✅ | Pearson qPCR-efficiëntie: helling −3,80 → 83,3%; helling −3,3 → 100,9% |
| PCR-cyclus | qPCR-efficiëntie uit helling | efficiëntie bij −3,3 (%) | 100,9 | 100,9 | +0.00% | ✅ | Pearson qPCR-efficiëntie: helling −3,80 → 83,3%; helling −3,3 → 100,9% |
| PCR-cyclus | Amplificatie | kopieën | 4,0960e+08 | 4,1000e+08 | +0.10% | ✅ | KVV-studiemateriaal: 10⁵ × 2¹² = 4,1 × 10⁸ |
| qPCR-analyse | ΔΔCt (Livak) | fold change | 6,498 | 6,5 | +0.03% | ✅ | CASRAI rekenvoorbeeld: controle 24,0/20,0, behandeld 21,5/20,2 → 6,5× |
| qPCR-analyse | Pfaffl (efficiëntie-gecorrigeerd) | ratio | 5,856 | 5,86 | +0.07% | ✅ | CASRAI rekenvoorbeeld: E doel 1,92, E ref 1,98 → ≈ 5,9× |
| Ligatie | NEB 3:1 | insert (ng) | 30 | 30 | +0.00% | ✅ | NEB FAQ: 50 ng 5 kb-vector, 1 kb-insert, 3:1 → 30 ng insert |
| Agarosegel | 1% gel | agarose (g) | 1 | 1 | +0.00% | ✅ | miniPCR: 1 g agarose in 100 mL = 1% |
| Gelfoto-editor | Densitometrie demo-gel | lane 1 / lane 3 | 0,9444 | 0,9452 | +0.08% | ✅ | Rekentest: banden getekend met bekende sterkte (0,85 / 0,70 / 0,90 / 0,50) |
| Gelfoto-editor | Densitometrie demo-gel | lane 2 / lane 3 | 0,7778 | 0,7858 | +1.03% | ✅ | Rekentest: banden getekend met bekende sterkte (0,85 / 0,70 / 0,90 / 0,50) |
| Gelfoto-editor | Densitometrie demo-gel | lane 5 / lane 3 | 0,5556 | 0,5648 | +1.66% | ✅ | Rekentest: banden getekend met bekende sterkte (0,85 / 0,70 / 0,90 / 0,50) |
| Gelfoto-editor | Densitometrie demo-gel | bandgrootte (bp) | 650 | 652,3 | +0.35% | ✅ | Rekentest: banden getekend met bekende sterkte (0,85 / 0,70 / 0,90 / 0,50) |
| Gelfoto-editor | Demo-gel: lanen en ladder | aantal lanen | 9 | 9 | +0.00% | ✅ | Rekentest: getekende gel met 9 lanen op 77,5 px afstand (lanemidden moet binnen 5 px liggen), 100 bp-ladder, banden van 650, 350 en 58 bp |
| Gelfoto-editor | Demo-gel: lanen en ladder | lanemidden binnen 5 px | 1 | 1 | +0.00% | ✅ | Rekentest: getekende gel met 9 lanen op 77,5 px afstand (lanemidden moet binnen 5 px liggen), 100 bp-ladder, banden van 650, 350 en 58 bp |
| Gelfoto-editor | Demo-gel: lanen en ladder | band 650 bp (gem.) | 650 | 652,3 | +0.35% | ✅ | Rekentest: getekende gel met 9 lanen op 77,5 px afstand (lanemidden moet binnen 5 px liggen), 100 bp-ladder, banden van 650, 350 en 58 bp |
| Gelfoto-editor | Demo-gel: lanen en ladder | band 350 bp (gem.) | 350 | 349,7 | -0.07% | ✅ | Rekentest: getekende gel met 9 lanen op 77,5 px afstand (lanemidden moet binnen 5 px liggen), 100 bp-ladder, banden van 650, 350 en 58 bp |
| Gelfoto-editor | Demo-gel: lanen en ladder | band 58 bp (gem.) | 58 | 57,95 | -0.08% | ✅ | Rekentest: getekende gel met 9 lanen op 77,5 px afstand (lanemidden moet binnen 5 px liggen), 100 bp-ladder, banden van 650, 350 en 58 bp |
| Gelfoto-editor | Realistische testgel (scheef, smeer, lege lanen) | rechtzethoek (°) | 2 | 2 | +0.00% | ✅ | tests/make_test_gel.py: 11 lanen, 2,0° scheef, ladder in lane 1, producten 650 bp, dimeren 60 bp |
| Gelfoto-editor | Realistische testgel (scheef, smeer, lege lanen) | aantal lanen | 11 | 11 | +0.00% | ✅ | tests/make_test_gel.py: 11 lanen, 2,0° scheef, ladder in lane 1, producten 650 bp, dimeren 60 bp |
| Gelfoto-editor | Realistische testgel (scheef, smeer, lege lanen) | ladderlane (index) | 0 | 0 | +0.00% | ✅ | tests/make_test_gel.py: 11 lanen, 2,0° scheef, ladder in lane 1, producten 650 bp, dimeren 60 bp |
| Gelfoto-editor | Realistische testgel (scheef, smeer, lege lanen) | product 650 bp (gem.) | 650 | 648,8 | -0.18% | ✅ | tests/make_test_gel.py: 11 lanen, 2,0° scheef, ladder in lane 1, producten 650 bp, dimeren 60 bp |
| Gelfoto-editor | Realistische testgel (scheef, smeer, lege lanen) | aantal productbanden | 7 | 7 | +0.00% | ✅ | tests/make_test_gel.py: 11 lanen, 2,0° scheef, ladder in lane 1, producten 650 bp, dimeren 60 bp |
| Gelfoto-editor | Realistische testgel (scheef, smeer, lege lanen) | dimeer 60 bp (gem.) | 60 | 60,26 | +0.43% | ✅ | tests/make_test_gel.py: 11 lanen, 2,0° scheef, ladder in lane 1, producten 650 bp, dimeren 60 bp |
| Centrifuge | rpm → × g | × g | 1957 | 1957 | +0.00% | ✅ | Thermo Scientific Tech Tip #40: 5000 rpm, r = 7 cm → 1957 × g |
| Centrifuge | × g → rpm | rpm | 5837 | 5837 | +0.00% | ✅ | CASRAI: 4000 × g, r = 10,5 cm → 5837 rpm |

Toleranties: rekenregels 0,1–0,5%; gepubliceerde receptgrammen (afgerond in de bron) 1–3%; densitometrie op de getekende demo-gel 5%.
