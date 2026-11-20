/* ================= INTERNE STANDAARD & STANDAARDADDITIE =================
   De tabellen, de velden en de uitkomst staan in src/tools/Istd.vue; hier blijft de regressie
   met standaardfout (isdFit), waar de component en het validatiegeval op leunen. */
function isdFit(x,y){ const n=x.length, f=linreg(x,y), mx=mean(x), my=mean(y), sxx=x.reduce((s,v)=>s+(v-mx)**2,0), res=y.reduce((s,v,i)=>s+(v-(f.a+f.b*x[i]))**2,0), syx=n>2?Math.sqrt(res/(n-2)):NaN; return {...f,n,mx,my,sxx,syx}; }
