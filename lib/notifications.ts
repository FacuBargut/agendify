import { db } from "@/lib/db";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type NotificationType =
  | "new_transfer"
  | "new_mp_payment"
  | "transfer_confirmed"
  | "transfer_rejected";

interface CreateNotificationParams {
  professionalId: string;
  type: NotificationType;
  appointmentId?: string;
  patientName: string;
  date: Date;
  time: string;
  depositAmount: number;
}

function capitalizeFecha(date: Date): string {
  const s = format(date, "EEEE d 'de' MMMM", { locale: es });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Genera título y cuerpo según el tipo de notificación.
 * Textos pensados para ser claros, concisos y accionables.
 */
function buildContent(
  type: NotificationType,
  patientName: string,
  date: Date,
  time: string,
  depositAmount: number
): { title: string; body: string } {
  const fecha = capitalizeFecha(date);
  const monto = depositAmount.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });

  switch (type) {
    case "new_transfer":
      return {
        title: "Nuevo turno — verificar pago",
        body: `${patientName} reservó el ${fecha} a las ${time} hs y declaró haber transferido la seña de ${monto}. Revisá tu cuenta y confirmá el turno.`,
      };

    case "new_mp_payment":
      return {
        title: "Nuevo turno confirmado",
        body: `${patientName} reservó el ${fecha} a las ${time} hs. La seña de ${monto} fue cobrada exitosamente por Mercado Pago. El turno está confirmado.`,
      };

    case "transfer_confirmed":
      return {
        title: "Transferencia verificada",
        body: `Confirmaste el turno de ${patientName} del ${fecha} a las ${time} hs. El paciente fue notificado por WhatsApp.`,
      };

    case "transfer_rejected":
      return {
        title: "Transferencia rechazada",
        body: `Rechazaste el turno de ${patientName} del ${fecha} a las ${time} hs. El slot quedó libre y el paciente fue notificado.`,
      };
  }
}

/**
 * Crea una notificación en la base de datos.
 * Fire-and-forget — nunca lanza, solo loguea errores.
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<void> {
  try {
    const { title, body } = buildContent(
      params.type,
      params.patientName,
      params.date,
      params.time,
      params.depositAmount
    );

    await db.notification.create({
      data: {
        professionalId: params.professionalId,
        type: params.type,
        title,
        body,
        appointmentId: params.appointmentId ?? null,
      },
    });

    console.log(`[Notification] Creada: ${params.type} → ${params.professionalId}`);
  } catch (error) {
    console.error("[Notification] Error creando notificación:", error);
  }
}
