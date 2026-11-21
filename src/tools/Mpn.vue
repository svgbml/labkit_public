<!-- ================= MPN (MEEST WAARSCHIJNLIJK AANTAL) =================
     De velden, de tabel en de uitkomst van de MPN-berekening. Het rekenwerk is dat van
     calc.mpn, ongewijzigd, maar nu in een computed. De tabel is een <lk-etable>; de rijen
     staan in de component.

     De id's mp-u, mp-tbl, mp-tbl-add en mp-out blijven zoals ze waren. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <div class="f">
          <label for="mp-u">{{ t('Eenheid monster') }}</label>
          <select id="mp-u" style="width:100%" v-model="u"><option>g</option><option>mL</option></select>
        </div>
      </div>
      <div style="margin-top:12px">
        <lk-etable table-id="mp-tbl" :cols="cols" v-model:rows="rows" add-id="mp-tbl-add"/>
      </div>
      <div class="row" style="margin-top:8px">
        <button type="button" id="mp-tbl-add" @click="addRow">{{ t('+ Verdunning') }}</button>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Per verdunning de hoeveelheid oorspronkelijk monster per buis (bijv. 0,1 g, 0,01 g, 0,001 g), het aantal buizen en het aantal positieve buizen. Voorbeeld: 3-buizenreeks met uitslag 3-1-0.') }}</p>
    </div>
    <div class="result">
      <div id="mp-out">
        <lk-note v-if="m.err === 1" kind="info">{{ t('Vul per verdunning de hoeveelheid monster per buis, het aantal buizen en het aantal positieve buizen in.') }}</lk-note>
        <template v-else-if="m.err === 2">
          <lk-big :label="t('MPN (' + m.code + ')')" :value="'< ' + S(m.val)" :sub="per"/>
          <lk-note kind="info">{{ t('Geen positieve buizen: dit is de bovengrens (95%) bij nul positieven.') }}</lk-note>
        </template>
        <template v-else-if="m.err === 3">
          <lk-big :label="t('MPN (' + m.code + ')')" :value="t('te hoog')"/>
          <lk-note kind="warn">{{ t('Alle buizen positief: het aantal is groter dan de reeks kan meten. Verdun verder.') }}</lk-note>
        </template>
        <template v-else>
          <lk-big :label="t('MPN (' + m.code + ')')" :value="S(m.lam)" :sub="per"/>
          <lk-kv :rows="rows2"/>
          <lk-formula html="Σ p·m·e&lt;sup&gt;−λm&lt;/sup&gt;/(1 − e&lt;sup&gt;−λm&lt;/sup&gt;) = Σ (n − p)·m"/>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const S = x => lkNumIn(sig(x, 2));

export default {
  name: 'Mpn',
  data() {
    return {
      u: 'g',
      rows: [['0,1', '3', '3'], ['0,01', '3', '1'], ['0,001', '3', '0']].map(r => r.map(lkNumIn))
    };
  },
  computed: {
    cols() {
      return [{h: this.t('Monster per buis'), t: 'num', w: 90}, {h: this.t('Buizen'), t: 'num', w: 64}, {h: this.t('Positief'), t: 'num', w: 64}];
    },
    per() { return this.t('per ' + this.u); },
    /* het rekenwerk van calc.mpn, ongewijzigd */
    m() {
      const u = this.u, D = this.rows.map(r => ({m: num(r[0]), n: Math.round(num(r[1])), p: Math.round(num(r[2]))})).filter(d => d.m > 0 && d.n > 0 && d.p >= 0 && d.p <= d.n);
      if (!D.length) return {err: 1};
      const code = D.map(d => d.p).join('-');
      if (D.every(d => d.p === 0)) { const mt = D.reduce((s, d) => s + d.n * d.m, 0); return {err: 2, code, val: -Math.log(0.05) / mt}; }
      if (D.every(d => d.p === d.n)) return {err: 3, code};
      const g = l => D.reduce((s, d) => s + d.p * d.m * Math.exp(-l * d.m) / (1 - Math.exp(-l * d.m)) - (d.n - d.p) * d.m, 0);
      let lo = 1e-9, hi = 1e12; for (let i = 0; i < 200; i++) { const mid = Math.sqrt(lo * hi); if (g(mid) > 0) lo = mid; else hi = mid; } const lam = Math.sqrt(lo * hi);
      const I = D.reduce((s, d) => { const e = Math.exp(-lam * d.m); return s + d.n * d.m * d.m * e / (1 - e); }, 0), se = 1 / (lam * Math.sqrt(I)), cl = [lam * Math.exp(-1.96 * se), lam * Math.exp(1.96 * se)];
      return {err: 0, code, lam, cl, u, tubes: D.reduce((s, d) => s + d.n, 0), log: Math.log10(lam)};
    },
    rows2() {
      const m = this.m;
      return [[this.t('95%-interval'), S(m.cl[0]) + ' – ' + S(m.cl[1]) + ' ' + this.per],
        [this.t('log₁₀ MPN'), lkNumIn(fmt(m.log, 2))],
        [this.t('Buizen totaal'), m.tubes]];
    }
  },
  methods: {
    S,
    addRow() { this.rows = [...this.rows, ['', '', '']]; }
  }
};
</script>
