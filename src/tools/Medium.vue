<!-- ================= CELKWEEKMEDIUM KLAARMAKEN =================
     Percentages gaan over het eindvolume, zoals in de protocollen: 10% FBS in 500 mL is
     50 mL serum, en het basismedium is wat er na alle supplementen overblijft. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <lk-field v-model="v" :label="t('Eindvolume')" for-id="md-v" unit="mL"/>
        <div class="f">
          <label for="md-base">{{ t('Basismedium') }}</label>
          <select id="md-base" v-model="base">
            <option v-for="b in bases" :key="b" :value="b">{{ b }}</option>
          </select>
        </div>
        <lk-field v-model="fbs" :label="t('Serum (FBS)')" for-id="md-fbs" unit="%"/>
        <div class="f">
          <label for="md-ps">{{ t('Penicilline-streptomycine') }}</label>
          <select id="md-ps" v-model="ps">
            <option value="1">{{ t('1× uit 100× voorraad') }}</option>
            <option value="0.5">{{ t('0,5× (halve dosis)') }}</option>
            <option value="0">{{ t('geen') }}</option>
          </select>
        </div>
        <div class="f">
          <label for="md-gln">{{ t('L-glutamine') }}</label>
          <select id="md-gln" v-model="gln">
            <option value="2">{{ t('2 mM uit 200 mM voorraad') }}</option>
            <option value="4">{{ t('4 mM uit 200 mM voorraad') }}</option>
            <option value="0">{{ t('geen (zit al in het medium)') }}</option>
          </select>
        </div>
        <lk-field v-model="extraName" :label="t('Eigen supplement')" for-id="md-xn" cls="txt" inputmode="text"/>
        <lk-field v-model="extraFold" :label="t('Voorraad is hoeveel keer sterker')" for-id="md-xf" unit="×"/>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Laat het serum en de supplementen op kamertemperatuur komen voordat je ze bij het medium doet, en werk in de flowkast. Laat een veld leeg om dat supplement weg te laten.') }}</p>
    </div>
    <div class="result">
      <div id="md-out">
        <lk-note v-if="err" kind="info">{{ err }}</lk-note>
        <template v-else>
          <lk-big :label="t('Basismedium')" :value="baseText" :sub="baseSub"/>
          <lk-table :cols="cols" :rows="rows"/>
          <lk-note v-if="tooMuch" kind="bad">{{ tooMuch }}</lk-note>
          <lk-note v-if="gln !== '0'" kind="info">{{ t('Glutamine valt in bewaard medium langzaam uiteen; voeg het vers toe als je het medium langer dan een paar weken bewaart.') }}</lk-note>
          <lk-steps :steps="steps"/>
          <lk-formula :html="tHtml('volume supplement = eindvolume × percentage · uit een n× voorraad: eindvolume / n')"/>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const MDBASE = ['DMEM', 'DMEM/F-12', 'RPMI-1640', 'MEM', 'IMDM', 'McCoy’s 5A', 'Ham’s F-12', 'Leibovitz L-15'];
const F = (x, d) => lkNumIn(fmt(x, d)), VL = mL => lkNumIn(vol(mL * 1000));

export default {
  name: 'Medium',
  data() {
    return {v: lkNumIn('500'), base: 'DMEM', fbs: lkNumIn('10'), ps: '1', gln: '2',
      extraName: '', extraFold: lkNumIn('100')};
  },
  mounted() {
    matRegister('medium', () => (this.err ? [] : [[this.base, VL(Math.max(0, this.baseML))], ...this.parts.map(p => [p.n, VL(p.mL)])]));
  },
  computed: {
    bases() { return MDBASE; },
    /* elk supplement als {naam, mL, waarvandaan}; mL gaat over het eindvolume */
    parts() {
      const t = this.t, V = num(this.v), out = [];
      const pct = num(this.fbs);
      if (pct > 0) out.push({n: t('Serum (FBS)'), mL: V * pct / 100, from: F(pct, 1) + '%'});
      const ps = num(this.ps);
      if (ps > 0) out.push({n: t('Penicilline-streptomycine'), mL: V * ps / 100,
        from: F(ps, 1) + '× ' + t('uit 100×')});
      const gln = num(this.gln);
      if (gln > 0) out.push({n: t('L-glutamine'), mL: V * gln / 200,
        from: F(gln, 0) + ' mM ' + t('uit 200 mM')});
      const fold = num(this.extraFold), nm = String(this.extraName).trim();
      if (nm && fold > 1) out.push({n: nm, mL: V / fold, from: F(fold, 0) + '×', own: true});
      return out;
    },
    suppl() { return this.parts.reduce((a, p) => a + p.mL, 0); },
    baseML() { return num(this.v) - this.suppl; },
    err() {
      const V = num(this.v);
      if (!(V > 0)) return this.t('Vul een eindvolume groter dan 0 in.');
      return '';
    },
    tooMuch() {
      if (this.baseML >= 0) return '';
      return this.t('De supplementen zijn samen meer dan het eindvolume: er blijft geen ruimte voor basismedium over.');
    },
    baseText() { return VL(Math.max(0, this.baseML)); },
    baseSub() { return this.base; },
    cols() {
      return [{h: this.t('Component')}, {h: this.t('Eindconcentratie')}, {h: this.t('Volume'), num: true}];
    },
    rows() {
      const t = this.t, V = num(this.v);
      const body = this.parts.map(p => [
        p.own ? esc(p.n) : p.n,
        p.from,
        VL(p.mL)
      ]);
      return [[this.base, t('rest'), VL(Math.max(0, this.baseML))], ...body,
        {cls: 'hl', cells: [t('Totaal'), '', VL(V)]}];
    },
    steps() {
      const t = this.t, p = this.parts;
      return [t('Zet het basismedium, het serum en de supplementen klaar en laat ze op kamertemperatuur komen.'),
        t('Doe in de flowkast ' + uv(VL(Math.max(0, this.baseML))) + ' ' + uv(this.base) + ' in een steriele fles.'),
        p.length ? t('Voeg de supplementen toe: '
          + uv(p.map(x => (x.own ? esc(x.n) : x.n) + ' ' + VL(x.mL)).join(', ')) + '.') : '',
        t('Meng rustig door zwenken, zet de datum en de samenstelling op de fles en bewaar bij 4 °C.')].filter(Boolean);
    }
  }
};
</script>
