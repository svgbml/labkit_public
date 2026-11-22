/* Een uitgelijnde set sequenties inlezen (S170): Clustal (.aln), uitgelijnde FASTA, PHYLIP
   (strikt en ruim, sequentieel en interleaved), NEXUS (DATA- of CHARACTERS-blok), GCG MSF en
   PIR/NBRF. Alles komt in één model:
     {format, names: [...], seqs: [...], len, cons, warn: [...]}
   seqs zijn even lange strings met '-' als gat (ook '.' en '~' uit MSF worden '-'); hoofd- en
   kleine letters blijven zoals ze in het bestand staan. cons is de regel met * : . onder een
   Clustal-blok (anders ''), warn zijn Nederlandse zinnen voor de gebruiker (één sleutel per zin).
   Formaten volgens: Clustal W/X-documentatie (Thompson e.a. 1994; Larkin e.a. 2007), PHYLIP 3.6
   (Felsenstein, "Molecular sequence data"), NEXUS (Maddison, Swofford & Maddison 1997, Syst. Biol.
   46:590), GCG Wisconsin Package MSF en PIR (NBRF). */

const GAPS = /[.~]/g;

/* naam van het formaat aan de eerste regels herkennen; null als het niets bekends is */
export function alnDetect(text) {
  const s = String(text).replace(/^﻿/, '').trimStart();
  const first = s.split(/\r?\n/, 1)[0] || '';
  if (/^#NEXUS/i.test(first)) return 'nexus';
  if (/^(CLUSTAL|MUSCLE|PROBCONS)/i.test(first)) return 'clustal';
  if (/^!!(AA|NA)_MULTIPLE_ALIGNMENT/i.test(first) || /^\s*(PileUp|MSF:)/m.test(s.slice(0, 2000)) && /^\/\/\s*$/m.test(s)) return 'msf';
  if (/^>(P1|F1|DL|DC|RL|RC|N3|N1|XX);/.test(first)) return 'pir';
  if (/^>/.test(first)) return 'fasta';
  if (/^\s*\d+\s+\d+/.test(first)) return 'phylip';
  return null;
}

/* ---------- Clustal ---------- */
function clustal(lines) {
  const names = [], idx = {}, seqs = [];
  let cons = '';
  for (let i = 1; i < lines.length; i++) {
    const ln = lines[i];
    if (!ln.trim()) continue;
    const m = /^(\S+)(\s+)(\S+)(?:\s+\d+)?\s*$/.exec(ln);
    if (!m || /^\s/.test(ln)) continue;
    const name = m[1];
    if (!(name in idx)) { idx[name] = names.length; names.push(name); seqs.push(''); }
    seqs[idx[name]] += m[3];
    /* de laatste regel van een blok: de regel erna is de *:.-regel (of leeg als niets
       geconserveerd is), op dezelfde kolom als de sequenties */
    const nx = lines[i + 1] || '';
    if (!/^\S/.test(nx)) {
      const off = m[1].length + m[2].length;
      cons += (nx.slice(off) + ' '.repeat(m[3].length)).slice(0, m[3].length);
    }
  }
  if (!cons.trim()) cons = '';
  return {names, seqs, cons};
}

/* ---------- FASTA en PIR ---------- */
function fasta(lines, pir) {
  const names = [], seqs = [];
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (ln.startsWith('>')) {
      names.push(pir ? ln.replace(/^>..;/, '').trim() : ln.slice(1).trim().split(/\s+/)[0] || ('seq' + (names.length + 1)));
      seqs.push('');
      if (pir) i++; /* PIR: de regel na de kop is de beschrijving */
    } else if (seqs.length && !ln.startsWith(';')) seqs[seqs.length - 1] += ln.replace(/[\s*\d]/g, '');
  }
  return {names, seqs};
}

/* ---------- PHYLIP ---------- */
function phylip(lines) {
  const body = lines.filter(l => l.trim());
  const [nt, nc] = body[0].trim().split(/\s+/).map(Number);
  const rest = body.slice(1);
  const clean = s => s.replace(/\s+/g, '');
  /* een naam is óf de eerste 10 tekens (strikt), óf alles tot de eerste spatie (ruim) */
  const split = (l, strict) => {
    if (strict) return [l.slice(0, 10).trim(), clean(l.slice(10))];
    const m = /^\s*(\S+)\s*(.*)$/.exec(l);
    return [m[1], clean(m[2])];
  };
  const ok = r => r.seqs.length === nt && r.seqs.every(s => s.length === nc);
  const tryParse = (strict, inter) => {
    const names = [], seqs = [];
    if (inter) {
      rest.forEach((l, i) => {
        if (i < nt) { const [n, s] = split(l, strict); names.push(n); seqs.push(s); }
        else seqs[(i - nt) % nt] += clean(l);
      });
    } else {
      for (const l of rest) {
        const cur = seqs.length - 1;
        if (cur >= 0 && seqs[cur].length < nc) seqs[cur] += clean(l);
        else { const [n, s] = split(l, strict); names.push(n); seqs.push(s); }
      }
    }
    return {names, seqs};
  };
  for (const [strict, inter] of [[false, true], [true, true], [false, false], [true, false]]) {
    const r = tryParse(strict, inter);
    if (ok(r)) return r;
  }
  const r = tryParse(false, true);
  r.warn = ['De kop van het PHYLIP-bestand klopt niet met het aantal sequenties of hun lengte.'];
  return r;
}

/* ---------- NEXUS ---------- */
/* [commentaar] mag genest zijn; tekst tussen 'enkele aanhalingstekens' is één naam */
function stripComments(s) {
  let out = '', depth = 0, q = false;
  for (const c of s) {
    if (!depth && c === "'") q = !q;
    if (!q && c === '[') { depth++; continue; }
    if (!q && c === ']' && depth) { depth--; continue; }
    if (!depth) out += c;
  }
  return out;
}

/* een NEXUS-naam: aanhalingstekens weg, '' wordt ', een _ staat voor een spatie */
const nxName = n => (/^'.*'$/.test(n) ? n.slice(1, -1).replace(/''/g, "'") : n.replace(/_/g, ' '));

function nexus(text) {
  const t = stripComments(text);
  const blk = /begin\s+(data|characters)\s*;([\s\S]*?)\bend(block)?\s*;/i.exec(t);
  if (!blk) return {names: [], seqs: [], warn: ['Geen DATA- of CHARACTERS-blok gevonden in het NEXUS-bestand.']};
  const b = blk[2];
  const nt = +(/ntax\s*=\s*(\d+)/i.exec(b) || [])[1] || 0;
  const nc = +(/nchar\s*=\s*(\d+)/i.exec(b) || [])[1] || 0;
  const fm = (/\bformat\b([^;]*);/i.exec(b) || [])[1] || '';
  const opt = k => ((new RegExp(k + '\\s*=\\s*(\\S)', 'i')).exec(fm) || [])[1];
  const gap = opt('gap') || '-', match = opt('matchchar');
  const inter = /\binterleave\b(?!\s*=\s*no)/i.test(fm);
  const mx = /\bmatrix\b([\s\S]*?);/i.exec(b);
  const names = [], idx = {}, seqs = [];
  const add = (n, s) => {
    const k = nxName(n);
    if (!(k in idx)) { idx[k] = names.length; names.push(k); seqs.push(''); }
    seqs[idx[k]] += s;
  };
  const tok = /'(?:[^']|'')*'|\S+/g;
  if (mx) {
    if (inter) {
      for (const l of mx[1].split(/\r?\n/)) {
        const w = l.match(tok);
        if (w && w.length > 1) add(w[0], w.slice(1).join(''));
      }
    } else {
      /* sequentieel: naam, dan tekens tot de sequentie nchar lang is */
      const w = mx[1].match(tok) || [];
      let cur = null;
      for (const x of w) {
        if (cur == null || (nc && seqs[idx[cur]].length >= nc)) { cur = nxName(x); add(x, ''); }
        else seqs[idx[cur]] += x;
      }
    }
  }
  let out = seqs.map(s => (gap !== '-' ? s.split(gap).join('-') : s));
  if (match) out = out.map((s, i) => (i ? [...s].map((c, j) => (c === match ? out[0][j] || c : c)).join('') : s));
  const warn = [];
  if (nt && names.length !== nt) warn.push('Het NEXUS-bestand noemt een ander aantal taxa (ntax) dan er in de matrix staan.');
  if (nc && out.some(s => s.length !== nc)) warn.push('Niet elke sequentie heeft de lengte die het NEXUS-bestand opgeeft (nchar).');
  return {names, seqs: out, warn};
}

/* ---------- GCG MSF ---------- */
function msf(lines) {
  const sep = lines.findIndex(l => /^\/\/\s*$/.test(l));
  const head = lines.slice(0, sep), body = lines.slice(sep + 1);
  const names = [], idx = {}, seqs = [];
  head.forEach(l => {
    const m = /^\s*Name:\s*(\S+)/.exec(l);
    if (m && !(m[1] in idx)) { idx[m[1]] = names.length; names.push(m[1]); seqs.push(''); }
  });
  const fixed = names.length > 0;
  for (const l of body) {
    const m = /^\s*(\S+)\s+(.*)$/.exec(l);
    if (!m) continue;
    if (!(m[1] in idx)) {
      if (fixed) continue; /* bv. een regel met posities */
      idx[m[1]] = names.length; names.push(m[1]); seqs.push('');
    }
    seqs[idx[m[1]]] += m[2].replace(/\s+/g, '');
  }
  return {names, seqs};
}

/* de tekst inlezen; geeft altijd een model terug (bij onbekende tekst met lege seqs) */
export function parseAlignment(text) {
  const src = String(text || '').replace(/^﻿/, '');
  const format = alnDetect(src);
  const lines = src.split(/\r?\n/);
  let r = {names: [], seqs: []};
  if (format === 'clustal') r = clustal(lines);
  else if (format === 'fasta') r = fasta(lines, false);
  else if (format === 'pir') r = fasta(lines, true);
  else if (format === 'phylip') r = phylip(lines);
  else if (format === 'nexus') r = nexus(src);
  else if (format === 'msf') r = msf(lines);
  const warn = (r.warn || []).slice();
  let seqs = r.seqs.map(s => s.replace(GAPS, '-'));
  const len = seqs.reduce((a, s) => Math.max(a, s.length), 0);
  if (seqs.some(s => s.length !== len)) {
    warn.push('Niet alle sequenties zijn even lang: aangevuld met gaten aan het eind. Is dit wel een uitlijning?');
    seqs = seqs.map(s => s.padEnd(len, '-'));
  }
  if (new Set(r.names).size !== r.names.length) warn.push('Twee of meer sequenties hebben dezelfde naam.');
  return {format, names: r.names, seqs, len, cons: r.cons || '', warn};
}

/* DNA/RNA of eiwit: als ten minste 90% van de letters A, C, G, T, U of N is */
export function alnType(a) {
  let n = 0, nt = 0;
  for (const s of a.seqs) for (const c of s.toUpperCase()) {
    if (c === '-' || c === '?') continue;
    n++; if ('ACGTUN'.includes(c)) nt++;
  }
  return !n ? '' : nt / n >= 0.9 ? 'nt' : 'aa';
}

/* ---------- Kleuren (S172) ----------
   Per kolom een tabel residu (hoofdletter) → klassenaam, zodat de viewer alleen hoeft op te zoeken.
   ClustalX: de regels uit colprot.par van Clustal X (Larkin e.a. 2007), zoals Jalview ze documenteert
   ("Clustal X colours"): een residu krijgt zijn kleur alleen als de kolom aan een drempel voldoet.
   Percentages over alle sequenties van de kolom (gaten tellen mee in de noemer, zoals Jalview).
   Nucleotiden: vaste kleur per base. Identiteit: de meest voorkomende letter van de kolom, in drie
   tinten bij > 80, > 60 en > 40% (Jalview "Percentage identity"). */
const HYD = 'WLVIMAFCHP';
function clustalxCol(cnt, n) {
  const p = s => { let k = 0; for (const c of s) k += cnt[c] || 0; return k * 100 / n; };
  const any = (s, t) => [...s].some(c => (cnt[c] || 0) * 100 / n > t);
  const hyd = p(HYD) > 60, kr = p('KR') > 60, qe = p('QE') > 50, ed = p('ED') > 50, out = {G: 'co', P: 'cy'};
  if (hyd) for (const c of 'AILMFWV') out[c] = 'cb';
  out.C = any('C', 85) ? 'cp' : hyd ? 'cb' : '';
  if (kr || any('KRQ', 80)) out.K = out.R = 'cr';
  if (kr || qe || ed || any('EQD', 85)) out.E = 'cm';
  if (kr || ed || any('KRQ', 85)) out.D = 'cm';
  if (any('N', 50) || any('NY', 85)) out.N = 'cg';
  if (kr || qe || any('QEKR', 85)) out.Q = 'cg';
  if (hyd || p('TS') > 50 || any('ST', 85)) out.S = out.T = 'cg';
  if (hyd || any('WYACPQFHILMV', 85)) out.H = out.Y = 'cc';
  return out;
}
const NUC = {A: 'na', C: 'nc', G: 'ng', T: 'nt', U: 'nt'};
export function alnColours(a, scheme) {
  if (scheme === 'nt') return null;  /* vaste kleur per base: geen kolomtabel nodig */
  const n = a.seqs.length, cols = [];
  for (let c = 0; c < a.len; c++) {
    const cnt = {};
    for (const s of a.seqs) { const r = s[c].toUpperCase(); if (r !== '-') cnt[r] = (cnt[r] || 0) + 1; }
    if (scheme === 'clustalx') { cols.push(clustalxCol(cnt, n)); continue; }
    let top = '', k = 0;
    for (const r in cnt) if (cnt[r] > k) { top = r; k = cnt[r]; }
    const f = k * 100 / n;
    cols.push(f > 80 ? {[top]: 'i3'} : f > 60 ? {[top]: 'i2'} : f > 40 ? {[top]: 'i1'} : {});
  }
  return cols;
}
/* klasse van residu r in kolom c (of '') bij een tabel van alnColours */
export const alnCls = (tab, c, r) => (tab ? tab[c][r.toUpperCase()] : NUC[r.toUpperCase()]) || '';

/* ---------- Conservering en consensus (S173) ----------
   De * : . -regel zoals Clustal W/X hem schrijft (Thompson e.a. 1994; Larkin e.a. 2007): '*' als de
   kolom overal dezelfde letter heeft, ':' als alle letters in één 'sterke' groep vallen, '.' bij
   één 'zwakke' groep, anders een spatie. Een gat in de kolom geeft altijd een spatie. Bij DNA/RNA
   schrijft Clustal alleen '*'. */
const STRONG = ['STA', 'NEQK', 'NHQK', 'NDEQ', 'QHRK', 'MILV', 'MILF', 'HY', 'FYW'];
const WEAK = ['CSA', 'ATV', 'SAG', 'STNK', 'STPA', 'SGND', 'SNDEQK', 'NDEQHK', 'NEQHRK', 'FVLIM', 'HFY'];
export function alnConservation(a) {
  const nt = alnType(a) === 'nt', in1 = (set, gs) => gs.some(g => [...set].every(c => g.includes(c)));
  let out = '';
  for (let c = 0; c < a.len; c++) {
    const set = new Set(a.seqs.map(s => s[c].toUpperCase()));
    out += set.has('-') || !set.size ? ' ' : set.size === 1 ? '*' : nt ? ' ' : in1(set, STRONG) ? ':' : in1(set, WEAK) ? '.' : ' ';
  }
  return out;
}
/* per kolom de meest voorkomende letter (geen gat) en zijn aandeel over alle sequenties (0–1);
   de consensus is die letter als het aandeel de drempel haalt, anders x (eiwit) of n (DNA/RNA),
   zoals EMBOSS cons */
export function alnProfile(a) {
  const n = a.seqs.length, top = [], frac = [];
  for (let c = 0; c < a.len; c++) {
    const cnt = {};
    let t = '-', k = 0;
    for (const s of a.seqs) { const r = s[c].toUpperCase(); if (r !== '-' && (cnt[r] = (cnt[r] || 0) + 1) > k) { t = r; k = cnt[r]; } }
    top.push(t); frac.push(n ? k / n : 0);
  }
  return {top, frac};
}
export function alnConsensus(a, p, thr) {
  const no = alnType(a) === 'nt' ? 'n' : 'x';
  return p.top.map((t, c) => t === '-' ? '-' : p.frac[c] * 100 >= thr ? t : no).join('');
}
