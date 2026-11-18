/* ================= INGANG VAN DE VUE-BUNDEL =================
   Vite bundelt dit tot build/app.bundle.js (één IIFE, geen losse bestanden), en
   tools/insert_tools.py zet die bundel in web/index.html op de plek waar de Vue-modules
   eerder stonden. Daardoor blijft index.html één bestand dat vanaf file:// werkt.

   De bundel loopt in dezelfde globale omgeving als de rest van de app en gebruikt de
   bestaande helpers (trPlain, num, fmt, vol, sig, note, kv, chart, calc en zo verder) gewoon
   als globale namen. Dat is geen toeval maar de afspraak: de tools die nog niet op Vue staan
   gebruiken die helpers ook, en ze hoeven niet twee keer te bestaan.

   De volgorde hieronder is de volgorde waarin de tools zich opzetten; elke tool zoekt zijn
   eigen host (#sf-app, #pk-app, #zp-app, #dg-app) in de pagina. */
import './lib/bridge.js';
import './tools/sigfig.js';
import './tools/zprime.js';
import './tools/pipkeus.js';
import './tools/digest.js';
