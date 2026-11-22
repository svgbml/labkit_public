/* Heterozygoten in een Sanger-trace (S155, #306/#307): per piekpositie de hoogte van de vier
   kanalen (maximum binnen ±¼ basafstand rond de piek), de verhouding tweede/hoogste kanaal, en
   boven de drempel de IUPAC-code van die twee basen (piekverhouding zoals PolyPhred en Tracy). */

const IUPAC2 = {AG: 'R', CT: 'Y', CG: 'S', AT: 'W', GT: 'K', AC: 'M'};
export const pair = (a, b) => IUPAC2[[a, b].sort().join('')];

/* {h: {A,C,G,T}, ratio, top, sec} voor base i; traces = {A: [...], C: [...], ...} */
export function peakAt(traces, peaks, i) {
  const n = peaks.length, d = n < 2 ? 12 : i === 0 ? peaks[1] - peaks[0] : i === n - 1 ? peaks[i] - peaks[i - 1] : (peaks[i + 1] - peaks[i - 1]) / 2;
  const r = Math.max(1, Math.round(d / 4)), h = {};
  for (const c of 'ACGT') {
    const t = traces[c] || [];
    let m = 0;
    for (let s = Math.max(0, peaks[i] - r); s <= peaks[i] + r && s < t.length; s++) if (t[s] > m) m = t[s];
    h[c] = m;
  }
  const o = 'ACGT'.split('').sort((a, b) => h[b] - h[a]);
  return {h, top: o[0], sec: o[1], ratio: h[o[0]] ? h[o[1]] / h[o[0]] : 0};
}

/* per base {h, ratio, top, sec, code}; code = IUPAC-code als ratio ≥ thr, anders null */
export function hetCalls(traces, peaks, n, thr) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const p = peakAt(traces, peaks, i);
    p.code = p.ratio >= thr && p.ratio > 0 ? pair(p.top, p.sec) : null;
    out.push(p);
  }
  return out;
}
