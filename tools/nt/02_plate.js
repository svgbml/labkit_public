/* ================= GEDEELDE PLAATONTWERPER =================
   Eén component voor elke tool die met een microplaat werkt. Elke aanroep maakt een eigen
   exemplaar met eigen toestand, dus twee platen op één pagina zitten elkaar niet in de weg.

     const P = plateDesigner(container, {fmt:'8x12', onChange(){...}});
     P.get()            -> {fmt, wells:{A1:0,…}, vals:{A1:'100 µg/mL',…}, groups:[{n,c},…]}
     P.set(state)       -> toestand terugzetten
     P.draw(x, X, Y, sz)-> de plaat op een canvas tekenen (voor PNG/SVG)
     P.rows()/P.cols()  -> afmetingen van het huidige formaat

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
      <button type="button" data-pl="series">Reeks…</button>
      <button type="button" data-pl="erase" aria-pressed="false">Gum</button>
      <button type="button" data-pl="clear">Leegmaken</button>
    </div>
    <div class="legend" data-pl="legend"></div>
    <div class="tbl-wrap"><div class="plate" data-pl="grid" role="group" aria-label="Putjes van de plaat"></div></div>
    <p class="pld-hint">Sleep over de putjes om te vullen. Met <b>Herhalingen</b> vul je replica's in één beweging; een klik op een rij- of kolomkop vult die hele rij of kolom.</p>`;

  const q = n => host.querySelector(`[data-pl="${n}"]`);
  const rep = () => { const v = +(q('rep') || {}).value; return Math.max(1, Math.min(8, v || 1)); };
  const dir = () => ((q('dir') || {}).value === 'v' ? 'v' : 'h');

  function render() {
    const {r, c} = dims(), sz = c >= 16 ? 24 : c >= 12 ? 34 : c >= 8 ? 42 : 56;
    const g = q('grid'), lab = sz >= 34;                 /* bij 384 putjes is er geen ruimte voor een label */
    g.style.gridTemplateColumns = `22px repeat(${c},${sz}px)`;
    g.style.gridAutoRows = sz + 'px';
    let h = '<div></div>';
    for (let j = 1; j <= c; j++) h += `<button type="button" class="hd" data-plc="${j - 1}" title="Kolom ${j} vullen"><span data-notr="">${j}</span></button>`;
    for (let i = 0; i < r; i++) { h += `<button type="button" class="hd" data-plr="${i}" title="Rij ${uv(PLROW[i])} vullen"><span data-notr="">${PLROW[i]}</span></button>`;
      for (let j = 0; j < c; j++) { const k = key(i, j), gi = S.wells[k], on = gi != null && S.groups[gi], v = S.vals[k];
        h += `<div class="well${on ? ' on' : ''}${v && lab ? ' wtxt' : ''}" data-notr="" data-w="${k}" title="${k}${on ? ' · ' + esc(S.groups[gi].n) : ''}${v ? ' · ' + esc(v) : ''}"${on ? ` style="--wc:${S.groups[gi].c}"` : ''}>${v && lab ? `<span>${esc(v)}</span>` : ''}</div>`; } }
    g.innerHTML = h;
    const act = document.activeElement;
    if (!(act && act.dataset && act.dataset.plgn != null))
      q('legend').innerHTML = S.groups.map((x, i) =>
        `<div class="grp${i === sel && !erase ? ' sel' : ''}" data-plg="${i}"><i style="background:${x.c}"></i>` +
        `<input data-plgn="${i}" value="${esc(x.n)}" aria-label="Naam van de groep"><button type="button" class="gdel" data-pldel="${i}" aria-label="Verwijder">✕</button></div>`).join('');
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
    else if (b.dataset.pl === 'clear') { S.wells = {}; S.vals = {}; render(); }
  });
  host.addEventListener('change', e => {
    if (e.target.dataset.plgn != null) { S.groups[+e.target.dataset.plgn].n = e.target.value || trPlain('Groep'); render(); }
    else if (e.target.dataset.pl === 'fmt') { S.fmt = e.target.value; S.wells = {}; S.vals = {}; render(); }
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

  /* de plaat op een canvas tekenen; geeft de gebruikte hoogte terug */
  function draw(x, X, Y, sz) {
    const {r, c} = dims(); sz = sz || (c >= 16 ? 26 : c >= 12 ? 44 : c >= 8 ? 54 : 70);
    const L = X + 24, T = Y + 22;
    x.font = '600 ' + Math.min(12, sz * 0.32) + 'px ' + PFONT(); x.fillStyle = PCOL.muted; x.textAlign = 'center'; x.textBaseline = 'middle';
    for (let j = 1; j <= c; j++) x.fillText(String(j), L + (j - 0.5) * sz, T - 11);
    for (let i = 0; i < r; i++) x.fillText(PLROW[i], L - 14, T + (i + 0.5) * sz);
    x.strokeStyle = PCOL.ink; x.lineWidth = 1.2;
    x.beginPath(); x.roundRect(L - 6, T - 4, c * sz + 12, r * sz + 8, 10); x.stroke();
    for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) {
      const k = key(i, j), gi = S.wells[k], on = gi != null && S.groups[gi];
      const cx = L + (j + 0.5) * sz, cy = T + (i + 0.5) * sz, rad = sz * 0.42;
      x.beginPath(); x.arc(cx, cy, rad, 0, 7);
      x.fillStyle = on ? S.groups[gi].c : '#f4f5f7'; x.fill();
      x.strokeStyle = on ? S.groups[gi].c : PCOL.line; x.lineWidth = 1; x.stroke();
      const v = S.vals[k];
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
    draw, size, render
  };
}
