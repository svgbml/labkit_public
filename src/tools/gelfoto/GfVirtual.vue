<!-- ================= GELFOTO-EDITOR: LADDER UIT EEN FOTO =================
     Staat er geen ladder op je gel, dan kun je er een foto van een ladder bij laden: Labkit
     zoekt de ladderbanen, herkent het patroon in een bibliotheek van gangbare ladders en kan
     die ladder virtueel naast de gel zetten.

     Het herkennen (gfLadAnalyze, gfLadMatch) en het tekenen (gfVlPreview op #gf-vlcv,
     gfVlWarp naast de gel) blijven in src/engines/gelfoto.js; die zetten gf.vl en tikken deze
     component op. De id's gf-vlfile, gf-vlcv, gf-vlpick, gf-vllab en gf-vlsizes blijven,
     want de motor leest het label uit gf-vllab en tekent op de canvas. -->
<template>
  <div>
    <div style="margin-top:10px">
      <button type="button" id="gf-vltog" :aria-expanded="String(open)" @click="open = !open">{{ t('Ladder uit een foto (herkennen en virtueel naast de gel)') + (open ? ' ▾' : ' ▸') }}</button>
    </div>
    <div id="gf-vlbox" style="margin-top:6px" v-if="open">
      <p class="hint" style="font-size:13px;color:var(--muted);margin:6px 0">
        {{ t('Upload een foto of afbeelding van een ladder, bijvoorbeeld van de website van de leverancier. Labkit zoekt de ladderbanen, herkent het bandpatroon (afstanden en felle referentiebanden) in een bibliotheek van gangbare ladders en stelt de bandgroottes in. De cijfers op de afbeelding zelf worden niet gelezen: controleer de voorgestelde groottes.') }}
      </p>
      <div class="row" style="gap:8px;align-items:center">
        <input type="file" id="gf-vlfile" accept="image/*" :aria-label="t('Ladderfoto kiezen')" @change="pickFile">
        <button type="button" id="gf-vlclear" @click="clear">{{ t('Verwijderen') }}</button>
      </div>
      <canvas id="gf-vlcv" width="300" height="120" v-show="vl"
              style="max-width:100%;margin-top:8px;border-radius:3px;cursor:pointer" @click="cvClick"></canvas>
      <div id="gf-vlinfo" style="font-size:13px;margin-top:6px">{{ info ? t(info) : '' }}</div>
      <div class="fields" id="gf-vlf" style="margin-top:8px;grid-template-columns:1fr 1fr" v-if="ready">
        <div class="f">
          <label for="gf-vlpick">{{ t('Herkend als') }}</label>
          <select id="gf-vlpick" style="width:100%" :value="String(pickIdx)" @change="apply($event)">
            <option v-for="(c, i) in cands" :key="i" :value="String(i)">{{ t(ladName(c.key)) + ' · ' + score(c) }}</option>
            <option value="-1">{{ t('Eigen invoer') }}</option>
          </select>
        </div>
        <div class="f">
          <label for="gf-vllab">{{ t('Label boven virtuele ladder') }}</label>
          <input id="gf-vllab" class="txt" v-model="lab" @input="redraw" @change="syncLab">
        </div>
        <div class="f" style="grid-column:1/-1">
          <label for="gf-vlsizes">{{ t('Bandgroottes van boven naar beneden (leeg of – = overslaan)') }}</label>
          <input id="gf-vlsizes" class="mono" :value="sizesTxt" @input="setSizes">
        </div>
      </div>
      <div class="row" id="gf-vlbtns" style="margin-top:8px;gap:8px;align-items:center" v-if="ready">
        <button type="button" class="primary" id="gf-vluse" @click="use">{{ t('Gebruik deze groottes voor de detectie') }}</button>
        <label style="font-size:13px;display:flex;gap:6px;align-items:center">
          <input type="checkbox" :checked="show" @change="toggleShow($event)">{{ t('Toon virtuele ladder rechts van de gel') }}
        </label>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../../lib/bridge.js';
import {gfMix} from './tick.js';
import {ladName} from './ladders.js';

export default {
  name: 'GfVirtual',
  mixins: [gfMix],
  data() {
    /* het label boven de virtuele ladder: gfRender() leest het uit gf.vlLab, want het veld
       bestaat alleen zolang dit vak open staat */
    return {open: false, lab: gf.vlLab == null ? 'M' : gf.vlLab, sizesTxt: ''};
  },
  computed: {
    /* Elke computed leest zelf gfTick en daarna gf.vl. Een computed die bij een nieuwe tik
       hetzelfde object teruggeeft (gf.vl blijft hetzelfde object) waarschuwt zijn eigen
       afhankelijkheden niet, dus mag er geen keten van computeds op staan. */
    vl() { this.tick; return gf.vl || null; },
    /* pas als er een ladderbaan gevonden is, zijn de velden en de knoppen er */
    ready() { this.tick; const v = gf.vl; return !!(v && v.lanes && v.lanes.length); },
    cands() { this.tick; return (gf.vl && gf.vl.cands) || []; },
    pickIdx() { this.tick; const v = gf.vl; return v && v.pick != null ? v.pick : -1; },
    info() { this.tick; return (gf.vl && gf.vl.info) || ''; },
    show() { this.tick; return !!(gf.vl && gf.vl.show); },
    sizes() {
      this.tick;
      const v = gf.vl;
      return v && v.sizes ? lkNumIn(v.sizes.map(b => isFinite(b) ? String(b) : '–').join(' ')) : '';
    }
  },
  watch: {
    /* De canvas staat er pas als het vak open is; dan het voorbeeld opnieuw tekenen. */
    open(v) { if (v) this.$nextTick(() => gfVlPreview()); },
    /* Herkent Labkit een andere ladder, dan komen die groottes in het veld. Terwijl je er zelf
       in typt niet: dan zou elke toetsaanslag de genormaliseerde tekst terugzetten (en de
       cursor naar het eind). Zo deed de oude versie het ook. */
    sizes(v) {
      const el = document.getElementById('gf-vlsizes');
      if (!el || el !== document.activeElement) this.sizesTxt = v;
    }
  },
  methods: {
    ladName(k) { return ladName(k); },
    score(c) { return lkNumIn(fmt(Math.min(1, Math.max(0, c.score)) * 100, 0)) + '%'; },
    pickFile(e) { gfVlFile(e.target.files[0]); },
    clear() { gfVlClear(); },
    cvClick(e) { gfVlPick(e); },
    apply(e) { gfVlApply(+e.target.value); },
    setSizes(e) { this.sizesTxt = e.target.value; gfVlSizes(e.target.value); },
    redraw() { gf.vlLab = this.lab; gfRender(); },
    syncLab(e) { this.lab = e.target.value; gf.vlLab = this.lab; gfRender(); },
    use() { gfVlUse(); },
    toggleShow(e) { if (gf.vl) { gf.vl.show = e.target.checked; gfRender(); } }
  }
};
</script>
