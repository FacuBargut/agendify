"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import DateStrip from "@/components/agenda/DateStrip";
import AppointmentList from "@/components/agenda/AppointmentList";
import type { SerializedAppointment, Appointment, PaymentMethod } from "@/lib/types";

interface AgendaClientProps {
  appointments: SerializedAppointment[];
  initialDate: string;
  highlightId: string | null;
}

export default function AgendaClient({
  appointments,
  initialDate,
  highlightId,
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
    // Al cambiar de día desde el DateStrip limpiamos el highlight
    const dateStr = format(date, "yyyy-MM-dd");
    router.push(`/agenda?date=${dateStr}`);
  }

  return (
    <>
      <DateStrip onDateChange={handleDateChange} />
      <main className="flex-1 pb-[72px]">
        <AppointmentList
          appointments={parsed}
          selectedDate={selectedDate}
          highlightId={highlightId}
        />
      </main>
    </>
  );
}
