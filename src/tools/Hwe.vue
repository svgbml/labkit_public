<!-- ================= HARDY-WEINBERG & FORENSISCHE KENGETALLEN =================
     hwStats(), hwExact() en hwRng() blijven onveranderd in tools/nt/74_hwe.js staan: daar
     hangt het validatiegeval aan. Deze component leest de genotypen in en toont de uitkomst.

     De id's hw-loc, hw-g en hw-out blijven zoals ze waren. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <div class="f">
          <label for="hw-loc">{{ t('Locus') }}</label>
          <input id="hw-loc" class="txt" v-model="loc">
        </div>
        <div class="f" style="grid-column:1/-1">
          <label for="hw-g" v-html="gLabel"></label>
          <textarea id="hw-g" rows="9" v-model="g"></textarea>
        </div>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0" v-html="hint"></p>
    </div>
    <div class="result">
      <div id="hw-out">
        <lk-note v-if="m.msg" :kind="m.kind">{{ t(m.msg) }}</lk-note>
        <template v-else>
          <!-- de naam van de locus is tekst van de gebruiker: ud() zet hem in een span die de
               vertaling ongemoeid laat, dus het label gaat als html mee -->
          <div class="lbl" v-html="tHtml(ud(loc) + ' · exacte HWE-toets')"></div>
          <lk-big :html="pText"/>
          <lk-kv :rows="kvRows"/>
          <lk-note v-if="m.p < 0.05" kind="warn" :html="hweWarn"/>
          <lk-note v-if="m.small" kind="info">{{ t(m.small + ' genotypeklassen hebben een verwachte frequentie onder 5; de χ²-toets is dan onbetrouwbaar, gebruik de exacte toets.') }}</lk-note>
          <lk-table :cols="outCols" :rows="outRows"/>
          <lk-formula html="PD = 1 − Σ G<sub>i</sub>² · PE = h²(1 − 2hH²) · TPI = 1/(2H)"/>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => lkNumIn(fmt(x, d));
const P = p => (p < 0.001 ? lkNumIn('&lt; 0,001') : '= ' + F(p, 3));

export default {
  name: 'Hwe',
  data() {
    return {
      loc: 'D8S1179',
      g: '13 14 9\n12 13 6\n13 13 5\n14 15 5\n10 13 4\n11 14 4\n12 14 3\n13 15 3\n14 14 3\n10 14 2\n11 13 2\n12 12 1\n15 16 2\n13 16 1'
    };
  },
  computed: {
    /* &lt; staat hier in JavaScript, niet in de template: daar zou Vue hem decoderen en past de
       sleutel niet meer bij die van de DOM-laag */
    hweWarn() { return this.tHtml('Afwijking van Hardy-Weinberg (p &lt; 0,05). Controleer typefouten, null-allelen, substructuur of een kleine steekproef. Bij meerdere loci: corrigeer voor meervoudig toetsen.'); },
    gLabel() { return this.tHtml('Genotypen, één per regel <span class="example">voorbeeld</span>'); },
    hint() {
      return this.tHtml('Per regel twee allelen, gescheiden door een spatie of /, bijvoorbeeld <span class="mono">13 14</span> of <span class="mono">9.3/10</span>. Een derde getal is het aantal personen met dat genotype. Voorbeelddata zijn verzonnen.');
    },
    /* het inlezen en de χ²-vergelijking uit calc.hwe; de toets zelf is hwExact() */
    m() {
      const G = this.g.split(/\n/).map(l => {
        const t = l.trim().split(/[\s\/;\t]+/).filter(Boolean).map(x => x.replace(',', '.'));
        if (t.length < 2) return null;
        const c = t.length > 2 ? Math.round(num(t[2])) : 1;
        if (!(c > 0)) return null;
        return [t[0], t[1], Math.min(c, 1e5)];
      }).filter(Boolean);
      const n = G.reduce((s, g) => s + g[2], 0);
      if (n < 2) return {msg: 'Vul genotypen van minstens twee personen in.', kind: 'info'};
      if (n > 20000) return {msg: 'Maximaal 20 000 personen.', kind: 'warn'};
      const S = hwStats(G), k = S.A.length, p = hwExact(S);
      let chi = 0, small = 0;
      const df = k * (k - 1) / 2;
      for (let i = 0; i < k; i++) for (let j = i; j < k; j++) {
        const key = S.A[i] + '/' + S.A[j], e = (i === j ? S.p[i] * S.p[i] : 2 * S.p[i] * S.p[j]) * n, o = S.gc[key] || 0;
        if (e < 5) small++;
        if (e > 0) chi += (o - e) ** 2 / e;
      }
      const pchi = df > 0 ? 1 - chicdf(chi, df) : NaN;
      return {S, n, k, p, chi, df, pchi, small};
    },
    pText() { const p = this.m.p; return 'p ' + (isFinite(p) ? P(p) : '–'); },
    kvRows() {
      const t = this.t, {S, n, k, chi, df, pchi} = this.m;
      return [[t('Personen / allelen'), `${lkNumIn(n)} / ${lkNumIn(k)}`],
        [this.tHtml('H<sub>o</sub> (geobserveerd)'), F(S.Ho, 3)], [this.tHtml('H<sub>e</sub> (verwacht)'), F(S.He, 3)],
        [t('χ² (ter vergelijking)'), isFinite(pchi) ? `${F(chi, 2)}, df = ${lkNumIn(df)}, p ${P(pchi)}` : '–'],
        [t('Matchkans PM'), F(S.PM, 4)], [t('Discriminatiekracht PD'), F(S.PD, 4)], ['PIC', F(S.pic, 4)],
        [t('Uitsluitingskans PE'), F(S.PE, 4)], [t('Typische vaderschapsindex TPI'), isFinite(S.TPI) ? F(S.TPI, 2) : '–']];
    },
    outCols() {
      const t = this.t;
      return [{h: t('Allel')}, {h: t('Aantal'), num: true}, {h: t('Frequentie'), num: true}];
    },
    outRows() {
      const S = this.m.S;
      return S.A.map((a, i) => [esc(a), lkNumIn(S.al[a]), F(S.p[i], 4)]);
    }
  },
  methods: {ud(v) { return ud(v); }}
};
</script>
