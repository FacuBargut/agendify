import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { sendEmail, EMAIL_TEMPLATES, googleCalendarUrl } from "@/lib/email";

interface WebhookBody {
  type: string;
  data: { id: string };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as WebhookBody;

    // MP sends various notification types — we only care about payments
    if (body.type !== "payment") {
      return NextResponse.json({ received: true });
    }

    const paymentId = body.data.id;

    // Fetch payment details from MP API
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      console.error(
        `[MP Webhook] Error fetching payment ${paymentId}:`,
        response.status
      );
      return NextResponse.json({ received: true });
    }

    const payment = await response.json();

    // Parse the external_reference we sent when creating the preference
    let ref: {
      professionalSlug: string;
      patientName: string;
      patientPhone: string;
      patientEmail?: string;
      date: string;
      time: string;
      notes: string;
      totalAmount: number;
      depositAmount: number;
    } | null = null;

    try {
      ref = JSON.parse(payment.external_reference || "null");
    } catch {
      console.error("[MP Webhook] Could not parse external_reference");
    }

    if (payment.status === "approved" && ref) {
      console.log(
        `[MP Webhook] Pago aprobado: ${ref.patientName} - ${ref.date} ${ref.time} - $${ref.depositAmount}`
      );

      // 1. Buscar profesional
      const professional = await db.professional.findUnique({
        where: { slug: ref.professionalSlug },
      });

      if (!professional) {
        console.error("[MP Webhook] Profesional no encontrado:", ref.professionalSlug);
        return NextResponse.json({ received: true });
      }

      // 2. Buscar o crear paciente
      const patient = await db.patient.upsert({
        where: {
          professionalId_phone: {
            professionalId: professional.id,
            phone: ref.patientPhone,
          },
        },
        update: { name: ref.patientName, ...(ref.patientEmail ? { email: ref.patientEmail } : {}) },
        create: {
          professionalId: professional.id,
          name: ref.patientName,
          phone: ref.patientPhone,
          email: ref.patientEmail ?? null,
        },
      });

      // 3. Crear turno en DB
      const appointment = await db.appointment.create({
        data: {
          professionalId: professional.id,
          patientId: patient.id,
          patientName: ref.patientName,
          patientPhone: ref.patientPhone,
          patientEmail: ref.patientEmail ?? null,
          date: new Date(`${ref.date.split("T")[0]}T${ref.time}:00`),
          durationMin: professional.sessionDuration,
          status: "confirmed",
          paymentStatus: "deposit_paid",
          depositAmount: ref.depositAmount,
          totalAmount: ref.totalAmount,
          mpPaymentId: payment.id.toString(),
          notes: ref.notes || null,
        },
      });

      console.log("[MP Webhook] Turno creado en DB:", appointment.id);

      // 4. Notificación in-app + Web Push al profesional
      // OJO: hay que awaitar — en Vercel serverless, sin await el runtime
      // mata el proceso al devolver la respuesta y la push no se llega a enviar.
      await createNotification({
        professionalId: professional.id,
        type: "new_mp_payment",
        appointmentId: appointment.id,
        patientName: ref.patientName,
        date: new Date(`${ref.date.split("T")[0]}T${ref.time}:00`),
        time: ref.time,
        depositAmount: ref.depositAmount,
      });

      // 5. Email al paciente con confirmacion + link Google Calendar
      if (ref.patientEmail) {
        const appointmentDate = appointment.date;
        const sessionEnd = new Date(
          appointmentDate.getTime() + appointment.durationMin * 60 * 1000
        );
        const calUrl = googleCalendarUrl({
          title: `Sesión con ${professional.name}`,
          description: `Turno reservado vía Agendify.${ref.notes ? `\n\nNotas: ${ref.notes}` : ""}`,
          start: appointmentDate,
          end: sessionEnd,
        });

        const tpl = EMAIL_TEMPLATES.bookingConfirmed({
          patientName: ref.patientName,
          professionalName: professional.name,
          date: appointmentDate,
          durationMin: appointment.durationMin,
          depositAmount: ref.depositAmount,
          googleCalendarUrl: calUrl,
        });
        sendEmail({ to: ref.patientEmail, ...tpl }).catch((err) =>
          console.error("[MP Webhook] Error email confirmacion:", err)
        );
      }
    }

    if (payment.status === "rejected") {
      console.log(
        `[MP Webhook] Pago rechazado: ${ref?.patientName} - Payment ID: ${paymentId}`
      );
    }

    if (payment.status === "pending" || payment.status === "in_process") {
      console.log(
        `[MP Webhook] Pago pendiente: ${ref?.patientName} - Payment ID: ${paymentId}`
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[MP Webhook] Error procesando notificación:", error);
    // Always return 200 so MP doesn't retry
    return NextResponse.json({ received: true });
  }
}
