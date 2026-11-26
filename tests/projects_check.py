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

    # gels horen bij hun project
    pg.evaluate("indexedDB.deleteDatabase('labkit-gels')"); pg.goto(URL + '#gelfoto'); pg.wait_for_timeout(300)
    pg.evaluate("gfDemo()"); pg.wait_for_timeout(800); pg.evaluate("gfLibSave(true)"); pg.wait_for_timeout(800)
    check('gel in de bibliotheek van Week 4', pg.locator('#gf-lib li').count(), 1)
    # notities
    pg.click('#proj-chip'); pg.fill('#proj-note', 'Gel 2 liep scheef'); pg.click('#proj-note-add'); pg.wait_for_timeout(200)
    check('notitie bewaard', pg.evaluate("JSON.parse(localStorage.getItem('labkit:v1:notes')).map(n=>n.text)"), ['Gel 2 liep scheef'])
    # exporteren en weer importeren als nieuw project
    with pg.expect_download() as d: pg.locator('#proj-list li.on .proj-export').click()
    exp = d.value.path(); j = __import__('json').load(open(exp, encoding='utf-8'))
    check('export: soort, naam, gels', (j['kind'], j['name'], len(j['gels'])), ('labkitproject', 'Week 4', 1))
    pg.set_input_files('#proj-file', exp); pg.wait_for_timeout(800)
    check('import: nieuw project naast het oude', [x['name'] for x in pg.evaluate("JSON.parse(localStorage.getItem('labkit:v1:projects')).list")], ['Mijn project', 'Week 4', 'Week 4 (2)'])
    # een sessie van voor S118 wordt ook een project
    old = __import__('json').dumps({'app': 'Labkit BML', 'project': 'Oude sessie', 'data': {'labkit:v1:inputs': '{"n-a260":"0,3"}', 'labkit:v1:pins': '["dna"]', 'labkit:v1:wf': '{"w":"pcrgel"}'}, 'gels': []})
    pg.set_input_files('#proj-file', {'name': 'oud.json', 'mimeType': 'application/json', 'buffer': old.encode()}); pg.wait_for_timeout(800)
    pid = pg.evaluate("JSON.parse(localStorage.getItem('labkit:v1:projects')).list.find(p=>p.name==='Oude sessie').id")
    reload_after(pg, lambda: pg.locator('#proj-list li', has_text='Oude sessie').locator('.proj-open').click())
    check('oude sessie: invoer, geen werkstroom, voorkeuren blijven van het apparaat',
          (val(pg, 'dna', 'n-a260'), pg.evaluate("localStorage.getItem('labkit:v1:wf')"), pg.locator('#gf-lib li').count() if (pg.goto(URL + '#gelfoto'), pg.wait_for_timeout(500)) else 0), ('0,3', None, 0))
    pg.check('#gf-liball'); pg.wait_for_timeout(400)
    check('alle projecten: beide gels', pg.locator('#gf-lib li').count(), 2)
    # back-up en terugzetten
    pg.click('#proj-chip')
    with pg.expect_download() as d: pg.click('#proj-backup')
    bk = d.value.path(); nproj = len(pg.evaluate("JSON.parse(localStorage.getItem('labkit:v1:projects')).list"))
    pg.locator('#proj-list li:not(.on)').first.locator('button', has_text='Verwijderen').click(); pg.locator('#proj-list li:not(.on)').first.locator('button', has_text='Zeker').click(); pg.wait_for_timeout(400)
    check('project verwijderd', len(pg.evaluate("JSON.parse(localStorage.getItem('labkit:v1:projects')).list")), nproj - 1)
    pg.set_input_files('#proj-file', bk); pg.wait_for_selector('#proj-restore')
    reload_after(pg, lambda: pg.click('#proj-restore'))
    check('back-up teruggezet', len(pg.evaluate("JSON.parse(localStorage.getItem('labkit:v1:projects')).list")), nproj)
    check('geen paginafouten', errs, [])
    b.close()

print('ALLES OK' if not fails else f'{len(fails)} FOUT(EN): ' + ', '.join(fails))
sys.exit(1 if fails else 0)
