/* ================= WESTGARD / LEVEY-JENNINGS ================= */
calc.westgard=function(){ const xs=numsC($('#wg-x').value), out=$('#wg-out'), cv=$('#wg-cv'); let m=num($('#wg-m').value), s=num($('#wg-s').value);
  if($('#wg-est').checked&&xs.length>=2){ const b=xs.slice(0,20); m=mean(b); s=sd(b); }
  if(!xs.length||!isFinite(m)||!(s>0)){ out.innerHTML=note('info','Vul streefwaarde, SD en metingen in.'); cv.style.display='none'; return; } cv.style.display='';
  const z=xs.map(x=>(x-m)/s), V=xs.map(()=>[]), add=(i,r)=>{ if(!V[i].includes(r)) V[i].push(r); };
  z.forEach((v,i)=>{ if(Math.abs(v)>3) add(i,'1₃ₛ'); else if(Math.abs(v)>2) add(i,'1₂ₛ');
    if(i>=1&&((z[i]>2&&z[i-1]>2)||(z[i]<-2&&z[i-1]<-2))){ add(i,'2₂ₛ'); add(i-1,'2₂ₛ'); }
    if(i>=1&&((z[i]>2&&z[i-1]<-2)||(z[i]<-2&&z[i-1]>2))){ add(i,'R₄ₛ'); add(i-1,'R₄ₛ'); }
    if(i>=3){ const w=z.slice(i-3,i+1); if(w.every(v=>v>1)||w.every(v=>v<-1)) for(let k=i-3;k<=i;k++) add(k,'4₁ₛ'); }
    if(i>=9){ const w=z.slice(i-9,i+1); if(w.every(v=>v>0)||w.every(v=>v<0)) for(let k=i-9;k<=i;k++) add(k,'10ₓ'); } });
  const rej=V.map(v=>v.some(r=>r!=='1₂ₛ')), warnOnly=V.map((v,i)=>!rej[i]&&v.length>0), nRej=rej.filter(Boolean).length;
  const lo=Math.min(m-3.5*s,...xs), hi=Math.max(m+3.5*s,...xs);
  const C=chart(cv,{xmin:0.5,xmax:xs.length+0.5,ymin:lo,ymax:hi,xlabel:'meting',ylabel:'waarde',series:[{fn:()=>m,color:'--ink'},...[1,2,3].flatMap(k=>[{fn:()=>m+k*s,color:k===3?'--bad':k===2?'--warn':'--line',dash:[5,4]},{fn:()=>m-k*s,color:k===3?'--bad':k===2?'--warn':'--line',dash:[5,4]}]),{pts:xs.map((x,i)=>[i+1,x]).filter((p,i)=>!rej[i]&&!warnOnly[i]),color:'--accent'},{pts:xs.map((x,i)=>[i+1,x]).filter((p,i)=>warnOnly[i]),color:'--warn',r:4.5},{pts:xs.map((x,i)=>[i+1,x]).filter((p,i)=>rej[i]),color:'--bad',r:5}]});
  const ctx=cv.getContext('2d'); ctx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--muted'); ctx.lineWidth=1; ctx.beginPath(); xs.forEach((x,i)=>{ i?ctx.lineTo(C.X(i+1),C.Y(x)):ctx.moveTo(C.X(i+1),C.Y(x)); }); ctx.stroke();
  const rows=xs.map((x,i)=>[i+1,x,z[i],V[i]]).filter(r=>r[3].length);
  out.innerHTML=`<div class="lbl">Afgekeurde metingen</div><div class="big">${nRej} <small>van ${xs.length}</small></div>`+kv([['Streefwaarde ± SD',`${sig(m,4)} ± ${sig(s,3)}`],['Waarschuwingen (alleen 1₂ₛ)',warnOnly.filter(Boolean).length],['CV',fmt(s/m*100,1)+'%']])+
   (rows.length?`<div class="tbl-wrap" style="margin-top:12px"><table class="mini"><thead><tr><th class="num">#</th><th class="num">Waarde</th><th class="num">z</th><th>Regels</th></tr></thead><tbody>${rows.map(r=>`<tr><td class="num">${r[0]}</td><td class="num">${sig(r[1],4)}</td><td class="num">${fmt(r[2],2)}</td><td>${r[3].map(t=>`<span class="chip ${t==='1₂ₛ'?'warn':'bad'}" style="margin-right:3px">${t}</span>`).join('')}</td></tr>`).join('')}</tbody></table></div>`:note('ok','Geen overtredingen van de Westgard-regels.'))+
   `<div class="formula">z = (x − x̄) / s · 1₃ₛ: |z| &gt; 3 · 2₂ₛ: 2× z &gt; 2 aan dezelfde kant · R₄ₛ: verschil &gt; 4s · 4₁ₛ: 4× |z| &gt; 1 zelfde kant · 10ₓ: 10× zelfde kant van het gemiddelde</div>`; };
