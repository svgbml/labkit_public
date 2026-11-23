import test from 'node:test';
import assert from 'node:assert/strict';
import {makeCase, parseCase, exampleSample, EXAMPLE_ID} from '../../src/lib/sangercase.js';
import {validate, naReport, summarize, toCsv, SNPS, RESULT_KEYS} from '../../src/lib/hiris.js';

const read = {name: 'a.ab1', meta: {sample: 'x'}, order: 'GATC', traces: {A: [1, 2], C: [0, 1], G: [3, 4], T: [0, 0]}, bases: 'AC', peaks: [1, 2], qual: [30, 40]};

test('een case bewaren en weer inlezen geeft hetzelfde terug', () => {
  const sheet = {panel: 'hirisplex', samples: [exampleSample()]};
  const c = makeCase({read, read2: null, batch: [read], win: '10', qthr: '20', hthr: '0,2', refText: '>r\nACGT', assay: null, assayKey: '', sheet}, '1.0');
  const p = parseCase(JSON.stringify(c));
  assert.equal(p.ok, true);
  assert.deepEqual(p.c.read, read); assert.deepEqual(p.c.batch, [read]); assert.deepEqual(p.c.sheet, sheet); assert.equal(p.c.refText, '>r\nACGT');
});

test('geen case, kapotte reads en geen JSON worden geweigerd', () => {
  assert.equal(parseCase('geen json').ok, false);
  assert.equal(parseCase(JSON.stringify({app: 'Labkit BML', data: {}})).ok, false);
  assert.equal(parseCase(JSON.stringify(makeCase({read: {bases: 'A'}, batch: []}))).ok, false);
});

test('het voorbeeld is volledig, geldig en geeft een csv en een samenvatting', () => {
  const s = exampleSample();
  assert.equal(s.id, EXAMPLE_ID);
  assert.deepEqual(validate(s.vals, 'hirisplexs'), []);
  assert.equal(Object.keys(s.vals).length, 41); assert.equal(Object.keys(s.res).length, RESULT_KEYS.length);
  assert.ok(Object.values(s.vals).every(v => ['0', '1', '2', 'NA'].includes(v)));
  assert.equal(naReport(s.vals, 'hirisplexs').find(r => r.id === 'skin').na, 2);
  const csv = toCsv('hirisplexs', [s]).split('\n');
  assert.equal(csv[1].split(',').length, 42); assert.ok(csv[1].startsWith(EXAMPLE_ID + ',') || csv[1].startsWith('"' + EXAMPLE_ID));
  const sum = summarize(s.res, 0.7);
  assert.deepEqual(sum.map(x => [x.group, x.top, x.full]), [['eye', 'Bruin', true], ['hair', 'Bruin', true], ['shade', 'Donker', true], ['skin', 'Intermediair', true]]);
  assert.equal(SNPS.length, 41);
});
