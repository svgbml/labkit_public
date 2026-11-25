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
          <label for="mv-rep" v-html="tHtml('Herhaalde metingen van één monster <span class=&quot;example&quot;>voorbeeld</span>')"></label>
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
      <div class="fields" style="margin-top:14px">
        <lk-field v-model="vTitle" :label="t('Titel')" for-id="mv-vtitle" inputmode="text" cls="txt" :span="2"/>
        <lk-field v-model="vMethod" :label="t('Methode')" for-id="mv-vmethod" inputmode="text" cls="txt"/>
        <lk-field v-model="vAnalyte" :label="t('Analyt')" for-id="mv-vanalyte" inputmode="text" cls="txt"/>
        <lk-field v-model="vDate" :label="t('Datum')" for-id="mv-vdate" inputmode="text" cls="txt"/>
        <lk-field v-model="vWho" :label="t('Analist')" for-id="mv-vwho" inputmode="text" cls="txt"/>
      </div>
      <div class="row" style="margin-top:10px">
        <button type="button" id="mv-print" :disabled="!R" @click="report">{{ t('Validatierapport afdrukken') }}</button>
      </div>
    </div>
    <div class="result">
      <canvas id="mv-cv" v-show="!!(R && R.fit)"></canvas>
      <div id="mv-out">
        <lk-note v-if="!R" kind="info">{{ t('Vul ten minste één onderdeel in.') }}</lk-note>
        <template v-else>
          <lk-big :label="t('Criteria voldaan')" :value="R.pass" :sub="t(`van ${R.tot}`)"/>
          <lk-kv :rows="rows"/>
          <lk-reps :vals="repVals" :cv-max="Infinity" :digits="4" :label="t('Herhaalde metingen')"/>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const todayISO = () => new Date().toLocaleDateString('sv');  // lokale datum als JJJJ-MM-DD (toISOString is UTC)
const F = (x, d) => lkNumIn(fmt(x, d)), G = (x, d) => lkNumIn(sig(x, d));

export default {
  name: 'Mval',
  data() {
    return {
      rep: lkNumIn('10,2 10,05 9,98 10,11 10,24 9,92'),
      b: lkNumIn('10,08'), sp: lkNumIn('14,86'), add: '5',
      x: '0 2 4 6 8 10 12', y: lkNumIn('0,012 0,214 0,405 0,61 0,797 1,012 1,19'),
      cvmax: '5', rlo: '90', rhi: '110', r2: lkNumIn('0,995'),
      vTitle: '', vMethod: '', vAnalyte: '', vDate: todayISO(), vWho: ''
    };
  },
  computed: {
    repVals() { return numsC(this.rep); },
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
      if (rep) rows.push([t('Herhaalbaarheid (CV)'), t(`${fmt(rep.c, 2)}% (x̄ = ${sig(rep.m, 4)}, s = ${sig(rep.s, 3)}, n = ${rep.n})`) + chip(rep.ok, rep.chip)]);
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
    /* een A4-validatierapport via dezelfde afdrukroute als het pipetcertificaat (rpPrint) */
    report() {
      const R = this.R; if (!R) return;
      const T = x => esc(trPlain(x)), {rep, rec, fit} = R, rows = [];
      const res = (ok, on) => on ? T(ok ? 'voldoet' : 'voldoet niet') : '–';
      if (rep) rows.push([T('Herhaalbaarheid (CV)'), esc(fmt(rep.c, 2)) + '% (n = ' + rep.n + ')', rep.chip ? '≤ ' + esc(this.cvmax) + '%' : '–', res(rep.ok, rep.chip), rep.ok || !rep.chip]);
      if (rec) rows.push([T('Terugvinding'), esc(fmt(rec.r, 1)) + '%', rec.chip ? esc(this.rlo) + ' – ' + esc(this.rhi) + '%' : '–', res(rec.ok, rec.chip), rec.ok || !rec.chip]);
      if (fit) rows.push([T('Lineariteit R²'), esc(fmt(fit.r2, 5)), fit.chip ? '≥ ' + esc(this.r2) : '–', res(fit.ok, fit.chip), fit.ok || !fit.chip],
        [T('Helling / intercept'), esc(sig(fit.b, 4) + ' / ' + sig(fit.a, 3)), '–', '–', true],
        [T('LOD (3,3·σ/S)'), esc(sig(fit.lod, 3)), '–', '–', true], [T('LOQ (10·σ/S)'), esc(sig(fit.loq, 3)), '–', '–', true]);
      const all = R.pass === R.tot, title = trPlain('Validatierapport');
      const row = (k, v) => '<tr><th>' + T(k) + '</th><td>' + esc(v) + '</td></tr>';
      rpPrint('<!doctype html><meta charset="utf-8"><title>' + esc(title) + '</title><style>'
        + '@page{size:A4;margin:16mm}body{margin:0;font:13px system-ui,sans-serif;color:#1f2933}'
        + 'h1{font-size:22px;margin:0 0 12px}table{border-collapse:collapse;width:100%;font-size:13px;margin-bottom:14px}'
        + 'th,td{border:1px solid #c9ced6;padding:6px 8px;text-align:left;vertical-align:top}th{background:#eef0f3}'
        + '.hd th{width:30%}.ok{color:#1a7f37}.bad{color:#c62828;font-weight:700}.concl{font-size:15px;font-weight:700;margin:16px 0}'
        + '.sign{margin-top:40px;font-size:12px;color:#5f6b7a;line-height:3}'
        + '</style><h1>' + esc(this.vTitle.trim() || title) + '</h1><table class="hd">'
        + row('Methode', this.vMethod) + row('Analyt', this.vAnalyte) + row('Datum', this.vDate) + row('Analist', this.vWho) + '</table>'
        + '<table><tr><th>' + T('Parameter') + '</th><th>' + T('Waarde') + '</th><th>' + T('Criterium') + '</th><th>' + T('Resultaat') + '</th></tr>'
        + rows.map(r => '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td><td class="' + (r[3] === '–' ? '' : r[4] ? 'ok' : 'bad') + '">' + r[3] + '</td></tr>').join('')
        + '</table><p class="concl ' + (all ? 'ok' : 'bad') + '">' + T('Conclusie') + ': ' + T(all ? 'alle criteria zijn voldaan.' : 'niet alle criteria zijn voldaan.') + '</p>'
        + '<p class="sign">' + T('Opgesteld door') + ': ________________ &nbsp; ' + T('Gecontroleerd door') + ': ________________ &nbsp; ' + T('Datum') + ': ________________</p>');
    },
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
