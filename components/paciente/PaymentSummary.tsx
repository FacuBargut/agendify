"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Lock, Loader2, Copy, Check } from "lucide-react";
import { formatPeso } from "@/lib/utils";
import type { PaymentMethod } from "@/lib/types";

interface PaymentProfessional {
  name: string;
  specialty: string;
  sessionPrice: number;
  depositPercent: number;
  sessionDurationMin: number;
  transferAlias?: string | null;
  mpSurchargePercent?: number;
  slug: string;
}

interface PaymentSummaryProps {
  professional: PaymentProfessional;
  professionalSlug: string;
  selectedDate: Date;
  selectedTime: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  notes?: string;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
  onPaymentReady: (initPoint: string) => void;
  // Recibe el monto de la seña transferida para que el padre muestre la vista de éxito
  onTransferDone: (depositAmount: number) => void;
}

export default function PaymentSummary({
  professional,
  professionalSlug,
  selectedDate,
  selectedTime,
  patientName,
  patientPhone,
  patientEmail,
  notes,
  isLoading,
  setIsLoading,
  onPaymentReady,
  onTransferDone,
}: PaymentSummaryProps) {
  // ── Cálculos de precios ───────────────────────────────
  const surcharge = professional.mpSurchargePercent ?? 0;
  const baseDeposit = Math.round(
    professional.sessionPrice * (professional.depositPercent / 100)
  );
  const mpDeposit = surcharge > 0
    ? Math.round(baseDeposit * (1 + surcharge / 100))
    : baseDeposit;
  const remaining = professional.sessionPrice - baseDeposit;

  const hasTransfer = Boolean(professional.transferAlias);

  // Si hay transferencia disponible, la mostramos primero (sin recargo)
  const [method, setMethod] = useState<PaymentMethod>(
    hasTransfer ? "transferencia" : "mercadopago"
  );

  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [proofRef, setProofRef] = useState("");

  const dateStr = format(selectedDate, "EEEE d 'de' MMMM", { locale: es });
  const depositShown = method === "mercadopago" ? mpDeposit : baseDeposit;

  // ── Copiar alias ──────────────────────────────────────
  function copyAlias() {
    navigator.clipboard.writeText(professional.transferAlias!).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── Flow Mercado Pago ─────────────────────────────────
  async function handleMP() {
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
          patientEmail,
          date: selectedDate.toISOString(),
          time: selectedTime,
          notes: notes || "",
          totalAmount: professional.sessionPrice,
          depositPercent: professional.depositPercent,
          mpSurchargePercent: surcharge,
        }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      onPaymentReady(data.initPoint);
      window.location.href = data.initPoint;
    } catch {
      setError("Hubo un error al procesar el pago. Intentá de nuevo.");
      setIsLoading(false);
    }
  }

  // ── Flow Transferencia ────────────────────────────────
  async function handleTransfer() {
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/turnos/transferencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professionalSlug,
          patientName,
          patientPhone,
          patientEmail,
          date: selectedDate.toISOString(),
          time: selectedTime,
          notes: notes || "",
          totalAmount: professional.sessionPrice,
          depositAmount: baseDeposit,
          transferProofRef: proofRef.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error || "Error al registrar la solicitud."
        );
      }
      // El padre (BookingFlow) maneja la vista de éxito
      onTransferDone(baseDeposit);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al registrar la solicitud.");
      setIsLoading(false);
    }
  }

  return (
    <div>

      {/* ── Selector de método ── */}
      {hasTransfer && (
        <div className="mb-5">
          <p className="mb-2 text-[13px] font-medium text-text-primary">
            ¿Cómo querés abonar la seña?
          </p>
          <div className="grid grid-cols-2 gap-2">
            {/* Transferencia */}
            <button
              type="button"
              onClick={() => setMethod("transferencia")}
              className={`rounded-xl border-2 p-3 text-left transition-all ${
                method === "transferencia"
                  ? "border-primary bg-primary-light"
                  : "border-border bg-background hover:border-text-secondary"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[13px] font-semibold ${method === "transferencia" ? "text-primary" : "text-text-primary"}`}>
                  Transferencia
                </span>
                {method === "transferencia" && (
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                    <Check size={10} className="text-white" strokeWidth={3} />
                  </div>
                )}
              </div>
              <p className={`text-[18px] font-bold ${method === "transferencia" ? "text-primary" : "text-text-primary"}`}>
                {formatPeso(baseDeposit)}
              </p>
              <p className="mt-0.5 text-[11px] text-success font-medium">
                Sin recargo
              </p>
            </button>

            {/* Mercado Pago */}
            <button
              type="button"
              onClick={() => setMethod("mercadopago")}
              className={`rounded-xl border-2 p-3 text-left transition-all ${
                method === "mercadopago"
                  ? "border-primary bg-primary-light"
                  : "border-border bg-background hover:border-text-secondary"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[13px] font-semibold ${method === "mercadopago" ? "text-primary" : "text-text-primary"}`}>
                  Mercado Pago
                </span>
                {method === "mercadopago" && (
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                    <Check size={10} className="text-white" strokeWidth={3} />
                  </div>
                )}
              </div>
              <p className={`text-[18px] font-bold ${method === "mercadopago" ? "text-primary" : "text-text-primary"}`}>
                {formatPeso(mpDeposit)}
              </p>
              <p className="mt-0.5 text-[11px] text-text-secondary">
                {surcharge > 0 ? `+${surcharge}% recargo` : "Sin recargo"}
              </p>
            </button>
          </div>

          {/* Aclaración del método elegido */}
          {method === "transferencia" && (
            <p className="mt-2 text-[11px] text-text-secondary">
              ✓ Dinero directo al profesional · El turno se confirma manualmente
            </p>
          )}
          {method === "mercadopago" && (
            <p className="mt-2 text-[11px] text-text-secondary">
              ✓ Pago con tarjeta, débito o MP · Confirmación automática
            </p>
          )}
        </div>
      )}

      {/* ── Resumen del turno ── */}
      <div className="rounded-lg border border-border bg-surface p-4 mb-4">
        <Row label="Profesional" value={professional.name} />
        <Row label="Fecha" value={dateStr} capitalize />
        <Row
          label="Horario"
          value={`${selectedTime} hs (${professional.sessionDurationMin} min)`}
        />
        <Row label="Paciente" value={patientName} />
        <div className="my-3 border-t border-border" />
        <Row
          label="Valor de la sesión"
          value={formatPeso(professional.sessionPrice)}
        />
        {surcharge > 0 && method === "mercadopago" && (
          <Row
            label={`Recargo MP (+${surcharge}%)`}
            value={`+${formatPeso(mpDeposit - baseDeposit)}`}
          />
        )}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-primary">
            Seña a pagar ({professional.depositPercent}%)
          </span>
          <span className="text-base font-bold text-primary">
            {formatPeso(depositShown)}
          </span>
        </div>
        <p className="mt-1 text-xs text-text-secondary">
          El resto ({formatPeso(remaining)}) lo abonás en el consultorio
        </p>
      </div>

      {/* ── Panel transferencia ── */}
      {method === "transferencia" && professional.transferAlias && (
        <div className="mb-4 rounded-lg border border-border bg-surface p-4">
          <p className="mb-3 text-[13px] font-medium text-text-primary">
            1. Transferí {formatPeso(baseDeposit)} a:
          </p>

          {/* Alias card */}
          <div className="mb-4 rounded-lg border border-primary/30 bg-primary-light p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-text-secondary">Alias / CBU</p>
                <p className="mt-0.5 text-[16px] font-bold text-primary tracking-tight">
                  {professional.transferAlias}
                </p>
              </div>
              <button
                type="button"
                onClick={copyAlias}
                className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-background px-3 py-2 text-[12px] font-medium text-primary transition-colors hover:bg-primary-light shrink-0"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
          </div>

          <p className="mb-2 text-[13px] font-medium text-text-primary">
            2. Ingresá el número de comprobante (opcional):
          </p>
          <input
            type="text"
            value={proofRef}
            onChange={(e) => setProofRef(e.target.value)}
            placeholder="ej: 12345678 (acelerá la verificación)"
            className="mb-4 w-full h-[44px] px-3 border border-border rounded-lg text-[14px] focus:border-primary focus:outline-none"
          />

          <button
            type="button"
            onClick={handleTransfer}
            disabled={isLoading}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-80"
          >
            {isLoading ? (
              <><Loader2 size={18} className="animate-spin" /> Enviando...</>
            ) : (
              "Ya transferí — reservar turno"
            )}
          </button>
        </div>
      )}

      {/* ── Botón Mercado Pago ── */}
      {method === "mercadopago" && (
        <button
          type="button"
          onClick={handleMP}
          disabled={isLoading}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[15px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-80"
        >
          {isLoading ? (
            <><Loader2 size={18} className="animate-spin" /> Procesando...</>
          ) : (
            <><Lock size={14} /> Pagar con Mercado Pago</>
          )}
        </button>
      )}

      {/* ── Error ── */}
      {error && (
        <div
          className="mt-3 rounded-lg px-3 py-2.5 text-[13px]"
          style={{ backgroundColor: "#FEF0EF", color: "#E24B4A" }}
        >
          {error}
        </div>
      )}

      <p className="mt-3 text-center text-xs text-text-secondary">
        {method === "mercadopago"
          ? "Pago 100% seguro · Confirmación instantánea"
          : "Sin recargo · El profesional confirma la transferencia"}
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
      <span
        className={`text-[13px] font-medium text-text-primary ${cap ? "capitalize" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
