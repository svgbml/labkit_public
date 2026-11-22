/* Secundaire structuur van een primer: dimeren en haarspelden, met ΔG37 uit de nearest-neighbor-
   parameters van SantaLucia (1998, tabel 2) en de lusstraf voor een haarspeld van SantaLucia &
   Hicks (2004). Grenzen volgens Premier Biosoft (PCR primer design guidelines).
   shortcut: alleen aaneengesloten Watson-Crick-paren (geen G·T, geen bulges of interne lussen);
   genoeg om een primer te keuren, upgrade naar een vouwalgoritme als het om lange oligo's gaat. */

/* ΔG37 (kcal/mol) per stapel, sleutel = dinucleotide 5'→3' van de bovenste streng */
const DG = {AA: -1.00, TT: -1.00, AT: -0.88, TA: -0.58, CA: -1.45, TG: -1.45, GT: -1.44, AC: -1.44,
  CT: -1.28, AG: -1.28, GA: -1.30, TC: -1.30, CG: -2.17, GC: -2.24, GG: -1.84, CC: -1.84};
const INIT = 1.96; /* initiatie van een duplex van twee strengen */
const COMP = {A: 'T', T: 'A', G: 'C', C: 'G'};
const LOOP = [0, 0, 0, 3.5, 3.5, 3.3, 4.0, 4.2, 4.3, 4.5];
const loopDG = n => (n < LOOP.length ? LOOP[n] : 4.5 + 2.44 * 1.987e-3 * 310.15 * Math.log(n / 9));
const stacks = (s, from, len) => { let g = 0; for (let k = 0; k < len - 1; k++) g += DG[s.slice(from + k, from + k + 2)]; return g; };

export const LIMITS = {dimer3: -5, dimer: -6, hairpin3: -2, hairpin: -3};
const lim = (x, hp) => (hp ? (x.three ? LIMITS.hairpin3 : LIMITS.hairpin) : (x.three ? LIMITS.dimer3 : LIMITS.dimer));
/* ernstiger = dichter bij (of voorbij) de grens; een 3'-structuur heeft een strengere grens */
const worse = (x, best, hp) => !best || x.dg - lim(x, hp) < best.dg - lim(best, hp);
export const clean = s => String(s || '').toUpperCase().replace(/[^A-Z]/g, '');

/* sterkste duplex van a (5'→3') tegen b (antiparallel); three = het 3'-uiteinde van a of b doet mee */
export function dimer(a, b) {
  a = clean(a); b = clean(b);
  if (/[^ACGT]/.test(a + b)) return null;
  const r = b.split('').reverse().join(''); /* b van 3' naar 5' */
  let best = null;
  for (let off = -(r.length - 1); off < a.length; off++) {
    let run = 0;
    for (let i = Math.max(0, off); i <= Math.min(a.length, r.length + off); i++) {
      const j = i - off, pair = i < a.length && j < r.length && COMP[a[i]] === r[j];
      if (pair) { run++; continue; }
      if (run >= 3) {
        const st = i - run, dg = INIT + stacks(a, st, run);
        const three = i === a.length || st - off === 0;
        if (worse({dg, three}, best, false)) best = {dg, len: run, three};
      }
      run = 0;
    }
  }
  return best;
}

/* sterkste haarspeld: stam van ten minste 3 bp, lus van ten minste 3 nt */
export function hairpin(s) {
  s = clean(s); const N = s.length;
  if (/[^ACGT]/.test(s)) return null;
  let best = null;
  for (let i = 0; i < N; i++) for (let j = i + 4; j < N; j++) {
    for (let L = 1; i + L - 1 < j - L + 1 - 3 && COMP[s[i + L - 1]] === s[j - L + 1]; L++) {
      if (L < 3) continue;
      const dg = stacks(s, i, L) + loopDG(j - i - 2 * L + 1);
      const x = {dg, len: L, three: j === N - 1};
      if (worse(x, best, true)) best = x;
    }
  }
  return best;
}

/* 'warn' bij of voorbij de grens, 'ok' daaronder, null zonder structuur */
export function verdict(x, isHairpin) {
  return x ? (x.dg <= lim(x, isHairpin) ? 'warn' : 'ok') : null;
}
