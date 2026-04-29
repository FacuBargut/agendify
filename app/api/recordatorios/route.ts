import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail, EMAIL_TEMPLATES, googleCalendarUrl } from "@/lib/email";

/**
 * GET /api/recordatorios
 * Cron diario (8am via vercel.json) que manda recordatorio por email a
 * todos los pacientes con un turno confirmed para mañana (24hs vista).
 *
 * El plan Hobby de Vercel permite solo cron diario, asi que el recordatorio
 * de 2hs queda fuera de alcance hasta migrar a Pro. El daily 24h ya cubre
 * el caso comun ("no me olvido del turno de mañana").
 */
export async function GET() {
  const now = new Date();
  console.log(`[Recordatorios] Cron ejecutado: ${now.toISOString()}`);

  // Ventana objetivo: turnos cuya fecha cae entre +20h y +28h desde ahora.
  // Suficiente margen para que cualquier ejecucion del dia siguiente
  // capture todos los turnos del dia siguiente sin duplicar.
  const minDate = new Date(now.getTime() + 20 * 60 * 60 * 1000);
  const maxDate = new Date(now.getTime() + 28 * 60 * 60 * 1000);

  const turnos = await db.appointment.findMany({
    where: {
      status: "confirmed",
      reminder48hSent: false, // reusamos esta flag como "recordatorio enviado"
      date: { gte: minDate, lte: maxDate },
      patientEmail: { not: null },
    },
    include: { professional: true },
  });

  console.log(`[Recordatorios] Encontrados: ${turnos.length}`);

  let enviados = 0;
  let errores = 0;

  for (const t of turnos) {
    if (!t.patientEmail) continue;
    try {
      const sessionEnd = new Date(t.date.getTime() + t.durationMin * 60 * 1000);
      const calUrl = googleCalendarUrl({
        title: `Sesión con ${t.professional.name}`,
        description: `Turno reservado vía Agendify.${t.notes ? `\n\nNotas: ${t.notes}` : ""}`,
        start: t.date,
        end: sessionEnd,
      });

      const tpl = EMAIL_TEMPLATES.reminder24h({
        patientName: t.patientName,
        professionalName: t.professional.name,
        date: t.date,
        durationMin: t.durationMin,
        googleCalendarUrl: calUrl,
      });

      const result = await sendEmail({ to: t.patientEmail, ...tpl });
      if (result.ok) {
        await db.appointment.update({
          where: { id: t.id },
          data: { reminder48hSent: true },
        });
        enviados++;
      } else {
        errores++;
      }
    } catch (err) {
      console.error(`[Recordatorios] Error procesando ${t.id}:`, err);
      errores++;
    }
  }

  return NextResponse.json({
    timestamp: now.toISOString(),
    encontrados: turnos.length,
    enviados,
    errores,
  });
}
