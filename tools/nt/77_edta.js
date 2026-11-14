/* ================= WATERHARDHEID (EDTA) ================= */
calc.edta=function(){ const c=num($('#ed-c').value), vs=num($('#ed-vs').value), vt=num($('#ed-vt').value), vb=num($('#ed-vb').value)||0, vca=num($('#ed-vca').value), out=$('#ed-out');
  if(!(c>0)||!(vs>0)||!(vt>0)){ out.innerHTML=note('info','Vul EDTA-concentratie, monstervolume en titratievolume in.'); return; }
  if(vt<=vb){ out.innerHTML=note('warn','Het titratievolume is niet groter dan de blanco.'); return; }
  const mm=c*(vt-vb)/vs*1000, dh=mm*56.0774/10;
  let h=`<div class="lbl">Totale hardheid</div><div class="big">${fmt(mm,3)} <small>mmol/L</small></div>`+kv([['mg CaCO₃/L',fmt(mm*100.09,1)],['Duitse graden',fmt(dh,2)+' °dH'],['Franse graden',fmt(mm*10,2)+' °fH']]);
  if(vca>0){ if(vca<=vb||vca>vt){ h+=note('warn','Het calciumvolume moet tussen de blanco en het totaalvolume liggen.'); } else { const ca=c*(vca-vb)/vs*1000, mg=mm-ca; h+=kv([['Calcium',`${fmt(ca,3)} mmol/L = ${fmt(ca*40.078,1)} mg/L`],['Magnesium (verschil)',`${fmt(mg,3)} mmol/L = ${fmt(mg*24.305,1)} mg/L`],['Ca : Mg (molair)',mg>0?fmt(ca/mg,2)+' : 1':'–']]); } }
  out.innerHTML=h+`<div class="formula">c = c<sub>EDTA</sub> · (V − V<sub>b</sub>) / V<sub>s</sub> · °dH = mmol/L × 5,61</div>`; };
