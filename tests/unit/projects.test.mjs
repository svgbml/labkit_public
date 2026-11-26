import test from 'node:test';
import assert from 'node:assert/strict';
import {isProjectKey, splitRun, mergeRun, enterRun, leaveRun, RUNS, WF} from '../../src/lib/projects.js';

/* welk element bij welke tool hoort (in de app: de sectie waar het element in staat) */
const OWNER = {'n-a260': 'dna', 'q-t': 'pcr', 'q-tbl': 'pcr', 'v-c1': 'verdunning', 'gone-id': null};
const toolOf = id => OWNER[id] ?? null;
const J = JSON.stringify;
const state0 = () => ({
  'labkit:v1:inputs': J({'n-a260': '0,85', 'q-t': '2', 'v-c1': '10', 'gone-id': 'x'}),
  'labkit:v1:tables': J({'q-tbl': [['Taq', '1']], reeks: {a: 1}, curve: {model: 'lin'}}),
  'labkit:v1:hist': J({dna: [1], pcr: [2], verdunning: [3]}),
  'labkit:v1:proto': J({wt: 1}),
  'labkit:v1:samples': J(['s1'])
});

test('isProjectKey: invoer hoort bij het project, voorkeuren niet', () => {
  for (const k of ['labkit:v1:inputs', 'labkit:v1:tables', 'labkit:v1:hist', 'labkit:v1:bench', 'labkit:v1:benchnotes',
    'labkit:v1:samples', 'labkit:v1:wf', 'labkit:v1:wf:at', 'labkit:v1:runs', 'labkit:v1:notes', 'labkit:v1:teller', 'sg-read']) assert.ok(isProjectKey(k), k);
  for (const k of ['labkit:v1:pins', 'labkit:v1:fav', 'labkit:v1:recent', 'labkit:v1:usage', 'labkit:v1:expert', 'labkit:v1:navcol',
    'labkit:v1:stage', 'labkit:v1:lang', 'labkit:v1:tour', 'labkit:v1:seenver', 'labkit:v1:upd', 'labkit:v1:rotors',
    'labkit:v1:sg-assays', 'labkit:v1:timers', 'labkit:v1:projects', 'pipettes', 'lk-ncbi']) assert.ok(!isProjectKey(k), k);
});

test('splitRun: invoer, tabellen en geschiedenis van de tools van de run apart', () => {
  const {run, rest} = splitRun(state0(), ['dna', 'pcr'], toolOf);
  assert.deepEqual(JSON.parse(run['labkit:v1:inputs']), {'n-a260': '0,85', 'q-t': '2'});
  assert.deepEqual(JSON.parse(rest['labkit:v1:inputs']), {'v-c1': '10', 'gone-id': 'x'});
  assert.deepEqual(JSON.parse(run['labkit:v1:tables']), {'q-tbl': [['Taq', '1']]});
  assert.deepEqual(JSON.parse(rest['labkit:v1:tables']), {reeks: {a: 1}, curve: {model: 'lin'}});
  assert.deepEqual(JSON.parse(run['labkit:v1:hist']), {dna: [1], pcr: [2]});
  assert.equal(rest['labkit:v1:proto'], state0()['labkit:v1:proto']);
  assert.equal(run['labkit:v1:proto'], undefined);
});

test('splitRun: reeks, plaat en standaardcurve in de tabellen horen bij hun tool', () => {
  const {run} = splitRun(state0(), ['reeks', 'curve'], toolOf);
  assert.deepEqual(JSON.parse(run['labkit:v1:tables']), {reeks: {a: 1}, curve: {model: 'lin'}});
});

test('mergeRun: legt de waarden van de run over de rest', () => {
  const {run, rest} = splitRun(state0(), ['dna', 'pcr'], toolOf);
  const back = mergeRun(rest, run);
  for (const k of ['labkit:v1:inputs', 'labkit:v1:tables', 'labkit:v1:hist']) assert.deepEqual(JSON.parse(back[k]), JSON.parse(state0()[k]), k);
});

test('enterRun en leaveRun: de losse invoer komt ongeschonden terug, de run houdt zijn eigen waarden', () => {
  const run = {id: 'r1', name: 'PCR week 3', wf: 'pcrgel', at: 'pcr'}, tools = ['dna', 'pcr'];
  const s1 = enterRun(state0(), run, null, tools, toolOf);   // nieuwe, lege run
  const meta = JSON.parse(s1[RUNS]);
  assert.equal(meta.active, 'r1');
  assert.deepEqual(JSON.parse(s1['labkit:v1:inputs']), {'v-c1': '10', 'gone-id': 'x'});   // tools van de run leeg
  assert.deepEqual(JSON.parse(s1[WF]), {w: 'pcrgel'}); assert.equal(JSON.parse(s1[WF + ':at']), 'pcr');
  // in de run wordt de PCR anders ingevuld, en ook een tool buiten de run
  const inp = JSON.parse(s1['labkit:v1:inputs']); inp['q-t'] = '5'; inp['v-c1'] = '20'; s1['labkit:v1:inputs'] = J(inp);
  s1[WF + ':at'] = J('dna');
  const {state: s2, data, at} = leaveRun(s1, tools, toolOf);
  assert.deepEqual(JSON.parse(data['labkit:v1:inputs']), {'q-t': '5'});
  assert.equal(at, 'dna');
  assert.deepEqual(JSON.parse(s2['labkit:v1:inputs']), {'n-a260': '0,85', 'q-t': '2', 'v-c1': '20', 'gone-id': 'x'});
  assert.deepEqual(JSON.parse(s2[WF]), {}); assert.equal(JSON.parse(s2[RUNS]).active, null);
  // opnieuw in dezelfde run: zijn eigen PCR-waarde is terug
  const s3 = enterRun(s2, {...run, at}, data, tools, toolOf);
  assert.equal(JSON.parse(s3['labkit:v1:inputs'])['q-t'], '5');
  assert.equal(JSON.parse(s3['labkit:v1:inputs'])['n-a260'], undefined);
});

test('enterRun zonder runs-sleutel houdt de lijst van runs die er al is', () => {
  const s = state0(); s[RUNS] = J({active: null, list: [{id: 'r0'}, {id: 'r1'}]});
  const meta = JSON.parse(enterRun(s, {id: 'r1', wf: 'pcrgel', at: ''}, null, ['dna'], toolOf)[RUNS]);
  assert.deepEqual(meta.list.map(r => r.id), ['r0', 'r1']);
});
