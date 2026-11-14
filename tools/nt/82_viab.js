/* ================= VIABILITEIT (TRYPAANBLAUW) ================= */
function poisCI(k){ return [k>0?chiinv(0.025,2*k)/2:0,chiinv(0.975,2*k+2)/2]; }
function wilsonCI(x,n,z=1.96){ if(!(n>0)) return [NaN,NaN]; const p=x/n, d=1+z*z/n, c=(p+z*z/(2*n))/d, h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d; return [Math.max(0,c-h),Math.min(1,c+h)]; }
calc.viab=function(){ const L=Math.round(num($('#vb-l').value)), D=Math.round(num($('#vb-d').value))||0, sq=num($('#vb-sq').value), df=num($('#vb-df').value)||1, V=num($('#vb-v').value), T=num($('#vb-t').value), n=Math.round(num($('#vb-n').value))||1, out=$('#vb-out');
  if(!(L>=0)||!(sq>0)||L+D<=0||L>1e7||D>1e7){ out.innerHTML=note('info','Vul het aantal levende en dode cellen en het aantal vierkanten in.'); return; }
  const f=df*1e4/sq, cL=L*f, cT=(L+D)*f, via=L/(L+D), [a,b]=poisCI(L), [w1,w2]=wilsonCI(L,L+D);
  let h=`<div class="lbl">Levende cellen</div><div class="big">${sci(cL,3)} <small>per mL</small></div>`+kv([['95%-interval (telling)',`${sci(a*f,3)} – ${sci(b*f,3)} per mL`],['Viabiliteit',`${fmt(via*100,1)}% (95%: ${fmt(w1*100,1)}–${fmt(w2*100,1)}%)`],['Totaal (levend + dood)',sci(cT,3)+' per mL'],['Levende cellen in de suspensie',V>0?sci(cL*V,3):'–']]);
  if(T>0&&cL>0){ const v=T/cL*1000; h+=kv([['Volume per putje voor '+sci(T,3)+' cellen',vol(v)],[`Voor ${n} putjes`,vol(v*n)+(V>0&&v*n/1000>V?' <span class="chip warn" style="vertical-align:middle">meer dan je hebt</span>':'')]]); }
  if(L<100) h+=note('info',`Met ${L} getelde levende cellen is de relatieve onzekerheid ongeveer ${fmt(100/Math.sqrt(Math.max(L,1)),0)}%; tel meer vierkanten.`);
  if(L/sq>100) h+=note('warn','Meer dan 100 cellen per vierkant: verdun de suspensie voor een betrouwbare telling.');
  if(via<0.9) h+=note('warn','Viabiliteit onder 90%: voor transfectie en de meeste experimenten is dat aan de lage kant.');
  out.innerHTML=h+`<div class="formula">cellen/mL = N / vierkanten × verdunning × 10⁴ · viabiliteit = levend / totaal</div>`; };
