// Agendify Service Worker — hand-rolled, no workbox.
//
// Responsabilidades:
//   1. Recibir Web Push y mostrar notificaciones (push, notificationclick).
//   2. Killswitch: limpiar caches del antiguo SW de next-pwa que dejó la
//      instalación rota en algunos dispositivos (precache apuntando a chunks
//      inexistentes). Ver commits previos para contexto.
//
// NO intercepta fetches. Las requests van directo a la red — preferimos
// confiabilidad sobre offline support por ahora. Si en el futuro queremos
// caching, agregar un fetch handler explícito acá.

const SW_VERSION = "agendify-sw-v1";

self.addEventListener("install", (event) => {
  // Activar de inmediato sin esperar a que se cierren las pestañas viejas.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Tomar control de los clientes ya abiertos sin esperar reload.
      await self.clients.claim();

      // Borrar TODOS los caches existentes — incluye los del antiguo
      // workbox SW (start-url, agendify-cache, others, next-data, etc.)
      // que pueden estar sirviendo respuestas viejas.
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));

      console.log("[sw] activated", SW_VERSION, "— caches limpiados:", keys);
    })()
  );
});

// ─── Web Push ────────────────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Agendify", body: event.data.text(), url: "/agenda" };
  }

  const options = {
    body: payload.body,
    icon: payload.icon || "/icons/icon-192x192.png",
    badge: "/icons/icon-96x96.png",
    data: { url: payload.url || "/agenda" },
    vibrate: [200, 100, 200],
    requireInteraction: false,
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/agenda";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("navigate" in client && "focus" in client) {
            return client.navigate(targetUrl).then(() => client.focus());
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
