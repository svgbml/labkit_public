/* De plasmidekaart tekenen (S46): een ring met de kenmerken als pijlen, de knipplaatsen
   erbuiten en de primers erbinnen. De tekenfunctie krijgt een gewone tekencontext, zodat de
   gedeelde exportbalk (PNG/SVG/kopiëren/afdrukken, src/legacy/nt/01_pic.js) hem ook als vector
   kan opnemen. Positie 1 staat bovenaan en de nummering loopt met de klok mee, zoals in de
   gangbare kaartprogramma's. */

export const FEATCOL = {
  CDS: '#1558b0', gene: '#1558b0', promoter: '#0f7b4f', regulatory: '#0f7b4f',
  terminator: '#b23a2e', rep_origin: '#7a3fa0', oriT: '#7a3fa0', protein_bind: '#b7791f',
  primer_bind: '#8a93a0', tRNA: '#0f7b4f', rRNA: '#0f7b4f', ncRNA: '#0f7b4f'
};
export const FEATDEF = '#5f6b7a';
const col = f => FEATCOL[f.type] || FEATDEF;

/* een leesbare stapgrootte voor de schaalverdeling: ongeveer acht streepjes op de ring */
export function niceStep(len) {
  const want = len / 8;
  return [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000]
    .find(s => s >= want) || 250000;
}

/* labels buiten de ring: per kant op volgorde van hoogte, met een minimale tussenruimte */
export function layoutLabels(items, cx, cy, R, H, lineH) {
  const side = {l: [], r: []};
  items.forEach(it => {
    const s = Math.cos(it.a) >= 0 ? 'r' : 'l';
    side[s].push({...it, x0: cx + Math.cos(it.a) * R, y0: cy + Math.sin(it.a) * R, y: cy + Math.sin(it.a) * R});
  });
  Object.values(side).forEach(arr => {
    arr.sort((p, q) => p.y - q.y);
    let prev = -1e9;
    arr.forEach(p => { p.y = Math.max(p.y, prev + lineH); prev = p.y; });   /* naar beneden duwen */
    const over = arr.length ? arr[arr.length - 1].y - (H - 10) : 0;
    if (over > 0) { let next = H - 10; for (let i = arr.length - 1; i >= 0; i--) { p2(arr, i, next); next = arr[i].y - lineH; } }
    let top = 12;
    arr.forEach(p => { p.y = Math.max(p.y, top); top = p.y + lineH; });     /* en niet boven de rand */
  });
  return side;
}
const p2 = (arr, i, next) => { arr[i].y = Math.min(arr[i].y, next); };

const short = (s, n) => (String(s).length > n ? String(s).slice(0, n - 1) + '…' : String(s));

export function drawPlasmid(x, W, H, d, opt) {
  const o = opt || {}, PC = o.PCOL, font = o.font || 'sans-serif';
  const uv = o.uv || (s => s), nl = o.nl || String;
  const len = d.len, cx = W / 2, cy = H / 2 + 4;
  const R = Math.max(60, Math.min(W, H) / 2 - 92);
  const ang = p => -Math.PI / 2 + 2 * Math.PI * ((p - 1) / len);
  const pt = (p, r) => [cx + Math.cos(ang(p)) * r, cy + Math.sin(ang(p)) * r];
  /* hoe ver een kenmerk met de klok mee loopt; een kenmerk over het nulpunt telt door */
  const sweep = f => ((f.end - f.start + len) % len) + 1;

  /* ---- de ring ---- */
  x.lineWidth = 2; x.strokeStyle = PC.line;
  x.beginPath();
  if (d.circular) x.arc(cx, cy, R, 0, Math.PI * 2);
  else x.arc(cx, cy, R, ang(1) + 0.045, ang(len) - 0.045);
  x.stroke();
  if (!d.circular) {                                   /* lineair: dwarsstreepjes op de uiteinden */
    x.lineWidth = 2.4;
    [[1, 0.045], [len, -0.045]].forEach(([p, off]) => {
      const a = ang(p) + off;
      x.beginPath();
      x.moveTo(cx + Math.cos(a) * (R - 7), cy + Math.sin(a) * (R - 7));
      x.lineTo(cx + Math.cos(a) * (R + 7), cy + Math.sin(a) * (R + 7));
      x.stroke();
    });
  }

  /* ---- schaalverdeling ---- */
  const step = niceStep(len);
  x.font = '10.5px ' + font; x.textAlign = 'center'; x.textBaseline = 'middle';
  for (let p = step; p < len; p += step) {
    const a = ang(p);
    x.strokeStyle = PC.line; x.lineWidth = 1;
    x.beginPath();
    x.moveTo(cx + Math.cos(a) * (R - 5), cy + Math.sin(a) * (R - 5));
    x.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    x.stroke();
    x.fillStyle = PC.muted;
    x.fillText(nl(p), cx + Math.cos(a) * (R - 16), cy + Math.sin(a) * (R - 16));
  }

  /* ---- kenmerken als pijlen op de ring ---- */
  const arrow = (p, r, dir, c, size) => {
    const a = ang(p), tx = -Math.sin(a) * dir, ty = Math.cos(a) * dir;
    const [bx, by] = [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    x.fillStyle = c; x.beginPath();
    x.moveTo(bx + tx * size, by + ty * size);
    x.lineTo(bx - tx * size * 0.4 + Math.cos(a) * size * 0.85, by - ty * size * 0.4 + Math.sin(a) * size * 0.85);
    x.lineTo(bx - tx * size * 0.4 - Math.cos(a) * size * 0.85, by - ty * size * 0.4 - Math.sin(a) * size * 0.85);
    x.closePath(); x.fillStyle = c; x.fill();
  };
  d.feats.forEach(f => {
    const c = col(f), sw = sweep(f), head = Math.min(sw * 0.4, len * 0.012);
    const a0 = ang(f.start), a1 = ang(f.start + sw - 1);
    x.strokeStyle = c; x.lineWidth = 9; x.globalAlpha = 0.85;
    x.beginPath();
    x.arc(cx, cy, R, f.strand < 0 ? ang(f.start + head) : a0, f.strand < 0 ? a1 : ang(f.start + sw - 1 - head));
    x.stroke(); x.globalAlpha = 1;
    arrow(f.strand < 0 ? f.start : f.start + sw - 1, R, f.strand < 0 ? -1 : 1, c, 7.5);
  });

  /* ---- primers: dunne pijlen binnen de ring ---- */
  const PR = R - 17;
  d.primers.forEach(p => {
    const c = PC.warn, n = Math.max(1, p.len || 20);
    const from = p.strand < 0 ? p.pos - n + 1 : p.pos;
    x.strokeStyle = c; x.lineWidth = 2.6;
    x.beginPath(); x.arc(cx, cy, PR, ang(from), ang(from + n - 1)); x.stroke();
    arrow(p.strand < 0 ? from : from + n - 1, PR, p.strand < 0 ? -1 : 1, c, 5);
  });

  /* ---- knipplaatsen en labels buiten de ring ---- */
  const items = [];
  d.sites.forEach(s => items.push({a: ang(s.pos), text: uv(s.name) + ' (' + nl(s.pos) + ')',
    col: PC.ink, bold: false, tick: true}));
  d.feats.forEach(f => items.push({a: ang(f.start + (sweep(f) - 1) / 2), text: short(uv(f.name), 26),
    col: col(f), bold: true, tick: false}));
  const side = layoutLabels(items, cx, cy, R + 4, H, 13);
  ['l', 'r'].forEach(s => {
    const dir = s === 'r' ? 1 : -1;
    side[s].forEach(it => {
      const xa = cx + dir * (R + 20), xb = cx + dir * (R + 27);
      x.strokeStyle = it.tick ? PC.ink : it.col; x.lineWidth = it.tick ? 1.2 : 1;
      x.globalAlpha = it.tick ? 1 : 0.55;
      x.beginPath();
      x.moveTo(it.x0, it.y0);
      if (it.tick) { const a = Math.atan2(it.y0 - cy, it.x0 - cx);
        x.lineTo(cx + Math.cos(a) * (R + 11), cy + Math.sin(a) * (R + 11)); }
      x.lineTo(xa, it.y); x.lineTo(xb, it.y);
      x.stroke(); x.globalAlpha = 1;
      x.fillStyle = it.col; x.textAlign = s === 'r' ? 'left' : 'right';
      x.font = (it.bold ? '600 ' : '') + '11px ' + font;
      x.fillText(it.text, xb + dir * 3, it.y);
    });
  });

  /* ---- het midden ---- */
  x.textAlign = 'center'; x.fillStyle = PC.ink; x.font = '600 15px ' + font;
  if (d.name) x.fillText(short(uv(d.name), 22), cx, cy - 8);
  x.fillStyle = PC.muted; x.font = '12.5px ' + font;
  x.fillText(nl(len) + ' bp', cx, cy + (d.name ? 11 : 0));
}
