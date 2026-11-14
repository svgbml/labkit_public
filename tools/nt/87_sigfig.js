/* ================= SIGNIFICANTE CIJFERS ================= */
function sfParse(s){ s=String(s).trim().replace(/\s/g,'').replace(/×10\^?/,'e').replace(',','.'); const m=s.match(/^([+-]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/); if(!m||(!m[2]&&!m[3])) return null;
  const ip=m[2]||'', fp=m[3]||'', all=(ip+fp).replace(/^0+/,''); let e=-(fp.length)+(m[4]?+m[4]:0); if(!all) return {neg:false,D:0n,e,sf:fp?Math.max(1,fp.length):1,amb:false,zero:true};
  const D=BigInt(all), lead=all.length, trailInt=!m[3]&&!m[4]?(ip.match(/0+$/)||[''])[0].length:0; return {neg:m[1]==='-',D,e,sf:lead,amb:trailInt>0,min:lead-trailInt,zero:false}; }
const sfLen=D=>D.toString().length;
function sfRoundAt(D,e,p,mode){ if(p<=e) return {D:D*10n**BigInt(e-p),e:p}; const div=10n**BigInt(p-e); let q=D/div; const r=D%div, two=2n*r; if(two>div||(two===div&&(mode==='up'||q%2n===1n))) q+=1n; return {D:q,e:p}; }
function sfRoundSig(x,n,mode){ if(x.zero) return {D:0n,e:0}; const msd=x.e+sfLen(x.D)-1; let r=sfRoundAt(x.D,x.e,msd-n+1,mode); if(sfLen(r.D)>n) r=sfRoundAt(r.D,r.e,r.e+1,mode); return r; }
function sfStr(D,e,neg){ let s=D.toString(); if(e>=0) s=s+'0'.repeat(e); else { s=s.padStart(-e+1,'0'); s=s.slice(0,s.length+e)+','+s.slice(s.length+e); } return (neg&&D!==0n?'−':'')+s; }
function sfSci(D,e,neg){ const s=D.toString(), ex=e+s.length-1; return `${neg?'−':''}${s[0]}${s.length>1?','+s.slice(1):''} × 10<sup>${ex}</sup>`; }
calc.sigfig=function(){ const x=sfParse($('#sf-x').value), n=Math.round(num($('#sf-n').value)), mode=$('#sf-m').value, nd=+$('#sf-ud').value, out=$('#sf-out');
  if(!x){ out.innerHTML=note('info','Vul een getal in, bijvoorbeeld 0,004565 of 4,565e-3.'); return; } if(!(n>=1&&n<=20)){ out.innerHTML=note('info','Kies 1 tot 20 significante cijfers.'); return; }
  const r=sfRoundSig(x,n,mode), alt=sfRoundSig(x,n,mode==='up'?'even':'up');
  let h=`<div class="lbl">Afgerond op ${n} significante cijfers</div><div class="big mono">${sfStr(r.D,r.e,x.neg)}</div>`+kv([['Wetenschappelijk',x.zero?'0':sfSci(r.D,r.e,x.neg)],['Significante cijfers in de invoer',x.zero?'–':x.amb?`${x.min} tot ${x.sf} (nullen aan het eind van een geheel getal zijn dubbelzinnig)`:String(x.sf)],['Met de andere halveringsregel',sfStr(alt.D,alt.e,x.neg)+(sfStr(alt.D,alt.e,x.neg)===sfStr(r.D,r.e,x.neg)?' (zelfde)':' (anders)')]]);
  const u=sfParse($('#sf-u').value); if(u&&!u.zero&&!u.neg){ const ru=sfRoundSig(u,nd,'up'), up=ru.e+sfLen(ru.D)-nd, ux=sfRoundAt(ru.D,ru.e,up,'up'), xv=x.zero?{D:0n,e:up}:sfRoundAt(x.D,x.e,up,mode);
    const conc=`${sfStr(xv.D,xv.e,x.neg)}(${ux.D.toString()})`; h+=`<div class="lbl" style="margin-top:14px">Meetwaarde met onzekerheid</div><div class="big mono">${sfStr(xv.D,xv.e,x.neg)} ± ${sfStr(ux.D,ux.e,false)}</div>`+kv([['Beknopte notatie',conc],['Decimalen',String(Math.max(0,-up))]]); }
  out.innerHTML=h+`<div class="formula">onzekerheid op ${nd} cijfer${nd>1?'s':''} · waarde op dezelfde decimaal</div>`; };
