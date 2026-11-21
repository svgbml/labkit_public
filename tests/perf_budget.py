"""
Labkit BML - opstarttijd en taalbestanden.

Laadt de app in het Nederlands en het Engels en controleert:
- DOMContentLoaded blijft onder het budget (standaard 2500 ms; LABKIT_BUDGET_MS om aan te passen);
- het Engelse woordenboek (i18n-en.js) wordt alleen voor Engels geladen;
- in het Engels zijn de koppen van alle tools vertaald, ook van tools die niet open staan
  (sinds S271 in één vertaalronde bij het opstarten, zonder observer of luie modus);
- geen scriptfouten.
Gebruik: python tests/perf_budget.py   (exitcode 1 bij problemen)
"""
import os, pathlib, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / 'web' / 'index.html').as_uri()
BUDGET = int(os.environ.get('LABKIT_BUDGET_MS', '2500'))

def run(lang):
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1400, 'height': 900})
        pg.add_init_script("try{localStorage.setItem('labkit:v1:lang','" + lang + "')}catch(e){}")
        errs, files = [], []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('request', lambda r: files.append(r.url.split('/')[-1].split('?')[0]))
        best = None
        for _ in range(3):  # beste van drie: de eerste keer is de schijfcache nog koud
            pg.goto('about:blank'); pg.goto(URL); pg.wait_for_load_state('load')
            dcl = pg.evaluate("Math.round(performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd)")
            best = dcl if best is None else min(best, dcl)
        pending = pg.evaluate("LANG!=='en'?[]:[...document.querySelectorAll('section.tool .tool-head h2')].filter(h=>{ const v=I18N_EN[h.innerHTML.trim()]; return v!=null&&v!==h.innerHTML.trim(); }).map(h=>h.closest('section').id)")
        b.close()
    issues = []
    if best > BUDGET: issues.append(f'DOMContentLoaded {best} ms > budget {BUDGET} ms')
    if lang == 'nl' and 'i18n-en.js' in files: issues.append('Engels woordenboek geladen in het Nederlands')
    if lang == 'en' and 'i18n-en.js' not in files: issues.append('Engels woordenboek niet geladen')
    if pending: issues.append(f'{len(pending)} toolkoppen niet vertaald: ' + ', '.join(pending[:5]))
    issues += ['scriptfout: ' + e for e in errs]
    print(f'[{lang}] DOMContentLoaded {best} ms (budget {BUDGET} ms)' + ('' if issues else ', in orde'))
    return issues

def main():
    issues = []
    for lang in ('nl', 'en'):
        issues += [f'[{lang}] {i}' for i in run(lang)]
    for i in issues: print('  ' + i)
    sys.exit(1 if issues else 0)

if __name__ == '__main__':
    main()
