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
  <!-- S115: pipetprofielen met historie en certificaat; alles in één jget-sleutel 'pipettes' -->
  <div class="panel" id="pc-prof" style="margin-top:14px">
    <div class="fields">
      <div class="f">
        <label for="pc-sel">{{ t('Pipetprofielen') }}</label>
        <select id="pc-sel" style="width:100%" v-model="sel" @change="pick">
          <option value="">{{ t('Geen profiel') }}</option>
          <option v-for="p in profs" :key="p.id" :value="p.id">{{ p.name }}{{ p.serial ? ' (' + p.serial + ')' : '' }}</option>
        </select>
      </div>
      <div class="f" style="align-self:end"><button type="button" @click="adding = !adding">{{ t('+ Pipet') }}</button></div>
    </div>
    <div v-if="adding" class="fields" style="margin-top:10px">
      <div class="f"><label for="pc-pn">{{ t('Naam / merk') }}</label><input id="pc-pn" v-model="np.name"></div>
      <div class="f"><label for="pc-ps">{{ t('Serienummer') }}</label><input id="pc-ps" v-model="np.serial"></div>
      <lk-field v-model="np.nom" :label="t('Nominaal volume pipet')" for-id="pc-pnom" unit="µL"/>
      <div class="f">
        <label for="pc-pch">{{ t('Type') }}</label>
        <select id="pc-pch" style="width:100%" v-model="np.ch">
          <option value="1">{{ t('enkelkanaals') }}</option>
          <option value="2">{{ t('meerkanaals (grenzen × 2)') }}</option>
        </select>
      </div>
      <div class="f" style="align-self:end"><button type="button" @click="addProf">{{ t('Bewaar pipet') }}</button></div>
    </div>
    <div class="row" style="margin-top:10px;gap:8px;flex-wrap:wrap">
      <button type="button" :disabled="!sel || !P" @click="save">{{ t('Bewaar in historie') }}</button>
      <button type="button" :disabled="!P" @click="cert">{{ t('Certificaat afdrukken') }}</button>
      <button type="button" v-if="sel" @click="delProf">{{ t('Verwijder pipet') }}</button>
    </div>
    <template v-if="cur">
      <p v-if="!cur.hist.length" style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Nog geen metingen in de historie.') }}</p>
      <div v-else @click="delHist">
        <lk-table :cols="histCols" :rows="histRows"/>
        <svg v-if="cur.hist.length > 1" viewBox="0 0 480 200" style="width:100%;max-width:480px;margin-top:10px" role="img" :aria-label="t('Systematische fout over tijd')">
          <line :x1="40" :x2="470" :y1="gy(0)" :y2="gy(0)" stroke="var(--muted)"/>
          <template v-for="k in [1, -1]" :key="k">
            <polyline v-if="gLim.length" :points="gLim.map(l => l.x + ',' + gy(k * l.v)).join(' ')" fill="none" stroke="var(--bad)" stroke-dasharray="5 4" stroke-width="1.5"/>
          </template>
          <polyline :points="gPts.map(p => p.x + ',' + p.y).join(' ')" fill="none" stroke="var(--muted)"/>
          <circle v-for="(p, i) in gPts" :key="i" :cx="p.x" :cy="p.y" r="4" :fill="p.pass === false ? 'var(--bad)' : 'var(--accent)'"/>
          <text x="40" y="12" font-size="11" fill="var(--muted)">{{ t('Systematische fout (%) en ISO-grens') }}</text>
          <text x="36" :y="gy(0) + 4" font-size="10" text-anchor="end" fill="var(--muted)">0</text>
          <text x="36" y="16" font-size="10" text-anchor="end" fill="var(--muted)">{{ gMax.toFixed(1) }}</text>
          <text x="36" y="186" font-size="10" text-anchor="end" fill="var(--muted)">-{{ gMax.toFixed(1) }}</text>
          <text v-for="(p, i) in gPts" :key="'d' + i" :x="p.x" y="198" font-size="9" text-anchor="middle" fill="var(--muted)">{{ cur.hist[i].date.slice(5) }}</text>
        </svg>
      </div>
    </template>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

const todayISO = () => new Date().toLocaleDateString('sv');  // lokale datum als JJJJ-MM-DD (toISOString is UTC)
const F = (x, d) => lkNumIn(fmt(x, d));

export default {
  name: 'Pipcal',
  data() {
    return {
      v: '100', nom: '100', temp: lkNumIn('21,5'), ch: '1',
      m: lkNumIn('99,61 99,72 99,58 99,80 99,66 99,70 99,63 99,75 99,69 99,60'),
      profs: jget('pipettes', []), sel: '', adding: false, np: {name: '', serial: '', nom: '100', ch: '1'}
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
    cur() { return this.profs.find(p => p.id === this.sel) || null; },
    histCols() { const t = this.t; return [{h: t('Datum')}, {h: t('Volume'), num: true}, {h: t('Systematische fout %'), num: true}, {h: t('Toevallige fout CV %'), num: true}, {h: t('Uitslag')}, {h: ''}]; },
    histRows() {
      return this.cur.hist.map((h, i) => [esc(h.date), F(h.v, 1) + ' µL', F(h.es, 2), F(h.cv, 2),
        h.pass == null ? '–' : `<span class="chip ${h.pass ? 'ok' : 'bad'}">${this.t(h.pass ? 'voldoet' : 'voldoet niet')}</span>`,
        `<button type="button" class="mini" data-del="${i}" aria-label="${esc(this.t('Verwijder'))}">×</button>`]);
    },
    /* de grafiek: x gelijk verdeeld over de metingen, y symmetrisch rond 0 */
    gMax() {
      const h = this.cur.hist;
      return Math.max(0.1, ...h.map(e => Math.abs(e.es)), ...h.filter(e => isFinite(e.limS)).map(e => e.limS)) * 1.15;
    },
    gx() { const n = this.cur.hist.length; return i => 40 + (n > 1 ? i / (n - 1) : 0.5) * 420; },
    gPts() { const h = this.cur.hist; return h.map((e, i) => ({x: this.gx(i), y: this.gy(e.es), pass: e.pass})); },
    gLim() { const h = this.cur.hist; return h.map((e, i) => ({x: this.gx(i), v: e.limS})).filter(l => isFinite(l.v)); },
    formula() { return this.tHtml('V = m × Z · e<sub>s</sub> = (V̄ − V<sub>s</sub>) / V<sub>s</sub> · CV = s / V̄'); }
  },
  methods: {
    F(x, d) { return F(x, d); },
    gy(v) { return 100 - v / this.gMax * 88; },
    store() { jset('pipettes', this.profs); },
    /* een profiel kiezen vult nominaal volume en type in; de ids van de velden blijven */
    pick() { const p = this.cur; if (p) { this.nom = lkNumIn(String(p.nom).replace('.', ',')); this.ch = String(p.ch); } },
    addProf() {
      const n = this.np; if (!n.name.trim() && !n.serial.trim()) return;
      const p = {id: 'p' + Date.now(), name: n.name.trim(), serial: n.serial.trim(), nom: num(n.nom) || 0, ch: num(n.ch) || 1, hist: []};
      this.profs.push(p); this.store(); this.sel = p.id; this.pick(); this.adding = false;
      this.np = {name: '', serial: '', nom: this.np.nom, ch: this.np.ch};
    },
    delProf() { this.profs = this.profs.filter(p => p.id !== this.sel); this.sel = ''; this.store(); },
    /* uitslag alleen als er ISO-grenzen zijn; anders null (onbekend) */
    verdict() { const P = this.P; return isFinite(P.limS) ? !!(P.okS && P.okR) : null; },
    save() {
      const P = this.P; if (!this.cur || !P) return;
      this.cur.hist.push({date: todayISO(), v: P.Vs, Vm: P.Vm, es: P.es, cv: P.cv, limS: P.limS, limR: P.limR, pass: this.verdict()});
      this.store();
    },
    delHist(e) {
      const b = e.target.closest('[data-del]'); if (!b || !this.cur) return;
      this.cur.hist.splice(+b.dataset.del, 1); this.store();
    },
    /* een A4-certificaat via dezelfde afdrukroute als de transformatiekaart (rpPrint) */
    cert() {
      const P = this.P; if (!P) return;
      const T = x => esc(trPlain(x)), p = this.cur, pass = this.verdict();
      const title = trPlain('Pipetcertificaat'), mg = numsC(this.m);
      /* de sleutels zijn vaste teksten (een mag <sub> bevatten), dus trPlain zonder esc */
      const row = (k, v) => '<tr><th>' + trPlain(k) + '</th><td>' + v + '</td></tr>';
      const lim = (ok, a) => isFinite(a) ? ' &nbsp; ' + T('grens') + ' ' + esc(F(a, 2)) + '% &mdash; ' + T(ok ? 'voldoet' : 'voldoet niet') : '';
      rpPrint('<!doctype html><meta charset="utf-8"><title>' + esc(title) + '</title><style>'
        + '@page{size:A4;margin:16mm}body{margin:0;font:13px system-ui,sans-serif;color:#1f2933}'
        + 'h1{font-size:22px;margin:0 0 12px}table{border-collapse:collapse;width:100%;font-size:13px;margin-bottom:14px}'
        + 'th,td{border:1px solid #c9ced6;padding:6px 8px;text-align:left;vertical-align:top}th{background:#eef0f3;width:38%}'
        + '.res{text-align:center;font-size:40px;font-weight:700;padding:14px;border:3px solid;margin:18px 0}'
        + '.ok{color:#1a7f37}.bad{color:#c62828}.src{margin:14px 0 0;font-size:11px;color:#5f6b7a}'
        + '.sign{margin-top:34px;font-size:12px;color:#5f6b7a;line-height:3}'
        + '</style><h1>' + esc(title) + '</h1><table>'
        + (p ? row('Pipet', esc(p.name)) + row('Serienummer', esc(p.serial)) : '')
        + row('Datum', esc(todayISO()))
        + row('Ingesteld volume', esc(F(P.Vs, 2)) + ' µL')
        + row('Nominaal volume pipet', esc(F(P.nom, 2)) + ' µL' + (P.mc > 1 ? ' (' + T('meerkanaals (grenzen × 2)') + ')' : ''))
        + row('Watertemperatuur', esc(F(num(this.temp), 1)) + ' °C')
        + row('Wegingen in mg', esc(mg.map(x => F(x, 2)).join('; ')))
        + row('Gemiddeld volume', esc(F(P.Vm, 3)) + ' µL')
        + row('Systematische fout e<sub>s</sub>', esc(F(P.es, 2)) + '%' + lim(P.okS, P.limS))
        + row('Toevallige fout CV', esc(F(P.cv, 2)) + '%' + lim(P.okR, P.limR))
        + '</table>'
        + (pass == null ? '' : '<div class="res ' + (pass ? 'ok' : 'bad') + '">' + T(pass ? 'Goedgekeurd' : 'Afgekeurd') + '</div>')
        + '<p class="src">' + T('Grenzen volgens ISO 8655 (tabel bij nominaal volume); Z-factor voor water bij de gemeten temperatuur.') + '</p>'
        + '<p class="sign">' + T('Uitgevoerd door') + ': ________________ &nbsp; ' + T('Datum') + ': ________________<br>' + T('Handtekening') + ': ________________</p>');
    }
  }
};
</script>
