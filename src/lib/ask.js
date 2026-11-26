/* ================= ZOEKEN DAT VRAGEN BEGRIJPT (S121) =================
   ask("500 mL 0,9% NaCl", CHEM) → welke tool en welke velden: {tool, first?, v, tb?} of null.
   first wordt eerst gezet (een keuzelijst die bepaalt welke velden er zijn), dan v en tb, met
   toolApply() (src/legacy/nt/99_app.js). Vijf rekenaars: Oplossing, Verdunning, Centrifuge,
   Eenheden en Molmassa; Nederlands en Engels. Getallen blijven getallen; wie ze in een veld zet,
   schrijft ze in de taal van de gebruiker. */

const VOL = {'µl': 'µL', 'ul': 'µL', 'ml': 'mL', 'l': 'L'};
/* concentraties zoals ze in de vraag staan → de schrijfwijze van Verdunning */
const CONC = {'M': 'M', 'mM': 'mM', 'µM': 'µM', 'uM': 'µM', 'nM': 'nM', '%': '%', 'g/L': 'g/L', 'g/l': 'g/L',
  'mg/mL': 'mg/mL', 'mg/ml': 'mg/mL', 'µg/mL': 'µg/mL', 'ug/mL': 'µg/mL', 'µg/ml': 'µg/mL', 'ug/ml': 'µg/mL',
  'ng/µL': 'ng/µL', 'ng/uL': 'ng/µL', 'ng/µl': 'ng/µL', 'ng/ul': 'ng/µL'};
const OPLOS = {'M': 'M', 'mM': 'mM', 'µM': 'µM', '%': '% w/v', 'g/L': 'g/L'};
const UNITS = {'M': 'M', 'mM': 'mM', 'µM': 'uM', 'nM': 'nM', 'g/L': 'gL', 'mg/mL': 'mgmL', 'µg/mL': 'ugmL', 'ng/µL': 'ngul', '%': 'pct'};

const NUM = '(\\d+(?:[.,]\\d+)?)';
const UNIT = 'ng\\/[µu][lL]|[mµu]g\\/m[lL]|g\\/[lL]|[mµun]M|M|%|[µu][lL]|m[lL]|[lL]|rpm|[x×]\\s*g|cm';
const STOP = new Set(('van in uit from of naar to stock maak make maken hoeveel how much many for voor een a an ik wil nodig i need ' +
  'oplossing solution buffer met with bij at rotor straal radius de het the per en and is die').split(' '));
const n = s => Number(s.replace(',', '.'));
/* een eenheid zonder getal ("naar µM") is geen stofnaam */
const BARE = new RegExp('^(?:' + UNIT + ')$');

function tokens(q) {
  const out = [], re = new RegExp(NUM + '\\s*(' + UNIT + ')(?![A-Za-zµ])', 'g');
  let m;
  while ((m = re.exec(q))) {
    const u = m[2].replace(/\s+/g, ''), v = n(m[1]);
    const kind = /^[x×]g$/.test(u) ? 'g' : u === 'rpm' ? 'rpm' : u === 'cm' ? 'cm' : VOL[u.toLowerCase()] && !CONC[u] ? 'vol' : CONC[u] ? 'conc' : null;
    if (kind) out.push({v, u: kind === 'vol' ? VOL[u.toLowerCase()] : kind === 'conc' ? CONC[u] : u, kind, at: m.index, end: m.index + m[0].length});
  }
  return out;
}
/* de woorden die over blijven als stofnaam; met hoofdletters zoals getypt */
function rest(q, toks) {
  let s = q; [...toks].reverse().forEach(t => { s = s.slice(0, t.at) + ' ' + s.slice(t.end); });
  return s.replace(/\d+\s*:\s*\d+/g, ' ').split(/[\s,;?]+/).filter(w => w && !STOP.has(w.toLowerCase()) && !/^\d/.test(w) && !BARE.test(w)).join(' ');
}
function chemOf(name, chem) {
  if (!name) return null;
  const low = name.toLowerCase(), keys = Object.keys(chem || {});
  const k = keys.find(x => x.toLowerCase() === low) || keys.find(x => x.toLowerCase().startsWith(low + ' ') || x.toLowerCase().startsWith(low + '-'));
  return k ? [k, chem[k]] : null;
}

export function ask(query, chem) {
  const q = String(query || '').trim(); if (!q) return null;
  const T = tokens(q), of = k => T.filter(t => t.kind === k), name = rest(q, T);

  /* Molmassa: "molmassa NaCl", "molar mass of …" */
  const mm = q.match(/^(?:molmassa|molecuulmassa|molar mass|molecular weight|mw)\s+(?:van\s+|of\s+)?(\S+)$/i);
  if (mm) return {tool: 'molm', v: {'mm-f': mm[1]}};

  /* Centrifuge: rpm of × g, met een straal in cm */
  const rpm = of('rpm')[0], g = of('g')[0], cm = of('cm')[0];
  if (rpm || g) { const v = {}; if (cm) v['z-r'] = cm.v; if (rpm) v['z-rpm'] = rpm.v; else v['z-g'] = g.v; return {tool: 'centrifuge', v}; }

  const vol = of('vol')[0], conc = of('conc');
  const vEnd = vol ? {'d-v2': vol.v, 'd-v2u': vol.u} : {};

  /* Verdunning: "1:10 van 50 mL" */
  const ratio = q.match(/(\d+)\s*:\s*(\d+)/);
  if (ratio && +ratio[1] > 0 && +ratio[2] >= +ratio[1]) {
    return {tool: 'verdunning', first: {'d-mode': 'een'}, v: {'d-c1': +ratio[2] / +ratio[1], 'd-c1u': 'X', 'd-c2': 1, 'd-c2u': 'X', 'd-v1': '', ...vEnd}};
  }
  /* Verdunning: twee concentraties, de stock na "uit/from/van" (of het woord stock) */
  if (conc.length === 2) {
    const kw = q.search(/\b(uit|from|van|of a|stock)\b/i);
    const stock = kw >= 0 && conc[1].at > kw ? conc[1] : kw >= 0 && conc[0].at > kw ? conc[0] : conc[0].v >= conc[1].v ? conc[0] : conc[1];
    const want = conc[0] === stock ? conc[1] : conc[0];
    return {tool: 'verdunning', first: {'d-mode': 'een'}, v: {'d-c1': stock.v, 'd-c1u': stock.u, 'd-c2': want.v, 'd-c2u': want.u, 'd-v1': '', ...vEnd}};
  }
  if (conc.length !== 1) return null;
  const c = conc[0], ch = chemOf(name, chem);

  /* Eenheden: "5 mg/mL naar µM" */
  if (!vol && /\b(naar|to|in|into)\s+(\S+)\s*$/i.test(q) && UNITS[c.u]) {
    const v = {'un-v': c.v, 'un-u': UNITS[c.u]}; if (ch) v['un-mw'] = ch[1];
    return {tool: 'units', v};
  }
  /* Oplossing: een volume, een concentratie en een stof */
  if (vol && OPLOS[c.u] && name) {
    return {tool: 'oplossing', v: {'o-v': vol.v, 'o-vu': vol.u === 'µL' ? 'mL' : vol.u}, tb: {'o-tbl': [[ch ? ch[0] : name, ch ? ch[1] : '', c.v, OPLOS[c.u]]]}};
  }
  return null;
}
