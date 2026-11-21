/* ================= BLAND-ALTMAN =================
   De velden en de uitkomst staan in src/tools/Bland.vue; hier blijft het rekenwerk, waar het
   validatiegeval aan hangt: blandPairs() leest de paren (gemiddelde, verschil) uit de tekst en
   blandCalc() geeft de bias, de grenzen van overeenstemming met hun 95%-interval en de
   regressie van het verschil op het gemiddelde. */
function blandPairs(txt,pct){
  return txt.split(/\n/).map(l=>l.trim().split(/[\s;\t]+/).map(num)).filter(r=>r.length>=2&&isFinite(r[0])&&isFinite(r[1])).map(([a,b])=>{ const m=(a+b)/2; return [m,pct?(m!==0?(b-a)/m*100:NaN):b-a]; }).filter(p=>isFinite(p[1])); }
function blandCalc(P){
  const n=P.length, d=P.map(p=>p[1]), m=P.map(p=>p[0]), b=mean(d), s=sd(d), t=tinv(0.975,n-1), lo=b-1.96*s, hi=b+1.96*s, seB=s/Math.sqrt(n), seL=Math.sqrt(3*s*s/n), r=linreg(m,d);
  const mx=mean(m), sxx=m.reduce((a,v)=>a+(v-mx)**2,0), res=d.reduce((a,v,i)=>a+(v-(r.a+r.b*m[i]))**2,0), seb=Math.sqrt(res/(n-2)/sxx), tb=r.b/seb, pb=2*(1-tcdf(Math.abs(tb),n-2));
  const p0=2*(1-tcdf(Math.abs(b/seB),n-1));
  return {n,d,m,b,s,t,lo,hi,seB,seL,r,pb,p0}; }
