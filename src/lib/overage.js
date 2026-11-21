/* Overmaat voor een mastermix: hoeveel reacties je werkelijk klaarmaakt voor n reacties.
   mode 'pct'   n × (1 + pct/100)   (het bestaande veld "Extra marge")
   mode 'plus1' n + 1
   mode 'none'  n
   why is de Nederlandse zin voor op het scherm; lk-overage vertaalt hem (getallen worden {#}). */
export function overage(n, mode, pct) {
  const F = (x, d) => (typeof fmt === 'function' ? fmt(x, d) : String(x));
  const p = isFinite(pct) ? pct : 0;
  let mult, why;
  if (mode === 'plus1') {
    mult = n + 1;
    why = F(n, 1) + ' reacties + 1 extra = ' + F(mult, 1) + '×';
  } else if (mode === 'none') {
    mult = n;
    why = F(n, 1) + ' reacties, geen overmaat = ' + F(mult, 1) + '×';
  } else {
    mult = n * (1 + p / 100);
    why = F(n, 1) + ' reacties × (1 + ' + F(p, 0) + '%) = ' + F(mult, 1) + '×';
  }
  return {mult, why};
}
