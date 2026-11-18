/* ================= OPLOSSING & BUFFER: BIBLIOTHEEK, KAART EN BALANS =================
   De opmaak staat in web/index.html; de code die deze run erbij kwam staat hier. De recepten
   zelf staan in 03_recipe.js, dat hierboven in hetzelfde script is ingevoegd.
   calc.oplossing() roept oAdvice() aan: een function-declaratie wordt gehesen en komt op het
   globale object, dus de plek in het bestand maakt niet uit. */

/* ---------- welke balans hoort bij deze massa? (S39) ----------
   De kleinste massa die je met een gevraagde nauwkeurigheid nog kunt afwegen volgt uit de
   herhaalbaarheid s van de balans: m ≥ 2s / nauwkeurigheid (het 2s-criterium uit USP <41>).
   Met s gelijk aan de afleesbaarheid betekent dat: op 0,1 mg haal je vanaf ongeveer 20 mg
   nog 1%, en op 10 mg pas vanaf ongeveer 2 g. Het zijn vuistregels; de werkelijke s staat in
   het kalibratierapport van de balans. */
function oBalance(grams){
  if(!isFinite(grams)||grams<=0) return null;
  if(grams<0.02) return {k:'bad',t:'te weinig om op 1% af te wegen: maak een stockoplossing en pipetteer die'};
  if(grams<2) return {k:'warn',t:'analytische balans (0,1 mg)'};
  return {k:'ok',t:'precisiebalans (10 mg) is genoeg'};
}

/* ---------- voortgang van het afwegen, weegorde en steriliteit (S38, S39) ----------
   calc.oplossing() in web/index.html roept dit aan; de functie leest de tabel zelf uit. */
function oAdvice(recipeKey){
  /* voortgang van het afwegen; de vinkjes gaan uit zodra het recept of het volume verandert,
     want dan verandert ook wat er moet worden afgewogen */
  const orows=$$('#o-tbl tbody tr'), ocnt=orows.filter(tr=>tr.querySelector('[data-k=out]').textContent!=='–').length,
    odone=orows.filter(tr=>{ const c=tr.querySelector('[data-k=done]'); return c&&c.checked; }).length;
  orows.forEach(tr=>{ const c=tr.querySelector('[data-k=done]'); tr.classList.toggle('oweg',!!(c&&c.checked)); });
  const oprog=$('#o-prog'); if(oprog) oprog.textContent=ocnt?`${odone} van de ${ocnt} componenten afgewogen.`:'';
  /* weegorde: eerst het kleine werk op de analytische balans, dan het grove, in hetzelfde vat */
  const adv=$('#o-advice');
  if(adv){ const small=[], stock=[];
    orows.forEach(tr=>{ const nm=tr.querySelector('[data-k=n]').value||'', b=tr.querySelector('.obal');
      if(!b||!nm) return; if(b.classList.contains('bad')) stock.push(nm); else if(b.classList.contains('warn')) small.push(nm); });
    const ster=(typeof RECSTER!=='undefined'&&RECSTER[recipeKey])||'';
    adv.innerHTML=(ster?note('info','<b>Steriliteit</b> '+ud(ster)):'')
      +(stock.length?note('warn',`<b>Te klein om af te wegen</b> ${ud(stock.join(', '))}: maak hiervan een stockoplossing en pipetteer die, anders bepaalt de balans je onzekerheid.`):'')
      +(small.length?note('info',`<b>Weegorde</b> Weeg eerst ${ud(small.join(', '))} op de analytische balans en daarna de grote hoeveelheden op de precisiebalans, in hetzelfde vat.`):''); }
}

/* ---------- receptenbibliotheek aanzetten (S37) ----------
   De bibliotheek is een ingevoegde module, dus dit kan pas hier: hierboven zou RECKEYS nog
   in zijn tijdelijke dode zone staan. */
$('#o-preset').insertAdjacentHTML('beforeend',RECKEYS.map(k=>`<option value="${k}">${esc(RECNAME[k]||k)}</option>`).join(''));
/* de bibliotheek brengt eigen hydraatvormen mee; HYD en de chemicaliënlijst worden hierboven
   opgebouwd, dus die worden hier aangevuld */
RECHYD.forEach(g=>{ if(!HYD.some(h=>h[0]===g[0])) HYD.push(g);
  g[1].forEach(v=>{ if(!CHEM[v[1]]){ CHEM[v[1]]=v[2]; $('#chem-list').insertAdjacentHTML('beforeend',`<option value="${v[1]}">`); } }); });
$('#o-preset').value='trisnacl';
loadRecipe('trisnacl');

/* ---------- receptkaart: snelle volumes, afvinken en afdrukken (S38) ----------
   Een recept staat in de bibliotheek op concentratie, niet op massa, dus het schaalt
   lineair met het eindvolume: de knoppen hieronder zetten alleen dat volume. De vinkjes
   zijn bedoeld voor tijdens het afwegen en gaan uit als het recept of het volume wijzigt,
   want dan verandert ook wat er in de weegschaal moet. */
function oUntick(){ $$('#o-tbl [data-k=done]').forEach(c=>{ c.checked=false; }); calc.oplossing(); }
document.addEventListener('click',e=>{
  const v=e.target.closest('[data-ovol]');
  if(v){ $('#o-v').value=v.dataset.ovol; $('#o-vu').value=v.dataset.ovu; oUntick(); return; }
  if(e.target.closest('#o-untick')) oUntick();
});
$('#o-tbl').addEventListener('change',e=>{ if(e.target.dataset.k==='done') calc.oplossing(); });
$('#o-preset').addEventListener('change',()=>setTimeout(oUntick,0));
$('#o-card').addEventListener('click',()=>{
  const T=t=>esc(trPlain(t)), vtxt=$('#o-vu').value==='L'?fmt(num($('#o-v').value),3)+' L':fmt(num($('#o-v').value),1)+' mL';
  const rows=$$('#o-tbl tbody tr').map(tr=>{ const g=k=>tr.querySelector('[data-k='+k+']');
      return {n:g('n').value,c:g('c').value,u:g('u').value,out:g('out').textContent}; })
    .filter(r=>r.out&&r.out!=='–');
  if(!rows.length){ $('#o-prog').textContent=trPlain('Vul eerst een recept en een volume in.'); return; }
  /* de stappen staan al vertaald in de pagina, dus die worden overgenomen */
  const steps=$$('#o-steps li').map(li=>li.innerHTML), src=$('#o-src-rec').textContent.trim();
  const title=$('#o-btitle').value||trPlain('Receptkaart');
  rpPrint('<!doctype html><meta charset="utf-8"><title>'+esc(title)+'</title><style>'
    +'@page{size:A4;margin:16mm}body{margin:0;font:13px system-ui,sans-serif;color:#1f2933}'
    +'h1{font-size:20px;margin:0 0 2px}h2{font-size:14px;margin:16px 0 6px}'
    +'.meta{margin:0 0 12px;color:#5f6b7a;font-size:12px}'
    +'table{border-collapse:collapse;width:100%;font-size:13px}'
    +'th,td{border:1px solid #c9ced6;padding:5px 8px;text-align:left}'
    +'th{background:#eef0f3}td.n{text-align:right;white-space:nowrap}'
    +'td.box,th.box{width:24px;text-align:center}td.box span{display:inline-block;width:12px;height:12px;border:1.4px solid #1f2933}'
    +'ol{margin:0;padding-left:20px}li{margin:0 0 3px}'
    +'.src{margin:14px 0 0;font-size:11px;color:#5f6b7a}'
    +'.sign{margin-top:18px;font-size:12px;color:#5f6b7a}'
    +'</style><h1>'+esc(title)+'</h1>'
    +'<p class="meta">'+T('Eindvolume')+': <b>'+esc(vtxt)+'</b></p>'
    +'<table><thead><tr><th class="box"></th><th>'+T('Component')+'</th><th>'+T('Concentratie')+'</th><th>'+T('Afwegen')+'</th></tr></thead><tbody>'
    +rows.map(r=>'<tr><td class="box"><span></span></td><td>'+esc(trPlain(r.n,true))+'</td><td>'+esc(r.c)+' '+esc(trPlain(r.u,true))+'</td><td class="n"><b>'+esc(r.out)+'</b></td></tr>').join('')
    +'</tbody></table>'
    +(steps.length?'<h2>'+T('Werkwijze')+'</h2><ol>'+steps.map(h=>'<li>'+h+'</li>').join('')+'</ol>':'')
    +(src?'<p class="src">'+esc(src)+'</p>':'')
    +'<p class="sign">'+T('Bereid door')+': ________________ &nbsp; '+T('Datum')+': ________________ &nbsp; '+T('Houdbaar tot')+': ________________</p>');
});
