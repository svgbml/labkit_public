<!-- ================= OVERLEVINGSCURVE (KAPLAN-MEIER) =================
     De velden en de uitkomst zijn Vue; het rekenwerk blijft kmFit() en kmLogrank() in
     tools/nt/86_km.js. De curve wordt met chart() op het canvas getekend, na elke render,
     net als bij de Z'-factor. Het canvas zelf blijft buiten Vue, en tekst die erop komt loopt
     al door trCanvas().

     De id's km-d, km-u, km-cv en km-out blijven zoals ze waren. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <div class="f" style="grid-column:1/-1">
          <label for="km-d">{{ t('Groep, tijd, status per regel') }} <span class="example">{{ t('voorbeeld') }}</span></label>
          <textarea id="km-d" rows="12" v-model="data"></textarea>
        </div>
        <div class="f">
          <label for="km-u">{{ t('Tijdseenheid') }}</label>
          <input id="km-u" class="txt" v-model="unit">
        </div>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Status 1 = gebeurtenis (bijvoorbeeld overleden), 0 = gecensureerd (nog in leven bij het einde of uitgevallen). Zonder groepsnaam: alleen tijd en status. Voorbeelddata zijn verzonnen.') }}</p>
    </div>
    <div class="result">
      <canvas id="km-cv" v-show="ok"></canvas>
      <div id="km-out">
        <lk-note v-if="!ok" kind="info">{{ t('Vul per regel een groep (optioneel), een tijd en een status (1 of 0) in.') }}</lk-note>
        <template v-else>
          <lk-table :cols="cols1" :rows="rows1"/>
          <lk-kv v-if="lrRows" :rows="lrRows"/>
          <lk-table :cols="cols2" :rows="rows2"/>
          <lk-formula :html="tHtml('S(t) = Π (1 − d<sub>i</sub>/n<sub>i</sub>) · tekens: gecensureerd')"/>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';
/* getallen in de uitkomst in de notatie van de gebruiker; binnen t() blijft het fmt(), want t() zet
   het getal zelf om */
const F = (x, d) => lkNumIn(fmt(x, d));

export default {
  name: 'Km',
  data() {
    return {
      data: ['controle 3 1', 'controle 5 1', 'controle 6 1', 'controle 6 0', 'controle 8 1', 'controle 9 1',
        'controle 11 1', 'controle 12 0', 'controle 14 1', 'controle 15 0', 'behandeld 5 1', 'behandeld 8 0',
        'behandeld 10 1', 'behandeld 12 1', 'behandeld 14 0', 'behandeld 16 1', 'behandeld 18 0',
        'behandeld 20 1', 'behandeld 22 0', 'behandeld 25 0'].map(l => l.replace(/^\w+/, w => trPlain(w))).join('\n'),
      unit: 'dagen'
    };
  },
  computed: {
    R() {
      return this.data.split(/\n/).map(l => {
        const t = l.trim().split(/[\s;\t]+/).filter(Boolean); if (t.length < 2) return null;
        let g = 'alle', a = t;
        if (t.length >= 3 && !isFinite(num(t[0]))) { g = t[0]; a = t.slice(1); }
        else if (t.length >= 3) { g = t[0]; a = t.slice(1); }
        const tt = num(a[0]), e = num(a[1]);
        if (!(tt >= 0) || !(e === 0 || e === 1)) return null;
        return {g, t: tt, e: e === 1};
      }).filter(Boolean);
    },
    ok() { return this.R.length >= 2; },
    G() { return [...new Set(this.R.map(r => r.g))].slice(0, 8); },
    Fit() { const R = this.R; return this.G.map(g => ({g, R: R.filter(r => r.g === g), ...kmFit(R.filter(r => r.g === g))})); },
    cols1() {
      const t = this.t;
      return [{h: t('Groep')}, {h: 'n', num: true}, {h: t('Gebeurtenissen'), num: true},
        {h: t('Mediaan (' + this.uv(this.esc(this.unit)) + ')'), num: true}];
    },
    rows1() {
      const t = this.t;
      return this.Fit.map(f => [this.esc(f.g), f.R.length, f.R.filter(r => r.e).length,
        isFinite(f.med) ? F(f.med, 2) : t('niet bereikt')]);
    },
    lrRows() {
      if (this.G.length < 2) return null;
      const t = this.t, G = this.G, {O, E, m, chi, p} = kmLogrank(this.R, G);
      const head = !isFinite(chi) ? '–'
        : p < 0.001 ? this.tHtml(`χ² = ${fmt(chi, 2)}, df = ${m}, p &lt; 0,001`)
          : t(`χ² = ${fmt(chi, 2)}, df = ${m}, p = ${fmt(p, 3)}`);
      return [[t('Log-ranktoets'), head],
        ...G.map((g, i) => [t(this.uv(this.esc(g)) + ': waargenomen / verwacht'), `${O[i]} / ${F(E[i], 1)}`])];
    },
    cols2() {
      const t = this.t;
      return [{h: t('Groep')}, {h: t('Tijd'), num: true}, {h: t('At risk'), num: true},
        {h: t('Gebeurtenissen'), num: true}, {h: 'S(t)', num: true}, {h: t('95%-interval'), num: true}];
    },
    rows2() {
      return this.Fit.flatMap(f => f.steps.slice(0, 100).map(s => [this.esc(f.g), F(s.t, 2), s.n, s.d, F(s.S, 3),
        isFinite(s.lo) ? F(s.lo, 3) + ' – ' + F(s.hi, 3) : '–']));
    }
  },
  mounted() { this.draw(); },
  updated() { this.draw(); },
  methods: {
    /* de tekening wordt na elke render bijgewerkt; dat houdt canvas en uitkomst bij elkaar */
    draw() {
      const cv = document.getElementById('km-cv'); if (!cv || !this.ok) return;
      const un = this.unit, R = this.R, F_ = this.Fit;
      const tmax = Math.max(...R.map(r => r.t));
      const g = chart(cv, {xmin: 0, xmax: tmax * 1.05 || 1, ymin: 0, ymax: 1.05, xlabel: `tijd (${uv(un)})`, ylabel: 'overleving S(t)',
        legend: F_.map((f, i) => [f.g, SERCOL[i % SERCOL.length]]), legendPos: 'br', series: []});
      const c = cv.getContext('2d');
      F_.forEach((f, i) => {
        const col = SERCOL[i % SERCOL.length]; c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.moveTo(g.X(0), g.Y(1)); let S = 1;
        f.steps.forEach(s => { c.lineTo(g.X(s.t), g.Y(S)); c.lineTo(g.X(s.t), g.Y(s.S)); S = s.S; });
        c.lineTo(g.X(Math.max(...f.R.map(r => r.t))), g.Y(S)); c.stroke(); c.lineWidth = 1.5;
        f.R.filter(r => !r.e).forEach(r => {
          const st = f.steps.filter(s => s.t <= r.t), y = st.length ? st[st.length - 1].S : 1;
          c.beginPath(); c.moveTo(g.X(r.t), g.Y(y) - 5); c.lineTo(g.X(r.t), g.Y(y) + 5); c.stroke();
        });
      });
      cv._data = {head: ['groep', 'tijd', 'S(t)'], rows: F_.flatMap(f => f.steps.map(s => [f.g, s.t, s.S]))};
    }
  }
};
</script>
