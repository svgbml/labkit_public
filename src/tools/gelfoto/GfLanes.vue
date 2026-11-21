<!-- ================= GELFOTO-EDITOR, PANEEL 3: DE LANEN =================
     Het aantal lanen, de lanebreedte en de tabel met de lanen: naam, of het een ladderlane is
     en weghalen. De detectie zelf (gfDetectLanes, de kamtanden, het slepen van de driehoekjes
     onder de gel) blijft in src/engines/gelfoto.js; die zet gf.lanes en tikt de componenten op.

     De id's gf-n, gf-detect, gf-addlane, gf-lw en gf-lanes blijven: gfDetectLanes() leest het
     aantal uit gf-n, gfUpdate() de breedte uit gf-lw, en tests/validate.py zet gf-n zo. -->
<template>
  <div class="panel">
    <h3>{{ t('3 · Lanen') }}</h3>
    <div class="row">
      <div class="f">
        <label for="gf-n">{{ t('Aantal (leeg = auto)') }}</label>
        <input id="gf-n" inputmode="numeric" style="width:90px" v-model="n" @change="syncN">
      </div>
      <div class="f">
        <label>&nbsp;</label>
        <button type="button" class="primary" id="gf-detect" @click="detect">{{ t('Detecteer lanen') }}</button>
      </div>
    </div>
    <div class="row" style="margin-top:8px">
      <button type="button" id="gf-addlane" @click="addLane">{{ t('+ Lane (klik op foto)') }}</button>
    </div>
    <div class="rng" style="margin-top:8px">
      <label for="gf-lw">{{ t('Lanebreedte') }}</label>
      <input type="range" id="gf-lw" min="4" max="200" v-model="lw" @change="syncLw">
      <span id="gf-lwv">{{ lwTxt }}</span>
    </div>
    <div class="tbl-wrap" style="margin-top:8px;max-height:240px;overflow-y:auto">
      <table class="mini" id="gf-lanes">
        <thead>
          <tr>
            <th>#</th>
            <th>{{ t('Label') }}</th>
            <th :title="t('Ladderlane')">{{ t('Ladder') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!lanes.length"><td colspan="4" style="color:var(--muted)">{{ t('Nog geen lanen.') }}</td></tr>
          <tr v-for="(l, i) in lanes" :key="i">
            <td class="num">{{ nr(i + 1) }}</td>
            <td><input class="txt" :value="l.label" style="width:110px" @input="label(i, $event)"></td>
            <td style="text-align:center">
              <input type="checkbox" :checked="l.lad || i === active" :aria-label="t('Ladderlane ' + (i + 1))"
                     @change="lad(i, $event)">
            </td>
            <td><button type="button" class="ghost" :aria-label="t('Verwijder lane')" @click="del(i)">✕</button></td>
          </tr>
        </tbody>
      </table>
    </div>
    <p style="font-size:12.5px;color:var(--muted);margin:8px 0 0">
      {{ t('Sleep de blauwe driehoekjes onder de gel om een lane te verschuiven; de oranje driehoekjes links zijn de ladderbanden.') }}
    </p>
  </div>
</template>

<script>
import {lkNumIn} from '../../lib/bridge.js';
import {gfMix} from './tick.js';

export default {
  name: 'GfLanes',
  mixins: [gfMix],
  data() {
    return {n: '', lw: '40'};
  },
  computed: {
    /* gf.lanes is een gewone lijst in src/engines/gelfoto.js; de motor tikt na elke verandering op.
       slice() geeft een verse lijst: een computed die hetzelfde object teruggeeft waarschuwt
       zijn afhankelijkheden niet, en de motor wijzigt de lanen in de lijst zelf (gfDetectBands
       hernoemt ze bijvoorbeeld). */
    lanes() { this.tick; return gf.lanes.slice(); },
    active() { this.tick; return gf.ladder; },
    lwTxt() { return lkNumIn(String(Math.round(+this.lw) || 0)); }
  },
  methods: {
    /* Een schuifregelaar of een getal verzetten stuurt een input-event, dat de app zelf al
       oppakt (calc.gelfoto -> gfUpdate leest gf-lw). Delen via een link en ongedaan maken
       sturen alleen een change-event; dat ziet v-model bij deze twee velden niet. */
    syncN(e) { this.n = e.target.value; },
    syncLw(e) { this.lw = e.target.value; },
    detect() { gfDetectLanes(); },
    addLane() { setMode('addlane'); },
    label(i, e) { gf.lanes[i].label = e.target.value; gfRender(); },
    lad(i, e) { gfLaneLad(i, e.target.checked); },
    del(i) { gfLaneDel(i); },
    nr(i) { return lkNumIn(String(i)); }
  }
};
</script>
