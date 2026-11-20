<!-- ================= EENHEDEN OMREKENEN =================
     Alleen de weergave staat hier; de formules zijn dezelfde als in de oude calc.units()
     (die stond in web/index.html en is nu leeg). De id's un-v, un-u, un-mw en un-out blijven
     zoals ze waren: tests/validate.py leest de eerste regel van #un-out. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <lk-field v-model="v" :label="t('Waarde')" for-id="un-v"/>
        <div class="f">
          <label for="un-u">{{ t('Eenheid') }}</label>
          <select id="un-u" style="width:100%" v-model="u">
            <option v-for="o in units" :key="o.v" :value="o.v">{{ t(o.n) }}</option>
          </select>
        </div>
        <lk-field v-model="mw" :label="t('Molmassa')" for-id="un-mw" unit="g/mol"/>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Voorbeeld: fysiologisch zout, 0,9% NaCl. ppm hier als mg/L (waterige oplossing, dichtheid ≈ 1).') }}</p>
    </div>
    <div class="result" id="un-out">
      <lk-note v-if="!r.ok" kind="info">{{ t('Vul een waarde in.') }}</lk-note>
      <template v-else>
        <div class="lbl">{{ t('Omgerekend') }}</div>
        <lk-kv :rows="rows"/>
        <lk-note v-if="r.needMw" kind="warn">{{ t('Vul de molmassa in om naar massa om te rekenen.') }}</lk-note>
      </template>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const G = (x, d) => lkNumIn(sig(x, d));

/* v = sleutel in de rekentabellen, n = de tekst in de keuzelijst; dezelfde lijst als in de oude tool */
const UNITS = [
  {v: 'M', n: 'M (mol/L)'}, {v: 'mM', n: 'mM'}, {v: 'uM', n: 'µM'}, {v: 'nM', n: 'nM'},
  {v: 'gL', n: 'g/L'}, {v: 'mgmL', n: 'mg/mL'}, {v: 'ugmL', n: 'µg/mL'}, {v: 'ngul', n: 'ng/µL'},
  {v: 'pct', n: '% w/v'}, {v: 'ppm', n: 'ppm (mg/L)'}
];

export default {
  name: 'Units',
  data() {
    return {v: lkNumIn('0,9'), u: 'pct', mw: lkNumIn('58,44')};
  },
  computed: {
    units() { return UNITS; },
    /* alle maten uit de invoer, één keer; de andere computeds lezen hier alleen uit */
    r() {
      const v = num(this.v), u = this.u, mw = num(this.mw);
      const toGL = {gL: 1, mgmL: 1, ugmL: 1e-3, ngul: 1e-3, pct: 10, ppm: 1e-3}, toM = {M: 1, mM: 1e-3, uM: 1e-6, nM: 1e-9};
      if (!isFinite(v)) return {ok: false};
      let gL, M; if (toM[u] != null) { M = v * toM[u]; gL = M * mw; } else { gL = v * toGL[u]; M = gL / mw; }
      return {ok: true, gL, M, needMw: !isFinite(mw) && toM[u] != null};
    },
    rows() {
      const t = this.t, {gL, M} = this.r;
      return [[t('Molair'), isFinite(M) ? `${G(M, 4)} M · ${G(M * 1e3, 4)} mM · ${G(M * 1e6, 4)} µM` : t('molmassa nodig')],
        [t('Massa per volume'), `${G(gL, 4)} g/L = ${G(gL, 4)} mg/mL`],
        ['', `${G(gL * 1e3, 4)} µg/mL = ${G(gL * 1e3, 4)} ng/µL`],
        [t('Procent (w/v)'), G(gL / 10, 4) + ' %'], [t('ppm (mg/L)'), G(gL * 1e3, 4)]];
    }
  }
};
</script>
