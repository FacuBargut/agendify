import { db } from "@/lib/db";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type NotificationType =
  | "new_transfer"
  | "new_mp_payment"
  | "transfer_confirmed"
  | "transfer_rejected"
  | "transfer_expired";

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

    case "transfer_expired":
      return {
        title: "Transferencia vencida",
        body: `${patientName} no completó la transferencia para el turno del ${fecha} a las ${time} hs (${monto}). El slot quedó libre.`,
      };
  }
}

/**
 * Crea una notificación en DB y además envía una Web Push notification
 * al dispositivo del profesional (si tiene permisos y está suscripto).
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

    // 1. Guardar en DB (in-app notification)
    await db.notification.create({
      data: {
        professionalId: params.professionalId,
        type: params.type,
        title,
        body,
        appointmentId: params.appointmentId ?? null,
      },
    });

    // 2. Enviar Web Push (nativa al dispositivo)
    // Import dinámico para evitar que web-push rompa el bundle del cliente
    const url = params.appointmentId
      ? `/agenda?highlight=${params.appointmentId}`
      : "/agenda";

    try {
      const { sendPushToUser } = await import("@/lib/webpush");
      await sendPushToUser(params.professionalId, { title, body, url });
    } catch (pushErr) {
      // Si web-push falla (ej: no está instalado aún), la notificación in-app
      // ya se guardó — no bloqueamos nada.
      console.warn("[Push] No se pudo enviar push nativo:", pushErr);
    }

    console.log(`[Notification] Creada: ${params.type} → ${params.professionalId}`);
  } catch (error) {
    console.error("[Notification] Error creando notificación:", error);
  }
}
