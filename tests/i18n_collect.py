"""
Labkit BML - vertaalcontrole / translation check.

Doorloopt elke tool (alle keuzelijsten, vinkjes, randwaarden in invoervelden) en
- in de Nederlandse modus (--collect): verzamelt alle teksten die vertaald moeten worden
  en schrijft de ontbrekende naar i18n/missing.json;
- in de Engelse modus (standaard): meldt teksten zonder vertaling (exitcode 1).
"""
import pathlib, sys, json
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / 'web' / 'index.html').as_uri()
EDGE = ['', '0', '-5', 'abc', '1e12']
EXPLORE = r"""
(tool)=>{ const EDGE=['','0','-5','abc','1e12']; window.__i18nRec=true; const sec=document.getElementById('t-'+tool), keys=new Set(); window.__lkLeft=window.__lkLeft||new Set();
  /* Engels: tekst die nog precies een Nederlandse sleutel is (met een andere vertaling) is blijven staan.
     Sinds S271 vertaalt geen observer meer na; elke tekst moet via t()/tHtml()/trPlain() of tStatic(). */
  const left=root=>{ if(LANG!=='en'||!root) return; /* geen Nederlands maar wel een sleutel: 'Na' is natrium (Molmassa) */ const NOTDUTCH=new Set(['Na']);
    const hit=k=>{ const v=I18N_EN[k]; return v!=null&&v!==k&&i18nHasWords(k)&&!NOTDUTCH.has(k); };
    const walk=el=>{ if(el.nodeType!==1||I18N_SKIP.has(el.tagName)||(el.matches('section.tool')&&!el.classList.contains('active'))) return;
      for(const a of ['title','placeholder','aria-label']) if(el.hasAttribute(a)){ const k=i18nKey(i18nEsc(el.getAttribute(a))).key; if(hit(k)) window.__lkLeft.add(a+': '+k); }
      if(i18nIsUnit(el)){ const k=i18nKey(el.innerHTML).key; if(hit(k)){ window.__lkLeft.add(k); return; } }
      for(const n of el.childNodes){ if(n.nodeType===3&&/\S/.test(n.data)){ const k=i18nKey(i18nEsc(n.data.trim())).key; if(hit(k)) window.__lkLeft.add(k); } else if(n.nodeType===1) walk(n); } };
    walk(root); };
  const grab=()=>{ for(const k of i18nCollect(sec)) keys.add(k); if(document.getElementById('upd-bar')) for(const k of i18nCollect(document.getElementById('upd-bar'))) keys.add(k);
    left(document.body); };   /* de hele pagina, behalve tools die niet open staan */
  const fire=el=>{ el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); };
  grab();
  if(tool==='gelfoto'){ ['gf-measall','gf-auto'].forEach(id=>{ try{ document.getElementById(id).click(); grab(); }catch(e){} }); }
  if(tool==='plaat'){ try{ const b=sec.querySelector('[data-pl="tmode"]'); b.click(); grab(); b.click(); grab();
      sec.querySelectorAll('[data-pl="order"]').forEach(o=>{ o.checked=true; o.dispatchEvent(new Event('change',{bubbles:true})); grab(); o.checked=false; o.dispatchEvent(new Event('change',{bubbles:true})); });
      ['tpl','series','rnd'].forEach(n=>{ sec.querySelector('[data-pl="'+n+'"]').click(); const m=document.querySelector('.lk-modal'); if(m){ for(const k of i18nCollect(m)) keys.add(k); m.remove(); } });
      grab(); }catch(e){} }
  sec.querySelectorAll('details').forEach(d=>d.open=true); grab();
  for(const sel of [...sec.querySelectorAll('select')]){ if(sel.id==='ui-lang') continue; const old=sel.value; for(const o of [...sel.options]){ sel.value=o.value; fire(sel); grab();
      if(sel.id==='st-test'){ for(const el of [...sec.querySelectorAll('input:not([type=checkbox]):not([type=file]):not([type=color]),textarea')].filter(e=>e.offsetParent!==null&&!e.classList.contains('txt'))){ const ov=el.value; for(const v of EDGE){ el.value=v; fire(el); grab(); } el.value=ov; fire(el); } } }
    sel.value=old; fire(sel); }
  for(const cb of [...sec.querySelectorAll('input[type=checkbox]')]){ cb.checked=!cb.checked; fire(cb); grab(); cb.checked=!cb.checked; fire(cb); }
  for(const el of [...sec.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=color]):not([type=range]):not([type=search]),textarea')].filter(e=>!e.classList.contains('txt'))){ const ov=el.value; for(const v of EDGE){ el.value=v; fire(el); grab(); } el.value=ov; fire(el); }
  grab(); return [...keys]; }
"""
def main():
    collect = '--collect' in sys.argv
    lang = 'nl' if collect else 'en'
    found = set(); miss = {}
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1400, 'height': 900})
        pg.add_init_script("try{localStorage.clear();localStorage.setItem('labkit:v1:lang','" + lang + "')}catch(e){}")
        pg.goto(URL); pg.wait_for_timeout(800)
        tools = pg.evaluate('TOOLS')
        found.update(pg.evaluate("i18nCollect(document.getElementById('nav'))"))
        cdp = pg.context.new_cdp_session(pg)
        for t in tools:
            pg.goto('about:blank'); pg.goto(URL + '#' + t); pg.wait_for_timeout(500)
            try:
                r = cdp.send('Runtime.evaluate', {'expression': f'({EXPLORE})({json.dumps(t)})', 'timeout': 60000, 'returnByValue': True})
                if 'exceptionDetails' in r: print('!', t, r['exceptionDetails'].get('exception', {}).get('description', '')[:200])
                found.update(r.get('result', {}).get('value') or [])
            except Exception as e:
                print('!', t, str(e)[:120])
            pg.wait_for_timeout(100)
            for k, v in pg.evaluate("[...I18N_MISS.entries()]"): miss.setdefault(k, t)
            if not collect:
                for k in pg.evaluate('[...(window.__lkLeft||[])]'): miss.setdefault('(niet vertaald) '+k, t)
        b.close()
    if collect:
        d = json.loads((ROOT / 'i18n' / 'en.json').read_text(encoding='utf-8')) if (ROOT / 'i18n' / 'en.json').exists() else {}
        todo = sorted(k for k in found if k not in d)
        (ROOT / 'i18n' / 'missing.json').write_text(json.dumps(todo, ensure_ascii=False, indent=0), encoding='utf-8')
        print(f'{len(found)} teksten gevonden, {len(todo)} nog te vertalen -> i18n/missing.json'); return
    for k, t in sorted(miss.items(), key=lambda x: x[1]): print(f'{t:12} {k[:160]}')
    (ROOT / 'i18n' / 'missing.json').write_text(json.dumps(sorted(miss), ensure_ascii=False, indent=0), encoding='utf-8')
    print(f'\n{len(miss)} teksten zonder vertaling'); sys.exit(1 if miss else 0)
if __name__ == '__main__':
    main()
