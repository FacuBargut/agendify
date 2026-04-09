import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import BottomNav from "@/components/layout/BottomNav";
import PacienteDetalle from "@/components/paciente/PacienteDetalle";

export default async function PacienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.professionalId) {
    redirect("/login");
  }

  const { id } = await params;

  const patient = await db.patient.findFirst({
    where: {
      id,
      professionalId: session.user.professionalId,
    },
    include: {
      professional: {
        select: { specialty: true },
      },
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
    redirect("/pacientes");
  }

  const serialized = {
    id: patient.id,
    name: patient.name,
    phone: patient.phone,
    email: patient.email,
    notes: patient.notes,
    status: patient.status as "active" | "paused" | "discharged",
    createdAt: patient.createdAt.toISOString(),
    specialty: patient.professional.specialty,
    appointments: patient.appointments.map((a) => ({
      id: a.id,
      date: a.date.toISOString(),
      status: a.status,
      paymentStatus: a.paymentStatus,
      totalAmount: a.totalAmount,
      depositAmount: a.depositAmount,
      durationMin: a.durationMin,
      notes: a.notes,
    })),
  };

  return (
    <>
      <PacienteDetalle patient={serialized} />
      <BottomNav />
    </>
  );
}
