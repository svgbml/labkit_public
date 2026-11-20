<!-- ================= VIABILITEIT (TRYPAANBLAUW) =================
     De velden en de uitkomst van de viabiliteitstelling. poisCI() en wilsonCI() blijven staan
     waar ze stonden (tools/nt/82_viab.js); het rekenwerk is dat van calc.viab, ongewijzigd,
     maar nu in computeds.

     De id's vb-l, vb-d, vb-sq, vb-df, vb-v, vb-t, vb-n en vb-out blijven zoals ze waren. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <lk-field v-model="l" :label="t('Levende cellen (ongekleurd)')" for-id="vb-l" inputmode="numeric"/>
        <lk-field v-model="d" :label="t('Dode cellen (blauw)')" for-id="vb-d" inputmode="numeric"/>
        <lk-field v-model="sq" :label="t('Getelde grote vierkanten')" for-id="vb-sq" inputmode="numeric"/>
        <lk-field v-model="df" :label="t('Verdunningsfactor')" for-id="vb-df"/>
        <lk-field v-model="v" :label="t('Volume celsuspensie')" for-id="vb-v" unit="mL"/>
        <lk-field v-model="tg" :label="t('Gewenst aantal levende cellen')" for-id="vb-t"/>
        <lk-field v-model="nw" :label="t('Aantal putjes of flessen')" for-id="vb-n" inputmode="numeric"/>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Eén groot vierkant van een Neubauer-kamer is 1 mm² × 0,1 mm = 0,1 µL. Trypaanblauw 1:1 met de suspensie gemengd geeft verdunningsfactor 2. Tel binnen 3–5 minuten na mengen; daarna kleuren ook levende cellen. Voorbeelddata zijn verzonnen.') }}</p>
    </div>
    <div class="result">
      <div id="vb-out">
        <lk-note v-if="!m.ok" kind="info">{{ t('Vul het aantal levende en dode cellen en het aantal vierkanten in.') }}</lk-note>
        <template v-else>
          <lk-big :label="t('Levende cellen')" :html="S(m.cL)" :sub="t('per mL')"/>
          <lk-kv :rows="rows"/>
          <lk-kv v-if="m.vols" :rows="volRows"/>
          <lk-note v-if="m.L < 100" kind="info">{{ t('Met ' + m.L + ' getelde levende cellen is de relatieve onzekerheid ongeveer ' + F(100 / Math.sqrt(Math.max(m.L, 1)), 0) + '%; tel meer vierkanten.') }}</lk-note>
          <lk-note v-if="m.L / m.sq > 100" kind="warn">{{ t('Meer dan 100 cellen per vierkant: verdun de suspensie voor een betrouwbare telling.') }}</lk-note>
          <lk-note v-if="m.via < 0.9" kind="warn">{{ t('Viabiliteit onder 90%: voor transfectie en de meeste experimenten is dat aan de lage kant.') }}</lk-note>
          <lk-formula :html="tHtml('cellen/mL = N / vierkanten × verdunning × 10⁴ · viabiliteit = levend / totaal')"/>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => lkNumIn(fmt(x, d)), S = (x, d = 3) => lkNumIn(sci(x, d));

export default {
  name: 'Viab',
  data() {
    return {l: '182', d: '14', sq: '4', df: '2', v: '10', tg: lkNumIn('2e5'), nw: '6'};
  },
  computed: {
    /* het rekenwerk van calc.viab, ongewijzigd */
    m() {
      const L = Math.round(num(this.l)), D = Math.round(num(this.d)) || 0, sq = num(this.sq), df = num(this.df) || 1, V = num(this.v), T = num(this.tg), n = Math.round(num(this.nw)) || 1;
      if (!(L >= 0) || !(sq > 0) || L + D <= 0 || L > 1e7 || D > 1e7) return {ok: false};
      const f = df * 1e4 / sq, cL = L * f, cT = (L + D) * f, via = L / (L + D), [a, b] = poisCI(L), [w1, w2] = wilsonCI(L, L + D);
      let vols = null;
      if (T > 0 && cL > 0) { const vv = T / cL * 1000; vols = {v: vv, n, over: V > 0 && vv * n / 1000 > V}; }
      return {ok: true, L, D, sq, V, T, f, cL, cT, via, a, b, w1, w2, vols};
    },
    rows() {
      const m = this.m;
      return [[this.t('95%-interval (telling)'), S(m.a * m.f) + ' – ' + S(m.b * m.f) + ' ' + this.t('per mL')],
        [this.t('Viabiliteit'), F(m.via * 100, 1) + '% (95%: ' + F(m.w1 * 100, 1) + '–' + F(m.w2 * 100, 1) + '%)'],
        [this.t('Totaal (levend + dood)'), S(m.cT) + ' ' + this.t('per mL')],
        [this.t('Levende cellen in de suspensie'), m.V > 0 ? S(m.cL * m.V) : '–']];
    },
    volRows() {
      const m = this.m, o = m.vols;
      return [[this.tHtml('Volume per putje voor ' + sci(m.T, 3) + ' cellen'), lkNumIn(vol(o.v))],
        [this.t('Voor ' + o.n + ' putjes'), o.over
          ? this.tHtml(vol(o.v * o.n) + ' <span class="chip warn" style="vertical-align:middle">meer dan je hebt</span>')
          : lkNumIn(vol(o.v * o.n))]];
    }
  },
  methods: {F, S}
};
</script>
