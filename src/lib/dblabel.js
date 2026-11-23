/* ================= ALLELEN EN STRENG UIT dbSNP (S199, idee #382) =================
   dbSNP geeft de allelen op de plusstreng van het genoom (parseSnp in src/lib/dbsnp.js). Een amplicon
   kan op de andere streng liggen; dan moet wat de read ziet worden omgedraaid. Hier bepaalt LabKit die
   streng zelf, zodat een genotype in de richting van dbSNP komt met het referentie-allel erbij.

   1. Uit de allelen: staat de base van het amplicon (of alleen zijn complement) bij de allelen van dbSNP,
      dan is de streng duidelijk. Bij een A/T- of C/G-SNP, of een SNP met alle vier de basen, niet.
   2. Uit de flank: 20 basen links en rechts van de SNP op de plusstreng (efetch, flankRegion), vergeleken
      met het amplicon rond de SNP, recht en omgekeerd.
   Streng '-' betekent hier wat het in de assay betekent: de allelen staan op de andere streng dan het
   amplicon (zie parseAssay in src/lib/sangeralign.js). Zuiver, zonder verzoek en zonder DOM. */
import {rc} from './sangeralign.js';

const BASES = r => [r.ref].concat(r.alts || []).filter(b => /^[ACGT]$/.test(b));

/* '+', '-' of null (niet te zeggen) uit de base van het amplicon op de plek van de SNP */
export function orientByAlleles(r, base) {
  const S = BASES(r), b = String(base || '').toUpperCase(), c = rc(b);
  const f = S.includes(b), v = S.includes(c);
  return f && !v ? '+' : v && !f ? '-' : null;
}

/* het stuk van de plusstreng om op te halen: k basen links en rechts van de SNP */
export const flankRegion = (r, k = 20) => ({acc: r.acc, from: r.pos - k, to: r.pos + k});

/* flank = plusstreng met de SNP in het midden; amp = amplicon, pos 1-gebaseerd; '+', '-' of null */
export function orientByFlank(flank, amp, pos) {
  const f = String(flank || '').toUpperCase().replace(/[^ACGTN]/g, ''), k = (f.length - 1) >> 1, A = String(amp || '').toUpperCase();
  const score = s => {
    let n = 0, hit = 0;
    for (let d = -k; d <= k; d++) {
      const a = A[pos - 1 + d], g = s[k + d];
      if (!d || !a || !g || g === 'N') continue;
      n++; if (a === g) hit++;
    }
    return n >= 10 ? hit / n : 0;
  };
  return score(f) >= 0.9 ? '+' : score(rc(f)) >= 0.9 ? '-' : null;
}

/* het label van één SNP: {strand, ref, alleles: 'ref/alt' op de dbSNP-streng, multi: meer dan één alt}.
   Het alt-allel: de base van het amplicon als die een alt is, anders een allel van de assay-SNP s
   ({alleles, strand} zoals de gebruiker ze schreef) dat een alt is, anders het eerste alt van dbSNP.
   null als de streng onbekend is. */
export function dbLabel(r, strand, ampBase, s) {
  if (strand !== '+' && strand !== '-') return null;
  const alts = (r.alts || []).filter(b => /^[ACGT]$/.test(b) && b !== r.ref);
  if (!alts.length) return null;
  const own = strand === '-' ? rc(String(ampBase || '')) : String(ampBase || '');
  /* de allelen van de assay eerst op het amplicon, dan op de dbSNP-streng */
  const flip = (a, st) => st === '-' ? a.map(x => rc(x)) : a;
  const as = s ? flip(flip(String(s.alleles || '').toUpperCase().split('/').filter(Boolean), s.strand), strand) : [];
  const alt = alts.includes(own) ? own : alts.find(b => as.includes(b)) || alts[0];
  return {strand, ref: r.ref, alleles: r.ref + '/' + alt, multi: alts.length > 1};
}

/* de assay met streng en allelen uit dbSNP voor de SNP's in labels ({rs: dbLabel}) */
export function dbAssay(assay, labels) {
  return Object.assign({}, assay, {snps: assay.snps.map(s => labels[s.rs] ? Object.assign({}, s, {strand: labels[s.rs].strand, alleles: labels[s.rs].alleles}) : s)});
}
