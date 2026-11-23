/* Een read uit een bestand (S149, voor de worker in S163 uit Sanger.vue gehaald): ABIF (.ab1) of
   een FASTA/tekst als terugval. Zuiver: bytes in, {r} of {err} (een vertaalsleutel) uit. */
import {readAbif, abifRead} from './abif.js';

/* FASTA of kale basen: een regel met > geeft de naam, de rest houdt alleen IUPAC-letters */
export function parseSeq(text) {
  const lines = String(text || '').split(/\r?\n/);
  const h = lines.find(l => l.startsWith('>'));
  const bases = lines.filter(l => !/^\s*[>;]/.test(l)).join('').toUpperCase().replace(/U/g, 'T').replace(/[^ACGTRYSWKMBDHVN]/g, '');
  return {name: h ? h.slice(1).trim() : '', bases};
}

export function readFile(buf, fname) {
  try {
    const ab = readAbif(buf), d = abifRead(ab);
    if (!d.bases) return {err: 'Dit ABIF-bestand bevat geen basecalls.'};
    return {r: {name: fname, meta: ab.meta, order: d.order, traces: d.traces, bases: d.bases, peaks: d.peaks, qual: d.qual, mismatch: d.mismatch}};
  } catch (x) {
    if (!String(x.message).startsWith('Geen ABIF')) return {err: 'Het ABIF-bestand is afgebroken.'};
    const p = parseSeq(new TextDecoder().decode(buf));
    if (!p.bases) return {err: 'Geen ABIF-bestand en geen sequentie gevonden.'};
    return {r: {name: p.name || fname, meta: null, order: '', traces: null, bases: p.bases, peaks: [], qual: []}};
  }
}
