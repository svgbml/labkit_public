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
            <option value="log">{{ t('B / A (log-verhouding)') }}</option>
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
          <lk-big :label="log ? t('Gemiddelde verhouding B / A') : t('Bias (B − A)')" :value="G(X(M.b), 3) + u" :sub="'95%: ' + G(X(M.b - M.t * M.seB), 3) + ' – ' + G(X(M.b + M.t * M.seB), 3)"/>
          <lk-kv :rows="rows"/>
          <lk-note v-if="M.pb < 0.05" kind="warn">{{ t(log ? 'Ook de log-verhouding hangt samen met de grootte van de meting; de gestippelde regressielijn in de grafiek laat zien hoe de afwijking verloopt.' : 'Het verschil hangt samen met de grootte van de meting; overweeg verschillen in procenten of een log-transformatie (B / A). De gestippelde regressielijn in de grafiek laat zien hoe de afwijking verloopt.') }}</lk-note>
          <lk-note v-if="log && dropped" kind="warn">{{ t(dropped + ' paren overgeslagen: een log-verhouding kan alleen met waarden boven nul.') }}</lk-note>
          <lk-note v-if="limNote" :kind="limNote.kind">{{ limNote.text }}</lk-note>
          <lk-formula :html="tHtml(log ? 'd = ln(B/A); verhouding = e<sup>d̄</sup>, grenzen = e<sup>d̄ ± 1,96·s<sub>d</sub></sup> (Bland &amp; Altman 1999)' : 'd̄ ± 1,96·s<sub>d</sub> · SE(grens) ≈ √(3s<sub>d</sub>²/n)')"/>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => lkNumIn(fmt(x, d)), G = (x, d) => lkNumIn(sig(x, d));

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
    /* S114 (#217): log-verhouding. blandPairs() geeft [gemiddelde, B − A]; daaruit volgen A en B
       terug, en d = ln(B/A). Bias en grenzen gaan terug met e^x, als verhouding B/A. */
    log() { return this.mode === 'log'; },
    X() { return this.log ? Math.exp : x => x; },
    u() { return this.pct ? '%' : ''; },
    raw() { return blandPairs(this.data, false); },
    P() {
      if (!this.log) return blandPairs(this.data, this.pct);
      return this.raw.map(([m, d]) => [m, Math.log((m + d / 2) / (m - d / 2))]).filter(p => isFinite(p[1]));
    },
    dropped() { return this.raw.length - this.P.length; },
    ok() { return this.P.length >= 3; },
    M() { return this.ok ? blandCalc(this.P) : null; },
    rows() {
      const t = this.t, M = this.M, u = this.u, X = this.X, {b, s, t: tq, lo, hi, seL, r, pb, p0, n} = M;
      return [
        [t(this.log ? 'Grenzen van overeenstemming (B / A)' : 'Grenzen van overeenstemming'), `${G(X(lo), 3)} – ${G(X(hi), 3)}${u}`],
        [t('95%-interval ondergrens'), `${G(X(lo - tq * seL), 3)} – ${G(X(lo + tq * seL), 3)}`],
        [t('95%-interval bovengrens'), `${G(X(hi - tq * seL), 3)} – ${G(X(hi + tq * seL), 3)}`],
        [t(this.log ? 'SD van ln(B/A)' : 'SD van de verschillen'), G(s, 3) + u],
        [t('Bias ≠ 0?'), p0 < 0.001 ? this.tHtml('p &lt; 0,001 (gepaarde t-toets)') : t(`p = ${fmt(p0, 3)} (gepaarde t-toets)`)],
        [t('Proportionele afwijking'), pb < 0.001 ? this.tHtml(`helling ${sig(r.b, 3)}, p &lt; 0,001`) : t(`helling ${sig(r.b, 3)}, p = ${fmt(pb, 3)}`)],
        [t('Paren'), n]
      ];
    },
    limNote() {
      const lim = num(this.lim); if (!(lim > 0) || this.log) return null;
      const t = this.t, {lo, hi, t: tq, seL} = this.M, u = this.u;
      const inside = Math.max(Math.abs(lo - tq * seL), Math.abs(hi + tq * seL)) <= lim;
      return {kind: inside ? 'ok' : 'warn',
        text: inside ? t(`Met het 95%-interval van de grenzen meegenomen liggen de verschillen binnen ±${sig(lim, 3)}${u}.`)
          : t(`Met het 95%-interval van de grenzen meegenomen liggen de verschillen niet zeker binnen ±${sig(lim, 3)}${u}.`)};
    }
  },
  mounted() { this.draw(); },
  updated() { this.draw(); },
  methods: {
    G,
    /* de tekening wordt na elke render bijgewerkt; dat houdt canvas en uitkomst bij elkaar */
    draw() {
      const cv = document.getElementById('ba-cv'); if (!cv || !this.M) return;
      const {d, m, b, lo, hi, t, seL, r, pb} = this.M, X = this.X, P = this.P.map(([x, y]) => [x, X(y)]);
      const ys = [...d, lo - t * seL, hi + t * seL].map(X), y0 = Math.min(...ys), y1 = Math.max(...ys), pd = (y1 - y0) * 0.1 || 1,
        x0 = Math.min(...m), x1 = Math.max(...m), px = (x1 - x0) * 0.06 || 1;
      const series = [{fn: () => X(b), name: 'bias'}, {fn: () => X(lo), color: '--warn', dash: [5, 4]}, {fn: () => X(hi), color: '--warn', dash: [5, 4]},
        {pts: P, color: '--ink', name: 'monsters'}];
      /* proportionele afwijking: de regressielijn van het verschil op het gemiddelde erbij */
      if (pb < 0.05) series.splice(3, 0, {fn: x => X(r.a + r.b * x), color: '--accent', dash: [2, 3], name: 'regressie'});
      chart(cv, {xmin: x0 - px, xmax: x1 + px, ymin: y0 - pd, ymax: y1 + pd, xlabel: 'gemiddelde van A en B',
        ylabel: this.log ? 'verhouding B / A' : this.pct ? 'verschil (%)' : 'verschil B − A', series});
    }
  }
};
</script>
