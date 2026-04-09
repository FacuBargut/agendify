import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

interface AvailabilityInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  active: boolean;
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.professionalId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { availability } = await request.json();
  const professionalId = session.user.professionalId;

  await db.$transaction(async (tx) => {
    await tx.availability.deleteMany({
      where: { professionalId },
    });

    if (availability.length > 0) {
      await tx.availability.createMany({
        data: availability.map((a: AvailabilityInput) => ({
          professionalId,
          dayOfWeek: a.dayOfWeek,
          startTime: a.startTime,
          endTime: a.endTime,
          slotDuration: a.slotDuration,
          active: a.active,
        })),
      });
    }
  });

  return NextResponse.json({ success: true });
}
