"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import DateStrip from "@/components/agenda/DateStrip";
import AppointmentList from "@/components/agenda/AppointmentList";
import SetupCard from "@/components/agenda/SetupCard";
import PushPermissionBanner from "@/components/agenda/PushPermissionBanner";
import type { SerializedAppointment, Appointment, PaymentMethod } from "@/lib/types";
import type { OnboardingSteps } from "@/components/agenda/SetupCard";

interface AgendaClientProps {
  appointments: SerializedAppointment[];
  initialDate: string;
  highlightId: string | null;
  onboardingSteps: OnboardingSteps;
}

export default function AgendaClient({
  appointments,
  initialDate,
  highlightId,
  onboardingSteps,
}: AgendaClientProps) {
  const router = useRouter();
  const selectedDate = new Date(initialDate);

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
        {/* Banners de onboarding */}
        <div className="pt-3">
          <PushPermissionBanner />
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
