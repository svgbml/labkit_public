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

/* Waarschuwingen per base (S156, #310). Heuristieken, geen gepubliceerde grenzen; elke regel staat hieronder. */
export const FLAGS = ['weak', 'sat', 'broad', 'blob', 'N', 'slip'];
const median = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[s.length >> 1] : 0; };

/* traces, peaks, seq (calls na bewerking), het = hetCalls(...) → per base een lijst codes uit FLAGS */
export function flags(traces, peaks, seq, het) {
  const n = Math.min(peaks.length, seq.length, het.length), tops = het.slice(0, n).map(x => x.h[x.top]), med = median(tops), out = [];
  const run = new Array(n).fill(0);   // lengte van de gelijke ACGT-basen die op i eindigt
  for (let i = 0; i < n; i++) run[i] = 'ACGT'.includes(seq[i]) ? (i && seq[i] === seq[i - 1] ? run[i - 1] + 1 : 1) : 0;
  for (let i = 0; i < n; i++) {
    const f = [], p = het[i], H = tops[i], t = traces[p.top] || [], c = peaks[i];
    const sp = n < 2 ? 12 : i === 0 ? peaks[1] - peaks[0] : i === n - 1 ? c - peaks[i - 1] : (peaks[i + 1] - peaks[i - 1]) / 2, r = Math.max(1, Math.round(sp / 4));
    if (H < 0.1 * med) f.push('weak');   // weak: hoogste piek onder 10% van de mediaan van alle hoogste pieken in de read
    let flat = 0, best = 0;   // sat: ≥ 3 opeenvolgende scanpunten op het maximum van het kanaal (±¼ basafstand), of het 16-bit plafond (32767)
    for (let s = Math.max(0, c - r); s <= c + r && s < t.length; s++) { flat = t[s] === H ? flat + 1 : 0; best = Math.max(best, flat); }
    if (H > 0 && (best >= 3 || H >= 32767)) f.push('sat');
    let a = c, b = c;   // broad: breedte op halve hoogte van de hoogste piek > 1,5 × de lokale basafstand (zoeken tot 3 × basafstand)
    while (a > 0 && c - a < 3 * sp && t[a] > H / 2) a--;
    while (b < t.length - 1 && b - c < 3 * sp && t[b] > H / 2) b++;
    const broad = H > 0 && b - a > 1.5 * sp;
    if (broad) f.push('broad');
    if (broad && i < 120 && H > 1.5 * med) f.push('blob');   // blob: brede piek, 1,5 × zo hoog als de mediaan, in de eerste 120 basen (ongebruikte dye terminators lopen rond base 70–120)
    if (seq[i] === 'N') f.push('N');   // N: de call is N
    if (p.code) for (let j = Math.max(0, i - 3); j < i; j++) if (run[j] >= 6) { f.push('slip'); break; }   // slip: heterozygote call ≤ 3 basen na een run van ≥ 6 gelijke basen
    out.push(f);
  }
  return out;
}
