/* ================= DE LADDERS IN DE KEUZELIJST =================
   Dezelfde lijst in dezelfde volgorde als in de HTML van vóór de omzetting. De namen gaan
   door t(): de getallen erin worden {#} in de sleutel, dus "100 bp (1000–100)" en
   "50 bp (500–50)" delen één sleutel, precies zoals de vertaallaag het in de HTML deed.

   GfLadder.vue vult er de keuzelijst mee en GfVirtual.vue zoekt er de naam van een herkende
   ladder op; de bandgroottes zelf staan in LADDERS in web/index.html. */
import {reactive} from 'vue';
import {expose} from '../../lib/global.js';

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

export const ladName = k => { const o = LADS.find(l => l.v === k); return o ? o.n : (ladUser(k) || {n: k}).n; };

/* ================= EIGEN LADDERS (S67) =================
   De ladderbibliotheek: eigen ladders in localStorage (`lkLadders`), elk {id, n: naam, s: groottes
   (grootste eerst), u: 'bp' | 'kDa'}. Ze staan ook in LADDERS, zodat banddetectie (gfLadder) en
   "ladder uit een foto" (gfLadMatch) ze gebruiken zoals de ingebouwde. De naam is tekst van de
   gebruiker en wordt niet vertaald. Delen gaat als één regel tekst: "Naam: 1000 500 250 bp". */

export const userLads = reactive([]);
const save = () => jset('lkLadders', userLads.map(l => ({id: l.id, n: l.n, s: l.s, u: l.u})));
const put = l => { LADDERS[l.id] = l.s; };
/* geldig = een naam en minstens twee positieve groottes; de rest komt van buiten (opslag, plakken, project) */
const clean = l => {
  const s = (Array.isArray(l && l.s) ? l.s : []).map(Number).filter(v => isFinite(v) && v > 0).sort((a, b) => b - a);
  const n = String((l && l.n) || '').trim().slice(0, 80);
  return n && s.length >= 2 ? {id: typeof l.id === 'string' && /^u[a-z0-9]{4,}$/.test(l.id) ? l.id : 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), n, s, u: l.u === 'kDa' ? 'kDa' : 'bp'} : null;
};
export function ladLoad() { if (userLads.length) return; jget('lkLadders', []).map(clean).filter(Boolean).forEach(l => { userLads.push(l); put(l); }); }
/* voegt toe (of werkt bij met dezelfde id); geeft de ladder terug, of null als hij ongeldig is */
export function ladAdd(raw) {
  const l = clean(raw); if (!l) return null;
  const i = userLads.findIndex(o => o.id === l.id); if (i >= 0) userLads.splice(i, 1, l); else userLads.push(l);
  put(l); save(); return l;
}
export function ladDel(id) { const i = userLads.findIndex(o => o.id === id); if (i < 0) return; userLads.splice(i, 1); delete LADDERS[id]; save(); }
export const ladUser = k => userLads.find(l => l.id === k) || null;
/* eiwitladders rekenen in kDa en doen niet mee aan het herkennen van een DNA-ladder */
export const ladProt = k => k === 'ppp' || k === 'prplus' || (ladUser(k) || {}).u === 'kDa';
export const ladLine = l => l.n.replace(/:/g, ' ') + ': ' + l.s.join(' ') + ' ' + l.u;
/* "Naam: 1000 500 250 bp", één ladder per regel; regels zonder naam of groottes vallen weg */
export function ladParse(txt) {
  return String(txt).split(/\r?\n/).map(r => {
    const i = r.lastIndexOf(':'); if (i < 0) return null;
    const rest = r.slice(i + 1);
    return clean({n: r.slice(0, i), s: rest.replace(/kda|bp/gi, ' ').trim().split(/[\s;]+/).map(num), u: /kda/i.test(rest) ? 'kDa' : 'bp'});
  }).filter(Boolean);
}
/* de motor (src/engines/gelfoto.js) leest deze als globale naam */
expose({ladProt, ladUser, ladAdd});
