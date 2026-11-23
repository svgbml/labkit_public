/* ================= ONLINE OPZOEKEN BIJ NCBI (S195) =================
   Eén schakelaar, standaard uit. Staat hij uit, dan gaat er geen enkel verzoek de deur uit.
   Een verzoek gaat rechtstreeks naar de E-utilities van NCBI (die sturen
   Access-Control-Allow-Origin: *) en draagt alleen wat er gevraagd wordt plus tool=labkit.
   Een e-mailadres gaat alleen mee als de gebruiker het zelf heeft ingetypt.

   De instellingen staan in localStorage onder lk-ncbi, niet in de invoeropslag: de velden
   hebben geen id, zodat een gedeelde link of ongedaan maken de schakelaar en het adres nooit
   meeneemt. Een API-sleutel van NCBI (ook zelf ingetypt) staat daar ook.

   Cache en wachtrij (S198): elk antwoord blijft in localStorage onder lk-ncbi-cache, zodat
   dezelfde vraag daarna geen verzoek meer geeft, ook niet met de schakelaar uit. Nieuwe
   verzoeken gaan op een rij met ten minste 1/3 s ertussen (1/10 s met een sleutel), de grens
   die NCBI stelt. De foutmeldingen zijn Nederlandse vertaalsleutels; de component zet ze om met t(). */
import {reactive} from 'vue';
import {expose} from './global.js';

const KEY = 'lk-ncbi';
const BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';
const TIMEOUT = 20000;

const CKEY = 'lk-ncbi-cache';
const CMAX = 2e6;   /* tekens; localStorage houdt er zo'n 5 miljoen per site */

export const ncbi = reactive(Object.assign({on: false, email: '', key: ''}, jget(KEY, {})));
export const ncbiSave = () => jset(KEY, {on: !!ncbi.on, email: String(ncbi.email || '').trim(), key: String(ncbi.key || '').trim()});

export class NcbiError extends Error {
  /* kind: off, offline, blocked, down; msg is de vertaalsleutel */
  constructor(kind, msg) { super(msg); this.kind = kind; }
}

export function ncbiUrl(util, params) {
  const p = new URLSearchParams(params), mail = String(ncbi.email || '').trim();
  p.set('tool', 'labkit');
  if (mail) p.set('email', mail);
  if (String(ncbi.key || '').trim()) p.set('api_key', String(ncbi.key).trim());
  return BASE + util + '.fcgi?' + p;
}

/* De drie manieren waarop het mis kan gaan, in gewone taal (idee #386) */
function failed(timeout) {
  if (timeout) return new NcbiError('down', 'NCBI antwoordde niet binnen 20 seconden. Probeer het later opnieuw, of plak de sequentie zelf.');
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return new NcbiError('offline', 'Geen internetverbinding. Plak de sequentie zelf, of probeer het opnieuw zodra je online bent.');
  if (location.protocol === 'file:') return new NcbiError('blocked', 'NCBI is niet bereikbaar. Sommige browsers laten vanuit een lokaal bestand geen online verzoeken toe: gebruik dan de online versie of het Windows-programma, of plak de sequentie zelf.');
  return new NcbiError('blocked', 'NCBI is niet bereikbaar: geen verbinding, of de browser, een firewall of een extensie hield het verzoek tegen. Plak de sequentie zelf, of probeer het later opnieuw.');
}

/* ---- cache: sleutel is de vraag zonder tool, e-mail of sleutel ---- */
const cacheKey = (util, params) => util + '?' + new URLSearchParams(params);
export const ncbiCache = () => jget(CKEY, {});
export const ncbiStat = reactive({n: Object.keys(ncbiCache()).length});   /* voor de teller in Instellingen */
function cachePut(k, v) {
  const c = ncbiCache(); c[k] = {t: Date.now(), v};
  /* de oudste antwoorden gaan eruit als het te groot wordt; het nieuwste blijft altijd */
  const old = Object.keys(c).sort((a, b) => c[a].t - c[b].t);
  while (old.length > 1 && JSON.stringify(c).length > CMAX) delete c[old.shift()];
  jset(CKEY, c); ncbiStat.n = Object.keys(c).length;
}
export const ncbiCacheClear = () => { jset(CKEY, {}); ncbiStat.n = 0; };

/* ---- offline pakket (S201): de cache als JSON-bestand, om in een lokaal zonder internet terug te zetten ----
   Alleen de vragen (zonder tool, e-mail of sleutel) en de antwoorden; terugzetten voegt toe aan wat er al is.
   Met de schakelaar uit antwoordt ncbiGet() dan uit het pakket. */
const PACK = 'labkit-ncbi-pack';
export const ncbiPack = () => ({format: PACK, version: 1, made: new Date().toISOString().slice(0, 10), entries: ncbiCache()});
/* tekst of object → {ok, n (aantal antwoorden), err (vertaalsleutel)} */
export function ncbiUnpack(src) {
  let o;
  try { o = typeof src === 'string' ? JSON.parse(src) : src; } catch (e) { return {ok: false, err: 'Dit bestand is geen geldige JSON.'}; }
  if (!o || o.format !== PACK || !o.entries || typeof o.entries !== 'object') return {ok: false, err: 'Dit bestand is geen offline pakket van LabKit.'};
  const c = ncbiCache(), ks = Object.keys(o.entries).filter(k => /^e\w+\?/.test(k) && o.entries[k] && 'v' in o.entries[k]);
  ks.forEach(k => { c[k] = {t: +o.entries[k].t || Date.now(), v: o.entries[k].v}; });
  jset(CKEY, c); ncbiStat.n = Object.keys(c).length;
  return {ok: true, n: ks.length};
}

/* ---- wachtrij: elk verzoek krijgt een eigen tijdslot ---- */
let nextSlot = 0;
function slot() {
  const now = Date.now(), at = Math.max(now, nextSlot);
  nextSlot = at + (String(ncbi.key || '').trim() ? 100 : 334);
  return at > now ? new Promise(res => setTimeout(res, at - now)) : Promise.resolve();
}
const pending = new Map();   /* dezelfde vraag twee keer tegelijk: één verzoek */

/* Haalt util (esummary, efetch, …) op en geeft de tekst terug, of JSON bij retmode=json.
   Eerst uit de cache; alleen bij een nieuwe vraag en met de schakelaar aan gaat er iets weg. */
export function ncbiGet(util, params) {
  const k = cacheKey(util, params), c = ncbiCache();
  if (k in c) return Promise.resolve(c[k].v);
  if (!ncbi.on) return Promise.reject(new NcbiError('off', 'Online opzoeken staat uit. Zet het aan bij Instellingen.'));
  /* een 429 (te veel verzoeken; NCBI doet dat soms al onder 3 per seconde) wordt één keer opnieuw geprobeerd, na 1,5 s (S200) */
  const once = () => slot().then(() => request(util, params));
  if (!pending.has(k)) pending.set(k, once().catch(e => e.busy ? new Promise(r => setTimeout(r, 1500)).then(once) : Promise.reject(e)).then(v => { if (!(v && v.error)) cachePut(k, v); return v; }).finally(() => pending.delete(k)));
  return pending.get(k);
}

async function request(util, params) {
  const ac = new AbortController(), timer = setTimeout(() => ac.abort(), TIMEOUT);
  let r;
  try { r = await fetch(ncbiUrl(util, params), {signal: ac.signal, credentials: 'omit', referrerPolicy: 'no-referrer'}); }
  catch (e) { throw failed(e && e.name === 'AbortError'); }
  finally { clearTimeout(timer); }
  if (r.status === 429) throw Object.assign(new NcbiError('down', 'NCBI krijgt te veel verzoeken tegelijk. Wacht even en probeer het opnieuw.'), {busy: true});
  if (!r.ok) throw new NcbiError('down', 'NCBI gaf een fout (HTTP ' + r.status + '). Probeer het later opnieuw, of plak de sequentie zelf.');
  const txt = await r.text();
  if (params.retmode !== 'json') return txt;
  try { return JSON.parse(txt); }
  catch (e) { throw new NcbiError('down', 'NCBI stuurde een antwoord dat LabKit niet kan lezen. Probeer het later opnieuw.'); }
}

expose({ncbi, ncbiGet, ncbiCache, ncbiCacheClear, ncbiPack, ncbiUnpack});
