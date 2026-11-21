<!-- ================= ANTIBIOTICA-GEVOELIGHEID: MIC EN REMZONES =================
     MIC uit een microdilutiereeks en S/I/R-interpretatie van MIC's en remzones (EUCAST, ISO
     20776-1). Het rekenwerk is dat van de oude calc.mic() in web/index.html (micOf, de groei-
     parsing met de OD-grens, de S/I/R-regels); alleen de weergave is opnieuw opgebouwd.

     Beide tabellen (mi-tbl en mz-tbl) zijn een <lk-etable>; de toevoegknoppen blijven van de
     tool. De id's mi-c0, mi-f, mi-n, mi-u, mi-od, mi-tbl, mi-add, mi-out, mz-tbl, mz-add en
     mz-out blijven zoals ze waren. -->
<template>
  <div class="stack">
    <div class="grid2">
      <div class="panel">
        <h3>{{ t('MIC (microdilutie)') }}</h3>
        <div class="fields">
          <lk-field v-model="c0" :label="t('Hoogste concentratie (put 1)')" for-id="mi-c0"/>
          <lk-field v-model="f" :label="t('Verdunningsfactor')" for-id="mi-f"/>
          <lk-field v-model="n" :label="t('Aantal putjes')" for-id="mi-n" inputmode="numeric"/>
          <lk-field v-model="u" :label="t('Eenheid')" for-id="mi-u" inputmode="text" cls="txt"/>
          <div class="f" data-expert="">
            <label for="mi-od">{{ t('Groei bij OD ≥') }}</label>
            <input id="mi-od" inputmode="decimal" v-model="od">
          </div>
        </div>
        <div style="margin-top:12px">
          <lk-etable table-id="mi-tbl" :cols="miCols" v-model:rows="miRows" add-id="mi-add"/>
        </div>
        <div class="row" style="margin-top:10px">
          <button type="button" id="mi-add" @click="addMi">{{ t('+ Rij') }}</button>
        </div>
        <p style="font-size:13px;color:var(--muted);margin:10px 0 0"
          v-html="tHtml('Groei per putje van hoog naar laag: &lt;span class=&quot;mono&quot;&gt;− − − − + + + + + +&lt;/span&gt; of OD-waarden. Breekpunten in dezelfde eenheid; leeg laten = alleen MIC.')"></p>
      </div>
      <div class="result" id="mi-out">
        <lk-note v-if="!micRows.length" kind="info">{{ t('Vul per rij de groei per putje in.') }}</lk-note>
        <template v-else>
          <div class="lbl">{{ t('Concentratiereeks') }}</div>
          <div class="mono" style="font-size:12.5px;margin-bottom:10px">{{ concText }}</div>
          <lk-table :cols="micCols" :rows="micOut" :wrap="false"/>
          <lk-formula :html="tHtml('MIC = laagste concentratie zonder zichtbare groei · S als MIC ≤ S-breekpunt, R als MIC &amp;gt; R-breekpunt, anders I')"/>
        </template>
      </div>
    </div>
    <div class="grid2">
      <div class="panel">
        <h3>{{ t('Remzones (disk-diffusie)') }}</h3>
        <lk-etable table-id="mz-tbl" :cols="mzCols" v-model:rows="mzRowsData" add-id="mz-add"/>
        <div class="row" style="margin-top:10px">
          <button type="button" id="mz-add" @click="addMz">{{ t('+ Antibioticum') }}</button>
        </div>
        <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('De voorbeeldbreekpunten zijn verzonnen; neem altijd de waarden uit de actuele EUCAST-breekpuntentabel voor jouw micro-organisme en diskinhoud.') }}</p>
      </div>
      <div class="result" id="mz-out">
        <lk-note v-if="!zones.length" kind="info">{{ t('Vul zonediameters in.') }}</lk-note>
        <template v-else>
          <lk-table :cols="mzOutCols" :rows="mzOut" :wrap="false"/>
          <lk-formula :html="tHtml('S als zone ≥ S-breekpunt · R als zone &amp;lt; R-breekpunt · anders I')"/>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const L = lkNumIn;

/* de voorbeeldrijen van de oude MIDATA/MZDATA */
const MIDATA = [['E. coli – ampicilline', '- - - - - + + + + +', '8', '8'],
  ['E. coli – ciprofloxacine', '- - - - - - - - - +', '0,25', '0,5'],
  ['S. aureus – gentamicine', '- - - - - - + + + +', '1', '1']];
const MZDATA = [['Antibioticum A (10 µg)', '24', '20', '17'], ['Antibioticum B (30 µg)', '15', '20', '17'],
  ['Antibioticum C (5 µg)', '18', '20', '17']];

/* een voorbeeldrij in de taal van de gebruiker: de naam vertaald (zoals de oude invoerlaag deed),
   de getallen met een decimaalpunt in het Engels */
const ex = r => r.map((v, i) => (i === 0 && typeof trPlain === 'function' ? trPlain(v) : lkNumIn(v)));

/* gr: true = groei, van hoog naar laag */
function micOf(gr, conc) {
  let mic = NaN, skip = false;
  const firstGrowth = gr.findIndex(g => g);
  if (firstGrowth < 0) return {mic: conc[gr.length - 1], lt: true, skip: false};
  if (firstGrowth === 0) return {mic: conc[0], gt: true, skip: gr.slice(1).some(g => !g)};
  mic = conc[firstGrowth - 1]; skip = gr.slice(firstGrowth).some(g => !g);
  return {mic, skip};
}

export default {
  name: 'Mic',
  data() {
    return {
      c0: '64', f: '2', n: '10', u: 'mg/L', od: lkNumIn('0,1'),
      miRows: MIDATA.map(ex), mzRowsData: MZDATA.map(ex)
    };
  },
  computed: {
    miCols() {
      const t = this.t;
      return [{h: t('Isolaat / antibioticum'), t: 'txt', w: 180},
        {h: t("Groei per putje (+/− of OD's)"), t: 'txt', w: 220},
        {h: 'S ≤', t: 'num', w: 60}, {h: 'R &gt;', t: 'num', w: 60}];
    },
    mzCols() {
      const t = this.t;
      return [{h: t('Antibioticum (disk)'), t: 'txt', w: 180}, {h: t('Zone (mm)'), t: 'num', w: 60},
        {h: t('S ≥ (mm)'), t: 'num', w: 60}, {h: this.esc(t('R < (mm)')), t: 'num', w: 60}];
    },
    /* de concentratiereeks en de rijen met groei */
    conc() {
      const c0 = num(this.c0), f = num(this.f) || 2;
      const n = Math.max(2, Math.min(24, Math.round(num(this.n) || 10)));
      return {n, list: [...Array(n).keys()].map(i => c0 / f ** i)};
    },
    concText() { return this.conc.list.map(v => L(sig(v, 3))).join(' · ') + ' ' + this.u; },
    micRows() {
      const odT = num(this.od);
      return this.miRows.map(r => {
        const raw = String(r[1]).trim();
        let gr;
        if (/[+\-−]/.test(raw) && !/\d/.test(raw)) {
          gr = raw.replace(/\s+/g, '').replace(/−/g, '-').split('').filter(ch => ch === '+' || ch === '-').map(ch => ch === '+');
        } else gr = stNums(raw).map(v => v >= odT);
        return {name: r[0], gr, s: num(r[2]), r: num(r[3])};
      }).filter(r => r.gr.length);
    },
    micCols() {
      const t = this.t;
      return [{h: t('Isolaat / antibioticum')}, {h: this.tHtml('MIC (' + ud(this.u) + ')'), num: true},
        {h: t('Interpretatie')}, {h: t('Opmerking')}];
    },
    micOut() {
      const {n, list} = this.conc, t = this.t;
      return this.micRows.map(r => {
        const g = r.gr.slice(0, n), m = micOf(g, list);
        let cat = '';
        if (isFinite(r.s) || isFinite(r.r)) {
          if (m.gt) cat = isFinite(r.r) && m.mic >= r.r ? 'R' : '?';
          else if (m.lt) cat = isFinite(r.s) && m.mic <= r.s ? 'S' : '?';
          else cat = isFinite(r.s) && m.mic <= r.s ? 'S' : isFinite(r.r) && m.mic > r.r ? 'R' : 'I';
        }
        const rem = [m.skip ? t('overgeslagen putje (groei na een put zonder groei): herhaal') : '',
          m.gt ? t('groei in alle putjes') : '', m.lt ? t('geen groei in de reeks') : '',
          g.length < n ? t(g.length + ' van ' + n + ' putjes ingevuld') : ''].filter(Boolean).join('; ');
        return [esc(r.name), '<b>' + (m.gt ? '&gt; ' : m.lt ? '≤ ' : '') + L(sig(m.mic, 3)) + '</b>',
          this.chip(cat), '<span style="font-size:12.5px">' + esc(rem) + '</span>'];
      });
    },
    zones() {
      return this.mzRowsData.map(r => ({n: r[0], z: num(r[1]), s: num(r[2]), r: num(r[3])}))
        .filter(x => isFinite(x.z));
    },
    mzOutCols() {
      const t = this.t;
      return [{h: t('Antibioticum')}, {h: t('Zone (mm)'), num: true}, {h: t('Interpretatie')}];
    },
    mzOut() {
      return this.zones.map(x => {
        const c = isFinite(x.s) && x.z >= x.s ? 'S' : isFinite(x.r) && x.z < x.r ? 'R'
          : (isFinite(x.s) || isFinite(x.r)) ? 'I' : '';
        return [esc(x.n), L(fmt(x.z, 0)), this.chip(c)];
      });
    }
  },
  methods: {
    /* de S/I/R-chip van de oude sirChip() */
    chip(c) {
      return c === '?' ? '<span class="chip info">' + this.t('reeks te kort') + '</span>'
        : c === 'S' ? '<span class="chip ok">S</span>' : c === 'R' ? '<span class="chip bad">R</span>'
        : c === 'I' ? '<span class="chip warn">I</span>' : '–';
    },
    addMi() { this.miRows = [...this.miRows, ['', '', '', '']]; },
    addMz() { this.mzRowsData = [...this.mzRowsData, ['', '', '', '']]; }
  }
};
</script>
