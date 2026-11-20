<!-- ================= GRADIËNT-PCR =================
     Dezelfde berekening als de oude calc.gradient(). De tekening blijft met chart() gemaakt, na
     elke render (net als bij Bufcap). De id's gr-lo, gr-hi, gr-n, gr-m, gr-ta, gr-cv en gr-out
     blijven zoals ze waren; het validatiegeval leest de eerste rij van de tabel in #gr-out. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <lk-field v-model="lo" :label="t('Laagste temperatuur (kolom 1)')" for-id="gr-lo" unit="°C"/>
        <lk-field v-model="hi" :label="t('Hoogste temperatuur (laatste kolom)')" for-id="gr-hi" unit="°C"/>
        <div class="f">
          <label for="gr-n">{{ t('Aantal kolommen') }}</label>
          <select id="gr-n" v-model="n"><option v-for="k in ns" :key="k" :value="k">{{ k }}</option></select>
        </div>
        <div class="f">
          <label for="gr-m">{{ t('Verloop') }}</label>
          <select id="gr-m" v-model="mode">
            <option value="lin">{{ t('lineair') }}</option>
            <option value="sig">{{ t('S-vormig (randen vlakker)') }}</option>
          </select>
        </div>
        <lk-field v-model="ta" :label="t('Gewenste annealingtemperaturen (optioneel)')" for-id="gr-ta" cls="txt" inputmode="text"/>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0" v-html="hint"></p>
    </div>
    <div class="result">
      <canvas id="gr-cv" v-show="m"></canvas>
      <div id="gr-out">
        <lk-note v-if="!m" kind="info">{{ t('Vul een laagste en een hogere hoogste temperatuur in (0–110 °C).') }}</lk-note>
        <template v-else>
          <lk-big :label="t('Stap per kolom')" :value="F((m.hi - m.lo) / (m.n - 1), 2)"
            :sub="'°C' + (m.sig ? ' ' + t('gemiddeld') : '')" top="0"/>
          <lk-table :cols="tCols" :rows="tRows" style="margin-top:10px"/>
          <lk-table v-if="m.want.length" :cols="wCols" :rows="wRows"/>
          <lk-note v-if="m.hi - m.lo > 25" kind="warn">{{ t('Een spreiding van meer dan 25 °C halen de meeste gradiëntblokken niet.') }}</lk-note>
          <lk-formula :html="tHtml('T<sub>k</sub> = T<sub>laag</sub> + (k − 1)·(T<sub>hoog</sub> − T<sub>laag</sub>)/(n − 1)')"/>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => lkNumIn(fmt(x, d));

export default {
  name: 'Gradient',
  data() {
    /* de app zet de bewaarde waarden terug vóórdat deze component rendert: lees ze hier */
    const st = typeof storeGet === 'function' ? storeGet() : {};
    const g = (id, d) => (st[id] != null ? String(st[id]) : d);
    return {lo: g('gr-lo', '52'), hi: g('gr-hi', '66'), n: g('gr-n', '12'), mode: g('gr-m', 'lin'),
      ta: g('gr-ta', '55 58 61 64')};
  },
  computed: {
    ns() { return ['12', '8', '6', '24']; },
    hint() {
      return this.tHtml('De echte temperatuur per kolom hangt af van het apparaat: veel blokken verlopen niet precies lineair en zijn aan de randen vlakker. Neem de waarden over uit het display of de software van je thermocycler als die ze toont. T<sub>m</sub> van je primers: zie Primers oplossen en PCR-cyclus.');
    },
    /* alle maten uit één plek: de temperatuur per kolom en de gewenste temperaturen */
    m() {
      const lo = num(this.lo), hi = num(this.hi), n = +this.n, sig = this.mode === 'sig';
      if (!isFinite(lo) || !isFinite(hi) || !(hi > lo) || lo < 0 || hi > 110) return null;
      const f = k => { const u = (k - 1) / (n - 1); return lo + (hi - lo) * (sig ? (1 - Math.cos(Math.PI * u)) / 2 : u); };
      const T = Array.from({length: n}, (_, i) => f(i + 1));
      const want = numsC(this.ta).slice(0, 24).map(t => {
        let b = 0; T.forEach((v, i) => { if (Math.abs(v - t) < Math.abs(T[b] - t)) b = i; });
        return {t, k: b + 1, v: T[b], outr: t < lo - 0.01 || t > hi + 0.01};
      });
      return {lo, hi, n, sig, f, T, want};
    },
    tCols() {
      return [{h: this.t('Kolom')}, ...this.m.T.map((_, i) => ({h: String(i + 1), num: true}))];
    },
    tRows() { return [[this.t('T (°C)'), ...this.m.T.map(v => F(v, 1))]]; },
    wCols() {
      const t = this.t;
      return [{h: t('Gewenst (°C)'), num: true}, {h: t('Kolom'), num: true},
        {h: t('Temperatuur daar (°C)'), num: true}, {h: t('Verschil'), num: true}];
    },
    wRows() {
      const t = this.t;
      return this.m.want.map(w => [F(w.t, 1), w.outr ? '–' : String(w.k),
        w.outr ? t('buiten de gradiënt') : F(w.v, 1), w.outr ? '–' : F(w.v - w.t, 1)]);
    }
  },
  mounted() { this.draw(); },
  updated() { this.draw(); },
  methods: {
    F,
    draw() {
      const cv = document.getElementById('gr-cv'), m = this.m; if (!cv || !m) return;
      chart(cv, {xmin: 0.5, xmax: m.n + 0.5, ymin: Math.floor(m.lo - 2), ymax: Math.ceil(m.hi + 2),
        xlabel: 'kolom', ylabel: 'temperatuur (°C)',
        series: [{fn: x => m.f(x), x0: 1, x1: m.n},
          {pts: m.T.map((v, i) => [i + 1, v]), name: 'kolommen'},
          {pts: m.want.filter(w => !w.outr).map(w => [w.k, w.t]), color: '--warn', hollow: true, name: 'gewenst'}]});
    }
  }
};
</script>
