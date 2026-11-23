/* Een hele Sanger-case in één projectbestand (S168, #329 #330): de reads (met trace en bewerkingen), de instellingen,
   de referentie en de assay, het genotypeblad en de uitkomsten van de webtool.
   Het bestand heeft dezelfde kop als het sessiebestand van LabKit (app: 'Labkit BML'), met format 'labkit-sanger-case';
   het sessiebestand van de hele app (Sessie opslaan) bewaart dezelfde sleutels al als onderdeel van alles wat op dit
   apparaat staat (sg-read, labkit:v1:sg-assays, labkit:v1:sg-sheet), maar zonder de tweede read en de batch. */
import {RESULT_KEYS} from './hiris.js';
import {SNPS} from './hiris.js';

export const CASE_FMT = 'labkit-sanger-case';

/* state = {read, read2, batch: [read], win, qthr, hthr, refText, assay (object of null), assayKey, sheet} → het bestand als object */
export function makeCase(state, appver = '') {
  return {app: 'Labkit BML', format: CASE_FMT, version: 1, labkit: appver, saved: new Date().toISOString(),
    read: state.read || null, read2: state.read2 || null, batch: state.batch || [],
    win: state.win, qthr: state.qthr, hthr: state.hthr, refText: state.refText || '', assay: state.assay || null, assayKey: state.assayKey || '',
    sheet: state.sheet || {panel: 'hirisplexs', samples: []}};
}

const isRead = r => r && typeof r === 'object' && typeof r.bases === 'string' && Array.isArray(r.peaks) && Array.isArray(r.qual);
/* tekst → {ok, c} of {ok: false, err: zin (vertaalsleutel)} */
export function parseCase(text) {
  let o;
  try { o = JSON.parse(text); } catch (e) { return {ok: false, err: 'Dit is geen geldig JSON-bestand.'}; }
  if (!o || o.app !== 'Labkit BML' || o.format !== CASE_FMT) return {ok: false, err: 'Dit bestand is geen Sanger-case van LabKit.'};
  if (o.read && !isRead(o.read) || o.read2 && !isRead(o.read2) || !Array.isArray(o.batch) || !o.batch.every(isRead)) return {ok: false, err: 'De reads in dit bestand zijn onvolledig.'};
  const sh = o.sheet && Array.isArray(o.sheet.samples) ? o.sheet : {panel: 'hirisplexs', samples: []};
  sh.samples = sh.samples.map(s => ({id: String(s.id || ''), vals: s.vals || {}, notes: s.notes || {}, res: s.res || {}}));
  return {ok: true, c: Object.assign({}, o, {sheet: sh, batch: o.batch})};
}

/* ---------- het voorbeeld (alles verzonnen) ----------
   Een monster 'Voorbeeld (verzonnen)' met een volledig blad van 41 verzonnen waarden en verzonnen kansen, zodat je het hele pad
   (blad, controle, export, uitkomsten, rapport) kunt volgen zonder sequencer. Het hoort bij geen enkel echt persoon. */
export const EXAMPLE_ID = 'Voorbeeld (verzonnen)';
export function exampleSample() {
  const vals = {}, f = [1, 0, 2, 0, 1, 1, 0, 2, 0, 0];   // een vast, verzonnen patroon; twee ontbrekende waarden (NA)
  SNPS.forEach((s, i) => { vals[s.rs] = f[(i * 7 + 3) % f.length] + ''; });
  vals.rs201326893 = 'NA'; vals.rs6059655 = 'NA';
  const res = {};
  const P = {eye: ['0,05', '0,15', '0,8'], hair: ['0,1', '0,6', '0,1', '0,2'], shade: ['0,3', '0,7'], skin: ['0,05', '0,2', '0,6', '0,1', '0,05']};
  for (const g in P) P[g].forEach((v, i) => { res[g + '.' + i] = v; });
  return {id: EXAMPLE_ID, vals, notes: {}, res};
}
export const EXAMPLE_KEYS = RESULT_KEYS;
