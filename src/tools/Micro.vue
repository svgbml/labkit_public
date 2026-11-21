<!-- ================= MICROSCOOP-KALIBRATIE =================
     De velden en de uitkomst van de microscoopkalibratie. Het rekenwerk is dat van calc.micro,
     ongewijzigd, maar nu in een computed. stNums(), mean() en sd() blijven in web/index.html.

     De id's mc-obj, mc-oc, mc-fn, mc-od, mc-sd, mc-su, mc-m en mc-out blijven zoals ze waren. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <div class="f">
          <label for="mc-obj">{{ t('Objectief') }}</label>
          <select id="mc-obj" style="width:100%" v-model="obj">
            <option v-for="o in objs" :key="o" :value="o">{{ o }}</option>
          </select>
        </div>
        <lk-field v-model="oc" :label="t('Oculair')" for-id="mc-oc" unit="×"/>
        <lk-field v-model="fn" :label="t('Gezichtsveldgetal (FN)')" for-id="mc-fn" unit="mm"/>
        <lk-field v-model="od" :label="t('Oculair-schaaldelen')" for-id="mc-od"/>
        <lk-field v-model="sd" :label="t('vallen samen met object-schaaldelen')" for-id="mc-sd"/>
        <lk-field v-model="su" :label="t('Eén object-schaaldeel')" for-id="mc-su" unit="µm"/>
      </div>
      <div class="f" style="margin-top:12px">
        <label for="mc-m" v-html="mLabel"></label>
        <textarea id="mc-m" rows="2" v-model="mtxt"></textarea>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Een standaard-objectmicrometer is 1 mm verdeeld in 100 delen: één schaaldeel is 10 µm.') }}</p>
    </div>
    <div class="result" id="mc-out">
      <lk-note v-if="m.err" kind="info">{{ t('Vul de samenvallende schaaldelen in.') }}</lk-note>
      <template v-else>
        <lk-big :label="t('IJkfactor bij ' + F(m.obj, 0) + '× objectief')" :value="F(m.k, 2)" :sub="t('µm per schaaldeel')"/>
        <lk-kv :rows="rows"/>
        <lk-formula :html="formula"/>
        <lk-note kind="info">{{ t('De ijkfactor geldt alleen voor dit objectief en deze microscoop; ijk elk objectief apart.') }}</lk-note>
      </template>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => lkNumIn(fmt(x, d));

export default {
  name: 'Micro',
  data() {
    return {obj: '40', oc: '10', fn: '20', od: '40', sd: '10', su: '10', mtxt: lkNumIn('3 3,5 2,8 3,2 3,1')};
  },
  computed: {
    objs() { return ['4', '10', '40', '100']; },
    mLabel() { return this.tHtml('Gemeten objecten, in oculair-schaaldelen <span class="example">voorbeeld</span>'); },
    /* het rekenwerk van calc.micro, ongewijzigd */
    m() {
      const obj = num(this.obj), oc = num(this.oc), fn = num(this.fn), od = num(this.od), sdv = num(this.sd), su = num(this.su);
      if (!(od > 0) || !(sdv > 0) || !(su > 0)) return {err: 1};
      const k = sdv * su / od, m = stNums(this.mtxt).filter(v => v > 0).map(v => v * k),
        rows = [['Totale vergroting', isFinite(obj * oc) ? fmt(obj * oc, 0) + '×' : '–'],
          ['Gezichtsvelddiameter', fn > 0 && obj > 0 ? fmt(fn / obj * 1000, 0) + ' µm' : '–']];
      if (m.length) {
        rows.push(['Gemeten objecten (µm)', m.map(v => fmt(v, 1)).join(' · ')],
          ['Gemiddelde', fmt(mean(m), 2) + ' µm' + (m.length > 1 ? ` ± ${fmt(sd(m), 2)} (n = ${m.length})` : '')]);
      }
      return {err: 0, obj, sdv, su, od, k, rows};
    },
    rows() { return this.m.rows.map(r => [this.t(r[0]), lkNumIn(r[1])]); },
    formula() {
      const m = this.m;
      return this.tHtml('ijkfactor = ' + F(m.sdv, 1) + ' × ' + F(m.su, 1) + ' µm / ' + F(m.od, 1) + ' · grootte = schaaldelen × ijkfactor');
    }
  },
  methods: {F}
};
</script>
