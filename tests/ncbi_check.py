"""Online opzoeken bij NCBI (S195–S198) zonder internet: fetch wordt in de pagina vervangen.
Controleert dat de schakelaar uit echt geen verzoek geeft, dat alleen tool=labkit (en een
zelf getypt e-mailadres) meegaat, dat elke fout een leesbare melding is, dat een tweede
vraag uit de cache komt en dat de wachtrij 3 (met sleutel 10) verzoeken per seconde houdt."""
import pathlib
import sys
import json

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
    for(const k in (window.__fx||{})) if(String(url).includes(k)) return new Response(window.__fx[k],{status:200});
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

    # S196: dbSNP opzoeken op rs-nummer in Sequentie, met de opgenomen antwoorden van NCBI
    FX = ROOT / 'tests' / 'fixtures' / 'ncbi'
    snp_json = (FX / 'esummary_snp_1805007.json').read_text(encoding='utf8')
    nf_json = (FX / 'esummary_snp_notfound.json').read_text(encoding='utf8')
    pg.evaluate("ncbiCacheClear(); __calls=[]; __times=[]; __reply={status:200,body:'{}'}")
    pg.evaluate("(a)=>{ __fx={'id=1805007':a[0], 'id=999999999999':a[1]}; }", [snp_json, nf_json])
    pg.evaluate("location.hash='seq'")
    pg.wait_for_selector('#sq-rs')
    ck('aan in Sequentie (zelfde schakelaar)', pg.evaluate('ncbi.on') is True)
    ck('niets vanzelf opgezocht', pg.evaluate('__calls.length') == 0)
    pg.fill('#sq-rs', 'abc')
    pg.click('#sq-rs-go')
    ck('ongeldige invoer: melding', 'geen rs-nummer' in pg.inner_text('#sq-snp') or 'not an rs number' in pg.inner_text('#sq-snp'), pg.inner_text('#sq-snp'))
    ck('ongeldige invoer: geen verzoek', pg.evaluate('__calls.length') == 0)
    pg.fill('#sq-rs', 'rs1805007')
    pg.click('#sq-rs-go')
    pg.wait_for_function("document.querySelector('#sq-snp .big')&&document.querySelector('#sq-snp .big').innerText.includes('MC1R')")
    txt = pg.inner_text('#sq-snp')
    ck('verzoek db=snp id=1805007', pg.evaluate('__calls.length') == 1 and 'esummary.fcgi' in pg.evaluate('__calls[0]') and 'db=snp' in pg.evaluate('__calls[0]') and 'id=1805007' in pg.evaluate('__calls[0]'), pg.evaluate('__calls'))
    ck('gen MC1R', 'MC1R' in txt, txt[:200])
    ck('chromosoom 16', pg.evaluate("[...document.querySelectorAll('#sq-snp dl.kv dt')].some(d=>d.nextElementSibling.textContent.trim()==='16')"))
    ck('positie 1-gebaseerd', 'NC_000016.10:89919709' in txt, txt[:400])
    kv = pg.evaluate("[...document.querySelectorAll('#sq-snp dl.kv dd')].map(d=>d.textContent.trim())")
    ck('referentie C', 'C' in kv, kv)
    ck('alternatieve allelen A, G, T', 'A, G, T' in kv, kv)
    ck('missense_variant', any('missense_variant' in x for x in kv), kv)
    ck('HGVS NC_000016.10:g.89919709C>T', 'NC_000016.10:g.89919709C>T' in txt)
    ck('HGVS in data-notr', pg.evaluate("[...document.querySelectorAll('#sq-snp [data-notr]')].some(e=>e.textContent.includes('NP_002377.4:p.Arg151Cys'))"))
    rows = pg.evaluate("[...document.querySelectorAll('#sq-snp table.mini tbody tr')].map(r=>[...r.cells].map(c=>c.textContent.trim()))")
    ck('frequentietabel: ALFA T 0,0658 8441', any(r[0] == 'ALFA' and r[1] == 'T' and r[2] in ('0,0658', '0.0658') and r[3].replace('.', '').replace(',', '').replace('\u202f', '') == '8441' for r in rows), rows[-3:])
    ck('frequentietabel: GnomAD_genomes', any(r[0] == 'GnomAD_genomes' for r in rows))
    ck('26 rijen', len(rows) == 26, len(rows))

    # tweede keer dezelfde rs: uit de cache
    pg.click('#sq-rs-go')
    pg.wait_for_timeout(300)
    ck('tweede opzoeking: geen nieuw verzoek', pg.evaluate('__calls.length') == 1, pg.evaluate('__calls'))
    pg.fill('#sq-rs', ' RS1805007 ')
    pg.press('#sq-rs', 'Enter')
    pg.wait_for_timeout(300)
    ck('Enter zoekt ook (hoofdletters, spaties), uit cache', pg.evaluate('__calls.length') == 1 and 'MC1R' in pg.inner_text('#sq-snp'))
    pg.fill('#sq-rs', '1805007')
    pg.click('#sq-rs-go')
    pg.wait_for_timeout(300)
    ck('alleen cijfers werkt ook', 'MC1R' in pg.inner_text('#sq-snp') and pg.evaluate('__calls.length') == 1)

    # onbekende rs
    pg.fill('#sq-rs', 'rs999999999999')
    pg.click('#sq-rs-go')
    pg.wait_for_function("document.querySelector('#sq-snp .note')&&!document.querySelector('#sq-snp .big')")
    ck('onbekende rs: niet gevonden', ('niet in dbSNP' in pg.inner_text('#sq-snp') or 'not in dbSNP' in pg.inner_text('#sq-snp')), pg.inner_text('#sq-snp'))
    ck('onbekende rs: geen resultaatlijst', pg.locator('#sq-snp dl.kv').count() == 0)

    # NcbiError wordt getoond, en uit = geen verzoek
    pg.evaluate("ncbiCacheClear(); __calls=[]; ncbi.on=false")
    pg.fill('#sq-rs', 'rs1805007')
    pg.click('#sq-rs-go')
    pg.wait_for_function("document.querySelector('#sq-snp .note.bad')")
    ck('uit: melding, geen verzoek', ('staat uit' in pg.inner_text('#sq-snp') or 'switched off' in pg.inner_text('#sq-snp')) and pg.evaluate('__calls.length') == 0, pg.inner_text('#sq-snp'))
    pg.evaluate("ncbi.on=true")

    # parseSnp zelf
    P = pg.evaluate("(a)=>parseSnp(JSON.parse(a),'1805007')", snp_json)
    ck('parseSnp: gen/chr/acc/pos', P['genes'] == ['MC1R'] and P['chr'] == '16' and P['acc'] == 'NC_000016.10' and P['pos'] == 89919709, P)
    ck('parseSnp: ref/alts', P['ref'] == 'C' and P['alts'] == ['A', 'G', 'T'], P)
    ck('parseSnp: fxn/clin', P['fxn'] == ['coding_sequence_variant', 'missense_variant'] and P['clin'][0] == 'risk-factor' and len(P['clin']) == 5, P['fxn'])
    ck('parseSnp: hgvs', len(P['hgvs']) == 24 and P['hgvs'][0] == 'NC_000016.10:g.89919709C>A' and 'NC_000016.10:g.89919709C>T' in P['hgvs'], len(P['hgvs']))
    ck('parseSnp: freqs', len(P['freqs']) == 26 and P['freqs'][0] == {'study': '1000Genomes', 'allele': 'T', 'freq': 0.0185703, 'n': 93} and P['freqs'][20]['allele'] == 'C', P['freqs'][:1])
    N = pg.evaluate("(a)=>parseSnp(JSON.parse(a),'999999999999')", nf_json)
    ck('parseSnp: onbekend', N.get('notFound') is True and N.get('ok') is False, N)
    ck('rsId', pg.evaluate("[rsId('rs12'),rsId('RS12'),rsId(' 12 '),rsId('x12'),rsId('')]") == ['12', '12', '12', None, None])

    # S197: sequentie ophalen op accessienummer, en de regio rond een SNP
    nm_sum = (FX / 'esummary_nuccore_NM_002386.4.json').read_text(encoding='utf8')
    nm_nf = (FX / 'esummary_nuccore_notfound.json').read_text(encoding='utf8')
    nm_fa = (FX / 'efetch_NM_002386.4.fasta').read_text(encoding='utf8')
    nc_fa = (FX / 'efetch_NC_000016.10_89919609-89919809.fasta').read_text(encoding='utf8')
    nc_sum = json.dumps({'result': {'uids': ['1'], '1': {'uid': '1', 'slen': 90338345, 'title': 'Homo sapiens chromosome 16', 'accessionversion': 'NC_000016.10'}}})
    big_sum = json.dumps({'result': {'uids': ['2'], '2': {'uid': '2', 'slen': 2000000, 'title': 'groot', 'accessionversion': 'U99999.1'}}})
    pg.evaluate("ncbiCacheClear(); __calls=[]")
    pg.evaluate("""(a)=>{ __fx={'esummary.fcgi?db=nuccore&id=NM_002386.4':a[0], 'esummary.fcgi?db=nuccore&id=NM_999999999.1':a[1],
      'efetch.fcgi?db=nuccore&id=NM_002386.4':a[2], 'seq_start=89919609&seq_stop=89919809':a[3],
      'esummary.fcgi?db=nuccore&id=NC_000016.10':a[4], 'esummary.fcgi?db=nuccore&id=U99999.1':a[5],
      'id=1805007':a[6]}; }""", [nm_sum, nm_nf, nm_fa, nc_fa, nc_sum, big_sum, snp_json])
    fetch_note = lambda: pg.inner_text('#sq-fetch') if pg.locator('#sq-fetch').count() else ''
    # (c) ongeldig: geen verzoek
    pg.fill('#sq-acc', 'NM 12 x')
    pg.click('#sq-acc-go')
    ck('ongeldig accessienummer: melding, geen verzoek', pg.locator('#sq-fetch.bad').count() == 1 and pg.evaluate('__calls.length') == 0, fetch_note())
    pg.fill('#sq-acc', 'NM_002386.4')
    for va, vb in [('0', '10'), ('20', '10'), ('5', ''), ('x', '9'), ('1.5', '9')]:
        pg.fill('#sq-from', va); pg.fill('#sq-to', vb)
        pg.click('#sq-acc-go')
        ck(f'ongeldige regio {va!r}-{vb!r}: geen verzoek', pg.locator('#sq-fetch.bad').count() == 1 and pg.evaluate('__calls.length') == 0, fetch_note())
    pg.fill('#sq-from', ''); pg.fill('#sq-to', '')
    # (d) niet gevonden
    pg.fill('#sq-acc', 'NM_999999999.1')
    pg.click('#sq-acc-go')
    pg.wait_for_function("document.querySelector('#sq-fetch.bad')&&!/…/.test(document.querySelector('#sq-fetch').innerText)")
    ck('onbekend accessienummer: niet gevonden', 'niet gevonden' in fetch_note() or 'not found' in fetch_note(), fetch_note())
    ck('onbekend: alleen esummary', pg.evaluate('__calls.length') == 1)
    # te groot zonder regio
    pg.evaluate("__calls=[]")
    pg.fill('#sq-acc', 'U99999.1')
    pg.click('#sq-acc-go')
    pg.wait_for_function("document.querySelector('#sq-fetch.bad')&&!/…/.test(document.querySelector('#sq-fetch').innerText)")
    ck('te groot zonder regio: geen efetch', pg.evaluate('__calls.length') == 1 and 'efetch' not in pg.evaluate('__calls[0]'), pg.evaluate('__calls'))
    # (a) NM_002386.4
    pg.evaluate("__calls=[]")
    pg.fill('#sq-acc', ' nm_002386.4 ')
    pg.click('#sq-acc-go')
    pg.wait_for_function("document.querySelector('#sq-fetch.ok')")
    ck('NM_ in #sq-in als FASTA', pg.input_value('#sq-in').startswith('>NM_002386.4'), pg.input_value('#sq-in')[:60])
    big_txt = pg.inner_text('#sq-res .big').replace('.', '').replace(',', '').replace('\u202f', '').replace(' ', '')
    ck('grote getal 2111 nt', '2111' in big_txt, big_txt)
    ck('ok-melding', 'NM_002386.4' in fetch_note() and '2111' in fetch_note().replace('.', '').replace(',', ''), fetch_note())
    cl = pg.evaluate('__calls')
    ck('esummary dan efetch', len(cl) == 2 and 'esummary' in cl[0] and 'efetch' in cl[1] and 'rettype=fasta' in cl[1] and 'seq_start' not in cl[1], cl)
    ck('(b) alleen tool=labkit plus zelf ingestelde email/api_key', all('tool=labkit' in u for u in cl) and all(('email=iemand%40voorbeeld.nl' in u and 'api_key=abc123' in u) for u in cl), cl)
    # (f) tweede keer: cache
    pg.click('#sq-acc-go')
    pg.wait_for_timeout(400)
    ck('tweede ophaling: geen nieuw verzoek', pg.evaluate('__calls.length') == 2, pg.evaluate('__calls'))
    # (e) regio rond rs1805007
    pg.evaluate("__calls=[]")
    pg.fill('#sq-rs', 'rs1805007')
    pg.click('#sq-rs-go')
    pg.wait_for_selector('#sq-rs-region')
    ck('flank standaard 100', pg.input_value('#sq-flank') == '100')
    pg.click('#sq-rs-region')
    pg.wait_for_function("document.querySelector('#sq-fetch.ok')&&/89919609/.test(document.querySelector('#sq-in').value)")
    cl = pg.evaluate('__calls')
    ck('regio: seq_start/seq_stop', any('seq_start=89919609&seq_stop=89919809' in u for u in cl), cl)
    ck('regio: velden ingevuld', pg.input_value('#sq-acc') == 'NC_000016.10' and pg.input_value('#sq-from') == '89919609' and pg.input_value('#sq-to') == '89919809')
    body = ''.join(l for l in pg.input_value('#sq-in').splitlines() if not l.startswith('>')).strip()
    ck('regio: 201 bp met C op positie 101', len(body) == 201 and body[100] == 'C', (len(body), body[95:106]))
    pg.fill('#sq-flank', '9999')
    pg.click('#sq-rs-region')
    ck('flank te groot: melding', pg.locator('#sq-fetch.bad').count() == 1)
    pg.fill('#sq-flank', '100')
    ck('parseSnp/accOk/regionOk', pg.evaluate("[accOk('NM_002386.4'),accOk('U12345.1'),accOk('NC_000016.10'),accOk('x'),accOk('NM_')]") == [True, True, True, False, False]
       and pg.evaluate("[regionOk('',''),regionOk('1','5'),regionOk('5','1'),regionOk('0','5')].map(r=>r.ok)") == [True, True, False, False])

    ck('geen paginafouten', not errs, errs)
    b.close()

print('\n' + ('ALLES OK' if not fails else f'{len(fails)} FOUT(EN): ' + ', '.join(fails)))
sys.exit(1 if fails else 0)
