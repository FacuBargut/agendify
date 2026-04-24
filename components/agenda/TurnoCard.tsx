"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Phone, ChevronRight, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn, formatPeso } from "@/lib/utils";
import { StatusBadge, PaymentBadge } from "@/components/ui/Badge";
import type { Appointment, AppointmentStatus } from "@/lib/types";

const BORDER_COLOR: Record<AppointmentStatus, string> = {
  confirmed: "border-l-primary",
  pending: "border-l-warning",
  cancelled: "border-l-border",
  completed: "border-l-success",
  pending_transfer: "border-l-warning",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface TurnoCardProps {
  appointment: Appointment;
  onPress?: () => void;
  onStatusChange?: (id: string, newStatus: AppointmentStatus) => void;
  isHighlighted?: boolean;
}

export default function TurnoCard({ appointment, onPress, onStatusChange, isHighlighted = false }: TurnoCardProps) {
  const {
    id,
    patientName,
    patientPhone,
    date,
    durationMin,
    status,
    paymentStatus,
    depositAmount,
    totalAmount,
    paymentMethod,
    transferProofRef,
  } = appointment;

  const isCancelled = status === "cancelled";
  const isPendingTransfer = status === "pending_transfer";
  const time = format(date, "HH:mm");

  const [verifying, setVerifying] = useState<"confirmar" | "rechazar" | null>(null);
  const [localStatus, setLocalStatus] = useState<AppointmentStatus>(status);
  const [flashing, setFlashing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Scroll al turno y activar flash cuando viene desde una notificación
  useEffect(() => {
    if (!isHighlighted) return;
    // Pequeño delay para que el DOM esté listo
    const scrollTimer = setTimeout(() => {
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setFlashing(true);
    }, 150);
    // Apagar el flash después de 3 ciclos de animación (0.9s × 3 = 2.7s)
    const flashTimer = setTimeout(() => setFlashing(false), 3000);
    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(flashTimer);
    };
  }, [isHighlighted]);

  async function handleVerificar(action: "confirmar" | "rechazar") {
    setVerifying(action);
    try {
      const res = await fetch(`/api/turnos/${id}/verificar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Error al verificar");
      const newStatus: AppointmentStatus =
        action === "confirmar" ? "confirmed" : "cancelled";
      setLocalStatus(newStatus);
      onStatusChange?.(id, newStatus);
    } catch (err) {
      console.error("[TurnoCard] Error verificando transferencia:", err);
    } finally {
      setVerifying(null);
    }
  }

  function renderAmount() {
    if (!totalAmount) return null;
    if (paymentStatus === "paid") {
      return <span className="text-xs font-medium text-success">{formatPeso(totalAmount)}</span>;
    }
    if (paymentStatus === "deposit_paid" && depositAmount) {
      return <span className="text-xs font-medium text-warning">Seña: {formatPeso(depositAmount)}</span>;
    }
    return <span className="text-xs font-medium text-text-secondary">{formatPeso(totalAmount)}</span>;
  }

  // Si ya se resolvió localmente, mostrar estado actualizado
  const effectiveStatus = localStatus;
  const effectiveCancelled = effectiveStatus === "cancelled";
  const effectivePending = effectiveStatus === "pending_transfer";

  return (
    <div
      ref={cardRef}
      className={cn(
        "mb-2.5 w-full rounded-lg border border-border bg-background shadow-sm overflow-hidden",
        "border-l-4",
        BORDER_COLOR[effectiveStatus],
        effectiveCancelled && "border-dashed opacity-60",
        flashing && "turno-flash"
      )}
    >
      {/* Tarjeta principal (clickeable) */}
      <button
        type="button"
        onClick={onPress}
        className="w-full p-3.5 text-left transition-shadow hover:shadow-md"
      >
        {/* Top row */}
        <div className="flex items-start gap-3">
          {/* Time */}
          <div className="flex shrink-0 flex-col items-center pt-0.5">
            <span className="text-lg font-semibold leading-tight text-text-primary">
              {time}
            </span>
            <span className="text-[11px] text-text-secondary">{durationMin} min</span>
          </div>

          {/* Patient info */}
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-primary-light">
              <span className="text-[13px] font-medium text-primary">
                {getInitials(patientName)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-medium text-text-primary">
                {patientName}
              </p>
              <p className="flex items-center gap-1 text-xs text-text-secondary">
                <Phone size={12} strokeWidth={1.5} />
                {patientPhone}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <StatusBadge status={effectiveStatus} />
            <ChevronRight size={16} className="text-text-secondary" />
          </div>
        </div>

        {/* Bottom row — payment info */}
        {!effectiveCancelled && (
          <div className="mt-2.5 flex items-center justify-between border-t border-border pt-2.5">
            <PaymentBadge status={paymentStatus} />
            {renderAmount()}
          </div>
        )}
      </button>

      {/* Panel de verificación de transferencia */}
      {effectivePending && paymentMethod === "transferencia" && (
        <div className="border-t border-border bg-warning/5 px-3.5 py-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className="text-[12px] font-semibold text-warning">
                ⏳ Verificar transferencia
              </p>
              <p className="text-[11px] text-text-secondary mt-0.5">
                El paciente declaró haber transferido{" "}
                {depositAmount ? formatPeso(depositAmount) : "la seña"}.
              </p>
              {transferProofRef && (
                <p className="text-[11px] text-text-secondary mt-0.5">
                  Comprobante: <span className="font-medium text-text-primary">{transferProofRef}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleVerificar("confirmar")}
              disabled={!!verifying}
              className="flex flex-1 items-center justify-center gap-1.5 h-9 rounded-lg bg-success text-white text-[13px] font-medium disabled:opacity-60 transition-opacity hover:opacity-90"
            >
              {verifying === "confirmar"
                ? <Loader2 size={14} className="animate-spin" />
                : <CheckCircle2 size={14} />}
              Confirmar
            </button>
            <button
              type="button"
              onClick={() => handleVerificar("rechazar")}
              disabled={!!verifying}
              className="flex flex-1 items-center justify-center gap-1.5 h-9 rounded-lg border border-[#E24B4A] text-[#E24B4A] text-[13px] font-medium disabled:opacity-60 transition-opacity hover:bg-[#FEF0EF]"
            >
              {verifying === "rechazar"
                ? <Loader2 size={14} className="animate-spin" />
                : <XCircle size={14} />}
              Rechazar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
