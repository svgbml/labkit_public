<!-- ================= OPLOSSING & BUFFER =================
     De eerste omgezette tool met een bewerkbare tabel. De tabel houdt de id's en de
     `data-k`-attributen van de oude versie aan, want er hangt veel aan:

     - tblSnap() leest de invoervelden per rij uit om de sessie te bewaren;
     - tblRestore() en addRow() zetten rijen terug of voegen er een toe — die gaan nu via de
       set()- en push()-haken op TBLDEF (zie web/index.html);
     - bufImg() leest de tabel uit om het stappenschema op het canvas te tekenen;
     - het plakken van een blok uit Excel zet de waarden van de invoervelden rechtstreeks en
       stuurt per cel een input-event, waar v-model op reageert.

     Het stappenschema met het canvas blijft gewone HTML buiten deze component: dat tekent
     bufImg(), en Vue heeft er niets toe te voegen. -->
<template>
  <div>
    <div class="row" style="justify-content:space-between">
      <div class="row">
        <div class="f">
          <label for="o-v">{{ t('Eindvolume') }}</label>
          <div class="inu">
            <input id="o-v" inputmode="decimal" v-model="v" style="width:110px">
            <select id="o-vu" v-model="vu"><option>mL</option><option>L</option></select>
          </div>
        </div>
        <div class="f">
          <label for="o-preset">{{ t('Recept laden') }}</label>
          <select id="o-preset" v-model="preset">
            <option value="">{{ t('Kies een recept') }}</option>
            <option v-for="k in recipeKeys" :key="k" :value="k">{{ t(recipeName(k)) }}</option>
          </select>
        </div>
      </div>
      <div class="row" style="margin-top:8px;gap:6px;align-items:center">
        <span style="font-size:12.5px;color:var(--muted)">{{ t('Snel een volume:') }}</span>
        <button v-for="q in quick" :key="q.v + q.u" type="button" :data-ovol="q.v" :data-ovu="q.u"
                @click="setVol(q.v, q.u)">{{ q.v }} {{ q.u }}</button>
      </div>
      <button id="o-add" type="button" style="margin-top:8px" @click="addRow">{{ t('+ Component') }}</button>
    </div>

    <div class="tbl-wrap" style="margin-top:14px">
      <table id="o-tbl">
        <thead><tr>
          <th :title="t('Vink af wat je hebt afgewogen')">{{ t('Af') }}</th>
          <th>{{ t('Component') }}</th>
          <th class="num">{{ t('Molmassa (g/mol)') }}</th>
          <th class="num">{{ t('Concentratie') }}</th>
          <th>{{ t('Eenheid') }}</th>
          <th>{{ t('Vorm (hydraat)') }}</th>
          <th class="num">{{ t('Afwegen') }}</th>
          <th></th>
        </tr></thead>
        <tbody>
          <tr v-for="(r, i) in rows" :key="i" class="recipe-row" :class="{oweg: r.done}">
            <td class="o-tick"><input type="checkbox" data-k="done" v-model="r.done" :aria-label="t('Afgewogen')"></td>
            <td><input class="txt" list="chem-list" data-k="n" v-model="r.n" :placeholder="t('naam')" @input="onName(r)"></td>
            <td><input data-k="mw" inputmode="decimal" v-model="r.mw" style="text-align:right"></td>
            <td><input data-k="c" inputmode="decimal" v-model="r.c" style="text-align:right"></td>
            <td><select data-k="u" v-model="r.u" :aria-label="t('Eenheid')"><option v-for="u in units" :key="u">{{ u }}</option></select></td>
            <td>
              <select data-k="h" :data-g="hyd(r) ? hyd(r)[0] : ''" :aria-label="t('Vorm (hydraat)')"
                      :disabled="!hyd(r)" :value="hyd(r) ? String(hyd(r)[1]) : ''"
                      @change="onHyd(r, $event)" @input="onHyd(r, $event)">
                <option v-if="!hyd(r)" value="">–</option>
                <option v-for="(form, fi) in hydForms(r)" :key="fi" :value="String(fi)">{{ t(form[0]) }}</option>
              </select>
            </td>
            <td class="num" data-k="out" v-html="outCell(r)"></td>
            <td><button type="button" class="ghost" data-del :aria-label="t('Verwijder rij')" @click="delRow(i)">✕</button></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="row" style="margin-top:10px;gap:10px;align-items:center">
      <span id="o-prog" style="font-size:13px;color:var(--muted)">{{ warn || progress }}</span>
      <button type="button" id="o-untick" @click="untick">{{ t('Vinkjes wissen') }}</button>
      <button type="button" class="primary" id="o-card" @click="card">{{ t('Receptkaart afdrukken') }}</button>
    </div>

    <lk-steps :steps="steps" id="o-steps"/>
    <div id="o-advice">
      <lk-note v-if="sterility" kind="info"><span v-html="sterility"></span></lk-note>
      <lk-note v-if="tooSmall" kind="warn"><span v-html="tooSmall"></span></lk-note>
      <lk-note v-if="order" kind="info"><span v-html="order"></span></lk-note>
    </div>
    <p class="src" id="o-src-rec" data-notr="" style="margin:8px 0 0" v-html="recipeSource"></p>
    <lk-formula :html="tHtml('massa (g) = c (mol/L) × V (L) × M (g/mol) · % w/v: g = % / 100 × V (mL)')"/>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const UNITS = ['M', 'mM', 'µM', '% w/v', 'g/L'];
const QUICK = [{v: '50', u: 'mL'}, {v: '100', u: 'mL'}, {v: '250', u: 'mL'},
  {v: '500', u: 'mL'}, {v: '1', u: 'L'}, {v: '2', u: 'L'}];
const dec = x => (isFinite(x) ? String(x).replace('.', ',') : '');

export default {
  name: 'Oplossing',
  data() { return {v: lkNumIn('1'), vu: 'L', preset: 'trisnacl', rows: [], warn: ''}; },
  created() { this.loadPreset('trisnacl'); },
  computed: {
    units() { return UNITS; },
    quick() { return QUICK; },
    recipeKeys() { return typeof RECKEYS !== 'undefined' ? RECKEYS : []; },
    /* het eindvolume in liters; zonder volume valt er niets af te wegen */
    liters() { return num(this.v) * (this.vu === 'L' ? 1 : 1e-3); },
    masses() {
      const V = this.liters;
      return this.rows.map(r => {
        const mw = num(r.mw), c = num(r.c), u = r.u;
        if (!(V > 0)) return NaN;
        if (u === '% w/v') return c / 100 * V * 1000;
        if (u === 'g/L') return c * V;
        const M = u === 'M' ? c : u === 'mM' ? c / 1e3 : c / 1e6;
        return M * V * mw;
      });
    },
    /* EDTA als vrij zuur lost pas op rond pH 8 */
    freeAcid() {
      return this.rows.some(r => { const f = hydFind(r.n); return f && HYD[f[0]][0] === 'EDTA' && f[1] === 1; });
    },
    filled() { return this.rows.map((r, i) => i).filter(i => isFinite(this.masses[i])); },
    vtxt() { return this.vu === 'L' ? lkNumIn(fmt(num(this.v), 3)) + ' L' : lkNumIn(fmt(num(this.v), 1)) + ' mL'; },
    steps() {
      const t = this.t;
      if (!this.filled.length) return [];
      const list = this.filled.map(i => lkNumIn(mass(this.masses[i])) + ' '
        + esc(trPlain(this.rows[i].n || 'component', true))).join(', ');
      const ph = (typeof PH !== 'undefined' && PH[this.preset]) || '';
      return [t('Los op in ca. 80% van het eindvolume gedemineraliseerd water:')
          + ' <span data-notr="">' + list + '</span>.',
        ph ? t(ph) : '',
        /* het volume is een getal met zijn eenheid, dus de sleutel wordt
           "Vul aan tot {#} L …" en "… {#} mL …": precies de twee sleutels die er al zijn */
        t('Vul aan tot ' + this.vtxt + ' in een maatkolf of maatcilinder en meng.'),
        this.freeAcid ? t('EDTA als vrij zuur lost pas op rond pH 8: voeg NaOH toe tot het helder is.') : ''
      ].filter(Boolean);
    },
    recipeSource() {
      const src = (typeof RECSRC !== 'undefined' && RECSRC[this.preset]) || '';
      return src ? '<b>' + esc(trPlain('Bron van dit recept')) + '</b> ' + esc(trPlain(src, true)) : '';
    },
    progress() {
      const n = this.filled.length;
      if (!n) return '';
      const done = this.rows.filter(r => r.done).length;
      return this.t(done + ' van de ' + n + ' componenten afgewogen.');
    },
    sterility() {
      const s = (typeof RECSTER !== 'undefined' && RECSTER[this.preset]) || '';
      return s ? '<b>' + esc(this.t('Steriliteit')) + '</b> ' + ud(this.t(s)) : '';
    },
    /* per component welke balans erbij hoort; zie oBalance() in tools/nt/05_oplos.js */
    bands() { return this.rows.map((r, i) => ({n: r.n || '', b: oBalance(this.masses[i])})); },
    tooSmall() {
      const names = this.bands.filter(x => x.n && x.b && x.b.k === 'bad').map(x => x.n);
      if (!names.length) return '';
      return '<b>' + esc(this.t('Te klein om af te wegen')) + '</b> ' + ud(names.join(', '))
        + esc(this.t(': maak hiervan een stockoplossing en pipetteer die, anders bepaalt de balans je onzekerheid.'));
    },
    order() {
      const names = this.bands.filter(x => x.n && x.b && x.b.k === 'warn').map(x => x.n);
      if (!names.length) return '';
      return '<b>' + esc(this.t('Weegorde')) + '</b> ' + esc(this.t('Weeg eerst ')) + ud(names.join(', '))
        + esc(this.t(' op de analytische balans en daarna de grote hoeveelheden op de precisiebalans, in hetzelfde vat.'));
    }
  },
  methods: {
    recipeName(k) { return (typeof RECNAME !== 'undefined' && RECNAME[k]) || k; },
    hyd(r) { return hydFind(r.n); },
    hydForms(r) { const f = hydFind(r.n); return f ? HYD[f[0]][1] : []; },
    /* een bekende stof vult zijn molmassa zelf in */
    onName(r) { const mw = CHEM[r.n]; if (mw) r.mw = dec(mw); },
    /* een andere hydraatvorm kiezen zet de naam en de molmassa van die vorm */
    onHyd(r, e) {
      const f = hydFind(r.n); if (!f || e.target.value === '') return;
      const v = HYD[f[0]][1][+e.target.value];
      if (v) { r.n = v[1]; r.mw = dec(v[2]); }
    },
    outCell(r) {
      const i = this.rows.indexOf(r), g = this.masses[i];
      if (!isFinite(g)) return '–';
      const b = oBalance(g);
      return '<b>' + lkNumIn(mass(g)) + '</b>'
        + (b ? '<br><small class="obal ' + b.k + '">' + esc(this.t(b.t)) + '</small>' : '');
    },
    blank() { return {n: '', mw: '', c: '', u: 'mM', done: false}; },
    addRow() { this.rows.push(this.blank()); },
    delRow(i) { this.rows.splice(i, 1); },
    untick() { this.rows.forEach(r => { r.done = false; }); },
    setVol(v, u) { this.v = lkNumIn(v); this.vu = u; this.untick(); },
    loadPreset(k) {
      const R = typeof RECIPES !== 'undefined' ? RECIPES[k] : null;
      if (!R) return;
      this.rows = R.map(([n, mw, c, u]) => ({n, mw: dec(mw), c: dec(c), u, done: false}));
      if (typeof recipeKey !== 'undefined') recipeKey = k;   /* bufImg() leest PH[recipeKey] */
    },
    /* --- haken voor de rest van de app --- */
    setRows(vals) {
      this.rows = vals.map(a => ({n: a[0] || '', mw: dec(num(a[1])), c: dec(num(a[2])),
        u: a[3] || 'mM', done: false}));
    },
    pushRow(a) {
      const empty = this.rows.findIndex(r => !r.n && !r.mw && !r.c);
      if (empty >= 0) this.rows.splice(empty, 1);
      this.rows.push({n: a[0] || '', mw: dec(num(a[1])), c: isFinite(num(a[2])) ? dec(num(a[2])) : '',
        u: a[3] || 'mM', done: false});
    },
    /* ---------- de receptkaart afdrukken (S38) ----------
       Een blad om naast de balans te leggen: per component een hokje om af te vinken, de
       hoeveelheid om af te wegen, de werkwijze en een regel om te ondertekenen. De stappen
       staan al vertaald in this.steps, dus die worden overgenomen. */
    card() {
      const T = x => esc(trPlain(x));
      const rows = this.filled.map(i => ({n: this.rows[i].n, c: this.rows[i].c,
        u: this.rows[i].u, out: lkNumIn(mass(this.masses[i]))}));
      if (!rows.length) { this.warn = this.t('Vul eerst een recept en een volume in.'); return; }
      this.warn = '';
      const title = ($('#o-btitle') && $('#o-btitle').value) || trPlain('Receptkaart');
      const src = this.recipeSource ? $('#o-src-rec').textContent.trim() : '';
      rpPrint('<!doctype html><meta charset="utf-8"><title>' + esc(title) + '</title><style>'
        + '@page{size:A4;margin:16mm}body{margin:0;font:13px system-ui,sans-serif;color:#1f2933}'
        + 'h1{font-size:20px;margin:0 0 2px}h2{font-size:14px;margin:16px 0 6px}'
        + '.meta{margin:0 0 12px;color:#5f6b7a;font-size:12px}'
        + 'table{border-collapse:collapse;width:100%;font-size:13px}'
        + 'th,td{border:1px solid #c9ced6;padding:5px 8px;text-align:left}'
        + 'th{background:#eef0f3}td.n{text-align:right;white-space:nowrap}'
        + 'td.box,th.box{width:24px;text-align:center}td.box span{display:inline-block;width:12px;height:12px;border:1.4px solid #1f2933}'
        + 'ol{margin:0;padding-left:20px}li{margin:0 0 3px}'
        + '.src{margin:14px 0 0;font-size:11px;color:#5f6b7a}'
        + '.sign{margin-top:18px;font-size:12px;color:#5f6b7a}'
        + '</style><h1>' + esc(title) + '</h1>'
        + '<p class="meta">' + T('Eindvolume') + ': <b>' + esc(this.vtxt) + '</b></p>'
        + '<table><thead><tr><th class="box"></th><th>' + T('Component') + '</th><th>'
        + T('Concentratie') + '</th><th>' + T('Afwegen') + '</th></tr></thead><tbody>'
        + rows.map(r => '<tr><td class="box"><span></span></td><td>' + esc(trPlain(r.n, true))
          + '</td><td>' + esc(lkNumIn(r.c)) + ' ' + esc(trPlain(r.u, true))
          + '</td><td class="n"><b>' + esc(r.out) + '</b></td></tr>').join('')
        + '</tbody></table>'
        + (this.steps.length ? '<h2>' + T('Werkwijze') + '</h2><ol>'
          + this.steps.map(h => '<li>' + h + '</li>').join('') + '</ol>' : '')
        + (src ? '<p class="src">' + esc(src) + '</p>' : '')
        + '<p class="sign">' + T('Bereid door') + ': ________________ &nbsp; ' + T('Datum')
        + ': ________________ &nbsp; ' + T('Houdbaar tot') + ': ________________</p>');
    },
    /* het stappenschema op het canvas tekent bufImg(), die de tabel uitleest; na elke render
       dus opnieuw, net als bij de andere tool met een tekening */
    redraw() { if (typeof bufImg === 'function') { try { bufImg(); } catch (e) {} } }
  },
  watch: {
    preset(k) { if (k) { this.loadPreset(k); this.untick(); } }
  },
  mounted() {
    this.redraw();
    matRegister('oplossing', () => {
      if (!this.filled.length) return [];
      const L = this.filled.map(i => [this.rows[i].n || trPlain('component', true), lkNumIn(mass(this.masses[i]))]);
      return [...L, [trPlain('Gedemineraliseerd water tot'), this.vtxt], [trPlain('Maatcilinder of maatkolf'), this.vtxt]];
    });
  },
  updated() { this.redraw(); }
};
</script>
