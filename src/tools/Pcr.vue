<!-- ================= PCR-MASTERMIX =================
     Volumes per reactie en voor de hele mix. De tabel is een eigen <table> in plaats van
     <lk-etable>: elke rij heeft naast de invoer twee berekende kolommen (per reactie en mix)
     en de tabel heeft een voet met water, het totaal en de template. Daar past de kolomopgave
     van lk-etable niet op. De haken op TBLDEF['q-tbl'] (set, push, get, blank, inputCols) staan
     in web/index.html en wijzen naar window.__pcrVm, net als bij Oplossing & buffer.

     De rekenregels zijn die van de oude calc.pcr(), ongewijzigd. De buizenrek (qRack) blijft in
     web/index.html staan: die tekent op #qr-cv, buiten deze component, en draw() roept hem aan.
     De id's q-n, q-ctrl, q-extra, q-v, q-t, q-preset, q-tbl, q-add, q-copy, q-csv, q-copied en
     q-msg blijven zoals ze waren, en de cellen houden hun data-k. -->
<template>
  <div class="panel">
    <div class="row" style="justify-content:space-between">
      <!-- geen inline flex:1 : dan geldt .row>.fields{flex:1 1 280px} uit de opmaak, zodat het
           veldblok op een smal scherm onder de receptkeuze springt in plaats van samen te vallen
           (de Engelse receptnamen zijn breder dan de Nederlandse) -->
      <div class="fields" style="max-width:760px">
        <lk-field v-model="ns" :label="t('Monsters')" for-id="q-n" inputmode="numeric"/>
        <lk-field v-model="nc" :label="t('Controles (NTC, positief)')" for-id="q-ctrl" inputmode="numeric"/>
        <lk-field data-expert="" v-model="extra" :label="t('Extra marge')" for-id="q-extra" unit="%"/>
        <lk-overage data-expert="" v-model="ov" for-id="q-ov" :why="m.why"/>
        <lk-field v-model="rv" :label="t('Reactievolume')" for-id="q-v" unit="µL"/>
        <lk-field v-model="tv" :label="t('Template per reactie')" for-id="q-t" unit="µL"/>
      </div>
      <div class="f">
        <label for="q-preset">{{ t('Recept') }}</label>
        <select id="q-preset" :value="preset" @change="onPreset($event.target.value)">
          <option v-for="p in presets" :key="p.v" :value="p.v">{{ t(p.n) }}</option>
        </select>
      </div>
    </div>
    <div class="tbl-wrap" style="margin-top:14px">
      <table id="q-tbl">
        <thead><tr>
          <th>{{ t('Component') }}</th><th class="num">{{ t('Stock') }}</th><th class="num">{{ t('Eind') }}</th>
          <th>{{ t('Eenheid') }}</th><th class="num">{{ t('Per reactie') }}</th><th class="num">{{ t('Mix') }}</th><th></th>
        </tr></thead>
        <tbody>
          <tr v-for="(r, i) in lines" :key="r.row.k">
            <td><input class="txt" data-k="n" v-model="r.row.n"></td>
            <td><input data-k="s" inputmode="decimal" v-model="r.row.s" style="text-align:right;width:80px"></td>
            <td :title="r.title"><input data-k="f" inputmode="decimal" v-model="r.row.f" style="text-align:right;width:80px"></td>
            <td><select data-k="u" v-model="r.row.u"><option v-for="u in units" :key="u">{{ u }}</option></select></td>
            <td class="num" data-k="pr">{{ r.pr }}</td>
            <td class="num" data-k="mx"><b v-if="r.mx">{{ r.mx }}</b><template v-else>–</template></td>
            <td><button type="button" class="ghost" data-del :aria-label="t('Verwijder rij')" @click="del(i)">✕</button></td>
          </tr>
        </tbody>
        <tfoot>
          <tr><td>{{ t('Nucleasevrij water') }}</td><td></td><td></td><td></td>
            <td class="num">{{ m.waterTxt }}</td><td class="num"><b>{{ m.waterMix }}</b></td><td></td></tr>
          <tr><td><b>{{ t('Mix totaal') }}</b></td><td></td><td></td><td></td>
            <td class="num">{{ m.totTxt }}</td><td class="num"><b>{{ m.totMix }}</b></td><td></td></tr>
          <tr class="dim"><td>{{ t('Template (apart per buis)') }}</td><td></td><td></td><td></td>
            <td class="num">{{ m.tTxt }}</td><td class="num">{{ m.tMix }}</td><td></td></tr>
        </tfoot>
      </table>
    </div>
    <div class="row" style="margin-top:10px">
      <button type="button" id="q-add" @click="addRow">{{ t('+ Component') }}</button>
      <button type="button" id="q-copy" @click="copy">{{ t('Kopieer tabel') }}</button>
      <button type="button" id="q-csv" class="dl-only" style="display:none" @click="csv">{{ t('Download CSV') }}</button>
      <span id="q-copied" style="font-size:13px;color:var(--muted)">{{ copied }}</span>
    </div>
    <div id="q-msg">
      <lk-note v-if="m.water < 0" kind="bad">{{ t('De componenten passen niet in ' + vol(m.V) + ': ' + vol(-m.water) + ' te veel. Verlaag het templatevolume of gebruik geconcentreerdere stocks.') }}</lk-note>
      <lk-note kind="info">{{ t(mixTxt) }} {{ t('Verdeel ' + uv(lkNumIn(vol(m.V - m.T))) + ' mix per buis en voeg ' + uv(lkNumIn(vol(m.T))) + ' template toe; NTC krijgt ' + uv(lkNumIn(vol(m.T))) + ' water. Polymerase als laatste toevoegen, alles op ijs.') }}</lk-note>
    </div>
    <lk-formula :html="formula"/>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';
import {overage} from '../lib/overage.js';

const dec = x => (isFinite(x) ? lkNumIn(String(x).replace('.', ',')) : '');

/* [naam, stock, eind, eenheid]; de namen staan in het Nederlands, de weergave vertaalt ze */
const QPRE = {
  taq: [['10X reactiebuffer', 10, 1, 'X'], ['dNTP-mix', 10, 0.2, 'mM'], ['Primer F', 10, 0.2, 'µM'],
    ['Primer R', 10, 0.2, 'µM'], ['Taq-polymerase', 5, 1.25, 'U/50 µL']],
  taqmg: [['10X buffer (Mg-vrij)', 10, 1, 'X'], ['MgCl₂', 25, 1.5, 'mM'], ['dNTP-mix', 10, 0.2, 'mM'],
    ['Primer F', 10, 0.2, 'µM'], ['Primer R', 10, 0.2, 'µM'], ['Taq-polymerase', 5, 1.25, 'U/50 µL']],
  mm2x: [['2X mastermix', 2, 1, 'X'], ['Primer F', 10, 0.2, 'µM'], ['Primer R', 10, 0.2, 'µM']]
};
const PRESETS = [{v: 'taq', n: 'Taq, losse componenten'}, {v: 'taqmg', n: 'Taq, Mg-vrije buffer + MgCl₂'},
  {v: 'mm2x', n: '2X kant-en-klare mastermix'}];
const UNITS = ['X', 'mM', 'µM', 'U/50 µL', 'µL'];

let seq = 0;
const mk = (n, s, f, u) => ({k: ++seq, n, s, f, u});
/* waarden die van buiten komen (preset, delen, plakken): een getal of tekst met punt of komma */
const val = x => (x == null || x === '' || (typeof x === 'number' && !isFinite(x)) ? '' : String(x).replace('.', ','));

export default {
  name: 'Pcr',
  data() {
    /* de invoer onthouden: de app zet de bewaarde waarden terug vóórdat deze component de
       velden rendert, dus lees ze hier zelf uit de opslag */
    const st = typeof storeGet === 'function' ? storeGet() : {};
    const g = (id, d) => (st[id] != null ? String(st[id]) : d);
    return {
      ns: g('q-n', lkNumIn('8')), nc: g('q-ctrl', lkNumIn('2')), extra: g('q-extra', lkNumIn('10')), ov: g('q-ov', 'pct'),
      rv: g('q-v', lkNumIn('25')), tv: g('q-t', lkNumIn('2')),
      preset: 'taq', rows: [], copied: ''
    };
  },
  created() { this.loadPreset('taq'); },
  computed: {
    presets() { return PRESETS; },
    units() { return UNITS; },
    formula() {
      return this.tHtml('volume = eindconc / stockconc × reactievolume · enzym: (U per 50 µL × volume/50) / (U/µL) · water vult aan tot reactievolume');
    },
    mixTxt() {
      const m = this.m, N = fmt(m.N, 1);
      return this.ov === 'plus1' ? 'Mix voor ' + N + ' reacties (' + m.n + ' buizen + 1 reactie).'
        : this.ov === 'none' ? 'Mix voor ' + N + ' reacties (' + m.n + ' buizen, geen overmaat).'
          : 'Mix voor ' + N + ' reacties (' + m.n + ' buizen + ' + fmt(m.extra, 0) + '%).';
    },
    /* het rekenwerk van de oude calc.pcr(), één keer */
    m() {
      const n = (num(this.ns) || 0) + (num(this.nc) || 0), extra = num(this.extra) || 0;
      const V = num(this.rv), T = num(this.tv) || 0, {mult: N, why} = overage(n, this.ov, extra);
      let sum = 0;
      const per = [];
      this.rows.forEach(r => {
        const s = num(r.s), f = num(r.f), u = r.u;
        let pr = NaN;
        if (u === 'µL') pr = f; else if (u === 'U/50 µL') pr = f * (V / 50) / s; else pr = f / s * V;
        if (isFinite(pr)) sum += pr;
        per.push(pr);
      });
      const water = V - sum - T;
      return {n, extra, why, V, T, N, per, water, sum,
        waterTxt: vol(water), waterMix: vol(water * N), totTxt: vol(V - T), totMix: vol((V - T) * N),
        tTxt: vol(T), tMix: vol(T * n)};
    },
    lines() {
      const {per, N} = this.m, t = this.t;
      return this.rows.map((row, i) => {
        const pr = per[i], ok = isFinite(pr);
        return {row, pr: ok ? vol(pr) : '–', mx: ok ? vol(pr * N) : '',
          title: row.u === 'U/50 µL' ? t('Units per 50 µL reactie (schaalt mee met het reactievolume)')
            : row.u === 'µL' ? t('µL per reactie') : ''};
      });
    },
    /* de tekst voor Kopieer tabel en Download CSV */
    qText() {
      const {per, N, water, V, T} = this.m;
      const lines = [];
      this.rows.forEach((r, i) => { if (isFinite(per[i])) lines.push([r.n, per[i]]); });
      return ['Component\tPer reactie (µL)\tMix (µL)',
        ...lines.map(([nm, pr]) => `${nm}\t${fmt(pr, 3)}\t${fmt(pr * N, 2)}`),
        `Water\t${fmt(water, 3)}\t${fmt(water * N, 2)}`,
        `Mix totaal\t${fmt(V - T, 3)}\t${fmt((V - T) * N, 2)}`,
        `Template (apart)\t${fmt(T, 3)}\t`].join('\n');
    }
  },
  mounted() {
    this.draw();
    matRegister('pcr', () => {
      const {per, N, water, n} = this.m;
      const L = [];
      this.rows.forEach((r, i) => { if (isFinite(per[i])) L.push([r.n, lkNumIn(vol(per[i] * N))]); });
      return [...L, [trPlain('Water'), lkNumIn(vol(water * N))], [trPlain('PCR-buisjes'), '× ' + fmt(n, 0)], [trPlain('Filtertips'), '']];
    });
    /* het CSV-knopje staat standaard verborgen en wordt door showDl() getoond; dat liep al
       vóórdat deze component de knop had gerenderd */
    if (typeof showDl === 'function' && typeof STANDALONE !== 'undefined' && STANDALONE) showDl();
  },
  updated() { this.draw(); },
  methods: {
    vol, fmt, lkNumIn,
    draw() {
      const m = this.m;
      if (typeof qRack === 'function') qRack(m.n, m.V, m.T, m.V - m.T);
    },
    loadPreset(k) {
      const P = QPRE[k];
      if (!P) return;
      this.preset = k;
      this.rows = P.map(([n, s, f, u]) => mk(trPlain(n, true), dec(s), dec(f), u));
    },
    onPreset(k) { this.loadPreset(k); },
    addRow() { this.rows.push(mk(trPlain('Component', true), '', '', 'µL')); },
    del(i) { this.rows.splice(i, 1); },
    /* --- haken voor de rest van de app (TBLDEF['q-tbl'] in web/index.html) --- */
    getRows() { return this.rows.map(r => [r.n, r.s, r.f, r.u]); },
    setRows(vals) {
      this.rows = vals.map(a => mk(a[0] == null ? '' : String(a[0]), val(a[1]), val(a[2]), a[3] || 'µL'));
    },
    pushRow(a) {
      const empty = this.rows.findIndex(r => !String(r.n).trim() && !String(r.s).trim() && !String(r.f).trim());
      if (empty >= 0) this.rows.splice(empty, 1);
      this.rows.push(mk(a[0] == null ? '' : String(a[0]), val(a[1]), val(a[2]), a[3] || 'µL'));
    },
    async copy() {
      try {
        await navigator.clipboard.writeText(i18nTSV(this.qText));
        this.copied = this.t('Gekopieerd.');
      } catch (e) { this.copied = this.t('Kopiëren geblokkeerd; selecteer de tabel handmatig.'); }
    },
    async csv() {
      try {
        await saveBlob('pcr-mastermix.csv', csvBlob(this.qText));
        this.copied = this.t('Opgeslagen.');
      } catch (err) {
        this.copied = err && err.code === 'declined' ? this.t('Download geannuleerd.') : this.t('Downloaden lukte niet hier.');
      }
    }
  }
};
</script>
