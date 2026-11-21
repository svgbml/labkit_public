<!-- ================= WESTERN BLOT-NORMALISATIE =================
     Dezelfde berekening als de oude calc.wb(), nu in een component. De tabel is een eigen <table>
     (een keuzelijst Controle met waarden 0 en 1, die ook in bewaarde tabellen en gedeelde links
     staan); TBLDEF['wb-tbl'] in web/index.html krijgt set/push/get/blank/inputCols en wijst naar
     window.__wbVm. De id's wb-tbl, wb-add, wb-cv en wb-out blijven zoals ze waren; de staafgrafiek
     blijft met barChart() getekend. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="tbl-wrap"><table id="wb-tbl" class="mini">
        <thead><tr><th>{{ t('Laan / monster') }}</th><th class="num">{{ t('Doeleiwit') }}</th><th class="num">{{ t('Laadcontrole') }}</th><th>{{ t('Controle') }}</th><th></th></tr></thead>
        <tbody>
          <tr v-for="(r, i) in rows" :key="r.k">
            <td><input class="txt" data-n v-model="r.n" style="width:150px"></td>
            <td><input data-t inputmode="decimal" v-model="r.t" style="text-align:right;width:90px"></td>
            <td><input data-l inputmode="decimal" v-model="r.l" style="text-align:right;width:90px"></td>
            <td><select data-c :aria-label="t('Controle')" v-model="r.c"><option value="0">{{ t('nee') }}</option><option value="1">{{ t('ja') }}</option></select></td>
            <td><button type="button" class="ghost" data-del :aria-label="t('Verwijder')" @click="del(i)">✕</button></td>
          </tr>
        </tbody>
      </table></div>
      <div class="row" style="margin-top:10px"><button type="button" id="wb-add" @click="addRow">{{ t('+ Laan') }}</button></div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Monsters met dezelfde naam worden als replicaten gemiddeld. Zet bij de controle-lanen (meestal onbehandeld) Controle op ja. Voorbeelddata zijn verzonnen.') }}</p>
    </div>
    <div class="result">
      <canvas id="wb-cv"></canvas>
      <div id="wb-out">
        <lk-note v-if="m.err" :kind="m.err.kind">{{ t(m.err.text) }}</lk-note>
        <template v-else>
          <lk-table :cols="resCols" :rows="resRows"/>
          <lk-note v-if="m.lcv > 20" kind="warn">{{ t('De laadcontrole varieert ' + fmt(m.lcv, 0) + '% tussen lanen; controleer gelijk laden en het lineaire bereik.') }}</lk-note>
          <lk-formula :html="formula"/>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => lkNumIn(fmt(x, d));
const val = x => (x == null || x === '' || (typeof x === 'number' && !isFinite(x)) ? '' : String(x).replace('.', ','));
const flag = c => (c === true || c === 1 || (c && c !== '0' && c !== 'false') ? '1' : '0');

let seq = 0;
const mk = (n, t, l, c) => ({k: ++seq, n, t, l, c});
const DATA = [['Controle', 15200, 30100, true], ['Controle', 14800, 29500, true],
  ['Behandeling 1', 31500, 30800, false], ['Behandeling 1', 29800, 29900, false],
  ['Behandeling 2', 8200, 31200, false], ['Behandeling 2', 7600, 30500, false]];

export default {
  name: 'Wb',
  data() {
    return {rows: DATA.map(r => mk(trPlain(r[0], true), lkNumIn(val(r[1])), lkNumIn(val(r[2])), flag(r[3])))};
  },
  computed: {
    /* het rekenwerk van de oude calc.wb(), één keer */
    m() {
      const L = this.rows.map(r => ({n: String(r.n).trim() || '?', t: num(r.t), l: num(r.l), c: r.c === '1'}))
        .filter(x => isFinite(x.t) && x.l > 0);
      if (!L.length) return {err: {kind: 'info', text: 'Vul intensiteiten in.'}};
      const ctrl = L.filter(x => x.c);
      if (!ctrl.length) return {err: {kind: 'bad', text: 'Zet minstens één laan op Controle = ja.'}};
      const cr = mean(ctrl.map(x => x.t / x.l)), lc = mean(L.map(x => x.l)), lcv = sd(L.map(x => x.l)) / lc * 100;
      const G = {};
      L.forEach(x => { (G[x.n] = G[x.n] || []).push(x.t / x.l / cr); });
      const names = Object.keys(G);
      const ms = names.map(n => mean(G[n])), sds = names.map(n => (G[n].length > 1 ? sd(G[n]) : 0));
      return {cr, lcv, G, names, ms, sds};
    },
    resCols() {
      return [{h: this.t('Monster')}, {h: 'n', num: true}, {h: this.t('Relatief (gem.)'), num: true}, {h: this.t('SD'), num: true}];
    },
    resRows() {
      const {names, G, ms, sds} = this.m;
      return names.map((n, i) => [this.esc(n), G[n].length, '<b>' + F(ms[i], 3) + '</b>', G[n].length > 1 ? F(sds[i], 3) : '–']);
    },
    formula() {
      return this.tHtml('relatief = (doel / laadcontrole) / gemiddelde van de controle (' + fmt(this.m.cr, 4) + ')');
    }
  },
  mounted() { this.draw(); },
  updated() { this.draw(); },
  methods: {
    fmt,
    draw() {
      const m = this.m, cv = document.getElementById('wb-cv');
      if (!cv || m.err) return;
      barChart(cv, m.names, m.ms, m.ms.map((v, i) => v - m.sds[i]), m.ms.map((v, i) => v + m.sds[i]),
        {ylabel: 'relatieve expressie (controle = 1)'});
    },
    addRow() { this.rows.push(mk('', '', '', '0')); },
    del(i) { this.rows.splice(i, 1); },
    /* --- haken voor de rest van de app (TBLDEF['wb-tbl'] in web/index.html) --- */
    getRows() { return this.rows.map(r => [r.n, r.t, r.l, r.c]); },
    setRows(vals) {
      this.rows = vals.map(a => mk(a[0] == null ? '' : String(a[0]), val(a[1]), val(a[2]), flag(a[3])));
    },
    pushRow(a) {
      const empty = this.rows.findIndex(r => !String(r.n).trim() && !String(r.t).trim() && !String(r.l).trim());
      if (empty >= 0) this.rows.splice(empty, 1);
      this.rows.push(mk(a[0] == null ? '' : String(a[0]), val(a[1]), val(a[2]), flag(a[3])));
    }
  }
};
</script>
