<!-- ================= ROC-CURVE & DIAGNOSTISCHE TEST =================
     De velden en de uitkomst zijn Vue; het rekenwerk blijft rocCalc() in tools/nt/85_roc.js.
     De curve wordt met chart() op het canvas getekend, na elke render, net als bij de
     Overlevingscurve. Het canvas zelf blijft buiten Vue, en tekst die erop komt loopt al door
     trCanvas().

     De id's ro-p, ro-n, ro-dir, ro-c, ro-prev, ro-cv en ro-out blijven zoals ze waren. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <div class="f" style="grid-column:1/-1">
          <label for="ro-p">{{ t('Positief (ziek, aanwezig)') }} <span class="example">{{ t('voorbeeld') }}</span></label>
          <textarea id="ro-p" rows="3" v-model="p"></textarea>
        </div>
        <div class="f" style="grid-column:1/-1">
          <label for="ro-n">{{ t('Negatief (gezond, afwezig)') }}</label>
          <textarea id="ro-n" rows="3" v-model="n"></textarea>
        </div>
        <div class="f">
          <label for="ro-dir">{{ t('Richting') }}</label>
          <select id="ro-dir" v-model="dir">
            <option value="hi">{{ t('hoger = positief') }}</option>
            <option value="lo">{{ t('lager = positief') }}</option>
          </select>
        </div>
        <lk-field v-model="c" :label="t('Afkapwaarde (leeg = optimaal)')" for-id="ro-c"/>
        <lk-field v-model="prev" :label="t('Prevalentie')" for-id="ro-prev" unit="%"/>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Waarden van monsters waarvan je de echte status kent (referentietest). Een waarde gelijk aan de afkapwaarde telt als positief. Voorbeelddata zijn verzonnen.') }}</p>
    </div>
    <div class="result">
      <canvas id="ro-cv" v-show="ok" style="cursor:crosshair" @click="pick"></canvas>
      <p v-if="ok" style="font-size:13px;color:var(--muted);margin:4px 0 8px">{{ t('Klik op de curve om een afkapwaarde te kiezen.') }}
        <button v-if="c !== ''" type="button" id="ro-best" @click="c = ''">{{ t('Terug naar de optimale (Youden)') }}</button></p>
      <div id="ro-out">
        <lk-note v-if="!ok" kind="info">{{ t('Vul minstens twee positieve en twee negatieve waarden in.') }}</lk-note>
        <template v-else>
          <lk-big label="AUC" :value="F(M.A, 3)" :sub="'95%: ' + F(Math.max(0, M.A - 1.96 * M.se), 3) + ' – ' + F(Math.min(1, M.A + 1.96 * M.se), 3)"/>
          <lk-kv :rows="rows"/>
          <!-- S114 (#218): de kruistabel bij de gekozen afkapwaarde -->
          <div class="tbl-wrap"><lk-table table-id="ro-cm" :cols="cmCols" :rows="cmRows" :wrap="false"/></div>
          <lk-note v-if="M.A < 0.5" kind="warn">{{ t('AUC onder 0,5: draai de richting om.') }}</lk-note>
          <lk-formula :html="tHtml('AUC = U/(n<sub>p</sub>·n<sub>n</sub>) · J = sens + spec − 1')"/>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => lkNumIn(fmt(x, d)), G = (x, d) => lkNumIn(sig(x, d));

export default {
  name: 'Roc',
  data() {
    return {
      p: lkNumIn('2,8 3,5 1,9 4,2 3,1 2,4 5,0 3,8 2,2 4,6 3,3 1,6 2,9 3,7 4,9'),
      n: lkNumIn('1,1 0,8 1,5 2,0 0,6 1,3 1,9 0,9 1,2 2,6 1,4 0,7 1,0 1,7 2,3 1,1 0,5 1,6'),
      dir: 'hi', c: '', prev: '10'
    };
  },
  computed: {
    /* de afkapwaarden in de volgorde van de punten op de curve (punt i + 1 hoort bij afkap i) */
    cuts() {
      const hi = this.dir === 'hi', P = numsC(this.p).map(v => hi ? v : -v), N = numsC(this.n).map(v => hi ? v : -v);
      return [...new Set([...P, ...N])].sort((a, b) => b - a);
    },
    /* de kruistabel: aantallen uit sensitiviteit en specificiteit bij de gekozen afkap */
    cm() {
      const {ch, np, nn} = this.M, tp = Math.round(ch.se * np), tn = Math.round(ch.sp * nn);
      return {tp, fn: np - tp, tn, fp: nn - tn};
    },
    cmCols() { return [{h: ''}, {h: this.t('Echt positief'), num: true}, {h: this.t('Echt negatief'), num: true}, {h: this.t('Totaal'), num: true}]; },
    cmRows() {
      const t = this.t, {tp, fn, tn, fp} = this.cm;
      return [[t('Test positief'), tp, fp, tp + fp], [t('Test negatief'), fn, tn, fn + tn], [t('Totaal'), tp + fn, fp + tn, tp + fn + fp + tn]];
    },
    /* de maten uit rocCalc(); null zolang er te weinig waarden zijn */
    M() {
      const hi = this.dir === 'hi', P = numsC(this.p).map(v => hi ? v : -v), N = numsC(this.n).map(v => hi ? v : -v);
      if (P.length < 2 || N.length < 2) return null;
      return rocCalc(P, N, num(this.c), num(this.prev) / 100, hi);
    },
    ok() { return !!this.M; },
    rows() {
      const t = this.t, M = this.M, cu = num(this.c), prev = num(this.prev) / 100, {best, ch, rc, ppv, npv, lrp, lrn} = M;
      return [
        [t('Optimale afkapwaarde (Youden)'), `${G(rc(best.c), 4)} (J = ${F(best.J, 3)})`],
        [isFinite(cu) ? t(`Bij afkapwaarde ${sig(cu, 4)}`) : t('Bij de optimale afkapwaarde'),
          t(`sensitiviteit ${fmt(ch.se * 100, 1)}%, specificiteit ${fmt(ch.sp * 100, 1)}%`)],
        [t(`PPV / NPV bij ${fmt(prev * 100, 1)}% prevalentie`), `${F(ppv * 100, 1)}% / ${F(npv * 100, 1)}%`],
        [t('LR+ / LR−'), `${isFinite(lrp) ? F(lrp, 2) : '∞'} / ${F(lrn, 3)}`],
        [t('Positief / negatief'), `${M.np} / ${M.nn}`]
      ];
    }
  },
  mounted() { this.draw(); },
  updated() { this.draw(); },
  methods: {
    F,
    /* een klik op de curve kiest het dichtstbijzijnde punt als afkapwaarde */
    pick(e) {
      const g = this._g, M = this.M; if (!g || !M) return;
      const r = e.currentTarget.getBoundingClientRect(), k = 420 / r.width, x = (e.clientX - r.left) * k, y = (e.clientY - r.top) * k;
      let bi = -1, bd = Infinity;
      this.cuts.forEach((c, i) => { const q = M.pts[i + 1], d = (g.X(q[0]) - x) ** 2 + (g.Y(q[1]) - y) ** 2; if (d < bd) { bd = d; bi = i; } });
      if (bi >= 0) this.c = lkNumIn(String(M.rc(this.cuts[bi])).replace('.', ','));   // lkNumIn() verwacht Nederlandse notatie
    },
    /* de tekening wordt na elke render bijgewerkt; dat houdt canvas en uitkomst bij elkaar */
    draw() {
      const cv = document.getElementById('ro-cv'); if (!cv || !this.M) return;
      const {ch, pts, best} = this.M;
      const g = chart(cv, {xmin: 0, xmax: 1, ymin: 0, ymax: 1, w: 420, h: 380, xlabel: '1 − specificiteit', ylabel: 'sensitiviteit',
        series: [{fn: x => x, color: '--muted', dash: [4, 4]}, {pts: [[1 - best.sp, best.se]], color: '--ok', r: 4, name: 'Youden'},
          {pts: [[1 - ch.sp, ch.se]], color: '--warn', r: 5, name: 'afkapwaarde'}]});
      this._g = g;
      const c = cv.getContext('2d'); c.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#1558b0';
      c.lineWidth = 2; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(g.X(p[0]), g.Y(p[1])) : c.moveTo(g.X(p[0]), g.Y(p[1]))); c.stroke();
      cv._data = {head: ['1 − specificiteit', 'sensitiviteit'], rows: pts};
    }
  }
};
</script>
