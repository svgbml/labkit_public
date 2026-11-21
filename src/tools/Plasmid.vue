<!-- ================= PLASMIDEKAART =================
     Leest een geplakte sequentie, een FASTA of een GenBank-bestand (met kenmerken) en tekent er
     een ronde kaart van: de kenmerken als pijlen op de ring, de knipplaatsen erbuiten en de
     primers erbinnen. Het rekenwerk staat in src/lib/genbank.js (inlezen), src/lib/digest.js
     (knipplaatsen, S45) en src/lib/primer.js (primerbindingen, S44); het tekenen in
     src/lib/plasmidmap.js. De tekening gebruikt de gedeelde exportbalk (PNG/SVG/kopiëren/
     afdrukken), dus het canvas heet pl-cv en gaat door pShow().

     De id's pl-seq, pl-circ, pl-name, pl-enz, pl-uniq, pl-prim, pl-cv en pl-out blijven zoals
     ze zijn: delen, ongedaan maken en de invoeropslag werken daarop. -->
<template>
  <div class="picwrap">
    <div class="pic-prev">
      <div class="result">
        <canvas id="pl-cv" v-show="m.ok"></canvas>
        <div class="pic-bar" v-html="picBar"></div>
        <div id="pl-out">
          <lk-note v-if="!m.ok" kind="info">{{ t('Plak een sequentie, een FASTA of een GenBank-bestand.') }}</lk-note>
          <template v-else>
            <lk-kv :rows="rows"/>
            <lk-note v-for="(n, i) in notes" :key="i" :kind="n[0]">{{ n[1] }}</lk-note>
            <lk-table v-if="featRows.length" :cols="featCols" :rows="featRows"/>
            <lk-table v-if="siteRows.length" :cols="siteCols" :rows="siteRows"/>
            <lk-table v-if="primRows.length" :cols="primCols" :rows="primRows"/>
          </template>
        </div>
      </div>
    </div>
    <div>
      <div class="panel">
        <div class="f"><label for="pl-seq">{{ t('Sequentie, FASTA of GenBank') }}</label>
          <textarea id="pl-seq" class="mono" rows="7" v-model="seq" spellcheck="false"></textarea></div>
        <div class="fields" style="margin-top:12px">
          <lk-field v-model="name" :label="t('Naam op de kaart')" for-id="pl-name" cls="txt" inputmode="text"/>
        </div>
        <label class="chk" for="pl-circ" style="margin-top:10px">
          <input type="checkbox" id="pl-circ" v-model="circ"> {{ t('Circulair (een GenBank-bestand bepaalt dit zelf)') }}</label>
        <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Een GenBank-bestand levert de kenmerken (promotor, CDS, origin, terminator); bij een kale sequentie of FASTA tekent de kaart alleen de knipplaatsen en de primers.') }}</p>
      </div>
      <div class="panel" style="margin-top:16px">
        <h3>{{ t('Knipplaatsen') }}</h3>
        <div class="f"><label for="pl-enz">{{ t('Enzymen (leeg = alle bekende)') }}</label>
          <input id="pl-enz" class="txt" v-model="enz" :placeholder="t('bijv. EcoRI, HindIII, BamHI')"></div>
        <label class="chk" for="pl-uniq" style="margin-top:10px">
          <input type="checkbox" id="pl-uniq" v-model="uniq"> {{ t('Alleen enzymen die één keer knippen') }}</label>
        <h3 style="margin-top:16px">{{ t('Primers') }}</h3>
        <div class="f"><label for="pl-prim">{{ t('Primers, één per regel: naam en sequentie (5′→3′)') }}</label>
          <textarea id="pl-prim" class="mono" rows="3" v-model="prim" spellcheck="false"></textarea></div>
        <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('De kaart toont hoogstens 40 knipplaatsen, anders wordt hij onleesbaar; kies dan zelf een paar enzymen.') }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn, lkPicBar} from '../lib/bridge.js';
import {readSeq, GB_DRAW} from '../lib/genbank.js';
import {ENZ, cuts, enzInfo} from '../lib/digest.js';
import {parsePrimers, pcrSites} from '../lib/primer.js';
import {drawPlasmid} from '../lib/plasmidmap.js';

const MAXSITE = 40;
const NL = (x, d) => lkNumIn(fmt(x, d));

export default {
  name: 'Plasmid',
  data() {
    const st = typeof storeGet === 'function' ? storeGet() : {};
    const g = (id, d) => (st[id] != null ? String(st[id]) : d);
    return {seq: g('pl-seq', ''), name: g('pl-name', ''), circ: st['pl-circ'] != null ? !!st['pl-circ'] : true,
      enz: g('pl-enz', ''), uniq: st['pl-uniq'] != null ? !!st['pl-uniq'] : true, prim: g('pl-prim', '')};
  },
  computed: {
    picBar() { return lkPicBar('pl'); },
    /* alles wat de kaart en de tabellen nodig hebben, één keer */
    m() {
      const src = readSeq(this.seq, this.circ);
      if (src.seq.length < 20) return {ok: false, src};
      const len = src.seq.length, circular = src.circular;
      const feats = src.features.filter(f => f.type !== 'source' && GB_DRAW.includes(f.type));
      /* de gekozen enzymen, of alle bekende; een onbekende naam wordt gemeld */
      const want = this.enz.split(/[\s,;]+/).map(s => s.trim()).filter(Boolean);
      const bad = want.filter(n => !ENZ[n]);
      const names = want.length ? want.filter(n => ENZ[n]) : Object.keys(ENZ);
      const hits = names.map(n => ({name: n, p: cuts(src.seq, n, circular)})).filter(h => h.p.length);
      const keep = this.uniq ? hits.filter(h => h.p.length === 1) : hits;
      const sites = [];
      keep.forEach(h => h.p.forEach(p => sites.push({name: h.name, pos: p + 1})));
      sites.sort((a, b) => a.pos - b.pos);
      const P = parsePrimers(this.prim);
      const primers = pcrSites(src.seq, P, circular).map(s => ({name: P[s.pi].name || P[s.pi].seq.slice(0, 8),
        pos: s.end3 + 1, strand: s.strand === '+' ? 1 : -1, len: P[s.pi].seq.length, mis: s.mis}));
      const gc = (src.seq.match(/[GC]/g) || []).length;
      return {ok: true, src, len, circular, feats, sites: sites.slice(0, MAXSITE), allSites: sites,
        primers, gc, bad, cutters: keep.length, P};
    },
    rows() {
      const m = this.m, t = this.t;
      return [[t('Lengte'), NL(m.len, 0) + ' bp'], [t('Vorm'), t(m.circular ? 'circulair' : 'lineair')],
        [t('GC-gehalte'), NL(m.gc / m.len * 100, 1) + '%'],
        [t('Kenmerken'), NL(m.feats.length, 0)],
        [this.uniq ? t('Enzymen die één keer knippen') : t('Knipplaatsen'), NL(m.allSites.length, 0)]];
    },
    notes() {
      const m = this.m, t = this.t, out = [];
      if (m.bad.length) out.push(['warn', t('Onbekend enzym: ' + uv(m.bad.join(', ')) + '.')]);
      if (m.allSites.length > MAXSITE) out.push(['info', t('Alleen de eerste ' + MAXSITE + ' knipplaatsen staan op de kaart.')]);
      if (!m.src.features.length && /LOCUS/.test(this.seq)) out.push(['info', t('Dit GenBank-bestand heeft geen kenmerken om te tekenen.')]);
      if (!m.circular) out.push(['info', t('Een lineaire sequentie wordt als open ring getekend, met streepjes op de uiteinden.')]);
      m.primers.forEach(p => { if (p.mis) out.push(['info', t(uv(p.name) + ' bindt met ' + p.mis + ' afwijking(en) aan de 5′-kant.')]); });
      return out;
    },
    featCols() {
      return [{h: this.t('Kenmerk')}, {h: this.t('Type')}, {h: this.t('Van–tot'), num: true},
        {h: this.t('Streng')}, {h: this.t('Lengte'), num: true}];
    },
    featRows() {
      const m = this.m;
      return m.feats.map(f => {
        const sw = ((f.end - f.start + m.len) % m.len) + 1;
        return [esc(f.name), f.type, NL(f.start, 0) + '–' + NL(f.end, 0), f.strand < 0 ? '−' : '+', NL(sw, 0) + ' bp'];
      });
    },
    siteCols() { return [{h: this.t('Enzym')}, {h: this.t('Positie'), num: true}, {h: this.t('Uiteinden')}]; },
    siteRows() {
      return this.m.sites.map(s => [s.name, NL(s.pos, 0), this.t(enzInfo(s.name).end)]);
    },
    primCols() { return [{h: this.t('Primer')}, {h: this.t('Streng')}, {h: this.t('Positie 3′-eind'), num: true}]; },
    primRows() {
      return this.m.primers.map(p => [esc(p.name), p.strand < 0 ? '−' : '+', NL(p.pos, 0)]);
    }
  },
  mounted() { this.draw(); },
  updated() { this.draw(); },
  methods: {
    /* de kaart; na elke render opnieuw, net als bij de andere tekentools */
    draw() {
      const cv = document.getElementById('pl-cv'), m = this.m;
      if (!cv || !m.ok) return;
      const W = 620, H = 540;
      const d = {name: this.name.trim() || m.src.name, len: m.len, circular: m.circular,
        feats: m.feats, sites: m.sites, primers: m.primers};
      /* op het canvas blijft de tekst Nederlands: trCanvas vertaalt hem en zet de getallen
         in de notatie van de gebruiker (een eigen lkNumIn zou dat dubbel doen) */
      pShow(cv, W, H, x => drawPlasmid(x, W, H, d, {PCOL, font: PFONT(), uv, nl: v => fmt(v, 0)}));
    }
  }
};
</script>
