"""
Labkit BML - data tussen de stappen van een run (S117, docs/W1.md en docs/adr/0002).

Controleert in de werkstroom "Van DNA tot gel": buiten een run vult niets zich; in de run volgt
het templatevolume van PCR-mastermix live de DNA-concentratie; klikken in het veld maakt er een
eigen waarde van met een knop "Automatisch" die het terugzet; de monsterlijst en de productgrootte
uit PCR-cyclus vullen de lanen van de Gelplanner, per kolom over te nemen; een eigen waarde blijft
na herladen eigen.
Gebruik: python tests/flow_check.py   (exitcode 1 bij problemen)
"""
import pathlib, sys
from playwright.sync_api import sync_playwright

URL = (pathlib.Path(__file__).resolve().parent.parent / 'web' / 'index.html').as_uri()
fails = []


def check(what, got, want):
    ok = got == want
    print(f"  {'OK  ' if ok else 'FOUT'} {what}: {got!r}" + ('' if ok else f' (verwacht {want!r})'))
    if not ok:
        fails.append(what)


def go(pg, tool):
    pg.goto(URL + '#' + tool); pg.wait_for_timeout(400)


def setv(pg, i, v):
    pg.evaluate("([i,v])=>{const e=document.getElementById(i);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))}", [i, v])
    pg.wait_for_timeout(400)


def qt(pg):
    go(pg, 'pcr'); return pg.evaluate("__n=v=>Number(String(v).replace(',','.')); __n(document.getElementById('q-t').value)")


def want_qt(pg):
    """10 ng (of de gewenste input) gedeeld door de concentratie die DNA-kwantificatie toont, op drie cijfers"""
    go(pg, 'dna')
    c = pg.evaluate("bigNum(document.querySelector('#n-out .big'))"); ng = pg.evaluate("num(document.getElementById('m-ng').value)") or 10
    return max(float(f'{ng / c:.3g}'), 0.01)


def lanes(pg):
    go(pg, 'gplan'); return pg.evaluate("etGet('gp-tbl').map(r=>[r[0],r[2]])")


def ready(pg):
    pg.wait_for_selector('#proj-chip'); pg.wait_for_timeout(400)


with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1280, 'height': 900}, locale='nl-NL'); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(URL + '#start'); ready(pg)
    pg.evaluate("""localStorage.clear(); indexedDB.deleteDatabase('labkit-projects');
      localStorage.setItem('labkit:v1:tour', JSON.stringify({v:1})); localStorage.setItem('labkit:v1:seenver', JSON.stringify(APPVER));
      localStorage.setItem('labkit:v1:samples', JSON.stringify(['WT','KO']))""")
    pg.reload(); ready(pg)
    before = qt(pg); go(pg, 'dna'); setv(pg, 'n-a260', '2,0')
    check('buiten een run vult niets zich', qt(pg), before)

    go(pg, 'start'); pg.wait_for_selector('[data-wf-start=pcrgel]'); pg.click('[data-wf-start=pcrgel]')
    with pg.expect_navigation():
        pg.click('#run-start')
    ready(pg)
    go(pg, 'dna'); setv(pg, 'n-df', '1'); setv(pg, 'n-a260', '0,4')
    check('in de run: template volgt de DNA-concentratie', qt(pg), want_qt(pg))
    go(pg, 'dna'); setv(pg, 'n-a260', '0,08')
    check('na een nieuwe concentratie volgt het mee', qt(pg), want_qt(pg))
    go(pg, 'pcr'); pg.click('#q-t'); pg.wait_for_timeout(200)
    check('klikken in het veld: knop Automatisch verschijnt', pg.locator('[data-auto-reset=dna-pcr]').count(), 1)
    own = qt(pg); go(pg, 'dna'); setv(pg, 'n-a260', '0,2')
    check('eigen waarde volgt niet meer', qt(pg), own)
    pg.reload(); ready(pg)
    check('na herladen nog steeds eigen', (qt(pg), pg.locator('[data-auto-reset=dna-pcr]').count()), (own, 1))
    pg.click('[data-auto-reset=dna-pcr]'); pg.wait_for_timeout(500)
    check('Automatisch zet het terug', qt(pg), want_qt(pg))

    go(pg, 'pcrcyclus'); setv(pg, 'y-bp', '1234')
    check('Gelplanner: ladder blijft, monsternamen en productgrootte', lanes(pg), [['Ladder', ''], ['WT', '1234'], ['KO', '1234']])
    go(pg, 'gplan'); pg.locator('#gp-tbl tbody tr').nth(1).locator('input').nth(2).click(); pg.wait_for_timeout(200)
    check('klikken in een cel van de kolom: knop onder de tabel', pg.locator('[data-auto-reset=pcr-gplan]').count(), 1)
    go(pg, 'pcrcyclus'); setv(pg, 'y-bp', '800')
    check('eigen kolom volgt niet meer, de namen wel', lanes(pg), [['Ladder', ''], ['WT', '1234'], ['KO', '1234']])
    go(pg, 'gplan'); pg.click('[data-auto-reset=pcr-gplan]'); pg.wait_for_timeout(500)
    check('kolom weer automatisch', lanes(pg), [['Ladder', ''], ['WT', '800'], ['KO', '800']])

    pg.click('#proj-chip')
    with pg.expect_navigation():
        pg.click('.run-stop')
    ready(pg)
    go(pg, 'pcr'); check('na stoppen: geen knoppen meer', pg.locator('.lk-auto-reset').count(), 0)
    before = qt(pg); go(pg, 'dna'); setv(pg, 'n-a260', '3,0')
    check('na stoppen vult niets zich', qt(pg), before)
    check('geen paginafouten', errs, [])
    b.close()

print('ALLES OK' if not fails else f'{len(fails)} FOUT(EN): ' + ', '.join(fails))
sys.exit(1 if fails else 0)
