/* ================= ROTORBALANS =================
   Welke posities van een rotor met n plaatsen vul je met k buizen zodat de som van de
   plaatsvectoren nul is? Een gebalanceerde set is een optelsom van gelijkmatig verdeelde
   groepen van p posities (p een priemgetal dat n deelt): 2 = tegenover elkaar, 3 = 120° enz.
   Zoek zulke groepen die elkaar niet overlappen. Geeft de lijst met posities (0..n-1) of null. */
import {expose} from './global.js';

const primes = n => { const r = []; for (let p = 2; p <= n; p++) if (n % p === 0 && ![...Array(p).keys()].slice(2).some(d => p % d === 0)) r.push(p); return r; };

function balanceSet(n, k) {
  if (!(n >= 2) || k < 0 || k > n || n !== Math.round(n) || k !== Math.round(k)) return null;
  const ps = primes(n), used = Array(n).fill(false);
  const go = left => {
    if (left === 0) return true;
    for (const p of ps) {
      if (p > left) continue;
      for (let j = 0; j < n / p; j++) {
        const pos = [...Array(p).keys()].map(i => j + i * n / p);
        if (pos.some(x => used[x])) continue;
        pos.forEach(x => used[x] = true);
        if (go(left - p)) return true;
        pos.forEach(x => used[x] = false);
      }
    }
    return false;
  };
  if (!go(k)) return null;
  return used.map((u, i) => u ? i : -1).filter(i => i >= 0);
}

/* het kleinste aantal buizen boven k dat wel te balanceren is (met een blanco buis) */
const balanceNext = (n, k) => { for (let j = k + 1; j <= n; j++) if (balanceSet(n, j)) return j; return null; };

expose({balanceSet, balanceNext});
export {balanceSet, balanceNext};
