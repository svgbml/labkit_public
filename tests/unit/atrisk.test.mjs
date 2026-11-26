import test from 'node:test';
import assert from 'node:assert/strict';
import {riskTimes, atRisk} from '../../src/lib/atrisk.js';

test('riskTimes: ronde stappen van 0 tot en met het einde', () => {
  assert.deepEqual(riskTimes(25), [0, 5, 10, 15, 20, 25]);
  assert.deepEqual(riskTimes(15), [0, 5, 10, 15]);
  assert.deepEqual(riskTimes(3.4), [0, 1, 2, 3]);
  assert.deepEqual(riskTimes(0.9), [0, 0.2, 0.4, 0.6, 0.8]);
  assert.deepEqual(riskTimes(0), [0]);
});

test('atRisk: wie op tijd t nog in de studie is (tijd ≥ t), per groep', () => {
  const R = [{g: 'a', t: 3}, {g: 'a', t: 5}, {g: 'a', t: 10}, {g: 'b', t: 5}, {g: 'b', t: 12}];
  assert.deepEqual(atRisk(R, ['a', 'b'], [0, 5, 10]), [[3, 2, 1], [2, 2, 1]]);
});
