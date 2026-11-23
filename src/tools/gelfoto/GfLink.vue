<!-- ================= GELFOTO-EDITOR: VERGELIJKEN EN DOORSTUREN (S79) =================
     Vergelijken met de verwachte banden uit de Gelplanner (gfCompare) en de bandintensiteiten
     doorsturen naar de WB-normalisatie (gfToWb). Het rekenwerk staat in src/engines/gelfoto.js. -->
<template>
  <div class="panel">
    <h3>{{ t('Vergelijken en doorsturen') }}</h3>
    <div class="row" style="gap:6px">
      <button type="button" id="gf-cmp" :title="t('Slotje 1 van de Gelplanner is lane 1 van de foto')" @click="cmp">{{ t('Vergelijk met de Gelplanner') }}</button>
      <button type="button" id="gf-cmpoff" v-if="res" @click="off">{{ t('Vergelijking weg') }}</button>
    </div>
    <div class="tbl-wrap" v-if="res && res.length" style="margin-top:8px">
      <table class="mini" id="gf-cmptbl">
        <thead><tr><th class="num">{{ t('Lane') }}</th><th>{{ t('Naam') }}</th><th>{{ t('Verwacht') }}</th><th>{{ t('Extra') }}</th></tr></thead>
        <tbody>
          <tr v-for="c in res" :key="c.li">
            <td class="num">{{ c.li + 1 }}</td>
            <td>{{ c.name }}</td>
            <td><span v-for="e in c.exp" :key="e.bp" :style="{color: e.found ? 'var(--ok)' : 'var(--bad)', marginRight: '8px'}">{{ e.found ? '✓' : '✗' }} {{ e.bp }}</span></td>
            <td>{{ c.extra.map(m => sz(m.bp)).join('; ') }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="res" style="font-size:12.5px;color:var(--muted);margin:6px 0 0">{{ t('Groen: verwacht en gevonden. Rood gestippeld: verwacht maar niet gemeten. Oranje omcirkeld: gemeten maar niet verwacht.') }}</p>
    <div class="row" style="margin-top:12px;align-items:flex-end">
      <div class="f">
        <label for="gf-wbt">{{ t('Doeleiwit') }}</label>
        <select id="gf-wbt" v-model="wbt"><option value="">–</option><option v-for="g in groups" :key="g" :value="g">≈ {{ g }}</option></select>
      </div>
      <div class="f">
        <label for="gf-wbl">{{ t('Laadcontrole') }}</label>
        <select id="gf-wbl" v-model="wbl"><option value="">–</option><option v-for="g in groups" :key="g" :value="g">≈ {{ g }}</option></select>
      </div>
      <button type="button" id="gf-towb" :disabled="!wbt || !wbl" @click="toWb">{{ t('Naar WB-normalisatie') }}</button>
    </div>
    <p style="font-size:12.5px;color:var(--muted);margin:6px 0 0">{{ t('Meet eerst de banden; per lane gaat de intensiteit van de band die het dichtst bij de gekozen grootte ligt mee.') }}</p>
  </div>
</template>

<script>
import {gfMix} from './tick.js';

export default {
  mixins: [gfMix],
  data() { return {wbt: '', wbl: ''}; },
  computed: {
    res() { this.tick; return gf.cmp ? gf.cmp.slice() : null; },
    groups() { this.tick; return gfSizeGroups(); }
  },
  methods: {
    cmp() { gfCompare(); },
    off() { gfCompareOff(); },
    toWb() { gfToWb(+this.wbt, +this.wbl); },
    sz(v) { return gfSizeTxt(v); }
  }
};
</script>
