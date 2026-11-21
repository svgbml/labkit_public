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
            <option v-for="b in systems" :key="b.k" :value="b.k">{{ t(b.n) }}</option>
            <option value="">{{ t('Eigen pKₐ') }}</option>
          </select>
        </div>
        <lk-field v-model="pka" :label="t('pKₐ (25 °C)')" for-id="hh-pka"/>
        <lk-field v-model="ph" :label="t('Gewenste pH')" for-id="hh-ph"/>
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
        <lk-formula :html="formula"/>
      </template>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => lkNumIn(fmt(x, d)), G = (x, d) => lkNumIn(sig(x, d));

/* k = pKₐ, ma/mb = molmassa van de zuur- en de basevorm; dezelfde lijst als in de oude tool */
const SYSTEMS = [
  {k: '4.76', n: 'Acetaat (pKₐ 4,76)', ma: '60,05', mb: '82,03'},
  {k: '6.10', n: 'MES (pKₐ 6,10)', ma: '195,24', mb: '217,22'},
  {k: '7.20', n: 'Fosfaat H₂PO₄⁻/HPO₄²⁻ (pKₐ 7,20)', ma: '119,98', mb: '141,96'},
  {k: '7.48', n: 'HEPES (pKₐ 7,48)', ma: '238,30', mb: '260,29'},
  {k: '8.06', n: 'Tris (pKₐ 8,06)', ma: '157,60', mb: '121,14'}
];

export default {
  name: 'Hh',
  data() {
    return {sys: '7.20', pka: lkNumIn('7,20'), ph: lkNumIn('7,4'), c: lkNumIn('100'),
      v: lkNumIn('1000'), ma: lkNumIn('119,98'), mb: lkNumIn('141,96')};
  },
  computed: {
    systems() { return SYSTEMS; },
    m() {
      const pka = num(this.pka), ph = num(this.ph);
      const ratio = Math.pow(10, ph - pka), fb = ratio / (1 + ratio);
      return {pka, ph, C: num(this.c), V: num(this.v), ma: num(this.ma), mb: num(this.mb),
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
      return rows;
    },
    far() { return Math.abs(this.m.ph - this.m.pka) > 1; },
    formula() {
      return this.tHtml('[base]/[zuur] = 10<sup>pH − pKₐ</sup> = 10<sup>' + lkNumIn(fmt(this.m.ph - this.m.pka, 2)) + '</sup>');
    }
  },
  watch: {
    /* een systeem kiezen zet de pKₐ en de molmassa's; "Eigen pKₐ" laat alles staan */
    sys(k) {
      const s = SYSTEMS.find(b => b.k === k); if (!s) return;
      this.pka = lkNumIn(s.k.replace('.', ','));
      this.ma = lkNumIn(s.ma); this.mb = lkNumIn(s.mb);
    }
  }
};
</script>
