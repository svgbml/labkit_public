/* Batch van Sanger-reads naar één genotypetabel (S162, #315/#316).
   Veel bestanden tegelijk: de bestandsnaam zegt welk monster het is en of het de forward- of de
   reverse-read is (MON1_F.ab1 en MON1_R.ab1 horen bij elkaar). Per monster worden de reads met
   dezelfde code als in de Chromatogram-tool uitgelijnd (src/lib/sangeralign.js) en per SNP van de
   assay tot een genotype gebracht; twee reads die het oneens zijn geven géén genotype, zoals in
   S161. Alles hier is puur rekenwerk zonder DOM, zodat het in tests/unit/ kan draaien. */

import {trimWindow} from './sangertrim.js';
import {hetCalls} from './sangerhet.js';
import {alignRead, snpCalls} from './sangeralign.js';

const MIX = 'RYSWKM';   // gemengde IUPAC-codes van twee basen
/* richtingstokens in een bestandsnaam; alleen als los woord achteraan */
const FWD = ['f', 'fwd', 'for', 'forward'], REV = ['r', 'rev', 'reverse'];
const EXT = /\.(ab1|abi|fsa|fasta|fa|fas|seq|txt)$/i;

/* 'plaat1_B03_fwd.ab1' → {name: 'plaat1_B03', dir: 'F'}; zonder richtingstoken dir '' */
export function readName(fname) {
  const base = String(fname || '').replace(/^.*[\\/]/, '').replace(EXT, '');
  const m = base.match(/^(.*?)[ _.-]([A-Za-z]+)$/);
  if (m && m[1]) {
    const tok = m[2].toLowerCase();
    if (FWD.includes(tok)) return {name: m[1], dir: 'F'};
    if (REV.includes(tok)) return {name: m[1], dir: 'R'};
  }
  return {name: base, dir: ''};
}

/* reads (met .name = bestandsnaam) → [{name, reads: [{dir, read, file}]}], in de volgorde waarin
   de monsters voorkomen. Reads zonder richtingstoken staan elk apart, want zonder richting is niet
   te zien of twee bestanden hetzelfde monster zijn. */
export function groupReads(reads) {
  const out = [], by = new Map();
  for (const read of reads || []) {
    const {name, dir} = readName(read.name);
    const item = {dir, read, file: read.name};
    const g = dir && by.get(name);
    if (g) { g.reads.push(item); continue; }
    const s = {name, reads: [item]};
    if (dir) by.set(name, s);
    out.push(s);
  }
  return out;
}

/* de call per base zoals de Chromatogram-tool hem toont: met een trace de IUPAC-code vanaf de
   drempel voor de tweede piek (anders de hoogste piek bij een gemengde call van de sequencer),
   zonder trace de basen uit het bestand; daarna de handmatige bewerkingen van de read. */
export function readSeq(read, thr) {
  let a = String(read.bases || '').split('');
  if (read.traces && read.peaks && read.peaks.length) {
    const h = hetCalls(read.traces, read.peaks, Math.min(read.peaks.length, a.length), thr);
    a = a.map((c, i) => !h[i] ? c : h[i].code || (MIX.includes(c) ? h[i].top : c));
  }
  if (read.edits) for (const i in read.edits) if (i < a.length) a[i] = read.edits[i];
  return a.join('');
}

/* één read uitlijnen op de referentie, over het getrimde stuk (zoals de tool) */
function alignOne(read, ref, opt) {
  const seq = readSeq(read, opt.hthr);
  if (!seq) return null;
  const t = read.qual && read.qual.length ? trimWindow(read.qual, opt.win, opt.q) : null;
  return alignRead(seq, ref, t ? {from: t.start - 1, to: t.end} : {});
}

/* Eén monster: {name, aligned (aantal uitgelijnde reads), files, gts, het, na, conflicts}.
   gts per SNP van de assay: {rs, pos, alleles, strand, gt ('' = geen genotype), gts (per read die
   de positie dekt), het, ok (allelen horen bij de assay), from ('F'|'R'|''|'both'), conflict}. */
export function callSample(sample, ref, assay, opt) {
  const per = [];
  for (const it of sample.reads) {
    const aln = alignOne(it.read, ref, opt);
    if (aln) per.push({dir: it.dir, calls: snpCalls(aln, assay)});
  }
  const snps = (assay && assay.snps) || [], gts = [];
  let het = 0, na = 0, conflicts = 0;
  snps.forEach((s, i) => {
    const seen = per.map(p => ({dir: p.dir, c: p.calls[i]})).filter(x => x.c && x.c.cov && x.c.gt && x.c.gt !== 'del');
    const uniq = [];
    for (const x of seen) if (!uniq.includes(x.c.gt)) uniq.push(x.c.gt);
    uniq.sort();
    const conflict = uniq.length > 1;
    const gt = conflict || !uniq.length ? '' : uniq[0];
    const g = {rs: s.rs, pos: s.pos, alleles: s.alleles, strand: s.strand, gt, gts: uniq, conflict,
      het: !!gt && gt[0] !== gt[gt.length - 1], ok: seen.every(x => x.c.ok),
      from: conflict ? 'both' : !seen.length ? '' : seen.length > 1 ? 'both' : seen[0].dir};
    if (conflict) conflicts++;
    if (!gt) na++; else if (g.het) het++;
    gts.push(g);
  });
  return {name: sample.name, aligned: per.length, files: sample.reads.map(r => r.file), gts, het, na, conflicts};
}

/* alle bestanden in één keer: groeperen per monster en per monster de genotypes bepalen */
export function callBatch(reads, ref, assay, opt) {
  return groupReads(reads).map(s => callSample(s, ref, assay, opt));
}

/* per SNP over alle monsters (#316): {rs, pos, alleles, counts [[genotype, aantal], … aflopend],
   samples {genotype: [monsternaam, …]}, na, het (aantal heterozygote monsters)} */
export function snpOverlay(results, assay) {
  const snps = (assay && assay.snps) || [];
  return snps.map((s, i) => {
    const samples = {}, order = [];
    let na = 0, het = 0;
    for (const r of results) {
      const g = r.gts[i];
      if (!g || !g.gt) { na++; continue; }
      if (!samples[g.gt]) { samples[g.gt] = []; order.push(g.gt); }
      samples[g.gt].push(r.name);
      if (g.het) het++;
    }
    const counts = order.map(gt => [gt, samples[gt].length]).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
    return {rs: s.rs, pos: s.pos, alleles: s.alleles, strand: s.strand, counts, samples, na, het};
  });
}

/* de tabel voor export: kop ['Monster', rs, …] (de kop is een vertaalsleutel) en per monster een rij */
export function genoMatrix(results, assay) {
  const snps = (assay && assay.snps) || [];
  return {head: ['Monster'].concat(snps.map(s => s.rs)),
    rows: results.map(r => [r.name].concat(r.gts.map(g => g.gt || 'NA')))};
}
