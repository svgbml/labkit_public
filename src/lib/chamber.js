/* Telkamer-raster (S105, #177): waar de vakken van een gekozen grootte liggen, in de volgorde
   waarin je ze meestal telt. 100 eenheden = 1 mm. Bürker en Neubauer zijn 3 × 3 mm met het
   middelste grote vak in 5 × 5 groepsvakken (elk 4 × 4 kleine vakken); bij Neubauer zijn de vier
   hoekvakken in 4 × 4 verdeeld. Fuchs-Rosenthal is 4 × 4 mm, elk groot vak in 4 × 4.
   Bron van de maten: Marienfeld, Counting grids (zie p.src van Telkamer). */

/* de vakken van een n × n raster in een ouder, rij voor rij */
const sub = (p, n) => {
  const s = p.s / n, out = [];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) out.push({x: p.x + i * s, y: p.y + j * s, s});
  return out;
};
/* hetzelfde raster, maar de vier hoeken en (bij oneven n) het midden eerst */
const key = (p, n) => {
  const all = sub(p, n), m = (n - 1) / 2;
  const first = [[0, 0], [n - 1, 0], [0, n - 1], [n - 1, n - 1]];
  if (n % 2) first.push([m, m]);
  const idx = first.map(([i, j]) => j * n + i);
  return [...idx.map(k => all[k]), ...all.filter((_, k) => !idx.includes(k))];
};

export function chamber(ch, area) {
  const fr = String(ch).startsWith('0.2'), w = fr ? 400 : 300, big = key({x: 0, y: 0, s: w}, w / 100);
  const lines = [];
  const grid = (p, n) => { for (let k = 1; k < n; k++) { const d = p.s * k / n; lines.push([p.x + d, p.y, p.x + d, p.y + p.s], [p.x, p.y + d, p.x + p.s, p.y + d]); } };
  grid({x: 0, y: 0, s: w}, w / 100);
  let cells;
  if (fr) {
    big.forEach(p => grid(p, 4));
    cells = area >= 1 ? big : big.flatMap(p => sub(p, 4));
  } else {
    const mid = {x: 100, y: 100, s: 100}, corners = big.slice(0, 4);
    grid(mid, 5);
    if (ch === '0.1n') corners.forEach(p => grid(p, 4));
    if (area >= 1) cells = big;
    else if (area === 0.0625) cells = corners.flatMap(p => sub(p, 4));
    else if (area === 0.04) cells = key(mid, 5);
    else cells = key(mid, 5).flatMap(p => sub(p, 4));
  }
  return {w, lines, cells};
}

/* hoeveel vakken je standaard telt: vijf groepsvakken (hoeken en midden), anders vier */
export const VAK_DEFAULT = area => (area === 0.04 ? 5 : 4);
