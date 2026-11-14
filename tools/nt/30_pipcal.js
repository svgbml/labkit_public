/* ================= PIPETKALIBRATIE ================= */
const ZTAB=[[15,1.0020],[15.5,1.0020],[16,1.0021],[16.5,1.0022],[17,1.0023],[17.5,1.0024],[18,1.0025],[18.5,1.0026],[19,1.0027],[19.5,1.0028],[20,1.0029],[20.5,1.0030],[21,1.0031],[21.5,1.0032],[22,1.0033],[22.5,1.0034],[23,1.0035],[23.5,1.0036],[24,1.0038],[24.5,1.0039],[25,1.0040],[25.5,1.0041],[26,1.0043],[26.5,1.0044],[27,1.0045],[27.5,1.0047],[28,1.0048],[28.5,1.0050],[29,1.0051],[29.5,1.0052],[30,1.0054]];
const ISOLIM=[[1,5,5],[2,4,2],[5,2.5,1.5],[10,1.2,0.8],[20,1,0.5],[50,1,0.4],[100,0.8,0.3],[200,0.8,0.3],[500,0.8,0.3],[1000,0.8,0.3],[2000,0.8,0.3],[5000,0.8,0.3],[10000,0.6,0.3]];
const zFactor=t=>{ if(t<=15) return ZTAB[0][1]; if(t>=30) return ZTAB[ZTAB.length-1][1]; const i=ZTAB.findIndex(r=>r[0]>=t); const a=ZTAB[i-1], b=ZTAB[i]; return a[1]+(b[1]-a[1])*(t-a[0])/(b[0]-a[0]); };
calc.pipcal=function(){ const Vs=num($('#pc-v').value), nom=num($('#pc-nom').value), t=num($('#pc-t').value), m=numsC($('#pc-m').value), mc=num($('#pc-ch').value)||1, out=$('#pc-out');
  if(!(Vs>0)||m.length<2){ out.innerHTML=note('info','Vul het ingestelde volume en minstens twee wegingen in.'); return; }
  const Z=zFactor(isFinite(t)?t:20), V=m.map(x=>x*Z), Vm=mean(V), s=sd(V), es=(Vm-Vs)/Vs*100, cv=s/Vm*100;
  const lim=isFinite(nom)?ISOLIM.reduce((a,b)=>Math.abs(Math.log(b[0]/nom))<Math.abs(Math.log(a[0]/nom))?b:a):null;
  const limS=lim?lim[1]*lim[0]/Vs*mc:NaN, limR=lim?lim[2]*lim[0]/Vs*mc:NaN; /* ISO-grenzen in µL bij nominaal volume, omgerekend naar % bij ingesteld volume */
  const okS=Math.abs(es)<=limS, okR=cv<=limR, chip=ok=>`<span class="chip ${ok?'ok':'bad'}" style="vertical-align:middle">${ok?'voldoet':'voldoet niet'}</span>`;
  let h=`<div class="lbl">Gemiddeld volume</div><div class="big">${fmt(Vm,3)} <small>µL</small></div>`+kv([['Systematische fout e<sub>s</sub>',`${fmt(es,2)}% (${fmt(Vm-Vs,3)} µL) ${isFinite(limS)?chip(okS):''}`],['Toevallige fout CV',`${fmt(cv,2)}% (s = ${fmt(s,3)} µL) ${isFinite(limR)?chip(okR):''}`],['Z-factor',fmt(Z,4)+' µL/mg'],['Aantal wegingen',m.length]]);
  if(lim) h+=kv([['ISO 8655-grens e<sub>s</sub>',`± ${fmt(lim[1]*lim[0]*mc/100,3)} µL (± ${fmt(limS,2)}% bij ${fmt(Vs,0)} µL)`],['ISO 8655-grens CV',`${fmt(lim[2]*lim[0]*mc/100,3)} µL (${fmt(limR,2)}% bij ${fmt(Vs,0)} µL)`]]);
  if(lim&&Math.abs(lim[0]-nom)/nom>0.05) h+=note('info',`Geen ISO-tabelwaarde voor ${fmt(nom,0)} µL; de grenzen van ${fmt(lim[0],0)} µL zijn gebruikt.`);
  if(m.length<4) h+=note('warn','Gebruik minstens 4 wegingen voor een betrouwbare schatting.');
  if(isFinite(limS)&&(!okS||!okR)) h+=note('bad','Buiten de ISO-grenzen: controleer de techniek (voorbevochtigen, verticaal pipetteren, tip) en laat de pipet zo nodig kalibreren.');
  out.innerHTML=h+`<div class="formula">V = m × Z · e<sub>s</sub> = (V̄ − V<sub>s</sub>) / V<sub>s</sub> · CV = s / V̄</div>`; };
