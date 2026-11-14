/* ================= KLEURINGSSCHEMA ================= */
const STN={gram:{t:'Gramkleuring',r:'Gram-positief: paars · Gram-negatief: roze/rood',s:[['Kristalviolet','60','#6b2fa3'],['Spoelen met water','','#9cc7e8'],['Jodium (Lugol)','60','#8a5a14'],['Spoelen met water','','#9cc7e8'],['Ontkleuren (alcohol/aceton)','','#d9d9d9'],['Spoelen met water','','#9cc7e8'],['Safranine','45','#d23a5c'],['Spoelen en drogen','','#9cc7e8']]},
 zn:{t:'Ziehl-Neelsen (zuurvaste kleuring)',r:'Zuurvast: rood · niet zuurvast: blauw',s:[['Carbolfuchsine, verwarmen tot damp','300','#c2185b'],['Spoelen met water','','#9cc7e8'],['Ontkleuren met zuuralcohol','','#d9d9d9'],['Spoelen met water','','#9cc7e8'],['Methyleenblauw','60','#1e5aa8'],['Spoelen en drogen','','#9cc7e8']]},
 spore:{t:'Sporenkleuring (Schaeffer-Fulton)',r:'Sporen: groen · vegetatieve cellen: roze/rood',s:[['Malachietgroen boven stoom','300','#2e8b57'],['Spoelen met water','','#9cc7e8'],['Safranine','45','#d23a5c'],['Spoelen en drogen','','#9cc7e8']]}};
const stnT=ET('stn-tbl',[{h:'Stap / reagens',t:'txt',w:200},{h:'Tijd (s)',t:'num',w:64},{h:'Kleur',t:'txt',w:80}],STN.gram.s,'stain');
$('#stn-load').addEventListener('click',()=>{ const P=STN[$('#stn-pre').value]; $('#stn-title').value=P.t; $('#stn-res').value=P.r; ['stn-title','stn-res'].forEach(id=>$('#'+id).dispatchEvent(new Event('input',{bubbles:true}))); stnT.set(P.s); });
calc.stain=function(){ const S=etGet('stn-tbl').filter(r=>r[0].trim()), title=$('#stn-title').value, res=$('#stn-res').value, out=$('#stn-out');
  if(!S.length){ out.innerHTML=note('info','Voeg minstens één stap toe.'); return; }
  const per=4, bw=150, bh=86, gap=26, rows=Math.ceil(S.length/per), W=Math.min(S.length,per)*(bw+gap)+40, H=60+rows*(bh+40)+(res?40:10);
  const tt=v=>{ const s=num(v); if(!isFinite(s)) return 'kort / tot helder'; return s>=60?(s%60?`${Math.floor(s/60)} min ${s%60} s`:`${s/60} min`):`${s} s`; };
  pShow($('#stn-cv'),W,H,(x)=>{ pTitle(x,title,W); S.forEach((r,i)=>{ const c=i%per, rw=Math.floor(i/per), X=20+c*(bw+gap), Y=50+rw*(bh+40);
      x.fillStyle='#fff'; x.strokeStyle=PCOL.line; x.lineWidth=1; x.beginPath(); x.roundRect(X,Y,bw,bh,8); x.fill(); x.stroke();
      x.fillStyle=/^#|^[a-z]+$/i.test(r[2])?r[2]:'#999'; x.beginPath(); x.arc(X+22,Y+24,11,0,7); x.fill();
      x.fillStyle=PCOL.ink; x.font='600 12px '+PFONT(); x.textAlign='left'; x.textBaseline='middle'; x.fillText(String(i+1),X+44,Y+24);
      const words=r[0].split(/\s+/); let ln='', ly=Y+48; x.font='12px '+PFONT(); words.forEach(w=>{ if(x.measureText(uv(ln+' '+w)).width>bw-16&&ln){ x.fillText(uv(ln),X+10,ly); ly+=15; ln=w; } else ln=ln?ln+' '+w:w; }); x.fillText(uv(ln),X+10,ly);
      x.fillStyle=PCOL.muted; x.font='11px '+PFONT(); x.fillText(tt(r[1]),X+60,Y+24);
      if(i<S.length-1){ x.strokeStyle=PCOL.muted; x.lineWidth=1.5; if(c<per-1){ x.beginPath(); x.moveTo(X+bw+4,Y+bh/2); x.lineTo(X+bw+gap-6,Y+bh/2); x.stroke(); x.beginPath(); x.moveTo(X+bw+gap-6,Y+bh/2); x.lineTo(X+bw+gap-12,Y+bh/2-4); x.lineTo(X+bw+gap-12,Y+bh/2+4); x.closePath(); x.fillStyle=PCOL.muted; x.fill(); } } });
    if(res){ x.fillStyle=PCOL.ink; x.font='600 12.5px '+PFONT(); x.textAlign='left'; x.textBaseline='alphabetic'; x.fillText(res,20,H-16); } });
  const tot=S.reduce((s,r)=>s+(num(r[1])||0),0); out.innerHTML=kv([['Stappen',S.length],['Wachttijd in totaal (zonder spoelen)',tt(tot)]]); };
