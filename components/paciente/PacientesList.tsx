"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Phone, ChevronRight, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import NuevoPacienteModal from "./NuevoPacienteModal";

export interface SerializedPatient {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  status: "active" | "paused" | "discharged";
  createdAt: string;
  totalAppointments: number;
  lastAppointment: {
    date: string;
    status: string;
  } | null;
}

interface PacientesListProps {
  patients: SerializedPatient[];
}

const STATUS_FILTERS = [
  { key: "all", label: "Todos" },
  { key: "active", label: "Activos" },
  { key: "paused", label: "Pausados" },
  { key: "discharged", label: "Alta" },
] as const;

const PATIENT_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  active: { label: "Activo", bg: "bg-[#F0FDF4]", text: "text-success" },
  paused: { label: "Pausado", bg: "bg-[#FEF9EE]", text: "text-warning" },
  discharged: {
    label: "Alta",
    bg: "bg-surface",
    text: "text-text-secondary",
  },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter((w) => w.length > 0)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function PacientesList({ patients: initialPatients }: PacientesListProps) {
  const router = useRouter();
  const [patients, setPatients] = useState<SerializedPatient[]>(initialPatients);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = patients.filter((p) => {
    const matchesSearch =
      search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search);
    const matchesStatus =
      statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handlePatientCreated = (newPatient: SerializedPatient) => {
    setPatients((prev) =>
      [...prev, newPatient].sort((a, b) => a.name.localeCompare(b.name))
    );
  };

  return (
    <main className="flex-1 pb-[72px]">
      <div className="px-4 pt-4 pb-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-[20px] font-medium text-text-primary">
              Pacientes
            </h1>
            <span className="inline-flex items-center rounded-full bg-primary-light px-2.5 py-0.5 text-[12px] font-medium text-primary">
              {patients.length} pacientes
            </span>
          </div>
          <NuevoPacienteModal onCreated={handlePatientCreated} />
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search
            size={18}
            strokeWidth={1.5}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
          />
          <input
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-[44px] pl-10 pr-3 border border-border rounded-lg text-[14px] bg-background focus:border-primary focus:ring-0 focus:outline-none"
          />
        </div>

        {/* Status filter pills */}
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

      {/* Patient list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <Users size={40} strokeWidth={1.5} className="text-border mb-3" />
          <p className="text-[14px] text-text-secondary text-center">
            {search || statusFilter !== "all"
              ? `Sin resultados para "${search || STATUS_FILTERS.find((f) => f.key === statusFilter)?.label}"`
              : "Sin pacientes aún"}
          </p>
        </div>
      ) : (
        <div>
          {filtered.map((patient) => (
            <PatientRow
              key={patient.id}
              patient={patient}
              onClick={() => router.push(`/pacientes/${patient.id}`)}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function PatientRow({
  patient,
  onClick,
}: {
  patient: SerializedPatient;
  onClick: () => void;
}) {
  const config = PATIENT_STATUS_CONFIG[patient.status];
  const initials = getInitials(patient.name);

  const lastDate = patient.lastAppointment
    ? formatDate(patient.lastAppointment.date, "d MMM")
    : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 w-full px-4 py-3 border-b border-border text-left hover:bg-surface/50 transition-colors"
    >
      {/* Avatar */}
      <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-primary-light">
        <span className="text-[14px] font-medium text-primary">
          {initials}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-text-primary truncate">
          {patient.name}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <Phone size={11} strokeWidth={1.5} className="text-text-secondary shrink-0" />
          <span className="text-[12px] text-text-secondary">
            {patient.phone}
          </span>
        </div>
        <p className="text-[11px] text-text-secondary mt-0.5">
          {patient.totalAppointments} turnos
          {lastDate && ` · Último: ${lastDate}`}
        </p>
      </div>

      {/* Status badge */}
      <span
        className={cn(
          "shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
          config.bg,
          config.text
        )}
      >
        {config.label}
      </span>

      {/* Chevron */}
      <ChevronRight size={16} strokeWidth={1.5} className="shrink-0 text-border" />
    </button>
  );
}
