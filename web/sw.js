// Labkit BML service worker: maakt de web-app offline bruikbaar.
// Verhoog CACHE bij elke release zodat gebruikers de nieuwe versie krijgen.
const CACHE = 'labkit-v1.18.1';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
  './i18n-en.js?h=6b2ded9f14',
=======
  './i18n-en.js?h=6b2ded9f14',
>>>>>>> 0c71626 (S48: bench-modus (stapkaarten op volledig scherm, vegen, Wake Lock, hoog contrast))
=======
  './i18n-en.js?h=6b2ded9f14',
>>>>>>> bec740a (S49: checklists uit pipetteerschema, PCR-mastermix en verdunningsschema, vinkjes bewaard per run)
=======
  './i18n-en.js?h=6b2ded9f14',
>>>>>>> ceec2a2 (S50: checklists voor de receptkaart (Oplossing & buffer) en de Gelplanner in bench-modus)
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Pagina's: eerst netwerk (nieuwste versie), anders uit de cache.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Overige bestanden (iconen, lettertypen): eerst cache, anders netwerk en bewaren.
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res && (res.ok || res.type === 'opaque')) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => hit))
  );
});
