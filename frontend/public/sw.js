const CACHE_NAME = "vendai-shell-v2";
const APP_SHELL = ["/", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(
        nomes.filter((nome) => nome !== CACHE_NAME).map((nome) => caches.delete(nome)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const paginaInicial = await caches.match("/");
        return paginaInicial || new Response("Aplicação indisponível sem ligação.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((emCache) => emCache || fetch(request).then((response) => {
      if (!response.ok) return response;
      const copia = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, copia));
      return response;
    }).catch(() => new Response("Recurso indisponível.", { status: 503 }))),
  );
});
