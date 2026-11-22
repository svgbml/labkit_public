/* ================= OUDE KERN (S269) =================
   Letterlijk overgenomen uit het derde inline script van src/shell/index.html: de versie,
   TOOLS en de routering, de opslag- en invoerhaken en wat er van de oudste tools nog over is.
   Het staat als module in de bundel, in dezelfde volgorde als voorheen (zie src/main.js), en
   zet al zijn namen live op window, want de rest van de code leest ze als globale namen. */
import {live} from '../lib/global.js';

const APPVER='1.18.1';

/* ---------- routing ---------- */
const TOOLS=['start','seed','oligo','sds','micro','verdunning','oplossing','curve','enzym','reeks','groei','telkamer','teller','dna','pcr','pcrcyclus','qpcr','gel','gelfoto','ligatie','transf','stat','molm','hh','rmp','inst','spec','units','inoc','mic','gcomp','wb','melt','pverd','ppip','pprog','centrifuge','timers','plaat','strchk','bpa','pmi','ystr','kin','pipcal','westgard','munc','mval','mpn','ic50','steril','passage','stain','cdna','qplate','rnaq','osmo','titr','kjel','plan','report','widmark','stature','ento','glass','hwe','chrom','istd','edta','bufcap','ksp','zprime','transfect','viab','desinf','bland','roc','km','sigfig','pipkeus','digest','plasmid','aln','sanger','purif','gradient','elisa','facs','mix','gplan','phadj','medium','seq'];
let current='start';
const GONE={plaad:'gplan'};   /* tools die zijn opgegaan in een andere tool */
function route(){
  let h=(location.hash||'').slice(1).split('?')[0];
  if(GONE[h]){ h=GONE[h]; try{ history.replaceState(null,'','#'+h); }catch(e){ location.hash='#'+h; } }
  current=TOOLS.includes(h)?h:'start';
  $$('.tool').forEach(s=>s.classList.toggle('active',s.id==='t-'+current));
  $$('#nav > a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+current));
  if(calc[current]) calc[current]();
}
window.addEventListener('hashchange',route);
document.addEventListener('input',e=>{ const s=e.target.closest('[data-tool]'); if(s&&calc[s.dataset.tool]) calc[s.dataset.tool](e); });
document.addEventListener('change',e=>{ const s=e.target.closest('[data-tool]'); if(s&&calc[s.dataset.tool]&&e.target.tagName==='SELECT') calc[s.dataset.tool](e); });

/* het geluid, de timer-motor, de meldingen en het bewaren van de timers staan sinds S268 in src/engines/timers.js */
/* ================= VERDUNNING ================= */
const DCU={'X':['x',1],'M':['mol',1],'mM':['mol',1e-3],'µM':['mol',1e-6],'nM':['mol',1e-9],'g/L':['massa',1],'mg/mL':['massa',1],'µg/mL':['massa',1e-3],'ng/µL':['massa',1e-3],'%':['pct',1],'U/µL':['act',1],'U/mL':['act',1e-3]};
/* advies bij een te klein pipetteervolume: kant-en-klaar recept voor een tussenverdunning */
/* Het advies bij een te klein pipetvolume. pipAdviesDeel() geeft de melding los terug, zodat
   een Vue-tool hem met tHtml() kan vertalen: de DOM-vertaallaag komt niet in een Vue-boom, en
   de sleutel is precies de innerHTML van de melding. pipAdvies() blijft wat het was. */
function pipAdviesDeel(uL,wat){ if(!(uL>0)||uL>=1) return null; const f=uL*10>=1?10:100, crit=uL<0.5;
  return {kind:crit?'bad':'warn',html:`<span class="chip ${crit?'bad':'warn'}" style="vertical-align:middle;margin-right:6px">${crit?'&lt; 0,5 µL':'&lt; 1 µL'}</span>${wat?wat+': ':''}${vol(uL)} is niet nauwkeurig te pipetteren. Advies: maak een 1:${f} tussenverdunning (${f===10?'2,0 µL stock + 18,0 µL':'1,0 µL stock + 99,0 µL'} oplosmiddel) en pipetteer daarvan ${vol(uL*f)}.`}; }
function pipAdvies(uL,wat){ const d=pipAdviesDeel(uL,wat); return d?note(d.kind,d.html):''; }
/* De velden en de uitkomst staan in src/tools/Verdunning.vue. DCU (de eenhedentabel) blijft
   hierboven staan, want de reeksplanner gebruikt die ook. */
calc.verdunning=function(){};

/* ================= OPLOSSING ================= */
const CHEM={'NaCl':58.44,'KCl':74.55,'Tris (base)':121.14,'Tris-HCl':157.60,'EDTA-Na₂·2H₂O':372.24,'MgCl₂·6H₂O':203.30,'CaCl₂·2H₂O':147.01,'Na₂HPO₄':141.96,'NaH₂PO₄·H₂O':137.99,'KH₂PO₄':136.09,'NaOH':40.00,'Boorzuur':61.83,'Glucose':180.16,'Sucrose':342.30,'SDS':288.38,'Natriumacetaat (watervrij)':82.03,'Glycine':75.07};
$('#chem-list').innerHTML=Object.keys(CHEM).map(k=>`<option value="${k}">`).join('');
/* RECIPES, RECNAME, PH en RECSRC staan in src/legacy/nt/03_recipe.js (de receptenbibliotheek). */
let recipeKey='trisnacl';
const HYD=[['Na₂HPO₄',[['watervrij','Na₂HPO₄',141.96],['dihydraat (·2H₂O)','Na₂HPO₄·2H₂O',177.99],['heptahydraat (·7H₂O)','Na₂HPO₄·7H₂O',268.07],['dodecahydraat (·12H₂O)','Na₂HPO₄·12H₂O',358.14]]],
 ['NaH₂PO₄',[['watervrij','NaH₂PO₄',119.98],['monohydraat (·H₂O)','NaH₂PO₄·H₂O',137.99],['dihydraat (·2H₂O)','NaH₂PO₄·2H₂O',156.01]]],
 ['EDTA',[['Na₂EDTA·2H₂O (gebruikelijk)','EDTA-Na₂·2H₂O',372.24],['vrij zuur (lost pas op met NaOH)','EDTA (vrij zuur)',292.24]]],
 ['MgCl₂',[['watervrij','MgCl₂',95.21],['hexahydraat (·6H₂O)','MgCl₂·6H₂O',203.30]]],
 ['CaCl₂',[['watervrij','CaCl₂',110.98],['dihydraat (·2H₂O)','CaCl₂·2H₂O',147.01]]],
 ['MgSO₄',[['watervrij','MgSO₄',120.37],['heptahydraat (·7H₂O)','MgSO₄·7H₂O',246.47]]],
 ['Natriumacetaat',[['watervrij','Natriumacetaat (watervrij)',82.03],['trihydraat (·3H₂O)','Natriumacetaat·3H₂O',136.08]]],
 ['Glucose',[['watervrij','Glucose',180.16],['monohydraat (·H₂O)','Glucose·H₂O',198.17]]],
 ['Citroenzuur',[['watervrij','Citroenzuur',192.12],['monohydraat (·H₂O)','Citroenzuur·H₂O',210.14]]],
 ['Trinatriumcitraat',[['watervrij','Trinatriumcitraat',258.07],['dihydraat (·2H₂O)','Trinatriumcitraat·2H₂O',294.10]]],
 ['CuSO₄',[['watervrij','CuSO₄',159.61],['pentahydraat (·5H₂O)','CuSO₄·5H₂O',249.69]]]];
HYD.forEach(g=>g[1].forEach(v=>{ if(!CHEM[v[1]]){ CHEM[v[1]]=v[2]; $('#chem-list').insertAdjacentHTML('beforeend',`<option value="${v[1]}">`); } }));
const hydNorm=t=>String(t).toLowerCase().replace(/\s+/g,'').replace(/[·.*]/g,'·').replace(/[₀-₉]/g,c=>String(c.charCodeAt(0)-8320));
function hydFind(name){ const k=hydNorm(name); if(!k) return null; for(let gi=0;gi<HYD.length;gi++){ const vi=HYD[gi][1].findIndex(v=>hydNorm(v[1])===k); if(vi>=0) return [gi,vi]; } return null; }
function hydSel(name){ const f=hydFind(name); return `<select data-k="h" data-g="${f?f[0]:''}" aria-label="Vorm (hydraat)"${f?'':' disabled'}>${f?HYD[f[0]][1].map((v,i)=>`<option value="${i}"${i===f[1]?' selected':''}>${v[0]}</option>`).join(''):'<option value="">–</option>'}</select>`; }
/* De tabel, de stappen en het advies worden door src/tools/Oplossing.vue gerenderd. Wat hier
   overblijft is het stappenschema op het canvas: calc.oplossing() tekent dat, en de component
   roept het na elke render aan. loadRecipe() blijft bestaan omdat de werkstromen en het
   opdrachtpalet een recept kunnen laden. */
function loadRecipe(k){ recipeKey=k; const vm=window.__oplosVm; if(vm){ vm.preset=k; } }
calc.oplossing=function(){ try{ bufImg(); }catch(e){} };
/* ================= REEKS / KVE =================
   De velden, de tabel en de uitkomst staan in src/tools/Reeks.vue. De tellingen per buis
   blijven hier staan, want tblSnap()/tblRestore() bewaren ze en tests/validate.py zet ze;
   buildReeks() laadt ze daarna in de component. */
let reeksCounts={4:['TNTC','TNTC'],5:['243','251'],6:['27','31']};
function buildReeks(){ const vm=window.__reeksVm; if(vm) vm.load(reeksCounts); }
calc.reeks=function(){};

/* ================= TELKAMER ================= */
/* vaktellingen zijn hele getallen: komma, puntkomma, spatie en enter scheiden altijd */
function kList(txt){ const n=[], bad=[]; String(txt).split(/[\s,;]+/).filter(Boolean).forEach(t=>{ /^\d{1,6}$/.test(t)?n.push(+t):bad.push(t); }); return {n,bad}; }
/* De velden en de uitkomst staan in src/tools/Telkamer.vue; kList() hierboven blijft, want
   de component gebruikt hem. */
calc.telkamer=function(){};

/* ================= TELLER ================= */
/* De indelingen, de tellers, de toetsen 1–9/Backspace en het bewaren van de stand staan in
   src/tools/Teller.vue (zelfde localStorage-sleutel labkit:v1:teller). */
calc.teller=function(){};

/* ================= DNA ================= */
calc.dna=function(){};   /* de component (src/tools/Dna.vue) rekent zelf */

/* ================= PCR ================= */
/* ---------- buizenrek bij de PCR-mastermix: de mix en elke reactiebuis ---------- */
function qRack(n,V,T,mix){ const cv=$('#qr-cv'); if(!cv||typeof pRack!=='function') return;
  /* harde bovengrens: een rek met duizenden buizen heeft geen zin en zou de tekening
     laten vastlopen bij een extreme invoer */
  const RMAX=48, ns0=Math.max(0,Math.round(num($('#q-n').value)||0)), nc0=Math.max(0,Math.round(num($('#q-ctrl').value)||0));
  const ns=Math.min(ns0,RMAX), nc=Math.min(nc0,Math.max(0,RMAX-ns));
  const tubes=[{n:'Mastermix',v:isFinite(mix)?mix*n:NaN,c:'#5f6b7a',f:0.8,sub:trPlain('voor alle buizen')}];
  for(let i=1;i<=ns;i++) tubes.push({n:`Monster ${i}`,v:V,c:PCOL.acc,f:0.5});
  for(let i=1;i<=nc;i++) tubes.push({n:i===1?'NTC':`Controle ${i-1}`,v:V,c:i===1?'#b0271f':'#17693d',f:0.5});
  if(tubes.length<2||!isFinite(V)){ cv.style.display='none'; return; }
  cv.style.display='';
  const cut=(ns0+nc0)>RMAX;
  const per=Math.min(8,tubes.length), rows=Math.ceil(tubes.length/per), W=Math.max(520,per*104+40), H=pRackH(rows)+(cut?22:0);
  pShow(cv,W,H,(x)=>{ pRack(x,20,20,W-40,tubes,{per});
    if(cut){ x.fillStyle=PCOL.muted; x.font='11.5px '+PFONT(); x.textAlign='left'; x.textBaseline='alphabetic';
      x.fillText(`Alleen de eerste ${RMAX} buizen zijn getekend.`,20,H-8); } });
}
calc.pcr=function(){};   /* de Vue-component (src/tools/Pcr.vue) rekent zelf; main.js zet draw() erop */

/* ================= GEL ================= */
const GELR=[[0.5,2000,50000],[0.6,1000,20000],[0.7,800,12000],[0.8,800,10000],[0.9,600,10000],[1.0,400,8000],[1.2,300,7000],[1.5,200,3000],[2.0,100,2000],[3.0,25,1000],[4.0,10,500],[5.0,10,300]];
const LADDERS={'k1k13':[10000,8000,6000,5000,4000,3000,2500,2000,1500,1000,750,500,250],'k1kp':[25000,10000,8000,6000,5000,4000,3000,2500,2000,1500,1000,750,500,250],'h100':[1500,1000,900,800,700,600,500,400,300,200,100],'h100p':[3000,1500,1000,900,800,700,600,500,400,300,200,100],'b50':[500,400,300,250,200,150,100,50],'fast1':[1200,700,500,300,200,100],'neb1k':[10000,8000,6000,5000,4000,3000,2000,1500,1000,500],'neb100':[1517,1200,1000,900,800,700,600,500,400,300,200,100],'ppp':[250,150,100,75,50,37,25,20,15,10],'prplus':[250,130,100,70,55,35,25,15,10],'100':[1000,900,800,700,600,500,400,300,200,100],'100p':[3000,2000,1500,1200,1000,900,800,700,600,500,400,300,200,100],'1k':[10000,8000,6000,5000,4000,3500,3000,2500,2000,1500,1000,750,500,250]};
const LEX={'100':[14,17,20.5,24.5,29,34,40,47.5,56,67]};
calc.gel=function(){};   /* de component (src/tools/Gel.vue) rekent zelf; LADDERS, LEX en GELR blijven hier voor Gelplanner en Gelfoto */

/* ================= LIGATIE ================= */
calc.ligatie=function(){};   /* de Vue-component (src/tools/Ligatie.vue) rekent zelf */

/* ---------- init ---------- */
buildReeks();
renderTimers();
['verdunning','reeks','telkamer','dna','pcr','gel','ligatie'].forEach(k=>calc[k]());   /* 'oplossing' loopt pas na de receptenbibliotheek */
route();

/* alles hierboven ook als globale naam, live (zie src/lib/global.js) */
live({
  APPVER: () => APPVER,
  TOOLS: () => TOOLS,
  current: [() => current, v => { current = v; }],
  GONE: () => GONE,
  route: [() => route, v => { route = v; }],
  DCU: () => DCU,
  pipAdviesDeel: [() => pipAdviesDeel, v => { pipAdviesDeel = v; }],
  pipAdvies: [() => pipAdvies, v => { pipAdvies = v; }],
  CHEM: () => CHEM,
  recipeKey: [() => recipeKey, v => { recipeKey = v; }],
  HYD: () => HYD,
  hydNorm: () => hydNorm,
  hydFind: [() => hydFind, v => { hydFind = v; }],
  hydSel: [() => hydSel, v => { hydSel = v; }],
  loadRecipe: [() => loadRecipe, v => { loadRecipe = v; }],
  reeksCounts: [() => reeksCounts, v => { reeksCounts = v; }],
  buildReeks: [() => buildReeks, v => { buildReeks = v; }],
  kList: [() => kList, v => { kList = v; }],
  qRack: [() => qRack, v => { qRack = v; }],
  GELR: () => GELR,
  LADDERS: () => LADDERS,
  LEX: () => LEX
});
