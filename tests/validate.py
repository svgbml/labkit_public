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

def main():
    rows = []; fails = 0
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1400, 'height': 900})
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
