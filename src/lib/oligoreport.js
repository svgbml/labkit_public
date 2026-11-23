/* ================= SYNTHESERAPPORT LEZEN =================
   Leest de tekst van een specificatieblad van een oligo-leverancier (IDT, Sigma/Merck, Eurofins,
   Thermo) per oligo naam, nmol (opbrengst) en MW (g/mol). Drie indelingen:
     1. een tabel met kopregel (tab, ; of 2+ spaties tussen de kolommen)
     2. losse regels met eenheid:  "Fwd_1   28,4 nmol   7650,2 g/mol"
     3. een blok per oligo:  "Oligo name: Fwd_1" / "Yield: 28.4 nmol" / "MW: 7650.2"
   Een komma is decimaalteken, behalve in duizendtallen als 7,650.2 (alleen bij MW).
   Geeft {oligos: [{name, nmol, mw}], bad: [regels die niet te lezen waren]}.
   shortcut: geen komma-gescheiden tabel met decimale komma's, dan is de scheiding dubbelzinnig. */
const NUM = '(\\d+(?:[.,]\\d+)*)';
const toNum = (s, thousands) => {
  s = String(s).trim();
  if (thousands && /^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '');
  else if (thousands && /^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
  else s = s.replace(',', '.');
  return /^\d+(\.\d+)?$/.test(s) ? +s : NaN;
};
const first = (s, th) => { const m = new RegExp(NUM).exec(s); return m ? toNum(m[1], th) : NaN; };
const split = l => (l.includes('\t') ? l.split('\t') : l.includes(';') ? l.split(';') : /\s{2,}|\|/.test(l.trim()) ? l.trim().split(/\s{2,}|\|/) : l.split(','))
  .map(c => c.trim());
const role = c => (/\bmw\b|weight|g\/mol|molmassa|molecular/i.test(c) ? 'mw' : /nmol|yield|amount|opbrengst|hoeveelheid/i.test(c) ? 'nmol'
  : /name|oligo|primer|naam|\bid\b/i.test(c) ? 'name' : '');

export function parseReport(text) {
  const oligos = [], bad = [];
  let cols = null, cur = null;
  const flush = () => { if (cur && cur.nmol > 0 && cur.mw > 0) { oligos.push(cur); cur = null; } };
  const drop = () => { if (cur && (cur.nmol != null || cur.mw != null)) bad.push(cur.name || '?'); cur = null; };
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const cells = split(line), roles = cells.map(role);
    if (roles.includes('nmol') && roles.includes('mw') && !/(^|[\s:])\d[\d.,]*(?=\s|$)/.test(line.replace(/\(.*?\)/g, ''))) { drop(); cols = {}; roles.forEach((r, i) => { if (r && cols[r] == null) cols[r] = i; }); continue; }
    if (cols && cells.length > Math.max(cols.nmol, cols.mw)) {
      const nmol = first(cells[cols.nmol]), mw = first(cells[cols.mw], true), name = cells[cols.name == null ? 0 : cols.name];
      if (nmol > 0 && mw > 0 && name) oligos.push({name, nmol, mw}); else bad.push(line);
      continue;
    }
    const kv = /^(?:oligo\s*|primer\s*|sequence\s*)?name\s*[:=]\s*(.+)$/i.exec(line);
    if (kv) { drop(); cur = {name: kv[1].trim()}; continue; }
    const mn = new RegExp(NUM + '\\s*nmol|(?:yield|amount|nmol|opbrengst)[^:=\\d]*[:=]\\s*' + NUM, 'i').exec(line);
    const mm = new RegExp('(?:\\bMW\\b|mol(?:ecular)?\\.?\\s*weight|molmassa)[^\\d]{0,20}' + NUM + '|' + NUM + '\\s*(?:g/mol|Da\\b)', 'i').exec(line);
    if (!mn && !mm) { if (/\bnmol\b|\bMW\b|g\/mol/i.test(line)) bad.push(line); continue; }
    const at = Math.min(...[mn, mm].filter(Boolean).map(m => m.index));
    const pre = line.slice(0, at), name = at > 0 && !/(yield|amount|nmol|opbrengst|mw|weight)\W*$/i.test(pre) ? pre.replace(/[\s,;:|\-]+$/, '') : '';
    if (name) { drop(); cur = {name}; }
    if (!cur) { bad.push(line); continue; }
    if (mn) cur.nmol = toNum(mn[1] || mn[2]);
    if (mm) cur.mw = toNum(mm[1] || mm[2], true);
    flush();
  }
  drop();
  return {oligos, bad};
}
