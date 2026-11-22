<!-- ================= MENGPROFIEL & LR =================
     De hulpfuncties mxTok() en mxLR() blijven in tools/nt/96_mix.js staan. Deze component
     beheert het veld θ, de locustabel (een <lk-etable> in plaats van ET()) en de uitkomst.
     Het rekenwerk is hetzelfde als in de oude calc.mix(), regel voor regel.

     De id's mx-th, mx-tbl, mx-tbl-add en mx-out blijven zoals ze waren. -->
<template>
  <div class="stack">
    <div class="panel">
      <div class="fields">
        <lk-field v-model="thv" :label-html="tHtml('θ (F&lt;sub&gt;ST&lt;/sub&gt;, subpopulatiecorrectie)')" for-id="mx-th"/>
      </div>
      <div style="margin-top:12px">
        <lk-etable table-id="mx-tbl" :cols="cols" v-model:rows="rows" add-id="mx-tbl-add"/>
      </div>
      <div class="row" style="margin-top:8px">
        <button type="button" id="mx-tbl-add" @click="addRow">{{ t('+ Locus') }}</button>
      </div>
      <allele-freq :fill="fillFreq"/>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Per locus de allelen van het mengprofiel met in dezelfde volgorde de piekhoogtes en de allelfrequenties, en de genotypen van slachtoffer (bekende bijdrager) en verdachte. Scheid waarden met spaties. Neem frequenties uit de populatiedatabase van je opdracht. Voorbeelddata en frequenties zijn verzonnen.') }}</p>
    </div>
    <div class="result">
      <div id="mx-out">
        <lk-note v-if="!res" kind="info">{{ t('Vul per locus de allelen van het mengprofiel in.') }}</lk-note>
        <template v-else>
          <template v-if="res.L.length">
            <lk-big :label="t('Likelihood ratio (' + res.L.length + ' loci, θ = ' + fmt(res.th, 3) + ')')" :html="res.bigHtml"/>
            <lk-kv :rows="res.lrRows"/>
          </template>
          <lk-kv :rows="res.mxRows"/>
          <lk-table :cols="outCols" :rows="res.tblRows"/>
          <lk-note v-for="(w, i) in res.warn" :key="i" kind="warn">{{ w }}</lk-note>
          <lk-note kind="info">{{ t('Rekenvoorbeeld voor onderwijs: dit model gebruikt geen piekhoogtes, stutter of drop-out bij de LR en gaat uit van precies twee bijdragers.') }}</lk-note>
          <lk-formula :html="tHtml('LR = Π 1 / Σ P(genotype onbekende | slachtoffer, verdachte, θ) · M&lt;sub&gt;x&lt;/sub&gt; = (φ&lt;sub&gt;minor 1&lt;/sub&gt; + φ&lt;sub&gt;minor 2&lt;/sub&gt;) / Σφ')"/>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';
import AlleleFreq from './AlleleFreq.vue';
import {afAllele, afLookup} from '../lib/afreq.js';

const F = (x, d) => lkNumIn(fmt(x, d));

export default {
  name: 'Mix',
  components: {AlleleFreq},
  data() {
    return {
      thv: lkNumIn('0,01'),
      rows: [['D3S1358', '14 15 16 18', '1450 1380 420 390', lkNumIn('0,12 0,26 0,25 0,15'), '14 15', '16 18'],
        ['vWA', '16 17 19', '1500 1820 410', lkNumIn('0,20 0,27 0,09'), '16 17', '17 19'],
        ['FGA', '20 22 23 24', '1320 400 1410 370', lkNumIn('0,14 0,17 0,15 0,14'), '20 23', '22 24'],
        ['D8S1179', '12 13 14', '430 2650 380', lkNumIn('0,14 0,31 0,21'), '13 13', '12 14'],
        ['TH01', '6 9.3', '1900 2200', lkNumIn('0,23 0,31'), '6 9.3', '6 9.3']]
    };
  },
  computed: {
    cols() {
      const t = this.t;
      return [{h: t('Locus'), t: 'txt', w: 80}, {h: t('Allelen mengprofiel'), t: 'txt', w: 130},
        {h: t('Piekhoogtes (RFU)'), t: 'txt', w: 150}, {h: t('Frequenties'), t: 'txt', w: 150},
        {h: t('Slachtoffer'), t: 'txt', w: 70}, {h: t('Verdachte'), t: 'txt', w: 70}];
    },
    outCols() {
      const t = this.t, th = this.tHtml;
      return [{h: t('Locus')}, {h: t('Allelen'), num: true}, {h: th('M<sub>x</sub>'), num: true},
        {h: th('H<sub>b</sub> major'), num: true}, {h: th('H<sub>b</sub> minor'), num: true},
        {h: t('LR'), num: true}, {h: t('Opmerking')}];
    },
    /* het rekenwerk van de oude calc.mix(); null als er geen enkele locus is ingevuld */
    res() {
      const t = this.t, tHtml = this.tHtml, uv = this.uv;
      const th = Math.min(Math.max(num(this.thv) || 0, 0), 0.2);
      const R = [], warn = [];
      this.rows.forEach(r => {
        const loc = r[0].trim(), E = mxTok(r[1]);
        if (!loc || !E.length) return;
        const H = mxTok(r[2]).map(Number), Fr = mxTok(r[3]).map(Number), V = mxTok(r[4]), S = mxTok(r[5]);
        const o = {loc, E, H, n: E.length};
        if (new Set(E).size !== E.length) { warn.push(t(uv(loc) + ': een allel staat dubbel in het mengprofiel.')); return; }
        if (E.length > 4) warn.push(t(uv(loc) + ': meer dan vier allelen past niet bij twee bijdragers.'));
        if (H.length === E.length && H.every(h => h > 0)) {
          const tot = H.reduce((a, b) => a + b, 0), srt = [...H].sort((a, b) => a - b);
          if (E.length === 4) { o.mx = (srt[0] + srt[1]) / tot; o.hbMin = srt[0] / srt[1]; o.hbMaj = srt[2] / srt[3]; }
          else if (E.length === 2) { o.hb2 = srt[0] / srt[1]; }
        }
        if (V.length === 2 && S.length === 2 && Fr.length === E.length && Fr.every(f => f > 0 && f < 1)) {
          const p = {};
          E.forEach((a, i) => p[a] = Fr[i]);
          const expl = E.every(a => V.includes(a) || S.includes(a)), inside = [...V, ...S].every(a => E.includes(a));
          if (!inside || !expl) {
            o.lr = 0;
            o.note = !inside ? 'allel van slachtoffer of verdachte ontbreekt in het spoor' : 'niet alle allelen verklaard door slachtoffer + verdachte';
          } else o.lr = mxLR(E, p, V, S, th);
          if (Fr.reduce((a, b) => a + b, 0) > 1.0001) warn.push(t(uv(loc) + ': de frequenties tellen op tot meer dan 1.'));
        }
        else if (V.length || S.length || Fr.length) o.note = 'vul twee allelen per persoon en één frequentie per allel in';
        R.push(o);
      });
      if (!R.length) return null;
      const mxs = R.filter(r => isFinite(r.mx)).map(r => r.mx), Mx = mxs.length ? mean(mxs) : NaN,
        L = R.filter(r => r.lr != null && isFinite(r.lr)), LR = L.length ? L.reduce((a, r) => a * r.lr, 1) : NaN,
        lg = LR > 0 ? Math.log10(LR) : NaN;
      const verb = v => v > 1e6 ? 'extreem veel waarschijnlijker' : v > 1e4 ? 'zeer veel waarschijnlijker' : v > 100 ? 'veel waarschijnlijker' : v > 10 ? 'waarschijnlijker' : v > 2 ? 'iets waarschijnlijker' : 'ongeveer even waarschijnlijk';
      let bigHtml = '', lrRows = [];
      if (L.length) {
        const inv = LR > 0 && LR < 1, v = inv ? 1 / LR : LR;
        bigHtml = LR === 0 ? t('0 (uitsluiting)') : lkNumIn(sci(LR, 3));
        lrRows = [[t('log₁₀ LR'), isFinite(lg) ? F(lg, 2) : '–'],
          [t('Verbale term (NFI)'), LR === 0 ? t('de verdachte past niet als bijdrager')
            : tHtml('de bevindingen zijn ' + verb(v) + ' onder ' + (inv ? 'H<sub>d</sub> (slachtoffer + onbekende)' : 'H<sub>p</sub> (slachtoffer + verdachte)')
              + (v > 2 ? ' dan onder ' + (inv ? 'H<sub>p</sub>' : 'H<sub>d</sub>') : ''))]];
      }
      const mxRows = [[tHtml('Mengverhouding M<sub>x</sub> (kleinste bijdrager)'),
        isFinite(Mx) ? t(fmt(Mx, 2) + ' (ongeveer 1 : ' + fmt((1 - Mx) / Mx, 1) + ', uit ' + mxs.length + ' loci met vier allelen)')
          : t('niet te bepalen zonder een locus met vier allelen en piekhoogtes')],
        [t('Major en minor te scheiden?'), isFinite(Mx) ? (Mx < 0.33 ? t('ja, duidelijk verschil in bijdrage') : t('lastig: de bijdragen liggen dicht bij elkaar')) : '–']];
      const tblRows = R.map(r => [esc(r.loc), r.n, isFinite(r.mx) ? F(r.mx, 2) : '–',
        isFinite(r.hbMaj) ? F(r.hbMaj, 2) : isFinite(r.hb2) ? F(r.hb2, 2) : '–',
        isFinite(r.hbMin) ? F(r.hbMin, 2) : '–',
        r.lr == null ? '–' : r.lr === 0 ? '0' : lkNumIn(sig(r.lr, 3)),
        r.note ? t(r.note) : (isFinite(r.hbMaj) && Math.min(r.hbMaj, r.hbMin) < 0.6 ? tHtml('H<sub>b</sub> onder 0,60') : '')]);
      return {th, L, bigHtml, lrRows, mxRows, tblRows, warn};
    }
  },
  methods: {
    fmt,
    /* frequenties (kolom 4) per allel van het mengprofiel (kolom 2); alles of niets per locus */
    fillFreq(map) {
      const miss = [], next = this.rows.map(r => r.slice());
      next.forEach(r => {
        const l = r[0].trim(), E = mxTok(r[1]);
        if (!l || !E.length) return;
        const f = E.map(a => afLookup(map, l, a));
        E.forEach((a, i) => { if (f[i] == null) miss.push(l + ' ' + afAllele(a)); });
        if (f.every(x => x != null)) r[3] = lkNumIn(f.join(' ').replace(/\./g, ','));
      });
      this.rows = next;
      return miss;
    },
    addRow() { this.rows = [...this.rows, ['', '', '', '', '', '']]; }
  }
};
</script>
