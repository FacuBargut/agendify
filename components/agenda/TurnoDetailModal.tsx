"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Phone, User, Loader2, Check, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import type { AppointmentStatus, PaymentStatus } from "@/lib/types";
import type { TurnoSerialized } from "./TurnosList";
import { isPastSession, canCancel } from "@/lib/appointmentStatus";

interface TurnoDetailModalProps {
  turno: TurnoSerialized;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<TurnoSerialized>) => void;
}

const STATUSES: { key: AppointmentStatus; label: string }[] = [
  { key: "pending", label: "Pendiente" },
  { key: "confirmed", label: "Confirmado" },
  { key: "completed", label: "Completado" },
  { key: "no_show", label: "No asistió" },
];

const PAYMENT_STATUSES: { key: PaymentStatus; label: string }[] = [
  { key: "unpaid", label: "Sin pagar" },
  { key: "deposit_paid", label: "Seña pagada" },
  { key: "paid", label: "Pagado completo" },
];

export default function TurnoDetailModal({
  turno,
  open,
  onOpenChange,
  onUpdate,
}: TurnoDetailModalProps) {
  const router = useRouter();

  // ── Estado local (no se guarda hasta "Guardar cambios") ──────
  const [localStatus, setLocalStatus] = useState<AppointmentStatus>(turno.status);
  const [localPayment, setLocalPayment] = useState<PaymentStatus>(turno.paymentStatus);
  const [localNotes, setLocalNotes] = useState(turno.notes ?? "");
  const [saving, setSaving] = useState(false);

  // Resetear al abrir otro turno
  useEffect(() => {
    setLocalStatus(turno.status);
    setLocalPayment(turno.paymentStatus);
    setLocalNotes(turno.notes ?? "");
  }, [turno.id, turno.status, turno.paymentStatus, turno.notes]);

  // ── Detectar cambios ─────────────────────────────────────────
  const hasChanges =
    localStatus !== turno.status ||
    localPayment !== turno.paymentStatus ||
    localNotes !== (turno.notes ?? "");

  // ── Guardar ──────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (localStatus !== turno.status) body.status = localStatus;
      if (localPayment !== turno.paymentStatus) body.paymentStatus = localPayment;
      if (localNotes !== (turno.notes ?? "")) body.notes = localNotes;

      await fetch(`/api/turnos/${turno.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      onUpdate(turno.id, {
        status: localStatus,
        paymentStatus: localPayment,
        notes: localNotes,
      });
      onOpenChange(false);
    } catch {
      // silent — en un futuro podemos mostrar un toast de error
    } finally {
      setSaving(false);
    }
  }

  // ── Cancelar (cerrar sin guardar) ────────────────────────────
  function handleDiscard() {
    setLocalStatus(turno.status);
    setLocalPayment(turno.paymentStatus);
    setLocalNotes(turno.notes ?? "");
    onOpenChange(false);
  }

  const date = new Date(turno.date);
  const turnoForCheck = {
    date,
    durationMin: turno.durationMin,
    status: turno.status,
  };
  const isPast = isPastSession(turnoForCheck);
  const cancellable = canCancel(turnoForCheck);
  const showAttendanceButtons =
    isPast && turno.status !== "completed" && turno.status !== "no_show" && turno.status !== "cancelled";

  async function markAttendance(attendance: "attended" | "no_show") {
    setSaving(true);
    try {
      await fetch(`/api/turnos/${turno.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendance }),
      });
      const newStatus: AppointmentStatus = attendance === "attended" ? "completed" : "no_show";
      onUpdate(turno.id, { status: newStatus });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(open) => { if (!open) handleDiscard(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 animate-in fade-in-0" />
        <Dialog.Content className="fixed inset-x-4 bottom-0 top-auto z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-background p-5 pb-8 shadow-xl animate-in slide-in-from-bottom-4 sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md sm:rounded-2xl sm:bottom-auto">

          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <Dialog.Title className="text-[18px] font-medium text-text-primary">
                {turno.patientName}
              </Dialog.Title>
              <p className="text-[13px] text-text-secondary mt-0.5 capitalize">
                {formatDate(date, "EEEE d 'de' MMMM")} · {formatDate(date, "HH:mm")} hs · {turno.durationMin} min
              </p>
            </div>
            <button
              type="button"
              onClick={handleDiscard}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface"
              aria-label="Cerrar"
            >
              <X size={18} strokeWidth={1.5} className="text-text-secondary" />
            </button>
          </div>

          {/* Estado del turno */}
          <div className="mb-5">
            <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Estado del turno
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {STATUSES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setLocalStatus(s.key)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[12px] font-medium border transition-colors",
                    localStatus === s.key
                      ? "bg-primary text-white border-primary"
                      : "bg-background text-text-secondary border-border hover:border-primary/30"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pago */}
          <div className="mb-5">
            <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Estado del pago
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {PAYMENT_STATUSES.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setLocalPayment(p.key)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[12px] font-medium border transition-colors",
                    localPayment === p.key
                      ? "bg-primary text-white border-primary"
                      : "bg-background text-text-secondary border-border hover:border-primary/30"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Paciente */}
          <div className="mb-5">
            <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Paciente
            </p>
            <div className="rounded-lg border border-border p-3">
              <div className="flex items-center gap-2 mb-1">
                <User size={14} strokeWidth={1.5} className="text-text-secondary" />
                <span className="text-[14px] text-text-primary">{turno.patientName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} strokeWidth={1.5} className="text-text-secondary" />
                <span className="text-[14px] text-text-secondary">{turno.patientPhone}</span>
              </div>
              {turno.patientId && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    router.push(`/pacientes/${turno.patientId}`);
                  }}
                  className="mt-2 text-[13px] font-medium text-primary hover:underline"
                >
                  Ver ficha →
                </button>
              )}
            </div>
          </div>

          {/* Marcar asistencia — solo si la sesion ya termino */}
          {showAttendanceButtons && (
            <div className="mb-5 rounded-lg border border-primary/30 bg-primary-light/30 p-3">
              <p className="text-[12px] font-medium text-text-primary mb-2">
                ¿El paciente asistió a la sesión?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => markAttendance("attended")}
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-1 rounded-md bg-primary px-3 py-2 text-[12px] font-medium text-white disabled:opacity-60"
                >
                  <Check size={13} /> Asistió
                </button>
                <button
                  type="button"
                  onClick={() => markAttendance("no_show")}
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-1 rounded-md border border-[#E24B4A]/40 bg-white px-3 py-2 text-[12px] font-medium text-[#E24B4A] hover:bg-[#FEF0EF] disabled:opacity-60"
                >
                  <XCircle size={13} /> No vino
                </button>
              </div>
            </div>
          )}

          {/* Notas */}
          <div className="mb-6">
            <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Notas
            </p>
            <textarea
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              placeholder="Motivo de consulta u observaciones..."
              rows={3}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-[13px] resize-none focus:border-primary focus:outline-none"
            />
          </div>

          {/* Acciones */}
          <div className="flex gap-2.5">
            {/* Cancelar — cierra sin guardar */}
            <button
              type="button"
              onClick={handleDiscard}
              className="h-[44px] flex-1 rounded-lg border border-border text-[13px] font-medium text-text-secondary hover:bg-surface transition-colors"
            >
              Cancelar
            </button>

            {/* Guardar cambios */}
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className={cn(
                "h-[44px] flex-[2] rounded-lg text-[13px] font-medium transition-colors flex items-center justify-center gap-2",
                hasChanges && !saving
                  ? "bg-primary text-white hover:bg-primary/90"
                  : "bg-surface text-text-secondary cursor-not-allowed border border-border"
              )}
            >
              {saving ? (
                <><Loader2 size={14} className="animate-spin" /> Guardando...</>
              ) : (
                "Guardar cambios"
              )}
            </button>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
