/* ================= OUDE APP-LAAG (S269) =================
   Letterlijk overgenomen uit het vierde inline script van src/shell/index.html: export, plakken
   uit Excel, kopiëren naar Excel, opslaan van sessies en tabellen, statistiek, protocoltekeningen,
   instellingen, updates, tags en wat er van de oudere tools nog over is. Zelfde afspraken als
   src/legacy/core.js. */
import {live} from '../lib/global.js';

/* nums, mean, sd, linreg, lmfit, chart en inp staan sinds S267 in src/lib/fit.js en src/lib/chart.js */

/* ================= STANDAARDCURVE ================= */
/* Standaardcurve staat in src/tools/Curve.vue; hieronder blijven alleen de fit-functies. sLoad() bestaat nog
   omdat het opstartblok hem aanroept (src/legacy/init.js); de component
   start al met het Bradford-voorbeeld. */
function sLoad(){}
function coef(v,s=4){ if(!isFinite(v)) return '–'; if(v!==0&&(Math.abs(v)<1e-3||Math.abs(v)>=1e7)){ const e=Math.floor(Math.log10(Math.abs(v))); return `${NL(Number((v/10**e).toFixed(s-1)),s-1)}×10<sup>${e}</sup>`; } return sig(v,s); }
function fitCurve(model,X,Y){
  if(model==='lin'){ const r=linreg(X,Y); return {f:x=>r.a+r.b*x, inv:y=>(y-r.a)/r.b, eq:`y = ${coef(r.a)} ${r.b<0?'−':'+'} ${coef(Math.abs(r.b))}·x`}; }
  if(model==='lin0'){ const b=X.reduce((s,x,i)=>s+x*Y[i],0)/X.reduce((s,x)=>s+x*x,0); return {f:x=>b*x, inv:y=>y/b, eq:`y = ${coef(b)}·x`}; }
  if(model==='quad'){ const S=k=>X.reduce((s,x)=>s+x**k,0), T=k=>X.reduce((s,x,i)=>s+x**k*Y[i],0); const c=solveLin([[X.length,S(1),S(2)],[S(1),S(2),S(3)],[S(2),S(3),S(4)]],[T(0),T(1),T(2)]); if(!c) return null; const [a,b,q]=c; const xmax=Math.max(...X);
    return {f:x=>a+b*x+q*x*x, inv:y=>{ if(Math.abs(q)<1e-15) return (y-a)/b; const D=b*b-4*q*(a-y); if(D<0) return NaN; const r=[(-b+Math.sqrt(D))/(2*q),(-b-Math.sqrt(D))/(2*q)].filter(v=>v>=-0.05*xmax&&v<=1.5*xmax); return r.length?Math.min(...r):NaN; }, eq:`y = ${coef(a)} + ${coef(b)}·x ${q<0?'−':'+'} ${coef(Math.abs(q))}·x²`}; }
  if(model==='5pl'){ const b4=fitCurve('4pl',X,Y); const pos=X.filter(x=>x>0); const gm=10**mean(pos.map(Math.log10)); const f=(x,p)=>p[3]+(p[0]-p[3])/Math.pow(1+Math.pow(Math.max(x,0)/Math.exp(p[2]),p[1]),Math.exp(p[4]));
    const st=b4&&b4.p4?[...b4.p4,0]:[Math.min(...Y),1,Math.log(gm),Math.max(...Y)*1.1,0]; const r=lmfit(f,st,X,Y,800); const [A,B,lC,D,lE]=r.p, Cc=Math.exp(lC), E=Math.exp(lE);
    return {f:x=>f(x,r.p), inv:y=>{ const q=(A-D)/(y-D); if(!(q>0)) return NaN; const t=Math.pow(q,1/E)-1; return t>0?Cc*Math.pow(t,1/B):NaN; }, eq:`A = ${sig(A,4)} · B = ${sig(B,3)} · C = ${sig(Cc,4)} · D = ${sig(D,4)} · E = ${sig(E,3)}`, lo:Math.min(A,D), hi:Math.max(A,D), np:5}; }
  if(model==='4pl'){ const pos=X.filter(x=>x>0); const gm=10**mean(pos.map(Math.log10)); const f=(x,p)=>p[3]+(p[0]-p[3])/(1+Math.pow(Math.max(x,0)/Math.exp(p[2]),p[1]));
    const r=lmfit(f,[Math.min(...Y),1,Math.log(gm),Math.max(...Y)*1.1],X,Y,500); const [A,B,lC,D]=r.p, Cc=Math.exp(lC);
    return {p4:r.p, f:x=>f(x,r.p), inv:y=>{ const q=(A-y)/(y-D); return q>0?Cc*Math.pow(q,1/B):NaN; }, eq:`A = ${sig(A,4)} · B = ${sig(B,3)} · C = ${sig(Cc,4)} · D = ${sig(D,4)}`, lo:Math.min(A,D), hi:Math.max(A,D)}; }
}
calc.curve=function(){}; /* de component src/tools/Curve.vue rekent zelf; fitCurve hierboven wordt door hem aangeroepen */

/* ================= ENZYMKINETIEK ================= */
function mmFit(S,V){
  const lb=linreg(S.map(s=>1/s),V.map(v=>1/v)); const lbV=1/lb.a, lbK=lb.b/lb.a;
  const hw=linreg(S,S.map((s,i)=>s/V[i])); const hwV=1/hw.b, hwK=hw.a/hw.b;
  const p0=[isFinite(hwV)&&hwV>0?hwV:Math.max(...V)*1.2, Math.log(isFinite(hwK)&&hwK>0?hwK:mean(S))];
  const r=lmfit((s,p)=>p[0]*s/(Math.exp(p[1])+s),p0,S,V);
  const Vm=r.p[0], Km=Math.exp(r.p[1]);
  const eh=linreg(V.map((v,i)=>v/S[i]),V);
  const st=(x,y,f)=>{ const n=x.length, mx=mean(x), sxx=x.reduce((a,v)=>a+(v-mx)**2,0), res=y.reduce((a,v,i)=>a+(v-(f.a+f.b*x[i]))**2,0), s=n>2?Math.sqrt(res/(n-2)):NaN; return {seb:s/Math.sqrt(sxx),sea:s*Math.sqrt(1/n+mx*mx/sxx),x0:-f.a/f.b}; };
  return {Vm,Km,seV:r.se[0],seK:Km*r.se[1],lb:{V:lbV,K:lbK,a:lb.a,b:lb.b,r2:lb.r2,...st(S.map(s=>1/s),V.map(v=>1/v),lb)},hw:{V:hwV,K:hwK,a:hw.a,b:hw.b,r2:hw.r2,...st(S,S.map((s,i)=>s/V[i]),hw)},eh:{V:eh.a,K:-eh.b,a:eh.a,b:eh.b,r2:eh.r2,...st(V.map((v,i)=>v/S[i]),V,eh)}};
}
calc.enzym=function(){}; /* de component src/tools/Enzym.vue rekent zelf; mmFit hierboven wordt door hem aangeroepen */

/* ================= PCR-CYCLUS ================= */
const NN={AA:[-7.9,-22.2],TT:[-7.9,-22.2],AT:[-7.2,-20.4],TA:[-7.2,-21.3],CA:[-8.5,-22.7],TG:[-8.5,-22.7],GT:[-8.4,-22.4],AC:[-8.4,-22.4],CT:[-7.8,-21.0],AG:[-7.8,-21.0],GA:[-8.2,-22.2],TC:[-8.2,-22.2],CG:[-10.6,-27.2],GC:[-9.8,-24.4],GG:[-8.0,-19.9],CC:[-8.0,-19.9]};
function tmNN(seq,naMM,mgMM,dntpMM,primerUM){
  if(seq.length<2||/[^ACGT]/.test(seq)) return NaN;
  let H=0,S=0; for(let i=0;i<seq.length-1;i++){ const p=NN[seq.slice(i,i+2)]; H+=p[0]; S+=p[1]; }
  [seq[0],seq[seq.length-1]].forEach(b=>{ if(b==='G'||b==='C'){ H+=0.1; S+=-2.8; } else { H+=2.3; S+=4.1; } });
  const rc=seq.split('').reverse().map(b=>({A:'T',T:'A',G:'C',C:'G'})[b]).join(''); if(rc===seq) S+=-1.4;
  let na=naMM; if(mgMM>dntpMM) na+=120*Math.sqrt(mgMM-dntpMM);
  S+=0.368*(seq.length-1)*Math.log(Math.max(na,1e-3)/1000);
  const C=primerUM*1e-6, x=1; /* primer in overmaat t.o.v. template (PCR): ln(C_primer) */
  return H*1000/(S+1.987*Math.log(C/x))-273.15;
}
function primerInfo(s,ion){
  const seq=String(s).toUpperCase().replace(/[^A-Z]/g,''); const N=seq.length; if(!N) return null;
  const c=b=>(seq.match(new RegExp(b,'g'))||[]).length; const A=c('A'),T=c('T'),G=c('G'),C=c('C'); const other=N-A-T-G-C;
  const gc=G+C; const basic=N<14?4*gc+2*(A+T):64.9+41*(gc-16.4)/N;
  const io=ion||{na:num($('#y-na').value)||0,mg:num($('#y-mg').value)||0,dntp:num($('#y-dntp').value)||0,pc:num($('#y-pc').value)||0.2};
  const nn=tmNN(seq,io.na,io.mg,io.dntp,io.pc);
  return {seq,N,gc,gcp:gc/N*100,tm:isFinite(nn)?nn:basic,basic,nn,other,clamp:/[GC]$/.test(seq),rule:isFinite(nn)?'Nearest-neighbor (SantaLucia 1998)':(N<14?'4·GC + 2·AT':'64,9 + 41·(GC − 16,4)/N')};
}
const mmss2=s=>{ s=Math.round(s); const h=Math.floor(s/3600), m=Math.floor(s%3600/60), x=s%60; return h?trPlain(`${h} u ${String(m).padStart(2,'0')} min`):m?`${m}:${String(x).padStart(2,'0')} min`:`${x} s`; };
calc.pcrcyclus=function(){};
function drawProfile(cv,steps,n){
  const W=480,H=210,dpr=window.devicePixelRatio||1; cv.width=W*dpr; cv.height=H*dpr; cv.style.width='100%'; cv.style.maxWidth=W+'px';
  const ctx=cv.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,W,H);
  const cs=getComputedStyle(document.documentElement), C=k=>cs.getPropertyValue(k).trim();
  const pad={l:10,r:10,t:26,b:30}, sw=(W-pad.l-pad.r)/steps.length, rw=sw*0.18;
  const Y=t=>H-pad.b-(t-0)/(100-0)*(H-pad.t-pad.b);
  ctx.lineWidth=2.5; ctx.strokeStyle=C('--accent'); ctx.beginPath();
  let prev=25; steps.forEach((s,i)=>{ const x0=pad.l+i*sw; if(i===0) ctx.moveTo(x0,Y(prev)); ctx.lineTo(x0+rw,Y(s[1])); ctx.lineTo(x0+sw,Y(s[1])); prev=s[1]; }); ctx.stroke();
  ctx.font='600 11px '+C('--font-ui'); ctx.textAlign='center';
  steps.forEach((s,i)=>{ const xc=pad.l+i*sw+rw+(sw-rw)/2; ctx.fillStyle=C('--ink'); ctx.textBaseline='bottom'; ctx.fillText(fmt(s[1],1)+'°',xc,Y(s[1])-5); ctx.fillStyle=C('--muted'); ctx.textBaseline='top'; ctx.font='11px '+C('--font-ui'); ctx.fillText(s[2]===Infinity?'∞':mmss2(s[2]).replace(' min','′'),xc,Y(s[1])+5); ctx.font='600 11px '+C('--font-ui'); });
  cv._data={head:['stap','temperatuur (°C)','tijd (s)','cycli'],rows:steps.map(s=>[s[0],s[1],s[2]===Infinity?'∞':s[2],s[3]?n:1])};
  const x0=pad.l+sw, x1=pad.l+4*sw; ctx.strokeStyle=C('--muted'); ctx.lineWidth=1; ctx.setLineDash([4,3]); ctx.strokeRect(x0+2,pad.t-18,x1-x0-4,H-pad.t-pad.b+26); ctx.setLineDash([]);
  ctx.fillStyle=C('--accent'); ctx.textBaseline='bottom'; ctx.fillText(`× ${n} cycli`,(x0+x1)/2,H-4);
}

/* de motor van de gelfoto-editor staat sinds S268 in src/engines/gelfoto.js */
/* ================= EXPORT / DOWNLOADS ================= */
const STANDALONE=!(window.claude&&typeof window.claude.use==='function');
let dlCap=null;
/* dlShown: of opslaan hier kan. De exportknop van de gelfoto-editor staat in Vue en leest
   deze vlag; showDl() loopt al voordat die component gemount is, dus hij tikt hem op. */
let dlShown=false;
function showDl(){ dlShown=true; $$('.dl-only').forEach(b=>b.style.display=''); if(window.__gfRefresh) window.__gfRefresh(); }
if(STANDALONE) showDl(); else { try{ window.claude.use('downloads').then(d=>{ dlCap=d; if(d) showDl(); }).catch(()=>{}); }catch(e){} }
async function saveBlob(name,blob){ if(dlCap){ await dlCap.save({filename:name,data:blob}); return; } const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },2000); }
const safeName=s=>(String(s||'').trim().replace(/[\\/:*?"<>|]+/g,'').replace(/\s+/g,'_').slice(0,80))||'labkit';
const csvBlob=t=>{ const D=LANG==='en'?',':';'; return new Blob(['﻿'+t.split('\n').map(r=>r.split('\t').map(c=>{ c=trPlain(c,true); return /[;,"\n]/.test(c)?`"${c.replace(/"/g,'""')}"`:c; }).join(D)).join('\r\n')],{type:'text/csv'}); };
async function dlMsg(el,fn){ try{ await fn(); el.textContent='Opgeslagen.'; }catch(err){ el.textContent=err&&err.code==='declined'?'Download geannuleerd.':'Downloaden lukte niet hier.'; } }
gcv.addEventListener('contextmenu',()=>{ if(!gf.src||gf.mode) return; const c=gfRender(true,1); const ctx=gcv.getContext('2d'); gcv.width=c.width; gcv.height=c.height; ctx.drawImage(c,0,0); setTimeout(()=>gfRender(),4000); });

/* ================= PLAKKEN UIT EXCEL ================= */
const ADDBTN={'q-tbl':'#q-add','o-tbl':'#o-add','wb-tbl':'#wb-add','rm-tbl':'#rm-add','ol-tbl':'#ol-add','ss-tbl':'#ss-add'};
document.addEventListener('paste',e=>{
  const el=e.target; if(el.tagName!=='INPUT') return; const td=el.closest('td'), tb=el.closest('tbody'); if(!td||!tb) return;
  const txt=(e.clipboardData||window.clipboardData).getData('text')||''; if(!/[\t\n]/.test(txt.trim())) return;
  e.preventDefault();
  const rows=txt.replace(/\r/g,'').replace(/\n+$/,'').split('\n').map(l=>l.split('\t'));
  const tr0=td.closest('tr'), ri=[...tb.children].indexOf(tr0), ins=tr=>[...tr.querySelectorAll('input:not([type=radio]):not([type=checkbox])')], ci=ins(tr0).indexOf(el);
  const id=tb.closest('table').id, def=TBLDEF[id], add=ADDBTN[id];
  /* Bij een tabel die Vue rendert kan dit niet via de DOM: de toevoegknop klikken geeft pas op
     de volgende tick een rij, en de rijen die hier nog bij moeten zouden wegvallen. Zo'n tabel
     geeft get(), blank() en set() mee, dus de rijen worden daar als waarden ingezet. */
  if(def&&def.get&&def.set){
    const cur=def.get(), blank=def.blank?def.blank():(cur[0]||[]).map(()=>'');
    const map=def.inputCols||blank.map((_,i)=>i);
    rows.forEach((cells,k)=>{ const r=ri+k; while(cur.length<=r) cur.push(blank.slice());
      cells.forEach((v,j)=>{ const cj=map[ci+j]; if(cj!=null) cur[r][cj]=v.trim(); }); });
    def.set(cur); return;
  }
  rows.forEach((cells,k)=>{ let tr=tb.children[ri+k]; if(!tr&&add){ $(add).click(); tr=tb.children[ri+k]; } if(!tr) return; const I=ins(tr); cells.forEach((v,j)=>{ const t=I[ci+j]; if(!t) return; t.value=v.trim();
    /* ook per cel een input-event, anders ziet een reactieve tabel de andere cellen niet */
    t.dispatchEvent(new Event('input',{bubbles:true})); }); });
  el.dispatchEvent(new Event('input',{bubbles:true}));
});

/* ================= INVOER ONTHOUDEN ================= */
const STORE='labkit:v1:inputs';
const NOPERSIST=/^(ui-lang|bento-q|pp-preset|nav-q|k-sq|gf-|o-preset|s-preset|q-preset|c-preset|b-ladder|w-fmt|tm-)/;
function storeGet(){ try{ return JSON.parse(localStorage.getItem(STORE)||'{}'); }catch(e){ return {}; } }
function persistable(el){ return el&&el.id&&!NOPERSIST.test(el.id)&&el.type!=='file'&&!el.closest('table')&&(el.tagName==='INPUT'||el.tagName==='SELECT'||el.tagName==='TEXTAREA'); }
function persistSave(e){ const el=e.target; if(!persistable(el)) return; const s=storeGet(); s[el.id]=el.type==='checkbox'?el.checked:el.value; try{ localStorage.setItem(STORE,JSON.stringify(s)); }catch(err){} }
document.addEventListener('input',persistSave); document.addEventListener('change',persistSave);
(function restore(){ const s=storeGet(); Object.entries(s).forEach(([id,v])=>{ const el=document.getElementById(id); if(!persistable(el)) return; if(el.type==='checkbox') el.checked=!!v; else el.value=v; }); })();
$('#reset-store').addEventListener('click',()=>{ try{ localStorage.removeItem(STORE); localStorage.removeItem('labkit:v1:timers'); localStorage.removeItem('labkit:v1:teller'); }catch(e){} location.reload(); });

/* ================= OFFLINE (PWA) ================= */
if(STANDALONE&&!window.__TAURI__&&'serviceWorker' in navigator&&/^https?:/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(()=>{});

/* ================= ZOEKEN IN TOOLS ================= */
$('#nav-q').addEventListener('input',e=>{ const q=e.target.value.trim().toLowerCase(); const kids=[...$('#nav').children]; kids.forEach(el=>{ if(el.tagName==='A') el.hidden=!!q&&!navMatch(el,q); });
  kids.forEach((el,i)=>{ if(!el.classList.contains('navgroup')) return; let any=false; for(let j=i+1;j<kids.length&&kids[j].tagName==='A';j++) if(!kids[j].hidden) any=true; el.hidden=!any; }); });
$('#nav-q').addEventListener('keydown',e=>{ if(e.key==='Enter'){ const a=$('#nav > a:not([hidden])'); if(a){ location.hash=a.getAttribute('href'); e.target.value=''; e.target.dispatchEvent(new Event('input')); } } });

/* ================= TELKAMER: VAKKEN PER KAMER ================= */
const KSQ={'0.1':[[1,'Groot vak: 1,0 mm² (100 nL = 0,1 µL)'],[0.04,'Groepsvak (Bürker/Bürker-Türk): 0,04 mm² (4 nL = 0,004 µL)'],[0.0025,'Klein vak (Bürker-Türk): 0,0025 mm² (0,25 nL)']],'0.1n':[[1,'Groot vak: 1,0 mm² (100 nL = 0,1 µL)'],[0.0625,'Hoekvakje (1/16 groot vak): 0,0625 mm² (6,25 nL)'],[0.04,'Groepsvak midden (1/25 groot vak): 0,04 mm² (4 nL = 0,004 µL)'],[0.0025,'Klein vak (Neubauer): 0,0025 mm² (0,25 nL)']],'0.2':[[1,'Groot vak: 1,0 mm² (200 nL = 0,2 µL)'],[0.0625,'Klein vak: 0,0625 mm² (12,5 nL)']]};
/* De vakken van k-sq worden nu door de component getekend (Vue rendert pas bij de volgende tick).
   kSq() blijft bestaan voor tests/validate.py, die na een kamerwissel meteen een vak kiest: hij
   laat de component direct, synchroon, opnieuw tekenen, dus de opties staan er dan al. */
function kSq(){ const vm=window.__telkamerVm; if(vm&&vm.$&&vm.$.update) vm.$.update(); }

/* ================= KOPIËREN NAAR EXCEL ================= */
function cellText(td){ const ins=[...td.querySelectorAll('input:not([type=radio]):not([type=checkbox]),select,textarea')]; if(ins.length) return ins.map(i=>i.tagName==='SELECT'?(i.options[i.selectedIndex]?i.options[i.selectedIndex].text:i.value):i.value).join(' ').trim();
  const r=td.querySelector('input[type=radio],input[type=checkbox]'); if(r) return r.checked?'ja':'';
  const c=td.cloneNode(true); c.querySelectorAll('button').forEach(b=>b.remove()); c.querySelectorAll('sup').forEach(x=>x.replaceWith('^'+x.textContent)); c.querySelectorAll('sub').forEach(x=>x.replaceWith(x.textContent));
  return c.textContent.replace(/\u00ad/g,'').replace(/\s+/g,' ').trim(); }
function xlParse(t){ if(LANG==='en'){ const m=String(t).match(/^(-?\d{1,3}(?:,\d{3})+(?:\.\d+)?|-?\d+(?:\.\d+)?)(?:\s*×\s*10\^(-?\d+))?\s*(.*)$/); if(!m) return null; const unit=m[3].trim(); if(/[\d:]/.test(unit)) return null; let n=Number(m[1].replace(/,/g,'')); if(m[2]) n*=10**Number(m[2]); return isFinite(n)?{n,unit}:null; } const m=String(t).match(/^(-?\d{1,3}(?:\.\d{3})+(?:,\d+)?|-?\d+(?:,\d+)?)(?:\s*×\s*10\^(-?\d+))?\s*(.*)$/); if(!m) return null; const unit=m[3].trim(); if(/[\d:]/.test(unit)) return null; let n=Number(m[1].replace(/\./g,'').replace(',','.')); if(m[2]) n*=10**Number(m[2]); return isFinite(n)?{n,unit}:null; }
function xlNum(n){ if(!isFinite(n)) return ''; const a=Math.abs(n); let s=(a!==0&&(a<1e-4||a>=1e9))?n.toExponential(6).replace(/\.?0+e/,'e').toUpperCase():String(Number(n.toPrecision(12))); return LANG==='en'?s:s.replace('.',','); }
function tableData(tbl){
  const EMPTY=v=>v===''||v==='–'||v==='-'; const rows=[...tbl.rows].map(r=>({head:!!r.closest('thead'),cells:[...r.cells].map(c=>{ const t=cellText(c); return EMPTY(t)&&!r.closest('thead')?'':t; })}));
  const nc=Math.max(0,...rows.map(r=>r.cells.length));
  const keep=[...Array(nc).keys()].filter(j=>rows.some(r=>(r.cells[j]||'')!==''));
  const head=rows.filter(r=>r.head), body=rows.filter(r=>!r.head);
  const colType=keep.map(j=>{ const vals=body.map(r=>r.cells[j]||'').filter(v=>v!==''); if(!vals.length) return null; const ps=vals.map(xlParse); if(ps.some(p=>!p)) return null; const units=[...new Set(ps.map(p=>p.unit))]; return units.length===1?units[0]:null; });
  const H=head.map(r=>keep.map((j,k)=>{ const t=r.cells[j]||''; return colType[k]?`${t} (${colType[k]})`:t; }));
  const B=body.map(r=>keep.map((j,k)=>{ const t=r.cells[j]||''; if(colType[k]!==null&&t!==''){ const p=xlParse(t); return p?{n:p.n}:t; } return t; }));
  return {H,B};
}
function toTSV(H,B){ const f=v=>typeof v==='object'?xlNum(v.n):String(v).replace(/[\t\n]/g,' '); return [...H,...B].map(r=>r.map(f).join('\t')).join('\r\n'); }
function toHTML(H,B){ const f=v=>esc(typeof v==='object'?xlNum(v.n):String(v)); return '<table>'+H.map(r=>'<tr>'+r.map(c=>`<th>${f(c)}</th>`).join('')+'</tr>').join('')+B.map(r=>'<tr>'+r.map(c=>`<td>${f(c)}</td>`).join('')+'</tr>').join('')+'</table>'; }
function flashBtn(b,t){ const o=b.dataset.label||b.textContent; b.dataset.label=o; b.textContent=t; b.classList.add('done'); setTimeout(()=>{ b.textContent=o; b.classList.remove('done'); },1600); }
async function copyRich(tsv,html,btn){ try{ if(window.ClipboardItem&&navigator.clipboard&&navigator.clipboard.write) await navigator.clipboard.write([new ClipboardItem({'text/plain':new Blob([tsv],{type:'text/plain'}),'text/html':new Blob([html],{type:'text/html'})})]); else await navigator.clipboard.writeText(tsv); flashBtn(btn,'Gekopieerd'); }
  catch(e){ try{ await navigator.clipboard.writeText(tsv); flashBtn(btn,'Gekopieerd'); }catch(e2){ flashBtn(btn,'Geblokkeerd'); } } }
function decorateXL(){
  /* Een Vue-tool bouwt zijn tabel opnieuw op als de uitkomst verandert. De balk hieronder is
     geen Vue-node, dus bij zo'n verwisseling blijft hij als wees achter en komt er een tweede
     balk bij. Een balk zonder tabel erachter of tekening ervoor hoort daarom weg. */
  $$('main .xlbar').forEach(b=>{ const n=b.nextElementSibling, pv=b.previousElementSibling;
    const tbl=n&&(n.tagName==='TABLE'?n:(n.querySelector?n.querySelector('table'):null));
    if(!tbl&&!(pv&&pv.tagName==='CANVAS')) b.replaceWith(); });
  $$('main table').forEach(t=>{ if(t.dataset.xl) return; t.dataset.xl='1'; const anchor=t.closest('.tbl-wrap')||t; const bar=document.createElement('div'); bar.className='xlbar'; bar.innerHTML=`<button type="button" class="xlbtn" data-xl-table title="${esc(trPlain('Kopieert de tabel; plak in Excel met Ctrl+V'))}">${trPlain('Kopieer naar Excel')}</button>`; anchor.parentNode.insertBefore(bar,anchor); });
  $$('main canvas').forEach(cv=>{ if(cv.dataset.xl||cv.id==='gf-cv'||cv.id==='gf-vlcv') return; cv.dataset.xl='1'; const bar=document.createElement('div'); bar.className='xlbar'; bar.innerHTML=`<button type="button" class="xlbtn" data-xl-img title="${esc(trPlain('Plak als afbeelding in Excel, Word of PowerPoint'))}">${trPlain('Kopieer grafiek')}</button><button type="button" class="xlbtn" data-xl-data title="${esc(trPlain('Kopieert de gegevens achter de grafiek; plak in Excel om zelf een grafiek te maken'))}">${trPlain('Kopieer data')}</button>`; cv.after(bar); });
}
/* één MutationObserver voor alle nabewerkingen van het werkvlak; elke taak heeft zijn eigen wachttijd */
const MAINW=[]; function lkMainWatch(fn,ms){ MAINW.push({fn,ms,t:null}); }
new MutationObserver(()=>{ for(const w of MAINW){ clearTimeout(w.t); w.t=setTimeout(w.fn,w.ms); } }).observe($('main'),{childList:true,subtree:true});
lkMainWatch(decorateXL,60);
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-xl-table],[data-xl-img],[data-xl-data]'); if(!b) return;
  if(b.hasAttribute('data-xl-table')){ let n=b.parentNode.nextElementSibling; const t=n&&(n.tagName==='TABLE'?n:n.querySelector('table')); if(!t) return; const {H,B}=tableData(t); copyRich(toTSV(H,B),toHTML(H,B),b); return; }
  const cv=b.parentNode.previousElementSibling; if(!cv||cv.tagName!=='CANVAS') return;
  if(b.hasAttribute('data-xl-img')){ const c=document.createElement('canvas'); c.width=cv.width; c.height=cv.height; const x=c.getContext('2d'); x.fillStyle=cv._p?'#fff':(getComputedStyle(document.documentElement).getPropertyValue('--surface').trim()||'#fff'); x.fillRect(0,0,c.width,c.height); x.drawImage(cv,0,0);
    (async()=>{ try{ await navigator.clipboard.write([new ClipboardItem({'image/png':new Promise(r=>c.toBlob(r,'image/png'))})]); flashBtn(b,'Gekopieerd'); }catch(err){ flashBtn(b,'Geblokkeerd'); } })(); return; }
  const D=cv._data; if(!D||!D.rows.length){ flashBtn(b,'Geen data'); return; }
  const B=D.rows.map(r=>r.map(v=>typeof v==='number'?{n:v}:trPlain(v,true))), Hd=D.head.map(h=>trPlain(h,true)); copyRich(toTSV([Hd],B),toHTML([Hd],B),b);
});

/* ================= qPCR ΔΔCt ================= */
/* de tool zelf staat sinds S232 in src/tools/Qpcr.vue; barChart() blijft hier staan */
/* barChart() staat sinds S267 in src/lib/chart.js */

/* ================= GROEICURVE =================
   Verhuisd naar src/tools/Groei.vue: de metingen (gc-tbl, een <lk-etable>), de velden, bestWindow()
   en de uitkomst. src/main.js zet calc.groei zo dat de tekening opnieuw wordt gemaakt. */
calc.groei=function(){};

/* FORENSISCHE KWANTIFICATIE (fq-*) zit sinds S228 in src/tools/Dna.vue */

/* ================= SESSIE OPSLAAN / OPENEN ================= */
$('#sess-save').addEventListener('click',()=>{ try{ localStorage.setItem(TBLKEY,JSON.stringify(tblSnap())); }catch(e){}
  const data={}; try{ for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k&&k.startsWith('labkit:')) data[k]=localStorage.getItem(k); } }catch(e){}
  const d=new Date(), stamp=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const pn=($('#sess-name').value||'').trim(); saveBlob(`${pn?safeName(pn):'labkit-sessie'}-${stamp}.json`,new Blob([JSON.stringify({app:'Labkit BML',project:pn,versie:APPVER,opgeslagen:d.toISOString(),data},null,1)],{type:'application/json'})).catch(()=>{}); });
$('#sess-open').addEventListener('click',()=>$('#sess-file').click());
$('#sess-file').addEventListener('change',e=>{ const f=e.target.files[0]; if(!f) return; f.text().then(t=>{ const j=JSON.parse(t); if(!j||j.app!=='Labkit BML'||typeof j.data!=='object') throw 0; Object.entries(j.data).forEach(([k,v])=>{ if(k.startsWith('labkit:')) localStorage.setItem(k,v); }); location.reload(); }).catch(()=>alertBox('Dit bestand is geen Labkit-sessie.')); });
function alertBox(t){ const n=document.createElement('div'); n.className='note bad'; n.style.cssText='position:fixed;left:16px;bottom:16px;z-index:50;max-width:320px'; n.textContent=t; document.body.appendChild(n); setTimeout(()=>n.remove(),4000); }

/* ================= TABELLEN, PLAAT EN REEKS BEWAREN ================= */
const TBLKEY='labkit:v1:tables';
const TBLDEF={
  /* de rijen worden door de Vue-component (src/tools/Pcr.vue) bijgehouden; geen lk-etable, want
     de tabel heeft berekende kolommen. get/blank/inputCols zijn er voor de plak-handler. */
  'q-tbl':{row:r=>'',num:[1,2],set:v=>{ const m=window.__pcrVm; if(m) m.setRows(v); },
    push:r=>{ const m=window.__pcrVm; if(m) m.pushRow(r); },
    get:()=>{ const m=window.__pcrVm; return m?m.getRows():[]; }, blank:()=>['','','','µL'], inputCols:[0,1,2]},
  /* de rijen worden door de Vue-component bijgehouden; set() en push() gaan daarheen */
  'o-tbl':{row:r=>'',num:[1,2],set:v=>{ const m=window.__oplosVm; if(m) m.setRows(v); },
    push:r=>{ const m=window.__oplosVm; if(m) m.pushRow(r); }},
  'wb-tbl':{row:r=>'',num:[1,2],set:v=>{ const m=window.__wbVm; if(m) m.setRows(v); },
    push:r=>{ const m=window.__wbVm; if(m) m.pushRow(r); },
    get:()=>{ const m=window.__wbVm; return m?m.getRows():[]; }, blank:()=>['','','','0'], inputCols:[0,1,2]},
  'ol-tbl':{row:r=>'',num:[1],set:v=>{ const m=window.__olVm; if(m) m.setRows(v); },
    push:r=>{ const m=window.__olVm; if(m) m.pushRow(r); },
    get:()=>{ const m=window.__olVm; return m?m.getRows():[]; }, blank:()=>['',''], inputCols:[0,1]}
};
function tblSnap(){ const out={}; Object.keys(TBLDEF).forEach(id=>{ out[id]=[...document.querySelectorAll('#'+id+' tbody tr')].map(tr=>[...tr.querySelectorAll('input:not([type=radio]):not([type=checkbox]),select')].map(e=>e.value)); });
  out.reeks=reeksCounts; out.plate=Object.assign(wState(),{title:($('#w-title')||{}).value}); out.curve={model:$('#s-model').value,unit:$('#s-unit').value,blank:$('#s-blank').checked,logx:$('#s-logx').checked}; return out; }
function tblRestore(){ let d=null; try{ d=JSON.parse(localStorage.getItem(TBLKEY)||'null'); }catch(e){} if(!d) return;
  Object.entries(TBLDEF).forEach(([id,def])=>{ const rows=d[id]; if(!Array.isArray(rows)||!rows.length) return; const vals=rows.map(r=>r.map((v,i)=>def.num.includes(i)?(v===''?NaN:num(v)):v)); /* een tabel die Vue rendert geeft een set() mee: innerHTML zou Vue overschrijven */ if(def.set) def.set(vals); else $('#'+id+' tbody').innerHTML=vals.map(def.row).join(''); });
  if(d.curve&&window.__curveVm) window.__curveVm.setOpts(d.curve);
  if(d.reeks&&typeof d.reeks==='object'){ reeksCounts=d.reeks; buildReeks(); }
  /* oudere sessies bewaarden de tekst per putje apart onder pstore 'wt' en kenden geen
     vals of seed; die vorm wordt hier omgezet naar de toestand van de plaatontwerper */
  if(d.plate&&d.plate.wells&&wPld){ const oldTxt=pstore.get().wt;
    wPld.set({fmt:d.plate.fmt,wells:d.plate.wells,vals:d.plate.vals||oldTxt||{},seed:d.plate.seed,
      groups:d.plate.groups&&d.plate.groups.length?d.plate.groups:null});
    if(d.plate.title!=null){ const el=$('#w-title'); if(el){ el.value=d.plate.title; el.dispatchEvent(new Event('input',{bubbles:true})); } } } }
let lastTbl='', tblDirty=false; ['input','change','click'].forEach(ev=>document.addEventListener(ev,()=>{ tblDirty=true; },true));
setInterval(()=>{ try{ const t=JSON.stringify(tblSnap()); if(t!==lastTbl){ if(tblDirty) localStorage.setItem(TBLKEY,t); lastTbl=t; } }catch(e){} },1500);
$('#reset-store').addEventListener('click',()=>{ try{ localStorage.removeItem(TBLKEY); }catch(e){} },true);


/* ================= STATISTIEK ================= */
function gammaln(x){ const c=[76.18009172947146,-86.50532032941677,24.01409824083091,-1.231739572450155,0.1208650973866179e-2,-0.5395239384953e-5]; let y=x, t=x+5.5; t-=(x+0.5)*Math.log(t); let s=1.000000000190015; for(let j=0;j<6;j++) s+=c[j]/++y; return -t+Math.log(2.5066282746310005*s/x); }
function betacf(a,b,x){ const MAXIT=300, EPS=3e-16, FPMIN=1e-300; let qab=a+b, qap=a+1, qam=a-1, c=1, d=1-qab*x/qap; if(Math.abs(d)<FPMIN) d=FPMIN; d=1/d; let h=d;
  for(let m=1;m<=MAXIT;m++){ const m2=2*m; let aa=m*(b-m)*x/((qam+m2)*(a+m2)); d=1+aa*d; if(Math.abs(d)<FPMIN) d=FPMIN; c=1+aa/c; if(Math.abs(c)<FPMIN) c=FPMIN; d=1/d; h*=d*c; aa=-(a+m)*(qab+m)*x/((a+m2)*(qap+m2)); d=1+aa*d; if(Math.abs(d)<FPMIN) d=FPMIN; c=1+aa/c; if(Math.abs(c)<FPMIN) c=FPMIN; d=1/d; const del=d*c; h*=del; if(Math.abs(del-1)<EPS) break; } return h; }
function ibeta(x,a,b){ if(x<=0) return 0; if(x>=1) return 1; const bt=Math.exp(gammaln(a+b)-gammaln(a)-gammaln(b)+a*Math.log(x)+b*Math.log(1-x)); return x<(a+1)/(a+b+2)?bt*betacf(a,b,x)/a:1-bt*betacf(b,a,1-x)/b; }
function gammp(a,x){ if(x<=0) return 0; if(x<a+1){ let ap=a, sum=1/a, del=sum; for(let n=0;n<500;n++){ ap++; del*=x/ap; sum+=del; if(Math.abs(del)<Math.abs(sum)*3e-16) break; } return sum*Math.exp(-x+a*Math.log(x)-gammaln(a)); }
  let b=x+1-a, c=1e300, d=1/b, h=d; for(let i=1;i<500;i++){ const an=-i*(i-a); b+=2; d=an*d+b; if(Math.abs(d)<1e-300) d=1e-300; c=b+an/c; if(Math.abs(c)<1e-300) c=1e-300; d=1/d; const del=d*c; h*=del; if(Math.abs(del-1)<3e-16) break; } return 1-Math.exp(-x+a*Math.log(x)-gammaln(a))*h; }
const tcdf=(t,df)=>{ const p=0.5*ibeta(df/(df+t*t),df/2,0.5); return t>0?1-p:p; };
const fcdf=(f,a,b)=>f<=0?0:ibeta(a*f/(a*f+b),a/2,b/2);
const chicdf=(x,k)=>x<=0?0:gammp(k/2,x/2);
const ncdf=z=>z<0?0.5*(1-gammp(0.5,z*z/2)):0.5*(1+gammp(0.5,z*z/2));
function invcdf(F,p,lo,hi){ for(let i=0;i<300;i++){ const m=(lo+hi)/2; if(F(m)<p) lo=m; else hi=m; if(hi-lo<1e-12*Math.max(1,Math.abs(m))) break; } return (lo+hi)/2; }
const tinv=(p,df)=>invcdf(t=>tcdf(t,df),p,-1e6,1e6);
const finv=(p,a,b)=>invcdf(f=>fcdf(f,a,b),p,0,1e6);
const chiinv=(p,k)=>invcdf(x=>chicdf(x,k),p,0,1e5);
/* Tabellenboek Statistiek (Avans) */
const ST_DIXON={3:[0.941,0.970,0.994],4:[0.765,0.829,0.926],5:[0.642,0.710,0.821],6:[0.560,0.625,0.740],7:[0.507,0.568,0.680],8:[0.468,0.526,0.634],9:[0.437,0.493,0.598],10:[0.412,0.466,0.568],11:[NaN,0.444,0.542],12:[NaN,0.426,0.522],13:[NaN,0.410,0.503],14:[NaN,0.396,0.488],15:[NaN,0.384,0.475],16:[NaN,0.374,0.463],17:[NaN,0.365,0.452]};
const ST_LILL={3:0.376,4:0.375,5:0.343,6:0.323,7:0.304,8:0.288,9:0.274,10:0.262,11:0.251,12:0.242,13:0.234,14:0.226,15:0.219,16:0.213,17:0.207,18:0.202,19:0.197,20:0.192};
const ST_GRUBBS={3:1.155,4:1.481,5:1.715,6:1.887,7:2.020,8:2.126,9:2.215,10:2.290};
function stNums(txt){ return String(txt).replace(/[−–]/g,'-').replace(/,\s+/g,' ').split(/[\s;\t]+/).filter(Boolean).flatMap(t=>(t.match(/,/g)||[]).length>1?t.split(','):[t]).map(t=>num(t)).filter(x=>isFinite(x)); }
function grubbsCrit(n,alpha){ if(alpha===0.05&&ST_GRUBBS[n]) return {v:ST_GRUBBS[n],tab:true}; const t=tinv(1-alpha/(2*n),n-2); return {v:(n-1)/Math.sqrt(n)*Math.sqrt(t*t/(n-2+t*t)),tab:false}; }
function lillieD(x){ const n=x.length, m=mean(x), s=sd(x); if(!(s>0)) return NaN; const z=[...x].sort((a,b)=>a-b).map(v=>ncdf((v-m)/s)); let D=0; z.forEach((F,i)=>{ D=Math.max(D,(i+1)/n-F,F-i/n); }); return D; }
function stDesc(x,alpha){
  const n=x.length, s=[...x].sort((a,b)=>a-b), m=mean(x), sdv=sd(x), sem=sdv/Math.sqrt(n), med=n%2?s[(n-1)/2]:(s[n/2-1]+s[n/2])/2;
  const tq=n>1?tinv(1-alpha/2,n-1):NaN;
  const o={n,m,sd:sdv,sem,med,min:s[0],max:s[n-1],cv:sdv/Math.abs(m)*100,ci:[m-tq*sem,m+tq*sem],tq};
  if(n>=3&&sdv>0){ const dmax=s[n-1]-m, dmin=m-s[0]; o.gr={G:Math.max(dmax,dmin)/sdv,val:dmax>=dmin?s[n-1]:s[0],crit:grubbsCrit(n,alpha)}; }
  if(n>=3&&n<=17&&s[n-1]>s[0]){ const ai=alpha===0.10?0:alpha===0.05?1:2, qc=ST_DIXON[n][ai]; const qlo=(s[1]-s[0])/(s[n-1]-s[0]), qhi=(s[n-1]-s[n-2])/(s[n-1]-s[0]); o.dx={Q:Math.max(qlo,qhi),val:qhi>=qlo?s[n-1]:s[0],crit:qc}; }
  if(n>=3){ o.lD=lillieD(x); o.lC=n<=20?ST_LILL[n]:0.886/Math.sqrt(n); }
  return o;
}
function wilcoxDist(n){ const max=n*(n+1)/2; let f=new Float64Array(max+1); f[0]=1; for(let k=1;k<=n;k++){ for(let s=max;s>=k;s--) f[s]+=f[s-k]; } const tot=2**n; const cdf=new Float64Array(max+1); let c=0; for(let s=0;s<=max;s++){ c+=f[s]; cdf[s]=c/tot; } return cdf; }
function wilcoxCrit(n,a){ if(n<1) return NaN; const cdf=wilcoxDist(n); let c=-1; for(let s=0;s<cdf.length;s++){ if(cdf[s]<=a+1e-12) c=s; else break; } return c; }
function rankAbs(d){ const idx=d.map((v,i)=>[Math.abs(v),i]).sort((a,b)=>a[0]-b[0]); const r=new Array(d.length); let ties=0, tcorr=0; for(let i=0;i<idx.length;){ let j=i; while(j+1<idx.length&&idx[j+1][0]===idx[i][0]) j++; const rk=(i+j)/2+1; for(let k=i;k<=j;k++) r[idx[k][1]]=rk; const t=j-i+1; if(t>1){ ties++; tcorr+=t*t*t-t; } i=j+1; } return {r,ties,tcorr}; }
const pfmt=p=>!isFinite(p)?'–':p<0.0001?'&lt; 0,0001':sig(p,3);
/* De velden, de tabel per groep en de uitkomst van alle elf toetsen staan in
   src/tools/Stat.vue (S248 en S249). Het rekenwerk hierboven en hieronder blijft onveranderd,
   want daar hangen de validatiegevallen aan.

   calc.stat() blijft bestaan omdat de rest van de app het aanroept na het delen van een link,
   ongedaan maken en bij het openen; de component rekent zelf opnieuw en tekent opnieuw. */

/* ================= ANOVA + TUKEY ================= */
function erfcF(x){ const z=Math.abs(x), t=1/(1+0.5*z); const r=t*Math.exp(-z*z-1.26551223+t*(1.00002368+t*(0.37409196+t*(0.09678418+t*(-0.18628806+t*(0.27886807+t*(-1.13520398+t*(1.48851587+t*(-0.82215223+t*0.17087277))))))))); return x>=0?r:2-r; }
const PhiF=z=>0.5*erfcF(-z/Math.SQRT2);
function prange(w,k){ if(w<=0) return 0; const a=-8, b=8, N=240, h=(b-a)/N; let s=0; for(let i=0;i<=N;i++){ const z=a+i*h, f=Math.exp(-z*z/2)/Math.sqrt(2*Math.PI)*Math.pow(Math.max(0,PhiF(z)-PhiF(z-w)),k-1); s+=f*(i===0||i===N?1:i%2?4:2); } return Math.min(1,k*s*h/3); }
function ptukey(q,k,df){ if(q<=0) return 0; if(df>5000) return prange(q,k); const lg=Math.log(df)*df/2-gammaln(df/2)-(df/2-1)*Math.log(2); const hi=1+14/Math.sqrt(df)+ (df<4?6:0), N=200, h=hi/N; let s=0;
  for(let i=0;i<=N;i++){ const x=i*h; if(x<=0) continue; const g=Math.exp(lg+(df-1)*Math.log(x)-df*x*x/2); s+=g*prange(q*x,k)*(i===N?1:i%2?4:2); } return Math.min(1,s*h/3); }
const qtCache=new Map();
function qtukey(p,k,df){ const key=p+'|'+k+'|'+df; if(qtCache.has(key)) return qtCache.get(key); let lo=0, hi=50; for(let i=0;i<40&&hi-lo>1e-7;i++){ const m=(lo+hi)/2; if(ptukey(m,k,df)<p) lo=m; else hi=m; } const v=(lo+hi)/2; if(qtCache.size>200) qtCache.clear(); qtCache.set(key,v); return v; }
function stGroups(txt){ return String(txt).split(/\n/).map((l,i)=>{ const m=l.match(/^\s*([^:\t]+?)\s*[:\t]\s*(.*)$/); const name=m&&!/^[-\d.,\s]+$/.test(m[1])?m[1]:`Groep ${i+1}`; const v=stNums(m&&!/^[-\d.,\s]+$/.test(m[1])?m[2]:l); return {name,v}; }).filter(g=>g.v.length); }
function anovaCalc(G,alpha){ const k=G.length, N=G.reduce((a,g)=>a+g.v.length,0), gm=G.reduce((a,g)=>a+g.v.reduce((s,x)=>s+x,0),0)/N;
  const ms=G.map(g=>mean(g.v)); const SSB=G.reduce((a,g,i)=>a+g.v.length*(ms[i]-gm)**2,0), SSW=G.reduce((a,g,i)=>a+g.v.reduce((s,x)=>s+(x-ms[i])**2,0),0);
  const dfB=k-1, dfW=N-k, MSB=SSB/dfB, MSW=SSW/dfW, F=MSB/MSW, p=1-fcdf(F,dfB,dfW);
  const qc=qtukey(1-alpha,k,dfW), pairs=[];
  for(let i=0;i<k;i++) for(let j=i+1;j<k;j++){ const d=ms[j]-ms[i], se=Math.sqrt(MSW/2*(1/G[i].v.length+1/G[j].v.length)), q=Math.abs(d)/se; pairs.push({a:G[j].name,b:G[i].name,d,lo:d-qc*se,hi:d+qc*se,q,p:Math.max(0,1-ptukey(q,k,dfW))}); }
  return {k,N,SSB,SSW,dfB,dfW,MSB,MSW,F,p,Fc:finv(1-alpha,dfB,dfW),qc,pairs,ms,eta:SSB/(SSB+SSW)}; }

/* ================= PROTOCOLLEN: GEDEELD ================= */
const PKEY='labkit:v1:proto';
const pstore={get(){ try{ return JSON.parse(localStorage.getItem(PKEY)||'{}'); }catch(e){ return {}; } },set(k,v){ try{ const s=this.get(); s[k]=v; localStorage.setItem(PKEY,JSON.stringify(s)); }catch(e){} }};
$('#reset-store').addEventListener('click',()=>{ try{ localStorage.removeItem(PKEY); }catch(e){} },true);
const PFONT=()=>getComputedStyle(document.documentElement).getPropertyValue('--font-ui');
const PCOL={ink:'#1f2933',muted:'#5f6b7a',line:'#c9ced6',soft:'#eef0f3',acc:'#1558b0',accSoft:'#e8f0fb',liquid:'#1558b0',warn:'#c2410c'};
/* teken met vaste logische maat; s = schaalfactor (scherm: devicePixelRatio, export: 3) */
function pRender(cv,W,H,draw,s){ s=s||window.devicePixelRatio||1; cv.width=Math.round(W*s); cv.height=Math.round(H*s); const x=cv.getContext('2d'); x.setTransform(s,0,0,s,0,0); x.fillStyle='#fff'; x.fillRect(0,0,W,H); x.textBaseline='middle'; x.lineJoin='round'; x.lineCap='round'; draw(x,W,H); return x; }
function pShow(cv,W,H,draw){ pRender(cv,W,H,draw); cv.style.width='100%'; cv.style.maxWidth=W+'px'; cv._p={W,H,draw}; }
const PNGNAME={stb:'st-test',pv:'pv-title',pp:'pp-title',pg:'pg-title',w:'w-title',bs:'o-btitle',gp:'gp-title',pl:'pl-name',gpp:'gp-title',stn:'stn-title',xp:'xp-title'};
document.addEventListener('click',e=>{ const b=e.target.closest('[data-png]'); if(!b) return; const k=b.dataset.png, cv=$('#'+k+'-cv'); if(!cv||!cv._p) return; const c=document.createElement('canvas'); pRender(c,cv._p.W,cv._p.H,cv._p.draw,3); c.toBlob(bl=>{ if(bl) saveBlob(safeName($('#'+PNGNAME[k]).value||'schema')+'.png',bl).catch(()=>{}); },'image/png'); });
function pTitle(x,t,W){ if(!t) return 0; if(window.__noTitle) return 40; x.fillStyle=PCOL.ink; x.font='600 16px '+PFONT(); x.textAlign='left'; x.fillText(t,20,22); return 40; }
function pNotes(pref,W){ const el=$('#'+pref+'-note'); const t=el?el.value:''; const maxc=Math.max(30,Math.floor((W-40)/6.6)); const out=[]; t.split('\n').forEach(par=>{ if(!par.trim()){ if(out.length) out.push(''); return; } let ln=''; par.split(/\s+/).forEach(w=>{ if((ln+' '+w).trim().length>maxc&&ln){ out.push(ln); ln=w; } else ln=(ln+' '+w).trim(); }); if(ln) out.push(ln); }); while(out.length&&out[out.length-1]==='') out.pop(); return out; }
const pAuto=pref=>{ const el=$('#'+pref+'-auto'); return !el||el.checked; };
function pDrawNotes(x,lines,y){ x.textAlign='left'; x.fillStyle=PCOL.ink; x.font='12.5px '+PFONT(); lines.forEach((l,i)=>x.fillText(l,20,y+i*17)); }
function pArrow(x,x0,y0,x1,y1,col){ x.strokeStyle=col; x.fillStyle=col; x.lineWidth=1.6; x.beginPath(); x.moveTo(x0,y0); x.quadraticCurveTo((x0+x1)/2,y0-28,x1,y1); x.stroke(); const a=Math.atan2(y1-(y0-14),x1-(x0+x1)/2); x.beginPath(); x.moveTo(x1,y1); x.lineTo(x1-8*Math.cos(a-0.4),y1-8*Math.sin(a-0.4)); x.lineTo(x1-8*Math.cos(a+0.4),y1-8*Math.sin(a+0.4)); x.closePath(); x.fill(); }
function pTube(x,cx,top,h,w,fill,alpha,col){ const bw=w/2; x.lineWidth=1.6; x.strokeStyle=PCOL.ink;
  const body=()=>{ x.beginPath(); x.moveTo(cx-bw,top); x.lineTo(cx-bw,top+h*0.62); x.lineTo(cx,top+h); x.lineTo(cx+bw,top+h*0.62); x.lineTo(cx+bw,top); };
  if(fill>0){ x.save(); body(); x.closePath(); x.clip(); x.fillStyle=`rgba(${hexRgb(col||PCOL.liquid).join(',')},${alpha})`; x.fillRect(cx-bw-2,top+h*(1-fill),w+4,h*fill+2); x.restore(); }
  body(); x.stroke(); x.fillStyle=PCOL.soft; x.strokeStyle=PCOL.ink; x.beginPath(); x.rect(cx-bw-4,top-7,w+8,7); x.fill(); x.stroke(); }
const supNum=n=>String(n).replace(/-/g,'⁻').replace(/\d/g,d=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
function pNum(v){ if(!isFinite(v)) return '–'; if(v===0) return '0'; const e=Math.floor(Math.log10(Math.abs(v))); if(e>=-2&&e<4) return sig(v,3); const m=v/10**e; const ms=NL(Number(m.toFixed(2)),2); return (ms==='1'?'':ms+' × ')+'10'+supNum(e); }

/* ================= PIPETTEERSCHEMA ================= */
const PPRE={
  leeg:{t:'Pipetteerschema',tot:'20',u:'µL',mm:'1',cols:['Buis 1','Buis 2','Buis 3'],rows:[['Water','fill','','',[]],['','vol','','',[]]]},
  pcr:{t:'Pipetteerschema PCR (25 µL per reactie)',tot:'25',u:'µL',mm:'1',cols:['Monster 1','Monster 2','Monster 3','NTC'],rows:[['Water','fill','','',[]],['10× PCR-buffer','conc','10','X','1'],['dNTPs','conc','10','mM','0,2'],['Primer F','conc','10','µM','0,4'],['Primer R','conc','10','µM','0,4'],['Taq (5 U/µL)','vol','','','0,125'],['Template','vol','','',['1','1','1','0'],0]]},
  qpcr:{t:'qPCR met SYBR Green (20 µL per reactie)',tot:'20',u:'µL',mm:'1',cols:['Monster 1','Monster 2','Monster 3','NTC'],rows:[['Water','fill','','',[]],['2× SYBR Green-mastermix','conc','2','X','1'],['Primer F','conc','10','µM','0,4'],['Primer R','conc','10','µM','0,4'],['cDNA','vol','','',['2','2','2','0'],0]]},
  digest:{t:'Restrictiedigest (50 µL, 1 µg DNA)',tot:'50',u:'µL',mm:'1',cols:['EcoRI','HindIII','EcoRI + HindIII','Ongeknipt'],rows:[['Water','fill','','',[]],['10× rCutSmart-buffer','conc','10','X','1'],['Plasmide-DNA (100 ng/µL)','vol','','','10'],['EcoRI-HF (20 U/µL)','vol','','',['1','0','1','0'],0],['HindIII-HF (20 U/µL)','vol','','',['0','1','1','0'],0]]},
  ligatie:{t:'Ligatie met T4 DNA-ligase (20 µL)',tot:'20',u:'µL',mm:'1',cols:['Vector + insert 1:3','Vector + insert 1:1','Alleen vector'],rows:[['Water','fill','','',[]],['10× T4-ligasebuffer','conc','10','X','1'],['Vector (50 ng/µL)','vol','','','1'],['Insert (25 ng/µL)','vol','','',['1,5','0,5','0'],0],['T4 DNA-ligase','vol','','','1']]},
  bca:{t:'BSA-standaardreeks (BCA, 20–2000 µg/mL)',tot:'100',u:'µL',mm:'0',cols:['A','B','C','D','E','F','G','H','I'],rows:[['Verdunningsmiddel','fill','','',[]],['BSA-stock','conc','2000','µg/mL',['2000','1500','1000','750','500','250','125','25','0']]]},
  medium:{t:'Kweekmedium met supplementen (50 mL)',tot:'50',u:'mL',mm:'0',cols:['Buis 50 mL'],rows:[['DMEM','fill','','',[]],['FBS','conc','100','%','10'],['Penicilline-streptomycine (100×)','conc','100','X','1'],['L-glutamine','conc','200','mM','2']]}
};
const ppWater=n=>/^(water|milli-?q|h2o|h₂o|aqua|nuclease[- ]?vrij water|demi)/i.test(String(n).trim());
function ppFromPreset(k){ const P=PPRE[k]||PPRE.leeg, nc=P.cols.length; return {cols:P.cols.map(n=>({n})),rows:P.rows.map(r=>({n:r[0],mode:r[1],st:r[2],cu:r[3],mm:r[5]!==0,v:Array.isArray(r[4])?(r[4].length?r[4].slice():Array(nc).fill('')):Array(nc).fill(r[4])}))}; }
function ppMigrate(S){ if(!S||!Array.isArray(S.rows)||!Array.isArray(S.cols)) return null; if(S.rows.every(r=>r&&!Array.isArray(r)&&Array.isArray(r.v))) return S;
  const nc=S.cols.length; return {cols:S.cols.map(c=>({n:c.n})),rows:S.rows.map((r,i)=>({n:r[0]||'',mode:ppWater(r[0])?'fill':'vol',st:'',cu:'',mm:i!==S.tmplRow,v:Array.from({length:nc},(_,j)=>r[j+1]??'')}))}; }
const ppEnzyme=n=>/(polymerase|taq|ligase|enzym|-hf\b|\bU\/µL|\bri\b|EcoRI|HindIII|BamHI|NotI|XhoI|PstI)/i.test(String(n));
/* ---------- buizenrek bij het pipetteerschema: elke kolom is een buis ---------- */
function ppRack(S,V,tot,u,mmOn,mmV){ const cv=$('#ppr-cv'); if(!cv||typeof pRack!=='function') return;
  const RMAX=24, cols=S.cols.slice(0,RMAX);
  const tubes=cols.map((c,j)=>{ const sum=V.reduce((a,r)=>a+(isFinite(r[j])?r[j]:0),0);
    return {n:c.n||'buis',v:NaN,c:PCOL.acc,f:0.5,sub:isFinite(sum)&&sum>0?`${NL(Number(sum.toPrecision(4)),9)} ${u}`:''}; });
  if(mmOn&&isFinite(mmV)&&mmV>0) tubes.unshift({n:'Mastermix',v:NaN,c:'#5f6b7a',f:0.8,sub:`${NL(Number(mmV.toPrecision(4)),9)} ${u}`});
  if(!tubes.length){ cv.style.display='none'; return; }
  cv.style.display='';
  const cut=S.cols.length>RMAX, per=Math.min(8,tubes.length), rows=Math.ceil(tubes.length/per);
  const W=Math.max(520,per*104+40), H=pRackH(rows)+(cut?22:0);
  pShow(cv,W,H,(x)=>{ pRack(x,20,20,W-40,tubes,{per});
    if(cut){ x.fillStyle=PCOL.muted; x.font='11.5px '+PFONT(); x.textAlign='left'; x.textBaseline='alphabetic';
      x.fillText(`Alleen de eerste ${RMAX} buizen zijn getekend.`,20,H-8); } });
}
/* ================= PCR-PROGRAMMA ================= */
const PGDEF=[['Initiële denaturatie','95','2:00',false],['Denaturatie','95','0:30',true],['Annealing','54','0:30',true],['Extensie','72','1:00',true],['Eindextensie','72','5:00',false],['Bewaren','10','∞',false]];
function pgSecs(t){ t=String(t).trim(); if(/^(∞|inf|oneindig|hold)$/i.test(t)) return Infinity; const m=t.match(/^(\d+):(\d{1,2})$/); if(m) return +m[1]*60+ +m[2]; const n=num(t.replace(/\s*(s|sec)$/i,'')); if(/min/i.test(t)) return num(t)*60; return n; }
function pgFmt(s,mode){ if(s===Infinity) return '∞'; if(!isFinite(s)) return '?'; if(mode==='txt') return s>=60?(s%60?`${Math.floor(s/60)} min ${s%60} s`:`${s/60} min`):`${s} s`; return `${Math.floor(s/60)}:${String(Math.round(s%60)).padStart(2,'0')}`; }


function kwCalc(G,alpha){ const all=[]; G.forEach((g,gi)=>g.v.forEach(v=>all.push({v,gi}))); const N=all.length, k=G.length; all.sort((a,b)=>a.v-b.v);
  const rk=new Array(N); let tsum=0, ties=0; for(let i=0;i<N;){ let j=i; while(j+1<N&&all[j+1].v===all[i].v) j++; const r=(i+j)/2+1; for(let q=i;q<=j;q++) rk[q]=r; const t=j-i+1; if(t>1){ ties++; tsum+=t*t*t-t; } i=j+1; }
  const R=new Array(k).fill(0), n=G.map(g=>g.v.length); all.forEach((o,i)=>R[o.gi]+=rk[i]);
  const C=1-tsum/(N*N*N-N), H0=12/(N*(N+1))*R.reduce((a,r,i)=>a+r*r/n[i],0)-3*(N+1), H=H0/C, p=1-chicdf(H,k-1), mr=R.map((r,i)=>r/n[i]);
  const s2=N*(N+1)/12-tsum/(12*(N-1)), m=k*(k-1)/2, pairs=[];
  for(let i=0;i<k;i++) for(let j=i+1;j<k;j++){ const d=mr[j]-mr[i], z=d/Math.sqrt(s2*(1/n[i]+1/n[j])), pp=2*(1-ncdf(Math.abs(z))); pairs.push({a:G[j].name,b:G[i].name,d,z,p:pp,padj:Math.min(1,pp*m)}); }
  return {N,k,H,p,Hc:chiinv(1-alpha,k-1),mr,C,ties,pairs}; }

/* ================= STANDAARDCURVE: PLAATLEZER-IMPORT ================= */
function parsePlate(txt){ const P={}; let started=false, done=false;
  String(txt).replace(/\r/g,'').split('\n').forEach(line=>{ if(done) return; const cells=line.includes('\t')?line.split('\t'):line.includes(';')?line.split(';'):line.split(','); const c=cells.map(x=>x.trim().replace(/^"|"$/g,''));
    const i=c.findIndex(x=>x!==''); if(i<0) return; const m=c[i].match(/^([A-Pa-p])$/); if(!m){ if(started&&Object.keys(P).length>=8) done=true; return; }
    const r=m[1].toUpperCase(); if(P[r]){ done=true; return; } started=true; const vals=c.slice(i+1).map(v=>v===''?NaN:num(v.replace(/\*/g,''))); P[r]=vals; });
  return P; }
function colList(t){ const out=[]; String(t).split(/[,;\s]+/).filter(Boolean).forEach(p=>{ const m=p.match(/^(\d+)\s*-\s*(\d+)$/); if(m){ for(let k=+m[1];k<=+m[2];k++) out.push(k); } else if(/^\d+$/.test(p)) out.push(+p); }); return out; }
/* plateImport() staat nu als methode in src/tools/Curve.vue; parsePlate() en colList() blijven hier */

/* ================= DESKTOP (TAURI) ================= */
if(window.__TAURI__&&window.__TAURI__.opener){ document.addEventListener('click',e=>{ const a=e.target.closest('a[href^="http"]'); if(!a) return; e.preventDefault(); window.__TAURI__.opener.openUrl(a.href).catch(()=>{}); }); }

/* De plaatindeling staat nu in één blok onderaan, na de gedeelde plaatontwerper. */

/* ================= OPLOSSING: STAPPENSCHEMA ALS AFBEELDING ================= */
function bufImg(){ const cv=$('#bs-cv'); if(!cv) return; const title=$('#o-btitle').value.trim(), items=$$('#o-tbl tbody tr').map(tr=>({n:tr.querySelector('[data-k=n]').value||'component',out:tr.querySelector('[data-k=out]').textContent})).filter(x=>x.out&&x.out!=='–');
  const ph=(typeof PH!=='undefined'&&PH[recipeKey])||'', vtxt=$('#o-vu').value==='L'?fmt(num($('#o-v').value),3)+' L':fmt(num($('#o-v').value),1)+' mL';
  /* Een regel wordt eerst als hele zin vertaald en pas daarna afgebroken; de stukken worden
     met uv() getekend. Anders wordt elk afgebroken stukje een eigen vertaalsleutel, en dan
     zou een lange pH-stap een handvol onvindbare brokjes in de woordenlijst opleveren. */
  const T1=t=>trCanvas(String(t));
  const steps=[{h:'Afwegen',l:items.map(x=>`${x.out}  ${trPlain(x.n,true)}`)},
    {h:'Oplossen',l:[T1('in ± 80% van het eindvolume'),T1('gedemineraliseerd water')]},
    ...(ph?[{h:'pH instellen',l:[T1(ph)]}]:[]),
    {h:'Aanvullen',l:[T1('tot '+vtxt),T1('maatkolf of maatcilinder, mengen')]}];
  const wrapC=(l,mc)=>{ const out=[]; let ln=''; String(l).split(/\s+/).forEach(w=>{ if((ln+' '+w).trim().length>mc&&ln){ out.push(ln); ln=w; } else ln=(ln+' '+w).trim(); }); if(ln) out.push(ln); return out; }; steps.forEach(st=>{ st.l=st.l.flatMap(l=>wrapC(l,27)); });
  const NL_=pNotes('o',760), bw=190, W=Math.max(560,40+steps.length*(bw+30)), maxl=Math.max(...steps.map(s=>s.l.length)), H=(title?40:0)+70+maxl*18+40+(NL_.length?NL_.length*17+12:0);
  pShow(cv,W,H,(x)=>{ const t0=pTitle(x,title,W), T=t0+14; steps.forEach((st,i)=>{ const X=20+i*(bw+30), bh=50+maxl*18; x.fillStyle=PCOL.accSoft; x.strokeStyle=PCOL.acc; x.lineWidth=1.4; x.beginPath(); x.rect(X,T,bw,bh); x.fill(); x.stroke();
      x.fillStyle=PCOL.acc; x.beginPath(); x.arc(X+18,T+20,11,0,7); x.fill(); x.fillStyle='#fff'; x.font='600 12px '+PFONT(); x.textAlign='center'; x.fillText(String(i+1),X+18,T+20);
      x.fillStyle=PCOL.ink; x.textAlign='left'; x.font='600 13px '+PFONT(); x.fillText(st.h,X+36,T+20); x.font='12px '+PFONT(); st.l.forEach((l,k)=>x.fillText(uv(l),X+12,T+46+k*18));
      if(i<steps.length-1){ pArrow(x,X+bw+4,T+bh/2+14,X+bw+26,T+bh/2,PCOL.acc); } }); if(NL_.length) pDrawNotes(x,NL_,T+50+maxl*18+28); }); }

/* ================= GEDEELD: KOLOMMEN PLAKKEN ================= */
/* parseCols() staat sinds S267 in src/lib/parse.js */
const SERCOL=['#1558b0','#c2410c','#15803d','#7c3aed','#b91c1c','#0e7490','#a16207','#be185d'];

/* ================= ANTIBIOTICA-GEVOELIGHEID =================
   Verhuisd naar src/tools/Mic.vue (MIDATA, micOf, de S/I/R-regels en de tabellen mi-tbl en mz-tbl). */
calc.mic=function(){};

/* ================= GROEICURVES VERGELIJKEN (GOMPERTZ) ================= */
function gompertz(t,p){ const [A,mu,lam]=p; return A*Math.exp(-Math.exp(mu*Math.E/A*(lam-t)+1)); }
function fitGompertz(t,y){ const A0=Math.max(...y)||1; let best=null; const n=t.length;
  for(let i=1;i<n;i++){ const s=(y[i]-y[i-1])/(t[i]-t[i-1]); if(!best||s>best.s) best={s,i}; }
  const mu0=Math.max(best?best.s:0.5,1e-3), lam0=best?Math.max(0,t[best.i]-y[best.i]/mu0):0;
  const r=lmfit((x,p)=>gompertz(x,[p[0],Math.exp(p[1]),p[2]]),[A0,Math.log(mu0),lam0],t,y,600); const p=[r.p[0],Math.exp(r.p[1]),r.p[2]];
  const my=mean(y), ssr=y.reduce((s,v,i)=>s+(v-gompertz(t[i],p))**2,0), sst=y.reduce((s,v)=>s+(v-my)**2,0); return {A:p[0],mu:p[1],lam:p[2],r2:1-ssr/sst}; }
/* De velden en de uitkomst staan in src/tools/Gcomp.vue; calc.gcomp laat de tekening opnieuw maken (zie src/main.js). */
calc.gcomp=function(){};

/* ================= WESTERN BLOT ================= */
/* De voorbeelddata, de tabel en de uitkomst staan in src/tools/Wb.vue; de tekening blijft barChart(). */
calc.wb=function(){};   /* src/main.js zet de echte: de component tekent de grafiek zelf */

/* ================= qPCR SMELTCURVE ================= */
/* De voorbeelddata, de velden en de uitkomst staan in src/tools/Melt.vue; meltPeaks() blijft hier. */
function meltPeaks(T,F,k){ const n=T.length; const s=smooth(Float32Array.from(F),k); const d=new Array(n).fill(NaN); for(let i=1;i<n-1;i++) d[i]=-(s[i+1]-s[i-1])/(T[i+1]-T[i-1]);
  const pk=[]; for(let i=2;i<n-2;i++){ if(d[i]>=d[i-1]&&d[i]>d[i+1]&&d[i]>0){ const a=d[i-1],b=d[i],c=d[i+1], den=a-2*b+c, off=den!==0?0.5*(a-c)/den:0, h=(T[i+1]-T[i-1])/2; pk.push({tm:T[i]+off*h,h:b}); } }
  return {d,pk:pk.sort((p,q)=>q.h-p.h)}; }
calc.melt=function(){};   /* src/main.js zet de echte: de component tekent de curve zelf */

/* ================= STATISTIEK: TWEEWEG-ANOVA, REGRESSIE, POWER, STAAFDIAGRAM ================= */
function nctcdf(t,df,ncp){ const lg=Math.log(df)*df/2-gammaln(df/2)-(df/2-1)*Math.log(2); const hi=1+14/Math.sqrt(df)+(df<4?6:0), N=400, h=hi/N; let s=0;
  for(let i=0;i<=N;i++){ const x=i*h; if(x<=0) continue; const g=Math.exp(lg+(df-1)*Math.log(x)-df*x*x/2); s+=g*PhiF(t*x-ncp)*(i===N?1:i%2?4:2); } return Math.min(1,Math.max(0,s*h/3)); }
function powerT(n,d,alpha,two,type){ const df=type==='2'?2*n-2:n-1, ncp=type==='2'?d*Math.sqrt(n/2):d*Math.sqrt(n), tc=tinv(1-(two?alpha/2:alpha),df); return two?1-nctcdf(tc,df,ncp)+nctcdf(-tc,df,ncp):1-nctcdf(tc,df,ncp); }
function anova2(cells){ const A=[...new Set(cells.map(c=>c.a))], B=[...new Set(cells.map(c=>c.b))], a=A.length, b=B.length; const get=(i,j)=>cells.find(c=>c.a===A[i]&&c.b===B[j]);
  for(let i=0;i<a;i++) for(let j=0;j<b;j++) if(!get(i,j)) return {err:`Combinatie ${A[i]} × ${B[j]} ontbreekt.`};
  const n=cells[0].v.length; if(cells.some(c=>c.v.length!==n)) return {err:'Elke combinatie moet evenveel herhalingen hebben (gebalanceerd ontwerp).'}; if(n<2) return {err:'Minstens 2 herhalingen per combinatie nodig.'};
  const all=cells.flatMap(c=>c.v), G=mean(all), cm=(i,j)=>mean(get(i,j).v), Am=A.map((_,i)=>mean(B.flatMap((_,j)=>get(i,j).v))), Bm=B.map((_,j)=>mean(A.flatMap((_,i)=>get(i,j).v)));
  const SSA=b*n*Am.reduce((s,m)=>s+(m-G)**2,0), SSB=a*n*Bm.reduce((s,m)=>s+(m-G)**2,0); let SSAB=0, SSE=0;
  for(let i=0;i<a;i++) for(let j=0;j<b;j++){ SSAB+=n*(cm(i,j)-Am[i]-Bm[j]+G)**2; get(i,j).v.forEach(x=>SSE+=(x-cm(i,j))**2); }
  const dfA=a-1, dfB=b-1, dfAB=dfA*dfB, dfE=a*b*(n-1), MSE=SSE/dfE; const row=(ss,df)=>({ss,df,ms:ss/df,F:ss/df/MSE,p:1-fcdf(ss/df/MSE,df,dfE)});
  return {A,B,n,a:row(SSA,dfA),b:row(SSB,dfB),ab:row(SSAB,dfAB),e:{ss:SSE,df:dfE,ms:MSE},cm:A.map((_,i)=>B.map((_,j)=>cm(i,j)))}; }
function stBars(cv,G,R,alpha){ const names=G.map(g=>g.name), ms=G.map(g=>mean(g.v)), sds=G.map(g=>g.v.length>1?sd(g.v):0), sig_=R.pairs.filter(q=>q.p<alpha);
  const W=Math.max(420,100+names.length*110), H=320+sig_.length*22; const top0=20+sig_.length*22;
  const ymax=Math.max(...ms.map((m,i)=>m+sds[i]))*1.08, ymin=Math.min(0,...ms.map((m,i)=>m-sds[i]));
  pShow(cv,W,H,(x)=>{ const L=64, B=H-48, T=top0+10, Y=v=>B-(v-ymin)/(ymax-ymin)*(B-T), bw=56, X=i=>L+30+i*((W-L-40)/names.length)+bw/2;
    x.strokeStyle=PCOL.ink; x.lineWidth=1.2; x.beginPath(); x.moveTo(L,T-6); x.lineTo(L,B); x.lineTo(W-14,B); x.stroke();
    const st=niceStep(ymax-ymin,5); x.font='11px '+PFONT(); x.textAlign='right'; x.fillStyle=PCOL.muted; for(let v=Math.ceil(ymin/st)*st;v<=ymax+1e-9;v+=st){ x.fillText(tickLabel(v),L-6,Y(v)); x.strokeStyle=PCOL.soft; x.beginPath(); x.moveTo(L+1,Y(v)); x.lineTo(W-14,Y(v)); x.stroke(); }
    names.forEach((nm,i)=>{ const cx=X(i); x.fillStyle=SERCOL[i%SERCOL.length]+'cc'; x.fillRect(cx-bw/2,Y(ms[i]),bw,Y(ymin<0?0:ymin)-Y(ms[i])); x.strokeStyle=PCOL.ink; x.lineWidth=1.4; x.beginPath(); x.moveTo(cx,Y(ms[i]-sds[i])); x.lineTo(cx,Y(ms[i]+sds[i])); x.moveTo(cx-8,Y(ms[i]+sds[i])); x.lineTo(cx+8,Y(ms[i]+sds[i])); x.moveTo(cx-8,Y(ms[i]-sds[i])); x.lineTo(cx+8,Y(ms[i]-sds[i])); x.stroke();
      x.fillStyle=PCOL.ink; x.font='12px '+PFONT(); x.textAlign='center'; x.fillText(nm,cx,B+16); G[i].v.forEach((v,k)=>{ x.fillStyle='rgba(31,41,51,.55)'; x.beginPath(); x.arc(cx-12+24*((k*0.618)%1),Y(v),2.4,0,7); x.fill(); }); });
    sig_.forEach((q,k)=>{ const i=names.indexOf(q.b), j=names.indexOf(q.a), y=top0-k*22, xa=X(Math.min(i,j)), xb=X(Math.max(i,j)); x.strokeStyle=PCOL.ink; x.lineWidth=1.2; x.beginPath(); x.moveTo(xa,y+6); x.lineTo(xa,y); x.lineTo(xb,y); x.lineTo(xb,y+6); x.stroke(); x.fillStyle=PCOL.ink; x.font='600 13px '+PFONT(); x.textAlign='center'; x.fillText(q.p<0.001?'***':q.p<0.01?'**':'*',(xa+xb)/2,y-7); });
    x.save(); x.translate(16,(T+B)/2); x.rotate(-Math.PI/2); x.textAlign='center'; x.fillStyle=PCOL.muted; x.font='12px '+PFONT(); x.fillText('gemiddelde ± SD',0,0); x.restore(); });
  cv._data={head:['groep','gemiddelde','SD','n'],rows:names.map((n,i)=>[n,ms[i],sds[i],G[i].v.length])}; }
/* ================= SPECTROFOTOMETRIE ================= */
const AAM={A:71.0788,R:156.1875,N:114.1038,D:115.0886,C:103.1388,E:129.1155,Q:128.1307,G:57.0519,H:137.1411,I:113.1594,L:113.1594,K:128.1741,M:131.1926,F:147.1766,P:97.1167,S:87.0782,T:101.1051,W:186.2132,Y:163.1760,V:99.1326};
/* ================= EENHEDEN ================= */
calc.units=function(){}; /* de component src/tools/Units.vue rekent zelf */
/* ================= INOCULUM ================= */
/* De velden en de uitkomst staan in src/tools/Inoc.vue. */
calc.inoc=function(){};
/* ================= KLEUREN: HULPFUNCTIES ================= */
const PALS={std:['#1558b0','#c2410c','#15803d','#7c3aed','#b91c1c','#0e7490','#a16207','#be185d'],okabe:['#0072B2','#D55E00','#009E73','#CC79A7','#E69F00','#56B4E9','#F0E442','#000000'],pastel:['#8fb8e8','#f2a98a','#9fd4a8','#c9b3ec','#f0a3a3','#93d3dc','#e6cf8a','#eeaacd'],fel:['#0057ff','#ff5a00','#00a43b','#9b1dff','#e6002d','#00a9c7','#d99a00','#ff1f8e'],grijs:['#1f2933','#4b5563','#6b7280','#9ca3af','#374151','#111827','#808891','#b6bcc4']};

/* ================= INSTELLINGEN: UITERLIJK ================= */
const UIDEF={'ui-theme':'auto','ui-dens':'ruim','ui-fs':'14','ui-accent':'#1558b0','ui-pal':'std','ui-schema':'#1558b0'};
const darkMQ=window.matchMedia?matchMedia('(prefers-color-scheme: dark)'):null;
function applyUI(){ const R=document.documentElement, sel=$('#ui-theme').value||'auto', th=sel==='auto'?(darkMQ&&darkMQ.matches?'donker':'licht'):sel;
  if(th==='licht') R.removeAttribute('data-theme'); else R.setAttribute('data-theme',th);
  { const dr=$('#ui-darkroom'), on=!!(dr&&dr.checked), b=$('#darkroom-btn'); R.classList.toggle('darkroom',on); if(b) b.setAttribute('aria-pressed',on); }
  if($('#ui-dens').value==='compact') R.setAttribute('data-dens','compact'); else R.removeAttribute('data-dens');
  document.body.style.fontSize=(num($('#ui-fs').value)||14)+'px';
  R.style.removeProperty('--accent'); R.style.removeProperty('--accent-soft');
  if($('#ui-accon').checked){ const a=$('#ui-accent').value, cs=getComputedStyle(R), sf=cs.getPropertyValue('--surface').trim()||'#ffffff'; R.style.setProperty('--accent',a); R.style.setProperty('--accent-soft',mixHex(sf.startsWith('#')?sf:'#ffffff',a,0.14)); }
  const pal=PALS[$('#ui-pal').value]||PALS.std; SERCOL.splice(0,SERCOL.length,...pal);
  const sc=$('#ui-schema').value||'#1558b0'; PCOL.acc=sc; PCOL.liquid=sc; PCOL.accSoft=mixHex('#ffffff',sc,0.1);
  $('#ui-swatches').innerHTML=pal.map(c=>`<span title="${c}" style="width:26px;height:18px;border-radius:3px;background:${c};border:1px solid var(--line)"></span>`).join('');
  const m=document.querySelector('meta[name=theme-color]'); if(m) m.content=getComputedStyle(R).getPropertyValue('--accent').trim();
  try{ if(calc[current]&&current!=='inst') calc[current](); }catch(e){} }
if(darkMQ) darkMQ.addEventListener('change',()=>{ if(($('#ui-theme').value||'auto')==='auto') applyUI(); });
$('#darkroom-btn').addEventListener('click',()=>{ const c=$('#ui-darkroom'); if(!c) return; c.checked=!c.checked; c.dispatchEvent(new Event('change',{bubbles:true})); applyUI(); });
{ const ob=$('#offline-badge'), upd=()=>{ ob.hidden=navigator.onLine!==false; }; addEventListener('online',upd); addEventListener('offline',upd); upd(); }
calc.inst=()=>{};

/* ================= UPDATES ================= */
const REPO='svgbml/labkit_public', UPDKEY='labkit:v1:upd';
const cmpVer=(a,b)=>{ const A=String(a).split('.').map(Number), B=String(b).split('.').map(Number); for(let i=0;i<3;i++){ const d=(A[i]||0)-(B[i]||0); if(d) return d>0?1:-1; } return 0; };
function openExt(u){ try{ if(window.__TAURI__&&window.__TAURI__.opener){ window.__TAURI__.opener.openUrl(u).catch(()=>window.open(u,'_blank','noopener')); return; } }catch(e){} window.open(u,'_blank','noopener'); }
function updBanner(rel){ const ver=rel.tag_name.replace(/^v/,''), bar=$('#upd-bar'), desk=!!window.__TAURI__, asset=(rel.assets||[]).find(a=>/setup\.exe$/i.test(a.name));
  bar.innerHTML=`<b>Versie ${esc(ver)} is beschikbaar</b><span>je gebruikt ${APPVER}</span>`+(desk?(asset?`<button type="button" class="primary" data-upd="dl">Installer downloaden</button>`:''):`<button type="button" class="primary" data-upd="reload">Nu vernieuwen</button>`)+`<button type="button" data-upd="notes">Wat is er nieuw</button><button type="button" class="ghost" data-upd="later">Later</button>`;
  bar.style.display='flex'; bar.onclick=e=>{ const k=e.target.dataset&&e.target.dataset.upd; if(!k) return;
    if(k==='dl'){ openExt(asset.browser_download_url); $('#upd-status').innerHTML=note('info','De installer wordt gedownload in je browser. Sluit Labkit, voer het bestand uit en start Labkit opnieuw; je invoer blijft bewaard.'); }
    else if(k==='reload'){ const go=()=>location.reload(); try{ navigator.serviceWorker.getRegistration().then(r=>r?r.update():null).then(()=>caches.keys()).then(ks=>Promise.all(ks.map(k=>caches.delete(k)))).then(go,go); }catch(err){ go(); } }
    else if(k==='notes') openExt(rel.html_url);
    else { bar.style.display='none'; try{ const s=JSON.parse(localStorage.getItem(UPDKEY)||'{}'); s.skip=ver; localStorage.setItem(UPDKEY,JSON.stringify(s)); }catch(err){} } }; }
async function checkUpdate(manual){ const st=$('#upd-status'); let S={}; try{ S=JSON.parse(localStorage.getItem(UPDKEY)||'{}'); }catch(e){}
  if(!STANDALONE){ if(manual) st.innerHTML=note('info','In deze voorvertoning is de updatecontrole uitgeschakeld; gebruik de web-app of het Windows-programma.'); return; }
  if(!manual&&S.t&&Date.now()-S.t<6*3600*1000&&!S.pending) return;
  if(manual) st.innerHTML=note('info','Bezig met controleren…');
  try{ const r=await fetch(`https://api.github.com/repos/${REPO}/releases/latest`,{headers:{Accept:'application/vnd.github+json'},cache:'no-store'}); if(!r.ok) throw new Error('HTTP '+r.status); const rel=await r.json(), ver=String(rel.tag_name||'').replace(/^v/,'');
    const newer=cmpVer(ver,APPVER)>0; S.t=Date.now(); S.pending=newer; try{ localStorage.setItem(UPDKEY,JSON.stringify(S)); }catch(e){}
    if(newer){ if(manual||S.skip!==ver) updBanner(rel); if(manual) st.innerHTML=note('warn',`Versie ${esc(ver)} is beschikbaar (uitgebracht op ${new Date(rel.published_at).toLocaleDateString('nl-NL')}). Zie de melding bovenaan.`); }
    else if(manual) st.innerHTML=note('info',`Je hebt de nieuwste versie (${APPVER}).`); }
  catch(e){ if(manual) st.innerHTML=note('bad','Controleren lukte niet. Ben je offline, of is de limiet van GitHub bereikt? Probeer het later opnieuw.'); } }
$('#appver').textContent='Versie '+APPVER; /* #upd-cur zet src/tools/Settings.vue */

/* ================= MOLMASSA ================= */
const ATOM={H:1.008,He:4.0026,Li:6.94,B:10.81,C:12.011,N:14.007,O:15.999,F:18.998,Na:22.990,Mg:24.305,Al:26.982,Si:28.085,P:30.974,S:32.06,Cl:35.45,K:39.098,Ca:40.078,Cr:51.996,Mn:54.938,Fe:55.845,Co:58.933,Ni:58.693,Cu:63.546,Zn:65.38,As:74.922,Se:78.971,Br:79.904,Rb:85.468,Sr:87.62,Mo:95.95,Ag:107.868,Cd:112.414,Sn:118.71,I:126.904,Cs:132.905,Ba:137.327,W:183.84,Pt:195.084,Au:196.967,Hg:200.592,Pb:207.2};
function parseFormula(txt){ const sub='₀₁₂₃₄₅₆₇₈₉'; let s=String(txt).replace(/[₀-₉]/g,c=>sub.indexOf(c)).replace(/\s+/g,''); if(!s) return {err:'Vul een formule in.'};
  const tot={}; const add=(o,k)=>Object.entries(o).forEach(([e,n])=>tot[e]=(tot[e]||0)+n*k);
  for(const part of s.split(/[·.*•]/)){ if(!part) continue; const m=part.match(/^(\d+)?(.*)$/); const mult=m[1]?+m[1]:1, body=m[2]; let i=0;
    const grp=()=>{ const o={}; while(i<body.length&&body[i]!==')'){ if(body[i]==='('||body[i]==='['){ i++; const inner=grp(); if(body[i]!==')'&&body[i]!==']') throw new Error('Haakje niet gesloten.'); i++; let n=''; while(/\d/.test(body[i]||'')) n+=body[i++]; Object.entries(inner).forEach(([e,c])=>o[e]=(o[e]||0)+c*(n?+n:1)); }
        else if(body[i]===']') break; else { const em=body.slice(i).match(/^[A-Z][a-z]?/); if(!em) throw new Error(`Onbekend teken "${body[i]}".`); const el=em[0]; if(!ATOM[el]) throw new Error(`Element "${el}" is onbekend.`); i+=el.length; let n=''; while(/\d/.test(body[i]||'')) n+=body[i++]; o[el]=(o[el]||0)+(n?+n:1); } } return o; };
    try{ const o=grp(); if(i<body.length) throw new Error('Haakje te veel.'); add(o,mult); }catch(e){ return {err:e.message}; } }
  const M=Object.entries(tot).reduce((a,[e,n])=>a+ATOM[e]*n,0); return {tot,M}; }
/* De velden, de snelknoppen en de uitkomst staan in src/tools/Molm.vue; parseFormula() en ATOM
   hierboven worden daar aangeroepen (en blijven staan voor wie ze verder nodig heeft). */
calc.molm=function(){};

/* ================= pH-BUFFER =================
   De velden en de uitkomst staan in src/tools/Hh.vue; de component rekent zelf opnieuw. */
calc.hh=function(){};

/* ================= FORENSISCHE MATCHKANS =================
   De tabel, de genotypefrequentie per locus en de productregel staan in src/tools/Rmp.vue;
   die zet ook TBLDEF['rm-tbl'] en calc.rmp. */

/* ================= TAGS ================= */
const TAGS={verdunning:['Oplossingen','Verdunnen'],oplossing:['Oplossingen','Buffers'],units:['Oplossingen'],molm:['Oplossingen'],hh:['Buffers','Oplossingen'],
  curve:['Eiwit','ELISA','Spectrofotometrie'],enzym:['Enzymen','Spectrofotometrie'],spec:['Spectrofotometrie','Eiwit'],
  reeks:['Microbiologie','Verdunnen'],groei:['Microbiologie'],inoc:['Microbiologie','Verdunnen'],telkamer:['Celkweek','Microscopie'],teller:['Microscopie','Microbiologie'],seed:['Celkweek'],micro:['Microscopie'],gcomp:['Microbiologie'],mic:['Microbiologie'],
  dna:['DNA','Forensisch','Spectrofotometrie'],oligo:['PCR','DNA'],pcr:['PCR','Pipetteren'],pcrcyclus:['PCR','qPCR'],qpcr:['qPCR','PCR'],melt:['qPCR','PCR'],gel:['Gel-elektroforese','DNA','PCR'],gelfoto:['Gel-elektroforese'],sds:['Eiwit','Gel-elektroforese','Pipetteren'],wb:['Eiwit','Gel-elektroforese'],ligatie:['Kloneren','DNA','Enzymen'],transf:['Kloneren','Microbiologie'],rmp:['Forensisch','DNA'],
  stat:['Statistiek'],pverd:['Schema\'s','Verdunnen','Microbiologie'],ppip:['Schema\'s','Pipetteren','PCR','qPCR','Kloneren','Enzymen','Eiwit','Celkweek'],pprog:['Schema\'s','PCR'],
  centrifuge:['Bench'],timers:['Bench'],plaat:['Schema\'s','Pipetteren','ELISA','qPCR'],phadj:['Buffers','Oplossingen','Titratie'],medium:['Celkweek','Oplossingen','Pipetteren'],strchk:['Forensisch','DNA'],bpa:['Forensisch'],pmi:['Forensisch'],ystr:['Forensisch','DNA'],kin:['Forensisch','DNA'],pipcal:['Kwaliteit','Pipetteren'],westgard:['Kwaliteit','Statistiek'],munc:['Kwaliteit','Statistiek','Oplossingen'],mval:['Kwaliteit','Statistiek','Assays'],mpn:['Microbiologie','Verdunnen'],ic50:['Assays','Statistiek','Microbiologie','Celkweek'],steril:['Microbiologie','Kwaliteit'],passage:['Celkweek'],stain:['Schema\'s','Microbiologie','Microscopie'],cdna:['qPCR','Pipetteren'],qplate:['qPCR','Schema\'s','Pipetteren'],rnaq:['DNA','qPCR','Spectrofotometrie'],gplan:['Schema\'s','Gel-elektroforese','DNA','PCR'],osmo:['Oplossingen','Buffers','Celkweek'],titr:['Oplossingen','Buffers'],kjel:['Eiwit','Oplossingen'],plan:['Organisatie','Bench'],report:['Organisatie'],widmark:['Forensisch','Toxicologie'],stature:['Forensisch','Antropologie'],ento:['Forensisch'],glass:['Forensisch','Statistiek'],hwe:['Forensisch','DNA','Statistiek'],chrom:['Chromatografie','Kwaliteit'],istd:['Chromatografie','Statistiek','Kwaliteit'],edta:['Oplossingen','Titratie'],bufcap:['Buffers','Oplossingen'],ksp:['Oplossingen'],zprime:['Kwaliteit','ELISA','Statistiek'],transfect:['Celkweek','Kloneren','Pipetteren'],viab:['Celkweek','Tellen'],desinf:['Microbiologie','Kwaliteit'],bland:['Statistiek','Kwaliteit'],roc:['Statistiek','ELISA'],km:['Statistiek','Celkweek'],sigfig:['Statistiek'],pipkeus:['Pipetteren','Kwaliteit'],digest:['Kloneren','Enzymen','Pipetteren'],plasmid:['Kloneren','DNA','Enzymen'],aln:['DNA','Eiwit'],purif:['Eiwit','Enzymen'],gradient:['PCR'],elisa:['ELISA','Statistiek'],facs:['Celkweek','Pipetteren','Flowcytometrie'],mix:['Forensisch','DNA','Statistiek'],seq:['DNA','Kloneren','PCR']};
const tagsOf=id=>TAGS[id]||[];
const tagList=()=>{ const c={}; Object.values(TAGS).flat().forEach(t=>c[t]=(c[t]||0)+1); return Object.keys(c).sort((a,b)=>c[b]-c[a]||a.localeCompare(b)).map(t=>[t,c[t]]); };
const tagHref=t=>'#tag='+encodeURIComponent(t);
const curTag=()=>{ const h=(location.hash||'').slice(1); if(!h.startsWith('tag=')) return ''; try{ return decodeURIComponent(h.slice(4)); }catch(e){ return ''; } };
const tagChip=(t,on,n)=>`<a class="tag${on?' on':''}" href="${on?'#start':tagHref(t)}">${esc(t)}${n!=null?` <small>${n}</small>`:''}</a>`;
Object.keys(TAGS).forEach(id=>{ const h=$(`#t-${id} .tool-head h2`); if(h&&!h.nextElementSibling?.classList.contains('tags')) h.insertAdjacentHTML('afterend',`<div class="tags">${tagsOf(id).map(t=>tagChip(t)).join('')}</div>`); });
const navMatch=(el,q)=>{ const id=(el.getAttribute('href')||'').slice(1); return (el.textContent+' '+tagsOf(id).map(t=>t+' '+trPlain(t,true)).join(' ')+' '+((typeof SYN!=='undefined'&&SYN[id])||'')).toLowerCase().includes(q); };

/* ================= STARTPAGINA (BENTO) ================= */
const RKEY='labkit:v1:recent', FKEY='labkit:v1:fav';
/* jget() en jset() staan sinds S267 in src/lib/storage.js */
function toolIndex(){ const out=[]; let grp=''; [...$('#nav').children].forEach(el=>{ if(el.classList.contains('navgroup')) grp=el.textContent; else if(el.tagName==='A'){ const id=el.getAttribute('href').slice(1), sec=$('#t-'+id); if(!sec||id==='start') return; const p=sec.querySelector('.tool-head p'); const name=[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim(); out.push({id,grp,name,tags:tagsOf(id),desc:p?p.textContent.split(/(?<=[.:])\s/)[0].replace(/[.:]$/,''):''}); } }); return out; }
/* bentoRender() is src/tools/Start.vue geworden (S263); de fase en de werkstroomtegel zitten daar ook in */
window.addEventListener('hashchange',()=>{ const id=(location.hash||'').slice(1); if(!id||id==='start'||!TOOLS.includes(id)) return; const r=jget(RKEY,[]).filter(x=>x!==id); r.unshift(id); jset(RKEY,r.slice(0,8)); });
$('#reset-store').addEventListener('click',()=>{ try{ localStorage.removeItem(RKEY); localStorage.removeItem(FKEY); }catch(e){} },true);

/* ================= CELLEN UITZAAIEN ================= */
/* De velden en de uitkomst staan in src/tools/Seed.vue. */
calc.seed=function(){};

/* ================= PRIMERS OPLOSSEN ================= */
/* De voorbeelddata, de tabel en de uitkomst staan in src/tools/Oligo.vue. */
calc.oligo=function(){};   /* src/main.js zet de definitieve stub */

/* ================= SDS-PAGE MONSTERS ================= */
calc.sds=function(){};   /* de Vue-component (src/tools/Sds.vue) rekent zelf; src/main.js zet de definitieve stub */

/* ================= MICROSCOOP ================= */
/* De velden en de uitkomst staan in src/tools/Micro.vue; stNums(), mean() en sd() blijven hier. */
calc.micro=function(){};
/* ---------- init new tools ---------- */

/* alles hierboven ook als globale naam, live (zie src/lib/global.js) */
live({
  sLoad: [() => sLoad, v => { sLoad = v; }],
  coef: [() => coef, v => { coef = v; }],
  fitCurve: [() => fitCurve, v => { fitCurve = v; }],
  mmFit: [() => mmFit, v => { mmFit = v; }],
  NN: () => NN,
  tmNN: [() => tmNN, v => { tmNN = v; }],
  primerInfo: [() => primerInfo, v => { primerInfo = v; }],
  mmss2: () => mmss2,
  drawProfile: [() => drawProfile, v => { drawProfile = v; }],
  STANDALONE: () => STANDALONE,
  dlCap: [() => dlCap, v => { dlCap = v; }],
  dlShown: [() => dlShown, v => { dlShown = v; }],
  showDl: [() => showDl, v => { showDl = v; }],
  saveBlob: [() => saveBlob, v => { saveBlob = v; }],
  safeName: () => safeName,
  csvBlob: () => csvBlob,
  dlMsg: [() => dlMsg, v => { dlMsg = v; }],
  ADDBTN: () => ADDBTN,
  STORE: () => STORE,
  NOPERSIST: () => NOPERSIST,
  storeGet: [() => storeGet, v => { storeGet = v; }],
  persistable: [() => persistable, v => { persistable = v; }],
  persistSave: [() => persistSave, v => { persistSave = v; }],
  KSQ: () => KSQ,
  kSq: [() => kSq, v => { kSq = v; }],
  cellText: [() => cellText, v => { cellText = v; }],
  xlParse: [() => xlParse, v => { xlParse = v; }],
  xlNum: [() => xlNum, v => { xlNum = v; }],
  tableData: [() => tableData, v => { tableData = v; }],
  toTSV: [() => toTSV, v => { toTSV = v; }],
  toHTML: [() => toHTML, v => { toHTML = v; }],
  flashBtn: [() => flashBtn, v => { flashBtn = v; }],
  copyRich: [() => copyRich, v => { copyRich = v; }],
  decorateXL: [() => decorateXL, v => { decorateXL = v; }],
  MAINW: () => MAINW,
  lkMainWatch: [() => lkMainWatch, v => { lkMainWatch = v; }],
  alertBox: [() => alertBox, v => { alertBox = v; }],
  TBLKEY: () => TBLKEY,
  TBLDEF: () => TBLDEF,
  tblSnap: [() => tblSnap, v => { tblSnap = v; }],
  tblRestore: [() => tblRestore, v => { tblRestore = v; }],
  lastTbl: [() => lastTbl, v => { lastTbl = v; }],
  tblDirty: [() => tblDirty, v => { tblDirty = v; }],
  gammaln: [() => gammaln, v => { gammaln = v; }],
  betacf: [() => betacf, v => { betacf = v; }],
  ibeta: [() => ibeta, v => { ibeta = v; }],
  gammp: [() => gammp, v => { gammp = v; }],
  tcdf: () => tcdf,
  fcdf: () => fcdf,
  chicdf: () => chicdf,
  ncdf: () => ncdf,
  invcdf: [() => invcdf, v => { invcdf = v; }],
  tinv: () => tinv,
  finv: () => finv,
  chiinv: () => chiinv,
  ST_DIXON: () => ST_DIXON,
  ST_LILL: () => ST_LILL,
  ST_GRUBBS: () => ST_GRUBBS,
  stNums: [() => stNums, v => { stNums = v; }],
  grubbsCrit: [() => grubbsCrit, v => { grubbsCrit = v; }],
  lillieD: [() => lillieD, v => { lillieD = v; }],
  stDesc: [() => stDesc, v => { stDesc = v; }],
  wilcoxDist: [() => wilcoxDist, v => { wilcoxDist = v; }],
  wilcoxCrit: [() => wilcoxCrit, v => { wilcoxCrit = v; }],
  rankAbs: [() => rankAbs, v => { rankAbs = v; }],
  pfmt: () => pfmt,
  erfcF: [() => erfcF, v => { erfcF = v; }],
  PhiF: () => PhiF,
  prange: [() => prange, v => { prange = v; }],
  ptukey: [() => ptukey, v => { ptukey = v; }],
  qtCache: () => qtCache,
  qtukey: [() => qtukey, v => { qtukey = v; }],
  stGroups: [() => stGroups, v => { stGroups = v; }],
  anovaCalc: [() => anovaCalc, v => { anovaCalc = v; }],
  PKEY: () => PKEY,
  pstore: () => pstore,
  PFONT: () => PFONT,
  PCOL: () => PCOL,
  pRender: [() => pRender, v => { pRender = v; }],
  pShow: [() => pShow, v => { pShow = v; }],
  PNGNAME: () => PNGNAME,
  pTitle: [() => pTitle, v => { pTitle = v; }],
  pNotes: [() => pNotes, v => { pNotes = v; }],
  pAuto: () => pAuto,
  pDrawNotes: [() => pDrawNotes, v => { pDrawNotes = v; }],
  pArrow: [() => pArrow, v => { pArrow = v; }],
  pTube: [() => pTube, v => { pTube = v; }],
  supNum: () => supNum,
  pNum: [() => pNum, v => { pNum = v; }],
  PPRE: () => PPRE,
  ppWater: () => ppWater,
  ppFromPreset: [() => ppFromPreset, v => { ppFromPreset = v; }],
  ppMigrate: [() => ppMigrate, v => { ppMigrate = v; }],
  ppEnzyme: () => ppEnzyme,
  ppRack: [() => ppRack, v => { ppRack = v; }],
  PGDEF: () => PGDEF,
  pgSecs: [() => pgSecs, v => { pgSecs = v; }],
  pgFmt: [() => pgFmt, v => { pgFmt = v; }],
  kwCalc: [() => kwCalc, v => { kwCalc = v; }],
  parsePlate: [() => parsePlate, v => { parsePlate = v; }],
  colList: [() => colList, v => { colList = v; }],
  bufImg: [() => bufImg, v => { bufImg = v; }],
  SERCOL: () => SERCOL,
  gompertz: [() => gompertz, v => { gompertz = v; }],
  fitGompertz: [() => fitGompertz, v => { fitGompertz = v; }],
  meltPeaks: [() => meltPeaks, v => { meltPeaks = v; }],
  nctcdf: [() => nctcdf, v => { nctcdf = v; }],
  powerT: [() => powerT, v => { powerT = v; }],
  anova2: [() => anova2, v => { anova2 = v; }],
  stBars: [() => stBars, v => { stBars = v; }],
  AAM: () => AAM,
  PALS: () => PALS,
  UIDEF: () => UIDEF,
  darkMQ: () => darkMQ,
  applyUI: [() => applyUI, v => { applyUI = v; }],
  REPO: () => REPO,
  UPDKEY: () => UPDKEY,
  cmpVer: () => cmpVer,
  openExt: [() => openExt, v => { openExt = v; }],
  updBanner: [() => updBanner, v => { updBanner = v; }],
  checkUpdate: [() => checkUpdate, v => { checkUpdate = v; }],
  ATOM: () => ATOM,
  parseFormula: [() => parseFormula, v => { parseFormula = v; }],
  TAGS: () => TAGS,
  tagsOf: () => tagsOf,
  tagList: () => tagList,
  tagHref: () => tagHref,
  curTag: () => curTag,
  tagChip: () => tagChip,
  navMatch: () => navMatch,
  RKEY: () => RKEY,
  FKEY: () => FKEY,
  toolIndex: [() => toolIndex, v => { toolIndex = v; }]
});
