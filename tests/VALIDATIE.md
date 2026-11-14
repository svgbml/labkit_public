# Validatie Labkit BML

Automatisch gegenereerd op 2026-11-14 door `tests/validate.py`.
Elke rij voert gepubliceerde of onafhankelijk berekende data in via de interface van Labkit en vergelijkt de getoonde uitkomst met de referentie.

**Resultaat: 165 van 165 controles binnen tolerantie.**

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
| Gelfoto-editor | Densitometrie demo-gel | lane 1 / lane 3 | 0,9444 | 0,9465 | +0.22% | ✅ | Rekentest: banden getekend met bekende sterkte (0,85 / 0,70 / 0,90 / 0,50) |
| Gelfoto-editor | Densitometrie demo-gel | lane 2 / lane 3 | 0,7778 | 0,7811 | +0.43% | ✅ | Rekentest: banden getekend met bekende sterkte (0,85 / 0,70 / 0,90 / 0,50) |
| Gelfoto-editor | Densitometrie demo-gel | lane 5 / lane 3 | 0,5556 | 0,5596 | +0.73% | ✅ | Rekentest: banden getekend met bekende sterkte (0,85 / 0,70 / 0,90 / 0,50) |
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
| Transformatie | Rekenvoorbeeld iGEM | kve/µg | 5,0000e+07 | 5,0000e+07 | +0.00% | ✅ | iGEM Troubleshooting Transformations: 1 µL van 0,05 ng/µL, 100 van 1000 µL uitgeplaat, 250 kolonies → 5 × 10⁷ kve/µg |
| Transformatie | Rekenvoorbeeld NEB | kve/µg | 2,0000e+06 | 2,0000e+06 | +0.00% | ✅ | NEB FAQ C2925: 100 pg pUC19, 100 van 1000 µL uitgeplaat, 20 kolonies → 2 × 10⁶ kve/µg |
| Transformatie | Rekenvoorbeeld OriGene | kve/µg | 4,0000e+08 | 4,0000e+08 | +0.00% | ✅ | OriGene, transformatieprotocol: 20 pg pUC19, 5 µL van 1 mL uitgeplaat, 40 kolonies → 4 × 10⁸ kve/µg |
| Statistiek | Gepaarde t-toets, slaapdata | t | -4,062 | -4,062 | -0.00% | ✅ | Student (1908), Cushny & Peebles; R: t.test(paired=TRUE) → t = −4,0621, p = 0,002833 |
| Statistiek | Gepaarde t-toets, slaapdata | p | 0,002833 | 0,00283 | -0.11% | ✅ | Student (1908), Cushny & Peebles; R: t.test(paired=TRUE) → t = −4,0621, p = 0,002833 |
| Statistiek | F-toets + t-toets, twee groepen | F | 1,253 | 1,253 | +0.03% | ✅ | Slaapdata; R: var.test → F = 0,7983 (1/F = 1,2526), p = 0,7427; t.test(var.equal=TRUE) → t = −1,8608, df 18, p = 0,07919 |
| Statistiek | F-toets + t-toets, twee groepen | t | -1,861 | -1,861 | +0.01% | ✅ | Slaapdata; R: var.test → F = 0,7983 (1/F = 1,2526), p = 0,7427; t.test(var.equal=TRUE) → t = −1,8608, df 18, p = 0,07919 |
| Statistiek | F-toets + t-toets, twee groepen | p | 0,07919 | 0,0792 | +0.01% | ✅ | Slaapdata; R: var.test → F = 0,7983 (1/F = 1,2526), p = 0,7427; t.test(var.equal=TRUE) → t = −1,8608, df 18, p = 0,07919 |
| Statistiek | t-toets, één steekproef | t | 1,326 | 1,326 | +0.02% | ✅ | Slaapdata middel 1 tegen 0; referentie SciPy ttest_1samp: t = 1,3257, p = 0,2176 |
| Statistiek | t-toets, één steekproef | p | 0,2176 | 0,218 | +0.18% | ✅ | Slaapdata middel 1 tegen 0; referentie SciPy ttest_1samp: t = 1,3257, p = 0,2176 |
| Statistiek | Wilcoxon-rangtekentoets | T = min(W₊, W₋) | 5 | 5 | +0.00% | ✅ | Hollander & Wolfe (depressiescores, R-voorbeeld wilcox.test): V = 40; tweezijdig p = 0,03906 |
| Statistiek | Wilcoxon-rangtekentoets | p | 0,03906 | 0,0391 | +0.10% | ✅ | Hollander & Wolfe (depressiescores, R-voorbeeld wilcox.test): V = 40; tweezijdig p = 0,03906 |
| Statistiek | Wilcoxon kritieke waarden | n = 6 | 0 | 0 | +0.00% | ✅ | Tabellenboek Statistiek, Bijlage 11 (tweezijdig, α = 0,05): n = 6 → 0, 8 → 3, 10 → 8, 12 → 13, 15 → 25 |
| Statistiek | Wilcoxon kritieke waarden | n = 8 | 3 | 3 | +0.00% | ✅ | Tabellenboek Statistiek, Bijlage 11 (tweezijdig, α = 0,05): n = 6 → 0, 8 → 3, 10 → 8, 12 → 13, 15 → 25 |
| Statistiek | Wilcoxon kritieke waarden | n = 10 | 8 | 8 | +0.00% | ✅ | Tabellenboek Statistiek, Bijlage 11 (tweezijdig, α = 0,05): n = 6 → 0, 8 → 3, 10 → 8, 12 → 13, 15 → 25 |
| Statistiek | Wilcoxon kritieke waarden | n = 12 | 13 | 13 | +0.00% | ✅ | Tabellenboek Statistiek, Bijlage 11 (tweezijdig, α = 0,05): n = 6 → 0, 8 → 3, 10 → 8, 12 → 13, 15 → 25 |
| Statistiek | Wilcoxon kritieke waarden | n = 15 | 25 | 25 | +0.00% | ✅ | Tabellenboek Statistiek, Bijlage 11 (tweezijdig, α = 0,05): n = 6 → 0, 8 → 3, 10 → 8, 12 → 13, 15 → 25 |
| Statistiek | χ²-aanpassingstoets, Mendel | χ² | 0,47 | 0,47 | +0.00% | ✅ | Mendel (1866), erwten 315/108/101/32 tegen 9:3:3:1: χ² = 0,470, df 3; SciPy chisquare p = 0,9254 |
| Statistiek | χ²-aanpassingstoets, Mendel | p | 0,9254 | 0,925 | -0.04% | ✅ | Mendel (1866), erwten 315/108/101/32 tegen 9:3:3:1: χ² = 0,470, df 3; SciPy chisquare p = 0,9254 |
| Statistiek | Grubbs, uitbijter | G | 2,469 | 2,469 | +0.01% | ✅ | NIST/SEMATECH e-Handbook 1.3.5.17.1 (8 uraniummetingen): G = 2,4687; tabel 10 n = 8 → 2,126 |
| Statistiek | Grubbs, uitbijter | G krit | 2,126 | 2,126 | +0.00% | ✅ | NIST/SEMATECH e-Handbook 1.3.5.17.1 (8 uraniummetingen): G = 2,4687; tabel 10 n = 8 → 2,126 |
| Statistiek | Grubbs, kritieke waarde berekend | n = 3 | 1,155 | 1,154 | -0.06% | ✅ | Formule NIST 1.3.5.17.1 tegen Tabellenboek Bijlage 10 (n = 3–10, α = 0,05; tabel op 3 decimalen, n = 3 exact 1,1543) |
| Statistiek | Grubbs, kritieke waarde berekend | n = 4 | 1,481 | 1,481 | +0.02% | ✅ | Formule NIST 1.3.5.17.1 tegen Tabellenboek Bijlage 10 (n = 3–10, α = 0,05; tabel op 3 decimalen, n = 3 exact 1,1543) |
| Statistiek | Grubbs, kritieke waarde berekend | n = 5 | 1,715 | 1,715 | +0.00% | ✅ | Formule NIST 1.3.5.17.1 tegen Tabellenboek Bijlage 10 (n = 3–10, α = 0,05; tabel op 3 decimalen, n = 3 exact 1,1543) |
| Statistiek | Grubbs, kritieke waarde berekend | n = 6 | 1,887 | 1,887 | +0.01% | ✅ | Formule NIST 1.3.5.17.1 tegen Tabellenboek Bijlage 10 (n = 3–10, α = 0,05; tabel op 3 decimalen, n = 3 exact 1,1543) |
| Statistiek | Grubbs, kritieke waarde berekend | n = 7 | 2,02 | 2,02 | -0.00% | ✅ | Formule NIST 1.3.5.17.1 tegen Tabellenboek Bijlage 10 (n = 3–10, α = 0,05; tabel op 3 decimalen, n = 3 exact 1,1543) |
| Statistiek | Grubbs, kritieke waarde berekend | n = 8 | 2,126 | 2,127 | +0.03% | ✅ | Formule NIST 1.3.5.17.1 tegen Tabellenboek Bijlage 10 (n = 3–10, α = 0,05; tabel op 3 decimalen, n = 3 exact 1,1543) |
| Statistiek | Grubbs, kritieke waarde berekend | n = 9 | 2,215 | 2,215 | +0.00% | ✅ | Formule NIST 1.3.5.17.1 tegen Tabellenboek Bijlage 10 (n = 3–10, α = 0,05; tabel op 3 decimalen, n = 3 exact 1,1543) |
| Statistiek | Grubbs, kritieke waarde berekend | n = 10 | 2,29 | 2,29 | -0.00% | ✅ | Formule NIST 1.3.5.17.1 tegen Tabellenboek Bijlage 10 (n = 3–10, α = 0,05; tabel op 3 decimalen, n = 3 exact 1,1543) |
| Statistiek | Dixon Q-toets | Q | 0,4545 | 0,455 | +0.11% | ✅ | Wikipedia, Dixon’s Q test (10 waarden): Q = 0,455 < 0,466 bij 95% → geen uitbijter |
| Statistiek | Dixon Q-toets | uitbijter (0 = nee) | 0 | 0 | +0.00% | ✅ | Wikipedia, Dixon’s Q test (10 waarden): Q = 0,455 < 0,466 bij 95% → geen uitbijter |
| Statistiek | Normaliteit (Lilliefors D) | D | 0,1889 | 0,189 | +0.08% | ✅ | Slaapdata middel 1; referentie statsmodels.stats.diagnostic.lilliefors |
| Statistiek | t-verdeling, kritieke waarden | df 1 | 12,71 | 12,71 | +0.00% | ✅ | Tabellenboek Statistiek, Bijlage 4 (tweezijdig α = 0,05): df 1 → 12,706; 5 → 2,571; 10 → 2,228; 30 → 2,042 |
| Statistiek | t-verdeling, kritieke waarden | df 5 | 2,571 | 2,571 | -0.02% | ✅ | Tabellenboek Statistiek, Bijlage 4 (tweezijdig α = 0,05): df 1 → 12,706; 5 → 2,571; 10 → 2,228; 30 → 2,042 |
| Statistiek | t-verdeling, kritieke waarden | df 10 | 2,228 | 2,228 | +0.01% | ✅ | Tabellenboek Statistiek, Bijlage 4 (tweezijdig α = 0,05): df 1 → 12,706; 5 → 2,571; 10 → 2,228; 30 → 2,042 |
| Statistiek | t-verdeling, kritieke waarden | df 30 | 2,042 | 2,042 | +0.01% | ✅ | Tabellenboek Statistiek, Bijlage 4 (tweezijdig α = 0,05): df 1 → 12,706; 5 → 2,571; 10 → 2,228; 30 → 2,042 |
| Statistiek | One-way ANOVA + Tukey | F | 4,846 | 4,846 | +0.00% | ✅ | R-dataset PlantGrowth (Dobson 1983); R aov/TukeyHSD: F = 4,846, p = 0,01591; trt2 − trt1 = 0,865 [0,174; 1,556], p = 0,012; trt1 − ctrl p = 0,391; trt2 − ctrl p = 0,198 |
| Statistiek | One-way ANOVA + Tukey | p | 0,01591 | 0,0159 | -0.06% | ✅ | R-dataset PlantGrowth (Dobson 1983); R aov/TukeyHSD: F = 4,846, p = 0,01591; trt2 − trt1 = 0,865 [0,174; 1,556], p = 0,012; trt1 − ctrl p = 0,391; trt2 − ctrl p = 0,198 |
| Statistiek | One-way ANOVA + Tukey | trt1 − ctrl p | 0,391 | 0,391 | +0.00% | ✅ | R-dataset PlantGrowth (Dobson 1983); R aov/TukeyHSD: F = 4,846, p = 0,01591; trt2 − trt1 = 0,865 [0,174; 1,556], p = 0,012; trt1 − ctrl p = 0,391; trt2 − ctrl p = 0,198 |
| Statistiek | One-way ANOVA + Tukey | trt2 − ctrl p | 0,198 | 0,198 | +0.00% | ✅ | R-dataset PlantGrowth (Dobson 1983); R aov/TukeyHSD: F = 4,846, p = 0,01591; trt2 − trt1 = 0,865 [0,174; 1,556], p = 0,012; trt1 − ctrl p = 0,391; trt2 − ctrl p = 0,198 |
| Statistiek | One-way ANOVA + Tukey | trt2 − trt1 verschil | 0,865 | 0,865 | +0.00% | ✅ | R-dataset PlantGrowth (Dobson 1983); R aov/TukeyHSD: F = 4,846, p = 0,01591; trt2 − trt1 = 0,865 [0,174; 1,556], p = 0,012; trt1 − ctrl p = 0,391; trt2 − ctrl p = 0,198 |
| Statistiek | One-way ANOVA + Tukey | trt2 − trt1 BI onder | 0,174 | 0,174 | +0.00% | ✅ | R-dataset PlantGrowth (Dobson 1983); R aov/TukeyHSD: F = 4,846, p = 0,01591; trt2 − trt1 = 0,865 [0,174; 1,556], p = 0,012; trt1 − ctrl p = 0,391; trt2 − ctrl p = 0,198 |
| Statistiek | One-way ANOVA + Tukey | trt2 − trt1 BI boven | 1,556 | 1,56 | +0.26% | ✅ | R-dataset PlantGrowth (Dobson 1983); R aov/TukeyHSD: F = 4,846, p = 0,01591; trt2 − trt1 = 0,865 [0,174; 1,556], p = 0,012; trt1 − ctrl p = 0,391; trt2 − ctrl p = 0,198 |
| Statistiek | One-way ANOVA + Tukey | trt2 − trt1 p | 0,012 | 0,012 | +0.00% | ✅ | R-dataset PlantGrowth (Dobson 1983); R aov/TukeyHSD: F = 4,846, p = 0,01591; trt2 − trt1 = 0,865 [0,174; 1,556], p = 0,012; trt1 − ctrl p = 0,391; trt2 − ctrl p = 0,198 |
| Statistiek | Tukey, studentized range | q krit k=3, df=27 | 3,506 | 3,506 | -0.00% | ✅ | SciPy studentized_range.ppf(0,95; k, df) als referentie |
| Statistiek | Tukey, studentized range | q krit k=4, df=12 | 4,199 | 4,199 | -0.00% | ✅ | SciPy studentized_range.ppf(0,95; k, df) als referentie |
| Statistiek | Tukey, studentized range | q krit k=5, df=30 | 4,102 | 4,102 | -0.00% | ✅ | SciPy studentized_range.ppf(0,95; k, df) als referentie |
| Standaardcurve | LOD en LOQ (lineair) | LOD | 1,122 | 1,12 | -0.18% | ✅ | ICH Q2(R2): LOD = 3,3·σ/S, LOQ = 10·σ/S met σ = reststandaardafwijking; referentie NumPy polyfit op dezelfde punten |
| Standaardcurve | LOD en LOQ (lineair) | LOQ | 3,4 | 3,4 | -0.00% | ✅ | ICH Q2(R2): LOD = 3,3·σ/S, LOQ = 10·σ/S met σ = reststandaardafwijking; referentie NumPy polyfit op dezelfde punten |
| Verdunningsschema | 1:10-reeks, 1 mL per buis | overdracht (µL) | 100 | 100 | +0.00% | ✅ | C₁V₁ = C₂V₂: overdracht V/f = 100 µL, verdunningsmiddel 900 µL; 6 buizen → 10⁻⁶ |
| Verdunningsschema | 1:10-reeks, 1 mL per buis | verdunningsmiddel (µL) | 900 | 900 | +0.00% | ✅ | C₁V₁ = C₂V₂: overdracht V/f = 100 µL, verdunningsmiddel 900 µL; 6 buizen → 10⁻⁶ |
| Pipetteerschema | Water aanvullen en mastermix | water per buis (µL) | 18,88 | 18,88 | +0.00% | ✅ | Optellen: 25 − (2,5 + 0,5 + 1 + 1 + 0,125 + 1) = 18,875 µL; mastermix 4 buizen + 10% = 4,4 × 18,875 = 83,05 µL |
| Pipetteerschema | Water aanvullen en mastermix | water NTC (µL) | 19,88 | 19,88 | +0.00% | ✅ | Optellen: 25 − (2,5 + 0,5 + 1 + 1 + 0,125 + 1) = 18,875 µL; mastermix 4 buizen + 10% = 4,4 × 18,875 = 83,05 µL |
| Pipetteerschema | Water aanvullen en mastermix | water mastermix (µL) | 83,05 | 83,05 | +0.00% | ✅ | Optellen: 25 − (2,5 + 0,5 + 1 + 1 + 0,125 + 1) = 18,875 µL; mastermix 4 buizen + 10% = 4,4 × 18,875 = 83,05 µL |
| PCR-programma | Looptijd | minuten | 77 | 77 | +0.00% | ✅ | 2:00 + 35 × (0:30 + 0:30 + 1:00) + 5:00 = 77 min |
| Statistiek | Kruskal-Wallis + Dunn | H | 7,988 | 7,988 | -0.00% | ✅ | R-dataset PlantGrowth; R kruskal.test: H = 7,988, p = 0,01842; Dunn met Bonferroni: referentie scikit-posthocs posthoc_dunn |
| Statistiek | Kruskal-Wallis + Dunn | p | 0,01842 | 0,0184 | -0.11% | ✅ | R-dataset PlantGrowth; R kruskal.test: H = 7,988, p = 0,01842; Dunn met Bonferroni: referentie scikit-posthocs posthoc_dunn |
| Statistiek | Kruskal-Wallis + Dunn | Dunn trt1 − ctrl | 0,7911 | 0,791 | -0.01% | ✅ | R-dataset PlantGrowth; R kruskal.test: H = 7,988, p = 0,01842; Dunn met Bonferroni: referentie scikit-posthocs posthoc_dunn |
| Statistiek | Kruskal-Wallis + Dunn | Dunn trt2 − ctrl | 0,2735 | 0,273 | -0.18% | ✅ | R-dataset PlantGrowth; R kruskal.test: H = 7,988, p = 0,01842; Dunn met Bonferroni: referentie scikit-posthocs posthoc_dunn |
| Statistiek | Kruskal-Wallis + Dunn | Dunn trt2 − trt1 | 0,015 | 0,015 | -0.01% | ✅ | R-dataset PlantGrowth; R kruskal.test: H = 7,988, p = 0,01842; Dunn met Bonferroni: referentie scikit-posthocs posthoc_dunn |
| Standaardcurve | ELISA, 5PL | terugberekend | 300 | 300 | +0.00% | ✅ | Rekentest: standaarden berekend met A = 0,05; B = 1,3; C = 400; D = 3,2; E = 0,6 (asymmetrisch, Gottschalk & Dunn 2005); monster x = 300 moet terugkomen |
| Standaardcurve | Plaatlezer-import | standaarden | 8 | 8 | +0.00% | ✅ | Rekentest: plaatblok met standaarden in kolom 1–2 (A–H = 0…1500) en monsters in duplo; resultaat gelijk aan dezelfde waarden handmatig invoeren |
| Standaardcurve | Plaatlezer-import | monsters | 8 | 8 | +0.00% | ✅ | Rekentest: plaatblok met standaarden in kolom 1–2 (A–H = 0…1500) en monsters in duplo; resultaat gelijk aan dezelfde waarden handmatig invoeren |
| Standaardcurve | Plaatlezer-import | monster A3–A4 | 236,8 | 237 | +0.08% | ✅ | Rekentest: plaatblok met standaarden in kolom 1–2 (A–H = 0…1500) en monsters in duplo; resultaat gelijk aan dezelfde waarden handmatig invoeren |
| Gelfoto-editor | Achtergrondcorrectie | dal tot dal | 1003 | 1001 | -0.21% | ✅ | Rekentest: profiel met schuine achtergrond (10 → 40) en een gaussische band (hoogte 100, σ 4 px, oppervlak 1002,7) |
| Gelfoto-editor | Achtergrondcorrectie | rolling ball | 1003 | 986,9 | -1.57% | ✅ | Rekentest: profiel met schuine achtergrond (10 → 40) en een gaussische band (hoogte 100, σ 4 px, oppervlak 1002,7) |
| Gelfoto-editor | Rf-waarde | Rf | 0,5 | 0,5 | +0.00% | ✅ | Rf = looplengte vanaf slotje / afstand slotje–front; front op 400 px, band op 200 px, geen slotjesrij → 0,5 |
| Statistiek | Tweeweg-ANOVA | F medium | 1612 | 1612 | +0.00% | ✅ | Voorbeelddata (2 × 2, n = 4); referentie statsmodels ols + anova_lm (type 2) |
| Statistiek | Tweeweg-ANOVA | F temperatuur | 393,5 | 393,5 | +0.00% | ✅ | Voorbeelddata (2 × 2, n = 4); referentie statsmodels ols + anova_lm (type 2) |
| Statistiek | Tweeweg-ANOVA | F interactie | 99,32 | 99,32 | -0.00% | ✅ | Voorbeelddata (2 × 2, n = 4); referentie statsmodels ols + anova_lm (type 2) |
| Statistiek | Lineaire regressie | helling | 0,5001 | 0,5001 | +0.00% | ✅ | Anscombe (1973), dataset I: helling 0,5001, intercept 3,0001, R² 0,6665; SE helling via SciPy linregress |
| Statistiek | Lineaire regressie | intercept | 3 | 3 | -0.00% | ✅ | Anscombe (1973), dataset I: helling 0,5001, intercept 3,0001, R² 0,6665; SE helling via SciPy linregress |
| Statistiek | Lineaire regressie | SE helling | 0,1179 | 0,118 | +0.08% | ✅ | Anscombe (1973), dataset I: helling 0,5001, intercept 3,0001, R² 0,6665; SE helling via SciPy linregress |
| Statistiek | Steekproefgrootte (power) | n per groep | 64 | 64 | +0.00% | ✅ | statsmodels TTestIndPower/TTestPower: d = 0,5, α = 0,05 tweezijdig, power 80% → 63,8 → 64 per groep; één steekproef 33,4 → 34 |
| Statistiek | Steekproefgrootte (power) | n (één steekproef) | 34 | 34 | +0.00% | ✅ | statsmodels TTestIndPower/TTestPower: d = 0,5, α = 0,05 tweezijdig, power 80% → 63,8 → 64 per groep; één steekproef 33,4 → 34 |
| Antibiotica-gevoeligheid | MIC en S/I/R | MIC (mg/L) | 4 | 4 | +0.00% | ✅ | Rekentest: reeks 64 → 0,125 mg/L (factor 2); eerste groei in put 6 → MIC = 4 mg/L; S ≤ 8 → S. Zone 15 mm met S ≥ 20, R < 17 → R |
| Antibiotica-gevoeligheid | MIC en S/I/R | interpretatie S (1 = ja) | 1 | 1 | +0.00% | ✅ | Rekentest: reeks 64 → 0,125 mg/L (factor 2); eerste groei in put 6 → MIC = 4 mg/L; S ≤ 8 → S. Zone 15 mm met S ≥ 20, R < 17 → R |
| Antibiotica-gevoeligheid | MIC en S/I/R | zone 15 mm → R (1 = ja) | 1 | 1 | +0.00% | ✅ | Rekentest: reeks 64 → 0,125 mg/L (factor 2); eerste groei in put 6 → MIC = 4 mg/L; S ≤ 8 → S. Zone 15 mm met S ≥ 20, R < 17 → R |
| Groeicurves vergelijken | Gompertz-fit | µm | 0,8 | 0,8 | +0.00% | ✅ | Rekentest: data berekend met A = 3,5; µm = 0,8 h⁻¹; λ = 2 h (Zwietering 1990) moeten terugkomen |
| Groeicurves vergelijken | Gompertz-fit | lag λ | 2 | 2 | +0.00% | ✅ | Rekentest: data berekend met A = 3,5; µm = 0,8 h⁻¹; λ = 2 h (Zwietering 1990) moeten terugkomen |
| Groeicurves vergelijken | Gompertz-fit | A | 3,5 | 3,5 | +0.00% | ✅ | Rekentest: data berekend met A = 3,5; µm = 0,8 h⁻¹; λ = 2 h (Zwietering 1990) moeten terugkomen |
| Western blot-normalisatie | Relatieve expressie | behandeling 1 | 2,006 | 2,006 | +0.00% | ✅ | Rekentest voorbeelddata: (31500/30800 + 29800/29900)/2 gedeeld door controle-gemiddelde (15200/30100 + 14800/29500)/2 |
| qPCR-smeltcurve | Tm-bepaling | Tm monster 1 | 84,5 | 84,5 | +0.00% | ✅ | Rekentest: smeltcurven berekend met Tm 84,5 °C en een dimeerpiek bij 76,0 °C (stap 0,5 °C) |
| qPCR-smeltcurve | Tm-bepaling | dimeerpiek monster 2 | 76 | 76 | +0.00% | ✅ | Rekentest: smeltcurven berekend met Tm 84,5 °C en een dimeerpiek bij 76,0 °C (stap 0,5 °C) |
| qPCR-analyse | Ct-export inlezen | fold change gevonden (1 = ja) | 1 | 1 | +0.00% | ✅ | CASRAI-rekenvoorbeeld als export (Sample/Target/Cq): controle 24,0/20,0, behandeld 21,5/20,2 → 6,5× |
| Gelfoto-editor | Massa per band | som ladder (ng) | 502 | 502 | +0.00% | ✅ | NEB 100 bp DNA Ladder (N3231), 0,5 µg per laan: 1517–100 bp = 45, 35, 95, 27, 24, 21, 18, 97, 38, 29, 25, 48 ng (som 502 ng) |
| Spectrofotometrie | NADH, Lambert-Beer | mM | 0,05 | 0,05 | +0.00% | ✅ | Sigma-Aldrich: ε₃₄₀ NADH = 6220 M⁻¹·cm⁻¹; A = 0,311 bij 1 cm → 0,0500 mM |
| Spectrofotometrie | ε₂₈₀ volgens Pace | ε₂₈₀ | 4,292e+04 | 4,292e+04 | +0.00% | ✅ | Pace e.a. 1995: ε = 5500·W + 1490·Y + 125·cystines; 2 W, 20 Y, 17 S–S → 11 000 + 29 800 + 2125 = 42 925 M⁻¹·cm⁻¹ |
| Eenheden omrekenen | Fysiologisch zout | mM | 154 | 154 | +0.00% | ✅ | 0,9% NaCl (58,44 g/mol) = 9 g/L = 154 mmol/L |
| Inoculum | Start-OD | mL cultuur | 1,613 | 1,613 | +0.01% | ✅ | C₁V₁ = C₂V₂: (1,6 − 0,05) × 1 → OD 1,55; 0,05 × 50 mL / 1,55 = 1,613 mL cultuur |
| Molmassa | Formules met kristalwater en haakjes | NaCl | 58,44 | 58,44 | +0.00% | ✅ | Sigma-Aldrich productspecificaties: NaCl 58,44; Na₂HPO₄·7H₂O 268,07; EDTA-Na₂·2H₂O 372,24; Ca(OH)₂ 74,09 g/mol |
| Molmassa | Formules met kristalwater en haakjes | Na2HPO4·7H2O | 268,1 | 268,1 | -0.00% | ✅ | Sigma-Aldrich productspecificaties: NaCl 58,44; Na₂HPO₄·7H₂O 268,07; EDTA-Na₂·2H₂O 372,24; Ca(OH)₂ 74,09 g/mol |
| Molmassa | Formules met kristalwater en haakjes | C10H14N2Na2O8.2H2O | 372,2 | 372,2 | +0.00% | ✅ | Sigma-Aldrich productspecificaties: NaCl 58,44; Na₂HPO₄·7H₂O 268,07; EDTA-Na₂·2H₂O 372,24; Ca(OH)₂ 74,09 g/mol |
| Molmassa | Formules met kristalwater en haakjes | Ca(OH)2 | 74,09 | 74,09 | +0.00% | ✅ | Sigma-Aldrich productspecificaties: NaCl 58,44; Na₂HPO₄·7H₂O 268,07; EDTA-Na₂·2H₂O 372,24; Ca(OH)₂ 74,09 g/mol |
| pH-buffer | Henderson-Hasselbalch | base : zuur | 1,738 | 1,74 | +0.13% | ✅ | pH = pKₐ + log([base]/[zuur]): acetaat pKₐ 4,76 bij pH 5,00 → 10^0,24 = 1,738; fosfaat pKₐ 7,20 bij pH 7,40 → 61,3% base |
| pH-buffer | Henderson-Hasselbalch | % basevorm | 61,31 | 61,3 | -0.02% | ✅ | pH = pKₐ + log([base]/[zuur]): acetaat pKₐ 4,76 bij pH 5,00 → 10^0,24 = 1,738; fosfaat pKₐ 7,20 bij pH 7,40 → 61,3% base |
| Forensische matchkans | Productregel met θ | matchkans | 0,000436 | 0,000436 | +0.00% | ✅ | NRC II (1996) 4.1: het. 2pq = 2·0,1·0,2 = 0,04; hom. p² + p(1−p)θ = 0,01 + 0,1·0,9·0,01 = 0,0109; product 4,36 × 10⁻⁴ → 1 op 2294 |
| Updates | Versievergelijking | 1.10.0 t.o.v. 1.9.0 | 1 | 1 | +0.00% | ✅ | Semantische versies: 1.10.0 > 1.9.0, 1.9.0 = 1.9.0, 1.9.1 < 1.10.0 |
| Updates | Versievergelijking | gelijk | 0 | 0 | +0.00% | ✅ | Semantische versies: 1.10.0 > 1.9.0, 1.9.0 = 1.9.0, 1.9.1 < 1.10.0 |
| Updates | Versievergelijking | 1.9.1 t.o.v. 1.10.0 | -1 | -1 | -0.00% | ✅ | Semantische versies: 1.10.0 > 1.9.0, 1.9.0 = 1.9.0, 1.9.1 < 1.10.0 |
| Instellingen | Tekstkleur op achtergrond | geel → donkere tekst | 1 | 1 | +0.00% | ✅ | WCAG relatieve luminantie: donkere tekst op lichtgeel (#F0E442), witte tekst op donkerblauw (#1558b0) |
| Instellingen | Tekstkleur op achtergrond | blauw → witte tekst | 1 | 1 | +0.00% | ✅ | WCAG relatieve luminantie: donkere tekst op lichtgeel (#F0E442), witte tekst op donkerblauw (#1558b0) |
| Updates | Melding bij nieuwere release | melding bij v99.0.0 | 1 | 1 | +0.00% | ✅ | Nagebootst GitHub-antwoord (releases/latest) met tag v99.0.0 en met de huidige versie |
| Updates | Melding bij nieuwere release | geen melding bij gelijke versie | 1 | 1 | +0.00% | ✅ | Nagebootst GitHub-antwoord (releases/latest) met tag v99.0.0 en met de huidige versie |
| Cellen uitzaaien | 24-wellsplaat | mL suspensie | 1,65 | 1,65 | +0.00% | ✅ | Rekentest: 5 × 10⁴ cellen × 24 putjes × 1,1 = 1,32 × 10⁶ cellen; bij 8 × 10⁵ cellen/mL → 1,65 mL suspensie in 13,2 mL totaal |
| Primers oplossen | Stock 100 µM | µL buffer | 284 | 284 | +0.00% | ✅ | IDT: V (µL) = nmol / µM × 1000 → 28,4 nmol in 284 µL; werkoplossing 10 µM, 100 µL → 10 µL stock |
| Primers oplossen | Stock 100 µM | µL stock | 10 | 10 | +0.00% | ✅ | IDT: V (µL) = nmol / µM × 1000 → 28,4 nmol in 284 µL; werkoplossing 10 µM, 100 µL → 10 µL stock |
| SDS-PAGE monsters | Laadschema | monster | 8,33 | 8,33 | +0.00% | ✅ | Rekentest: 20 µg van 2,4 µg/µL = 8,33 µL; 4× buffer in 20 µL = 5 µL; water 6,67 µL |
| SDS-PAGE monsters | Laadschema | buffer | 5 | 5 | +0.00% | ✅ | Rekentest: 20 µg van 2,4 µg/µL = 8,33 µL; 4× buffer in 20 µL = 5 µL; water 6,67 µL |
| SDS-PAGE monsters | Laadschema | water | 6,67 | 6,67 | +0.00% | ✅ | Rekentest: 20 µg van 2,4 µg/µL = 8,33 µL; 4× buffer in 20 µL = 5 µL; water 6,67 µL |
| Microscoop-kalibratie | IJkfactor | µm per schaaldeel | 2,5 | 2,5 | +0.00% | ✅ | Nikon MicroscopyU: 40 oculairdelen = 10 objectdelen van 10 µm → 2,5 µm per deel; gezichtsveld FN 20 / 40× = 500 µm |
| Microscoop-kalibratie | IJkfactor | gezichtsveld (µm) | 500 | 500 | +0.00% | ✅ | Nikon MicroscopyU: 40 oculairdelen = 10 objectdelen van 10 µm → 2,5 µm per deel; gezichtsveld FN 20 / 40× = 500 µm |
| Plaatindeling | Groepen toevoegen | groepen erbij | 6 | 6 | +0.00% | ✅ | Vier keer een kleur toevoegen geeft 8 groepen met 8 verschillende kleuren |
| Plaatindeling | Groepen toevoegen | unieke kleuren | 10 | 10 | +0.00% | ✅ | Vier keer een kleur toevoegen geeft 8 groepen met 8 verschillende kleuren |

Toleranties: rekenregels 0,1–0,5%; gepubliceerde receptgrammen (afgerond in de bron) 1–3%; densitometrie op de getekende demo-gel 5%.
