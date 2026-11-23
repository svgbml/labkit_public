/* Trimvoorstel voor een Sanger-read: een schuivend venster over de Phred-kwaliteiten, zoals Trimmomatic SLIDINGWINDOW
   (Bolger, Lohse & Usadel, Bioinformatics 30:2114–2120, 2014). Het behouden stuk begint bij het eerste venster van `win` basen
   (vanaf het 5'-einde) met een gemiddelde kwaliteit ≥ q en eindigt bij de laatste base van het laatste venster (vanaf het
   3'-einde) dat dat haalt. Geeft {start, end} (1-gebaseerd, inclusief) of null als geen venster de drempel haalt. */
export function trimWindow(qual, win, q) {
  const n = qual.length;
  if (!(win >= 1) || n < win) return null;
  const ps = [0];
  for (let i = 0; i < n; i++) ps.push(ps[i] + qual[i]);
  const ok = i => ps[i + win] - ps[i] >= q * win;
  let a = 0, b = n - win;
  while (a <= b && !ok(a)) a++;
  if (a > b) return null;
  while (!ok(b)) b--;
  return {start: a + 1, end: b + win};
}

const COMP = {A: 'T', T: 'A', C: 'G', G: 'C', R: 'Y', Y: 'R', K: 'M', M: 'K', B: 'V', V: 'B', D: 'H', H: 'D', S: 'S', W: 'W', N: 'N'};
export const comp = c => COMP[c] || 'N';
export const revComp = s => String(s).split('').reverse().map(comp).join('');

/* FASTA van seq[a..b] (0-gebaseerd, inclusief; range = {a, b} of null voor de hele read), optioneel als reverse complement.
   Kop: >naam[ start-end][ revcomp] met 1-gebaseerde posities van de oorspronkelijke read; regels van 60. */
export function fasta(name, seq, range, rc) {
  const a = range ? range.a : 0, b = range ? range.b : seq.length - 1;
  let s = seq.slice(a, b + 1);
  if (rc) s = revComp(s);
  return '>' + (name || 'sequence') + (range ? ' ' + (a + 1) + '-' + (b + 1) : '') + (rc ? ' revcomp' : '') + '\n' + (s.match(/.{1,60}/g) || []).join('\n') + '\n';
}
