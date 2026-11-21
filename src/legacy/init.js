/* ================= OPSTARTEN (S269) =================
   Dit was het einde van het laatste inline script. Eerst start() (src/mount.js) zet de
   Vue-componenten op hun host, daarna de opstartvolgorde van de oude code. Deze module wordt
   als laatste geïmporteerd (src/main.js), dus alles hierboven is dan al geladen. */
import {start} from '../mount.js';

start();
buildReeks();
sLoad('bradford');



tblRestore();
gfDemo();
['verdunning','oplossing','reeks','telkamer','dna','pcr','gel','ligatie','centrifuge','curve','enzym','pcrcyclus','qpcr','groei','transf','stat','pverd','ppip','pprog','mic','gcomp','wb','melt','spec','units','inoc','molm','hh','rmp','seed','oligo','sds','micro'].forEach(k=>{ try{ calc[k](); }catch(e){ console.error(k,e); } });
{ const _op=calc.oplossing; calc.oplossing=function(e){ _op(e); try{ bufImg(); }catch(err){} }; } ['o-btitle','o-note'].forEach(id=>$('#'+id).addEventListener('input',()=>bufImg())); try{ bufImg(); }catch(e){} try{ calc.ppip(); }catch(e){ console.error(e); }
applyUI();
decorateXL();
route();
i18nStart();
if($('#ui-autoupd').checked) setTimeout(()=>checkUpdate(false),2500);
