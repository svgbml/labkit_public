/* Bomen (S182, S183; #353–#356): Newick/.dnd inlezen, tekenen (rechthoekig en radiaal) en neighbour-joining.
   Zuivere functies; tekenen geeft een lijst primitieven (lijn, boog, tekst) die zowel naar SVG als naar een canvas gaan.
   Een knoop is {name, len (getal of null), kids: []}. */

/* ---------- Newick (Felsenstein, "The Newick tree format", evolution.genetics.washington.edu/phylip/newicktree.html) ----------
   Namen met of zonder quotes ('' binnen quotes is één '), takken na ':', [commentaar] wordt overgeslagen, witruimte en
   regeleinden doen niet mee (Clustal schrijft een .dnd over veel regels). Een _ in een naam blijft een _, zodat de naam
   gelijk blijft aan die in de uitlijning. Geeft {root} of {error}. */
export function parseNewick(text) {
  const s = String(text || '').replace(/\[[^\]]*\]/g, '');
  let i = 0;
  const ws = () => { while (i < s.length && /\s/.test(s[i])) i++; };
  const fail = m => { throw new Error(m); };
  const label = () => {
    ws();
    if (s[i] === "'") {
      let out = ''; i++;
      for (;;) {
        if (i >= s.length) fail('Een naam tussen aanhalingstekens wordt niet afgesloten.');
        if (s[i] === "'") { if (s[i + 1] === "'") { out += "'"; i += 2; continue; } i++; break; }
        out += s[i++];
      }
      return out;
    }
    const a = i; while (i < s.length && !/[\s(),:;]/.test(s[i])) i++;
    return s.slice(a, i);
  };
  const node = () => {
    ws();
    const n = {name: '', len: null, kids: []};
    if (s[i] === '(') {
      i++;
      for (;;) {
        n.kids.push(node()); ws();
        if (s[i] === ',') { i++; continue; }
        if (s[i] === ')') { i++; break; }
        fail('Haakjes kloppen niet: verwacht , of ).');
      }
    }
    n.name = label(); ws();
    if (s[i] === ':') {
      i++; ws();
      const a = i; while (i < s.length && /[-+0-9.eE]/.test(s[i])) i++;
      const v = parseFloat(s.slice(a, i));
      if (!Number.isFinite(v) || i === a) fail('Een taklengte is geen getal.');
      n.len = v;
    }
    return n;
  };
  try {
    ws(); if (i >= s.length) fail('Er staat geen boom.');
    const root = node(); ws();
    if (s[i] === ';') i++;
    ws(); if (i < s.length) fail('Haakjes kloppen niet: tekst na het einde van de boom.');
    if (!root.kids.length) fail('Er staat geen boom.');
    return {root};
  } catch (e) { return {error: e.message}; }
}

export const treeLeaves = n => n.kids.length ? n.kids.flatMap(treeLeaves) : [n.name];

/* een Newick-regel terug (voor de NJ-boom) */
export function treeNewick(n) {
  const q = x => /^[^\s(),:;'[\]]+$/.test(x) ? x : "'" + x.replace(/'/g, "''") + "'";
  const f = k => (k.kids.length ? '(' + k.kids.map(f).join(',') + ')' : '') + (k.name ? q(k.name) : '') + (k.len != null ? ':' + +k.len.toFixed(5) : '');
  return f(n) + ';';
}

/* de volgorde van de rijen (indexen in names) zoals de bladen van de boom; namen die er niet in staan achteraan */
export function treeOrder(root, names) {
  const at = new Map(); names.forEach((n, i) => { if (!at.has(n)) at.set(n, i); });
  const out = [], seen = new Set();
  for (const l of treeLeaves(root)) { const i = at.get(l); if (i != null && !seen.has(i)) { out.push(i); seen.add(i); } }
  names.forEach((_, i) => { if (!seen.has(i)) out.push(i); });
  return out;
}

/* ---------- neighbour-joining (S183) ----------
   Saitou & Nei 1987 (Mol Biol Evol 4:406), met het Q-criterium van Studier & Keppler 1988 (Mol Biol Evol 5:729):
   Q(i,j) = (n − 2)·d(i,j) − Σd(i) − Σd(j); het paar met de kleinste Q wordt een nieuwe knoop u met
   takken d(i,u) = d(i,j)/2 + (Σd(i) − Σd(j)) / (2(n − 2)) en d(j,u) = d(i,j) − d(i,u); d(k,u) = (d(i,k) + d(j,k) − d(i,j)) / 2.
   De laatste drie knopen hangen aan een ongewortelde drietak, zoals Clustal een .dnd schrijft. */
export function njTree(names, D) {
  let nodes = names.map(n => ({name: n, len: null, kids: []})), d = D.map(r => r.slice());
  while (nodes.length > 3) {
    const n = nodes.length, r = d.map(row => row.reduce((a, b) => a + b, 0));
    let bi = 0, bj = 1, bq = Infinity;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const q = (n - 2) * d[i][j] - r[i] - r[j];
      if (q < bq - 1e-12) { bq = q; bi = i; bj = j; }
    }
    const li = d[bi][bj] / 2 + (r[bi] - r[bj]) / (2 * (n - 2));
    nodes[bi].len = li; nodes[bj].len = d[bi][bj] - li;
    const u = {name: '', len: null, kids: [nodes[bi], nodes[bj]]}, keep = nodes.map((_, k) => k).filter(k => k !== bi && k !== bj);
    const du = keep.map(k => (d[bi][k] + d[bj][k] - d[bi][bj]) / 2);
    d = keep.map((k, a) => keep.map(l => d[k][l]).concat(du[a])).concat([du.concat(0)]);
    nodes = keep.map(k => nodes[k]).concat(u);
  }
  if (nodes.length === 3) {
    const [a, b, c] = [0, 1, 2];
    nodes[a].len = (d[a][b] + d[a][c] - d[b][c]) / 2; nodes[b].len = (d[a][b] + d[b][c] - d[a][c]) / 2; nodes[c].len = (d[a][c] + d[b][c] - d[a][b]) / 2;
  } else if (nodes.length === 2) nodes[0].len = nodes[1].len = d[0][1] / 2;
  return {name: '', len: null, kids: nodes};
}

/* afstand uit identiteit (0–1): 'p' = 1 − identiteit; 'jc' = Jukes & Cantor (1969): −b·ln(1 − p/b) met b = 3/4 voor DNA,
   19/20 voor eiwit. Boven de verzadiging (p ≥ b) Infinity. */
export function idDist(id, mode, nt) {
  const p = 1 - id;
  if (mode !== 'jc') return p;
  const b = nt ? 0.75 : 0.95, x = 1 - p / b;
  return x > 0 ? -b * Math.log(x) : Infinity;
}

/* ---------- tekenen ----------
   mode 'rect': de bladen onder elkaar, rowH per blad, x = som van de takken vanaf de wortel.
   mode 'radial': de bladen rond een cirkel, straal = som van de takken, een boog verbindt de kinderen.
   Negatieve takken (kan bij NJ) worden als 0 getekend. Zonder enige taklengte telt elke tak als 1 (cladogram).
   Geeft {W, H, top, prims, leaves: [{name, d, x, y}], scale: {len}}. */
const CHW = 7, FS = 12;
const nice = x => { const p = Math.pow(10, Math.floor(Math.log10(x))); return [5, 2, 1].map(k => k * p).find(v => v <= x) || p; };
export function treeLayout(root, o = {}) {
  const mode = o.mode === 'radial' ? 'radial' : 'rect', rowH = o.rowH || 18;
  const any = (function has(n) { return n.len != null || n.kids.some(has); })(root);
  const leaves = [], nodes = [];
  (function walk(n, d, par) {
    const me = {n, d, par, kids: []};
    nodes.push(me); if (par) par.kids.push(me);
    if (!n.kids.length) leaves.push(me);
    for (const k of n.kids) walk(k, d + Math.max(0, k.len == null ? (any ? 0 : 1) : k.len), me);
  })(root, 0, null);
  const maxD = Math.max(...leaves.map(l => l.d)) || 1, nameW = Math.max(...leaves.map(l => l.n.name.length)) * CHW + 8;
  const sc = nice(maxD / 3), prims = [], txt = (x, y, s, anchor = 'start', rot = 0) => prims.push({t: 'tx', x, y, s, anchor, rot});
  const line = (x1, y1, x2, y2) => prims.push({t: 'l', x1, y1, x2, y2});
  const post = []; (function p(m) { m.kids.forEach(p); post.push(m); })(nodes[0]);
  let W, H, top = 8;
  if (mode === 'rect') {
    const left = 10, bw = o.branchW || 360, sx = bw / maxD;
    leaves.forEach((l, i) => { l.y = top + i * rowH + rowH / 2; });
    for (const m of post) { m.x = left + m.d * sx; if (m.kids.length) m.y = (m.kids[0].y + m.kids[m.kids.length - 1].y) / 2; }
    for (const m of nodes) {
      if (m.par) line(m.par.x, m.y, m.x, m.y);
      if (m.kids.length) line(m.x, m.kids[0].y, m.x, m.kids[m.kids.length - 1].y);
      if (!m.kids.length) txt(m.x + 4, m.y, m.n.name);
    }
    const yb = top + leaves.length * rowH + 10;
    line(left, yb, left + sc * sx, yb); txt(left + sc * sx / 2, yb + 13, String(sc), 'middle');
    W = left + bw + 4 + nameW; H = yb + 20;
  } else {
    const R = o.radius || 160, pad = nameW + 6, c = pad + R, sr = R / maxD, n = leaves.length;
    leaves.forEach((l, i) => { l.a = i / n * 2 * Math.PI; });
    for (const m of post) if (m.kids.length) m.a = (m.kids[0].a + m.kids[m.kids.length - 1].a) / 2;
    const P = (r, a) => [c + r * Math.cos(a), c + r * Math.sin(a)];
    for (const m of nodes) {
      const r = m.d * sr;
      [m.x, m.y] = P(r, m.a);
      if (m.par) { const [x0, y0] = P(m.par.d * sr, m.a); line(x0, y0, m.x, m.y); }
      if (m.kids.length > 1 && r > 0) prims.push({t: 'a', cx: c, cy: c, r, a0: m.kids[0].a, a1: m.kids[m.kids.length - 1].a});
      if (!m.kids.length) {
        const deg = m.a * 180 / Math.PI, flip = deg > 90 && deg < 270, [tx, ty] = P(r + 4, m.a);
        txt(tx, ty, m.n.name, flip ? 'end' : 'start', flip ? deg - 180 : deg);
      }
    }
    const yb = 2 * c + 6;
    line(10, yb, 10 + sc * sr, yb); txt(10 + sc * sr / 2, yb + 13, String(sc), 'middle');
    W = 2 * c; H = yb + 20; top = 0;
  }
  return {W: Math.ceil(W), H: Math.ceil(H), top, prims, rowH, leaves: leaves.map(l => ({name: l.n.name, d: l.d, x: l.x, y: l.y})), scale: {len: sc}};
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r2 = v => Math.round(v * 100) / 100;
/* SVG; ink = lijn- en tekstkleur (op het scherm currentColor), bg = achtergrond of null */
export function treeSvg(L, o = {}) {
  const ink = o.ink || '#000', out = ['<svg xmlns="http://www.w3.org/2000/svg" width="' + L.W + '" height="' + L.H + '" viewBox="0 0 ' + L.W + ' ' + L.H + '" font-family="sans-serif" font-size="' + FS + '">'];
  if (o.bg) out.push('<rect width="100%" height="100%" fill="' + o.bg + '"/>');
  out.push('<g stroke="' + ink + '" stroke-width="1.2" fill="none" stroke-linecap="square">');
  for (const p of L.prims) {
    if (p.t === 'l') out.push('<line x1="' + r2(p.x1) + '" y1="' + r2(p.y1) + '" x2="' + r2(p.x2) + '" y2="' + r2(p.y2) + '"/>');
    else if (p.t === 'a') {
      const x0 = p.cx + p.r * Math.cos(p.a0), y0 = p.cy + p.r * Math.sin(p.a0), x1 = p.cx + p.r * Math.cos(p.a1), y1 = p.cy + p.r * Math.sin(p.a1);
      out.push('<path d="M' + r2(x0) + ' ' + r2(y0) + 'A' + r2(p.r) + ' ' + r2(p.r) + ' 0 ' + (p.a1 - p.a0 > Math.PI ? 1 : 0) + ' 1 ' + r2(x1) + ' ' + r2(y1) + '"/>');
    }
  }
  out.push('</g><g fill="' + ink + '">');
  for (const p of L.prims) if (p.t === 'tx') out.push('<text x="' + r2(p.x) + '" y="' + r2(p.y) + '" dominant-baseline="middle" text-anchor="' + p.anchor + '"' + (p.rot ? ' transform="rotate(' + r2(p.rot) + ' ' + r2(p.x) + ' ' + r2(p.y) + ')"' : '') + '>' + esc(p.s) + '</text>');
  out.push('</g></svg>');
  return out.join('');
}

/* hetzelfde op een canvas (voor PNG, buiten de pagina), wit met zwart, schaal k */
export function treePaint(cv, L, k = 2) {
  cv.width = Math.round(L.W * k); cv.height = Math.round(L.H * k);
  const x = cv.getContext('2d');
  x.setTransform(k, 0, 0, k, 0, 0); x.fillStyle = '#fff'; x.fillRect(0, 0, L.W, L.H);
  x.strokeStyle = x.fillStyle = '#000'; x.lineWidth = 1.2; x.font = FS + 'px sans-serif'; x.textBaseline = 'middle';
  for (const p of L.prims) {
    x.beginPath();
    if (p.t === 'l') { x.moveTo(p.x1, p.y1); x.lineTo(p.x2, p.y2); x.stroke(); }
    else if (p.t === 'a') { x.arc(p.cx, p.cy, p.r, p.a0, p.a1); x.stroke(); }
    else { x.save(); x.translate(p.x, p.y); x.rotate(p.rot * Math.PI / 180); x.textAlign = p.anchor === 'middle' ? 'center' : p.anchor === 'end' ? 'right' : 'left'; x.fillText(p.s, 0, 0); x.restore(); }
  }
}
