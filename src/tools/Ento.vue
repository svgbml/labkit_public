<!-- ================= ENTOMOLOGIE (GRAADDAGEN) =================
     De dagfunctie enDay() blijft in tools/nt/72_ento.js staan. Deze component beheert de velden,
     de curve en de uitkomst. Het rekenwerk is hetzelfde als in de oude calc.ento(), regel voor regel.

     De id's en-base, en-add, en-off, en-meth, en-t, en-cv en en-out blijven zoals ze waren. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <lk-field v-model="base" :label="t('Ontwikkelingsdrempel')" for-id="en-base" unit="°C"/>
        <lk-field v-model="add" :label="t('Benodigde ADD tot dit stadium')" for-id="en-add" unit="°C·d"/>
        <lk-field v-model="off" :label="t('Correctie plaats t.o.v. weerstation')" for-id="en-off" unit="°C"/>
        <div class="f">
          <label for="en-meth">{{ t('Dagtemperatuur') }}</label>
          <select id="en-meth" v-model="meth">
            <option value="avg">{{ t('gemiddelde van min en max') }}</option>
            <option value="trunc">{{ t('min en max afgekapt op de drempel') }}</option>
          </select>
        </div>
        <div class="f" style="grid-column:1/-1">
          <label for="en-t" v-html="tLabel"></label>
          <textarea id="en-t" rows="9" v-model="tt"></textarea>
        </div>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Per regel een datum (optioneel) en de minimum- en maximumtemperatuur, of één daggemiddelde. Weerdata haal je bij het KNMI (daggegevens van het dichtstbijzijnde station). Drempel en benodigde ADD hangen af van soort en stadium; neem ze over uit de ontwikkelingsdata in je cursusmateriaal. Voorbeelddata zijn verzonnen.') }}</p>
    </div>
    <div class="result">
      <canvas id="en-cv" v-show="m"></canvas>
      <div id="en-out">
        <lk-note v-if="!m" kind="info">{{ t('Vul drempel, benodigde ADD en minstens één dag met temperaturen in.') }}</lk-note>
        <template v-else>
          <lk-big v-if="m.found" :label="t('Minimaal PMI')" :value="F(m.days, 1)" :sub="t('dagen')"/>
          <lk-big v-else :label="t('Minimaal PMI')" :value="'> ' + m.D.length" :sub="t('dagen')"/>
          <lk-kv v-if="m.found" :rows="kvRows"/>
          <lk-note v-else kind="warn">{{ t(`De reeks levert ${fmt(m.cum, 1)} °C·d op, minder dan de benodigde ${fmt(m.need, 0)}. Voeg eerdere dagen toe.`) }}</lk-note>
          <lk-note v-if="m.low" kind="info">{{ t('Op dagen waarop ook de maximumtemperatuur onder de drempel ligt, staat de ontwikkeling stil.') }}</lk-note>
          <lk-table :cols="tcols" :rows="trows"/>
          <lk-formula :html="tFormula"/>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => lkNumIn(fmt(x, d));
const dstr = d => `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;

export default {
  name: 'Ento',
  data() {
    return {
      base: '10', add: '60', off: '0', meth: 'avg',
      tt: lkNumIn(`01-07-2026 12,1 21,4
02-07-2026 13,0 23,2
03-07-2026 14,2 25,8
04-07-2026 15,0 26,1
05-07-2026 13,8 22,0
06-07-2026 12,5 20,3
07-07-2026 11,9 19,8
08-07-2026 13,1 22,7
09-07-2026 14,6 24,9
10-07-2026 15,2 26,4`)
    };
  },
  computed: {
    tLabel() { return this.tHtml('Temperaturen per dag, oudste eerst, laatste regel = vinddag <span class="example">voorbeeld</span>'); },
    tFormula() { return this.tHtml('ADD = Σ max(0, T<sub>dag</sub> − T<sub>drempel</sub>) · dag 0 = vinddag'); },
    /* de reeks dagen, de opgebouwde graaddagen terug vanaf de vinddag en het aantal dagen tot de benodigde ADD */
    m() {
      const base = num(this.base), need = num(this.add), off = num(this.off) || 0, meth = this.meth;
      const D = this.tt.split(/\n/).map(l => {
        const dm = l.match(/(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})/);
        const rest = dm ? l.replace(dm[0], ' ') : l;
        const n = rest.trim().split(/[\s;\t]+/).filter(Boolean).map(num).filter(isFinite);
        if (!n.length) return null;
        const lo = n[0] + off, hi = n.length > 1 ? n[1] + off : null;
        return {d: dm ? new Date(+dm[3], +dm[2] - 1, +dm[1]) : null,
          lo: hi != null ? Math.min(lo, hi) : lo, hi: hi != null ? Math.max(lo, hi) : null};
      }).filter(Boolean);
      if (!D.length || !isFinite(base) || !(need > 0)) return null;
      D.forEach(d => d.add = enDay(d.lo, d.hi, base, meth));
      let cum = 0, days = NaN;
      const pts = [[0, 0]];
      for (let i = D.length - 1, j = 1; i >= 0; i--, j++) {
        const prev = cum;
        cum += D[i].add;
        pts.push([j, cum]);
        if (isNaN(days) && cum >= need) days = j - 1 + (D[i].add > 0 ? (need - prev) / D[i].add : 1);
      }
      const fd = D[D.length - 1].d;
      let when = '';
      if (isFinite(days) && fd) {
        const ms = fd.getTime() + 86400000 - days * 86400000;
        when = dstr(new Date(ms));
      }
      return {base, need, D, cum, days, pts, when, found: isFinite(days),
        low: D.some(d => d.hi != null && d.hi < base)};
    },
    kvRows() {
      const t = this.t, m = this.m;
      return [[t('Eileg uiterlijk rond'), m.when || t('– (vul datums in)')],
        [t('Benodigde ADD'), F(m.need, 0) + ' °C·d'],
        [t('Totaal in de reeks'), F(m.cum, 1) + ' °C·d']];
    },
    tcols() {
      const t = this.t;
      return [{h: t('Dag')}, {h: t('Datum')}, {h: t('T gem. (°C)'), num: true},
        {h: t('ADD'), num: true}, {h: t('Cumulatief terug'), num: true}];
    },
    trows() {
      const D = this.m.D;
      return D.map((d, i) => {
        const back = D.slice(i).reduce((s, q) => s + q.add, 0);
        return [i - D.length + 1, d.d ? dstr(d.d) : '–',
          F(d.hi != null ? (d.lo + d.hi) / 2 : d.lo, 1), F(d.add, 1), F(back, 1)];
      });
    }
  },
  mounted() { this.draw(); },
  updated() { this.draw(); },
  methods: {
    F,
    /* de cumulatieve ADD terug vanaf de vinddag; chart() tekent zoals voorheen */
    draw() {
      const cv = document.getElementById('en-cv'), m = this.m;
      if (!cv || !m) return;
      const pts = m.pts, need = m.need;
      chart(cv, {xmin: 0, xmax: m.D.length, ymin: 0, ymax: Math.max(m.cum, need) * 1.1,
        xlabel: 'dagen terug vanaf de vinddag', ylabel: 'cumulatieve ADD (°C·d)',
        series: [{pts, name: 'ADD'},
          {fn: x => {
            let i = Math.min(Math.floor(x), pts.length - 2);
            i = Math.max(0, i);
            const a = pts[i], b = pts[i + 1] || a;
            return a[1] + (b[1] - a[1]) * (x - a[0]);
          }},
          {fn: () => need, color: '--warn', dash: [5, 4]}]});
    }
  }
};
</script>
