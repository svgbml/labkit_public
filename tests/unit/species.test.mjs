import test from 'node:test';
import assert from 'node:assert/strict';
import {specFrac} from '../../src/lib/species.js';

const near = (a, b, e = 1e-6) => assert.ok(Math.abs(a - b) <= e, a + ' ≠ ' + b);

test('specFrac: bij pH = pKₐ is een eenwaardig zuur half gedissocieerd (Henderson-Hasselbalch)', () => {
  const [ha, a] = specFrac([4.76], 4.76); near(ha, 0.5); near(a, 0.5);
});

test('specFrac: één pH-eenheid boven de pKₐ is A⁻/HA = 10', () => {
  const [ha, a] = specFrac([4.76], 5.76); near(a / ha, 10, 1e-9); near(a, 10 / 11);
});

test('specFrac: fosforzuur bij pH 7,20 is H₂PO₄⁻ en HPO₄²⁻ elk bijna de helft', () => {
  const f = specFrac([2.15, 7.20, 12.35], 7.20);
  near(f[1], f[2], 1e-12); near(f.reduce((x, y) => x + y, 0), 1, 1e-12);
  // H₃PO₄/H₂PO₄⁻ = 10^(2,15−7,20), met de hand
  near(f[0] / f[1], 10 ** (2.15 - 7.20), 1e-12);
});

test('specFrac: geen over- of onderloop bij een sterk zuur', () => {
  const f = specFrac([-6], 14); assert.ok(f.every(isFinite)); near(f[1], 1);
});
