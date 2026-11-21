<!-- ================= GELFOTO-EDITOR, PANEEL 4: ACHTERGROND, Rf EN MASSA =================
     De velden voor de densitometrie (hoe de achtergrond onder een band wordt bepaald), het
     front voor R<sub>f</sub> en de massa per ladderband. Het rekenwerk zelf (rolling ball,
     densArea, gfRf, gfMassSlope) blijft in src/engines/gelfoto.js en leest deze velden op hun id. -->
<template>
  <div>
    <div class="fields" style="margin-top:8px;grid-template-columns:repeat(auto-fit,minmax(130px,1fr))">
      <div class="f">
        <label for="gf-bg">{{ t('Achtergrond (densitometrie)') }}</label>
        <select id="gf-bg" style="width:100%" v-model="f.bg">
          <option value="ball">{{ t('Rolling ball') }}</option>
          <option value="valley">{{ t('Dal tot dal') }}</option>
          <option value="none">{{ t('Geen (laagste punt)') }}</option>
        </select>
      </div>
      <div class="f">
        <label for="gf-ball">{{ t('Straal bal') }}</label>
        <div class="inu"><input id="gf-ball" inputmode="numeric" :placeholder="t('auto')"
                                v-model="f.ball" @change="sync"><span class="u">px</span></div>
      </div>
      <div class="f">
        <label for="gf-front">{{ t('Front voor Rf') }}</label>
        <div class="inu"><input id="gf-front" inputmode="numeric" :placeholder="t('onderkant')"
                                v-model="f.front" @change="sync"><span class="u">px</span></div>
      </div>
    </div>
    <div class="fields" style="margin-top:8px;grid-template-columns:1fr 2fr">
      <div class="f">
        <label for="gf-lload">{{ t('Ladder geladen') }}</label>
        <div class="inu"><input id="gf-lload" inputmode="decimal" v-model="f.lload"
                                @change="sync"><span class="u">ng</span></div>
      </div>
      <div class="f">
        <label for="gf-lmass">{{ t('ng per ladderband bij 500 ng (groot → klein)') }}</label>
        <input id="gf-lmass" class="mono" v-model="f.lmass" @change="sync">
      </div>
    </div>
  </div>
</template>

<script>
import {gfMix} from './tick.js';

export default {
  name: 'GfDens',
  mixins: [gfMix],
  data() {
    return {f: {bg: 'ball', ball: '', front: '',
      lload: '500', lmass: '45 35 95 27 24 21 18 97 38 29 25 48'}};
  },
  watch: {
    /* De gemeten intensiteit hangt van deze drie af, dus die wordt opnieuw bepaald. */
    'f.bg'() { gfDensChanged(); },
    'f.ball'() { gfDensChanged(); },
    'f.front'() { gfDensChanged(); },
    /* De massa per band verandert alleen wat er in de tabel en op de foto staat. */
    'f.lload'() { gfMassChanged(); },
    'f.lmass'() { gfMassChanged(); }
  },
  methods: {
    /* De ladderkeuze zet gf-lmass via de invoer zelf (met een input-event), daar reageert
       v-model op. Een change-event alleen, zoals bij delen en ongedaan maken, niet. */
    sync(e) {
      const k = {'gf-ball': 'ball', 'gf-front': 'front', 'gf-lload': 'lload', 'gf-lmass': 'lmass'}[e.target.id];
      if (k) this.f[k] = e.target.value;
    }
  }
};
</script>
