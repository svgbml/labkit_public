<!-- ================= GELFOTO-EDITOR: DE GEMETEN BANDEN =================
     De uitkomst van de editor: per meting de lane, de geschatte grootte, de relatieve
     intensiteit, R<sub>f</sub> en (bij een massaladder) de hoeveelheid in ng.

     Eerst bouwde gfMarksTable() deze tabel als string HTML, en drie losse stukken code
     plakten er achteraf een kolom bij met insertCell(). Die drie zijn nu gewoon kolommen
     hieronder; het rekenwerk eronder (gfIntensity, gfRf, gfMassSlope, gfSizeTxt) blijft in
     src/engines/gelfoto.js staan, want dat hoort bij het beeldwerk.

     gf.marks is een gewoon object in src/engines/gelfoto.js. De motor roept na elke verandering
     gfMarksTable() aan; die tikt gfTick op en dan rekent `rows` opnieuw. -->
<template>
  <div style="margin-top:8px">
    <div class="tbl-wrap" v-if="rows.length">
      <table class="mini">
        <thead>
          <tr>
            <th>{{ t('Meting') }}</th>
            <th class="num">{{ t('Lane') }}</th>
            <th class="num">{{ t('≈ ' + unit) }}</th>
            <th class="num" :title="t('Geïntegreerde bandintensiteit, relatief t.o.v. de sterkste meting')">{{ t('Rel. int.') }}</th>
            <th class="num" :title="t('Looplengte vanaf het slotje gedeeld door de afstand tot het front')">{{ t('Rf') }}</th>
            <th class="num" v-if="ngOn" :title="t('Geschat uit de bandintensiteit van de massaladder (lineair door de oorsprong)')">{{ t('≈ ng') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in rows" :key="i">
            <td>{{ r.n }}</td>
            <td class="num">{{ r.lane }}</td>
            <td class="num">
              <b>{{ r.size }}</b>
              <template v-if="r.extra">
                <br><small :title="t('Geëxtrapoleerd buiten de ladder; onbetrouwbaar')">{{ r.extra }}</small>
              </template>
            </td>
            <td class="num">{{ r.rel }}</td>
            <td class="num">{{ r.rf }}</td>
            <td class="num" v-if="ngOn">{{ r.ng }}</td>
            <td><button type="button" class="ghost" :aria-label="t('Verwijder meting')" @click="del(i)">✕</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../../lib/bridge.js';
import {gfMix} from './tick.js';

export default {
  name: 'GfMarks',
  mixins: [gfMix],
  computed: {
    /* de eenheid van de kolom: kb als de weergave kb is, anders die van de ladder (bp of kDa),
       net als eerst — bij ng blijft de kolom de grootte van de band tonen */
    unit() { this.tick; return gf.disp === 'kb' ? 'kb' : gf.unit; },
    ngOn() { this.tick; return isFinite(gfMassSlope()); },
    rows() {
      this.tick;
      /* de intensiteiten die nog niet bepaald zijn; gfMarksTable() doet dit ook, maar een
         render kan ook van een andere kant komen */
      gfMarkInt();
      const slope = gfMassSlope(), mx = Math.max(0, ...gf.marks.map(m => m.int || 0));
      return gf.marks.map((m, i) => {
        let li = -1, bd = Infinity;
        gf.lanes.forEach((l, j) => { const d = Math.abs(l.x - m.x); if (d < bd) { bd = d; li = j; } });
        const txt = isFinite(m.bp) ? gfSizeTxt(m.bp) : '–';
        const rf = gfRf(m.y), ng = (m.int || 0) / slope;
        return {
          n: lkNumIn(String(i + 1)),
          lane: gf.lanes[li] ? gf.lanes[li].label : '–',
          size: lkNumIn(txt),
          extra: isFinite(m.bp) && /^[<>]/.test(txt)
            ? this.t('extrapolatie ≈ ' + gfFmtSize(m.bp)) : '',
          rel: mx > 0 ? lkNumIn(fmt((m.int || 0) / mx * 100, 0)) + '%' : '–',
          rf: isFinite(rf) ? lkNumIn(fmt(rf, 3)) : '–',
          ng: isFinite(slope) && ng > 0 ? lkNumIn(fmt(ng, ng < 10 ? 1 : 0)) : '–'
        };
      });
    }
  },
  methods: {
    del(i) { gf.marks.splice(i, 1); gfMarksTable(); gfRender(); }
  }
};
</script>
