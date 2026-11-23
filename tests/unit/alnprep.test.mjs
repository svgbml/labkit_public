import test from 'node:test';
import assert from 'node:assert/strict';
import {fastaCheck, NAMEMAX} from '../../src/lib/alnprep.js';

const ids = r => r.issues.map(i => i.id).sort();

test('goede invoer geeft geen meldingen en schone FASTA', () => {
  const r = fastaCheck('>a desc\nACGTACGT\n>b\nACGTTCGT\n');
  assert.deepEqual(r.issues, []);
  assert.equal(r.text, '>a\nACGTACGT\n>b\nACGTTCGT\n');
  assert.equal(r.type, 'nt');
});

test('elke controle slaat aan op één kapotte invoer', () => {
  assert.deepEqual(ids(fastaCheck('>a\nACGT\n>a\nACGA\n')), ['dup']);
  assert.deepEqual(ids(fastaCheck('>a\nACGT1\n>b\nACGA\n')), ['chars']);
  assert.deepEqual(ids(fastaCheck('>a\nACGTACGT\n>b\nMKVLAAGIVGLLLAQ\n')), ['mixed']);
  assert.deepEqual(ids(fastaCheck('>' + 'x'.repeat(NAMEMAX + 1) + '\nACGT\n>b\nACGA\n')), ['long']);
  assert.deepEqual(ids(fastaCheck('>a\n>b\nACGA\n')), ['empty']);
  assert.deepEqual(ids(fastaCheck('>a\r\nACGT\r\n>b\r\nACGA\r\n')), ['eol']);
  assert.deepEqual(ids(fastaCheck('>a\rACGT\r>b\rACGA\r')), ['eol']);
});

test('regeleinden worden omgezet, de inhoud blijft gelijk', () => {
  const lf = fastaCheck('>a\nACGT\n>b\nACGA\n').text;
  assert.equal(fastaCheck('>a\r\nACGT\r\n>b\r\nACGA\r\n').text, lf);
  assert.equal(fastaCheck('>a\rACGT\r>b\rACGA\r').text, lf);
  assert.match(fastaCheck('>a\r\nAC\r\n').issues[0].msg, /Windows/);
  assert.match(fastaCheck('>a\rAC\r').issues[0].msg, /Mac/);
});

test('namenlimiet: precies NAMEMAX mag, daarboven niet', () => {
  assert.deepEqual(ids(fastaCheck('>' + 'x'.repeat(NAMEMAX) + '\nACGT\n>b\nACGA\n')), []);
});

test('tekens per type: gat en cijfers in DNA, J en O in eiwit', () => {
  const r = fastaCheck('>a\nAC-GT\n>b\nACGA\n');
  assert.deepEqual(ids(r), ['chars']);
  assert.match(r.issues[0].detail, /-/);
  assert.deepEqual(ids(fastaCheck('>p\nMKVLA*\n>q\nMKVLA\n')), ['chars']);   /* stopteken */
  assert.deepEqual(ids(fastaCheck('>p\nMKVLAJOUBZX\n>q\nMKVLA\n')), []);
  /* een eiwit met type DNA gekozen: de letters die geen basen zijn vallen op */
  assert.deepEqual(ids(fastaCheck('>p\nMKVLAAGIV\n', 'nt')), ['chars']);
  assert.deepEqual(ids(fastaCheck('>p\nACGTRYN\n', 'nt')), []);
});

test('de naam is het eerste woord; dubbel telt op dat woord', () => {
  assert.deepEqual(ids(fastaCheck('>a one\nACGT\n>a two\nACGT\n')), ['dup']);
  assert.deepEqual(ids(fastaCheck('ACGT\n')), ['nohead']);
  assert.deepEqual(ids(fastaCheck('>\nACGT\n>b\nACGT\n')), ['noname']);
  assert.deepEqual(fastaCheck('   ').issues, []);
});

test('witruimte in een reeks verdwijnt, regels worden op 60 gebroken', () => {
  const r = fastaCheck('>a\nACGT ACGT\n\nACGT\n>b\n' + 'A'.repeat(130) + '\n');
  assert.equal(r.recs[0].seq, 'ACGTACGTACGT');
  assert.deepEqual(r.text.split('\n').filter(l => l && l[0] !== '>').map(l => l.length), [12, 60, 60, 10]);
});
