<!-- ================= GELFOTO-EDITOR, PANEEL 4: DE LADDERBANDEN =================
     Welke ladderlane je bekijkt, de banden van die lane met hun grootte en hun label, en de
     symbolen die je in een label kunt zetten (≥, ~, †, …). De banden zelf komen uit de
     detectie in web/index.html (gfFindLadder, gfPeakNear) en worden ook op de foto versleept;
     die code blijft daar en tikt deze component op.

     Een samengevoegde band (⤓, voor samengeperste ladderbanden) houdt zijn label als 900/800
     en telt niet mee voor de ijklijn: gfMergeBands() en gfSplitBand() blijven het rekenwerk.

     De id's gf-bt en gf-ladsel blijven; gfUpdate() zette de kop van de bp-kolom eerst met de
     hand, nu volgt die uit gf.unit. -->
<template>
  <div>
    <div class="row" id="gf-ladsel" style="margin-top:8px;gap:4px;align-items:center" v-if="ladLanes.length > 1">
      <span style="font-size:13px">{{ t('Banden van ladderlane:') }}</span>
      <button type="button" v-for="o in ladLanes" :key="o.i" :class="{on: o.i === active}"
              @click="pick(o.i)">{{ o.name }}</button>
    </div>
    <div class="tbl-wrap" style="margin-top:8px;max-height:220px;overflow-y:auto">
      <table class="mini" id="gf-bt">
        <thead>
          <tr>
            <th class="num">{{ t('y (px)') }}</th>
            <th class="num">{{ unit }}</th>
            <th :title="t('Eigen tekst voor het label; leeg = de waarde')">{{ t('Label') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!bands.length"><td colspan="4" style="color:var(--muted)">{{ t('Nog geen ladderbanden.') }}</td></tr>
          <tr v-for="(b, i) in bands" :key="i">
            <td class="num">{{ num0(b.y) }}</td>
            <td>
              <span v-if="b.merged" style="color:var(--muted)">{{ t('samengevoegd') }}</span>
              <input v-else inputmode="decimal" style="text-align:right;width:72px" :aria-label="t('Bandgrootte')"
                     :value="bpVal(b)" @input="setBp(i, $event)">
            </td>
            <td>
              <input class="txt" :ref="'lab' + i" :value="b.lab || ''" :placeholder="ph(b)" style="width:96px"
                     :aria-label="t('Label ladderband')" @focus="focus = i" @input="setLab(i, $event)">
            </td>
            <td style="white-space:nowrap">
              <button v-if="b.merged" type="button" class="ghost" :title="t('Samenvoeging ongedaan maken')"
                      :aria-label="t('Splitsen')" @click="split(i)">⤒</button>
              <button v-else-if="i < bands.length - 1" type="button" class="ghost"
                      :title="t('Samenvoegen met de band eronder')" :aria-label="t('Samenvoegen met volgende band')"
                      @click="merge(i)">⤓</button>
              <button type="button" class="ghost" :aria-label="t('Verwijder band')" @click="del(i)">✕</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="row" id="gf-sym" style="margin-top:6px;gap:4px;align-items:center">
      <span style="font-size:12.5px;color:var(--muted)">{{ t('Symbool in label:') }}</span>
      <button type="button" v-for="sy in syms" :key="sy" @click="sym(sy)">{{ sy }}</button>
      <span style="font-size:12.5px;color:var(--muted);flex-basis:100%">{{ t('⤓ voegt een band samen met de band eronder (voor samengeperste ladderbanden). Een samengevoegde band krijgt een label als 900/800 en telt niet mee voor de ijklijn.') }}</span>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../../lib/bridge.js';
import {gfMix} from './tick.js';

const SYMS = ['≥', '≤', '~', '*', '†', '/', '–', '+'];

export default {
  name: 'GfBands',
  mixins: [gfMix],
  data() {
    return {focus: null};
  },
  computed: {
    syms() { return SYMS; },
    unit() { this.tick; return gf.unit; },
    /* een verse lijst: de motor wijzigt de banden in de lijst zelf (samenvoegen, splitsen,
       een band weghalen), en dan verandert gf.bands zelf niet van object */
    bands() { this.tick; return gf.bands.slice(); },
    active() { this.tick; return gf.ladder; },
    /* de lanen waaruit je kunt kiezen: de ladderlanen, en altijd de lane die nu actief is */
    ladLanes() {
      this.tick;
      return gf.lanes.map((l, i) => ({l, i})).filter(({l, i}) => l.lad || i === gf.ladder)
        .map(({l, i}) => ({i, name: l.label || String(i + 1)}));
    }
  },
  methods: {
    num0(v) { return lkNumIn(String(Math.round(v))); },
    /* zoals inp() deed: een punt wordt een komma, en niets bij een ontbrekende waarde */
    bpVal(b) { return isFinite(b.bp) ? lkNumIn(String(b.bp).replace('.', ',')) : ''; },
    ph(b) { return isFinite(b.bp) ? gfLab(b.bp) : ''; },
    pick(i) { gfSetActive(i); },
    setBp(i, e) { gfBandBp(i, num(e.target.value)); },
    setLab(i, e) { gf.bands[i].lab = e.target.value; gfRender(); },
    merge(i) { gfBandMerge(i); },
    split(i) { gfBandSplit(i); },
    del(i) { gfBandDel(i); },
    /* Een symbool komt op de plek van de cursor in het labelveld waar je het laatst stond. Is
       het veld nog leeg, dan komt de waarde van de band er eerst in te staan, zoals eerst. */
    sym(sy) {
      const i = this.focus, b = i == null ? null : gf.bands[i];
      if (!b) { gfStatus('Klik eerst in een labelveld van de ladderbanden.'); return; }
      const el = (this.$refs['lab' + i] || [])[0] || this.$refs['lab' + i];
      if (el && !el.value && isFinite(b.bp)) el.value = gfLab(b.bp);
      const v = el ? el.value : (b.lab || '');
      const p = el && el.selectionStart != null ? el.selectionStart : v.length;
      const nv = v.slice(0, p) + sy + v.slice(p);
      b.lab = nv;
      if (el) { el.value = nv; el.focus(); el.setSelectionRange(p + 1, p + 1); }
      gfRender();
    }
  }
};
</script>
