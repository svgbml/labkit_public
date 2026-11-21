/* Letterlijk overgenomen uit tools/nt/32_munc.js (S269): een classic script dat als module in de bundel staat
   en zijn namen live op window zet, zodat de andere code ze als globale namen blijft lezen. */
import {live} from '../../lib/global.js';

/* ================= MEETONZEKERHEID =================
   De velden, de tabel en de uitkomst staan in src/tools/Munc.vue; hier blijft het rekenwerk:
   muncCalc() zet elke bron om naar een relatieve standaardonzekerheid, combineert ze en rekent
   het aandeel per bron uit. MUT (de soorten onzekerheid) blijft hier staan, want de
   validatie zet er rijen mee in de tabel. */
const MUT=['standaard (u)','tolerantie, rechthoekig (±a)','tolerantie, driehoekig (±a)','relatief (%)'];
function muncCalc(res,k,rows){
  const R=rows.map(r=>{ const v=num(r[1]), a=num(r[2]), t=MUT.indexOf(r[3]); let u=NaN, rel=NaN; if(t===3){ rel=a/100; } else { u=t===1?a/Math.sqrt(3):t===2?a/Math.sqrt(6):a; rel=Math.abs(u/v); } return {n:r[0]||'?',v,a,t,u,rel}; }).filter(r=>isFinite(r.rel));
  if(!R.length) return null;
  const ss=R.reduce((s,r)=>s+r.rel*r.rel,0), urel=Math.sqrt(ss), uc=isFinite(res)?urel*Math.abs(res):NaN, U=k*uc;
  R.forEach(r=>r.c=r.rel*r.rel/ss); const top=R.reduce((a,b)=>b.c>a.c?b:a);
  return {R,ss,urel,uc,U,top,k}; }

/* alles hierboven ook als globale naam, live (zie src/lib/global.js) */
live({
  MUT: () => MUT,
  muncCalc: [() => muncCalc, v => { muncCalc = v; }]
});
