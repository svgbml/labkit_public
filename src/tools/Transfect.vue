<!-- ================= TRANSFECTIE (LIPOFECTAMINE 3000) =================
     DNA of siRNA, P3000, Lipofectamine 3000 en Opti-MEM per putje en als mastermix, geschaald
     naar het kweekformaat. Het rekenwerk is dat van de oude calc.transfect() in
     tools/nt/81_transfect.js, alleen de weergave is opnieuw opgebouwd met de gedeelde componenten.

     De id's trf-type, trf-fmt, trf-dose, trf-n, trf-x, trf-st, trf-sist en trf-out blijven zoals
     ze waren. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <div class="f"><label for="trf-type">{{ t('Nucleïnezuur') }}</label>
          <select id="trf-type" v-model="type">
            <option value="dna">{{ t('plasmide-DNA') }}</option>
            <option value="si">{{ t('siRNA') }}</option>
          </select></div>
        <div class="f"><label for="trf-fmt">{{ t('Formaat') }}</label>
          <select id="trf-fmt" v-model="fmtSel">
            <option value="0.2">{{ t('96-well') }}</option>
            <option value="0.5">{{ t('48-well') }}</option>
            <option value="1">{{ t('24-well') }}</option>
            <option value="2">{{ t('12-well') }}</option>
            <option value="5">{{ t('6-well') }}</option>
            <option value="11.05">{{ t('schaal 60 mm') }}</option>
            <option value="28.95">{{ t('schaal 10 cm') }}</option>
            <option value="39.47">{{ t('T-75') }}</option>
            <option value="92.11">{{ t('T-175') }}</option>
          </select></div>
        <div class="f"><label for="trf-dose">{{ t('Lipofectamine-dosis') }}</label>
          <select id="trf-dose" v-model="dose">
            <option value="hi">{{ t('hoog (1,5 µL per 24-well)') }}</option>
            <option value="lo">{{ t('laag (0,75 µL per 24-well)') }}</option>
            <option value="both">{{ t('beide testen (optimalisatie)') }}</option>
          </select></div>
        <lk-field v-model="n" :label="t('Aantal putjes')" for-id="trf-n" inputmode="numeric"/>
        <lk-field v-model="x" :label="t('Extra')" for-id="trf-x" unit="%"/>
        <lk-field v-model="st" :label="t('Stock DNA')" for-id="trf-st" unit="µg/µL"/>
        <lk-field v-model="sist" :label="t('Stock siRNA')" for-id="trf-sist" unit="µM"/>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Zaai de cellen zo dat ze bij transfectie 70–90% confluent zijn. Bepaal de beste Lipofectamine-dosis eerst met beide doses; schaal daarna met de vermenigvuldigingsfactor. Gebruik serumvrij Opti-MEM voor de complexen.') }}</p>
    </div>
    <div class="result"><div id="trf-out">
      <template v-if="m">
        <div class="lbl">{{ t('Complex per putje') }}</div>
        <lk-big :value="L(vol(2 * m.opti))"/>
        <lk-kv :rows="kvRows"/>
        <lk-table :cols="colsA" :rows="rowsA"/>
        <lk-table v-for="(l, i) in m.L" :key="i" :cols="colsB(i)" :rows="rowsB(l)"/>
        <lk-note v-if="dose === 'both'" kind="info">{{ t('Bij twee doses maak je buis A twee keer zo groot (of twee keer) en deel je hem 1:1 over beide buizen B.') }}</lk-note>
        <lk-note v-if="!m.si && m.st > 0 && (m.st < 0.5 || m.st > 5)" kind="warn">{{ t('De fabrikant adviseert een DNA-stock van 0,5–5 µg/µL.') }}</lk-note>
        <lk-note v-if="m.nuc < 0.5" kind="warn">{{ t('Minder dan 0,5 µL nucleïnezuur per putje; werk met de mastermix of verdun de stock.') }}</lk-note>
        <lk-steps :steps="steps"/>
      </template>
      <lk-note v-else kind="info">{{ t('Kies een formaat en vul het aantal putjes in.') }}</lk-note>
    </div></div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

/* een getal dat de component zelf opmaakt (fmt, sig, sci, vol) in de taal van de gebruiker */
const L = lkNumIn;

/* zaaidichtheid en kweekmedium per formaat (zelfde tabellen als de oude TRF_SEED en TRF_MED) */
const TRF_SEED = {'0.2': '1–4 × 10⁴', '1': '0,5–2 × 10⁵', '5': '0,25–1 × 10⁶'};
const TRF_MED = {'0.2': '100 µL', '0.5': '250 µL', '1': '500 µL', '2': '1 mL', '5': '2 mL', '11.05': '5 mL', '28.95': '10 mL', '39.47': '15 mL', '92.11': '35 mL'};

export default {
  name: 'Transfect',
  data() {
    return {type: 'dna', fmtSel: '1', dose: 'hi', n: '6', x: '10', st: '1', sist: '10'};
  },
  computed: {
    /* formaat, nucleïnezuur, dosis en hoeveelheden; zelfde voorwaarden als de oude calc.transfect() */
    m() {
      const f = num(this.fmtSel), si = this.type === 'si', dose = this.dose, n = Math.round(num(this.n)),
        x = (num(this.x) || 0) / 100, st = num(this.st), sst = num(this.sist);
      if (!(f > 0) || !(n >= 1) || n > 1e4) return null;
      const mm = n * (1 + x), opti = 25 * f, dna = 0.5 * f, p3 = si ? 0 : 1 * f, pm = 15 * f,
        Ls = dose === 'lo' ? [0.75 * f] : dose === 'hi' ? [1.5 * f] : [0.75 * f, 1.5 * f];
      const nuc = si ? (sst > 0 ? pm / sst : NaN) : (st > 0 ? dna / st : NaN);
      return {f, si, n, x, st, sst, m: mm, opti, dna, p3, pm, L: Ls, nuc};
    },
    kvRows() {
      const {si, pm, dna, f, L: Ls, n, x, m} = this.m, t = this.t;
      const seed = TRF_SEED[this.fmtSel];
      return [
        [t('Per putje'), si ? t(fmt(pm, 1) + ' pmol siRNA') : (f >= 11
          ? t(sig(dna, 3) + ' µg DNA (tabel: ' + sig(dna, 3) + '–' + sig(2 * dna, 3) + ' µg)') : t(sig(dna, 3) + ' µg DNA'))],
        [t('Lipofectamine 3000 per putje'), t(Ls.map(v => vol(v)).join(' en '))],
        [t('Kweekmedium per putje'), TRF_MED[this.fmtSel] ? L(TRF_MED[this.fmtSel]) : '–'],
        [t('Cellen zaaien'), seed ? t(seed + ' per putje') : t('zie protocol van de cellijn')],
        [t('Mastermix voor'), t(n + ' putjes + ' + fmt(x * 100, 0) + '% = ' + fmt(m, 1))]
      ];
    },
    colsA() {
      const t = this.t;
      return [{h: t('Buis A: verdund nucleïnezuur')}, {h: t('Per putje'), num: true}, {h: t('Mastermix'), num: true}];
    },
    rowsA() {
      const {opti, si, sst, st, nuc, p3, m} = this.m, t = this.t;
      return [
        [t('Opti-MEM'), L(vol(opti)), L(vol(opti * m))],
        [si ? t('siRNA (' + fmt(sst, 1) + ' µM)') : t('DNA (' + fmt(st, 2) + ' µg/µL)'), L(vol(nuc)), L(vol(nuc * m))],
        si ? null : [t('P3000'), L(vol(p3)), L(vol(p3 * m))]
      ];
    },
    steps() {
      const t = this.t;
      return [t('Buis A en B apart mengen.'), t('Buis A 1:1 bij buis B voegen en mengen.'),
        t('10–15 min incuberen bij kamertemperatuur.'),
        t(vol(2 * this.m.opti) + ' complex per putje druppelsgewijs toevoegen.'),
        t('2–4 dagen kweken en analyseren.')];
    }
  },
  methods: {
    L, fmt, sig, sci, vol,
    colsB(i) {
      const t = this.t, k = this.m.L.length;
      const h = k > 1 ? (i ? t('Buis B (hoog): verdund Lipofectamine') : t('Buis B (laag): verdund Lipofectamine'))
        : t('Buis B: verdund Lipofectamine');
      return [{h}, {h: t('Per putje'), num: true}, {h: t('Mastermix'), num: true}];
    },
    rowsB(l) {
      const {opti, m} = this.m;
      return [[this.t('Opti-MEM'), L(vol(opti)), L(vol(opti * m))],
        [this.t('Lipofectamine 3000'), L(vol(l)), L(vol(l * m))]];
    }
  }
};
</script>
