import test from 'node:test';
import assert from 'node:assert/strict';
import './setup.mjs';
import '../../src/lib/helpers.js';
import '../../src/lib/fit.js'; // zet lmfit op globalThis
import {aicc, weights, inhibFit, MODELS, rate} from '../../src/lib/inhib.js';

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} ${a} != ${b} (±${tol})`);

test('aicc: formule uit Burnham & Anderson (2002), n = 18, k = 3, RSS = 18 e^-2', () => {
  // n·ln(RSS/n) = 18·(−2) = −36; 2k = 6; 2k(k+1)/(n−k−1) = 24/14
  near(aicc(18, 3, 18 * Math.exp(-2)), -36 + 6 + 24 / 14, 1e-12);
});

test('weights: Δ = 0 en 2 ln 3 geven 0,75 en 0,25', () => {
  const w = weights([10, 10 + 2 * Math.log(3)]);
  near(w[0], 0.75, 1e-12); near(w[1], 0.25, 1e-12);
});

test('rate: competitief bij I = Ki verdubbelt Km (Copeland 2000, vgl. 8.2)', () => {
  const m = MODELS[0]; // v = Vmax·S/(Km(1+I/Ki)+S)
  near(rate(m, [100, 2, 1], 4, 1), 100 * 4 / (4 + 4), 1e-12); // 50
});

test('exacte competitieve data: competitief wint, Ki = 1 en Km = 2', () => {
  const S = [], V = [], I = [];
  for (const i of [0, 1, 3]) for (const s of [0.5, 1, 2, 4, 8, 16]) { S.push(s); I.push(i); V.push(100 * s / (2 * (1 + i) + s)); }
  const r = inhibFit(S, V, I), b = r.models[r.best];
  assert.equal(b.id, 'comp');
  near(b.p[0], 100, 1e-3); near(b.p[1], 2, 1e-4); near(b.p[2], 1, 1e-4);
  // gemengd bevat competitief: zonder precisiegrens verschilt alleen de AICc-straf, Δ = 2 + 40/13 − 24/14
  const d = 2 + 40 / 13 - 24 / 14;
  near(b.w, 1 / (1 + Math.exp(-d / 2)), 1e-6);
  assert.ok(b.w > 0.8);
});

test('exacte niet-competitieve data: niet-competitief wint', () => {
  const S = [], V = [], I = [];
  for (const i of [0, 1, 3]) for (const s of [0.5, 1, 2, 4, 8, 16]) { S.push(s); I.push(i); V.push(100 * s / ((2 + s) * (1 + i / 2))); }
  const r = inhibFit(S, V, I), b = r.models[r.best];
  assert.equal(b.id, 'non'); near(b.p[2], 2, 1e-3);
});

test('zonder remmer of te weinig punten: null', () => {
  assert.equal(inhibFit([1, 2, 3, 4, 5, 6], [1, 2, 3, 4, 5, 6], [0, 0, 0, 0, 0, 0]), null);
  assert.equal(inhibFit([1, 2, 3], [1, 2, 3], [0, 1, 1]), null);
});
