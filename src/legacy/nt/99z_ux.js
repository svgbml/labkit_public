/* Letterlijk overgenomen uit tools/nt/99z_ux.js (S269): een classic script dat als module in de bundel staat
   en zijn namen live op window zet, zodat de andere code ze als globale namen blijft lezen. */
import {live} from '../../lib/global.js';

/* ================= UX 1.19: telefoonmenu, resultaatbalk, inklapbare groepen, validatiebadge, invoerfouten,
   werkstromen, eenheden in invoervelden, geschiedenis per tool en afdrukken per tool ================= */

/* ---------- telefoon: menuknop "Tools" opent alle tools als lijst (in plaats van een strook met 90 links) ---------- */
{ const sh=$('.sidehead'), R=document.documentElement;
  sh.insertAdjacentHTML('beforeend','<button type="button" class="ghost lk-menu" aria-expanded="false" aria-controls="nav" title="Alle tools">Tools</button>');
  const btn=sh.querySelector('.lk-menu');
  const set=o=>{ R.classList.toggle('nav-open',o); btn.setAttribute('aria-expanded',o?'true':'false'); if(o){ const a=$('#nav > a.active'); if(a) a.scrollIntoView({block:'center'}); } };
  btn.addEventListener('click',()=>set(!R.classList.contains('nav-open')));
  window.addEventListener('hashchange',()=>set(false));
  document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&R.classList.contains('nav-open')) set(false); });
  $('#nav').addEventListener('click',e=>{ const a=e.target.closest('#nav > a'); if(a&&!e.target.closest('button')) set(false); }); }

/* ---------- inklapbare groepen in de navigatie (onthouden per gebruiker) ---------- */
const NCKEY='labkit:v1:navcol';
$$('#nav > .navgroup').forEach(g=>{ g.dataset.grp=g.textContent.trim(); });
function navColApply(){ const col=new Set(jget(NCKEY,[])), q=($('#nav-q').value||'').trim(); let g=null;
  [...$('#nav').children].forEach(el=>{
    if(el.classList.contains('navgroup')){ if(!el.dataset.grp) el.dataset.grp=el.textContent.trim(); g=el.dataset.grp; el.tabIndex=0; el.setAttribute('role','button'); el.setAttribute('aria-expanded',col.has(g)?'false':'true'); }
    else if(el.tagName==='A') el.classList.toggle('nav-col',!!g&&!q&&col.has(g)&&!el.classList.contains('active')); }); }
function navColToggle(g){ const col=new Set(jget(NCKEY,[])); col.has(g)?col.delete(g):col.add(g); jset(NCKEY,[...col]); navColApply(); }
$('#nav').addEventListener('click',e=>{ const g=e.target.closest('#nav > .navgroup'); if(g) navColToggle(g.dataset.grp); });
$('#nav').addEventListener('keydown',e=>{ const g=e.target.closest('#nav > .navgroup'); if(g&&(e.key==='Enter'||e.key===' ')){ e.preventDefault(); navColToggle(g.dataset.grp); } });
$('#nav-q').addEventListener('input',navColApply);
window.addEventListener('hashchange',()=>setTimeout(navColApply,0));
if(typeof navFavs==='function'){ const _nf=navFavs; navFavs=function(){ const r=_nf.apply(this,arguments); navColApply(); return r; }; }
navColApply();

/* ---------- telefoon: hoofduitkomst onderin vastzetten zolang het resultaat buiten beeld is ---------- */
const lkRbar=document.createElement('button'); lkRbar.type='button'; lkRbar.className='lk-rbar'; lkRbar.hidden=true; lkRbar.setAttribute('data-notr',''); document.body.appendChild(lkRbar);
let lkRIO=null, lkREl=null, lkRVis=true; const lkNarrow=window.matchMedia?matchMedia('(max-width:900px)'):{matches:false};
function rbarUpdate(){ const sec=$('#t-'+current), r=sec&&current!=='start'?sec.querySelector('.result'):null;
  if(r!==lkREl){ if(lkRIO) lkRIO.disconnect(); lkREl=r; lkRVis=true; if(r&&'IntersectionObserver' in window){ lkRIO=new IntersectionObserver(es=>{ lkRVis=es.some(x=>x.isIntersecting); rbarShow(); }); lkRIO.observe(r); } }
  rbarShow(); }
function rbarShow(){ let txt=null; const big=lkREl&&lkREl.querySelector('.big');
  if(big&&big.offsetParent!==null&&big.textContent.trim()){ const l=big.previousElementSibling; txt=[l&&l.classList.contains('lbl')?l.textContent.trim():'',big.textContent.replace(/\s+/g,' ').trim()]; }
  const on=!!txt&&!lkRVis&&lkNarrow.matches; lkRbar.hidden=!on;
  if(on){ const h=`<span>${esc(txt[0])}</span><b>${esc(txt[1])}</b><i aria-hidden="true">↓</i>`; if(lkRbar.innerHTML!==h) lkRbar.innerHTML=h; lkRbar.setAttribute('aria-label',txt.join(' ')); } }
lkRbar.addEventListener('click',()=>{ if(lkREl) lkREl.scrollIntoView({behavior:'smooth',block:'start'}); });
lkMainWatch(rbarUpdate,120); window.addEventListener('hashchange',()=>setTimeout(rbarUpdate,60));

/* ---------- badge "Gevalideerd" in de kop van tools die tests/VALIDATIE.md controleert ---------- */
if(typeof VALIDATED!=='undefined') Object.entries(VALIDATED).forEach(([id,[n,ok]])=>{ const h=$(`#t-${id} .tool-head h2`); if(!h||ok!==n) return;
  let tg=h.nextElementSibling; if(!tg||!tg.classList.contains('tags')){ h.insertAdjacentHTML('afterend','<div class="tags"></div>'); tg=h.nextElementSibling; }
  tg.insertAdjacentHTML('beforeend',`<a class="tag lk-valid" href="https://github.com/svgbml/labkit_public/blob/main/tests/VALIDATIE.md" target="_blank" rel="noopener" title="Uitkomsten vergeleken met gepubliceerde referentiedata">✓ Gevalideerd (${n} ${n===1?'controle':'controles'})</a>`); });

/* ---------- ongeldige uitkomst: geen NaN/Infinity tonen, maar een streepje en een duidelijke melding ---------- */
function nanCheck(){ const sec=$('#t-'+current); if(!sec||current==='start') return;
  sec.querySelectorAll('.result').forEach(r=>{ const w=document.createTreeWalker(r,NodeFilter.SHOW_TEXT), hits=[];
    for(let n=w.nextNode();n;n=w.nextNode()){ if(/(?:^|[^\w])(?:NaN|[-−]?Infinity)(?![\w])/.test(n.data)&&!n.parentElement.closest('[data-lk-nan],textarea,script,style')) hits.push(n); }
    hits.forEach(n=>{ const sp=document.createElement('span'); sp.setAttribute('data-lk-nan',''); sp.setAttribute('data-notr',''); sp.textContent=n.data.replace(/[-−]?Infinity|NaN/g,'–'); n.replaceWith(sp); });
    const has=!!r.querySelector('[data-lk-nan]'), nt=r.querySelector(':scope > .lk-nan-note');
    if(has&&!nt) r.insertAdjacentHTML('afterbegin',note('warn lk-nan-note','Niet alles kon worden berekend: controleer of alle velden een geldig getal bevatten.'));
    else if(!has&&nt) nt.remove(); }); }
lkMainWatch(nanCheck,90);

/* ---------- werkstromen: vaste reeksen tools voor een heel experiment ---------- */
const WF=[
  {id:'pcrgel',n:'Van DNA tot gel',steps:['dna','oligo','pcr','pcrcyclus','gplan','gel','gelfoto']},
  {id:'kloon',n:'Kloneren',steps:['dna','digest','ligatie','transf']},
  {id:'qpcr',n:'Genexpressie met qPCR',steps:['rnaq','cdna','qplate','qpcr','melt']},
  {id:'cel',n:'Celkweek',steps:['telkamer','viab','seed','passage']},
  {id:'eiwit',n:'Eiwit en western blot',steps:['curve','sds','wb']},
  {id:'foren',n:'Forensisch DNA-profiel',steps:['dna','strchk','mix','rmp','kin']},
  {id:'qc',n:'Methode in gebruik nemen',steps:['pipcal','mval','munc','westgard']}
].map(w=>({...w,steps:w.steps.filter(id=>$('#t-'+id))}));
const WFKEY='labkit:v1:wf';
const wfNames=()=>{ const m={}; toolIndex().forEach(t=>{ m[t.id]=t.name; }); return m; };
const wfCur=()=>WF.find(w=>w.id===jget(WFKEY,{}).w)||null;
$('main').insertAdjacentHTML('afterbegin','<div id="lk-wf" class="lk-wf" hidden></div>');
function wfRender(){ const bar=$('#lk-wf'), w=wfCur(), i=w?w.steps.indexOf(current):-1; if(!w||i<0){ bar.hidden=true; return; }
  const N=wfNames(), prev=w.steps[i-1], next=w.steps[i+1];
  bar.innerHTML=`<div class="lk-wf-top"><b>${esc(w.n)}</b><span>stap ${i+1} van ${w.steps.length}</span><button type="button" class="ghost" data-wf-stop title="Werkstroom beëindigen">Stoppen</button></div>`+
    `<ol class="lk-wf-steps">${w.steps.map((id,k)=>`<li class="${k<i?'done':k===i?'on':''}"><a href="#${id}">${esc(N[id]||id)}</a></li>`).join('')}</ol>`+
    `<div class="lk-wf-nav">${prev?`<a class="lk-btn" href="#${prev}">← Vorige</a>`:'<span></span>'}${next?`<a class="lk-btn primary" href="#${next}">Volgende: ${ud(N[next]||next)} →</a>`:`<button type="button" class="primary" data-wf-stop>Werkstroom afronden</button>`}</div>`;
  bar.hidden=false; }
function wfTile(){ const w=wfCur(), N=wfNames();
  return `<div class="tile wide lk-wf-tile"><h3>Werkstromen <span>${WF.length}</span></h3><p class="lk-wf-intro">Doorloop de tools van een heel experiment op volgorde. Je invoer blijft per tool bewaard.</p><div class="lk-wf-list">${WF.map(x=>`<button type="button" class="lk-wf-card${w&&w.id===x.id?' on':''}" data-wf-start="${x.id}"><b>${esc(x.n)}</b><small>${x.steps.map(id=>`<span>${esc(N[id]||id)}</span>`).join(' → ')}</small></button>`).join('')}</div></div>`; }
document.addEventListener('click',e=>{
  const s=e.target.closest('[data-wf-start]'); if(s){ const w=WF.find(x=>x.id===s.dataset.wfStart); if(!w) return; const prev=wfCur(); jset(WFKEY,{w:w.id}); location.hash='#'+(prev&&prev.id===w.id&&w.steps.includes(jget(WFKEY+':at','')||'')?jget(WFKEY+':at',''):w.steps[0]); return; }
  if(e.target.closest('[data-wf-stop]')){ jset(WFKEY,{}); wfRender(); if(current==='start') calc.start(); } });
window.addEventListener('hashchange',()=>{ const w=wfCur(); if(w&&w.steps.includes(current)) jset(WFKEY+':at',current); wfRender(); });
/* de werkstroomtegel op de startpagina tekent src/tools/Start.vue (S263) */
wfRender();

/* ---------- eenheden in invoervelden: "50 mM", "0,5 µg/µL" of "250 nL" wordt omgerekend naar de eenheid van het veld ---------- */
const LKU=(()=>{ const D={}, add=(dim,list)=>list.forEach(([u,f])=>{ D[u]={dim,f}; });
  add('V',[['L',1],['l',1],['dL',.1],['dl',.1],['mL',1e-3],['ml',1e-3],['µL',1e-6],['µl',1e-6],['uL',1e-6],['ul',1e-6],['nL',1e-9],['nl',1e-9]]);
  add('m',[['kg',1e3],['g',1],['mg',1e-3],['µg',1e-6],['ug',1e-6],['ng',1e-9],['pg',1e-12]]);
  add('c',[['M',1],['mol/L',1],['mol/l',1],['mM',1e-3],['mmol/L',1e-3],['mmol/l',1e-3],['µM',1e-6],['uM',1e-6],['µmol/L',1e-6],['µmol/l',1e-6],['nM',1e-9],['nmol/L',1e-9],['nmol/l',1e-9],['pM',1e-12]]);
  add('w',[['g/L',1],['g/l',1],['mg/mL',1],['mg/ml',1],['µg/µL',1],['µg/µl',1],['mg/L',1e-3],['mg/l',1e-3],['µg/mL',1e-3],['µg/ml',1e-3],['ug/mL',1e-3],['ug/ml',1e-3],['ng/µL',1e-3],['ng/µl',1e-3],['ng/uL',1e-3],['ng/ul',1e-3],['µg/L',1e-6],['µg/l',1e-6],['ng/mL',1e-6],['ng/ml',1e-6],['pg/mL',1e-9],['pg/ml',1e-9]]);
  add('n',[['mol',1],['mmol',1e-3],['µmol',1e-6],['umol',1e-6],['nmol',1e-9],['pmol',1e-12],['fmol',1e-15]]);
  add('t',[['s',1],['sec',1],['min',60],['h',3600],['uur',3600],['d',86400],['dag',86400],['dagen',86400]]);
  add('x',[['m',1],['cm',1e-2],['mm',1e-3],['µm',1e-6],['um',1e-6],['nm',1e-9]]);
  return D; })();
const lkUnorm=u=>String(u||'').replace(/\s+/g,'').replace(/μ/g,'µ');
function lkUfmt(x){ const r=Number(x.toPrecision(6)), a=Math.abs(r); let s=(a===0||(a>=1e-4&&a<1e7))?String(r):r.toExponential().replace('e+','e'); return LANG==='en'?s:s.replace('.',','); }
function lkUnitConvert(el){ if(!el||el.tagName!=='INPUT'||!(el.type==='text'||el.type===''||el.type==='search')||!el.closest('section.tool')) return;
  const m=String(el.value).match(/^\s*([-+]?\d[\d.,]*(?:[eE][-+]?\d+)?)\s*([^\d\s].*?)\s*$/); if(!m) return;
  const from=lkUnorm(m[2]), F=LKU[from], v=num(m[1]); if(!F||!isFinite(v)) return;
  const box=el.closest('.inu'), sel=box&&box.querySelector('select'), span=box&&box.querySelector('.u');
  let to=null, setSel=null;
  if(sel){ const opts=[...sel.options], hit=opts.find(o=>lkUnorm(o.value)===from||lkUnorm(o.text)===from);
    if(hit){ setSel=hit.value; to=from; } else { const o=sel.options[sel.selectedIndex]; to=o&&(LKU[lkUnorm(o.value)]?lkUnorm(o.value):lkUnorm(o.text)); } }
  else if(span) to=lkUnorm(span.textContent);
  const T=LKU[to]; if(!T||T.dim!==F.dim) return;
  el.value=lkUfmt(v*F.f/T.f); el.__typed=true;
  if(setSel!=null&&sel.value!==setSel){ sel.value=setSel; sel.dispatchEvent(new Event('change',{bubbles:true})); }
  el.dispatchEvent(new Event('input',{bubbles:true}));
  if(from!==to){ el.classList.add('lk-conv'); setTimeout(()=>el.classList.remove('lk-conv'),1200); } }
document.addEventListener('change',e=>lkUnitConvert(e.target),true);
document.addEventListener('keydown',e=>{ if(e.key==='Enter') lkUnitConvert(e.target); },true);

/* ---------- geschiedenis per tool: eerdere invoer automatisch bewaren en met één klik terugzetten ---------- */
const HKEY='labkit:v1:hist', HTBL={};
$$('section.tool[data-tool]').forEach(sec=>{ const s=toolSnap(sec.dataset.tool); if(s) HTBL[s.t]=JSON.stringify(s.tb||{}); }); /* tabellen vóór het terugzetten van opgeslagen invoer = standaard */
function histIsDefault(s){ for(const [k,v] of Object.entries(s.v||{})){ const el=document.getElementById(k); if(!el) continue;
    const d=el.type==='checkbox'?el.defaultChecked:el.tagName==='SELECT'?(([...el.options].find(o=>o.defaultSelected)||el.options[0]||{}).value):el.defaultValue; if(String(d)!==String(v)&&!(String(v).trim()!==''&&num(d)===num(v))) return false; } /* 0,9 en 0.9 zijn gelijk */
  return JSON.stringify(s.tb||{})===(HTBL[s.t]||'{}'); }
const HENTER={}; /* invoer bij het openen van een tool: alleen bewaren als er tijdens het bezoek iets is veranderd */
function histEnter(id){ const s=id&&toolSnap(id); if(s) HENTER[id]=JSON.stringify(s); }
function histRec(id){ if(!id||['start','inst','report'].includes(id)) return; const s=toolSnap(id); if(!s||histIsDefault(s)) return;
  const j=JSON.stringify(s); if(j.length>60000||HENTER[id]===j) return; const all=jget(HKEY,{}), L=all[id]||[];
  if(L.length&&JSON.stringify(L[0].s)===j) return;
  if(L.length&&Date.now()-L[0].at<10*60e3) L[0]={at:Date.now(),s}; else L.unshift({at:Date.now(),s});
  all[id]=L.slice(0,8); jset(HKEY,all); HENTER[id]=j; }
let histPrev=current, histT=null;
window.addEventListener('hashchange',()=>{ histRec(histPrev); histPrev=current; setTimeout(()=>histEnter(current),0); });
window.addEventListener('load',()=>setTimeout(()=>histEnter(current),200));
document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='hidden') histRec(current); });
window.addEventListener('pagehide',()=>histRec(current));
document.addEventListener('input',e=>{ const sec=e.target.closest&&e.target.closest('section.tool[data-tool]'); if(!sec) return; clearTimeout(histT); histT=setTimeout(()=>histRec(sec.dataset.tool),20000); },true);
function histSummary(s){ const out=[]; for(const [k,v] of Object.entries(s.v||{})){ if(out.length>=4) break; const el=document.getElementById(k); if(!el||el.type==='checkbox'||!String(v).trim()) continue; const lb=document.querySelector(`label[for="${k}"]`); const val=el.tagName==='SELECT'?(([...el.options].find(o=>o.value===v)||{}).text||v):String(v); out.push(`${lb?lb.textContent.trim():k}: ${val.length>40?val.slice(0,40)+'…':val}`); } return out.join(' · '); }
function histOpen(id){ histRec(id); const L=(jget(HKEY,{})[id]||[]), name=$('#t-'+id+' .tool-head h2').textContent, loc=LANG==='en'?'en-GB':'nl-NL';
  const m=appModal(`<h3 style="margin:0 0 4px;font-size:16px">Eerdere invoer: ${ud(name)}</h3><p style="margin:0 0 10px;color:var(--muted);font-size:13px">Labkit bewaart je invoer automatisch als je een tool verlaat (de laatste 8 keer, alleen op dit apparaat).</p>`+
    (L.length?`<div class="lk-hist">${L.map((x,i)=>`<div class="lk-hist-row"><div><b data-notr="">${esc(new Date(x.at).toLocaleString(loc,{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}))}</b><small data-notr="">${esc(histSummary(x.s))}</small></div><button type="button" data-hist-load="${i}">Terugzetten</button></div>`).join('')}</div>`:'<div class="empty">Nog geen eerdere invoer bewaard.</div>')+
    `<div class="row" style="justify-content:space-between;margin-top:12px">${L.length?'<button type="button" class="ghost lk-hist-clear">Wis geschiedenis van deze tool</button>':'<span></span>'}<button type="button" class="lk-close">Sluiten</button></div>`);
  m.box.querySelector('.lk-close').addEventListener('click',m.close);
  const clr=m.box.querySelector('.lk-hist-clear'); if(clr) clr.addEventListener('click',()=>{ const all=jget(HKEY,{}); delete all[id]; jset(HKEY,all); m.close(); });
  m.box.addEventListener('click',e=>{ const b=e.target.closest('[data-hist-load]'); if(!b) return; const x=L[+b.dataset.histLoad]; if(!x) return; m.close(); toolApply(x.s); undoRec(id); alertBox('Eerdere invoer teruggezet. Ongedaan maken kan met Ctrl+Z.'); }); }

/* ---------- extra knoppen in de werkbalk van elke tool: geschiedenis en afdrukken ---------- */
$$('.lk-tbar').forEach(bar=>{ const id=bar.querySelector('[data-share]').dataset.share;
  bar.insertAdjacentHTML('beforeend',`<button type="button" class="ghost" data-hist="${id}" title="Eerdere invoer van deze tool terugzetten">Geschiedenis</button><button type="button" class="ghost" data-tprint="${id}" title="Invoer, uitkomst en bron van deze tool afdrukken of als PDF bewaren">Afdrukken</button>`); });
document.addEventListener('click',e=>{
  const h=e.target.closest('[data-hist]'); if(h){ histOpen(h.dataset.hist); return; }
  const p=e.target.closest('[data-tprint]'); if(p&&typeof rpDoc==='function'){ const id=p.dataset.tprint; rpPrint(rpDoc([id],true,true,$('#t-'+id+' .tool-head h2').textContent,$('#sess-name')?$('#sess-name').value:'')); } });

/* ---------- "volgende tool": handgekozen vervolgstappen onder aan elke tool ---------- */
const NEXT={
  verdunning:['oplossing','pverd','pipkeus'],oplossing:['hh','osmo','pverd'],units:['verdunning','molm'],molm:['oplossing','verdunning'],hh:['bufcap','titr','phadj'],phadj:['hh','oplossing','titr'],
  osmo:['oplossing','seed'],titr:['hh','bufcap'],kjel:['curve','spec'],edta:['titr','sigfig'],bufcap:['hh','titr'],
  ksp:['oplossing','units'],curve:['spec','mval','stat'],enzym:['curve','stat'],spec:['curve','dna'],ic50:['curve','stat'],
  chrom:['istd','mval'],istd:['chrom','munc'],zprime:['elisa','mval'],purif:['sds','wb'],elisa:['curve','zprime','roc'],
  reeks:['mpn','groei'],groei:['gcomp','inoc'],inoc:['groei','seed'],telkamer:['viab','seed'],teller:['telkamer','reeks'],
  medium:['seed','passage','viab'],seed:['passage','transfect'],micro:['telkamer','stain'],gcomp:['groei','stat'],mic:['desinf','stat'],mpn:['reeks','stat'],
  steril:['desinf','timers'],passage:['seed','viab'],transfect:['viab','facs'],viab:['seed','telkamer'],desinf:['mic','steril'],
  facs:['plaat','viab'],dna:['oligo','pcr','gel'],oligo:['pcr','pcrcyclus'],pcr:['pcrcyclus','ppip','gplan'],pcrcyclus:['gradient','pprog','pcr'],
  gradient:['pcrcyclus','gel'],qpcr:['melt','stat'],melt:['qpcr','gel'],gel:['gplan','gelfoto','digest'],gelfoto:['gel','wb'],
  sds:['wb','purif'],wb:['curve','stat'],ligatie:['transf','digest'],transf:['ligatie','reeks'],cdna:['qplate','qpcr'],
  qplate:['qpcr','ppip'],rnaq:['cdna','dna'],digest:['gel','ligatie'],rmp:['hwe','mix','kin'],strchk:['mix','rmp'],
  bpa:['report','stat'],pmi:['ento','report'],ystr:['rmp','hwe'],kin:['rmp','hwe'],widmark:['report','sigfig'],
  stature:['report','stat'],ento:['pmi','report'],glass:['stat','munc'],hwe:['rmp','ystr'],mix:['rmp','strchk'],
  stat:['sigfig','bland','report'],bland:['mval','munc'],roc:['stat','elisa'],km:['stat','report'],sigfig:['munc','stat'],
  pipcal:['munc','westgard'],westgard:['munc','mval'],munc:['sigfig','mval'],mval:['munc','westgard','bland'],pverd:['verdunning','reeks'],
  ppip:['pcr','plaat'],pprog:['pcrcyclus','pcr'],gplan:['gel','gelfoto','sds'],stain:['micro','teller'],centrifuge:['timers','pipkeus'],
  timers:['centrifuge','plan'],plaat:['ppip','elisa'],plan:['report','timers'],report:['plan','stat'],pipkeus:['pipcal','ppip']
};
{ const NM={}; toolIndex().forEach(t=>{ NM[t.id]=t.name; });
  Object.entries(NEXT).forEach(([id,list])=>{ const sec=$('#t-'+id), L=list.filter(x=>NM[x]&&$('#t-'+x)); if(!sec||!L.length||sec.querySelector('.lk-next')) return;
    sec.insertAdjacentHTML('beforeend',`<nav class="lk-next" aria-label="Volgende tool"><b>Hierna vaak</b>${L.map(x=>`<a href="#${x}">${esc(NM[x])}</a>`).join('')}</nav>`); }); }

/* ---------- vastgezette tools: maximaal zes snelkoppelingen boven het werkvlak ---------- */
const PINKEY='labkit:v1:pins', PINMAX=6;
const pinsGet=()=>jget(PINKEY,[]).filter(id=>$('#t-'+id)).slice(0,PINMAX);
$('main').insertAdjacentHTML('afterbegin','<nav id="lk-pins" class="lk-pins" aria-label="Vastgezette tools" hidden></nav>');
function pinsRender(){ const bar=$('#lk-pins'), P=pinsGet(), NM={}; toolIndex().forEach(t=>{ NM[t.id]=t.name; });
  bar.hidden=!P.length;
  if(P.length) bar.innerHTML='<b>Vastgezet</b>'+P.map(id=>`<span class="lk-pin${current===id?' on':''}" data-st="${stagesOf(id)[0]||''}"><a href="#${id}">${esc(NM[id]||id)}</a><button type="button" data-unpin="${id}" title="Losmaken" aria-label="Losmaken">×</button></span>`).join('');
  $$('[data-pin]').forEach(b=>{ const on=P.includes(b.dataset.pin), t=on?'Losmaken':'Vastzetten';
    b.setAttribute('aria-pressed',on?'true':'false'); if(b.dataset.lkp!==t){ b.dataset.lkp=t; b.textContent=t; } }); }
function pinToggle(id){ let P=jget(PINKEY,[]).filter(x=>$('#t-'+x));
  if(P.includes(id)) P=P.filter(x=>x!==id);
  else { if(P.length>=PINMAX){ alertBox(trPlain('Je kunt maximaal zes tools vastzetten. Maak er eerst een los.')); return; } P.push(id); }
  jset(PINKEY,P); pinsRender(); }
$$('.lk-tbar').forEach(bar=>{ const id=bar.querySelector('[data-share]').dataset.share;
  bar.insertAdjacentHTML('afterbegin',`<button type="button" class="ghost" data-pin="${id}" aria-pressed="false" title="Deze tool vastzetten boven het werkvlak">Vastzetten</button>`); });
document.addEventListener('click',e=>{ const p=e.target.closest('[data-pin]'); if(p){ pinToggle(p.dataset.pin); return; }
  const u=e.target.closest('[data-unpin]'); if(u) pinToggle(u.dataset.unpin); });
window.addEventListener('hashchange',()=>setTimeout(pinsRender,0));
pinsRender();

/* ---------- eenvoudig of uitgebreid: velden met data-expert staan standaard verborgen ----------
   Een verborgen veld blijft in de DOM staan, dus de berekening gebruikt gewoon de standaardwaarde.
   Staat er een afwijkende waarde in (bijvoorbeeld uit een deellink of de geschiedenis), dan blijft
   het veld zichtbaar, zodat niemand rekent met een getal dat hij niet ziet. */
const XKEY='labkit:v1:expert';
const xpOn=id=>!!jget(XKEY,{})[id];
const xpDefault=el=>el.type==='checkbox'?el.defaultChecked:el.tagName==='SELECT'?(([...el.options].find(o=>o.defaultSelected)||el.options[0]||{}).value):el.defaultValue;
const xpChanged=box=>[...box.querySelectorAll('input,select,textarea')].some(el=>el.type==='checkbox'?el.checked!==el.defaultChecked:String(el.value)!==String(xpDefault(el)));
function xpApply(id){ const sec=$('#t-'+id); if(!sec) return; const on=xpOn(id);
  /* xpApply() loopt sinds S255 ook na een render (zie xpInit), dus een veld dat van zijn
     standaard afwijkt komt nu meteen tevoorschijn in plaats van pas bij het opstarten. Een
     veld waarin iemand staat te typen blijft staan, ook als het weer op de standaard komt. */
  sec.querySelectorAll('[data-expert]').forEach(box=>{ box.hidden=!on&&!xpChanged(box)&&!box.contains(document.activeElement); });
  /* de knop staat soms in een Vue-boom en wordt dan niet door de DOM-laag vertaald */
  const t=trPlain(on?'Minder instellingen':'Meer instellingen');
  sec.querySelectorAll('[data-xp]').forEach(b=>{ b.setAttribute('aria-pressed',on?'true':'false');
    if(b.dataset.lkx!==t){ b.dataset.lkx=t; b.textContent=t; } }); }
function xpToggle(id){ const all=jget(XKEY,{}); if(all[id]) delete all[id]; else all[id]=1; jset(XKEY,all); xpApply(id); }
/* Een Vue-tool rendert zijn velden pas na de eerste render, dus dit loopt daarna nog een keer:
   een host die zijn knop al heeft wordt overgeslagen. */
function xpInit(){ $$('section.tool[data-tool]').forEach(sec=>{ const ex=[...sec.querySelectorAll('[data-expert]')]; if(!ex.length) return;
  const id=sec.dataset.tool, hosts=[];
  ex.forEach(e=>{ const h=e.closest('.fields')||e; if(!hosts.includes(h)) hosts.push(h); });
  hosts.forEach(h=>{ const n=h.nextElementSibling; if(n&&n.classList.contains('lk-xp-row')) return;
    h.insertAdjacentHTML('afterend',`<div class="lk-xp-row"><button type="button" class="lk-xp" data-xp="${id}" aria-pressed="false" title="${esc(trPlain('Toon of verberg de geavanceerde instellingen van deze tool'))}">${trPlain('Meer instellingen')}</button></div>`); });
  xpApply(id); }); }
xpInit(); lkMainWatch(xpInit,120);
document.addEventListener('click',e=>{ const b=e.target.closest('[data-xp]'); if(b) xpToggle(b.dataset.xp); });
window.addEventListener('hashchange',()=>setTimeout(()=>xpApply(current),0));

/* ---------- rondleiding bij het eerste bezoek (vier stappen), opnieuw te starten in Instellingen ---------- */
const TOURKEY='labkit:v1:tour', TOURV=1;
const TOUR=[
  {sel:'#bento-q,#nav-q',t:'Zoek een tool',d:'Typ een deel van een naam, een tag of een synoniem: "verdunnen", "ANOVA", "Bradford". Met Ctrl+K open je overal het opdrachtpalet.'},
  {sel:'.lk-st',t:'Fase van je experiment',d:'Kies Voorbereiden, Uitvoeren of Analyseren. De zijbalk en de startpagina laten dan alleen de tools van die fase zien.'},
  {sel:'.lk-wf-tile',t:'Werkstromen',d:'Een werkstroom loopt de tools van een heel experiment op volgorde af, van DNA tot gel. Je invoer blijft per tool bewaard.'},
  {sel:'#nav > a[href="#inst"]',t:'Instellingen',d:'Hier kies je taal, thema en de instellingen voor grafieken. Je kunt deze rondleiding daar ook opnieuw starten.'}
];
let tourAt=-1, tourKeys=null;
function tourBox(){ let b=$('#lk-tour'); if(b) return b;
  document.body.insertAdjacentHTML('beforeend',`<div id="lk-tour" class="lk-tour" role="dialog" aria-modal="true" aria-labelledby="lk-tour-t" hidden><div class="lk-tour-ring" aria-hidden="true"></div><div class="lk-tour-card"><h3 id="lk-tour-t"></h3><p class="lk-tour-d"></p><div class="lk-tour-foot"><span class="lk-tour-dots" aria-hidden="true"></span><button type="button" class="ghost" data-tour="stop">Overslaan</button><button type="button" data-tour="prev">Vorige</button><button type="button" class="primary" data-tour="next">Volgende</button></div></div></div>`);
  b=$('#lk-tour'); tStatic(b);
  b.addEventListener('click',e=>{ const t=e.target.closest('[data-tour]'); if(!t){ if(e.target===b) tourStop(); return; }
    if(t.dataset.tour==='stop') tourStop(); else tourGo(tourAt+(t.dataset.tour==='prev'?-1:1)); });
  return b; }
function tourGo(i){ if(i<0) return; if(i>=TOUR.length){ tourStop(); return; }
  /* het eerste doel dat echt zichtbaar is: op een telefoon is bijvoorbeeld het zoekveld
     in de zijbalk verborgen en dat in de startpagina juist niet */
  tourAt=i; const b=tourBox(), s=TOUR[i],
    el=s.sel.split(',').map(x=>document.querySelector(x.trim())).find(e=>e&&e.offsetParent!==null);
  b.hidden=false; document.documentElement.classList.add('lk-tour-on');
  $('#lk-tour-t').textContent=trPlain(s.t); b.querySelector('.lk-tour-d').textContent=trPlain(s.d);
  b.querySelector('.lk-tour-dots').innerHTML=TOUR.map((_,k)=>`<i class="${k===i?'on':''}"></i>`).join('');
  b.querySelector('[data-tour=prev]').disabled=i===0;
  const nx=b.querySelector('[data-tour=next]'), last=i===TOUR.length-1, t=last?'Klaar':'Volgende';
  if(nx.dataset.lkt!==t){ nx.dataset.lkt=t; nx.textContent=trPlain(t); }
  const ring=b.querySelector('.lk-tour-ring'), card=b.querySelector('.lk-tour-card');
  const r=el&&el.offsetParent!==null?el.getBoundingClientRect():null;
  if(r&&r.width&&r.height){ if(el.scrollIntoView&&(r.top<0||r.bottom>innerHeight)){ el.scrollIntoView({block:'center'}); }
    const q=el.getBoundingClientRect();
    ring.hidden=false; ring.style.cssText=`left:${q.left-6}px;top:${q.top-6}px;width:${q.width+12}px;height:${q.height+12}px`;
    const w=Math.min(340,innerWidth-24);
    card.style.cssText=`width:${w}px;left:${Math.max(12,Math.min(innerWidth-w-12,q.left+q.width/2-w/2))}px;top:0`;
    const ch=card.offsetHeight; /* hoogte pas bekend na het zetten van de breedte */
    let top=q.bottom+16; if(top+ch>innerHeight-12) top=q.top-16-ch; /* anders erboven */
    card.style.top=Math.max(12,Math.min(innerHeight-ch-12,top))+'px'; }
  else { ring.hidden=true; card.style.cssText=`width:min(340px,calc(100% - 24px));left:50%;top:50%;transform:translate(-50%,-50%)`; }
  setTimeout(()=>nx.focus(),0); }
function tourStop(){ const b=$('#lk-tour'); if(b) b.hidden=true; document.documentElement.classList.remove('lk-tour-on');
  tourAt=-1; if(tourKeys){ document.removeEventListener('keydown',tourKeys,true); tourKeys=null; }
  jset(TOURKEY,{v:TOURV}); }
function tourStart(){ if(current!=='start'){ location.hash='#start'; }
  setTimeout(()=>{ if(!tourKeys){ tourKeys=e=>{ if($('#lk-tour')&&$('#lk-tour').hidden) return;
      if(e.key==='Escape'){ e.preventDefault(); tourStop(); } else if(e.key==='ArrowRight'){ e.preventDefault(); tourGo(tourAt+1); } else if(e.key==='ArrowLeft'){ e.preventDefault(); tourGo(tourAt-1); } };
    document.addEventListener('keydown',tourKeys,true); } tourGo(0); },current==='start'?0:200); }
document.addEventListener('click',e=>{ if(e.target.closest('[data-tour-start]')) tourStart(); });
addEventListener('resize',()=>{ if(tourAt>=0) tourGo(tourAt); });
if(!jget(TOURKEY,{}).v) setTimeout(()=>{ if(!jget(TOURKEY,{}).v&&current==='start'&&!document.querySelector('.lk-modal')) tourStart(); },900);

/* ---------- "wat is er nieuw": na een update de punten uit CHANGELOG.md laten zien ---------- */
const NKEY='labkit:v1:seenver';
const nvCmp=(a,b)=>{ const A=String(a).split('.').map(Number), B=String(b).split('.').map(Number);
  for(let i=0;i<Math.max(A.length,B.length);i++){ const d=(A[i]||0)-(B[i]||0); if(d) return d<0?-1:1; } return 0; };
function newsOpen(all){ if(typeof NEWS==='undefined') return; const seen=jget(NKEY,'');
  const L=NEWS.filter(n=>all?true:(n.v&&nvCmp(n.v,seen)>0&&nvCmp(n.v,APPVER)<=0));
  if(!L.length) return;
  const head=all?'Alle wijzigingen':'Wat is er nieuw';
  const m=appModal(`<h3 style="margin:0 0 4px;font-size:16px">${head}</h3><p style="margin:0 0 12px;color:var(--muted);font-size:13px">Labkit werkt zonder internet; deze lijst hoort bij de versie die je nu gebruikt.</p>`+
    `<div class="lk-news">${L.map(n=>`<section><h4>${n.v?`<span data-notr="">${esc(n.v)}</span>`:esc(n.t||'')}${n.d?` <small data-notr="">${esc(n.d)}</small>`:''}</h4><ul>${n.items.map(i=>`<li>${esc(i)}</li>`).join('')}</ul></section>`).join('')}</div>`+
    `<div class="row" style="justify-content:space-between;margin-top:14px">${all?'<span></span>':'<button type="button" class="ghost" data-news-all="">Alle wijzigingen</button>'}<button type="button" class="primary lk-close">Sluiten</button></div>`);
  m.box.querySelector('.lk-close').addEventListener('click',m.close);
  const a=m.box.querySelector('[data-news-all]'); if(a) a.addEventListener('click',()=>{ m.close(); newsOpen(true); });
  if(!all) jset(NKEY,APPVER); }
document.addEventListener('click',e=>{ if(e.target.closest('[data-news]')) newsOpen(true); });
{ const seen=jget(NKEY,'');
  if(!seen) jset(NKEY,APPVER); /* eerste bezoek: niets melden, alleen onthouden */
  else if(nvCmp(seen,APPVER)<0) setTimeout(()=>{ if(!document.querySelector('.lk-modal')&&!document.querySelector('#lk-tour:not([hidden])')) newsOpen(false); },1200); }

/* ---------- monsterlijst: één keer plakken, in meerdere tools gebruiken (S36) ----------
   De lijst staat in localStorage onder labkit:v1:samples en is dus in elke tool dezelfde.
   Een tool meldt met smpUse(id, fn) hoe hij de namen toepast; de knop <button data-smp="id">
   opent het venster. Namen zijn invoer van de gebruiker: ze worden nooit vertaald. */
const SMPKEY='labkit:v1:samples';
const smpGet=()=>{ const v=jget(SMPKEY,null); return Array.isArray(v)?v.filter(x=>typeof x==='string'&&x.trim()).map(x=>x.trim()):[]; };
const smpSet=a=>jset(SMPKEY,a.slice(0,384));
const smpParse=t=>String(t).split(/[\n;,\t]+/).map(s=>s.trim()).filter(Boolean).slice(0,384);
const SMPUSE={};
function smpUse(id,fn){ SMPUSE[id]=fn; }
function smpOpen(id){
  if(document.querySelector('.lk-modal')) return;
  const cur=smpGet(), has=!!SMPUSE[id];
  const m=appModal(`<h3 style="margin:0 0 4px;font-size:16px">Monsterlijst</h3>
    <p style="margin:0 0 10px;color:var(--muted);font-size:13px">Eén naam per regel (of gescheiden door komma's of puntkomma's). De lijst blijft op dit apparaat bewaard en is in de Plaatindeling, de Gelplanner en de qPCR-plaatindeling dezelfde.</p>
    <textarea data-smp-t class="mono" rows="8" data-notr="" style="width:100%;font-size:13px" placeholder="Monster 1&#10;Monster 2&#10;Controle">${esc(cur.join('\n'))}</textarea>
    <p data-smp-n style="margin:6px 0 0;font-size:12.5px;color:var(--muted)"></p>
    <div class="row" style="justify-content:flex-end;margin-top:12px;gap:6px"><button type="button" data-smp-x>Annuleren</button><button type="button" data-smp-s>Alleen bewaren</button>${has?'<button type="button" class="primary" data-smp-go>Bewaren en hier gebruiken</button>':''}</div>`);
  const T=m.box.querySelector('[data-smp-t]'), N=m.box.querySelector('[data-smp-n]');
  const count=()=>{ const n=smpParse(T.value).length; N.textContent=n===1?trPlain('1 naam in de lijst.'):trPlain(n+' namen in de lijst.'); };
  T.addEventListener('input',count); count();
  m.box.querySelector('[data-smp-x]').addEventListener('click',m.close);
  m.box.querySelector('[data-smp-s]').addEventListener('click',()=>{ smpSet(smpParse(T.value)); m.close(); });
  const go=m.box.querySelector('[data-smp-go]');
  if(go) go.addEventListener('click',()=>{ const a=smpParse(T.value); smpSet(a); m.close(); try{ SMPUSE[id](a); }catch(e){} });
  setTimeout(()=>T.focus(),0);
}
document.addEventListener('click',e=>{ const b=e.target.closest('[data-smp]'); if(b){ e.preventDefault(); smpOpen(b.dataset.smp); } });

/* Plaatindeling: elk replicaatblok van de gekozen groep krijgt de volgende naam uit de lijst */
smpUse('plaat',names=>{ if(typeof wPld==='undefined'||!wPld||!names.length) return;
  const gi=wPld.selected(), bl=wPld.blocks(gi), st=wPld.get();
  Object.keys(bl).forEach(k=>{ const n=names[bl[k]]; if(n) st.vals[k]=n; else delete st.vals[k]; });
  wPld.set(st); });
/* Gelplanner: één laan per naam, met de volumes en kleur van de eerste laan */
smpUse('gplan',names=>{ const T=TBLDEF['gp-tbl']; if(!T||!T.set||!names.length) return;
  const old=etGet('gp-tbl'), base=old[0]||['','10','','#1558b0'];
  T.set(names.map((n,i)=>{ const r=(old[i]||base).slice(); r[0]=n; return r; })); });
/* qPCR-plaatindeling: het komma-gescheiden veld met monsters */
smpUse('qplate',names=>{ const el=$('#qp2-s'); if(!el||!names.length) return;
  el.value=names.join(', '); el.__typed=true;
  el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true}));
  try{ calc.qplate(); }catch(e){} });

/* alles hierboven ook als globale naam, live (zie src/lib/global.js) */
live({
  NCKEY: () => NCKEY,
  navColApply: [() => navColApply, v => { navColApply = v; }],
  navColToggle: [() => navColToggle, v => { navColToggle = v; }],
  lkRbar: () => lkRbar,
  lkRIO: [() => lkRIO, v => { lkRIO = v; }],
  lkREl: [() => lkREl, v => { lkREl = v; }],
  lkRVis: [() => lkRVis, v => { lkRVis = v; }],
  lkNarrow: () => lkNarrow,
  rbarUpdate: [() => rbarUpdate, v => { rbarUpdate = v; }],
  rbarShow: [() => rbarShow, v => { rbarShow = v; }],
  nanCheck: [() => nanCheck, v => { nanCheck = v; }],
  WF: () => WF,
  WFKEY: () => WFKEY,
  wfNames: () => wfNames,
  wfCur: () => wfCur,
  wfRender: [() => wfRender, v => { wfRender = v; }],
  wfTile: [() => wfTile, v => { wfTile = v; }],
  LKU: () => LKU,
  lkUnorm: () => lkUnorm,
  lkUfmt: [() => lkUfmt, v => { lkUfmt = v; }],
  lkUnitConvert: [() => lkUnitConvert, v => { lkUnitConvert = v; }],
  HKEY: () => HKEY,
  HTBL: () => HTBL,
  histIsDefault: [() => histIsDefault, v => { histIsDefault = v; }],
  HENTER: () => HENTER,
  histEnter: [() => histEnter, v => { histEnter = v; }],
  histRec: [() => histRec, v => { histRec = v; }],
  histPrev: [() => histPrev, v => { histPrev = v; }],
  histT: [() => histT, v => { histT = v; }],
  histSummary: [() => histSummary, v => { histSummary = v; }],
  histOpen: [() => histOpen, v => { histOpen = v; }],
  NEXT: () => NEXT,
  PINKEY: () => PINKEY,
  PINMAX: () => PINMAX,
  pinsGet: () => pinsGet,
  pinsRender: [() => pinsRender, v => { pinsRender = v; }],
  pinToggle: [() => pinToggle, v => { pinToggle = v; }],
  XKEY: () => XKEY,
  xpOn: () => xpOn,
  xpDefault: () => xpDefault,
  xpChanged: () => xpChanged,
  xpApply: [() => xpApply, v => { xpApply = v; }],
  xpToggle: [() => xpToggle, v => { xpToggle = v; }],
  xpInit: [() => xpInit, v => { xpInit = v; }],
  TOURKEY: () => TOURKEY,
  TOURV: () => TOURV,
  TOUR: () => TOUR,
  tourAt: [() => tourAt, v => { tourAt = v; }],
  tourKeys: [() => tourKeys, v => { tourKeys = v; }],
  tourBox: [() => tourBox, v => { tourBox = v; }],
  tourGo: [() => tourGo, v => { tourGo = v; }],
  tourStop: [() => tourStop, v => { tourStop = v; }],
  tourStart: [() => tourStart, v => { tourStart = v; }],
  NKEY: () => NKEY,
  nvCmp: () => nvCmp,
  newsOpen: [() => newsOpen, v => { newsOpen = v; }],
  SMPKEY: () => SMPKEY,
  smpGet: () => smpGet,
  smpSet: () => smpSet,
  smpParse: () => smpParse,
  SMPUSE: () => SMPUSE,
  smpUse: [() => smpUse, v => { smpUse = v; }],
  smpOpen: [() => smpOpen, v => { smpOpen = v; }]
});
