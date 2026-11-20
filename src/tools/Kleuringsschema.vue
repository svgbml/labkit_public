<!-- ================= KLEURINGSSCHEMA =================
     Een kleuringsprotocol als tijdlijn op #stn-cv. De id's (stn-cv, stn-out, stn-pre, stn-load,
     stn-title, stn-res, stn-tbl, stn-tbl-add) blijven zoals ze waren. De standaardkleuringen
     (STN) blijven in tools/nt/44_stain.js staan; het rekenwerk en de tekening zijn ongewijzigd
     uit calc.stain overgenomen (draw()). De tabel is een <lk-etable>; haar rijen worden door
     tblRestore() via TBLDEF['stn-tbl'].set teruggezet. -->
<template>
  <div class="picwrap">
    <div class="pic-prev">
      <div class="result">
        <canvas id="stn-cv"></canvas>
        <div class="pic-bar" data-picbar="stn">
          <button type="button" data-png="stn">{{ t('PNG') }}</button>
          <button type="button" data-svg="stn">{{ t('SVG') }}</button>
          <button type="button" data-copy="stn">{{ t('Kopieer afbeelding') }}</button>
          <button type="button" data-picprint="stn">{{ t('Afdrukken') }}</button>
        </div>
        <div id="stn-out">
          <lk-note v-if="!S.length" kind="info">{{ t('Voeg minstens één stap toe.') }}</lk-note>
          <lk-kv v-else :rows="kvRows"/>
        </div>
      </div>
    </div>
    <div class="panel">
      <div class="fields">
        <div class="f">
          <label for="stn-pre">{{ t('Kleuring') }}</label>
          <div class="row" style="gap:8px;flex-wrap:nowrap">
            <select id="stn-pre" style="flex:1;min-width:0" v-model="pre">
              <option value="gram">{{ t('Gramkleuring') }}</option>
              <option value="zn">{{ t('Ziehl-Neelsen (zuurvast)') }}</option>
              <option value="spore">{{ t('Sporenkleuring (Schaeffer-Fulton)') }}</option>
            </select>
            <button type="button" id="stn-load" @click="load">{{ t('Laden') }}</button>
          </div>
        </div>
        <div class="f">
          <label for="stn-title">{{ t('Titel') }}</label>
          <input id="stn-title" class="txt" v-model="title">
        </div>
        <div class="f" style="grid-column:1/-1">
          <label for="stn-res">{{ t('Uitkomst') }}</label>
          <input id="stn-res" class="txt" v-model="res">
        </div>
      </div>
      <div style="margin-top:12px">
        <lk-etable table-id="stn-tbl" :cols="cols" v-model:rows="rows" add-id="stn-tbl-add"/>
      </div>
      <div class="row" style="margin-top:8px">
        <button type="button" id="stn-tbl-add" @click="addRow">{{ t('+ Stap') }}</button>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Tijd in seconden; laat leeg voor "kort" of "tot helder". Kleur als hexcode of naam. Volg altijd het protocol van je practicum of de fabrikant: tijden en reagentia verschillen.') }}</p>
    </div>
  </div>
</template>

<script>
import {lkNumIn} from '../lib/bridge.js';

/* tekst uit een sjabloon in de taal van de gebruiker (voorheen i18nValue op de invoervelden) */
const loc = v => (LANG === 'en' ? trPlain(v, true) : v);
const locRows = rows => rows.map(r => r.map(loc));

/* de invoer die storeGet() eerder bewaarde onder de id's van deze velden */
const stored = (id, d) => { try { const v = storeGet()[id]; return v == null ? d : v; } catch (e) { return d; } };

/* hoe lang een stap duurt, voor het label in de tekening */
const tt = v => { const s = num(v); if (!isFinite(s)) return 'kort / tot helder'; return s >= 60 ? (s % 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s / 60} min`) : `${s} s`; };

export default {
  name: 'Kleuringsschema',
  data() {
    return {
      pre: stored('stn-pre', 'gram'),
      title: stored('stn-title', loc(STN.gram.t)),
      res: stored('stn-res', loc(STN.gram.r)),
      rows: locRows(STN.gram.s)
    };
  },
  computed: {
    cols() {
      const t = this.t;
      return [{h: t('Stap / reagens'), t: 'txt', w: 200}, {h: t('Tijd (s)'), t: 'num', w: 64}, {h: t('Kleur'), t: 'txt', w: 80}];
    },
    S() { return this.rows.filter(r => String(r[0]).trim()); },
    kvRows() {
      const tot = this.S.reduce((s, r) => s + (num(r[1]) || 0), 0), t = this.t;
      return [[t('Stappen'), lkNumIn(this.S.length)], [t('Wachttijd in totaal (zonder spoelen)'), lkNumIn(tt(String(tot)))]];
    }
  },
  mounted() { this.draw(); },
  updated() { this.draw(); },
  methods: {
    load() {
      const P = STN[this.pre];
      this.title = loc(P.t); this.res = loc(P.r); this.rows = locRows(P.s);
      this.$nextTick(() => ['stn-title', 'stn-res'].forEach(id => document.getElementById(id).dispatchEvent(new Event('input', {bubbles: true}))));
    },
    addRow() { this.rows = [...this.rows, ['', '', '']]; },
    /* de tekening op #stn-cv; elke render en elke invoer-event roept dit aan */
    draw() {
      const cv = document.getElementById('stn-cv'); if (!cv) return;
      const S = this.S, title = this.title, res = this.res;
      if (!S.length) return;
      /* Tijdlijn: de breedte van een stap is evenredig met zijn tijd, met een ondergrens zodat
         een korte stap leesbaar blijft. Stappen zonder tijd (spoelen, ontkleuren tot helder)
         krijgen die ondergrens en een druppel in plaats van een blok met tijd. */
      const secs = S.map(r => { const v = num(r[1]); return isFinite(v) && v > 0 ? v : 0; }), totS = secs.reduce((a, b) => a + b, 0);
      const MINW = 78, budget = Math.max(560, S.length * 96);
      const wid = S.map((r, i) => totS > 0 && secs[i] > 0 ? Math.max(MINW, budget * secs[i] / totS) : MINW);
      const X = []; wid.reduce((a, w, i) => { X[i] = 20 + a; return a + w; }, 0);
      const totW = wid.reduce((a, b) => a + b, 0), W = Math.max(520, totW + 40), BH = 30, H = (title ? 40 : 0) + 150 + (res ? 34 : 0);
      const colOf = r => /^#[0-9a-f]{3,8}$/i.test(r[2]) ? r[2] : '#9aa6b2';
      pShow(cv, W, H, (x) => { const t0 = pTitle(x, title, W), by = t0 + 74;
        S.forEach((r, i) => { const c = colOf(r), w = wid[i], xa = X[i], xm = xa + w / 2, hasT = secs[i] > 0;
          /* balk van de stap */
          x.fillStyle = c; x.globalAlpha = hasT ? 0.9 : 0.35; x.beginPath(); x.roundRect(xa + 1, by, w - 2, BH, 5); x.fill(); x.globalAlpha = 1;
          x.strokeStyle = PCOL.line; x.lineWidth = 1; x.beginPath(); x.roundRect(xa + 1, by, w - 2, BH, 5); x.stroke();
          /* druppel reagens boven de balk */
          const dy = by - 14, dr = 7;
          x.fillStyle = c; x.beginPath(); x.moveTo(xm, dy - dr * 1.5); x.quadraticCurveTo(xm + dr, dy - dr * 0.2, xm + dr * 0.72, dy + dr * 0.35);
          x.quadraticCurveTo(xm, dy + dr * 1.25, xm - dr * 0.72, dy + dr * 0.35); x.quadraticCurveTo(xm - dr, dy - dr * 0.2, xm, dy - dr * 1.5); x.closePath();
          if (hasT) x.fill(); else { x.strokeStyle = c; x.lineWidth = 1.6; x.stroke(); }
          /* volgnummer in de balk */
          x.fillStyle = inkOn(c); x.font = '600 12px ' + PFONT(); x.textAlign = 'center'; x.textBaseline = 'middle';
          if (hasT) x.fillText(String(i + 1), xm, by + BH / 2);
          else { x.fillStyle = PCOL.muted; x.fillText(String(i + 1), xm, by + BH / 2); }
          /* naam en tijd onder de balk, passend gemaakt op de breedte */
          const room = w - 8;
          x.fillStyle = PCOL.ink; x.font = '11.5px ' + PFONT();
          const words = trCanvas(String(r[0] || '')).split(' '); let line = '', ly = by + BH + 18, lines = 0;
          words.forEach(wd => { const t2 = (line + ' ' + wd).trim();
            if (x.measureText(uv(t2)).width > room && line) { if (lines < 2) { x.fillText(uv(line), xm, ly); ly += 14; lines++; line = wd; } else line = t2; }
            else line = t2; });
          if (line) { let r2 = line; while (r2.length > 1 && x.measureText(uv(r2 + '…')).width > room) r2 = r2.slice(0, -1);
            x.fillText(uv(r2 === line ? line : r2 + '…'), xm, ly); ly += 14; }
          /* in de tekening een kort tijdlabel; de volledige omschrijving staat in de tabel */
          x.fillStyle = PCOL.muted; x.font = '11px ' + PFONT(); x.fillText(hasT ? tt(r[1]) : 'kort', xm, ly); });
        /* tijdas onder de balken */
        x.strokeStyle = PCOL.line; x.lineWidth = 1; x.beginPath(); x.moveTo(20, by - 30); x.lineTo(20 + totW, by - 30); x.stroke();
        x.fillStyle = PCOL.muted; x.font = '10.5px ' + PFONT(); x.textAlign = 'left'; x.textBaseline = 'alphabetic';
        x.fillText('0', 20, by - 35); x.textAlign = 'right';
        if (totS > 0) x.fillText(tt(String(totS)), 20 + totW, by - 35);
        x.textAlign = 'center'; x.fillText('tijd', 20 + totW / 2, by - 35);
        if (res) { x.fillStyle = PCOL.ink; x.font = '600 12.5px ' + PFONT(); x.textAlign = 'left'; x.textBaseline = 'alphabetic'; x.fillText(res, 20, H - 14); } });
    }
  }
};
</script>
