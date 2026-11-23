/* Figuur van een uitlijning als SVG of PNG (S188): zuivere functies, geen DOM.

   alnFigure(a, o): a is het model, o = {from, to (kolommen, 1-based, beide inclusief), per (residuen per regel),
   order (rijindexen), seqs (wat elke rij toont; standaard a.seqs), cls(i, c) → klassenaam of '', fill(klasse) → CSS-kleur,
   cons (de * : . -regel of ''), title}. Geeft {W, H, rects: [x,y,w,h,fill], texts: [x,y,s,opts], ...}.
   Eén cel is CW × CH pixels; de namen staan links in elk blok, de liniaal erboven, de conservering eronder. */
export const FIG = {CW: 11, CH: 16, RH: 18, FS: 13, PAD: 12};
export function alnFigure(a, o) {
  const {CW, CH, RH, FS, PAD} = FIG, n = a.names.length;
  const from = Math.max(1, Math.round(o.from) || 1), to = Math.min(a.len, Math.round(o.to) || a.len);
  const per = Math.max(10, Math.min(500, Math.round(o.per) || 60)), order = o.order || a.names.map((_, i) => i), seqs = o.seqs || a.seqs;
  const names = order.map(i => a.names[i]), nameW = Math.min(30, Math.max(4, ...names.map(s => s.length))) * CW * 0.7 + 10;
  const titleH = o.title ? 22 : 0, rows = n + (o.cons ? 1 : 0), blockH = RH + rows * CH + 14;
  const f = {rects: [], texts: [], cell: {CW, CH, FS}, from, to, per, nameW: Math.round(nameW), title: o.title || ''};
  if (to < from || !n) return Object.assign(f, {W: 0, H: 0, blocks: 0});
  const blocks = Math.ceil((to - from + 1) / per);
  for (let b = 0; b < blocks; b++) {
    const c0 = from - 1 + b * per, c1 = Math.min(to, c0 + per), y0 = PAD + titleH + b * blockH, x0 = PAD + f.nameW;
    for (let c = Math.ceil((c0 + 1) / 10) * 10; c <= c1; c += 10) f.texts.push([x0 + (c - c0 - 0.5) * CW, y0 + RH - 6, String(c), {a: 'middle', s: 10, mute: 1}]);
    order.forEach((ri, k) => {
      const y = y0 + RH + k * CH, s = seqs[ri];
      f.texts.push([PAD, y + CH - 4, a.names[ri].length > 30 ? a.names[ri].slice(0, 29) + '…' : a.names[ri], {a: 'start', bold: 1}]);
      let c = c0;
      while (c < c1) {
        const k2 = o.cls ? o.cls(ri, c) : ''; let e = c + 1;
        while (e < c1 && (o.cls ? o.cls(ri, e) : '') === k2) e++;
        if (k2) f.rects.push([x0 + (c - c0) * CW, y, (e - c) * CW, CH, o.fill(k2)]);
        c = e;
      }
      f.texts.push([x0, y + CH - 4, s.slice(c0, c1), {a: 'start', n: c1 - c0, mono: 1}]);
    });
    if (o.cons) { const y = y0 + RH + n * CH; f.texts.push([PAD, y + CH - 4, o.consName || '', {a: 'start', mute: 1}], [x0, y + CH - 4, o.cons.padEnd(a.len).slice(c0, c1), {a: 'start', n: c1 - c0, mono: 1}]); }
  }
  f.W = Math.ceil(PAD * 2 + f.nameW + per * CW); f.H = PAD * 2 + titleH + blocks * blockH - 8; f.blocks = blocks;
  if (o.title) f.texts.push([PAD, PAD + 12, o.title, {a: 'start', bold: 1, s: 14}]);
  return f;
}
const X = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'})[c]);
/* de figuur als SVG-tekst; ink en bg zijn CSS-kleuren, muted voor de liniaal */
export function figSvg(f, ink = '#111', bg = '#fff', muted = '#666') {
  const {CW, FS} = f.cell, mono = 'Consolas, "DejaVu Sans Mono", Menlo, monospace', sans = 'system-ui, Arial, sans-serif';
  let o = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + f.W + ' ' + f.H + '" width="' + f.W + '" height="' + f.H + '">'
    + '<rect width="100%" height="100%" fill="' + bg + '"/>';
  for (const [x, y, w, h, c] of f.rects) o += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + X(c) + '"/>';
  for (const [x, y, s, p] of f.texts) {
    if (!s) continue;
    /* een residu per cel: elke letter krijgt zijn eigen x (het midden van de cel), zodat de tekst precies op de kleuren valt */
    const xs = p.mono ? Array.from({length: s.length}, (_, i) => +(x + (i + 0.5) * CW).toFixed(1)).join(' ') : x;
    o += '<text x="' + xs + '" y="' + y + '" fill="' + (p.mute ? muted : ink) + '" font-family="' + (p.mono ? mono : sans) + '" font-size="' + (p.s || FS) + '"'
      + (p.bold ? ' font-weight="600"' : '') + (p.a === 'middle' || p.mono ? ' text-anchor="middle"' : '') + ' xml:space="preserve">' + X(s) + '</text>';
  }
  return o + '</svg>';
}
/* dezelfde figuur op een canvas (PNG); schaal = pixels per eenheid */
export function figPaint(cv, f, scale, ink = '#111', bg = '#fff', muted = '#666') {
  const x = cv.getContext('2d'), {CW, FS} = f.cell;
  cv.width = Math.round(f.W * scale); cv.height = Math.round(f.H * scale);
  x.setTransform(scale, 0, 0, scale, 0, 0); x.fillStyle = bg; x.fillRect(0, 0, f.W, f.H);
  for (const [px, py, w, h, c] of f.rects) { x.fillStyle = c; x.fillRect(px, py, w, h); }
  for (const [px, py, s, p] of f.texts) {
    if (!s) continue;
    x.fillStyle = p.mute ? muted : ink; x.textAlign = p.a === 'middle' ? 'center' : 'left';
    x.font = (p.bold ? '600 ' : '') + (p.s || FS) + 'px ' + (p.mono ? 'Consolas, "DejaVu Sans Mono", Menlo, monospace' : 'system-ui, Arial, sans-serif');
    if (p.mono) { x.textAlign = 'center'; for (let i = 0; i < s.length; i++) x.fillText(s[i], px + (i + 0.5) * CW, py); }
    else x.fillText(s, px, py);
  }
}
