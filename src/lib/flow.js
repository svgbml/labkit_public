/* ================= DATA TUSSEN DE STAPPEN VAN EEN RUN (S117) =================
   De mappings en hun rekenwerk, zonder pagina. Een mapping vult een veld (field) of een kolom
   van een tabel (table, col) in de tool `to` uit de tool `from`; ze werkt alleen als beide tools
   in de actieve run zitten (docs/adr/0002). `from: null` = de monsterlijst, die er altijd is.
   Het lezen en schrijven op de pagina doet src/engines/flow.js. */

export const MAPS = [
  {id: 'dna-pcr', from: 'dna', to: 'pcr', field: 'q-t', what: 'DNA-kwantificatie'},
  {id: 'smp-gplan', from: null, to: 'gplan', table: 'gp-tbl', col: 0, what: 'de monsterlijst'},
  {id: 'pcr-gplan', from: 'pcrcyclus', to: 'gplan', table: 'gp-tbl', col: 2, what: 'PCR-cyclus'}
];

export const activeMaps = steps => MAPS.filter(m => steps.includes(m.to) && (m.from === null || steps.includes(m.from)));

/* template per PCR-reactie in µL: dezelfde som als "Stuur door naar" PCR-mastermix */
export function pcrTemplate(conc, ng) {
  if (!(conc > 0)) return null;
  const v = (ng > 0 ? ng : 10) / conc;
  return Math.max(Number(v.toPrecision(3)), 0.01);
}

const isLadder = r => /ladder|marker/i.test(String(r[0] || ''));

/* de lanen van de Gelplanner met de monsternamen: de ladder(s) vooraan blijven staan, de andere
   lanen krijgen de namen op volgorde; een laan die er nog niet is krijgt de volumes en kleur van
   de eerste monsterlaan */
export function laneNames(rows, names) {
  if (!names || !names.length) return rows;
  let k = 0; while (k < rows.length && isLadder(rows[k])) k++;
  const head = rows.slice(0, k), samples = rows.slice(k), base = samples[0] || ['', '10', '', '#1558b0'];
  return [...head, ...names.map((n, i) => { const r = (samples[i] || base).slice(); r[0] = n; return r; })];
}

/* verwachte grootte (bp) in elke monsterlaan met een naam; ladders en lege lanen niet */
export function laneSizes(rows, bp) {
  if (!(bp > 0)) return rows;
  return rows.map(r => (!isLadder(r) && String(r[0] || '').trim() ? Object.assign(r.slice(), {2: String(Math.round(bp))}) : r));
}
