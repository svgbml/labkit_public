<!-- ================= SEQUENTIE =================
     Plakken en opschonen (S191), omkeren en complementeren met IUPAC-codes. Het rekenwerk staat
     in src/lib/seq.js. De id's sq-in, sq-op en sq-out blijven zoals ze zijn: delen, ongedaan
     maken en de invoeropslag werken daarop. -->
<template>
  <div class="stack">
  <div class="grid2">
    <div class="panel">
      <div class="f"><label for="sq-in">{{ t('Sequentie of (multi-)FASTA') }}</label>
        <textarea id="sq-in" class="mono" rows="8" v-model="txt" spellcheck="false"></textarea></div>
      <div class="fields" style="margin-top:12px">
        <div class="f"><label for="sq-op">{{ t('Bewerking') }}</label>
          <select id="sq-op" v-model="op">
            <option value="rc">{{ t('Reverse complement') }}</option>
            <option value="r">{{ t('Omgekeerd (reverse)') }}</option>
            <option value="c">{{ t('Complement') }}</option>
            <option value="n">{{ t('Alleen opschonen') }}</option>
          </select></div>
        <div class="f"><label for="sq-type">{{ t('Uitvoer als') }}</label>
          <select id="sq-type" v-model="type"><option value="dna">DNA (T)</option><option value="rna">RNA (U)</option></select></div>
        <div class="f"><label for="sq-case">{{ t('Letters') }}</label>
          <select id="sq-case" v-model="lcase"><option value="up">{{ t('Hoofdletters') }}</option><option value="lo">{{ t('Kleine letters') }}</option></select></div>
        <div class="f"><label for="sq-w">{{ t('Regelbreedte') }}</label>
          <select id="sq-w" v-model="w"><option value="0">{{ t('Eén regel') }}</option><option value="60">60</option><option value="70">70</option><option value="80">80</option></select></div>
        <div class="f"><label for="sq-fmt">{{ t('Formaat') }}</label>
          <select id="sq-fmt" v-model="fmt"><option value="auto">{{ t('FASTA bij meer records') }}</option><option value="plain">{{ t('Kale tekst') }}</option><option value="fasta">FASTA</option></select></div>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Cijfers, spaties en regeleinden gaan eruit; een FASTA-kopregel begint een nieuw record. Ambigue basen (R, Y, S, W, K, M, B, D, H, V, N) krijgen hun IUPAC-complement.') }}</p>
    </div>
    <div class="result" id="sq-res">
      <lk-note v-if="!m.recs.length" kind="info">{{ t('Plak een sequentie of een FASTA-bestand.') }}</lk-note>
      <template v-else>
        <lk-big :label="t(opName)" :value="F(m.len, 0)" :sub="t(m.recs.length === 1 ? 'nt' : 'nt in ' + m.recs.length + ' records')"/>
        <div class="f"><label for="sq-out">{{ t('Uitkomst') }}</label>
          <textarea id="sq-out" class="mono" rows="8" readonly :value="out" spellcheck="false" data-notr></textarea></div>
        <lk-note v-if="m.dropped" kind="warn">{{ t(m.dropped + ' teken(s) weggelaten die geen IUPAC-base zijn.') }}</lk-note>
        <lk-note v-if="m.rna" kind="info">{{ t('De invoer bevatte U: gelezen als RNA en gerekend als T.') }}</lk-note>
        <h3 style="margin-top:14px">{{ t('Feiten') }}</h3>
        <div class="f" v-if="m.recs.length > 1"><label for="sq-rec">{{ t('Record') }}</label>
          <select id="sq-rec" v-model="rec"><option v-for="(r, i) in m.recs" :key="i" :value="String(i)">{{ r.name }}</option></select></div>
        <div id="sq-facts"><lk-kv :rows="factRows"/></div>
        <lk-note v-if="fx.amb" kind="info">{{ t('Ambigue basen tellen in de molmassa met het gemiddelde van hun mogelijke basen en niet mee in het GC-gehalte.') }}</lk-note>
      </template>
    </div>
  </div>
  <!-- zes leesramen (S193) -->
  <div class="grid2">
    <div class="panel">
      <h3>{{ t('Vertaling in zes leesramen') }}</h3>
      <div class="fields">
        <div class="f"><label for="sq-code">{{ t('Genetische code') }}</label>
          <select id="sq-code" v-model="code"><option v-for="(c, k) in codes" :key="k" :value="String(k)">{{ t(c[0]) }}</option></select></div>
        <lk-field v-model="min" :label="t('Minimale ORF-lengte')" for-id="sq-min" unit="aa" inputmode="numeric"/>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Een ORF loopt van een startcodon (M) tot en met het eerste stopcodon in hetzelfde leesraam. Posities gelden op de bovenste streng; op de − streng loopt een ORF van rechts naar links. Stopcodons staan als * in rood, ORF’s gemarkeerd.') }}</p>
    </div>
    <div class="result" id="sq-orf">
      <lk-note v-if="!m.recs.length" kind="info">{{ t('Plak een sequentie of een FASTA-bestand.') }}</lk-note>
      <template v-else>
        <lk-big :label="t('Open leesramen (ORF’s)')" :value="String(tr.orfs.length)" :sub="t('van ten minste ' + tr.min + ' aa')"/>
        <lk-table v-if="tr.orfs.length" :cols="orfCols" :rows="orfRows"/>
        <lk-note v-else kind="info">{{ t('Geen ORF van deze lengte gevonden.') }}</lk-note>
        <div class="mono" data-notr style="font-size:12px;word-break:break-all;margin-top:10px">
          <div v-for="fr in tr.segs" :key="fr.f" style="margin-top:6px"><b>{{ fr.f > 0 ? '+' + fr.f : '−' + -fr.f }}</b>&nbsp;<span v-for="(x, i) in fr.s" :key="i" :style="x.st">{{ x.x }}</span></div>
        </div>
      </template>
    </div>
  </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';
import {parseSeqs, OPS, formatSeq, facts, CODES, frames, orfs} from '../lib/seq.js';

const F = (x, d) => lkNumIn(fmt(x, d));
const OPN = {rc: 'Reverse complement', r: 'Omgekeerd (reverse)', c: 'Complement', n: 'Opgeschoond'};
const SUF = {rc: '_rc', r: '_r', c: '_c', n: ''};
/* T<sub>m</sub> zoals de primerkaart: de standaard van PCR-cyclus (y-na, y-mg, y-dntp, y-pc) */
const ION = {na: 50, mg: 1.5, dntp: 0.8, pc: 0.2};
const ST = {o: 'background:var(--accent-soft)', s: 'color:var(--bad);font-weight:700', os: 'background:var(--accent-soft);color:var(--bad);font-weight:700'};
const MAXORF = 50;

export default {
  name: 'Seq',
  data() {
    const st = typeof storeGet === 'function' ? storeGet() : {};
    const g = (id, d) => (st[id] != null ? String(st[id]) : d);
    return {txt: g('sq-in', '>' + trPlain('Voorbeeld') + '\nATG GCN AAR TAY 12 GGW TCS\nATCGATCGAT'), op: g('sq-op', 'rc'),
      type: g('sq-type', 'dna'), lcase: g('sq-case', 'up'), w: g('sq-w', '0'), fmt: g('sq-fmt', 'auto'), rec: g('sq-rec', '0'),
      code: g('sq-code', '1'), min: g('sq-min', '50')};
  },
  computed: {
    /* één keer opschonen en bewerken; de rest leest hieruit */
    m() {
      const p = parseSeqs(this.txt), f = OPS[this.op] || OPS.rc;
      const recs = p.recs.map((r, i) => ({name: (r.name || trPlain('Sequentie') + ' ' + (i + 1)), seq: r.seq, out: f(r.seq)}));
      return {...p, recs, len: recs.reduce((a, r) => a + r.seq.length, 0)};
    },
    opName() { return OPN[this.op] || OPN.rc; },
    out() {
      const R = this.m.recs, suf = SUF[this.op], o = {rna: this.type === 'rna', lower: this.lcase === 'lo', width: +this.w};
      const fasta = this.fmt === 'fasta' || (this.fmt === 'auto' && R.length > 1);
      return R.map(r => (fasta ? '>' + r.name.replace(/\s.*/, '') + suf + '\n' : '') + formatSeq(r.out, o)).join(fasta ? '\n' : '\n\n');
    },
    /* het gekozen record; feiten, vertaling en knipplaatsen gaan over dit record (de invoer, niet de uitkomst) */
    cur() { const R = this.m.recs; return R[+this.rec] || R[0]; },
    fx() { return facts(this.cur.seq, this.type === 'rna'); },
    codes() { return CODES; },
    /* zes leesramen, de ORF's en de stukjes om te tonen, één keer */
    tr() {
      if (!this.cur) return {orfs: [], segs: [], min: 0};
      const min = Math.max(1, Math.round(num(this.min)) || 50), fr = frames(this.cur.seq, (CODES[this.code] || CODES[1])[1]);
      const O = orfs(this.cur.seq, fr, min);
      const segs = fr.map(({f, p}) => {
        const inO = new Uint8Array(p.length), s = [];
        O.filter(o => o.f === f).forEach(o => inO.fill(1, o.a, o.b + 1));
        for (let i = 0; i < p.length; i++) {
          const k = (inO[i] ? 'o' : '') + (p[i] === '*' ? 's' : ''), last = s[s.length - 1];
          if (last && last.k === k) last.x += p[i]; else s.push({k, x: p[i], st: ST[k] || ''});
        }
        return {f, s};
      });
      return {orfs: O, segs, min};
    },
    orfCols() {
      return [{h: this.t('Leesraam')}, {h: this.t('Van'), num: true}, {h: this.t('Tot'), num: true},
        {h: this.t('Lengte (aa)'), num: true}, {h: this.t('Lengte (nt)'), num: true}];
    },
    orfRows() {
      return this.tr.orfs.slice(0, MAXORF).map(o => [o.f > 0 ? '+' + o.f : '−' + -o.f, F(o.from, 0), F(o.to, 0), F(o.aa, 0), F(3 * o.aa + 3, 0)]);
    },
    factRows() {
      const f = this.fx, t = this.t, rna = this.type === 'rna', c = b => F(f.n[b] || 0, 0);
      const tm = f.L <= 60 ? primerInfo(this.cur.seq, ION) : null;
      return [[t('Lengte'), F(f.L, 0) + ' nt'], [t('GC-gehalte'), isFinite(f.gc) ? F(f.gc, 1) + '%' : '–'],
        [t('Basen'), 'A ' + c('A') + ' · C ' + c('C') + ' · G ' + c('G') + ' · ' + (rna ? 'U ' : 'T ') + c('T') + (f.amb ? ' · ' + t('ambigu') + ' ' + F(f.amb, 0) : '')],
        [t(rna ? 'Molmassa ssRNA' : 'Molmassa ssDNA'), F(f.ss, 1) + ' g/mol'],
        rna ? null : [t('Molmassa dsDNA'), F(f.ds, 1) + ' g/mol'],
        rna ? null : tm && isFinite(tm.nn) ? [this.tHtml('T<sub>m</sub> (nearest-neighbor, als primer)'), F(tm.nn, 1) + '&nbsp;°C']
          : [this.tHtml('T<sub>m</sub> (64,9 + 41·(GC − 16,4)/N)'), F(64.9 + 41 * (f.gc / 100 * f.L - 16.4) / f.L, 1) + '&nbsp;°C']];
    }
  },
  methods: {F}
};
</script>
