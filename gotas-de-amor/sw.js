// Service worker: guarda o site para funcionar offline, mas SEMPRE tenta a rede primeiro,
// para que o navegador nunca misture arquivos novos com arquivos antigos do cache.
const VERSION = 'gotas-v6'; // aumente este número sempre que publicar uma atualização
const FILES = ['./', 'index.html', 'admin.html', 'styles.css', 'store.js', 'auth.js', 'app.js', 'admin.js', 'admin.css',
  'assets/vendor/react.production.min.js', 'assets/vendor/react-dom.production.min.js', 'assets/vendor/htm.js',
  'assets/favicon.svg', 'assets/logo-original.jpg', 'assets/hero.png', 'assets/products.png',
  'assets/icon-192.png', 'assets/icon-512.png', 'assets/icon-maskable-512.png'];

self.addEventListener('install', e => {
  // Um arquivo ausente não pode mais derrubar a instalação inteira (era o que mantinha o cache antigo ativo).
  e.waitUntil(caches.open(VERSION)
    .then(c => Promise.allSettled(FILES.map(f => c.add(f))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  // Rede primeiro para tudo (páginas, JS, CSS, imagens); cache só como reserva offline.
  e.respondWith(
    fetch(req).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return r;
    }).catch(() => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('index.html') : Response.error())))
  );
});
