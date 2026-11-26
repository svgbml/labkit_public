"""
Labkit BML - projecten als bestanden in het Windows-programma (S273, docs/adr/0001).

Het echte programma kan hier niet draaien (daarvoor is Rust nodig; de Rust-kant controleert
.github/workflows/tauri-check.yml). Deze test zet daarom een nep-window.__TAURI__ neer met dezelfde
opdrachten als src-tauri/src/main.rs (store_dir/read/write/delete/list en gel_index, met dezelfde
padcontrole), die zijn "bestanden" in localStorage onder fakefs: bewaart. Controleert:
de eerste start in het programma neemt projecten, runs en gels uit IndexedDB mee naar de bestanden;
daarna gaat alles via bestanden: wisselen, runs, een gel bewaren, openen en exporteren, een project
verwijderen; een pad buiten de map wordt geweigerd.
Gebruik: python tests/filestore_check.py   (exitcode 1 bij problemen)
"""
import pathlib, sys, json
from playwright.sync_api import sync_playwright

URL = (pathlib.Path(__file__).resolve().parent.parent / 'web' / 'index.html').as_uri()
fails = []
FAKE = r"""
if (localStorage.getItem('fakeon')) {
  const K = 'fakefs:', ok = rel => rel === '' || (/^[A-Za-z0-9._\/-]+$/.test(rel) && !rel.startsWith('/') && !rel.split('/').some(s => !s || s === '.' || s === '..'));
  const keys = () => Object.keys(localStorage).filter(k => k.startsWith(K)).map(k => k.slice(K.length));
  const cmds = {
    store_dir: () => 'C:\\Users\\student\\Documents\\LabKit\\Projecten',
    store_read: ({rel}) => { if (!ok(rel)) throw 'ongeldig pad'; return localStorage.getItem(K + rel); },
    store_write: ({rel, data}) => { if (!ok(rel) || !rel) throw 'ongeldig pad'; localStorage.setItem(K + rel, data); },
    store_delete: ({rel}) => { if (!rel) throw 'nooit alles'; if (!ok(rel)) throw 'ongeldig pad'; keys().filter(k => k === rel || k.startsWith(rel + '/')).forEach(k => localStorage.removeItem(K + k)); },
    store_list: ({rel}) => { if (!ok(rel)) throw 'ongeldig pad'; const pre = rel ? rel + '/' : ''; return [...new Set(keys().filter(k => k.startsWith(pre)).map(k => k.slice(pre.length).split('/')[0]))].sort(); },
    gel_index: ({pid}) => keys().filter(k => k.startsWith(pid + '/gels/') && k.endsWith('.json')).map(k => { const v = JSON.parse(localStorage.getItem(K + k)); delete v.snap; return v; })
  };
  window.__TAURI__ = {core: {invoke: async (c, a) => { if (!cmds[c]) throw 'onbekende opdracht ' + c; return cmds[c](a || {}); }}};
}
"""


def check(what, got, want):
    ok = got == want
    print(f"  {'OK  ' if ok else 'FOUT'} {what}: {got!r}" + ('' if ok else f' (verwacht {want!r})'))
    if not ok:
        fails.append(what)


def ready(pg):
    pg.wait_for_selector('#proj-chip'); pg.wait_for_timeout(600)


def files(pg):
    return sorted(pg.evaluate("Object.keys(localStorage).filter(k=>k.startsWith('fakefs:')).map(k=>k.slice(7))"))


def save_gel(pg):
    pg.goto(URL + '#gelfoto'); pg.wait_for_timeout(300); pg.evaluate("gfDemo()"); pg.wait_for_timeout(800)
    pg.evaluate("gf.libId=null; gfLibSave(true)"); pg.wait_for_timeout(900)


with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 1280, 'height': 900}, locale='nl-NL', accept_downloads=True)
    ctx.add_init_script(FAKE); pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    # 1. in de browser: twee projecten en een gel in IndexedDB
    pg.goto(URL + '#start'); ready(pg)
    pg.evaluate("""localStorage.clear(); indexedDB.deleteDatabase('labkit-projects'); indexedDB.deleteDatabase('labkit-gels');
      localStorage.setItem('labkit:v1:tour', JSON.stringify({v:1})); localStorage.setItem('labkit:v1:seenver', JSON.stringify(APPVER))""")
    pg.reload(); ready(pg)
    save_gel(pg)
    pg.click('#proj-chip'); pg.fill('#proj-new', 'Week 4')
    with pg.expect_navigation():
        pg.click('.lk-proj-new button')
    ready(pg)
    m = pg.evaluate("JSON.parse(localStorage.getItem('labkit:v1:projects'))"); first, week4 = m['list'][0]['id'], m['list'][1]['id']
    check('browser: nog geen bestanden', files(pg), [])

    # 2. hetzelfde apparaat, nu als programma
    pg.evaluate("localStorage.setItem('fakeon','1')"); pg.reload(); ready(pg); pg.wait_for_timeout(800)
    f = files(pg)
    check('eerste start: het inactieve project als bestand', f'{first}/project.json' in f, True)
    check('eerste start: de gel als bestand in zijn projectmap', any(x.startswith(f'{first}/gels/') for x in f), True)
    pg.click('#proj-chip'); pg.wait_for_timeout(500)
    check('paneel noemt de map', 'Documents\\LabKit\\Projecten' in pg.inner_text('#proj-space'), True)
    with pg.expect_navigation():
        pg.locator('#proj-list li', has_text='Mijn project').locator('.proj-open').click()
    ready(pg)
    check('wisselen via bestanden: Week 4 is nu een bestand', f'{week4}/project.json' in files(pg), True)
    pg.goto(URL + '#gelfoto'); pg.wait_for_timeout(600)
    check('gelbibliotheek leest de bestanden', pg.locator('#gf-lib li').count(), 1)
    pg.locator('#gf-lib .gf-lib-open').first.click(); pg.wait_for_timeout(800)
    check('een gel openen haalt hem uit zijn bestand', pg.evaluate("!!gf.src"), True)
    # 3. een run en een gel in die run
    pg.goto(URL + '#start'); pg.click('[data-wf-start=pcrgel]')
    with pg.expect_navigation():
        pg.click('#run-start')
    ready(pg)
    save_gel(pg)
    gels = [x for x in files(pg) if x.startswith(f'{first}/gels/')]
    check('tweede gel in dezelfde projectmap', len(gels), 2)
    run_id = pg.evaluate("JSON.parse(localStorage.getItem('labkit:v1:runs')).active")
    check('de gel weet bij welke run hij hoort', json.loads(pg.evaluate(f"localStorage.getItem('fakefs:{gels[0]}')"))['run'] in (run_id, None), True)
    pg.click('#proj-chip')
    with pg.expect_navigation():
        pg.click('.run-stop')
    ready(pg)
    check('gestopte run als bestand', any(x.startswith(f'{first}/runs/') for x in files(pg)), True)
    # 4. exporteren met de gels erin
    pg.click('#proj-chip'); pg.wait_for_timeout(300)
    with pg.expect_download() as d:
        pg.locator('#proj-list li.on .proj-export').click()
    j = json.load(open(d.value.path(), encoding='utf-8'))
    check('export: beide gels, met de gel zelf', (len(j['gels']), all('snap' in g for g in j['gels'])), (2, True))
    # 5. een project verwijderen haalt zijn map weg
    pg.locator('#proj-list li', has_text='Week 4').locator('button', has_text='Verwijderen').click()
    pg.locator('#proj-list li', has_text='Week 4').locator('button', has_text='Zeker').click(); pg.wait_for_timeout(500)
    check('verwijderd project: map weg', any(x.startswith(week4 + '/') for x in files(pg)), False)
    # 6. de padcontrole
    check('pad buiten de map geweigerd', pg.evaluate("window.__TAURI__.core.invoke('store_read',{rel:'../geheim.txt'}).then(()=>'gelezen',e=>'geweigerd')"), 'geweigerd')
    check('geen paginafouten', errs, [])
    b.close()

print('ALLES OK' if not fails else f'{len(fails)} FOUT(EN): ' + ', '.join(fails))
sys.exit(1 if fails else 0)
