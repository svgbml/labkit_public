import test from 'node:test';
import assert from 'node:assert/strict';
import {readName, groupReads, readSeq, callSample, callBatch, snpOverlay, genoMatrix} from '../../src/lib/sangerbatch.js';
import {TEACH, teachReads, parseRef} from '../../src/lib/sangeralign.js';

/* de twee oefenreads van het oefenpanel als read-objecten zonder trace (FASTA-terugval) */
const tr = teachReads();
const mk = (fname, fastaText) => ({name: fname, bases: parseRef(fastaText).seq, peaks: [], qual: [], traces: null});
const F = txt => mk('MON1_F.ab1', txt), R = txt => mk('MON1_R.ab1', txt);
const OPT = {hthr: 0.2, win: 10, q: 20};

test('readName: naam en richting uit de bestandsnaam', () => {
  assert.deepEqual(readName('MON1_F.ab1'), {name: 'MON1', dir: 'F'});
  assert.deepEqual(readName('MON1_R.ab1'), {name: 'MON1', dir: 'R'});
  assert.deepEqual(readName('monster-12-rev.fasta'), {name: 'monster-12', dir: 'R'});
  assert.deepEqual(readName('A7 forward.ab1'), {name: 'A7', dir: 'F'});
  assert.deepEqual(readName('plaat1_B03_fwd.ab1'), {name: 'plaat1_B03', dir: 'F'});
  /* geen richting in de naam: de hele naam zonder extensie is de monsternaam */
  assert.deepEqual(readName('zonderrichting.ab1'), {name: 'zonderrichting', dir: ''});
  /* een F die bij de naam hoort blijft staan: alleen een los token telt */
  assert.deepEqual(readName('MONF.ab1'), {name: 'MONF', dir: ''});
});

test('groupReads: twee reads van één monster komen in één groep', () => {
  const g = groupReads([F(tr.f), R(tr.r), mk('MON2_F.ab1', tr.f)]);
  assert.equal(g.length, 2);
  assert.deepEqual(g.map(x => x.name), ['MON1', 'MON2']);
  assert.deepEqual(g[0].reads.map(x => x.dir), ['F', 'R']);
  assert.equal(g[1].reads.length, 1);
  /* zonder richting in de naam wordt elk bestand zijn eigen monster */
  const h = groupReads([mk('a.ab1', tr.f), mk('b.ab1', tr.r)]);
  assert.deepEqual(h.map(x => x.name), ['a', 'b']);
});

test('readSeq: zonder trace blijven de basen zoals ze zijn, bewerkingen gaan erin', () => {
  const r = F(tr.f);
  assert.equal(readSeq(r, 0.2), r.bases);
  assert.equal(readSeq(Object.assign({}, r, {edits: {0: 'G'}}), 0.2)[0], 'G');
});

test('callSample: de genotypes van het oefenpanel, met de tegenspraak op OEF-2', () => {
  const s = callSample({name: 'MON1', reads: [{dir: 'F', read: F(tr.f)}, {dir: 'R', read: R(tr.r)}]}, TEACH.ref, TEACH, OPT);
  assert.equal(s.name, 'MON1');
  assert.equal(s.aligned, 2);
  const by = {};
  for (const g of s.gts) by[g.rs] = g;
  /* heterozygoot op OEF-1, beide reads eens */
  assert.equal(by['OEF-1'].gt, 'C/T');
  assert.equal(by['OEF-1'].het, true);
  assert.equal(by['OEF-1'].from, 'both');
  assert.equal(by['OEF-1'].conflict, false);
  /* OEF-2 staat op de minstreng: read 1 ziet T (A/A), read 2 ziet C (G/G) → tegenspraak, geen genotype */
  assert.equal(by['OEF-2'].conflict, true);
  assert.equal(by['OEF-2'].gt, '');
  assert.deepEqual(by['OEF-2'].gts, ['A/A', 'G/G']);
  /* homozygoot A op OEF-3 */
  assert.equal(by['OEF-3'].gt, 'A/A');
  assert.equal(by['OEF-3'].het, false);
  assert.equal(s.het, 1);
  assert.equal(s.na, 1);          // OEF-2 levert geen genotype
  assert.equal(s.conflicts, 1);
});

test('callSample: met één read is er niets om te bevestigen', () => {
  const s = callSample({name: 'MON1', reads: [{dir: 'F', read: F(tr.f)}]}, TEACH.ref, TEACH, OPT);
  const by = {};
  for (const g of s.gts) by[g.rs] = g;
  assert.equal(by['OEF-2'].gt, 'A/A');
  assert.equal(by['OEF-2'].from, 'F');
  assert.equal(s.conflicts, 0);
  assert.equal(s.na, 0);
});

test('callSample: een read die niet op de referentie past geeft alleen NA', () => {
  const s = callSample({name: 'X', reads: [{dir: '', read: mk('x.fasta', '>x\n' + 'ACGT'.repeat(50))}]}, TEACH.ref, TEACH, OPT);
  assert.equal(s.aligned, 0);
  assert.equal(s.na, 3);
  assert.deepEqual(s.gts.map(g => g.gt), ['', '', '']);
});

test('callBatch: tien bestanden geven tien rijen', () => {
  const reads = [];
  for (let i = 1; i <= 10; i++) reads.push(mk('MON' + i + '_F.ab1', tr.f));
  const res = callBatch(reads, TEACH.ref, TEACH, OPT);
  assert.equal(res.length, 10);
  assert.deepEqual(res.map(r => r.name), reads.map((r, i) => 'MON' + (i + 1)));
  assert.equal(res[0].gts.length, 3);
});

test('snpOverlay: per SNP de genotypes over alle monsters', () => {
  const a = callSample({name: 'A', reads: [{dir: 'F', read: F(tr.f)}]}, TEACH.ref, TEACH, OPT);
  const b = callSample({name: 'B', reads: [{dir: 'R', read: R(tr.r)}]}, TEACH.ref, TEACH, OPT);
  const ov = snpOverlay([a, b], TEACH);
  assert.equal(ov.length, 3);
  const o2 = ov.find(x => x.rs === 'OEF-2');
  assert.deepEqual(o2.counts, [['A/A', 1], ['G/G', 1]]);
  assert.deepEqual(o2.samples['A/A'], ['A']);
  assert.equal(o2.na, 0);
  const o1 = ov.find(x => x.rs === 'OEF-1');
  assert.deepEqual(o1.counts, [['C/T', 2]]);
  assert.equal(o1.het, 2);
});

test('genoMatrix: kop met de rs-nummers en één rij per monster', () => {
  const a = callSample({name: 'A', reads: [{dir: 'F', read: F(tr.f)}]}, TEACH.ref, TEACH, OPT);
  const m = genoMatrix([a], TEACH);
  assert.deepEqual(m.head, ['Monster', 'OEF-1', 'OEF-2', 'OEF-3']);
  assert.deepEqual(m.rows, [['A', 'C/T', 'A/A', 'A/A']]);
});
