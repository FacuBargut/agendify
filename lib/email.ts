import { Resend } from "resend";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const resend = new Resend(process.env.RESEND_API_KEY ?? "");

const FROM = process.env.RESEND_FROM_EMAIL ?? "Agendify <noreply@agendify.com.ar>";

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function fechaLarga(date: Date): string {
  return capitalize(format(date, "EEEE d 'de' MMMM 'de' yyyy", { locale: es }));
}

function formatARS(amount: number): string {
  return amount.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
}

/**
 * Genera una URL para "Add to Google Calendar". El usuario clickea, abre
 * Google Calendar con el evento prellenado y solo confirma.
 *
 * Formato de fechas: YYYYMMDDTHHMMSSZ (UTC)
 */
export function googleCalendarUrl(params: {
  title: string;
  description: string;
  start: Date;
  end: Date;
  location?: string;
}): string {
  function fmt(d: Date): string {
    return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  }
  const url = new URL("https://www.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", params.title);
  url.searchParams.set("details", params.description);
  url.searchParams.set("dates", `${fmt(params.start)}/${fmt(params.end)}`);
  if (params.location) url.searchParams.set("location", params.location);
  return url.toString();
}

const BRAND_TEAL = "#0D6E6E";

/**
 * Wrapper HTML basico para que todos los emails tengan look consistente.
 * Sin imagenes externas para evitar problemas de bloqueo.
 */
function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#F8FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#1A202C;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFB;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid #E2E8F0;">
          <tr>
            <td style="background-color:${BRAND_TEAL};padding:20px 24px;color:#FFFFFF;font-size:16px;font-weight:600;">
              Agendify
            </td>
          </tr>
          <tr>
            <td style="padding:24px;font-size:14px;line-height:1.6;color:#1A202C;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;background-color:#F8FAFB;border-top:1px solid #E2E8F0;font-size:12px;color:#718096;text-align:center;">
              Agendify · Tu agenda profesional
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function button(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background-color:${BRAND_TEAL};color:#FFFFFF;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:500;font-size:14px;">${label}</a>`;
}

function dataRow(label: string, value: string): string {
  return `<tr><td style="padding:6px 0;color:#718096;width:140px;">${label}</td><td style="padding:6px 0;color:#1A202C;font-weight:500;">${value}</td></tr>`;
}

// ─── Templates ─────────────────────────────────────────────────────────────

interface CommonAppointment {
  patientName: string;
  professionalName: string;
  date: Date;
  durationMin: number;
}

export const EMAIL_TEMPLATES = {
  // Patient envió la transferencia, espera verificación del profesional
  transferReceived: (params: CommonAppointment & { depositAmount: number }) => ({
    subject: `Recibimos tu solicitud de turno con ${params.professionalName}`,
    html: layout(`
      <h2 style="margin:0 0 12px;font-size:18px;color:#1A202C;">Recibimos tu solicitud, ${params.patientName}</h2>
      <p style="margin:0 0 16px;">Estamos esperando que <strong>${params.professionalName}</strong> verifique tu transferencia. Te avisaremos por mail apenas la confirme.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;">
        ${dataRow("Fecha", fechaLarga(params.date))}
        ${dataRow("Horario", `${format(params.date, "HH:mm")} hs`)}
        ${dataRow("Seña declarada", formatARS(params.depositAmount))}
      </table>
      <p style="margin:20px 0 0;color:#718096;font-size:13px;">⏳ Tu reserva queda pendiente por hasta 24 horas. Si no se confirma en ese tiempo, el turno se libera automáticamente.</p>
    `),
  }),

  // Profesional confirmo la transferencia / o pago MP aprobado
  bookingConfirmed: (params: CommonAppointment & {
    depositAmount: number;
    googleCalendarUrl: string;
  }) => ({
    subject: `Turno confirmado con ${params.professionalName}`,
    html: layout(`
      <h2 style="margin:0 0 12px;font-size:18px;color:#1A202C;">¡Turno confirmado, ${params.patientName}! ✅</h2>
      <p style="margin:0 0 16px;">${params.professionalName} verificó tu pago y confirmó tu reserva.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;">
        ${dataRow("Fecha", fechaLarga(params.date))}
        ${dataRow("Horario", `${format(params.date, "HH:mm")} hs`)}
        ${dataRow("Duración", `${params.durationMin} min`)}
        ${dataRow("Seña verificada", formatARS(params.depositAmount))}
      </table>
      <p style="margin:24px 0 12px;">Para no olvidarte, agregalo a tu calendario:</p>
      <p style="margin:0 0 24px;">${button("📅 Agregar a Google Calendar", params.googleCalendarUrl)}</p>
      <p style="margin:0;color:#718096;font-size:13px;">Te enviaremos un recordatorio por mail 24 horas antes del turno.</p>
    `),
  }),

  // Profesional rechazo la transferencia
  transferRejected: (params: CommonAppointment & { professionalEmail?: string | null }) => ({
    subject: `No pudimos verificar tu transferencia para el turno`,
    html: layout(`
      <h2 style="margin:0 0 12px;font-size:18px;color:#1A202C;">No pudimos confirmar tu transferencia</h2>
      <p style="margin:0 0 16px;">Hola ${params.patientName}, ${params.professionalName} no pudo verificar el pago para tu turno del <strong>${fechaLarga(params.date)}</strong> a las <strong>${format(params.date, "HH:mm")} hs</strong>. El horario quedó liberado.</p>
      <p style="margin:0 0 8px;">Si la transferencia ya salió de tu cuenta:</p>
      <ul style="margin:0 0 16px;padding-left:20px;color:#1A202C;">
        <li>Revisá el comprobante.</li>
        <li>Contactate con el profesional${params.professionalEmail ? `: <a href="mailto:${params.professionalEmail}" style="color:${BRAND_TEAL};">${params.professionalEmail}</a>` : ""}.</li>
      </ul>
    `),
  }),

  // Vencio la reserva sin verificar
  transferExpired: (params: CommonAppointment & { rebookUrl: string }) => ({
    subject: `Tu solicitud de turno expiró`,
    html: layout(`
      <h2 style="margin:0 0 12px;font-size:18px;color:#1A202C;">Tu solicitud expiró ⏳</h2>
      <p style="margin:0 0 16px;">Hola ${params.patientName}, ${params.professionalName} no confirmó la transferencia en las últimas 24 horas, así que el turno del <strong>${fechaLarga(params.date)}</strong> a las <strong>${format(params.date, "HH:mm")} hs</strong> fue liberado.</p>
      <p style="margin:0 0 24px;">${button("Reservar de nuevo", params.rebookUrl)}</p>
    `),
  }),

  // Recordatorio del turno (24h antes)
  reminder24h: (params: CommonAppointment & { googleCalendarUrl: string }) => ({
    subject: `Recordatorio: turno mañana con ${params.professionalName}`,
    html: layout(`
      <h2 style="margin:0 0 12px;font-size:18px;color:#1A202C;">⏰ Tu turno es mañana</h2>
      <p style="margin:0 0 16px;">Hola ${params.patientName}, te recordamos tu sesión con <strong>${params.professionalName}</strong>:</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;">
        ${dataRow("Fecha", fechaLarga(params.date))}
        ${dataRow("Horario", `${format(params.date, "HH:mm")} hs`)}
        ${dataRow("Duración", `${params.durationMin} min`)}
      </table>
      <p style="margin:24px 0 12px;">Si todavía no lo agregaste a tu calendario:</p>
      <p style="margin:0;">${button("📅 Agregar a Google Calendar", params.googleCalendarUrl)}</p>
    `),
  }),
};

/**
 * Wrapper de Resend que loguea y nunca tira (fire-safe). Si Resend no esta
 * configurado (sin API key), no hace nada y retorna ok=false.
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY no configurado — email omitido");
    return { ok: false, error: "no_api_key" };
  }

  try {
    const result = await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (result.error) {
      console.error("[Email] Resend error:", result.error);
      return { ok: false, error: result.error.message };
    }

    console.log(`[Email] Enviado a ${params.to}: ${result.data?.id}`);
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Email] Excepcion:", msg);
    return { ok: false, error: msg };
  }
}
