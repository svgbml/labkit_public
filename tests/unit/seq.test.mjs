import test from 'node:test';
import assert from 'node:assert/strict';
import '../../src/lib/helpers.js';
import {complement, reverse, translate, CODES, facts, frames} from '../../src/lib/seq.js';
import {rcIupac, ENZ, enzInfo, cuts, digest, siteStarts} from '../../src/lib/digest.js';
import {clean, revcomp, parsePrimers} from '../../src/lib/primer.js';

const near = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} != ${b}`);
const std = CODES[1][1], mito = CODES[2][1];

test('complement, reverse en reverse complement', () => {
  assert.equal(complement('ATGC'), 'TACG');
  assert.equal(reverse('ATGC'), 'CGTA');
  assert.equal(revcomp('AACG'), 'CGTT');
  assert.equal(rcIupac('GAATTC'), 'GAATTC'); // EcoRI-plaats is palindroom
  assert.equal(rcIupac('AAGR'), 'YCTT'); // R (A/G) complementeert tot Y (C/T)
});

test('translate met de standaardcode (NCBI transl_table=1)', () => {
  assert.equal(translate('ATGGCCTAA', std), 'MA*');
  assert.equal(translate('TGGTTTAAA', std), 'WFK');
  assert.equal(translate('ATGNNN', std), 'MX'); // ambigu codon wordt X
  assert.equal(translate('ATGGC', std), 'M'); // onvolledig laatste codon vervalt
});

test('translate: afwijkende code, mitochondriaal gewervelden (NCBI transl_table=2)', () => {
  assert.equal(translate('TGA', std), '*');
  assert.equal(translate('TGA', mito), 'W');
  assert.equal(translate('ATA', mito), 'M');
  assert.equal(translate('ATA', std), 'I');
});

test('frames: +1 en -1 van een bekende reeks', () => {
  const f = frames('ATGGCCTAA', std);
  assert.equal(f.length, 6);
  assert.equal(f[0].p, 'MA*');
  assert.equal(f[3].p, translate('TTAGGCCAT', std)); // reverse complement
});

test('facts: GC% en molecuulgewicht', () => {
  assert.equal(facts('GGCC').gc, 100);
  assert.equal(facts('ATAT').gc, 0);
  assert.equal(facts('ATGC').gc, 50);
  assert.equal(facts('ATGC').L, 4);
  // ssDNA: som van dNMP-residuen (A 313,21; C 289,18; G 329,21; T 304,20) min 61,96 voor het 5'-trifosfaat/3'-OH-eind
  near(facts('ATGC').ss, 313.21 + 304.2 + 329.21 + 289.18 - 61.96, 0.01);
  near(facts('ATGC').ds, 2 * (313.21 + 304.2 + 329.21 + 289.18 - 61.96), 0.02); // ATGC en zijn reverse complement GCAT hebben dezelfde samenstelling
  assert.ok(Number.isNaN(facts('ATGC', true).ds)); // RNA is enkelstrengs
});

test('primer: clean en parsePrimers', () => {
  assert.equal(clean('acgu nx'), 'ACGTN');
  assert.deepEqual(parsePrimers('fwd ACGTAC\nrev: tgca'), [{name: 'fwd', seq: 'ACGTAC'}, {name: 'rev', seq: 'TGCA'}]);
  assert.deepEqual(parsePrimers("5'-ACGT-3'"), [{name: '', seq: 'ACGT'}]);
});

test('digest: EcoRI knipt G^AATTC (NEB)', () => {
  assert.equal(cuts('AAGAATTCAA', 'EcoRI', false)[0], 3);
  assert.deepEqual(cuts('AAGAATTCAA', 'EcoRI', false), [3]);
  assert.deepEqual(cuts('AAGAATTCAA', 'EcoRI', true), [3]);
  assert.deepEqual(cuts('AAAAAAAAAA', 'EcoRI', false), []);
  assert.deepEqual(cuts('AAGAATTCAA', 'onbekend', false), []);
});

test('digest: fragmenten', () => {
  assert.deepEqual(digest('AAGAATTCAA', ['EcoRI'], false).map(f => f.size), [3, 7]);
  assert.deepEqual(digest('AAGAATTCAA', ['EcoRI'], true).map(f => f.size), [10]); // circulair, één knip
  const two = digest('GAATTCAAAAGAATTCAAAA', ['EcoRI'], true); // twee sites 10 bp uit elkaar
  assert.deepEqual(two.map(f => f.size), [10, 10]);
  assert.equal(digest('AAAA', ['EcoRI'], false)[0].uncut, true);
});

test('digest: uiteindes en isoschizomeren (NEB)', () => {
  assert.equal(enzInfo('EcoRI').end, '5′-overhang');
  assert.equal(enzInfo('EcoRI').ov, 4);
  assert.equal(enzInfo('KpnI').end, '3′-overhang');
  assert.equal(enzInfo('EcoRV').end, 'stomp (blunt)');
  assert.equal(ENZ.SmaI[0], ENZ.XmaI[0]); // zelfde plaats CCCGGG
  assert.equal(enzInfo('SmaI').end, 'stomp (blunt)'); // CCC^GGG
  assert.equal(enzInfo('XmaI').end, '5′-overhang'); // C^CCGGG
});

test('digest: ambigue plaats en niet-palindroom enzym', () => {
  // HincII herkent GTYRAC: zowel GTTAAC als GTCGAC; knipt stomp midden in (GTY^RAC)
  assert.deepEqual(cuts('AAGTTAACAAGTCGACAA', 'HincII', false), [5, 13]);
  // BsaI GGTCTC(1/5) volgens REBASE: de bovenste streng wordt 1 base na de plaats geknipt, dus op positie 6 + 1 = 7
  assert.deepEqual(cuts('GGTCTCAAAAAAAAAA', 'BsaI', false), [7]);
  assert.deepEqual(siteStarts('GGTCTCAAGAGACC', 'BsaI'), [0, 8]); // beide strengen
});
