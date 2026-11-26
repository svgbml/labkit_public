/* ================= PROJECTEN EN RUNS IN DE BROWSER (S118) =================
   Het actieve project (en zijn actieve run) staat in localStorage zoals altijd, zodat geen
   tool hoeft te veranderen. Inactieve projecten en runs staan in IndexedDB `labkit-projects`.
   Wisselen pakt het huidige in, het andere uit en herlaadt de pagina (docs/adr/0001).
   De lijst van projecten staat in de globale sleutel labkit:v1:projects; de runs van het
   actieve project in labkit:v1:runs (een projectsleutel, dus hij wisselt mee). */
import {isProjectKey, splitRun, enterRun, leaveRun, RUNS, WF as WFK, META, newId} from '../lib/projects.js';

/* ---------- IndexedDB ---------- */
const open = () => new Promise((ok, no) => {
  const r = indexedDB.open('labkit-projects', 1);
  r.onupgradeneeded = () => { r.result.createObjectStore('projects', {keyPath: 'id'}); r.result.createObjectStore('runs', {keyPath: 'id'}); };
  r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
});
const tx = async (store, mode, f) => { const db = await open(); try { return await new Promise((ok, no) => {
  const t = db.transaction(store, mode), s = t.objectStore(store); let out; f(s, v => { out = v; });
  t.oncomplete = () => ok(out); t.onerror = t.onabort = () => no(t.error); }); } finally { db.close(); } };
export const dbGet = (store, id) => tx(store, 'readonly', (s, set) => { const r = s.get(id); r.onsuccess = () => set(r.result || null); });
export const dbPut = (store, v) => tx(store, 'readwrite', s => s.put(v));
export const dbDel = (store, id) => tx(store, 'readwrite', s => s.delete(id));
export const dbAll = store => tx(store, 'readonly', (s, set) => { const r = s.getAll(); r.onsuccess = () => set(r.result || []); });

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
  if (hash != null) { try { history.replaceState(null, '', '#' + hash); } catch (e) {} }
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
/* een niet-actief project weg, met zijn runs (gels: zie deleteProjectGels in de component) */
export async function deleteProject(id) {
  const m = meta(); if (!m || id === m.active) return;
  const p = await dbGet('projects', id), runs = p ? (parse(p.data[RUNS]) || {}).list || [] : [];
  for (const r of runs) await dbDel('runs', id + '/' + r.id).catch(() => {});
  await dbDel('projects', id).catch(() => {});
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
