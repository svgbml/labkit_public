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
