/* ================= VERWANTSCHAPSINDEX ================= */
ET('kn-tbl',[{h:'Locus',t:'txt',w:84},{h:'Kind a₁',t:'num',w:56},{h:'Kind a₂',t:'num',w:56},{h:'p(a₁)',t:'num',w:64},{h:'p(a₂)',t:'num',w:64},{h:'Moeder a₁',t:'num',w:60},{h:'Moeder a₂',t:'num',w:60},{h:'Vader a₁',t:'num',w:56},{h:'Vader a₂',t:'num',w:56}],
 [['D3S1358',15,17,0.26,0.20,15,16,17,18],['vWA',16,16,0.21,0.21,16,18,16,17],['FGA',21,24,0.17,0.14,22,24,21,21],['TH01',6,9.3,0.23,0.30,9.3,9.3,6,7],['D8S1179',13,14,0.30,0.20,12,13,14,15]],'kin');
calc.kin=function(){ const trio=$('#kn-mo').value==='1', pr=Math.min(0.9999,Math.max(0.0001,(num($('#kn-pr').value)||50)/100)), out=$('#kn-out');
  const eq=(a,b)=>isFinite(a)&&isFinite(b)&&Math.abs(a-b)<0.01, T=(g,x)=>((eq(g[0],x)?1:0)+(eq(g[1],x)?1:0))/2;
  const rows=etGet('kn-tbl').map(r=>({l:r[0],c:[num(r[1]),num(r[2])],p:[num(r[3]),num(r[4])],m:[num(r[5]),num(r[6])],f:[num(r[7]),num(r[8])]})).filter(r=>r.l&&r.c.every(isFinite)&&r.p.every(v=>v>0&&v<1)&&r.f.every(isFinite));
  if(!rows.length){ out.innerHTML=note('info','Vul per locus de allelen van kind en vermeende vader en de frequenties van de allelen van het kind in.'); return; }
  const warn=[]; const res=rows.map(r=>{ const mo=trio&&r.m.every(isFinite), pm=x=>mo?T(r.m,x):(eq(x,r.c[0])?r.p[0]:r.p[1]), pr_=x=>eq(x,r.c[0])?r.p[0]:r.p[1];
    const ord=eq(r.c[0],r.c[1])?[[r.c[0],r.c[1]]]:[[r.c[0],r.c[1]],[r.c[1],r.c[0]]]; /* [moederlijk, vaderlijk] */
    const num_=ord.reduce((s,[m,f])=>s+pm(m)*T(r.f,f),0), den=ord.reduce((s,[m,f])=>s+pm(m)*pr_(f),0);
    if(mo&&den===0) warn.push(`${ud(r.l)}: het kind heeft geen allel van de moeder; controleer de typering of een mutatie.`);
    return {l:r.l,pi:den>0?num_/den:NaN}; });
  const valid=res.filter(r=>isFinite(r.pi)), excl=valid.filter(r=>r.pi===0), cpi=valid.reduce((s,r)=>s*r.pi,1), W=cpi*pr/(cpi*pr+1-pr);
  let h=excl.length?`<div class="lbl">Uitsluiting</div><div class="big">${excl.length} <small>van ${valid.length} loci</small></div>`+note(excl.length>=2?'bad':'warn',excl.length>=2?'Uitsluiting op meerdere loci: de vermeende vader is uitgesloten.':'Uitsluiting op één locus: dit kan een mutatie zijn; neem een mutatiemodel mee of typeer extra loci.'):
    `<div class="lbl">Gecombineerde vaderschapsindex</div><div class="big">${sci(cpi,3)}</div>`+kv([['Kans op vaderschap W',W>0.99999?'&gt; 99,999%':fmt(W*100,3)+'%'],['A-priorikans',fmt(pr*100,1)+'%'],['Loci',valid.length],['Type',trio?'trio (met moeder)':'duo (zonder moeder)']]);
  h+=`<div class="tbl-wrap" style="margin-top:12px"><table class="mini"><thead><tr><th>Locus</th><th class="num">PI</th></tr></thead><tbody>${res.map(r=>`<tr><td>${esc(r.l)}</td><td class="num">${isFinite(r.pi)?(r.pi===0?'<span class="chip bad">0 (uitsluiting)</span>':fmt(r.pi,3)):'–'}</td></tr>`).join('')}</tbody></table></div>`;
  out.innerHTML=warn.map(w=>note('warn',w)).join('')+h; };
