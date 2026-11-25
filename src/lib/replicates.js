/* ================= REPLICATEN CONTROLEREN (S95, #141) =================
   repCheck(waarden, cvMax) → null bij minder dan twee getallen, anders
   {n, mean, sd, cv, high, out, G}:
   - sd met n − 1, cv = sd / |gemiddelde| × 100 %; high als cv > cvMax (standaard 15 %, de grens die
     bijvoorbeeld de EMA-richtlijn voor bioanalytische methodevalidatie (2011) voor precisie aanhoudt);
   - out: de index van een uitschieter volgens Grubbs (één waarde, α = 0,05, kritieke waarden voor n = 3–10
     uit ISO 5725-2:1994 tabel 5), anders −1. Met twee waarden kan Grubbs niets zeggen; boven tien waarden
     gebruikt hij grubbsCrit() uit de statistiek als die er is. */
import {expose} from './global.js';

const G05 = {3: 1.155, 4: 1.481, 5: 1.715, 6: 1.887, 7: 2.020, 8: 2.126, 9: 2.215, 10: 2.290};

export function repCheck(vals, cvMax = 15) {
  const ok = v => v !== '' && v != null && isFinite(Number(v)), x = vals.filter(ok).map(Number), n = x.length;
  if (n < 2) return null;
  const mean = x.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(x.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1));
  const cv = mean ? sd / Math.abs(mean) * 100 : NaN;
  let out = -1, G = NaN;
  if (n >= 3 && sd > 0) {
    let k = 0; x.forEach((v, i) => { if (Math.abs(v - mean) > Math.abs(x[k] - mean)) k = i; });
    G = Math.abs(x[k] - mean) / sd;
    const crit = G05[n] || (typeof grubbsCrit === 'function' ? grubbsCrit(n, 0.05).v : Infinity);
    if (G > crit) out = vals.findIndex(v => ok(v) && Number(v) === x[k]);
  }
  return {n, mean, sd, cv, high: cv > cvMax, out, G};
}

expose({repCheck});
