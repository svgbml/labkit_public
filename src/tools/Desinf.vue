<!-- ================= DESINFECTIETEST (LOG-REDUCTIE) =================
     Het rekenwerk is dat van calc.desinf, ongewijzigd, maar nu in computeds. De tabel is een
     <lk-etable>; de rijen staan in de component.

     De id's ds-req, ds-own, ds-dil, ds-dl, ds-tbl, ds-tbl-add en ds-out blijven zoals ze waren. -->
<template>
  <div class="stack">
    <div class="panel">
      <div class="fields">
        <div class="f">
          <label for="ds-req">{{ t('Eis') }}</label>
          <select id="ds-req" v-model="rq">
            <option v-for="o in reqs" :key="o[0]" :value="o[0]">{{ t(o[1]) }}</option>
          </select>
        </div>
        <lk-field v-show="rq === 'e'" v-model="own" :label="t('Eigen eis')" for-id="ds-own" unit="lg"/>
        <lk-field v-model="dil" :label="t('Verdunning in testmengsel')" for-id="ds-dil"/>
        <lk-field v-model="dl" :label-html="tHtml('Detectiegrens N&lt;sub&gt;a&lt;/sub&gt;')" for-id="ds-dl" :unit="t('kve/mL')"/>
      </div>
      <div style="margin-top:12px">
        <lk-etable table-id="ds-tbl" :cols="cols" v-model:rows="rows" add-id="ds-tbl-add"/>
      </div>
      <div class="row" style="margin-top:8px">
        <button type="button" id="ds-tbl-add" @click="addRow">{{ t('+ Organisme') }}</button>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0" v-html="hint"></p>
    </div>
    <div class="result">
      <div id="ds-out">
        <lk-note v-if="!R.length" kind="info" :html="tHtml('Vul per organisme N en N&lt;sub&gt;a&lt;/sub&gt; in.')"/>
        <template v-else>
          <lk-big :label="t('Eis ' + F(req, 1) + ' lg')" :value="t(all ? 'voldoet' : 'voldoet niet')"
                  :chip="t(okCount + ' van ' + R.length)" :chip-kind="all ? 'ok' : 'bad'"/>
          <lk-kv :rows="kvRows"/>
          <lk-table :cols="cols2" :rows="tableRows"/>
          <lk-note v-if="rq !== 'e' && R.some(r => !r.rng)" kind="warn">{{ t('Een testsuspensie ligt buiten 1,5–5,0 × 10⁸ kve/mL; bij EN 1276 is de test dan niet geldig.') }}</lk-note>
          <lk-note v-if="R.some(r => r.below && !r.ok)" kind="info" :html="tHtml('N&lt;sub&gt;a&lt;/sub&gt; ligt onder de detectiegrens, maar de testsuspensie is te laag om de eis aan te tonen.')"/>
          <lk-formula :html="tHtml('R = lg(N/' + F(m.dil, 0) + ') − lg N&lt;sub&gt;a&lt;/sub&gt;')"/>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => lkNumIn(fmt(x, d));

export default {
  name: 'Desinf',
  data() {
    return {
      rq: '5', own: '3', dil: '10', dl: '140',
      rows: [['Pseudomonas aeruginosa', 3.2e8, 85], ['Escherichia coli', 2.4e8, 0],
        ['Staphylococcus aureus', 4.1e8, 2600], ['Enterococcus hirae', 1.9e8, 310]].map(r => r.map(String))
    };
  },
  computed: {
    reqs() {
      return [['5', '5 lg: bactericide (EN 1276, EN 13727)'], ['4', '4 lg: fungicide of gistdodend (EN 1650, EN 13624)'],
        ['4v', '4 lg: virusdodend (EN 14476)'], ['e', 'eigen eis']];
    },
    cols() {
      return [{h: this.t('Organisme'), t: 'txt', w: 170}, {h: this.t('N (kve/mL)'), t: 'num', w: 100},
        {h: this.tHtml('N<sub>a</sub> (kve/mL)'), t: 'num', w: 100}];
    },
    hint() {
      return this.tHtml('N: kve/mL in de testsuspensie. N<sub>a</sub>: kve/mL in het testmengsel na de contacttijd, teruggerekend uit de telplaten van het geneutraliseerde mengsel. Vul 0 in als er niets groeide; dan geldt de detectiegrens. Voorbeelddata zijn verzonnen.');
    },
    /* het rekenwerk van calc.desinf, ongewijzigd */
    m() {
      const rq = this.rq, req = rq === 'e' ? num(this.own) : parseFloat(rq),
        dil = num(this.dil) || 10, dl = num(this.dl) || 0;
      return {req, dil, dl};
    },
    req() { return this.m.req; },
    R() {
      const {req, dil, dl} = this.m;
      return this.rows.map(r => {
        const N = num(r[1]), Na = num(r[2]);
        if (!(N > 0) || !(Na >= 0)) return null;
        const below = Na < dl || Na === 0, nA = below ? Math.max(dl, 1e-9) : Na,
          red = Math.log10(N / dil) - Math.log10(nA);
        return {n: r[0] || '?', N, Na, below, red, ok: red >= req - 1e-9, rng: N >= 1.5e8 && N <= 5e8};
      }).filter(Boolean);
    },
    all() { return this.R.every(r => r.ok); },
    okCount() { return this.R.filter(r => r.ok).length; },
    mn() { return this.R.reduce((a, b) => b.red < a.red ? b : a); },
    kvRows() {
      const mn = this.mn;
      return [[this.t('Laagste reductie'),
        this.tHtml(ud(mn.n) + ': ' + (mn.below ? '≥ ' : '') + F(mn.red, 2) + ' lg')]];
    },
    cols2() {
      return [{h: this.t('Organisme')}, {h: this.tHtml('N<sub>0</sub> = N/' + fmt(this.m.dil, 0)), num: true},
        {h: this.tHtml('N<sub>a</sub>'), num: true}, {h: this.t('Reductie (lg)'), num: true}, {h: this.t('Eis')}];
    },
    tableRows() {
      const {dil, dl} = this.m;
      return this.R.map(r => [esc(r.n), lkNumIn(sci(r.N / dil, 3)),
        r.below ? '&lt; ' + lkNumIn(sci(dl, 2)) : lkNumIn(sci(r.Na, 3)),
        (r.below ? '≥ ' : '') + F(r.red, 2), this.t(r.ok ? 'voldoet' : 'voldoet niet')]);
    }
  },
  methods: {
    F,
    addRow() { this.rows = [...this.rows, ['', '', '']]; }
  }
};
</script>
