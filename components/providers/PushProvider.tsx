"use client";

import { useEffect, useRef, createContext, useContext, useState } from "react";
import { useSession } from "next-auth/react";

const ENDPOINT_KEY = "agendify_push_endpoint";

interface PushContextValue {
  permission: NotificationPermission | "unsupported";
  subscribe: () => Promise<boolean>; // retorna true si se activó OK
}

const PushContext = createContext<PushContextValue>({
  permission: "default",
  subscribe: async () => false,
});

export function usePush() {
  return useContext(PushContext);
}

/**
 * PushProvider
 * Gestiona el estado de permisos push.
 * NO pide permisos automáticamente — eso lo hace el usuario desde
 * un tap explícito (requerido por iOS/Safari).
 * Sí re-registra la suscripción al cargar si ya había permiso concedido.
 */
export default function PushProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const initialized = useRef(false);

  // Empieza como "default" — se actualiza en el cliente al montar
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    // Detectar soporte real en el cliente (no SSR)
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  // Si ya tenía permiso concedido de antes, registrar suscripción sin pedir de nuevo
  useEffect(() => {
    if (status !== "authenticated" || initialized.current) return;
    if (!session?.user?.professionalId) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    initialized.current = true;

    if (Notification.permission === "granted") {
      registerSubscription().catch(console.warn);
    }
  }, [status, session]);

  async function subscribe(): Promise<boolean> {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;

    try {
      // Pedir permiso — DEBE llamarse desde un user gesture (tap)
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") return false;

      await registerSubscription();
      return true;
    } catch (err) {
      console.warn("[Push] Error al suscribir:", err);
      return false;
    }
  }

  return (
    <PushContext.Provider value={{ permission, subscribe }}>
      {children}
    </PushContext.Provider>
  );
}

async function registerSubscription(): Promise<void> {
  const registration = await navigator.serviceWorker.ready;

  let sub = await registration.pushManager.getSubscription();

  if (!sub) {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
    sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToArrayBuffer(vapidKey),
    });
  }

  // Evitar re-enviar si es la misma suscripción
  const stored = localStorage.getItem(ENDPOINT_KEY);
  if (stored === sub.endpoint) return;

  const { endpoint, keys } = sub.toJSON() as {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint, keys }),
  });

  if (res.ok) {
    localStorage.setItem(ENDPOINT_KEY, endpoint);
  }
}

function urlBase64ToArrayBuffer(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer as ArrayBuffer;
}
