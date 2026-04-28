import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { canCancel, isPastSession } from "@/lib/appointmentStatus";
import type { AppointmentStatus } from "@/lib/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.professionalId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const appointment = await db.appointment.findFirst({
    where: {
      id,
      professionalId: session.user.professionalId,
    },
    include: { patient: true },
  });

  if (!appointment) {
    return NextResponse.json(
      { error: "Turno no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json({ appointment });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.professionalId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const existing = await db.appointment.findFirst({
    where: { id, professionalId: session.user.professionalId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
  }

  // Bloqueo de cancelacion de turnos pasados o terminales — un turno que ya
  // ocurrio (o esta marcado completed/no_show) no se puede cancelar porque
  // distorsiona metricas y no tiene sentido logico.
  const existingForCheck = {
    date: existing.date,
    durationMin: existing.durationMin,
    status: existing.status as AppointmentStatus,
  };

  if (body.status === "cancelled" && !canCancel(existingForCheck)) {
    return NextResponse.json(
      { error: "No se puede cancelar un turno que ya pasó o que ya fue completado." },
      { status: 422 }
    );
  }

  // Marcar asistencia: solo si la sesion ya termino. Acepta "attended" o
  // "no_show" y traduce a status. Bloqueamos marcar asistencia de turnos
  // futuros para evitar errores.
  let attendanceUpdate: { status: AppointmentStatus } | null = null;
  if (body.attendance === "attended" || body.attendance === "no_show") {
    if (!isPastSession(existingForCheck)) {
      return NextResponse.json(
        { error: "Solo se puede marcar asistencia despues de que termine la sesion." },
        { status: 422 }
      );
    }
    attendanceUpdate = {
      status: body.attendance === "attended" ? "completed" : "no_show",
    };
  }

  const updateData = attendanceUpdate
    ? attendanceUpdate
    : (() => {
        // No reenviamos el campo virtual "attendance" a Prisma
        const { attendance: _drop, ...rest } = body as Record<string, unknown>;
        void _drop;
        return rest;
      })();

  await db.appointment.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ ok: true });
}
