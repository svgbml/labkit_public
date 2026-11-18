/* ================= OPLOSBAARHEID (KSP) =================
   De velden en de uitkomst staan in src/tools/Ksp.vue; hier blijven de zoutenlijst en het
   rekenwerk, waar het validatiegeval aan hangt. Met een gemeenschappelijk ion is er geen
   gesloten uitdrukking, dus kspSolve() zoekt met bisectie naar de nul van
   x·ln(x·s + c_M) + y·ln(y·s + c_A) − ln(K). */
const KSP=[['AgCl',1.77e-10,1,1,143.32],['AgBr',5.35e-13,1,1,187.77],['AgI',8.52e-17,1,1,234.77],['Ag₂CrO₄',1.12e-12,2,1,331.73],['BaSO₄',1.08e-10,1,1,233.39],['CaCO₃ (calciet)',3.36e-9,1,1,100.09],['CaF₂',3.45e-11,1,2,78.07],['Ca(OH)₂',5.02e-6,1,2,74.09],['CaSO₄',4.93e-5,1,1,136.14],['Mg(OH)₂',5.61e-12,1,2,58.32],['PbI₂',9.8e-9,1,2,461.01],['Fe(OH)₃',2.79e-39,1,3,106.87]];
function kspSolve(K,x,y,cm,ca){ const f=s=>x*Math.log(x*s+cm)+y*Math.log(y*s+ca)-Math.log(K); let lo=0, hi=1; while(f(hi)<0&&hi<1e6) hi*=10; if(f(lo)>=0) return 0; for(let i=0;i<200;i++){ const m=(lo+hi)/2; if(f(m)<0) lo=m; else hi=m; } return (lo+hi)/2; }
