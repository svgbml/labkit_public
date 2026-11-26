/* ================= DATA TUSSEN DE STAPPEN VAN EEN RUN OP DE PAGINA (S117) =================
   Alleen in de actieve run, en alleen tussen tools die er allebei in zitten (docs/adr/0002):
   - een veld met een mapping volgt zijn bron live (auto-waarde);
   - klikt de student in dat veld (of typt hij erin), dan volgt het niet meer: eigen waarde,
     met ernaast een knopje "Automatisch" dat het terugzet;
   - bij een tabel geldt dat per kolom (klikken in een cel van de kolom).
   Welke mappings eigen zijn staat bij de run (labkit:v1:runs, list[].own), dus per run en project.
   De mappings en het rekenwerk staan in src/lib/flow.js. */
import {activeMaps, pcrTemplate, laneNames, laneSizes} from '../lib/flow.js';
import {runsMeta, wfSteps} from './projects.js';
import {lkNumIn} from '../lib/bridge.js';

const RUNS = 'labkit:v1:runs';
let applying = false, timer = 0;

const run = () => { const r = runsMeta(); return r.list.find(x => x.id === r.active) || null; };
const maps = () => { const r = run(); return r ? activeMaps(wfSteps(r.wf)) : []; };
const own = () => (run() || {}).own || [];
function setOwn(id, on) {
  try {
    const m = JSON.parse(localStorage.getItem(RUNS) || '{}');
    m.list = (m.list || []).map(x => (x.id !== m.active ? x
      : {...x, own: on ? [...new Set([...(x.own || []), id])] : (x.own || []).filter(y => y !== id)}));
    localStorage.setItem(RUNS, JSON.stringify(m));
  } catch (e) {}
}
const $id = id => document.getElementById(id);
const samples = () => { const v = jget('labkit:v1:samples', null); return Array.isArray(v) ? v.filter(x => typeof x === 'string' && x.trim()).map(x => x.trim()) : []; };

/* de nieuwe waarde van een veld, of de nieuwe rijen van een tabel */
function fieldValue(m) {
  if (m.id === 'dna-pcr') return pcrTemplate(bigNum(document.querySelector('#n-out .big')), num(($id('m-ng') || {}).value));
  return null;
}
function tableRows(m, rows) {
  if (m.id === 'smp-gplan') return laneNames(rows, samples());
  if (m.id === 'pcr-gplan') return laneSizes(rows, num(($id('y-bp') || {}).value));
  return rows;
}

export function apply() {
  const ms = maps(), o = own();
  applying = true;
  try {
    for (const m of ms) {
      if (o.includes(m.id)) continue;
      if (m.field) {
        const el = $id(m.field), v = fieldValue(m); if (!el || v == null) continue;
        const s = lkNumIn(String(v).replace('.', ','));
        if (num(el.value) !== num(s)) { el.value = s; el.dispatchEvent(new Event('input', {bubbles: true})); el.dispatchEvent(new Event('change', {bubbles: true})); }
      } else {
        const T = typeof TBLDEF !== 'undefined' && TBLDEF[m.table]; if (!T || !T.set || !$id(m.table)) continue;
        const rows = etGet(m.table), nw = tableRows(m, rows);
        if (JSON.stringify(nw) !== JSON.stringify(rows)) T.set(nw);
      }
    }
  } finally { applying = false; }
  decorate(ms, o);
}
const schedule = () => { clearTimeout(timer); timer = setTimeout(apply, 120); };

/* het knopje "Automatisch" naast een veld of onder een tabel die de student zelf invult */
function decorate(ms = maps(), o = own()) {
  const want = new Set(ms.filter(m => o.includes(m.id)).map(m => m.id));
  document.querySelectorAll('.lk-auto-reset').forEach(b => { if (!want.has(b.dataset.autoReset)) b.remove(); });
  for (const m of ms) {
    const el = $id(m.field || m.table); if (!el) continue;
    if (m.field) el.title = want.has(m.id) ? '' : trPlain('Automatisch uit ' + m.what);
    if (!want.has(m.id) || document.querySelector(`.lk-auto-reset[data-auto-reset="${m.id}"]`)) continue;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'ghost lk-auto-reset'; b.dataset.autoReset = m.id;
    b.textContent = '↺ ' + trPlain('Automatisch'); b.title = trPlain('Weer automatisch uit ' + m.what);
    if (m.field) (el.closest('.f') || el.parentNode).appendChild(b);
    else { const a = el.closest('.tbl-wrap') || el; a.after(b); }
  }
}

/* klikken in een auto-veld, of erin typen, maakt er een eigen waarde van */
function mark(e) {
  if (applying || (e.type === 'keydown' && !(e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete'))) return;
  const t = e.target; if (!t || !t.closest) return;
  const ms = maps(), o = own();
  for (const m of ms) {
    if (o.includes(m.id)) continue;
    let hit = false;
    if (m.field) hit = t.id === m.field;
    else { const tr = t.closest(`#${m.table} tbody tr`); hit = !!tr && [...tr.querySelectorAll('input:not([type=radio]):not([type=checkbox]),select')].indexOf(t) === m.col; }
    if (hit) { setOwn(m.id, true); decorate(); }
  }
}

let started = false;
export function startFlow() {
  if (started) return; started = true;
  document.addEventListener('pointerdown', mark, true);
  document.addEventListener('keydown', mark, true);
  ['input', 'change'].forEach(ev => document.addEventListener(ev, () => { if (!applying) schedule(); }));
  window.addEventListener('hashchange', schedule);
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-auto-reset]'); if (!b) return;
    setOwn(b.dataset.autoReset, false); b.remove(); apply();
  });
  schedule();
}
