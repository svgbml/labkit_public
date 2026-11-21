/* Letterlijk overgenomen uit tools/nt/46_qplate.js (S269): een classic script dat als module in de bundel staat
   en zijn namen live op window zet, zodat de andere code ze als globale namen blijft lezen. */
import {live} from '../../lib/global.js';

/* ================= QPCR-PLAATINDELING =================
   De indeling wordt nog steeds gegenereerd uit de invoer (monsters × doelgenen × replicaten,
   elk doelgen op een nieuwe rij of kolom), maar komt nu in de gedeelde plaatontwerper te
   staan (S35). Die is daarna met de hand bij te stellen: de tekening, de mastermixen en de
   plaatlijst lezen altijd de toestand van de ontwerper, niet de invoer.
   Eén groep per doelgen, de naam van het putje is de naam van het monster. De taak volgt uit
   die naam, zodat één veld genoeg is: St1…Stn standaard, NTC een no-template control, al het
   andere een monster.

   De velden, de tekening, de mastermixen en de exportknop staan sinds S230 in src/tools/Qplate.vue
   (host #qp-app); de component leest de plaat met qpRows() en schrijft hem met qpPld.set().
   De plaatontwerper zelf blijft een DOM-widget op #qp2-pld, buiten de Vue-boom, zodat de
   vertaallaag zijn knoppen blijft vertalen. */
let qpPld=null;
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
/* geeft de melding terug die onder de knop komt (Dutch, de component vertaalt hem) */
async function qpExport(kind){ const {rows}=qpRows(), msg={};
  if(!rows.length) return 'De plaat is leeg; er is niets om te exporteren.';
  const F=QPEXP[kind]||QPEXP.eigen, name=safeName(trPlain('qPCR-plaatindeling'));
  if(F.own){ const t=[F.head.join('\t'),...rows.map(w=>F.row(w).join('\t'))].join('\n');
    await dlMsg(msg,()=>saveBlob(name+'.csv',csvBlob(t))); return msg.textContent; }
  const q=c=>{ c=String(c==null?'':c); return F.sep===','&&/[",\n]/.test(c)?`"${c.replace(/"/g,'""')}"`:c; };
  const t=[F.head.join(F.sep),...rows.map(w=>F.row(w).map(q).join(F.sep))].join('\r\n')+'\r\n';
  await dlMsg(msg,()=>saveBlob(name+'.'+F.ext,new Blob([t],{type:F.ext==='csv'?'text/csv':'text/plain'}))); return msg.textContent; }

calc.qplate=function(){};

qpPld=plateDesigner($('#qp2-pld'),{fmt:'8x12',autoLabel:false,name:()=>trPlain('qPCR-plaatindeling'),
  groups:[{n:'Doel',c:SERCOL[0]}], onChange(){ try{ if(window.__qpVm) window.__qpVm.onPlate(); }catch(e){} }});

/* alles hierboven ook als globale naam, live (zie src/lib/global.js) */
live({
  qpPld: [() => qpPld, v => { qpPld = v; }],
  QPRL: () => QPRL,
  qpTask: () => qpTask,
  qpRows: [() => qpRows, v => { qpRows = v; }],
  QPEXP: () => QPEXP,
  qpExport: [() => qpExport, v => { qpExport = v; }]
});
