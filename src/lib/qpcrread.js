/* ================= qPCR-EXPORTS INLEZEN (S93) =================
   qpcrRead(tekst) → {format, recs: [{well, s: monster, t: target, ct}], undet: aantal zonder Ct}.
   - cfx:         Bio-Rad CFX Manager / CFX Maestro, "Quantification Cq Results" (csv): kolommen Well, Fluor,
                  Target, Content, Sample, Cq; geen Ct = leeg of NaN.
   - quantstudio: Applied Biosystems QuantStudio / 7500 (txt of uit Excel geplakt): regels met * zijn
                  instellingen, de tabel staat onder [Results] met Well Position, Sample Name, Target Name, CT
                  (of Cт / Ct); geen Ct = Undetermined.
   - lightcycler: Roche LightCycler 480/96, export "Abs Quant/2nd Derivative Max": per gen een blok dat
                  begint met "Experiment: … Selected Filter: …", dan Include, Color, Pos, Name, Cp, …; het doelgen
                  staat niet in de tabel, dus de naam van het experiment (tot de eerste _ of spatie) is het target.
   Ct met punt of komma (num()). Geen herkende vorm → format '' en geen recs; de tool valt dan terug op
   zijn eigen kopregel-herkenning. */
import {expose} from './global.js';

const sp = l => (l.includes('\t') ? l.split('\t') : l.includes(';') ? l.split(';') : l.split(',')).map(x => x.trim().replace(/^"|"$/g, ''));
const ctv = s => { const t = String(s || '').trim(); if (!t || /^(undetermined|nan|n\/a|-|no ct|no cq)$/i.test(t)) return NaN; const v = num(t); return isFinite(v) ? v : NaN; };
const col = (H, re) => H.findIndex(h => re.test(h));

function table(lines, hi, idx, fmt) {
  const recs = []; let undet = 0;
  for (let i = hi + 1; i < lines.length; i++) {
    const c = sp(lines[i]); if (c.every(x => !x)) { if (recs.length || undet) break; continue; }
    if (/^\[/.test(lines[i].trim())) break;   /* volgende sectie (QuantStudio) */
    const s = c[idx.s], t = idx.t >= 0 ? c[idx.t] : idx.tName; if (!s) continue;
    const ct = ctv(c[idx.ct]); if (!isFinite(ct)) { undet++; continue; }
    recs.push({well: idx.w >= 0 ? c[idx.w] : '', s, t, ct});
  }
  return {format: fmt, recs, undet};
}

export function qpcrRead(text) {
  const lines = String(text || '').replace(/\r/g, '').split('\n');
  /* LightCycler: één of meer blokken die met "Experiment:" beginnen */
  if (lines.some(l => /^Experiment:/i.test(l.trim()))) {
    const out = {format: 'lightcycler', recs: [], undet: 0};
    lines.forEach((l, i) => {
      if (!/^Experiment:/i.test(l.trim())) return;
      const name = (l.match(/Experiment:\s*([^\t]+?)(\s{2,}|\t|Selected Filter|$)/i) || [])[1] || 'target', tName = name.split(/[_\s]/)[0];
      const hi = lines.findIndex((h, k) => k > i && /\bPos\b/i.test(h) && /\bCp\b/i.test(h)); if (hi < 0) return;
      const H = sp(lines[hi]).map(h => h.toLowerCase());
      const r = table(lines, hi, {w: col(H, /^pos$/), s: col(H, /^name$/), ct: col(H, /^cp$/), t: -1, tName}, 'lightcycler');
      out.recs.push(...r.recs); out.undet += r.undet;
    });
    if (out.recs.length) return out;
  }
  /* QuantStudio: [Results]-sectie, anders een kopregel met Well Position en CT */
  {
    let hi = -1; const ri = lines.findIndex(l => /^\[Results\]/i.test(l.trim()));
    for (let k = ri >= 0 ? ri + 1 : 0; k < lines.length; k++) if (/well position/i.test(lines[k]) && /target name/i.test(lines[k])) { hi = k; break; }
    if (hi >= 0) {
      const H = sp(lines[hi]).map(h => h.toLowerCase());
      const ct = col(H, /^(ct|cт|cq|crt)$/);
      if (ct >= 0) { const r = table(lines, hi, {w: col(H, /^well position$/), s: col(H, /^sample name$/), t: col(H, /^target name$/), ct}, 'quantstudio'); if (r.recs.length) return r; }
    }
  }
  /* CFX: kopregel met Well, Target, Sample en Cq */
  {
    const hi = lines.findIndex(l => { const H = sp(l).map(h => h.toLowerCase()); return H.includes('well') && H.includes('target') && H.includes('sample') && H.includes('cq'); });
    if (hi >= 0) {
      const H = sp(lines[hi]).map(h => h.toLowerCase());
      const r = table(lines, hi, {w: H.indexOf('well'), s: H.indexOf('sample'), t: H.indexOf('target'), ct: H.indexOf('cq')}, 'cfx'); if (r.recs.length) return r;
    }
  }
  return {format: '', recs: [], undet: 0};
}

expose({qpcrRead});
