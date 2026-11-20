<!-- ================= TIJD SINDS OVERLIJDEN (HENSSGE) =================
     De afkoelformule van Henssge en de bisectie naar t staan hier ongewijzigd uit calc.pmi
     overgenomen. De curve is nog steeds chart() op een canvas en wordt na elke render opnieuw
     getekend, net als bij de Z'-factor.

     De id's pm-tr, pm-ta, pm-w, pm-cf, pm-at, pm-cv en pm-out blijven zoals ze waren. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <lk-field v-model="tr" :label="t('Rectale temperatuur')" for-id="pm-tr" unit="°C"/>
        <lk-field v-model="ta" :label="t('Omgevingstemperatuur')" for-id="pm-ta" unit="°C"/>
        <lk-field v-model="w" :label="t('Lichaamsgewicht')" for-id="pm-w" unit="kg"/>
        <lk-field v-model="cf" :label="t('Correctiefactor')" for-id="pm-cf"/>
        <div class="f" style="grid-column:span 2">
          <label for="pm-at">{{ t('Tijdstip van meting (optioneel)') }}</label>
          <input id="pm-at" type="datetime-local" class="txt" v-model="at">
        </div>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Correctiefactor 1 = naakt lichaam in stilstaande lucht (referentie); naakt in bewegende lucht ongeveer 0,75; kleding of dekens verhogen de factor (bijv. ongeveer 1,1 voor lichte kleding). Gebruik de tabel van Henssge uit je cursusmateriaal voor andere situaties. Voorbeelddata zijn verzonnen.') }}</p>
    </div>
    <div class="result">
      <canvas id="pm-cv" v-show="m.ok"></canvas>
      <div id="pm-out">
        <lk-note v-if="m.msg" :kind="m.kind">{{ t(m.msg) }}</lk-note>
        <template v-else>
          <lk-big :label="t('Geschat postmortaal interval')" :value="t(hm(m.t))"/>
          <lk-kv :rows="kvRows"/>
          <lk-kv v-if="whenRows.length" :rows="whenRows"/>
          <lk-note v-if="m.t > 36" kind="warn">{{ t('Na ongeveer anderhalve dag is het verschil met de omgevingstemperatuur klein en wordt de schatting onbetrouwbaar.') }}</lk-note>
          <lk-note v-if="m.CF !== 1" kind="info">{{ t('Met een correctiefactor ongelijk aan 1 is de onzekerheid groter dan het minimale interval.') }}</lk-note>
          <lk-note kind="info">{{ t('Rekenvoorbeeld voor onderwijs; een officiële schatting hoort bij een forensisch arts en combineert meerdere methoden.') }}</lk-note>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => lkNumIn(fmt(x, d));
const CI = 2.8;   /* het kleinste 95%-interval van de methode, in uren */

export default {
  name: 'Pmi',
  data() {
    return {tr: lkNumIn('30,5'), ta: '18', w: '75', cf: '1', at: ''};
  },
  computed: {
    /* het rekenwerk van calc.pmi; een melding gaat als Nederlandse zin mee en wordt bij het
       tonen vertaald */
    m() {
      const Tr = num(this.tr), Ta = num(this.ta), W = num(this.w), CF = num(this.cf);
      if (![Tr, Ta, W, CF].every(isFinite) || W <= 0 || CF <= 0)
        return {msg: 'Vul rectale temperatuur, omgevingstemperatuur, gewicht en correctiefactor in.', kind: 'info'};
      if (Tr >= 37.2 || Tr <= Ta)
        return {msg: 'De rectale temperatuur moet tussen de omgevingstemperatuur en 37,2 °C liggen; anders is de methode niet toepasbaar.', kind: 'bad'};
      const hi = Ta > 23.2, B = -1.2815 * Math.pow(CF * W, -0.625) + 0.0284,
        Q = t => (hi ? 1.11 * Math.exp(B * t) - 0.11 * Math.exp(10 * B * t) : 1.25 * Math.exp(B * t) - 0.25 * Math.exp(5 * B * t)),
        q = (Tr - Ta) / (37.2 - Ta);
      let lo = 0, up = 200;
      if (Q(up) > q) return {msg: 'Buiten het bereik van het model (meer dan 200 uur).', kind: 'bad'};
      for (let i = 0; i < 80; i++) { const mid = (lo + up) / 2; if (Q(mid) > q) lo = mid; else up = mid; }
      return {ok: true, t: (lo + up) / 2, hi, B, Q, q, Tr, Ta, CF};
    },
    kvRows() {
      const t = this.t, {hi, B, q} = this.m, T = this.m.t;
      return [[t('95%-interval (minimaal)'), t(`${this.hm(Math.max(0, T - CI))} – ${this.hm(T + CI)}`)],
        [t('Formule'), lkNumIn(hi ? 'T<sub>a</sub> &gt; 23,2 °C' : 'T<sub>a</sub> ≤ 23,2 °C')],
        ['B', F(B, 4)], [t('Temperatuurquotiënt Q'), F(q, 3)]];
    },
    /* met een meettijdstip erbij: terugrekenen naar een klokdatum */
    whenRows() {
      if (!this.at) return [];
      const d = new Date(this.at);
      if (isNaN(d)) return [];
      const T = this.m.t, f = v => new Date(d.getTime() - v * 3600e3).toLocaleString(LANG === 'en' ? 'en-GB' : 'nl-NL',
        {weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'});
      return [[this.t('Geschat tijdstip van overlijden'), esc(f(T))],
        [this.t('Tussen'), esc(f(T + CI)) + (LANG === 'en' ? ' and ' : ' en ') + esc(f(Math.max(0, T - CI)))]];
    }
  },
  mounted() { this.draw(); },
  updated() { this.draw(); },
  methods: {
    /* uren als "11 u 0 min"; t() maakt er in het Engels "11 h 0 min" van */
    hm(v) {
      const h = Math.floor(v), mi = Math.round((v - h) * 60);
      return mi === 60 ? `${h + 1} u 0 min` : `${h} u ${mi} min`;
    },
    draw() {
      const cv = document.getElementById('pm-cv'); if (!cv || !this.m.ok) return;
      const {t, Ta, Tr, Q} = this.m, tm = Math.max(t * 1.6, 12);
      chart(cv, {xmin: 0, xmax: tm, ymin: Math.min(Ta, Tr) - 1, ymax: 38, xlabel: 'tijd na overlijden (h)',
        ylabel: 'rectale temperatuur (°C)',
        series: [{fn: x => Ta + (37.2 - Ta) * Q(x), name: 'afkoelcurve'}, {pts: [[t, Tr]], color: '--warn', r: 5},
          {fn: () => Ta, dash: [4, 4], color: '--muted'}]});
    }
  }
};
</script>
