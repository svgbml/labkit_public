<!-- ================= OSMOLARITEIT & IONSTERKTE =================
     De eerste tool met een <lk-etable>: dezelfde kolomopgave als ET() in
     tools/nt/00_lib.js, maar de rijen staan nu in de component. OSMI (de ionen per stof)
     blijft in tools/nt/50_osmo.js staan, want daar hangt het validatiegeval aan.

     De id's os-tbl, os-tbl-add, os-phi, os-nb, os-nm en os-out blijven zoals ze waren. -->
<template>
  <div class="grid2">
    <div class="panel">
      <!-- S99 (#160): een bekend medium in de tabel zetten -->
      <div class="f" style="margin-bottom:10px">
        <label for="os-pre">{{ t('Voorbeeld laden') }}</label>
        <select id="os-pre" style="width:100%" v-model="pre" @change="loadPre">
          <option value="">{{ t('eigen samenstelling') }}</option>
          <option v-for="(p, k) in presets" :key="k" :value="k">{{ t(p.n) }}</option>
        </select>
      </div>
      <lk-etable table-id="os-tbl" :cols="cols" v-model:rows="rows" add-id="os-tbl-add"/>
      <div class="row" style="margin-top:8px">
        <button type="button" id="os-tbl-add" @click="addRow">{{ t('+ Stof') }}</button>
      </div>
      <div class="fields" style="margin-top:12px">
        <div class="f" data-expert="">
          <label for="os-phi">{{ t('Osmotische coëfficiënt φ') }}</label>
          <input id="os-phi" inputmode="decimal" v-model="phi">
        </div>
        <div class="f">
          <label for="os-nb">{{ t('Normaliteit: stof') }}</label>
          <select id="os-nb" style="width:100%" v-model="nb">
            <option v-for="e in eq" :key="e.v" :value="e.v">{{ t(e.n) }}</option>
          </select>
        </div>
        <lk-field v-model="nm" :label="t('Molariteit')" for-id="os-nm" unit="M"/>
      </div>
      <!-- S99 (#160): hoeveel van een stof erbij voor een gewenste osmolariteit -->
      <div class="fields" style="margin-top:12px">
        <lk-field v-model="iso" :label="t('Doel (isotoon)')" for-id="os-iso" unit="mOsm/L"/>
        <div class="f">
          <label for="os-add">{{ t('Aanvullen met') }}</label>
          <select id="os-add" style="width:100%" v-model="add">
            <option v-for="(a, k) in adds" :key="k" :value="k">{{ t(k) }}</option>
          </select>
        </div>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0" v-html="hint"></p>
    </div>
    <div class="result" id="os-out">
      <lk-note v-for="(w, i) in warnings" :key="i" kind="warn" :html="w"/>
      <lk-note v-if="!parts.length && !warnings.length" kind="info">{{ t('Vul minstens één stof met concentratie in.') }}</lk-note>
      <template v-else>
        <lk-big :label="t('Osmolariteit')" :value="bigValue" sub="mOsm/L"/>
        <lk-kv :rows="kvRows"/>
        <lk-table :cols="outCols" :rows="outRows"/>
        <lk-note v-if="mk" :kind="mk[0]" id="os-mk">{{ mk[1] }}</lk-note>
        <lk-note v-if="isotonic" kind="ok">{{ t('Ongeveer isotoon met bloedplasma (circa 275–300 mOsm/kg).') }}</lk-note>
        <!-- geen t(): deze regel heeft geen woord van twee letters, dus de vertaallaag heeft
             er nooit een sleutel voor gemaakt -->
        <lk-formula :html="tHtml('osmolariteit = Σ c·ν · I = ½ Σ c·z²')"/>
      </template>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => lkNumIn(fmt(x, d)), G = (x, d) => lkNumIn(sig(x, d));

/* S99 (#160): bekende samenstellingen in mM. PBS: Cold Spring Harbor Protocols (2006), pdb.rec8247;
   fysiologisch zout 0,9 % = 9 g/L / 58,44 g/mol = 154 mM; DMEM: Gibco 11965 (hoog glucose), de zouten
   en glucose (aminozuren en vitaminen samen ca. 10 mOsm/L zijn weggelaten). */
const PRESETS = {
  pbs: {n: 'PBS (1×)', r: [['NaCl', '137'], ['KCl', '2,7'], ['Na₂HPO₄', '10'], ['KH₂PO₄', '1,8']]},
  saline: {n: 'Fysiologisch zout (0,9 % NaCl)', r: [['NaCl', '154']]},
  dmem: {n: 'DMEM, zouten en glucose', r: [['NaCl', '110,34'], ['KCl', '5,33'], ['CaCl₂', '1,8'], ['MgSO₄', '0,81'], ['NaH₂PO₄', '0,91'], ['NaHCO₃', '44,05'], ['Glucose', '25']]}
};
/* aanvullen tot isotoon: deeltjes per formule-eenheid, ion of niet, molaire massa (g/mol) */
const ADDS = {NaCl: {nu: 2, ion: true, M: 58.44}, Glucose: {nu: 1, ion: false, M: 180.16}, Mannitol: {nu: 1, ion: false, M: 182.17}, Sucrose: {nu: 1, ion: false, M: 342.30}};

/* hoeveel equivalenten per mol; de waarde is wat de normaliteit mee vermenigvuldigd wordt */
const EQ = [{v: '1', n: 'HCl, HNO₃, NaOH, KOH (1 eq/mol)'}, {v: '2', n: 'H₂SO₄, Ca(OH)₂ (2 eq/mol)'},
  {v: '3', n: 'H₃PO₄ (3 eq/mol)'}, {v: '5', n: 'KMnO₄ in zuur milieu (5 eq/mol)'}];

export default {
  name: 'Osmo',
  data() {
    return {
      rows: [['NaCl', '137', ''], ['KCl', lkNumIn('2,7'), ''],
        ['Na₂HPO₄', '10', ''], ['KH₂PO₄', lkNumIn('1,8'), '']],
      phi: '1', nb: '1', nm: lkNumIn('0,05'), pre: '', iso: '290', add: 'NaCl'
    };
  },
  computed: {
    eq() { return EQ; },
    presets() { return PRESETS; },
    adds() { return ADDS; },
    /* S99: wat er bij moet (of hoeveel verdunnen) om op het doel te komen; een ion telt met φ mee */
    mk() {
      const goal = num(this.iso), A = ADDS[this.add], cur = this.m.phi === 1 ? this.m.osm : this.m.real;
      if (!(goal > 0) || !A || !(cur >= 0) || !this.parts.length) return null;
      const t = this.t, d = goal - cur;
      if (Math.abs(d) < 0.5) return ['ok', t('Al op het doel.')];
      if (d < 0) return ['info', t('Boven het doel: verdun ' + F(cur / goal, 3) + '× met water (bijvoorbeeld ' + F(1000 * goal / cur, 0) + ' mL tot 1000 mL).')];
      const per = A.nu * (A.ion ? this.m.phi : 1), mM = d / per;
      return ['info', t('Voeg ' + F(mM, 1) + ' mM ' + uv(this.add) + ' toe (' + F(mM * A.M / 1000, 3) + ' g/L) voor ' + F(goal, 0) + ' mOsm/L.')];
    },
    cols() {
      const t = this.t;
      return [{h: t('Stof'), t: 'sel', o: typeof OSMI !== 'undefined' ? Object.keys(OSMI) : []},
        {h: t('Concentratie (mM)'), t: 'num', w: 90},
        {h: t('Ionen (ladingen)'), t: 'txt', w: 110}];
    },
    hint() {
      return this.tHtml('Ionen worden automatisch ingevuld voor de stoffen in de lijst. Bij "eigen stof" geef je de ladingen van de ionen per formule-eenheid, bijvoorbeeld <span class="mono">+2 -1 -1</span> voor CaCl₂ of <span class="mono">0</span> voor een niet-elektrolyt. Voorbeeld: PBS.');
    },
    /* per rij de ladingen van de ionen: eerst wat de gebruiker zelf typte, anders die uit OSMI */
    parsed() {
      return this.rows.map(r => {
        const c = num(r[1]);
        if (!isFinite(c)) return null;
        const spec = String(r[2] || '').trim() || (typeof OSMI !== 'undefined' ? OSMI[r[0]] : '') || '';
        if (!spec) return {name: r[0], err: 'leeg'};
        const z = spec.replace(/−/g, '-').split(/[\s,;]+/).filter(Boolean).map(Number);
        if (z.some(v => !isFinite(v))) return {name: r[0], err: 'fout'};
        /* één lading 0 is een niet-elektrolyt: dat is één deeltje, niet nul deeltjes */
        const nu = z.length === 1 && z[0] === 0 ? 1 : z.length;
        return {name: r[0], c, z, nu, i: 0.5 * z.reduce((s, q) => s + q * q, 0) * c};
      }).filter(Boolean);
    },
    parts() { return this.parsed.filter(p => !p.err); },
    /* een hele zin per sleutel; de naam van de stof blijft staan zoals hij er staat */
    warnings() {
      return this.parsed.filter(p => p.err).map(p => (p.err === 'leeg'
        ? this.tHtml(ud(p.name) + ': vul de ladingen van de ionen in.')
        : this.tHtml(ud(p.name) + ': ladingen niet herkend.')));
    },
    m() {
      let osm = 0, I = 0, ions = 0;
      this.parts.forEach(p => {
        osm += p.nu * p.c; I += p.i;
        if (p.z.some(q => q !== 0)) ions += p.nu * p.c;
      });
      const phi = num(this.phi) || 1;
      return {osm, I, ions, phi, real: (osm - ions) + ions * phi};
    },
    bigValue() { const {osm, real, phi} = this.m; return F(phi === 1 ? osm : real, 0); },
    kvRows() {
      const t = this.t, {osm, real, phi, I} = this.m, nm = num(this.nm), nb = num(this.nb);
      return [[t('Ideaal (volledige dissociatie)'), F(osm, 1) + ' mOsm/L'],
        phi !== 1 ? [t('Met φ = ' + F(phi, 2) + ' voor ionen'), F(real, 1) + ' mOsm/L'] : null,
        [t('Ionsterkte I'), F(I, 1) + ' mM (' + G(I / 1000, 3) + ' M)'],
        isFinite(nm) ? [t('Normaliteit'),
          G(nm * nb, 3) + ' N (' + G(nm, 3) + ' M × ' + lkNumIn(nb) + ' eq/mol)'] : null];
    },
    outCols() {
      const t = this.t;
      return [{h: t('Stof')}, {h: 'mM', num: true}, {h: t('Deeltjes'), num: true},
        {h: t('Bijdrage I (mM)'), num: true}];
    },
    outRows() {
      return this.parts.map(p => [esc(trPlain(p.name, true)), F(p.c, 2), lkNumIn(p.nu), F(p.i, 2)]);
    },
    isotonic() { const o = this.m.osm; return o > 270 && o < 310; }
  },
  methods: {
    loadPre() { const p = PRESETS[this.pre]; if (p) this.rows = p.r.map(([a, c]) => [a, lkNumIn(c), '']); },
    addRow() {
      const o = typeof OSMI !== 'undefined' ? Object.keys(OSMI)[0] : '';
      this.rows = [...this.rows, [o, '', '']];
    }
  }
};
</script>
