/* ================= REMMINGSMODELLEN (S102) =================
   Vier modellen voor enzymremming, globaal gefit op alle punten (gedeelde Vmax en Km) met lmfit uit
   fit.js, vergeleken met AICc en Akaike-gewichten. Zuivere functies; lmfit is een globale naam
   (src/lib/fit.js), net als in de rest van src/lib.
   Bronnen: Copeland, Enzymes (2e dr., Wiley 2000) hfst. 8; Burnham & Anderson 2002 (AICc). */

/* elk model als schijnbare Vmax en Km bij remmerconcentratie I, zodat v = V·S/(K+S) en 1/v = (K/V)·(1/S) + 1/V */
export const MODELS = [
  {id: 'comp', name: 'Competitief', pn: ['Vmax', 'Km', 'Ki'],
    app: (p, I) => ({V: p[0], K: p[1] * (1 + I / p[2])})},
  {id: 'unc', name: 'Oncompetitief', pn: ['Vmax', 'Km', 'Ki'],
    app: (p, I) => ({V: p[0] / (1 + I / p[2]), K: p[1] / (1 + I / p[2])})},
  {id: 'non', name: 'Niet-competitief', pn: ['Vmax', 'Km', 'Ki'],
    app: (p, I) => ({V: p[0] / (1 + I / p[2]), K: p[1]})},
  {id: 'mix', name: 'Gemengd', pn: ['Vmax', 'Km', 'Ki', 'αKi'],
    app: (p, I) => ({V: p[0] / (1 + I / p[3]), K: p[1] * (1 + I / p[2]) / (1 + I / p[3])})}
];

export const rate = (m, p, s, I) => { const a = m.app(p, I); return a.V * s / (a.K + s); };

/* AICc = n·ln(RSS/n) + 2k + 2k(k+1)/(n−k−1) */
export const aicc = (n, k, rss) => n * Math.log(rss / n) + 2 * k + 2 * k * (k + 1) / (n - k - 1);

/* Akaike-gewichten w_i = exp(−Δ_i/2) / Σ */
export function weights(a) {
  const mn = Math.min(...a), e = a.map(x => Math.exp(-(x - mn) / 2)), s = e.reduce((u, v) => u + v, 0);
  return e.map(x => x / s);
}

/* S, V, I: gelijke lijsten. Geeft de modellen met p, se (in de eenheden van de gegevens), rss, aicc, w,
   en best (index). Null bij te weinig punten (n ≥ 6 voor het gemengde model) of zonder remmer. */
export function inhibFit(S, V, I) {
  const n = S.length;
  if (n < 6 || !I.some(x => x > 0)) return null;
  const x = S.map((s, i) => [s, I[i]]), mv = V.reduce((a, b) => a + b, 0) / n;
  const pos = I.filter(i => i > 0), i0 = pos.reduce((a, b) => a + b, 0) / pos.length;
  const s0 = S.slice().sort((a, b) => a - b)[n >> 1];
  /* Km, Ki en αKi gaan als logaritme in de fit, zodat ze positief blijven */
  const nat = q => [q[0], ...q.slice(1).map(Math.exp)];
  const fit = (m, q0) => {
    const r = lmfit((xi, q) => rate(m, nat(q), xi[0], xi[1]), q0, x, V, 500), p = nat(r.p);
    return {p, se: r.se.map((e, j) => j ? p[j] * e : e), q: r.p, rss: r.sse};
  };
  const q3 = [Math.max(...V) * 1.2, Math.log(s0), Math.log(i0)];
  const res = MODELS.map(m => m.id === 'mix' ? null : fit(m, q3));
  res[3] = fit(MODELS[3], [...res[0].q, res[0].q[2] + 2]); /* start vanaf competitief: het gemengde model bevat het */
  /* shortcut: precisie-ondergrens 1e-6 × gemiddelde v op de RSS, anders wint bij ruisloze data het model met de
     toevallig kleinste afrondfout; bij echte data (ruis ≫ 1e-6) heeft dit geen effect */
  const floor = n * (1e-6 * mv) ** 2;
  const models = MODELS.map((m, j) => ({id: m.id, name: m.name, pn: m.pn, k: m.pn.length, p: res[j].p, se: res[j].se,
    rss: res[j].rss, aicc: aicc(n, m.pn.length, Math.max(res[j].rss, floor))}));
  const w = weights(models.map(m => m.aicc));
  models.forEach((m, j) => { m.w = w[j]; });
  return {n, models, best: w.indexOf(Math.max(...w))};
}
