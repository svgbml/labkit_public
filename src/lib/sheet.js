/* ================= EXCEL MET FORMULES (S96, #149) =================
   Een uitkomst als klein rekenblad: kolom A de grootheid, B de waarde, C de eenheid. Een invoer is
   een getal, een uitkomst een formule die naar de invoer verwijst, zodat je in Excel ziet hoe hij
   tot stand komt en hem kunt narekenen of aanpassen.

     rows  [{k: 'c1', label, value: 50, unit}, {label, value: '={c2}*{v2}/{c1}', unit}, …]

   {k} in een formule wordt de cel B<rij> van de rij met die sleutel (rij 1 is de kop). Een formule
   gebruikt alleen + − × / ^ en haakjes, geen functienamen: die zijn in een Nederlandse Excel anders
   (WORTEL i.p.v. SQRT) en geplakte tekst wordt in de taal van Excel gelezen. Getallen in een formule
   staan met een punt; in het Nederlands wordt dat een komma, net als bij de waarden. */
const xn = (n, lang) => {
  if (!isFinite(n)) return '';
  const a = Math.abs(n);
  const s = a !== 0 && (a < 1e-4 || a >= 1e9) ? n.toExponential(6).replace(/\.?0+e/, 'e').toUpperCase() : String(Number(n.toPrecision(12)));
  return lang === 'en' ? s : s.replace('.', ',');
};
const clean = s => String(s == null ? '' : s).replace(/[\t\r\n]+/g, ' ');

export function sheetTSV(rows, lang, head) {
  const at = {};
  rows.forEach((r, i) => { if (r.k) at[r.k] = 'B' + (i + 2); });
  const cell = v => {
    if (typeof v === 'number') return xn(v, lang);
    const s = String(v);
    if (!s.startsWith('=')) return clean(s);
    const f = s.replace(/\{(\w+)\}/g, (_, k) => { if (!at[k]) throw new Error('sheetTSV: onbekende sleutel ' + k); return at[k]; });
    return lang === 'en' ? f : f.replace(/(\d)\.(\d)/g, '$1,$2');
  };
  return [head.map(clean).join('\t'), ...rows.map(r => [clean(r.label), cell(r.value), clean(r.unit)].join('\t'))].join('\r\n');
}
