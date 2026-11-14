/* ================= NIEUWE TOOLS: GEDEELDE HULPFUNCTIES ================= */
/* bewerkbare tabel: cols=[{h:'Naam',t:'txt'|'num'|'sel',w:110,o:[opties]}] */
function etRow(cols){ return r=>`<tr>${cols.map((c,i)=>`<td>${c.t==='sel'?`<select>${c.o.map(o=>`<option${String(r[i]??c.o[0])===o?' selected':''}>${o}</option>`).join('')}</select>`:c.t==='txt'?`<input class="txt" value="${esc(r[i]??'')}" style="width:${c.w||110}px">`:inp(r[i],c.w||80)}</td>`).join('')}<td><button type="button" class="ghost" data-del aria-label="Verwijder">✕</button></td></tr>`; }
function ET(id,cols,def,tool){ const row=etRow(cols), T=$('#'+id);
  T.querySelector('thead').innerHTML='<tr>'+cols.map(c=>`<th${c.t==='num'?' class="num"':''}>${c.h}</th>`).join('')+'<th></th></tr>';
  T.querySelector('tbody').innerHTML=def.map(row).join('');
  TBLDEF[id]={row,num:cols.map((c,i)=>c.t==='num'?i:-1).filter(i=>i>=0)};
  T.addEventListener('click',e=>{ if(e.target.closest('[data-del]')){ e.target.closest('tr').remove(); calc[tool](); } });
  const add=$('#'+id+'-add'); if(add){ ADDBTN[id]='#'+id+'-add'; add.addEventListener('click',()=>{ T.querySelector('tbody').insertAdjacentHTML('beforeend',row(cols.map(c=>c.t==='sel'?c.o[0]:''))); calc[tool](); }); }
  return {set:rows=>{ T.querySelector('tbody').innerHTML=rows.map(row).join(''); calc[tool](); }}; }
const etGet=id=>[...document.querySelectorAll('#'+id+' tbody tr')].map(tr=>[...tr.querySelectorAll('input,select')].map(e=>e.value));
const numsC=t=>String(t).split(/[\s;\t]+/).map(num).filter(x=>isFinite(x));
const fmtv=(v,d=3)=>isFinite(v)?NL(Number(v.toPrecision(d)),9):'–';
