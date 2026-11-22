/* Letterlijk overgenomen uit tools/nt/62_report.js (S269): een classic script dat als module in de bundel staat
   en zijn namen live op window zet, zodat de andere code ze als globale namen blijft lezen. */
import {live} from '../../lib/global.js';

/* ================= RAPPORT / LABJOURNAAL =================
   De bediening en de melding staan in src/tools/Rapport.vue; calc.report staat in src/main.js.
   Hier blijft wat ook andere code aanroept: rpTools/rpSection (verzamelen) en rpDoc/rpPrint
   (het losse document; ook gebruikt door Afdrukken bij elke tool en onder de tekeningen). */
function rpTools(){ return toolIndex().filter(t=>!['report','inst','start'].includes(t.id)); }
function rpSection(id,withIn,withSrc,opt={}){ const sec=$('#t-'+id); if(!sec) return ''; try{ calc[id]&&calc[id](); }catch(e){}
  const title=sec.querySelector('.tool-head h2').textContent; let h=`<h2>${esc(title)}</h2>`;
  if(withIn){ const items=[]; sec.querySelectorAll('.panel input:not([type=checkbox]):not([type=radio]):not([type=search]), .panel select, .panel textarea').forEach(el=>{ if(el.closest('table')||!el.id) return; const lb=sec.querySelector(`label[for="${el.id}"]`); const v=el.tagName==='SELECT'?el.options[el.selectedIndex]?.text:el.value; if(lb&&v&&String(v).trim()) items.push(`<tr><th>${esc(lb.textContent.trim())}</th><td>${esc(v)}</td></tr>`); });
    if(items.length) h+=`<table class="kv">${items.join('')}</table>`;
    sec.querySelectorAll('.panel table').forEach(tb=>{ const head=[...tb.querySelectorAll('thead th')].map(th=>th.textContent.trim()); const rows=[...tb.querySelectorAll('tbody tr')].map(tr=>[...tr.querySelectorAll('td')].map(td=>{ const e=td.querySelector('input,select'); return e?(e.tagName==='SELECT'?e.options[e.selectedIndex]?.text:e.value):td.textContent.trim(); })); if(rows.length) h+=`<table class="grid"><thead><tr>${head.filter(Boolean).map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.slice(0,head.filter(Boolean).length).map(c=>`<td>${esc(c||'')}</td>`).join('')}</tr>`).join('')}</tbody></table>`; }); }
  const res=sec.querySelector('.result'); if(res){ const cl=res.cloneNode(true); cl.querySelectorAll('button,.row').forEach(b=>b.remove()); const cvs=res.querySelectorAll('canvas'), ccl=cl.querySelectorAll('canvas'); ccl.forEach((c,i)=>{ const o=cvs[i]; if(o&&o.width&&o.style.display!=='none'){ const img=document.createElement('img'); img.src=o.toDataURL('image/png'); img.style.maxWidth='100%'; img.style.width=o.style.maxWidth||'auto'; c.replaceWith(img); } else c.remove(); }); h+=`<div class="res">${cl.innerHTML}</div>`; }
  if(opt.mat){ const it=matList(id); if(it.length) h+=`<h3>${esc(trPlain('Materiaal'))}</h3><table class="grid mat">${it.map(([a,b])=>`<tr><td><span class="tick"></span></td><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</table>`; }
  if(opt.qr){ const url=calcLink(id), svg=url&&url.length<=1500?qrSvg(url,110):''; if(svg) h=`<figure class="qr">${svg}<figcaption>${esc(trPlain('Scan om deze invoer in Labkit te openen'))}</figcaption></figure>`+h; }
  if(withSrc){ const s=sec.querySelector('.src'); if(s) h+=`<p class="src">${s.innerHTML}</p>`; }
  return `<section>${h}</section>`; }
/* een gezamenlijke materiaallijst bovenaan het protocol, per tool gegroepeerd */
function rpMatAll(ids){ const g=ids.map(id=>[id,matList(id)]).filter(x=>x[1].length); if(!g.length) return '';
  return `<section><h2>${esc(trPlain('Materiaallijst'))}</h2>${g.map(([id,it])=>{ const h=$('#t-'+id+' .tool-head h2'); return `<h3>${esc(h?h.textContent:id)}</h3><table class="grid mat">${it.map(([a,b])=>`<tr><td><span class="tick"></span></td><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</table>`; }).join('')}</section>`; }
/* los document met een of meer tools; ook gebruikt door Afdrukken per tool */
/* S53: run-notities en afwijkingen uit de bench-modus (Bench.vue bewaart ze onder labkit:v1:benchnotes) */
function rpNotes(){ const all=jget('labkit:v1:benchnotes',{}), runs=Object.values(all).filter(r=>r&&r.notes&&r.notes.length); if(!runs.length) return '';
  const row=n=>`<div class="note${n.dev?' warn':''}"><b>${n.dev?esc(trPlain('Afwijking'))+' · ':''}${esc(new Date(n.t).toLocaleString(LANG==='en'?'en-GB':'nl-NL'))} · ${esc(trPlain('Stap'))} ${esc(n.step)}</b><br>${esc(n.text||'')}${n.img&&/^data:image\/jpeg;base64,[\w+\/=]+$/.test(n.img)?`<img src="${n.img}" alt="" style="max-width:260px">`:''}</div>`;
  return `<section><h2>${esc(trPlain('Run-notities en afwijkingen'))}</h2>${runs.map(r=>`<h3>${esc(r.title||'')}</h3>${r.notes.map(row).join('')}`).join('')}</section>`; }
function rpDoc(ids,wi,ws,title,who,opt={}){ const d=new Date().toLocaleDateString(LANG==='en'?'en-GB':'nl-NL',{day:'numeric',month:'long',year:'numeric'});
  const css='body{font-family:system-ui,Segoe UI,Arial,sans-serif;color:#1f2933;margin:24px;font-size:13px}h1{font-size:22px;margin:0}h2{font-size:16px;margin:22px 0 8px;border-bottom:1px solid #c9ced6;padding-bottom:4px}.meta{color:#5f6b7a;margin:4px 0 12px}table{border-collapse:collapse;margin:6px 0;font-size:12px}table.kv th{text-align:left;font-weight:600;padding:2px 12px 2px 0;color:#5f6b7a}table.grid th,table.grid td,.res table th,.res table td{border:1px solid #d9dde3;padding:3px 6px;text-align:left}dl.kv{display:grid;grid-template-columns:auto auto;gap:2px 16px;margin:6px 0}dl.kv dt{color:#5f6b7a}dl.kv dd{margin:0;font-weight:600}.lbl{color:#5f6b7a;font-size:12px}.big{font-size:22px;font-weight:700}.note{border-left:3px solid #c9ced6;padding:4px 8px;margin:6px 0;background:#f6f7f9}.note.warn{border-color:#c2410c}.note.bad{border-color:#b0271f}.chip{font-size:11px;padding:1px 6px;border-radius:3px;background:#eef0f3}.src,.formula{color:#5f6b7a;font-size:11px}section{break-inside:avoid-page}.qr{float:right;margin:0 0 6px 12px;text-align:center;font-size:10px;color:#5f6b7a;max-width:120px}.qr svg{display:block;margin:0 auto 2px}table.mat td:first-child{width:18px}.tick{display:inline-block;width:11px;height:11px;border:1px solid #1f2933}h3{font-size:13px;margin:12px 0 4px}img{display:block;margin:8px 0}';
  return `<!DOCTYPE html><html lang="${LANG}"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${css}</style></head><body><h1>${esc(title)}</h1><div class="meta">${[esc(who||''),esc($('#sess-name')?$('#sess-name').value:''),d,'Labkit BML '+APPVER].filter(Boolean).join(' · ')}</div>${opt.mat?rpMatAll(ids):''}${ids.map(id=>rpSection(id,wi,ws,opt)).join('')}${opt.notes?rpNotes():''}</body></html>`; }
function rpPrint(html){ const f=document.createElement('iframe'); f.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0'; document.body.appendChild(f); const d=f.contentWindow.document; d.open(); d.write(html); d.close(); setTimeout(()=>{ try{ f.contentWindow.focus(); f.contentWindow.print(); }catch(e){} setTimeout(()=>f.remove(),3000); },400); }

/* alles hierboven ook als globale naam, live (zie src/lib/global.js) */
live({
  rpTools: [() => rpTools, v => { rpTools = v; }],
  rpSection: [() => rpSection, v => { rpSection = v; }],
  rpMatAll: [() => rpMatAll, v => { rpMatAll = v; }],
  rpDoc: [() => rpDoc, v => { rpDoc = v; }],
  rpPrint: [() => rpPrint, v => { rpPrint = v; }]
});
