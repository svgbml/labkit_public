import {test} from 'node:test';
import assert from 'node:assert/strict';
import {relU} from '../../src/lib/uncert.js';

/* JCGM 100:2008 (GUM) vgl. (12): voor y = c·Π xᵢ^pᵢ is u_r(y)² = Σ (pᵢ·u(xᵢ)/xᵢ)² */
test('relU: product en quotiënt, relatieve onzekerheden tellen kwadratisch op', () => {
  // V1 = C2·V2/C1 met 1 %, 0,5 % en 2 % → √(1 + 0,25 + 4) % = 2,2913 %
  assert.ok(Math.abs(relU([[50, 0.5, 1], [500, 2.5, 1], [1, 0.02, -1]]) - Math.sqrt(5.25) / 100) < 1e-12);
});

test('relU: een macht telt met zijn exponent (RCF ∝ r·rpm²)', () => {
  // r 7 ± 0,07 cm (1 %), rpm 5000 ± 50 (1 %) → √(1² + 2²) % = 2,236 %
  assert.ok(Math.abs(relU([[7, 0.07, 1], [5000, 50, 2]]) - Math.sqrt(5) / 100) < 1e-12);
});

test('relU: zonder ingevulde onzekerheid NaN, een lege term telt niet mee', () => {
  assert.ok(Number.isNaN(relU([[7, NaN, 1], [5000, NaN, 2]])));
  assert.ok(Math.abs(relU([[7, NaN, 1], [5000, 50, 2]]) - 0.02) < 1e-15);
});
