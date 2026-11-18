/* ================= GEDEELDE OPMAAK VOOR TEKENTOOLS =================
   Elke tool die een afbeelding maakt gebruikt dezelfde indeling (tekening boven of links,
   instellingen ernaast) en dezelfde knoppenbalk: PNG, SVG, kopiëren en afdrukken.
   De tekenfuncties zelf blijven ongewijzigd: ze krijgen gewoon een tekencontext. Voor SVG
   gaat er een opnemende context doorheen die dezelfde opdrachten als SVG wegschrijft, zodat
   de export echte vectoren zijn en niet een plaatje in een omslag. */

/* ---------- opnemende tekencontext: 2D-opdrachten worden SVG ---------- */
const SVGFONT = /^\s*(?:(bold|[1-9]00)\s+)?(?:(italic|oblique)\s+)?([\d.]+)px\s+(.+?)\s*$/;
const svgEsc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const svgN = v => Number.isFinite(v) ? String(Math.round(v * 100) / 100) : '0';

function svgRec(W, H) {
  const body = [], defs = [];
  const meas = document.createElement('canvas').getContext('2d');
  let st = {fill: '#000', stroke: '#000', lw: 1, font: '10px sans-serif', align: 'start',
    base: 'alphabetic', alpha: 1, dash: '', m: [1, 0, 0, 1, 0, 0], clip: ''};
  const stack = [];
  let d = '', cx0 = 0, cy0 = 0, nid = 0;
  const mul = (a, b) => [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3], a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]];
  const tf = () => { const m = st.m;
    return (m[0] === 1 && m[1] === 0 && m[2] === 0 && m[3] === 1 && m[4] === 0 && m[5] === 0)
      ? '' : ` transform="matrix(${m.map(svgN).join(' ')})"`; };
  const common = () => tf() + (st.alpha < 1 ? ` opacity="${svgN(st.alpha)}"` : '') + (st.clip ? ` clip-path="url(#${st.clip})"` : '');
  const put = s => body.push(s);
  const arcTo = (cx, cy, r, a0, a1, ccw) => {
    let da = a1 - a0;
    if (!ccw && da < 0) da += Math.PI * 2; if (ccw && da > 0) da -= Math.PI * 2;
    const full = Math.abs(da) >= Math.PI * 2 - 1e-6;
    const p = (a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    if (full) { const [x1, y1] = p(0), [x2, y2] = p(Math.PI);
      return `M${svgN(x1)} ${svgN(y1)}A${svgN(r)} ${svgN(r)} 0 1 1 ${svgN(x2)} ${svgN(y2)}A${svgN(r)} ${svgN(r)} 0 1 1 ${svgN(x1)} ${svgN(y1)}Z`; }
    const [x1, y1] = p(a0), [x2, y2] = p(a1);
    return `${d ? 'L' : 'M'}${svgN(x1)} ${svgN(y1)}A${svgN(r)} ${svgN(r)} 0 ${Math.abs(da) > Math.PI ? 1 : 0} ${da > 0 ? 1 : 0} ${svgN(x2)} ${svgN(y2)}`;
  };
  const rectD = (x, y, w, h) => `M${svgN(x)} ${svgN(y)}h${svgN(w)}v${svgN(h)}h${svgN(-w)}Z`;
  const roundD = (x, y, w, h, r) => { r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    return `M${svgN(x + r)} ${svgN(y)}h${svgN(w - 2 * r)}a${svgN(r)} ${svgN(r)} 0 0 1 ${svgN(r)} ${svgN(r)}v${svgN(h - 2 * r)}a${svgN(r)} ${svgN(r)} 0 0 1 ${svgN(-r)} ${svgN(r)}h${svgN(-(w - 2 * r))}a${svgN(r)} ${svgN(r)} 0 0 1 ${svgN(-r)} ${svgN(-r)}v${svgN(-(h - 2 * r))}a${svgN(r)} ${svgN(r)} 0 0 1 ${svgN(r)} ${svgN(-r)}Z`; };
  const strokeAttr = () => `fill="none" stroke="${svgEsc(st.stroke)}" stroke-width="${svgN(st.lw)}" stroke-linecap="round" stroke-linejoin="round"` + (st.dash ? ` stroke-dasharray="${st.dash}"` : '');

  const ctx = {
    get fillStyle() { return st.fill; }, set fillStyle(v) { st.fill = v; },
    get strokeStyle() { return st.stroke; }, set strokeStyle(v) { st.stroke = v; },
    get lineWidth() { return st.lw; }, set lineWidth(v) { st.lw = v; },
    get globalAlpha() { return st.alpha; }, set globalAlpha(v) { st.alpha = v; },
    get font() { return st.font; }, set font(v) { st.font = v; meas.font = v; },
    get textAlign() { return st.align; }, set textAlign(v) { st.align = v; },
    get textBaseline() { return st.base; }, set textBaseline(v) { st.base = v; },
    set lineCap(v) {}, set lineJoin(v) {}, set imageSmoothingEnabled(v) {}, set filter(v) {},
    save() { stack.push({...st, m: st.m.slice()}); },
    restore() { if (stack.length) st = stack.pop(); },
    translate(tx, ty) { st.m = mul(st.m, [1, 0, 0, 1, tx, ty]); },
    rotate(r) { st.m = mul(st.m, [Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r), 0, 0]); },
    scale(sx, sy) { st.m = mul(st.m, [sx, 0, 0, sy, 0, 0]); },
    setTransform(a, b, c, dd, e, f) { st.m = [a, b, c, dd, e, f]; },
    setLineDash(a) { st.dash = (a && a.length) ? a.join(' ') : ''; },
    /* de echte tekencontext laat alle tekst door trCanvas lopen (vertalen en de markers
       rond gebruikerstekst weghalen); de opnemer moet dat net zo doen */
    measureText(t) { return meas.measureText(trCanvas(String(t))); },
    beginPath() { d = ''; },
    closePath() { d += 'Z'; },
    moveTo(x, y) { d += `M${svgN(x)} ${svgN(y)}`; cx0 = x; cy0 = y; },
    lineTo(x, y) { d += (d ? 'L' : 'M') + `${svgN(x)} ${svgN(y)}`; cx0 = x; cy0 = y; },
    quadraticCurveTo(x1, y1, x, y) { d += `Q${svgN(x1)} ${svgN(y1)} ${svgN(x)} ${svgN(y)}`; cx0 = x; cy0 = y; },
    bezierCurveTo(x1, y1, x2, y2, x, y) { d += `C${svgN(x1)} ${svgN(y1)} ${svgN(x2)} ${svgN(y2)} ${svgN(x)} ${svgN(y)}`; cx0 = x; cy0 = y; },
    rect(x, y, w, h) { d += rectD(x, y, w, h); },
    roundRect(x, y, w, h, r) { d += roundD(x, y, w, h, Array.isArray(r) ? r[0] : (r || 0)); },
    arc(x, y, r, a0, a1, ccw) { d += arcTo(x, y, r, a0, a1, !!ccw); },
    ellipse(x, y, rx, ry, rot, a0, a1, ccw) { d += `M${svgN(x + rx)} ${svgN(y)}A${svgN(rx)} ${svgN(ry)} 0 1 1 ${svgN(x - rx)} ${svgN(y)}A${svgN(rx)} ${svgN(ry)} 0 1 1 ${svgN(x + rx)} ${svgN(y)}Z`; },
    fill() { if (d) put(`<path d="${d}" fill="${svgEsc(st.fill)}"${common()}/>`); },
    stroke() { if (d) put(`<path d="${d}" ${strokeAttr()}${common()}/>`); },
    clip() { const id = 'c' + (++nid); defs.push(`<clipPath id="${id}"><path d="${d}"/></clipPath>`); st.clip = id; },
    fillRect(x, y, w, h) { put(`<path d="${rectD(x, y, w, h)}" fill="${svgEsc(st.fill)}"${common()}/>`); },
    strokeRect(x, y, w, h) { put(`<path d="${rectD(x, y, w, h)}" ${strokeAttr()}${common()}/>`); },
    clearRect() {},
    fillText(t, x, y) {
      t = trCanvas(String(t)); if (!t) return;
      const m = SVGFONT.exec(st.font) || [, '', '', '10', 'sans-serif'];
      const size = Number(m[3]) || 10;
      const anchor = st.align === 'center' ? 'middle' : (st.align === 'right' || st.align === 'end') ? 'end' : 'start';
      const dy = st.base === 'middle' ? size * 0.35 : st.base === 'top' || st.base === 'hanging' ? size * 0.8 : 0;
      put(`<text x="${svgN(x)}" y="${svgN(y + dy)}" font-family="${svgEsc(m[4])}" font-size="${svgN(size)}"` +
        (m[1] ? ` font-weight="${m[1]}"` : '') + (m[2] ? ` font-style="${m[2]}"` : '') +
        ` text-anchor="${anchor}" fill="${svgEsc(st.fill)}"${common()}>${svgEsc(t)}</text>`);
    },
    strokeText(t, x, y) { this.fillText(t, x, y); },
    drawImage(img, ...a) {
      let sx = 0, sy = 0, sw, sh, dx, dy, dw, dh;
      const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
      if (a.length <= 2) { dx = a[0] || 0; dy = a[1] || 0; dw = iw; dh = ih; }
      else if (a.length === 4) { dx = a[0]; dy = a[1]; dw = a[2]; dh = a[3]; }
      else { sx = a[0]; sy = a[1]; sw = a[2]; sh = a[3]; dx = a[4]; dy = a[5]; dw = a[6]; dh = a[7]; }
      let url = '';
      try {
        if (sw != null) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(sw)); c.height = Math.max(1, Math.round(sh));
          c.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height); url = c.toDataURL('image/png'); }
        else if (img.toDataURL) url = img.toDataURL('image/png');
        else { const c = document.createElement('canvas'); c.width = iw; c.height = ih; c.getContext('2d').drawImage(img, 0, 0); url = c.toDataURL('image/png'); }
      } catch (e) { return; }
      put(`<image x="${svgN(dx)}" y="${svgN(dy)}" width="${svgN(dw)}" height="${svgN(dh)}" href="${url}" preserveAspectRatio="none"${common()}/>`);
    },
    createLinearGradient() { return {addColorStop() {}}; },
    toSVG(bg) {
      return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" ` +
        `width="${svgN(W)}" height="${svgN(H)}" viewBox="0 0 ${svgN(W)} ${svgN(H)}">` +
        (defs.length ? `<defs>${defs.join('')}</defs>` : '') +
        `<rect width="${svgN(W)}" height="${svgN(H)}" fill="${bg || '#ffffff'}"/>` + body.join('') + '</svg>';
    }
  };
  return ctx;
}

/* ---------- knoppenbalk onder een tekening ----------
   Elk element met data-picbar="<sleutel>" krijgt dezelfde knoppen. */
function picBar(key) {
  return `<button type="button" data-png="${key}">PNG</button>` +
    `<button type="button" data-svg="${key}">SVG</button>` +
    `<button type="button" data-copy="${key}">Kopieer afbeelding</button>` +
    `<button type="button" data-picprint="${key}">Afdrukken</button>`;
}
const picName = k => safeName((PNGNAME[k] && $('#' + PNGNAME[k]) ? $('#' + PNGNAME[k]).value : '') || 'schema');
const picCv = k => { const c = $('#' + k + '-cv'); return c && c._p ? c : null; };
function picPNG(k, scale) { const c = picCv(k); if (!c) return null;
  const o = document.createElement('canvas'); pRender(o, c._p.W, c._p.H, c._p.draw, scale || 3); return o; }
document.addEventListener('click', e => {
  const sv = e.target.closest('[data-svg]');
  if (sv) { const c = picCv(sv.dataset.svg); if (!c) return;
    try { const r = svgRec(c._p.W, c._p.H); c._p.draw(r, c._p.W, c._p.H);
      saveBlob(picName(sv.dataset.svg) + '.svg', new Blob([r.toSVG()], {type: 'image/svg+xml'})).catch(() => {}); }
    catch (err) { alertBox(trPlain('Deze tekening kan niet als SVG worden opgeslagen; gebruik PNG.')); }
    return; }
  const cp = e.target.closest('[data-copy]');
  if (cp) { const o = picPNG(cp.dataset.copy, 2); if (!o) return;
    o.toBlob(bl => { if (!bl) return;
      const ok = () => flashBtn(cp, trPlain('Gekopieerd'));
      try { navigator.clipboard.write([new ClipboardItem({'image/png': bl})]).then(ok)
        .catch(() => alertBox(trPlain('Kopiëren lukte niet in deze browser; gebruik PNG.'))); }
      catch (err) { alertBox(trPlain('Kopiëren lukte niet in deze browser; gebruik PNG.')); } }, 'image/png');
    return; }
  const pr = e.target.closest('[data-picprint]');
  if (pr) { const o = picPNG(pr.dataset.picprint, 3); if (!o) return;
    const t = esc(PNGNAME[pr.dataset.picprint] && $('#' + PNGNAME[pr.dataset.picprint]) ? $('#' + PNGNAME[pr.dataset.picprint]).value : '');
    rpPrint(`<!doctype html><meta charset="utf-8"><title>${t}</title><style>@page{margin:14mm}body{margin:0;font:13px system-ui}img{max-width:100%;height:auto}</style><img src="${o.toDataURL('image/png')}">`); }
});
$$('[data-picbar]').forEach(b => { b.innerHTML = picBar(b.dataset.picbar); });

/* ---------- buizenrek: gekleurde buizen met label en volume ----------
   tubes = [{n:'naam', v:volume in µL, c:'#kleur', sub:'tweede regel'}]
   Geeft de hoogte terug die is gebruikt, zodat de aanroeper het canvas kan maten. */
function pRackH(rows) { return 26 + rows * 146; }
function pRack(x, X, Y, W, tubes, opts) {
  opts = opts || {};
  const per = Math.max(1, Math.min(opts.per || 10, tubes.length || 1));
  const rows = Math.ceil(tubes.length / per), cw = W / per, th = 78, tw = Math.min(34, cw * 0.46);
  for (let r = 0; r < rows; r++) {
    const part = tubes.slice(r * per, (r + 1) * per), Yr = Y + r * 146;
    /* het rek zelf: de buizen steken er aan de onderkant doorheen, zoals in een echt rek */
    x.fillStyle = '#eef1f4'; x.strokeStyle = PCOL.line; x.lineWidth = 1.2;
    x.beginPath(); x.roundRect(X, Yr + 24, cw * part.length, th * 0.48, 6); x.fill(); x.stroke();
    part.forEach((t, i) => {
      const cx = X + cw * i + cw / 2, col = /^#[0-9a-f]{3,8}$/i.test(t.c || '') ? t.c : PCOL.acc;
      const full = Math.max(0, Math.min(1, (t.f == null ? 0.55 : t.f)));
      pTube(x, cx, Yr + 8, th, tw, full, 0.75, col);
      x.textAlign = 'center'; x.textBaseline = 'alphabetic';
      x.fillStyle = PCOL.ink; x.font = '600 11.5px ' + PFONT();
      const room = cw - 6, words = trCanvas(String(t.n || '')).split(' ');
      let line = '', ly = Yr + th + 26, lines = 0;
      words.forEach(w => { const t2 = (line + ' ' + w).trim();
        if (x.measureText(uv(t2)).width > room && line) { if (lines < 1) { x.fillText(uv(line), cx, ly); ly += 13; lines++; line = w; } else line = t2; }
        else line = t2; });
      if (line) { let r2 = line; while (r2.length > 1 && x.measureText(uv(r2 + '…')).width > room) r2 = r2.slice(0, -1);
        x.fillText(uv(r2 === line ? line : r2 + '…'), cx, ly); ly += 14; }
      if (t.v != null && isFinite(t.v)) { x.fillStyle = PCOL.acc; x.font = '600 11.5px ' + PFONT(); x.fillText(vol(t.v), cx, ly); ly += 13; }
      if (t.sub) { x.fillStyle = PCOL.muted; x.font = '10.5px ' + PFONT(); x.fillText(t.sub, cx, ly); }
    });
  }
  return pRackH(rows);
}
