<!-- ================= RESTRICTIEDIGESTIE =================
     Keuzelijsten uit data, en een veld dat alleen meekomt bij een dubbele digestie.

     De enzymnaam is zelf de waarde van de optie, dus hij mag niet vertaald worden: `:value="k"`
     staat los van wat er te lezen is. Het type uiteinde erachter is wel gewone tekst en gaat
     door t().

     De id's dg-c, dg-ng, dg-v, dg-e1, dg-u1, dg-e2, dg-u2, dg-upg, dg-n, dg-x, dg-bsa en
     dg-out blijven zoals ze waren. -->
<template>
  <div class="stack">
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <lk-field v-model="c" :label="t('Concentratie DNA')" for-id="dg-c" unit="ng/µL"/>
        <lk-field v-model="ng" :label="t('DNA per reactie')" for-id="dg-ng" unit="ng"/>
        <lk-field v-model="v" :label="t('Reactievolume')" for-id="dg-v" unit="µL"/>
        <div class="f">
          <label for="dg-e1">{{ t('Enzym 1') }}</label>
          <select id="dg-e1" v-model="e1">
            <option v-for="k in enzymes" :key="k" :value="k">{{ k === 'ander enzym' ? t(k) : k }}</option>
          </select>
        </div>
        <lk-field v-model="u1" :label="t('Activiteit enzym 1')" for-id="dg-u1" unit="U/µL"/>
        <div class="f">
          <label for="dg-e2">{{ t('Enzym 2 (dubbele digestie)') }}</label>
          <select id="dg-e2" v-model="e2">
            <option value="">{{ t('geen (enkele digestie)') }}</option>
            <option v-for="k in enzymes" :key="k" :value="k">{{ k === 'ander enzym' ? t(k) : k }}</option>
          </select>
        </div>
        <lk-field v-show="e2" v-model="u2" :label="t('Activiteit enzym 2')" for-id="dg-u2" unit="U/µL"/>
        <lk-field v-model="upg" :label="t('Enzym per µg DNA')" for-id="dg-upg" unit="U"/>
        <lk-field v-model="n" :label="t('Aantal reacties')" for-id="dg-n" inputmode="numeric"/>
        <lk-field v-model="x" :label="t('Extra marge')" for-id="dg-x" unit="%"/>
        <lk-overage v-model="ov" for-id="dg-ov" :why="m.why"/>
        <label class="chk" for="dg-bsa">
          <input type="checkbox" id="dg-bsa" v-model="bsa"> {{ t('BSA toevoegen (100× stock)') }}
        </label>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Eén unit knipt 1 µg DNA in 1 uur in 50 µL; 5–10 U per µg geeft een ruime overmaat. Controleer in de buffertabel van de fabrikant welke buffer beide enzymen van een dubbele digestie verdragen. Voorbeelddata zijn verzonnen.') }}</p>
    </div>
    <div class="result">
      <div id="dg-out">
        <lk-note v-if="!valid" kind="info">{{ t('Vul DNA-concentratie, hoeveelheid DNA, reactievolume en de enzymactiviteit in.') }}</lk-note>
        <template v-else>
          <lk-big :label="headLabel" :value="volText" :sub="t('per reactie')"/>
          <lk-kv :rows="rows"/>
          <lk-table :cols="cols" :rows="mixRows"/>
          <lk-note v-if="warnStar" kind="bad">{{ warnStar }}</lk-note>
          <lk-note v-if="warnFit" kind="bad">{{ warnFit }}</lk-note>
          <lk-note v-if="warnBuf" kind="warn">{{ warnBuf }}</lk-note>
          <lk-note v-if="warnSmall" kind="info">{{ warnSmall }}</lk-note>
          <lk-steps :steps="steps"/>
          <lk-formula :html="tHtml('V<sub>enzym</sub> = U per µg × µg DNA / (U/µL) · glycerol = V<sub>enzym</sub>/V × 50%')"/>
        </template>
      </div>
    </div>
  </div>
  <!-- in-silico digestie (S45): knipt een geplakte sequentie met enzym 1 (en 2) hierboven -->
  <div class="grid2">
    <div class="panel">
      <h3>{{ t('In-silico digestie') }}</h3>
      <div class="f"><label for="dg-seq">{{ t('Sequentie (of FASTA)') }}</label>
        <textarea id="dg-seq" class="mono" rows="5" v-model="seq" spellcheck="false"></textarea></div>
      <label class="chk" for="dg-circ" style="margin-top:8px">
        <input type="checkbox" id="dg-circ" v-model="circ"> {{ t('Circulair (plasmide)') }}</label>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Knipt met de enzymen die hierboven gekozen zijn. Herkenningsplaatsen en knipposities volgens REBASE, zoals NEBcutter; methylering (Dam/Dcm) blokkeert sommige plaatsen en wordt niet meegerekend.') }}</p>
    </div>
    <div class="result" id="dg-frag">
      <lk-note v-if="!dig" kind="info">{{ t('Plak een sequentie om de fragmenten te zien.') }}</lk-note>
      <template v-else>
        <lk-big :label="t('Fragmenten')" :value="String(dig.frags.length)" :sub="F(dig.L, 0) + ' bp ' + t(circ ? 'circulair' : 'lineair')"/>
        <lk-table :cols="cutCols" :rows="cutRows"/>
        <lk-table :cols="fragCols" :rows="fragRows"/>
        <lk-note v-for="(x, i) in digNotes" :key="i" :kind="x[0]">{{ x[1] }}</lk-note>
        <div class="row" style="margin-top:8px">
          <button type="button" id="dg-togel" @click="toGel">{{ t('Stuur naar de Gelplanner') }}</button></div>
      </template>
    </div>
  </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';
import {overage} from '../lib/overage.js';
import {ENZ, enzInfo, cuts, digest} from '../lib/digest.js';
import {cleanTemplate} from '../lib/primer.js';

/* type uiteinde, temperatuur en buffer per enzym: src/lib/digest.js (S45) */
const ENZS = [...Object.keys(ENZ), 'ander enzym'];
const F = (a, d) => lkNumIn(fmt(a, d)), VL = a => lkNumIn(vol(a));

export default {
  name: 'Digest',
  data() {
    return {c: lkNumIn('250'), ng: lkNumIn('1000'), v: lkNumIn('50'), e1: 'EcoRI', u1: lkNumIn('20'),
      e2: 'HindIII', u2: lkNumIn('20'), upg: lkNumIn('10'), n: '4', x: lkNumIn('10'), ov: 'pct', bsa: false,
      seq: '', circ: true};
  },
  mounted() {
    matRegister('digest', () => {
      const m = this.m;
      if (!this.valid) return [];
      return [...this.mixRows.filter(r => !r.cls).map(r => [r[0], r[2] === '–' ? r[1] : r[2]]),
        [trPlain('Reactiebuisjes'), '× ' + fmt(m.n, 0)]];
    });
  },
  methods: {
    F,
    /* een laan in de Gelplanner met de fragmenten als verwachte banden (lk-etable zet push()) */
    toGel() {
      const T = window.TBLDEF && TBLDEF['gp-tbl']; if (!T || !T.push || !this.dig) return;
      const name = this.dig.names.map(e => (e === 'ander enzym' ? trPlain(e) : e)).join(' + ');
      T.push([name, '10', this.dig.frags.map(f => f.size).sort((a, b) => b - a).join(' '), '#1558b0']);
      location.hash = 'gplan';
    }
  },
  computed: {
    enzymes() { return ENZS; },
    /* alle afgeleide maten op een plek, zodat elke regel hieronder er alleen uit leest */
    m() {
      const c = num(this.c), ng = num(this.ng), V = num(this.v);
      const u1 = num(this.u1), u2 = num(this.u2), upg = num(this.upg);
      const n = Math.round(num(this.n)) || 1, x = (num(this.x) || 0) / 100;
      const ovg = overage(n, this.ov, num(this.x) || 0);
      const U = upg * ng / 1000, vd = ng / c, v1 = U / u1, v2 = this.e2 ? U / u2 : 0;
      const vb = V / 10, vbsa = this.bsa ? V / 100 : 0, enz = v1 + v2;
      return {c, ng, V, u1, u2, upg, n, x, U, vd, v1, v2, vb, vbsa, enz,
        water: V - vd - vb - vbsa - enz, mult: ovg.mult, why: ovg.why, gly: enz / V * 50};
    },
    valid() {
      const m = this.m;
      return [m.c, m.ng, m.V, m.u1, m.upg].every(a => a > 0) && (!this.e2 || m.u2 > 0) && m.n <= 1000;
    },
    volText() { return VL(this.m.V); },
    headLabel() {
      return this.e2 ? this.t('Dubbele digestie') + ' · ' + this.e1 + ' + ' + this.e2
        : this.t('Enkele digestie') + ' · ' + this.e1;
    },
    rows() {
      const t = this.t, m = this.m;
      const i1 = enzInfo(this.e1), i2 = this.e2 ? enzInfo(this.e2) : null;
      const inc = i2 && i2.temp !== i1.temp
        ? t('1 uur bij ' + i1.temp + ' °C en daarna bij ' + i2.temp + ' °C (verschillende optima: na elkaar incuberen)')
        : t('1 uur bij ' + i1.temp + ' °C');
      return [[t('Enzym per reactie'), `${F(m.U, 1)} ${t('U per enzym')}`],
        [t('Enzymvolume'), `${VL(m.enz)} (${F(m.enz / m.V * 100, 1)}% ${t('van het volume')})`],
        [t('Glycerol in de reactie'), F(m.gly, 1) + '%'],
        [`${t('Uiteinden')} ${this.e1}`, t(i1.end)],
        i2 ? [`${t('Uiteinden')} ${this.e2}`, t(i2.end)] : null,
        i1.buf ? [`${t('Buffer')} ${this.e1}`, i1.buf] : null,
        i2 && i2.buf ? [`${t('Buffer')} ${this.e2}`, i2.buf] : null,
        [t('Incubatie'), inc]].filter(Boolean);
    },
    /* dubbele digestie: dezelfde aanbevolen buffer? (de temperatuur staat in de incubatieregel) */
    warnBuf() {
      if (!this.e2) return '';
      const a = enzInfo(this.e1).buf, b = enzInfo(this.e2).buf;
      return a && b && a !== b ? this.t('De enzymen hebben niet dezelfde aanbevolen buffer (' + uv(a) + ' en ' + uv(b)
        + '): knip na elkaar met een zuivering ertussen, of kies met de NEB Double Digest Finder een buffer waarin beide genoeg activiteit hebben.') : '';
    },
    /* ---------- in-silico digestie (S45): één keer knippen, tabellen en meldingen lezen hieruit ---------- */
    dig() {
      const s = cleanTemplate(this.seq);
      if (s.length < 10) return null;
      const names = [this.e1, this.e2].filter((e, i, a) => e && a.indexOf(e) === i);
      return {L: s.length, names, cuts: names.map(e => ({e, p: cuts(s, e, this.circ)})), frags: digest(s, names, this.circ)};
    },
    cutCols() { return [{h: this.t('Enzym')}, {h: this.t('Knipplaatsen'), num: true}, {h: this.t('Posities'), num: true}]; },
    cutRows() {
      return this.dig.cuts.map(c => [c.e === 'ander enzym' ? this.t(c.e) : c.e, String(c.p.length),
        c.p.length ? c.p.slice(0, 12).map(p => F(p + 1, 0)).join(', ') + (c.p.length > 12 ? ', …' : '') : '–']);
    },
    fragCols() { return [{h: this.t('Fragment'), num: true}, {h: this.t('Van–tot'), num: true}, {h: this.t('Uiteinden')}]; },
    /* grootste eerst, zoals ze op de gel van boven naar beneden staan */
    fragRows() {
      const end = x => x || this.t('einde');
      return this.dig.frags.slice().sort((a, b) => b.size - a.size).map(f => [F(f.size, 0) + ' bp',
        f.uncut ? '–' : F(f.from, 0) + '–' + F(f.to, 0), f.uncut ? this.t('ongeknipt') : end(f.left) + ' / ' + end(f.right)]);
    },
    digNotes() {
      const d = this.dig, t = this.t, out = [];
      d.cuts.forEach(c => {
        if (c.e === 'ander enzym') out.push(['info', t('Voor een ander enzym is geen herkenningsplaats bekend.')]);
        else if (!c.p.length) out.push(['warn', t(uv(c.e) + ' knipt niet in deze sequentie.')]);
      });
      if (d.frags[0].uncut && this.circ) out.push(['info', t('Ongeknipt plasmide loopt als supercoiled, open-circulaire en lineaire vorm, niet op zijn eigen lengte.')]);
      if (d.frags.some(f => f.size < 100)) out.push(['info', t('Fragmenten kleiner dan 100 bp zijn op een agarosegel slecht te zien.')]);
      return out;
    },
    cols() {
      return [{h: this.t('Component')}, {h: this.t('Per reactie'), num: true},
        {h: this.t('Mastermix') + ' (' + F(this.m.mult, 1) + '×)', num: true}];
    },
    mixRows() {
      const t = this.t, m = this.m;
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
      return this.t('Star-activiteit: het enzymvolume is ' + F(m.enz / m.V * 100, 1)
        + '% van de reactie (glycerol ' + F(m.gly, 1)
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
      const t = this.t, m = this.m;
      return [t('Maak de mastermix op ijs; voeg het enzym als laatste toe en meng door pipetteren (niet vortexen).'),
        t('Verdeel de mix (' + uv(VL(m.V - m.vd)) + ') per buis en voeg het DNA (' + uv(VL(m.vd)) + ') toe.'),
        t('Incubeer en stop de reactie met laadbuffer of door hitte-inactivatie volgens de productinformatie.')];
    }
  }
};
</script>
