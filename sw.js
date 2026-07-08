// Service worker: кэширует приложение целиком, чтобы работало без интернета.
// При первом заходе (с сетью) складывает файлы в кэш; дальше отдаёт из кэша.
const CACHE = "tracker-v2";
const ASSETS = [
  "index.html",
  "manifest.json",
  "icon.png",
  "./"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Стратегия «сначала кэш, потом сеть»: офлайн отдаём из кэша,
// онлайн — обновляем кэш в фоне.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const network = fetch(e.request)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
