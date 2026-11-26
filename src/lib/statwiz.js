/* Statistiek (S113): de keuzehulp "welke toets?" (#213), de variantietoets voor de aannames
   (#215) en een geplakte tabel in lange of brede vorm (#216). */

const isNum = s => s.trim() !== '' && isFinite(num(s));

/* welke toets past: {test, why}; test is null als LabKit hem niet heeft.
   goal: desc | mu | groups | rel | count | n; k: '2' | '3'; paired, normal: yes | no | unknown */
export function whichTest({goal, k, paired, factors, normal}) {
  const np = normal === 'no';
  if (goal === 'desc') return {test: 'desc', why: 'Gemiddelde, spreiding, betrouwbaarheidsinterval en uitbijters van een of twee reeksen.'};
  if (goal === 'rel') return {test: 'reg', why: 'Een verband tussen twee gemeten variabelen: lineaire regressie met r en R².'};
  if (goal === 'count') return {test: 'chi', why: 'Aantallen per categorie: χ²-aanpassingstoets of een kruistabel.'};
  if (goal === 'n') return {test: 'power', why: 'Hoeveel metingen je nodig hebt voor een verschil dat je wilt aantonen.'};
  if (goal === 'mu') {
    return np ? {test: 'wil', why: 'Eén reeks tegen een vaste waarde, niet normaal verdeeld: Wilcoxon-rangtekentoets (laat B leeg).'}
      : {test: 't1', why: 'Eén reeks tegen een vaste waarde: t-toets voor één steekproef.'};
  }
  if (k === '2') {
    if (paired === 'yes') {
      return np ? {test: 'wil', why: 'Twee gepaarde reeksen, verschillen niet normaal verdeeld: Wilcoxon-rangtekentoets.'}
        : {test: 'tp', why: 'Twee gepaarde reeksen (dezelfde proefpersonen of monsters): gepaarde t-toets.'};
    }
    return np ? {test: 'kw', why: 'Twee onafhankelijke groepen, niet normaal verdeeld: Kruskal-Wallis met twee groepen (komt overeen met de Mann-Whitney-toets zonder continuïteitscorrectie).'}
      : {test: 't2', why: 'Twee onafhankelijke groepen: t-toets; bij ongelijke varianties neemt LabKit zelf de Welch-toets.'};
  }
  if (paired === 'yes') return {test: null, why: 'Drie of meer metingen bij dezelfde proefpersonen vraagt om een ANOVA voor herhaalde metingen of de Friedman-toets. Die zitten niet in LabKit; gebruik JASP of R.'};
  if (factors === '2') return {test: 'anova2', why: 'Twee factoren tegelijk (bijvoorbeeld medium en temperatuur): tweeweg-ANOVA met interactie.'};
  return np ? {test: 'kw', why: 'Drie of meer onafhankelijke groepen, niet normaal verdeeld: Kruskal-Wallis met Dunn.'}
    : {test: 'anova', why: 'Drie of meer onafhankelijke groepen: one-way ANOVA met Tukey.'};
}

/* Levene-toets met de mediaan (Brown & Forsythe 1974), zoals car::leveneTest in R:
   een one-way ANOVA op |x − mediaan van de groep|. Geeft F en de vrijheidsgraden; p = 1 − F-cdf. */
export function brownForsythe(groups) {
  const med = v => { const s = [...v].sort((a, b) => a - b), h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };
  const z = groups.map(v => { const m = med(v); return v.map(x => Math.abs(x - m)); });
  const N = z.reduce((a, v) => a + v.length, 0), k = z.length;
  const mean = v => v.reduce((a, b) => a + b, 0) / v.length, all = mean(z.flat());
  const ssb = z.reduce((a, v) => a + v.length * (mean(v) - all) ** 2, 0);
  const ssw = z.reduce((a, v) => { const m = mean(v); return a + v.reduce((s, x) => s + (x - m) ** 2, 0); }, 0);
  const df1 = k - 1, df2 = N - k;
  return {F: (ssb / df1) / (ssw / df2), df1, df2};
}

/* Een geplakte tabel (tabs of puntkomma's) als groepen [{name, v}], of null als het geen tabel is.
   Lang: per regel een groepsnaam en één waarde (in welke kolom ook), met een naam die terugkomt.
   Breed: een kopregel met namen en daaronder een kolom per groep. */
export function tableGroups(txt) {
  const lines = String(txt).replace(/\r/g, '').split('\n').filter(l => l.trim());
  if (lines.length < 2 || !lines.every(l => /[\t;]/.test(l))) return null;
  const rows = lines.map(l => l.split(l.includes('\t') ? '\t' : ';').map(s => s.trim()));
  const add = (out, name, x) => { let g = out.find(o => o.name === name); if (!g) out.push(g = {name, v: []}); g.v.push(num(x)); };
  /* lang: twee kolommen, een naam en een getal; een kopregel zonder getal valt weg */
  const body = rows[0].every(c => !isNum(c)) ? rows.slice(1) : rows;
  if (body.length && body.every(r => r.length === 2 && isNum(r[0]) !== isNum(r[1]))) {
    const out = []; body.forEach(r => (isNum(r[1]) ? add(out, r[0], r[1]) : add(out, r[1], r[0])));
    return out.some(g => g.v.length > 1) ? out : null;
  }
  /* breed: kopregel met minstens twee namen, daaronder alleen getallen of lege cellen */
  const head = rows[0];
  if (head.length >= 2 && head.every(c => c && !isNum(c)) && rows.slice(1).every(r => r.every(c => !c || isNum(c)))) {
    const out = head.map(name => ({name, v: []}));
    rows.slice(1).forEach(r => r.forEach((c, j) => { if (c && out[j]) out[j].v.push(num(c)); }));
    return out.filter(g => g.v.length);
  }
  return null;
}
