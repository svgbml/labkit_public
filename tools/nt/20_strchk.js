/* ================= STR-PROFIELCONTROLE ================= */
ET('sc-tbl',[{h:'Locus',t:'txt',w:90},{h:'Allel',t:'num',w:70},{h:'Hoogte (RFU)',t:'num',w:90}],[['D3S1358',15,1520],['D3S1358',16,1310],['D3S1358',14,140],['vWA',17,2210],['FGA',21,610],['FGA',24,290],['TH01',9.3,180],['D8S1179',12,880],['D8S1179',13,930],['D8S1179',14,410],['D8S1179',15,380],['D21S11',30,40]],'strchk');
calc.strchk=function(){ const AT=num($('#sc-at').value)||0, ST=num($('#sc-st').value)||0, PHR=(num($('#sc-phr').value)||0)/100, SF=(num($('#sc-stut').value)||0)/100, out=$('#sc-out');
  const rows=etGet('sc-tbl').map(r=>({l:r[0].trim(),a:num(r[1]),h:num(r[2])})).filter(r=>r.l&&isFinite(r.a)&&isFinite(r.h));
  if(!rows.length){ out.innerHTML=note('info','Vul per piek locus, allel en hoogte in.'); return; }
  const loci=[...new Set(rows.map(r=>r.l))], res=[]; let maxA=0;
  loci.forEach(l=>{ const P=rows.filter(r=>r.l===l).sort((a,b)=>a.a-b.a), below=P.filter(p=>p.h<AT), ab=P.filter(p=>p.h>=AT);
    const stut=ab.filter(p=>ab.some(q=>q!==p&&Math.abs(q.a-1-p.a)<0.01&&p.h<=q.h*SF)), al=ab.filter(p=>!stut.includes(p));
    const flags=[]; let phr=NaN;
    if(al.length===2){ phr=Math.min(al[0].h,al[1].h)/Math.max(al[0].h,al[1].h); if(phr<PHR) flags.push(['warn','PHR onder drempel']); }
    if(al.length===1&&al[0].h<ST) flags.push(['warn','mogelijke drop-out (homozygoot onder ST)']);
    if(al.length===2&&al.some(p=>p.h<ST)) flags.push(['warn','allel onder ST']);
    if(al.length>2) flags.push(['bad','meer dan 2 allelen: mengprofiel']);
    if(stut.length) flags.push(['info',`stutter gefilterd: ${stut.map(p=>fmt(p.a,1)).join(', ')}`]);
    if(below.length) flags.push(['info',`onder AT: ${below.map(p=>fmt(p.a,1)).join(', ')}`]);
    if(!al.length) flags.push(['bad','geen allel boven AT']);
    maxA=Math.max(maxA,al.length); res.push({l,al,phr,flags}); });
  const nc=Math.max(1,Math.ceil(maxA/2)), mix=maxA>2, low=res.filter(r=>r.flags.some(f=>f[0]!=='info')).length;
  let h=`<div class="lbl">Minimaal aantal bijdragers</div><div class="big">${nc}</div>`+kv([['Loci',loci.length],['Maximaal aantal allelen per locus',maxA],['Loci met opmerkingen',low],['Profieltype',mix?'mengprofiel':'enkelvoudig (op basis van alleltelling)']]);
  const chip=(c,t)=>`<span class="chip ${c==='bad'?'bad':c==='warn'?'warn':'ok'}" style="margin:1px 3px 1px 0">${t}</span>`;
  h+=`<div class="tbl-wrap" style="margin-top:12px"><table class="mini"><thead><tr><th>Locus</th><th>Allelen</th><th class="num">PHR</th><th>Beoordeling</th></tr></thead><tbody>${res.map(r=>`<tr><td><b>${esc(r.l)}</b></td><td>${r.al.map(p=>`${fmt(p.a,1)} <small style="color:var(--muted)">(${fmt(p.h,0)})</small>`).join(', ')||'–'}</td><td class="num">${isFinite(r.phr)?fmt(r.phr*100,0)+'%':'–'}</td><td>${r.flags.length?r.flags.map(f=>chip(f[0],f[1])).join(''):chip('ok','in orde')}</td></tr>`).join('')}</tbody></table></div>`;
  if(mix) h+=note('info','Bij een mengprofiel zijn PHR- en drop-outregels per bijdrager niet direct toepasbaar; gebruik de mengprofielrichtlijnen van je lab of probabilistische software.');
  out.innerHTML=h; };
