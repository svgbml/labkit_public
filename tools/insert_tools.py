"""Voegt tool-modules uit tools/nt/*.json (+ .html/.js) in web/index.html in. Idempotent."""
import json, re, glob, os
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML=os.path.join(R,'web','index.html'); s=open(HTML,encoding='utf8').read()
mods=[]
for f in sorted(glob.glob(os.path.join(R,'tools','nt','*.json'))):
    m=json.load(open(f,encoding='utf8')); base=f[:-5]
    m['_html']=open(base+'.html',encoding='utf8').read().strip() if os.path.exists(base+'.html') else ''
    m['_js']=open(base+'.js',encoding='utf8').read().strip() if os.path.exists(base+'.js') else ''
    mods.append(m)
# 1. oude invoegingen weg
s=re.sub(r'\n?<!-- NT:(\w+) -->.*?<!-- /NT:\1 -->','',s,flags=re.S)
s=re.sub(r'\n?/\* NT:(\w+) \*/.*?/\* /NT:\1 \*/','',s,flags=re.S)
s=re.sub(r'\n?  <a href="#\w+" data-nt=""><span class="k">.*?</span>.*?</a>','',s)
s=re.sub(r'\n?  <div class="navgroup" data-nt="">.*?</div>','',s)
# 2. navgroepen
NAV_AFTER={'Forensisch':'DNA','Kwaliteit':'Data','Organisatie':'Protocollen'}
def group_block_end(s,name):
    i=s.index(f'<div class="navgroup"'+('' if True else '')) if False else None
    m=re.search(r'<div class="navgroup"[^>]*>'+re.escape(name)+r'</div>',s)
    if not m: return None
    j=m.end(); n=re.search(r'\n  <div class="navgroup"|\n  <a href="#inst"|\n  <div class="navfoot"',s[j:])
    return j+n.start()
def gbe(s,name):
    p=group_block_end(s,name); assert p is not None, 'navgroep ontbreekt: '+name; return p
for g,after in NAV_AFTER.items():
    if re.search(r'<div class="navgroup"[^>]*>'+re.escape(g)+'</div>',s): continue
    if not any(m.get('group')==g for m in mods): continue
    p=gbe(s,after); s=s[:p]+f'\n  <div class="navgroup" data-nt="">{g}</div>'+s[p:]
# rmp naar Forensisch
if any(m.get('group')=='Forensisch' for m in mods):
    link=re.search(r'\n  <a href="#rmp">.*?</a>',s).group(0); s=s.replace(link,'',1)
    p=gbe(s,'Forensisch'); s=s[:p]+link+s[p:]
# 3. per module
for m in mods:
    if m.get('lib'):
        mk='buildReeks();\nsLoad('; s=s.replace(mk,f'/* NT:{m["id"]} */\n{m["_js"]}\n/* /NT:{m["id"]} */\n'+mk,1); continue
    p=gbe(s,m['group']); s=s[:p]+f'\n  <a href="#{m["id"]}" data-nt=""><span class="k">{m["key"]}</span>{m["name"]}</a>'+s[p:]
    if m['_html']:
        mk='<!-- ============ START ============ -->'; s=s.replace(mk,f'<!-- NT:{m["id"]} -->\n{m["_html"]}\n<!-- /NT:{m["id"]} -->\n\n'+mk,1)
    if m['_js']:
        mk='buildReeks();\nsLoad('; assert mk in s; s=s.replace(mk,f'/* NT:{m["id"]} */\n{m["_js"]}\n/* /NT:{m["id"]} */\n'+mk,1)
# 4. TOOLS en TAGS
tm=re.search(r"const TOOLS=\[(.*?)\];",s); ids=[x.strip().strip("'") for x in tm.group(1).split(',')]
for m in mods:
    if not m.get('lib') and m['id'] not in ids: ids.append(m['id'])
s=s.replace(tm.group(0),"const TOOLS=["+','.join(f"'{i}'" for i in ids)+"];",1)
tg=re.search(r"const TAGS=\{(.*?)\};",s,flags=re.S); body=tg.group(1)
for m in mods:
    if m.get('lib'): continue
    body=re.sub(r",\s*"+m['id']+r":\[[^\]]*\]","",body)
    if m.get('tags'): body=body.rstrip()+","+m['id']+":["+",".join("'"+t.replace("'","\\'")+"'" for t in m['tags'])+"]"
s=s.replace(tg.group(0),"const TAGS={"+body+"};",1)
open(HTML,'w',encoding='utf8').write(s); print(len(mods),'modules ingevoegd')
