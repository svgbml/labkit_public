/* ================= SAMENVATTING VAN EEN FLOWCYTOMETER INLEZEN (S94, #139) =================
   flowRead(tekst) → {format, samples: [naam], pops: [{key, name}], pct: {monster: {key: %}}, cnt: {monster: {key: n}}}
   - flowjo:   FlowJo Table Editor, "Save as CSV/TXT": de eerste kolom het monster (.fcs), elke andere kop
               "pad/van/de/populatie | statistiek", met Freq. of Parent (%), Freq. of Total (%) of Count. De
               regels Mean en SD onderaan tellen niet mee.
   - facsdiva: BD FACSDiva, populatiestatistiek als lange tabel: Tube Name (of Specimen Name / Sample),
               Population, #Events, %Parent (en %Total).
   % is het percentage van de ouderpopulatie; staat alleen % van het totaal erin, dan dat. De naam van een
   populatie is het laatste stuk van het pad (CD3+), of het hele pad als twee populaties hetzelfde laatste stuk
   hebben. Getallen met punt of komma (num()). Niets herkend → format '' en geen monsters. */
import {expose} from './global.js';

const sp = l => (l.includes('\t') ? l.split('\t') : l.includes(';') ? l.split(';') : l.split(',')).map(x => x.trim().replace(/^"|"$/g, ''));
const val = s => { const v = num(String(s == null ? '' : s).replace('%', '').trim()); return isFinite(v) ? v : NaN; };
const STAT = [[/freq\.?\s*of\s*parent/i, 'pct'], [/freq\.?\s*of\s*(total|grandparent)/i, 'tot'], [/^(count|#\s*events|events)$/i, 'cnt']];
const stat = s => { for (const [re, k] of STAT) if (re.test(s.trim())) return k; return ''; };

function names(keys) {
  const last = k => k.split('/').pop().trim(), n = {};
  keys.forEach(k => { n[last(k)] = (n[last(k)] || 0) + 1; });
  return keys.map(k => ({key: k, name: n[last(k)] > 1 ? k : last(k)}));
}

function done(format, samples, keys, pct, tot, cnt) {
  for (const s of samples) for (const k of keys) if (!isFinite((pct[s] || {})[k]) && isFinite((tot[s] || {})[k])) (pct[s] = pct[s] || {})[k] = tot[s][k];
  return {format, samples, pops: names(keys), pct, cnt};
}

export function flowRead(text) {
  const lines = String(text || '').replace(/\r/g, '').split('\n').filter(l => l.trim());
  const none = {format: '', samples: [], pops: [], pct: {}, cnt: {}};
  if (!lines.length) return none;
  const H = sp(lines[0]);
  /* FACSDiva: lange tabel met een kolom Population */
  const ip = H.findIndex(h => /^population$/i.test(h));
  if (ip >= 0) {
    const is = H.findIndex(h => /^(tube name|specimen name|sample( name)?|tube)$/i.test(h));
    const ix = k => H.findIndex(h => stat(h.replace(/^%\s*parent$/i, 'Freq. of Parent').replace(/^%\s*total$/i, 'Freq. of Total')) === k);
    const ipc = ix('pct'), it = ix('tot'), ic = ix('cnt');
    const samples = [], keys = [], pct = {}, tot = {}, cnt = {};
    for (const l of lines.slice(1)) {
      const c = sp(l), s = is >= 0 ? c[is] : 'Monster', k = c[ip]; if (!s || !k) continue;
      if (!samples.includes(s)) samples.push(s); if (!keys.includes(k)) keys.push(k);
      if (ipc >= 0) (pct[s] = pct[s] || {})[k] = val(c[ipc]);
      if (it >= 0) (tot[s] = tot[s] || {})[k] = val(c[it]);
      if (ic >= 0) (cnt[s] = cnt[s] || {})[k] = val(c[ic]);
    }
    return samples.length ? done('facsdiva', samples, keys, pct, tot, cnt) : none;
  }
  /* FlowJo: brede tabel met koppen "pad | statistiek" */
  const cols = H.map((h, j) => { const m = h.split('|'); return j && m.length === 2 && stat(m[1].replace(/\(%\)/, '')) ? {j, k: m[0].trim(), s: stat(m[1].replace(/\(%\)/, ''))} : null; }).filter(Boolean);
  if (!cols.length) return none;
  const samples = [], keys = [], pct = {}, tot = {}, cnt = {}, T = {pct, tot, cnt};
  for (const l of lines.slice(1)) {
    const c = sp(l), s = c[0]; if (!s || /^(mean|sd|median|cv)$/i.test(s)) continue;
    samples.push(s);
    for (const x of cols) { if (!keys.includes(x.k)) keys.push(x.k); (T[x.s][s] = T[x.s][s] || {})[x.k] = val(c[x.j]); }
  }
  return samples.length ? done('flowjo', samples, keys, pct, tot, cnt) : none;
}

expose({flowRead});
