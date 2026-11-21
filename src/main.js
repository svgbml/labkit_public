/* ================= INGANG VAN DE VUE-BUNDEL =================
   Vite bundelt dit tot build/app.bundle.js (één IIFE, geen losse bestanden), en
   tools/insert_tools.py zet die bundel in web/index.html op de plek waar de Vue-modules
   eerder stonden. Daardoor blijft index.html één bestand dat vanaf file:// werkt.

   De bundel loopt in dezelfde globale omgeving als de rest van de app en gebruikt de
   bestaande helpers (trPlain, num, fmt, vol, sig, note, kv, chart, calc en zo verder) gewoon
   als globale namen. Dat is geen toeval maar de afspraak: de tools die nog niet op Vue staan
   gebruiken die helpers ook, en ze hoeven niet twee keer te bestaan.

   Elke tool heeft een eigen host in de pagina, bij de kop en de bronregel die gewone HTML
   blijven. calc[tool] blijft bestaan omdat de rest van de app dat aanroept na het delen van
   een link, ongedaan maken en bij het openen; een component rekent zelf opnieuw. */
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

mountTool('#sf-app', Sigfig);
calc.sigfig = () => {};

const zp = mountTool('#zp-app', Zprime);
calc.zprime = () => { if (zp && zp.vm) zp.vm.draw(); };

mountTool('#pk-app', Pipkeus);
calc.pipkeus = () => {};

mountTool('#dg-app', Digest);
calc.digest = () => {};

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
