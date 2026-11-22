<!-- ================= CELPASSAGEPLANNER =================
     De velden en de uitkomst van de celpassageplanner. Het rekenwerk is dat van calc.passage,
     ongewijzigd, maar nu in computeds.

     De id's ps-fmt, ps-n, ps-td, ps-cd, ps-pct, ps-lag, ps-want en ps-out blijven zoals ze waren. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <div class="f">
          <label for="ps-fmt">{{ t('Kweekformaat') }}</label>
          <select id="ps-fmt" style="width:100%" v-model="fmtV">
            <option v-for="o in formats" :key="o[0]" :value="o[0]">{{ t(o[1]) }}</option>
          </select>
        </div>
        <lk-field v-model="n" :label="t('Cellen nu in de fles')" for-id="ps-n"/>
        <lk-field v-model="td" :label="t('Verdubbelingstijd')" for-id="ps-td" :unit="t('u')"/>
        <lk-field v-model="cd" :label="t('Dichtheid bij confluentie')" for-id="ps-cd" :unit="t('cellen/cm²')"/>
        <lk-field v-model="pct" :label="t('Passeren bij')" for-id="ps-pct" :unit="t('% confluent')"/>
        <lk-field v-model="lag" :label="t('Hersteltijd na passage')" for-id="ps-lag" :unit="t('u')"/>
        <lk-field v-model="want" :label="t('Volgende passage over')" for-id="ps-want" :unit="t('dagen')"/>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Haal verdubbelingstijd en confluente dichtheid uit je eigen tellingen of het datasheet van de cellijn (bijvoorbeeld ATCC); ze verschillen sterk per lijn. Voorbeelddata zijn verzonnen.') }}</p>
    </div>
    <div class="result">
      <div id="ps-out">
        <lk-note v-if="!m" kind="info">{{ t('Vul formaat, aantal cellen, verdubbelingstijd en confluente dichtheid in.') }}</lk-note>
        <template v-else>
          <lk-big :label="t('Tijd tot ' + fmt(m.pc * 100, 0) + '% confluent')" :value="bigText"/>
          <lk-kv :rows="rows"/>
          <lk-note v-if="advice" kind="info" :html="advice"/>
          <lk-table :cols="cols" :rows="tableRows"/>
          <lk-note v-if="m.now > 100" kind="warn">{{ t('Meer cellen dan bij volledige confluentie: controleer het aantal of de confluente dichtheid.') }}</lk-note>
          <lk-formula :html="tHtml('t = t<sub>lag</sub> + t<sub>d</sub> · log₂(n)')"/>
          <h3 style="margin-top:14px">{{ t('Passagekalender') }}</h3>
          <lk-table :cols="calCols" :rows="calRows"/>
          <div class="row" style="margin-top:8px">
            <button type="button" id="ps-rem" @click="remind">{{ t('Herinnering bij de volgende passage') }}</button>
          </div>
          <lk-note v-if="remOk != null" :kind="remOk ? 'ok' : 'warn'">{{ remOk ? t('Herinnering gezet; hij gaat af zolang Labkit open is (ook in een andere tool). Je ziet hem bij Timers.') : t('De volgende passage is nu al; er is niets te herinneren.') }}</lk-note>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => lkNumIn(fmt(x, d));
/* tijd als "2 d 12 u" */
const dd = h => { const d = Math.floor(h / 24), hh = Math.round(h - d * 24); return d ? `${d} d ${hh} u` : `${hh} u`; };

export default {
  name: 'Passage',
  data() {
    return {fmtV: '75', n: '2e6', td: '24', cd: '1e5', pct: '80', lag: '12', want: '3', remOk: null};
  },
  methods: {
    fmt: (x, d) => fmt(x, d),
    remind() { const c = this.cal[0]; this.remOk = addReminder('⏰ ' + this.t('Passeren'), c.at); }
  },
  computed: {
    formats() {
      return [['25', 'T25-fles (25 cm²)'], ['75', 'T75-fles (75 cm²)'], ['175', 'T175-fles (175 cm²)'],
        ['9.5', '6-wells (9,5 cm²)'], ['55', 'petrischaal 10 cm (55 cm²)']];
    },
    /* het rekenwerk van calc.passage, ongewijzigd; null als er te weinig is ingevuld */
    m() {
      const A = num(this.fmtV), N = num(this.n), td = num(this.td), cd = num(this.cd),
        pc = (num(this.pct) || 80) / 100, lag = num(this.lag) || 0, want = num(this.want);
      if (!(A > 0 && N > 0 && td > 0 && cd > 0)) return null;
      const target = A * cd * pc, now = N / (A * cd) * 100, hrs = N >= target ? 0 : td * Math.log2(target / N);
      const R = [2, 3, 4, 5, 6, 8, 10, 15, 20].map(n => ({n, t: lag + td * Math.log2(n)}));
      return {A, N, td, pc, lag, want, target, now, hrs, R};
    },
    /* de splitratio die het best past bij "volgende passage over"; null zonder die wens */
    best() {
      const {want, R} = this.m;
      return isFinite(want) && want > 0 ? R.reduce((a, b) => Math.abs(b.t - want * 24) < Math.abs(a.t - want * 24) ? b : a) : null;
    },
    /* de verwachte passages: eerst bij confluentie, daarna steeds na de tijd van de best passende splitratio */
    cal() {
      const t0 = Date.now(), first = t0 + this.m.hrs * 3600e3, b = this.best;
      return Array.from({length: b ? 6 : 1}, (_, i) => ({at: first + i * (b ? b.t : 0) * 3600e3, r: i ? '1:' + b.n : '—'}));
    },
    calCols() { return [{h: '#', num: true}, {h: this.t('Datum')}, {h: this.t('Splitratio ervoor')}, {h: ''}]; },
    calRows() {
      const loc = LANG === 'en' ? 'en-GB' : 'nl-NL';
      return this.cal.map((c, i) => { const d = new Date(c.at), we = d.getDay() % 6 === 0;
        return {cells: [i + 1, d.toLocaleString(loc, {weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'}), c.r, we ? this.t('weekend') : ''], cls: we ? 'hl' : ''}; });
    },
    bigText() { return this.m.N >= this.m.target ? this.t('nu') : this.t(dd(this.m.hrs)); },
    rows() {
      const t = this.t, {pc, target, N, A, now} = this.m;
      return [[t('Confluentie nu (schatting)'), F(now, 0) + '%'],
        [t('Cellen bij ' + fmt(pc * 100, 0) + '%'), lkNumIn(sci(target, 3))],
        [t('Celdichtheid nu'), this.tHtml(sci(N / A, 3) + ' cellen/cm²')]];
    },
    advice() {
      const {want, target} = this.m, best = this.best;
      if (!best) return '';
      return this.tHtml(`Voor een volgende passage over ${fmt(want, 1)} dagen past splitratio 1:${best.n} (klaar na ${dd(best.t)}); zaai dan ${sci(target / best.n, 3)} cellen in.`);
    },
    cols() {
      return [{h: this.t('Splitratio')}, {h: this.t('Cellen inzaaien'), num: true},
        {h: this.t('Weer ' + fmt(this.m.pc * 100, 0) + '% na'), num: true}];
    },
    tableRows() {
      const {R, target} = this.m;
      return R.map(r => ['1:' + r.n, lkNumIn(sci(target / r.n, 3)), this.t(dd(r.t))]);
    }
  }
};
</script>
