import test from 'node:test';
import assert from 'node:assert/strict';
import {njTree, idDist, treeOrder, treeLeaves, parseNewick, treeNewick} from '../../src/lib/tree.js';

/* Het uitgewerkte voorbeeld met vijf taxa uit het Wikipedia-artikel "Neighbor joining" (methode van Saitou & Nei 1987,
   Mol Biol Evol 4:406; Q-criterium van Studier & Keppler 1988, Mol Biol Evol 5:729). De matrix is additief: de boom
   a–u 2, b–u 3, u–v 3, c–v 4, v–w 2, d–w 2, e–w 1 geeft precies deze afstanden, en NJ vindt een additieve boom terug. */
const N = ['a', 'b', 'c', 'd', 'e'];
const D = [[0, 5, 9, 9, 8], [5, 0, 10, 10, 9], [9, 10, 0, 8, 7], [9, 10, 8, 0, 3], [8, 9, 7, 3, 0]];
const close = (a, b, m) => assert.ok(Math.abs(a - b) < 1e-9, m + ': ' + a + ' ≠ ' + b);

/* de takken van een ongewortelde boom: per tak de bladen aan één kant (de kant zonder 'a') en de lengte */
function splits(root) {
  const all = treeLeaves(root).sort(), out = {};
  (function walk(n) {
    const l = n.kids.length ? n.kids.flatMap(walk) : [n.name];
    if (n !== root) {
      const side = l.includes('a') ? all.filter(x => !l.includes(x)) : l;
      const k = side.slice().sort().join('');
      out[k] = (out[k] || 0) + n.len;   /* de twee takken rond een tweetakkige wortel tellen samen */
    }
    return l;
  })(root);
  return out;
}

test('NJ op het vijf-taxa-voorbeeld: topologie en alle taklengtes', () => {
  const t = njTree(N, D);
  assert.equal(t.kids.length, 3);
  const s = splits(t);
  assert.deepEqual(Object.keys(s).sort(), ['a', 'b', 'c', 'd', 'de', 'e', 'cde'].map(x => x === 'a' ? 'bcde' : x).sort());
  close(s.bcde, 2, 'a'); close(s.b, 3, 'b'); close(s.c, 4, 'c'); close(s.d, 2, 'd'); close(s.e, 1, 'e');
  close(s.cde, 3, 'u–v'); close(s.de, 2, 'v–w');
});

test('de NJ-boom gaat heen en terug door Newick', () => {
  const t = njTree(N, D), back = parseNewick(treeNewick(t)).root;
  assert.deepEqual(splits(back), splits(t));
});

test('afstand uit identiteit: 1 − identiteit, of Jukes-Cantor', () => {
  assert.equal(idDist(0.8, 'p', true), 0.19999999999999996);
  /* p = 0,25 bij DNA: −3/4 ln(1 − 4/3 · 0,25) = 0,304099 (Jukes & Cantor 1969) */
  close(idDist(0.75, 'jc', true), -0.75 * Math.log(2 / 3), 'jc dna');
  close(idDist(0.75, 'jc', true), 0.30409883108112323, 'jc dna getal');
  /* eiwit: −19/20 ln(1 − 20/19 · p) */
  close(idDist(0.9, 'jc', false), -0.95 * Math.log(1 - 0.1 * 20 / 19), 'jc eiwit');
  assert.equal(idDist(0.2, 'jc', true), Infinity);
});

test('rijvolgorde volgens de boom; namen die niet in de boom staan komen achteraan', () => {
  const t = parseNewick('((c,a),(d,b));').root;
  assert.deepEqual(treeOrder(t, ['a', 'b', 'c', 'x', 'd']), [2, 0, 4, 1, 3]);
});
