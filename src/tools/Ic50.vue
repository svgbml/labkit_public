<!-- ================= DOSIS-RESPONS (IC50/EC50) =================
     Vierparameter-logistische fit (Levenberg-Marquardt op log₁₀ van de IC₅₀) met een 95%-interval
     uit de standaardfout en de t-verdeling. De berekening staat ongewijzigd in de computed m().
     De tabel is een <lk-etable> met dezelfde kolommen en beginrijen als de ET()-versie. De
     id's ic-norm, ic-cu, ic-tbl, ic-tbl-add, ic-cv en ic-out blijven zoals ze waren. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <div class="f"><label for="ic-norm">{{ t('Respons') }}</label>
          <select id="ic-norm" style="width:100%" v-model="norm">
            <option value="raw">{{ t('zoals ingevuld') }}</option>
            <option value="pct">{{ t('als % van de controle (concentratie 0)') }}</option>
          </select>
        </div>
        <div class="f"><label for="ic-cu">{{ t('Concentratie-eenheid') }}</label><input id="ic-cu" class="txt" v-model="cu"></div>
      </div>
      <div style="margin-top:12px"><lk-etable table-id="ic-tbl" :cols="cols" v-model:rows="rows" add-id="ic-tbl-add"/></div>
      <div class="row" style="margin-top:8px"><button type="button" id="ic-tbl-add" @click="add">{{ t('+ Concentratie') }}</button></div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0" v-html="tHtml('Tot drie replicaten per concentratie. Concentratie 0 telt als controle (100%) en wordt niet gefit op de log-as. Voorbeelddata (groeiremming, OD&lt;sub&gt;600&lt;/sub&gt;) zijn verzonnen.')"></p>
    </div>
    <div class="result">
      <canvas id="ic-cv" v-show="m.chart"></canvas>
      <div id="ic-out">
        <lk-note v-if="m.err" :kind="m.err[0]">{{ m.err[1] }}</lk-note>
        <template v-else>
          <lk-big :label="m.lbl" :value="m.ic" :sub="cu"/>
          <lk-kv :rows="m.kv"/>
          <lk-note v-if="m.extra" kind="warn">{{ m.extraText }}</lk-note>
          <lk-note v-if="m.flat" kind="warn">{{ t('Geen duidelijk sigmoïde verloop; voeg hogere of lagere concentraties toe.') }}</lk-note>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

/* getallen in de taal van de gebruiker: de DOM-vertaallaag komt niet in een Vue-boom */
const Fm = (x, d) => lkNumIn(fmt(x, d));
const S = (x, s) => lkNumIn(sig(x, s));
const N = v => lkNumIn(String(v).replace('.', ','));

export default {
  name: 'Ic50',
  data() {
    return {
      norm: 'raw', cu: 'µM',
      rows: [[0, 1.02, 0.98, 1.0], [0.1, 0.99, 1.01, 0.97], [0.3, 0.95, 0.93, 0.97], [1, 0.82, 0.86, 0.80], [3, 0.55, 0.51, 0.58], [10, 0.24, 0.21, 0.27], [30, 0.09, 0.11, 0.08], [100, 0.05, 0.04, 0.06]]
        .map(r => r.map(N))
    };
  },
  computed: {
    cols() {
      const t = this.t;
      return [{h: t('Concentratie'), t: 'num', w: 84}, {h: t('Respons ' + 1), t: 'num', w: 76}, {h: t('Respons ' + 2), t: 'num', w: 76}, {h: t('Respons ' + 3), t: 'num', w: 76}];
    },
    /* alle maten van de uitkomst: één keer berekend, de rest van de component leest hieruit */
    m() {
      const t = this.t, cu = this.cu, pct = this.norm === 'pct';
      const R = this.rows.map(r => r.slice()).map(r => ({x: num(r[0]), y: [r[1], r[2], r[3]].map(num).filter(isFinite)})).filter(r => isFinite(r.x) && r.y.length);
      const ctl = R.filter(r => r.x === 0).flatMap(r => r.y), c0 = ctl.length ? mean(ctl) : NaN;
      if (pct && !isFinite(c0)) return {err: ['warn', t('Voor % van de controle is een rij met concentratie 0 nodig.')]};
      const tr = y => pct ? y / c0 * 100 : y, P = R.filter(r => r.x > 0).flatMap(r => r.y.map(y => [r.x, tr(y)]));
      if (new Set(P.map(p => p[0])).size < 4) return {err: ['info', t('Vul minstens vier concentraties groter dan 0 in.')]};
      const xs = P.map(p => Math.log10(p[0])), ys = P.map(p => p[1]), ymin = Math.min(...ys), ymax = Math.max(...ys), f = (lx, q) => q[0] + (q[1] - q[0]) / (1 + Math.pow(10, (lx - q[2]) * q[3]));
      const inc = ys[xs.indexOf(Math.max(...xs))] > ys[xs.indexOf(Math.min(...xs))]; const p0 = [inc ? ymax : ymin, inc ? ymin : ymax, (Math.min(...xs) + Math.max(...xs)) / 2, 1]; p0[0] = Math.min(...ys); p0[1] = Math.max(...ys); if (inc) p0[3] = -1;
      const F = lmfit(f, p0, xs, ys, 400), [bot, top, lic, h] = F.p, n = xs.length, df = n - 4, tc = df > 0 ? tinv(0.975, df) : NaN, lo = lic - tc * F.se[2], hi = lic + tc * F.se[2];
      const sst = ys.reduce((s, y) => s + (y - mean(ys)) ** 2, 0), r2 = 1 - F.sse / sst, ic = 10 ** lic, lbl = inc ? 'EC₅₀' : 'IC₅₀';
      const m = {P, F, f, ymin, ymax, pct, chart: true, lbl: t(lbl), ic: S(ic, 3)};
      m.kv = [[t('95%-interval'), isFinite(lo) ? `${S(10 ** lo, 3)} – ${S(10 ** hi, 3)} ${ud(cu)}` : '–'], [t('Hill-helling'), Fm(inc ? -h : h, 2)], [t('Onderste plateau'), S(Math.min(bot, top), 3) + (pct ? ' %' : '')], [t('Bovenste plateau'), S(Math.max(bot, top), 3) + (pct ? ' %' : '')], ['R²', Fm(r2, 4)]];
      m.extra = ic < Math.min(...P.map(p => p[0])) || ic > Math.max(...P.map(p => p[0]));
      m.extraText = inc ? t('De EC₅₀ ligt buiten de geteste concentraties; de schatting is extrapolatie.') : t('De IC₅₀ ligt buiten de geteste concentraties; de schatting is extrapolatie.');
      m.flat = Math.abs(top - bot) < 0.2 * Math.abs(ymax - ymin || 1);
      return m;
    }
  },
  mounted() { this.draw(); },
  updated() { this.draw(); },
  methods: {
    /* de oude ET()-knop zette een lege rij onderaan; de breedte komt uit de kolommen, zodat
       het ook werkt als alle rijen weg zijn */
    add() { this.rows = [...this.rows, this.cols.map(() => '')]; },
    draw() {
      const cv = document.getElementById('ic-cv'), m = this.m; if (!cv || !m.chart) return;
      const P = m.P, F = m.F, f = m.f, xa = P.map(p => p[0]);
      chart(cv, {logx: true, xmin: Math.min(...xa) / 2, xmax: Math.max(...xa) * 2, ymin: Math.min(0, m.ymin), ymax: m.ymax * 1.08, xlabel: `concentratie (${this.cu})`, ylabel: m.pct ? 'respons (% van controle)' : 'respons', series: [{fn: x => f(Math.log10(x), F.p), name: '4PL'}, {pts: P, color: '--warn'}]});
    }
  }
};
</script>
