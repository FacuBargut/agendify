import { db } from "@/lib/db";
import { startOfDay, endOfDay, format, isToday } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import type { TimeSlot } from "@/lib/types";

function generateSlots(
  startTime: string,
  endTime: string,
  duration: number,
  bookedTimes: string[],
  isTodayDate: boolean
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);

  let current = startH * 60 + startM;
  const end = endH * 60 + endM;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  while (current + duration <= end) {
    const h = Math.floor(current / 60)
      .toString()
      .padStart(2, "0");
    const m = (current % 60).toString().padStart(2, "0");
    const time = `${h}:${m}`;

    const isPast = isTodayDate && current <= currentMinutes;
    const isBooked = bookedTimes.includes(time);

    slots.push({
      time,
      available: !isPast && !isBooked,
    });

    current += duration;
  }

  return slots;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const dateStr = searchParams.get("date");

  if (!slug || !dateStr) {
    return NextResponse.json(
      { error: "slug y date son requeridos" },
      { status: 400 }
    );
  }

  const date = new Date(dateStr);

  // Find professional
  const professional = await db.professional.findUnique({
    where: { slug },
  });

  if (!professional) {
    return NextResponse.json(
      { error: "Profesional no encontrado" },
      { status: 404 }
    );
  }

  // Get availability for this day of week
  const dayOfWeek = date.getDay(); // 0=Sun ... 6=Sat
  const availability = await db.availability.findUnique({
    where: {
      professionalId_dayOfWeek: {
        professionalId: professional.id,
        dayOfWeek,
      },
    },
  });

  if (!availability || !availability.active) {
    return NextResponse.json({
      slots: [],
      professional: {
        id: professional.id,
        name: professional.name,
        slug: professional.slug,
        specialty: professional.specialty,
        bio: professional.bio,
        sessionPrice: professional.sessionPrice,
        depositPercent: professional.depositPercent,
        sessionDuration: professional.sessionDuration,
      },
    });
  }

  // Find booked appointments for this date (not cancelled)
  const appointments = await db.appointment.findMany({
    where: {
      professionalId: professional.id,
      date: {
        gte: startOfDay(date),
        lte: endOfDay(date),
      },
      status: { not: "cancelled" },
    },
  });

  const bookedTimes = appointments.map((a: typeof appointments[number]) => format(a.date, "HH:mm"));

  const slots = generateSlots(
    availability.startTime,
    availability.endTime,
    availability.slotDuration,
    bookedTimes,
    isToday(date)
  );

  return NextResponse.json({
    slots,
    professional: {
      id: professional.id,
      name: professional.name,
      slug: professional.slug,
      specialty: professional.specialty,
      bio: professional.bio,
      sessionPrice: professional.sessionPrice,
      depositPercent: professional.depositPercent,
      sessionDuration: professional.sessionDuration,
    },
  });
}
