/* Varianten in referentienummering en een eigen Sanger-read in de uitlijning (S180, #350 #351). Zuivere functies.
   - alnVariants: per rij de verschillen met een gekozen referentierij, genummerd op de referentie zonder gaten.
     DNA gaat door variants() uit sangeralign.js (HGVS g., 3'-regel, IUPAC als heterozygoot), zodat de uitlijning
     en het chromatogram dezelfde notatie geven; eiwit krijgt eenletter-p.-notatie (p.K2R, p.V4del, p.V4_W5insQ).
     Gaten aan het begin en eind van een rij (de rij is korter) zijn geen deleties.
   - alnAddRead: de read tegen de referentierij uitlijnen met alignRead() (zaadjes, beide strengen, gebande
     affiene uitlijning) en als laatste rij toevoegen; een insertie in de read krijgt nieuwe kolommen met gaten
     in alle andere rijen. */
import {alignRead, variants, parseRef} from './sangeralign.js';
import {alnType} from './alignment.js';

/* de kolommen van rij x tegen referentierij r in het formaat van alignRead: {r, q, b}; r/q = index zonder gaten of −1 */
function pairCols(rs, xs) {
  const cols = [];
  let ri = 0, qi = 0;
  for (let c = 0; c < rs.length; c++) {
    const a = rs[c] !== '-', b = xs[c] !== '-';
    if (a || b) cols.push({r: a ? ri : -1, q: b ? qi : -1, b: b ? xs[c].toUpperCase() : '-', c});
    if (a) ri++; if (b) qi++;
  }
  while (cols.length && (cols[0].q < 0 || cols[0].r < 0)) cols.shift();
  while (cols.length && (cols[cols.length - 1].q < 0 || cols[cols.length - 1].r < 0)) cols.pop();
  return cols;
}

/* eiwit: substituties, deleties en inserties als runs, zonder verschuiven */
function protVariants(cols, ref) {
  const out = [];
  for (let k = 0; k < cols.length; k++) {
    const x = cols[k];
    if (x.r >= 0 && x.q >= 0) {
      if (x.b !== ref[x.r] && x.b !== 'X') out.push({type: 'sub', p: x.r, p2: x.r, ref: ref[x.r], alt: x.b, hgvs: 'p.' + ref[x.r] + (x.r + 1) + x.b});
      continue;
    }
    let e = k; while (e + 1 < cols.length && (cols[e + 1].q < 0) === (x.q < 0) && (cols[e + 1].r < 0) === (x.r < 0)) e++;
    if (x.q < 0) {
      const p1 = x.r, p2 = cols[e].r;
      out.push({type: 'del', p: p1, p2, ref: ref.slice(p1, p2 + 1), alt: '', hgvs: 'p.' + ref[p1] + (p1 + 1) + (p2 > p1 ? '_' + ref[p2] + (p2 + 1) : '') + 'del'});
    } else {
      const p = cols[k - 1].r, s = cols.slice(k, e + 1).map(y => y.b).join('');
      out.push({type: 'ins', p, p2: p + 1, ref: '', alt: s, hgvs: 'p.' + ref[p] + (p + 1) + '_' + ref[p + 1] + (p + 2) + 'ins' + s});
    }
    k = e;
  }
  return out;
}

/* [{row, name, type, hgvs, pos (1-gebaseerd op de referentie), col (1-gebaseerde kolom in de uitlijning)}] */
export function alnVariants(a, refIdx) {
  const rs = a.seqs[refIdx];
  if (rs == null) return [];
  const ref = rs.replace(/-/g, '').toUpperCase(), nt = alnType(a) === 'nt', out = [];
  /* van referentie-index naar kolom */
  const colOf = []; for (let c = 0; c < rs.length; c++) if (rs[c] !== '-') colOf.push(c);
  a.seqs.forEach((xs, row) => {
    if (row === refIdx) return;
    const cols = pairCols(rs, xs);
    const vs = nt ? variants({cols}, ref.replace(/U/g, 'T')) : protVariants(cols, ref);
    for (const v of vs) out.push({row, name: a.names[row], type: v.type, hgvs: v.hgvs, pos: v.p + 1, col: colOf[Math.min(v.p, colOf.length - 1)] + 1});
  });
  return out;
}

/* de read (FASTA of kale basen) als nieuwe laatste rij; {aln, hit} met hit = de uitkomst van alignRead, of null (dan is aln ongewijzigd) */
export function alnAddRead(a, refIdx, text, defName = 'Eigen read') {
  const rs = a.seqs[refIdx], rd = parseRef(text);
  if (rs == null || !rd.seq) return {aln: a, hit: null};
  const ref = rs.replace(/-/g, '').toUpperCase().replace(/U/g, 'T');
  const hit = alignRead(rd.seq, ref);
  if (!hit || !hit.cols.length) return {aln: a, hit: null};
  const colOf = []; for (let c = 0; c < rs.length; c++) if (rs[c] !== '-') colOf.push(c);
  const row = new Array(a.len).fill('-'), ins = new Map();
  let last = -1;
  for (const x of hit.cols) {
    if (x.r >= 0) { last = colOf[x.r]; row[last] = x.b; }
    else ins.set(last, (ins.get(last) || '') + x.b);
  }
  const grow = (s, fill) => s.split('').map((ch, c) => ch + (ins.has(c) ? (fill ? ins.get(c) : '-'.repeat(ins.get(c).length)) : '')).join('');
  const seqs = a.seqs.map(s => grow(s, false)).concat(grow(row.join(''), true));
  return {aln: {...a, names: a.names.concat(rd.name.split(/\s/)[0] || defName), seqs, len: seqs[0].length, cons: ''}, hit};
}
