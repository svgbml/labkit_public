<!-- ================= AGAROSEGEL & BANDGROOTTE =================
     GELR, LADDERS en LEX (de scheidingsbereiken en de ladders) blijven als globals in
     web/index.html staan: Gelplanner (tools/nt/48_gplan.js) en de Gelfoto-editor lezen ze. Deze
     component beheert de velden, de ladderrijen en de uitkomsten.

     De standaardcurve blijft met de gewone tekencontext gemaakt; na elke render wordt hij
     opnieuw getekend (draw()), zoals bij Bufcap. De id's g-pct, g-vol, g-size, g-bs, g-bw, g-bv,
     g-out, b-ladder, b-unk, b-tbl, b-out, b-cv en b-res blijven zoals ze waren. De
     ladderinvoeren hebben geen id (data-bp), net als eerst. -->
<template>
  <div class="stack">
    <div class="grid2">
      <div class="panel">
        <h3>{{ t('Gel gieten') }}</h3>
        <div class="fields">
          <lk-field v-model="pct" :label="t('Agarose')" for-id="g-pct" unit="% w/v"/>
          <lk-field v-model="gv" :label="t('Gelvolume')" for-id="g-vol" unit="mL"/>
          <lk-field v-model="size" :label="t('Verwachte fragmentgrootte')" for-id="g-size" unit="bp"/>
        </div>
        <h3 style="margin-top:16px">{{ t('Loopbuffer') }}</h3>
        <div class="fields">
          <div class="f" data-expert="">
            <label for="g-bs">{{ t('Stock') }}</label>
            <select id="g-bs" style="width:100%" v-model="bs">
              <option v-for="o in stocks" :key="o.v" :value="o.v">{{ t(o.n) }}</option>
            </select>
          </div>
          <div class="f" data-expert="">
            <label for="g-bw">{{ t('Werkconcentratie') }}</label>
            <select id="g-bw" style="width:100%" v-model="bw">
              <option v-for="o in works" :key="o.v" :value="o.v">{{ t(o.n) }}</option>
            </select>
          </div>
          <lk-field v-model="bv" :label="t('Volume')" for-id="g-bv" unit="mL" data-expert=""/>
        </div>
      </div>
      <div class="result" id="g-out">
        <lk-big :label="t('Agarose afwegen')" :value="F(g, 0, true)"/>
        <lk-kv :rows="kvRows"/>
        <lk-note v-if="outside" kind="warn">{{ outsideText }}</lk-note>
        <template v-if="recRows.length">
          <div style="margin:12px 0 6px;font-weight:600;font-size:14px">{{ t('Geschikt voor ' + sizeText + ' bp') }}</div>
          <lk-table :cols="recCols" :rows="recRows"/>
        </template>
      </div>
    </div>
    <div class="grid2">
      <div class="panel">
        <h3 v-html="tHtml('Bandgrootte schatten <span class=&quot;example&quot;>voorbeeld</span>')"></h3>
        <div class="row">
          <div class="f">
            <label for="b-ladder">{{ t('Ladder') }}</label>
            <select id="b-ladder" v-model="ladder" @change="onLadder">
              <option v-for="o in ladders" :key="o.v" :value="o.v">{{ t(o.n) }}</option>
            </select>
          </div>
          <div class="f">
            <label for="b-unk">{{ t('Onbekende banden, afstand (mm)') }}</label>
            <input id="b-unk" inputmode="decimal" v-model="unk" style="width:180px">
          </div>
        </div>
        <div class="tbl-wrap" style="margin-top:12px;max-height:360px;overflow-y:auto">
          <table id="b-tbl">
            <thead><tr><th class="num">{{ t('Ladderband (bp)') }}</th><th class="num">{{ t('Afstand vanaf putje (mm)') }}</th></tr></thead>
            <tbody>
              <tr v-for="(bp, i) in bands" :key="ladder + '-' + bp">
                <td class="num">{{ nl(bp) }}</td>
                <td><input :data-bp="bp" inputmode="decimal" v-model="dist[i]" style="text-align:right;width:110px;margin-left:auto;display:block"></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style="font-size:13px;color:var(--muted);margin:8px 0 0">{{ t('Vul alleen banden in die je duidelijk ziet; de curve gebruikt elke rij met een afstand. Controleer bandgroottes met het datasheet van jouw ladder.') }}</p>
      </div>
      <div class="result" id="b-out">
        <canvas id="b-cv" width="420" height="260"></canvas>
        <div id="b-res">
          <lk-note v-if="!fit" kind="info">{{ t('Vul minstens twee ladderafstanden in.') }}</lk-note>
          <template v-else>
            <div class="lbl" style="margin-top:10px">{{ t('Geschatte grootte') }}</div>
            <div v-if="fit.est.length" class="big">{{ fit.est.map(e => nl(Math.round(e.bp))).join(' · ') }} <small>bp</small></div>
            <p v-else>{{ t('Vul afstanden van onbekende banden in.') }}</p>
            <lk-kv :rows="fitRows"/>
            <lk-note v-if="fit.out" kind="warn">{{ t('Een band valt buiten het bereik van je ladder; de schatting is dan onbetrouwbaar.') }}</lk-note>
            <lk-note v-if="fit.r2 < 0.98" kind="warn">{{ t('R² onder 0,98: gebruik alleen ladderbanden rond je onbekende band.') }}</lk-note>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const NLN = v => lkNumIn(Number(v).toLocaleString('nl-NL'));

const STOCKS = [{v: '50', n: '50X TAE'}, {v: '10', n: '10X TBE'}, {v: '5', n: '5X TBE'}];
const WORKS = [{v: '1', n: '1X'}, {v: '0.5', n: '0,5X'}];
const LADS = [{v: '100', n: '100 bp-ladder (1000–100)'}, {v: 'neb100', n: 'NEB 100 bp (1517–100)'},
  {v: '100p', n: '100 bp plus (3000–100)'}, {v: '1k', n: '1 kb-ladder (10 000–250)'}];

/* de voorbeeldafstanden van een ladder (LEX), of lege velden */
const exDist = k => LADDERS[k].map((_, i) => {
  const ex = LEX[k] || [];
  return ex[i] != null ? lkNumIn(String(ex[i]).replace('.', ',')) : '';
});

export default {
  name: 'Gel',
  data() {
    return {
      pct: lkNumIn('1,5'), gv: '50', size: '500', bs: '50', bw: '1', bv: '500',
      ladder: '100', unk: lkNumIn('31 44,5'), dist: exDist('100')
    };
  },
  computed: {
    stocks() { return STOCKS; },
    works() { return WORKS; },
    ladders() { return LADS; },
    bands() { return LADDERS[this.ladder] || []; },
    g() { return num(this.pct) / 100 * num(this.gv); },
    st() { return num(this.bw) / num(this.bs) * num(this.bv); },
    sizeN() { return num(this.size); },
    sizeText() { return this.sizeN.toLocaleString('nl-NL'); },
    kvRows() {
      const t = this.t, gv = num(this.gv), bv = num(this.bv), bw = num(this.bw);
      const bname = (STOCKS.find(o => o.v === String(this.bs)) || STOCKS[0]).n;
      return [[t('In loopbuffer'), this.F(gv, 0) + ' mL ' + t(bw === 1 ? '1X' : '0,5X')],
        [t(bname + ' voor ' + fmt(bv, 0) + ' mL'), lkNumIn(vol(this.st * 1000))],
        [t('+ water'), lkNumIn(vol((bv - this.st) * 1000))]];
    },
    /* het gelpercentage dat het beste bij de verwachte grootte past (midden op de log-schaal) */
    best() {
      const size = this.sizeN;
      if (!(isFinite(size) && size > 0)) return null;
      let best = null, bd = 1e9;
      GELR.filter(r => size >= r[1] && size <= r[2]).forEach(r => {
        const mid = (Math.log10(r[1]) + Math.log10(r[2])) / 2, d = Math.abs(Math.log10(size) - mid);
        if (d < bd) { bd = d; best = r; }
      });
      return best;
    },
    recCols() {
      const t = this.t;
      return [{h: t('Gel %'), num: true}, {h: t('Scheidt (bp)'), num: true}, {h: ''}];
    },
    recRows() {
      const size = this.sizeN, t = this.t;
      if (!(isFinite(size) && size > 0)) return [];
      return GELR.map(r => {
        const inR = size >= r[1] && size <= r[2];
        return {cls: r === this.best ? 'hl' : inR ? '' : 'dim',
          cells: [this.F(r[0], 1), NLN(r[1]) + '–' + NLN(r[2]),
            r === this.best ? '<span class="chip ok">' + t('beste keus') + '</span>'
              : inR ? '<span class="chip info">' + t('kan') + '</span>' : '']};
      });
    },
    cur() {
      const pct = num(this.pct), size = this.sizeN;
      if (!(isFinite(size) && size > 0 && isFinite(pct))) return null;
      return GELR.find(r => Math.abs(r[0] - pct) < 1e-9) || null;
    },
    outside() { const c = this.cur, s = this.sizeN; return !!c && !(s >= c[1] && s <= c[2]); },
    outsideText() {
      const c = this.cur;
      return this.t(fmt(num(this.pct), 1) + '% scheidt ' + c[1] + '–' + c[2] + ' bp; je fragment valt erbuiten.');
    },
    /* de standaardcurve: log10(bp) tegen afstand, rechte lijn voor R² en lokale interpolatie voor de schatting */
    fit() {
      const pts = this.bands.map((bp, i) => ({bp, d: num(this.dist[i])})).filter(p => isFinite(p.d));
      if (pts.length < 2) return null;
      const unk = list(String(this.unk).replace(/(\d),(\d)/g, '$1.$2'));
      const n = pts.length, xs = pts.map(p => p.d), ys = pts.map(p => Math.log10(p.bp));
      const mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n;
      let sxy = 0, sxx = 0, syy = 0;
      for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2; }
      const b = sxy / sxx, a = my - b * mx, r2 = (sxy * sxy) / (sxx * syy);
      const sp = pts.slice().sort((p, q) => p.d - q.d);
      const local = d => {
        if (d < sp[0].d || d > sp[sp.length - 1].d) return 10 ** (a + b * d);
        let i = 0; while (i < sp.length - 2 && d > sp[i + 1].d) i++;
        const p = sp[i], q = sp[i + 1]; if (q.d === p.d) return p.bp;
        return 10 ** (Math.log10(p.bp) + (d - p.d) / (q.d - p.d) * (Math.log10(q.bp) - Math.log10(p.bp)));
      };
      const est = unk.map(d => ({d, bp: local(d)}));
      const lo = Math.min(...pts.map(p => p.bp)), hi = Math.max(...pts.map(p => p.bp));
      return {pts, unk, xs, ys, a, b, r2, est, out: est.some(e => !(e.bp >= lo && e.bp <= hi))};
    },
    fitRows() {
      const f = this.fit, t = this.t;
      return [['R²', '<span class="chip ' + (f.r2 >= 0.98 ? 'ok' : 'warn') + '">' + lkNumIn(fmt(f.r2, 4)) + '</span>'],
        [t('Curve'), t('log₁₀(bp) = ' + fmt(f.a, 3) + ' ' + (f.b < 0 ? '−' : '+') + ' ' + fmt(Math.abs(f.b), 4) + '·d')]];
    }
  },
  mounted() { this.draw(); },
  updated() { this.draw(); },
  methods: {
    F(x, d, mass_) { return lkNumIn(mass_ ? mass(x) : fmt(x, d)); },
    nl: NLN,
    /* een andere ladder: de afstanden beginnen opnieuw (met het voorbeeld, als er een is) */
    onLadder() { this.dist = exDist(this.ladder); },
    draw() {
      const cv = document.getElementById('b-cv'); if (!cv) return;
      const ctx = cv.getContext('2d'), f = this.fit;
      const C = chVars();   /* grafiekstijl (S80) */
      const dpr = window.devicePixelRatio || 1, W = 420, H = 260;
      cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H); if (C.bg) { ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); }
      if (!f) return;
      const {pts, unk, xs, ys, a, b, est} = f;
      cv._data = {head: ['type', 'afstand (mm)', 'grootte (bp)'],
        rows: [...pts.map(p => ['ladder', p.d, p.bp]), ...est.map(e => ['onbekend', e.d, Math.round(e.bp)])]};
      const pad = {l: 52, r: 12, t: 12, b: 34};
      const allx = xs.concat(unk), xmin = Math.min(...allx) * 0.9, xmax = Math.max(...allx) * 1.05;
      const ally = ys.concat(est.map(e => Math.log10(e.bp))), ymin = Math.floor(Math.min(...ally) * 10) / 10, ymax = Math.ceil(Math.max(...ally) * 10) / 10;
      const X = v => pad.l + (v - xmin) / (xmax - xmin) * (W - pad.l - pad.r), Y = v => H - pad.b - (v - ymin) / (ymax - ymin) * (H - pad.t - pad.b);
      ctx.font = '11px ' + C('--font-ui'); ctx.fillStyle = C('--muted'); ctx.strokeStyle = C('--line'); ctx.lineWidth = 1;
      [50, 100, 200, 300, 500, 1000, 2000, 3000, 5000, 10000].forEach(t => {
        const lv = Math.log10(t); if (lv < ymin || lv > ymax) return;
        ctx.beginPath(); ctx.moveTo(pad.l, Y(lv)); ctx.lineTo(W - pad.r, Y(lv)); ctx.stroke();
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(t >= 1000 ? (t / 1000) + ' kb' : t, pad.l - 6, Y(lv));
      });
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      const raw = (xmax - xmin) / 7 || 1, pw = 10 ** Math.floor(Math.log10(raw)), fr = raw / pw, step = (fr < 1.5 ? 1 : fr < 3 ? 2 : fr < 7 ? 5 : 10) * pw;
      for (let t = Math.ceil(xmin / step) * step, k = 0; t <= xmax && k < 40; t += step, k++) { ctx.fillText(String(Number(t.toPrecision(6))).replace('.', ','), X(t), H - pad.b + 6); }
      ctx.fillText(this.t('afstand (mm)'), (W + pad.l) / 2, H - 14);
      ctx.strokeStyle = C('--accent'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(xmin), Y(a + b * xmin)); ctx.lineTo(X(xmax), Y(a + b * xmax));
      ctx.save(); ctx.rect(pad.l, pad.t, W - pad.l - pad.r, H - pad.t - pad.b); ctx.clip(); ctx.stroke(); ctx.restore();
      ctx.fillStyle = C('--ink'); pts.forEach(p => { ctx.beginPath(); ctx.arc(X(p.d), Y(Math.log10(p.bp)), 3.5, 0, 7); ctx.fill(); });
      ctx.fillStyle = C('--bad'); est.forEach(e => { ctx.beginPath(); ctx.arc(X(e.d), Y(Math.log10(e.bp)), 5, 0, 7); ctx.fill(); });
    }
  }
};
</script>
