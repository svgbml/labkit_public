<!-- ================= VERWANTSCHAPSINDEX =================
     De vaderschapsindex per locus, de CPI en de kans op vaderschap staan hier ongewijzigd uit
     calc.kin overgenomen.

     De id's kn-mo, kn-pr, kn-tbl, kn-tbl-add en kn-out blijven zoals ze waren. -->
<template>
  <div class="stack">
    <div class="panel">
      <div class="fields">
        <div class="f">
          <label for="kn-mo">{{ t('Moeder getypeerd') }}</label>
          <select id="kn-mo" style="width:100%" v-model="mo">
            <option value="1">{{ t('ja (trio)') }}</option>
            <option value="0">{{ t('nee (duo)') }}</option>
          </select>
        </div>
        <lk-field v-model="pr" :label="t('A-priorikans')" for-id="kn-pr" unit="%"/>
      </div>
      <div class="tbl-wrap" style="margin-top:12px">
        <lk-etable table-id="kn-tbl" :cols="cols" v-model:rows="rows" add-id="kn-tbl-add" :wrap="false"/>
      </div>
      <div class="row" style="margin-top:8px">
        <button type="button" id="kn-tbl-add" @click="addRow">{{ t('+ Locus') }}</button>
      </div>
      <allele-freq :fill="fillFreq"/>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Per locus de allelen van kind, moeder en vermeende vader, plus de allelfrequenties van de twee allelen van het kind uit de populatiedatabase van je opdracht. Homozygoot: vul twee keer hetzelfde allel in. Voorbeelddata en frequenties zijn verzonnen.') }}</p>
    </div>
    <div class="result" id="kn-out">
      <lk-note v-if="!m" kind="info">{{ t('Vul per locus de allelen van kind en vermeende vader en de frequenties van de allelen van het kind in.') }}</lk-note>
      <template v-else>
        <lk-note v-for="(w, i) in m.warn" :key="i" kind="warn" :html="tHtml(w)"/>
        <template v-if="m.excl.length">
          <lk-big :label="t('Uitsluiting')" :value="lkNumIn(m.excl.length)" :sub="t('van ' + m.valid.length + ' loci')"/>
          <lk-note v-if="m.excl.length >= 2" kind="bad">{{ t('Uitsluiting op meerdere loci: de vermeende vader is uitgesloten.') }}</lk-note>
          <lk-note v-else kind="warn">{{ t('Uitsluiting op één locus: dit kan een mutatie zijn; neem een mutatiemodel mee of typeer extra loci.') }}</lk-note>
        </template>
        <template v-else>
          <lk-big :label="t('Gecombineerde vaderschapsindex')" :html="lkNumIn(sci(m.cpi, 3))"/>
          <lk-kv :rows="kvRows"/>
        </template>
        <lk-table :cols="outCols" :rows="outRows"/>
      </template>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';
import AlleleFreq from './AlleleFreq.vue';
import {afAllele, afLookup} from '../lib/afreq.js';

const F = (x, d) => lkNumIn(fmt(x, d));

export default {
  name: 'Kin',
  components: {AlleleFreq},
  data() {
    return {
      mo: '1', pr: '50',
      rows: [['D3S1358', 15, 17, 0.26, 0.20, 15, 16, 17, 18], ['vWA', 16, 16, 0.21, 0.21, 16, 18, 16, 17],
        ['FGA', 21, 24, 0.17, 0.14, 22, 24, 21, 21], ['TH01', 6, 9.3, 0.23, 0.30, 9.3, 9.3, 6, 7],
        ['D8S1179', 13, 14, 0.30, 0.20, 12, 13, 14, 15]]
        .map(r => r.map((v, i) => (i ? lkNumIn(String(v).replace('.', ',')) : v)))
    };
  },
  computed: {
    cols() {
      const t = this.t;
      return [{h: t('Locus'), t: 'txt', w: 84}, {h: t('Kind a₁'), t: 'num', w: 56}, {h: t('Kind a₂'), t: 'num', w: 56},
        {h: 'p(a₁)', t: 'num', w: 64}, {h: 'p(a₂)', t: 'num', w: 64},
        {h: t('Moeder a₁'), t: 'num', w: 60}, {h: t('Moeder a₂'), t: 'num', w: 60},
        {h: t('Vader a₁'), t: 'num', w: 56}, {h: t('Vader a₂'), t: 'num', w: 56}];
    },
    /* het rekenwerk van calc.kin, ongewijzigd */
    m() {
      const trio = this.mo === '1', pr = Math.min(0.9999, Math.max(0.0001, (num(this.pr) || 50) / 100));
      const eq = (a, b) => isFinite(a) && isFinite(b) && Math.abs(a - b) < 0.01,
        T = (g, x) => ((eq(g[0], x) ? 1 : 0) + (eq(g[1], x) ? 1 : 0)) / 2;
      const rows = this.rows.map(r => ({l: r[0], c: [num(r[1]), num(r[2])], p: [num(r[3]), num(r[4])],
        m: [num(r[5]), num(r[6])], f: [num(r[7]), num(r[8])]}))
        .filter(r => r.l && r.c.every(isFinite) && r.p.every(v => v > 0 && v < 1) && r.f.every(isFinite));
      if (!rows.length) return null;
      const warn = [];
      const res = rows.map(r => {
        const mo = trio && r.m.every(isFinite), pm = x => (mo ? T(r.m, x) : (eq(x, r.c[0]) ? r.p[0] : r.p[1])),
          prr = x => (eq(x, r.c[0]) ? r.p[0] : r.p[1]);
        const ord = eq(r.c[0], r.c[1]) ? [[r.c[0], r.c[1]]] : [[r.c[0], r.c[1]], [r.c[1], r.c[0]]]; /* [moederlijk, vaderlijk] */
        const nu = ord.reduce((s, [a, b]) => s + pm(a) * T(r.f, b), 0), den = ord.reduce((s, [a, b]) => s + pm(a) * prr(b), 0);
        if (mo && den === 0) warn.push(`${ud(r.l)}: het kind heeft geen allel van de moeder; controleer de typering of een mutatie.`);
        return {l: r.l, pi: den > 0 ? nu / den : NaN};
      });
      const valid = res.filter(r => isFinite(r.pi)), excl = valid.filter(r => r.pi === 0),
        cpi = valid.reduce((s, r) => s * r.pi, 1), W = cpi * pr / (cpi * pr + 1 - pr);
      return {trio, pr, res, valid, excl, cpi, W, warn};
    },
    kvRows() {
      const t = this.t, {W, pr, valid, trio} = this.m;
      return [[t('Kans op vaderschap W'), W > 0.99999 ? lkNumIn('&gt; 99,999%') : F(W * 100, 3) + '%'],
        [t('A-priorikans'), F(pr * 100, 1) + '%'], [t('Loci'), lkNumIn(valid.length)],
        [t('Type'), t(trio ? 'trio (met moeder)' : 'duo (zonder moeder)')]];
    },
    outCols() { return [{h: this.t('Locus')}, {h: 'PI', num: true}]; },
    outRows() {
      return this.m.res.map(r => [esc(r.l), isFinite(r.pi)
        ? (r.pi === 0 ? `<span class="chip bad">${esc(this.t('0 (uitsluiting)'))}</span>` : F(r.pi, 3)) : '–']);
    }
  },
  methods: {
    lkNumIn,
    sci(x, d) { return sci(x, d); },
    /* p(a1) en p(a2) (kolom 4, 5) uit de allelen van het kind (kolom 2, 3) */
    fillFreq(map) {
      const miss = [], next = this.rows.map(r => r.slice());
      next.forEach(r => {
        const l = String(r[0]).trim();
        if (!l) return;
        [1, 2].forEach(j => {
          const a = afAllele(r[j]), f = a === '' ? undefined : afLookup(map, l, a);
          if (f == null) { if (a !== '') miss.push(l + ' ' + a); return; }
          r[j + 2] = lkNumIn(String(f).replace('.', ','));
        });
      });
      this.rows = next;
      return miss;
    },
    addRow() { this.rows = [...this.rows, ['', '', '', '', '', '', '', '', '']]; }
  }
};
</script>
