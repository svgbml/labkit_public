import test from 'node:test';
import assert from 'node:assert/strict';
import {alnVariants, alnAddRead} from '../../src/lib/alnvar.js';

const A = (names, seqs) => ({format: 'fasta', names, seqs, len: seqs[0].length, cons: '', warn: []});
const hg = (a, r) => alnVariants(a, r).map(v => v.name + ' ' + v.hgvs);

test('varianten in referentienummering: gaten in de referentie tellen niet mee', () => {
  /* ref heeft een gat in kolom 3, dus referentiepositie 5 staat in kolom 6 */
  const a = A(['ref', 'x', 'y'], ['AC-GTACGT', 'ACAGTAGGT', 'AC-GTAC--']);
  assert.deepEqual(hg(a, 0), ['x g.2_3insA', 'x g.6C>G']);
  /* y stopt eerder: een gat aan het eind is geen deletie */
  assert.deepEqual(alnVariants(a, 0).filter(v => v.name === 'y'), []);
  const v = alnVariants(a, 0)[1];
  assert.equal(v.pos, 6); assert.equal(v.col, 7);
});

test('deletie volgt de 3\'-regel zoals in het chromatogram', () => {
  const a = A(['ref', 'x'], ['ACTTTGCA', 'AC-TTGCA']);
  assert.deepEqual(hg(a, 0), ['x g.5del']);
});

test('eiwit: eenletter-p.-notatie', () => {
  const a = A(['ref', 'x'], ['MKLV-W', 'MRL-QW']);
  assert.deepEqual(hg(a, 0), ['x p.K2R', 'x p.V4del', 'x p.V4_W5insQ']);
});

/* referentie van 120 basen, vast; de read is een stuk ervan met één substitutie */
let s = 11;
const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
let REF = '';
for (let i = 0; i < 120; i++) REF += 'ACGT'[Math.floor(rnd() * 4)];
const OTH = {A: 'C', C: 'G', G: 'T', T: 'A'};

test('een Sanger-read komt als rij in de uitlijning en zijn variant staat in de tabel', () => {
  /* de referentie heeft in de uitlijning een gat op kolom 40 (een insertie in een andere rij) */
  const refRow = REF.slice(0, 40) + '-' + REF.slice(40), other = REF.slice(0, 40) + 'G' + REF.slice(40);
  const a = A(['ref', 'ander'], [refRow, other]);
  const read = REF.slice(10, 100).split('');
  read[60 - 10] = OTH[REF[60]];
  const r = alnAddRead(a, 0, '>mijnread\n' + read.join(''));
  assert.ok(r.hit);
  assert.equal(r.aln.names[2], 'mijnread');
  assert.equal(r.aln.len, a.len);
  assert.equal(r.aln.seqs[2], '-'.repeat(10) + read.slice(0, 30).join('') + '-' + read.slice(30).join('') + '-'.repeat(20));
  assert.deepEqual(alnVariants(r.aln, 0).filter(v => v.name === 'mijnread').map(v => v.hgvs), ['g.61' + REF[60] + '>' + OTH[REF[60]]]);
});

test('een reverse read met een insertie krijgt een nieuwe kolom', () => {
  const a = A(['ref', 'b'], [REF, REF]);
  const fw = REF.slice(20, 110), ins = fw.slice(0, 45) + 'GGGG'.replace(/./g, (_, i) => i % 2 ? 'A' : 'C') + fw.slice(45);
  const rc = x => x.split('').reverse().map(c => ({A: 'T', T: 'A', C: 'G', G: 'C'})[c]).join('');
  const r = alnAddRead(a, 0, rc(ins));
  assert.equal(r.hit.strand, '-');
  assert.equal(r.aln.len, REF.length + 4);
  assert.equal(r.aln.seqs[0].replace(/-/g, ''), REF);
  assert.equal(r.aln.seqs[2].replace(/-/g, ''), ins);
  assert.equal(r.aln.names[2], 'Eigen read');
  assert.equal(alnVariants(r.aln, 0).filter(v => v.name === 'Eigen read').length, 1);
});

test('een read die niet past geeft geen rij', () => {
  const a = A(['ref'], [REF]);
  const r = alnAddRead(a, 0, 'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT');
  assert.equal(r.hit, null); assert.equal(r.aln, a);
});
