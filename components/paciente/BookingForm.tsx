"use client";

import { useState } from "react";
import { MessageCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BookingFormData } from "@/lib/types";

interface BookingFormProps {
  onSubmit: (data: BookingFormData) => void;
  isLoading: boolean;
}

interface FormErrors {
  patientName?: string;
  patientPhone?: string;
}

export default function BookingForm({ onSubmit, isLoading }: BookingFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (name.trim().length < 3) {
      newErrors.patientName = "Ingresá tu nombre completo (mínimo 3 caracteres)";
    }

    const digits = phone.replace(/\D/g, "");
    if (digits.length < 8) {
      newErrors.patientPhone = "Ingresá un número válido (mínimo 8 dígitos)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ patientName: name.trim(), patientPhone: phone.trim(), notes: notes.trim() || undefined });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div>
        <label htmlFor="booking-name" className="mb-1.5 block text-[13px] font-medium text-text-primary">
          Tu nombre completo
        </label>
        <input
          id="booking-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Valentina Rodríguez"
          className={cn(
            "w-full rounded-lg border bg-background px-3.5 text-[15px] text-text-primary placeholder:text-text-secondary/50",
            errors.patientName ? "border-[#E24B4A]" : "border-border"
          )}
        />
        {errors.patientName && (
          <p className="mt-1 text-xs text-[#E24B4A]">{errors.patientName}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="booking-phone" className="mb-1.5 block text-[13px] font-medium text-text-primary">
          Tu número de WhatsApp
        </label>
        <div className="relative">
          <input
            id="booking-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Ej: 341 555 1234"
            className={cn(
              "w-full rounded-lg border bg-background pl-10 pr-3.5 text-[15px] text-text-primary placeholder:text-text-secondary/50",
              errors.patientPhone ? "border-[#E24B4A]" : "border-border"
            )}
          />
          <MessageCircle
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#25D366]"
          />
        </div>
        {errors.patientPhone ? (
          <p className="mt-1 text-xs text-[#E24B4A]">{errors.patientPhone}</p>
        ) : (
          <p className="mt-1 text-xs text-text-secondary">
            Te enviaremos la confirmación y recordatorios
          </p>
        )}
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="booking-notes" className="mb-1.5 block text-[13px] font-medium text-text-primary">
          ¿Algo que quieras contarle al profesional? (opcional)
        </label>
        <textarea
          id="booking-notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Podés contar brevemente el motivo de consulta..."
          maxLength={300}
          className="w-full rounded-lg border border-border bg-background px-3.5 py-3 text-[15px] text-text-primary placeholder:text-text-secondary/50"
        />
        <p className="mt-1 text-right text-xs text-text-secondary">
          {notes.length}/300
        </p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="flex h-[52px] w-full items-center justify-center rounded-lg bg-primary text-[15px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isLoading ? (
          <>
            <Loader2 size={18} className="mr-2 animate-spin" />
            Procesando...
          </>
        ) : (
          "Continuar al pago →"
        )}
      </button>
    </form>
  );
}
