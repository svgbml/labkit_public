"""
Labkit BML - robuustheidscontrole.

Vult in elke tool elk invoerveld met randgevallen (leeg, 0, negatief, tekst, enorm getal,
decimale punt) en zoekt naar scriptfouten en naar NaN, undefined, Infinity of null in de uitvoer.
Gebruik: python tests/robust_audit.py   (exitcode 1 bij problemen)
"""
import pathlib, sys
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / 'web' / 'index.html').as_uri()
EDGE = ['', '0', '-5', 'abc', '1e12', '1e-12', '0.5', '1.234,5', ' 7 ', '999999999', '1 2 3', '<b>x</b>']
COUNT = r"""(tool)=>{ const sec=document.getElementById('t-'+tool); window.__els=[...sec.querySelectorAll('input:not([type=file]):not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]):not([type=search]),textarea')].filter(e=>!e.readOnly&&e.offsetParent!==null&&!e.classList.contains('txt')&&!e.closest('#gf-lanes')); return window.__els.length; }"""
STEP = r"""(()=>{ const el=window.__els[%d], val=%s, sec=document.getElementById('t-%s'); if(!el||!el.isConnected) return ''; const old=el.value; el.value=val; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true}));
  const t=sec.innerText, m=t.match(/[^\n]{0,40}\b(NaN|undefined|Infinity|null|\[object Object\])\b[^\n]{0,20}/); const id=(el.id||Object.keys(el.dataset)[0]||el.tagName);
  el.value=old; el.dispatchEvent(new Event('input',{bubbles:true})); return m?id+'="'+val+'" → "'+m[0].trim()+'"':''; })()"""
import json
def main():
    issues = []
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1400, 'height': 900})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        cdp = pg.context.new_cdp_session(pg)
        def boot(t, st):
            pg.goto('about:blank'); pg.goto(URL + '#' + t); pg.wait_for_timeout(700)
            if st: pg.evaluate(f"(()=>{{const e=document.getElementById('st-test'); e.value='{st}'; e.dispatchEvent(new Event('change',{{bubbles:true}})); }})()"); pg.wait_for_timeout(300)
            return pg.evaluate(COUNT, t)
        pg.goto(URL); pg.wait_for_timeout(900)
        tools = pg.evaluate("TOOLS")
        states = {'stat': ['desc','t1','t2','tp','wil','anova','kw','anova2','reg','power','chi']}
        for t in tools:
            for st in states.get(t, [None]):
                name = t + (f'[{st}]' if st else ''); n = boot(t, st)
                for k in range(n):
                    for v in EDGE:
                        n0 = len(errs)
                        try: r = cdp.send('Runtime.evaluate', {'expression': STEP % (k, json.dumps(v), t), 'timeout': 6000, 'returnByValue': True})
                        except Exception as ex:
                            r = {'exceptionDetails': {'text': 'langer dan 6 s'}}
                        if 'exceptionDetails' in r:
                            txt = r['exceptionDetails'].get('exception', {}).get('description', '') or r['exceptionDetails'].get('text', '')
                            issues.append((name, f'veld {k} ({pg.evaluate("(k)=>{const e=window.__els&&window.__els[k]; return e?(e.id||Object.keys(e.dataset)[0]||e.tagName):String(k)}", k) if False else k}) met "{v}": hangt of fout ({txt[:90]})')); print(name, issues[-1][1], flush=True); boot(t, st)
                        elif r['result'].get('value'): issues.append((name, r['result']['value'])); print(name, issues[-1][1], flush=True)
                        for e in errs[n0:]: issues.append((name, f'scriptfout bij "{v}": {e[:140]}'))
        b.close()
    seen = []
    for i in issues:
        if i not in seen: seen.append(i)
    for t, x in seen: print(f'{t:16} {x}', flush=True)
    print(f'\n{len(seen)} problemen'); sys.exit(1 if seen else 0)
if __name__ == '__main__':
    main()
