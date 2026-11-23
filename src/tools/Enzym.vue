<!-- ================= ENZYMKINETIEK =================
     Het rekenwerk is niet herschreven: mmFit() (Lineweaver-Burk, Hanes-Woolf, Eadie-Hofstee en
     de niet-lineaire Michaelis-Menten-fit met lmfit) blijft in web/index.html staan en wordt
     hier aangeroepen. De activiteitsformule en de bepaling van het remmingstype stonden los in
     calc.enzym() en zijn letterlijk meegenomen in `act` en `inh`.

     De tekeningen blijven met chart() gemaakt; na elke render roept draw() die opnieuw aan, net
     als bij Titratiecurve. De id's e-dat, e-dab, e-epsp, e-eps, e-l, e-vt, e-ve, e-df, e-prot,
     e-out, k-su, k-vu, k-e, k-i, k-iu, k-tbl, k-add, k-clearI, k-cv en k-res blijven zoals ze
     waren; de bewerkbare tabel is een <lk-etable>. -->
<template>
  <div class="stack">
    <div class="grid2">
      <div class="panel">
        <h3 v-html="h3a"></h3>
        <div class="fields">
          <lk-field v-model="dat" :label="t('ΔA/min test')" for-id="e-dat"/>
          <lk-field v-model="dab" :label="t('ΔA/min blanco')" for-id="e-dab"/>
          <div class="f">
            <label for="e-epsp">{{ t('Chromofoor') }}</label>
            <select id="e-epsp" style="width:100%" v-model="epsp" @change="onEpsp">
              <option value="6.22">{{ t('NADH / NADPH, 340 nm') }}</option>
              <option value="">{{ t('Eigen waarde') }}</option>
            </select>
          </div>
          <lk-field v-model="eps" label="ε" for-id="e-eps" unit="mM⁻¹cm⁻¹"/>
          <lk-field data-expert="" v-model="l" :label="t('Weglengte')" for-id="e-l" unit="cm"/>
          <lk-field v-model="vt" :label="t('Totaalvolume cuvet')" for-id="e-vt" unit="mL"/>
          <lk-field v-model="ve" :label="t('Volume enzym')" for-id="e-ve" unit="mL"/>
          <lk-field data-expert="" v-model="df" :label="t('Verdunningsfactor enzym')" for-id="e-df"/>
          <lk-field v-model="prot" :label="t('Eiwitconc. enzymoplossing')" for-id="e-prot" unit="mg/mL"/>
        </div>
        <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Gebruik de helling uit het lineaire begin van de meting. Afname of toename maakt niet uit; de waarde wordt absoluut genomen. Eiwitconcentratie kun je uit de Standaardcurve halen.') }}</p>
      </div>
      <div class="result" id="e-out">
        <lk-note v-if="!act" kind="info">{{ t('Vul ΔA/min, ε en de volumes in.') }}</lk-note>
        <template v-else>
          <lk-big :label="t('Volumetrische activiteit')" :value="F(act.uml, 3, true)" sub="U/mL"/>
          <template v-if="isFinite(act.prot) && act.prot > 0">
            <div class="lbl">{{ t('Specifieke activiteit') }}</div>
            <div class="big" style="font-size:24px">{{ F(act.uml / act.prot, 3, true) }} <small>{{ t('U/mg eiwit') }}</small></div>
          </template>
          <lk-kv :rows="actRows"/>
          <lk-note v-if="act.dA <= 0" kind="bad">{{ t('De blanco is groter dan of gelijk aan de test: geen netto activiteit.') }}</lk-note>
          <lk-note v-if="act.dt > 0.2" kind="warn">{{ t('Hoge helling: controleer of de meting lineair bleef; verdun het enzym zo nodig.') }}</lk-note>
          <lk-formula :html="actFormula"/>
        </template>
      </div>
    </div>
    <div class="grid2">
      <div class="panel">
        <h3 v-html="h3b"></h3>
        <div class="fields">
          <div class="f">
            <label for="k-su">{{ t('Eenheid [S]') }}</label>
            <select id="k-su" style="width:100%" v-model="su">
              <option>mM</option><option>µM</option>
            </select>
          </div>
          <div class="f">
            <label for="k-vu">{{ t('Eenheid v') }}</label>
            <select id="k-vu" style="width:100%" v-model="vu">
              <option>µM/min</option><option>mM/min</option><option>µmol/min</option><option>U/mg</option><option>ΔA/min</option>
            </select>
          </div>
          <lk-field v-model="E" :label-html="tHtml('[E] totaal (voor k<sub>cat</sub>)')" for-id="k-e" unit="µM"/>
          <div class="f">
            <label for="k-i">{{ t('[I] remmer') }}</label>
            <div class="inu"><input id="k-i" inputmode="decimal" v-model="I"><span class="u" id="k-iu">{{ su }}</span></div>
          </div>
        </div>
        <div style="margin-top:12px">
          <lk-etable table-id="k-tbl" :cols="cols" v-model:rows="rows" add-id="k-add"/>
        </div>
        <div class="row" style="margin-top:10px">
          <button type="button" id="k-add" @click="addRow">{{ t('+ Rij') }}</button>
          <button type="button" id="k-clearI" @click="clearI">{{ t('Remmerkolom leegmaken') }}</button>
        </div>
      </div>
      <div class="result">
        <div class="seg" role="group" :aria-label="t('Grafiek')" style="flex-wrap:wrap">
          <button v-for="p in plots" :key="p.k" type="button" :class="{on: plot === p.k}" :data-kp="p.k"
            @click="plot = p.k">{{ t(p.n) }}</button>
        </div>
        <canvas id="k-cv" style="margin-top:10px"></canvas>
        <div id="k-res">
          <lk-note v-if="!kin" kind="info">{{ t('Vul minstens drie substraatconcentraties met snelheid in.') }}</lk-note>
          <template v-else>
            <div class="lbl" style="margin-top:10px">{{ t('Niet-lineaire fit (Michaelis-Menten)') }}</div>
            <div class="row" style="gap:22px">
              <div>
                <div class="big" style="margin:0">{{ G(kin.F.Vm, 3) }} <small>{{ vu }}</small></div>
                <div style="font-size:12px;color:var(--muted)">V<sub>max</sub> ± {{ G(kin.F.seV, 2) }}</div>
              </div>
              <div>
                <div class="big" style="margin:0">{{ G(kin.F.Km, 3) }} <small>{{ su }}</small></div>
                <div style="font-size:12px;color:var(--muted)">K<sub>m</sub> ± {{ G(kin.F.seK, 2) }}</div>
              </div>
            </div>
            <lk-table :cols="methCols" :rows="methRows"/>
            <div class="lbl" style="margin-top:14px">{{ t('Regressielijnen y = a·x + b (zoals LIJNSCH in Excel)') }}</div>
            <div class="tbl-wrap"><lk-table :cols="regCols" :rows="regRows" :wrap="false"/></div>
            <lk-kv v-if="kcatRows" :rows="kcatRows"/>
            <lk-note v-else-if="kcatNote" kind="info" :html="tHtml('k<sub>cat</sub> wordt berekend als v in µM/min of mM/min staat.')"/>
            <lk-note v-if="kin.sMax < kin.F.Km * 2" kind="warn" :html="lowS"/>
            <template v-if="inh">
              <div class="lbl" style="margin-top:14px">{{ t('Met remmer') }}</div>
              <lk-kv :rows="inhRows"/>
              <lk-formula v-if="inh.Ki" :html="inh.Ki"/>
              <lk-note kind="info" :html="tHtml('Indicatie op basis van ±15% verschil in V<sub>max</sub> en K<sub>m</sub>. Bevestig met meerdere remmerconcentraties.')"/>
            </template>
          </template>
        </div>
      </div>
    </div>
    <details class="panel" id="k-gdet">
      <summary style="cursor:pointer;font-weight:600;font-size:14px">{{ t('Alle vier de grafieken naast elkaar') }}</summary>
      <lk-note v-if="!kin" kind="info" style="margin-top:10px">{{ t('Vul minstens drie substraatconcentraties met snelheid in.') }}</lk-note>
      <div v-else style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:14px;margin-top:10px">
        <div v-for="g in plots" :key="g.k">
          <div class="lbl">{{ t(g.n) }}</div>
          <canvas :id="'k-g-' + g.k"></canvas>
          <p v-if="g.k !== 'mm'" style="font-size:12px;color:var(--muted);margin:4px 0 0">{{ linNote(g.k) }}</p>
        </div>
      </div>
      <p v-if="kin" style="font-size:12px;color:var(--muted);margin:10px 0 0">{{ t('De lijnen volgen de niet-lineaire fit; de punten zijn de metingen zonder remmer.') }}</p>
    </details>
    <details class="panel" id="ki-det">
      <summary style="cursor:pointer;font-weight:600;font-size:14px">{{ t('Remmingstype vergelijken (meerdere [I])') }}</summary>
      <div class="f" style="margin-top:10px">
        <label for="ki-d">{{ t('[S], v en [I] per regel') }} <span class="example">{{ t('voorbeeld') }}</span></label>
        <textarea id="ki-d" rows="8" v-model="kiData"></textarea>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:8px 0">{{ t('Eén regel per meting; [I] in dezelfde eenheid als [S]. Alle punten worden samen gefit met gedeelde Vmax en Km.') }}</p>
      <lk-note v-if="!ki" kind="info">{{ t('Vul minstens zes regels in, waarvan een deel met [I] boven nul.') }}</lk-note>
      <template v-else>
        <lk-table :cols="kiCols" :rows="kiRows"/>
        <lk-note :kind="kiBest.w < 0.7 ? 'warn' : 'ok'">{{ kiMsg }}</lk-note>
        <lk-kv :rows="kiBestRows"/>
        <canvas id="ki-cv" style="margin-top:10px"></canvas>
      </template>
      <p style="font-size:12px;color:var(--muted);margin:8px 0 0">{{ t('Bronnen: Copeland, Enzymes (Wiley), hoofdstuk over remming; Burnham en Anderson, Model selection (AICc).') }}</p>
    </details>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';
import {MODELS, inhibFit} from '../lib/inhib.js';

/* F(x, d, true) is sig(); zonder derde argument fmt() */
const FM = (x, d) => lkNumIn(fmt(x, d)), SG = (x, d) => lkNumIn(sig(x, d)), SC = (x, d) => lkNumIn(sci(x, d));

/* de voorbeeldreeks van de oude tool */
const KDATA = [[0.25, 8.9, 4.9], [0.5, 14.2, 8.4], [1, 23.1, 15.0], [2, 30.6, 22.2], [4, 39.0, 31.8], [8, 43.1, 38.1]];

/* voorbeeld: competitieve remming (Vmax 100, Km 2, Ki 1) op één decimaal afgerond; kolommen [S], v, [I] */
const KIDATA = [[0.5, 20.0, 0], [1, 33.3, 0], [2, 50.0, 0], [4, 66.7, 0], [8, 80.0, 0], [16, 88.9, 0], [0.5, 11.1, 1], [1, 20.0, 1], [2, 33.3, 1], [4, 50.0, 1], [8, 66.7, 1], [16, 80.0, 1], [0.5, 5.9, 3], [1, 11.1, 3], [2, 20.0, 3], [4, 33.3, 3], [8, 50.0, 3], [16, 66.7, 3]];

const PLOTS = [{k: 'mm', n: 'Michaelis-Menten'}, {k: 'lb', n: 'Lineweaver-Burk'},
  {k: 'hw', n: 'Hanes-Woolf'}, {k: 'eh', n: 'Eadie-Hofstee'}];

export default {
  name: 'Enzym',
  data() {
    return {
      dat: lkNumIn('0,085'), dab: lkNumIn('0,005'), epsp: '6.22', eps: lkNumIn('6,22'), l: '1',
      vt: '3', ve: lkNumIn('0,1'), df: '1', prot: lkNumIn('0,5'),
      su: 'mM', vu: 'µM/min', E: lkNumIn('0,01'), I: lkNumIn('0,5'),
      rows: KDATA.map(r => r.map(v => lkNumIn(String(v).replace('.', ',')))),
      plot: 'mm', kiData: KIDATA.map(r => r.map(v => lkNumIn(String(v).replace('.', ','))).join('  ')).join('\n')
    };
  },
  computed: {
    plots() { return PLOTS; },
    h3a() { return this.tHtml('Activiteit uit ΔA/min <span class="example">voorbeeld</span>'); },
    h3b() { return this.tHtml('Substraatreeks <span class="example">voorbeeld</span>'); },
    cols() {
      return [{h: '[S]', t: 'num', w: 80}, {h: this.t('v zonder remmer'), t: 'num', w: 90},
        {h: this.t('v met remmer'), t: 'num', w: 90}];
    },
    /* activiteit uit de absorptiehelling: dezelfde regels als de oude calc.enzym() */
    act() {
      const dt = Math.abs(num(this.dat)), db = Math.abs(num(this.dab) || 0), eps = num(this.eps),
        l = num(this.l) || 1, vt = num(this.vt), ve = num(this.ve), df = num(this.df) || 1, prot = num(this.prot);
      if (!([dt, eps, vt, ve].every(isFinite) && eps > 0 && ve > 0)) return null;
      const dA = dt - db, dc = dA / (eps * l); /* mM/min = µmol/mL/min */
      const uml = dc * vt * df / ve, ucuv = dc * vt;
      return {dt, dA, dc, uml, ucuv, eps, l, vt, ve, df, prot};
    },
    actRows() {
      const t = this.t, a = this.act;
      return [[t('Netto ΔA/min'), FM(a.dA, 4)], [t('Δc in cuvet'), SG(a.dc * 1000, 3) + ' µM/min'],
        [t('In cuvet'), SG(a.ucuv * 1000, 3) + ' mU'], [t('nkat/mL'), SG(a.uml * 16.67, 3)]];
    },
    actFormula() {
      const a = this.act;
      return `U/mL = ${FM(a.dA, 4)} × ${FM(a.vt, 2)} × ${FM(a.df, 1)} / (${FM(a.eps, 3)} × ${FM(a.l, 2)} × ${FM(a.ve, 3)})`;
    },
    /* de meetpunten, de beide fits en de grootste [S]; alle andere computeds lezen hieruit */
    kin() {
      const rows = this.rows.map(r => ({s: num(r[0]), v: num(r[1]), vi: num(r[2])}));
      const A = rows.filter(r => r.s > 0 && r.v > 0), B = rows.filter(r => r.s > 0 && r.vi > 0);
      if (A.length < 3) return null;
      const F = mmFit(A.map(r => r.s), A.map(r => r.v));
      const G = B.length >= 3 ? mmFit(B.map(r => r.s), B.map(r => r.vi)) : null;
      const sMax = Math.max(...rows.filter(r => r.s > 0).map(r => r.s));
      return {A, B, F, G, sMax};
    },
    /* de remmingsvergelijking: punten uit het tekstvak, globale fit van de vier modellen */
    kiPts() {
      return this.kiData.split('\n').map(l => nums(l)).filter(a => a.length >= 2 && a[0] > 0 && a[1] > 0)
        .map(a => ({s: a[0], v: a[1], i: a[2] > 0 ? a[2] : 0}));
    },
    ki() { const L = this.kiPts; return inhibFit(L.map(r => r.s), L.map(r => r.v), L.map(r => r.i)); },
    kiBest() { return this.ki.models[this.ki.best]; },
    kiCols() {
      return [{h: this.t('Model')}, {h: 'AICc', num: true}, {h: this.t('Gewicht'), num: true}, {h: 'K<sub>i</sub>', num: true}];
    },
    kiRows() {
      const t = this.t, su = this.su, b = this.ki.best;
      return this.ki.models.map((m, j) => ({cells: [t(m.name), FM(m.aicc, 1), FM(m.w * 100, 0) + '%',
        `${SG(m.p[2], 3)} ${su}`], cls: j === b ? 'hl' : ''}));
    },
    kiMsg() {
      const b = this.kiBest, t = this.t;
      return b.w < 0.7 ? t('Geen duidelijk type; meer [S] of [I] meten.') : t(b.name) + ': ' + t('beste model volgens AICc.');
    },
    kiBestRows() {
      const b = this.kiBest, su = this.su, vu = this.vu, pm = (v, e, u) => `${SG(v, 3)}${isFinite(e) ? ` ± ${SG(e, 2)}` : ''} ${u}`;
      const r = [[this.t('Beste model'), `${this.t(b.name)} (${FM(b.w * 100, 0)}%)`], [this.tHtml('V<sub>max</sub>'), pm(b.p[0], b.se[0], vu)],
        [this.tHtml('K<sub>m</sub>'), pm(b.p[1], b.se[1], su)], [this.tHtml('K<sub>i</sub>'), pm(b.p[2], b.se[2], su)]];
      if (b.p.length > 3) r.push([this.tHtml('αK<sub>i</sub>'), pm(b.p[3], b.se[3], su)]);
      return r;
    },
    methCols() {
      return [{h: this.t('Methode')}, {h: 'V<sub>max</sub>', num: true}, {h: 'K<sub>m</sub>', num: true},
        {h: 'R²', num: true}];
    },
    methRows() {
      const t = this.t, F = this.kin.F;
      const pm = (v, s) => `${SG(v, 3)}${isFinite(s) ? ` <span style="color:var(--muted)">± ${SG(s, 2)}</span>` : ''}`;
      return [{cells: [t('Niet-lineair'), pm(F.Vm, F.seV), pm(F.Km, F.seK), ''], cls: 'hl'},
        [t('Lineweaver-Burk'), SG(F.lb.V, 3), SG(F.lb.K, 3), FM(F.lb.r2, 4)],
        [t('Hanes-Woolf'), SG(F.hw.V, 3), SG(F.hw.K, 3), FM(F.hw.r2, 4)],
        [t('Eadie-Hofstee'), SG(F.eh.V, 3), SG(F.eh.K, 3), FM(F.eh.r2, 4)]];
    },
    regCols() {
      const t = this.t;
      return [{h: t('Plot')}, {h: t('y tegen x')}, {h: t('Richtingscoëfficiënt a ± SE'), num: true},
        {h: t('y-asafsnede b ± SE'), num: true}, {h: t('x-asafsnede'), num: true}, {h: 'R²', num: true}];
    },
    regRows() {
      const t = this.t, {F, G} = this.kin;
      const rg = (nm, ax, o) => [t(nm), t(ax), `${SG(o.b, 4)} ± ${SG(o.seb, 2)}`, `${SG(o.a, 4)} ± ${SG(o.sea, 2)}`,
        SG(o.x0, 4), FM(o.r2, 4)];
      return [rg('Lineweaver-Burk', '1/v tegen 1/[S]', F.lb), rg('Hanes-Woolf', '[S]/v tegen [S]', F.hw),
        rg('Eadie-Hofstee', 'v tegen v/[S]', F.eh),
        G ? rg('Lineweaver-Burk, met remmer', '1/v tegen 1/[S]', G.lb) : null];
    },
    /* kcat en kcat/Km, alleen als [E] bekend is en v in µM/min of mM/min staat */
    kcatOk() { const E = num(this.E); return isFinite(E) && E > 0; },
    kcatNote() { return this.kcatOk && !(this.vu === 'µM/min' || this.vu === 'mM/min'); },
    kcatRows() {
      if (!this.kcatOk || !(this.vu === 'µM/min' || this.vu === 'mM/min')) return null;
      const {F} = this.kin, vu = this.vu, su = this.su, E = num(this.E);
      const VmuM = vu === 'mM/min' ? F.Vm * 1000 : F.Vm; const kcat = VmuM / E / 60; const KmM = su === 'mM' ? F.Km * 1e-3 : F.Km * 1e-6;
      return [[this.tHtml('k<sub>cat</sub>'), SG(kcat, 3) + ' s⁻¹'],
        [this.tHtml('k<sub>cat</sub>/K<sub>m</sub>'), SC(kcat / KmM, 3) + ' M⁻¹s⁻¹']];
    },
    lowS() {
      return this.tHtml('De hoogste [S] ligt onder 2 × K<sub>m</sub>; V<sub>max</sub> is dan slecht bepaald. Meet bij hogere substraatconcentraties.');
    },
    /* het remmingstype uit de verhouding van Vmax en Km met en zonder remmer (±15%) */
    inh() {
      const {F, G} = this.kin, su = this.su; if (!G) return null;
      const I = num(this.I); const rV = G.Vm / F.Vm, rK = G.Km / F.Km, tol = 0.15;
      let type, Ki = '';
      if (Math.abs(rV - 1) < tol && rK > 1 + tol) { type = 'Competitief'; if (isFinite(I)) Ki = `K<sub>i</sub> ≈ ${SG(I / (rK - 1), 3)} ${su}`; }
      else if (rV < 1 - tol && Math.abs(rK - 1) < tol) { type = 'Niet-competitief'; if (isFinite(I)) Ki = `K<sub>i</sub> ≈ ${SG(I / (1 / rV - 1), 3)} ${su}`; }
      else if (rV < 1 - tol && rK < 1 - tol && Math.abs(rV / rK - 1) < tol) { type = 'Oncompetitief'; if (isFinite(I)) Ki = `K<sub>i</sub>′ ≈ ${SG(I / (1 / rV - 1), 3)} ${su}`; }
      else if (Math.abs(rV - 1) < tol && Math.abs(rK - 1) < tol) type = 'Geen duidelijke remming';
      else { type = 'Gemengd'; if (isFinite(I)) { const al = rK / rV, alp = 1 / rV; Ki = `K<sub>i</sub> ≈ ${al > 1 ? SG(I / (al - 1), 3) : '–'} ${su} · K<sub>i</sub>′ ≈ ${alp > 1 ? SG(I / (alp - 1), 3) : '–'} ${su}`; } }
      return {type, Ki, rV, rK};
    },
    inhRows() {
      const {G} = this.kin, {rV, rK, type} = this.inh, vu = this.vu, su = this.su, t = this.t;
      return [[this.tHtml('V<sub>max,app</sub>'), `${SG(G.Vm, 3)} ${vu} (${FM(rV * 100, 0)}%)`],
        [this.tHtml('K<sub>m,app</sub>'), `${SG(G.Km, 3)} ${su} (${FM(rK * 100, 0)}%)`],
        [t('Indicatie'), `<span class="chip info">${t(type)}</span>`]];
    }
  },
  mounted() { this.draw(); this.drawGrid(); this.drawKi(); },
  updated() { this.draw(); this.drawGrid(); this.drawKi(); },
  methods: {
    /* de regressiewaarden van één lineaire grafiek, als kleine uitleg onder de tekening */
    linNote(k) {
      const o = this.kin.F[k];
      return this.t('Uit deze lijn: Km ' + uv(SG(o.K, 3)) + ', Vmax ' + uv(SG(o.V, 3)) + ' — minder betrouwbaar dan de niet-lineaire fit');
    },
    /* vier kleine grafieken: punten en de lijn van de niet-lineaire Km en Vmax */
    drawGrid() {
      const K = this.kin, c = k => document.getElementById('k-g-' + k); if (!K || !c('mm')) return;
      const {A, F, sMax} = K, {Vm, Km} = F, su = this.su, vu = this.vu, o = {w: 360, h: 250}, ymax = Math.max(Vm, ...A.map(r => r.v)) * 1.1;
      chart(c('mm'), {...o, xmin: 0, xmax: sMax * 1.08, ymin: 0, ymax, xlabel: `[S] (${su})`, ylabel: `v (${vu})`,
        series: [{fn: s => Vm * s / (Km + s), x0: 0}, {pts: A.map(r => [r.s, r.v]), color: '--ink'}]});
      const xl = -1 / Km * 1.15, lx = A.map(r => 1 / r.s), ly = A.map(r => 1 / r.v), lb = x => 1 / Vm + Km / Vm * x;
      chart(c('lb'), {...o, xmin: xl, xmax: Math.max(...lx) * 1.08, ymin: Math.min(lb(xl), 0) * 1.1, ymax: Math.max(...ly) * 1.1, xlabel: `1/[S] (1/${su})`, ylabel: '1/v',
        series: [{fn: lb}, {pts: A.map((r, i) => [lx[i], ly[i]]), color: '--ink'}]});
      const hw = x => (x + Km) / Vm, hy = A.map(r => r.s / r.v), hx = -Km * 1.15;
      chart(c('hw'), {...o, xmin: hx, xmax: sMax * 1.08, ymin: Math.min(hw(hx), 0) * 1.1, ymax: Math.max(...hy) * 1.1, xlabel: `[S] (${su})`, ylabel: '[S]/v',
        series: [{fn: hw}, {pts: A.map((r, i) => [r.s, hy[i]]), color: '--ink'}]});
      const ex = A.map(r => r.v / r.s);
      chart(c('eh'), {...o, xmin: 0, xmax: Math.max(...ex, Vm / Km) * 1.08, ymin: 0, ymax, xlabel: 'v/[S]', ylabel: `v (${vu})`,
        series: [{fn: x => Vm - Km * x}, {pts: A.map((r, i) => [ex[i], r.v]), color: '--ink'}]});
    },
    /* Lineweaver-Burk met een kleur per [I] en de lijnen van het beste model */
    drawKi() {
      const cv = document.getElementById('ki-cv'); if (!cv || !this.ki) return;
      const L = this.kiPts, m = this.kiBest, mod = MODELS.find(x => x.id === m.id), col = j => SERCOL[j % SERCOL.length];
      const Is = [...new Set(L.map(r => r.i))].sort((a, b) => a - b), apps = Is.map(i => mod.app(m.p, i));
      const lines = apps.map(a => x => 1 / a.V + a.K / a.V * x), xs = L.map(r => 1 / r.s), ys = L.map(r => 1 / r.v);
      const xmin = -Math.max(...apps.map(a => 1 / a.K)) * 1.15;
      chart(cv, {xmin, xmax: Math.max(...xs) * 1.08, ymin: Math.min(...lines.map(f => f(xmin)), 0) * 1.1, ymax: Math.max(...ys) * 1.1,
        xlabel: `1/[S] (1/${this.su})`, ylabel: '1/v',
        series: Is.flatMap((i, j) => [{fn: lines[j], color: col(j)}, {pts: L.filter(r => r.i === i).map(r => [1 / r.s, 1 / r.v]), color: col(j)}]),
        legend: Is.map((i, j) => ['[I] = ' + lkNumIn(sig(i, 3)), col(j)])});
    },
    F(x, d, sig) { return sig ? SG(x, d) : FM(x, d); },
    G: SG,
    isFinite,
    /* een keuze uit de chromofoorlijst vult ε; "eigen waarde" laat staan wat er stond */
    onEpsp() { if (this.epsp) this.eps = lkNumIn(this.epsp.replace('.', ',')); },
    addRow() { this.rows = [...this.rows, ['', '', '']]; },
    clearI() { this.rows = this.rows.map(r => [r[0], r[1], '']); },
    /* de vier tekeningen, met de tekencontext via chart(); dezelfde reeksen als de oude calc.enzym() */
    draw() {
      const cv = document.getElementById('k-cv'), K = this.kin; if (!cv || !K) return;
      const {A, B, F, G, sMax} = K, su = this.su, vu = this.vu;
      const rows = this.rows.map(r => ({s: num(r[0]), v: num(r[1]), vi: num(r[2])}));
      const kPlot = this.plot;
      if (kPlot === 'mm') {
        const ymax = Math.max(F.Vm, ...A.map(r => r.v), ...(G ? B.map(r => r.vi) : [])) * 1.1;
        chart(cv, {xmin: 0, xmax: sMax * 1.08, ymin: 0, ymax, xlabel: `[S] (${su})`, ylabel: `v (${vu})`, series: [{fn: s => F.Vm * s / (F.Km + s), x0: 0, name: 'MM-fit'}, {pts: A.map(r => [r.s, r.v]), color: '--ink', name: 'zonder remmer'}, {fn: s => F.Vm / 2, dash: [4, 4], color: '--line'}, ...(G ? [{fn: s => G.Vm * s / (G.Km + s), x0: 0, color: '--bad', name: 'MM-fit met remmer'}, {pts: B.map(r => [r.s, r.vi]), color: '--bad', hollow: true, name: 'met remmer'}] : [])], legend: G ? [['zonder remmer', '--accent'], ['met remmer', '--bad']] : null});
      } else if (kPlot === 'lb') {
        const xs = A.map(r => 1 / r.s).concat(G ? B.map(r => 1 / r.s) : []), ys = A.map(r => 1 / r.v).concat(G ? B.map(r => 1 / r.vi) : []);
        const xl = -Math.max(1 / F.lb.K, G ? 1 / G.lb.K : 0) * 1.15; const xmin = isFinite(xl) && xl < 0 ? xl : -0.1 * Math.max(...xs), xmax = Math.max(...xs) * 1.08;
        const yv = [...ys, 0, F.lb.a + F.lb.b * xmin, G ? G.lb.a + G.lb.b * xmin : 0];
        chart(cv, {xmin, xmax, ymin: Math.min(...yv, 0) * 1.1, ymax: Math.max(...ys) * 1.1, xlabel: `1/[S] (1/${su})`, ylabel: `1/v`, series: [{fn: x => F.lb.a + F.lb.b * x}, {pts: A.map(r => [1 / r.s, 1 / r.v]), color: '--ink'}, ...(G ? [{fn: x => G.lb.a + G.lb.b * x, color: '--bad'}, {pts: B.map(r => [1 / r.s, 1 / r.vi]), color: '--bad', hollow: true}] : [])], legend: G ? [['zonder remmer', '--accent'], ['met remmer', '--bad']] : null});
      } else if (kPlot === 'eh') {
        const xs = A.map(r => r.v / r.s).concat(G ? B.map(r => r.vi / r.s) : []), ys = A.map(r => r.v).concat(G ? B.map(r => r.vi) : []);
        chart(cv, {xmin: 0, xmax: Math.max(...xs, F.eh.x0 > 0 ? F.eh.x0 : 0) * 1.08, ymin: 0, ymax: Math.max(...ys, F.eh.a) * 1.1, xlabel: `v/[S]`, ylabel: `v (${vu})`, series: [{fn: x => F.eh.a + F.eh.b * x}, {pts: A.map(r => [r.v / r.s, r.v]), color: '--ink'}, ...(G ? [{fn: x => G.eh.a + G.eh.b * x, color: '--bad'}, {pts: B.map(r => [r.vi / r.s, r.vi]), color: '--bad', hollow: true}] : [])], legend: G ? [['zonder remmer', '--accent'], ['met remmer', '--bad']] : null});
      } else {
        const ys = A.map(r => r.s / r.v).concat(G ? B.map(r => r.s / r.vi) : []); const xmin = -Math.max(F.hw.K, G ? G.hw.K : 0) * 1.15;
        chart(cv, {xmin: isFinite(xmin) && xmin < 0 ? xmin : 0, xmax: sMax * 1.08, ymin: 0, ymax: Math.max(...ys) * 1.1, xlabel: `[S] (${su})`, ylabel: `[S]/v`, series: [{fn: x => F.hw.a + F.hw.b * x}, {pts: A.map(r => [r.s, r.s / r.v]), color: '--ink'}, ...(G ? [{fn: x => G.hw.a + G.hw.b * x, color: '--bad'}, {pts: B.map(r => [r.s, r.s / r.vi]), color: '--bad', hollow: true}] : [])], legend: G ? [['zonder remmer', '--accent'], ['met remmer', '--bad']] : null});
      }
    }
  }
};
</script>
