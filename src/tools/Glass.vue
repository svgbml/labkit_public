<!-- ================= GLASVERGELIJKING (BREKINGSINDEX) =================
     De opmaakhulp glF() blijft in tools/nt/73_glass.js staan. Deze component beheert de
     velden, de grafiek en de uitkomst. Het rekenwerk is hetzelfde als in de oude
     calc.glass(), regel voor regel.

     De id's gl-k, gl-r, gl-crit, gl-smin, gl-a, gl-cv en gl-out blijven zoals ze waren. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <div class="f" style="grid-column:1/-1">
          <label for="gl-k" v-html="tHtml('Bekend glas (referentie), n&lt;sub&gt;D&lt;/sub&gt; &lt;span class=&quot;example&quot;&gt;voorbeeld&lt;/span&gt;')"></label>
          <textarea id="gl-k" rows="3" v-model="k"></textarea>
        </div>
        <div class="f" style="grid-column:1/-1">
          <label for="gl-r" v-html="tHtml('Gevonden fragmenten, n&lt;sub&gt;D&lt;/sub&gt;')"></label>
          <textarea id="gl-r" rows="2" v-model="r"></textarea>
        </div>
        <div class="f">
          <label for="gl-crit">{{ t('Vergelijkingsinterval') }}</label>
          <select id="gl-crit" v-model="crit">
            <option value="4">{{ t('gemiddelde ± 4 s') }}</option>
            <option value="3">{{ t('gemiddelde ± 3 s') }}</option>
            <option value="2">{{ t('gemiddelde ± 2 s') }}</option>
            <option value="r">{{ t('bereik van het bekende glas') }}</option>
          </select>
        </div>
        <lk-field v-model="smin" :label="t('Minimale s (meetprecisie)')" for-id="gl-smin"/>
        <div class="f">
          <label for="gl-a">{{ t('Significantieniveau α') }}</label>
          <select id="gl-a" v-model="a">
            <option value="0.01">{{ lkNumIn('0,01') }}</option>
            <option value="0.05">{{ lkNumIn('0,05') }}</option>
          </select>
        </div>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Gebruik genoeg referentiefragmenten (bij voorkeur 10 of meer) om de spreiding binnen de bron te dekken. Als de s van het bekende glas kleiner is dan de meetprecisie, wordt de minimale s gebruikt. Voorbeelddata zijn verzonnen.') }}</p>
    </div>
    <div class="result">
      <canvas id="gl-cv" v-show="m"></canvas>
      <div id="gl-out">
        <lk-note v-if="!m" kind="info">{{ t('Vul minstens twee metingen van het bekende glas en één gevonden fragment in.') }}</lk-note>
        <template v-else>
          <lk-big :label="t('Binnen het interval')"
            :html="tHtml(`${m.nin} &lt;small&gt;van ${m.R.length} fragmenten&lt;/small&gt;`)"/>
          <lk-kv :rows="rows"/>
          <lk-note v-if="m.sk < m.smin" kind="info">{{ t('De s van het bekende glas is kleiner dan de meetprecisie; de minimale s is gebruikt.') }}</lk-note>
          <lk-kv v-if="welchRows" :rows="welchRows"/>
          <lk-table :cols="cols" :rows="tableRows"/>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => lkNumIn(fmt(x, d)), G = (x, d) => lkNumIn(glF(x, d));

export default {
  name: 'Glass',
  data() {
    return {
      k: lkNumIn('1,51824 1,51828 1,51821 1,51830 1,51826 1,51823 1,51827 1,51825 1,51829 1,51822'),
      r: lkNumIn('1,51826 1,51829 1,51823 1,51852'),
      crit: '4', smin: lkNumIn('0,00004'), a: '0.01'
    };
  },
  computed: {
    /* alle maten van de vergelijking; null als er te weinig metingen zijn */
    m() {
      const K = numsC(this.k), R = numsC(this.r), crit = this.crit,
        smin = num(this.smin) || 0, a = num(this.a) || 0.01;
      if (K.length < 2 || !R.length) return null;
      const mk = mean(K), sk = sd(K), s = Math.max(sk, smin), mr = mean(R), sr = R.length > 1 ? sd(R) : NaN;
      const lo = crit === 'r' ? Math.min(...K) : mk - (+crit) * s,
        hi = crit === 'r' ? Math.max(...K) : mk + (+crit) * s,
        inn = R.map(v => v >= lo - 1e-12 && v <= hi + 1e-12);
      let w = null;
      if (R.length > 1) {
        const v1 = Math.max(sk, smin) ** 2 / K.length, v2 = Math.max(sr, smin) ** 2 / R.length,
          t = (mr - mk) / Math.sqrt(v1 + v2),
          df = (v1 + v2) ** 2 / (v1 * v1 / (K.length - 1) + v2 * v2 / (R.length - 1)),
          p = 2 * (1 - tcdf(Math.abs(t), df));
        w = {t, df, p};
      }
      const nin = inn.filter(Boolean).length;
      return {K, R, a, smin, mk, sk, s, mr, sr, lo, hi, inn, w, nin};
    },
    rows() {
      const t = this.t, m = this.m;
      return [[t('Bekend: gemiddelde ± s'), lkNumIn(`${glF(m.mk)} ± ${glF(m.sk)} (n = ${m.K.length})`)],
        [t('Vergelijkingsinterval'), `${G(m.lo)} – ${G(m.hi)}`],
        [t('Gevonden: gemiddelde'), m.R.length > 1
          ? lkNumIn(`${glF(m.mr)} ± ${glF(m.sr)} (n = ${m.R.length})`) : G(m.mr)]];
    },
    /* de t-toets van Welch voor de groep, alleen bij meer dan één gevonden fragment */
    welchRows() {
      const w = this.m.w;
      if (!w) return null;
      const t = this.t, chip = (kind, txt) =>
        `<span class="chip ${kind}" style="vertical-align:middle">${txt}</span>`;
      return [[t('t (Welch)'), F(w.t, 3)], [t('Vrijheidsgraden'), F(w.df, 1)],
        [t('p'), w.p < 0.001 ? '&lt; ' + lkNumIn('0,001') : F(w.p, 3)],
        [t('Groep'), w.p < this.m.a ? chip('bad', t('verschillend')) : chip('ok', t('niet te onderscheiden'))]];
    },
    cols() {
      return [{h: this.t('Fragment')}, {h: this.tHtml('n<sub>D</sub>'), num: true},
        {h: this.t('Afstand (s)'), num: true}, {h: this.t('Uitkomst')}];
    },
    tableRows() {
      const t = this.t, m = this.m;
      return m.R.map((v, i) => [i + 1, G(v), F((v - m.mk) / m.s, 1),
        m.inn[i] ? t('niet te onderscheiden') : t('verschillend')]);
    }
  },
  mounted() { this.draw(); },
  updated() { this.draw(); },
  methods: {
    lkNumIn,
    /* het bekende glas en de fragmenten op één as, met het vergelijkingsinterval */
    draw() {
      const cv = document.getElementById('gl-cv'), m = this.m;
      if (!cv || !m) return;
      const {K, R, lo, hi, inn} = m;
      const all = [...K, ...R, lo, hi], x0 = Math.min(...all), x1 = Math.max(...all),
        pad = (x1 - x0) * 0.12 || 1e-4, W = 480, H = 150;
      pShow(cv, W, H, (x) => {
        const L = 80, X = v => L + (v - (x0 - pad)) / ((x1 + pad) - (x0 - pad)) * (W - L - 20);
        x.font = '12px ' + PFONT(); x.textBaseline = 'middle';
        x.fillStyle = 'rgba(120,160,220,.18)'; x.fillRect(X(lo), 20, X(hi) - X(lo), 80);
        x.strokeStyle = PCOL.acc; x.setLineDash([4, 3]);
        [lo, hi].forEach(v => { x.beginPath(); x.moveTo(X(v), 18); x.lineTo(X(v), 102); x.stroke(); });
        x.setLineDash([]);
        x.fillStyle = PCOL.ink; x.textAlign = 'right'; x.fillText('bekend', L - 10, 42); x.fillText('gevonden', L - 10, 80);
        K.forEach(v => { x.fillStyle = PCOL.acc; x.beginPath(); x.arc(X(v), 42, 4, 0, 7); x.fill(); });
        R.forEach((v, i) => {
          x.fillStyle = inn[i] ? PCOL.ink : PCOL.bad || '#b0271f';
          x.beginPath(); x.arc(X(v), 80, 4.5, 0, 7); x.fill();
        });
        const st = niceStep(x1 - x0 + 2 * pad, 5);
        x.fillStyle = PCOL.muted; x.textAlign = 'center';
        for (let t = Math.ceil((x0 - pad) / st) * st, k = 0; t <= x1 + pad && k < 12; t += st, k++) x.fillText(glF(t, 4), X(t), H - 30);
        x.fillText('brekingsindex n_D', (W + L) / 2, H - 10);
      });
    }
  }
};
</script>
