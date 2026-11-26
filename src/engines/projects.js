/* ================= PROJECTEN EN RUNS IN DE BROWSER (S118) =================
   Het actieve project (en zijn actieve run) staat in localStorage zoals altijd, zodat geen
   tool hoeft te veranderen. Inactieve projecten en runs staan in IndexedDB `labkit-projects`.
   Wisselen pakt het huidige in, het andere uit en herlaadt de pagina (docs/adr/0001).
   De lijst van projecten staat in de globale sleutel labkit:v1:projects; de runs van het
   actieve project in labkit:v1:runs (een projectsleutel, dus hij wisselt mee). */
import {isProjectKey, splitRun, enterRun, leaveRun, RUNS, WF as WFK, META, newId} from '../lib/projects.js';
import {libListFull, libPut, gelProject} from '../tools/gelfoto/library.js';
import {expose} from '../lib/global.js';
import {OWNKEY, addShared} from '../lib/werkstroom.js';
import {dbGet, dbPut, dbDel, dbAll, dropProject, clearAll} from './store.js';

/* ---------- opslag: IndexedDB in de browser, bestanden in het programma (src/engines/store.js) ---------- */
export {dbGet, dbPut, dbDel, dbAll};

/* ---------- localStorage ---------- */
const ls = () => { const o = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (isProjectKey(k)) o[k] = localStorage.getItem(k); } } catch (e) {} return o; };
const lsWrite = st => { try {
  Object.keys(ls()).forEach(k => localStorage.removeItem(k));
  Object.entries(st).forEach(([k, v]) => { if (isProjectKey(k) && typeof v === 'string') localStorage.setItem(k, v); });
} catch (e) {} };
const parse = s => { try { return JSON.parse(s); } catch (e) { return null; } };
export const meta = () => parse(localStorage.getItem(META)) || null;
const setMeta = m => { try { localStorage.setItem(META, JSON.stringify(m)); } catch (e) {} };
export const runsMeta = () => { const m = parse(localStorage.getItem(RUNS)) || {}; return {active: m.active || null, list: m.list || []}; };
const setRuns = (st, f) => { const m = parse(st[RUNS]) || {}; st[RUNS] = JSON.stringify(f({active: null, list: [], ...m})); return st; };

/* wat nog niet in de opslag staat (de tabellen bewaart app.js om de 1,5 s) eerst wegschrijven */
const flush = () => { try { if (typeof tblSnap === 'function') localStorage.setItem('labkit:v1:tables', JSON.stringify(tblSnap())); } catch (e) {} };
/* na het wegschrijven mag niets meer schrijven (geschiedenis bij pagehide, de tabellentimer):
   dat zou in het nieuwe project terechtkomen */
let frozen = false;
export const reloadTo = hash => {
  frozen = true;
  try { Storage.prototype.setItem = function () {}; Storage.prototype.removeItem = function () {}; } catch (e) {}
  /* ook ?run= of ?wf= uit de adresbalk, anders opent het herladen de link opnieuw */
  if (hash != null) { try { history.replaceState(null, '', location.pathname + '#' + hash); } catch (e) {} }
  location.reload();
};
export const isFrozen = () => frozen;

/* bij welke tool een element-id hoort: de sectie waar het in staat */
const toolOf = id => { const el = document.getElementById(id), s = el && el.closest('section.tool'); return s ? s.dataset.tool || s.id.replace(/^t-/, '') : null; };
/* de stappen van een werkstroom; WF komt uit src/legacy/nt/99z_ux.js */
export const wfSteps = wf => { const w = Array.isArray(window.WF) ? window.WF.find(x => x.id === wf) : null; return w ? w.steps : []; };
export const wfName = wf => { const w = Array.isArray(window.WF) ? window.WF.find(x => x.id === wf) : null; return w ? w.n : wf; };

/* ---------- eerste start: alles wat er staat wordt "Mijn project" ---------- */
export function migrate(name) {
  if (meta()) return false;
  const id = newId('p');
  setMeta({active: id, list: [{id, name: name || 'Mijn project', created: Date.now()}]});
  /* een lopende werkstroom wordt de eerste run; zijn invoer is de huidige, de losse invoer ook */
  const st = ls(), w = (parse(st[WFK]) || {}).w;
  if (w && wfSteps(w).length) {
    const run = {id: newId('r'), name: wfName(w), wf: w, at: parse(st[WFK + ':at']) || '', created: Date.now()};
    const tools = wfSteps(w), data = splitRun(st, tools, toolOf).run;
    lsWrite(setRuns(enterRun(st, run, data, tools, toolOf), m => ({...m, active: run.id, list: [...m.list, run]})));
  }
  return true;
}
/* de browser vragen de opslag niet zomaar te wissen (eenmalig, stil als het niet kan) */
export const persist = () => { try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) {} };
export const estimate = async () => { try { return navigator.storage && navigator.storage.estimate ? await navigator.storage.estimate() : null; } catch (e) { return null; } };

/* ---------- projecten ---------- */
async function packCurrent() { flush(); const m = meta(); await dbPut('projects', {id: m.active, data: ls(), saved: Date.now()}); }

export async function switchProject(id) {
  const m = meta(); if (!m || id === m.active) return;
  await packCurrent();
  const p = await dbGet('projects', id);
  lsWrite(p ? p.data : {});
  setMeta({...m, active: id}); reloadTo('start');
}
export async function newProject(name) {
  const m = meta(), id = newId('p');
  await packCurrent(); lsWrite({});
  setMeta({active: id, list: [...m.list, {id, name, created: Date.now()}]}); reloadTo('start');
}
export function renameProject(id, name) { const m = meta(); setMeta({...m, list: m.list.map(p => (p.id === id ? {...p, name} : p))}); }
/* een niet-actief project weg, met zijn runs (en in het programma zijn hele map, met gels) */
export async function deleteProject(id) {
  const m = meta(); if (!m || id === m.active) return;
  const p = await dbGet('projects', id).catch(() => null), runs = p ? (parse(p.data[RUNS]) || {}).list || [] : [];
  await dropProject(id, runs.map(r => r.id)).catch(() => {});
  setMeta({...m, list: m.list.filter(x => x.id !== id)});
}
/* grootte in tekens van een project (actief: localStorage, anders zijn record) */
export async function projectSize(id) {
  const m = meta(), data = id === m.active ? ls() : ((await dbGet('projects', id).catch(() => null)) || {}).data || {};
  let n = Object.values(data).reduce((a, v) => a + String(v).length, 0);
  for (const r of (parse(data[RUNS]) || {}).list || []) { const d = await dbGet('runs', id + '/' + r.id).catch(() => null); if (d) n += JSON.stringify(d.data).length; }
  return n;
}

/* ---------- runs in het actieve project ---------- */
const runKey = rid => meta().active + '/' + rid;
/* de actieve run verlaten en zijn invoer in IndexedDB zetten; geeft de nieuwe toestand */
async function leaveActive(st) {
  const r = parse(st[RUNS]) || {}, run = (r.list || []).find(x => x.id === r.active);
  if (!run) return st;
  const {state, data, at} = leaveRun(st, wfSteps(run.wf), toolOf);
  await dbPut('runs', {id: runKey(run.id), data});
  return setRuns(state, m => ({...m, list: m.list.map(x => (x.id === run.id ? {...x, at} : x))}));
}
/* een nieuwe run van werkstroom wf; copyOf = id van een run om de invoer van over te nemen */
export async function startRun(wf, name, copyOf) {
  flush(); let st = await leaveActive(ls());
  const steps = wfSteps(wf); if (!steps.length) return;
  const run = {id: newId('r'), name: name || wfName(wf), wf, at: steps[0], created: Date.now()};
  let data = null;
  if (copyOf) { const d = await dbGet('runs', runKey(copyOf)).catch(() => null); data = d ? d.data : null; }
  st = setRuns(st, m => ({...m, list: [...m.list, run]}));
  lsWrite(enterRun(st, run, data, steps, toolOf)); reloadTo(run.at);
}
export async function switchRun(rid) {
  flush(); let st = await leaveActive(ls());
  const run = (parse(st[RUNS]) || {list: []}).list.find(x => x.id === rid); if (!run) return;
  const d = await dbGet('runs', runKey(rid)).catch(() => null);
  lsWrite(enterRun(st, run, d ? d.data : null, wfSteps(run.wf), toolOf)); reloadTo(run.at || wfSteps(run.wf)[0]);
}
export async function stopRun() { flush(); lsWrite(await leaveActive(ls())); reloadTo('start'); }
export function renameRun(rid, name) { try { const st = {[RUNS]: localStorage.getItem(RUNS)}; setRuns(st, m => ({...m, list: m.list.map(x => (x.id === rid ? {...x, name} : x))})); localStorage.setItem(RUNS, st[RUNS]); } catch (e) {} }
export async function deleteRun(rid) {
  if (runsMeta().active === rid) return;
  await dbDel('runs', runKey(rid)).catch(() => {});
  try { const st = {[RUNS]: localStorage.getItem(RUNS)}; setRuns(st, m => ({...m, list: m.list.filter(x => x.id !== rid)})); localStorage.setItem(RUNS, st[RUNS]); } catch (e) {}
}

/* ---------- exporteren, importeren, back-up ---------- */

const stamp = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const download = (name, obj) => saveBlob(name, new Blob([JSON.stringify(obj, null, 1)], {type: 'application/json'})).catch(() => {});

/* één project als bestand: zijn opslag, de invoer van zijn runs en zijn gels */
export async function exportProject(id) {
  flush(); const m = meta(), p = m.list.find(x => x.id === id); if (!p) return null;
  const data = id === m.active ? ls() : ((await dbGet('projects', id).catch(() => null)) || {}).data || {};
  const runs = [];
  for (const r of (parse(data[RUNS]) || {}).list || []) { const d = await dbGet('runs', id + '/' + r.id).catch(() => null); if (d) runs.push({id: r.id, data: d.data}); }
  const gels = ((await libListFull(true)) || []).filter(g => gelProject(g) === id);
  return {app: 'Labkit BML', kind: 'labkitproject', v: 1, name: p.name, versie: APPVER, opgeslagen: new Date().toISOString(), data, runs, gels};
}
export async function downloadProject(id) { const j = await exportProject(id || meta().active); if (j) await download(`${safeName(j.name)}-${stamp()}.json`, j); }

/* een projectbestand, of een sessie van voor S118, wordt een nieuw project; geeft zijn naam */
export async function importProject(j) {
  const m = meta(), id = newId('p'), data = {};
  Object.entries(j.data || {}).forEach(([k, v]) => { if (isProjectKey(k) && typeof v === 'string') data[k] = v; });
  if (j.kind !== 'labkitproject') { delete data[WFK]; delete data[WFK + ':at']; delete data[RUNS]; }   /* oude sessie: geen runs */
  let name = String(j.name || j.project || '').trim() || 'Geïmporteerd project', k = 2;
  const base = name; while (m.list.some(x => x.name === name)) name = base + ' (' + k++ + ')';
  await dbPut('projects', {id, data, saved: Date.now()});
  for (const r of Array.isArray(j.runs) ? j.runs : []) if (r && r.id && r.data) await dbPut('runs', {id: id + '/' + r.id, data: r.data});
  for (const g of Array.isArray(j.gels) ? j.gels : []) if (g && g.snap) await libPut({...g, id: newId('g'), proj: id});
  setMeta({...m, list: [...m.list, {id, name, created: Date.now()}]});
  return name;
}

/* alles van dit apparaat: alle labkit-sleutels, alle projecten en runs, alle gels */
export async function backupAll() {
  flush(); const data = {};
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && (k.startsWith('labkit:') || k === 'sg-read')) data[k] = localStorage.getItem(k); } } catch (e) {}
  const j = {app: 'Labkit BML', kind: 'labkitbackup', v: 1, versie: APPVER, opgeslagen: new Date().toISOString(), data,
    projects: await dbAll('projects').catch(() => []), runs: await dbAll('runs').catch(() => []), gels: (await libListFull(true)) || []};
  await download(`labkit-backup-${stamp()}.json`, j);
}
/* een back-up zet alles terug zoals het was (alles op dit apparaat wordt vervangen) */
export async function restoreBackup(j) {
  try { Object.keys(localStorage).filter(k => k.startsWith('labkit:') || k === 'sg-read').forEach(k => localStorage.removeItem(k)); } catch (e) {}
  Object.entries(j.data || {}).forEach(([k, v]) => { if ((k.startsWith('labkit:') || k === 'sg-read') && typeof v === 'string') { try { localStorage.setItem(k, v); } catch (e) {} } });
  /* eerst alles weg (in het programma ook de mappen met gels), dan de back-up erin */
  await clearAll().catch(() => {});
  for (const st of ['projects', 'runs']) for (const o of j[st] || []) if (o && o.id) await dbPut(st, o).catch(() => {});
  for (const g of j.gels || []) if (g && g.id && g.snap) await libPut(g);
  reloadTo('start');
}

/* "Importeren": een back-up vraagt eerst of alles vervangen mag; een project of oude sessie wordt
   een nieuw project. Geeft {kind, name} of null bij een onbekend bestand. */
export async function importFile(f) {
  let j; try { j = JSON.parse(await f.text()); } catch (e) { return null; }
  if (!j || j.app !== 'Labkit BML' || typeof j.data !== 'object') return null;
  if (j.kind === 'labkitbackup') return {kind: 'backup', j};
  return {kind: 'project', name: await importProject(j)};
}

/* ---------- notities per project ---------- */
const NOTES = 'labkit:v1:notes';
export const notes = () => { const n = parse(localStorage.getItem(NOTES)); return Array.isArray(n) ? n : []; };
export function addNote(text) {
  const t = String(text || '').trim(); if (!t) return;
  const r = runsMeta(), run = r.list.find(x => x.id === r.active);
  try { localStorage.setItem(NOTES, JSON.stringify([...notes(), {t: Date.now(), run: run ? run.name : '', text: t}])); } catch (e) {}
}
export function delNote(at) { try { localStorage.setItem(NOTES, JSON.stringify(notes().filter(n => n.t !== at))); } catch (e) {} }

/* voor de oude code: Sessie opslaan/openen (app.js), Instellingen en het Rapport */
expose({projDownload: downloadProject, projBackup: backupAll, projImportFile: importFile, projRestore: restoreBackup, projNotes: notes});

/* ---------- een run delen als link (S120) ---------- */

/* wat in de link gaat: de werkstroom (met zijn stappen als het een eigen is), de stap en de invoer
   van de tools van de run, zonder geschiedenis, gels of foto's */
export async function runPayload(rid) {
  flush();
  const r = runsMeta(), run = r.list.find(x => x.id === rid); if (!run) return null;
  const steps = wfSteps(run.wf);
  const data = rid === r.active ? splitRun(ls(), steps, toolOf).run : ((await dbGet('runs', runKey(rid)).catch(() => null)) || {}).data || {};
  const d = {...data}; delete d['labkit:v1:hist'];
  const w = (window.WF || []).find(x => x.id === run.wf);
  const at = rid === r.active ? parse(localStorage.getItem(WFK + ':at')) || run.at : run.at;
  return {v: 1, n: run.name, wf: run.wf, def: w && w.kind === 'own' ? {n: w.n, s: w.steps} : null, at, own: run.own || [], d};
}

/* een gedeelde run openen: een nieuw project "Gedeeld: <naam>" met die run actief. Geeft false
   als de werkstroom hier niet bestaat. */
export async function openSharedRun(o, label = 'Gedeeld') {
  if (!o || !o.d || typeof o.d !== 'object') return false;
  let wf = o.wf;
  if (o.def) { const own = parse(localStorage.getItem(OWNKEY)) || [], r = addShared(own, o.def, typeof wfKnown === 'function' ? wfKnown() : []);
    if (!r) return false; if (r.added) { try { localStorage.setItem(OWNKEY, JSON.stringify(r.list)); } catch (e) {} if (typeof wfReload === 'function') wfReload(); } wf = r.id; }
  const steps = wfSteps(wf); if (!steps.length) return false;
  const m = meta(), id = newId('p'), run = {id: newId('r'), name: String(o.n || wfName(wf)), wf, at: steps.includes(o.at) ? o.at : steps[0], created: Date.now(),
    own: Array.isArray(o.own) ? o.own.filter(x => typeof x === 'string') : []};
  const d = {}; Object.entries(o.d).forEach(([k, v]) => { if (typeof v === 'string' && isProjectKey(k)) d[k] = v; });
  await packCurrent();
  lsWrite(enterRun({[RUNS]: JSON.stringify({active: null, list: [run]})}, run, d, steps, toolOf));
  let name = label + ': ' + run.name, k = 2; const base = name; while (m.list.some(x => x.name === name)) name = base + ' (' + k++ + ')';
  setMeta({active: id, list: [...m.list, {id, name, created: Date.now()}]});
  reloadTo(run.at); return true;
}
