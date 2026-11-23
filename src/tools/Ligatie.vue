<!-- ================= LIGATIE =================
     Dezelfde berekening als de oude calc.ligatie(), nu in een component. De id's l-vng, l-vbp,
     l-ibp, l-r, l-vc, l-ic, l-rv en l-out blijven zoals ze waren: tests/validate.py, delen,
     ongedaan maken en "Stuur concentratie door" uit de Standaardcurve (tools/nt/99_app.js) lezen
     en zetten ze. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <lk-field v-model="vng" :label="t('Vector')" for-id="l-vng" unit="ng"/>
        <lk-field v-model="vbp" :label="t('Vectorlengte')" for-id="l-vbp" unit="bp"/>
        <lk-field v-model="ibp" :label="t('Insertlengte')" for-id="l-ibp" unit="bp"/>
        <lk-field v-model="r" :label="t('Insert : vector')" for-id="l-r" unit=": 1"/>
        <lk-field v-model="vc" :label="t('Conc. vector')" for-id="l-vc" unit="ng/µL"/>
        <lk-field v-model="ic" :label="t('Conc. insert')" for-id="l-ic" unit="ng/µL"/>
        <lk-field v-model="rv" :label="t('Reactievolume')" for-id="l-rv" unit="µL"/>
        <div class="f"><label for="l-type">{{ t('Kloneringstype') }}</label>
          <select id="l-type" style="width:100%" v-model="type">
            <option value="sticky">{{ t('Sticky ends') }}</option>
            <option value="blunt">{{ t('Blunt ends') }}</option>
            <option value="ta">{{ t('TA-kloneren') }}</option>
          </select></div>
      </div>
    </div>
    <div class="result" id="l-out">
      <lk-big :label="t('Insert nodig')" :value="m.ing" sub="ng"/>
      <lk-kv :rows="m.rows"/>
      <lk-kv v-if="m.rows2" :rows="m.rows2"/>
      <lk-note v-if="m.warnConc" kind="warn">{{ t('NEB adviseert een totale DNA-concentratie van 1–10 µg/mL (= 1–10 ng/µL).') }}</lk-note>
      <lk-note v-if="m.noRoom" kind="bad">{{ t('De DNA-volumes passen niet in het reactievolume.') }}</lk-note>
      <lk-note kind="info">{{ t(m.advice) }}</lk-note>
      <lk-note kind="info">{{ t(recs[type]) }}</lk-note>
      <svg v-if="pic" viewBox="0 0 200 60" width="100%" role="img" :aria-label="t('Molaire verhouding vector en insert')" style="max-width:320px;display:block;margin:8px 0">
        <circle cx="22" cy="30" r="14" fill="none" stroke="var(--accent)" stroke-width="4"/>
        <rect v-for="i in pic.n" :key="i" :x="52 + (i - 1) * 14" y="16" width="8" height="28" rx="3" fill="var(--muted)"/>
        <text v-if="pic.more" :x="52 + pic.n * 14 + 2" y="35" font-size="11" fill="var(--muted)">×{{ pic.r }}</text>
        <text x="22" y="57" text-anchor="middle" font-size="8" fill="var(--muted)">{{ t('vector') }}</text>
        <text x="52" y="57" font-size="8" fill="var(--muted)">{{ t('insert') }}</text>
      </svg>
      <lk-formula :html="formula"/>
    </div>
  </div>
</template>

<script>
import {pipHtml} from '../lib/pip.js';
import {lkNumIn} from '../lib/bridge.js';

/* getallen uit fmt(), sig() en vol() staan in het Nederlands; in de Engelse weergave moeten ze
   om, want de DOM-vertaallaag komt niet in een Vue-boom */
const N = s => lkNumIn(s);

export default {
  name: 'Ligatie',
  data() {
    const st = typeof storeGet === 'function' ? storeGet() : {};
    const g = (id, d) => (st[id] != null ? String(st[id]) : lkNumIn(d));
    return {
      vng: g('l-vng', '50'), vbp: g('l-vbp', '3000'), ibp: g('l-ibp', '1000'), r: g('l-r', '3'),
      vc: g('l-vc', '25'), ic: g('l-ic', '20'), rv: g('l-rv', '20'),
      type: g('l-type', 'sticky'),
      recs: {
        sticky: 'Sticky ends: start met 3:1 (bereik 1:1–3:1).',
        blunt: 'Blunt ends: 3:1 tot 5:1; blunt ligeert minder efficiënt, dus meer insert.',
        ta: 'TA-kloneren: start met 3:1 en test 1:1–8:1 (Promega pGEM-T-handleiding).'
      }
    };
  },
  computed: {
    /* plaatje: 1 vector en r inserts, getekend tot 10; daarboven ×r */
    pic() {
      const r = num(this.r);
      return r > 0 ? {r: lkNumIn(fmt(r, 1)), n: Math.min(10, Math.max(1, Math.round(r))), more: r > 10} : null;
    },
    /* het rekenwerk van de oude calc.ligatie(), één keer */
    m() {
      const vng = num(this.vng), vbp = num(this.vbp), ibp = num(this.ibp), r = num(this.r);
      const vc = num(this.vc), ic = num(this.ic), rv = num(this.rv);
      const ing = r * vng * ibp / vbp;
      const vpm = vng * 1000 / (vbp * 660), ipm = ing * 1000 / (ibp * 660);
      const t = this.t;
      const rows = [[t('Vector'), N(sig(vpm * 1000, 3) + ' fmol')], [t('Insert'), N(sig(ipm * 1000, 3) + ' fmol')]];
      if (isFinite(vc) && vc > 0) rows.push([t('Pipetteer vector'), N(vol(vng / vc)) + pipHtml(vng / vc)]);
      if (isFinite(ic) && ic > 0) rows.push([t('Pipetteer insert'), N(vol(ing / ic)) + pipHtml(ing / ic)]);
      let rows2 = null, warnConc = false, noRoom = false;
      if (isFinite(rv) && rv > 0) {
        const tot = (vng + ing) / rv, rest = rv - (vc > 0 ? vng / vc : 0) - (ic > 0 ? ing / ic : 0);
        rows2 = [[t('Totaal DNA in reactie'), N(fmt(tot, 2) + ' ng/µL')], [t('Ruimte voor buffer, ligase, water'), N(vol(rest))]];
        warnConc = tot < 1 || tot > 10;
        noRoom = rest < 0;
      }
      const advice = ibp <= 100 ? 'Korte insert (≤ 100 bp): overweeg 10:1.'
        : Math.abs(ibp - vbp) / vbp < 0.3 ? 'Insert en vector zijn ongeveer even lang: 1:1 is een goede start.'
          : 'Start met 3:1; zet eventueel een tweede reactie op met een andere verhouding.';
      return {ing: N(sig(ing, 3)), rows, rows2, warnConc, noRoom, advice};
    },
    formula() {
      return this.tHtml('insert (ng) = verhouding × vector (ng) × insert (bp) / vector (bp)');
    }
  }
};
</script>
