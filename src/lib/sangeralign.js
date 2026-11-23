/* Een Sanger-read tegen een referentie (S158–S161, #302 #311–#314 #317–#319).
   - alignRead: het anker zoeken met k-meer-zaadjes op beide strengen (een reverse read wordt
     reverse-complement gemaakt), dan een gebande uitlijning met affiene gaten (Gotoh 1982,
     J Mol Biol 162:705) rond die diagonaal. Beide einden mogen vrij overhangen (overlap-
     uitlijning), zodat een read die buiten het amplicon loopt of een kort amplicon allebei werken.
   - variants: de verschillen in referentiecoördinaten als HGVS g.-notatie (den Dunnen e.a. 2016,
     Hum Mutat 37:564–569): substitutie g.123A>G, deletie g.130del / g.130_132del, duplicatie
     g.130dup, insertie g.130_131insA; gaten in een herhaling naar de meest 3'-positie (3'-regel).
     Heterozygoot (IUPAC-code): g.[123A>G];[123=], of g.[123A>C];[123A>T] als geen van beide de referentie is.
   - assays: het assayformaat (amplicon, SNP's met rs, positie, allelen, streng) en het oefenpanel.
   - confirm: forward en reverse read per referentiepositie naast elkaar.
   Alle posities in de code zijn 0-gebaseerd; alleen wat de gebruiker ziet is 1-gebaseerd. */

const COMP = {A: 'T', T: 'A', C: 'G', G: 'C', R: 'Y', Y: 'R', K: 'M', M: 'K', B: 'V', V: 'B', D: 'H', H: 'D', S: 'S', W: 'W', N: 'N'};
export const rc = s => String(s).split('').reverse().map(c => COMP[c] || 'N').join('');
/* de basen achter een IUPAC-code */
export const DEC = {A: 'A', C: 'C', G: 'G', T: 'T', R: 'AG', Y: 'CT', S: 'CG', W: 'AT', K: 'GT', M: 'AC', B: 'CGT', D: 'AGT', H: 'ACT', V: 'ACG', N: 'ACGT'};

/* FASTA of kale basen → {name, seq}; alleen IUPAC-letters blijven, U wordt T */
export function parseRef(text) {
  const lines = String(text || '').split(/\r?\n/), h = lines.find(l => l.startsWith('>'));
  const seq = lines.filter(l => !/^\s*[>;]/.test(l)).join('').toUpperCase().replace(/U/g, 'T').replace(/[^ACGTRYSWKMBDHVN]/g, '');
  return {name: h ? h.slice(1).trim() : '', seq};
}

/* ---------- het anker: k-meer-zaadjes ---------- */
/* per streng de diagonaal (referentie-index min read-index) met de meeste gedeelde k-meren */
export function seedDiag(q, ref, k) {
  const idx = new Map();
  for (let j = 0; j + k <= ref.length; j++) {
    const w = ref.slice(j, j + k);
    if (/^[ACGT]+$/.test(w)) { const l = idx.get(w); if (l) l.push(j); else idx.set(w, [j]); }
  }
  const votes = new Map();
  for (let i = 0; i + k <= q.length; i++) {
    const l = idx.get(q.slice(i, i + k));
    if (l) for (const j of l) votes.set(j - i, (votes.get(j - i) || 0) + 1);
  }
  let best = null, n = 0;
  for (const [d, v] of votes) if (v > n || (v === n && best != null && Math.abs(d) < Math.abs(best))) { best = d; n = v; }
  return {diag: best, votes: n};
}

/* ---------- gebande uitlijning met affiene gaten ----------
   q = read (op de referentiestreng), r = referentie, d = diagonaal, w = halve bandbreedte.
   Score: match +2, IUPAC-code die de referentiebase bevat +1, N 0, mismatch −3, gat −(5 + 2 × lengte).
   Geeft {score, cols: [{r, q}], i0, i1}: r of q = −1 voor een gat; i0..i1 = het uitgelijnde stuk van q. */
const SC = {m: 2, part: 1, x: -3, go: -5, ge: -2};
const sub = (a, b) => a === b ? SC.m : a === 'N' || b === 'N' ? 0 : (DEC[a] || '').includes(b) || (DEC[b] || '').includes(a) ? SC.part : SC.x;
const NEG = -1e9;

export function bandAlign(q, r, d, w) {
  const n = q.length, m = r.length, B = 2 * w + 1, lo = d - w, sz = (n + 1) * B;
  const M = new Float64Array(sz).fill(NEG), X = new Float64Array(sz).fill(NEG), Y = new Float64Array(sz).fill(NEG);
  const tM = new Uint8Array(sz), tX = new Uint8Array(sz), tY = new Uint8Array(sz);
  /* cel (i, j) → index, of −1 buiten de band of de matrix */
  const at = (i, j) => { const k = j - i - lo; return i < 0 || j < 0 || j > m || k < 0 || k >= B ? -1 : i * B + k; };
  /* de beste score in (i, j) en de toestand ervan; de rand (i = 0 of j = 0) is gratis: toestand 0, score 0 */
  const best = (i, j) => {
    if (i === 0 || j === 0) return at(i, j) < 0 ? [NEG, 0] : [0, 0];
    const c = at(i, j); if (c < 0) return [NEG, 0];
    let s = M[c], t = 1;
    if (X[c] > s) { s = X[c]; t = 2; }
    if (Y[c] > s) { s = Y[c]; t = 3; }
    return [s, t];
  };
  for (let i = 1; i <= n; i++) {
    for (let j = Math.max(1, i + lo); j <= Math.min(m, i + lo + B - 1); j++) {
      const c = at(i, j);
      const [sd, td] = best(i - 1, j - 1);
      if (sd > NEG / 2) { M[c] = sd + sub(q[i - 1], r[j - 1]); tM[c] = td; }
      /* X: gat in de read (verbruikt een referentiebase), uit (i, j − 1) */
      const cl = at(i, j - 1);
      if (j - 1 === 0) { if (cl >= 0) { X[c] = SC.go + SC.ge; tX[c] = 0; } }
      else if (cl >= 0) {
        const o = Math.max(M[cl], Y[cl]) + SC.go + SC.ge, e = X[cl] + SC.ge;
        if (e >= o) { X[c] = e; tX[c] = 2; } else { X[c] = o; tX[c] = M[cl] >= Y[cl] ? 1 : 3; }
      }
      /* Y: gat in de referentie (een extra base in de read), uit (i − 1, j) */
      const cu = at(i - 1, j);
      if (i - 1 === 0) { if (cu >= 0) { Y[c] = SC.go + SC.ge; tY[c] = 0; } }
      else if (cu >= 0) {
        const o = Math.max(M[cu], X[cu]) + SC.go + SC.ge, e = Y[cu] + SC.ge;
        if (e >= o) { Y[c] = e; tY[c] = 3; } else { Y[c] = o; tY[c] = M[cu] >= X[cu] ? 1 : 2; }
      }
    }
  }
  /* einde: de laatste rij (de read is op) of de laatste kolom (de referentie is op) */
  let bs = NEG, bi = 0, bj = 0, bt = 0;
  const tryEnd = (i, j) => { const [s, t] = best(i, j); if (s > bs) { bs = s; bi = i; bj = j; bt = t; } };
  for (let j = Math.max(1, n + lo); j <= Math.min(m, n + lo + B - 1); j++) tryEnd(n, j);
  for (let i = 1; i <= n; i++) if (at(i, m) >= 0) tryEnd(i, m);
  const cols = [];
  let i = bi, j = bj, t = bt;
  const i1 = bi - 1;
  while (t && i > 0 && j > 0) {
    const c = at(i, j);
    if (t === 1) { cols.push({r: j - 1, q: i - 1}); t = tM[c]; i--; j--; }
    else if (t === 2) { cols.push({r: j - 1, q: -1}); t = tX[c]; j--; }
    else { cols.push({r: -1, q: i - 1}); t = tY[c]; i--; }
  }
  cols.reverse();
  /* een gat aan het begin of einde zegt niets (vrije overhang): weg ermee */
  while (cols.length && (cols[0].q < 0 || cols[0].r < 0)) cols.shift();
  while (cols.length && (cols[cols.length - 1].q < 0 || cols[cols.length - 1].r < 0)) cols.pop();
  return {score: bs, cols, i0: cols.length ? cols[0].q : 0, i1: cols.length ? cols[cols.length - 1].q : i1};
}

/* ---------- de read uitlijnen ----------
   read = de calls (met IUPAC-codes), ref = referentie; opt.from/opt.to = het stuk van de read dat meedoet
   (bv. het trimvoorstel, 0-gebaseerd, to exclusief). Geeft null als geen streng genoeg zaadjes heeft, anders
   {strand '+'|'-', offset (referentie-index waar de eerste base van de read op de referentiestreng valt, uit de uitlijning),
    diag (de diagonaal van de zaadjes), votes, score,
    cols: [{r, q, b}] met q = index in de oorspronkelijke read (−1 bij een gat) en b = de readbase op de referentiestreng,
    rFrom, rTo (0-gebaseerd, inclusief), match, mism, ins, del, ident (0–1)} */
export function alignRead(read, ref, opt = {}) {
  read = String(read || '').toUpperCase(); ref = String(ref || '').toUpperCase();
  const a = Math.max(0, opt.from || 0), z = Math.min(read.length, opt.to == null ? read.length : opt.to);
  const part = read.slice(a, z), len = part.length;
  const k = opt.k || (Math.min(len, ref.length) < 60 ? 8 : 11);
  if (len < k || ref.length < k) return null;
  const strands = [{s: '+', q: part}, {s: '-', q: rc(part)}].map(x => Object.assign(x, seedDiag(x.q, ref, k)));
  const st = strands[0].votes >= strands[1].votes ? strands[0] : strands[1];
  if (st.diag == null || st.votes < 2) return null;
  const w = opt.band || Math.max(16, Math.min(60, Math.round(len * 0.03)));
  const al = bandAlign(st.q, ref, st.diag, w);
  /* index in st.q → index in de oorspronkelijke read */
  const orig = i => st.s === '+' ? a + i : a + len - 1 - i;
  let match = 0, mism = 0, ins = 0, del = 0;
  const cols = al.cols.map(c => {
    if (c.q < 0) del++; else if (c.r < 0) ins++; else if (st.q[c.q] === ref[c.r]) match++; else mism++;
    return {r: c.r, q: c.q < 0 ? -1 : orig(c.q), b: c.q < 0 ? '-' : st.q[c.q]};
  });
  const rs = cols.filter(c => c.r >= 0);
  return {strand: st.s, offset: al.cols.length ? al.cols[0].r - al.cols[0].q : st.diag, diag: st.diag, votes: st.votes, score: al.score, cols,
    rFrom: rs.length ? rs[0].r : 0, rTo: rs.length ? rs[rs.length - 1].r : -1,
    match, mism, ins, del, ident: cols.length ? match / cols.length : 0};
}

/* ---------- HGVS g.-notatie ---------- */
/* een substitutie of heterozygote call; p = 0-gebaseerd, g = start (coördinaat van base 1) */
function subHgvs(P, rb, qb) {
  const al = DEC[qb];
  if (qb.length !== 1 || !al) return null;
  if (al.length === 1) return {zyg: 'hom', alt: qb, hgvs: 'g.' + P + rb + '>' + qb};
  if (al.length !== 2) return null;   // B, D, H, V, N: geen genotype
  if (al.includes(rb)) { const x = al.replace(rb, ''); return {zyg: 'het', alt: x, hgvs: 'g.[' + P + rb + '>' + x + '];[' + P + '=]'}; }
  return {zyg: 'het', alt: al[0] + '/' + al[1], hgvs: 'g.[' + P + rb + '>' + al[0] + '];[' + P + rb + '>' + al[1] + ']'};
}

/* de variantenlijst; aln uit alignRead, assay = {start, snps} (mag ontbreken: start 1, geen SNP's).
   Elke variant: {type 'sub'|'del'|'dup'|'ins', zyg, p, p2 (0-gebaseerd, na de 3'-regel), ref, alt, hgvs, q (readindex), rs} */
export function variants(aln, ref, assay) {
  const out = [], g0 = assay && Number.isFinite(+assay.start) ? +assay.start : 1, cols = aln ? aln.cols : [];
  ref = String(ref).toUpperCase();
  const G = p => g0 + p, rsAt = p => { const s = assay && (assay.snps || []).find(x => +x.pos - 1 === p); return s ? s.rs : ''; };
  for (let c = 0; c < cols.length; c++) {
    const x = cols[c];
    if (x.r >= 0 && x.q >= 0) {
      if (x.b === ref[x.r] || x.b === 'N') continue;
      const v = subHgvs(G(x.r), ref[x.r], x.b);
      if (v) out.push(Object.assign({type: 'sub', p: x.r, p2: x.r, ref: ref[x.r], q: x.q, rs: rsAt(x.r)}, v));
    } else if (x.q < 0) {   // deletie: een run referentiebasen zonder read
      let e = c; while (e + 1 < cols.length && cols[e + 1].q < 0) e++;
      let p1 = x.r, p2 = cols[e].r;
      while (p2 + 1 < ref.length && ref[p2 + 1] === ref[p1]) { p1++; p2++; }
      const q = (cols.slice(0, c).reverse().find(y => y.q >= 0) || {q: -1}).q;
      out.push({type: 'del', zyg: 'hom', p: p1, p2, ref: ref.slice(p1, p2 + 1), alt: '', q, rs: rsAt(p1),
        hgvs: 'g.' + G(p1) + (p2 > p1 ? '_' + G(p2) : '') + 'del'});
      c = e;
    } else {   // insertie: een run readbasen tussen referentie p en p + 1
      let e = c; while (e + 1 < cols.length && cols[e + 1].r < 0) e++;
      let s = cols.slice(c, e + 1).map(y => y.b).join(''), p = c > 0 ? cols[c - 1].r : -1;
      while (p + 1 < ref.length && ref[p + 1] === s[0]) { s = s.slice(1) + ref[p + 1]; p++; }
      const L = s.length, dup = p - L + 1 >= 0 && ref.slice(p - L + 1, p + 1) === s;
      out.push(dup
        ? {type: 'dup', zyg: 'hom', p: p - L + 1, p2: p, ref: '', alt: s, q: x.q, rs: rsAt(p), hgvs: 'g.' + G(p - L + 1) + (L > 1 ? '_' + G(p) : '') + 'dup'}
        : {type: 'ins', zyg: 'hom', p, p2: p + 1, ref: '', alt: s, q: x.q, rs: rsAt(p), hgvs: 'g.' + G(p) + '_' + G(p + 1) + 'ins' + s});
      c = e;
    }
  }
  return out;
}

/* ---------- assays (S160) ----------
   {format: 'labkit-assay', version: 1, name, build, chrom, start, ref, snps: [{rs, pos, alleles: 'A/G', strand: '+'|'-'}]}
   start = coördinaat van base 1 van het amplicon (voor de g.-notatie); pos is 1-gebaseerd in het amplicon.
   strand '+': de allelen staan zoals op de referentiestreng van het amplicon; '-': op de andere streng
   (dan wordt wat de read ziet gecomplementeerd voordat het genotype wordt gemeld). */
export const ASSAY_FMT = 'labkit-assay';

/* JSON-tekst of object → {assay, err: [[zin, rs?], …]}; err leeg = goed (de zin is een vertaalsleutel, het rs-nummer staat er los naast) */
export function parseAssay(src) {
  let o;
  try { o = typeof src === 'string' ? JSON.parse(src) : src; } catch (e) { return {assay: null, err: [['Geen geldige JSON.']]}; }
  if (!o || typeof o !== 'object' || Array.isArray(o)) return {assay: null, err: [['Geen assay-object.']]};
  const err = [], ref = parseRef(o.ref || '').seq;
  if (!String(o.name || '').trim()) err.push(['De assay heeft geen naam.']);
  if (!ref) err.push(['De assay heeft geen referentiesequentie.']);
  const start = o.start == null || o.start === '' ? 1 : Number(o.start);
  if (!Number.isInteger(start)) err.push(['De startcoördinaat is geen geheel getal.']);
  const snps = (Array.isArray(o.snps) ? o.snps : []).map(s => ({rs: String(s.rs || '').trim(), pos: Number(s.pos),
    alleles: String(s.alleles || '').toUpperCase().replace(/\s/g, ''), strand: s.strand === '-' ? '-' : '+'}));
  snps.forEach(s => {
    if (!Number.isInteger(s.pos) || s.pos < 1 || s.pos > ref.length) err.push(['Positie buiten het amplicon.', s.rs || '?']);
    else if (!/^[ACGT]\/[ACGT]$/.test(s.alleles)) err.push(['Schrijf de allelen als A/G.', s.rs || '?']);
    else {
      const al = s.strand === '-' ? s.alleles.split('/').map(c => COMP[c]) : s.alleles.split('/');
      if (!al.includes(ref[s.pos - 1])) err.push(['Geen van beide allelen staat in de referentie; klopt de streng?', s.rs || '?']);
    }
  });
  return {assay: {format: ASSAY_FMT, version: 1, name: String(o.name || '').trim(), build: String(o.build || ''), chrom: String(o.chrom || ''),
    start, ref, snps, note: String(o.note || '')}, err};
}
export const assayJson = a => JSON.stringify(a, null, 2);

/* Oefenpanel: een VERZONNEN amplicon van 240 basen met drie verzonnen SNP's, om de werkwijze te oefenen.
   Geen echte rs-nummers en geen echte sequentie; OEF-2 staat op de andere streng, zodat je de omkering ziet. */
export const TEACH = {format: ASSAY_FMT, version: 1, name: 'Oefenpanel (verzonnen sequentie)', build: '', chrom: '', start: 1,
  note: 'Verzonnen sequentie en verzonnen SNP-namen, alleen om te oefenen.',
  ref: 'CATAGGCGGACCTCCGTAGCGACCTAGCTATGCAGGTGTATTTAAGGCGCATCGTCCTCTAGAGACTATTTTCGTAAGAGCCCAGCCCCTCCCGTGACACCTAACCGTCCCTGGCCATCTTCACACAGACCAGTGTTCCTAGGAGAGTATCATGCCTGATTTCGGACCTCCAGCCTTTTGGAGGAACCCTACTTTGAACTGTCGCTACAAGCAACCGCTGATACTACTTCAATAGCGTTG',
  snps: [{rs: 'OEF-1', pos: 60, alleles: 'C/T', strand: '+'}, {rs: 'OEF-2', pos: 120, alleles: 'A/G', strand: '-'}, {rs: 'OEF-3', pos: 180, alleles: 'G/A', strand: '+'}]};

/* twee verzonnen reads bij het oefenpanel: read 1 forward (basen 16–225), read 2 reverse (basen 31–238).
   Beide heterozygoot C/T op OEF-1 en homozygoot A op OEF-3; read 2 ziet op OEF-2 een C waar read 1 een T ziet. */
export function teachReads() {
  const r = TEACH.ref.split('');
  const put = (a, p, b) => { a[p - 1] = b; return a; };
  const f = put(put(r.slice(), 60, 'Y'), 180, 'A').slice(15, 225).join('');
  const v = put(put(put(r.slice(), 60, 'Y'), 180, 'A'), 120, 'C').slice(30, 238).join('');
  return {f: '>oefen_F\n' + f, r: '>oefen_R\n' + rc(v)};
}

/* het genotype op elke SNP van de assay: {rs, pos, alleles, strand, cov (gedekt), call (readbase op de
   referentiestreng), gt ('C/T' op de streng van de assay), ok (allelen horen bij de assay), q (readindex)} */
export function snpCalls(aln, assay) {
  const byR = new Map();
  if (aln) for (const c of aln.cols) if (c.r >= 0) byR.set(c.r, c);
  return ((assay && assay.snps) || []).map(s => {
    const c = byR.get(s.pos - 1), o = Object.assign({}, s, {cov: !!c, call: '', gt: '', ok: true, q: -1});
    if (!c) return o;
    o.call = c.b; o.q = c.q;
    if (c.b === '-') { o.gt = 'del'; o.ok = false; return o; }
    const al = DEC[c.b] || '';
    if (al.length < 1 || al.length > 2) { o.gt = c.b; o.ok = false; return o; }
    const on = (al.length === 1 ? [al, al] : al.split('')).map(b => s.strand === '-' ? COMP[b] : b);
    const ord = s.alleles.split('/');
    on.sort((a, b) => (ord.indexOf(a) < 0 ? 9 : ord.indexOf(a)) - (ord.indexOf(b) < 0 ? 9 : ord.indexOf(b)));
    o.gt = on.join('/'); o.ok = on.every(b => ord.includes(b));
    return o;
  });
}

/* ---------- forward/reverse (S161) ----------
   per referentiepositie wat elke read zegt: {r, a, b, st}; a/b = base (of '-' voor een deletie, met een
   insertie erachter als '+ACG'), '' als die read de positie niet dekt; st = 'same' | 'diff' | 'one1' | 'one2'.
   counts telt per st. */
export function confirm(a1, a2, refLen) {
  const per = aln => {
    const m = new Map();
    if (!aln) return m;
    let last = -1;
    for (const c of aln.cols) {
      if (c.r >= 0) { m.set(c.r, {b: c.b, q: c.q}); last = c.r; }
      else if (last >= 0) { const x = m.get(last); x.b += (x.b.includes('+') ? '' : '+') + c.b; }
    }
    return m;
  };
  const m1 = per(a1), m2 = per(a2), rows = [], counts = {same: 0, diff: 0, one1: 0, one2: 0};
  for (let r = 0; r < refLen; r++) {
    const x = m1.get(r), y = m2.get(r);
    if (!x && !y) continue;
    const st = x && y ? (x.b === y.b ? 'same' : 'diff') : x ? 'one1' : 'one2';
    counts[st]++;
    rows.push({r, a: x ? x.b : '', b: y ? y.b : '', qa: x ? x.q : -1, qb: y ? y.q : -1, st});
  }
  return {rows, counts};
}
