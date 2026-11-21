"""Bouwt web/index.html (sinds S265 een gegenereerd bestand; bewerk het nooit met de hand).
Gebruik:
  npm run build                 Vite-bundel + dit script (na een wijziging in src/)
  python tools/build.py         alleen dit script (bundel ongewijzigd)
  python tools/build.py --check niets schrijven; faalt als web/index.html niet bij de bronnen past (CI)
Volgorde: tools/build_validated.py (tests/VALIDATIE.md -> tools/nt/98_valid.js),
tools/build_i18n.py (i18n/en.json -> web/i18n-en.js + hash in web/sw.js),
tools/insert_tools.py (src/shell/index.html + tools/nt/ + build/app.bundle.js -> web/index.html)."""
import os, subprocess, sys

R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PY = sys.executable

def run(*args):
    if subprocess.run([PY, *args], cwd=R).returncode != 0:
        sys.exit(f'mislukt: {" ".join(args)}')

if '--check' in sys.argv:
    run('tools/insert_tools.py', '--check')
else:
    run('tools/build_validated.py')
    run('tools/build_i18n.py')
    run('tools/insert_tools.py')
