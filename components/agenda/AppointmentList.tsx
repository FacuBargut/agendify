import { useMemo } from "react";
import { isSameDay } from "date-fns";
import { CalendarX2 } from "lucide-react";
import { formatPeso } from "@/lib/utils";
import TurnoCard from "@/components/agenda/TurnoCard";
import type { Appointment } from "@/lib/types";
import { incomeForAppointment } from "@/lib/appointmentStatus";

interface AppointmentListProps {
  appointments: Appointment[];
  selectedDate: Date;
  highlightId?: string | null;
  isLoading?: boolean;
}

export default function AppointmentList({
  appointments,
  selectedDate,
  highlightId,
  isLoading = false,
}: AppointmentListProps) {
  const filtered = useMemo(() => {
    return appointments
      .filter((a) => isSameDay(a.date, selectedDate))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [appointments, selectedDate]);

  if (isLoading) {
    return <AppointmentListSkeleton />;
  }

  const stats = useMemo(() => {
    const now = new Date();
    const active = filtered.filter((a) => a.status !== "cancelled");
    const confirmed = filtered.filter(
      (a) => a.status === "confirmed" || a.status === "completed"
    );
    // Cobrado del dia: turnos completados (o pendientes de revision pasados =
    // optimista) suman total. No-show suma solo la sena.
    const collected = filtered.reduce(
      (sum, a) => sum + incomeForAppointment(a, now),
      0
    );

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
          <TurnoCard
            key={appointment.id}
            appointment={appointment}
            isHighlighted={highlightId === appointment.id}
          />
        ))}
      </div>
    </div>
  );
}

function AppointmentListSkeleton() {
  return (
    <div>
      {/* Stats skeleton */}
      <div className="flex gap-2.5 px-4 py-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex flex-1 flex-col items-center rounded-[10px] border border-border bg-surface px-3 py-2.5"
          >
            <div className="h-7 w-12 rounded bg-border/60 animate-pulse" />
            <div className="mt-1.5 h-3 w-16 rounded bg-border/40 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Card skeletons */}
      <div className="px-4 space-y-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-background p-3.5 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <div className="h-5 w-10 rounded bg-border/60" />
                <div className="h-2.5 w-8 rounded bg-border/40" />
              </div>
              <div className="h-9 w-9 rounded-full bg-border/60" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-32 rounded bg-border/60" />
                <div className="h-2.5 w-24 rounded bg-border/40" />
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="h-4 w-16 rounded-full bg-border/40" />
                <div className="h-4 w-20 rounded-full bg-border/40" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
