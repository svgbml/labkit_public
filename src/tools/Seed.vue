<!-- ================= CELLEN UITZAAIEN =================
     De velden en de uitkomst van het uitzaaien van cellen. Het rekenwerk is dat van calc.seed,
     ongewijzigd, maar nu in een computed. Een ander kweekformaat vult, zoals eerder, het
     gebruikelijke werkvolume in (alleen als de gebruiker het formaat kiest).

     De id's sd-c, sd-fmt, sd-mode, sd-n, sd-v, sd-w, sd-x en sd-out blijven zoals ze waren. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <lk-field v-model="c" :label="t('Celconcentratie suspensie')" for-id="sd-c" :unit="t('cellen/mL')"/>
        <div class="f">
          <label for="sd-fmt">{{ t('Kweekformaat') }}</label>
          <select id="sd-fmt" style="width:100%" v-model="fmtV" @change="onFmt">
            <option v-for="o in formats" :key="o[0]" :value="o[0]">{{ t(o[1]) }}</option>
          </select>
        </div>
        <div class="f">
          <label for="sd-mode">{{ t('Dichtheid opgeven als') }}</label>
          <select id="sd-mode" style="width:100%" v-model="mode">
            <option value="well">{{ t('cellen per putje/fles') }}</option>
            <option value="cm2">{{ t('cellen per cm²') }}</option>
          </select>
        </div>
        <lk-field v-model="n" :label="t('Gewenste dichtheid')" for-id="sd-n"/>
        <lk-field v-model="v" :label="t('Volume per putje/fles')" for-id="sd-v" unit="mL"/>
        <lk-field v-model="w" :label="t('Aantal putjes/flessen')" for-id="sd-w" inputmode="numeric"/>
        <div class="f" data-expert="">
          <label for="sd-x">{{ t('Extra marge') }}</label>
          <div class="inu"><input id="sd-x" inputmode="decimal" v-model="x"><span class="u">%</span></div>
        </div>
        <lk-overage data-expert="" v-model="ov" for-id="sd-ov" :why="m.why"/>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('De celconcentratie haal je uit de tool Telkamer. Bij het kiezen van een formaat wordt het gebruikelijke werkvolume ingevuld.') }}</p>
    </div>
    <div class="result">
      <div id="sd-out">
        <lk-note v-if="m.err === 1" kind="info">{{ t('Vul celconcentratie, dichtheid, volume en aantal in.') }}</lk-note>
        <lk-note v-else-if="m.err === 2" kind="bad" :html="tooDilute"/>
        <template v-else>
          <lk-big :label="t('Celsuspensie')" :html="V(m.vs * 1000) + pipHtml(m.vs * 1000)"/>
          <svg :viewBox="'0 0 ' + pic.w + ' ' + pic.h" role="img" :aria-label="t('Schema van de plaat of flessen met cellen en suspensievolume per putje')"
            style="width:100%;max-width:520px;display:block;margin:12px 0 4px">
            <rect v-if="pic.plate" x="1" y="1" :width="pic.w - 2" :height="pic.h - 2" rx="8" fill="var(--surface)" stroke="var(--line)" stroke-width="2"/>
            <g v-for="(o, i) in pic.items" :key="i">
              <circle v-if="pic.plate" :cx="o.x" :cy="o.y" :r="o.r" :fill="o.on ? 'var(--accent)' : 'none'" :fill-opacity="o.on ? .22 : 1" :stroke="o.on ? 'var(--accent)' : 'var(--line)'" stroke-width="1.5"/>
              <rect v-else :x="o.x - o.r" :y="o.y - 40" :width="o.r * 2" height="80" rx="12" fill="var(--accent)" fill-opacity=".22" stroke="var(--accent)" stroke-width="1.5"/>
              <template v-if="o.on && pic.txt">
                <text :x="o.x" :y="o.y - 1" text-anchor="middle" font-size="11" font-weight="600" fill="var(--ink)">{{ pic.cells }}</text>
                <text :x="o.x" :y="o.y + 11" text-anchor="middle" font-size="10" fill="var(--ink)">{{ pic.sus }}</text>
              </template>
            </g>
          </svg>
          <p style="font-size:13px;color:var(--muted);margin:0 0 10px" v-html="caption"></p>
          <lk-kv :rows="rows"/>
          <lk-steps :steps="steps"/>
          <lk-formula :html="tHtml('V&lt;sub&gt;suspensie&lt;/sub&gt; = cellen per putje × aantal × (1 + marge) / celconcentratie')"/>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {pipHtml} from '../lib/pip.js';
import {lkNumIn} from '../lib/bridge.js';
import {overage} from '../lib/overage.js';

const F = (x, d) => lkNumIn(fmt(x, d)), S = (x, d = 3) => lkNumIn(sci(x, d)), V = u => lkNumIn(vol(u));

export default {
  name: 'Seed',
  data() {
    return {c: '8e5', fmtV: '1.9|0.5', mode: 'well', n: '5e4', v: lkNumIn('0,5'), w: '24', x: '10', ov: 'pct'};
  },
  computed: {
    formats() {
      return [['0.32|0.1', '96-wells (0,32 cm²)'], ['0.95|0.3', '48-wells (0,95 cm²)'], ['1.9|0.5', '24-wells (1,9 cm²)'],
        ['3.8|1', '12-wells (3,8 cm²)'], ['9.5|2', '6-wells (9,5 cm²)'], ['25|5', 'T25-fles (25 cm²)'], ['75|15', 'T75-fles (75 cm²)']];
    },
    /* het rekenwerk van calc.seed, ongewijzigd */
    m() {
      const C = num(this.c), [area] = this.fmtV.split('|').map(Number), mode = this.mode, d = num(this.n), v = num(this.v),
        n = Math.round(num(this.w)), x = (num(this.x) || 0) / 100;
      const {mult, why} = overage(n || 0, this.ov, num(this.x) || 0);
      if (!(C > 0) || !(d > 0) || !(v > 0) || !(n > 0)) return {err: 1, why};
      const per = mode === 'cm2' ? d * area : d, tot = v * mult, cells = per * mult, vs = cells / C;
      if (vs > tot) return {err: 2, vs, tot, cells, why};
      return {err: 0, area, n, v, x, per, tot, cells, vs, why};
    },
    /* tekening: de putjes van het gekozen formaat (rijen × kolommen), de eerste n gevuld; flessen als blokken */
    pic() {
      const m = this.m, dim = {'0.32|0.1': [8, 12], '0.95|0.3': [6, 8], '1.9|0.5': [4, 6], '3.8|1': [3, 4], '9.5|2': [2, 3]}[this.fmtV];
      const [R, K] = dim || [1, 3], cs = dim ? (K <= 6 ? 56 : 36) : 110, items = [];
      for (let i = 0; i < R * K; i++) items.push({x: cs * (i % K + .5), y: cs * (Math.floor(i / K) + .5), r: dim ? cs * .42 : cs * .4, on: i < m.n});
      const per = m.per / num(this.c) * 1000;
      return {plate: !!dim, w: cs * K, h: cs * R, items, txt: !dim || K <= 6,
        cells: lkNumIn(m.per >= 1e4 ? m.per.toExponential(1).replace('e+', 'e') : String(+m.per.toPrecision(2))), sus: V(per)};
    },
    caption() {
      const m = this.m, sus = m.per / num(this.c) * 1000;
      return this.tHtml('Per putje of fles: ' + ud(S(m.per)) + ' cellen in ' + ud(V(sus)) + ' suspensie en ' + ud(V(m.v * 1000 - sus)) + ' medium.');
    },
    tooDilute() {
      const m = this.m;
      return this.tHtml(`De suspensie is te verdund: je hebt ${vol(m.vs * 1000)} nodig voor ${vol(m.tot * 1000)} totaal. Centrifugeer de cellen en neem ze op in minder medium (minstens ${sci(m.cells / m.tot, 2)} cellen/mL).`);
    },
    rows() {
      const m = this.m;
      return [[this.t('Medium erbij'), V((m.tot - m.vs) * 1000) + pipHtml((m.tot - m.vs) * 1000)],
        [this.t('Totaal mengsel'), V(m.tot * 1000) + (this.ov === 'plus1' ? ` ((${m.n} + 1) × ${V(m.v * 1000)})`
          : this.ov === 'none' ? ` (${m.n} × ${V(m.v * 1000)})` : ` (${m.n} × ${V(m.v * 1000)} + ${F(m.x * 100, 0)}%)`)],
        [this.t('Cellen per putje/fles'), S(m.per)],
        [this.t('Dichtheid'), this.tHtml(sci(m.per / m.area, 3) + ' cellen/cm²')],
        [this.t('Concentratie mengsel'), this.tHtml(sci(m.per / m.v, 3) + ' cellen/mL')]];
    },
    steps() {
      const m = this.m;
      return [this.t(`Meng ${vol(m.vs * 1000)} celsuspensie met ${vol((m.tot - m.vs) * 1000)} medium.`),
        this.t(`Verdeel ${vol(m.v * 1000)} per putje of fles; meng de suspensie tussendoor.`)];
    }
  },
  methods: {
    V, pipHtml,
    /* alleen als de gebruiker een formaat kiest komt het gebruikelijke werkvolume erin */
    onFmt(e) { this.v = e.target.value.split('|')[1].replace('.', ','); }
  }
};
</script>
