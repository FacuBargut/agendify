import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.professionalId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const patients = await db.patient.findMany({
    where: { professionalId: session.user.professionalId },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { appointments: true } },
      appointments: {
        orderBy: { date: "desc" },
        take: 1,
        select: { date: true, status: true },
      },
    },
  });

  return NextResponse.json({ patients });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.professionalId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { name, phone, email, notes, status } = body;

  if (!name || !phone) {
    return NextResponse.json(
      { error: "Nombre y teléfono son requeridos" },
      { status: 400 }
    );
  }

  // Verificar duplicado antes de crear
  const existing = await db.patient.findFirst({
    where: {
      professionalId: session.user.professionalId,
      phone,
    },
    select: { id: true, name: true },
  });

  if (existing) {
    return NextResponse.json(
      { error: `Ya existe un paciente con ese teléfono (${existing.name})` },
      { status: 409 }
    );
  }

  const patient = await db.patient.create({
    data: {
      professionalId: session.user.professionalId,
      name,
      phone,
      email: email || null,
      notes: notes || null,
      status: status || "active",
    },
  });

  return NextResponse.json({ patient }, { status: 201 });
}
