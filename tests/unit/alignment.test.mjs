import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../../src/lib/helpers.js';
import {parseAlignment, alnTrim, alnWrite, alnPim, alnPair, pimParse, pimWrite, alnProfile, alnConserved, alnTranslate, fastaCheck, gcgCheck, alnSvg, ALN_OUT} from '../../src/lib/alignment.js';

const fx = f => readFileSync(new URL('../fixtures/aln/' + f, import.meta.url), 'utf8');

test('bijsnijden: gatenpercentage en bereik', () => {
  const a = parseAlignment('>a\nAC-GT\n>b\nACAG-\n>c\nAC-GT\n>d\nA--GT\n');
  assert.equal(alnTrim(a, {}).len, 5);
  assert.deepEqual(alnTrim(a, {maxGap: 50}).seqs, ['ACGT', 'ACG-', 'ACGT', 'A-GT']);
  assert.deepEqual(alnTrim(a, {maxGap: 0}).seqs, ['AG', 'AG', 'AG', 'AG']);
  assert.deepEqual(alnTrim(a, {from: 2, to: 4}).seqs, ['C-G', 'CAG', 'C-G', '--G']);
  assert.deepEqual(alnTrim(a, {from: 4, to: 99}).seqs, ['GT', 'G-', 'GT', 'GT']);
});

test('bijgesneden uitlijning: schrijven en weer inlezen geeft hetzelfde', () => {
  for (const f of ['hedgehog.aln', 'opuntia.aln', 'small_pim.aln']) {
    const t = alnTrim(parseAlignment(fx(f)), {maxGap: 40, from: 3, to: 60});
    assert.ok(t.len > 0 && t.len <= 58);
    for (const fmt of Object.keys(ALN_OUT)) {
      const b = parseAlignment(alnWrite(t, fmt));
      assert.equal(b.format, fmt, f + ' ' + fmt);
      assert.deepEqual(b.seqs, t.seqs, f + ' ' + fmt);
      assert.deepEqual(b.names, t.names.map(n => n.replace(/\s+/g, '_')), f + ' ' + fmt);
      assert.equal(b.len, t.len);
    }
  }
});

test('identiteitsmatrix komt overeen met de .pim van het testbestand', () => {
  const a = parseAlignment(fx('small_pim.aln')), ref = pimParse(fx('small_pim.pim')), m = alnPim(a, 'ign');
  assert.deepEqual(a.names, ref.names);
  ref.m.forEach((row, i) => row.forEach((v, j) => assert.ok(Math.abs(m[i][j] * 100 - v) < 0.005, `${i},${j}: ${m[i][j] * 100} tegen ${v}`)));
  /* wat LabKit schrijft, leest hij ook terug */
  const back = pimParse(pimWrite(a.names, m));
  assert.deepEqual(back.names, a.names);
  back.m.forEach((row, i) => row.forEach((v, j) => assert.ok(Math.abs(v - ref.m[i][j]) < 0.005)));
});

test('identiteit van een paar: gatenopties', () => {
  /* kolommen: A=A, C=C, G/T, - tegen A, - tegen -, T=T */
  const x = 'ACG-' + '-T', y = 'ACTA' + '-T';
  const r = m => alnPair(x, y, m);
  assert.equal(r('ign').n, 4); assert.equal(r('ign').same, 3);   /* 3 van 4 */
  assert.equal(r('mis').n, 5); assert.equal(r('mis').id, 3 / 5); /* gat tegen letter telt mee, gat tegen gat niet */
  assert.equal(r('len').n, 6); assert.equal(r('len').id, 3 / 6);
  assert.equal(r('mis').gaps, 1);
  /* gelijkenis: I en V staan in dezelfde sterke groep */
  assert.equal(alnPair('MIK', 'MVK', 'ign').sim, 3);
  assert.equal(alnPair('MIK', 'MVK', 'ign').same, 2);
});

test('geconserveerde stukken: drempel en minimale lengte', () => {
  const a = parseAlignment('>a\nACGTTTAC\n>b\nACGTATAC\n>c\nACGTTTCC\n>d\nTCGATTAC\n');
  const p = alnProfile(a);
  /* aandeel top per kolom: A .75, C 1, G 1, T .75, T .75, T 1, A .75, C 1 */
  assert.deepEqual(alnConserved(a, p, 100, 1).map(r => [r.from, r.to]), [[2, 3], [6, 6], [8, 8]]);
  assert.deepEqual(alnConserved(a, p, 75, 3).map(r => [r.from, r.to, r.seq]), [[1, 8, 'ACGTTTAC']]);
  assert.deepEqual(alnConserved(a, p, 100, 2), [{from: 2, to: 3, len: 2, seq: 'CG'}]);
  assert.deepEqual(alnConserved(a, p, 100, 4), []);
});

test('vertalen: leesraam, gaten van drie, deels gat wordt X', () => {
  const a = parseAlignment('>een\nATGGCCAAATAG\n>twee\nATG---AAATAG\n>drie\nATGG-CAAATAG\n>vier\naugGCCAAAuag\n');
  const t = f => alnTranslate(a, f, 1);
  assert.deepEqual(t(1).seqs, ['MAK*', 'M-K*', 'MXK*', 'MAK*']);
  assert.equal(t(1).len, 4);
  /* leesraam 2: TGG CCA AAT (AG valt af) = W P N */
  assert.equal(t(2).seqs[0], 'WPN');
  assert.equal(t(3).seqs[0], 'GQI');  /* GGC CAA ATA = G Q I */
});

test('FASTA klaarmaken: elke controle slaat aan op een kapotte invoer', () => {
  const kinds = t => fastaCheck(t).issues.map(i => i.k).sort();
  assert.deepEqual(kinds('>a\nACGT\n>b\nACGA\n'), []);
  assert.deepEqual(kinds('>a\r\nACGT\r\n>b\r\nACGA\r\n'), ['eol']);
  assert.deepEqual(kinds('>a\rACGT\r>b\rACGA\r'), ['eol']);
  assert.deepEqual(kinds('>a x\nACGT\n>a y\nACGA\n'), ['dup']);  /* EBI neemt het eerste woord als naam */
  assert.deepEqual(kinds('>a\nAC!GT\n>b\nAC-GA\n'), ['bad']);
  assert.deepEqual(kinds('>a\nACGTACGTAC\n>b\nMKWVTFISLL\n'), ['mixed']);
  assert.deepEqual(kinds('>' + 'x'.repeat(31) + '\nACGT\n>b\nACGA\n'), ['long']);
  assert.deepEqual(kinds('>a\n\n>b\nACGA\n'), ['empty']);
  assert.deepEqual(kinds('ACGT\n>b\nACGA\n'), ['noname']);
  /* alles tegelijk */
  assert.deepEqual(kinds('ACGT\r\n>a\r\nAC!GT\r\n>a\r\n\r\n>' + 'x'.repeat(40) + '\r\nMKWVTFISLLEEQ\r\n'), ['bad', 'dup', 'empty', 'eol', 'long', 'mixed', 'noname']);
});

test('FASTA klaarmaken: de schone FASTA', () => {
  const r = fastaCheck('>a één\r\nac gt 12\r\nAC!G\r\n>a\r\n\r\n>a twee\r\nTTTT\r\n');
  /* spaties en cijfers weg, vreemde tekens weg, lege sequentie weg, dubbele naam uniek, LF */
  assert.equal(r.clean, '>a één\nACGTACG\n>a_2 twee\nTTTT\n');
  assert.deepEqual(r.issues.find(i => i.k === 'bad').v, ['!']);
  assert.deepEqual(r.issues.find(i => i.k === 'dup').v, ['a']);
  assert.equal(r.n, 2);
  assert.equal(fastaCheck('>x\n' + 'A'.repeat(130) + '\n').clean.split('\n')[1].length, 60);
  assert.equal(fastaCheck('>a\nACGT\n>b\nACGA\n').type, 'nt');
});

test('omzetten: Clustal → FASTA → Clustal is verliesvrij, ook de * : . -regel', () => {
  for (const f of ['hedgehog.aln', 'opuntia.aln', 'clustalw.aln', 'small_pim.aln']) {
    const a = parseAlignment(fx(f)), b = parseAlignment(alnWrite(parseAlignment(alnWrite(a, 'fasta')), 'clustal'));
    assert.equal(b.format, 'clustal');
    assert.deepEqual([b.names, b.seqs, b.len], [a.names, a.seqs, a.len], f);
    if (f !== 'small_pim.aln') assert.equal(b.cons, a.cons, f);  /* Clustal's eigen regel komt terug */
  }
});

test('omzetten: elk formaat naar elk formaat', () => {
  const fmts = Object.keys(ALN_OUT);
  assert.deepEqual(fmts.sort(), ['clustal', 'fasta', 'msf', 'nexus', 'phylip', 'pir']);
  /* one.phy niet: twee rijen heten B_subtilis, en Clustal, MSF en NEXUS kennen een rij aan zijn naam */
  for (const f of ['opuntia.aln', 'W_prot.msf', 'clustalw.pir', 'test_Nexus_input.nex', 'opuntia.fasta']) {
    const a = parseAlignment(fx(f));
    for (const x of fmts) for (const y of fmts) {
      const b = parseAlignment(alnWrite(parseAlignment(alnWrite(a, x)), y));
      assert.equal(b.format, y);
      assert.deepEqual(b.seqs, a.seqs, f + ' ' + x + ' ' + y);
      assert.deepEqual(b.names, a.names.map(n => n.replace(/\s+/g, '_')), f + ' ' + x + ' ' + y);
      assert.deepEqual(b.warn, [], f + ' ' + x + ' ' + y);
    }
  }
});

test('MSF: GCG-controlegetal zoals in W_prot.msf', () => {
  const a = parseAlignment(fx('W_prot.msf'));
  assert.equal(gcgCheck(a.seqs[0]), 7236);
  assert.equal(gcgCheck(a.seqs[10]), 7331);
  assert.match(alnWrite(a, 'msf'), /Name: W\*01:01:01:01 +Len: +99 +Check: +7236/);
  /* NEXUS: een naam met een _ of een spatie blijft hetzelfde (tussen aanhalingstekens) */
  const n = parseAlignment(alnWrite({names: ["a_b", "c'd"], seqs: ['AC', 'AG'], len: 2}, 'nexus'));
  assert.deepEqual(n.names, ['a_b', "c'd"]);
});

test('figuur: blokken van de gekozen breedte, kleuren en nummers', () => {
  const a = parseAlignment('>a<1>\nACGTACGTAC\n>b\nACG-ACGTAA\n');
  const f = alnSvg(a, {width: 4, start: 11, fill: (i, c) => (a.seqs[i][c] === 'A' ? '#ff0000' : '')});
  assert.equal(f.blocks.length, 3);  /* 4 + 4 + 2 kolommen */
  assert.match(f.blocks[0], /^<svg [^>]*width="\d+"/);
  assert.ok(f.blocks[0].includes('a&lt;1&gt;'), 'naam ontsnapt');
  assert.ok(f.blocks[0].includes('>ACGT</text>') && f.blocks[1].includes('>ACGT</text>') && f.blocks[2].includes('>AC</text>'));
  /* nummer van de eerste kolom van elk blok, vanaf start */
  assert.ok(f.blocks[0].includes('>11</text>') && f.blocks[1].includes('>15</text>') && f.blocks[2].includes('>19</text>'));
  /* één rechthoek per A: rij a heeft A op 0, 4, 8; rij b op 0, 4, 9 */
  assert.equal((f.svg.match(/fill="#ff0000"/g) || []).length, 6);
  /* de * : . -regel onder elk blok: kolom 1 t/m 3 gelijk, 4 heeft een gat */
  assert.ok(f.blocks[0].includes('>*** </text>'));
  /* alles in één svg, even breed als het breedste blok */
  assert.equal((f.svg.match(/<svg/g) || []).length, 1);
  assert.equal(alnSvg(a, {width: 60}).blocks.length, 1);
});
