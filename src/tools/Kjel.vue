<!-- ================= KJELDAHL (EIWIT UIT STIKSTOF) =================
     Alleen de weergave staat hier; de formules zijn dezelfde als in de oude calc.kjel()
     (tools/nt/52_kjel.js is nu leeg). De id's kj-m, kj-c, kj-vs, kj-vb, kj-f en kj-out blijven
     zoals ze waren: tests/validate.py leest het ruw-eiwitgetal uit #kj-out. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <lk-field v-model="m" :label="t('Ingewogen monster')" for-id="kj-m" unit="g"/>
        <lk-field v-model="c" :label="t('Concentratie H⁺ titrant')" for-id="kj-c" unit="mol/L"/>
        <lk-field v-model="vs" :label="t('Titrant monster')" for-id="kj-vs" unit="mL"/>
        <lk-field v-model="vb" :label="t('Titrant blanco')" for-id="kj-vb" unit="mL"/>
        <div class="f">
          <label for="kj-f">{{ t('Omrekenfactor') }}</label>
          <select id="kj-f" style="width:100%" v-model="f">
            <option v-for="o in factors" :key="o.v" :value="o.v">{{ t(o.n) }}</option>
          </select>
        </div>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Bij zwavelzuur als titrant vul je de H⁺-concentratie in: 0,05 M H₂SO₄ = 0,1 mol/L H⁺. Voorbeelddata zijn verzonnen.') }}</p>
    </div>
    <div class="result" id="kj-out">
      <lk-note v-if="!ok" kind="info">{{ t('Vul monstermassa, titrantconcentratie en titratievolume in.') }}</lk-note>
      <template v-else>
        <lk-big :label="t('Ruw eiwit')" :value="F(r.P, 2)" sub="%"/>
        <lk-kv :rows="rows"/>
        <lk-note v-if="r.vs <= r.vb" kind="bad">{{ t('Het titratievolume van het monster is niet groter dan de blanco.') }}</lk-note>
        <lk-formula :html="formula"/>
      </template>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => lkNumIn(fmt(x, d));

/* v = omrekenfactor, n = de tekst in de keuzelijst; dezelfde lijst als in de oude tool */
const FACTORS = [
  {v: '6.25', n: '6,25 algemeen, vlees, vis, ei'}, {v: '6.38', n: '6,38 melk en zuivel'},
  {v: '5.7', n: '5,70 tarwe en tarwebloem'}, {v: '5.95', n: '5,95 rijst'}, {v: '5.71', n: '5,71 soja'},
  {v: '5.55', n: '5,55 gelatine'}, {v: '5.4', n: '5,40 oliezaden, noten'}
];

export default {
  name: 'Kjel',
  data() {
    return {m: lkNumIn('1,0025'), c: lkNumIn('0,1'), vs: lkNumIn('15,40'), vb: lkNumIn('0,20'), f: '6.38'};
  },
  computed: {
    factors() { return FACTORS; },
    /* alle maten uit de invoer, één keer; de andere computeds lezen hier alleen uit */
    r() {
      const m = num(this.m), c = num(this.c), vs = num(this.vs), vb = num(this.vb) || 0, fa = num(this.f);
      const N = 1.4007 * c * (vs - vb) / m, P = N * fa;
      return {m, c, vs, vb, fa, N, P};
    },
    ok() { const {m, c, vs} = this.r; return m > 0 && c > 0 && isFinite(vs); },
    rows() {
      const t = this.t, {m, vs, vb, fa, N} = this.r;
      return [[t('Stikstof'), F(N, 3) + '%'], [t('Netto titrant'), F(vs - vb, 2) + ' mL'],
        [t('Omrekenfactor'), F(fa, 2)], [t('Stikstof in monster'), F(N / 100 * m * 1000, 1) + ' mg']];
    },
    formula() {
      return this.tHtml('%N = 1,4007 × c × (V − V<sub>b</sub>) / m · % eiwit = %N × ' + F(this.r.fa, 2));
    }
  },
  methods: {F}
};
</script>
