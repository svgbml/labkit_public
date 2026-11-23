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
    <div class="panel" style="grid-column:1/-1">
      <h3 style="margin:0 0 8px">{{ t('Meten op een foto') }}</h3>
      <div class="fields">
        <div class="f">
          <label for="mc-photo">{{ t('Foto (objectmicrometer of preparaat)') }}</label>
          <input id="mc-photo" type="file" accept="image/*" @change="load">
        </div>
        <div class="f">
          <label for="mc-mode">{{ t('Wat teken je?') }}</label>
          <select id="mc-mode" v-model="mode">
            <option value="cal">{{ t('Ijklijn over een bekende afstand') }}</option>
            <option value="meas">{{ t('Meetlijn over een object') }}</option>
          </select>
        </div>
        <lk-field v-model="known" :label="t('Bekende afstand')" for-id="mc-known" unit="µm"/>
      </div>
      <canvas id="mc-cv" v-if="has" style="width:100%;margin-top:8px;cursor:crosshair;touch-action:none"
              @pointerdown="down" @pointermove="move" @pointerup="up" @pointercancel="up"></canvas>
      <lk-note v-if="cal" kind="ok">{{ t('Ijking: ' + F(cal.k, 4) + ' µm per pixel') }}</lk-note>
      <lk-note v-else kind="info">{{ t('Teken eerst een ijklijn over een bekende afstand, bijvoorbeeld 100 µm op de objectmicrometer.') }}</lk-note>
      <lk-table v-if="meas.length" :cols="[{h: t('Meting')}, {h: t('Pixels'), num: true}, {h: 'µm', num: true}]" :rows="measRows"/>
      <div class="row" style="margin-top:8px">
        <button type="button" id="mc-copy" :disabled="!meas.length" @click="copy">{{ t('Kopieer metingen') }}</button>
        <button type="button" id="mc-clear" :disabled="!meas.length" @click="meas = []">{{ t('Wis metingen') }}</button>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:8px 0 0">{{ t('Kies een foto, teken met muis of vinger een lijn over een bekende afstand om te ijken, en teken daarna meetlijnen. De foto blijft in je browser. De ijking geldt voor dit objectief en deze camera-instelling.') }}</p>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => lkNumIn(fmt(x, d));

export default {
  name: 'Micro',
  data() {
    return {obj: '40', oc: '10', fn: '20', od: '40', sd: '10', su: '10', mtxt: lkNumIn('3 3,5 2,8 3,2 3,1'),
      mode: 'cal', known: '100', has: false, cal: jget('lkMicroCal', null), meas: [], drag: null};
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
    measRows() { return this.meas.map((q, i) => ['#' + (i + 1), F(q.px, 0), F(q.um, 1)]); },
    rows() { return this.m.rows.map(r => [this.t(r[0]), lkNumIn(r[1])]); },
    formula() {
      const m = this.m;
      return this.tHtml('ijkfactor = ' + F(m.sdv, 1) + ' × ' + F(m.su, 1) + ' µm / ' + F(m.od, 1) + ' · grootte = schaaldelen × ijkfactor');
    }
  },
  updated() { this.draw(); },
  methods: {
    F,
    /* de foto blijft op natuurlijke pixels, buiten Vue; de ijking is dus µm per foto-pixel */
    load(e) {
      const f = e.target.files && e.target.files[0]; if (!f) return;
      const img = new Image(), url = URL.createObjectURL(f);
      img.onload = () => { URL.revokeObjectURL(url); this._img = img; this.meas = []; if (this.cal) this.cal = {k: this.cal.k}; this.has = true; this.$nextTick(this.draw); };
      img.src = url;
    },
    pt(e) {
      const cv = e.currentTarget, b = cv.getBoundingClientRect();
      return [(e.clientX - b.left) * cv.width / b.width, (e.clientY - b.top) * cv.height / b.height];
    },
    down(e) { e.currentTarget.setPointerCapture(e.pointerId); const p = this.pt(e); this.drag = {a: p, b: p}; },
    move(e) { if (this.drag) { this.drag = {a: this.drag.a, b: this.pt(e)}; this.draw(); } },
    up(e) {
      const d = this.drag; this.drag = null; if (!d) return;
      const px = Math.hypot(d.b[0] - d.a[0], d.b[1] - d.a[1]);
      if (px < 3) { this.draw(); return; }
      if (this.mode === 'cal') {
        const known = num(this.known); if (!(known > 0)) return;
        this.cal = {k: known / px, a: d.a, b: d.b}; jset('lkMicroCal', {k: this.cal.k});
      } else if (this.cal) this.meas = [...this.meas, {px, um: px * this.cal.k, a: d.a, b: d.b}];
    },
    draw() {
      const cv = document.getElementById('mc-cv'), img = this._img; if (!cv || !img) return;
      if (cv.width !== img.naturalWidth) { cv.width = img.naturalWidth; cv.height = img.naturalHeight; }
      const x = cv.getContext('2d'), cs = getComputedStyle(document.documentElement), lw = Math.max(2, cv.width / 400);
      const line = (a, b, col, txt) => {
        x.strokeStyle = col; x.fillStyle = col; x.lineWidth = lw; x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke();
        if (txt) { x.font = `bold ${Math.round(lw * 7)}px sans-serif`; x.lineWidth = lw; x.strokeStyle = cs.getPropertyValue('--surface').trim() || '#fff'; x.strokeText(txt, b[0] + lw * 2, b[1]); x.fillText(txt, b[0] + lw * 2, b[1]); }
      };
      x.drawImage(img, 0, 0);
      const acc = cs.getPropertyValue('--accent').trim() || '#1558b0', warn = cs.getPropertyValue('--warn').trim() || '#c2410c';
      if (this.cal && this.cal.a) line(this.cal.a, this.cal.b, warn, this.t('ijk'));
      this.meas.forEach((q, i) => line(q.a, q.b, acc, F(q.um, 1) + ' µm'));
      if (this.drag) line(this.drag.a, this.drag.b, this.mode === 'cal' ? warn : acc);
    },
    copy(e) {
      const rows = [[this.t('Meting'), 'px', 'µm'], ...this.meas.map((q, i) => ['#' + (i + 1), fmt(q.px, 0), fmt(q.um, 1)])];
      copyRich(rows.map(r => r.join('\t')).join('\n'), '<table>' + rows.map(r => '<tr>' + r.map(c => '<td>' + esc(c) + '</td>').join('') + '</tr>').join('') + '</table>', e.currentTarget);
    }
  }
};
</script>
