/* ================= ENTOMOLOGIE (GRAADDAGEN) =================
   De velden, de curve en de uitkomst staan in src/tools/Ento.vue; hier blijft de dagfunctie:
   enDay() geeft de graaddagen van één dag uit minimum en maximum (of één daggemiddelde). */
function enDay(lo,hi,base,meth){ if(hi==null) return Math.max(0,lo-base); if(meth==='trunc'){ lo=Math.max(lo,base); hi=Math.max(hi,base); } return Math.max(0,(lo+hi)/2-base); }
