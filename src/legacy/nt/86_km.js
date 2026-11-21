/* Letterlijk overgenomen uit tools/nt/86_km.js (S269): een classic script dat als module in de bundel staat
   en zijn namen live op window zet, zodat de andere code ze als globale namen blijft lezen. */
import {live} from '../../lib/global.js';

/* ================= KAPLAN-MEIER =================
   De velden en de uitkomst staan in src/tools/Km.vue; hier blijven het rekenwerk, waar het
   validatiegeval aan hangt: kmFit() geeft de Kaplan-Meier-stappen met het 95%-interval
   (Greenwood, log(-log)) en de mediaan, kmLogrank() de log-ranktoets over k groepen. */
function kmFit(R){ const T=[...new Set(R.filter(r=>r.e).map(r=>r.t))].sort((a,b)=>a-b); let S=1, v=0; const steps=[];
  T.forEach(t=>{ const n=R.filter(r=>r.t>=t).length, d=R.filter(r=>r.t===t&&r.e).length; if(!n) return; S*=1-d/n; if(n>d) v+=d/(n*(n-d)); let lo=NaN, hi=NaN; if(S>0&&S<1){ const se=Math.sqrt(v)/Math.abs(Math.log(S)), c=Math.log(-Math.log(S)); lo=Math.exp(-Math.exp(c+1.96*se)); hi=Math.exp(-Math.exp(c-1.96*se)); } steps.push({t,n,d,S,lo,hi}); });
  const med=steps.find(s=>s.S<=0.5+1e-12); return {steps,med:med?med.t:NaN}; }
function kmLogrank(R,G){ const T=[...new Set(R.filter(r=>r.e&&G.includes(r.g)).map(r=>r.t))].sort((a,b)=>a-b), k=G.length, O=Array(k).fill(0), E=Array(k).fill(0), V=Array.from({length:k},()=>Array(k).fill(0));
  T.forEach(t=>{ const n=G.map(g=>R.filter(r=>r.g===g&&r.t>=t).length), d=G.map(g=>R.filter(r=>r.g===g&&r.t===t&&r.e).length), N=n.reduce((a,b)=>a+b,0), D=d.reduce((a,b)=>a+b,0); if(N<2) return; for(let i=0;i<k;i++){ O[i]+=d[i]; E[i]+=D*n[i]/N; for(let j=0;j<k;j++) V[i][j]+=D*(N-D)/(N-1)*(n[i]/N)*((i===j?1:0)-n[j]/N); } });
    const m=k-1, x=O.slice(0,m).map((o,i)=>o-E[i]), Vm=V.slice(0,m).map(r=>r.slice(0,m)); let chi=NaN; try{ const Vi=invMat(Vm); chi=x.reduce((s,xi,i)=>s+xi*x.reduce((t,xj,j)=>t+Vi[i][j]*xj,0),0); }catch(e){}
  const p=isFinite(chi)?1-chicdf(chi,m):NaN; return {O,E,m,chi,p}; }

/* alles hierboven ook als globale naam, live (zie src/lib/global.js) */
live({
  kmFit: [() => kmFit, v => { kmFit = v; }],
  kmLogrank: [() => kmLogrank, v => { kmLogrank = v; }]
});
