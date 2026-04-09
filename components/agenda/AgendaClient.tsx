"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import DateStrip from "@/components/agenda/DateStrip";
import AppointmentList from "@/components/agenda/AppointmentList";
import type { SerializedAppointment, Appointment } from "@/lib/types";

interface AgendaClientProps {
  appointments: SerializedAppointment[];
  initialDate: string;
}

export default function AgendaClient({
  appointments,
  initialDate,
}: AgendaClientProps) {
  const router = useRouter();
  const selectedDate = new Date(initialDate);

  // Convert serialized appointments to Appointment type for AppointmentList
  const parsed: Appointment[] = useMemo(
    () =>
      appointments.map((a) => ({
        ...a,
        date: new Date(a.date),
        depositAmount: a.depositAmount ?? undefined,
        totalAmount: a.totalAmount ?? undefined,
        notes: a.notes ?? undefined,
      })),
    [appointments]
  );

  function handleDateChange(date: Date) {
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
        />
      </main>
    </>
  );
}
