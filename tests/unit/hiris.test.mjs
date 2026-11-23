import test from 'node:test';
import assert from 'node:assert/strict';
import {SNPS, PANELS, panelSnps, csvHeader, countAllele, autofill, mergeCalls, naReport, validate, toCsv} from '../../src/lib/hiris.js';

/* de koptekst zoals het R-pakket hirisplexr hem schrijft (SampleID + rsID_allel in de volgorde van de webtool) */
const HEAD41 = 'SampleID,rs312262906_A,rs11547464_A,rs885479_T,rs1805008_T,rs1805005_T,rs1805006_A,rs1805007_T,rs1805009_C,rs201326893_A,rs2228479_A,rs1110400_C,rs28777_C,rs16891982_C,rs12821256_G,rs4959270_A,rs12203592_T,rs1042602_T,rs1800407_A,rs2402130_G,rs12913832_T,rs2378249_C,rs12896399_T,rs1393350_T,rs683_G,rs3114908_T,rs1800414_C,rs10756819_G,rs2238289_C,rs17128291_C,rs6497292_C,rs1129038_G,rs1667394_C,rs1126809_A,rs1470608_A,rs1426654_G,rs6119471_C,rs1545397_T,rs6059655_T,rs12441727_A,rs3212355_A,rs8051733_C';

test('41, 24 en 6 SNPs, kop gelijk aan de lijst van de webtool', () => {
  assert.equal(SNPS.length, 41); assert.equal(new Set(SNPS.map(s => s.rs)).size, 41);
  assert.equal(PANELS.hirisplex.length, 24); assert.equal(PANELS.irisplex.length, 6);
  assert.equal(csvHeader('hirisplexs'), HEAD41);
  assert.equal(csvHeader('hirisplex'), HEAD41.split(',').slice(0, 25).join(','));
  assert.equal(csvHeader('irisplex'), 'SampleID,rs12913832_T,rs1800407_A,rs12896399_T,rs16891982_C,rs1393350_T,rs12203592_T');
  assert.ok(PANELS.irisplex.every(r => PANELS.hirisplex.includes(r)));
});

/* een verzonnen assay (testwaarden, geen echte allelen): rs-nummers van het blad, willekeurig gekozen allelen */
const call = (rs, alleles, gt, ok = true, cov = true) => ({rs, alleles, gt, ok, cov});
test('allel tellen, streng omdraaien, dubbelzinnig, mismatch', () => {
  const s = rs => SNPS.find(x => x.rs === rs);
  assert.deepEqual(countAllele(s('rs12913832'), call('rs12913832', 'C/T', 'C/T')), {v: '1', note: ''});
  assert.deepEqual(countAllele(s('rs12913832'), call('rs12913832', 'C/T', 'T/T')), {v: '2', note: ''});
  assert.deepEqual(countAllele(s('rs885479'), call('rs885479', 'A/G', 'A/G')), {v: '1', note: 'flip'});   // de webtool telt T = complement van A
  assert.deepEqual(countAllele(s('rs885479'), call('rs885479', 'A/G', 'G/G')), {v: '0', note: 'flip'});
  assert.deepEqual(countAllele(s('rs6119471'), call('rs6119471', 'C/G', 'G/G')), {v: '0', note: 'ambig'});
  assert.deepEqual(countAllele(s('rs683'), call('rs683', 'A/T', 'A/A')), {v: 'NA', note: 'mismatch'});
  assert.deepEqual(countAllele(s('rs683'), call('rs683', 'G/T', 'G/T', false)), {v: 'NA', note: 'badcall'});
  assert.deepEqual(countAllele(s('rs683'), call('rs683', 'G/T', '', true, false)), {v: 'NA', note: 'nocall'});
});

test('autofill = met de hand ingevuld blad', () => {
  const calls = [call('rs12913832', 'C/T', 'C/T'), call('rs885479', 'A/G', 'A/A'), call('rs1800407', 'G/A', 'G/G'), call('rs683', 'A/T', 'A/T'), call('rs16891982', 'G/C', 'G/C', true, false)];
  const {vals, notes} = autofill(calls);
  const hand = Object.fromEntries(SNPS.map(s => [s.rs, 'NA']));
  Object.assign(hand, {rs12913832: '1', rs885479: '2', rs1800407: '0'});   // rs683: mismatch, rs16891982: niet gedekt, de rest staat niet in de assay
  assert.deepEqual(vals, hand);
  assert.equal(notes.rs885479, 'flip'); assert.equal(notes.rs683, 'mismatch'); assert.equal(notes.rs16891982, 'nocall'); assert.equal(notes.rs12821256, 'absent');
});

test('forward en reverse samenvoegen', () => {
  const a = [call('x', 'C/T', 'C/T'), call('y', 'C/T', '', true, false), call('z', 'C/T', 'T/T')];
  const b = [call('x', 'C/T', 'C/T'), call('y', 'C/T', 'C/C'), call('z', 'C/T', 'C/T')];
  const m = mergeCalls(a, b);
  assert.equal(m[0].gt, 'C/T'); assert.equal(m[1].gt, 'C/C'); assert.equal(m[2].conflict, true); assert.equal(m[2].ok, false);
});

test('NA per deelmodel en controle', () => {
  const vals = Object.fromEntries(SNPS.map(s => [s.rs, '1']));
  assert.ok(naReport(vals, 'hirisplexs').every(r => !r.warn));
  vals.rs12913832 = 'NA';   // 1 van 6 = 17% (oog), 1 van 24 (haar), 1 van 41 (huid)
  const r = Object.fromEntries(naReport(vals, 'hirisplexs').map(x => [x.id, x]));
  assert.equal(r.eye.warn, true); assert.equal(r.hair.warn, false); assert.equal(r.skin.na, 1);
  assert.deepEqual(naReport(vals, 'irisplex').map(x => x.id), ['eye']);
  vals.rs683 = ''; vals.rs1800407 = '3';
  assert.deepEqual(validate(vals, 'hirisplexs').map(x => x.rs + ':' + x.why), ['rs1800407:bad', 'rs683:blank']);
});

test('csv-export', () => {
  const t = toCsv('irisplex', [{id: 'a,b', vals: {rs12913832: '2', rs1800407: '0'}}, {id: 'c', vals: {}}]).split('\n');
  assert.equal(t[0], 'SampleID,rs12913832_T,rs1800407_A,rs12896399_T,rs16891982_C,rs1393350_T,rs12203592_T');
  assert.equal(t[1], '"a,b",2,0,NA,NA,NA,NA'); assert.equal(t[2], 'c,NA,NA,NA,NA,NA,NA');
  assert.equal(panelSnps('hirisplex').length, 24);
});

/* van reads naar blad: de verzonnen oefenreads met de rs-nummers van het blad, allelen willekeurig gekozen (testwaarden) */
import {TEACH, parseAssay, alignRead, snpCalls, teachReads} from '../../src/lib/sangeralign.js';
test('van read naar blad, forward en reverse samen, streng omgedraaid', () => {
  const {assay} = parseAssay({name: 't', ref: TEACH.ref, snps: [{rs: 'rs12913832', pos: 60, alleles: 'C/T', strand: '+'}, {rs: 'rs1800407', pos: 120, alleles: 'A/G', strand: '-'}, {rs: 'rs885479', pos: 180, alleles: 'G/A', strand: '+'}]});
  const t = teachReads(), seq = x => x.split('\n')[1];
  const c1 = snpCalls(alignRead(seq(t.f), assay.ref), assay), c2 = snpCalls(alignRead(seq(t.r), assay.ref), assay);
  const {vals, notes} = autofill(mergeCalls(c1, c2));
  const hand = Object.fromEntries(SNPS.map(s => [s.rs, 'NA']));
  /* hand: rs12913832 heterozygoot C/T, webtool telt T: 1. rs1800407: read 1 ziet T op de referentiestreng = A op de streng van de assay: 2 keer A, maar read 2
     ziet C = G: de reads zijn het oneens, dus NA. rs885479: A/A, de webtool telt T = complement van A: 2 */
  Object.assign(hand, {rs12913832: '1', rs885479: '2'});
  assert.deepEqual(vals, hand);
  assert.equal(notes.rs1800407, 'conflict'); assert.equal(notes.rs885479, 'flip');
});

test('het geëxporteerde bestand begint met de koptekst van het sjabloon', () => {
  const t = toCsv('hirisplexs', [{id: 'x', vals: Object.fromEntries(SNPS.map(s => [s.rs, '1']))}]).split('\n');
  assert.equal(t[0], HEAD41);
  assert.equal(t[1].split(',').length, 42); assert.equal(t[2], '');
});
