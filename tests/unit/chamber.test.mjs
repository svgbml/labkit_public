import test from 'node:test';
import assert from 'node:assert/strict';
import {chamber, VAK_DEFAULT} from '../../src/lib/chamber.js';

/* 100 eenheden = 1 mm, dus een vak van a mm² is √a × 100 eenheden breed */
const side = a => Math.sqrt(a) * 100;

test('chamber: elk vak heeft de oppervlakte die KSQ noemt', () => {
  for (const [ch, areas] of [['0.1', [1, 0.04, 0.0025]], ['0.1n', [1, 0.0625, 0.04, 0.0025]], ['0.2', [1, 0.0625]]]) {
    for (const a of areas) {
      const c = chamber(ch, a);
      assert.ok(c.cells.length >= 4, ch + ' ' + a);
      for (const v of c.cells) assert.ok(Math.abs(v.s - side(a)) < 1e-9, ch + ' ' + a + ': ' + v.s);
    }
  }
});

test('chamber: Neubauer, grote vakken: eerst de vier hoeken, dan het midden', () => {
  const c = chamber('0.1n', 1);
  assert.equal(c.w, 300);
  assert.deepEqual(c.cells.slice(0, 5).map(v => [v.x, v.y]), [[0, 0], [200, 0], [0, 200], [200, 200], [100, 100]]);
});

test('chamber: groepsvakken liggen in het middelste grote vak, hoeken en midden eerst', () => {
  const c = chamber('0.1', 0.04);
  assert.deepEqual(c.cells.slice(0, 5).map(v => [v.x, v.y]), [[100, 100], [180, 100], [100, 180], [180, 180], [140, 140]]);
  assert.equal(c.cells.length, 25);
  for (const v of c.cells) assert.ok(v.x >= 100 && v.x + v.s <= 200 && v.y >= 100 && v.y + v.s <= 200);
});

test('chamber: geen vak dubbel, en alles binnen de kamer', () => {
  for (const [ch, a] of [['0.1n', 0.0625], ['0.1', 0.0025], ['0.2', 1], ['0.2', 0.0625]]) {
    const c = chamber(ch, a), keys = new Set(c.cells.map(v => v.x + ',' + v.y));
    assert.equal(keys.size, c.cells.length, ch + ' ' + a);
    for (const v of c.cells) assert.ok(v.x >= 0 && v.y >= 0 && v.x + v.s <= c.w + 1e-9 && v.y + v.s <= c.w + 1e-9);
  }
  assert.equal(chamber('0.2', 1).w, 400);
});

test('VAK_DEFAULT: vijf groepsvakken, anders vier', () => {
  assert.equal(VAK_DEFAULT(0.04), 5); assert.equal(VAK_DEFAULT(1), 4); assert.equal(VAK_DEFAULT(0.0625), 4);
});
