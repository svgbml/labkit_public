import test from 'node:test';
import assert from 'node:assert/strict';
import {ask} from '../../src/lib/ask.js';

const CHEM = {'NaCl': 58.44, 'KCl': 74.55, 'Tris (base)': 121.14, 'Tris-HCl': 157.60, 'Glucose': 180.16};
const q = s => ask(s, CHEM);

test('Oplossing: volume, concentratie en stof, in elke volgorde en taal', () => {
  assert.deepEqual(q('500 mL 0,9% NaCl'), {tool: 'oplossing', v: {'o-v': 500, 'o-vu': 'mL'}, tb: {'o-tbl': [['NaCl', 58.44, 0.9, '% w/v']]}});
  assert.deepEqual(q('250 ml 0.1 M tris'), {tool: 'oplossing', v: {'o-v': 250, 'o-vu': 'mL'}, tb: {'o-tbl': [['Tris (base)', 121.14, 0.1, 'M']]}});
  assert.deepEqual(q('how much NaCl for 1 L 150 mM'), {tool: 'oplossing', v: {'o-v': 1, 'o-vu': 'L'}, tb: {'o-tbl': [['NaCl', 58.44, 150, 'mM']]}});
  // onbekende stof: de naam staat erin, de molmassa vult de student zelf in
  assert.deepEqual(q('100 mL 5 mM HEPES').tb['o-tbl'], [['HEPES', '', 5, 'mM']]);
});

test('Verdunning: een verhouding met eindvolume', () => {
  assert.deepEqual(q('1:10 van 50 mL'), {tool: 'verdunning', first: {'d-mode': 'een'},
    v: {'d-c1': 10, 'd-c1u': 'X', 'd-c2': 1, 'd-c2u': 'X', 'd-v1': '', 'd-v2': 50, 'd-v2u': 'mL'}});
});

test('Verdunning: gewenste concentratie uit een stock, met of zonder volume', () => {
  assert.deepEqual(q('10 µM uit 1 mM stock'), {tool: 'verdunning', first: {'d-mode': 'een'},
    v: {'d-c1': 1, 'd-c1u': 'mM', 'd-c2': 10, 'd-c2u': 'µM', 'd-v1': ''}});
  assert.deepEqual(q('make 500 uL of 2 mM from 100 mM').v,
    {'d-c1': 100, 'd-c1u': 'mM', 'd-c2': 2, 'd-c2u': 'mM', 'd-v1': '', 'd-v2': 500, 'd-v2u': 'µL'});
});

test('Centrifuge: toerental of g-kracht, met rotorstraal', () => {
  assert.deepEqual(q('4000 rpm rotor 10 cm'), {tool: 'centrifuge', v: {'z-r': 10, 'z-rpm': 4000}});
  assert.deepEqual(q('15000 x g bij 8,5 cm'), {tool: 'centrifuge', v: {'z-r': 8.5, 'z-g': 15000}});
  assert.deepEqual(q('3000 rpm'), {tool: 'centrifuge', v: {'z-rpm': 3000}});
});

test('Eenheden: omrekenen naar een andere eenheid, met de molmassa van een stof', () => {
  assert.deepEqual(q('5 mg/mL naar µM'), {tool: 'units', v: {'un-v': 5, 'un-u': 'mgmL'}});
  assert.deepEqual(q('0,9 % NaCl to mM'), {tool: 'units', v: {'un-v': 0.9, 'un-u': 'pct', 'un-mw': 58.44}});
});

test('Molmassa', () => {
  assert.deepEqual(q('molmassa NaCl'), {tool: 'molm', v: {'mm-f': 'NaCl'}});
  assert.deepEqual(q('molar mass of CuSO4·5H2O'), {tool: 'molm', v: {'mm-f': 'CuSO4·5H2O'}});
});

test('gewone zoekwoorden zijn geen vraag', () => {
  for (const s of ['pcr', 'verdunning', 'ANOVA', '', 'NaCl', '500 mL', 'week 3']) assert.equal(q(s), null, s);
});
