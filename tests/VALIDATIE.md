# Validatie Labkit BML

Automatisch gegenereerd op 2026-11-13 door `tests/validate.py`.
Elke rij voert gepubliceerde of onafhankelijk berekende data in via de interface van Labkit en vergelijkt de getoonde uitkomst met de referentie.

**Resultaat: 106 van 106 controles binnen tolerantie.**

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
| Gelfoto-editor | Densitometrie demo-gel | lane 1 / lane 3 | 0,9444 | 0,9442 | -0.03% | ✅ | Rekentest: banden getekend met bekende sterkte (0,85 / 0,70 / 0,90 / 0,50) |
| Gelfoto-editor | Densitometrie demo-gel | lane 2 / lane 3 | 0,7778 | 0,7823 | +0.58% | ✅ | Rekentest: banden getekend met bekende sterkte (0,85 / 0,70 / 0,90 / 0,50) |
| Gelfoto-editor | Densitometrie demo-gel | lane 5 / lane 3 | 0,5556 | 0,5616 | +1.09% | ✅ | Rekentest: banden getekend met bekende sterkte (0,85 / 0,70 / 0,90 / 0,50) |
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

Toleranties: rekenregels 0,1–0,5%; gepubliceerde receptgrammen (afgerond in de bron) 1–3%; densitometrie op de getekende demo-gel 5%.
