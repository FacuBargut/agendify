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

  // ── Auto-completar turnos confirmados pasados >48hs sin asistencia marcada ──
  // El estado efectivo en UI ya los muestra como "completed" via getEffectiveStatus,
  // pero migrar el DB mantiene reports y metricas historicas consistentes sin
  // tener que recalcular cada vez.
  const REVIEW_WINDOW_MS = 48 * 60 * 60 * 1000;
  const cutoff = new Date(now.getTime() - REVIEW_WINDOW_MS);

  // Buscamos confirmed que ya pasaron hace mas de 48hs. Como Prisma no puede
  // calcular date+durationMin en SQL facilmente, hacemos query amplia y
  // filtramos en JS — la cantidad por dia es chica.
  const confirmedPast = await db.appointment.findMany({
    where: {
      status: "confirmed",
      date: { lte: cutoff },
    },
    select: { id: true, date: true, durationMin: true },
  });

  const toComplete = confirmedPast.filter(
    (a) => a.date.getTime() + a.durationMin * 60 * 1000 < cutoff.getTime()
  );

  let completados = 0;
  if (toComplete.length > 0) {
    await db.appointment.updateMany({
      where: { id: { in: toComplete.map((a) => a.id) } },
      data: { status: "completed" },
    });
    completados = toComplete.length;
    console.log(`[Expirar] Turnos auto-completados: ${completados}`);
  }

  return NextResponse.json({
    timestamp: now.toISOString(),
    encontrados: vencidos.length,
    liberados,
    errores,
    completados,
  });
}
