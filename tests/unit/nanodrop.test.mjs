import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../../src/lib/helpers.js';
import {nanodropRead} from '../../src/lib/nanodrop.js';

/* tests/fixtures/nanodrop: dezelfde drie monsters als NanoDrop 2000-rapport (tab) en als NanoDrop One-export (csv) */
const F = f => readFileSync(new URL('../fixtures/nanodrop/' + f, import.meta.url), 'utf8');
const near = (a, b, e = 1e-3) => assert.ok(Math.abs(a - b) <= e, a + ' ≠ ' + b);

for (const [file, format] of [['nd2000.tsv', 'nd2000'], ['one.csv', 'one']]) {
  test('nanodropRead: ' + file, () => {
    const r = nanodropRead(F(file));
    assert.equal(r.format, format);
    assert.deepEqual(r.rows.map(x => x.name), ['S1', 'S2', 'S3']);
    near(r.rows[0].a260, 1.7); near(r.rows[0].a280, 0.919); near(r.rows[0].conc, 85);
    near(r.rows[0].a230, 1.7 / 2.1);                 // alleen de ratio staat in de export
    near(r.rows[2].r280, 2.0);
    /* 50 ng/µL per A260-eenheid (dsDNA): de concentratie in de export volgt uit A260 */
    r.rows.forEach(x => near(x.a260 * 50, x.conc, 0.11));
  });
}

test('nanodropRead: puntkomma en decimale komma (Nederlandse Excel)', () => {
  const r = nanodropRead('Sample Name;Nucleic Acid(ng/uL);A260/A280;A260/A230;A260 (Abs);A280 (Abs)\nX;42,5;1,9;2,0;0,850;0,447\n');
  near(r.rows[0].a260, 0.85); near(r.rows[0].a230, 0.425);
});

test('nanodropRead: geen NanoDrop-kop', () => {
  assert.deepEqual(nanodropRead('a,b\n1,2'), {format: '', rows: []});
});
