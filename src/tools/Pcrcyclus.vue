<!-- ================= PCR-CYCLUS =================
     Het rekenwerk (NN, tmNN, primerInfo, mmss2, drawProfile) blijft onveranderd in
     web/index.html staan; alleen primerInfo() kreeg een tweede parameter met de zoutinstellingen,
     zodat hij niet meer in de DOM hoeft te lezen (anders zou een computed een veld lezen dat
     Vue nog niet heeft bijgewerkt). Deze component beheert de velden en de drie uitkomsten.

     De tekening van het programma blijft met de gewone tekencontext gemaakt (drawProfile) en
     wordt na elke render opnieuw getekend, zoals bij Bufcap en Z′. De id's y-f, y-r, y-na,
     y-mg, y-dntp, y-pc, y-out, y-type, y-bp, y-n, y-dt, y-ds, y-ta, y-as, y-et, y-es, y-ramp,
     y-prog, y-cv, y-copy, y-copied, y-n0, y-eff, y-cyc, y-goal, y-q0, y-qf, y-cq en y-amp
     blijven zoals ze waren. De annealingtemperatuur staat op window.__pcrcVm.taAuto voor het
     programma-gereedschap (Gradiënt-PCR/PCR-programma, knop #pg-from). -->
<template>
  <div class="stack">
    <div class="grid2">
      <div class="panel">
        <h3 v-html="tHtml('Primers <span class=&quot;example&quot;>voorbeeld</span>')"></h3>
        <lk-field v-model="fw" :label="t('Forward primer (5′→3′)')" for-id="y-f" cls="mono" inputmode="text"/>
        <lk-field v-model="rv" :label="t('Reverse primer (5′→3′)')" for-id="y-r" cls="mono" inputmode="text" style="margin-top:10px"/>
        <div class="fields" style="margin-top:12px">
          <lk-field v-model="na" :label="t('Na⁺/K⁺')" for-id="y-na" unit="mM" data-expert=""/>
          <lk-field v-model="mg" :label="t('Mg²⁺')" for-id="y-mg" unit="mM" data-expert=""/>
          <lk-field v-model="dntp" :label="t('dNTP totaal')" for-id="y-dntp" unit="mM" data-expert=""/>
          <lk-field v-model="pc" :label="t('Primer')" for-id="y-pc" unit="µM" data-expert=""/>
        </div>
        <p style="font-size:13px;color:var(--muted);margin:10px 0 0" v-html="noteTm"></p>
      </div>
      <div class="result" id="y-out">
        <template v-if="m.F && m.R">
          <lk-big :label="t('Startwaarde annealing')" :value="F(m.ta, 1)" sub="°C"/>
          <lk-table :cols="primerCols" :rows="primerRows"/>
          <lk-kv :rows="primerKv"/>
          <lk-note v-for="(x, i) in primerNotes" :key="i" :kind="x[0]" :html="x[1]"/>
          <lk-formula :html="tHtml('T<sub>a</sub> = laagste T<sub>m</sub> − 5 °C')"/>
        </template>
        <lk-note v-else kind="info">{{ t('Vul beide primersequenties in.') }}</lk-note>
      </div>
    </div>
    <div class="grid2">
      <div class="panel">
        <h3>{{ t('Programma') }}</h3>
        <div class="fields">
          <div class="f"><label for="y-type">{{ t('Type') }}</label>
            <select id="y-type" v-model="type" style="width:100%">
              <option value="std">{{ t('Gezuiverd template') }}</option>
              <option value="col">{{ t('Kolonie-PCR') }}</option>
            </select></div>
          <lk-field v-model="bp" :label="t('Ampliconlengte')" for-id="y-bp" unit="bp"/>
          <lk-field v-model="n" :label="t('Cycli')" for-id="y-n" inputmode="numeric"/>
          <lk-field v-model="dt" :label="t('Denaturatie')" for-id="y-dt" unit="°C"/>
          <lk-field v-model="ds" :label="t('Tijd denaturatie')" for-id="y-ds" unit="s" inputmode="numeric"/>
          <div class="f"><label for="y-ta">{{ t('Annealing') }}</label>
            <div class="inu"><input id="y-ta" v-model="ta" inputmode="decimal" :placeholder="taPlaceholder"><span class="u">°C</span></div></div>
          <lk-field v-model="an" :label="t('Tijd annealing')" for-id="y-as" unit="s" inputmode="numeric"/>
          <lk-field v-model="et" :label="t('Extensie')" for-id="y-et" unit="°C"/>
          <div class="f"><label for="y-es">{{ t('Tijd extensie') }}</label>
            <div class="inu"><input id="y-es" v-model="es" inputmode="numeric" :placeholder="t('auto')"><span class="u">s</span></div></div>
          <lk-field v-model="ramp" :label="t('Opwarm-/afkoelsnelheid')" for-id="y-ramp" unit="°C/s" data-expert=""/>
        </div>
        <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Laat annealing en extensietijd leeg voor een automatische waarde. De opwarmsnelheid verschilt per cycler; zie de handleiding voor de echte waarde.') }}</p>
      </div>
      <div class="result">
        <div id="y-prog">
          <lk-big :label="t('Totale looptijd (schatting)')" :value="mm(prog.total)"/>
          <lk-table :cols="progCols" :rows="progRows"/>
          <lk-note v-for="(x, i) in progNotes" :key="i" :kind="x[0]">{{ x[1] }}</lk-note>
          <div class="row" style="margin-top:8px">
            <button type="button" id="y-copy" @click="copy">{{ t('Kopieer programma') }}</button>
            <span id="y-copied" style="font-size:13px;color:var(--muted)">{{ copied }}</span>
          </div>
        </div>
        <canvas id="y-cv" style="margin-top:8px"></canvas>
      </div>
    </div>
    <div class="grid2">
      <div class="panel">
        <h3>{{ t('Amplificatie') }}</h3>
        <div class="fields">
          <lk-field v-model="n0" :label="t('Startkopieën')" for-id="y-n0"/>
          <lk-field v-model="eff" :label="t('Efficiëntie')" for-id="y-eff" unit="%"/>
          <lk-field v-model="cyc" :label="t('Na cycli')" for-id="y-cyc" inputmode="numeric"/>
          <lk-field v-model="goal" :label="t('Doel (kopieën)')" for-id="y-goal"/>
        </div>
        <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('300 kopieën ≈ 1 ng humaan genomisch DNA per autosomaal locus (zie DNA-kwantificatie).') }}</p>
        <h3 style="margin-top:18px" v-html="tHtml('qPCR-efficiëntie uit verdunningsreeks <span class=&quot;example&quot;>voorbeeld</span>')"></h3>
        <div class="fields">
          <lk-field v-model="q0" :label="t('Hoogste standaard (kopieën)')" for-id="y-q0"/>
          <lk-field v-model="qf" :label="t('Verdunningsfactor')" for-id="y-qf"/>
        </div>
        <div class="f" style="margin-top:10px"><label for="y-cq">{{ t('Cq-waarden, hoogste standaard eerst (per regel of met spaties)') }}</label>
          <textarea id="y-cq" rows="2" v-model="cq"></textarea></div>
      </div>
      <div class="result" id="y-amp">
        <template v-if="amp">
          <lk-big :label="t('Theoretisch na ' + F(amp.c, 0) + ' cycli')" :html="S(amp.Nn, 3)" :sub="t('kopieën')"/>
          <lk-kv :rows="ampRows"/>
          <lk-note kind="info">{{ t('In de praktijk vlakt de reactie af (plateau) als primers, dNTP\'s of polymerase opraken; de formule geldt alleen in de exponentiële fase.') }}</lk-note>
        </template>
        <template v-if="qpcr">
          <lk-big :label="t('qPCR-efficiëntie')" top="14px" :value="F(qpcr.eff, 1)" sub="%"
            :chip="t(qpcr.ok ? 'binnen 90–110%' : 'buiten 90–110%')" :chip-kind="qpcr.ok ? 'ok' : 'warn'"/>
          <lk-kv :rows="qpcrRows"/>
          <lk-note v-if="qpcr.eff > 110" kind="warn" :html="tHtml('&amp;gt; 110% wijst vaak op remming in de geconcentreerde standaarden, primer-dimeren of pipetteerfouten in de reeks.')"/>
          <lk-note v-else-if="qpcr.eff < 90" kind="warn" :html="tHtml('&amp;lt; 90%: controleer primerontwerp, remmers en pipetteerwerk.')"/>
          <lk-formula :html="tHtml('E = 10<sup>−1/helling</sup> − 1')"/>
        </template>
        <lk-note v-if="!amp && !qpcr" kind="info">{{ t('Vul startkopieën en cycli in.') }}</lk-note>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => lkNumIn(fmt(x, d)), S = (x, d) => lkNumIn(sci(x, d));
/* een looptijd: met "min" erin is het een vertaalsleutel ("{#}:{#} min"), anders alleen een getal */
const mmLoc = s => { const r = mmss2(s); return /min/.test(r) ? trPlain(r) : lkNumIn(r); };
const chip = (ok, html) => `<span class="chip ${ok ? 'ok' : 'warn'}">${html}</span>`;

export default {
  name: 'Pcrcyclus',
  data() {
    return {fw: 'AGCTGACCTGAAGGCTCTGAAG', rv: 'TCGTCGTACTTGACCAGGCTAT',
      na: lkNumIn('50'), mg: lkNumIn('1,5'), dntp: lkNumIn('0,8'), pc: lkNumIn('0,2'),
      type: 'std', bp: '650', n: '30', dt: '95', ds: '30', ta: '', an: '30', et: '68', es: '',
      ramp: '3', n0: '300', eff: '95', cyc: '30', goal: '1e10', q0: '1e6', qf: '10',
      cq: lkNumIn('15,12 18,41 21,80 25,08 28,51'), copied: ''};
  },
  computed: {
    /* de primers met hun Tm, en de annealingtemperatuur die daaruit volgt */
    m() {
      const ion = {na: num(this.na) || 0, mg: num(this.mg) || 0, dntp: num(this.dntp) || 0, pc: num(this.pc) || 0.2};
      const F1 = primerInfo(this.fw, ion), R1 = primerInfo(this.rv, ion);
      return {F: F1, R: R1, ta: F1 && R1 ? Math.min(F1.tm, R1.tm) - 5 : NaN};
    },
    /* voor het programma-gereedschap (#pg-from): de laatst berekende annealingtemperatuur */
    taAuto() { return this.m.ta; },
    taPlaceholder() { return this.m.F && this.m.R ? F(this.m.ta, 1) + ' (auto)' : this.t('auto'); },
    noteTm() {
      return this.tHtml('T<sub>m</sub> volgens nearest-neighbor (SantaLucia 1998) met correctie voor zout, Mg²⁺ en dNTP\'s, zoals moderne primerprogramma\'s. dNTP totaal = 4 × de concentratie per dNTP (200 µM elk = 0,8 mM). De eenvoudige GC-formule staat ter vergelijking ernaast.');
    },
    primerCols() {
      return [{h: ''}, {h: this.t('Lengte'), num: true}, {h: this.t('GC'), num: true},
        {h: this.tHtml('T<sub>m</sub>'), num: true}, {h: this.t('GC-formule'), num: true}];
    },
    primerRows() {
      const t = this.t;
      return [[t('Forward'), this.m.F], [t('Reverse'), this.m.R]].map(([name, p]) => [name,
        chip(p.N >= 18 && p.N <= 40, t(p.N + ' nt')), chip(p.gcp >= 40 && p.gcp <= 60, F(p.gcp, 0) + '%'),
        chip(p.tm > 45, F(p.tm, 1) + ' °C'), `<span style="color:var(--muted)">${F(p.basic, 1)} °C</span>`]);
    },
    dTm() { return Math.abs(this.m.F.tm - this.m.R.tm); },
    primerKv() {
      return [[this.tHtml('ΔT<sub>m</sub>'), chip(this.dTm <= 5, F(this.dTm, 1) + ' °C')],
        [this.t('Formule'), this.t(this.m.F.rule)]];
    },
    primerNotes() {
      const {F: f, R: r, ta} = this.m, d = this.dTm, th = this.tHtml, t = this.t, out = [];
      if (d > 5) out.push(['warn', th('T<sub>m</sub> van de primers verschilt meer dan 5 °C.')]);
      if (f.tm <= 45 || r.tm <= 45) out.push(['warn', th('Een T<sub>m</sub> onder 45 °C is laag voor PCR.')]);
      [f, r].forEach((p, i) => {
        const nm = i ? 'Reverse' : 'Forward';
        if (p.gcp < 40 || p.gcp > 60) out.push(['warn', t(nm + ': GC-gehalte buiten 40–60%.')]);
        if (p.other) out.push(['info', t(nm + ': ' + p.other + ' niet-ACGT-teken(s) genegeerd.')]);
      });
      if (ta >= 65) out.push(['info', t('Annealing ≥ 65 °C: een 2-staps PCR (annealing en extensie samen) is mogelijk.')]);
      return out;
    },
    /* het programma: stappen, looptijd en waarschuwingen */
    prog() {
      const col = this.type === 'col', bp = num(this.bp), n = Math.round(num(this.n) || 30);
      const dT = num(this.dt) || 95, dS = num(this.ds) || 30, taIn = num(this.ta);
      const ta = this.m.ta;
      const Ta = isFinite(taIn) ? taIn : (isFinite(ta) ? Math.round(ta * 2) / 2 : 55), aS = num(this.an) || 30;
      const eT = num(this.et) || 68, esIn = num(this.es);
      const eS = isFinite(esIn) ? esIn : (isFinite(bp) ? (bp < 1000 ? 60 : Math.ceil(bp / 1000 * 60 / 15) * 15) : 60);
      const ramp = num(this.ramp) || 3;
      const iS = col ? 300 : 30, fS = 300;
      const steps = [['Initiële denaturatie', dT, iS, false], ['Denaturatie', dT, dS, true], ['Annealing', Ta, aS, true],
        ['Extensie', eT, eS, true], ['Eindextensie', eT, fS, false], ['Bewaren', 4, Infinity, false]];
      const rampT = (a, b) => Math.abs(a - b) / ramp;
      const cyc = dS + aS + eS + rampT(dT, Ta) + rampT(Ta, eT) + rampT(eT, dT);
      const total = rampT(25, dT) + iS + n * cyc - rampT(eT, dT) + fS + rampT(eT, 4);
      return {n, aS, steps, total};
    },
    progCols() {
      return [{h: this.t('Stap')}, {h: '°C', num: true}, {h: this.t('Tijd'), num: true}, {h: ''}];
    },
    progRows() {
      const {steps, n} = this.prog;
      return steps.map(s => ({cells: [this.t(s[0]), F(s[1], 1), s[2] === Infinity ? '∞' : mmLoc(s[2]),
        s[0] === 'Denaturatie' ? `<span class="chip info">${this.t(n + '×')}</span>` : ''], cls: s[3] ? 'hl' : null}));
    },
    progNotes() {
      const {n, aS} = this.prog, t = this.t, out = [];
      if (n < 25 || n > 35) out.push(['info', t('25–35 cycli is gebruikelijk; tot 45 alleen voor zeer weinig template.')]);
      if (aS < 15 || aS > 60) out.push(['warn', t('Annealingtijd buiten 15–60 s.')]);
      return out;
    },
    /* de tabel die "Kopieer programma" op het klembord zet (Nederlands; i18nTSV vertaalt hem) */
    progText() {
      const {steps, n} = this.prog;
      return ['Stap\tTemperatuur (°C)\tTijd\tCycli', ...steps.map(s =>
        `${s[0]}\t${s[1]}\t${s[2] === Infinity ? '∞' : mmss2(s[2])}\t${s[3] ? n : 1}`)].join('\n');
    },
    /* amplificatie: theoretische kopieën na c cycli */
    amp() {
      const N0 = num(this.n0), E = (num(this.eff) || 100) / 100, c = num(this.cyc), goal = num(this.goal);
      if (!(isFinite(N0) && N0 > 0 && isFinite(c))) return null;
      return {N0, E, c, goal, Nn: N0 * (1 + E) ** c};
    },
    ampRows() {
      const {N0, E, c, goal} = this.amp, t = this.t;
      return [[t('Vermenigvuldiging'), S((1 + E) ** c, 3) + '×'], [t('Per cyclus'), F(1 + E, 3) + '×'],
        ...(isFinite(goal) && goal > N0 ? [[this.tHtml('Cycli tot ' + sci(goal, 2)), F(Math.log(goal / N0) / Math.log(1 + E), 1)]] : [])];
    },
    /* qPCR-efficiëntie uit de verdunningsreeks */
    qpcr() {
      const cq = nums(this.cq), q0 = num(this.q0), qf = num(this.qf);
      if (!(cq.length >= 3 && q0 > 0 && qf > 1)) return null;
      const lq = cq.map((_, i) => Math.log10(q0 / qf ** i)), r = linreg(lq, cq);
      const eff = (10 ** (-1 / r.b) - 1) * 100;
      return {r, eff, ok: eff >= 90 && eff <= 110};
    },
    qpcrRows() {
      const {r} = this.qpcr, t = this.t;
      return [[t('Helling'), F(r.b, 3)], [t('Intercept'), F(r.a, 2)],
        [t('R²'), chip(r.r2 >= 0.98, F(r.r2, 4))], [t('Amplificatiefactor'), F(10 ** (-1 / r.b), 3)]];
    },
  },
  watch: {
    progText() { this.copied = ''; }
  },
  mounted() { window.__pcrcVm = this; this.draw(); },
  updated() { this.draw(); },
  methods: {
    F, S, mm: mmLoc,
    async copy() {
      try { await navigator.clipboard.writeText(i18nTSV(this.progText)); this.copied = this.t('Gekopieerd.'); }
      catch (e) { this.copied = this.t('Kopiëren geblokkeerd.'); }
    },
    draw() {
      const cv = document.getElementById('y-cv'); if (!cv) return;
      drawProfile(cv, this.prog.steps, this.prog.n);
    }
  }
};
</script>
