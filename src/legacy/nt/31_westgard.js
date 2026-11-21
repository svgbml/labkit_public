/* Letterlijk overgenomen uit tools/nt/31_westgard.js (S269): een classic script dat als module in de bundel staat
   en zijn namen live op window zet, zodat de andere code ze als globale namen blijft lezen. */
import {live} from '../../lib/global.js';

/* ================= WESTGARD / LEVEY-JENNINGS =================
   De velden en de uitkomst staan in src/tools/Westgard.vue; hier blijft het rekenwerk:
   westgardCalc() schat (op verzoek) het gemiddelde en de SD uit de eerste 20 metingen, rekent de
   z-scores uit en past de Westgard-regels toe (1₂ₛ als waarschuwing, de rest als afkeuring). */
function westgardCalc(xs,m,s,est){
  if(est&&xs.length>=2){ const b=xs.slice(0,20); m=mean(b); s=sd(b); }
  if(!xs.length||!isFinite(m)||!(s>0)) return null;
  const z=xs.map(x=>(x-m)/s), V=xs.map(()=>[]), add=(i,r)=>{ if(!V[i].includes(r)) V[i].push(r); };
  z.forEach((v,i)=>{ if(Math.abs(v)>3) add(i,'1₃ₛ'); else if(Math.abs(v)>2) add(i,'1₂ₛ');
    if(i>=1&&((z[i]>2&&z[i-1]>2)||(z[i]<-2&&z[i-1]<-2))){ add(i,'2₂ₛ'); add(i-1,'2₂ₛ'); }
    if(i>=1&&((z[i]>2&&z[i-1]<-2)||(z[i]<-2&&z[i-1]>2))){ add(i,'R₄ₛ'); add(i-1,'R₄ₛ'); }
    if(i>=3){ const w=z.slice(i-3,i+1); if(w.every(v=>v>1)||w.every(v=>v<-1)) for(let k=i-3;k<=i;k++) add(k,'4₁ₛ'); }
    if(i>=9){ const w=z.slice(i-9,i+1); if(w.every(v=>v>0)||w.every(v=>v<0)) for(let k=i-9;k<=i;k++) add(k,'10ₓ'); } });
  const rej=V.map(v=>v.some(r=>r!=='1₂ₛ')), warnOnly=V.map((v,i)=>!rej[i]&&v.length>0), nRej=rej.filter(Boolean).length;
  return {m,s,z,V,rej,warnOnly,nRej}; }

/* alles hierboven ook als globale naam, live (zie src/lib/global.js) */
live({
  westgardCalc: [() => westgardCalc, v => { westgardCalc = v; }]
});
