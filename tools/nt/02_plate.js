/* ================= GEDEELDE PLAATONTWERPER =================
   Eén component voor elke tool die met een microplaat werkt. Elke aanroep maakt een eigen
   exemplaar met eigen toestand, dus twee platen op één pagina zitten elkaar niet in de weg.

     const P = plateDesigner(container, {fmt:'8x12', onChange(){...}});
     P.get()            -> {fmt, wells:{A1:0,…}, groups:[{n,c},…]}
     P.set(state)       -> toestand terugzetten
     P.draw(x, X, Y, sz)-> de plaat op een canvas tekenen (voor PNG/SVG)
     P.rows()/P.cols()  -> afmetingen van het huidige formaat

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
    groups: (opts.groups || [{n: 'Standaard', c: PLCOL[0]}, {n: 'Blanco', c: PLCOL[8]},
      {n: 'Monster', c: PLCOL[1]}, {n: 'Controle', c: PLCOL[2]}]).map(g => ({...g}))
  };
  let sel = 0, erase = false, painting = false;
  const dims = () => { const [r, c] = S.fmt.split('x').map(Number); return {r: r || 8, c: c || 12}; };
  const key = (i, j) => PLROW[i] + (j + 1);
  const fire = () => { if (opts.onChange) try { opts.onChange(); } catch (e) {} };

  host.classList.add('pld');
  host.innerHTML = `<div class="pld-bar">
      <label class="f"><span>Formaat</span><select data-pl="fmt">${PLFMT.map(([v, n]) => `<option value="${v}"${v === S.fmt ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
      <button type="button" data-pl="add">+ Groep</button>
      <button type="button" data-pl="erase" aria-pressed="false">Gum</button>
      <button type="button" data-pl="clear">Leegmaken</button>
    </div>
    <div class="legend" data-pl="legend"></div>
    <div class="tbl-wrap"><div class="plate" data-pl="grid" role="group" aria-label="Putjes van de plaat"></div></div>`;

  const q = n => host.querySelector(`[data-pl="${n}"]`);

  function render() {
    const {r, c} = dims(), sz = c >= 16 ? 24 : c >= 12 ? 34 : c >= 8 ? 42 : 56;
    const g = q('grid');
    g.style.gridTemplateColumns = `22px repeat(${c},${sz}px)`;
    g.style.gridAutoRows = sz + 'px';
    let h = '<div></div>';
    for (let j = 1; j <= c; j++) h += `<div class="hd">${j}</div>`;
    for (let i = 0; i < r; i++) { h += `<div class="hd">${PLROW[i]}</div>`;
      for (let j = 0; j < c; j++) { const k = key(i, j), gi = S.wells[k], on = gi != null && S.groups[gi];
        h += `<div class="well${on ? ' on' : ''}" data-w="${k}" title="${k}${on ? ' · ' + esc(S.groups[gi].n) : ''}"${on ? ` style="--wc:${S.groups[gi].c}"` : ''}></div>`; } }
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

  const paint = k => { if (erase) delete S.wells[k]; else S.wells[k] = sel; };
  q('grid').addEventListener('pointerdown', e => { const w = e.target.closest('[data-w]'); if (!w) return;
    painting = true; paint(w.dataset.w); render(); });
  q('grid').addEventListener('pointerover', e => { if (!painting) return; const w = e.target.closest('[data-w]'); if (w) { paint(w.dataset.w); render(); } });
  /* op een aanraakscherm komt pointerover niet, dus daar wordt het putje onder de vinger gezocht */
  q('grid').addEventListener('pointermove', e => { if (!painting || e.pointerType === 'mouse') return;
    const el = document.elementFromPoint(e.clientX, e.clientY), w = el && el.closest && el.closest('[data-w]');
    if (w && host.contains(w)) { e.preventDefault(); paint(w.dataset.w); render(); } });
  addEventListener('pointerup', () => { painting = false; });

  host.addEventListener('click', e => {
    const d = e.target.closest('[data-pldel]');
    if (d) { const i = +d.dataset.pldel; if (S.groups.length <= 1) return;
      S.groups.splice(i, 1);
      Object.keys(S.wells).forEach(k => { const v = S.wells[k]; if (v === i) delete S.wells[k]; else if (v > i) S.wells[k] = v - 1; });
      sel = Math.min(sel, S.groups.length - 1); render(); return; }
    const g = e.target.closest('[data-plg]');
    if (g && e.target.dataset.plgn == null) { sel = +g.dataset.plg; erase = false; render(); return; }
    const b = e.target.closest('[data-pl]'); if (!b || b.tagName !== 'BUTTON') return;
    if (b.dataset.pl === 'add') { S.groups.push({n: trPlain('Groep') + ' ' + (S.groups.length + 1), c: PLCOL[S.groups.length % PLCOL.length] }); sel = S.groups.length - 1; erase = false; render(); }
    else if (b.dataset.pl === 'erase') { erase = !erase; render(); }
    else if (b.dataset.pl === 'clear') { S.wells = {}; render(); }
  });
  host.addEventListener('change', e => {
    if (e.target.dataset.plgn != null) { S.groups[+e.target.dataset.plgn].n = e.target.value || trPlain('Groep'); render(); }
    else if (e.target.dataset.pl === 'fmt') { S.fmt = e.target.value; S.wells = {}; render(); }
  });

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
    }
    return T + r * sz + 16 - Y;
  }
  const size = (sz) => { const {r, c} = dims(); sz = sz || (c >= 16 ? 26 : c >= 12 ? 44 : c >= 8 ? 54 : 70);
    return {W: 24 + c * sz + 34, H: 22 + r * sz + 16}; };

  render();
  return {
    id, el: host, dims, rows: () => dims().r, cols: () => dims().c,
    get: () => ({fmt: S.fmt, wells: {...S.wells}, groups: S.groups.map(g => ({...g}))}),
    set(v) { if (!v) return;
      if (v.fmt && PLFMT.some(([f]) => f === v.fmt)) { S.fmt = v.fmt; const f = q('fmt'); if (f) f.value = S.fmt; }
      if (v.groups && v.groups.length) S.groups = v.groups.map(g => ({n: g.n || 'Groep', c: g.c || PLCOL[0]}));
      if (v.wells) S.wells = {...v.wells};
      sel = Math.min(sel, S.groups.length - 1); render(); },
    selected: () => sel, draw, size, render
  };
}
