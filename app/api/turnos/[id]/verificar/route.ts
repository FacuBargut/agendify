import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { sendEmail, EMAIL_TEMPLATES, googleCalendarUrl } from "@/lib/email";

interface VerificarBody {
  action: "confirmar" | "rechazar";
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
  const body = (await request.json()) as Partial<VerificarBody>;

  if (!body.action || !["confirmar", "rechazar"].includes(body.action)) {
    return NextResponse.json(
      { error: "action debe ser 'confirmar' o 'rechazar'" },
      { status: 400 }
    );
  }

  // ── Buscar turno y verificar que pertenece al profesional ──
  const appointment = await db.appointment.findFirst({
    where: {
      id,
      professionalId: session.user.professionalId,
      status: "pending_transfer",
    },
    include: {
      professional: true,
    },
  });

  if (!appointment) {
    return NextResponse.json(
      { error: "Turno no encontrado o no está en estado pendiente de transferencia." },
      { status: 404 }
    );
  }

  const { professional } = appointment;

  if (body.action === "confirmar") {
    // ── Confirmar: activar el turno ─────────────────────────
    const updated = await db.appointment.update({
      where: { id },
      data: {
        status: "confirmed",
        paymentStatus: "deposit_paid",
        transferConfirmedAt: new Date(),
      },
    });

    console.log(`[Verificar] Turno ${id} CONFIRMADO por ${professional.name}`);

    await createNotification({
      professionalId: professional.id,
      type: "transfer_confirmed",
      appointmentId: id,
      patientName: appointment.patientName,
      date: appointment.date,
      time: appointment.date.toTimeString().slice(0, 5),
      depositAmount: appointment.depositAmount ?? 0,
    });

    // Email al paciente con link de Google Calendar
    if (appointment.patientEmail) {
      const sessionEnd = new Date(
        appointment.date.getTime() + appointment.durationMin * 60 * 1000
      );
      const calUrl = googleCalendarUrl({
        title: `Sesión con ${professional.name}`,
        description: `Turno reservado vía Agendify.${appointment.notes ? `\n\nNotas: ${appointment.notes}` : ""}`,
        start: appointment.date,
        end: sessionEnd,
      });

      const tpl = EMAIL_TEMPLATES.bookingConfirmed({
        patientName: appointment.patientName,
        professionalName: professional.name,
        date: appointment.date,
        durationMin: appointment.durationMin,
        depositAmount: appointment.depositAmount ?? 0,
        googleCalendarUrl: calUrl,
      });
      sendEmail({ to: appointment.patientEmail, ...tpl }).catch((err) =>
        console.error("[Verificar] Error email confirmacion:", err)
      );
    }

    return NextResponse.json({ appointment: updated });
  }

  // ── Rechazar: liberar slot ──────────────────────────────────
  const updated = await db.appointment.update({
    where: { id },
    data: {
      status: "cancelled",
      paymentStatus: "unpaid",
    },
  });

  console.log(`[Verificar] Turno ${id} RECHAZADO por ${professional.name}`);

  await createNotification({
    professionalId: professional.id,
    type: "transfer_rejected",
    appointmentId: id,
    patientName: appointment.patientName,
    date: appointment.date,
    time: appointment.date.toTimeString().slice(0, 5),
    depositAmount: appointment.depositAmount ?? 0,
  });

  // Email al paciente: rechazo
  if (appointment.patientEmail) {
    const tpl = EMAIL_TEMPLATES.transferRejected({
      patientName: appointment.patientName,
      professionalName: professional.name,
      date: appointment.date,
      durationMin: appointment.durationMin,
      professionalEmail: professional.email,
    });
    sendEmail({ to: appointment.patientEmail, ...tpl }).catch((err) =>
      console.error("[Verificar] Error email rechazo:", err)
    );
  }

  return NextResponse.json({ appointment: updated });
}
