/* ================= EIGEN WERKSTROMEN EN PRACTICUMSJABLONEN (S119) =================
   De ingebouwde werkstromen staan in WF (src/legacy/nt/99z_ux.js). Hier: de practicumsjablonen
   (kind 'course', algemeen tot de eigenaar de echte BML-modules aanlevert) en de eigen
   werkstromen van de student (kind 'own', in labkit:v1:wfown, per apparaat, niet per project).
   Een verwijderde eigen werkstroom blijft bewaard met gone, want een run kan hem nog gebruiken. */

export const OWNKEY = 'labkit:v1:wfown';

export const COURSE = [
  {id: 'c-pcr', n: 'Practicum: PCR en gel', kind: 'course', steps: ['dna', 'pcr', 'pcrcyclus', 'gplan', 'gelfoto']},
  {id: 'c-cel', n: 'Practicum: celkweek', kind: 'course', steps: ['telkamer', 'viab', 'seed', 'passage', 'medium']},
  {id: 'c-elisa', n: 'Practicum: ELISA', kind: 'course', steps: ['plaat', 'elisa', 'curve']}
];

/* alleen bestaande tools, elk één keer, in de gekozen volgorde */
export const cleanSteps = (steps, known) => [...new Set((steps || []).filter(s => known.includes(s)))];

const newId = () => 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/* {id?, name, steps} opslaan in de lijst; geeft de nieuwe lijst */
export function saveOwn(list, {id, name, steps}, known) {
  const w = {id: id || newId(), n: String(name || '').trim() || 'Mijn werkstroom', kind: 'own', steps: cleanSteps(steps, known)};
  return list.some(x => x.id === w.id) ? list.map(x => (x.id === w.id ? w : x)) : [...list, w];
}
export const removeOwn = (list, id) => list.map(x => (x.id === id ? {...x, gone: true} : x));
export const shownOwn = list => list.filter(x => !x.gone);

/* een gedeelde werkstroom {n, s}: toevoegen als hij er (met dezelfde naam en stappen) nog niet is.
   Geeft {list, id, added}, of null als er geen bekende tool in zit. */
export function addShared(list, shared, known) {
  const steps = cleanSteps(shared && shared.s, known), n = String((shared && shared.n) || '').trim() || 'Gedeelde werkstroom';
  if (!steps.length) return null;
  const same = list.find(x => !x.gone && x.n === n && x.steps.join() === steps.join());
  if (same) return {list, id: same.id, added: false};
  const next = saveOwn(list, {name: n, steps}, known);
  return {list: next, id: next[next.length - 1].id, added: true};
}
