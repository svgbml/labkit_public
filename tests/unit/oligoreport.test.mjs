import test from 'node:test';
import assert from 'node:assert/strict';
import {parseReport} from '../../src/lib/oligoreport.js';

test('syntheserapport: tabel met kopregel, tabs en een extra kolom', () => {
  const r = parseReport('Name\tSequence\tScale\tYield (nmol)\tMW (g/mol)\nFwd_1\tACGTACGTAC\t25 nmol\t28,4\t7650.2\nRev_1\tTTGGCCAATT\t25 nmol\t31.9\t7,812.5\nKapot\tACGT\t25nmol\t-\t7000');
  assert.deepEqual(r.oligos, [{name: 'Fwd_1', nmol: 28.4, mw: 7650.2}, {name: 'Rev_1', nmol: 31.9, mw: 7812.5}]);
  assert.equal(r.bad.length, 1);
});

test('syntheserapport: kopregel met een cijfer erin (OD260)', () => {
  const r = parseReport('Name\tOD260\tnmol\tMW (g/mol)\tTm\nFwd_1\t12.1\t45.3\t6231.1\t58.2\nRev_1\t10.4\t38,0\t6012,4\t57.9');
  assert.deepEqual(r.oligos, [{name: 'Fwd_1', nmol: 45.3, mw: 6231.1}, {name: 'Rev_1', nmol: 38, mw: 6012.4}]);
  assert.equal(r.bad.length, 0);
});

test('syntheserapport: regels met eenheden', () => {
  const r = parseReport('Order 12345\nFwd_GAPDH   28,4 nmol   7650,2 g/mol\nRev_GAPDH: 31.9 nmol, MW 7812.5 g/mol\nlos 12 nmol');
  assert.deepEqual(r.oligos, [{name: 'Fwd_GAPDH', nmol: 28.4, mw: 7650.2}, {name: 'Rev_GAPDH', nmol: 31.9, mw: 7812.5}]);
  assert.equal(r.bad.length, 1);
});

test('syntheserapport: een blok per oligo', () => {
  const r = parseReport('Oligo Name: P1\nYield: 40.1 nmol\nMolecular Weight: 6123.4\n\nOligo Name: P2\nYield (nmol): 12\nMW: 5900');
  assert.deepEqual(r.oligos, [{name: 'P1', nmol: 40.1, mw: 6123.4}, {name: 'P2', nmol: 12, mw: 5900}]);
  assert.equal(r.bad.length, 0);
});
