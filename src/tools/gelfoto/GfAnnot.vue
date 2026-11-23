<!-- ================= GELFOTO-EDITOR: LABELS, AANTEKENINGEN EN KLEUR (S78) =================
     Bandgroottes naast de banden, pijlen en kaders op de foto, het kanaal voor de grijswaarden en
     pseudokleuren. Het tekenen en de muis zitten in src/engines/gelfoto.js (gfAnnDraw, de modi
     'arrow' en 'box' van setMode, GF_LUTS); de velden houden hun id, want gfUpdate() en gxOpts()
     lezen ze daar uit, en het project en de geschiedenis nemen ze mee. -->
<template>
  <div class="panel">
    <h3>{{ t('Labels, aantekeningen en kleur') }}</h3>
    <label class="chk"><input type="checkbox" id="gf-blab"> {{ t('Grootte naast de gemeten banden') }}</label>
    <div class="row" style="margin-top:10px;gap:6px;align-items:flex-end">
      <button type="button" id="gf-aarrow" @click="mode('arrow')">→ {{ t('Pijl') }}</button>
      <button type="button" id="gf-abox" @click="mode('box')">▭ {{ t('Kader') }}</button>
      <div class="f">
        <label for="gf-acol">{{ t('Kleur') }}</label>
        <select id="gf-acol">
          <option v-for="c in cols" :key="c.v" :value="c.v">{{ t(c.n) }}</option>
        </select>
      </div>
    </div>
    <p style="font-size:12.5px;color:var(--muted);margin:6px 0 0">{{ t('Kies Pijl of Kader en sleep over de foto; klik de knop nog eens om te stoppen.') }}</p>
    <ul v-if="ann.length" id="gf-annlist" style="list-style:none;margin:6px 0 0;padding:0;display:grid;gap:4px;font-size:13px">
      <li v-for="(a, i) in ann" :key="i" style="display:flex;gap:6px;align-items:center">
        <span :style="{width: '12px', height: '12px', borderRadius: '2px', background: a.c, flex: 'none'}"></span>
        <span style="flex:1">{{ t(a.t === 'box' ? 'Kader' : 'Pijl') }} {{ i + 1 }}</span>
        <button type="button" class="ghost" :aria-label="t('Verwijderen')" @click="del(i)">✕</button>
      </li>
    </ul>
    <div class="row" style="margin-top:10px">
      <div class="f">
        <label for="gf-chan">{{ t('Kanaal voor grijswaarden') }}</label>
        <select id="gf-chan" :title="t('Bij een kleurenfoto (blauw licht, UV) geeft één kanaal vaak meer contrast')">
          <option value="lum">{{ t('Luminantie (standaard)') }}</option>
          <option value="r">{{ t('Rood') }}</option>
          <option value="g">{{ t('Groen') }}</option>
          <option value="b">{{ t('Blauw') }}</option>
          <option value="auto">{{ t('Automatisch (meeste contrast)') }}</option>
        </select>
      </div>
      <div class="f">
        <label for="gf-lut">{{ t('Pseudokleur') }}</label>
        <select id="gf-lut" v-model="lut">
          <option value="">{{ t('Geen (grijs)') }}</option>
          <option value="fire">{{ t('Vuur') }}</option>
          <option value="viridis">Viridis</option>
          <option value="green">{{ t('Groen') }}</option>
          <option value="magenta">{{ t('Magenta') }}</option>
        </select>
      </div>
    </div>
    <lk-note v-if="lut" kind="warn">{{ t('Pseudokleuren zijn voor presentaties.') }} {{ t('Ze veranderen de helderheid niet-lineair: kwantificeer nooit op een figuur met pseudokleuren.') }}</lk-note>
  </div>
</template>

<script>
import {gfMix} from './tick.js';

const COLS = [{v: '#d62828', n: 'Rood'}, {v: '#e8a317', n: 'Oranje'}, {v: '#ffd60a', n: 'Geel'}, {v: '#ffffff', n: 'Wit'}, {v: '#111111', n: 'Zwart'}, {v: '#1d5bc4', n: 'Blauw'}];

export default {
  mixins: [gfMix],
  data() { return {cols: COLS, lut: ''}; },
  computed: {
    ann() { this.tick; return (gf.ann || []).slice(); }
  },
  methods: {
    mode(m) { if (gf.src) setMode(m); },
    del(i) { gfAnnDel(i); }
  }
};
</script>
