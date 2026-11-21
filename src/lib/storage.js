/* ================= OPSLAG (S267) =================
   jget/jset: een JSON-waarde in localStorage lezen en schrijven, zonder dat een volle of
   geblokkeerde opslag (privévenster, file://) de app laat vallen. */
import {expose} from './global.js';

const jget=(k,d)=>{ try{ return JSON.parse(localStorage.getItem(k)||'null')||d; }catch(e){ return d; } }, jset=(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} };

expose({jget, jset});
