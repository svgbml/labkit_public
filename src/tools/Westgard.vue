<!-- ================= WESTGARD / LEVEY-JENNINGS =================
     De velden en de uitkomst zijn Vue; het rekenwerk blijft westgardCalc() in
     tools/nt/31_westgard.js. De kaart wordt met chart() op het canvas getekend, na elke render,
     net als bij de Overlevingscurve. Het canvas zelf blijft buiten Vue, en tekst die erop komt
     loopt al door trCanvas().

     De id's wg-m, wg-s, wg-x, wg-est, wg-cv en wg-out blijven zoals ze waren. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <lk-field v-model="m" :label="t('Streefwaarde (gemiddelde)')" for-id="wg-m"/>
        <lk-field v-model="s" :label="t('Standaardafwijking')" for-id="wg-s"/>
        <div class="f" style="grid-column:1/-1">
          <label for="wg-x">{{ tHtml('Controlemetingen in volgorde <span class="example">voorbeeld</span>') }}</label>
          <textarea id="wg-x" rows="5" v-model="x"></textarea>
        </div>
        <label class="chk" for="wg-est" style="grid-column:1/-1">
          <input type="checkbox" id="wg-est" v-model="est"> {{ t('Gemiddelde en SD schatten uit de eerste 20 metingen') }}
        </label>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Gebruik een streefwaarde en SD uit een eerdere stabiele periode (minstens 20 metingen), niet uit de reeks die je beoordeelt. Voorbeelddata zijn verzonnen.') }}</p>
    </div>
    <div class="result">
      <canvas id="wg-cv" v-show="ok"></canvas>
      <div id="wg-out">
        <lk-note v-if="!ok" kind="info">{{ t('Vul streefwaarde, SD en metingen in.') }}</lk-note>
        <template v-else>
          <lk-big :label="t('Afgekeurde metingen')" :value="W.nRej" :sub="t(`van ${xs.length}`)"/>
          <lk-kv :rows="kv"/>
          <lk-table v-if="rows.length" :cols="cols" :rows="rows"/>
          <lk-note v-else kind="ok">{{ t('Geen overtredingen van de Westgard-regels.') }}</lk-note>
          <lk-formula :html="formula"/>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => fmt(x, d), G = (x, d) => sig(x, d);

export default {
  name: 'Westgard',
  data() {
    return {
      m: lkNumIn('5,0'), s: lkNumIn('0,2'),
      x: lkNumIn('5,1 4,9 5,0 5,2 4,8 5,1 5,3 5,0 4,9 5,45 5,46 5,1 4,7 5,0 5,25 5,22 5,28 5,3 5,0 4,95 4,4'),
      est: false
    };
  },
  computed: {
    formula() { return this.tHtml('z = (x − x̄) / s · 1₃ₛ: |z| &gt; 3 · 2₂ₛ: 2× z &gt; 2 aan dezelfde kant · R₄ₛ: verschil &gt; 4s · 4₁ₛ: 4× |z| &gt; 1 zelfde kant · 10ₓ: 10× zelfde kant van het gemiddelde'); },
    xs() { return numsC(this.x); },
    /* de maten uit westgardCalc(); null zolang streefwaarde, SD of metingen ontbreken */
    W() { return westgardCalc(this.xs, num(this.m), num(this.s), this.est); },
    ok() { return !!this.W; },
    kv() {
      const t = this.t, {m, s, warnOnly} = this.W;
      return [[t('Streefwaarde ± SD'), `${G(m, 4)} ± ${G(s, 3)}`],
        [t('Waarschuwingen (alleen 1₂ₛ)'), warnOnly.filter(Boolean).length],
        [t('CV'), F(s / m * 100, 1) + '%']];
    },
    cols() { const t = this.t; return [{h: '#', num: true}, {h: t('Waarde'), num: true}, {h: 'z', num: true}, {h: t('Regels')}]; },
    rows() {
      const {z, V} = this.W;
      return this.xs.map((x, i) => [i + 1, x, z[i], V[i]]).filter(r => r[3].length).map(r => [r[0], G(r[1], 4), F(r[2], 2),
        r[3].map(n => `<span class="chip ${n === '1₂ₛ' ? 'warn' : 'bad'}" style="margin-right:3px">${n}</span>`).join('')]);
    }
  },
  mounted() { this.draw(); },
  updated() { this.draw(); },
  methods: {
    /* de tekening wordt na elke render bijgewerkt; dat houdt canvas en uitkomst bij elkaar */
    draw() {
      const cv = document.getElementById('wg-cv'); if (!cv || !this.W) return;
      const xs = this.xs, {m, s, rej, warnOnly} = this.W;
      const lo = Math.min(m - 3.5 * s, ...xs), hi = Math.max(m + 3.5 * s, ...xs);
      const C = chart(cv, {xmin: 0.5, xmax: xs.length + 0.5, ymin: lo, ymax: hi, xlabel: 'meting', ylabel: 'waarde', series: [{fn: () => m, color: '--ink'},
        ...[1, 2, 3].flatMap(k => [{fn: () => m + k * s, color: k === 3 ? '--bad' : k === 2 ? '--warn' : '--line', dash: [5, 4]}, {fn: () => m - k * s, color: k === 3 ? '--bad' : k === 2 ? '--warn' : '--line', dash: [5, 4]}]),
        {pts: xs.map((x, i) => [i + 1, x]).filter((p, i) => !rej[i] && !warnOnly[i]), color: '--accent'},
        {pts: xs.map((x, i) => [i + 1, x]).filter((p, i) => warnOnly[i]), color: '--warn', r: 4.5},
        {pts: xs.map((x, i) => [i + 1, x]).filter((p, i) => rej[i]), color: '--bad', r: 5}]});
      const ctx = cv.getContext('2d'); ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--muted'); ctx.lineWidth = 1; ctx.beginPath();
      xs.forEach((x, i) => { i ? ctx.lineTo(C.X(i + 1), C.Y(x)) : ctx.moveTo(C.X(i + 1), C.Y(x)); }); ctx.stroke();
    }
  }
};
</script>
