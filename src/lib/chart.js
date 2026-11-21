/* ================= GRAFIEKEN (S267) =================
   Letterlijk overgenomen uit src/shell/index.html: chart() tekent een lijn- of puntgrafiek op een
   canvas en legt de punten in cv._data (voor "Kopieer naar Excel"); niceStep en tickLabel maken
   de assen; inp() maakt een getalveld voor een tabel in een string. */
import {expose} from './global.js';

function niceStep(range,n){ const raw=range/n; const p=10**Math.floor(Math.log10(raw)); const f=raw/p; return (f<1.5?1:f<3?2:f<7?5:10)*p; }
function tickLabel(v){ const a=Math.abs(v); if(a===0) return '0'; if(a>=1e5||a<1e-3) return v.toExponential(0).replace('e+','e'); return NL(Number(v.toPrecision(4)),4); }
function chart(cv,o){
  const W=o.w||480,H=o.h||300,dpr=window.devicePixelRatio||1; cv.width=W*dpr; cv.height=H*dpr; cv.style.width='100%'; cv.style.maxWidth=W+'px';
  const ctx=cv.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,W,H);
  const cs=getComputedStyle(document.documentElement), C=k=>cs.getPropertyValue(k).trim();
  const pad={l:58,r:14,t:16,b:42}; const logx=!!o.logx, logy=!!o.logy;
  const tx=v=>logx?Math.log10(v):v, ty=v=>logy?Math.log10(v):v;
  let {xmin,xmax,ymin,ymax}=o; if(xmax===xmin){ xmax+=1; xmin-=logx?0:1; } if(ymax===ymin){ ymax+=1; ymin-=1; }
  const X=v=>pad.l+(tx(v)-tx(xmin))/(tx(xmax)-tx(xmin))*(W-pad.l-pad.r), Y=v=>H-pad.b-(ty(v)-ty(ymin))/(ty(ymax)-ty(ymin))*(H-pad.t-pad.b);
  ctx.font='11px '+C('--font-ui'); ctx.lineWidth=1;
  const ys=niceStep(ymax-ymin,5); ctx.textAlign='right'; ctx.textBaseline='middle';
  if(logy){ for(let e=Math.floor(Math.log10(ymin));e<=Math.ceil(Math.log10(ymax));e++) (Math.log10(ymax/ymin)>3?[1]:[1,2,5]).forEach(m=>{ const v=m*10**e; if(v<ymin||v>ymax) return; ctx.strokeStyle=C('--line'); ctx.beginPath(); ctx.moveTo(pad.l,Y(v)); ctx.lineTo(W-pad.r,Y(v)); ctx.stroke(); ctx.fillStyle=C('--muted'); ctx.fillText(tickLabel(v),pad.l-6,Y(v)); }); }
  else for(let t=Math.ceil(ymin/ys)*ys,k=0;t<=ymax+ys*1e-6&&k<60;t+=ys,k++){ ctx.strokeStyle=C('--line'); ctx.beginPath(); ctx.moveTo(pad.l,Y(t)); ctx.lineTo(W-pad.r,Y(t)); ctx.stroke(); ctx.fillStyle=C('--muted'); ctx.fillText(tickLabel(t),pad.l-6,Y(t)); }
  ctx.textAlign='center'; ctx.textBaseline='top';
  if(logx){ for(let e=Math.floor(Math.log10(xmin));e<=Math.ceil(Math.log10(xmax));e++) (Math.log10(xmax/xmin)>4?[1]:[1,2,5]).forEach(m=>{ const v=m*10**e; if(v<xmin||v>xmax) return; ctx.strokeStyle=C('--line'); ctx.beginPath(); ctx.moveTo(X(v),pad.t); ctx.lineTo(X(v),H-pad.b); ctx.stroke(); ctx.fillStyle=C('--muted'); ctx.fillText(tickLabel(v),X(v),H-pad.b+6); }); }
  else { const xs=niceStep(xmax-xmin,6); for(let t=Math.ceil(xmin/xs)*xs,k=0;t<=xmax+xs*1e-6&&k<60;t+=xs,k++){ ctx.fillStyle=C('--muted'); ctx.fillText(tickLabel(t),X(t),H-pad.b+6); if(Math.abs(t)<xs*1e-6&&xmin<0){ ctx.strokeStyle=C('--muted'); ctx.beginPath(); ctx.moveTo(X(0),pad.t); ctx.lineTo(X(0),H-pad.b); ctx.stroke(); } } }
  if(!logy&&ymin<0&&ymax>0){ ctx.strokeStyle=C('--muted'); ctx.beginPath(); ctx.moveTo(pad.l,Y(0)); ctx.lineTo(W-pad.r,Y(0)); ctx.stroke(); }
  ctx.strokeStyle=C('--muted'); ctx.beginPath(); ctx.moveTo(pad.l,pad.t); ctx.lineTo(pad.l,H-pad.b); ctx.lineTo(W-pad.r,H-pad.b); ctx.stroke();
  ctx.fillStyle=C('--muted'); ctx.font='12px '+C('--font-ui'); ctx.fillText(o.xlabel||'',(W+pad.l)/2,H-16);
  ctx.save(); ctx.translate(14,(H-pad.b+pad.t)/2); ctx.rotate(-Math.PI/2); ctx.textBaseline='middle'; ctx.fillText(o.ylabel||'',0,0); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(pad.l,pad.t,W-pad.l-pad.r,H-pad.t-pad.b); ctx.clip();
  (o.series||[]).forEach(s=>{
    const col=C(s.color||'--accent')||s.color;
    if(s.fn){ ctx.strokeStyle=col; ctx.lineWidth=2; ctx.setLineDash(s.dash||[]); ctx.beginPath(); const a=tx(s.x0??xmin), b=tx(s.x1??xmax); let first=true; for(let i=0;i<=240;i++){ const xv=a+(b-a)*i/240, x=logx?10**xv:xv, y=s.fn(x); if(!isFinite(y)||(logy&&y<=0)){ first=true; continue; } first?ctx.moveTo(X(x),Y(y)):ctx.lineTo(X(x),Y(y)); first=false; } ctx.stroke(); ctx.setLineDash([]); }
    if(s.pts){ s.pts.forEach(p=>{ if((logx&&p[0]<=0)||(logy&&p[1]<=0)) return; ctx.beginPath(); ctx.arc(X(p[0]),Y(p[1]),s.r||3.5,0,7); if(s.hollow){ ctx.strokeStyle=col; ctx.lineWidth=1.8; ctx.stroke(); } else { ctx.fillStyle=col; ctx.fill(); } }); }
  });
  ctx.restore();
  if(o.legend){ let lx=o.legendPos==='br'?W-pad.r-150:pad.l+10, ly=o.legendPos==='br'?H-pad.b-10-16*(o.legend.length-1):pad.t+6; ctx.font='12px '+C('--font-ui'); ctx.textAlign='left'; ctx.textBaseline='middle'; o.legend.forEach(([lab,col])=>{ ctx.fillStyle=C(col)||col; ctx.fillRect(lx,ly-4,10,8); ctx.fillStyle=C('--ink'); ctx.fillText(lab,lx+16,ly); ly+=16; }); }
  const D={head:['reeks',o.xlabel||'x',o.ylabel||'y'],rows:[]};
  (o.series||[]).forEach((s,i)=>{ if(s.pts) s.pts.forEach(p=>D.rows.push([s.name||('reeks '+(i+1)),p[0],p[1]])); });
  (o.series||[]).forEach(s=>{ if(s.fn&&s.name){ const a=tx(s.x0??xmin), b=tx(s.x1??xmax); for(let k=0;k<=50;k++){ const xv=a+(b-a)*k/50, x=logx?10**xv:xv, y=s.fn(x); if(isFinite(y)) D.rows.push([s.name,x,y]); } } });
  cv._data=D;
  return {X,Y};
}
const inp=(v,w=72,k='')=>`<input ${k} inputmode="decimal" value="${v==null||v===''||(typeof v==='number'&&!isFinite(v))?'':String(v).replace('.',',')}" style="text-align:right;width:${w}px">`;

/* staafdiagram met foutbalken (qPCR ΔΔCt, Statistiek) */
function barChart(cv,cats,vals,lo,hi,o){
  const W=480,H=300,dpr=window.devicePixelRatio||1; cv.width=W*dpr; cv.height=H*dpr; cv.style.width='100%'; cv.style.maxWidth=W+'px';
  const x=cv.getContext('2d'); x.setTransform(dpr,0,0,dpr,0,0); x.clearRect(0,0,W,H); const cs=getComputedStyle(document.documentElement), C=k=>cs.getPropertyValue(k).trim();
  const pad={l:58,r:14,t:16,b:46}; const ymax=Math.max(1.2,...vals.filter(isFinite),...hi.filter(isFinite))*1.12; const Y=v=>H-pad.b-v/ymax*(H-pad.t-pad.b);
  x.font='11px '+C('--font-ui'); const st=niceStep(ymax,5); x.textAlign='right'; x.textBaseline='middle';
  for(let t=0;t<=ymax+1e-9;t+=st){ x.strokeStyle=C('--line'); x.beginPath(); x.moveTo(pad.l,Y(t)); x.lineTo(W-pad.r,Y(t)); x.stroke(); x.fillStyle=C('--muted'); x.fillText(tickLabel(t),pad.l-6,Y(t)); }
  const bw=(W-pad.l-pad.r)/Math.max(1,cats.length);
  cats.forEach((c,i)=>{ const cx=pad.l+bw*(i+0.5), w=Math.min(56,bw*0.55); if(isFinite(vals[i])){ x.fillStyle=o.cal===c?C('--muted'):C('--accent'); x.fillRect(cx-w/2,Y(vals[i]),w,Y(0)-Y(vals[i])); }
    if(isFinite(lo[i])&&isFinite(hi[i])&&hi[i]>lo[i]){ x.strokeStyle=C('--ink'); x.lineWidth=1.3; x.beginPath(); x.moveTo(cx,Y(lo[i])); x.lineTo(cx,Y(hi[i])); x.moveTo(cx-6,Y(lo[i])); x.lineTo(cx+6,Y(lo[i])); x.moveTo(cx-6,Y(hi[i])); x.lineTo(cx+6,Y(hi[i])); x.stroke(); x.lineWidth=1; }
    x.fillStyle=C('--ink'); x.textAlign='center'; x.textBaseline='top'; x.fillText(c.length>14?c.slice(0,13)+'…':c,cx,H-pad.b+6); if(isFinite(vals[i])){ x.textBaseline='bottom'; x.fillText(sig(vals[i],3).replace(/<[^>]+>/g,''),cx,Y(Math.max(vals[i],isFinite(hi[i])?hi[i]:0))-3); } });
  x.strokeStyle=C('--muted'); x.setLineDash([4,3]); x.beginPath(); x.moveTo(pad.l,Y(1)); x.lineTo(W-pad.r,Y(1)); x.stroke(); x.setLineDash([]);
  x.beginPath(); x.moveTo(pad.l,pad.t); x.lineTo(pad.l,H-pad.b); x.lineTo(W-pad.r,H-pad.b); x.stroke();
  x.save(); x.translate(14,(H-pad.b+pad.t)/2); x.rotate(-Math.PI/2); x.textAlign='center'; x.textBaseline='middle'; x.fillStyle=C('--muted'); x.font='12px '+C('--font-ui'); x.fillText(o.ylabel,0,0); x.restore();
  cv._data={head:['monster',o.ylabel,'ondergrens','bovengrens'],rows:cats.map((c,i)=>[c,vals[i],lo[i],hi[i]])};
}

expose({niceStep, tickLabel, chart, inp, barChart});
