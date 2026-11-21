/* Letterlijk overgenomen uit tools/nt/23_ystr.js (S269): een classic script dat als module in de bundel staat
   en zijn namen live op window zet, zodat de andere code ze als globale namen blijft lezen. */
import {live} from '../../lib/global.js';

/* ================= Y-STR / MTDNA =================
   De velden en de uitkomst staan in src/tools/Ystr.vue; hier blijft de Clopper-Pearson-
   bovengrens betaInvUp(), waar het validatiegeval aan hangt. */
function betaInvUp(x,n,cl){ /* Clopper-Pearson bovengrens via bisectie op de binomiale cdf */ const a=1-cl; if(x>=n) return 1; const cdf=p=>{ let s=0, t=Math.pow(1-p,n); for(let k=0;k<=x;k++){ s+=t; t=t*(n-k)/(k+1)*p/(1-p); } return s; }; let lo=x/n, hi=1; for(let i=0;i<100;i++){ const m=(lo+hi)/2; if(cdf(m)>a) lo=m; else hi=m; } return (lo+hi)/2; }

/* alles hierboven ook als globale naam, live (zie src/lib/global.js) */
live({
  betaInvUp: [() => betaInvUp, v => { betaInvUp = v; }]
});
