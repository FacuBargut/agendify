"use client";

import { useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import DateStrip from "@/components/agenda/DateStrip";
import AppointmentList from "@/components/agenda/AppointmentList";
import SetupCard from "@/components/agenda/SetupCard";
import PushPermissionBanner from "@/components/agenda/PushPermissionBanner";
import PendingTransfersBanner from "@/components/agenda/PendingTransfersBanner";
import type { SerializedAppointment, Appointment, PaymentMethod } from "@/lib/types";
import type { OnboardingSteps } from "@/components/agenda/SetupCard";

interface AgendaClientProps {
  appointments: SerializedAppointment[];
  pendingTransfers: SerializedAppointment[];
  initialDate: string;
  highlightId: string | null;
  onboardingSteps: OnboardingSteps;
}

export default function AgendaClient({
  appointments,
  pendingTransfers,
  initialDate,
  highlightId,
  onboardingSteps,
}: AgendaClientProps) {
  const router = useRouter();
  const selectedDate = new Date(initialDate);

  // Refrescar la agenda cuando:
  //   1. El componente monta (entrada/navegacion a /agenda)
  //   2. La PWA vuelve a foreground (visibilitychange)
  //   3. La ventana recupera el foco (focus)
  // El App Router cachea el RSC payload en el cliente, asi que sin
  // router.refresh() seguimos viendo turnos viejos al volver.
  useEffect(() => {
    router.refresh();

    const onVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [router]);

  const parsed: Appointment[] = useMemo(
    () =>
      appointments.map((a) => ({
        ...a,
        date: new Date(a.date),
        depositAmount: a.depositAmount ?? undefined,
        totalAmount: a.totalAmount ?? undefined,
        notes: a.notes ?? undefined,
        paymentMethod: (a.paymentMethod ?? "mercadopago") as PaymentMethod,
        transferProofRef: a.transferProofRef ?? undefined,
        transferExpiresAt: a.transferExpiresAt ? new Date(a.transferExpiresAt) : undefined,
      })),
    [appointments]
  );

  function handleDateChange(date: Date) {
    const dateStr = format(date, "yyyy-MM-dd");
    router.push(`/agenda?date=${dateStr}`);
  }

  return (
    <div className="page-enter">
      <DateStrip onDateChange={handleDateChange} />
      <main className="flex-1 pb-safe">
        {/* Banners */}
        <div className="pt-3">
          <PushPermissionBanner />
          <PendingTransfersBanner pending={pendingTransfers} />
          <SetupCard steps={onboardingSteps} />
        </div>
        <AppointmentList
          appointments={parsed}
          selectedDate={selectedDate}
          highlightId={highlightId}
        />
      </main>
    </div>
  );
}
