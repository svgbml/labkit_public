/* ================= ROC-CURVE =================
   De velden en de uitkomst staan in src/tools/Roc.vue; hier blijft het rekenwerk, waar het
   validatiegeval aan hangt: rocCalc() geeft de AUC met de standaardfout van Hanley & McNeil,
   de ROC-punten, de optimale afkapwaarde (Youden) en de maten bij de gekozen afkapwaarde.
   P en N zijn de waarden al in de gekozen richting (bij "lager = positief" met -1 vermenigvuldigd). */
function rocCalc(P,N,cu,prev,hi){
  const np=P.length, nn=N.length; let U=0; P.forEach(p=>N.forEach(q=>{ U+=p>q?1:p===q?0.5:0; })); const A=U/(np*nn), Q1=A/(2-A), Q2=2*A*A/(1+A), se=Math.sqrt((A*(1-A)+(np-1)*(Q1-A*A)+(nn-1)*(Q2-A*A))/(np*nn));
  const cuts=[...new Set([...P,...N])].sort((a,b)=>b-a), at=c=>({c,se:P.filter(v=>v>=c).length/np,sp:N.filter(v=>v<c).length/nn}), pts=[[0,0],...cuts.map(c=>{ const r=at(c); return [1-r.sp,r.se]; }),[1,1]];
  let best=null; cuts.forEach(c=>{ const r=at(c); r.J=r.se+r.sp-1; if(!best||r.J>best.J) best=r; }); const ch=isFinite(cu)?at(hi?cu:-cu):best, rc=v=>hi?v:-v;
  const ppv=prev>0&&prev<1?ch.se*prev/(ch.se*prev+(1-ch.sp)*(1-prev)):NaN, npv=prev>0&&prev<1?ch.sp*(1-prev)/(ch.sp*(1-prev)+(1-ch.se)*prev):NaN, lrp=ch.sp<1?ch.se/(1-ch.sp):Infinity, lrn=ch.sp>0?(1-ch.se)/ch.sp:NaN;
  return {np,nn,A,se,pts,best,ch,rc,ppv,npv,lrp,lrn}; }
