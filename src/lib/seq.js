/* Rekenwerk van de tool Sequentie (S191–S194): een geplakte sequentie opschonen, omkeren en
   complementeren met de IUPAC-codes (NC-IUB 1985). Het complement van een ambigue base is de
   code van de complementaire set: R (A/G) ↔ Y (C/T), K ↔ M, B ↔ V, D ↔ H; S, W en N blijven
   zichzelf. Die tabel staat al in src/lib/digest.js (IUC, rcIupac). */
import {IUC, rcIupac} from './digest.js';
import {parseGenBank} from './genbank.js';

/* Plakken: posities, spaties en regeleinden weg; een FASTA-kop begint een nieuw record; U wordt
   T (rna onthoudt dat er U in stond); elk ander teken wordt geteld en weggelaten. Een
   GenBank-bestand is één record met de naam van LOCUS. */
export function parseSeqs(text) {
  const gb = parseGenBank(text);
  if (gb) return {recs: gb.seq ? [{name: gb.name || '', seq: gb.seq}] : [], dropped: 0, rna: false};
  const recs = [];
  let cur = null, dropped = 0, rna = false;
  String(text || '').split(/\r?\n/).forEach(line => {
    const h = line.match(/^\s*>\s*(.*)$/);
    if (h) { cur = {name: h[1].trim(), seq: ''}; recs.push(cur); return; }
    if (/^\s*;/.test(line)) return;
    const s = line.replace(/[\d\s]/g, '').toUpperCase();
    if (!s) return;
    if (!cur) { cur = {name: '', seq: ''}; recs.push(cur); }
    let out = '';
    for (const b of s) {
      if (b === 'U') { rna = true; out += 'T'; } else if (IUC[b]) out += b; else dropped++;
    }
    cur.seq += out;
  });
  return {recs: recs.filter(r => r.seq), dropped, rna};
}

export const complement = s => s.split('').map(b => IUC[b]).join('');
export const reverse = s => s.split('').reverse().join('');
export const OPS = {rc: rcIupac, r: reverse, c: complement, n: s => s};

/* ---------- uitvoer (S192) ---------- */
export function formatSeq(s, o) {
  if (o.rna) s = s.replace(/T/g, 'U');
  if (o.lower) s = s.toLowerCase();
  return o.width > 0 ? s.match(new RegExp('.{1,' + o.width + '}', 'g')).join('\n') : s;
}

/* ---------- feiten (S192) ----------
   Molmassa volgens Thermo Fisher (DNA and RNA Molecular Weights and Conversions), zoals OligoCalc:
   ssDNA = A×313,21 + T×304,2 + C×289,18 + G×329,21 − 61,96 (5′-OH, geen fosfaat);
   ssRNA = A×329,21 + U×306,17 + C×305,18 + G×345,21 + 159,0 (5′-trifosfaat, transcript);
   dsDNA = beide strengen zo opgeteld. Een ambigue base telt het gemiddelde van zijn basen.
   GC% = (G + C + S) / (A + T + G + C + S + W), zoals Biopython gc_fraction: een base die
   zowel sterk als zwak kan zijn (N, R, …) telt niet mee. */
const EXP = {A: 'A', C: 'C', G: 'G', T: 'T', R: 'AG', Y: 'CT', S: 'CG', W: 'AT', K: 'GT', M: 'AC',
  B: 'CGT', D: 'AGT', H: 'ACT', V: 'ACG', N: 'ACGT'};
const WD = {A: 313.21, C: 289.18, G: 329.21, T: 304.2}, WR = {A: 329.21, C: 305.18, G: 345.21, T: 306.17};
const mw = (s, w, end) => (s.length ? [...s].reduce((a, b) => a + [...EXP[b]].reduce((x, y) => x + w[y], 0) / EXP[b].length, 0) + end : 0);
export function facts(seq, rna) {
  const n = {};
  for (const b of seq) n[b] = (n[b] || 0) + 1;
  const c = b => n[b] || 0, strong = c('G') + c('C') + c('S'), known = strong + c('A') + c('T') + c('W');
  return {L: seq.length, n, gc: known ? strong / known * 100 : NaN, amb: seq.length - c('A') - c('C') - c('G') - c('T'),
    ss: rna ? mw(seq, WR, 159.0) : mw(seq, WD, -61.96), ds: rna ? NaN : mw(seq, WD, -61.96) + mw(rcIupac(seq), WD, -61.96)};
}
