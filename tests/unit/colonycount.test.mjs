import test from 'node:test';
import assert from 'node:assert/strict';
import {countColonies} from '../../src/lib/colonycount.js';

/* een schaal van 240 × 240: donkere tafel, lichte wand, agar (r 100) met een verloop, 25 lichte
   kolonies (r 4) op een raster, één paar dat elkaar raakt, en een helder spikkeltje dat niet telt */
function dish() {
  const w = 240, h = 240, cx = 122, cy = 118, R = 100, d = new Uint8ClampedArray(w * h * 4);
  const dots = [];
  for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) dots.push([cx + 28 * i, cy + 28 * j]);
  dots.push([cx + 14 + 4, cy + 14], [cx + 14 - 4, cy + 14]);   // twee kolonies die elkaar raken
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const r = Math.hypot(x - cx, y - cy);
    let v = r > R + 6 ? 40 : r > R ? 180 : 90 + 0.1 * (x - cx);
    if (r < R && dots.some(([a, b]) => Math.hypot(x - a, y - b) <= 4)) v = 200;
    if (x === cx - 14 && y === cy - 14) v = 220;                // spikkel van één pixel
    d.set([v, v, v, 255], 4 * (y * w + x));
  }
  return {d, w, h, cx, cy, R};
}

test('kolonies tellen: schaal gevonden, kolonies en een raakpaar geteld, spikkel en rand genegeerd', () => {
  const {d, w, h, cx, cy, R} = dish(), out = countColonies(d, w, h);
  assert.ok(Math.abs(out.dish.x - cx) < 3 && Math.abs(out.dish.y - cy) < 3, JSON.stringify(out.dish));
  assert.ok(Math.abs(out.dish.r - R) < 4, JSON.stringify(out.dish));
  assert.equal(out.colonies.reduce((a, c) => a + c.n, 0), 27);
  assert.equal(out.colonies.filter(c => c.n === 2).length, 1);
});
