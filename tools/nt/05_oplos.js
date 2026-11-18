/* ================= OPLOSSING & BUFFER: BIBLIOTHEEK EN BALANS =================
   De tabel, de stappen, het advies en de receptkaart staan in src/tools/Oplossing.vue; wat hier
   overblijft is wat die component van buiten gebruikt. De recepten zelf staan in 03_recipe.js,
   dat hierboven in hetzelfde script is ingevoegd. */

/* ---------- welke balans hoort bij deze massa? (S39) ----------
   De kleinste massa die je met een gevraagde nauwkeurigheid nog kunt afwegen volgt uit de
   herhaalbaarheid s van de balans: m ≥ 2s / nauwkeurigheid (het 2s-criterium uit USP <41>).
   Met s gelijk aan de afleesbaarheid betekent dat: op 0,1 mg haal je vanaf ongeveer 20 mg
   nog 1%, en op 10 mg pas vanaf ongeveer 2 g. Het zijn vuistregels; de werkelijke s staat in
   het kalibratierapport van de balans. */
function oBalance(grams){
  if(!isFinite(grams)||grams<=0) return null;
  if(grams<0.02) return {k:'bad',t:'te weinig om op 1% af te wegen: maak een stockoplossing en pipetteer die'};
  if(grams<2) return {k:'warn',t:'analytische balans (0,1 mg)'};
  return {k:'ok',t:'precisiebalans (10 mg) is genoeg'};
}

/* ---------- hydraatvormen uit de bibliotheek erbij (S37) ----------
   De bibliotheek brengt eigen hydraatvormen mee; HYD en de chemicaliënlijst worden in
   web/index.html opgebouwd, dus die worden hier aangevuld. De keuzelijst met recepten en het
   laden van het eerste recept doet src/tools/Oplossing.vue. */
RECHYD.forEach(g=>{ if(!HYD.some(h=>h[0]===g[0])) HYD.push(g);
  g[1].forEach(v=>{ if(!CHEM[v[1]]){ CHEM[v[1]]=v[2]; $('#chem-list').insertAdjacentHTML('beforeend',`<option value="${v[1]}">`); } }); });
