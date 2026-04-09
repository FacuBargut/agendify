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
