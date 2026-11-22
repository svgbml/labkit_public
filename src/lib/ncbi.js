/* ================= ONLINE OPZOEKEN BIJ NCBI (S195) =================
   Eén schakelaar, standaard uit. Staat hij uit, dan gaat er geen enkel verzoek de deur uit.
   Een verzoek gaat rechtstreeks naar de E-utilities van NCBI (die sturen
   Access-Control-Allow-Origin: *) en draagt alleen wat er gevraagd wordt plus tool=labkit.
   Een e-mailadres gaat alleen mee als de gebruiker het zelf heeft ingetypt.

   De instellingen staan in localStorage onder lk-ncbi, niet in de invoeropslag: de velden
   hebben geen id, zodat een gedeelde link of ongedaan maken de schakelaar en het adres nooit
   meeneemt. De foutmeldingen zijn Nederlandse vertaalsleutels; de component zet ze om met t(). */
import {reactive} from 'vue';
import {expose} from './global.js';

const KEY = 'lk-ncbi';
const BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';
const TIMEOUT = 20000;

export const ncbi = reactive(Object.assign({on: false, email: ''}, jget(KEY, {})));
export const ncbiSave = () => jset(KEY, {on: !!ncbi.on, email: String(ncbi.email || '').trim()});

export class NcbiError extends Error {
  /* kind: off, offline, blocked, down; msg is de vertaalsleutel */
  constructor(kind, msg) { super(msg); this.kind = kind; }
}

export function ncbiUrl(util, params) {
  const p = new URLSearchParams(params), mail = String(ncbi.email || '').trim();
  p.set('tool', 'labkit');
  if (mail) p.set('email', mail);
  return BASE + util + '.fcgi?' + p;
}

/* De drie manieren waarop het mis kan gaan, in gewone taal (idee #386) */
function failed(timeout) {
  if (timeout) return new NcbiError('down', 'NCBI antwoordde niet binnen 20 seconden. Probeer het later opnieuw, of plak de sequentie zelf.');
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return new NcbiError('offline', 'Geen internetverbinding. Plak de sequentie zelf, of probeer het opnieuw zodra je online bent.');
  if (location.protocol === 'file:') return new NcbiError('blocked', 'NCBI is niet bereikbaar. Sommige browsers laten vanuit een lokaal bestand geen online verzoeken toe: gebruik dan de online versie of het Windows-programma, of plak de sequentie zelf.');
  return new NcbiError('blocked', 'NCBI is niet bereikbaar: geen verbinding, of de browser, een firewall of een extensie hield het verzoek tegen. Plak de sequentie zelf, of probeer het later opnieuw.');
}

/* Haalt util (esummary, efetch, …) op en geeft de tekst terug, of JSON bij retmode=json. */
export async function ncbiGet(util, params) {
  if (!ncbi.on) throw new NcbiError('off', 'Online opzoeken staat uit. Zet het aan bij Instellingen.');
  const ac = new AbortController(), timer = setTimeout(() => ac.abort(), TIMEOUT);
  let r;
  try { r = await fetch(ncbiUrl(util, params), {signal: ac.signal, credentials: 'omit', referrerPolicy: 'no-referrer'}); }
  catch (e) { throw failed(e && e.name === 'AbortError'); }
  finally { clearTimeout(timer); }
  if (r.status === 429) throw new NcbiError('down', 'NCBI krijgt te veel verzoeken tegelijk. Wacht even en probeer het opnieuw.');
  if (!r.ok) throw new NcbiError('down', 'NCBI gaf een fout (HTTP ' + r.status + '). Probeer het later opnieuw, of plak de sequentie zelf.');
  const txt = await r.text();
  if (params.retmode !== 'json') return txt;
  try { return JSON.parse(txt); }
  catch (e) { throw new NcbiError('down', 'NCBI stuurde een antwoord dat LabKit niet kan lezen. Probeer het later opnieuw.'); }
}

expose({ncbi, ncbiGet});
