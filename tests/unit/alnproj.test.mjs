import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {alnProjectWrite, alnProjectRead, PROJ_KEYS} from '../../src/lib/alnproj.js';

const aln = readFileSync(new URL('../fixtures/aln/hedgehog.aln', import.meta.url), 'utf8');
const st = {txt: aln, dnd: '(a:0.1,b:0.2);', col: 'ident', cbs: true, thr: '70', motif: 'C[ST]', ord: 'hand', hand: [2, 0, 1], ref: '1', tr: '0', code: '1',
  gap: '20', from: '5', to: '300', xf: 'clustal', gm: 'mis', pa: '0', pb: '2', ct: '80', cl: '10', fgFrom: '1', fgTo: '100', fgPer: '40', fgTitle: 'Titel', fgCons: false};

test('schrijven en weer lezen geeft alles terug', () => {
  const r = alnProjectRead(alnProjectWrite(st, '1.18.1'));
  assert.equal(r.error, undefined);
  assert.equal(r.txt, aln);
  assert.equal(r.dnd, st.dnd);
  for (const k of PROJ_KEYS) assert.deepEqual(r.settings[k], st[k], k);
});

test('het bestand heeft de app- en toolmarkering en de versie', () => {
  const j = JSON.parse(alnProjectWrite(st, '1.2.3'));
  assert.equal(j.app, 'Labkit BML'); assert.equal(j.tool, 'aln'); assert.equal(j.versie, '1.2.3');
});

test('foute bestanden geven een melding, geen uitzondering', () => {
  assert.ok(alnProjectRead('geen json').error);
  assert.ok(alnProjectRead('{"app":"Labkit BML","data":{}}').error);   /* een sessiebestand is geen alignment-project */
  assert.ok(alnProjectRead('null').error);
  const r = alnProjectRead('{"app":"Labkit BML","tool":"aln","uitlijning":"x","instellingen":{"onbekend":1}}');
  assert.deepEqual(r.settings, {}); assert.equal(r.dnd, '');
});
