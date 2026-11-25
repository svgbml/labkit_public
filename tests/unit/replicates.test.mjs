import test from 'node:test';
import assert from 'node:assert/strict';
import {repCheck} from '../../src/lib/replicates.js';

const near = (a, b, e = 1e-4) => assert.ok(Math.abs(a - b) <= e, a + ' ≠ ' + b);

test('repCheck: gemiddelde, SD (n − 1) en CV met de hand', () => {
  const r = repCheck([10.1, 10.3, 9.9]);           // SD = 0,2; CV = 0,2 / 10,1 = 1,980 %
  near(r.mean, 10.1); near(r.sd, 0.2); near(r.cv, 1.9802); assert.equal(r.high, false); assert.equal(r.out, -1);
});

test('repCheck: Grubbs vindt één uitschieter (G = 2,2 / 1,2349 = 1,782 > 1,715 voor n = 5)', () => {
  const r = repCheck([10.0, 10.2, 10.1, 10.3, 12.9]);
  near(r.G, 1.7815); assert.equal(r.out, 4);
});

test('repCheck: net onder de grens is geen uitschieter, CV boven de grens wel gemeld', () => {
  const r = repCheck([10, 12, 14], 15);             // G = 1,0 < 1,155; CV = 2 / 12 = 16,7 %
  assert.equal(r.out, -1); assert.equal(r.high, true);
});

test('repCheck: lege cellen tellen niet mee, de index wijst naar de invoer', () => {
  const r = repCheck(['', 10.0, 10.2, 10.1, 10.3, 12.9]);
  assert.equal(r.n, 5); assert.equal(r.out, 5);
  assert.equal(repCheck([5]), null);
});
