<!-- ================= SPECTROFOTOMETRIE =================
     Twee panelen met elk een uitkomst: Lambert-Beer (A = ε·c·l, of de verwachte absorbantie als
     A leeg is) en de eiwitconcentratie uit A₂₈₀ met ε₂₈₀ volgens Pace. De berekening staat
     ongewijzigd in de computed m(). Een sequentie in #sp-seq vult W, Y en de molmassa; dat was
     een losse listener in index.html en is nu een watcher. Een lege sequentie laat de aantallen
     staan. De id's sp-a, sp-e, sp-l, sp-c, sp-df, sp-seq, sp-nw, sp-ny, sp-nc, sp-mw, sp-a280,
     sp-out en sp-pout blijven zoals ze waren; data-expert blijft op weglengte en verdunning. -->
<template>
  <div class="stack">
    <div class="grid2">
      <div class="panel">
        <h3 v-html="hLB"></h3>
        <div class="fields">
          <lk-field v-model="a" for-id="sp-a" :label="t('Absorbantie A')"/>
          <lk-field v-model="e" for-id="sp-e" :label="t('ε (M⁻¹·cm⁻¹)')"/>
          <lk-field v-model="l" for-id="sp-l" :label="t('Weglengte')" unit="cm" data-expert=""/>
          <div class="f"><label for="sp-c">{{ t('Concentratie') }}</label>
            <div class="inu"><input id="sp-c" inputmode="decimal" v-model="c" :placeholder="t('berekenen')"><span class="u">mM</span></div></div>
          <lk-field v-model="df" for-id="sp-df" :label="t('Verdunningsfactor')" data-expert=""/>
        </div>
        <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Laat A of de concentratie leeg; dat veld wordt berekend.') }}</p>
        <details style="margin-top:10px"><summary style="cursor:pointer;font-size:13px">{{ t('Golflengte en ε van een test') }}</summary>
          <div class="f" style="margin-top:8px"><label for="sp-pre">{{ t('Voorinstelling') }}</label>
            <select id="sp-pre" v-model="pre" @change="usePre">
              <option value="">–</option>
              <option v-for="(p, i) in PRE" :key="i" :value="i">{{ preName(p) }} ({{ p.nm }} nm)</option>
            </select></div>
          <lk-note v-if="cur" kind="info">{{ preNote }}</lk-note>
        </details>
      </div>
      <div class="result" id="sp-out">
        <template v-if="m.mode === 'conc'">
          <lk-big :label="t('Concentratie (onverdund)')" :value="m.cmM" sub="mM"/>
          <lk-kv :rows="m.kv"/>
          <lk-note v-if="m.high" kind="warn">{{ t('A boven ±1,5 valt buiten het lineaire bereik van de meeste fotometers; verdun en meet opnieuw.') }}</lk-note>
          <lk-note v-else-if="m.low" kind="warn">{{ t('Erg lage absorbantie; de meetfout is relatief groot.') }}</lk-note>
          <lk-formula :html="t('c = A / (ε · l) × verdunning')"/>
        </template>
        <template v-else-if="m.mode === 'abs'">
          <lk-big :label="t('Verwachte absorbantie')" :value="m.aExp"/>
          <lk-formula :html="t('A = ε · c · l / verdunning')"/>
        </template>
        <lk-note v-else kind="info">{{ t('Vul A of de concentratie in, plus ε.') }}</lk-note>
      </div>
    </div>
    <div class="grid2">
      <div class="panel">
        <h3>{{ t('Eiwit uit A₂₈₀') }}</h3>
        <div class="f"><label for="sp-seq">{{ t('Aminozuursequentie (één-lettercode) of alleen aantallen hieronder') }}</label>
          <textarea id="sp-seq" rows="3" spellcheck="false" :placeholder="t('MKWVTFISLLFLFSSAYS…')" v-model="seq"></textarea></div>
        <div class="fields" style="margin-top:10px">
          <lk-field v-model="nw" for-id="sp-nw" :label="t('Trp (W)')" inputmode="numeric"/>
          <lk-field v-model="ny" for-id="sp-ny" :label="t('Tyr (Y)')" inputmode="numeric"/>
          <lk-field v-model="nc" for-id="sp-nc" :label="t('Cystines (S–S)')" inputmode="numeric"/>
          <lk-field v-model="mw" for-id="sp-mw" :label="t('Molmassa')" unit="g/mol"/>
          <lk-field v-model="a280" for-id="sp-a280" :label="t('A₂₈₀ (gemeten)')"/>
        </div>
        <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Plak je een sequentie, dan worden W, Y en de molmassa ingevuld; het aantal cystines (zwavelbruggen) vul je zelf in. De voorbeeldaantallen zijn alleen ter illustratie.') }}</p>
      </div>
      <div class="result" id="sp-pout">
        <template v-if="m.p">
          <lk-big :label="t('Eiwitconcentratie')" :value="m.p.mgml" sub="mg/mL"/>
          <lk-kv :rows="m.p.kv"/>
          <lk-note v-if="m.p.noW" kind="warn">{{ t('Zonder tryptofaan is A₂₈₀ onnauwkeurig (fout tot ±10%); overweeg Bradford of BCA.') }}</lk-note>
          <lk-formula :html="t('ε = 5500·W + 1490·Y + 125·cystines · c (mg/mL) = A / (ε·l) × M')"/>
        </template>
        <lk-note v-else kind="info">{{ t('Vul aantallen W, Y en cystines in of plak een sequentie.') }}</lk-note>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

/* getallen in de taal van de gebruiker: de DOM-vertaallaag komt niet in een Vue-boom */
const F = (x, d) => lkNumIn(fmt(x, d));
const S = (x, s) => lkNumIn(sig(x, s));
const N = v => lkNumIn(String(v).replace('.', ','));

/* golflengte (nm) en molaire ε (M⁻¹·cm⁻¹) per test. NADH/NADPH 340 nm, 6220: Horecker & Kornberg, J Biol Chem 1948;175:385
   en Bergmeyer, Methods of Enzymatic Analysis. p-Nitrofenol 405 nm, 18 300 bij alkalische pH (pH > 9): Sigma-Aldrich
   p-nitrophenyl-fosfaat-protocol. Bradford 595 nm (Bradford 1976), BCA 562 nm (Smith e.a. 1985), Lowry 750 nm (Lowry e.a.
   1951): kleurtests zonder vaste ε, die een ijkcurve nodig hebben (tool Standaardcurve). */
const PRE = [{n: 'NADH', nm: 340, eps: 6220}, {n: 'NADPH', nm: 340, eps: 6220}, {n: 'p-nitrofenol (alkalisch)', nm: 405, eps: 18300},
  {n: 'Bradford', nm: 595}, {n: 'BCA', nm: 562}, {n: 'Lowry', nm: 750}];

export default {
  name: 'Spec',
  data() {
    return {pre: '', PRE, a: N('0,311'), e: N(6220), l: N(1), c: '', df: N(1), seq: '', nw: N(2), ny: N(20), nc: N(17), mw: N(66430), a280: N('0,45')};
  },
  computed: {
    cur() { return this.pre === '' ? null : PRE[this.pre]; },
    preNote() {
      const p = this.cur, t = this.t;
      return p.eps ? t('Meet bij ' + p.nm + ' nm; ε = ' + p.eps + ' M⁻¹·cm⁻¹ is ingevuld.')
        : t('Meet bij ' + p.nm + ' nm. Deze test heeft geen vaste ε: maak een ijkcurve met de tool Standaardcurve.');
    },
    hLB() { return this.tHtml('Lambert-Beer <span class="example">voorbeeld: NADH bij 340 nm</span>'); },
    /* alle maten van beide uitkomsten: één keer berekend, de rest van de component leest hieruit */
    m() {
      const t = this.t;
      const A = num(this.a), e = num(this.e), l = num(this.l) || 1, df = num(this.df) || 1, cin = num(this.c);
      const m = {mode: 'none', p: null};
      if (isFinite(A) && e > 0) {
        const c = A / (e * l) * df;
        m.mode = 'conc'; m.cmM = S(c * 1e3, 4);
        m.kv = [[t('In de cuvet'), S(A / (e * l) * 1e6, 4) + ' µM'], [t('Onverdund'), S(c * 1e6, 4) + ' µM'], [t('Verdunningsfactor'), F(df, 2)]];
        m.high = A > 1.5; m.low = !m.high && A < 0.05;
      } else if (isFinite(cin) && e > 0) {
        const a = cin / 1e3 * e * l / df;
        m.mode = 'abs'; m.aExp = F(a, 3);
      }
      const nW = num(this.nw) || 0, nY = num(this.ny) || 0, nC = num(this.nc) || 0, mw = num(this.mw), a280 = num(this.a280);
      const eps = 5500 * nW + 1490 * nY + 125 * nC, abs01 = mw > 0 ? eps / mw : NaN, mgml = a280 / (eps * l) * mw * df;
      if (eps > 0) {
        m.p = {mgml: isFinite(mgml) ? S(mgml, 3) : '–', noW: nW === 0,
          kv: [['ε₂₈₀', F(eps, 0) + ' M⁻¹·cm⁻¹'], [t('A₂₈₀ van 1 mg/mL (Abs 0,1%)'), isFinite(abs01) ? F(abs01, 3) : '–'], [t('Molair'), isFinite(a280) ? S(a280 / (eps * l) * df * 1e6, 4) + ' µM' : '–']]};
      }
      return m;
    }
  },
  methods: {
    preName(p) { return p.n.startsWith('p-') ? this.t(p.n) : p.n; },
    usePre() { if (this.cur && this.cur.eps) this.e = N(this.cur.eps); }
  },
  watch: {
    /* een sequentie vult W, Y en de molmassa; een lege sequentie laat de aantallen staan */
    seq(v) {
      const s = v.toUpperCase().replace(/[^A-Z]/g, ''); if (!s) return;
      const c = ch => (s.match(new RegExp(ch, 'g')) || []).length;
      this.nw = String(c('W')); this.ny = String(c('Y'));
      const mw = [...s].reduce((a, ch) => a + (AAM[ch] || 0), 0) + 18.015;
      this.mw = lkNumIn(String(Math.round(mw * 100) / 100).replace('.', ','));
    }
  }
};
</script>
