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

import {translate, CODES} from './seq.js';

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
/* per kolom de meest voorkomende letter (geen gat), zijn aandeel over alle sequenties (0–1) en
   het aantal gaten (S174);
   de consensus is die letter als het aandeel de drempel haalt, anders x (eiwit) of n (DNA/RNA),
   zoals EMBOSS cons */
export function alnProfile(a) {
  const n = a.seqs.length, top = [], frac = [], gaps = [];
  for (let c = 0; c < a.len; c++) {
    const cnt = {};
    let t = '-', k = 0, g = 0;
    for (const s of a.seqs) { const r = s[c].toUpperCase(); if (r === '-') g++; else if ((cnt[r] = (cnt[r] || 0) + 1) > k) { t = r; k = cnt[r]; } }
    top.push(t); frac.push(n ? k / n : 0); gaps.push(g);
  }
  return {top, frac, gaps};
}
export function alnConsensus(a, p, thr) {
  const no = alnType(a) === 'nt' ? 'n' : 'x';
  return p.top.map((t, c) => t === '-' ? '-' : p.frac[c] * 100 >= thr ? t : no).join('');
}

/* ---------- Motief zoeken (S175) ----------
   Een motief is letters, [..] voor één van een paar letters en X of . voor elke letter; bij DNA/RNA
   ook de IUPAC-codes (N, R, Y, …) en T = U. Gezocht wordt in de sequentie zonder gaten, zodat een
   motief over een gat heen loopt; elke treffer komt terug als [eerste, laatste] kolom (0-based).
   Overlappende treffers tellen mee. Geeft null bij een ongeldig motief. */
const IUPAC = {R: 'AG', Y: 'CTU', S: 'CG', W: 'ATU', K: 'GTU', M: 'AC', B: 'CGTU', D: 'AGTU', H: 'ACTU', V: 'ACG', N: 'ACGTU', T: 'TU', U: 'TU'};
const MAXHITS = 20000;  /* shortcut: een motief als 'X' raakt elke letter; daarboven stoppen, tot iemand meer nodig heeft */
export function alnMotif(a, pat, nt) {
  const p = String(pat || '').toUpperCase().replace(/\s+/g, '');
  if (!/^(?:[A-Z.*]|\[[A-Z*]+\])+$/.test(p)) return null;
  const one = c => c === '.' || (!nt && c === 'X') ? '[^-]' : nt && IUPAC[c] ? '[' + IUPAC[c] + ']' : c === '*' ? '\\*' : c;
  const src = p.replace(/\[([A-Z*]+)\]|./g, (m, g) => g ? '[' + [...g].map(c => (nt && IUPAC[c] || c).replace('*', '\\*')).join('') + ']' : one(m));
  const re = new RegExp('(?=(' + src + '))', 'g');
  let total = 0;
  const hits = a.seqs.map(s => {
    const col = [], out = [];
    let u = '';
    for (let c = 0; c < s.length; c++) if (s[c] !== '-') { col.push(c); u += s[c].toUpperCase(); }
    for (const m of u.matchAll(re)) {
      if (total >= MAXHITS || !m[1]) break;
      out.push([col[m.index], col[m.index + m[1].length - 1]]); total++;
    }
    return out;
  });
  return {hits, total, capped: total >= MAXHITS};
}

/* identiteit van elke sequentie met sequentie ref: gelijke letters / kolommen waar beide een letter hebben */
export function alnIdentity(a, ref) {
  const r = a.seqs[ref].toUpperCase();
  return a.seqs.map(s => {
    let same = 0, both = 0;
    for (let c = 0; c < s.length; c++) {
      const x = s[c].toUpperCase();
      if (x !== '-' && r[c] !== '-') { both++; if (x === r[c]) same++; }
    }
    return both ? same / both : 0;
  });
}

/* ---------- Verschilweergave (S176) ----------
   s tegen referentie r (even lang): een punt waar beide dezelfde letter hebben (hoofd/klein gelijk),
   anders de eigen letter; een gat blijft een gat */
export function alnDiff(s, r) {
  let o = '';
  for (let c = 0; c < s.length; c++) o += s[c] !== '-' && s[c].toUpperCase() === (r[c] || '').toUpperCase() ? '.' : s[c];
  return o;
}

/* ---------- Bijsnijden en maskeren (S177) ----------
   Een nieuwe uitlijning met alleen de kolommen die blijven: binnen from..to (1-based, beide
   inbegrepen; leeg = het hele bereik) en met hoogstens maxGap % gaten (leeg = elke kolom; een kolom
   blijft als het aandeel gaten de drempel niet overschrijdt). De * : . -regel van een
   Clustal-bestand vervalt. */
export function alnTrim(a, o) {
  const f = Math.max(1, o.from || 1), l = Math.min(a.len, o.to || a.len), n = a.seqs.length, keep = [];
  for (let c = f - 1; c < l; c++) {
    if (o.maxGap != null && n) {
      let g = 0; for (const s of a.seqs) if (s[c] === '-') g++;
      if (g * 100 / n > o.maxGap) continue;
    }
    keep.push(c);
  }
  const seqs = a.seqs.map(s => keep.map(c => s[c]).join(''));
  return {...a, seqs, len: keep.length, cons: ''};
}

/* ---------- Schrijven (S177): FASTA, Clustal en PHYLIP ---------- */
export const ALN_OUT = {fasta: ['FASTA', 'fasta'], clustal: ['Clustal', 'aln'], phylip: ['PHYLIP', 'phy'],
  nexus: ['NEXUS', 'nex'], msf: ['GCG MSF', 'msf'], pir: ['PIR/NBRF', 'pir']};
const nm = n => n.replace(/\s+/g, '_');
/* GCG-controlegetal van één sequentie (GCG Wisconsin Package; zoals Bio.SeqUtils.CheckSum.gcg) */
export function gcgCheck(s) {
  let t = 0;
  for (let i = 0; i < s.length; i++) t += (i % 57 + 1) * s.toUpperCase().charCodeAt(i);
  return t % 10000;
}
/* NEXUS-naam: tussen aanhalingstekens zodra er iets anders dan letters, cijfers of een punt in zit
   (de lezer maakt van een kale _ een spatie) */
const nxQ = n => (/^[A-Za-z0-9.]+$/.test(n) ? n : "'" + n.replace(/'/g, "''") + "'");
/* S177, S187: wegschrijven in elk formaat dat parseAlignment leest; terug inlezen geeft dezelfde
   namen (spaties worden _) en sequenties */
export function alnWrite(a, fmt) {
  const names = a.names.map(nm), NL = '\n', nt = alnType(a) === 'nt';
  const blocks = (s, n) => s.match(new RegExp('.{1,' + n + '}', 'g')) || [''];
  if (fmt === 'fasta') return names.map((n, i) => '>' + n + NL + blocks(a.seqs[i], 60).join(NL)).join(NL) + NL;
  if (fmt === 'pir') return names.map((n, i) => '>' + (nt ? 'DL' : 'P1') + ';' + n + NL + n + NL + blocks(a.seqs[i] + '*', 60).join(NL)).join(NL) + NL;
  const w = Math.max(10, ...names.map(n => n.length)) + 1;
  if (fmt === 'phylip') return ' ' + a.seqs.length + ' ' + a.len + NL + names.map((n, i) => n.padEnd(w) + a.seqs[i]).join(NL) + NL;
  if (fmt === 'nexus') {
    const q = names.map(nxQ), qw = Math.max(...q.map(n => n.length)) + 1;
    return '#NEXUS' + NL + NL + 'BEGIN DATA;' + NL + '  DIMENSIONS NTAX=' + a.seqs.length + ' NCHAR=' + a.len + ';' + NL
      + '  FORMAT DATATYPE=' + (nt ? 'DNA' : 'PROTEIN') + ' MISSING=? GAP=-;' + NL + '  MATRIX' + NL
      + q.map((n, i) => '    ' + n.padEnd(qw) + a.seqs[i]).join(NL) + NL + '  ;' + NL + 'END;' + NL;
  }
  if (fmt === 'msf') {
    /* gaten als '.', blokken van 50 in groepjes van 10, zoals GCG */
    const g = a.seqs.map(s => s.replace(/-/g, '.')), ck = g.map(gcgCheck), tot = ck.reduce((x, y) => x + y, 0) % 10000;
    let o = '!!' + (nt ? 'NA' : 'AA') + '_MULTIPLE_ALIGNMENT 1.0' + NL + NL + '  uitlijning.msf  MSF: ' + a.len + '  Type: ' + (nt ? 'N' : 'P') + '  Check: ' + tot + ' ..' + NL + NL
      + names.map((n, i) => ' Name: ' + n.padEnd(w) + 'Len: ' + String(a.len).padStart(6) + '  Check: ' + String(ck[i]).padStart(4) + '  Weight: 1.00').join(NL) + NL + NL + '//' + NL;
    for (let c = 0; c < a.len; c += 50) o += NL + names.map((n, i) => '  ' + n.padEnd(w) + blocks(g[i].slice(c, c + 50), 10).join(' ')).join(NL) + NL;
    return o;
  }
  /* Clustal, met de * : . -regel onder elk blok zoals Clustal hem schrijft (alnConservation) */
  const cons = alnConservation(a);
  let o = 'CLUSTAL multiple sequence alignment' + NL + NL;
  for (let c = 0; c < a.len || !c; c += 60) o += names.map((n, i) => n.padEnd(w) + a.seqs[i].slice(c, c + 60)).join(NL) + NL + (' '.repeat(w) + cons.slice(c, c + 60)).trimEnd() + NL + NL;
  return o;
}

/* ---------- Identiteit tussen alle paren (S178) ----------
   Per paar: gelijke letters (hoofd/klein gelijk) gedeeld door het aantal kolommen volgens de gatregel:
     'ign'  alleen kolommen waar beide een letter hebben; zo rekent Clustal Omega (.pim);
     'mis'  een gat tegenover een letter telt als verschil; kolommen waar beide een gat hebben vallen af;
     'len'  alle kolommen van de uitlijning.
   Gelijkenis (eiwit): gelijk, of beide letters in dezelfde 'sterke' groep van Clustal (: -regel). Het
   resultaat per paar is {same, sim, n (de noemer), gaps (kolommen met een gat in één van beide)}. */
export const ALN_GAPMODES = ['ign', 'mis', 'len'];
export function alnPair(x, y, mode) {
  let same = 0, sim = 0, both = 0, one = 0;
  for (let c = 0; c < x.length; c++) {
    const p = x[c].toUpperCase(), q = y[c].toUpperCase();
    if (p === '-' && q === '-') continue;
    if (p === '-' || q === '-') { one++; continue; }
    both++;
    if (p === q) { same++; sim++; } else if (STRONG.some(g => g.includes(p) && g.includes(q))) sim++;
  }
  const n = mode === 'len' ? x.length : mode === 'mis' ? both + one : both;
  return {same, sim, n, gaps: one, id: n ? same / n : 0, sm: n ? sim / n : 0};
}
export function alnPim(a, mode) {
  const n = a.seqs.length, m = [];
  for (let i = 0; i < n; i++) m.push(new Array(n));
  for (let i = 0; i < n; i++) {
    m[i][i] = a.seqs[i].replace(/-/g, '') ? 1 : 0;
    for (let j = i + 1; j < n; j++) m[i][j] = m[j][i] = alnPair(a.seqs[i], a.seqs[j], mode).id;
  }
  return m;
}
/* de matrix zoals Clustal Omega hem als .pim schrijft: een kopregel, dan per rij nummer, naam en procenten */
export function pimWrite(names, m) {
  const w = Math.max(...names.map(n => n.length)), NL = '\n';
  return 'Percent Identity  Matrix - created by LabKit' + NL + NL + names.map((n, i) =>
    String(i + 1).padStart(6) + ': ' + n.padEnd(w) + m[i].map(v => (v * 100).toFixed(2).padStart(8)).join('')).join(NL) + NL;
}
/* een .pim lezen: namen en waarden in procenten (0-100) */
export function pimParse(text) {
  const names = [], m = [];
  for (const ln of String(text).split(/\r?\n/)) {
    const r = /^\s*(\d+):\s+(\S+)((?:\s+-?\d+(?:\.\d+)?)+)\s*$/.exec(ln);
    if (r) { names.push(r[2]); m.push(r[3].trim().split(/\s+/).map(Number)); }
  }
  return {names, m};
}

/* ---------- Geconserveerde stukken (S179) ----------
   Aaneengesloten kolommen waar het aandeel van de meest voorkomende letter (gaten tellen mee in de
   noemer, zoals alnProfile) minstens thr % is, minstens minLen lang; de langste eerst. seq is de
   meest voorkomende letter per kolom van het stuk (nooit een gat). */
export function alnConserved(a, p, thr, minLen) {
  const t = Math.max(thr, 1e-9), out = [];
  let s = -1;
  for (let c = 0; c <= a.len; c++) {
    const ok = c < a.len && p.top[c] !== '-' && p.frac[c] * 100 >= t;
    if (ok && s < 0) s = c;
    if (!ok && s >= 0) {
      if (c - s >= Math.max(1, minLen)) out.push({from: s + 1, to: c, len: c - s, seq: p.top.slice(s, c).join('')});
      s = -1;
    }
  }
  return out.sort((x, y) => y.len - x.len || x.from - y.from);
}

/* ---------- Vertalen naar eiwit (S181) ----------
   Een nucleotide-uitlijning wordt een eiwituitlijning: vanaf kolom frame (1–3) steeds drie kolommen
   per codon, in elke sequentie. Drie letters geven een aminozuur (tabel code uit CODES, U = T; een
   ambigue base geeft X); drie gaten geven '-', dus een gat van een veelvoud van drie houdt de codons
   uitgelijnd; een codon met één of twee gaten (een frameshift) wordt X. Kolommen na het laatste hele
   codon vervallen. */
export function alnTranslate(a, frame, code) {
  const aa = (CODES[code] || CODES[1])[1], f = Math.max(1, Math.min(3, frame || 1)) - 1;
  const seqs = a.seqs.map(s => {
    let p = '';
    for (let c = f; c + 3 <= s.length; c += 3) {
      const k = s.slice(c, c + 3).toUpperCase().replace(/U/g, 'T'), g = (k.match(/-/g) || []).length;
      p += g === 3 ? '-' : g ? 'X' : translate(k, aa);
    }
    return p;
  });
  return {...a, seqs, len: seqs.length ? seqs[0].length : 0, cons: ''};
}

/* ---------- FASTA klaarmaken voor Clustal Omega (S186) ----------
   Controleert losse (niet uitgelijnde) sequenties voordat je ze uploadt en geeft een schone FASTA
   terug. issues: {k, v} met k = eol (Windows- of oude Mac-regeleinden), dup (zelfde eerste woord
   van de kop: EBI gebruikt dat als naam), bad (andere tekens dan letters), mixed (DNA én eiwit),
   long (naam langer dan NAMEMAX), empty (kop zonder sequentie), noname (tekst vóór de eerste kop).
   De schone FASTA: hoofdletters, alleen letters (spaties en cijfers zoals in GenBank vallen weg),
   lege sequenties en tekst zonder kop weggelaten, een dubbele naam krijgt _2, _3, regels van 60, LF. */
export const NAMEMAX = 30;  /* daarboven kappen sommige programma's en formaten af (PHYLIP al na 10) */
export function fastaCheck(text) {
  const src = String(text || '').replace(/^﻿/, ''), issues = [], recs = [];
  if (/\r/.test(src)) issues.push({k: 'eol'});
  let pre = '';
  for (const ln of src.split(/\r\n|\r|\n/)) {
    if (ln.startsWith('>')) { const h = ln.slice(1).trim(); recs.push({h, id: h.split(/\s+/)[0] || '', raw: ''}); }
    else if (recs.length) recs[recs.length - 1].raw += ln;
    else pre += ln;
  }
  if (/\S/.test(pre)) issues.push({k: 'noname'});
  const bad = new Set(), seen = {}, dup = new Set(), long = [], empty = [], out = [];
  for (const r of recs) {
    const s = r.raw.replace(/[\s\d]/g, '');
    for (const c of s) if (!/[A-Za-z]/.test(c)) bad.add(c);
    if (r.id.length > NAMEMAX) long.push(r.id);
    if (!s) { empty.push(r.id); continue; }
    const k = seen[r.id] = (seen[r.id] || 0) + 1;
    out.push({h: k > 1 ? r.id + '_' + k + r.h.slice(r.id.length) : r.h, seq: s.replace(/[^A-Za-z]/g, '').toUpperCase()});
  }
  recs.forEach((r, i) => { if (recs.findIndex(q => q.id === r.id) < i) dup.add(r.id); });
  if (dup.size) issues.push({k: 'dup', v: [...dup]});
  if (bad.size) issues.push({k: 'bad', v: [...bad]});
  if (long.length) issues.push({k: 'long', v: long});
  if (empty.length) issues.push({k: 'empty', v: empty});
  const types = new Set(out.map(r => alnType({seqs: [r.seq]})));
  if (types.has('nt') && types.has('aa')) issues.push({k: 'mixed'});
  return {issues, n: out.length, type: alnType({seqs: out.map(r => r.seq)}),
    clean: out.map(r => '>' + r.h + '\n' + r.seq.match(/.{1,60}/g).join('\n') + '\n').join('')};
}

/* ---------- Figuur (S188) ----------
   De uitlijning als SVG in blokken van `width` kolommen, zoals Clustal hem afdrukt: per blok een
   regel met het nummer van de eerste en laatste kolom (vanaf `start`), de rijen met naam, en de
   * : . -regel. fill(rij, kolom) geeft een achtergrondkleur of ''; elke run van dezelfde kleur is één
   rechthoek. Elke letter staat op een vaste x (een x-lijst per regel), dus het lettertype verschuift niets.
   Geeft {blocks: [svg per blok], svg: alles onder elkaar, w, h}. */
const FCW = 8, FRH = 14, FGAP = 10;
const xe = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export function alnSvg(a, o = {}) {
  const width = Math.max(1, Math.round(o.width) || 60), start = o.start || 1, fill = o.fill || (() => '');
  const cons = alnConservation(a), names = a.names.map(n => (n.length > 30 ? n.slice(0, 29) + '…' : n));
  const nw = (Math.max(4, ...names.map(n => n.length)) + 2) * FCW, W = nw + width * FCW + 6 * FCW;
  const row = (y, s) => '<text x="' + [...s].map((_, k) => nw + k * FCW + FCW / 2).join(' ') + '" y="' + y + '" text-anchor="middle">' + xe(s) + '</text>';
  const inner = [], base = y => y + FRH - 3;  /* tekstbasislijn in een rij */
  for (let c0 = 0; c0 < a.len; c0 += width) {
    const c1 = Math.min(a.len, c0 + width);
    let o2 = '<text x="' + nw + '" y="' + base(0) + '" fill="#555">' + (start + c0) + '</text>'
      + '<text x="' + (nw + (c1 - c0) * FCW + FCW) + '" y="' + base(0) + '" fill="#555">' + (start + c1 - 1) + '</text>';
    a.seqs.forEach((s, i) => {
      const y = (i + 1) * FRH;
      for (let c = c0; c < c1;) {
        const f = fill(i, c); let e = c + 1;
        while (e < c1 && fill(i, e) === f) e++;
        if (f) o2 += '<rect x="' + (nw + (c - c0) * FCW) + '" y="' + y + '" width="' + (e - c) * FCW + '" height="' + FRH + '" fill="' + f + '"/>';
        c = e;
      }
      o2 += '<text x="0" y="' + base(y) + '">' + xe(names[i]) + '</text>' + row(base(y), s.slice(c0, c1));
    });
    inner.push({h: (a.seqs.length + 2) * FRH, body: o2 + row(base((a.seqs.length + 1) * FRH), cons.slice(c0, c1))});
  }
  const head = (w, h) => '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h
    + '" font-family="ui-monospace,Consolas,Menlo,monospace" font-size="12" style="white-space:pre"><rect width="100%" height="100%" fill="#fff"/>';
  let y = 0, all = '';
  for (const b of inner) { all += '<g transform="translate(0,' + y + ')">' + b.body + '</g>'; y += b.h + FGAP; }
  const H = Math.max(0, y - FGAP);
  return {blocks: inner.map(b => head(W, b.h) + b.body + '</svg>'), svg: head(W, H) + all + '</svg>', w: W, h: H};
}
