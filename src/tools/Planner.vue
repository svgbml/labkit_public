<!-- ================= EXPERIMENTPLANNER =================
     Een experiment als tijdlijn op #xp-cv. De id's (xp-title, xp-date, xp-start, xp-end, xp-tbl,
     xp-tbl-add, xp-tim, xp-ics, xp-cv, xp-out) blijven zoals ze waren. Het rekenwerk en de
     tekening zijn ongewijzigd uit calc.plan overgenomen (computed m en draw()); de tabel is een
     <lk-etable>, waarvan tblRestore() de rijen via TBLDEF['xp-tbl'].set terugzet. -->
<template>
  <div class="stack">
    <div class="panel">
      <div class="fields">
        <div class="f"><label for="xp-title">{{ t('Titel') }}</label><input id="xp-title" class="txt" v-model="title"></div>
        <div class="f"><label for="xp-date">{{ t('Datum') }}</label><input id="xp-date" class="txt" :placeholder="t('dd-mm-jjjj (leeg = vandaag)')" v-model="date"></div>
        <div class="f"><label for="xp-start">{{ t('Starttijd') }}</label><input id="xp-start" class="txt" v-model="start"></div>
        <div class="f"><label for="xp-end">{{ t('Labdag tot') }}</label><input id="xp-end" class="txt" v-model="end"></div>
      </div>
      <div style="margin-top:12px">
        <lk-etable table-id="xp-tbl" :cols="cols" v-model:rows="rows" add-id="xp-tbl-add"/>
      </div>
      <div class="row" style="margin-top:8px">
        <button type="button" id="xp-tbl-add" @click="addRow">{{ t('+ Stap') }}</button>
        <button type="button" id="xp-tim" @click="timers">{{ t('Wachtstappen als timers') }}</button>
        <button type="button" id="xp-ics" @click="ics">{{ t('Naar agenda (.ics)') }}</button>
        <button type="button" id="xp-bench" @click="bench">{{ t('Bench-modus') }}</button>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Duur in minuten. "Wachten" zijn incubaties of looptijden waarin je iets anders kunt doen; die worden timers. Het .ics-bestand opent in Outlook, Google Agenda en Apple Agenda; elke stap wordt een afspraak in lokale tijd. Voorbeeld: transformatie volgens de Avans DNA-toolbox. Voorbeeldtijden zijn indicatief.') }}</p>
    </div>
    <div class="result">
      <canvas id="xp-cv"></canvas>
      <div class="pic-bar" data-picbar="xp">
        <button type="button" data-png="xp">{{ t('PNG') }}</button>
        <button type="button" data-svg="xp">{{ t('SVG') }}</button>
        <button type="button" data-copy="xp">{{ t('Kopieer afbeelding') }}</button>
        <button type="button" data-picprint="xp">{{ t('Afdrukken') }}</button>
      </div>
      <div id="xp-out">
        <lk-note v-if="!m" kind="info">{{ t('Vul een starttijd (uu:mm) en minstens één stap in.') }}</lk-note>
        <template v-else>
          <lk-big :label="t('Klaar om')" :value="hm(m.t)"/>
          <lk-kv :rows="kvRows"/>
          <lk-note v-if="m.lastHands > m.dayEnd" kind="warn">{{ t('Het laatste handwerk eindigt na ' + m2hm(m.dayEnd) + '; begin eerder of verplaats een stap naar de volgende dag.') }}</lk-note>
          <lk-table :cols="outCols" :rows="outRows"/>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

/* tekst uit een sjabloon in de taal van de gebruiker (voorheen i18nValue op de invoervelden) */
const loc = v => (LANG === 'en' ? trPlain(v, true) : v);

/* de invoer die storeGet() eerder bewaarde onder de id's van deze velden */
const stored = (id, d) => { try { const v = storeGet()[id]; return v == null ? d : v; } catch (e) { return d; } };

const hm2m = t => { const m = String(t).match(/^(\d{1,2})[:.](\d{2})$/); return m ? +m[1] * 60 + +m[2] : NaN; },
  m2hm = m => { const d = Math.floor(m / 1440), r = ((m % 1440) + 1440) % 1440; return `${String(Math.floor(r / 60)).padStart(2, '0')}:${String(Math.round(r % 60)).padStart(2, '0')}${d > 0 ? ` (+${d} d)` : ''}`; };

const DEF = [['Competente cellen ontdooien op ijs', '10', 'wachten'], ['DNA toevoegen en mengen', '10', 'handwerk'], ['Incuberen op ijs', '30', 'wachten'], ['Heat shock 42 °C', '1', 'handwerk'], ['Herstel in SOC, 37 °C schudden', '60', 'wachten'], ['Uitplaten op LB-amp', '20', 'handwerk'], ['Gel gieten voor kolonie-PCR', '30', 'handwerk'], ['Platen incuberen 37 °C', '960', 'wachten']];

export default {
  name: 'Planner',
  data() {
    return {
      title: stored('xp-title', loc('Transformatie en uitplaten')), date: stored('xp-date', ''),
      start: stored('xp-start', '09:00'), end: stored('xp-end', '17:00'),
      rows: DEF.map(r => [loc(r[0]), r[1], r[2]])
    };
  },
  computed: {
    cols() {
      const t = this.t;
      return [{h: t('Stap'), t: 'txt', w: 200}, {h: t('Duur (min)'), t: 'num', w: 80}, {h: t('Soort'), t: 'sel', o: ['handwerk', 'wachten']}];
    },
    /* de stappen met begin en einde, of null zonder stappen of starttijd */
    m() {
      const S = this.steps(), t0 = hm2m(this.start), te = hm2m(this.end);
      if (!S.length || !isFinite(t0)) return null;
      let t = t0; S.forEach(s => { s.a = t; s.b = t + s.d; t = s.b; });
      const tot = t - t0, hands = S.filter(s => !s.w).reduce((a, s) => a + s.d, 0), dayEnd = isFinite(te) ? te : Infinity,
        lastHands = S.filter(s => !s.w).reduce((a, s) => Math.max(a, s.b), t0);
      return {S, t0, te, t, tot, hands, dayEnd, lastHands};
    },
    kvRows() {
      const {tot, hands, lastHands} = this.m, t = this.t, dur = x => t(`${Math.floor(x / 60)} u ${Math.round(x % 60)} min`);
      return [[t('Totale duur'), dur(tot)], [t('Handwerk'), dur(hands)], [t('Laatste handwerk klaar om'), this.hm(lastHands)]];
    },
    outCols() {
      const t = this.t;
      return [{h: t('Stap')}, {h: t('Start')}, {h: t('Klaar')}, {h: t('min'), num: true}, {h: t('Soort')}];
    },
    outRows() {
      const t = this.t;
      return this.m.S.map(s => [esc(s.n), this.hm(s.a), this.hm(s.b), lkNumIn(s.d), t(s.w ? 'wachten' : 'handwerk')]);
    }
  },
  mounted() { this.draw(); },
  updated() { this.draw(); },
  methods: {
    m2hm,
    hm(x) { const s = m2hm(x); return s.includes('(+') ? this.t(s) : lkNumIn(s); },
    addRow() { this.rows = [...this.rows, ['', '', 'handwerk']]; },
    steps() { return this.rows.filter(r => r[0].trim()).map(r => ({n: r[0], d: Math.min(Math.max(num(r[1]) || 0, 0), 1e5), w: r[2] === 'wachten'})); },
    /* elke stap een kaart; een wachtstap krijgt een knop die zijn timer start */
    bench() {
      openBench({title: this.title, steps: this.steps().map(s => ({html: esc(s.n) + ' · ' + lkNumIn(s.d) + ' min',
        timer: s.w && s.d > 0 ? [s.n, s.d * 60] : null}))});
    },
    timers() {
      const S = this.rows.filter(r => r[0].trim() && r[2] === 'wachten' && num(r[1]) > 0);
      S.forEach(r => addTimer(r[0], num(r[1]) * 60)); if (S.length) location.hash = '#timers';
    },
    /* de tekening op #xp-cv; elke render en elke invoer-event roept dit aan */
    draw() {
      const cv = document.getElementById('xp-cv'); if (!cv || !this.m) return;
      const {S, t0, te} = this.m, tot = this.m.tot, title = this.title;
      const span = Math.min(tot, Math.max(...S.filter(s => !s.w || s.d <= 240).map(s => s.b)) - t0 || tot), W = 760, rh = 24, H = 60 + S.length * rh + 40, L = 230, sc = (W - L - 30) / Math.max(span, 1);
      pShow(cv, W, H, (x) => { pTitle(x, title, W); const Y = i => 46 + i * rh; x.font = '12px ' + PFONT(); x.textBaseline = 'middle';
        const stp = Math.max(60, Math.ceil(span / 12 / 60) * 60); for (let m = Math.ceil(t0 / 60) * 60, k = 0; m <= t0 + span && k < 40; m += stp, k++) { const X = L + (m - t0) * sc; x.strokeStyle = PCOL.line; x.beginPath(); x.moveTo(X, 40); x.lineTo(X, H - 26); x.stroke(); x.fillStyle = PCOL.muted; x.textAlign = 'center'; x.fillText(m2hm(m).slice(0, 5), X, H - 14); }
        if (isFinite(te) && te <= t0 + span) { const X = L + (te - t0) * sc; x.strokeStyle = PCOL.warn; x.setLineDash([4, 4]); x.beginPath(); x.moveTo(X, 40); x.lineTo(X, H - 26); x.stroke(); x.setLineDash([]); }
        S.forEach((s, i) => { x.fillStyle = PCOL.ink; x.textAlign = 'left'; x.fillText(uv(s.n.length > 32 ? s.n.slice(0, 31) + '…' : s.n), 10, Y(i) + rh / 2); const a = L + (s.a - t0) * sc, b = L + Math.min(s.b - t0, span) * sc; x.fillStyle = s.w ? '#cfe0f5' : PCOL.acc; x.fillRect(a, Y(i) + 5, Math.max(2, b - a), rh - 10); if (s.b - t0 > span) { x.fillStyle = PCOL.muted; x.fillText('→ ' + m2hm(s.b), Math.min(b + 4, W - x.measureText('→ ' + m2hm(s.b)).width - 8), Y(i) + rh / 2); } }); });
    },
    /* agendabestand: elke stap een afspraak in lokale tijd */
    ics() {
      const S = this.steps(), t0 = hm2m(this.start); if (!S.length || !isFinite(t0)) return;
      const dm = String(this.date).trim().match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/), base = dm ? new Date(+dm[3], +dm[2] - 1, +dm[1]) : new Date(); base.setHours(0, 0, 0, 0);
      const p2 = v => String(v).padStart(2, '0'), ts = m => { const d = new Date(base.getTime() + m * 60000); return `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}T${p2(d.getHours())}${p2(d.getMinutes())}00`; }, now = new Date(), stamp = `${now.getUTCFullYear()}${p2(now.getUTCMonth() + 1)}${p2(now.getUTCDate())}T${p2(now.getUTCHours())}${p2(now.getUTCMinutes())}${p2(now.getUTCSeconds())}Z`, escI = s => String(s).replace(/\\/g, '\\\\').replace(/[,;]/g, m => '\\' + m).replace(/\n/g, '\\n');
      const title = this.title || 'Experiment'; let t = t0; const ev = S.map((s, i) => { const a = t, b = t + Math.max(s.d, 1); t += s.d; return ['BEGIN:VEVENT', `UID:labkit-${stamp}-${i}@labkit-bml`, `DTSTAMP:${stamp}`, `DTSTART:${ts(a)}`, `DTEND:${ts(b)}`, `SUMMARY:${escI(title + ': ' + s.n)}`, `DESCRIPTION:${escI((s.w ? 'wachten' : 'handwerk') + ', ' + s.d + ' min')}`, `TRANSP:${s.w ? 'TRANSPARENT' : 'OPAQUE'}`, 'END:VEVENT'].join('\r\n'); });
      const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Labkit BML//Experimentplanner//NL', 'CALSCALE:GREGORIAN', ...ev, 'END:VCALENDAR'].join('\r\n') + '\r\n';
      saveBlob((title.replace(/[^\w\- ]+/g, '').trim() || 'experiment') + '.ics', new Blob([body], {type: 'text/calendar'})).catch(() => {});
    }
  }
};
</script>
