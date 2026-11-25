/* ================= VERDELING OVER DE VORMEN VAN EEN ZUUR (S99, #159) =================
   specFrac(pka, pH) → [α₀, …, αₙ]: het aandeel van H(n−j)A^(j−) bij die pH, j = aantal afgegeven protonen,
   pka oplopend gesorteerd. α_j ∝ [H⁺]^(n−j) · K₁⋯K_j (Harris, Quantitative Chemical Analysis, hfst. 10–11);
   gerekend in logaritmen, zodat een pKₐ van −6 of een pH van 14 geen over- of onderloop geeft. */
export function specFrac(pka, pH) {
  const n = pka.length, L = [];
  for (let j = 0, s = 0; j <= n; j++) { L.push(-(n - j) * pH - s); if (j < n) s += pka[j]; }
  const mx = Math.max(...L), e = L.map(l => 10 ** (l - mx)), sum = e.reduce((a, b) => a + b, 0);
  return e.map(x => x / sum);
}
