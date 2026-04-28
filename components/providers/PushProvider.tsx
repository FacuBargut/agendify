"use client";

import { useEffect, useRef, createContext, useContext, useState } from "react";
import { useSession } from "next-auth/react";

const ENDPOINT_KEY = "agendify_push_endpoint";

interface PushContextValue {
  permission: NotificationPermission | "unsupported";
  subscribe: () => Promise<boolean>; // lanza Error si falla (con mensaje descriptivo)
}

const PushContext = createContext<PushContextValue>({
  permission: "default",
  subscribe: async () => false,
});

export function usePush() {
  return useContext(PushContext);
}

export default function PushProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const initialized = useRef(false);

  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);

    // Si entramos a la página y ya había un SW controlando (el viejo de
    // next-pwa, roto), guardamos esa señal: cuando el SW cambie, recargamos
    // la página para que quede bajo el nuevo SW limpio. Sin esto, el viejo
    // sigue interceptando hasta que se cierran todas las tabs manualmente.
    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    const onControllerChange = () => {
      if (reloaded) return;
      reloaded = true;
      console.log("[SW] controller changed → reload");
      window.location.reload();
    };

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        console.log("[SW] registered, scope:", reg.scope);
      })
      .catch((err) => {
        console.error("[SW] registration failed:", err);
      });

    if (hadController) {
      navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
      return () => {
        navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      };
    }
  }, []);

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
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      throw new Error("Este navegador no soporta notificaciones push.");
    }

    // Pedir permiso — DEBE llamarse desde un user gesture (tap)
    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === "denied") throw new Error("Permiso denegado. Activalo en Ajustes → Agendify → Notificaciones.");
    if (result !== "granted") throw new Error("No se otorgó el permiso de notificaciones.");

    await registerSubscription();
    return true;
  }

  return (
    <PushContext.Provider value={{ permission, subscribe }}>
      {children}
    </PushContext.Provider>
  );
}

async function swReady(timeoutMs = 15_000): Promise<ServiceWorkerRegistration> {
  // Si todavía no hay registro, intentar registrar ahora (defensivo: PushProvider
  // ya lo hace al montar, pero el usuario podría tocar Activar antes de que termine).
  const existing = await navigator.serviceWorker.getRegistrations();
  if (existing.length === 0) {
    try {
      await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    } catch (err) {
      throw new Error(
        `No se pudo registrar el Service Worker: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("El Service Worker tardó demasiado en activarse. Cerrá y volvé a abrir la app.")),
        timeoutMs
      )
    ),
  ]);
}

async function registerSubscription(): Promise<void> {
  const registration = await swReady();

  let sub: PushSubscription | null;
  try {
    sub = await registration.pushManager.getSubscription();
  } catch (err) {
    throw new Error(`Error al leer suscripción existente: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (!sub) {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) throw new Error("Falta la clave VAPID pública. Verificá las variables de entorno.");

    try {
      sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToArrayBuffer(vapidKey),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Mensaje más amigable para error común en iOS
      if (msg.includes("NotAllowedError") || msg.includes("permission")) {
        throw new Error("iOS bloqueó la suscripción. Verificá que Agendify tenga permisos en Ajustes → Notificaciones.");
      }
      throw new Error(`No se pudo crear la suscripción push: ${msg}`);
    }
  }

  // Evitar re-enviar si es la misma suscripción
  const stored = localStorage.getItem(ENDPOINT_KEY);
  if (stored === sub.endpoint) return;

  const subJson = sub.toJSON() as {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subJson.endpoint, keys: subJson.keys }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`El servidor rechazó la suscripción (${res.status}): ${body}`);
  }

  localStorage.setItem(ENDPOINT_KEY, subJson.endpoint);
}

function urlBase64ToArrayBuffer(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer as ArrayBuffer;
}
