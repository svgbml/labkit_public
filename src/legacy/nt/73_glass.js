/* Letterlijk overgenomen uit tools/nt/73_glass.js (S269): een classic script dat als module in de bundel staat
   en zijn namen live op window zet, zodat de andere code ze als globale namen blijft lezen. */
import {live} from '../../lib/global.js';

/* ================= GLASVERGELIJKING =================
   De velden, de grafiek en de uitkomst staan in src/tools/Glass.vue; hier blijft de
   opmaakhulp: glF() zet een getal met d decimalen neer met een komma ('–' als het geen getal is). */
const glF=(v,d=5)=>isFinite(v)?v.toFixed(d).replace('.',','):'–';

/* alles hierboven ook als globale naam, live (zie src/lib/global.js) */
live({
  glF: () => glF
});
