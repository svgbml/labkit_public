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
- gelfoto-benchmark (S135): laden, rechtzetten en meten van de testgel, beste van drie, onder
  LABKIT_GEL_MS (standaard 2000 ms);
- typvertraging (S135): typen in de zwaarste tools (en in de gelfoto-editor met een geladen gel)
  geeft binnen LABKIT_INP_MS (standaard 100 ms) een volgende frame (Event Timing API).
Mobiele Lighthouse staat in .github/workflows/lighthouse.yml (lighthouserc.mobile.json).
Gebruik: python tests/perf_budget.py                     (exitcode 1 bij problemen)
         python tests/perf_budget.py --update-baseline   (huidige groottes als nieuwe basislijn;
                                                          alleen na een bewuste groei)
"""
import base64, gzip, json, os, pathlib, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / 'web' / 'index.html').as_uri()
BUDGET = int(os.environ.get('LABKIT_BUDGET_MS', '2500'))
HEAP_MB = float(os.environ.get('LABKIT_HEAP_MB', '40'))
GROWTH = float(os.environ.get('LABKIT_SIZE_GROWTH', '0.05'))
BASELINE = ROOT / 'tests' / 'perf_baseline.json'
SIZED = ['web/index.html', 'web/i18n-en.js', 'build/app.bundle.js']
GEL = ROOT / 'tests' / 'fixtures' / 'gel_realistic.png'
GEL_MS = float(os.environ.get('LABKIT_GEL_MS', '2000'))
INP_MS = float(os.environ.get('LABKIT_INP_MS', '100'))
# tools met de zwaarste herberekening per toetsaanslag (grote tabellen, fits, grafieken)
INP_TOOLS = ['stat', 'curve', 'enzym', 'qpcr', 'elisa', 'oplossing', 'kin', 'roc', 'km', 'ic50', 'westgard', 'bland']
GEL_BENCH = """async (src) => {
  const img = new Image(); img.src = src; await img.decode();
  const tick = () => new Promise(r => setTimeout(r, 0));
  const t0 = performance.now(); gfFromImage(img); await tick();
  const t1 = performance.now(); gfAutoStraighten(); await tick(); await tick();
  const t2 = performance.now(); gf.marks = []; gfMeasAll(); await tick();
  const t3 = performance.now();
  return {laden: t1 - t0, rechtzetten: t2 - t1, meten: t3 - t2, totaal: t3 - t0, lanen: gf.lanes.length, banden: gf.marks.length};
}"""

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

def gel_inp_check():
    """Gelfoto-benchmark en typvertraging in één browser."""
    issues = []
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1400, 'height': 900})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(URL + '#gelfoto'); pg.wait_for_load_state('load'); pg.wait_for_timeout(300)
        src = 'data:image/png;base64,' + base64.b64encode(GEL.read_bytes()).decode()
        runs = [pg.evaluate(GEL_BENCH, src) for _ in range(3)]
        best = min(runs, key=lambda r: r['totaal'])
        print(f'[gelfoto] beste van 3: {best["totaal"]:.0f} ms (laden {best["laden"]:.0f}, rechtzetten {best["rechtzetten"]:.0f}, '
              f'meten {best["meten"]:.0f}); {best["lanen"]} lanen, {best["banden"]} banden (budget {GEL_MS:.0f} ms)')
        if best['totaal'] > GEL_MS: issues.append(f'gelfoto-benchmark {best["totaal"]:.0f} ms > budget {GEL_MS:.0f} ms')
        if best['lanen'] != 11: issues.append(f'gelfoto vond {best["lanen"]} lanen in de testgel in plaats van 11')
        # Event Timing: duur van invoer tot het volgende frame, per interactie
        pg.evaluate("window.__ev=[]; new PerformanceObserver(l=>{ for(const e of l.getEntries()) if(e.interactionId) __ev.push(e.duration); })"
                    ".observe({type:'event', durationThreshold:16, buffered:true});")
        worst = {}
        for tid in INP_TOOLS + ['gelfoto']:
            pg.evaluate(f"location.hash='{tid}'"); pg.wait_for_timeout(150)
            sec = f'section#t-{tid}'
            # in de gelfoto-editor (gel nog geladen) de titel: die tekent de canvas opnieuw
            loc = pg.locator('#gf-title' if tid == 'gelfoto' else f'{sec} textarea:visible').first
            if not loc.count():
                loc = pg.locator(f'{sec} input[type=text]:visible, {sec} input:not([type]):visible, {sec} input[inputmode]:visible').first
            if not loc.count():
                issues.append(f'{tid}: geen tekstveld gevonden om in te typen'); continue
            for _ in range(2):  # bij een overschrijding één keer opnieuw: een CI-runner hapert wel eens
                pg.evaluate('__ev.length=0')
                loc.click(); pg.keyboard.press('End'); pg.keyboard.type(' 12,5', delay=40); pg.wait_for_timeout(250)
                worst[tid] = min(worst.get(tid, 1e9), max(pg.evaluate('__ev.slice()') or [0]))
                if worst[tid] <= INP_MS: break
        b.close()
    top = sorted(worst.items(), key=lambda kv: -kv[1])
    print(f'[typen] traagste toetsaanslag per tool (budget {INP_MS:.0f} ms): ' + ', '.join(f'{t} {v:.0f}' for t, v in top[:5]))
    issues += [f'typen in {t} duurt {v:.0f} ms > {INP_MS:.0f} ms' for t, v in top if v > INP_MS]
    issues += ['scriptfout: ' + e for e in errs]
    return issues

def main():
    issues = [f'[grootte] {i}' for i in size_check('--update-baseline' in sys.argv)]
    for lang in ('nl', 'en'):
        issues += [f'[{lang}] {i}' for i in run(lang)]
    issues += [f'[geheugen] {i}' for i in mem_check()]
    issues += [f'[gelfoto/typen] {i}' for i in gel_inp_check()]
    for i in issues: print('  ' + i)
    sys.exit(1 if issues else 0)

if __name__ == '__main__':
    main()
