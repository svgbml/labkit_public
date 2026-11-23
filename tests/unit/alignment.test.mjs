import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../../src/lib/helpers.js';
import {parseAlignment, alnTrim, alnWrite, alnPim, alnPair, pimParse, pimWrite, alnProfile, alnConserved, alnTranslate, ALN_OUT} from '../../src/lib/alignment.js';

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
