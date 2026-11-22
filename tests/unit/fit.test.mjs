import test from 'node:test';
import assert from 'node:assert/strict';
import '../../src/lib/helpers.js'; // nums gebruikt num()
import '../../src/lib/fit.js'; // zet nums, mean, sd, ... op globalThis
const {nums, mean, sd, linreg, solveLin, invMat, lmfit} = globalThis;

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} ${a} != ${b} (±${tol})`);

test('mean en sd van een kleine set', () => {
  const x = [2, 4, 4, 4, 5, 5, 7, 9];
  assert.equal(mean(x), 5); // som 40 / 8
  near(sd(x), Math.sqrt(32 / 7), 1e-12); // steekproef-sd: SS = 32, n-1 = 7
  assert.equal(sd([3]), 0);
});

test('nums leest getallen met komma en scheiders', () => {
  assert.deepEqual(nums('1,5 2;3 x 4'), [1.5, 2, 3, 4]);
});

test('linreg: exacte lijn y = 2x + 1', () => {
  const r = linreg([0, 1, 2, 3], [1, 3, 5, 7]);
  near(r.a, 1, 1e-12); near(r.b, 2, 1e-12); near(r.r2, 1, 1e-12);
});

test('linreg: Anscombe-kwartet set I (Anscombe 1973): y = 3,00 + 0,500x, r² = 0,667', () => {
  const x = [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5];
  const y = [8.04, 6.95, 7.58, 8.81, 8.33, 9.96, 7.24, 4.26, 10.84, 4.82, 5.68];
  const r = linreg(x, y);
  near(r.a, 3.0, 0.01); near(r.b, 0.5, 0.01); near(r.r2, 0.667, 0.001);
});

test('solveLin en invMat', () => {
  // 2x + y = 4, x + 3y = 7  ->  x = 1, y = 2
  const s = solveLin([[2, 1], [1, 3]], [4, 7]);
  near(s[0], 1, 1e-12); near(s[1], 2, 1e-12);
  assert.equal(solveLin([[1, 2], [2, 4]], [1, 2]), null); // singulier
  // inverse van [[4,7],[2,6]] = 1/10 [[6,-7],[-2,4]] (determinant 10)
  const inv = invMat([[4, 7], [2, 6]]);
  [[0.6, -0.7], [-0.2, 0.4]].forEach((row, i) => row.forEach((v, j) => near(inv[i][j], v, 1e-12)));
  assert.equal(invMat([[1, 2], [2, 4]]), null);
});

test('lmfit vindt Michaelis-Menten uit exacte data (Vmax 10, Km 2)', () => {
  const f = (x, p) => p[0] * x / (p[1] + x);
  const xs = [0.5, 1, 2, 4, 8, 16], ys = xs.map(x => 10 * x / (2 + x));
  const r = lmfit(f, [5, 1], xs, ys);
  near(r.p[0], 10, 1e-4); near(r.p[1], 2, 1e-4); near(r.sse, 0, 1e-8);
});

test('lmfit vindt een exponentiële afname (A 3, k 0,5)', () => {
  const f = (x, p) => p[0] * Math.exp(-p[1] * x);
  const xs = [0, 1, 2, 3, 4, 5], ys = xs.map(x => 3 * Math.exp(-0.5 * x));
  const r = lmfit(f, [1, 0.1], xs, ys);
  near(r.p[0], 3, 1e-4); near(r.p[1], 0.5, 1e-4);
});
