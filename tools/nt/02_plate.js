/* ================= GEDEELDE PLAATONTWERPER =================
   Eén component voor elke tool die met een microplaat werkt. Elke aanroep maakt een eigen
   exemplaar met eigen toestand, dus twee platen op één pagina zitten elkaar niet in de weg.

     const P = plateDesigner(container, {fmt:'8x12', onChange(){...}});
     P.get()            -> {fmt, wells:{A1:0,…}, vals:{A1:'100 µg/mL',…}, groups:[{n,c},…]}
     P.set(state)       -> toestand terugzetten
     P.draw(x, X, Y, sz)-> de plaat op een canvas tekenen (voor PNG/SVG)
     P.rows()/P.cols()  -> afmetingen van het huidige formaat

   Sjablonen (S30): "Sjabloon…" zet een kant-en-klare indeling neer (ELISA, qPCR in triplo,
   MIC-titratie, buitenrij als buffer). "Plaatkaart" drukt de plaat op A4 af met de legenda,
   het aantal putjes per groep en een tabel van alle gelabelde putjes.

   Vulorde (S31): met "Vulorde" aan staat in elk gevuld putje het nummer van de stap. De orde
   loopt per groep (alle standaarden, dan alle blanco's, …), want zo pipetteer je ook: één
   keer tips pakken per groep. Binnen een groep volgt hij de gekozen richting. Eronder staat
   wat er met een meerkanaalspipet in één keer kan: volle kolommen, volle rijen en wat er los
   overblijft.

   Vullen (S29): slepen vult putjes. Staat "Herhalingen" op 2–8, dan vult één klik of sleep
   meteen zoveel putjes naast of onder elkaar: replica's in één beweging. Een klik op een
   rij- of kolomkop vult die hele rij of kolom. "Reeks…" zet een verdunningsreeks neer en
   geeft elk putje zijn eigen concentratie als label. Labels zijn invoer van de gebruiker:
   ze krijgen `data-notr` in de HTML en `uv()` op het canvas, dus ze worden nooit vertaald.

   De tekening gebruikt dezelfde tekencontext als de andere tekentools, dus PNG, SVG,
   kopiëren en afdrukken werken er zonder extra werk op. */

const PLFMT = [['2x3', '6 putjes'], ['3x4', '12 putjes'], ['4x6', '24 putjes'],
  ['6x8', '48 putjes'], ['8x12', '96 putjes'], ['16x24', '384 putjes']];
const PLROW = 'ABCDEFGHIJKLMNOP';
const PLCOL = ['#1d5bc4', '#c2410c', '#15803d', '#7c3aed', '#b91c1c', '#0e7490', '#a16207', '#be185d', '#4b5563', '#0f766e'];
let plateSeq = 0;

/* ---------- plaatsjablonen (S30) ----------
   Elk sjabloon geeft de groepen, de gevulde putjes en eventuele labels terug. `fmt` is het
   formaat dat erbij hoort (de sjablonen voor 96 putjes zetten de plaat zelf op 8x12);
   `fmt:null` betekent: werkt op het formaat dat nu is gekozen. De indelingen volgen de
   gangbare labpraktijk: standaarden in duplo in de eerste kolommen, controles bij elkaar,
   en bij een titratie een groei- en een steriliteitscontrole in de laatste twee kolommen. */
const PLTPL = [
  {id: 'elisa', n: 'ELISA-standaardcurve', fmt: '8x12',
   d: '7 standaarden (S1–S7) en een blanco in duplo in kolom 1 en 2, monsters in kolom 3–12.',
   make() { const wells = {}, vals = {};
     for (let i = 0; i < 7; i++) for (const c of [1, 2]) { const k = PLROW[i] + c; wells[k] = 0; vals[k] = 'S' + (i + 1); }
     for (const k of ['H1', 'H2']) { wells[k] = 1; vals[k] = '0'; }
     for (let j = 3; j <= 12; j++) for (let i = 0; i < 8; i++) wells[PLROW[i] + j] = 2;
     return {groups: [{n: 'Standaard', c: PLCOL[0]}, {n: 'Blanco', c: PLCOL[8]}, {n: 'Monster', c: PLCOL[1]}], wells, vals}; }},
  {id: 'qpcr', n: 'qPCR in triplo', fmt: '8x12',
   d: '28 monsters in triplo (M1–M28) in rij A–G, met een positieve controle en een NTC in triplo in rij H.',
   make() { const wells = {}, vals = {}; let m = 0;
     for (let i = 0; i < 7; i++) for (let b = 0; b < 4; b++) { m++;
       for (let t = 0; t < 3; t++) { const k = PLROW[i] + (b * 3 + t + 1); wells[k] = 0; vals[k] = 'M' + m; } }
     for (let t = 0; t < 3; t++) { wells['H' + (t + 1)] = 1; vals['H' + (t + 1)] = '+'; }
     for (let t = 0; t < 3; t++) { wells['H' + (t + 4)] = 2; vals['H' + (t + 4)] = 'NTC'; }
     return {groups: [{n: 'Monster (triplo)', c: PLCOL[0]}, {n: 'Positieve controle', c: PLCOL[2]}, {n: 'NTC', c: PLCOL[4]}], wells, vals}; }},
  {id: 'mic', n: 'Titratie (MIC)', fmt: '8x12',
   d: 'Een tweevoudige reeks 1:1 tot 1:512 over kolom 1–10 per rij, kolom 11 groeicontrole en kolom 12 steriliteitscontrole.',
   make() { const wells = {}, vals = {};
     for (let i = 0; i < 8; i++) { for (let j = 1; j <= 10; j++) { const k = PLROW[i] + j; wells[k] = 0; vals[k] = '1:' + Math.pow(2, j - 1); }
       wells[PLROW[i] + 11] = 1; wells[PLROW[i] + 12] = 2; }
     return {groups: [{n: 'Verdunningsreeks', c: PLCOL[0]}, {n: 'Groeicontrole', c: PLCOL[2]}, {n: 'Steriliteitscontrole', c: PLCOL[8]}], wells, vals}; }},
  {id: 'edge', n: 'Buitenrij als buffer', fmt: null,
   d: 'De hele buitenrand wordt buffer en alleen de putjes binnenin zijn monster: dat houdt het randeffect uit je metingen.',
   make(r, c) { const wells = {};
     for (let i = 0; i < r; i++) for (let j = 0; j < c; j++)
       wells[PLROW[i] + (j + 1)] = (i === 0 || j === 0 || i === r - 1 || j === c - 1) ? 1 : 0;
     return {groups: [{n: 'Monster', c: PLCOL[1]}, {n: 'Buffer (rand)', c: PLCOL[8]}], wells, vals: {}}; }}
];

function plateDesigner(host, opts) {
  opts = opts || {};
  const id = 'pl' + (++plateSeq);
  const S = {
    fmt: opts.fmt || '8x12',
    wells: {},                                   /* "A1" -> index in groups */
    vals: {},                                    /* "A1" -> label, bv. een concentratie */
    groups: (opts.groups || [{n: 'Standaard', c: PLCOL[0]}, {n: 'Blanco', c: PLCOL[8]},
      {n: 'Monster', c: PLCOL[1]}, {n: 'Controle', c: PLCOL[2]}]).map(g => ({...g}))
  };
  let sel = 0, erase = false, painting = false;
  const dims = () => { const [r, c] = S.fmt.split('x').map(Number); return {r: r || 8, c: c || 12}; };
  const key = (i, j) => PLROW[i] + (j + 1);
  const pos = k => ({i: PLROW.indexOf(String(k).charAt(0)), j: +String(k).slice(1) - 1});
  const fire = () => { if (opts.onChange) try { opts.onChange(); } catch (e) {} };

  host.classList.add('pld');
  host.innerHTML = `<div class="pld-bar">
      <label class="f"><span>Formaat</span><select data-pl="fmt">${PLFMT.map(([v, n]) => `<option value="${v}"${v === S.fmt ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="f"><span>Herhalingen</span><select data-pl="rep">${[1, 2, 3, 4, 5, 6, 7, 8].map(n => `<option value="${n}">${n === 1 ? '1 (los putje)' : n + '×'}</option>`).join('')}</select></label>
      <label class="f"><span>Richting</span><select data-pl="dir"><option value="h">naast elkaar (rij)</option><option value="v">onder elkaar (kolom)</option></select></label>
      <button type="button" data-pl="add">+ Groep</button>
      <button type="button" data-pl="tpl">Sjabloon…</button>
      <button type="button" data-pl="series">Reeks…</button>
      <button type="button" data-pl="erase" aria-pressed="false">Gum</button>
      <button type="button" data-pl="clear">Leegmaken</button>
      <button type="button" data-pl="print" title="De plaatkaart op A4 afdrukken">Plaatkaart</button>
      <label class="chk"><input type="checkbox" data-pl="order"> Vulorde</label>
    </div>
    <div class="legend" data-pl="legend"></div>
    <div class="tbl-wrap"><div class="plate" data-pl="grid" role="group" aria-label="Putjes van de plaat"></div></div>
    <div class="pld-mc" data-pl="mc"></div>
    <p class="pld-hint">Sleep over de putjes om te vullen. Met <b>Herhalingen</b> vul je replica's in één beweging; een klik op een rij- of kolomkop vult die hele rij of kolom.</p>`;

  const q = n => host.querySelector(`[data-pl="${n}"]`);
  const rep = () => { const v = +(q('rep') || {}).value; return Math.max(1, Math.min(8, v || 1)); };
  const dir = () => ((q('dir') || {}).value === 'v' ? 'v' : 'h');
  const ordOn = () => !!(q('order') || {}).checked;

  /* ---- vulorde: per groep, want per groep pak je één keer tips (S31) ---- */
  function orderSeq() {
    const {r, c} = dims(), d = dir(), seq = {}; let n = 0;
    S.groups.forEach((g, gi) => {
      if (d === 'v') { for (let j = 0; j < c; j++) for (let i = 0; i < r; i++) { const k = key(i, j); if (S.wells[k] === gi) seq[k] = ++n; } }
      else { for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) { const k = key(i, j); if (S.wells[k] === gi) seq[k] = ++n; } }
    });
    return seq;
  }

  /* ---- wat kan er met een meerkanaalspipet in één keer? (S31) ----
     Een kolom of rij kan alleen in één keer als élk putje erin dezelfde groep heeft: anders
     zou één streek twee verschillende dingen pipetteren. Wat overblijft gaat los. */
  function multi() {
    const {r, c} = dims(), cols = [], rows = [], mixedC = [], mixedR = [];
    for (let j = 0; j < c; j++) { const g = S.wells[key(0, j)]; let full = g != null, any = false, mix = false;
      for (let i = 0; i < r; i++) { const v = S.wells[key(i, j)]; if (v != null) any = true; if (v !== g) { full = false; if (v != null) mix = true; } }
      if (full) cols.push(j + 1); else if (any && (mix || g != null)) mixedC.push(j + 1); }
    for (let i = 0; i < r; i++) { const g = S.wells[key(i, 0)]; let full = g != null, any = false, mix = false;
      for (let j = 0; j < c; j++) { const v = S.wells[key(i, j)]; if (v != null) any = true; if (v !== g) { full = false; if (v != null) mix = true; } }
      if (full) rows.push(PLROW[i]); else if (any && (mix || g != null)) mixedR.push(PLROW[i]); }
    const n = Object.keys(S.wells).length;
    return {r, c, n, cols, rows, mixedC, mixedR,
      colSteps: cols.length + (n - cols.length * r), rowSteps: rows.length + (n - rows.length * c)};
  }

  function mcText() {
    const m = multi(); if (!m.n) return '';
    const list = a => a.join(', ');
    const col = m.cols.length
      ? `<b>Per kolom</b> (${m.r} putjes tegelijk): ${m.cols.length} volle kolom(men) — ${ud(list(m.cols))} — en ${m.n - m.cols.length * m.r} losse putjes, samen ${m.colSteps} stappen.`
      : `<b>Per kolom</b> (${m.r} putjes tegelijk): geen enkele kolom is helemaal één groep, dus alle ${m.n} putjes gaan los.`;
    const row = m.rows.length
      ? `<b>Per rij</b> (${m.c} putjes tegelijk): ${m.rows.length} volle rij(en) — ${ud(list(m.rows))} — en ${m.n - m.rows.length * m.c} losse putjes, samen ${m.rowSteps} stappen.`
      : `<b>Per rij</b> (${m.c} putjes tegelijk): geen enkele rij is helemaal één groep, dus alle ${m.n} putjes gaan los.`;
    const best = m.cols.length || m.rows.length
      ? `De snelste richting is ${m.colSteps <= m.rowSteps ? 'per kolom' : 'per rij'}: ${Math.min(m.colSteps, m.rowSteps)} stappen in plaats van ${m.n}.`
      : 'Zet een hele kolom of rij op één groep om de meerkanaalspipet te kunnen gebruiken.';
    /* het losse putje-advies staat in een eigen regel: zo blijft elke zin één vertaalsleutel
       in plaats van een sleutel per combinatie van zinnen */
    const mix = (m.mixedC.length && m.cols.length) ? `<div>Kolom ${ud(list(m.mixedC))} heeft meer dan één groep en kan niet in één streek.</div>` : '';
    return `<div>${col}</div><div>${row}</div><div class="mcb">${best}</div>${mix}`;
  }

  function render() {
    const {r, c} = dims(), sz = c >= 16 ? 24 : c >= 12 ? 34 : c >= 8 ? 42 : 56;
    const g = q('grid'), lab = sz >= 34;                 /* bij 384 putjes is er geen ruimte voor een label */
    const on = ordOn(), seq = on ? orderSeq() : null;
    g.style.gridTemplateColumns = `22px repeat(${c},${sz}px)`;
    g.style.gridAutoRows = sz + 'px';
    let h = '<div></div>';
    for (let j = 1; j <= c; j++) h += `<button type="button" class="hd" data-plc="${j - 1}" title="Kolom ${j} vullen"><span data-notr="">${j}</span></button>`;
    for (let i = 0; i < r; i++) { h += `<button type="button" class="hd" data-plr="${i}" title="Rij ${uv(PLROW[i])} vullen"><span data-notr="">${PLROW[i]}</span></button>`;
      for (let j = 0; j < c; j++) { const k = key(i, j), gi = S.wells[k], fill = gi != null && S.groups[gi], v = S.vals[k];
        const txt = on ? (seq[k] != null ? String(seq[k]) : '') : (v || '');
        const tip = [k, fill ? trPlain(S.groups[gi].n, true) : '', v || '', on && seq[k] != null ? trPlain('stap ' + seq[k]) : '']
          .filter(Boolean).join(' · ');
        h += `<div class="well${fill ? ' on' : ''}${txt && lab ? ' wtxt' : ''}" data-notr="" data-w="${k}" title="${esc(tip)}"${fill ? ` style="--wc:${S.groups[gi].c}"` : ''}>${txt && lab ? `<span>${esc(txt)}</span>` : ''}</div>`; } }
    g.innerHTML = h;
    const act = document.activeElement;
    if (!(act && act.dataset && act.dataset.plgn != null))
      q('legend').innerHTML = S.groups.map((x, i) =>
        `<div class="grp${i === sel && !erase ? ' sel' : ''}" data-plg="${i}"><i style="background:${x.c}"></i>` +
        `<input data-plgn="${i}" value="${esc(x.n)}" aria-label="Naam van de groep"><button type="button" class="gdel" data-pldel="${i}" aria-label="Verwijder">✕</button></div>`).join('');
    q('mc').innerHTML = mcText();
    q('erase').setAttribute('aria-pressed', erase ? 'true' : 'false');
    q('erase').classList.toggle('primary', erase);
    fire();
  }

  const paint = k => { if (erase) { delete S.wells[k]; delete S.vals[k]; } else S.wells[k] = sel; };
  /* vanaf één putje: het aantal herhalingen naast of onder elkaar, binnen de plaat */
  function paintRun(k) {
    const {r, c} = dims(), {i, j} = pos(k), n = rep(), d = dir();
    if (i < 0) return;
    for (let t = 0; t < n; t++) { const ii = d === 'v' ? i + t : i, jj = d === 'h' ? j + t : j;
      if (ii >= r || jj >= c) break; paint(key(ii, jj)); }
  }
  q('grid').addEventListener('pointerdown', e => { const w = e.target.closest('[data-w]'); if (!w) return;
    painting = true; paintRun(w.dataset.w); render(); });
  q('grid').addEventListener('pointerover', e => { if (!painting) return; const w = e.target.closest('[data-w]'); if (w) { paintRun(w.dataset.w); render(); } });
  /* op een aanraakscherm komt pointerover niet, dus daar wordt het putje onder de vinger gezocht */
  q('grid').addEventListener('pointermove', e => { if (!painting || e.pointerType === 'mouse') return;
    const el = document.elementFromPoint(e.clientX, e.clientY), w = el && el.closest && el.closest('[data-w]');
    if (w && host.contains(w)) { e.preventDefault(); paint(w.dataset.w); render(); } });
  addEventListener('pointerup', () => { painting = false; });

  host.addEventListener('click', e => {
    const hr = e.target.closest('[data-plr]'), hc = e.target.closest('[data-plc]');
    if (hr || hc) { const {r, c} = dims();
      if (hr) { const i = +hr.dataset.plr; for (let j = 0; j < c; j++) paint(key(i, j)); }
      else { const j = +hc.dataset.plc; for (let i = 0; i < r; i++) paint(key(i, j)); }
      render(); return; }
    const d = e.target.closest('[data-pldel]');
    if (d) { const i = +d.dataset.pldel; if (S.groups.length <= 1) return;
      S.groups.splice(i, 1);
      Object.keys(S.wells).forEach(k => { const v = S.wells[k]; if (v === i) { delete S.wells[k]; delete S.vals[k]; } else if (v > i) S.wells[k] = v - 1; });
      sel = Math.min(sel, S.groups.length - 1); render(); return; }
    const g = e.target.closest('[data-plg]');
    if (g && e.target.dataset.plgn == null) { sel = +g.dataset.plg; erase = false; render(); return; }
    const b = e.target.closest('[data-pl]'); if (!b || b.tagName !== 'BUTTON') return;
    if (b.dataset.pl === 'add') { S.groups.push({n: trPlain('Groep') + ' ' + (S.groups.length + 1), c: PLCOL[S.groups.length % PLCOL.length] }); sel = S.groups.length - 1; erase = false; render(); }
    else if (b.dataset.pl === 'erase') { erase = !erase; render(); }
    else if (b.dataset.pl === 'series') seriesDialog();
    else if (b.dataset.pl === 'tpl') tplDialog();
    else if (b.dataset.pl === 'print') printCard();
    else if (b.dataset.pl === 'clear') { S.wells = {}; S.vals = {}; render(); }
  });
  host.addEventListener('change', e => {
    if (e.target.dataset.plgn != null) { S.groups[+e.target.dataset.plgn].n = e.target.value || trPlain('Groep'); render(); }
    else if (e.target.dataset.pl === 'fmt') { S.fmt = e.target.value; S.wells = {}; S.vals = {}; render(); }
    else if (e.target.dataset.pl === 'order' || e.target.dataset.pl === 'dir') render();
  });

  /* ---- verdunningsreeks over een rij of kolom ---- */
  function seriesDialog() {
    const {r, c} = dims();
    const m = appModal(`<h3 style="margin:0 0 4px;font-size:16px">Verdunningsreeks in de plaat</h3>
      <p style="margin:0 0 12px;color:var(--muted);font-size:13px">Elk putje krijgt zijn eigen concentratie als label en de kleur van de gekozen groep. Dit vult alleen de plaatindeling; de verdunning zelf reken je in <i>Verdunningsreeks &amp; KVE</i> uit.</p>
      <div class="fields">
        <div class="f"><label for="pls-c0-${id}">Startconcentratie</label><input id="pls-c0-${id}" data-s="c0" inputmode="decimal" value="100"></div>
        <div class="f"><label for="pls-u-${id}">Eenheid</label><input id="pls-u-${id}" data-s="u" value="µg/mL"></div>
        <div class="f"><label for="pls-f-${id}">Verdunningsfactor per stap</label><input id="pls-f-${id}" data-s="f" inputmode="decimal" value="2"></div>
        <div class="f"><label for="pls-n-${id}">Aantal stappen</label><input id="pls-n-${id}" data-s="n" inputmode="numeric" value="${Math.min(8, Math.max(r, c))}"></div>
        <div class="f"><label for="pls-w-${id}">Beginputje</label><input id="pls-w-${id}" data-s="w" value="A1"></div>
        <div class="f"><label for="pls-d-${id}">Richting</label><select id="pls-d-${id}" data-s="d"><option value="h">naar rechts (rij)</option><option value="v">naar beneden (kolom)</option></select></div>
        <div class="f"><label for="pls-rp-${id}">Herhalingen per stap</label><select id="pls-rp-${id}" data-s="rp">${[1, 2, 3, 4].map(n => `<option value="${n}">${n === 1 ? '1 (geen)' : n + '×'}</option>`).join('')}</select></div>
      </div>
      <p data-s="err" style="margin:10px 0 0;font-size:13px;color:var(--warn,#c2410c)"></p>
      <div class="row" style="justify-content:flex-end;margin-top:12px;gap:6px"><button type="button" data-s="no">Annuleren</button><button type="button" class="primary" data-s="ok">Vullen</button></div>`);
    const f = n => m.box.querySelector(`[data-s="${n}"]`);
    f('no').addEventListener('click', m.close);
    f('ok').addEventListener('click', () => {
      const c0 = num(f('c0').value), fac = num(f('f').value), n = Math.round(num(f('n').value)),
        rp = +f('rp').value || 1, d = f('d').value, u = f('u').value.trim(), st = f('w').value.trim().toUpperCase();
      const p = pos(st), bad = !isFinite(c0) || c0 <= 0 ? 'Vul een startconcentratie groter dan 0 in.'
        : !isFinite(fac) || fac <= 1 ? 'De verdunningsfactor moet groter dan 1 zijn.'
        : !isFinite(n) || n < 2 || n > 24 ? 'Kies 2 tot 24 stappen.'
        : p.i < 0 || p.i >= r || !isFinite(p.j) || p.j < 0 || p.j >= c ? 'Dat putje bestaat niet op deze plaat.'
        : (d === 'h' ? p.j + n : p.i + n) > (d === 'h' ? c : r) ? 'De reeks past zo niet op de plaat: kies minder stappen of een ander beginputje.'
        : (d === 'h' ? p.i + rp : p.j + rp) > (d === 'h' ? r : c) ? 'De herhalingen passen niet op de plaat.' : '';
      if (bad) { f('err').textContent = bad; return; }   /* de vertaallaag pakt de nieuwe tekst zelf op */
      for (let t = 0; t < n; t++) { const lb = sig(c0 / Math.pow(fac, t), 3) + (u ? ' ' + u : '');
        for (let k = 0; k < rp; k++) { const ii = d === 'h' ? p.i + k : p.i + t, jj = d === 'h' ? p.j + t : p.j + k;
          S.wells[key(ii, jj)] = sel; S.vals[key(ii, jj)] = lb; } }
      m.close(); render();
    });
    setTimeout(() => f('c0').focus(), 0);
  }

  /* ---- een sjabloon kiezen ---- */
  function tplDialog() {
    const {r, c} = dims();
    const m = appModal(`<h3 style="margin:0 0 4px;font-size:16px">Plaatsjabloon</h3>
      <p style="margin:0 0 12px;color:var(--muted);font-size:13px">Een sjabloon vervangt de huidige indeling. De eerste drie zetten de plaat op 96 putjes; het laatste gebruikt het formaat dat nu is gekozen.</p>
      <div class="pld-tpl">${PLTPL.map(t => `<button type="button" data-t="${t.id}"><b>${t.n}</b><span>${t.d}</span><em data-notr="">${t.fmt ? trPlain(t.fmt.split('x').reduce((a, b) => a * b) + ' putjes') : trPlain('huidig formaat')}</em></button>`).join('')}</div>
      <div class="row" style="justify-content:flex-end;margin-top:12px"><button type="button" data-t="no">Annuleren</button></div>`);
    m.box.addEventListener('click', e => { const b = e.target.closest('[data-t]'); if (!b) return;
      if (b.dataset.t === 'no') { m.close(); return; }
      const t = PLTPL.find(x => x.id === b.dataset.t); if (!t) return;
      if (t.fmt) { S.fmt = t.fmt; const f = q('fmt'); if (f) f.value = S.fmt; }
      const d = dims(), out = t.make(d.r, d.c);
      S.groups = out.groups.map(g => ({...g})); S.wells = {...out.wells}; S.vals = {...out.vals};
      sel = 0; erase = false; m.close(); render(); });
  }

  /* ---- plaatkaart op A4: de tekening, de legenda en de gelabelde putjes ---- */
  function printCard() {
    const {r, c} = dims(), sz = c >= 16 ? 30 : c >= 12 ? 56 : 72, dim = size(sz);
    const cv = document.createElement('canvas');
    pRender(cv, dim.W, dim.H, x => draw(x, 0, 0, sz), 3);
    const cnt = {}; Object.keys(S.wells).forEach(k => { const g = S.wells[k]; cnt[g] = (cnt[g] || 0) + 1; });
    const ord = k => PLROW.indexOf(k.charAt(0)) * 100 + (+k.slice(1));
    const lab = Object.keys(S.vals).filter(k => S.wells[k] != null).sort((a, b) => ord(a) - ord(b));
    const T = s => esc(trPlain(s));
    /* een groepsnaam die de gebruiker zelf heeft getypt staat niet in de woordenlijst en
       blijft dan ongewijzigd; `true` houdt hem uit de lijst met ontbrekende vertalingen */
    const G = s => esc(trPlain(String(s), true));
    const head = `<h1>${T(opts.name || 'Plaatkaart')}</h1>
      <p class="meta">${T(r * c + ' putjes')} · ${T('gevuld')}: <b>${Object.keys(S.wells).length}</b> · ${T('Datum')}: ________________ · ${T('Uitgevoerd door')}: ________________</p>`;
    const leg = `<table><thead><tr><th>${T('Groep')}</th><th>${T('Putjes')}</th></tr></thead><tbody>` +
      S.groups.map((g, i) => `<tr><td><i style="background:${esc(g.c)}"></i>${G(g.n)}</td><td>${cnt[i] || 0}</td></tr>`).join('') + '</tbody></table>';
    /* het advies staat al vertaald in de pagina; dat nemen we over, zodat de vertaling niet
       twee keer hoeft te worden opgezocht voor een document zonder vertaallaag */
    const mcHtml = (q('mc') || {}).innerHTML || '';
    const mc = mcHtml ? `<h2>${T('Met een meerkanaalspipet')}</h2><div class="mc">${mcHtml}</div>` : '';
    const tbl = lab.length ? `<h2>${T('Gelabelde putjes')}</h2><table class="wl"><thead><tr><th>${T('Putje')}</th><th>${T('Groep')}</th><th>${T('Label')}</th></tr></thead><tbody>` +
      lab.map(k => `<tr><td>${esc(k)}</td><td>${G((S.groups[S.wells[k]] || {}).n || '')}</td><td>${esc(S.vals[k])}</td></tr>`).join('') + '</tbody></table>' : '';
    rpPrint(`<!doctype html><meta charset="utf-8"><title>${T(opts.name || 'Plaatkaart')}</title><style>
      @page{size:A4 landscape;margin:12mm}
      body{margin:0;font:13px system-ui,sans-serif;color:#1f2933}
      h1{font-size:19px;margin:0 0 2px}h2{font-size:14px;margin:14px 0 4px}
      .meta{margin:0 0 10px;color:#5f6b7a;font-size:12px}
      img{max-width:100%;height:auto;display:block}
      table{border-collapse:collapse;font-size:12px;margin:0}
      th,td{border:1px solid #c9ced6;padding:3px 7px;text-align:left}
      th{background:#eef0f3}
      td i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:6px;vertical-align:-1px}
      .cols{display:flex;gap:16px;align-items:flex-start}
      .mc{font-size:12px;color:#1f2933}.mc div{margin:0 0 2px}.mc span[data-v]{font-weight:600}
      .wl{column-count:4;column-gap:10px;display:block}
      .wl tbody,.wl thead{display:block}.wl tr{display:flex}.wl th,.wl td{flex:1}
      </style>${head}<div class="cols"><img src="${cv.toDataURL('image/png')}"><div>${leg}${mc}</div></div>${tbl}`);
  }

  /* de plaat op een canvas tekenen; geeft de gebruikte hoogte terug */
  function draw(x, X, Y, sz) {
    const {r, c} = dims(); sz = sz || (c >= 16 ? 26 : c >= 12 ? 44 : c >= 8 ? 54 : 70);
    const L = X + 24, T = Y + 22;
    x.font = '600 ' + Math.min(12, sz * 0.32) + 'px ' + PFONT(); x.fillStyle = PCOL.muted; x.textAlign = 'center'; x.textBaseline = 'middle';
    for (let j = 1; j <= c; j++) x.fillText(String(j), L + (j - 0.5) * sz, T - 11);
    for (let i = 0; i < r; i++) x.fillText(PLROW[i], L - 14, T + (i + 0.5) * sz);
    x.strokeStyle = PCOL.ink; x.lineWidth = 1.2;
    x.beginPath(); x.roundRect(L - 6, T - 4, c * sz + 12, r * sz + 8, 10); x.stroke();
    const seq = ordOn() ? orderSeq() : null;
    for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) {
      const k = key(i, j), gi = S.wells[k], on = gi != null && S.groups[gi];
      const cx = L + (j + 0.5) * sz, cy = T + (i + 0.5) * sz, rad = sz * 0.42;
      x.beginPath(); x.arc(cx, cy, rad, 0, 7);
      x.fillStyle = on ? S.groups[gi].c : '#f4f5f7'; x.fill();
      x.strokeStyle = on ? S.groups[gi].c : PCOL.line; x.lineWidth = 1; x.stroke();
      const v = seq ? (seq[k] != null ? String(seq[k]) : '') : S.vals[k];
      if (v && sz >= 34) {                       /* het label past alleen in een ruim putje */
        x.font = '600 ' + Math.min(10, sz * 0.2) + 'px ' + PFONT();
        x.fillStyle = on ? inkOn(S.groups[gi].c) : PCOL.ink;
        const parts = String(v).split(' '), room = sz * 0.9;
        if (parts.length > 1 && x.measureText(uv(String(v))).width > room)
          { x.fillText(uv(parts[0]), cx, cy - 5); x.fillText(uv(parts.slice(1).join(' ')), cx, cy + 5); }
        else x.fillText(uv(String(v)), cx, cy);
      }
    }
    return T + r * sz + 16 - Y;
  }
  const size = (sz) => { const {r, c} = dims(); sz = sz || (c >= 16 ? 26 : c >= 12 ? 44 : c >= 8 ? 54 : 70);
    return {W: 24 + c * sz + 34, H: 22 + r * sz + 16}; };

  render();
  return {
    id, el: host, dims, rows: () => dims().r, cols: () => dims().c,
    get: () => ({fmt: S.fmt, wells: {...S.wells}, vals: {...S.vals}, groups: S.groups.map(g => ({...g}))}),
    set(v) { if (!v) return;
      if (v.fmt && PLFMT.some(([f]) => f === v.fmt)) { S.fmt = v.fmt; const f = q('fmt'); if (f) f.value = S.fmt; }
      if (v.groups && v.groups.length) S.groups = v.groups.map(g => ({n: g.n || 'Groep', c: g.c || PLCOL[0]}));
      if (v.wells) S.wells = {...v.wells};
      S.vals = v.vals ? {...v.vals} : {};
      sel = Math.min(sel, S.groups.length - 1); render(); },
    selected: () => sel, label: (k, v) => { if (v == null || v === '') delete S.vals[k]; else S.vals[k] = String(v); },
    template(id) { const t = PLTPL.find(x => x.id === id); if (!t) return false;
      if (t.fmt) { S.fmt = t.fmt; const f = q('fmt'); if (f) f.value = S.fmt; }
      const d = dims(), o = t.make(d.r, d.c);
      S.groups = o.groups.map(g => ({...g})); S.wells = {...o.wells}; S.vals = {...o.vals}; sel = 0; render(); return true; },
    print: printCard, order: orderSeq, multi, draw, size, render
  };
}
