<!-- ================= EENHEDEN OMREKENEN =================
     Alleen de weergave staat hier; de formules zijn dezelfde als in de oude calc.units()
     (die stond in web/index.html en is nu leeg). De id's un-v, un-u, un-mw en un-out blijven
     zoals ze waren: tests/validate.py leest de eerste regel van #un-out. -->
<template>
  <div class="stack">
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
  <div class="panel">
    <h3 style="font-size:15px;margin:0 0 10px">{{ t('Twee kanten op omrekenen') }}</h3>
    <div class="fields">
      <div class="f">
        <label for="un-chem">{{ t('Stof (vult de molmassa in)') }}</label>
        <input id="un-chem" class="txt" list="chem-list" v-model="chem" :placeholder="t('naam')" @input="onChem">
      </div>
      <div class="f" v-for="b in boxes" :key="b.k">
        <label :for="'un2-' + b.k">{{ t(b.n) }}</label>
        <input :id="'un2-' + b.k" inputmode="decimal" :value="b.s" @input="edit(b.k, $event.target.value)">
      </div>
    </div>
    <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Typ in een vak; de andere vakken rekenen mee. Tussen molair en massa is de molmassa hierboven nodig.') }}</p>
  </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const G = (x, d) => lkNumIn(sig(x, d));

/* v = sleutel in de rekentabellen, n = de tekst in de keuzelijst; dezelfde lijst als in de oude tool */
/* de vakken: f = factor naar mol/L (m) of g/L; m = molaire eenheid */
const BOXES = [{k: 'M', n: 'M (mol/L)', f: 1, m: 1}, {k: 'mM', n: 'mM', f: 1e-3, m: 1}, {k: 'uM', n: 'µM', f: 1e-6, m: 1},
  {k: 'gL', n: 'g/L', f: 1}, {k: 'mgmL', n: 'mg/mL', f: 1}, {k: 'ugmL', n: 'µg/mL', f: 1e-3}, {k: 'pct', n: '% w/v', f: 10}];
const UNITS = [
  {v: 'M', n: 'M (mol/L)'}, {v: 'mM', n: 'mM'}, {v: 'uM', n: 'µM'}, {v: 'nM', n: 'nM'},
  {v: 'gL', n: 'g/L'}, {v: 'mgmL', n: 'mg/mL'}, {v: 'ugmL', n: 'µg/mL'}, {v: 'ngul', n: 'ng/µL'},
  {v: 'pct', n: '% w/v'}, {v: 'ppm', n: 'ppm (mg/L)'}
];

export default {
  name: 'Units',
  data() {
    return {v: lkNumIn('0,9'), u: 'pct', mw: lkNumIn('58,44'), chem: '', last: {k: '', s: ''}};
  },
  methods: {
    onChem() { const m = CHEM[this.chem]; if (m) this.mw = lkNumIn(String(m).replace('.', ',')); },
    edit(k, s) { this.last = {k, s}; }
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
    /* de vakken van de tweewegomrekening: wat je typt blijft staan, de rest volgt uit g/L en de molmassa */
    boxes() {
      const mw = num(this.mw), {k, s} = this.last, x = num(s), src = BOXES.find(b => b.k === k);
      const gL = src && isFinite(x) ? (src.m ? x * src.f * mw : x * src.f) : NaN;
      return BOXES.map(b => {
        const y = b.m ? gL / mw / b.f : gL / b.f;
        return {k: b.k, n: b.n, s: b.k === k ? s : isFinite(y) ? lkNumIn(sig(y, 6)) : ''};
      });
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
