/* Letterlijk overgenomen uit tools/nt/33_mval.js (S269): een classic script dat als module in de bundel staat
   en zijn namen live op window zet, zodat de andere code ze als globale namen blijft lezen. */
import {live} from '../../lib/global.js';

/* ================= METHODEVALIDATIE =================
   De velden en de uitkomst staan in src/tools/Mval.vue; hier blijft het rekenwerk: mvalCalc()
   rekent de herhaalbaarheid (CV), de terugvinding en de lineariteit met LOD en LOQ uit en
   toetst ze aan de acceptatiecriteria. */
function mvalCalc(rep,b,sp,ad,X,Y,cmax,rlo,rhi,r2min){
  let pass=0, tot=0, repR=null, recR=null, fit=null;
  if(rep.length>=2){ const c=sd(rep)/mean(rep)*100, ok=!(c>cmax); tot++; pass+=ok; repR={c,ok,m:mean(rep),s:sd(rep),n:rep.length,chip:isFinite(cmax)}; }
  if([b,sp,ad].every(isFinite)&&ad!==0){ const r=(sp-b)/ad*100, ok=!(r<rlo||r>rhi); tot++; pass+=ok; recR={r,ok,chip:isFinite(rlo)&&isFinite(rhi)}; }
  if(X.length>=3&&X.length===Y.length){ const L=linreg(X,Y), res=Y.map((y,i)=>y-(L.a+L.b*X[i])), sxy=Math.sqrt(res.reduce((s,r)=>s+r*r,0)/(X.length-2)); fit={...L,sxy,res}; const ok=!(L.r2<r2min); tot++; pass+=ok;
    fit.ok=ok; fit.chip=isFinite(r2min); fit.lod=3.3*sxy/Math.abs(L.b); fit.loq=10*sxy/Math.abs(L.b); }
  return {pass,tot,rep:repR,rec:recR,fit,badLin:!fit&&!!(X.length||Y.length)}; }

/* alles hierboven ook als globale naam, live (zie src/lib/global.js) */
live({
  mvalCalc: [() => mvalCalc, v => { mvalCalc = v; }]
});
