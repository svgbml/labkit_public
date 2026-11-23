import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseNewick, treeLeaves, treeLayout, treeSvg} from '../../src/lib/tree.js';

const fx = f => readFileSync(new URL('../fixtures/aln/' + f, import.meta.url), 'utf8');
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, a + ' ≠ ' + b);

test('Clustal .dnd over meerdere regels: vorm, namen en takken', () => {
  const r = parseNewick(fx('small.dnd'));
  assert.equal(r.error, undefined);
  const t = r.root;
  /* Clustal schrijft de wortel als drietak */
  assert.equal(t.kids.length, 3);
  const [ab, cd, e] = t.kids;
  assert.deepEqual(ab.kids.map(k => [k.name, k.len]), [['A', 0.1], ['B', 0.2]]);
  assert.equal(ab.len, 0.05);
  assert.deepEqual(cd.kids.map(k => [k.name, k.len]), [['C', 0.3], ['D e', 0.4]]);
  assert.equal(cd.len, 0.06);
  assert.deepEqual([e.name, e.len], ['E', 0.7]);
  assert.deepEqual(treeLeaves(t), ['A', 'B', 'C', 'D e', 'E']);
});

test('quotes, commentaar, namen van binnenknopen en ontbrekende lengtes', () => {
  const t = parseNewick("((a,'it''s':2)x:1.5[&&NHX:S=1],c)root;").root;
  assert.equal(t.name, 'root');
  assert.equal(t.kids[0].name, 'x'); assert.equal(t.kids[0].len, 1.5);
  assert.equal(t.kids[0].kids[0].len, null);
  assert.equal(t.kids[0].kids[1].name, "it's");
  assert.deepEqual(treeLeaves(t), ['a', "it's", 'c']);
});

test('kapotte tekst geeft een foutmelding', () => {
  assert.ok(parseNewick('((a,b);').error);
  assert.ok(parseNewick('(a,b));').error);
  assert.ok(parseNewick('').error);
  assert.ok(parseNewick('(a:x,b);').error);
});

test('rechthoekig: de x van een blad is de som van de takken vanaf de wortel', () => {
  const L = treeLayout(parseNewick(fx('small.dnd')).root, {mode: 'rect', rowH: 20});
  const x = Object.fromEntries(L.leaves.map(l => [l.name, l.d]));
  close(x.A, 0.15); close(x.B, 0.25); close(x.C, 0.36); close(x['D e'], 0.46); close(x.E, 0.7);
  /* bladen onder elkaar in leesvolgorde, een rij per blad */
  assert.deepEqual(L.leaves.map(l => l.y), [0, 1, 2, 3, 4].map(i => L.top + i * 20 + 10));
  /* schaalstreep: een rond getal */
  assert.ok([0.1, 0.2, 0.5].includes(L.scale.len));
});

test('radiaal en SVG: elk blad een label, een schaalstreep, namen ge-escaped', () => {
  const t = parseNewick('((a:1,b:1):1,<c>:2);').root;
  for (const mode of ['rect', 'radial']) {
    const svg = treeSvg(treeLayout(t, {mode}));
    assert.match(svg, /^<svg[^>]*xmlns="http:\/\/www.w3.org\/2000\/svg"/);
    assert.equal((svg.match(/<text/g) || []).length, 3 + 1, mode);
    assert.ok(svg.includes('&lt;c&gt;'));
  }
});
