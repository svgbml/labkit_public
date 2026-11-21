/* ================= FOUTENLOG (S137) =================
   Vangt scriptfouten en afgewezen promises op in een kleine ringbuffer, zodat de knop
   "Melden" (src/legacy/nt/99z_ux.js) ze in een foutrapport kan zetten. Er wordt niets
   verstuurd en niets bewaard: na een herlaadbeurt is de lijst leeg. Staat vroeg in
   src/main.js, zodat ook fouten tijdens het opstarten meetellen. */
import {expose} from './global.js';

const LKERR = [];
const lkErrPush = (msg, where) => {
  LKERR.push({at: new Date().toISOString().slice(11, 19), msg: String(msg).slice(0, 300), where: where || ''});
  if (LKERR.length > 10) LKERR.shift();
};
window.addEventListener('error', e => lkErrPush(e.message || e.error, e.filename ? (e.filename.split('/').pop() + ':' + e.lineno) : ''));
window.addEventListener('unhandledrejection', e => lkErrPush('Promise: ' + ((e.reason && e.reason.message) || e.reason)));
const lkErrors = () => LKERR.slice();

expose({lkErrors});
