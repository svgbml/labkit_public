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
import Verdunning from './tools/Verdunning.vue';
import Osmo from './tools/Osmo.vue';
import {gfRefresh} from './tools/gelfoto/tick.js';
import GfImage from './tools/gelfoto/GfImage.vue';
import GfLadder from './tools/gelfoto/GfLadder.vue';
import GfDens from './tools/gelfoto/GfDens.vue';
import GfMarks from './tools/gelfoto/GfMarks.vue';
import GfFormat from './tools/gelfoto/GfFormat.vue';

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

/* De gelfoto-editor gaat in stukken om: de velden en de uitkomsten eerst (S225), de
   laanbewerking en de ladderlabels daarna (S226). Het beeldwerk (gfProc, gfRender, de
   detectie en het slepen) blijft in web/index.html, want dat rekent met canvassen en staat
   daar achter de validatiegevallen van de editor.

   Elke component zit op zijn eigen host binnen de panelen; wat nog gewone HTML is (de
   lanentabel, de bandentabel en "ladder uit een foto") houdt daardoor zijn vertaling uit de
   DOM-laag. window.__gfRefresh laat de motor ze alle vijf bijwerken: gf is geen reactief
   object, dus Vue ziet een verandering erin niet zelf. */
window.__gfRefresh = gfRefresh;
mountTool('#gf-app-img', GfImage);
mountTool('#gf-app-lad', GfLadder);
mountTool('#gf-app-dens', GfDens);
mountTool('#gf-app-marks', GfMarks);
mountTool('#gf-app-fmt', GfFormat);
/* calc.gelfoto blijft gfUpdate() in index.html: dat leest de velden en tekent opnieuw. */

