/* ================= KLEURINGSSCHEMA ================= */
const STN={gram:{t:'Gramkleuring',r:'Gram-positief: paars · Gram-negatief: roze/rood',s:[['Kristalviolet','60','#6b2fa3'],['Spoelen met water','','#9cc7e8'],['Jodium (Lugol)','60','#8a5a14'],['Spoelen met water','','#9cc7e8'],['Ontkleuren (alcohol/aceton)','','#d9d9d9'],['Spoelen met water','','#9cc7e8'],['Safranine','45','#d23a5c'],['Spoelen en drogen','','#9cc7e8']]},
 zn:{t:'Ziehl-Neelsen (zuurvaste kleuring)',r:'Zuurvast: rood · niet zuurvast: blauw',s:[['Carbolfuchsine, verwarmen tot damp','300','#c2185b'],['Spoelen met water','','#9cc7e8'],['Ontkleuren met zuuralcohol','','#d9d9d9'],['Spoelen met water','','#9cc7e8'],['Methyleenblauw','60','#1e5aa8'],['Spoelen en drogen','','#9cc7e8']]},
 spore:{t:'Sporenkleuring (Schaeffer-Fulton)',r:'Sporen: groen · vegetatieve cellen: roze/rood',s:[['Malachietgroen boven stoom','300','#2e8b57'],['Spoelen met water','','#9cc7e8'],['Safranine','45','#d23a5c'],['Spoelen en drogen','','#9cc7e8']]}};
const stnT=ET('stn-tbl',[{h:'Stap / reagens',t:'txt',w:200},{h:'Tijd (s)',t:'num',w:64},{h:'Kleur',t:'txt',w:80}],STN.gram.s,'stain');
$('#stn-load').addEventListener('click',()=>{ const P=STN[$('#stn-pre').value]; $('#stn-title').value=P.t; $('#stn-res').value=P.r; ['stn-title','stn-res'].forEach(id=>$('#'+id).dispatchEvent(new Event('input',{bubbles:true}))); stnT.set(P.s); });
calc.stain=function(){ const S=etGet('stn-tbl').filter(r=>r[0].trim()), title=$('#stn-title').value, res=$('#stn-res').value, out=$('#stn-out');
  if(!S.length){ out.innerHTML=note('info','Voeg minstens één stap toe.'); return; }
  /* Tijdlijn: de breedte van een stap is evenredig met zijn tijd, met een ondergrens zodat
     een korte stap leesbaar blijft. Stappen zonder tijd (spoelen, ontkleuren tot helder)
     krijgen die ondergrens en een druppel in plaats van een blok met tijd. */
  const tt=v=>{ const s=num(v); if(!isFinite(s)) return 'kort / tot helder'; return s>=60?(s%60?`${Math.floor(s/60)} min ${s%60} s`:`${s/60} min`):`${s} s`; };
  const secs=S.map(r=>{ const v=num(r[1]); return isFinite(v)&&v>0?v:0; }), totS=secs.reduce((a,b)=>a+b,0);
  const MINW=78, budget=Math.max(560,S.length*96);
  const wid=S.map((r,i)=>totS>0&&secs[i]>0?Math.max(MINW,budget*secs[i]/totS):MINW);
  const X=[]; wid.reduce((a,w,i)=>{ X[i]=20+a; return a+w; },0);
  const totW=wid.reduce((a,b)=>a+b,0), W=Math.max(520,totW+40), BH=30, H=(title?40:0)+150+(res?34:0);
  const colOf=r=>/^#[0-9a-f]{3,8}$/i.test(r[2])?r[2]:'#9aa6b2';
  pShow($('#stn-cv'),W,H,(x)=>{ const t0=pTitle(x,title,W), by=t0+74;
    S.forEach((r,i)=>{ const c=colOf(r), w=wid[i], xa=X[i], xm=xa+w/2, hasT=secs[i]>0;
      /* balk van de stap */
      x.fillStyle=c; x.globalAlpha=hasT?0.9:0.35; x.beginPath(); x.roundRect(xa+1,by,w-2,BH,5); x.fill(); x.globalAlpha=1;
      x.strokeStyle=PCOL.line; x.lineWidth=1; x.beginPath(); x.roundRect(xa+1,by,w-2,BH,5); x.stroke();
      /* druppel reagens boven de balk */
      const dy=by-14, dr=7;
      x.fillStyle=c; x.beginPath(); x.moveTo(xm,dy-dr*1.5); x.quadraticCurveTo(xm+dr,dy-dr*0.2,xm+dr*0.72,dy+dr*0.35);
      x.quadraticCurveTo(xm,dy+dr*1.25,xm-dr*0.72,dy+dr*0.35); x.quadraticCurveTo(xm-dr,dy-dr*0.2,xm,dy-dr*1.5); x.closePath();
      if(hasT) x.fill(); else { x.strokeStyle=c; x.lineWidth=1.6; x.stroke(); }
      /* volgnummer in de balk */
      x.fillStyle=inkOn(c); x.font='600 12px '+PFONT(); x.textAlign='center'; x.textBaseline='middle';
      if(hasT) x.fillText(String(i+1),xm,by+BH/2);
      else { x.fillStyle=PCOL.muted; x.fillText(String(i+1),xm,by+BH/2); }
      /* naam en tijd onder de balk, passend gemaakt op de breedte */
      const room=w-8;
      x.fillStyle=PCOL.ink; x.font='11.5px '+PFONT();
      const words=trCanvas(String(r[0]||'')).split(' '); let line='', ly=by+BH+18, lines=0;
      words.forEach(wd=>{ const t2=(line+' '+wd).trim();
        if(x.measureText(uv(t2)).width>room&&line){ if(lines<2){ x.fillText(uv(line),xm,ly); ly+=14; lines++; line=wd; } else line=t2; }
        else line=t2; });
      if(line){ let r2=line; while(r2.length>1&&x.measureText(uv(r2+'…')).width>room) r2=r2.slice(0,-1);
        x.fillText(uv(r2===line?line:r2+'…'),xm,ly); ly+=14; }
      /* in de tekening een kort tijdlabel; de volledige omschrijving staat in de tabel */
      x.fillStyle=PCOL.muted; x.font='11px '+PFONT(); x.fillText(hasT?tt(r[1]):'kort',xm,ly); });
    /* tijdas onder de balken */
    x.strokeStyle=PCOL.line; x.lineWidth=1; x.beginPath(); x.moveTo(20,by-30); x.lineTo(20+totW,by-30); x.stroke();
    x.fillStyle=PCOL.muted; x.font='10.5px '+PFONT(); x.textAlign='left'; x.textBaseline='alphabetic';
    x.fillText('0',20,by-35); x.textAlign='right';
    if(totS>0) x.fillText(tt(String(totS)),20+totW,by-35);
    x.textAlign='center'; x.fillText('tijd',20+totW/2,by-35);
    if(res){ x.fillStyle=PCOL.ink; x.font='600 12.5px '+PFONT(); x.textAlign='left'; x.textBaseline='alphabetic'; x.fillText(res,20,H-14); } });
  const tot=S.reduce((s,r)=>s+(num(r[1])||0),0);
  out.innerHTML=kv([['Stappen',S.length],['Wachttijd in totaal (zonder spoelen)',tt(String(tot))]]); };
