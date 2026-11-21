"""
Labkit BML - fasecontrole / stage check.

Controleert dat elke tool uit const TOOLS in minstens één fase staat
(STAGES in src/legacy/nt/99y_stage.js) en dat er geen onbekende ids of fasecodes in staan.
Gebruik: python tests/stages_check.py   (exitcode 1 bij problemen)
"""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
HTML = (ROOT / 'src' / 'legacy' / 'core.js').read_text(encoding='utf8')   # TOOLS (sinds S269)
JS = (ROOT / 'src' / 'legacy' / 'nt' / '99y_stage.js').read_text(encoding='utf8')

tools = [x.strip().strip("'") for x in re.search(r"const TOOLS=\[(.*?)\];", HTML).group(1).split(',')]
none = [x.strip().strip("'") for x in re.search(r"const STAGE_NONE=\[(.*?)\];", JS).group(1).split(',')]
codes = {c for c, _ in re.findall(r"\['(\w)','([^']+)'\]", re.search(r"const STAGE_DEF=\[(.*?)\];", JS).group(1))}
body = re.search(r"const STAGES=\{(.*?)\n\};", JS, re.S).group(1)
stages = {m.group(1): m.group(2) for m in re.finditer(r"(\w+):'([vua]*)'", body)}

issues = []
for t in tools:
    if t in none:
        continue
    if not stages.get(t):
        issues.append(f'tool zonder fase: {t}')
for t, v in stages.items():
    if t not in tools:
        issues.append(f'onbekende tool in STAGES: {t}')
    if t in none:
        issues.append(f'{t} hoort bij geen fase maar staat in STAGES')
    bad = sorted(set(v) - codes)
    if bad:
        issues.append(f'{t}: onbekende fasecode(s) {"".join(bad)}')
    if len(set(v)) != len(v):
        issues.append(f'{t}: dubbele fasecode in "{v}"')

for i in issues:
    print('  ' + i)
print(f'{len(tools) - len(none)} tools met een fase gecontroleerd, {len(issues)} probleem(en)')
sys.exit(1 if issues else 0)
