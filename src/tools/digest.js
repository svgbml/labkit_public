/* ================= RESTRICTIEDIGESTIE =================
   Vierde tool op Vue 3 (zie lib/bridge.js), declaratief opgebouwd met de gedeelde componenten uit lib/ui.js, met keuzelijsten uit data en
   een veld dat alleen bij een dubbele digestie te zien is. Het rekenwerk is onveranderd.

   De enzymnaam is zelf de waarde van de optie, dus hij mag niet vertaald worden: in de
   template staat `:value="k"` naast de tekst, zodat de waarde los staat van wat er te lezen
   is. Het type uiteinde erachter is wel gewone tekst en gaat door t().

   De id's dg-c, dg-ng, dg-v, dg-e1, dg-u1, dg-e2, dg-u2, dg-upg, dg-n, dg-x, dg-bsa en
   dg-out blijven zoals ze waren. */
import {lkVueMount, lkNumIn} from '../lib/bridge.js';

const DGE={BamHI:['5′-overhang',37],EcoRI:['5′-overhang',37],HindIII:['5′-overhang',37],PstI:['3′-overhang',37],NdeI:['5′-overhang',37],XhoI:['5′-overhang',37],NotI:['5′-overhang',37],SmaI:['stomp (blunt)',25],'ander enzym':['zie productinformatie',37]};

const DG_TPL = `<div class="grid2">
  <div class="panel">
    <div class="fields">
      <lk-field v-model="c" :label="t('Concentratie DNA')" for-id="dg-c" unit="ng/µL"/>
      <lk-field v-model="ng" :label="t('DNA per reactie')" for-id="dg-ng" unit="ng"/>
      <lk-field v-model="v" :label="t('Reactievolume')" for-id="dg-v" unit="µL"/>
      <div class="f"><label for="dg-e1">{{ t('Enzym 1') }}</label><select id="dg-e1" v-model="e1"><option v-for="k in enzymes" :key="k" :value="k">{{ k }}</option></select></div>
      <lk-field v-model="u1" :label="t('Activiteit enzym 1')" for-id="dg-u1" unit="U/µL"/>
      <div class="f"><label for="dg-e2">{{ t('Enzym 2 (dubbele digestie)') }}</label><select id="dg-e2" v-model="e2"><option value="">{{ t('geen (enkele digestie)') }}</option><option v-for="k in enzymes" :key="k" :value="k">{{ k }}</option></select></div>
      <lk-field v-show="e2" v-model="u2" :label="t('Activiteit enzym 2')" for-id="dg-u2" unit="U/µL"/>
      <lk-field v-model="upg" :label="t('Enzym per µg DNA')" for-id="dg-upg" unit="U"/>
      <lk-field v-model="n" :label="t('Aantal reacties')" for-id="dg-n" inputmode="numeric"/>
      <lk-field v-model="x" :label="t('Extra marge')" for-id="dg-x" unit="%"/>
      <label class="chk" for="dg-bsa"><input type="checkbox" id="dg-bsa" v-model="bsa"> {{ t('BSA toevoegen (100× stock)') }}</label>
    </div>
    <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Eén unit knipt 1 µg DNA in 1 uur in 50 µL; 5–10 U per µg geeft een ruime overmaat. Controleer in de buffertabel van de fabrikant welke buffer beide enzymen van een dubbele digestie verdragen. Voorbeelddata zijn verzonnen.') }}</p>
  </div>
  <div class="result"><div id="dg-out">
    <lk-note v-if="!valid" kind="info">{{ t('Vul DNA-concentratie, hoeveelheid DNA, reactievolume en de enzymactiviteit in.') }}</lk-note>
    <template v-else>
      <lk-big :label="headLabel" :value="volText" :sub="t('per reactie')"/>
      <lk-kv :rows="rows"/>
      <lk-table :cols="cols" :rows="mixRows"/>
      <lk-note v-if="warnStar" kind="bad">{{ warnStar }}</lk-note>
      <lk-note v-if="warnFit" kind="bad">{{ warnFit }}</lk-note>
      <lk-note v-if="warnSmall" kind="info">{{ warnSmall }}</lk-note>
      <lk-steps :steps="steps"/>
      <lk-formula :html="tHtml('V&lt;sub&gt;enzym&lt;/sub&gt; = U per µg × µg DNA / (U/µL) · glycerol = V&lt;sub&gt;enzym&lt;/sub&gt;/V × 50%')"/>
    </template>
  </div></div>
</div>`;

const dgVue = lkVueMount('#dg-app', {
  template: DG_TPL,
  data() { return {c: lkNumIn('250'), ng: lkNumIn('1000'), v: lkNumIn('50'), e1: 'EcoRI', u1: lkNumIn('20'),
    e2: 'HindIII', u2: lkNumIn('20'), upg: lkNumIn('10'), n: '4', x: lkNumIn('10'), bsa: false}; },
  computed: {
    enzymes() { return Object.keys(DGE); },
    /* alle afgeleide maten op een plek, zodat elke regel hieronder er alleen uit leest */
    m() {
      const c = num(this.c), ng = num(this.ng), V = num(this.v);
      const u1 = num(this.u1), u2 = num(this.u2), upg = num(this.upg);
      const n = Math.round(num(this.n)) || 1, x = (num(this.x) || 0) / 100;
      const U = upg * ng / 1000, vd = ng / c, v1 = U / u1, v2 = this.e2 ? U / u2 : 0;
      const vb = V / 10, vbsa = this.bsa ? V / 100 : 0, enz = v1 + v2;
      return {c, ng, V, u1, u2, upg, n, x, U, vd, v1, v2, vb, vbsa, enz,
        water: V - vd - vb - vbsa - enz, mult: n * (1 + x), gly: enz / V * 50};
    },
    valid() {
      const m = this.m;
      return [m.c, m.ng, m.V, m.u1, m.upg].every(a => a > 0) && (!this.e2 || m.u2 > 0) && m.n <= 1000;
    },
    volText() { return lkNumIn(vol(this.m.V)); },
    headLabel() {
      return this.e2 ? this.t('Dubbele digestie') + ' · ' + this.e1 + ' + ' + this.e2
        : this.t('Enkele digestie') + ' · ' + this.e1;
    },
    rows() {
      const t = this.t, m = this.m, F = (a, d) => lkNumIn(fmt(a, d)), VL = a => lkNumIn(vol(a));
      const inc = this.e2 && DGE[this.e2][1] !== DGE[this.e1][1]
        ? t('1 uur bij ' + DGE[this.e1][1] + ' °C en daarna bij ' + DGE[this.e2][1] + ' °C (verschillende optima: na elkaar incuberen)')
        : t('1 uur bij ' + DGE[this.e1][1] + ' °C');
      return [[t('Enzym per reactie'), `${F(m.U, 1)} ${t('U per enzym')}`],
        [t('Enzymvolume'), `${VL(m.enz)} (${F(m.enz / m.V * 100, 1)}% ${t('van het volume')})`],
        [t('Glycerol in de reactie'), F(m.gly, 1) + '%'],
        [`${t('Uiteinden')} ${this.e1}`, t(DGE[this.e1][0])],
        this.e2 ? [`${t('Uiteinden')} ${this.e2}`, t(DGE[this.e2][0])] : null,
        [t('Incubatie'), inc]].filter(Boolean);
    },
    cols() {
      return [{h: this.t('Component')}, {h: this.t('Per reactie'), num: true},
        {h: this.t('Mastermix') + ' (' + lkNumIn(fmt(this.m.mult, 1)) + '×)', num: true}];
    },
    mixRows() {
      const t = this.t, m = this.m, F = (a, d) => lkNumIn(fmt(a, d)), VL = a => lkNumIn(vol(a));
      const L = [[t('Milli-Q'), m.water, 1], [t('10× buffer'), m.vb, 1],
        ...(this.bsa ? [[t('BSA (100×)'), m.vbsa, 1]] : []),
        [`${this.e1} (${F(m.u1, 0)} U/µL)`, m.v1, 1],
        ...(this.e2 ? [[`${this.e2} (${F(m.u2, 0)} U/µL)`, m.v2, 1]] : []),
        [t('DNA (apart per buis)'), m.vd, 0]];
      return [...L.map(l => [l[0], VL(l[1]), l[2] ? VL(l[1] * m.mult) : '–']),
        {cls: 'hl', cells: [t('Mastermix per buis'), VL(m.V - m.vd), VL((m.V - m.vd) * m.mult)]}];
    },
    warnStar() {
      const m = this.m; if (m.enz / m.V <= 0.1) return '';
      return this.t('Star-activiteit: het enzymvolume is ' + lkNumIn(fmt(m.enz / m.V * 100, 1))
        + '% van de reactie (glycerol ' + lkNumIn(fmt(m.gly, 1))
        + '%). Houd het onder 10% (glycerol onder 5%): gebruik minder enzym of een groter reactievolume.');
    },
    warnFit() {
      return this.m.water < 0
        ? this.t('De componenten passen niet in het reactievolume: het DNA is te verdund of het volume te klein.') : '';
    },
    warnSmall() {
      const m = this.m;
      return Math.min(m.v1, m.v2 || 9) < 0.5
        ? this.t('Per reactie minder dan 0,5 µL enzym: pipetteer het enzym via de mastermix of verdun het in de bijbehorende verdunningsbuffer.') : '';
    },
    steps() {
      const t = this.t, m = this.m, VL = a => lkNumIn(vol(a));
      return [t('Maak de mastermix op ijs; voeg het enzym als laatste toe en meng door pipetteren (niet vortexen).'),
        t('Verdeel de mix (' + uv(VL(m.V - m.vd)) + ') per buis en voeg het DNA (' + uv(VL(m.vd)) + ') toe.'),
        t('Incubeer en stop de reactie met laadbuffer of door hitte-inactivatie volgens de productinformatie.')];
    }
  }
});
calc.digest = () => {};
