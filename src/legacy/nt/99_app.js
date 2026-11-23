/* Letterlijk overgenomen uit tools/nt/99_app.js (S269): een classic script dat als module in de bundel staat
   en zijn namen live op window zet, zodat de andere code ze als globale namen blijft lezen. */
import {live} from '../../lib/global.js';

/* ================= APP: QR-CODE, OPDRACHTPALET, DELEN, ONGEDAAN MAKEN, DOCX ================= */
/* --- QR-code (ISO/IEC 18004, bytemodus, foutcorrectie L of M) --- */
const QR_ECC={L:[-1,7,10,15,20,26,18,20,24,30,18,20,24,26,30,22,24,28,30,28,28,28,28,30,30,26,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],M:[-1,10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26,26,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28]};
const QR_BLK={L:[-1,1,1,1,1,1,2,2,2,2,4,4,4,4,4,6,6,6,6,7,8,8,9,9,10,12,12,12,13,14,15,16,17,18,19,19,20,21,22,24,25],M:[-1,1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16,17,17,18,20,21,23,25,26,28,29,31,33,35,37,38,40,43,45,47,49]};
function qrRaw(v){ let r=(16*v+128)*v+64; if(v>=2){ const na=Math.floor(v/7)+2; r-=(25*na-10)*na-55; if(v>=7) r-=36; } return r; }
function qrAlign(v){ if(v===1) return []; const na=Math.floor(v/7)+2, step=v===32?26:Math.ceil((v*4+4)/(na*2-2))*2, res=[6]; for(let p=v*4+17-7;res.length<na;p-=step) res.splice(1,0,p); return res; }
const QR_EXP=[], QR_LOG=[]; (()=>{ let x=1; for(let i=0;i<255;i++){ QR_EXP[i]=x; QR_LOG[x]=i; x<<=1; if(x&256) x^=0x11D; } })();
const qrMul=(a,b)=>a&&b?QR_EXP[(QR_LOG[a]+QR_LOG[b])%255]:0;
function qrRS(data,deg){ let g=[1]; for(let i=0;i<deg;i++){ const n=Array(g.length+1).fill(0); for(let k=0;k<n.length;k++) n[k]=(k<g.length?g[k]:0)^(k>=1?qrMul(g[k-1],QR_EXP[i]):0); g=n; }
  const r=Array(deg).fill(0); data.forEach(b=>{ const f=b^r[0]; r.shift(); r.push(0); for(let j=0;j<deg;j++) r[j]^=qrMul(g[j+1],f); }); return r; }
function qrMatrix(text,ecl='M'){ const bytes=[...new TextEncoder().encode(String(text))]; let v=1, cap=0;
  for(;v<=40;v++){ cap=(Math.floor(qrRaw(v)/8)-QR_ECC[ecl][v]*QR_BLK[ecl][v])*8; if(4+(v<10?8:16)+bytes.length*8<=cap) break; } if(v>40) throw new Error('te lang');
  const bits=[]; const put=(val,len)=>{ for(let i=len-1;i>=0;i--) bits.push((val>>>i)&1); }; put(4,4); put(bytes.length,v<10?8:16); bytes.forEach(b=>put(b,8)); put(0,Math.min(4,cap-bits.length)); while(bits.length%8) bits.push(0); for(let pad=0xEC;bits.length<cap;pad^=0xEC^0x11) put(pad,8);
  const dat=[]; for(let i=0;i<bits.length;i+=8) dat.push(bits.slice(i,i+8).reduce((a,b)=>a*2+b,0));
  const nb=QR_BLK[ecl][v], el=QR_ECC[ecl][v], raw=Math.floor(qrRaw(v)/8), nShort=nb-raw%nb, shortLen=Math.floor(raw/nb), blocks=[]; let k=0;
  for(let i=0;i<nb;i++){ const dl=shortLen-el+(i<nShort?0:1), d=dat.slice(k,k+dl); k+=dl; blocks.push({d,e:qrRS(d,el)}); }
  const cw=[]; for(let i=0;i<shortLen-el+1;i++) blocks.forEach(b=>{ if(i<b.d.length) cw.push(b.d[i]); }); for(let i=0;i<el;i++) blocks.forEach(b=>cw.push(b.e[i]));
  const n=v*4+17, M=Array.from({length:n},()=>Array(n).fill(false)), F=Array.from({length:n},()=>Array(n).fill(false)), set=(x,y,d)=>{ M[y][x]=d; F[y][x]=true; };
  for(let i=0;i<n;i++){ set(6,i,i%2===0); set(i,6,i%2===0); }
  const finder=(cx,cy)=>{ for(let dy=-4;dy<=4;dy++) for(let dx=-4;dx<=4;dx++){ const x=cx+dx, y=cy+dy, d=Math.max(Math.abs(dx),Math.abs(dy)); if(x>=0&&x<n&&y>=0&&y<n) set(x,y,d!==2&&d!==4); } };
  finder(3,3); finder(n-4,3); finder(3,n-4);
  const al=qrAlign(v); al.forEach((a,i)=>al.forEach((b,j)=>{ if((i===0&&j===0)||(i===0&&j===al.length-1)||(i===al.length-1&&j===0)) return; for(let dy=-2;dy<=2;dy++) for(let dx=-2;dx<=2;dx++) set(a+dx,b+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1); }));
  const fmtBits=mask=>{ const d=({L:1,M:0}[ecl]<<3)|mask; let r=d; for(let i=0;i<10;i++) r=(r<<1)^((r>>>9)*0x537); return ((d<<10)|r)^0x5412; };
  const drawFmt=mask=>{ const b=fmtBits(mask), g=i=>((b>>>i)&1)===1; for(let i=0;i<=5;i++) set(8,i,g(i)); set(8,7,g(6)); set(8,8,g(7)); set(7,8,g(8)); for(let i=9;i<15;i++) set(14-i,8,g(i)); for(let i=0;i<8;i++) set(n-1-i,8,g(i)); for(let i=8;i<15;i++) set(8,n-15+i,g(i)); set(8,n-8,true); };
  drawFmt(0);
  if(v>=7){ let r=v; for(let i=0;i<12;i++) r=(r<<1)^((r>>>11)*0x1F25); const b=(v<<12)|r; for(let i=0;i<18;i++){ const bit=((b>>>i)&1)===1, a=n-11+i%3, c=Math.floor(i/3); set(a,c,bit); set(c,a,bit); } }
  let i=0; for(let right=n-1;right>=1;right-=2){ if(right===6) right=5; for(let vert=0;vert<n;vert++) for(let j=0;j<2;j++){ const x=right-j, up=((right+1)&2)===0, y=up?n-1-vert:vert; if(!F[y][x]&&i<cw.length*8){ M[y][x]=((cw[i>>>3]>>>(7-(i&7)))&1)===1; i++; } } }
  const MASKS=[(x,y)=>(x+y)%2===0,(x,y)=>y%2===0,(x,y)=>x%3===0,(x,y)=>(x+y)%3===0,(x,y)=>(Math.floor(x/3)+Math.floor(y/2))%2===0,(x,y)=>x*y%2+x*y%3===0,(x,y)=>(x*y%2+x*y%3)%2===0,(x,y)=>((x+y)%2+x*y%3)%2===0];
  const apply=m=>{ for(let y=0;y<n;y++) for(let x=0;x<n;x++) if(!F[y][x]&&MASKS[m](x,y)) M[y][x]=!M[y][x]; };
  const penalty=()=>{ let p=0; const lines=[]; for(let y=0;y<n;y++){ lines.push(M[y]); lines.push(M.map(r=>r[y])); }
    lines.forEach(L=>{ let run=1; for(let k2=1;k2<=n;k2++){ if(k2<n&&L[k2]===L[k2-1]) run++; else { if(run>=5) p+=3+run-5; run=1; } } const s=L.map(b=>b?1:0).join(''); for(const pat of ['10111010000','00001011101']){ let q=s.indexOf(pat); while(q>=0){ p+=40; q=s.indexOf(pat,q+1); } } });
    for(let y=0;y<n-1;y++) for(let x=0;x<n-1;x++){ const c=M[y][x]; if(c===M[y][x+1]&&c===M[y+1][x]&&c===M[y+1][x+1]) p+=3; }
    const dark=M.reduce((a,r)=>a+r.filter(Boolean).length,0); p+=10*Math.floor(Math.abs(dark*20-n*n*10)/(n*n)); return p; };
  let best=0, bp=Infinity; for(let m=0;m<8;m++){ apply(m); drawFmt(m); const pp=penalty(); if(pp<bp){ bp=pp; best=m; } apply(m); }
  apply(best); drawFmt(best); return M; }
function qrSvg(text,px){ try{ const M=qrMatrix(text,'M'), n=M.length, q=4, w=n+2*q; let d=''; for(let y=0;y<n;y++) for(let c=0;c<n;c++) if(M[y][c]) d+=`M${c+q} ${y+q}h1v1h-1z`; return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${w} ${w}" shape-rendering="crispEdges"><rect width="${w}" height="${w}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`; }catch(e){ return ''; } }
function drawQR(x,text,X,Y,size,ecl='M'){ const M=qrMatrix(text,ecl), n=M.length, q=4, s=size/(n+2*q); x.fillStyle='#fff'; x.fillRect(X,Y,size,size); x.fillStyle='#000'; for(let y=0;y<n;y++) for(let c=0;c<n;c++) if(M[y][c]) x.fillRect(X+(c+q)*s,Y+(y+q)*s,s+0.01,s+0.01); return n; }

/* --- gedeelde dialoog --- */
function appModal(html,onClose){ const ov=document.createElement('div'); ov.className='lk-modal'; ov.style.cssText='position:fixed;inset:0;background:rgba(15,20,30,.38);z-index:80;display:flex;align-items:flex-start;justify-content:center;padding:10vh 12px 12px';
  ov.innerHTML=`<div role="dialog" aria-modal="true" style="background:var(--surface,#fff);color:var(--ink);border:1px solid var(--line);border-radius:10px;box-shadow:0 12px 40px rgba(0,0,0,.25);width:min(560px,100%);max-height:80vh;overflow:auto;padding:16px">${html}</div>`;
  const close=()=>{ ov.remove(); document.removeEventListener('keydown',esc1); if(onClose) onClose(); }, esc1=e=>{ if(e.key==='Escape'){ e.preventDefault(); close(); } };
  ov.addEventListener('mousedown',e=>{ if(e.target===ov) close(); }); document.addEventListener('keydown',esc1); tStatic(ov); document.body.appendChild(ov); return {ov,box:ov.firstChild,close}; }

/* --- opdrachtpalet (Ctrl+K) --- */
const fold=s=>String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
function cmdItems(){ const T=toolIndex().map(t=>({k:'tool',id:t.id,n:t.name,s:t.grp,d:t.desc,g:t.tags,h:[t.name,t.grp,t.desc,...t.tags].join(' ')}));
  const A=[['share','Deze tool delen (link of QR-code)'],['undo','Ongedaan maken in deze tool'],['save','Sessie opslaan als bestand'],['open','Sessie openen'],['inst','Instellingen & updates'],['report','Rapport / labjournaal maken'],['start','Startpagina']].map(([id,n])=>({k:'act',id,n:trPlain(n),s:trPlain('opdracht'),h:trPlain(n)}));
  return [...A,...T]; }
function cmdRun(it){ if(it.k==='tool'){ location.hash='#'+it.id; return; } const c=current;
  if(it.id==='share') shareOpen(c); else if(it.id==='undo') undoDo(c); else if(it.id==='save') $('#sess-save').click(); else if(it.id==='open') $('#sess-open').click(); else location.hash='#'+it.id; }
function cmdOpen(){ if(document.querySelector('.lk-modal')) return; const items=cmdItems();
  const m=appModal(`<input type="search" class="txt lk-cmdq" placeholder="Zoek een tool of opdracht…" aria-label="Zoek een tool of opdracht" autocomplete="off" style="width:100%;height:38px;font-size:15px"><div class="lk-cmdl" role="listbox" data-notr="" style="margin-top:8px"></div><div style="font-size:12px;color:var(--muted);margin-top:8px">↑ ↓ kiezen · Enter openen · Esc sluiten</div>`);
  const q=m.box.querySelector('.lk-cmdq'), L=m.box.querySelector('.lk-cmdl'); let sel=0, shown=[];
  const render=()=>{ const w=fold(q.value).split(/\s+/).filter(Boolean); shown=items.filter(it=>w.every(x=>fold(it.h).includes(x))).slice(0,12); if(!w.length) shown=items.filter(it=>it.k==='act').concat(items.filter(it=>it.k==='tool').slice(0,7)); sel=Math.min(sel,Math.max(0,shown.length-1));
    L.innerHTML=shown.length?shown.map((it,i)=>`<div role="option" data-i="${i}" aria-selected="${i===sel}"${i===sel?' style="background:var(--accent-soft)"':''}><span>${esc(it.n)}${it.d?`<small>${esc(it.d)}</small>`:''}</span><span class="lk-cmd-m">${it.s}${it.g&&it.g.length?`<em>${it.g.slice(0,3).map(g=>`<span>${esc(trPlain(g,true))}</span>`).join('')}</em>`:''}</span></div>`).join(''):`<div style="padding:8px 10px;color:var(--muted)">${trPlain('Niets gevonden.')}</div>`; };
  q.addEventListener('input',()=>{ sel=0; render(); }); q.addEventListener('keydown',e=>{ if(e.key==='ArrowDown'){ e.preventDefault(); sel=Math.min(sel+1,shown.length-1); render(); } else if(e.key==='ArrowUp'){ e.preventDefault(); sel=Math.max(sel-1,0); render(); } else if(e.key==='Enter'&&shown[sel]){ e.preventDefault(); const it=shown[sel]; m.close(); cmdRun(it); } });
  L.addEventListener('click',e=>{ const r=e.target.closest('[data-i]'); if(r){ const it=shown[+r.dataset.i]; m.close(); cmdRun(it); } }); render(); setTimeout(()=>q.focus(),0); }
document.addEventListener('keydown',e=>{ if((e.ctrlKey||e.metaKey)&&!e.altKey&&(e.key==='k'||e.key==='K')){ e.preventDefault(); cmdOpen(); } });

/* --- momentopname van een tool (voor delen en ongedaan maken) --- */
function toolSnap(id){ const sec=$('#t-'+id); if(!sec) return null; const v={}, tb={};
  sec.querySelectorAll('input,select,textarea').forEach(el=>{ if(!persistable(el)) return; v[el.id]=el.type==='checkbox'?el.checked:el.value; });
  sec.querySelectorAll('table[id]').forEach(t=>{ if(TBLDEF[t.id]) tb[t.id]=[...t.querySelectorAll('tbody tr')].map(tr=>[...tr.querySelectorAll('input:not([type=radio]):not([type=checkbox]),select')].map(e=>e.value)); });
  return {t:id,v,tb}; }
function toolApply(s){ const sec=$('#t-'+s.t); if(!sec) return; Object.entries(s.tb||{}).forEach(([id,rows])=>{ const def=TBLDEF[id], t=$('#'+id); if(!def||!t||!Array.isArray(rows)) return; const vals=rows.slice(0,2000).map(r=>r.map((v,i)=>def.num.includes(i)?(v===''?NaN:num(v)):v)); /* een tabel die Vue rendert geeft set() mee: innerHTML zou Vue overschrijven */ if(def.set) def.set(vals); else t.querySelector('tbody').innerHTML=vals.map(def.row).join(''); });
  Object.entries(s.v||{}).forEach(([id,val])=>{ const el=document.getElementById(id); if(!el||!sec.contains(el)||!persistable(el)) return; if(el.type==='checkbox') el.checked=!!val; else el.value=String(val); /* v-model van een Vue-veld luistert naar input, een keuzelijst naar change */ el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); });
  if(calc[s.t]) try{ calc[s.t](); }catch(e){} }

/* --- delen via link of QR-code --- */
const b64u={enc:u8=>{ let s=''; for(let i=0;i<u8.length;i+=0x8000) s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000)); return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); },dec:s=>{ s=s.replace(/-/g,'+').replace(/_/g,'/'); while(s.length%4) s+='='; const b=atob(s), u=new Uint8Array(b.length); for(let i=0;i<b.length;i++) u[i]=b.charCodeAt(i); return u; }};
async function shareEncode(obj){ const raw=new TextEncoder().encode(JSON.stringify(obj)); if(typeof CompressionStream==='function'){ try{ const z=new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer()); return 'z'+b64u.enc(z); }catch(e){} } return 'j'+b64u.enc(raw); }
async function shareDecode(s){ const k=s[0], u=b64u.dec(s.slice(1)); let raw=u; if(k==='z') raw=new Uint8Array(await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()); else if(k!=='j') throw 0; return JSON.parse(new TextDecoder().decode(raw)); }
function shareBase(){ const h=location.hostname; return location.protocol.startsWith('http')&&(/github\.io$/.test(h)||h==='localhost'||h==='127.0.0.1')?location.origin+location.pathname:'https://svgbml.github.io/labkit_public/'; }
async function shareOpen(id){ if(!id||id==='start'||!$('#t-'+id)) { alertBox('Open eerst een tool om te delen.'); return; } const s=toolSnap(id), code=await shareEncode(s), url=`${shareBase()}?d=${code}#${id}`, name=$('#t-'+id+' .tool-head h2').textContent;
  const m=appModal(`<h3 style="margin:0 0 4px;font-size:16px">Tool delen: ${ud(name)}</h3><p style="margin:0 0 10px;color:var(--muted);font-size:13px">De link bevat de huidige invoer van deze tool. Wie hem opent, krijgt dezelfde invoer; er gaat niets via een server.</p><div class="row" style="gap:6px"><input class="lk-url" data-notr="" readonly style="flex:1;min-width:0" value="${esc(url)}"><button type="button" class="primary lk-copy">Kopieer link</button></div><div class="lk-qr" style="margin-top:12px;text-align:center"></div><div class="row" style="justify-content:flex-end;margin-top:8px"><button type="button" class="lk-close">Sluiten</button></div>`);
  m.box.querySelector('.lk-close').addEventListener('click',m.close); m.box.querySelector('.lk-copy').addEventListener('click',e=>{ const inp=m.box.querySelector('.lk-url'); (navigator.clipboard?navigator.clipboard.writeText(url):Promise.reject()).catch(()=>{ inp.select(); document.execCommand('copy'); }).finally(()=>flashBtn(e.target,'Gekopieerd')); });
  const q=m.box.querySelector('.lk-qr'); if(new TextEncoder().encode(url).length<=2300){ const cv=document.createElement('canvas'), sz=260, d=window.devicePixelRatio||1; cv.width=sz*d; cv.height=sz*d; cv.style.width=sz+'px'; const x=cv.getContext('2d'); x.scale(d,d); try{ drawQR(x,url,0,0,sz,url.length>1200?'L':'M'); q.appendChild(cv); q.insertAdjacentHTML('beforeend',`<div style="font-size:12px;color:var(--muted)">Scan met de camera van je telefoon.</div>`); }catch(e){ q.textContent=''; } } else q.innerHTML=`<div style="font-size:13px;color:var(--muted)">Te veel invoer voor een QR-code; gebruik de link.</div>`; }
window.addEventListener('load',()=>setTimeout(async()=>{ const d=new URLSearchParams(location.search).get('d'); if(!d) return; try{ const s=await shareDecode(d); if(s&&s.t&&TOOLS.includes(s.t)){ toolApply(s); location.hash='#'+s.t; route(); undoReset(s.t); alertBox('Gedeelde invoer geladen.'); } }catch(e){ alertBox('Deze deellink kon niet worden gelezen.'); } try{ history.replaceState(null,'',location.pathname+location.hash); }catch(e){} },80));

/* --- ongedaan maken per tool --- */
const UNDO={}; let undoBusy=false, undoTimer=null;
function undoReset(id){ const s=toolSnap(id); if(s) UNDO[id]=[JSON.stringify(s)]; undoBtns(); }
function undoRec(id){ if(undoBusy||!id||id==='start'||id==='gelfoto') return;   /* de gelfoto-editor heeft zijn eigen geschiedenis (gfHist, S74) */ const s=toolSnap(id); if(!s) return; const j=JSON.stringify(s), st=UNDO[id]||(UNDO[id]=[]); if(st[st.length-1]!==j){ st.push(j); if(st.length>60) st.shift(); } undoBtns(); }
function undoDo(id){ if(id==='gelfoto'){ gfUndo(); return; } const st=UNDO[id]; if(!st||st.length<2) return; st.pop(); undoBusy=true; try{ toolApply(JSON.parse(st[st.length-1])); }finally{ setTimeout(()=>{ undoBusy=false; },0); } undoBtns(); }
function undoBtns(){ $$('[data-undo]').forEach(b=>{ const st=UNDO[b.dataset.undo]; b.disabled=b.dataset.undo==='gelfoto'?!(gfHist.i>0):!st||st.length<2; }); }
['input','change','click'].forEach(ev=>document.addEventListener(ev,e=>{ if(undoBusy) return; const sec=e.target.closest&&e.target.closest('section.tool[data-tool]'); if(!sec||e.target.closest('[data-undo]')) return; const id=sec.dataset.tool; if(!UNDO[id]) return; clearTimeout(undoTimer); undoTimer=setTimeout(()=>undoRec(id),ev==='input'?600:150); },true));
window.addEventListener('hashchange',()=>{ setTimeout(()=>{ if(current&&current!=='start'&&!UNDO[current]) undoReset(current); },60); });
window.addEventListener('load',()=>setTimeout(()=>{ if(current&&current!=='start'&&!UNDO[current]) undoReset(current); },150));
document.addEventListener('keydown',e=>{ if(!(e.ctrlKey||e.metaKey)||e.shiftKey||e.altKey||e.key.toLowerCase()!=='z') return; const t=e.target; if(t.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(t.tagName)||document.querySelector('.lk-modal')) return; if(current&&UNDO[current]&&UNDO[current].length>1){ e.preventDefault(); undoDo(current); } });
$$('section.tool[data-tool]').forEach(sec=>{ const id=sec.dataset.tool, h=sec.querySelector('.tool-head'); if(!h||id==='start') return; h.insertAdjacentHTML('afterbegin',`<div class="lk-tbar" style="float:right;display:flex;gap:2px;margin:0 0 4px 12px"><button type="button" class="ghost" data-undo="${id}" disabled title="Ongedaan maken (Ctrl+Z)">↶ Ongedaan maken</button><button type="button" class="ghost" data-share="${id}" title="Deel de invoer van deze tool als link of QR-code">Delen</button></div>`); });
document.addEventListener('click',e=>{ const u=e.target.closest('[data-undo]'); if(u){ undoDo(u.dataset.undo); return; } const s=e.target.closest('[data-share]'); if(s) shareOpen(s.dataset.share); });
{ const nq=$('#nav-q'); if(nq&&nq.parentNode) nq.insertAdjacentHTML('afterend',`<button type="button" class="ghost lk-k" title="Opdrachtpalet (Ctrl+K)" style="font-size:12px;padding:2px 6px;margin-top:4px">Ctrl+K: zoek alles</button>`); document.addEventListener('click',e=>{ if(e.target.closest('.lk-k')) cmdOpen(); }); }

/* --- Word-bestand (.docx) zonder externe bibliotheek --- */
const CRCT=(()=>{ const t=new Uint32Array(256); for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c=c&1?0xEDB88320^(c>>>1):c>>>1; t[n]=c>>>0; } return t; })();
function crc32(u){ let c=0xFFFFFFFF; for(let i=0;i<u.length;i++) c=CRCT[(c^u[i])&255]^(c>>>8); return (c^0xFFFFFFFF)>>>0; }
function zipStore(files){ const enc=new TextEncoder(), parts=[], cen=[]; let off=0; const le=(n,b)=>{ const a=[]; for(let i=0;i<b;i++) a.push((n>>>(8*i))&255); return a; };
  files.forEach(f=>{ const name=enc.encode(f.name), data=typeof f.data==='string'?enc.encode(f.data):f.data, crc=crc32(data);
    const lh=new Uint8Array([0x50,0x4b,3,4,...le(20,2),...le(0x0800,2),...le(0,2),...le(0,2),...le(0x21,2),...le(crc,4),...le(data.length,4),...le(data.length,4),...le(name.length,2),...le(0,2)]);
    parts.push(lh,name,data); cen.push(new Uint8Array([0x50,0x4b,1,2,...le(20,2),...le(20,2),...le(0x0800,2),...le(0,2),...le(0,2),...le(0x21,2),...le(crc,4),...le(data.length,4),...le(data.length,4),...le(name.length,2),...le(0,2),...le(0,2),...le(0,2),...le(0,2),...le(0,4),...le(off,4)]),name); off+=lh.length+name.length+data.length; });
  const cs=cen.reduce((a,b)=>a+b.length,0), end=new Uint8Array([0x50,0x4b,5,6,0,0,0,0,...le(files.length,2),...le(files.length,2),...le(cs,4),...le(off,4),0,0]); return new Blob([...parts,...cen,end],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}); }
const xe=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u0002\u0003]/g,'');
function dxRuns(node,f={}){ const out=[]; node.childNodes.forEach(n=>{ if(n.nodeType===3){ const t=n.data.replace(/\s+/g,' '); if(t) out.push({t,...f}); } else if(n.nodeType===1){ const tg=n.tagName; if(tg==='BR') out.push({br:true}); else if(tg==='SCRIPT'||tg==='STYLE'||tg==='BUTTON') return; else { if(n.classList.contains('chip')) out.push({t:' ',...f}); out.push(...dxRuns(n,{...f,b:f.b||tg==='B'||tg==='STRONG'||tg==='TH',i:f.i||tg==='I'||tg==='EM',sub:f.sub||tg==='SUB',sup:f.sup||tg==='SUP'})); } } }); return out; }
function dxR(runs,base={}){ return runs.map(r=>r.br?'<w:r><w:br/></w:r>':`<w:r><w:rPr>${(r.b||base.b)?'<w:b/>':''}${(r.i||base.i)?'<w:i/>':''}${base.color?`<w:color w:val="${base.color}"/>`:''}${base.sz?`<w:sz w:val="${base.sz}"/>`:''}${r.sub?'<w:vertAlign w:val="subscript"/>':r.sup?'<w:vertAlign w:val="superscript"/>':''}</w:rPr><w:t xml:space="preserve">${xe(r.t)}</w:t></w:r>`).join(''); }
const dxP=(runs,o={})=>`<w:p>${o.style?`<w:pPr><w:pStyle w:val="${o.style}"/></w:pPr>`:''}${dxR(runs,o)}</w:p>`;
function dxTable(rows){ const nc=Math.max(...rows.map(r=>r.length),1), w=Math.floor(9000/nc), bd='<w:tblBorders>'+['top','left','bottom','right','insideH','insideV'].map(s=>`<w:${s} w:val="single" w:sz="4" w:space="0" w:color="BFC5CD"/>`).join('')+'</w:tblBorders>';
  return `<w:tbl><w:tblPr><w:tblW w:w="${w*nc}" w:type="dxa"/><w:tblLayout w:type="fixed"/>${bd}<w:tblCellMar><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${('<w:gridCol w:w="'+w+'"/>').repeat(nc)}</w:tblGrid>${rows.map((r,ri)=>`<w:tr>${Array.from({length:nc},(_,i)=>`<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/></w:tcPr><w:p><w:pPr><w:spacing w:after="0"/></w:pPr>${dxR(r[i]||[],{b:r.head,sz:18})}</w:p></w:tc>`).join('')}</w:tr>`).join('')}</w:tbl><w:p/>`; }
function htmlToDocx(root,title){ const body=[], media=[]; let img=0;
  const walk=el=>{ el.childNodes.forEach(n=>{ if(n.nodeType===3){ const t=n.data.trim(); if(t) body.push(dxP([{t}])); return; } if(n.nodeType!==1) return; const tg=n.tagName, c=n.classList;
    if(tg==='H1') body.push(dxP(dxRuns(n),{style:'Heading1'})); else if(tg==='H2'||tg==='H3') body.push(dxP(dxRuns(n),{style:'Heading2'}));
    else if(tg==='TABLE'){ const rows=[...n.querySelectorAll('tr')].map(tr=>{ const cells=[...tr.children].map(td=>{ const inp=td.querySelector('input,select'); return inp?[{t:inp.tagName==='SELECT'?(inp.options[inp.selectedIndex]||{}).text||'':inp.value}]:dxRuns(td); }); cells.head=!!tr.closest('thead')||[...tr.children].every(x=>x.tagName==='TH'); return cells; }); if(rows.length) body.push(dxTable(rows)); }
    else if(tg==='DL'){ const dts=[...n.querySelectorAll('dt')]; const rows=dts.map(dt=>[dxRuns(dt),dt.nextElementSibling?dxRuns(dt.nextElementSibling):[]]); if(rows.length) body.push(dxTable(rows)); }
    else if(tg==='IMG'&&/^data:image\/png;base64,/.test(n.src)){ img++; const bytes=b64u.dec(n.src.split(',')[1].replace(/\+/g,'-').replace(/\//g,'_')), wpx=n.naturalWidth||600, hpx=n.naturalHeight||400, d=window.devicePixelRatio||1, cw=Math.min(5760000,Math.round(wpx/d*9525)), ch=Math.round(cw*hpx/wpx); media.push({name:`word/media/image${img}.png`,data:bytes});
      body.push(`<w:p><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cw}" cy="${ch}"/><wp:docPr id="${img}" name="Afbeelding ${img}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${img}" name="image${img}.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdImg${img}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cw}" cy="${ch}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`); }
    else if(tg==='OL'||tg==='UL'){ [...n.children].forEach((li,i)=>body.push(dxP([{t:(tg==='OL'?(i+1)+'. ':'• ')},...dxRuns(li)]))); }
    else if(c.contains('big')) body.push(dxP(dxRuns(n),{b:true,sz:32})); else if(c.contains('lbl')||c.contains('meta')) body.push(dxP(dxRuns(n),{color:'5F6B7A',sz:18}));
    else if(c.contains('note')) body.push(dxP(dxRuns(n),{i:true})); else if(c.contains('src')||c.contains('formula')) body.push(dxP(dxRuns(n),{color:'5F6B7A',sz:16}));
    else if(tg==='P'||tg==='SPAN'||tg==='B'||tg==='SMALL') body.push(dxP(dxRuns(n))); else walk(n); }); };
  walk(root);
  const NS='xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
  const doc=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NS}><w:body>${body.join('')}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  const styles=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri" w:eastAsia="Calibri"/><w:sz w:val="21"/><w:szCs w:val="21"/><w:lang w:val="${LANG==='en'?'en-GB':'nl-NL'}"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="80" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="0" w:after="120"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:sz w:val="36"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="320" w:after="80"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:color w:val="1558B0"/><w:sz w:val="28"/></w:rPr></w:style></w:styles>`;
  const rels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>${media.map((m,i)=>`<Relationship Id="rIdImg${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image${i+1}.png"/>`).join('')}</Relationships>`;
  const ct=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`;
  const root_rels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`;
  const core=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xe(title)}</dc:title><dc:creator>Labkit BML</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString().replace(/\.\d+Z$/,'Z')}</dcterms:created></cp:coreProperties>`;
  return zipStore([{name:'[Content_Types].xml',data:ct},{name:'_rels/.rels',data:root_rels},{name:'docProps/core.xml',data:core},{name:'word/document.xml',data:doc},{name:'word/styles.xml',data:styles},{name:'word/_rels/document.xml.rels',data:rels},...media]); }

/* ================= FASE 1.7: DOM-VOLGORDE, TOEGANKELIJKHEID, CANVAS ================= */
{ const first=$('section.tool'), main=first&&first.parentNode; if(main){ const st=$('#t-start'); if(st) main.appendChild(st); $$('#nav > a').forEach(a=>{ const sec=$('#t-'+(a.getAttribute('href')||'').slice(1)); if(sec&&sec.parentNode===main&&sec!==st) main.appendChild(sec); }); } }
let a11yN=0;
function a11yFix(root){ (root||document).querySelectorAll('main input:not([type=hidden]),main select,main textarea').forEach(el=>{ if(el.hasAttribute('aria-label')||el.hasAttribute('aria-labelledby')) return; if(el.id&&document.querySelector(`label[for="${el.id}"]`)) return; if(el.closest('label')) return;
    const td=el.closest('td'); if(td){ const tb=td.closest('table'), th=tb&&tb.querySelectorAll('thead th')[td.cellIndex]; if(th&&th.textContent.trim()){ if(!th.id) th.id='lk-th-'+(++a11yN); el.setAttribute('aria-labelledby',th.id); return; } }
    const f=el.closest('.f'), lb=f&&f.querySelector('label'); if(lb){ if(!lb.id) lb.id='lk-lb-'+(++a11yN); el.setAttribute('aria-labelledby',lb.id); return; }
    if(el.tagName==='SELECT'&&el.closest('.inu')){ el.setAttribute('aria-label','Eenheid'); return; } if(el.placeholder){ el.setAttribute('aria-label',el.placeholder); return; } el.setAttribute('aria-label',el.type==='file'?'Bestand kiezen':el.closest('th')?'Naam kolom':el.closest('td')?'Waarde':'Invoer'); }); }
a11yFix(); lkMainWatch(()=>a11yFix($('#t-'+current)||document),200); /* na de eerste ronde alleen de actieve tool: daar verandert de inhoud */
/* canvas dat in een verborgen sectie 0×0 is getekend: opnieuw tekenen zodra de sectie zichtbaar is */
window.addEventListener('hashchange',()=>requestAnimationFrame(()=>{ const sec=$('#t-'+current); if(sec&&calc[current]&&[...sec.querySelectorAll('canvas')].some(c=>c.style.display!=='none'&&(!c.width||!c.height))){ try{ calc[current](); }catch(e){} } }));

/* ================= FASE 2.1: SYNONIEMEN, SNELTOETS EN FAVORIETEN IN DE NAVIGATIE ================= */
const SYN={curve:'bradford bca lowry elisa kalibratielijn ijklijn 4pl lod loq eiwitbepaling',spec:'lambert-beer extinctie absorptie a280 molaire extinctiecoëfficiënt',enzym:'lineweaver-burk michaelis-menten hanes-woolf eadie-hofstee km vmax kcat ki remmer inhibitor',telkamer:'bürker burker neubauer fuchs-rosenthal hemocytometer trypaanblauw',hh:'henderson-hasselbalch pka zuur base buffer',verdunning:'c1v1 c2v2 stock verdunnen',oplossing:'pbs tbe tae tris recept hydraat molariteit afwegen',reeks:'kve cfu tntc plaattelling iso 7218 kolonies',dna:'nanodrop a260 a280 a230 zuiverheid',pcr:'mastermix taq dntp primers',pcrcyclus:'annealing tm thermocycler',qpcr:'ddct pfaffl ct cq delta',gel:'agarose tae tbe ladder marker bp',ligatie:'t4 ligase insert vector molaire verhouding',transf:'transformatie-efficiëntie competente cellen heat shock',rmp:'random match probability matchkans str',mic:'mic mbc eucast sir remzone antibiogram',groei:'od600 generatietijd lag log fase',sds:'sds-page laemmli laadbuffer polyacrylamide',wb:'western blot densitometrie normalisatie housekeeping',centrifuge:'rcf rpm g-kracht rotor',molm:'molmassa molecuulmassa formule',units:'molair ppm procent omrekenen',stat:'t-toets anova tukey grubbs dixon chi-kwadraat regressie',mpn:'most probable number',westgard:'levey-jennings qc controlekaart',pmi:'henssge postmortaal interval',kin:'vaderschap paternity',ic50:'ec50 dosis-respons hill',titr:'equivalentiepunt naoh hcl',widmark:'promillage alcohol bac',digest:'restrictie-enzym bamhi ecori hindiii psti ndei xhoi noti smai star activity',purif:'ammoniumsulfaat zuiveringstabel opbrengst yield ni-nta sec',gradient:'gradiënt-pcr annealing thermocycler kolommen',elisa:'sandwich elisa od450 plaatlezer 4pl',facs:'flowcytometrie antilichaam fmo compensatie stain index counting beads',mix:'mengprofiel likelihood ratio lr mixture ratio balding-nichols'};
document.addEventListener('keydown',e=>{ if(e.key!=='/'||e.ctrlKey||e.metaKey||e.altKey) return; const t=document.activeElement; if(t&&(t.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(t.tagName))) return; if(document.querySelector('.lk-modal')) return; e.preventDefault(); const q=$('#nav-q'); if(q){ q.focus(); q.select(); } });
function navFavs(){ const nav=$('#nav'); nav.querySelectorAll('[data-navfav]').forEach(x=>x.remove()); const fav=jget(FKEY,[]).filter(id=>$('#t-'+id)); const firstGroup=nav.querySelector('.navgroup'); if(!firstGroup) return;
  $$('#nav > a').forEach(a=>{ const id=(a.getAttribute('href')||'').slice(1); if(!id||id==='start') return; a.classList.add('lk-fa'); a.classList.toggle('lk-fav',fav.includes(id)); });
  if(!fav.length) return; const g=document.createElement('div'); g.className='navgroup'; g.dataset.navfav=''; g.textContent='Favorieten'; nav.insertBefore(g,firstGroup);
  fav.forEach(id=>{ const src=nav.querySelector(`a[href="#${id}"]:not([data-navfav])`); if(!src) return; const a=src.cloneNode(true); a.dataset.navfav=''; a.classList.remove('active'); nav.insertBefore(a,firstGroup); }); }
/* klik op de ster rechts in een navigatielink (laatste 26 px) zet de favoriet aan of uit */
$('#nav').addEventListener('click',e=>{ const a=e.target.closest('a.lk-fa'); if(!a) return; const r=a.getBoundingClientRect(); if(e.clientX<r.right-26) return; e.preventDefault(); e.stopPropagation(); let f=jget(FKEY,[]); const id=a.getAttribute('href').slice(1); f=f.includes(id)?f.filter(x=>x!==id):[...f,id]; jset(FKEY,f); navFavs(); if(calc.start) calc.start(); },true);
$('#nav').addEventListener('keydown',e=>{ if(e.key!=='f'&&e.key!=='F') return; const a=e.target.closest&&e.target.closest('a.lk-fa'); if(!a) return; e.preventDefault(); let f=jget(FKEY,[]); const id=a.getAttribute('href').slice(1); f=f.includes(id)?f.filter(x=>x!==id):[...f,id]; jset(FKEY,f); navFavs(); });
{ const st=document.createElement('style'); st.textContent='#nav a.lk-fa{position:relative;padding-right:26px}#nav a.lk-fa::after{content:"☆";position:absolute;right:8px;top:50%;transform:translateY(-50%);color:var(--muted);font-size:13px;opacity:0;cursor:pointer}#nav a.lk-fa:hover::after,#nav a.lk-fa:focus::after{opacity:.8}#nav a.lk-fav::after{content:"★";opacity:1;color:var(--warn)}.lk-send{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:10px;font-size:13px;color:var(--muted)}'; document.head.appendChild(st); }
navFavs();

/* ================= FASE 2.2: DOORSTUREN NAAR EEN VERVOLGTOOL ================= */
const bigNum=el=>{ if(!el) return NaN; const c=el.cloneNode(true); c.querySelectorAll('small,.chip').forEach(x=>x.remove()); const t=c.innerHTML.replace(/<sup>(.*?)<\/sup>/g,'e$1').replace(/<[^>]+>/g,'').replace(/−/g,'-').replace(/\s*×\s*10e/,'e').replace(/&[a-z]+;/g,''); const m=t.match(/-?[\d.]+(?:,\d+)?(?:e-?\d+)?/); if(!m) return NaN; return Number(m[0].replace(/\.(?=\d{3}(\D|$))/g,'').replace(',','.')); };
const setV=(id,v)=>{ const el=$('#'+id); if(!el) return; el.value=typeof v==='number'?String(Number(v.toPrecision(5))).replace('.',','):v; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); };
const addRow=(tbl,row,tool)=>{ const tb=$('#'+tbl+' tbody'), def=TBLDEF[tbl]; if(!tb||!def) return;
  /* een tabel die Vue rendert geeft een push() mee: innerHTML erbij zetten zou Vue bij de
     volgende render terugdraaien */
  if(def.push){ def.push(row); if(calc[tool]) calc[tool](); return; }
  const empty=[...tb.rows].find(r=>[...r.querySelectorAll('input')].every(i=>!i.value.trim())); if(empty) empty.remove(); tb.insertAdjacentHTML('beforeend',def.row(row)); if(calc[tool]) calc[tool](); };
const SEND={
  dna:{out:'#n-out',get:()=>bigNum($('#n-out .big')),to:[
    ['PCR-mastermix','pcr',c=>{ const ng=num($('#m-ng').value)>0?num($('#m-ng').value):10, v=ng/c; setV('q-t',Math.max(Number(v.toPrecision(3)),0.01)); return `Template per reactie: ${vol(v)} (= ${sig(ng,3)} ng bij ${sig(c,3)} ng/µL).`; }],
    ['Ligatie: vector','ligatie',c=>{ setV('l-vc',c); return `Concentratie vector: ${sig(c,3)} ng/µL.`; }],
    ['Ligatie: insert','ligatie',c=>{ setV('l-ic',c); return `Concentratie insert: ${sig(c,3)} ng/µL.`; }],
    ['cDNA-synthese','cdna',c=>{ addRow('cd-tbl',['Monster '+($$('#cd-tbl tbody tr').length+1),c],'cdna'); return `Monster toegevoegd met ${sig(c,3)} ng/µL.`; }]]},
  telkamer:{out:'#k-out',get:()=>bigNum($('#k-out .big')),to:[
    ['Cellen uitzaaien','seed',c=>{ setV('sd-c',c); return `Celconcentratie: ${sci(c,3)} cellen/mL.`; }],
    ['Inoculum','inoc',c=>{ const od=(num($('#io-od').value)-(num($('#io-bl').value)||0))*(num($('#io-df').value)||1); if(!(od>0)) return 'Vul bij Inoculum eerst de gemeten OD₆₀₀ van dezelfde cultuur in.'; setV('io-fac',c/od); return `Cellen/mL bij OD 1,0: ${sci(c/od,3)} (uit de telling en de gemeten OD).`; }]]},
  molm:{out:'#mm-out',get:()=>bigNum($('#mm-out .big')),to:[
    ['Oplossing & buffer','oplossing',m=>{ addRow('o-tbl',[$('#mm-f').value.trim(),Number(m.toFixed(3)),NaN,'mM'],'oplossing'); return `Rij toegevoegd: ${sig(m,6)} g/mol.`; }]]}
};
function sendBar(tool){ const S=SEND[tool], out=$(S.out); if(!out||out.querySelector('.lk-send')) return; const v=S.get(); if(!(v>0)) return; out.insertAdjacentHTML('beforeend',`<div class="lk-send"><span>Stuur door naar</span>${S.to.map((t,i)=>`<button type="button" data-send="${tool}:${i}">${t[0]}</button>`).join('')}</div>`); }
Object.keys(SEND).forEach(tool=>{ const f=calc[tool]; calc[tool]=function(e){ const r=f.call(this,e); try{ sendBar(tool); }catch(err){} return r; }; });
document.addEventListener('click',e=>{ const b=e.target.closest('[data-send]'); if(b){ const [tool,i]=b.dataset.send.split(':'), S=SEND[tool], t=S.to[+i], v=S.get(); if(!(v>0)) return; const msg=t[2](v); location.hash='#'+t[1]; alertBox(msg); return; }
  const c=e.target.closest('[data-send-curve]'); if(!c) return; const unit=$('#s-unit').value, f=unit==='µg/mL'||unit==='ng/µL'?1e-3:unit==='mg/mL'||unit==='µg/µL'||unit==='g/L'?1:NaN;
  const R=$$('#s-unk tbody tr').map(tr=>{ const cells=[...tr.cells], nm=(tr.querySelector('input.txt')||tr.querySelector('input')||{}).value||'', last=cells.filter(td=>!td.querySelector('input,button,select')&&/\d/.test(td.textContent)).pop(); return [nm,last?bigNum(last):NaN]; }).filter(r=>r[0]&&r[1]>0);
  if(!R.length){ alertBox('Geen berekende monsterconcentraties om door te sturen.'); return; }
  if(c.dataset.sendCurve==='sds'){ if(!isFinite(f)){ alertBox(`SDS-PAGE rekent in µg/µL; de eenheid ${unit} is niet om te rekenen.`); return; } TBLDEF['ss-tbl'].set(R.map(r=>[r[0],Number((r[1]*f).toPrecision(4))])); /* Vue-tabel: set() zet de rijen */ location.hash='#sds'; alertBox(`${R.length} monsters doorgestuurd (in µg/µL).`); }
  else { TBLDEF['wb-tbl'].set(R.map(r=>[r[0],NaN,NaN,'0'])); /* Vue-tabel: set() zet de rijen */ location.hash='#wb'; alertBox(`${R.length} monsternamen doorgestuurd; vul de bandintensiteiten in.`); } });

/* ================= FASE 2.3: BEREKENINGSLINK IN DE URL-HASH ================= */
function calcLink(id){ const s=toolSnap(id); if(!s) return ''; const q=Object.entries(s.v).filter(([k,v])=>v!==''&&v!==false).map(([k,v])=>encodeURIComponent(k)+'='+encodeURIComponent(v===true?'1':v)); const tb=Object.keys(s.tb||{}).length?'&_t='+encodeURIComponent(JSON.stringify(s.tb)):''; return `${shareBase()}#${id}?${q.join('&')}${tb}`; }
function hashParams(){ const h=(location.hash||'').slice(1), i=h.indexOf('?'); if(i<0) return; const id=h.slice(0,i); if(!TOOLS.includes(id)) return; const v={}, P=new URLSearchParams(h.slice(i+1)); let tb={}; for(const [k,val] of P){ if(k==='_t'){ try{ tb=JSON.parse(val); }catch(e){} } else { const el=document.getElementById(k); v[k]=el&&el.type==='checkbox'?val==='1':val; } }
  const sec=$('#t-'+id); sec.querySelectorAll('input[type=checkbox]').forEach(el=>{ if(persistable(el)&&!(el.id in v)) v[el.id]=false; }); toolApply({t:id,v,tb}); undoReset(id); }
window.addEventListener('hashchange',hashParams); window.addEventListener('load',()=>setTimeout(hashParams,60));
$$('.lk-tbar').forEach(bar=>{ const id=bar.querySelector('[data-share]').dataset.share; bar.insertAdjacentHTML('beforeend',`<button type="button" class="ghost" data-clink="${id}" title="Kopieert een link met de huidige invoer in de adresbalk-notatie (#tool?veld=waarde)">Kopieer berekeningslink</button>`); });
document.addEventListener('click',e=>{ const b=e.target.closest('[data-clink]'); if(!b) return; const id=b.dataset.clink; let url=calcLink(id); const done=()=>flashBtn(b,'Gekopieerd'); const go=u=>(navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(done).catch(()=>{ const m=appModal(`<p style="margin:0 0 8px">Kopieer de link:</p><input class="lk-url" data-notr="" readonly style="width:100%" value="${esc(u)}">`); const i=m.box.querySelector('input'); i.focus(); i.select(); });
  if(url.length>1900) shareEncode(toolSnap(id)).then(c=>go(`${shareBase()}?d=${c}#${id}`)); else go(url); });

/* ================= FASE 2.4: PIPETTEERGRENS IN ANDERE TOOLS ================= */
function pipScan(tool){ const sec=$('#t-'+tool); if(!sec) return; sec.querySelectorAll('.lk-pip').forEach(x=>x.remove()); let best=null; const tx=el=>{ const c=el.cloneNode(true); c.querySelectorAll('.pip').forEach(x=>x.remove()); return c.textContent.trim(); }; const take=(el,lab)=>{ const m=tx(el).match(/^(0[,.]\d+)\s*µL$/); if(!m) return; const v=Number(m[1].replace(',','.')); if(v>0&&v<1&&(!best||v<best.v)) best={v,lab,el}; };
  sec.querySelectorAll('.result table, .panel table').forEach(t=>{ [...t.tBodies].forEach(tb=>[...tb.rows].forEach(r=>{ const cs=[...r.cells].filter(c=>!c.querySelector('input,select,button')&&/µL$/.test(tx(c))); if(cs.length) take(cs[cs.length-1],(r.cells[0].querySelector('input')||{}).value||r.cells[0].textContent.trim()); })); });
  sec.querySelectorAll('.result dl.kv dd, .result .big').forEach(dd=>{ const c=dd.cloneNode(true); c.querySelectorAll('small,.chip').forEach(x=>x.remove()); const fake={textContent:c.textContent}; take(fake,dd.previousElementSibling&&dd.previousElementSibling.tagName==='DT'?dd.previousElementSibling.textContent.trim():''); });
  if(!best) return; const host=sec.querySelector('.result'); if(!host) return; const d=document.createElement('div'); d.className='lk-pip'; d.innerHTML=pipAdvies(best.v,best.lab?ud(best.lab):''); host.appendChild(d); }
['pcr','ligatie','sds','cdna','oligo'].forEach(tool=>{ const f=calc[tool]; if(!f) return; calc[tool]=function(e){ const r=f.call(this,e); try{ pipScan(tool); }catch(err){} return r; }; });

/* ================= FASE 2.6: GRAFIEK VOOR VERSLAG (WIT, 300 DPI) ================= */
function pngDpi(u8,dpi){ const ppm=Math.round(dpi/0.0254), d=new Uint8Array(21), dv=new DataView(d.buffer); dv.setUint32(0,9); d.set([0x70,0x48,0x59,0x73],4); dv.setUint32(8,ppm); dv.setUint32(12,ppm); d[16]=1; dv.setUint32(17,crc32(d.subarray(4,17))); const out=new Uint8Array(u8.length+21); out.set(u8.subarray(0,33)); out.set(d,33); out.set(u8.subarray(33),54); return out; }
/* poster (S88): zelfde route, maar tijdelijk stijl 'poster' (grote letters, dikke lijnen) en 6x resolutie */
function reportPng(cv,noTitle,poster){ const tool=(cv.closest('section.tool')||{dataset:{}}).dataset.tool, root=document.documentElement, th=root.getAttribute('data-theme'), S=poster?6:3, keyWas=chStyleKey; let img=null; if(poster) chStyleKey='poster';
  if(cv._p){ const c=document.createElement('canvas'); window.__noTitle=!!noTitle; try{ pRender(c,cv._p.W,cv._p.H,cv._p.draw,S); }finally{ window.__noTitle=false; } img=c; }
  else { try{ root.removeAttribute('data-theme'); Object.defineProperty(window,'devicePixelRatio',{get:()=>S,configurable:true}); if(calc[tool]) calc[tool](); const c=document.createElement('canvas'); c.width=cv.width; c.height=cv.height; const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,c.width,c.height); x.drawImage(cv,0,0); img=c; } finally { delete window.devicePixelRatio; chStyleKey=keyWas; if(th) root.setAttribute('data-theme',th); try{ if(calc[tool]) calc[tool](); }catch(e){} } }
  chStyleKey=keyWas;
  if(noTitle&&cv._p){ const cut=34*S, c2=document.createElement('canvas'); c2.width=img.width; c2.height=img.height-cut; c2.getContext('2d').drawImage(img,0,-cut); img=c2; }
  return new Promise(res=>img.toBlob(b=>b.arrayBuffer().then(ab=>res(new Blob([pngDpi(new Uint8Array(ab),300)],{type:'image/png'}))),'image/png')); }
function reportBtns(){ $$('main canvas').forEach(cv=>{ if(cv.id==='gf-cv') return; const bar=cv.nextElementSibling; if(!bar||!bar.classList.contains('xlbar')) return;
  if(!bar.querySelector('[data-fig]')) bar.insertAdjacentHTML('beforeend',`<button type="button" class="xlbtn" data-fig title="${esc(trPlain('Zet deze grafiek in de Figuurmaker, om er met andere uitkomsten één figuur van te maken'))}">→ ${trPlain('Figuur')}</button>`);
  if(cv._chart&&cv.id&&!bar.querySelector('[data-ched]')) bar.insertAdjacentHTML('beforeend',`<button type="button" class="xlbtn" data-ched title="${esc(trPlain('Titels, bereik, logaritmische as, legenda en kleuren van deze grafiek; blijft bewaard'))}">✎ ${trPlain('Aanpassen')}</button>`); if(cv._data&&!bar.querySelector('[data-tbl-tog]')) bar.insertAdjacentHTML('beforeend',`<button type="button" class="xlbtn" data-tbl-tog title="${esc(trPlain('Toont of verbergt de getallen achter de grafiek als tabel onder de grafiek'))}">${trPlain(cv._tblOn?'Tabel verbergen':'Tabel tonen')}</button>`); if(cv._tblOn) dataTable(cv); if(!bar.querySelector('[data-poster]')) bar.insertAdjacentHTML('afterbegin',`<button type="button" class="xlbtn" data-poster title="${esc(trPlain('PNG voor een poster: grote letters en dikke lijnen op wit, zes keer de schermresolutie'))}">${trPlain('Poster')}</button>`); if(!bar.querySelector('[data-rep]')) bar.insertAdjacentHTML('afterbegin',`<button type="button" class="xlbtn" data-rep title="${esc(trPlain('PNG op een witte achtergrond met donkere assen, drie keer de schermresolutie (300 dpi), ook in het donkere thema'))}">${trPlain('Download voor verslag (wit, 300 dpi)')}</button>`); const nx=bar.nextElementSibling; if(!SVGSKIP.includes(cv.id)&&!(nx&&nx.classList.contains('pic-bar'))&&!bar.querySelector('[data-xl-svg]')) bar.insertAdjacentHTML('beforeend',`<button type="button" class="xlbtn" data-xl-svg title="${esc(trPlain('Vectorgrafiek op een witte achtergrond, te openen in Inkscape of Illustrator'))}">SVG</button>`); if(cv._p&&!bar.querySelector('[data-rep-nt]')) bar.insertAdjacentHTML('afterbegin',`<label class="chk" style="font-size:12px;margin-right:auto" title="${esc(trPlain('Figuurtitels horen in het onderschrift onder de figuur'))}"><input type="checkbox" data-rep-nt> ${trPlain('zonder titel')}</label>`); }); }
/* SVG van een grafiek (S82): de tool tekent zichzelf opnieuw, maar met de opnemende tekencontext van 01_pic.js
   in plaats van het canvas; zo komt ook alles mee wat een tool na chart() zelf bijtekent. Zoals reportPng:
   licht thema, schaal 1. Tekeningen met pShow() (cv._p) worden direct opnieuw afgespeeld. */
const SVGSKIP=['gf-cv','gf-vlcv','sg-cv','k-pcv','r-pcv'];
function chartSvg(cv){ const tool=(cv.closest('section.tool')||{dataset:{}}).dataset.tool, root=document.documentElement, th=root.getAttribute('data-theme'), r=svgRec(0,0); let svg;
  if(cv._p){ r.textBaseline='middle'; cv._p.draw(r,cv._p.W,cv._p.H); svg=r.toSVG('#ffffff',cv._p.W,cv._p.H); }
  else { try{ root.removeAttribute('data-theme'); Object.defineProperty(window,'devicePixelRatio',{get:()=>1,configurable:true}); cv.getContext=()=>r; if(calc[tool]) calc[tool](); svg=r.toSVG('#ffffff',cv.width,cv.height); }
    finally{ delete cv.getContext; delete window.devicePixelRatio; if(th) root.setAttribute('data-theme',th); try{ if(calc[tool]) calc[tool](); }catch(e){} } }
  if(!/<(path|text)\b/.test(svg)) throw new Error('lege tekening'); return svg; }
document.addEventListener('click',e=>{ const b=e.target.closest('[data-xl-svg]'); if(!b) return; const cv=b.parentNode.previousElementSibling; if(!cv||cv.tagName!=='CANVAS') return;
  try{ saveBlob(`${(cv.closest('section.tool')||{dataset:{}}).dataset.tool||'grafiek'}.svg`,new Blob([chartSvg(cv)],{type:'image/svg+xml'})).catch(()=>{}); }
  catch(err){ alertBox(trPlain('Deze tekening kan niet als SVG worden opgeslagen; gebruik PNG.')); } });
document.addEventListener('click',e=>{ const b=e.target.closest('[data-tbl-tog]'); if(!b) return; const cv=b.parentNode.previousElementSibling; if(!cv||cv.tagName!=='CANVAS') return;
  cv._tblOn=!cv._tblOn; b.textContent=trPlain(cv._tblOn?'Tabel verbergen':'Tabel tonen'); dataTable(cv); });
lkMainWatch(reportBtns,150); setTimeout(reportBtns,300);
/* ================= GRAFIEK AANPASSEN (S83) =================
   Het venster bij ✎: de keuzes gaan per canvas-id naar localStorage 'lkChartEd' (src/lib/chart.js legt ze
   over de opties van de tool); daarna tekent de tool zichzelf opnieuw. Leeg = wat de tool zelf kiest. */
function chEdOpen(cv){ const tool=(cv.closest('section.tool')||{dataset:{}}).dataset.tool, all=jget('lkChartEd',{}), e=all[cv.id]||{}, info=cv._chart||{series:[]}, bar=!!info.bar;
  const v=k=>esc(e[k]==null?'':String(e[k])), sel=(k,opts)=>`<select data-k="${k}">${opts.map(([val,lab])=>`<option value="${val}"${(e[k]||'')===val?' selected':''}>${lab}</option>`).join('')}</select>`;
  const cs=getComputedStyle(document.documentElement), hex=c=>{ const s=(c||'').startsWith('--')?cs.getPropertyValue(c).trim():c; return /^#[0-9a-f]{6}$/i.test(s)?s:'#1558b0'; };
  const fld=(k,lab,ph)=>`<div class="f"><label>${lab}</label><input class="txt" data-k="${k}" value="${v(k)}" placeholder="${ph||''}"></div>`;
  const m=appModal(`<h3 style="margin:0 0 10px;font-size:16px">Grafiek aanpassen</h3>
    <div class="fields">${fld('ti','Titel boven de grafiek')}${bar?'':fld('xl','Titel x-as','zoals de tool')}${fld('yl','Titel y-as','zoals de tool')}</div>
    ${bar?`<div class="fields">${fld('ymax','Y-as tot','automatisch')}</div>`:`<div class="fields">${fld('xmin','X-as van','automatisch')}${fld('xmax','X-as tot','automatisch')}${fld('ymin','Y-as van','automatisch')}${fld('ymax','Y-as tot','automatisch')}</div>
    <div class="fields"><div class="f"><label>X-as</label>${sel('lx',[['','zoals de tool'],['lin','lineair'],['log','logaritmisch']])}</div><div class="f"><label>Y-as</label>${sel('ly',[['','zoals de tool'],['lin','lineair'],['log','logaritmisch']])}</div>
    <div class="f"><label>Legenda</label>${sel('lg',[['','zoals de tool'],['tl','linksboven'],['tr','rechtsboven'],['bl','linksonder'],['br','rechtsonder'],['none','verbergen']])}</div></div>`}
    <div class="row" style="gap:10px;margin-top:8px;flex-wrap:wrap">${info.series.slice(0,8).map((s,i)=>`<label class="chk" style="gap:6px"><input type="color" data-col="${i}" value="${hex((e.col||[])[i]||s.color)}" style="width:40px;height:26px;padding:1px"><span data-notr>${esc(trPlain(s.name))}</span></label>`).join('')}</div>
    ${bar?'':`<h4 style="margin:14px 0 6px;font-size:14px">Aantekeningen</h4>
    <div class="fields"><div class="f"><label>Soort</label><select data-a="t"><option value="text">tekst</option><option value="arrow">pijl</option><option value="hline">horizontale lijn</option><option value="vline">verticale lijn</option></select></div>
    <div class="f"><label>x</label><input class="txt" data-a="x" inputmode="decimal"></div><div class="f"><label>y</label><input class="txt" data-a="y" inputmode="decimal"></div>
    <div class="f"><label>x einde pijl</label><input class="txt" data-a="x2" inputmode="decimal"></div><div class="f"><label>y einde pijl</label><input class="txt" data-a="y2" inputmode="decimal"></div>
    <div class="f"><label>Tekst</label><input class="txt" data-a="s"></div></div>
    <div class="row" style="gap:6px;margin-top:6px"><button type="button" data-ann-add>Aantekening toevoegen</button><span class="muted" style="font-size:12px">Horizontale lijn: alleen y; verticale lijn: alleen x.</span></div>
    <div data-ann-list style="margin-top:6px"></div>
    <h4 style="margin:14px 0 6px;font-size:14px">Eerdere runs</h4>
    <div class="row" style="gap:6px"><input class="txt" data-rn placeholder="Naam van de run" style="max-width:180px"><button type="button" data-run-add>Run bewaren</button></div>
    <div data-run-list style="margin-top:6px"></div>`}
    <div class="row" style="margin-top:14px;gap:6px"><button type="button" class="primary" data-ok>Toepassen</button><button type="button" data-reset>Terug naar standaard</button><button type="button" data-no>Annuleren</button></div>`);
  const redraw=()=>{ try{ if(calc[tool]) calc[tool](); }catch(err){} }, B=m.box, touched=new Set();
  B.querySelectorAll('[data-col]').forEach(el=>el.addEventListener('input',()=>touched.add(+el.dataset.col)));
  const ann=(e.ann||[]).slice(), runs=(e.runs||[]).map(r=>({...r})), AN={text:'tekst',arrow:'pijl',hline:'horizontale lijn',vline:'verticale lijn'};
  const lists=()=>{ const al=B.querySelector('[data-ann-list]'), rl=B.querySelector('[data-run-list]'); if(!al) return;
    al.innerHTML=ann.map((a,i)=>`<div class="row" style="gap:8px"><span>${AN[a.t]}</span><span data-notr>${esc([a.x,a.y,a.x2,a.y2].filter(z=>z!=null).map(z=>String(z).replace('.',',')).join('; ')+(a.s?' · '+a.s:''))}</span><button type="button" data-ann-del="${i}" aria-label="Verwijderen">✕</button></div>`).join('');
    rl.innerHTML=runs.map((r,i)=>`<div class="row" style="gap:8px"><label class="chk"><input type="checkbox" data-run-on="${i}"${r.on===false?'':' checked'}><span data-notr>${esc(r.name)}</span></label><span class="muted" data-notr>${r.pts.length}</span><button type="button" data-run-del="${i}" aria-label="Verwijderen">✕</button></div>`).join(''); tStatic(al); tStatic(rl); };
  lists();
  B.addEventListener('click',ev=>{ const t=ev.target;
    if(t.matches('[data-ann-del]')){ ann.splice(+t.dataset.annDel,1); lists(); }
    else if(t.matches('[data-run-del]')){ runs.splice(+t.dataset.runDel,1); lists(); }
    else if(t.matches('[data-ann-add]')){ const g=k=>B.querySelector('[data-a='+k+']').value.trim(), n=k=>g(k)===''?NaN:num(g(k)), a={t:g('t'),s:g('s')};
      const need={text:['x','y'],arrow:['x','y','x2','y2'],hline:['y'],vline:['x']}[a.t]; if(need.some(k=>!isFinite(n(k)))) return; need.forEach(k=>a[k]=n(k)); if(ann.length<30){ ann.push(a); lists(); } }
    else if(t.matches('[data-run-add]')){ const pts=((cv._data&&cv._data.rows)||[]).filter(r=>isFinite(r[1])&&isFinite(r[2])).slice(0,2000).map(r=>[r[1],r[2]]); if(!pts.length||runs.length>=5) return;
      const nm=B.querySelector('[data-rn]'); runs.push({name:nm.value.trim()||('Run '+(runs.length+1)),pts,on:true}); nm.value=''; lists(); }
    else if(t.matches('[data-run-on]')) runs[+t.dataset.runOn].on=t.checked; });
  B.querySelector('[data-no]').addEventListener('click',m.close);
  B.querySelector('[data-reset]').addEventListener('click',()=>{ const a=jget('lkChartEd',{}); delete a[cv.id]; jset('lkChartEd',a); m.close(); redraw(); });
  B.querySelector('[data-ok]').addEventListener('click',()=>{ const n={}; B.querySelectorAll('[data-k]').forEach(el=>{ if(el.value.trim()) n[el.dataset.k]=el.value.trim(); });
    const col=(e.col||[]).slice(); B.querySelectorAll('[data-col]').forEach(el=>{ const i=+el.dataset.col; if(touched.has(i)) col[i]=el.value; }); if(col.some(Boolean)) n.col=col; if(ann.length) n.ann=ann; if(runs.length) n.runs=runs;
    const a=jget('lkChartEd',{}); if(Object.keys(n).length) a[cv.id]=n; else delete a[cv.id]; jset('lkChartEd',a); m.close(); redraw(); }); }
/* naar de Figuurmaker (S89): de PNG zoals "Download voor verslag" (wit, 300 dpi) en waar het kan de SVG */
async function figFromCanvas(cv){ const sec=cv.closest('section.tool'), name=sec?(sec.querySelector('.tool-head h2')||{}).textContent||'':''; let svg='';
  if(!SVGSKIP.includes(cv.id)) try{ svg=chartSvg(cv); }catch(x){}
  const png=await reportPng(cv,false,false), dpr=window.devicePixelRatio||1;
  return figAdd({png,svg,w:cv._p?cv._p.W:Math.round(cv.width/dpr),h:cv._p?cv._p.H:Math.round(cv.height/dpr),name}); }
document.addEventListener('click',e=>{ const b=e.target.closest('[data-fig]'); if(!b) return; const cv=b.parentNode.previousElementSibling; if(!cv||cv.tagName!=='CANVAS') return;
  figFromCanvas(cv).then(()=>flashBtn(b,'Toegevoegd')).catch(()=>flashBtn(b,'Lukte niet')); });
document.addEventListener('click',e=>{ const b=e.target.closest('[data-ched]'); if(!b) return; const cv=b.parentNode.previousElementSibling; if(cv&&cv.tagName==='CANVAS') chEdOpen(cv); });
document.addEventListener('click',e=>{ const b=e.target.closest('[data-poster]'); if(!b) return; const cv=b.parentNode.previousElementSibling; if(!cv||cv.tagName!=='CANVAS'||!cv.width) return; reportPng(cv,false,true).then(blob=>saveBlob(`${(cv.closest('section.tool')||{dataset:{}}).dataset.tool||'grafiek'}-poster.png`,blob)).catch(()=>{}); });
document.addEventListener('click',e=>{ const b=e.target.closest('[data-rep]'); if(!b) return; const bar=b.parentNode, cv=bar.previousElementSibling; if(!cv||cv.tagName!=='CANVAS'||!cv.width) return; const nt=bar.querySelector('[data-rep-nt]'); reportPng(cv,nt&&nt.checked).then(blob=>saveBlob(`${(cv.closest('section.tool')||{dataset:{}}).dataset.tool||'grafiek'}-verslag.png`,blob)).catch(()=>{}); });

/* alles hierboven ook als globale naam, live (zie src/lib/global.js) */
live({
  chEdOpen: [() => chEdOpen, v => { chEdOpen = v; }],
  figFromCanvas: [() => figFromCanvas, v => { figFromCanvas = v; }],
  QR_ECC: () => QR_ECC,
  QR_BLK: () => QR_BLK,
  qrRaw: [() => qrRaw, v => { qrRaw = v; }],
  qrAlign: [() => qrAlign, v => { qrAlign = v; }],
  QR_EXP: () => QR_EXP,
  QR_LOG: () => QR_LOG,
  qrMul: () => qrMul,
  qrRS: [() => qrRS, v => { qrRS = v; }],
  qrMatrix: [() => qrMatrix, v => { qrMatrix = v; }],
  drawQR: [() => drawQR, v => { drawQR = v; }],
  qrSvg: [() => qrSvg, v => { qrSvg = v; }],
  appModal: [() => appModal, v => { appModal = v; }],
  fold: () => fold,
  cmdItems: [() => cmdItems, v => { cmdItems = v; }],
  cmdRun: [() => cmdRun, v => { cmdRun = v; }],
  cmdOpen: [() => cmdOpen, v => { cmdOpen = v; }],
  toolSnap: [() => toolSnap, v => { toolSnap = v; }],
  toolApply: [() => toolApply, v => { toolApply = v; }],
  b64u: () => b64u,
  shareEncode: [() => shareEncode, v => { shareEncode = v; }],
  shareDecode: [() => shareDecode, v => { shareDecode = v; }],
  shareBase: [() => shareBase, v => { shareBase = v; }],
  shareOpen: [() => shareOpen, v => { shareOpen = v; }],
  UNDO: () => UNDO,
  undoBusy: [() => undoBusy, v => { undoBusy = v; }],
  undoTimer: [() => undoTimer, v => { undoTimer = v; }],
  undoReset: [() => undoReset, v => { undoReset = v; }],
  undoRec: [() => undoRec, v => { undoRec = v; }],
  undoDo: [() => undoDo, v => { undoDo = v; }],
  undoBtns: [() => undoBtns, v => { undoBtns = v; }],
  CRCT: () => CRCT,
  crc32: [() => crc32, v => { crc32 = v; }],
  zipStore: [() => zipStore, v => { zipStore = v; }],
  xe: () => xe,
  dxRuns: [() => dxRuns, v => { dxRuns = v; }],
  dxR: [() => dxR, v => { dxR = v; }],
  dxP: () => dxP,
  dxTable: [() => dxTable, v => { dxTable = v; }],
  htmlToDocx: [() => htmlToDocx, v => { htmlToDocx = v; }],
  a11yN: [() => a11yN, v => { a11yN = v; }],
  a11yFix: [() => a11yFix, v => { a11yFix = v; }],
  SYN: () => SYN,
  navFavs: [() => navFavs, v => { navFavs = v; }],
  bigNum: () => bigNum,
  setV: () => setV,
  addRow: () => addRow,
  SEND: () => SEND,
  sendBar: [() => sendBar, v => { sendBar = v; }],
  calcLink: [() => calcLink, v => { calcLink = v; }],
  hashParams: [() => hashParams, v => { hashParams = v; }],
  pipScan: [() => pipScan, v => { pipScan = v; }],
  pngDpi: [() => pngDpi, v => { pngDpi = v; }],
  reportPng: [() => reportPng, v => { reportPng = v; }],
  SVGSKIP: () => SVGSKIP,
  chartSvg: [() => chartSvg, v => { chartSvg = v; }],
  reportBtns: [() => reportBtns, v => { reportBtns = v; }]
});
