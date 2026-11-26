import test from 'node:test';
import assert from 'node:assert/strict';
import {COURSE, cleanSteps, saveOwn, removeOwn, shownOwn, addShared} from '../../src/lib/werkstroom.js';
import {isProjectKey} from '../../src/lib/projects.js';

const KNOWN = ['dna', 'pcr', 'pcrcyclus', 'gplan', 'gelfoto', 'telkamer', 'viab', 'seed', 'passage', 'medium', 'plaat', 'elisa', 'curve'];

test('COURSE: twee of drie algemene practicumsjablonen, alleen bestaande tools', () => {
  assert.ok(COURSE.length >= 2 && COURSE.length <= 3);
  for (const w of COURSE) { assert.equal(w.kind, 'course'); assert.ok(w.steps.length >= 2); assert.ok(w.steps.every(s => KNOWN.includes(s)), w.id); }
});

test('cleanSteps: onbekende tools en dubbele stappen gaan eruit, de volgorde blijft', () => {
  assert.deepEqual(cleanSteps(['dna', 'nope', 'pcr', 'dna', 'gplan'], KNOWN), ['dna', 'pcr', 'gplan']);
});

test('saveOwn: nieuw krijgt een id, bestaand wordt bijgewerkt', () => {
  const a = saveOwn([], {name: 'Mijn PCR', steps: ['dna', 'pcr']}, KNOWN);
  assert.equal(a.length, 1); assert.match(a[0].id, /^u/); assert.equal(a[0].kind, 'own');
  const b = saveOwn(a, {id: a[0].id, name: 'Mijn PCR 2', steps: ['pcr', 'gplan']}, KNOWN);
  assert.equal(b.length, 1); assert.deepEqual([b[0].n, b[0].steps], ['Mijn PCR 2', ['pcr', 'gplan']]);
});

test('removeOwn: verdwijnt uit de lijst, maar blijft bestaan voor runs die hem gebruiken', () => {
  const a = saveOwn([], {name: 'X', steps: ['dna', 'pcr']}, KNOWN), b = removeOwn(a, a[0].id);
  assert.equal(b.length, 1); assert.equal(b[0].gone, true); assert.equal(shownOwn(b).length, 0);
});

test('addShared: voegt een gedeelde werkstroom één keer toe', () => {
  const r1 = addShared([], {n: 'Van collega', s: ['dna', 'xx', 'gplan']}, KNOWN);
  assert.equal(r1.added, true); assert.deepEqual(r1.list[0].steps, ['dna', 'gplan']);
  const r2 = addShared(r1.list, {n: 'Van collega', s: ['dna', 'gplan']}, KNOWN);
  assert.equal(r2.added, false); assert.equal(r2.list.length, 1); assert.equal(r2.id, r1.id);
  assert.equal(addShared([], {n: 'Leeg', s: ['xx']}, KNOWN), null);
});

test('eigen werkstromen horen bij het apparaat, niet bij een project', () => {
  assert.equal(isProjectKey('labkit:v1:wfown'), false);
});
