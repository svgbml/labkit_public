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
      <div v-if="cmp" id="gm-cmp" style="margin-top:12px">
        <h3>{{ t('Condities vergelijken') }}</h3>
        <p style="font-size:13px;color:var(--muted);margin:0 0 8px">{{ t('Curven met dezelfde naam, op een volgnummer aan het eind na, tellen als replicaten van één conditie.') }}</p>
        <div class="tbl-wrap"><table class="mini" id="gm-cmp-tbl">
          <thead><tr><th>{{ t('Conditie') }}</th><th class="num">n</th><th class="num" v-html="tHtml('µ&lt;sub&gt;m&lt;/sub&gt; (h⁻¹), gem. ± SD')"></th>
            <th class="num">{{ t('Lag λ, gem. ± SD') }}</th></tr></thead>
          <tbody><tr v-for="g in cmp.groups" :key="g.name"><td>{{ g.name }}</td><td class="num">{{ g.n }}</td>
            <td class="num">{{ pm(g.mu) }}</td><td class="num">{{ pm(g.lam) }}</td></tr></tbody>
        </table></div>
        <canvas id="gm-bmu"></canvas>
        <canvas id="gm-blag"></canvas>
        <div class="tbl-wrap" v-if="cmp.tests.length"><table class="mini" id="gm-welch">
          <thead><tr><th>{{ t('Tegen de eerste conditie') }}</th><th class="num" v-html="tHtml('µ&lt;sub&gt;m&lt;/sub&gt;: t')"></th><th class="num">df</th><th class="num">p</th>
            <th class="num">{{ t('Lag: t') }}</th><th class="num">df</th><th class="num">p</th></tr></thead>
          <tbody><tr v-for="x in cmp.tests" :key="x.name"><td>{{ x.name }}</td>
            <td class="num">{{ F(x.mu.t, 2) }}</td><td class="num">{{ F(x.mu.df, 1) }}</td><td class="num">{{ F(x.mu.p, 4) }} {{ x.mu.s }}</td>
            <td class="num">{{ F(x.lam.t, 2) }}</td><td class="num">{{ F(x.lam.df, 1) }}</td><td class="num">{{ F(x.lam.p, 4) }} {{ x.lam.s }}</td></tr></tbody>
        </table></div>
        <lk-note kind="info">{{ t('Welch-t-toets (ongelijke varianties), tweezijdig; sterren bij p onder de vijf procent. Alleen met minstens twee replicaten per conditie.') }}</lk-note>
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
    /* de kop van de voorbeelddata in de taal van de gebruiker (S270): de namen worden de reeksnamen */
    return {tu: 'h', type: 'od', blank: '0', txt: lkNumIn(DATA.replace(/^tijd\tWildtype/, trPlain('tijd') + '\t' + trPlain('Wildtype')))};
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
    },
    /* µmax en lag per replicaat (zelfde fit als hierboven), per conditie gemiddeld; Welch-toets tegen de eerste */
    cmp() {
      const m = this.m; if (m.err) return null;
      const G = [];
      m.res.forEach(r => {
        const k = r.name.replace(/[\s_-]*\d+$/, '').trim() || r.name;
        let g = G.find(x => x.name === k); if (!g) G.push(g = {name: k, mu: [], lam: []});
        g.mu.push(r.mu); g.lam.push(m.tu === 'min' ? r.lam * 60 : r.lam);
      });
      if (!G.some(g => g.mu.length > 1)) return null;
      G.forEach(g => { g.n = g.mu.length; });
      const welch = (a, b) => {
        const va = sd(a) ** 2 / a.length, vb = sd(b) ** 2 / b.length, t = (mean(a) - mean(b)) / Math.sqrt(va + vb);
        const df = (va + vb) ** 2 / (va ** 2 / (a.length - 1) + vb ** 2 / (b.length - 1)), p = 2 * (1 - tcdf(Math.abs(t), df));
        return {t, df, p, s: stStars(p, 0.05)};
      };
      const tests = G.slice(1).filter(g => g.n > 1 && G[0].n > 1).map(g => ({name: g.name, mu: welch(g.mu, G[0].mu), lam: welch(g.lam, G[0].lam)}));
      return {groups: G, tests, tu: m.tu};
    }
  },
  mounted() { this.draw(); },
  updated() { this.draw(); },
  methods: {
    F,
    pm(a) { return a.length > 1 ? F(mean(a), 3) + ' ± ' + F(sd(a), 3) : F(a[0], 3); },
    draw() {
      const c = this.cmp;
      if (c) {
        const bar = (id, key, yl) => {
          const cv = document.getElementById(id); if (!cv) return;
          const mm = c.groups.map(g => mean(g[key])), ss = c.groups.map(g => g.n > 1 ? sd(g[key]) : NaN);
          const st = c.groups.map((g, i) => { const x = c.tests.find(q => q.name === g.name); return x ? x[key === 'mu' ? 'mu' : 'lam'].s : ''; });
          barChart(cv, c.groups.map(g => g.name), mm, mm.map((v, i) => v - ss[i]), mm.map((v, i) => v + ss[i]), {ylabel: yl, ref: false, stars: st});
        };
        bar('gm-bmu', 'mu', 'µmax (h⁻¹)');
        bar('gm-blag', 'lam', c.tu === 'min' ? 'lag λ (min)' : 'lag λ (uur)');
      }
      const cv = document.getElementById('gm-cv'), m = this.m;
      if (!cv || m.err) return;
      chart(cv, {xmin: 0, xmax: m.tmax, ymin: Math.min(0, -0.2), ymax: m.ymax * 1.1, xlabel: `tijd (${m.tu === 'min' ? 'min' : 'uur'})`, ylabel: 'ln(N/N₀)', series: m.ser,
        legend: m.res.map((r, k) => [r.name, SERCOL[k % SERCOL.length]]), legendPos: 'br'});
    }
  }
};
</script>
