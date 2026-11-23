import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MATRICES} from '../../src/lib/submat.js';
import {pairAlign, pairScore} from '../../src/lib/pairwise.js';

/* de matrices zijn letter voor letter die van NCBI (ftp.ncbi.nih.gov/blast/matrices/), hier als testbestand bewaard */
test('BLOSUM62, BLOSUM50 en PAM250 zijn gelijk aan de NCBI-bestanden', () => {
  for (const k of ['BLOSUM62', 'BLOSUM50', 'PAM250']) {
    const rows = readFileSync(new URL('../fixtures/mat/' + k, import.meta.url), 'utf8').split(/\r?\n/).filter(l => l.trim() && !l.startsWith('#')).map(l => l.trim().split(/\s+/));
    const L = rows[0];
    assert.equal(Object.keys(MATRICES[k]).length, L.length, k);
    for (const r of rows.slice(1)) L.forEach((b, j) => assert.equal(MATRICES[k][r[0]][b], +r[j + 1], k + ' ' + r[0] + b));
  }
  /* een paar bekende waarden */
  assert.equal(MATRICES.BLOSUM62.W.W, 11); assert.equal(MATRICES.PAM250.W.W, 17); assert.equal(MATRICES.PAM250.C.W, -8);
});

/* Durbin, Eddy, Krogh & Mitchison 1998, Biological Sequence Analysis, par. 2.3, fig. 2.5 en 2.6:
   HEAGAWGHEE tegen PAWHEAE, BLOSUM50, lineaire gatstraf d = 8: globaal score 1, lokaal AWGHE / AW-HE met score 28
   (5 + 15 − 8 + 10 + 6 met BLOSUM50; de hoogste cel in fig. 2.6). */
const D = {matrix: 'BLOSUM50', open: 8, ext: 8};
test('Needleman-Wunsch: Durbin et al. 1998 globaal, score 1', () => {
  const r = pairAlign('HEAGAWGHEE', 'PAWHEAE', {...D, mode: 'global'});
  assert.equal(r.score, 1);
  assert.equal(r.a.replace(/-/g, ''), 'HEAGAWGHEE'); assert.equal(r.b.replace(/-/g, ''), 'PAWHEAE');
  assert.equal(pairScore(r.a, r.b, D), 1);
});

test('Smith-Waterman: Durbin et al. 1998 lokaal, score 28, AWGHE / AW-HE', () => {
  const r = pairAlign('HEAGAWGHEE', 'PAWHEAE', {...D, mode: 'local'});
  assert.equal(r.score, 28);
  assert.equal(r.a, 'AWGHE'); assert.equal(r.b, 'AW-HE');
  assert.deepEqual([r.a0, r.b0], [4, 1]);
});

test('affiene gaten: één gat van drie in plaats van verspreide gaten', () => {
  /* DNA +5/−4, gat openen 10, verlengen 0,5 (gat van k kost 10 + (k − 1) · 0,5): 6 matches − 11 = 19 */
  const r = pairAlign('AAAGGGTTT', 'AAATTT', {matrix: 'DNA', open: 10, ext: 0.5, mode: 'global'});
  assert.equal(r.score, 19);
  assert.equal(r.b, 'AAA---TTT');
  assert.equal(pairScore(r.a, r.b, {matrix: 'DNA', open: 10, ext: 0.5}), 19);
});

test('de score klopt met de uitlijning voor willekeurige eiwitten', () => {
  let s = 3; const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  const aa = 'ARNDCQEGHILKMFPSTWYV', seq = n => Array.from({length: n}, () => aa[Math.floor(rnd() * 20)]).join('');
  for (let k = 0; k < 20; k++) {
    const x = seq(20 + Math.floor(rnd() * 30)), y = seq(20 + Math.floor(rnd() * 30)), o = {matrix: k % 2 ? 'PAM250' : 'BLOSUM62', open: 10, ext: 1};
    const g = pairAlign(x, y, {...o, mode: 'global'}), l = pairAlign(x, y, {...o, mode: 'local'});
    assert.equal(pairScore(g.a, g.b, o), g.score);
    assert.equal(pairScore(l.a, l.b, o), l.score);
    assert.ok(l.score >= g.score);
  }
});
