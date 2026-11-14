/* ================= MPN ================= */
ET('mp-tbl',[{h:'Monster per buis',t:'num',w:90},{h:'Buizen',t:'num',w:64},{h:'Positief',t:'num',w:64}],[[0.1,3,3],[0.01,3,1],[0.001,3,0]],'mpn');
calc.mpn=function(){ const u=$('#mp-u').value, out=$('#mp-out'), D=etGet('mp-tbl').map(r=>({m:num(r[0]),n:Math.round(num(r[1])),p:Math.round(num(r[2]))})).filter(d=>d.m>0&&d.n>0&&d.p>=0&&d.p<=d.n);
  if(!D.length){ out.innerHTML=note('info','Vul per verdunning de hoeveelheid monster per buis, het aantal buizen en het aantal positieve buizen in.'); return; }
  const code=D.map(d=>d.p).join('-');
  if(D.every(d=>d.p===0)){ const mt=D.reduce((s,d)=>s+d.n*d.m,0); out.innerHTML=`<div class="lbl">MPN (${code})</div><div class="big">&lt; ${sig(-Math.log(0.05)/mt,2)} <small>per ${u}</small></div>`+note('info','Geen positieve buizen: dit is de bovengrens (95%) bij nul positieven.'); return; }
  if(D.every(d=>d.p===d.n)){ out.innerHTML=`<div class="lbl">MPN (${code})</div><div class="big">te hoog</div>`+note('warn','Alle buizen positief: het aantal is groter dan de reeks kan meten. Verdun verder.'); return; }
  const g=l=>D.reduce((s,d)=>s+d.p*d.m*Math.exp(-l*d.m)/(1-Math.exp(-l*d.m))-(d.n-d.p)*d.m,0);
  let lo=1e-9, hi=1e12; for(let i=0;i<200;i++){ const mid=Math.sqrt(lo*hi); if(g(mid)>0) lo=mid; else hi=mid; } const lam=Math.sqrt(lo*hi);
  const I=D.reduce((s,d)=>{ const e=Math.exp(-lam*d.m); return s+d.n*d.m*d.m*e/(1-e); },0), se=1/(lam*Math.sqrt(I)), cl=[lam*Math.exp(-1.96*se),lam*Math.exp(1.96*se)];
  out.innerHTML=`<div class="lbl">MPN (${code})</div><div class="big">${sig(lam,2)} <small>per ${u}</small></div>`+kv([['95%-interval',`${sig(cl[0],2)} – ${sig(cl[1],2)} per ${u}`],['log₁₀ MPN',fmt(Math.log10(lam),2)],['Buizen totaal',D.reduce((s,d)=>s+d.n,0)]])+`<div class="formula">Σ p·m·e<sup>−λm</sup>/(1 − e<sup>−λm</sup>) = Σ (n − p)·m</div>`; };
