<!-- ================= VERDUNNING =================
     C₁·V₁ = C₂·V₂ met één leeg veld. Welk veld leeg is bepaalt wat er gerekend wordt, dus de
     velden zijn tekst en niet een getal: "leeg" is hier een betekenisvolle waarde.

     DCU (welke eenheden in elkaar om te rekenen zijn) en pipAdviesDeel() blijven in
     web/index.html staan; de reeksplanner en een paar andere tools gebruiken die ook.
     De id's d-c1, d-c1u, d-c2, d-c2u, d-v1, d-v1u, d-v2, d-v2u en d-out blijven zoals ze waren. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <div class="f" v-for="f in conc" :key="f.id">
          <label :for="f.id">{{ t(f.label) }}</label>
          <div class="inu">
            <input :id="f.id" inputmode="decimal" v-model="v[f.id]">
            <select :id="f.id + 'u'" v-model="v[f.id + 'u']" :aria-label="t(f.unitLabel)">
              <option v-for="u in concUnits" :key="u">{{ u }}</option>
            </select>
          </div>
        </div>
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
      <p class="note info">{{ t('Voorbeeld: 50X TAE naar 500 mL 1X loopbuffer.') }}</p>
    </div>
    <div class="result" id="d-out">
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
      </template>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

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
      'd-v1': '', 'd-v1u': 'mL', 'd-v2': '500', 'd-v2u': 'mL'}};
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
    conc() { return CONC; },
    vols() { return VOLS; },
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
    solved() {
      /* het grote getal staat er ook bij een te hoge C₂: dan vertelt de melding eronder waarom */
      const bad = this.problem && this.problem.kind === 'bad' && this.kinds.D1[0] === this.kinds.D2[0];
      if (!this.ok && !bad) return null;
      const w = this.solve.which;
      return {label: this.t(w.label), value: lkNumIn(w.value)};
    },
    rows() {
      const t = this.t, {b1, b2, v1, v2} = this.solve;
      return [[t('Stock'), lkNumIn(vol(v1))], [t('Oplosmiddel'), lkNumIn(vol(v2 - v1))],
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
