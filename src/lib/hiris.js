/* Het genotypeblad van HIrisPlex-S (S164–S166, #321–#328).
   LabKit bereidt het blad voor, controleert en exporteert het; de voorspelling zelf (oog-, haar- en huidskleur) blijft
   bij de webtool van het Erasmus MC (https://hirisplex.erasmusmc.nl/). De regressiecoëfficiënten zijn niet openbaar
   en LabKit rekent ze niet na.

   BRON van de lijst hieronder: de panelbestanden van het R-pakket hirisplexr 0.1.0 (CRAN, 2025,
   inst/extdata/hirisplex_panels.csv), dat de volgorde en het te tellen allel van de webtool en de handleiding overneemt:
   41 SNP's in de volgorde van de webtool, per SNP het allel dat wordt geteld (0/1/2 kopieën, NA bij ontbrekend).
   HIrisPlex = de eerste 24 van die lijst, IrisPlex = zes ervan in een eigen volgorde. Kolomnamen rsID_allel.
   De publicaties: Walsh e.a. 2013, Forensic Sci Int Genet 7:98–115 (HIrisPlex); Chaitanya e.a. 2018, Forensic Sci Int
   Genet 35:123–135 (HIrisPlex-S).
   NOG TE CONTROLEREN (de webtool zelf was bij het bouwen niet bereikbaar, ECONNREFUSED): (1) de exacte koptekst van het
   sjabloon van de webtool zelf (hier 'SampleID' zoals in hirisplexr), (2) welke SNP's per deelmodel meedoen (oog 6, haar
   22 van de 24, huid 36 van de 41), (3) het tweede allel van elke SNP (S200 haalt dat bij dbSNP op). */

export const HIRIS_SRC = 'hirisplexr 0.1.0 (CRAN), inst/extdata/hirisplex_panels.csv, naar de webtool en handleiding van het Erasmus MC; Walsh e.a. 2013; Chaitanya e.a. 2018';
export const ID_COL = 'SampleID';

/* [rs, allel dat de webtool telt] in de volgorde van de webtool (HIrisPlex-S) */
export const SNPS = [
  ['rs312262906', 'A'], ['rs11547464', 'A'], ['rs885479', 'T'], ['rs1805008', 'T'], ['rs1805005', 'T'], ['rs1805006', 'A'], ['rs1805007', 'T'],
  ['rs1805009', 'C'], ['rs201326893', 'A'], ['rs2228479', 'A'], ['rs1110400', 'C'], ['rs28777', 'C'], ['rs16891982', 'C'], ['rs12821256', 'G'],
  ['rs4959270', 'A'], ['rs12203592', 'T'], ['rs1042602', 'T'], ['rs1800407', 'A'], ['rs2402130', 'G'], ['rs12913832', 'T'], ['rs2378249', 'C'],
  ['rs12896399', 'T'], ['rs1393350', 'T'], ['rs683', 'G'], ['rs3114908', 'T'], ['rs1800414', 'C'], ['rs10756819', 'G'], ['rs2238289', 'C'],
  ['rs17128291', 'C'], ['rs6497292', 'C'], ['rs1129038', 'G'], ['rs1667394', 'C'], ['rs1126809', 'A'], ['rs1470608', 'A'], ['rs1426654', 'G'],
  ['rs6119471', 'C'], ['rs1545397', 'T'], ['rs6059655', 'T'], ['rs12441727', 'A'], ['rs3212355', 'A'], ['rs8051733', 'C']
].map(([rs, allele], i) => ({rs, allele, col: rs + '_' + allele, order: i + 1}));

const BY = new Map(SNPS.map(s => [s.rs, s]));
export const snpOf = rs => BY.get(rs) || null;

export const PANELS = {
  irisplex: ['rs12913832', 'rs1800407', 'rs12896399', 'rs16891982', 'rs1393350', 'rs12203592'],
  hirisplex: SNPS.slice(0, 24).map(s => s.rs),
  hirisplexs: SNPS.map(s => s.rs)
};
export const PANEL_NAME = {irisplex: 'IrisPlex (oogkleur, 6 SNP\'s)', hirisplex: 'HIrisPlex (oog en haar, 24 SNP\'s)', hirisplexs: 'HIrisPlex-S (oog, haar en huid, 41 SNP\'s)'};
/* de SNP's van een deelmodel voor de telling van ontbrekende waarden: oog = IrisPlex; haar en huid = het hele paneel
   (het model gebruikt er 22 en 36; welke is nog niet gecontroleerd, zie boven) */
export const SUBMODELS = [['eye', 'Oogkleur', 'irisplex'], ['hair', 'Haarkleur', 'hirisplex'], ['skin', 'Huidskleur', 'hirisplexs']];

export const panelSnps = panel => (PANELS[panel] || PANELS.hirisplexs).map(rs => BY.get(rs));
export const csvHeader = panel => [ID_COL].concat(panelSnps(panel).map(s => s.col)).join(',');

export const VALUES = ['', '0', '1', '2', 'NA'];
export const okValue = v => VALUES.includes(String(v));

const COMP = {A: 'T', T: 'A', C: 'G', G: 'C'};

/* Hoeveel kopieën van het allel dat de webtool telt zitten er in dit genotype?
   snp = het blad (SNPS), c = een element van snpCalls: {rs, alleles 'C/T' op de streng van de assay, cov, gt, ok}.
   Het allel van de webtool moet een van de twee allelen van de assay zijn, of zijn complement (andere streng):
   - alleen het allel zelf: tellen; alleen het complement: de streng omdraaien en dat tellen;
   - beide (een A/T- of C/G-SNP): de streng is niet af te leiden, het allel zelf wordt geteld en dat krijgt een waarschuwing
     (bij rs6119471 is dit de valkuil uit de handleiding);
   - geen van beide: de allelen van de assay passen niet bij deze SNP.
   Geeft {v: '0'|'1'|'2'|'NA', note: ''|'flip'|'ambig'|'mismatch'|'nocall'|'badcall'} */
export function countAllele(snp, c) {
  if (!c || !c.cov) return {v: 'NA', note: 'nocall'};
  if (!c.ok || !/^[ACGT]\/[ACGT]$/.test(c.gt)) return {v: 'NA', note: 'badcall'};
  const al = String(c.alleles).split('/'), a = snp.allele, k = COMP[a];
  const hasA = al.includes(a), hasK = al.includes(k);
  if (!hasA && !hasK) return {v: 'NA', note: 'mismatch'};
  const use = hasA ? a : k, n = c.gt.split('/').filter(x => x === use).length;
  return {v: String(n), note: hasA && hasK ? 'ambig' : hasA ? '' : 'flip'};
}

/* forward en reverse samen (S161): een base die één read dekt telt; dekken beide de SNP en zijn ze het oneens, dan NA */
export function mergeCalls(c1, c2) {
  if (!c2) return c1;
  return c1.map((a, i) => {
    const b = c2[i];
    if (!b || !b.cov) return a;
    if (!a.cov) return b;
    return a.gt === b.gt ? a : Object.assign({}, a, {gt: 'x/x', ok: false, conflict: true});
  });
}

/* het blad voor één monster uit de calls van een assay: {vals: {rs: '0'|'1'|'2'|'NA'}, notes: {rs: code}}
   SNP's van het blad die niet in de assay staan krijgen NA ('absent') */
export function autofill(calls) {
  const by = new Map((calls || []).map(c => [c.rs, c])), vals = {}, notes = {};
  for (const s of SNPS) {
    const c = by.get(s.rs);
    if (!c) { vals[s.rs] = 'NA'; notes[s.rs] = 'absent'; continue; }
    const r = countAllele(s, c);
    vals[s.rs] = r.v; if (c.conflict) notes[s.rs] = 'conflict'; else if (r.note) notes[s.rs] = r.note;
  }
  return {vals, notes};
}

/* ontbrekende waarden per deelmodel dat in het paneel zit: {id, name, n, na, blank, warn}.
   Waarschuwing bij meer dan 10% NA (een vuistregel van LabKit, geen gepubliceerde grens: de webtool rekent zelf met NA) */
export function naReport(vals, panel) {
  const inPanel = new Set(PANELS[panel] || PANELS.hirisplexs);
  return SUBMODELS.filter(m => PANELS[m[2]].every(rs => inPanel.has(rs))).map(([id, name, p]) => {
    const rs = PANELS[p], n = rs.length, na = rs.filter(r => vals[r] === 'NA').length, blank = rs.filter(r => !vals[r]).length;
    return {id, name, n, na, blank, warn: na / n > 0.1};
  });
}

/* controle van een blad: lijst {rs, why: 'blank'|'bad'} voor de SNP's van het paneel */
export function validate(vals, panel) {
  const out = [];
  for (const s of panelSnps(panel)) {
    const v = vals[s.rs];
    if (v == null || v === '') out.push({rs: s.rs, why: 'blank'}); else if (!okValue(v)) out.push({rs: s.rs, why: 'bad'});
  }
  return out;
}

const cell = v => /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
/* het .csv voor de webtool: SampleID en een kolom per SNP van het paneel; een lege cel wordt NA */
export function toCsv(panel, samples) {
  const snps = panelSnps(panel);
  return [csvHeader(panel)].concat(samples.map(s => [cell(String(s.id || ''))].concat(snps.map(x => s.vals && s.vals[x.rs] ? s.vals[x.rs] : 'NA')).join(','))).join('\n') + '\n';
}
