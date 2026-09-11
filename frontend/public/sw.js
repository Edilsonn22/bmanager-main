const CACHE_NAME = "vendai-scanner-v3";
const APP_SHELL = ["/", "/scanner", "/manifest.webmanifest", "/vendai-scanner.svg"];

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
      .then((names) => Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const scanner = await caches.match("/scanner");
        return scanner || caches.match("/");
      }),
    );
    return;
  }

  if (url.pathname.startsWith("/assets/") || ["/manifest.webmanifest", "/vendai-scanner.svg"].includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        if (!response.ok) return response;
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })),
    );
  }
});
