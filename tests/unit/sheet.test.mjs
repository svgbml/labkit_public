import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sheetTSV} from '../../src/lib/sheet.js';

const rows = [{k: 'c1', label: 'Stock C₁', value: 50, unit: 'X'}, {k: 'c2', label: 'Gewenst C₂', value: 1, unit: 'X'},
  {k: 'v2', label: 'Eindvolume V₂', value: 500, unit: 'mL'}, {label: 'Volume stock V₁', value: '={c2}*{v2}/{c1}*0.001', unit: 'L'}];

test('sheetTSV: kop, getallen en een formule met celverwijzingen (nl)', () => {
  const s = sheetTSV(rows, 'nl', ['Grootheid', 'Waarde', 'Eenheid']).split('\r\n');
  assert.equal(s[0], 'Grootheid\tWaarde\tEenheid');
  assert.equal(s[1], 'Stock C₁\t50\tX');
  assert.equal(s[4], 'Volume stock V₁\t=B3*B4/B2*0,001\tL');
});

test('sheetTSV: in het Engels blijft de decimale punt', () => {
  const s = sheetTSV([{k: 'r', label: 'r', value: 8.4, unit: 'cm'}, {label: 'g', value: '=0.00001118*{r}*1000^2', unit: '× g'}], 'en', ['a', 'b', 'c']).split('\r\n');
  assert.equal(s[1], 'r\t8.4\tcm');
  assert.equal(s[2], 'g\t=0.00001118*B2*1000^2\t× g');
});

test('sheetTSV: een onbekende sleutel geeft een fout in plaats van een stille verkeerde verwijzing', () => {
  assert.throws(() => sheetTSV([{label: 'x', value: '={zz}*2'}], 'nl', ['a', 'b', 'c']));
});
