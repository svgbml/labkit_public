"""Schrijft een gegenereerd bestand in src/generated/ als module voor de bundel (sinds S269).
De namen gaan live op window (src/lib/global.js), want de rest van de code leest ze als
globale namen. Er wordt alleen geschreven als de inhoud verandert: anders lijkt de bundel
verouderd en weigert tools/build_html.py hem."""
import os

R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def write_module(name, script, js, consts=()):
    path = os.path.join(R, 'src', 'generated', name)
    imp = "import {live} from '../lib/global.js';\n" if consts else ''
    foot = ''
    if consts:
        acc = ',\n  '.join(f'{n}: () => {n}' for n in consts)
        foot = f"\n/* alles hierboven ook als globale naam, live (zie src/lib/global.js) */\nlive({{\n  {acc}\n}});\n"
    out = f"/* Gegenereerd: niet met de hand bewerken (zie tools/{script}). */\n{imp}\n{js.rstrip()}\n{foot}"
    old = open(path, encoding='utf8').read() if os.path.exists(path) else None
    if old != out:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        open(path, 'w', encoding='utf8', newline='\n').write(out)
    return os.path.relpath(path, R)
