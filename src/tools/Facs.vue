<!-- ================= FLOWCYTOMETRIE (PANEL & CONTROLES) =================
     Antilichaamcocktail uit de titratie, de controlebuisjes, de stain index en de absolute
     celconcentratie met telbeads. Het rekenwerk is dat van de oude calc.facs() in
     tools/nt/95_facs.js, alleen de weergave is opnieuw opgebouwd met de gedeelde componenten.

     De antilichamen staan in een <lk-etable>; de toevoegknop blijft van de tool. De id's fc-n,
     fc-x, fc-v, fc-tbl, fc-tbl-add, fc-mp, fc-mn, fc-sd, fc-ce, fc-be, fc-bc, fc-bv, fc-sv en
     fc-out blijven zoals ze waren. -->
<template>
  <div class="stack">
    <div class="panel">
      <div class="fields">
        <lk-field v-model="n" :label="t('Aantal monsters')" for-id="fc-n" inputmode="numeric"/>
        <lk-field v-model="x" :label="t('Overmaat')" for-id="fc-x" unit="%"/>
        <div class="f">
          <label for="fc-xmode">&nbsp;</label>
          <select id="fc-xmode" :aria-label="t('Overmaat')" v-model="xmode">
            <option value="pct">{{ t('%') }}</option><option value="rx">{{ t('+ reacties') }}</option>
          </select>
        </div>
        <lk-field v-model="v" :label="t('Kleuringsvolume per test')" for-id="fc-v" unit="µL"/>
      </div>
      <lk-etable table-id="fc-tbl" :cols="cols" v-model:rows="rows" add-id="fc-tbl-add"/>
      <div class="row" style="margin-top:8px">
        <button type="button" id="fc-tbl-add" @click="addRow">{{ t('+ Antilichaam') }}</button>
      </div>
      <h3 style="margin:16px 0 6px;font-size:14px">{{ t('Stain index') }}</h3>
      <div class="fields">
        <lk-field v-model="mp" :label="t('MFI positief')" for-id="fc-mp"/>
        <lk-field v-model="mn" :label="t('MFI negatief')" for-id="fc-mn"/>
        <lk-field v-model="sd" :label="t('SD negatief')" for-id="fc-sd"/>
      </div>
      <h3 style="margin:16px 0 6px;font-size:14px">{{ t('Telbeads') }}</h3>
      <div class="fields">
        <lk-field v-model="ce" :label="t('Events cellen')" for-id="fc-ce"/>
        <lk-field v-model="be" :label="t('Events beads')" for-id="fc-be"/>
        <lk-field v-model="bc" :label="t('Concentratie beads')" for-id="fc-bc" unit="beads/µL"/>
        <lk-field v-model="bv" :label="t('Volume beads')" for-id="fc-bv" unit="µL"/>
        <lk-field v-model="sv" :label="t('Volume monster')" for-id="fc-sv" unit="µL"/>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Titratie als verdunning 1:x in het kleuringsvolume (uit je eigen titratie of het datasheet). FMO = alle antilichamen behalve één; zet "ja" bij markers waarvan de grens tussen positief en negatief lastig te leggen is. Voorbeelddata zijn verzonnen.') }}</p>
    </div>
    <div class="result"><div id="fc-out">
      <template v-if="m">
        <lk-big :label="m.rx ? t('Cocktail voor ' + n1 + ' monsters + ' + fmt(m.xr, 0) + ' extra') : t('Cocktail voor ' + n1 + ' monsters + ' + fmt(m.x * 100, 0) + '%')" :value="L(vol(m.V * m.m))" :sub="t('totaal')"/>
        <lk-note kind="info">{{ t('Mix voor ' + fmt(m.m, 1) + ' reacties: ' + m.n + ' + ' + fmt(m.m - m.n, 1) + ' extra.') }}</lk-note>
        <lk-table :cols="mixCols" :rows="mixRows"/>
        <lk-note v-if="m.buf < 0" kind="bad">{{ t('De antilichamen samen zijn meer dan het kleuringsvolume; vergroot het volume of verlaag de hoeveelheden.') }}</lk-note>
        <lk-note v-if="m.fl.length < m.A.length" kind="bad">{{ t('Twee antilichamen hebben hetzelfde fluorochroom; dat is in één buis niet te onderscheiden.') }}</lk-note>
        <div class="lbl" style="margin-top:14px">{{ t('Controlebuisjes') }}</div>
        <lk-table :cols="ctrlCols" :rows="ctrlRows" :wrap="false"/>
      </template>
      <lk-note v-else kind="info">{{ t('Vul het aantal monsters, het kleuringsvolume en minstens één antilichaam met titratie in.') }}</lk-note>
      <template v-if="si != null">
        <lk-big :label="t('Stain index')" :value="L(sig(si, 3))" top="14px"/>
        <lk-kv :rows="[[t('Signaal / achtergrond'), ratio]]"/>
      </template>
      <template v-if="cnt">
        <lk-big :label="t('Absolute celconcentratie')" :value="L(sig(cnt.c, 3))" :sub="t('cellen/µL')" top="14px"/>
        <lk-kv :rows="[[t('Per mL'), L(sci(cnt.c * 1000, 3))], [t('Beads toegevoegd'), L(fmt(cnt.beads, 0))]]"/>
        <lk-note v-if="cnt.few" kind="info">{{ t('Minder dan 1000 bead-events: neem meer events op voor een betrouwbare telling.') }}</lk-note>
      </template>
      <lk-formula :html="tHtml('V&lt;sub&gt;antilichaam&lt;/sub&gt; = V&lt;sub&gt;test&lt;/sub&gt; / titratie · SI = (MFI&lt;sub&gt;pos&lt;/sub&gt; − MFI&lt;sub&gt;neg&lt;/sub&gt;) / (2·SD&lt;sub&gt;neg&lt;/sub&gt;)')"/>
    </div></div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

/* een getal dat de component zelf opmaakt (fmt, sig, sci, vol) in de taal van de gebruiker */
const L = lkNumIn;

export default {
  name: 'Facs',
  data() {
    return {
      n: '12', x: '10', xmode: 'pct', v: '50',
      rows: [['CD3', 'FITC', '100', 'nee'], ['CD4', 'PE', '200', 'nee'], ['CD8', 'APC', '100', 'nee'],
        ['CD25', 'PE-Cy7', '50', 'ja'], ['CD127', 'BV421', '50', 'ja'], ['Viability', '7-AAD', '100', 'nee']],
      mp: '18500', mn: '210', sd: '95',
      ce: '24500', be: '5200', bc: '1000', bv: '50', sv: '100'
    };
  },
  computed: {
    cols() {
      const t = this.t;
      return [{h: t('Marker'), t: 'txt', w: 110}, {h: t('Fluorochroom'), t: 'txt', w: 120},
        {h: t('Titratie 1:'), t: 'num', w: 70}, {h: t('FMO-controle'), t: 'sel', o: ['nee', 'ja']}];
    },
    /* aantal monsters, overmaat en de antilichamen; zelfde voorwaarden als de oude calc.facs() */
    m() {
      const n = Math.round(num(this.n)), xr = num(this.x) || 0, x = xr / 100, V = num(this.v), rx = this.xmode === 'rx';
      const A = this.rows.map(r => ({m: r[0] || '?', f: r[1] || '?', t: num(r[2]), fmo: r[3] === 'ja'})).filter(a => a.t >= 1);
      if (!(n >= 1 && n <= 5000 && V > 0 && A.length)) return null;
      A.forEach(a => { a.v = V / a.t; });
      const m = rx ? n + xr : n * (1 + x), ab = A.reduce((s, a) => s + a.v, 0);
      return {n, x, xr, rx, V, A, m, ab, buf: V - ab, fl: [...new Set(A.map(a => a.f))], fmo: A.filter(a => a.fmo)};
    },
    n1() { return this.m ? this.m.n : ''; },
    mixCols() {
      const t = this.t;
      return [{h: t('Antilichaam')}, {h: t('Titratie'), num: true}, {h: t('Per test'), num: true},
        {h: t('Cocktail (' + fmt(this.m.m, 1) + '×)'), num: true}];
    },
    mixRows() {
      const {A, m, buf, V} = this.m, t = this.t;
      return [...A.map(a => [ud(a.m) + ' ' + ud(a.f), '1:' + L(fmt(a.t, 0)), L(vol(a.v)), L(vol(a.v * m))]),
        [t('FACS-buffer'), '', L(vol(buf)), L(vol(buf * m))],
        {cells: [t('Totaal'), '', L(vol(V)), L(vol(V * m))], cls: 'hl'}];
    },
    ctrlCols() {
      const t = this.t;
      return [{h: t('Controle')}, {h: t('Aantal'), num: true}, {h: t('Inhoud')}];
    },
    ctrlRows() {
      const {n, V, A, ab, fmo} = this.m, t = this.t, th = this.tHtml;
      const nc = 1 + A.length + fmo.length;
      return [[t('Ongekleurd'), '1', t('cellen in ' + vol(V) + ' FACS-buffer')],
        ...A.map(a => [th('Single-stain ' + ud(a.f)), '1',
          th(vol(a.v) + ' ' + ud(a.m) + ' + ' + vol(V - a.v) + ' buffer')]),
        ...fmo.map(a => [th('FMO zonder ' + ud(a.m)), '1',
          th(ud(A.filter(b => b !== a).map(b => L(vol(b.v)) + ' ' + b.m).join(', ')) + ' + ' + vol(V - (ab - a.v)) + ' buffer')]),
        {cells: [t('Buisjes totaal'), n + 1 + A.length + fmo.length, t(n + ' monsters + ' + nc + ' controles')], cls: 'hl'}];
    },
    /* stain index = (MFI pos − MFI neg) / (2 × SD neg) */
    si() {
      const mp = num(this.mp), mn = num(this.mn), sdn = num(this.sd);
      return isFinite(mp) && isFinite(mn) && sdn > 0 ? (mp - mn) / (2 * sdn) : null;
    },
    ratio() { const mp = num(this.mp), mn = num(this.mn); return mn > 0 ? L(fmt(mp / mn, 1)) : '–'; },
    /* absolute celconcentratie met telbeads */
    cnt() {
      const ce = num(this.ce), be = num(this.be), bc = num(this.bc), bv = num(this.bv), sv = num(this.sv);
      if (!(ce >= 0 && be > 0 && bc > 0 && bv > 0 && sv > 0)) return null;
      return {c: ce / be * bc * bv / sv, beads: bc * bv, few: be < 1000};
    }
  },
  methods: {
    L, fmt, sig, sci, vol,
    addRow() { this.rows = [...this.rows, ['', '', '', 'nee']]; }
  }
};
</script>
