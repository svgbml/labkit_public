import {createApp} from 'vue';
import {lkUiInstall} from './ui.js';

/* ================= VUE-LAAG =================
   Labkit wordt stap voor stap op Vue 3 gezet. Vue komt uit npm en wordt door Vite in deze
   bundel meegenomen (zie vite.config.js): één IIFE-bestand zonder hash, dat
   tools/insert_tools.py in web/index.html zet. Zo blijft index.html één bestand dat vanaf
   file:// werkt, want ES-modules zijn daar geblokkeerd.

   ---- De vertaling ----
   De bestaande vertaallaag loopt met een MutationObserver door de DOM en herschrijft daar de
   tekst. Vue bezit zijn eigen DOM en zou die herschrijving bij elke render terugdraaien. Het
   deel dat Vue rendert krijgt daarom `data-notr`, waarmee de observer er vanaf blijft, en de
   component vertaalt zelf met `t()`.

   `t()` is `trPlain()`: precies dezelfde sleutels als de rest van de app, dus de hele
   woordenlijst in i18n/en.json blijft geldig. Een getal in de tekst wordt automatisch `{#}`,
   dus `t('Kies ' + n + ' cijfers')` zoekt de sleutel `Kies {#} cijfers` op en vult het getal
   in de taal van de gebruiker weer in. Tekst van de gebruiker zelf wordt met `uv()` gemarkeerd
   en blijft dan letterlijk staan.

   Omdat de observer niet in een Vue-boom kijkt, kan tests/i18n_collect.py daar niets vinden.
   tests/i18n_vue.py controleert daarom statisch dat elke `t('…')` in deze modules een sleutel
   in i18n/en.json heeft.

   ---- Wat hetzelfde blijft ----
   Een Vue-component houdt de element-id's van de tool aan. Daarmee blijven het delen van een
   link, ongedaan maken, de invoeropslag en tests/validate.py werken: die zetten `.value` en
   sturen een input- en change-event, en daar reageert v-model op.

   Mount alleen het bewerkbare deel van een tool, niet de hele sectie: de kop en de bronregel
   blijven gewone HTML, zodat hun bestaande vertaalsleutels blijven gelden. */

/* Vue komt nu uit npm en zit in deze bundel; vroeger stond hij als los bestand in
   web/vendor/ en kwam hij via een globale `Vue` binnen. */
const LKVUE = {createApp};

/* Zet een component op een host binnen een tool en geeft {app, vm} terug, of null als de host
   niet bestaat; in dat laatste geval blijft de rest van de app gewoon werken.

   Dit is het stuk dat niet in een component zelf kan: de hosts (#sf-app, #pk-app, #zp-app,
   #dg-app) staan in web/index.html bij de kop en de bronregel van de tool, de host moet
   `data-notr` krijgen zodat de vertaallaag van de DOM eraf blijft, en elke app heeft t(),
   tHtml() en de gedeelde componenten nodig. */
export function mountTool(sel, options) {
  const host = document.querySelector(sel);
  if (!host) { console.error('geen host voor ' + sel); return null; }
  host.setAttribute('data-notr', '');   /* Vue bezit deze DOM: de vertaallaag blijft eraf */
  try {
    const app = LKVUE.createApp(options);
    /* t(): platte tekst. De sleutel is de tekst met < en > als entiteit, net als bij een
       tekstknoop in de DOM-laag. */
    app.config.globalProperties.t = s => trPlain(s);
    /* tHtml(): tekst met inline opmaak erin (<b>, <span class="mono">, <sub>). De sleutel is
       dan de innerHTML zelf, precies zoals de DOM-laag een heel element opzoekt, dus de
       bestaande sleutels met tags erin blijven gelden. Houd één sleutel per zin: een zin in
       stukjes vertalen levert sleutels op die in geen enkele taal te maken zijn. */
    app.config.globalProperties.tHtml = h => {
      if (LANG !== 'en' || typeof i18nLook !== 'function') return h;
      const r = i18nLook(h); return r ? r.out : h;
    };
    app.config.globalProperties.uv = uv;
    app.config.globalProperties.esc = esc;
    app.config.errorHandler = (err, inst, info) => { console.error('Vue-fout in ' + sel, info, err); };
    lkUiInstall(app);   /* de gedeelde componenten, zie lib/ui.js */
    return {app, vm: app.mount(host)};
  } catch (e) { console.error('Vue kon ' + sel + ' niet opzetten', e); return null; }
}

/* Een getal in de taal van de gebruiker zetten. De vertaallaag deed dat zelf voor gewone
   invoervelden (i18nValue) en voor tekst (trPlain), maar binnen een Vue-boom komt hij niet.
   In het Nederlands staat het al goed, dus dan blijft de tekst zoals hij is. */
export const lkNumIn = v => (LANG === 'en' && typeof i18nNum === 'function'
  ? String(v).replace(/\d+(?:[.,]\d+)*/g, m => i18nNum(m)) : String(v));
