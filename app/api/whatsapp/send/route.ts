import { NextResponse } from "next/server";
import { sendWhatsApp, WA_MESSAGES } from "@/lib/twilio";

type MessageType =
  | "confirmacion"
  | "recordatorio48h"
  | "recordatorio2h"
  | "cancelacion"
  | "notificacion_profesional";

interface SendBody {
  type: MessageType;
  patientPhone: string;
  professionalPhone?: string;
  patientName: string;
  professionalName: string;
  date: string;
  time: string;
  depositAmount?: number;
  professionalSlug?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<SendBody>;

    // Validate required fields
    if (!body.type || !body.patientPhone || !body.patientName || !body.professionalName || !body.time) {
      return NextResponse.json(
        { error: "Campos requeridos: type, patientPhone, patientName, professionalName, time" },
        { status: 400 }
      );
    }

    const { type, patientPhone, professionalPhone, patientName, professionalName, date, time, depositAmount, professionalSlug } = body as SendBody;
    const parsedDate = new Date(date);
    let messagesSent = 0;

    if (type === "confirmacion") {
      // Send confirmation to patient
      const patientMsg = WA_MESSAGES.confirmacion({
        patientName,
        professionalName,
        date: parsedDate,
        time,
        depositAmount: depositAmount || 0,
        professionalSlug: professionalSlug || "",
      });

      const patientResult = await sendWhatsApp(patientPhone, patientMsg);
      if (!patientResult.success) {
        return NextResponse.json(
          { error: "Error enviando WhatsApp al paciente", detail: patientResult.error },
          { status: 500 }
        );
      }
      messagesSent++;

      // Send notification to professional (non-critical)
      if (professionalPhone) {
        const proMsg = WA_MESSAGES.notificacionProfesional({
          patientName,
          patientPhone,
          date: parsedDate,
          time,
          depositAmount: depositAmount || 0,
        });

        const proResult = await sendWhatsApp(professionalPhone, proMsg);
        if (proResult.success) {
          messagesSent++;
        } else {
          console.error("[WhatsApp] Error enviando al profesional (no crítico):", proResult.error);
        }
      }
    }

    if (type === "recordatorio48h") {
      const msg = WA_MESSAGES.recordatorio48h({
        patientName,
        professionalName,
        date: parsedDate,
        time,
      });

      const result = await sendWhatsApp(patientPhone, msg);
      if (!result.success) {
        return NextResponse.json(
          { error: "Error enviando recordatorio 48h", detail: result.error },
          { status: 500 }
        );
      }
      messagesSent++;
    }

    if (type === "recordatorio2h") {
      const msg = WA_MESSAGES.recordatorio2h({
        patientName,
        professionalName,
        time,
      });

      const result = await sendWhatsApp(patientPhone, msg);
      if (!result.success) {
        return NextResponse.json(
          { error: "Error enviando recordatorio 2h", detail: result.error },
          { status: 500 }
        );
      }
      messagesSent++;
    }

    if (type === "cancelacion") {
      const msg = WA_MESSAGES.cancelacionPorPaciente({
        patientName,
        professionalName,
        date: parsedDate,
        time,
      });

      const result = await sendWhatsApp(patientPhone, msg);
      if (!result.success) {
        return NextResponse.json(
          { error: "Error enviando cancelación", detail: result.error },
          { status: 500 }
        );
      }
      messagesSent++;
    }

    if (type === "notificacion_profesional") {
      if (!professionalPhone) {
        return NextResponse.json(
          { error: "professionalPhone requerido para notificación al profesional" },
          { status: 400 }
        );
      }

      const msg = WA_MESSAGES.notificacionProfesional({
        patientName,
        patientPhone,
        date: parsedDate,
        time,
        depositAmount: depositAmount || 0,
      });

      const result = await sendWhatsApp(professionalPhone, msg);
      if (!result.success) {
        return NextResponse.json(
          { error: "Error enviando notificación al profesional", detail: result.error },
          { status: 500 }
        );
      }
      messagesSent++;
    }

    return NextResponse.json({ success: true, messagesSent });
  } catch (error) {
    console.error("[WhatsApp API] Error:", error);
    return NextResponse.json(
      { error: "Error interno al enviar mensaje" },
      { status: 500 }
    );
  }
}
