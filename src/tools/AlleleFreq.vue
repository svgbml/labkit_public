<!-- Gedeelde allelfrequentietabel voor rmp, mx en kn. De ouder geeft `fill(map)`: die zet de
     frequenties in de eigen rijen en geeft de ontbrekende locus/allel-combinaties terug. -->
<template>
  <details class="af" style="margin-top:12px" @toggle="reload">
    <summary>{{ t('Allelfrequentietabel') }}</summary>
    <div class="fields" style="margin-top:8px">
      <div class="f">
        <label>{{ t('Populatie') }}</label>
        <select v-model="pop" @change="save">
          <option v-for="(_, n) in pops" :key="n" :value="n">{{ n === ex ? t(n) : n }}</option>
        </select>
      </div>
    </div>
    <textarea v-model="pops[pop]" rows="6" style="width:100%;margin-top:8px;font-family:monospace;font-size:12px" spellcheck="false" @input="save"></textarea>
    <p style="font-size:12px;color:var(--muted);margin:4px 0 0">{{ t('Eén regel per allel: locus, allel, frequentie (tab, ; of spatie). De voorbeeldfrequenties zijn verzonnen; gebruik de populatiedatabase van je opdracht.') }}</p>
    <div class="row" style="margin-top:8px">
      <button type="button" @click="fillNow">{{ t('Vul frequenties in') }}</button>
      <button type="button" class="ghost" @click="adding = !adding">{{ t('+ Populatie') }}</button>
      <template v-if="adding">
        <input v-model="name" class="txt" :placeholder="t('Naam')" style="width:140px" @keyup.enter="addPop">
        <button type="button" @click="addPop">{{ t('Toevoegen') }}</button>
      </template>
    </div>
    <lk-note v-if="bad.length" kind="warn">{{ t('Ongeldige regels in de tabel (overgeslagen): ') }}{{ bad.join(', ') }}</lk-note>
    <lk-note v-if="miss.length" kind="warn">{{ t('Niet gevonden in de tabel (niet ingevuld): ') }}{{ miss.join(', ') }}</lk-note>
    <lk-note v-else-if="done" kind="ok">{{ t('Frequenties ingevuld.') }}</lk-note>
  </details>
</template>

<script>
import {AF_EXAMPLE, afLoad, afSave, afParse} from '../lib/afreq.js';

export default {
  name: 'AlleleFreq',
  props: {fill: {type: Function, required: true}},
  data() { return {...afLoad(), ex: AF_EXAMPLE, adding: false, name: '', bad: [], miss: [], done: false}; },
  methods: {
    /* andere forensische tools kunnen de keuze hebben gewijzigd sinds deze is geladen */
    reload() { Object.assign(this, afLoad()); },
    save() { afSave({pop: this.pop, pops: this.pops}); },
    addPop() {
      const n = this.name.trim();
      if (!n || this.pops[n] != null) return;
      this.pops = {...this.pops, [n]: ''};
      this.pop = n; this.name = ''; this.adding = false; this.save();
    },
    fillNow() {
      this.reload();
      const r = afParse(this.pops[this.pop]);
      this.bad = r.bad;
      this.miss = this.fill(r.map);
      this.done = true;
    }
  }
};
</script>
