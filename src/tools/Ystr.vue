<!-- ================= Y-STR / MTDNA-FREQUENTIE =================
     betaInvUp() (Clopper-Pearson) blijft onveranderd in tools/nt/23_ystr.js staan; deze
     component beheert de velden en de uitkomst, met het rekenwerk uit calc.ystr.

     De id's ys-x, ys-n, ys-cl, ys-th en ys-out blijven zoals ze waren. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <lk-field v-model="x" :label="t('Keer gezien in database')" for-id="ys-x" inputmode="numeric"/>
        <lk-field v-model="n" :label="t('Grootte database (N)')" for-id="ys-n" inputmode="numeric"/>
        <div class="f">
          <label for="ys-cl">{{ t('Betrouwbaarheid') }}</label>
          <select id="ys-cl" style="width:100%" v-model="cl">
            <option value="0.95">95%</option>
            <option value="0.99">99%</option>
          </select>
        </div>
        <lk-field v-model="th" :label="t('θ (subpopulatiecorrectie, optioneel)')" for-id="ys-th"/>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Neem het aantal en de databasegrootte uit YHRD of EMPOP voor de juiste referentiepopulatie. Voorbeelddata zijn verzonnen.') }}</p>
    </div>
    <div class="result" id="ys-out">
      <lk-note v-if="!m" kind="info">{{ t('Vul het aantal waarnemingen (0 of meer) en de databasegrootte in.') }}</lk-note>
      <template v-else>
        <lk-big :label="t('Gerapporteerde frequentie (bovengrens ' + fmt(m.cl * 100, 0) + '%)')" :html="S(m.rep, 3)"/>
        <lk-kv :rows="kvRows"/>
        <lk-note kind="info">{{ t('Y-STR- en mtDNA-profielen worden als haplotype geërfd: alle mannen (Y) of moederlijn-verwanten (mtDNA) delen het profiel. Een match sluit familieleden dus niet uit.') }}</lk-note>
        <lk-formula :html="formula"/>
      </template>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const S = (x, d) => lkNumIn(sci(x, d));

export default {
  name: 'Ystr',
  data() { return {x: '0', n: '4500', cl: '0.95', th: '0'}; },
  computed: {
    /* het rekenwerk van calc.ystr, ongewijzigd */
    m() {
      const x = Math.round(num(this.x)), n = Math.round(num(this.n)), cl = num(this.cl), th = num(this.th) || 0;
      if (!(n > 0) || !(x >= 0) || x > n || n > 1e7) return null;
      const p = x / n, up = x === 0 ? 1 - Math.pow(1 - cl, 1 / n) : betaInvUp(x, n, cl), rep = th > 0 ? th + (1 - th) * up : up;
      return {x, n, cl, p, up, rep};
    },
    kvRows() {
      const t = this.t, {x, p, up, rep} = this.m;
      return [[t('1 op'), S(1 / rep, 3)], [t('Telfrequentie x / N'), x ? S(p, 3) : t('0 (niet waargenomen)')],
        [t('Bovengrens zonder θ'), S(up, 3)], [t('Bewijskracht LR'), S(1 / rep, 3)]];
    },
    formula() {
      const {cl, n} = this.m;
      return this.tHtml(`p = x / N · bovengrens bij x = 0: 1 − (1 − ${fmt(cl, 2)})<sup>1/${n}</sup>`);
    }
  },
  methods: {
    S,
    fmt(x, d) { return fmt(x, d); }
  }
};
</script>
