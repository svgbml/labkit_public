<!-- ================= MOLMASSA =================
     De formuleparser (parseFormula) en de atoommassa's (ATOM) blijven in web/index.html staan:
     ze zijn onveranderd, en de component roept ze aan. De id's mm-f, mm-c, mm-cu, mm-v, mm-vu
     en mm-out blijven zoals ze waren. #mm-out .big wordt gelezen door de knop "naar
     Oplossing & buffer" (MOVES in tools/nt/99_app.js, via bigNum), en door tests/validate.py. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="f">
        <label for="mm-f">{{ t('Formule') }} <span class="example">{{ t('voorbeeld') }}</span></label>
        <input id="mm-f" class="mono" v-model="f" spellcheck="false" :placeholder="t('of een naam, bijv. Tris')">
      </div>
      <div class="row" style="margin-top:8px;gap:6px;font-size:13px">
        <span style="color:var(--muted)">{{ t('Snel:') }}</span>
        <button v-for="q in quick" :key="q.f" type="button" class="xlbtn" :data-mmf="q.f" @click="f = q.f" v-html="q.h"></button>
      </div>
      <div v-if="hyd.length" class="row" style="margin-top:8px;gap:6px;font-size:13px">
        <span style="color:var(--muted)">{{ t('Kristalwater:') }}</span>
        <button v-for="o in hyd" :key="o" type="button" class="xlbtn" :data-mmf="o" @click="f = o">{{ o }}</button>
      </div>
      <div class="fields" style="margin-top:12px">
        <div class="f">
          <label for="mm-c">{{ t('Concentratie') }}</label>
          <div class="inu">
            <input id="mm-c" inputmode="decimal" v-model="c">
            <select id="mm-cu" v-model="cu"><option>M</option><option>mM</option><option>µM</option></select>
          </div>
        </div>
        <div class="f">
          <label for="mm-v">{{ t('Volume') }}</label>
          <div class="inu">
            <input id="mm-v" inputmode="decimal" v-model="v">
            <select id="mm-vu" v-model="vu"><option>mL</option><option>L</option></select>
          </div>
        </div>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0" v-html="hint"></p>
    </div>
    <div class="result" id="mm-out">
      <lk-note v-if="err" kind="bad">{{ err }}</lk-note>
      <template v-else>
        <lk-big :label="t('Molmassa')" :value="F(R.M, 2)" sub="g/mol"/>
        <lk-kv :rows="kvRows"/>
        <lk-table :cols="cols" :rows="rows"/>
        <lk-formula :html="t('M = Σ aantal × atoommassa · massa = c × V × M')"/>
        <!-- de knop "Stuur door naar" (SEND.molm in tools/nt/99_app.js): die voegde hem vroeger zelf
             achter calc.molm() toe, maar Vue bezit deze DOM. Het klikken regelt de globale
             handler op [data-send], dus alleen de knop staat hier. -->
        <div v-if="R.M > 0" class="lk-send"><span>{{ t('Stuur door naar') }}</span><button type="button" data-send="molm:0">{{ t('Oplossing & buffer') }}</button></div>
      </template>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => lkNumIn(fmt(x, d));
/* naam of formule (klein, zonder spaties, · voor het kristalwater) -> de formules van die stof; de eerste is de standaard */
const REAG = [
  [['tris', 'trisbase', 'trizma'], ['C4H11NO3', 'C4H11NO3·HCl']],
  [['edta', 'na2edta', 'edta-na2', 'edtadinatrium'], ['C10H14N2Na2O8·2H2O', 'C10H14N2Na2O8', 'C10H16N2O8']],
  [['nacl', 'natriumchloride', 'keukenzout'], ['NaCl']],
  [['kcl', 'kaliumchloride'], ['KCl']],
  [['glucose', 'dextrose'], ['C6H12O6', 'C6H12O6·H2O']],
  [['sucrose', 'sacharose'], ['C12H22O11']],
  [['glycine', 'glycin'], ['C2H5NO2']],
  [['sds'], ['C12H25NaO4S']],
  [['naoh', 'natriumhydroxide'], ['NaOH']],
  [['boorzuur'], ['H3BO3']],
  [['hepes'], ['C8H18N2O4S']],
  [['mes'], ['C6H13NO4S']],
  [['cacl2', 'calciumchloride'], ['CaCl2', 'CaCl2·2H2O', 'CaCl2·6H2O']],
  [['mgcl2', 'magnesiumchloride'], ['MgCl2', 'MgCl2·6H2O']],
  [['na2hpo4'], ['Na2HPO4', 'Na2HPO4·2H2O', 'Na2HPO4·7H2O', 'Na2HPO4·12H2O']],
  [['nah2po4'], ['NaH2PO4', 'NaH2PO4·H2O', 'NaH2PO4·2H2O']],
  [['kh2po4'], ['KH2PO4']],
  [['mgso4', 'magnesiumsulfaat'], ['MgSO4', 'MgSO4·7H2O']],
  [['cuso4', 'kopersulfaat'], ['CuSO4', 'CuSO4·5H2O']],
  [['natriumacetaat'], ['C2H3NaO2', 'C2H3NaO2·3H2O']],
  [['citroenzuur'], ['C6H8O7', 'C6H8O7·H2O']],
  [['trinatriumcitraat'], ['C6H5Na3O7', 'C6H5Na3O7·2H2O']]
];
const norm = x => String(x).toLowerCase().replace(/\s+/g, '').replace(/[₀-₉]/g, c => c.charCodeAt(0) - 8320).replace(/[.*•]/g, '·');
const find = x => REAG.find(([n, fs]) => n.includes(norm(x)) || fs.some(f => norm(f) === norm(x)));
const strip = s => String(s).replace(/[\u0002\u0003]/g, '');

export default {
  name: 'Molm',
  data() {
    return {f: 'Na2HPO4·7H2O', c: lkNumIn('100'), cu: 'mM', v: lkNumIn('500'), vu: 'mL'};
  },
  computed: {
    quick() {
      return [{f: 'NaCl', h: 'NaCl'}, {f: 'C4H11NO3', h: 'Tris'},
        {f: 'C10H14N2Na2O8·2H2O', h: 'EDTA-Na₂·2H₂O'}, {f: 'C6H12O6', h: 'Glucose'},
        {f: 'MgCl2·6H2O', h: 'MgCl₂·6H₂O'}, {f: 'Ca(OH)2', h: 'Ca(OH)₂'}]
        .map(q => ({f: q.f, h: esc(this.t(q.h))}));
    },
    hint() {
      return this.tHtml('Kristalwater schrijf je met een punt, ster of ·, bijvoorbeeld <span class="mono">CuSO4.5H2O</span>. Let op hoofdletters: <span class="mono">Co</span> is kobalt, <span class="mono">CO</span> is koolmonoxide.');
    },
    /* de kristalwater-varianten van de stof die in het veld staat (alleen als er meer dan een is) */
    hyd() { const g = find(this.f); return g && g[1].length > 1 ? g[1] : []; },
    R() { return parseFormula(this.f); },
    /* de parser geeft Nederlandse meldingen terug; bij de twee met een teken of element erin
       blijft dat stuk staan zoals de gebruiker het typte */
    err() {
      const e = this.R.err; if (!e) return '';
      const t = this.t;
      let m = e.match(/^Onbekend teken "([\s\S]*)"\.$/);
      if (m) return t('Onbekend teken "' + uv(m[1]) + '".');
      m = e.match(/^Element "([\s\S]*)" is onbekend\.$/);
      if (m) return t('Element "' + uv(m[1]) + '" is onbekend.');
      return t(e);
    },
    kvRows() {
      const c = num(this.c) * ({M: 1, mM: 1e-3, 'µM': 1e-6}[this.cu]);
      const V = num(this.v) * (this.vu === 'L' ? 1 : 1e-3), g = c * V * this.R.M;
      /* tHtml laat de uv()-tekens in het Nederlands staan; die gaan er hier weer af */
      const weigh = isFinite(g) && g > 0
        ? strip(this.tHtml('<b>' + uv(lkNumIn(mass(g))) + '</b> voor ' + F(num(this.c), 3) + ' ' + uv(this.cu)
          + ' in ' + F(num(this.v), 2) + ' ' + uv(this.vu)))
        : '–';
      return [[this.t('Afwegen'), weigh]];
    },
    cols() {
      return [{h: this.t('Element')}, {h: this.t('Aantal'), num: true}, {h: this.t('Atoommassa'), num: true},
        {h: this.t('Massa-%'), num: true}];
    },
    rows() {
      const R = this.R;
      return Object.entries(R.tot).map(([e, n]) => [e, lkNumIn(n), F(ATOM[e], 3), F(ATOM[e] * n / R.M * 100, 2)]);
    }
  },
  watch: {
    /* een naam ("Tris", "EDTA") wordt de formule; een formule blijft zoals getypt */
    f(x) { const g = find(x); if (g && g[0].includes(norm(x)) && norm(g[1][0]) !== norm(x)) this.f = g[1][0]; }
  },
  methods: {F}
};
</script>
