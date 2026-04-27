"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as Tabs from "@radix-ui/react-tabs";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  Clock,
  Lock,
  Check,
  ChevronDown,
  CalendarDays,
  DollarSign,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatPeso } from "@/lib/utils";
import { StatusBadge, PaymentBadge } from "@/components/ui/Badge";
import type { AppointmentStatus, PaymentStatus } from "@/lib/types";

const SPECIALTY_LABELS: Record<string, string> = {
  psychology: "Psicología",
  kinesiology: "Kinesiología",
  nutrition: "Nutrición",
};

const PATIENT_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  active: { label: "Activo", bg: "bg-[#F0FDF4]", text: "text-success" },
  paused: { label: "Pausado", bg: "bg-[#FEF9EE]", text: "text-warning" },
  discharged: { label: "Alta", bg: "bg-surface", text: "text-text-secondary" },
};

interface SerializedAppointment {
  id: string;
  date: string;
  status: string;
  paymentStatus: string;
  totalAmount: number | null;
  depositAmount: number | null;
  durationMin: number;
  notes: string | null;
}

interface PatientData {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  status: "active" | "paused" | "discharged";
  createdAt: string;
  specialty: string;
  appointments: SerializedAppointment[];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter((w) => w.length > 0)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function PacienteDetalle({ patient }: { patient: PatientData }) {
  const router = useRouter();
  const [status, setStatus] = useState(patient.status);
  const [notes, setNotes] = useState(patient.notes || "");
  const [savedIndicator, setSavedIndicator] = useState(false);

  // Compute stats
  const nonCancelled = patient.appointments.filter(
    (a) => a.status !== "cancelled"
  );
  const completed = patient.appointments.filter(
    (a) => a.status === "completed"
  );
  const totalPaid = patient.appointments
    .filter((a) => a.paymentStatus === "paid")
    .reduce((sum, a) => sum + (a.totalAmount || 0), 0);

  // Split appointments into upcoming and past
  const now = new Date();
  const upcoming = patient.appointments
    .filter((a) => new Date(a.date) >= now && a.status !== "cancelled")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const past = patient.appointments
    .filter((a) => new Date(a.date) < now || a.status === "cancelled")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Status change handler
  const handleStatusChange = async (newStatus: "active" | "paused" | "discharged") => {
    setStatus(newStatus); // optimistic
    try {
      await fetch(`/api/pacientes/${patient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      setStatus(patient.status); // revert on error
    }
  };

  // Notes autosave with debounce
  const saveNotes = useCallback(
    async (value: string) => {
      try {
        await fetch(`/api/pacientes/${patient.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: value }),
        });
        setSavedIndicator(true);
        setTimeout(() => setSavedIndicator(false), 2000);
      } catch {
        // silent fail
      }
    },
    [patient.id]
  );

  useEffect(() => {
    if (notes === (patient.notes || "")) return;
    const timer = setTimeout(() => {
      saveNotes(notes);
    }, 1500);
    return () => clearTimeout(timer);
  }, [notes, patient.notes, saveNotes]);

  const statusConfig = PATIENT_STATUS_CONFIG[status];

  return (
    <main className="flex-1 pb-safe page-enter">
      {/* Back button */}
      <div className="px-4 pt-4">
        <button
          type="button"
          onClick={() => router.push("/pacientes")}
          className="flex items-center gap-1 text-[13px] text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
          Volver
        </button>
      </div>

      {/* Patient header */}
      <div className="flex flex-col items-center px-4 pt-4 pb-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary mb-3">
          <span className="text-[18px] font-medium text-white">
            {getInitials(patient.name)}
          </span>
        </div>
        <h1 className="text-[20px] font-medium text-text-primary mb-1">
          {patient.name}
        </h1>
        <p className="text-[12px] text-text-secondary mb-2">
          {SPECIALTY_LABELS[patient.specialty] || patient.specialty}
        </p>

        {/* Status dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-medium transition-colors",
                statusConfig.bg,
                statusConfig.text
              )}
            >
              {statusConfig.label}
              <ChevronDown size={12} strokeWidth={2} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              sideOffset={4}
              className="z-50 min-w-[140px] rounded-lg border border-border bg-background p-1 shadow-lg animate-in fade-in-0 zoom-in-95"
            >
              {(["active", "paused", "discharged"] as const).map((s) => {
                const c = PATIENT_STATUS_CONFIG[s];
                return (
                  <DropdownMenu.Item
                    key={s}
                    onSelect={() => handleStatusChange(s)}
                    className="flex items-center justify-between rounded-md px-3 py-2 text-[13px] outline-none cursor-pointer hover:bg-surface"
                  >
                    <span className={c.text}>{c.label}</span>
                    {status === s && (
                      <Check size={14} className="text-primary" />
                    )}
                  </DropdownMenu.Item>
                );
              })}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 px-4 mb-5">
        <div className="rounded-xl border border-border bg-background p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <CalendarDays size={16} strokeWidth={1.5} className="text-primary" />
          </div>
          <p className="text-[18px] font-medium text-text-primary">
            {nonCancelled.length}
          </p>
          <p className="text-[11px] text-text-secondary">Turnos</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <CheckCircle2 size={16} strokeWidth={1.5} className="text-success" />
          </div>
          <p className="text-[18px] font-medium text-text-primary">
            {completed.length}
          </p>
          <p className="text-[11px] text-text-secondary">Completados</p>
        </div>
        <div className="rounded-xl border border-border bg-background p-3 text-center">
          <div className="flex items-center justify-center mb-1">
            <DollarSign size={16} strokeWidth={1.5} className="text-primary" />
          </div>
          <p className="text-[18px] font-medium text-text-primary">
            {formatPeso(totalPaid)}
          </p>
          <p className="text-[11px] text-text-secondary">Abonado</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs.Root defaultValue="turnos">
        <Tabs.List className="flex border-b border-border px-4">
          {[
            { value: "turnos", label: "Turnos" },
            { value: "info", label: "Info" },
            { value: "notas", label: "Notas" },
          ].map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className={cn(
                "flex-1 py-3 text-center text-[14px] font-medium transition-colors border-b-2 -mb-px",
                "data-[state=active]:text-primary data-[state=active]:border-primary",
                "data-[state=inactive]:text-text-secondary data-[state=inactive]:border-transparent"
              )}
            >
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {/* Tab: Turnos */}
        <Tabs.Content value="turnos" className="px-4 pt-4">
          {patient.appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Calendar
                size={40}
                strokeWidth={1.5}
                className="text-border mb-3"
              />
              <p className="text-[14px] text-text-secondary">
                Sin turnos registrados
              </p>
            </div>
          ) : (
            <>
              {upcoming.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-[12px] font-medium text-text-secondary uppercase tracking-wide mb-3">
                    Próximos
                  </h3>
                  <div className="space-y-2">
                    {upcoming.map((a) => (
                      <AppointmentRow key={a.id} appointment={a} />
                    ))}
                  </div>
                </div>
              )}
              {past.length > 0 && (
                <div>
                  <h3 className="text-[12px] font-medium text-text-secondary uppercase tracking-wide mb-3">
                    Pasados
                  </h3>
                  <div className="space-y-2">
                    {past.map((a) => (
                      <AppointmentRow key={a.id} appointment={a} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </Tabs.Content>

        {/* Tab: Info */}
        <Tabs.Content value="info" className="px-4 pt-4">
          <div className="space-y-4">
            <InfoRow
              icon={<Phone size={16} strokeWidth={1.5} className="text-text-secondary" />}
              label="Teléfono"
              value={patient.phone}
            />
            <InfoRow
              icon={<Mail size={16} strokeWidth={1.5} className="text-text-secondary" />}
              label="Email"
              value={patient.email || "—"}
            />
            <InfoRow
              icon={<Clock size={16} strokeWidth={1.5} className="text-text-secondary" />}
              label="Paciente desde"
              value={formatDate(patient.createdAt, "d 'de' MMMM yyyy")}
            />
          </div>
        </Tabs.Content>

        {/* Tab: Notas */}
        <Tabs.Content value="notas" className="px-4 pt-4">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anotá observaciones relevantes sobre este paciente..."
            rows={6}
            className="w-full px-3 py-3 border border-border rounded-lg text-[14px] resize-none focus:border-primary focus:outline-none"
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              <Lock size={12} strokeWidth={1.5} className="text-text-secondary" />
              <span className="text-[12px] text-text-secondary">
                Solo vos podés ver estas notas
              </span>
            </div>
            {savedIndicator && (
              <span className="text-[12px] text-success flex items-center gap-1">
                <Check size={12} /> Guardado
              </span>
            )}
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </main>
  );
}

function AppointmentRow({ appointment }: { appointment: SerializedAppointment }) {
  const date = new Date(appointment.date);
  const dateStr = formatDate(date, "EEEE d 'de' MMMM");
  const timeStr = formatDate(date, "HH:mm");

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-background p-3">
      <div>
        <p className="text-[13px] font-medium text-text-primary capitalize">
          {dateStr} · {timeStr} hs
        </p>
        <p className="text-[11px] text-text-secondary mt-0.5">
          {appointment.durationMin} min
        </p>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={appointment.status as AppointmentStatus} />
        <PaymentBadge status={appointment.paymentStatus as PaymentStatus} />
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border last:border-0">
      {icon}
      <div>
        <p className="text-[11px] text-text-secondary">{label}</p>
        <p className="text-[14px] text-text-primary">{value}</p>
      </div>
    </div>
  );
}
