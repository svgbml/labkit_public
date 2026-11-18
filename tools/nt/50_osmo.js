/* ================= OSMOLARITEIT & IONSTERKTE =================
   De tabel, de velden en de uitkomst staan in src/tools/Osmo.vue; hier blijft de lijst met
   ionen per stof, waar het validatiegeval aan hangt. Een niet-elektrolyt staat als '0' en
   telt als één deeltje; '' betekent "vul de ladingen zelf in". */
const OSMI={'NaCl':'+1 -1','KCl':'+1 -1','CaCl₂':'+2 -1 -1','MgCl₂':'+2 -1 -1','MgSO₄':'+2 -2','Na₂SO₄':'+1 +1 -2','Na₂HPO₄':'+1 +1 -2','NaH₂PO₄':'+1 -1','KH₂PO₄':'+1 -1','K₂HPO₄':'+1 +1 -2','NaHCO₃':'+1 -1','Glucose':'0','Sucrose':'0','Ureum':'0','Glycerol':'0','Mannitol':'0','HEPES (zwitterion)':'0','eigen stof':''};
