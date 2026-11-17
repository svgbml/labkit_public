/* ================= FASEN VAN EEN EXPERIMENT: VOORBEREIDEN · UITVOEREN · ANALYSEREN =================
   STAGES geeft per tool de fase(n) waarin hij hoort: 'v' voorbereiden, 'u' uitvoeren, 'a' analyseren.
   Een tool mag in meer dan één fase staan ('ua'). start en inst horen bij geen enkele fase: die
   zijn altijd zichtbaar. tests/stages_check.py meldt tools zonder fase. */
const STAGE_DEF=[['v','Voorbereiden'],['u','Uitvoeren'],['a','Analyseren']];
const STAGE_NONE=['start','inst'];
const STAGES={
  /* Oplossingen */
  verdunning:'v',oplossing:'v',units:'va',molm:'v',hh:'v',osmo:'v',titr:'ua',kjel:'a',edta:'a',bufcap:'va',ksp:'v',
  /* Assays */
  curve:'a',enzym:'a',spec:'a',ic50:'a',chrom:'a',istd:'a',zprime:'a',purif:'a',elisa:'a',
  /* Microbiologie & cellen */
  reeks:'ua',groei:'a',inoc:'vu',telkamer:'ua',teller:'u',seed:'vu',micro:'u',gcomp:'a',mic:'a',mpn:'a',
  steril:'va',passage:'v',transfect:'v',viab:'ua',desinf:'a',facs:'v',
  /* DNA */
  dna:'a',oligo:'v',pcr:'v',pcrcyclus:'v',qpcr:'a',melt:'a',gel:'va',gelfoto:'a',sds:'v',wb:'a',
  ligatie:'v',transf:'ua',cdna:'v',qplate:'v',rnaq:'a',digest:'v',gradient:'v',
  /* Forensisch */
  rmp:'a',strchk:'a',bpa:'a',pmi:'a',ystr:'a',kin:'a',widmark:'a',stature:'a',ento:'a',glass:'a',hwe:'a',mix:'a',
  /* Data */
  stat:'a',bland:'a',roc:'a',km:'a',sigfig:'a',
  /* Kwaliteit */
  pipcal:'ua',westgard:'a',munc:'a',mval:'a',
  /* Protocollen */
  pverd:'v',ppip:'v',pprog:'v',plaad:'v',stain:'vu',
  /* Bench */
  centrifuge:'u',timers:'u',plaat:'v',plan:'v',report:'a',pipkeus:'vu'
};
const STAGE_NAME={}; STAGE_DEF.forEach(([k,n])=>{ STAGE_NAME[k]=n; });
const stagesOf=id=>[...(STAGES[id]||'')];
const stageHas=(id,s)=>!s||STAGE_NONE.includes(id)||(STAGES[id]||'').includes(s);

/* ---------- fasetabs boven de navigatie: filteren de tools in de zijbalk en op de startpagina ---------- */
const STKEY='labkit:v1:stage';
const stageCur=()=>{ const s=jget(STKEY,''); return STAGE_NAME[s]?s:''; };
{ const sh=$('.sidehead');
  sh.insertAdjacentHTML('beforeend',`<div class="lk-st" role="tablist" aria-label="Fase van het experiment">`+
    [['','Alle fasen'],...STAGE_DEF].map(([k,n])=>`<button type="button" role="tab" data-st="${k}" aria-selected="false" title="${n}">${n}</button>`).join('')+`</div>`);
  const tabs=[...sh.querySelectorAll('.lk-st button')];
  const mark=()=>{ const st=stageCur(); tabs.forEach(b=>{ const on=b.dataset.st===st; b.setAttribute('aria-selected',on?'true':'false'); b.tabIndex=on?0:-1; }); document.documentElement.dataset.stage=st; };
  function stageSet(st){ jset(STKEY,STAGE_NAME[st]?st:''); mark(); navStageApply(); if(current==='start'&&calc.start) calc.start(); }
  sh.querySelector('.lk-st').addEventListener('click',e=>{ const b=e.target.closest('button[data-st]'); if(b) stageSet(b.dataset.st); });
  sh.querySelector('.lk-st').addEventListener('keydown',e=>{ const d=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0; if(!d) return; e.preventDefault();
    const i=tabs.findIndex(b=>b.getAttribute('aria-selected')==='true'), n=tabs[(i+d+tabs.length)%tabs.length]; stageSet(n.dataset.st); n.focus(); });
  mark(); }
/* zijbalk: een tool is zichtbaar als hij bij de zoekterm én bij de gekozen fase past */
function navStageApply(){ const st=stageCur(), q=($('#nav-q').value||'').trim().toLowerCase(), kids=[...$('#nav').children];
  kids.forEach(el=>{ if(el.tagName!=='A') return; const id=(el.getAttribute('href')||'').slice(1); el.hidden=(!!q&&!navMatch(el,q))||!stageHas(id,st); });
  kids.forEach((el,i)=>{ if(!el.classList.contains('navgroup')) return; let any=false; for(let j=i+1;j<kids.length&&kids[j].tagName==='A';j++) if(!kids[j].hidden) any=true; el.hidden=!any; }); }
$('#nav-q').addEventListener('input',navStageApply);
if(typeof navFavs==='function'){ const _nf2=navFavs; navFavs=function(){ const r=_nf2.apply(this,arguments); navStageApply(); return r; }; }
/* startpagina: dezelfde fase toepassen op de tegels */
if(typeof bentoRender==='function'){ const _brs=bentoRender, _ti=toolIndex;
  bentoRender=function(q){ const st=stageCur(); if(st) toolIndex=()=>_ti().filter(t=>stageHas(t.id,st));
    try{ return _brs.apply(this,arguments); } finally{ toolIndex=_ti; } }; }
navStageApply();
