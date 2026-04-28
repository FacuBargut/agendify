import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendWhatsApp, WA_MESSAGES } from "@/lib/twilio";
import { createNotification } from "@/lib/notifications";

/**
 * GET /api/turnos/expirar
 * Cron job (cada hora via Vercel) que libera turnos con status
 * "pending_transfer" cuyo transferExpiresAt ya venció.
 */
export async function GET() {
  const now = new Date();
  console.log(`[Expirar] Cron ejecutado: ${now.toISOString()}`);

  // Buscar todos los turnos vencidos
  const vencidos = await db.appointment.findMany({
    where: {
      status: "pending_transfer",
      transferExpiresAt: { lte: now },
    },
    include: { professional: true },
  });

  console.log(`[Expirar] Turnos vencidos encontrados: ${vencidos.length}`);

  let liberados = 0;
  let errores = 0;

  for (const appointment of vencidos) {
    try {
      // Liberar el slot
      await db.appointment.update({
        where: { id: appointment.id },
        data: { status: "cancelled", paymentStatus: "unpaid" },
      });

      // Notificar al paciente
      const msg = WA_MESSAGES.transferenciaExpiradaPaciente({
        patientName: appointment.patientName,
        professionalName: appointment.professional.name,
        date: appointment.date,
        time: appointment.date.toTimeString().slice(0, 5),
        slug: appointment.professional.slug,
      });

      await sendWhatsApp(appointment.patientPhone, msg);

      // Avisar al profesional con push + notificacion in-app
      await createNotification({
        professionalId: appointment.professionalId,
        type: "transfer_expired",
        appointmentId: appointment.id,
        patientName: appointment.patientName,
        date: appointment.date,
        time: appointment.date.toTimeString().slice(0, 5),
        depositAmount: appointment.depositAmount ?? 0,
      });

      console.log(`[Expirar] Turno ${appointment.id} liberado — ${appointment.patientName}`);
      liberados++;
    } catch (err) {
      console.error(`[Expirar] Error procesando turno ${appointment.id}:`, err);
      errores++;
    }
  }

  return NextResponse.json({
    timestamp: now.toISOString(),
    encontrados: vencidos.length,
    liberados,
    errores,
  });
}
