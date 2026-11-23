<!-- ================= Z′-FACTOR =================
     De tekening blijft met de gewone tekencontext gemaakt: Vue beheert de velden en de
     uitkomst en tekent na elke render opnieuw. Een virtuele DOM heeft op een <canvas> geen
     nut, en tekst die op een canvas komt loopt al door trCanvas(), dus die wordt nog gewoon
     vertaald en door tests/i18n_collect.py gezien.

     De id's zp-pos, zp-neg, zp-s, zp-cv en zp-out blijven zoals ze waren. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <div class="f" style="grid-column:1/-1">
          <label for="zp-pos">{{ t('Positieve controle') }} <span class="example">{{ t('voorbeeld') }}</span></label>
          <textarea id="zp-pos" rows="3" v-model="pos"></textarea>
          <div class="row" style="margin-top:4px"><button type="button" id="zp-pwiz" @click="wiz">{{ t('Plaatlezer-bestand…') }}</button><span style="font-size:12.5px;color:var(--muted);align-self:center">{{ t('Kies in de plaat welke putjes positief, negatief of monster zijn.') }}</span></div>
        </div>
        <div class="f" style="grid-column:1/-1">
          <label for="zp-neg">{{ t('Negatieve controle') }}</label>
          <textarea id="zp-neg" rows="3" v-model="neg"></textarea>
        </div>
        <div class="f" style="grid-column:1/-1">
          <label for="zp-s">{{ t('Monsters (optioneel)') }}</label>
          <textarea id="zp-s" rows="2" v-model="smp"></textarea>
        </div>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Getallen scheiden met spaties of regels; plakken uit Excel mag. Gebruik minstens 8 en liefst 16 of meer controleputjes, verspreid over de plaat. Voorbeelddata zijn verzonnen.') }}</p>
    </div>
    <div class="result">
      <canvas id="zp-cv" v-show="ok"></canvas>
      <div id="zp-out">
        <lk-note v-if="!ok" kind="info">{{ t('Vul minstens twee waarden voor beide controles in.') }}</lk-note>
        <template v-else>
          <lk-big :label="t('Z′-factor')" :value="zText" :chip="grade.text" :chip-kind="grade.kind"/>
          <lk-kv :rows="rows"/>
          <lk-kv v-if="sampleRows.length" :rows="sampleRows"/>
          <lk-note v-if="few" kind="info">{{ t('Met minder dan 8 controles per groep is de Z′ onnauwkeurig.') }}</lk-note>
          <lk-note :kind="grade.kind">{{ verdict }}</lk-note>
          <div class="lbl" style="margin-top:10px">{{ t('Controleputjes') }}</div>
          <div v-for="g in plate" :key="g.n" style="display:flex;flex-wrap:wrap;gap:3px;align-items:center;margin:4px 0">
            <span style="font-size:12.5px;color:var(--muted);width:70px">{{ g.n }}</span>
            <span v-for="(w, i) in g.ws" :key="i" :title="w.title"
              :style="{width:'22px',height:'22px',borderRadius:'50%',border:'1px solid var(--line)',fontSize:'11px',lineHeight:'20px',textAlign:'center',background:'color-mix(in srgb, var(--accent) ' + w.pct + '%, var(--surface))',outline:w.out ? '2px solid var(--bad)' : 'none'}">{{ w.out ? '!' : '' }}</span>
          </div>
          <p style="font-size:12.5px;color:var(--muted);margin:4px 0 0">{{ t('Kleur = signaal (donker is hoog); rood omcirkeld met ! = meer dan 3σ van de overige putjes van de groep.') }}</p>
          <lk-formula :html="tHtml('Z′ = 1 − 3(σ<sub>p</sub> + σ<sub>n</sub>) / |μ<sub>p</sub> − μ<sub>n</sub>| · banden: μ ± 3σ')"/>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => lkNumIn(fmt(x, d)), G = (x, d) => lkNumIn(sig(x, d));

export default {
  name: 'Zprime',
  data() {
    return {
      pos: lkNumIn('1,842 1,905 1,778 1,861 1,920 1,812 1,889 1,850 1,795 1,874 1,903 1,836'),
      neg: lkNumIn('0,212 0,198 0,225 0,204 0,231 0,190 0,218 0,207 0,215 0,199 0,226 0,210'),
      smp: ''
    };
  },
  computed: {
    sets() { return {P: numsC(this.pos), N: numsC(this.neg), S: numsC(this.smp)}; },
    ok() { const {P, N} = this.sets; return P.length >= 2 && N.length >= 2; },
    few() { const {P, N} = this.sets; return P.length < 8 || N.length < 8; },
    stats() {
      const {P, N} = this.sets, mp = mean(P), sp = sd(P), mn = mean(N), sn = sd(N);
      const d = Math.abs(mp - mn);
      return {mp, sp, mn, sn, d, z: d > 0 ? 1 - 3 * (sp + sn) / d : -Infinity};
    },
    zText() { const z = this.stats.z; return isFinite(z) ? F(z, 3) : '–'; },
    grade() {
      const z = this.stats.z, t = this.t;
      if (z >= 1) return {kind: 'ok', text: t('ideaal')};
      if (z >= 0.5) return {kind: 'ok', text: t('uitstekend')};
      if (z >= 0) return {kind: 'warn', text: t('matig')};
      return {kind: 'bad', text: t('onbruikbaar')};
    },
    /* Zhang, Chung & Oldenburg 1999, J Biomol Screen 4:67: Z′ ≥ 0,5 uitstekend, 0 ≤ Z′ < 0,5 matig, Z′ < 0 onbruikbaar */
    verdict() {
      const z = this.stats.z, t = this.t;
      return z >= 0.5 ? t('Z′ ≥ 0,5: uitstekende test voor screening (Zhang e.a. 1999).')
        : z >= 0 ? t('Z′ tussen 0 en 0,5: matig; de test werkt, maar de controlebanden liggen dicht bij elkaar.')
          : t('Z′ < 0: onbruikbaar; de banden van positieve en negatieve controle overlappen.');
    },
    /* de controles als een rij putjes, gekleurd naar signaal; een waarde buiten μ ± 3σ van de eigen groep valt op */
    plate() {
      const {P, N} = this.sets, all = [...P, ...N], lo = Math.min(...all), hi = Math.max(...all), t = this.t;
      /* uitschieter: meer dan 3σ van het gemiddelde van de overige putjes (anders trekt hij zelf de σ omhoog) */
      const g = (n, a) => ({n, ws: a.map((v, i) => { const o = a.filter((_, j) => j !== i); return {pct: hi > lo ? Math.round(10 + 85 * (v - lo) / (hi - lo)) : 50, out: o.length > 1 && Math.abs(v - mean(o)) > 3 * sd(o), title: G(v, 4)}; })});
      return [g(t('Positief'), P), g(t('Negatief'), N)];
    },
    rows() {
      const t = this.t, {P, N} = this.sets, {mp, sp, mn, sn, d} = this.stats;
      return [[t('Positief: gemiddelde ± SD'), `${G(mp, 4)} ± ${G(sp, 3)} (${t('CV')} ${F(sp / Math.abs(mp) * 100, 1)}%, n = ${P.length})`],
        [t('Negatief: gemiddelde ± SD'), `${G(mn, 4)} ± ${G(sn, 3)} (${t('CV')} ${F(sn / Math.abs(mn) * 100, 1)}%, n = ${N.length})`],
        [t('Signaal / achtergrond'), mn !== 0 ? F(mp / mn, 2) : '–'],
        [t('Signaal / ruis'), sn > 0 ? F(d / sn, 1) : '–'],
        [t('Scheidingsband'), G(d - 3 * (sp + sn), 3)]];
    },
    sampleRows() {
      const {S} = this.sets; if (S.length <= 1) return [];
      const t = this.t, {mn, sn} = this.stats, ms = mean(S), ss = sd(S);
      const zs = Math.abs(ms - mn) > 0 ? 1 - 3 * (ss + sn) / Math.abs(ms - mn) : NaN;
      return [[t('Monsters: gemiddelde ± SD'), `${G(ms, 4)} ± ${G(ss, 3)} (n = ${S.length})`],
        [t('Z-factor monsters'), F(zs, 3)]];
    }
  },
  mounted() { this.draw(); },
  updated() { this.draw(); },
  methods: {
    wiz() { plateWizard('zprime'); },   /* S92 */
    /* de tekening wordt na elke render bijgewerkt; dat is goedkoop en houdt canvas en uitkomst
       bij elkaar zonder dat Vue iets van het canvas hoeft te weten */
    draw() {
      const cv = document.getElementById('zp-cv'); if (!cv || !this.ok) return;
      const {P, N, S} = this.sets, {mp, sp, mn, sn} = this.stats, all = [...P, ...N, ...S];
      const y0 = Math.min(...all, mn - 3 * sn, mp - 3 * sp),
        y1 = Math.max(...all, mp + 3 * sp, mn + 3 * sn);
      const pad = (y1 - y0) * 0.08, n = Math.max(P.length, N.length, S.length);
      const g = chart(cv, {
        xmin: 0, xmax: n + 1, ymin: y0 - pad, ymax: y1 + pad, xlabel: 'putje', ylabel: 'signaal',
        series: [{fn: () => mp, name: 'μ positief'}, {fn: () => mn, color: '--muted', name: 'μ negatief'},
          {pts: P.map((v, i) => [i + 1, v]), name: 'positief'},
          {pts: N.map((v, i) => [i + 1, v]), color: '--muted', name: 'negatief'},
          {pts: S.map((v, i) => [i + 1, v]), color: '--warn', name: 'monsters', hollow: true}]
      });
      const c = cv.getContext('2d'); c.fillStyle = 'rgba(120,140,170,.15)';
      [[mp, sp], [mn, sn]].forEach(([m, s]) => {
        const a = g.Y(m + 3 * s), b = g.Y(m - 3 * s);
        c.fillRect(g.X(0), a, g.X(n + 1) - g.X(0), b - a);
      });
    }
  }
};
</script>
