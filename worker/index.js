// ─── Web Push handler ────────────────────────────────────────────────────────
// Este archivo se fusiona con el service worker generado por next-pwa.
// Maneja notificaciones push nativas en iOS/Android.

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
    // En iOS se ignoran algunas opciones, pero las incluimos igual
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
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Si la app ya está abierta, navegar en esa pestaña
        for (const client of clientList) {
          if ("navigate" in client && "focus" in client) {
            return client.navigate(targetUrl).then(() => client.focus());
          }
        }
        // Si no está abierta, abrirla
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
