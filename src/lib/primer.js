/* Primeranalyse voor de primerkaart (S42), de paarcontrole (S43) en de in-silico PCR (S44).
   Dimeren en haarspelden krijgen een ΔG°37 uit dezelfde nearest-neighbor-tabel als tmNN()
   (NN, SantaLucia 1998, src/legacy/app.js): som van de stapelingen over het langste
   aaneengesloten stuk Watson-Crick-paren, plus de eindinitiatie (GC- of AT-eind) en, voor een
   haarspeld, de lusinitiatie van SantaLucia & Hicks 2004. Geen mismatches of bulges: dat is wat
   de grenzen van Premier Biosoft (3′-eind −5/−2, intern −6/−3 kcal/mol) ook veronderstellen.
   NN wordt pas bij het rekenen gelezen: deze module laadt vóór src/legacy/app.js. */

const T37 = 310.15;
const PAIR = {A: 'T', T: 'A', G: 'C', C: 'G'};
const dG = (h, s) => h - T37 * s / 1000;
const endDG = b => (b === 'G' || b === 'C' ? dG(0.1, -2.8) : dG(2.3, 4.1));
/* hairpin-lusinitiatie ΔG°37 (kcal/mol) per lusgrootte, SantaLucia & Hicks 2004, tabel 4 */
const LOOP = [[3, 3.5], [4, 3.5], [5, 3.3], [6, 4.0], [7, 4.2], [8, 4.3], [9, 4.5], [10, 4.6],
  [12, 5.0], [14, 5.1], [16, 5.3], [18, 5.5], [20, 5.7], [25, 6.1], [30, 6.3]];

export const clean = s => String(s || '').toUpperCase().replace(/U/g, 'T').replace(/[^ACGTN]/g, '');
export const revcomp = s => s.split('').reverse().map(b => PAIR[b] || 'N').join('');

function loopDG(n) {
  if (n >= 30) return 6.3 + 2.44 * 1.9872e-3 * T37 * Math.log(n / 30);
  for (let i = 1; i < LOOP.length; i++) {
    const [a, ga] = LOOP[i - 1], [b, gb] = LOOP[i];
    if (n <= b) return ga + (gb - ga) * (n - a) / (b - a);
  }
}
/* ΔG van de stapelingen in a[i..i+len-1] (a is de bovenste streng, volledig gepaard) */
function stackDG(a, i, len) {
  let g = 0;
  for (let k = i; k < i + len - 1; k++) { const p = NN[a.slice(k, k + 2)]; g += dG(p[0], p[1]); }
  return g;
}

/* Sterkste dimeer van a met b (beide 5′→3′); a === b is een zelfdimeer.
   at3: het gepaarde stuk raakt het 3′-eind van een van de twee, dus de polymerase kan verlengen. */
export function dimer(a, b) {
  let best = {dg: 0, len: 0, at3: false};
  const self = a === b;
  for (let sh = 0; sh < a.length + b.length - 1; sh++) {
    /* a[i] ligt tegenover b[sh - i]: b loopt antiparallel */
    let run = 0;
    for (let i = 0; i <= a.length; i++) {
      const k = sh - i, ok = i < a.length && k >= 0 && k < b.length && PAIR[a[i]] === b[k];
      if (ok) { run++; continue; }
      if (run >= 3) {
        const s = i - run, top = a.slice(s, i);
        let g = stackDG(a, s, run) + endDG(a[s]) + endDG(a[i - 1]);
        if (self && top === revcomp(top) && sh === 2 * s + run - 1) g += -T37 * -1.4 / 1000; /* symmetrie */
        const at3 = i === a.length || sh - s === b.length - 1;
        if (g < best.dg) best = {dg: g, len: run, at3};
      }
      run = 0;
    }
  }
  return best;
}

/* Stabielste haarspeld: stam s[i..i+n-1] tegen s[j-n+1..j] omgekeerd, lus ≥ 3 nt. */
export function hairpin(s) {
  let best = {dg: 0, stem: 0, loop: 0, at3: false};
  const L = s.length;
  for (let i = 0; i < L; i++) for (let j = L - 1; j - i - 1 >= 3; j--) {
    if (PAIR[s[i]] !== s[j] || (i > 0 && j < L - 1 && PAIR[s[i - 1]] === s[j + 1])) continue; /* alleen buitenste paar */
    let n = 0;
    while (j - n - (i + n) - 1 >= 3 && PAIR[s[i + n]] === s[j - n]) n++;
    if (n < 3) continue;
    const loop = j - i - 2 * n + 1, g = stackDG(s, i, n) + endDG(s[i]) + loopDG(loop);
    if (g < best.dg) best = {dg: g, stem: n, loop, at3: j === L - 1};
  }
  return best;
}

/* Grenzen van Premier Biosoft (PCR Primer Design Guidelines) in kcal/mol */
export const LIM = {dimer3: -5, dimer: -6, hair3: -2, hair: -3};
export const dimerBad = d => d.dg < (d.at3 ? LIM.dimer3 : LIM.dimer);
export const hairBad = h => h.dg < (h.at3 ? LIM.hair3 : LIM.hair);

/* Eén regel per primer: "naam sequentie" (spatie, tab, dubbele punt, komma of puntkomma
   ertussen) of alleen een sequentie. 5′-/3′-markeringen worden weggelaten. */
export function parsePrimers(text) {
  const out = [];
  String(text || '').split(/\r?\n/).forEach(line => {
    line = line.replace(/5['′]-?|-?3['′]/g, ' ');
    let name, seq = '';
    if (line.includes('\t')) { const i = line.lastIndexOf('\t'); name = line.slice(0, i); seq = line.slice(i); }
    else {
      /* de sequentie mag spaties bevatten: alle woorden achteraan die alleen uit basen bestaan */
      const tok = line.trim().split(/[\s:;,]+/).filter(Boolean);
      while (tok.length && /^[ACGTUN]+$/i.test(tok[tok.length - 1])) seq = tok.pop() + seq;
      name = tok.join(' ');
    }
    seq = clean(seq);
    if (seq) out.push({name: name.replace(/[:;,\s]+$/, '').trim(), seq});
  });
  return out;
}

/* Alles wat de kaart toont voor één primer; ion zoals primerInfo() hem verwacht */
export function analyse(p, ion) {
  const info = primerInfo(p.seq, ion);
  return {...p, info, self: dimer(p.seq, p.seq), hair: hairpin(p.seq)};
}
