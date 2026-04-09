import { useMemo } from "react";
import { isSameDay } from "date-fns";
import { CalendarX2 } from "lucide-react";
import { formatPeso } from "@/lib/utils";
import TurnoCard from "@/components/agenda/TurnoCard";
import type { Appointment } from "@/lib/types";

interface AppointmentListProps {
  appointments: Appointment[];
  selectedDate: Date;
}

export default function AppointmentList({
  appointments,
  selectedDate,
}: AppointmentListProps) {
  const filtered = useMemo(() => {
    return appointments
      .filter((a) => isSameDay(a.date, selectedDate))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [appointments, selectedDate]);

  const stats = useMemo(() => {
    const active = filtered.filter((a) => a.status !== "cancelled");
    const confirmed = filtered.filter(
      (a) => a.status === "confirmed" || a.status === "completed"
    );
    const collected = filtered
      .filter((a) => a.paymentStatus === "paid" && a.totalAmount)
      .reduce((sum, a) => sum + (a.totalAmount ?? 0), 0);

    return {
      total: active.length,
      confirmed: confirmed.length,
      collected,
    };
  }, [filtered]);

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-12">
        <CalendarX2 size={40} strokeWidth={1.5} className="text-border" />
        <p className="mt-3 text-sm text-text-secondary">
          Sin turnos para este día
        </p>
        <p className="mt-1 text-xs text-text-secondary">
          Compartí tu link para recibir reservas
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Stats */}
      <div className="flex gap-2.5 px-4 py-4">
        <div className="flex flex-1 flex-col items-center rounded-[10px] border border-border bg-surface px-3 py-2.5">
          <span className="text-[22px] font-semibold leading-tight text-text-primary">
            {stats.total}
          </span>
          <span className="text-[11px] text-text-secondary">Turnos</span>
        </div>
        <div className="flex flex-1 flex-col items-center rounded-[10px] border border-border bg-surface px-3 py-2.5">
          <span className="text-[22px] font-semibold leading-tight text-primary">
            {stats.confirmed}
          </span>
          <span className="text-[11px] text-text-secondary">Confirmados</span>
        </div>
        <div className="flex flex-1 flex-col items-center rounded-[10px] border border-border bg-surface px-3 py-2.5">
          <span className="text-[22px] font-semibold leading-tight text-success">
            {formatPeso(stats.collected)}
          </span>
          <span className="text-[11px] text-text-secondary">Cobrado</span>
        </div>
      </div>

      {/* List */}
      <div className="px-4">
        {filtered.map((appointment) => (
          <TurnoCard key={appointment.id} appointment={appointment} />
        ))}
      </div>
    </div>
  );
}
