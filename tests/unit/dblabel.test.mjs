import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseSnp} from '../../src/lib/dbsnp.js';
import {rc, parseAssay, alignRead, snpCalls} from '../../src/lib/sangeralign.js';
import {orientByAlleles, orientByFlank, flankRegion, dbLabel, dbAssay} from '../../src/lib/dblabel.js';

/* opgenomen antwoorden van NCBI (tests/fixtures/ncbi): rs1805007 (MC1R, ref C, alt A/G/T op de plusstreng
   van NC_000016.10, positie 89919709) en de 201 basen eromheen, met de C op positie 101 */
const fx = f => readFileSync(new URL('../fixtures/ncbi/' + f, import.meta.url), 'utf8');
const rec = parseSnp(JSON.parse(fx('esummary_snp_1805007.json')), '1805007');
const region = fx('efetch_NC_000016.10_89919609-89919809.fasta').split('\n').filter(l => !l.startsWith('>')).join('').replace(/\s/g, '');
/* een verzonnen C/T-SNP met dezelfde plek, om de allelregel te zien */
const ct = Object.assign({}, rec, {alts: ['T']});

test('streng uit de allelen: de base van het amplicon of zijn complement', () => {
  assert.equal(orientByAlleles(ct, 'C'), '+');
  assert.equal(orientByAlleles(ct, 'T'), '+');
  assert.equal(orientByAlleles(ct, 'G'), '-');
  assert.equal(orientByAlleles(ct, 'A'), '-');
  /* rs1805007 heeft alle vier de basen als allel: dan zegt de base niets */
  assert.equal(orientByAlleles(rec, 'C'), null);
  assert.equal(orientByAlleles(Object.assign({}, rec, {alts: ['G']}), 'G'), null);
});

test('de flank vraagt 20 basen links en rechts op de plusstreng', () => {
  assert.deepEqual(flankRegion(rec), {acc: 'NC_000016.10', from: 89919689, to: 89919729});
});

test('streng uit de flank: amplicon op de plusstreng of omgekeerd', () => {
  const flank = region.slice(80, 121);   /* 89919689–89919729 */
  assert.equal(orientByFlank(flank, region, 101), '+');
  assert.equal(orientByFlank(flank, rc(region), 101), '-');
  assert.equal(orientByFlank(flank, 'A'.repeat(201), 101), null);
});

test('een SNP op de minstreng van het amplicon wordt in dbSNP-richting gemeld, zonder omdraaien met de hand', () => {
  /* het amplicon is de minstreng; de gebruiker schreef de allelen zoals hij ze in zijn read ziet (G/A, streng +) */
  const amp = rc(region);
  const {assay} = parseAssay({name: 'MC1R-rev', ref: amp, snps: [{rs: 'rs1805007', pos: 101, alleles: 'G/A', strand: '+'}]});
  const L = dbLabel(rec, orientByFlank(region.slice(80, 121), amp, 101), amp[100], {alleles: 'G/A', strand: '+'});
  assert.deepEqual(L, {strand: '-', ref: 'C', alleles: 'C/T', multi: true});
  /* een read heterozygoot G/A op het amplicon (R) */
  const read = amp.slice(20, 180).split(''); read[80] = 'R';
  const aln = alignRead(read.join(''), amp);
  assert.equal(snpCalls(aln, assay)[0].gt, 'G/A');
  assert.equal(snpCalls(aln, dbAssay(assay, {rs1805007: L}))[0].gt, 'C/T');
});

test('een gewone plus-SNP blijft zoals hij is; het alt-allel volgt de assay', () => {
  assert.deepEqual(dbLabel(rec, '+', 'C', {alleles: 'C/T', strand: '+'}), {strand: '+', ref: 'C', alleles: 'C/T', multi: true});
  assert.deepEqual(dbLabel(ct, '+', 'C'), {strand: '+', ref: 'C', alleles: 'C/T', multi: false});
});

/* S200: een panel uit een lijst rs-nummers */
import {rsList, locateSnp} from '../../src/lib/dblabel.js';
import {verifySnp, SNPS} from '../../src/lib/hiris.js';

test('een lijst rs-nummers: regels, komma\'s en spaties; dubbele en ongeldige apart', () => {
  assert.deepEqual(rsList('rs1805007, rs12913832\nRS1805007 x12  885479'), {ids: ['rs1805007', 'rs12913832', 'rs885479'], bad: ['x12']});
});

test('de plek van de SNP in het amplicon uit de flank, op beide strengen', () => {
  const flank = region.slice(80, 121);
  assert.deepEqual(locateSnp(flank, region), {pos: 101, strand: '+'});
  assert.deepEqual(locateSnp(flank, rc(region)), {pos: 101, strand: '-'});
  assert.deepEqual(locateSnp(flank, 'xx' + region.slice(60, 140)), {pos: 43, strand: '+'});
  assert.equal(locateSnp(flank, 'ACGT'.repeat(50)), null);
});

test('HIrisPlex-S controleren: het getelde allel tegen de allelen van dbSNP', () => {
  const s = SNPS.find(x => x.rs === 'rs1805007');   /* telt T; dbSNP C>A,G,T */
  assert.deepEqual(verifySnp(s, rec), {rs: 'rs1805007', allele: 'T', found: true, chr: '16', acc: 'NC_000016.10', pos: 89919709, ref: 'C', alts: ['A', 'G', 'T'], genes: ['MC1R'], status: 'ok'});
  assert.equal(verifySnp(Object.assign({}, s, {allele: 'X'}), rec).status, 'mismatch');
  assert.equal(verifySnp(s, Object.assign({}, rec, {ref: 'G', alts: ['A']})).status, 'complement');
  assert.equal(verifySnp(s, {ok: false, notFound: true}).status, 'notfound');
});
