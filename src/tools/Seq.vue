<!-- ================= SEQUENTIE =================
     Plakken en opschonen (S191), omkeren en complementeren met IUPAC-codes. Het rekenwerk staat
     in src/lib/seq.js. De id's sq-in, sq-op en sq-out blijven zoals ze zijn: delen, ongedaan
     maken en de invoeropslag werken daarop. -->
<template>
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
      </template>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';
import {parseSeqs, OPS} from '../lib/seq.js';

const F = (x, d) => lkNumIn(fmt(x, d));
const OPN = {rc: 'Reverse complement', r: 'Omgekeerd (reverse)', c: 'Complement', n: 'Opgeschoond'};
const SUF = {rc: '_rc', r: '_r', c: '_c', n: ''};

export default {
  name: 'Seq',
  data() {
    const st = typeof storeGet === 'function' ? storeGet() : {};
    const g = (id, d) => (st[id] != null ? String(st[id]) : d);
    return {txt: g('sq-in', '>' + trPlain('Voorbeeld') + '\nATG GCN AAR TAY 12 GGW TCS\nATCGATCGAT'), op: g('sq-op', 'rc')};
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
      const R = this.m.recs, suf = SUF[this.op];
      return R.length === 1 ? R[0].out : R.map(r => '>' + r.name.replace(/\s.*/, '') + suf + '\n' + r.out).join('\n');
    }
  },
  methods: {F}
};
</script>
