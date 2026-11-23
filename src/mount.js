/* ================= DE COMPONENTEN OP HUN HOST =================
   Elke tool heeft een eigen host in de pagina (src/shell/sections/), bij de kop en de bronregel
   die gewone HTML blijven. calc[tool] blijft bestaan omdat de rest van de app dat aanroept na het
   delen van een link, ongedaan maken en bij het openen; een component rekent zelf opnieuw. */
import {mountTool} from './lib/bridge.js';
import Sigfig from './tools/Sigfig.vue';
import Zprime from './tools/Zprime.vue';
import Pipkeus from './tools/Pipkeus.vue';
import Digest from './tools/Digest.vue';
import Phadj from './tools/Phadj.vue';
import Medium from './tools/Medium.vue';
import Oplossing from './tools/Oplossing.vue';
import Bufcap from './tools/Bufcap.vue';
import Ksp from './tools/Ksp.vue';
import Km from './tools/Km.vue';
import Roc from './tools/Roc.vue';
import Bland from './tools/Bland.vue';
import Westgard from './tools/Westgard.vue';
import Mval from './tools/Mval.vue';
import Munc from './tools/Munc.vue';
import Pipcal from './tools/Pipcal.vue';
import Verdunning from './tools/Verdunning.vue';
import Osmo from './tools/Osmo.vue';
import Reeks from './tools/Reeks.vue';
import Facs from './tools/Facs.vue';
import Transfect from './tools/Transfect.vue';
import Mic from './tools/Mic.vue';
import Groei from './tools/Groei.vue';
import Cdna from './tools/Cdna.vue';
import Gradient from './tools/Gradient.vue';
import Pcr from './tools/Pcr.vue';
import Rnaq from './tools/Rnaq.vue';
import Melt from './tools/Melt.vue';
import Sds from './tools/Sds.vue';
import Ligatie from './tools/Ligatie.vue';
import Wb from './tools/Wb.vue';
import Oligo from './tools/Oligo.vue';
import Titr from './tools/Titr.vue';
import Hh from './tools/Hh.vue';
import Edta from './tools/Edta.vue';
import Molm from './tools/Molm.vue';
import Kjel from './tools/Kjel.vue';
import Units from './tools/Units.vue';
import Enzym from './tools/Enzym.vue';
import Curve from './tools/Curve.vue';
import Elisa from './tools/Elisa.vue';
import Istd from './tools/Istd.vue';
import Purif from './tools/Purif.vue';
import Chrom from './tools/Chrom.vue';
import Spec from './tools/Spec.vue';
import Ic50 from './tools/Ic50.vue';
import Start from './tools/Start.vue';
import Settings from './tools/Settings.vue';
import Telkamer from './tools/Telkamer.vue';
import Passage from './tools/Passage.vue';
import Desinf from './tools/Desinf.vue';
import Steril from './tools/Steril.vue';
import Gcomp from './tools/Gcomp.vue';
import Viab from './tools/Viab.vue';
import Seed from './tools/Seed.vue';
import Mpn from './tools/Mpn.vue';
import Inoc from './tools/Inoc.vue';
import Micro from './tools/Micro.vue';
import Teller from './tools/Teller.vue';
import Transf from './tools/Transf.vue';
import Pcrcyclus from './tools/Pcrcyclus.vue';
import Dna from './tools/Dna.vue';
import Gel from './tools/Gel.vue';
import Qplate from './tools/Qplate.vue';
import Qpcr from './tools/Qpcr.vue';
import Widmark from './tools/Widmark.vue';
import Mix from './tools/Mix.vue';
import Ento from './tools/Ento.vue';
import Stature from './tools/Stature.vue';
import Glass from './tools/Glass.vue';
import Strchk from './tools/Strchk.vue';
import Bpa from './tools/Bpa.vue';
import Pmi from './tools/Pmi.vue';
import Kin from './tools/Kin.vue';
import Hwe from './tools/Hwe.vue';
import Rmp from './tools/Rmp.vue';
import Ystr from './tools/Ystr.vue';
import Plasmid from './tools/Plasmid.vue';
import Aln from './tools/Aln.vue';
import Seq from './tools/Seq.vue';
import Sanger from './tools/Sanger.vue';
import Pipetteer from './tools/Pipetteer.vue';
import PcrProgramma from './tools/PcrProgramma.vue';
import Verdunningsschema from './tools/Verdunningsschema.vue';
import Kleuringsschema from './tools/Kleuringsschema.vue';
import Planner from './tools/Planner.vue';
import Bench from './tools/Bench.vue';
import Rapport from './tools/Rapport.vue';
import Centrifuge from './tools/Centrifuge.vue';
import Timers from './tools/Timers.vue';
import Plaatindeling from './tools/Plaatindeling.vue';
import Stat from './tools/Stat.vue';
import Gelplan from './tools/Gelplan.vue';
import {gfRefresh} from './tools/gelfoto/tick.js';
import GfGuide from './tools/gelfoto/GfGuide.vue';
import GfHistory from './tools/gelfoto/GfHistory.vue';
import GfAnnot from './tools/gelfoto/GfAnnot.vue';
import GfImage from './tools/gelfoto/GfImage.vue';
import GfLibrary from './tools/gelfoto/GfLibrary.vue';
import GfLanes from './tools/gelfoto/GfLanes.vue';
import GfLadder from './tools/gelfoto/GfLadder.vue';
import GfDens from './tools/gelfoto/GfDens.vue';
import GfBands from './tools/gelfoto/GfBands.vue';
import GfVirtual from './tools/gelfoto/GfVirtual.vue';
import GfMarks from './tools/gelfoto/GfMarks.vue';
import GfResult from './tools/gelfoto/GfResult.vue';
import GfFormat from './tools/gelfoto/GfFormat.vue';

/* start() zet alle componenten op hun host. src/legacy/init.js roept het aan, na alle oude
   modules en vóór buildReeks(): op die plek stond de bundel tot S267, zodat calc[tool] en de
   haken op window in dezelfde volgorde gezet worden als voorheen. */
let started = false;
export function start() {
  if (started) return;
  started = true;

  mountTool('#sf-app', Sigfig);
  calc.sigfig = () => {};

  const zp = mountTool('#zp-app', Zprime);
  calc.zprime = () => { if (zp && zp.vm) zp.vm.draw(); };

  mountTool('#pk-app', Pipkeus);
  calc.pipkeus = () => {};

  mountTool('#dg-app', Digest);
  mountTool('#pl-app', Plasmid);
  calc.plasmid = () => {};
  mountTool('#al-app', Aln);
  calc.aln = () => {};
  mountTool('#sg-app', Sanger);
  calc.sanger = () => {};
  calc.digest = () => {};

  mountTool('#sq-app', Seq);
  calc.seq = () => {};

  mountTool('#pa-app', Phadj);
  calc.phadj = () => {};

  mountTool('#md-app', Medium);
  calc.medium = () => {};

  /* Oplossing & buffer houdt de rijen van #o-tbl bij. web/index.html heeft die component nodig:
     loadRecipe() zet er een recept in, en TBLDEF['o-tbl'] zet er een opgeslagen tabel in terug of
     duwt er een rij uit het molmassa-gereedschap in. Daarom staat de instantie op window. */
  const op = mountTool('#o-app', Oplossing);
  if (op) window.__oplosVm = op.vm;

  /* Buffercapaciteit tekent een curve, dus calc.bufcap() laat de component opnieuw tekenen;
     Oplosbaarheid heeft geen tekening en rekent zelf al opnieuw. */
  const bc = mountTool('#bc-app', Bufcap);
  calc.bufcap = () => { if (bc && bc.vm) bc.vm.draw(); };

  mountTool('#ks-app', Ksp);
  calc.ksp = () => {};

  mountTool('#d-app', Verdunning);
  calc.verdunning = () => {};

  mountTool('#os-app', Osmo);
  calc.osmo = () => {};

  /* Verdunningsreeks & KVE: de tellingen staan in de globale reeksCounts (bewaard door tblSnap(),
     gezet door tests/validate.py), en buildReeks() in web/index.html laadt ze via deze instantie. */
  const rk = mountTool('#r-app', Reeks);
  if (rk) window.__reeksVm = rk.vm;
  calc.reeks = () => {};

  /* Flowcytometrie: de antilichamentabel (fc-tbl) en de uitkomst zitten in de component. */
  mountTool('#fc-app', Facs);
  calc.facs = () => {};

  /* Transfectie (Lipofectamine 3000): de velden en de uitkomst zitten in de component. */
  mountTool('#trf-app', Transfect);
  calc.transfect = () => {};

  /* Antibiotica-gevoeligheid: beide tabellen (mi-tbl, mz-tbl) en de uitkomsten zitten in de component. */
  mountTool('#mi-app', Mic);
  calc.mic = () => {};

  /* Groeicurve: de metingen (gc-tbl), de velden en de uitkomst zitten in de component. De tekening
     blijft met chart() gemaakt, dus calc.groei() laat de component opnieuw tekenen. */
  const gr = mountTool('#g2-app', Groei);
  calc.groei = () => { if (gr && gr.vm) gr.vm.draw(); };

  mountTool('#cd-app', Cdna, {pip: 'cdna'});
  calc.cdna = () => {};

  const grd = mountTool('#gr-app', Gradient);
  calc.gradient = () => { if (grd && grd.vm) grd.vm.draw(); };

  /* PCR-mastermix: de tabel heeft berekende kolommen en is dus geen lk-etable. TBLDEF['q-tbl'] in
     web/index.html zet, duwt en leest rijen via window.__pcrVm. calc.pcr() laat de buizenrek
     opnieuw tekenen (taal, thema). */
  const pc = mountTool('#q-app', Pcr, {pip: 'pcr'});
  if (pc) window.__pcrVm = pc.vm;
  calc.pcr = () => { if (pc && pc.vm) pc.vm.draw(); };

  mountTool('#rq-app', Rnaq);
  calc.rnaq = () => {};

  /* qPCR-smeltcurve tekent −dF/dT met chart(); calc.melt() laat de tekening opnieuw maken
     (taal, thema). */
  const ml = mountTool('#ml-app', Melt);
  calc.melt = () => { if (ml && ml.vm) ml.vm.draw(); };

  /* SDS-PAGE monsters en Ligatie: pip houdt de pipetteergrens (pipScan) werkend na elke render.
     De monstertabel van SDS is een lk-etable (TBLDEF['ss-tbl'] met set/push/get/blank). */
  mountTool('#ss-app', Sds, {pip: 'sds'});
  calc.sds = () => {};

  mountTool('#l-app', Ligatie, {pip: 'ligatie'});
  calc.ligatie = () => {};

  /* Western blot-normalisatie en Primers oplossen: beide tabellen hebben een eigen <table> met
     haken op TBLDEF in web/index.html (via window.__wbVm en window.__olVm). calc.wb() laat de
     grafiek opnieuw tekenen (taal, thema, verslag-PNG). Primers oplossen houdt de pipetteergrens
     (pipScan) via {pip: 'oligo'}. */
  const wbm = mountTool('#wb-app', Wb);
  if (wbm) window.__wbVm = wbm.vm;
  calc.wb = () => { if (wbm && wbm.vm) wbm.vm.draw(); };

  const olm = mountTool('#ol-app', Oligo, {pip: 'oligo'});
  if (olm) window.__olVm = olm.vm;
  calc.oligo = () => {};
  /* Titratiecurve tekent een curve, dus calc.titr() laat de component opnieuw tekenen. */
  const ti = mountTool('#ti-app', Titr);
  calc.titr = () => { if (ti && ti.vm) ti.vm.draw(); };

  mountTool('#hh-app', Hh);
  calc.hh = () => {};

  mountTool('#ed-app', Edta);
  calc.edta = () => {};

  /* Molmassa: parseFormula() en ATOM blijven in web/index.html; de component roept ze aan. */
  mountTool('#mm-app', Molm);
  calc.molm = () => {};

  mountTool('#kj-app', Kjel);
  calc.kjel = () => {};

  mountTool('#un-app', Units);
  calc.units = () => {};

  /* Enzymkinetiek tekent een grafiek, dus calc.enzym() laat de component opnieuw tekenen. mmFit()
     blijft in web/index.html. De tabel #k-tbl is een <lk-etable> en zet zelf TBLDEF['k-tbl']. */
  const en = mountTool('#en-app', Enzym);
  calc.enzym = () => { if (en && en.vm) en.vm.draw(); };

  /* Standaardcurve tekent een grafiek, dus calc.curve() laat de component opnieuw tekenen. fitCurve()
     blijft in web/index.html. De tabellen #s-std en #s-unk zijn <lk-etable> met berekende kolommen. */
  const cu = mountTool('#cu-app', Curve);
  calc.curve = () => { if (cu && cu.vm) cu.vm.draw(); };

  /* ELISA tekent een curve op een canvas, dus calc.elisa() laat de component opnieuw tekenen. */
  const el = mountTool('#el-app', Elisa);
  calc.elisa = () => { if (el && el.vm) el.vm.draw(); };

  /* Interne standaard tekent een kalibratielijn, dus calc.istd() laat de component opnieuw tekenen. */
  const is_ = mountTool('#isd-app', Istd);
  calc.istd = () => { if (is_ && is_.vm) is_.vm.draw(); };

  /* Eiwitzuivering tekent een grafiek op een canvas, dus calc.purif() laat de component opnieuw tekenen. */
  const pf = mountTool('#pf-app', Purif);
  calc.purif = () => { if (pf && pf.vm) pf.vm.draw(); };

  /* Chromatografie tekent een chromatogram op een canvas, dus calc.chrom() laat de component opnieuw tekenen. */
  const chr = mountTool('#chr-app', Chrom);
  calc.chrom = () => { if (chr && chr.vm) chr.vm.draw(); };

  /* Spectrofotometrie rekent in de component zelf; calc.spec() hoeft niets te doen. */
  mountTool('#sp-app', Spec);
  calc.spec = () => {};

  /* Dosis-respons tekent een fit op een canvas, dus calc.ic50() laat de component opnieuw tekenen. */
  const ic = mountTool('#ic-app', Ic50);
  calc.ic50 = () => { if (ic && ic.vm) ic.vm.draw(); };
  /* Telkamer: de vakken van k-sq hangen van de kamer af; de component zet window.__telkamerVm
     zodat kSq() in web/index.html hem direct kan laten tekenen. */
  mountTool('#k-app', Telkamer);
  calc.telkamer = () => {};

  mountTool('#ps-app', Passage);
  calc.passage = () => {};

  mountTool('#ds-app', Desinf);
  calc.desinf = () => {};

  /* Sterilisatie tekent een overlevingscurve, dus calc.steril() laat de component opnieuw tekenen. */
  const st = mountTool('#ste-app', Steril);
  calc.steril = () => { if (st && st.vm) st.vm.draw(); };

  /* Groeicurves vergelijken tekent een grafiek, dus calc.gcomp() laat de component opnieuw tekenen. */
  const gc = mountTool('#gm-app', Gcomp);
  calc.gcomp = () => { if (gc && gc.vm) gc.vm.draw(); };

  mountTool('#vb-app', Viab);
  calc.viab = () => {};

  mountTool('#sd-app', Seed);
  calc.seed = () => {};

  mountTool('#mp-app', Mpn);
  calc.mpn = () => {};

  mountTool('#io-app', Inoc);
  calc.inoc = () => {};

  mountTool('#mc-app', Micro);
  calc.micro = () => {};

  /* Teller: de stand zit in de component. calc.teller() deed vroeger een nieuwe render, en die
     haalde de markering van het laatst getelde vak weg; dat doet hij nog steeds. */
  const tl = mountTool('#c-app', Teller);
  calc.teller = () => { if (tl && tl.vm) tl.vm.flash = -1; };
  mountTool('#tf-app', Transf);
  calc.transf = () => {};

  /* PCR-cyclus tekent het programma op een canvas, dus calc.pcrcyclus() laat de component opnieuw
     tekenen. De annealingtemperatuur staat op window.__pcrcVm.taAuto voor de knop in het
     PCR-programma (#pg-from). */
  const yc = mountTool('#y-app', Pcrcyclus);
  calc.pcrcyclus = () => { if (yc && yc.vm) yc.vm.draw(); };

  /* DNA-kwantificatie, met de forensische qPCR-kwantificatie (fq-*) als vierde paneel. */
  mountTool('#dna-app', Dna);
  calc.dna = () => {};

  /* Agarosegel & bandgrootte tekent de standaardcurve, dus calc.gel() laat de component opnieuw
     tekenen. LADDERS, LEX en GELR blijven globals in web/index.html (Gelplanner en Gelfoto). */
  const gl = mountTool('#g-app', Gel);
  calc.gel = () => { if (gl && gl.vm) gl.vm.draw(); };

  /* qPCR-plaatindeling: de plaatontwerper (#qp2-pld) is een DOM-widget buiten de Vue-boom en meldt
     wijzigingen via window.__qpVm.onPlate(); calc.qplate() laat de tekening opnieuw maken. */
  const qp = mountTool('#qp-app', Qplate);
  if (qp) window.__qpVm = qp.vm;
  calc.qplate = () => { if (qp && qp.vm) qp.vm.reflow(); };

  /* qPCR-analyse (ΔΔCt) tekent de staafgrafiek op een canvas, dus calc.qpcr() laat de component
     opnieuw tekenen. De Ct-tabel (qp-tbl) is een lk-etable die zelf op TBLDEF/ADDBTN staat. */
  const qc = mountTool('#qpc-app', Qpcr);
  if (qc) window.__qpcrVm = qc.vm;
  calc.qpcr = () => { if (qc && qc.vm) qc.vm.draw(); };
  /* Bloedalcohol tekent een curve; de component tekent zelf opnieuw na elke render. */
  const wd = mountTool('#wd-app', Widmark);
  calc.widmark = () => { if (wd && wd.vm) wd.vm.draw(); };

  mountTool('#mx-app', Mix);
  calc.mix = () => {};

  /* Entomologie tekent de opgebouwde graaddagen; de component tekent zelf opnieuw na elke render. */
  const ent = mountTool('#ent-app', Ento);
  calc.ento = () => { if (ent && ent.vm) ent.vm.draw(); };

  /* Lichaamslengte tekent de intervallen per bot; de component tekent zelf opnieuw na elke render. */
  const sl = mountTool('#sl-app', Stature);
  calc.stature = () => { if (sl && sl.vm) sl.vm.draw(); };

  /* Glasvergelijking tekent de metingen tegen het interval; de component tekent zelf opnieuw na elke render. */
  const gls = mountTool('#gl-app', Glass);
  calc.glass = () => { if (gls && gls.vm) gls.vm.draw(); };
  mountTool('#sc-app', Strchk);
  calc.strchk = () => {};

  /* Bloedvlekpatronen tekent op een canvas; calc.bpa() laat de component opnieuw tekenen */
  const bp = mountTool('#bp-app', Bpa);
  calc.bpa = () => { if (bp && bp.vm) bp.vm.draw(); };

  const pm = mountTool('#pm-app', Pmi);
  calc.pmi = () => { if (pm && pm.vm) pm.vm.draw(); };

  mountTool('#kn-app', Kin);
  calc.kin = () => {};

  mountTool('#hw-app', Hwe);
  calc.hwe = () => {};

  /* Forensische matchkans zet zelf TBLDEF['rm-tbl']: die tabel heeft een uitkomstkolom en is
     daarom geen lk-etable */
  mountTool('#rm-app', Rmp);
  calc.rmp = () => {};

  mountTool('#ys-app', Ystr);
  calc.ystr = () => {};
  /* Overlevingscurve tekent een curve, dus calc.km() laat de component opnieuw tekenen. */
  const km = mountTool('#km-app', Km);
  calc.km = () => { if (km && km.vm) km.vm.draw(); };

  /* ROC-curve en Bland-Altman tekenen ook een grafiek, dus calc.roc() en calc.bland() laten de
     component opnieuw tekenen. */
  const roc = mountTool('#ro-app', Roc);
  calc.roc = () => { if (roc && roc.vm) roc.vm.draw(); };

  const bland = mountTool('#ba-app', Bland);
  calc.bland = () => { if (bland && bland.vm) bland.vm.draw(); };

  /* Westgard / Levey-Jennings tekent een kaart, dus calc.westgard() laat de component opnieuw tekenen. */
  const westgard = mountTool('#wg-app', Westgard);
  calc.westgard = () => { if (westgard && westgard.vm) westgard.vm.draw(); };

  /* Methodevalidatie tekent de kalibratielijn, dus calc.mval() laat de component opnieuw tekenen. */
  const mval = mountTool('#mv-app', Mval);
  calc.mval = () => { if (mval && mval.vm) mval.vm.draw(); };

  /* Meetonzekerheid tekent balken, dus calc.munc() laat de component opnieuw tekenen;
     Pipetkalibratie heeft geen tekening en rekent zelf al opnieuw. */
  const munc = mountTool('#mu-app', Munc);
  calc.munc = () => { if (munc && munc.vm) munc.vm.draw(); };

  mountTool('#pc-app', Pipcal);
  calc.pipcal = () => {};
  /* Pipetteerschema tekent op #pp-cv (en het buizenrek op #ppr-cv) met de bestaande tekenfuncties;
     calc.ppip() laat de component rekenen en tekenen, want de invoer-events van de pagina, het
     terugzetten van een sessie en het exporteren van de tekening roepen dat aan. */
  const pp = mountTool('#pp-app', Pipetteer);
  calc.ppip = () => { if (pp && pp.vm) pp.vm.draw(); };

  /* PCR-programma tekent op #pg-cv met de bestaande tekenfuncties; calc.pprog() laat de component
     opnieuw tekenen. "Neem over uit PCR-cyclus" (#pg-from) leest window.__pcrcVm.taAuto van PCR-cyclus. */
  const pg = mountTool('#pg-app', PcrProgramma);
  calc.pprog = () => { if (pg && pg.vm) pg.vm.draw(); };

  /* Verdunningsschema tekent op #pv-cv met de bestaande tekenfuncties; calc.pverd() laat de
     component opnieuw tekenen (de invoer-events van de pagina en het exporteren roepen dat aan). */
  const pv = mountTool('#pv-app', Verdunningsschema);
  calc.pverd = () => { if (pv && pv.vm) pv.vm.draw(); };

  /* Kleuringsschema tekent op #stn-cv met de bestaande tekenfuncties; calc.stain() laat de
     component opnieuw tekenen (de invoer-events van de pagina en het exporteren roepen dat aan). */
  const stn = mountTool('#stn-app', Kleuringsschema);
  calc.stain = () => { if (stn && stn.vm) stn.vm.draw(); };

  /* Experimentplanner tekent op #xp-cv met de bestaande tekenfuncties; calc.plan() laat de
     component opnieuw tekenen. "Wachtstappen als timers" (#xp-tim) en het agendabestand (#xp-ics)
     zitten in de component. */
  const xp = mountTool('#xp-app', Planner);
  calc.plan = () => { if (xp && xp.vm) xp.vm.draw(); };

  /* Rapport / labjournaal: de bediening en de melding staan in de component; rpSection, rpDoc en
     rpPrint blijven globaal in tools/nt/62_report.js omdat ook "Afdrukken" bij elke tool ze
     aanroept. De component rekent zelf opnieuw. */
  mountTool('#rp-app', Rapport);
  calc.report = () => {};

  /* Centrifuge: de twee velden zijn elkaars uitkomst (rpm of × g, het laatst bewerkte veld telt);
     de component houdt dat zelf bij, dus calc.centrifuge() hoeft niets meer. */
  mountTool('#z-app', Centrifuge);
  calc.centrifuge = () => {};

  /* Timers: de timers zelf (lijst, tikken, piepen, bewaren, addTimer, tmAct) blijven in
     web/index.html, want ze lopen door in andere tools en de Experimentplanner voegt er toe. De
     component tekent formulier en rooster en wordt via window.__tmVm.tick bijgewerkt. */
  mountTool('#tm-app', Timers);
  calc.timers = () => {};

  /* Plaatindeling: de bediening zit in de component; de gedeelde plaatontwerper (#w-pld) en de
     tekening (#w-cv) komen uit src/engines/plate.js en worden in mounted() gebouwd.
     calc.plaat() (= plateImg()) staat in src/engines/plate.js. */
  mountTool('#w-app', Plaatindeling);
  /* Statistiek tekent bij de ANOVA staafjes, dus calc.stat() laat de component opnieuw tekenen;
     de rest van de uitkomst volgt uit de velden en rekent zichzelf opnieuw. */
  const sta = mountTool('#st-app', Stat);
  calc.stat = () => { if (sta && sta.vm) sta.vm.draw(); };

  /* De Gelplanner tekent twee gels; calc.gplan() laat de component opnieuw tekenen en daarmee
     ook de verwachte gel, de receptkaart en de looptijd uit tools/nt/48_gplan.js. */
  const gp = mountTool('#gp-app', Gelplan);
  calc.gplan = () => { if (gp && gp.vm) gp.vm.draw(); };
  /* De gelfoto-editor gaat in stukken om: de velden en de uitkomsten eerst (S225), de
     laanbewerking en de ladderlabels daarna (S226). Het beeldwerk (gfProc, gfRender, de
     detectie en het slepen) blijft in web/index.html, want dat rekent met canvassen en staat
     daar achter de validatiegevallen van de editor.

     Elke component zit op zijn eigen host binnen de panelen die de tool al had; de koppen van
     de panelen en de bronregel blijven gewone HTML. window.__gfRefresh laat de motor ze alle
     bijwerken: gf is geen reactief object, dus Vue ziet een verandering erin niet zelf. */
  window.__gfRefresh = gfRefresh;
  mountTool('#gf-app-guide', GfGuide);
  mountTool('#gf-app-hist', GfHistory);
  mountTool('#gf-app-img', GfImage);
  mountTool('#gf-app-lib', GfLibrary);
  mountTool('#gf-app-lanes', GfLanes);
  mountTool('#gf-app-annot', GfAnnot);
  mountTool('#gf-app-lad', GfLadder);
  mountTool('#gf-app-virt', GfVirtual);
  mountTool('#gf-app-dens', GfDens);
  mountTool('#gf-app-bands', GfBands);
  mountTool('#gf-app-marks', GfMarks);
  mountTool('#gf-app-res', GfResult);
  mountTool('#gf-app-fmt', GfFormat);
  /* calc.gelfoto blijft gfUpdate() in index.html: dat leest de velden en tekent opnieuw. */

  /* De app-schil (S263). De startpagina leest de navigatie, de fase, de favorieten en de werkstroom
     bij elke calc.start(): die roepen stageSet(), de sterren in de navigatie en het stoppen van een
     werkstroom al aan. Instellingen roept zelf applyUI() aan; calc.inst hoeft niets te doen. */
  const sp = mountTool('#bento', Start);
  calc.start = () => { if (sp && sp.vm) sp.vm.refresh(); };
  mountTool('#inst-app', Settings);
  calc.inst = () => {};

  /* Bench-modus (S48): geen tool maar een laag over de app; een tool opent hem met
     openBench({title, steps}), zie src/tools/Bench.vue. */
  const bn = mountTool('#bench-app', Bench);
  window.openBench = spec => { if (bn && bn.vm) bn.vm.open(spec); };
}
