/* ================= SNaPshot / SBE (S169, idee #320) =================
   Een single-base-extension-run geeft geen sequentie maar per SNP één piek per allel: de kleur
   zegt welke base is ingebouwd, de lengte welke SNP het is. Een .fsa-bestand is ABIF zoals een
   .ab1 (src/lib/abif.js): DATA1–4 zijn de vier kleurkanalen, DATA105 het vijfde kanaal met de
   lengtestandaard (bij SNaPshot GeneScan-120 LIZ).

   Lengte bepalen: de pieken van de standaard worden op de bekende lengtes gelegd (de grootste
   n pieken, op volgorde van scan), daarna lokale Southern (Elder & Southern 1983, de standaard in
   GeneMapper): per fragment twee keer de vergelijking L = L0 + c/(m − m0) exact door drie
   standaardpieken (twee ervoor en één erna, en één ervoor en twee erna), en het gemiddelde.
   Buiten de standaard of met te weinig pieken aan één kant: lineair tussen de twee dichtstbijzijnde.

   Een panel is tekst, een SNP per regel: `naam min max kleur=allel …`, bv. `rs1 28 32 blauw=G groen=A`.
   De kleuren zijn blauw (kanaal 1, dR110), groen (2, dR6G), zwart of geel (3, dTAMRA), rood (4, dROX).
   Het allel per kleur is dat van de primerstreng; een reverse primer geeft het complement, dat vult
   de maker van het panel zelf in. Zuiver, zonder DOM. */

import {expose} from './global.js';

export const LIZ120 = [15, 20, 25, 35, 50, 62, 80, 110, 120];
export const DYES = ['blauw', 'groen', 'zwart', 'rood'];
const DYE_IN = {blauw: 0, blue: 0, b: 0, groen: 1, green: 1, g: 1, zwart: 2, black: 2, geel: 2, yellow: 2, y: 2, k: 2, rood: 3, red: 3, r: 3};

/* pieken: lokale maxima boven min (standaard 5% van het hoogste punt), minstens w scans uit elkaar;
   scan is de top tussen de scanpunten in */
export function peaks(tr, min, w = 4) {
  let top = 0;
  for (const v of tr) if (v > top) top = v;
  const lim = min != null ? min : top * 0.05, out = [];
  for (let i = 1; i < tr.length - 1; i++) {
    const v = tr[i];
    if (v < lim || v <= 0 || v < tr[i - 1] || v <= tr[i + 1]) continue;
    const last = out[out.length - 1];
    if (last && i - last.scan < w) { if (v > last.h) { last.scan = i; last.h = v; } continue; }
    out.push({scan: i, h: v});
  }
  /* de top tussen de scanpunten: een parabool door de hoogste drie punten */
  return out.map(p => {
    const a = tr[p.scan - 1], b = tr[p.scan], c = tr[p.scan + 1], d = a - 2 * b + c;
    return {scan: d < 0 ? p.scan + 0.5 * (a - c) / d : p.scan, h: p.h};
  });
}

/* de standaard: [{scan, size}] in volgorde van scan, of [] als er minder pieken zijn dan lengtes */
export function sizeLadder(std, sizes = LIZ120) {
  sizes = sizes.slice().sort((a, b) => a - b);
  const p = peaks(std, null, 6);
  if (p.length < sizes.length) return [];
  /* de hoogste n pieken; een ruispiekje vooraan valt zo af */
  const top = p.slice().sort((a, b) => b.h - a.h).slice(0, sizes.length).sort((a, b) => a.scan - b.scan);
  /* langere fragmenten lopen trager, dus op hogere scan */
  return top.map((x, i) => ({scan: x.scan, size: sizes[i]}));
}

/* L = L0 + c/(m − m0) exact door drie punten: lineair in (m0, L0, k = c − L0·m0) via L·m = m0·L + L0·m + k */
function southern3(P, m) {
  const A = P.map(p => [p.size, p.scan, 1]), y = P.map(p => p.size * p.scan);
  const det = M => M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
  const D = det(A);
  if (!D) return null;
  const col = k => det(A.map((r, i) => r.map((v, j) => j === k ? y[i] : v)));
  const m0 = col(0) / D, L0 = col(1) / D, kk = col(2) / D;
  return m === m0 ? null : L0 + (kk + m0 * L0) / (m - m0);
}

/* lengte in nt bij scan m */
export function sizeAt(m, lad) {
  const n = lad.length;
  if (n < 2) return null;
  let i = 0;
  while (i < n && lad[i].scan <= m) i++;   /* lad[i-1].scan <= m < lad[i].scan */
  if (i >= 2 && i <= n - 2) {
    const a = southern3(lad.slice(i - 2, i + 1), m), b = southern3(lad.slice(i - 1, i + 2), m);
    if (a != null && b != null) return (a + b) / 2;
  }
  const j = Math.min(Math.max(i, 1), n - 1), p = lad[j - 1], q = lad[j];
  return p.size + (q.size - p.size) * (m - p.scan) / (q.scan - p.scan);
}

/* panel-tekst → {snps: [{id, min, max, dyes: {kanaal: allel}}], err: [[sleutel, regelnummer]]} */
export function parsePanel(text) {
  const snps = [], err = [];
  String(text || '').split(/\r?\n/).forEach((ln, k) => {
    const w = ln.replace(/[#;].*$/, '').trim().split(/[\s,]+/).filter(Boolean);
    if (!w.length) return;
    const nr = k + 1, min = Number(String(w[1]).replace(',', '.')), max = Number(String(w[2]).replace(',', '.'));
    if (w.length < 4 || !(min > 0) || !(max > min)) { err.push(['Schrijf naam, van, tot (nt) en kleur=allel.', nr]); return; }
    const dyes = {};
    for (const x of w.slice(3)) {
      const m = /^([a-z]+)=([ACGT])$/i.exec(x), d = m && DYE_IN[m[1].toLowerCase()];
      if (d == null) { err.push(['Onbekende kleur of allel (blauw, groen, zwart, rood = A, C, G of T).', nr]); return; }
      dyes[d] = m[2].toUpperCase();
    }
    snps.push({id: w[0], min, max, dyes});
  });
  return {snps, err};
}

/* de kanalen uit een gelezen ABIF (readAbif): {ch: [4 kanalen], std, dyes: [namen]} of een Error */
export function sbeChannels(ab) {
  const arr = x => x == null ? null : [].concat(x);
  const ch = [1, 2, 3, 4].map(k => arr(ab.get('DATA', k)));
  const std = arr(ab.get('DATA', 105));
  if (ch.some(c => !c)) throw new Error('Dit bestand heeft geen vier kleurkanalen.');
  if (!std) throw new Error('Dit bestand heeft geen kanaal met de lengtestandaard.');
  const dyes = [1, 2, 3, 4, 5].map(k => String(ab.get('DyeN', k) || '').trim());
  return {ch, std, dyes};
}

/* per SNP de pieken in zijn venster in zijn kleuren; een allel telt vanaf rel × de hoogste piek van de SNP
   → {ladder, calls: [{id, min, max, peaks: [{dye, allele, size, h}], gt}]}; gt '' = geen call */
export function sbeGenotypes(ch, std, snps, o = {}) {
  const lad = sizeLadder(std, o.sizes || LIZ120), rel = o.rel || 0.1;
  const sized = ch.map(tr => lad.length ? peaks(tr, o.min).map(p => ({scan: p.scan, h: p.h, size: sizeAt(p.scan, lad)})) : []);
  const calls = snps.map(s => {
    const ps = [];
    for (const d in s.dyes) for (const p of sized[d] || []) if (p.size >= s.min && p.size <= s.max) ps.push({dye: +d, allele: s.dyes[d], size: p.size, h: p.h});
    const top = Math.max(0, ...ps.map(p => p.h));
    const al = [...new Set(ps.filter(p => p.h >= rel * top).map(p => p.allele))].sort();
    return {id: s.id, min: s.min, max: s.max, peaks: ps, gt: !al.length ? '' : al.length === 1 ? al[0] + '/' + al[0] : al.join('/')};
  });
  return {ladder: lad, calls};
}

/* Een verzonnen SBE-run om mee te oefenen: de looptijd volgt Southern (L = 300 − 200 000/m), drie SNP's.
   De namen bestaan niet echt. */
export const DEMO_PANEL = 'OEF-A 28 32 blauw=G groen=A\nOEF-B 43 47 zwart=C rood=T\nOEF-C 68 72 groen=A rood=T';
export function sbeDemo() {
  const N = 1500, scan = L => -200000 / (L - 300);
  const g = (a, at, h) => { for (let i = Math.max(0, Math.round(at - 15)); i < Math.min(N, at + 15); i++) a[i] += Math.round(h * Math.exp(-((i - at) ** 2) / 18)); };
  const ch = [0, 1, 2, 3].map(() => new Array(N).fill(0)), std = new Array(N).fill(0);
  for (let i = 0; i < N; i++) { ch.forEach((c, k) => { c[i] = 8 + ((i * 7 + k * 13) % 11); }); std[i] = 6 + (i * 5 % 9); }
  LIZ120.forEach(L => g(std, scan(L), 800));
  [[0, 30.2, 900], [1, 29.8, 700], [2, 45, 1200], [3, 45.3, 40], [3, 70, 1500]].forEach(([k, L, h]) => g(ch[k], scan(L), h));
  return {name: 'oefen-sbe.fsa', ch, std, dyes: ['dR110', 'dR6G', 'dTAMRA', 'dROX', 'LIZ']};
}

expose({sbeLadder: sizeLadder, sbeSizeAt: sizeAt, sbeGenotypes, sbePanel: parsePanel, sbeDemo});
