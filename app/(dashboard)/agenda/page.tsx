import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { startOfDay, endOfDay } from "date-fns";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import AgendaClient from "@/components/agenda/AgendaClient";
import type { SerializedAppointment } from "@/lib/types";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; highlight?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.professionalId) {
    redirect("/login");
  }

  const { date: dateParam, highlight } = await searchParams;

  // Si viene ?highlight=appointmentId y no hay ?date,
  // buscamos la fecha del turno para mostrar el día correcto.
  let date = dateParam ? new Date(dateParam) : new Date();

  if (highlight && !dateParam) {
    const targetAppointment = await db.appointment.findFirst({
      where: {
        id: highlight,
        professionalId: session.user.professionalId,
      },
      select: { date: true },
    });
    if (targetAppointment) {
      date = targetAppointment.date;
    }
  }

  const appointments = await db.appointment.findMany({
    where: {
      professionalId: session.user.professionalId,
      date: {
        gte: startOfDay(date),
        lte: endOfDay(date),
      },
      status: { not: "cancelled" },
    },
    orderBy: { date: "asc" },
  });

  const serialized: SerializedAppointment[] = appointments.map(
    (a: typeof appointments[number]) => ({
      id: a.id,
      patientName: a.patientName,
      patientPhone: a.patientPhone,
      date: a.date.toISOString(),
      durationMin: a.durationMin,
      status: a.status as SerializedAppointment["status"],
      paymentStatus: a.paymentStatus as SerializedAppointment["paymentStatus"],
      paymentMethod: (a.paymentMethod ?? "mercadopago") as SerializedAppointment["paymentMethod"],
      depositAmount: a.depositAmount,
      totalAmount: a.totalAmount,
      notes: a.notes,
      transferProofRef: a.transferProofRef,
      transferExpiresAt: a.transferExpiresAt?.toISOString() ?? null,
    })
  );

  return (
    <>
      <Header />
      <AgendaClient
        appointments={serialized}
        initialDate={date.toISOString()}
        highlightId={highlight ?? null}
      />
      <BottomNav />
    </>
  );
}
