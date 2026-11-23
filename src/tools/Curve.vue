<!-- ================= STANDAARDCURVE =================
     Het rekenwerk is niet herschreven: fitCurve() en coef() (lineair, door de oorsprong,
     kwadratisch, 4PL en 5PL) blijven in web/index.html staan en worden hier aangeroepen. Wat in
     de oude calc.curve() stond (blanco, terugrekenen, CV, status, LOD/LOQ, de tekeningreeksen)
     staat letterlijk in `fs`, `so`, `uo` en draw(); alleen de uitvoer is nu Vue in plaats van
     innerHTML. De plaatlezer-import (parsePlate() en colList() blijven in index.html) is
     methode plateImport().

     De id's s-preset, s-model, s-unit, s-blank, s-logx, s-pdet, s-pfile, s-ptxt, s-pstd,
     s-pconc, s-punk, s-prep, s-pdir, s-pgo, s-pmsg, s-std, s-addstd, s-cv, s-res, s-unk,
     s-addunk, s-copy, s-csv en s-copied blijven zoals ze waren. De twee tabellen zijn
     <lk-etable>: de berekende kolommen (gemiddelde, terugberekend, CV, ...) zijn kolommen van het
     type 'out' met data-m, data-b, data-cv, data-x, data-o en data-st, zoals eerder. -->
<template>
  <div class="stack">
    <div class="panel">
      <div class="row" style="gap:16px;align-items:flex-end">
        <div class="f"><label for="s-preset">{{ t('Voorbeeld laden') }}</label>
          <select id="s-preset" v-model="preset" @change="load($event.target.value)">
            <option value="bradford">{{ t('Bradford (BSA)') }}</option>
            <option value="elisa">{{ t('ELISA (sandwich)') }}</option>
            <option value="leeg">{{ t('Leeg') }}</option>
          </select></div>
        <div class="f"><label for="s-model">{{ t('Model') }}</label>
          <select id="s-model" v-model="model">
            <option v-for="m in models" :key="m.k" :value="m.k">{{ t(m.n) }}</option>
          </select></div>
        <div class="f"><label for="s-unit">{{ t('Eenheid concentratie') }}</label>
          <input id="s-unit" class="txt" v-model="unit" style="width:110px"></div>
        <label class="chk" for="s-blank"><input type="checkbox" id="s-blank" v-model="blank"> {{ t('Blanco (0-standaard) aftrekken') }}</label>
        <label class="chk" for="s-logx"><input type="checkbox" id="s-logx" v-model="logx"> {{ t('Log-schaal x-as') }}</label>
      </div>
    </div>
    <details class="panel" id="s-pdet"><summary style="cursor:pointer;font-weight:600;font-size:14px">{{ t('Plaatlezer-export importeren (96-wells)') }}</summary>
      <div class="grid2" style="margin-top:12px">
        <div>
          <div class="row" style="margin-bottom:8px;gap:8px"><input type="file" id="s-pfile" accept=".csv,.txt,.tsv,.asc" @change="onFile"><button type="button" id="s-pwiz" @click="wiz">{{ t('Plaatlezer-bestand…') }}</button></div>
          <div class="f"><label for="s-ptxt">{{ t('Of plak het plaatblok (rij A–H met 12 waarden, uit Excel of de plaatlezer)') }}</label>
            <textarea id="s-ptxt" rows="9" spellcheck="false" :placeholder="ph" v-model="ptxt"></textarea></div>
        </div>
        <div>
          <div class="fields">
            <div class="f"><label for="s-pstd">{{ t('Standaarden in kolom(men)') }}</label><input id="s-pstd" class="mono" v-model="pstd"></div>
            <div class="f" style="grid-column:1/-1"><label for="s-pconc">{{ t('Concentraties rij A → H') }}</label><input id="s-pconc" class="mono" v-model="pconc"></div>
            <div class="f"><label for="s-punk">{{ t('Monsters in kolom(men)') }}</label><input id="s-punk" class="mono" v-model="punk"></div>
            <div class="f"><label for="s-prep">{{ t('Replicaten per monster') }}</label><input id="s-prep" inputmode="numeric" v-model="prep"></div>
            <div class="f"><label for="s-pdir">{{ t('Replicaten liggen') }}</label>
              <select id="s-pdir" style="width:100%" v-model="pdir">
                <option value="h">{{ t('naast elkaar (kolommen)') }}</option>
                <option value="v">{{ t('onder elkaar (rijen)') }}</option>
              </select></div>
          </div>
          <div class="row" style="margin-top:12px"><button type="button" class="primary" id="s-pgo" @click="plateImport">{{ t('Overnemen in tabellen') }}</button></div>
          <div id="s-pmsg" style="margin-top:8px"><lk-note v-if="pmsg" :kind="pmsg.kind">{{ pmsg.text }}</lk-note></div>
        </div>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Werkt met tekst- en CSV-exports die het plaatformaat gebruiken (rijletter vooraan, één regel per rij), zoals de meeste plaatlezers en Excel-sheets. Scheidingsteken tab, puntkomma of komma wordt herkend. Lege putjes worden overgeslagen.') }}</p>
    </details>
    <div class="grid2">
      <div class="panel">
        <h3 v-html="h3std"></h3>
        <lk-etable table-id="s-std" :cols="stdCols" v-model:rows="std" add-id="s-addstd">
          <template #out="{ri, k}">
            <template v-if="k === 'm'">{{ so[ri] ? so[ri].m : '–' }}</template>
            <template v-else>
              <span v-if="so[ri] && so[ri].chip" :class="'chip ' + so[ri].chip">{{ so[ri].b }}</span>
              <template v-else>{{ so[ri] ? so[ri].b : '–' }}</template>
            </template>
          </template>
        </lk-etable>
        <div class="row" style="margin-top:10px"><button type="button" id="s-addstd" @click="addStd">{{ t('+ Standaard') }}</button></div>
      </div>
      <div class="result"><canvas id="s-cv"></canvas>
        <div id="s-res">
          <lk-note v-if="fs.stage === 'few'" kind="info">{{ t('Vul minstens ' + fs.minPts + ' standaarden met absorptie in.') }}</lk-note>
          <lk-note v-else-if="fs.stage === 'nofit'" kind="bad">{{ t('De fit lukte niet; controleer de standaarden.') }}</lk-note>
          <template v-else>
            <div class="lbl" style="margin-top:8px">{{ t('Fit') }}</div>
            <lk-kv :rows="kvRows"/>
            <lk-formula :html="eqHtml"/>
            <lk-note v-if="fs.rcov > 15" kind="warn">{{ t('Een of meer standaarden wijken bij terugrekenen meer dan 15% af. Probeer een ander model of laat een afwijkend punt weg.') }}</lk-note>
            <lk-note v-if="model === 'lin' && std.length > 4 && fs.r2 < 0.99" kind="info">{{ t('Bradford-curves buigen af bij hogere concentraties; probeer kwadratisch of beperk de standaarden tot het lineaire deel.') }}</lk-note>
            <lk-note v-if="model === '4pl' && new Set(fs.X).size < 6" kind="warn">{{ t('Met minder dan 6 standaardniveaus is een 4PL-fit slecht bepaald.') }}</lk-note>
          </template>
        </div>
      </div>
    </div>
    <div class="panel">
      <h3>{{ t('Onbekende monsters') }}</h3>
      <lk-etable table-id="s-unk" :cols="unkCols" v-model:rows="unk" add-id="s-addunk">
        <template #out="{ri, k}">
          <template v-if="!uo[ri]">{{ k === 'st' ? '' : '–' }}</template>
          <template v-else-if="k === 'm'">{{ uo[ri].m }}</template>
          <template v-else-if="k === 'cv'">
            <span v-if="uo[ri].cv" :class="'chip ' + uo[ri].cvCls">{{ uo[ri].cv }}%</span>
            <template v-else>–</template>
          </template>
          <template v-else-if="k === 'x'">{{ uo[ri].xs }}</template>
          <template v-else-if="k === 'o'"><b v-if="uo[ri].os">{{ uo[ri].os }}</b><template v-else>–</template></template>
          <span v-else :class="'chip ' + uo[ri].stCls">{{ t(uo[ri].stNl) }}</span>
        </template>
      </lk-etable>
      <!-- de balk "Stuur monsters door naar"; de klik wordt afgehandeld door het globale
           document-handler op [data-send-curve] in tools/nt/99_app.js -->
      <div class="lk-send"><span>{{ t('Stuur monsters door naar') }}</span><button type="button" data-send-curve="sds">{{ t('SDS-PAGE') }}</button><button type="button" data-send-curve="wb">{{ t('Western blot') }}</button></div>
      <div class="row" style="margin-top:10px"><button type="button" id="s-addunk" @click="addUnk">{{ t('+ Monster') }}</button><button type="button" id="s-copy" @click="copy">{{ t('Kopieer resultaten') }}</button><button type="button" id="s-csv" class="dl-only" style="display:none" @click="csv">{{ t('Download CSV') }}</button><span id="s-copied" style="font-size:13px;color:var(--muted)">{{ copied }}</span></div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const FM = (x, d) => lkNumIn(fmt(x, d)), SG = (x, d) => lkNumIn(sig(x, d));
const T = s => trPlain(s);

/* een invoerwaarde zoals inp() hem in de oude versie toonde: leeg bij NaN, anders met een komma */
const cellIn = v => (v == null || v === '' || (typeof v === 'number' && !isFinite(v)) ? '' : lkNumIn(String(v).replace('.', ',')));
/* een rij van n cellen: de invoerwaarden vooraan, daarachter lege plaatsen voor de berekende kolommen */
const row = (vals, n) => Array.from({length: n}, (_, i) => (i < vals.length ? cellIn(vals[i]) : ''));
const SW = 6, UW = 10;   /* breedte van een standaard- en een monsterrij, berekende kolommen inbegrepen */

/* de voorbeelden van de oude tool (SPRE) */
const SPRE = {
  bradford: {model: 'quad', unit: 'µg/mL', blank: true, logx: false, std: [[0, 0.44], [125, 0.593], [250, 0.666], [500, 1.037], [750, 1.289], [1000, 1.445], [1500, 1.683]], unk: [['Lysaat A', 0.98, 1.00, '', 2], ['Lysaat B', 1.52, 1.55, '', 5], ['Celextract C', 0.52, 0.50, '', 1], ['Weefsel D', 1.79, 1.81, '', 1]]},
  elisa: {model: '4pl', unit: 'pg/mL', blank: false, logx: true, std: [[0, 0.048, 0.053], [15.6, 0.149, 0.158], [31.3, 0.268, 0.281], [62.5, 0.505, 0.521], [125, 0.897, 0.922], [250, 1.401, 1.447], [500, 1.889, 1.931], [1000, 2.221, 2.262]], unk: [['Serum 1', 0.71, 0.69, '', 10], ['Serum 2', 1.62, 1.66, '', 10], ['Serum 3', 2.45, 2.48, '', 10]]},
  leeg: {model: 'lin', unit: 'µg/mL', blank: true, logx: false, std: [[0], [NaN], [NaN], [NaN], [NaN]], unk: [['Monster 1', '', '', '', 1]]}
};
const stdRows = P => P.std.map(r => row(r, SW));
const unkRows = P => P.unk.map(r => { const x = row(r, UW); x[0] = T(r[0]); return x; });

const MODELS = [{k: 'lin', n: 'Lineair y = a + bx'}, {k: 'lin0', n: 'Lineair door oorsprong'}, {k: 'quad', n: 'Kwadratisch'},
  {k: '4pl', n: '4PL (ELISA)'}, {k: '5pl', n: '5PL (asymmetrisch)'}];

const ST = {out: ['buiten curve', 'bad'], hi: ['boven hoogste std', 'warn'], lo: ['onder laagste std', 'warn'], ok: ['binnen bereik', 'ok']};

export default {
  name: 'Curve',
  data() {
    const P = SPRE.bradford;
    return {
      preset: 'bradford', model: P.model, unit: P.unit, blank: P.blank, logx: P.logx,
      std: stdRows(P), unk: unkRows(P),
      ptxt: '', pstd: '1-2', pconc: '0 25 125 250 500 750 1000 1500', punk: '3-12', prep: '2', pdir: 'h', pmsg: null,
      copied: ''
    };
  },
  computed: {
    models() { return MODELS; },
    h3std() { return this.tHtml('Standaarden <span class="example">voorbeeld</span>'); },
    ph() { return lkNumIn('\t1\t2\t3\t…\nA\t0,051\t0,049\t0,612\t…\nB\t…'); },
    stdCols() {
      const t = this.t;
      return [{h: t('Conc.'), t: 'num', w: 80}, {h: 'A₁', t: 'num', w: 62}, {h: 'A₂', t: 'num', w: 62}, {h: 'A₃', t: 'num', w: 62},
        {h: t('Gem.'), t: 'out', k: 'm', num: true}, {h: t('Terug­berekend'), t: 'out', k: 'b', num: true}];
    },
    unkCols() {
      const t = this.t;
      return [{h: t('Monster'), t: 'txt', w: 120}, {h: 'A₁', t: 'num', w: 62}, {h: 'A₂', t: 'num', w: 62}, {h: 'A₃', t: 'num', w: 62},
        {h: t('Verd.­factor'), t: 'num', w: 56}, {h: t('Gem. A'), t: 'out', k: 'm', num: true}, {h: t('CV'), t: 'out', k: 'cv', num: true},
        {h: t('In meetbuis'), t: 'out', k: 'x', num: true}, {h: t('Origineel'), t: 'out', k: 'o', num: true}, {h: t('Status'), t: 'out', k: 'st'}];
    },
    /* de hele fit: de oude calc.curve() tot en met de terugberekening van de standaarden */
    fs() {
      const model = this.model, unit = this.unit || '', useBlank = this.blank, logx = this.logx;
      const rows = this.std.map(r => ({c: num(r[0]), a: [r[1], r[2], r[3]].map(num).filter(isFinite)}));
      let blank = 0; if (useBlank) { const z = rows.filter(r => r.c === 0 && r.a.length).flatMap(r => r.a); if (z.length) blank = mean(z); }
      const X = [], Y = []; const used = rows.filter(r => isFinite(r.c) && r.a.length);
      used.forEach(r => { r.y = r.a.map(v => v - blank); r.m = mean(r.y); r.y.forEach(v => { X.push(r.c); Y.push(v); }); });
      const minPts = model === '5pl' ? 5 : model === '4pl' ? 4 : model === 'quad' ? 3 : 2;
      const S = {rows, used, model, unit, useBlank, logx, blank, X, Y, minPts, stage: 'ok'};
      if (new Set(X).size < minPts) { S.stage = 'few'; return S; }
      const fit = fitCurve(model, X, Y); if (!fit) { S.stage = 'nofit'; return S; }
      const my = mean(Y); const ssr = Y.reduce((s, y, i) => s + (y - fit.f(X[i])) ** 2, 0), sst = Y.reduce((s, y) => s + (y - my) ** 2, 0); const r2 = 1 - ssr / sst;
      const means = used.map(r => r.m), ylo = Math.min(...means), yhi = Math.max(...means);
      const recov = [];
      used.forEach(r => { const b = fit.inv(r.m); if (r.c > 0 && isFinite(b)) { const pc = b / r.c * 100; recov.push(pc); r.pc = pc; } });
      const rcov = recov.length ? Math.max(...recov.map(p => Math.abs(p - 100))) : 0;
      Object.assign(S, {fit, r2, ylo, yhi, rcov});
      return S;
    },
    /* de berekende cellen van de standaardtabel, per rij */
    so() {
      const S = this.fs;
      return S.rows.map(r => {
        if (!S.used.includes(r)) return {m: '–', b: '–'};
        const m = FM(r.m, 3);
        if (S.stage !== 'ok') return {m, b: '–'};
        if (r.pc !== undefined) { const pc = r.pc; return {m, b: FM(pc, 0) + '%', chip: Math.abs(pc - 100) <= 15 ? 'ok' : Math.abs(pc - 100) <= 25 ? 'warn' : 'bad'}; }
        return {m, b: r.c === 0 ? this.t('blanco') : '–'};
      });
    },
    /* de onbekenden: een null waar de rij geen absorptie heeft */
    uo() {
      const S = this.fs;
      return this.unk.map(r => {
        const a = [r[1], r[2], r[3]].map(num).filter(isFinite), df = num(r[4]) || 1, nm = r[0];
        if (!a.length || S.stage !== 'ok') return null;
        const {fit, blank, yhi, ylo} = S;
        const y = a.map(v => v - blank), m = mean(y), cvp = a.length > 1 ? sd(y) / Math.abs(m) * 100 : NaN, x = fit.inv(m), o = x * df;
        let st;
        if (!isFinite(x)) st = 'out';
        else if (m > yhi * 1.0001) st = 'hi';
        else if (m < ylo - 1e-9) st = 'lo';
        else st = 'ok';
        return {nm, m: FM(m, 3), mv: m, df, x, xs: isFinite(x) ? SG(x, 3) : '–', os: isFinite(o) ? SG(o, 3) : '', o,
          cv: isFinite(cvp) ? FM(cvp, 1) : '', cvp, cvCls: cvp <= 10 ? 'ok' : cvp <= 20 ? 'warn' : 'bad',
          stNl: ST[st][0], stCls: ST[st][1]};
      });
    },
    /* de tekst voor "Kopieer resultaten" en de CSV: de oude `sText` */
    sText() {
      const unit = this.unit || '';
      const T0 = ['Monster\tGem. A\tCV %\tIn meetbuis (' + unit + ')\tVerdunning\tOrigineel (' + unit + ')\tStatus'];
      this.uo.forEach(u => {
        if (!u) return;
        T0.push([u.nm, fmt(u.mv, 3), isFinite(u.cvp) ? fmt(u.cvp, 1) : '', isFinite(u.x) ? sig(u.x, 3) : '', fmt(u.df, 2), isFinite(u.o) ? sig(u.o, 3) : '', u.stNl].join('\t'));
      });
      return T0.join('\n');
    },
    kvRows() {
      const S = this.fs, t = this.t, {model, unit, X, Y, blank, useBlank, r2, ylo, yhi} = S;
      let lodRows = []; if (model === 'lin' && X.length > 2) { const lr = linreg(X, Y), sres = Math.sqrt(Y.reduce((s, y, i) => s + (y - (lr.a + lr.b * X[i])) ** 2, 0) / (X.length - 2)); if (lr.b !== 0) { lodRows = [[t('LOD (3,3·σ/S)'), SG(3.3 * sres / Math.abs(lr.b), 3) + ' ' + esc(unit)], [t('LOQ (10·σ/S)'), SG(10 * sres / Math.abs(lr.b), 3) + ' ' + esc(unit)]]; } }
      return [[t('Model'), t(MODELS.find(m => m.k === model).n)], ['R²', `<span class="chip ${r2 >= 0.99 ? 'ok' : r2 >= 0.98 ? 'warn' : 'bad'}">${FM(r2, 4)}</span>`],
        [t('Blanco'), useBlank && blank ? FM(blank, 3) : t('niet afgetrokken')], [t('Signaalbereik std'), `${FM(ylo, 3)} – ${FM(yhi, 3)}`], ...lodRows];
    },
    eqHtml() { return lkNumIn(this.fs.fit.eq); }
  },
  mounted() {
    window.__curveVm = this;
    /* showDl() liep al voordat deze knop bestond */
    if (typeof STANDALONE !== 'undefined' && (STANDALONE || (typeof dlCap !== 'undefined' && dlCap)) && typeof showDl === 'function') showDl();
    this.draw();
  },
  updated() { this.draw(); },
  methods: {
    wiz() { plateWizard('curve'); },   /* S92: Tecan, SoftMax Pro, Gen5, BMG via het venster */
    /* een voorbeeld laden: de oude sLoad() */
    load(k) {
      const P = SPRE[k]; if (!P) return;
      this.model = P.model; this.unit = P.unit; this.blank = P.blank; this.logx = P.logx;
      this.std = stdRows(P); this.unk = unkRows(P);
    },
    /* tblRestore() zet de bewaarde modelkeuze terug */
    setOpts(o) { this.model = o.model; this.unit = o.unit; this.blank = !!o.blank; this.logx = !!o.logx; },
    addStd() { this.std = [...this.std, row([], SW)]; },
    addUnk() { const n = this.unk.length + 1; this.unk = [...this.unk, row([this.t('Monster ' + n), '', '', '', 1], UW)]; },
    async copy() {
      try { await navigator.clipboard.writeText(i18nTSV(this.sText)); this.copied = this.t('Gekopieerd.'); } catch (e) { this.copied = this.t('Kopiëren geblokkeerd.'); }
    },
    /* dlMsg() van de app, met de tekst als gegeven in plaats van een element */
    async csv() {
      try { await saveBlob('standaardcurve.csv', csvBlob(this.sText)); this.copied = this.t('Opgeslagen.'); }
      catch (err) { this.copied = this.t(err && err.code === 'declined' ? 'Download geannuleerd.' : 'Downloaden lukte niet hier.'); }
    },
    onFile(e) { const f = e.target.files[0]; if (!f) return; f.text().then(t => { this.ptxt = t; this.plateImport(); }); },
    /* de plaatlezer-import: dezelfde regels als de oude plateImport(); de tabellen worden nu als
       waarden gezet in plaats van als innerHTML */
    plateImport() {
      /* S91: plateRead() kent ook Tecan, SoftMax Pro en een lijst per putje; de eerste plaat telt */
      const R = plateRead(this.ptxt), P = R.plates.length ? plateRows(R.plates[0]) : parsePlate(this.ptxt), rows = Object.keys(P).sort(), t = this.t;
      if (rows.length < 2) { this.pmsg = {kind: 'bad', text: t('Geen plaatblok gevonden. Elke regel moet beginnen met een rijletter (A, B, …) gevolgd door de meetwaarden.')}; return; }
      const S = colList(this.pstd), U = colList(this.punk), conc = stNums(this.pconc), rep = Math.max(1, Math.round(num(this.prep) || 1)), dir = this.pdir;
      const v = (r, c) => P[r] ? P[r][c - 1] : NaN; const std = [];
      rows.forEach((r, i) => { if (i >= conc.length) return; const a = S.map(c => v(r, c)).filter(isFinite).slice(0, 3); if (a.length) std.push([conc[i], ...a]); });
      const unk = [];
      if (dir === 'h') { rows.forEach(r => { for (let k = 0; k < U.length; k += rep) { const cs = U.slice(k, k + rep), a = cs.map(c => v(r, c)).filter(isFinite).slice(0, 3); if (a.length) unk.push([`${r}${cs[0]}${cs.length > 1 ? '–' + r + cs[cs.length - 1] : ''}`, ...a, '', ''].slice(0, 4).concat([1])); } }); }
      else { U.forEach(c => { for (let k = 0; k < rows.length; k += rep) { const rs = rows.slice(k, k + rep), a = rs.map(r => v(r, c)).filter(isFinite).slice(0, 3); if (a.length) unk.push([`${rs[0]}${c}${rs.length > 1 ? '–' + rs[rs.length - 1] + c : ''}`, ...a, '', ''].slice(0, 4).concat([1])); } }); }
      if (!std.length) { this.pmsg = {kind: 'bad', text: t('Geen standaarden gevonden in de opgegeven kolommen.')}; return; }
      this.std = std.map(r => row([r[0], r[1], r[2], r[3]], SW)); this.unk = unk.map(r => { const x = row(r, UW); x[0] = String(r[0]); return x; });
      this.pmsg = {kind: 'info', text: t(`${rows.length} rijen gelezen: ${std.length} standaarden en ${unk.length} monsters overgenomen.`) + (rep > 3 ? ' ' + t('Er worden maximaal 3 replicaten gebruikt.') : '')};
    },
    /* de tekening, met de tekencontext via chart(); dezelfde reeksen als de oude calc.curve() */
    draw() {
      const cv = document.getElementById('s-cv'), S = this.fs; if (!cv) return;
      if (S.stage === 'few') { cv.getContext('2d').clearRect(0, 0, cv.width, cv.height); return; }
      if (S.stage !== 'ok') return;
      const {X, Y, fit, useBlank, blank, logx, unit} = S;
      const out = this.uo.filter(Boolean).map(u => ({x: u.x, m: u.mv, nm: u.nm}));
      const xsPos = X.filter(x => logx ? x > 0 : true); const xsAll = xsPos.concat(out.map(u => u.x).filter(v => isFinite(v) && (!logx || v > 0)));
      const xmin = logx ? Math.min(...xsAll) / 1.5 : 0, xmax = Math.max(...xsAll) * (logx ? 1.5 : 1.05);
      const yAll = Y.concat(out.map(u => u.m)); const ymin = Math.min(0, ...yAll), ymax = Math.max(...yAll) * 1.08;
      chart(cv, {xmin, xmax, ymin, ymax, logx, xlabel: 'concentratie (' + unit + ')', ylabel: useBlank && blank ? 'absorptie − blanco' : 'absorptie',
        series: [{fn: fit.f, x0: xmin, x1: xmax, name: 'fit'}, {pts: X.map((x, i) => [x, Y[i]]), color: '--ink', name: 'standaard'}, {pts: out.filter(u => isFinite(u.x)).map(u => [u.x, u.m]), color: '--bad', r: 5, hollow: true, name: 'monster'}],
        legend: [['standaard', '--ink'], ['monster', '--bad']]});
    }
  }
};
</script>
