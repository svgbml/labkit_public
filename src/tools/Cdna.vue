<!-- ================= CDNA-SYNTHESE (RT-MIX) =================
     Dezelfde berekening als de oude calc.cdna(), nu in een component. De monstertabel is een
     <lk-etable>; de id's cd-in, cd-vr, cd-inh, cd-nort, cd-mar, cd-tbl, cd-tbl-add en cd-out
     blijven zoals ze waren (tests/validate.py, delen, ongedaan maken en de monsterlijst in
     tools/nt/99_app.js lezen ze). In #cd-out staat eerst de mixtabel en dan de tabel per
     monster; het validatiegeval telt die twee tabellen. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <lk-field v-model="ng" :label="t('RNA per reactie')" for-id="cd-in" unit="ng"/>
        <lk-field v-model="vr" :label="t('RNA + water per reactie')" for-id="cd-vr" unit="µL"/>
        <div class="f" data-expert="">
          <label for="cd-inh">{{ t('RNase-remmer in de mix') }}</label>
          <select id="cd-inh" style="width:100%" v-model="inh">
            <option value="0">{{ t('nee') }}</option>
            <option value="1">{{ t('ja (1 µL)') }}</option>
          </select>
        </div>
        <lk-field v-model="nort" :label="t('No-RT-controles')" for-id="cd-nort" inputmode="numeric" data-expert=""/>
        <lk-field v-model="mar" :label="t('Marge')" for-id="cd-mar" unit="%" data-expert=""/>
      </div>
      <lk-etable table-id="cd-tbl" :cols="cols" v-model:rows="rows" add-id="cd-tbl-add"/>
      <div class="row" style="margin-top:8px">
        <button type="button" id="cd-tbl-add" @click="addRow">{{ t('+ Monster') }}</button>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('RNA-concentraties uit de spectrofotometer (zie RNA-kwaliteit). De mix volgt de High-Capacity cDNA Reverse Transcription Kit (20 µL: 10 µL 2× mix + 10 µL RNA). Bij een andere kit pas je de volumes in het Pipetteerschema aan. Voorbeelddata zijn verzonnen.') }}</p>
    </div>
    <div class="result" id="cd-out">
      <lk-note v-if="!m" kind="info">{{ t('Vul de RNA-input en per monster de concentratie in.') }}</lk-note>
      <template v-else>
        <lk-note v-for="(w, i) in m.warn" :key="i" kind="warn" :html="w"/>
        <lk-big :label="t('RT-mastermix voor ' + F(m.N, 1) + ' reacties')" :value="F(10 * m.N, 1)" sub="µL" top="0"/>
        <lk-table :cols="mixCols" :rows="mixRows"/>
        <lk-note v-if="m.nrt" kind="info">{{ t('Maak voor de ' + m.nrt + ' no-RT-controle(s) apart ' + F(9 * m.nrt * (1 + m.mar), 1) + ' µL mix zonder reverse transcriptase (vervang de RT door water), of haal de RT-volumes uit de totale mix.') }}</lk-note>
        <h3 style="font-size:14px;margin:14px 0 4px">{{ t('Per monster') }}</h3>
        <lk-table :cols="sampCols" :rows="sampRows" :wrap="true" style="margin-top:0"/>
      </template>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => lkNumIn(fmt(x, d));

export default {
  name: 'Cdna',
  data() {
    /* de app zet de bewaarde waarden terug vóórdat deze component rendert: lees ze hier */
    const st = typeof storeGet === 'function' ? storeGet() : {};
    const g = (id, d) => (st[id] != null ? String(st[id]) : d);
    return {
      ng: g('cd-in', '1000'), vr: g('cd-vr', '10'), inh: g('cd-inh', '0'),
      nort: g('cd-nort', '1'), mar: g('cd-mar', '10'),
      rows: [[trPlain('Controle 1'), '412'], [trPlain('Controle 2'), '388'], [trPlain('Behandeld 1'), '256'], [trPlain('Behandeld 2'), '1190']]
    };
  },
  computed: {
    cols() {
      return [{h: this.t('Monster'), t: 'txt', w: 120}, {h: this.t('RNA (ng/µL)'), t: 'num', w: 90}];
    },
    /* alle maten uit één plek; de weergave leest hier alleen uit */
    m() {
      const ng = num(this.ng), vr = num(this.vr) || 10, inh = this.inh === '1';
      const nrt = Math.min(96, Math.max(0, Math.round(num(this.nort) || 0))), mar = (num(this.mar) || 0) / 100;
      const S = this.rows.map(r => ({n: r[0], c: num(r[1])})).filter(s => s.n || isFinite(s.c));
      if (!S.length || !(ng > 0)) return null;
      const warn = [];
      if (ng > 2000 * vr / 10) warn.push(this.t('Meer dan 2 µg RNA per 20 µL-reactie; de kit is gevalideerd tot 2 µg.'));
      const rows = S.map(s => {
        const v = ng / s.c, ok = v <= vr;
        if (!(s.c > 0)) return [esc(s.n), '–', '–'];
        if (!ok) warn.push(this.tHtml(ud(s.n) + ': te verdund; maximaal ' + fmt(s.c * vr, 0) + ' ng in ' + fmt(vr, 1) + ' µL.'));
        if (v < 0.5 && ok) warn.push(this.tHtml(ud(s.n) + ': minder dan 0,5 µL RNA; verdun het RNA eerst voor nauwkeurig pipetteren.'));
        return [esc(s.n), ok ? F(v, 2) : this.t('te verdund'), ok ? F(vr - v, 2) : '–'];
      });
      const N = (S.length + nrt) * (1 + mar);
      const M = [['10× RT-buffer', 2.0], ['25× dNTP-mix (100 mM)', 0.8], ['10× random primers', 2.0],
        ...(inh ? [['RNase-remmer', 1.0]] : []), ['Water', inh ? 3.2 : 4.2], ['MultiScribe RT', 1.0]];
      return {warn, rows, N, nrt, mar, M};
    },
    mixCols() {
      const t = this.t;
      return [{h: t('Component')}, {h: t('Per reactie (µL)'), num: true}, {h: t('Mix (µL)'), num: true}];
    },
    mixRows() {
      const {M, N} = this.m, t = this.t;
      return [...M.map(c => [t(c[0]), F(c[1], 1), F(c[1] * N, 1)]),
        ['<b>' + esc(t('Totaal')) + '</b>', '<b>10</b>', '<b>' + F(10 * N, 1) + '</b>']];
    },
    sampCols() {
      const t = this.t;
      return [{h: t('Monster')}, {h: t('RNA (µL)'), num: true}, {h: t('Water (µL)'), num: true},
        {h: t('Mix (µL)'), num: true}];
    },
    sampRows() { return this.m.rows.map(r => [r[0], r[1], r[2], '10']); }
  },
  methods: {
    F,
    addRow() { this.rows = [...this.rows, ['', '']]; }
  }
};
</script>
