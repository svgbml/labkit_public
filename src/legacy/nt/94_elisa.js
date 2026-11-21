/* Letterlijk overgenomen uit tools/nt/94_elisa.js (S269): een classic script dat als module in de bundel staat
   en zijn namen live op window zet, zodat de andere code ze als globale namen blijft lezen. */
import {live} from '../../lib/global.js';

/* ================= ELISA-PLAATANALYSE =================
   De weergave en de berekening staan in src/tools/Elisa.vue (Vue 3). Hier blijft alleen over wat
   globaal moet zijn: elGrid() (het plakken van een 8 × 12-blok), de soorten en groepen van de
   plaatontwerper en elBlocks(), dat de replicaatblokken nummert. */
function elGrid(txt,numeric){ return String(txt).split(/\n/).filter(l=>l.trim()!=='').slice(0,8).map(l=>{ let c=l.split('\t'); if(c.length<2) c=l.trim().split(numeric?/[\s;]+/:/[\s;]+/); return c.slice(0,12).map(t=>numeric?num(t.trim()):t.trim().toUpperCase()); }); }
/* ---------- de plaat als tekening (S34) ----------
   De plaatindeling in het tekstvak blijft de bron voor de berekening: er verandert niets aan
   de uitkomsten. De gedeelde plaatontwerper is een tweede manier om datzelfde vak te vullen.
   De soort (blanco, standaard, monster) is de groep waarmee je verft; het nummer erachter
   komt van de replicaatblokken: putjes van dezelfde soort die aan elkaar grenzen horen bij
   elkaar en krijgen samen één nummer. Een naam die je zelf typt gaat daar altijd voor. */
const ELKIND=['B','S','M'], ELGRP=[{n:'Blanco',c:'#4b5563'},{n:'Standaard',c:'#1d5bc4'},{n:'Monster',c:'#c2410c'}];
/* nummert de replicaatblokken in de gekozen richting; blanco's houden allemaal de naam B */
function elBlocks(st){
  const out={}, cnt={S:0,M:0}, down=st.dir==='v';
  const kk=(i,j)=>'ABCDEFGHIJKLMNOP'[i]+(j+1);
  const outer=down?st.c:st.r, inner=down?st.r:st.c;
  for(let a=0;a<outer;a++){ let prev=null;
    for(let b=0;b<inner;b++){ const k=down?kk(b,a):kk(a,b), g=st.wells[k];
      if(g==null){ prev=null; continue; }
      const kind=ELKIND[g]||'M';
      if(g!==prev&&kind!=='B') cnt[kind]=(cnt[kind]||0)+1;
      out[k]=kind==='B'?'B':kind+cnt[kind]; prev=g; } }
  return out;
}
const elName=(st,lab,k)=>st.vals[k]||lab[k]||'';

/* alles hierboven ook als globale naam, live (zie src/lib/global.js) */
live({
  elGrid: [() => elGrid, v => { elGrid = v; }],
  ELKIND: () => ELKIND,
  ELGRP: () => ELGRP,
  elBlocks: [() => elBlocks, v => { elBlocks = v; }],
  elName: () => elName
});
