"""
Labkit BML - zoeken dat vragen begrijpt (S121, docs/W1.md).

Typt een vraag in de zoekbalk van de startpagina en in het opdrachtpalet (Ctrl+K), en controleert
dat de juiste tool opent met de velden ingevuld en de uitkomst die hoort bij die invoer:
0,9% NaCl in 500 mL = 4,5 g; 1:10 tot 50 mL = 5 mL stock; 4000 rpm bij 10 cm = 1789 × g
(RCF = 1,118·10⁻⁵ · r · rpm²); molmassa NaCl = 58,44 g/mol.
Gebruik: python tests/ask_check.py   (exitcode 1 bij problemen)
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


def start_ask(pg, q):
    pg.goto(URL + '#start'); pg.wait_for_selector('#bento-q'); pg.fill('#bento-q', q); pg.wait_for_timeout(150)
    label = pg.inner_text('#bento-ask') if pg.locator('#bento-ask').count() else None
    pg.press('#bento-q', 'Enter'); pg.wait_for_timeout(500)
    return label


def num(pg, js):
    return pg.evaluate("t=>{const m=String(t).replace(/\\u00a0/g,' ').match(/-?\\d+(?:[.,]\\d+)?/); return m?Number(m[0].replace(',','.')):null}", pg.evaluate(js))


with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1280, 'height': 900}, locale='nl-NL'); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(URL + '#start'); pg.wait_for_selector('#proj-chip')
    pg.evaluate("localStorage.clear(); localStorage.setItem('labkit:v1:tour', JSON.stringify({v:1})); localStorage.setItem('labkit:v1:seenver', JSON.stringify(APPVER))")
    pg.reload(); pg.wait_for_selector('#proj-chip'); pg.wait_for_timeout(300)

    lab = start_ask(pg, '500 mL 0,9% NaCl')
    check('Oplossing: knop onder de zoekbalk', lab.endswith('500 mL · 0,9 % w/v NaCl →'), True)
    check('Oplossing: geopend en ingevuld', (pg.evaluate('location.hash'), pg.input_value('#o-v'), pg.evaluate("window.__oplosVm.rows.map(r=>[r.n,r.u])")), ('#oplossing', '500', [['NaCl', '% w/v']]))
    check('Oplossing: 4,5 g NaCl', num(pg, "(document.querySelector('#t-oplossing .result').innerText.match(/NaCl\\s+(\\d+(?:,\\d+)?)\\s*g/)||[])[1]"), 4.5)
    check('melding Ingevuld uit je zoekvraag', pg.locator('.lk-ask-toast').count(), 1)

    start_ask(pg, '1:10 van 50 mL')
    check('Verdunning: ingevuld', (pg.evaluate('location.hash'), pg.input_value('#d-c1'), pg.input_value('#d-c1u'), pg.input_value('#d-v2'), pg.input_value('#d-v2u')), ('#verdunning', '10', 'X', '50', 'mL'))
    check('Verdunning: 5 mL stock', num(pg, "document.querySelector('#d-out .big').textContent"), 5)

    start_ask(pg, '4000 rpm rotor 10 cm')
    check('Centrifuge: 1789 × g', (pg.input_value('#z-r'), pg.input_value('#z-rpm'), round(num(pg, "document.getElementById('z-g').value"))), ('10', '4000', 1789))

    start_ask(pg, '5 mg/mL naar µM')
    check('Eenheden: ingevuld', (pg.evaluate('location.hash'), pg.input_value('#un-v'), pg.input_value('#un-u')), ('#units', '5', 'mgmL'))

    # het opdrachtpalet
    pg.goto(URL + '#start'); pg.wait_for_timeout(200); pg.keyboard.press('Control+k'); pg.wait_for_selector('.lk-cmdq')
    pg.fill('.lk-cmdq', 'molmassa NaCl'); pg.wait_for_timeout(150)
    check('palet: de vraag staat bovenaan', pg.inner_text('.lk-cmdl [data-i="0"]').split('\n')[0].endswith('NaCl'), True)
    pg.press('.lk-cmdq', 'Enter'); pg.wait_for_timeout(500)
    check('Molmassa: 58,44 g/mol', (pg.evaluate('location.hash'), num(pg, "document.querySelector('#mm-out .big').textContent")), ('#molm', 58.44))

    # een gewone zoekterm blijft een gewone zoekterm
    pg.goto(URL + '#start'); pg.fill('#bento-q', 'verdunning'); pg.wait_for_timeout(150)
    check('gewoon zoeken: geen vraagknop', pg.locator('#bento-ask').count(), 0)
    check('geen paginafouten', errs, [])
    b.close()

print('ALLES OK' if not fails else f'{len(fails)} FOUT(EN): ' + ', '.join(fails))
sys.exit(1 if fails else 0)
