"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SerializedPatient } from "./PacientesList";

interface NuevoPacienteModalProps {
  onCreated: (patient: SerializedPatient) => void;
}

export default function NuevoPacienteModal({ onCreated }: NuevoPacienteModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"active" | "paused">("active");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const resetForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setStatus("active");
    setNotes("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError("Nombre y teléfono son requeridos");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/pacientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
          notes: notes.trim() || null,
          status,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear paciente");
      }

      const { patient } = await res.json();

      // Optimistic update: add to list immediately
      onCreated({
        id: patient.id,
        name: patient.name,
        phone: patient.phone,
        email: patient.email,
        notes: patient.notes,
        status: patient.status,
        createdAt: patient.createdAt,
        totalAppointments: 0,
        lastAppointment: null,
      });

      resetForm();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg border border-primary px-3.5 py-2 text-[13px] font-medium text-primary transition-colors hover:bg-primary-light"
        >
          + Nuevo
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 animate-in fade-in-0" />
        <Dialog.Content className="fixed inset-x-4 bottom-0 top-auto z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-background p-5 pb-8 shadow-xl animate-in slide-in-from-bottom-4 sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md sm:rounded-2xl sm:bottom-auto">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-[18px] font-medium text-text-primary">
              Nuevo paciente
            </Dialog.Title>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-1">
                Nombre completo *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: María García"
                className="w-full h-[44px] px-3 border border-border rounded-lg text-[14px] focus:border-primary focus:outline-none"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-1">
                Teléfono *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej: 3411234567"
                className="w-full h-[44px] px-3 border border-border rounded-lg text-[14px] focus:border-primary focus:outline-none"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-1">
                Email (opcional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ej: maria@gmail.com"
                className="w-full h-[44px] px-3 border border-border rounded-lg text-[14px] focus:border-primary focus:outline-none"
              />
            </div>

            {/* Status pills */}
            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-2">
                Estado inicial
              </label>
              <div className="flex gap-2">
                {(["active", "paused"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-[13px] font-medium border transition-colors",
                      status === s
                        ? "bg-primary text-white border-primary"
                        : "bg-background text-text-secondary border-border"
                    )}
                  >
                    {s === "active" ? "Activo" : "Pausado"}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-1">
                Notas internas (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones sobre el paciente..."
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg text-[14px] resize-none focus:border-primary focus:outline-none"
              />
            </div>

            {error && (
              <p className="text-[13px] text-[#E24B4A]">{error}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="flex-1 h-[44px] rounded-lg border border-border text-[14px] font-medium text-text-secondary hover:bg-surface transition-colors"
                >
                  Cancelar
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 h-[44px] rounded-lg bg-primary text-white text-[14px] font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Guardar paciente
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
