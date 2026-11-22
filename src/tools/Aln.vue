<!-- ================= ALIGNMENT BEKIJKEN =================
     Leest een meervoudige uitlijning (Clustal .aln, uitgelijnde FASTA, PHYLIP, NEXUS, MSF, PIR)
     in één model; het inlezen staat in src/lib/alignment.js. De id's al-in, al-file en al-out
     blijven zoals ze zijn: delen, ongedaan maken, de invoeropslag en tests/validate.py werken
     daarop. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="f"><label for="al-in">{{ t('Uitlijning (Clustal, FASTA, PHYLIP, NEXUS, MSF of PIR)') }}</label>
        <textarea id="al-in" class="mono" rows="8" v-model="txt" spellcheck="false" wrap="off"></textarea></div>
      <div class="row" style="margin-top:8px">
        <input type="file" id="al-file" accept=".aln,.clustal,.fa,.fasta,.fas,.afa,.phy,.phylip,.nex,.nexus,.msf,.pir,.txt" :aria-label="t('Bestand openen')" @change="onFile">
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
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';
import {parseAlignment, alnType} from '../lib/alignment.js';

const FMT = {clustal: 'Clustal', fasta: 'FASTA', phylip: 'PHYLIP', nexus: 'NEXUS', msf: 'GCG MSF', pir: 'PIR/NBRF'};
const N = x => lkNumIn(fmt(x, 0));

export default {
  name: 'Aln',
  data() {
    const st = typeof storeGet === 'function' ? storeGet() : {};
    return {txt: st['al-in'] != null ? String(st['al-in']) : ''};
  },
  computed: {
    m() { return parseAlignment(this.txt); },
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
  methods: {
    onFile(e) {
      const f = e.target.files[0];
      if (f) f.text().then(x => { this.txt = x; });
    }
  }
};
</script>
