/* ================= DE LADDERS IN DE KEUZELIJST =================
   Dezelfde lijst in dezelfde volgorde als in de HTML van vóór de omzetting. De namen gaan
   door t(): de getallen erin worden {#} in de sleutel, dus "100 bp (1000–100)" en
   "50 bp (500–50)" delen één sleutel, precies zoals de vertaallaag het in de HTML deed.

   GfLadder.vue vult er de keuzelijst mee en GfVirtual.vue zoekt er de naam van een herkende
   ladder op; de bandgroottes zelf staan in LADDERS in web/index.html. */
export const LADS = [
  {v: '100', n: '100 bp (1000–100)'},
  {v: 'neb100', n: 'NEB 100 bp (1517–100)'},
  {v: '100p', n: '100 bp plus (3000–100)'},
  {v: 'neb1k', n: 'NEB 1 kb (10 000–500)'},
  {v: '1k', n: '1 kb (10 000–250)'},
  {v: 'k1k13', n: '1 kb (10 000–250, 13 banden)'},
  {v: 'k1kp', n: '1 kb plus (25 000–250)'},
  {v: 'h100', n: '100 bp (1500–100)'},
  {v: 'h100p', n: '100 bp plus (3000, 1500–100)'},
  {v: 'b50', n: '50 bp (500–50)'},
  {v: 'fast1', n: 'Fast DNA Ladder 1 (1200–100)'},
  {v: 'ppp', n: 'Eiwit: Precision Plus (250–10 kDa)'},
  {v: 'prplus', n: 'Eiwit: PageRuler Plus (250–10 kDa)'},
  {v: 'custom', n: 'Eigen ladder…'}
];

export const ladName = k => { const o = LADS.find(l => l.v === k); return o ? o.n : k; };
