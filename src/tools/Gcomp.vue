<!-- ================= GROEICURVES VERGELIJKEN (GOMPERTZ) =================
     De velden en de uitkomst van het vergelijken van groeicurves. gompertz(), fitGompertz(),
     parseCols() en SERCOL blijven in web/index.html staan; het rekenwerk is dat van
     calc.gcomp, ongewijzigd, maar nu in een computed. De tekening blijft met chart() gemaakt
     en wordt na elke render opnieuw getekend (draw()), net als bij Sterilisatie.

     De id's gm-tu, gm-type, gm-blank, gm-data, gm-cv en gm-out blijven zoals ze waren. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <div class="f"><label for="gm-tu">{{ t('Tijdseenheid') }}</label>
          <select id="gm-tu" style="width:100%" v-model="tu"><option value="h">{{ t('uur') }}</option><option value="min">{{ t('minuten') }}</option></select></div>
        <div class="f"><label for="gm-type">{{ t('Meetwaarde') }}</label>
          <select id="gm-type" style="width:100%" v-model="type"><option value="od">{{ t('OD₆₀₀') }}</option><option value="kve">{{ t('KVE/mL') }}</option></select></div>
        <lk-field v-model="blank" :label="t('Blanco (OD)')" for-id="gm-blank"/>
      </div>
      <div class="f" style="margin-top:12px">
        <label for="gm-data" v-html="dataLabel"></label>
        <textarea id="gm-data" rows="11" spellcheck="false" v-model="txt"></textarea>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:8px 0 0">{{ t('Plak direct uit Excel. De voorbeelddata zijn verzonnen.') }}</p>
    </div>
    <div class="result">
      <canvas id="gm-cv"></canvas>
      <div id="gm-out">
        <lk-note v-if="m.err === 1" kind="info">{{ t('Plak een tijdkolom en minstens één kolom met metingen.') }}</lk-note>
        <lk-note v-else-if="m.err === 2" kind="info">{{ t('Elke reeks heeft minstens 5 meetpunten boven de blanco nodig.') }}</lk-note>
        <template v-else>
          <div class="tbl-wrap" style="margin-top:8px"><table class="mini">
            <thead><tr><th>{{ t('Curve') }}</th><th class="num" v-html="tHtml('µ&lt;sub&gt;m&lt;/sub&gt; (h⁻¹)')"></th>
              <th class="num">{{ t('Verdubbelingstijd (min)') }}</th><th class="num">{{ t('Lag λ (' + (m.tu === 'min' ? 'min' : 'u') + ')') }}</th>
              <th class="num" v-html="tHtml('A = ln(N&lt;sub&gt;max&lt;/sub&gt;/N₀)')"></th><th class="num">{{ t('R²') }}</th></tr></thead>
            <tbody><tr v-for="(r, i) in m.res" :key="i"><td>{{ r.name }}</td><td class="num">{{ F(r.mu, 3) }}</td><td class="num">{{ F(r.td, 1) }}</td>
              <td class="num">{{ F(m.tu === 'min' ? r.lam * 60 : r.lam, 2) }}</td><td class="num">{{ F(r.A, 2) }}</td><td class="num">{{ F(r.r2, 4) }}</td></tr></tbody>
          </table></div>
          <lk-note v-if="m.isOD" kind="info">{{ t('Boven OD ≈ 1 is OD niet meer evenredig met het celaantal; dat drukt A en de plateaufase.') }}</lk-note>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => lkNumIn(fmt(x, d));
const DATA = 'tijd\tWildtype\tMutant\n0\t0,050\t0,050\n1\t0,052\t0,051\n2\t0,066\t0,054\n3\t0,121\t0,062\n4\t0,262\t0,083\n5\t0,522\t0,135\n'
  + '6\t0,870\t0,245\n7\t1,180\t0,430\n8\t1,380\t0,680\n9\t1,480\t0,930\n10\t1,520\t1,110';

export default {
  name: 'Gcomp',
  data() {
    return {tu: 'h', type: 'od', blank: '0', txt: lkNumIn(DATA)};
  },
  computed: {
    dataLabel() {
      return this.tHtml('Data: eerste kolom tijd, daarna één kolom per stam (eerste regel = namen) <span class="example">voorbeeld</span>');
    },
    /* het rekenwerk van calc.gcomp, ongewijzigd */
    m() {
      const D = parseCols(this.txt);
      if (!D || !D.series.length) return {err: 1};
      const tu = this.tu, isOD = this.type === 'od', blank = isOD ? (num(this.blank) || 0) : 0;
      const res = []; const ser = []; let ymax = 0, tmax = 0;
      D.series.forEach((s, k) => {
        const pts = D.x.map((t, i) => [t, s.y[i] - blank]).filter(p => isFinite(p[0]) && isFinite(p[1]) && p[1] > 0); if (pts.length < 5) return;
        const th = pts.map(p => tu === 'min' ? p[0] / 60 : p[0]), y0 = pts[0][1], ly = pts.map(p => Math.log(p[1] / y0)); const Fi = fitGompertz(th, ly);
        res.push({name: s.name, ...Fi, td: Math.log(2) / Fi.mu * 60}); const col = SERCOL[k % SERCOL.length];
        ser.push({pts: pts.map((p, i) => [p[0], ly[i]]), color: col, name: s.name}); ser.push({fn: x => gompertz(tu === 'min' ? x / 60 : x, [Fi.A, Fi.mu, Fi.lam]), color: col, name: s.name + ' (fit)'});
        ymax = Math.max(ymax, ...ly); tmax = Math.max(tmax, ...pts.map(p => p[0]));
      });
      if (!res.length) return {err: 2};
      return {res, ser, ymax, tmax, tu, isOD};
    }
  },
  mounted() { this.draw(); },
  updated() { this.draw(); },
  methods: {
    F,
    draw() {
      const cv = document.getElementById('gm-cv'), m = this.m;
      if (!cv || m.err) return;
      chart(cv, {xmin: 0, xmax: m.tmax, ymin: Math.min(0, -0.2), ymax: m.ymax * 1.1, xlabel: `tijd (${m.tu === 'min' ? 'min' : 'uur'})`, ylabel: 'ln(N/N₀)', series: m.ser,
        legend: m.res.map((r, k) => [r.name, SERCOL[k % SERCOL.length]]), legendPos: 'br'});
    }
  }
};
</script>
