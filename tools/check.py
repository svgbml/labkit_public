"""Alles in één keer: bouwen en alle controles draaien, zoals de validatie-workflow op GitHub.
Gebruik:
  python tools/check.py           bouwen + alle tests (Nederlands en Engels)
  python tools/check.py --quick   alleen bouwen + opstarttijd en vertaling (snel, voor tussendoor)
Vereist: pip install playwright==1.48.0 scipy statsmodels scikit-posthocs opencv-python-headless numpy
         python -m playwright install chromium"""
import os, subprocess, sys, time

R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PY = sys.executable
BUILD = [['tools/build.py']]
UNIT = ['node', '--no-warnings', '--import', './tests/unit/setup.mjs', '--test', 'tests/unit/*.test.mjs']  # rekenfuncties, geen browser
QUICK = [UNIT, ['tests/stages_check.py'], ['tests/src_check.py'], ['tests/contrast_check.py'], ['tests/i18n_vue.py'], ['tests/paste_check.py'], ['tests/ncbi_check.py'], ['tests/perf_budget.py'], ['tests/i18n_collect.py']]
FULL = [UNIT, ['tests/stages_check.py'], ['tests/src_check.py'], ['tests/contrast_check.py'], ['tests/i18n_vue.py'], ['tests/paste_check.py'], ['tests/ncbi_check.py'], ['tests/validate.py'], ['tests/layout_audit.py'], ['tests/robust_audit.py'], ['tests/sync_check.py'], ['tests/i18n_collect.py'],
        ['tests/perf_budget.py'], ('en', ['tests/layout_audit.py']), ['tests/visual_check.py']]

def step(args, lang=None):
    env = dict(os.environ, PYTHONIOENCODING='utf8')
    if lang: env['LABKIT_LANG'] = lang
    name = ' '.join(args) + (f' (LABKIT_LANG={lang})' if lang else '')
    print(f'\n=== {name}', flush=True); t = time.time()
    ok = subprocess.run(args if args[0] == 'node' else [PY] + args, cwd=R, env=env).returncode == 0
    print(f'--- {"OK" if ok else "MISLUKT"} in {time.time() - t:.0f} s', flush=True)
    return name, ok

def main():
    try: sys.stdout.reconfigure(encoding='utf8')  # ✓/✗ ook als de uitvoer naar een pipe gaat (Windows: cp1252)
    except Exception: pass
    results = [step(a) for a in BUILD]
    if not all(ok for _, ok in results):
        sys.exit('Bouwen mislukt; tests niet gestart.')
    for t in (QUICK if '--quick' in sys.argv else FULL):
        results.append(step(t[1], t[0]) if isinstance(t, tuple) else step(t))
    print('\nSamenvatting:')
    for name, ok in results: print(f'  {"✓" if ok else "✗"} {name}')
    sys.exit(0 if all(ok for _, ok in results) else 1)

if __name__ == '__main__':
    main()
