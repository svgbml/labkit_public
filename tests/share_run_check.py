"""
Labkit BML - een run delen als link (S120, docs/W1.md).

Browser A doet een run van "Van DNA tot gel" met eigen invoer (ook een eigen waarde in een veld
dat anders automatisch is) en deelt hem. Browser B opent de link: er komt een nieuw project
"Gedeeld: …" bij met die run actief, dezelfde invoer en dezelfde eigen waarde; het project dat B
al had blijft onaangeroerd.
Gebruik: python tests/share_run_check.py   (exitcode 1 bij problemen)
"""
import pathlib, sys
from playwright.sync_api import sync_playwright

URL = (pathlib.Path(__file__).resolve().parent.parent / 'web' / 'index.html').as_uri()
FRESH = """localStorage.clear(); indexedDB.deleteDatabase('labkit-projects');
  localStorage.setItem('labkit:v1:tour', JSON.stringify({v:1})); localStorage.setItem('labkit:v1:seenver', JSON.stringify(APPVER))"""
fails = []


def check(what, got, want):
    ok = got == want
    print(f"  {'OK  ' if ok else 'FOUT'} {what}: {got!r}" + ('' if ok else f' (verwacht {want!r})'))
    if not ok:
        fails.append(what)


def ready(pg):
    pg.wait_for_selector('#proj-chip'); pg.wait_for_timeout(500)


def setv(pg, i, v):
    pg.evaluate("([i,v])=>{const e=document.getElementById(i);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))}", [i, v]); pg.wait_for_timeout(400)


def val(pg, tool, i):
    pg.goto(URL + '#' + tool); pg.wait_for_timeout(400); return pg.input_value('#' + i)


with sync_playwright() as p:
    b = p.chromium.launch(); errs = []
    a = b.new_context(viewport={'width': 1280, 'height': 900}, locale='nl-NL').new_page(); a.on('pageerror', lambda e: errs.append(str(e)))
    a.goto(URL + '#start'); ready(a); a.evaluate(FRESH); a.reload(); ready(a)
    a.click('[data-wf-start=pcrgel]'); a.fill('#run-name', 'PCR week 3')
    with a.expect_navigation():
        a.click('#run-start')
    ready(a)
    a.goto(URL + '#dna'); a.wait_for_timeout(300); setv(a, 'n-a260', '0,6')
    a.goto(URL + '#pcrcyclus'); a.wait_for_timeout(300); setv(a, 'y-bp', '777')
    a.goto(URL + '#pcr'); a.wait_for_timeout(300); a.click('#q-t'); setv(a, 'q-t', '3')
    a.click('[data-wf-share]'); a.wait_for_selector('#run-url')
    url = a.input_value('#run-url')
    check('deellink met ?run=', '?run=' in url, True)
    check('QR-code bij een korte run', a.locator('#run-share canvas').is_visible(), True)

    bb = b.new_context(viewport={'width': 1280, 'height': 900}, locale='nl-NL').new_page(); bb.on('pageerror', lambda e: errs.append(str(e)))
    bb.goto(URL + '#start'); ready(bb); bb.evaluate(FRESH); bb.reload(); ready(bb)
    bb.goto(URL + '#dna'); bb.wait_for_timeout(300); setv(bb, 'n-a260', '0,2')
    with bb.expect_navigation():
        bb.goto(URL + '?' + url.split('?', 1)[1])
    ready(bb)
    check('nieuw project, actief', bb.inner_text('#proj-chip'), 'Gedeeld: PCR week 3')
    check('de link is uit de adresbalk', '?run=' in bb.url, False)
    check('run actief, bij de stap van A', (bb.evaluate("JSON.parse(localStorage.getItem('labkit:v1:runs')).list.map(r=>r.name)"), bb.evaluate('location.hash')), (['PCR week 3'], '#pcr'))
    check('invoer van A', (val(bb, 'dna', 'n-a260'), val(bb, 'pcrcyclus', 'y-bp')), ('0,6', '777'))
    check('eigen waarde blijft eigen', (val(bb, 'pcr', 'q-t'), bb.locator('[data-auto-reset=dna-pcr]').count()), ('3', 1))
    bb.click('#proj-chip'); bb.wait_for_timeout(300)
    with bb.expect_navigation():
        bb.locator('#proj-list li', has_text='Mijn project').locator('.proj-open').click()
    ready(bb)
    check('het eigen project van B is onaangeroerd', val(bb, 'dna', 'n-a260'), '0,2')
    check('geen paginafouten', errs, [])
    b.close()

print('ALLES OK' if not fails else f'{len(fails)} FOUT(EN): ' + ', '.join(fails))
sys.exit(1 if fails else 0)
