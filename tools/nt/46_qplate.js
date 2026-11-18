/* ================= QPCR-PLAATINDELING =================
   De indeling wordt nog steeds gegenereerd uit de invoer (monsters × doelgenen × replicaten,
   elk doelgen op een nieuwe rij of kolom), maar komt nu in de gedeelde plaatontwerper te
   staan (S35). Die is daarna met de hand bij te stellen: de tekening, de mastermixen en de
   plaatlijst lezen altijd de toestand van de ontwerper, niet de invoer.
   Eén groep per doelgen, de naam van het putje is de naam van het monster. De taak volgt uit
   die naam, zodat één veld genoeg is: St1…Stn standaard, NTC een no-template control, al het
   andere een monster. */
let qpPld=null, qpGen=false, qpSig='', qpOver=false, qpNeed=0;
const QPRL='ABCDEFGHIJKLMNOP';
const qpTask=n=>/^St\d+$/i.test(n)?'standaard':(/^NTC$/i.test(n)?'NTC':'monster');
/* de plaat zoals hij nu staat, als lijst putjes */
function qpRows(){ if(!qpPld) return {R:8,C:12,rows:[],groups:[]}; const st=qpPld.get();
  const [R,C]=st.fmt.split('x').map(Number), rows=[];
  for(let r=0;r<R;r++) for(let c=0;c<C;c++){ const k=QPRL[r]+(c+1), g=st.wells[k];
    if(g==null||!st.groups[g]) continue; const s=st.vals[k]||'';
    rows.push({w:k,r,c,ti:g,t:st.groups[g].n,s,task:qpTask(s)}); }
  return {R,C,rows,groups:st.groups}; }

/* de drie exportvormen; de kolomnamen en taakwoorden zijn machineafspraken en worden
   daarom niet vertaald en niet van scheidingsteken gewisseld */
const QPEXP={
  eigen:{ext:'csv',own:true,head:['Well','Monster','Doel','Taak'],row:w=>[w.w,w.s,w.t,w.task]},
  abi:{ext:'txt',sep:'\t',head:['Well Position','Sample Name','Target Name','Task'],
       row:w=>[w.w,w.s,w.t,{standaard:'STANDARD',NTC:'NTC',monster:'UNKNOWN'}[w.task]]},
  cfx:{ext:'csv',sep:',',head:['Well','Target','Content','Sample'],
       row:w=>[w.w,w.t,{standaard:'Std',NTC:'NTC',monster:'Unkn'}[w.task],w.s]}
};
function qpExport(){ const {rows}=qpRows(), msg=$('#qp2-msg');
  if(!rows.length){ msg.textContent='De plaat is leeg; er is niets om te exporteren.'; return; }
  const F=QPEXP[$('#qp2-exp').value]||QPEXP.eigen, name=safeName(trPlain('qPCR-plaatindeling'));
  if(F.own){ const t=[F.head.join('\t'),...rows.map(w=>F.row(w).join('\t'))].join('\n');
    dlMsg(msg,()=>saveBlob(name+'.csv',csvBlob(t))); return; }
  const q=c=>{ c=String(c==null?'':c); return F.sep===','&&/[",\n]/.test(c)?`"${c.replace(/"/g,'""')}"`:c; };
  const t=[F.head.join(F.sep),...rows.map(w=>F.row(w).map(q).join(F.sep))].join('\r\n')+'\r\n';
  dlMsg(msg,()=>saveBlob(name+'.'+F.ext,new Blob([t],{type:F.ext==='csv'?'text/csv':'text/plain'}))); }

/* tekening, mastermixen en exportdata uit de huidige plaat */
function qpDraw(over,need){ const {R,C,rows,groups}=qpRows(), out=$('#qp2-out'), cv=$('#qp2-cv'), f=R>8;
  if(!rows.length){ out.innerHTML=note('info','Vul minstens één monster en één doelgen in.'); cv.style.display='none'; return; }
  const cnt=groups.map((g,i)=>rows.filter(w=>w.ti===i).length);
  const cs=f?24:44, W=40+C*cs+20, H=60+R*cs+20+groups.length*18, mar=(num($('#qp2-mar').value)||0)/100;
  pShow(cv,W,H,(x)=>{ x.font='600 11px '+PFONT(); x.fillStyle=PCOL.muted; x.textAlign='center'; x.textBaseline='middle';
    for(let c=0;c<C;c++) x.fillText(String(c+1),40+c*cs+cs/2,40); for(let r=0;r<R;r++) x.fillText(QPRL[r],22,56+r*cs+cs/2);
    for(let r=0;r<R;r++) for(let c=0;c<C;c++){ const w=rows.find(q=>q.r===r&&q.c===c), cx=40+c*cs+cs/2, cy=56+r*cs+cs/2;
      x.beginPath(); x.arc(cx,cy,cs/2-2,0,7);
      if(w){ const col=SERCOL[w.ti%SERCOL.length]; x.fillStyle=w.task==='NTC'?'#fff':col+(w.task==='standaard'?'88':'33'); x.fill();
        x.strokeStyle=col; x.lineWidth=w.task==='NTC'?2:1.2; x.stroke();
        if(!f&&w.s){ x.fillStyle=PCOL.ink; x.font='9.5px '+PFONT(); const lab=w.s.length>7?w.s.slice(0,6)+'…':w.s; x.fillText(uv(lab),cx,cy); } }
      else { x.strokeStyle=PCOL.line; x.lineWidth=1; x.stroke(); } }
    x.textAlign='left'; x.font='12px '+PFONT();
    groups.forEach((g,i)=>{ if(!cnt[i]) return; const y=56+R*cs+18+i*18; x.fillStyle=SERCOL[i%SERCOL.length]; x.fillRect(40,y-6,12,12);
      /* naam en aantal blijven letterlijk, alleen het woord erachter wordt vertaald; eerder
         werd de genaam zelf deel van de vertaalsleutel, dus elke nieuwe naam lekte weg */
      x.fillStyle=PCOL.ink; x.fillText(uv(g.n+': '+cnt[i])+' wells',58,y); }); });
  cv.style.display=''; cv._data={head:['Well','Monster','Doel','Taak'],rows:rows.map(w=>[w.w,w.s,w.t,w.task])};
  out.innerHTML=(over?note('bad',`De plaat is vol: ${rows.length} van de benodigde ${need} wells passen. Kies 384 wells, minder replicaten of minder monsters.`):'')+
    kv([['Wells gebruikt',`${rows.length} van ${R*C}`],...groups.map((g,i)=>cnt[i]?[`Mastermix ${ud(g.n)}`,`${cnt[i]} reacties → maak voor ${fmt(cnt[i]*(1+mar),1)}`]:null).filter(Boolean)]); }

calc.qplate=function(){ if(!qpPld) return;
  /* Alleen de velden die de indeling bepalen mogen de plaat opnieuw vullen. De exportvorm en
     de marge van de mastermix doen dat niet, want dan zou een eigen wijziging op de plaat
     verdwijnen zodra je een ander exportformaat kiest. */
  const sig=JSON.stringify(['qp2-fmt','qp2-rep','qp2-s','qp2-t','qp2-std','qp2-ntc','qp2-dir'].map(i=>$('#'+i).value));
  if(sig===qpSig){ qpDraw(qpOver,qpNeed); return; }
  qpSig=sig;
  const f=$('#qp2-fmt').value==='384', R=f?16:8, C=f?24:12;
  const rep=Math.min(48,Math.max(1,Math.round(num($('#qp2-rep').value)||1))), byRow=$('#qp2-dir').value==='row';
  const S=$('#qp2-s').value.split(',').map(s=>s.trim()).filter(Boolean).slice(0,384), T=$('#qp2-t').value.split(',').map(s=>s.trim()).filter(Boolean).slice(0,24);
  const nst=Math.min(24,Math.max(0,Math.round(num($('#qp2-std').value)||0))), nntc=Math.min(24,Math.max(0,Math.round(num($('#qp2-ntc').value)||0)));
  if(!S.length||!T.length){ $('#qp2-out').innerHTML=note('info','Vul minstens één monster en één doelgen in.'); $('#qp2-cv').style.display='none';
    qpGen=true; try{ qpPld.set({fmt:f?'16x24':'8x12',wells:{},vals:{},groups:[{n:'Doel',c:SERCOL[0]}]}); } finally { qpGen=false; } return; }
  const lineLen=byRow?C:R, nLines=byRow?R:C, wells={}, vals={}; let line=0, pos=0, over=false, n=0;
  T.forEach((t,ti)=>{ if(pos>0){ line++; pos=0; }
    const items=[...Array.from({length:nst},(_,i)=>({s:'St'+(i+1)})),...S.map(s=>({s})),...Array.from({length:nntc},()=>({s:'NTC'}))];
    items.forEach(it=>{ for(let k=0;k<rep&&!over;k++){ if(pos>=lineLen){ line++; pos=0; } if(line>=nLines){ over=true; return; }
      const r=byRow?line:pos, c=byRow?pos:line, key=QPRL[r]+(c+1); wells[key]=ti; vals[key]=it.s; pos++; n++; } }); });
  const need=T.length*(nst+S.length+nntc)*rep; qpOver=over; qpNeed=need;
  qpGen=true; try{ qpPld.set({fmt:f?'16x24':'8x12',wells,vals,groups:T.map((t,i)=>({n:t,c:SERCOL[i%SERCOL.length]}))}); } finally { qpGen=false; }
  qpDraw(over,need); };

qpPld=plateDesigner($('#qp2-pld'),{fmt:'8x12',autoLabel:false,name:()=>trPlain('qPCR-plaatindeling'),
  groups:[{n:'Doel',c:SERCOL[0]}], onChange(){ if(!qpGen) try{ qpDraw(false,0); }catch(e){} }});
$('#qp2-dl').addEventListener('click',qpExport);
