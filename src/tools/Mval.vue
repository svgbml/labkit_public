<!-- ================= METHODEVALIDATIE =================
     De velden en de uitkomst zijn Vue; het rekenwerk blijft mvalCalc() in tools/nt/33_mval.js.
     De kalibratielijn wordt met chart() op het canvas getekend, na elke render, net als bij de
     Overlevingscurve. Het canvas zelf blijft buiten Vue, en tekst die erop komt loopt al door
     trCanvas().

     De id's mv-rep, mv-b, mv-sp, mv-add, mv-x, mv-y, mv-cvmax, mv-rlo, mv-rhi, mv-r2, mv-cv en
     mv-out blijven zoals ze waren. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <div class="f" style="grid-column:1/-1">
          <label for="mv-rep">{{ tHtml('Herhaalde metingen van één monster <span class="example">voorbeeld</span>') }}</label>
          <textarea id="mv-rep" rows="2" v-model="rep"></textarea>
        </div>
        <lk-field v-model="b" :label="t('Gemeten zonder spike')" for-id="mv-b"/>
        <lk-field v-model="sp" :label="t('Gemeten met spike')" for-id="mv-sp"/>
        <lk-field v-model="add" :label="t('Toegevoegd (spike)')" for-id="mv-add"/>
        <div class="f" style="grid-column:1/-1">
          <label for="mv-x">{{ t('Lineariteit: concentraties') }}</label>
          <input id="mv-x" class="txt" v-model="x">
        </div>
        <div class="f" style="grid-column:1/-1">
          <label for="mv-y">{{ t('Signaal') }}</label>
          <input id="mv-y" class="txt" v-model="y">
        </div>
        <lk-field v-model="cvmax" :label="t('Max. CV')" for-id="mv-cvmax" unit="%"/>
        <lk-field v-model="rlo" :label="t('Terugvinding van')" for-id="mv-rlo" unit="%"/>
        <lk-field v-model="rhi" :label="t('tot')" for-id="mv-rhi" unit="%"/>
        <lk-field v-model="r2" :label="t('Min. R²')" for-id="mv-r2"/>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Acceptatiecriteria verschillen per methode en concentratieniveau; neem ze over uit je validatieplan. Voorbeelddata zijn verzonnen.') }}</p>
    </div>
    <div class="result">
      <canvas id="mv-cv" v-show="!!(R && R.fit)"></canvas>
      <div id="mv-out">
        <lk-note v-if="!R" kind="info">{{ t('Vul ten minste één onderdeel in.') }}</lk-note>
        <template v-else>
          <lk-big :label="t('Criteria voldaan')" :value="R.pass" :sub="t(`van ${R.tot}`)"/>
          <lk-kv :rows="rows"/>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => fmt(x, d), G = (x, d) => sig(x, d);

export default {
  name: 'Mval',
  data() {
    return {
      rep: lkNumIn('10,2 10,05 9,98 10,11 10,24 9,92'),
      b: lkNumIn('10,08'), sp: lkNumIn('14,86'), add: '5',
      x: '0 2 4 6 8 10 12', y: lkNumIn('0,012 0,214 0,405 0,61 0,797 1,012 1,19'),
      cvmax: '5', rlo: '90', rhi: '110', r2: lkNumIn('0,995')
    };
  },
  computed: {
    X() { return numsC(this.x); },
    Y() { return numsC(this.y); },
    /* de maten uit mvalCalc(); null zolang er niets is om te rekenen */
    R() {
      const R = mvalCalc(numsC(this.rep), num(this.b), num(this.sp), num(this.add), this.X, this.Y,
        num(this.cvmax), num(this.rlo), num(this.rhi), num(this.r2));
      return R.rep || R.rec || R.fit || R.badLin ? R : null;
    },
    rows() {
      const t = this.t, {rep, rec, fit, badLin} = this.R, rows = [];
      const chip = (ok, on) => on ? `<span class="chip ${ok ? 'ok' : 'bad'}" style="vertical-align:middle;margin-left:6px">${ok ? t('voldoet') : t('voldoet niet')}</span>` : '';
      if (rep) rows.push([t('Herhaalbaarheid (CV)'), t(`${F(rep.c, 2)}% (x̄ = ${G(rep.m, 4)}, s = ${G(rep.s, 3)}, n = ${rep.n})`) + chip(rep.ok, rep.chip)]);
      if (rec) rows.push([t('Terugvinding'), F(rec.r, 1) + '%' + chip(rec.ok, rec.chip)]);
      if (fit) rows.push([t('Lineariteit R²'), F(fit.r2, 5) + chip(fit.ok, fit.chip)], [t('Helling / intercept'), `${G(fit.b, 4)} / ${G(fit.a, 3)}`],
        [t('LOD (3,3·σ/S)'), G(fit.lod, 3)], [t('LOQ (10·σ/S)'), G(fit.loq, 3)]);
      else if (badLin) rows.push([t('Lineariteit'), t('vul evenveel concentraties als signalen in (minstens 3)')]);
      return rows;
    },
    fit() { return this.R && this.R.fit; }
  },
  mounted() { this.draw(); },
  updated() { this.draw(); },
  methods: {
    /* de tekening wordt na elke render bijgewerkt; dat houdt canvas en uitkomst bij elkaar */
    draw() {
      const cv = document.getElementById('mv-cv'), fit = this.fit; if (!cv || !fit) return;
      const X = this.X, Y = this.Y;
      const xmax = Math.max(...X) * 1.05 || 1, ymin = Math.min(0, ...Y), ymax = Math.max(...Y) * 1.08;
      chart(cv, {xmin: 0, xmax, ymin, ymax, xlabel: 'concentratie', ylabel: 'signaal', series: [{fn: x => fit.a + fit.b * x, name: 'regressielijn'}, {pts: X.map((x, i) => [x, Y[i]]), color: '--warn'}]});
    }
  }
};
</script>
