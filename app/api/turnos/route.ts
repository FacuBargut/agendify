import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { startOfDay, endOfDay } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

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
  const { patientId, patientName, patientPhone, date, time, notes, sendWhatsApp, saveAsPatient } = body;

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
    // Turno para paciente existente del listado
    patient = await db.patient.findUnique({ where: { id: patientId } });
  } else if (saveAsPatient !== false) {
    // Paciente nuevo que el profesional quiere guardar en su listado
    // Usamos upsert por si ya existe uno con ese teléfono
    patient = await db.patient.upsert({
      where: {
        professionalId_phone: {
          professionalId: session.user.professionalId,
          phone: patientPhone,
        },
      },
      update: { name: patientName },
      create: {
        professionalId: session.user.professionalId,
        name: patientName,
        phone: patientPhone,
      },
    });
  }
  // Si saveAsPatient === false: patient queda null, el turno guarda
  // patientName/patientPhone directamente sin crear registro en Patient

  const appointment = await db.appointment.create({
    data: {
      professionalId: session.user.professionalId,
      patientId: patient?.id || null,
      patientName,
      patientPhone,
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

  // Send WhatsApp if requested
  if (sendWhatsApp) {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/send`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "confirmacion",
            patientPhone,
            patientName,
            professionalName: professional.name,
            professionalPhone: professional.phone,
            date,
            time,
            depositAmount: appointment.depositAmount,
            professionalSlug: professional.slug,
          }),
        }
      );
    } catch {
      // WhatsApp send failure should not block turno creation
    }
  }

  return NextResponse.json({ appointment }, { status: 201 });
}
