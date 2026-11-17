"""Zet het Engelse woordenboek i18n/en.json in web/i18n-en.js (los bestand, alleen geladen als de taal Engels is).
Sleutels zijn de Nederlandse teksten (HTML), met {#} voor getallen en {*} voor gebruikersinvoer.
Zet ook de inhoudshash in web/index.html (i18n-en.js?h=...) en web/sw.js, zodat een nieuwe vertaling nooit uit een oude cache komt.
Nieuwe teksten vinden: python3 tests/i18n_collect.py --collect  -> i18n/missing.json"""
import hashlib, json, re, os
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EN=os.path.join(R,'i18n','en.json'); HTML=os.path.join(R,'web','index.html'); SW=os.path.join(R,'web','sw.js'); OUT=os.path.join(R,'web','i18n-en.js')
en=json.load(open(EN,encoding='utf8')) if os.path.exists(EN) else {}
js=json.dumps(dict(sorted(en.items())),ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
body='/* gegenereerd door tools/build_i18n.py uit i18n/en.json; niet met de hand bewerken */\nwindow.__I18N_EN='+js+';\n'
open(OUT,'w',encoding='utf8',newline='\n').write(body)
h=hashlib.sha1(body.encode('utf8')).hexdigest()[:10]
for path in (HTML,SW):
    s=open(path,encoding='utf8').read()
    s2,n=re.subn(r'i18n-en\.js\?h=\w+','i18n-en.js?h='+h,s)
    assert n>=1, 'i18n-en.js?h= ontbreekt in '+path
    if s2!=s: open(path,'w',encoding='utf8').write(s2)
print(len(en),'vertalingen in web/i18n-en.js,',len(body),'tekens, hash',h)
