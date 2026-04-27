import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * GET /api/push/test
 * Diagnóstico completo del sistema de push notifications.
 * Solo accesible estando logueado.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.professionalId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const result: Record<string, unknown> = {};

  // 1. VAPID keys configuradas?
  result.vapid_public = !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  result.vapid_private = !!process.env.VAPID_PRIVATE_KEY;
  result.vapid_email = process.env.VAPID_EMAIL ?? null;

  // 2. Subscripciones en DB
  let subscriptions: { endpoint: string; createdAt: Date }[] = [];
  try {
    subscriptions = await db.pushSubscription.findMany({
      where: { professionalId: session.user.professionalId },
      select: { endpoint: true, createdAt: true },
    });
    result.subscriptions_count = subscriptions.length;
    result.subscriptions = subscriptions.map(s => ({
      endpoint_prefix: s.endpoint.slice(0, 50) + "...",
      created: s.createdAt,
    }));
  } catch (err) {
    result.subscriptions_error = String(err);
    result.subscriptions_count = 0;
  }

  // 3. Intentar enviar push de prueba si hay suscripciones
  if (subscriptions.length > 0) {
    try {
      const { sendPushToUser } = await import("@/lib/webpush");
      await sendPushToUser(session.user.professionalId, {
        title: "🔔 Test Agendify",
        body: "Si ves esto, las notificaciones push funcionan correctamente.",
        url: "/agenda",
      });
      result.push_sent = true;
      result.push_error = null;
    } catch (err) {
      result.push_sent = false;
      result.push_error = String(err);
    }
  } else {
    result.push_sent = false;
    result.push_error = "Sin suscripciones registradas";
  }

  return NextResponse.json(result, { status: 200 });
}
