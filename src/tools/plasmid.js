/* Het lezen van een plasmide (S46): GenBank of kale sequentie erin, kenmerken en knipplaatsen
   eruit. Het tekenwerk staat in Pmap.vue; dit bestand rekent alleen.
   shortcut: alleen eenvoudige locaties (123..456, complement(...), join met twee delen);
   een kenmerk dat de oorsprong overspant of een ingewikkelde join wordt overgeslagen. */
import {cleanSeq, cutsOf, ENZ} from './seqTools.js';

const KIND = [[/promoter|^P[A-Z0-9]|T7|SP6|lac|CMV/i, 'promotor'], [/CDS|gene|orf/i, 'gen'],
  [/rep_origin|^ori/i, 'origin'], [/terminator/i, 'terminator'], [/primer_bind/i, 'primer']];
const kindOf = (type, label) => (KIND.find(([r]) => r.test(type) || r.test(label)) || [, 'kenmerk'])[1];

/* een GenBank-bestand: ORIGIN-sequentie, LOCUS-lengte, circulair en de kenmerken */
export function parseGenBank(txt) {
  const s = String(txt || '');
  if (!/^LOCUS\s/m.test(s)) return null;
  const oi = s.search(/^ORIGIN/m);
  const seq = oi < 0 ? '' : cleanSeq(s.slice(oi).replace(/^ORIGIN.*$/m, '').replace(/\/\/\s*$/, '').replace(/\d+/g, ''));
  const circular = /^LOCUS.*\bcircular\b/im.test(s);
  const fi = s.search(/^FEATURES/m);
  const feats = [];
  if (fi >= 0) {
    const block = s.slice(fi, oi < 0 ? undefined : oi).split(/\r?\n/).slice(1);
    let cur = null;
    const push = () => { if (!cur) return; const f = loc(cur.loc); if (f) feats.push({...f, type: cur.type, label: cur.label || cur.type, kind: kindOf(cur.type, cur.label || '')}); cur = null; };
    block.forEach(line => {
      const m = line.match(/^ {5}(\S+)\s+(\S.*)$/);
      if (m) { push(); cur = {type: m[1], loc: m[2].trim(), label: ''}; return; }
      if (!cur) return;
      const q = line.match(/^\s+\/(label|gene|product|note)="?([^"]*)"?/);
      if (q && !cur.label) cur.label = q[2].trim();
      else if (/^\s+[\d<>.]+/.test(line) && !/^\s+\//.test(line)) cur.loc += line.trim();
    });
    push();
  }
  return {seq, circular, feats, n: seq.length};
}

/* "complement(12..34)" → {from, to, dir}; 0-gebaseerd, to exclusief */
function loc(t) {
  const dir = /complement/.test(t) ? -1 : 1;
  const m = t.replace(/[<>]/g, '').match(/(\d+)\.\.(\d+)/);
  if (!m) { const one = t.match(/(\d+)/); return one ? {from: +one[1] - 1, to: +one[1], dir} : null; }
  return {from: +m[1] - 1, to: +m[2], dir};
}

/* enzymen die precies `max` keer of minder knippen, met hun posities */
export function uniqueSites(seq, circular, max) {
  const out = [];
  Object.keys(ENZ).forEach(e => {
    const c = cutsOf(seq, e, circular);
    if (c.length && c.length <= max) out.push({e, cuts: c});
  });
  return out.sort((a, b) => a.cuts[0] - b.cuts[0]);
}
