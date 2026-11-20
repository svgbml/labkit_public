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
        <input id="mm-f" class="mono" v-model="f" spellcheck="false">
      </div>
      <div class="row" style="margin-top:8px;gap:6px;font-size:13px">
        <span style="color:var(--muted)">{{ t('Snel:') }}</span>
        <button v-for="q in quick" :key="q.f" type="button" class="xlbtn" :data-mmf="q.f" @click="f = q.f" v-html="q.h"></button>
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
  methods: {F}
};
</script>
