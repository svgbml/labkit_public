/* ================= GEDEELDE HELPERS (S267) =================
   Letterlijk overgenomen uit de inline scripts van src/shell/index.html: kleuren, $/$$, het
   lezen en opmaken van getallen (num, fmt, sig, sci, vol, mass), esc, note, kv en het object
   calc waar elke tool zijn rekenfunctie op zet. Alles gaat ook op window, want de inline
   scripts, tools/nt/ en de componenten lezen deze namen nog als globale namen. */
import {expose} from './global.js';

const hexRgb=h=>{ h=String(h).replace('#',''); if(h.length===3) h=[...h].map(c=>c+c).join(''); const n=parseInt(h,16); return [(n>>16)&255,(n>>8)&255,n&255]; };
const rgbHex=a=>'#'+a.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
const mixHex=(a,b,t)=>{ const A=hexRgb(a),B=hexRgb(b); return rgbHex(A.map((v,i)=>v*(1-t)+B[i]*t)); };
const inkOn=h=>{ const [r,g,b]=hexRgb(h).map(v=>{ v/=255; return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4); }); return 0.2126*r+0.7152*g+0.0722*b>0.42?'#1f2933':'#ffffff'; };
/* ---------- helpers ---------- */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
function num(v){ if(v==null) return NaN; v=String(v).trim().replace(/[\s\u00a0]/g,''); if(v==='') return NaN; if(v.includes('.')&&v.includes(',')){ const d=v[Math.max(v.lastIndexOf('.'),v.lastIndexOf(','))]; v=v.split(d==='.'?',':'.').join('').replace(',','.'); } else if(LANG==='en'&&/^-?\d{1,3}(,\d{3})+$/.test(v)) v=v.replace(/,/g,''); else v=v.replace(',','.'); return Number(v); }
const NL=(n,d)=>n.toLocaleString('nl-NL',{maximumFractionDigits:d,minimumFractionDigits:0});
function fmt(n,d=2){ return isFinite(n)?NL(n,d):'–'; }
function sig(n,s=3){ if(!isFinite(n)) return '–'; if(n===0) return '0'; const p=Math.floor(Math.log10(Math.abs(n))); const d=Math.max(0,Math.min(6,s-1-p)); return NL(Number(n.toFixed(d)),d); }
function sci(n,s=3){ if(!isFinite(n)) return '–'; if(n===0) return '0'; const e=Math.floor(Math.log10(Math.abs(n))); if(e>=-2&&e<5) return sig(n,s); const m=n/10**e; return `${NL(Number(m.toFixed(s-1)),s-1)} × 10<sup>${e}</sup>`; }
function vol(uL){ if(!isFinite(uL)) return '–'; const a=Math.abs(uL); if(a>=1000) return sig(uL/1000,4)+' mL'; if(a<1&&a>0) return fmt(uL,3)+' µL'; return fmt(uL,a<10?2:1)+' µL'; }
function mass(g){ if(!isFinite(g)) return '–'; const a=Math.abs(g); if(a>=1) return fmt(g,3)+' g'; if(a>=1e-3) return fmt(g*1e3,2)+' mg'; return fmt(g*1e6,1)+' µg'; }
function list(txt){ /* komma+spatie of meerdere komma's = scheiding; enkele komma tussen cijfers = decimaal */ return String(txt).replace(/,\s+/g,' ').split(/[\s;]+/).flatMap(t=>(t.match(/,/g)||[]).length>1?t.split(','):[t]).map(t=>num(t)).filter(x=>isFinite(x)); }
function esc(s){ return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
const note=(cls,txt)=>`<div class="note ${cls}">${txt}</div>`;
const kv=rows=>`<dl class="kv">${rows.map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`;
const calc={};

/* S140 (#283): 'smooth' voor scrollIntoView, of 'auto' als de gebruiker minder beweging wil */
const lkScroll = () => (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');
expose({hexRgb, rgbHex, mixHex, inkOn, $, $$, num, NL, fmt, sig, sci, vol, mass, list, esc, note, kv, calc, lkScroll});
