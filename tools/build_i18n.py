"""Zet het Engelse woordenboek i18n/en.json in web/index.html.
Sleutels zijn de Nederlandse teksten (HTML), met {#} voor getallen en {*} voor gebruikersinvoer.
Nieuwe teksten vinden: python3 tests/i18n_collect.py --collect  -> i18n/missing.json"""
import json, re, sys, glob, os
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EN=os.path.join(R,'i18n','en.json'); MISS=os.path.join(R,'i18n','missing.json'); HTML=os.path.join(R,'web','index.html')
en=json.load(open(EN,encoding='utf8')) if os.path.exists(EN) else {}
def ph(s): return re.findall(r'\{[#*]\}',s)
s=open(HTML,encoding='utf8').read()
js=json.dumps(dict(sorted(en.items())),ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
s2=re.sub(r'/\*I18N-EN-START\*/.*?/\*I18N-EN-END\*/',lambda m:'/*I18N-EN-START*/'+js+'/*I18N-EN-END*/',s,count=1,flags=re.S)
assert s2!=s or js in s
open(HTML,'w',encoding='utf8').write(s2)
print(len(en),'vertalingen ingebed,',len(js),'tekens')
