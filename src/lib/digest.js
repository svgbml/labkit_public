/* In-silico restrictiedigestie (S45).
   Per enzym: herkenningsplaats (IUPAC), knipplaats op de bovenste streng (c1) en op de onderste
   (c2), beide geteld vanaf het begin van de plaats op de bovenste streng (REBASE-notatie, zoals
   NEBcutter); de incubatietemperatuur en de aanbevolen NEB-buffer (HF-versie waar die bestaat).
   Het type uiteinde volgt uit c1 en c2: c1 < c2 geeft een 5′-overhang, c1 > c2 een 3′-overhang.
   Een plaats die niet palindroom is (BsaI, BsmBI) wordt ook op de onderste streng gezocht.
   Gecontroleerd tegen Biopython Bio.Restriction (REBASE) op pFA6a-kanMX6: tests/validate.py. */
import {revcomp} from './primer.js';

export const ENZ = {
  AatII: ['GACGTC', 5, 1], AflII: ['CTTAAG', 1, 5], AgeI: ['ACCGGT', 1, 5], ApaI: ['GGGCCC', 5, 1, 25],
  AscI: ['GGCGCGCC', 2, 6], AvrII: ['CCTAGG', 1, 5], BamHI: ['GGATCC', 1, 5], BglII: ['AGATCT', 1, 5, 37, 'NEBuffer r3.1'],
  BsaI: ['GGTCTC', 7, 11], BsmBI: ['CGTCTC', 7, 11, 55, 'NEBuffer r3.1'], BsrGI: ['TGTACA', 1, 5],
  BstBI: ['TTCGAA', 2, 4, 65], ClaI: ['ATCGAT', 2, 4], DraI: ['TTTAAA', 3, 3], EagI: ['CGGCCG', 1, 5],
  EcoRI: ['GAATTC', 1, 5], EcoRV: ['GATATC', 3, 3], FseI: ['GGCCGGCC', 6, 2], HincII: ['GTYRAC', 3, 3],
  HindIII: ['AAGCTT', 1, 5], HpaI: ['GTTAAC', 3, 3], KpnI: ['GGTACC', 5, 1], MfeI: ['CAATTG', 1, 5],
  MluI: ['ACGCGT', 1, 5], NarI: ['GGCGCC', 2, 4], NcoI: ['CCATGG', 1, 5], NdeI: ['CATATG', 2, 4],
  NheI: ['GCTAGC', 1, 5], NotI: ['GCGGCCGC', 2, 6], NruI: ['TCGCGA', 3, 3], NsiI: ['ATGCAT', 5, 1],
  PacI: ['TTAATTAA', 5, 3], PmeI: ['GTTTAAAC', 4, 4], PstI: ['CTGCAG', 5, 1], PvuI: ['CGATCG', 4, 2],
  PvuII: ['CAGCTG', 3, 3], SacI: ['GAGCTC', 5, 1], SacII: ['CCGCGG', 4, 2], SalI: ['GTCGAC', 1, 5],
  SbfI: ['CCTGCAGG', 6, 2], ScaI: ['AGTACT', 3, 3], SfiI: ['GGCCNNNNNGGCC', 8, 5, 50], SmaI: ['CCCGGG', 3, 3, 25],
  SpeI: ['ACTAGT', 1, 5], SphI: ['GCATGC', 5, 1], StuI: ['AGGCCT', 3, 3], XbaI: ['TCTAGA', 1, 5],
  XhoI: ['CTCGAG', 1, 5], XmaI: ['CCCGGG', 1, 5], XmnI: ['GAANNNNTTC', 5, 5]
};

/* type uiteinde, temperatuur en buffer; een onbekend enzym ("ander enzym") heeft geen plaats */
export function enzInfo(name) {
  const e = ENZ[name];
  if (!e) return {end: 'zie productinformatie', temp: 37, buf: ''};
  const [, c1, c2, temp = 37, buf = 'rCutSmart'] = e;
  return {end: c1 < c2 ? '5′-overhang' : c1 > c2 ? '3′-overhang' : 'stomp (blunt)', ov: Math.abs(c2 - c1), temp, buf};
}

const IUPAC = {A: 'A', C: 'C', G: 'G', T: 'T', R: '[AG]', Y: '[CT]', S: '[CG]', W: '[AT]', K: '[GT]', M: '[AC]',
  B: '[CGT]', D: '[AGT]', H: '[ACT]', V: '[ACG]', N: '[ACGT]'};
const IUC = {A: 'T', C: 'G', G: 'C', T: 'A', R: 'Y', Y: 'R', S: 'S', W: 'W', K: 'M', M: 'K', B: 'V', V: 'B', D: 'H', H: 'D', N: 'N'};
const rcIupac = s => s.split('').reverse().map(b => IUC[b]).join('');

/* Knipplaatsen op de bovenste streng (0-based: er wordt geknipt vóór deze base). */
export function cuts(seq, name, circular) {
  const e = ENZ[name]; if (!e) return [];
  const [site, c1, c2] = e, n = site.length, L = seq.length, out = new Set();
  const ext = circular ? seq + seq.slice(0, n - 1) : seq;
  const scan = (pat, cutAt) => {
    const re = new RegExp('(?=' + pat.split('').map(b => IUPAC[b]).join('') + ')', 'g');
    for (let m; (m = re.exec(ext)) && m.index < L; re.lastIndex = m.index + 1) {
      const p = cutAt(m.index);
      if (circular) out.add(((p % L) + L) % L);
      else if (p > 0 && p < L) out.add(p);
    }
  };
  scan(site, i => i + c1);
  const rc = rcIupac(site);
  if (rc !== site) scan(rc, i => i + n - c2);
  return [...out].sort((a, b) => a - b);
}

/* Fragmenten na knippen met alle gekozen enzymen. Elk fragment: grootte, begin en einde
   (1-based, op het template) en het enzym aan elke kant (null = einde van een lineair stuk). */
export function digest(seq, names, circular) {
  const L = seq.length, at = new Map();
  names.forEach(nm => cuts(seq, nm, circular).forEach(p => at.set(p, at.has(p) ? at.get(p) + '/' + nm : nm)));
  const P = [...at.keys()].sort((a, b) => a - b), out = [];
  if (!P.length) return [{size: L, from: 1, to: L, left: null, right: null, uncut: true}];
  if (circular) P.forEach((p, i) => {
    const q = i + 1 < P.length ? P[i + 1] : P[0] + L;
    out.push({size: q - p, from: p + 1, to: ((q - 1) % L) + 1, left: at.get(p), right: at.get(q % L)});
  });
  else [0, ...P].forEach((p, i, a) => {
    const q = i + 1 < a.length ? a[i + 1] : L;
    out.push({size: q - p, from: p + 1, to: q, left: p ? at.get(p) : null, right: q < L ? at.get(q) : null});
  });
  return out;
}
