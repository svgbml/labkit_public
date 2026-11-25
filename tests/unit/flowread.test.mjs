import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../../src/lib/helpers.js';
import {flowRead} from '../../src/lib/flowread.js';

/* tests/fixtures/flow: dezelfde twee buisjes als FlowJo-tabel (breed) en als FACSDiva-statistiek (lang) */
const F = f => readFileSync(new URL('../fixtures/flow/' + f, import.meta.url), 'utf8');
const by = (r, s, name, what) => r[what][s][r.pops.find(p => p.name === name).key];

for (const [file, format] of [['flowjo.csv', 'flowjo'], ['facsdiva.csv', 'facsdiva']]) {
  test('flowRead: ' + file, () => {
    const r = flowRead(F(file));
    assert.equal(r.format, format);
    assert.deepEqual(r.samples, ['T1.fcs', 'T2.fcs']);               // Mean en SD van FlowJo tellen niet mee
    assert.deepEqual(r.pops.map(p => p.name), ['Lymphocytes', 'Single Cells', 'CD3+', 'Beads']);
    assert.equal(by(r, 'T1.fcs', 'CD3+', 'pct'), 71.3);
    assert.equal(by(r, 'T2.fcs', 'Lymphocytes', 'pct'), 58);
    assert.equal(by(r, 'T1.fcs', 'CD3+', 'cnt'), 10234);
    assert.equal(by(r, 'T2.fcs', 'Beads', 'cnt'), 4870);
  });
}

test('flowRead: alleen % van het totaal, puntkomma en komma', () => {
  const r = flowRead(';A/B | Freq. of Total (%)\nX.fcs;12,5\n');
  assert.equal(r.pct['X.fcs']['A/B'], 12.5); assert.equal(r.pops[0].name, 'B');
});

test('flowRead: twee populaties met hetzelfde laatste stuk houden hun pad', () => {
  const r = flowRead(',A/CD4+ | Count,B/CD4+ | Count\nX,1,2\n');
  assert.deepEqual(r.pops.map(p => p.name), ['A/CD4+', 'B/CD4+']);
});

test('flowRead: geen herkende vorm', () => {
  assert.equal(flowRead('a,b\n1,2').format, '');
});
