/* ================= GELPLANNER ================= */
/* De geldrager wordt van bovenaf getekend op schaal van de gekozen maat; de kam zet
   evenveel slotjes neer als er tanden zijn en de lanen uit de tabel gaan er van links
   naar rechts in. Namen staan schuin boven de gel, zodat lange namen elkaar niet raken. */
const GPTRAY = {'7x7': [7, 7], '7x10': [7, 10], '10x15': [10, 15], '15x15': [15, 15], '20x25': [20, 25]};
const gpTray = () => GPTRAY[$('#gp-tray').value] || GPTRAY['7x10'];
const gpTeeth = () => Math.max(1, Math.min(30, Math.round(num($('#gp-comb').value) || 10)));
const gpT = ET('gp-tbl', [{h: 'Monster', t: 'txt', w: 160}, {h: 'Volume (µL)', t: 'num', w: 76}, {h: 'Kleur', t: 'col', d: '#1558b0'}],
  [['Ladder', '5', '#c2410c'], ['Monster 1', '10', '#1558b0'], ['Monster 2', '10', '#1558b0'], ['Negatieve controle', '10', '#5f6b7a']], 'gplan');

calc.gplan = function () {
  const rows = etGet('gp-tbl'), teeth = gpTeeth(), [tw, tl] = gpTray();
  const title = $('#gp-title').value.trim(), dye = $('#gp-dye').value.trim(), out = $('#gp-out');
  const lanes = rows.slice(0, teeth);

  /* De breedte volgt het aantal slotjes; de lengte volgt de verhouding van de drager, maar
     begrensd: een maxi-gel op ware schaal wordt zo hoog dat het schema onleesbaar wordt.
     De echte maat staat als tekst onder de gel. */
  const GW = Math.max(360, Math.min(680, teeth * 46 + 120));
  const GH = Math.max(170, Math.min(300, Math.round(GW * tl / tw)));
  const maxLab = Math.max(6, ...lanes.map(r => String(r[0] || '').length));
  const labH = Math.min(150, Math.round(maxLab * 6.2) + 24);
  const W = GW + 150, t0 = title ? 40 : 0;
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
        col = /^#[0-9a-f]{6}$/i.test(r[2]) ? r[2] : '#1558b0';
      x.fillStyle = nm ? col : '#ffffff'; x.strokeStyle = PCOL.ink; x.lineWidth = 1.2;
      x.beginPath(); x.rect(cx - ww / 2, gy + 12, ww, 10); x.fill(); x.stroke();
      x.fillStyle = PCOL.muted; x.font = '11px ' + PFONT(); x.textAlign = 'center';
      x.fillText(String(i + 1), cx, gy + 36);
      if (!nm) continue;
      x.save(); x.translate(cx, gy - 14); x.rotate(-Math.PI / 4); x.textAlign = 'left';
      x.font = '12px ' + PFONT(); x.fillStyle = PCOL.ink; x.fillText(uv(nm), 0, 0); x.restore();
      const v = num(r[1]);
      if (isFinite(v) && v > 0) { x.fillStyle = PCOL.muted; x.font = '11px ' + PFONT(); x.textAlign = 'center'; x.fillText(`${NL(v, 1)} µL`, cx, gy + 52); }
    }

    /* looprichting en maat */
    const ax = gx + GW + 36;
    x.strokeStyle = PCOL.ink; x.fillStyle = PCOL.ink; x.lineWidth = 1.6;
    x.beginPath(); x.moveTo(ax, gy + 22); x.lineTo(ax, gy + GH - 22); x.stroke();
    x.beginPath(); x.moveTo(ax, gy + GH - 14); x.lineTo(ax - 5, gy + GH - 25); x.lineTo(ax + 5, gy + GH - 25); x.closePath(); x.fill();
    x.font = '600 14px ' + PFONT(); x.textAlign = 'center';
    x.fillText('−', ax, gy + 8); x.fillText('+', ax, gy + GH + 6);
    x.font = '11px ' + PFONT(); x.fillStyle = PCOL.muted;
    x.save(); x.translate(ax + 15, gy + GH / 2); x.rotate(Math.PI / 2); x.fillText('looprichting DNA', 0, 0); x.restore();
    x.textAlign = 'left'; x.fillText(`${NL(tw, 0)} × ${NL(tl, 0)} cm`, gx, gy + GH + 30);

    if (NT_.length) pDrawNotes(x, NT_, H - NH - (AU ? 14 : 0) + 2);
    if (AU) { x.textAlign = 'left'; x.font = '11.5px ' + PFONT(); x.fillStyle = PCOL.muted;
      x.fillText(dye ? `Volume per slotje is inclusief ${uv(dye)}.` : 'Volume per slotje is inclusief de laadbuffer.', 20, H - 14); }
  });

  const used = lanes.filter(r => String(r[0] || '').trim());
  const vols = used.map(r => num(r[1])).filter(v => isFinite(v) && v > 0);
  out.innerHTML = kv([['Gebruikte slotjes', `${used.length} van ${teeth}`],
    ['Grootste laadvolume', vols.length ? NL(Math.max(...vols), 1) + ' µL' : '–'],
    ['Totaal te laden', vols.length ? NL(vols.reduce((a, b) => a + b, 0), 1) + ' µL' : '–']]);
  if (rows.length > teeth) out.insertAdjacentHTML('beforeend', note('warn', `Er staan ${rows.length} lanen in de tabel maar de kam heeft ${teeth} tanden; de laatste lanen worden niet getekend.`));
};
$('#gp-tray').addEventListener('change', () => calc.gplan());
