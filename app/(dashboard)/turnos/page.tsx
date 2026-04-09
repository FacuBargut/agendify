import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import TurnosList from "@/components/agenda/TurnosList";

export default async function TurnosPage() {
  const session = await auth();
  if (!session?.user?.professionalId) {
    redirect("/login");
  }

  const appointments = await db.appointment.findMany({
    where: {
      professionalId: session.user.professionalId,
    },
    orderBy: { date: "asc" },
    include: { patient: true },
  });

  const patients = await db.patient.findMany({
    where: { professionalId: session.user.professionalId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, phone: true },
  });

  const serialized = appointments.map((a) => ({
    id: a.id,
    patientId: a.patientId,
    patientName: a.patientName,
    patientPhone: a.patientPhone,
    date: a.date.toISOString(),
    durationMin: a.durationMin,
    status: a.status as "pending" | "confirmed" | "cancelled" | "completed",
    paymentStatus: a.paymentStatus as "unpaid" | "deposit_paid" | "paid",
    depositAmount: a.depositAmount,
    totalAmount: a.totalAmount,
    notes: a.notes,
  }));

  const serializedPatients = patients.map((p) => ({
    id: p.id,
    name: p.name,
    phone: p.phone,
  }));

  return (
    <>
      <Header />
      <TurnosList
        appointments={serialized}
        patients={serializedPatients}
        professionalSlug={session.user.slug}
      />
      <BottomNav />
    </>
  );
}
