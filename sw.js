// Приложение My Life: работа без интернета.
// Всегда сначала берём свежее с сайта, а копию кладём в телефон; нет сети — показываем копию.
// Поменял список файлов или логику — подними номер в CACHE, чтобы телефон забыл старую копию.
const CACHE = 'my-life-v1';
const CORE = ['./', './index.html', './fonts.css', './art.css', './d3.min.js', './icon-180.png', './app.bin'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) if (name !== CACHE) await caches.delete(name);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const key = url.origin + url.pathname; // без «?t=…»: одна копия на файл
  event.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(key, copy)).catch(() => {});
      }
      return res;
    } catch (err) {
      const hit = await caches.match(key);
      if (hit) return hit;
      if (req.mode === 'navigate') {
        const start = await caches.match(new URL('./', self.location.href).href);
        if (start) return start;
      }
      throw err;
    }
  })());
});
