import test from 'node:test';
import assert from 'node:assert/strict';
import {readAbif} from '../../src/lib/abif.js';
import {LIZ120, sizeLadder, sizeAt, parsePanel, sbeChannels, sbeGenotypes} from '../../src/lib/snapshot.js';

/* Een verzonnen SNaPshot-run. De looptijd volgt de vergelijking van Southern, L = L0 + c/(m − m0)
   (Elder & Southern 1983), met L0 = 300, c = −200 000, m0 = 0: een fragment van L nt piekt op
   scan m = m0 + c/(L − L0), langere fragmenten later. Lokale Southern moet die lengtes dan precies terugvinden. */
const L0 = 300, C = -200000, M0 = 0, scanOf = L => M0 + C / (L - L0);
const N = 1500;
const gauss = (arr, at, h, w = 3) => { for (let i = Math.max(0, Math.round(at - 5 * w)); i < Math.min(N, at + 5 * w); i++) arr[i] += Math.round(h * Math.exp(-((i - at) ** 2) / (2 * w * w))); };
function run(peaks) {   /* peaks: [kanaal 0–3, lengte, hoogte] */
  const ch = [0, 1, 2, 3].map(() => new Array(N).fill(0)), std = new Array(N).fill(0);
  LIZ120.forEach(L => gauss(std, scanOf(L), 800));
  peaks.forEach(([k, L, h]) => gauss(ch[k], scanOf(L), h));
  return {ch, std};
}
/* drie SNP's: rs1 A/G heterozygoot rond 30 nt, rs2 C/C rond 45 nt, rs3 T/T rond 70 nt */
const PANEL = 'rs1 28 32 blauw=G groen=A\nrs2 43 47 zwart=C rood=T\nrs3 68 72 groen=A rood=T';
const PEAKS = [[0, 30.2, 900], [1, 29.8, 700], [2, 45, 1200], [3, 45.3, 40], [3, 70, 1500]];

test('lokale Southern vindt de lengtes van een Southern-looptijd precies terug', () => {
  const {std} = run([]);
  const lad = sizeLadder(std, LIZ120);
  assert.equal(lad.length, LIZ120.length);
  for (const L of [17, 30, 45, 70, 100]) assert.ok(Math.abs(sizeAt(scanOf(L), lad) - L) < 0.05, 'L=' + L + ' gaf ' + sizeAt(scanOf(L), lad));
});

test('het panel: naam, venster en kleur=allel per regel; fouten per regel', () => {
  const p = parsePanel(PANEL);
  assert.deepEqual(p.err, []);
  assert.deepEqual(p.snps[0], {id: 'rs1', min: 28, max: 32, dyes: {0: 'G', 1: 'A'}});
  assert.equal(parsePanel('rs9 50 40 blauw=G').err.length, 1);
  assert.equal(parsePanel('rs9 40 50 paars=G').err.length, 1);
});

test('een SBE-run geeft één genotype per SNP', () => {
  const {ch, std} = run(PEAKS);
  const r = sbeGenotypes(ch, std, parsePanel(PANEL).snps);
  assert.deepEqual(r.calls.map(c => [c.id, c.gt]), [['rs1', 'A/G'], ['rs2', 'C/C'], ['rs3', 'T/T']]);
  assert.ok(Math.abs(r.calls[0].peaks.find(x => x.allele === 'G').size - 30.2) < 0.1);
});

test('een SNP zonder piek in zijn venster heeft geen call', () => {
  const {ch, std} = run(PEAKS.slice(0, 2));
  const r = sbeGenotypes(ch, std, parsePanel(PANEL).snps);
  assert.equal(r.calls[1].gt, '');
});

/* een .fsa-achtig ABIF-bestand: DATA1–4 de kleurkanalen, DATA105 de lengtestandaard */
function abif(tags) {
  const parts = [], dir = [];
  let off = 128;
  for (const t of tags) {
    const bytes = t.u16 ? (() => { const b = new Uint8Array(t.u16.length * 2), v = new DataView(b.buffer); t.u16.forEach((x, i) => v.setInt16(i * 2, x)); return b; })() : t.bytes;
    dir.push({name: t.name, nr: t.nr, type: t.u16 ? 4 : 2, esize: t.u16 ? 2 : 1, count: t.u16 ? t.u16.length : bytes.length, size: bytes.length, off});
    parts.push(bytes); off += bytes.length;
  }
  const buf = new Uint8Array(off + dir.length * 28), v = new DataView(buf.buffer);
  buf.set([65, 66, 73, 70]); v.setInt16(4, 101); v.setInt32(18, dir.length); v.setInt32(26, off);
  let o = 128; parts.forEach(p => { buf.set(p, o); o += p.length; });
  dir.forEach((d, i) => {
    const p = off + i * 28;
    for (let k = 0; k < 4; k++) buf[p + k] = d.name.charCodeAt(k);
    v.setInt32(p + 4, d.nr); v.setInt16(p + 8, d.type); v.setInt16(p + 10, d.esize); v.setInt32(p + 12, d.count); v.setInt32(p + 16, d.size); v.setInt32(p + 20, d.off);
  });
  return buf;
}

test('een .fsa-bestand: kanalen uit DATA1–4 en DATA105 geven dezelfde genotypes', () => {
  const {ch, std} = run(PEAKS);
  const buf = abif([...ch.map((c, i) => ({name: 'DATA', nr: i + 1, u16: c})), {name: 'DATA', nr: 105, u16: std},
    {name: 'DyeN', nr: 1, bytes: new TextEncoder().encode('dR110')}]);
  const s = sbeChannels(readAbif(buf));
  assert.equal(s.ch.length, 4);
  assert.equal(s.std.length, N);
  const r = sbeGenotypes(s.ch, s.std, parsePanel(PANEL).snps);
  assert.deepEqual(r.calls.map(c => c.gt), ['A/G', 'C/C', 'T/T']);
});

test('het oefenvoorbeeld (met ruis) geeft A/G, C/C en T/T', async () => {
  const {sbeDemo, DEMO_PANEL} = await import('../../src/lib/snapshot.js');
  const d = sbeDemo();
  assert.deepEqual(sbeGenotypes(d.ch, d.std, parsePanel(DEMO_PANEL).snps).calls.map(c => c.gt), ['A/G', 'C/C', 'T/T']);
});
