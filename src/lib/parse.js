/* ================= KOLOMMEN PLAKKEN (S267) =================
   Letterlijk overgenomen uit src/shell/index.html: parseCols() leest een geplakt blok (tabs,
   puntkomma's of spaties) als een x-kolom met een of meer reeksen. */
import {expose} from './global.js';

function parseCols(txt){ const lines=String(txt).replace(/\r/g,'').split('\n').filter(l=>l.trim()); if(!lines.length) return null;
  const split=l=>l.includes('\t')?l.split('\t'):l.includes(';')?l.split(';'):l.trim().split(/\s{2,}|\s+/);
  let head=split(lines[0]).map(s=>s.trim()); const firstNum=head.every(h=>isFinite(num(h)));
  const rows=(firstNum?lines:lines.slice(1)).map(l=>split(l).map(v=>num(v.trim())));
  if(firstNum) head=['x',...head.slice(1).map((_,i)=>'Reeks '+(i+1))];
  const nc=Math.max(...rows.map(r=>r.length)); const x=rows.map(r=>r[0]);
  const series=[]; for(let j=1;j<nc;j++) series.push({name:head[j]||('Reeks '+j),y:rows.map(r=>r[j])}); return {xname:head[0],x,series}; }

expose({parseCols});
