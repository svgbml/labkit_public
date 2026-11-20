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
import Cdna from './tools/Cdna.vue';
import Gradient from './tools/Gradient.vue';
import Pcr from './tools/Pcr.vue';
import Rnaq from './tools/Rnaq.vue';
import Melt from './tools/Melt.vue';

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

mountTool('#cd-app', Cdna, {pip: 'cdna'});
calc.cdna = () => {};

const gr = mountTool('#gr-app', Gradient);
calc.gradient = () => { if (gr && gr.vm) gr.vm.draw(); };

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
