"""Maakt tools/nt/98_valid.js uit tests/VALIDATIE.md: per tool het aantal controles en hoeveel er binnen tolerantie zijn.
De app toont dat als badge 'Gevalideerd' in de kop van de tool. Draai daarna tools/insert_tools.py.
Toolnamen in VALIDATIE.md worden gekoppeld aan de naam in de navigatie of de titel (h2) van de tool."""
import html, json, os, re, sys

R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
s = open(os.path.join(R, 'web', 'index.html'), encoding='utf8').read()
md = open(os.path.join(R, 'tests', 'VALIDATIE.md'), encoding='utf8').read()

def norm(t):
    t = html.unescape(re.sub(r'<[^>]+>', '', t))
    return re.sub(r'\s+', ' ', t).strip().lower()

names = {}
for m in re.finditer(r'<a href="#(\w+)"[^>]*><span class="k">.*?</span>(.*?)</a>', s):
    names[norm(m.group(2))] = m.group(1)
for m in re.finditer(r'<section class="tool" id="t-(\w+)".*?<h2>(.*?)</h2>', s, flags=re.S):
    names.setdefault(norm(m.group(2)), m.group(1))

out, unknown = {}, set()
for line in md.splitlines():
    if not line.startswith('| ') or line.startswith('| Tool') or line.startswith('|---'):
        continue
    cells = [c.strip() for c in line.strip('|').split('|')]
    if len(cells) < 7:
        continue
    key = norm(cells[0])
    tid = names.get(key)
    if not tid:  # korte naam in het rapport, bijvoorbeeld 'Kjeldahl' voor 'Kjeldahl (eiwit uit stikstof)'
        hits = {v for k, v in names.items() if re.match(re.escape(key) + r'\b', k)}
        tid = hits.pop() if len(hits) == 1 else None
    if tid in ('inst', 'start') or key.startswith('qr-code'):
        tid = None
    if not tid:
        unknown.add(cells[0]); continue
    n, ok = out.get(tid, (0, 0))
    out[tid] = (n + 1, ok + (1 if '✅' in cells[6] else 0))

js = '/* gegenereerd door tools/build_validated.py uit tests/VALIDATIE.md; niet met de hand bewerken */\nconst VALIDATED=' + \
     json.dumps({k: list(v) for k, v in sorted(out.items())}, separators=(',', ':')) + ';'
nt = os.path.join(R, 'tools', 'nt')
open(os.path.join(nt, '98_valid.js'), 'w', encoding='utf8').write(js + '\n')
open(os.path.join(nt, '98_valid.json'), 'w', encoding='utf8').write('{"id":"valid","lib":true}\n')
print(len(out), 'tools met validatie,', sum(v[0] for v in out.values()), 'controles')
if unknown:
    sys.stdout.reconfigure(encoding='utf8')
    print('Niet gekoppeld (naam onbekend):', ', '.join(sorted(unknown)))
