/* Piektabel uit een CSV/TSV-export (Agilent, Shimadzu, Waters, ...): kolommen worden aan de kop herkend.
   Zuivere functie, geen DOM. Geeft {peaks:[{name, rt, area, height, width, wkind}]} of null als er geen
   retentietijd-kolom is. wkind 'h' = breedte op halve hoogte, 'b' = basisbreedte (de "Width" van de meeste exports). */
const SQ2PI = Math.sqrt(2 * Math.PI), HW = 2.3548;
/* 1.234,5 / 1,234.5 / 1,5 / 1.5: het laatste scheidingsteken is de komma of punt van de decimalen */
const val = s => { s = String(s).replace(/["\s\u00a0]/g, ''); if (!s) return NaN; const c = s.lastIndexOf(','), d = s.lastIndexOf('.');
  return Number(c > d ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '')); };
const split = (l, sep) => (sep ? l.split(sep) : l.trim().split(/\s+/)).map(s => s.trim().replace(/^"|"$/g, ''));
const kind = h => { h = h.toLowerCase().replace(/[(\[].*?[)\]]/g, '').trim(); if (/%/.test(h) && !/^\W*$/.test(h.replace(/[^a-z]/g, ''))) { if (/area|height|opp|hoogte/.test(h)) return null; }
  if (/^(rt|tr|t_?r)\b|^r\.?\s*time|^ret|retention|retentie/.test(h)) return 'rt';
  if (/area|oppervlak/.test(h)) return 'area';
  if (/height|hoogte/.test(h)) return 'height';
  if (/width|breedte|^w[.\s]?\d*$|fwhm/.test(h)) return /half|50|fwhm|1\/2/.test(h) ? 'wh' : 'wb';
  if (/name|naam|compound|component|stof/.test(h)) return 'name';
  if (/^(peak|pk|#|no\.?|nr\.?)/.test(h)) return 'peak'; return null; };
export function parsePeakTable(text) {
  const lines = String(text).replace(/\r/g, '').split('\n').filter(l => l.trim());
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i], sep = L.includes('\t') ? '\t' : L.includes(';') ? ';' : L.includes(',') ? ',' : null;
    const col = {}; split(L, sep).forEach((h, j) => { const k = kind(h); if (k && !(k in col)) col[k] = j; });
    if (!('rt' in col)) continue;
    const wk = 'wh' in col ? 'h' : 'b', wc = 'wh' in col ? col.wh : col.wb, peaks = [];
    lines.slice(i + 1).forEach((l, r) => {
      const c = split(l, sep), g = k => (k in col ? val(c[col[k]] ?? '') : NaN), rt = g('rt'); if (!(rt > 0)) return;
      const area = g('area'), height = g('height'); let width = wc == null ? NaN : val(c[wc] ?? ''), wkind = wk;
      if (!(width > 0) && area > 0 && height > 0) { width = HW * area / (height * SQ2PI); wkind = 'h'; }   /* Gauss: A = H·σ·√2π */
      const nm = c[col.name] || c[col.peak] || ('Peak ' + (r + 1));
      peaks.push({name: nm, rt, area: area > 0 ? area : NaN, height: height > 0 ? height : NaN, width: width > 0 ? width : NaN, wkind});
    });
    return peaks.length ? {peaks} : null;
  }
  return null;
}
/* Gaussische pieken voor de schets: [{rt, sigma, amp}] met de grootste amplitude op 1 */
export function sketchPeaks(peaks) {
  const P = peaks.filter(p => p.width > 0).map(p => { const s = p.wkind === 'b' ? p.width / 4 : p.width / HW;
    return {name: p.name, rt: p.rt, sigma: s, amp: p.height > 0 ? p.height : p.area > 0 ? p.area / (s * SQ2PI) : 1}; });
  const mx = Math.max(...P.map(p => p.amp)); return P.map(p => ({...p, amp: p.amp / mx}));
}
