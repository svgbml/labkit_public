<!-- ================= qPCR-ANALYSE (ΔΔCt) =================
     De Ct-tabel staat in een <lk-etable> (zelfde kolommen als de oude qpRow), de rijen in de
     component. De id's qp-et, qp-er, qp-cal, qp-m, qp-tbl, qp-add, qp-imp, qp-refname, qp-impgo,
     qp-impmsg, qp-cv en qp-res blijven zoals ze waren (de host heet #qpc-app, want #qp-app is
     van de plaatindeling). De rekenregels zijn ongewijzigd uit de oude calc.qpcr overgenomen;
     barChart() blijft een global in web/index.html. Het inlezen van een Ct-export (vroeger
     qpImport) is nu de methode doImport(). -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <lk-field v-model="et" :label="t('Efficiëntie doelgen')" for-id="qp-et" unit="%" data-expert=""/>
        <lk-field v-model="er" :label="t('Efficiëntie referentiegen')" for-id="qp-er" unit="%" data-expert=""/>
        <div class="f"><label for="qp-cal">{{ t('Kalibrator (controle)') }}</label>
          <select id="qp-cal" style="width:100%" v-model="calSel">
            <option v-for="g in m.groups" :key="g.n" :value="g.n">{{ g.n }}</option>
          </select></div>
        <div class="f"><label for="qp-m">{{ t('Grafiek toont') }}</label>
          <select id="qp-m" style="width:100%" v-model="mode">
            <option value="auto">{{ t('Automatisch') }}</option>
            <option value="livak">{{ t('2^−ΔΔCt (Livak)') }}</option>
            <option value="pfaffl">{{ t('Pfaffl') }}</option>
          </select></div>
      </div>
      <h3 style="margin-top:16px" v-html="tHtml('Ct-waarden <span class=&quot;example&quot;>voorbeeld</span>')"></h3>
      <lk-etable table-id="qp-tbl" :cols="cols" v-model:rows="rows" add-id="qp-add"/>
      <div class="row" style="margin-top:10px"><button type="button" id="qp-add" @click="addRow">{{ t('+ Rij') }}</button></div>
      <details style="margin-top:12px"><summary style="cursor:pointer;font-weight:600;font-size:13.5px">{{ t('Ct-export van het qPCR-apparaat inlezen') }}</summary>
        <div class="f" style="margin-top:8px"><label for="qp-imp">{{ t('Plak de export (kolommen monster, target en Ct of Cq; met kopregel)') }}</label>
          <textarea id="qp-imp" rows="5" spellcheck="false" v-model="imp" :placeholder="placeholder"></textarea></div>
        <div class="row" style="margin-top:6px;gap:8px;align-items:center"><input type="file" id="qp-impfile" accept=".csv,.txt,.tsv" @change="onImpFile"><span style="font-size:12.5px;color:var(--muted)">{{ t('Herkent de exports van Bio-Rad CFX, QuantStudio en LightCycler; anders een tabel met kopregel.') }}</span></div>
        <div class="row" style="margin-top:8px">
          <div class="f" data-expert=""><label for="qp-refname">{{ t('Naam referentiegen in de export') }}</label>
            <input id="qp-refname" class="txt" v-model="refname" style="width:140px"></div>
          <button type="button" id="qp-impgo" style="align-self:flex-end" @click="doImport">{{ t('Inlezen') }}</button>
        </div>
        <div id="qp-impmsg"><lk-note v-if="impMsg" :kind="impMsg.kind" :html="impMsg.html"/></div>
      </details>
      <details style="margin-top:12px"><summary style="cursor:pointer;font-weight:600;font-size:13.5px">{{ t('Efficiëntie uit een standaardcurve (verdunningsreeks)') }}</summary>
        <div class="f" style="margin-top:8px"><label for="qp-sc">{{ t('Plak per regel: hoeveelheid of verdunningsfactor, Ct doelgen, Ct referentiegen (optioneel)') }}</label>
          <textarea id="qp-sc" rows="5" spellcheck="false" v-model="sc" :placeholder="scPlaceholder"></textarea></div>
        <div class="row" style="margin-top:8px;gap:8px;align-items:flex-end">
          <div class="f"><label for="qp-sc-k">{{ t('Eerste kolom is') }}</label>
            <select id="qp-sc-k" v-model="scKind"><option value="q">{{ t('hoeveelheid') }}</option><option value="d">{{ t('verdunningsfactor') }}</option></select></div>
          <button type="button" id="qp-sc-use" :disabled="!scOk" @click="useSc">{{ t('Gebruik in Pfaffl') }}</button>
        </div>
        <div id="qp-sc-res">
          <lk-note v-if="!scOk" kind="info">{{ t('Minstens drie regels met een hoeveelheid boven nul en een Ct nodig.') }}</lk-note>
          <template v-else>
            <lk-big v-if="scRes.t" :label="t('Efficiëntie doelgen')" :value="F(scRes.t.eff, 1) + ' %'"/>
            <lk-range v-if="scRes.t" :what="t('Efficiëntie doelgen')" :value="scRes.t.eff" :lo="90" :hi="110" :digits="0" unit="%" :low="t('Controleer primerontwerp, remmers en pipetteerwerk.')" :high="t('Dat wijst vaak op remming in de geconcentreerde standaarden, primer-dimeren of pipetteerfouten in de reeks.')" :ok="t('Goed genoeg voor de ΔΔCt-methode.')"/>
            <lk-table :cols="scCols" :rows="scRows"/>
          </template>
        </div>
      </details>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0" v-html="hint"></p>
    </div>
    <div class="result"><canvas id="qp-cv"></canvas>
      <div id="qp-res">
        <lk-note v-if="!m.ok" kind="info">{{ t('Vul Ct-waarden in voor minstens twee monsters (kalibrator en een testmonster).') }}</lk-note>
        <template v-else>
          <div class="lbl" style="margin-top:8px" v-html="bigLabel"></div>
          <lk-big :html="bigHtml"/>
          <lk-table :cols="outCols" :rows="outRows"/>
          <lk-note v-for="(w, i) in warnings" :key="i" kind="warn">{{ w }}</lk-note>
          <lk-note v-if="m.fewReps" kind="info">{{ t('Minder dan 3 herhalingen per monster: de spreiding is onbetrouwbaar.') }}</lk-note>
          <lk-formula :html="formula"/>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => lkNumIn(fmt(x, d)), S = (x, d) => lkNumIn(sig(x, d));
const PH_NL = 'Sample\tTarget\tCq\nControle\tGAPDH\t20,1', PH_EN = 'Sample\tTarget\tCq\nControl\tGAPDH\t20.1';

export default {
  name: 'Qpcr',
  data() {
    return {
      et: '100', er: '100', cal: '', mode: 'auto',
      rows: [[trPlain('Controle'), lkNumIn('23,9'), '20'], [trPlain('Controle'), '24', lkNumIn('20,1')], [trPlain('Controle'), lkNumIn('24,1'), lkNumIn('19,9')],
        [trPlain('Behandeld'), lkNumIn('21,4'), lkNumIn('20,2')], [trPlain('Behandeld'), lkNumIn('21,5'), lkNumIn('20,1')], [trPlain('Behandeld'), lkNumIn('21,6'), lkNumIn('20,3')]],
      imp: '', refname: 'GAPDH', impMsg: null, sc: '', scKind: 'q'
    };
  },
  computed: {
    cols() {
      const t = this.t;
      return [{h: t('Monster'), t: 'txt', w: 130}, {h: t('Ct doelgen'), t: 'num', w: 80},
        {h: t('Ct referentiegen'), t: 'num', w: 80}];
    },
    scPlaceholder() { return lkNumIn('100000\t15,0\t16,1\n10000\t18,3\t16,0\n1000\t21,6\t16,1'); },
    /* helling door lineaire regressie van Ct tegen log10(hoeveelheid); E = 10^(−1/helling) − 1 (Pfaffl 2001; MIQE) */
    scRes() {
      const L = this.sc.split('\n').map(l => l.trim().split(/[\t;]|\s+/).map(num)).filter(c => c[0] > 0);
      const fit = k => {
        const P = L.filter(c => isFinite(c[k])); if (P.length < 3) return null;
        const r = linreg(P.map(c => Math.log10(c[0]) * (this.scKind === 'd' ? -1 : 1)), P.map(c => c[k]));
        return {b: r.b, r2: r.r2, eff: (10 ** (-1 / r.b) - 1) * 100};
      };
      return {t: fit(1), r: fit(2)};
    },
    scOk() { const r = this.scRes; return !!(r.t && isFinite(r.t.eff)); },
    scCols() { const t = this.t; return [{h: ''}, {h: t('Helling'), num: true}, {h: 'R²', num: true}, {h: t('Efficiëntie'), num: true}]; },
    scRows() { const t = this.t, r = this.scRes; return [[t('Doelgen'), r.t], [t('Referentiegen'), r.r]].filter(x => x[1]).map(([n, g]) => [n, F(g.b, 3), F(g.r2, 4), F(g.eff, 1) + ' %']); },
    placeholder() { return typeof LANG !== 'undefined' && LANG === 'en' ? PH_EN : PH_NL; },
    hint() {
      return this.tHtml('Efficiëntie haal je uit een verdunningsreeks (PCR-cyclus → qPCR-efficiëntie). Laat beide op 100% voor de klassieke 2<sup>−ΔΔCt</sup>.');
    },
    /* alle metingen en uitkomsten; de rest leest hier alleen uit */
    m() {
      const eT = num(this.et) || 100, eR = num(this.er) || 100, Et = 1 + eT / 100, Er = 1 + eR / 100;
      const groups = [], byName = {};
      this.rows.forEach(r => {
        const n = (r[0] || '').trim(), t = num(r[1]), rf = num(r[2]);
        if (!n || !isFinite(t) || !isFinite(rf)) return;
        if (!byName[n]) { byName[n] = {n, t: [], r: []}; groups.push(byName[n]); }
        byName[n].t.push(t); byName[n].r.push(rf);
      });
      if (groups.length < 2) return {ok: false, groups, eT, eR};
      groups.forEach(g => { g.mt = mean(g.t); g.mr = mean(g.r); const d = g.t.map((t, i) => t - g.r[i]); g.dct = mean(d); g.sd = sd(d); g.n2 = d.length; });
      const cal = byName[this.cal] || groups[0];
      /* S110: t-toets van Welch op de ΔCt-waarden van elk monster tegen de kalibrator (Yuan e.a.,
         BMC Bioinformatics 7:85, 2006); alleen met minstens twee replicaten aan beide kanten */
      groups.forEach(g => {
        if (g === cal || g.n2 < 2 || cal.n2 < 2) return;
        const a = g.sd ** 2 / g.n2, b = cal.sd ** 2 / cal.n2, se2 = a + b; if (!(se2 > 0)) return;
        const tv = (g.dct - cal.dct) / Math.sqrt(se2), df = se2 ** 2 / (a ** 2 / (g.n2 - 1) + b ** 2 / (cal.n2 - 1));
        g.p = 2 * (1 - tcdf(Math.abs(tv), df));
      });
      groups.forEach(g => { g.ddct = g.dct - cal.dct; g.fc = 2 ** (-g.ddct); g.lo = 2 ** (-(g.ddct + g.sd)); g.hi = 2 ** (-(g.ddct - g.sd)); g.pf = Et ** (cal.mt - g.mt) / Er ** (cal.mr - g.mr); });
      const usePf = this.mode === 'pfaffl' || (this.mode === 'auto' && (eT !== 100 || eR !== 100));
      return {ok: true, groups, cal, eT, eR, usePf, test: groups.filter(g => g !== cal),
        fewReps: groups.some(g => g.t.length < 3)};
    },
    /* de keuzelijst valt terug op het eerste monster als het gekozen monster er niet meer is */
    calSel: {
      get() { const g = this.m.groups; return g.some(x => x.n === this.cal) ? this.cal : (g.length ? g[0].n : ''); },
      set(v) { this.cal = v; }
    },
    bigLabel() { const {test, cal} = this.m; return this.tHtml(ud(test[0].n) + ' t.o.v. ' + ud(cal.n)); },
    bigHtml() {
      const {usePf, test} = this.m;
      return S(usePf ? test[0].pf : test[0].fc, 3) + '<small>× ' + (usePf ? '(Pfaffl)' : '(2<sup>−ΔΔCt</sup>)') + '</small>';
    },
    outCols() {
      const t = this.t;
      return [{h: t('Monster')}, {h: 'n', num: true}, {h: t('Ct doel'), num: true}, {h: t('Ct ref'), num: true},
        {h: 'ΔCt', num: true}, {h: 'SD', num: true}, {h: 'ΔΔCt', num: true}, {h: '2^−ΔΔCt', num: true},
        {h: t('Bereik'), num: true}, {h: 'Pfaffl', num: true}, {h: 'log₂ FC', num: true}, {h: t('p (Welch)'), num: true}];
    },
    outRows() {
      const {groups, cal, usePf} = this.m;
      return groups.map(g => ({
        cls: g === cal ? 'dim' : null,
        cells: [g === cal ? this.tHtml(ud(g.n) + ' (kalibrator)') : esc(g.n), lkNumIn(g.t.length), F(g.mt, 2), F(g.mr, 2), F(g.dct, 2),
          g.t.length > 1 ? F(g.sd, 2) : '', F(g.ddct, 2), S(g.fc, 3),
          g.t.length > 1 ? S(g.lo, 3) + ' – ' + S(g.hi, 3) : '', S(g.pf, 3), F(Math.log2(usePf ? g.pf : g.fc), 2),
          g.p != null ? S(g.p, 2) + ' ' + stStars(g.p, 0.05) : '']
      }));
    },
    warnings() {
      const w = [];
      [['doelgen', this.m.eT], ['referentiegen', this.m.eR]].forEach(([k, e]) => {
        if (e < 90 || e > 110) w.push(this.t(`Efficiëntie ${k} ${fmt(e, 0)}% valt buiten 90–110%; gebruik de Pfaffl-uitkomst en controleer de assay.`));
      });
      return w;
    },
    formula() { return this.tHtml('Bereik = 2<sup>−(ΔΔCt ± SD)</sup>; doe statistiek op ΔCt-waarden, niet op fold changes.'); }
  },
  mounted() { this.draw(); },
  updated() { this.draw(); },
  methods: {
    F,
    useSc() { const r = this.scRes; if (r.t) this.et = lkNumIn(fmt(r.t.eff, 1)); if (r.r) this.er = lkNumIn(fmt(r.r.eff, 1)); },
    addRow() { this.rows = [...this.rows, ['', '', '']]; },
    draw() {
      const cv = document.getElementById('qp-cv'), m = this.m; if (!cv || !m.ok) return;
      const {groups, cal, usePf} = m;
      barChart(cv, groups.map(g => g.n), groups.map(g => usePf ? g.pf : g.fc), groups.map(g => usePf ? NaN : g.lo), groups.map(g => usePf ? NaN : g.hi),
        {ylabel: this.t(usePf ? 'relatieve expressie (Pfaffl)' : 'fold change (2^−ΔΔCt)'), cal: cal.n,
          stars: groups.map(g => (g.p != null ? stStars(g.p, 0.05) : ''))});
    },
    /* een Ct-export van het apparaat: kolommen monster, target en Ct/Cq, met kopregel */
    doImport() {
      const note = (kind, html) => { this.impMsg = {kind, html}; };
      const txt = this.imp, ref = this.refname.trim().toLowerCase();
      const lines = txt.replace(/\r/g, '').split('\n').filter(l => l.trim());
      if (lines.length < 2) { note('info', this.t('Plak de export met kopregel.')); return; }
      /* S93: de exports van CFX, QuantStudio en LightCycler eerst (src/lib/qpcrread.js), anders de kopregel */
      const Q = qpcrRead(txt);
      const recs = Q.recs.length ? Q.recs.map(r => ({s: r.s, t: String(r.t).toLowerCase(), ct: r.ct})) : this.headerRecs(lines, note);
      if (!recs) return;
      const FMT = {cfx: 'Bio-Rad CFX', quantstudio: 'QuantStudio', lightcycler: 'LightCycler'};
      const fmtNote = Q.format ? this.t('Herkend als ' + this.uv(FMT[Q.format]) + '.') + ' ' + (Q.undet ? this.t(Q.undet + ' putje(s) zonder Ct overgeslagen.') + ' ' : '') : '';
      const targets = [...new Set(recs.map(r => r.t))];
      if (!ref || !targets.includes(ref)) { note('bad', this.tHtml('Referentiegen niet gevonden. Gevonden targets: ' + ud(targets.join(', ')) + '.')); return; }
      const tgt = targets.find(t => t !== ref), by = {};
      recs.forEach(r => { (by[r.s] = by[r.s] || {})[r.t] = (by[r.s][r.t] || []).concat(r.ct); });
      const rows = [];
      Object.entries(by).forEach(([s, o]) => {
        const a = o[tgt] || [], b = o[ref] || [];
        for (let i = 0; i < Math.max(a.length, b.length); i++) rows.push([s, a[i] ?? (a.length ? mean(a) : NaN), b[i] ?? (b.length ? mean(b) : NaN)]);
      });
      const dec = v => (v == null || v === '' || (typeof v === 'number' && !isFinite(v)) ? '' : String(v).replace('.', ','));
      this.rows = rows.map(r => [String(r[0]), dec(r[1]), dec(r[2])]);
      note('info', esc(fmtNote) + this.tHtml(rows.length + ' rijen ingelezen: doelgen "' + ud(tgt) + '", referentiegen "' + ud(ref) + '".'));
    },
    /* de oude herkenning: een kopregel met monster, target en Ct/Cq */
    headerRecs(lines, note) {
      const sp = l => l.includes('\t') ? l.split('\t') : l.includes(';') ? l.split(';') : l.split(',');
      let hi = lines.findIndex(l => /(ct|cq)/i.test(l) && /(sample|monster|naam|name)/i.test(l)); if (hi < 0) hi = 0;
      const H = sp(lines[hi]).map(h => h.trim().toLowerCase());
      const ci = H.findIndex(h => /^(ct|cq|c[tq] mean|ct value|cq value)$/.test(h)) >= 0 ? H.findIndex(h => /^(ct|cq|c[tq] mean|ct value|cq value)$/.test(h)) : H.findIndex(h => /\b(ct|cq)\b/.test(h)),
        si = H.findIndex(h => /(sample|monster|naam|name)/.test(h)), ti = H.findIndex(h => /(target|detector|gen|gene|doel)/.test(h));
      if (ci < 0 || si < 0 || ti < 0) { note('bad', this.t('Kolommen voor monster, target en Ct/Cq niet gevonden in de kopregel.')); return null; }
      return lines.slice(hi + 1).map(l => sp(l).map(x => x.trim())).map(c => ({s: c[si], t: (c[ti] || '').toLowerCase(), ct: num(String(c[ci]).replace(/undetermined|n\/a/i, ''))})).filter(r => r.s && isFinite(r.ct));
    },
    onImpFile(e) { const f = e.target.files[0]; if (f) f.text().then(t => { this.imp = t; }); }
  }
};
</script>
