<!-- ================= PIPETKALIBRATIE =================
     De velden en de uitkomst zijn Vue; het rekenwerk blijft pipcalCalc() in tools/nt/30_pipcal.js,
     samen met de Z-tabel en de ISO 8655-grenzen waar het validatiegeval aan hangt.

     De id's pc-v, pc-nom, pc-t, pc-ch, pc-m en pc-out blijven zoals ze waren. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <lk-field v-model="v" :label="t('Ingesteld volume')" for-id="pc-v" unit="µL"/>
        <lk-field v-model="nom" :label="t('Nominaal volume pipet')" for-id="pc-nom" unit="µL"/>
        <lk-field data-expert="" v-model="temp" :label="t('Watertemperatuur')" for-id="pc-t" unit="°C"/>
        <div class="f">
          <label for="pc-ch">{{ t('Type') }}</label>
          <select id="pc-ch" style="width:100%" v-model="ch">
            <option value="1">{{ t('enkelkanaals') }}</option>
            <option value="2">{{ t('meerkanaals (grenzen × 2)') }}</option>
          </select>
        </div>
        <div class="f" style="grid-column:1/-1">
          <label for="pc-m">{{ tHtml('Wegingen (mg) <span class="example">voorbeeld</span>') }}</label>
          <textarea id="pc-m" rows="4" v-model="m"></textarea>
        </div>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Minstens 4 wegingen voor een routinecheck, 10 voor een kalibratie. Laat pipet, tips en water vooraf op kamertemperatuur komen en gebruik een verdampingsval. Voorbeelddata zijn verzonnen.') }}</p>
    </div>
    <div class="result" id="pc-out">
      <lk-note v-if="!P" kind="info">{{ t('Vul het ingestelde volume en minstens twee wegingen in.') }}</lk-note>
      <template v-else>
        <lk-big :label="t('Gemiddeld volume')" :value="F(P.Vm, 3)" sub="µL"/>
        <lk-kv :rows="kvRows"/>
        <lk-kv v-if="P.lim" :rows="limRows"/>
        <lk-note v-if="nearNote" kind="info">{{ nearNote }}</lk-note>
        <lk-note v-if="P.n < 4" kind="warn">{{ t('Gebruik minstens 4 wegingen voor een betrouwbare schatting.') }}</lk-note>
        <lk-note v-if="bad" kind="bad">{{ t('Buiten de ISO-grenzen: controleer de techniek (voorbevochtigen, verticaal pipetteren, tip) en laat de pipet zo nodig kalibreren.') }}</lk-note>
        <lk-formula :html="formula"/>
      </template>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const F = (x, d) => lkNumIn(fmt(x, d));

export default {
  name: 'Pipcal',
  data() {
    return {
      v: '100', nom: '100', temp: lkNumIn('21,5'), ch: '1',
      m: lkNumIn('99,61 99,72 99,58 99,80 99,66 99,70 99,63 99,75 99,69 99,60')
    };
  },
  computed: {
    /* de maten uit pipcalCalc(); null zolang het volume of de wegingen ontbreken */
    P() { return pipcalCalc(num(this.v), num(this.nom), num(this.temp), numsC(this.m), num(this.ch) || 1); },
    bad() { const P = this.P; return isFinite(P.limS) && (!P.okS || !P.okR); },
    kvRows() {
      const t = this.t, P = this.P;
      /* de chip hoort bij de zin: een hele sleutel per waarde, met de chip erin zoals de
         vertaallaag die eerder uit de DOM las */
      const chip = ok => `<span class="chip ${ok ? 'ok' : 'bad'}" style="vertical-align:middle">${ok ? 'voldoet' : 'voldoet niet'}</span>`;
      return [[this.tHtml('Systematische fout e<sub>s</sub>'), this.tHtml(`${fmt(P.es, 2)}% (${fmt(P.Vm - P.Vs, 3)} µL)` + (isFinite(P.limS) ? ' ' + chip(P.okS) : ''))],
        [t('Toevallige fout CV'), this.tHtml(`${fmt(P.cv, 2)}% (s = ${fmt(P.s, 3)} µL)` + (isFinite(P.limR) ? ' ' + chip(P.okR) : ''))],
        [t("Z-factor"), F(P.Z, 4) + ' µL/mg'],
        [t('Aantal wegingen'), P.n]];
    },
    limRows() {
      const {lim, mc, limS, limR, Vs} = this.P, t = this.t;
      return [[this.tHtml('ISO 8655-grens e<sub>s</sub>'), t(`± ${fmt(lim[1] * lim[0] * mc / 100, 3)} µL (± ${fmt(limS, 2)}% bij ${fmt(Vs, 0)} µL)`)],
        [t('ISO 8655-grens CV'), t(`${fmt(lim[2] * lim[0] * mc / 100, 3)} µL (${fmt(limR, 2)}% bij ${fmt(Vs, 0)} µL)`)]];
    },
    nearNote() {
      const {lim, nom} = this.P;
      return lim && Math.abs(lim[0] - nom) / nom > 0.05
        ? this.t(`Geen ISO-tabelwaarde voor ${fmt(nom, 0)} µL; de grenzen van ${fmt(lim[0], 0)} µL zijn gebruikt.`) : '';
    },
    formula() { return this.tHtml('V = m × Z · e<sub>s</sub> = (V̄ − V<sub>s</sub>) / V<sub>s</sub> · CV = s / V̄'); }
  },
  methods: {
    F(x, d) { return F(x, d); }
  }
};
</script>
