<!-- ================= STATISTIEK =================
     Eén tool met elf toetsen. De keuzelijst st-test bepaalt welke panelen zichtbaar zijn en
     welke uitkomst er komt; de panelen worden met v-show verborgen en niet met v-if, want
     tests/validate.py en de invoeropslag zetten .value op velden van een toets die nog niet
     gekozen is (bijvoorbeeld st-groups terwijl "Beschrijvend" aan staat). Met v-if zou dat
     veld er dan niet zijn.

     Het rekenwerk blijft onveranderd in web/index.html staan (stNums, stDesc, stGroups,
     anovaCalc, kwCalc, rankAbs, wilcoxDist, de verdelingsfuncties en stBars): daar hangen de
     validatiegevallen aan. Deze component beheert de velden, de tabel per groep en de
     uitkomst.

     S248 zette de toetsen t (één steekproef, twee groepen, gepaard), Wilcoxon, ANOVA en
     Kruskal-Wallis in Vue, S249 de tweeweg-ANOVA, de regressie, de power en de χ²-toets.
     De tekeningen van de regressie en de power worden na elke render opnieuw gemaakt, net als
     de staafjes van de ANOVA.

     De id's st-test, st-alpha, st-side, st-mu, st-na, st-nb, st-a, st-b, st-groups, st-two,
     st-fa, st-fb, st-ptype, st-pd, st-psd, st-pw, st-obs, st-exp, st-out, st-dpanel,
     st-desc, st-tukey, st-dunn en stb-cv blijven zoals ze waren. -->
<template>
  <div class="grid2">
    <div class="stack">
      <div class="panel">
        <div class="fields">
          <div class="f">
            <label for="st-test">{{ t('Toets') }}</label>
            <select id="st-test" style="width:100%" v-model="test">
              <option v-for="o in TESTS" :key="o.v" :value="o.v">{{ t(o.n) }}</option>
            </select>
          </div>
          <div class="f">
            <label for="st-alpha">{{ t('Significantieniveau α') }}</label>
            <select id="st-alpha" style="width:100%" v-model="alphaRaw">
              <option v-for="a in ALPHAS" :key="a.v" :value="a.v">{{ lkNum(a.n) }}</option>
            </select>
          </div>
          <div class="f" v-show="shown('t1 t2 tp wil power')">
            <label for="st-side">{{ t('Toetsing') }}</label>
            <select id="st-side" style="width:100%" v-model="side">
              <option v-for="o in SIDES" :key="o.v" :value="o.v" v-html="tHtml(o.n)"></option>
            </select>
          </div>
          <div class="f" v-show="shown('t1 wil')">
            <label for="st-mu">{{ t('Referentiewaarde µ₀') }}</label>
            <input id="st-mu" inputmode="decimal" v-model="mu">
          </div>
        </div>
      </div>
      <div class="panel" v-show="shown('desc t1 t2 tp wil reg')">
        <div class="fields" style="grid-template-columns:1fr 1fr">
          <div class="f"><label for="st-na">{{ t('Naam groep A') }}</label><input id="st-na" class="txt" v-model="na"></div>
          <div class="f" v-show="shown('desc t2 tp wil reg')"><label for="st-nb">{{ t('Naam groep B') }}</label><input id="st-nb" class="txt" v-model="nb"></div>
          <div class="f"><label for="st-a" v-html="tHtml(labelA)"></label><textarea id="st-a" rows="7" v-model="a"></textarea></div>
          <div class="f" v-show="shown('desc t2 tp wil reg')"><label for="st-b" v-html="tHtml(labelB)"></label><textarea id="st-b" rows="7" v-model="b"></textarea></div>
        </div>
        <p style="font-size:13px;color:var(--muted);margin:8px 0 0" id="st-hint" v-show="shown('tp wil')">{{ t('Bij een gepaarde toets horen de waarden op dezelfde plek bij elkaar (zelfde proefpersoon, monster of plaat).') }}</p>
      </div>
      <div class="panel" v-show="shown('anova2')">
        <div class="f">
          <label for="st-two" v-html="tHtml('Per regel: niveau factor A / niveau factor B: waarden &lt;span class=&quot;example&quot;&gt;voorbeeld&lt;/span&gt;')"></label>
          <textarea id="st-two" rows="7" spellcheck="false" v-model="two"></textarea>
        </div>
        <div class="fields" style="margin-top:10px">
          <div class="f"><label for="st-fa">{{ t('Naam factor A') }}</label><input id="st-fa" class="txt" v-model="fa"></div>
          <div class="f"><label for="st-fb">{{ t('Naam factor B') }}</label><input id="st-fb" class="txt" v-model="fb"></div>
        </div>
        <p style="font-size:13px;color:var(--muted);margin:8px 0 0">{{ t('Gebalanceerd ontwerp: elke combinatie even vaak gemeten. Voorbeelddata (OD na 6 uur) zijn verzonnen.') }}</p>
      </div>
      <div class="panel" v-show="shown('power')">
        <div class="fields">
          <div class="f">
            <label for="st-ptype">{{ t('Opzet') }}</label>
            <select id="st-ptype" style="width:100%" v-model="ptype">
              <option value="2">{{ t('Twee onafhankelijke groepen') }}</option>
              <option value="1">{{ t('Gepaard of één steekproef') }}</option>
            </select>
          </div>
          <lk-field v-model="pd" :label="t('Verschil dat je wilt aantonen')" for-id="st-pd"/>
          <lk-field v-model="psd" :label="t('Standaardafwijking (uit eerdere metingen)')" for-id="st-psd"/>
          <lk-field v-model="pw" :label="t('Gewenste power')" for-id="st-pw" unit="%"/>
        </div>
        <p style="font-size:13px;color:var(--muted);margin:8px 0 0">{{ t('Bij gepaard: gebruik de standaardafwijking van de verschillen.') }}</p>
      </div>
      <div class="panel" v-show="shown('anova kw')">
        <div class="f">
          <label for="st-groups" v-html="tHtml('Groepen: één groep per regel, eventueel met naam en dubbele punt &lt;span class=&quot;example&quot;&gt;voorbeeld&lt;/span&gt;')"></label>
          <textarea id="st-groups" rows="5" v-model="groups"></textarea>
        </div>
        <p style="font-size:13px;color:var(--muted);margin:8px 0 0">{{ t('Plakken uit Excel kan ook: per regel een naam, een tab en dan de waarden. Voorbeeld: drooggewicht van planten onder een controle en twee behandelingen (R-dataset PlantGrowth, Dobson 1983).') }}</p>
      </div>
      <div class="panel" v-show="shown('chi')">
        <div class="f">
          <label for="st-obs" v-html="tHtml('Waargenomen aantallen &lt;span class=&quot;example&quot;&gt;voorbeeld&lt;/span&gt;')"></label>
          <textarea id="st-obs" rows="3" v-model="obs"></textarea>
        </div>
        <div class="f" style="margin-top:12px">
          <label for="st-exp">{{ t('Verwachte verhouding of verwachte aantallen') }}</label>
          <input id="st-exp" class="mono" v-model="exp">
        </div>
        <p style="font-size:13px;color:var(--muted);margin:8px 0 0">{{ t('Eén regel met aantallen = aanpassingstoets (laat de verwachting leeg voor een gelijke verdeling). Meerdere regels = kruistabel (rijen × kolommen); dan wordt de verwachting uit de rij- en kolomtotalen berekend.') }}</p>
      </div>
    </div>
    <div class="result" id="st-out">
      <lk-note v-if="problem" :kind="problem.kind" :html="problem.html"/>
      <template v-else>
        <lk-big :label="R.label" :html="R.big"/>
        <lk-steps v-if="R.steps" :steps="R.steps"/>
        <lk-kv v-if="R.kv" :rows="R.kv"/>
        <div v-if="R.anova" class="tbl-wrap"><lk-table :table-id="R.anova.id" :cols="R.anova.cols" :rows="R.anova.rows" :wrap="false"/></div>
        <template v-if="R.post">
          <div class="lbl" style="margin-top:12px" v-html="R.post.label"></div>
          <div class="tbl-wrap"><lk-table :table-id="R.post.id" :cols="R.post.cols" :rows="R.post.rows" :wrap="false"/></div>
        </template>
        <lk-kv v-if="R.kv2" :rows="R.kv2"/>
        <template v-if="R.cells">
          <div class="lbl" style="margin-top:12px">{{ R.cells.label }}</div>
          <div class="tbl-wrap"><lk-table :cols="R.cells.cols" :rows="R.cells.rows" :wrap="false"/></div>
        </template>
        <template v-if="R.bars">
          <div class="f" style="max-width:220px;margin-top:12px"><label for="st-err">{{ t('Foutbalk') }}</label>
            <select id="st-err" style="width:100%" v-model="err"><option value="sd">SD</option><option value="sem">SEM</option><option value="ci">{{ t('95%-BI') }}</option></select></div>
          <div class="f" style="max-width:220px;margin-top:8px"><label for="st-plot">{{ t('Grafiektype') }}</label>
            <select id="st-plot" style="width:100%" v-model="plot"><option value="bar">{{ t('Staaf met punten') }}</option><option value="box">{{ t('Boxplot') }}</option><option value="violin">{{ t('Viool') }}</option><option value="dots">{{ t('Punten met gemiddelde') }}</option></select></div>
          <label class="chk" style="display:block;margin-top:8px"><input type="checkbox" id="st-ns" v-model="ns"> {{ t('Ook niet-significante paren (ns)') }}</label>
          <canvas id="stb-cv" style="margin-top:12px"></canvas>
          <div class="pic-bar" v-html="picBarHtml"></div>
        </template>
        <canvas v-if="R.canvas" :id="R.canvas" style="margin-top:12px"></canvas>
        <template v-if="R.canvas2">
          <div class="lbl" style="margin-top:8px">{{ R.canvas2.label }}</div>
          <canvas :id="R.canvas2.id"></canvas>
        </template>
        <lk-note v-for="(n, i) in R.notes" :key="i" :kind="n.kind" :html="n.html"/>
        <lk-formula v-if="R.formula" :html="R.formula"/>
      </template>
    </div>
  </div>
  <div class="panel" style="margin-top:16px" id="st-dpanel" v-show="desc.length">
    <h3>{{ t('Per groep') }}</h3>
    <div id="st-desc">
      <div v-if="desc.length" class="tbl-wrap"><lk-table :cols="descCols" :rows="descRows" :wrap="false"/></div>
    </div>
  </div>
</template>

<script>
import {lkNumIn, lkPicBar} from '../lib/bridge.js';

/* getallen: F en G voor de weergave (dus door lkNumIn), f en g voor tekst die nog door
   tHtml() of t() gaat — die zet de getallen zelf in de taal van de gebruiker */
const f = (x, d) => fmt(x, d), g = (x, d) => sig(x, d);
const F = (x, d) => lkNumIn(fmt(x, d)), G = (x, d) => lkNumIn(sig(x, d));
/* een voorbeeldwaarde in een veld: V() voor een naam, N() voor getallen. In het Nederlands
   blijft alles staan zoals het er staat. */
const V = s => (typeof trPlain === 'function' ? trPlain(s, true) : s);
const N = s => lkNumIn(s);

const TESTS = [{v: 'desc', n: 'Beschrijvend en uitbijters'},
  {v: 't1', n: 't-toets, één steekproef tegen µ₀'},
  {v: 't2', n: 't-toets, twee onafhankelijke groepen'},
  {v: 'tp', n: 't-toets, gepaarde waarnemingen'},
  {v: 'wil', n: 'Wilcoxon-rangtekentoets'},
  {v: 'anova', n: 'ANOVA (één factor) + Tukey'},
  {v: 'kw', n: 'Kruskal-Wallis + Dunn'},
  {v: 'anova2', n: 'Tweeweg-ANOVA (twee factoren)'},
  {v: 'reg', n: 'Lineaire regressie'},
  {v: 'power', n: 'Steekproefgrootte (power)'},
  {v: 'chi', n: 'χ²-toets'}];
const ALPHAS = [{v: '0.05', n: '0,05'}, {v: '0.01', n: '0,01'}, {v: '0.10', n: '0,10'}];
const SIDES = [{v: '2', n: 'Tweezijdig (≠)'}, {v: 'r', n: 'Rechtszijdig (A &gt; B of &gt; µ₀)'},
  {v: 'l', n: 'Linkszijdig (A &lt; B of &lt; µ₀)'}];

export default {
  name: 'Stat',
  data() {
    return {test: 'desc', err: 'sd', ns: false, plot: 'bar', alphaRaw: '0.05', side: '2', mu: '0',
      na: V('Middel 1'), nb: V('Middel 2'),
      a: N('0,7 -1,6 -0,2 -1,2 -0,1 3,4 3,7 0,8 0,0 2,0'),
      b: N('1,9 0,8 1,1 0,1 -0,1 4,4 5,5 1,6 4,6 3,4'),
      groups: N('ctrl: 4,17 5,58 5,18 6,11 4,50 4,61 5,17 4,53 5,33 5,14\n'
        + 'trt1: 4,81 4,17 4,41 3,59 5,87 3,83 6,03 4,89 4,32 4,69\n'
        + 'trt2: 6,31 5,12 5,54 5,50 5,37 5,29 4,92 6,15 5,80 5,26'),
      two: N('LB / 30 °C: 0,82 0,79 0,85 0,80\nLB / 37 °C: 1,21 1,18 1,25 1,19\n'
        + 'M9 / 30 °C: 0,41 0,44 0,39 0,43\nM9 / 37 °C: 0,55 0,52 0,58 0,54'),
      fa: V('Medium'), fb: V('Temperatuur'),
      ptype: '2', pd: N('0,5'), psd: '1', pw: '80',
      obs: '315 108 101 32', exp: '9 3 3 1'};
  },
  computed: {
    TESTS() { return TESTS; },
    ALPHAS() { return ALPHAS; },
    SIDES() { return SIDES; },
    alpha() { return num(this.alphaRaw); },
    mu0() { return num(this.mu) || 0; },
    nA() { return this.na || 'A'; },
    nB() { return this.nb || 'B'; },
    A() { return stNums(this.a); },
    B() { return stNums(this.b); },
    /* de groepen van ANOVA en Kruskal-Wallis */
    AG() { return this.test === 'anova' || this.test === 'kw' ? stGroups(this.groups) : []; },
    labelA() {
      return this.test === 'reg'
        ? 'x-waarden (onafhankelijk) <span class="example">voorbeeld</span>'
        : 'Waarden A <span class="example">voorbeeld</span>';
    },
    labelB() {
      if (this.test === 'reg') return 'y-waarden (afhankelijk)';
      return this.test === 'desc'
        ? 'Waarden B <span id="st-bopt" style="font-weight:400">(optioneel)</span>'
        : 'Waarden B';
    },
    /* dezelfde knoppen als picBar('stb'), maar zelf vertaald: de vertaallaag van de DOM komt
       niet in een Vue-boom */
    picBarHtml() { return lkPicBar('stb'); },

    /* ---------- de tabel per groep ---------- */
    /* [naam, stDesc()] per groep, net als in de oude versie */
    desc() {
      const T = this.test, alpha = this.alpha;
      /* deze vier toetsen lezen hun invoer niet uit de kolommen A en B, dus er is geen tabel
         per groep */
      if (['anova2', 'reg', 'power', 'chi'].includes(T)) return [];
      const useB = ['desc', 't2', 'tp', 'wil'].includes(T) && this.B.length > 0;
      const groups = (T === 'anova' || T === 'kw')
        ? this.AG.map(x => [x.name, x.v])
        : [[this.nA, this.A]].concat(useB ? [[this.nB, this.B]] : []);
      if (T === 'tp' && this.A.length === this.B.length && this.A.length > 1) {
        groups.push([`Verschil (${this.nA} − ${this.nB})`, this.A.map((v, i) => v - this.B[i])]);
      }
      return groups.filter(x => x[1].length > 0).map(x => [x[0], stDesc(x[1], alpha)]);
    },
    descCols() {
      return [{h: ''}].concat(this.desc.map(([n]) => ({h: esc(V(n)), num: true})));
    },
    descRows() {
      const t = this.t, D = this.desc, alpha = this.alpha;
      if (!D.length) return [];
      const row = (lab, fn) => [lab].concat(D.map(([, o]) => fn(o)));
      const yes = c => `<span class="chip ${c ? 'bad' : 'ok'}">${t(c ? 'uitbijter' : 'geen')}</span>`;
      return [
        row(t('n'), o => F(o.n, 0)),
        row(t('Gemiddelde'), o => G(o.m, 5)),
        row(t('Mediaan'), o => G(o.med, 5)),
        row(t('Standaardafwijking s'), o => (o.n > 1 ? G(o.sd, 4) : '–')),
        row(t('Standaardfout (s/√n)'), o => (o.n > 1 ? G(o.sem, 4) : '–')),
        row(t('Variatiecoëfficiënt'), o => (o.n > 1 && isFinite(o.cv) ? F(o.cv, 1) + ' %' : '–')),
        row(t('Minimum'), o => G(o.min, 5)),
        row(t('Maximum'), o => G(o.max, 5)),
        row(t(f((1 - alpha) * 100, 0) + '%-betrouwbaarheidsinterval'),
          o => (o.n > 1 ? `${G(o.ci[0], 4)} – ${G(o.ci[1], 4)}` : '–')),
        row(t('t (tweezijdig, df = n−1)'), o => (o.n > 1 ? F(o.tq, 3) : '–')),
        row(t('Grubbs G (verdachte waarde)'), o => (o.gr ? `${F(o.gr.G, 3)} (${G(o.gr.val, 5)})` : '–')),
        row(this.tHtml('Grubbs G<sub>krit</sub>'),
          o => (o.gr ? t(f(o.gr.crit.v, 3) + (o.gr.crit.tab ? ' (tabel 10)' : '')) : '–')),
        row(t('Grubbs: uitbijter?'), o => (o.gr ? yes(o.gr.G > o.gr.crit.v) : '–')),
        row(t('Dixon Q (verdachte waarde)'), o => (o.dx ? `${F(o.dx.Q, 3)} (${G(o.dx.val, 5)})` : '–')),
        row(this.tHtml('Dixon Q<sub>krit</sub>'),
          o => (o.dx && isFinite(o.dx.crit) ? t(f(o.dx.crit, 3) + ' (tabel 9)') : '–')),
        row(t('Dixon: uitbijter?'), o => (o.dx && isFinite(o.dx.crit) ? yes(o.dx.Q > o.dx.crit) : '–')),
        row(t('Normaliteit: D (Lilliefors)'), o => (isFinite(o.lD) ? F(o.lD, 3) : '–')),
        row(this.tHtml('D<sub>krit</sub> (α = 0,05, tabel 8)'), o => (isFinite(o.lC) ? F(o.lC, 3) : '–')),
        row(t('Normaal verdeeld?'), o => (isFinite(o.lD)
          ? (o.lD > o.lC ? `<span class="chip warn">${t('nee')}</span>`
            : `<span class="chip ok">${t('aanname houdbaar')}</span>`) : '–'))
      ];
    },

    /* ---------- de toetsingsprocedure ---------- */
    /* de vaste regels van een toets: hypothesen, beslissing en conclusie. Elke regel is één
       sleutel, dus de hele zin gaat in één keer door tHtml(). */
    proc() {
      const H = this.tHtml, alpha = this.alpha, side = this.side;
      return {
        h0: (h0, h1) => H(`<b>Hypothesen.</b> H₀: ${h0}; H₁: ${h1}.`),
        sideTxt: (two, r, l) => (side === '2' ? two : side === 'r' ? r : l),
        decide: (rej, txtRej, txtAcc) => [
          H(`<b>Beslissing.</b> ${rej ? 'H₀ verwerpen' : 'H₀ niet verwerpen'} (α = ${f(alpha, 2)}).`),
          H(`<b>Conclusie.</b> ${rej ? txtRej : txtAcc}`)],
        /* de kritieke t bij de gekozen toetsing, met de regel eromheen */
        tCrit: df => {
          const tc = tinv(1 - (side === '2' ? alpha / 2 : alpha), df);
          return {tc, txt: `${side === '2' ? '±' : side === 'r' ? '+' : '−'}${f(tc, 3)} `
            + `(df = ${f(df, df % 1 ? 2 : 0)}, ${side === '2' ? 'tweezijdig' : 'eenzijdig'})`};
        },
        pSide: (t, df) => (side === '2' ? 2 * (1 - tcdf(Math.abs(t), df))
          : side === 'r' ? 1 - tcdf(t, df) : tcdf(t, df)),
        rejT: (t, tc) => (side === '2' ? Math.abs(t) > tc : side === 'r' ? t > tc : t < -tc)
      };
    },
    /* wat er aan de invoer mist; is dit niet null, dan komt er alleen een melding */
    problem() {
      const t = this.t, T = this.test, A = this.A, B = this.B;
      if (T === 'desc' && !A.length) return {kind: 'info', html: t('Vul waarden in bij groep A.')};
      if (T === 't1' && A.length < 2) return {kind: 'info', html: t('Vul minstens twee waarden in.')};
      if (T === 't2' && (A.length < 2 || B.length < 2)) {
        return {kind: 'info', html: t('Vul in beide groepen minstens twee waarden in.')};
      }
      if (T === 'tp' && (A.length !== B.length || A.length < 2)) {
        return {kind: 'bad', html: t('Een gepaarde toets heeft evenveel waarden in A en B nodig (nu '
          + A.length + ' en ' + B.length + ').')};
      }
      if (T === 'wil') {
        if (B.length > 0 && A.length !== B.length) {
          return {kind: 'bad', html: t('Gepaard: evenveel waarden in A en B nodig (nu ' + A.length
            + ' en ' + B.length + '). Laat B leeg om tegen µ₀ te toetsen.')};
        }
        if (this.wil.n < 5) {
          return {kind: 'info',
            html: t('Te weinig verschillen ongelijk aan nul (minstens 5 nodig; tabel 11 begint bij n = 5).')};
        }
      }
      if (T === 'anova' && (this.AG.length < 2 || this.AG.some(x => x.v.length < 2))) {
        return {kind: 'info', html: t('Vul minstens twee groepen in met elk minstens twee waarden.')};
      }
      if (T === 'kw' && (this.AG.length < 2 || this.AG.some(x => !x.v.length))) {
        return {kind: 'info', html: t('Vul minstens twee groepen met waarden in.')};
      }
      if (T === 'anova2') {
        if (this.cells.length < 4) {
          return {kind: 'info',
            html: t('Vul minstens 2 × 2 combinaties in, zoals "LB / 37 °C: 1,2 1,3 1,1".')};
        }
        const e = anova2(this.cells).err;
        if (e) return {kind: 'bad', html: t(e)};
      }
      if (T === 'reg' && !this.reg) {
        return {kind: 'info',
          html: t('Vul minstens drie x- en y-waarden in, in dezelfde volgorde.')};
      }
      if (T === 'power' && !this.power) {
        return {kind: 'info',
          html: t('Vul een verschil, standaardafwijking en power (tussen 0 en 100%) in.')};
      }
      if (T === 'chi') {
        if (!this.chi) return {kind: 'info', html: t('Vul waargenomen aantallen in.')};
        const e = this.chi.err;
        if (e && e.cols) {
          return {kind: 'bad', html: t('Alle rijen van de kruistabel moeten evenveel kolommen hebben.')};
        }
        if (e) {
          return {kind: 'bad', html: t('Aantal verwachte waarden (' + e.n
            + ') is niet gelijk aan het aantal categorieën (' + e.k + ').')};
        }
      }
      return null;
    },
    /* de verschillen van de Wilcoxon-toets; ook problem() heeft die nodig */
    wil() {
      const paired = this.B.length > 0;
      const d0 = paired ? this.A.map((v, i) => v - this.B[i]) : this.A.map(v => v - this.mu0);
      const d = d0.filter(v => v !== 0);
      return {paired, d0, d, n: d.length};
    },
    /* de uitkomst van de gekozen toets: {label, big, steps, kv, …} */
    R() {
      const T = this.test;
      return T === 'desc' ? this.rDesc : T === 't1' ? this.rT1 : T === 't2' ? this.rT2
        : T === 'tp' ? this.rTp : T === 'wil' ? this.rWil : T === 'anova' ? this.rAnova
          : T === 'kw' ? this.rKw : T === 'anova2' ? this.rAnova2 : T === 'reg' ? this.rReg
            : T === 'power' ? this.rPower : T === 'chi' ? this.rChi : {};
    },

    rDesc() {
      const t = this.t, H = this.tHtml, alpha = this.alpha, o = this.desc[0][1], notes = [];
      const flags = this.desc.flatMap(([n, q]) => [
        q.gr && q.gr.G > q.gr.crit.v
          ? H(`Grubbs: ${g(q.gr.val, 5)} in ${uv(esc(n))} is een uitbijter (G = ${f(q.gr.G, 3)} &gt; ${f(q.gr.crit.v, 3)}).`)
          : null,
        q.dx && isFinite(q.dx.crit) && q.dx.Q > q.dx.crit
          ? H(`Dixon: ${g(q.dx.val, 5)} in ${uv(esc(n))} is een uitbijter (Q = ${f(q.dx.Q, 3)} &gt; ${f(q.dx.crit, 3)}).`)
          : null]).filter(Boolean);
      notes.push(flags.length
        ? {kind: 'warn', html: flags.join('<br>') + ' '
          + t('Verwijder een waarde alleen met een aanwijsbare oorzaak en noteer dat in je labjournaal; test maar één waarde per keer.')}
        : {kind: 'info', html: t('Geen uitbijters volgens Grubbs en Dixon.')});
      if (this.desc.some(([, q]) => q.n < 3)) {
        notes.push({kind: 'info', html: t('Uitbijtertoetsen hebben minstens 3 waarden nodig.')});
      }
      return {
        label: t(uv(this.nA) + ': gemiddelde ± s'),
        big: `${G(o.m, 4)} <small>± ${o.n > 1 ? G(o.sd, 3) : '–'} (n = ${F(o.n, 0)})</small>`,
        kv: [[t('Mediaan'), G(o.med, 4)],
          [t(f((1 - alpha) * 100, 0) + '%-BI gemiddelde'),
            o.n > 1 ? `${G(o.ci[0], 4)} – ${G(o.ci[1], 4)}` : '–'],
          [t('Variatiecoëfficiënt'), o.n > 1 ? F(o.cv, 1) + ' %' : '–']],
        notes,
        formula: H('s = √(Σ(xᵢ − x̄)² / (n − 1)) · BI = x̄ ± t · s/√n · G = max|xᵢ − x̄| / s · Q = sprong / spreidingsbreedte')
      };
    },
    rT1() {
      const t = this.t, H = this.tHtml, P = this.proc, o = stDesc(this.A, this.alpha);
      const tv = (o.m - this.mu0) / o.sem, df = o.n - 1, p = P.pSide(tv, df);
      const {tc, txt} = P.tCrit(df), rej = P.rejT(tv, tc), m0 = g(this.mu0, 4);
      return {
        label: t('t-toets, één steekproef'),
        big: `t = ${F(tv, 3)} <small>p = ${lkNumIn(pfmt(p))}</small>`,
        steps: [
          P.h0(`µ = ${m0}`, P.sideTxt(`µ ≠ ${m0}`, `µ &gt; ${m0}`, `µ &lt; ${m0}`)),
          H(`<b>Toetsingsgrootheid.</b> t = (x̄ − µ₀) / (s/√n) = (${g(o.m, 5)} − ${m0}) / (${g(o.sd, 4)}/√${o.n}) = <b>${f(tv, 3)}</b>`),
          H(`<b>Kritieke waarde</b> (tabel 4): t = ${txt}`),
          H(`<b>p-waarde</b> = ${pfmt(p)}`),
          ...P.decide(rej, `Het gemiddelde van ${uv(this.nA)} wijkt significant af van ${m0}.`,
            `Er is geen significant verschil met ${m0} aangetoond.`)]
      };
    },
    rT2() {
      const t = this.t, H = this.tHtml, P = this.proc, alpha = this.alpha;
      const a = stDesc(this.A, alpha), b = stDesc(this.B, alpha);
      const big = a.sd >= b.sd ? a : b, sml = a.sd >= b.sd ? b : a;
      const Fv = big.sd ** 2 / sml.sd ** 2, d1 = big.n - 1, d2 = sml.n - 1;
      const Fc = finv(1 - alpha / 2, d1, d2), pF = Math.min(1, 2 * (1 - fcdf(Fv, d1, d2))), eq = Fv <= Fc;
      const sp2 = ((a.n - 1) * a.sd ** 2 + (b.n - 1) * b.sd ** 2) / (a.n + b.n - 2);
      const tP = (a.m - b.m) / Math.sqrt(sp2 * (1 / a.n + 1 / b.n)), dfP = a.n + b.n - 2;
      const va = a.sd ** 2 / a.n, vb = b.sd ** 2 / b.n;
      const tW = (a.m - b.m) / Math.sqrt(va + vb);
      const dfW = (va + vb) ** 2 / (va * va / (a.n - 1) + vb * vb / (b.n - 1));
      const tv = eq ? tP : tW, df = eq ? dfP : dfW, p = P.pSide(tv, df);
      const {tc, txt} = P.tCrit(df), rej = P.rejT(tv, tc);
      const uA = uv(esc(this.nA)), uB = uv(esc(this.nB));
      return {
        label: t(eq ? 't-toets, gelijke varianties' : 'Welch-toets, ongelijke varianties'),
        big: `t = ${F(tv, 3)} <small>p = ${lkNumIn(pfmt(p))}</small>`,
        steps: [
          H(`<b>Eerst F-toets op gelijke varianties.</b> F = s²<sub>groot</sub> / s²<sub>klein</sub> = ${g(big.sd, 4)}² / ${g(sml.sd, 4)}² = <b>${f(Fv, 3)}</b>; F<sub>krit</sub> (tweezijdig, df ${d1}; ${d2}) = ${f(Fc, 3)}; p = ${pfmt(pF)} → ${eq ? 'varianties gelijk, gebruik de gepoolde t-toets' : 'varianties verschillen, gebruik de Welch-toets'}.`),
          P.h0(`µ<sub>${uA}</sub> = µ<sub>${uB}</sub>`,
            P.sideTxt(`µ<sub>${uA}</sub> ≠ µ<sub>${uB}</sub>`,
              `µ<sub>${uA}</sub> &gt; µ<sub>${uB}</sub>`, `µ<sub>${uA}</sub> &lt; µ<sub>${uB}</sub>`)),
          eq
            ? H(`<b>Toetsingsgrootheid.</b> s<sub>p</sub> = √(((n₁−1)s₁² + (n₂−1)s₂²)/(n₁+n₂−2)) = ${g(Math.sqrt(sp2), 4)}; t = (x̄₁ − x̄₂) / (s<sub>p</sub>·√(1/n₁ + 1/n₂)) = (${g(a.m, 5)} − ${g(b.m, 5)}) / (${g(Math.sqrt(sp2), 4)}·√(1/${a.n} + 1/${b.n})) = <b>${f(tv, 3)}</b>`)
            : H(`<b>Toetsingsgrootheid.</b> t = (x̄₁ − x̄₂) / √(s₁²/n₁ + s₂²/n₂) = (${g(a.m, 5)} − ${g(b.m, 5)}) / √(${g(a.sd, 4)}²/${a.n} + ${g(b.sd, 4)}²/${b.n}) = <b>${f(tv, 3)}</b>; df (Welch–Satterthwaite) = ${f(dfW, 2)}`),
          H(`<b>Kritieke waarde</b>: t = ${txt}`),
          H(`<b>p-waarde</b> = ${pfmt(p)}`),
          ...P.decide(rej, `De gemiddelden van ${uA} en ${uB} verschillen significant.`,
            `Er is geen significant verschil tussen ${uA} en ${uB} aangetoond.`)],
        kv: [[t('Verschil gemiddelden'), G(a.m - b.m, 4)],
          [t(eq ? 'Ter vergelijking: Welch' : 'Ter vergelijking: gepoold'),
            eq ? `t = ${F(tW, 3)}, df = ${F(dfW, 2)}, p = ${lkNumIn(pfmt(P.pSide(tW, dfW)))}`
              : `t = ${F(tP, 3)}, df = ${F(dfP, 0)}, p = ${lkNumIn(pfmt(P.pSide(tP, dfP)))}`]]
      };
    },
    rTp() {
      const t = this.t, H = this.tHtml, P = this.proc, alpha = this.alpha;
      const d = this.A.map((v, i) => v - this.B[i]), o = stDesc(d, alpha);
      const tv = o.m / o.sem, df = o.n - 1, p = P.pSide(tv, df);
      const {tc, txt} = P.tCrit(df), rej = P.rejT(tv, tc);
      const uA = uv(esc(this.nA)), uB = uv(esc(this.nB));
      return {
        label: t('Gepaarde t-toets'),
        big: `t = ${F(tv, 3)} <small>p = ${lkNumIn(pfmt(p))}</small>`,
        steps: [
          P.h0('µ<sub>d</sub> = 0 (geen verschil per paar)',
            P.sideTxt('µ<sub>d</sub> ≠ 0', 'µ<sub>d</sub> &gt; 0 (A groter)', 'µ<sub>d</sub> &lt; 0 (A kleiner)')),
          H(`<b>Verschillen</b> d = A − B: gemiddelde d̄ = ${g(o.m, 4)}, s<sub>d</sub> = ${g(o.sd, 4)}, n = ${o.n}`),
          H(`<b>Toetsingsgrootheid.</b> t = d̄ / (s<sub>d</sub>/√n) = ${g(o.m, 4)} / (${g(o.sd, 4)}/√${o.n}) = <b>${f(tv, 3)}</b>`),
          H(`<b>Kritieke waarde</b> (tabel 4): t = ${txt}`),
          H(`<b>p-waarde</b> = ${pfmt(p)}`),
          ...P.decide(rej, `Er is een significant verschil tussen ${uA} en ${uB} binnen de paren.`,
            'Er is geen significant verschil binnen de paren aangetoond.')],
        kv: [[t(f((1 - alpha) * 100, 0) + '%-BI van het verschil'),
          `${G(o.ci[0], 4)} – ${G(o.ci[1], 4)}`]]
      };
    },
    rWil() {
      const t = this.t, H = this.tHtml, P = this.proc, alpha = this.alpha, side = this.side;
      const {paired, d0, d, n} = this.wil;
      const {r, ties, tcorr} = rankAbs(d);
      let Wp = 0, Wm = 0;
      d.forEach((v, i) => { if (v > 0) Wp += r[i]; else Wm += r[i]; });
      const Tst = side === '2' ? Math.min(Wp, Wm) : side === 'r' ? Wm : Wp;
      let p, method, crit = NaN;
      if (!ties && n <= 50) {
        const cdf = wilcoxDist(n), c = cdf[Math.floor(Tst + 1e-9)];
        p = side === '2' ? Math.min(1, 2 * c) : c;
        method = 'exact';
        crit = wilcoxCrit(n, side === '2' ? alpha / 2 : alpha);
      } else {
        const m = n * (n + 1) / 4;
        const s = Math.sqrt(n * (n + 1) * (2 * n + 1) / 24 - tcorr / 48), z = (Tst - m + 0.5) / s;
        p = side === '2' ? Math.min(1, 2 * ncdf(z)) : ncdf(z);
        method = 'normale benadering (gelijke waarden)';
        crit = wilcoxCrit(n, side === '2' ? alpha / 2 : alpha);
      }
      const m0 = g(this.mu0, 4);
      return {
        label: t('Wilcoxon-rangtekentoets'),
        big: `T = ${F(Tst, 1)} <small>p = ${lkNumIn(pfmt(p))}</small>`,
        steps: [
          P.h0(paired ? 'de mediaan van de verschillen A − B is 0' : `de mediaan is ${m0}`,
            P.sideTxt('mediaan ≠ 0', 'A groter (mediaan &gt; 0)', 'A kleiner (mediaan &lt; 0)')),
          H(`<b>Rangnummers</b> van |d| (${n} verschillen ≠ 0${d0.length - n ? `, ${d0.length - n} nul weggelaten` : ''}${ties ? `, ${ties}× gelijke waarden → gemiddelde rang` : ''}): W₊ = ${f(Wp, 1)}, W₋ = ${f(Wm, 1)}`),
          H(`<b>Toetsingsgrootheid</b> T = ${side === '2' ? 'min(W₊, W₋)' : side === 'r' ? 'W₋' : 'W₊'} = <b>${f(Tst, 1)}</b>`),
          H(`<b>Kritieke waarde</b> (tabel 11, ${side === '2' ? 'tweezijdig' : 'eenzijdig'}): ${crit >= 0 ? crit : 'niet beschikbaar (n te klein)'}; verwerp H₀ als T ≤ kritieke waarde`),
          H(`<b>p-waarde</b> = ${pfmt(p)} (${method})`),
          ...P.decide(p < alpha, 'Er is een significant verschil.',
            'Er is geen significant verschil aangetoond.')]
      };
    },
    rAnova() {
      const t = this.t, H = this.tHtml, P = this.proc, alpha = this.alpha, AG = this.AG;
      const Rv = anovaCalc(AG, alpha), rej = Rv.F > Rv.Fc, notes = [];
      if (this.desc.some(([, o]) => isFinite(o.lD) && o.lD > o.lC)) {
        notes.push({kind: 'warn',
          html: t('Niet alle groepen lijken normaal verdeeld (Lilliefors); ANOVA veronderstelt normaliteit en gelijke varianties.')});
      }
      return {
        label: t('One-way ANOVA'),
        big: `F = ${F(Rv.F, 3)} <small>p = ${lkNumIn(pfmt(Rv.p))}</small>`,
        steps: [
          P.h0('alle groepsgemiddelden zijn gelijk', 'minstens één gemiddelde wijkt af'),
          H(`<b>Toetsingsgrootheid.</b> F = MS<sub>tussen</sub> / MS<sub>binnen</sub> = ${g(Rv.MSB, 4)} / ${g(Rv.MSW, 4)} = <b>${f(Rv.F, 3)}</b> (df ${Rv.dfB}; ${Rv.dfW})`),
          H(`<b>Kritieke waarde</b> (F-verdeling, eenzijdig): F = ${f(Rv.Fc, 3)}`),
          H(`<b>p-waarde</b> = ${pfmt(Rv.p)}`),
          ...P.decide(rej, 'Minstens één groep verschilt significant; zie de Tukey-vergelijkingen.',
            'Er is geen significant verschil tussen de groepen aangetoond.')],
        anova: {
          cols: [{h: t('Bron')}, {h: 'SS', num: true}, {h: 'df', num: true}, {h: 'MS', num: true},
            {h: 'F', num: true}, {h: 'p', num: true}],
          rows: [[t('Tussen groepen'), G(Rv.SSB, 5), F(Rv.dfB, 0), G(Rv.MSB, 5), F(Rv.F, 3), lkNumIn(pfmt(Rv.p))],
            [t('Binnen groepen'), G(Rv.SSW, 5), F(Rv.dfW, 0), G(Rv.MSW, 5), '', ''],
            [t('Totaal'), G(Rv.SSB + Rv.SSW, 5), F(Rv.N - 1, 0), '', '', '']]
        },
        post: {
          id: 'st-tukey',
          label: H(`Tukey-vergelijkingen (q<sub>krit</sub> = ${f(Rv.qc, 3)})`),
          cols: [{h: t('Vergelijking')}, {h: t('Verschil'), num: true},
            {h: t(f((1 - alpha) * 100, 0) + '%-BI'), num: true}, {h: t('p (Tukey)'), num: true}, {h: ''}],
          rows: Rv.pairs.map(q => [`${esc(V(q.a))} − ${esc(V(q.b))}`, G(q.d, 4),
            `${G(q.lo, 3)} – ${G(q.hi, 3)}`, lkNumIn(pfmt(q.p)),
            `<span class="chip ${q.p < alpha ? 'bad' : 'ok'}">${t(q.p < alpha ? 'verschil' : 'geen')}</span>`])
        },
        kv2: [[t('Effectgrootte η²'), F(Rv.eta, 3)]],
        bars: {AG, R: Rv},
        notes
      };
    },
    /* de invoer van de tweeweg-ANOVA: per regel "niveau A / niveau B: waarden" */
    cells() {
      return this.two.split('\n').map(l => {
        const m = l.match(/^([^:]+):(.*)$/);
        if (!m) return null;
        const parts = m[1].split('/').map(x => x.trim());
        return parts.length === 2 ? {a: parts[0], b: parts[1], v: stNums(m[2])} : null;
      }).filter(c => c && c.v.length);
    },
    rAnova2() {
      const t = this.t, H = this.tHtml, alpha = this.alpha;
      const fa = this.fa || 'A', fb = this.fb || 'B';
      const Rv = anova2(this.cells), notes = [];
      const row = (nm, o) => [nm, G(o.ss, 5), F(o.df, 0), G(o.ms, 5),
        o.F != null ? F(o.F, 3) : '', o.p != null ? lkNumIn(pfmt(o.p)) : '',
        o.p != null ? `<span class="chip ${o.p < alpha ? 'bad' : 'ok'}">${t(o.p < alpha ? 'significant' : 'niet sign.')}</span>` : ''];
      if (Rv.ab.p < alpha) {
        notes.push({kind: 'warn', html: t('De interactie is significant: het effect van de ene '
          + 'factor hangt af van de andere. Interpreteer de hoofdeffecten voorzichtig.')});
      }
      return {
        label: t('Tweeweg-ANOVA'),
        big: H(`${Rv.A.length} × ${Rv.B.length} <small>n = ${Rv.n} per combinatie</small>`),
        anova: {
          id: 'st-a2',
          cols: [{h: t('Bron')}, {h: 'SS', num: true}, {h: 'df', num: true}, {h: 'MS', num: true},
            {h: 'F', num: true}, {h: 'p', num: true}, {h: ''}],
          rows: [row(esc(V(fa)), Rv.a), row(esc(V(fb)), Rv.b),
            row(t('Interactie ' + uv(esc(V(fa))) + ' × ' + uv(esc(V(fb)))), Rv.ab),
            row(t('Rest (binnen)'), Rv.e)]
        },
        cells: {
          label: t('Celgemiddelden'),
          cols: [{h: `${esc(V(fa))} \\ ${esc(V(fb))}`}].concat(Rv.B.map(b => ({h: esc(V(b)), num: true}))),
          rows: Rv.A.map((a, i) => [esc(V(a))].concat(Rv.cm[i].map(v => G(v, 4))))
        },
        notes,
        formula: H(`F = MS<sub>effect</sub> / MS<sub>rest</sub>; kritieke F (α = ${f(alpha, 2)}): `
          + `${f(finv(1 - alpha, Rv.a.df, Rv.e.df), 3)} voor ${uv(esc(V(fa)))}, `
          + `${f(finv(1 - alpha, Rv.b.df, Rv.e.df), 3)} voor ${uv(esc(V(fb)))}, `
          + `${f(finv(1 - alpha, Rv.ab.df, Rv.e.df), 3)} voor de interactie`)
      };
    },
    /* de regressie: de helling, het intercept en de twee tekeningen */
    reg() {
      const n = Math.min(this.A.length, this.B.length), alpha = this.alpha;
      if (n < 3) return null;
      const X = this.A.slice(0, n), Y = this.B.slice(0, n), r = linreg(X, Y), mx = mean(X);
      const sxx = X.reduce((s, x) => s + (x - mx) ** 2, 0);
      const res = Y.map((y, i) => y - (r.a + r.b * X[i]));
      const syx = Math.sqrt(res.reduce((s, e) => s + e * e, 0) / (n - 2));
      const seb = syx / Math.sqrt(sxx), sea = syx * Math.sqrt(1 / n + mx * mx / sxx);
      const tb = r.b / seb, pb = 2 * (1 - tcdf(Math.abs(tb), n - 2)), tq = tinv(1 - alpha / 2, n - 2);
      return {n, X, Y, r, mx, sxx, res, syx, seb, sea, tb, pb, tq};
    },
    rReg() {
      const t = this.t, H = this.tHtml, alpha = this.alpha, m = this.reg;
      const {n, r, syx, seb, sea, tb, pb, tq} = m, notes = [];
      if (pb >= alpha) {
        notes.push({kind: 'info', html: t('De helling is niet significant van 0 verschillend.')});
      }
      return {
        label: t('Lineaire regressie'),
        big: H(`y = ${g(r.a, 4)} ${r.b < 0 ? '−' : '+'} ${g(Math.abs(r.b), 4)}·x <small>R² = ${f(r.r2, 4)}</small>`),
        kv: [[t('Helling b'), `${G(r.b, 4)} ± ${G(seb, 3)} (SE)`],
          [t(f((1 - alpha) * 100, 0) + '%-BI helling'), `${G(r.b - tq * seb, 4)} – ${G(r.b + tq * seb, 4)}`],
          [t('Intercept a'), `${G(r.a, 4)} ± ${G(sea, 3)} (SE)`],
          [t(f((1 - alpha) * 100, 0) + '%-BI intercept'), `${G(r.a - tq * sea, 4)} – ${G(r.a + tq * sea, 4)}`],
          [H('Reststandaardafwijking s<sub>y·x</sub>'), G(syx, 4)],
          [t('Toets helling ≠ 0'), t(`t = ${f(tb, 3)}, df = ${n - 2}, p = ${pfmt(pb)}`)],
          [t('Correlatie r'), F(Math.sign(r.b) * Math.sqrt(r.r2), 4)]],
        canvas: 'st-rcv',
        canvas2: {id: 'st-rescv', label: t('Residuen')},
        notes
      };
    },
    /* de power: het benodigde aantal en de curve erbij */
    power() {
      const d = num(this.pd) / num(this.psd), pw = (num(this.pw) || 80) / 100;
      const two = this.side === '2', ty = this.ptype, alpha = this.alpha;
      if (!(d > 0) || !(pw > 0 && pw < 1)) return null;
      let n = 2;
      while (n < 100000 && powerT(n, d, alpha, two, ty) < pw) n = n < 50 ? n + 1 : Math.ceil(n * 1.05);
      if (n > 50) {
        let lo = Math.floor(n / 1.05) - 1, hi = n;
        while (hi - lo > 1) {
          const mid = Math.floor((lo + hi) / 2);
          if (powerT(mid, d, alpha, two, ty) >= pw) hi = mid; else lo = mid;
        }
        n = hi;
      }
      const curve = [];
      for (let k = 2; k <= Math.max(10, Math.ceil(n * 2)); k += Math.max(1, Math.round(n / 40))) {
        curve.push([k, powerT(k, d, alpha, two, ty) * 100]);
      }
      return {d, pw, two, ty, n, curve};
    },
    rPower() {
      const t = this.t, H = this.tHtml, alpha = this.alpha, m = this.power;
      const {d, two, ty, n} = m;
      return {
        label: t(ty === '2' ? 'Benodigd aantal per groep' : 'Benodigd aantal paren / metingen'),
        big: H(`n = ${n} <small>${ty === '2' ? `(totaal ${2 * n})` : ''}</small>`),
        kv: [[t('Effectgrootte d = verschil / SD'), F(d, 3)],
          [t('Werkelijke power bij n = ' + n), F(powerT(n, d, alpha, two, ty) * 100, 1) + ' %'],
          [t('α, toetsing'), t(`${f(alpha, 2)}, ${two ? 'tweezijdig' : 'eenzijdig'}`)]],
        canvas: 'st-pcv',
        formula: H('Power uit de niet-centrale t-verdeling met niet-centraliteit '
          + (ty === '2' ? 'd·√(n/2)' : 'd·√n') + ' (zoals G*Power en statsmodels). '
          + 'Cohen: d = 0,2 klein, 0,5 middel, 0,8 groot.')
      };
    },
    /* de χ²-toets: één regel aantallen is een aanpassingstoets, meer regels een kruistabel */
    chi() {
      const lines = this.obs.split('\n').map(stNums).filter(r => r.length);
      if (!lines.length) return null;
      const alpha = this.alpha;
      let chi = 0, df, rows = [], warn = false, yates = NaN, err = null;
      if (lines.length === 1) {
        const O = lines[0], k = O.length, tot = O.reduce((a, b) => a + b, 0);
        let ex = stNums(this.exp);
        if (!ex.length) ex = O.map(() => 1);
        if (ex.length !== k) return {err: {n: ex.length, k}};
        const es = ex.reduce((a, b) => a + b, 0), E = ex.map(v => v / es * tot);
        df = k - 1;
        O.forEach((o, i) => {
          const c = (o - E[i]) ** 2 / E[i];
          chi += c;
          if (E[i] < 5) warn = true;
          rows.push([i + 1, o, E[i], c]);
        });
      } else {
        const c = Math.max(...lines.map(r => r.length));
        if (lines.some(r => r.length !== c)) return {err: {cols: true}};
        const Rt = lines.map(r => r.reduce((a, b) => a + b, 0));
        const C = [...Array(c).keys()].map(j => lines.reduce((a, r) => a + r[j], 0));
        const N = Rt.reduce((a, b) => a + b, 0);
        df = (lines.length - 1) * (c - 1);
        yates = 0;
        lines.forEach((r, i) => r.forEach((o, j) => {
          const e = Rt[i] * C[j] / N, x = (o - e) ** 2 / e;
          chi += x;
          yates += (Math.max(0, Math.abs(o - e) - 0.5)) ** 2 / e;
          if (e < 5) warn = true;
          rows.push([[i + 1, j + 1], o, e, x]);
        }));
      }
      return {lines, chi, df, rows, warn, yates, p: 1 - chicdf(chi, df),
        cc: chiinv(1 - alpha, df), err};
    },
    rChi() {
      const t = this.t, H = this.tHtml, P = this.proc, alpha = this.alpha, m = this.chi;
      const one = m.lines.length === 1, rej = m.chi > m.cc, notes = [];
      if (m.warn) {
        notes.push({kind: 'warn', html: t('Eén of meer verwachte aantallen zijn kleiner dan 5; '
          + 'de χ²-benadering is dan onbetrouwbaar. Voeg categorieën samen of gebruik een exacte toets.')});
      }
      if (m.lines.length === 2 && m.lines[0].length === 2) {
        notes.push({kind: 'info', html: t('2×2-tabel met Yates-correctie: χ² = ' + f(m.yates, 3)
          + ', p = ' + pfmt(1 - chicdf(m.yates, 1)) + '.')});
      }
      return {
        label: t('χ²-toets'),
        big: `χ² = ${F(m.chi, 3)} <small>p = ${lkNumIn(pfmt(m.p))}</small>`,
        steps: [
          P.h0(one ? 'de waargenomen verdeling volgt de verwachte verhouding'
            : 'rij- en kolomvariabele zijn onafhankelijk',
            one ? 'de verdeling wijkt af' : 'er is samenhang'),
          H(`<b>Toetsingsgrootheid.</b> χ² = Σ (O − E)² / E = <b>${f(m.chi, 3)}</b>, df = ${m.df}`),
          H(`<b>Kritieke waarde</b> (tabel 7): χ² = ${f(m.cc, 3)}`),
          H(`<b>p-waarde</b> = ${pfmt(m.p)}`),
          ...P.decide(rej,
            one ? 'De waarnemingen wijken significant af van de verwachte verhouding.'
              : 'Er is een significante samenhang.',
            one ? 'De waarnemingen passen bij de verwachte verhouding.'
              : 'Er is geen significante samenhang aangetoond.')],
        anova: {
          cols: [{h: t('Cel')}, {h: t('Waargenomen O'), num: true}, {h: t('Verwacht E'), num: true},
            {h: H('(O − E)²/E'), num: true}],
          rows: m.rows.map(r => [Array.isArray(r[0]) ? t('Rij ' + r[0][0] + ', kolom ' + r[0][1])
            : t('Categorie ' + r[0]), F(r[1], 2), F(r[2], 2), F(r[3], 3)])
        },
        notes
      };
    },
    rKw() {
      const t = this.t, H = this.tHtml, P = this.proc, alpha = this.alpha, AG = this.AG;
      const Rv = kwCalc(AG, alpha), rej = Rv.p < alpha, notes = [];
      if (AG.some(x => x.v.length < 5)) {
        notes.push({kind: 'info',
          html: t('Bij groepen kleiner dan 5 is de χ²-benadering voor H minder nauwkeurig.')});
      }
      return {
        label: t('Kruskal-Wallis-toets'),
        big: `H = ${F(Rv.H, 3)} <small>p = ${lkNumIn(pfmt(Rv.p))}</small>`,
        steps: [
          P.h0('alle groepen komen uit dezelfde verdeling (gelijke medianen)', 'minstens één groep wijkt af'),
          H(`<b>Rangnummers</b> over alle ${Rv.N} waarnemingen samen${Rv.ties ? ` (gelijke waarden krijgen de gemiddelde rang; correctiefactor ${f(Rv.C, 4)})` : ''}; gemiddelde rang per groep: ${AG.map((x, i) => `${esc(x.name)} ${f(Rv.mr[i], 2)}`).join(', ')}`),
          H(`<b>Toetsingsgrootheid.</b> H = 12/(N(N+1)) · Σ Rᵢ²/nᵢ − 3(N+1)${Rv.ties ? ', gedeeld door de correctiefactor' : ''} = <b>${f(Rv.H, 3)}</b>, df = ${Rv.k - 1}`),
          H(`<b>Kritieke waarde</b> (χ², tabel 7): ${f(Rv.Hc, 3)}`),
          H(`<b>p-waarde</b> = ${pfmt(Rv.p)} (χ²-benadering)`),
          ...P.decide(rej, 'Minstens één groep verschilt significant; zie de Dunn-vergelijkingen.',
            'Er is geen significant verschil tussen de groepen aangetoond.')],
        post: {
          id: 'st-dunn',
          label: t('Dunn-vergelijkingen (Bonferroni-correctie, ' + Rv.pairs.length + ' vergelijkingen)'),
          cols: [{h: t('Vergelijking')}, {h: t('Verschil gem. rang'), num: true}, {h: 'z', num: true},
            {h: 'p', num: true}, {h: t('p (Bonferroni)'), num: true}, {h: ''}],
          rows: Rv.pairs.map(q => [`${esc(V(q.a))} − ${esc(V(q.b))}`, F(q.d, 2), F(q.z, 3),
            lkNumIn(pfmt(q.p)), lkNumIn(pfmt(q.padj)),
            `<span class="chip ${q.padj < alpha ? 'bad' : 'ok'}">${t(q.padj < alpha ? 'verschil' : 'geen')}</span>`])
        },
        notes
      };
    }
  },
  mounted() { this.draw(); },
  updated() { this.draw(); },
  methods: {
    lkNum(v) { return lkNumIn(v); },
    /* welke panelen bij de gekozen toets horen; dit deed stShow() met data-st-show */
    shown(list) { return list.split(' ').includes(this.test); },
    /* de staafjes van de ANOVA en, zolang ze nog uit index.html komen, de tekeningen van
       regressie en power */
    draw() {
      const T = this.test;
      try {
        if (T === 'anova' && this.R.bars) {
          const cv = document.getElementById('stb-cv');
          if (cv) stBars(cv, this.R.bars.AG, this.R.bars.R, this.alpha, this.err, this.ns, this.plot);
        } else if (T === 'reg' && this.reg && !this.problem) {
          this.drawReg();
        } else if (T === 'power' && this.power && !this.problem) {
          this.drawPower();
        }
      } catch (e) {}
    },
    /* de regressielijn met het betrouwbaarheids- en voorspellingsinterval, en de residuen */
    drawReg() {
      const alpha = this.alpha, {n, X, Y, r, mx, sxx, res, syx, tq} = this.reg;
      const cv = document.getElementById('st-rcv'), cv2 = document.getElementById('st-rescv');
      if (!cv || !cv2) return;
      const x0 = Math.min(...X), x1 = Math.max(...X), pad = (x1 - x0) * 0.05;
      const band = (x, k) => r.a + r.b * x + k * tq * syx * Math.sqrt(1 / n + (x - mx) ** 2 / sxx);
      const pband = (x, k) => r.a + r.b * x + k * tq * syx * Math.sqrt(1 + 1 / n + (x - mx) ** 2 / sxx);
      const ys = [...Y, pband(x0 - pad, -1), pband(x1 + pad, 1), pband(x0 - pad, 1), pband(x1 + pad, -1)];
      chart(cv, {xmin: x0 - pad, xmax: x1 + pad, ymin: Math.min(...ys), ymax: Math.max(...ys),
        xlabel: this.na || 'x', ylabel: this.nb || 'y',
        series: [{fn: x => r.a + r.b * x, name: 'regressielijn'},
          {fn: x => band(x, 1), color: '--accent', dash: [3, 3], name: 'BI boven'},
          {fn: x => band(x, -1), color: '--accent', dash: [3, 3], name: 'BI onder'},
          {fn: x => pband(x, 1), color: '--muted', dash: [6, 4], name: 'PI boven'},
          {fn: x => pband(x, -1), color: '--muted', dash: [6, 4], name: 'PI onder'},
          {pts: X.map((x, i) => [x, Y[i]]), color: '--ink', name: 'meting'}],
        legend: [['regressielijn', '--accent'],
          [`${f((1 - alpha) * 100, 0)}%-BI (gemiddelde)`, '--accent'],
          ['voorspellingsinterval', '--muted']]});
      const rm = Math.max(...res.map(Math.abs)) * 1.2 || 1;
      chart(cv2, {xmin: x0 - pad, xmax: x1 + pad, ymin: -rm, ymax: rm, h: 200,
        xlabel: 'x', ylabel: 'residu',
        series: [{pts: X.map((x, i) => [x, res[i]]), color: '--ink', name: 'residu'},
          {fn: () => 0, color: '--muted', name: 'nul'}]});
    },
    /* de powercurve met de gewenste power als streeplijn */
    drawPower() {
      const cv = document.getElementById('st-pcv');
      if (!cv) return;
      const {pw, ty, curve} = this.power;
      chart(cv, {xmin: 2, xmax: curve[curve.length - 1][0], ymin: 0, ymax: 100,
        xlabel: ty === '2' ? 'n per groep' : 'n', ylabel: 'power (%)',
        series: [{pts: curve, name: 'power', r: 2.5},
          {fn: () => pw * 100, color: '--bad', dash: [5, 4], name: 'doel'}]});
    }
  }
};
</script>
