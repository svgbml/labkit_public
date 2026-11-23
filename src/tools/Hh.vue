<!-- ================= pH-BUFFER =================
     Verhouding zuur en geconjugeerde base uit Henderson-Hasselbalch. De id's hh-sys, hh-pka,
     hh-ph, hh-c, hh-v, hh-ma, hh-mb en hh-out blijven zoals ze waren. Er is geen tekening,
     dus calc.hh() mag een lege functie zijn: de component rekent zelf opnieuw. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <div class="f">
          <label for="hh-sys">{{ t('Buffersysteem') }}</label>
          <select id="hh-sys" style="width:100%" v-model="sys">
            <option v-for="b in systems" :key="b.id" :value="b.id">{{ t(b.n) }}</option>
            <option value="">{{ t('Eigen pKₐ') }}</option>
          </select>
        </div>
        <lk-field v-model="pka" :label="t('pKₐ (25 °C)')" for-id="hh-pka"/>
        <lk-field v-model="ph" :label="t('Gewenste pH')" for-id="hh-ph"/>
        <lk-field v-model="T" :label="t('Temperatuur')" for-id="hh-t" unit="°C"/>
        <lk-field v-model="c" :label="t('Totale bufferconcentratie')" for-id="hh-c" unit="mM"/>
        <lk-field v-model="v" :label="t('Volume')" for-id="hh-v" unit="mL"/>
        <lk-field v-model="ma" :label="t('Molmassa zuurvorm')" for-id="hh-ma" unit="g/mol"/>
        <lk-field v-model="mb" :label="t('Molmassa basevorm')" for-id="hh-mb" unit="g/mol"/>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Voorbeeld: fosfaatbuffer uit NaH₂PO₄ (zuurvorm) en Na₂HPO₄ (basevorm). De molmassa\'s zijn optioneel.') }}</p>
    </div>
    <div class="result" id="hh-out">
      <lk-note v-if="err" kind="info">{{ err }}</lk-note>
      <template v-else>
        <lk-big :label="t('Verhouding base : zuur')" :value="ratioText"/>
        <lk-kv :rows="rows"/>
        <lk-note v-if="far" kind="warn">{{ t('De gewenste pH ligt meer dan 1 eenheid van de pKₐ; dit systeem buffert daar slecht. Kies een buffer met een pKₐ dichter bij de pH.') }}</lk-note>
        <lk-note v-if="shift" kind="info">{{ shift }}</lk-note>
        <lk-formula :html="formula"/>
        <details style="margin-top:10px">
          <summary>{{ t('Buffers voor deze pH') }}</summary>
          <div class="row" style="gap:6px;margin-top:8px">
            <button v-for="x in picks" :key="x.b.id" type="button" class="xlbtn" :class="{on: x.b.id === sys}" :data-hhpick="x.b.id" @click="sys = x.b.id">{{ t(x.b.n) }} · {{ F(x.pk, 2) }}</button>
            <span v-if="!picks.length" style="color:var(--muted)">{{ t('Geen buffer met een pKₐ binnen 1 eenheid van deze pH.') }}</span>
          </div>
          <lk-field style="margin-top:10px" v-model="st" :label="t('Stockconcentratie (zuur- en basevorm)')" for-id="hh-st" unit="mM"/>
          <lk-kv :rows="recipe"/>
        </details>
      </template>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => lkNumIn(fmt(x, d)), G = (x, d) => lkNumIn(sig(x, d));

/* id = keuze in de lijst, k = pKₐ bij 25 °C, s = korte naam, ma/mb = molmassa van de zuur- en de basevorm,
   dt = dpKₐ/dT in per °C (Goldberg e.a., J Phys Chem Ref Data 31:231, 2002; Good e.a. 1966) */
const SYSTEMS = [
  {id: 'ace', k: '4.76', s: 'Acetaat', n: 'Acetaat (pKₐ 4,76)', ma: '60,05', mb: '82,03', dt: 0.0002},
  {id: 'mes', k: '6.10', s: 'MES', n: 'MES (pKₐ 6,10)', ma: '195,24', mb: '217,22', dt: -0.011},
  {id: 'pho', k: '7.20', s: 'Fosfaat', n: 'Fosfaat H₂PO₄⁻/HPO₄²⁻ (pKₐ 7,20)', ma: '119,98', mb: '141,96', dt: -0.0028},
  {id: 'hep', k: '7.48', s: 'HEPES', n: 'HEPES (pKₐ 7,48)', ma: '238,30', mb: '260,29', dt: -0.014},
  {id: 'tri', k: '8.06', s: 'Tris', n: 'Tris (pKₐ 8,06)', ma: '157,60', mb: '121,14', dt: -0.028},
  {id: 'cit1', k: '3.13', s: 'Citraat', n: 'Citraat (pKₐ₁ 3,13)', ma: '210,14', mb: '214,10', dt: 0},
  {id: 'cit2', k: '4.76', s: 'Citraat', n: 'Citraat (pKₐ₂ 4,76)', ma: '214,10', mb: '236,09', dt: 0},
  {id: 'cit3', k: '6.40', s: 'Citraat', n: 'Citraat (pKₐ₃ 6,40)', ma: '236,09', mb: '258,07', dt: 0},
  {id: 'pip', k: '6.76', s: 'PIPES', n: 'PIPES (pKₐ 6,76)', ma: '302,37', mb: '324,35', dt: -0.0085},
  {id: 'mop', k: '7.20', s: 'MOPS', n: 'MOPS (pKₐ 7,20)', ma: '209,26', mb: '231,24', dt: -0.013},
  {id: 'tci', k: '8.05', s: 'Tricine', n: 'Tricine (pKₐ 8,05)', ma: '179,17', mb: '201,15', dt: -0.021},
  {id: 'bic', k: '8.26', s: 'Bicine', n: 'Bicine (pKₐ 8,26)', ma: '163,17', mb: '185,15', dt: -0.018},
  {id: 'che', k: '9.30', s: 'CHES', n: 'CHES (pKₐ 9,30)', ma: '207,29', mb: '229,27', dt: -0.018},
  {id: 'cap', k: '10.40', s: 'CAPS', n: 'CAPS (pKₐ 10,40)', ma: '221,32', mb: '243,30', dt: -0.018}
];
export default {
  name: 'Hh',
  data() {
    return {sys: 'pho', T: lkNumIn('25'), st: lkNumIn('1000'), pka: lkNumIn('7,20'), ph: lkNumIn('7,4'), c: lkNumIn('100'),
      v: lkNumIn('1000'), ma: lkNumIn('119,98'), mb: lkNumIn('141,96')};
  },
  computed: {
    systems() { return SYSTEMS; },
    cur() { return SYSTEMS.find(b => b.id === this.sys); },
    dt() { return this.cur ? this.cur.dt : 0; },
    /* buffers met pKₐ(T) binnen ±1 van de gewenste pH, dichtstbijzijnde eerst */
    picks() {
      const {ph, T} = this.m;
      return SYSTEMS.map(b => ({b, pk: +b.k + b.dt * (T - 25)})).filter(x => Math.abs(x.pk - ph) <= 1)
        .sort((x, y) => Math.abs(x.pk - ph) - Math.abs(y.pk - ph));
    },
    /* stockrecept van het gekozen systeem: mmol zuur/base gedeeld door de stockconcentratie */
    recipe() {
      const {fb, fa, C, V} = this.m, S = num(this.st);
      if (!(C > 0 && V > 0 && S > 0)) return [];
      const mmol = C * V / 1000, vol = f => G(mmol * f / S * 1000, 4) + ' mL';
      return [[this.t('Stock zuurvorm'), vol(fa)], [this.t('Stock basevorm'), vol(fb)],
        [this.t('Water tot het eindvolume'), G(V - mmol * 1000 / S, 4) + ' mL']];
    },
    shift() {
      const {pka, pka25, T} = this.m;
      return this.cur && Math.abs(pka - pka25) > 0.1
        ? this.t(uv(this.cur.s) + ' bij ' + T + ' °C: pKₐ ' + F(pka, 2) + ' in plaats van ' + F(pka25, 2)) : '';
    },
    m() {
      const pka25 = num(this.pka), ph = num(this.ph);
      const T = isFinite(num(this.T)) ? num(this.T) : 25;
      const pka = pka25 + this.dt * (T - 25);
      const ratio = Math.pow(10, ph - pka), fb = ratio / (1 + ratio);
      return {pka, pka25, T, ph, C: num(this.c), V: num(this.v), ma: num(this.ma), mb: num(this.mb),
        ratio, fb, fa: 1 - fb};
    },
    err() { return isFinite(this.m.pka) && isFinite(this.m.ph) ? '' : this.t('Vul pKₐ en de gewenste pH in.'); },
    ratioText() {
      const r = this.m.ratio;
      return r >= 1 ? G(r, 3) + ' : 1' : '1 : ' + G(1 / r, 3);
    },
    rows() {
      const t = this.t, {fb, fa, C, V, ma, mb} = this.m;
      const rows = [[t('Aandeel basevorm'), F(fb * 100, 1) + ' %'], [t('Aandeel zuurvorm'), F(fa * 100, 1) + ' %']];
      if (C > 0 && V > 0) {
        const mmol = C * V / 1000;
        rows.push([t('Basevorm'), `${G(mmol * fb, 4)} mmol` + (mb > 0 ? ` = <b>${lkNumIn(mass(mmol * fb / 1000 * mb))}</b>` : '')],
          [t('Zuurvorm'), `${G(mmol * fa, 4)} mmol` + (ma > 0 ? ` = <b>${lkNumIn(mass(mmol * fa / 1000 * ma))}</b>` : '')]);
      }
      if (this.dt && this.m.T !== 25) rows.push([t('pKₐ bij deze temperatuur'), F(this.m.pka, 2)]);
      return rows;
    },
    far() { return Math.abs(this.m.ph - this.m.pka) > 1; },
    formula() {
      return this.tHtml('[base]/[zuur] = 10<sup>pH − pKₐ</sup> = 10<sup>' + lkNumIn(fmt(this.m.ph - this.m.pka, 2)) + '</sup>');
    }
  },
  methods: {F},
  watch: {
    /* een systeem kiezen zet de pKₐ en de molmassa's; "Eigen pKₐ" laat alles staan */
    sys(k) {
      const s = SYSTEMS.find(b => b.id === k); if (!s) return;
      this.pka = lkNumIn(s.k.replace('.', ','));
      this.ma = lkNumIn(s.ma); this.mb = lkNumIn(s.mb);
    }
  }
};
</script>
