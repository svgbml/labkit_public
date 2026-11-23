/* Invoer voor Clustal Omega klaarmaken en uitkomst terugnemen (S186–S189). Clustal Omega zelf draait
   bij EBI; hier staan alleen de zuivere functies eromheen:
     fastaCheck()    leest geplakte reeksen, controleert ze en geeft schone FASTA terug (S186);
   Naamlimiet: Clustal Omega leest namen tot 64 tekens (SQINFO_NAMELEN in zijn squid-bibliotheek, de bron
   die het meelevert), maar de uitvoer en de meeste vervolgprogramma's (PHYLIP: 10, Clustal W: 30) kappen veel
   eerder af. We controleren op 30, de strengste waarde die Clustal zelf nog als 'naam' bewaart; de
   constante is NAMEMAX en staat hier op één plek. */

export const NAMEMAX = 30;
const NT_OK = /^[ACGTUNRYKMSWBDHV]$/i, AA_OK = /^[ACDEFGHIKLMNPQRSTVWYBJOUXZ]$/i;

/* tekst → {text (schone FASTA), recs, issues, eol, type}. Een issue is {id, kind: 'bad'|'warn'|'info', msg (Nederlandse zin), detail}.
   type: 'auto' (uit de letters), 'nt' of 'aa'. */
export function fastaCheck(raw, type) {
  const src = String(raw || '').replace(/^/, ''), issues = [];
  const crlf = (src.match(/\r\n/g) || []).length, cr = (src.replace(/\r\n/g, '').match(/\r/g) || []).length, lf = (src.replace(/\r\n/g, '').match(/\n/g) || []).length;
  const eol = crlf && (cr || lf) || cr && lf ? 'mixed' : crlf ? 'crlf' : cr ? 'cr' : null;
  if (eol === 'crlf') issues.push({id: 'eol', kind: 'info', msg: 'Windows-regeleinden (CRLF) omgezet naar gewone regeleinden (LF).', detail: ''});
  else if (eol === 'cr') issues.push({id: 'eol', kind: 'info', msg: 'Oude Mac-regeleinden (CR) omgezet naar gewone regeleinden (LF).', detail: ''});
  else if (eol === 'mixed') issues.push({id: 'eol', kind: 'info', msg: 'Verschillende soorten regeleinden door elkaar; alles omgezet naar LF.', detail: ''});
  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  const recs = [];
  let stray = 0;
  for (const ln of lines) {
    if (ln.startsWith('>')) recs.push({head: ln.slice(1).trim(), seq: ''});
    else if (ln.trim()) { if (recs.length) recs[recs.length - 1].seq += ln.replace(/\s+/g, ''); else stray++; }
  }
  for (const r of recs) r.name = r.head.split(/\s+/)[0] || '';
  if (stray) issues.push({id: 'nohead', kind: 'bad', msg: 'Er staat tekst vóór de eerste kopregel (>naam); die is niet meegenomen.', detail: ''});
  if (!recs.length) {
    if (src.trim() && !stray) issues.push({id: 'none', kind: 'bad', msg: 'Geen sequenties gevonden.', detail: ''});
    return {text: '', recs, issues, eol, type: ''};
  }
  /* namen */
  const unnamed = recs.filter(r => !r.name).length;
  if (unnamed) issues.push({id: 'noname', kind: 'bad', msg: 'Een kopregel heeft geen naam.', detail: String(unnamed)});
  const seen = {}, dup = [];
  for (const r of recs) if (r.name) { seen[r.name] = (seen[r.name] || 0) + 1; if (seen[r.name] === 2) dup.push(r.name); }
  if (dup.length) issues.push({id: 'dup', kind: 'bad', msg: 'Dubbele namen; Clustal Omega weigert dit of maakt ze onderling niet te onderscheiden.', detail: dup.join(', ')});
  const longN = recs.filter(r => r.name.length > NAMEMAX).map(r => r.name);
  if (longN.length) issues.push({id: 'long', kind: 'warn', msg: 'Namen langer dan ' + NAMEMAX + ' tekens worden bij Clustal en in vervolgprogramma\'s afgekapt.', detail: longN.join(', ')});
  /* lege reeksen */
  const empty = recs.filter(r => !r.seq).map(r => r.name || '?');
  if (empty.length) issues.push({id: 'empty', kind: 'bad', msg: 'Lege sequenties (alleen een kopregel).', detail: empty.join(', ')});
  /* DNA of eiwit: per reeks, dan samen */
  const kindOf = s => { const l = s.replace(/[^A-Za-z]/g, '').toUpperCase(); if (!l) return ''; let n = 0; for (const c of l) if ('ACGTUN'.includes(c)) n++; return n / l.length >= 0.9 ? 'nt' : 'aa'; };
  const kinds = recs.map(r => kindOf(r.seq)), nNt = kinds.filter(k => k === 'nt').length, nAa = kinds.filter(k => k === 'aa').length;
  const mixed = nNt > 0 && nAa > 0;
  if (mixed) issues.push({id: 'mixed', kind: 'bad', msg: 'DNA en eiwit door elkaar; Clustal Omega aligneert één soort per keer.',
    detail: recs.filter((r, i) => kinds[i] === (nNt >= nAa ? 'aa' : 'nt')).map(r => r.name).join(', ')});
  const ty = type === 'nt' || type === 'aa' ? type : nNt >= nAa && nNt ? 'nt' : nAa ? 'aa' : '';
  /* tekens die bij het gekozen type niet mogen; bij een mengsel geldt de ruimste lijst (eiwit) */
  const ok = ty === 'nt' && !mixed ? NT_OK : AA_OK, bad = {};
  for (const r of recs) for (const c of r.seq) if (!ok.test(c)) bad[c] = (bad[c] || 0) + 1;
  const bk = Object.keys(bad);
  if (bk.length) issues.push({id: 'chars', kind: 'bad', msg: (ty === 'nt' && !mixed ? 'Tekens die niet in DNA/RNA horen (IUPAC):' : 'Tekens die niet in een eiwit horen (IUPAC):'),
    detail: bk.map(c => '"' + c + '"' + ' ×' + bad[c]).join(', ')});
  const text = recs.map(r => '>' + r.name + '\n' + (r.seq.match(/.{1,60}/g) || ['']).join('\n')).join('\n') + '\n';
  return {text, recs, issues, eol, type: ty};
}
