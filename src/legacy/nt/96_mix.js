/* Letterlijk overgenomen uit tools/nt/96_mix.js (S269): een classic script dat als module in de bundel staat
   en zijn namen live op window zet, zodat de andere code ze als globale namen blijft lezen. */
import {live} from '../../lib/global.js';

/* ================= MENGPROFIEL & LR =================
   De velden, de locustabel en de uitkomst staan in src/tools/Mix.vue; hier blijven de twee
   hulpfuncties: mxTok() splitst een cel in waarden, mxLR() geeft de likelihood ratio van een locus. */
const mxTok=t=>String(t).trim().split(/[\s;\/]+/).filter(Boolean).map(x=>x.replace(',','.'));
function mxLR(E,p,V,S,th){ /* E: allelen, p: {allel:freq}, V/S: genotypen */ const need=E.filter(a=>!V.includes(a)), seen={}; [...V,...S].forEach(a=>seen[a]=(seen[a]||0)+1); const n0=V.length+S.length;
  const pr=(a,cnt,n)=>((cnt[a]||0)*th+(1-th)*p[a])/(1+(n-1)*th); let den=0;
  for(let i=0;i<E.length;i++) for(let j=i;j<E.length;j++){ const g=[E[i],E[j]]; if(!need.every(a=>g.includes(a))) continue; const c1={...seen}, p1=pr(g[0],c1,n0); c1[g[0]]=(c1[g[0]]||0)+1; const p2=pr(g[1],c1,n0+1); den+=(i===j?1:2)*p1*p2; }
  return den>0?1/den:NaN; }

/* alles hierboven ook als globale naam, live (zie src/lib/global.js) */
live({
  mxTok: () => mxTok,
  mxLR: [() => mxLR, v => { mxLR = v; }]
});
