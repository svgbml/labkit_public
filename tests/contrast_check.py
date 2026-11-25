"""
Labkit BML - contrast van alle thema's (S140, #282).

Leest de kleurvariabelen uit src/shell/styles/app.css (:root en elk html[data-theme=…]-blok, plus de
donkere kamer) en rekent de contrastverhouding van WCAG 2.2 (1.4.3, AA: 4,5 : 1 voor gewone tekst)
uit voor de paren waarin de app tekst zet: tekst en grijze tekst op achtergrond en kaart, de accentkleur
(links, knoppen) op de kaart en op zijn zachte tint, en ok/warn/bad op hun zachte tint (de meldingen).
Geen browser nodig. Exitcode 1 als een paar onder de grens zit.
Gebruik: python tests/contrast_check.py
"""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
CSS = (ROOT / 'src' / 'shell' / 'styles' / 'app.css').read_text(encoding='utf-8')
AA = 4.5
PAIRS = [('ink', 'bg'), ('ink', 'surface'), ('muted', 'bg'), ('muted', 'surface'), ('accent', 'surface'), ('accent', 'accent-soft'),
         ('ok', 'ok-soft'), ('warn', 'warn-soft'), ('bad', 'bad-soft'), ('ok', 'surface'), ('warn', 'surface'), ('bad', 'surface'),
         ('stv', 'stv-soft'), ('stu', 'stu-soft'), ('sta', 'sta-soft')]


def block_vars(selector):
    """alle --naam:#kleur uit de blokken met precies deze selector, in volgorde (latere winnen)"""
    out = {}
    for m in re.finditer(r'(?:^|\n|\})\s*' + re.escape(selector) + r'\s*\{([^}]*)\}', CSS):
        for k, v in re.findall(r'--([\w-]+)\s*:\s*(#[0-9a-fA-F]{3,6})\b', m.group(1)):
            out[k] = v
    return out


def lum(hexc):
    h = hexc.lstrip('#')
    if len(h) == 3: h = ''.join(c * 2 for c in h)
    def ch(c):
        c = int(c, 16) / 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (ch(h[i:i + 2]) for i in (0, 2, 4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def ratio(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def main():
    try: sys.stdout.reconfigure(encoding='utf8')
    except Exception: pass
    base = block_vars(':root')
    themes = {'licht': base}
    for t in sorted(set(re.findall(r'html\[data-theme=(\w+)\]\s*\{', CSS))):
        themes[t] = {**base, **block_vars(f'html[data-theme={t}]')}
    themes['donkere kamer'] = {**base, **block_vars('html.darkroom')}
    bad = 0
    for name, v in themes.items():
        low = [(f, b, ratio(v[f], v[b])) for f, b in PAIRS if f in v and b in v and ratio(v[f], v[b]) < AA]
        worst = min((ratio(v[f], v[b]), f, b) for f, b in PAIRS if f in v and b in v)
        print(f"{'FOUT' if low else 'ok  '} {name:14} laagste {worst[0]:.2f} : 1 ({worst[1]} op {worst[2]})")
        for f, b, r in low:
            print(f'     --{f} {v[f]} op --{b} {v[b]}: {r:.2f} : 1 (AA {AA})')
        bad += len(low)
    print(f'\n{len(themes)} thema\'s, {bad} paar/paren onder {AA} : 1')
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
