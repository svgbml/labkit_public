/* ================= PIPETADVIES BIJ EEN VOLUME =================
   Eén plek voor "met welke pipet?" en de waarschuwing onder 1 µL, zodat elke mengtool
   dezelfde regel gebruikt. Een pipet met variabel volume werkt tussen 10% en 100% van zijn
   nominale volume (dezelfde regel als in Welke pipet?). De set is de gangbare P2, P10, P20,
   P200 en P1000; boven 1000 µL pak je een P5000 of een maatpipet, daar geven we geen advies. */
const SET = [2, 10, 20, 200, 1000];

/* {pip: 'P20' of '', warn: true bij minder dan 1 µL} of null bij geen bruikbaar volume */
export function pipAdvice(uL) {
  if (!isFinite(uL) || uL <= 0) return null;
  const nom = SET.find(n => uL <= n * 1.000001 && uL >= n * 0.1 - 1e-9);
  return {pip: nom ? 'P' + nom : '', warn: uL < 1};
}

/* HTML-stukje om achter een volume te zetten: " P10" of " P2 · < 1 µL"; leeg als er niets te zeggen is */
export function pipHtml(uL) {
  const a = pipAdvice(uL);
  if (!a || (!a.pip && !a.warn)) return '';
  const title = typeof trPlain === 'function' ? trPlain('Pipet die bij dit volume past') : '';
  return '<small class="pip" style="color:' + (a.warn ? 'var(--warn)' : 'var(--muted)')
    + ';font-weight:400;white-space:nowrap" title="' + title + '"> ' + a.pip
    + (a.warn ? (a.pip ? ' · ' : '') + '&lt; 1 µL' : '') + '</small>';
}
