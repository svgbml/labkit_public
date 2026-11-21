"""Bouwt web/index.html uit src/shell/index.html (sinds S265 is web/index.html alleen nog uitvoer).

Wat erbij komt, in deze volgorde:
  1. de @include-regels van het sjabloon (`<!-- @include pad -->`, pad relatief aan src/shell/)
  2. de tool-modules uit tools/nt/*.json (+ .html/.js), tussen NT-markers
  3. de Vue-bundel uit build/app.bundle.js (npm run build:vue)
  4. de hash van web/i18n-en.js (tools/build_i18n.py schrijft dat bestand)
Gebruik:
  python tools/insert_tools.py           schrijft web/index.html
  python tools/insert_tools.py --check   schrijft niets; faalt als web/index.html niet overeenkomt
Gewoonlijk via `python tools/build.py` (of `npm run build`)."""
import json, re, glob, os, sys, hashlib
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHELL=os.path.join(R,'src','shell')
TEMPLATE=os.path.join(SHELL,'index.html')
HTML=os.path.join(R,'web','index.html')
CHECK='--check' in sys.argv
s=open(TEMPLATE,encoding='utf8').read()

# 1. @include: een regel `<!-- @include sections/x.html -->` wordt de inhoud van dat bestand
#    (zonder de laatste regeleinde). Ingevoegde bestanden mogen zelf geen @include bevatten.
def include(m):
    p=os.path.join(SHELL,m.group(2)); assert os.path.isfile(p),'@include: bestand ontbreekt: '+m.group(2)
    body=open(p,encoding='utf8').read()
    if body.endswith('\n'): body=body[:-1]
    assert '@include' not in body,'@include binnen een ingevoegd bestand: '+m.group(2)
    return m.group(1)+body
s=re.sub(r'^([ \t]*)<!-- @include ([\w./-]+) -->$',include,s,flags=re.M)

mods=[]
for f in sorted(glob.glob(os.path.join(R,'tools','nt','*.json'))):
    m=json.load(open(f,encoding='utf8')); base=f[:-5]
    m['_html']=open(base+'.html',encoding='utf8').read().strip() if os.path.exists(base+'.html') else ''
    m['_js']=open(base+'.js',encoding='utf8').read().strip() if os.path.exists(base+'.js') else ''
    mods.append(m)
assert '<!-- NT:' not in s and '/* NT:' not in s, 'het sjabloon bevat al NT-blokken; die horen alleen in web/index.html'
# 2. navgroepen
NAV_AFTER={'Forensisch':'DNA','Kwaliteit':'Data','Organisatie':'Protocollen'}
def gbe(s,name):
    m=re.search(r'<div class="navgroup"[^>]*>'+re.escape(name)+r'</div>',s)
    assert m, 'navgroep ontbreekt: '+name
    j=m.end(); n=re.search(r'\n  <div class="navgroup"|\n  <a href="#inst"|\n  <div class="navfoot"',s[j:])
    return j+n.start()
for g,after in NAV_AFTER.items():
    if re.search(r'<div class="navgroup"[^>]*>'+re.escape(g)+'</div>',s): continue
    if not any(m.get('group')==g for m in mods): continue
    p=gbe(s,after); s=s[:p]+f'\n  <div class="navgroup" data-nt="">{g}</div>'+s[p:]
# rmp naar Forensisch
if any(m.get('group')=='Forensisch' for m in mods):
    link=re.search(r'\n  <a href="#rmp">.*?</a>',s).group(0); s=s.replace(link,'',1)
    p=gbe(s,'Forensisch'); s=s[:p]+link+s[p:]
# 3. per module
MK='buildReeks();\nsLoad('; assert MK in s
for m in mods:
    if m.get('lib'):
        s=s.replace(MK,f'/* NT:{m["id"]} */\n{m["_js"]}\n/* /NT:{m["id"]} */\n'+MK,1); continue
    p=gbe(s,m['group']); s=s[:p]+f'\n  <a href="#{m["id"]}" data-nt=""><span class="k">{m["key"]}</span>{m["name"]}</a>'+s[p:]
    if m['_html']:
        mk='<!-- ============ START ============ -->'; assert mk in s
        s=s.replace(mk,f'<!-- NT:{m["id"]} -->\n{m["_html"]}\n<!-- /NT:{m["id"]} -->\n\n'+mk,1)
    if m['_js']:
        s=s.replace(MK,f'/* NT:{m["id"]} */\n{m["_js"]}\n/* /NT:{m["id"]} */\n'+MK,1)
# 3b. de Vue-bundel (Vite -> build/app.bundle.js) komt na alle modules, zodat hij de
#     helpers en de lib-modules hierboven al kan gebruiken. Hij wordt ingevoegd en niet als
#     <script src> gekoppeld, zodat web/index.html een bestand blijft dat vanaf file:// werkt.
BUNDLE=os.path.join(R,'build','app.bundle.js')
SRC=os.path.join(R,'src')
assert os.path.exists(BUNDLE),'build/app.bundle.js ontbreekt; draai eerst "npm run build:vue"'
if not CHECK:
    # Een verouderde bundel invoegen geeft een index.html die niet bij src/ past, en dat valt
    # pas op als je je afvraagt waarom je wijziging niets doet. Dus: liever hier stoppen.
    # src/shell/ gaat niet door Vite (de build voegt het zelf in), dus dat telt niet mee.
    newer=[p for p in glob.glob(os.path.join(SRC,'**','*'),recursive=True)
           if os.path.isfile(p) and not os.path.abspath(p).startswith(SHELL+os.sep)
           and os.path.getmtime(p)>os.path.getmtime(BUNDLE)]
    assert not newer,('build/app.bundle.js is ouder dan '+str(len(newer))+' bestand(en) in src/ ('
                      +os.path.relpath(newer[0],R)+' …): draai eerst "npm run build:vue".')
js=open(BUNDLE,encoding='utf8').read().strip()
s=s.replace(MK,f'/* NT:vuebundle */\n{js}\n/* /NT:vuebundle */\n'+MK,1)

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

# 5. de hash van het Engelse woordenboek, zodat een nieuwe vertaling nooit uit een oude cache komt
EN=os.path.join(R,'web','i18n-en.js')
h=hashlib.sha1(open(EN,'rb').read().replace(b'\r\n',b'\n')).hexdigest()[:10]
s,n=re.subn(r'i18n-en\.js\?h=@I18N_HASH@','i18n-en.js?h='+h,s); assert n==1,'i18n-en.js?h=@I18N_HASH@ ontbreekt in het sjabloon'

# 6. controle: elk id mag maar een keer voorkomen (een dubbel ingevoegd blok is anders onzichtbaar)
ids=re.findall(r'\sid="([^"]+)"',s)
ids=[i for i in ids if '${' not in i]  # ids die in JS-sjablonen worden opgebouwd tellen niet mee
dup=sorted({i for i in ids if ids.count(i)>1})
assert not dup,'dubbele id in web/index.html: '+', '.join(dup)

if CHECK:
    cur=open(HTML,encoding='utf8').read().replace('\r\n','\n') if os.path.exists(HTML) else ''
    if cur!=s:
        a,b=cur.split('\n'),s.split('\n')
        i=next((k for k in range(min(len(a),len(b))) if a[k]!=b[k]),min(len(a),len(b)))
        sys.exit(f'web/index.html is niet bijgewerkt (eerste verschil op regel {i+1}); draai "npm run build" en commit het resultaat.')
    print('web/index.html is bijgewerkt:',len(mods),'modules,',len(ids),'ids')
else:
    open(HTML,'w',encoding='utf8').write(s); print(len(mods),'modules ingevoegd,',len(ids),'ids, geen dubbele')
