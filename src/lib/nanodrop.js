/* ================= NANODROP-EXPORT INLEZEN (S94, #138) =================
   nanodropRead(tekst) → {format, rows: [{name, conc, a260, a280, a230, r280, r230}]}
   - nd2000: NanoDrop 2000/2000c/8000, rapport als .tsv (tab): Sample ID, User ID, Date, Time,
             Nucleic Acid Conc., Unit, A260, A280, 260/280, 260/230, Sample Type, Factor.
   - one:    NanoDrop One/OneC en Eight, export .csv (komma of puntkomma): Sample Name, Nucleic Acid(ng/uL)
             (of "Nucleic Acid Conc."), A260/A280, A260/A230, A260 (10 mm path) of A260 (Abs), A280 ….
   De absorbanties in de export staan al op een weglengte van 10 mm, ook als het apparaat met een kortere
   weg mat, en het monster is onverdund gemeten. Ontbreekt een absorbantie maar staat de ratio er wel, dan
   volgt hij uit A260 / ratio. Een regel zonder naam en zonder A260 telt niet mee. Geen kopregel met A260 of
   260/280 gevonden → format '' en geen rijen. */
import {expose} from './global.js';

const sp = l => (l.includes('\t') ? l.split('\t') : l.includes(';') ? l.split(';') : l.split(',')).map(x => x.trim().replace(/^"|"$/g, ''));
const col = (H, re) => H.findIndex(h => re.test(h));
const val = s => { const v = num(String(s == null ? '' : s).trim()); return isFinite(v) ? v : NaN; };

export function nanodropRead(text) {
  const lines = String(text || '').replace(/\r/g, '').split('\n');
  const hi = lines.findIndex(l => /\bA260\b/i.test(l) && /260\s*\/\s*A?280/i.test(l));
  if (hi < 0) return {format: '', rows: []};
  const H = sp(lines[hi]);
  const ix = {
    name: col(H, /^sample\s*(id|name)$/i),
    conc: col(H, /^nucleic\s*acid/i),
    a260: col(H, /^A260(\s*\((10\s*mm( path)?|abs)\))?$/i),
    a280: col(H, /^A280(\s*\((10\s*mm( path)?|abs)\))?$/i),
    a230: col(H, /^A230(\s*\((10\s*mm( path)?|abs)\))?$/i),
    r280: col(H, /^(A)?260\s*\/\s*(A)?280$/i),
    r230: col(H, /^(A)?260\s*\/\s*(A)?230$/i)
  };
  const rows = [];
  for (const l of lines.slice(hi + 1)) {
    const c = sp(l); if (c.every(x => !x)) continue;
    const g = k => (ix[k] >= 0 ? val(c[ix[k]]) : NaN);
    const r = {name: ix.name >= 0 ? c[ix.name] || '' : '', conc: g('conc'), a260: g('a260'), a280: g('a280'), a230: g('a230'), r280: g('r280'), r230: g('r230')};
    if (!isFinite(r.a280) && r.a260 > 0 && r.r280 > 0) r.a280 = r.a260 / r.r280;
    if (!isFinite(r.a230) && r.a260 > 0 && r.r230 > 0) r.a230 = r.a260 / r.r230;
    if (!r.name && !isFinite(r.a260)) continue;
    rows.push(r);
  }
  return {format: ix.name >= 0 && /^sample\s*id$/i.test(H[ix.name]) ? 'nd2000' : 'one', rows};
}

expose({nanodropRead});
