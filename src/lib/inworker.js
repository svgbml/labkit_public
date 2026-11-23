/* ================= ZUIVERE FUNCTIES IN EEN WEB WORKER (S163) =================
   Zwaar rekenwerk (een ABIF-bestand lezen, een read uitlijnen) gaat naar een eigen draad, zodat
   de pagina blijft reageren. LabKit is één bundel die vanaf file:// werkt, zonder dynamische
   import() en zonder losse bestanden, dus de Worker komt uit een Blob-URL met de broncode erin.
   Kan dat niet (geen Worker, of de browser weigert hem), dan draaien dezelfde functies op de
   hoofddraad, met dezelfde API.

   API
     const w = inWorker(bron, fns)
       bron  de code van de worker: een tekst (wordt een Blob-URL), een functie die een Worker
             teruggeeft (bv. een import van Vite met ?worker&inline), of null (altijd synchroon).
             De code roept serve(fns) aan; fnSource(fns) maakt zo'n tekst uit functies die niets
             van buiten nodig hebben (geen imports, geen constanten van de module).
       fns   dezelfde functies op naam, voor de terugval op de hoofddraad.
     w.call(naam, args, transfer?) → Promise met het antwoord (structured clone);
             een fout in de functie wordt een afgewezen belofte met dezelfde melding.
             transfer: lijst ArrayBuffers die naar de worker verhuizen (niet kopiëren).
     w.mode  'worker' zodra de worker draait, 'sync' bij de terugval; 'starting' daarvoor.
     w.ready Promise die de uiteindelijke mode geeft.
     w.close() stopt de worker.
   Aan de kant van de worker:  serve({naam: functie, …}).

   Een bericht gaat pas naar de worker als die 'klaar' heeft gemeld. Laadt hij niet, dan draaien
   de wachtende aanroepen op de hoofddraad, met hun buffers nog heel (er is niets verhuisd). */

/* De kant van de worker; ook als tekst bruikbaar (fnSource), dus niets van buiten deze functie. */
export function serve(fns, scope) {
  scope = scope || self;
  scope.onmessage = async e => {
    const {id, name, args} = e.data || {};
    try {
      if (typeof fns[name] !== 'function') throw new Error('Onbekende functie in de worker: ' + name);
      scope.postMessage({id, ok: true, v: await fns[name](...(args || []))});
    } catch (x) { scope.postMessage({id, ok: false, err: String(x && x.message || x)}); }
  };
  scope.postMessage({ready: true});
}

/* broncode voor een worker uit functies op naam; elke functie moet op zichzelf staan */
export function fnSource(fns) {
  return 'const F={' + Object.keys(fns).map(k => JSON.stringify(k) + ':' + fns[k].toString()).join(',') + '};('
    + serve.toString() + ')(F,self);';
}

function runSync(fns, name, args) {
  return new Promise((res, rej) => {
    try {
      if (typeof fns[name] !== 'function') throw new Error('Onbekende functie in de worker: ' + name);
      Promise.resolve(fns[name](...(args || []))).then(res, rej);
    } catch (x) { rej(x); }
  });
}

export function inWorker(src, fns) {
  let wk = null, n = 0, setReady;
  const wait = [], open = new Map();
  const api = {mode: 'starting', ready: new Promise(r => { setReady = r; })};
  const toSync = () => {
    if (wk) { try { wk.terminate(); } catch (e) {} wk = null; }
    api.mode = 'sync'; setReady('sync');
    wait.splice(0).forEach(c => runSync(fns, c.name, c.args).then(c.res, c.rej));
  };
  const post = c => { const id = ++n; open.set(id, c); wk.postMessage({id, name: c.name, args: c.args}, c.transfer || []); };
  try {
    if (!src || typeof Worker === 'undefined') throw 0;
    if (typeof src === 'function') wk = src();
    else wk = new Worker(URL.createObjectURL(new Blob([src], {type: 'text/javascript'})));
    wk.onmessage = e => {
      const d = e.data || {};
      if (d.ready) { api.mode = 'worker'; setReady('worker'); wait.splice(0).forEach(post); return; }
      const c = open.get(d.id); if (!c) return;
      open.delete(d.id);
      if (d.ok) c.res(d.v); else c.rej(new Error(d.err));
    };
    wk.onerror = e => {
      if (e && e.preventDefault) e.preventDefault();
      if (api.mode !== 'worker') { toSync(); return; }
      /* een fout buiten een aanroep om: wat openstaat faalt, de worker blijft */
      open.forEach(c => c.rej(new Error(String(e && e.message || 'worker-fout')))); open.clear();
    };
  } catch (e) { toSync(); }
  api.call = (name, args, transfer) => new Promise((res, rej) => {
    const c = {name, args: args || [], transfer, res, rej};
    if (api.mode === 'sync') runSync(fns, name, c.args).then(res, rej);
    else if (api.mode === 'worker') post(c);
    else wait.push(c);
  });
  api.close = () => { if (wk) wk.terminate(); wk = null; };
  return api;
}
