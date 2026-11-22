<!-- ================= ALIGNMENT BEKIJKEN =================
     Leest een meervoudige uitlijning (Clustal .aln, uitgelijnde FASTA, PHYLIP, NEXUS, MSF, PIR)
     in één model; het inlezen staat in src/lib/alignment.js. De id's al-in, al-file, al-col, al-cbs, al-out en al-view
     blijven zoals ze zijn: delen, ongedaan maken, de invoeropslag en tests/validate.py werken
     daarop.
     De viewer (S171) tekent alleen de cellen die in beeld zijn: een laag met position:sticky
     blijft in het venster staan terwijl een lege 'sizer' de schuifbalken de volle maat geeft, en
     bij elk scrollen worden de zichtbare rijen opnieuw uitgesneden (één tekstregel per rij). Zo
     blijft een uitlijning van duizenden kolommen vloeiend. -->
<template>
  <div>
  <div class="grid2">
    <div class="panel">
      <div class="f"><label for="al-in">{{ t('Uitlijning (Clustal, FASTA, PHYLIP, NEXUS, MSF of PIR)') }}</label>
        <textarea id="al-in" class="mono" rows="8" v-model="txt" spellcheck="false" wrap="off"></textarea></div>
      <div class="row" style="margin-top:8px">
        <input type="file" id="al-file" accept=".aln,.clustal,.fa,.fasta,.fas,.afa,.phy,.phylip,.nex,.nexus,.msf,.pir,.txt" :aria-label="t('Bestand openen')" @change="onFile">
      </div>
      <div class="fields" style="margin-top:12px">
        <div class="f"><label for="al-col">{{ t('Kleuren') }}</label>
          <select id="al-col" v-model="col">
            <option value="auto">{{ t('Automatisch') }}</option>
            <option value="clustalx">{{ t('ClustalX (eiwit)') }}</option>
            <option value="nt">{{ t('Nucleotiden') }}</option>
            <option value="ident">{{ t('Identiteit') }}</option>
            <option value="none">{{ t('Geen') }}</option>
          </select></div>
        <label class="chk" for="al-cbs"><input type="checkbox" id="al-cbs" v-model="cbs"> {{ t('Kleurenblind-veilig') }}</label>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Het formaat wordt aan de eerste regel herkend. Uitlijnen doe je met Clustal Omega bij EBI; download daar de uitkomst als .aln en open die hier.') }}</p>
    </div>
    <div class="result">
      <div id="al-out">
        <lk-note v-if="!txt.trim()" kind="info">{{ t('Plak een uitlijning of open een bestand.') }}</lk-note>
        <lk-note v-else-if="!m.format" kind="bad">{{ t('Dit formaat wordt niet herkend. Verwacht: Clustal, FASTA, PHYLIP, NEXUS, MSF of PIR.') }}</lk-note>
        <lk-note v-else-if="!m.names.length" kind="bad">{{ t('Geen sequenties gevonden.') }}</lk-note>
        <template v-else>
          <lk-kv :rows="rows"/>
          <lk-note v-for="(w, i) in m.warn" :key="i" kind="warn">{{ t(w) }}</lk-note>
          <lk-table :cols="cols" :rows="seqRows"/>
        </template>
      </div>
    </div>
  </div>
  <div v-show="m.names.length" id="al-view" ref="view" :class="['aln-view', {'aln-cbs': cbs}]" :style="{height: viewH + 'px'}" @scroll="onScroll">
    <span ref="probe" class="aln-mono aln-probe" aria-hidden="true">{{ 'M'.repeat(50) }}</span>
    <span ref="sw" class="aln-sw" aria-hidden="true"></span>
    <div class="aln-sizer" :style="{width: g.W + 'px', height: g.H + 'px'}">
      <div class="aln-pin" :style="{width: vw + 'px', height: vh + 'px'}">
        <!-- de kleuren staan op één canvas onder de tekst: duizenden gekleurde <span>s per
             scrollstap kosten meer dan een frame (S172) -->
        <canvas ref="cv" class="aln-bg" :style="{width: vw + 'px', height: vh + 'px'}"></canvas>
        <div v-for="r in vis.rows" :key="r.i" class="aln-mono aln-seq" :style="{top: r.top + 'px', left: vis.left + 'px'}">{{ r.txt }}</div>
        <div class="aln-names" :style="{width: g.nameW + 'px'}">
          <div v-for="r in vis.rows" :key="r.i" class="aln-mono aln-name" :style="{top: r.top + 'px'}" :title="m.names[r.i]">{{ m.names[r.i] }}</div>
        </div>
        <div class="aln-ruler" :style="{height: RH + 'px'}">
          <span v-for="k in vis.ticks" :key="k.c" :style="{left: k.x + 'px'}">{{ k.c }}</span>
        </div>
        <div class="aln-corner" :style="{width: g.nameW + 'px', height: RH + 'px'}">{{ t('Positie') }}</div>
      </div>
    </div>
  </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';
import {parseAlignment, alnType, alnColours, alnCls} from '../lib/alignment.js';

const FMT = {clustal: 'Clustal', fasta: 'FASTA', phylip: 'PHYLIP', nexus: 'NEXUS', msf: 'GCG MSF', pir: 'PIR/NBRF'};
const N = x => lkNumIn(fmt(x, 0));
const CH = 18, RH = 22, MAXNAME = 24; /* rijhoogte, hoogte van de liniaal, naamkolom in tekens */

export default {
  name: 'Aln',
  data() {
    const st = typeof storeGet === 'function' ? storeGet() : {};
    return {txt: st['al-in'] != null ? String(st['al-in']) : '', col: st['al-col'] != null ? String(st['al-col']) : 'auto',
      cbs: !!st['al-cbs'], RH, sx: 0, sy: 0, vw: 0, vh: 0, cw: 8};
  },
  computed: {
    m() { return parseAlignment(this.txt); },
    /* het gekozen schema (Automatisch: nucleotiden of ClustalX naar het type) en zijn kolomtabel */
    sch() { return this.col === 'auto' ? (alnType(this.m) === 'nt' ? 'nt' : 'clustalx') : this.col; },
    tab() { return this.sch === 'none' ? undefined : alnColours(this.m, this.sch); },
    /* de volle maat van het raster */
    g() {
      const m = this.m, nameW = Math.ceil(Math.min(MAXNAME, Math.max(6, ...m.names.map(n => n.length))) * this.cw) + 14;
      return {nameW, W: nameW + m.len * this.cw, H: RH + m.names.length * CH};
    },
    viewH() { return Math.min(this.g.H + 18, 540); },
    /* alleen wat in beeld is: rijen r0..r1, kolommen c0..c1 (0-based, c1 exclusief) */
    vis() {
      const m = this.m, g = this.g, cw = this.cw;
      const c0 = Math.max(0, Math.floor(this.sx / cw)), c1 = Math.min(m.len, Math.ceil((this.sx + this.vw - g.nameW) / cw) + 1);
      const r0 = Math.max(0, Math.floor(this.sy / CH)), r1 = Math.min(m.names.length, Math.ceil((this.sy + this.vh - RH) / CH) + 1);
      const rows = [];
      for (let i = r0; i < r1; i++) rows.push({i, top: RH + i * CH - this.sy, txt: m.seqs[i].slice(c0, c1)});
      /* een getal boven elke tiende kolom, in het midden van die kolom */
      const ticks = [];
      for (let c = Math.ceil((c0 + 1) / 10) * 10; c <= c1; c += 10) ticks.push({c, x: g.nameW + (c - 0.5) * cw - this.sx});
      return {rows, ticks, c0, c1, left: g.nameW + c0 * cw - this.sx};
    },
    rows() {
      const m = this.m, t = this.t, ty = alnType(m);
      return [[t('Formaat'), FMT[m.format]], [t('Sequenties'), N(m.names.length)],
        [t('Lengte'), N(m.len) + ' ' + t('kolommen')],
        [t('Type'), ty === 'nt' ? t('DNA/RNA') : ty === 'aa' ? t('eiwit') : '–']];
    },
    cols() { return [{h: this.t('Naam')}, {h: this.t('Zonder gaten'), num: true}, {h: this.t('Gaten'), num: true}]; },
    seqRows() {
      return this.m.seqs.map((s, i) => {
        const g = s.split('-').length - 1;
        return [esc(this.m.names[i]), N(s.length - g), N(g)];
      });
    }
  },
  mounted() {
    window.__alnVm = this;
    /* de sectie is verborgen tot de tool opent; meet pas als het venster een maat heeft */
    this.ro = new ResizeObserver(() => this.measure());
    this.ro.observe(this.$refs.view);
    /* een ander thema geeft andere tinten */
    this.mo = new MutationObserver(() => this.paint());
    this.mo.observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});
  },
  beforeUnmount() { if (this.ro) this.ro.disconnect(); if (this.mo) this.mo.disconnect(); },
  watch: {
    /* een nieuwe uitlijning begint linksboven */
    m() { const v = this.$refs.view; if (v) { v.scrollLeft = 0; v.scrollTop = 0; } this.sx = this.sy = 0; },
    /* na de render: dan staat de klasse aln-cbs al op het venster */
    vis: {handler() { this.paint(); }, flush: 'post'},
    tab: {handler() { this.paint(); }, flush: 'post'},
    cbs: {handler() { this.paint(); }, flush: 'post'}
  },
  methods: {
    measure() {
      const v = this.$refs.view, p = this.$refs.probe;
      if (!v || !v.clientWidth) return;
      const w = p.getBoundingClientRect().width / 50;
      if (w > 0) this.cw = w;
      this.vw = v.clientWidth; this.vh = v.clientHeight;
    },
    /* klasse van cel (rij i, kolom c), '' zonder kleur */
    cellCls(i, c) { return this.tab === undefined ? '' : alnCls(this.tab, c, this.m.seqs[i][c]); },
    /* de kleur van een klasse in het huidige thema, uit de CSS gelezen (per thema en palet onthouden) */
    shade(k) {
      const key = (document.documentElement.getAttribute('data-theme') || '') + this.cbs + k;
      const memo = this.memo || (this.memo = {});
      if (!(key in memo)) { const e = this.$refs.sw; e.className = 'aln-sw k-' + k; memo[key] = getComputedStyle(e).backgroundColor; }
      return memo[key];
    },
    /* de zichtbare cellen inkleuren, per run van dezelfde klasse één rechthoek */
    paint() {
      const cv = this.$refs.cv;
      if (!cv || !this.vw) return;
      const dpr = window.devicePixelRatio || 1, W = Math.round(this.vw * dpr), H = Math.round(this.vh * dpr);
      if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
      const x = cv.getContext('2d'), v = this.vis, cw = this.cw;
      x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, this.vw, this.vh);
      if (this.tab === undefined) return;
      for (const r of v.rows) {
        let c = v.c0;
        while (c < v.c1) {
          const k = this.cellCls(r.i, c); let e = c + 1;
          while (e < v.c1 && this.cellCls(r.i, e) === k) e++;
          if (k) { x.fillStyle = this.shade(k); x.fillRect(v.left + (c - v.c0) * cw, r.top, (e - c) * cw, CH); }
          c = e;
        }
      }
    },
    /* synchroon: Vue rendert in een microtaak, dus nog vóór het scherm wordt getekend */
    onScroll(e) { this.sx = e.target.scrollLeft; this.sy = e.target.scrollTop; },
    onFile(e) {
      const f = e.target.files[0];
      if (f) f.text().then(x => { this.txt = x; });
    }
  }
};
</script>
