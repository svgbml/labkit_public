/* ================= CELPASSAGEPLANNER ================= */
calc.passage=function(){ const A=num($('#ps-fmt').value), N=num($('#ps-n').value), td=num($('#ps-td').value), cd=num($('#ps-cd').value), pc=(num($('#ps-pct').value)||80)/100, lag=num($('#ps-lag').value)||0, want=num($('#ps-want').value), out=$('#ps-out');
  if(!(A>0&&N>0&&td>0&&cd>0)){ out.innerHTML=note('info','Vul formaat, aantal cellen, verdubbelingstijd en confluente dichtheid in.'); return; }
  const target=A*cd*pc, now=N/(A*cd)*100, hrs=N>=target?0:td*Math.log2(target/N), d=h=>{ const dd=Math.floor(h/24), hh=Math.round(h-dd*24); return dd?`${dd} d ${hh} u`:`${hh} u`; };
  let h=`<div class="lbl">Tijd tot ${fmt(pc*100,0)}% confluent</div><div class="big">${N>=target?'nu':d(hrs)}</div>`+kv([['Confluentie nu (schatting)',fmt(now,0)+'%'],['Cellen bij '+fmt(pc*100,0)+'%',sci(target,3)],['Celdichtheid nu',sci(N/A,3)+' cellen/cm²']]);
  const R=[2,3,4,5,6,8,10,15,20].map(n=>({n,t:lag+td*Math.log2(n)}));
  if(isFinite(want)&&want>0){ const best=R.reduce((a,b)=>Math.abs(b.t-want*24)<Math.abs(a.t-want*24)?b:a); h+=note('info',`Voor een volgende passage over ${fmt(want,1)} dagen past splitratio 1:${best.n} (klaar na ${d(best.t)}); zaai dan ${sci(target/best.n,3)} cellen in.`); }
  h+=`<div class="tbl-wrap" style="margin-top:12px"><table class="mini"><thead><tr><th>Splitratio</th><th class="num">Cellen inzaaien</th><th class="num">Weer ${fmt(pc*100,0)}% na</th></tr></thead><tbody>${R.map(r=>`<tr><td>1:${r.n}</td><td class="num">${sci(target/r.n,3)}</td><td class="num">${d(r.t)}</td></tr>`).join('')}</tbody></table></div>`;
  if(now>100) h+=note('warn','Meer cellen dan bij volledige confluentie: controleer het aantal of de confluente dichtheid.');
  out.innerHTML=h+`<div class="formula">t = t<sub>lag</sub> + t<sub>d</sub> · log₂(n)</div>`; };
