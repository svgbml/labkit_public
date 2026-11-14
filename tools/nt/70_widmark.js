/* ================= BLOEDALCOHOL (WIDMARK) ================= */
ET('wd-tbl',[{h:'Drank',t:'txt',w:120},{h:'Volume (mL)',t:'num',w:80},{h:'Alcohol (% vol)',t:'num',w:80},{h:'Tijdstip',t:'txt',w:70}],[['Bier',330,5,'20:00'],['Bier',330,5,'20:45'],['Wijn',150,12,'21:30'],['Bier',330,5,'22:15']],'widmark');
const wdT=t=>{ const m=String(t).trim().match(/^(\d{1,2})[:.](\d{2})$/); return m&&+m[1]<24&&+m[2]<60?+m[1]*60+ +m[2]:NaN; };
const wdHM=m=>{ const r=((Math.round(m)%1440)+1440)%1440; return String(Math.floor(r/60)).padStart(2,'0')+':'+String(r%60).padStart(2,'0'); };
function wdR(){ const sex=$('#wd-sex').value, W=num($('#wd-w').value), L=num($('#wd-h').value), m=$('#wd-rm').value; if(m==='e') return num($('#wd-r').value); if(m==='s') return sex==='m'?0.31608-0.004821*W+0.004632*L:0.31223-0.006446*W+0.004466*L; return sex==='m'?0.68:0.55; }
calc.widmark=function(){ const W=num($('#wd-w').value), r=wdR(), beta=num($('#wd-b').value), out=$('#wd-out'), cv=$('#wd-cv'); $('#wd-r').closest('.f').style.display=$('#wd-rm').value==='e'?'':'none';
  let prev=-Infinity, day=0; const D=etGet('wd-tbl').map(x=>({n:x[0],v:num(x[1]),p:num(x[2]),t:wdT(x[3])})).filter(d=>d.v>0&&d.p>=0&&d.p<=100&&isFinite(d.t)).map(d=>{ let t=d.t+day; if(t<prev){ day+=1440; t+=1440; } prev=t; return {...d,t,g:d.v*d.p/100*0.789}; });
  let h='';
  if(!(W>0)||!(r>0)||!(r<1.2)||!(beta>=0)){ out.innerHTML=note('info','Vul gewicht, een geldige verdelingsfactor r en de afbraaksnelheid in.'); cv.style.display='none'; return; }
  if(D.length){ const t0=D[0].t, A=D.reduce((s,d)=>s+d.g,0); let c=0, peak=0, tp=t0, k=0; const pts=[]; let tend=t0;
    for(let t=t0;t<=t0+3*1440;t++){ while(k<D.length&&D[k].t<=t){ c+=D[k].g/(r*W)*1.055; k++; } if(c>peak){ peak=c; tp=t; } pts.push([(t-t0)/60,c]); if(k>=D.length&&c<=0){ tend=t; break; } c=Math.max(0,c-beta/60); tend=t; }
    const xmax=Math.max(1,(tend-t0)/60), first=wdHM(t0);
    cv.style.display=''; chart(cv,{xmin:0,xmax,ymin:0,ymax:Math.max(0.6,peak*1.15),xlabel:`uren na ${first}`,ylabel:'alcohol in bloed (g/L)',series:[{fn:x=>{ let i=0; while(i<pts.length-1&&pts[i+1][0]<=x) i++; return pts[i]?pts[i][1]:NaN; },name:'Widmark'},{fn:()=>0.5,color:'--bad',dash:[5,4]},{fn:()=>0.2,color:'--warn',dash:[2,4]}]});
    let l5=-1; pts.forEach((p,i)=>{ if(p[1]>0.5) l5=i; });
    h+=`<div class="lbl">Geschatte piek</div><div class="big">${fmt(peak,2)} <small>g/L</small></div>`+kv([['Tijdstip piek',wdHM(tp)],['Alcohol totaal',`${fmt(A,1)} g (${fmt(A/10,1)} standaardglazen)`],['Verdelingsfactor r',fmt(r,3)],['Weer 0 g/L om',beta>0?wdHM(tend):'–'],['Onder 0,5 g/L vanaf',l5<0?'blijft eronder':l5<pts.length-1?wdHM(t0+(l5+1)):'–']]);
  } else { cv.style.display='none'; h+=note('info','Vul minstens één drankje met volume, alcoholpercentage en tijdstip in.'); }
  const cm=num($('#wd-m').value), mt=wdT($('#wd-mt').value), it=wdT($('#wd-it').value), b1=num($('#wd-b1').value), b2=num($('#wd-b2').value);
  if(cm>=0&&isFinite(mt)&&isFinite(it)&&b1>=0&&b2>=b1){ let dt=(mt-it)/60; if(dt<0) dt+=24; const lo=cm+b1*dt, hi=cm+b2*dt, mid=cm+beta*dt;
    h+=`<div class="lbl" style="margin-top:14px">Teruggerekend naar ${wdHM(it)}</div><div class="big">${fmt(lo,2)} – ${fmt(hi,2)} <small>g/L</small></div>`+kv([['Tijdsverschil',`${fmt(dt,2)} h`],[`Met β = ${fmt(beta,2)} g/L/h`,fmt(mid,2)+' g/L'],['Boven 0,5 g/L?',lo>0.5?'ja, ook met de laagste afbraak':hi>0.5?'mogelijk, afhankelijk van de afbraak':'nee']])+note('warn','Terugrekenen is alleen verdedigbaar als de opname op het incidenttijdstip voltooid was (meestal 1–2 uur na het laatste drankje).'); }
  out.innerHTML=h+`<div class="formula">c = A / (r · W) × 1,055 − β · t · A = V × % vol × 0,789 · stippellijnen: 0,5 en 0,2 g/L</div>`; };
