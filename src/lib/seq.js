/* Rekenwerk van de tool Sequentie (S191–S194): een geplakte sequentie opschonen, omkeren en
   complementeren met de IUPAC-codes (NC-IUB 1985). Het complement van een ambigue base is de
   code van de complementaire set: R (A/G) ↔ Y (C/T), K ↔ M, B ↔ V, D ↔ H; S, W en N blijven
   zichzelf. Die tabel staat al in src/lib/digest.js (IUC, rcIupac). */
import {IUC, rcIupac} from './digest.js';
import {parseGenBank} from './genbank.js';
import {expose} from './global.js';

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

/* ---------- vertaling in zes leesramen (S193) ----------
   Codetabellen van NCBI (The Genetic Codes, translation tables 1–6), codons in de volgorde
   TTT, TTC, TTA, TTG, TCT, … (eerste, tweede, derde base door T, C, A, G). Tabel 11
   (bacterieel) heeft dezelfde aminozuren als tabel 1. Een codon met een ambigue base wordt X. */
export const CODES = {
  1: ['Standaard (1; ook bacterieel, 11)', 'FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG'],
  2: ['Mitochondriaal, gewervelden (2)', 'FFLLSSSSYY**CCWWLLLLPPPPHHQQRRRRIIMMTTTTNNKKSS**VVVVAAAADDEEGGGG'],
  3: ['Mitochondriaal, gist (3)', 'FFLLSSSSYY**CCWWTTTTPPPPHHQQRRRRIIMMTTTTNNKKSSRRVVVVAAAADDEEGGGG'],
  4: ['Mitochondriaal, schimmels; Mycoplasma (4)', 'FFLLSSSSYY**CCWWLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG'],
  5: ['Mitochondriaal, ongewervelden (5)', 'FFLLSSSSYY**CCWWLLLLPPPPHHQQRRRRIIMMTTTTNNKKSSSSVVVVAAAADDEEGGGG'],
  6: ['Ciliaten (6)', 'FFLLSSSSYYQQCC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG']
};
const BI = {T: 0, C: 1, A: 2, G: 3};
export function translate(s, aa) {
  let p = '';
  for (let i = 0; i + 3 <= s.length; i += 3) {
    const a = BI[s[i]], b = BI[s[i + 1]], c = BI[s[i + 2]];
    p += a == null || b == null || c == null ? 'X' : aa[a * 16 + b * 4 + c];
  }
  return p;
}
/* frame +1..+3 op de bovenste streng, −1..−3 op het reverse complement */
export function frames(seq, aa) {
  const rc = rcIupac(seq);
  return [1, 2, 3, -1, -2, -3].map(f => ({f, p: translate((f > 0 ? seq : rc).slice(Math.abs(f) - 1), aa)}));
}
/* ORF: van de eerste M na een stop (of na het begin) tot en met de volgende stop, minstens minAa
   aminozuren. from/to zijn 1-based op de bovenste streng, stop inbegrepen; op − loopt from > to.
   a/b: het stuk in de eiwitregel van dat leesraam (b = de stop).
   shortcut: alleen M (ATG, en ATA/ATT waar die M coderen) als start; alternatieve starts zoals
   TTG/GTG in bacteriën tellen niet. Een ORF zonder stop aan het eind wordt niet gemeld. */
export function orfs(seq, fr, minAa) {
  const L = seq.length, out = [];
  fr.forEach(({f, p}) => {
    const off = Math.abs(f) - 1;
    let a = -1;
    for (let i = 0; i < p.length; i++) {
      if (a < 0 && p[i] === 'M') a = i;
      if (p[i] !== '*') continue;
      if (a >= 0 && i - a >= minAa) {
        const s = off + 3 * a, e = off + 3 * i + 2; /* 0-based in de streng van dit leesraam */
        out.push({f, a, b: i, aa: i - a, from: f > 0 ? s + 1 : L - s, to: f > 0 ? e + 1 : L - e});
      }
      a = -1;
    }
  });
  return out.sort((x, y) => y.aa - x.aa);
}

/* ---------- doorsturen en ontvangen (S194) ----------
   SEQ_TO: de velden in andere tools die een sequentie aannemen. Een knop verschijnt alleen als
   het veld in de pagina staat. Een nieuwe tool (uitlijning, chromatogram) meldt zich met
   SEQ_TO.push({label, tool, id}); add: true voegt een regel "naam<tab>sequentie" toe in plaats
   van het veld te vervangen. */
export const SEQ_TO = [
  {label: 'Restrictiedigestie', tool: 'digest', id: 'dg-seq'},
  {label: 'Plasmidekaart', tool: 'plasmid', id: 'pl-seq'},
  {label: 'In-silico PCR', tool: 'pcrcyclus', id: 'y-tpl'},
  {label: 'Primerkaart', tool: 'oligo', id: 'ol-seq', add: true}
];
/* zoals setV() in src/legacy/nt/99_app.js: waarde zetten en input/change sturen, zodat v-model,
   de invoeropslag en ongedaan maken het zien */
function put(id, v) {
  const el = document.getElementById(id); if (!el) return false;
  el.value = v;
  el.dispatchEvent(new Event('input', {bubbles: true}));
  el.dispatchEvent(new Event('change', {bubbles: true}));
  return true;
}
export function seqSend(t, name, seq) {
  const el = document.getElementById(t.id); if (!el) return;
  put(t.id, t.add ? (el.value.trim() ? el.value.replace(/\s*$/, '\n') : '') + name + '\t' + seq : '>' + name + '\n' + seq);
  location.hash = t.tool;
}
/* een sequentie (of FASTA) uit een andere tool in Sequentie zetten */
export function seqReceive(text) {
  if (!String(text || '').trim() || !put('sq-in', String(text))) return;
  location.hash = 'seq';
}
/* een knop met data-to-seq="<id van een tekstveld>" stuurt de selectie in dat veld, of alles */
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-to-seq]'); if (!b) return;
  const el = document.getElementById(b.dataset.toSeq);
  if (el) seqReceive(el.value.slice(el.selectionStart, el.selectionEnd) || el.value);
});
expose({SEQ_TO, seqReceive});
