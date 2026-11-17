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
  {id:'pcrgel',n:'Van DNA tot gel',steps:['dna','oligo','pcr','pcrcyclus','plaad','gel','gelfoto']},
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
if(typeof bentoRender==='function'){ const _br=bentoRender; bentoRender=function(q){ const r=_br.apply(this,arguments); if(!(q||'').trim()&&!curTag()){ const t=$$('#bento-rest > .tile')[1]; if(t) t.insertAdjacentHTML('afterend',wfTile()); } return r; }; }
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
