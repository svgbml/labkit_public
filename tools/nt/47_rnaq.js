/* ================= RNA-KWALITEIT ================= */
calc.rnaq=function(){ const a=num($('#rq-a260').value), b=num($('#rq-a280').value), c=num($('#rq-a230').value), df=num($('#rq-df').value)||1, l=num($('#rq-l').value)||1, v=num($('#rq-v').value), s28=num($('#rq-28').value), s18=num($('#rq-18').value), out=$('#rq-out');
  if(!isFinite(a)){ out.innerHTML=note('info','Vul minstens A₂₆₀ in.'); return; }
  const conc=a*40*df/l, r1=a/b, r2=a/c, chip=(ok,t)=>`<span class="chip ${ok?'ok':'warn'}" style="vertical-align:middle;margin-left:6px">${t}</span>`, rows=[];
  if(isFinite(r1)) rows.push(['A<sub>260</sub>/A<sub>280</sub>',fmt(r1,2)+chip(r1>=1.8&&r1<=2.2,r1>=1.8&&r1<=2.2?'zuiver':'afwijkend')]);
  if(isFinite(r2)) rows.push(['A<sub>260</sub>/A<sub>230</sub>',fmt(r2,2)+chip(r2>=1.8,r2>=1.8?'in orde':'laag')]);
  if(isFinite(v)) rows.push(['Opbrengst',`${fmt(conc*v/1000,2)} µg in ${fmt(v,0)} µL`]);
  if(s28>0&&s18>0){ const r=s28/s18; rows.push(['28S:18S',fmt(r,2)+chip(r>=1.6,r>=1.6?'intact':r>=1?'deels afgebroken':'afgebroken')]); }
  let h=`<div class="lbl">RNA-concentratie</div><div class="big">${fmt(conc,1)} <small>ng/µL</small></div>`+kv(rows);
  if(a<0.1||a>1) h+=note('warn','A₂₆₀ buiten 0,1–1,0: de meting is minder betrouwbaar; pas de verdunning aan.');
  if(isFinite(r1)&&r1<1.8) h+=note('warn','Lage A₂₆₀/A₂₈₀: mogelijk eiwit of fenol in het extract.');
  if(isFinite(r2)&&r2<1.8) h+=note('warn','Lage A₂₆₀/A₂₃₀: mogelijk guanidinezouten, fenol of koolhydraten van de extractie.');
  out.innerHTML=h+`<div class="formula">c = A₂₆₀ × 40 µg/mL × verdunning / weglengte</div>`; };
