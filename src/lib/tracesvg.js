/* Een stuk Sanger-trace als SVG-tekst (S154): voor de export van het venster en voor de afdruk in rijen van 60 basen.
   Zelfde decimatie als het canvas (chanPoints). Vaste indeling: positienummers, baseletters, dan de trace. */
import {DYE, chanPoints, traceMax} from './tracedraw.js';

const NUMY = 9, LETY = 23, TOP = 28;

/* o: {traces, peaks, seq, view {x0, spp}, w (px), th (hoogte trace), keep {start, end} (1-gebaseerd) of null, ymax (optioneel)} */
export function traceSvg(o) {
  const {traces, peaks, seq, view, w, th} = o, H = TOP + th + 2, n = Math.min(peaks.length, seq.length);
  const ymax = o.ymax || traceMax(traces, view.x0, view.x0 + w * view.spp) * 1.05;
  const X = s => (s - view.x0) / view.spp, f = v => +v.toFixed(1);
  let g = '';
  if (o.keep && n) {
    const k = o.keep, L = k.start > 1 ? X((peaks[k.start - 2] + peaks[k.start - 1]) / 2) : -1, R = k.end < n ? X((peaks[k.end - 1] + peaks[k.end]) / 2) : w + 1;
    if (L > 0) g += `<rect x="0" y="0" width="${f(Math.min(L, w))}" height="${H}" fill="#5f6b7a" opacity=".18"/>`;
    if (R < w) g += `<rect x="${f(Math.max(R, 0))}" y="0" width="${f(w - Math.max(R, 0))}" height="${H}" fill="#5f6b7a" opacity=".18"/>`;
  }
  for (const b of 'GATC') {
    if (!traces[b]) continue;
    const pts = chanPoints(traces[b], view.x0, view.spp, w).map(([px, v]) => f(px) + ',' + f(TOP + th - Math.max(0, Math.min(1, v / ymax)) * th)).join(' ');
    g += `<polyline points="${pts}" fill="none" stroke="${DYE[b]}" stroke-width="1.2" stroke-linejoin="round"/>`;
  }
  const lab = view.spp > 0 && n > 1 && (peaks[n - 1] - peaks[0]) / (n - 1) / view.spp >= 7;
  for (let i = 0; i < n; i++) {
    const px = X(peaks[i]);
    if (px < -6 || px > w + 6) continue;
    if (lab) g += `<text x="${f(px)}" y="${LETY}" text-anchor="middle" font-size="11" font-weight="bold" fill="${DYE[seq[i]] || '#8a94a3'}">${esc(seq[i])}</text>`;
    if ((i + 1) % 10 === 0 && px > 8 && px < w - 8) g += `<text x="${f(px)}" y="${NUMY}" text-anchor="middle" font-size="9" fill="#5f6b7a">${i + 1}</text>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${H}" viewBox="0 0 ${w} ${H}" font-family="system-ui,Arial,sans-serif"><rect width="${w}" height="${H}" fill="#fff"/>${g}</svg>`;
}
