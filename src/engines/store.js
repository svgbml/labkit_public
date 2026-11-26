/* ================= OPSLAG VAN INACTIEVE PROJECTEN, RUNS EN GELS (S118, S273) =================
   Eén laag met twee achterkanten (docs/adr/0001):
   - in de browser: IndexedDB (`labkit-projects` met projects en runs; de gels in `labkit-gels`);
   - in het Windows-programma (Tauri): bestanden in Documenten\LabKit\Projecten, één map per
     project: <project>/project.json, <project>/runs/<run>.json en <project>/gels/<gel>.json.
     De opdrachten store_* en gel_index staan in src-tauri/src/main.rs.
   De rest van de app weet niet welke van de twee het is. */

const tauri = () => (window.__TAURI__ && window.__TAURI__.core && window.__TAURI__.core.invoke) || null;
export const fileMode = () => !!tauri();
const call = (cmd, args) => tauri()(cmd, args);

/* ---------- IndexedDB ---------- */
const open = () => new Promise((ok, no) => {
  const r = indexedDB.open('labkit-projects', 1);
  r.onupgradeneeded = () => { r.result.createObjectStore('projects', {keyPath: 'id'}); r.result.createObjectStore('runs', {keyPath: 'id'}); };
  r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
});
const tx = async (store, mode, f) => { const db = await open(); try { return await new Promise((ok, no) => {
  const t = db.transaction(store, mode), s = t.objectStore(store); let out; f(s, v => { out = v; });
  t.oncomplete = () => ok(out); t.onerror = t.onabort = () => no(t.error); }); } finally { db.close(); } };
const idb = {
  get: (store, id) => tx(store, 'readonly', (s, set) => { const r = s.get(id); r.onsuccess = () => set(r.result || null); }),
  put: (store, v) => tx(store, 'readwrite', s => s.put(v)),
  del: (store, id) => tx(store, 'readwrite', s => s.delete(id)),
  all: store => tx(store, 'readonly', (s, set) => { const r = s.getAll(); r.onsuccess = () => set(r.result || []); })
};

/* ---------- bestanden ---------- */
/* projects: <id>/project.json · runs (id "project/run"): <project>/runs/<run>.json */
const path = (store, id) => (store === 'projects' ? `${id}/project.json` : `${id.split('/')[0]}/runs/${id.split('/')[1]}.json`);
const readJson = async rel => { const s = await call('store_read', {rel}); return s == null ? null : JSON.parse(s); };
const files = {
  get: (store, id) => readJson(path(store, id)),
  put: (store, v) => call('store_write', {rel: path(store, v.id), data: JSON.stringify(v)}),
  del: (store, id) => call('store_delete', {rel: store === 'projects' ? `${id}/project.json` : path(store, id)}),
  async all(store) {
    const out = [];
    for (const pid of await call('store_list', {rel: ''})) {
      if (store === 'projects') { const p = await readJson(`${pid}/project.json`).catch(() => null); if (p) out.push(p); continue; }
      for (const f of await call('store_list', {rel: `${pid}/runs`}).catch(() => [])) {
        const r = await readJson(`${pid}/runs/${f}`).catch(() => null); if (r) out.push(r);
      }
    }
    return out;
  }
};

const be = () => (fileMode() ? files : idb);
export const dbGet = (store, id) => be().get(store, id);
export const dbPut = (store, v) => be().put(store, v);
export const dbDel = (store, id) => be().del(store, id);
export const dbAll = store => be().all(store);
/* een heel project weg; in bestanden ook zijn map met gels */
export async function dropProject(pid, runIds) {
  if (fileMode()) return call('store_delete', {rel: pid});
  for (const r of runIds) await idb.del('runs', pid + '/' + r).catch(() => {});
  await idb.del('projects', pid).catch(() => {});
}

/* alles weg (een back-up terugzetten): in het programma alle projectmappen, anders de projecten,
   runs en gels in IndexedDB */
export async function clearAll() {
  if (fileMode()) { for (const pid of await call('store_list', {rel: ''})) await call('store_delete', {rel: pid}); return; }
  for (const st of ['projects', 'runs']) for (const o of await idb.all(st).catch(() => [])) await idb.del(st, o.id).catch(() => {});
  await new Promise(ok => { try { const r = indexedDB.deleteDatabase('labkit-gels'); r.onsuccess = r.onerror = r.onblocked = () => ok(); } catch (e) { ok(); } });
}

/* ---------- gels als bestanden (library.js gebruikt dit in het programma) ---------- */
export const gelFiles = {
  /* zonder snap (die is groot): de lijst van een project, of null als er geen map is */
  index: pid => call('gel_index', {pid}),
  get: (pid, id) => readJson(`${pid}/gels/${id}.json`),
  put: e => call('store_write', {rel: `${e.proj}/gels/${e.id}.json`, data: JSON.stringify(e)}),
  del: (pid, id) => call('store_delete', {rel: `${pid}/gels/${id}.json`}),
  projects: () => call('store_list', {rel: ''})
};
export const storeDir = () => (fileMode() ? call('store_dir', {}) : Promise.resolve(''));

/* ---------- eerste start van het programma met bestanden: wat in IndexedDB stond gaat mee ---------- */
export async function moveToFiles(gelsFromIdb) {
  if (!fileMode()) return false;
  try { if (localStorage.getItem('labkit:v1:filestore')) return false; } catch (e) { return false; }
  const had = (await call('store_list', {rel: ''})).length > 0;
  if (!had) {
    for (const p of await idb.all('projects').catch(() => [])) await files.put('projects', p);
    for (const r of await idb.all('runs').catch(() => [])) await files.put('runs', r);
    for (const g of (await gelsFromIdb()) || []) if (g && g.proj && g.snap) await gelFiles.put(g);
  }
  try { localStorage.setItem('labkit:v1:filestore', '1'); } catch (e) {}
  return !had;
}
