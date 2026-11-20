/* ================= GELPLANNER ================= */
/* De geldrager wordt van bovenaf getekend op schaal van de gekozen maat; de kam zet
   evenveel slotjes neer als er tanden zijn en de lanen uit de tabel gaan er van links
   naar rechts in. Namen staan schuin boven de gel, zodat lange namen elkaar niet raken. */
const GPTRAY = {'7x7': [7, 7], '7x10': [7, 10], '10x15': [10, 15], '15x15': [15, 15], '20x25': [20, 25]};
/* ladders per geltype; de groottes zelf komen uit LADDERS van de tool Agarosegel */
const GPLAD = {
  dna: [['100', '100 bp-ladder (1000\u2013100 bp)'], ['neb100', 'NEB 100 bp (1517\u2013100 bp)'],
    ['100p', '100 bp plus (3000\u2013100 bp)'], ['1k', '1 kb-ladder (10 000\u2013250 bp)'],
    ['b50', '50 bp-ladder (500\u201350 bp)']],
  sds: [['ppp', 'Precision Plus Dual Color (250\u201310 kDa)'], ['prplus', 'PageRuler Plus Prestained (250\u201310 kDa)']]
};
/* prestained ladders hebben gekleurde referentiebanden; de rest is blauw */
const GPREF = {ppp: {75: '#c0335f', 25: '#c0335f'}, prplus: {70: '#2e8b57', 25: '#c0335f'}};
const gpMode = () => ($('#gp-type') && $('#gp-type').value === 'sds') ? 'sds' : 'dna';
const gpUnit = () => gpMode() === 'sds' ? 'kDa' : 'bp';
const gpBands = () => (typeof LADDERS !== 'undefined' && LADDERS[$('#gp-lad').value]) || [];
/* loopafstand als fractie van de gellengte: log(grootte) lineair tussen de uiterste banden */
function gpMig(size, lo, hi) { if (!(size > 0) || !(hi > lo)) return NaN;
  const f = (Math.log10(hi) - Math.log10(size)) / (Math.log10(hi) - Math.log10(lo));
  return 0.1 + 0.78 * Math.max(0, Math.min(1, f)); }
const gpTray = () => GPTRAY[$('#gp-tray').value] || GPTRAY['7x10'];
const gpTeeth = () => Math.max(1, Math.min(30, Math.round(num($('#gp-comb').value) || 10)));
/* De laantabel is sinds S255 een <lk-etable> in src/tools/Gelplan.vue; de kolommen en de
   beginrijen staan daar. etGet('gp-tbl') leest hem gewoon uit, want de component rendert
   dezelfde invoervelden in dezelfde volgorde. */
const gpLadLane = () => Math.max(0, Math.min(30, Math.round(num($('#gp-ladlane').value) || 0)));
/* slotvolume uit de maten van kam en gel; 1 mm3 = 1 uL en een slotje wordt tot 80% gevuld */
const GPFILL = 0.8, GPFLOOR = 1;
function gpWell() { const w = num($('#gp-tooth').value), t = num($('#gp-thick').value), g = num($('#gp-gelmm').value), d = g - GPFLOOR;
  if (!(w > 0) || !(t > 0) || !(d > 0)) return null;
  const geom = w * t * d; return {geom, max: geom * GPFILL}; }
/* laadbuffer: bij 6x hoort 1 deel buffer op 5 delen monster */
const gpDyeX = () => { const x = num($('#gp-dyex').value); return x > 1 ? x : 0; };
const gpDye = v => { const x = gpDyeX(); return x && isFinite(v) && v > 0 ? v / (x - 1) : 0; };
/* kleurfronten in TAE/TBE: met welke fragmentgrootte loopt de kleurstof mee (bp) */
const GPFRONT = [[0.5, 1000, 10000], [0.7, 700, 6000], [1.0, 300, 4000], [1.2, 200, 3000],
  [1.5, 150, 1800], [2.0, 100, 750], [3.0, 50, 250]];
function gpFronts(pct) { if (!(pct > 0)) return null;
  const T = GPFRONT;
  if (pct <= T[0][0]) return [T[0][1], T[0][2]];
  if (pct >= T[T.length - 1][0]) return [T[T.length - 1][1], T[T.length - 1][2]];
  for (let i = 1; i < T.length; i++) { if (pct > T[i][0]) continue;
    const a = T[i - 1], b = T[i], f = (pct - a[0]) / (b[0] - a[0]);
    const ip = (p, q) => 10 ** (Math.log10(p) + f * (Math.log10(q) - Math.log10(p)));
    return [ip(a[1], b[1]), ip(a[2], b[2])]; }
  return null; }

/* De gel van bovenaf. De component roept dit na elke render aan; een virtuele DOM heeft op
   een <canvas> geen nut, en tekst op een canvas loopt al door trCanvas(). De invoer wordt uit
   de velden gelezen, net als eerst: de component houdt met v-model dezelfde id's bij. */
function gpDrawTop() {
  const rows = etGet('gp-tbl'), teeth = gpTeeth(), [tw, tl] = gpTray();
  const title = $('#gp-title').value.trim(), dye = $('#gp-dye').value.trim();
  const lanes = rows.slice(0, teeth);

  /* De breedte volgt het aantal slotjes; de lengte volgt de verhouding van de drager, maar
     begrensd: een maxi-gel op ware schaal wordt zo hoog dat het schema onleesbaar wordt.
     De echte maat staat als tekst onder de gel. */
  const GW = Math.max(360, Math.min(680, teeth * 46 + 120));
  const GH = Math.max(170, Math.min(300, Math.round(GW * tl / tw)));
  const maxLab = Math.max(6, ...lanes.map(r => String(r[0] || '').length));
  const labH = Math.min(150, Math.round(maxLab * 6.2) + 24);
  const W = GW + (gpBands().length ? 260 : 150), t0 = title ? 40 : 0;
  const NT_ = pNotes('gp', W), AU = pAuto('gp'), NH = NT_.length ? NT_.length * 17 + 10 : 0;
  const H = t0 + labH + GH + 70 + (AU ? 18 : 0) + NH;

  pShow($('#gp-cv'), W, H, (x) => {
    pTitle(x, title, W);
    const gx = 30, gy = t0 + labH, pitch = GW / (teeth + 1), ww = Math.min(34, pitch * 0.62);
    /* geldrager met de gel erin */
    x.fillStyle = '#f4f6f8'; x.strokeStyle = PCOL.ink; x.lineWidth = 1.6;
    x.beginPath(); x.roundRect(gx - 10, gy - 10, GW + 20, GH + 20, 7); x.fill(); x.stroke();
    x.fillStyle = '#e9edf2'; x.strokeStyle = PCOL.line; x.lineWidth = 1.2;
    x.beginPath(); x.rect(gx, gy, GW, GH); x.fill(); x.stroke();

    /* alle tanden van de kam tekenen, ook de slotjes die leeg blijven */
    for (let i = 0; i < teeth; i++) {
      const r = lanes[i] || [], cx = gx + pitch * (i + 1), nm = String(r[0] || '').trim(),
        col = /^#[0-9a-f]{6}$/i.test(r[3]) ? r[3] : '#1558b0';
      x.fillStyle = nm ? col : '#ffffff'; x.strokeStyle = PCOL.ink; x.lineWidth = 1.2;
      x.beginPath(); x.rect(cx - ww / 2, gy + 12, ww, 10); x.fill(); x.stroke();
      if (i + 1 === gpLadLane()) { x.fillStyle = PCOL.ink; x.font = '600 10px ' + PFONT(); x.textAlign = 'center'; x.fillText('L', cx, gy + 17); }
      x.fillStyle = PCOL.muted; x.font = '11px ' + PFONT(); x.textAlign = 'center';
      x.fillText(String(i + 1), cx, gy + 36);
      if (!nm) continue;
      x.save(); x.translate(cx, gy - 14); x.rotate(-Math.PI / 4); x.textAlign = 'left';
      x.font = '12px ' + PFONT(); x.fillStyle = PCOL.ink; x.fillText(uv(nm), 0, 0); x.restore();
      const v = num(r[1]), dv = gpDye(v);
      if (isFinite(v) && v > 0) { x.fillStyle = PCOL.muted; x.font = '11px ' + PFONT(); x.textAlign = 'center';
        x.fillText(dv ? `${NL(v, 1)} + ${NL(dv, 1)} µL` : `${NL(v, 1)} µL`, cx, gy + 52);
        const cap = gpWell(); if (cap && v + dv > cap.max) { x.fillStyle = PCOL.warn; x.font = '600 12px ' + PFONT(); x.fillText('!', cx, gy + 68); } }
    }

    /* ladder naast de gel: de banden zoals ze na het lopen zullen staan */
    const bands = gpBands(), sds = gpMode() === 'sds';
    let lx = gx + GW + 26;
    if (bands.length) { const lo = bands[bands.length - 1], hi = bands[0], lwd = 26, refs = sds ? (GPREF[$('#gp-lad').value] || {}) : {};
      x.fillStyle = '#e9edf2'; x.strokeStyle = PCOL.line; x.lineWidth = 1;
      x.beginPath(); x.rect(lx, gy, lwd, GH); x.fill(); x.stroke();
      x.fillStyle = PCOL.ink; x.strokeStyle = PCOL.ink; x.lineWidth = 1.2;
      x.beginPath(); x.rect(lx + 3, gy + 12, lwd - 6, 8); x.stroke();
      bands.forEach(bp => { const y = gy + GH * gpMig(bp, lo, hi); if (!isFinite(y)) return;
        x.fillStyle = sds ? (refs[bp] || '#2a5fa8') : '#2b3440';
        x.globalAlpha = sds ? 1 : (bp === hi || bp === lo ? 1 : 0.82);
        x.fillRect(lx + 2, y - 2, lwd - 4, 3.4); x.globalAlpha = 1;
        x.fillStyle = PCOL.muted; x.font = '10px ' + PFONT(); x.textAlign = 'left';
        x.fillText(NL(bp, 0), lx + lwd + 5, y); });
      x.fillStyle = PCOL.ink; x.font = '600 11px ' + PFONT(); x.textAlign = 'center';
      x.save(); x.translate(lx + lwd / 2, gy - 8); x.fillText('L', 0, 0); x.restore();
      x.fillStyle = PCOL.muted; x.font = '10px ' + PFONT(); x.textAlign = 'left';
      x.fillText(gpUnit(), lx + lwd + 5, gy + GH + 14);
      lx += lwd + 52; }

    /* looprichting en maat */
    const ax = Math.max(gx + GW + 36, lx);
    x.strokeStyle = PCOL.ink; x.fillStyle = PCOL.ink; x.lineWidth = 1.6;
    x.beginPath(); x.moveTo(ax, gy + 22); x.lineTo(ax, gy + GH - 22); x.stroke();
    x.beginPath(); x.moveTo(ax, gy + GH - 14); x.lineTo(ax - 5, gy + GH - 25); x.lineTo(ax + 5, gy + GH - 25); x.closePath(); x.fill();
    x.font = '600 14px ' + PFONT(); x.textAlign = 'center';
    x.fillText('−', ax, gy + 8); x.fillText('+', ax, gy + GH + 6);
    x.font = '11px ' + PFONT(); x.fillStyle = PCOL.muted;
    x.save(); x.translate(ax + 15, gy + GH / 2); x.rotate(Math.PI / 2);
    x.fillText(sds ? 'looprichting eiwit' : 'looprichting DNA', 0, 0); x.restore();
    x.textAlign = 'left'; x.fillText(`${NL(tw, 0)} × ${NL(tl, 0)} cm`, gx, gy + GH + 30);

    if (NT_.length) pDrawNotes(x, NT_, H - NH - (AU ? 14 : 0) + 2);
    if (AU) { x.textAlign = 'left'; x.font = '11.5px ' + PFONT(); x.fillStyle = PCOL.muted;
      x.fillText(dye ? `Volume per slotje is inclusief ${uv(dye)}.` : 'Volume per slotje is inclusief de laadbuffer.', 20, H - 14); }
  });

}

/* ---------- verwachte gel: de banden zoals ze na het lopen zouden moeten staan ----------
   De posities komen uit de ladder (log(grootte) lineair tegen de loopafstand), hetzelfde
   verband waarmee de tool Agarosegel onbekende banden terugrekent. Het gelpercentage
   bepaalt niet de positie maar levert wel de waarschuwing of het fragment binnen het
   scheidingsbereik van dat percentage valt. */
const gpSizes = t => String(t || '').split(/[\s,;]+/).map(num).filter(v => isFinite(v) && v > 0);
function gpDrawPredict() {
  const rows = etGet('gp-tbl'), teeth = gpTeeth(), lanes = rows.slice(0, teeth);
  const bands = gpBands(), sds = gpMode() === 'sds', ladLane = gpLadLane();
  const any = lanes.some(r => gpSizes(r[2]).length);
  /* de component beslist met v-show of de tekening in beeld staat; hier alleen de vraag of er
     iets te tekenen valt */
  if (!bands.length || (!any && !ladLane)) return;
  const lo = bands[bands.length - 1], hi = bands[0];
  const GW = Math.max(360, Math.min(680, teeth * 46 + 120)), GH = 300, W = GW + 120;
  const maxLab = Math.max(6, ...lanes.map(r => String(r[0] || '').length));
  const labH = Math.min(150, Math.round(maxLab * 6.2) + 18), H = labH + GH + 56;
  const ink = sds ? '#15306b' : '#f2f5f8', bg = sds ? '#f2f3f0' : '#15181c';
  pShow($('#gpp-cv'), W, H, (x) => {
    const gx = 30, gy = labH, pitch = GW / (teeth + 1), ww = Math.min(34, pitch * 0.62);
    x.fillStyle = bg; x.beginPath(); x.roundRect(gx, gy, GW, GH, 4); x.fill();
    for (let i = 0; i < teeth; i++) {
      const r = lanes[i] || [], cx = gx + pitch * (i + 1), isLad = i + 1 === ladLane;
      x.fillStyle = sds ? '#d9dcd5' : '#2c3238';
      x.fillRect(cx - ww / 2, gy + 6, ww, 7);                      /* het slotje zelf */
      const list = isLad ? bands : gpSizes(r[2]);
      list.forEach(bp => { const m = gpMig(bp, lo, hi); if (!isFinite(m)) return;
        const y = gy + GH * m, out1 = bp > hi || bp < lo;
        x.fillStyle = ink; x.globalAlpha = out1 ? 0.45 : (isLad ? 0.85 : 1);
        x.beginPath(); x.roundRect(cx - ww / 2, y - 2, ww, 4, 2); x.fill(); x.globalAlpha = 1;
        if (isLad) { x.fillStyle = sds ? PCOL.muted : '#9aa6b2'; x.font = '9.5px ' + PFONT(); x.textAlign = 'right'; x.fillText(NL(bp, 0), cx - ww / 2 - 4, y); } });
      x.fillStyle = PCOL.muted; x.font = '10.5px ' + PFONT(); x.textAlign = 'center';
      x.fillText(String(i + 1), cx, gy + GH + 14);
      const nm = String(r[0] || '').trim();
      if (nm) { x.save(); x.translate(cx, gy - 10); x.rotate(-Math.PI / 4); x.textAlign = 'left'; x.font = '11px ' + PFONT(); x.fillStyle = PCOL.ink; x.fillText(uv(nm), 0, 0); x.restore(); }
    }
    /* kleurfronten van de laadbuffer */
    const fr = sds ? null : gpFronts(num($('#gp-pct').value));
    if (fr) { [[fr[0], 'bromofenolblauw', '#2f4bbf'], [fr[1], 'xyleencyanol', '#0f7f8f']].forEach(([bp, nm, col]) => {
        const m = gpMig(bp, lo, hi); if (!isFinite(m)) return; const y = gy + GH * m;
        x.save(); x.strokeStyle = col; x.lineWidth = 1.4; x.setLineDash([5, 4]);
        x.beginPath(); x.moveTo(gx + 4, y); x.lineTo(gx + GW - 4, y); x.stroke(); x.restore();
        x.fillStyle = col; x.font = '600 9.5px ' + PFONT(); x.textAlign = 'right';
        x.fillText(nm, gx + GW - 6, y - 7); }); }
    else if (sds) { const y = gy + GH * 0.93;
      x.save(); x.strokeStyle = '#2f4bbf'; x.lineWidth = 1.4; x.setLineDash([5, 4]);
      x.beginPath(); x.moveTo(gx + 4, y); x.lineTo(gx + GW - 4, y); x.stroke(); x.restore();
      x.fillStyle = '#2f4bbf'; x.font = '600 9.5px ' + PFONT(); x.textAlign = 'right'; x.fillText('loopfront', gx + GW - 6, y - 7); }
    x.fillStyle = PCOL.muted; x.font = '11px ' + PFONT(); x.textAlign = 'left';
    x.fillText(sds ? 'Verwacht beeld na Coomassie-kleuring; posities uit de ladder.' : 'Verwacht beeld onder UV; posities uit de ladder.', gx, gy + GH + 36);
  });
}

/* ---------- gel gieten ----------
   Het percentage-advies en de receptkaart staan in src/tools/Gelplan.vue; hier blijft de
   kleuring staan: de naam en hoeveel er per mL gel in gaat. */
const GPSTAIN = {g10k: ['GelRed / SYBR Safe (1× uit 10 000×)', v => v / 10 * 1], etbr: ['Ethidiumbromide (0,5 µg/mL)', v => v * 0.05], none: [null, null]};
document.addEventListener('click', e => { const b = e.target.closest('[data-gp-pct]'); if (!b) return;
  $('#gp-pct').value = NL(num(b.dataset.gpPct), 1); $('#gp-pct').dispatchEvent(new Event('input', {bubbles: true})); });

/* ---------- looptijd ----------
   De snelheid van bromofenolblauw is evenredig met de veldsterkte en loopt terug bij een
   hoger percentage agarose. De ijking (10 V/cm, 1%: 6 cm in 35 min) komt uit een gangbare
   minigel; de uitkomst is dus een schatting met een ruime marge, geen meetwaarde. De tekst
   eromheen staat in src/tools/Gelplan.vue. */
const GPV0 = 6 / 35 / 10;   /* cm per minuut per V/cm bij 1% agarose */
const gpSpeed = (E, pct) => (E > 0 && pct > 0) ? GPV0 * E / Math.sqrt(pct) : NaN;
const gpMin = m => !isFinite(m) ? '–' : m >= 60 ? `${Math.floor(m / 60)} u ${Math.round(m % 60)} min` : `${Math.round(m)} min`;
/* De velden en de uitkomstenlijst staan in src/tools/Gelplan.vue; calc.gplan() daar laat de
   component opnieuw tekenen. Een verandering in een veld komt via v-model binnen, dus de
   koppelingen die hier stonden zijn niet meer nodig. */
