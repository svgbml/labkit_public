/* ================= ONZEKERHEID DOORREKENEN (S96, #144) =================
   Voor een uitkomst die een product of quotiënt van machten is, y = c·Π xᵢ^pᵢ, geeft JCGM 100:2008 (GUM)
   vgl. (12) de relatieve standaardonzekerheid u_r(y) = √Σ (pᵢ·u(xᵢ)/xᵢ)², als de invoer onafhankelijk is.
   terms = [[x, u, p], …]; een term zonder u (NaN of leeg) telt niet mee; geen enkele u → NaN. */
export function relU(terms) {
  const t = terms.filter(([x, u]) => isFinite(u) && u >= 0 && isFinite(x) && x !== 0);
  return t.length ? Math.sqrt(t.reduce((s, [x, u, p]) => s + (p * u / x) ** 2, 0)) : NaN;
}
