import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import PacientesList from "@/components/paciente/PacientesList";

export default async function PacientesPage() {
  const session = await auth();
  if (!session?.user?.professionalId) {
    redirect("/login");
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

  const serialized = patients.map((p) => ({
    id: p.id,
    name: p.name,
    phone: p.phone,
    email: p.email,
    notes: p.notes,
    status: p.status as "active" | "paused" | "discharged",
    createdAt: p.createdAt.toISOString(),
    totalAppointments: p._count.appointments,
    lastAppointment: p.appointments[0]
      ? {
          date: p.appointments[0].date.toISOString(),
          status: p.appointments[0].status,
        }
      : null,
  }));

  return (
    <>
      <Header />
      <PacientesList patients={serialized} />
      <BottomNav />
    </>
  );
}
