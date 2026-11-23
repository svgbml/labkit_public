/* Een Sanger-trace tekenen (S150): de vier kanalen op een canvas, met decimatie zodat er nooit
   meer dan twee punten per pixel getekend worden (#332): per pixelkolom het minimum en het
   maximum van de scanpunten die erin vallen. Zo blijft zoomen en schuiven vloeiend over een
   read van 1000+ basen (16 000+ scanpunten per kanaal).
   Kleuren zoals in de gangbare viewers (Chromas, SnapGene): A groen, C blauw, G zwart, T rood. */

export const DYE = {A: '#1a9641', C: '#2166ac', G: '#1f2933', T: '#d7301f'};

/* de punten [px, waarde] van kanaal tr voor het venster x0, spp over w pixels (px 0 = x0): ingezoomd elk scanpunt,
   uitgezoomd per pixelkolom het minimum en het maximum. Gebruikt door canvas en SVG. */
export function chanPoints(tr, x0, spp, w) {
  const pts = [];
  if (spp <= 1) {
    const s0 = Math.max(0, Math.floor(x0)), s1 = Math.min(tr.length - 1, Math.ceil(x0 + w * spp));
    for (let s = s0; s <= s1; s++) pts.push([(s - x0) / spp, tr[s]]);
  } else {
    for (let c = 0; c < w; c++) {
      const s0 = Math.max(0, Math.floor(x0 + c * spp)), s1 = Math.min(tr.length, Math.floor(x0 + (c + 1) * spp));
      if (s1 <= s0) continue;
      let lo = tr[s0], hi = lo;
      for (let s = s0 + 1; s < s1; s++) { const v = tr[s]; if (v < lo) lo = v; else if (v > hi) hi = v; }
      pts.push([c, lo]); if (hi !== lo) pts.push([c, hi]);
    }
  }
  return pts;
}

/* teken kanaal tr tussen scan x0 en x0 + w·spp in een vak (x, y, w, h); ymax = hoogste waarde */
function channel(ctx, tr, x0, spp, x, y, w, h, ymax) {
  const Y = v => y + h - Math.max(0, Math.min(1, v / ymax)) * h;
  ctx.beginPath();
  chanPoints(tr, x0, spp, w).forEach(([px, v], i) => i ? ctx.lineTo(x + px, Y(v)) : ctx.moveTo(x + px, Y(v)));
  ctx.stroke();
}

/* hoogste waarde van de vier kanalen in [s0, s1) */
export function traceMax(traces, s0, s1) {
  let m = 1;
  for (const tr of Object.values(traces)) {
    const e = Math.min(tr.length, Math.ceil(s1));
    for (let s = Math.max(0, Math.floor(s0)); s < e; s++) if (tr[s] > m) m = tr[s];
  }
  return m;
}

/* het venster: x0 (eerste scanpunt links) en spp (scanpunten per pixel) in een vak (x, y, w, h);
   hide = kanalen die uit staan; scale = vaste ymax, anders de hoogste piek in het venster */
export function drawTraces(ctx, traces, view, box, hide = {}, scale = 0) {
  const {x, y, w, h} = box, ymax = scale || traceMax(traces, view.x0, view.x0 + w * view.spp) * 1.05;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.lineWidth = 1.2; ctx.lineJoin = 'round';
  for (const b of 'GATC') {
    if (!traces[b] || hide[b]) continue;
    ctx.strokeStyle = DYE[b];
    channel(ctx, traces[b], view.x0, view.spp, x, y, w, h, ymax);
  }
  ctx.restore();
  return ymax;
}

/* het overzicht: de hele read in een smalle strook, met het zichtbare venster als kader */
export function drawOverview(ctx, traces, scans, view, viewW, box) {
  const {x, y, w, h} = box, spp = scans / w;
  ctx.fillStyle = '#f4f5f7'; ctx.fillRect(x, y, w, h);
  ctx.save(); ctx.globalAlpha = 0.75;
  drawTraces(ctx, traces, {x0: 0, spp}, box, {}, traceMax(traces, 0, scans) * 1.05);
  ctx.restore();
  const vx = x + view.x0 / spp, vw = Math.max(3, viewW * view.spp / spp);
  ctx.fillStyle = 'rgba(21,101,192,0.12)'; ctx.fillRect(vx, y, vw, h);
  ctx.strokeStyle = '#1565c0'; ctx.lineWidth = 1.5; ctx.strokeRect(vx + 0.5, y + 0.5, vw - 1, h - 1);
}

/* houd het venster binnen de read; spp tussen 0,1 (ingezoomd) en de hele read op het scherm */
export function clampView(view, scans, w) {
  const spp = Math.min(Math.max(view.spp, 0.1), Math.max(0.1, scans / w));
  const x0 = Math.min(Math.max(view.x0, 0), Math.max(0, scans - w * spp));
  return {x0, spp};
}
