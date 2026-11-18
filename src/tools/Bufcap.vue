<!-- ================= BUFFERCAPACITEIT =================
     Het rekenwerk (bcNbar, bcCb, bcBeta) blijft onveranderd in tools/nt/78_bufcap.js staan:
     daar hangt het validatiegeval aan. Deze component beheert de velden en de uitkomst.

     De tekening blijft met de gewone tekencontext gemaakt; na elke render wordt chart()
     opnieuw aangeroepen, net als bij de Z′-factor. De id's bc-pre, bc-pka, bc-c, bc-ph,
     bc-pt, bc-v, bc-cs, bc-cv en bc-out blijven zoals ze waren. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <div class="f">
          <label for="bc-pre">{{ t('Buffer') }}</label>
          <select id="bc-pre" v-model="pre" @change="onPre">
            <option v-for="p in presets" :key="p.v" :value="p.v">{{ t(p.n) }}</option>
          </select>
        </div>
        <lk-field v-model="pka" :label="t('pKₐ-waarden')" for-id="bc-pka" cls="txt" inputmode="text"/>
        <lk-field v-model="c" :label="t('Totale bufferconcentratie')" for-id="bc-c" unit="mM"/>
        <lk-field v-model="ph" :label="t('pH nu')" for-id="bc-ph"/>
        <lk-field v-model="pt" :label="t('Gewenste pH')" for-id="bc-pt"/>
        <lk-field v-model="v" :label="t('Volume')" for-id="bc-v" unit="mL"/>
        <lk-field v-model="cs" :label="t('Titrant (NaOH of HCl)')" for-id="bc-cs" unit="mol/L"/>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('pKₐ-waarden bij 25 °C, gescheiden door spaties (punt of komma). De berekening gebruikt concentraties zonder activiteitscorrectie; bij hoge ionsterkte wijkt de echte pH een paar tienden af. Controleer altijd met een pH-meter.') }}</p>
    </div>
    <div class="result">
      <canvas id="bc-cv" v-show="ok"></canvas>
      <div id="bc-out">
        <lk-note v-if="!ok" kind="info">{{ t('Vul minstens één pKₐ, de bufferconcentratie en een pH tussen 0 en 14 in.') }}</lk-note>
        <template v-else>
          <lk-big :label="betaLabel" :value="betaText" :sub="t('mM per pH-eenheid')"/>
          <lk-kv :rows="rows"/>
          <lk-kv v-if="titrRows.length" :rows="titrRows"/>
          <lk-note v-if="farFromPka" kind="warn">{{ farText }}</lk-note>
          <lk-formula :html="tHtml('β = dC<sub>b</sub>/dpH · bufferbereik ≈ pKₐ ± 1')"/>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => lkNumIn(fmt(x, d)), G = (x, d) => lkNumIn(sig(x, d));

/* dezelfde lijst als in de oude keuzelijst; de waarde is wat er in het pKₐ-veld komt */
const PRESETS = [{v: '', n: 'eigen'}, {v: '7.20', n: 'fosfaat (pKₐ₂ 7,20)'}, {v: '8.07', n: 'Tris (8,07)'},
  {v: '7.48', n: 'HEPES (7,48)'}, {v: '4.76', n: 'acetaat (4,76)'},
  {v: '6.40 10.33', n: 'carbonaat (6,40; 10,33)'}, {v: '3.13 4.76 6.40', n: 'citraat (3,13; 4,76; 6,40)'}];

export default {
  name: 'Bufcap',
  data() {
    return {pre: '', pka: '7.20', c: '50', ph: lkNumIn('6,80'), pt: lkNumIn('7,40'),
      v: '500', cs: '1'};
  },
  computed: {
    presets() { return PRESETS; },
    /* de pKₐ's uit het tekstveld: gescheiden door spaties of puntkomma's, gesorteerd */
    pk() {
      return String(this.pka).trim().split(/[\s;]+/).map(v => num(v))
        .filter(v => isFinite(v) && v > -2 && v < 16).sort((a, b) => a - b);
    },
    conc() { return num(this.c) / 1000; },
    ok() {
      const ph = num(this.ph);
      return this.pk.length > 0 && this.conc >= 0 && ph >= 0 && ph <= 14;
    },
    beta() { return bcBeta(num(this.ph), this.pk, this.conc); },
    betaLabel() { return this.t('Buffercapaciteit bij pH ' + F(num(this.ph), 2)); },
    betaText() { return G(this.beta * 1000, 3); },
    /* de pKₐ die het dichtst bij de huidige pH ligt: daar is de buffer op zijn sterkst */
    near() {
      const ph = num(this.ph);
      return this.pk.reduce((a, p) => Math.abs(p - ph) < Math.abs(a - ph) ? p : a);
    },
    rows() {
      const t = this.t;
      return [[t('Dichtstbijzijnde pKₐ'), F(this.near, 2)],
        [t('Maximale β (bij pH ≈ pKₐ)'), G(bcBeta(this.near, this.pk, this.conc) * 1000, 3) + ' mM/pH']];
    },
    /* hoeveel titrant er nodig is om van de huidige naar de gewenste pH te komen */
    titrant() {
      const pt = num(this.pt), V = num(this.v);
      if (!(pt >= 0 && pt <= 14 && V > 0)) return null;
      const dn = (bcCb(pt, this.pk, this.conc) - bcCb(num(this.ph), this.pk, this.conc)) * V / 1000;
      return {dn, base: dn >= 0};
    },
    titrRows() {
      const T = this.titrant; if (!T || !this.ok) return [];
      const t = this.t, cs = num(this.cs);
      return [[t(T.base ? 'Sterke base nodig' : 'Sterk zuur nodig'), G(Math.abs(T.dn) * 1000, 3) + ' mmol'],
        [t('Volume ' + (T.base ? 'NaOH' : 'HCl') + ' (' + F(cs, 2) + ' M)'),
          cs > 0 ? lkNumIn(vol(Math.abs(T.dn) / cs * 1e6)) : '–']];
    },
    farFromPka() {
      return !!this.titrant && this.ok && Math.abs(num(this.pt) - this.near) > 1;
    },
    farText() {
      return this.t('De gewenste pH ligt meer dan één eenheid van de dichtstbijzijnde pKₐ ('
        + F(this.near, 2) + '); de buffer werkt daar slecht.');
    }
  },
  mounted() { this.draw(); },
  updated() { this.draw(); },
  methods: {
    /* een keuze uit de lijst vult het pKₐ-veld; "eigen" laat staan wat er stond */
    onPre() { if (this.pre) this.pka = this.pre; },
    draw() {
      const cv = document.getElementById('bc-cv'); if (!cv || !this.ok) return;
      const pk = this.pk, C = this.conc, ph = num(this.ph);
      /* de hoogte van de as volgt uit het stuk van de curve dat in beeld komt (pH 2–12) */
      const ys = []; for (let x = 0; x <= 14.0001; x += 0.05) ys.push(bcBeta(x, pk, C));
      const ymax = Math.max(...ys.slice(40, 241)) * 1.15 || 0.01;
      chart(cv, {xmin: 2, xmax: 12, ymin: 0, ymax: ymax * 1000, xlabel: 'pH',
        ylabel: 'β (mM per pH)',
        series: [{fn: x => bcBeta(x, pk, C) * 1000, name: 'β'},
          {pts: [[ph, this.beta * 1000]], color: '--warn', name: 'pH nu'}]});
    }
  }
};
</script>
