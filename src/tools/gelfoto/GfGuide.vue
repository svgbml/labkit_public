<!-- ================= GELFOTO-EDITOR: BEGELEIDE MODUS (S69) =================
     Vier stappen: bijsnijden en rechtzetten, lanen, ladder, meten. Elke stap toont alleen zijn
     eigen panelen: de hosts in src/shell/sections/gelfoto.html dragen data-gs met de stappen
     waarin ze horen, en de CSS verbergt de rest zolang .gfwrap data-gstep heeft. De detectie
     draait al bij het laden (gfFromImage); komt een stap leeg binnen, dan draait hij hier, zodat
     je alleen corrigeert. "Expert" haalt data-gstep weg en toont alles; de keuze blijft bewaard. -->
<template>
  <div class="panel" id="gf-guide">
    <div class="row" style="justify-content:space-between;align-items:center;gap:8px">
      <div class="seg" v-if="!expert" role="tablist" :aria-label="t('Stappen')" style="display:flex;width:100%">
        <button type="button" v-for="(s, i) in steps" :key="i" :id="'gf-g' + (i + 1)" role="tab"
                :aria-selected="step === i + 1" style="flex:1;padding:5px 4px;white-space:nowrap" :class="{on: step === i + 1}" @click="go(i + 1)">{{ i + 1 }} · {{ t(s) }}</button>
      </div>
      <label class="chk"><input type="checkbox" id="gf-expert" v-model="expert"> {{ t('Expert: alles tonen') }}</label>
    </div>
    <template v-if="!expert">
      <p style="font-size:13px;margin:10px 0 0">{{ hints[step - 1].map(z => t(z)).join(' ') }}</p>
      <div class="row" style="margin-top:8px;gap:6px">
        <button type="button" id="gf-gprev" :disabled="step === 1" @click="go(step - 1)">← {{ t('Vorige') }}</button>
        <button type="button" id="gf-gnext" class="primary" v-if="step < 4" @click="go(step + 1)">{{ t('Volgende') }} →</button>
      </div>
    </template>
  </div>
</template>

<script>
const STEPS = ['Bijsnijden', 'Lanen', 'Ladder', 'Meten'];
const HINTS = [
  ['Laad een gelfoto of de demo-gel.', 'Snij bij en zet recht als dat nodig is.'],
  ['De lanen zijn al gedetecteerd.', 'Versleep een lane op de foto, of vul het aantal in en detecteer opnieuw.'],
  ['De ladder is al herkend.', 'Controleer de bandgroottes in de tabel en versleep een band op de foto als hij niet goed ligt.'],
  ['De banden in de andere lanen zijn gemeten.', 'Verwijder wat geen echte band is en exporteer de figuur.']
];

export default {
  data() { return {expert: !!jget('lkGfExpert', false), step: 1, steps: STEPS, hints: HINTS}; },
  mounted() { this.apply(); },
  watch: { expert(v) { jset('lkGfExpert', v); this.apply(); } },
  methods: {
    apply() {
      const w = this.$el.closest('.gfwrap');
      if (this.expert) w.removeAttribute('data-gstep'); else w.setAttribute('data-gstep', this.step);
    },
    go(n) {
      this.step = Math.max(1, Math.min(4, n)); this.apply();
      if (!gf.src) return;
      /* een stap die leeg binnenkomt, detecteert eerst zelf */
      if (n === 2 && !gf.lanes.length) gfDetectLanes();
      if (n === 3 && gf.lanes.length && !gf.bands.length) gfDetectBands();
      if (n === 4 && !gf.marks.length && gf.bands.filter(b => isFinite(b.bp)).length >= 2) gfMeasAll();
    }
  }
};
</script>
