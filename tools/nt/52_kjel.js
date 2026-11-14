/* ================= KJELDAHL ================= */
calc.kjel=function(){ const m=num($('#kj-m').value), c=num($('#kj-c').value), vs=num($('#kj-vs').value), vb=num($('#kj-vb').value)||0, F=num($('#kj-f').value), out=$('#kj-out');
  if(!(m>0&&c>0&&isFinite(vs))){ out.innerHTML=note('info','Vul monstermassa, titrantconcentratie en titratievolume in.'); return; }
  const N=1.4007*c*(vs-vb)/m, P=N*F;
  out.innerHTML=`<div class="lbl">Ruw eiwit</div><div class="big">${fmt(P,2)} <small>%</small></div>`+kv([['Stikstof',fmt(N,3)+'%'],['Netto titrant',fmt(vs-vb,2)+' mL'],['Omrekenfactor',fmt(F,2)],['Stikstof in monster',fmt(N/100*m*1000,1)+' mg']])+(vs<=vb?note('bad','Het titratievolume van het monster is niet groter dan de blanco.'):'')+`<div class="formula">%N = 1,4007 × c × (V − V<sub>b</sub>) / m · % eiwit = %N × ${fmt(F,2)}</div>`; };
