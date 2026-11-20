<!-- ================= INOCULUM (OD VERDUNNEN) =================
     De velden en de uitkomst van het inoculum. Het rekenwerk is dat van calc.inoc, ongewijzigd,
     maar nu in een computed. De doorstuurknop van Telkamer (tools/nt/99_app.js) leest io-od,
     io-bl en io-df en zet io-fac met setV(); dat stuurt een input- en change-event, waar
     v-model op reageert.

     De id's io-od, io-df, io-bl, io-to, io-v, io-fac en io-out blijven zoals ze waren. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <lk-field v-model="od" :label="t('Gemeten OD₆₀₀ (cultuur)')" for-id="io-od"/>
        <div class="f" data-expert="">
          <label for="io-df">{{ t('Gemeten in verdunning') }}</label>
          <div class="inu"><span class="u" style="border-left:1px solid var(--line);border-radius:4px 0 0 4px;border-right:0">1 :</span><input id="io-df" inputmode="decimal" v-model="df" style="border-radius:0 4px 4px 0"></div>
        </div>
        <div class="f" data-expert="">
          <label for="io-bl">{{ t('Blanco (medium)') }}</label>
          <input id="io-bl" inputmode="decimal" v-model="bl">
        </div>
        <lk-field v-model="to" :label="t('Gewenste start-OD')" for-id="io-to"/>
        <lk-field v-model="v" :label="t('Eindvolume')" for-id="io-v" unit="mL"/>
        <div class="f" data-expert="">
          <label for="io-fac">{{ t('Cellen/mL bij OD 1,0') }}</label>
          <input id="io-fac" inputmode="decimal" v-model="fac">
        </div>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Meet boven OD ≈ 1 in een verdunning (bijv. 1:10) voor een betrouwbare waarde.') }}</p>
    </div>
    <div class="result" id="io-out">
      <lk-note v-if="m.err === 1" kind="info">{{ t('Vul gemeten OD, gewenste OD en volume in.') }}</lk-note>
      <lk-note v-else-if="m.err === 2" kind="bad">{{ t('De gewenste OD is hoger dan die van de cultuur; laat de cultuur langer groeien of concentreer de cellen.') }}</lk-note>
      <template v-else>
        <lk-big :label="t('Pipetteer')" :value="V(m.vc * 1000)" :sub="t('cultuur')"/>
        <lk-kv :rows="rows"/>
        <lk-note v-if="m.od - m.bl > 1" kind="warn">{{ t('De meting ligt boven OD 1; daar is OD niet meer lineair. Meet in een verdunning.') }}</lk-note>
        <lk-formula :html="formula"/>
      </template>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => lkNumIn(fmt(x, d)), V = u => lkNumIn(vol(u));

export default {
  name: 'Inoc',
  data() {
    return {od: lkNumIn('1,6'), df: '1', bl: lkNumIn('0,05'), to: lkNumIn('0,05'), v: '50', fac: '8e8'};
  },
  computed: {
    /* het rekenwerk van calc.inoc, ongewijzigd */
    m() {
      const od = num(this.od), df = num(this.df) || 1, bl = num(this.bl) || 0, to = num(this.to), V = num(this.v), fac = num(this.fac);
      const odc = (od - bl) * df;
      if (!(odc > 0) || !(to > 0) || !(V > 0)) return {err: 1};
      if (to >= odc) return {err: 2};
      const vc = to * V / odc;
      return {err: 0, od, bl, to, V, fac, odc, vc};
    },
    rows() {
      const m = this.m;
      return [[this.t('Medium'), V((m.V - m.vc) * 1000)],
        [this.t('OD cultuur (gecorrigeerd)'), F(m.odc, 3)],
        [this.t('Verdunning'), '1 : ' + lkNumIn(sig(m.odc / m.to, 4))],
        [this.t('Cellen/mL bij start (schatting)'), isFinite(m.fac) ? lkNumIn(sci(m.to * m.fac, 2)) : '–']];
    },
    formula() {
      const m = this.m;
      return this.tHtml('V<sub>cultuur</sub> = ' + F(m.to, 3) + ' × ' + F(m.V, 1) + ' mL / ' + F(m.odc, 3));
    }
  },
  methods: {V}
};
</script>
