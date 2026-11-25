<!-- ================= TITRATIECURVE =================
     Het rekenwerk (titrPH) blijft onveranderd in tools/nt/51_titr.js staan. Deze component
     beheert de velden en de uitkomst; de curve blijft met de gewone tekencontext gemaakt en
     wordt na elke render opnieuw getekend (zie Bufcap). De id's ti-type, ti-pre, ti-pka,
     ti-ca, ti-va, ti-cb, ti-cv en ti-out blijven zoals ze waren. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <div class="f">
          <label for="ti-type">{{ t('Analyt') }}</label>
          <select id="ti-type" style="width:100%" v-model="type">
            <option value="acid">{{ t('zuur, getitreerd met NaOH') }}</option>
            <option value="base">{{ t('base, getitreerd met HCl') }}</option>
          </select>
        </div>
        <div class="f">
          <label for="ti-pre">{{ t('Voorbeeld') }}</label>
          <select id="ti-pre" style="width:100%" v-model="pre" @change="onPre">
            <option v-for="p in presets" :key="p.v" :value="p.v">{{ t(p.n) }}</option>
          </select>
        </div>
        <lk-field v-model="pka" :label="t('pKₐ-waarden')" for-id="ti-pka" cls="txt" inputmode="text"/>
        <lk-field v-model="ca" :label="t('Concentratie analyt')" for-id="ti-ca" unit="M"/>
        <lk-field v-model="va" :label="t('Volume analyt')" for-id="ti-va" unit="mL"/>
        <lk-field v-model="cb" :label="t('Concentratie titrant')" for-id="ti-cb" unit="M"/>
      </div>
      <!-- S99 (#159): schuif door de titratie en zie pH en de verdeling over de vormen; gemeten punten erover -->
      <div v-if="ok" class="f" style="margin-top:10px">
        <label for="ti-v">{{ t('Toegevoegd volume titrant') }}: <b data-notr>{{ F(vNow, 2) }} mL</b></label>
        <input id="ti-v" type="range" min="0" :max="m.vmax" :step="m.vmax / 400" v-model.number="vt" style="width:100%">
      </div>
      <div class="f" style="margin-top:8px">
        <label for="ti-meas">{{ t('Gemeten punten (optioneel): per regel het volume in mL en de pH') }}</label>
        <textarea id="ti-meas" rows="3" v-model="meas" spellcheck="false"></textarea>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('pKₐ-waarden van het geprotoneerde zuur, gescheiden door spaties (voor een base: de pKₐ van het geconjugeerde zuur). Bij 25 °C, zonder activiteitscorrectie.') }}</p>
    </div>
    <div class="result">
      <canvas id="ti-cv" v-show="ok"></canvas>
      <div id="ti-out">
        <lk-note v-if="!ok" kind="info">{{ t('Vul pKₐ, concentraties en volume in.') }}</lk-note>
        <template v-else>
          <lk-big :label="bigLabel" :value="bigText"/>
          <lk-table :cols="cols" :rows="rows"/>
          <lk-note v-if="outside" kind="info">{{ t('Een pKₐ buiten 0–14 gedraagt zich als sterk zuur of sterke base.') }}</lk-note>
        </template>
      </div>
      <!-- S99: buiten #ti-out, want tests/validate.py leest de rijen van de tabel daarin -->
      <div v-if="ok" id="ti-sp-out">
        <div class="lbl" id="ti-now" style="margin-top:10px">{{ t('Bij ' + F(vNow, 2) + ' mL: pH ' + F(m.pH(vNow), 2)) }}</div>
        <lk-table table-id="ti-sp" :cols="spCols" :rows="spRows"/>
        <lk-note v-if="measBad" kind="warn">{{ t('Niet gelezen (geen volume en pH): ' + measBad + ' regel(s).') }}</lk-note>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';
import {specFrac} from '../lib/species.js';

const F = (x, d) => lkNumIn(fmt(x, d));
const SUB = ['', '', '₂', '₃', '₄'], CHG = ['', '⁻', '²⁻', '³⁻', '⁴⁻'];

/* dezelfde lijst als in de oude keuzelijst; de waarde is wat er in het pKₐ-veld komt */
const PRESETS = [{v: '', n: 'eigen pKₐ'}, {v: '4,76', n: 'azijnzuur (4,76)'},
  {v: '2,15 7,20 12,35', n: 'fosforzuur (2,15; 7,20; 12,35)'}, {v: '-6', n: 'HCl (sterk zuur)'},
  {v: '9,25', n: 'ammoniak (pKₐ NH₄⁺ 9,25)'}, {v: '8,07', n: 'Tris (8,07)'}];

export default {
  name: 'Titr',
  data() {
    return {type: 'acid', pre: '', pka: lkNumIn('4,76'), ca: lkNumIn('0,1'), va: lkNumIn('25'),
      cb: lkNumIn('0,1'), vt: null, meas: ''};
  },
  computed: {
    presets() { return PRESETS; },
    /* alle maten uit de velden, één keer */
    m() {
      const pka = numsC(this.pka).sort((a, b) => a - b), acid = this.type === 'acid';
      const Ca = num(this.ca), Va = num(this.va), Cb = num(this.cb);
      const ok = pka.length > 0 && Ca > 0 && Va > 0 && Cb > 0;
      if (!ok) return {ok, pka, acid};
      const n = pka.length, Ve = Ca * Va / Cb;
      const ve = Array.from({length: n}, (_, k) => (k + 1) * Ve);
      return {ok, pka, acid, Ca, Va, Cb, n, Ve, ve, vmax: ve[n - 1] * 1.6,
        pH: v => titrPH(pka, acid, Ca, Va, Cb, v)};
    },
    ok() { return this.m.ok; },
    bigLabel() { return this.t(this.m.n > 1 ? 'pH bij eerste equivalentiepunt' : 'pH bij equivalentiepunt'); },
    bigText() { return F(this.m.pH(this.m.ve[0]), 2); },
    cols() {
      return [{h: this.t('Punt')}, {h: this.t('Volume titrant (mL)'), num: true}, {h: this.t('pH'), num: true}];
    },
    rows() {
      const {n, ve, Ve, pH} = this.m, t = this.t;
      const lab = (s, k) => n > 1 ? t(s + ' ' + (k + 1)) : t(s);
      return [[t('Start'), F(0, 2), F(pH(0), 2)],
        ...ve.flatMap((v, k) => [[lab('½ equivalentie', k), F(v - Ve / 2, 2), F(pH(v - Ve / 2), 2)],
          [lab('Equivalentiepunt', k), F(v, 2), F(pH(v), 2)]])];
    },
    outside() { return this.m.pka.some(p => p < 0 || p > 14); },
    /* S99: het volume van de schuif (standaard halverwege het eerste equivalentiepunt) */
    vNow() { const v = this.vt, {Ve, vmax} = this.m; return typeof v === "number" && isFinite(v) && v >= 0 && v <= vmax ? v : Ve / 2; },
    /* de vormen van de stof bij die pH: α_j uit de pKₐ's (j = aantal afgegeven protonen) */
    spCols() { return [{h: this.t('Vorm')}, {h: this.t('Aandeel'), num: true}]; },
    spRows() {
      const {pka, acid, n} = this.m, a = specFrac(pka, this.m.pH(this.vNow));
      const lab = j => (!acid && n === 1 ? ['BH⁺', 'B'][j] : (n - j ? 'H' + SUB[n - j] : '') + 'A' + CHG[j]);
      return a.map((x, j) => [lab(j), F(x * 100, 1) + ' %']);
    },
    measPts() { return this.meas.split('\n').map(l => numsC(l)).filter(x => x.length >= 2).map(x => [x[0], x[1]]); },
    measBad() { return this.meas.split('\n').filter(l => l.trim() && numsC(l).length < 2).length; }
  },
  mounted() { this.draw(); },
  updated() { this.draw(); },
  methods: {F,
    /* een voorbeeld kiezen vult het pKₐ-veld en zet het type; "eigen pKₐ" laat alles staan */
    onPre() {
      if (!this.pre) return;
      this.pka = lkNumIn(this.pre);
      this.type = /9,25|8,07/.test(this.pre) ? 'base' : 'acid';
    },
    draw() {
      const cv = document.getElementById('ti-cv'); if (!cv || !this.ok) return;
      const {acid, ve, vmax, pH} = this.m;
      chart(cv, {xmin: 0, xmax: vmax, ymin: 0, ymax: 14, xlabel: `volume ${acid ? 'NaOH' : 'HCl'} (mL)`,
        ylabel: 'pH', series: [{fn: pH, name: 'titratiecurve'}, {pts: ve.map(v => [v, pH(v)]), color: '--warn', r: 5},
          ...(this.measPts.length ? [{pts: this.measPts, name: 'gemeten', color: '--bad', r: 4}] : []),
          {pts: [[this.vNow, pH(this.vNow)]], name: 'schuif', color: '--ok', r: 6}]});
    }
  }
};
</script>
