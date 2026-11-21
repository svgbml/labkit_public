/* Letterlijk overgenomen uit tools/nt/70_widmark.js (S269): een classic script dat als module in de bundel staat
   en zijn namen live op window zet, zodat de andere code ze als globale namen blijft lezen. */
import {live} from '../../lib/global.js';

/* ================= BLOEDALCOHOL (WIDMARK) =================
   De velden, de drankentabel, de curve en de uitkomst staan in src/tools/Widmark.vue; hier
   blijven de tijdhulpjes: wdT() leest uu:mm als minuten, wdHM() zet minuten terug als uu:mm. */
const wdT=t=>{ const m=String(t).trim().match(/^(\d{1,2})[:.](\d{2})$/); return m&&+m[1]<24&&+m[2]<60?+m[1]*60+ +m[2]:NaN; };
const wdHM=m=>{ const r=((Math.round(m)%1440)+1440)%1440; return String(Math.floor(r/60)).padStart(2,'0')+':'+String(r%60).padStart(2,'0'); };

/* alles hierboven ook als globale naam, live (zie src/lib/global.js) */
live({
  wdT: () => wdT,
  wdHM: () => wdHM
});
