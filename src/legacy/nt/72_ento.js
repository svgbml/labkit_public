/* Letterlijk overgenomen uit tools/nt/72_ento.js (S269): een classic script dat als module in de bundel staat
   en zijn namen live op window zet, zodat de andere code ze als globale namen blijft lezen. */
import {live} from '../../lib/global.js';

/* ================= ENTOMOLOGIE (GRAADDAGEN) =================
   De velden, de curve en de uitkomst staan in src/tools/Ento.vue; hier blijft de dagfunctie:
   enDay() geeft de graaddagen van één dag uit minimum en maximum (of één daggemiddelde). */
function enDay(lo,hi,base,meth){ if(hi==null) return Math.max(0,lo-base); if(meth==='trunc'){ lo=Math.max(lo,base); hi=Math.max(hi,base); } return Math.max(0,(lo+hi)/2-base); }

/* alles hierboven ook als globale naam, live (zie src/lib/global.js) */
live({
  enDay: [() => enDay, v => { enDay = v; }]
});
