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
    /* Staat er geen vertaling tegenover de tekst (en in het Nederlands is dat altijd), dan
       haalt i18nStrip() de markeringen van uv() weg; in het Engels gaan de getallen daar nog
       wel door, want anders blijft een samengestelde regel zonder sleutel met komma's staan.
       Dat deed de DOM-laag ook: trPlain() zet de getallen om als hij de sleutel niet vindt. */
    app.config.globalProperties.tHtml = h => {
      if (LANG !== 'en' || typeof i18nLook !== 'function') return i18nStrip(h);
      const r = i18nLook(h); return r ? r.out : lkNumHtml(i18nStrip(h));
    };
    app.config.globalProperties.uv = uv;
    app.config.globalProperties.esc = esc;
    app.config.errorHandler = (err, inst, info) => { console.error('Vue-fout in ' + sel, info, err); };
    lkUiInstall(app);   /* de gedeelde componenten, zie lib/ui.js */
    const vm = app.mount(host);
    /* eerst de standaardwaarden vastleggen, dan de bewaarde invoer terugzetten: wat hierna
       binnenkomt hoort als "veranderd" te gelden */
    lkMarkDefaults(host);
    restoreInputs(host);
    return {app, vm};
  } catch (e) { console.error('Vue kon ' + sel + ' niet opzetten', e); return null; }
}

/* De laag "Meer instellingen" (xpChanged in web/index.html) en de invoeropslag vergelijken een
   veld met zijn standaardwaarde: defaultValue, defaultChecked of de optie met defaultSelected.
   Die komen uit de HTML, en Vue zet alleen de eigenschap, dus zonder dit zou elk veld van een
   Vue-tool als "veranderd" gelden en zou een geavanceerd veld nooit verborgen worden. Wat de
   component bij het opzetten neerzet is hier de standaard; een waarde die daarna binnenkomt
   (een deellink, de geschiedenis) geldt dus wel als veranderd, en dat hoort ook. */
function lkMarkDefaults(host) {
  host.querySelectorAll('input,textarea,select').forEach(el => {
    if (el.tagName === 'SELECT') {
      const o = el.options[el.selectedIndex];
      if (o) o.defaultSelected = true;
    } else if (el.type === 'checkbox' || el.type === 'radio') {
      el.defaultChecked = el.checked;
    } else {
      el.defaultValue = el.value;
    }
  });
}

/* De invoeropslag (restore() in web/index.html) zet bij het laden de bewaarde waarden terug,
   maar dat gebeurt voordat de bundel de velden van een Vue-tool aanmaakt. Daarom zet de host
   ze hier na het mounten zelf terug, met de events waar v-model op reageert. Keuzelijsten
   eerst: een keuze kan een ander veld vullen (een buffer vult het pKₐ-veld), en wat de
   gebruiker daarna zelf intypte moet blijven staan. */
function restoreInputs(host) {
  if (typeof storeGet !== 'function' || typeof persistable !== 'function') return;
  const s = storeGet();
  const els = [...host.querySelectorAll('input,select,textarea')]
    .filter(el => persistable(el) && Object.prototype.hasOwnProperty.call(s, el.id));
  els.sort((a, b) => (b.tagName === 'SELECT') - (a.tagName === 'SELECT'));
  for (const el of els) {
    const v = s[el.id];
    if (el.type === 'checkbox') el.checked = !!v; else el.value = v;
    el.dispatchEvent(new Event('input', {bubbles: true}));
    el.dispatchEvent(new Event('change', {bubbles: true}));
  }
}

/* Een getal in de taal van de gebruiker zetten. De vertaallaag deed dat zelf voor gewone
   invoervelden (i18nValue) en voor tekst (trPlain), maar binnen een Vue-boom komt hij niet.
   In het Nederlands staat het al goed, dus dan blijft de tekst zoals hij is. */
export const lkNumIn = v => (LANG === 'en' && typeof i18nNum === 'function'
  ? String(v).replace(/\d+(?:[.,]\d+)*/g, m => i18nNum(m)) : String(v));

/* De knoppenbalk onder een tekening, zoals picBar() in tools/nt/01_pic.js hem maakt. Die
   balken worden bij het opstarten één keer in de pagina gezet, dus een Vue-tool die zijn
   tekening zelf rendert maakt hem hier en vertaalt de teksten zelf: de vertaallaag van de DOM
   komt niet in een Vue-boom. */
export const lkPicBar = key => {
  const t = s => (typeof trPlain === 'function' ? trPlain(s) : s);
  return `<button type="button" data-png="${key}">PNG</button>`
    + `<button type="button" data-svg="${key}">SVG</button>`
    + `<button type="button" data-copy="${key}">${t('Kopieer afbeelding')}</button>`
    + `<button type="button" data-picprint="${key}">${t('Afdrukken')}</button>`;
};

/* Hetzelfde voor een stukje HTML: alleen de tekst tussen de tags gaat erdoor, want in een
   attribuut (style="font-weight:400") staan ook getallen en die horen te blijven. */
export const lkNumHtml = h => (LANG !== 'en' ? String(h)
  : String(h).split(/(<[^>]*>)/).map(p => (p.charAt(0) === '<' ? p : lkNumIn(p))).join(''));
