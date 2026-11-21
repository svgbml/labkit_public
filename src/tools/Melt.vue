<!-- ================= qPCR-SMELTCURVE =================
     Dezelfde berekening als de oude calc.melt(); meltPeaks(), parseCols() en smooth() blijven
     gewone functies in web/index.html. De tekening van −dF/dT blijft met chart() gemaakt, na
     elke render (net als bij Gradient). De id's ml-min, ml-sm, ml-data, ml-cv, ml-out en ml-res
     blijven zoals ze waren: het validatiegeval leest de rijen van #ml-res. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <div class="f" data-expert="">
          <label for="ml-min">{{ t('Tweede piek melden vanaf') }}</label>
          <div class="inu"><input id="ml-min" inputmode="decimal" v-model="min"><span class="u">{{ t('% van hoofdpiek') }}</span></div>
        </div>
        <div class="f" data-expert="">
          <label for="ml-sm">{{ t('Gladstrijken') }}</label>
          <select id="ml-sm" style="width:100%" v-model="sm">
            <option value="1">{{ t('licht') }}</option>
            <option value="2">{{ t('normaal') }}</option>
            <option value="4">{{ t('sterk') }}</option>
          </select>
        </div>
      </div>
      <div class="f" style="margin-top:12px">
        <label for="ml-data" v-html="dataLabel"></label>
        <textarea id="ml-data" rows="10" spellcheck="false" v-model="data"></textarea>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:8px 0 0">{{ t('Exporteer de smeltcurve (Melt Curve Raw Data) uit de qPCR-software en plak de kolommen hier. De voorbeelddata zijn berekend.') }}</p>
    </div>
    <div class="result">
      <canvas id="ml-cv" v-show="m && m.res"></canvas>
      <div id="ml-out">
        <lk-note v-if="!m" kind="info">{{ t('Plak een temperatuurkolom en fluorescentie per monster.') }}</lk-note>
        <lk-note v-else-if="!m.res" kind="info">{{ t('Te weinig meetpunten.') }}</lk-note>
        <div v-else class="tbl-wrap" style="margin-top:8px">
          <table class="mini" id="ml-res">
            <thead><tr><th>{{ t('Monster') }}</th><th class="num">{{ t('Tm hoofdpiek (°C)') }}</th><th>{{ t('Extra pieken (°C)') }}</th><th>{{ t('Beoordeling') }}</th></tr></thead>
            <tbody>
              <tr v-for="(r, i) in m.res" :key="i">
                <td>{{ r.name }}</td>
                <td class="num"><b>{{ r.main ? F(r.main.tm, 1) : '–' }}</b></td>
                <td>{{ r.extra.map(p => F(p.tm, 1)).join(', ') || '–' }}</td>
                <td>
                  <span v-if="!r.main" class="chip warn">{{ t('geen piek') }}</span>
                  <span v-else-if="r.extra.length" class="chip warn">{{ t('meer dan één product') }}</span>
                  <span v-else class="chip ok">{{ t('één product') }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => lkNumIn(fmt(x, d));

/* de voorbeeldcurven: een hoofdpiek bij 84,5 °C en bij monster 2 een dimeerpiek bij 76,0 °C */
function example() {
  const T = []; for (let t = 65; t <= 95.001; t += 0.5) T.push(Math.round(t * 10) / 10);
  const f = (t, tm, w, a) => a / (1 + Math.exp((t - tm) / w));
  const rows = [['T (°C)', trPlain('Monster 1'), trPlain('Monster 2'), 'NTC'].join('\t'), ...T.map(t => [t, f(t, 84.5, 0.6, 10000) + 300,
    f(t, 84.5, 0.6, 8000) + f(t, 76.0, 0.8, 2500) + 300, f(t, 76.2, 0.8, 3000) + 300]
    .map((v, i) => i ? Math.round(v) : String(v).replace('.', ',')).join('\t'))];
  return lkNumIn(rows.join('\n'));
}

export default {
  name: 'Melt',
  data() {
    /* de app zet de bewaarde waarden terug vóórdat deze component rendert: lees ze hier */
    const st = typeof storeGet === 'function' ? storeGet() : {};
    const g = (id, d) => (st[id] != null ? String(st[id]) : d);
    const data = g('ml-data', '');
    return {min: g('ml-min', '20'), sm: g('ml-sm', '2'), data: data.trim() ? data : example()};
  },
  computed: {
    dataLabel() {
      return this.tHtml('Data: eerste kolom temperatuur (°C), daarna fluorescentie per monster (eerste regel = namen) <span class="example">voorbeeld</span>');
    },
    /* alle maten uit één plek (het rekenwerk van de oude calc.melt) */
    m() {
      const D = parseCols(this.data); if (!D || !D.series.length) return null;
      const k = num(this.sm) || 2, thr = (num(this.min) || 20) / 100, ser = [], res = [];
      let dmax = 0;
      D.series.forEach((s, j) => {
        const idx = D.x.map((t, i) => i).filter(i => isFinite(D.x[i]) && isFinite(s.y[i]));
        if (idx.length < 7) return;
        const T = idx.map(i => D.x[i]), Fl = idx.map(i => s.y[i]);
        const {d, pk} = meltPeaks(T, Fl, k), main = pk[0];
        const extra = main ? pk.slice(1).filter(p => p.h >= thr * main.h) : [];
        res.push({name: s.name, main, extra});
        const col = SERCOL[j % SERCOL.length];
        ser.push({pts: T.map((t, i) => [t, d[i]]).filter(p => isFinite(p[1])), color: col, r: 2, name: s.name});
        dmax = Math.max(dmax, ...d.filter(isFinite));
      });
      if (!res.length) return {res: null};
      const xs = D.x.filter(isFinite);
      return {res, ser, dmax, xmin: Math.min(...xs), xmax: Math.max(...xs)};
    }
  },
  mounted() { this.draw(); },
  updated() { this.draw(); },
  methods: {
    F,
    draw() {
      const cv = document.getElementById('ml-cv'), m = this.m; if (!cv || !m || !m.res) return;
      chart(cv, {xmin: m.xmin, xmax: m.xmax, ymin: 0, ymax: m.dmax * 1.1, xlabel: 'temperatuur (°C)',
        ylabel: '−dF/dT', series: m.ser, legend: m.res.map((r, j) => [r.name, SERCOL[j % SERCOL.length]])});
    }
  }
};
</script>
