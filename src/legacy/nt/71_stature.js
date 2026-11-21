/* Letterlijk overgenomen uit tools/nt/71_stature.js (S269): een classic script dat als module in de bundel staat
   en zijn namen live op window zet, zodat de andere code ze als globale namen blijft lezen. */
import {live} from '../../lib/global.js';

/* ================= LICHAAMSLENGTE UIT BOTTEN =================
   De velden, de uitkomst en de tekening staan in src/tools/Stature.vue; hier blijven de
   regressiecoëfficiënten (SLF: [a, b, SE] per bot), de botnamen (SLN) en de gebruikelijke
   bereiken in cm (SLR). */
const SLF={mw:{fem:[2.32,65.53,3.94],tib:[2.42,81.93,4.00],fib:[2.60,75.50,3.86],hum:[2.89,78.10,4.57],rad:[3.79,79.42,4.66],uln:[3.76,75.55,4.72]},
 mb:{fem:[2.10,72.22,3.91],tib:[2.19,85.36,3.96],fib:[2.34,80.07,4.02],hum:[2.88,75.48,4.23],rad:[3.32,85.43,4.57],uln:[3.20,82.77,4.74]},
 vw:{fem:[2.47,54.10,3.72],tib:[2.90,61.53,3.66],fib:[2.93,59.61,3.57],hum:[3.36,57.97,4.45],rad:[4.74,54.93,4.24],uln:[4.27,57.76,4.30]},
 vb:{fem:[2.28,59.76,3.41],tib:[2.45,72.65,3.70],fib:[2.49,70.90,3.80],hum:[3.08,64.67,4.25],rad:[3.67,71.79,4.59],uln:[3.31,75.38,4.83]}};
const SLN={fem:'Femur',tib:'Tibia',fib:'Fibula',hum:'Humerus',rad:'Radius',uln:'Ulna'}, SLR={fem:[30,65],tib:[24,55],fib:[24,55],hum:[20,45],rad:[15,35],uln:[17,38]};

/* alles hierboven ook als globale naam, live (zie src/lib/global.js) */
live({
  SLF: () => SLF,
  SLN: () => SLN,
  SLR: () => SLR
});
