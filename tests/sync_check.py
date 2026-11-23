"""
Labkit BML - synccontrole (S61): blijven twee apparaten met één bench-run gelijk?

Opent web/index.html in twee browsercontexten (A = laptop met de run, B = telefoon), koppelt ze
via de plakvelden van de koppeldialoog (aanbod A -> B, antwoord B -> A) en controleert dat een
vinkje op A op B verschijnt, een vinkje op B op A, en dat de huidige stap meegaat.
Gebruik: python tests/sync_check.py   (exitcode 1 bij problemen)
"""
import pathlib, sys
from playwright.sync_api import sync_playwright

URL = (pathlib.Path(__file__).resolve().parent.parent / 'web' / 'index.html').as_uri()
DONE = "() => [...document.querySelectorAll('.bench-dots span')].map(s => s.classList.contains('done'))"
CUR = "() => [...document.querySelectorAll('.bench-dots span')].findIndex(s => s.classList.contains('cur'))"


def wait(pg, js, want, what):
    for _ in range(50):
        if pg.evaluate(js) == want:
            return
        pg.wait_for_timeout(100)
    sys.exit(f'✗ {what}: verwacht {want}, kreeg {pg.evaluate(js)}')


with sync_playwright() as p:
    # headless Chromium verbergt lokale IP's achter mDNS-namen die hij zelf niet oplost
    b = p.chromium.launch(args=['--disable-features=WebRtcHideLocalIpsWithMdns'])
    errs = []
    A, B = (b.new_context(viewport={'width': 375, 'height': 800}, locale='nl-NL').new_page() for _ in range(2))
    for pg in (A, B):
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(URL + '#inst'); pg.wait_for_timeout(600)

    A.evaluate("openBench({title: 'Synctest', steps: ['Stap een', 'Stap twee', 'Stap drie']})")
    A.click('#sync-start')
    A.wait_for_function("() => (document.querySelector('#sync-mine') || {}).value", timeout=10000)
    offer = A.input_value('#sync-mine')
    B.click('#sync-join')
    B.fill('#sync-in', offer); B.click('#sync-go')
    B.wait_for_function("() => (document.querySelector('#sync-mine') || {}).value", timeout=10000)
    answer = B.input_value('#sync-mine')
    print(f'aanbod {len(offer)} tekens, antwoord {len(answer)} tekens')
    A.fill('#sync-in', answer); A.click('#sync-go')
    for pg in (A, B):
        pg.wait_for_selector('#sync-state', timeout=10000)
    print('gekoppeld:', A.inner_text('#sync-state'), '/', B.inner_text('#sync-state'))
    wait(B, "() => document.querySelector('.bench-title').textContent", 'Synctest', 'run op B')

    A.click('.bench-ok')   # stap 1 klaar op A, A gaat naar stap 2
    wait(B, DONE, [True, False, False], 'vinkje van A op B')
    wait(B, CUR, 1, 'huidige stap van A op B')
    B.click('.bench-ok')   # stap 2 klaar op B
    wait(A, DONE, [True, True, False], 'vinkje van B op A')
    wait(A, CUR, 2, 'huidige stap van B op A')
    A.click('.bench-nav button:first-child')   # terug naar stap 2
    wait(B, CUR, 1, 'vorige stap van A op B')

    A.click('.bench .bench-x')   # A sluit de bench-modus: B meldt het en blijft bruikbaar
    wait(B, "() => (document.querySelector('#sync-state') || {}).textContent", '· Verbinding verbroken', 'verbroken op B')
    B.click('.bench-ok'); B.click('.bench-ok')   # naar stap 3 en die afvinken
    wait(B, DONE, [True, True, True], 'B lokaal na verbreken')
    b.close()

if errs:
    sys.exit(f'✗ fouten: {errs}')
print('✓ telefoon en laptop blijven gelijk')
