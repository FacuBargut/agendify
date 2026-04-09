"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  X,
  Phone,
  User,
  Send,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { StatusBadge, PaymentBadge } from "@/components/ui/Badge";
import type { AppointmentStatus, PaymentStatus } from "@/lib/types";
import type { TurnoSerialized } from "./TurnosList";

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
  { key: "cancelled", label: "Cancelado" },
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
  const [notes, setNotes] = useState(turno.notes || "");
  const [editingNotes, setEditingNotes] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);
  const [savedIndicator, setSavedIndicator] = useState(false);

  // Sync notes when turno changes
  useEffect(() => {
    setNotes(turno.notes || "");
    setEditingNotes(false);
  }, [turno.id, turno.notes]);

  // Status change
  const handleStatusChange = async (newStatus: AppointmentStatus) => {
    onUpdate(turno.id, { status: newStatus }); // optimistic
    try {
      await fetch(`/api/turnos/${turno.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      onUpdate(turno.id, { status: turno.status }); // revert
    }
  };

  // Payment status change
  const handlePaymentChange = async (newPayment: PaymentStatus) => {
    onUpdate(turno.id, { paymentStatus: newPayment }); // optimistic
    try {
      await fetch(`/api/turnos/${turno.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: newPayment }),
      });
    } catch {
      onUpdate(turno.id, { paymentStatus: turno.paymentStatus }); // revert
    }
  };

  // Notes autosave
  const saveNotes = useCallback(
    async (value: string) => {
      try {
        await fetch(`/api/turnos/${turno.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: value }),
        });
        onUpdate(turno.id, { notes: value });
        setSavedIndicator(true);
        setTimeout(() => setSavedIndicator(false), 2000);
      } catch {
        // silent
      }
    },
    [turno.id, onUpdate]
  );

  useEffect(() => {
    if (!editingNotes) return;
    if (notes === (turno.notes || "")) return;
    const timer = setTimeout(() => saveNotes(notes), 1500);
    return () => clearTimeout(timer);
  }, [notes, turno.notes, editingNotes, saveNotes]);

  // Send reminder
  const handleSendReminder = async () => {
    try {
      await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "recordatorio48h",
          patientPhone: turno.patientPhone,
          patientName: turno.patientName,
        }),
      });
      setReminderSent(true);
      setTimeout(() => setReminderSent(false), 3000);
    } catch {
      // silent
    }
  };

  // Cancel turno
  const handleCancel = () => {
    if (!confirm(`¿Cancelar el turno de ${turno.patientName}?`)) return;
    handleStatusChange("cancelled");
    onOpenChange(false);
  };

  const date = new Date(turno.date);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 animate-in fade-in-0" />
        <Dialog.Content className="fixed inset-x-4 bottom-0 top-auto z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-background p-5 pb-8 shadow-xl animate-in slide-in-from-bottom-4 sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md sm:rounded-2xl sm:bottom-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <Dialog.Title className="text-[18px] font-medium text-text-primary">
                {turno.patientName}
              </Dialog.Title>
              <p className="text-[13px] text-text-secondary mt-0.5 capitalize">
                {formatDate(date, "EEEE d 'de' MMMM")} · {formatDate(date, "HH:mm")} hs
              </p>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface"
                aria-label="Cerrar"
              >
                <X size={18} strokeWidth={1.5} className="text-text-secondary" />
              </button>
            </Dialog.Close>
          </div>

          {/* Status section */}
          <div className="mb-5">
            <p className="text-[12px] font-medium text-text-secondary uppercase tracking-wide mb-2">
              Estado del turno
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {STATUSES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => handleStatusChange(s.key)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[12px] font-medium border transition-colors",
                    turno.status === s.key
                      ? "bg-primary text-white border-primary"
                      : "bg-background text-text-secondary border-border hover:border-primary/30"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Payment section */}
          <div className="mb-5">
            <p className="text-[12px] font-medium text-text-secondary uppercase tracking-wide mb-2">
              Pago
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {PAYMENT_STATUSES.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => handlePaymentChange(p.key)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[12px] font-medium border transition-colors",
                    turno.paymentStatus === p.key
                      ? "bg-primary text-white border-primary"
                      : "bg-background text-text-secondary border-border hover:border-primary/30"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Patient section */}
          <div className="mb-5">
            <p className="text-[12px] font-medium text-text-secondary uppercase tracking-wide mb-2">
              Paciente
            </p>
            <div className="rounded-lg border border-border p-3">
              <div className="flex items-center gap-2 mb-1">
                <User size={14} strokeWidth={1.5} className="text-text-secondary" />
                <span className="text-[14px] text-text-primary">
                  {turno.patientName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} strokeWidth={1.5} className="text-text-secondary" />
                <span className="text-[14px] text-text-secondary">
                  {turno.patientPhone}
                </span>
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

          {/* Notes section */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] font-medium text-text-secondary uppercase tracking-wide">
                Notas
              </p>
              {savedIndicator && (
                <span className="text-[11px] text-success flex items-center gap-1">
                  <Check size={11} /> Guardado
                </span>
              )}
            </div>
            {editingNotes ? (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Motivo de consulta u observaciones..."
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg text-[13px] resize-none focus:border-primary focus:outline-none"
                autoFocus
              />
            ) : (
              <div>
                {notes ? (
                  <p className="text-[13px] text-text-primary mb-1">{notes}</p>
                ) : (
                  <p className="text-[13px] text-text-secondary italic mb-1">
                    Sin notas
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setEditingNotes(true)}
                  className="text-[12px] font-medium text-primary hover:underline"
                >
                  {notes ? "Editar notas" : "Agregar notas"}
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleSendReminder}
              disabled={reminderSent}
              className={cn(
                "flex-1 h-[42px] rounded-lg border text-[13px] font-medium flex items-center justify-center gap-2 transition-colors",
                reminderSent
                  ? "border-success text-success"
                  : "border-primary text-primary hover:bg-primary-light"
              )}
            >
              {reminderSent ? (
                <>
                  <Check size={14} /> Enviado
                </>
              ) : (
                <>
                  <Send size={14} /> Enviar recordatorio
                </>
              )}
            </button>

            {turno.status !== "cancelled" && (
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 h-[42px] rounded-lg border border-[#E24B4A] text-[#E24B4A] text-[13px] font-medium hover:bg-[#FEF0EF] transition-colors"
              >
                Cancelar turno
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
