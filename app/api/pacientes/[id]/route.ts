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

  const patient = await db.patient.findFirst({
    where: {
      id,
      professionalId: session.user.professionalId,
    },
    include: {
      appointments: {
        orderBy: { date: "desc" },
        select: {
          id: true,
          date: true,
          status: true,
          paymentStatus: true,
          totalAmount: true,
          depositAmount: true,
          durationMin: true,
          notes: true,
        },
      },
    },
  });

  if (!patient) {
    return NextResponse.json(
      { error: "Paciente no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json({ patient });
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

  const patient = await db.patient.updateMany({
    where: {
      id,
      professionalId: session.user.professionalId,
    },
    data: body,
  });

  return NextResponse.json({ patient });
}
