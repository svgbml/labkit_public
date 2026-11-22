/* Een plasmidesequentie inlezen: GenBank (met kenmerken), FASTA of alleen basen (S46).
   GenBank: de LOCUS-regel geeft de lengte en of het molecuul circulair is, FEATURES geeft de
   kenmerken met hun plaats en een naam uit /label, /gene, /product of /note, en ORIGIN geeft de
   sequentie (de regels beginnen met een positie, die eraf gaat).
   Plaatsen: 123..456, complement(...), join(...) en de onzekere grenzen <123 en >456. Een join
   over het nulpunt van een circulair plasmide wordt één kenmerk met start > eind (het loopt om).
   NCBI, GenBank Flat File Release (sectie 3.4.12.2, Feature Location). */
import {clean} from './primer.js';

/* kenmerken die op de kaart komen; de rest (source, misc_difference, …) wordt overgeslagen */
export const GB_DRAW = ['CDS', 'gene', 'promoter', 'terminator', 'rep_origin', 'oriT', 'primer_bind',
  'misc_feature', 'regulatory', 'protein_bind', 'polyA_site', 'sig_peptide', 'mobile_element', 'tRNA', 'rRNA', 'ncRNA'];

const NAMEQ = ['label', 'gene', 'product', 'standard_name', 'note', 'bound_moiety', 'mobile_element_type'];

/* één plaatsopgave → {start, end, strand, wrap} (1-based, eind meegeteld) of null */
function parseLoc(s, L) {
  let str = String(s).trim(), strand = 1;
  if (/^complement\(/.test(str)) { strand = -1; str = str.replace(/^complement\(/, '').replace(/\)$/, ''); }
  const join = /^(?:join|order)\((.*)\)$/.exec(str);
  if (join) {
    const parts = join[1].split(/,(?![^(]*\))/).map(p => parseLoc(p, L)).filter(Boolean);
    if (!parts.length) return null;
    /* twee stukken die aan de uiteinden van een circulair plasmide liggen: één omlopend kenmerk */
    if (parts.length === 2 && L && parts[0].end >= L - 1 && parts[1].start <= 2)
      return {start: parts[0].start, end: parts[1].end, strand, wrap: true};
    return {start: Math.min(...parts.map(p => p.start)), end: Math.max(...parts.map(p => p.end)), strand};
  }
  const m = /^[<>]?(\d+)(?:\.\.[<>]?(\d+))?$/.exec(str.replace(/\s+/g, ''));
  if (!m) return null;
  const a = +m[1], b = m[2] ? +m[2] : a;
  /* a > b betekent op een circulair molecuul: het kenmerk loopt over het nulpunt heen */
  return a > b ? {start: a, end: b, strand, wrap: true} : {start: a, end: b, strand};
}

export function parseGenBank(text) {
  const lines = String(text).split(/\r?\n/);
  if (!/^LOCUS\s/.test(lines[0] || '')) return null;
  const loc = /^LOCUS\s+(\S+)\s+(\d+)\s*bp/.exec(lines[0]) || [];
  const out = {name: loc[1] || '', circular: /\bcircular\b/i.test(lines[0]), features: [], seq: ''};
  const L = +loc[2] || 0;
  let mode = '', cur = null, qual = '', seq = [];
  const push = () => {
    if (!cur) return;
    if (qual) { const q = /^\/(\w+)=?"?([^"]*)"?/.exec(qual); if (q) cur.q[q[1]] = q[2]; }
    qual = '';
  };
  const close = () => { push(); if (cur && cur.loc) out.features.push(cur); cur = null; };
  for (const line of lines) {
    if (/^FEATURES\s/.test(line)) { mode = 'f'; continue; }
    if (/^ORIGIN/.test(line)) { close(); mode = 'o'; continue; }
    if (/^\/\//.test(line)) { close(); mode = ''; continue; }
    if (mode === 'o') { seq.push(line.replace(/^\s*\d+/, '').replace(/[^A-Za-z]/g, '')); continue; }
    if (mode !== 'f') { if (/^[A-Z]/.test(line)) mode = ''; continue; }
    const feat = /^ {5}(\S+)\s+(.+)$/.exec(line);
    if (feat) { close(); cur = {type: feat[1], locText: feat[2].trim(), q: {}}; cur.loc = parseLoc(cur.locText, L); continue; }
    const cont = /^ {21}(.*)$/.exec(line);
    if (!cont || !cur) continue;
    const t = cont[1];
    if (/^\//.test(t)) { push(); qual = t; }
    else if (qual) qual += (/-$/.test(qual) ? '' : ' ') + t;            /* een afgebroken waarde */
    else { cur.locText += t.trim(); cur.loc = parseLoc(cur.locText, L); } /* een afgebroken plaats */
  }
  out.seq = clean(seq.join(''));
  out.features = out.features.map(f => {
    const nm = NAMEQ.map(k => f.q[k]).find(v => v && String(v).trim()) || f.type;
    return {type: f.type, name: String(nm).trim(), start: f.loc.start, end: f.loc.end,
      strand: f.loc.strand, wrap: !!f.loc.wrap};
  }).filter(f => f.start >= 1 && (!out.seq.length || f.start <= out.seq.length));
  return out.seq ? out : null;
}

/* GenBank, FASTA of losse basen → {seq, circular, name, features} */
export function readSeq(text, fallbackCircular) {
  const gb = parseGenBank(text);
  if (gb) return gb;
  const lines = String(text || '').split(/\r?\n/);
  const head = lines.find(l => /^\s*>/.test(l));
  const seq = clean(lines.filter(l => !/^\s*[>;]/.test(l)).join(''));
  return {seq, circular: !!fallbackCircular, features: [],
    name: head ? head.replace(/^\s*>\s*/, '').split(/[\s,|]/)[0] : ''};
}
