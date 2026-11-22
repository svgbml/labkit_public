<!-- ================= GELFOTO-EDITOR: GEREEDSCHAPSBALK EN BEGELEIDE MODUS (S69, S70) =================
     De balk links van de foto. Begeleid (standaard) zijn het vier stappen: bijsnijden en
     rechtzetten, lanen, ladder, meten; met *Expert* zijn het de gereedschappen Bijsnijden ·
     Lanen · Ladder · Banden · Labels · Exporteren, plus Alles (alle panelen, zoals voorheen).
     De weergave staat als data-gv op .gfwrap; de hosts in src/shell/sections/gelfoto.html dragen
     in data-gs de weergaven waarin ze horen en de CSS verbergt de rest.

     De detectie draait al bij het laden (gfFromImage); komt een stap leeg binnen, dan draait hij
     hier, zodat je alleen corrigeert. De hint en Vorige/Volgende staan boven de panelen rechts
     (teleport naar #gf-ghint). De keuze voor Expert blijft bewaard. -->
<template>
  <nav class="gf-tbar" :aria-label="t('Gereedschap')">
    <template v-if="!expert">
      <button type="button" v-for="(s, i) in steps" :key="'s' + i" :id="'gf-g' + (i + 1)"
              :aria-pressed="step === i + 1" :class="{on: step === i + 1}" @click="go(i + 1)">{{ i + 1 }} · {{ t(s) }}</button>
    </template>
    <template v-else>
      <button type="button" v-for="o in tools" :key="o.k" :id="'gf-tool-' + o.k"
              :aria-pressed="tool === o.k" :class="{on: tool === o.k}" @click="pick(o.k)">{{ t(o.n) }}</button>
    </template>
    <label class="chk" :title="t('Alle gereedschappen vrij kiezen in plaats van de vier stappen')">
      <input type="checkbox" id="gf-expert" v-model="expert"> {{ t('Expert') }}</label>
  </nav>
  <teleport to="#gf-ghint">
    <div class="panel" id="gf-guide" v-if="!expert">
      <h3>{{ t('Stap ' + step + ' van 4') }}</h3>
      <p style="font-size:13px;margin:0">{{ hints[step - 1].map(z => t(z)).join(' ') }}</p>
      <div class="row" style="margin-top:8px;gap:6px">
        <button type="button" id="gf-gprev" :disabled="step === 1" @click="go(step - 1)">← {{ t('Vorige') }}</button>
        <button type="button" id="gf-gnext" class="primary" v-if="step < 4" @click="go(step + 1)">{{ t('Volgende') }} →</button>
      </div>
    </div>
  </teleport>
</template>

<script>
const STEPS = ['Bijsnijden', 'Lanen', 'Ladder', 'Meten'];
const TOOLS = [{k: 'crop', n: 'Bijsnijden'}, {k: 'lanes', n: 'Lanen'}, {k: 'ladder', n: 'Ladder'}, {k: 'bands', n: 'Banden'},
  {k: 'labels', n: 'Labels'}, {k: 'export', n: 'Exporteren'}, {k: 'all', n: 'Alles'}];
const HINTS = [
  ['Laad een gelfoto of de demo-gel.', 'Snij bij en zet recht als dat nodig is.'],
  ['De lanen zijn al gedetecteerd.', 'Versleep een lane op de foto, of vul het aantal in en detecteer opnieuw.'],
  ['De ladder is al herkend.', 'Controleer de bandgroottes in de tabel en versleep een band op de foto als hij niet goed ligt.'],
  ['De banden in de andere lanen zijn gemeten.', 'Verwijder wat geen echte band is en exporteer de figuur.']
];

export default {
  data() { return {expert: !!jget('lkGfExpert', false), step: 1, tool: 'all', steps: STEPS, tools: TOOLS, hints: HINTS}; },
  mounted() { this.apply(); },
  watch: { expert(v) { jset('lkGfExpert', v); this.apply(); } },
  methods: {
    apply() {
      const w = document.querySelector('#t-gelfoto .gfwrap'), v = this.expert ? (this.tool === 'all' ? '' : this.tool) : 's' + this.step;
      if (v) w.setAttribute('data-gv', v); else w.removeAttribute('data-gv');
      document.getElementById('gf-ghint').style.display = this.expert ? 'none' : '';   /* geen lege rij boven de panelen */
    },
    pick(k) { this.tool = k; this.apply(); },
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
