/* ================= PLAATINDELING: DE TOOL OP DE PLAATONTWERPER =================
   De opmaak van deze tool staat in web/index.html; de code staat hier. De plaat zelf is de
   gedeelde plaatontwerper uit 02_plate.js, die hierboven in hetzelfde script is ingevoegd.
   Deze module zet daar de titel, het kleurenpalet, de legenda in de afbeelding, een eigen
   toelichting en de export als tabel of CSV omheen, en tekent de plaat groot op een canvas
   voor PNG, SVG, kopiëren en afdrukken.

   function- en var-declaraties worden gehesen, dus tblSnap() en tblRestore() in index.html
   mogen hier wel naar verwijzen; deze module loopt vóór tblRestore(). */
const GCOL=['#1d5bc4','#c2410c','#15803d','#7c3aed','#b91c1c','#0e7490','#a16207','#be185d','#4b5563','#0f766e'];
const WRL='ABCDEFGHIJKLMNOP';
var wPld=null;
function wState(){ return wPld?wPld.get():{fmt:'8x12',wells:{},vals:{},groups:[],seed:null}; }
function wDims(){ const [r,c]=wState().fmt.split('x').map(Number); return {r:r||8,c:c||12}; }
function wLabels(){ return wPld?wPld.labels():{cnt:{},lab:{}}; }

/* de voorbeeldplaat waarmee de tool opent: standaarden in duplo, een blanco, monsters en een
   positieve controle; precies de indeling die de tool altijd had */
function wExample(){ if(!wPld) return; const {r,c}=wDims(); if(r!==8||c<12) return; const w={};
  for(let i=0;i<7;i++){ w[WRL[i]+1]=0; w[WRL[i]+2]=0; } w.H1=1; w.H2=1;
  for(let col=3;col<=8;col++) for(let i=0;i<8;i++) w[WRL[i]+col]=2; w.H11=3; w.H12=3;
  wPld.set({fmt:'8x12',wells:w,vals:{},groups:wState().groups}); }

/* ---------- de afbeelding ---------- */
function plateImg(){ const cv=$('#w-cv'); if(!cv||!wPld) return;
  const S=wState(), {r,c}=wDims(), {lab,cnt}=wLabels(), title=$('#w-title').value.trim();
  const sz=c>=16?30:c>=12?44:c>=8?54:70, W=Math.max(560,60+c*sz+20);
  const sq=$('#w-shape').value==='vierkant', used=$('#w-leg').checked?S.groups.map((g,i)=>[g,i]).filter(([g,i])=>cnt[i]):[];
  const NL_=pNotes('w',W), legRows=Math.ceil(used.length/3), H=(title?40:0)+30+r*sz+20+legRows*22+(NL_.length?NL_.length*17+12:0)+10;
  pShow(cv,W,H,(x)=>{ const t0=pTitle(x,title,W), L=44, T=t0+26; x.font='600 12px '+PFONT(); x.fillStyle=PCOL.muted; x.textAlign='center';
    for(let j=1;j<=c;j++) x.fillText(String(j),L+(j-0.5)*sz,T-10); for(let i=0;i<r;i++) x.fillText(WRL[i],L-14,T+(i+0.5)*sz);
    x.strokeStyle=PCOL.ink; x.lineWidth=1.2; x.beginPath(); x.roundRect?x.roundRect(L-6,T-4,c*sz+12,r*sz+8,10):x.rect(L-6,T-4,c*sz+12,r*sz+8); x.stroke();
    for(let i=0;i<r;i++) for(let j=1;j<=c;j++){ const k=WRL[i]+j, g=S.wells[k], on=g!=null&&S.groups[g], cx=L+(j-0.5)*sz, cy=T+(i+0.5)*sz, rad=sz*0.42;
      x.beginPath(); if(sq){ x.roundRect?x.roundRect(cx-rad,cy-rad,2*rad,2*rad,5):x.rect(cx-rad,cy-rad,2*rad,2*rad); } else x.arc(cx,cy,rad,0,7);
      x.fillStyle=on?S.groups[g].c:'#f4f5f7'; x.fill(); x.strokeStyle=on?'rgba(0,0,0,.25)':PCOL.line; x.lineWidth=1; x.stroke();
      const t=S.vals[k]||(on?(lab[k]||''):''); if(t){ x.fillStyle=on?inkOn(S.groups[g].c):PCOL.ink; wellLines(x,t,cx,cy,sq?rad*1.12:rad); } }
    let ly=T+r*sz+26; used.forEach(([g,i],q)=>{ const col=q%3, row=Math.floor(q/3), lx=L+col*Math.max(170,(W-L-20)/3), yy=ly+row*22;
      x.fillStyle=g.c; x.beginPath(); x.arc(lx+6,yy,6,0,7); x.fill(); x.fillStyle=PCOL.ink; x.font='12.5px '+PFONT(); x.textAlign='left';
      /* de naam gaat door de vertaallaag, het aantal erachter blijft letterlijk */
      x.fillText(g.n,lx+18,yy); x.fillText(uv(' ('+cnt[i]+')'),lx+18+x.measureText(g.n).width,yy); });
    if(NL_.length) pDrawNotes(x,NL_,ly+legRows*22+8); }); }
/* tekst in een putje over meer regels, zodat hij binnen de rand blijft */
function wellLines(x,t,cx,cy,rad){ const W=rad*1.72, set=fs=>{ x.font=`600 ${fs}px `+PFONT(); };
  const mw=v=>x.measureText(uv(v)).width;   /* ook meten gaat door trCanvas: markeer de tekst */
  const wrap=(fs,split)=>{ set(fs); let words=String(t).split(/\s+/); if(split) words=words.flatMap(w=>{ if(mw(w)<=W) return [w]; const parts=[]; let cur=''; [...w].forEach(ch=>{ if(mw(cur+ch+'-')>W&&cur){ parts.push(cur+'-'); cur=ch; } else cur+=ch; }); parts.push(cur); return parts; });
    const out=[]; let ln=''; words.forEach(w=>{ const c=(ln+' '+w).trim(); if(mw(c)>W&&ln){ out.push(ln); ln=w; } else ln=c; }); if(ln) out.push(ln); return out; };
  const fits=(L,fs)=>{ set(fs); const n=L.length, hh=n*fs*1.1; return L.every((l,i)=>{ const yy=(i-(n-1)/2)*fs*1.1, half=Math.sqrt(Math.max(0,rad*rad*0.92-(Math.abs(yy)+fs*0.45)**2)); return mw(l)<=2*half; })&&hh<=rad*1.7; };
  let fs=Math.min(12,rad*0.62), L=null; for(;fs>=5.5;fs-=0.5){ const c=wrap(fs,false); if(fits(c,fs)){ L=c; break; } }
  if(!L){ for(fs=Math.min(9,rad*0.45);fs>=5;fs-=0.5){ const c=wrap(fs,true); if(fits(c,fs)||fs<=5.5){ L=c; break; } } }
  set(fs); L.forEach((l,i)=>x.fillText(uv(l),cx,cy+(i-(L.length-1)/2)*fs*1.1)); }

/* ---------- de plaat als tabel ---------- */
function wCells(){ const S=wState(), {r,c}=wDims(), {lab}=wLabels();
  const cell=k=>{ const g=S.wells[k], gn=g!=null&&S.groups[g]?S.groups[g].n:'', own=S.vals[k];
    return own?own+(gn?` (${gn})`:''):(gn?`${gn} ${(lab[k]||'').replace(/^\D+/,'')}`.trim():''); };
  return {r,c,cell}; }
$('#w-copy').addEventListener('click',async()=>{ const {r,c,cell}=wCells();
  let t=$('#w-title').value+'\n\t'+Array.from({length:c},(_,j)=>j+1).join('\t')+'\n';
  for(let i=0;i<r;i++){ t+=WRL[i]; for(let j=1;j<=c;j++) t+='\t'+cell(WRL[i]+j); t+='\n'; }
  t=i18nTSV(t); try{ await navigator.clipboard.writeText(t); $('#w-copied').textContent='Gekopieerd. Plak in Excel, Sheets of je labjournaal.'; $('#w-fallback').style.display='none'; }
  catch(e){ const f=$('#w-fallback'); f.value=t; f.style.display='block'; f.select(); $('#w-copied').textContent='Kopiëren werd geblokkeerd. Selecteer en kopieer de tekst hieronder.'; } });
$('#w-csv').addEventListener('click',()=>{ const {r,c,cell}=wCells();
  let t='\t'+Array.from({length:c},(_,j)=>j+1).join('\t');
  for(let i=0;i<r;i++){ t+='\n'+WRL[i]; for(let j=1;j<=c;j++) t+='\t'+cell(WRL[i]+j); }
  dlMsg($('#w-copied'),()=>saveBlob(safeName($('#w-title').value)+'.csv',csvBlob(t))); });

/* ---------- opmaakkeuzes gaan naar de ontwerper, de afbeelding volgt ---------- */
$('#w-pal').addEventListener('change',e=>{ const pal=PALS[e.target.value]; if(!pal||!wPld) return; wPld.palette(pal); plateImg(); });
$('#w-shape').addEventListener('change',e=>{ if(wPld) wPld.shape(e.target.value); plateImg(); });
$('#w-autolab').addEventListener('change',e=>{ if(wPld) wPld.autoLabel(e.target.checked); plateImg(); });
$('#w-leg').addEventListener('change',()=>plateImg());
['w-title','w-note'].forEach(id=>$('#'+id).addEventListener('input',()=>plateImg()));
calc.plaat=()=>{ plateImg(); };

wPld=plateDesigner($('#w-pld'),{fmt:'8x12',shape:$('#w-shape').value,autoLabel:$('#w-autolab').checked,
  palette:PALS[$('#w-pal').value]||GCOL, name:()=>$('#w-title').value,
  groups:[{n:'Standaard',c:GCOL[0]},{n:'Blanco',c:GCOL[8]},{n:'Monster',c:GCOL[1]},{n:'Pos. controle',c:GCOL[2]}],
  onChange(){ try{ plateImg(); }catch(e){} }});
wExample();
