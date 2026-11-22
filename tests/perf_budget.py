"""
Labkit BML - opstarttijd en taalbestanden.

Laadt de app in het Nederlands en het Engels en controleert:
- DOMContentLoaded blijft onder het budget (standaard 2500 ms; LABKIT_BUDGET_MS om aan te passen);
- het Engelse woordenboek (i18n-en.js) wordt alleen voor Engels geladen;
- in het Engels zijn de koppen van alle tools vertaald, ook van tools die niet open staan
  (sinds S271 in één vertaalronde bij het opstarten, zonder observer of luie modus);
- de alignmentviewer (S171) houdt bij 60 x 5000 kolommen alleen de zichtbare rijen in de DOM en
  tekent een scrollstap binnen één frame (ALN_FRAME_MS, standaard 16 ms);
- web/index.html en web/i18n-en.js groeien niet meer dan 5% boven tests/perf_baseline.json (S134);
- de JS-heap na het openen van alle tools en de gel-editor met de testgel blijft onder LABKIT_HEAP_MB (standaard 40);
- de gel-editor verwerkt de realistische testgel (rechtzetten, lanen, banden, meten) binnen GEL_MS (standaard 1000 ms) (S135);
- typen in de zwaarste tools geeft binnen INP_MS (standaard 100 ms) een nieuw beeld (Event Timing, zoals INP) (S135);
- geen scriptfouten.
Gebruik: python tests/perf_budget.py            (exitcode 1 bij problemen)
         python tests/perf_budget.py --baseline legt de huidige groottes vast als nieuwe basis (na een bewuste groei)
"""
import json, os, pathlib, sys
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

ALN_FRAME_MS = float(os.environ.get('ALN_FRAME_MS', '16'))

def aln():
    """60 sequenties van 5000 kolommen: alleen zichtbare rijen in de DOM, scrollen binnen een frame."""
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1400, 'height': 900})
        pg.add_init_script("try{localStorage.setItem('labkit:v1:lang','nl')}catch(e){}")
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(URL); pg.wait_for_load_state('load'); pg.evaluate("location.hash='aln'"); pg.wait_for_timeout(200)
        r = pg.evaluate("""async()=>{ const s='ACGT-'.repeat(1000), e=document.getElementById('al-in');
          e.value=Array.from({length:60},(_,i)=>'>s'+i+'\\n'+s.slice(i%5)+s.slice(0,i%5)).join('\\n');
          e.dispatchEvent(new Event('input')); await new Promise(r=>setTimeout(r,300));
          const v=document.getElementById('al-view'), max=v.scrollWidth-v.clientWidth, ts=[];
          for(let i=1;i<=100;i++){ const t0=performance.now(); v.scrollLeft=max*i/100; v.scrollTop=i%2?9999:0;
            v.dispatchEvent(new Event('scroll')); await Promise.resolve(); await Promise.resolve();
            document.body.offsetHeight; ts.push(performance.now()-t0); }
          ts.sort((a,b)=>a-b);
          return {rows:document.querySelectorAll('#al-view .aln-seq').length, p95:ts[95],
                  last:[...document.querySelectorAll('#al-view .aln-ruler span')].pop().textContent}; }""")
        b.close()
    issues = []
    if r['rows'] >= 60 or r['rows'] < 10: issues.append(f"alignmentviewer: {r['rows']} rijen in de DOM (verwacht alleen de zichtbare)")
    if r['last'] != '5000': issues.append(f"alignmentviewer: liniaal eindigt op {r['last']}, verwacht 5000")
    if r['p95'] > ALN_FRAME_MS: issues.append(f"alignmentviewer: scrollstap {r['p95']:.1f} ms > {ALN_FRAME_MS} ms")
    issues += ['scriptfout: ' + e for e in errs]
    print(f"[aln] 60 x 5000 kolommen: {r['rows']} rijen in de DOM, scrollstap p95 {r['p95']:.1f} ms" + ('' if issues else ', in orde'))
    return issues

SIZES = ['web/index.html', 'web/i18n-en.js']
BASE = ROOT / 'tests' / 'perf_baseline.json'

def size():
    """Groei van de gebouwde bestanden ten opzichte van de vastgelegde basis; meer dan 5% is een fout."""
    now = {f: (ROOT / f).stat().st_size for f in SIZES}
    if '--baseline' in sys.argv: BASE.write_text(json.dumps(now, indent=1) + '\n')
    base = json.loads(BASE.read_text())
    issues = []
    for f in SIZES:
        g = now[f] / base[f] - 1
        print(f'[size] {f}: {now[f] / 1024:.0f} kB ({g:+.1%} t.o.v. basis)')
        if g > 0.05: issues.append(f'{f} is {g:.1%} groter dan de basis (max 5%); bewust? python tests/perf_budget.py --baseline')
    return issues

HEAP_MB = float(os.environ.get('LABKIT_HEAP_MB', '40'))

def heap():
    """JS-heap na garbage collection, nadat elke tool open is geweest en de gel-editor de testgel heeft verwerkt."""
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1400, 'height': 900})
        pg.add_init_script("try{localStorage.setItem('labkit:v1:lang','nl')}catch(e){}")
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        cdp = pg.context.new_cdp_session(pg)
        pg.goto(URL); pg.wait_for_load_state('load')
        pg.evaluate("async()=>{ for(const t of TOOLS){ location.hash=t; await new Promise(r=>setTimeout(r,30)); } location.hash='gelfoto'; }")
        pg.set_input_files('#gf-file', str(ROOT / 'tests' / 'fixtures' / 'gel_realistic.png')); pg.wait_for_timeout(700)
        pg.evaluate("$('#gf-n').value=''; document.getElementById('gf-auto').click()"); pg.wait_for_timeout(1500)
        lanes = pg.evaluate("gf.lanes.length")
        cdp.send('HeapProfiler.collectGarbage')
        mb = cdp.send('Runtime.getHeapUsage')['usedSize'] / 2**20
        b.close()
    issues = [f'JS-heap {mb:.1f} MB > {HEAP_MB:.0f} MB'] if mb > HEAP_MB else []
    if not lanes: issues.append('heap: de gel-editor vond geen lanen in de testgel; de meting telt dan niet')
    issues += ['scriptfout: ' + e for e in errs]
    print(f'[heap] alle tools + gel-editor: {mb:.1f} MB (limiet {HEAP_MB:.0f} MB)' + ('' if issues else ', in orde'))
    return issues

GEL_MS = float(os.environ.get('GEL_MS', '1000'))
INP_MS = float(os.environ.get('INP_MS', '100'))
# zwaarste tools bij typen (S135: alle tools gemeten, deze zaten bovenaan) plus de grote dataplakvelden
INP_TOOLS = ['qplate', 'km', 'oplossing', 'curve', 'qpcr', 'pcr', 'reeks', 'stat', 'elisa', 'seq']

def gel_inp():
    """Gel-editorbenchmark (beste van drie) en de reactietijd bij typen in INP_TOOLS."""
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1400, 'height': 900})
        pg.add_init_script("try{localStorage.setItem('labkit:v1:lang','nl')}catch(e){}"
                           "window.__ev=[]; new PerformanceObserver(l=>{ for(const e of l.getEntries()) __ev.push([e.name,e.duration]); }).observe({type:'event',durationThreshold:16,buffered:true});")
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(URL); pg.wait_for_load_state('load'); pg.evaluate("location.hash='gelfoto'")
        pg.set_input_files('#gf-file', str(ROOT / 'tests' / 'fixtures' / 'gel_realistic.png')); pg.wait_for_timeout(700)
        runs = [pg.evaluate("""()=>{ const T=[]; let t=performance.now(); const lap=()=>{ const n=performance.now(); T.push(n-t); t=n; };
          gfAutoStraighten(); lap(); gfDetectLanes(); lap(); gfDetectBands(); lap(); gf.marks=[]; document.getElementById('gf-measall').click(); lap();
          return {T, lanes:gf.lanes.length, marks:gf.marks.length}; }""") for _ in range(3)]
        g = min(runs, key=lambda r: sum(r['T']))
        pg.wait_for_timeout(600)  # rechtzetten start na 350 ms nog een lanedetectie (gfUpdate); niet meetellen bij het typen
        slow = []
        for t in INP_TOOLS:
            pg.evaluate(f"location.hash='{t}'"); pg.wait_for_timeout(50)
            box = pg.locator(f'#t-{t} textarea:visible')
            if not box.count(): box = pg.locator(f'#t-{t} input:not([type]):visible, #t-{t} input[type=text]:visible, #t-{t} input[inputmode]:visible')
            box.first.focus(); pg.keyboard.press('End'); ms = []
            for _ in range(2):  # beste van twee rondes: één hapering van de CI-machine is geen trage tool
                pg.evaluate("__ev=[]")
                for _ in range(4): pg.keyboard.type('1', delay=20); pg.keyboard.press('Backspace', delay=20)  # 3 -> 31 -> 3: echte waarden, geen onzin
                pg.wait_for_timeout(150)
                ms.append(pg.evaluate("Math.max(0,...__ev.map(e=>e[1]))"))
            slow.append((min(ms), t))
        b.close()
    issues = []
    gms = sum(g['T'])
    if gms > GEL_MS: issues.append(f'gel-editor: testgel verwerken {gms:.0f} ms > {GEL_MS:.0f} ms')
    if g['lanes'] != 11 or not g['marks']: issues.append(f"gel-editor: {g['lanes']} lanen en {g['marks']} metingen (verwacht 11 lanen en metingen)")
    worst = max(slow)
    issues += [f'typen in {t}: {ms:.0f} ms > {INP_MS:.0f} ms' for ms, t in slow if ms > INP_MS]
    issues += ['scriptfout: ' + e for e in errs]
    print(f"[gel] testgel: {gms:.0f} ms (rechtzetten {g['T'][0]:.0f}, lanen {g['T'][1]:.0f}, banden {g['T'][2]:.0f}, meten {g['T'][3]:.0f}; budget {GEL_MS:.0f} ms)"
          + ('' if gms <= GEL_MS else ' TE TRAAG'))
    print(f'[inp] typen in {len(slow)} tools: traagste {worst[1]} {worst[0]:.0f} ms (budget {INP_MS:.0f} ms)' + ('' if worst[0] <= INP_MS else ' TE TRAAG'))
    return issues

def main():
    issues = size()
    for lang in ('nl', 'en'):
        issues += [f'[{lang}] {i}' for i in run(lang)]
    issues += aln()
    issues += heap()
    issues += gel_inp()
    for i in issues: print('  ' + i)
    sys.exit(1 if issues else 0)

if __name__ == '__main__':
    main()
