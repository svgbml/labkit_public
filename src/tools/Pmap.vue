<!-- ================= PLASMIDEKAART =================
     Een cirkelvormige kaart van een plasmide: kenmerken uit een GenBank-bestand of met de hand,
     de knipplaatsen van enzymen die zelden knippen, en de primers uit Primers oplossen.
     Het rekenwerk staat in src/tools/plasmid.js en src/tools/seqTools.js; hier staan de velden
     en de tekening. De tekening gaat via pShow(), zodat de knoppenbalk (PNG, SVG, kopiëren,
     afdrukken) werkt zoals bij de andere schema's. De id's pl-title, pl-seq, pl-circ, pl-max,
     pl-primers, pl-cv en pl-out blijven zoals ze zijn. -->
<template>
  <div class="picwrap">
    <div class="pic-prev">
      <div class="result">
        <canvas id="pl-cv"></canvas>
        <div class="pic-bar" v-html="picBar"></div>
        <div id="pl-out">
          <lk-note v-if="!m" kind="info">{{ t('Plak een sequentie of een GenBank-bestand.') }}</lk-note>
          <template v-else>
            <lk-kv :rows="rows"/>
            <lk-table v-if="siteRows.length" :cols="siteCols" :rows="siteRows"/>
            <lk-note v-if="m.feats.length === 0" kind="info">{{ t('Geen kenmerken gevonden: plak een GenBank-bestand of voeg ze met de hand toe.') }}</lk-note>
          </template>
        </div>
      </div>
    </div>
    <div class="pic-form">
      <div class="panel">
        <div class="fields">
          <div class="f" style="grid-column:1/-1">
            <label for="pl-title">{{ t('Naam') }}</label>
            <input id="pl-title" class="txt" v-model="title">
          </div>
          <div class="f" style="grid-column:1/-1">
            <label for="pl-seq">{{ t('Sequentie of GenBank-bestand') }}</label>
            <textarea id="pl-seq" v-model="seq" rows="6" class="mono" spellcheck="false" style="width:100%"></textarea>
          </div>
          <lk-field v-model="max" :label="t('Toon enzymen die hoogstens zo vaak knippen')" for-id="pl-max" inputmode="numeric"/>
          <div class="f" style="grid-column:1/-1">
            <label for="pl-primers">{{ t('Primers (één per regel, optioneel met naam)') }}</label>
            <textarea id="pl-primers" v-model="primers" rows="3" class="mono" spellcheck="false" style="width:100%"
              :placeholder="t('M13-fwd GTAAAACGACGGCCAGT')"></textarea>
          </div>
          <label class="chk" for="pl-circ" style="grid-column:1/-1">
            <input type="checkbox" id="pl-circ" v-model="circ"> {{ t('Circulair') }}
          </label>
        </div>
        <div class="row" style="margin-top:10px">
          <button type="button" id="pl-ex" @click="example">{{ t('Voorbeeld: pUC19') }}</button>
        </div>
        <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Een GenBank-bestand levert de kenmerken (genen, promotors, origin) en de lengte; een kale sequentie alleen de knipplaatsen. Kenmerken die over de oorsprong heen lopen, worden overgeslagen.') }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn, lkPicBar} from '../lib/bridge.js';
import {cleanSeq, insilicoPcr, ENZ} from './seqTools.js';
import {parseGenBank, uniqueSites} from './plasmid.js';
import {PUC19} from './puc19.js';

const F = (x, d) => lkNumIn(fmt(x, d));
/* kleur per soort kenmerk; de namen zijn die van plasmid.js */
const KCOL = {gen: '#1558b0', promotor: '#0f766e', origin: '#7c3aed', terminator: '#be123c', primer: '#c2410c', kenmerk: '#5f6b7a'};

export default {
  name: 'Pmap',
  data() {
    return {title: 'pUC19', seq: '', circ: true, max: '2', primers: ''};
  },
  computed: {
    picBar() { return lkPicBar('pl'); },
    /* de kaart: lengte, kenmerken, knipplaatsen en primerbindingen */
    m() {
      const gb = parseGenBank(this.seq);
      const seq = gb ? gb.seq : cleanSeq(this.seq);
      if (seq.length < 20) return null;
      const circ = gb ? (gb.circular || this.circ) : this.circ;
      const n = seq.length;
      const feats = (gb ? gb.feats : []).filter(f => f.to <= n && f.from < f.to);
      const max = Math.max(1, Math.min(10, Math.round(num(this.max)) || 1));
      const sites = uniqueSites(seq, circ, max);
      const prs = [];
      this.primers.split(/\r?\n/).map(l => l.trim()).filter(Boolean).forEach((line, i) => {
        const parts = line.split(/\s+/), s = cleanSeq(parts[parts.length - 1]);
        const nm = parts.length > 1 ? parts.slice(0, -1).join(' ') : this.t('Primer') + ' ' + (i + 1);
        if (s.length < 10) return;
        const r = insilicoPcr(seq, s, s, circ);
        (r ? r.sites : []).forEach(b => prs.push({nm, dir: b.dir, pos: b.dir === 1 ? b.start : b.start3, len: s.length}));
      });
      return {seq, n, circ, feats, sites, prs};
    },
    rows() {
      const m = this.m, t = this.t;
      return [[t('Lengte'), F(m.n, 0) + ' bp'],
        [t('Vorm'), t(m.circ ? 'circulair' : 'lineair')],
        [t('GC-gehalte'), F((m.seq.match(/[GC]/g) || []).length / m.n * 100, 1) + ' %'],
        [t('Kenmerken'), String(m.feats.length)],
        [t('Primerbindingen'), String(m.prs.length)]];
    },
    siteCols() {
      const t = this.t;
      return [{h: t('Enzym')}, {h: t('Knipplaatsen')}, {h: t('Positie'), num: true}];
    },
    siteRows() {
      return this.m.sites.slice(0, 40).map(s => [s.e, String(s.cuts.length), s.cuts.map(c => F(c + 1, 0)).join(', ')]);
    }
  },
  mounted() { this.draw(); },
  updated() { this.draw(); },
  methods: {
    example() { this.seq = PUC19; this.circ = true; this.title = 'pUC19'; this.primers = 'M13-fwd GTAAAACGACGGCCAGT\nM13-rev CAGGAAACAGCTATGAC'; },
    draw() {
      const cv = document.getElementById('pl-cv'), m = this.m;
      if (!cv) return;
      if (!m) { pShow(cv, 420, 120, x => { x.fillStyle = PCOL.muted; x.font = '13px ' + PFONT(); x.textAlign = 'center'; x.fillText(trPlain('Nog geen sequentie'), 210, 60); }); return; }
      const W = 700, H = 580, R = 165, cx = W / 2, cy = 285;
      const ang = p => (p / m.n) * 2 * Math.PI - Math.PI / 2;   /* positie 1 bovenaan, met de klok mee */
      const px = (p, r) => [cx + Math.cos(ang(p)) * r, cy + Math.sin(ang(p)) * r];
      pShow(cv, W, H, x => {
        pTitle(x, this.title.trim(), W);
        /* de ruggengraat */
        x.strokeStyle = PCOL.line; x.lineWidth = 9; x.beginPath();
        if (m.circ) x.arc(cx, cy, R, 0, 2 * Math.PI); else { x.arc(cx, cy, R, ang(0), ang(m.n)); }
        x.stroke();
        /* schaalstreepjes elke 500 bp */
        const step = m.n > 8000 ? 2000 : m.n > 3000 ? 1000 : 500;
        x.font = '10px ' + PFONT(); x.textAlign = 'center'; x.textBaseline = 'middle';
        for (let p = 0; p < m.n; p += step) {
          const [x1, y1] = px(p, R + 5), [x2, y2] = px(p, R + 11);
          x.strokeStyle = PCOL.line; x.lineWidth = 1; x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke();
          const [tx, ty] = px(p, R + 22); x.fillStyle = PCOL.muted; x.fillText(String(p || 1), tx, ty);
        }
        /* kenmerken als dikke bogen met een pijlpunt in de richting van het gen */
        m.feats.slice(0, 40).forEach(f => {
          const col = KCOL[f.kind] || KCOL.kenmerk, a0 = ang(f.from), a1 = ang(f.to);
          x.strokeStyle = col; x.lineWidth = 13; x.lineCap = 'butt';
          x.beginPath(); x.arc(cx, cy, R, a0, a1); x.stroke();
          const tip = f.dir === -1 ? f.from : f.to, back = f.dir === -1 ? f.from + m.n * 0.012 : f.to - m.n * 0.012;
          const [hx, hy] = px(tip, R), [b1x, b1y] = px(back, R - 9), [b2x, b2y] = px(back, R + 9);
          x.fillStyle = col; x.beginPath(); x.moveTo(hx, hy); x.lineTo(b1x, b1y); x.lineTo(b2x, b2y); x.closePath(); x.fill();
          /* het label binnen de cirkel, op de helft van het kenmerk */
          const mid = (f.from + f.to) / 2, [lx, ly] = px(mid, R - 34);
          x.fillStyle = col; x.font = '600 11px ' + PFONT(); x.textAlign = 'center';
          x.fillText(uv(f.label.slice(0, 18)), lx, ly);
        });
        /* primerbindingen: een korte pijl net binnen de ring */
        m.prs.slice(0, 20).forEach(p => {
          const from = p.dir === 1 ? p.pos : p.pos + p.len, to = p.dir === 1 ? p.pos + p.len : p.pos;
          x.strokeStyle = KCOL.primer; x.lineWidth = 3;
          x.beginPath(); x.arc(cx, cy, R - 20, ang(Math.min(from, to)), ang(Math.max(from, to))); x.stroke();
          const [ax, ay] = px(to, R - 20); x.fillStyle = KCOL.primer;
          x.beginPath(); x.arc(ax, ay, 3.2, 0, 2 * Math.PI); x.fill();
          const [tx, ty] = px((from + to) / 2, R - 32);
          x.font = '10px ' + PFONT(); x.textAlign = 'center'; x.fillText(uv(p.nm.slice(0, 14)), tx, ty);
        });
        /* knipplaatsen buiten de ring: de labels links en rechts, uit elkaar geduwd zodat
           een dicht opeen liggende polylinker leesbaar blijft */
        const labels = [];
        m.sites.forEach(s2 => s2.cuts.forEach(c => labels.push({e: s2.e, c})));
        labels.sort((a, b) => a.c - b.c);
        const shown = labels.slice(0, 30);
        const side = {1: [], '-1': []};
        shown.forEach(L => { const a = ang(L.c); side[Math.cos(a) >= 0 ? 1 : -1].push({...L, y: cy + Math.sin(a) * R}); });
        x.font = '11px ' + PFONT(); x.textBaseline = 'middle';
        [1, -1].forEach(sg => {
          const list = side[sg].sort((a, b) => a.y - b.y), gap = 13;
          for (let i2 = 1; i2 < list.length; i2++) if (list[i2].y - list[i2 - 1].y < gap) list[i2].y = list[i2 - 1].y + gap;
          const over = list.length ? list[list.length - 1].y - (cy + R + 30) : 0;
          if (over > 0) list.forEach(L => { L.y -= over; });
          const lx = cx + sg * (R + 62);
          list.forEach(L => {
            const [x1, y1] = px(L.c, R + 6);
            x.strokeStyle = PCOL.line; x.lineWidth = 1;
            x.beginPath(); x.moveTo(x1, y1); x.lineTo(lx - sg * 4, L.y); x.stroke();
            x.fillStyle = PCOL.ink; x.textAlign = sg > 0 ? 'left' : 'right';
            x.fillText(L.e + ' ' + NL(L.c + 1, 0), lx, L.y);
          });
        });
        if (labels.length > shown.length) {
          x.fillStyle = PCOL.muted; x.textAlign = 'center'; x.font = '11px ' + PFONT();
          x.fillText(trPlain('+ ' + (labels.length - shown.length) + ' meer in de tabel'), cx, H - 12);
        }
        /* de naam en de lengte in het midden */
        x.textAlign = 'center'; x.fillStyle = PCOL.ink; x.font = '600 15px ' + PFONT();
        x.fillText(uv(this.title.trim() || trPlain('Plasmide')), cx, cy - 6);
        x.fillStyle = PCOL.muted; x.font = '12px ' + PFONT();
        x.fillText(NL(m.n, 0) + ' bp', cx, cy + 14);
      });
    }
  }
};
</script>
