<!-- ================= GELFOTO-EDITOR: RESULTAAT PER LANE EN FIGUURLEGENDA =================
     Zelfde metingen als GfMarks (gf.marks, dichtstbijzijnde lane op x, relatieve intensiteit,
     ng uit de massaladder), maar dan per lane gegroepeerd, plus een legenda die uit de ladder,
     de gelcondities en de lanelabels wordt opgebouwd. Elke zin is één vertaalsleutel; de
     tekst van de gebruiker (gelcondities, lanelabels) gaat door uv(). -->
<template>
  <div class="panel">
    <h3>{{ t('Resultaat per lane en figuurlegenda') }}</h3>
    <lk-note v-if="!rows.length" kind="info">{{ t('Meet eerst banden (paneel 4); dan verschijnt hier de tabel per lane.') }}</lk-note>
    <div class="tbl-wrap" v-else>
      <table class="mini" data-xl="1">
        <thead>
          <tr>
            <th class="num">{{ t('Lane') }}</th>
            <th>{{ t('Label') }}</th>
            <th class="num">{{ t('≈ ' + unit) }}</th>
            <th class="num">{{ t('Rel. int.') }}</th>
            <th class="num" v-if="ngOn">{{ t('≈ ng') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.lane">
            <td class="num">{{ r.lane }}</td>
            <td>{{ r.label }}</td>
            <td class="num">{{ r.size }}</td>
            <td class="num">{{ r.rel }}</td>
            <td class="num" v-if="ngOn">{{ r.ng }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="row" style="margin-top:8px" v-if="rows.length">
      <button type="button" id="gf-res-copy" @click="copyTable($event.currentTarget)">{{ t('Kopieer tabel (Excel)') }}</button>
    </div>
    <div class="f" style="margin-top:8px">
      <label for="gf-cond">{{ t('Gelcondities') }}</label>
      <input id="gf-cond" class="txt" v-model="cond" :placeholder="t('1% agarose, 100 V, 45 min')">
    </div>
    <p id="gf-legend" style="margin:8px 0 0">{{ legend }}</p>
    <div class="row" style="margin-top:8px">
      <button type="button" id="gf-legend-copy" @click="copyLegend($event.currentTarget)">{{ t('Kopieer legenda') }}</button>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../../lib/bridge.js';
import {gfMix} from './tick.js';
import {ladName} from './ladders.js';

export default {
  name: 'GfResult',
  mixins: [gfMix],
  data() { return {cond: ''}; },
  computed: {
    unit() { this.tick; return gf.disp === 'kb' ? 'kb' : gf.unit; },
    ngOn() { this.tick; return isFinite(gfMassSlope()); },
    /* één rij per lane met metingen; de lane-keuze en de ng-berekening zijn die van GfMarks */
    rows() {
      this.tick;
      gfMarkInt();
      const slope = gfMassSlope(), mx = Math.max(0, ...gf.marks.map(m => m.int || 0));
      const by = new Map();
      gf.marks.forEach(m => {
        let li = -1, bd = Infinity;
        gf.lanes.forEach((l, j) => { const d = Math.abs(l.x - m.x); if (d < bd) { bd = d; li = j; } });
        if (li < 0) return;
        const ng = (m.int || 0) / slope;
        if (!by.has(li)) by.set(li, {sizes: [], rel: [], ng: []});
        const o = by.get(li);
        o.sizes.push(lkNumIn(isFinite(m.bp) ? gfSizeTxt(m.bp) : '–'));
        o.rel.push(mx > 0 ? lkNumIn(fmt((m.int || 0) / mx * 100, 0)) + '%' : '–');
        o.ng.push(isFinite(slope) && ng > 0 ? lkNumIn(fmt(ng, ng < 10 ? 1 : 0)) : '–');
      });
      return [...by.keys()].sort((a, b) => a - b).map(li => {
        const o = by.get(li);
        return {lane: lkNumIn(String(li + 1)), n: li + 1, label: gf.lanes[li].label || '',
          size: o.sizes.join('; '), rel: o.rel.join('; '), ng: o.ng.join('; ')};
      });
    },
    legend() {
      this.tick;
      const s = [], tx = this.t;
      if (this.cond.trim()) s.push(tx('Gel: ' + this.uv(this.cond.trim()) + '.'));
      const lad = window.__gfLadVm && window.__gfLadVm.f.lad;
      if (lad) s.push(tx('Ladder: ' + this.uv(tx(ladName(lad))) + '.'));
      gf.lanes.forEach((l, i) => { if (l.label) s.push(tx('Lane ' + (i + 1) + ': ' + this.uv(l.label) + '.')); });
      this.rows.forEach(r => s.push(tx('Banden in lane ' + r.n + ' (' + this.uv(this.unit) + '): ' + this.uv(r.size) + '.')));
      return s.join(' ');
    }
  },
  methods: {
    async copyTable(btn) {
      const H = [[this.t('Lane'), this.t('Label'), this.t('≈ ' + this.unit), this.t('Rel. int.')].concat(this.ngOn ? [this.t('≈ ng')] : [])];
      const B = this.rows.map(r => [r.lane, r.label, r.size, r.rel].concat(this.ngOn ? [r.ng] : []));
      copyRich(toTSV(H, B), toHTML(H, B), btn);
    },
    async copyLegend(btn) {
      try { await navigator.clipboard.writeText(this.legend); flashBtn(btn, 'Gekopieerd'); }
      catch (e) { flashBtn(btn, 'Geblokkeerd'); }
    }
  }
};
</script>
