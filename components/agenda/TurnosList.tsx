"use client";

import { useState, useMemo } from "react";
import {
  isToday,
  isTomorrow,
  isSameDay,
  startOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
} from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Phone, CalendarX2 } from "lucide-react";
import { cn, formatPeso, formatDate } from "@/lib/utils";
import { StatusBadge, PaymentBadge } from "@/components/ui/Badge";
import TurnoDetailModal from "./TurnoDetailModal";
import NuevoTurnoModal from "./NuevoTurnoModal";
import type { AppointmentStatus, PaymentStatus } from "@/lib/types";

export interface TurnoSerialized {
  id: string;
  patientId: string | null;
  patientName: string;
  patientPhone: string;
  date: string;
  durationMin: number;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  depositAmount: number | null;
  totalAmount: number | null;
  notes: string | null;
}

export interface PatientOption {
  id: string;
  name: string;
  phone: string;
}

interface TurnosListProps {
  appointments: TurnoSerialized[];
  patients: PatientOption[];
  professionalSlug: string;
}

const STATUS_FILTERS = [
  { key: "all", label: "Todos" },
  { key: "confirmed", label: "Confirmados" },
  { key: "pending", label: "Pendientes" },
  { key: "cancelled", label: "Cancelados" },
] as const;

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter((w) => w.length > 0)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getDayLabel(date: Date): string {
  if (isToday(date)) return `Hoy — ${formatDate(date, "EEEE d 'de' MMMM")}`;
  if (isTomorrow(date))
    return `Mañana — ${formatDate(date, "EEEE d 'de' MMMM")}`;
  return formatDate(date, "EEEE d 'de' MMMM");
}

export default function TurnosList({
  appointments: initialAppointments,
  patients,
  professionalSlug,
}: TurnosListProps) {
  const [appointments, setAppointments] =
    useState<TurnoSerialized[]>(initialAppointments);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTurno, setSelectedTurno] = useState<TurnoSerialized | null>(
    null
  );

  // Filtered list
  const filtered = useMemo(() => {
    return appointments.filter(
      (a) => statusFilter === "all" || a.status === statusFilter
    );
  }, [appointments, statusFilter]);

  // Group by day
  const grouped = useMemo(() => {
    const groups: { key: string; label: string; items: TurnoSerialized[] }[] =
      [];
    const map = new Map<string, TurnoSerialized[]>();

    for (const a of filtered) {
      const dayKey = startOfDay(new Date(a.date)).toISOString();
      if (!map.has(dayKey)) map.set(dayKey, []);
      map.get(dayKey)!.push(a);
    }

    // Sort groups by date
    const sortedKeys = [...map.keys()].sort();
    for (const key of sortedKeys) {
      const items = map.get(key)!;
      items.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      groups.push({
        key,
        label: getDayLabel(new Date(key)),
        items,
      });
    }

    return groups;
  }, [filtered]);

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const todayCount = appointments.filter(
      (a) => isToday(new Date(a.date)) && a.status !== "cancelled"
    ).length;

    const weekCount = appointments.filter((a) => {
      const d = new Date(a.date);
      return d >= weekStart && d <= weekEnd && a.status !== "cancelled";
    }).length;

    const pendingCount = appointments.filter(
      (a) => a.status === "pending"
    ).length;

    const monthIncome = appointments
      .filter((a) => {
        const d = new Date(a.date);
        return (
          d >= monthStart && d <= monthEnd && a.paymentStatus === "paid"
        );
      })
      .reduce((sum, a) => sum + (a.totalAmount || 0), 0);

    return { todayCount, weekCount, pendingCount, monthIncome };
  }, [appointments]);

  // Handlers
  const handleTurnoUpdate = (
    id: string,
    updates: Partial<TurnoSerialized>
  ) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
    if (selectedTurno?.id === id) {
      setSelectedTurno((prev) => (prev ? { ...prev, ...updates } : prev));
    }
  };

  const handleTurnoCreated = (turno: TurnoSerialized) => {
    setAppointments((prev) =>
      [...prev, turno].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )
    );
  };

  const handleCancelTurno = async (id: string) => {
    // Actualización optimista
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "cancelled" as AppointmentStatus } : a))
    );
    try {
      await fetch(`/api/turnos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
    } catch {
      // Revertir en caso de error
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: a.status } : a))
      );
    }
  };

  return (
    <main className="flex-1 pb-[72px]">
      <div className="px-4 pt-4 pb-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[20px] font-medium text-text-primary">Turnos</h1>
          <NuevoTurnoModal
            patients={patients}
            professionalSlug={professionalSlug}
            onCreated={handleTurnoCreated}
          />
        </div>

        {/* Stats 2x2 */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <div className="rounded-[10px] border border-border bg-surface p-3">
            <p className="text-[22px] font-semibold text-text-primary">
              {stats.todayCount}
            </p>
            <p className="text-[11px] text-text-secondary">Turnos hoy</p>
          </div>
          <div className="rounded-[10px] border border-border bg-surface p-3">
            <p className="text-[22px] font-semibold text-text-primary">
              {stats.weekCount}
            </p>
            <p className="text-[11px] text-text-secondary">Esta semana</p>
          </div>
          <div className="rounded-[10px] border border-border bg-surface p-3">
            <p className="text-[22px] font-semibold text-warning">
              {stats.pendingCount}
            </p>
            <p className="text-[11px] text-text-secondary">Pendientes</p>
          </div>
          <div className="rounded-[10px] border border-border bg-surface p-3">
            <p className="text-[22px] font-semibold text-success">
              {formatPeso(stats.monthIncome)}
            </p>
            <p className="text-[11px] text-text-secondary">Ingresos del mes</p>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-3">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors border",
                statusFilter === f.key
                  ? "bg-primary text-white border-primary"
                  : "bg-background text-text-secondary border-border hover:border-primary/30"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grouped list */}
      {grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <CalendarX2
            size={40}
            strokeWidth={1.5}
            className="text-border mb-3"
          />
          <p className="text-[14px] text-text-secondary text-center">
            {statusFilter !== "all"
              ? `Sin turnos ${STATUS_FILTERS.find((f) => f.key === statusFilter)?.label.toLowerCase()}`
              : "Sin turnos registrados"}
          </p>
        </div>
      ) : (
        <div className="px-4">
          {grouped.map((group) => (
            <div key={group.key} className="mb-4">
              {/* Day header */}
              <div className="flex items-center gap-3 py-2 mb-1">
                <span className="shrink-0 text-[12px] font-medium text-text-secondary capitalize">
                  {group.label}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Turno cards */}
              {group.items.map((turno) => (
                <TurnoCompactCard
                  key={turno.id}
                  turno={turno}
                  onClick={() => setSelectedTurno(turno)}
                  onCancelTurno={handleCancelTurno}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selectedTurno && (
        <TurnoDetailModal
          turno={selectedTurno}
          open={!!selectedTurno}
          onOpenChange={(open) => {
            if (!open) setSelectedTurno(null);
          }}
          onUpdate={handleTurnoUpdate}
        />
      )}
    </main>
  );
}

// Compact turno card for the list
function TurnoCompactCard({
  turno,
  onClick,
  onCancelTurno,
}: {
  turno: TurnoSerialized;
  onClick: () => void;
  onCancelTurno: (id: string) => void;
}) {
  const date = new Date(turno.date);
  const time = format(date, "HH:mm");
  const isCancelled = turno.status === "cancelled";

  function handleCancel(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`¿Cancelar el turno de ${turno.patientName}?`)) return;
    onCancelTurno(turno.id);
  }

  return (
    <div
      className={cn(
        "mb-2 w-full rounded-lg border border-border bg-background shadow-sm overflow-hidden",
        "border-l-4",
        turno.status === "confirmed" && "border-l-primary",
        turno.status === "pending" && "border-l-warning",
        turno.status === "cancelled" && "border-l-border",
        turno.status === "completed" && "border-l-success",
        turno.status === "pending_transfer" && "border-l-warning",
        isCancelled && "border-dashed opacity-60"
      )}
    >
      {/* Área principal clickeable */}
      <button
        type="button"
        onClick={onClick}
        className="w-full px-3.5 py-3 text-left transition-colors hover:bg-surface"
      >
        <div className="flex items-center gap-3">
          {/* Hora */}
          <div className="flex shrink-0 flex-col items-center">
            <span className="text-lg font-semibold leading-tight text-text-primary">
              {time}
            </span>
            <span className="text-[11px] text-text-secondary">
              {turno.durationMin} min
            </span>
          </div>

          {/* Paciente */}
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full bg-primary-light">
              <span className="text-[12px] font-medium text-primary">
                {getInitials(turno.patientName)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-medium text-text-primary">
                {turno.patientName}
              </p>
              <p className="flex items-center gap-1 text-[11px] text-text-secondary">
                <Phone size={10} strokeWidth={1.5} />
                {turno.patientPhone}
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex shrink-0 flex-col items-end gap-1">
            <StatusBadge status={turno.status} />
            {!isCancelled && <PaymentBadge status={turno.paymentStatus} />}
          </div>
        </div>
      </button>

      {/* Cancelar turno — sutil, solo si no está ya cancelado */}
      {!isCancelled && (
        <div className="border-t border-border/60 px-3.5 py-1.5">
          <button
            type="button"
            onClick={handleCancel}
            className="text-[11px] text-text-secondary hover:text-[#E24B4A] transition-colors"
          >
            × Cancelar turno
          </button>
        </div>
      )}
    </div>
  );
}
