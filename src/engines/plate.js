/* ================= PLAATONTWERPER (S268) =================
   Letterlijk overgenomen uit tools/nt/02_plate.js (de gedeelde plaatontwerper plateDesigner(),
   ook gebruikt door qPCR-plaat, ELISA en de gelplanner) en tools/nt/04_plaat.js (Plaatindeling
   erop: wPld, plateImg(), de export). De bediening van Plaatindeling is src/tools/Plaatindeling.vue,
   die plaatInit() in mounted() aanroept. */
import {live} from '../lib/global.js';

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

   Voor de tools die hun eigen plaattekening maken (S33) kan de ontwerper ook:
     opts.shape 'rond'|'vierkant'  of P.shape(v)   vorm van de putjes
     opts.autoLabel true|false     of P.autoLabel(v)  automatische labels St1, Mo2, …
                    of een functie {wells,vals,groups,r,c,dir} -> {A1:'S1',…} voor een tool
                    met zijn eigen namen (de ELISA-plaat nummert per blok replicaten)
     opts.palette [...hex]         of P.palette(a)  kleurenpool voor nieuwe groepen
     P.labels()                    {cnt per groep, lab per putje} voor eigen tekeningen
     P.text()                      de tekst die in een putje hoort (eigen tekst > autolabel)
   "Tekst per putje" zet de ontwerper in tekstmodus: een klik kiest een putje, Enter gaat naar
   het volgende. Die tekst is invoer van de gebruiker en wordt nooit vertaald.

   Randomiseren (S32): "Randomiseren…" wisselt de gevulde putjes onderling van groep en label,
   met een sleutelnummer erbij zodat dezelfde indeling later opnieuw te maken is. Je kunt de
   hele plaat door elkaar halen of alleen één groep, zodat standaarden en controles op hun
   plek blijven staan. "Sleutel…" laat zien waar elk label terecht is gekomen; die lijst hoort
   uitgeprint of opgeslagen te worden vóór de meting, anders is de blindering niets waard.
   Daaronder staat een waarschuwing als er putjes op de buitenrand in gebruik zijn.

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
    seed: null,                                  /* sleutelnummer van de laatste randomisatie */
    groups: (opts.groups || [{n: 'Standaard', c: PLCOL[0]}, {n: 'Blanco', c: PLCOL[8]},
      {n: 'Monster', c: PLCOL[1]}, {n: 'Controle', c: PLCOL[2]}]).map(g => ({...g}))
  };
  let sel = 0, erase = false, painting = false, tmode = false, wsel = null;
  /* S140 (#281): het putje met de toetsenbordfocus (roving tabindex); kfocus = na render de focus terugzetten */
  let kf = 'A1', kfocus = false;
  let shape = opts.shape === 'vierkant' ? 'vierkant' : 'rond';
  let autoLab = typeof opts.autoLabel === 'function' ? opts.autoLabel : opts.autoLabel !== false;
  let pool = (opts.palette && opts.palette.length ? opts.palette : PLCOL).slice();
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
      <button type="button" data-pl="rnd">Randomiseren…</button>
      <button type="button" data-pl="keyv" hidden>Sleutel…</button>
      <button type="button" data-pl="erase" aria-pressed="false">Gum</button>
      <button type="button" data-pl="clear">Leegmaken</button>
      <button type="button" data-pl="print" title="De plaatkaart op A4 afdrukken">Plaatkaart</button>
      <button type="button" data-pl="tmode" aria-pressed="false" title="Klik daarna op een putje en typ de tekst">Tekst per putje</button>
      <label class="chk"><input type="checkbox" data-pl="order"> Vulorde</label>
    </div>
    <div class="row pld-txt" data-pl="txtbar" hidden><span class="chip info" data-pl="sel" data-notr="">A1</span><input data-pl="wtext" class="txt" placeholder="Tekst in dit putje, bijv. S1 of 1:10" maxlength="24" aria-label="Tekst in dit putje"><button type="button" data-pl="wclr">Tekst wissen</button><span class="pld-hint">Enter gaat naar het volgende putje.</span></div>
    <div class="legend" data-pl="legend"></div>
    <div class="tbl-wrap"><div class="plate" data-pl="grid" role="group" aria-label="Putjes van de plaat"></div></div>
    <div class="pld-mc" data-pl="mc"></div>
    <div class="pld-warn" data-pl="warn"></div>
    <p class="pld-hint">Sleep over de putjes om te vullen. Met <b>Herhalingen</b> vul je replica's in één beweging; een klik op een rij- of kolomkop vult die hele rij of kolom.</p>`;
  tStatic(host);   /* S270: gewone DOM, dus zelf vertalen (er is geen observer meer) */

  const q = n => host.querySelector(`[data-pl="${n}"]`);
  const rep = () => { const v = +(q('rep') || {}).value; return Math.max(1, Math.min(8, v || 1)); };
  const dir = () => ((q('dir') || {}).value === 'v' ? 'v' : 'h');
  const ordOn = () => !!(q('order') || {}).checked;

  /* ---- automatische replicaatnummers (S33) ----
     Elk putje van een groep krijgt in leesvolgorde een nummer achter de eerste twee letters
     van de groepsnaam: St1, St2, Mo1, … Een putje met eigen tekst houdt die tekst. */
  function labels() {
    const {r, c} = dims(), cnt = {}, nr = {}, lab = {};
    /* een tool mag zijn eigen nummering meegeven; die krijgt de hele toestand te zien */
    const own = typeof autoLab === 'function'
      ? (autoLab({wells: {...S.wells}, vals: {...S.vals}, groups: S.groups.map(g => ({...g})), r, c, dir: dir()}) || {}) : null;
    for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) {
      const k = key(i, j), g = S.wells[k];
      if (g == null || !S.groups[g]) continue;
      cnt[g] = (cnt[g] || 0) + 1;
      if (own) { if (own[k] != null && !S.vals[k]) lab[k] = String(own[k]); continue; }
      if (!autoLab || S.vals[k]) continue;
      nr[g] = (nr[g] || 0) + 1;
      const short = trPlain(S.groups[g].n, true).replace(/[^A-Za-zÀ-ÿ0-9]/g, '').slice(0, 2) || 'G';
      lab[k] = short + nr[g];
    }
    return {cnt, lab};
  }
  /* de tekst die in een putje hoort: eigen tekst gaat voor het automatische label */
  const textOf = (k, lab) => S.vals[k] || (lab ? lab[k] || '' : '');

  /* een kleur voor een nieuwe groep die genoeg verschilt van de kleuren die al in gebruik zijn */
  function freshCol() {
    const used = S.groups.map(g => /^#[0-9a-f]{6}$/i.test(g.c) ? hexRgb(g.c) : [0, 0, 0]);
    const far = h => { const r = hexRgb(h); return used.every(u => Math.hypot(u[0] - r[0], u[1] - r[1], u[2] - r[2]) > 70); };
    const c = pool.find(far); if (c) return c;
    for (let k = 0; k < 40; k++) { const h = (S.groups.length * 137.508 + k * 29) % 360, l = 0.45 + ((k % 3) - 1) * 0.08,
        a = 0.62 * Math.min(l, 1 - l), f = n => { const q2 = (n + h / 30) % 12; return 255 * (l - a * Math.max(-1, Math.min(q2 - 3, 9 - q2, 1))); },
        hex = rgbHex([f(0), f(8), f(4)]);
      if (far(hex)) return hex; }
    return '#555555';
  }

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

  /* ---- randomiseren met een sleutelnummer (S32) ----
     xorshift32: klein, en met hetzelfde sleutelnummer komt er precies dezelfde indeling uit,
     zodat een indeling later te controleren of over te doen is. */
  function plRnd(seed) { let x = (seed >>> 0) || 1;
    return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
  function randomise(seed, scope) {
    const ks = Object.keys(S.wells).filter(k => scope == null || S.wells[k] === scope);
    if (ks.length < 2) return 0;
    const pay = ks.map(k => ({g: S.wells[k], v: S.vals[k]})), R = plRnd(seed);
    for (let i = pay.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); const t = pay[i]; pay[i] = pay[j]; pay[j] = t; }
    ks.forEach((k, i) => { S.wells[k] = pay[i].g; if (pay[i].v == null) delete S.vals[k]; else S.vals[k] = pay[i].v; });
    S.seed = seed; render(); return ks.length;
  }

  /* ---- randeffect (S32) ----
     De buitenrand van een plaat verdampt sneller en loopt in temperatuur achter, dus daar
     meet je systematisch anders. Dat is pas echt een probleem als de ene groep er veel meer
     op de rand staat dan de andere: dan zit het verschil deels in de plaats, niet in je
     behandeling. Daarom wordt per groep gekeken welk deel op de rand staat. */
  function edgeInfo() {
    const {r, c} = dims(); if (r < 3 || c < 3) return null;
    const isEdge = k => { const {i, j} = pos(k); return i === 0 || j === 0 || i === r - 1 || j === c - 1; };
    const per = S.groups.map(() => ({n: 0, e: 0}));
    let n = 0, e = 0;
    Object.keys(S.wells).forEach(k => { const g = S.wells[k]; if (!per[g]) return;
      per[g].n++; n++; if (isEdge(k)) { per[g].e++; e++; } });
    if (!e) return null;
    const used = per.map((p, i) => ({...p, i})).filter(p => p.n);
    const sh = used.map(p => p.e / p.n), spread = Math.max(...sh) - Math.min(...sh);
    return {n, e, used, spread, uneven: used.length > 1 && spread > 0.25,
      worst: used.slice().sort((a, b) => b.e / b.n - a.e / a.n)[0],
      best: used.slice().sort((a, b) => a.e / a.n - b.e / b.n)[0]};
  }

  function warnText() {
    const w = edgeInfo(); if (!w) return '';
    const pc = x => Math.round(x * 100);
    const head = `<b>Randeffect:</b> ${w.e} van de ${w.n} gevulde putjes liggen op de buitenrand. Daar verdampt meer en loopt de temperatuur achter, dus die metingen wijken systematisch af.`;
    const det = w.uneven
      ? `Van <b>${ud(trPlain(S.groups[w.worst.i].n, true))}</b> staat ${pc(w.worst.e / w.worst.n)}% op de rand en van <b>${ud(trPlain(S.groups[w.best.i].n, true))}</b> ${pc(w.best.e / w.best.n)}%: een verschil tussen die groepen zit dan deels in de plaats op de plaat.`
      : 'De groepen staan ongeveer evenredig op de rand, dus ze schuiven samen op; voor een vergelijking tussen groepen is dat minder erg dan voor een absolute waarde.';
    return `<div>${head}</div><div>${det}</div><div class="row" style="margin-top:6px"><button type="button" data-pl="edgeclr">Buitenrand leegmaken</button></div>`;
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
    const g = q('grid'), room = sz >= 34;                /* bij 384 putjes is er geen ruimte voor een label */
    const on = ordOn(), seq = on ? orderSeq() : null;
    const {cnt, lab} = labels();
    g.classList.toggle('sq', shape === 'vierkant');
    g.style.gridTemplateColumns = `22px repeat(${c},${sz}px)`;
    g.style.gridAutoRows = sz + 'px';
    { const p = pos(kf); if (p.i < 0 || p.i >= r || p.j >= c) kf = 'A1'; }
    let h = '<div></div>';
    for (let j = 1; j <= c; j++) h += `<button type="button" class="hd" data-plc="${j - 1}" title="Kolom ${j} vullen"><span data-notr="">${j}</span></button>`;
    for (let i = 0; i < r; i++) { h += `<button type="button" class="hd" data-plr="${i}" title="Rij ${uv(PLROW[i])} vullen"><span data-notr="">${PLROW[i]}</span></button>`;
      for (let j = 0; j < c; j++) { const k = key(i, j), gi = S.wells[k], fill = gi != null && S.groups[gi];
        const txt = on ? (seq[k] != null ? String(seq[k]) : '') : textOf(k, lab);
        const tip = [k, fill ? trPlain(S.groups[gi].n, true) : '', S.vals[k] || '', on && seq[k] != null ? trPlain('stap ' + seq[k]) : '']
          .filter(Boolean).join(' · ');
        h += `<div class="well${fill ? ' on' : ''}${txt && room ? ' wtxt' : ''}${tmode && k === wsel ? ' wsel' : ''}" data-notr="" data-w="${k}" title="${esc(tip)}" role="button" aria-label="${esc(tip)}" tabindex="${k === kf ? 0 : -1}"${
          fill ? ` style="--wc:${S.groups[gi].c};color:${inkOn(S.groups[gi].c)}"` : ''}>${txt && room ? `<span>${esc(txt)}</span>` : ''}</div>`; } }
    g.innerHTML = h; tStatic(g);
    if (kfocus) { const w = g.querySelector(`[data-w="${kf}"]`); if (w) w.focus(); }
    const act = document.activeElement;
    if (!(act && act.dataset && act.dataset.plgn != null))
      q('legend').innerHTML = S.groups.map((x, i) =>
        `<div class="grp${i === sel && !erase ? ' sel' : ''}" data-plg="${i}"><input type="color" data-plgc="${i}" value="${
          /^#[0-9a-f]{6}$/i.test(x.c) ? x.c : '#1558b0'}" aria-label="Kleur van de groep" title="Kleur kiezen">` +
        `<input data-plgn="${i}" value="${esc(x.n)}" aria-label="Naam van de groep"><span class="cnt" data-notr="">${cnt[i] || 0}</span>` +
        (S.groups.length > 1 ? `<button type="button" class="gdel" data-pldel="${i}" aria-label="Verwijder">✕</button>` : '') + '</div>').join('') +
        '<button type="button" class="grp addg" data-pl="add">+ kleur toevoegen</button>';
    tStatic(q('legend'));
    q('tmode').setAttribute('aria-pressed', tmode ? 'true' : 'false');
    q('tmode').classList.toggle('primary', tmode);
    q('txtbar').hidden = !tmode;
    if (tmode && wsel) { q('sel').textContent = wsel; const w = q('wtext'); if (w !== document.activeElement) w.value = S.vals[wsel] || ''; }
    fitText(sz);
    q('mc').innerHTML = mcText(); tStatic(q('mc'));
    q('warn').innerHTML = warnText(); tStatic(q('warn'));
    q('keyv').hidden = S.seed == null;
    q('erase').setAttribute('aria-pressed', erase ? 'true' : 'false');
    q('erase').classList.toggle('primary', erase);
    fire();
  }

  /* eigen tekst kan langer zijn dan een putje breed is: de letters krimpen tot het past */
  function fitText(sz) {
    // eerst alle putjes lezen, dan alle schrijven: één lay-out per ronde in plaats van per putje (S135, typen bleef >100 ms)
    let fs = Math.min(11, sz * 0.3), todo = [...host.querySelectorAll('.well.wtxt')];
    todo.forEach(el => { el.style.fontSize = fs + 'px'; });
    for (let i = 0; i < 12 && fs > 5.5 && todo.length; i++) {
      todo = todo.filter(el => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1);
      fs -= 0.5; todo.forEach(el => { el.style.fontSize = fs + 'px'; });
    }
  }

  const paint = k => { if (erase) { delete S.wells[k]; delete S.vals[k]; } else S.wells[k] = sel; };
  /* vanaf één putje: het aantal herhalingen naast of onder elkaar, binnen de plaat */
  function paintRun(k) {
    const {r, c} = dims(), {i, j} = pos(k), n = rep(), d = dir();
    if (i < 0) return;
    for (let t = 0; t < n; t++) { const ii = d === 'v' ? i + t : i, jj = d === 'h' ? j + t : j;
      if (ii >= r || jj >= c) break; paint(key(ii, jj)); }
  }
  q('grid').addEventListener('pointerdown', e => { const w = e.target.closest('[data-w]'); if (!w) return; kf = w.dataset.w;
    if (tmode) { e.preventDefault(); wsel = w.dataset.w; render(); setTimeout(() => q('wtext').focus(), 0); return; }
    painting = true; paintRun(w.dataset.w); render(); });
  q('grid').addEventListener('pointerover', e => { if (!painting || tmode) return; const w = e.target.closest('[data-w]'); if (w) { paintRun(w.dataset.w); render(); } });
  /* op een aanraakscherm komt pointerover niet, dus daar wordt het putje onder de vinger gezocht */
  q('grid').addEventListener('pointermove', e => { if (!painting || e.pointerType === 'mouse') return;
    const el = document.elementFromPoint(e.clientX, e.clientY), w = el && el.closest && el.closest('[data-w]');
    if (w && host.contains(w)) { e.preventDefault(); paint(w.dataset.w); render(); } });
  addEventListener('pointerup', () => { painting = false; });
  /* toetsenbord: pijltjes, Home en End verplaatsen de focus over de putjes, Enter of spatie kleurt het putje
     (met de herhalingen, zoals een klik) of kiest het in de tekstmodus */
  q('grid').addEventListener('keydown', e => { const w = e.target.closest('[data-w]'); if (!w) return;
    const {r, c} = dims(); let {i, j} = pos(w.dataset.w);
    const mv = {ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0]}[e.key];
    if (mv) { i = Math.min(r - 1, Math.max(0, i + mv[0])); j = Math.min(c - 1, Math.max(0, j + mv[1])); }
    else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = c - 1;
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); kf = w.dataset.w;
      if (tmode) { wsel = kf; render(); q('wtext').focus(); return; }
      paintRun(kf); kfocus = true; render(); kfocus = false; return; }
    else return;
    e.preventDefault(); kf = key(i, j); kfocus = true; render(); kfocus = false; });

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
    if (b.dataset.pl === 'add') { S.groups.push({n: trPlain('Groep') + ' ' + (S.groups.length + 1), c: freshCol()}); sel = S.groups.length - 1; erase = false; render();
      const i2 = host.querySelector(`[data-plgn="${sel}"]`); if (i2) { i2.focus(); i2.select(); } }
    else if (b.dataset.pl === 'erase') { erase = !erase; tmode = false; render(); }
    else if (b.dataset.pl === 'tmode') { tmode = !tmode; if (tmode) { erase = false; if (!wsel) wsel = 'A1'; } render();
      if (tmode) setTimeout(() => q('wtext').focus(), 0); }
    else if (b.dataset.pl === 'wclr') { if (wsel) { delete S.vals[wsel]; q('wtext').value = ''; render(); } }
    else if (b.dataset.pl === 'series') seriesDialog();
    else if (b.dataset.pl === 'tpl') tplDialog();
    else if (b.dataset.pl === 'rnd') rndDialog();
    else if (b.dataset.pl === 'keyv') keyDialog();
    else if (b.dataset.pl === 'edgeclr') { const {r, c} = dims();
      for (let i = 0; i < r; i++) for (let j = 0; j < c; j++)
        if (i === 0 || j === 0 || i === r - 1 || j === c - 1) { const k = key(i, j); delete S.wells[k]; delete S.vals[k]; }
      render(); }
    else if (b.dataset.pl === 'print') printCard();
    else if (b.dataset.pl === 'clear') { S.wells = {}; S.vals = {}; S.seed = null; render(); }
  });
  host.addEventListener('input', e => {
    if (e.target.dataset.plgc != null) { S.groups[+e.target.dataset.plgc].c = e.target.value; render(); return; }
    if (e.target.dataset.pl === 'wtext' && wsel) { const v = e.target.value;
      if (v) S.vals[wsel] = v; else delete S.vals[wsel]; render(); }
  });
  host.addEventListener('keydown', e => {
    if (e.target.dataset.pl !== 'wtext' || e.key !== 'Enter' || !wsel) return;
    e.preventDefault(); const {r, c} = dims(); let {i, j} = pos(wsel);
    j++; if (j >= c) { j = 0; i = (i + 1) % r; }
    wsel = key(i, j); render(); e.target.value = S.vals[wsel] || '';
  });
  host.addEventListener('change', e => {
    if (e.target.dataset.plgn != null) { S.groups[+e.target.dataset.plgn].n = e.target.value || trPlain('Groep'); render(); }
    else if (e.target.dataset.pl === 'fmt') { S.fmt = e.target.value; S.wells = {}; S.vals = {}; S.seed = null; render(); }
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
      if (bad) { f('err').textContent = trPlain(bad); return; }
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

  /* ---- randomiseren: sleutelnummer en bereik ---- */
  function rndDialog() {
    const n = Object.keys(S.wells).length;
    const m = appModal(`<h3 style="margin:0 0 4px;font-size:16px">Indeling randomiseren</h3>
      <p style="margin:0 0 12px;color:var(--muted);font-size:13px">De gevulde putjes wisselen onderling van groep en label; welke putjes gevuld zijn blijft hetzelfde. Bewaar of print de sleutel vóór de meting, anders kun je de plaat later niet meer uitlezen.</p>
      <div class="fields">
        <div class="f"><label for="plr-s-${id}">Sleutelnummer</label><input id="plr-s-${id}" data-r="s" inputmode="numeric" value="${Math.floor(Math.random() * 900000 + 100000)}"></div>
        <div class="f"><label for="plr-g-${id}">Wat randomiseren</label><select id="plr-g-${id}" data-r="g"><option value="">alle gevulde putjes</option>${S.groups.map((g, i) => `<option value="${i}">${esc(g.n)}</option>`).join('')}</select></div>
      </div>
      <p style="margin:10px 0 0;font-size:12.5px;color:var(--muted)">Kies één groep om de standaarden en controles op hun plek te laten staan en alleen de monsters door elkaar te halen.</p>
      <p data-r="err" style="margin:8px 0 0;font-size:13px;color:var(--warn,#c2410c)"></p>
      <div class="row" style="justify-content:flex-end;margin-top:12px;gap:6px"><button type="button" data-r="no">Annuleren</button><button type="button" class="primary" data-r="ok">Randomiseren</button></div>`);
    const f = x => m.box.querySelector(`[data-r="${x}"]`);
    f('no').addEventListener('click', m.close);
    f('ok').addEventListener('click', () => {
      const sd = Math.round(num(f('s').value)), g = f('g').value === '' ? null : +f('g').value;
      if (!isFinite(sd) || sd <= 0) { f('err').textContent = trPlain('Vul een sleutelnummer groter dan 0 in.'); return; }
      if (n < 2) { f('err').textContent = trPlain('Vul eerst minstens twee putjes.'); return; }
      if (!randomise(sd, g)) { f('err').textContent = trPlain('Deze groep heeft te weinig putjes om door elkaar te halen.'); return; }
      m.close(); keyDialog();
    });
    setTimeout(() => f('ok').focus(), 0);
  }

  /* ---- de sleutel: van label naar putje ---- */
  function keyDialog() {
    const ord = k => PLROW.indexOf(k.charAt(0)) * 100 + (+k.slice(1));
    const rows = Object.keys(S.wells).sort((a, b) => ord(a) - ord(b)).map(k =>
      ({w: k, g: (S.groups[S.wells[k]] || {}).n || '', v: S.vals[k] || ''}));
    const byLab = rows.filter(x => x.v).sort((a, b) => String(a.v).localeCompare(String(b.v), undefined, {numeric: true}));
    /* de koppen blijven Nederlands in de HTML: de vertaallaag pakt ze zelf op. Zelf vertalen
       zou in het Engels een tweede, onbekende sleutel opleveren. */
    const tbl = (list, byLabel) => `<table class="pld-key"><thead><tr><th>${byLabel ? 'Label' : 'Putje'}</th><th>Putje</th><th>Groep</th></tr></thead><tbody data-notr="">${
      list.map(x => `<tr><td>${esc(byLabel ? x.v : x.w)}</td><td>${esc(x.w)}</td><td>${esc(trPlain(x.g, true))}</td></tr>`).join('')}</tbody></table>`;
    const m = appModal(`<h3 style="margin:0 0 4px;font-size:16px">Sleutel van de plaat</h3>
      <p style="margin:0 0 10px;color:var(--muted);font-size:13px">${S.seed != null ? 'Sleutelnummer ' + ud(String(S.seed)) + ': met datzelfde nummer en dezelfde beginindeling komt deze plaat er weer precies zo uit.' : 'Deze plaat is niet gerandomiseerd.'}</p>
      ${byLab.length ? tbl(byLab, true) : '<p style="margin:0 0 8px;font-size:13px">Geen van de putjes heeft een label, dus de sleutel loopt alleen per putje.</p>' + tbl(rows, false)}
      <div class="row" style="justify-content:flex-end;margin-top:12px;gap:6px"><button type="button" data-k="print">Sleutel afdrukken</button><button type="button" class="primary" data-k="no">Sluiten</button></div>`);
    m.box.querySelector('[data-k="no"]').addEventListener('click', m.close);
    m.box.querySelector('[data-k="print"]').addEventListener('click', () => {
      const T = x => esc(trPlain(x));
      rpPrint(`<!doctype html><meta charset="utf-8"><title>${T('Sleutel van de plaat')}</title><style>
        @page{margin:14mm}body{margin:0;font:13px system-ui,sans-serif;color:#1f2933}
        h1{font-size:18px;margin:0 0 2px}p{margin:0 0 10px;color:#5f6b7a;font-size:12px}
        table{border-collapse:collapse;font-size:12px}th,td{border:1px solid #c9ced6;padding:3px 7px;text-align:left}th{background:#eef0f3}
        </style><h1>${typeof opts.name === 'function' ? esc(opts.name() || '') : esc(opts.name || trPlain('Plaatkaart'))} — ${T('Sleutel van de plaat')}</h1>
        <p>${S.seed != null ? T('Sleutelnummer') + ' ' + esc(String(S.seed)) + ' · ' : ''}${T('Datum')}: ________________</p>
        ${m.box.querySelector('.pld-key').outerHTML}`);
    });
  }

  /* ---- plaatkaart op A4: de tekening, de legenda en de gelabelde putjes ---- */
  function printCard() {
    const {r, c} = dims(), sz = c >= 16 ? 30 : c >= 12 ? 56 : 72, dim = size(sz);
    const cv = document.createElement('canvas');
    pRender(cv, dim.W, dim.H, x => draw(x, 0, 0, sz), 3);
    const cnt = {}; Object.keys(S.wells).forEach(k => { const g = S.wells[k]; cnt[g] = (cnt[g] || 0) + 1; });
    const ord = k => PLROW.indexOf(k.charAt(0)) * 100 + (+k.slice(1));
    const lab = Object.keys(S.vals).filter(k => S.wells[k] != null).sort((a, b) => ord(a) - ord(b));
    const nm = typeof opts.name === 'function' ? (opts.name() || '') : (opts.name || '');
    const T = s => esc(trPlain(s));
    /* een groepsnaam die de gebruiker zelf heeft getypt staat niet in de woordenlijst en
       blijft dan ongewijzigd; `true` houdt hem uit de lijst met ontbrekende vertalingen */
    const G = s => esc(trPlain(String(s), true));
    const head = `<h1>${nm ? esc(nm) : T('Plaatkaart')}</h1>
      <p class="meta">${T(r * c + ' putjes')} · ${T('gevuld')}: <b>${Object.keys(S.wells).length}</b>${
        S.seed != null ? ' · ' + T('Sleutelnummer') + ': <b>' + esc(String(S.seed)) + '</b>' : ''
      } · ${T('Datum')}: ________________ · ${T('Uitgevoerd door')}: ________________</p>`;
    const leg = `<table><thead><tr><th>${T('Groep')}</th><th>${T('Putjes')}</th></tr></thead><tbody>` +
      S.groups.map((g, i) => `<tr><td><i style="background:${esc(g.c)}"></i>${G(g.n)}</td><td>${cnt[i] || 0}</td></tr>`).join('') + '</tbody></table>';
    /* het advies staat al vertaald in de pagina; dat nemen we over, zodat de vertaling niet
       twee keer hoeft te worden opgezocht voor een document zonder vertaallaag */
    const mcHtml = (q('mc') || {}).innerHTML || '';
    const wHtml = (q('warn') || {}).innerHTML.replace(/<div class="row"[\s\S]*?<\/div>/, '');
    const wn = wHtml.trim() ? `<h2>${T('Let op')}</h2><div class="mc">${wHtml}</div>` : '';
    const mc = mcHtml ? `<h2>${T('Met een meerkanaalspipet')}</h2><div class="mc">${mcHtml}</div>` : '';
    const tbl = lab.length ? `<h2>${T('Gelabelde putjes')}</h2><table class="wl"><thead><tr><th>${T('Putje')}</th><th>${T('Groep')}</th><th>${T('Label')}</th></tr></thead><tbody>` +
      lab.map(k => `<tr><td>${esc(k)}</td><td>${G((S.groups[S.wells[k]] || {}).n || '')}</td><td>${esc(S.vals[k])}</td></tr>`).join('') + '</tbody></table>' : '';
    rpPrint(`<!doctype html><meta charset="utf-8"><title>${nm ? esc(nm) : T('Plaatkaart')}</title><style>
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
      </style>${head}<div class="cols"><img src="${cv.toDataURL('image/png')}"><div>${leg}${mc}${wn}</div></div>${tbl}`);
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
    const seq = ordOn() ? orderSeq() : null, {lab} = labels(), sq = shape === 'vierkant';
    for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) {
      const k = key(i, j), gi = S.wells[k], on = gi != null && S.groups[gi];
      const cx = L + (j + 0.5) * sz, cy = T + (i + 0.5) * sz, rad = sz * 0.42;
      x.beginPath(); if (sq) x.roundRect(cx - rad, cy - rad, 2 * rad, 2 * rad, 5); else x.arc(cx, cy, rad, 0, 7);
      x.fillStyle = on ? S.groups[gi].c : '#f4f5f7'; x.fill();
      x.strokeStyle = on ? S.groups[gi].c : PCOL.line; x.lineWidth = 1; x.stroke();
      const v = seq ? (seq[k] != null ? String(seq[k]) : '') : textOf(k, lab);
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
    get: () => ({fmt: S.fmt, wells: {...S.wells}, vals: {...S.vals}, seed: S.seed, groups: S.groups.map(g => ({...g}))}),
    set(v) { if (!v) return;
      if (v.fmt && PLFMT.some(([f]) => f === v.fmt)) { S.fmt = v.fmt; const f = q('fmt'); if (f) f.value = S.fmt; }
      if (v.groups && v.groups.length) S.groups = v.groups.map(g => ({n: g.n || 'Groep', c: g.c || PLCOL[0]}));
      if (v.wells) S.wells = {...v.wells};
      S.vals = v.vals ? {...v.vals} : {};
      S.seed = v.seed != null ? v.seed : null;
      sel = Math.min(sel, S.groups.length - 1); render(); },
    selected: () => sel, label: (k, v) => { if (v == null || v === '') delete S.vals[k]; else S.vals[k] = String(v); },
    labels, text: k => textOf(k, labels().lab),
    /* aangrenzende putjes van dezelfde groep zijn één blok (één replicaat), in de gekozen
       richting; met gi erbij alleen die ene groep. Gebruikt door de monsterlijst (S36). */
    blocks(gi) { const {r, c} = dims(), d = dir(), out = {}; let n = -1;
      const outer = d === 'v' ? c : r, inner = d === 'v' ? r : c;
      for (let a = 0; a < outer; a++) { let prev = null;
        for (let b = 0; b < inner; b++) { const i = d === 'v' ? b : a, j = d === 'v' ? a : b, k = key(i, j), g = S.wells[k];
          if (g == null || (gi != null && g !== gi)) { prev = null; continue; }
          if (g !== prev) n++; out[k] = n; prev = g; } }
      return out; },
    shape(v) { if (v != null) { shape = v === 'vierkant' ? 'vierkant' : 'rond'; render(); } return shape; },
    autoLabel(v) { if (v != null) { autoLab = typeof v === 'function' ? v : !!v; render(); } return autoLab; },
    dir,
    palette(a) { if (a && a.length) { pool = a.slice(); S.groups.forEach((g, i) => g.c = a[i % a.length]); render(); } return pool.slice(); },
    template(id) { const t = PLTPL.find(x => x.id === id); if (!t) return false;
      if (t.fmt) { S.fmt = t.fmt; const f = q('fmt'); if (f) f.value = S.fmt; }
      const d = dims(), o = t.make(d.r, d.c);
      S.groups = o.groups.map(g => ({...g})); S.wells = {...o.wells}; S.vals = {...o.vals}; sel = 0; render(); return true; },
    print: printCard, order: orderSeq, multi, randomise, edge: edgeInfo, draw, size, render
  };
}

/* ================= PLAATINDELING: DE TOOL OP DE PLAATONTWERPER =================
   De opmaak van deze tool staat in web/index.html; de code staat hier. De plaat zelf is de
   gedeelde plaatontwerper uit 02_plate.js, die hierboven in hetzelfde script is ingevoegd.
   Deze module zet daar de titel, het kleurenpalet, de legenda in de afbeelding, een eigen
   toelichting en de export als tabel of CSV omheen, en tekent de plaat groot op een canvas
   voor PNG, SVG, kopiëren en afdrukken.

   function- en var-declaraties worden gehesen, dus tblSnap() en tblRestore() in index.html
   mogen hier wel naar verwijzen; deze module loopt vóór tblRestore(). */
const GCOL=['#1d5bc4','#c2410c','#15803d','#7c3aed','#b91c1c','#0e7490','#a16207','#be185d','#4b5563','#0f766e'];
const WRL='ABCDEFGHIJKLMNOP';
var wPld=null;
function wState(){ return wPld?wPld.get():{fmt:'8x12',wells:{},vals:{},groups:[],seed:null}; }
function wDims(){ const [r,c]=wState().fmt.split('x').map(Number); return {r:r||8,c:c||12}; }
function wLabels(){ return wPld?wPld.labels():{cnt:{},lab:{}}; }

/* de voorbeeldplaat waarmee de tool opent: standaarden in duplo, een blanco, monsters en een
   positieve controle; precies de indeling die de tool altijd had */
function wExample(){ if(!wPld) return; const {r,c}=wDims(); if(r!==8||c<12) return; const w={};
  for(let i=0;i<7;i++){ w[WRL[i]+1]=0; w[WRL[i]+2]=0; } w.H1=1; w.H2=1;
  for(let col=3;col<=8;col++) for(let i=0;i<8;i++) w[WRL[i]+col]=2; w.H11=3; w.H12=3;
  wPld.set({fmt:'8x12',wells:w,vals:{},groups:wState().groups}); }

/* ---------- de afbeelding ---------- */
function plateImg(){ const cv=$('#w-cv'); if(!cv||!wPld) return;
  const S=wState(), {r,c}=wDims(), {lab,cnt}=wLabels(), title=$('#w-title').value.trim();
  const sz=c>=16?30:c>=12?44:c>=8?54:70, W=Math.max(560,60+c*sz+20);
  const sq=$('#w-shape').value==='vierkant', used=$('#w-leg').checked?S.groups.map((g,i)=>[g,i]).filter(([g,i])=>cnt[i]):[];
  const NL_=pNotes('w',W), legRows=Math.ceil(used.length/3), H=(title?40:0)+30+r*sz+20+legRows*22+(NL_.length?NL_.length*17+12:0)+10;
  pShow(cv,W,H,(x)=>{ const t0=pTitle(x,title,W), L=44, T=t0+26; x.font='600 12px '+PFONT(); x.fillStyle=PCOL.muted; x.textAlign='center';
    for(let j=1;j<=c;j++) x.fillText(String(j),L+(j-0.5)*sz,T-10); for(let i=0;i<r;i++) x.fillText(WRL[i],L-14,T+(i+0.5)*sz);
    x.strokeStyle=PCOL.ink; x.lineWidth=1.2; x.beginPath(); x.roundRect?x.roundRect(L-6,T-4,c*sz+12,r*sz+8,10):x.rect(L-6,T-4,c*sz+12,r*sz+8); x.stroke();
    for(let i=0;i<r;i++) for(let j=1;j<=c;j++){ const k=WRL[i]+j, g=S.wells[k], on=g!=null&&S.groups[g], cx=L+(j-0.5)*sz, cy=T+(i+0.5)*sz, rad=sz*0.42;
      x.beginPath(); if(sq){ x.roundRect?x.roundRect(cx-rad,cy-rad,2*rad,2*rad,5):x.rect(cx-rad,cy-rad,2*rad,2*rad); } else x.arc(cx,cy,rad,0,7);
      x.fillStyle=on?S.groups[g].c:'#f4f5f7'; x.fill(); x.strokeStyle=on?'rgba(0,0,0,.25)':PCOL.line; x.lineWidth=1; x.stroke();
      const t=S.vals[k]||(on?(lab[k]||''):''); if(t){ x.fillStyle=on?inkOn(S.groups[g].c):PCOL.ink; wellLines(x,t,cx,cy,sq?rad*1.12:rad); } }
    let ly=T+r*sz+26; used.forEach(([g,i],q)=>{ const col=q%3, row=Math.floor(q/3), lx=L+col*Math.max(170,(W-L-20)/3), yy=ly+row*22;
      x.fillStyle=g.c; x.beginPath(); x.arc(lx+6,yy,6,0,7); x.fill(); x.fillStyle=PCOL.ink; x.font='12.5px '+PFONT(); x.textAlign='left';
      /* de naam gaat door de vertaallaag, het aantal erachter blijft letterlijk */
      x.fillText(g.n,lx+18,yy); x.fillText(uv(' ('+cnt[i]+')'),lx+18+x.measureText(g.n).width,yy); });
    if(NL_.length) pDrawNotes(x,NL_,ly+legRows*22+8); }); }
/* tekst in een putje over meer regels, zodat hij binnen de rand blijft */
function wellLines(x,t,cx,cy,rad){ const W=rad*1.72, set=fs=>{ x.font=`600 ${fs}px `+PFONT(); };
  const mw=v=>x.measureText(uv(v)).width;   /* ook meten gaat door trCanvas: markeer de tekst */
  const wrap=(fs,split)=>{ set(fs); let words=String(t).split(/\s+/); if(split) words=words.flatMap(w=>{ if(mw(w)<=W) return [w]; const parts=[]; let cur=''; [...w].forEach(ch=>{ if(mw(cur+ch+'-')>W&&cur){ parts.push(cur+'-'); cur=ch; } else cur+=ch; }); parts.push(cur); return parts; });
    const out=[]; let ln=''; words.forEach(w=>{ const c=(ln+' '+w).trim(); if(mw(c)>W&&ln){ out.push(ln); ln=w; } else ln=c; }); if(ln) out.push(ln); return out; };
  const fits=(L,fs)=>{ set(fs); const n=L.length, hh=n*fs*1.1; return L.every((l,i)=>{ const yy=(i-(n-1)/2)*fs*1.1, half=Math.sqrt(Math.max(0,rad*rad*0.92-(Math.abs(yy)+fs*0.45)**2)); return mw(l)<=2*half; })&&hh<=rad*1.7; };
  let fs=Math.min(12,rad*0.62), L=null; for(;fs>=5.5;fs-=0.5){ const c=wrap(fs,false); if(fits(c,fs)){ L=c; break; } }
  if(!L){ for(fs=Math.min(9,rad*0.45);fs>=5;fs-=0.5){ const c=wrap(fs,true); if(fits(c,fs)||fs<=5.5){ L=c; break; } } }
  set(fs); L.forEach((l,i)=>x.fillText(uv(l),cx,cy+(i-(L.length-1)/2)*fs*1.1)); }

/* ---------- de plaat als tabel ---------- */
function wCells(){ const S=wState(), {r,c}=wDims(), {lab}=wLabels();
  const cell=k=>{ const g=S.wells[k], gn=g!=null&&S.groups[g]?S.groups[g].n:'', own=S.vals[k];
    return own?own+(gn?` (${gn})`:''):(gn?`${gn} ${(lab[k]||'').replace(/^\D+/,'')}`.trim():''); };
  return {r,c,cell}; }
/* de tekst voor het klembord (tabel) en voor het CSV-bestand; de knoppen zelf staan in de Vue-component
   Plaatindeling (src/tools/Plaatindeling.vue), die deze twee functies aanroept */
function plaatTSV(){ const {r,c,cell}=wCells();
  let t=$('#w-title').value+'\n\t'+Array.from({length:c},(_,j)=>j+1).join('\t')+'\n';
  for(let i=0;i<r;i++){ t+=WRL[i]; for(let j=1;j<=c;j++) t+='\t'+cell(WRL[i]+j); t+='\n'; }
  return i18nTSV(t); }
function plaatCSV(){ const {r,c,cell}=wCells();
  let t='\t'+Array.from({length:c},(_,j)=>j+1).join('\t');
  for(let i=0;i<r;i++){ t+='\n'+WRL[i]; for(let j=1;j<=c;j++) t+='\t'+cell(WRL[i]+j); }
  return t; }

/* de keuzes (palet, vorm, labels, legenda, titel, tekst) en de knoppen regelt de component; die roept
   plateImg() aan en geeft palet, vorm en labels door aan de ontwerper (wPld) */
calc.plaat=()=>{ plateImg(); };

/* De gedeelde plaatontwerper bouwt de plaat in #w-pld, dat in de component staat. Daarom wordt hij pas
   gemaakt als de component er is: Plaatindeling.vue roept dit aan in mounted(). Een Vue-mount wist de
   inhoud van zijn host, dus vroeger bouwen heeft geen zin. De andere tools (qPCR, ELISA) maken hun
   eigen ontwerper en veranderen niet. */
function plaatInit(){
  if(wPld) return;
  wPld=plateDesigner($('#w-pld'),{fmt:'8x12',shape:$('#w-shape').value,autoLabel:$('#w-autolab').checked,
    palette:PALS[$('#w-pal').value]||GCOL, name:()=>$('#w-title').value,
    groups:[{n:'Standaard',c:GCOL[0]},{n:'Blanco',c:GCOL[8]},{n:'Monster',c:GCOL[1]},{n:'Pos. controle',c:GCOL[2]}],
    onChange(){ try{ plateImg(); }catch(e){} }});
  wExample();
}

/* alles hierboven ook als globale naam, live (zie src/lib/global.js) */
live({
  PLFMT: () => PLFMT,
  PLROW: () => PLROW,
  PLCOL: () => PLCOL,
  plateSeq: [() => plateSeq, v => { plateSeq = v; }],
  PLTPL: () => PLTPL,
  plateDesigner: [() => plateDesigner, v => { plateDesigner = v; }],
  GCOL: () => GCOL,
  WRL: () => WRL,
  wPld: [() => wPld, v => { wPld = v; }],
  wState: [() => wState, v => { wState = v; }],
  wDims: [() => wDims, v => { wDims = v; }],
  wLabels: [() => wLabels, v => { wLabels = v; }],
  wExample: [() => wExample, v => { wExample = v; }],
  plateImg: [() => plateImg, v => { plateImg = v; }],
  wellLines: [() => wellLines, v => { wellLines = v; }],
  wCells: [() => wCells, v => { wCells = v; }],
  plaatTSV: [() => plaatTSV, v => { plaatTSV = v; }],
  plaatCSV: [() => plaatCSV, v => { plaatCSV = v; }],
  plaatInit: [() => plaatInit, v => { plaatInit = v; }]
});
