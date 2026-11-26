"""
Labkit BML - projecten en runs (S118, docs/W1.md): houdt elk project en elke run zijn eigen invoer?

Begint met de opslag van voor S118 (invoer en een lopende werkstroom), en controleert:
de migratie naar "Mijn project" met de werkstroom als eerste run; stoppen geeft de losse invoer;
een nieuwe run begint leeg en laat tools buiten de run met rust; terug naar de eerste run geeft
zijn eigen waarde; een nieuw project is leeg; heen en weer wisselen houdt alles.
Gebruik: python tests/projects_check.py   (exitcode 1 bij problemen)
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


def setv(pg, i, v):
    pg.evaluate("([i,v])=>{const e=document.getElementById(i);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))}", [i, v])
    pg.wait_for_timeout(100)


def val(pg, tool, i):
    pg.goto(URL + '#' + tool); pg.wait_for_timeout(250)
    return pg.evaluate("i=>document.getElementById(i).value", i)


def ready(pg):
    pg.wait_for_selector('#proj-chip'); pg.wait_for_timeout(300)


def reload_after(pg, fn):
    with pg.expect_navigation():
        fn()
    ready(pg)


with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1280, 'height': 900}, locale='nl-NL'); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(URL + '#start'); ready(pg)
    pg.evaluate("""localStorage.clear(); indexedDB.deleteDatabase('labkit-projects');
      localStorage.setItem('labkit:v1:inputs', JSON.stringify({'n-a260':'0,5','z-ur':'7'}));
      localStorage.setItem('labkit:v1:wf', JSON.stringify({w:'pcrgel'})); localStorage.setItem('labkit:v1:wf:at', JSON.stringify('pcr'));
      localStorage.setItem('labkit:v1:tour', JSON.stringify({v:1})); localStorage.setItem('labkit:v1:seenver', JSON.stringify(APPVER))""")
    pg.reload(); ready(pg)
    m = pg.evaluate("JSON.parse(localStorage.getItem('labkit:v1:projects'))"); r = pg.evaluate("JSON.parse(localStorage.getItem('labkit:v1:runs'))")
    check('migratie: project', [x['name'] for x in m['list']], ['Mijn project'])
    check('migratie: werkstroom wordt de actieve run', ([x['name'] for x in r['list']], r['active'] == r['list'][0]['id']), (['Van DNA tot gel'], True))
    check('invoer in de run', val(pg, 'dna', 'n-a260'), '0,5')
    pg.click('#proj-chip'); reload_after(pg, lambda: pg.click('.run-stop'))
    check('na stoppen: losse invoer', val(pg, 'dna', 'n-a260'), '0,5')
    setv(pg, 'n-a260', '0,4')
    pg.goto(URL + '#start'); pg.wait_for_selector('[data-wf-start=pcrgel]'); pg.click('[data-wf-start=pcrgel]')
    check('startvenster: naam', pg.input_value('#run-name'), 'Van DNA tot gel (2)')
    reload_after(pg, lambda: pg.click('#run-start'))
    check('nieuwe run begint bij stap 1', pg.evaluate('location.hash'), '#dna')
    check('nieuwe run is leeg', val(pg, 'dna', 'n-a260'), '0,85')
    check('tool buiten de run houdt zijn waarde', val(pg, 'centrifuge', 'z-ur'), '7')
    pg.goto(URL + '#dna'); pg.wait_for_timeout(200); setv(pg, 'n-a260', '0,9')
    pg.goto(URL + '#start'); pg.wait_for_selector('#wf-runs')
    check('startpagina: mijn werkstromen', pg.locator('#wf-runs button').all_inner_texts(), ['Van DNA tot gel', 'Van DNA tot gel (2)'])
    first = pg.evaluate("JSON.parse(localStorage.getItem('labkit:v1:runs')).list[0].id")
    reload_after(pg, lambda: pg.click(f'[data-run-open="{first}"]'))
    check('eerste run heeft zijn eigen waarde', val(pg, 'dna', 'n-a260'), '0,5')
    pg.click('#proj-chip'); pg.fill('#proj-new', 'Week 4'); reload_after(pg, lambda: pg.click('.lk-proj-new button'))
    check('nieuw project: naam', pg.inner_text('#proj-chip'), 'Week 4')
    check('nieuw project is leeg', (val(pg, 'dna', 'n-a260'), pg.evaluate("localStorage.getItem('labkit:v1:runs')")), ('0,85', None))
    setv(pg, 'n-a260', '1,1')
    pg.click('#proj-chip'); pg.wait_for_timeout(300); reload_after(pg, lambda: pg.click('#proj-list .proj-open'))
    check('terug naar Mijn project, in zijn run', (pg.inner_text('#proj-chip'), val(pg, 'dna', 'n-a260')), ('Mijn project', '0,5'))
    pg.click('#proj-chip'); pg.wait_for_timeout(300); reload_after(pg, lambda: pg.click('#proj-list .proj-open'))
    check('Week 4 houdt zijn waarde', val(pg, 'dna', 'n-a260'), '1,1')
    check('geen paginafouten', errs, [])
    b.close()

print('ALLES OK' if not fails else f'{len(fails)} FOUT(EN): ' + ', '.join(fails))
sys.exit(1 if fails else 0)
