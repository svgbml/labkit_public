/* Rekenwerk op een geplakte DNA-sequentie: in-silico PCR (S44) en in-silico digestie (S45).
   Posities zijn 0-gebaseerd op de bovenste streng; de componenten tonen ze 1-gebaseerd. */

const COMP = {A: 'T', T: 'A', G: 'C', C: 'G', N: 'N', R: 'Y', Y: 'R', S: 'S', W: 'W', K: 'M', M: 'K', B: 'V', V: 'B', D: 'H', H: 'D'};
export const rc = s => s.split('').reverse().map(b => COMP[b] || 'N').join('');

/* een geplakte sequentie: FASTA-kop weg, alleen letters, hoofdletters */
export const cleanSeq = s => String(s || '').replace(/^>.*$/gm, '').toUpperCase().replace(/[^A-Z]/g, '');

/* ---------- in-silico PCR ---------- */
/* Een primer bindt waar zijn 3′-uiteinde (de laatste ANCHOR basen) precies past; het 5′-deel mag
   afwijken (een staart met een knipplaats). De mismatches in dat deel worden geteld.
   shortcut: geen mismatches in het 3′-anker; een primer met een fout vlak bij 3′ wordt gemist. */
export const ANCHOR = 15;
const MAXPROD = 20000;

function sites(t, p, name, circ) {
  const L = p.length, a = Math.min(ANCHOR, L), n = t.length, out = [];
  const tt = circ ? t + t : t;
  const mm = (pp, at) => { /* mismatches van het 5′-deel; buiten de template telt als mismatch */
    let k = 0; for (let i = 0; i < pp.length; i++) { const x = at + i, b = circ ? tt[((x % n) + n) % n] : t[x]; if (b !== pp[i]) k++; } return k; };
  const fAnc = p.slice(L - a), rAnc = rc(p).slice(0, a);
  for (let i = 0; i < n; i++) {
    if (tt.startsWith(fAnc, i) && (circ || i + a <= n)) {
      const start = i + a - L; /* 5′-uiteinde van de primer op de bovenste streng */
      out.push({p: name, dir: 1, start, end3: i + a - 1, mm: mm(p.slice(0, L - a), start)});
    }
    if (tt.startsWith(rAnc, i) && (circ || i + a <= n)) {
      const end = i + L; /* exclusief: 5′-uiteinde van de primer zit op end − 1 */
      out.push({p: name, dir: -1, start3: i, end, mm: mm(rc(p).slice(a), i + a)});
    }
  }
  return out;
}

/* producten van elk paar sites dat naar elkaar toe wijst (ook F+F of R+R: dat zijn ook producten) */
export function insilicoPcr(template, fw, rv, circ) {
  const t = cleanSeq(template), F = cleanSeq(fw), R = cleanSeq(rv), n = t.length;
  if (!n || F.length < 10 || R.length < 10) return null;
  const all = [...sites(t, F, 'F', circ), ...(F === R ? [] : sites(t, R, 'R', circ))];
  const fwd = all.filter(s => s.dir === 1), rev = all.filter(s => s.dir === -1);
  const prods = [];
  fwd.forEach(f => rev.forEach(r => {
    let start3 = r.start3, end = r.end;
    if (circ && start3 <= f.end3) { start3 += n; end += n; }
    if (start3 <= f.end3) return;
    const size = end - f.start;
    if (size > MAXPROD || (circ && size > n + F.length + R.length)) return;
    prods.push({a: f.p, b: r.p, from: f.start, to: end, size, mm: f.mm + r.mm});
  }));
  prods.sort((x, y) => x.mm - y.mm || x.size - y.size);
  return {n, sites: all, prods};
}

/* ---------- in-silico digestie ---------- */
/* [herkenningsplaats, knip bovenste streng, knip onderste streng] in posities vanaf het begin van
   de plaats (NEB, productinformatie en REBASE). Optimum 37 °C tenzij anders vermeld. */
export const ENZ = {
  AatII: ['GACGTC', 5, 1], AflII: ['CTTAAG', 1, 5], AgeI: ['ACCGGT', 1, 5], AluI: ['AGCT', 2, 2],
  ApaI: ['GGGCCC', 5, 1, 25], AscI: ['GGCGCGCC', 2, 6], AvrII: ['CCTAGG', 1, 5], BamHI: ['GGATCC', 1, 5],
  BglI: ['GCCNNNNNGGC', 7, 4], BglII: ['AGATCT', 1, 5], BsaI: ['GGTCTC', 7, 11], BsiWI: ['CGTACG', 1, 5, 55],
  BsmBI: ['CGTCTC', 7, 11, 55], BspHI: ['TCATGA', 1, 5], BsrGI: ['TGTACA', 1, 5], ClaI: ['ATCGAT', 2, 4],
  DraI: ['TTTAAA', 3, 3], EcoRI: ['GAATTC', 1, 5], EcoRV: ['GATATC', 3, 3], FseI: ['GGCCGGCC', 6, 2],
  HaeIII: ['GGCC', 2, 2], HindIII: ['AAGCTT', 1, 5], HpaI: ['GTTAAC', 3, 3], KpnI: ['GGTACC', 5, 1],
  MboI: ['GATC', 0, 4], MfeI: ['CAATTG', 1, 5], MluI: ['ACGCGT', 1, 5], MspI: ['CCGG', 1, 3],
  NcoI: ['CCATGG', 1, 5], NdeI: ['CATATG', 2, 4], NheI: ['GCTAGC', 1, 5], NotI: ['GCGGCCGC', 2, 6],
  NruI: ['TCGCGA', 3, 3], NsiI: ['ATGCAT', 5, 1], PacI: ['TTAATTAA', 5, 3], PciI: ['ACATGT', 1, 5],
  PmeI: ['GTTTAAAC', 4, 4], PstI: ['CTGCAG', 5, 1], PvuI: ['CGATCG', 4, 2], PvuII: ['CAGCTG', 3, 3],
  SacI: ['GAGCTC', 5, 1], SacII: ['CCGCGG', 4, 2], SalI: ['GTCGAC', 1, 5], SbfI: ['CCTGCAGG', 6, 2],
  ScaI: ['AGTACT', 3, 3], SfiI: ['GGCCNNNNNGGCC', 8, 5, 50], SmaI: ['CCCGGG', 3, 3, 25], SpeI: ['ACTAGT', 1, 5],
  SphI: ['GCATGC', 5, 1], StuI: ['AGGCCT', 3, 3], SwaI: ['ATTTAAAT', 4, 4, 25], TaqI: ['TCGA', 1, 3, 65],
  XbaI: ['TCTAGA', 1, 5], XhoI: ['CTCGAG', 1, 5], XmaI: ['CCCGGG', 1, 5]
};
export const enzTemp = e => (ENZ[e] && ENZ[e][3]) || 37;
export function enzEnd(e) {
  const [, top, bot] = ENZ[e];
  return top === bot ? 'stomp (blunt)' : top < bot ? '5′-overhang' : '3′-overhang';
}

const IUPAC = {N: '[ACGT]', R: '[AG]', Y: '[CT]', S: '[CG]', W: '[AT]', K: '[GT]', M: '[AC]', B: '[CGT]', D: '[AGT]', H: '[ACT]', V: '[ACG]'};
const rx = site => new RegExp('(?=' + site.replace(/[NRYSWKMBDHV]/g, b => IUPAC[b]) + ')', 'g');

/* knipposities op de bovenste streng (de knip ligt vóór die base) voor één enzym */
export function cutsOf(seq, e, circ) {
  const [site, top, bot] = ENZ[e], L = site.length, n = seq.length;
  const tt = circ ? seq + seq.slice(0, L - 1) : seq, out = new Set();
  const scan = (s, cut) => { const r = rx(s); let m; while ((m = r.exec(tt))) { if (m.index >= n) break; const c = m.index + cut; if (circ || (c > 0 && c < n)) out.add(((c % n) + n) % n); r.lastIndex = m.index + 1; } };
  scan(site, top);
  const rs = rc(site);
  if (rs !== site) scan(rs, L - bot); /* de plaats op de andere streng: de knip ligt gespiegeld */
  return [...out].sort((a, b) => a - b);
}

/* fragmenten (bp) na knippen met een of meer enzymen; groot naar klein */
export function digest(seq, enzymes, circ) {
  const s = cleanSeq(seq), n = s.length;
  if (!n) return null;
  const per = {}; enzymes.forEach(e => { per[e] = cutsOf(s, e, circ); });
  const cuts = [...new Set(enzymes.flatMap(e => per[e]))].sort((a, b) => a - b);
  let frags;
  if (!cuts.length) frags = [{from: 0, to: n, size: n}];
  else if (circ) frags = cuts.map((c, i) => { const nx = i + 1 < cuts.length ? cuts[i + 1] : cuts[0] + n; return {from: c, to: nx, size: nx - c}; });
  else frags = [0, ...cuts].map((c, i, a) => { const nx = i + 1 < a.length ? a[i + 1] : n; return {from: c, to: nx, size: nx - c}; });
  frags.sort((a, b) => b.size - a.size);
  return {n, per, cuts, frags};
}
