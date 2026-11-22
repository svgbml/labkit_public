"""
Labkit BML - opstarttijd en taalbestanden.

Laadt de app in het Nederlands en het Engels en controleert:
- DOMContentLoaded blijft onder het budget (standaard 2500 ms; LABKIT_BUDGET_MS om aan te passen);
- het Engelse woordenboek (i18n-en.js) wordt alleen voor Engels geladen;
- in het Engels zijn de koppen van alle tools vertaald, ook van tools die niet open staan
  (sinds S271 in één vertaalronde bij het opstarten, zonder observer of luie modus);
- de alignmentviewer (S171) houdt bij 60 x 5000 kolommen alleen de zichtbare rijen in de DOM en
  tekent een scrollstap binnen één frame (ALN_FRAME_MS, standaard 16 ms);
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

def main():
    issues = []
    for lang in ('nl', 'en'):
        issues += [f'[{lang}] {i}' for i in run(lang)]
    issues += aln()
    for i in issues: print('  ' + i)
    sys.exit(1 if issues else 0)

if __name__ == '__main__':
    main()
