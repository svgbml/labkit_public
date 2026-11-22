import test from 'node:test';
import assert from 'node:assert/strict';
import '../../src/lib/helpers.js'; // zet de helpers op globalThis
const {num, fmt, sig, sci, vol, mass, list, esc, hexRgb, rgbHex, mixHex} = globalThis;

test('num: Nederlandse en Engelse notatie', () => {
  assert.equal(num('1,5'), 1.5);
  assert.equal(num('1.234,56'), 1234.56); // punt = duizendtal als er ook een komma is
  assert.equal(num('1,234.56'), 1234.56);
  assert.equal(num(' 1 000 '), 1000);
  assert.ok(Number.isNaN(num('')));
  assert.ok(Number.isNaN(num(null)));
  assert.ok(Number.isNaN(num('abc')));
});

test('fmt en sig (nl-NL)', () => {
  assert.equal(fmt(3.14159, 2), '3,14');
  assert.equal(fmt(NaN), '–');
  assert.equal(sig(0.012345, 3), '0,0123'); // 3 significante cijfers
  assert.equal(sig(0), '0');
  assert.equal(sig(Infinity), '–');
});

test('sci, vol en mass kiezen de eenheid', () => {
  assert.equal(sci(1.5e-6), '1,5 × 10<sup>-6</sup>');
  assert.equal(vol(0.5), '0,5 µL');
  assert.equal(vol(2500), '2,5 mL');
  assert.equal(mass(0.0025), '2,5 mg');
  assert.equal(mass(2), '2 g');
});

test('list: komma als decimaal, meerdere komma\'s als scheiding', () => {
  assert.deepEqual(list('1,5 2'), [1.5, 2]);
  assert.deepEqual(list('1,2,3'), [1, 2, 3]);
});

test('esc en kleuren', () => {
  assert.equal(esc('<a href="x">&</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
  assert.deepEqual(hexRgb('#fff'), [255, 255, 255]);
  assert.equal(rgbHex([255, 0, 0]), '#ff0000');
  assert.equal(mixHex('#000000', '#ffffff', 0.5), '#808080'); // 127,5 rondt naar 128
});
