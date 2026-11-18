<!-- ================= WELKE PIPET? =================
     De uitkomst is een tabel, dus deze tool is het voorbeeld voor <lk-table>, <lk-kv>,
     <lk-big>, <lk-note> en <lk-field>.

     De id's pk-v, pk-set en pk-out blijven zoals ze waren: delen via een link, ongedaan maken,
     de invoeropslag en tests/validate.py zetten .value en sturen een input-event, en daar
     reageert v-model op. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <lk-field v-model="v" :label="t('Te pipetteren volume')" for-id="pk-v" unit="µL"/>
        <lk-field v-model="set" :label="t('Pipetten in je set (nominaal, µL)')" for-id="pk-set"
                  cls="txt" inputmode="text" :span="2"/>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Een pipet met variabel volume werkt tussen 10% en 100% van het nominale volume. Kalibreer je eigen pipetten met de Pipetkalibratie; de echte fouten zijn meestal kleiner dan de ISO-grenzen.') }}</p>
    </div>
    <div class="result">
      <div id="pk-out">
        <lk-note v-if="!valid" kind="info">{{ t('Vul een volume en minstens één pipet in.') }}</lk-note>
        <template v-else>
          <lk-big v-if="best" :label="t('Beste keuze')" :value="bestName" :sub="bestSub"/>
          <lk-note v-else kind="warn">{{ t('Geen pipet in je set kan dit volume binnen 10–100% van zijn bereik afmeten.') }}</lk-note>
          <lk-kv v-if="best" :rows="bestRows"/>
          <lk-table :cols="cols" :rows="rows"/>
          <lk-formula :html="tHtml('totaal = (k·e<sub>s</sub> + 2·√k·s) / V')"/>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

/* De grenzen komen uit ISO 8655-2 bij het nominale volume (ISOLIM, uit web/index.html). De
   absolute fout van het nominale volume wordt over het hele bereik aangenomen, dus bij een
   klein volume wordt de relatieve fout groter. Bij k keer pipetteren tellen systematische
   fouten op en toevallige fouten kwadratisch. Dit rekenwerk is onveranderd meegekomen. */
function pkLim(nom) { let r = ISOLIM[0]; for (const x of ISOLIM) if (x[0] <= nom) r = x; return r; }

function pkRows(V, set) {
  return set.map(nom => {
    const [, sp, rp] = pkLim(nom), es = sp / 100 * nom, s = rp / 100 * nom;
    const k = V > nom ? Math.ceil(V / nom - 1e-9) : 1, sub = V / k, ok = sub >= nom * 0.1 - 1e-9;
    const ES = k * es, S = Math.sqrt(k) * s;
    return {nom, k, sub, ok, es: ES, s: S, rel: (ES + 2 * S) / V * 100};
  });
}

const F = (x, d) => lkNumIn(fmt(x, d)), VL = x => lkNumIn(vol(x));

export default {
  name: 'Pipkeus',
  data() { return {v: lkNumIn('15'), set: '2 10 20 100 200 1000 5000'}; },
  computed: {
    V() { return num(this.v); },
    pipettes() {
      return [...new Set(String(this.set).split(/[\s;,]+/).map(num).filter(x => x > 0 && x <= 1e5))]
        .sort((a, b) => a - b);
    },
    valid() { return this.V > 0 && this.pipettes.length > 0; },
    all() { return this.valid ? pkRows(this.V, this.pipettes) : []; },
    best() {
      const can = this.all.filter(r => r.ok && r.k <= 20);
      return can.length ? can.reduce((a, b) =>
        b.rel < a.rel - 1e-12 || (Math.abs(b.rel - a.rel) < 1e-12 && b.k < a.k) ? b : a) : null;
    },
    bestName() { return this.best ? 'P' + F(this.best.nom, 0) : '–'; },
    bestSub() { return this.best && this.best.k > 1 ? this.best.k + ' × ' + VL(this.best.sub) : ''; },
    bestRows() {
      const b = this.best; if (!b) return [];
      return [[this.t('Systematische fout (max.)'), `± ${VL(b.es)} (${F(b.es / this.V * 100, 2)}%)`],
        [this.t('Toevallige fout (max., SD)'), `${VL(b.s)} (${F(b.s / this.V * 100, 2)}%)`]];
    },
    cols() {
      return [{h: this.t('Pipet')}, {h: this.t('Keer'), num: true}, {h: this.t('Per keer'), num: true},
        {h: this.tHtml('e<sub>s</sub> max.'), num: true}, {h: this.t('s max.'), num: true},
        {h: this.tHtml('Totaal (e<sub>s</sub> + 2s)'), num: true}, {h: this.t('Bruikbaar')}];
    },
    rows() {
      const t = this.t;
      const why = r => r.ok ? (r.k > 20 ? t('te vaak') : t('ja')) : t('onder 10% van bereik');
      return this.all.map(r => ['P' + F(r.nom, 0), r.k, VL(r.sub), VL(r.es), VL(r.s), F(r.rel, 2) + '%', why(r)]);
    }
  }
};
</script>
