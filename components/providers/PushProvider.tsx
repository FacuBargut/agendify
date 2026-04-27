"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

const STORAGE_KEY = "agendify_push_endpoint";

/**
 * PushProvider
 * Se monta en el layout y gestiona silenciosamente el ciclo de vida
 * de las Web Push subscriptions para el profesional logueado:
 *   1. Espera a que el service worker esté listo
 *   2. Pide permiso de notificaciones (solo si el usuario lo acepta)
 *   3. Crea o recupera la subscripción push
 *   4. La envía al servidor para guardarla en DB
 *
 * No muestra ninguna UI propia — el prompt del SO aparece automáticamente.
 */
export default function PushProvider() {
  const { data: session, status } = useSession();
  const registered = useRef(false);

  useEffect(() => {
    // Solo actuar si el profesional está logueado y no hemos registrado aún
    if (status !== "authenticated" || registered.current) return;
    if (!session?.user?.professionalId) return;

    // Verificar soporte (iOS 16.4+ con PWA instalada, Android Chrome, etc.)
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    registered.current = true;
    registerPush();
  }, [status, session]);

  return null;
}

async function registerPush() {
  try {
    // Esperar a que el SW esté activo
    const registration = await navigator.serviceWorker.ready;

    // Si ya tenemos permiso concedido, suscribir directamente
    // Si está 'default' (sin decidir), pedirlo
    // Si está 'denied', no hacer nada
    let permission = Notification.permission;

    if (permission === "denied") return;

    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") return;

    // Verificar si ya existe una subscripción activa
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Crear nueva subscripción con nuestras claves VAPID públicas
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
    }

    // Guardar endpoint en localStorage para detectar cambios
    const endpointKey = STORAGE_KEY;
    const storedEndpoint = localStorage.getItem(endpointKey);

    if (storedEndpoint === subscription.endpoint) return; // ya enviado

    // Enviar al servidor
    const { endpoint, keys } = subscription.toJSON() as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    };

    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint, keys }),
    });

    if (res.ok) {
      localStorage.setItem(endpointKey, endpoint);
    }
  } catch (err) {
    // No interrumpir la app si algo falla
    console.warn("[PushProvider] Error al registrar push:", err);
  }
}

/** Convierte la clave VAPID pública de base64url a ArrayBuffer */
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    arr[i] = rawData.charCodeAt(i);
  }
  return arr.buffer as ArrayBuffer;
}
