<!-- ================= CENTRIFUGE =================
     Omrekenen tussen toerental (rpm) en g-kracht (RCF). Twee velden zijn elkaars uitkomst: het
     veld dat je het laatst bewerkte is de invoer, het andere rekent mee. Dat onthoudt `last`
     (in de oude versie de variabele zLast). Het veld waar de cursor staat wordt niet
     overschreven, zodat je niet tegen je eigen invoer in typt.
     De id's z-r, z-rpm, z-g en z-out blijven zoals ze waren. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <div class="f">
          <label for="z-r">{{ t('Rotorstraal r') }}</label>
          <div class="inu"><input id="z-r" inputmode="decimal" :value="r" @input="onIn('z-r', $event)"><span class="u">cm</span></div>
        </div>
        <div class="f">
          <label for="z-rpm">{{ t('Toerental') }}</label>
          <div class="inu"><input id="z-rpm" inputmode="decimal" :value="rpm" @input="onIn('z-rpm', $event)"><span class="u">rpm</span></div>
        </div>
        <div class="f">
          <label for="z-g">{{ t('g-kracht') }}</label>
          <div class="inu"><input id="z-g" inputmode="decimal" :value="g" @input="onIn('z-g', $event)"><span class="u">× g</span></div>
        </div>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Vul rpm óf × g in; het andere veld rekent mee.') }}</p>
    </div>
    <div class="result" id="z-out">
      <lk-note v-if="!res">{{ t('Vul de rotorstraal en rpm of × g in.') }}</lk-note>
      <template v-else>
        <lk-big :label="res.label" :value="res.big" :sub="res.unit"/>
        <lk-kv :rows="res.rows"/>
        <lk-formula html="RCF = 1,118 × 10⁻⁵ × r × rpm²"/>
        <lk-note>{{ t('Controleer of de waarde binnen het maximum van de rotor valt en balanceer de buizen.') }}</lk-note>
      </template>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const K = 1.118e-5;
/* de invoer die storeGet() eerder bewaarde onder de id's van deze velden */
const stored = (id, d) => { try { const v = storeGet()[id]; return v == null ? d : v; } catch (e) { return d; } };
/* een geheel getal met duizendtallen, in de taal van de pagina (nl-NL groepeert 1957 als 1.957, en dat
   leest lkNumIn() in het Engels als een decimale punt) */
const nl = x => Math.round(x).toLocaleString(LANG === 'en' ? 'en-US' : 'nl-NL');

export default {
  name: 'Centrifuge',
  data() {
    return {r: stored('z-r', '8,4'), rpm: stored('z-rpm', '13000'), g: stored('z-g', ''), last: 'rpm'};
  },
  created() { this.sync(); },
  computed: {
    /* rpm en g na het doorrekenen; NaN als iets ontbreekt */
    val() {
      const r = num(this.r); let rpm = num(this.rpm), g = num(this.g);
      if (this.last === 'rpm' && isFinite(rpm) && isFinite(r)) g = K * r * rpm * rpm;
      else if (this.last === 'g' && isFinite(g) && isFinite(r)) rpm = Math.sqrt(g / (K * r));
      return {r, rpm, g};
    },
    res() {
      const t = this.t, {r, rpm, g} = this.val, byRpm = this.last === 'rpm';
      if (!isFinite(rpm) || !isFinite(g) || !isFinite(r)) return null;
      return {label: t(byRpm ? 'g-kracht' : 'Toerental'), big: nl(byRpm ? g : rpm), unit: byRpm ? '× g' : 'rpm',
        rows: [[t('Rotorstraal'), lkNumIn(fmt(r, 1)) + ' cm'], ['rpm', nl(rpm)], ['RCF', nl(g) + ' × g']]};
    }
  },
  methods: {
    /* het andere veld invullen, behalve als de cursor daar staat */
    sync() {
      const {rpm, g} = this.val;
      const act = typeof document !== 'undefined' && document.activeElement ? document.activeElement.id : '';
      if (this.last === 'rpm' && isFinite(g) && isFinite(rpm) && act !== 'z-g') this.g = String(Math.round(g));
      else if (this.last === 'g' && isFinite(rpm) && isFinite(g) && act !== 'z-rpm') this.rpm = String(Math.round(rpm));
    },
    onIn(id, e) {
      const v = e.target.value;
      if (id === 'z-r') this.r = v;
      else if (id === 'z-rpm') { this.rpm = v; this.last = 'rpm'; }
      else { this.g = v; this.last = 'g'; }
      this.sync();
    }
  }
};
</script>
