"""
Labkit BML - vertaalcontrole voor de Vue-componenten.

tests/i18n_collect.py loopt door de DOM, maar een Vue-boom krijgt `data-notr` omdat Vue die
DOM zelf bezit (zie src/lib/bridge.js). Daar kan die test dus niets vinden. Deze test kijkt
daarom in de bron onder src/ (zowel .js als .vue): elke `t('...')` met een letterlijke tekst
moet een sleutel in i18n/en.json hebben, met getallen als {#} net als in de rest van de app.

Een `t()` met een samengestelde tekst (`t('Kies ' + n + ' cijfers')`) kan hier niet worden
nagekeken; die wordt alleen gemeld zodat je hem zelf kunt controleren. Exitcode 1 als er een
letterlijke tekst zonder vertaling tussen zit.
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'src'
NUM = re.compile(r'\d+(?:[.,]\d+)*')
# t('...') of t("...") zonder aanhalingsteken of backslash erin, en zonder + erachter
LIT = re.compile(r"""(?<![\w$.])t\(\s*(['"])((?:(?!\1)[^\\])*)\1\s*\)""")
# tHtml('...'): de sleutel is de innerHTML zelf, dus < en > blijven staan
LITH = re.compile(r"""(?<![\w$.])tHtml\(\s*(['"])((?:(?!\1)[^\\])*)\1\s*\)""")
# t('...' + iets ...): samengestelde tekst, alleen melden
DYN = re.compile(r"""(?<![\w$.])t\(\s*(['"])((?:(?!\1)[^\\])*)\1\s*\+""")
# {{ t('...') }} in een template telt mee via LIT; i18nHasWords: minstens twee letters
WORDS = re.compile(r'[A-Za-zÀ-ÿ]{2,}')


UNESC = [('&lt;', '<'), ('&gt;', '>'), ('&quot;', '"'), ('&#39;', "'"), ('&amp;', '&')]


def unescape(text):
    """In een Vue-template staat opmaak als &lt;sub&gt;, want anders ziet de compiler er een
    element in. Vue geeft de tekst gedecodeerd door, dus de sleutel hoort ook gedecodeerd te
    zijn. &amp; gaat als laatste, anders decodeert hij de andere entiteiten dubbel."""
    for a, b in UNESC:
        text = text.replace(a, b)
    return text


def key(text):
    """Dezelfde sleutel als i18nKey() in de app: getallen worden {#}."""
    return NUM.sub('{#}', unescape(text))


def has_words(k):
    return bool(WORDS.search(re.sub(r'<[^>]*>|\{[#*]\}|&[a-z]+;', ' ', k)))


def strip_comments(src):
    """Commentaar eruit, anders wordt een voorbeeld in een uitleg als echte tekst gezien."""
    src = re.sub(r'/\*.*?\*/', '', src, flags=re.S)
    return re.sub(r'^\s*//.*$', '', src, flags=re.M)


def main():
    en = json.loads((ROOT / 'i18n' / 'en.json').read_text(encoding='utf8'))
    files = sorted(f for f in [*SRC.rglob('*.js'), *SRC.rglob('*.vue')]
                   if f.name != 'main.js')
    missing, dynamic, total = [], [], 0
    for f in files:
        src = strip_comments(f.read_text(encoding='utf8'))
        for m in LIT.finditer(src):
            text = m.group(2)
            if not has_words(key(text)):
                continue
            total += 1
            k = key(text)
            if k not in en:
                line = src[:m.start()].count('\n') + 1
                missing.append((f.name, line, k))
        for m in LITH.finditer(src):
            text = m.group(2)
            if not has_words(key(text)):
                continue
            total += 1
            k = key(text)
            if k not in en:
                line = src[:m.start()].count('\n') + 1
                missing.append((f.name, line, k))
        for m in DYN.finditer(src):
            line = src[:m.start()].count('\n') + 1
            dynamic.append((f.name, line, m.group(2)))

    if not files:
        # Een controle die niets vindt, is geen groene controle: dan is er iets verplaatst.
        print('GEEN Vue-bronbestanden gevonden in ' + str(SRC) + '; is er iets verhuisd?')
        return 1
    print(f'{len(files)} Vue-bestand(en), {total} letterlijke teksten gecontroleerd')
    for name, line, text in dynamic:
        print(f'  samengesteld (zelf nakijken) {name}:{line}  {text}...')
    for name, line, k in missing:
        print(f'  ZONDER VERTALING {name}:{line}  {k!r}')
    if missing:
        print(f'\n{len(missing)} tekst(en) zonder vertaling in i18n/en.json')
        return 1
    print('\n0 teksten zonder vertaling')
    return 0


if __name__ == '__main__':
    sys.exit(main())
