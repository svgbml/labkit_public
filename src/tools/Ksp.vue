<!-- ================= OPLOSBAARHEID (Ksp) =================
     De zoutenlijst KSP en de nulpuntsbepaling kspSolve() blijven onveranderd in
     tools/nt/79_ksp.js staan: daar hangt het validatiegeval aan. Deze component beheert de
     velden en de uitkomst.

     De id's ks-pre, ks-k, ks-x, ks-y, ks-m, ks-cc, ks-ca, ks-qc, ks-qa en ks-out blijven
     zoals ze waren. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <div class="f">
          <label for="ks-pre">{{ t('Zout') }}</label>
          <select id="ks-pre" v-model="pre" @change="onPre">
            <option value="">{{ t('eigen') }}</option>
            <option v-for="(s, i) in salts" :key="i" :value="String(i)">{{ t(s[0]) }}</option>
          </select>
        </div>
        <lk-field v-model="k" :label-html="kspLabel" for-id="ks-k"/>
        <lk-field v-model="x" :label="t('Kationen per formule')" for-id="ks-x" inputmode="numeric"/>
        <lk-field v-model="y" :label="t('Anionen per formule')" for-id="ks-y" inputmode="numeric"/>
        <lk-field v-model="m" :label="t('Molmassa')" for-id="ks-m" unit="g/mol"/>
        <lk-field v-model="cc" :label="t('Al aanwezig kation')" for-id="ks-cc" unit="mol/L"/>
        <lk-field v-model="ca" :label="t('Al aanwezig anion')" for-id="ks-ca" unit="mol/L"/>
      </div>
      <h3 style="margin:14px 0 6px;font-size:14px">{{ t('Ontstaat er neerslag?') }}</h3>
      <div class="fields">
        <lk-field v-model="qc" :label="t('[kation] na mengen')" for-id="ks-qc" unit="mol/L"/>
        <lk-field v-model="qa" :label="t('[anion] na mengen')" for-id="ks-qa" unit="mol/L"/>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('De berekening gebruikt concentraties in plaats van activiteiten en negeert complexvorming en zuur-basereacties van de ionen (bijvoorbeeld carbonaat of hydroxide). Bij hogere ionsterkte is de echte oplosbaarheid groter.') }}</p>
    </div>
    <div class="result">
      <div id="ks-out">
        <lk-note v-if="!ok" kind="info" :html="tHtml('Vul K<sub>sp</sub> en de aantallen ionen (1–4) in.')"/>
        <template v-else>
          <!-- sci() levert "1,33 × 10<sup>-5</sup>", dus de waarde gaat als html mee -->
          <lk-big :label="solLabel" :html="solText" sub="mol/L"/>
          <lk-kv :rows="rows"/>
          <lk-kv v-if="qRows.length" :rows="qRows"/>
          <lk-formula :html="tHtml('s = (K<sub>sp</sub> / x<sup>x</sup>y<sup>y</sup>)<sup>1/(x+y)</sup> · Q = [M]<sup>x</sup>[A]<sup>y</sup>')"/>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const C = (x, d) => lkNumIn(sci(x, d)), G = (x, d) => lkNumIn(sig(x, d));

export default {
  name: 'Ksp',
  data() {
    return {pre: '0', k: lkNumIn('1,77e-10'), x: '1', y: '1', m: lkNumIn('143,32'),
      cc: '0', ca: lkNumIn('0,01'), qc: '1e-4', qa: '1e-5'};
  },
  computed: {
    salts() { return typeof KSP !== 'undefined' ? KSP : []; },
    kspLabel() { return this.tHtml('K<sub>sp</sub> (25 °C)'); },
    /* de maten van het zout, afgerond zoals de oude versie dat deed */
    n() {
      return {K: num(this.k), x: Math.round(num(this.x)), y: Math.round(num(this.y)),
        M: num(this.m), cm: Math.max(0, num(this.cc) || 0), ca: Math.max(0, num(this.ca) || 0)};
    },
    ok() {
      const {K, x, y} = this.n;
      return K > 0 && x >= 1 && x <= 4 && y >= 1 && y <= 4;
    },
    /* de oplosbaarheid zonder gemeenschappelijk ion is een gesloten uitdrukking; met een
       gemeenschappelijk ion wordt er numeriek naar nul gezocht */
    sol() {
      const {K, x, y, cm, ca} = this.n;
      const s0 = (K / (x ** x * y ** y)) ** (1 / (x + y));
      return {s0, s: cm || ca ? kspSolve(K, x, y, cm, ca) : s0, common: !!(cm || ca)};
    },
    solLabel() {
      return this.t(this.sol.common ? 'Oplosbaarheid met gemeenschappelijk ion' : 'Oplosbaarheid');
    },
    solText() { return C(this.sol.s, 3); },
    rows() {
      const t = this.t, {M, x, y, cm, ca} = this.n, {s, s0, common} = this.sol;
      return [[t('In massa'), M > 0 ? `${C(s * M, 3)} g/L = ${C(s * M * 1000, 3)} mg/L` : '–'],
        [t('Zonder gemeenschappelijk ion'),
          `${C(s0, 3)} mol/L${M > 0 ? ` (${C(s0 * M * 1000, 3)} mg/L)` : ''}`],
        [t('Factor lager'), common ? G(s0 / s, 3) + '×' : '–'],
        [t('[kation] / [anion] in verzadigde oplossing'),
          `${C(x * s + cm, 3)} / ${C(y * s + ca, 3)} mol/L`]];
    },
    /* het ionproduct na mengen: boven Ksp slaat het zout neer */
    qRows() {
      const qc = num(this.qc), qa = num(this.qa);
      if (!(qc > 0 && qa > 0)) return [];
      const t = this.t, {K, x, y} = this.n, Q = qc ** x * qa ** y;
      const chip = (kind, html) =>
        `<span class="chip ${kind}" style="vertical-align:middle">${html}</span>`;
      return [[t('Ionproduct Q'), C(Q, 3)],
        [this.tHtml('Q / K<sub>sp</sub>'), G(Q / K, 3)],
        [t('Neerslag?'), Q > K
          ? chip('warn', this.tHtml('ja, Q &gt; K<sub>sp</sub>'))
          : chip('ok', this.tHtml('nee, Q ≤ K<sub>sp</sub>'))]];
    }
  },
  methods: {
    /* een zout uit de lijst vult Ksp, de aantallen ionen en de molmassa */
    onPre() {
      const s = this.salts[+this.pre];
      if (!s || this.pre === '') return;
      this.k = lkNumIn(String(s[1]).replace('.', ','));
      this.x = String(s[2]);
      this.y = String(s[3]);
      this.m = lkNumIn(String(s[4]).replace('.', ','));
    }
  }
};
</script>
