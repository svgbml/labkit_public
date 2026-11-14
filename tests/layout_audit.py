"""
Labkit BML - layoutcontrole.

Opent elke tool op drie schermbreedtes en zoekt naar:
- tekst die uit zijn element loopt (knoppen, chips, labels, cellen, putjes),
- elementen die over elkaar heen vallen binnen een paneel,
- horizontaal scrollen van de hele pagina,
- tekst in canvas-afbeeldingen die buiten beeld valt of andere tekst overlapt.
Gebruik: python tests/layout_audit.py   (exitcode 1 bij problemen)
"""
import os, pathlib, sys, json
from playwright.sync_api import sync_playwright
# Optioneel ander lettertype (LABKIT_FONT) om CI-lettertypen na te bootsen
FONTJS = """document.addEventListener('DOMContentLoaded',()=>{ const st=document.createElement('style'); st.textContent=":root,html[data-theme]{--font-ui:'%s' !important} body,input,button,select,textarea{font-family:'%s' !important}"; document.head.appendChild(st); });"""
ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / 'web' / 'index.html').as_uri()

PATCH = r"""
(()=>{ const P=CanvasRenderingContext2D.prototype, orig=P.fillText; window.__ct=new Map();
  P.fillText=function(t,x,y,mw){ try{ const cv=this.canvas; if(!window.__ct.has(cv)) window.__ct.set(cv,[]); const m=this.measureText(String(t)); const T=this.getTransform();
    const fs=parseFloat((this.font.match(/(\d+(?:\.\d+)?)px/)||[0,10])[1]); let w=m.width, x0=x; const al=this.textAlign; if(al==='center') x0=x-w/2; else if(al==='right'||al==='end') x0=x-w;
    const bl=this.textBaseline; let y0=bl==='middle'?y-fs*0.5:bl==='top'||bl==='hanging'?y:y-fs*0.8;
    const rot=Math.abs(T.b)>1e-6||Math.abs(T.c)>1e-6; const s=T.a; window.__ct.get(cv).push({t:String(t),x:T.a*x0+T.e,y:T.d*y0+T.f,w:w*s,h:fs*s,rot}); }catch(e){} return orig.apply(this,arguments); };
  const oc=HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext=function(){ const c=oc.apply(this,arguments); return c; };
  const ow=Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype,'width').set; Object.defineProperty(HTMLCanvasElement.prototype,'width',{set(v){ if(window.__ct) window.__ct.delete(this); ow.call(this,v); },get(){ return Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype,'width')?this.getAttribute('width')|0:0; },configurable:true}); })();
"""
# simpler: reset the record when a canvas is resized via its width attribute property; use defineProperty with original getter
PATCH = PATCH.replace("get(){ return Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype,'width')?this.getAttribute('width')|0:0; }", "get(){ return __gw.call(this); }")
PATCH = "window.__gw=Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype,'width').get;" + PATCH

AUDIT = r"""
(tool)=>{ const sec=document.getElementById('t-'+tool), out=[]; const vis=e=>{ const r=e.getBoundingClientRect(); const cs=getComputedStyle(e); return r.width>0&&r.height>0&&cs.visibility!=='hidden'&&cs.display!=='none'; };
  const name=e=>{ const t=(e.textContent||e.value||e.id||e.tagName).trim().replace(/\s+/g,' ').slice(0,40); return `${e.tagName.toLowerCase()}${e.id?'#'+e.id:''}${e.className&&typeof e.className==='string'?'.'+e.className.split(' ')[0]:''} "${t}"`; };
  /* 1. tekstoverloop */
  sec.querySelectorAll('button,.chip,label,th,.well,.kv dt,.kv dd,.big,h2,h3,.lbl,.cbtn,.grp,.u,summary').forEach(e=>{ if(!vis(e)||e.closest('.tbl-wrap')&&e.matches('td,th')) return; const cs=getComputedStyle(e); if(cs.overflow!=='visible'&&e.matches('.well')===false) return;
    if(e.scrollWidth>e.clientWidth+2||(e.matches('.well')&&e.scrollHeight>e.clientHeight+2)) out.push(['overloop',name(e),`${e.scrollWidth}>${e.clientWidth}`]); });
  /* inputs smaller than their content placeholder? skip; check select text clipped */
  /* 2. overlap binnen panelen */
  sec.querySelectorAll('.panel,.result').forEach(pn=>{ if(!vis(pn)) return; const els=[...pn.querySelectorAll('label,input:not([type=hidden]),select,textarea,button,canvas,h3,.chip,.big,table')].filter(e=>vis(e)&&!e.closest('table')||e.tagName==='TABLE'&&vis(e)).filter(e=>!(e.tagName==='INPUT'&&e.type==='file'&&false));
    const clipR=e=>{ let r=e.getBoundingClientRect(), a=e.parentElement; let R={left:r.left,top:r.top,right:r.right,bottom:r.bottom}; while(a&&a!==pn){ const cs=getComputedStyle(a); if(cs.overflowX!=='visible'||cs.overflowY!=='visible'){ const q=a.getBoundingClientRect(); R={left:Math.max(R.left,q.left),top:Math.max(R.top,q.top),right:Math.min(R.right,q.right),bottom:Math.min(R.bottom,q.bottom)}; } a=a.parentElement; } return R; }; const R=els.map(clipR);
    for(let i=0;i<els.length;i++) for(let j=i+1;j<els.length;j++){ const a=els[i],b=els[j]; if(a.contains(b)||b.contains(a)) continue; if(a.tagName==='LABEL'&&(a.control===b||a.contains(b))) continue; if(b.tagName==='LABEL'&&(b.control===a)) continue;
      const A=R[i],B=R[j]; const ox=Math.min(A.right,B.right)-Math.max(A.left,B.left), oy=Math.min(A.bottom,B.bottom)-Math.max(A.top,B.top); if(ox>2&&oy>2) out.push(['overlap',name(a),name(b)]); } });
  /* 3. paginabreedte */
  if(document.documentElement.scrollWidth>innerWidth+2){ const wide=[...sec.querySelectorAll('*')].filter(e=>{ if(!vis(e)) return false; let a=e.parentElement; while(a&&a!==sec){ const cs=getComputedStyle(a); if(cs.overflowX!=='visible') return false; a=a.parentElement; } return e.getBoundingClientRect().right>innerWidth+2&&![...e.children].some(c=>c.getBoundingClientRect().right>innerWidth+2); }).slice(0,3).map(name).join(' | '); out.push(['pagina',`scrollWidth ${document.documentElement.scrollWidth} > ${innerWidth}`,wide]); }
  /* 4. canvas-tekst */
  sec.querySelectorAll('canvas').forEach(cv=>{ if(!vis(cv)||cv.id==='gf-cv') return; const L=(window.__ct&&window.__ct.get(cv))||[]; const W=cv.width, H=cv.height;
    L.forEach(t=>{ if(t.rot||!t.t.trim()) return; if(t.x<-1||t.x+t.w>W+1||t.y<-1||t.y+t.h>H+1) out.push(['canvas buiten beeld','#'+(cv.id||'?'),`"${t.t.slice(0,30)}"`]); });
    const T=L.filter(t=>!t.rot&&t.t.trim()); for(let i=0;i<T.length;i++) for(let j=i+1;j<T.length;j++){ const a=T[i],b=T[j]; const ox=Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x), oy=Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y); if(ox>Math.min(a.h,b.h)*0.25&&oy>Math.min(a.h,b.h)*0.35) out.push(['canvas overlap','#'+(cv.id||'?'),`"${a.t.slice(0,20)}" × "${b.t.slice(0,20)}"`]); } });
  return out; }
"""

def main():
    issues = []
    with sync_playwright() as p:
        b = p.chromium.launch()
        for W, H in [(1440, 900), (1024, 800), (390, 844)]:
            pg = b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1)
            pg.add_init_script("try{localStorage.setItem('labkit:v1:lang','"+__import__('os').environ.get('LABKIT_LANG','nl')+"')}catch(e){}")
            pg.add_init_script(PATCH)
            if os.environ.get('LABKIT_FONT'): pg.add_init_script(FONTJS % (os.environ['LABKIT_FONT'], os.environ['LABKIT_FONT']))
            errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.goto(URL); pg.wait_for_timeout(900)
            tools = pg.evaluate("TOOLS")
            extra = {'stat': ['desc','t2','anova','kw','anova2','reg','power','chi']}
            for t in tools:
                pg.evaluate(f"location.hash='{t}'"); pg.wait_for_timeout(450)
                if t == 'plaat':
                    pg.evaluate("wText={A4:'ASP25% onverdund',B4:'Monster 12 verdund 1:100',C1:'Supercalifragilistic',H12:'NTC'}; renderPlate();"); pg.wait_for_timeout(200)
                states = extra.get(t, [None])
                for st in states:
                    if st:
                        pg.evaluate(f"(()=>{{const e=document.getElementById('st-test'); e.value='{st}'; e.dispatchEvent(new Event('change',{{bubbles:true}})); }})()"); pg.wait_for_timeout(1800 if st in ('power','anova') else 400)
                    for kind, a, bb in pg.evaluate(AUDIT, t):
                        issues.append((W, t + (f'[{st}]' if st else ''), kind, a, bb))
            for e in errs: issues.append((W, '-', 'paginafout', e, ''))
            pg.close()
        b.close()
    seen = set()
    for W, t, k, a, bb in issues:
        key = (W, t, k, a, bb)
        if key in seen: continue
        seen.add(key); print(f'{W:5} {t:14} {k:20} {a} {bb}')
    print(f'\n{len(seen)} problemen'); sys.exit(1 if seen else 0)

if __name__ == '__main__':
    main()
