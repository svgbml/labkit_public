<!-- ================= GELFOTO-EDITOR: METEN UIT AFSTANDEN (S79, #202) =================
     Zonder foto: de afstanden van de ladderbanden en van de onbekende banden, gemeten met een
     liniaal vanaf het putje. gfFromDist (src/engines/gelfoto.js) tekent er een gel van en meet
     de onbekende banden; Agarosegel & bandgrootte stuurt zijn ladderrijen naar dezelfde functie.
     De id's beginnen met gf-dist, dan gaan ze niet mee in een project (gfProjFields). -->
<template>
  <div class="panel">
    <h3>{{ t('Zonder foto: meten uit afstanden') }}</h3>
    <div class="f">
      <label for="gf-dist-lad">{{ t('Ladder') }}</label>
      <select id="gf-dist-lad" v-model="lad">
        <option v-for="o in ladders" :key="o.v" :value="o.v">{{ t(o.n) }}</option>
      </select>
    </div>
    <div class="f" style="margin-top:8px">
      <label for="gf-dist-d">{{ t('Afstand per ladderband vanaf het putje (mm), van boven naar beneden') }}</label>
      <input id="gf-dist-d" class="mono" inputmode="decimal" v-model="d" :placeholder="sizes">
    </div>
    <div class="f" style="margin-top:8px">
      <label for="gf-dist-u">{{ t('Onbekende banden, afstand (mm)') }}</label>
      <input id="gf-dist-u" class="mono" inputmode="decimal" v-model="u">
    </div>
    <div class="row" style="margin-top:8px">
      <button type="button" id="gf-dist-go" @click="go">{{ t('Teken en meet') }}</button>
    </div>
    <p style="font-size:12.5px;color:var(--muted);margin:6px 0 0">{{ t('Eén getal per ladderband, in de volgorde van de ladder; een streepje voor een band die je niet ziet.') }}</p>
  </div>
</template>

<script>
import {LADS, ladProt} from './ladders.js';

/* "31 44,5" of "31; 44.5": een komma tussen cijfers is een decimaalteken; "-" telt als leeg */
const nums_ = s => String(s).trim().split(/[\s;]+/).filter(Boolean).map(q => (/^[–-]$/.test(q) ? NaN : num(q)));

export default {
  data() { return {lad: '100', d: '', u: ''}; },
  computed: {
    ladders() { return LADS.filter(o => o.v !== 'custom' && !ladProt(o.v) && LADDERS[o.v]); },
    sizes() { return (LADDERS[this.lad] || []).join(' '); }
  },
  methods: {
    go() { gfFromDist(this.lad, nums_(this.d), nums_(this.u)); }
  }
};
</script>
