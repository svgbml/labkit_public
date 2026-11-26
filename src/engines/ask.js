/* ================= EEN VRAAG IN DE ZOEKBALK TOEPASSEN (S121) =================
   askQuery() leest de vraag (src/lib/ask.js), askLabel() maakt de regel die in het opdrachtpalet
   (Ctrl+K) en onder de zoekbalk van de startpagina staat, askApply() opent de tool en vult de
   velden met toolApply(). In een run tellen die velden als eigen waarden (docs/W1.md). */
import {ask} from '../lib/ask.js';
import {lkNumIn} from '../lib/bridge.js';
import {expose} from '../lib/global.js';
import {markOwnFields} from './flow.js';

const N = v => (typeof v === 'number' ? lkNumIn(String(Number(v.toPrecision(6))).replace('.', ',')) : String(v));
export const askQuery = q => ask(q, typeof CHEM !== 'undefined' ? CHEM : {});

function toolName(id) { const h = document.querySelector('#t-' + id + ' .tool-head h2'); return h ? h.textContent.trim() : id; }

/* "Oplossing & buffer: 500 mL · 0,9 % w/v NaCl" */
export function askLabel(r) {
  const v = r.v;
  const what = r.tool === 'oplossing' ? (() => { const x = r.tb['o-tbl'][0]; return `${N(v['o-v'])} ${v['o-vu']} · ${N(x[2])} ${x[3]} ${x[0]}`; })()
    : r.tool === 'verdunning' ? `${N(v['d-c1'])} ${v['d-c1u']} → ${N(v['d-c2'])} ${v['d-c2u']}` + (v['d-v2'] != null ? ` · ${N(v['d-v2'])} ${v['d-v2u']}` : '')
      : r.tool === 'centrifuge' ? (v['z-rpm'] != null ? `${N(v['z-rpm'])} rpm` : `${N(v['z-g'])} × g`) + (v['z-r'] != null ? ` · r = ${N(v['z-r'])} cm` : '')
        : r.tool === 'units' ? `${N(v['un-v'])} ${(document.querySelector(`#un-u option[value="${v['un-u']}"]`) || {}).textContent || v['un-u']}`
          : `${v['mm-f']}`;
  return `${toolName(r.tool)}: ${what}`;
}

/* een getal in een veld in de notatie van de gebruiker; in een tabel rekent toolApply() zelf om */
const fields = o => Object.fromEntries(Object.entries(o || {}).map(([k, x]) => [k, typeof x === 'number' ? N(x) : x]));

function toast(text) {
  const n = document.createElement('div'); n.className = 'note ok lk-ask-toast'; n.setAttribute('role', 'status');
  n.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:50;max-width:320px'; n.textContent = text;
  document.body.appendChild(n); setTimeout(() => n.remove(), 4000);
}

export function askApply(r) {
  if (!r) return;
  location.hash = '#' + r.tool;
  setTimeout(() => {
    if (r.first) toolApply({t: r.tool, v: fields(r.first)});
    setTimeout(() => {
      toolApply({t: r.tool, v: fields(r.v), tb: r.tb});
      markOwnFields(Object.keys(r.v));
      toast(trPlain('Ingevuld uit je zoekvraag'));
    }, 80);
  }, 80);
}

expose({askQuery, askLabel, askApply});
