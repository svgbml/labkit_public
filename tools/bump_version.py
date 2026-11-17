"""Zet het versienummer op alle plekken tegelijk: package.json, APPVER in web/index.html, CACHE in web/sw.js,
src-tauri/tauri.conf.json en src-tauri/Cargo.toml. Vergeet je sw.js, dan blijven geïnstalleerde web-apps de oude cache gebruiken.
Gebruik: python tools/bump_version.py 1.19.0   (zonder argument: toont de huidige versies)"""
import os, re, sys

R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLACES = [
    ('package.json',              r'("version":\s*")([\d.]+)(")'),
    ('web/index.html',            r"(const APPVER=')([\d.]+)(')"),
    ('web/sw.js',                 r"(const CACHE = 'labkit-v)([\d.]+)(')"),
    ('src-tauri/tauri.conf.json', r'("version":\s*")([\d.]+)(")'),
    ('src-tauri/Cargo.toml',      r'(^version\s*=\s*")([\d.]+)(")'),
]

def main():
    new = sys.argv[1] if len(sys.argv) > 1 else None
    if new and not re.fullmatch(r'\d+\.\d+\.\d+', new):
        sys.exit('Versie moet de vorm x.y.z hebben, bijvoorbeeld 1.19.0')
    for rel, pat in PLACES:
        p = os.path.join(R, rel); s = open(p, encoding='utf8').read()
        m = re.search(pat, s, flags=re.M)
        if not m:
            sys.exit(f'Versie niet gevonden in {rel}')
        if new:
            s = s[:m.start()] + m.group(1) + new + m.group(3) + s[m.end():]
            open(p, 'w', encoding='utf8').write(s)
        print(f'{rel:28} {m.group(2)}' + (f' -> {new}' if new else ''))

if __name__ == '__main__':
    main()
