<!-- ================= VERDUNNING =================
     C₁·V₁ = C₂·V₂ met één leeg veld. Welk veld leeg is bepaalt wat er gerekend wordt, dus de
     velden zijn tekst en niet een getal: "leeg" is hier een betekenisvolle waarde.

     DCU (welke eenheden in elkaar om te rekenen zijn) en pipAdviesDeel() blijven in
     web/index.html staan; de reeksplanner en een paar andere tools gebruiken die ook.
     De id's d-c1, d-c1u, d-c2, d-c2u, d-v1, d-v1u, d-v2, d-v2u en d-out blijven zoals ze waren. -->
<template>
  <div class="stack">
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <div class="f" style="grid-column:1/-1">
          <label for="d-mode">{{ t('Soort berekening') }}</label>
          <select id="d-mode" style="width:100%" v-model="mode">
            <option value="een">{{ t('Eén verdunning') }}</option>
            <option value="reeks">{{ t('Verdunningsreeks') }}</option>
            <option value="batch">{{ t('Meerdere monsters (batch)') }}</option>
          </select>
        </div>
        <div class="f" v-for="f in conc" :key="f.id">
          <label :for="f.id">{{ t(f.label) }}</label>
          <div class="inu">
            <input :id="f.id" inputmode="decimal" v-model="v[f.id]">
            <select :id="f.id + 'u'" v-model="v[f.id + 'u']" :aria-label="t(f.unitLabel)">
              <option v-for="u in concUnits" :key="u">{{ u }}</option>
            </select>
          </div>
        </div>
        <div v-if="batch" class="f" style="grid-column:1/-1">
          <label for="d-batch">{{ t('Monsters: naam en stockconcentratie per regel') }}</label>
          <textarea id="d-batch" rows="6" v-model="b" style="width:100%" :placeholder="btPh"></textarea>
        </div>
        <template v-if="reeks">
          <lk-field v-model="s.f" :label="t('Factor per stap')" for-id="ds-f"/>
          <lk-field v-model="s.n" :label="t('Aantal stappen')" for-id="ds-n" inputmode="numeric"/>
          <lk-field v-model="s.v" :label="t('Volume per buis')" for-id="ds-v" unit="µL"/>
        </template>
        <div class="f" v-for="f in vols" :key="f.id">
          <label :for="f.id">{{ t(f.label) }}</label>
          <div class="inu">
            <input :id="f.id" inputmode="decimal" v-model="v[f.id]" :placeholder="t('berekenen')">
            <select :id="f.id + 'u'" v-model="v[f.id + 'u']" :aria-label="t(f.unitLabel)">
              <option v-for="u in volUnits" :key="u">{{ u }}</option>
            </select>
          </div>
        </div>
      </div>
      <p v-if="batch" class="note info">{{ t('Plak een kolom of twee kolommen uit Excel. Zonder eenheid achter het getal geldt de eenheid van C₂.') }}</p>
      <p v-else-if="!reeks" class="note info">{{ t('Voorbeeld: 50X TAE naar 500 mL 1X loopbuffer.') }}</p>
      <p v-else class="note info">{{ t('Voor een tekening met labels, uitplaten en een afdrukbaar schema: zie Verdunningsschema.') }}</p>
    </div>
    <div v-if="batch" class="result" id="d-out">
      <lk-note v-if="bt.err" kind="info">{{ t('Vul C₂, het eindvolume en minstens één monster in.') }}</lk-note>
      <template v-else>
        <lk-table table-id="d-btbl" :cols="btCols" :rows="bt.rows"/>
        <lk-note v-if="bt.low" kind="warn">{{ t('Een monster onder C₂ kun je niet verdunnen: gebruik het onverdund of concentreer het eerst.') }}</lk-note>
      </template>
    </div>
    <div v-else-if="reeks" class="result" id="d-out">
      <lk-note v-if="sr.bad" kind="bad">{{ t('Factor moet groter dan 1 zijn en het volume groter dan 0.') }}</lk-note>
      <template v-else>
        <lk-table :cols="srCols" :rows="srRows"/>
        <div style="overflow-x:auto;margin-top:12px"><svg :viewBox="'0 0 ' + sw + ' 150'" :style="{display: 'block', width: sw + 'px', height: '150px'}" role="img" :aria-label="t('Verdunningsreeks')">
          <g v-for="(b, i) in srTubes" :key="i" v-html="tube(b, i, sw / srTubes.length)"></g>
        </svg></div>
      </template>
    </div>
    <div v-else class="result" id="d-out">
      <div class="lbl">{{ solved ? solved.label : t('Resultaat') }}</div>
      <div v-if="solved" class="big">{{ solved.value }}</div>
      <lk-note v-if="problem" :kind="problem.kind">{{ problem.text }}</lk-note>
      <template v-if="ok">
        <lk-kv :rows="rows"/>
        <lk-note v-if="pip" :kind="pip.kind" :html="pipHtml"/>
        <lk-steps :steps="steps"/>
        <!-- geen t(): deze regel heeft geen woord van twee letters, dus de vertaallaag heeft
             er nooit een sleutel voor gemaakt en er is niets te vertalen -->
        <lk-formula html="V₁ = C₂ × V₂ / C₁"/>
        <lk-report tool="verdunning" :sentence="method" :answer="check.a" :unit="check.u" :units="checkUnits" :sheet="sheet" :digits="4"/>
        <div style="overflow-x:auto;margin-top:12px"><svg viewBox="0 0 240 150" style="display:block;width:240px;height:150px" role="img" :aria-label="t('Stock en eindverdunning')">
          <g v-for="(b, i) in tubes" :key="i" v-html="tube(b, i, 120)"></g>
        </svg></div>
      </template>
    </div>
  </div>
  <div class="grid2">
    <div class="panel">
      <h3 style="font-size:15px;margin:0 0 10px">{{ t('Antistofverdunning') }}</h3>
      <div class="fields">
        <div class="f">
          <label for="ab-d">{{ t('Verdunning volgens datasheet') }}</label>
          <div class="inu"><span class="u" style="margin-right:6px">1 :</span><input id="ab-d" inputmode="decimal" v-model="ab.d"></div>
        </div>
        <div class="f">
          <label for="ab-v">{{ t('Volume per blot of putje') }}</label>
          <div class="inu">
            <input id="ab-v" inputmode="decimal" v-model="ab.v">
            <select id="ab-u" v-model="ab.u" :aria-label="t('Eenheid volume')"><option>mL</option><option>µL</option></select>
          </div>
        </div>
        <lk-field v-model="ab.k" :label="t('Aantal blots of putjes')" for-id="ab-k" inputmode="numeric"/>
        <lk-overage v-model="ab.ov" for-id="ab-ov" :why="abm.why" style="grid-column:span 2"/>
        <lk-field v-model="ab.x" :label="t('Extra marge')" for-id="ab-x" unit="%"/>
      </div>
      <p style="font-size:12px;color:var(--muted);margin:8px 0 0">{{ t('Bron: berekening C₁V₁ = C₂V₂ met de verdunning uit het datasheet.') }}</p>
    </div>
    <div class="result" id="ab-out">
      <lk-note v-if="abm.err === 1" kind="info">{{ t('Vul de verdunning, het volume en het aantal in.') }}</lk-note>
      <lk-note v-else-if="abm.err === 2" kind="bad">{{ t('De verdunning moet minstens 1 : 1 zijn.') }}</lk-note>
      <template v-else>
        <lk-big :label="t('Antistof')" :html="abBig"/>
        <lk-kv :rows="abRows"/>
        <lk-note kind="info">{{ t('Verdun in de buffer die het datasheet noemt, bijvoorbeeld 5% BSA of 5% melk in TBS-T. Maak een aliquot van wat je niet gebruikt.') }}</lk-note>
      </template>
    </div>
  </div>
  </div>
</template>

<script>
import {pipHtml as pipTag} from '../lib/pip.js';
import {lkNumIn} from '../lib/bridge.js';
import {overage} from '../lib/overage.js';
import {serie} from './Verdunningsschema.vue';

/* een volume met vijf cijfers als het in mL staat, zodat 21,978 mL niet 21,98 mL wordt */
const volP = uL => (isFinite(uL) && Math.abs(uL) >= 1000 ? sig(uL / 1000, 5) + ' mL' : vol(uL));

const CU = ['X', 'M', 'mM', 'µM', 'nM', 'g/L', 'mg/mL', 'µg/mL', 'ng/µL', '%', 'U/µL', 'U/mL'];
const VU = ['µL', 'mL', 'L'];
const UV = {'µL': 1, 'mL': 1000, 'L': 1e6};
const CONC = [{id: 'd-c1', label: 'Stock C₁', unitLabel: 'Eenheid C₁'},
  {id: 'd-c2', label: 'Gewenst C₂', unitLabel: 'Eenheid C₂'}];
const VOLS = [{id: 'd-v1', label: 'Volume stock V₁', unitLabel: 'Eenheid V₁'},
  {id: 'd-v2', label: 'Eindvolume V₂', unitLabel: 'Eenheid V₂'}];

export default {
  name: 'Verdunning',
  data() {
    return {v: {'d-c1': '50', 'd-c1u': 'X', 'd-c2': '1', 'd-c2u': 'X',
      'd-v1': '', 'd-v1u': 'mL', 'd-v2': '500', 'd-v2u': 'mL'},
    mode: 'een', b: '', s: {f: '10', n: '5', v: '1000'},
    ab: {d: '1000', v: '10', u: 'mL', k: '2', ov: 'pct', x: '10'}};
  },
  methods: {
    lkNumIn, vol,
    /* één buis als SVG-tekst: vloeistofhoogte b.l (0..1 van de buis), labels eronder; kleuren uit het thema */
    tube(b, i, w) {
      const x = w * i + w / 2 - 15, e = esc, id = 'dtc' + this.mode + i;
      const y = 105 - Math.max(b.l, b.l > 0 ? 0.06 : 0) * 85;   /* een klein volume blijft zichtbaar */
      return `<clipPath id="${id}"><path d="M${x} 20V90a15 15 0 0 0 30 0V20z"/></clipPath>`
        + `<rect x="${x}" y="${y}" width="30" height="${105 - y}" clip-path="url(#${id})" fill="var(--accent)" opacity="${b.o}"/>`
        + `<path d="M${x} 20V90a15 15 0 0 0 30 0V20" fill="none" stroke="var(--ink)" stroke-width="1.5"/>`
        + `<text x="${x + 15}" y="14" text-anchor="middle" font-size="11" font-weight="600" fill="var(--ink)">${e(b.a)}</text>`
        + (b.b ? `<text x="${x + 15}" y="124" text-anchor="middle" font-size="11" fill="var(--ink)">${e(b.b)}</text>` : '')
        + (b.c ? `<text x="${x + 15}" y="140" text-anchor="middle" font-size="11" fill="var(--ink)">${e(b.c)}</text>` : '');
    }
  },
  watch: {
    /* Een eenheid voor C₁ van een andere soort kiezen trok in de oude versie de eenheid van C₂
       mee, zodat de twee altijd vergelijkbaar bleven. Dat blijft zo; omgekeerd niet, want dan
       kon je nooit bewust twee soorten naast elkaar zetten. */
    'v.d-c1u'(u) {
      if (DCU[this.v['d-c2u']][0] !== DCU[u][0]) this.v['d-c2u'] = u;
    }
  },
  computed: {
    /* antistofverdunning: totaal = V × overmaatfactor, antistof = totaal / N, buffer = rest */
    abm() {
      const a = this.ab, N = num(a.d), V = num(a.v) * (a.u === 'mL' ? 1000 : 1), k = num(a.k);
      const {mult, why} = overage(k || 0, a.ov, num(a.x) || 0);
      if (!(N > 0) || !(V > 0) || !(k > 0)) return {err: 1, why};
      if (N < 1) return {err: 2, why};
      const tot = V * mult, ab = tot / N;
      return {err: 0, why, tot, ab, buf: tot - ab, mult};
    },
    abRows() {
      const t = this.t, m = this.abm;
      return [[t('Buffer'), lkNumIn(volP(m.buf)) + pipTag(m.buf)], [t('Totaal volume'), lkNumIn(volP(m.tot))],
        [t('Vermenigvuldigingsfactor'), lkNumIn(fmt(m.mult, 2)) + '×']];
    },
    reeks() { return this.mode === 'reeks'; },
    batch() { return this.mode === 'batch'; },
    conc() { return this.reeks ? CONC.slice(0, 1) : this.batch ? CONC.slice(1) : CONC; },
    /* reeksmodus: C₁ (met eenheid) is de stock; de rekenregels staan in serie() van het Verdunningsschema */
    sr() {
      const f = num(this.s.f), n = Math.max(1, Math.min(10, Math.round(num(this.s.n) || 1))), V = num(this.s.v);
      if (!(f > 1) || !(V > 0)) return {bad: true};
      return {bad: false, f, n, V, c: num(this.v['d-c1']), u: this.v['d-c1u'], ...serie(f, V)};
    },
    sw() { return Math.max(240, (this.sr.n + 1) * 50); },
    srConc() { const {c, u, f} = this.sr; return i => (isFinite(c) ? lkNumIn(sig(c * f ** -i, 4)) + ' ' + u : '–'); },
    srCols() { const t = this.t; return [{h: t('Buis')}, {h: t('Overdracht per stap'), num: true}, {h: t('Oplosmiddel'), num: true}, {h: t('Concentratie'), num: true}]; },
    srRows() {
      const {n, tr, dv} = this.sr, rows = [[this.t('Stock'), '–', '–', this.srConc(0)]];
      for (let i = 1; i <= n; i++) rows.push([i, lkNumIn(vol(tr)), lkNumIn(vol(dv)), this.srConc(i)]);
      return rows;
    },
    /* de buizen: l = vloeistofhoogte, o = dekking (vervaagt per stap, niet op schaal) */
    srTubes() {
      const {n, f} = this.sr, t = this.t;
      return Array.from({length: n + 1}, (_, i) => ({a: i ? String(i) : t('Stock'), l: 0.85, o: i ? Math.max(0.12, 0.6 * (1 / f) ** (i * 0.45)) : 0.6}));
    },
    tubes() {
      const {b1, b2, v1, v2} = this.solve, t = this.t, D1 = this.kinds.D1, D2 = this.kinds.D2, u = this.raw;
      return [{a: t('Stock'), l: v1 / v2, o: 0.6, b: lkNumIn(vol(v1)), c: lkNumIn(sig(b1 / D1[1], 4)) + ' ' + u.u1},
        {a: t('Totaal'), l: 1, o: 0.3, b: lkNumIn(vol(v2)), c: lkNumIn(sig(b2 / D2[1], 4)) + ' ' + u.u2}];
    },
    abBig() { return lkNumIn(vol(this.abm.ab)) + pipTag(this.abm.ab); },
    vols() { return this.reeks ? [] : this.batch ? VOLS.slice(1) : VOLS; },
    btCols() { const t = this.t; return [{h: t('Monster')}, {h: 'C₁', num: true}, {h: t('Stock'), num: true}, {h: t('Oplosmiddel'), num: true}]; },
    btPh() { const m = trPlain('Monster', true); return m + ' 1\t' + lkNumIn('52,4') + '\n' + m + ' 2\t' + lkNumIn('18,9') + ' ng/µL'; },
    /* S96 deel 4 (#148): elke regel is een monster, het laatste getal op de regel de stockconcentratie, met
       eventueel een eenheid erachter (anders die van C₂); alles ervoor is de naam. Iedereen gaat naar
       C₂ in het eindvolume V₂, met C₁V₁ = C₂V₂ per regel. */
    bt() {
      const V = this.v, u2 = V['d-c2u'], b2 = num(V['d-c2']) * DCU[u2][1], v2 = num(V['d-v2']) * UV[V['d-v2u']];
      const lines = this.b.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (!(b2 > 0) || !(v2 > 0) || !lines.length) return {err: true};
      let low = false;
      const rows = lines.map((l, i) => {
        const m = l.match(/^(.*?)[\s;]*(\d+(?:[.,]\d+)?)\s*([^\s\d;]*)$/);
        const u = m && m[3] ? m[3] : u2, ok = m && DCU[u] && DCU[u][0] === DCU[u2][0];
        const name = esc(m && m[1].trim() ? m[1].trim() : '#' + (i + 1));
        if (!ok) return {cells: [esc(l), '–', this.t('Onbekende eenheid of geen getal'), '–'], cls: 'bad'};
        const b1 = num(m[2]) * DCU[u][1], c1 = lkNumIn(sig(num(m[2]), 4)) + ' ' + u;
        if (!(b1 >= b2)) { low = true; return {cells: [name, c1, this.t('lager dan C₂'), '–'], cls: 'warn'}; }
        const v1 = b2 * v2 / b1;
        return [name, c1, lkNumIn(vol(v1)) + pipTag(v1), lkNumIn(vol(v2 - v1))];
      });
      return {err: false, rows, low};
    },
    concUnits() { return CU; },
    volUnits() { return VU; },
    /* de vier grootheden in basiseenheden; NaN betekent "dit veld is leeg" en dus te rekenen */
    raw() {
      const V = this.v;
      return {c1: num(V['d-c1']), c2: num(V['d-c2']),
        v1: num(V['d-v1']) * UV[V['d-v1u']], v2: num(V['d-v2']) * UV[V['d-v2u']],
        u1: V['d-c1u'], u2: V['d-c2u']};
    },
    /* een concentratie mag in elke eenheid van dezelfde soort staan: DCU[u] is
       [soort, factor naar de basiseenheid van die soort] */
    kinds() {
      const {u1, u2} = this.raw;
      return {D1: DCU[u1], D2: DCU[u2]};
    },
    /* wat er mis is met de invoer; is dit niet null, dan wordt er niets gerekend */
    problem() {
      const t = this.t, {c1, c2, v1, v2, u1, u2} = this.raw, {D1, D2} = this.kinds;
      if (D1[0] !== D2[0]) {
        return {kind: 'bad', text: t('De eenheden ' + uv(u1) + ' en ' + uv(u2)
          + ' zijn niet in elkaar om te rekenen. Kies voor C₁ en C₂ eenheden van dezelfde soort.')};
      }
      const blanks = [c1, c2, v1, v2].filter(isNaN).length;
      if (blanks !== 1) {
        return {kind: 'info', text: blanks === 0
          ? t('Maak één veld leeg om dat veld te laten berekenen.')
          : t('Vul drie van de vier velden in.')};
      }
      if ([c1, c2, v1, v2].some(x => !isNaN(x) && !(x > 0))) {
        return {kind: 'info', text: t('Vul alleen waarden groter dan nul in.')};
      }
      const m = this.solve;
      if (![m.b1, m.b2, m.v1, m.v2].every(Number.isFinite)) {
        return {kind: 'info', text: t('Vul drie van de vier velden in.')};
      }
      if (m.b2 > m.b1 * (1 + 1e-12)) {
        return {kind: 'bad',
          text: t('C₂ kan bij een verdunning niet hoger zijn dan C₁ (negatief verdunningsvolume).')};
      }
      return null;
    },
    /* het lege veld uitrekenen; alles in de basiseenheid van zijn soort */
    solve() {
      const {c1, c2, u1, u2} = this.raw, {D1, D2} = this.kinds;
      let {v1, v2} = this.raw, b1 = c1 * D1[1], b2 = c2 * D2[1], which;
      if (isNaN(v1)) { v1 = b2 * v2 / b1; which = {label: 'Pipetteer stock', value: vol(v1)}; }
      else if (isNaN(v2)) { v2 = b1 * v1 / b2; which = {label: 'Eindvolume', value: vol(v2)}; }
      else if (isNaN(c1)) { b1 = b2 * v2 / v1; which = {label: 'Benodigde stock', value: sig(b1 / D1[1], 4) + ' ' + u1}; }
      else { b2 = b1 * v1 / v2; which = {label: 'Eindconcentratie', value: sig(b2 / D2[1], 4) + ' ' + u2}; }
      return {b1, b2, v1, v2, which};
    },
    ok() { return !this.problem; },
    /* S96: de methodezin en het antwoord om je eigen berekening mee te controleren, in de eenheid van het gevraagde veld */
    method() {
      const {u1, u2} = this.raw, {b1, b2, v1, v2} = this.solve, {D1, D2} = this.kinds;
      return esc(this.t('De stock (' + uv(lkNumIn(sig(b1 / D1[1], 4)) + ' ' + u1) + ') werd verdund tot ' + uv(lkNumIn(sig(b2 / D2[1], 4)) + ' ' + u2)
        + ' door ' + uv(lkNumIn(vol(v1))) + ' stock aan te vullen tot ' + uv(lkNumIn(vol(v2))) + ' (C₁V₁ = C₂V₂).'));
    },
    check() {
      const V = this.v, {c1, v1, v2} = this.raw, {b1, b2, v1: s1, v2: s2} = this.solve, {D1, D2} = this.kinds;
      if (isNaN(v1)) return {a: s1 / UV[V['d-v1u']], u: V['d-v1u']};
      if (isNaN(v2)) return {a: s2 / UV[V['d-v2u']], u: V['d-v2u']};
      if (isNaN(c1)) return {a: b1 / D1[1], u: this.raw.u1};
      return {a: b2 / D2[1], u: this.raw.u2};
    },
    /* S96 deel 2: de uitkomst ook in een andere eenheid van dezelfde soort (volume, of een concentratie uit DCU) */
    checkUnits() {
      const u = this.check.u;
      if (UV[u]) return VU.map(x => [x, UV[u] / UV[x]]);
      return Object.keys(DCU).filter(x => DCU[x][0] === DCU[u][0]).map(x => [x, DCU[u][1] / DCU[x][1]]);
    },
    /* S96 deel 3: de invoer en het lege veld als Excel-formule; f rekent de eenheden van de formule om naar die van het lege veld */
    sheet() {
      const V = this.v, r = this.raw, t = this.t, D = u => DCU[u][1];
      const fld = {c1: [CONC[0].label, r.c1, r.u1], c2: [CONC[1].label, r.c2, r.u2], v1: [VOLS[0].label, num(V['d-v1']), V['d-v1u']], v2: [VOLS[1].label, num(V['d-v2']), V['d-v2u']]};
      const k = ['v1', 'v2', 'c1', 'c2'].find(x => isNaN(fld[x][1]));
      const f = {v1: D(r.u2) / D(r.u1) * UV[V['d-v2u']] / UV[V['d-v1u']], c1: D(r.u2) / D(r.u1) * UV[V['d-v2u']] / UV[V['d-v1u']],
        v2: D(r.u1) / D(r.u2) * UV[V['d-v1u']] / UV[V['d-v2u']], c2: D(r.u1) / D(r.u2) * UV[V['d-v1u']] / UV[V['d-v2u']]}[k];
      const F = {v1: '{c2}*{v2}/{c1}', c1: '{c2}*{v2}/{v1}', v2: '{c1}*{v1}/{c2}', c2: '{c1}*{v1}/{v2}'}[k];
      return [...['c1', 'c2', 'v1', 'v2'].filter(x => x !== k).map(x => ({k: x, label: t(fld[x][0]), value: fld[x][1], unit: fld[x][2]})),
        {label: t(fld[k][0]), value: '=' + F + (f === 1 ? '' : '*' + Number(f.toPrecision(12))), unit: fld[k][2]}];
    },
    solved() {
      /* het grote getal staat er ook bij een te hoge C₂: dan vertelt de melding eronder waarom */
      const bad = this.problem && this.problem.kind === 'bad' && this.kinds.D1[0] === this.kinds.D2[0];
      if (!this.ok && !bad) return null;
      const w = this.solve.which;
      return {label: this.t(w.label), value: lkNumIn(w.value)};
    },
    rows() {
      const t = this.t, {b1, b2, v1, v2} = this.solve;
      return [[t('Stock'), lkNumIn(vol(v1)) + pipTag(v1)], [t('Oplosmiddel'), lkNumIn(vol(v2 - v1)) + pipTag(v2 - v1)],
        [t('Totaal'), lkNumIn(vol(v2))], [t('Verdunning'), '1 : ' + lkNumIn(sig(b1 / b2, 4))]];
    },
    /* het advies als het stockvolume onder een microliter komt */
    pip() { return pipAdviesDeel(this.solve.v1, 'Stock'); },
    pipHtml() { return this.pip ? this.tHtml(this.pip.html) : ''; },
    steps() {
      const t = this.t, {v1, v2} = this.solve;
      return [t('Doe ' + vol(v2 - v1) + ' oplosmiddel in de buis of fles.'),
        t('Voeg ' + vol(v1) + ' stock toe en meng.')];
    }
  }
};
</script>
