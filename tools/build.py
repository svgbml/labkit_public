"""Bouwt web/index.html (sinds S265 een gegenereerd bestand; bewerk het nooit met de hand).
Gebruik:
  npm run build                 Vite-bundel + dit script (na een wijziging in src/)
  python tools/build.py         alleen dit script (bundel ongewijzigd)
  python tools/build.py --check niets schrijven; faalt als web/index.html niet bij de bronnen past (CI)
Volgorde: tools/build_validated.py (tests/VALIDATIE.md -> src/generated/valid.js),
tools/build_i18n.py (i18n/en.json -> web/i18n-en.js + hash in web/sw.js),
tools/build_html.py (src/shell/index.html + build/app.bundle.js -> web/index.html).
Let op: valid.js zit in de bundel. Verandert hij, draai dan `npm run build` (dat bouwt de bundel opnieuw)."""
import os, subprocess, sys

R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PY = sys.executable

def run(*args):
    if subprocess.run([PY, *args], cwd=R).returncode != 0:
        sys.exit(f'mislukt: {" ".join(args)}')

if '--check' in sys.argv:
    run('tools/build_html.py', '--check')
else:
    run('tools/build_validated.py')
    run('tools/build_i18n.py')
    run('tools/build_html.py')
