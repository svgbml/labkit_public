<!-- ================= INTERNE STANDAARD & STANDAARDADDITIE =================
     De berekening staat ongewijzigd in de computed m(): de regressie via isdFit() (blijft in
     tools/nt/76_istd.js), de onzekerheid van de interne standaard en de standaardadditie met
     x_E = a/b. Alleen de weergave is opnieuw opgebouwd met de gedeelde componenten.

     De drie tabellen zijn <lk-etable>, met dezelfde kolommen en beginrijen als de ET()-versie.
     Ze blijven alle drie in de DOM (v-show) zodat TBLDEF en tblRestore() ze altijd vinden.
     De id's isd-mode, isd-unit, isd-df, isd-tbl(-add), isd-unk(-add), isd-sa(-add), isd-cv en
     isd-out blijven zoals ze waren; de uitkomst staat in #isd-out, het canvas ernaast. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <div class="f">
          <label for="isd-mode">{{ t('Methode') }}</label>
          <select id="isd-mode" v-model="mode">
            <option value="is">{{ t('interne standaard') }}</option>
            <option value="sa">{{ t('standaardadditie') }}</option>
          </select>
        </div>
        <div class="f">
          <label for="isd-unit">{{ t('Concentratie-eenheid') }}</label>
          <input id="isd-unit" class="txt" v-model="unit">
        </div>
        <div class="f" data-isd="sa" v-show="mode === 'sa'">
          <label for="isd-df">{{ t('Verdunningsfactor monster') }}</label>
          <input id="isd-df" inputmode="decimal" v-model="df">
        </div>
      </div>
      <div data-isd="is" v-show="mode === 'is'">
        <h3 style="margin:14px 0 6px;font-size:14px">{{ t('Kalibratiestandaarden') }}</h3>
        <lk-etable table-id="isd-tbl" :cols="colsStd" v-model:rows="std" add-id="isd-tbl-add"/>
        <div class="row" style="margin-top:8px"><button type="button" id="isd-tbl-add" @click="add('std')">{{ t('+ Standaard') }}</button></div>
        <h3 style="margin:14px 0 6px;font-size:14px">{{ t('Monsters') }}</h3>
        <lk-etable table-id="isd-unk" :cols="colsUnk" v-model:rows="unk" add-id="isd-unk-add"/>
        <div class="row" style="margin-top:8px"><button type="button" id="isd-unk-add" @click="add('unk')">{{ t('+ Monster') }}</button></div>
      </div>
      <div data-isd="sa" v-show="mode === 'sa'">
        <h3 style="margin:14px 0 6px;font-size:14px">{{ t('Toevoegingen') }}</h3>
        <lk-etable table-id="isd-sa" :cols="colsSa" v-model:rows="sa" add-id="isd-sa-add"/>
        <div class="row" style="margin-top:8px"><button type="button" id="isd-sa-add" @click="add('sa')">{{ t('+ Toevoeging') }}</button></div>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Interne standaard: dezelfde hoeveelheid IS in elke standaard en elk monster. Standaardadditie: de toegevoegde concentratie in de meetoplossing, met 0 voor het monster zonder toevoeging; de verdunningsfactor rekent terug naar het oorspronkelijke monster. Voorbeelddata zijn verzonnen.') }}</p>
    </div>
    <div class="result">
      <canvas id="isd-cv" v-show="m.ok"></canvas>
      <div id="isd-out">
        <lk-note v-if="!m.ok" kind="info">{{ m.err }}</lk-note>
        <template v-else-if="m.mode === 'is'">
          <lk-big v-if="m.U.length" :label="m.bigLabel" :html="m.bigHtml"/>
          <lk-kv :rows="m.kv"/>
          <lk-table :cols="m.uCols" :rows="m.uRows"/>
          <lk-note v-if="m.outside" kind="warn">{{ t('Een monster valt buiten het kalibratiebereik; verdun het of breid de reeks uit.') }}</lk-note>
          <lk-formula :html="tHtml('c = (y&lt;sub&gt;0&lt;/sub&gt; − a)/b × verdunning · y = A&lt;sub&gt;analyt&lt;/sub&gt;/A&lt;sub&gt;IS&lt;/sub&gt;')"/>
        </template>
        <template v-else>
          <lk-big :label="t('Concentratie in het monster')" :html="m.bigHtml"/>
          <lk-kv :rows="m.kv"/>
          <lk-note v-if="m.xe <= 0" kind="warn">{{ t('Het snijpunt ligt niet links van de oorsprong; controleer de data (het monster moet signaal geven).') }}</lk-note>
          <lk-formula :html="tHtml('x&lt;sub&gt;E&lt;/sub&gt; = a/b · c&lt;sub&gt;monster&lt;/sub&gt; = x&lt;sub&gt;E&lt;/sub&gt; × verdunning · 95%-interval = t·s&lt;sub&gt;xE&lt;/sub&gt;')"/>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

/* getallen in de taal van de gebruiker: de DOM-vertaallaag komt niet in een Vue-boom */
const F = (x, d) => lkNumIn(fmt(x, d)), G = (x, d) => lkNumIn(sig(x, d));
const N = v => lkNumIn(String(v));

export default {
  name: 'Istd',
  data() {
    return {
      mode: 'is', unit: 'mg/L', df: '5',
      std: [[1, 10450, 50210], [2, 20980, 49870], [5, 52300, 50650], [10, 103900, 49980], [20, 209400, 50320]].map(r => r.map(N)),
      unk: [['Monster 1', 38120, 50010, 1], ['Monster 2', 77450, 49650, 2]].map(r => r.map((v, i) => i ? N(v) : v)),
      sa: [[0, '0,215'], [2, '0,402'], [4, '0,588'], [6, '0,771'], [8, '0,960']].map(r => r.map(N))
    };
  },
  computed: {
    colsStd() {
      const t = this.t;
      return [{h: t('Concentratie'), t: 'num', w: 90}, {h: t('Oppervlak analyt'), t: 'num', w: 100}, {h: t('Oppervlak IS'), t: 'num', w: 100}];
    },
    colsUnk() {
      const t = this.t;
      return [{h: t('Monster'), t: 'txt', w: 110}, {h: t('Oppervlak analyt'), t: 'num', w: 100},
        {h: t('Oppervlak IS'), t: 'num', w: 100}, {h: t('Verdunning'), t: 'num', w: 70}];
    },
    colsSa() {
      const t = this.t;
      return [{h: t('Toegevoegd'), t: 'num', w: 90}, {h: t('Signaal'), t: 'num', w: 100}];
    },
    /* alle maten van de uitkomst: één keer berekend, de rest van de component leest hieruit */
    m() {
      const t = this.t, mode = this.mode, un = this.unit, fail = e => ({ok: false, err: e});
      const rows = r => r.map(x => x.slice());
      if (mode === 'is') {
        const S = rows(this.std).map(r => [num(r[0]), num(r[1]) / num(r[2])]).filter(p => isFinite(p[0]) && isFinite(p[1]));
        if (S.length < 3) return fail(t('Vul minstens drie standaarden met concentratie en beide oppervlakken in.'));
        const F_ = isdFit(S.map(p => p[0]), S.map(p => p[1])), tt = tinv(0.975, F_.n - 2);
        const U = rows(this.unk).map(r => { const y0 = num(r[1]) / num(r[2]), df = num(r[3]) || 1; if (!isFinite(y0)) return null; const x0 = (y0 - F_.a) / F_.b, s = Math.abs(F_.syx / F_.b) * Math.sqrt(1 + 1 / F_.n + (y0 - F_.my) ** 2 / (F_.b * F_.b * F_.sxx)); return {n: r[0] || '?', y0, x0, df, c: x0 * df, s: s * df, out: x0 < Math.min(...S.map(p => p[0])) || x0 > Math.max(...S.map(p => p[0]))}; }).filter(Boolean);
        const xs = S.map(p => p[0]), all = [...S.map(p => p[1]), ...U.map(u => u.y0)];
        const line = t('verhouding = ' + G(F_.b, 4) + ' · c ' + (F_.a < 0 ? '−' : '+') + ' ' + G(Math.abs(F_.a), 3));
        return {ok: true, mode, S, U, F: F_, xs, all, t: tt, un,
          bigLabel: U.length ? String(U[0].n) : '',
          bigHtml: U.length ? `${G(U[0].c, 4)} <small>± ${G(tt * U[0].s, 2)} ${esc(un)}</small>` : '',
          kv: [[t('Kalibratielijn'), line], ['R²', F(F_.r2, 5)], [this.tHtml('s&lt;sub&gt;y/x&lt;/sub&gt;'), G(F_.syx, 3)]],
          uCols: [{h: t('Monster')}, {h: t('Verhouding'), num: true}, {h: t('c gemeten'), num: true},
            {h: t('× verdunning'), num: true}, {h: t('95%-interval (±)'), num: true}],
          uRows: U.map(u => [ud(u.n), G(u.y0, 4), G(u.x0, 4), G(u.c, 4), G(tt * u.s, 2)]),
          outside: U.some(u => u.out)};
      }
      const S = rows(this.sa).map(r => [num(r[0]), num(r[1])]).filter(p => isFinite(p[0]) && isFinite(p[1])), df = num(this.df) || 1;
      if (S.length < 3) return fail(t('Vul minstens drie punten (waarvan één zonder toevoeging) in.'));
      const F_ = isdFit(S.map(p => p[0]), S.map(p => p[1])), xe = F_.a / F_.b, s = Math.abs(F_.syx / F_.b) * Math.sqrt(1 / F_.n + F_.my * F_.my / (F_.b * F_.b * F_.sxx)), tt = tinv(0.975, F_.n - 2);
      const u_ = esc(un);
      return {ok: true, mode, S, F: F_, xe, s, df, t: tt, un,
        bigHtml: `${G(xe * df, 4)} <small>± ${G(tt * s * df, 2)} ${u_}</small>`,
        kv: [[t('In de meetoplossing'), `${G(xe, 4)} ± ${G(tt * s, 2)} ${u_}`],
          [t('Lijn'), this.tHtml('signaal = ' + G(F_.b, 4) + ' · c&lt;sub&gt;toegevoegd&lt;/sub&gt; + ' + G(F_.a, 4))],
          ['R²', F(F_.r2, 5)], [this.tHtml('s&lt;sub&gt;xE&lt;/sub&gt;'), G(s, 3)]]};
    }
  },
  mounted() { this.draw(); },
  updated() { this.draw(); },
  methods: {
    /* de oude ET()-knop zette een lege rij onderaan; de breedte komt uit de kolommen, zodat
       het ook werkt als alle rijen weg zijn */
    add(k) { const c = {std: this.colsStd, unk: this.colsUnk, sa: this.colsSa}[k]; this[k] = [...this[k], c.map(() => '')]; },
    draw() {
      const cv = document.getElementById('isd-cv'), m = this.m; if (!cv || !m.ok) return;
      const F_ = m.F, un = m.un;
      if (m.mode === 'is') {
        const {S, U, xs, all} = m;
        chart(cv, {xmin: 0, xmax: Math.max(...xs, ...U.map(u => u.x0)) * 1.08, ymin: 0, ymax: Math.max(...all) * 1.1,
          xlabel: `concentratie (${uv(un)})`, ylabel: 'A analyt / A IS',
          series: [{fn: x => F_.a + F_.b * x, name: 'fit'}, {pts: S, name: 'standaarden'}, {pts: U.map(u => [u.x0, u.y0]), color: '--warn', name: 'monsters'}]});
      } else {
        const {S, xe} = m, xmax = Math.max(...S.map(p => p[0]));
        chart(cv, {xmin: Math.min(-xe * 1.2, 0), xmax: xmax * 1.08, ymin: 0, ymax: Math.max(...S.map(p => p[1])) * 1.1,
          xlabel: `toegevoegd (${uv(un)})`, ylabel: 'signaal',
          series: [{fn: x => F_.a + F_.b * x, name: 'fit', x0: -xe}, {pts: S, name: 'metingen'}, {pts: [[-xe, 0]], color: '--warn', name: 'x-snijpunt'}]});
      }
    }
  }
};
</script>
