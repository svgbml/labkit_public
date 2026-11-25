<!-- ================= TELKAMER =================
     De velden en de uitkomst van de telkamer. kList() (de tellingen uit de tekst halen) en KSQ
     (de vakken per kamer) blijven in web/index.html staan; het rekenwerk is dat van
     calc.telkamer, ongewijzigd, maar nu in computeds.

     De id's k-ch, k-sq, k-live, k-dead, k-df, k-sv, k-need en k-out blijven zoals ze waren.

     k-sq heeft opties die van de gekozen kamer afhangen. Een kamerwissel zet k-sq direct goed
     (een synchrone watcher), en de globale kSq() in index.html laat de component direct
     opnieuw tekenen, voor tests die na een wissel meteen een vak kiezen. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <div class="f">
          <label for="k-ch">{{ t('Telkamer') }}</label>
          <select id="k-ch" style="width:100%" v-model="ch">
            <option value="0.1">{{ t('Bürker / Bürker-Türk (0,1 mm diep)') }}</option>
            <option value="0.1n">{{ t('Neubauer improved (0,1 mm diep)') }}</option>
            <option value="0.2">{{ t('Fuchs-Rosenthal (0,2 mm diep)') }}</option>
          </select>
        </div>
        <div class="f">
          <label for="k-sq">{{ t('Geteld vak') }}</label>
          <select id="k-sq" style="width:100%" v-model="sq">
            <option v-for="o in opts" :key="o[0]" :value="String(o[0])">{{ t(o[1]) }}</option>
          </select>
        </div>
      </div>
      <div class="f" style="margin-top:12px">
        <label for="k-live" v-html="liveLabel"></label>
        <textarea id="k-live" rows="2" v-model="liveTxt"></textarea>
      </div>
      <div class="f" style="margin-top:12px">
        <label for="k-dead">{{ t('Dode cellen (blauw, trypaanblauw) per vak, optioneel') }}</label>
        <textarea id="k-dead" rows="2" v-model="deadTxt"></textarea>
      </div>
      <tel-foto @fill="fill"/>
      <div class="fields" style="margin-top:12px">
        <lk-field v-model="df" :label="t('Verdunningsfactor')" for-id="k-df"/>
        <div class="f" data-expert="">
          <label for="k-sv">{{ t('Volume suspensie') }}</label>
          <div class="inu"><input id="k-sv" inputmode="decimal" v-model="sv"><span class="u">mL</span></div>
        </div>
        <div class="f" data-expert="">
          <label for="k-need">{{ t('Nodig: cellen') }}</label>
          <input id="k-need" inputmode="decimal" v-model="need">
        </div>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Trypaanblauw 1:1 = factor 2. Tel per vak hele cellen; scheid de tellingen met een spatie, komma, puntkomma of enter.') }}</p>
    </div>
    <div class="result">
      <div id="k-out">
        <template v-if="!m.live.length">
          <lk-note kind="info">{{ t('Vul de tellingen per vak in.') }}</lk-note>
          <lk-note v-if="m.pl.bad.length" kind="warn">{{ t('Niet herkend als hele telling: ' + list(m.pl.bad) + '.') }}</lk-note>
        </template>
        <template v-else>
          <lk-big :label="t('Levende cellen')" :html="concHtml" :sub="t('cellen/mL')"/>
          <div v-if="m.dead.length" style="margin-bottom:10px" v-html="viaHtml"></div>
          <lk-kv :rows="rows"/>
          <lk-note v-if="m.bad.length" kind="warn">{{ t('Overgeslagen (geen hele telling): ' + list(m.bad) + '. Tel per vak alleen hele cellen.') }}</lk-note>
          <lk-note v-if="m.dead.length && m.dead.length !== m.live.length" kind="warn">{{ t('Levend heeft ' + m.live.length + ' vakken en dood ' + m.dead.length + '; tel beide in dezelfde vakken.') }}</lk-note>
          <lk-note v-if="m.mL < 10" kind="warn">{{ t('Gemiddeld minder dan 10 cellen per vak: tel meer of grotere vakken voor een betrouwbare schatting.') }}</lk-note>
          <lk-reps :vals="m.live" :cv-max="Infinity" :label="t('Levende cellen per vak')"/>
          <lk-note v-if="m.cv > 25" kind="warn">{{ t('Grote spreiding tussen vakken (CV ' + fmt(m.cv, 0) + '%). Controleer of de suspensie goed gemengd en de kamer egaal gevuld is.') }}</lk-note>
          <lk-formula :html="tHtml('cellen/mL = gem. telling / V<sub>vak</sub>(µL) × 1000 × verdunning')"/>
          <!-- de knoppenbalk die SEND (tools/nt/99_app.js) eerder met insertAdjacentHTML onder de
               uitkomst zette; de klik-handler daar leest data-send en doet de rest -->
          <div v-if="m.conc > 0" class="lk-send">
            <span>{{ t('Stuur door naar') }}</span>
            <button v-for="(b, i) in send" :key="i" type="button" :data-send="'telkamer:' + i">{{ t(b[0]) }}</button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';
import TelFoto from './TelFoto.vue';

const F = (x, d) => lkNumIn(fmt(x, d)), C = (x, d) => lkNumIn(sci(x, d));

export default {
  name: 'Telkamer',
  components: {TelFoto},
  data() {
    return {ch: '0.1', sq: '1', liveTxt: '52 47 55 49', deadTxt: '4 6 3 5', df: '2', sv: '10', need: '1e5'};
  },
  watch: {
    /* een andere kamer heeft andere vakken: blijft het gekozen vak bestaan dan blijft het,
       anders wordt het eerste vak gekozen (zoals kSq() eerder deed) */
    ch: {
      flush: 'sync',
      handler() {
        if (!this.opts.some(o => String(o[0]) === this.sq)) this.sq = String(this.opts[0][0]);
      }
    }
  },
  methods: {
    fmt: (x, d) => fmt(x, d),
    /* tekst van de gebruiker blijft letterlijk staan in de vertaling */
    list: l => l.map(uv).join(', '),
    /* een fototelling (S60) komt als één vak achter de tellingen */
    fill(n) {
      const add = (s, v) => (s.trim() ? s.trim() + ' ' : '') + v;
      this.liveTxt = add(this.liveTxt, n.live); this.deadTxt = add(this.deadTxt, n.dead);
    }
  },
  computed: {
    send() { return typeof SEND !== 'undefined' && SEND.telkamer ? SEND.telkamer.to : []; },
    opts() { return KSQ[this.ch] || KSQ['0.1']; },
    liveLabel() {
      return this.tHtml('Tellingen levende / alle cellen per vak <span class="example">voorbeeld</span>');
    },
    /* het rekenwerk van calc.telkamer, ongewijzigd */
    m() {
      const depth = this.ch.startsWith('0.2') ? 0.2 : 0.1;
      const area = num(this.sq);
      const vSq = area * depth;   // µL per square
      const pl = kList(this.liveTxt), pd = kList(this.deadTxt), live = pl.n, dead = pd.n, df = num(this.df) || 1;
      if (!live.length) return {pl, pd, live, dead, bad: []};
      const mL = live.reduce((a, b) => a + b, 0) / live.length;
      const conc = mL / vSq * 1000 * df;   // cells/mL
      const cv = live.length > 1
        ? Math.sqrt(live.reduce((a, b) => a + (b - mL) ** 2, 0) / (live.length - 1)) / mL * 100 : 0;
      const bad = [...pl.bad, ...pd.bad];
      let md = 0, tot = 0, via = 0;
      if (dead.length) {
        md = dead.reduce((a, b) => a + b, 0) / dead.length; tot = mL + md; via = mL / tot * 100;
      }
      return {pl, pd, live, dead, df, vSq, mL, conc, cv, bad, md, tot, via};
    },
    concHtml() { return C(this.m.conc, 3); },
    viaHtml() {
      const via = this.m.via;
      return this.tHtml(`Levensvatbaarheid <span class="chip ${via >= 90 ? 'ok' : via >= 80 ? 'warn' : 'bad'}">${fmt(via, 1)}%</span>`);
    },
    rows() {
      const t = this.t, {live, dead, mL, vSq, df, conc, md, tot} = this.m;
      const rows = [[t('Vakken geteld'), live.length], [t('Gemiddeld per vak'), F(mL, 1)],
        [t('Volume per vak'), F(vSq, 5) + ' µL'], [t('Factor (×1000/V·df)'), C(1000 / vSq * df, 3)]];
      if (dead.length) {
        rows.push([t('Dode cellen/mL'), C(md / vSq * 1000 * df, 3)],
          [t('Totaal cellen/mL'), C(tot / vSq * 1000 * df, 3)]);
      }
      const sv = num(this.sv); if (isFinite(sv)) rows.push([t('Totaal in suspensie'), this.tHtml(sci(conc * sv, 3) + ' cellen')]);
      const need = num(this.need);
      if (isFinite(need) && conc > 0) rows.push([this.tHtml(`Volume voor ${sci(need, 2)} cellen`), lkNumIn(vol(need / conc * 1000))]);
      return rows;
    }
  },
  mounted() { window.__telkamerVm = this; }
};
</script>
