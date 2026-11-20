/* ================= GLASVERGELIJKING =================
   De velden, de grafiek en de uitkomst staan in src/tools/Glass.vue; hier blijft de
   opmaakhulp: glF() zet een getal met d decimalen neer met een komma ('–' als het geen getal is). */
const glF=(v,d=5)=>isFinite(v)?v.toFixed(d).replace('.',','):'–';
