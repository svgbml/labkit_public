<!-- ================= QPCR-PLAATINDELING =================
     De plaatindeling (qpRows, QPEXP, qpExport, qpTask) blijft in tools/nt/46_qplate.js staan;
     daar leeft ook de plaatontwerper (#qp2-pld), een DOM-widget buiten deze Vue-boom die de
     vertaallaag zijn knoppen laat vertalen. Deze component beheert de invoervelden, vult de
     plaat opnieuw als een veld verandert dat de indeling bepaalt (sig), en tekent de plaat,
     de mastermixen en de exportknop uit de toestand van de ontwerper.

     De ontwerper is niet reactief: hij meldt een wijziging via window.__qpVm.onPlate(), en
     `tick` laat de computeds dan opnieuw lezen. De id's qp2-fmt, qp2-rep, qp2-s, qp2-t,
     qp2-std, qp2-ntc, qp2-dir, qp2-mar, qp2-exp, qp2-dl, qp2-msg, qp2-cv en qp2-out blijven. -->
<template>
  <div class="grid2">
    <div class="panel">
      <div class="fields">
        <div class="f"><label for="qp2-fmt">{{ t('Plaat') }}</label>
          <select id="qp2-fmt" v-model="fmtSel" style="width:100%">
            <option value="96">{{ t('96-wells (8 × 12)') }}</option>
            <option value="384">{{ t('384-wells (16 × 24)') }}</option>
          </select></div>
        <lk-field v-model="rep" :label="t('Replicaten')" for-id="qp2-rep" inputmode="numeric"/>
        <div class="f" style="grid-column:1/-1"><label for="qp2-s">{{ t('Monsters (komma-gescheiden)') }}</label>
          <div class="row" style="gap:6px">
            <input id="qp2-s" class="txt" v-model="s" style="flex:1;min-width:0">
            <button type="button" data-smp="qplate">{{ t('Monsters…') }}</button>
          </div></div>
        <lk-field v-model="tg" :label="t('Doelgenen (komma-gescheiden)')" for-id="qp2-t" cls="txt" inputmode="text" style="grid-column:1/-1"/>
        <lk-field v-model="std" :label="t('Standaardreeks: aantal punten')" for-id="qp2-std" inputmode="numeric"/>
        <lk-field v-model="ntc" :label="t('NTC per doelgen')" for-id="qp2-ntc" inputmode="numeric"/>
        <div class="f"><label for="qp2-dir">{{ t('Vullen per') }}</label>
          <select id="qp2-dir" v-model="dir" style="width:100%">
            <option value="row">{{ t('rij (A1, A2, …)') }}</option>
            <option value="col">{{ t('kolom (A1, B1, …)') }}</option>
          </select></div>
        <lk-field v-model="mar" :label="t('Marge mastermix')" for-id="qp2-mar" unit="%"/>
      </div>
      <p style="font-size:13px;color:var(--muted);margin:10px 0 0">{{ t('Elk doelgen begint op een nieuwe rij (of kolom), zodat je per gen één mastermix met een multichannelpipet kunt verdelen. De mix zelf reken je uit met het Pipetteerschema (sjabloon qPCR).') }}</p>
      <div class="row" style="margin-top:12px;gap:10px;align-items:flex-end">
        <div class="f"><label for="qp2-exp">{{ t('Exportvorm plaatlijst') }}</label>
          <select id="qp2-exp" v-model="exp">
            <option value="eigen">{{ t('eigen tabel (Well, Monster, Doel, Taak)') }}</option>
            <option value="abi">{{ t('Applied Biosystems (Well Position, Sample Name, Target Name, Task)') }}</option>
            <option value="cfx">{{ t('Bio-Rad CFX (Well, Target, Content, Sample)') }}</option>
          </select></div>
        <button type="button" id="qp2-dl" @click="download">{{ t('Plaatlijst downloaden') }}</button>
      </div>
      <p id="qp2-msg" style="font-size:13px;color:var(--muted);margin:8px 0 0">{{ msg ? t(msg) : t('Welke kolommen de qPCR-software bij het importeren verwacht, verschilt per versie: kijk in het importvenster na hoe de kolommen worden toegewezen.') }}</p>
    </div>
    <div class="result">
      <canvas id="qp2-cv" v-show="pl.rows.length"></canvas>
      <div class="pic-bar" data-picbar="qp2"></div>
      <div id="qp2-out">
        <lk-note v-if="!pl.rows.length" kind="info">{{ t('Vul minstens één monster en één doelgen in.') }}</lk-note>
        <template v-else>
          <lk-note v-if="over" kind="bad">{{ overText }}</lk-note>
          <lk-kv :rows="kvRows"/>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
const fnum = x => (typeof x === 'number' ? x : num(x));

export default {
  name: 'Qplate',
  data() {
    return {fmtSel: '96', rep: '3', s: ['Controle 1', 'Controle 2', 'Behandeld 1', 'Behandeld 2'].map(x => trPlain(x)).join(', '), tg: 'GAPDH, IL6',
      std: '0', ntc: '1', dir: 'row', mar: '10', exp: 'eigen',
      over: false, need: 0, msg: '', tick: 0, gen: false};
  },
  computed: {
    /* alleen deze velden mogen de plaat opnieuw vullen; de exportvorm en de marge niet, want
       dan zou een eigen wijziging op de plaat verdwijnen zodra je een ander formaat kiest */
    sig() { return JSON.stringify([this.fmtSel, this.rep, this.s, this.tg, this.std, this.ntc, this.dir]); },
    /* de plaat zoals de ontwerper hem nu heeft; tick zegt dat hij veranderd is */
    pl() { this.tick; return qpRows(); },
    marg() { return (fnum(this.mar) || 0) / 100; },
    cnt() { return this.pl.groups.map((g, i) => this.pl.rows.filter(w => w.ti === i).length); },
    overText() {
      return this.t('De plaat is vol: ' + this.pl.rows.length + ' van de benodigde ' + this.need
        + ' wells passen. Kies 384 wells, minder replicaten of minder monsters.');
    },
    kvRows() {
      const t = this.t, {R, C, rows, groups} = this.pl;
      return [[t('Wells gebruikt'), t(rows.length + ' van ' + R * C)],
        ...groups.map((g, i) => this.cnt[i] ? [t('Mastermix ' + uv(g.n)),
          t(this.cnt[i] + ' reacties → maak voor ' + fmt(this.cnt[i] * (1 + this.marg), 1))] : null)
          .filter(Boolean)];
    }
  },
  watch: {
    sig() { this.regen(); }
  },
  mounted() { this.regen(); this.draw(); },
  updated() { this.draw(); },
  methods: {
    /* de ontwerper meldt een wijziging door de gebruiker (niet door regen) */
    onPlate() { if (this.gen) return; this.over = false; this.tick++; },
    /* de indeling genereren uit de invoer en in de ontwerper zetten */
    regen() {
      if (typeof qpPld === 'undefined' || !qpPld) return;
      const f = this.fmtSel === '384', R = f ? 16 : 8, C = f ? 24 : 12, fmtv = f ? '16x24' : '8x12';
      const rep = Math.min(48, Math.max(1, Math.round(num(this.rep) || 1))), byRow = this.dir === 'row';
      const S = this.s.split(',').map(x => x.trim()).filter(Boolean).slice(0, 384),
        T = this.tg.split(',').map(x => x.trim()).filter(Boolean).slice(0, 24);
      const nst = Math.min(24, Math.max(0, Math.round(num(this.std) || 0))),
        nntc = Math.min(24, Math.max(0, Math.round(num(this.ntc) || 0)));
      this.gen = true;
      try {
        if (!S.length || !T.length) {
          qpPld.set({fmt: fmtv, wells: {}, vals: {}, groups: [{n: 'Doel', c: SERCOL[0]}]});
          this.over = false; this.need = 0; return;
        }
        const lineLen = byRow ? C : R, nLines = byRow ? R : C, wells = {}, vals = {};
        let line = 0, pos = 0, over = false;
        T.forEach((tt, ti) => { if (pos > 0) { line++; pos = 0; }
          const items = [...Array.from({length: nst}, (_, i) => ({s: 'St' + (i + 1)})), ...S.map(x => ({s: x})),
            ...Array.from({length: nntc}, () => ({s: 'NTC'}))];
          items.forEach(it => { for (let k = 0; k < rep && !over; k++) {
            if (pos >= lineLen) { line++; pos = 0; } if (line >= nLines) { over = true; return; }
            const r = byRow ? line : pos, c = byRow ? pos : line, key = QPRL[r] + (c + 1);
            wells[key] = ti; vals[key] = it.s; pos++; } }); });
        this.need = T.length * (nst + S.length + nntc) * rep; this.over = over;
        qpPld.set({fmt: fmtv, wells, vals, groups: T.map((x, i) => ({n: x, c: SERCOL[i % SERCOL.length]}))});
      } finally { this.gen = false; this.tick++; }
    },
    /* calc.qplate() komt bij het openen van de tool: de ontwerper is bij het laden gevuld terwijl
       de tool nog verborgen was, en meet dan geen putjes, dus het krimpen van lange namen
       (fitText) deed niets. Opnieuw zetten terwijl hij zichtbaar is lost dat op. */
    reflow() {
      if (typeof qpPld !== 'undefined' && qpPld) {
        const el = document.getElementById('qp2-pld');
        if (el && el.offsetParent) { this.gen = true; try { qpPld.set(qpPld.get()); } finally { this.gen = false; } }
      }
      this.tick++; this.draw();
    },
    async download() { this.msg = await qpExport(this.exp); },
    draw() {
      const cv = document.getElementById('qp2-cv'), {R, C, rows, groups} = this.pl;
      if (!cv || !rows.length) return;
      const cnt = this.cnt, f = R > 8, cs = f ? 24 : 44, W = 40 + C * cs + 20, H = 60 + R * cs + 20 + groups.length * 18;
      pShow(cv, W, H, (x) => { x.font = '600 11px ' + PFONT(); x.fillStyle = PCOL.muted; x.textAlign = 'center'; x.textBaseline = 'middle';
        for (let c = 0; c < C; c++) x.fillText(String(c + 1), 40 + c * cs + cs / 2, 40);
        for (let r = 0; r < R; r++) x.fillText(QPRL[r], 22, 56 + r * cs + cs / 2);
        for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
          const w = rows.find(q => q.r === r && q.c === c), cx = 40 + c * cs + cs / 2, cy = 56 + r * cs + cs / 2;
          x.beginPath(); x.arc(cx, cy, cs / 2 - 2, 0, 7);
          if (w) { const col = SERCOL[w.ti % SERCOL.length]; x.fillStyle = w.task === 'NTC' ? '#fff' : col + (w.task === 'standaard' ? '88' : '33'); x.fill();
            x.strokeStyle = col; x.lineWidth = w.task === 'NTC' ? 2 : 1.2; x.stroke();
            if (!f && w.s) { x.fillStyle = PCOL.ink; x.font = '9.5px ' + PFONT(); const lab = w.s.length > 7 ? w.s.slice(0, 6) + '…' : w.s; x.fillText(uv(lab), cx, cy); } }
          else { x.strokeStyle = PCOL.line; x.lineWidth = 1; x.stroke(); } }
        x.textAlign = 'left'; x.font = '12px ' + PFONT();
        groups.forEach((g, i) => { if (!cnt[i]) return; const y = 56 + R * cs + 18 + i * 18; x.fillStyle = SERCOL[i % SERCOL.length]; x.fillRect(40, y - 6, 12, 12);
          x.fillStyle = PCOL.ink; x.fillText(uv(g.n + ': ' + cnt[i]) + ' wells', 58, y); }); });
      cv._data = {head: ['Well', 'Monster', 'Doel', 'Taak'], rows: rows.map(w => [w.w, w.s, w.t, w.task])};
    }
  }
};
</script>
