/* ================= TIMER-MOTOR (S268) =================
   Letterlijk overgenomen uit src/shell/index.html: het geluid (unlockAudio, beep), de lijst
   `timers` met de tik elke 250 ms, de meldingen van het systeem en het bewaren in localStorage.
   De weergave is src/tools/Timers.vue; die leest `timers` en roept addTimer()/tmAct() aan. De
   motor loopt door als je naar een andere tool gaat, daarom is hij geen component. */
import {live} from '../lib/global.js';

/* ---------- audio ---------- */
let actx=null;
function unlockAudio(){ try{ if(!actx) actx=new (window.AudioContext||window.webkitAudioContext)(); if(actx.state==='suspended') actx.resume(); }catch(e){} }
function beep(n=3,freq=880){ try{ if(!actx) return; let t=actx.currentTime; for(let i=0;i<n;i++){ const o=actx.createOscillator(),g=actx.createGain(); o.type='sine'; o.frequency.value=freq; g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.3,t+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t+0.25); o.connect(g).connect(actx.destination); o.start(t); o.stop(t+0.27); t+=0.35; } }catch(e){} }

/* ================= TIMERS ================= */
let timers=[], tid=0;
const TPRE=[['Centrifugeren',1,0],['Lysis 56 °C',10,0],['Gel draaien',30,0],['Incubatie 37 °C',60,0],['5 min',5,0]];
function addTimer(name,secs){ timers.push({id:++tid,name,total:secs,rem:secs,run:false,end:0,done:false}); renderTimers(); }
/* een herinnering (S56): een timer die al loopt en afgaat op kloktijd `at` (ms); loopt door na herladen
   zoals elke timer. shortcut: alleen terwijl Labkit open is (geen push-server), een agenda-export voor langer */
function addReminder(name,at){ const s=(at-Date.now())/1000; if(!(s>0)) return false; unlockAudio(); askNotify();
  timers.push({id:++tid,name,total:s,rem:s,run:true,end:at,done:false}); renderTimers(); return true; }
const mmss=s=>{ s=Math.max(0,Math.ceil(s)); const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60; return (h?h+':'+String(m).padStart(2,'0'):m)+':'+String(x).padStart(2,'0'); };
/* De weergave is de Vue-component Timers (src/tools/Timers.vue): die leest `timers` bij elke
   tik van `tick`. renderTimers() blijft bestaan als "de lijst is veranderd"; wie de lijst wijzigt
   (addTimer, tmAct, het herstellen uit localStorage) roept het aan. Voor de mount is er niets
   te doen: de component leest de lijst zelf bij het opbouwen. */
function renderTimers(){ if(window.__tmVm) window.__tmVm.tick++; }
/* een knop op een timer: x = verwijderen, s = start/pauze/stop alarm, r = reset, p1 = +1 minuut */
function tmAct(id,what){
  const t=timers.find(x=>x.id==id); if(!t) return; unlockAudio();
  if(what==='x') timers=timers.filter(x=>x!==t);
  else if(what==='s'){ if(t.done){ t.done=false; t.rem=t.total; t.run=false; } else if(t.run){ t.run=false; t.rem=(t.end-Date.now())/1000; } else { t.run=true; t.end=Date.now()+t.rem*1000; } }
  else if(what==='r'){ t.run=false; t.done=false; t.rem=t.total; }
  else if(what==='p1'){ t.total+=60; if(t.run) t.end+=60000; else t.rem+=60; t.done=false; }
  renderTimers();
}
let lastBeep=0;
setInterval(()=>{
  let changed=false, ringing=false;
  timers.forEach(t=>{ if(t.run){ t.rem=(t.end-Date.now())/1000; if(t.rem<=0){ t.rem=0; t.run=false; t.done=true; changed=true; } } if(t.done) ringing=true; });
  if(ringing&&Date.now()-lastBeep>2500){ beep(3,880); lastBeep=Date.now(); }
  const running=timers.filter(t=>t.run).sort((a,b)=>a.rem-b.rem)[0];
  document.title=ringing?'● Timer klaar — Labkit BML':running?`${mmss(running.rem)} ${running.name} — Labkit BML`:'Labkit BML';
  /* de resterende tijd en de voortgangsbalk lopen mee: een nieuwe tik laat de component opnieuw tekenen */
  if(changed||timers.some(t=>t.run)) renderTimers();
},250);
calc.timers=()=>{};

/* ================= TIMERMELDINGEN ================= */
const notified=new Set();
function askNotify(){ try{ if('Notification' in window&&Notification.permission==='default') Notification.requestPermission().catch(()=>{}); }catch(e){} }
/* askNotify() wordt door de component Timers aangeroepen bij Toevoegen en bij een snelle timer */
setInterval(()=>{ timers.forEach(t=>{ if(t.done&&!notified.has(t.id)){ notified.add(t.id); try{ if('Notification' in window&&Notification.permission==='granted') new Notification('Timer klaar: '+t.name,{body:'Labkit BML',tag:'labkit-'+t.id}); }catch(e){} } if(!t.done) notified.delete(t.id); }); },1000);

/* ================= TIMERS BEWAREN ================= */
/* De stand van de teller bewaart de component zelf (labkit:v1:teller). */
const TKEY='labkit:v1:timers';
try{ const t=JSON.parse(localStorage.getItem(TKEY)||'[]'); if(Array.isArray(t)&&t.length){ timers=t; tid=Math.max(...t.map(x=>x.id)); renderTimers(); }
  }catch(e){}
let lastT='';
setInterval(()=>{ try{ const t=JSON.stringify(timers.map(x=>({...x,rem:Math.round(x.rem*10)/10}))); if(t!==lastT){ localStorage.setItem(TKEY,t); lastT=t; } }catch(e){} },1000);

/* Alles hierboven ook als globale naam, live: een toewijzing (timers = …, gfIntensity = …) in
   deze module of in de oude scripts komt aan beide kanten aan. */
live({
  actx: [() => actx, v => { actx = v; }],
  unlockAudio: [() => unlockAudio, v => { unlockAudio = v; }],
  beep: [() => beep, v => { beep = v; }],
  timers: [() => timers, v => { timers = v; }],
  tid: [() => tid, v => { tid = v; }],
  TPRE: () => TPRE,
  addTimer: [() => addTimer, v => { addTimer = v; }],
  addReminder: [() => addReminder, v => { addReminder = v; }],
  mmss: () => mmss,
  renderTimers: [() => renderTimers, v => { renderTimers = v; }],
  tmAct: [() => tmAct, v => { tmAct = v; }],
  lastBeep: [() => lastBeep, v => { lastBeep = v; }],
  notified: () => notified,
  askNotify: [() => askNotify, v => { askNotify = v; }],
  TKEY: () => TKEY,
  lastT: [() => lastT, v => { lastT = v; }]
});
