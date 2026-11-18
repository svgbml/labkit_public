"""Plakken van een blok uit Excel in een tabel moet blijven werken, en nu ook per cel een
input-event sturen zodat een reactieve tabel het ziet."""
import pathlib
import sys

from playwright.sync_api import sync_playwright

URL = (pathlib.Path('/home/user/labkit_public') / 'web' / 'index.html').as_uri()
PASTE = """(block)=>{
  const el = document.querySelector('#o-tbl tbody tr [data-k=n]');
  const seen = [];
  const log = e => { if (e.target.tagName === 'INPUT') seen.push(e.target.dataset.k || '?'); };
  document.getElementById('o-tbl').addEventListener('input', log);
  const dt = new DataTransfer();
  dt.setData('text', block);
  el.focus();
  el.dispatchEvent(new ClipboardEvent('paste', {clipboardData: dt, bubbles: true, cancelable: true}));
  document.getElementById('o-tbl').removeEventListener('input', log);
  return seen;
}"""
fails = []
def ck(n, c, e=''):
    print(('  OK   ' if c else '  FAIL ') + n + ('' if c else ' :: ' + str(e)))
    if not c:
        fails.append(n)

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1400, 'height': 950})
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)[:250]))
    pg.add_init_script("try{localStorage.clear();localStorage.setItem('labkit:v1:tour',JSON.stringify({v:1}))}catch(e){}")
    pg.goto(URL + '#oplossing')
    pg.wait_for_timeout(1400)
    n0 = pg.locator('#o-tbl tbody tr').count()
    block = 'NaCl\t58,44\t100\nKCl\t74,55\t50'
    seen = pg.evaluate(PASTE, block)
    pg.wait_for_timeout(700)
    rows = pg.eval_on_selector_all(
        '#o-tbl tbody tr',
        'a=>a.map(r=>[...r.querySelectorAll("input:not([type=checkbox]),select")].map(e=>e.value))')
    out = pg.eval_on_selector_all('#o-tbl tbody tr [data-k=out]', 'a=>a.map(x=>x.textContent)')
    print('  rijen voor:', n0, '| na:', len(rows))
    print('  rij 1:', rows[0] if rows else None)
    print('  rij 2:', rows[1] if len(rows) > 1 else None)
    print('  massa:', out[:2])
    print('  input-events per cel:', seen)
    ck('twee rijen gevuld', len(rows) >= 2, len(rows))
    ck('naam en molmassa geplakt', rows[0][0] == 'NaCl' and rows[0][1] == '58,44', rows[0][:3])
    ck('tweede rij geplakt', rows[1][0] == 'KCl' and rows[1][1] == '74,55', rows[1][:3])
    ck('elke gevulde cel stuurde een input-event', len(seen) >= 6, seen)
    ck('massa opnieuw gerekend', out[0] not in ('', '–'), out[:2])
    ck('geen paginafouten', not errs, errs)
    b.close()
print(('FAILED: ' + ', '.join(fails)) if fails else 'alles in orde')
sys.exit(1 if fails else 0)
