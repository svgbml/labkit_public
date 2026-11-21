/* Letterlijk overgenomen uit tools/nt/78_bufcap.js (S269): een classic script dat als module in de bundel staat
   en zijn namen live op window zet, zodat de andere code ze als globale namen blijft lezen. */
import {live} from '../../lib/global.js';

/* ================= BUFFERCAPACITEIT =================
   De velden, de uitkomst en de tekening staan in src/tools/Bufcap.vue; hier blijft alleen het
   rekenwerk, waar het validatiegeval aan hangt. n̄(pH) is het gemiddelde aantal afgestane
   protonen uit de fracties van alle protoneringsvormen; β volgt als numerieke afgeleide van
   C_b naar pH (Van Slyke 1922). */
function bcNbar(pH,pk){ const h=10**-pH, K=pk.map(p=>10**-p); let t=[1], s=1; for(let j=0;j<K.length;j++){ t.push(t[j]*K[j]/h); } s=t.reduce((a,b)=>a+b,0); return t.reduce((a,v,j)=>a+j*v,0)/s; }
const bcCb=(pH,pk,C)=>C*bcNbar(pH,pk)+10**(pH-14)-10**-pH;
const bcBeta=(pH,pk,C)=>(bcCb(pH+1e-4,pk,C)-bcCb(pH-1e-4,pk,C))/2e-4;

/* alles hierboven ook als globale naam, live (zie src/lib/global.js) */
live({
  bcNbar: [() => bcNbar, v => { bcNbar = v; }],
  bcCb: () => bcCb,
  bcBeta: () => bcBeta
});
