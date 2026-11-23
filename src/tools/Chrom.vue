<!-- ================= CHROMATOGRAFIE (HPLC/GC) =================
     De berekening staat ongewijzigd in de computed m(): per piek k, N, H, T, en per paar α en
     R_s, met de systeemgeschiktheidsmeldingen. De tabel is een <lk-etable> met dezelfde
     kolommen en beginrijen als de ET()-versie. De id's chr-t0, chr-L, chr-wt, chr-tbl,
     chr-tbl-add, chr-cv en chr-out blijven zoals ze waren; de tabel in #chr-out heeft per piek
     een rij en de kolommen t_R, k, N, H, T, α, R_s in die volgorde. -->
<template>
  <div class="stack">
    <div class="panel">
      <div class="fields">
        <lk-field v-model="t0" for-id="chr-t0" :label-html="tHtml('Dode tijd t&lt;sub&gt;0&lt;/sub&gt;')" :unit="t('min')"/>
        <lk-field v-model="L" for-id="chr-L" :label="t('Kolomlengte')" :unit="t('mm')"/>
        <div class="f"><label for="chr-wt">{{ t('Breedte gemeten als') }}</label>
          <select id="chr-wt" v-model="wt">
            <option value="h">{{ t('breedte op halve hoogte') }}</option>
            <option value="b">{{ t('basisbreedte uit raaklijnen') }}</option>
          </select>
        </div>
      </div>
      <div style="margin-top:12px"><lk-etable table-id="chr-tbl" :cols="cols" v-model:rows="rows" add-id="chr-tbl-add"/></div>
      <div class="row" style="margin-top:8px"><button type="button" id="chr-tbl-add" @click="add">{{ t('+ Piek') }}</button></div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0" v-html="tHtml('Tijden en breedtes in minuten, uit het integratierapport. Voor de tailingfactor: de piekbreedte op 5% van de hoogte (W&lt;sub&gt;0,05&lt;/sub&gt;) en de afstand f van de voorkant van de piek tot het piekmaximum op die hoogte. Voorbeelddata zijn verzonnen.')"></p>
    </div>
    <div class="result">
      <canvas id="chr-cv" v-show="m.chart"></canvas>
      <div id="chr-out">
        <template v-if="m.P.length">
          <lk-big v-if="m.P.length > 1" :label="t('Kleinste resolutie')" :value="m.minRs" :chip="m.chip" :chip-kind="m.chipKind"/>
          <lk-big v-else :label="t('Plaatgetal')" :value="m.N0"/>
          <lk-table :cols="m.cols" :rows="m.tRows"/>
          <lk-note v-if="m.tail" kind="warn">{{ t('Tailingfactor boven 2: controleer kolom, pH van de mobiele fase of overbelasting.') }}</lk-note>
          <lk-note v-if="m.lowK" kind="info">{{ t('k onder 2: de eerste piek ligt dicht bij de dode tijd en kan storen met de solventpiek.') }}</lk-note>
          <lk-note v-if="m.lowN" kind="info">{{ t('Plaatgetal onder 2000 bij een of meer pieken.') }}</lk-note>
          <lk-formula :html="m.formula"/>
        </template>
        <lk-note v-else kind="info">{{ t('Vul per piek een retentietijd en breedte in.') }}</lk-note>
      </div>
    </div>
    <details class="panel" id="chr-imp-box">
      <summary>{{ t('Piektabel importeren (CSV/TSV)') }}</summary>
      <textarea id="chr-imp" rows="5" style="width:100%;margin-top:8px" v-model="imp" :placeholder="t('Plak een piektabel uit het integratieprogramma, met een kopregel (naam, retentietijd, oppervlakte, hoogte, breedte).')"></textarea>
      <div class="row" style="margin-top:8px"><button type="button" id="chr-imp-go" @click="doImport">{{ t('Importeer in de tabel') }}</button></div>
      <lk-note v-if="impMsg" :kind="impMsg[0]">{{ impMsg[1] }}</lk-note>
      <template v-if="skp.length">
        <canvas id="chr-cv2"></canvas>
        <p style="font-size:13px;color:var(--muted);margin:6px 0 0">{{ t('Schets uit de piektabel (Gaussische pieken met de opgegeven hoogte of oppervlakte en breedte), geen meetdata.') }}</p>
      </template>
    </details>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';
import {parsePeakTable, sketchPeaks} from '../lib/peaktable.js';

/* getallen in de taal van de gebruiker: de DOM-vertaallaag komt niet in een Vue-boom */
const F = (x, d) => lkNumIn(fmt(x, d));
const N = v => lkNumIn(String(v).replace('.', ','));

export default {
  name: 'Chrom',
  data() {
    const t = this.t;
    return {
      t0: lkNumIn('1,10'), L: N(150), wt: 'h', imp: '', impMsg: null, skp: [],
      rows: [['Theobromine', 2.85, 0.075, 0.14, 0.065], ['Theofylline', 3.42, 0.082, 0.16, 0.072], ['Cafeïne', 4.95, 0.110, 0.23, 0.098]]
        .map(r => r.map((v, i) => i ? N(v) : t(v)))
    };
  },
  computed: {
    cols() {
      const t = this.t, tHtml = this.tHtml;
      return [{h: t('Piek'), t: 'txt', w: 110}, {h: tHtml('t<sub>R</sub> (min)'), t: 'num', w: 80}, {h: t('Breedte (min)'), t: 'num', w: 80},
        {h: tHtml('W<sub>0,05</sub> (min)'), t: 'num', w: 80}, {h: t('f (min)'), t: 'num', w: 70}];
    },
    /* alle maten van de uitkomst: één keer berekend, de rest van de component leest hieruit */
    m() {
      const t = this.t, tHtml = this.tHtml;
      const t0 = num(this.t0), L = num(this.L), wb = this.wt === 'b';
      const P = this.rows.map(r => r.slice()).map(r => ({n: r[0] || '?', t: num(r[1]), w: num(r[2]), w5: num(r[3]), f: num(r[4])})).filter(p => p.t > 0 && p.w > 0).sort((a, b) => a.t - b.t);
      const m = {P, chart: false};
      if (!P.length) return m;
      P.forEach(p => { p.k = t0 > 0 ? (p.t - t0) / t0 : NaN; p.N = (wb ? 16 : 5.54) * (p.t / p.w) ** 2; p.H = L > 0 ? L * 1000 / p.N : NaN; p.T = p.w5 > 0 && p.f > 0 ? p.w5 / (2 * p.f) : NaN; p.sg = wb ? p.w / 4 : p.w / 2.3548; });
      for (let i = 1; i < P.length; i++) { const a = P[i - 1], b = P[i]; b.a = a.k > 0 ? b.k / a.k : NaN; b.Rs = (wb ? 2 : 1.18) * (b.t - a.t) / (a.w + b.w); }
      const minRs = Math.min(...P.slice(1).map(p => p.Rs));
      m.minRs = F(minRs, 2); m.N0 = F(P[0].N, 0);
      m.chip = t(minRs > 2 ? 'voldoet' : minRs >= 1.5 ? 'basislijn, krap' : 'overlap');
      m.chipKind = minRs > 2 ? 'ok' : 'warn';
      m.cols = [{h: t('Piek')}, {h: tHtml('t<sub>R</sub>'), num: true}, {h: 'k', num: true}, {h: 'N', num: true}, {h: t('H (µm)'), num: true}, {h: 'T', num: true}, {h: 'α', num: true}, {h: tHtml('R<sub>s</sub>'), num: true}];
      m.tRows = P.map(p => [ud(p.n), F(p.t, 2), F(p.k, 2), F(p.N, 0), F(p.H, 1), F(p.T, 2), p.a ? F(p.a, 3) : '–', p.Rs ? F(p.Rs, 2) : '–']);
      m.tail = P.some(p => p.T > 2);
      m.lowK = P.some(p => p.k < 2 && p.k >= 0);
      m.lowN = P.some(p => p.N < 2000);
      m.formula = tHtml((wb ? 'N = 16(t<sub>R</sub>/W<sub>b</sub>)² · R<sub>s</sub> = 2Δt<sub>R</sub>/(W<sub>b1</sub>+W<sub>b2</sub>)' : 'N = 5,54(t<sub>R</sub>/W<sub>h</sub>)² · R<sub>s</sub> = 1,18Δt<sub>R</sub>/(W<sub>h1</sub>+W<sub>h2</sub>)') + ' · k = (t<sub>R</sub>−t<sub>0</sub>)/t<sub>0</sub>');
      m.chart = true;
      return m;
    }
  },
  mounted() { this.draw(); },
  updated() { this.draw(); },
  methods: {
    /* de oude ET()-knop zette een lege rij onderaan; de breedte komt uit de kolommen, zodat
       het ook werkt als alle rijen weg zijn */
    add() { this.rows = [...this.rows, this.cols.map(() => '')]; },
    doImport() {
      const t = this.t, r = parsePeakTable(this.imp);
      if (!r) { this.skp = []; this.impMsg = ['warn', t('Geen retentietijd-kolom gevonden; zet een kopregel boven de tabel.')]; return; }
      const w = r.peaks.find(p => p.width > 0);
      if (w) this.wt = w.wkind;
      this.rows = r.peaks.map(p => [p.name, N(p.rt), p.width > 0 ? N(+p.width.toPrecision(4)) : '', '', '']);
      this.skp = sketchPeaks(r.peaks);
      this.impMsg = ['ok', t(r.peaks.length + ' pieken ingelezen')];
    },
    draw() {
      const c2 = document.getElementById('chr-cv2'), K = this.skp;
      if (c2 && K.length) {
        const f2 = x => K.reduce((s, p) => s + p.amp * Math.exp(-0.5 * ((x - p.rt) / p.sigma) ** 2), 0);
        const g2 = chart(c2, {xmin: Math.max(0, Math.min(...K.map(p => p.rt - 4 * p.sigma)) - 0.3), xmax: Math.max(...K.map(p => p.rt + 4 * p.sigma)) + 0.3, ymin: 0, ymax: 1.25, xlabel: 'tijd (min)', ylabel: 'signaal (relatief, schets)', series: [{fn: f2, name: 'schets'}]});
        const c = c2.getContext('2d'); c.font = '11px ' + PFONT(); c.fillStyle = PCOL.ink; c.textAlign = 'center';
        K.forEach(p => c.fillText(uv(p.name.length > 14 ? p.name.slice(0, 13) + '…' : p.name), g2.X(p.rt), g2.Y(f2(p.rt)) - 10));
      }
      const cv = document.getElementById('chr-cv'), m = this.m; if (!cv || !m.chart) return;
      const P = m.P;
      const x0 = Math.max(0, Math.min(...P.map(p => p.t - 4 * p.sg)) - 0.3), x1 = Math.max(...P.map(p => p.t + 4 * p.sg)) + 0.3, f = x => P.reduce((s, p) => s + Math.exp(-0.5 * ((x - p.t) / p.sg) ** 2), 0);
      const g = chart(cv, {xmin: x0, xmax: x1, ymin: 0, ymax: 1.25, xlabel: 'tijd (min)', ylabel: 'signaal (relatief)', series: [{fn: f, name: 'chromatogram'}]});
      const c = cv.getContext('2d'); c.font = '11px ' + PFONT(); c.fillStyle = PCOL.ink; c.textAlign = 'center';
      P.forEach(p => c.fillText(uv(p.n.length > 14 ? p.n.slice(0, 13) + '…' : p.n), g.X(p.t), g.Y(f(p.t)) - 10));
    }
  }
};
</script>
