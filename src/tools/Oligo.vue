<!-- ================= PRIMERS OPLOSSEN =================
     Dezelfde berekening als de oude calc.oligo(), nu in een component. De tabel is een eigen
     <table> (elke rij heeft een berekende kolom met het volume buffer); TBLDEF['ol-tbl'] in
     web/index.html krijgt set/push/get/blank/inputCols en wijst naar window.__olVm. De id's
     ol-tbl, ol-add, ol-s, ol-w, ol-wv en ol-out en het kenmerk data-o blijven zoals ze waren. -->
<template>
  <div class="stack">
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
  <!-- primerkaart (S42): eigenschappen per sequentie, af te drukken -->
  <div class="grid2">
    <div class="panel">
      <h3 v-html="tHtml('Primerkaart <span class=&quot;example&quot;>voorbeeld</span>')"></h3>
      <div class="f"><label for="ol-seq">{{ t('Primers, één per regel: naam en sequentie (5′→3′)') }}</label>
        <textarea id="ol-seq" class="mono" rows="4" v-model="seqs" spellcheck="false"></textarea></div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0" v-html="tHtml('T<sub>m</sub> nearest-neighbor bij 50 mM Na⁺, 1,5 mM Mg²⁺, 0,8 mM dNTP en 0,2 µM primer (de standaard van PCR-cyclus). ΔG bij 37 °C van het sterkste perfect gepaarde stuk.')"></p>
      <div class="row" style="margin-top:10px"><button type="button" class="primary" id="ol-card" @click="card" :disabled="!cards.length">{{ t('Primerkaart afdrukken') }}</button></div>
    </div>
    <div class="result" id="ol-cardout">
      <template v-if="cards.length">
        <lk-table :cols="cardCols" :rows="cardRows"/>
        <lk-note v-for="(x, i) in cardNotes" :key="i" kind="warn">{{ x }}</lk-note>
        <lk-note v-if="!cardNotes.length" kind="ok">{{ t('Geen opvallende dimeren of haarspelden.') }}</lk-note>
        <lk-formula :html="tHtml('Grenzen: zelfdimeer ΔG &amp;lt; −5 (3′-eind) of −6 kcal/mol; haarspeld &amp;lt; −2 (3′-eind) of −3 kcal/mol')"/>
      </template>
      <lk-note v-else kind="info">{{ t('Plak een of meer primersequenties.') }}</lk-note>
    </div>
  </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';
import {parsePrimers, analyse, dimerBad, hairBad} from '../lib/primer.js';

const F = (x, d) => lkNumIn(fmt(x, d));
const val = x => (x == null || x === '' || (typeof x === 'number' && !isFinite(x)) ? '' : String(x).replace('.', ','));

let seq = 0;
const mk = (n, a) => ({k: ++seq, n, a});
const DATA = [['Forward', 28.4], ['Reverse', 31.9]];
/* de standaardomstandigheden van PCR-cyclus (y-na, y-mg, y-dntp, y-pc) */
const ION = {na: 50, mg: 1.5, dntp: 0.8, pc: 0.2};
const chip = (ok, html) => `<span class="chip ${ok ? 'ok' : 'warn'}">${html}</span>`;

export default {
  name: 'Oligo',
  data() {
    const st = typeof storeGet === 'function' ? storeGet() : {};
    const g = (id, d) => (st[id] != null ? String(st[id]) : lkNumIn(d));
    return {
      seqs: st['ol-seq'] != null ? String(st['ol-seq'])
        : trPlain('Forward', true) + '\tAGCTGACCTGAAGGCTCTGAAG\n' + trPlain('Reverse', true) + '\tTCGTCGTACTTGACCAGGCTAT',
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
    /* primerkaart: één keer analyseren, de tabel, de waarschuwingen en de afdruk lezen hieruit */
    cards() {
      return parsePrimers(this.seqs).slice(0, 50).map((p, i) =>
        analyse({...p, name: p.name || trPlain('Primer') + ' ' + (i + 1)}, ION));
    },
    cardCols() {
      return [{h: this.t('Primer')}, {h: this.t('Lengte'), num: true}, {h: this.t('GC'), num: true},
        {h: this.tHtml('T<sub>m</sub>'), num: true}, {h: this.t('Zelfdimeer'), num: true}, {h: this.t('Haarspeld'), num: true}];
    },
    cardRows() {
      const t = this.t, g = d => (d.dg < 0 ? F(d.dg, 2) + '&nbsp;kcal/mol' + (d.at3 ? ' (3′)' : '') : '–');
      return this.cards.map(c => [esc(c.name), chip(c.info.N >= 18 && c.info.N <= 30, t(c.info.N + ' nt')),
        chip(c.info.gcp >= 40 && c.info.gcp <= 60, F(c.info.gcp, 0) + '%'), F(c.info.tm, 1) + '&nbsp;°C',
        chip(!dimerBad(c.self), g(c.self)), chip(!hairBad(c.hair), g(c.hair))]);
    },
    /* elke waarschuwing is één zin met de primernaam als gebruikerswaarde */
    cardNotes() {
      const out = [], t = this.t;
      this.cards.forEach(c => {
        const n = uv(c.name);
        if (dimerBad(c.self)) out.push(t(c.self.at3 ? n + ' vormt een zelfdimeer aan het 3′-eind.' : n + ' vormt een sterk zelfdimeer.'));
        if (hairBad(c.hair)) out.push(t(c.hair.at3 ? n + ' vormt een haarspeld aan het 3′-eind.' : n + ' vormt een sterke haarspeld.'));
        if (!c.info.clamp) out.push(t(n + ' eindigt niet op G of C (geen GC-klem).'));
        if (/(A{5,}|C{5,}|G{5,}|T{5,})/.test(c.seq)) out.push(t(n + ' heeft een reeks van 5 of meer dezelfde basen.'));
      });
      return out;
    },
    formula() {
      return this.tHtml('V<sub>stock</sub> (µL) = nmol / µM × 1000 · werkoplossing: V₁ = C₂V₂ / C₁');
    }
  },
  methods: {
    F,
    addRow() { this.rows.push(mk('', '')); },
    del(i) { this.rows.splice(i, 1); },
    /* de primerkaart als A4: per primer de sequentie en de eigenschappen, plus de waarschuwingen */
    card() {
      const T = x => esc(trPlain(x)), g = d => (d.dg < 0 ? F(d.dg, 2) + (d.at3 ? ' (3′)' : '') : '–');
      rpPrint('<!doctype html><meta charset="utf-8"><title>' + T('Primerkaart') + '</title><style>'
        + '@page{size:A4;margin:16mm}body{margin:0;font:13px system-ui,sans-serif;color:#1f2933}'
        + 'h1{font-size:20px;margin:0 0 10px}table{border-collapse:collapse;width:100%;font-size:12px}'
        + 'th,td{border:1px solid #c9ced6;padding:5px 7px;text-align:left;vertical-align:top}'
        + 'th{background:#eef0f3}td.n{text-align:right;white-space:nowrap}.seq{font-family:ui-monospace,monospace;word-break:break-all}'
        + 'ul{margin:12px 0 0;padding-left:20px}.src{margin:14px 0 0;font-size:11px;color:#5f6b7a}</style>'
        + '<h1>' + T('Primerkaart') + '</h1><table><thead><tr><th>' + T('Primer') + '</th><th>' + T('Sequentie (5′→3′)')
        + '</th><th>' + T('Lengte') + '</th><th>GC</th><th>Tm (°C)</th><th>' + T('Zelfdimeer') + ' ΔG</th><th>'
        + T('Haarspeld') + ' ΔG</th></tr></thead><tbody>'
        + this.cards.map(c => '<tr><td>' + esc(c.name) + '</td><td class="seq">' + c.seq + '</td><td class="n">'
          + c.info.N + '</td><td class="n">' + F(c.info.gcp, 0) + '%</td><td class="n">' + F(c.info.tm, 1)
          + '</td><td class="n">' + g(c.self) + '</td><td class="n">' + g(c.hair) + '</td></tr>').join('')
        + '</tbody></table>' + (this.cardNotes.length ? '<ul>' + this.cardNotes.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '')
        + '<p class="src">' + T('ΔG in kcal/mol bij 37 °C (nearest-neighbor, SantaLucia 1998; haarspeldlus SantaLucia & Hicks 2004). Grenzen volgens Premier Biosoft.') + '</p>');
    },
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
