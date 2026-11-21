/* ================= VERTALING (S271) =================
   Was het tweede inline script van src/shell/index.html. Het Engelse woordenboek komt uit
   web/i18n-en.js, dat het eerste inline script met document.write laadt (alleen in het Engels); dit
   bestand draait daarna, als eerste module van de bundel.
   - trPlain(t)  platte tekst; t() in een component is hetzelfde
   - tHtml(h)    tekst met inline opmaak (in src/lib/bridge.js, via i18nLook)
   - tStatic(el) een stuk DOM buiten Vue, één keer
   - trCanvas    tekst op een canvas (fillText/strokeText/measureText vertalen zelf)
   Er is geen MutationObserver meer: alles wat tekst op de pagina zet, vertaalt die zelf. */
import {live} from './global.js';

const I18N_EN=window.__I18N_EN||{};
const I18N_ENV=new Set(); for(const k in I18N_EN) I18N_ENV.add(I18N_EN[k]);
const I18N_MISS=new Map();
const I18N_INLINE=new Set(['B','STRONG','I','EM','SUB','SUP','SMALL','SPAN','A','BR','CODE','ABBR','KBD','MARK','U','S','WBR','TIME']);
const I18N_SKIP=new Set(['SCRIPT','STYLE','CANVAS','svg','SVG','TEXTAREA','INPUT','IMG','VIDEO','IFRAME','TEMPLATE','DATALIST']);
const i18nNumRe=/\d+(?:[.,]\d+)*/g;
const i18nIsNL=t=>/^\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(t)||/^\d+(?:,\d+)?$/.test(t);
const i18nNum=t=>i18nIsNL(t)?t.replace(/[.,]/g,c=>c==='.'?',':'.'):t;
const i18nEsc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/ /g,'&nbsp;');
const i18nUnesc=s=>String(s).replace(/&nbsp;/g,' ').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&amp;/g,'&');
const i18nTSV=t=>LANG==='en'?String(t).split('\n').map(r=>r.split('\t').map(c=>trPlain(c,true)).join('\t')).join('\n'):t;
const ud=s=>`<span data-v="">${esc(s)}</span>`;
const uv=s=>'\u0002'+s+'\u0003'; const i18nStrip=s=>String(s).replace(/[\u0002\u0003]/g,'');
function i18nKey(html){ const vs=[], ns=[], us=[]; let s=String(html).replace(/[ \t\r\n]+/g,' ').trim();
  s=s.replace(/<span data-v="">([\s\S]*?)<\/span>|\u0002([^\u0003]*)\u0003/g,(m,v,w)=>{ vs.push(v!=null?v:w); us.push(v==null); return String.fromCharCode(0xE000+vs.length-1); });
  s=s.split(/(<[^>]*>)/).map(p=>p.charAt(0)==='<'?p:p.replace(i18nNumRe,m=>{ ns.push(m); return String.fromCharCode(0xF000+ns.length-1); })).join('');
  const caps=[]; let key=''; for(const ch of s){ const c=ch.charCodeAt(0); if(c>=0xF000&&c<0xF900){ caps.push({t:'#',v:ns[c-0xF000]}); key+='{#}'; } else if(c>=0xE000&&c<0xE900){ caps.push({t:'*',v:vs[c-0xE000],u:us[c-0xE000]}); key+='{*}'; } else key+=ch; }
  return {key,caps}; }
function i18nFill(val,caps,html){ let i=0; return val.replace(/\{(\*|#|\d+)\}/g,(m,g)=>{ const c=/\d/.test(g)?caps[+g-1]:caps[i++]; if(!c) return m; if(c.t==='#') return i18nNum(c.v); if(c.u) return c.v; /* gebruikerstekst op canvas (uv) blijft letterlijk */ const t=i18nLook(c.v); const v=t?t.out:c.v; return html?`<span data-v="">${v}</span>`:v; }); }
const i18nHasWords=k=>/[A-Za-zÀ-ÿ]{2,}/.test(k.replace(/<[^>]*>|\{[#*]\}|&[a-z]+;/g,' '));
function i18nLook(html){ const {key,caps}=i18nKey(html); const v=I18N_EN[key]; return v!=null?{out:i18nFill(v,caps,true),key}:null; }
let I18N_ENJ=null;
function i18nMiss(key,ctx){ if(I18N_ENV.has(key)||!i18nHasWords(key)||/^#[0-9a-f{}#]+$/i.test(key)) return; if(I18N_ENJ==null) I18N_ENJ=[...I18N_ENV].join('\n'); if(key.length>2&&I18N_ENJ.includes(key.trim())) return; if(!I18N_MISS.has(key)) I18N_MISS.set(key,ctx||''); }
/* plain text (tekstknoop, attribuut, canvas) */
function trPlain(t,keepMiss){ if(t==null) return t; if(LANG!=='en') return typeof t==='string'&&t.indexOf('\u0002')>=0?i18nStrip(t):t; const s=String(t); if(!/\S/.test(s)) return s; const lead=s.match(/^\s*/)[0], tail=s.match(/\s*$/)[0];
  const {key,caps}=i18nKey(i18nEsc(s)); const v=I18N_EN[key];
  if(v!=null) return lead+i18nUnesc(i18nFill(v,caps,false))+tail;
  if(!keepMiss) i18nMiss(key,'tekst');
  return i18nStrip(s.replace(i18nNumRe,m=>i18nNum(m))); }
const i18nCanvasCache=new Map();
function trCanvas(t){ if(window.__i18nRec&&typeof t==='string') (window.__i18nCanvas=window.__i18nCanvas||[]).push(t); if(typeof t!=='string') return t; if(LANG!=='en') return t.indexOf('\u0002')>=0?i18nStrip(t):t; let r=i18nCanvasCache.get(t); if(r==null){ r=trPlain(t); if(i18nCanvasCache.size>5000) i18nCanvasCache.clear(); i18nCanvasCache.set(t,r); } return r; }
{ const P=CanvasRenderingContext2D.prototype, ft=P.fillText, st=P.strokeText, mt=P.measureText;
  P.fillText=function(t,...a){ return ft.call(this,trCanvas(String(t)),...a); };
  P.strokeText=function(t,...a){ return st.call(this,trCanvas(String(t)),...a); };
  P.measureText=function(t){ return mt.call(this,trCanvas(String(t))); }; }
function i18nIsUnit(el){ let txt=false; for(const n of el.childNodes){ if(n.nodeType===3&&/\S/.test(n.data)) txt=true; } if(!txt) return false;
  const all=el.getElementsByTagName('*'); for(const d of all){ if(!I18N_INLINE.has(d.tagName)||d.isContentEditable||d.hasAttribute('data-notr')) return false; } return true; }
function i18nAttr(el){ for(const a of ['title','placeholder','aria-label']){ if(!el.hasAttribute(a)) continue; const v=el.getAttribute(a); el.__ia=el.__ia||{}; if(el.__ia[a]===v) continue; const t=trPlain(v); if(t!==v) el.setAttribute(a,t); el.__ia[a]=el.getAttribute(a); } }
function i18nValue(el){ if(el===document.activeElement||el.__typed) return; const v=el.value; if(el.__iv===v||!v) { el.__iv=v; return; }
  const ty=(el.type||'').toLowerCase(); if(ty&&!['text','search',''].includes(ty)&&el.tagName==='INPUT'){ el.__iv=v; return; }
  let t=v; const {key}=i18nKey(i18nEsc(v.trim())); const d=I18N_EN[key]; if(d!=null&&!/\{[#*\d]/.test(d)) t=i18nUnesc(d);
  else if(d!=null) t=trPlain(v,true);
  else t=v.replace(i18nNumRe,m=>m.includes(',')?i18nNum(m):m);
  if(t!==v) el.value=t; el.__iv=el.value; }
function i18nText(n){ if(n.__id===n.data) return; const t=trPlain(n.data); if(t!==n.data) n.data=t; n.__id=n.data; }
function i18nWalk(el){ if(!el||el.nodeType!==1) return; if(el.hasAttribute('data-notr')) return;
  i18nAttr(el); const tg=el.tagName;
  if(tg==='INPUT'||tg==='TEXTAREA'){ i18nValue(el); return; }
  if(I18N_SKIP.has(tg)) return;
  if(el.isContentEditable&&el.contains(document.activeElement)) return;
  if(el.__i18n!=null&&el.__i18n===el.innerHTML) return;
  if(i18nIsUnit(el)){ const r=i18nLook(el.innerHTML); if(r){ el.innerHTML=r.out; el.__i18n=el.innerHTML; return; }
    const {key,caps}=i18nKey(el.innerHTML); if(I18N_ENV.has(key)){ const o=i18nFill(key,caps,true); if(o!==el.innerHTML) el.innerHTML=o; el.__i18n=el.innerHTML; return; } }
  for(const n of [...el.childNodes]){ if(n.nodeType===3){ if(/\S/.test(n.data)) i18nText(n); } else if(n.nodeType===1) i18nWalk(n); }
  if(i18nIsUnit(el)) el.__i18n=el.innerHTML; }
/* tStatic(root): vertaal een stuk DOM dat gewone code (geen Vue) heeft gebouwd, één keer, met dezelfde
   sleutels als tHtml()/trPlain(), en geef root terug. Een Vue-boom (data-notr) blijft erbuiten: die
   vertaalt zichzelf. Sinds S271 is er geen MutationObserver meer die achteraf vertaalt: wie buiten Vue
   DOM bouwt, roept tStatic() aan (of zet zijn tekst door trPlain()/tHtml()). Een tweede keer over
   hetzelfde stuk is veilig: wat al vertaald is, staat gemarkeerd (__i18n, __id, __ia, __iv). */
function tStatic(root){ if(LANG==='en'&&root) i18nWalk(root); return root; }
/* Opstarten: de taal op <html>, en in het Engels één vertaalronde over de statische pagina (de koppen,
   bronregels en navigatie van alle tools; de zoekfunctie en de startpagina lezen die). Een taalwissel
   laadt de pagina opnieuw, dus meer is niet nodig. */
function i18nStart(){ document.documentElement.lang=LANG; if(LANG!=='en') return;
  /* wat de gebruiker zelf typt, blijft staan (i18nValue slaat het over) */
  document.addEventListener('input',e=>{ const t=e.target; if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA')&&e.isTrusted) t.__typed=true; },true);
  document.querySelectorAll('input,textarea').forEach(el=>{ if(el.value&&el.value!==el.defaultValue) el.__typed=true; });
  tStatic(document.body);
  try{ if(typeof calc!=='undefined'&&calc[current]) calc[current](); }catch(e){} }
/* verzamelen (alleen voor de ontwikkeltool tests/i18n_collect.py) */
function i18nCollect(root){ const out=new Set(); const add=k=>{ if(i18nHasWords(k)) out.add(k); };
  const walk=el=>{ if(!el||el.nodeType!==1||el.hasAttribute('data-notr')) return; for(const a of ['title','placeholder','aria-label']) if(el.hasAttribute(a)) add(i18nKey(i18nEsc(el.getAttribute(a))).key);
    const tg=el.tagName; if(tg==='INPUT'||tg==='TEXTAREA'){ const ty=(el.type||'').toLowerCase(); if((tg==='TEXTAREA'||el.classList.contains('txt'))&&el.value&&(!ty||ty==='text'||ty==='search'||tg==='TEXTAREA')&&el.value.length<80&&!/\n/.test(el.value)) add(i18nKey(i18nEsc(el.value.trim())).key); return; }
    if(I18N_SKIP.has(tg)) return; if(i18nIsUnit(el)){ add(i18nKey(el.innerHTML).key); el.querySelectorAll('[data-v]').forEach(v=>add(i18nKey(v.innerHTML).key)); return; }
    for(const n of el.childNodes){ if(n.nodeType===3&&/\S/.test(n.data)) add(i18nKey(i18nEsc(n.data)).key); else if(n.nodeType===1) walk(n); } };
  walk(root||document.body); (window.__i18nCanvas||[]).forEach(t=>add(i18nKey(i18nEsc(t)).key)); window.__i18nCanvas=[]; return [...out]; }

/* alles hierboven ook als globale naam (de oude code en de componenten lezen ze zo) */
live({
  I18N_EN: () => I18N_EN,
  I18N_ENV: () => I18N_ENV,
  I18N_MISS: () => I18N_MISS,
  I18N_INLINE: () => I18N_INLINE,
  I18N_SKIP: () => I18N_SKIP,
  i18nNumRe: () => i18nNumRe,
  i18nIsNL: () => i18nIsNL,
  i18nNum: () => i18nNum,
  i18nEsc: () => i18nEsc,
  i18nUnesc: () => i18nUnesc,
  i18nTSV: () => i18nTSV,
  ud: () => ud,
  uv: () => uv,
  i18nStrip: () => i18nStrip,
  i18nKey: [() => i18nKey, v => { i18nKey = v; }],
  i18nFill: [() => i18nFill, v => { i18nFill = v; }],
  i18nHasWords: () => i18nHasWords,
  i18nLook: [() => i18nLook, v => { i18nLook = v; }],
  I18N_ENJ: [() => I18N_ENJ, v => { I18N_ENJ = v; }],
  i18nMiss: [() => i18nMiss, v => { i18nMiss = v; }],
  trPlain: [() => trPlain, v => { trPlain = v; }],
  i18nCanvasCache: () => i18nCanvasCache,
  trCanvas: [() => trCanvas, v => { trCanvas = v; }],
  i18nIsUnit: [() => i18nIsUnit, v => { i18nIsUnit = v; }],
  i18nAttr: [() => i18nAttr, v => { i18nAttr = v; }],
  i18nValue: [() => i18nValue, v => { i18nValue = v; }],
  i18nText: [() => i18nText, v => { i18nText = v; }],
  i18nWalk: [() => i18nWalk, v => { i18nWalk = v; }],
  tStatic: [() => tStatic, v => { tStatic = v; }],
  i18nStart: [() => i18nStart, v => { i18nStart = v; }],
  i18nCollect: [() => i18nCollect, v => { i18nCollect = v; }]
});
