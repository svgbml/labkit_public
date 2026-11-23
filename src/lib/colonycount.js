/* Kolonies tellen op een foto van een petrischaal (S59). countColonies(data, w, h, {sens, minA})
   krijgt RGBA-pixels en geeft {dish: {x, y, r}, colonies: [{x, y, r, n}]}:
   1. de schaal: stralen vanuit het midden lopen over een vervaagd beeld tot de helderheid over een
      flink stuk afwijkt van de agar (de rand); een cirkel door de eindpunten, drie keer vanuit het nieuwe midden;
   2. alleen binnen de schaal min een randmarge (wand en reflecties tellen niet mee): afwijking van de
      lokale achtergrond, die alleen over de agar wordt gemiddeld; lichter én donkerder telt;
   3. drempel op de ruis (mediaan + sens × 1,4826 × MAD), samenhangende vlekken zoals in cellcount.js;
      spikkels onder minA px of een kwart van de mediane kolonie vallen af, een vlek van k keer de mediane
      grootte telt als k kolonies.
   shortcut: de schaal moet ongeveer in beeld gecentreerd zijn en de agar egaal; geen watershed, dus
   aaneengegroeide kolonies worden op oppervlak geschat; tik om te corrigeren. */
import {boxBlur, median} from './cellcount.js';

/* cirkel door punten (Kåsa): x² + y² = a·x + b·y + c, kleinste kwadraten, opgelost met Cramer */
function fitCircle(P) {
  let Sx = 0, Sy = 0, Sxx = 0, Syy = 0, Sxy = 0, Sz = 0, Sxz = 0, Syz = 0; const n = P.length;
  P.forEach(([x, y]) => { const z = x * x + y * y; Sx += x; Sy += y; Sxx += x * x; Syy += y * y; Sxy += x * y; Sz += z; Sxz += x * z; Syz += y * z; });
  const det3 = (m) => m[0] * (m[4] * m[8] - m[5] * m[7]) - m[1] * (m[3] * m[8] - m[5] * m[6]) + m[2] * (m[3] * m[7] - m[4] * m[6]);
  const M = [Sxx, Sxy, Sx, Sxy, Syy, Sy, Sx, Sy, n], r = [Sxz, Syz, Sz], D = det3(M);
  const col = (k) => det3(M.map((v, i) => (i % 3 === k ? r[(i / 3) | 0] : v))) / D;
  const A = col(0), B = col(1), C = col(2), x = A / 2, y = B / 2;
  return {x, y, r: Math.sqrt(C + x * x + y * y)};
}

/* de schaal: stralen tot ze over meer dan L px van de agar afwijken; een cirkel door de eindpunten */
function findDish(g, w, h) {
  const S = Math.min(w, h), L = Math.round(S / 25), K = 90;
  const at = (x, y) => g[Math.round(y) * w + Math.round(x)];
  let dish = {x: w / 2, y: h / 2, r: S / 2};
  for (let it = 0; it < 3; it++) {
    const {x: cx, y: cy} = dish, Q = [];
    for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) Q.push(at(Math.max(0, Math.min(w - 1, cx + i * S / 40)), Math.max(0, Math.min(h - 1, cy + j * S / 40))));
    const lev0 = median(Q), tol = Math.max(15, 0.15 * lev0), d = [];   // de agar rond het midden, niet één kolonie
    for (let k = 0; k < K; k++) {
      const c = Math.cos(2 * Math.PI * k / K), s = Math.sin(2 * Math.PI * k / K);
      /* een afwijking begint bij a; pas na 4 px agar is ze voorbij (een overgang die even langs het
         agarniveau komt, zoals wand → tafel, onderbreekt haar niet) */
      let lev = lev0, a = -1, ok = 0, q = 0;
      for (; ; q++) {
        const x = cx + q * c, y = cy + q * s;
        if (x < 0 || y < 0 || x > w - 1 || y > h - 1) break;
        const v = at(x, y);
        if (Math.abs(v - lev) > tol) { ok = 0; if (a < 0) a = q; if (q - a > L) break; }
        else if (++ok >= 4) { a = -1; lev += 0.05 * (v - lev); }   // het verloop over de agar volgen
      }
      d.push([a < 0 ? q : a, c, s]);
    }
    const R = median(d.map(v => v[0]));
    let P = d.filter(v => Math.abs(v[0] - R) < 0.2 * R).map(([q, c, s]) => [cx + q * c, cy + q * s]);
    /* een reflectie langs de wand of een groepje kolonies stopt een straal alleen te vroeg: punten die
       binnen de gepaste cirkel vallen eruit en opnieuw passen, zodat de buitenrand overblijft */
    for (let j = 0; j < 4 && P.length >= K / 4; j++) {
      dish = fitCircle(P);
      P = P.filter(([x, y]) => { const e = Math.hypot(x - dish.x, y - dish.y) - dish.r; return e > -3 && e < 0.1 * dish.r; });
    }
  }
  return dish;
}

function countColonies(data, w, h, {sens = 6, minA = 8} = {}) {
  const N = w * h, g0 = new Float32Array(N);
  for (let i = 0; i < N; i++) g0[i] = 0.299 * data[4 * i] + 0.587 * data[4 * i + 1] + 0.114 * data[4 * i + 2];
  const g = boxBlur(g0, w, h, 1);
  const dish = findDish(boxBlur(g, w, h, Math.max(2, Math.round(Math.min(w, h) / 200))), w, h);
  const rc = dish.r - Math.max(6, 0.05 * dish.r), inD = new Float32Array(N), gm = new Float32Array(N);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; if ((x - dish.x) ** 2 + (y - dish.y) ** 2 < rc * rc) { inD[i] = 1; gm[i] = g[i]; }
  }
  /* achtergrond = gemiddelde over alleen de agar in de buurt, dus de rand trekt hem niet scheef */
  const rad = Math.max(8, Math.round(dish.r / 10)), bs = boxBlur(gm, w, h, rad), bn = boxBlur(inD, w, h, rad);
  const sc = new Float32Array(N), smp = [];
  for (let i = 0; i < N; i++) if (inD[i]) sc[i] = Math.abs(g[i] - bs[i] / bn[i]);
  const step = Math.max(1, Math.floor(N / 40000));
  for (let i = 0; i < N; i += step) if (inD[i]) smp.push(sc[i]);
  const md = median(smp), mad = median(smp.map(v => Math.abs(v - md))), T = Math.max(10, md + sens * 1.4826 * mad);
  /* samenhangende vlekken (8-buren) */
  const lab = new Uint8Array(N), blobs = [], st = [];
  for (let i = 0; i < N; i++) {
    if (!inD[i] || sc[i] <= T || lab[i]) continue;
    const b = {a: 0, sx: 0, sy: 0}; lab[i] = 1; st.push(i);
    while (st.length) {
      const p = st.pop(), x = p % w, y = (p - x) / w;
      b.a++; b.sx += x; b.sy += y;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const X = x + dx, Y = y + dy, q = Y * w + X;
        if (X >= 0 && Y >= 0 && X < w && Y < h && inD[q] && sc[q] > T && !lab[q]) { lab[q] = 1; st.push(q); }
      }
    }
    if (b.a >= minA) blobs.push(b);
  }
  const ma = median(blobs.filter(b => b.a >= median(blobs.map(b => b.a)) / 2).map(b => b.a)) || 1;
  const colonies = blobs.filter(b => b.a >= ma / 4).map(b => ({x: b.sx / b.a, y: b.sy / b.a, r: Math.sqrt(b.a / Math.PI) + 2,
    n: b.a > 1.6 * ma ? Math.round(b.a / ma) : 1}));
  return {dish, colonies};
}

export {countColonies};
