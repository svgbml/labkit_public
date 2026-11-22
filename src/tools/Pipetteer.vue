<!-- ================= PIPETTEERSCHEMA =================
     Componenten in rijen, buizen in kolommen. Het aantal kolommen is variabel (één per buis),
     dus dit is een eigen tabel in plaats van <lk-etable>: de kolomopgave van die component is
     vast. De id's (pp-tbl, pp-cv, pp-out, pp-tot, …) en de data-attributen van de oude tabel
     (data-f, data-r, data-c, data-cn, data-pdel) blijven zoals ze waren.

     Het rekenwerk is ongewijzigd uit calc.ppip overgenomen (nu computed `m`), net als de
     tekening op #pp-cv en het buizenrek (ppRack() in web/index.html). De sjablonen (PPRE),
     ppFromPreset(), ppMigrate() en ppEnzyme() blijven in web/index.html staan.

     - #pp-cv._data wordt nog gezet: tests/validate.py leest de tabel daaruit;
     - de staat van de tabel gaat naar pstore 'pp' (localStorage labkit:v1:proto), net als
       eerder;
     - plakken uit Excel doet de component zelf en stopt de gedeelde plak-handler van
       index.html (die werkt via TBLDEF en kent deze tabel niet). -->
<template>
  <div class="picwrap">
    <div class="pic-prev">
      <div class="result">
        <canvas id="pp-cv"></canvas>
        <div class="pic-bar" data-picbar="pp">
          <button type="button" data-png="pp">{{ t('PNG') }}</button>
          <button type="button" data-svg="pp">{{ t('SVG') }}</button>
          <button type="button" data-copy="pp">{{ t('Kopieer afbeelding') }}</button>
          <button type="button" data-picprint="pp">{{ t('Afdrukken') }}</button>
        </div>
        <div id="pp-out">
          <lk-note v-for="(w, i) in m.warn" :key="i" kind="warn">{{ w }}</lk-note>
          <lk-steps :steps="m.steps"/>
          <button v-if="m.steps.length" type="button" id="pp-bench" @click="bench">{{ t('Bench-modus') }}</button>
          <lk-formula v-if="m.anyC" :html="formula"/>
        </div>
      </div>
    </div>
    <div class="panel">
      <div class="fields">
        <div class="f" style="grid-column:span 2">
          <label for="pp-preset">{{ t('Sjabloon') }}</label>
          <div class="row" style="gap:8px;flex-wrap:nowrap">
            <select id="pp-preset" style="flex:1;min-width:0">
              <option v-for="p in presets" :key="p.v" :value="p.v" :selected="p.v === 'pcr'">{{ t(p.n) }}</option>
            </select>
            <button type="button" id="pp-load" @click="load">{{ t('Laden') }}</button>
          </div>
        </div>
        <div class="f" style="grid-column:span 2">
          <label for="pp-title">{{ t('Titel') }}</label>
          <input id="pp-title" class="txt" v-model="title">
        </div>
        <lk-field v-model="tot" :label="t('Eindvolume per buis')" for-id="pp-tot" :unit="unit"/>
        <div class="f">
          <label for="pp-unit">{{ t('Volume-eenheid') }}</label>
          <select id="pp-unit" style="width:100%" v-model="unit"><option>µL</option><option>mL</option></select>
        </div>
        <div class="f">
          <label for="pp-mm">{{ t('Mastermix-kolom') }}</label>
          <select id="pp-mm" style="width:100%" v-model="mm">
            <option value="1">{{ t('ja, voor alle buizen + marge') }}</option>
            <option value="0">{{ t('nee') }}</option>
          </select>
        </div>
        <lk-field v-model="marge" :label="t('Marge mastermix')" for-id="pp-marge" unit="%"/>
        <lk-overage v-model="ov" for-id="pp-ov" :why="m.why"/>
        <div class="f" style="grid-column:1/-1">
          <label for="pp-note">{{ t('Eigen tekst onder het schema') }}</label>
          <textarea id="pp-note" rows="2" v-model="note"
                    :placeholder="t('Bijv. incubatie, opmerkingen of verwijzing naar het protocol')"></textarea>
        </div>
        <label class="chk" for="pp-auto" style="grid-column:1/-1">
          <input type="checkbox" id="pp-auto" v-model="auto"> {{ t('Standaardtoelichting tonen') }}
        </label>
      </div>
      <div class="tbl-wrap" style="margin-top:14px">
        <table id="pp-tbl" class="mini" @paste="onPaste">
          <thead>
            <tr>
              <th>{{ t('Component') }}</th><th>{{ t('Soort') }}</th>
              <th class="num">{{ t('Stock') }}</th><th>{{ t('Conc.-eenheid') }}</th>
              <th v-for="(c, j) in S.cols" :key="'c' + j">
                <input class="txt" :data-cn="j" v-model="c.n" style="width:96px;font-weight:600">
              </th>
              <th>{{ t('In mix') }}</th><th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in S.rows" :key="i">
              <td><input class="txt" data-f="n" :data-r="i" v-model="r.n" style="width:170px"></td>
              <td>
                <select data-f="mode" :data-r="i" v-model="r.mode" @change="onMode(r)">
                  <option value="vol">{{ t('volume') }}</option>
                  <option value="conc">{{ t('eindconc.') }}</option>
                  <option value="fill">{{ t('aanvullen') }}</option>
                </select>
              </td>
              <td><input data-f="st" :data-r="i" inputmode="decimal" v-model="r.st" style="text-align:right;width:72px"
                         :disabled="r.mode !== 'conc'" :placeholder="r.mode === 'conc' ? null : '–'"></td>
              <td><input class="txt" data-f="cu" :data-r="i" v-model="r.cu" style="width:72px"
                         :disabled="r.mode !== 'conc'" :placeholder="r.mode === 'conc' ? null : '–'"></td>
              <td v-for="(c, j) in S.cols" :key="'v' + j">
                <input data-f="v" :data-r="i" :data-c="j" inputmode="decimal" v-model="r.v[j]"
                       style="text-align:right;width:96px"
                       :placeholder="r.mode === 'fill' ? t('auto') : r.mode === 'conc' ? t('eind') : null">
                <div style="text-align:right"><lk-pip :v="m.V[i][j] * (unit === 'mL' ? 1000 : 1)"/></div>
              </td>
              <td>
                <select data-f="mm" :data-r="i" :value="r.mm ? '1' : '0'" @change="r.mm = $event.target.value === '1'">
                  <option value="1">{{ t('ja') }}</option>
                  <option value="0">{{ t('nee') }}</option>
                </select>
              </td>
              <td><button type="button" class="ghost" :data-pdel="i" :aria-label="t('Verwijder')" @click="S.rows.splice(i, 1)">✕</button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="row" style="margin-top:10px">
        <button type="button" id="pp-addr" @click="addRow">{{ t('+ Component') }}</button>
        <button type="button" id="pp-addc" @click="addCol">{{ t('+ Buis') }}</button>
        <button type="button" id="pp-delc" @click="delCol">{{ t('− Laatste buis') }}</button>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0" v-html="hint"></p>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';
import {overage} from '../lib/overage.js';

const PRESETS = [{v: 'leeg', n: 'Leeg'}, {v: 'pcr', n: 'PCR (Taq, 25 µL)'},
  {v: 'qpcr', n: 'qPCR (SYBR Green, 20 µL)'}, {v: 'digest', n: 'Restrictiedigest (50 µL)'},
  {v: 'ligatie', n: 'Ligatie (T4, 20 µL)'}, {v: 'bca', n: 'BSA-standaardreeks (BCA)'},
  {v: 'medium', n: 'Kweekmedium met supplementen'}];

/* tekst uit een sjabloon in de taal van de gebruiker; de oude versie deed dit met i18nValue()
   op de invoervelden, wat binnen een Vue-boom niet meer gebeurt */
const loc = v => (LANG === 'en' ? trPlain(v, true) : v);
const locState = S => {
  S.cols.forEach(c => { c.n = loc(c.n); });
  S.rows.forEach(r => { r.n = loc(r.n); r.st = loc(r.st); r.cu = loc(r.cu); r.v = r.v.map(loc); });
  return S;
};
const blankRow = nc => ({n: '', mode: 'vol', st: '', cu: '', mm: true, v: Array(nc).fill('')});

/* de invoer die storeGet() eerder bewaarde onder de id's van deze velden */
const stored = (id, d) => { try { const v = storeGet()[id]; return v == null ? d : v; } catch (e) { return d; } };

export default {
  name: 'Pipetteer',
  data() {
    const S = ppMigrate(pstore.get().pp) || locState(ppFromPreset('pcr'));
    return {
      S,
      title: stored('pp-title', loc('Pipetteerschema PCR (25 µL per reactie)')),
      tot: stored('pp-tot', '25'), unit: stored('pp-unit', 'µL'), mm: stored('pp-mm', '1'),
      marge: stored('pp-marge', '10'), ov: stored('pp-ov', 'pct'), note: stored('pp-note', ''), auto: stored('pp-auto', true)
    };
  },
  computed: {
    presets() { return PRESETS; },
    hint() {
      return this.tHtml('<b>Soort</b>: bij <i>volume</i> typ je per buis het volume; bij <i>eindconc.</i> vul je de stockconcentratie in en per buis de gewenste eindconcentratie (zelfde eenheid), dan volgt het volume uit C₁V₁ = C₂V₂; <i>aanvullen</i> vult de buis aan tot het eindvolume (laat de cellen leeg). Componenten met "nee" bij <i>In mix</i> pipetteer je per buis apart. Je kunt een blok uit Excel plakken.');
    },
    formula() { return this.tHtml('V = C<sub>eind</sub> × V<sub>eind</sub> / C<sub>stock</sub> (C₁V₁ = C₂V₂)'); },
    /* alle maten van het schema; dit is het rekenwerk van calc.ppip, letterlijk overgenomen */
    m() {
      const S = this.S, t = this.t, u = this.unit, mmOn = this.mm === '1';
      const tot = num(this.tot), marge = num(this.marge) || 0;
      const nc = S.cols.length, nr = S.rows.length, warn = [];
      const trN = n => (LANG === 'en' ? trPlain(n, true) : n);
      const wi = S.rows.findIndex(r => r.mode === 'fill');
      S.rows.forEach((r, i) => { if (r.mode === 'fill' && i !== wi) warn.push(t(uv(trN(r.n || '?')) + ': maar één component kan aanvullen; deze telt als volume.')); });
      const V = S.rows.map((r, i) => S.cols.map((c, j) => { const raw = String(r.v[j] ?? '').trim();
        if (r.mode === 'conc') { const st = num(r.st), cf = num(raw); if (raw === '') return NaN; if (!(st > 0)) return NaN; return cf * tot / st; }
        if (i === wi && raw === '') return NaN; return num(raw); }));
      const C = S.rows.map(r => r.mode === 'conc' ? S.cols.map((c, j) => num(r.v[j])) : null);
      S.rows.forEach((r, i) => { if (r.mode !== 'conc') return; const st = num(r.st); if (!(st > 0)) warn.push(t(uv(trN(r.n || '?')) + ': vul de stockconcentratie in.')); else if (C[i].some(c => c > st)) warn.push(t(uv(trN(r.n || '?')) + ': de eindconcentratie is hoger dan de stock; dat kan niet.')); });
      if (!isFinite(tot) && S.rows.some(r => r.mode !== 'vol')) warn.push(t('Vul het eindvolume per buis in.'));
      if (wi >= 0 && isFinite(tot)) S.cols.forEach((c, j) => { if (String(S.rows[wi].v[j] ?? '').trim() !== '') return; const s = V.reduce((a, r, i) => i === wi ? a : a + (isFinite(r[j]) ? r[j] : 0), 0); V[wi][j] = tot - s; if (tot - s < -1e-9) warn.push(t(uv(trN(c.n)) + ': de componenten zijn samen meer dan ' + fmt(tot, 2) + ' ' + u + '.')); });
      const colTot = S.cols.map((c, j) => V.reduce((a, r) => a + (isFinite(r[j]) ? r[j] : 0), 0));
      const {mult: mmN, why} = overage(nc, this.ov, marge), wMin = wi >= 0 ? Math.min(...V[wi].filter(isFinite)) : NaN;
      const same = f => f.length && f.every(v => Math.abs(v - f[0]) < 1e-9);
      const mmCol = V.map((r, i) => { if (!S.rows[i].mm) return NaN; if (i === wi && isFinite(wMin)) return wMin * mmN; const f = r.filter(isFinite); if (!f.length) return NaN; return same(f) ? f[0] * mmN : NaN; });
      const varRows = V.map((r, i) => { const f = r.filter(isFinite); return S.rows[i].mm && i !== wi && f.length > 1 && !same(f); });
      if (mmOn && varRows.some(Boolean)) warn.push(t('Niet in elke buis hetzelfde volume: ' + uv(varRows.map((v, i) => v ? trN(S.rows[i].n || '?') : '').filter(Boolean).join(', ')) + '. Zet die op "nee" bij In mix of maak aparte mixen.'));
      S.cols.forEach((c, j) => { if (isFinite(tot) && Math.abs(colTot[j] - tot) > 1e-6 && wi < 0) warn.push(t(uv(trN(c.n)) + ': totaal ' + fmt(colTot[j], 3) + ' ' + u + ' wijkt af van ' + fmt(tot, 2) + ' ' + u + '.')); });
      const anyC = S.rows.some(r => r.mode === 'conc'), cnum = v => isFinite(v) ? NL(Number(v.toPrecision(4)), 4) : '–';
      const finTxt = i => { if (!C[i]) return ''; const f = C[i].filter(isFinite); return !f.length ? '–' : same(f) ? cnum(f[0]) + ' ' + (S.rows[i].cu || '') : 'per buis'; };
      const stTxt = i => S.rows[i].mode === 'conc' && isFinite(num(S.rows[i].st)) ? cnum(num(S.rows[i].st)) + ' ' + (S.rows[i].cu || '') : '';
      const hdr = [...S.cols.map(c => c.n), ...(mmOn ? [`Mastermix (${fmt(mmN, 1)}×)`] : [])];
      const fv = v => isFinite(v) ? NL(Number(v.toFixed(3)), 3) : '–';
      const body = S.rows.map((r, i) => [r.n || '', ...V[i].map(fv), ...(mmOn ? [r.mm ? fv(mmCol[i]) : 'apart'] : [])]);
      const totRow = ['Totaal', ...colTot.map(fv), ...(mmOn ? [fv(mmCol.filter(isFinite).reduce((a, b) => a + b, 0))] : [])];
      const mmTot = mmCol.filter(isFinite).reduce((a, b) => a + b, 0);
      const perTube = mmTot / mmN, apart = S.rows.filter(r => !r.mm && r.n), fillN = wi >= 0 ? (S.rows[wi].n || 'Water') : '';
      const extra = wi >= 0 && S.rows[wi].mm ? S.cols.map((c, j) => [c.n, V[wi][j] - wMin]).filter(e => e[1] > 1e-9) : [];
      const ord = S.rows.map((r, i) => i).filter(i => S.rows[i].n && (!mmOn || S.rows[i].mm)).sort((a, b) => (a === wi ? -1 : b === wi ? 1 : 0) || (ppEnzyme(S.rows[a].n) - ppEnzyme(S.rows[b].n)) || a - b);
      const hasEnz = S.rows.some(r => r.n && ppEnzyme(r.n));
      const listNum = s => LANG === 'en' ? s.replace(i18nNumRe, m => i18nNum(m)) : s;
      const foot = [mmOn ? (this.ov === 'plus1' ? `Mastermix: ${fmt(nc, 0)} buizen + 1 reactie; verdeel ${uv(listNum(fv(perTube)) + ' ' + u)} per buis.` : this.ov === 'none' ? `Mastermix: ${fmt(nc, 0)} buizen, geen overmaat; verdeel ${uv(listNum(fv(perTube)) + ' ' + u)} per buis.` : `Mastermix: ${fmt(nc, 0)} buizen + ${fmt(marge, 0)}% marge; verdeel ${fv(perTube)} ${u} per buis.`) : '', mmOn && apart.length ? `Daarna per buis apart: ${uv(apart.map(r => trN(r.n)).join(', '))}.` : '', mmOn && extra.length ? `Extra ${uv(fillN)} apart: ${uv(extra.map(e => `${trN(e[0])} ${listNum(fv(e[1]))} ${u}`).join(', '))}.` : '', wi >= 0 ? `${uv(fillN)} vult aan tot het eindvolume.` : '', hasEnz ? 'Enzym als laatste toevoegen en op ijs werken.' : ''].filter(Boolean);
      return {S, why, tot, u, mmOn, marge, nc, nr, warn, wi, V, C, colTot, mmN, wMin, mmCol, anyC, cnum, finTxt, stTxt, hdr, fv, body, totRow, mmTot, perTube, apart, fillN, extra, ord, hasEnz, foot, trN,
        steps: this.buildSteps({S, u, mmOn, wi, V, mmN, mmCol, fv, perTube, apart, fillN, extra, ord, hasEnz, trN})};
    }
  },
  mounted() { this.draw(); },
  updated() { this.draw(); },
  methods: {
    /* de werkwijze onder de tekening: een lijst in HTML, want een stap bevat een opsomming */
    buildSteps({S, u, mmOn, V, mmN, mmCol, fv, perTube, apart, fillN, extra, ord, hasEnz, trN}) {
      const t = this.t, steps = [];
      const e = s => esc(t(s)), nm = i => esc(trN(S.rows[i].n));
      const num_ = x => lkNumIn(fv(x));
      const ul = a => `<ul class="ppl">${a.map(x => `<li>${x}</li>`).join('')}</ul>`;
      if (mmOn) {
        if (ord.length) steps.push(`<span>${e('Maak de mastermix voor ' + fmt(mmN, 1) + ' reacties, in deze volgorde:')}</span>` + ul(ord.map(i => `${nm(i)} ${num_(mmCol[i])} ${u}`)));
        steps.push(e('Verdeel ' + fv(perTube) + ' ' + u + ' mastermix per buis.'));
        apart.forEach(r => { const i = S.rows.indexOf(r);
          steps.push(`<span>${e('Voeg per buis ' + uv(trN(S.rows[i].n)) + ' toe:')}</span>` + ul(S.cols.map((c, j) => [c, j]).filter(([c, j]) => !(V[i][j] === 0)).map(([c, j]) => `${esc(trN(c.n))} ${num_(V[i][j])} ${u}`))); });
        if (extra.length) steps.push(`<span>${e('Extra ' + uv(trN(fillN)) + ' per buis:')}</span>` + ul(extra.map(x => `${esc(trN(x[0]))} ${num_(x[1])} ${u}`)));
      } else if (ord.length) steps.push(`<span>${e('Pipetteer per buis in deze volgorde (volumes in het schema):')}</span>` + ul(ord.map(i => nm(i))));
      if (hasEnz) steps.push(e('Enzym als laatste toevoegen en op ijs werken.'));
      return steps;
    },
    bench() { openBench({title: this.title.trim() || this.t('Pipetteerschema'), steps: this.m.steps}); },
    onMode(r) { if (r.mode === 'fill') r.v = r.v.map(() => ''); },
    addRow() { this.S.rows.push(blankRow(this.S.cols.length)); },
    addCol() {
      const S = this.S;
      S.cols.push({n: loc('Buis ' + (S.cols.length + 1))});
      S.rows.forEach(r => r.v.push(r.mode === 'fill' ? '' : (r.v[r.v.length - 1] ?? '')));
    },
    delCol() { const S = this.S; if (S.cols.length <= 1) return; S.cols.pop(); S.rows.forEach(r => r.v.pop()); },
    /* het sjabloon staat in een keuzelijst zonder model: tests/validate.py zet de waarde van
       #pp-preset en klikt dan op Laden, zonder event */
    load() {
      const k = document.getElementById('pp-preset').value, P = PPRE[k]; if (!P) return;
      this.S = locState(ppFromPreset(k)); this.title = loc(P.t); this.tot = lkNumIn(P.tot);
      this.unit = P.u; this.mm = P.mm;
      /* de invoeropslag luistert naar events op de velden, dus die sturen we na de render */
      this.$nextTick(() => {
        ['pp-title', 'pp-tot'].forEach(id => document.getElementById(id).dispatchEvent(new Event('input', {bubbles: true})));
        ['pp-unit', 'pp-mm'].forEach(id => document.getElementById(id).dispatchEvent(new Event('change', {bubbles: true})));
        this.draw();
      });
    },
    /* een blok uit Excel plakken: vanaf de cel waar de cursor staat, de tabel groeit mee in rijen */
    onPaste(e) {
      const t = e.target; if (t.dataset.f !== 'v' && t.dataset.f !== 'n') return;
      const txt = (e.clipboardData || window.clipboardData).getData('text') || '';
      if (!/[\t\n]/.test(txt.trim())) return;
      e.preventDefault(); e.stopPropagation();   /* de gedeelde plak-handler kent deze tabel niet */
      const S = this.S, rows = txt.replace(/\r/g, '').replace(/\n+$/, '').split('\n').map(l => l.split('\t')),
        nc = S.cols.length, r0 = +t.dataset.r, c0 = t.dataset.f === 'n' ? -1 : +t.dataset.c;
      rows.forEach((cells, k) => { const ri = r0 + k; while (S.rows.length <= ri) S.rows.push(blankRow(nc));
        cells.forEach((v, j) => { const ci = c0 + j; if (ci === -1) S.rows[ri].n = v.trim(); else if (ci >= 0 && ci < nc) S.rows[ri].v[ci] = v.trim(); }); });
    },
    /* de tekening, #pp-cv._data en het buizenrek; elke render en elke invoer-event roept dit aan */
    draw() {
      const cv = document.getElementById('pp-cv'); if (!cv) return;
      const {S, tot, u, mmOn, marge, nc, nr, wi, V, C, mmN, anyC, cnum, finTxt, stTxt, hdr, fv, body, totRow, mmTot, foot} = this.m;
      const title = this.title.trim();
      try { pstore.set('pp', JSON.parse(JSON.stringify(S))); } catch (e) { /* opslag geblokkeerd */ }
      ppRack(S, V, tot, u, mmOn, mmTot);
      const showSt = anyC, nFix = showSt ? 2 : 0, cw0 = Math.max(170, ...S.rows.map(r => String(r.n).length * 7.4 + 30)), cwS = 96, cw = Math.max(92, ...hdr.map(h => h.length * 7.2 + 24)), W = Math.round(cw0 + cwS * nFix + cw * hdr.length + 40), varC = S.rows.some((r, i) => C[i] && finTxt(i) === 'per buis'), rh = varC ? 36 : 30, t0 = title ? 40 : 0, NL_ = pNotes('pp', W), AU = pAuto('pp'), NH = NL_.length ? NL_.length * 17 + 12 : 0, H = t0 + rh * (body.length + 2) + (AU ? foot.length * 16 + 22 : 16) + NH;
      pShow(cv, W, H, (x) => { pTitle(x, title, W); const L = 20, T = t0 + 6; const colX = j => L + cw0 + cwS * nFix + cw * j;
        x.fillStyle = PCOL.accSoft; x.fillRect(L, T, W - 40, rh); if (mmOn) { x.fillStyle = '#fdf3e7'; x.fillRect(colX(nc), T + rh, cw, rh * (body.length + 1)); }
        x.font = '600 12.5px ' + PFONT(); x.fillStyle = PCOL.ink; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText(`Component (${u})`, L + 8, T + rh / 2); x.textAlign = 'center'; if (showSt) { x.fillText('Stock', L + cw0 + cwS / 2, T + rh / 2); x.fillText('Eind', L + cw0 + cwS * 1.5, T + rh / 2); } hdr.forEach((h, j) => x.fillText(h, colX(j) + cw / 2, T + rh / 2));
        body.forEach((r, i) => { const y = T + rh * (i + 1); if (!S.rows[i].mm && mmOn) { x.fillStyle = '#f6f7f9'; x.fillRect(L, y, W - 40, rh); } x.font = (i === wi ? 'italic ' : '') + '12.5px ' + PFONT(); x.fillStyle = PCOL.ink; x.textAlign = 'left'; x.fillText(r[0], L + 8, y + rh / 2); x.textAlign = 'center';
          if (showSt) { x.fillStyle = PCOL.muted; x.font = '12px ' + PFONT(); x.fillText(stTxt(i), L + cw0 + cwS / 2, y + rh / 2); x.fillText(finTxt(i), L + cw0 + cwS * 1.5, y + rh / 2); x.font = '12.5px ' + PFONT(); }
          const two = C[i] && finTxt(i) === 'per buis';
          r.slice(1).forEach((v, j) => { x.fillStyle = String(v).startsWith('-') ? PCOL.warn : PCOL.ink; x.font = '12.5px ' + PFONT(); x.fillText(v, colX(j) + cw / 2, y + rh / 2 - (two && j < nc ? 7 : 0)); if (two && j < nc && isFinite(C[i][j])) { x.fillStyle = PCOL.muted; x.font = '10.5px ' + PFONT(); x.fillText(cnum(C[i][j]) + ' ' + (S.rows[i].cu || ''), colX(j) + cw / 2, y + rh / 2 + 9); } }); });
        const yt = T + rh * (body.length + 1); x.font = '600 12.5px ' + PFONT(); x.fillStyle = PCOL.ink; x.textAlign = 'left'; x.fillText(totRow[0], L + 8, yt + rh / 2); x.textAlign = 'center'; totRow.slice(1).forEach((v, j) => x.fillText(v, colX(j) + cw / 2, yt + rh / 2));
        x.strokeStyle = PCOL.line; x.lineWidth = 1; for (let i = 0; i <= body.length + 2; i++) { x.beginPath(); x.moveTo(L, T + rh * i); x.lineTo(W - 20, T + rh * i); x.stroke(); }
        x.strokeStyle = PCOL.ink; x.lineWidth = 1.4; x.beginPath(); x.moveTo(L, yt); x.lineTo(W - 20, yt); x.stroke(); x.beginPath(); x.moveTo(L, T + rh); x.lineTo(W - 20, T + rh); x.stroke();
        x.textAlign = 'left'; x.textBaseline = 'alphabetic'; x.font = '11.5px ' + PFONT(); x.fillStyle = PCOL.muted;
        const fy = T + rh * (body.length + 2) + 18; if (AU) foot.forEach((f, k) => x.fillText(f, L, fy + k * 16)); if (NL_.length) pDrawNotes(x, NL_, AU ? fy + foot.length * 16 + 8 : fy); });
      cv._data = {head: ['Component', ...(showSt ? ['Stock', 'Eind'] : []), ...hdr], rows: [...body, totRow].map((r, k) => { const row = r.map((v, q) => q && isFinite(num(v)) ? num(v) : v); return showSt ? [row[0], k < nr ? stTxt(k) : '', k < nr ? finTxt(k) : '', ...row.slice(1)] : row; })};
    }
  }
};
</script>
