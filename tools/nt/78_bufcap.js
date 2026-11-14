/* ================= BUFFERCAPACITEIT ================= */
$('#bc-pre').addEventListener('change',e=>{ if(e.target.value){ $('#bc-pka').value=e.target.value; $('#bc-pka').dispatchEvent(new Event('input',{bubbles:true})); } });
function bcNbar(pH,pk){ const h=10**-pH, K=pk.map(p=>10**-p); let t=[1], s=1; for(let j=0;j<K.length;j++){ t.push(t[j]*K[j]/h); } s=t.reduce((a,b)=>a+b,0); return t.reduce((a,v,j)=>a+j*v,0)/s; }
const bcCb=(pH,pk,C)=>C*bcNbar(pH,pk)+10**(pH-14)-10**-pH;
const bcBeta=(pH,pk,C)=>(bcCb(pH+1e-4,pk,C)-bcCb(pH-1e-4,pk,C))/2e-4;
calc.bufcap=function(){ const pk=$('#bc-pka').value.trim().split(/[\s;]+/).map(v=>num(v)).filter(v=>isFinite(v)&&v>-2&&v<16).sort((a,b)=>a-b), C=num($('#bc-c').value)/1000, ph=num($('#bc-ph').value), pt=num($('#bc-pt').value), V=num($('#bc-v').value), cs=num($('#bc-cs').value), out=$('#bc-out'), cv=$('#bc-cv');
  if(!pk.length||!(C>=0)||!(ph>=0&&ph<=14)){ out.innerHTML=note('info','Vul minstens één pKₐ, de bufferconcentratie en een pH tussen 0 en 14 in.'); cv.style.display='none'; return; }
  const b=bcBeta(ph,pk,C); let h=`<div class="lbl">Buffercapaciteit bij pH ${fmt(ph,2)}</div><div class="big">${sig(b*1000,3)} <small>mM per pH-eenheid</small></div>`;
  const near=pk.reduce((a,p)=>Math.abs(p-ph)<Math.abs(a-ph)?p:a); h+=kv([['Dichtstbijzijnde pKₐ',fmt(near,2)],['Maximale β (bij pH ≈ pKₐ)',sig(bcBeta(near,pk,C)*1000,3)+' mM/pH']]);
  if(pt>=0&&pt<=14&&V>0){ const dn=(bcCb(pt,pk,C)-bcCb(ph,pk,C))*V/1000, base=dn>=0; h+=kv([[base?'Sterke base nodig':'Sterk zuur nodig',`${sig(Math.abs(dn)*1000,3)} mmol`],[`Volume ${base?'NaOH':'HCl'} (${fmt(cs,2)} M)`,cs>0?vol(Math.abs(dn)/cs*1e6):'–']]); if(Math.abs(pt-near)>1) h+=note('warn',`De gewenste pH ligt meer dan één eenheid van de dichtstbijzijnde pKₐ (${fmt(near,2)}); de buffer werkt daar slecht.`); }
  out.innerHTML=h+`<div class="formula">β = dC<sub>b</sub>/dpH · bufferbereik ≈ pKₐ ± 1</div>`;
  const ys=[]; for(let x=0;x<=14.0001;x+=0.05) ys.push(bcBeta(x,pk,C)); const ymax=Math.max(...ys.slice(40,241))*1.15||0.01;
  cv.style.display=''; chart(cv,{xmin:2,xmax:12,ymin:0,ymax:ymax*1000,xlabel:'pH',ylabel:'β (mM per pH)',series:[{fn:x=>bcBeta(x,pk,C)*1000,name:'β'},{pts:[[ph,b*1000]],color:'--warn',name:'pH nu'}]}); };
