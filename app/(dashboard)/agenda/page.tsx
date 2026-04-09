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
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.professionalId) {
    redirect("/login");
  }

  const { date: dateParam } = await searchParams;
  const date = dateParam ? new Date(dateParam) : new Date();

  const appointments = await db.appointment.findMany({
    where: {
      professionalId: session.user.professionalId,
      date: {
        gte: startOfDay(date),
        lte: endOfDay(date),
      },
    },
    orderBy: { date: "asc" },
  });

  const serialized: SerializedAppointment[] = appointments.map((a) => ({
    id: a.id,
    patientName: a.patientName,
    patientPhone: a.patientPhone,
    date: a.date.toISOString(),
    durationMin: a.durationMin,
    status: a.status as SerializedAppointment["status"],
    paymentStatus: a.paymentStatus as SerializedAppointment["paymentStatus"],
    depositAmount: a.depositAmount,
    totalAmount: a.totalAmount,
    notes: a.notes,
  }));

  return (
    <>
      <Header />
      <AgendaClient
        appointments={serialized}
        initialDate={date.toISOString()}
      />
      <BottomNav />
    </>
  );
}
