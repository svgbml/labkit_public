/* ================= DOSIS-RESPONS ================= */
ET('ic-tbl',[{h:'Concentratie',t:'num',w:84},{h:'Respons 1',t:'num',w:76},{h:'Respons 2',t:'num',w:76},{h:'Respons 3',t:'num',w:76}],[[0,1.02,0.98,1.0],[0.1,0.99,1.01,0.97],[0.3,0.95,0.93,0.97],[1,0.82,0.86,0.80],[3,0.55,0.51,0.58],[10,0.24,0.21,0.27],[30,0.09,0.11,0.08],[100,0.05,0.04,0.06]],'ic50');
calc.ic50=function(){ const out=$('#ic-out'), cv=$('#ic-cv'), cu=$('#ic-cu').value, pct=$('#ic-norm').value==='pct';
  const R=etGet('ic-tbl').map(r=>({x:num(r[0]),y:[r[1],r[2],r[3]].map(num).filter(isFinite)})).filter(r=>isFinite(r.x)&&r.y.length);
  const ctl=R.filter(r=>r.x===0).flatMap(r=>r.y), c0=ctl.length?mean(ctl):NaN;
  if(pct&&!isFinite(c0)){ out.innerHTML=note('warn','Voor % van de controle is een rij met concentratie 0 nodig.'); cv.style.display='none'; return; }
  const tr=y=>pct?y/c0*100:y, P=R.filter(r=>r.x>0).flatMap(r=>r.y.map(y=>[r.x,tr(y)]));
  if(new Set(P.map(p=>p[0])).size<4){ out.innerHTML=note('info','Vul minstens vier concentraties groter dan 0 in.'); cv.style.display='none'; return; }
  const xs=P.map(p=>Math.log10(p[0])), ys=P.map(p=>p[1]), ymin=Math.min(...ys), ymax=Math.max(...ys), f=(lx,q)=>q[0]+(q[1]-q[0])/(1+Math.pow(10,(lx-q[2])*q[3]));
  const inc=ys[xs.indexOf(Math.max(...xs))]>ys[xs.indexOf(Math.min(...xs))]; const p0=[inc?ymax:ymin,inc?ymin:ymax,(Math.min(...xs)+Math.max(...xs))/2,1]; p0[0]=Math.min(...ys); p0[1]=Math.max(...ys); if(inc) p0[3]=-1;
  const F=lmfit(f,p0,xs,ys,400), [bot,top,lic,h]=F.p, n=xs.length, df=n-4, tc=df>0?tinv(0.975,df):NaN, lo=lic-tc*F.se[2], hi=lic+tc*F.se[2];
  const sst=ys.reduce((s,y)=>s+(y-mean(ys))**2,0), r2=1-F.sse/sst, ic=10**lic, lbl=inc?'EC₅₀':'IC₅₀';
  let o=`<div class="lbl">${lbl}</div><div class="big">${sig(ic,3)} <small>${esc(cu)}</small></div>`+kv([['95%-interval',isFinite(lo)?`${sig(10**lo,3)} – ${sig(10**hi,3)} ${esc(cu)}`:'–'],['Hill-helling',fmt(inc?-h:h,2)],['Onderste plateau',sig(Math.min(bot,top),3)+(pct?' %':'')],['Bovenste plateau',sig(Math.max(bot,top),3)+(pct?' %':'')],['R²',fmt(r2,4)]]);
  if(ic<Math.min(...P.map(p=>p[0]))||ic>Math.max(...P.map(p=>p[0]))) o+=note('warn',`De ${lbl} ligt buiten de geteste concentraties; de schatting is extrapolatie.`);
  if(Math.abs(top-bot)<0.2*Math.abs(ymax-ymin||1)) o+=note('warn','Geen duidelijk sigmoïde verloop; voeg hogere of lagere concentraties toe.');
  out.innerHTML=o; cv.style.display='';
  const xa=P.map(p=>p[0]); chart(cv,{logx:true,xmin:Math.min(...xa)/2,xmax:Math.max(...xa)*2,ymin:Math.min(0,ymin),ymax:ymax*1.08,xlabel:`concentratie (${cu})`,ylabel:pct?'respons (% van controle)':'respons',series:[{fn:x=>f(Math.log10(x),F.p),name:'4PL'},{pts:P,color:'--warn'}]}); };
