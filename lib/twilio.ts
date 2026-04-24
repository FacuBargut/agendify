import twilio from "twilio";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

const FROM = process.env.TWILIO_WHATSAPP_FROM!;
// Formato: 'whatsapp:+14155238886' (sandbox de Twilio)

// Helper para formatear número argentino a formato internacional
export function formatPhoneAR(phone: string): string {
  // Limpiar todo lo que no sea número
  const cleaned = phone.replace(/\D/g, "");

  // Si ya tiene código de país (54), usarlo
  if (cleaned.startsWith("54")) {
    return `whatsapp:+${cleaned}`;
  }

  // Si empieza con 0, sacarlo y agregar 54
  if (cleaned.startsWith("0")) {
    return `whatsapp:+54${cleaned.slice(1)}`;
  }

  // Si empieza con 11, 341, etc (sin 0 adelante)
  return `whatsapp:+54${cleaned}`;
}

function capitalizeFecha(date: Date): string {
  const fechaFormateada = format(date, "EEEE d 'de' MMMM", { locale: es });
  return fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);
}

// Mensajes de WhatsApp
export const WA_MESSAGES = {
  confirmacion: (params: {
    patientName: string;
    professionalName: string;
    date: Date;
    time: string;
    depositAmount: number;
    professionalSlug: string;
  }) => {
    const fecha = capitalizeFecha(params.date);

    return `✅ *¡Turno confirmado, ${params.patientName}!*

📅 *Fecha:* ${fecha}
🕐 *Horario:* ${params.time} hs
👩‍⚕️ *Profesional:* ${params.professionalName}
💰 *Seña pagada:* $${params.depositAmount.toLocaleString("es-AR")}

Te recordaremos 48hs y 2hs antes de tu turno.

_Si necesitás cancelar o reprogramar, respondé este mensaje._`;
  },

  recordatorio48h: (params: {
    patientName: string;
    professionalName: string;
    date: Date;
    time: string;
  }) => {
    const fecha = capitalizeFecha(params.date);

    return `⏰ *Recordatorio de turno*

Hola ${params.patientName}, te recordamos que tenés un turno *mañana*:

📅 *${fecha}*
🕐 *${params.time} hs*
👩‍⚕️ *${params.professionalName}*

¿Confirmás tu asistencia?
👍 Respondé *SI* para confirmar
❌ Respondé *NO* para cancelar`;
  },

  recordatorio2h: (params: {
    patientName: string;
    professionalName: string;
    time: string;
  }) => {
    return `⏰ *Tu turno es hoy en 2 horas*

Hola ${params.patientName}, en un momento tenés tu sesión con *${params.professionalName}* a las *${params.time} hs*.

¡Hasta pronto! 👋`;
  },

  cancelacionPorPaciente: (params: {
    patientName: string;
    professionalName: string;
    date: Date;
    time: string;
  }) => {
    const fecha = capitalizeFecha(params.date);

    return `❌ *Turno cancelado*

Tu turno del ${fecha} a las ${params.time} hs con ${params.professionalName} fue cancelado.

Si querés reservar un nuevo turno podés hacerlo desde el mismo link. ¡Hasta la próxima!`;
  },

  notificacionProfesional: (params: {
    patientName: string;
    patientPhone: string;
    date: Date;
    time: string;
    depositAmount: number;
  }) => {
    const fecha = capitalizeFecha(params.date);

    return `🔔 *Nueva reserva en Agendify*

*Paciente:* ${params.patientName}
*Teléfono:* ${params.patientPhone}
📅 *Fecha:* ${fecha}
🕐 *Horario:* ${params.time} hs
💰 *Seña cobrada:* $${params.depositAmount.toLocaleString("es-AR")}

El turno quedó confirmado automáticamente. ✅`;
  },

  // ── Transferencia bancaria ───────────────────────────────────

  transferenciaPendienteProfesional: (params: {
    patientName: string;
    patientPhone: string;
    date: Date;
    time: string;
    depositAmount: number;
    transferProofRef?: string;
  }) => {
    const fecha = capitalizeFecha(params.date);
    const comprobante = params.transferProofRef
      ? `\n🧾 *Comprobante:* ${params.transferProofRef}`
      : "";

    return `🔔 *Nueva solicitud de turno — Transferencia*

Un paciente realizó una transferencia y está esperando confirmación:

*Paciente:* ${params.patientName}
*Teléfono:* ${params.patientPhone}
📅 *Fecha:* ${fecha}
🕐 *Horario:* ${params.time} hs
💰 *Seña declarada:* $${params.depositAmount.toLocaleString("es-AR")}${comprobante}

Verificá que el monto llegó a tu cuenta y confirmá el turno desde Agendify.

⚠️ El turno se liberará automáticamente en 24hs si no lo confirmás.`;
  },

  transferenciaConfirmadaPaciente: (params: {
    patientName: string;
    professionalName: string;
    date: Date;
    time: string;
    depositAmount: number;
  }) => {
    const fecha = capitalizeFecha(params.date);

    return `✅ *¡Turno confirmado, ${params.patientName}!*

El profesional verificó tu transferencia y confirmó tu reserva:

📅 *Fecha:* ${fecha}
🕐 *Horario:* ${params.time} hs
👩‍⚕️ *Profesional:* ${params.professionalName}
💰 *Seña verificada:* $${params.depositAmount.toLocaleString("es-AR")}

Te recordaremos 48hs y 2hs antes de tu turno. ¡Hasta pronto! 👋`;
  },

  transferenciaRechazadaPaciente: (params: {
    patientName: string;
    professionalName: string;
    professionalPhone?: string | null;
    date: Date;
    time: string;
  }) => {
    const fecha = capitalizeFecha(params.date);
    const contacto = params.professionalPhone
      ? `\nContactá al profesional directamente: wa.me/${params.professionalPhone.replace(/\D/g, "")}`
      : "";

    return `❌ *No pudimos verificar tu transferencia*

Hola ${params.patientName}, el profesional no pudo confirmar el pago para tu turno del ${fecha} a las ${params.time} hs con ${params.professionalName}.

El slot fue liberado. Si el dinero fue debitado de tu cuenta, revisá tu extracto y contactanos.${contacto}`;
  },

  transferenciaExpiradaPaciente: (params: {
    patientName: string;
    professionalName: string;
    date: Date;
    time: string;
    slug: string;
  }) => {
    const fecha = capitalizeFecha(params.date);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://agendify.com.ar";

    return `⏳ *Tu solicitud de turno expiró*

Hola ${params.patientName}, el profesional no confirmó la transferencia en las últimas 24hs. El turno del ${fecha} a las ${params.time} hs con ${params.professionalName} fue liberado.

Si querés reservar de nuevo: ${appUrl}/${params.slug}`;
  },
};

// Función principal para enviar mensajes
export async function sendWhatsApp(
  to: string,
  message: string
): Promise<{ success: boolean; sid?: string; error?: string }> {
  try {
    const formattedTo = formatPhoneAR(to);

    const result = await client.messages.create({
      from: FROM,
      to: formattedTo,
      body: message,
    });

    console.log(`[WhatsApp] Enviado a ${formattedTo}: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error desconocido";
    console.error("[WhatsApp] Error enviando:", message);
    return { success: false, error: message };
  }
}
