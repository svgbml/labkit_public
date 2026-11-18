/* ================= Z′-FACTOR =================
   Op Vue 3 met de gedeelde componenten uit lib/ui.js, en de eerste tool met een tekening
   erbij. Het canvas blijft met de gewone tekencontext gemaakt: Vue beheert de velden en de
   uitkomst en tekent na elke render opnieuw. Een virtuele DOM heeft op een <canvas> geen nut,
   en tekst die op een canvas komt loopt al door trCanvas(), dus die wordt nog gewoon vertaald
   en door tests/i18n_collect.py gezien.

   De id's zp-pos, zp-neg, zp-s, zp-cv en zp-out blijven zoals ze waren. */
import {lkVueMount, lkNumIn} from '../lib/bridge.js';

const ZP_TPL = `<div class="grid2">
  <div class="panel">
    <div class="fields">
      <div class="f" style="grid-column:1/-1"><label for="zp-pos">{{ t('Positieve controle') }} <span class="example">{{ t('voorbeeld') }}</span></label><textarea id="zp-pos" rows="3" v-model="pos"></textarea></div>
      <div class="f" style="grid-column:1/-1"><label for="zp-neg">{{ t('Negatieve controle') }}</label><textarea id="zp-neg" rows="3" v-model="neg"></textarea></div>
      <div class="f" style="grid-column:1/-1"><label for="zp-s">{{ t('Monsters (optioneel)') }}</label><textarea id="zp-s" rows="2" v-model="smp"></textarea></div>
    </div>
    <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Getallen scheiden met spaties of regels; plakken uit Excel mag. Gebruik minstens 8 en liefst 16 of meer controleputjes, verspreid over de plaat. Voorbeelddata zijn verzonnen.') }}</p>
  </div>
  <div class="result"><canvas id="zp-cv" v-show="ok"></canvas><div id="zp-out">
    <lk-note v-if="!ok" kind="info">{{ t('Vul minstens twee waarden voor beide controles in.') }}</lk-note>
    <template v-else>
      <lk-big :label="t('Z′-factor')" :value="zText" :chip="grade.text" :chip-kind="grade.kind"/>
      <lk-kv :rows="rows"/>
      <lk-kv v-if="sampleRows.length" :rows="sampleRows"/>
      <lk-note v-if="few" kind="info">{{ t('Met minder dan 8 controles per groep is de Z′ onnauwkeurig.') }}</lk-note>
      <lk-formula :html="tHtml('Z′ = 1 − 3(σ&lt;sub&gt;p&lt;/sub&gt; + σ&lt;sub&gt;n&lt;/sub&gt;) / |μ&lt;sub&gt;p&lt;/sub&gt; − μ&lt;sub&gt;n&lt;/sub&gt;| · banden: μ ± 3σ')"/>
    </template>
  </div></div>
</div>`;

const zpVue = lkVueMount('#zp-app', {
  template: ZP_TPL,
  data() { return {
    pos: lkNumIn('1,842 1,905 1,778 1,861 1,920 1,812 1,889 1,850 1,795 1,874 1,903 1,836'),
    neg: lkNumIn('0,212 0,198 0,225 0,204 0,231 0,190 0,218 0,207 0,215 0,199 0,226 0,210'),
    smp: ''
  }; },
  computed: {
    sets() { return {P: numsC(this.pos), N: numsC(this.neg), S: numsC(this.smp)}; },
    ok() { const {P, N} = this.sets; return P.length >= 2 && N.length >= 2; },
    few() { const {P, N} = this.sets; return P.length < 8 || N.length < 8; },
    stats() {
      const {P, N} = this.sets, mp = mean(P), sp = sd(P), mn = mean(N), sn = sd(N);
      const d = Math.abs(mp - mn);
      return {mp, sp, mn, sn, d, z: d > 0 ? 1 - 3 * (sp + sn) / d : -Infinity};
    },
    zText() { const z = this.stats.z; return isFinite(z) ? lkNumIn(fmt(z, 3)) : '–'; },
    grade() {
      const z = this.stats.z, t = this.t;
      if (z >= 1) return {kind: 'ok', text: t('ideaal')};
      if (z >= 0.5) return {kind: 'ok', text: t('uitstekend')};
      if (z >= 0) return {kind: 'warn', text: t('matig')};
      return {kind: 'bad', text: t('onbruikbaar')};
    },
    rows() {
      const t = this.t, {P, N} = this.sets, {mp, sp, mn, sn, d} = this.stats;
      const F = (x, dd) => lkNumIn(fmt(x, dd)), G = (x, dd) => lkNumIn(sig(x, dd));
      return [[t('Positief: gemiddelde ± SD'), `${G(mp, 4)} ± ${G(sp, 3)} (${t('CV')} ${F(sp / Math.abs(mp) * 100, 1)}%, n = ${P.length})`],
        [t('Negatief: gemiddelde ± SD'), `${G(mn, 4)} ± ${G(sn, 3)} (${t('CV')} ${F(sn / Math.abs(mn) * 100, 1)}%, n = ${N.length})`],
        [t('Signaal / achtergrond'), mn !== 0 ? F(mp / mn, 2) : '–'],
        [t('Signaal / ruis'), sn > 0 ? F(d / sn, 1) : '–'],
        [t('Scheidingsband'), G(d - 3 * (sp + sn), 3)]];
    },
    sampleRows() {
      const {S} = this.sets; if (S.length <= 1) return [];
      const t = this.t, {mn, sn} = this.stats, ms = mean(S), ss = sd(S);
      const zs = Math.abs(ms - mn) > 0 ? 1 - 3 * (ss + sn) / Math.abs(ms - mn) : NaN;
      return [[t('Monsters: gemiddelde ± SD'), `${lkNumIn(sig(ms, 4))} ± ${lkNumIn(sig(ss, 3))} (n = ${S.length})`],
        [t('Z-factor monsters'), lkNumIn(fmt(zs, 3))]];
    }
  },
  /* de tekening wordt na elke render bijgewerkt; dat is goedkoop en houdt canvas en uitkomst
     bij elkaar zonder dat Vue iets van het canvas hoeft te weten */
  mounted() { this.draw(); },
  updated() { this.draw(); },
  methods: {
    draw() {
      const cv = document.getElementById('zp-cv'); if (!cv || !this.ok) return;
      const {P, N, S} = this.sets, {mp, sp, mn, sn} = this.stats, all = [...P, ...N, ...S];
      const y0 = Math.min(...all, mn - 3 * sn, mp - 3 * sp), y1 = Math.max(...all, mp + 3 * sp, mn + 3 * sn);
      const pad = (y1 - y0) * 0.08, n = Math.max(P.length, N.length, S.length);
      const g = chart(cv, {xmin: 0, xmax: n + 1, ymin: y0 - pad, ymax: y1 + pad, xlabel: 'putje', ylabel: 'signaal',
        series: [{fn: () => mp, name: 'μ positief'}, {fn: () => mn, color: '--muted', name: 'μ negatief'},
          {pts: P.map((v, i) => [i + 1, v]), name: 'positief'},
          {pts: N.map((v, i) => [i + 1, v]), color: '--muted', name: 'negatief'},
          {pts: S.map((v, i) => [i + 1, v]), color: '--warn', name: 'monsters', hollow: true}]});
      const c = cv.getContext('2d'); c.fillStyle = 'rgba(120,140,170,.15)';
      [[mp, sp], [mn, sn]].forEach(([m, s]) => { const a = g.Y(m + 3 * s), b = g.Y(m - 3 * s);
        c.fillRect(g.X(0), a, g.X(n + 1) - g.X(0), b - a); });
    }
  }
});
calc.zprime = () => { if (zpVue && zpVue.vm) zpVue.vm.draw(); };
