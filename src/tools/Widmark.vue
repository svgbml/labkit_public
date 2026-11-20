<!-- ================= BLOEDALCOHOL (WIDMARK) =================
     De tijdhulpjes wdT() en wdHM() blijven in tools/nt/70_widmark.js staan. Deze component
     beheert de velden, de drankentabel (een <lk-etable> in plaats van ET()), de curve en de
     uitkomst. Het rekenwerk is hetzelfde als in de oude calc.widmark(), regel voor regel.

     De id's wd-sex, wd-w, wd-h, wd-rm, wd-r, wd-b, wd-tbl, wd-tbl-add, wd-m, wd-mt, wd-it,
     wd-b1, wd-b2, wd-cv en wd-out blijven zoals ze waren. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <div class="f">
          <label for="wd-sex">{{ t('Geslacht') }}</label>
          <select id="wd-sex" v-model="sex">
            <option value="m">{{ t('man') }}</option>
            <option value="v">{{ t('vrouw') }}</option>
          </select>
        </div>
        <lk-field v-model="w" :label="t('Lichaamsgewicht')" for-id="wd-w" unit="kg"/>
        <lk-field v-model="h" :label="t('Lengte')" for-id="wd-h" unit="cm"/>
        <div class="f">
          <label for="wd-rm">{{ t('Verdelingsfactor r') }}</label>
          <select id="wd-rm" v-model="rm">
            <option value="w">{{ t('Widmark (man 0,68 / vrouw 0,55)') }}</option>
            <option value="s">{{ t('Seidl (uit lengte en gewicht)') }}</option>
            <option value="e">{{ t('eigen waarde') }}</option>
          </select>
        </div>
        <div class="f" v-show="rm === 'e'">
          <label for="wd-r">{{ t('Eigen r') }}</label>
          <input id="wd-r" inputmode="decimal" v-model="r">
        </div>
        <lk-field v-model="b" :label="t('Afbraak β')" for-id="wd-b" unit="g/L/h"/>
      </div>
      <div style="margin-top:12px">
        <lk-etable table-id="wd-tbl" :cols="cols" v-model:rows="rows" add-id="wd-tbl-add"/>
      </div>
      <div class="row" style="margin-top:8px">
        <button type="button" id="wd-tbl-add" @click="addRow">{{ t('+ Drankje') }}</button>
      </div>
      <h3 style="margin:16px 0 6px;font-size:14px">{{ t('Terugrekenen') }}</h3>
      <div class="fields">
        <lk-field v-model="cm" :label="t('Gemeten in bloed')" for-id="wd-m" unit="g/L"/>
        <div class="f">
          <label for="wd-mt">{{ t('Tijdstip bloedafname') }}</label>
          <input id="wd-mt" class="txt" v-model="mt">
        </div>
        <div class="f">
          <label for="wd-it">{{ t('Tijdstip incident') }}</label>
          <input id="wd-it" class="txt" v-model="it">
        </div>
        <div class="f">
          <label for="wd-b1">{{ t('β laag – hoog') }}</label>
          <div class="row" style="gap:6px">
            <input id="wd-b1" inputmode="decimal" v-model="b1" style="width:70px">
            <input id="wd-b2" inputmode="decimal" v-model="b2" style="width:70px">
          </div>
        </div>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Tijden als uu:mm; na middernacht telt de klok door. De berekening gaat uit van directe, volledige opname; in werkelijkheid duurt de opname 30–90 minuten en ligt de piek lager en later. Voorbeelddata zijn verzonnen.') }}</p>
    </div>
    <div class="result">
      <canvas id="wd-cv" v-show="valid && curve"></canvas>
      <div id="wd-out">
        <lk-note v-if="!valid" kind="info">{{ t('Vul gewicht, een geldige verdelingsfactor r en de afbraaksnelheid in.') }}</lk-note>
        <template v-else>
          <template v-if="curve">
            <lk-big :label="t('Geschatte piek')" :value="F(curve.peak, 2)" sub="g/L"/>
            <lk-kv :rows="curveRows"/>
          </template>
          <lk-note v-else kind="info">{{ t('Vul minstens één drankje met volume, alcoholpercentage en tijdstip in.') }}</lk-note>
          <template v-if="back">
            <lk-big :label="t('Teruggerekend naar ' + wdHM(back.it))" top="14px"
              :value="F(back.lo, 2) + ' – ' + F(back.hi, 2)" sub="g/L"/>
            <lk-kv :rows="backRows"/>
            <lk-note kind="warn">{{ t('Terugrekenen is alleen verdedigbaar als de opname op het incidenttijdstip voltooid was (meestal 1–2 uur na het laatste drankje).') }}</lk-note>
          </template>
          <lk-formula :html="t('c = A / (r · W) × 1,055 − β · t · A = V × % vol × 0,789 · stippellijnen: 0,5 en 0,2 g/L')"/>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => lkNumIn(fmt(x, d));

export default {
  name: 'Widmark',
  data() {
    const t = this.t, bier = t('Bier');
    return {
      sex: 'm', w: '80', h: '180', rm: 'w', r: lkNumIn('0,68'), b: lkNumIn('0,15'),
      rows: [[bier, '330', '5', '20:00'], [bier, '330', '5', '20:45'],
        [t('Wijn'), '150', '12', '21:30'], [bier, '330', '5', '22:15']],
      cm: lkNumIn('0,62'), mt: '01:30', it: '23:45', b1: lkNumIn('0,10'), b2: lkNumIn('0,25')
    };
  },
  computed: {
    cols() {
      const t = this.t;
      return [{h: t('Drank'), t: 'txt', w: 120}, {h: t('Volume (mL)'), t: 'num', w: 80},
        {h: t('Alcohol (% vol)'), t: 'num', w: 80}, {h: t('Tijdstip'), t: 'txt', w: 70}];
    },
    /* de verdelingsfactor: vast volgens Widmark, uit lengte en gewicht volgens Seidl, of eigen */
    rr() {
      const W = num(this.w), L = num(this.h);
      if (this.rm === 'e') return num(this.r);
      if (this.rm === 's') return this.sex === 'm' ? 0.31608 - 0.004821 * W + 0.004632 * L
        : 0.31223 - 0.006446 * W + 0.004466 * L;
      return this.sex === 'm' ? 0.68 : 0.55;
    },
    valid() {
      const W = num(this.w), r = this.rr, beta = num(this.b);
      return W > 0 && r > 0 && r < 1.2 && beta >= 0;
    },
    /* de drankjes met hun tijd in minuten; na middernacht telt de klok door */
    drinks() {
      let prev = -Infinity, day = 0;
      return this.rows.map(x => ({n: x[0], v: num(x[1]), p: num(x[2]), t: wdT(x[3])}))
        .filter(d => d.v > 0 && d.p >= 0 && d.p <= 100 && isFinite(d.t))
        .map(d => {
          let t = d.t + day;
          if (t < prev) { day += 1440; t += 1440; }
          prev = t;
          return {...d, t, g: d.v * d.p / 100 * 0.789};
        });
    },
    /* de curve per minuut: elk drankje komt er in één keer bij, daarna gaat er β/60 per minuut af */
    curve() {
      const D = this.drinks;
      if (!this.valid || !D.length) return null;
      const W = num(this.w), r = this.rr, beta = num(this.b);
      const t0 = D[0].t, A = D.reduce((s, d) => s + d.g, 0);
      let c = 0, peak = 0, tp = t0, k = 0, tend = t0;
      const pts = [];
      for (let t = t0; t <= t0 + 3 * 1440; t++) {
        while (k < D.length && D[k].t <= t) { c += D[k].g / (r * W) * 1.055; k++; }
        if (c > peak) { peak = c; tp = t; }
        pts.push([(t - t0) / 60, c]);
        if (k >= D.length && c <= 0) { tend = t; break; }
        c = Math.max(0, c - beta / 60);
        tend = t;
      }
      let l5 = -1;
      pts.forEach((p, i) => { if (p[1] > 0.5) l5 = i; });
      return {t0, A, peak, tp, tend, pts, l5, beta, r};
    },
    curveRows() {
      const t = this.t, c = this.curve;
      return [[t('Tijdstip piek'), wdHM(c.tp)],
        [t('Alcohol totaal'), t(`${fmt(c.A, 1)} g (${fmt(c.A / 10, 1)} standaardglazen)`)],
        [t('Verdelingsfactor r'), F(c.r, 3)],
        [t('Weer 0 g/L om'), c.beta > 0 ? wdHM(c.tend) : '–'],
        [t('Onder 0,5 g/L vanaf'), c.l5 < 0 ? t('blijft eronder')
          : c.l5 < c.pts.length - 1 ? wdHM(c.t0 + (c.l5 + 1)) : '–']];
    },
    /* terugrekenen van de gemeten waarde naar het incident, met een bandbreedte voor β */
    back() {
      if (!this.valid) return null;
      const cm = num(this.cm), mt = wdT(this.mt), it = wdT(this.it),
        b1 = num(this.b1), b2 = num(this.b2), beta = num(this.b);
      if (!(cm >= 0 && isFinite(mt) && isFinite(it) && b1 >= 0 && b2 >= b1)) return null;
      let dt = (mt - it) / 60;
      if (dt < 0) dt += 24;
      return {it, dt, beta, lo: cm + b1 * dt, hi: cm + b2 * dt, mid: cm + beta * dt};
    },
    backRows() {
      const t = this.t, k = this.back;
      return [[t('Tijdsverschil'), `${F(k.dt, 2)} h`],
        [t(`Met β = ${fmt(k.beta, 2)} g/L/h`), F(k.mid, 2) + ' g/L'],
        [t('Boven 0,5 g/L?'), k.lo > 0.5 ? t('ja, ook met de laagste afbraak')
          : k.hi > 0.5 ? t('mogelijk, afhankelijk van de afbraak') : t('nee')]];
    }
  },
  mounted() { this.draw(); },
  updated() { this.draw(); },
  methods: {
    F, wdHM: m => wdHM(m),
    addRow() { this.rows = [...this.rows, ['', '', '', '']]; },
    /* de curve met de grenzen van 0,5 en 0,2 g/L; chart() tekent zoals voorheen */
    draw() {
      const cv = document.getElementById('wd-cv'), c = this.curve;
      if (!cv || !c) return;
      const pts = c.pts, xmax = Math.max(1, (c.tend - c.t0) / 60);
      chart(cv, {xmin: 0, xmax, ymin: 0, ymax: Math.max(0.6, c.peak * 1.15),
        xlabel: `uren na ${wdHM(c.t0)}`, ylabel: 'alcohol in bloed (g/L)',
        series: [{fn: x => {
          let i = 0;
          while (i < pts.length - 1 && pts[i + 1][0] <= x) i++;
          return pts[i] ? pts[i][1] : NaN;
        }, name: 'Widmark'},
        {fn: () => 0.5, color: '--bad', dash: [5, 4]},
        {fn: () => 0.2, color: '--warn', dash: [2, 4]}]});
    }
  }
};
</script>
