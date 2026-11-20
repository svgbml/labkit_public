<!-- ================= PRIMERS OPLOSSEN =================
     Dezelfde berekening als de oude calc.oligo(), nu in een component. De tabel is een eigen
     <table> (elke rij heeft een berekende kolom met het volume buffer); TBLDEF['ol-tbl'] in
     web/index.html krijgt set/push/get/blank/inputCols en wijst naar window.__olVm. De id's
     ol-tbl, ol-add, ol-s, ol-w, ol-wv en ol-out en het kenmerk data-o blijven zoals ze waren. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="tbl-wrap"><table id="ol-tbl" class="mini">
        <thead><tr><th>{{ t('Primer') }}</th><th class="num">{{ t('Hoeveelheid (nmol)') }}</th><th class="num">{{ t('Buffer voor stock') }}</th><th></th></tr></thead>
        <tbody>
          <tr v-for="(r, i) in lines" :key="r.row.k">
            <td><input class="txt" data-n v-model="r.row.n" style="width:140px"></td>
            <td><input data-a inputmode="decimal" v-model="r.row.a" style="text-align:right;width:90px"></td>
            <td class="num" data-o><b v-if="r.buf">{{ r.buf }}</b><template v-else>–</template></td>
            <td><button type="button" class="ghost" data-del :aria-label="t('Verwijder')" @click="del(i)">✕</button></td>
          </tr>
        </tbody>
      </table></div>
      <div class="row" style="margin-top:10px"><button type="button" id="ol-add" @click="addRow">{{ t('+ Primer') }}</button></div>
      <div class="fields" style="margin-top:12px">
        <lk-field v-model="s" :label="t('Stockconcentratie')" for-id="ol-s" unit="µM"/>
        <lk-field data-expert="" v-model="w" :label="t('Werkoplossing')" for-id="ol-w" unit="µM"/>
        <lk-field data-expert="" v-model="wv" :label="t('Volume werkoplossing')" for-id="ol-wv" unit="µL"/>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('De hoeveelheid in nmol staat op het buisje of het specificatieblad. Centrifugeer het buisje kort voor het openen.') }}</p>
    </div>
    <div class="result" id="ol-out">
      <lk-note v-if="m.err" :kind="m.err.kind">{{ t(m.err.text) }}</lk-note>
      <template v-else>
        <lk-big :label="t('Werkoplossing ' + F(m.W, 2) + ' µM')" :html="m.v1" :sub="t('stock')"/>
        <lk-kv :rows="m.rows"/>
        <lk-formula :html="formula"/>
      </template>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => lkNumIn(fmt(x, d));
const val = x => (x == null || x === '' || (typeof x === 'number' && !isFinite(x)) ? '' : String(x).replace('.', ','));

let seq = 0;
const mk = (n, a) => ({k: ++seq, n, a});
const DATA = [['Forward', 28.4], ['Reverse', 31.9]];

export default {
  name: 'Oligo',
  data() {
    const st = typeof storeGet === 'function' ? storeGet() : {};
    const g = (id, d) => (st[id] != null ? String(st[id]) : lkNumIn(d));
    return {
      s: g('ol-s', '100'), w: g('ol-w', '10'), wv: g('ol-wv', '100'),
      rows: DATA.map(r => mk(trPlain(r[0], true), lkNumIn(val(r[1]))))
    };
  },
  computed: {
    /* het rekenwerk van de oude calc.oligo(), één keer */
    m() {
      const S = num(this.s), W = num(this.w), WV = num(this.wv);
      if (!(S > 0) || !(W > 0) || !(WV > 0)) return {S, err: {kind: 'info', text: 'Vul stock- en werkconcentratie in.'}};
      if (W > S) return {S, err: {kind: 'bad', text: 'De werkoplossing kan niet geconcentreerder zijn dan de stock.'}};
      const v1 = W * WV / S;
      return {S, W, v1: lkNumIn(vol(v1)), rows: [[this.t('Water of TE'), lkNumIn(vol(WV - v1))],
        [this.t('Totaal'), lkNumIn(vol(WV))], [this.t('Verdunning'), '1 : ' + lkNumIn(sig(S / W, 4))]]};
    },
    lines() {
      const S = num(this.s);
      return this.rows.map(row => {
        const a = num(row.a);
        return {row, buf: a > 0 && S > 0 ? lkNumIn(vol(a / S * 1000)) : ''};
      });
    },
    formula() {
      return this.tHtml('V<sub>stock</sub> (µL) = nmol / µM × 1000 · werkoplossing: V₁ = C₂V₂ / C₁');
    }
  },
  methods: {
    F,
    addRow() { this.rows.push(mk('', '')); },
    del(i) { this.rows.splice(i, 1); },
    /* --- haken voor de rest van de app (TBLDEF['ol-tbl'] in web/index.html) --- */
    getRows() { return this.rows.map(r => [r.n, r.a]); },
    setRows(vals) { this.rows = vals.map(a => mk(a[0] == null ? '' : String(a[0]), val(a[1]))); },
    pushRow(a) {
      const empty = this.rows.findIndex(r => !String(r.n).trim() && !String(r.a).trim());
      if (empty >= 0) this.rows.splice(empty, 1);
      this.rows.push(mk(a[0] == null ? '' : String(a[0]), val(a[1])));
    }
  }
};
</script>
