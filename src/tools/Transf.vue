<!-- ================= TRANSFORMATIE & BLAUW-WIT =================
     De plaattellingen staan in een <lk-etable> (zelfde kolommen als de oude tfRow), de rijen in
     de component. De id's tf-lv, tf-vng, tf-used, tf-tot, tf-range, tf-tbl, tf-add en tf-out
     blijven zoals ze waren; tf-tbl en tf-add zijn de haken voor tblRestore(), addRow() en plakken.
     De formules zijn ongewijzigd uit de oude calc.transf overgenomen. -->
<template>
  <div class="grid2">
    <div class="stack">
      <div class="panel">
        <h3>{{ t('Transformatie') }}</h3>
        <div class="row"><label><input type="checkbox" id="tf-card" v-model="card"> {{ t('Toon voorbereidingskaart') }}</label></div>
        <lk-steps v-if="card" :steps="cardSteps"/>
        <div class="fields">
          <lk-field v-model="lv" :label="t('Ligatievolume')" for-id="tf-lv" unit="µL"/>
          <lk-field v-model="vng" :label="t('Vector in ligatie')" for-id="tf-vng" unit="ng"/>
          <lk-field v-model="used" :label="t('Getransformeerd')" for-id="tf-used" :unit="t('µL ligatie')"/>
          <lk-field v-model="tot" :label="t('Totaal na herstel (cellen + SOC)')" for-id="tf-tot" unit="µL"/>
          <div class="f"><label for="tf-range">{{ t('Telbare platen') }}</label>
            <select id="tf-range" style="width:100%" v-model="range">
              <option value="30-300">{{ t('30–300 kolonies') }}</option>
              <option value="20-400">{{ t('20–400 kolonies') }}</option>
              <option value="1-100000">{{ t('Alle platen met kolonies') }}</option>
            </select></div>
        </div>
      </div>
      <div class="panel">
        <h3 v-html="tHtml('Plaattellingen <span class=&quot;example&quot;>voorbeeld</span>')"></h3>
        <lk-etable table-id="tf-tbl" :cols="cols" v-model:rows="rows" add-id="tf-add"/>
        <div class="row" style="margin-top:10px"><button type="button" id="tf-add" @click="addRow">{{ t('+ Plaat') }}</button></div>
        <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Platen met dezelfde naam bij Experiment worden samen verwerkt. Heb je de rest geconcentreerd (centrifugeren, pellet in ±200 µL), vul dan het oorspronkelijke volume in dat op die plaat terechtkwam, bijvoorbeeld 930 µL.') }}</p>
      </div>
    </div>
    <div class="result" id="tf-out">
      <lk-note v-if="m.empty" kind="info">{{ t('Vul de tellingen per plaat in.') }}</lk-note>
      <lk-note v-else-if="m.bad" kind="bad">{{ t('Vul ligatievolume, hoeveelheid vector, getransformeerd volume en totaalvolume in.') }}</lk-note>
      <template v-else>
        <lk-big :label="bigLabel" :html="bigHtml"/>
        <lk-kv :rows="kvRows"/>
        <lk-table :cols="outCols" :rows="outRows"/>
        <lk-note v-for="(w, i) in warnings" :key="i" kind="warn" :html="w"/>
        <lk-formula :html="formula"/>
        <lk-note kind="info">{{ t('Wit betekent dat lacZα onderbroken is, niet dat het juiste insert erin zit. Controleer witte kolonies met een kolonie-PCR of restrictieanalyse.') }}</lk-note>
      </template>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => lkNumIn(fmt(x, d)), S = (x, d) => lkNumIn(sci(x, d));
const isTn = x => /^(>|tntc)/i.test(x);

export default {
  name: 'Transf',
  data() {
    return {
      lv: '10', vng: '50', used: '1', tot: '1040', range: '30-300', card: true,
      rows: [[trPlain('Eigen ligatie'), '10', '3', '19'], [trPlain('Eigen ligatie'), '100', '31', '176'],
        [trPlain('Eigen ligatie'), '930', 'TNTC', 'TNTC'], [trPlain('Controle-insert'), '100', '72', '118']]
    };
  },
  computed: {
    cols() {
      const t = this.t;
      return [{h: t('Experiment'), t: 'txt', w: 140}, {h: t('Uitgeplaat (µL)'), t: 'num', w: 80},
        {h: t('Blauw'), t: 'num', w: 70}, {h: t('Wit'), t: 'num', w: 70}];
    },
    /* standaard heat-shock-protocol: tijden en temperaturen als waarden */
    cardSteps() {
      const t = this.t;
      return [t('Ontdooi competente cellen ' + 10 + ' min op ijs.'),
        t('Voeg het DNA toe, meng voorzichtig en zet ' + 30 + ' min op ijs.'),
        t('Hitteschok: ' + 45 + ' s bij ' + 42 + ' °C.'),
        t('Zet ' + 2 + ' min terug op ijs.'),
        t('Voeg ' + 950 + ' µL SOC toe.'),
        t('Laat ' + 1 + ' uur bij ' + 37 + ' °C schudden.'),
        t('Plaat ' + 50 + '–' + 100 + ' µL uit.')];
    },
    /* alle metingen en resultaten per experiment; de rest leest hier alleen uit */
    m() {
      const lv = num(this.lv), vng = num(this.vng), used = num(this.used), tot = num(this.tot);
      const [lo, hi] = this.range.split('-').map(Number);
      const ng = vng / lv * used, ug = ng / 1000;
      const G = {};
      this.rows.forEach(r => {
        const n = (r[0] || '').trim() || 'Experiment', v = num(r[1]), bR = String(r[2] || '').trim(), wR = String(r[3] || '').trim();
        if (bR === '' && wR === '') return;
        const b = num(bR), w = num(wR);
        (G[n] = G[n] || []).push({v, b: isTn(bR) ? Infinity : (isFinite(b) ? b : 0), w: isTn(wR) ? Infinity : (isFinite(w) ? w : 0)});
      });
      const names = Object.keys(G);
      if (!names.length) return {empty: true};
      if (!(ng > 0) || !(tot > 0)) return {bad: true};
      const res = names.map(n => {
        const P = G[n].filter(p => p.v > 0), fin = P.filter(p => isFinite(p.b + p.w));
        let use = fin.filter(p => p.b + p.w >= lo && p.b + p.w <= hi), est = false;
        if (!use.length) { use = fin.filter(p => p.b + p.w > 0); est = true; }
        const sv = use.reduce((a, p) => a + p.v, 0), sb = use.reduce((a, p) => a + p.b, 0), sw = use.reduce((a, p) => a + p.w, 0), col = sb + sw;
        const T = sv > 0 ? col / sv * tot : NaN, W = sv > 0 ? sw / sv * tot : NaN;
        return {n, plates: P.length, used: use.length, est, T, W, Bl: T - W, pw: col > 0 ? sw / col * 100 : NaN,
          ratio: sb > 0 ? sw / sb : Infinity, freq: T / ug, wfreq: W / ug, sv, col};
      });
      return {lv, vng, used, tot, lo, hi, ng, ug, res};
    },
    main() { return this.m.res[0]; },
    bigLabel() { return this.t(uv(this.main.n) + ': transformatiefrequentie'); },
    bigHtml() { return this.tHtml(sci(this.main.freq, 2) + ' <small>transformanten/µg vector</small>'); },
    kvRows() {
      const t = this.t, {ng} = this.m, r = this.main;
      return [[t('Vector per transformatie'), F(ng, 3) + ' ng'],
        [t('Transformanten totaal'), isFinite(r.T) ? F(Math.round(r.T), 0) : '–'],
        [t('Waarvan wit'), isFinite(r.W) ? F(Math.round(r.W), 0) + ' (' + F(r.pw, 1) + ' %)' : '–'],
        [t('Verhouding wit : blauw'), isFinite(r.ratio) ? F(r.ratio, 2) + ' : 1' : t('alleen wit')],
        [t('Witte transformanten/µg'), S(r.wfreq, 2)]];
    },
    outCols() {
      const t = this.t;
      return [{h: t('Experiment')}, {h: t('Platen gebruikt'), num: true}, {h: t('Transformanten'), num: true},
        {h: t('Wit'), num: true}, {h: t('% wit'), num: true}, {h: t('Wit : blauw'), num: true},
        {h: t('Frequentie (per µg)'), num: true}];
    },
    outRows() {
      return this.m.res.map(r => [esc(r.n), this.t(r.used + ' van ' + r.plates),
        isFinite(r.T) ? F(Math.round(r.T), 0) : '–', isFinite(r.W) ? F(Math.round(r.W), 0) : '–',
        F(r.pw, 1), isFinite(r.ratio) ? F(r.ratio, 2) : '–', S(r.freq, 2)]);
    },
    warnings() {
      const {res, lo, hi} = this.m, w = [];
      res.filter(r => r.est).forEach(r => w.push(this.tHtml(ud(r.n) + ': geen plaat binnen ' + lo + '–' + hi + ' kolonies; berekend met alle platen met kolonies. Markeer als schatting.')));
      res.filter(r => r.used > 0 && r.col < 10).forEach(r => w.push(this.tHtml(ud(r.n) + ': minder dan 10 kolonies geteld; de verhouding wit/blauw is dan erg onzeker.')));
      return w;
    },
    formula() {
      const {tot, vng, lv, used, ng} = this.m;
      return this.t('transformanten = Σ kolonies / Σ uitgeplaat volume × ' + fmt(tot, 0) + ' µL · vector = ' + fmt(vng, 1) + ' ng / ' + fmt(lv, 1) + ' µL × ' + fmt(used, 2) + ' µL = ' + fmt(ng, 3) + ' ng · frequentie = transformanten / µg vector');
    }
  },
  methods: {
    addRow() { this.rows = [...this.rows, ['', '100', '', '']]; }
  }
};
</script>
