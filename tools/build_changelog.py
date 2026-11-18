"""Zet CHANGELOG.md om in tools/nt/97_news.js, de bron voor het paneel "Wat is er nieuw".
Gebruik: python tools/build_changelog.py   (daarna tools/insert_tools.py)

Een kopje `## <versie> - <datum>` wordt een blok; regels die met `- ` beginnen worden de punten.
Het kopje "Nog niet uitgebracht" krijgt geen versienummer en wordt alleen getoond in de
volledige lijst, niet in het paneel na een update.
"""
import os
import re

R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(R, 'CHANGELOG.md')
OUT = os.path.join(R, 'tools', 'nt', '97_news.js')

blocks = []
cur = None
for line in open(SRC, encoding='utf8').read().splitlines():
    m = re.match(r'##\s+(.+?)\s*$', line)
    if m:
        head = m.group(1)
        p = re.match(r'^(\d+(?:\.\d+)*)\s*[—-]\s*(\d{4}-\d{2}-\d{2})\s*$', head)
        cur = {'v': p.group(1), 'd': p.group(2), 'items': []} if p else {'v': '', 'd': '', 't': head, 'items': []}
        blocks.append(cur)
        continue
    m = re.match(r'-\s+(.+?)\s*$', line)
    if m and cur is not None:
        cur['items'].append(m.group(1))

blocks = [b for b in blocks if b['items']]
assert blocks, 'geen versies gevonden in CHANGELOG.md'
for b in blocks:
    for it in b['items']:
        assert '<' not in it and '`' not in it, 'geen opmaak in een regel: ' + it[:60]


def q(s):
    return "'" + s.replace('\\', '\\\\').replace("'", "\\'") + "'"


rows = []
for b in blocks:
    items = ','.join(q(i) for i in b['items'])
    rows.append('  {v:%s,d:%s%s,items:[%s]}' % (q(b['v']), q(b['d']),
                                                ',t:' + q(b['t']) if b.get('t') else '', items))

js = ("/* ================= WAT IS ER NIEUW =================\n"
      "   Gegenereerd door tools/build_changelog.py uit CHANGELOG.md; niet met de hand bewerken.\n"
      "   Een blok zonder versienummer (v:'') is nog niet uitgebracht en verschijnt alleen in\n"
      "   de volledige lijst. */\nconst NEWS=[\n" + ',\n'.join(rows) + '\n];\n')
open(OUT, 'w', encoding='utf8', newline='\n').write(js)
open(OUT[:-3] + '.json', 'w', encoding='utf8', newline='\n').write('{"id":"news","lib":true}\n')
print('%d versies, %d regels -> %s' % (len(blocks), sum(len(b['items']) for b in blocks),
                                       os.path.basename(OUT)))
