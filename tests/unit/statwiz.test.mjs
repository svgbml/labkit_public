import test from 'node:test';
import assert from 'node:assert/strict';
import '../../src/lib/helpers.js';
import {whichTest, brownForsythe, tableGroups} from '../../src/lib/statwiz.js';

const near = (a, b, e) => assert.ok(Math.abs(a - b) <= e, a + ' ≠ ' + b);
const PG = {
  ctrl: [4.17, 5.58, 5.18, 6.11, 4.50, 4.61, 5.17, 4.53, 5.33, 5.14],
  trt1: [4.81, 4.17, 4.41, 3.59, 5.87, 3.83, 6.03, 4.89, 4.32, 4.69],
  trt2: [6.31, 5.12, 5.54, 5.50, 5.37, 5.29, 4.92, 6.15, 5.80, 5.26]};

test('whichTest: twee onafhankelijke groepen, normaal → t-toets; niet normaal → Kruskal-Wallis', () => {
  assert.equal(whichTest({goal: 'groups', k: '2', paired: 'no', normal: 'yes'}).test, 't2');
  assert.equal(whichTest({goal: 'groups', k: '2', paired: 'no', normal: 'unknown'}).test, 't2');
  assert.equal(whichTest({goal: 'groups', k: '2', paired: 'no', normal: 'no'}).test, 'kw');
});

test('whichTest: gepaard → gepaarde t-toets of Wilcoxon', () => {
  assert.equal(whichTest({goal: 'groups', k: '2', paired: 'yes', normal: 'yes'}).test, 'tp');
  assert.equal(whichTest({goal: 'groups', k: '2', paired: 'yes', normal: 'no'}).test, 'wil');
});

test('whichTest: drie of meer groepen, één of twee factoren, herhaalde metingen', () => {
  assert.equal(whichTest({goal: 'groups', k: '3', paired: 'no', factors: '1', normal: 'yes'}).test, 'anova');
  assert.equal(whichTest({goal: 'groups', k: '3', paired: 'no', factors: '1', normal: 'no'}).test, 'kw');
  assert.equal(whichTest({goal: 'groups', k: '3', paired: 'no', factors: '2'}).test, 'anova2');
  const r = whichTest({goal: 'groups', k: '3', paired: 'yes', normal: 'yes'});
  assert.equal(r.test, null); assert.ok(r.why.length > 10);
});

test('whichTest: de andere doelen', () => {
  assert.equal(whichTest({goal: 'desc'}).test, 'desc');
  assert.equal(whichTest({goal: 'mu', normal: 'yes'}).test, 't1');
  assert.equal(whichTest({goal: 'mu', normal: 'no'}).test, 'wil');
  assert.equal(whichTest({goal: 'rel'}).test, 'reg');
  assert.equal(whichTest({goal: 'count'}).test, 'chi');
  assert.equal(whichTest({goal: 'n'}).test, 'power');
});

test('brownForsythe: PlantGrowth gelijk aan car::leveneTest in R (F = 1,1192; df 2 en 27)', () => {
  const r = brownForsythe([PG.ctrl, PG.trt1, PG.trt2]);
  near(r.F, 1.1191857, 1e-6); assert.equal(r.df1, 2); assert.equal(r.df2, 27);
});

test('brownForsythe: ongelijke groepsgrootte (scipy.stats.levene, center=median)', () => {
  near(brownForsythe([[1, 2, 3, 4, 10], [2, 2.5, 3, 3.5]]).F, 1.4478440, 1e-6);
});

test('tableGroups: lange vorm (groep, waarde) met kop, Nederlandse komma', () => {
  const g = tableGroups('groep\tgewicht\nctrl\t4,17\nctrl\t5,58\ntrt1\t4,81\ntrt1\t4,17\ntrt1\t4,41\n');
  assert.deepEqual(g, [{name: 'ctrl', v: [4.17, 5.58]}, {name: 'trt1', v: [4.81, 4.17, 4.41]}]);
});

test('tableGroups: lange vorm met de groep in de tweede kolom en puntkomma', () => {
  assert.deepEqual(tableGroups('1,5;A\n2,5;B\n3;A'), [{name: 'A', v: [1.5, 3]}, {name: 'B', v: [2.5]}]);
});

test('tableGroups: brede vorm (een kolom per groep, ongelijke lengte)', () => {
  const g = tableGroups('ctrl\ttrt1\ttrt2\n4,17\t4,81\t6,31\n5,58\t4,17\t\n\t\t5,54');
  assert.deepEqual(g, [{name: 'ctrl', v: [4.17, 5.58]}, {name: 'trt1', v: [4.81, 4.17]}, {name: 'trt2', v: [6.31, 5.54]}]);
});

test('tableGroups: gewone invoer is geen tabel', () => {
  assert.equal(tableGroups('4,17 5,58 5,18'), null);
  assert.equal(tableGroups('ctrl: 4,17 5,58\ntrt1: 4,81 4,17'), null);
  assert.equal(tableGroups('ctrl\t4,17\t5,58\ntrt1\t4,81\t4,17'), null);   // rij per groep: dat leest stGroups al
  assert.equal(tableGroups(''), null);
});
