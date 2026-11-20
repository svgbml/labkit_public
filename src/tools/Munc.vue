<!-- ================= MEETONZEKERHEID =================
     De velden, de tabel en de uitkomst zijn Vue; het rekenwerk blijft muncCalc() in
     tools/nt/32_munc.js. De bronnen staan in een <lk-etable>. De balken worden met pShow() op het
     canvas getekend, na elke render; het canvas zelf blijft buiten Vue, en tekst die erop komt
     loopt al door trCanvas().

     De id's mu-res, mu-unit, mu-k, mu-tbl, mu-tbl-add, mu-cv en mu-out blijven zoals ze waren. -->
<template>
  <div class="stack">
    <div class="panel">
      <div class="fields">
        <lk-field v-model="res" :label="t('Resultaat')" for-id="mu-res"/>
        <lk-field v-model="unit" :label="t('Eenheid')" for-id="mu-unit" inputmode="text" cls="txt"/>
        <lk-field data-expert="" v-model="k" :label="t('Dekkingsfactor k')" for-id="mu-k"/>
      </div>
      <lk-etable table-id="mu-tbl" :cols="cols" v-model:rows="rows" add-id="mu-tbl-add" style="margin-top:12px"/>
      <div class="row" style="margin-top:8px">
        <button type="button" id="mu-tbl-add" @click="addRow">{{ t('+ Bron') }}</button>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Per bron de waarde en de onzekerheid zoals opgegeven: een standaardonzekerheid (bijvoorbeeld de SD van herhaalde metingen), een tolerantie ±a (certificaat of glaswerk) of een relatieve waarde in %. Voorbeeld: 0,1000 M NaCl uit 5,844 g in een maatkolf van 1 L.') }}</p>
    </div>
    <div class="result">
      <canvas id="mu-cv" v-show="!!M"></canvas>
      <div id="mu-out">
        <lk-note v-if="!M" kind="info">{{ t('Vul per bron een waarde en onzekerheid in.') }}</lk-note>
        <template v-else>
          <lk-big :label="bigLabel" :value="bigValue" :sub="bigSub"/>
          <lk-kv :rows="kvRows"/>
          <lk-table :cols="outCols" :rows="outRows"/>
          <lk-formula :html="formula"/>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => lkNumIn(fmt(x, d)), G = (x, d) => lkNumIn(sig(x, d));

export default {
  name: 'Munc',
  data() {
    /* de namen van de voorbeeldbronnen zijn tekst van de tool, dus die gaan door t() */
    return {
      res: lkNumIn('0,1000'), unit: 'mol/L', k: '2',
      rows: [[this.t('Massa NaCl (g)'), lkNumIn('5,844'), lkNumIn('0,0005'), MUT[0]],
        [this.t('Zuiverheid NaCl'), lkNumIn('0,995'), lkNumIn('0,005'), MUT[1]],
        [this.t('Volume maatkolf (mL)'), '1000', lkNumIn('0,4'), MUT[2]],
        [this.t('Temperatuur volume (mL)'), '1000', lkNumIn('0,21'), MUT[0]],
        [this.t('Molmassa NaCl (g/mol)'), lkNumIn('58,443'), lkNumIn('0,0006'), MUT[0]]]
    };
  },
  computed: {
    cols() {
      const t = this.t;
      return [{h: t('Bron'), t: 'txt', w: 150}, {h: t('Waarde'), t: 'num', w: 84},
        {h: t('Onzekerheid'), t: 'num', w: 84}, {h: t('Soort'), t: 'sel', o: MUT}];
    },
    /* de maten uit muncCalc(); null zolang er geen bron met waarde en onzekerheid is */
    M() { return muncCalc(num(this.res), num(this.k) || 2, this.rows); },
    bigLabel() { return this.t(`Uitgebreide onzekerheid (k = ${fmt(this.M.k, 1)})`); },
    bigValue() { const {U, urel, k} = this.M; return isFinite(U) ? G(U, 2) : F(k * urel * 100, 2); },
    bigSub() { return isFinite(this.M.U) ? this.unit : '%'; },
    kvRows() {
      const t = this.t, {urel, uc, U, top} = this.M, res = num(this.res), un = esc(this.unit);
      return [[t('Resultaat'), isFinite(res) ? `${G(res, 6)} ± ${G(U, 2)} ${un}` : '–'],
        [t('Relatieve gecombineerde onzekerheid'), F(urel * 100, 3) + '%'],
        [this.tHtml('Gecombineerde standaardonzekerheid u<sub>c</sub>'), isFinite(uc) ? G(uc, 3) + ' ' + un : '–'],
        [t('Grootste bijdrage'), `${esc(top.n)} (${F(top.c * 100, 0)}%)`]];
    },
    outCols() {
      const t = this.t;
      return [{h: t('Bron')}, {h: 'u', num: true}, {h: 'u/x (%)', num: true}, {h: t('Bijdrage'), num: true}];
    },
    outRows() {
      return this.M.R.map(r => [esc(r.n), isFinite(r.u) ? G(r.u, 3) : '–', F(r.rel * 100, 4), F(r.c * 100, 1) + '%']);
    },
    formula() { return this.tHtml('u<sub>c</sub>/y = √Σ(u<sub>i</sub>/x<sub>i</sub>)² · rechthoekig u = a/√3 · driehoekig u = a/√6 · U = k·u<sub>c</sub>'); }
  },
  mounted() { this.draw(); },
  updated() { this.draw(); },
  methods: {
    addRow() { this.rows = [...this.rows, ['', '', '', MUT[0]]]; },
    /* de balken worden na elke render bijgewerkt; dat houdt canvas en uitkomst bij elkaar */
    draw() {
      const cv = document.getElementById('mu-cv'); if (!cv || !this.M) return;
      const {R, top} = this.M, W = 480, bh = 24, H = R.length * bh + 50;
      pShow(cv, W, H, (x) => { const L = 170, mx = Math.max(...R.map(r => r.c)); x.font = '12px ' + PFONT(); x.textBaseline = 'middle'; R.forEach((r, i) => { const y = 20 + i * bh; x.fillStyle = PCOL.ink; x.textAlign = 'right'; let lb = r.n; if (x.measureText(uv(lb)).width > L - 16) { while (lb.length > 1 && x.measureText(uv(lb + '…')).width > L - 16) lb = lb.slice(0, -1); lb += '…'; } x.fillText(uv(lb), L - 8, y + bh / 2); x.fillStyle = r === top ? PCOL.warn : PCOL.acc; const w = (W - L - 60) * r.c / mx; x.fillRect(L, y + 4, w, bh - 8); x.fillStyle = PCOL.muted; x.textAlign = 'left'; x.fillText(fmt(r.c * 100, 0) + '%', L + w + 6, y + bh / 2); }); x.fillStyle = PCOL.muted; x.textAlign = 'left'; x.fillText('bijdrage aan u²', L, H - 12); });
    }
  }
};
</script>
