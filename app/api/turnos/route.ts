import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { startOfDay, endOfDay } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail, EMAIL_TEMPLATES, googleCalendarUrl } from "@/lib/email";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.professionalId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view");
  const status = searchParams.get("status");
  const dateStr = searchParams.get("date");

  // Mode: all upcoming appointments (for /turnos page)
  if (view === "all") {
    const where: Record<string, unknown> = {
      professionalId: session.user.professionalId,
    };

    if (status && status !== "all") {
      where.status = status;
    }

    const appointments = await db.appointment.findMany({
      where,
      orderBy: { date: "asc" },
      include: { patient: true },
    });

    return NextResponse.json({ appointments });
  }

  // Mode: single day (for agenda)
  if (!dateStr) {
    return NextResponse.json(
      { error: "date es requerido" },
      { status: 400 }
    );
  }

  const date = new Date(dateStr);

  const appointments = await db.appointment.findMany({
    where: {
      professionalId: session.user.professionalId,
      date: {
        gte: startOfDay(date),
        lte: endOfDay(date),
      },
    },
    orderBy: { date: "asc" },
    include: { patient: true },
  });

  return NextResponse.json({ appointments });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.professionalId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { patientId, patientName, patientPhone, patientEmail, date, time, notes, sendEmail: shouldSendEmail, saveAsPatient } = body;

  if (!patientName || !patientPhone || !date || !time) {
    return NextResponse.json(
      { error: "Faltan campos requeridos" },
      { status: 400 }
    );
  }

  const professional = await db.professional.findUnique({
    where: { id: session.user.professionalId },
  });

  if (!professional) {
    return NextResponse.json(
      { error: "Profesional no encontrado" },
      { status: 404 }
    );
  }

  // Check slot is not taken
  const appointmentDate = new Date(`${date}T${time}:00`);
  const existing = await db.appointment.findFirst({
    where: {
      professionalId: session.user.professionalId,
      date: appointmentDate,
      status: { not: "cancelled" },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Ese horario ya está ocupado" },
      { status: 409 }
    );
  }

  // Find or create patient
  let patient = null;
  if (patientId) {
    patient = await db.patient.findUnique({ where: { id: patientId } });
  } else if (saveAsPatient !== false) {
    patient = await db.patient.upsert({
      where: {
        professionalId_phone: {
          professionalId: session.user.professionalId,
          phone: patientPhone,
        },
      },
      update: { name: patientName, ...(patientEmail ? { email: patientEmail } : {}) },
      create: {
        professionalId: session.user.professionalId,
        name: patientName,
        phone: patientPhone,
        email: patientEmail || null,
      },
    });
  }
  // Si saveAsPatient === false: patient queda null

  // Si no se paso email pero el paciente del listado tiene uno, lo usamos
  const finalEmail = patientEmail || patient?.email || null;

  const appointment = await db.appointment.create({
    data: {
      professionalId: session.user.professionalId,
      patientId: patient?.id || null,
      patientName,
      patientPhone,
      patientEmail: finalEmail,
      date: appointmentDate,
      durationMin: professional.sessionDuration,
      status: "confirmed",
      paymentStatus: "unpaid",
      totalAmount: professional.sessionPrice,
      depositAmount: Math.round(
        (professional.sessionPrice * professional.depositPercent) / 100
      ),
      notes: notes || null,
    },
  });

  // Email de confirmacion al paciente si tenemos email + opt-in
  if (shouldSendEmail && finalEmail) {
    const sessionEnd = new Date(
      appointmentDate.getTime() + appointment.durationMin * 60 * 1000
    );
    const calUrl = googleCalendarUrl({
      title: `Sesión con ${professional.name}`,
      description: `Turno reservado vía Agendify.${notes ? `\n\nNotas: ${notes}` : ""}`,
      start: appointmentDate,
      end: sessionEnd,
    });

    const tpl = EMAIL_TEMPLATES.bookingConfirmed({
      patientName,
      professionalName: professional.name,
      date: appointmentDate,
      durationMin: appointment.durationMin,
      depositAmount: appointment.depositAmount ?? 0,
      googleCalendarUrl: calUrl,
    });
    sendEmail({ to: finalEmail, ...tpl }).catch((err) =>
      console.error("[Turnos] Error email manual:", err)
    );
  }

  return NextResponse.json({ appointment }, { status: 201 });
}
