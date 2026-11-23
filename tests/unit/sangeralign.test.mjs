import test from 'node:test';
import assert from 'node:assert/strict';
import {rc, alignRead, variants, parseAssay, assayJson, snpCalls, confirm, TEACH, teachReads, parseRef} from '../../src/lib/sangeralign.js';

/* een vaste pseudo-willekeurige referentie van 600 basen; de testreads zijn er stukken van met bekende wijzigingen */
let s = 7;
const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
let REF = '';
for (let i = 0; i < 600; i++) REF += 'ACGT'[Math.floor(rnd() * 4)];
/* p is 0-gebaseerd; een base die anders is dan de referentie */
const other = b => ({A: 'C', C: 'G', G: 'T', T: 'A'})[b];
const subAt = (seq, p, b) => seq.slice(0, p) + b + seq.slice(p + 1);
/* een plek waar een gat niet verschuift (buren anders) */
const lone = from => { let p = from; while (REF[p] === REF[p + 1] || REF[p] === REF[p - 1]) p++; return p; };

test('anker: een verschoven read vindt zijn offset', () => {
  const a = alignRead(REF.slice(100, 500), REF);
  assert.equal(a.strand, '+'); assert.equal(a.offset, 100);
  assert.equal(a.rFrom, 100); assert.equal(a.rTo, 499);
  assert.equal(a.mism + a.ins + a.del, 0);
  assert.deepEqual(variants(a, REF), []);
  assert.equal(a.cols[0].q, 0);   // readindex van de eerste uitgelijnde base
});

test('substituties komen als g.-notatie op de juiste referentiepositie', () => {
  let rd = REF.slice(50, 450);
  for (const p of [120, 200, 300]) rd = subAt(rd, p - 50, other(REF[p]));
  const a = alignRead(rd, REF);
  assert.equal(a.offset, 50); assert.equal(a.mism, 3);
  assert.deepEqual(variants(a, REF).map(v => v.hgvs), [120, 200, 300].map(p => 'g.' + (p + 1) + REF[p] + '>' + other(REF[p])));
  /* met een startcoördinaat (genoom) schuift alleen de nummering */
  assert.equal(variants(a, REF, {start: 1001, snps: []})[0].hgvs, 'g.1121' + REF[120] + '>' + other(REF[120]));
  /* de readindex van de variant wijst naar de base in de read (en dus naar zijn piek in de trace) */
  assert.equal(variants(a, REF)[0].q, 70);
});

test('deletie en insertie van één base', () => {
  const d = lone(250), rd = REF.slice(60, d) + REF.slice(d + 1, 480);
  const a = alignRead(rd, REF);
  assert.equal(a.offset, 60); assert.equal(a.del, 1);
  assert.deepEqual(variants(a, REF).map(v => v.hgvs), ['g.' + (d + 1) + 'del']);
  let p = 300; while (REF[p] === 'A' || REF[p + 1] === 'A') p++;
  const b = alignRead(REF.slice(60, p + 1) + 'A' + REF.slice(p + 1, 480), REF);
  assert.deepEqual(variants(b, REF).map(v => v.hgvs), ['g.' + (p + 1) + '_' + (p + 2) + 'insA']);
});

test('3\'-regel: een gat in een herhaling staat op de laatste base; een extra kopie is dup', () => {
  const ref = REF.slice(0, 200) + 'GTTTTC' + REF.slice(200, 400);   // T's op 0-gebaseerd 201–204 → g.202–g.205
  const del = alignRead(ref.slice(20, 202) + ref.slice(203, 380), ref);
  assert.deepEqual(variants(del, ref).map(v => v.hgvs), ['g.205del']);
  const dup = alignRead(ref.slice(20, 203) + 'T' + ref.slice(203, 380), ref);
  assert.deepEqual(variants(dup, ref).map(v => v.hgvs), ['g.205dup']);
  const del2 = alignRead(ref.slice(20, 201) + ref.slice(203, 380), ref);
  assert.deepEqual(variants(del2, ref).map(v => v.hgvs), ['g.204_205del']);
});

test('reverse read: reverse complement, offset en variant op de referentiestreng', () => {
  const fw = subAt(REF.slice(200, 550), 133, other(REF[333]));
  const a = alignRead(rc(fw), REF);
  assert.equal(a.strand, '-'); assert.equal(a.offset, 200);
  const v = variants(a, REF);
  assert.deepEqual(v.map(x => x.hgvs), ['g.334' + REF[333] + '>' + other(REF[333])]);
  /* readindex in de oorspronkelijke (reverse) read: base 133 van de forward is base 349 − 133 van de reverse */
  assert.equal(v[0].q, 349 - 133);
});

test('heterozygote IUPAC-call als beide allelen, met het rs-nummer uit de assay', () => {
  let p = 150; while (!'AG'.includes(REF[p])) p++;
  const rd = subAt(REF.slice(100, 400), p - 100, 'R');
  const alt = REF[p] === 'A' ? 'G' : 'A';
  const assay = {start: 1, snps: [{rs: 'rs999', pos: p + 1, alleles: REF[p] + '/' + alt, strand: '+'}]};
  const v = variants(alignRead(rd, REF), REF, assay);
  assert.equal(v.length, 1);
  assert.equal(v[0].hgvs, 'g.[' + (p + 1) + REF[p] + '>' + alt + '];[' + (p + 1) + '=]');
  assert.equal(v[0].zyg, 'het'); assert.equal(v[0].rs, 'rs999');
  const c = snpCalls(alignRead(rd, REF), assay)[0];
  assert.equal(c.gt, REF[p] + '/' + alt); assert.ok(c.ok);
  /* een Y zonder de referentiebase: twee andere allelen */
  let y = 160; while (!'AG'.includes(REF[y])) y++;
  const v2 = variants(alignRead(subAt(REF.slice(100, 400), y - 100, 'Y'), REF), REF);
  assert.equal(v2[0].hgvs, 'g.[' + (y + 1) + REF[y] + '>C];[' + (y + 1) + REF[y] + '>T]');
});

test('geen overeenkomst: null', () => {
  assert.equal(alignRead('ACGTACGTACGTACGTACGTACGTACGTACGT'.replace(/./g, 'A'), REF), null);
  assert.equal(alignRead('', REF), null);
});

test('assayformaat: inlezen, fouten en terug naar JSON', () => {
  const {assay, err} = parseAssay(assayJson(TEACH));
  assert.deepEqual(err, []);
  assert.equal(assay.ref, TEACH.ref); assert.equal(assay.snps.length, 3);
  assert.deepEqual(parseAssay('{').err, [['Geen geldige JSON.']]);
  const bad = parseAssay({name: 'x', ref: 'ACGTACGT', snps: [{rs: 'rs1', pos: 3, alleles: 'A/T', strand: '+'}, {rs: 'rs2', pos: 99, alleles: 'A/G'}]});
  assert.deepEqual(bad.err.map(e => e[1]), ['rs1', 'rs2']);   // positie 3 is een G: geen van beide allelen; rs2 buiten het amplicon
  /* streng '-': de allelen op de andere streng; positie 3 (G) als C/T op de minstreng is goed */
  assert.deepEqual(parseAssay({name: 'x', ref: 'ACGTACGT', snps: [{rs: 'rs1', pos: 3, alleles: 'C/T', strand: '-'}]}).err, []);
});

test('oefenpanel: strengomkering, reverse read en een bewuste tegenspraak tussen forward en reverse', () => {
  const t = teachReads(), f = parseRef(t.f).seq, r = parseRef(t.r).seq;
  const a = alignRead(f, TEACH.ref), b = alignRead(r, TEACH.ref);
  assert.equal(a.strand, '+'); assert.equal(a.offset, 15);
  assert.equal(b.strand, '-'); assert.equal(b.offset, 30);
  const ga = snpCalls(a, TEACH).map(x => x.gt), gb = snpCalls(b, TEACH).map(x => x.gt);
  /* OEF-2 staat op de minstreng: de T van de read wordt A, de C wordt G */
  assert.deepEqual(ga, ['C/T', 'A/A', 'A/A']);
  assert.deepEqual(gb, ['C/T', 'G/G', 'A/A']);
  const c = confirm(a, b, TEACH.ref.length);
  assert.deepEqual(c.rows.filter(x => x.st === 'diff').map(x => [x.r + 1, x.a, x.b]), [[120, 'T', 'C']]);
  assert.equal(c.counts.one1, 15);   // basen 16–30 alleen in read 1
  assert.equal(c.counts.one2, 13);   // basen 226–238 alleen in read 2
  assert.equal(c.counts.same + c.counts.diff, 225 - 30);
});

test('forward/reverse: een deletie in één read is een tegenspraak', () => {
  const d = lone(300);
  const a = alignRead(REF.slice(100, 500), REF), b = alignRead(rc(REF.slice(150, d) + REF.slice(d + 1, 560)), REF);
  const c = confirm(a, b, REF.length);
  assert.deepEqual(c.rows.filter(x => x.st === 'diff').map(x => [x.r, x.a, x.b]), [[d, REF[d], '-']]);
});
