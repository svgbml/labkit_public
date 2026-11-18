<!-- ================= pH BIJSTELLEN =================
     Hoeveel sterk zuur of sterke base je ongeveer nodig hebt om een buffer op de doel-pH te
     krijgen. Hoort naast pH-buffer (hh): die geeft de verhouding zuur/base als je beide
     vormen afweegt, deze geeft de titratie als je één vorm oplost en bijstelt. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <div class="f">
          <label for="pa-sys">{{ t('Buffersysteem') }}</label>
          <select id="pa-sys" v-model="sys">
            <option v-for="b in buffers" :key="b.k" :value="b.k">{{ t(b.n) }}</option>
            <option value="">{{ t('Eigen pKₐ') }}</option>
          </select>
        </div>
        <lk-field v-model="pka" :label="t('pKₐ (25 °C)')" for-id="pa-pka"/>
        <lk-field v-model="ph" :label="t('Gewenste pH')" for-id="pa-ph"/>
        <lk-field v-model="c" :label="t('Bufferconcentratie')" for-id="pa-c" unit="mM"/>
        <lk-field v-model="v" :label="t('Volume')" for-id="pa-v" unit="mL"/>
        <div class="f">
          <label for="pa-start">{{ t('Waarmee begin je') }}</label>
          <select id="pa-start" v-model="start">
            <option value="base">{{ t('de vrije base (bijstellen met zuur)') }}</option>
            <option value="acid">{{ t('het vrije zuur (bijstellen met base)') }}</option>
          </select>
        </div>
        <lk-field v-model="titr" :label="titrLabel" for-id="pa-titr" unit="M"/>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Geconcentreerd HCl is ongeveer 12 M en geconcentreerd NaOH-oplossing van 50% is ongeveer 19 M; een voorraad van 1 of 5 M pipetteer je nauwkeuriger. Los de buffer op in ongeveer 80% van het eindvolume, titreer, en vul daarna aan.') }}</p>
    </div>
    <div class="result">
      <div id="pa-out">
        <lk-note v-if="err" kind="info">{{ err }}</lk-note>
        <template v-else>
          <lk-big :label="headLabel" :value="volText" :sub="t('van je voorraad')"/>
          <lk-kv :rows="rows"/>
          <lk-note v-if="farFromPka" kind="warn">{{ farFromPka }}</lk-note>
          <lk-note kind="info">{{ t('Dit is een schatting: titreer met een pH-meter erbij. De pKₐ schuift met temperatuur en ionsterkte, en bij Tris is dat ongeveer −0,03 per °C.') }}</lk-note>
          <lk-formula :html="tHtml('f<sub>zuur</sub> = 1 / (1 + 10<sup>pH − pKₐ</sup>) · n = c × V × f')"/>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

/* pKₐ bij 25 °C (Sigma-Aldrich, Biological Buffers; Good e.a., Biochemistry 1966). Dezelfde
   lijst als bij de pH-buffer-tool, zodat de twee tools niet uit elkaar lopen. */
const PABUF = [
  {k: '4.76', n: 'Acetaat (pKₐ 4,76)'},
  {k: '6.10', n: 'MES (pKₐ 6,10)'},
  {k: '6.35', n: 'Carbonaat H₂CO₃/HCO₃⁻ (pKₐ 6,35)'},
  {k: '7.20', n: 'Fosfaat H₂PO₄⁻/HPO₄²⁻ (pKₐ 7,20)'},
  {k: '7.48', n: 'HEPES (pKₐ 7,48)'},
  {k: '8.06', n: 'Tris (pKₐ 8,06)'},
  {k: '9.24', n: 'Boraat (pKₐ 9,24)'},
  {k: '10.33', n: 'Carbonaat HCO₃⁻/CO₃²⁻ (pKₐ 10,33)'}
];
const F = (x, d) => lkNumIn(fmt(x, d)), G = (x, d) => lkNumIn(sig(x, d));

export default {
  name: 'Phadj',
  data() {
    return {sys: '8.06', pka: lkNumIn('8,06'), ph: lkNumIn('8,0'), c: lkNumIn('1000'),
      v: lkNumIn('1000'), start: 'base', titr: lkNumIn('12,1')};
  },
  computed: {
    buffers() { return PABUF; },
    /* Niet samenstellen uit een al vertaald woord: dan bestaat de sleutel niet en komt er een
       half vertaalde zin uit. Twee hele sleutels dus. */
    headLabel() {
      return this.start === 'base' ? this.t('Bij te stellen met zuur') : this.t('Bij te stellen met base');
    },
    needLabel() {
      return this.start === 'base' ? this.t('Benodigd zuur') : this.t('Benodigd base');
    },
    titrLabel() {
      return this.start === 'base' ? this.t('Concentratie van je zuur') : this.t('Concentratie van je base');
    },
    m() {
      const pka = num(this.pka), ph = num(this.ph), c = num(this.c) / 1000, V = num(this.v) / 1000;
      const titr = num(this.titr);
      /* het deel van de buffer dat geprotoneerd moet zijn bij de doel-pH */
      const fAcid = 1 / (1 + Math.pow(10, ph - pka));
      const need = this.start === 'base' ? fAcid : 1 - fAcid;   /* fractie die omgezet moet worden */
      const mol = c * V * need;
      return {pka, ph, c, V, titr, fAcid, need, mol, mL: titr > 0 ? mol / titr * 1000 : NaN};
    },
    err() {
      const m = this.m;
      if (!isFinite(m.pka) || !isFinite(m.ph)) return this.t('Vul een pKₐ en een gewenste pH in.');
      if (!(m.c > 0) || !(m.V > 0)) return this.t('Vul een concentratie en een volume groter dan 0 in.');
      if (!(m.titr > 0)) return this.t('Vul de concentratie van je zuur of base in.');
      return '';
    },
    volText() { return lkNumIn(vol(this.m.mL * 1000)); },
    rows() {
      const t = this.t, m = this.m;
      return [[this.needLabel, `${G(m.mol * 1000, 4)} mmol`],
        [t('Deel van de buffer dat omgezet wordt'), F(m.need * 100, 1) + '%'],
        [t('Bufferhoeveelheid in dit volume'), `${G(m.c * m.V * 1000, 4)} mmol`],
        [t('Verhouding base : zuur bij de doel-pH'),
          m.fAcid > 0 ? G((1 - m.fAcid) / m.fAcid, 3) + ' : 1' : '–'],
        [t('Afstand tot de pKₐ'), F(m.ph - m.pka, 2) + ' ' + t('pH-eenheid')]];
    },
    farFromPka() {
      const d = Math.abs(this.m.ph - this.m.pka);
      if (d <= 1) return '';
      return this.t('De doel-pH ligt ' + lkNumIn(fmt(d, 2))
        + ' pH-eenheid van de pKₐ: dit systeem buffert daar slecht en de schatting wordt onnauwkeurig. Kies een buffer met een pKₐ dichter bij de doel-pH.');
    }
  },
  watch: {
    /* een systeem kiezen zet de pKₐ; "Eigen pKₐ" laat hem staan zodat je zelf kunt typen */
    sys(k) { if (k) this.pka = lkNumIn(String(k).replace('.', ',')); }
  }
};
</script>
