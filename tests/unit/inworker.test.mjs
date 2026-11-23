import test from 'node:test';
import assert from 'node:assert/strict';
import {inWorker, fnSource} from '../../src/lib/inworker.js';

/* Node heeft geen Web Worker: dan draait alles op de hoofddraad, met dezelfde belofte-API.
   Het pad met een echte Worker (ook vanaf file://) staat in tests/worker_check.py. */
const fns = {add: (a, b) => a + b, boom: () => { throw new Error('kapot'); }};

test('zonder Worker: synchroon, zelfde antwoord als een belofte', async () => {
  const w = inWorker(fnSource(fns), fns);
  assert.equal(w.mode, 'sync');
  assert.equal(await w.call('add', [2, 3]), 5);
});

test('een fout in de functie wordt een afgewezen belofte', async () => {
  const w = inWorker(null, fns);
  await assert.rejects(w.call('boom', []), /kapot/);
});

test('een onbekende naam wordt afgewezen', async () => {
  await assert.rejects(inWorker(null, fns).call('weg', []), /weg/);
});

test('fnSource maakt een werkerbron met de functies op naam', () => {
  const s = fnSource({add: fns.add});
  assert.match(s, /"add":\(a, b\) => a \+ b/);
  assert.match(s, /onmessage/);
});
