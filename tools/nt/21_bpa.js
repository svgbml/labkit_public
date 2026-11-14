/* ================= BLOEDVLEKPATRONEN ================= */
ET('bp-tbl',[{h:'Vlek',t:'txt',w:60},{h:'Breedte (mm)',t:'num',w:80},{h:'Lengte (mm)',t:'num',w:80},{h:'x (cm)',t:'num',w:64},{h:'y (cm)',t:'num',w:64},{h:'γ (°)',t:'num',w:60}],[['1',6.7,10,20,10,217],['2',6.5,10,110,25,343],['3',6.2,10,95,85,52],['4',6.1,10,30,90,121],['5',5.9,10,70,100,81]],'bpa');
calc.bpa=function(){ const out=$('#bp-out'), D=etGet('bp-tbl').map(r=>({n:r[0],w:num(r[1]),l:num(r[2]),x:num(r[3]),y:num(r[4]),g:num(r[5])})).filter(s=>s.w>0&&s.l>0);
  if(!D.length){ out.innerHTML=note('info','Vul per vlek breedte en lengte in.'); $('#bp-cv').style.display='none'; return; }
  const warn=[]; D.forEach(s=>{ if(s.w>s.l) warn.push(`Vlek ${ud(s.n)}: breedte groter dan lengte; verwissel ze.`); s.a=Math.asin(Math.min(1,s.w/s.l)); });
  const P=D.filter(s=>isFinite(s.x)&&isFinite(s.y)&&isFinite(s.g)); let C=null;
  if(P.length>=2){ let a11=0,a12=0,a22=0,b1=0,b2=0; P.forEach(s=>{ const t=s.g*Math.PI/180, ux=Math.cos(t), uy=Math.sin(t), m11=1-ux*ux, m12=-ux*uy, m22=1-uy*uy; a11+=m11; a12+=m12; a22+=m22; b1+=m11*s.x+m12*s.y; b2+=m12*s.x+m22*s.y; }); const det=a11*a22-a12*a12; if(Math.abs(det)>1e-9) C={x:(a22*b1-a12*b2)/det,y:(a11*b2-a12*b1)/det}; else warn.push('De looprichtingen zijn (bijna) evenwijdig; er is geen convergentiepunt.'); }
  if(C) P.forEach(s=>{ s.d=Math.hypot(s.x-C.x,s.y-C.y); s.h=s.d*Math.tan(s.a); const t=s.g*Math.PI/180; if((s.x-C.x)*Math.cos(t)+(s.y-C.y)*Math.sin(t)<0) warn.push(`Vlek ${ud(s.n)}: de looprichting wijst naar het convergentiepunt toe; controleer γ.`); });
  const hs=P.filter(s=>isFinite(s.h)).map(s=>s.h);
  let h=C?`<div class="lbl">Geschatte hoogte van de oorsprong</div><div class="big">${fmt(mean(hs),0)} <small>cm${hs.length>1?' ± '+fmt(sd(hs),0):''}</small></div>`+kv([['Convergentiepunt (x, y)',`${fmt(C.x,1)}, ${fmt(C.y,1)} cm`],['Vlekken gebruikt',P.length]]):`<div class="lbl">Inslaghoeken</div>`;
  h+=`<div class="tbl-wrap" style="margin-top:12px"><table class="mini"><thead><tr><th>Vlek</th><th class="num">B/L</th><th class="num">α (°)</th><th class="num">d (cm)</th><th class="num">h (cm)</th></tr></thead><tbody>${D.map(s=>`<tr><td>${esc(s.n)}</td><td class="num">${fmt(s.w/s.l,3)}</td><td class="num">${fmt(s.a*180/Math.PI,1)}</td><td class="num">${fmt(s.d,1)}</td><td class="num">${fmt(s.h,1)}</td></tr>`).join('')}</tbody></table></div>`;
  out.innerHTML=warn.map(w=>note('warn',w)).join('')+h;
  if(!P.length){ $('#bp-cv').style.display='none'; return; } $('#bp-cv').style.display='';
  const xs=[...P.map(s=>s.x),...(C?[C.x]:[])], ys=[...P.map(s=>s.y),...(C?[C.y]:[])], x0=Math.min(...xs)-15, x1=Math.max(...xs)+15, y0=Math.min(...ys)-15, y1=Math.max(...ys)+15, W=460, sc=(W-60)/Math.max(x1-x0,y1-y0,1), H=Math.round((y1-y0)*sc+60);
  pShow($('#bp-cv'),W,H,(x)=>{ const X=v=>30+(v-x0)*sc, Y=v=>H-30-(v-y0)*sc; x.strokeStyle=PCOL.line; x.strokeRect(30,30,W-60,H-60);
    P.forEach(s=>{ const t=s.g*Math.PI/180; x.strokeStyle='rgba(194,65,12,.45)'; x.lineWidth=1; x.setLineDash([4,4]); x.beginPath(); x.moveTo(X(s.x),Y(s.y)); const back=C?s.d+10:40; x.lineTo(X(s.x-Math.cos(t)*back),Y(s.y-Math.sin(t)*back)); x.stroke(); x.setLineDash([]);
      x.save(); x.translate(X(s.x),Y(s.y)); x.rotate(-t); x.fillStyle='#9b1c1c'; x.beginPath(); x.ellipse(0,0,7,7*s.w/s.l,0,0,7); x.fill(); x.restore(); x.fillStyle=PCOL.ink; x.font='11px '+PFONT(); x.textAlign='left'; x.fillText(s.n,X(s.x)+9,Y(s.y)-8); });
    if(C){ x.strokeStyle=PCOL.acc; x.lineWidth=2; x.beginPath(); x.arc(X(C.x),Y(C.y),6,0,7); x.stroke(); x.fillStyle=PCOL.acc; x.font='600 11px '+PFONT(); x.fillText('convergentie',X(C.x)+9,Y(C.y)+14); }
    x.fillStyle=PCOL.muted; x.font='11px '+PFONT(); x.textAlign='left'; x.fillText('bovenaanzicht (cm)',30,20); }); };
