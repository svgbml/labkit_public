/* Gedeelde allelfrequentietabel van de forensische tools (rmp, mx, kn): één bewaarsleutel 'afreq',
   dus de gekozen populatie geldt voor alle drie. De frequenties in het voorbeeld zijn verzonnen. */

export const AF_EXAMPLE = 'Voorbeeld (verzonnen)';
export const AF_TEXT = `D3S1358 14 0,12
D3S1358 15 0,26
D3S1358 16 0,25
D3S1358 17 0,20
D3S1358 18 0,15
vWA 16 0,20
vWA 17 0,27
vWA 18 0,12
vWA 19 0,09
FGA 20 0,14
FGA 21 0,17
FGA 22 0,17
FGA 23 0,15
FGA 24 0,14
D8S1179 12 0,14
D8S1179 13 0,31
D8S1179 14 0,21
D8S1179 15 0,10
TH01 6 0,23
TH01 7 0,19
TH01 9.3 0,31`;

/* allelnaam: getrimd, komma als decimaalteken wordt punt (9,3 = 9.3) */
export const afAllele = a => String(a == null ? '' : a).trim().replace(',', '.');
const key = (l, a) => String(l).trim().toLowerCase() + '|' + afAllele(a);

/* tekst met regels `locus allel frequentie` (tab, ; of spatie) → {map, bad}; bad = ongeldige regels */
export function afParse(text) {
  const map = {}, bad = [];
  String(text || '').split(/\r?\n/).forEach((ln, i) => {
    ln = ln.trim();
    if (!ln) return;
    const c = ln.split(/[\t;]+|\s+/).filter(Boolean), f = num(c[2]);
    if (c.length !== 3 || !(f > 0 && f <= 1)) { bad.push(i + 1); return; }
    map[key(c[0], c[1])] = f;
  });
  return {map, bad};
}
export const afLookup = (map, locus, allele) => map[key(locus, allele)];

/* opslag: {pop, pops:{naam:tekst}}; altijd met het voorbeeld erin */
export function afLoad() {
  const s = jget('afreq', null) || {};
  const pops = Object.assign({[AF_EXAMPLE]: AF_TEXT}, s.pops || {});
  return {pop: pops[s.pop] != null ? s.pop : AF_EXAMPLE, pops};
}
export const afSave = s => jset('afreq', s);

/* zelftest van de parser; draait bij het laden, meldt alleen bij een fout */
{
  const r = afParse('vWA;17;0,27\nTH01\t9,3\t0.31\nfout 1 2');
  console.assert(afLookup(r.map, 'VWA', '17') === 0.27 && afLookup(r.map, 'th01', '9.3') === 0.31
    && r.bad.length === 1 && r.bad[0] === 3 && afAllele(' 9,3 ') === '9.3', 'afreq: parser');
}
