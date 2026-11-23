<!-- ================= FORENSISCHE MATCHKANS =================
     Genotypefrequentie per locus (NRC II 4.1) en de productregel, ongewijzigd uit calc.rmp
     overgenomen. Deze tabel heeft een uitkomstkolom tussen de invoervelden in (de
     genotypefrequentie per rij), dus hij is geen <lk-etable> maar staat hier zelf; de haken op
     TBLDEF['rm-tbl'] zijn dezelfde die lk-etable zet (set/push/get/blank/inputCols), zodat
     tblRestore(), addRow() en plakken uit Excel blijven werken.

     De id's rm-th, rm-tbl, rm-add en rm-out blijven zoals ze waren. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <div class="f">
          <label for="rm-th">{{ t('θ (subpopulatiecorrectie)') }}</label>
          <select id="rm-th" style="width:100%" v-model="th">
            <option value="0">{{ t('0 (geen)') }}</option>
            <option value="0.01">{{ lkNumIn('0,01') }}</option>
            <option value="0.03">{{ lkNumIn('0,03') }}</option>
          </select>
        </div>
      </div>
      <div class="tbl-wrap" style="margin-top:12px">
        <table id="rm-tbl" class="mini">
          <thead><tr>
            <th>{{ t('Locus') }}</th><th class="num">{{ t('Frequentie allel 1') }}</th>
            <th class="num">{{ t('Frequentie allel 2') }}</th><th class="num">{{ t('Genotypefrequentie') }}</th><th></th>
          </tr></thead>
          <tbody>
            <tr v-for="(r, i) in rows" :key="i">
              <td><input class="txt" data-n :value="r[0]" style="width:110px" @input="setCell(i, 0, $event.target.value)"></td>
              <td><input inputmode="decimal" data-p :value="r[1]" style="text-align:right;width:80px" @input="setCell(i, 1, $event.target.value)"></td>
              <td><input inputmode="decimal" data-q :value="r[2]" style="text-align:right;width:80px" @input="setCell(i, 2, $event.target.value)"></td>
              <td class="num" data-g v-html="m.cells[i]"></td>
              <td><button type="button" class="ghost" data-del :aria-label="t('Verwijder')" @click="delRow(i)">✕</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="row" style="margin-top:10px">
        <button type="button" id="rm-add" @click="addRow">{{ t('+ Locus') }}</button>
      </div>
      <allele-freq :fill="fillFreq"/>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Voor "Vul frequenties in": zet de allelen na de locusnaam, gescheiden door een spatie (één allel = homozygoot).') }}</p>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Homozygoot: laat allel 2 leeg. Gebruik allelfrequenties uit de populatiedatabase van je opdracht; de voorbeeldfrequenties zijn verzonnen.') }}</p>
    </div>
    <div class="result" id="rm-out">
      <lk-note v-if="!m.n" kind="info">{{ t('Vul per locus de allelfrequenties in (tussen 0 en 1).') }}</lk-note>
      <template v-else>
        <lk-big :label="t('Gecombineerde matchkans (' + m.n + ' loci)')" :html="tHtml('1 op ' + sci(1 / m.prod, 3))"/>
        <lk-kv :rows="kvRows"/>
        <lk-note v-if="m.bad.length" kind="bad" :html="badText"/>
        <lk-note kind="info">{{ t('De productregel veronderstelt onafhankelijke loci en een populatie in Hardy-Weinberg-evenwicht. Geldt niet voor mengprofielen of verwanten.') }}</lk-note>
        <lk-formula :html="t('heterozygoot 2pq · homozygoot p² + p(1 − p)θ · matchkans = product over de loci')"/>
      </template>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';
import AlleleFreq from './AlleleFreq.vue';
import {afAllele, afLookup} from '../lib/afreq.js';

const S = (x, d) => lkNumIn(sci(x, d)), G = (x, d) => lkNumIn(sig(x, d));
/* een waarde van buiten (tblRestore, addRow, een test) is een getal of een string met een
   punt; in de tabel staat hij met een komma, net als bij inp() in de oude versie */
const dec = v => (v == null || v === '' || (typeof v === 'number' && !isFinite(v)) ? '' : lkNumIn(String(v).replace('.', ',')));
const norm = r => [r[0] == null ? '' : String(r[0]), dec(r[1]), dec(r[2])];

export default {
  name: 'Rmp',
  components: {AlleleFreq},
  data() {
    return {th: '0.01',
      rows: [['D3S1358 15 16', 0.25, 0.15], ['vWA 16 17', 0.10, 0.20], ['FGA 21', 0.18, ''], ['TH01 6 9.3', 0.22, 0.31]].map(norm)};
  },
  computed: {
    /* het rekenwerk van calc.rmp, per rij een cel voor de genotypefrequentie */
    m() {
      const th = num(this.th) || 0, bad = [], cells = [];
      let prod = 1, n = 0;
      this.rows.forEach((r, i) => {
        const p = num(r[1]), qr = String(r[2] || '').trim(), q = num(qr), nm = r[0] || 'locus';
        if (!isFinite(p)) { cells[i] = '–'; return; }
        if (!(p > 0 && p <= 1) || (qr !== '' && !(q > 0 && q <= 1)) || (qr !== '' && p + q > 1 + 1e-9)) {
          cells[i] = `<span class="chip bad">${esc(this.t('ongeldig'))}</span>`; bad.push(nm); return;
        }
        const hom = qr === '' || !isFinite(q), g = hom ? p * p + p * (1 - p) * th : 2 * p * q;
        cells[i] = `${G(g, 3)} <span style="color:var(--muted);font-size:12px">${esc(this.t(hom ? 'hom.' : 'het.'))}</span>`;
        prod *= g; n++;
      });
      return {th, prod, n, bad, cells};
    },
    kvRows() {
      const t = this.t, {prod, th} = this.m;
      return [[t('Matchkans'), S(prod, 3)], [t('Bewijskracht LR (enkelvoudig profiel)'), S(1 / prod, 3)],
        ['θ', lkNumIn(fmt(th, 2))]];
    },
    badText() {
      return this.tHtml(`Ongeldige frequenties bij: ${ud(this.m.bad.join(', '))}. Een frequentie ligt tussen 0 en 1 en twee allelen samen zijn hooguit 1.`);
    }
  },
  mounted() {
    if (typeof TBLDEF === 'undefined') return;
    TBLDEF['rm-tbl'] = {row: () => '', num: [1, 2],
      set: rows => { this.rows = (rows || []).map(norm); },
      push: r => {
        const next = this.rows.filter(x => x.some(v => String(v).trim()));
        this.rows = [...next, norm(r)];
      },
      get: () => this.rows.map(r => r.slice()), blank: () => ['', '', ''], inputCols: [0, 1, 2]};
  },
  methods: {
    lkNumIn,
    sci(x, d) { return sci(x, d); },
    setCell(i, j, v) { const next = this.rows.map(r => r.slice()); next[i][j] = v; this.rows = next; },
    delRow(i) { this.rows = this.rows.filter((_, k) => k !== i); },
    /* de locuscel mag na de naam de allelen bevatten ("vWA 16 17"); één allel = homozygoot */
    fillFreq(map) {
      const miss = [], next = this.rows.map(r => r.slice());
      next.forEach(r => {
        const [l, ...al] = String(r[0]).trim().split(/\s+/), A = al.map(afAllele);
        if (!l || !A.length) { if (l) miss.push(l + ' (' + this.t('allelen ontbreken') + ')'); return; }
        const f = A.map(a => afLookup(map, l, a));
        A.forEach((a, i) => { if (f[i] == null) miss.push(l + ' ' + a); });
        if (f.some(x => x == null)) return;
        r[1] = lkNumIn(String(f[0]).replace('.', ','));
        r[2] = A.length > 1 ? lkNumIn(String(f[1]).replace('.', ',')) : '';
      });
      this.rows = next;
      return miss;
    },
    addRow() { this.rows = [...this.rows, ['', '', '']]; }
  }
};
</script>
