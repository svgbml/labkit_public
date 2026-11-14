/* ================= HARDY-WEINBERG & FORENSISCHE KENGETALLEN ================= */
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
calc.hwe=function(){ const out=$('#hw-out'), loc=$('#hw-loc').value;
  const G=$('#hw-g').value.split(/\n/).map(l=>{ const t=l.trim().split(/[\s\/;\t]+/).filter(Boolean).map(x=>x.replace(',','.')); if(t.length<2) return null; const c=t.length>2?Math.round(num(t[2])):1; if(!(c>0)) return null; return [t[0],t[1],Math.min(c,1e5)]; }).filter(Boolean);
  const n=G.reduce((s,g)=>s+g[2],0); if(n<2){ out.innerHTML=note('info','Vul genotypen van minstens twee personen in.'); return; } if(n>20000){ out.innerHTML=note('warn','Maximaal 20 000 personen.'); return; }
  const S=hwStats(G), k=S.A.length, p=hwExact(S);
  let chi=0, df=k*(k-1)/2, small=0; for(let i=0;i<k;i++) for(let j=i;j<k;j++){ const key=S.A[i]+'/'+S.A[j], e=(i===j?S.p[i]*S.p[i]:2*S.p[i]*S.p[j])*n, o=S.gc[key]||0; if(e<5) small++; if(e>0) chi+=(o-e)**2/e; } const pchi=df>0?1-chicdf(chi,df):NaN;
  out.innerHTML=`<div class="lbl">${ud(loc)} · exacte HWE-toets</div><div class="big">p ${isFinite(p)?(p<0.001?'&lt; 0,001':'= '+fmt(p,3)):'–'}</div>`+kv([['Personen / allelen',`${n} / ${k}`],['H<sub>o</sub> (geobserveerd)',fmt(S.Ho,3)],['H<sub>e</sub> (verwacht)',fmt(S.He,3)],['χ² (ter vergelijking)',isFinite(pchi)?`${fmt(chi,2)}, df = ${df}, p ${pchi<0.001?'&lt; 0,001':'= '+fmt(pchi,3)}`:'–'],['Matchkans PM',fmt(S.PM,4)],['Discriminatiekracht PD',fmt(S.PD,4)],['PIC',fmt(S.pic,4)],['Uitsluitingskans PE',fmt(S.PE,4)],['Typische vaderschapsindex TPI',isFinite(S.TPI)?fmt(S.TPI,2):'–']])+
   (p<0.05?note('warn','Afwijking van Hardy-Weinberg (p &lt; 0,05). Controleer typefouten, null-allelen, substructuur of een kleine steekproef. Bij meerdere loci: corrigeer voor meervoudig toetsen.'):'')+(small?note('info',`${small} genotypeklassen hebben een verwachte frequentie onder 5; de χ²-toets is dan onbetrouwbaar, gebruik de exacte toets.`):'')+
   `<div class="tbl-wrap" style="margin-top:12px"><table class="mini"><thead><tr><th>Allel</th><th class="num">Aantal</th><th class="num">Frequentie</th></tr></thead><tbody>${S.A.map((a,i)=>`<tr><td>${ud(a)}</td><td class="num">${S.al[a]}</td><td class="num">${fmt(S.p[i],4)}</td></tr>`).join('')}</tbody></table></div><div class="formula">PD = 1 − Σ G<sub>i</sub>² · PE = h²(1 − 2hH²) · TPI = 1/(2H)</div>`; };
