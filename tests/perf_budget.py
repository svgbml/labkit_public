"""
Labkit BML - opstarttijd en taalbestanden.

Laadt de app in het Nederlands en het Engels en controleert:
- DOMContentLoaded blijft onder het budget (standaard 2500 ms; LABKIT_BUDGET_MS om aan te passen);
- het Engelse woordenboek (i18n-en.js) wordt alleen voor Engels geladen;
- in het Engels zijn de koppen van alle tools vertaald, ook van tools die niet open staan
  (sinds S271 in één vertaalronde bij het opstarten, zonder observer of luie modus);
- geen scriptfouten;
- grootte (S134): web/index.html, web/i18n-en.js en build/app.bundle.js groeien niet meer dan 5%
  boven de basislijn in tests/perf_baseline.json (LABKIT_SIZE_GROWTH om aan te passen);
- geheugen (S134): de JS-heap na het openen van alle tools en het automatisch analyseren van de
  testgel (tests/fixtures/gel_realistic.png) blijft onder LABKIT_HEAP_MB (standaard 40 MB).
Gebruik: python tests/perf_budget.py                     (exitcode 1 bij problemen)
         python tests/perf_budget.py --update-baseline   (huidige groottes als nieuwe basislijn;
                                                          alleen na een bewuste groei)
"""
import gzip, json, os, pathlib, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / 'web' / 'index.html').as_uri()
BUDGET = int(os.environ.get('LABKIT_BUDGET_MS', '2500'))
HEAP_MB = float(os.environ.get('LABKIT_HEAP_MB', '40'))
GROWTH = float(os.environ.get('LABKIT_SIZE_GROWTH', '0.05'))
BASELINE = ROOT / 'tests' / 'perf_baseline.json'
SIZED = ['web/index.html', 'web/i18n-en.js', 'build/app.bundle.js']
GEL = ROOT / 'tests' / 'fixtures' / 'gel_realistic.png'

def sizes():
    out = {}
    for f in SIZED:
        b = (ROOT / f).read_bytes()
        out[f] = {'bytes': len(b), 'gzip': len(gzip.compress(b, 9))}
    return out

def size_check(update=False):
    cur = sizes()
    if update or not BASELINE.exists():
        BASELINE.write_text(json.dumps(cur, indent=1) + '\n', encoding='utf8')
        print(f'Basislijn geschreven naar {BASELINE.relative_to(ROOT)}')
    base = json.loads(BASELINE.read_text(encoding='utf8'))
    issues = []
    for f, c in cur.items():
        b = base.get(f, {}).get('bytes')
        d = '' if not b else f' ({(c["bytes"] - b) / b * 100:+.1f}% t.o.v. basislijn)'
        print(f'[grootte] {f}: {c["bytes"] / 1024:.0f} kB, gzip {c["gzip"] / 1024:.0f} kB{d}')
        if b and c['bytes'] > b * (1 + GROWTH):
            issues.append(f'{f} is {c["bytes"] - b} bytes groter dan de basislijn (> {GROWTH * 100:.0f}%); '
                          'bewust? draai dan python tests/perf_budget.py --update-baseline')
    return issues

def mem_check():
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1400, 'height': 900})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(URL); pg.wait_for_load_state('load')
        cdp = pg.context.new_cdp_session(pg)
        def heap():
            cdp.send('HeapProfiler.collectGarbage')
            return cdp.send('Runtime.getHeapUsage')['usedSize'] / 1048576
        start = heap()
        for tid in pg.evaluate('TOOLS'):
            pg.evaluate(f"location.hash='{tid}'"); pg.wait_for_timeout(20)
        pg.evaluate("location.hash='gelfoto'"); pg.wait_for_timeout(100)
        pg.set_input_files('#gf-file', str(GEL)); pg.wait_for_timeout(700)
        pg.evaluate("$('#gf-n').value=''; document.getElementById('gf-auto').click()"); pg.wait_for_timeout(1500)
        lanes = pg.evaluate('gf.lanes ? gf.lanes.length : 0')
        end = heap()
        b.close()
    print(f'[geheugen] JS-heap {start:.1f} MB na opstarten, {end:.1f} MB na alle tools + gelfoto ({lanes} lanen) (limiet {HEAP_MB:.0f} MB)')
    issues = []
    if end > HEAP_MB: issues.append(f'JS-heap {end:.1f} MB > limiet {HEAP_MB:.0f} MB')
    if not lanes: issues.append('gelfoto vond geen lanen in de testgel')
    issues += ['scriptfout: ' + e for e in errs]
    return issues

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
    issues = [f'[grootte] {i}' for i in size_check('--update-baseline' in sys.argv)]
    for lang in ('nl', 'en'):
        issues += [f'[{lang}] {i}' for i in run(lang)]
    issues += [f'[geheugen] {i}' for i in mem_check()]
    for i in issues: print('  ' + i)
    sys.exit(1 if issues else 0)

if __name__ == '__main__':
    main()
