/* ================= METHODEVALIDATIE ================= */
calc.mval=function(){ const rep=numsC($('#mv-rep').value), b=num($('#mv-b').value), sp=num($('#mv-sp').value), ad=num($('#mv-add').value), X=numsC($('#mv-x').value), Y=numsC($('#mv-y').value), out=$('#mv-out'), cv=$('#mv-cv');
  const cmax=num($('#mv-cvmax').value), rlo=num($('#mv-rlo').value), rhi=num($('#mv-rhi').value), r2min=num($('#mv-r2').value);
  const chip=(ok,t)=>`<span class="chip ${ok?'ok':'bad'}" style="vertical-align:middle;margin-left:6px">${t||(ok?'voldoet':'voldoet niet')}</span>`, rows=[]; let pass=0, tot=0;
  if(rep.length>=2){ const c=sd(rep)/mean(rep)*100, ok=!(c>cmax); tot++; pass+=ok; rows.push(['Herhaalbaarheid (CV)',`${fmt(c,2)}% (x̄ = ${sig(mean(rep),4)}, s = ${sig(sd(rep),3)}, n = ${rep.length})`+(isFinite(cmax)?chip(ok):'')]); }
  if([b,sp,ad].every(isFinite)&&ad!==0){ const r=(sp-b)/ad*100, ok=!(r<rlo||r>rhi); tot++; pass+=ok; rows.push(['Terugvinding',fmt(r,1)+'%'+(isFinite(rlo)&&isFinite(rhi)?chip(ok):'')]); }
  let fit=null;
  if(X.length>=3&&X.length===Y.length){ const L=linreg(X,Y), res=Y.map((y,i)=>y-(L.a+L.b*X[i])), sxy=Math.sqrt(res.reduce((s,r)=>s+r*r,0)/(X.length-2)); fit={...L,sxy,res}; const ok=!(L.r2<r2min); tot++; pass+=ok;
    rows.push(['Lineariteit R²',fmt(L.r2,5)+(isFinite(r2min)?chip(ok):'')],['Helling / intercept',`${sig(L.b,4)} / ${sig(L.a,3)}`],['LOD (3,3·σ/S)',sig(3.3*sxy/Math.abs(L.b),3)],['LOQ (10·σ/S)',sig(10*sxy/Math.abs(L.b),3)]); }
  else if(X.length||Y.length) rows.push(['Lineariteit','vul evenveel concentraties als signalen in (minstens 3)']);
  if(!rows.length){ out.innerHTML=note('info','Vul ten minste één onderdeel in.'); cv.style.display='none'; return; }
  out.innerHTML=`<div class="lbl">Criteria voldaan</div><div class="big">${pass} <small>van ${tot}</small></div>`+kv(rows);
  if(fit){ cv.style.display=''; const xmax=Math.max(...X)*1.05||1, ymin=Math.min(0,...Y), ymax=Math.max(...Y)*1.08; chart(cv,{xmin:0,xmax,ymin,ymax,xlabel:'concentratie',ylabel:'signaal',series:[{fn:x=>fit.a+fit.b*x,name:'regressielijn'},{pts:X.map((x,i)=>[x,Y[i]]),color:'--warn'}]}); } else cv.style.display='none'; };
