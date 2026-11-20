<!-- ================= WATERHARDHEID (EDTA-TITRATIE) =================
     Alleen de weergave staat hier; de formules zijn dezelfde als in de oude calc.edta()
     (tools/nt/77_edta.js is nu leeg). De id's ed-c, ed-vs, ed-vt, ed-vb, ed-vca en ed-out blijven
     zoals ze waren: tests/validate.py leest de uitkomst uit #ed-out. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <lk-field v-model="c" :label="t('Concentratie EDTA')" for-id="ed-c" unit="mol/L"/>
        <lk-field v-model="vs" :label="t('Volume monster')" for-id="ed-vs" unit="mL"/>
        <lk-field v-model="vt" :label="t('EDTA totaal (pH 10, EBT)')" for-id="ed-vt" unit="mL"/>
        <lk-field v-model="vb" :label="t('Blanco')" for-id="ed-vb" unit="mL"/>
        <lk-field v-model="vca" :label="t('EDTA calcium (pH 12–13, optioneel)')" for-id="ed-vca" unit="mL"/>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Totale hardheid: gebufferd op pH 10 met Eriochroomzwart T. Calcium: pH 12–13 met NaOH (Mg slaat neer als Mg(OH)₂) en murexide of calconcarbonzuur. De blanco wordt van beide titraties afgetrokken. Voorbeelddata zijn verzonnen.') }}</p>
    </div>
    <div class="result">
      <div id="ed-out">
        <lk-note v-if="msg" :kind="msg.kind">{{ msg.text }}</lk-note>
        <template v-else>
          <lk-big :label="t('Totale hardheid')" :value="F(r.mm, 3)" sub="mmol/L"/>
          <lk-kv :rows="totalRows"/>
          <lk-note v-if="r.caWarn" kind="warn">{{ t('Het calciumvolume moet tussen de blanco en het totaalvolume liggen.') }}</lk-note>
          <lk-kv v-else-if="caRows" :rows="caRows"/>
          <lk-formula :html="formula"/>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => lkNumIn(fmt(x, d));

export default {
  name: 'Edta',
  data() {
    return {c: lkNumIn('0,0100'), vs: lkNumIn('50,00'), vt: lkNumIn('12,35'), vb: lkNumIn('0,05'),
      vca: lkNumIn('8,90')};
  },
  computed: {
    /* alle maten uit de invoer, één keer; de andere computeds lezen hier alleen uit */
    r() {
      const c = num(this.c), vs = num(this.vs), vt = num(this.vt), vb = num(this.vb) || 0, vca = num(this.vca);
      const mm = c * (vt - vb) / vs * 1000, dh = mm * 56.0774 / 10;
      const r = {c, vs, vt, vb, vca, mm, dh, caWarn: false};
      if (vca > 0) {
        if (vca <= vb || vca > vt) r.caWarn = true;
        else { r.ca = c * (vca - vb) / vs * 1000; r.mg = mm - r.ca; }
      }
      return r;
    },
    msg() {
      const {c, vs, vt, vb} = this.r;
      if (!(c > 0) || !(vs > 0) || !(vt > 0))
        return {kind: 'info', text: this.t('Vul EDTA-concentratie, monstervolume en titratievolume in.')};
      if (vt <= vb) return {kind: 'warn', text: this.t('Het titratievolume is niet groter dan de blanco.')};
      return null;
    },
    totalRows() {
      const t = this.t, {mm, dh} = this.r;
      return [['mg CaCO₃/L', F(mm * 100.09, 1)], [t('Duitse graden'), F(dh, 2) + ' °dH'],
        [t('Franse graden'), F(mm * 10, 2) + ' °fH']];
    },
    caRows() {
      const r = this.r; if (r.ca == null) return null;
      const t = this.t;
      return [[t('Calcium'), `${F(r.ca, 3)} mmol/L = ${F(r.ca * 40.078, 1)} mg/L`],
        [t('Magnesium (verschil)'), `${F(r.mg, 3)} mmol/L = ${F(r.mg * 24.305, 1)} mg/L`],
        [t('Ca : Mg (molair)'), r.mg > 0 ? F(r.ca / r.mg, 2) + ' : 1' : '–']];
    },
    formula() { return this.tHtml('c = c<sub>EDTA</sub> · (V − V<sub>b</sub>) / V<sub>s</sub> · °dH = mmol/L × 5,61'); }
  },
  methods: {F}
};
</script>
