/* Kaplan-Meier (S114, #219): de tabel "aantal at risk" onder de curve. Op elk tijdstip telt wie
   nog in de studie is (tijd ≥ t: geen gebeurtenis en niet gecensureerd ervoor), zoals de
   risk table van survminer::ggsurvplot in R. */

/* ronde tijdstippen 0, s, 2s, … tot en met tmax, met s = 1, 2 of 5 × 10^k en ongeveer vijf stappen */
export function riskTimes(tmax) {
  if (!(tmax > 0)) return [0];
  const raw = tmax / 5, e = 10 ** Math.floor(Math.log10(raw)), s = [1, 2, 5, 10].map(m => m * e).find(v => v >= raw);
  const out = [];
  for (let i = 0; i * s <= tmax + 1e-9; i++) out.push(+(i * s).toPrecision(12));
  return out;
}

/* per groep het aantal met tijd ≥ t op elk tijdstip */
export const atRisk = (R, groups, times) => groups.map(g => times.map(t => R.filter(r => r.g === g && r.t >= t).length));
