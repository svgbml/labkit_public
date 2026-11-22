<!-- ================= SDS-PAGE MONSTERS =================
     Dezelfde berekening als de oude calc.sds(), nu in een component. De monstertabel is een
     <lk-etable> (id ss-tbl, knop ss-add): TBLDEF['ss-tbl'] krijgt daardoor set/push/get/blank
     voor delen, ongedaan maken, plakken en "Stuur monsters door" uit de Standaardcurve
     (tools/nt/99_app.js). De velden ss-ug, ss-x en ss-v en de uitkomst #ss-out blijven zoals ze
     waren; de resultaattabel staat in een wrapper met id ss-res (tests/validate.py). -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <lk-field v-model="ug" :label="t('Eiwit per laan')" for-id="ss-ug" unit="µg"/>
        <div class="f" data-expert="">
          <label for="ss-x">{{ t('Monsterbuffer') }}</label>
          <select id="ss-x" style="width:100%" v-model="X">
            <option value="2">2×</option>
            <option value="4">{{ t('4× (Laemmli)') }}</option>
            <option value="5">5×</option>
            <option value="6">6×</option>
          </select>
        </div>
        <lk-field v-model="lv" :label="t('Laadvolume per laan')" for-id="ss-v" unit="µL"/>
      </div>
      <div style="margin-top:12px">
        <lk-etable table-id="ss-tbl" :cols="cols" v-model:rows="rows" add-id="ss-add"/>
      </div>
      <div class="row" style="margin-top:10px"><button type="button" id="ss-add" @click="addRow">{{ t('+ Monster') }}</button></div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Concentraties uit de Standaardcurve (Bradford of BCA); 1 mg/mL = 1 µg/µL. Voorbeelddata zijn verzonnen.') }}</p>
    </div>
    <div class="result" id="ss-out">
      <lk-note v-if="m.err" kind="info">{{ t(m.err) }}</lk-note>
      <template v-else>
        <lk-table id="ss-res" :cols="resCols" :rows="resRows"/>
        <lk-note v-if="m.bad.length" kind="bad" :html="badNote"/>
        <lk-note v-for="(w, i) in warns" :key="i" kind="warn" :html="w"/>
        <lk-formula :html="formula"/>
      </template>
    </div>
  </div>
</template>

<script>
import {pipHtml} from '../lib/pip.js';
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => lkNumIn(fmt(x, d));

export default {
  name: 'Sds',
  data() {
    /* de app zet de bewaarde waarden terug vóórdat deze component rendert: lees ze hier */
    const st = typeof storeGet === 'function' ? storeGet() : {};
    const g = (id, d) => (st[id] != null ? String(st[id]) : d);
    return {
      ug: g('ss-ug', lkNumIn('20')), X: g('ss-x', '4'), lv: g('ss-v', lkNumIn('20')),
      rows: [['Lysaat A', '2,4'], ['Lysaat B', '1,6'], ['Lysaat C', '3,1']]
        .map(r => [trPlain(r[0], true), lkNumIn(r[1])])
    };
  },
  computed: {
    cols() {
      return [{h: this.t('Monster'), t: 'txt', w: 150}, {h: this.t('Concentratie (µg/µL)'), t: 'num', w: 90}];
    },
    /* het rekenwerk van de oude calc.sds(), één keer; de weergave leest hier alleen uit */
    m() {
      const ug = num(this.ug), X = num(this.X), V = num(this.lv);
      if (!(ug > 0) || !(V > 0)) return {err: 'Vul eiwit per laan en laadvolume in.'};
      const vb = V / X, room = V - vb;
      const rows = this.rows.map(r => ({n: r[0] || 'monster', c: num(r[1])})).filter(r => r.c > 0);
      if (!rows.length) return {err: 'Vul concentraties in.'};
      const bad = rows.filter(r => ug / r.c > room + 1e-9);
      return {ug, X, V, vb, room, rows, bad};
    },
    resCols() {
      const t = this.t;
      return [{h: t('Monster')}, {h: t('Monster (µL)'), num: true}, {h: t(this.m.X + '× buffer (µL)'), num: true},
        {h: t('Water (µL)'), num: true}, {h: t('Totaal (µL)'), num: true}];
    },
    resRows() {
      const {rows, ug, vb, room, V} = this.m, t = this.t;
      return rows.map(r => {
        const vs = ug / r.c, w = room - vs;
        return [esc(r.n === 'monster' ? t('monster') : r.n), F(vs, 2) + pipHtml(vs), F(vb, 2) + pipHtml(vb),
          w >= 0 ? F(w, 2) + pipHtml(w) : '<span class="chip bad">' + esc(t('past niet')) + '</span>', F(V, 1)];
      });
    },
    badNote() {
      const {bad, ug, V, room} = this.m;
      return this.tHtml(ud(bad.map(r => r.n).join(', ')) + ': te verdund voor ' + fmt(ug, 1) + ' µg in ' + fmt(V, 1)
        + ' µL. Maximaal ' + fmt(Math.min(...bad.map(r => r.c)) * room, 1) + ' µg per laan, of vergroot het laadvolume.');
    },
    warns() {
      const {rows, ug} = this.m;
      return rows.filter(r => ug / r.c < 1).map(r => this.tHtml(ud(r.n) + ': minder dan 1 µL monster; verdun het monster eerst.'));
    },
    formula() {
      const {ug, V, X, vb} = this.m;
      return this.tHtml('monster = ' + fmt(ug, 1) + ' µg / concentratie · buffer = ' + fmt(V, 1) + ' / ' + X + ' = '
        + fmt(vb, 2) + ' µL · water vult aan');
    }
  },
  methods: {
    addRow() { this.rows = [...this.rows, ['', '']]; }
  }
};
</script>
