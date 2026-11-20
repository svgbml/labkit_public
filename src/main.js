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
import Verdunning from './tools/Verdunning.vue';
import Osmo from './tools/Osmo.vue';

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
