import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendWhatsApp, WA_MESSAGES } from "@/lib/twilio";
import { createNotification } from "@/lib/notifications";

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

    // Notificar al paciente
    const msg = WA_MESSAGES.transferenciaConfirmadaPaciente({
      patientName: appointment.patientName,
      professionalName: professional.name,
      date: appointment.date,
      time: appointment.date.toTimeString().slice(0, 5),
      depositAmount: appointment.depositAmount ?? 0,
    });

    sendWhatsApp(appointment.patientPhone, msg).catch((err) =>
      console.error("[Verificar] Error WA al paciente:", err)
    );

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

  // Notificar al paciente
  const msg = WA_MESSAGES.transferenciaRechazadaPaciente({
    patientName: appointment.patientName,
    professionalName: professional.name,
    professionalPhone: professional.phone,
    date: appointment.date,
    time: appointment.date.toTimeString().slice(0, 5),
  });

  sendWhatsApp(appointment.patientPhone, msg).catch((err) =>
    console.error("[Verificar] Error WA al paciente:", err)
  );

  return NextResponse.json({ appointment: updated });
}
