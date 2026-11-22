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
