/* ================= TIJD SINDS OVERLIJDEN (HENSSGE) ================= */
calc.pmi=function(){ const Tr=num($('#pm-tr').value), Ta=num($('#pm-ta').value), W=num($('#pm-w').value), CF=num($('#pm-cf').value), out=$('#pm-out'), cv=$('#pm-cv');
  if(![Tr,Ta,W,CF].every(isFinite)||W<=0||CF<=0){ out.innerHTML=note('info','Vul rectale temperatuur, omgevingstemperatuur, gewicht en correctiefactor in.'); cv.style.display='none'; return; }
  if(Tr>=37.2||Tr<=Ta){ out.innerHTML=note('bad','De rectale temperatuur moet tussen de omgevingstemperatuur en 37,2 °C liggen; anders is de methode niet toepasbaar.'); cv.style.display='none'; return; }
  const hi=Ta>23.2, B=-1.2815*Math.pow(CF*W,-0.625)+0.0284, Q=t=>hi?1.11*Math.exp(B*t)-0.11*Math.exp(10*B*t):1.25*Math.exp(B*t)-0.25*Math.exp(5*B*t), q=(Tr-Ta)/(37.2-Ta);
  let lo=0, up=200; if(Q(up)>q){ out.innerHTML=note('bad','Buiten het bereik van het model (meer dan 200 uur).'); cv.style.display='none'; return; }
  for(let i=0;i<80;i++){ const m=(lo+up)/2; if(Q(m)>q) lo=m; else up=m; } const t=(lo+up)/2, ci=2.8;
  const hm=v=>{ const h=Math.floor(v), m=Math.round((v-h)*60); return m===60?`${h+1} u 0 min`:`${h} u ${m} min`; };
  let h=`<div class="lbl">Geschat postmortaal interval</div><div class="big">${hm(t)}</div>`+kv([['95%-interval (minimaal)',`${hm(Math.max(0,t-ci))} – ${hm(t+ci)}`],['Formule',hi?'T<sub>a</sub> &gt; 23,2 °C':'T<sub>a</sub> ≤ 23,2 °C'],['B',fmt(B,4)],['Temperatuurquotiënt Q',fmt(q,3)]]);
  const at=$('#pm-at').value; if(at){ const d=new Date(at); if(!isNaN(d)){ const f=v=>new Date(d.getTime()-v*3600e3).toLocaleString(LANG==='en'?'en-GB':'nl-NL',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}); h+=kv([['Geschat tijdstip van overlijden',`<span data-notr="">${f(t)}</span>`],['Tussen',`<span data-notr="">${f(t+ci)} en ${f(Math.max(0,t-ci))}</span>`]]); } }
  if(t>36) h+=note('warn','Na ongeveer anderhalve dag is het verschil met de omgevingstemperatuur klein en wordt de schatting onbetrouwbaar.');
  if(CF!==1) h+=note('info','Met een correctiefactor ongelijk aan 1 is de onzekerheid groter dan het minimale interval.');
  out.innerHTML=h+note('info','Rekenvoorbeeld voor onderwijs; een officiële schatting hoort bij een forensisch arts en combineert meerdere methoden.');
  cv.style.display=''; const tm=Math.max(t*1.6,12);
  chart(cv,{xmin:0,xmax:tm,ymin:Math.min(Ta,Tr)-1,ymax:38,xlabel:'tijd na overlijden (h)',ylabel:'rectale temperatuur (°C)',series:[{fn:x=>Ta+(37.2-Ta)*Q(x),name:'afkoelcurve'},{pts:[[t,Tr]],color:'--warn',r:5},{fn:()=>Ta,dash:[4,4],color:'--muted'}]}); };
