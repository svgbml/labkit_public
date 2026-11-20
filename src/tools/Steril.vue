<!-- ================= STERILISATIE (D, z, F₀) =================
     Het rekenwerk is dat van calc.steril, ongewijzigd, maar nu in computeds. De tekening blijft
     met chart() gemaakt; na elke render wordt hij opnieuw getekend (draw()), net als bij
     Buffercapaciteit.

     De id's ste-t, ste-n, ste-zt, ste-zd, ste-dt, ste-z, ste-log, ste-cv en ste-out blijven
     zoals ze waren. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <div class="f" style="grid-column:1/-1"><label for="ste-t">{{ t('Overlevingscurve: tijd (min)') }}</label><input id="ste-t" class="txt" v-model="tt"></div>
        <div class="f" style="grid-column:1/-1"><label for="ste-n">{{ t('Levende kiemen (KVE/mL)') }}</label><input id="ste-n" class="txt" v-model="nn"></div>
        <div class="f" style="grid-column:1/-1"><label for="ste-zt">{{ t('z-waarde: temperaturen (°C)') }}</label><input id="ste-zt" class="txt" v-model="zt"></div>
        <div class="f" style="grid-column:1/-1"><label for="ste-zd">{{ t('D-waarden (min)') }}</label><input id="ste-zd" class="txt" v-model="zd"></div>
        <lk-field v-model="dt" :label="t('Logging-interval')" for-id="ste-dt" unit="min"/>
        <lk-field v-model="z" :label="t('z voor F₀')" for-id="ste-z" unit="°C"/>
        <div class="f" style="grid-column:1/-1">
          <label for="ste-log">{{ t('Temperatuurlog autoclaaf (°C)') }}</label>
          <textarea id="ste-log" rows="3" v-model="log"></textarea>
        </div>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Getallen scheiden met spaties; wetenschappelijke notatie mag (1e6). Voorbeelddata zijn verzonnen.') }}</p>
    </div>
    <div class="result">
      <canvas id="ste-cv" v-show="m.curve"></canvas>
      <div id="ste-out">
        <lk-note v-if="!m.rows.length" kind="info">{{ t('Vul een overlevingscurve, D-waarden of een temperatuurlog in.') }}</lk-note>
        <template v-else>
          <lk-kv :rows="rows"/>
          <lk-formula :html="tHtml('D = −1/helling(log N, t) · z = −1/helling(log D, T) · F₀ = Δt·Σ10<sup>(T−121,1)/z</sup>')"/>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => lkNumIn(fmt(x, d)), G = (x, d) => lkNumIn(sig(x, d));

export default {
  name: 'Steril',
  data() {
    return {tt: '0 2 4 6 8 10', nn: '1e6 2,1e5 4,3e4 9,8e3 1,9e3 4,1e2', zt: '110 115 121', zd: '19 6,1 1,5',
      dt: '1', z: '10',
      log: '100 108 115 119 121 121,5 121,8 122 122 122 121,9 122 122,1 122 121,8 122 122 121,7 118 110 102'};
  },
  computed: {
    /* het rekenwerk van calc.steril, ongewijzigd; de rijen zijn nog niet vertaald */
    m() {
      const T = numsC(this.tt), N = numsC(this.nn), ZT = numsC(this.zt), ZD = numsC(this.zd),
        dt = num(this.dt), z = num(this.z) || 10, LG = numsC(this.log);
      const rows = []; let curve = null;
      if (T.length >= 2 && T.length === N.length && N.every(v => v > 0)) {
        const L = linreg(T, N.map(v => Math.log10(v))); const D = -1 / L.b; curve = {L, D};
        rows.push(['D-waarde', isFinite(D) && D > 0 ? G(D, 3) + ' min' : '– (geen afname)'],
          ['R² overlevingscurve', F(L.r2, 4)], ['Log-reductie over de reeks', F(Math.log10(N[0] / N[N.length - 1]), 2)]);
      }
      if (ZT.length >= 2 && ZT.length === ZD.length && ZD.every(v => v > 0)) {
        const L = linreg(ZT, ZD.map(v => Math.log10(v))); rows.push(['z-waarde', G(-1 / L.b, 3) + ' °C']);
      }
      if (LG.length && dt > 0) {
        const Fz = dt * LG.reduce((s, t) => s + Math.pow(10, (t - 121.1) / z), 0), hold = LG.filter(t => t >= 121).length * dt;
        rows.push(['F₀', F(Fz, 1) + ' min'], ['Tijd ≥ 121 °C', F(hold, 1) + ' min'], ['Hoogste temperatuur', F(Math.max(...LG), 1) + ' °C']);
        if (curve && curve.D > 0) rows.push(['Log-reductie bij deze F₀', {s: fmt(Fz / curve.D, 1) + ' (met de D-waarde hierboven, als die bij 121 °C hoort)'}]);
      }
      return {T, N, curve, rows};
    },
    rows() {
      return this.m.rows.map(([k, v]) => [this.t(k), typeof v === 'object' ? this.t(v.s) : (v === '– (geen afname)' ? this.t(v) : v)]);
    }
  },
  mounted() { this.draw(); },
  updated() { this.draw(); },
  methods: {
    draw() {
      const cv = document.getElementById('ste-cv'), {T, N, curve} = this.m;
      if (!cv || !curve) return;
      chart(cv, {logy: true, xmin: Math.min(...T), xmax: Math.max(...T), ymin: Math.min(...N) / 3, ymax: Math.max(...N) * 3,
        xlabel: 'tijd (min)', ylabel: 'levende kiemen',
        series: [{fn: t => Math.pow(10, curve.L.a + curve.L.b * t), name: 'regressie'},
          {pts: T.map((t, i) => [t, N[i]]), color: '--warn'}]});
    }
  }
};
</script>
