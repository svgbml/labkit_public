/* Paarsgewijze uitlijning (S184, #357 #359): Needleman-Wunsch (globaal, 1970, J Mol Biol 48:443) en Smith-Waterman
   (lokaal, 1981, J Mol Biol 147:195) met affiene gaten volgens Gotoh (1982, J Mol Biol 162:705).
   Een gat van k posities kost open + (k − 1) · ext, zoals EMBOSS needle/water; open = ext is een lineaire gatstraf.
   Globaal: ook gaten aan de uiteinden kosten (zoals in Durbin e.a. 1998). Matrices: BLOSUM62, BLOSUM50, PAM250 (NCBI,
   zie submat.js) of DNA: gelijk +5, verschil −4, N tegen iets −2 (de A/C/G/T/N-waarden van EMBOSS EDNAFULL).
   Een eigen motor voor twee sequenties; geen vervanging voor Clustal Omega. */
import {MATRICES} from './submat.js';

export const PW_MATS = ['BLOSUM62', 'BLOSUM50', 'PAM250', 'DNA'];
const dna = (x, y) => x === 'N' || y === 'N' ? -2 : x === y ? 5 : -4;
function scorer(name) {
  if (name === 'DNA') return (x, y) => dna(x === 'U' ? 'T' : x, y === 'U' ? 'T' : y);
  const M = MATRICES[name] || MATRICES.BLOSUM62;
  return (x, y) => (M[x] || M.X)[y] ?? M.X.X;
}
const clean = s => String(s || '').toUpperCase().replace(/[^A-Z*]/g, '');

/* {score, a, b (uitgelijnd, met -), a0, a1, b0, b1 (0-gebaseerd, eind exclusief), len, same, sim, gaps} */
export function pairAlign(x, y, o = {}) {
  const a = clean(x), b = clean(y), n = a.length, m = b.length, local = o.mode === 'local';
  const sub = scorer(o.matrix), go = +o.open, ge = +o.ext, NEG = -Infinity, W = m + 1;
  /* scores per rij (rollend), wijzers voor de hele matrix: 0 = start, 1 = M, 2 = X (gat in b), 3 = Y (gat in a) */
  const pM = new Uint8Array((n + 1) * W), pX = new Uint8Array((n + 1) * W), pY = new Uint8Array((n + 1) * W);
  let M0 = new Float64Array(W).fill(NEG), X0 = new Float64Array(W).fill(NEG), Y0 = new Float64Array(W).fill(NEG);
  M0[0] = 0;
  if (!local) for (let j = 1; j <= m; j++) { Y0[j] = -(go + (j - 1) * ge); pY[j] = j > 1 ? 3 : 1; }
  let best = local ? 0 : NEG, bi = 0, bj = 0;
  const pick = (v1, v2, v3) => v1 >= v2 && v1 >= v3 ? 1 : v2 >= v3 ? 2 : 3;
  for (let i = 1; i <= n; i++) {
    const M1 = new Float64Array(W).fill(NEG), X1 = new Float64Array(W).fill(NEG), Y1 = new Float64Array(W).fill(NEG), r = i * W;
    if (!local) { X1[0] = -(go + (i - 1) * ge); pX[r] = i > 1 ? 2 : 1; }
    for (let j = 1; j <= m; j++) {
      /* M: a[i] tegenover b[j] */
      const t = pick(M0[j - 1], X0[j - 1], Y0[j - 1]), pv = t === 1 ? M0[j - 1] : t === 2 ? X0[j - 1] : Y0[j - 1];
      if (local && !(pv > 0)) { M1[j] = sub(a[i - 1], b[j - 1]); pM[r + j] = 0; }
      else { M1[j] = pv + sub(a[i - 1], b[j - 1]); pM[r + j] = t; }
      /* X: a[i] tegenover een gat, uit de rij erboven */
      const xo = Math.max(M0[j], Y0[j]) - go, xe = X0[j] - ge;
      if (xe >= xo) { X1[j] = xe; pX[r + j] = 2; } else { X1[j] = xo; pX[r + j] = M0[j] >= Y0[j] ? 1 : 3; }
      /* Y: b[j] tegenover een gat, uit de cel links */
      const yo = Math.max(M1[j - 1], X1[j - 1]) - go, ye = Y1[j - 1] - ge;
      if (ye >= yo) { Y1[j] = ye; pY[r + j] = 3; } else { Y1[j] = yo; pY[r + j] = M1[j - 1] >= X1[j - 1] ? 1 : 2; }
      if (local && M1[j] > best) { best = M1[j]; bi = i; bj = j; }
    }
    M0 = M1; X0 = X1; Y0 = Y1;
  }
  let st;
  if (!local) { bi = n; bj = m; st = pick(M0[m], X0[m], Y0[m]); best = Math.max(M0[m], X0[m], Y0[m]); if (n === 0 && m === 0) best = 0; }
  else st = best > 0 ? 1 : 0;
  /* terug door de wijzers */
  const A = [], B = [];
  let i = bi, j = bj;
  while (st && (i > 0 || j > 0)) {
    const c = i * W + j;
    if (st === 1) { if (!i || !j) break; A.push(a[i - 1]); B.push(b[j - 1]); st = pM[c]; i--; j--; }
    else if (st === 2) { A.push(a[i - 1]); B.push('-'); st = pX[c]; i--; }
    else { A.push('-'); B.push(b[j - 1]); st = pY[c]; j--; }
  }
  const sa = A.reverse().join(''), sb = B.reverse().join('');
  let same = 0, sim = 0, gaps = 0;
  for (let k = 0; k < sa.length; k++) {
    if (sa[k] === '-' || sb[k] === '-') gaps++;
    else { if (sa[k] === sb[k]) same++; if (sub(sa[k], sb[k]) > 0) sim++; }
  }
  return {score: best, a: sa, b: sb, a0: i, a1: bi, b0: j, b1: bj, len: sa.length, same, sim, gaps};
}

/* de score van een gegeven uitlijning met hetzelfde schema (controle en uitleg) */
export function pairScore(x, y, o) {
  const sub = scorer(o.matrix);
  let s = 0, ga = 0, gb = 0;
  for (let k = 0; k < x.length; k++) {
    const p = x[k], q = y[k];
    if (p === '-' && q === '-') continue;
    if (p === '-') { s -= gb ? o.ext : o.open; gb = 1; ga = 0; }
    else if (q === '-') { s -= ga ? o.ext : o.open; ga = 1; gb = 0; }
    else { s += sub(p, q); ga = gb = 0; }
  }
  return s;
}
