"""Bouwt web/index.html uit src/shell/index.html (sinds S265 is web/index.html alleen nog uitvoer;
sinds S269 vervangt dit script tools/insert_tools.py en is tools/nt/ weg).

Wat erbij komt:
  1. de @include-regels van het sjabloon (`<!-- @include pad -->`, pad relatief aan src/shell/)
  2. de Vue-bundel uit build/app.bundle.js (npm run build:vue) op de @bundle-regel; daarin staat
     sinds S269 alle JavaScript van de app behalve de taalkeuze en de DOM-vertaallaag
  3. de hash van web/i18n-en.js (tools/build_i18n.py schrijft dat bestand)
Gebruik:
  python tools/build_html.py           schrijft web/index.html
  python tools/build_html.py --check   schrijft niets; faalt als web/index.html niet overeenkomt
Gewoonlijk via `python tools/build.py` (of `npm run build`)."""
import glob, hashlib, os, re, sys

R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHELL = os.path.join(R, 'src', 'shell')
HTML = os.path.join(R, 'web', 'index.html')
BUNDLE = os.path.join(R, 'build', 'app.bundle.js')
CHECK = '--check' in sys.argv
s = open(os.path.join(SHELL, 'index.html'), encoding='utf8').read()

# 1. @include: een regel `<!-- @include sections/x.html -->` wordt de inhoud van dat bestand
def include(m):
    p = os.path.join(SHELL, m.group(2))
    assert os.path.isfile(p), '@include: bestand ontbreekt: ' + m.group(2)
    body = open(p, encoding='utf8').read()
    if body.endswith('\n'): body = body[:-1]
    assert '@include' not in body, '@include binnen een ingevoegd bestand: ' + m.group(2)
    return m.group(1) + body
s = re.sub(r'^([ \t]*)<!-- @include ([\w./-]+) -->$', include, s, flags=re.M)

# 2. de bundel. Hij wordt ingevoegd en niet als <script src> gekoppeld, zodat web/index.html een
#    bestand blijft dat vanaf file:// werkt (ES-modules zijn daar geblokkeerd).
assert os.path.exists(BUNDLE), 'build/app.bundle.js ontbreekt; draai eerst "npm run build:vue"'
if not CHECK:
    # Een verouderde bundel invoegen geeft een index.html die niet bij src/ past. src/shell/ gaat
    # niet door Vite (dit script voegt het zelf in), dus dat telt niet mee.
    newer = [p for p in glob.glob(os.path.join(R, 'src', '**', '*'), recursive=True)
             if os.path.isfile(p) and not os.path.abspath(p).startswith(SHELL + os.sep)
             and os.path.getmtime(p) > os.path.getmtime(BUNDLE)]
    assert not newer, ('build/app.bundle.js is ouder dan ' + str(len(newer)) + ' bestand(en) in src/ ('
                       + os.path.relpath(newer[0], R) + ' …): draai eerst "npm run build:vue".')
js = open(BUNDLE, encoding='utf8').read().strip()
BMK = '<!-- @bundle -->'
assert s.count(BMK) == 1, 'de regel <!-- @bundle --> ontbreekt in het sjabloon'
s = s.replace(BMK, f'<script>\n{js}\n</script>', 1)

# 3. de hash van het Engelse woordenboek, zodat een nieuwe vertaling nooit uit een oude cache komt
h = hashlib.sha1(open(os.path.join(R, 'web', 'i18n-en.js'), 'rb').read().replace(b'\r\n', b'\n')).hexdigest()[:10]
s, n = re.subn(r'i18n-en\.js\?h=@I18N_HASH@', 'i18n-en.js?h=' + h, s)
assert n == 1, 'i18n-en.js?h=@I18N_HASH@ ontbreekt in het sjabloon'

# 4. elk id mag maar één keer in de HTML voorkomen (een dubbel ingevoegde sectie is anders onzichtbaar)
page = s[:s.index('<script>\n' + js[:40])] if js else s
ids = [i for i in re.findall(r'\sid="([^"]+)"', page) if '${' not in i]
dup = sorted({i for i in ids if ids.count(i) > 1})
assert not dup, 'dubbele id in web/index.html: ' + ', '.join(dup)

if CHECK:
    cur = open(HTML, encoding='utf8').read().replace('\r\n', '\n') if os.path.exists(HTML) else ''
    if cur != s:
        a, b = cur.split('\n'), s.split('\n')
        i = next((k for k in range(min(len(a), len(b))) if a[k] != b[k]), min(len(a), len(b)))
        sys.exit(f'web/index.html is niet bijgewerkt (eerste verschil op regel {i+1}); draai "npm run build" en commit het resultaat.')
    print('web/index.html is bijgewerkt:', len(ids), 'ids')
else:
    open(HTML, 'w', encoding='utf8').write(s)
    print('web/index.html geschreven:', len(s), 'tekens,', len(ids), 'ids, geen dubbele')
