import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.professionalId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const appointment = await db.appointment.findFirst({
    where: {
      id,
      professionalId: session.user.professionalId,
    },
    include: { patient: true },
  });

  if (!appointment) {
    return NextResponse.json(
      { error: "Turno no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json({ appointment });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.professionalId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const appointment = await db.appointment.updateMany({
    where: {
      id,
      professionalId: session.user.professionalId,
    },
    data: body,
  });

  return NextResponse.json({ appointment });
}
