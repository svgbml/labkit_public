<!-- ================= PRIMERS OPLOSSEN =================
     Dezelfde berekening als de oude calc.oligo(), nu in een component. De tabel is een eigen
     <table> (elke rij heeft een berekende kolom met het volume buffer); TBLDEF['ol-tbl'] in
     web/index.html krijgt set/push/get/blank/inputCols en wijst naar window.__olVm. De id's
     ol-tbl, ol-add, ol-s, ol-w, ol-wv en ol-out en het kenmerk data-o blijven zoals ze waren.
     S42: een optionele kolom met de sequentie geeft per primer een kaart (lengte, GC, Tm,
     zelfdimeer, haarspeld) die je kunt afdrukken; de structuren rekent primerCheck.js uit. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="tbl-wrap"><table id="ol-tbl" class="mini">
        <thead><tr><th>{{ t('Primer') }}</th><th class="num">{{ t('Hoeveelheid (nmol)') }}</th><th class="num">{{ t('Buffer voor stock') }}</th><th>{{ t('Sequentie (5′→3′)') }}</th><th></th></tr></thead>
        <tbody>
          <tr v-for="(r, i) in lines" :key="r.row.k">
            <td><input class="txt" data-n v-model="r.row.n" style="width:140px"></td>
            <td><input data-a inputmode="decimal" v-model="r.row.a" style="text-align:right;width:90px"></td>
            <td class="num" data-o><b v-if="r.buf">{{ r.buf }}</b><template v-else>–</template></td>
            <td><input class="txt" data-q v-model="r.row.q" spellcheck="false" style="width:200px;font-family:var(--mono, monospace)"></td>
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
      <template v-if="cards.length">
        <div id="ol-cards">
          <div v-for="(c, i) in cards" :key="c.k" class="ol-card" :id="'ol-card-' + i">
            <h3>{{ c.name }}</h3>
            <p class="ol-seq">5′-{{ c.seq }}-3′</p>
            <lk-kv :rows="c.rows"/>
            <lk-note v-for="w in c.warn" :key="w" kind="warn">{{ t(w) }}</lk-note>
          </div>
        </div>
        <p style="font-size:12px;color:var(--muted);margin:8px 0">{{ t('Tm met nearest-neighbor (SantaLucia 1998) bij 50 mM Na⁺, 1,5 mM Mg²⁺, 0,8 mM dNTP en 0,2 µM primer.') }} {{ t('ΔG bij 37 °C; een waarschuwing vanaf −5 kcal/mol (3′-uiteinde) of −6 kcal/mol voor een dimeer, en vanaf −2 of −3 kcal/mol voor een haarspeld.') }}</p>
        <div class="row"><button type="button" id="ol-print" @click="print">{{ t('Primerkaart afdrukken') }}</button></div>
      </template>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';
import {dimer, hairpin, verdict} from './primerCheck.js';

/* vaste PCR-omstandigheden voor de Tm op de kaart (dezelfde als de validatie van PCR-cyclus) */
const ION = {na: 50, mg: 1.5, dntp: 0.8, pc: 0.2};

const F = (x, d) => lkNumIn(fmt(x, d));
const val = x => (x == null || x === '' || (typeof x === 'number' && !isFinite(x)) ? '' : String(x).replace('.', ','));

let seq = 0;
const mk = (n, a, q = '') => ({k: ++seq, n, a, q});
const DATA = [['Forward', 28.4, 'AGCTGACCTGAAGGCTCTGAAG'], ['Reverse', 31.9, 'TCGTCGTACTTGACCAGGCTAT']];

export default {
  name: 'Oligo',
  data() {
    const st = typeof storeGet === 'function' ? storeGet() : {};
    const g = (id, d) => (st[id] != null ? String(st[id]) : lkNumIn(d));
    return {
      s: g('ol-s', '100'), w: g('ol-w', '10'), wv: g('ol-wv', '100'),
      rows: DATA.map(r => mk(trPlain(r[0], true), lkNumIn(val(r[1])), r[2]))
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
    cards() {
      return this.lines.filter(l => String(l.row.q).trim()).map(({row, buf}) => {
        const p = primerInfo(row.q, ION);
        if (!p) return null;
        const d = dimer(p.seq, p.seq), h = hairpin(p.seq);
        const dg = x => (x ? F(x.dg, 2) + ' kcal/mol' + (x.three ? ' · 3′' : '') : this.t('geen'));
        const warn = [];
        if (p.other) warn.push('De sequentie bevat andere letters dan A, C, G en T; dimeren en haarspelden zijn niet berekend.');
        if (verdict(d, false) === 'warn') warn.push(d.three ? 'Zelfdimeer aan het 3′-uiteinde: de primer kan op zichzelf verlengen.' : 'Sterke zelfdimeer.');
        if (verdict(h, true) === 'warn') warn.push(h.three ? 'Haarspeld aan het 3′-uiteinde.' : 'Sterke haarspeld.');
        if (p.gcp < 40 || p.gcp > 60) warn.push('GC-gehalte buiten 40–60 %.');
        if (p.N < 18 || p.N > 30) warn.push('Lengte buiten 18–30 nt.');
        return {k: row.k, name: String(row.n).trim() || this.t('Primer'), seq: p.seq, warn, rows: [
          [this.t('Lengte'), p.N + ' nt'],
          [this.t('GC-gehalte'), F(p.gcp, 1) + ' %'],
          ['Tm', F(p.tm, 1) + ' °C'],
          [this.t('3′-GC-klem'), this.t(p.clamp ? 'ja' : 'nee')],
          [this.t('Zelfdimeer'), dg(d)],
          [this.t('Haarspeld'), dg(h)],
          buf ? [this.t('Buffer voor stock'), buf] : null]};
      }).filter(Boolean);
    },
    formula() {
      return this.tHtml('V<sub>stock</sub> (µL) = nmol / µM × 1000 · werkoplossing: V₁ = C₂V₂ / C₁');
    }
  },
  methods: {
    F,
    addRow() { this.rows.push(mk('', '')); },
    del(i) { this.rows.splice(i, 1); },
    /* de kaarten staan al vertaald op de pagina; die nemen we over (zoals de plaatkaart) */
    print() {
      const el = document.getElementById('ol-cards'); if (!el) return;
      rpPrint(`<!doctype html><meta charset="utf-8"><title>${esc(this.t('Primerkaart'))}</title><style>
        @page{size:A4;margin:12mm} body{margin:0;font:13px system-ui,sans-serif;color:#1f2933}
        h1{font-size:19px;margin:0 0 8px} h3{font-size:15px;margin:0 0 2px}
        .ol-card{border:1px solid #c9ced6;border-radius:6px;padding:8px 10px;margin:0 0 8px;break-inside:avoid}
        .ol-seq{font-family:monospace;margin:0 0 6px;word-break:break-all}
        dl{display:grid;grid-template-columns:auto 1fr;gap:2px 12px;margin:0} dt{color:#5f6b7a} dd{margin:0}
        .note{font-size:12px;margin:4px 0 0}
        </style><h1>${esc(this.t('Primerkaart'))}</h1>${el.innerHTML}`);
    },
    /* --- haken voor de rest van de app (TBLDEF['ol-tbl'] in web/index.html) --- */
    getRows() { return this.rows.map(r => [r.n, r.a, r.q]); },
    setRows(vals) { this.rows = vals.map(a => mk(a[0] == null ? '' : String(a[0]), val(a[1]), a[2] == null ? '' : String(a[2]))); },
    pushRow(a) {
      const empty = this.rows.findIndex(r => !String(r.n).trim() && !String(r.a).trim() && !String(r.q).trim());
      if (empty >= 0) this.rows.splice(empty, 1);
      this.rows.push(mk(a[0] == null ? '' : String(a[0]), val(a[1]), a[2] == null ? '' : String(a[2])));
    }
  }
};
</script>

