import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import '../../src/lib/helpers.js';
import {parseAlignment} from '../../src/lib/alignment.js';
import {alnConvert, alnUngapped, EBI_URL} from '../../src/lib/alnhand.js';

const dir = new URL('../fixtures/aln/', import.meta.url), fx = f => readFileSync(new URL(f, dir), 'utf8');
const same = (a, b, msg) => { assert.deepEqual(b.names, a.names, msg + ' namen'); assert.deepEqual(b.seqs, a.seqs, msg + ' sequenties'); assert.equal(b.len, a.len, msg + ' lengte'); };

test('Clustal → FASTA → Clustal is zonder verlies voor elk .aln-testbestand', () => {
  const files = readdirSync(dir).filter(f => f.endsWith('.aln'));
  assert.ok(files.length >= 4);
  for (const f of files) {
    const a = parseAlignment(fx(f)), fa = alnConvert(fx(f), 'fasta'), back = alnConvert(fa, 'clustal');
    assert.equal(parseAlignment(fa).format, 'fasta', f);
    assert.equal(parseAlignment(back).format, 'clustal', f);
    same(a, parseAlignment(fa), f + ' (FASTA)');
    same(a, parseAlignment(back), f + ' (terug)');
  }
});

test('ook FASTA → Clustal → FASTA en via PHYLIP blijft gelijk', () => {
  const a = parseAlignment(fx('opuntia.fasta'));
  same(a, parseAlignment(alnConvert(alnConvert(fx('opuntia.fasta'), 'clustal'), 'fasta')), 'opuntia.fasta');
  same(a, parseAlignment(alnConvert(alnConvert(fx('opuntia.fasta'), 'phylip'), 'fasta')), 'opuntia via PHYLIP');
});

test('leeg of onleesbaar geeft null', () => { assert.equal(alnConvert('', 'fasta'), null); assert.equal(alnConvert('hallo', 'clustal'), null); });

test('losse reeksen zonder gaten voor een nieuwe run', () => {
  const a = parseAlignment(fx('hedgehog.aln')), recs = alnUngapped(a).split('>').slice(1).map(r => r.split('\n'));
  assert.deepEqual(recs.map(r => r[0]), a.names);
  assert.deepEqual(recs.map(r => r.slice(1).join('')), a.seqs.map(s => s.replace(/-/g, '')));
});

test('de EBI-koppeling', () => assert.equal(EBI_URL, 'https://www.ebi.ac.uk/jdispatcher/msa/clustalo'));
