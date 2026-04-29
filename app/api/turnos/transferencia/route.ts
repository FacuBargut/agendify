import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendWhatsApp, WA_MESSAGES } from "@/lib/twilio";
import { createNotification } from "@/lib/notifications";
import { sendEmail, EMAIL_TEMPLATES } from "@/lib/email";

interface TransferenciaBody {
  professionalSlug: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  date: string;          // ISO string
  time: string;          // "HH:mm"
  notes?: string;
  totalAmount: number;
  depositAmount: number;
  transferProofRef?: string; // número de comprobante (opcional)
}

// 24 horas en ms
const EXPIRATION_HOURS = 24;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<TransferenciaBody>;

    const required: (keyof TransferenciaBody)[] = [
      "professionalSlug",
      "patientName",
      "patientPhone",
      "patientEmail",
      "date",
      "time",
      "totalAmount",
      "depositAmount",
    ];

    for (const field of required) {
      if (!body[field] && body[field] !== 0) {
        return NextResponse.json(
          { error: `Campo requerido: ${field}` },
          { status: 400 }
        );
      }
    }

    const {
      professionalSlug,
      patientName,
      patientPhone,
      patientEmail,
      date,
      time,
      notes,
      totalAmount,
      depositAmount,
      transferProofRef,
    } = body as TransferenciaBody;

    // ── Buscar profesional ─────────────────────────────────────
    const professional = await db.professional.findUnique({
      where: { slug: professionalSlug },
    });

    if (!professional) {
      return NextResponse.json(
        { error: "Profesional no encontrado" },
        { status: 404 }
      );
    }

    if (!professional.transferAlias) {
      return NextResponse.json(
        { error: "El profesional no tiene configurado un alias de transferencia." },
        { status: 422 }
      );
    }

    // ── Verificar que el slot sigue disponible ─────────────────
    const appointmentDate = new Date(`${date.split("T")[0]}T${time}:00`);

    const slotConflict = await db.appointment.findFirst({
      where: {
        professionalId: professional.id,
        date: appointmentDate,
        status: { in: ["pending", "confirmed", "pending_transfer"] },
      },
    });

    if (slotConflict) {
      return NextResponse.json(
        { error: "El horario ya no está disponible. Por favor elegí otro." },
        { status: 409 }
      );
    }

    // ── Buscar o crear paciente ────────────────────────────────
    const patient = await db.patient.upsert({
      where: {
        professionalId_phone: {
          professionalId: professional.id,
          phone: patientPhone,
        },
      },
      update: { name: patientName, email: patientEmail },
      create: {
        professionalId: professional.id,
        name: patientName,
        phone: patientPhone,
        email: patientEmail,
      },
    });

    // ── Calcular expiración: 24hs desde ahora ─────────────────
    const transferExpiresAt = new Date(
      Date.now() + EXPIRATION_HOURS * 60 * 60 * 1000
    );

    // ── Crear turno en estado pending_transfer ────────────────
    const appointment = await db.appointment.create({
      data: {
        professionalId: professional.id,
        patientId: patient.id,
        patientName,
        patientPhone,
        patientEmail,
        date: appointmentDate,
        durationMin: professional.sessionDuration,
        status: "pending_transfer",
        paymentStatus: "unpaid",
        paymentMethod: "transferencia",
        depositAmount,
        totalAmount,
        notes: notes || null,
        transferProofRef: transferProofRef || null,
        transferExpiresAt,
      },
    });

    console.log(`[Transferencia] Turno creado: ${appointment.id} — expira ${transferExpiresAt.toISOString()}`);

    // ── Notificación in-app + Web Push al profesional ─────────
    // await obligatorio — en Vercel serverless, sin await la push se cancela.
    await createNotification({
      professionalId: professional.id,
      type: "new_transfer",
      appointmentId: appointment.id,
      patientName,
      date: appointmentDate,
      time,
      depositAmount,
    });

    // ── Notificar al profesional por WhatsApp ─────────────────
    if (professional.phone) {
      const msg = WA_MESSAGES.transferenciaPendienteProfesional({
        patientName,
        patientPhone,
        date: appointmentDate,
        time,
        depositAmount,
        transferProofRef: transferProofRef || undefined,
      });

      sendWhatsApp(professional.phone, msg).catch((err) =>
        console.error("[Transferencia] Error WA al profesional:", err)
      );
    } else {
      console.warn(`[Transferencia] Profesional ${professionalSlug} sin teléfono configurado — no se envió WA`);
    }

    // ── Email al paciente: "recibimos tu transferencia, esperando confirmacion"
    const tpl = EMAIL_TEMPLATES.transferReceived({
      patientName,
      professionalName: professional.name,
      date: appointmentDate,
      durationMin: professional.sessionDuration,
      depositAmount,
    });
    sendEmail({ to: patientEmail, ...tpl }).catch((err) =>
      console.error("[Transferencia] Error email al paciente:", err)
    );

    return NextResponse.json({
      appointmentId: appointment.id,
      transferExpiresAt: transferExpiresAt.toISOString(),
      message: "Solicitud registrada. El profesional verificará tu transferencia.",
    });

  } catch (error) {
    console.error("[Transferencia] Error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Error al registrar la solicitud de turno." },
      { status: 500 }
    );
  }
}
