<!-- ================= RNA-KWALITEIT =================
     Dezelfde berekening als de oude calc.rnaq(). De id's rq-a260, rq-a280, rq-a230, rq-df, rq-l,
     rq-v, rq-28, rq-18 en rq-out blijven zoals ze waren (tests/validate.py leest het grote
     getal in #rq-out). -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <lk-field v-model="a260" :label-html="tHtml('A<sub>260</sub>')" for-id="rq-a260"/>
        <lk-field v-model="a280" :label-html="tHtml('A<sub>280</sub>')" for-id="rq-a280"/>
        <lk-field v-model="a230" :label-html="tHtml('A<sub>230</sub>')" for-id="rq-a230"/>
        <lk-field v-model="df" :label="t('Verdunningsfactor')" for-id="rq-df"/>
        <lk-field v-model="l" :label="t('Weglengte')" for-id="rq-l" unit="cm"/>
        <lk-field v-model="v" :label="t('Volume eluaat')" for-id="rq-v" unit="µL"/>
        <lk-field v-model="s28" :label="t('Intensiteit 28S-band')" for-id="rq-28"/>
        <lk-field v-model="s18" :label="t('Intensiteit 18S-band')" for-id="rq-18"/>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Bandintensiteiten haal je uit de gelfoto-editor of ImageJ (geïntegreerde intensiteit, achtergrond afgetrokken). Laat leeg als je geen gel hebt. Voorbeelddata zijn verzonnen.') }}</p>
    </div>
    <div class="result" id="rq-out">
      <lk-note v-if="!m" kind="info">{{ t('Vul minstens A₂₆₀ in.') }}</lk-note>
      <template v-else>
        <lk-big :label="t('RNA-concentratie')" :value="F(m.conc, 1)" sub="ng/µL"/>
        <lk-kv :rows="rows"/>
        <lk-note v-if="m.a < 0.1 || m.a > 1" kind="warn">{{ t('A₂₆₀ buiten 0,1–1,0: de meting is minder betrouwbaar; pas de verdunning aan.') }}</lk-note>
        <lk-note v-if="isFinite(m.r1) && m.r1 < 1.8" kind="warn">{{ t('Lage A₂₆₀/A₂₈₀: mogelijk eiwit of fenol in het extract.') }}</lk-note>
        <lk-note v-if="isFinite(m.r2) && m.r2 < 1.8" kind="warn">{{ t('Lage A₂₆₀/A₂₃₀: mogelijk guanidinezouten, fenol of koolhydraten van de extractie.') }}</lk-note>
        <lk-formula :html="t('c = A₂₆₀ × 40 µg/mL × verdunning / weglengte')"/>
      </template>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => lkNumIn(fmt(x, d));

export default {
  name: 'Rnaq',
  data() {
    /* de app zet de bewaarde waarden terug vóórdat deze component rendert: lees ze hier */
    const st = typeof storeGet === 'function' ? storeGet() : {};
    const g = (id, d) => (st[id] != null ? String(st[id]) : lkNumIn(d));
    return {a260: g('rq-a260', '0,532'), a280: g('rq-a280', '0,262'), a230: g('rq-a230', '0,251'),
      df: g('rq-df', '20'), l: g('rq-l', '1'), v: g('rq-v', '30'), s28: g('rq-28', '18400'),
      s18: g('rq-18', '9800')};
  },
  computed: {
    /* alle maten uit één plek (het rekenwerk van de oude calc.rnaq) */
    m() {
      const a = num(this.a260), b = num(this.a280), c = num(this.a230), df = num(this.df) || 1,
        l = num(this.l) || 1, v = num(this.v), s28 = num(this.s28), s18 = num(this.s18);
      if (!isFinite(a)) return null;
      return {a, v, s28, s18, conc: a * 40 * df / l, r1: a / b, r2: a / c};
    },
    rows() {
      const m = this.m, t = this.t, rows = [];
      const chip = (ok, txt) => `<span class="chip ${ok ? 'ok' : 'warn'}" style="vertical-align:middle;margin-left:6px">${txt}</span>`;
      if (isFinite(m.r1)) {
        const ok = m.r1 >= 1.8 && m.r1 <= 2.2;
        rows.push([this.tHtml('A<sub>260</sub>/A<sub>280</sub>'), F(m.r1, 2) + chip(ok, t(ok ? 'zuiver' : 'afwijkend'))]);
      }
      if (isFinite(m.r2)) {
        const ok = m.r2 >= 1.8;
        rows.push([this.tHtml('A<sub>260</sub>/A<sub>230</sub>'), F(m.r2, 2) + chip(ok, t(ok ? 'in orde' : 'laag'))]);
      }
      if (isFinite(m.v)) rows.push([t('Opbrengst'), t(`${fmt(m.conc * m.v / 1000, 2)} µg in ${fmt(m.v, 0)} µL`)]);
      if (m.s28 > 0 && m.s18 > 0) {
        const r = m.s28 / m.s18;
        rows.push(['28S:18S', F(r, 2) + chip(r >= 1.6, t(r >= 1.6 ? 'intact' : r >= 1 ? 'deels afgebroken' : 'afgebroken'))]);
      }
      return rows;
    }
  },
  methods: {F}
};
</script>
