<!-- ================= STR-PROFIELCONTROLE =================
     De beoordeling per locus (PHR, stutter, AT/ST, minimaal aantal bijdragers) staat hier
     ongewijzigd uit calc.strchk overgenomen; er is geen aparte rekenfunctie in de module.

     De id's sc-at, sc-st, sc-phr, sc-stut, sc-tbl, sc-tbl-add en sc-out blijven zoals ze
     waren. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <lk-field v-model="at" :label="t('Analytische drempel')" for-id="sc-at" unit="RFU"/>
        <lk-field v-model="st" :label="t('Stochastische drempel')" for-id="sc-st" unit="RFU"/>
        <lk-field v-model="phr" :label="t('Minimale piekhoogteverhouding')" for-id="sc-phr" unit="%"/>
        <lk-field v-model="stut" :label="t('Stutterfilter (n−1)')" for-id="sc-stut" unit="%"/>
      </div>
      <div class="tbl-wrap" style="margin-top:12px;max-height:440px;overflow-y:auto">
        <lk-etable table-id="sc-tbl" :cols="cols" v-model:rows="rows" add-id="sc-tbl-add" :wrap="false"/>
      </div>
      <div class="row" style="margin-top:8px">
        <button type="button" id="sc-tbl-add" @click="addRow">{{ t('+ Piek') }}</button>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Eén regel per piek. Plak drie kolommen uit de export van je analysesoftware (locus, allel, hoogte). Drempels zijn per lab en kit gevalideerd; de standaardwaarden zijn voorbeelden. Voorbeelddata zijn verzonnen.') }}</p>
    </div>
    <div class="result" id="sc-out">
      <lk-note v-if="!m" kind="info">{{ t('Vul per piek locus, allel en hoogte in.') }}</lk-note>
      <template v-else>
        <lk-big :label="t('Minimaal aantal bijdragers')" :value="m.nc"/>
        <lk-kv :rows="kvRows"/>
        <lk-table :cols="outCols" :rows="outRows"/>
        <lk-note v-if="m.mix" kind="info">{{ t('Bij een mengprofiel zijn PHR- en drop-outregels per bijdrager niet direct toepasbaar; gebruik de mengprofielrichtlijnen van je lab of probabilistische software.') }}</lk-note>
      </template>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => lkNumIn(fmt(x, d));

export default {
  name: 'Strchk',
  data() {
    return {
      at: '50', st: '200', phr: '60', stut: '15',
      rows: [['D3S1358', '15', '1520'], ['D3S1358', '16', '1310'], ['D3S1358', '14', '140'],
        ['vWA', '17', '2210'], ['FGA', '21', '610'], ['FGA', '24', '290'],
        ['TH01', lkNumIn('9,3'), '180'], ['D8S1179', '12', '880'], ['D8S1179', '13', '930'],
        ['D8S1179', '14', '410'], ['D8S1179', '15', '380'], ['D21S11', '30', '40']]
    };
  },
  computed: {
    cols() {
      const t = this.t;
      return [{h: t('Locus'), t: 'txt', w: 90}, {h: t('Allel'), t: 'num', w: 70},
        {h: t('Hoogte (RFU)'), t: 'num', w: 90}];
    },
    /* de beoordeling per locus, precies zoals calc.strchk die eerder maakte; de teksten van
       de opmerkingen blijven Nederlands en gaan pas bij het tonen door t() */
    m() {
      const AT = num(this.at) || 0, ST = num(this.st) || 0, PHR = (num(this.phr) || 0) / 100,
        SF = (num(this.stut) || 0) / 100;
      const rows = this.rows.map(r => ({l: String(r[0] || '').trim(), a: num(r[1]), h: num(r[2])}))
        .filter(r => r.l && isFinite(r.a) && isFinite(r.h));
      if (!rows.length) return null;
      const loci = [...new Set(rows.map(r => r.l))], res = [];
      let maxA = 0;
      loci.forEach(l => {
        const P = rows.filter(r => r.l === l).sort((a, b) => a.a - b.a),
          below = P.filter(p => p.h < AT), ab = P.filter(p => p.h >= AT);
        const stut = ab.filter(p => ab.some(q => q !== p && Math.abs(q.a - 1 - p.a) < 0.01 && p.h <= q.h * SF)),
          al = ab.filter(p => !stut.includes(p));
        const flags = [];
        let phr = NaN;
        if (al.length === 2) {
          phr = Math.min(al[0].h, al[1].h) / Math.max(al[0].h, al[1].h);
          if (phr < PHR) flags.push(['warn', 'PHR onder drempel']);
        }
        if (al.length === 1 && al[0].h < ST) flags.push(['warn', 'mogelijke drop-out (homozygoot onder ST)']);
        if (al.length === 2 && al.some(p => p.h < ST)) flags.push(['warn', 'allel onder ST']);
        if (al.length > 2) flags.push(['bad', 'meer dan 2 allelen: mengprofiel']);
        if (stut.length) flags.push(['info', `stutter gefilterd: ${stut.map(p => fmt(p.a, 1)).join(', ')}`]);
        if (below.length) flags.push(['info', `onder AT: ${below.map(p => fmt(p.a, 1)).join(', ')}`]);
        if (!al.length) flags.push(['bad', 'geen allel boven AT']);
        maxA = Math.max(maxA, al.length);
        res.push({l, al, phr, flags});
      });
      return {loci, res, maxA, nc: Math.max(1, Math.ceil(maxA / 2)), mix: maxA > 2,
        low: res.filter(r => r.flags.some(f => f[0] !== 'info')).length};
    },
    kvRows() {
      const t = this.t, {loci, maxA, low, mix} = this.m;
      return [[t('Loci'), lkNumIn(loci.length)], [t('Maximaal aantal allelen per locus'), lkNumIn(maxA)],
        [t('Loci met opmerkingen'), lkNumIn(low)],
        [t('Profieltype'), t(mix ? 'mengprofiel' : 'enkelvoudig (op basis van alleltelling)')]];
    },
    outCols() {
      const t = this.t;
      return [{h: t('Locus')}, {h: t('Allelen')}, {h: 'PHR', num: true}, {h: t('Beoordeling')}];
    },
    outRows() {
      const t = this.t;
      const chip = (c, s) => `<span class="chip ${c === 'bad' ? 'bad' : c === 'warn' ? 'warn' : 'ok'}" style="margin:1px 3px 1px 0">${esc(t(s))}</span>`;
      return this.m.res.map(r => [`<b>${esc(r.l)}</b>`,
        r.al.map(p => `${F(p.a, 1)} <small style="color:var(--muted)">(${F(p.h, 0)})</small>`).join(', ') || '–',
        isFinite(r.phr) ? F(r.phr * 100, 0) + '%' : '–',
        r.flags.length ? r.flags.map(f => chip(f[0], f[1])).join('') : chip('ok', 'in orde')]);
    }
  },
  methods: {
    addRow() { this.rows = [...this.rows, ['', '', '']]; }
  }
};
</script>
