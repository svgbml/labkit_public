<!-- ================= CHROMATOGRAM (S149) =================
     Opent een ABIF-bestand (.ab1) van een Sanger-sequencer: een kaart met de gegevens van de run
     en de sequentie in blokken van 10. Een FASTA of geplakte tekst werkt als terugval (zonder trace).
     Het inlezen staat in src/lib/abif.js, het tekenen van de trace in src/lib/tracedraw.js (S150).
     De read is markRaw: 4 × 16 000 scanpunten hoeven niet reactief te zijn, het venster (view)
     wordt buiten Vue bijgehouden en elke wijziging tekent het canvas één keer per frame.
     De id's sg-file, sg-paste, sg-clear, sg-out, sg-cv en sg-seq blijven zoals ze zijn. -->
<template>
  <div class="picwrap">
    <div class="pic-prev">
      <div class="result">
        <div id="sg-out">
          <lk-note v-if="err" kind="bad">{{ err }}</lk-note>
          <lk-note v-if="!m.ok" kind="info">{{ t('Kies een .ab1-bestand, sleep het hierheen of plak een sequentie.') }}</lk-note>
          <template v-else>
            <lk-kv :rows="rows"/>
            <lk-note v-if="m.mismatch" kind="warn">{{ t('Het aantal basen en het aantal piekposities in dit bestand verschilt; de overtollige basen zijn weggelaten.') }}</lk-note>
          </template>
        </div>
        <div v-if="m.r.traces" class="sg-trace" style="margin-top:12px">
          <div class="row" style="gap:6px;margin-bottom:6px">
            <button type="button" id="sg-zin" @click="zoom(1 / 1.5)" :aria-label="t('Inzoomen')">+</button>
            <button type="button" id="sg-zout" @click="zoom(1.5)" :aria-label="t('Uitzoomen')">−</button>
            <button type="button" id="sg-zall" @click="whole">{{ t('Hele read') }}</button>
            <span style="margin-left:auto;font-weight:600;letter-spacing:6px"><span v-for="b in 'ACGT'" :key="b" :style="{color: dye[b]}">{{ b }}</span></span>
          </div>
          <canvas id="sg-cv" ref="cv" tabindex="0" style="width:100%;display:block;cursor:grab;touch-action:none" :style="{height: HT + 'px'}"
                  :aria-label="t('Trace van de vier kanalen; slepen schuift, scrollen zoomt, de strook onderaan toont de hele read')"
                  @wheel.prevent="wheel" @pointerdown="down" @pointermove="move" @pointerup="up" @pointercancel="up" @keydown="key"></canvas>
          <p style="font-size:13px;color:var(--muted);margin:6px 0 0">{{ t('Slepen schuift, scrollen zoomt (Shift + scrollen schuift); klik in de strook onderaan om naar die plek te gaan.') }}</p>
          <p style="font-size:13px;color:var(--muted);margin:4px 0 0">{{ t('Klik op een base om hem te selecteren en typ een letter om hem te wijzigen; de oorspronkelijke call blijft bewaard.') }}</p>
          <div v-if="sel != null || nEd" class="row" style="gap:10px;margin-top:8px;align-items:center;flex-wrap:wrap">
            <template v-if="sel != null">
              <b>{{ t('Base ' + (sel + 1)) }}</b>
              <span>{{ t('Origineel') }}: {{ read.bases[sel] }}</span>
              <input id="sg-base" class="mono" maxlength="1" :value="seq[sel]" :aria-label="t('Base')" style="width:3em;text-align:center;text-transform:uppercase" @input="onBase">
              <button type="button" id="sg-undo-base" :disabled="edits[sel] == null" @click="setBase(sel, read.bases[sel])">{{ t('Origineel terugzetten') }}</button>
            </template>
            <template v-if="nEd">
              <span>{{ t(nEd + ' bewerkt') }}</span>
              <button type="button" id="sg-undo-all" @click="undoAll">{{ t('Alle bewerkingen terugzetten') }}</button>
            </template>
          </div>
        </div>
        <pre id="sg-seq" class="mono" v-if="m.ok" style="white-space:pre-wrap;overflow-x:auto;margin-top:12px"><template v-for="(k, i) in seqTokens" :key="i"><mark v-if="k.o" class="sg-ed" :title="t('Origineel') + ': ' + k.o" style="background:#ffe0b2;color:inherit">{{ k.text }}</mark><template v-else>{{ k.text }}</template></template></pre>
      </div>
    </div>
    <div>
      <div class="panel">
        <h3>{{ t('Bestand') }}</h3>
        <div class="dropzone" :style="over ? 'outline:2px dashed var(--accent)' : ''" style="padding:10px"
             @dragover.prevent="over = true" @dragleave="over = false" @drop.prevent="drop">
          <input type="file" id="sg-file" accept=".ab1,.abi,.fsa,.fasta,.fa,.fas,.seq,.txt"
                 :aria-label="t('Chromatogram kiezen')" @change="pick">
          <p style="font-size:13px;color:var(--muted);margin:8px 0 0">{{ t('Een .ab1-bestand, of een FASTA- of tekstbestand met een sequentie. Je kunt het ook hierheen slepen.') }}</p>
        </div>
        <div class="f" style="margin-top:12px"><label for="sg-paste">{{ t('Of plak een FASTA of kale basen') }}</label>
          <textarea id="sg-paste" class="mono" rows="5" v-model="paste" spellcheck="false"></textarea></div>
        <div class="row" style="margin-top:10px">
          <button type="button" id="sg-clear" @click="clear">{{ t('Wissen') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {markRaw} from 'vue';
import {lkNumIn} from '../lib/bridge.js';
import {readAbif, abifRead} from '../lib/abif.js';
import {DYE, drawTraces, drawOverview, clampView} from '../lib/tracedraw.js';

const LB = 18, TH = 190, OV = 40, GAP = 20;   // hoogte trace, overzichtsstrook en de strook met posities (CSS-pixels); LB = strook met de baseletters bovenaan
const HT = LB + TH + GAP + OV + 8;
const IUPAC = /^[ACGTRYSWKMBDHVN]$/;
const GREY = '#8a94a3';

const NL = (x, d) => lkNumIn(fmt(x, d));

/* FASTA of kale basen: een regel met > geeft de naam, de rest houdt alleen IUPAC-letters */
function parseSeq(text) {
  const lines = String(text || '').split(/\r?\n/);
  const h = lines.find(l => l.startsWith('>'));
  const bases = lines.filter(l => !/^\s*[>;]/.test(l)).join('').toUpperCase().replace(/U/g, 'T').replace(/[^ACGTRYSWKMBDHVN]/g, '');
  return {name: h ? h.slice(1).trim() : '', bases};
}

export default {
  name: 'Sanger',
  data() {
    const st = typeof storeGet === 'function' ? storeGet() : {};
    const saved = jget('sg-read', null);
    return {read: saved ? markRaw(saved) : null, paste: st['sg-paste'] != null ? String(st['sg-paste']) : '', err: '', over: false,
      edits: saved && saved.edits ? saved.edits : {}, sel: null};
  },
  computed: {
    HT() { return HT; },
    nEd() { return Object.keys(this.edits).length; },
    /* de sequentie met de bewerkingen erin; read.bases houdt de oorspronkelijke calls */
    seq() {
      const b = this.m.r.bases;
      if (!this.nEd || !this.read) return b;
      const a = b.split('');
      for (const i in this.edits) if (i < a.length) a[i] = this.edits[i];
      return a.join('');
    },
    /* de read die alles toont: het geladen bestand, anders de geplakte tekst */
    m() {
      let r = this.read;
      if (!r) {
        const p = parseSeq(this.paste);
        r = {name: p.name, meta: null, order: '', traces: null, bases: p.bases, peaks: [], qual: []};
      }
      return {ok: r.bases.length > 0, r, mismatch: !!r.mismatch};
    },
    rows() {
      const r = this.m.r, me = r.meta || {}, t = this.t, out = [];
      const add = (l, v) => { if (v) out.push([t(l), esc(String(v))]); };
      add('Bestand', r.name); add('Monster', me.sample); add('Well', me.well); add('Instrument', me.instrument);
      add('Model', me.model); add('Dye set', me.dyeSet); add('Start run', me.start); add('Einde run', me.end);
      out.push([t('Leeslengte'), NL(this.seq.length, 0) + ' ' + t('basen')]);
      add('Kanaalvolgorde', r.order);
      if (r.qual.length) {
        const q20 = r.qual.filter(q => q >= 20).length;
        out.push([t('Gemiddelde kwaliteit'), NL(r.qual.reduce((a, b) => a + b, 0) / r.qual.length, 1) + ' (Phred)']);
        out.push([t('Q20 of hoger'), NL(q20, 0) + ' (' + NL(q20 / r.qual.length * 100, 1) + '%)']);
      }
      return out;
    },
    /* GenBank-ORIGIN: rijen van 60, groepen van 10, positie van de eerste base ervoor; een bewerkte base is een eigen stuk (o = oorspronkelijk) */
    seqTokens() {
      const q = this.seq, w = String(q.length).length, ed = this.edits, out = [];
      let buf = '';
      const flush = () => { if (buf) out.push({text: buf}); buf = ''; };
      for (let i = 0; i < q.length; i++) {
        if (i % 60 === 0) buf += (i ? '\n' : '') + String(i + 1).padStart(w) + '  ';
        else if (i % 10 === 0) buf += ' ';
        if (ed[i] != null) { flush(); out.push({text: q[i], o: this.m.r.bases[i]}); } else buf += q[i];
      }
      flush();
      return out;
    }
  },
  watch: {
    /* een andere read: begin links, ingezoomd tot ongeveer 1 scanpunt per pixel (±70 basen) */
    'm.r'() { this.view = {x0: 0, spp: 1}; this.$nextTick(this.draw); },
    sel() { this.draw(); },
    edits() { this.draw(); }
  },
  created() { this.dye = DYE; this.view = {x0: 0, spp: 1}; this.drag = null; },
  mounted() {
    window.__sgVm = this;
    this.ro = new ResizeObserver(() => this.draw());
    this.ro.observe(this.$el);
    this.$nextTick(this.draw);
  },
  beforeUnmount() { this.ro && this.ro.disconnect(); },
  methods: {
    pick(e) { this.load(e.target.files[0]); },
    drop(e) { this.over = false; this.load(e.dataTransfer.files[0]); },
    async load(file) {
      if (!file) return;
      this.err = '';
      const buf = await file.arrayBuffer();
      let r;
      try {
        const ab = readAbif(buf), d = abifRead(ab);
        r = {name: file.name, meta: ab.meta, order: d.order, traces: d.traces, bases: d.bases, peaks: d.peaks, qual: d.qual, mismatch: d.mismatch};
        if (!r.bases) { this.err = this.t('Dit ABIF-bestand bevat geen basecalls.'); return; }
      } catch (x) {
        if (!String(x.message).startsWith('Geen ABIF')) { this.err = this.t('Het ABIF-bestand is afgebroken.'); return; }
        const p = parseSeq(new TextDecoder().decode(buf));
        if (!p.bases) { this.err = this.t('Geen ABIF-bestand en geen sequentie gevonden.'); return; }
        r = {name: p.name || file.name, meta: null, order: '', traces: null, bases: p.bases, peaks: [], qual: []};
      }
      this.edits = {}; this.sel = null;
      this.read = markRaw(r);
      jset('sg-read', r);
    },
    /* tekenen gebundeld per frame; W = breedte in CSS-pixels */
    draw() {
      if (this.raf) return;
      this.raf = requestAnimationFrame(() => { this.raf = 0; this.paint(); });
    },
    paint() {
      const cv = this.$refs.cv, r = this.m.r, q = this.seq;
      if (!cv || !r.traces || !cv.clientWidth) return;
      const W = cv.clientWidth, H = HT, s = window.devicePixelRatio || 1;
      if (cv.width !== Math.round(W * s) || cv.height !== Math.round(H * s)) { cv.width = Math.round(W * s); cv.height = Math.round(H * s); }
      const x = cv.getContext('2d');
      x.setTransform(s, 0, 0, s, 0, 0);
      x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
      const scans = this.scans();
      const v = this.view = clampView(this.view, scans, W);
      drawTraces(x, r.traces, v, {x: 0, y: LB + 4, w: W, h: TH});
      this.labels(x, q, v, W);
      /* basenummers onder de trace, elke 10e base op zijn piek */
      x.fillStyle = '#5f6b7a'; x.font = '11px system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      const step = v.spp > 4 ? (v.spp > 10 ? 100 : 50) : 10;
      for (let i = step - 1; i < r.peaks.length; i += step) {
        const px = (r.peaks[i] - v.x0) / v.spp;
        if (px >= -20 && px <= W + 20) x.fillText(String(i + 1), px, LB + TH + 4 + GAP / 2);
      }
      drawOverview(x, r.traces, scans, v, W, {x: 0, y: LB + TH + GAP + 4, w: W, h: OV});
      this.drawn = (this.drawn || 0) + 1;   // telt de getekende frames (voor de test)
    },
    /* de baseletters in de strook bovenaan, zodra de basen minstens 7 px uit elkaar staan */
    sp() { const p = this.m.r.peaks, n = p.length; return n > 1 ? (p[n - 1] - p[0]) / (n - 1) : 0; },
    labels(x, q, v, W) {
      const p = this.m.r.peaks, n = Math.min(p.length, q.length), bw = this.sp() / v.spp;
      if (this.sel != null && this.sel < n) {
        x.fillStyle = 'rgba(21,101,192,.15)';
        x.fillRect((p[this.sel] - v.x0) / v.spp - bw / 2, 0, bw, LB + 4 + TH);
      }
      if (bw < 7) return;
      x.font = 'bold 12px system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      for (let i = 0; i < n; i++) {
        const px = (p[i] - v.x0) / v.spp;
        if (px < -10) continue;
        if (px > W + 10) break;
        if (this.edits[i] != null) { x.fillStyle = '#ffe0b2'; x.beginPath(); (x.roundRect || x.rect).call(x, px - 6.5, 1, 13, LB - 2, 3); x.fill(); }
        x.fillStyle = DYE[q[i]] || GREY;
        x.fillText(q[i], px, LB / 2 + 1);
      }
    },
    scans() { return Math.max(1, ...Object.values(this.m.r.traces).map(t => t.length)); },
    set(v) { this.view = v; this.draw(); },
    /* zoom met factor f (>1 = uit) rond pixel px (standaard het midden) */
    zoom(f, px) {
      const W = this.$refs.cv ? this.$refs.cv.clientWidth : 800, c = px == null ? W / 2 : px;
      const at = this.view.x0 + c * this.view.spp, spp = clampView({x0: 0, spp: this.view.spp * f}, this.scans(), W).spp;
      this.set({x0: at - c * spp, spp});
    },
    whole() { this.set({x0: 0, spp: 1e9}); },
    pan(dpx) { this.set({x0: this.view.x0 + dpx * this.view.spp, spp: this.view.spp}); },
    /* naar scanpunt s in het midden */
    center(s) { const W = this.$refs.cv.clientWidth; this.set({x0: s - W / 2 * this.view.spp, spp: this.view.spp}); },
    wheel(e) {
      const d = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(d)) this.pan(e.shiftKey ? d : e.deltaX);
      else this.zoom(Math.exp(d / 400), e.offsetX);
    },
    onOverview(e) { return e.offsetY > LB + TH + GAP; },
    down(e) {
      this.$refs.cv.setPointerCapture(e.pointerId);
      if (this.onOverview(e)) { this.drag = {ov: true}; this.center(e.offsetX / this.$refs.cv.clientWidth * this.scans()); }
      else { this.drag = {x: e.offsetX, sx: e.offsetX}; this.$refs.cv.style.cursor = 'grabbing'; }
    },
    move(e) {
      if (!this.drag) return;
      if (this.drag.ov) this.center(e.offsetX / this.$refs.cv.clientWidth * this.scans());
      else { this.pan(this.drag.x - e.offsetX); this.drag.x = e.offsetX; }
    },
    /* base waarvan de piek het dichtst bij pixel px ligt */
    nearest(px) {
      const p = this.m.r.peaks, n = Math.min(p.length, this.m.r.bases.length), s = this.view.x0 + px * this.view.spp;
      let lo = 0, hi = n - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (p[mid] < s) lo = mid + 1; else hi = mid; }
      return n ? (lo > 0 && s - p[lo - 1] < p[lo] - s ? lo - 1 : lo) : null;
    },
    select(i) { this.sel = i == null || !this.read || !this.read.peaks.length ? null : Math.max(0, Math.min(i, this.read.peaks.length - 1, this.read.bases.length - 1)); },
    /* base i (0-based) een nieuwe letter geven; gelijk aan het origineel haalt de bewerking weg */
    setBase(i, b) {
      b = String(b).toUpperCase();
      if (!this.read || !this.read.peaks.length || !IUPAC.test(b) || !(i >= 0 && i < this.read.bases.length)) return;
      const e = Object.assign({}, this.edits);
      if (b === this.read.bases[i]) delete e[i]; else e[i] = b;
      this.edits = e; this.save();
    },
    undoAll() { this.edits = {}; this.save(); },
    save() { jset('sg-read', Object.assign({}, this.read, {edits: this.edits})); },
    onBase(e) { this.setBase(this.sel, e.target.value); e.target.value = this.seq[this.sel]; },
    up(e) {
      const d = this.drag;
      if (d && !d.ov && e && e.type === 'pointerup' && Math.abs(e.offsetX - d.sx) <= 3 && this.read && this.read.peaks.length) this.select(this.nearest(e.offsetX));
      this.drag = null; if (this.$refs.cv) this.$refs.cv.style.cursor = 'grab'; },
    key(e) {
      if (this.sel != null && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const W = this.$refs.cv.clientWidth, i = this.sel, go = d => {
          this.select(i + d);
          const px = (this.read.peaks[this.sel] - this.view.x0) / this.view.spp;
          if (px < 10 || px > W - 10) this.center(this.read.peaks[this.sel]);
        };
        if (/^[a-z]$/i.test(e.key)) { e.preventDefault(); this.setBase(i, e.key); return; }
        const a = {Backspace: () => this.setBase(i, this.read.bases[i]), Delete: () => this.setBase(i, this.read.bases[i]),
          Escape: () => this.select(null), ArrowLeft: () => go(-1), ArrowRight: () => go(1)}[e.key];
        if (a) { e.preventDefault(); a(); return; }
      }
      const W = this.$refs.cv.clientWidth, k = {ArrowLeft: () => this.pan(-W / 4), ArrowRight: () => this.pan(W / 4),
        '+': () => this.zoom(1 / 1.5), '=': () => this.zoom(1 / 1.5), '-': () => this.zoom(1.5), Home: () => this.set({x0: 0, spp: this.view.spp}),
        End: () => this.set({x0: 1e9, spp: this.view.spp})}[e.key];
      if (k) { e.preventDefault(); k(); }
    },
    clear() {
      this.read = null; this.edits = {}; this.sel = null; this.paste = ''; this.err = '';
      jset('sg-read', null);
      const f = document.getElementById('sg-file'); if (f) f.value = '';
    }
  }
};
</script>
