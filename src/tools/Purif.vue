<!-- ================= EIWITZUIVERINGSTABEL =================
     De berekening staat ongewijzigd in de computed m(): per stap totaal eiwit, totale en
     specifieke activiteit, opbrengst en zuiveringsfactor, plus de gram ammoniumsulfaat per liter.
     De tabel is een <lk-etable> met dezelfde kolommen en beginrijen als de ET()-versie. De
     id's pf-tbl, pf-tbl-add, pf-s1, pf-s2, pf-t, pf-v, pf-cv en pf-out blijven zoals ze waren;
     de eerste .big in #pf-out is de zuiveringsfactor, de tweede de gram per liter. -->
<template>
  <div class="stack">
    <div class="panel">
      <lk-etable table-id="pf-tbl" :cols="cols" v-model:rows="rows" add-id="pf-tbl-add"/>
      <div class="row" style="margin-top:8px"><button type="button" id="pf-tbl-add" @click="add">{{ t('+ Stap') }}</button></div>
      <h3 style="margin:16px 0 6px;font-size:14px">{{ t('Ammoniumsulfaat-precipitatie') }}</h3>
      <div class="fields">
        <div class="f"><label for="pf-s1">{{ t('Startverzadiging S₁') }}</label><div class="inu"><input id="pf-s1" inputmode="decimal" v-model="s1"><span class="u">%</span></div></div>
        <div class="f"><label for="pf-s2">{{ t('Eindverzadiging S₂') }}</label><div class="inu"><input id="pf-s2" inputmode="decimal" v-model="s2"><span class="u">%</span></div></div>
        <div class="f"><label for="pf-t">{{ t('Temperatuur') }}</label>
          <select id="pf-t" v-model="temp">
            <option value="0">{{ t('0 °C (op ijs)') }}</option>
            <option value="20">20 °C</option>
            <option value="25">25 °C</option>
          </select>
        </div>
        <div class="f"><label for="pf-v">{{ t('Volume oplossing') }}</label><div class="inu"><input id="pf-v" inputmode="decimal" v-model="vol"><span class="u">mL</span></div></div>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Per stap het volume van de fractie, de eiwitconcentratie (bijvoorbeeld uit de Standaardcurve) en de enzymactiviteit (uit Enzymkinetiek). Voeg ammoniumsulfaat langzaam en fijngemalen toe onder roeren op ijs. Voorbeelddata zijn verzonnen.') }}</p>
    </div>
    <div class="result">
      <canvas id="pf-cv" v-show="m.chart"></canvas>
      <div id="pf-out">
        <template v-if="m.R.length">
          <lk-big :label="m.bigLabel" :html="m.bigHtml"/>
          <lk-table :cols="m.cols" :rows="m.tRows"/>
          <lk-note v-if="m.hiYield" kind="warn">{{ t('Een opbrengst boven 100% wijst op een remmer in een eerdere fractie of op een meetfout in de activiteitsbepaling.') }}</lk-note>
          <lk-note v-if="m.saDrop" kind="warn">{{ t('De specifieke activiteit daalt in een stap: het enzym verliest activiteit of de stap verwijdert vooral het doeleiwit.') }}</lk-note>
        </template>
        <lk-note v-else kind="info">{{ t('Vul per stap volume, eiwitconcentratie en activiteit in.') }}</lk-note>
        <template v-if="m.as">
          <lk-big :label="m.as.label" top="14px" :html="m.as.bigHtml"/>
          <lk-kv :rows="m.as.kv"/>
        </template>
        <lk-note v-else-if="m.asErr" kind="info" :html="m.asErr"/>
        <lk-formula :html="tHtml('g/L = G&lt;sub&gt;sat&lt;/sub&gt;·(S₂ − S₁) / (1 − P·S₂) · zuiveringsfactor = SA&lt;sub&gt;stap&lt;/sub&gt; / SA&lt;sub&gt;stap 1&lt;/sub&gt;')"/>
      </div>
    </div>
    <div class="panel" v-show="m.chart">
      <div><canvas id="pf-cy"></canvas></div><div style="margin-top:12px"><canvas id="pf-cf"></canvas></div>
      <div class="lbl" style="margin-top:12px">{{ t('SDS-PAGE-schets per stap') }}</div>
      <svg v-if="m.chart" :viewBox="'0 0 ' + sds.w + ' 170'" style="width:100%;max-width:520px;display:block" role="img" :aria-label="t('SDS-PAGE-schets per stap')">
        <g v-for="(l, i) in sds.lanes" :key="i">
          <rect :x="l.x" y="6" width="44" height="132" rx="3" fill="var(--line)"/>
          <rect v-for="(b, j) in l.bands" :key="j" :x="l.x + 3" :y="6 + b.y * 132" width="38" :height="b.h" fill="var(--ink)" :opacity="b.o"/>
          <text :x="l.x + 22" y="152" text-anchor="middle" font-size="9" fill="var(--muted)">{{ l.n }}<title>{{ l.full }}</title></text>
        </g>
      </svg>
      <p style="font-size:12.5px;color:var(--muted);margin:6px 0 0">{{ t('Schets, geen meetdata: het aantal en de sterkte van de banden volgen alleen de zuiveringsfactor; de dikke band is het doeleiwit.') }}</p>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

/* getallen in de taal van de gebruiker: de DOM-vertaallaag komt niet in een Vue-boom */
const F = (x, d) => lkNumIn(fmt(x, d)), G = (x, d) => lkNumIn(sig(x, d));
const N = v => lkNumIn(String(v));
/* posities (0-1 van boven naar onder) van de verontreinigingen in een lane, in de volgorde waarin ze verdwijnen; het doeleiwit zit op 0,55 */
const CONT = [0.88, 0.12, 0.3, 0.77, 0.2, 0.4, 0.68], TARGET = 0.55;
const ASAT = {'0': [515.35, 0.2722], '20': [536.49, 0.290], '25': [541.80, 0.2945]};

export default {
  name: 'Purif',
  data() {
    const t = this.t;
    return {
      s1: N(0), s2: N(40), temp: '0', vol: N(50),
      rows: [['Ruw cellysaat', 200, 12.5, 40], ['(NH₄)₂SO₄-precipitatie', 50, 18, 140], ['Ionenwisseling', 25, 3.2, 230], ['Gelfiltratie (SEC)', 10, 0.9, 480]]
        .map(r => r.map((v, i) => i ? N(v) : t(v)))
    };
  },
  computed: {
    cols() {
      const t = this.t;
      return [{h: t('Stap'), t: 'txt', w: 200}, {h: t('Volume (mL)'), t: 'num', w: 80}, {h: t('Eiwit (mg/mL)'), t: 'num', w: 80}, {h: t('Activiteit (U/mL)'), t: 'num', w: 90}];
    },
    /* alle maten van de uitkomst: één keer berekend, de rest van de component leest hieruit */
    /* schets: hoe hoger de zuiveringsfactor, hoe minder en hoe zwakker de verontreinigingen en hoe sterker het doeleiwit */
    sds() {
      const R = this.m.R, fm = Math.max(1, ...R.map(r => r.f).filter(isFinite));
      return {w: R.length * 52 + 8, lanes: R.map((r, i) => {
        const q = fm > 1 && isFinite(r.f) ? Math.log(Math.max(r.f, 1)) / Math.log(fm) : 0, nc = Math.round(7 - 5 * q);
        return {x: 8 + i * 52, n: r.n.length > 8 ? r.n.slice(0, 7) + '…' : r.n, full: r.n,
          bands: [...CONT.slice(0, nc).map(y => ({y, h: 3, o: 0.55 - 0.3 * q})), {y: TARGET, h: 5, o: 0.4 + 0.55 * q}]};
      })};
    },
    m() {
      const t = this.t, tHtml = this.tHtml;
      const R = this.rows.map(r => r.slice()).map(r => ({n: r[0] || '?', v: num(r[1]), c: num(r[2]), a: num(r[3])})).filter(r => r.v > 0 && r.c > 0 && r.a >= 0).map(r => ({...r, mg: r.v * r.c, U: r.v * r.a, sa: r.a / r.c}));
      const m = {R, chart: false, as: null, asErr: ''};
      if (R.length) {
        const b = R[0]; R.forEach(r => { r.y = b.U > 0 ? r.U / b.U * 100 : NaN; r.f = b.sa > 0 ? r.sa / b.sa : NaN; }); const l = R[R.length - 1];
        m.bigLabel = t('Na ' + uv(l.n));
        m.bigHtml = tHtml(`${isFinite(l.f) ? G(l.f, 3) : '–'}× <small>gezuiverd · opbrengst ${F(l.y, 1)}%</small>`);
        m.cols = [{h: t('Stap')}, {h: t('Totaal eiwit (mg)'), num: true}, {h: t('Totale activiteit (U)'), num: true}, {h: t('Specifieke activiteit (U/mg)'), num: true}, {h: t('Opbrengst (%)'), num: true}, {h: t('Zuiveringsfactor'), num: true}];
        m.tRows = R.map(r => [ud(r.n), G(r.mg, 4), G(r.U, 4), G(r.sa, 3), F(r.y, 1), isFinite(r.f) ? G(r.f, 3) : '–']);
        m.hiYield = R.some(r => r.y > 105);
        m.saDrop = R.some((r, i) => i && r.sa < R[i - 1].sa);
        m.chart = R.length > 1;
      }
      const s1 = num(this.s1) / 100, s2 = num(this.s2) / 100, [Gs, P] = ASAT[this.temp], V = num(this.vol);
      if (s1 >= 0 && s2 > s1 && s2 <= 1) {
        const g = Gs * (s2 - s1) / (1 - P * s2);
        m.as = {label: t('Ammoniumsulfaat van ' + F(s1 * 100, 0) + '% naar ' + F(s2 * 100, 0) + '%'),
          bigHtml: tHtml(`${F(g, 1)} <small>g per liter</small>`),
          kv: [[t(`Voor ${V > 0 ? F(V, 1) : '–'} mL`), V > 0 ? lkNumIn(mass(g * V / 1000)) : '–'],
            [t('Eindvolume (schatting)'), V > 0 ? F(V * (1 + g / 1000 * P * 1000 / Gs), 1) + ' mL' : '–']]};
      } else if (isFinite(s1) && isFinite(s2)) m.asErr = tHtml('Voor ammoniumsulfaat: 0 ≤ S₁ &lt; S₂ ≤ 100%.');
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
      const cv = document.getElementById('pf-cv'), m = this.m; if (!cv || !m.chart) return;
      const cats = m.R.map((r, i) => 'Stap ' + (i + 1)), nan = m.R.map(() => NaN);
      barChart(document.getElementById('pf-cy'), cats, m.R.map(r => r.y), nan, nan, {ylabel: 'Opbrengst (%)', ref: false});
      barChart(document.getElementById('pf-cf'), cats, m.R.map(r => r.f), nan, nan, {ylabel: 'Zuiveringsfactor'});
      const R = m.R, interp = k => x => { const i = Math.max(0, Math.min(R.length - 2, Math.floor(x) - 1)); return R[i][k] + (R[i + 1][k] - R[i][k]) * (x - (i + 1)); };
      chart(cv, {xmin: 0.5, xmax: R.length + 0.5, ymin: 0, ymax: Math.max(100, ...R.map(r => r.y), ...R.map(r => r.f)) * 1.1, xlabel: 'stap', ylabel: 'opbrengst (%) · zuiveringsfactor',
        series: [{pts: R.map((r, i) => [i + 1, r.y]), name: 'opbrengst (%)'}, {fn: interp('y'), x0: 1, x1: R.length},
          {pts: R.map((r, i) => [i + 1, r.f]), color: '--warn', name: 'zuiveringsfactor'}, {fn: interp('f'), x0: 1, x1: R.length, color: '--warn'}],
        legend: [['opbrengst (%)', '--accent'], ['zuiveringsfactor', '--warn']]});
    }
  }
};
</script>
