/* ================= PLAATLEZER-WIZARD (S92) =================
   Eén venster voor Standaardcurve, ELISA en Z′: een export van de plaatlezer openen of plakken
   (plateRead in src/lib/platereader.js kent Gen5, Multiskan, Tecan, SoftMax Pro en een lijst per putje),
   een plaat kiezen als het bestand er meer heeft, en de waarden overnemen in de tool:
   - curve: het raster gaat in de plaatlezer-import van Standaardcurve (s-ptxt); welke kolommen
     standaarden en monsters zijn, kies je daar zoals altijd;
   - elisa: het absorptieblok (el-a), 8 regels met 12 waarden; de indeling (el-l) blijft van de tool;
   - zprime: je klikt putjes aan als positief, negatief of monster; hun waarden gaan naar zp-pos, zp-neg, zp-s.
   Het venster bouwt zijn DOM zelf; appModal() vertaalt de vaste tekst (tStatic), de waarden en
   putjesnamen staan in data-notr. */
import {expose} from '../lib/global.js';

const ROLES = {pos: {n: 'Positief', c: '#2e9d4f'}, neg: {n: 'Negatief', c: '#d62828'}, smp: {n: 'Monster', c: '#1d5bc4'}};
const FMT = {grid: 'raster met rijletters (Gen5, Multiskan, Excel)', tecan: 'Tecan i-control / Magellan', softmax: 'SoftMax Pro', list: 'lijst per putje (BMG)'};

function setVal(id, v) { const el = document.getElementById(id); if (!el) return; el.value = v; el.dispatchEvent(new Event('input', {bubbles: true})); el.dispatchEvent(new Event('change', {bubbles: true})); }
const f4 = v => (isFinite(v) ? String(+v.toPrecision(6)) : '');

export function plateWizard(target) {
  const m = appModal(`<h3 style="margin:0 0 8px;font-size:16px">Plaatlezer-bestand openen</h3>
    <div class="row" style="gap:8px;align-items:center"><input type="file" data-pw-file accept=".txt,.csv,.tsv,.xls,.dat,text/plain"><span style="font-size:13px;color:var(--muted)">of plak de export hieronder</span></div>
    <textarea data-pw-txt rows="4" class="mono" style="width:100%;margin-top:6px;font-size:12px" data-notr></textarea>
    <div data-pw-info style="font-size:13px;margin-top:6px"></div>
    <div data-pw-roles class="row" style="gap:6px;margin-top:8px;display:none"><span style="font-size:13px">Klik putjes aan als:</span>${Object.entries(ROLES).map(([k, r]) => `<button type="button" data-pw-role="${k}" style="border-left:6px solid ${r.c}">${r.n}</button>`).join('')}<button type="button" data-pw-role="">Wissen</button></div>
    <div data-pw-grid data-notr style="overflow-x:auto;margin-top:8px"></div>
    <div class="row" style="margin-top:12px;gap:6px"><button type="button" class="primary" data-pw-ok disabled>Overnemen</button><button type="button" data-pw-no>Annuleren</button></div>`);
  const B = m.box, info = B.querySelector('[data-pw-info]'), grid = B.querySelector('[data-pw-grid]'), ok = B.querySelector('[data-pw-ok]');
  const st = {res: null, p: 0, role: 'pos', roles: {}};
  if (target === 'zprime') B.querySelector('[data-pw-roles]').style.display = 'flex';
  const plate = () => st.res && st.res.plates[st.p];
  const draw = () => {
    const p = plate(); if (!p) { grid.innerHTML = ''; ok.disabled = true; return; }
    const rows = plateRows(p), R = Object.keys(rows);
    grid.innerHTML = `<table class="mini" style="font-size:11.5px"><thead><tr><th></th>${Array.from({length: p.cols}, (_, k) => `<th class="num">${k + 1}</th>`).join('')}</tr></thead><tbody>${R.map(r => `<tr><th>${r}</th>${rows[r].map((v, k) => { const id = r + (k + 1), ro = ROLES[st.roles[id]]; return `<td class="num" data-w="${id}" style="cursor:${target === 'zprime' ? 'pointer' : 'default'};${ro ? `background:${ro.c}33;box-shadow:inset 0 -3px ${ro.c}` : ''}">${esc(f4(v))}</td>`; }).join('')}</tr>`).join('')}</tbody></table>`;
    ok.disabled = target === 'zprime' ? !Object.values(st.roles).some(Boolean) : false;
  };
  const load = txt => {
    st.res = plateRead(txt); st.p = 0; st.roles = {};
    const r = st.res, msgs = [];
    if (!r.plates.length) msgs.push(esc(trPlain('Geen plaat gevonden in deze tekst.')));
    else {
      msgs.push(esc(trPlain('Herkend als ' + uv(trPlain(FMT[r.format] || r.format)) + '.')));
      if (r.notes.length) msgs.push(`<span style="color:var(--warn)">${esc(trPlain(r.notes[0].n + ' putje(s) verzadigd (OVER); die tellen niet mee.'))}</span>`);
      if (r.plates.length > 1) msgs.push(`<label>${esc(trPlain('Plaat:'))} <select data-pw-plate>${r.plates.map((p, i) => `<option value="${i}">${esc(p.name)}</option>`).join('')}</select></label>`);
    }
    info.innerHTML = msgs.join(' ');
    const sel = info.querySelector('[data-pw-plate]'); if (sel) sel.addEventListener('change', () => { st.p = +sel.value; st.roles = {}; draw(); });
    draw();
  };
  B.querySelector('[data-pw-file]').addEventListener('change', e => { const f = e.target.files[0]; if (f) f.text().then(t => { B.querySelector('[data-pw-txt]').value = t; load(t); }); });
  B.querySelector('[data-pw-txt]').addEventListener('input', e => load(e.target.value));
  B.querySelectorAll('[data-pw-role]').forEach(b => b.addEventListener('click', () => { st.role = b.dataset.pwRole; B.querySelectorAll('[data-pw-role]').forEach(o => o.classList.toggle('on', o === b)); }));
  if (target === 'zprime') B.querySelector('[data-pw-role="pos"]').classList.add('on');
  grid.addEventListener('click', e => { if (target !== 'zprime') return; const td = e.target.closest('[data-w]'); if (!td) return; const id = td.dataset.w; st.roles[id] = st.roles[id] === st.role ? '' : st.role; draw(); });
  B.querySelector('[data-pw-no]').addEventListener('click', m.close);
  ok.addEventListener('click', () => {
    const p = plate(); if (!p) return; const rows = plateRows(p), R = Object.keys(rows);
    if (target === 'curve') {
      setVal('s-ptxt', '\t' + Array.from({length: p.cols}, (_, k) => k + 1).join('\t') + '\n' + R.map(r => r + '\t' + rows[r].map(f4).join('\t')).join('\n'));
      const d = document.getElementById('s-pdet'); if (d) d.open = true;
    } else if (target === 'elisa') {
      setVal('el-a', R.slice(0, 8).map(r => rows[r].slice(0, 12).map(f4).join('\t')).join('\n'));
    } else if (target === 'zprime') {
      const pick = k => Object.keys(st.roles).filter(w => st.roles[w] === k && isFinite(p.wells[w])).map(w => f4(p.wells[w])).join(' ');
      setVal('zp-pos', pick('pos')); setVal('zp-neg', pick('neg')); setVal('zp-s', pick('smp'));
    }
    m.close();
    if (typeof alertBox === 'function') alertBox(trPlain(target === 'curve' ? 'Plaat overgenomen; kies de kolommen van de standaarden en monsters en klik Importeren.' : 'Plaat overgenomen.'));
  });
  window.__pw = {load, st, draw, ok};   /* voor de test */
  return m;
}

expose({plateWizard});
