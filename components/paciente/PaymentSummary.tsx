"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Lock, Loader2 } from "lucide-react";
import { formatPeso } from "@/lib/utils";

interface PaymentProfessional {
  name: string;
  specialty: string;
  sessionPrice: number;
  depositPercent: number;
  sessionDurationMin: number;
}

interface PaymentSummaryProps {
  professional: PaymentProfessional;
  professionalSlug: string;
  selectedDate: Date;
  selectedTime: string;
  patientName: string;
  patientPhone: string;
  notes?: string;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
  onPaymentReady: (initPoint: string) => void;
}

export default function PaymentSummary({
  professional,
  professionalSlug,
  selectedDate,
  selectedTime,
  patientName,
  patientPhone,
  notes,
  isLoading,
  setIsLoading,
  onPaymentReady,
}: PaymentSummaryProps) {
  const [error, setError] = useState<string | null>(null);

  const depositAmount = Math.round(
    professional.sessionPrice * (professional.depositPercent / 100)
  );
  const remaining = professional.sessionPrice - depositAmount;

  const dateStr = format(selectedDate, "EEEE d 'de' MMMM", { locale: es });

  async function handlePay() {
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/turnos/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professionalSlug,
          patientName,
          patientPhone,
          date: selectedDate.toISOString(),
          time: selectedTime,
          notes: notes || "",
          totalAmount: professional.sessionPrice,
          depositPercent: professional.depositPercent,
        }),
      });

      if (!res.ok) {
        throw new Error("API error");
      }

      const data = await res.json();
      onPaymentReady(data.initPoint);
      window.location.href = data.initPoint;
    } catch {
      setError("Hubo un error al procesar el pago. Intentá de nuevo.");
      setIsLoading(false);
    }
  }

  return (
    <div>
      {/* Summary card */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <Row label="Profesional" value={professional.name} />
        <Row label="Especialidad" value={professional.specialty} />
        <Row label="Fecha" value={dateStr} capitalize />
        <Row
          label="Horario"
          value={`${selectedTime} hs (${professional.sessionDurationMin} min)`}
        />
        <Row label="Paciente" value={patientName} />

        <div className="my-3 border-t border-border" />

        <Row label="Valor de la sesión" value={formatPeso(professional.sessionPrice)} />

        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-primary">
            Seña a pagar ahora ({professional.depositPercent}%)
          </span>
          <span className="text-base font-semibold text-primary">
            {formatPeso(depositAmount)}
          </span>
        </div>

        <p className="mt-2 text-xs text-text-secondary">
          El resto ({formatPeso(remaining)}) lo abonás en el consultorio
        </p>
      </div>

      {/* Pay button */}
      <button
        type="button"
        onClick={handlePay}
        disabled={isLoading}
        className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-80"
      >
        {isLoading ? (
          <>
            <Loader2 size={18} className="animate-spin text-white" />
            Procesando...
          </>
        ) : (
          <>
            <Lock size={14} />
            Pagar seña con Mercado Pago
          </>
        )}
      </button>

      {/* Error message */}
      {error && (
        <div
          className="mt-3 rounded-lg px-3 py-2.5 text-[13px]"
          style={{ backgroundColor: "#FEF0EF", color: "#E24B4A" }}
        >
          {error}
        </div>
      )}

      <p className="mt-3 text-center text-xs text-text-secondary">
        Pago 100% seguro · Confirmación instantánea
      </p>

      <p className="mt-2 text-center text-[11px] text-text-secondary">
        Visa · Mastercard · Débito · Mercado Pago
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  capitalize: cap,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[13px] text-text-secondary">{label}</span>
      <span className={`text-[13px] font-medium text-text-primary ${cap ? "capitalize" : ""}`}>
        {value}
      </span>
    </div>
  );
}
