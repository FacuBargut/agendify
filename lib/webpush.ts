import webpush from "web-push";
import { db } from "@/lib/db";

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL ?? "hola@agendify.app"}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export interface PushPayload {
  title: string;
  body: string;
  url?: string;   // URL a abrir cuando el usuario toca la notificación
  icon?: string;
}

/**
 * Envía una Web Push notification a todos los dispositivos
 * registrados de un profesional. Elimina subscripciones expiradas.
 */
export async function sendPushToUser(
  professionalId: string,
  payload: PushPayload
): Promise<void> {
  const subscriptions = await db.pushSubscription.findMany({
    where: { professionalId },
  });

  if (subscriptions.length === 0) return;

  const data = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/agenda",
    icon: payload.icon ?? "/icons/icon-192x192.png",
    badge: "/icons/icon-96x96.png",
  });

  const expiredEndpoints: string[] = [];

  await Promise.allSettled(
    subscriptions.map(async (sub: { endpoint: string; p256dh: string; auth: string }) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          data
        );
      } catch (err: unknown) {
        // 410 Gone = el dispositivo desregistró la subscripción
        if (
          err &&
          typeof err === "object" &&
          "statusCode" in err &&
          (err as { statusCode: number }).statusCode === 410
        ) {
          expiredEndpoints.push(sub.endpoint);
        }
      }
    })
  );

  // Limpiar subscripciones expiradas
  if (expiredEndpoints.length > 0) {
    await db.pushSubscription.deleteMany({
      where: { endpoint: { in: expiredEndpoints } },
    });
  }
}
