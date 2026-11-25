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
        <template v-if="eg">
          <svg class="rq-eg" viewBox="0 0 300 110" width="100%" role="img" :aria-label="t('Virtueel elektroferogram van 18S en 28S')" style="max-width:420px;display:block;margin:8px 0 2px">
            <line x1="20" y1="90" x2="290" y2="90" stroke="var(--line)"/>
            <path :d="eg.path" fill="none" stroke="var(--accent)" stroke-width="1.5"/>
            <text v-for="l in eg.labels" :key="l.x" :x="l.x" y="104" text-anchor="middle" font-size="8" fill="var(--muted)">{{ l.txt }}</text>
          </svg>
          <lk-big :label="t('RIN-achtige schatting')" :value="F(eg.rin, 1)" sub="/ 10" :chip="t(eg.rin >= 7 ? 'goed' : eg.rin >= 5 ? 'matig' : 'slecht')" :chip-kind="eg.rin >= 7 ? 'ok' : eg.rin >= 5 ? 'warn' : 'bad'"/>
          <lk-note kind="info">{{ t('Een indicatie op basis van alleen de 28S:18S-verhouding; de echte RIN (Agilent-algoritme) kun je niet uit een verhouding berekenen. Het elektroferogram is een illustratie, geen meting.') }}</lk-note>
        </template>
        <lk-note v-if="m.a < 0.1 || m.a > 1" kind="warn">{{ t('A₂₆₀ buiten 0,1–1,0: de meting is minder betrouwbaar; pas de verdunning aan.') }}</lk-note>
        <lk-range what="A₂₆₀/A₂₈₀" :value="m.r1" :lo="1.8" :hi="2.2" :low="t('Mogelijk eiwit of fenol in het extract.')" :high="t('Hoger dan verwacht; controleer de blanco.')" :ok="t('Geen teken van eiwit of fenol.')"/>
        <lk-range what="A₂₆₀/A₂₃₀" :value="m.r2" :lo="1.8" :low="t('Mogelijk guanidinezouten, fenol of koolhydraten van de extractie.')" :ok="t('Geen teken van zouten of fenol van de extractie.')"/>
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
    },
    /* virtueel elektroferogram + RIN-achtige schatting; alleen met beide bandintensiteiten */
    eg() {
      const m = this.m;
      if (!m || !(m.s28 > 0 && m.s18 > 0)) return null;
      const r = m.s28 / m.s18, mx = Math.max(m.s28, m.s18);
      const h28 = 70 * m.s28 / mx, h18 = 70 * m.s18 / mx;
      const k = Math.min(1, Math.max(0, (2 - r) / 2));  // 0 = intact, 1 = sterk afgebroken
      const X = nt => 20 + nt / 6000 * 270, g = (x, c, w) => Math.exp(-(((x - c) / w) ** 2) / 2);
      let d = '';
      for (let nt = 0; nt <= 6000; nt += 50) {
        let y = 14 * g(nt, 25, 60) + h18 * g(nt, 1900, 90) + h28 * g(nt, 4700, 140);
        /* afbraaksmeer: verhoogd tussen marker en 18S, groter bij lagere verhouding */
        if (nt > 100 && nt < 1900) y += k * 0.3 * h18 * Math.sin((nt - 100) / 1800 * Math.PI / 2 + 0.3) ** 2;
        d += (d ? 'L' : 'M') + X(nt).toFixed(1) + ' ' + (90 - y).toFixed(1);
      }
      /* shortcut: ruwe lineaire tabel van 28S:18S naar 1–10, niet de Agilent-RIN; upgraden bij een echte RIN-invoer of kalibratie op meetdata */
      const T = [[0, 1], [0.5, 3], [1, 6], [1.6, 8], [2, 9.5], [2.5, 10]];
      let rin = 10;
      for (let i = 1; i < T.length; i++) if (r <= T[i][0]) { rin = T[i - 1][1] + (T[i][1] - T[i - 1][1]) * (r - T[i - 1][0]) / (T[i][0] - T[i - 1][0]); break; }
      return {path: d, rin: Math.min(10, Math.max(1, rin)),
        labels: [{x: X(25), txt: 'marker'}, {x: X(1900), txt: '18S'}, {x: X(4700), txt: '28S'}]};
    }
  },
  methods: {F}
};
</script>
