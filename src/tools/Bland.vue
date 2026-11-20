<!-- ================= BLAND-ALTMAN (METHODEVERGELIJKING) =================
     De velden en de uitkomst zijn Vue; het rekenwerk blijft blandPairs() en blandCalc() in
     tools/nt/84_bland.js. De grafiek wordt met chart() op het canvas getekend, na elke render,
     net als bij de Overlevingscurve. Het canvas zelf blijft buiten Vue, en tekst die erop komt
     loopt al door trCanvas().

     De id's ba-d, ba-m, ba-lim, ba-cv en ba-out blijven zoals ze waren. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <div class="f" style="grid-column:1/-1">
          <label for="ba-d">{{ t('Methode A en methode B, één monster per regel') }} <span class="example">{{ t('voorbeeld') }}</span></label>
          <textarea id="ba-d" rows="10" v-model="data"></textarea>
        </div>
        <div class="f">
          <label for="ba-m">{{ t('Verschil als') }}</label>
          <select id="ba-m" v-model="mode">
            <option value="abs">{{ t('B − A (absoluut)') }}</option>
            <option value="pct">{{ t('(B − A) / gemiddelde (%)') }}</option>
          </select>
        </div>
        <lk-field v-model="lim" :label="t('Klinisch aanvaardbaar verschil (optioneel)')" for-id="ba-lim"/>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Twee kolommen plakken uit Excel kan. Een hoge correlatie zegt niets over overeenstemming; daarvoor is deze analyse bedoeld. Voorbeelddata zijn verzonnen.') }}</p>
    </div>
    <div class="result">
      <canvas id="ba-cv" v-show="ok"></canvas>
      <div id="ba-out">
        <lk-note v-if="!ok" kind="info">{{ t('Vul minstens drie paren metingen in (twee getallen per regel).') }}</lk-note>
        <template v-else>
          <lk-big :label="t('Bias (B − A)')" :value="G(M.b, 3) + u" :sub="'95%: ' + G(M.b - M.t * M.seB, 3) + ' – ' + G(M.b + M.t * M.seB, 3)"/>
          <lk-kv :rows="rows"/>
          <lk-note v-if="M.pb < 0.05" kind="warn">{{ t('Het verschil hangt samen met de grootte van de meting; overweeg verschillen in procenten of een log-transformatie.') }}</lk-note>
          <lk-note v-if="limNote" :kind="limNote.kind">{{ limNote.text }}</lk-note>
          <lk-formula :html="tHtml('d̄ ± 1,96·s<sub>d</sub> · SE(grens) ≈ √(3s<sub>d</sub>²/n)')"/>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => fmt(x, d), G = (x, d) => sig(x, d);

export default {
  name: 'Bland',
  data() {
    return {
      data: lkNumIn(['4,8 5,1', '6,2 6,0', '7,9 8,3', '5,5 5,9', '9,8 10,4', '3,1 3,0', '6,7 7,2', '8,4 8,6',
        '4,2 4,6', '7,1 7,0', '5,9 6,4', '10,6 11,1', '3,8 4,1', '6,0 6,1', '8,9 9,6'].join('\n')),
      mode: 'abs', lim: ''
    };
  },
  computed: {
    pct() { return this.mode === 'pct'; },
    u() { return this.pct ? '%' : ''; },
    P() { return blandPairs(this.data, this.pct); },
    ok() { return this.P.length >= 3; },
    M() { return this.ok ? blandCalc(this.P) : null; },
    rows() {
      const t = this.t, M = this.M, u = this.u, {b, s, t: tq, lo, hi, seL, r, pb, p0, n} = M;
      return [
        [t('Grenzen van overeenstemming'), `${G(lo, 3)} – ${G(hi, 3)}${u}`],
        [t('95%-interval ondergrens'), `${G(lo - tq * seL, 3)} – ${G(lo + tq * seL, 3)}`],
        [t('95%-interval bovengrens'), `${G(hi - tq * seL, 3)} – ${G(hi + tq * seL, 3)}`],
        [t('SD van de verschillen'), G(s, 3) + u],
        [t('Bias ≠ 0?'), p0 < 0.001 ? this.tHtml('p &lt; 0,001 (gepaarde t-toets)') : t(`p = ${F(p0, 3)} (gepaarde t-toets)`)],
        [t('Proportionele afwijking'), pb < 0.001 ? this.tHtml(`helling ${G(r.b, 3)}, p &lt; 0,001`) : t(`helling ${G(r.b, 3)}, p = ${F(pb, 3)}`)],
        [t('Paren'), n]
      ];
    },
    limNote() {
      const lim = num(this.lim); if (!(lim > 0)) return null;
      const t = this.t, {lo, hi, t: tq, seL} = this.M, u = this.u;
      const inside = Math.max(Math.abs(lo - tq * seL), Math.abs(hi + tq * seL)) <= lim;
      return {kind: inside ? 'ok' : 'warn',
        text: inside ? t(`Met het 95%-interval van de grenzen meegenomen liggen de verschillen binnen ±${G(lim, 3)}${u}.`)
          : t(`Met het 95%-interval van de grenzen meegenomen liggen de verschillen niet zeker binnen ±${G(lim, 3)}${u}.`)};
    }
  },
  mounted() { this.draw(); },
  updated() { this.draw(); },
  methods: {
    G,
    /* de tekening wordt na elke render bijgewerkt; dat houdt canvas en uitkomst bij elkaar */
    draw() {
      const cv = document.getElementById('ba-cv'); if (!cv || !this.M) return;
      const {d, m, b, lo, hi, t, seL} = this.M, P = this.P;
      const ys = [...d, lo - t * seL, hi + t * seL], y0 = Math.min(...ys), y1 = Math.max(...ys), pd = (y1 - y0) * 0.1 || 1,
        x0 = Math.min(...m), x1 = Math.max(...m), px = (x1 - x0) * 0.06 || 1;
      chart(cv, {xmin: x0 - px, xmax: x1 + px, ymin: y0 - pd, ymax: y1 + pd, xlabel: 'gemiddelde van A en B',
        ylabel: this.pct ? 'verschil (%)' : 'verschil B − A',
        series: [{fn: () => b, name: 'bias'}, {fn: () => lo, color: '--warn', dash: [5, 4]}, {fn: () => hi, color: '--warn', dash: [5, 4]},
          {pts: P, color: '--ink', name: 'monsters'}]});
    }
  }
};
</script>
