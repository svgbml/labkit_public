"""
Labkit BML - eigen werkstromen en practicumsjablonen (S119, docs/W1.md).

Controleert: de practicumsjablonen staan op de startpagina; een eigen werkstroom maken (zoeken,
toevoegen, volgorde), bewerken en een ingebouwde kopiëren; een eigen werkstroom delen als link
die in een andere browser wordt toegevoegd (één keer); een run van een eigen werkstroom; een
verwijderde eigen werkstroom verdwijnt van de startpagina maar zijn run blijft werken.
Gebruik: python tests/werkstroom_check.py   (exitcode 1 bij problemen)
"""
import pathlib, sys
from playwright.sync_api import sync_playwright

URL = (pathlib.Path(__file__).resolve().parent.parent / 'web' / 'index.html').as_uri()
fails = []
FRESH = """localStorage.clear(); indexedDB.deleteDatabase('labkit-projects');
  localStorage.setItem('labkit:v1:tour', JSON.stringify({v:1})); localStorage.setItem('labkit:v1:seenver', JSON.stringify(APPVER))"""


def check(what, got, want):
    ok = got == want
    print(f"  {'OK  ' if ok else 'FOUT'} {what}: {got!r}" + ('' if ok else f' (verwacht {want!r})'))
    if not ok:
        fails.append(what)


def ready(pg):
    pg.wait_for_selector('#proj-chip'); pg.wait_for_timeout(400)


def cards(pg):
    pg.goto(URL + '#start'); pg.wait_for_selector('.lk-wf-card'); pg.wait_for_timeout(200)
    return pg.locator('.lk-wf-card b').all_inner_texts()


def add(pg, q, n=0):
    pg.fill('#wfb-q', q); pg.wait_for_timeout(150); pg.locator('#wfb-pick button').nth(n).click(); pg.wait_for_timeout(100)


def steps(pg):
    return pg.locator('#wfb-steps .nm').all_inner_texts()


with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 1280, 'height': 900}, locale='nl-NL'); pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(URL + '#start'); ready(pg); pg.evaluate(FRESH); pg.reload(); ready(pg)
    c = cards(pg)
    check('drie practicumsjablonen, met label', len([x for x in c if 'practicum' in x]), 3)

    pg.click('[data-wf-new]'); pg.wait_for_selector('#wfb')
    pg.fill('#wfb-name', 'Mijn plasmide-check')
    add(pg, 'dna-kwant'); add(pg, 'restrictie'); add(pg, 'gelplanner')
    check('drie stappen toegevoegd', steps(pg), ['DNA-kwantificatie', 'Restrictiedigestie', 'Gelplanner'])
    pg.locator('#wfb-steps li').nth(2).locator('button', has_text='↑').click()
    check('↑ verplaatst een stap', steps(pg), ['DNA-kwantificatie', 'Gelplanner', 'Restrictiedigestie'])
    pg.click('#wfb-save'); pg.wait_for_timeout(300)
    own = pg.evaluate("JSON.parse(localStorage.getItem('labkit:v1:wfown'))")
    check('bewaard als eigen werkstroom', [(w['n'], w['steps']) for w in own], [('Mijn plasmide-check', ['dna', 'gplan', 'digest'])])
    pg.click('#wfb button:has-text("Sluiten")')
    check('op de startpagina met label eigen', 'Mijn plasmide-checkeigen' in cards(pg), True)

    pg.click(f"[data-wf-edit='{own[0]['id']}']"); pg.wait_for_selector('#wfb')
    check('bewerken: naam en stappen terug', (pg.input_value('#wfb-name'), steps(pg)), ('Mijn plasmide-check', ['DNA-kwantificatie', 'Gelplanner', 'Restrictiedigestie']))
    pg.locator('#wfb-steps li').nth(1).locator('button[aria-label=Verwijderen]').click(); add(pg, 'gelfoto')
    pg.click('#wfb-save'); pg.wait_for_timeout(200)
    check('bewerkt, geen tweede kopie', [w['steps'] for w in pg.evaluate("JSON.parse(localStorage.getItem('labkit:v1:wfown'))")], [['dna', 'digest', 'gelfoto']])

    # delen, en in een andere browser openen
    pg.click('#wfb-share'); pg.wait_for_selector('#wfb-url')
    url = pg.input_value('#wfb-url')
    check('deellink met ?wf= en een QR-code', ('?wf=' in url, pg.locator('.lk-wfb-qr').is_visible()), (True, True))
    pg.click('#wfb button:has-text("Sluiten")')
    ctx2 = b.new_context(viewport={'width': 1280, 'height': 900}, locale='nl-NL'); p2 = ctx2.new_page()
    p2.goto(URL + '#start'); ready(p2); p2.evaluate(FRESH)
    p2.goto(URL + '?' + url.split('?', 1)[1]); ready(p2); p2.wait_for_timeout(300)
    got = p2.evaluate("JSON.parse(localStorage.getItem('labkit:v1:wfown')||'[]')")
    check('andere browser: werkstroom toegevoegd', [(w['n'], w['steps']) for w in got], [('Mijn plasmide-check', ['dna', 'digest', 'gelfoto'])])
    check('de link verdwijnt uit de adresbalk', '?wf=' in p2.url, False)
    p2.goto(URL + '?' + url.split('?', 1)[1]); ready(p2); p2.wait_for_timeout(300)
    check('tweede keer openen: niet dubbel', len(p2.evaluate("JSON.parse(localStorage.getItem('labkit:v1:wfown'))")), 1)
    ctx2.close()

    # een ingebouwde kopiëren
    pg.goto(URL + '#start'); pg.click("[data-wf-edit='kloon']"); pg.wait_for_selector('#wfb')
    check('kopie van een ingebouwde', (pg.input_value('#wfb-name'), len(steps(pg)) > 1, pg.locator('#wfb-del').count()), ('Kloneren (kopie)', True, 0))
    pg.click('#wfb button:has-text("Sluiten")')

    # een run van de eigen werkstroom, dan de werkstroom verwijderen
    wid = own[0]['id']
    pg.click(f"[data-wf-start='{wid}']"); pg.wait_for_selector('#run-start')
    with pg.expect_navigation():
        pg.click('#run-start')
    ready(pg)
    check('run van een eigen werkstroom: balk', pg.inner_text('#lk-wf .lk-wf-top').split('\n')[:2], ['Mijn plasmide-check', 'stap 1 van 3'])
    pg.goto(URL + '#start'); pg.click(f"[data-wf-edit='{wid}']"); pg.click('#wfb-del'); pg.click('#wfb-del'); pg.wait_for_timeout(200)
    check('verwijderd: niet meer op de startpagina', any('Mijn plasmide' in x for x in cards(pg)), False)
    pg.goto(URL + '#digest'); pg.wait_for_timeout(300)
    check('de run blijft werken', pg.inner_text('#lk-wf .lk-wf-top').split('\n')[1], 'stap 2 van 3')
    check('geen paginafouten', errs, [])
    b.close()

print('ALLES OK' if not fails else f'{len(fails)} FOUT(EN): ' + ', '.join(fails))
sys.exit(1 if fails else 0)
