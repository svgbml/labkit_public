import test from 'node:test';
import assert from 'node:assert/strict';
import '../../src/lib/helpers.js';
import {balanceSet, balanceNext} from '../../src/lib/balance.js';
import {overage} from '../../src/lib/overage.js';
import {pipAdvice} from '../../src/lib/pip.js';
import {trimWindow} from '../../src/lib/sangertrim.js';
import {alnDetect} from '../../src/lib/alignment.js';

test('rotorbalans: som van de plaatsvectoren is nul', () => {
  const sum = (n, set) => [set.reduce((s, i) => s + Math.cos(2 * Math.PI * i / n), 0), set.reduce((s, i) => s + Math.sin(2 * Math.PI * i / n), 0)];
  assert.deepEqual(balanceSet(12, 2), [0, 6]); // tegenover elkaar
  assert.deepEqual(balanceSet(12, 3), [0, 4, 8]); // 120 graden
  assert.equal(balanceSet(12, 1), null); // één buis kan nooit balanceren
  for (const k of [4, 5, 6, 8, 10]) {
    const s = balanceSet(12, k);
    assert.equal(s.length, k);
    sum(12, s).forEach(v => assert.ok(Math.abs(v) < 1e-9));
  }
  assert.equal(balanceNext(12, 1), 2);
});

test('overmaat mastermix', () => {
  assert.equal(overage(10, 'plus1').mult, 11);
  assert.equal(overage(10, 'none').mult, 10);
  assert.ok(Math.abs(overage(10, 'pct', 10).mult - 11) < 1e-12);
  assert.ok(Math.abs(overage(10, 'pct', NaN).mult - 10) < 1e-12);
});

test('pipetadvies: werkbereik 10-100% van het nominale volume', () => {
  assert.deepEqual(pipAdvice(5), {pip: 'P10', warn: false});
  assert.deepEqual(pipAdvice(150), {pip: 'P200', warn: false});
  assert.deepEqual(pipAdvice(0.5), {pip: 'P2', warn: true}); // 0,2-2 µL, onder 1 µL waarschuwing
  assert.equal(pipAdvice(1500).pip, ''); // boven P1000 geen advies
  assert.equal(pipAdvice(0), null);
});

test('sangertrim: schuivend venster (Trimmomatic SLIDINGWINDOW)', () => {
  // venster 2, drempel 20: eerste goede venster begint op base 3, laatste goede eindigt op base 6
  assert.deepEqual(trimWindow([5, 5, 30, 30, 30, 30, 5, 5], 2, 20), {start: 3, end: 6});
  assert.equal(trimWindow([5, 5, 5, 5], 2, 20), null);
  assert.equal(trimWindow([30], 2, 20), null); // korter dan het venster
});

test('alignment: formaat herkennen aan de eerste regel', () => {
  assert.equal(alnDetect('CLUSTAL W (1.83) multiple sequence alignment\n'), 'clustal');
  assert.equal(alnDetect('#NEXUS\nbegin data;'), 'nexus');
  assert.equal(alnDetect('hallo wereld'), null);
});
