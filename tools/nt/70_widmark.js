/* ================= BLOEDALCOHOL (WIDMARK) =================
   De velden, de drankentabel, de curve en de uitkomst staan in src/tools/Widmark.vue; hier
   blijven de tijdhulpjes: wdT() leest uu:mm als minuten, wdHM() zet minuten terug als uu:mm. */
const wdT=t=>{ const m=String(t).trim().match(/^(\d{1,2})[:.](\d{2})$/); return m&&+m[1]<24&&+m[2]<60?+m[1]*60+ +m[2]:NaN; };
const wdHM=m=>{ const r=((Math.round(m)%1440)+1440)%1440; return String(Math.floor(r/60)).padStart(2,'0')+':'+String(r%60).padStart(2,'0'); };
