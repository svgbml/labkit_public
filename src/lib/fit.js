/* ================= GETALLEN EN FITTEN (S267) =================
   Letterlijk overgenomen uit src/shell/index.html: nums, mean, sd, lineaire regressie en de
   Levenberg-Marquardt-fit (lmfit) achter de curvefits. De validatiegevallen in
   tests/validate.py rekenen hiermee, dus niets hiervan herschrijven. */
import {expose} from './global.js';

const nums=t=>String(t).split(/[\s;]+/).map(num).filter(x=>isFinite(x));
const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
const sd=a=>a.length<2?0:Math.sqrt(a.reduce((s,x)=>s+(x-mean(a))**2,0)/(a.length-1));
function linreg(xs,ys){ const n=xs.length, mx=mean(xs), my=mean(ys); let sxy=0,sxx=0,syy=0; for(let i=0;i<n;i++){ sxy+=(xs[i]-mx)*(ys[i]-my); sxx+=(xs[i]-mx)**2; syy+=(ys[i]-my)**2; } const b=sxy/sxx, a=my-b*mx; return {a,b,r2:syy>0?sxy*sxy/(sxx*syy):1}; }
function solveLin(M,v){ const n=v.length, A=M.map((r,i)=>[...r,v[i]]); for(let c=0;c<n;c++){ let p=c; for(let r=c+1;r<n;r++) if(Math.abs(A[r][c])>Math.abs(A[p][c])) p=r; if(Math.abs(A[p][c])<1e-300) return null; [A[c],A[p]]=[A[p],A[c]]; for(let r=0;r<n;r++){ if(r===c) continue; const f=A[r][c]/A[c][c]; for(let k=c;k<=n;k++) A[r][k]-=f*A[c][k]; } } return A.map((r,i)=>r[n]/r[i]); }
function invMat(M){ const n=M.length; const cols=[]; for(let j=0;j<n;j++){ const e=Array(n).fill(0); e[j]=1; const c=solveLin(M,e); if(!c) return null; cols.push(c); } return M.map((_,i)=>cols.map(c=>c[i])); }
/* Levenberg-Marquardt, returns params + standard errors */
function lmfit(f,p0,xs,ys,iters=300){
  let p=p0.slice(), lam=1e-3; const n=xs.length, m=p.length;
  const sse=q=>{ let s=0; for(let i=0;i<n;i++){ const r=ys[i]-f(xs[i],q); s+=r*r; } return s; };
  const jac=q=>xs.map(x=>{ const f0=f(x,q); return q.map((v,j)=>{ const h=Math.abs(v)*1e-6+1e-9; const qq=q.slice(); qq[j]+=h; return (f(x,qq)-f0)/h; }); });
  let cur=sse(p);
  for(let it=0;it<iters;it++){
    const J=jac(p), r=xs.map((x,i)=>ys[i]-f(x,p));
    const A=Array.from({length:m},()=>Array(m).fill(0)), g=Array(m).fill(0);
    for(let i=0;i<n;i++) for(let a=0;a<m;a++){ g[a]+=J[i][a]*r[i]; for(let b=0;b<m;b++) A[a][b]+=J[i][a]*J[i][b]; }
    let ok=false;
    for(let k=0;k<12;k++){ const M=A.map((row,a)=>row.map((v,b)=>a===b?v*(1+lam)+1e-12:v)); const d=solveLin(M,g); if(!d){ lam*=10; continue; } const pn=p.map((v,j)=>v+d[j]); const s=sse(pn); if(isFinite(s)&&s<cur){ const rel=(cur-s)/(cur||1); p=pn; cur=s; lam=Math.max(lam/10,1e-12); ok=true; if(rel<1e-12) it=iters; break; } lam*=10; }
    if(!ok) break;
  }
  const J=jac(p), A=Array.from({length:m},()=>Array(m).fill(0)); for(let i=0;i<n;i++) for(let a=0;a<m;a++) for(let b=0;b<m;b++) A[a][b]+=J[i][a]*J[i][b];
  const cov=invMat(A), s2=n>m?cur/(n-m):NaN; const se=cov?cov.map((r,i)=>Math.sqrt(Math.abs(r[i])*s2)):p.map(()=>NaN);
  return {p,se,sse:cur};
}

expose({nums, mean, sd, linreg, solveLin, invMat, lmfit});
