/* Veel reads tegelijk (S162, #315 #316): per bestand dezelfde stappen als voor één read (heterozygoten,
   trimvenster, uitlijning tegen de referentie, genotypen van de assay), en daarna een tabel
   met een rij per monster en een kolom per SNP. Alles zuiver, zonder DOM. */
import {hetCalls} from './sangerhet.js';
import {trimWindow} from './sangertrim.js';
import {alignRead, snpCalls, DEC} from './sangeralign.js';

const MIX = 'RYSWKM';

/* de calls van een read zoals de tool ze toont: boven de drempel de IUPAC-code van de piekverhouding, daarna de
   handmatige bewerkingen; r = {bases, traces, peaks, qual, edits?} */
export function readSeq(r, hthr) {
  let a = r.bases.split('');
  if (r.traces) {
    const h = hetCalls(r.traces, r.peaks, Math.min(r.peaks.length, r.bases.length), hthr);
    a = a.map((c, i) => !h[i] ? c : h[i].code || (MIX.includes(c) ? h[i].top : c));
  }
  if (r.edits) for (const i in r.edits) if (i < a.length) a[i] = r.edits[i];
  return a.join('');
}

/* één monster: {name, seq, trim, aln, calls}; calls = snpCalls (leeg zonder uitlijning of assay) */
export function callSample(r, ref, assay, o = {}) {
  const seq = readSeq(r, o.het || 0.2);
  const trim = r.qual && r.qual.length ? trimWindow(r.qual, o.win || 10, o.q == null ? 20 : o.q) : null;
  const aln = ref ? alignRead(seq, ref, trim ? {from: trim.start - 1, to: trim.end} : {}) : null;
  return {name: r.name, seq, trim, aln, calls: aln && assay ? snpCalls(aln, assay) : []};
}

/* de genotypetabel: een rij per monster, een kolom per SNP; ' ' voor een SNP die de read niet dekt */
export function genotypeRows(samples, assay) {
  const snps = (assay && assay.snps) || [];
  return samples.map(s => [s.name, s.aln ? Math.round(s.aln.ident * 1000) / 10 : null].concat(snps.map((x, i) => {
    const c = s.calls[i];
    return !s.aln ? '–' : !c || !c.cov ? '–' : c.gt + (c.ok ? '' : ' !');
  })));
}

/* de trace rond SNP i in elk monster, voor de overlay: {name, strand, q (readindex of −1), base, x0, spp, traces}
   half = aantal basen links en rechts van de SNP, w = breedte in pixels */
export function overlayStrips(samples, i, half, w) {
  return samples.map(s => {
    const c = s.calls[i], r = s.read;
    if (!c || !c.cov || c.q < 0) return {name: s.name, q: -1};
    const o = {name: s.name, q: c.q, base: c.call, strand: s.aln.strand, gt: c.gt, traces: null};
    if (r && r.traces && r.peaks[c.q] != null) {
      const p = r.peaks, n = p.length, sp = n > 1 ? (p[n - 1] - p[0]) / (n - 1) : 12;
      o.traces = r.traces; o.spp = sp * (2 * half + 1) / w; o.x0 = p[c.q] - sp * (half + 0.5); o.cx = (p[c.q] - o.x0) / o.spp;
    }
    return o;
  });
}

/* heeft de read een heterozygote call op deze SNP (voor een tellinkje onder de overlay) */
export const isHet = c => !!c && c.cov && (DEC[c.call] || '').length === 2;
