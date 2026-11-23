/* Overdracht naar EBI Clustal Omega en omzetten tussen formaten (S187): zuivere functies. */

import {parseAlignment, alnWrite} from './alignment.js';

export const EBI_URL = 'https://www.ebi.ac.uk/jdispatcher/msa/clustalo';

/* ---------- omzetten (S187) ---------- */
/* tekst in elk van de zes leesbare formaten → tekst in 'fasta', 'clustal' of 'phylip'; null als er niets te lezen is */
export function alnConvert(text, fmt) {
  const a = parseAlignment(text);
  return a.names.length ? alnWrite(a, fmt) : null;
}

/* de uitlijning als losse reeksen (gaten weg), klaar om opnieuw te laten uitlijnen */
export function alnUngapped(a) {
  return a.names.map((n, i) => '>' + n.replace(/\s+/g, '_') + '\n' + (a.seqs[i].replace(/-/g, '').match(/.{1,60}/g) || ['']).join('\n')).join('\n') + '\n';
}
