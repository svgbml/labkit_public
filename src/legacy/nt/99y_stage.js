/* Letterlijk overgenomen uit tools/nt/99y_stage.js (S269): een classic script dat als module in de bundel staat
   en zijn namen live op window zet, zodat de andere code ze als globale namen blijft lezen. */
import {live} from '../../lib/global.js';

/* ================= FASEN VAN EEN EXPERIMENT: VOORBEREIDEN · UITVOEREN · ANALYSEREN =================
   STAGES geeft per tool de fase(n) waarin hij hoort: 'v' voorbereiden, 'u' uitvoeren, 'a' analyseren.
   Een tool mag in meer dan één fase staan ('ua'). start en inst horen bij geen enkele fase: die
   zijn altijd zichtbaar. tests/stages_check.py meldt tools zonder fase. */
const STAGE_DEF=[['v','Voorbereiden'],['u','Uitvoeren'],['a','Analyseren']];
const STAGE_NONE=['start','inst'];
const STAGES={
  /* Oplossingen */
  verdunning:'v',oplossing:'v',units:'va',molm:'v',hh:'v',phadj:'v',osmo:'v',titr:'ua',kjel:'a',edta:'a',bufcap:'va',ksp:'v',
  /* Assays */
  curve:'a',enzym:'a',spec:'a',ic50:'a',chrom:'a',istd:'a',zprime:'a',purif:'a',elisa:'a',
  /* Microbiologie & cellen */
  reeks:'ua',groei:'a',inoc:'vu',telkamer:'ua',teller:'u',seed:'vu',micro:'u',gcomp:'a',mic:'a',mpn:'a',
  steril:'va',passage:'v',medium:'v',transfect:'v',viab:'ua',desinf:'a',facs:'v',
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
  pverd:'v',ppip:'v',pprog:'v',stain:'vu',gplan:'v',pmap:'v',
  /* Bench */
  centrifuge:'u',timers:'u',plaat:'v',plan:'v',report:'a',pipkeus:'vu'
};
const STAGE_NAME={}; STAGE_DEF.forEach(([k,n])=>{ STAGE_NAME[k]=n; });
const stagesOf=id=>[...(STAGES[id]||'')];
const stageHas=(id,s)=>!s||STAGE_NONE.includes(id)||(STAGES[id]||'').includes(s);

/* ---------- fasetabs boven de navigatie: filteren de tools in de zijbalk en op de startpagina ---------- */
const STKEY='labkit:v1:stage';
const stageCur=()=>{ const s=jget(STKEY,''); return STAGE_NAME[s]?s:''; };
let stageMark=()=>{};
function stageSet(st){ jset(STKEY,STAGE_NAME[st]?st:''); stageMark(); navStageApply(); if(current==='start'&&calc.start) calc.start(); }
{ const sh=$('.sidehead');
  sh.insertAdjacentHTML('beforeend',`<div class="lk-st" role="tablist" aria-label="Fase van het experiment">`+
    [['','Alle fasen'],...STAGE_DEF].map(([k,n])=>`<button type="button" role="tab" data-st="${k}" aria-selected="false" title="${n}">${n}</button>`).join('')+`</div>`);
  const tabs=[...sh.querySelectorAll('.lk-st button')];
  const mark=()=>{ const st=stageCur(); tabs.forEach(b=>{ const on=b.dataset.st===st; b.setAttribute('aria-selected',on?'true':'false'); b.tabIndex=on?0:-1; }); document.documentElement.dataset.stage=st; };
  stageMark=mark;
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
/* startpagina: src/tools/Start.vue past de fase zelf toe (S263) */
navStageApply();

/* ---------- kruimelpad (Fase > Groep > Tool) in de kop van elke tool, met de kleur van de fase ---------- */
{ const GRP={}, GFIRST={}, NM={}; toolIndex().forEach(t=>{ GRP[t.id]=t.grp; NM[t.id]=t.name; if(!GFIRST[t.grp]) GFIRST[t.grp]=t.id; });
  $$('#nav > a').forEach(a=>{ const st=stagesOf((a.getAttribute('href')||'').slice(1))[0]; if(st) a.dataset.st=st; });
  $$('section.tool[data-tool]').forEach(sec=>{ const id=sec.dataset.tool; if(id==='start') return;
    const h=sec.querySelector('.tool-head'), h2=h&&h.querySelector('h2'); if(!h2||h.querySelector('.lk-crumb')) return;
    const st=stagesOf(id)[0]||'', g=GRP[id]||'', nm=NM[id]||h2.textContent.trim(), bits=[];
    if(st) h.dataset.st=st;
    if(st) bits.push(`<a class="lk-cr-st" data-st="${st}" href="#start" data-crumb-st="${st}" title="Alleen de tools van deze fase laten zien">${STAGE_NAME[st]}</a>`);
    if(g&&GFIRST[g]) bits.push(`<a href="#start" data-crumb-grp="${esc(GFIRST[g])}">${esc(g)}</a>`);
    bits.push(`<span aria-current="page">${esc(nm)}</span>`);
    h2.insertAdjacentHTML('beforebegin',`<nav class="lk-crumb" aria-label="Kruimelpad">${bits.join('<i aria-hidden="true">›</i>')}</nav>`); }); }
document.addEventListener('click',e=>{
  const s=e.target.closest('[data-crumb-st]'); if(s){ stageSet(s.dataset.crumbSt); return; }
  const g=e.target.closest('[data-crumb-grp]'); if(!g) return; const first=g.dataset.crumbGrp;
  const tile=()=>$$('#bento-rest > .tile').find(x=>x.querySelector(`.tl a[href="#${first}"]`));
  setTimeout(()=>{ let t=tile();
    if(!t&&stageCur()){ stageSet(''); setTimeout(()=>{ const u=tile(); if(u){ u.scrollIntoView({behavior:'smooth',block:'center'}); u.classList.add('lk-hl'); setTimeout(()=>u.classList.remove('lk-hl'),1600); } },80); return; } /* de gekozen fase verbergt deze groep: dan alle fasen laten zien; Vue tekent de tegels pas op de volgende tick */
    if(!t) return;
    t.scrollIntoView({behavior:'smooth',block:'center'}); t.classList.add('lk-hl'); setTimeout(()=>t.classList.remove('lk-hl'),1600); },140); });

/* alles hierboven ook als globale naam, live (zie src/lib/global.js) */
live({
  STAGE_DEF: () => STAGE_DEF,
  STAGE_NONE: () => STAGE_NONE,
  STAGES: () => STAGES,
  STAGE_NAME: () => STAGE_NAME,
  stagesOf: () => stagesOf,
  stageHas: () => stageHas,
  STKEY: () => STKEY,
  stageCur: () => stageCur,
  stageMark: [() => stageMark, v => { stageMark = v; }],
  stageSet: [() => stageSet, v => { stageSet = v; }],
  navStageApply: [() => navStageApply, v => { navStageApply = v; }]
});
