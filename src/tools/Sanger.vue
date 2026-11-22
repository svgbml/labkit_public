<!-- ================= CHROMATOGRAM (S149) =================
     Opent een ABIF-bestand (.ab1) van een Sanger-sequencer: een kaart met de gegevens van de run
     en de sequentie in blokken van 10. Een FASTA of geplakte tekst werkt als terugval (zonder trace).
     Het inlezen staat in src/lib/abif.js; S150 zet het tracecanvas #sg-cv boven het sequentiepaneel.
     De id's sg-file, sg-paste, sg-clear, sg-out en sg-seq blijven zoals ze zijn. -->
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
        <!-- hier komt in S150 het tracecanvas #sg-cv -->
        <pre id="sg-seq" class="mono" v-if="m.ok" style="white-space:pre-wrap;overflow-x:auto;margin-top:12px">{{ seqText }}</pre>
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
import {lkNumIn} from '../lib/bridge.js';
import {readAbif, abifRead} from '../lib/abif.js';

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
    return {read: jget('sg-read', null), paste: st['sg-paste'] != null ? String(st['sg-paste']) : '', err: '', over: false};
  },
  computed: {
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
      out.push([t('Leeslengte'), NL(r.bases.length, 0) + ' ' + t('basen')]);
      add('Kanaalvolgorde', r.order);
      if (r.qual.length) {
        const q20 = r.qual.filter(q => q >= 20).length;
        out.push([t('Gemiddelde kwaliteit'), NL(r.qual.reduce((a, b) => a + b, 0) / r.qual.length, 1) + ' (Phred)']);
        out.push([t('Q20 of hoger'), NL(q20, 0) + ' (' + NL(q20 / r.qual.length * 100, 1) + '%)']);
      }
      return out;
    },
    /* GenBank-ORIGIN: rijen van 60, groepen van 10, positie van de eerste base ervoor */
    seqText() {
      const s = this.m.r.bases, w = String(s.length).length, out = [];
      for (let i = 0; i < s.length; i += 60)
        out.push(String(i + 1).padStart(w) + '  ' + s.slice(i, i + 60).match(/.{1,10}/g).join(' '));
      return out.join('\n');
    }
  },
  mounted() { window.__sgVm = this; },
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
      this.read = r;
      jset('sg-read', r);
    },
    clear() {
      this.read = null; this.paste = ''; this.err = '';
      jset('sg-read', null);
      const f = document.getElementById('sg-file'); if (f) f.value = '';
    }
  }
};
</script>
