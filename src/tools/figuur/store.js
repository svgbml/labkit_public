/* ================= FIGUURMAKER: DE BAK MET UITKOMSTEN (S89) =================
   Een uitkomst uit een tool (een grafiek, de gelfoto) gaat hierheen met figAdd(): een PNG op 300 dpi
   (Blob) en, als de tool dat kan, een SVG-tekst. IndexedDB `labkit-fig`, opslag `items`, zodat de
   bak een herlaad overleeft; zonder IndexedDB (privévenster) blijft hij alleen in het geheugen.
   De indeling van de figuur zelf (raster en welk item in welk paneel) staat in localStorage
   `lkFig`, want die is klein. window.__figRefresh laat de Figuurmaker de lijst opnieuw lezen. */
import {expose} from '../../lib/global.js';

const MAX = 24, mem = [];
let idbOk = typeof indexedDB !== 'undefined';
const open = () => new Promise((ok, no) => {
  const r = indexedDB.open('labkit-fig', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('items', {keyPath: 'id'});
  r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
});
const run = async (mode, f) => { const db = await open(); try { return await new Promise((ok, no) => {
  const t = db.transaction('items', mode), s = t.objectStore('items'); let out; f(s, v => { out = v; });
  t.oncomplete = () => ok(out); t.onerror = t.onabort = () => no(t.error); }); } finally { db.close(); } };
const ping = () => { if (window.__figRefresh) window.__figRefresh(); };

/* oudste eerst, in de volgorde waarin ze zijn toegevoegd */
export async function figList() {
  if (idbOk) { try { const a = await run('readonly', (s, set) => { const r = s.getAll(); r.onsuccess = () => set(r.result); }); return a.sort((p, q) => p.date - q.date); } catch (e) { idbOk = false; } }
  return mem.slice();
}
/* {png: Blob, svg?: string, w, h, name} → het nieuwe id; houdt er hoogstens MAX */
export async function figAdd(it) {
  const e = {id: 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), date: Date.now(), name: it.name || '', png: it.png, svg: it.svg || '', w: it.w, h: it.h};
  if (idbOk) { try { await run('readwrite', s => s.put(e)); const a = await figList(); if (a.length > MAX) await run('readwrite', s => a.slice(0, a.length - MAX).forEach(o => s.delete(o.id))); ping(); return e.id; } catch (x) { idbOk = false; } }
  mem.push(e); if (mem.length > MAX) mem.shift(); ping(); return e.id;
}
export async function figDel(id) {
  if (idbOk) { try { await run('readwrite', s => s.delete(id)); ping(); return; } catch (x) { idbOk = false; } }
  const i = mem.findIndex(e => e.id === id); if (i >= 0) mem.splice(i, 1); ping();
}
/* een canvas als item: PNG met 300 dpi in de kop (pngDpi uit 99_app.js); w en h in beeldpunten op 1× */
export async function figAddCanvas(c, scale, name, svg) {
  const b = await new Promise(r => c.toBlob(r, 'image/png'));
  const png = typeof pngDpi === 'function' ? new Blob([pngDpi(new Uint8Array(await b.arrayBuffer()), 300)], {type: 'image/png'}) : b;
  return figAdd({png, svg, w: Math.round(c.width / scale), h: Math.round(c.height / scale), name});
}

expose({figList, figAdd, figDel, figAddCanvas});
