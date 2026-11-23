import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../../src/lib/helpers.js';
import {qpcrRead} from '../../src/lib/qpcrread.js';

/* tests/fixtures/qpcr: dezelfde run in drie exportvormen; Controle en Behandeld, GAPDH en IL6 in triplo, twee NTC zonder Ct */
const F = f => readFileSync(new URL('../fixtures/qpcr/' + f, import.meta.url), 'utf8');
const key = r => [r.s, r.t, r.ct].join('|');
const ref = qpcrRead(F('quantstudio.txt')).recs.map(key).sort();

for (const [file, format] of [['cfx.csv', 'cfx'], ['quantstudio.txt', 'quantstudio'], ['lightcycler.txt', 'lightcycler']]) {
  test('qPCR-export: ' + file, () => {
    const r = qpcrRead(F(file));
    assert.equal(r.format, format);
    assert.equal(r.recs.length, 12);
    assert.equal(r.undet, 2);
    assert.deepEqual(r.recs.map(key).sort(), ref);
  });
}

test('qPCR-export: waarden en putjes', () => {
  const r = qpcrRead(F('cfx.csv'));
  assert.deepEqual(r.recs[0], {well: 'A01', s: 'Controle', t: 'GAPDH', ct: 18.08});
  assert.equal(qpcrRead(F('lightcycler.txt')).recs.find(x => x.t === 'IL6').t, 'IL6');
});

test('qPCR-export: onbekende tekst geeft niets', () => {
  assert.deepEqual(qpcrRead('Sample\tTarget\tCq\nA\tB\t20'), {format: '', recs: [], undet: 0});
});
