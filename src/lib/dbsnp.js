/* ================= dbSNP: een esummary-antwoord uitlezen (S196) =================
   Zuivere functie: JSON van esummary?db=snp in, een platte uitslag uit. Geen verzoek, geen DOM.
   pos is 1-gebaseerd (spdi telt vanaf 0); acc en pos blijven getallen/tekst voor S197/S199. */
import {expose} from './global.js';

/* 'rs1805007', 'RS1805007', ' 1805007 ' -> '1805007', anders null */
export function rsId(s) {
  const m = /^(?:rs)?\s*(\d{1,12})$/i.exec(String(s == null ? '' : s).trim());
  return m ? String(+m[1]) : null;
}

const list = s => String(s || '').split(',').map(x => x.trim()).filter(Boolean);

export function parseSnp(json, id) {
  const res = json && json.result, rec = res && (res[id] || (res.uids && res.uids.length ? res[res.uids[0]] : null));
  if (!rec || rec.error) return {ok: false, notFound: true, id: String(id)};
  const sp = list(rec.spdi).map(x => x.split(':')).filter(a => a.length === 4);
  const first = sp[0];
  const alts = [];
  sp.forEach(a => { if (a[3] && alts.indexOf(a[3]) < 0) alts.push(a[3]); });
  const doc = String(rec.docsum || '').split('|').find(x => x.indexOf('HGVS=') === 0);
  const freqs = (rec.global_mafs || []).map(f => {
    const m = /^([^=]+)=([0-9.eE+-]+)\/(\d+)$/.exec(String(f.freq || ''));
    return m ? {study: f.study, allele: m[1], freq: parseFloat(m[2]), n: +m[3]} : null;
  }).filter(Boolean);
  return {
    ok: true, notFound: false, id: String(rec.snp_id || id),
    genes: (rec.genes || []).map(g => g.name).filter(Boolean),
    chr: rec.chr || '',
    acc: first ? first[0] : rec.acc || '',
    pos: first ? +first[1] + 1 : null,
    ref: first ? first[2] : '',
    alts,
    fxn: list(rec.fxn_class),
    clin: list(rec.clinical_significance),
    hgvs: doc ? list(doc.slice(5)) : [],
    freqs
  };
}

/* accessienummer: NM_002386.4, NC_000016.10, U12345.1 */
export const accOk = s => /^[A-Z]{1,2}_?\d+(\.\d+)?$/i.test(String(s == null ? '' : s).trim());

/* Van/Tot (1-gebaseerd, inclusief): beide leeg of beide gehele getallen met 1 <= van <= tot */
export function regionOk(from, to) {
  const a = String(from == null ? '' : from).trim(), b = String(to == null ? '' : to).trim();
  if (!a && !b) return {ok: true, none: true};
  if (!/^\d+$/.test(a) || !/^\d+$/.test(b) || +a < 1 || +a > +b) return {ok: false};
  return {ok: true, none: false, from: +a, to: +b};
}

expose({parseSnp, rsId, accOk, regionOk});
