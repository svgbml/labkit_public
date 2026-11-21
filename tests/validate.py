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
/* De afweegcel bevat behalve de massa ook het balansadvies, waarin "mg" kan staan. De massa
   zelf staat in de <b>; kleine hoeveelheden laat de tool in mg zien, dus die worden omgerekend. */
/* het grote getal van pH bijstellen staat in mL of in µL; altijd als mL teruggeven */
window.__mlbig=()=>{ const t=__el(document.querySelector('#pa-out .big')); const n=__n(t);
  return /µL/.test(t)?n/1000:n; };
window.__mass=sel=>[...document.querySelectorAll(sel)].map(td=>{ const b=td.querySelector('b'); const t=__el(b||td); const n=__n(t); return /\bmg\b/.test(t)?n/1000:n; });
window.__cells=sel=>[...document.querySelectorAll(sel)].map(e=>__n(__el(e)));
window.__tbl=(id,rows,tool)=>{ const def=TBLDEF[id];
  /* een tabel die Vue rendert geeft een set() mee, net als bij tblRestore() in de app:
     innerHTML zou Vue bij de volgende render terugdraaien */
  if(def.set) def.set(rows); else document.querySelector("#"+id+" tbody").innerHTML=rows.map(def.row).join("");
  calc[tool](); };
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
    pg.evaluate("__go('verdunning');__set('d-c1u','X');__set('d-c2u','X');__set('d-c1','50');__set('d-c2','1');__set('d-v1','');__set('d-v2u','mL');__set('d-v1u','mL');__set('d-v2','500')")
    return [('stock (mL)', pg.evaluate("__big('#d-out')"), 10.0, 0.001)]

@case('Oplossing & buffer', 'PBS 1X, 1 L', 'Cold Spring Harbor Protocols, PBS (8 g NaCl, 0,2 g KCl, 1,44 g Na₂HPO₄, 0,24 g KH₂PO₄)')
def _(pg):
    pg.evaluate("__go('oplossing');__set('o-v','1');__set('o-vu','L');__set('o-preset','pbs')")
    vals = pg.evaluate("__mass('#o-tbl tbody tr [data-k=out]')")
    return [('NaCl (g)', vals[0], 8.0, 0.01), ('KCl (g)', vals[1], 0.2, 0.02), ('Na₂HPO₄ (g)', vals[2], 1.44, 0.02), ('KH₂PO₄ (g)', vals[3], 0.24, 0.03)]

@case('Oplossing & buffer', 'TBE 10X, 1 L', 'Bio-Rad Bulletin 6205 (108 g Tris, 55 g boorzuur per liter)')
def _(pg):
    pg.evaluate("__go('oplossing');__set('o-v','1');__set('o-vu','L');__set('o-preset','tbe10')")
    vals = pg.evaluate("__cells('#o-tbl tbody tr [data-k=out]')")
    return [('Tris (g)', vals[0], 108, 0.01), ('boorzuur (g)', vals[1], 55, 0.01)]

@case('Oplossing & buffer', 'TAE 50X, 1 L', 'Sambrook & Russell, Molecular Cloning (3e druk), Appendix 1: 242 g Tris-base en 18,6 g EDTA-Na₂·2H₂O (= 50 mM) per liter 50x TAE')
def _(pg):
    pg.evaluate("__go('oplossing');__set('o-v','1');__set('o-vu','L');__set('o-preset','tae50')")
    vals = pg.evaluate("__cells('#o-tbl tbody tr [data-k=out]')")
    return [('Tris (g)', vals[0], 242.28, 0.01), ('EDTA-Na₂·2H₂O (g)', vals[1], 18.61, 0.01)]

@case('Oplossing & buffer', 'Tris-glycine-SDS 10X, 1 L', 'Laemmli, Nature 227:680-685 (1970), 10x voorraad: 30,3 g Tris, 144 g glycine en 10 g SDS per liter')
def _(pg):
    pg.evaluate("__go('oplossing');__set('o-v','1');__set('o-vu','L');__set('o-preset','laemmli10')")
    vals = pg.evaluate("__cells('#o-tbl tbody tr [data-k=out]')")
    return [('Tris (g)', vals[0], 30.3, 0.01), ('glycine (g)', vals[1], 144.1, 0.01), ('SDS (g)', vals[2], 10, 0.01)]

@case('Oplossing & buffer', 'SOC-medium, 1 L', 'Hanahan, J Mol Biol 166:557-580 (1983): 20 g trypton, 5 g gistextract, 0,58 g NaCl (10 mM), 3,6 g glucose (20 mM) per liter')
def _(pg):
    pg.evaluate("__go('oplossing');__set('o-v','1');__set('o-vu','L');__set('o-preset','soc')")
    vals = pg.evaluate("__mass('#o-tbl tbody tr [data-k=out]')")
    return [('trypton (g)', vals[0], 20, 0.001), ('gistextract (g)', vals[1], 5, 0.001),
            ('NaCl (g)', vals[2], 0.5844, 0.01), ('glucose (g)', vals[6], 3.603, 0.01)]

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
      __tbl('s-std',xs.map(x=>[x,Number(f(x).toFixed(5))]),'curve');
      __tbl('s-unk',[['test',Number(f(300).toFixed(5)),'','',1]],'curve');""")
    v = pg.evaluate("__cells('#s-unk tbody tr [data-x]')[0]")
    return [('terugberekend (IU/L)', v, 300, 0.01)]

@case('Enzymkinetiek', 'Puromycin (behandeld)', 'Treloar 1974 via R-dataset Puromycin (Bates & Watts 1988); referentie: SciPy curve_fit')
def _(pg):
    pg.evaluate("""__go('enzym');__set('k-su','mM');__set('k-vu','µmol/min');
      const S=[0.02,0.02,0.06,0.06,0.11,0.11,0.22,0.22,0.56,0.56,1.1,1.1], v=[76,47,97,107,123,139,159,152,191,201,207,200];
      __tbl('k-tbl',S.map((s,i)=>[s,v[i],'']),'enzym');""")
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
      __tbl('gc-tbl',t.map((x,i)=>[x,Number((10**l[i]).toPrecision(6))]),'groei');""")
    return [('verdubbelingstijd (min)', pg.evaluate("__big('#gc-res')"), 26.96, 0.01)]

@case('Groeicurve', 'OD₆₀₀, twee punten in log-fase', 'Science Insights rekenvoorbeeld: OD 0,05 → 0,8 in 2 h, µ = 1,39 h⁻¹, t_d = 30 min')
def _(pg):
    pg.evaluate("""__go('groei');__set('g2-tu','h');__set('g2-type','od');__set('g2-blank','0');__set('g2-win','man');__set('g2-from','1');__set('g2-to','3');
      __tbl('gc-tbl',[[1,0.05],[2,0.2],[3,0.8]],'groei');""")
    return [('verdubbelingstijd (min)', pg.evaluate("__big('#gc-res')"), 30.0, 0.005), ('µ (h⁻¹)', pg.evaluate("__kv('#gc-res','Specifieke')"), 1.386, 0.005)]

@case('Telkamer', 'Neubauer, erytrocyten', 'ProSciTech: 528 cellen in 5 groepsvakken (0,2 mm²), 1:200 → 5,28 × 10⁶/µL')
def _(pg):
    pg.evaluate("__go('telkamer');__set('k-ch','0.1n');kSq();__set('k-sq','0.04');__set('k-live','105,106,105,106,106');__set('k-dead','');__set('k-df','200')")
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

@case('Primers oplossen', 'Primerkaart: zelfdimeer-ΔG van een GAATTC-3′-eind', 'SantaLucia 1998, ΔG°37-tabel: GAATTC/GAATTC = 2 × 0,98 (GC-eind) − 1,30 − 1,00 − 0,88 − 1,00 − 1,30 + 0,43 (symmetrie) = −3,09 kcal/mol')
def _(pg):
    pg.evaluate("__go('oligo');__set('ol-seq','test\tTTTTTTTTGAATTC')")
    g = pg.evaluate("__cells('#ol-cardout tbody tr td:nth-child(5)')")
    return [('zelfdimeer ΔG (kcal/mol)', g[0], -3.09, 0.03)]

@case('Primers oplossen', 'Primerpaar: kruisdimeer CGTTGA/TCAACG', 'SantaLucia 1998, uitgewerkt voorbeeld: 5′-CGTTGA-3′ met zijn complement, ΔG°37 = −5,35 kcal/mol')
def _(pg):
    pg.evaluate("__go('oligo');__set('ol-seq','a\tCGTTGA\\nb\tTCAACG')")
    pg.wait_for_selector('#ol-pf')  # de keuzelijsten rendert Vue pas bij twee primers
    pg.evaluate("__set('ol-pf','0');__set('ol-pr','1')")
    return [('kruisdimeer ΔG (kcal/mol)', pg.evaluate("__kv('#ol-pair','Kruisdimeer')"), -5.35, 0.02)]

def _tpl():
    """Vast pseudowillekeurig template van 1500 bp met de forward op 100 en de reverse-site op 700."""
    import random
    rnd = random.Random(44); t = ''.join(rnd.choice('ACGT') for _ in range(1500))
    f, r = 'AGCTGACCTGAAGGCTCTGAAG', 'TCGTCGTACTTGACCAGGCTAT'
    rc = r[::-1].translate(str.maketrans('ACGT', 'TGCA'))
    t = t[:100] + f + t[122:700] + rc + t[722:]
    return t, f, r, rc

@case('PCR-cyclus', 'In-silico PCR: productgrootte, lineair en circulair', 'Onafhankelijk berekend: productgrootte = einde reverse-site − begin forward-site (Python str.find op hetzelfde template); circulair met het nulpunt midden in het product')
def _(pg):
    t, f, r, rc = _tpl()
    exp = t.find(rc) + len(rc) - t.find(f)
    rot = t[400:] + t[:400]  # het nulpunt ligt nu tussen de twee primers
    pg.evaluate("([f,r,t])=>{__go('pcrcyclus');__set('y-f',f);__set('y-r',r);__set('y-circ',false);__set('y-tpl',t)}", [f, r, t])
    lin = pg.evaluate("__big('#y-pcr')")
    pg.evaluate("t=>{__set('y-circ',true);__set('y-tpl',t)}", rot)
    circ = pg.evaluate("__big('#y-pcr')")
    return [('product lineair (bp)', lin, exp, 0), ('product circulair over het nulpunt (bp)', circ, exp, 0)]

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
      __tbl('qp-tbl',[['Controle',24.0,20.0],['Behandeld',21.5,20.2]],'qpcr'); __set('qp-cal','Controle');""")
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
      __tbl('tf-tbl',{rows!r},'transf');""")
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
      __tbl('s-std',[[0,0.002,0.006],[5,0.101,0.094],[10,0.197,0.205],[20,0.389,0.402],[40,0.811,0.796]],'curve');""")
    lod = pg.evaluate("__kv('#s-res','LOD')"); loq = pg.evaluate("__kv('#s-res','LOQ')")
    return [('LOD', lod, 3.3*s/b, 0.005), ('LOQ', loq, 10*s/b, 0.005)]

# ---------------- Protocollen ----------------
@case('Verdunningsschema', '1:10-reeks, 1 mL per buis', 'C₁V₁ = C₂V₂: overdracht V/f = 100 µL, verdunningsmiddel 900 µL; 6 buizen → 10⁻⁶')
def _(pg):
    pg.evaluate("__go('pverd');__set('pv-f','10');__set('pv-v','1000');__set('pv-n','6');__set('pv-c0','1e9')")
    return [('overdracht (µL)', pg.evaluate("__kv('#pv-out','Overdracht')"), 100, 0.0001), ('verdunningsmiddel (µL)', pg.evaluate("__kv('#pv-out','Verdunningsmiddel per')"), 900, 0.0001)]

@case('Pipetteerschema', 'PCR: water aanvullen en mastermix', 'C₁V₁ = C₂V₂: buffer 10X→1X = 2,5 µL, dNTP 10→0,2 mM = 0,5 µL, primers 10→0,4 µM = 1 µL; water 25 − (2,5 + 0,5 + 1 + 1 + 0,125 + 1) = 18,875 µL; mastermix 4 buizen + 10% = 4,4 × 18,875 = 83,05 µL')
def _(pg):
    pg.evaluate("localStorage.removeItem('labkit:v1:proto')")
    pg.reload(); pg.wait_for_timeout(600); pg.evaluate(HELPERS)
    pg.evaluate("__go('ppip');__set('pp-tot','25');__set('pp-mm','1');__set('pp-marge','10')")
    d = pg.evaluate("(()=>{ const D=document.getElementById('pp-cv')._data, h=D.head, r=D.rows.find(r=>/^Water/.test(r[0])), b=D.rows.find(r=>/buffer/.test(r[0])); return [r[h.indexOf('Monster 1')], r[h.indexOf('NTC')], r[h.findIndex(x=>/^Mastermix/.test(x))], b[h.indexOf('Monster 1')]]; })()")
    return [('water per buis (µL)', d[0], 18.875, 0.0001), ('water NTC (µL)', d[1], 19.875, 0.0001), ('water mastermix (µL)', d[2], 83.05, 0.001), ('buffer 10X→1X (µL)', d[3], 2.5, 0.0001)]

@case('Pipetteerschema', 'BSA-standaardreeks uit eindconcentraties', 'Pierce BCA-handleiding (2000 µg/mL stock): V = C × 100 µL / 2000; 1500 µg/mL → 75 µL BSA + 25 µL verdunningsmiddel; 125 µg/mL → 6,25 µL')
def _(pg):
    pg.evaluate("__go('ppip');document.getElementById('pp-preset').value='bca';document.getElementById('pp-load').click()")
    d = pg.evaluate("(()=>{ const D=document.getElementById('pp-cv')._data, h=D.head, b=D.rows.find(r=>/^BSA/.test(r[0])), w=D.rows.find(r=>/^Verdunningsmiddel/.test(r[0])); return [b[h.indexOf('B')], w[h.indexOf('B')], b[h.indexOf('G')]]; })()")
    return [('BSA voor 1500 µg/mL (µL)', d[0], 75, 0.0001), ('verdunningsmiddel (µL)', d[1], 25, 0.0001), ('BSA voor 125 µg/mL (µL)', d[2], 6.25, 0.0001)]

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
      __tbl('s-std',xs.map(x=>[x,Number(f(x).toFixed(6))]),'curve');
      __tbl('s-unk',[['test',Number(f(300).toFixed(6)),'','',1]],'curve');""")
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
    pg.evaluate("__go('rmp');__set('rm-th','0.01');__tbl('rm-tbl',[['A',0.1,0.2],['B',0.1,'']],'rmp')")
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
    pg.evaluate("__go('oligo');__tbl('ol-tbl',[['F',28.4]],'oligo');__set('ol-s','100');__set('ol-w','10');__set('ol-wv','100')")
    return [('µL buffer', pg.evaluate("__n(document.querySelector('#ol-tbl [data-o]').textContent)"), 284, 0.001), ('µL stock', pg.evaluate("__big('#ol-out')"), 10, 0.001)]

@case('SDS-PAGE monsters', 'Laadschema', 'Rekentest: 20 µg van 2,4 µg/µL = 8,33 µL; 4× buffer in 20 µL = 5 µL; water 6,67 µL')
def _(pg):
    pg.evaluate("__go('sds');__tbl('ss-tbl',[['A',2.4]],'sds');__set('ss-ug','20');__set('ss-x','4');__set('ss-v','20')")
    v = pg.evaluate("[...document.querySelector('#ss-res tbody tr').cells].slice(1,4).map(c=>__n(c.textContent))")
    return [('monster', v[0], 8.33, 0.002), ('buffer', v[1], 5, 0.001), ('water', v[2], 6.67, 0.002)]

@case('Microscoop-kalibratie', 'IJkfactor', 'Nikon MicroscopyU: 40 oculairdelen = 10 objectdelen van 10 µm → 2,5 µm per deel; gezichtsveld FN 20 / 40× = 500 µm')
def _(pg):
    pg.evaluate("__go('micro');__set('mc-obj','40');__set('mc-fn','20');__set('mc-od','40');__set('mc-sd','10');__set('mc-su','10')")
    return [('µm per schaaldeel', pg.evaluate("__big('#mc-out')"), 2.5, 0.001), ('gezichtsveld (µm)', pg.evaluate("__kv('#mc-out','Gezichtsvelddiameter')"), 500, 0.001)]

@case('Plaatindeling', 'Groepen toevoegen', 'Vier keer een kleur toevoegen geeft 8 groepen met 8 verschillende kleuren')
def _(pg):
    pg.evaluate("__go('plaat')")
    before = pg.evaluate("wPld.get().groups")
    n0 = len(before)
    # de plaatontwerper voegt groepen toe via de knop "+ kleur toevoegen" in de legenda
    pg.evaluate("for(let i=0;i<6;i++) document.querySelector('#w-pld [data-pl=\"add\"]').click()")
    v = pg.evaluate("(()=>{const g=wPld.get().groups; return [g.length, new Set(g.map(x=>x.c.toLowerCase())).size];})()")
    pg.evaluate("g=>wPld.set({fmt:wPld.get().fmt,wells:wPld.get().wells,vals:wPld.get().vals,groups:g})", before)
    return [('groepen erbij', v[0]-n0, 6, 0), ('unieke kleuren', v[1], v[0], 0)]


# ---------------- Nieuwe tools (v1.14) ----------------
@case('MPN', '3-buizenreeks 3-1-0', 'FDA BAM Appendix 2, tabel 1 (0,1/0,01/0,001 g): 3-1-0 → 43 MPN/g')
def _(pg):
    pg.evaluate("__go('mpn');__tbl('mp-tbl',[[0.1,3,3],[0.01,3,1],[0.001,3,0]],'mpn')")
    return [('MPN per g', pg.evaluate("__big('#mp-out')"), 43, 0.03)]

@case('MPN', '3-buizenreeks 2-1-0', 'FDA BAM Appendix 2, tabel 1: 2-1-0 → 15 MPN/g')
def _(pg):
    pg.evaluate("__tbl('mp-tbl',[[0.1,3,2],[0.01,3,1],[0.001,3,0]],'mpn')")
    return [('MPN per g', pg.evaluate("__big('#mp-out')"), 15, 0.05)]

@case('Titratiecurve', '25 mL 0,1 M azijnzuur met 0,1 M NaOH', 'Harris, Quantitative Chemical Analysis: pH start 2,88; ½-eq = pKₐ 4,76; equivalentiepunt 8,72')
def _(pg):
    pg.evaluate("__go('titr');__set('ti-type','acid');__set('ti-pka','4,76');__set('ti-ca','0,1');__set('ti-va','25');__set('ti-cb','0,1')")
    v = pg.evaluate("[...document.querySelectorAll('#ti-out tbody tr')].map(r=>__n(r.cells[2].textContent))")
    return [('pH start', v[0], 2.88, 0.005), ('pH ½-equivalentie', v[1], 4.76, 0.003), ('pH equivalentiepunt', v[2], 8.72, 0.003)]

@case('Kjeldahl', 'Melk, factor 6,38', 'AOAC 991.20: %N = 1,4007·c·(V−Vb)/m → 1,4007·0,1·15,2/1,0025 = 2,1237%; eiwit ×6,38 = 13,549%')
def _(pg):
    pg.evaluate("__go('kjel');__set('kj-m','1,0025');__set('kj-c','0,1');__set('kj-vs','15,40');__set('kj-vb','0,20');__set('kj-f','6.38')")
    return [('% eiwit', pg.evaluate("__big('#kj-out')"), 13.549, 0.001)]

@case('Osmolariteit & ionsterkte', 'Fysiologisch zout 154 mM NaCl', 'Ideale osmolariteit 2 × 154 = 308 mOsm/L; ionsterkte ½(154·1 + 154·1) = 154 mM')
def _(pg):
    pg.evaluate("__go('osmo');__set('os-phi','1');__tbl('os-tbl',[['NaCl',154,'']],'osmo')")
    return [('mOsm/L', pg.evaluate("__big('#os-out')"), 308, 0.001), ('ionsterkte (mM)', pg.evaluate("__kv('#os-out','Ionsterkte')"), 154, 0.001)]

@case('Verwantschapsindex', 'Trio, obligaat allel', 'Butler (2015) hfst. 15: vader heterozygoot voor obligaat allel → PI = 1/(2p); homozygoot → 1/p; CPI = product')
def _(pg):
    pg.evaluate("__go('kin');__set('kn-mo','1');__tbl('kn-tbl',[['L1',15,17,0.26,0.20,15,16,17,18],['L2',21,24,0.17,0.14,22,24,21,21]],'kin')")
    pis = pg.evaluate("[...document.querySelectorAll('#kn-out tbody tr')].map(r=>__n(r.cells[1].textContent))")
    return [('PI heterozygote vader', pis[0], 2.5, 0.001), ('PI homozygote vader', pis[1], 1/0.17, 0.002), ('CPI', pg.evaluate("__big('#kn-out')"), 2.5/0.17, 0.003)]

@case('Y-STR / mtDNA-frequentie', 'Niet waargenomen in 4500', 'SWGDAM Y-STR-richtlijnen: bovengrens 1 − 0,05^(1/N) = 6,655 × 10⁻⁴')
def _(pg):
    pg.evaluate("__go('ystr');__set('ys-x','0');__set('ys-n','4500');__set('ys-cl','0.95');__set('ys-th','0')")
    return [('bovengrens', pg.evaluate("__big('#ys-out')"), 1-0.05**(1/4500), 0.002)]

@case('Bloedvlekpatronen', 'Inslaghoek', 'Balthazard: arcsin(5/10) = 30°; arcsin(2,6/5,9) = 26,1°')
def _(pg):
    pg.evaluate("__go('bpa');__tbl('bp-tbl',[['a',5,10,'','',''],['b',2.6,5.9,'','','']],'bpa')")
    a = pg.evaluate("[...document.querySelectorAll('#bp-out tbody tr')].map(r=>__n(r.cells[2].textContent))")
    import math
    return [('α vlek a (°)', a[0], 30.0, 0.002), ('α vlek b (°)', a[1], math.degrees(math.asin(2.6/5.9)), 0.003)]

@case('Tijd sinds overlijden', 'Henssge, T_a 18 °C', 'Onafhankelijk opgelost met SciPy brentq uit de Henssge-vergelijking (Henssge & Madea 2004): T_r 30,5 °C, 75 kg, CF 1')
def _(pg):
    import math
    from scipy.optimize import brentq
    B = -1.2815*(75)**-0.625+0.0284; q = (30.5-18)/(37.2-18)
    t = brentq(lambda t: 1.25*math.exp(B*t)-0.25*math.exp(5*B*t)-q, 0.01, 200)
    pg.evaluate("__go('pmi');__set('pm-tr','30,5');__set('pm-ta','18');__set('pm-w','75');__set('pm-cf','1');__set('pm-at','')")
    h = pg.evaluate("(()=>{ const t=document.querySelector('#pm-out .big').textContent; const m=t.match(/(\\d+)\\D+(\\d+)/); return +m[1]+ +m[2]/60; })()")
    return [('PMI (h)', h, t, 0.005)]

@case('Pipetkalibratie', 'INTEGRA-rekenvoorbeeld', 'INTEGRA, Calibration check: volumes 100,40/100,42/100,43/100,54/100,47 µL → V̄ 100,452 µL, e_s 0,45%')
def _(pg):
    z = 1.0029; ms = ' '.join(f"{v/z:.5f}".replace('.', ',') for v in [100.40, 100.42, 100.43, 100.54, 100.47])
    pg.evaluate(f"__go('pipcal');__set('pc-v','100');__set('pc-nom','100');__set('pc-t','20');__set('pc-ch','1');__set('pc-m','{ms}')")
    return [('gemiddeld volume (µL)', pg.evaluate("__big('#pc-out')"), 100.452, 0.0001), ('e_s (%)', pg.evaluate("__kv('#pc-out','Systematische')"), 0.45, 0.02)]

@case('Dosis-respons (IC50/EC50)', '4PL zonder ruis', 'Data berekend uit y = 0,05 + 0,95/(1 + (x/3)^1,2): de fit moet IC50 = 3 teruggeven')
def _(pg):
    xs = [0.1, 0.3, 1, 3, 10, 30, 100]; f = lambda x: 0.05+0.95/(1+(x/3)**1.2)
    rows = [[x, round(f(x), 6), round(f(x), 6), ''] for x in xs]
    pg.evaluate(f"__go('ic50');__set('ic-norm','raw');__tbl('ic-tbl',{rows},'ic50')")
    return [('IC50', pg.evaluate("__big('#ic-out')"), 3.0, 0.005)]

@case('Sterilisatie (D, z, F₀)', 'F₀ van 15 min op 121,1 °C', 'Ph. Eur. 5.1.5: F₀ = Δt·Σ10^((T−121,1)/10) = 15 min; D uit log-lineaire overleving met D = 2,5 min')
def _(pg):
    pg.evaluate("__go('steril');__set('ste-dt','1');__set('ste-z','10');__set('ste-log','"+' '.join(['121,1']*15)+"');__set('ste-t','0 2,5 5 7,5');__set('ste-n','1e6 1e5 1e4 1e3')")
    return [('F₀ (min)', pg.evaluate("__kv('#ste-out','F₀')"), 15, 0.001), ('D-waarde (min)', pg.evaluate("__kv('#ste-out','D-waarde')"), 2.5, 0.001)]

@case('RNA-kwaliteit', 'Concentratie', 'Thermo Fisher T042: c = A260 × 40 × verdunning = 0,5 × 40 × 20 = 400 ng/µL')
def _(pg):
    pg.evaluate("__go('rnaq');__set('rq-a260','0,5');__set('rq-df','20');__set('rq-l','1')")
    return [('ng/µL', pg.evaluate("__big('#rq-out')"), 400, 0.0001)]

@case('cDNA-synthese (RT-mix)', 'RNA-volume en mix', 'High-Capacity cDNA RT Kit: 1000 ng uit 412 ng/µL = 2,427 µL; 2× mix per reactie 10 µL, 5 reacties + 10% = 55 µL')
def _(pg):
    pg.evaluate("__go('cdna');__set('cd-in','1000');__set('cd-vr','10');__set('cd-nort','1');__set('cd-mar','10');__tbl('cd-tbl',[['A',412],['B',388],['C',256],['D',1190]],'cdna')")
    v = pg.evaluate("__n([...document.querySelectorAll('#cd-out table')][1].querySelector('tbody tr').cells[1].textContent)")
    return [('RNA monster A (µL)', v, 1000/412, 0.002), ('mastermix (µL)', pg.evaluate("__big('#cd-out')"), 55, 0.001)]

@case('Celpassageplanner', 'Splitsing 1:4', 'N = N₀·2^(t/t_d): 1:4 bij t_d 24 h → 48 h + 12 h herstel = 2 d 12 u')
def _(pg):
    pg.evaluate("__go('passage');__set('ps-td','24');__set('ps-lag','12');__set('ps-n','2e6')")
    t = pg.evaluate("(()=>{ const r=[...document.querySelectorAll('#ps-out tbody tr')].find(r=>r.cells[0].textContent.trim()==='1:4'); const m=r.cells[2].textContent.match(/(\\d+) d (\\d+)/); return +m[1]*24+ +m[2]; })()")
    return [('uren tot confluent', t, 60, 0.001)]

@case('Meetonzekerheid', 'Relatieve onzekerheid', 'GUM/QUAM: √((0,0005/5,844)² + (0,005/√3/0,995)² + (0,4/√6/1000)²) = 0,2914%')
def _(pg):
    pg.evaluate("__go('munc');__set('mu-res','0,1');__set('mu-k','2');__tbl('mu-tbl',[['m',5.844,0.0005,MUT[0]],['P',0.995,0.005,MUT[1]],['V',1000,0.4,MUT[2]]],'munc')")
    import math
    ref = math.sqrt((0.0005/5.844)**2+(0.005/math.sqrt(3)/0.995)**2+(0.4/math.sqrt(6)/1000)**2)*100
    return [('u_c,rel (%)', pg.evaluate("__kv('#mu-out','Relatieve')"), ref, 0.002)]

@case('STR-profielcontrole', 'Piekhoogteverhouding', 'PHR = laagste/hoogste piek: 290/610 = 47,5%; 2 bijdragers bij 4 allelen')
def _(pg):
    pg.evaluate("__go('strchk');__tbl('sc-tbl',[['FGA',21,610],['FGA',24,290],['D8',12,880],['D8',13,930],['D8',14,410],['D8',15,380]],'strchk')")
    phr = pg.evaluate("__n(document.querySelector('#sc-out tbody tr').cells[2].textContent)")
    return [('PHR (%)', phr, 290/610*100, 0.02), ('min. bijdragers', pg.evaluate("__big('#sc-out')"), 2, 0)]

@case('qPCR-plaatindeling', 'Aantal wells', '4 monsters × 3 replicaten + 1 NTC × 3 = 15 wells per doelgen; 2 doelgenen = 30')
def _(pg):
    pg.evaluate("__go('qplate');__set('qp2-fmt','96');__set('qp2-rep','3');__set('qp2-s','A, B, C, D');__set('qp2-t','G1, G2');__set('qp2-std','0');__set('qp2-ntc','1')")
    return [('wells gebruikt', pg.evaluate("__kv('#qp2-out','Wells gebruikt')"), 30, 0)]

# ---------------- Nieuwe tools (v1.15) ----------------
@case('Bloedalcohol (Widmark)', 'Eén drankje, man 80 kg', 'Widmark: 500 mL × 5% × 0,789 = 19,725 g; 19,725/(0,68·80) × 1,055 = 0,3825 g/L; terugrekenen 0,62 + β·1,75 h; Seidl man: 0,31608 − 0,004821·80 + 0,004632·180')
def _(pg):
    pg.evaluate("__go('widmark');__set('wd-sex','m');__set('wd-w','80');__set('wd-h','180');__set('wd-rm','w');__set('wd-b','0,15');__tbl('wd-tbl',[['Bier',500,5,'20:00']],'widmark');__set('wd-m','0,62');__set('wd-mt','01:30');__set('wd-it','23:45');__set('wd-b1','0,10');__set('wd-b2','0,25')")
    peak = pg.evaluate("__big('#wd-out')")
    lo = pg.evaluate("__n(document.querySelectorAll('#wd-out .big')[1].textContent)")
    hi = pg.evaluate("__n(document.querySelectorAll('#wd-out .big')[1].textContent.split('–')[1])")
    pg.evaluate("__set('wd-rm','s')"); r = pg.evaluate("__kv('#wd-out','Verdelingsfactor')")
    return [('piek (g/L)', peak, 19.725/(0.68*80)*1.055, 0.02), ('teruggerekend laag', lo, 0.62+0.10*1.75, 0.01), ('teruggerekend hoog', hi, 0.62+0.25*1.75, 0.01), ('r Seidl', r, 0.31608-0.004821*80+0.004632*180, 0.002)]

@case('Lichaamslengte uit botten', 'Femur man en tibia vrouw', 'Trotter (1970) via Bass (1995): 2,32 × 47,2 + 65,53 = 175,03 cm; vrouw: 2,90 × 36,0 + 61,53 = 165,93 cm, met leeftijdscorrectie −0,06·(50 − 30)')
def _(pg):
    pg.evaluate("__go('stature');['fib','hum','rad','uln','tib'].forEach(k=>__set('sl-'+k,''));__set('sl-sex','m');__set('sl-pop','w');__set('sl-age','');__set('sl-fem','47,2')")
    m = pg.evaluate("__big('#sl-out')")
    pg.evaluate("__set('sl-fem','');__set('sl-sex','v');__set('sl-tib','36');__set('sl-age','50')")
    v = pg.evaluate("__big('#sl-out')")
    return [('man, femur (cm)', m, 2.32*47.2+65.53, 0.001), ('vrouw, tibia, 50 jaar (cm)', v, 2.90*36+61.53-1.2, 0.001)]

@case('Entomologie (graaddagen)', 'Constante temperatuur', '10 dagen van 15 °C met drempel 10 °C geven 5 °C·d per dag; 32 °C·d is na 6,4 dagen bereikt')
def _(pg):
    pg.evaluate("__go('ento');__set('en-base','10');__set('en-add','32');__set('en-off','0');__set('en-meth','avg');__set('en-t',Array(10).fill('15').join('\\n'))")
    return [('minimaal PMI (d)', pg.evaluate("__big('#en-out')"), 6.4, 0.001)]

@case('Glasvergelijking (brekingsindex)', 't-toets van Welch', 'Onafhankelijk berekend met scipy.stats.ttest_ind(equal_var=False)')
def _(pg):
    from scipy import stats
    K = [1.51824, 1.51828, 1.51821, 1.51830, 1.51826, 1.51823, 1.51827, 1.51825, 1.51829, 1.51822]; R = [1.51826, 1.51834, 1.51829, 1.51837]
    pg.evaluate(f"__go('glass');__set('gl-smin','0');__set('gl-crit','4');__set('gl-k','{' '.join(str(v).replace('.',',') for v in K)}');__set('gl-r','{' '.join(str(v).replace('.',',') for v in R)}')")
    t = stats.ttest_ind(R, K, equal_var=False)
    return [('t', pg.evaluate("__kv('#gl-out','t (Welch)')"), t.statistic, 0.002), ('p', pg.evaluate("__kv('#gl-out','p')"), t.pvalue, 0.01)]

@case('Hardy-Weinberg & forensische kengetallen', 'Kengetallen en exacte toets', 'Onafhankelijk in Python: H_e (Nei), PD, PIC, PE = h²(1 − 2hH²); exacte HWE-toets voor twee allelen met de volledige verdeling (Wigginton e.a., Am J Hum Genet 76:887–893, 2005)')
def _(pg):
    import math
    from collections import Counter
    G = [('12','12',30),('12','13',40),('13','13',30)]
    pg.evaluate("__go('hwe');__set('hw-g','12 12 30\\n12 13 40\\n13 13 30')")
    n = 100; nA = 2*30+40; nAB = 40
    def prob(h):
        aa = (nA-h)//2; bb = n-aa-h
        return math.lgamma(n+1)-math.lgamma(aa+1)-math.lgamma(h+1)-math.lgamma(bb+1)+h*math.log(2)+math.lgamma(nA+1)+math.lgamma(2*n-nA+1)-math.lgamma(2*n+1)
    hs = [h for h in range(nA % 2, min(nA, 2*n-nA)+1, 2)]; P = {h: math.exp(prob(h)) for h in hs}; pex = sum(v for v in P.values() if v <= P[nAB]*(1+1e-9))
    p = [0.5, 0.5]; He = 2*n/(2*n-1)*(1-sum(x*x for x in p)); PD = 1-sum((c/n)**2 for _,_,c in G); h = 0.4; Hh = 0.6
    return [('exacte p', pg.evaluate("__big('#hw-out')"), pex, 0.06), ('H_e', pg.evaluate("__kv('#hw-out','H')"), 0.4, 0.001), ('PD', pg.evaluate("__kv('#hw-out','Discriminatiekracht')"), PD, 0.001), ('PE', pg.evaluate("__kv('#hw-out','Uitsluitingskans')"), h*h*(1-2*h*Hh*Hh), 0.002)]

@case('Chromatografie (HPLC/GC)', 'Plaatgetal en resolutie', 'USP <621>: N = 5,54·(4,95/0,110)² = 11 219; R_s = 1,18·(4,95 − 3,42)/(0,082 + 0,110) = 9,40; k = (4,95 − 1,10)/1,10 = 3,50')
def _(pg):
    pg.evaluate("__go('chrom');__set('chr-t0','1,10');__set('chr-wt','h');__tbl('chr-tbl',[['a',3.42,0.082,'',''],['b',4.95,0.110,'','']],'chrom')")
    row = pg.evaluate("[...[...document.querySelectorAll('#chr-out tbody tr')][1].cells].map(td=>__n(td.textContent))")
    return [('k', row[2], 3.5, 0.002), ('N', row[3], 5.54*(4.95/0.110)**2, 0.001), ('R_s', row[7], 1.18*(4.95-3.42)/(0.082+0.110), 0.002)]

@case('Interne standaard & standaardadditie', 'Exacte lijnen', 'IS: verhouding = 0,2·c, monster met verhouding 0,7 → 3,5; standaardadditie: signaal = 0,1 + 0,05·x geeft x_E = 2, × verdunning 5 = 10')
def _(pg):
    pg.evaluate("__go('istd');__set('isd-mode','is');__tbl('isd-tbl',[[1,2000,10000],[2,4000,10000],[5,10000,10000],[10,20000,10000]],'istd');__tbl('isd-unk',[['M',7000,10000,1]],'istd')")
    a = pg.evaluate("__big('#isd-out')")
    pg.evaluate("__set('isd-mode','sa');__set('isd-df','5');__tbl('isd-sa',[[0,0.1],[2,0.2],[4,0.3],[6,0.4]],'istd')")
    return [('IS-monster', a, 3.5, 0.001), ('standaardadditie', pg.evaluate("__big('#isd-out')"), 10, 0.001)]

@case('Waterhardheid (EDTA-titratie)', 'Totale hardheid', 'ISO 6059: 0,0100 M × (12,35 − 0,05) mL / 50,00 mL = 2,460 mmol/L = 13,79 °dH (× 5,6077)')
def _(pg):
    pg.evaluate("__go('edta');__set('ed-c','0,0100');__set('ed-vs','50');__set('ed-vt','12,35');__set('ed-vb','0,05');__set('ed-vca','')")
    return [('mmol/L', pg.evaluate("__big('#ed-out')"), 2.46, 0.001), ('°dH', pg.evaluate("__kv('#ed-out','Duitse')"), 2.46*5.60774, 0.002)]

@case('Buffercapaciteit', 'Eenwaardig zuur', 'Van Slyke: β = 2,303·(K_w/[H⁺] + [H⁺] + C·K_a[H⁺]/(K_a + [H⁺])²), pKₐ 7,20, C = 50 mM, pH 6,80')
def _(pg):
    import math
    h = 10**-6.8; Ka = 10**-7.2; C = 0.05; b = 2.303*(1e-14/h + h + C*Ka*h/(Ka+h)**2)*1000
    pg.evaluate("__go('bufcap');__set('bc-pka','7.20');__set('bc-c','50');__set('bc-ph','6,80')")
    return [('β (mM/pH)', pg.evaluate("__big('#bc-out')"), b, 0.003)]

@case('Oplosbaarheid (Ksp)', 'AgCl en CaF₂', 'AgCl in 0,01 M Cl⁻: s = (−0,01 + √(10⁻⁴ + 4K_sp))/2; CaF₂ zuiver water: s = (K_sp/4)^(1/3)')
def _(pg):
    import math
    pg.evaluate("__go('ksp');__set('ks-k','1,77e-10');__set('ks-x','1');__set('ks-y','1');__set('ks-cc','0');__set('ks-ca','0,01');__set('ks-qc','');__set('ks-qa','')")
    a = pg.evaluate("__big('#ks-out')")
    pg.evaluate("__set('ks-k','3,45e-11');__set('ks-y','2');__set('ks-ca','0')")
    c = pg.evaluate("__big('#ks-out')")
    return [('AgCl met Cl⁻ (mol/L)', a, (-0.01+math.sqrt(1e-4+4*1.77e-10))/2, 0.005), ('CaF₂ (mol/L)', c, (3.45e-11/4)**(1/3), 0.005)]

@case('Assaykwaliteit (Z′-factor)', 'Z′', 'Zhang e.a. (1999): Z′ = 1 − 3(σp + σn)/|μp − μn|, onafhankelijk berekend met numpy (SD met n − 1)')
def _(pg):
    import numpy as np
    P = [1.80, 1.85, 1.90, 1.82, 1.88, 1.86, 1.79, 1.91]; N = [0.20, 0.22, 0.19, 0.21, 0.23, 0.20, 0.18, 0.22]
    z = 1-3*(np.std(P, ddof=1)+np.std(N, ddof=1))/abs(np.mean(P)-np.mean(N))
    pg.evaluate(f"__go('zprime');__set('zp-pos','{' '.join(str(v).replace('.',',') for v in P)}');__set('zp-neg','{' '.join(str(v).replace('.',',') for v in N)}');__set('zp-s','')")
    return [('Z′', pg.evaluate("__big('#zp-out')"), z, 0.002)]

@case('Transfectie (Lipofectamine 3000)', '6-well', 'Thermo Fisher MAN0009872: 6-well 2 × 125 µL Opti-MEM, 2,5 µg DNA, 5 µL P3000, 7,5 µL Lipofectamine 3000 (hoog)')
def _(pg):
    pg.evaluate("__go('transfect');__set('trf-type','dna');__set('trf-fmt','5');__set('trf-dose','hi');__set('trf-n','1');__set('trf-x','0');__set('trf-st','1')")
    rows = pg.evaluate("[...document.querySelectorAll('#trf-out table')].map(t=>[...t.querySelectorAll('tbody tr')].map(r=>__n(r.cells[1].textContent)))")
    return [('Opti-MEM per buis (µL)', rows[0][0], 125, 0.001), ('DNA (µL van 1 µg/µL)', rows[0][1], 2.5, 0.001), ('P3000 (µL)', rows[0][2], 5, 0.001), ('Lipofectamine 3000 (µL)', rows[1][1], 7.5, 0.001)]

@case('Viabiliteit (trypaanblauw)', 'Neubauer-telling', 'Strober (2015): 182 levend / 4 vierkanten × 2 × 10⁴ = 9,10 × 10⁵ per mL; viabiliteit 182/196 = 92,86%')
def _(pg):
    pg.evaluate("__go('viab');__set('vb-l','182');__set('vb-d','14');__set('vb-sq','4');__set('vb-df','2')")
    return [('levend/mL', pg.evaluate("__big('#vb-out')"), 9.1e5, 0.001), ('viabiliteit (%)', pg.evaluate("__kv('#vb-out','Viabiliteit')"), 182/196*100, 0.001)]

@case('Desinfectietest (log-reductie)', 'EN 1276', 'N = 3,0 × 10⁸ kve/mL, N₀ = N/10, N_a = 300 kve/mL: R = lg(3 × 10⁷) − lg 300 = 5,00')
def _(pg):
    pg.evaluate("__go('desinf');__set('ds-req','5');__set('ds-dil','10');__set('ds-dl','140');__tbl('ds-tbl',[['org',3e8,300]],'desinf')")
    r = pg.evaluate("__n(document.querySelector('#ds-out tbody tr').cells[3].textContent)")
    return [('reductie (lg)', r, 5.0, 0.001)]

@case('Bland-Altman (methodevergelijking)', 'Bias en grenzen', 'Bland & Altman (1986): d̄ ± 1,96·s_d, onafhankelijk berekend met numpy')
def _(pg):
    import numpy as np
    A = [4.8, 6.2, 7.9, 5.5, 9.8, 3.1, 6.7, 8.4]; B = [5.1, 6.0, 8.3, 5.9, 10.4, 3.0, 7.2, 8.6]
    d = np.array(B)-np.array(A); b = d.mean(); s = d.std(ddof=1)
    pg.evaluate("__go('bland');__set('ba-m','abs');__set('ba-lim','');__set('ba-d',"+repr('\n'.join(f"{a} {c}".replace('.',',') for a,c in zip(A,B)))+")")
    lo = pg.evaluate("__kv('#ba-out','Grenzen')"); hi = pg.evaluate("__n(([...document.querySelectorAll('#ba-out dt')].find(d=>d.textContent.startsWith('Grenzen')).nextElementSibling.textContent.split('–')[1]))")
    return [('bias', pg.evaluate("__big('#ba-out')"), b, 0.002), ('ondergrens', lo, b-1.96*s, 0.003), ('bovengrens', hi, b+1.96*s, 0.003)]

@case('ROC-curve & diagnostische test', 'AUC', 'AUC = U/(n_p·n_n) uit scipy.stats.mannwhitneyu')
def _(pg):
    from scipy import stats
    P = [2.8, 3.5, 1.9, 4.2, 3.1, 2.4, 5.0, 3.8, 2.2]; N = [1.1, 0.8, 1.5, 2.0, 0.6, 2.4, 1.9, 0.9, 1.2, 2.6]
    U = stats.mannwhitneyu(P, N).statistic
    pg.evaluate(f"__go('roc');__set('ro-dir','hi');__set('ro-c','');__set('ro-p','{' '.join(str(v).replace('.',',') for v in P)}');__set('ro-n','{' '.join(str(v).replace('.',',') for v in N)}')")
    return [('AUC', pg.evaluate("__big('#ro-out')"), U/(len(P)*len(N)), 0.002)]

@case('Overlevingscurve (Kaplan-Meier)', 'Mediaan en log-ranktoets', 'scipy.stats.ecdf (Kaplan-Meier) en scipy.stats.logrank op dezelfde gecensureerde data')
def _(pg):
    from scipy import stats
    import numpy as np
    g1 = [(3,1),(5,1),(6,1),(6,0),(8,1),(9,1),(11,1),(12,0),(14,1),(15,0)]; g2 = [(5,1),(8,0),(10,1),(12,1),(14,0),(16,1),(18,0),(20,1),(22,0),(25,0)]
    cd = lambda g: stats.CensoredData(uncensored=[t for t,e in g if e], right=[t for t,e in g if not e])
    lr = stats.logrank(cd(g1), cd(g2))
    sf = stats.ecdf(cd(g1)).sf; med = sf.quantiles[np.argmax(sf.probabilities <= 0.5)]
    txt = '\\n'.join([f"controle {t} {e}" for t,e in g1]+[f"behandeld {t} {e}" for t,e in g2])
    pg.evaluate(f"__go('km');__set('km-d','{txt}')")
    chi = pg.evaluate("(()=>{ const dt=[...document.querySelectorAll('#km-out dt')].find(d=>d.textContent.startsWith('Log')); return __n(dt.nextElementSibling.textContent.split('=')[1]); })()")
    p = pg.evaluate("(()=>{ const dt=[...document.querySelectorAll('#km-out dt')].find(d=>d.textContent.startsWith('Log')); return __n(dt.nextElementSibling.textContent.split('p')[1]); })()")
    m = pg.evaluate("__n(document.querySelector('#km-out tbody tr').cells[3].textContent)")
    return [('mediaan controle', m, float(med), 0.001), ('χ²', chi, lr.statistic**2, 0.005), ('p', p, lr.pvalue, 0.02)]

@case('Significante cijfers & afronden', 'Afronden en onzekerheid', 'Half naar boven: 0,004565 → 0,00457; half naar even: 0,00456; 9,995 → 10,0; GUM §7.2.6: 0,0045650 ± 0,0000234 → 0,004565 ± 0,000023')
def _(pg):
    pg.evaluate("__go('sigfig');__set('sf-x','0,004565');__set('sf-n','3');__set('sf-m','up');__set('sf-u','')")
    up = pg.evaluate("__big('#sf-out')")
    pg.evaluate("__set('sf-m','even')"); ev = pg.evaluate("__big('#sf-out')")
    pg.evaluate("__set('sf-m','up');__set('sf-x','9,995')"); nn = pg.evaluate("document.querySelector('#sf-out .big').textContent.trim()")
    pg.evaluate("__set('sf-x','0,0045650');__set('sf-u','0,0000234');__set('sf-ud','2')"); u = pg.evaluate("document.querySelectorAll('#sf-out .big')[1].textContent.trim()")
    return [('half naar boven', up, 0.00457, 0), ('half naar even', ev, 0.00456, 0), ('9,995 → 3 cijfers', 1 if nn=='10,0' else 0, 1, 0), ('met onzekerheid', 1 if u=='0,004565 ± 0,000023' else 0, 1, 0)]

@case('Welke pipet?', '15 µL', 'ISO 8655-2 grenzen voor 20 µL: e_s 1% = 0,2 µL, CV 0,5% = 0,1 µL; P20 heeft de kleinste totale fout')
def _(pg):
    pg.evaluate("__go('pipkeus');__set('pk-v','15');__set('pk-set','2 10 20 100 200 1000')")
    return [('beste pipet', pg.evaluate("__big('#pk-out')"), 20, 0), ('e_s (µL)', pg.evaluate("__kv('#pk-out','Systematische')"), 0.2, 0.001)]

@case('QR-code (delen)', 'QR-code leesbaar', 'QR-code volgens ISO/IEC 18004, gecontroleerd door de QR-decoder van OpenCV')
def _(pg):
    import base64, cv2, numpy as np
    out = []
    for t in ['S-001', 'https://svgbml.github.io/labkit_public/?d=zAbC#widmark', 'X'*300]:
        u = pg.evaluate("t=>{ const n=qrMatrix(t,'M').length, s=Math.max(4,Math.ceil(800/(n+8))), c=document.createElement('canvas'); c.width=c.height=(n+8)*s; drawQR(c.getContext('2d'),t,0,0,c.width,'M'); return c.toDataURL(); }", t)
        img = cv2.imdecode(np.frombuffer(base64.b64decode(u.split(',')[1]), np.uint8), cv2.IMREAD_GRAYSCALE)
        v, _, _ = cv2.QRCodeDetector().detectAndDecode(img)
        if v != t:
            try: v, _, _ = cv2.QRCodeDetectorAruco().detectAndDecode(img)
            except Exception: pass
        out.append((f'decodeert ({len(t)} tekens)', 1 if v == t else 0, 1, 0))
    return out

# ---------------- v1.16: bugfixes en nieuwe modules ----------------
@case('Verdunning', 'Eigen eenheid per concentratie', '50 mM naar 2,5 µM in 25 mL: V₁ = 2,5 × 10⁻⁶ × 25 mL / 0,050 = 1,25 µL; C₂ > C₁ geeft een foutmelding')
def _(pg):
    pg.evaluate("__go('verdunning');__set('d-c1u','mM');__set('d-c2u','µM');__set('d-c1','50');__set('d-c2','2,5');__set('d-v1','');__set('d-v2u','mL');__set('d-v2','25')")
    v = pg.evaluate("__big('#d-out')")
    pg.evaluate("__set('d-c2u','mM');__set('d-c2','80')"); bad = pg.evaluate("document.querySelector('#d-out').textContent.includes('niet hoger zijn dan')||document.querySelector('#d-out').textContent.includes('cannot be higher')")
    pg.evaluate("__set('d-c1u','X');__set('d-c2u','X');__set('d-c1','50');__set('d-c2','1');__set('d-v2','500')")
    return [('V₁ (µL)', v, 1.25, 0.001), ('foutmelding bij C₂ > C₁', 1 if bad else 0, 1, 0)]

@case('Verdunning', 'Antistofverdunning met overmaat', 'Onafhankelijk berekend: 1:1000, 2 blots × 10 mL + 10% = 22 mL → 22 µL antistof en 21,978 mL buffer; met +1 reactie 3 × 10 mL → 30 µL')
def _(pg):
    pg.evaluate("__go('verdunning');__set('ab-d','1000');__set('ab-u','mL');__set('ab-v','10');__set('ab-k','2');__set('ab-ov','pct');__set('ab-x','10')")
    pg.wait_for_timeout(100)
    ab = pg.evaluate("__big('#ab-out')"); buf = pg.evaluate("__kv('#ab-out','Buffer')")
    pg.evaluate("__set('ab-ov','plus1')"); pg.wait_for_timeout(100)
    p1 = pg.evaluate("__big('#ab-out')")
    pg.evaluate("__set('ab-ov','pct')")
    return [('antistof (µL)', ab, 22, 0.001), ('buffer (mL)', buf, 21.978, 0.001), ('antistof met +1 reactie (µL)', p1, 30, 0.001)]

@case('Telkamer', 'Komma als scheidingsteken', '"12,15,14,18" zijn vier vaktellingen: gemiddeld 14,75 per vak')
def _(pg):
    pg.evaluate("__go('telkamer');__set('k-ch','0.1');kSq();__set('k-sq','1');__set('k-live','12,15,14,18');__set('k-dead','');__set('k-df','1')")
    return [('vakken', pg.evaluate("__kv('#k-out','Vakken')"), 4, 0), ('cellen/mL', pg.evaluate("__big('#k-out')"), 14.75e4, 0.01)]

@case('Verdunningsreeks & KVE', 'ISO 7218 en ontelbare platen', 'NEN-EN-ISO 7218 §10.3.2: N = ΣC / (V × (n₁ + 0,1·n₂) × d) = 422 / (0,1 × 2,2 × 10⁻²) = 1,9 × 10⁵; ">300" telt als ontelbaar')
def _(pg):
    pg.evaluate("__go('reeks');__set('r-f','10');__set('r-n','3');__set('r-pv','0,1');__set('r-range','10-300-iso')")
    pg.evaluate("(()=>{ const s=(i,j,v)=>{ const el=document.querySelectorAll('#r-tbl tbody tr')[i].querySelectorAll('input')[j]; el.value=v; el.dispatchEvent(new Event('input',{bubbles:true})); }; s(0,0,'>300');s(0,1,'ontelbaar');s(1,0,'168');s(1,1,'215');s(2,0,'14');s(2,1,'25'); })()")
    return [('KVE/mL', pg.evaluate("__big('#r-out')"), 422/(0.1*0.022), 0.03), ('telbare platen', pg.evaluate("__kv('#r-out','Telbare')"), 4, 0)]

@case('DNA-kwantificatie', 'Ratio met A₃₂₀-correctie', '(A₂₆₀ − A₃₂₀)/(A₂₈₀ − A₃₂₀) = (1,00 − 0,05)/(0,55 − 0,05) = 1,90')
def _(pg):
    pg.evaluate("__go('dna');__set('n-a260','1,00');__set('n-a280','0,55');__set('n-a230','0,50');__set('n-a320','0,05')")
    return [('260/280', pg.evaluate("__kv('#n-out','A₂₆₀/A₂₈₀')"), 1.9, 0.003), ('260/230', pg.evaluate("__kv('#n-out','A₂₆₀/A₂₃₀')"), 0.95/0.45, 0.003)]

@case('Oplossing & buffer', 'Hydraatvariant', '10 mM Na₂HPO₄·7H₂O (268,07 g/mol) in 1 L = 2,681 g')
def _(pg):
    pg.evaluate("__go('oplossing');__set('o-v','1');__set('o-vu','L');__tbl('o-tbl',[['Na₂HPO₄',141.96,10,'mM']],'oplossing')")
    pg.evaluate("(()=>{ const h=document.querySelector('#o-tbl tbody tr [data-k=h]'); h.value='2'; h.dispatchEvent(new Event('input',{bubbles:true})); })()")
    return [('afwegen (g)', pg.evaluate("__n(document.querySelector('#o-tbl tbody tr [data-k=out]').textContent)"), 2.6807, 0.001)]

@case('Enzymkinetiek', 'Eadie-Hofstee', 'Exacte Michaelis-Menten-data (V_max 100, K_m 2): v tegen v/[S] heeft helling −K_m en y-asafsnede V_max')
def _(pg):
    S = [0.5, 1, 2, 4, 8, 16]; rows = [[s, round(100*s/(2+s), 6), ''] for s in S]
    pg.evaluate(f"__go('enzym');__tbl('k-tbl',{rows},'enzym')")
    r = pg.evaluate("(()=>{ const tr=[...document.querySelectorAll('#k-res table')].pop().querySelectorAll('tbody tr')[2]; return [__n(tr.cells[2].textContent),__n(tr.cells[3].textContent)]; })()")
    return [('helling', r[0], -2, 0.002), ('y-asafsnede', r[1], 100, 0.002)]

@case('Restrictiedigestie', 'In-silico digestie van pFA6a-kanMX6', 'Biopython Bio.Restriction 1.84 (REBASE, dezelfde enzymdata als NEBcutter) op pFA6a-kanMX6 (Addgene 39296, 3938 bp); tests/fixtures/pFA6a-kanMX6.fa')
def _(pg):
    fa = (ROOT / 'tests' / 'fixtures' / 'pFA6a-kanMX6.fa').read_text(encoding='utf-8')
    out = []
    for e1, e2, circ, exp in (('EcoRI', 'HindIII', True, [2441, 983, 514]), ('EcoRI', 'HindIII', False, [2422, 983, 514, 19]),
                              ('BsaI', 'SfiI', True, [2746, 1169, 23]), ('PstI', 'NotI', True, [2390, 1270, 249, 29])):
        pg.evaluate("([fa,e1,e2,c])=>{__go('digest');__set('dg-e1',e1);__set('dg-e2',e2);__set('dg-circ',c);__set('dg-seq',fa)}", [fa, e1, e2, circ])
        # de laatste tabel in #dg-frag is die met de fragmenten (de eerste geeft de knipplaatsen)
        got = pg.evaluate("[...[...document.querySelectorAll('#dg-frag table')].pop().querySelectorAll('tbody tr td:first-child')].map(e=>__n(__el(e)))")
        for i, x in enumerate(exp):
            out.append((f"{e1}+{e2} {'circ' if circ else 'lin'} fragment {i + 1} (bp)", got[i] if i < len(got) else float('nan'), x, 0))
        out.append((f"{e1}+{e2} aantal fragmenten", len(got), len(exp), 0))
    pg.evaluate("__set('dg-e1','EcoRI');__set('dg-e2','HindIII');__set('dg-seq','')")
    return out

@case('Restrictiedigestie', 'Enzymvolume en star-activiteit', '1 µg DNA × 10 U/µg / 20 U/µL = 0,5 µL per enzym; twee enzymen in 50 µL = 2% (glycerol 1%)')
def _(pg):
    pg.evaluate("__go('digest');__set('dg-c','250');__set('dg-ng','1000');__set('dg-v','50');__set('dg-u1','20');__set('dg-u2','20');__set('dg-upg','10');__set('dg-e2','HindIII')")
    return [('enzymvolume (µL)', pg.evaluate("__kv('#dg-out','Enzymvolume')"), 1.0, 0.001), ('glycerol (%)', pg.evaluate("__kv('#dg-out','Glycerol')"), 1.0, 0.001)]

@case('Eiwitzuiveringstabel', 'Zuiveringsfactor en ammoniumsulfaat', 'SA stap 4 / SA stap 1 = (480/0,9)/(40/12,5) = 166,7; opbrengst 4800/8000 = 60%; 0 → 40% bij 0 °C: 515,35 × 0,4/(1 − 0,2722 × 0,4) = 231,3 g/L (Wingfield 2016)')
def _(pg):
    pg.evaluate("__go('purif');__tbl('pf-tbl',[['a',200,12.5,40],['b',10,0.9,480]],'purif');__set('pf-s1','0');__set('pf-s2','40');__set('pf-t','0');__set('pf-v','50')")
    return [('zuiveringsfactor', pg.evaluate("__big('#pf-out')"), (480/0.9)/(40/12.5), 0.003), ('g (NH₄)₂SO₄ per L', pg.evaluate("__n(document.querySelectorAll('#pf-out .big')[1].textContent)"), 515.35*0.4/(1-0.2722*0.4), 0.001)]

@case('Gradiënt-PCR', 'Lineaire gradiënt', 'T₆ = 52 + 5 × (66 − 52)/11 = 58,36 °C')
def _(pg):
    pg.evaluate("__go('gradient');__set('gr-lo','52');__set('gr-hi','66');__set('gr-n','12');__set('gr-m','lin')")
    return [('kolom 6 (°C)', pg.evaluate("__n(document.querySelector('#gr-out tbody tr').cells[6].textContent)"), 52+5*14/11, 0.002)]

@case('ELISA-plaatanalyse', '4PL terugrekenen', 'Standaarden exact op y = 0,05 + 2,4/(1 + (x/180)^−1,15); monster met de absorptie van 100 pg/mL en verdunning 10 moet 1000 opleveren')
def _(pg):
    f = lambda x: 0.05+2.4/(1+(x/180)**-1.15); S = [1000, 500, 250, 125, 62.5, 31.25, 15.625]
    A = ['\t'.join([f"{f(S[r]):.5f}" if r < 7 else '0', f"{f(100):.5f}" if r == 0 else '']+['']*10) for r in range(8)]
    L = ['\t'.join([f"S{r+1}" if r < 7 else 'B', 'M1' if r == 0 else '-']+['-']*10) for r in range(8)]
    pg.evaluate("([a,l])=>{ __go('elisa'); __set('el-r',''); __set('el-s','1000 500 250 125 62,5 31,25 15,625'); __set('el-fit','4pl'); __set('el-d','M1=10'); __set('el-l',l); __set('el-a',a); }", ['\n'.join(A).replace('.', ','), '\n'.join(L)])
    return [('M1 (pg/mL)', pg.evaluate("__n(document.querySelector('#el-out tbody tr').cells[6].textContent)"), 1000, 0.01)]

@case('Flowcytometrie (panel & controles)', 'Cocktail, stain index en telbeads', '50 µL / 200 = 0,25 µL; SI = (18500 − 210)/(2 × 95) = 96,3; cellen/µL = 24500/5200 × 1000 × 50/100 = 2356')
def _(pg):
    pg.evaluate("__go('facs');__set('fc-n','10');__set('fc-x','0');__set('fc-v','50');__tbl('fc-tbl',[['CD4','PE',200,'nee']],'facs');__set('fc-mp','18500');__set('fc-mn','210');__set('fc-sd','95');__set('fc-ce','24500');__set('fc-be','5200');__set('fc-bc','1000');__set('fc-bv','50');__set('fc-sv','100')")
    b = pg.evaluate("[...document.querySelectorAll('#fc-out .big')].map(e=>__n(e.textContent))")
    return [('antilichaam per test (µL)', pg.evaluate("__n(document.querySelector('#fc-out tbody tr').cells[2].textContent)"), 0.25, 0.001), ('stain index', b[1], 18290/190, 0.002), ('cellen/µL', b[2], 24500/5200*500, 0.002)]

@case('Mengprofiel & LR', 'LR en mengverhouding', 'Vier allelen, slachtoffer 14/15, verdachte 16/18, θ = 0: LR = 1/(2·p₁₆·p₁₈) = 1/(2 × 0,25 × 0,15) = 13,3; M_x = (420 + 390)/3640 = 0,22. Met θ = 0,03 onafhankelijk in Python (Balding & Nichols 1994)')
def _(pg):
    pg.evaluate("__go('mix');__set('mx-th','0');__tbl('mx-tbl',[['D3','14 15 16 18','1450 1380 420 390','0,12 0,26 0,25 0,15','14 15','16 18']],'mix')")
    c = pg.evaluate("[...document.querySelector('#mx-out tbody tr').cells].map(td=>__n(td.textContent))")
    pg.evaluate("__set('mx-th','0,03')"); c2 = pg.evaluate("__n(document.querySelector('#mx-out tbody tr').cells[5].textContent)")
    th = 0.03; p1 = (1*th+(1-th)*0.25)/(1+3*th); p2 = (1*th+(1-th)*0.15)/(1+4*th)
    return [('LR (θ = 0)', c[5], 1/(2*0.25*0.15), 0.003), ('M_x', c[2], 810/3640, 0.03), ('LR (θ = 0,03)', c2, 1/(2*p1*p2), 0.005)]

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
# ---------------- Nieuwe tools (S40) ----------------
@case('pH bijstellen', 'Tris-Cl uit Tris-base', 'Sambrook & Russell, Molecular Cloning (3e druk), Appendix 1: 1 L 1 M Tris-Cl uit Tris-base vraagt ongeveer 70 / 60 / 42 mL geconcentreerd HCl (12,1 M) voor pH 7,4 / 7,6 / 8,0')
def _(pg):
    pg.evaluate("__go('phadj')")
    out = []
    for ph, exp, tol in (('7,4', 70, 0.05), ('7,6', 60, 0.05), ('8,0', 42, 0.06)):
        pg.evaluate("ph=>{__set('pa-sys','8.06');__set('pa-pka','8,06');__set('pa-ph',ph);"
                    "__set('pa-c','1000');__set('pa-v','1000');__set('pa-start','base');__set('pa-titr','12,1');}", ph)
        out.append(('HCl bij pH ' + ph + ' (mL)', pg.evaluate("__mlbig()"), exp, tol))
    return out


@case('pH bijstellen', 'Acetaatbuffer met NaOH', 'Henderson-Hasselbalch: 100 mL 0,1 M azijnzuur naar pH 4,76 (= pKa) vraagt de helft aan NaOH, dus 5,0 mmol; uit 1 M is dat 5,0 mL')
def _(pg):
    pg.evaluate("__go('phadj')")
    pg.evaluate("__set('pa-sys','4.76');__set('pa-pka','4,76');__set('pa-ph','4,76');"
                "__set('pa-c','100');__set('pa-v','100');__set('pa-start','acid');__set('pa-titr','1')")
    return [('NaOH (mL)', pg.evaluate("__mlbig()"), 5.0, 0.002),
            ('omgezet deel (%)', pg.evaluate("__kv('#pa-out','Deel van de buffer')"), 50, 0.002)]


@case('Celkweekmedium klaarmaken', '500 mL met 10% FBS', 'Thermo Fisher, Cell Culture Basics: percentages gaan over het eindvolume, dus 500 mL met 10% FBS, 1x pen/strep uit 100x en 2 mM glutamine uit 200 mM geeft 50 + 5 + 5 mL supplement en 440 mL basismedium')
def _(pg):
    pg.evaluate("__go('medium');__set('md-v','500');__set('md-fbs','10');__set('md-ps','1');__set('md-gln','2')")
    rows = pg.evaluate("[...document.querySelectorAll('#md-out tbody tr')].map(r=>__n(r.cells[2].textContent))")
    return [('basismedium (mL)', rows[0], 440, 0.001), ('FBS (mL)', rows[1], 50, 0.001),
            ('pen/strep (mL)', rows[2], 5, 0.001), ('glutamine (mL)', rows[3], 5, 0.001),
            ('totaal (mL)', rows[4], 500, 0.001)]


if __name__ == '__main__':
    main()
