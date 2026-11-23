/* ================= PLAATLEZER-EXPORTS INLEZEN (S91) =================
   plateRead(tekst) herkent vier vormen en geeft {format, plates: [{name, rows, cols, wells: {A1: getal…}}],
   notes: [...]} terug. Een waarde die geen getal is (leeg, OVER, Sat., -, n.d.) staat er niet in;
   OVER en Sat. komen als waarschuwing in notes (verzadigd, niet te kwantificeren).
   - grid:    rijletter vooraan en 12 (of 24) waarden, zoals BioTek Gen5, Thermo Multiskan (SkanIt) en een
              blok uit Excel; meerdere blokken na elkaar (Gen5: één per golflengte of meting) worden aparte
              platen, met de laatste tekstregel vóór het blok als naam.
   - tecan:   Tecan i-control / Magellan: een kopregel "<>" met de kolomnummers, dan rijen met de rijletter.
   - softmax: SoftMax Pro "Plate:"-blok (Molecular Devices, plaatformaat): kopregel met Temperature en
              1…12, daarna rijen zonder rijletter (de eerste met de temperatuur ervoor), tot "~End".
   - list:    lange tabel met een kolom putjes (A1 of A01) en een kolom waarden, zoals BMG Labtech
              (CLARIOstar, "Well, Content, Raw Data") of een eigen export.
   Scheidingsteken per regel: tab, dan puntkomma, dan komma; decimalen met punt of komma (num()). */
import {expose} from './global.js';

const ROWS = 'ABCDEFGHIJKLMNOP';
const split = line => (line.includes('\t') ? line.split('\t') : line.includes(';') ? line.split(';') : line.split(',')).map(x => x.trim().replace(/^"|"$/g, ''));
const SAT = /^(over|ovrflw|overflow|sat\.?|saturated|range\?|>\s*[\d.,]+|\+{3,})$/i;   /* Tecan OVER, Gen5 OVRFLW, SoftMax Range? */
/* een cel als getal; NaN voor leeg en tekst; verzadigd telt mee in notes */
function val(s, sat) { if (s == null) return NaN; const t = String(s).trim(); if (!t) return NaN; if (SAT.test(t)) { sat.n++; return NaN; } const v = num(t.replace(/\*/g, '')); return isFinite(v) ? v : NaN; }
const wellId = s => { const m = String(s).trim().match(/^([A-Pa-p])\s*0?(\d{1,2})$/); return m && +m[2] >= 1 && +m[2] <= 24 ? m[1].toUpperCase() + (+m[2]) : null; };

function plate(name, rowsVals, sat) {
  const wells = {}; let cols = 0;
  rowsVals.forEach(([r, vals]) => { vals.forEach((s, k) => { const v = val(s, sat); if (isFinite(v)) { wells[r + (k + 1)] = v; cols = Math.max(cols, k + 1); } }); });
  const rows = rowsVals.length;
  return {name, rows, cols: cols > 12 ? 24 : 12, wells};
}

function readSoftmax(lines, sat) {
  const plates = []; let i = 0;
  while (i < lines.length) {
    if (!/^Plate:/i.test(lines[i].trim())) { i++; continue; }
    const name = split(lines[i])[1] || 'Plate'; i++;
    while (i < lines.length && !/\t1\t2\t3/.test(lines[i]) && !/^~End/i.test(lines[i])) i++;
    if (i >= lines.length || /^~End/i.test(lines[i])) continue;
    const head = lines[i].split('\t'), c1 = head.findIndex(x => x.trim() === '1'); i++;
    const rv = [];
    while (i < lines.length && !/^~End/i.test(lines[i].trim()) && rv.length < 16) {
      const c = lines[i].split('\t'); if (c.slice(c1).some(x => x.trim() !== '')) rv.push([ROWS[rv.length], c.slice(c1, c1 + 24)]); i++;
    }
    plates.push(plate(name, rv, sat));
  }
  return plates;
}

function readList(lines, sat) {
  const tab = lines.map(split); let wc = -1, start = -1;
  for (let r = 0; r < tab.length && wc < 0; r++) { const k = tab[r].findIndex(x => wellId(x)); if (k >= 0 && tab.slice(r, r + 3).filter(row => wellId(row[k] || '')).length >= 3) { wc = k; start = r; } }
  if (wc < 0) return [];
  /* de waardekolom: een kolom met een kop als Value/Raw/Abs/OD/Result, anders de eerste kolom na de putjes met getallen */
  const head = start > 0 ? tab[start - 1] : [];
  let vc = head.findIndex((h, k) => k !== wc && /value|raw|abs|od\b|result|meting|waarde|blank corrected/i.test(h));
  if (vc < 0) for (let k = wc + 1; k < (tab[start] || []).length; k++) if (tab.slice(start, start + 8).filter(row => isFinite(num(row[k] || ''))).length >= 3) { vc = k; break; }
  const wells = {}; let rows = 0, cols = 0;
  for (let r = start; r < tab.length; r++) { const id = wellId(tab[r][wc] || ''); if (!id) continue; const v = val(tab[r][vc], sat); if (!isFinite(v)) continue; wells[id] = v; rows = Math.max(rows, ROWS.indexOf(id[0]) + 1); cols = Math.max(cols, +id.slice(1)); }
  return [{name: head[vc] || 'Plate', rows: rows > 8 ? 16 : 8, cols: cols > 12 ? 24 : 12, wells}];
}

function readGrid(lines, sat) {
  const plates = []; let cur = null, lastText = '', tecan = false;
  const close = () => { if (cur && cur.rv.length) plates.push(plate(cur.name, cur.rv, sat)); cur = null; };
  lines.forEach(line => {
    const c = split(line), i = c.findIndex(x => x !== '');
    if (i < 0) { if (cur && cur.rv.length >= 8) close(); return; }
    if (c[i] === '<>') { tecan = true; close(); cur = {name: lastText || 'Plate', rv: []}; return; }
    const m = c[i].match(/^([A-Pa-p])$/);
    if (m && c.slice(i + 1).some(x => x !== '')) {
      const r = m[1].toUpperCase();
      if (!cur || cur.rv.some(q => q[0] === r)) { close(); cur = {name: lastText || 'Plate', rv: []}; }
      const rest = c.slice(i + 1), n = rest.filter(x => x !== '').length >= 24 ? 24 : 12;  /* Gen5 zet de golflengte als 13e kolom achter de rij */
      cur.rv.push([r, rest.slice(0, n)]); return;
    }
    if (cur && cur.rv.length >= 8) close();
    if (!/^\d+(\s*[\t,;]\s*\d+)+$/.test(line.trim())) lastText = c.filter(Boolean).join(' ').slice(0, 60);  /* een regel met alleen kolomnummers is geen naam */
  });
  close();
  return {plates, tecan};
}

export function plateRead(text) {
  const lines = String(text || '').replace(/\r/g, '').split('\n'), sat = {n: 0}, notes = [];
  let format = '', plates = [];
  if (lines.some(l => /^Plate:\s*\t/i.test(l)) && lines.some(l => /\t1\t2\t3/.test(l))) { plates = readSoftmax(lines, sat); format = 'softmax'; }
  if (!plates.length) { const g = readGrid(lines, sat); if (g.plates.length) { plates = g.plates; format = g.tecan ? 'tecan' : 'grid'; } }
  if (!plates.length) { plates = readList(lines, sat); if (plates.length) format = 'list'; }
  plates = plates.filter(p => Object.keys(p.wells).length);
  if (sat.n) notes.push({kind: 'warn', n: sat.n});
  return {format, plates, notes};
}

/* een plaat als rijen A–H met 12 waarden (NaN voor leeg), zoals parsePlate() die de tools al gebruiken */
export function plateRows(p) { const out = {}; for (let r = 0; r < p.rows; r++) { const R = ROWS[r]; out[R] = Array.from({length: p.cols}, (_, k) => (R + (k + 1)) in p.wells ? p.wells[R + (k + 1)] : NaN); } return out; }

expose({plateRead, plateRows});
