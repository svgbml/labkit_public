# Validatie Labkit BML

Automatisch gegenereerd op 2026-11-21 door `tests/validate.py`.
Elke rij voert gepubliceerde of onafhankelijk berekende data in via de interface van Labkit en vergelijkt de getoonde uitkomst met de referentie.

**Resultaat: 286 van 286 controles binnen tolerantie.**

| Tool | Dataset | Grootheid | Referentie | Labkit | Afwijking | Status | Bron |
|---|---|---|---:|---:|---:|---|---|
| Verdunning | 50X TAE naar 500 mL 1X | stock (mL) | 10 | 10 | +0.00% | ✅ | C₁V₁ = C₂V₂; 50X-stock volgens Bio-Rad Bulletin 6205 |
| Oplossing & buffer | PBS 1X, 1 L | NaCl (g) | 8 | 8,006 | +0.08% | ✅ | Cold Spring Harbor Protocols, PBS (8 g NaCl, 0,2 g KCl, 1,44 g Na₂HPO₄, 0,24 g KH₂PO₄) |
| Oplossing & buffer | PBS 1X, 1 L | KCl (g) | 0,2 | 0,2013 | +0.64% | ✅ | Cold Spring Harbor Protocols, PBS (8 g NaCl, 0,2 g KCl, 1,44 g Na₂HPO₄, 0,24 g KH₂PO₄) |
| Oplossing & buffer | PBS 1X, 1 L | Na₂HPO₄ (g) | 1,44 | 1,42 | -1.39% | ✅ | Cold Spring Harbor Protocols, PBS (8 g NaCl, 0,2 g KCl, 1,44 g Na₂HPO₄, 0,24 g KH₂PO₄) |
| Oplossing & buffer | PBS 1X, 1 L | KH₂PO₄ (g) | 0,24 | 0,245 | +2.07% | ✅ | Cold Spring Harbor Protocols, PBS (8 g NaCl, 0,2 g KCl, 1,44 g Na₂HPO₄, 0,24 g KH₂PO₄) |
| Oplossing & buffer | TBE 10X, 1 L | Tris (g) | 108 | 107,8 | -0.17% | ✅ | Bio-Rad Bulletin 6205 (108 g Tris, 55 g boorzuur per liter) |
| Oplossing & buffer | TBE 10X, 1 L | boorzuur (g) | 55 | 55,03 | +0.05% | ✅ | Bio-Rad Bulletin 6205 (108 g Tris, 55 g boorzuur per liter) |
| Oplossing & buffer | TAE 50X, 1 L | Tris (g) | 242,3 | 242,3 | +0.00% | ✅ | Sambrook & Russell, Molecular Cloning (3e druk), Appendix 1: 242 g Tris-base en 18,6 g EDTA-Na₂·2H₂O (= 50 mM) per liter 50x TAE |
| Oplossing & buffer | TAE 50X, 1 L | EDTA-Na₂·2H₂O (g) | 18,61 | 18,61 | +0.01% | ✅ | Sambrook & Russell, Molecular Cloning (3e druk), Appendix 1: 242 g Tris-base en 18,6 g EDTA-Na₂·2H₂O (= 50 mM) per liter 50x TAE |
| Oplossing & buffer | Tris-glycine-SDS 10X, 1 L | Tris (g) | 30,3 | 30,29 | -0.05% | ✅ | Laemmli, Nature 227:680-685 (1970), 10x voorraad: 30,3 g Tris, 144 g glycine en 10 g SDS per liter |
| Oplossing & buffer | Tris-glycine-SDS 10X, 1 L | glycine (g) | 144,1 | 144,1 | +0.02% | ✅ | Laemmli, Nature 227:680-685 (1970), 10x voorraad: 30,3 g Tris, 144 g glycine en 10 g SDS per liter |
| Oplossing & buffer | Tris-glycine-SDS 10X, 1 L | SDS (g) | 10 | 10 | +0.00% | ✅ | Laemmli, Nature 227:680-685 (1970), 10x voorraad: 30,3 g Tris, 144 g glycine en 10 g SDS per liter |
| Oplossing & buffer | SOC-medium, 1 L | trypton (g) | 20 | 20 | +0.00% | ✅ | Hanahan, J Mol Biol 166:557-580 (1983): 20 g trypton, 5 g gistextract, 0,58 g NaCl (10 mM), 3,6 g glucose (20 mM) per liter |
| Oplossing & buffer | SOC-medium, 1 L | gistextract (g) | 5 | 5 | +0.00% | ✅ | Hanahan, J Mol Biol 166:557-580 (1983): 20 g trypton, 5 g gistextract, 0,58 g NaCl (10 mM), 3,6 g glucose (20 mM) per liter |
| Oplossing & buffer | SOC-medium, 1 L | NaCl (g) | 0,5844 | 0,5844 | +0.00% | ✅ | Hanahan, J Mol Biol 166:557-580 (1983): 20 g trypton, 5 g gistextract, 0,58 g NaCl (10 mM), 3,6 g glucose (20 mM) per liter |
| Oplossing & buffer | SOC-medium, 1 L | glucose (g) | 3,603 | 3,603 | +0.00% | ✅ | Hanahan, J Mol Biol 166:557-580 (1983): 20 g trypton, 5 g gistextract, 0,58 g NaCl (10 mM), 3,6 g glucose (20 mM) per liter |
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
| Gelfoto-editor | Densitometrie demo-gel | lane 1 / lane 3 | 0,9444 | 0,9434 | -0.11% | ✅ | Rekentest: banden getekend met bekende sterkte (0,85 / 0,70 / 0,90 / 0,50) |
| Gelfoto-editor | Densitometrie demo-gel | lane 2 / lane 3 | 0,7778 | 0,7756 | -0.27% | ✅ | Rekentest: banden getekend met bekende sterkte (0,85 / 0,70 / 0,90 / 0,50) |
| Gelfoto-editor | Densitometrie demo-gel | lane 5 / lane 3 | 0,5556 | 0,569 | +2.42% | ✅ | Rekentest: banden getekend met bekende sterkte (0,85 / 0,70 / 0,90 / 0,50) |
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
| Pipetteerschema | PCR: water aanvullen en mastermix | water per buis (µL) | 18,88 | 18,88 | +0.00% | ✅ | C₁V₁ = C₂V₂: buffer 10X→1X = 2,5 µL, dNTP 10→0,2 mM = 0,5 µL, primers 10→0,4 µM = 1 µL; water 25 − (2,5 + 0,5 + 1 + 1 + 0,125 + 1) = 18,875 µL; mastermix 4 buizen + 10% = 4,4 × 18,875 = 83,05 µL |
| Pipetteerschema | PCR: water aanvullen en mastermix | water NTC (µL) | 19,88 | 19,88 | +0.00% | ✅ | C₁V₁ = C₂V₂: buffer 10X→1X = 2,5 µL, dNTP 10→0,2 mM = 0,5 µL, primers 10→0,4 µM = 1 µL; water 25 − (2,5 + 0,5 + 1 + 1 + 0,125 + 1) = 18,875 µL; mastermix 4 buizen + 10% = 4,4 × 18,875 = 83,05 µL |
| Pipetteerschema | PCR: water aanvullen en mastermix | water mastermix (µL) | 83,05 | 83,05 | +0.00% | ✅ | C₁V₁ = C₂V₂: buffer 10X→1X = 2,5 µL, dNTP 10→0,2 mM = 0,5 µL, primers 10→0,4 µM = 1 µL; water 25 − (2,5 + 0,5 + 1 + 1 + 0,125 + 1) = 18,875 µL; mastermix 4 buizen + 10% = 4,4 × 18,875 = 83,05 µL |
| Pipetteerschema | PCR: water aanvullen en mastermix | buffer 10X→1X (µL) | 2,5 | 2,5 | +0.00% | ✅ | C₁V₁ = C₂V₂: buffer 10X→1X = 2,5 µL, dNTP 10→0,2 mM = 0,5 µL, primers 10→0,4 µM = 1 µL; water 25 − (2,5 + 0,5 + 1 + 1 + 0,125 + 1) = 18,875 µL; mastermix 4 buizen + 10% = 4,4 × 18,875 = 83,05 µL |
| Pipetteerschema | BSA-standaardreeks uit eindconcentraties | BSA voor 1500 µg/mL (µL) | 75 | 75 | +0.00% | ✅ | Pierce BCA-handleiding (2000 µg/mL stock): V = C × 100 µL / 2000; 1500 µg/mL → 75 µL BSA + 25 µL verdunningsmiddel; 125 µg/mL → 6,25 µL |
| Pipetteerschema | BSA-standaardreeks uit eindconcentraties | verdunningsmiddel (µL) | 25 | 25 | +0.00% | ✅ | Pierce BCA-handleiding (2000 µg/mL stock): V = C × 100 µL / 2000; 1500 µg/mL → 75 µL BSA + 25 µL verdunningsmiddel; 125 µg/mL → 6,25 µL |
| Pipetteerschema | BSA-standaardreeks uit eindconcentraties | BSA voor 125 µg/mL (µL) | 6,25 | 6,25 | +0.00% | ✅ | Pierce BCA-handleiding (2000 µg/mL stock): V = C × 100 µL / 2000; 1500 µg/mL → 75 µL BSA + 25 µL verdunningsmiddel; 125 µg/mL → 6,25 µL |
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
| MPN | 3-buizenreeks 3-1-0 | MPN per g | 43 | 43 | +0.00% | ✅ | FDA BAM Appendix 2, tabel 1 (0,1/0,01/0,001 g): 3-1-0 → 43 MPN/g |
| MPN | 3-buizenreeks 2-1-0 | MPN per g | 15 | 15 | +0.00% | ✅ | FDA BAM Appendix 2, tabel 1: 2-1-0 → 15 MPN/g |
| Titratiecurve | 25 mL 0,1 M azijnzuur met 0,1 M NaOH | pH start | 2,88 | 2,88 | +0.00% | ✅ | Harris, Quantitative Chemical Analysis: pH start 2,88; ½-eq = pKₐ 4,76; equivalentiepunt 8,72 |
| Titratiecurve | 25 mL 0,1 M azijnzuur met 0,1 M NaOH | pH ½-equivalentie | 4,76 | 4,76 | +0.00% | ✅ | Harris, Quantitative Chemical Analysis: pH start 2,88; ½-eq = pKₐ 4,76; equivalentiepunt 8,72 |
| Titratiecurve | 25 mL 0,1 M azijnzuur met 0,1 M NaOH | pH equivalentiepunt | 8,72 | 8,73 | +0.11% | ✅ | Harris, Quantitative Chemical Analysis: pH start 2,88; ½-eq = pKₐ 4,76; equivalentiepunt 8,72 |
| Kjeldahl | Melk, factor 6,38 | % eiwit | 13,55 | 13,55 | +0.01% | ✅ | AOAC 991.20: %N = 1,4007·c·(V−Vb)/m → 1,4007·0,1·15,2/1,0025 = 2,1237%; eiwit ×6,38 = 13,549% |
| Osmolariteit & ionsterkte | Fysiologisch zout 154 mM NaCl | mOsm/L | 308 | 308 | +0.00% | ✅ | Ideale osmolariteit 2 × 154 = 308 mOsm/L; ionsterkte ½(154·1 + 154·1) = 154 mM |
| Osmolariteit & ionsterkte | Fysiologisch zout 154 mM NaCl | ionsterkte (mM) | 154 | 154 | +0.00% | ✅ | Ideale osmolariteit 2 × 154 = 308 mOsm/L; ionsterkte ½(154·1 + 154·1) = 154 mM |
| Verwantschapsindex | Trio, obligaat allel | PI heterozygote vader | 2,5 | 2,5 | +0.00% | ✅ | Butler (2015) hfst. 15: vader heterozygoot voor obligaat allel → PI = 1/(2p); homozygoot → 1/p; CPI = product |
| Verwantschapsindex | Trio, obligaat allel | PI homozygote vader | 5,882 | 5,882 | -0.01% | ✅ | Butler (2015) hfst. 15: vader heterozygoot voor obligaat allel → PI = 1/(2p); homozygoot → 1/p; CPI = product |
| Verwantschapsindex | Trio, obligaat allel | CPI | 14,71 | 14,7 | -0.04% | ✅ | Butler (2015) hfst. 15: vader heterozygoot voor obligaat allel → PI = 1/(2p); homozygoot → 1/p; CPI = product |
| Y-STR / mtDNA-frequentie | Niet waargenomen in 4500 | bovengrens | 0,0006655 | 0,000665 | -0.07% | ✅ | SWGDAM Y-STR-richtlijnen: bovengrens 1 − 0,05^(1/N) = 6,655 × 10⁻⁴ |
| Bloedvlekpatronen | Inslaghoek | α vlek a (°) | 30 | 30 | +0.00% | ✅ | Balthazard: arcsin(5/10) = 30°; arcsin(2,6/5,9) = 26,1° |
| Bloedvlekpatronen | Inslaghoek | α vlek b (°) | 26,15 | 26,1 | -0.18% | ✅ | Balthazard: arcsin(5/10) = 30°; arcsin(2,6/5,9) = 26,1° |
| Tijd sinds overlijden | Henssge, T_a 18 °C | PMI (h) | 11 | 11 | -0.01% | ✅ | Onafhankelijk opgelost met SciPy brentq uit de Henssge-vergelijking (Henssge & Madea 2004): T_r 30,5 °C, 75 kg, CF 1 |
| Pipetkalibratie | INTEGRA-rekenvoorbeeld | gemiddeld volume (µL) | 100,5 | 100,5 | +0.00% | ✅ | INTEGRA, Calibration check: volumes 100,40/100,42/100,43/100,54/100,47 µL → V̄ 100,452 µL, e_s 0,45% |
| Pipetkalibratie | INTEGRA-rekenvoorbeeld | e_s (%) | 0,45 | 0,45 | +0.00% | ✅ | INTEGRA, Calibration check: volumes 100,40/100,42/100,43/100,54/100,47 µL → V̄ 100,452 µL, e_s 0,45% |
| Dosis-respons (IC50/EC50) | 4PL zonder ruis | IC50 | 3 | 3 | +0.00% | ✅ | Data berekend uit y = 0,05 + 0,95/(1 + (x/3)^1,2): de fit moet IC50 = 3 teruggeven |
| Sterilisatie (D, z, F₀) | F₀ van 15 min op 121,1 °C | F₀ (min) | 15 | 15 | +0.00% | ✅ | Ph. Eur. 5.1.5: F₀ = Δt·Σ10^((T−121,1)/10) = 15 min; D uit log-lineaire overleving met D = 2,5 min |
| Sterilisatie (D, z, F₀) | F₀ van 15 min op 121,1 °C | D-waarde (min) | 2,5 | 2,5 | +0.00% | ✅ | Ph. Eur. 5.1.5: F₀ = Δt·Σ10^((T−121,1)/10) = 15 min; D uit log-lineaire overleving met D = 2,5 min |
| RNA-kwaliteit | Concentratie | ng/µL | 400 | 400 | +0.00% | ✅ | Thermo Fisher T042: c = A260 × 40 × verdunning = 0,5 × 40 × 20 = 400 ng/µL |
| cDNA-synthese (RT-mix) | RNA-volume en mix | RNA monster A (µL) | 2,427 | 2,43 | +0.12% | ✅ | High-Capacity cDNA RT Kit: 1000 ng uit 412 ng/µL = 2,427 µL; 2× mix per reactie 10 µL, 5 reacties + 10% = 55 µL |
| cDNA-synthese (RT-mix) | RNA-volume en mix | mastermix (µL) | 55 | 55 | +0.00% | ✅ | High-Capacity cDNA RT Kit: 1000 ng uit 412 ng/µL = 2,427 µL; 2× mix per reactie 10 µL, 5 reacties + 10% = 55 µL |
| Celpassageplanner | Splitsing 1:4 | uren tot confluent | 60 | 60 | +0.00% | ✅ | N = N₀·2^(t/t_d): 1:4 bij t_d 24 h → 48 h + 12 h herstel = 2 d 12 u |
| Meetonzekerheid | Relatieve onzekerheid | u_c,rel (%) | 0,2907 | 0,291 | +0.10% | ✅ | GUM/QUAM: √((0,0005/5,844)² + (0,005/√3/0,995)² + (0,4/√6/1000)²) = 0,2914% |
| STR-profielcontrole | Piekhoogteverhouding | PHR (%) | 47,54 | 48 | +0.97% | ✅ | PHR = laagste/hoogste piek: 290/610 = 47,5%; 2 bijdragers bij 4 allelen |
| STR-profielcontrole | Piekhoogteverhouding | min. bijdragers | 2 | 2 | +0.00% | ✅ | PHR = laagste/hoogste piek: 290/610 = 47,5%; 2 bijdragers bij 4 allelen |
| qPCR-plaatindeling | Aantal wells | wells gebruikt | 30 | 30 | +0.00% | ✅ | 4 monsters × 3 replicaten + 1 NTC × 3 = 15 wells per doelgen; 2 doelgenen = 30 |
| Bloedalcohol (Widmark) | Eén drankje, man 80 kg | piek (g/L) | 0,3825 | 0,38 | -0.66% | ✅ | Widmark: 500 mL × 5% × 0,789 = 19,725 g; 19,725/(0,68·80) × 1,055 = 0,3825 g/L; terugrekenen 0,62 + β·1,75 h; Seidl man: 0,31608 − 0,004821·80 + 0,004632·180 |
| Bloedalcohol (Widmark) | Eén drankje, man 80 kg | teruggerekend laag | 0,795 | 0,8 | +0.63% | ✅ | Widmark: 500 mL × 5% × 0,789 = 19,725 g; 19,725/(0,68·80) × 1,055 = 0,3825 g/L; terugrekenen 0,62 + β·1,75 h; Seidl man: 0,31608 − 0,004821·80 + 0,004632·180 |
| Bloedalcohol (Widmark) | Eén drankje, man 80 kg | teruggerekend hoog | 1,058 | 1,06 | +0.24% | ✅ | Widmark: 500 mL × 5% × 0,789 = 19,725 g; 19,725/(0,68·80) × 1,055 = 0,3825 g/L; terugrekenen 0,62 + β·1,75 h; Seidl man: 0,31608 − 0,004821·80 + 0,004632·180 |
| Bloedalcohol (Widmark) | Eén drankje, man 80 kg | r Seidl | 0,7642 | 0,764 | -0.02% | ✅ | Widmark: 500 mL × 5% × 0,789 = 19,725 g; 19,725/(0,68·80) × 1,055 = 0,3825 g/L; terugrekenen 0,62 + β·1,75 h; Seidl man: 0,31608 − 0,004821·80 + 0,004632·180 |
| Lichaamslengte uit botten | Femur man en tibia vrouw | man, femur (cm) | 175 | 175 | -0.02% | ✅ | Trotter (1970) via Bass (1995): 2,32 × 47,2 + 65,53 = 175,03 cm; vrouw: 2,90 × 36,0 + 61,53 = 165,93 cm, met leeftijdscorrectie −0,06·(50 − 30) |
| Lichaamslengte uit botten | Femur man en tibia vrouw | vrouw, tibia, 50 jaar (cm) | 164,7 | 164,7 | -0.02% | ✅ | Trotter (1970) via Bass (1995): 2,32 × 47,2 + 65,53 = 175,03 cm; vrouw: 2,90 × 36,0 + 61,53 = 165,93 cm, met leeftijdscorrectie −0,06·(50 − 30) |
| Entomologie (graaddagen) | Constante temperatuur | minimaal PMI (d) | 6,4 | 6,4 | +0.00% | ✅ | 10 dagen van 15 °C met drempel 10 °C geven 5 °C·d per dag; 32 °C·d is na 6,4 dagen bereikt |
| Glasvergelijking (brekingsindex) | t-toets van Welch | t | 2,268 | 2,268 | +0.01% | ✅ | Onafhankelijk berekend met scipy.stats.ttest_ind(equal_var=False) |
| Glasvergelijking (brekingsindex) | t-toets van Welch | p | 0,08691 | 0,087 | +0.10% | ✅ | Onafhankelijk berekend met scipy.stats.ttest_ind(equal_var=False) |
| Hardy-Weinberg & forensische kengetallen | Kengetallen en exacte toets | exacte p | 0,04686 | 0,045 | -3.96% | ✅ | Onafhankelijk in Python: H_e (Nei), PD, PIC, PE = h²(1 − 2hH²); exacte HWE-toets voor twee allelen met de volledige verdeling (Wigginton e.a., Am J Hum Genet 76:887–893, 2005) |
| Hardy-Weinberg & forensische kengetallen | Kengetallen en exacte toets | H_e | 0,4 | 0,4 | +0.00% | ✅ | Onafhankelijk in Python: H_e (Nei), PD, PIC, PE = h²(1 − 2hH²); exacte HWE-toets voor twee allelen met de volledige verdeling (Wigginton e.a., Am J Hum Genet 76:887–893, 2005) |
| Hardy-Weinberg & forensische kengetallen | Kengetallen en exacte toets | PD | 0,66 | 0,66 | +0.00% | ✅ | Onafhankelijk in Python: H_e (Nei), PD, PIC, PE = h²(1 − 2hH²); exacte HWE-toets voor twee allelen met de volledige verdeling (Wigginton e.a., Am J Hum Genet 76:887–893, 2005) |
| Hardy-Weinberg & forensische kengetallen | Kengetallen en exacte toets | PE | 0,1139 | 0,1139 | -0.02% | ✅ | Onafhankelijk in Python: H_e (Nei), PD, PIC, PE = h²(1 − 2hH²); exacte HWE-toets voor twee allelen met de volledige verdeling (Wigginton e.a., Am J Hum Genet 76:887–893, 2005) |
| Chromatografie (HPLC/GC) | Plaatgetal en resolutie | k | 3,5 | 3,5 | +0.00% | ✅ | USP <621>: N = 5,54·(4,95/0,110)² = 11 219; R_s = 1,18·(4,95 − 3,42)/(0,082 + 0,110) = 9,40; k = (4,95 − 1,10)/1,10 = 3,50 |
| Chromatografie (HPLC/GC) | Plaatgetal en resolutie | N | 1,122e+04 | 1,122e+04 | +0.00% | ✅ | USP <621>: N = 5,54·(4,95/0,110)² = 11 219; R_s = 1,18·(4,95 − 3,42)/(0,082 + 0,110) = 9,40; k = (4,95 − 1,10)/1,10 = 3,50 |
| Chromatografie (HPLC/GC) | Plaatgetal en resolutie | R_s | 9,403 | 9,4 | -0.03% | ✅ | USP <621>: N = 5,54·(4,95/0,110)² = 11 219; R_s = 1,18·(4,95 − 3,42)/(0,082 + 0,110) = 9,40; k = (4,95 − 1,10)/1,10 = 3,50 |
| Interne standaard & standaardadditie | Exacte lijnen | IS-monster | 3,5 | 3,5 | +0.00% | ✅ | IS: verhouding = 0,2·c, monster met verhouding 0,7 → 3,5; standaardadditie: signaal = 0,1 + 0,05·x geeft x_E = 2, × verdunning 5 = 10 |
| Interne standaard & standaardadditie | Exacte lijnen | standaardadditie | 10 | 10 | +0.00% | ✅ | IS: verhouding = 0,2·c, monster met verhouding 0,7 → 3,5; standaardadditie: signaal = 0,1 + 0,05·x geeft x_E = 2, × verdunning 5 = 10 |
| Waterhardheid (EDTA-titratie) | Totale hardheid | mmol/L | 2,46 | 2,46 | +0.00% | ✅ | ISO 6059: 0,0100 M × (12,35 − 0,05) mL / 50,00 mL = 2,460 mmol/L = 13,79 °dH (× 5,6077) |
| Waterhardheid (EDTA-titratie) | Totale hardheid | °dH | 13,8 | 13,8 | +0.04% | ✅ | ISO 6059: 0,0100 M × (12,35 − 0,05) mL / 50,00 mL = 2,460 mmol/L = 13,79 °dH (× 5,6077) |
| Buffercapaciteit | Eenwaardig zuur | β (mM/pH) | 23,45 | 23,4 | -0.22% | ✅ | Van Slyke: β = 2,303·(K_w/[H⁺] + [H⁺] + C·K_a[H⁺]/(K_a + [H⁺])²), pKₐ 7,20, C = 50 mM, pH 6,80 |
| Oplosbaarheid (Ksp) | AgCl en CaF₂ | AgCl met Cl⁻ (mol/L) | 1,77e-08 | 1,77e-08 | +0.00% | ✅ | AgCl in 0,01 M Cl⁻: s = (−0,01 + √(10⁻⁴ + 4K_sp))/2; CaF₂ zuiver water: s = (K_sp/4)^(1/3) |
| Oplosbaarheid (Ksp) | AgCl en CaF₂ | CaF₂ (mol/L) | 0,0002051 | 0,000205 | -0.04% | ✅ | AgCl in 0,01 M Cl⁻: s = (−0,01 + √(10⁻⁴ + 4K_sp))/2; CaF₂ zuiver water: s = (K_sp/4)^(1/3) |
| Assaykwaliteit (Z′-factor) | Z′ | Z′ | 0,8875 | 0,887 | -0.05% | ✅ | Zhang e.a. (1999): Z′ = 1 − 3(σp + σn)/|μp − μn|, onafhankelijk berekend met numpy (SD met n − 1) |
| Transfectie (Lipofectamine 3000) | 6-well | Opti-MEM per buis (µL) | 125 | 125 | +0.00% | ✅ | Thermo Fisher MAN0009872: 6-well 2 × 125 µL Opti-MEM, 2,5 µg DNA, 5 µL P3000, 7,5 µL Lipofectamine 3000 (hoog) |
| Transfectie (Lipofectamine 3000) | 6-well | DNA (µL van 1 µg/µL) | 2,5 | 2,5 | +0.00% | ✅ | Thermo Fisher MAN0009872: 6-well 2 × 125 µL Opti-MEM, 2,5 µg DNA, 5 µL P3000, 7,5 µL Lipofectamine 3000 (hoog) |
| Transfectie (Lipofectamine 3000) | 6-well | P3000 (µL) | 5 | 5 | +0.00% | ✅ | Thermo Fisher MAN0009872: 6-well 2 × 125 µL Opti-MEM, 2,5 µg DNA, 5 µL P3000, 7,5 µL Lipofectamine 3000 (hoog) |
| Transfectie (Lipofectamine 3000) | 6-well | Lipofectamine 3000 (µL) | 7,5 | 7,5 | +0.00% | ✅ | Thermo Fisher MAN0009872: 6-well 2 × 125 µL Opti-MEM, 2,5 µg DNA, 5 µL P3000, 7,5 µL Lipofectamine 3000 (hoog) |
| Viabiliteit (trypaanblauw) | Neubauer-telling | levend/mL | 9,1000e+05 | 9,1000e+05 | +0.00% | ✅ | Strober (2015): 182 levend / 4 vierkanten × 2 × 10⁴ = 9,10 × 10⁵ per mL; viabiliteit 182/196 = 92,86% |
| Viabiliteit (trypaanblauw) | Neubauer-telling | viabiliteit (%) | 92,86 | 92,9 | +0.05% | ✅ | Strober (2015): 182 levend / 4 vierkanten × 2 × 10⁴ = 9,10 × 10⁵ per mL; viabiliteit 182/196 = 92,86% |
| Desinfectietest (log-reductie) | EN 1276 | reductie (lg) | 5 | 5 | +0.00% | ✅ | N = 3,0 × 10⁸ kve/mL, N₀ = N/10, N_a = 300 kve/mL: R = lg(3 × 10⁷) − lg 300 = 5,00 |
| Bland-Altman (methodevergelijking) | Bias en grenzen | bias | 0,2625 | 0,262 | -0.19% | ✅ | Bland & Altman (1986): d̄ ± 1,96·s_d, onafhankelijk berekend met numpy |
| Bland-Altman (methodevergelijking) | Bias en grenzen | ondergrens | -0,2913 | -0,291 | -0.09% | ✅ | Bland & Altman (1986): d̄ ± 1,96·s_d, onafhankelijk berekend met numpy |
| Bland-Altman (methodevergelijking) | Bias en grenzen | bovengrens | 0,8163 | 0,816 | -0.03% | ✅ | Bland & Altman (1986): d̄ ± 1,96·s_d, onafhankelijk berekend met numpy |
| ROC-curve & diagnostische test | AUC | AUC | 0,9222 | 0,922 | -0.02% | ✅ | AUC = U/(n_p·n_n) uit scipy.stats.mannwhitneyu |
| Overlevingscurve (Kaplan-Meier) | Mediaan en log-ranktoets | mediaan controle | 9 | 9 | +0.00% | ✅ | scipy.stats.ecdf (Kaplan-Meier) en scipy.stats.logrank op dezelfde gecensureerde data |
| Overlevingscurve (Kaplan-Meier) | Mediaan en log-ranktoets | χ² | 4,05 | 4,05 | +0.01% | ✅ | scipy.stats.ecdf (Kaplan-Meier) en scipy.stats.logrank op dezelfde gecensureerde data |
| Overlevingscurve (Kaplan-Meier) | Mediaan en log-ranktoets | p | 0,04418 | 0,044 | -0.41% | ✅ | scipy.stats.ecdf (Kaplan-Meier) en scipy.stats.logrank op dezelfde gecensureerde data |
| Significante cijfers & afronden | Afronden en onzekerheid | half naar boven | 0,00457 | 0,00457 | +0.00% | ✅ | Half naar boven: 0,004565 → 0,00457; half naar even: 0,00456; 9,995 → 10,0; GUM §7.2.6: 0,0045650 ± 0,0000234 → 0,004565 ± 0,000023 |
| Significante cijfers & afronden | Afronden en onzekerheid | half naar even | 0,00456 | 0,00456 | +0.00% | ✅ | Half naar boven: 0,004565 → 0,00457; half naar even: 0,00456; 9,995 → 10,0; GUM §7.2.6: 0,0045650 ± 0,0000234 → 0,004565 ± 0,000023 |
| Significante cijfers & afronden | Afronden en onzekerheid | 9,995 → 3 cijfers | 1 | 1 | +0.00% | ✅ | Half naar boven: 0,004565 → 0,00457; half naar even: 0,00456; 9,995 → 10,0; GUM §7.2.6: 0,0045650 ± 0,0000234 → 0,004565 ± 0,000023 |
| Significante cijfers & afronden | Afronden en onzekerheid | met onzekerheid | 1 | 1 | +0.00% | ✅ | Half naar boven: 0,004565 → 0,00457; half naar even: 0,00456; 9,995 → 10,0; GUM §7.2.6: 0,0045650 ± 0,0000234 → 0,004565 ± 0,000023 |
| Welke pipet? | 15 µL | beste pipet | 20 | 20 | +0.00% | ✅ | ISO 8655-2 grenzen voor 20 µL: e_s 1% = 0,2 µL, CV 0,5% = 0,1 µL; P20 heeft de kleinste totale fout |
| Welke pipet? | 15 µL | e_s (µL) | 0,2 | 0,2 | +0.00% | ✅ | ISO 8655-2 grenzen voor 20 µL: e_s 1% = 0,2 µL, CV 0,5% = 0,1 µL; P20 heeft de kleinste totale fout |
| QR-code (delen) | QR-code leesbaar | decodeert (5 tekens) | 1 | 1 | +0.00% | ✅ | QR-code volgens ISO/IEC 18004, gecontroleerd door de QR-decoder van OpenCV |
| QR-code (delen) | QR-code leesbaar | decodeert (54 tekens) | 1 | 1 | +0.00% | ✅ | QR-code volgens ISO/IEC 18004, gecontroleerd door de QR-decoder van OpenCV |
| QR-code (delen) | QR-code leesbaar | decodeert (300 tekens) | 1 | 1 | +0.00% | ✅ | QR-code volgens ISO/IEC 18004, gecontroleerd door de QR-decoder van OpenCV |
| Verdunning | Eigen eenheid per concentratie | V₁ (µL) | 1,25 | 1,25 | +0.00% | ✅ | 50 mM naar 2,5 µM in 25 mL: V₁ = 2,5 × 10⁻⁶ × 25 mL / 0,050 = 1,25 µL; C₂ > C₁ geeft een foutmelding |
| Verdunning | Eigen eenheid per concentratie | foutmelding bij C₂ > C₁ | 1 | 1 | +0.00% | ✅ | 50 mM naar 2,5 µM in 25 mL: V₁ = 2,5 × 10⁻⁶ × 25 mL / 0,050 = 1,25 µL; C₂ > C₁ geeft een foutmelding |
| Telkamer | Komma als scheidingsteken | vakken | 4 | 4 | +0.00% | ✅ | "12,15,14,18" zijn vier vaktellingen: gemiddeld 14,75 per vak |
| Telkamer | Komma als scheidingsteken | cellen/mL | 1,4750e+05 | 1,4800e+05 | +0.34% | ✅ | "12,15,14,18" zijn vier vaktellingen: gemiddeld 14,75 per vak |
| Verdunningsreeks & KVE | ISO 7218 en ontelbare platen | KVE/mL | 1,9182e+05 | 1,9000e+05 | -0.95% | ✅ | NEN-EN-ISO 7218 §10.3.2: N = ΣC / (V × (n₁ + 0,1·n₂) × d) = 422 / (0,1 × 2,2 × 10⁻²) = 1,9 × 10⁵; ">300" telt als ontelbaar |
| Verdunningsreeks & KVE | ISO 7218 en ontelbare platen | telbare platen | 4 | 4 | +0.00% | ✅ | NEN-EN-ISO 7218 §10.3.2: N = ΣC / (V × (n₁ + 0,1·n₂) × d) = 422 / (0,1 × 2,2 × 10⁻²) = 1,9 × 10⁵; ">300" telt als ontelbaar |
| DNA-kwantificatie | Ratio met A₃₂₀-correctie | 260/280 | 1,9 | 1,9 | +0.00% | ✅ | (A₂₆₀ − A₃₂₀)/(A₂₈₀ − A₃₂₀) = (1,00 − 0,05)/(0,55 − 0,05) = 1,90 |
| DNA-kwantificatie | Ratio met A₃₂₀-correctie | 260/230 | 2,111 | 2,11 | -0.05% | ✅ | (A₂₆₀ − A₃₂₀)/(A₂₈₀ − A₃₂₀) = (1,00 − 0,05)/(0,55 − 0,05) = 1,90 |
| Oplossing & buffer | Hydraatvariant | afwegen (g) | 2,681 | 2,681 | +0.01% | ✅ | 10 mM Na₂HPO₄·7H₂O (268,07 g/mol) in 1 L = 2,681 g |
| Enzymkinetiek | Eadie-Hofstee | helling | -2 | -2 | -0.00% | ✅ | Exacte Michaelis-Menten-data (V_max 100, K_m 2): v tegen v/[S] heeft helling −K_m en y-asafsnede V_max |
| Enzymkinetiek | Eadie-Hofstee | y-asafsnede | 100 | 100 | +0.00% | ✅ | Exacte Michaelis-Menten-data (V_max 100, K_m 2): v tegen v/[S] heeft helling −K_m en y-asafsnede V_max |
| Restrictiedigestie | Enzymvolume en star-activiteit | enzymvolume (µL) | 1 | 1 | +0.00% | ✅ | 1 µg DNA × 10 U/µg / 20 U/µL = 0,5 µL per enzym; twee enzymen in 50 µL = 2% (glycerol 1%) |
| Restrictiedigestie | Enzymvolume en star-activiteit | glycerol (%) | 1 | 1 | +0.00% | ✅ | 1 µg DNA × 10 U/µg / 20 U/µL = 0,5 µL per enzym; twee enzymen in 50 µL = 2% (glycerol 1%) |
| Eiwitzuiveringstabel | Zuiveringsfactor en ammoniumsulfaat | zuiveringsfactor | 166,7 | 167 | +0.20% | ✅ | SA stap 4 / SA stap 1 = (480/0,9)/(40/12,5) = 166,7; opbrengst 4800/8000 = 60%; 0 → 40% bij 0 °C: 515,35 × 0,4/(1 − 0,2722 × 0,4) = 231,3 g/L (Wingfield 2016) |
| Eiwitzuiveringstabel | Zuiveringsfactor en ammoniumsulfaat | g (NH₄)₂SO₄ per L | 231,3 | 231,3 | -0.01% | ✅ | SA stap 4 / SA stap 1 = (480/0,9)/(40/12,5) = 166,7; opbrengst 4800/8000 = 60%; 0 → 40% bij 0 °C: 515,35 × 0,4/(1 − 0,2722 × 0,4) = 231,3 g/L (Wingfield 2016) |
| Gradiënt-PCR | Lineaire gradiënt | kolom 6 (°C) | 58,36 | 58,4 | +0.06% | ✅ | T₆ = 52 + 5 × (66 − 52)/11 = 58,36 °C |
| ELISA-plaatanalyse | 4PL terugrekenen | M1 (pg/mL) | 1000 | 1000 | +0.00% | ✅ | Standaarden exact op y = 0,05 + 2,4/(1 + (x/180)^−1,15); monster met de absorptie van 100 pg/mL en verdunning 10 moet 1000 opleveren |
| Flowcytometrie (panel & controles) | Cocktail, stain index en telbeads | antilichaam per test (µL) | 0,25 | 0,25 | +0.00% | ✅ | 50 µL / 200 = 0,25 µL; SI = (18500 − 210)/(2 × 95) = 96,3; cellen/µL = 24500/5200 × 1000 × 50/100 = 2356 |
| Flowcytometrie (panel & controles) | Cocktail, stain index en telbeads | stain index | 96,26 | 96,3 | +0.04% | ✅ | 50 µL / 200 = 0,25 µL; SI = (18500 − 210)/(2 × 95) = 96,3; cellen/µL = 24500/5200 × 1000 × 50/100 = 2356 |
| Flowcytometrie (panel & controles) | Cocktail, stain index en telbeads | cellen/µL | 2356 | 2356 | +0.01% | ✅ | 50 µL / 200 = 0,25 µL; SI = (18500 − 210)/(2 × 95) = 96,3; cellen/µL = 24500/5200 × 1000 × 50/100 = 2356 |
| Mengprofiel & LR | LR en mengverhouding | LR (θ = 0) | 13,33 | 13,3 | -0.25% | ✅ | Vier allelen, slachtoffer 14/15, verdachte 16/18, θ = 0: LR = 1/(2·p₁₆·p₁₈) = 1/(2 × 0,25 × 0,15) = 13,3; M_x = (420 + 390)/3640 = 0,22. Met θ = 0,03 onafhankelijk in Python (Balding & Nichols 1994) |
| Mengprofiel & LR | LR en mengverhouding | M_x | 0,2225 | 0,22 | -1.14% | ✅ | Vier allelen, slachtoffer 14/15, verdachte 16/18, θ = 0: LR = 1/(2·p₁₆·p₁₈) = 1/(2 × 0,25 × 0,15) = 13,3; M_x = (420 + 390)/3640 = 0,22. Met θ = 0,03 onafhankelijk in Python (Balding & Nichols 1994) |
| Mengprofiel & LR | LR en mengverhouding | LR (θ = 0,03) | 12,76 | 12,8 | +0.29% | ✅ | Vier allelen, slachtoffer 14/15, verdachte 16/18, θ = 0: LR = 1/(2·p₁₆·p₁₈) = 1/(2 × 0,25 × 0,15) = 13,3; M_x = (420 + 390)/3640 = 0,22. Met θ = 0,03 onafhankelijk in Python (Balding & Nichols 1994) |
| pH bijstellen | Tris-Cl uit Tris-base | HCl bij pH 7,4 (mL) | 70 | 67,81 | -3.13% | ✅ | Sambrook & Russell, Molecular Cloning (3e druk), Appendix 1: 1 L 1 M Tris-Cl uit Tris-base vraagt ongeveer 70 / 60 / 42 mL geconcentreerd HCl (12,1 M) voor pH 7,4 / 7,6 / 8,0 |
| pH bijstellen | Tris-Cl uit Tris-base | HCl bij pH 7,6 (mL) | 60 | 61,37 | +2.28% | ✅ | Sambrook & Russell, Molecular Cloning (3e druk), Appendix 1: 1 L 1 M Tris-Cl uit Tris-base vraagt ongeveer 70 / 60 / 42 mL geconcentreerd HCl (12,1 M) voor pH 7,4 / 7,6 / 8,0 |
| pH bijstellen | Tris-Cl uit Tris-base | HCl bij pH 8,0 (mL) | 42 | 44,17 | +5.17% | ✅ | Sambrook & Russell, Molecular Cloning (3e druk), Appendix 1: 1 L 1 M Tris-Cl uit Tris-base vraagt ongeveer 70 / 60 / 42 mL geconcentreerd HCl (12,1 M) voor pH 7,4 / 7,6 / 8,0 |
| pH bijstellen | Acetaatbuffer met NaOH | NaOH (mL) | 5 | 5 | +0.00% | ✅ | Henderson-Hasselbalch: 100 mL 0,1 M azijnzuur naar pH 4,76 (= pKa) vraagt de helft aan NaOH, dus 5,0 mmol; uit 1 M is dat 5,0 mL |
| pH bijstellen | Acetaatbuffer met NaOH | omgezet deel (%) | 50 | 50 | +0.00% | ✅ | Henderson-Hasselbalch: 100 mL 0,1 M azijnzuur naar pH 4,76 (= pKa) vraagt de helft aan NaOH, dus 5,0 mmol; uit 1 M is dat 5,0 mL |
| Celkweekmedium klaarmaken | 500 mL met 10% FBS | basismedium (mL) | 440 | 440 | +0.00% | ✅ | Thermo Fisher, Cell Culture Basics: percentages gaan over het eindvolume, dus 500 mL met 10% FBS, 1x pen/strep uit 100x en 2 mM glutamine uit 200 mM geeft 50 + 5 + 5 mL supplement en 440 mL basismedium |
| Celkweekmedium klaarmaken | 500 mL met 10% FBS | FBS (mL) | 50 | 50 | +0.00% | ✅ | Thermo Fisher, Cell Culture Basics: percentages gaan over het eindvolume, dus 500 mL met 10% FBS, 1x pen/strep uit 100x en 2 mM glutamine uit 200 mM geeft 50 + 5 + 5 mL supplement en 440 mL basismedium |
| Celkweekmedium klaarmaken | 500 mL met 10% FBS | pen/strep (mL) | 5 | 5 | +0.00% | ✅ | Thermo Fisher, Cell Culture Basics: percentages gaan over het eindvolume, dus 500 mL met 10% FBS, 1x pen/strep uit 100x en 2 mM glutamine uit 200 mM geeft 50 + 5 + 5 mL supplement en 440 mL basismedium |
| Celkweekmedium klaarmaken | 500 mL met 10% FBS | glutamine (mL) | 5 | 5 | +0.00% | ✅ | Thermo Fisher, Cell Culture Basics: percentages gaan over het eindvolume, dus 500 mL met 10% FBS, 1x pen/strep uit 100x en 2 mM glutamine uit 200 mM geeft 50 + 5 + 5 mL supplement en 440 mL basismedium |
| Celkweekmedium klaarmaken | 500 mL met 10% FBS | totaal (mL) | 500 | 500 | +0.00% | ✅ | Thermo Fisher, Cell Culture Basics: percentages gaan over het eindvolume, dus 500 mL met 10% FBS, 1x pen/strep uit 100x en 2 mM glutamine uit 200 mM geeft 50 + 5 + 5 mL supplement en 440 mL basismedium |

Toleranties: rekenregels 0,1–0,5%; gepubliceerde receptgrammen (afgerond in de bron) 1–3%; densitometrie op de getekende demo-gel 5%.
