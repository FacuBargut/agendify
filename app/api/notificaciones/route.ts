import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * GET /api/notificaciones
 * Devuelve las últimas 20 notificaciones del profesional autenticado.
 * Query param ?unread=true → solo las no leídas (para el badge).
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.professionalId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const onlyUnread = searchParams.get("unread") === "true";

  const notifications = await db.notification.findMany({
    where: {
      professionalId: session.user.professionalId,
      ...(onlyUnread ? { read: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const unreadCount = onlyUnread
    ? notifications.length
    : notifications.filter((n: { read: boolean }) => !n.read).length;

  return NextResponse.json({ notifications, unreadCount });
}

/**
 * PATCH /api/notificaciones
 * Marca notificaciones como leídas.
 * Body: { ids: string[] } → marca esas IDs
 * Body: { all: true }    → marca todas las del profesional
 */
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.professionalId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json() as { ids?: string[]; all?: boolean };

  if (body.all) {
    await db.notification.updateMany({
      where: {
        professionalId: session.user.professionalId,
        read: false,
      },
      data: { read: true },
    });
  } else if (body.ids?.length) {
    await db.notification.updateMany({
      where: {
        id: { in: body.ids },
        professionalId: session.user.professionalId,
      },
      data: { read: true },
    });
  }

  return NextResponse.json({ success: true });
}
