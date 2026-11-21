<!-- ================= ELISA-PLAATANALYSE =================
     De berekening staat ongewijzigd in de computed m(): het plakken van de blokken, de
     blancocorrectie, de 4PL-fit met lmfit (500 iteraties) of de lineaire fit, het terugrekenen
     en het bereik. Alleen de weergave is opnieuw opgebouwd met de gedeelde componenten.

     De plaatontwerper (plateDesigner, zie src/engines/plate.js) is een widget van gewone DOM.
     Hij wordt in mounted() op #el-pld gezet, een leeg element waar Vue nooit kinderen in
     rendert. De plaatindeling in het tekstvak (#el-l) blijft de bron voor de berekening: de
     ontwerper vult dat vak en leest het terug. Zie ook elBlocks() in 94_elisa.js.

     De id's el-a, el-r, el-l, el-pld, el-renum, el-s, el-u, el-fit, el-d, el-cv, el-cv2 en
     el-out blijven zoals ze waren. -->
<template>
  <div class="stack">
    <div class="panel">
      <div class="fields">
        <div class="f" style="grid-column:1/-1">
          <label for="el-a">{{ t('Absorptie meetgolflengte (bijv. 450 nm), 8 rijen × 12 kolommen') }} <span class="example">{{ t('voorbeeld') }}</span></label>
          <textarea id="el-a" rows="8" class="mono" style="font-size:12px;white-space:pre;overflow-x:auto" v-model="a"></textarea>
        </div>
        <div class="f" style="grid-column:1/-1">
          <label for="el-r">{{ t('Referentiegolflengte (bijv. 570 of 620 nm), optioneel') }}</label>
          <textarea id="el-r" rows="3" class="mono" style="font-size:12px;white-space:pre;overflow-x:auto" v-model="r"></textarea>
        </div>
        <div class="f" style="grid-column:1/-1">
          <label for="el-l">{{ t('Plaatindeling: B = blanco, S1…Sn = standaard, M1…Mn = monster, leeg of - = niet gebruikt') }}</label>
          <textarea id="el-l" rows="8" class="mono" style="font-size:12px;white-space:pre;overflow-x:auto" v-model="l"></textarea>
        </div>
        <div class="f" style="grid-column:1/-1">
          <label>{{ t('Of wijs de wells aan op de plaat') }}</label>
          <div id="el-pld"></div>
          <div class="row" style="margin-top:8px">
            <button type="button" id="el-renum" @click="renum">{{ t('Replicaten opnieuw nummeren') }}</button>
            <span style="font-size:12.5px;color:var(--muted);max-width:60ch">{{ t('Putjes van dezelfde soort die aan elkaar grenzen zijn één replicaat en krijgen samen één nummer; de richting bepaalt of dat naast of onder elkaar is. Typ een naam in "Tekst per putje" om er zelf één te kiezen.') }}</span>
          </div>
        </div>
        <div class="f" style="grid-column:span 2">
          <label for="el-s">{{ t('Concentraties standaarden S1, S2, …') }}</label>
          <input id="el-s" class="txt" v-model="s">
        </div>
        <div class="f">
          <label for="el-u">{{ t('Eenheid') }}</label>
          <input id="el-u" class="txt" v-model="u">
        </div>
        <div class="f">
          <label for="el-fit">{{ t('Curve') }}</label>
          <select id="el-fit" v-model="fit">
            <option value="4pl">{{ t('4PL (vierparameter-logistisch)') }}</option>
            <option value="lin">{{ t('lineair') }}</option>
          </select>
        </div>
        <div class="f" style="grid-column:span 2">
          <label for="el-d">{{ t('Verdunningsfactoren monsters (bijv. M1=10 M3=50; standaard 1)') }}</label>
          <input id="el-d" class="txt" v-model="d">
        </div>
        <div class="f">
          <label for="el-cv">{{ t('Maximale CV van replicaten') }}</label>
          <div class="inu"><input id="el-cv" inputmode="decimal" v-model="cv"><span class="u">%</span></div>
        </div>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t("Plak het 8 × 12-blok rechtstreeks uit Excel of de export van de plaatlezer (tabs, spaties of puntkomma's; komma of punt als decimaalteken). Wells met dezelfde naam zijn replicaten. Voorbeelddata zijn verzonnen.") }}</p>
    </div>
    <div class="result">
      <canvas id="el-cv2" v-show="m.ok"></canvas>
      <div id="el-out">
        <lk-note v-if="!m.ok" kind="info">{{ m.err }}</lk-note>
        <template v-else>
          <lk-big :label="m.fitLabel" :value="m.r2Text"/>
          <lk-kv :rows="m.kv"/>
          <lk-table :cols="m.mCols" :rows="m.mRows"/>
          <lk-table :cols="m.sCols" :rows="m.sRows"/>
          <lk-note v-if="m.stBad" kind="warn">{{ t('Een standaard heeft een CV boven de grens; de curve is daardoor minder betrouwbaar.') }}</lk-note>
          <lk-formula :html="tHtml('A = (A&lt;sub&gt;meet&lt;/sub&gt; − A&lt;sub&gt;ref&lt;/sub&gt;) − blanco · c = c&lt;sub&gt;curve&lt;/sub&gt; × verdunning')"/>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

/* getallen in de taal van de gebruiker: de DOM-vertaallaag komt niet in een Vue-boom */
const F = (x, d) => lkNumIn(fmt(x, d)), G = (x, d) => lkNumIn(sig(x, d));

/* de voorbeelddata: dezelfde reeks als vroeger (hwRng(7)), nu de beginwaarde van de velden */
function demo() {
  const f = x => 0.06 + 2.4 / (1 + (x / 180) ** -1.15), S = [1000, 500, 250, 125, 62.5, 31.25, 15.625],
    smp = [52, 30, 18, 9, 41, 22, 6.5, 95], rnd = hwRng(7), A = [], L = [];
  for (let r = 0; r < 8; r++) {
    const a = [], l = [];
    for (let c = 0; c < 12; c++) {
      let v = NaN, n = '-';
      if (c < 2) { if (r < 7) { n = 'S' + (r + 1); v = f(S[r]); } else { n = 'B'; v = 0.06; } }
      else if (c < 4) { n = 'M' + (r + 1); v = f(smp[r]); }
      if (isFinite(v)) { v *= 1 + (rnd() - 0.5) * 0.05; if (n === 'M7' && c === 3) v *= 1.3; }
      a.push(isFinite(v) ? v.toFixed(3).replace('.', ',') : ''); l.push(n);
    }
    A.push(a.join('\t')); L.push(l.join('\t'));
  }
  return {a: A.join('\n'), l: L.join('\n')};
}

export default {
  name: 'Elisa',
  data() {
    const D = demo();
    return {
      a: lkNumIn(D.a), r: '', l: D.l,
      s: lkNumIn('1000 500 250 125 62,5 31,25 15,625'), u: 'pg/mL', fit: '4pl',
      d: 'M1=10 M2=10 M3=10 M4=10 M5=50 M6=50 M7=50 M8=50', cv: '10'
    };
  },
  computed: {
    /* alle maten van de plaat: één keer berekend, de rest van de component leest hieruit */
    m() {
      const t = this.t, fit = this.fit, un = this.u, cvmax = num(this.cv) || 10;
      const A = elGrid(this.a, true), R = elGrid(this.r, true), L = elGrid(this.l, false);
      const SC = numsC(this.s), DF = {};
      this.d.toUpperCase().split(/[\s;,]+(?=M)/).forEach(x => { const m = x.match(/^(M\d+)\s*[=:]\s*([\d.,eE+-]+)/); if (m) DF[m[1]] = num(m[2]); });
      const W = {}; let nw = 0;
      for (let r = 0; r < 8; r++) for (let c = 0; c < 12; c++) {
        const n = (L[r] || [])[c], a = (A[r] || [])[c];
        if (!n || n === '-' || !isFinite(a)) continue;
        const rf = (R[r] || [])[c];
        (W[n] = W[n] || []).push({w: 'ABCDEFGH'[r] + (c + 1), a: a - (isFinite(rf) ? rf : 0)}); nw++;
      }
      const fail = e => ({ok: false, err: e});
      if (!nw) return fail(t('Plak de absorpties en de plaatindeling (8 rijen × 12 kolommen).'));
      const blank = W.B ? mean(W.B.map(x => x.a)) : 0, grp = n => {
        const v = W[n].map(x => x.a - blank), m = mean(v), s = v.length > 1 ? sd(v) : NaN;
        return {n, v, m, cv: v.length > 1 && m !== 0 ? Math.abs(s / m) * 100 : NaN, wells: W[n].map(x => x.w).join(' ')};
      };
      const ST = Object.keys(W).filter(n => /^S\d+$/.test(n)).map(n => ({...grp(n), x: SC[+n.slice(1) - 1]})).filter(s => s.x > 0).sort((a, b) => a.x - b.x);
      if (ST.length < (fit === '4pl' ? 5 : 3)) return fail(fit === '4pl'
        ? t('Een 4PL-curve heeft minstens vijf standaarden met een concentratie nodig; kies lineair of vul de concentraties aan.')
        : t('Vul minstens drie standaarden met een concentratie in.'));
      let inv, fn, eq, r2; const xs = ST.map(s => s.x), ys = ST.map(s => s.m), my = mean(ys), sst = ys.reduce((a, y) => a + (y - my) ** 2, 0);
      if (fit === 'lin') {
        const LF = linreg(xs, ys); fn = x => LF.a + LF.b * x; inv = y => (y - LF.a) / LF.b; r2 = LF.r2;
        eq = `A = ${G(LF.b, 4)}·c ${LF.a < 0 ? '−' : '+'} ${G(Math.abs(LF.a), 3)}`;
      } else {
        const lo = Math.min(...ys), hi = Math.max(...ys), mid = xs[Math.floor(xs.length / 2)], f4 = (x, p) => p[1] + (p[0] - p[1]) / (1 + (x / Math.exp(p[2])) ** p[3]);
        const LM = lmfit(f4, [lo, hi * 1.1, Math.log(mid), 1], xs, ys, 500), p = LM.p, c = Math.exp(p[2]);
        if (!p.every(Number.isFinite)) return fail(t('De 4PL-fit convergeert niet; controleer de standaarden of kies lineair.'));
        fn = x => f4(x, p); inv = y => { const q = (p[0] - p[1]) / (y - p[1]) - 1; return q > 0 ? c * q ** (1 / p[3]) : NaN; };
        r2 = 1 - ys.reduce((a, y, i) => a + (y - fn(xs[i])) ** 2, 0) / sst;
        eq = `a = ${G(p[0], 3)} · d = ${G(p[1], 3)} · c = ${G(c, 4)} ${esc(un)} · b = ${G(p[3], 3)}`;
      }
      const yLo = Math.min(fn(xs[0]), fn(xs[xs.length - 1])), yHi = Math.max(fn(xs[0]), fn(xs[xs.length - 1]));
      const M = Object.keys(W).filter(n => /^M\d+$/.test(n)).sort((a, b) => +a.slice(1) - +b.slice(1)).map(n => {
        const g = grp(n), df = DF[n] > 0 ? DF[n] : 1, below = g.m < yLo, above = g.m > yHi, x = below || above ? NaN : inv(g.m);
        return {...g, df, x, c: x * df, below, above, bad: g.cv > cvmax};
      });
      const chip = (k, x) => `<span class="chip ${k}" style="vertical-align:middle;margin-left:4px">${x}</span>`,
        nflag = M.filter(m => m.bad || m.below || m.above).length;
      const un_ = esc(un);
      const kv = [[t('Parameters'), eq],
        [t('Blanco (gemiddeld)'), W.B ? `${F(blank, 3)} (n = ${W.B.length})` : t('geen blanco op de plaat')],
        [t('Meetbereik'), `${G(xs[0], 4)} – ${G(xs[xs.length - 1], 4)} ${un_}`],
        [t('Monsters met een opmerking'), t(`${nflag} van ${M.length}`)]];
      const mCols = [{h: t('Monster')}, {h: t('Wells')}, {h: t('Gem. A (gecorr.)'), num: true}, {h: t('CV (%)'), num: true},
        {h: t('Uit curve'), num: true}, {h: t('Verdunning'), num: true}, {h: t('Concentratie (' + uv(un_) + ')'), num: true}, {h: t('Opmerking')}];
      const mRows = M.map(m => [m.n, m.wells, F(m.m, 3), isFinite(m.cv) ? F(m.cv, 1) : '–',
        isFinite(m.x) ? G(m.x, 4) : '–', F(m.df, 1),
        isFinite(m.c) ? G(m.c, 4) : m.above ? '&gt; ' + G(xs[xs.length - 1] * m.df, 4) : m.below ? '&lt; ' + G(xs[0] * m.df, 4) : '–',
        (m.bad ? chip('warn', t('CV te hoog')) : '') + (m.above ? chip('bad', t('boven de curve')) : '') + (m.below ? chip('warn', t('onder de curve')) : '') || chip('ok', t('in orde'))]);
      const sCols = [{h: t('Standaard')}, {h: t('Concentratie'), num: true}, {h: t('Gem. A (gecorr.)'), num: true}, {h: t('CV (%)'), num: true},
        {h: t('Teruggerekend'), num: true}, {h: t('Terugvinding (%)'), num: true}];
      const sRows = ST.map(s => { const b = inv(s.m); return [s.n, G(s.x, 4), F(s.m, 3), isFinite(s.cv) ? F(s.cv, 1) : '–',
        isFinite(b) ? G(b, 4) : '–', isFinite(b) ? F(b / s.x * 100, 0) : '–']; });
      return {ok: true, W, ST, M, xs, ys, fn, fit, kv, mCols, mRows, sCols, sRows,
        stBad: ST.some(s => s.cv > cvmax),
        fitLabel: fit === '4pl' ? t('Kalibratiecurve (4PL)') : t('Kalibratiecurve (lineair)'),
        r2Text: 'R² = ' + F(r2, 4)};
    }
  },
  mounted() {
    /* de plaatontwerper: gewone DOM op het lege #el-pld; Vue komt er niet in */
    this._pld = null; this._sync = false; this._echo = null;
    this._pld = plateDesigner(document.getElementById('el-pld'), {
      fmt: '8x12', groups: ELGRP, autoLabel: elBlocks, name: () => trPlain('ELISA-plaatanalyse'),
      onChange: () => { this.toText(); }
    });
    /* de ontwerper bouwt zijn DOM voordat de vertaallaag meeloopt; vertaal die nu eenmalig */
    if (LANG === 'en' && typeof i18nWalk === 'function') i18nWalk(document.getElementById('el-pld'));
    this.toPlate();
    this.draw();
  },
  updated() { this.draw(); },
  watch: {
    /* tekstvak -> plaat; de echo van een wijziging die de plaat zelf net schreef slaan we over */
    l(v) { if (v === this._echo) { this._echo = null; return; } this.toPlate(); }
  },
  methods: {
    /* plaat -> tekstvak */
    toText() {
      const P = this._pld; if (!P || this._sync) return;
      const st = P.get(), lab = P.labels().lab, rows = [];
      for (let i = 0; i < 8; i++) {
        const row = [];
        for (let j = 1; j <= 12; j++) { const k = 'ABCDEFGH'[i] + j; row.push(elName({vals: st.vals}, lab, k) || '-'); }
        rows.push(row.join('\t'));
      }
      const txt = rows.join('\n');
      if (txt !== this.l) { this._echo = txt; this.l = txt; }
    },
    /* tekstvak -> plaat */
    toPlate() {
      const P = this._pld; if (!P || this._sync) return;
      const L = elGrid(this.l, false), wells = {}, vals = {};
      for (let i = 0; i < 8; i++) for (let j = 0; j < 12; j++) {
        const n = ((L[i] || [])[j] || '').trim(); if (!n || n === '-') continue;
        const g = ELKIND.indexOf(n.charAt(0)); if (g < 0) continue;
        wells['ABCDEFGH'[i] + (j + 1)] = g; vals['ABCDEFGH'[i] + (j + 1)] = n;
      }
      this._sync = true; try { P.set({fmt: '8x12', wells, vals, groups: ELGRP}); } finally { this._sync = false; }
    },
    renum() {
      const P = this._pld; if (!P) return; const st = P.get();
      this._sync = true; try { P.set({fmt: st.fmt, wells: st.wells, vals: {}, groups: st.groups}); } finally { this._sync = false; }
      this.toText();
    },
    draw() {
      const cv = document.getElementById('el-cv2'), m = this.m; if (!cv || !m.ok) return;
      const {ST, M, xs, ys, fn, fit} = m, un = this.u, ok = M.filter(x => isFinite(x.x));
      chart(cv, {logx: fit === '4pl', xmin: fit === '4pl' ? xs[0] / 2 : 0, xmax: xs[xs.length - 1] * (fit === '4pl' ? 1.5 : 1.08),
        ymin: Math.min(0, ...ys), ymax: Math.max(...ys, ...M.map(x => x.m)) * 1.1,
        xlabel: `concentratie (${uv(un)})`, ylabel: 'absorptie (gecorrigeerd)',
        series: [{fn, name: 'fit'}, {pts: ST.flatMap(s => s.v.map(v => [s.x, v])), color: '--ink', name: 'standaarden'},
          {pts: ok.map(x => [x.x, x.m]), color: '--warn', hollow: true, name: 'monsters'}]});
    }
  }
};
</script>
