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
