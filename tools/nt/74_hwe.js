/* ================= HARDY-WEINBERG & FORENSISCHE KENGETALLEN =================
   De velden en de uitkomst staan in src/tools/Hwe.vue; hier blijven hwStats(), de exacte
   toets hwExact() en de vaste toevalsgenerator hwRng(), waar het validatiegeval aan hangt. */
function hwRng(seed){ let a=seed>>>0; return ()=>{ a=(a+0x6D2B79F5)>>>0; let t=a; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; }
function hwStats(G){ const al={}; let n=0; G.forEach(([a,b,c])=>{ n+=c; al[a]=(al[a]||0)+c; al[b]=(al[b]||0)+c; }); const A=Object.keys(al).sort((x,y)=>num(x)-num(y)||x.localeCompare(y)), p=A.map(a=>al[a]/(2*n));
  const gc={}; G.forEach(([a,b,c])=>{ const k=[a,b].sort((x,y)=>num(x)-num(y)||x.localeCompare(y)).join('/'); gc[k]=(gc[k]||0)+c; });
  const het=G.reduce((s,[a,b,c])=>s+(a!==b?c:0),0), Ho=het/n, sp2=p.reduce((s,x)=>s+x*x,0), He=2*n/(2*n-1)*(1-sp2);
  let pic=1-sp2; for(let i=0;i<p.length;i++) for(let j=i+1;j<p.length;j++) pic-=2*p[i]*p[i]*p[j]*p[j];
  const PM=Object.values(gc).reduce((s,c)=>s+(c/n)**2,0), H=1-Ho, PE=Ho*Ho*(1-2*Ho*H*H), TPI=H>0?1/(2*H):Infinity;
  return {n,A,al,p,gc,het,Ho,He,PM,PD:1-PM,pic,PE,TPI}; }
function hwExact(S,iters=10000){ const pool=[]; S.A.forEach(a=>{ for(let k=0;k<S.al[a];k++) pool.push(a); }); const n=S.n; if(n<2) return NaN;
  const lf=k=>gammaln(k+1), score=gc=>{ let h=0, s=0; for(const k in gc){ const [a,b]=k.split('/'); if(a!==b) h+=gc[k]; s+=lf(gc[k]); } return h*Math.LN2-s; };
  const obs=score(S.gc), rnd=hwRng(1); let le=0; const idx=Object.fromEntries(S.A.map((a,i)=>[a,i])), P=pool.map(a=>idx[a]);
  for(let it=0;it<iters;it++){ for(let i=P.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); const t=P[i]; P[i]=P[j]; P[j]=t; } const gc={}; for(let i=0;i<P.length;i+=2){ const a=Math.min(P[i],P[i+1]), b=Math.max(P[i],P[i+1]), k=a+'/'+b; gc[k]=(gc[k]||0)+1; } if(score(gc)<=obs+1e-9) le++; }
  return le/iters; }
