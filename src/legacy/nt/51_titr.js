/* Letterlijk overgenomen uit tools/nt/51_titr.js (S269): een classic script dat als module in de bundel staat
   en zijn namen live op window zet, zodat de andere code ze als globale namen blijft lezen. */
import {live} from '../../lib/global.js';

/* ================= TITRATIECURVE =================
   De velden, de uitkomst en de curve staan in src/tools/Titr.vue; hier blijft alleen het
   rekenwerk (titrPH: exacte oplossing van de ladingsbalans). */
function titrPH(pka,acid,Ca,Va,Cb,Vb){ const n=pka.length, Ka=pka.map(p=>Math.pow(10,-p)), V=Va+Vb, C=Ca*Va/V, T=Cb*Vb/V, q0=acid?0:n;
  const bal=lh=>{ const h=Math.pow(10,lh); const t=[]; for(let j=0;j<=n;j++){ let v=Math.pow(h,j); for(let i=0;i<n-j;i++) v*=Ka[i]; t.push(v); } const s=t.reduce((a,b)=>a+b,0); let q=0; for(let j=0;j<=n;j++) q+=t[j]/s*(q0-n+j); return h-1e-14/h+(acid?T:-T)+C*q; };
  let lo=-14.5, hi=1; for(let i=0;i<80;i++){ const m=(lo+hi)/2; if(bal(m)>0) hi=m; else lo=m; } return -(lo+hi)/2; }

/* alles hierboven ook als globale naam, live (zie src/lib/global.js) */
live({
  titrPH: [() => titrPH, v => { titrPH = v; }]
});
