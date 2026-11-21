<!-- ================= GELFOTO-EDITOR, PANEEL 4: DE LADDER KIEZEN EN METEN =================
     Alleen de velden en de knoppen van paneel 4. De bandentabel, de symbolen en "ladder uit
     een foto" blijven voorlopig gewone HTML (S226), net als de kop van het paneel.

     De id's gf-lad, gf-unit en gf-ladc blijven, want gfUpdate(), gfLadder() en de motor lezen
     ze daar uit; tests/validate.py zet ze ook zo. Wat eerst een losse change-listener op
     gf-lad was (eiwitladder → kDa, en de massa's per band erbij) is nu een watcher. -->
<template>
  <div>
    <div class="row">
      <div class="f">
        <label for="gf-lad">{{ t('Ladder') }}</label>
        <select id="gf-lad" v-model="f.lad">
          <option v-for="o in ladders" :key="o.v" :value="o.v">{{ t(o.n) }}</option>
        </select>
      </div>
      <div class="f">
        <label for="gf-unit">{{ t('Eenheid') }}</label>
        <select id="gf-unit" v-model="f.unit" @change="unitMsg">
          <option value="bp">bp</option>
          <option value="kb">kb</option>
          <option value="kDa">kDa</option>
          <option value="ng">{{ t('ng (hoeveelheid)') }}</option>
        </select>
      </div>
      <div class="f">
        <label>&nbsp;</label>
        <button type="button" class="primary" id="gf-bands" @click="detect">{{ t('Detecteer banden') }}</button>
      </div>
    </div>
    <div class="f" id="gf-ladcw" style="margin-top:8px" v-if="f.lad === 'custom'">
      <label for="gf-ladc">{{ t('Eigen ladder, grootste eerst (spaties of ;)') }}</label>
      <input id="gf-ladc" class="mono" v-model="f.ladc" @change="syncLadc">
    </div>
    <div class="row" style="margin-top:8px">
      <button type="button" id="gf-addband" @click="addBand">{{ t('+ Ladderband (klik)') }}</button>
      <button type="button" id="gf-measure" @click="measure">{{ t('Band meten (klik)') }}</button>
      <button type="button" id="gf-measall" @click="measAll">{{ t('Meet alle banden') }}</button>
      <button type="button" id="gf-clrmarks" @click="clear">{{ t('Metingen wissen') }}</button>
    </div>
  </div>
</template>

<script>
import {gfMix} from './tick.js';
import {LADS} from './ladders.js';

export default {
  name: 'GfLadder',
  mixins: [gfMix],
  data() {
    return {f: {lad: '100', unit: 'bp', ladc: '250 150 100 75 50 37 25 20 15 10'}};
  },
  computed: {
    ladders() { return LADS; }
  },
  watch: {
    /* Een eiwitladder rekent in kDa en een DNA-ladder in bp, en bij een ladder met bekende
       massa's komen die massa's in gf-lmass te staan (dat veld staat in GfDens, dus we zetten
       het via de invoer zelf — zo weet die component het ook). Daarna rekent de tool opnieuw,
       maar pas als Vue de keuzelijsten heeft bijgewerkt. */
    'f.lad'(k) {
      if (k === 'ppp' || k === 'prplus') this.f.unit = 'kDa';
      else if (k !== 'custom' && this.f.unit === 'kDa') this.f.unit = 'bp';
      if (LMASS[k]) gfSetIn('gf-lmass', LMASS[k]);
      this.$nextTick(() => { calc.gelfoto(); });
    }
  },
  /* "ladder uit een foto" in src/engines/gelfoto.js kiest een ladder voor ons; zoals bij __oplosVm
     staat de instantie daarom op window. Zelf het veld in de DOM zetten kan niet: het
     eigen-ladderveld bestaat pas nadat Vue het heeft neergezet. */
  mounted() { window.__gfLadVm = this; },
  methods: {
    /* een ladder van buiten zetten; `done` draait zodra het veld er staat */
    setLadder(key, sizes, done) {
      this.f.lad = key;
      if (key === 'custom' && sizes) this.f.ladc = sizes;
      this.$nextTick(() => { calc.gelfoto(); if (done) done(); });
    },
    /* delen via een link en ongedaan maken sturen alleen een change-event; v-model ziet dat
       bij een tekstveld niet */
    syncLadc(e) { this.f.ladc = e.target.value; },
    detect() { gfBandsBtn(); },
    addBand() { setMode('addband'); },
    measure() { gfMeasureBtn(); },
    measAll() { gfMeasAll(); },
    clear() { gfClearMarks(); },
    /* ng kan alleen met een DNA-massaladder; dezelfde melding als eerst */
    unitMsg() { gfUnitMsg(); }
  }
};
</script>
