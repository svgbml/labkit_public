/* ================= GELFOTO-EDITOR: DE MOTOR (S268) =================
   Letterlijk overgenomen uit src/shell/index.html: de toestand `gf`, het beeldwerk (gfProc,
   gfRender, rechtzetten, bijsnijden), de laan- en banddetectie, de ladder uit een foto, het
   slepen op het canvas, densitometrie, achtergrond en Rf, automatisch rechtzetten en de
   eiwitladders. De velden en tabellen zijn de componenten in src/tools/gelfoto/; die lezen `gf`
   en worden door window.__gfRefresh bijgewerkt. Achter dit rekenwerk staan de validatiegevallen
   van de editor in tests/validate.py: niet herschrijven. */
import {live} from '../lib/global.js';
import {lkNumIn} from '../lib/bridge.js';
import {libPut} from '../tools/gelfoto/library.js';

/* ================= GELFOTO-EDITOR ================= */
const gf={unit:'bp',disp:'bp',angAuto:true,src:null,rot90:0,fine:0,flip:false,crop:null,inv:false,gray:true,bri:0,con:1,lanes:[],lw:40,ladder:0,ladKey:'100',bands:[],marks:[],mode:null,title:'',fs:18,ang:0,showBp:true,showMk:true,cache:{},drag:null,pend:null,layout:null,persp:null};
const gcv=$('#gf-cv');
/* Elke zin is een eigen vertaalsleutel (S270); een lege zin valt weg. #gf-status staat in een Vue-boom,
   dus de DOM-vertaallaag kwam er nooit: in het Engels bleven deze meldingen eerst Nederlands. */
function gfStatus(...zinnen){ $('#gf-status').textContent=zinnen.filter(Boolean).map(z=>trPlain(z)).join(' '); }
/* De velden van de editor staan in Vue (src/tools/gelfoto/). Zet de motor er zelf een, dan
   gaat dat via de invoer met een input-event erachter: daar reageert v-model op, net als bij
   delen via een link en ongedaan maken. */
function gfSetIn(id,v){ const el=$('#'+id); if(!el) return; el.value=String(v);
  /* de vertaallaag zette de getallen in een invoerveld zelf om; binnen een Vue-boom komt hij
     niet meer, dus doen we het hier voordat v-model de waarde overneemt */
  if(LANG==='en'&&typeof i18nValue==='function'){ el.__iv=null; el.__typed=false; i18nValue(el); }
  el.dispatchEvent(new Event('input',{bubbles:true})); }
function gfLoadCanvas(c){ gf.libId=null; gf.autoLadder=true; gf.ladder=0; gf.src=c; gf.persp=null; gf.rot90=0; gf.fine=0; gf.flip=false; gf.crop=null; gf.lanes=[]; gf.bands=[]; gf.marks=[]; gf.cache={}; gfSetIn('gf-rot',0); gfUpdate(true); }
function gfFromImage(img){ const M=2400, s=Math.min(1,M/Math.max(img.naturalWidth,img.naturalHeight)); const c=document.createElement('canvas'); c.width=Math.round(img.naturalWidth*s); c.height=Math.round(img.naturalHeight*s); c.getContext('2d').drawImage(img,0,0,c.width,c.height); gfLoadCanvas(c); gf.title=''; gfSetIn('gf-title',''); gf.marks=[]; let auto=false; { const bx=gfFindGel(); if(bx&&bx.w*bx.h<0.8*c.width*c.height){ gf.crop=bx; gf.cache={}; auto=true; } } gfDetectLanes(); if(gf.lanes.length>=2) gfDetectBands(); gfMarksTable(); gfStatus(`Geladen: ${img.naturalWidth} × ${img.naturalHeight} px${s<1?' (verkleind voor bewerking)':''}.`, auto?'Gel automatisch bijgesneden (Herstel toont de hele foto).':'', `${gf.lanes.length} lanen gevonden.`, 'Staat de gel scheef? Gebruik "Automatisch rechtzetten".'); }
function gfFile(f){ if(!f) return; const url=URL.createObjectURL(f); const img=new Image(); img.onload=()=>{ gfFromImage(img); URL.revokeObjectURL(url); }; img.onerror=()=>gfStatus('Dit bestand kan de browser niet openen (bijvoorbeeld TIFF). Exporteer de foto als PNG of JPG.'); img.src=url; }
$('#gf-stage').addEventListener('dragover',e=>e.preventDefault());
$('#gf-stage').addEventListener('drop',e=>{ e.preventDefault(); gfFile(e.dataTransfer.files[0]); });
function gfDemo(){
  const W=760,H=520,c=document.createElement('canvas'); c.width=W; c.height=H; const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,0,H); g.addColorStop(0,'#1a1a1a'); g.addColorStop(1,'#0c0c0c'); x.fillStyle=g; x.fillRect(0,0,W,H);
  const Ysz=bp=>50+(3-Math.log10(bp))*360; const nL=9, lx=i=>70+i*(W-140)/(nL-1);
  x.filter='blur(2.2px)';
  for(let i=0;i<nL;i++){ x.fillStyle='rgba(255,255,255,.18)'; x.fillRect(lx(i)-26,28,52,8); }
  const band=(i,bp,a)=>{ x.fillStyle=`rgba(235,255,240,${a})`; x.fillRect(lx(i)-24,Ysz(bp)-3,48,7); };
  [1000,900,800,700,600,500,400,300,200,100].forEach(bp=>band(0,bp,bp===500?0.95:0.6));
  const samples=[[650,.85],[650,.7],[650,.9],[350,.8],[650,.5],[],[650,.8]];
  samples.forEach((s,k)=>{ if(s.length) band(k+1,s[0],s[1]); band(k+1,58,0.22); if(k===4) band(k+1,350,0.35); });
  band(8,58,0.3);
  x.filter='none';
  const id=x.getImageData(0,0,W,H), d=id.data; for(let i=0;i<d.length;i+=4){ const n=(Math.random()-0.5)*14; d[i]=Math.max(0,Math.min(255,d[i]+n)); d[i+1]=Math.max(0,Math.min(255,d[i+1]+n)); d[i+2]=Math.max(0,Math.min(255,d[i+2]+n)); } x.putImageData(id,0,0);
  gfLoadCanvas(c); gfStatus('Demo-gel geladen (getekend). Lanen en ladder zijn automatisch gedetecteerd.');
  gf.title='Demo: PCR-product, 1,5% agarose'; gfSetIn('gf-title',gf.title);
  gfSetIn('gf-n',''); gfDetectLanes(); gf.lanes.forEach((l,i)=>l.label=i===0?'M':i===nL-1?'NTC':String(i)); gfDetectBands(); gfLanesTable();
  if(gf.lanes[1]&&gf.bands.length>1){ const p=gfProc(); const y=gfPeakNear(gf.lanes[1].x,Ysz(650)*p.h/H); gf.marks=[{x:gf.lanes[1].x,y,bp:gfEst(y,gf.lanes[1].x)}]; }
  gfRender(); gfMarksTable();
}
/* processing */
function gfRotated(){
  const k=`${gf.rot90}|${gf.fine}|${gf.flip}|${JSON.stringify(gf.persp)}`; if(gf.cache.rk===k) return gf.cache.rot;
  const s=gfWarped(), a=(gf.rot90*90+gf.fine)*Math.PI/180, cos=Math.abs(Math.cos(a)), sin=Math.abs(Math.sin(a));
  const W=Math.round(s.width*cos+s.height*sin), H=Math.round(s.width*sin+s.height*cos); const c=document.createElement('canvas'); c.width=W; c.height=H; const x=c.getContext('2d');
  const sx=s.getContext('2d'), bd=[sx.getImageData(0,0,s.width,1).data,sx.getImageData(0,s.height-1,s.width,1).data,sx.getImageData(0,0,1,s.height).data,sx.getImageData(s.width-1,0,1,s.height).data]; let r=0,g=0,bb=0,cnt=0; bd.forEach(d=>{ for(let i=0;i<d.length;i+=4){ r+=d[i]; g+=d[i+1]; bb+=d[i+2]; cnt++; } }); x.fillStyle=`rgb(${Math.round(r/cnt)},${Math.round(g/cnt)},${Math.round(bb/cnt)})`; x.fillRect(0,0,W,H);
  x.translate(W/2,H/2); x.rotate(a); if(gf.flip) x.scale(-1,1); x.drawImage(s,-s.width/2,-s.height/2);
  gf.cache.rk=k; gf.cache.rot=c; return c;
}
function gfProc(){
  const k=`${gf.rot90}|${gf.fine}|${gf.flip}|${JSON.stringify(gf.persp)}|${JSON.stringify(gf.crop)}|${gf.inv}|${gf.gray}|${gf.bri}|${gf.con}`; if(gf.cache.pk===k) return gf.cache.proc;
  const r=gfRotated(); const cr=gf.crop||{x:0,y:0,w:r.width,h:r.height};
  const c=document.createElement('canvas'); c.width=Math.max(1,Math.round(cr.w)); c.height=Math.max(1,Math.round(cr.h)); const x=c.getContext('2d'); x.drawImage(r,cr.x,cr.y,cr.w,cr.h,0,0,c.width,c.height);
  const id=x.getImageData(0,0,c.width,c.height), d=id.data, n=c.width*c.height, gray=new Float32Array(n);
  const adj=v=>{ v=v/255; if(gf.inv) v=1-v; v=(v-0.5)*gf.con+0.5+gf.bri/100; return v<0?0:v>1?1:v; };
  let clip=0; for(let i=0,p=0;p<n;i+=4,p++){ const l=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2]; const g=adj(l); gray[p]=g; if((g===0||g===1)&&l>0.5&&l<254.5) clip++; if(gf.gray){ d[i]=d[i+1]=d[i+2]=g*255; } else { d[i]=adj(d[i])*255; d[i+1]=adj(d[i+1])*255; d[i+2]=adj(d[i+2])*255; } }
  x.putImageData(id,0,0);
  const samp=[]; for(let p=0;p<n;p+=29) samp.push(gray[p]); samp.sort((a,b)=>a-b); const med=samp[samp.length>>1];
  const sig=new Float32Array(n); const darkBands=med>0.5; for(let p=0;p<n;p++) sig[p]=darkBands?1-gray[p]:gray[p];
  gf.cache.pk=k; gf.cache.proc={c,w:c.width,h:c.height,sig,darkBands,clip:clip/n}; return gf.cache.proc;
}
/* Verzadigde pixels van de ruwe foto (vóór helderheid/contrast), in dezelfde uitsnede als gfProc().c.
   Heldere banden: kanaal >= 254; donkere banden: kanaal <= 1. Hoeken die het kantelen bijvult tellen mee. */
function gfSat(){
  const k=`${gf.rot90}|${gf.fine}|${gf.flip}|${JSON.stringify(gf.persp)}|${JSON.stringify(gf.crop)}`; if(gf.cache.sk===k) return gf.cache.sat;
  const r=gfRotated(), cr=gf.crop||{x:0,y:0,w:r.width,h:r.height}, dark=gfProc().darkBands;
  const c=document.createElement('canvas'); c.width=Math.max(1,Math.round(cr.w)); c.height=Math.max(1,Math.round(cr.h)); const x=c.getContext('2d'); x.drawImage(r,cr.x,cr.y,cr.w,cr.h,0,0,c.width,c.height);
  const id=x.getImageData(0,0,c.width,c.height), d=id.data, N=c.width*c.height; let n=0;
  for(let i=0;i<d.length;i+=4){ const hit=dark?Math.min(d[i],d[i+1],d[i+2])<=1:Math.max(d[i],d[i+1],d[i+2])>=254; if(hit){ d[i]=255; d[i+1]=0; d[i+2]=200; d[i+3]=217; n++; } else d[i+3]=0; }
  x.putImageData(id,0,0);
  gf.cache.sk=k; gf.cache.sat={c,n,frac:n/N}; return gf.cache.sat;
}
function smooth(a,k){ const h=Math.max(1,Math.round(k)), n=a.length, pre=new Float64Array(n+1); for(let i=0;i<n;i++) pre[i+1]=pre[i]+a[i]; const o=new Float32Array(n); for(let i=0;i<n;i++){ const lo=Math.max(0,i-h), hi=Math.min(n-1,i+h); o[i]=(pre[hi+1]-pre[lo])/(hi-lo+1); } return o; }
function peaks(a,minDist,minProm){ const idx=[]; for(let i=1;i<a.length-1;i++) if(a[i]>=a[i-1]&&a[i]>a[i+1]) idx.push(i);
  const prom=i=>{ let l=i,lm=a[i]; while(l>0&&a[l]<=a[i]){ l--; lm=Math.min(lm,a[l]); if(i-l>minDist*3) break; } let r=i,rm=a[i]; while(r<a.length-1&&a[r]<=a[i]){ r++; rm=Math.min(rm,a[r]); if(r-i>minDist*3) break; } return a[i]-Math.max(lm,rm); };
  const c=idx.map(i=>({i,v:a[i],p:prom(i)})).filter(o=>o.p>=minProm).sort((x,y)=>y.v-x.v); const out=[]; c.forEach(o=>{ if(out.every(q=>Math.abs(q.i-o.i)>=minDist)) out.push(o); }); return out; }
/* kamtanden (putjes) als referentie: zoekt in de bovenste helft een strook met regelmatig herhaalde horizontale randen */
function gfWells(){ const P=gfProc(), {w,h}=P, g0=P.sig; if(w<40||h<40) return null;
  /* licht vervagen tegen ruis, dan verticale gradiënt (bovenkant/onderkant van de putjes) */
  const bl=(src,r)=>{ const t=new Float32Array(w*h), o=new Float32Array(w*h); for(let y=0;y<h;y++){ const row=src.subarray(y*w,(y+1)*w), sm=smooth(row,r); t.set(sm,y*w); } const col=new Float32Array(h); for(let x=0;x<w;x++){ for(let y=0;y<h;y++) col[y]=t[y*w+x]; const sm=smooth(col,r); for(let y=0;y<h;y++) o[y*w+x]=sm[y]; } return o; };
  const g=bl(g0,2), yMax=Math.round(h*0.5), x0=Math.round(w*0.03), x1=Math.round(w*0.97);
  const Ey=(x,y)=>Math.abs(g[(y+1)*w+x]-g[(y-1)*w+x]);
  const R=new Float32Array(yMax); for(let y=1;y<yMax;y++){ let s=0; for(let x=x0;x<x1;x++) s+=Ey(x,y); R[y]=s/(x1-x0); }
  const Rs=smooth(R,h/150), med=[...Rs].sort((a,b)=>a-b)[yMax>>1], hb=Math.max(2,Math.round(h/60)); let best=null;
  for(let yb=Math.max(hb+1,Math.round(h*0.04));yb<yMax-hb-1;yb++){ if(!(Rs[yb]>=Rs[yb-1]&&Rs[yb]>Rs[yb+1]&&Rs[yb]>1.5*med)) continue;
    const C0=new Float32Array(w); for(let y=yb-hb;y<=yb+hb;y++) for(let x=1;x<w-1;x++) C0[x]+=Ey(x,y); const C=smooth(C0,w/200), srt=[...C].sort((a,b)=>a-b), lo=srt[Math.floor(w*0.1)], hi=srt[Math.floor(w*0.9)], t=lo+0.35*(hi-lo);
    const runs=[]; let st=-1; for(let x=0;x<=w;x++){ const on=x<w&&C[x]>t; if(on&&st<0) st=x; if(!on&&st>=0){ const r=runs[runs.length-1]; if(r&&st-r[1]<w/80) r[1]=x-1; else runs.push([st,x-1]); st=-1; } }
    const xs=runs.filter(r=>r[1]-r[0]>w/60).map(r=>(r[0]+r[1])/2); if(xs.length<3) continue;
    const d=[]; for(let i=1;i<xs.length;i++) d.push(xs[i]-xs[i-1]); const ds=[...d].sort((a,b)=>a-b), pm=ds[ds.length>>1], ok=d.filter(v=>Math.abs(v-pm)<0.25*pm).length/d.length;
    const xk=xs.filter((x,i)=>(i>0&&Math.abs(x-xs[i-1]-pm)<0.25*pm)||(i<xs.length-1&&Math.abs(xs[i+1]-x-pm)<0.25*pm)); const sc=ok*xk.length; if(ok>=0.6&&xk.length>=3&&(!best||sc>best.sc)) best={sc,y:yb,xs:xk,pitch:pm}; }
  return best; }
function gfDetectLanes(){
  if(!gf.src) return; const P=gfProc(), {w,h,sig}=P; const prof=new Float32Array(w); const y0=Math.floor(h*0.02), y1=Math.ceil(h*0.98);
  for(let x=0;x<w;x++){ let s=0; for(let y=y0;y<y1;y++) s+=sig[y*w+x]; prof[x]=s/(y1-y0); }
  /* achtergrond (ongelijke belichting) eraf, daarna gladstrijken */
  const bw=Math.max(5,Math.round(w/16)), bl=new Float32Array(w); for(let i=0;i<w;i++){ let m=Infinity; for(let k=Math.max(0,i-bw);k<=Math.min(w-1,i+bw);k++) m=Math.min(m,prof[k]); bl[i]=m; } const bls=smooth(bl,bw/2);
  const sp=smooth(prof.map((v,i)=>Math.max(0,v-bls[i])),Math.max(2,w/160));
  /* ruisniveau uit de onderste helft van het profiel */
  const dif=[]; for(let i=1;i<w;i++) dif.push(Math.abs(sp[i]-sp[i-1])); dif.sort((a,b)=>a-b);
  const noise=(dif[dif.length>>1]||1e-6)*1.4826/Math.SQRT2*Math.sqrt(Math.max(2,w/160)), mx=Math.max(...sp);
  const thr=Math.max(5*noise,0.03*mx), med=0;
  const N=Math.round(num($('#gf-n').value));
  const refine=(i,rad)=>{ const a=Math.max(0,Math.round(i-rad)), b=Math.min(w-1,Math.round(i+rad)); let lo=Infinity; for(let k=a;k<=b;k++) lo=Math.min(lo,sp[k]); const half=(sp[i]+lo)/2; let l=i,r=i; while(l>a&&sp[l-1]>half) l--; while(r<b&&sp[r+1]>half) r++; return {x:(l+r)/2,v:sp[i],wd:r-l}; };
  const WL=gfWells(); gf.wells=WL;
  let cand=peaks(sp,w/45,thr).filter(o=>o.v>=thr&&o.i>w*0.015&&o.i<w*0.985).map(o=>refine(o.i,w/30));
  cand.sort((a,b)=>a.x-b.x);
  /* kamregel: lanen liggen op gelijke afstand. Herhaalafstand via autocorrelatie, daarna een rooster over de gel leggen */
  let pitch=NaN;
  { const pos=[...sp].filter(v=>v>thr).sort((a,b)=>a-b), cap=(pos[pos.length>>1]||thr)*1.6, sc=sp.map(v=>Math.min(v,cap)); /* dempt de felle ladder */
    const m=sc.reduce((a,b)=>a+b,0)/w, lo=Math.max(4,Math.round(w/40)), hi=Math.round(w/2.5); let bestL=0,bestV=-Infinity;
    const ac=l=>{ let v=0; for(let i=0;i+l<w;i++) v+=(sc[i]-m)*(sc[i+l]-m); return v/(w-l); };
    const acs=[]; for(let l=lo;l<=hi;l++) acs.push([l,ac(l)]);
    const gmaxA=Math.max(...acs.map(a=>a[1])); /* eerste duidelijke lokale top = grondperiode (latere toppen zijn veelvouden) */
    for(let k=1;k<acs.length-1;k++) if(acs[k][1]>acs[k-1][1]&&acs[k][1]>=acs[k+1][1]&&acs[k][1]>=0.5*gmaxA&&acs[k][1]>0){ bestV=acs[k][1]; bestL=acs[k][0]; break; }
    if(bestL&&cand.length>=2){ /* verfijn met de kandidaten zelf */ const d=[]; for(let i=1;i<cand.length;i++){ const g=cand[i].x-cand[i-1].x, k=Math.round(g/bestL); if(k>=1&&Math.abs(g/k-bestL)<0.2*bestL) d.push(g/k); } pitch=d.length?d.reduce((a,b)=>a+b,0)/d.length:bestL; } }
  if(WL&&!(isFinite(pitch)&&cand.length>=2)){ pitch=WL.pitch; cand=WL.xs.map(wx=>{ const near=cand.filter(c=>Math.abs(c.x-wx)<pitch*0.25)[0]; return near?{...near,x:(near.x+wx)/2,well:true}:{x:wx,v:0,well:true}; }); }
  else if(isFinite(pitch)&&cand.length>=2){
    const at=x=>{ const i=Math.max(0,Math.min(w-1,Math.round(x))); return sp[i]; };
    /* zwaartepunt van elke lane binnen een halve kamafstand: stabiel bij platte, brede banden */
    const cen=x=>{ const a=Math.max(0,Math.round(x-0.45*pitch)), b=Math.min(w-1,Math.round(x+0.45*pitch)); let lo=Infinity; for(let k=a;k<=b;k++) lo=Math.min(lo,sp[k]); let sw=0,sx=0; for(let k=a;k<=b;k++){ const v=sp[k]-lo; sw+=v; sx+=v*k; } return sw>0?sx/sw:x; };
    cand.forEach(c=>{ c.x=cen(cen(c.x)); });
    for(let i=1;i<cand.length;i++){ if(cand[i].x-cand[i-1].x<0.55*pitch){ const drop=cand[i].v<cand[i-1].v?i:i-1; cand.splice(drop,1); i--; } }
    let x0b=0,sb=-Infinity; for(let x0=0;x0<pitch;x0+=0.5){ let sc=0; for(let x=x0;x<w;x+=pitch) sc+=at(x); if(sc>sb){sb=sc;x0b=x0;} }
    { const on=cand.filter(c=>{ const k=Math.round((c.x-x0b)/pitch); return Math.abs(c.x-(x0b+k*pitch))<0.3*pitch; });
      if(on.length>=3){ const r=linreg(on.map(c=>Math.round((c.x-x0b)/pitch)),on.map(c=>c.x)); if(r.b>0.85*pitch&&r.b<1.15*pitch){ pitch=r.b; x0b=((r.a%pitch)+pitch)%pitch; } } }
    const all=[]; for(let x=x0b;x<w;x+=pitch) all.push(x);
    if(WL&&Math.abs(WL.pitch-pitch)<0.2*pitch){ /* putjes zijn het betrouwbaarste rooster: vervang roosterpunten door putjescentra */ WL.xs.forEach(wx=>{ let k=-1,bd=0.4*pitch; all.forEach((gx,i)=>{ const d=Math.abs(gx-wx); if(d<bd){bd=d;k=i;} }); if(k>=0) all[k]=wx; else all.push(wx); }); all.sort((a,b)=>a-b); }
    const isW=gx=>WL&&WL.xs.some(wx=>Math.abs(wx-gx)<0.05*pitch);
    const snap=all.map(gx=>{ const near=cand.filter(c=>Math.abs(c.x-gx)<pitch*0.25).sort((a,b)=>Math.abs(a.x-gx)-Math.abs(b.x-gx))[0]; if(isW(gx)) return near?{...near,x:(near.x+gx)/2,well:true}:{x:gx,v:0,well:true}; return near?{...near}:{x:gx,v:0,fill:true}; });
    const sup=snap.map((c,i)=>c.fill?-1:i).filter(i=>i>=0);
    cand=sup.length?snap.slice(sup[0],sup[sup.length-1]+1):cand;
  }
  if(N>0){
    if(cand.length>N){ cand=cand.slice().sort((a,b)=>b.v-a.v).slice(0,N).sort((a,b)=>a.x-b.x); }
    while(cand.length<N&&isFinite(pitch)&&cand.length){ const L=cand[0].x-pitch, R=cand[cand.length-1].x+pitch; const roomL=L>pitch*0.35, roomR=R<w-pitch*0.35; if(!roomL&&!roomR) break; const sL=roomL?sp[Math.round(L)]:-1, sR=roomR?sp[Math.round(R)]:-1; if(sR>=sL) cand.push({x:R,v:0,fill:true}); else cand.unshift({x:L,v:0,fill:true}); }
  }
  const xs=cand.map(c=>c.x), filledN=cand.filter(c=>c.fill).length;
  const wds=cand.filter(c=>!c.fill&&c.wd>2).map(c=>c.wd).sort((a,b)=>a-b);
  gf.lw=Math.round(isFinite(pitch)?Math.min(pitch*0.7,(wds[wds.length>>1]||pitch*0.6)*1.1):(wds[wds.length>>1]||40));
  const old=gf.lanes; gf.lanes=xs.map((x,i)=>({x,label:old[i]?old[i].label:(i===0?'M':String(i)),lad:old[i]?!!old[i].lad:false}));
  gf.lw=Math.max(4,Math.min(200,gf.lw||40)); gfSetIn('gf-lw',gf.lw);
  gf.ladder=Math.min(gf.ladder,Math.max(0,gf.lanes.length-1));
  const nW=cand.filter(c=>c.well).length;
  gfStatus(`${gf.lanes.length} lanen gevonden${nW?` (${nW} via de putjes van de kam)`:''}${filledN?` (waarvan ${filledN} lege lane${filledN>1?'n':''} aangevuld op basis van de vaste tussenafstand)`:''}.`, N>0?'':'Klopt het aantal niet? Vul het verwachte aantal in en detecteer opnieuw.');
  gfLanesTable(); gfRender();
}
function laneProfile(cx){ const P=gfProc(), {w,h,sig}=P; const half=Math.max(1,Math.round(gf.lw*0.3)); const x0=Math.max(0,Math.round(cx-half)), x1=Math.min(w-1,Math.round(cx+half)); const pr=new Float32Array(h); for(let y=0;y<h;y++){ let s=0; for(let x=x0;x<=x1;x++) s+=sig[y*w+x]; pr[y]=s/(x1-x0+1); }
  const win=Math.max(5,Math.round(h/12)); const base=new Float32Array(h); for(let y=0;y<h;y++){ let m=Infinity; for(let k=Math.max(0,y-win);k<=Math.min(h-1,y+win);k++) m=Math.min(m,pr[k]); base[y]=m; } const bs=smooth(base,win/2); return smooth(pr.map((v,i)=>v-bs[i]),Math.max(1,h/300)); }
function gfPeakNear(cx,y){ const pr=laneProfile(cx); const r=Math.round(gfProc().h/40); let best=Math.round(y); for(let k=Math.max(0,Math.round(y)-r);k<=Math.min(pr.length-1,Math.round(y)+r);k++) if(pr[k]>pr[best]) best=k; return best; }
function gfLadder(){ if(gf.ladKey==='custom'){ const el=$('#gf-ladc'); return nums((el?el.value:'').replace(/;/g,' ')).filter(v=>v>0).sort((a,b)=>b-a); } return LADDERS[gf.ladKey]; }
function gfWellRows(){ const h=gfProc().h, ys=[]; if(gf.wells&&isFinite(gf.wells.y)) for(let k=0;k<Math.max(3,gf.lanes.length);k++) ys.push(gf.wells.y); gf.lanes.forEach(l=>{ const pr=laneProfile(l.x), m=Math.max(...pr); peaks(pr,h/90,0.1*m).filter(o=>o.i<h*0.25).forEach(o=>ys.push(o.i)); });
  const rows=[]; ys.sort((a,b)=>a-b).forEach(y=>{ const r=rows.find(r=>Math.abs(r.y-y)<h/60); if(r){ r.n++; r.y=(r.y*(r.n-1)+y)/r.n; } else rows.push({y,n:1}); });
  return rows.filter(r=>gf.lanes.length>=3&&r.n>=Math.max(3,gf.lanes.length*0.6)).map(r=>r.y); }
const nearWell=(y,wells)=>wells.some(w=>Math.abs(w-y)<gfProc().h/50);
/* banden zoeken in één ladderlane; geeft de banden terug (bovenste = grootste) */
function gfFindLadder(k){ const L=gf.lanes[k]; const pr=laneProfile(L.x); const h=pr.length; const lad=gfLadder(); const wells=gfWellRows();
  const okY=o=>o.i>h*0.02&&o.i<h*0.96&&!nearWell(o.i,wells)&&!(wells.length&&o.i<Math.min(...wells));
  let mx=0; for(let i=0;i<h;i++) if(okY({i})&&pr[i]>mx) mx=pr[i]; if(!(mx>0)) mx=Math.max(...pr);
  let pk=peaks(pr,h/90,0.08*mx).filter(okY).sort((a,b)=>a.i-b.i);
  if(pk.length<lad.length){ const pk2=peaks(pr,h/220,0.06*mx).filter(okY).sort((a,b)=>a.i-b.i); if(pk2.length>pk.length) pk=pk2; }
  const n=lad.length, ms=stNums($('#gf-lmass').value); const one=(o,i)=>({y:o.i,bp:lad[i]});
  const merged=(o,idx)=>{ const parts=idx.map(i=>({y:o.i,bp:lad[i]})); return {y:o.i,bp:NaN,lab:idx.map(i=>gfLab(lad[i])).join('/'),merged:parts}; };
  /* referentieband (bijv. 3 kb met extra massa): de felste band bepaalt de koppeling; erboven samengeperste banden worden samengevoegd */
  if(ms.length===n&&pk.length>=3){ const sm=[...ms].sort((a,b)=>a-b), r=ms.indexOf(Math.max(...ms));
    if(ms[r]>=1.8*sm[n>>1]){ const pR=pk.reduce((b,o,i)=>o.v>pk[b].v?i:b,0); const out=[one(pk[pR],r)];
      const below=pk.slice(pR+1); for(let j=0;j<below.length&&r+1+j<n;j++) out.push(one(below[j],r+1+j));
      const above=pk.slice(0,pR).reverse(); for(let j=0;j<above.length;j++){ const li=r-1-j; if(li<0) break; if(j===above.length-1&&li>0) out.push(merged(above[j],Array.from({length:li+1},(_,q)=>q))); else out.push(one(above[j],li)); }
      return out.sort((a,b)=>a.y-b.y); } }
  if(pk.length>n){ /* kies de reeks die het best op het ladderpatroon past (log bp lineair met afstand) */
    const cands=pk.slice().sort((a,b)=>b.v-a.v).slice(0,n+6).sort((a,b)=>a.i-b.i); let best=null;
    for(let st=0;st+n<=cands.length;st++){ const win=cands.slice(st,st+n); const r=linreg(win.map(o=>o.i),lad.map(v=>Math.log10(v))); const score=r.r2+0.02*Math.min(...win.map(o=>o.v))/mx; if(r.b<0&&(!best||score>best.score)) best={win,score}; }
    pk=best?best.win:pk.sort((a,b)=>b.v-a.v).slice(0,n).sort((a,b)=>a.i-b.i); return pk.map(one); }
  if(pk.length<n&&pk.length>=3){ /* te weinig banden: kies de uitlijning met de rechtste ijklijn; wat bovenaan overblijft wordt één samengevoegde band */
    const miss=n-pk.length; let best=null;
    for(let o=0;o<=miss;o++){ const idx=pk.map((_,j)=>n-1-o-(pk.length-1-j)); const use=pk.slice(1).map((p,j)=>[p.i,Math.log10(lad[idx[j+1]])]); const r=linreg(use.map(u=>u[0]),use.map(u=>u[1])); if(r.b<0&&(!best||r.r2>best.r2)) best={o,idx,r2:r.r2}; }
    if(best){ const out=pk.map((p,j)=>j>0?one(p,best.idx[j]):(best.idx[0]>0?merged(p,Array.from({length:best.idx[0]+1},(_,q)=>q)):one(p,0))); return out; } }
  return pk.map((o,i)=>({y:o.i,bp:lad[i]??NaN})); }
function gfDetectBandsFor(k){ const L=gf.lanes[k]; if(!L) return; L.lad=true; L.bands=gfFindLadder(k); if(k===gf.ladder) gf.bands=L.bands; }
function gfDetectBands(){
  if(!gf.lanes.length){ gfStatus('Detecteer eerst de lanen.'); return; }
  const lad=gfLadder(); if(!lad||!lad.length){ gfStatus('Vul de bandgroottes van je ladder in.'); return; }
  if(gf.autoLadder){ /* ladderlanen: de lanen met duidelijk de meeste banden (een gel kan meer dan één ladder hebben) */
    const n=gf.lanes.map(l=>{ const pr=laneProfile(l.x), m=Math.max(...pr); return peaks(pr,pr.length/150,0.12*m).filter(o=>o.i>pr.length*0.04).length; }); const top=Math.max(...n);
    gf.lanes.forEach((l,i)=>{ l.lad=n[i]>=Math.max(4,0.6*top); l.bands=null; }); let best=n.indexOf(top); gf.ladder=best; gf.lanes[best].lad=true; gf.autoLadder=false;
    if(gf.lanes.every((l,i)=>l.label===(i===0?'M':String(i))||l.label===String(i+1)||(i===gf.lanes.length-1&&l.label==='NTC'))){ let c=0; const ntc=gf.lanes.length>2&&gf.lanes[gf.lanes.length-1].label==='NTC'; gf.lanes.forEach((l,i)=>{ l.label=l.lad?'M':(ntc&&i===gf.lanes.length-1?'NTC':String(++c)); }); } }
  if(!gf.lanes.some(l=>l.lad)&&gf.lanes[gf.ladder]) gf.lanes[gf.ladder].lad=true;
  gf.lanes.forEach((l,k)=>{ if(l.lad) l.bands=gfFindLadder(k); });
  gf.bands=gf.lanes[gf.ladder].bands; const nL=gf.lanes.filter(l=>l.lad).length, pkn=gf.bands.length;
  gfStatus((pkn===lad.length?`${pkn} ladderbanden gevonden en gekoppeld aan de ladder (bovenste band = grootste).`:`${pkn} banden gevonden, ladder heeft er ${lad.length}. Controleer de waarden in de tabel, verwijder of voeg banden toe.`)+(nL>1?` ${nL} ladderlanen: metingen worden tussen de ladders geïnterpoleerd.`:''));
  gf.marks.forEach(m=>m.bp=gfEst(m.y,m.x)); gfLanesTable(); gfBandsTable(); gfMarksTable(); gfRender();
}
function gfEst(y,x){ gfSyncBands(); const L=gf.lanes.filter(l=>l.lad&&(l.bands||[]).filter(b=>isFinite(b.bp)&&b.bp>0).length>=2).sort((a,b)=>a.x-b.x);
  if(L.length<2||x==null) return gfEst1(L.length===1?L[0].bands:gf.bands,y);
  /* meerdere ladders: schatting per ladder, lineair in log(bp) tussen de twee ladderlanen die de lane omsluiten */
  if(x<=L[0].x) return gfEst1(L[0].bands,y); if(x>=L[L.length-1].x) return gfEst1(L[L.length-1].bands,y);
  let i=0; while(i<L.length-2&&x>L[i+1].x) i++; const a=gfEst1(L[i].bands,y), b=gfEst1(L[i+1].bands,y); if(!(a>0)||!(b>0)) return a>0?a:b; const t=(x-L[i].x)/(L[i+1].x-L[i].x); return 10**(Math.log10(a)+t*(Math.log10(b)-Math.log10(a))); }
/* buiten het bereik van de ladder is de schatting een extrapolatie: toon dan < kleinste of > grootste ladderband */
function gfRange(){ gfSyncBands(); const v=[]; gf.lanes.forEach(l=>{ if(l.lad) (l.bands||[]).forEach(b=>{ if(isFinite(b.bp)&&b.bp>0) v.push(b.bp); (b.merged||[]).forEach(q=>{ if(isFinite(q.bp)) v.push(q.bp); }); }); }); return v.length?[Math.min(...v),Math.max(...v)]:[NaN,NaN]; }
function gfSizeTxt(v){ if(!isFinite(v)) return '–'; const [a,b]=gfRange(); if(v<a*0.97) return '< '+gfFmtSize(a); if(v>b*1.03) return '> '+gfFmtSize(b); return gfFmtSize(v); }
function gfSyncBands(){ const A=gf.lanes[gf.ladder]; if(A){ A.bands=gf.bands; A.lad=true; } }
function gfSetActive(i){ gfSyncBands(); if(!gf.lanes[i]) return; gf.ladder=i; gf.lanes[i].lad=true; gf.bands=gf.lanes[i].bands||(gf.lanes[i].bands=[]); gfLanesTable(); gfBandsTable(); gfRender(); }
function gfEst1(bands,y){ const b=(bands||[]).filter(b=>isFinite(b.bp)&&b.bp>0).sort((a,c)=>a.y-c.y); if(b.length<2) return NaN; let i=0; while(i<b.length-2&&y>b[i+1].y) i++; const p=b[i],q=b[i+1]; if(q.y===p.y) return NaN; const t=(y-p.y)/(q.y-p.y); return 10**(Math.log10(p.bp)+t*(Math.log10(q.bp)-Math.log10(p.bp))); }
/* tables */
/* De lanen staan in src/tools/gelfoto/GfLanes.vue; hier alleen de haak die hem opwerkt. */
function gfLanesTable(){ if(window.__gfRefresh) window.__gfRefresh(); }
/* een lane aan- of afvinken als ladderlane. Er moet er altijd minstens één zijn; de
   component rendert het vinkje uit gf.lanes, dus bij een weigering valt het vinkje terug. */
function gfLaneLad(k,on){ const l=gf.lanes[k]; if(!l) return; gfSyncBands();
  if(on){ l.lad=true; if(!(l.bands&&l.bands.length)) gfDetectBandsFor(k); gfSetActive(k); }
  else { l.lad=false; if(k===gf.ladder){ const o=gf.lanes.findIndex((m,j)=>j!==k&&m.lad); if(o>=0){ gf.ladder=o; gf.bands=gf.lanes[o].bands||[]; } else { l.lad=true; gfLanesTable(); gfStatus('Er moet minstens één ladderlane zijn.'); return; } } gfLanesTable(); gfBandsTable(); }
  gf.marks.forEach(m=>m.bp=gfEst(m.y,m.x)); gfMarksTable(); gfRender(); }
function gfLaneDel(k){ gfSyncBands(); const act=gf.lanes[gf.ladder]; gf.lanes.splice(k,1); let i=gf.lanes.indexOf(act); if(i<0) i=Math.max(0,gf.lanes.findIndex(l=>l.lad)); gf.ladder=i; gf.bands=gf.lanes[i]?(gf.lanes[i].bands||[]):[]; gfLanesTable(); gfBandsTable(); gf.marks.forEach(m=>m.bp=gfEst(m.y,m.x)); gfMarksTable(); gfRender(); }
function gfBandTxt(b){ return b.lab&&String(b.lab).trim()?String(b.lab).trim():gfLab(b.bp); }
/* De banden staan in src/tools/gelfoto/GfBands.vue; gfSyncBands() houdt de banden van de
   actieve lane en gf.bands gelijk, zoals eerst. */
function gfBandsTable(){ gfSyncBands(); if(window.__gfRefresh) window.__gfRefresh(); }
function gfBandBp(i,v){ if(!gf.bands[i]) return; gf.bands[i].bp=v; gf.marks.forEach(m=>m.bp=gfEst(m.y,m.x)); gfMarksTable(); gfRender(); }
function gfMergeBands(i){ const a=gf.bands[i], b=gf.bands[i+1]; if(!a||!b) return; const parts=[a,b].map(gfBandTxt).filter(t=>t&&t!=='–'); gf.bands.splice(i,2,{y:(a.y+b.y)/2,bp:NaN,lab:parts.join('/'),merged:[...(a.merged||[a]),...(b.merged||[b])]}); }
function gfSplitBand(i){ const m=gf.bands[i]; if(!m||!m.merged) return; gf.bands.splice(i,1,...m.merged.map(o=>({...o}))); gf.bands.sort((p,q)=>p.y-q.y); }
/* samenvoegen, splitsen en weghalen; de knoppen zitten in GfBands.vue */
function gfBandMerge(i){ gfMergeBands(i); gfBandsAfter(); }
function gfBandSplit(i){ gfSplitBand(i); gfBandsAfter(); }
function gfBandDel(i){ gf.bands.splice(i,1); gfBandsAfter(); }
function gfBandsAfter(){ gf.marks.forEach(m=>m.bp=gfEst(m.y,m.x)); gfBandsTable(); gfMarksTable(); gfRender(); }
/* De gemeten banden staan in src/tools/gelfoto/GfMarks.vue; hier wordt alleen de
   intensiteit bijgewerkt en de component opgetikt. */
function gfMarksTable(){ gfMarkInt(); if(window.__gfRefresh) window.__gfRefresh(); }
/* render */
const gfFmtSize=v=>!isFinite(v)?'–':gf.disp==='kb'?(v/1000).toLocaleString('nl-NL',{maximumFractionDigits:v<10000?2:1}):gf.unit==='kDa'?NL(Number(v.toPrecision(3)),v<10?1:0):Math.round(v).toLocaleString('nl-NL');
/* weergave-eenheid: bp/kDa = maat zoals de ladder, kb = bp/1000, ng = hoeveelheid uit de massaladder */
const gfDU=()=>gf.disp==='ng'?'ng':gf.disp==='kb'?'kb':gf.unit;
function gfLadNg(v){ const lad=gfLadder()||[], ms=stNums($('#gf-lmass').value), load=num($('#gf-lload').value)||500, i=lad.indexOf(Math.round(v)); return i>=0&&isFinite(ms[i])?ms[i]*load/500:NaN; }
function gfMarkNg(m){ const sl=gfMassSlope(); if(m.int==null) m.int=gfIntensity(m.x,m.y); const v=(m.int||0)/sl; return isFinite(v)&&v>0?v:NaN; }
const gfNgTxt=v=>!isFinite(v)?'–':fmt(v,v<10?1:0);
const gfLab=v=>{ if(gf.disp==='ng'){ const n=gfLadNg(v); return isFinite(n)?gfNgTxt(n):'–'; } return gf.disp==='kb'?gfFmtSize(v):gf.unit==='kDa'?NL(v,1):String(Math.round(v)); };
function gxOpts(){ const g=id=>{ const el=$('#'+id); return !!(el&&el.checked); }; return {integ:g('gx-integ'),title:g('gx-title'),lanes:g('gx-lanes'),bp:g('gx-bp'),ticks:g('gx-ticks'),unit:g('gx-unit'),marks:g('gx-marks'),pad:g('gx-pad'),mcol:$('#gx-mcol').value,help:g('gf-help')}; }
/* ===== ladder uit foto ===== */
function gfLadAnalyze(c){ const w=c.width, h=c.height, d=c.getContext('2d').getImageData(0,0,w,h).data, L=new Float32Array(w*h); for(let i=0;i<w*h;i++) L[i]=(0.299*d[i*4]+0.587*d[i*4+1]+0.114*d[i*4+2])/255;
  /* drempel donker/licht via Otsu: gelachtergrond kan zwart of grijs zijn */ const hist=new Array(256).fill(0); for(let i=0;i<w*h;i++) hist[Math.min(255,Math.round(L[i]*255))]++; let sum=0; for(let i=0;i<256;i++) sum+=i*hist[i]; let sb=0,wb=0,bv=-1,ot=90; for(let i=0;i<256;i++){ wb+=hist[i]; if(!wb) continue; const wf=w*h-wb; if(!wf) break; sb+=i*hist[i]; const v=wb*wf*(sb/wb-(sum-sb)/wf)**2; if(v>bv){ bv=v; ot=i; } } const TD=Math.min(0.6,Math.max(0.3,ot/255)), TE=Math.min(0.7,TD+0.1);
  const dc=new Float32Array(w); for(let x=0;x<w;x++){ let n=0; for(let y=0;y<h;y++) if(L[y*w+x]<TD) n++; dc[x]=n/h; } const ds=smooth(dc,2);
  const minW=Math.max(10,w*0.012), runs=[]; let st=-1; for(let x=0;x<=w;x++){ const on=x<w&&ds[x]>0.3; if(on&&st<0) st=x; if(!on&&st>=0){ if(x-st>=minW) runs.push([st,x-1]); st=-1; } }
  const lanes=[];
  runs.forEach(([a,b])=>{ /* langste donkere strook in de hoogte (tekst valt af door de witte regels ertussen) */
    const rd=new Uint8Array(h), ew=Math.max(2,Math.round((b-a)*0.05)); for(let y=0;y<h;y++){ let n=0,sl=0,sr=0; for(let x=a;x<=b;x++) if(L[y*w+x]<TD) n++; for(let k=0;k<ew;k++){ sl+=L[y*w+a+k]; sr+=L[y*w+b-k]; } rd[y]=n/(b-a+1)>0.12&&(sl/ew<TE||sr/ew<TE||n/(b-a+1)>0.5)?1:0; }
    const gap=Math.max(8,Math.round(h*0.012)); let last=-1e9; for(let y=0;y<h;y++){ if(rd[y]){ if(y-last>1&&y-last<=gap) for(let k=last+1;k<y;k++) rd[k]=1; last=y; } }
    let by0=0,bl=0,cs=-1; for(let y=0;y<=h;y++){ const on=y<h&&rd[y]; if(on&&cs<0) cs=y; if(!on&&cs>=0){ if(y-cs>bl){ bl=y-cs; by0=cs; } cs=-1; } }
    if(bl<h*0.3) return; let ya=by0, yb=by0+bl-1; const df=y=>{ let n=0; for(let x=a;x<=b;x++) if(L[y*w+x]<TD) n++; return n/(b-a+1); }; while(yb>ya+20&&df(yb)<0.5) yb--; while(ya<yb-20&&df(ya)<0.5) ya++; const y0=ya+3, y1=yb-3; if(y1-y0<20) return;
    const E=new Float32Array(b-a+1); for(let x=a;x<=b;x++){ let s=0; for(let y=y0;y<y1;y++) s+=Math.abs(L[(y+1)*w+x]-L[y*w+x]); E[x-a]=s/(y1-y0); } const Es=smooth(E,1), mx=Math.max(...Es);
    const grp=[]; let g=null; for(let i=0;i<Es.length;i++){ if(Es[i]>0.4*mx){ if(g&&i-g[1]<=Math.max(3,(b-a)*0.25)) g[1]=i; else { g=[i,i]; grp.push(g); } } }
    grp.filter(g=>g[1]-g[0]>=4).forEach(([g0,g1])=>{ const la=a+g0, lb=a+g1, c0=Math.round(la+(lb-la)*0.2), c1=Math.round(lb-(lb-la)*0.2);
      const pr=new Float32Array(y1-y0+1); for(let y=y0;y<=y1;y++){ let s=0; for(let x=c0;x<=c1;x++) s+=L[y*w+x]; pr[y-y0]=s/(c1-c0+1); }
      const win=Math.max(10,Math.round(h/24)), base=new Float32Array(pr.length); for(let i=0;i<pr.length;i++){ let m=Infinity; for(let k=Math.max(0,i-win);k<=Math.min(pr.length-1,i+win);k++) m=Math.min(m,pr[k]); base[i]=m; }
      const p=smooth(pr.map((v,i)=>v-base[i]),1), pm=Math.max(...p); if(!(pm>0.03)) return;
      const md=Math.max(3,Math.round(h/200)), pw=Math.max(12,Math.round(h/30)), cand=[]; const eg=Math.max(4,Math.round(p.length*0.01)); for(let i=eg;i<p.length-eg;i++){ if(!(p[i]>=p[i-1]&&p[i]>p[i+1]&&p[i]>0.12*pm)) continue; let lm=p[i],rm=p[i]; for(let k=i-1;k>=Math.max(0,i-pw)&&p[k]<=p[i];k--) lm=Math.min(lm,p[k]); for(let k=i+1;k<=Math.min(p.length-1,i+pw)&&p[k]<=p[i];k++) rm=Math.min(rm,p[k]); if(p[i]-Math.max(lm,rm)>0.1*pm) cand.push({i,v:p[i]}); }
      const keep=[]; cand.sort((q,r)=>r.v-q.v).forEach(o=>{ if(keep.every(q=>Math.abs(q.i-o.i)>=md)) keep.push(o); }); const bands=keep.sort((q,r)=>q.i-r.i).map(o=>({y:o.i,v:o.v}));
      if(bands.length>=3) lanes.push({x0:la,x1:lb,ra:a,rb:b,y0,y1,bands}); }); });
  return lanes; }
function gfFitQ(ys,xs){ const n=ys.length, D=n>=7?4:3, mx=mean(xs), sx=Math.max(1e-9,Math.max(...xs)-Math.min(...xs)), u=xs.map(v=>(v-mx)/sx); const S=Array.from({length:D},()=>new Array(D).fill(0)), t=new Array(D).fill(0);
  for(let i=0;i<n;i++){ const v=Array.from({length:D},(_,k)=>u[i]**k); for(let r=0;r<D;r++){ t[r]+=v[r]*ys[i]; for(let c=0;c<D;c++) S[r][c]+=v[r]*v[c]; } } const M=invMat(S); if(!M) return 1; const co=M.map(row=>row.reduce((a,m,k)=>a+m*t[k],0)); let e=0; for(let i=0;i<n;i++){ let f=0; for(let k=0;k<D;k++) f+=co[k]*u[i]**k; e+=(ys[i]-f)**2; } return Math.sqrt(e/n)/((Math.max(...ys)-Math.min(...ys))||1); }
function gfCorr(a,b){ const n=a.length, ma=mean(a), mb=mean(b); let s=0,sa=0,sb=0; for(let i=0;i<n;i++){ s+=(a[i]-ma)*(b[i]-mb); sa+=(a[i]-ma)**2; sb+=(b[i]-mb)**2; } return sa>0&&sb>0?s/Math.sqrt(sa*sb):0; }
/* patroonherkenning: per ladder de beste uitlijning; score = kwadratische fit van positie op log(grootte), straf voor ontbrekende/extra banden, bonus als felle banden op de referentiebanden vallen */
function gfLadMatch(bands){ const ys=bands.map(b=>b.y), vs=bands.map(b=>b.v), n=ys.length, out=[]; if(n<4) return out;
  Object.keys(LADDERS).filter(k=>!ladProt(k)).forEach(k=>{ const S=LADDERS[k], m=S.length, ls=S.map(v=>Math.log10(v)), M=LMASS[k]?stNums(LMASS[k]):null; let best=null;
    const tryA=(yy,vv,ll,MM,pen,assign)=>{ const e=gfFitQ(yy,ll); const c=MM&&MM.length===vv.length?gfCorr(vv,MM):null; const sc=1-10*e-pen+(c==null?0:0.15*(c-0.5)); if(!best||sc>best.score) best={key:k,score:sc,assign}; };
    if(n>=m){ for(let st=0;st+m<=n;st++) tryA(ys.slice(st,st+m),vs.slice(st,st+m),ls,M,0.1*(n-m),ys.map((_,i)=>i>=st&&i<st+m?S[i-st]:NaN)); }
    else { for(let st=0;st+n<=m;st++) tryA(ys,vs,ls.slice(st,st+n),M?M.slice(st,st+n):null,0.06*(m-n),ys.map((_,i)=>S[st+i])); }
    if(best) out.push(best); });
  return out.sort((a,b)=>b.score-a.score); }
function gfVlLoad(img){ const M=1400, sc=Math.min(1,M/Math.max(img.naturalWidth,img.naturalHeight)), c=document.createElement('canvas'); c.width=Math.round(img.naturalWidth*sc); c.height=Math.round(img.naturalHeight*sc); const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,c.width,c.height); x.drawImage(img,0,0,c.width,c.height);
  const lanes=gfLadAnalyze(c); gf.vl={src:c,lanes,li:0,show:true,pick:-1,info:''}; if(!lanes.length){ gf.vl.err=true; gf.vl.info='Geen ladderbaan gevonden. Gebruik een afbeelding met de ladder op een donkere achtergrond.'; if(window.__gfRefresh) window.__gfRefresh(); gfRender(); return; }
  gfVlChoose(0); }
/* een foto kiezen (de invoer staat in GfVirtual.vue) */
function gfVlFile(f){ if(!f) return; const url=URL.createObjectURL(f), img=new Image(); img.onload=()=>{ gfVlLoad(img); URL.revokeObjectURL(url); }; img.onerror=()=>{ gf.vl={src:null,lanes:[],err:true,info:'Dit bestand kan de browser niet openen. Gebruik PNG of JPG.'}; if(window.__gfRefresh) window.__gfRefresh(); }; img.src=url; }
function gfVlClear(){ gf.vl=null; const f=$('#gf-vlfile'); if(f) f.value=''; if(window.__gfRefresh) window.__gfRefresh(); gfRender(); }
/* in het voorbeeld op een andere ladderbaan klikken */
function gfVlPick(e){ const v=gf.vl; if(!v||!v.lanes) return; const cv=e.target, r=cv.getBoundingClientRect(), sc=cv.width/v.src.width*(r.width/cv.width), px=(e.clientX-r.left)/sc;
  let bi=-1,bd=Infinity; v.lanes.forEach((L,i)=>{ const d=px<L.x0?L.x0-px:px>L.x1?px-L.x1:0; if(d<bd){bd=d;bi=i;} }); if(bi>=0&&bi!==v.li){ v.sizes=null; gfVlChoose(bi); } }
/* zelf groottes intikken: dan is het een eigen ladder */
function gfVlSizes(txt){ const v=gf.vl; if(!v) return; const t=String(txt).trim().split(/[\s;]+/).filter(Boolean).map(q=>/^[–-]$/.test(q)?NaN:num(q)); const L=v.lanes[v.li]; v.sizes=L.bands.map((_,j)=>t[j]??NaN); v.key='custom'; v.pick=-1; v.cache=null; if(window.__gfRefresh) window.__gfRefresh(); gfVlPreview(); gfRender(); }
/* de herkende groottes als ladder voor de detectie gebruiken */
function gfVlUse(){ const v=gf.vl; if(!v) return; const sizes=(v.sizes||[]).filter(b=>isFinite(b)&&b>0); if(sizes.length<2){ gfStatus('Vul eerst minstens twee bandgroottes in.'); return; }
  const k=v.key&&v.key!=='custom'&&LADDERS[v.key]&&LADDERS[v.key].join()===sizes.join()?v.key:null;
  const key=k||(v.key&&LADDERS[v.key]?v.key:'custom'), vm=window.__gfLadVm; if(!vm) return;
  /* de keuzelijst staat in GfLadder.vue, en bij een eigen ladder zet Vue het veld voor de
     groottes er pas bij de volgende render neer; daarna pas opnieuw detecteren */
  vm.setLadder(key,sizes.join(' '),()=>{ if(gf.lanes.length) gfDetectBands();
    const sel=$('#gf-lad'); gfStatus(`Ladder ingesteld: ${uv((sel&&sel.options[sel.selectedIndex]||{}).textContent||'')}.`, 'De banden zijn opnieuw gedetecteerd.'); });
  if(LMASS[key]) gfSetIn('gf-lmass',LMASS[key]); }
function gfVlChoose(li){ const v=gf.vl, L=v.lanes[li]; v.li=li; v.cands=gfLadMatch(L.bands).slice(0,5);
  const pw=Math.max(3,Math.round((L.x1-L.x0)*0.12)), sx=Math.max(L.ra+2,L.x0-pw), ex=Math.min(L.rb-2,L.x1+pw), st=document.createElement('canvas'); st.width=ex-sx+1; st.height=L.y1-L.y0+1; st.getContext('2d').drawImage(v.src,sx,L.y0,st.width,st.height,0,0,st.width,st.height); v.strip=st; v.cache=null;
  v.info=`${v.lanes.length>1?v.lanes.length+' ladderbanen gevonden; klik in het voorbeeld op de ladder die je wilt gebruiken. ':''}${L.bands.length} banden in de gekozen ladder.`;
  gfVlApply(v.cands.length?0:-1); }
function gfVlApply(ci){ const v=gf.vl, L=v.lanes[v.li]; v.pick=ci; if(ci>=0){ const c=v.cands[ci]; v.key=c.key; v.sizes=c.assign.slice(); } else { v.key='custom'; v.sizes=v.sizes||L.bands.map(()=>NaN); }
  v.cache=null; if(window.__gfRefresh) window.__gfRefresh(); gfVlPreview(); gfRender(); }
/* het voorbeeld tekenen op de canvas van de component; die staat er alleen als het vak open is */
function gfVlPreview(){ const v=gf.vl, cv=$('#gf-vlcv'); if(!cv||!v||!v.src) return; const sc=Math.min(1,560/v.src.width,260/v.src.height); cv.width=Math.round(v.src.width*sc); cv.height=Math.round(v.src.height*sc); const x=cv.getContext('2d'); x.drawImage(v.src,0,0,cv.width,cv.height);
  (v.lanes||[]).forEach((L,i)=>{ x.strokeStyle=i===v.li?'#e8a317':'#1558b0'; x.lineWidth=i===v.li?3:1.5; x.strokeRect(L.x0*sc,L.y0*sc,(L.x1-L.x0)*sc,(L.y1-L.y0)*sc); if(i===v.li) L.bands.forEach((b,j)=>{ x.fillStyle=isFinite(v.sizes&&v.sizes[j])?'#e8a317':'#d62828'; x.fillRect(L.x1*sc+2,(L.y0+b.y)*sc-1.5,6,3); }); }); }
/* gel-y van een grootte volgens de actieve ladder (inverse van de ijklijn, lineair in log bp) */
function gfYofBp(bp){ gfSyncBands(); const LL=gf.lanes.filter(l=>l.lad&&(l.bands||[]).filter(q=>isFinite(q.bp)&&q.bp>0).length>=2).sort((p,q)=>q.x-p.x); const b=((LL[0]&&LL[0].bands)||gf.bands||[]).filter(q=>isFinite(q.bp)&&q.bp>0).sort((p,q)=>p.y-q.y); if(b.length<2||!(bp>0)) return NaN; const l=Math.log10(bp); let i=0; while(i<b.length-2&&l<Math.log10(b[i+1].bp)) i++; const p=b[i],q=b[i+1], lp=Math.log10(p.bp), lq=Math.log10(q.bp); if(lp===lq) return NaN; return p.y+(l-lp)/(lq-lp)*(q.y-p.y); }
function gfVlWarp(Ph,Wv){ const v=gf.vl; if(!v||!v.strip) return null; const L=v.lanes[v.li];
  let an=L.bands.map((b,j)=>[gfYofBp(v.sizes[j]),b.y]).filter(a=>isFinite(a[0])).sort((a,b)=>a[0]-b[0]); an=an.filter((a,i)=>i===0||(a[0]>an[i-1][0]+0.5&&a[1]>an[i-1][1]));
  const key=JSON.stringify([an.map(a=>[Math.round(a[0]),a[1]]),Ph,Wv]); if(v.cache&&v.cache.key===key) return v.cache.c;
  const S=v.strip, c=document.createElement('canvas'); c.width=Wv; c.height=Math.max(1,Math.round(Ph)); const x=c.getContext('2d'); x.imageSmoothingQuality='high';
  const map=y=>{ if(an.length<2) return y*S.height/Ph; let i=0; while(i<an.length-2&&y>an[i+1][0]) i++; const p=an[i],q=an[i+1]; return p[1]+(y-p[0])*(q[1]-p[1])/(q[0]-p[0]); };
  const sd=S.getContext('2d').getImageData(0,0,S.width,S.height).data, lum=[]; for(let i=0;i<sd.length;i+=16) lum.push([0.299*sd[i]+0.587*sd[i+1]+0.114*sd[i+2],i]); lum.sort((p,q)=>p[0]-q[0]); const bi=lum[Math.floor(lum.length*0.3)][1]; x.fillStyle=`rgb(${sd[bi]},${sd[bi+1]},${sd[bi+2]})`; x.fillRect(0,0,Wv,c.height);
  for(let y=0;y<c.height;y++){ const sy=map(y+0.5); if(sy>=0&&sy<S.height-1) x.drawImage(S,0,Math.floor(sy),S.width,1,0,y,Wv,1); }
  v.cache={key,c}; v.anchors=an.length; return c; }
function gfRender(exportMode,scale=1){
  if(!exportMode){ clearTimeout(gfHist.t); gfHist.t=setTimeout(gfHistRec,350); }   /* ongedaan maken (S74) */
  const c=exportMode?document.createElement('canvas'):gcv, x=c.getContext('2d');
  if(!gf.src){ c.width=800; c.height=300; x.fillStyle='#f3f5f7'; x.fillRect(0,0,800,300); x.fillStyle='#5a6a78'; x.font='16px Segoe UI, Arial, sans-serif'; x.textAlign='center'; x.fillText('Kies een gelfoto of laad de demo-gel.',400,150); return c; }
  if(gf.mode==='persp'&&!exportMode){ const s=gf.src, q=gf.pend; c.width=s.width; c.height=s.height; x.drawImage(s,0,0);
    if(q){ const lw=Math.max(2,s.width/300), hs=Math.max(8,s.width/90); x.strokeStyle='#e8a317'; x.lineWidth=lw; x.beginPath(); q.forEach((p,i)=>i?x.lineTo(p.x,p.y):x.moveTo(p.x,p.y)); x.closePath(); x.stroke();
      q.forEach(p=>{ x.fillStyle='#fff'; x.beginPath(); x.arc(p.x,p.y,hs,0,Math.PI*2); x.fill(); x.stroke(); }); }
    gf.layout={L:0,T:0,s:1,crop:true}; return c; }
  if(gf.mode==='crop'&&!exportMode){ const r=gfRotated(); c.width=r.width; c.height=r.height; x.drawImage(r,0,0); const p=gf.pend; if(p){ x.fillStyle='rgba(0,0,0,.45)'; x.fillRect(0,0,r.width,p.y); x.fillRect(0,p.y+p.h,r.width,r.height-p.y-p.h); x.fillRect(0,p.y,p.x,p.h); x.fillRect(p.x+p.w,p.y,r.width-p.x-p.w,p.h); x.strokeStyle='#1558b0'; x.lineWidth=Math.max(2,r.width/300); x.strokeRect(p.x,p.y,p.w,p.h); const hs=Math.max(6,r.width/110); x.fillStyle='#fff'; [[0,0],[.5,0],[1,0],[0,.5],[1,.5],[0,1],[.5,1],[1,1]].forEach(([fx,fy])=>{ x.fillRect(p.x+p.w*fx-hs/2,p.y+p.h*fy-hs/2,hs,hs); x.strokeRect(p.x+p.w*fx-hs/2,p.y+p.h*fy-hs/2,hs,hs); }); } gf.layout={L:0,T:0,s:1,crop:true}; return c; }
  const o=gxOpts(), P=gfProc(), fs=gf.fs, U=gfDU(), edit=!exportMode&&o.help;
  const font=`600 ${fs}px Segoe UI, Arial, sans-serif`, sfont=`500 ${fs*0.85}px Segoe UI, Arial, sans-serif`, mfont=`600 ${fs*0.8}px Segoe UI, Arial, sans-serif`;
  x.font=font; const vlabT=gf.vl&&gf.vl.strip&&gf.vl.show?String(gf.vlLab==null?'M':gf.vlLab).trim():''; const maxW=Math.max(0,...gf.lanes.map(l=>x.measureText(uv(l.label||'')).width),vlabT?x.measureText(uv(vlabT)).width:0);
  /* labelhoek: bij 'automatisch' kantelen alle lanelabels evenveel zodra twee buren elkaar zouden raken */
  let angD=gf.ang; if(gf.angAuto){ angD=0; const ls=gf.lanes.slice().sort((a,b)=>a.x-b.x); let dmin=Infinity, over=false; for(let i=1;i<ls.length;i++){ const d=ls[i].x-ls[i-1].x; dmin=Math.min(dmin,d); if((x.measureText(uv(ls[i].label||'')).width+x.measureText(uv(ls[i-1].label||'')).width)/2+fs*0.35>d) over=true; } if(over){ const need=Math.asin(Math.min(1,fs*1.1/Math.max(1,dmin)))*180/Math.PI; angD=[30,45,60,75,90].find(a=>a>=need)||90; } }
  gf.angEff=angD; const ang=angD*Math.PI/180;
  const pad=o.pad?Math.round(fs*0.6):0, hs=Math.max(9,fs*0.55);
  const titleOn=o.title&&!!gf.title, lanesOn=o.lanes&&gf.lanes.length>0;
  const nb=gf.bands.filter(b=>isFinite(b.bp)||(b.lab&&String(b.lab).trim())); const bpOn=o.bp&&nb.length>0, tickOn=o.ticks&&gf.bands.length>0, unitOn=o.unit&&bpOn;
  const marksOn=o.marks&&gf.marks.length>0;
  const laneName=m=>{ let li=0,bd=Infinity; gf.lanes.forEach((l,j)=>{ const d=Math.abs(l.x-m.x); if(d<bd){bd=d;li=j;} }); return uv(gf.lanes[li]?(gf.lanes[li].label||String(li+1)):''); };
  const mText=m=>{ if(gf.disp==='ng'){ const n=gfMarkNg(m); return `${laneName(m)}: ${isFinite(n)?'≈ '+gfNgTxt(n)+' ng':'?'}`; } const t=gfSizeTxt(m.bp); return `${laneName(m)}: ${isFinite(m.bp)?(t[0]==='<'||t[0]==='>'?t:'≈ '+t)+' '+U:'?'}`; };
  x.font=mfont; const mW=marksOn?Math.max(...gf.marks.map(m=>x.measureText(mText(m)).width))+fs*1.1:0;
  const titleH=titleOn?fs*1.25*1.7:0;
  const labH=lanesOn?(angD===0?fs*1.6:maxW*Math.sin(ang)+fs*Math.cos(ang)+fs*0.6):(unitOn?fs*1.3:0);
  x.font=sfont;
  /* ladderlabels om en om in twee kolommen zodra ze elkaar zouden overlappen; de buitenste kolom krijgt een verbindingslijn met pijl */
  const lh=fs*0.85*1.12, lead=fs*1.1; const lit=bpOn?nb.map(b=>{ const t=uv(gfBandTxt(b)); return {b,t,y:b.y,w:x.measureText(t).width}; }).sort((a,c)=>a.y-c.y):[];
  { const last=[-Infinity,-Infinity]; lit.forEach(it=>{ it.ty=it.y; if(it.y-last[0]>=lh) it.col=0; else if(it.y-last[1]>=lh) it.col=1; else { it.col=last[0]<=last[1]?0:1; it.ty=last[it.col]+lh; } last[it.col]=it.ty; }); }
  /* een label in de buitenste kolom wijkt alleen uit voor de labels van de binnenste kolom die er direct naast staan */
  const c0=lit.filter(i=>i.col===0); lit.forEach(it=>{ if(it.col!==1){ it.off=0; return; } const nbW=Math.max(0,...c0.filter(o=>Math.abs(o.ty-it.ty)<lh*1.05).map(o=>o.w)); it.off=nbW+fs*0.3+lead; });
  const textW=bpOn?Math.max(...lit.map(i=>i.off+i.w),unitOn?x.measureText(U).width:0)+fs*0.3:0;
  const tickW=tickOn?fs*0.45:0;
  let Lm=Math.round(pad+textW+tickW+(bpOn||tickOn?fs*0.1:0)), T=Math.round(pad+titleH+labH), R=Math.round(pad+mW), B=pad;
  if(edit){ Lm=Math.max(Lm,Math.round(hs*1.6)); T=Math.max(T,4); R=Math.max(R,Math.round(hs*1.6)); B=Math.max(B,Math.round(hs*1.6)); }
  const vlOn=!!(gf.vl&&gf.vl.strip&&gf.vl.show), Wv=vlOn?Math.round(Math.max(30,Math.min(160,gf.lw*2.2))):0, gw=vlOn?Math.max(4,Math.round(fs*0.35)):0, VX=Lm+P.w+gw;
  /* lanelabels (ook gekanteld) en het label van de virtuele ladder mogen niet rechts buiten beeld vallen */
  if(lanesOn){ x.font=font; const ext=(cx,t)=>{ const tw=x.measureText(t).width; return angD?cx+fs*0.1*Math.cos(ang)+tw*Math.cos(ang)+fs*0.5*Math.sin(ang):cx+tw/2; }; let mr=0; gf.lanes.forEach(l=>{ mr=Math.max(mr,ext(l.x,uv(l.label||''))-(P.w+gw+Wv)); }); if(vlOn&&vlabT) mr=Math.max(mr,ext(P.w+gw+Wv/2,uv(vlabT))-(P.w+gw+Wv)); R=Math.max(R,Math.ceil(mr+pad+2)); }
  const W=Lm+P.w+gw+Wv+R;
  /* bewerkingen van de foto onder de figuur (S75): elk onderdeel apart getekend, zodat het zijn eigen vertaalsleutel houdt */
  const ifs=Math.max(9,fs*0.6), ilh=ifs*1.35, iy0=T+P.h+B; let intL=[];
  if(o.integ){ const its=gfEdits(); if(its.length){ x.font=`400 ${ifs}px Segoe UI, Arial, sans-serif`; const maxw=W-2*Math.max(pad,4), gap=ifs*0.9; let row=[], w=0;
    ['Beeldbewerking:',...its].forEach(t=>{ const tw=x.measureText(t).width; if(row.length&&w+gap+tw>maxw){ intL.push(row); row=[]; w=0; } row.push({t,x:w?w+gap:0}); w=(w?w+gap:0)+tw; }); if(row.length) intL.push(row); B+=intL.length*ilh+ifs*0.3; } }
  const H=T+P.h+B;
  c.width=Math.round(W*scale); c.height=Math.round(H*scale); x.setTransform(scale,0,0,scale,0,0);
  x.fillStyle='#fff'; x.fillRect(0,0,W,H); x.imageSmoothingQuality='high'; x.drawImage(P.c,Lm,T); { const so=$('#gf-sat'); if(!exportMode&&so&&so.checked) x.drawImage(gfSat().c,Lm,T); }
  if(vlOn){ const wc=gfVlWarp(P.h,Wv); if(wc) x.drawImage(wc,VX,T); const vlab=vlabT; if(vlab&&lanesOn){ x.save(); x.font=font; x.fillStyle='#111'; x.translate(VX+Wv/2,T-fs*0.45); if(gf.angEff){ x.rotate(-gf.angEff*Math.PI/180); x.textAlign='left'; x.textBaseline='middle'; x.fillText(uv(vlab),fs*0.1,0); } else { x.textAlign='center'; x.fillText(uv(vlab),0,0); } x.restore(); } }
  if(!exportMode) gf.layout={L:Lm,T,s:1,hs,lab:lanesOn?labH:0};
  x.fillStyle='#111'; x.textBaseline='alphabetic';
  if(titleOn){ x.font=`700 ${fs*1.25}px Segoe UI, Arial, sans-serif`; x.textAlign='left'; x.fillText(uv(gf.title),Lm,pad+fs*1.25*1.25); }
  if(lanesOn){ x.font=font; gf.lanes.forEach(l=>{ const lx=Lm+l.x, ly=T-fs*0.45; x.save(); x.translate(lx,ly); if(angD){ x.rotate(-ang); x.textAlign='left'; x.textBaseline='middle'; x.fillText(uv(l.label||''),fs*0.1,0); } else { x.textAlign='center'; x.fillText(uv(l.label||''),0,0); } x.restore(); }); }
  const tx=Lm-tickW-fs*0.15;
  if(bpOn){ x.font=sfont; x.textAlign='right'; x.textBaseline='middle'; const end=tickOn?Lm-tickW:Lm-2;
    lit.forEach(it=>{ const yy=T+it.ty, yb=T+it.y; x.fillStyle='#111';
      if(it.col===0){ x.fillText(it.t,tx,yy); if(Math.abs(yy-yb)>0.5){ x.strokeStyle='#111'; x.lineWidth=Math.max(1,fs/18); x.beginPath(); x.moveTo(tx+fs*0.08,yy); x.lineTo(end,yb); x.stroke(); } }
      else { const x1=tx-it.off, nw=it.off-fs*0.3-lead; x.fillText(it.t,x1,yy); const a=fs*0.28; x.strokeStyle='#111'; x.lineWidth=Math.max(1,fs/18); x.beginPath(); x.moveTo(x1+fs*0.15,yy); x.lineTo(tx-nw-fs*0.1,yy); x.lineTo(end-a,yb); x.stroke(); x.beginPath(); x.moveTo(end,yb); x.lineTo(end-a,yb-a*0.55); x.lineTo(end-a,yb+a*0.55); x.closePath(); x.fill(); } }); }
  if(tickOn){ x.strokeStyle='#111'; x.lineWidth=Math.max(1,fs/14); gf.bands.forEach(b=>{ x.beginPath(); x.moveTo(Lm-tickW,T+b.y); x.lineTo(Lm-1,T+b.y); x.stroke(); }); }
  if(unitOn){ x.font=sfont; x.textAlign='right'; x.textBaseline='bottom'; x.fillText(U,tx,T-fs*0.2); }
  if(marksOn){
    const ord=gf.marks.map(m=>({m,y:T+m.y})).sort((a,b)=>a.y-b.y); const gap=fs*1.05; for(let i=1;i<ord.length;i++) if(ord[i].y-ord[i-1].y<gap) ord[i].y=ord[i-1].y+gap;
    const ex=Lm+P.w+gw+Wv; x.font=mfont; x.textAlign='left'; x.textBaseline='middle';
    ord.forEach(({m,y})=>{ const my=T+m.y; x.fillStyle=o.mcol; x.beginPath(); x.moveTo(ex+1,my); x.lineTo(ex+fs*0.55,my-fs*0.3); x.lineTo(ex+fs*0.55,my+fs*0.3); x.closePath(); x.fill();
      if(Math.abs(y-my)>1){ x.strokeStyle=o.mcol; x.lineWidth=1; x.beginPath(); x.moveTo(ex+fs*0.55,my); x.lineTo(ex+fs*0.75,y); x.stroke(); }
      x.fillStyle='#111'; x.fillText(mText(m),ex+fs*0.8,y); });
  }
  if(intL.length){ x.font=`400 ${ifs}px Segoe UI, Arial, sans-serif`; x.fillStyle='#444'; x.textAlign='left'; x.textBaseline='alphabetic'; const x0=Math.max(pad,4);
    intL.forEach((row,r)=>row.forEach(it=>x.fillText(it.t,x0+it.x,iy0+ifs*0.2+(r+1)*ilh-ifs*0.35))); }
  /* voor/na (S75): links van de lijn de foto zonder helderheid, contrast en inverteren */
  if(!exportMode&&gf.ba>0){ const raw=gfRawCrop(), bw=P.w*gf.ba/100; x.drawImage(raw,0,0,bw,P.h,Lm,T,bw,P.h); x.strokeStyle='#e8a317'; x.lineWidth=Math.max(2,hs/4); x.beginPath(); x.moveTo(Lm+bw,T); x.lineTo(Lm+bw,T+P.h); x.stroke();
    x.font=`600 ${hs*1.2}px Segoe UI, Arial, sans-serif`; x.fillStyle='#e8a317'; x.textBaseline='top'; x.textAlign='right'; x.fillText('Voor',Lm+bw-hs*0.4,T+hs*0.4); x.textAlign='left'; x.fillText('Na',Lm+bw+hs*0.4,T+hs*0.4); x.textBaseline='alphabetic'; }
  if(edit){
    /* lanegrenzen (S72): gestippeld over de gel; versleep er een om de lanebreedte te zetten */
    x.save(); x.strokeStyle='rgba(110,160,240,.5)'; x.lineWidth=Math.max(1,hs/9); x.setLineDash([hs*0.5,hs*0.4]);
    gf.lanes.forEach(l=>[l.x-gf.lw/2,l.x+gf.lw/2].forEach(bx=>{ x.beginPath(); x.moveTo(Lm+bx,T); x.lineTo(Lm+bx,T+P.h); x.stroke(); })); x.restore();
    /* metingen (S73): haakjes links en rechts van de band, versleepbaar langs de lane */
    x.strokeStyle=o.mcol; x.lineWidth=Math.max(1.5,hs/4); gf.marks.forEach(m=>[-1,1].forEach(d=>{ const e=Lm+m.x+d*gf.lw/2; x.beginPath(); x.moveTo(e,T+m.y); x.lineTo(e+d*hs*0.7,T+m.y); x.stroke(); }));
    const tri=(cx,cy,dir,col)=>{ x.fillStyle=col; x.beginPath(); if(dir==='up'){ x.moveTo(cx,cy); x.lineTo(cx-hs*0.6,cy+hs); x.lineTo(cx+hs*0.6,cy+hs); } else if(dir==='right'){ x.moveTo(cx,cy); x.lineTo(cx-hs,cy-hs*0.6); x.lineTo(cx-hs,cy+hs*0.6); } else { x.moveTo(cx,cy); x.lineTo(cx+hs,cy-hs*0.6); x.lineTo(cx+hs,cy+hs*0.6); } x.closePath(); x.fill(); };
    gf.lanes.forEach((l,i)=>tri(Lm+l.x,T+P.h+2,'up',i===gf.ladder?'#d98a00':l.lad?'#f2c26b':'#1558b0'));
    gf.bands.forEach(b=>tri(Lm-2,T+b.y,'right','#d98a00'));
    if(!marksOn) gf.marks.forEach(m=>tri(Lm+P.w+gw+Wv+2,T+m.y,'left',o.mcol));
  }
  return c;
}
let gfFine=0, gfFineT=null;
function gfUpdate(){ if(!$('#gf-inv')) return;   /* de velden staan in Vue en zijn er pas na het mounten */
  gf.inv=$('#gf-inv').checked; gf.gray=$('#gf-gray').checked; gf.bri=+$('#gf-bri').value; gf.con=+$('#gf-con').value; gf.fine=+$('#gf-rot').value; gf.fs=+$('#gf-fs').value; gf.angAuto=$('#gf-ang').value==='auto'; gf.ang=gf.angAuto?0:+$('#gf-ang').value; gf.title=$('#gf-title').value; gf.lw=+$('#gf-lw').value; gf.ba=+(($('#gf-ba')||{}).value||0); gf.ladKey=$('#gf-lad').value; gf.disp=$('#gf-unit').value; gf.unit=gf.disp==='kDa'?'kDa':'bp';
  gfMarksTable(); gfRender();
  if(gf.fine!==gfFine){ gfFine=gf.fine; clearTimeout(gfFineT); gfFineT=setTimeout(()=>{ if(gf.src) gfGeom(); },350); } }
calc.gelfoto=e=>{ if(e&&e.target&&(e.target.closest('#gf-lanes')||e.target.closest('#gf-bt')||e.target.id==='gf-file'||e.target.id==='gf-n')) return; gfUpdate(); };
function gfGeom(){ const had=gf.lanes.length>0, hb=gf.bands.length>0; gf.marks=[]; gfMarksTable(); if(had){ gfDetectLanes(); if(hb) gfDetectBands(); } else { gfLanesTable(); gfBandsTable(); gfRender(); } }
function gfR90(){ gf.rot90=(gf.rot90+1)%4; gf.crop=null; gfGeom(); }
function gfFlip(){ gf.flip=!gf.flip; gfGeom(); }
function gfBandsBtn(){ gf.ladKey=$('#gf-lad').value; gfDetectBands(); }
function setMode(m){ gf.mode=gf.mode===m?null:m; ['crop','addlane','addband','measure','persp'].forEach(k=>{ const b=$({crop:'#gf-crop',addlane:'#gf-addlane',addband:'#gf-addband',measure:'#gf-measure',persp:'#gf-persp'}[k]); if(b) b.classList.toggle('on',gf.mode===k); }); { const cb=$('#gf-cropbar'); if(cb) cb.style.display=gf.mode==='crop'?'flex':'none'; const pb=$('#gf-perspbar'); if(pb) pb.style.display=gf.mode==='persp'?'flex':'none'; } gcv.style.cursor=gf.mode?'crosshair':'default';
  gf.pend=gf.mode==='crop'&&gf.crop?{...gf.crop}:gf.mode==='persp'&&gf.src?(gf.persp?gf.persp.map(q=>({...q})):gfFindQuad()||gfQuadDefault()):null; if(window.__gfRefresh) window.__gfRefresh(); gfRender(); }
function gfMeasureBtn(){ if(gf.bands.filter(b=>isFinite(b.bp)).length<2){ gfStatus('Je hebt minstens twee ladderbanden met bp-waarde nodig om te meten.'); return; } setMode('measure'); }
function gfUncrop(){ if(!gf.crop) return; gf.crop=null; gfGeom(); }
function gfCropFind(){ const b=gfFindGel(); if(b){ gf.pend=b; gfRender(); gfStatus('Kader om het gelvlak gezet; stel het bij en kies Toepassen.'); } else gfStatus('Geen duidelijk gelvlak gevonden; sleep zelf een kader.'); }
$('#gf-zin').addEventListener('click',()=>gfZoom((gf.zoom||1)*1.5)); $('#gf-zout').addEventListener('click',()=>gfZoom((gf.zoom||1)/1.5)); $('#gf-zfit').addEventListener('click',()=>gfZoom(1));
$('#gf-view').addEventListener('wheel',e=>{ if(!e.ctrlKey&&!e.metaKey) return; e.preventDefault(); gfZoom((gf.zoom||1)*(e.deltaY<0?1.2:1/1.2),e.clientX,e.clientY); },{passive:false});
gcv.addEventListener('auxclick',e=>{ if(e.button===1) e.preventDefault(); }); gcv.addEventListener('mousedown',e=>{ if(e.button===1) e.preventDefault(); });
function gfCropOk(){ const p=gf.pend; if(p&&p.w>10&&p.h>10){ gf.crop={x:p.x,y:p.y,w:p.w,h:p.h}; setMode('crop'); gfGeom(); gfStatus('Bijgesneden; lanen en ladder zijn opnieuw gedetecteerd.'); return; } setMode('crop'); }
/* welk deel van het bijsnijkader ligt onder de muis: rand (n/s/e/w), hoek of binnenkant (m) */
function gfCropHit(p){ const q=gf.pend; if(!q||q.w<12||q.h<12) return null; const t=Math.max(10*p.s,6), nx0=Math.abs(p.x-q.x)<t, nx1=Math.abs(p.x-q.x-q.w)<t, ny0=Math.abs(p.y-q.y)<t, ny1=Math.abs(p.y-q.y-q.h)<t, inx=p.x>q.x-t&&p.x<q.x+q.w+t, iny=p.y>q.y-t&&p.y<q.y+q.h+t; if(!inx||!iny) return null;
  const v=ny0?'n':ny1?'s':'', h=nx0?'w':nx1?'e':''; if(v||h) return v+h; return p.x>q.x&&p.x<q.x+q.w&&p.y>q.y&&p.y<q.y+q.h?'m':null; }
/* zoekt het lichte gelvlak: Otsu-drempel op een verkleinde foto, daarna de langste aaneengesloten reeks kolommen en rijen die grotendeels licht zijn */
function gfFindGel(){ const r=gfRotated(), sc=Math.min(1,260/Math.max(r.width,r.height)), w=Math.max(8,Math.round(r.width*sc)), h=Math.max(8,Math.round(r.height*sc)), c=document.createElement('canvas'); c.width=w; c.height=h; const x=c.getContext('2d'); x.imageSmoothingQuality='high'; x.drawImage(r,0,0,w,h); const d=x.getImageData(0,0,w,h).data, g=new Float32Array(w*h), hist=new Array(256).fill(0);
  for(let i=0;i<w*h;i++){ g[i]=0.299*d[i*4]+0.587*d[i*4+1]+0.114*d[i*4+2]; hist[Math.round(g[i])]++; }
  let sum=0; for(let i=0;i<256;i++) sum+=i*hist[i]; let sb=0,wb=0,best=0,thr=127; for(let i=0;i<256;i++){ wb+=hist[i]; if(!wb) continue; const wf=w*h-wb; if(!wf) break; sb+=i*hist[i]; const mb=sb/wb, mf=(sum-sb)/wf, v=wb*wf*(mb-mf)**2; if(v>best){ best=v; thr=i; } }
  const run=(n,frac)=>{ let bs=-1,bl=0,cs=-1,gap=0; for(let i=0;i<=n;i++){ const on=i<n&&frac(i)>0.4; if(on){ if(cs<0) cs=i; gap=0; } else if(cs>=0){ gap++; if(gap>2||i===n){ const len=i-gap+1-cs; if(len>bl){ bl=len; bs=cs; } cs=-1; gap=0; } } } return bs<0?null:[bs,bs+bl]; };
  let X=[0,w], Y=[0,h]; for(let it=0;it<3;it++){ const nx=run(w,i=>{ let s=0; for(let j=Y[0];j<Y[1];j++) s+=g[j*w+i]>thr?1:0; return s/(Y[1]-Y[0]); }); if(!nx) return null; X=nx; const ny=run(h,j=>{ let s=0; for(let i=X[0];i<X[1];i++) s+=g[j*w+i]>thr?1:0; return s/(X[1]-X[0]); }); if(!ny) return null; Y=ny; }
  /* felle randen van de gelhouder aan de zijkanten wegsnijden */
  { const cm=[]; for(let i=X[0];i<X[1];i++){ let t=0; for(let j=Y[0];j<Y[1];j++) t+=g[j*w+i]; cm.push(t/(Y[1]-Y[0])); } const md=[...cm].sort((p,q)=>p-q)[Math.floor(cm.length/2)], lim=Math.floor(cm.length*0.18); let l=0, rr=cm.length; for(let i=lim;i>=0;i--) if(cm[i]>md*1.3){ l=i+1; break; } for(let i=cm.length-1-lim;i<cm.length;i++) if(cm[i]>md*1.3){ rr=i; break; } if(rr-l>cm.length*0.5){ X=[X[0]+l,X[0]+rr]; } }
  const box={x:X[0]/sc,y:Y[0]/sc,w:(X[1]-X[0])/sc,h:(Y[1]-Y[0])/sc}, a=box.w*box.h/(r.width*r.height); if(a<0.03||a>0.93||box.w<24||box.h<24) return null; return {x:Math.max(0,box.x),y:Math.max(0,box.y),w:Math.min(r.width-box.x,box.w),h:Math.min(r.height-box.y,box.h)}; }
/* zoomen: de weergavebreedte van de canvas schaalt mee; tellingen en metingen blijven in beeldpixels */
function gfZoom(z,cx,cy){ const v=$('#gf-view'), old=gf.zoom||1; z=Math.max(1,Math.min(8,z)); const rc=v.getBoundingClientRect(), ax=cx==null?rc.width/2:cx-rc.left, ay=cy==null?rc.height/2:cy-rc.top, fx=(v.scrollLeft+ax)/old, fy=(v.scrollTop+ay)/old; gf.zoom=z; v.classList.toggle('zoomed',z>1); gcv.style.maxWidth='none'; gcv.style.width=(z*100)+'%'; v.scrollLeft=fx*z-ax; v.scrollTop=fy*z-ay; $('#gf-zv').textContent=Math.round(z*100)+'%'; }
/* welke lanegrens ligt onder de muis: alleen op de gel en alleen als de grens dichterbij is dan het midden van de lane */
function gfLwHit(p,tol){ if(!gf.layout||gf.layout.crop||p.y<0||p.y>gfProc().h) return -1; let li=-1,bd=tol; gf.lanes.forEach((l,i)=>{ const c=Math.abs(p.x-l.x), d=Math.abs(c-gf.lw/2); if(d<bd&&d<c){bd=d;li=i;} }); return li; }
function gfMarkHit(p,tol){ let mi=-1,bd=tol; gf.marks.forEach((m,i)=>{ const d=Math.abs(m.y-p.y); if(d<bd&&Math.abs(m.x-p.x)<gf.lw/2+tol){bd=d;mi=i;} }); return mi; }
/* dubbelklik of dubbeltik (S73): op de actieve ladderlane een ladderband erbij, op een andere lane een meting */
function gfDbl(p){ const P=gfProc(); if(p.x<0||p.y<0||p.x>P.w||p.y>P.h||!gf.lanes.length) return false;
  let li=0,bd=Infinity; gf.lanes.forEach((l,j)=>{ const d=Math.abs(l.x-p.x); if(d<bd){bd=d;li=j;} });
  if(li===gf.ladder&&bd<gf.lw/2){ const y=gfPeakNear(gf.lanes[li].x,p.y); gf.bands.push({y,bp:NaN}); gf.bands.sort((a,b)=>a.y-b.y); gfBandsTable(); gfRender(); gfStatus('Ladderband toegevoegd.','Vul de grootte in de tabel in.'); return true; }
  if(gf.bands.filter(b=>isFinite(b.bp)).length<2){ gfStatus('Je hebt minstens twee ladderbanden met bp-waarde nodig om te meten.'); return true; }
  const lx=bd<gf.lw?gf.lanes[li].x:p.x, y=gfPeakNear(lx,p.y); gf.marks.push({x:lx,y,bp:gfEst(y,lx)}); gfMarksTable(); gfRender(); return true; }
/* aanraken (S73): twee vingers knijpen om te zoomen en schuiven samen de foto mee */
const gfTouch=new Map();
function cvPt(e){ const r=gcv.getBoundingClientRect(), s=gcv.width/r.width; const lay=gf.layout||{L:0,T:0}; return {x:(e.clientX-r.left)*s-lay.L, y:(e.clientY-r.top)*s-lay.T, s}; }
gcv.addEventListener('pointerdown',e=>{
  if(!gf.src) return; const p=cvPt(e); const P=gf.mode==='crop'?null:gfProc();
  if(e.pointerType==='touch'){ gfTouch.set(e.pointerId,{x:e.clientX,y:e.clientY}); if(gfTouch.size>=2){ const [a,b]=[...gfTouch.values()]; gf.drag=null; gf.pinch={d:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)),z:gf.zoom||1}; gfRender(); return; } }
  if(e.button===1){ const v=$('#gf-view'); gf.drag={t:'pan',cx:e.clientX,cy:e.clientY,sl:v.scrollLeft,st:v.scrollTop}; gcv.setPointerCapture(e.pointerId); e.preventDefault(); return; }
  if(gf.mode==='persp'){ const q=gf.pend||[]; let bi=-1,bd=Math.max(24*p.s,gf.src.width/40); q.forEach((c,i)=>{ const d=Math.hypot(c.x-p.x,c.y-p.y); if(d<bd){bd=d;bi=i;} }); if(bi>=0){ gf.drag={t:'pc',i:bi}; gcv.setPointerCapture(e.pointerId); } return; }
  if(gf.mode==='crop'){ const h=gfCropHit(p); if(h){ gf.drag={t:'cropadj',h,x0:p.x,y0:p.y,o:{...gf.pend}}; } else { gf.drag={t:'crop',x0:p.x,y0:p.y}; gf.pend={x:p.x,y:p.y,w:0,h:0}; } gcv.setPointerCapture(e.pointerId); return; }
  const inside=p.x>=0&&p.y>=0&&p.x<=P.w&&p.y<=P.h;
  if(!gf.mode&&gfLabHit(p)>=0){ e.preventDefault(); gfLabEdit(gfLabHit(p)); return; }  /* preventDefault: anders haalt de muisklik de focus meteen weg */
  if(gf.mode==='addlane'&&inside){ const act=gf.lanes[gf.ladder]; gf.lanes.push({x:p.x,label:String(gf.lanes.length+1)}); gf.lanes.sort((a,b)=>a.x-b.x); gf.ladder=Math.max(0,gf.lanes.indexOf(act)); gfLanesTable(); gfRender(); return; }
  if(gf.mode==='addband'&&inside&&gf.lanes[gf.ladder]){ const y=gfPeakNear(gf.lanes[gf.ladder].x,p.y); gf.bands.push({y,bp:NaN}); gf.bands.sort((a,b)=>a.y-b.y); gfBandsTable(); gfRender(); return; }
  if(gf.mode==='measure'&&inside){ let li=0,bd=Infinity; gf.lanes.forEach((l,j)=>{ const d=Math.abs(l.x-p.x); if(d<bd){bd=d;li=j;} }); const lx=gf.lanes.length&&bd<gf.lw?gf.lanes[li].x:p.x; const y=gfPeakNear(lx,p.y); gf.marks.push({x:lx,y,bp:gfEst(y,lx)}); gfMarksTable(); gfRender(); return; }
  if(e.button===0&&!gf.mode){ const last=gf.tap; gf.tap={t:e.timeStamp,x:e.clientX,y:e.clientY};
    if(last&&e.timeStamp-last.t<400&&Math.hypot(e.clientX-last.x,e.clientY-last.y)<14){ gf.tap=null; if(gfDbl(p)) return; } }
  const tol=Math.max(8*p.s,(gf.layout.hs||9)); const Ld=gf.lanes[gf.ladder];
  { const mi=gfMarkHit(p,tol); if(mi>=0){ gf.drag={t:'mark',i:mi}; gcv.setPointerCapture(e.pointerId); return; } }
  if(p.x<0||(Ld&&Math.abs(p.x-Ld.x)<gf.lw/2)){ let bi=-1,bd=tol; gf.bands.forEach((b,i)=>{ const d=Math.abs(b.y-p.y); if(d<bd){bd=d;bi=i;} }); if(bi>=0){ gf.drag={t:'band',i:bi}; gcv.setPointerCapture(e.pointerId); return; } }
  { const bi=gfLwHit(p,tol); if(bi>=0){ gf.drag={t:'lw',i:bi}; gcv.setPointerCapture(e.pointerId); return; } }
  let li=-1,ld=tol; gf.lanes.forEach((l,i)=>{ const d=Math.abs(l.x-p.x); if(d<ld){ld=d;li=i;} }); if(li>=0){ gf.drag={t:'lane',i:li}; gcv.setPointerCapture(e.pointerId); return; }
  /* ingezoomd: slepen op een lege plek verschuift de foto */
  if((gf.zoom||1)>1){ const v=$('#gf-view'); gf.drag={t:'pan',cx:e.clientX,cy:e.clientY,sl:v.scrollLeft,st:v.scrollTop}; gcv.setPointerCapture(e.pointerId); }
});
gcv.addEventListener('pointermove',e=>{
  if(gfTouch.has(e.pointerId)){ const prev=gfTouch.get(e.pointerId); gfTouch.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(gf.pinch&&gfTouch.size>=2){ const [a,b]=[...gfTouch.values()], v=$('#gf-view'); v.scrollLeft-=(e.clientX-prev.x)/2; v.scrollTop-=(e.clientY-prev.y)/2; gfZoom(gf.pinch.z*Math.hypot(a.x-b.x,a.y-b.y)/gf.pinch.d,(a.x+b.x)/2,(a.y+b.y)/2); return; } }
  if(!gf.drag&&gf.mode==='crop'&&gf.src){ const h=gfCropHit(cvPt(e)); gcv.style.cursor=!h?'crosshair':h==='m'?'move':({n:'ns-resize',s:'ns-resize',e:'ew-resize',w:'ew-resize',nw:'nwse-resize',se:'nwse-resize',ne:'nesw-resize',sw:'nesw-resize'})[h]; return; }
  if(!gf.drag){ if(gf.src&&!gf.mode&&gf.layout&&!gf.layout.crop){ const p=cvPt(e); const tol=Math.max(8*p.s,gf.layout.hs||9); const nearL=gf.lanes.some(l=>Math.abs(l.x-p.x)<tol); const nearB=p.x<0&&gf.bands.some(b=>Math.abs(b.y-p.y)<tol); gcv.style.cursor=gfLabHit(p)>=0?'text':nearB||gfMarkHit(p,tol)>=0?'ns-resize':gfLwHit(p,tol)>=0?'col-resize':nearL?'ew-resize':(gf.zoom||1)>1?'grab':'default'; } return; }
  const p=cvPt(e);
  if(gf.drag.t==='pan'){ const v=$('#gf-view'); v.scrollLeft=gf.drag.sl-(e.clientX-gf.drag.cx); v.scrollTop=gf.drag.st-(e.clientY-gf.drag.cy); return; }
  if(gf.drag.t==='cropadj'){ const r=gfRotated(), o=gf.drag.o, h=gf.drag.h, dx=p.x-gf.drag.x0, dy=p.y-gf.drag.y0; let x0=o.x, y0=o.y, x1=o.x+o.w, y1=o.y+o.h;
    if(h==='m'){ const mx=Math.max(-o.x,Math.min(r.width-o.x-o.w,dx)), my=Math.max(-o.y,Math.min(r.height-o.y-o.h,dy)); x0+=mx; x1+=mx; y0+=my; y1+=my; }
    else { if(h.includes('w')) x0=Math.max(0,Math.min(x1-12,o.x+dx)); if(h.includes('e')) x1=Math.min(r.width,Math.max(x0+12,o.x+o.w+dx)); if(h.includes('n')) y0=Math.max(0,Math.min(y1-12,o.y+dy)); if(h.includes('s')) y1=Math.min(r.height,Math.max(y0+12,o.y+o.h+dy)); }
    gf.pend={x:x0,y:y0,w:x1-x0,h:y1-y0}; gfRender(); return; }
  if(gf.drag.t==='crop'){ const r=gfRotated(); const x0=Math.max(0,Math.min(gf.drag.x0,p.x)), y0=Math.max(0,Math.min(gf.drag.y0,p.y)); gf.pend={x:x0,y:y0,w:Math.min(r.width,Math.max(gf.drag.x0,p.x))-x0,h:Math.min(r.height,Math.max(gf.drag.y0,p.y))-y0}; gfRender(); }
  else if(gf.drag.t==='lane'){ gf.lanes[gf.drag.i].x=Math.max(0,Math.min(gfProc().w,p.x)); gfRender(); }
  else if(gf.drag.t==='pc'){ gf.pend[gf.drag.i]={x:Math.max(0,Math.min(gf.src.width,p.x)),y:Math.max(0,Math.min(gf.src.height,p.y))}; gfRender(); }
  else if(gf.drag.t==='mark'){ const m=gf.marks[gf.drag.i]; m.y=Math.max(0,Math.min(gfProc().h,p.y)); m.bp=gfEst(m.y,m.x); gfRender(); }
  else if(gf.drag.t==='lw'){ gf.lw=Math.max(4,Math.min(200,Math.round(2*Math.abs(p.x-gf.lanes[gf.drag.i].x)))); gfRender(); }
  else if(gf.drag.t==='band'){ gf.bands[gf.drag.i].y=Math.max(0,Math.min(gfProc().h,p.y)); gfRender(); }
});
function gfUp(e){ gfTouch.delete(e.pointerId); if(gfTouch.size<2) gf.pinch=null;
  if(gf.drag&&gf.drag.t==='mark'){ gf.marks[gf.drag.i].int=null; gfMarksTable(); }
  if(gf.drag&&gf.drag.t==='lw'){ gf.marks.forEach(m=>m.int=null); gfSetIn('gf-lw',gf.lw); } if(gf.drag&&gf.drag.t==='band'){ gf.bands.sort((a,b)=>a.y-b.y); gf.marks.forEach(m=>m.bp=gfEst(m.y,m.x)); gfBandsTable(); gfMarksTable(); } if(gf.drag&&gf.drag.t==='lane'){ const act=gf.lanes[gf.ladder]; gf.lanes.sort((a,b)=>a.x-b.x); gf.ladder=Math.max(0,gf.lanes.indexOf(act)); gfLanesTable(); gf.marks.forEach(m=>m.bp=gfEst(m.y,m.x)); gfMarksTable(); } gf.drag=null; gfRender(); }
gcv.addEventListener('pointerup',gfUp); gcv.addEventListener('pointercancel',gfUp);

/* ================= GELFOTO: DENSITOMETRIE EN AUTOMATISCH METEN ================= */
function gfIntensity(x,y){ const pr=laneProfile(x), h=pr.length, k=Math.max(0,Math.min(h-1,Math.round(y))), pk=pr[k]; if(!(pk>0)) return 0;
  const half=pk/2, lim=Math.round(h/15); let l=k,r=k; while(l>0&&k-l<lim&&pr[l-1]>half) l--; while(r<h-1&&r-k<lim&&pr[r+1]>half) r++;
  const hw=Math.max(1,(r-l)/2), L=Math.max(0,Math.round(k-2*hw)), R=Math.min(h-1,Math.round(k+2*hw)); let s=0; for(let i=L;i<=R;i++) s+=Math.max(0,pr[i]); return s*Math.max(1,Math.round(gf.lw*0.6)); }
function gfMarkInt(){ gf.marks.forEach(m=>{ if(m.int==null) m.int=gfIntensity(m.x,m.y); }); }
function gfMeasAll(){
  if(gf.bands.filter(b=>isFinite(b.bp)).length<2){ gfStatus('Detecteer of vul eerst minstens twee ladderbanden in.'); return; }
  const h=gfProc().h; const profs=gf.lanes.map(l=>laneProfile(l.x)); const gmax=Math.max(...profs.map(p=>Math.max(...p)));
  const wells=gfWellRows(); let added=0; gf.lanes.forEach((l,li)=>{ if(li===gf.ladder||l.lad) return; const pr=profs[li], mx=Math.max(...pr); peaks(pr,h/60,Math.max(0.2*mx,0.1*gmax)).filter(o=>o.i>h*0.02&&o.i<h*0.96&&o.v>0.1*gmax&&!nearWell(o.i,wells)).forEach(o=>{ if(gf.marks.some(m=>Math.abs(m.x-l.x)<gf.lw/2&&Math.abs(m.y-o.i)<h/80)) return; gf.marks.push({x:l.x,y:o.i,bp:gfEst(o.i,l.x)}); added++; }); });
  gfMarksTable(); gfRender(); gfStatus(`${added} banden gemeten in ${gf.lanes.filter((l,i)=>!(l.lad||i===gf.ladder)).length} lanen. Controleer de lijst; verwijder wat geen echte band is (bijvoorbeeld primer-dimeren).`); }
function gfClearMarks(){ gf.marks=[]; gfMarksTable(); gfRender(); }

/* ================= GELFOTO: ACHTERGROND EN Rf ================= */
function laneProfileRaw(cx){ const P=gfProc(), {w,h,sig}=P; const half=Math.max(1,Math.round(gf.lw*0.3)); const x0=Math.max(0,Math.round(cx-half)), x1=Math.min(w-1,Math.round(cx+half)); const pr=new Float32Array(h); for(let y=0;y<h;y++){ let s=0; for(let x=x0;x<=x1;x++) s+=sig[y*w+x]; pr[y]=s/(x1-x0+1); } return smooth(pr,Math.max(1,h/300)); }
/* rolling ball: grijswaarde-opening met een bol van straal r (px); hoogte van de bol in dezelfde eenheid geschaald op het signaalbereik */
function rollingBall(pr,r){ const n=pr.length, R=Math.max(2,Math.round(r)); let lo=Infinity, hi=-Infinity; for(const v of pr){ if(v<lo) lo=v; if(v>hi) hi=v; } const sc=((hi-lo)/n||1)*0.25; const sh=[]; for(let d=-R;d<=R;d++) sh.push(sc*Math.sqrt(R*R-d*d));
  const er=new Float64Array(n); for(let i=0;i<n;i++){ let m=Infinity; for(let d=-R;d<=R;d++){ const k=i+d; if(k<0||k>=n) continue; const v=pr[k]-sh[d+R]; if(v<m) m=v; } er[i]=m; }
  const bg=new Float64Array(n); for(let i=0;i<n;i++){ let m=-Infinity; for(let d=-R;d<=R;d++){ const k=i+d; if(k<0||k>=n) continue; const v=er[k]+sh[d+R]; if(v>m) m=v; } bg[i]=Math.min(pr[i],m); } return bg; }
function densArea(pr,k,mode,r){ const h=pr.length; k=Math.max(0,Math.min(h-1,Math.round(k))); const lim=Math.max(3,Math.round(h/10));
  if(mode==='valley'){ let l=k, rr=k; while(l>0&&k-l<lim&&pr[l-1]<=pr[l]) l--; while(rr<h-1&&rr-k<lim&&pr[rr+1]<=pr[rr]) rr++; let s=0; for(let i=l;i<=rr;i++){ const b=rr>l?pr[l]+(pr[rr]-pr[l])*(i-l)/(rr-l):pr[l]; s+=Math.max(0,pr[i]-b); } return {area:s,l,r:rr}; }
  let bg; if(mode==='none'){ let m=Infinity; for(const v of pr) m=Math.min(m,v); bg=new Float64Array(h).fill(m); } else bg=rollingBall(pr,r||h/12);
  const c=Array.from(pr,(v,i)=>v-bg[i]), pk=c[k]; if(!(pk>0)) return {area:0,l:k,r:k};
  let l=k, rr=k; while(l>0&&k-l<lim&&c[l-1]>pk/2) l--; while(rr<h-1&&rr-k<lim&&c[rr+1]>pk/2) rr++; const hw=Math.max(1,(rr-l)/2), L=Math.max(0,Math.round(k-3*hw)), Rr=Math.min(h-1,Math.round(k+3*hw)); let s=0; for(let i=L;i<=Rr;i++) s+=Math.max(0,c[i]); return {area:s,l:L,r:Rr}; }
gfIntensity=function(x,y){ const pr=laneProfileRaw(x), r=num($('#gf-ball').value); return densArea(pr,gfPeakNear(x,y),$('#gf-bg').value,isFinite(r)&&r>2?Math.min(r,pr.length):pr.length/12).area*Math.max(1,Math.round(gf.lw*0.6)); };
function gfRf(y){ const h=gfProc().h, w=gfWellRows(), y0=w.length?Math.min(...w):0, fr=num($('#gf-front').value), y1=isFinite(fr)&&fr>y0?fr:h; return (y-y0)/(y1-y0); }
/* De achtergrondkeuze, de straal en het front veranderen de gemeten intensiteit zelf, dus
   die wordt opnieuw bepaald; GfDens.vue roept dit aan. */
function gfDensChanged(){ gf.marks.forEach(m=>m.int=null); gfMarksTable(); }

/* ================= GELFOTO: AUTOMATISCH RECHTZETTEN ================= */
function gfAutoStraighten(){
  if(!gf.src) return; const s0=gfWarped(), sc=Math.min(1,420/Math.max(s0.width,s0.height)); const sw=Math.round(s0.width*sc), sh=Math.round(s0.height*sc);
  const small=document.createElement('canvas'); small.width=sw; small.height=sh; small.getContext('2d').drawImage(s0,0,0,sw,sh);
  const c=document.createElement('canvas'), x=c.getContext('2d',{willReadFrequently:true}); c.width=sw; c.height=sh;
  const score=a=>{ x.setTransform(1,0,0,1,0,0); x.fillStyle='#808080'; x.fillRect(0,0,sw,sh); x.translate(sw/2,sh/2); x.rotate((gf.rot90*90+a)*Math.PI/180); if(gf.flip) x.scale(-1,1); x.drawImage(small,-sw/2,-sh/2);
    const W2=Math.round(sw*0.8), H2=Math.round(sh*0.8), d=x.getImageData(Math.round(sw*0.1),Math.round(sh*0.1),W2,H2).data, col=new Float64Array(W2);
    for(let yy=0;yy<H2;yy++) for(let xx=0;xx<W2;xx++) col[xx]+=d[(yy*W2+xx)*4];
    let m=0; col.forEach(v=>m+=v); m/=W2; let v=0; for(let i=1;i<W2;i++) v+=(col[i]-col[i-1])**2; return v; };
  let best=0,bs=-1; for(let a=-8;a<=8.0001;a+=0.5){ const sc2=score(a); if(sc2>bs){bs=sc2;best=a;} }
  for(let a=best-0.5;a<=best+0.5001;a+=0.1){ const sc2=score(a); if(sc2>bs){bs=sc2;best=a;} }
  best=Math.round(best*4)/4; $('#gf-rot').value=best; $('#gf-rot').dispatchEvent(new Event('input',{bubbles:true}));
  gfStatus(`Rechtgezet met ${fmt(best,2)}°. Lanen en ladder worden opnieuw gedetecteerd.`);
}

/* ================= GELFOTO: PERSPECTIEF EN SLIM BIJSNIJDEN (S76) =================
   gf.persp: vier punten (linksboven, rechtsboven, rechtsonder, linksonder) in de oorspronkelijke foto.
   gfWarped() trekt die vierhoek recht tot een rechthoek (projectieve transformatie, bilineair
   bemonsterd) vóór het draaien en bijsnijden, dus alles daarna werkt op de rechtgetrokken gel. */
/* homografie die de punten a[i] op b[i] afbeeldt (8 onbekenden, 4 puntparen) */
function gfHomog(a,b){ const A=[], v=[]; for(let i=0;i<4;i++){ const {x,y}=a[i], {x:u,y:w}=b[i]; A.push([x,y,1,0,0,0,-u*x,-u*y]); v.push(u); A.push([0,0,0,x,y,1,-w*x,-w*y]); v.push(w); }
  const M=invMat(A); if(!M) return null; const h=M.map(r=>r.reduce((s,m,k)=>s+m*v[k],0)); return [...h,1]; }
/* bemonstert src op H(x, y) voor elk doelpixel; buiten src blijft het doel doorzichtig */
function gfWarp(src,H,W,Hh){ const c=document.createElement('canvas'); c.width=W; c.height=Hh; const sx=src.getContext('2d').getImageData(0,0,src.width,src.height), sd=sx.data, sw=src.width, sh=src.height;
  const x=c.getContext('2d'), od=x.createImageData(W,Hh), o=od.data;
  for(let y=0;y<Hh;y++) for(let X=0;X<W;X++){ const px=X+0.5, py=y+0.5, z=H[6]*px+H[7]*py+H[8], u=(H[0]*px+H[1]*py+H[2])/z-0.5, w=(H[3]*px+H[4]*py+H[5])/z-0.5; if(u<0||w<0||u>sw-1||w>sh-1) continue;
    const u0=Math.floor(u), w0=Math.floor(w), fu=u-u0, fw=w-w0, u1=Math.min(sw-1,u0+1), w1=Math.min(sh-1,w0+1), k=(y*W+X)*4;
    for(let ch=0;ch<4;ch++){ const a=sd[(w0*sw+u0)*4+ch], b=sd[(w0*sw+u1)*4+ch], cc=sd[(w1*sw+u0)*4+ch], d=sd[(w1*sw+u1)*4+ch]; o[k+ch]=(a*(1-fu)+b*fu)*(1-fw)+(cc*(1-fu)+d*fu)*fw; } }
  x.putImageData(od,0,0); return c; }
function gfWarped(){ const q=gf.persp; if(!q||q.length!==4) return gf.src; const k=JSON.stringify(q); if(gf.cache.wk===k) return gf.cache.warp;
  const L=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y), W=Math.max(8,Math.round((L(q[0],q[1])+L(q[3],q[2]))/2)), H=Math.max(8,Math.round((L(q[0],q[3])+L(q[1],q[2]))/2));
  const Hm=gfHomog([{x:0,y:0},{x:W,y:0},{x:W,y:H},{x:0,y:H}],q); if(!Hm) return gf.src;
  gf.cache.wk=k; gf.cache.warp=gfWarp(gf.src,Hm,W,H); return gf.cache.warp; }
const gfQuadDefault=()=>{ const w=gf.src.width, h=gf.src.height, m=0.08; return [{x:w*m,y:h*m},{x:w*(1-m),y:h*m},{x:w*(1-m),y:h*(1-m)},{x:w*m,y:h*(1-m)}]; };
/* de hoeken van het gelvlak: de rand van de foto is de omgeving (tafel, transilluminator); alles wat
   duidelijk anders is dan die rand (lichter of donkerder) en samenhangt met het midden, is de gel.
   Daarvan de uiterste punten langs x+y en x−y (zo werkt het ook bij een schuine vierhoek). */
function gfFindQuad(){ const s=gf.src, sc=Math.min(1,600/Math.max(s.width,s.height)), w=Math.max(8,Math.round(s.width*sc)), h=Math.max(8,Math.round(s.height*sc)), c=document.createElement('canvas'); c.width=w; c.height=h;
  const x=c.getContext('2d'); x.drawImage(s,0,0,w,h); const d=x.getImageData(0,0,w,h).data, g=new Float32Array(w*h); for(let i=0;i<w*h;i++) g[i]=0.299*d[i*4]+0.587*d[i*4+1]+0.114*d[i*4+2];
  const bw=Math.max(2,Math.round(Math.min(w,h)*0.03)), bord=[]; for(let y=0;y<h;y++) for(let X=0;X<w;X++) if(X<bw||X>=w-bw||y<bw||y>=h-bw) bord.push(g[y*w+X]);
  bord.sort((p,q)=>p-q); const med=bord[bord.length>>1], mad=[...bord.map(v=>Math.abs(v-med))].sort((p,q)=>p-q)[bord.length>>1], tol=Math.max(5,4*mad);
  const fg=i=>Math.abs(g[i]-med)>tol;
  let st=-1, bd=Infinity; for(let i=0;i<w*h;i++) if(fg(i)){ const dd=Math.hypot(i%w-w/2,Math.floor(i/w)-h/2); if(dd<bd){ bd=dd; st=i; } } if(st<0) return null;
  const seen=new Uint8Array(w*h), stack=[st]; seen[st]=1; let n=0; const ext=[[Infinity,0],[-Infinity,0],[-Infinity,0],[Infinity,0]];  /* min x+y, max x−y, max x+y, min x−y */
  while(stack.length){ const i=stack.pop(), px=i%w, py=(i-px)/w; n++; const a=px+py, b=px-py;
    if(a<ext[0][0]) ext[0]=[a,i]; if(b>ext[1][0]) ext[1]=[b,i]; if(a>ext[2][0]) ext[2]=[a,i]; if(b<ext[3][0]) ext[3]=[b,i];
    for(const j of [px>0?i-1:-1,px<w-1?i+1:-1,py>0?i-w:-1,py<h-1?i+w:-1]) if(j>=0&&!seen[j]&&fg(j)){ seen[j]=1; stack.push(j); } }
  if(n<0.08*w*h||n>0.97*w*h) return null; return ext.map(([,i])=>({x:((i%w)+0.5)/sc,y:(Math.floor(i/w)+0.5)/sc})); }
function gfPerspFind(){ const q=gfFindQuad(); if(q){ gf.pend=q; gfRender(); gfStatus('Hoeken van de gel gevonden; stel ze bij en kies Toepassen.'); } else gfStatus('Geen duidelijk gelvlak gevonden; sleep de hoeken zelf.'); }
function gfPerspOk(){ const q=gf.pend; if(!q||q.length!==4){ setMode('persp'); return; }
  gf.persp=q.map(p=>({x:Math.round(p.x*10)/10,y:Math.round(p.y*10)/10})); gf.crop=null; gf.cache={}; setMode('persp'); gfSetIn('gf-rot',0); gf.fine=0; gfFine=0; clearTimeout(gfFineT); gfGeom();
  gfStatus('Perspectief gecorrigeerd; lanen en ladder zijn opnieuw gedetecteerd.'); }
function gfPerspOff(){ if(gf.mode==='persp') setMode('persp'); if(!gf.persp) return; gf.persp=null; gf.crop=null; gf.cache={}; gfGeom(); }
/* slim bijsnijden: het gelvlak, en de bovenrand net boven de putjes van de kam */
function gfSmartCrop(){ if(!gf.src) return; const b=gfFindGel(); if(!b){ gfStatus('Geen duidelijk gelvlak gevonden; sleep zelf een kader.'); return; }
  gf.crop=b; gf.cache={}; const W=gfWells(), h=gfProc().h; let top=false; if(W&&W.y>h*0.05){ const dy=Math.round(W.y-h*0.04); gf.crop={...b,y:b.y+dy,h:b.h-dy}; top=true; }
  if(gf.mode==='crop') setMode('crop'); gfGeom(); gfStatus(top?'Bijgesneden tot het gelvlak, vanaf net boven de putjes.':'Bijgesneden tot het gelvlak; de putjes zijn niet gevonden.'); }

/* ================= GELFOTO: EERLIJK BEWERKEN (S75) =================
   gfRawCrop: de uitsnede zonder beeldaanpassingen (voor de voor/na-schuif). gfEdits: wat er met de
   foto gebeurde, als vertaalsleutels met de waarden erin, voor het paneel en de regel onder de figuur.
   Alle aanpassingen zijn lineair en gelden voor de hele foto (zoals tijdschriften eisen); alleen het
   afkappen door helderheid en contrast is niet-lineair, daarom telt gfProc hoeveel pixels dat raakt. */
function gfRawCrop(){ const r=gfRotated(), cr=gf.crop||{x:0,y:0,w:r.width,h:r.height}, k=gf.cache.rk+'|'+JSON.stringify(gf.crop); if(gf.cache.rawk===k) return gf.cache.raw;
  const c=document.createElement('canvas'); c.width=Math.max(1,Math.round(cr.w)); c.height=Math.max(1,Math.round(cr.h)); c.getContext('2d').drawImage(r,cr.x,cr.y,cr.w,cr.h,0,0,c.width,c.height); gf.cache.rawk=k; gf.cache.raw=c; return c; }
function gfEdits(){ if(!gf.src) return []; const e=[], P=gfProc(), N=v=>uv(lkNumIn(fmt(v,2)));
  if(gf.persp) e.push('Perspectief gecorrigeerd (vier hoeken)');
  if(gf.rot90) e.push('Gedraaid: '+uv(gf.rot90*90)+'°'); if(gf.flip) e.push('Gespiegeld');
  if(gf.fine) e.push('Rechtgezet: '+N(gf.fine)+'°');
  if(gf.crop) e.push('Bijgesneden tot '+uv(P.w)+' × '+uv(P.h)+' px');
  if(gf.inv) e.push('Geïnverteerd'); if(gf.gray) e.push('Grijswaarden');
  if(gf.bri) e.push('Helderheid '+uv((gf.bri>0?'+':'')+gf.bri)); if(gf.con!==1) e.push('Contrast × '+N(gf.con));
  if(P.clip>0.001) e.push('Afgekapt: '+uv(lkNumIn(fmt(P.clip*100,1)))+' % van de pixels');
  return e; }
/* automatisch verbeteren: rechtzetten, het gelvlak bijsnijden en het contrast oprekken tot 0,5–99,5 % van de grijswaarden */
function gfEnhance(){ if(!gf.src) return; const done=[];
  const a0=gf.fine; gfAutoStraighten(); gf.fine=+$('#gf-rot').value; if(gf.fine!==a0) done.push('Rechtgezet: '+uv(lkNumIn(fmt(gf.fine,2)))+'°');
  if(!gf.crop){ const b=gfFindGel(), r=gfRotated(); if(b&&b.w*b.h<0.8*r.width*r.height){ gf.crop=b; gf.cache={}; done.push('Bijgesneden'); } }
  const R=gfRawCrop(), sc=Math.min(1,400/Math.max(R.width,R.height)), c=document.createElement('canvas'); c.width=Math.max(1,Math.round(R.width*sc)); c.height=Math.max(1,Math.round(R.height*sc));
  const x=c.getContext('2d'); x.drawImage(R,0,0,c.width,c.height); const d=x.getImageData(0,0,c.width,c.height).data, L=[];
  for(let i=0;i<d.length;i+=4){ let v=(0.299*d[i]+0.587*d[i+1]+0.114*d[i+2])/255; if(gf.inv) v=1-v; L.push(v); } L.sort((p,q)=>p-q);
  const lo=L[Math.floor(L.length*0.005)], hi=L[Math.min(L.length-1,Math.floor(L.length*0.995))];
  if(hi-lo>0.02){ const con=Math.max(0.5,Math.min(3,Math.round(1/(hi-lo)*20)/20)), bri=Math.max(-60,Math.min(60,Math.round((-(lo-0.5)*con-0.5)*100)));
    if(con!==gf.con||bri!==gf.bri){ gfSetIn('gf-con',con); gfSetIn('gf-bri',bri); done.push('Contrast × '+uv(lkNumIn(fmt(con,2))),'Helderheid '+uv((bri>0?'+':'')+bri)); } }
  gf.enh=done; gfGeom(); gfStatus(done.length?'Automatisch verbeterd.':'Automatisch verbeteren veranderde niets: de foto was al recht, bijgesneden en goed belicht.'); if(window.__gfRefresh) window.__gfRefresh(); }

/* ================= GELFOTO: EIWITLADDERS EN MASSA PER BAND ================= */
const LMASS={neb100:'45 35 95 27 24 21 18 97 38 29 25 48',neb1k:'42 42 50 42 33 125 48 36 42 42',k1k13:'28 28 28 28 18 92 34 34 20 92 23 30 45',k1kp:'16 28 28 28 28 18 92 34 34 20 92 23 30 45',h100:'70 50 40 40 30 30 90 40 30 40 40',h100p:'40 70 50 40 40 30 30 90 40 30 40 40'};
function gfMassSlope(){ const lad=gfLadder(), ms=stNums($('#gf-lmass').value), load=num($('#gf-lload').value)||500, L=gf.lanes[gf.ladder]; if(!L||!ms.length||gf.unit!=='bp') return NaN;
  const pairs=gf.bands.filter(b=>isFinite(b.bp)).map(b=>{ const i=lad.indexOf(Math.round(b.bp)); return i>=0&&isFinite(ms[i])?[ms[i]*load/500,gfIntensity(L.x,b.y)]:null; }).filter(Boolean);
  if(pairs.length<2) return NaN; return pairs.reduce((s,p)=>s+p[0]*p[1],0)/pairs.reduce((s,p)=>s+p[0]*p[0],0); }
/* De hoeveelheid per ladderband verandert alleen wat er in de tabel en op de foto staat. */
function gfMassChanged(){ gfMarksTable(); gfRender(); }
/* ng kan alleen met een DNA-massaladder; GfLadder.vue roept dit aan bij een andere eenheid. */
function gfUnitMsg(){ if($('#gf-unit').value==='ng'&&gf.unit==='bp'&&!isFinite(gfMassSlope())) gfStatus('Voor ng zijn een DNA-massaladder (ng per band), gemarkeerde ladderbanden en metingen nodig.'); else if($('#gf-unit').value==='ng'&&gf.unit!=='bp') gfStatus('ng werkt alleen met een DNA-ladder met bekende hoeveelheid per band.'); }

/* ================= LANELABELS OP DE FOTO TYPEN (S64) =================
   Klik op een label boven de gel: er komt een invoerveld over te liggen. Enter of klik ernaast
   bewaart, Escape annuleert, Tab en Shift+Tab gaan naar de volgende of vorige lane. Plak je een
   lijst (regels of tabs, bijvoorbeeld een kolom uit Excel), dan vult die deze en de volgende lanen. */
function gfLabHit(p){ const lay=gf.layout; if(!lay||lay.crop||!lay.lab||!gf.lanes.length||p.y>=0||p.y<-lay.lab-4) return -1;
  let li=-1,bd=Math.max(gf.lw*0.75,12); gf.lanes.forEach((l,i)=>{ const d=Math.abs(l.x-p.x); if(d<bd){bd=d;li=i;} }); return li; }
function gfLabEdit(i){ const old=$('#gf-labed'); if(old) old.remove(); const l=gf.lanes[i], lay=gf.layout; if(!l||!lay) return;
  const s=gcv.width/gcv.getBoundingClientRect().width, n=gf.lanes.length, pitch=n>1?(gf.lanes[n-1].x-gf.lanes[0].x)/(n-1):gf.lw*2, fpx=Math.max(12,gf.fs/s), w=Math.max(64,Math.min(180,pitch/s*0.95));
  const el=document.createElement('input'); el.id='gf-labed'; el.className='txt'; el.value=l.label||''; el.setAttribute('data-notr',''); el.setAttribute('aria-label',trPlain(`Label van lane ${i+1}`));
  el.style.cssText=`position:absolute;z-index:3;left:${gcv.offsetLeft+(lay.L+l.x)/s-w/2}px;top:${Math.max(0,gcv.offsetTop+lay.T/s-fpx*2.2)}px;width:${w}px;font-size:${fpx}px;padding:2px 4px;text-align:center`;
  let done=false; const close=save=>{ if(done) return; done=true; if(save) l.label=el.value; el.remove(); gfLanesTable(); gfRender(); };
  el.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); close(true); } else if(e.key==='Escape'){ e.preventDefault(); close(false); }
    else if(e.key==='Tab'){ const j=i+(e.shiftKey?-1:1); close(true); if(gf.lanes[j]){ e.preventDefault(); gfLabEdit(j); } } });
  el.addEventListener('blur',()=>close(true));
  el.addEventListener('paste',e=>{ const t=(e.clipboardData&&e.clipboardData.getData('text'))||''; if(!/[\t\n]/.test(t.trim())) return; e.preventDefault();
    const v=t.replace(/\r/g,'').split(/[\t\n]/).map(q=>q.trim()); while(v.length&&!v[v.length-1]) v.pop();
    const k=Math.min(v.length,n-i); for(let q=0;q<k;q++) gf.lanes[i+q].label=v[q]; done=true; el.remove(); gfLanesTable(); gfRender();
    gfStatus(`${k} labels geplakt.`, v.length>k?`${v.length-k} bleven over: er zijn niet genoeg lanen.`:''); });
  $('#gf-view').appendChild(el); el.focus(); el.select(); }

/* ================= PROJECTBESTAND .labkitgel (S62) =================
   De foto als PNG plus de toestand van de editor (lanen met hun banden, ladder, metingen, beeldwerk)
   en de waarden van de velden. De virtuele ladder (een tweede foto) en de zoom gaan niet mee. */
const GF_PROJ=['persp','rot90','fine','flip','crop','inv','gray','bri','con','lanes','lw','ladder','ladKey','marks','title','fs','ang','angAuto','unit','disp','wells','autoLadder'];
/* het veld-id's van de tool; de lanelabels staan in gf.lanes, de virtuele ladder gaat niet mee */
const gfProjFields=()=>[...$$('#t-gelfoto input[id],#t-gelfoto select[id],#t-gelfoto textarea[id]')].filter(el=>el.type!=='file'&&!el.closest('table')&&!/^gf-(vl|ll|labed|expert|ba$)/.test(el.id));
/* geeft verwijzingen naar gf terug: wie bewaart, kopieert (JSON of IndexedDB doen dat zelf) */
/* de toestand zonder de foto: ook de momentopname van ongedaan maken (S74) */
function gfStateSnap(){ const s={}; GF_PROJ.forEach(k=>{ if(gf[k]!==undefined) s[k]=gf[k]; }); const inp={}; gfProjFields().forEach(el=>{ inp[el.id]=el.type==='checkbox'?el.checked:el.value; }); return {gf:s,inp}; }
function gfProjSnap(){ if(!gf.src) return null; const {gf:s,inp}=gfStateSnap();
  const u=ladUser(gf.ladKey); /* een eigen ladder gaat mee, zodat het project ook elders opent (gewone kopie: IndexedDB kloont geen Vue-proxy) */
  return {kind:'labkitgel',v:1,app:APPVER,img:gf.src.toDataURL('image/png'),gf:s,inp,lad:u?{id:u.id,n:u.n,s:[...u.s],u:u.u}:undefined}; }
/* NaN (samengevoegde band, geen meting) zou in JSON null worden; dat telt isFinite() als 0 */
const gfJsonW=(k,v)=>typeof v==='number'&&!isFinite(v)?{$n:String(v)}:v, gfJsonR=(k,v)=>v&&typeof v==='object'&&typeof v.$n==='string'&&Object.keys(v).length===1?Number(v.$n):v;
function gfProjSave(){ const s=gfProjSnap(); if(!s){ gfStatus('Kies eerst een gelfoto of laad de demo-gel.'); return; }
  gfLibSave(true);
  saveBlob(safeName(gf.title||'gel')+'.labkitgel',new Blob([JSON.stringify(s,gfJsonW)],{type:'application/json'})).then(()=>gfStatus('Project opgeslagen.')).catch(()=>gfStatus('Downloaden lukte niet hier.')); }
function gfProjOpen(f){ if(!f) return; f.text().then(t=>gfProjApply(JSON.parse(t,gfJsonR))).catch(()=>gfStatus('Dit bestand is geen Labkit-gelproject.')); }
/* zet een project terug; gooit bij een ongeldig project (vertrouwensgrens: het bestand komt van buiten) */
async function gfProjApply(p){
  if(!p||p.kind!=='labkitgel'||typeof p.img!=='string'||!/^data:image\/(png|jpeg|webp);base64,/.test(p.img)||!p.gf||!Array.isArray(p.gf.lanes)) throw new Error('geen gelproject');
  if(p.lad&&!LADDERS[p.gf.ladKey]) ladAdd(p.lad); /* de eigen ladder van het project in de bibliotheek, vóór de velden */
  const img=new Image(); await new Promise((ok,no)=>{ img.onload=ok; img.onerror=no; img.src=p.img; });
  const c=document.createElement('canvas'); c.width=img.naturalWidth; c.height=img.naturalHeight; c.getContext('2d').drawImage(img,0,0);
  /* velden eerst, twee keer: de keuze van de ladder zet in een watcher de eenheid en de massa's
     en het eigen-ladderveld verschijnt pas daarna; de tweede ronde zet de bewaarde waarden terug */
  await gfPutState(p,()=>{ gf.libId=null; gf.src=c; gf.persp=null; gf.crop=null; gf.wells=null; gf.vl=null; });
  gfStatus('Project geopend.'); }
/* velden en toestand terugzetten (project openen, ongedaan maken); voor() draait tussen velden en toestand */
async function gfPutState(p,voor){
  const put=()=>gfProjFields().forEach(el=>{ if(!(el.id in (p.inp||{}))) return; const v=p.inp[el.id]; if(el.type==='checkbox') el.checked=!!v; else el.value=String(v); el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); });
  put(); await new Promise(r=>setTimeout(r,0)); put(); await new Promise(r=>setTimeout(r,0));
  if(voor) voor(); gf.cache={}; gf.mode=null; gf.drag=null; gf.pend=null;
  GF_PROJ.forEach(k=>{ if(k in p.gf) gf[k]=p.gf[k]; });
  gf.lanes=gf.lanes.filter(l=>l&&isFinite(l.x)).map(l=>({...l,label:String(l.label??'')})); gf.marks=Array.isArray(gf.marks)?gf.marks:[];
  gf.ladder=Math.max(0,Math.min(gf.lanes.length-1,Math.round(+gf.ladder)||0));
  gf.bands=gf.lanes[gf.ladder]?(gf.lanes[gf.ladder].bands||(gf.lanes[gf.ladder].bands=[])):[];
  /* de velden hebben gfUpdate() laten lopen; zonder dit zet de rechtzet-timer de lanen opnieuw */
  gfFine=gf.fine; clearTimeout(gfFineT);
  gfLanesTable(); gfBandsTable(); gfMarksTable(); gfRender(); }

/* ================= ONGEDAAN MAKEN MET ZICHTBARE GESCHIEDENIS (S74) =================
   Na elke tekening van de editor (gfRender, dus na elke bewerking) volgt na een korte pauze een
   momentopname van de toestand zonder foto; verschilt die van de huidige stap, dan komt er een
   stap bij met een naam die zegt wat er veranderde. Tijdens slepen niet: pas bij loslaten.
   Een nieuwe foto of een geopend project begint een nieuwe geschiedenis. Ongedaan maken en
   opnieuw zetten velden en toestand terug zoals een project openen. */
const gfHist={list:[],i:-1,src:null,busy:false,t:null};
const gfHistJ=()=>JSON.stringify(gfStateSnap(),gfJsonW);
function gfHistRec(){ if(gfHist.busy||!gf.src||gf.drag||gf.mode==='crop'||gf.mode==='persp') return;
  if(gf.src!==gfHist.src){ gfHist.src=gf.src; gfHist.list=[]; gfHist.i=-1; }
  const j=gfHistJ(), cur=gfHist.list[gfHist.i]; if(cur&&cur.j===j) return;
  gfHist.list.splice(gfHist.i+1); gfHist.list.push({j,lab:cur?gfHistLab(JSON.parse(cur.j,gfJsonR),JSON.parse(j,gfJsonR)):'Foto geladen'});
  if(gfHist.list.length>80) gfHist.list.shift(); gfHist.i=gfHist.list.length-1; gfHistUi(); }
/* wat veranderde er tussen twee momentopnamen; de eerste die past, telt */
function gfHistLab(a,b){ const A=a.gf, B=b.gf, ne=(p,q)=>JSON.stringify(p)!==JSON.stringify(q), nb=g=>(g.lanes||[]).reduce((t,l)=>t+(l.lad&&l.bands?l.bands.length:0),0);
  if(ne(A.persp,B.persp)) return 'Perspectief gecorrigeerd';
  if(ne(A.crop,B.crop)) return 'Bijgesneden';
  if(A.rot90!==B.rot90||A.flip!==B.flip||A.fine!==B.fine) return 'Gedraaid of rechtgezet';
  if(A.lanes.length!==B.lanes.length) return B.lanes.length>A.lanes.length?'Lane toegevoegd':'Lane verwijderd';
  if(A.marks.length!==B.marks.length) return B.marks.length>A.marks.length?'Meting toegevoegd':'Meting verwijderd';
  if(nb(A)!==nb(B)) return nb(B)>nb(A)?'Ladderband toegevoegd':'Ladderband verwijderd';
  if(A.lw!==B.lw) return 'Lanebreedte aangepast';
  if(ne(A.lanes.map(l=>l.label),B.lanes.map(l=>l.label))) return 'Lanelabel gewijzigd';
  if(ne(A.lanes.map(l=>l.x),B.lanes.map(l=>l.x))) return 'Lane verschoven';
  if(ne(A.marks,B.marks)) return 'Meting verschoven';
  if(ne(A.lanes,B.lanes)||A.ladder!==B.ladder||A.ladKey!==B.ladKey) return 'Ladder gewijzigd';
  if(A.inv!==B.inv||A.gray!==B.gray||A.bri!==B.bri||A.con!==B.con) return 'Beeld aangepast';
  if(A.title!==B.title||A.fs!==B.fs||A.ang!==B.ang||A.angAuto!==B.angAuto) return 'Opmaak gewijzigd';
  return 'Instelling gewijzigd'; }
function gfHistUi(){ if(window.__gfRefresh) window.__gfRefresh(); if(typeof undoBtns==='function') undoBtns(); }
async function gfHistGo(k){ if(gfHist.busy||k<0||k>=gfHist.list.length||k===gfHist.i) return;
  gfHist.busy=true; clearTimeout(gfHist.t); gfHist.i=k;
  try{ await gfPutState(JSON.parse(gfHist.list[k].j,gfJsonR)); gfHist.list[k].j=gfHistJ(); }  /* de velden normaliseren hun waarde: bewaar wat er echt staat */
  finally{ gfHist.busy=false; } gfStatus('Teruggezet: '+uv(trPlain(gfHist.list[k].lab))+'.'); gfHistUi(); }
const gfUndo=()=>gfHistGo(gfHist.i-1), gfRedo=()=>gfHistGo(gfHist.i+1);
document.addEventListener('keydown',e=>{ if(typeof current==='undefined'||current!=='gelfoto'||!(e.ctrlKey||e.metaKey)||e.altKey) return;
  const t=e.target, k=e.key.toLowerCase(); if(t.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(t.tagName)||document.querySelector('.lk-modal')) return;
  if(k==='z'&&!e.shiftKey){ e.preventDefault(); gfUndo(); } else if(k==='y'||(k==='z'&&e.shiftKey)){ e.preventDefault(); gfRedo(); } });

/* bewaart de gel in de bibliotheek (IndexedDB); dezelfde gel werkt zijn eigen item bij */
async function gfLibSave(quiet){ const s=gfProjSnap(); if(!s){ gfStatus('Kies eerst een gelfoto of laad de demo-gel.'); return; }
  const id=gf.libId||(gf.libId='g'+Date.now().toString(36)+Math.random().toString(36).slice(2,6));
  const r=gfRender(true), k=Math.min(1,160/r.width), t=document.createElement('canvas'); t.width=Math.max(1,Math.round(r.width*k)); t.height=Math.max(1,Math.round(r.height*k));
  t.getContext('2d').drawImage(r,0,0,t.width,t.height);
  const ok=await libPut({id,name:gf.title||'Gel',date:Date.now(),thumb:t.toDataURL('image/jpeg',0.7),snap:s});
  if(!ok) gf.libId=null;
  if(!ok||!quiet) gfStatus(ok?'Bewaard in de bibliotheek.':'De bibliotheek is niet beschikbaar in deze browser.'); }
async function gfLibOpen(e){ try{ await gfProjApply(e.snap); gf.libId=e.id; }catch(x){ gfStatus('Dit bestand is geen Labkit-gelproject.'); } }

/* Alles hierboven ook als globale naam, live: een toewijzing (timers = …, gfIntensity = …) in
   deze module of in de oude scripts komt aan beide kanten aan. */
live({
  gf: () => gf,
  gcv: () => gcv,
  gfStatus: [() => gfStatus, v => { gfStatus = v; }],
  gfSetIn: [() => gfSetIn, v => { gfSetIn = v; }],
  gfLoadCanvas: [() => gfLoadCanvas, v => { gfLoadCanvas = v; }],
  gfFromImage: [() => gfFromImage, v => { gfFromImage = v; }],
  gfFile: [() => gfFile, v => { gfFile = v; }],
  gfDemo: [() => gfDemo, v => { gfDemo = v; }],
  gfRotated: [() => gfRotated, v => { gfRotated = v; }],
  gfProc: [() => gfProc, v => { gfProc = v; }],
  gfSat: [() => gfSat, v => { gfSat = v; }],
  smooth: [() => smooth, v => { smooth = v; }],
  peaks: [() => peaks, v => { peaks = v; }],
  gfWells: [() => gfWells, v => { gfWells = v; }],
  gfDetectLanes: [() => gfDetectLanes, v => { gfDetectLanes = v; }],
  laneProfile: [() => laneProfile, v => { laneProfile = v; }],
  gfPeakNear: [() => gfPeakNear, v => { gfPeakNear = v; }],
  gfLadder: [() => gfLadder, v => { gfLadder = v; }],
  gfWellRows: [() => gfWellRows, v => { gfWellRows = v; }],
  nearWell: () => nearWell,
  gfFindLadder: [() => gfFindLadder, v => { gfFindLadder = v; }],
  gfDetectBandsFor: [() => gfDetectBandsFor, v => { gfDetectBandsFor = v; }],
  gfDetectBands: [() => gfDetectBands, v => { gfDetectBands = v; }],
  gfEst: [() => gfEst, v => { gfEst = v; }],
  gfRange: [() => gfRange, v => { gfRange = v; }],
  gfSizeTxt: [() => gfSizeTxt, v => { gfSizeTxt = v; }],
  gfSyncBands: [() => gfSyncBands, v => { gfSyncBands = v; }],
  gfSetActive: [() => gfSetActive, v => { gfSetActive = v; }],
  gfEst1: [() => gfEst1, v => { gfEst1 = v; }],
  gfLanesTable: [() => gfLanesTable, v => { gfLanesTable = v; }],
  gfLaneLad: [() => gfLaneLad, v => { gfLaneLad = v; }],
  gfLaneDel: [() => gfLaneDel, v => { gfLaneDel = v; }],
  gfBandTxt: [() => gfBandTxt, v => { gfBandTxt = v; }],
  gfBandsTable: [() => gfBandsTable, v => { gfBandsTable = v; }],
  gfBandBp: [() => gfBandBp, v => { gfBandBp = v; }],
  gfMergeBands: [() => gfMergeBands, v => { gfMergeBands = v; }],
  gfSplitBand: [() => gfSplitBand, v => { gfSplitBand = v; }],
  gfBandMerge: [() => gfBandMerge, v => { gfBandMerge = v; }],
  gfBandSplit: [() => gfBandSplit, v => { gfBandSplit = v; }],
  gfBandDel: [() => gfBandDel, v => { gfBandDel = v; }],
  gfBandsAfter: [() => gfBandsAfter, v => { gfBandsAfter = v; }],
  gfMarksTable: [() => gfMarksTable, v => { gfMarksTable = v; }],
  gfFmtSize: () => gfFmtSize,
  gfDU: () => gfDU,
  gfLadNg: [() => gfLadNg, v => { gfLadNg = v; }],
  gfMarkNg: [() => gfMarkNg, v => { gfMarkNg = v; }],
  gfNgTxt: () => gfNgTxt,
  gfLab: () => gfLab,
  gxOpts: [() => gxOpts, v => { gxOpts = v; }],
  gfLadAnalyze: [() => gfLadAnalyze, v => { gfLadAnalyze = v; }],
  gfFitQ: [() => gfFitQ, v => { gfFitQ = v; }],
  gfCorr: [() => gfCorr, v => { gfCorr = v; }],
  gfLadMatch: [() => gfLadMatch, v => { gfLadMatch = v; }],
  gfVlLoad: [() => gfVlLoad, v => { gfVlLoad = v; }],
  gfVlFile: [() => gfVlFile, v => { gfVlFile = v; }],
  gfVlClear: [() => gfVlClear, v => { gfVlClear = v; }],
  gfVlPick: [() => gfVlPick, v => { gfVlPick = v; }],
  gfVlSizes: [() => gfVlSizes, v => { gfVlSizes = v; }],
  gfVlUse: [() => gfVlUse, v => { gfVlUse = v; }],
  gfVlChoose: [() => gfVlChoose, v => { gfVlChoose = v; }],
  gfVlApply: [() => gfVlApply, v => { gfVlApply = v; }],
  gfVlPreview: [() => gfVlPreview, v => { gfVlPreview = v; }],
  gfYofBp: [() => gfYofBp, v => { gfYofBp = v; }],
  gfVlWarp: [() => gfVlWarp, v => { gfVlWarp = v; }],
  gfRender: [() => gfRender, v => { gfRender = v; }],
  gfFine: [() => gfFine, v => { gfFine = v; }],
  gfFineT: [() => gfFineT, v => { gfFineT = v; }],
  gfUpdate: [() => gfUpdate, v => { gfUpdate = v; }],
  gfGeom: [() => gfGeom, v => { gfGeom = v; }],
  gfR90: [() => gfR90, v => { gfR90 = v; }],
  gfFlip: [() => gfFlip, v => { gfFlip = v; }],
  gfBandsBtn: [() => gfBandsBtn, v => { gfBandsBtn = v; }],
  setMode: [() => setMode, v => { setMode = v; }],
  gfMeasureBtn: [() => gfMeasureBtn, v => { gfMeasureBtn = v; }],
  gfUncrop: [() => gfUncrop, v => { gfUncrop = v; }],
  gfCropFind: [() => gfCropFind, v => { gfCropFind = v; }],
  gfCropOk: [() => gfCropOk, v => { gfCropOk = v; }],
  gfCropHit: [() => gfCropHit, v => { gfCropHit = v; }],
  gfFindGel: [() => gfFindGel, v => { gfFindGel = v; }],
  gfZoom: [() => gfZoom, v => { gfZoom = v; }],
  cvPt: [() => cvPt, v => { cvPt = v; }],
  gfMarkHit: [() => gfMarkHit, v => { gfMarkHit = v; }],
  gfDbl: [() => gfDbl, v => { gfDbl = v; }],
  gfTouch: () => gfTouch,
  gfUp: [() => gfUp, v => { gfUp = v; }],
  gfLwHit: [() => gfLwHit, v => { gfLwHit = v; }],
  gfIntensity: [() => gfIntensity, v => { gfIntensity = v; }],
  gfMarkInt: [() => gfMarkInt, v => { gfMarkInt = v; }],
  gfMeasAll: [() => gfMeasAll, v => { gfMeasAll = v; }],
  gfClearMarks: [() => gfClearMarks, v => { gfClearMarks = v; }],
  laneProfileRaw: [() => laneProfileRaw, v => { laneProfileRaw = v; }],
  rollingBall: [() => rollingBall, v => { rollingBall = v; }],
  densArea: [() => densArea, v => { densArea = v; }],
  gfRf: [() => gfRf, v => { gfRf = v; }],
  gfDensChanged: [() => gfDensChanged, v => { gfDensChanged = v; }],
  gfAutoStraighten: [() => gfAutoStraighten, v => { gfAutoStraighten = v; }],
  LMASS: () => LMASS,
  gfRawCrop: [() => gfRawCrop, v => { gfRawCrop = v; }],
  gfHomog: [() => gfHomog, v => { gfHomog = v; }],
  gfWarp: [() => gfWarp, v => { gfWarp = v; }],
  gfWarped: [() => gfWarped, v => { gfWarped = v; }],
  gfQuadDefault: () => gfQuadDefault,
  gfFindQuad: [() => gfFindQuad, v => { gfFindQuad = v; }],
  gfPerspFind: [() => gfPerspFind, v => { gfPerspFind = v; }],
  gfPerspOk: [() => gfPerspOk, v => { gfPerspOk = v; }],
  gfPerspOff: [() => gfPerspOff, v => { gfPerspOff = v; }],
  gfSmartCrop: [() => gfSmartCrop, v => { gfSmartCrop = v; }],
  gfEdits: [() => gfEdits, v => { gfEdits = v; }],
  gfEnhance: [() => gfEnhance, v => { gfEnhance = v; }],
  gfMassSlope: [() => gfMassSlope, v => { gfMassSlope = v; }],
  gfMassChanged: [() => gfMassChanged, v => { gfMassChanged = v; }],
  gfUnitMsg: [() => gfUnitMsg, v => { gfUnitMsg = v; }],
  gfProjSnap: [() => gfProjSnap, v => { gfProjSnap = v; }],
  gfProjSave: [() => gfProjSave, v => { gfProjSave = v; }],
  gfProjOpen: [() => gfProjOpen, v => { gfProjOpen = v; }],
  gfProjApply: [() => gfProjApply, v => { gfProjApply = v; }],
  gfLibSave: [() => gfLibSave, v => { gfLibSave = v; }],
  gfStateSnap: [() => gfStateSnap, v => { gfStateSnap = v; }],
  gfPutState: [() => gfPutState, v => { gfPutState = v; }],
  gfHist: () => gfHist,
  gfHistJ: () => gfHistJ,
  gfHistRec: [() => gfHistRec, v => { gfHistRec = v; }],
  gfHistLab: [() => gfHistLab, v => { gfHistLab = v; }],
  gfHistUi: [() => gfHistUi, v => { gfHistUi = v; }],
  gfHistGo: [() => gfHistGo, v => { gfHistGo = v; }],
  gfUndo: () => gfUndo,
  gfRedo: () => gfRedo,
  gfLibOpen: [() => gfLibOpen, v => { gfLibOpen = v; }],
  gfLabHit: [() => gfLabHit, v => { gfLabHit = v; }],
  gfLabEdit: [() => gfLabEdit, v => { gfLabEdit = v; }]
});
