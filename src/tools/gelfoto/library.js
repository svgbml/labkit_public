/* Gelbibliotheek: IndexedDB `labkit-gels`, opslag `gels`; in het Windows-programma bestanden
   <project>/gels/<gel>.json (S273, src/engines/store.js). Elke functie faalt zacht: zonder
   opslag (privévenster) geeft list() null en doen de andere niets (false).
   In het programma geeft libList() een index zonder snap (die is groot); libGet() en libListFull()
   lezen de hele gel. */
import {fileMode, gelFiles, moveToFiles} from '../../engines/store.js';
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

const idbAll = async () => (await run('readonly', (s, set) => { const r = s.getAll(); r.onsuccess = () => set(r.result); })).sort((a, b) => b.date - a.date);
const byDate = l => l.sort((a, b) => b.date - a.date);
/* in het programma: de index van één project, of van alle projectmappen */
async function fileList(all, c) {
  const pids = all ? await gelFiles.projects() : [c.p];
  const out = [];
  for (const pid of pids) for (const g of (await gelFiles.index(pid).catch(() => [])) || []) out.push({...g, proj: g.proj || pid});
  return byDate(out);
}

/* nieuwste eerst; alleen die van het actieve project, tenzij all; null als de bibliotheek hier niet werkt */
export async function libList(all) {
  try { const c = cur();
    if (fileMode()) return c.p || all ? await fileList(all, c) : [];
    const list = await idbAll(); return all || !c.p ? list : list.filter(g => gelProject(g, c) === c.p); } catch (e) { return null; }
}
/* de hele gel (met snap); in de browser staat die al in de lijst */
export async function libGet(id, proj) {
  try { if (!fileMode()) return (await idbAll()).find(g => g.id === id) || null;
    const pid = proj || ((await libList(true)) || []).find(g => g.id === id)?.proj; return pid ? await gelFiles.get(pid, id) : null; } catch (e) { return null; }
}
/* alle gels met snap (exporteren, back-up) */
export async function libListFull(all) {
  const l = await libList(all); if (!l || !fileMode()) return l;
  const out = []; for (const g of l) { const f = await libGet(g.id, g.proj); if (f) out.push(f); } return out;
}
/* bewaart het item (met project en run) en houdt er hoogstens MAX per project; true bij gelukt */
export async function libPut(e) {
  try { const c = cur(); if (!e.proj && c.p) e.proj = c.p; if (e.run === undefined) e.run = c.r || null;
    if (fileMode()) {
      if (!e.proj) return false;
      await gelFiles.put(e);
      const mine = byDate((await gelFiles.index(e.proj)) || []);
      for (const o of mine.slice(MAX)) await gelFiles.del(e.proj, o.id);
    } else {
      await run('readwrite', s => s.put(e));
      const mine = (await idbAll()).filter(g => gelProject(g, c) === gelProject(e, c));
      if (mine.length > MAX) await run('readwrite', s => mine.slice(MAX).forEach(o => s.delete(o.id)));
    }
    if (window.__gfLibRefresh) window.__gfLibRefresh(); return true; } catch (x) { return false; }
}
/* alle gels van een project weg (een project verwijderen; in het programma gaat de hele map al weg) */
export async function libDeleteProject(pid) {
  try { if (fileMode()) return true;
    const c = cur(), del = (await idbAll()).filter(g => gelProject(g, c) === pid);
    await run('readwrite', s => del.forEach(o => s.delete(o.id))); return true; } catch (x) { return false; }
}
export async function libDelete(id) {
  try { if (fileMode()) { const g = ((await libList(true)) || []).find(x => x.id === id); if (g) await gelFiles.del(g.proj, id); }
    else await run('readwrite', s => s.delete(id));
    if (window.__gfLibRefresh) window.__gfLibRefresh(); return true; } catch (x) { return false; }
}
/* eerste start van het programma: de gels uit IndexedDB gaan mee naar de bestanden (met hun project) */
export const libMoveToFiles = () => moveToFiles(async () => { const c = cur(); return (await idbAll().catch(() => [])).map(g => ({...g, proj: gelProject(g, c)})); });
