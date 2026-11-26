/* ================= PROJECTEN EN RUNS (S118) =================
   De pure kant: welke opslagsleutels bij een project horen, en hoe de invoer van de tools van
   een run wordt afgesplitst en teruggelegd. Een "toestand" is een gewoon object {sleutel: tekst}
   zoals het in localStorage staat; IndexedDB en de pagina zitten in src/legacy/projects.js.
   Zie docs/W1.md en docs/adr/0001. */

export const RUNS = 'labkit:v1:runs', WF = 'labkit:v1:wf', META = 'labkit:v1:projects';

/* voorkeuren en apparatuur blijven buiten projecten; al het andere van labkit: hoort erbij,
   zodat een nieuwe sleutel van een tool vanzelf per project is */
const GLOBAL = new Set(['recent', 'usage', 'fav', 'pins', 'navcol', 'stage', 'expert', 'lang', 'tour', 'seenver', 'upd',
  'rotors', 'sg-assays', 'timers', 'projects'].map(k => 'labkit:v1:' + k));
export const isProjectKey = k => k === 'sg-read' || (k.startsWith('labkit:') && !GLOBAL.has(k));

/* de sleutels die per tool zijn uit te splitsen; de rest (protocol, bench, monsternamen) blijft van het project */
const SPLIT = ['labkit:v1:inputs', 'labkit:v1:tables', 'labkit:v1:hist'];
/* in de tabellenopslag staan drie items die geen element-id zijn */
const TBLTOOL = {reeks: 'reeks', plate: 'plaat', curve: 'curve'};
const parse = s => { try { return JSON.parse(s || '{}') || {}; } catch (e) { return {}; } };

/* owner(sleutel, item-id): de tool waar het item bij hoort */
const owner = (key, id, toolOf) => (key.endsWith(':hist') ? id : key.endsWith(':tables') && TBLTOOL[id] ? TBLTOOL[id] : toolOf(id));

/* {run, rest}: run heeft alleen de uitsplitsbare sleutels met de items van de tools van de run */
export function splitRun(state, tools, toolOf) {
  const T = new Set(tools), run = {}, rest = {...state};
  for (const k of SPLIT) {
    if (state[k] == null) continue;
    const all = parse(state[k]), a = {}, b = {};
    for (const [id, v] of Object.entries(all)) (T.has(owner(k, id, toolOf)) ? a : b)[id] = v;
    run[k] = JSON.stringify(a); rest[k] = JSON.stringify(b);
  }
  return {run, rest};
}

/* de items van part over de toestand heen */
export function mergeRun(state, part) {
  const out = {...state};
  for (const k of SPLIT) if (part && part[k] != null) out[k] = JSON.stringify({...parse(state[k]), ...parse(part[k])});
  return out;
}

const meta = state => { const m = parse(state[RUNS]); return {active: m.active || null, list: m.list || [], shadow: m.shadow || null}; };

/* een run binnengaan: de losse invoer van zijn tools gaat opzij (shadow), zijn eigen invoer
   (data, of niets bij een nieuwe run) komt ervoor in de plaats */
export function enterRun(state, run, data, tools, toolOf) {
  const {run: shadow, rest} = splitRun(state, tools, toolOf), m = meta(state);
  const out = mergeRun(rest, data || {});
  out[RUNS] = JSON.stringify({...m, active: run.id, shadow});
  out[WF] = JSON.stringify({w: run.wf}); out[WF + ':at'] = JSON.stringify(run.at || '');
  return out;
}

/* de actieve run verlaten: {state, data, at}; data is wat de run moet bewaren */
export function leaveRun(state, tools, toolOf) {
  const m = meta(state), {run: data, rest} = splitRun(state, tools, toolOf);
  const out = mergeRun(rest, m.shadow || {});
  const at = parse(state[WF + ':at']);
  out[RUNS] = JSON.stringify({...m, active: null, shadow: null});
  out[WF] = JSON.stringify({}); out[WF + ':at'] = JSON.stringify('');
  return {state: out, data, at: typeof at === 'string' ? at : ''};
}

export const newId = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
