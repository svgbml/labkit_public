/* Gelbibliotheek: IndexedDB `labkit-gels`, opslag `gels`. Elke functie faalt zacht: zonder
   indexedDB (privévenster) geeft list() null en doen de andere niets (false). */
const MAX = 30;
const open = () => new Promise((ok, no) => {
  const r = indexedDB.open('labkit-gels', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('gels', {keyPath: 'id'});
  r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
});
const run = async (mode, f) => { const db = await open(); try { return await new Promise((ok, no) => {
  const t = db.transaction('gels', mode), s = t.objectStore('gels'); let out; f(s, v => { out = v; });
  t.oncomplete = () => ok(out); t.onerror = t.onabort = () => no(t.error); }); } finally { db.close(); } };

/* nieuwste eerst; null als de bibliotheek hier niet werkt */
export async function libList() {
  try { const all = await run('readonly', (s, set) => { const r = s.getAll(); r.onsuccess = () => set(r.result); });
    return all.sort((a, b) => b.date - a.date); } catch (e) { return null; }
}
/* bewaart het item en houdt er hoogstens MAX; true bij gelukt */
export async function libPut(e) {
  try { await run('readwrite', s => s.put(e));
    const all = await libList(); if (all && all.length > MAX) await run('readwrite', s => all.slice(MAX).forEach(o => s.delete(o.id)));
    if (window.__gfLibRefresh) window.__gfLibRefresh(); return true; } catch (x) { return false; }
}
export async function libDelete(id) {
  try { await run('readwrite', s => s.delete(id)); if (window.__gfLibRefresh) window.__gfLibRefresh(); return true; } catch (x) { return false; }
}
