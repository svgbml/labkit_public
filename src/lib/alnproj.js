/* Projectbestand voor de uitlijning (S189): zuivere functies, geen DOM. */

/* ---------- projectbestand (S189) ----------
   Eén JSON: {app, tool: 'aln', versie, opgeslagen, uitlijning (tekst), boom (tekst van .dnd of ''), instellingen {...}}.
   Dezelfde 'app'-sleutel als het sessiebestand van LabKit, met tool: 'aln' om ze uit elkaar te houden. */
export const PROJ_KEYS = ['col', 'cbs', 'thr', 'motif', 'ord', 'hand', 'ref', 'tr', 'code', 'gap', 'from', 'to', 'xf', 'gm', 'pa', 'pb', 'ct', 'cl', 'fgFrom', 'fgTo', 'fgPer', 'fgTitle', 'fgCons'];
export function alnProjectWrite(st, version) {
  const instellingen = {};
  for (const k of PROJ_KEYS) if (st[k] !== undefined) instellingen[k] = st[k];
  return JSON.stringify({app: 'Labkit BML', tool: 'aln', versie: version || '', opgeslagen: new Date().toISOString(), uitlijning: String(st.txt || ''), boom: String(st.dnd || ''), instellingen}, null, 1);
}
/* geeft {txt, dnd, settings} of een Nederlandse foutzin als string in {error} */
export function alnProjectRead(text) {
  let j;
  try { j = JSON.parse(text); } catch (e) { return {error: 'Dit bestand is geen geldige JSON.'}; }
  if (!j || j.app !== 'Labkit BML' || j.tool !== 'aln' || typeof j.uitlijning !== 'string') return {error: 'Dit bestand is geen alignment-project van LabKit.'};
  const s = {}, ins = j.instellingen && typeof j.instellingen === 'object' ? j.instellingen : {};
  for (const k of PROJ_KEYS) if (k in ins) s[k] = ins[k];
  return {txt: j.uitlijning, dnd: typeof j.boom === 'string' ? j.boom : '', settings: s};
}
