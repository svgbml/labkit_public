import test from 'node:test';
import assert from 'node:assert/strict';
import {pcrTemplate, laneNames, laneSizes, MAPS, activeMaps} from '../../src/lib/flow.js';

test('pcrTemplate: zelfde rekensom als Stuur door naar (ng / concentratie, drie cijfers, minstens 0,01 µL)', () => {
  assert.equal(pcrTemplate(50, 10), 0.2);
  assert.equal(pcrTemplate(33.3, 10), 0.3);
  assert.equal(pcrTemplate(42.7, NaN), 0.234);   // geen gewenste input: 10 ng
  assert.equal(pcrTemplate(5000, 10), 0.01);
  assert.equal(pcrTemplate(0, 10), null); assert.equal(pcrTemplate(NaN, 10), null);
});

const LANES = [['Ladder', '5', '', '#c2410c'], ['Monster 1', '10', '500', '#1558b0']];

test('laneNames: de ladder blijft vooraan, elke naam krijgt een laan met de volumes van de eerste monsterlaan', () => {
  assert.deepEqual(laneNames(LANES, ['WT', 'KO', 'H2O']),
    [['Ladder', '5', '', '#c2410c'], ['WT', '10', '500', '#1558b0'], ['KO', '10', '500', '#1558b0'], ['H2O', '10', '500', '#1558b0']]);
  assert.deepEqual(laneNames(LANES, []), LANES);
  assert.deepEqual(laneNames([['M1', '10', '', '#000']], ['a']), [['a', '10', '', '#000']]);
});

test('laneSizes: elke monsterlaan met een naam krijgt de productgrootte, de ladder niet', () => {
  assert.deepEqual(laneSizes([...LANES, ['', '10', '', '#000']], 1234),
    [['Ladder', '5', '', '#c2410c'], ['Monster 1', '10', '1234', '#1558b0'], ['', '10', '', '#000']]);
  assert.deepEqual(laneSizes(LANES, NaN), LANES);
});

test('activeMaps: alleen mappings waarvan beide tools in de run zitten (de monsterlijst is er altijd)', () => {
  const ids = steps => activeMaps(steps).map(m => m.id);
  assert.deepEqual(ids(['dna', 'oligo', 'pcr', 'pcrcyclus', 'gplan', 'gel', 'gelfoto']), MAPS.map(m => m.id));
  assert.deepEqual(ids(['dna', 'pcr']), ['dna-pcr']);
  assert.deepEqual(ids(['gplan']), ['smp-gplan']);
  assert.deepEqual(ids(['pcrcyclus', 'dna']), []);
  assert.deepEqual(ids([]), []);
});
