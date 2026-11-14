/* ================= TITRATIECURVE ================= */
$('#ti-pre').addEventListener('change',e=>{ if(e.target.value){ $('#ti-pka').value=e.target.value; $('#ti-type').value=/9,25|8,07/.test(e.target.value)?'base':'acid'; ['ti-pka','ti-type'].forEach(id=>$('#'+id).dispatchEvent(new Event('change',{bubbles:true}))); calc.titr(); } });
function titrPH(pka,acid,Ca,Va,Cb,Vb){ const n=pka.length, Ka=pka.map(p=>Math.pow(10,-p)), V=Va+Vb, C=Ca*Va/V, T=Cb*Vb/V, q0=acid?0:n;
  const bal=lh=>{ const h=Math.pow(10,lh); const t=[]; for(let j=0;j<=n;j++){ let v=Math.pow(h,j); for(let i=0;i<n-j;i++) v*=Ka[i]; t.push(v); } const s=t.reduce((a,b)=>a+b,0); let q=0; for(let j=0;j<=n;j++) q+=t[j]/s*(q0-n+j); return h-1e-14/h+(acid?T:-T)+C*q; };
  let lo=-14.5, hi=1; for(let i=0;i<80;i++){ const m=(lo+hi)/2; if(bal(m)>0) hi=m; else lo=m; } return -(lo+hi)/2; }
calc.titr=function(){ const pka=numsC($('#ti-pka').value).sort((a,b)=>a-b), acid=$('#ti-type').value==='acid', Ca=num($('#ti-ca').value), Va=num($('#ti-va').value), Cb=num($('#ti-cb').value), out=$('#ti-out'), cv=$('#ti-cv');
  if(!pka.length||!(Ca>0&&Va>0&&Cb>0)){ out.innerHTML=note('info','Vul pKₐ, concentraties en volume in.'); cv.style.display='none'; return; }
  const n=pka.length, Ve=Ca*Va/Cb, ve=Array.from({length:n},(_,k)=>(k+1)*Ve), vmax=ve[n-1]*1.6, pH=v=>titrPH(pka,acid,Ca,Va,Cb,v);
  const rows=[['Start',0,pH(0)],...ve.flatMap((v,k)=>[[`½ equivalentie ${n>1?k+1:''}`.trim(),v-Ve/2,pH(v-Ve/2)],[`Equivalentiepunt ${n>1?k+1:''}`.trim(),v,pH(v)]])];
  out.innerHTML=`<div class="lbl">pH bij ${n>1?'eerste ':''}equivalentiepunt</div><div class="big">${fmt(pH(ve[0]),2)}</div>`+`<div class="tbl-wrap" style="margin-top:12px"><table class="mini"><thead><tr><th>Punt</th><th class="num">Volume titrant (mL)</th><th class="num">pH</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r[0]}</td><td class="num">${fmt(r[1],2)}</td><td class="num">${fmt(r[2],2)}</td></tr>`).join('')}</tbody></table></div>`+
   (pka.some(p=>p<0||p>14)?note('info','Een pKₐ buiten 0–14 gedraagt zich als sterk zuur of sterke base.'):'');
  cv.style.display=''; chart(cv,{xmin:0,xmax:vmax,ymin:0,ymax:14,xlabel:`volume ${acid?'NaOH':'HCl'} (mL)`,ylabel:'pH',series:[{fn:pH,name:'titratiecurve'},{pts:ve.map(v=>[v,pH(v)]),color:'--warn',r:5}]}); };
