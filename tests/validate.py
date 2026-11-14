"""
Labkit BML - validatie tegen gepubliceerde ruwe data.

Elke test vult een tool via de echte interface in met data uit een bron,
leest de uitkomst die Labkit toont en vergelijkt die met de gepubliceerde
(of onafhankelijk berekende) waarde. Schrijft tests/VALIDATIE.md.

Gebruik:  pip install playwright && python -m playwright install chromium
          python tests/validate.py
"""
import pathlib, sys, datetime
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / 'web' / 'index.html').as_uri()

HELPERS = r"""
window.__set=(id,v)=>{ const el=document.getElementById(id); if(el.type==='checkbox'){ el.checked=!!v; } else el.value=String(v); el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); };
window.__go=t=>{ location.hash=t; };
/* Leest het eerste getal uit getoonde tekst zoals Labkit het weergeeft: 24.409 (duizendtal), 8,006 g, 2,5 × 10^8 */
window.__n=t=>{ t=String(t).replace(/\u00a0/g,' ').replace(/\s+/g,' '); const m=t.match(/(-?\d{1,3}(?:\.\d{3})+(?:,\d+)?|-?\d+(?:,\d+)?)(?:\s*×\s*10\^(-?\d+))?/); if(!m) return NaN; let n=Number(m[1].replace(/\.(?=\d{3}(\D|$))/g,'').replace(',','.')); if(m[2]) n*=10**Number(m[2]); return n; };
window.__el=el=>{ if(!el) return ''; const c=el.cloneNode(true); c.querySelectorAll('small,span[style*=muted]').forEach(s=>s.remove()); c.querySelectorAll('sup').forEach(s=>s.replaceWith('^'+s.textContent.replace('−','-'))); return c.textContent; };
window.__big=sel=>__n(__el(document.querySelector(sel+' .big')));
window.__cells=sel=>[...document.querySelectorAll(sel)].map(e=>__n(__el(e)));
window.__kv=(sel,label)=>{ const dt=[...document.querySelectorAll(sel+' dt')].find(d=>d.textContent.trim().startsWith(label)); return dt?__n(__el(dt.nextElementSibling)):NaN; };
"""

CASES = []
def case(tool, name, source):
    def deco(fn):
        CASES.append((tool, name, source, fn)); return fn
    return deco

# ---------------- Oplossingen ----------------
@case('Verdunning', '50X TAE naar 500 mL 1X', 'C₁V₁ = C₂V₂; 50X-stock volgens Bio-Rad Bulletin 6205')
def _(pg):
    pg.evaluate("__go('verdunning');__set('d-cu','X');__set('d-c1','50');__set('d-c2','1');__set('d-v1','');__set('d-v2u','mL');__set('d-v1u','mL');__set('d-v2','500')")
    return [('stock (mL)', pg.evaluate("__big('#d-out')"), 10.0, 0.001)]

@case('Oplossing & buffer', 'PBS 1X, 1 L', 'Cold Spring Harbor Protocols, PBS (8 g NaCl, 0,2 g KCl, 1,44 g Na₂HPO₄, 0,24 g KH₂PO₄)')
def _(pg):
    pg.evaluate("__go('oplossing');__set('o-v','1');__set('o-vu','L');__set('o-preset','pbs')")
    vals = pg.evaluate("[...document.querySelectorAll('#o-tbl tbody tr [data-k=out]')].map(td=>{ const t=td.textContent; const n=__n(t); return t.includes('mg')?n/1000:n; })")
    return [('NaCl (g)', vals[0], 8.0, 0.01), ('KCl (g)', vals[1], 0.2, 0.02), ('Na₂HPO₄ (g)', vals[2], 1.44, 0.02), ('KH₂PO₄ (g)', vals[3], 0.24, 0.03)]

@case('Oplossing & buffer', 'TBE 10X, 1 L', 'Bio-Rad Bulletin 6205 (108 g Tris, 55 g boorzuur per liter)')
def _(pg):
    pg.evaluate("__go('oplossing');__set('o-v','1');__set('o-vu','L');__set('o-preset','tbe10')")
    vals = pg.evaluate("__cells('#o-tbl tbody tr [data-k=out]')")
    return [('Tris (g)', vals[0], 108, 0.01), ('boorzuur (g)', vals[1], 55, 0.01)]

# ---------------- Assays ----------------
@case('Standaardcurve', 'Bradford, kwadratisch', 'Thermo Fisher NanoDrop One Bradford-protocol (BSA 0–1500 µg/mL); referentie: NumPy polyfit')
def _(pg):
    pg.evaluate("__go('curve');__set('s-preset','bradford')")
    v = pg.evaluate("__cells('#s-unk tbody tr [data-x]')[0]")
    return [('Lysaat A in meetbuis (µg/mL)', v, 468.21, 0.01)]

@case('Standaardcurve', 'ELISA, 4PL', 'Kim e.a., Biol Proced Online 2018 (A = −0,00767; B = 0,942; C = 710; D = 4,17)')
def _(pg):
    pg.evaluate("""__go('curve');__set('s-preset','leeg');__set('s-model','4pl');__set('s-blank',false);
      const xs=[0,10,50,150,500,1000], f=x=>4.17+(-0.00767-4.17)/(1+Math.pow(x/710,0.942));
      document.querySelector('#s-std tbody').innerHTML=xs.map(x=>sStdRow([x,Number(f(x).toFixed(5))])).join('');
      document.querySelector('#s-unk tbody').innerHTML=sUnkRow(['test',Number(f(300).toFixed(5)),'','',1]); calc.curve();""")
    v = pg.evaluate("__cells('#s-unk tbody tr [data-x]')[0]")
    return [('terugberekend (IU/L)', v, 300, 0.01)]

@case('Enzymkinetiek', 'Puromycin (behandeld)', 'Treloar 1974 via R-dataset Puromycin (Bates & Watts 1988); referentie: SciPy curve_fit')
def _(pg):
    pg.evaluate("""__go('enzym');__set('k-su','mM');__set('k-vu','µmol/min');
      const S=[0.02,0.02,0.06,0.06,0.11,0.11,0.22,0.22,0.56,0.56,1.1,1.1], v=[76,47,97,107,123,139,159,152,191,201,207,200];
      document.querySelector('#k-tbl tbody').innerHTML=S.map((s,i)=>kRow([s,v[i],''])).join(''); calc.enzym();""")
    vm = pg.evaluate("__cells('#k-res tr.hl td:nth-child(2)')[0]")
    km = pg.evaluate("__cells('#k-res tr.hl td:nth-child(3)')[0]")
    return [('Vmax', vm, 212.684, 0.005), ('Km (mM)', km, 0.064121, 0.01)]

@case('Enzymkinetiek', 'LDH-activiteit uit ΔA/min', 'Sigma-Aldrich, Enzymatic Assay of L-Lactic Dehydrogenase (3 mL totaal, 0,1 mL enzym, ε 6,22)')
def _(pg):
    pg.evaluate("__go('enzym');__set('e-dat','0,085');__set('e-dab','0,005');__set('e-eps','6,22');__set('e-l','1');__set('e-vt','3');__set('e-ve','0,1');__set('e-df','1')")
    return [('U/mL', pg.evaluate("__big('#e-out')"), 0.08*3/(6.22*0.1), 0.01)]

# ---------------- Microbiologie ----------------
@case('Verdunningsreeks & KVE', 'FDA BAM-voorbeeld', 'FDA BAM hoofdstuk 3: 1:100 → 232, 244; 1:1000 → 33, 28; N = 24.409')
def _(pg):
    pg.evaluate("""__go('reeks');__set('r-f','10');__set('r-n','3');__set('r-pv','1');__set('r-range','25-250');
      reeksCounts={1:['',''],2:['232','244'],3:['33','28']}; buildReeks(); calc.reeks();""")
    return [('KVE/mL', pg.evaluate("__big('#r-out')"), 24409, 0.005)]

@case('Groeicurve', 'Kiemgetallen E. coli', 'Microbial growth study material (KVV): log KVE 6,0–8,7 over 2–6 h, generatietijd ≈ 26 min; regressie: 26,96 min')
def _(pg):
    pg.evaluate("""__go('groei');__set('g2-tu','h');__set('g2-type','kve');__set('g2-win','man');__set('g2-from','1');__set('g2-to','5');
      const t=[2,3,4,5,6], l=[6.0,6.7,7.3,8.0,8.7];
      document.querySelector('#gc-tbl tbody').innerHTML=t.map((x,i)=>gcRow([x,Number((10**l[i]).toPrecision(6))],i)).join(''); calc.groei();""")
    return [('verdubbelingstijd (min)', pg.evaluate("__big('#gc-res')"), 26.96, 0.01)]

@case('Groeicurve', 'OD₆₀₀, twee punten in log-fase', 'Science Insights rekenvoorbeeld: OD 0,05 → 0,8 in 2 h, µ = 1,39 h⁻¹, t_d = 30 min')
def _(pg):
    pg.evaluate("""__go('groei');__set('g2-tu','h');__set('g2-type','od');__set('g2-blank','0');__set('g2-win','man');__set('g2-from','1');__set('g2-to','3');
      document.querySelector('#gc-tbl tbody').innerHTML=[[1,0.05],[2,0.2],[3,0.8]].map((r,i)=>gcRow(r,i)).join(''); calc.groei();""")
    return [('verdubbelingstijd (min)', pg.evaluate("__big('#gc-res')"), 30.0, 0.005), ('µ (h⁻¹)', pg.evaluate("__kv('#gc-res','Specifieke')"), 1.386, 0.005)]

@case('Telkamer', 'Neubauer, erytrocyten', 'ProSciTech: 528 cellen in 5 groepsvakken (0,2 mm²), 1:200 → 5,28 × 10⁶/µL')
def _(pg):
    pg.evaluate("__go('telkamer');__set('k-ch','0.1n');kSq();__set('k-sq','0.04');__set('k-live','105,6 105,6 105,6 105,6 105,6');__set('k-dead','');__set('k-df','200')")
    return [('cellen/mL', pg.evaluate("__big('#k-out')"), 5.28e9, 0.005)]

@case('Telkamer', 'Neubauer, leukocyten', 'ProSciTech: 156 cellen in 4 grote vakken, 1:20 → 7800/µL')
def _(pg):
    pg.evaluate("__go('telkamer');__set('k-ch','0.1n');kSq();__set('k-sq','1');__set('k-live','39 39 39 39');__set('k-dead','');__set('k-df','20')")
    return [('cellen/mL', pg.evaluate("__big('#k-out')"), 7.8e6, 0.005)]

# ---------------- DNA ----------------
@case('DNA-kwantificatie', 'A₂₆₀ → concentratie', 'Pearson rekenvoorbeeld: A₂₆₀ 0,85 bij 1:10, dsDNA → 425 ng/µL')
def _(pg):
    pg.evaluate("__go('dna');__set('n-a260','0,85');__set('n-a320','');__set('n-type','50');__set('n-df','10');__set('n-pl','1')")
    return [('ng/µL', pg.evaluate("__big('#n-out')"), 425, 0.001)]

@case('DNA-kwantificatie', 'ng/µL → nM', 'Pearson rekenvoorbeeld: 50 ng/µL, 1000 bp → 75,8 nM')
def _(pg):
    pg.evaluate("__go('dna');__set('p-ng','50');__set('p-bp','1000');__set('p-t','660');__set('p-vol','1')")
    return [('nM', pg.evaluate("__kv('#p-out','Concentratie')"), 75.8, 0.002)]

@case('PCR-mastermix', 'NEB Taq, 25 en 50 µL', 'NEB-protocol M0273: 2,5 / 0,5 / 0,5 / 0,5 / 0,125 µL per 25 µL; Taq 0,25 µL per 50 µL')
def _(pg):
    pg.evaluate("__go('pcr');__set('q-preset','taq');__set('q-v','25')")
    v = pg.evaluate("__cells('#q-tbl tbody tr [data-k=pr]')")
    pg.evaluate("__set('q-v','50')")
    t50 = pg.evaluate("__cells('#q-tbl tbody tr [data-k=pr]').pop()")
    return [('buffer (µL)', v[0], 2.5, 0.001), ('dNTP (µL)', v[1], 0.5, 0.001), ('primer F (µL)', v[2], 0.5, 0.001), ('Taq 25 µL (µL)', v[4], 0.125, 0.001), ('Taq 50 µL (µL)', t50, 0.25, 0.001)]

@case('PCR-cyclus', 'Primer-Tm (nearest-neighbor)', 'Biopython Tm_NN (SantaLucia 1998, 50 mM Na⁺, 1,5 mM Mg²⁺, 0,8 mM dNTP, 0,2 µM primer)')
def _(pg):
    pg.evaluate("__go('pcrcyclus');__set('y-f','AGCTGACCTGAAGGCTCTGAAG');__set('y-r','TCGTCGTACTTGACCAGGCTAT');__set('y-na','50');__set('y-mg','1,5');__set('y-dntp','0,8');__set('y-pc','0,2')")
    tms = pg.evaluate("__cells('#y-out tbody tr td:nth-child(4)')")
    return [('Tm forward (°C)', tms[0], 65.22, 0.002), ('Tm reverse (°C)', tms[1], 64.15, 0.002)]

@case('PCR-cyclus', 'qPCR-efficiëntie uit helling', 'Pearson qPCR-efficiëntie: helling −3,80 → 83,3%; helling −3,3 → 100,9%')
def _(pg):
    pg.evaluate("__go('pcrcyclus');__set('y-q0','1e6');__set('y-qf','10');__set('y-cq','15 18,8 22,6')")
    e1 = pg.evaluate("__cells('#y-amp .big').pop()")
    pg.evaluate("__set('y-cq','18,2 21,5 24,8')")
    e2 = pg.evaluate("__cells('#y-amp .big').pop()")
    return [('efficiëntie bij −3,80 (%)', e1, 83.3, 0.002), ('efficiëntie bij −3,3 (%)', e2, 100.9, 0.002)]

@case('PCR-cyclus', 'Amplificatie', 'KVV-studiemateriaal: 10⁵ × 2¹² = 4,1 × 10⁸')
def _(pg):
    pg.evaluate("__go('pcrcyclus');__set('y-n0','1e5');__set('y-eff','100');__set('y-cyc','12')")
    return [('kopieën', pg.evaluate("__big('#y-amp')"), 4.096e8, 0.002)]

@case('qPCR-analyse', 'ΔΔCt (Livak)', 'CASRAI rekenvoorbeeld: controle 24,0/20,0, behandeld 21,5/20,2 → 6,5×')
def _(pg):
    pg.evaluate("""__go('qpcr');__set('qp-et','100');__set('qp-er','100');__set('qp-m','livak');
      document.querySelector('#qp-tbl tbody').innerHTML=[['Controle',24.0,20.0],['Behandeld',21.5,20.2]].map(qpRow).join(''); calc.qpcr(); __set('qp-cal','Controle');""")
    return [('fold change', pg.evaluate("__big('#qp-res')"), 6.498, 0.002)]

@case('qPCR-analyse', 'Pfaffl (efficiëntie-gecorrigeerd)', 'CASRAI rekenvoorbeeld: E doel 1,92, E ref 1,98 → ≈ 5,9×')
def _(pg):
    pg.evaluate("__go('qpcr');__set('qp-et','92');__set('qp-er','98');__set('qp-m','pfaffl')")
    return [('ratio', pg.evaluate("__big('#qp-res')"), 5.856, 0.002)]

@case('Ligatie', 'NEB 3:1', 'NEB FAQ: 50 ng 5 kb-vector, 1 kb-insert, 3:1 → 30 ng insert')
def _(pg):
    pg.evaluate("__go('ligatie');__set('l-vng','50');__set('l-vbp','5000');__set('l-ibp','1000');__set('l-r','3')")
    return [('insert (ng)', pg.evaluate("__big('#l-out')"), 30, 0.001)]

@case('Agarosegel', '1% gel', 'miniPCR: 1 g agarose in 100 mL = 1%')
def _(pg):
    pg.evaluate("__go('gel');__set('g-pct','1');__set('g-vol','100')")
    return [('agarose (g)', pg.evaluate("__big('#g-out')"), 1.0, 0.001)]

@case('Gelfoto-editor', 'Densitometrie demo-gel', 'Rekentest: banden getekend met bekende sterkte (0,85 / 0,70 / 0,90 / 0,50)')
def _(pg):
    pg.evaluate("__go('gelfoto');gfDemo();gf.marks=[];gfMarksTable();document.getElementById('gf-measall').click();")
    r = pg.evaluate("""(()=>{ const m=gf.marks.filter(x=>Math.round(x.bp)>600&&Math.round(x.bp)<700); const by=i=>m.find(x=>Math.abs(x.x-gf.lanes[i].x)<5); const ref=by(3).int; return [by(1).int/ref, by(2).int/ref, by(5).int/ref, by(1).bp]; })()""")
    return [('lane 1 / lane 3', r[0], 0.85/0.9, 0.05), ('lane 2 / lane 3', r[1], 0.7/0.9, 0.05), ('lane 5 / lane 3', r[2], 0.5/0.9, 0.05), ('bandgrootte (bp)', r[3], 650, 0.02)]

@case('Gelfoto-editor', 'Demo-gel: lanen en ladder', 'Rekentest: getekende gel met 9 lanen op 77,5 px afstand (lanemidden moet binnen 5 px liggen), 100 bp-ladder, banden van 650, 350 en 58 bp')
def _(pg):
    pg.evaluate("__go('gelfoto');$('#gf-n').value='';gfDemo();")
    lanes = pg.evaluate("gf.lanes.map(l=>l.x)")
    exp = [70 + i * 77.5 for i in range(9)]
    dev = max(abs(a - b) for a, b in zip(lanes, exp)) if len(lanes) == 9 else 999
    pg.evaluate("gf.marks=[];document.getElementById('gf-measall').click();")
    bp = pg.evaluate("gf.marks.map(m=>m.bp)")
    b650 = [v for v in bp if 500 < v < 800]; b350 = [v for v in bp if 250 < v < 450]; b58 = [v for v in bp if v < 80]
    return [('aantal lanen', len(lanes), 9, 0), ('grootste afwijking lanemidden (px)', dev, 0, 0) if dev > 5 else ('lanemidden binnen 5 px', 1, 1, 0),
            ('band 650 bp (gem.)', sum(b650) / len(b650), 650, 0.01), ('band 350 bp (gem.)', sum(b350) / len(b350), 350, 0.02), ('band 58 bp (gem.)', sum(b58) / len(b58), 58, 0.03)]

@case('Gelfoto-editor', 'Realistische testgel (scheef, smeer, lege lanen)', 'tests/make_test_gel.py: 11 lanen, 2,0° scheef, ladder in lane 1, producten 650 bp, dimeren 60 bp')
def _(pg):
    pg.evaluate("__go('gelfoto')")
    pg.set_input_files('#gf-file', str(ROOT / 'tests' / 'fixtures' / 'gel_realistic.png')); pg.wait_for_timeout(700)
    pg.evaluate("$('#gf-n').value=''; document.getElementById('gf-auto').click()"); pg.wait_for_timeout(1500)
    ang = pg.evaluate("gf.fine"); n = pg.evaluate("gf.lanes.length")
    pg.evaluate("document.getElementById('gf-bands').click(); gf.marks=[]; document.getElementById('gf-measall').click();")
    lad = pg.evaluate("gf.ladder"); bp = pg.evaluate("gf.marks.map(m=>m.bp)")
    b650 = [v for v in bp if 500 < v < 800]; b60 = [v for v in bp if v < 100]
    return [('rechtzethoek (°)', ang, 2.0, 0.125), ('aantal lanen', n, 11, 0), ('ladderlane (index)', lad, 0, 0),
            ('product 650 bp (gem.)', sum(b650) / max(1, len(b650)), 650, 0.02), ('aantal productbanden', len(b650), 7, 0), ('dimeer 60 bp (gem.)', sum(b60) / max(1, len(b60)), 60, 0.05)]

@case('Centrifuge', 'rpm → × g', 'Thermo Scientific Tech Tip #40: 5000 rpm, r = 7 cm → 1957 × g')
def _(pg):
    pg.evaluate("__go('centrifuge');__set('z-r','7');__set('z-rpm','5000')")
    return [('× g', pg.evaluate("__big('#z-out')"), 1957, 0.001)]

@case('Centrifuge', '× g → rpm', 'CASRAI: 4000 × g, r = 10,5 cm → 5837 rpm')
def _(pg):
    pg.evaluate("__go('centrifuge');__set('z-r','10,5');__set('z-g','4000')")
    return [('rpm', pg.evaluate("__big('#z-out')"), 5837, 0.001)]


# ---------------- Transformatie ----------------
def _tf(pg, lv, vng, used, tot, rows):
    pg.evaluate(f"""__go('transf');__set('tf-range','1-100000');__set('tf-lv','{lv}');__set('tf-vng','{vng}');__set('tf-used','{used}');__set('tf-tot','{tot}');
      document.querySelector('#tf-tbl tbody').innerHTML={rows!r}.map(r=>tfRow(r)).join(''); calc.transf();""")
    return pg.evaluate("__big('#tf-out')")

@case('Transformatie', 'Rekenvoorbeeld iGEM', 'iGEM Troubleshooting Transformations: 1 µL van 0,05 ng/µL, 100 van 1000 µL uitgeplaat, 250 kolonies → 5 × 10⁷ kve/µg')
def _(pg):
    return [('kve/µg', _tf(pg, 1, 0.05, 1, 1000, [['test', 100, 0, 250]]), 5e7, 0.001)]

@case('Transformatie', 'Rekenvoorbeeld NEB', 'NEB FAQ C2925: 100 pg pUC19, 100 van 1000 µL uitgeplaat, 20 kolonies → 2 × 10⁶ kve/µg')
def _(pg):
    return [('kve/µg', _tf(pg, 1, 0.1, 1, 1000, [['test', 100, 0, 20]]), 2e6, 0.001)]

@case('Transformatie', 'Rekenvoorbeeld OriGene', 'OriGene, transformatieprotocol: 20 pg pUC19, 5 µL van 1 mL uitgeplaat, 40 kolonies → 4 × 10⁸ kve/µg')
def _(pg):
    return [('kve/µg', _tf(pg, 1, 0.02, 1, 1000, [['test', 5, 0, 40]]), 4e8, 0.001)]

# ---------------- Statistiek ----------------
SLEEP_A = '0,7 -1,6 -0,2 -1,2 -0,1 3,4 3,7 0,8 0,0 2,0'
SLEEP_B = '1,9 0,8 1,1 0,1 -0,1 4,4 5,5 1,6 4,6 3,4'
def _st(pg, test, a='', b='', side='2', mu='0', alpha='0.05'):
    pg.evaluate(f"""__go('stat');__set('st-alpha','{alpha}');__set('st-side','{side}');__set('st-mu','{mu}');__set('st-a',{a!r});__set('st-b',{b!r});__set('st-test','{test}');""")
    big = pg.evaluate("__big('#st-out')")
    p = pg.evaluate("(()=>{ const li=[...document.querySelectorAll('#st-out li')].find(l=>l.textContent.includes('p-waarde')); return li?__n(li.textContent.split('=')[1]):NaN; })()")
    return big, p

@case('Statistiek', 'Gepaarde t-toets, slaapdata', 'Student (1908), Cushny & Peebles; R: t.test(paired=TRUE) → t = −4,0621, p = 0,002833')
def _(pg):
    t, p = _st(pg, 'tp', SLEEP_A, SLEEP_B)
    return [('t', t, -4.0621, 0.001), ('p', p, 0.002833, 0.01)]

@case('Statistiek', 'F-toets + t-toets, twee groepen', 'Slaapdata; R: var.test → F = 0,7983 (1/F = 1,2526), p = 0,7427; t.test(var.equal=TRUE) → t = −1,8608, df 18, p = 0,07919')
def _(pg):
    t, p = _st(pg, 't2', SLEEP_A, SLEEP_B)
    F = pg.evaluate("__n([...document.querySelectorAll('#st-out li')][0].textContent.split('=').slice(-3)[0])")
    return [('F', F, 1/0.7983, 0.002), ('t', t, -1.8608, 0.001), ('p', p, 0.07919, 0.01)]

@case('Statistiek', 't-toets, één steekproef', 'Slaapdata middel 1 tegen 0; referentie SciPy ttest_1samp: t = 1,3257, p = 0,2176')
def _(pg):
    from scipy import stats
    r = stats.ttest_1samp([0.7,-1.6,-0.2,-1.2,-0.1,3.4,3.7,0.8,0.0,2.0], 0)
    t, p = _st(pg, 't1', SLEEP_A)
    return [('t', t, r.statistic, 0.001), ('p', p, r.pvalue, 0.01)]

@case('Statistiek', 'Wilcoxon-rangtekentoets', 'Hollander & Wolfe (depressiescores, R-voorbeeld wilcox.test): V = 40; tweezijdig p = 0,03906')
def _(pg):
    x = '1,83 0,50 1,62 2,48 1,68 1,88 1,55 3,06 1,30'; y = '0,878 0,647 0,598 2,05 1,06 1,29 1,06 3,14 1,29'
    T, p = _st(pg, 'wil', x, y)
    return [('T = min(W₊, W₋)', T, 5, 0.0001), ('p', p, 0.03906, 0.01)]

@case('Statistiek', 'Wilcoxon kritieke waarden', 'Tabellenboek Statistiek, Bijlage 11 (tweezijdig, α = 0,05): n = 6 → 0, 8 → 3, 10 → 8, 12 → 13, 15 → 25')
def _(pg):
    v = pg.evaluate("[6,8,10,12,15].map(n=>wilcoxCrit(n,0.025))")
    return [(f'n = {n}', a, e, 0.0001) for n, a, e in zip([6,8,10,12,15], v, [0,3,8,13,25])]

@case('Statistiek', 'χ²-aanpassingstoets, Mendel', 'Mendel (1866), erwten 315/108/101/32 tegen 9:3:3:1: χ² = 0,470, df 3; SciPy chisquare p = 0,9254')
def _(pg):
    pg.evaluate("__go('stat');__set('st-obs','315 108 101 32');__set('st-exp','9 3 3 1');__set('st-test','chi')")
    c = pg.evaluate("__big('#st-out')")
    p = pg.evaluate("__n([...document.querySelectorAll('#st-out li')].find(l=>l.textContent.includes('p-waarde')).textContent.split('=')[1])")
    return [('χ²', c, 0.4700, 0.002), ('p', p, 0.9254, 0.002)]

@case('Statistiek', 'Grubbs, uitbijter', 'NIST/SEMATECH e-Handbook 1.3.5.17.1 (8 uraniummetingen): G = 2,4687; tabel 10 n = 8 → 2,126')
def _(pg):
    pg.evaluate("__go('stat');__set('st-alpha','0.05');__set('st-a','199,31 199,53 200,19 200,82 201,92 201,95 202,18 245,57');__set('st-b','');__set('st-test','desc')")
    G = pg.evaluate("__n([...document.querySelectorAll('#st-desc tr')].find(r=>r.cells[0].textContent.startsWith('Grubbs G (')).cells[1].textContent)")
    Gc = pg.evaluate("__n([...document.querySelectorAll('#st-desc tr')].find(r=>r.cells[0].textContent.startsWith('Grubbs Gkrit')).cells[1].textContent)")
    return [('G', G, 2.4687, 0.0005), ('G krit', Gc, 2.126, 0.0001)]

@case('Statistiek', 'Grubbs, kritieke waarde berekend', 'Formule NIST 1.3.5.17.1 tegen Tabellenboek Bijlage 10 (n = 3–10, α = 0,05; tabel op 3 decimalen, n = 3 exact 1,1543)')
def _(pg):
    v = pg.evaluate("[3,4,5,6,7,8,9,10].map(n=>{ const t=tinv(1-0.05/(2*n),n-2); return (n-1)/Math.sqrt(n)*Math.sqrt(t*t/(n-2+t*t)); })")
    return [(f'n = {n}', a, e, 0.001) for n, a, e in zip(range(3,11), v, [1.155,1.481,1.715,1.887,2.020,2.126,2.215,2.290])]

@case('Statistiek', 'Dixon Q-toets', 'Wikipedia, Dixon’s Q test (10 waarden): Q = 0,455 < 0,466 bij 95% → geen uitbijter')
def _(pg):
    pg.evaluate("__go('stat');__set('st-a','0,189 0,167 0,187 0,183 0,186 0,182 0,181 0,184 0,181 0,177');__set('st-b','');__set('st-test','desc')")
    Q = pg.evaluate("__n([...document.querySelectorAll('#st-desc tr')].find(r=>r.cells[0].textContent.startsWith('Dixon Q (')).cells[1].textContent)")
    out = pg.evaluate("[...document.querySelectorAll('#st-desc tr')].find(r=>r.cells[0].textContent.startsWith('Dixon: uitbijter')).cells[1].textContent.trim()")
    return [('Q', Q, 0.4545, 0.002), ('uitbijter (0 = nee)', 0 if out=='geen' else 1, 0, 0)]

@case('Statistiek', 'Normaliteit (Lilliefors D)', 'Slaapdata middel 1; referentie statsmodels.stats.diagnostic.lilliefors')
def _(pg):
    from statsmodels.stats.diagnostic import lilliefors
    D, _p = lilliefors([0.7,-1.6,-0.2,-1.2,-0.1,3.4,3.7,0.8,0.0,2.0], dist='norm', pvalmethod='table')
    pg.evaluate(f"__go('stat');__set('st-a','{SLEEP_A}');__set('st-b','');__set('st-test','desc')")
    v = pg.evaluate("__n([...document.querySelectorAll('#st-desc tr')].find(r=>r.cells[0].textContent.startsWith('Normaliteit')).cells[1].textContent)")
    return [('D', v, D, 0.003)]

@case('Statistiek', 't-verdeling, kritieke waarden', 'Tabellenboek Statistiek, Bijlage 4 (tweezijdig α = 0,05): df 1 → 12,706; 5 → 2,571; 10 → 2,228; 30 → 2,042')
def _(pg):
    v = pg.evaluate("[1,5,10,30].map(d=>tinv(0.975,d))")
    return [(f'df {d}', a, e, 0.0005) for d, a, e in zip([1,5,10,30], v, [12.706,2.571,2.228,2.042])]



@case('Statistiek', 'One-way ANOVA + Tukey', 'R-dataset PlantGrowth (Dobson 1983); R aov/TukeyHSD: F = 4,846, p = 0,01591; trt2 − trt1 = 0,865 [0,174; 1,556], p = 0,012; trt1 − ctrl p = 0,391; trt2 − ctrl p = 0,198')
def _(pg):
    pg.evaluate("__go('stat');__set('st-alpha','0.05');__set('st-test','anova')")
    F = pg.evaluate("__big('#st-out')")
    p = pg.evaluate("__n([...document.querySelectorAll('#st-out li')].find(l=>l.textContent.includes('p-waarde')).textContent.split('=')[1])")
    rows = pg.evaluate("[...document.querySelectorAll('#st-tukey tbody tr')].map(r=>[__n(r.cells[1].textContent),__n(r.cells[2].textContent.split('–')[0]),__n(r.cells[2].textContent.split('–')[1]),__n(r.cells[3].textContent)])")
    return [('F', F, 4.846, 0.001), ('p', p, 0.01591, 0.01), ('trt1 − ctrl p', rows[0][3], 0.391, 0.01), ('trt2 − ctrl p', rows[1][3], 0.198, 0.01),
            ('trt2 − trt1 verschil', rows[2][0], 0.865, 0.001), ('trt2 − trt1 BI onder', rows[2][1], 0.174, 0.01), ('trt2 − trt1 BI boven', rows[2][2], 1.556, 0.005), ('trt2 − trt1 p', rows[2][3], 0.012, 0.03)]

@case('Statistiek', 'Tukey, studentized range', 'SciPy studentized_range.ppf(0,95; k, df) als referentie')
def _(pg):
    from scipy.stats import studentized_range
    out = []
    for k, df in [(3, 27), (4, 12), (5, 30)]:
        out.append((f'q krit k={k}, df={df}', pg.evaluate(f"qtukey(0.95,{k},{df})"), studentized_range.ppf(0.95, k, df), 0.003))
    return out

@case('Standaardcurve', 'LOD en LOQ (lineair)', 'ICH Q2(R2): LOD = 3,3·σ/S, LOQ = 10·σ/S met σ = reststandaardafwijking; referentie NumPy polyfit op dezelfde punten')
def _(pg):
    import numpy as np
    X = [0, 0, 5, 5, 10, 10, 20, 20, 40, 40]; Y = [0.002, 0.006, 0.101, 0.094, 0.197, 0.205, 0.389, 0.402, 0.811, 0.796]
    b, a = np.polyfit(X, Y, 1); res = np.array(Y) - (a + b*np.array(X)); s = np.sqrt((res**2).sum()/(len(X)-2))
    pg.evaluate("""__go('curve');__set('s-preset','leeg');__set('s-model','lin');__set('s-blank',false);__set('s-logx',false);
      document.querySelector('#s-std tbody').innerHTML=[[0,0.002,0.006],[5,0.101,0.094],[10,0.197,0.205],[20,0.389,0.402],[40,0.811,0.796]].map(r=>sStdRow(r)).join(''); calc.curve();""")
    lod = pg.evaluate("__kv('#s-res','LOD')"); loq = pg.evaluate("__kv('#s-res','LOQ')")
    return [('LOD', lod, 3.3*s/b, 0.005), ('LOQ', loq, 10*s/b, 0.005)]

# ---------------- Protocollen ----------------
@case('Verdunningsschema', '1:10-reeks, 1 mL per buis', 'C₁V₁ = C₂V₂: overdracht V/f = 100 µL, verdunningsmiddel 900 µL; 6 buizen → 10⁻⁶')
def _(pg):
    pg.evaluate("__go('pverd');__set('pv-f','10');__set('pv-v','1000');__set('pv-n','6');__set('pv-c0','1e9')")
    return [('overdracht (µL)', pg.evaluate("__kv('#pv-out','Overdracht')"), 100, 0.0001), ('verdunningsmiddel (µL)', pg.evaluate("__kv('#pv-out','Verdunningsmiddel per')"), 900, 0.0001)]

@case('Pipetteerschema', 'Water aanvullen en mastermix', 'Optellen: 25 − (2,5 + 0,5 + 1 + 1 + 0,125 + 1) = 18,875 µL; mastermix 4 buizen + 10% = 4,4 × 18,875 = 83,05 µL')
def _(pg):
    pg.evaluate("localStorage.removeItem('labkit:v1:proto')")
    pg.reload(); pg.wait_for_timeout(600); pg.evaluate(HELPERS)
    pg.evaluate("__go('ppip');__set('pp-tot','25');__set('pp-mm','1');__set('pp-marge','10')")
    d = pg.evaluate("document.getElementById('pp-cv')._data.rows.find(r=>/^Water/.test(r[0]))")
    return [('water per buis (µL)', d[1], 18.875, 0.0001), ('water NTC (µL)', d[4], 19.875, 0.0001), ('water mastermix (µL)', d[5], 83.05, 0.001)]

@case('PCR-programma', 'Looptijd', '2:00 + 35 × (0:30 + 0:30 + 1:00) + 5:00 = 77 min')
def _(pg):
    pg.evaluate("localStorage.removeItem('labkit:v1:proto')")
    pg.reload(); pg.wait_for_timeout(600); pg.evaluate(HELPERS)
    pg.evaluate("__go('pprog');__set('pg-cyc','35')")
    t = pg.evaluate("(()=>{ const s=[...document.querySelectorAll('#pg-out dd')][1].textContent; const h=(s.match(/(\\d+) u/)||[0,0])[1], m=(s.match(/(\\d+) min/)||[0,0])[1]; return h*60+ +m; })()")
    return [('minuten', t, 77, 0.0001)]



@case('Statistiek', 'Kruskal-Wallis + Dunn', 'R-dataset PlantGrowth; R kruskal.test: H = 7,988, p = 0,01842; Dunn met Bonferroni: referentie scikit-posthocs posthoc_dunn')
def _(pg):
    import scikit_posthocs as sp
    c=[4.17,5.58,5.18,6.11,4.50,4.61,5.17,4.53,5.33,5.14]; t1=[4.81,4.17,4.41,3.59,5.87,3.83,6.03,4.89,4.32,4.69]; t2=[6.31,5.12,5.54,5.50,5.37,5.29,4.92,6.15,5.80,5.26]
    ref = sp.posthoc_dunn([c,t1,t2], p_adjust='bonferroni').values
    pg.evaluate("__go('stat');__set('st-alpha','0.05');__set('st-groups','ctrl: 4,17 5,58 5,18 6,11 4,50 4,61 5,17 4,53 5,33 5,14\\ntrt1: 4,81 4,17 4,41 3,59 5,87 3,83 6,03 4,89 4,32 4,69\\ntrt2: 6,31 5,12 5,54 5,50 5,37 5,29 4,92 6,15 5,80 5,26');__set('st-test','kw')")
    H = pg.evaluate("__big('#st-out')")
    p = pg.evaluate("__n([...document.querySelectorAll('#st-out li')].find(l=>l.textContent.includes('p-waarde')).textContent.split('=')[1])")
    pa = pg.evaluate("[...document.querySelectorAll('#st-dunn tbody tr')].map(r=>__n(r.cells[4].textContent))")
    return [('H', H, 7.9882, 0.001), ('p', p, 0.01842, 0.01), ('Dunn trt1 − ctrl', pa[0], 1.0 if ref[0,1] > 1 else ref[0,1], 0.01), ('Dunn trt2 − ctrl', pa[1], ref[0,2], 0.01), ('Dunn trt2 − trt1', pa[2], ref[1,2], 0.01)]

@case('Standaardcurve', 'ELISA, 5PL', 'Rekentest: standaarden berekend met A = 0,05; B = 1,3; C = 400; D = 3,2; E = 0,6 (asymmetrisch, Gottschalk & Dunn 2005); monster x = 300 moet terugkomen')
def _(pg):
    pg.evaluate("""__go('curve');__set('s-preset','leeg');__set('s-model','5pl');__set('s-blank',false);
      const xs=[0,7.8,15.6,31.3,62.5,125,250,500,1000,2000], f=x=>3.2+(0.05-3.2)/Math.pow(1+Math.pow(x/400,1.3),0.6);
      document.querySelector('#s-std tbody').innerHTML=xs.map(x=>sStdRow([x,Number(f(x).toFixed(6))])).join('');
      document.querySelector('#s-unk tbody').innerHTML=sUnkRow(['test',Number(f(300).toFixed(6)),'','',1]); calc.curve();""")
    return [('terugberekend', pg.evaluate("__cells('#s-unk tbody tr [data-x]')[0]"), 300, 0.01)]

@case('Standaardcurve', 'Plaatlezer-import', 'Rekentest: plaatblok met standaarden in kolom 1–2 (A–H = 0…1500) en monsters in duplo; resultaat gelijk aan dezelfde waarden handmatig invoeren')
def _(pg):
    conc = [0,25,125,250,500,750,1000,1500]
    rowsL = []
    for i, r in enumerate('ABCDEFGH'):
        a = 0.05 + conc[i]*0.0011
        vals = [a, a+0.004] + [0.31+i*0.07, 0.315+i*0.07] + ['']*8
        rowsL.append(r + '\t' + '\t'.join(('' if v=='' else f"{v:.4f}".replace('.', ',')) for v in vals))
    txt = '\t' + '\t'.join(str(c) for c in range(1,13)) + '\n' + '\n'.join(rowsL)
    pg.evaluate(f"__go('curve');__set('s-model','lin');__set('s-blank',false);__set('s-ptxt',{txt!r});__set('s-pstd','1-2');__set('s-pconc','0 25 125 250 500 750 1000 1500');__set('s-punk','3-12');__set('s-prep','2');__set('s-pdir','h');document.getElementById('s-pgo').click();")
    nstd = pg.evaluate("document.querySelectorAll('#s-std tbody tr').length"); nunk = pg.evaluate("document.querySelectorAll('#s-unk tbody tr').length")
    import numpy as np
    X=[];Y=[]
    for i,c in enumerate(conc):
        a=0.05+c*0.0011; X+= [c,c]; Y+=[round(a,4),round(a+0.004,4)]
    b,a0=np.polyfit(X,Y,1); m=(round(0.31,4)+round(0.315,4))/2
    got = pg.evaluate("__cells('#s-unk tbody tr [data-x]')[0]")
    return [('standaarden', nstd, 8, 0), ('monsters', nunk, 8, 0), ('monster A3–A4', got, (m-a0)/b, 0.005)]

@case('Gelfoto-editor', 'Achtergrondcorrectie', 'Rekentest: profiel met schuine achtergrond (10 → 40) en een gaussische band (hoogte 100, σ 4 px, oppervlak 1002,7)')
def _(pg):
    v = pg.evaluate("""(()=>{ const n=400, pr=new Float32Array(n); for(let i=0;i<n;i++) pr[i]=10+30*i/n+100*Math.exp(-((i-200)**2)/(2*16));
      return [densArea(pr,200,'valley').area, densArea(pr,200,'ball',40).area]; })()""")
    import math
    exp = 100*4*math.sqrt(2*math.pi)
    return [('dal tot dal', v[0], exp, 0.03), ('rolling ball', v[1], exp, 0.03)]

@case('Gelfoto-editor', 'Rf-waarde', 'Rf = looplengte vanaf slotje / afstand slotje–front; front op 400 px, band op 200 px, geen slotjesrij → 0,5')
def _(pg):
    v = pg.evaluate("(()=>{ const old=gfWellRows; gfWellRows=()=>[]; __set('gf-front','400'); const r=gfRf(200); gfWellRows=old; __set('gf-front',''); return r; })()")
    return [('Rf', v, 0.5, 0.0001)]



@case('Statistiek', 'Tweeweg-ANOVA', 'Voorbeelddata (2 × 2, n = 4); referentie statsmodels ols + anova_lm (type 2)')
def _(pg):
    import pandas as pd, statsmodels.formula.api as smf
    from statsmodels.stats.anova import anova_lm
    D={('LB','30'):[0.82,0.79,0.85,0.80],('LB','37'):[1.21,1.18,1.25,1.19],('M9','30'):[0.41,0.44,0.39,0.43],('M9','37'):[0.55,0.52,0.58,0.54]}
    df=pd.DataFrame([(a,b,v) for (a,b),vs in D.items() for v in vs],columns=['A','B','y'])
    t=anova_lm(smf.ols('y ~ C(A)*C(B)',data=df).fit(),typ=2)
    pg.evaluate("__go('stat');__set('st-alpha','0.05');__set('st-test','anova2')")
    F=pg.evaluate("[...document.querySelectorAll('#st-a2 tbody tr')].slice(0,3).map(r=>__n(r.cells[4].textContent))")
    return [('F medium', F[0], t.loc['C(A)','F'], 0.002), ('F temperatuur', F[1], t.loc['C(B)','F'], 0.002), ('F interactie', F[2], t.loc['C(A):C(B)','F'], 0.002)]

@case('Statistiek', 'Lineaire regressie', 'Anscombe (1973), dataset I: helling 0,5001, intercept 3,0001, R² 0,6665; SE helling via SciPy linregress')
def _(pg):
    from scipy.stats import linregress
    X=[10,8,13,9,11,14,6,4,12,7,5]; Y=[8.04,6.95,7.58,8.81,8.33,9.96,7.24,4.26,10.84,4.82,5.68]; r=linregress(X,Y)
    xs=' '.join(str(v) for v in X); ys=' '.join(str(v).replace('.',',') for v in Y)
    pg.evaluate(f"__go('stat');__set('st-a','{xs}');__set('st-b','{ys}');__set('st-test','reg')")
    b=pg.evaluate("__kv('#st-out','Helling b')"); a=pg.evaluate("__kv('#st-out','Intercept a')")
    se=pg.evaluate("__n(document.querySelector('#st-out dl dd').textContent.split('±')[1])")
    return [('helling', b, r.slope, 0.001), ('intercept', a, r.intercept, 0.001), ('SE helling', se, r.stderr, 0.01)]

@case('Statistiek', 'Steekproefgrootte (power)', 'statsmodels TTestIndPower/TTestPower: d = 0,5, α = 0,05 tweezijdig, power 80% → 63,8 → 64 per groep; één steekproef 33,4 → 34')
def _(pg):
    pg.evaluate("__go('stat');__set('st-alpha','0.05');__set('st-side','2');__set('st-pd','0,5');__set('st-psd','1');__set('st-pw','80');__set('st-ptype','2');__set('st-test','power')")
    n2=pg.evaluate("__big('#st-out')")
    pg.evaluate("__set('st-ptype','1')"); n1=pg.evaluate("__big('#st-out')")
    return [('n per groep', n2, 64, 0), ('n (één steekproef)', n1, 34, 0)]

@case('Antibiotica-gevoeligheid', 'MIC en S/I/R', 'Rekentest: reeks 64 → 0,125 mg/L (factor 2); eerste groei in put 6 → MIC = 4 mg/L; S ≤ 8 → S. Zone 15 mm met S ≥ 20, R < 17 → R')
def _(pg):
    pg.evaluate("__go('mic');__set('mi-c0','64');__set('mi-f','2');__set('mi-n','10')")
    m=pg.evaluate("__n(document.querySelector('#mi-out tbody tr td:nth-child(2)').textContent)")
    c=pg.evaluate("document.querySelector('#mi-out tbody tr td:nth-child(3)').textContent.trim()")
    z=pg.evaluate("[...document.querySelectorAll('#mz-out tbody tr')][1].cells[2].textContent.trim()")
    return [('MIC (mg/L)', m, 4, 0), ('interpretatie S (1 = ja)', 1 if c=='S' else 0, 1, 0), ('zone 15 mm → R (1 = ja)', 1 if z=='R' else 0, 1, 0)]

@case('Groeicurves vergelijken', 'Gompertz-fit', 'Rekentest: data berekend met A = 3,5; µm = 0,8 h⁻¹; λ = 2 h (Zwietering 1990) moeten terugkomen')
def _(pg):
    import math
    g=lambda t:3.5*math.exp(-math.exp(0.8*math.e/3.5*(2-t)+1))
    txt='t\tS\n'+'\n'.join(f"{t/2}\t{0.05*math.exp(g(t/2)):.6f}".replace('.',',') for t in range(0,25))
    pg.evaluate(f"__go('gcomp');__set('gm-blank','0');__set('gm-tu','h');__set('gm-data',{txt!r})")
    v=pg.evaluate("[...document.querySelector('#gm-out tbody tr').cells].slice(1,5).map(c=>__n(c.textContent))")
    return [('µm', v[0], 0.8, 0.005), ('lag λ', v[2], 2.0, 0.01), ('A', v[3], 3.5, 0.01)]

@case('Western blot-normalisatie', 'Relatieve expressie', 'Rekentest voorbeelddata: (31500/30800 + 29800/29900)/2 gedeeld door controle-gemiddelde (15200/30100 + 14800/29500)/2')
def _(pg):
    pg.evaluate("__go('wb')")
    v=pg.evaluate("__n([...document.querySelectorAll('#wb-out tbody tr')][1].cells[2].textContent)")
    exp=((31500/30800+29800/29900)/2)/((15200/30100+14800/29500)/2)
    return [('behandeling 1', v, exp, 0.002)]

@case('qPCR-smeltcurve', 'Tm-bepaling', 'Rekentest: smeltcurven berekend met Tm 84,5 °C en een dimeerpiek bij 76,0 °C (stap 0,5 °C)')
def _(pg):
    pg.evaluate("__go('melt')")
    v=pg.evaluate("[...document.querySelectorAll('#ml-res tbody tr')].map(r=>[__n(r.cells[1].textContent),__n(r.cells[2].textContent)])")
    return [('Tm monster 1', v[0][0], 84.5, 0.002), ('dimeerpiek monster 2', v[1][1], 76.0, 0.004)]

@case('qPCR-analyse', 'Ct-export inlezen', 'CASRAI-rekenvoorbeeld als export (Sample/Target/Cq): controle 24,0/20,0, behandeld 21,5/20,2 → 6,5×')
def _(pg):
    txt='Sample\tTarget\tCq\nControle\tdoel\t24,0\nControle\tGAPDH\t20,0\nBehandeld\tdoel\t21,5\nBehandeld\tGAPDH\t20,2'
    pg.evaluate(f"__go('qpcr');__set('qp-et','100');__set('qp-er','100');__set('qp-imp',{txt!r});__set('qp-refname','GAPDH');document.getElementById('qp-impgo').click();")
    pg.wait_for_timeout(200)
    v=pg.evaluate("[...document.querySelectorAll('#qp-res table tbody tr')].map(r=>r.textContent).join('|')")
    import re
    m=re.findall(r'6,4\d|6,5\d?', v)
    return [('fold change gevonden (1 = ja)', 1 if m else 0, 1, 0)]

@case('Gelfoto-editor', 'Massa per band', 'NEB 100 bp DNA Ladder (N3231), 0,5 µg per laan: 1517–100 bp = 45, 35, 95, 27, 24, 21, 18, 97, 38, 29, 25, 48 ng (som 502 ng)')
def _(pg):
    v=pg.evaluate("stNums(LMASS.neb100).reduce((a,b)=>a+b,0)")
    return [('som ladder (ng)', v, 502, 0)]



@case('Spectrofotometrie', 'NADH, Lambert-Beer', 'Sigma-Aldrich: ε₃₄₀ NADH = 6220 M⁻¹·cm⁻¹; A = 0,311 bij 1 cm → 0,0500 mM')
def _(pg):
    pg.evaluate("__go('spec');__set('sp-a','0,311');__set('sp-e','6220');__set('sp-l','1');__set('sp-df','1');__set('sp-c','')")
    return [('mM', pg.evaluate("__big('#sp-out')"), 0.05, 0.001)]

@case('Spectrofotometrie', 'ε₂₈₀ volgens Pace', 'Pace e.a. 1995: ε = 5500·W + 1490·Y + 125·cystines; 2 W, 20 Y, 17 S–S → 11 000 + 29 800 + 2125 = 42 925 M⁻¹·cm⁻¹')
def _(pg):
    pg.evaluate("__go('spec');__set('sp-seq','');__set('sp-nw','2');__set('sp-ny','20');__set('sp-nc','17')")
    return [('ε₂₈₀', pg.evaluate("__kv('#sp-pout','ε₂₈₀')"), 42925, 0)]

@case('Eenheden omrekenen', 'Fysiologisch zout', '0,9% NaCl (58,44 g/mol) = 9 g/L = 154 mmol/L')
def _(pg):
    pg.evaluate("__go('units');__set('un-v','0,9');__set('un-u','pct');__set('un-mw','58,44')")
    t = pg.evaluate("document.querySelector('#un-out dd').textContent")
    import re
    mm = float(re.search(r'([\d,]+) mM', t).group(1).replace(',', '.'))
    return [('mM', mm, 154.0, 0.002)]

@case('Inoculum', 'Start-OD', 'C₁V₁ = C₂V₂: (1,6 − 0,05) × 1 → OD 1,55; 0,05 × 50 mL / 1,55 = 1,613 mL cultuur')
def _(pg):
    pg.evaluate("__go('inoc');__set('io-od','1,6');__set('io-df','1');__set('io-bl','0,05');__set('io-to','0,05');__set('io-v','50')")
    return [('mL cultuur', pg.evaluate("__big('#io-out')"), 0.05*50/1.55, 0.002)]



@case('Molmassa', 'Formules met kristalwater en haakjes', 'Sigma-Aldrich productspecificaties: NaCl 58,44; Na₂HPO₄·7H₂O 268,07; EDTA-Na₂·2H₂O 372,24; Ca(OH)₂ 74,09 g/mol')
def _(pg):
    out = []
    for f, m in [('NaCl', 58.44), ('Na2HPO4·7H2O', 268.07), ('C10H14N2Na2O8.2H2O', 372.24), ('Ca(OH)2', 74.09)]:
        pg.evaluate(f"__go('molm');__set('mm-f',{f!r})")
        out.append((f, pg.evaluate("__big('#mm-out')"), m, 0.0002))
    return out

@case('pH-buffer', 'Henderson-Hasselbalch', 'pH = pKₐ + log([base]/[zuur]): acetaat pKₐ 4,76 bij pH 5,00 → 10^0,24 = 1,738; fosfaat pKₐ 7,20 bij pH 7,40 → 61,3% base')
def _(pg):
    pg.evaluate("__go('hh');__set('hh-pka','4,76');__set('hh-ph','5,00')")
    r = pg.evaluate("__big('#hh-out')")
    pg.evaluate("__set('hh-pka','7,20');__set('hh-ph','7,40')")
    return [('base : zuur', r, 10**0.24, 0.002), ('% basevorm', pg.evaluate("__kv('#hh-out','Aandeel basevorm')"), 100*10**0.2/(1+10**0.2), 0.002)]

@case('Forensische matchkans', 'Productregel met θ', 'NRC II (1996) 4.1: het. 2pq = 2·0,1·0,2 = 0,04; hom. p² + p(1−p)θ = 0,01 + 0,1·0,9·0,01 = 0,0109; product 4,36 × 10⁻⁴ → 1 op 2294')
def _(pg):
    pg.evaluate("__go('rmp');__set('rm-th','0.01');document.querySelector('#rm-tbl tbody').innerHTML=[['A',0.1,0.2],['B',0.1,'']].map(rmRow).join('');calc.rmp();")
    v = pg.evaluate("__kv('#rm-out','Matchkans')")
    return [('matchkans', v, 0.04*0.0109, 0.002)]

@case('Updates', 'Versievergelijking', 'Semantische versies: 1.10.0 > 1.9.0, 1.9.0 = 1.9.0, 1.9.1 < 1.10.0')
def _(pg):
    v = pg.evaluate("[cmpVer('1.10.0','1.9.0'),cmpVer('1.9.0','1.9.0'),cmpVer('1.9.1','1.10.0')]")
    return [('1.10.0 t.o.v. 1.9.0', v[0], 1, 0), ('gelijk', v[1], 0, 0), ('1.9.1 t.o.v. 1.10.0', v[2], -1, 0)]

@case('Instellingen', 'Tekstkleur op achtergrond', 'WCAG relatieve luminantie: donkere tekst op lichtgeel (#F0E442), witte tekst op donkerblauw (#1558b0)')
def _(pg):
    v = pg.evaluate("[inkOn('#F0E442')==='#1f2933'?1:0, inkOn('#1558b0')==='#ffffff'?1:0]")
    return [('geel → donkere tekst', v[0], 1, 0), ('blauw → witte tekst', v[1], 1, 0)]



@case('Updates', 'Melding bij nieuwere release', 'Nagebootst GitHub-antwoord (releases/latest) met tag v99.0.0 en met de huidige versie')
def _(pg):
    import json
    def mk(tag): return lambda route: route.fulfill(status=200, content_type='application/json', headers={'access-control-allow-origin': '*'}, body=json.dumps({'tag_name': tag, 'html_url': 'https://example.org/r', 'published_at': '2026-11-14T00:00:00Z', 'assets': [{'name': 'Labkit-BML-99.0.0-setup.exe', 'browser_download_url': 'https://example.org/x.exe'}]}))
    pg.route('https://api.github.com/**', mk('v99.0.0'))
    pg.evaluate("__go('inst');localStorage.removeItem('labkit:v1:upd');document.getElementById('upd-check').click()"); pg.wait_for_timeout(600)
    shown = pg.evaluate("getComputedStyle(document.getElementById('upd-bar')).display!=='none' && /99\\.0\\.0/.test(document.getElementById('upd-bar').textContent) ? 1 : 0")
    pg.unroute('https://api.github.com/**'); pg.route('https://api.github.com/**', mk('v' + pg.evaluate('APPVER')))
    pg.evaluate("document.getElementById('upd-bar').style.display='none';document.getElementById('upd-check').click()"); pg.wait_for_timeout(600)
    same = pg.evaluate("getComputedStyle(document.getElementById('upd-bar')).display==='none' && /nieuwste versie/.test(document.getElementById('upd-status').textContent) ? 1 : 0")
    pg.unroute('https://api.github.com/**')
    return [('melding bij v99.0.0', shown, 1, 0), ('geen melding bij gelijke versie', same, 1, 0)]



@case('Cellen uitzaaien', '24-wellsplaat', 'Rekentest: 5 × 10⁴ cellen × 24 putjes × 1,1 = 1,32 × 10⁶ cellen; bij 8 × 10⁵ cellen/mL → 1,65 mL suspensie in 13,2 mL totaal')
def _(pg):
    pg.evaluate("__go('seed');__set('sd-c','8e5');__set('sd-fmt','1.9|0.5');__set('sd-mode','well');__set('sd-n','5e4');__set('sd-v','0,5');__set('sd-w','24');__set('sd-x','10')")
    return [('mL suspensie', pg.evaluate("__big('#sd-out')"), 1.65, 0.001)]

@case('Primers oplossen', 'Stock 100 µM', 'IDT: V (µL) = nmol / µM × 1000 → 28,4 nmol in 284 µL; werkoplossing 10 µM, 100 µL → 10 µL stock')
def _(pg):
    pg.evaluate("__go('oligo');document.querySelector('#ol-tbl tbody').innerHTML=olRow(['F',28.4]);__set('ol-s','100');__set('ol-w','10');__set('ol-wv','100')")
    return [('µL buffer', pg.evaluate("__n(document.querySelector('#ol-tbl [data-o]').textContent)"), 284, 0.001), ('µL stock', pg.evaluate("__big('#ol-out')"), 10, 0.001)]

@case('SDS-PAGE monsters', 'Laadschema', 'Rekentest: 20 µg van 2,4 µg/µL = 8,33 µL; 4× buffer in 20 µL = 5 µL; water 6,67 µL')
def _(pg):
    pg.evaluate("__go('sds');document.querySelector('#ss-tbl tbody').innerHTML=ssRow(['A',2.4]);__set('ss-ug','20');__set('ss-x','4');__set('ss-v','20')")
    v = pg.evaluate("[...document.querySelector('#ss-res tbody tr').cells].slice(1,4).map(c=>__n(c.textContent))")
    return [('monster', v[0], 8.33, 0.002), ('buffer', v[1], 5, 0.001), ('water', v[2], 6.67, 0.002)]

@case('Microscoop-kalibratie', 'IJkfactor', 'Nikon MicroscopyU: 40 oculairdelen = 10 objectdelen van 10 µm → 2,5 µm per deel; gezichtsveld FN 20 / 40× = 500 µm')
def _(pg):
    pg.evaluate("__go('micro');__set('mc-obj','40');__set('mc-fn','20');__set('mc-od','40');__set('mc-sd','10');__set('mc-su','10')")
    return [('µm per schaaldeel', pg.evaluate("__big('#mc-out')"), 2.5, 0.001), ('gezichtsveld (µm)', pg.evaluate("__kv('#mc-out','Gezichtsvelddiameter')"), 500, 0.001)]

@case('Plaatindeling', 'Groepen toevoegen', 'Vier keer een kleur toevoegen geeft 8 groepen met 8 verschillende kleuren')
def _(pg):
    pg.evaluate("__go('plaat')"); n0 = pg.evaluate("groups.length")
    pg.evaluate("for(let i=0;i<6;i++) addGroup()")
    v = pg.evaluate("[groups.length, new Set(groups.map(g=>g.c.toLowerCase())).size]")
    pg.evaluate(f"groups.splice({n0}); selG=0; renderPlate()")
    return [('groepen erbij', v[0]-n0, 6, 0), ('unieke kleuren', v[1], v[0], 0)]


def main():
    rows = []; fails = 0
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1400, 'height': 900})
        pg.add_init_script("try{localStorage.setItem('labkit:v1:lang','"+__import__('os').environ.get('LABKIT_LANG','nl')+"')}catch(e){}")
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(URL); pg.wait_for_timeout(800); pg.evaluate(HELPERS)
        for tool, name, src, fn in CASES:
            try:
                checks = fn(pg)
            except Exception as e:
                checks = [('fout bij uitvoeren', float('nan'), 0, 0)]; print('  !', tool, name, e)
            for label, got, exp, tol in checks:
                ok = got == got and abs(got - exp) <= abs(exp) * tol + 1e-9
                dev = (got - exp) / exp * 100 if exp else 0
                fails += 0 if ok else 1
                rows.append((tool, name, label, exp, got, dev, ok, src))
                print(f"{'OK ' if ok else 'FOUT'} {tool:24} {name:32} {label:28} verwacht {exp:<12.6g} Labkit {got:<12.6g} ({dev:+.2f}%)")
        b.close()
    fmtn = lambda v: (f"{v:.4g}" if abs(v) < 1e5 else f"{v:.4e}").replace('.', ',')
    md = ['# Validatie Labkit BML', '', f'Automatisch gegenereerd op {datetime.date.today().isoformat()} door `tests/validate.py`.',
          'Elke rij voert gepubliceerde of onafhankelijk berekende data in via de interface van Labkit en vergelijkt de getoonde uitkomst met de referentie.', '',
          f'**Resultaat: {len(rows) - fails} van {len(rows)} controles binnen tolerantie.**', '',
          '| Tool | Dataset | Grootheid | Referentie | Labkit | Afwijking | Status | Bron |', '|---|---|---|---:|---:|---:|---|---|']
    for tool, name, label, exp, got, dev, ok, src in rows:
        md.append(f"| {tool} | {name} | {label} | {fmtn(exp)} | {fmtn(got) if got == got else '–'} | {dev:+.2f}% | {'✅' if ok else '❌'} | {src} |")
    md += ['', 'Toleranties: rekenregels 0,1–0,5%; gepubliceerde receptgrammen (afgerond in de bron) 1–3%; densitometrie op de getekende demo-gel 5%.']
    (ROOT / 'tests' / 'VALIDATIE.md').write_text('\n'.join(md) + '\n', encoding='utf-8')
    if errs: print('Paginafouten:', errs); fails += 1
    print(f"\n{len(rows) - fails} / {len(rows)} geslaagd"); sys.exit(1 if fails else 0)

if __name__ == '__main__':
    main()
