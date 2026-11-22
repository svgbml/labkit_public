"""Online opzoeken bij NCBI (S195–S198) zonder internet: fetch wordt in de pagina vervangen.
Controleert dat de schakelaar uit echt geen verzoek geeft, dat alleen tool=labkit (en een
zelf getypt e-mailadres) meegaat, dat elke fout een leesbare melding is, dat een tweede
vraag uit de cache komt en dat de wachtrij 3 (met sleutel 10) verzoeken per seconde houdt."""
import pathlib
import sys

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = (ROOT / 'web' / 'index.html').as_uri()
fails = []
def ck(n, c, e=''):
    print(('  OK   ' if c else '  FAIL ') + n + ('' if c else ' :: ' + str(e)))
    if not c:
        fails.append(n)

# fetch vervangen: window.__calls telt de verzoeken, window.__reply bepaalt het antwoord
MOCK = """()=>{ window.__calls=[]; window.__times=[]; window.__reply={status:200, body:'{"ok":1}'};
  window.fetch=async (url,o)=>{ window.__calls.push(String(url)); window.__times.push(performance.now()); const r=window.__reply;
    if(r.throw) throw new TypeError('Failed to fetch');
    return new Response(r.body,{status:r.status}); }; }"""
GET = """async (a)=>{ try{ const v=await ncbiGet(a[0],a[1]); return {ok:true,v}; }
  catch(e){ return {ok:false,kind:e.kind,msg:e.message}; } }"""

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1400, 'height': 950})
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)[:250]))
    pg.add_init_script("try{localStorage.clear();localStorage.setItem('labkit:v1:tour',JSON.stringify({v:1}))}catch(e){}")
    pg.goto(URL + '#inst')
    pg.wait_for_timeout(1200)
    pg.evaluate(MOCK)

    # S195: standaard uit, en uit = geen verzoek
    ck('standaard uit', pg.evaluate('ncbi.on') is False)
    r = pg.evaluate(GET, ['esummary', {'db': 'snp', 'id': '1805007', 'retmode': 'json'}])
    ck('uit: weigert met kind=off', r.get('kind') == 'off', r)
    ck('uit: geen fetch', pg.evaluate('__calls.length') == 0)

    # de schakelaar in Instellingen zet hem aan en bewaart dat buiten de invoeropslag
    box = pg.locator('#inst-ncbi input[type=checkbox]')
    ck('schakelaar in Instellingen', box.count() == 1)
    box.check()
    ck('aan na klik', pg.evaluate('ncbi.on') is True)
    ck('bewaard in lk-ncbi', pg.evaluate("JSON.parse(localStorage.getItem('lk-ncbi')).on") is True)
    ck('velden hebben geen id', pg.evaluate("[...document.querySelectorAll('#inst-ncbi input')].every(e=>!e.id)"))

    r = pg.evaluate(GET, ['esummary', {'db': 'snp', 'id': '1805007', 'retmode': 'json'}])
    url = pg.evaluate('__calls[0]') if pg.evaluate('__calls.length') else ''
    ck('aan: antwoord gelezen', r.get('ok') and r['v'] == {'ok': 1}, r)
    ck('tool=labkit mee', 'tool=labkit' in url, url)
    ck('geen e-mail zonder invoer', 'email' not in url, url)
    pg.fill('#inst-ncbi input[type=email]', 'iemand@voorbeeld.nl')
    pg.dispatch_event('#inst-ncbi input[type=email]', 'change')
    pg.evaluate(GET, ['efetch', {'db': 'nuccore', 'id': 'NM_002386.4'}])
    ck('getypt e-mailadres gaat mee', 'email=iemand%40voorbeeld.nl' in pg.evaluate('__calls.at(-1)'))

    # S195: de foutgevallen
    pg.evaluate("__reply={throw:true}")
    r = pg.evaluate(GET, ['efetch', {'db': 'nuccore', 'id': 'X'}])
    ck('file://: geblokkeerd met uitleg', r.get('kind') == 'blocked' and 'lokaal bestand' in r['msg'], r)
    pg.evaluate("Object.defineProperty(navigator,'onLine',{get:()=>false,configurable:true})")
    r = pg.evaluate(GET, ['efetch', {'db': 'nuccore', 'id': 'X'}])
    ck('offline: geen internet', r.get('kind') == 'offline', r)
    pg.evaluate("Object.defineProperty(navigator,'onLine',{get:()=>true,configurable:true})")
    pg.evaluate("__reply={status:503,body:''}")
    r = pg.evaluate(GET, ['efetch', {'db': 'nuccore', 'id': 'X'}])
    ck('503: NCBI geeft een fout', r.get('kind') == 'down' and 'HTTP 503' in r['msg'], r)
    pg.evaluate("__reply={status:200,body:'<html>'}")
    r = pg.evaluate(GET, ['esummary', {'db': 'snp', 'id': '1', 'retmode': 'json'}])
    ck('onleesbaar antwoord', r.get('kind') == 'down', r)

    # S198: cache en wachtrij
    pg.evaluate("ncbiCacheClear(); __reply={status:200, body:'{\"r\":7}'}; __calls=[]; __times=[]")
    a = pg.evaluate(GET, ['esummary', {'db': 'snp', 'id': '1805007', 'retmode': 'json'}])
    b2 = pg.evaluate(GET, ['esummary', {'db': 'snp', 'id': '1805007', 'retmode': 'json'}])
    ck('tweede vraag: geen verzoek', pg.evaluate('__calls.length') == 1 and a == b2 and a.get('ok'), [a, b2])
    ck('teller in Instellingen', '1 ' in pg.inner_text('#inst-ncbi'), pg.inner_text('#inst-ncbi')[-200:])
    box.uncheck()
    r = pg.evaluate(GET, ['esummary', {'db': 'snp', 'id': '1805007', 'retmode': 'json'}])
    ck('uit: bewaard antwoord blijft werken', r.get('ok') and pg.evaluate('__calls.length') == 1, r)
    box.check()
    BURST = """async (n)=>{ __times=[]; const t0=Date.now();
      await Promise.all([...Array(n)].map((_,i)=>ncbiGet('esummary',{db:'snp',id:String(t0+i),retmode:'json'})));
      const d=__times.slice(1).map((t,i)=>t-__times[i]); return Math.min(...d); }"""
    gap = pg.evaluate(BURST, 7)
    ck('zonder sleutel ≥ 1/3 s tussen verzoeken', gap >= 320, gap)
    pg.fill('#inst-ncbi input[type=password]', 'abc123')
    pg.dispatch_event('#inst-ncbi input[type=password]', 'change')
    gap = pg.evaluate(BURST, 7)
    ck('met sleutel ≥ 1/10 s, < 1/3 s', 90 <= gap < 320, gap)
    ck('sleutel gaat mee als api_key', 'api_key=abc123' in pg.evaluate('__calls.at(-1)'))
    ck('sleutel niet in de cachesleutel', 'abc123' not in pg.evaluate('JSON.stringify(Object.keys(ncbiCache()))'))
    pg.click('#inst-ncbi button')
    ck('wissen leegt de cache', pg.evaluate('Object.keys(ncbiCache()).length') == 0)

    ck('geen paginafouten', not errs, errs)
    b.close()

print('\n' + ('ALLES OK' if not fails else f'{len(fails)} FOUT(EN): ' + ', '.join(fails)))
sys.exit(1 if fails else 0)
