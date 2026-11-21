<!-- ================= BLOEDVLEKPATRONEN =================
     Inslaghoek (Balthazard), convergentiepunt en hoogte van de oorsprong, ongewijzigd uit
     calc.bpa overgenomen. De tekening is nog steeds pShow() op een canvas en wordt na elke
     render opnieuw gemaakt, net als bij de Z'-factor; tekst op het canvas gaat al door
     trCanvas().

     De knoppenbalk onder de tekening staat hier zelf in de template, zonder data-picbar: die
     balk wordt bij het opstarten met innerHTML gevuld, en dat zou in een Vue-boom terugdraaien
     en Nederlands blijven. De knoppen werken via de gedeelde klikhandler op data-png enz.

     De id's bp-tbl, bp-tbl-add, bp-cv en bp-out blijven zoals ze waren. -->
<template>
  <div class="grid2">
    <div class="panel">
      <lk-etable table-id="bp-tbl" :cols="cols" v-model:rows="rows" add-id="bp-tbl-add"/>
      <div class="row" style="margin-top:8px">
        <button type="button" id="bp-tbl-add" @click="addRow">{{ t('+ Vlek') }}</button>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Meet breedte en lengte van de ellips zonder staart of satellietdruppels. Positie x, y in cm op het oppervlak; richting γ = looprichting van de druppel in graden (0° = positieve x-as, tegen de klok in). Voor convergentie zijn minstens twee vlekken met positie en richting nodig. Voorbeelddata zijn berekend voor een oorsprong op (60, 40) cm en 45 cm hoogte.') }}</p>
    </div>
    <div class="result">
      <canvas id="bp-cv" v-show="m && m.P.length"></canvas>
      <div class="pic-bar" v-show="m && m.P.length">
        <button type="button" data-png="bp">PNG</button><button type="button" data-svg="bp">SVG</button><button type="button" data-copy="bp">{{ t('Kopieer afbeelding') }}</button><button type="button" data-picprint="bp">{{ t('Afdrukken') }}</button>
      </div>
      <div id="bp-out">
        <lk-note v-if="!m" kind="info">{{ t('Vul per vlek breedte en lengte in.') }}</lk-note>
        <template v-else>
          <lk-note v-for="(w, i) in warnings" :key="i" kind="warn" :html="w"/>
          <template v-if="m.C">
            <lk-big :label="t('Geschatte hoogte van de oorsprong')" :value="hText" :sub="hSub"/>
            <lk-kv :rows="kvRows"/>
          </template>
          <div v-else class="lbl">{{ t('Inslaghoeken') }}</div>
          <lk-table :cols="outCols" :rows="outRows"/>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => lkNumIn(fmt(x, d));

export default {
  name: 'Bpa',
  data() {
    return {
      rows: [['1', '6,7', '10', '20', '10', '217'], ['2', '6,5', '10', '110', '25', '343'],
        ['3', '6,2', '10', '95', '85', '52'], ['4', '6,1', '10', '30', '90', '121'],
        ['5', '5,9', '10', '70', '100', '81']].map(r => r.map(v => lkNumIn(v)))
    };
  },
  computed: {
    cols() {
      const t = this.t;
      return [{h: t('Vlek'), t: 'txt', w: 60}, {h: t('Breedte (mm)'), t: 'num', w: 80},
        {h: t('Lengte (mm)'), t: 'num', w: 80}, {h: 'x (cm)', t: 'num', w: 64},
        {h: 'y (cm)', t: 'num', w: 64}, {h: 'γ (°)', t: 'num', w: 60}];
    },
    /* het rekenwerk van calc.bpa, ongewijzigd: de waarschuwingen blijven Nederlandse zinnen met
       ud() rond de naam van de vlek, en gaan pas bij het tonen door tHtml() */
    m() {
      const D = this.rows.map(r => ({n: r[0], w: num(r[1]), l: num(r[2]), x: num(r[3]), y: num(r[4]), g: num(r[5])}))
        .filter(s => s.w > 0 && s.l > 0);
      if (!D.length) return null;
      const warn = [];
      D.forEach(s => {
        if (s.w > s.l) warn.push(`Vlek ${ud(s.n)}: breedte groter dan lengte; verwissel ze.`);
        s.a = Math.asin(Math.min(1, s.w / s.l));
      });
      const P = D.filter(s => isFinite(s.x) && isFinite(s.y) && isFinite(s.g));
      let C = null;
      if (P.length >= 2) {
        let a11 = 0, a12 = 0, a22 = 0, b1 = 0, b2 = 0;
        P.forEach(s => {
          const t = s.g * Math.PI / 180, ux = Math.cos(t), uy = Math.sin(t),
            m11 = 1 - ux * ux, m12 = -ux * uy, m22 = 1 - uy * uy;
          a11 += m11; a12 += m12; a22 += m22; b1 += m11 * s.x + m12 * s.y; b2 += m12 * s.x + m22 * s.y;
        });
        const det = a11 * a22 - a12 * a12;
        if (Math.abs(det) > 1e-9) C = {x: (a22 * b1 - a12 * b2) / det, y: (a11 * b2 - a12 * b1) / det};
        else warn.push('De looprichtingen zijn (bijna) evenwijdig; er is geen convergentiepunt.');
      }
      if (C) P.forEach(s => {
        s.d = Math.hypot(s.x - C.x, s.y - C.y); s.h = s.d * Math.tan(s.a);
        const t = s.g * Math.PI / 180;
        if ((s.x - C.x) * Math.cos(t) + (s.y - C.y) * Math.sin(t) < 0)
          warn.push(`Vlek ${ud(s.n)}: de looprichting wijst naar het convergentiepunt toe; controleer γ.`);
      });
      const hs = P.filter(s => isFinite(s.h)).map(s => s.h);
      return {D, P, C, hs, warn};
    },
    warnings() { return this.m.warn.map(w => this.tHtml(w)); },
    hText() { return F(mean(this.m.hs), 0); },
    hSub() { const hs = this.m.hs; return 'cm' + (hs.length > 1 ? ' ± ' + F(sd(hs), 0) : ''); },
    kvRows() {
      const t = this.t, {C, P} = this.m;
      return [[t('Convergentiepunt (x, y)'), `${F(C.x, 1)}, ${F(C.y, 1)} cm`],
        [t('Vlekken gebruikt'), lkNumIn(P.length)]];
    },
    outCols() {
      return [{h: this.t('Vlek')}, {h: 'B/L', num: true}, {h: 'α (°)', num: true},
        {h: 'd (cm)', num: true}, {h: 'h (cm)', num: true}];
    },
    outRows() {
      return this.m.D.map(s => [esc(s.n), F(s.w / s.l, 3), F(s.a * 180 / Math.PI, 1), F(s.d, 1), F(s.h, 1)]);
    }
  },
  mounted() { this.draw(); },
  updated() { this.draw(); },
  methods: {
    addRow() { this.rows = [...this.rows, ['', '', '', '', '', '']]; },
    /* de tekening van calc.bpa: bovenaanzicht met de looprichtingen en het convergentiepunt */
    draw() {
      const cv = document.getElementById('bp-cv'); if (!cv || !this.m || !this.m.P.length) return;
      const {P, C} = this.m;
      const xs = [...P.map(s => s.x), ...(C ? [C.x] : [])], ys = [...P.map(s => s.y), ...(C ? [C.y] : [])],
        x0 = Math.min(...xs) - 15, x1 = Math.max(...xs) + 15, y0 = Math.min(...ys) - 15, y1 = Math.max(...ys) + 15,
        W = 460, sc = (W - 60) / Math.max(x1 - x0, y1 - y0, 1), H = Math.round((y1 - y0) * sc + 60);
      pShow(cv, W, H, (x) => {
        const X = v => 30 + (v - x0) * sc, Y = v => H - 30 - (v - y0) * sc;
        x.strokeStyle = PCOL.line; x.strokeRect(30, 30, W - 60, H - 60);
        P.forEach(s => {
          const t = s.g * Math.PI / 180;
          x.strokeStyle = 'rgba(194,65,12,.45)'; x.lineWidth = 1; x.setLineDash([4, 4]); x.beginPath();
          x.moveTo(X(s.x), Y(s.y));
          const back = C ? s.d + 10 : 40;
          x.lineTo(X(s.x - Math.cos(t) * back), Y(s.y - Math.sin(t) * back)); x.stroke(); x.setLineDash([]);
          x.save(); x.translate(X(s.x), Y(s.y)); x.rotate(-t); x.fillStyle = '#9b1c1c'; x.beginPath();
          x.ellipse(0, 0, 7, 7 * s.w / s.l, 0, 0, 7); x.fill(); x.restore();
          x.fillStyle = PCOL.ink; x.font = '11px ' + PFONT(); x.textAlign = 'left'; x.fillText(s.n, X(s.x) + 9, Y(s.y) - 8);
        });
        if (C) {
          x.strokeStyle = PCOL.acc; x.lineWidth = 2; x.beginPath(); x.arc(X(C.x), Y(C.y), 6, 0, 7); x.stroke();
          x.fillStyle = PCOL.acc; x.font = '600 11px ' + PFONT(); x.fillText('convergentie', X(C.x) + 9, Y(C.y) + 14);
        }
        x.fillStyle = PCOL.muted; x.font = '11px ' + PFONT(); x.textAlign = 'left'; x.fillText('bovenaanzicht (cm)', 30, 20);
      });
    }
  }
};
</script>
