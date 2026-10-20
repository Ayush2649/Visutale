// Visutale Service Worker
// Cleanly unregisters any stale service workers previously registered on localhost:3000
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    self.registration.unregister().then(() => {
      return self.clients.matchAll();
    }).then((clients) => {
      // Stale service worker successfully unregistered
    })
  );
});

