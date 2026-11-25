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
        <lk-field v-model="x" :label="t('Extra marge')" for-id="fc-x" unit="%"/>
        <lk-overage v-model="ov" for-id="fc-ov" :why="m && m.why"/>
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
        <lk-big :label="t(ov === 'plus1' ? 'Cocktail voor ' + n1 + ' monsters + 1 extra' : ov === 'none' ? 'Cocktail voor ' + n1 + ' monsters, geen overmaat' : 'Cocktail voor ' + n1 + ' monsters + ' + fmt(m.x * 100, 0) + '%')" :value="L(vol(m.V * m.m))" :sub="t('totaal')"/>
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
    <!-- S94 (#139): de populaties uit een export van FlowJo of FACSDiva, met telbeads omgerekend naar cellen/µL -->
    <div class="panel" style="grid-column:1/-1">
      <h3 style="margin:0 0 6px;font-size:14px">{{ t('Populaties uit FlowJo of FACSDiva') }}</h3>
      <div class="f">
        <label for="fc-fl">{{ t('Plak de tabel of kies het bestand') }}</label>
        <textarea id="fc-fl" rows="4" v-model="fl" style="width:100%"></textarea>
      </div>
      <div class="row" style="margin-top:6px;gap:6px">
        <button type="button" id="fc-flb" @click="$refs.fl.click()">{{ t('Bestand…') }}</button>
        <input ref="fl" id="fc-flf" type="file" accept=".csv,.txt,.tsv" hidden @change="flFile">
      </div>
      <p style="font-size:13px;color:var(--muted);margin:8px 0 0">{{ t('FlowJo: Table Editor, opslaan als CSV, met Freq. of Parent en Count. FACSDiva: populatiestatistiek met Population, #Events en %Parent. Een populatie met "bead" in de naam en een aantal telt als telbeads; dan staan de cellen/µL eronder, met de bead-gegevens hierboven.') }}</p>
      <lk-note v-if="fl.trim() && !fr.samples.length" kind="bad">{{ t('Geen export van FlowJo of FACSDiva herkend.') }}</lk-note>
      <template v-if="fr.samples.length">
        <div class="lbl" style="margin-top:10px">{{ t('% van de ouderpopulatie') }}</div>
        <lk-table table-id="fc-fltbl" :cols="flCols" :rows="flRows"/>
        <template v-if="flAbs">
          <div class="lbl" style="margin-top:10px">{{ t('Cellen/µL (telbeads)') }}</div>
          <lk-table table-id="fc-flabs" :cols="flAbs.cols" :rows="flAbs.rows"/>
        </template>
      </template>
    </div>
  </div>
</template>

<script>
import {pipHtml} from '../lib/pip.js';
import {lkNumIn} from '../lib/bridge.js';
import {overage} from '../lib/overage.js';
import {flowRead} from '../lib/flowread.js';

/* een getal dat de component zelf opmaakt (fmt, sig, sci, vol) in de taal van de gebruiker */
const L = lkNumIn;

export default {
  name: 'Facs',
  data() {
    return {
      n: '12', x: '10', ov: 'pct', v: '50',
      rows: [['CD3', 'FITC', '100', 'nee'], ['CD4', 'PE', '200', 'nee'], ['CD8', 'APC', '100', 'nee'],
        ['CD25', 'PE-Cy7', '50', 'ja'], ['CD127', 'BV421', '50', 'ja'], ['Viability', '7-AAD', '100', 'nee']],
      mp: '18500', mn: '210', sd: '95',
      ce: '24500', be: '5200', bc: '1000', bv: '50', sv: '100', fl: ''
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
      const n = Math.round(num(this.n)), x = (num(this.x) || 0) / 100, V = num(this.v);
      const A = this.rows.map(r => ({m: r[0] || '?', f: r[1] || '?', t: num(r[2]), fmo: r[3] === 'ja'})).filter(a => a.t >= 1);
      if (!(n >= 1 && n <= 5000 && V > 0 && A.length)) return null;
      A.forEach(a => { a.v = V / a.t; });
      const {mult: m, why} = overage(n, this.ov, num(this.x) || 0), ab = A.reduce((s, a) => s + a.v, 0);
      return {why, n, x, V, A, m, ab, buf: V - ab, fl: [...new Set(A.map(a => a.f))], fmo: A.filter(a => a.fmo)};
    },
    n1() { return this.m ? this.m.n : ''; },
    mixCols() {
      const t = this.t;
      return [{h: t('Antilichaam')}, {h: t('Titratie'), num: true}, {h: t('Per test'), num: true},
        {h: t('Cocktail (' + fmt(this.m.m, 1) + '×)'), num: true}];
    },
    mixRows() {
      const {A, m, buf, V} = this.m, t = this.t;
      return [...A.map(a => [ud(a.m) + ' ' + ud(a.f), '1:' + L(fmt(a.t, 0)), L(vol(a.v)), L(vol(a.v * m)) + pipHtml(a.v * m)]),
        [t('FACS-buffer'), '', L(vol(buf)), L(vol(buf * m)) + pipHtml(buf * m)],
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
    /* S94: de geplakte of gekozen export; de populaties zonder % (alleen een aantal, zoals de beads) staan niet in de %-tabel */
    fr() { return flowRead(this.fl); },
    flPops() { const r = this.fr; return r.pops.filter(p => r.samples.some(s => isFinite((r.pct[s] || {})[p.key]))); },
    flCols() { return [{h: this.t('Monster')}, ...this.flPops.map(p => ({h: esc(p.name), num: true}))]; },
    flRows() { const r = this.fr; return r.samples.map(s => [esc(s), ...this.flPops.map(p => { const v = (r.pct[s] || {})[p.key]; return isFinite(v) ? L(fmt(v, 1)) + ' %' : '–'; })]); },
    /* cellen/µL = aantal / bead-events × beads toegevoegd / monstervolume, zoals cnt() hieronder, per monster */
    flAbs() {
      const r = this.fr, bead = r.pops.find(p => /bead/i.test(p.name)), bc = num(this.bc), bv = num(this.bv), sv = num(this.sv);
      if (!bead || !(bc > 0 && bv > 0 && sv > 0)) return null;
      const pops = r.pops.filter(p => p !== bead && r.samples.some(s => isFinite((r.cnt[s] || {})[p.key])));
      if (!pops.length) return null;
      return {cols: [{h: this.t('Monster')}, ...pops.map(p => ({h: esc(p.name), num: true}))],
        rows: r.samples.map(s => { const b = (r.cnt[s] || {})[bead.key];
          return [esc(s), ...pops.map(p => { const c = (r.cnt[s] || {})[p.key]; return b > 0 && isFinite(c) ? L(sig(c / b * bc * bv / sv, 3)) : '–'; })]; })};
    },
    /* absolute celconcentratie met telbeads */
    cnt() {
      const ce = num(this.ce), be = num(this.be), bc = num(this.bc), bv = num(this.bv), sv = num(this.sv);
      if (!(ce >= 0 && be > 0 && bc > 0 && bv > 0 && sv > 0)) return null;
      return {c: ce / be * bc * bv / sv, beads: bc * bv, few: be < 1000};
    }
  },
  methods: {
    L, fmt, sig, sci, vol,
    addRow() { this.rows = [...this.rows, ['', '', '', 'nee']]; },
    flFile(e) { const f = e.target.files[0]; if (!f) return; f.text().then(t => { this.fl = t; }); e.target.value = ''; }
  }
};
</script>
