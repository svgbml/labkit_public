import test from 'node:test';
import assert from 'node:assert/strict';
import {TEACH, parseAssay} from '../../src/lib/sangeralign.js';
import {readSeq, callSample, genotypeRows, overlayStrips} from '../../src/lib/sangerbatch.js';

/* tien verzonnen reads van het oefenpanel (basen 16–225), elk met een ander genotype op OEF-1 (pos 60) en OEF-3 (pos 180) */
const {assay} = parseAssay(TEACH);
const mk = (i, b1, b3) => {
  const a = TEACH.ref.split(''); a[59] = b1; a[179] = b3;
  return {name: 'monster' + i, bases: a.slice(15, 225).join(''), traces: null, peaks: [], qual: []};
};
const GT = [['C', 'G'], ['T', 'G'], ['Y', 'G'], ['C', 'A'], ['T', 'A'], ['Y', 'A'], ['C', 'R'], ['T', 'R'], ['Y', 'R'], ['C', 'G']];

test('tien bestanden geven tien rijen', () => {
  const reads = GT.map((g, i) => mk(i + 1, g[0], g[1])), ss = reads.map(r => callSample(r, assay.ref, assay));
  const rows = genotypeRows(ss, assay);
  assert.equal(rows.length, 10);
  assert.equal(rows[0].length, 2 + assay.snps.length);
  assert.deepEqual(rows.map(r => r[2]), ['C/C', 'T/T', 'C/T', 'C/C', 'T/T', 'C/T', 'C/C', 'T/T', 'C/T', 'C/C']);
  assert.deepEqual(rows.map(r => r[4]), ['G/G', 'G/G', 'G/G', 'A/A', 'A/A', 'A/A', 'G/A', 'G/A', 'G/A', 'G/G']);
});

test('een read zonder uitlijning geeft een streepje', () => {
  const s = callSample({name: 'rommel', bases: 'ACGTACGTACGTACGTACGTAAAAAAAAAAAAAAA', traces: null, peaks: [], qual: []}, assay.ref, assay);
  assert.equal(genotypeRows([s], assay)[0][2], '–');
});

test('overlay: een strook per monster, zonder trace alleen de base', () => {
  const ss = [mk(1, 'C', 'G'), mk(2, 'T', 'G')].map(r => Object.assign(callSample(r, assay.ref, assay), {read: r}));
  const st = overlayStrips(ss, 0, 8, 300);
  assert.equal(st.length, 2);
  assert.equal(st[0].base, 'C'); assert.equal(st[1].base, 'T'); assert.equal(st[0].traces, null);
});

test('readSeq past bewerkingen toe', () => {
  assert.equal(readSeq({bases: 'ACGT', edits: {1: 'N'}}, 0.2), 'ANGT');
});
