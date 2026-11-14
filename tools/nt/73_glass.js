/* ================= GLASVERGELIJKING ================= */
const glF=(v,d=5)=>isFinite(v)?v.toFixed(d).replace('.',','):'–';
calc.glass=function(){ const K=numsC($('#gl-k').value), R=numsC($('#gl-r').value), crit=$('#gl-crit').value, smin=num($('#gl-smin').value)||0, a=num($('#gl-a').value)||0.01, out=$('#gl-out'), cv=$('#gl-cv');
  if(K.length<2||!R.length){ out.innerHTML=note('info','Vul minstens twee metingen van het bekende glas en één gevonden fragment in.'); cv.style.display='none'; return; }
  const mk=mean(K), sk=sd(K), s=Math.max(sk,smin), mr=mean(R), sr=R.length>1?sd(R):NaN;
  const lo=crit==='r'?Math.min(...K):mk-(+crit)*s, hi=crit==='r'?Math.max(...K):mk+(+crit)*s, inn=R.map(v=>v>=lo-1e-12&&v<=hi+1e-12);
  let wt=''; if(R.length>1){ const v1=Math.max(sk,smin)**2/K.length, v2=Math.max(sr,smin)**2/R.length, t=(mr-mk)/Math.sqrt(v1+v2), df=(v1+v2)**2/(v1*v1/(K.length-1)+v2*v2/(R.length-1)), p=2*(1-tcdf(Math.abs(t),df));
    wt=kv([['t (Welch)',fmt(t,3)],['Vrijheidsgraden',fmt(df,1)],['p',p<0.001?'&lt; 0,001':fmt(p,3)],['Groep',p<a?`<span class="chip bad" style="vertical-align:middle">verschillend</span>`:`<span class="chip ok" style="vertical-align:middle">niet te onderscheiden</span>`]]); }
  const nin=inn.filter(Boolean).length;
  out.innerHTML=`<div class="lbl">Binnen het interval</div><div class="big">${nin} <small>van ${R.length} fragmenten</small></div>`+kv([['Bekend: gemiddelde ± s',`${glF(mk)} ± ${glF(sk)} (n = ${K.length})`],['Vergelijkingsinterval',`${glF(lo)} – ${glF(hi)}`],['Gevonden: gemiddelde',R.length>1?`${glF(mr)} ± ${glF(sr)} (n = ${R.length})`:glF(mr)]])+(sk<smin?note('info','De s van het bekende glas is kleiner dan de meetprecisie; de minimale s is gebruikt.'):'')+wt+
   `<div class="tbl-wrap" style="margin-top:12px"><table class="mini"><thead><tr><th>Fragment</th><th class="num">n<sub>D</sub></th><th class="num">Afstand (s)</th><th>Uitkomst</th></tr></thead><tbody>${R.map((v,i)=>`<tr><td>${i+1}</td><td class="num">${glF(v)}</td><td class="num">${fmt((v-mk)/s,1)}</td><td>${inn[i]?'niet te onderscheiden':'verschillend'}</td></tr>`).join('')}</tbody></table></div>`;
  cv.style.display=''; const all=[...K,...R,lo,hi], x0=Math.min(...all), x1=Math.max(...all), pad=(x1-x0)*0.12||1e-4, W=480, H=150;
  pShow(cv,W,H,(x)=>{ const L=80, X=v=>L+(v-(x0-pad))/((x1+pad)-(x0-pad))*(W-L-20); x.font='12px '+PFONT(); x.textBaseline='middle';
    x.fillStyle='rgba(120,160,220,.18)'; x.fillRect(X(lo),20,X(hi)-X(lo),80); x.strokeStyle=PCOL.acc; x.setLineDash([4,3]); [lo,hi].forEach(v=>{ x.beginPath(); x.moveTo(X(v),18); x.lineTo(X(v),102); x.stroke(); }); x.setLineDash([]);
    x.fillStyle=PCOL.ink; x.textAlign='right'; x.fillText('bekend',L-10,42); x.fillText('gevonden',L-10,80);
    K.forEach(v=>{ x.fillStyle=PCOL.acc; x.beginPath(); x.arc(X(v),42,4,0,7); x.fill(); }); R.forEach((v,i)=>{ x.fillStyle=inn[i]?PCOL.ink:PCOL.bad||'#b0271f'; x.beginPath(); x.arc(X(v),80,4.5,0,7); x.fill(); });
    const st=niceStep(x1-x0+2*pad,5); x.fillStyle=PCOL.muted; x.textAlign='center'; for(let t=Math.ceil((x0-pad)/st)*st,k=0;t<=x1+pad&&k<12;t+=st,k++) x.fillText(glF(t,4),X(t),H-30); x.fillText('brekingsindex n_D',(W+L)/2,H-10); }); };
