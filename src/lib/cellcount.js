/* Cellen tellen op een microscoopfoto (S60), levend/dood op kleur (trypaanblauw).
   countCells(data, w, h, sens) krijgt RGBA-pixels en geeft [{x, y, r, n, dead}]:
   1. afwijking van de lokale achtergrond (boxblur via een integraalbeeld), in helderheid en in blauw;
   2. drempel op de ruis (mediaan + sens × 1,4826 × MAD);
   3. lange horizontale/verticale lopen weg: de lijnen van de telkamer;
   4. samenhangende vlekken; heel kleine (vuil) vallen af, een vlek van k keer de mediane grootte telt als k cellen;
   5. dood als de vlek duidelijk blauwer is dan de achtergrond eromheen.
   shortcut: geen watershed, dus aaneengeklitte cellen worden op oppervlak geschat; tik om te corrigeren. */
/* gemiddelde over een vierkant van (2r+1)² via een integraalbeeld */
function boxBlur(a, w, h, r) {
  const I = new Float64Array((w + 1) * (h + 1)), o = new Float32Array(w * h);
  for (let y = 0; y < h; y++) { let s = 0; for (let x = 0; x < w; x++) { s += a[y * w + x]; I[(y + 1) * (w + 1) + x + 1] = I[y * (w + 1) + x + 1] + s; } }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const x0 = Math.max(0, x - r), x1 = Math.min(w, x + r + 1), y0 = Math.max(0, y - r), y1 = Math.min(h, y + r + 1);
    o[y * w + x] = (I[y1 * (w + 1) + x1] - I[y0 * (w + 1) + x1] - I[y1 * (w + 1) + x0] + I[y0 * (w + 1) + x0]) / ((x1 - x0) * (y1 - y0));
  }
  return o;
}

const median = a => { const s = Float32Array.from(a).sort(); return s.length ? s[s.length >> 1] : 0; };

function countCells(data, w, h, sens = 6) {
  const N = w * h, g0 = new Float32Array(N), b0 = new Float32Array(N);
  for (let i = 0; i < N; i++) { const R = data[4 * i], G = data[4 * i + 1], B = data[4 * i + 2]; g0[i] = 0.299 * R + 0.587 * G + 0.114 * B; b0[i] = B - (R + G) / 2; }
  const g = boxBlur(g0, w, h, 1), bl = boxBlur(b0, w, h, 1);   // 3×3 tegen de ruis
  const rad = Math.max(8, Math.round(Math.min(w, h) / 16)), bgG = boxBlur(g, w, h, rad), bgB = boxBlur(bl, w, h, rad);
  const sc = new Float32Array(N);
  for (let i = 0; i < N; i++) sc[i] = Math.max(Math.abs(g[i] - bgG[i]), bl[i] - bgB[i]);
  const step = Math.max(1, Math.floor(N / 20000)), smp = []; for (let i = 0; i < N; i += step) smp.push(sc[i]);
  const md = median(smp), mad = median(smp.map(v => Math.abs(v - md))), T = Math.max(10, md + sens * 1.4826 * mad);
  const m = new Uint8Array(N); for (let i = 0; i < N; i++) m[i] = sc[i] > T ? 1 : 0;
  /* lijnen van de telkamer: lopen langer dan een achtste van de foto */
  const clearRuns = (len, cnt, at) => { for (let k = 0; k < cnt; k++) { let s = -1; for (let j = 0; j <= len; j++) { const on = j < len && m[at(k, j)]; if (on && s < 0) s = j; else if (!on && s >= 0) { if (j - s > len / 8) for (let q = s; q < j; q++) m[at(k, q)] = 2; s = -1; } } } };
  clearRuns(w, h, (y, x) => y * w + x); clearRuns(h, w, (x, y) => y * w + x);
  /* een rij of kolom die voor een kwart masker is, is een lijn met ruisgaten */
  /* een rij of kolom die voor een kwart masker is, is een lijn met ruisgaten; 2 px ernaast (de onscherpe rand) gaan mee */
  const lineRow = [], lineCol = [];
  for (let y = 0; y < h; y++) { let c = 0; for (let x = 0; x < w; x++) c += m[y * w + x] ? 1 : 0; if (c > w / 4) lineRow.push(y); }
  for (let x = 0; x < w; x++) { let c = 0; for (let y = 0; y < h; y++) c += m[y * w + x] ? 1 : 0; if (c > h / 4) lineCol.push(x); }
  for (const r of lineRow) for (let y = Math.max(0, r - 2); y <= Math.min(h - 1, r + 2); y++) for (let x = 0; x < w; x++) m[y * w + x] = 2;
  for (const c of lineCol) for (let x = Math.max(0, c - 2); x <= Math.min(w - 1, c + 2); x++) for (let y = 0; y < h; y++) m[y * w + x] = 2;
  for (let i = 0; i < N; i++) if (m[i] === 2) m[i] = 0;
  /* een pixel ophogen sluit de ring van een levende cel (donkere rand, heldere kern) */
  const d = new Uint8Array(N);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x; d[i] = m[i] || m[i - 1] || m[i + 1] || m[i - w] || m[i + w] ? 1 : 0; }
  /* samenhangende vlekken (8-buren) */
  const lab = new Int32Array(N), blobs = [], st = [];
  for (let i = 0; i < N; i++) {
    if (!d[i] || lab[i]) continue;
    const b = {a: 0, sx: 0, sy: 0, sb: 0, x0: w, x1: 0, y0: h, y1: 0}; lab[i] = blobs.length + 1; st.push(i);
    while (st.length) {
      const p = st.pop(), x = p % w, y = (p - x) / w;
      b.a++; b.sx += x; b.sy += y; b.sb += bl[p] - bgB[p];
      if (x < b.x0) b.x0 = x; if (x > b.x1) b.x1 = x; if (y < b.y0) b.y0 = y; if (y > b.y1) b.y1 = y;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const X = x + dx, Y = y + dy, q = Y * w + X;
        if (X >= 0 && Y >= 0 && X < w && Y < h && d[q] && !lab[q]) { lab[q] = lab[i]; st.push(q); }
      }
    }
    blobs.push(b);
  }
  let big = blobs.filter(b => b.a >= 12);
  const ma = median(big.filter(b => b.a >= median(big.map(b => b.a)) / 2).map(b => b.a)) || 1, rm = Math.sqrt(ma / Math.PI);
  /* brokstukken (een cel die een kamerlijn kruist valt in tweeën): bij de vlek die er hoogstens 9 px naast ligt,
     als ze samen niet breder zijn dan 2,8 keer de straal en niet groter dan 1,6 cel */
  big.sort((a, b) => a.a - b.a);
  const gap = (a, b) => Math.max(a.x0 - b.x1, b.x0 - a.x1, a.y0 - b.y1, b.y0 - a.y1);
  for (const f of big) {
    if (!f.a || f.a >= ma) continue;
    let best = null, bd = 10;
    for (const o of big) { if (o === f || !o.a || o.a + f.a > 1.6 * ma) continue; const dd = gap(f, o); if (dd < bd && Math.max(o.x1, f.x1) - Math.min(o.x0, f.x0) < 2.8 * rm && Math.max(o.y1, f.y1) - Math.min(o.y0, f.y0) < 2.8 * rm) { bd = dd; best = o; } }
    if (best) { best.a += f.a; best.sx += f.sx; best.sy += f.sy; best.sb += f.sb; f.a = 0;
      best.x0 = Math.min(best.x0, f.x0); best.x1 = Math.max(best.x1, f.x1); best.y0 = Math.min(best.y0, f.y0); best.y1 = Math.max(best.y1, f.y1); }
  }
  return big.filter(b => b.a >= ma / 4).map(b => ({x: b.sx / b.a, y: b.sy / b.a, r: Math.sqrt(b.a / Math.PI) + 2,
    n: b.a > 1.6 * ma ? Math.round(b.a / ma) : 1, dead: b.sb / b.a > 12}));
}

export {countCells, boxBlur, median};
