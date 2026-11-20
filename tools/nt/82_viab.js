/* ================= VIABILITEIT (TRYPAANBLAUW) ================= */
function poisCI(k){ return [k>0?chiinv(0.025,2*k)/2:0,chiinv(0.975,2*k+2)/2]; }
function wilsonCI(x,n,z=1.96){ if(!(n>0)) return [NaN,NaN]; const p=x/n, d=1+z*z/n, c=(p+z*z/(2*n))/d, h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d; return [Math.max(0,c-h),Math.min(1,c+h)]; }
/* De velden en de uitkomst staan in src/tools/Viab.vue. */
calc.viab=function(){};
