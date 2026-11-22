"""
Labkit BML - visuele regressie.

Maakt schermafbeeldingen van enkele sleuteltools (met hun voorbeeldgegevens) en van de gelfoto-editor
(demo en echte testgel) en vergelijkt ze pixel voor pixel met de basisafbeeldingen in tests/visual/<platform>/.
Lettertypen worden vastgezet op DejaVu; toch verschillen Windows en Linux, dus elk platform heeft eigen
basisafbeeldingen (linux/ is die van CI). Bij een verschil staan de nieuwe afbeelding en een diff in tests/visual/out/.
Een ontbrekende basis wordt aangemaakt ("nieuwe basis"), behalve in CI (omgevingsvariabele CI): daar mislukt het.
Gebruik: python tests/visual_check.py                    vergelijken (exitcode 1 bij verschil)
         python tests/visual_check.py --update           alle basisafbeeldingen opnieuw maken
         python tests/visual_check.py --update gelfoto   alleen namen die zo beginnen (na bewuste wijziging, daarna committen)
"""
import os, pathlib, sys
import cv2, numpy as np
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / 'web' / 'index.html').as_uri()
BASE = ROOT / 'tests' / 'visual' / sys.platform
OUT = ROOT / 'tests' / 'visual' / 'out'
CHAN, MAXFRAC, NB = 24, 0.005, 2  # kanaalverschil per pixel; aandeel afwijkende pixels dat nog mag; omgeving ±NB px
CSS = ("*{animation:none!important;transition:none!important;caret-color:transparent!important}"
       ".lk-valid{visibility:hidden!important}"  # het aantal validatiecontroles groeit met elke batch
       ":root,html[data-theme]{--font-ui:'DejaVu Sans'!important;--font-mono:'DejaVu Sans Mono'!important}"
       "body,input,button,select,textarea{font-family:'DejaVu Sans'!important}")
INIT = ("try{localStorage.setItem('labkit:v1:lang','nl')}catch(e){}"
        "document.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent=%r;document.head.appendChild(s)});" % CSS)
# (naam, tool, js vooraf)
SHOTS = [(t, t, '') for t in ('verdunning', 'oplossing', 'curve', 'pcr', 'enzym', 'stat', 'centrifuge')] + [
    ('gelfoto-demo', 'gelfoto', "gfDemo()"), ('gelfoto-foto', 'gelfoto', None)]

def shoot(pg, tool, js):
    pg.goto('about:blank'); pg.goto(URL + '#' + tool); pg.wait_for_timeout(800)
    if js is None:
        pg.set_input_files('#gf-file', str(ROOT / 'tests' / 'fixtures' / 'gel_realistic.png')); pg.wait_for_timeout(700)
        pg.evaluate("$('#gf-n').value=''; document.getElementById('gf-auto').click()"); pg.wait_for_timeout(1500)
    elif js: pg.evaluate(js)
    pg.wait_for_timeout(500)
    return pg.locator('#t-' + tool).screenshot(animations='disabled')

def changed(a, b):
    """Pixels van a die buiten het bereik (min..max) van de 5×5-omgeving in b vallen. Zo telt anders
    gerasterde tekst (andere Chromium-build of FreeType in CI) niet mee, een verschoven of nieuw element wel."""
    k = np.ones((2 * NB + 1, 2 * NB + 1), np.uint8); a = a.astype(int)
    lo, hi = cv2.erode(b, k).astype(int), cv2.dilate(b, k).astype(int)
    return ((a < lo - CHAN) | (a > hi + CHAN)).any(axis=2)

def main():
    args = sys.argv[1:]; upd = '--update' in args
    pref = [a for a in args if not a.startswith('--')]
    fails = 0; BASE.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch(); ctx = b.new_context(viewport={'width': 1280, 'height': 900}, device_scale_factor=1, reduced_motion='reduce')
        ctx.add_init_script(INIT)
        for name, tool, js in SHOTS:
            if upd and pref and not any(name.startswith(x) for x in pref): continue
            pg = ctx.new_page(); png = shoot(pg, tool, js); pg.close()
            f = BASE / (name + '.png')
            if upd or not f.exists():
                if not upd and os.environ.get('CI'): print(f'MISLUKT {name}: geen basis in CI ({f.relative_to(ROOT)})'); fails += 1; continue
                f.write_bytes(png); print(f'{"bijgewerkt" if upd else "nieuwe basis"} {name} ({len(png) // 1024} kB)'); continue
            new = cv2.imdecode(np.frombuffer(png, np.uint8), cv2.IMREAD_COLOR); old = cv2.imread(str(f))
            if old is None or old.shape != new.shape:
                bad, frac = None, 1.0; why = f'afmeting {None if old is None else old.shape[:2]} -> {new.shape[:2]}'
            else:
                bad = changed(new, old) | changed(old, new); frac = bad.mean(); why = f'{frac:.2%} pixels anders'
            if frac > MAXFRAC:
                fails += 1; OUT.mkdir(parents=True, exist_ok=True); (OUT / (name + '.png')).write_bytes(png)
                if bad is not None:
                    d = (new * 0.3 + 255 * 0.7).astype(np.uint8); d[bad] = (0, 0, 255); cv2.imwrite(str(OUT / (name + '-diff.png')), d)
                print(f'MISLUKT {name}: {why} (max {MAXFRAC:.1%}); zie tests/visual/out/')
            else: print(f'ok {name}: {why}')
        b.close()
    sys.exit(1 if fails else 0)

if __name__ == '__main__': main()
