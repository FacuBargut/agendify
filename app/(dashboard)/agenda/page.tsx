import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// Forzar render dinamico en cada request — sin esto el RSC payload puede
// quedar cacheado y mostrar turnos viejos cuando el profesional entra de
// nuevo despues de que un paciente reservo. La pagina ya es dinamica de
// hecho (usa cookies via auth()), pero lo declaramos explicito por las dudas.
export const dynamic = "force-dynamic";
export const revalidate = 0;
import { startOfDay, endOfDay, format } from "date-fns";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import AgendaClient from "@/components/agenda/AgendaClient";
import SetupCard from "@/components/agenda/SetupCard";
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

  // Datos del profesional para onboarding
  const professional = await db.professional.findUnique({
    where: { id: session.user.professionalId },
    select: {
      phone: true,
      transferAlias: true,
      slug: true,
      availability: { where: { active: true }, take: 1 },
    },
  });

  const onboardingSteps = {
    profileDone: !!professional?.phone,
    availabilityDone: (professional?.availability?.length ?? 0) > 0,
    cobroDone: !!professional?.transferAlias,
    slug: professional?.slug ?? session.user.slug,
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://www.agendify.com.ar",
  };

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

  // Pendientes de aprobacion — de CUALQUIER fecha. El profesional necesita
  // verlos siempre que entra a /agenda, no solo cuando esta parado en el dia
  // del turno reservado.
  const now = new Date();
  const pendingTransfers = await db.appointment.findMany({
    where: {
      professionalId: session.user.professionalId,
      status: "pending_transfer",
      OR: [
        { transferExpiresAt: null },
        { transferExpiresAt: { gt: now } },
      ],
    },
    orderBy: { date: "asc" },
  });

  // Turnos confirmados que ya pasaron pero estan dentro de la ventana de
  // revision (48hs). El profesional necesita marcar si el paciente asistio
  // o no para que el calculo de ingresos sea correcto.
  const REVIEW_WINDOW_MS = 48 * 60 * 60 * 1000;
  const reviewCutoff = new Date(now.getTime() - REVIEW_WINDOW_MS);
  const recentConfirmed = await db.appointment.findMany({
    where: {
      professionalId: session.user.professionalId,
      status: "confirmed",
      date: { gte: reviewCutoff, lte: now },
    },
    orderBy: { date: "desc" },
  });
  // Filtrar a los que ya pasaron (date + duration < now)
  const awaitingReview = recentConfirmed.filter(
    (a) => a.date.getTime() + a.durationMin * 60 * 1000 < now.getTime()
  );

  function serialize(a: (typeof appointments)[number]): SerializedAppointment {
    return {
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
    };
  }

  const serialized = appointments.map(serialize);
  const pendingSerialized = pendingTransfers.map(serialize);
  const awaitingReviewSerialized = awaitingReview.map(serialize);

  // Pasar la fecha como YYYY-MM-DD (no como ISO UTC) — el cliente la parsea
  // como medianoche local. Sin esto, en TZ negativos (AR = UTC-3) "abril 29
  // 00:00 UTC" se renderiza como "abril 28" local y isSameDay descarta los
  // turnos de ese dia.
  const initialDateStr = format(date, "yyyy-MM-dd");

  return (
    <>
      <Header />
      <AgendaClient
        appointments={serialized}
        pendingTransfers={pendingSerialized}
        awaitingReview={awaitingReviewSerialized}
        initialDateStr={initialDateStr}
        highlightId={highlight ?? null}
        onboardingSteps={onboardingSteps}
      />
      <BottomNav />
    </>
  );
}
