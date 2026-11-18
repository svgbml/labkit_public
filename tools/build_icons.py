"""Bouwt tools/nt/99ya_icon.js uit de pictogrammen in tools/icons/.
Gebruik: python tools/build_icons.py [deel1|alles]
deel1 = alleen de pictogrammen van de 45 tools uit S7.

De pictogrammen worden als CSS-masker op ::before gezet, niet als <svg> in de link.
Reden: de vertaallaag leest de innerHTML van een link als een geheel ("sleutel"); een
extra element daarin breekt die sleutels. Een pseudo-element staat niet in de DOM en
raakt de vertaling dus niet. De kleur komt uit currentColor, dus elk thema werkt.
"""
import json
import pathlib
import re
import sys
from urllib.parse import quote

ROOT = pathlib.Path(__file__).resolve().parent.parent
S = ROOT / 'tools' / 'icons'
MODE = sys.argv[1] if len(sys.argv) > 1 else 'alles'

DEEL1 = ['start', 'verdunning', 'oplossing', 'units', 'molm', 'hh', 'osmo', 'titr', 'kjel',
         'curve', 'enzym', 'spec', 'reeks', 'groei', 'inoc', 'telkamer', 'teller', 'seed',
         'micro', 'gcomp', 'mic', 'dna', 'oligo', 'pcr', 'pcrcyclus', 'qpcr', 'melt', 'gel',
         'gelfoto', 'sds', 'wb', 'ligatie', 'transf', 'rmp', 'stat', 'pverd', 'ppip', 'pprog',
         'centrifuge', 'timers', 'plaat', 'plan', 'report', 'inst']
assert len(DEEL1) == 44, len(DEEL1)

glyphs = {}
for f in ('basis.json', 'deel1.json', 'deel2.json'):
    p = S / f
    if p.exists():
        glyphs.update(json.loads(p.read_text(encoding='utf8')))

tmap = json.loads((S / 'tools.json').read_text(encoding='utf8'))
if MODE == 'deel1':
    tmap = {k: v for k, v in tmap.items() if k in DEEL1}

HTML = (ROOT / 'web' / 'index.html').read_text(encoding='utf8')
tools = [x.strip().strip("'") for x in re.search(r"const TOOLS=\[(.*?)\];", HTML).group(1).split(',')]

missing = sorted({v for v in tmap.values() if v not in glyphs})
assert not missing, 'pictogram ontbreekt: ' + ', '.join(missing)
unknown = [k for k in tmap if k not in tools]
assert not unknown, 'onbekende tool: ' + ', '.join(unknown)
if MODE != 'deel1':
    without = [t for t in tools if t not in tmap]
    assert not without, 'tool zonder pictogram: ' + ', '.join(without)

for k, v in glyphs.items():
    assert '<svg' not in v and '<g ' not in v and '<text' not in v, k

ATTR = ('xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000" '
        'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"')


def uri(markup):
    # in een masker telt alleen de vorm, dus alle inkt is gewoon zwart
    m = markup.replace('fill="currentColor"', 'fill="#000"')
    return "url('data:image/svg+xml," + quote('<svg %s>%s</svg>' % (ATTR, m), safe="/:= ") + "')"


def sel(i):
    return '#nav > a[href="#%s"]::before,.tl a[href="#%s"]::before' % (i, i)


rules = [
    ','.join(sel(i) for i in tmap) +
    '{content:"";width:16px;height:16px;flex:none;background:currentColor;'
    '-webkit-mask:center/contain no-repeat;mask:center/contain no-repeat;opacity:.7}',
    ','.join('.tl a[href="#%s"]::before' % i for i in tmap) + '{float:left;margin:3px 8px 0 0}',
]
for i, g in tmap.items():
    u = uri(glyphs[g])
    rules.append(sel(i) + '{-webkit-mask-image:%s;mask-image:%s}' % (u, u))

css = '\n'.join(rules)
q = "'" + css.replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n') + "'"

js = """/* ================= PICTOGRAM PER TOOL =================
   Elk pictogram is een lijntekening van 24x24 die als CSS-masker op ::before van de
   navigatielink en van de tegel op de startpagina staat. Een pseudo-element staat niet
   in de DOM, dus de vertaallaag (die de innerHTML van een link als sleutel leest) blijft
   onaangeroerd; de kleur komt uit currentColor, dus alle thema's werken.
   Gegenereerd uit de pictogrammen van S7/S8: %d tools, %d vormen. */
{ const st=document.createElement('style'); st.id='lk-ico'; st.textContent=%s; document.head.appendChild(st); }
""" % (len(tmap), len(set(tmap.values())), q)

(ROOT / 'tools' / 'nt' / '99ya_icon.js').write_text(js, encoding='utf8')
(ROOT / 'tools' / 'nt' / '99ya_icon.json').write_text('{"id":"icon","lib":true}\n', encoding='utf8')
print('%d vormen, %d tools met een pictogram, %d tekens CSS' % (len(set(tmap.values())), len(tmap), len(css)))
