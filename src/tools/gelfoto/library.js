/* Gelbibliotheek: IndexedDB `labkit-gels`, opslag `gels`. Elke functie faalt zacht: zonder
   indexedDB (privévenster) geeft list() null en doen de andere niets (false). */
const MAX = 30;   /* per project (S118) */
const open = () => new Promise((ok, no) => {
  const r = indexedDB.open('labkit-gels', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('gels', {keyPath: 'id'});
  r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
});
const run = async (mode, f) => { const db = await open(); try { return await new Promise((ok, no) => {
  const t = db.transaction('gels', mode), s = t.objectStore('gels'); let out; f(s, v => { out = v; });
  t.oncomplete = () => ok(out); t.onerror = t.onabort = () => no(t.error); }); } finally { db.close(); } };

/* S118: elke gel hoort bij een project (proj) en eventueel een run (run). Gels van voor S118
   hebben geen proj; die horen bij het eerste project (de migratie maakt daar "Mijn project" van). */
const cur = () => { try {
  const m = JSON.parse(localStorage.getItem('labkit:v1:projects') || 'null'), r = JSON.parse(localStorage.getItem('labkit:v1:runs') || 'null');
  return {p: m ? m.active : null, first: m && m.list[0] ? m.list[0].id : null, r: r ? r.active : null};
} catch (e) { return {}; } };
export const gelProject = (g, c = cur()) => g.proj || c.first;

/* nieuwste eerst; alleen die van het actieve project, tenzij all; null als de bibliotheek hier niet werkt */
export async function libList(all) {
  try { const list = (await run('readonly', (s, set) => { const r = s.getAll(); r.onsuccess = () => set(r.result); })).sort((a, b) => b.date - a.date);
    const c = cur(); return all || !c.p ? list : list.filter(g => gelProject(g, c) === c.p); } catch (e) { return null; }
}
/* bewaart het item (met project en run) en houdt er hoogstens MAX per project; true bij gelukt */
export async function libPut(e) {
  try { const c = cur(); if (!e.proj && c.p) e.proj = c.p; if (e.run === undefined) e.run = c.r || null;
    await run('readwrite', s => s.put(e));
    const mine = ((await libList(true)) || []).filter(g => gelProject(g, c) === gelProject(e, c));
    if (mine.length > MAX) await run('readwrite', s => mine.slice(MAX).forEach(o => s.delete(o.id)));
    if (window.__gfLibRefresh) window.__gfLibRefresh(); return true; } catch (x) { return false; }
}
/* alle gels van een project weg (een project verwijderen) */
export async function libDeleteProject(pid) {
  try { const c = cur(), del = ((await libList(true)) || []).filter(g => gelProject(g, c) === pid);
    await run('readwrite', s => del.forEach(o => s.delete(o.id))); return true; } catch (x) { return false; }
}
export async function libDelete(id) {
  try { await run('readwrite', s => s.delete(id)); if (window.__gfLibRefresh) window.__gfLibRefresh(); return true; } catch (x) { return false; }
}
