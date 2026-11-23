import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../../src/lib/helpers.js';
import {plateRead, plateRows} from '../../src/lib/platereader.js';

/* tests/fixtures/platereader: dezelfde plaat in vier exportvormen; waarde = 0,05 + 0,1·rij + 0,013·kolom
   (rij 0–7, kolom 0–11), H12 verzadigd (Gen5 OVRFLW, Tecan en BMG OVER, SoftMax Range?) */
const F = f => readFileSync(new URL('../fixtures/platereader/' + f, import.meta.url), 'utf8');
const expect = {};
for (let r = 0; r < 8; r++) for (let c = 0; c < 12; c++) if (!(r === 7 && c === 11)) expect['ABCDEFGH'[r] + (c + 1)] = +(0.05 + 0.1 * r + 0.013 * c).toFixed(3);

for (const [file, format] of [['gen5.txt', 'grid'], ['tecan.csv', 'tecan'], ['softmax.txt', 'softmax'], ['bmg.csv', 'list']]) {
  test('plaatlezer: ' + file + ' wordt herkend en gelezen', () => {
    const r = plateRead(F(file));
    assert.equal(r.format, format);
    assert.deepEqual(r.plates[0].wells, expect);
    assert.equal(r.plates[0].rows, 8); assert.equal(r.plates[0].cols, 12);
    assert.equal(r.notes.length, 1); assert.equal(r.notes[0].n, 1); // H12 verzadigd
  });
}

test('plaatlezer: Gen5 met twee golflengten geeft twee platen met hun naam', () => {
  const r = plateRead(F('gen5.txt'));
  assert.deepEqual(r.plates.map(p => p.name), ['450', '570']);
  assert.equal(Object.keys(r.plates[1].wells).length, 96);
  assert.equal(r.plates[1].wells.H12, 0.041);
});

test('plaatlezer: plateRows geeft rij A–H met 12 waarden, NaN voor een leeg putje', () => {
  const rows = plateRows(plateRead(F('tecan.csv')).plates[0]);
  assert.deepEqual(Object.keys(rows), [...'ABCDEFGH']);
  assert.equal(rows.A[0], 0.05); assert.ok(Number.isNaN(rows.H[11]));
});

test('plaatlezer: decimale komma en puntkomma als scheiding', () => {
  const t = ['<>;1;2;3', 'A;0,5;1,25;2', 'B;3;4;5,5'].join('\n');
  const r = plateRead(t);
  assert.equal(r.format, 'tecan'); assert.equal(r.plates[0].wells.A2, 1.25); assert.equal(r.plates[0].wells.B3, 5.5);
});

test('plaatlezer: tekst zonder plaat geeft niets', () => {
  assert.deepEqual(plateRead('geen plaat hier\n1 2 3').plates, []);
});
