"""
Labkit BML - bronregelcontrole / source citation check.

Controleert dat elke rekentool in src/shell/sections/<id>.html precies één gevulde <p class="src">
heeft, en dat een tool zonder berekening (NOCALC) er juist geen heeft (anders is de lijst verouderd).
Geen browser nodig. Gebruik: python tests/src_check.py   (exitcode 1 bij problemen)
"""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
CORE = (ROOT / 'src' / 'legacy' / 'core.js').read_text(encoding='utf8')   # TOOLS
tools = [x.strip().strip("'") for x in re.search(r"const TOOLS=\[(.*?)\];", CORE).group(1).split(',')]

NOCALC = {
    'start': 'startpagina',
    'inst': 'instellingen',
    'report': 'bundelt andere tools',
    'timers': 'geen formule',
    'teller': 'alleen turven',
    'plan': 'planning, geen formule',
    'plaat': 'plaatindeling tekenen',
    'pprog': 'alleen tekenen',
}

issues = []
for t in tools:
    html = (ROOT / 'src' / 'shell' / 'sections' / f'{t}.html').read_text(encoding='utf8')
    srcs = re.findall(r'<p class="src">(.*?)</p>', html, re.S)
    full = [s for s in srcs if s.strip()]
    if t in NOCALC:
        if srcs: issues.append(f'{t}: staat in NOCALC maar heeft een p.src')
    elif len(srcs) != 1 or not full:
        issues.append(f'{t}: {len(srcs)} p.src, verwacht precies één gevulde')
for t in NOCALC:
    if t not in tools: issues.append(f'{t}: staat in NOCALC maar niet in TOOLS')

if issues:
    print('Bronregelcontrole mislukt:'); [print('  ' + i) for i in issues]; sys.exit(1)
print(f'Bronregels OK: {len(tools) - len(NOCALC)} tools met één p.src, {len(NOCALC)} zonder berekening.')
