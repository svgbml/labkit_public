<!-- ================= DE SCHAKELAAR VOOR ONLINE OPZOEKEN (S195) =================
     Dezelfde schakelaar staat in Instellingen en boven elk opzoekpaneel; beide lezen en zetten
     `ncbi` uit src/lib/ncbi.js. De velden hebben bewust geen id: zo komen ze niet in de
     invoeropslag, een gedeelde link of ongedaan maken (zie persistable() in src/legacy/app.js). -->
<template>
  <div class="lk-ncbi">
    <label class="chk"><input type="checkbox" v-model="s.on" @change="save"> {{ t('Online opzoeken bij NCBI toestaan') }}</label>
    <p style="font-size:13px;color:var(--muted);margin:8px 0 0">{{ t('Staat dit uit (de standaard), dan maakt LabKit geen enkele verbinding met NCBI. Staat het aan, dan gaat alleen het rs-nummer of accessienummer dat je opzoekt naar NCBI, met de naam LabKit. Niets over je monsters, je uitslagen of jou.') }}</p>
    <div v-if="full" class="f" style="margin-top:10px"><label>{{ t('E-mailadres voor NCBI (niet verplicht)') }}
      <input type="email" class="txt" v-model="s.email" autocomplete="off" spellcheck="false" style="width:100%" @change="save"></label></div>
    <p v-if="full" style="font-size:13px;color:var(--muted);margin:6px 0 0">{{ t('NCBI vraagt om een adres waarop ze je kunnen bereiken als er iets misgaat. LabKit vult het nooit zelf in en stuurt het alleen mee als je het hier typt.') }}</p>
  </div>
</template>

<script>
import {ncbi, ncbiSave} from '../../lib/ncbi.js';

export default {
  name: 'NcbiSwitch',
  props: {full: Boolean},   /* full: ook het e-mailveld (Instellingen); anders alleen de schakelaar */
  data() { return {s: ncbi}; },
  methods: {save: ncbiSave},
};
</script>
