import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../../src/lib/helpers.js';
import {parseAlignment, alnColours, alnCls, alnConservation} from '../../src/lib/alignment.js';
import {alnFigure, figSvg, FIG} from '../../src/lib/alnfig.js';

const a = parseAlignment(readFileSync(new URL('../fixtures/aln/hedgehog.aln', import.meta.url), 'utf8'));
const tab = alnColours(a, 'clustalx'), cls = (i, c) => alnCls(tab, c, a.seqs[i][c]), fill = k => '#' + k;

test('blokken: aantal, breedte en elke kolom precies één keer per rij', () => {
  for (const per of [40, 60, 100]) {
    const f = alnFigure(a, {per, cls, fill});
    assert.equal(f.blocks, Math.ceil(a.len / per));
    assert.equal(f.W, Math.ceil(2 * FIG.PAD + f.nameW + per * FIG.CW));
    /* de reeksteksten van rij 0 over alle blokken aan elkaar zijn de hele rij */
    const mono = f.texts.filter(t => t[3].mono);
    assert.equal(mono.length, f.blocks * a.names.length);
    const row0 = mono.filter((_, i) => i % a.names.length === 0).map(t => t[2]).join('');
    assert.equal(row0, a.seqs[0]);
    assert.ok(mono.every(t => t[2].length <= per));
  }
});

test('een deel van de uitlijning: from/to in kolommen, 1-based en inclusief', () => {
  const f = alnFigure(a, {from: 11, to: 70, per: 30});
  assert.equal(f.blocks, 2);
  const row0 = f.texts.filter(t => t[3].mono).filter((_, i) => i % a.names.length === 0).map(t => t[2]).join('');
  assert.equal(row0, a.seqs[0].slice(10, 70));
  /* liniaalgetallen: 20, 30, ... in het eerste blok en 40..70 in het tweede */
  const nums = f.texts.filter(t => t[3].mute && /^\d+$/.test(t[2])).map(t => +t[2]);
  assert.deepEqual(nums, [20, 30, 40, 50, 60, 70]);
});

test('kleurvlakken: één rechthoek per run, samen precies de gekleurde cellen', () => {
  const f = alnFigure(a, {per: 60, cls, fill}), W = FIG.CW;
  let coloured = 0; for (let i = 0; i < a.names.length; i++) for (let c = 0; c < a.len; c++) if (cls(i, c)) coloured++;
  assert.equal(f.rects.reduce((s, r) => s + r[2] / W, 0), coloured);
});

test('volgorde en conserveringsregel', () => {
  const order = a.names.map((_, i) => a.names.length - 1 - i);
  const f = alnFigure(a, {per: 60, order, cls, fill, cons: alnConservation(a), consName: 'Conservering'});
  const names = f.texts.filter(t => t[3].bold && t[3].a === 'start').map(t => t[2]);
  assert.deepEqual(names.slice(0, a.names.length), order.map(i => a.names[i]));
  assert.equal(f.texts.filter(t => t[2] === 'Conservering').length, f.blocks);
});

test('SVG: afmeting, elke letter een x en speciale tekens ontsnapt', () => {
  const b = {...a, names: ['<a&b>', ...a.names.slice(1)]};
  const f = alnFigure(b, {per: 50, from: 1, to: 50, cls, fill, title: 'Titel "x"'}), s = figSvg(f);
  assert.match(s, new RegExp('viewBox="0 0 ' + f.W + ' ' + f.H + '"'));
  assert.ok(s.includes('&lt;a&amp;b&gt;') && s.includes('Titel &quot;x&quot;') && !s.includes('<a&b>'));
  assert.equal((s.match(/<text /g) || []).length, (s.match(/<\/text>/g) || []).length);
  const m = s.match(/<text x="([^"]+)"[^>]*>([^<]{50})<\/text>/);
  assert.equal(m[1].split(' ').length, 50);
});

test('leeg bereik geeft een lege figuur', () => { const f = alnFigure(a, {from: 50, to: 10}); assert.equal(f.W, 0); });
