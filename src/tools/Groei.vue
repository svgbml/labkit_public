<!-- ================= GROEICURVE =================
     Specifieke groeisnelheid, verdubbelingstijd en lag-fase uit OD₆₀₀-metingen of kiemgetallen.
     Het rekenwerk (bestWindow, de regressie op ln(waarde), µ, t_d en de lag) is dat van de oude
     calc.groei() in web/index.html; alleen de weergave is opnieuw opgebouwd.

     De metingen staan in een <lk-etable> (met rijnummers); de toevoegknop blijft van de tool.
     De tekening blijft met de gewone tekencontext gemaakt: chart() tekent na elke render
     opnieuw. In de automatische modus laat de component het gevonden venster in de velden
     "van punt / tot punt" zien (een computed, dus zonder bijwerk-lus); kiest de gebruiker
     "zelf kiezen", dan nemen die velden dat venster over als beginwaarde. De id's g2-tu,
     g2-type, g2-blank, g2-fac, g2-win, g2-from, g2-to, gc-tbl, gc-add, gc-cv en gc-res blijven
     zoals ze waren. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <div class="f">
          <label for="g2-tu">{{ t('Tijdseenheid') }}</label>
          <select id="g2-tu" v-model="tu" style="width:100%">
            <option value="h">{{ t('uur') }}</option>
            <option value="min">{{ t('minuten') }}</option>
          </select>
        </div>
        <div class="f">
          <label for="g2-type">{{ t('Meetwaarde') }}</label>
          <select id="g2-type" v-model="type" style="width:100%">
            <option value="od">{{ t('OD₆₀₀') }}</option>
            <option value="kve">{{ t('KVE/mL of cellen/mL') }}</option>
          </select>
        </div>
        <div class="f" data-expert="">
          <label for="g2-blank">{{ t('Blanco (medium)') }}</label>
          <input id="g2-blank" inputmode="decimal" v-model="blank">
        </div>
        <div class="f" data-expert="">
          <label for="g2-fac">{{ t('Cellen/mL bij OD 1,0') }}</label>
          <input id="g2-fac" inputmode="decimal" v-model="fac">
        </div>
        <div class="f">
          <label for="g2-win">{{ t('Exponentiële fase') }}</label>
          <select id="g2-win" v-model="win" style="width:100%">
            <option value="auto">{{ t('Automatisch') }}</option>
            <option value="man">{{ t('Zelf kiezen') }}</option>
          </select>
        </div>
        <div class="f">
          <label for="g2-from">{{ t('Van punt / tot punt') }}</label>
          <div class="inu">
            <input id="g2-from" inputmode="numeric" :value="fromShow" @input="from = $event.target.value"
              style="border-radius:4px 0 0 4px">
            <input id="g2-to" inputmode="numeric" :value="toShow" @input="to = $event.target.value"
              style="border-radius:0 4px 4px 0;border-left:0">
          </div>
        </div>
        <lk-field v-model="target" :label="t('Doelwaarde (voorspelling)')" for-id="g2-target"/>
      </div>
      <h3 style="margin-top:16px"
        v-html="tHtml('Metingen &lt;span class=&quot;example&quot;&gt;voorbeeld&lt;/span&gt;')"></h3>
      <lk-etable table-id="gc-tbl" :cols="cols" v-model:rows="rows" add-id="gc-add" numbered/>
      <div class="row" style="margin-top:10px">
        <button type="button" id="gc-add" @click="addRow">{{ t('+ Meetpunt') }}</button>
        <button type="button" id="gc-now" @click="readNow">{{ t('+ Meting nu') }}</button>
        <button type="button" id="gc-stop" v-if="t0" @click="t0 = null">{{ t('Live stoppen') }}</button>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Live: "+ Meting nu" zet een meetpunt op de verstreken tijd sinds de start (de eerste keer telt de klok door vanaf het laatste meetpunt) en de voorspelling wordt bij elke meting opnieuw berekend.') }}</p>
    </div>
    <div class="result">
      <canvas id="gc-cv" v-show="has"></canvas>
      <div id="gc-res">
        <lk-note v-if="few" kind="info">{{ t('Vul minstens drie meetpunten met een waarde boven de blanco in.') }}</lk-note>
        <lk-note v-else-if="m === 'kort'" kind="bad">{{ t('Kies minstens twee punten voor de exponentiële fase.') }}</lk-note>
        <lk-note v-else-if="m === 'geen'" kind="warn">{{ t('Geen exponentiële fase gevonden (geen reeks van 3–4 punten met R² ≥ 0,98). Kies het venster zelf.') }}</lk-note>
        <template v-else-if="has">
          <lk-big :label="t('Verdubbelingstijd')" :value="L(fmt(m.td * 60, 1))" sub="min" top="8px"/>
          <lk-kv :rows="kvRows"/>
          <lk-range what="R² (ln)" :value="m.w.r.r2" :lo="0.98" :digits="3" :low="t('De punten in het venster liggen niet op een rechte lijn; kies een venster binnen de exponentiële fase.')" :ok="t('Het venster ligt in een nette exponentiële fase.')"/>
          <lk-note v-if="m.odHigh" kind="warn">{{ t('Het venster loopt boven OD 1,0; daar is OD niet meer evenredig met het celaantal. Verdun of kies een eerder venster.') }}</lk-note>
          <lk-note v-if="m.three" kind="info">{{ t('Het venster bevat maar 3 punten; meet vaker in de exponentiële fase.') }}</lk-note>
          <template v-if="pred">
            <lk-note v-if="pred.done" kind="ok">{{ t('De doelwaarde is bereikt.') }}</lk-note>
            <template v-else>
              <lk-kv :rows="predRows"/>
              <lk-note v-if="pred.past" kind="warn">{{ t('De laatste meting ligt na de exponentiële fase; de voorspelling gaat uit van verdere exponentiële groei en is daar te vroeg.') }}</lk-note>
              <div class="row" v-if="pred.at" style="margin-top:8px">
                <button type="button" id="gc-rem" @click="remOk = addReminder('⏰ ' + target, pred.at)">{{ t('Herinnering bij de doelwaarde') }}</button>
              </div>
              <lk-note v-if="remOk" kind="ok">{{ t('Herinnering gezet; je ziet hem bij Timers.') }}</lk-note>
            </template>
          </template>
          <lk-formula :html="formula"/>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const L = lkNumIn, LIVE = 'labkit:v1:groeilive';

/* de voorbeeldmetingen van de oude GCDATA, als tekst met een komma zoals de invoer ze toont */
const GCDATA = [['0', '0,05'], ['0,5', '0,052'], ['1', '0,058'], ['1,5', '0,075'], ['2', '0,11'],
  ['2,5', '0,17'], ['3', '0,26'], ['3,5', '0,4'], ['4', '0,6'], ['4,5', '0,85'], ['5', '1,1'],
  ['6', '1,45'], ['7', '1,55']];

/* het langste venster van 3 (of bij ≥ 6 punten 4) of meer punten met de steilste helling en R² ≥ 0,98 */
function bestWindow(t, ly) {
  const n = t.length, minL = n >= 6 ? 4 : 3; let best = null;
  for (let i = 0; i < n; i++) for (let j = i + minL - 1; j < n; j++) {
    const r = linreg(t.slice(i, j + 1), ly.slice(i, j + 1));
    if (r.b > 0 && r.r2 >= 0.98 && (!best || r.b > best.r.b * 1.0001
      || (Math.abs(r.b - best.r.b) <= best.r.b * 1e-4 && j - i > best.j - best.i))) best = {i, j, r};
  }
  return best;
}

export default {
  name: 'Groei',
  data() {
    return {
      tu: 'h', type: 'od', blank: '0', fac: '8e8', win: 'auto', from: '4', to: '9', target: '', remOk: false,
      t0: jget(LIVE, null),
      rows: GCDATA.map(r => r.map(v => L(v)))
    };
  },
  computed: {
    L() { return L; },
    cols() {
      return [{h: this.t('Tijd'), t: 'num', w: 80}, {h: this.t('Waarde'), t: 'num', w: 90}];
    },
    /* de meetpunten, op tijd gesorteerd, met de blanco eraf; ok = punten boven de blanco */
    ok() {
      const blank = this.type === 'od' ? (num(this.blank) || 0) : 0;
      return this.rows.map((r, idx) => ({idx, t: num(r[0]), y: num(r[1])}))
        .filter(p => isFinite(p.t) && isFinite(p.y)).map(p => ({...p, v: p.y - blank}))
        .sort((a, b) => a.t - b.t).filter(p => p.v > 0);
    },
    has() { return !!this.m && typeof this.m === 'object'; },
    few() { return this.ok.length < 3; },
    th() { return this.ok.map(p => this.tu === 'min' ? p.t / 60 : p.t); },
    ly() { return this.ok.map(p => Math.log(p.v)); },
    /* het venster dat de automatische zoekactie vindt (of null) */
    autoW() { return this.few ? null : bestWindow(this.th, this.ly); },
    /* de velden tonen in de automatische modus het gevonden venster */
    fromShow() { return this.win === 'auto' && this.autoW ? String(this.autoW.i + 1) : this.from; },
    toShow() { return this.win === 'auto' && this.autoW ? String(this.autoW.j + 1) : this.to; },
    /* de uitkomst: een venster met regressie, of 'kort' / 'geen' als er geen venster is */
    m() {
      if (this.few) return null;
      const {ok, th, ly, tu} = this;
      let w;
      if (this.win === 'man') {
        const a = Math.max(1, Math.round(num(this.from) || 1)) - 1,
          b = Math.min(ok.length, Math.round(num(this.to) || ok.length)) - 1;
        if (b - a < 1) return 'kort';
        w = {i: a, j: b, r: linreg(th.slice(a, b + 1), ly.slice(a, b + 1))};
      } else {
        w = this.autoW; if (!w) return 'geen';
      }
      const mu = w.r.b, td = Math.log(2) / mu, lag = (ly[0] - w.r.a) / mu;
      return {w, mu, td, lag, tconv: v => tu === 'min' ? v * 60 : v,
        odHigh: this.type === 'od' && ok[w.j].v > 1.0, three: w.j - w.i + 1 < 4};
    },
    /* voorspelling vanaf het laatste meetpunt met de µ van het venster: t = t_laatst + ln(doel/y_laatst)/µ (uur) */
    pred() {
      const m = this.m, blank = this.type === 'od' ? (num(this.blank) || 0) : 0, goal = num(this.target) - blank;
      if (!this.has || !(goal > 0)) return null;
      const last = this.ok.length - 1, v = this.ok[last].v;
      if (v >= goal) return {done: true};
      const th = this.th[last] + Math.log(goal / v) / m.mu, dh = th - this.th[last];
      const at = this.t0 ? this.t0 + th * 3600e3 : null;
      return {th, dh, at, past: last > m.w.j};
    },
    predRows() {
      const p = this.pred, t = this.t, e = this.tu === 'min' ? ' min' : ' u', u = this.m.tconv;
      const rows = [[t('Doelwaarde bereikt bij'), t(L(fmt(u(p.th), 2)) + e)], [t('Nog te gaan'), t(L(fmt(u(p.dh), 2)) + e)]];
      if (p.at) rows.push([t('Verwacht om'), new Date(p.at).toLocaleTimeString(LANG === 'en' ? 'en-GB' : 'nl-NL', {hour: '2-digit', minute: '2-digit'})]);
      return rows;
    },
    kvRows() {
      const m = this.m, t = this.t, {ok, tu, type} = this, w = m.w;
      const eenheid = tu === 'min' ? ' min' : ' u';
      const rows = [[t('Specifieke groeisnelheid µ'), L(fmt(m.mu, 3)) + ' h⁻¹'],
        [t('Verdubbelingstijd'), L(fmt(m.td * 60, 1)) + ' min'],
        [t('Generaties per uur'), L(fmt(1 / m.td, 2))],
        [t('Exponentiële fase'), t('punt ' + (ok[w.i].idx + 1) + '–' + (ok[w.j].idx + 1) + ' ('
          + L(fmt(ok[w.i].t, 2)) + '–' + L(fmt(ok[w.j].t, 2)) + eenheid + ')')],
        [t('R² (ln-waarde)'), L(fmt(w.r.r2, 4))],
        [t('Lag-fase'), m.lag > this.th[0] ? t(L(fmt(m.tconv(m.lag), 2)) + eenheid) : t('geen')],
        [t('Maximum'), L(sig(Math.max(...ok.map(p => p.v)), 3))]];
      const fac = num(this.fac);
      if (type === 'od' && isFinite(fac)) {
        rows.push([t('Cellen/mL aan einde exp. fase (schatting)'), L(sci(ok[w.j].v * fac, 2))]);
      }
      return rows;
    },
    formula() {
      const m = this.m; if (!this.has) return '';
      return this.tHtml('ln(y) = ' + L(fmt(m.w.r.a, 3)) + ' + ' + L(fmt(m.mu, 4))
        + '·t (t in uur) · t<sub>d</sub> = ln 2 / µ');
    }
  },
  watch: {
    t0(v) { jset(LIVE, v); this.remOk = false; },
    /* bij het omschakelen naar "zelf kiezen" worden de velden het gevonden venster; sync, zodat
       een waarde die direct daarna wordt ingevuld niet wordt overschreven */
    win: {
      flush: 'sync',
      handler(nu) {
        if (nu === 'man' && this.autoW) { this.from = String(this.autoW.i + 1); this.to = String(this.autoW.j + 1); }
      }
    }
  },
  mounted() { this.draw(); },
  updated() { this.draw(); },
  methods: {
    fmt(x, d) { return fmt(x, d); },
    addReminder: (n, at) => addReminder(n, at),
    /* live: een meetpunt op de verstreken tijd sinds t0; zonder t0 telt de klok door vanaf het laatste meetpunt */
    readNow() {
      const ms = this.tu === 'min' ? 60e3 : 3600e3;
      if (!this.t0) { const ts = this.rows.map(r => num(r[0])).filter(isFinite); this.t0 = Date.now() - (ts.length ? Math.max(...ts) : 0) * ms; }
      this.rows = [...this.rows, [L(fmt((Date.now() - this.t0) / ms, 2)), '']];
      this.$nextTick(() => { const r = document.querySelectorAll('#gc-tbl tbody tr'), i = r.length && r[r.length - 1].querySelectorAll('input'); if (i && i.length) i[i.length - 1].focus(); });
    },
    addRow() { this.rows = [...this.rows, ['', '']]; },
    draw() {
      const cv = document.getElementById('gc-cv'), m = this.m;
      if (!cv || !this.has) return;
      const {ok, tu, type} = this, w = m.w, mu = m.mu;
      const inW = i => i >= w.i && i <= w.j;
      /* de voorspelling (S57): doellijn en de fit doorgetrokken tot het voorspelde tijdstip, hoogstens anderhalf keer de meetduur */
      const pr = this.pred, goal = pr ? num(this.target) - (type === 'od' ? (num(this.blank) || 0) : 0) : NaN,
        x0 = Math.min(...ok.map(p => p.t)), xl = Math.max(...ok.map(p => p.t)),
        xp = pr && !pr.done && m.tconv(pr.th) <= xl + (xl - x0) / 2 ? m.tconv(pr.th) : null;
      const ymin = Math.min(...ok.map(p => p.v)) / 1.6, ymax = Math.max(...ok.map(p => p.v), pr ? goal : 0) * 1.6;
      const extra = pr ? [{fn: () => goal, x0, x1: xp || xl, color: '--warn', dash: [2, 3], name: 'doelwaarde'}] : [];
      chart(cv, {xmin: x0, xmax: xp || xl, ymin, ymax, logy: true,
        xlabel: `tijd (${tu === 'min' ? 'min' : 'uur'})`,
        ylabel: type === 'od' ? 'OD₆₀₀ (log-schaal)' : 'KVE/mL (log-schaal)',
        series: [{pts: ok.filter((p, i) => !inW(i)).map(p => [p.t, p.v]), color: '--muted', name: 'meting'},
          {pts: ok.filter((p, i) => inW(i)).map(p => [p.t, p.v]), color: '--accent', r: 4.5, name: 'exponentiële fase'},
          {fn: t => Math.exp(w.r.a + mu * (tu === 'min' ? t / 60 : t)), x0: ok[Math.max(0, w.i - 1)].t,
            x1: xp || ok[Math.min(ok.length - 1, w.j + 1)].t, color: '--bad', dash: [5, 4], name: 'exponentiële fit'}, ...extra],
        legend: [['exponentiële fase', '--accent'], ['fit', '--bad'], ...(pr ? [['doelwaarde', '--warn']] : [])], legendPos: 'br'});
    }
  }
};
</script>
