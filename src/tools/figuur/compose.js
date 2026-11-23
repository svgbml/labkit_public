/* ================= FIGUURMAKER: SAMENSTELLEN EN EXPORTEREN (S90) =================
   figLayout rekent de plaats van elk paneel uit in beeldpunten bij de gekozen breedte (mm) en dpi:
   gelijke kolommen, elke rij zo hoog als het hoogste paneel erin (bij de kolombreedte; een lege rij valt weg), panelen
   passend en horizontaal gecentreerd, verticaal boven of midden. figCanvas tekent dat met de letters,
   figSvg maakt er een SVG van met de eigen SVG van elk paneel erin (vector blijft vector) en
   figPdf een PDF van één pagina met de figuur als afbeelding. */
import {expose} from '../../lib/global.js';

export const MM = 25.4;
const mmPx = (mm, dpi) => Math.round(mm / MM * dpi);
const LET = {A: i => String.fromCharCode(65 + i), a: i => String.fromCharCode(97 + i), pA: i => '(' + String.fromCharCode(65 + i) + ')', Ad: i => String.fromCharCode(65 + i) + '.'};

/* o = {cols, rows, cells: [{w, h}|null…], wmm, dpi, gapmm, va: 'top'|'mid', let: 'A'|'a'|'pA'|'Ad'|'', lpt} */
export function figLayout(o) {
  const W = mmPx(o.wmm, o.dpi), gap = mmPx(o.gapmm, o.dpi), lh = o.let ? Math.round(o.lpt / 72 * o.dpi * 1.25) : 0;
  const cw = (W - gap * (o.cols - 1)) / o.cols, rowsH = [];
  for (let r = 0; r < o.rows; r++) { let h = 0; for (let c = 0; c < o.cols; c++) { const e = o.cells[r * o.cols + c]; if (e) h = Math.max(h, cw * e.h / e.w); } rowsH.push(h ? Math.round(h) + lh : 0); }   /* een lege rij valt weg */
  const out = []; let y = 0;
  for (let r = 0; r < o.rows; r++) {
    for (let c = 0; c < o.cols; c++) {
      const i = r * o.cols + c, e = o.cells[i], x0 = Math.round(c * (cw + gap)), bw = Math.round(cw), bh = rowsH[r] - lh;
      let iw = 0, ih = 0, ix = x0, iy = y + lh;
      if (e) { const s = Math.min(bw / e.w, bh / e.h); iw = Math.round(e.w * s); ih = Math.round(e.h * s); ix = x0 + Math.round((bw - iw) / 2); iy = y + lh + (o.va === 'mid' ? Math.round((bh - ih) / 2) : 0); }
      out.push({i, x: x0, y, w: bw, h: rowsH[r], ix, iy, iw, ih, letter: e && o.let ? LET[o.let](out.filter(q => q.letter).length) : ''});
    }
    if (rowsH[r]) y += rowsH[r] + gap;
  }
  return {W, H: Math.max(1, y - (y ? gap : 0)), cells: out, lpx: Math.round(o.lpt / 72 * o.dpi)};
}

/* bitmaps: [ImageBitmap|null…] in dezelfde volgorde als de cellen */
export function figCanvas(L, bitmaps) {
  const c = document.createElement('canvas'); c.width = L.W; c.height = L.H; const x = c.getContext('2d');
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, L.W, L.H); x.imageSmoothingQuality = 'high';
  L.cells.forEach(q => { const b = bitmaps[q.i]; if (b && q.iw) x.drawImage(b, q.ix, q.iy, q.iw, q.ih);
    if (q.letter) { x.fillStyle = '#000'; x.font = `700 ${L.lpx}px Arial, Helvetica, sans-serif`; x.textBaseline = 'top'; x.textAlign = 'left'; x.fillText(q.letter, q.x, q.y); } });
  return c;
}

/* svgs: [string|null…]; zonder eigen SVG gaat de PNG (dataURL in pngs) erin */
export function figSvg(L, svgs, pngs, wmm) {
  const e = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const parts = L.cells.map(q => {
    let s = '';
    const inner = svgs[q.i];
    if (inner && q.iw) {
      let t = String(inner).replace(/^\s*<\?xml[^>]*>\s*/, '').replace(/<!DOCTYPE[^>]*>\s*/i, '');
      const m = t.match(/<svg\b[^>]*>/); if (m) {
        const tag = m[0], w = +(tag.match(/\swidth="([\d.]+)/) || [])[1], h = +(tag.match(/\sheight="([\d.]+)/) || [])[1];
        let nt = tag.replace(/\s(width|height|x|y|preserveAspectRatio)="[^"]*"/g, '');
        if (!/viewBox=/.test(nt) && w && h) nt = nt.replace('<svg', `<svg viewBox="0 0 ${w} ${h}"`);
        nt = nt.replace('<svg', `<svg x="${q.ix}" y="${q.iy}" width="${q.iw}" height="${q.ih}" preserveAspectRatio="xMidYMid meet"`);
        s = t.replace(tag, nt);
      }
    } else if (pngs[q.i] && q.iw) s = `<image x="${q.ix}" y="${q.iy}" width="${q.iw}" height="${q.ih}" href="${pngs[q.i]}"/>`;
    if (q.letter) s += `<text x="${q.x}" y="${q.y}" dominant-baseline="hanging" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${L.lpx}">${e(q.letter)}</text>`;
    return s;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${wmm}mm" height="${+(wmm * L.H / L.W).toFixed(2)}mm" viewBox="0 0 ${L.W} ${L.H}">\n<rect width="${L.W}" height="${L.H}" fill="#ffffff"/>\n${parts.join('\n')}\n</svg>`;
}

/* PDF 1.4, één pagina zo groot als de figuur (in punten), met de figuur als RGB-afbeelding:
   FlateDecode via CompressionStream('deflate') (zlib, wat PDF verwacht), anders JPEG (DCTDecode) */
export async function figPdf(canvas, wmm) {
  const W = canvas.width, H = canvas.height, wpt = wmm / MM * 72, hpt = wpt * H / W, enc = new TextEncoder();
  let data, filter;
  if (typeof CompressionStream === 'function') {
    const px = canvas.getContext('2d').getImageData(0, 0, W, H).data, rgb = new Uint8Array(W * H * 3);
    for (let i = 0, j = 0; i < px.length; i += 4, j += 3) { rgb[j] = px[i]; rgb[j + 1] = px[i + 1]; rgb[j + 2] = px[i + 2]; }
    data = new Uint8Array(await new Response(new Blob([rgb]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer()); filter = 'FlateDecode';
  } else { data = new Uint8Array(await (await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.95))).arrayBuffer()); filter = 'DCTDecode'; }
  const content = `q ${wpt.toFixed(2)} 0 0 ${hpt.toFixed(2)} 0 0 cm /Im0 Do Q`;
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${wpt.toFixed(2)} ${hpt.toFixed(2)}] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>`,
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    null];
  const chunks = [enc.encode('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')], offs = []; let pos = chunks[0].length;
  const push = u => { chunks.push(u); pos += u.length; };
  objs.forEach((o, k) => {
    offs.push(pos);
    if (o) push(enc.encode(`${k + 1} 0 obj\n${o}\nendobj\n`));
    else { push(enc.encode(`${k + 1} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${W} /Height ${H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /${filter} /Length ${data.length} >>\nstream\n`)); push(data); push(enc.encode('\nendstream\nendobj\n')); }
  });
  const xref = pos;
  push(enc.encode(`xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('') + `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`));
  return new Blob(chunks, {type: 'application/pdf'});
}

expose({figLayout, figCanvas, figSvg, figPdf});
