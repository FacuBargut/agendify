"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Plus, Loader2, Search, Phone } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import TimeSlotGrid from "@/components/paciente/TimeSlotGrid";
import Toast from "@/components/ui/Toast";
import type { TimeSlot } from "@/lib/types";
import type { TurnoSerialized, PatientOption } from "./TurnosList";

interface NuevoTurnoModalProps {
  patients: PatientOption[];
  professionalSlug: string;
  onCreated: (turno: TurnoSerialized) => void;
}

export default function NuevoTurnoModal({
  patients,
  professionalSlug,
  onCreated,
}: NuevoTurnoModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  // Patient fields
  const [isExisting, setIsExisting] = useState(true);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null);
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");

  // Para paciente nuevo: ¿guardar en el listado?
  const [saveAsPatient, setSaveAsPatient] = useState(true);

  // Appointment fields
  const [date, setDate] = useState("");
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [patientEmail, setPatientEmail] = useState("");

  // Slots
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Patient search results
  const searchResults = useMemo(() => {
    if (!isExisting || !patientSearch.trim()) return [];
    const q = patientSearch.toLowerCase();
    return patients
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.phone.includes(patientSearch)
      )
      .slice(0, 5);
  }, [patients, patientSearch, isExisting]);

  // Fetch slots when date changes
  useEffect(() => {
    if (!date) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    setSelectedTime(null);
    fetch(`/api/slots?slug=${professionalSlug}&date=${date}`)
      .then((res) => res.json())
      .then((data) => {
        setSlots(data.slots || []);
      })
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [date, professionalSlug]);

  const resetForm = useCallback(() => {
    setIsExisting(true);
    setPatientSearch("");
    setSelectedPatient(null);
    setPatientName("");
    setPatientPhone("");
    setPatientEmail("");
    setSaveAsPatient(true);
    setDate("");
    setSelectedTime(null);
    setNotes("");
    setSendEmail(true);
    setSlots([]);
    setError("");
  }, []);

  const handleSelectPatient = (p: PatientOption) => {
    setSelectedPatient(p);
    setPatientName(p.name);
    setPatientPhone(p.phone);
    setPatientSearch(p.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalName = patientName.trim();
    const finalPhone = patientPhone.trim();

    if (!finalName || !finalPhone || !date || !selectedTime) {
      setError("Completá todos los campos requeridos");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/turnos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatient?.id || null,
          patientName: finalName,
          patientPhone: finalPhone,
          patientEmail: patientEmail.trim() || null,
          date,
          time: selectedTime,
          notes: notes.trim() || null,
          sendEmail,
          // Solo relevante cuando es paciente nuevo (no del listado)
          saveAsPatient: selectedPatient ? true : saveAsPatient,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear turno");
      }

      const { appointment } = await res.json();

      onCreated({
        id: appointment.id,
        patientId: appointment.patientId,
        patientName: appointment.patientName,
        patientPhone: appointment.patientPhone,
        date: appointment.date,
        durationMin: appointment.durationMin,
        status: appointment.status,
        paymentStatus: appointment.paymentStatus,
        depositAmount: appointment.depositAmount,
        totalAmount: appointment.totalAmount,
        notes: appointment.notes,
      });

      resetForm();
      setOpen(false);
      setToastVisible(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  const todayStr = format(new Date(), "yyyy-MM-dd");

  return (
    <>
      <Dialog.Root
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) resetForm();
        }}
      >
        <Dialog.Trigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-primary/90"
          >
            <Plus size={14} strokeWidth={2} />
            Nuevo turno
          </button>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 animate-in fade-in-0" />
          <Dialog.Content className="fixed inset-x-4 bottom-0 top-auto z-50 max-h-[90vh] overflow-y-auto rounded-t-2xl bg-background p-5 pb-8 shadow-xl animate-in slide-in-from-bottom-4 sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md sm:rounded-2xl sm:bottom-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <Dialog.Title className="text-[18px] font-medium text-text-primary">
                Nuevo turno
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface"
                  aria-label="Cerrar"
                >
                  <X
                    size={18}
                    strokeWidth={1.5}
                    className="text-text-secondary"
                  />
                </button>
              </Dialog.Close>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Patient toggle */}
              <div>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsExisting(true);
                      setSelectedPatient(null);
                      setPatientName("");
                      setPatientPhone("");
                      setPatientSearch("");
                    }}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-[13px] font-medium border transition-colors",
                      isExisting
                        ? "bg-primary text-white border-primary"
                        : "bg-background text-text-secondary border-border"
                    )}
                  >
                    Paciente existente
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsExisting(false);
                      setSelectedPatient(null);
                      setPatientName("");
                      setPatientPhone("");
                      setPatientSearch("");
                    }}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-[13px] font-medium border transition-colors",
                      !isExisting
                        ? "bg-primary text-white border-primary"
                        : "bg-background text-text-secondary border-border"
                    )}
                  >
                    Paciente nuevo
                  </button>
                </div>

                {isExisting ? (
                  <div className="relative">
                    <Search
                      size={16}
                      strokeWidth={1.5}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
                    />
                    <input
                      type="text"
                      value={patientSearch}
                      onChange={(e) => {
                        setPatientSearch(e.target.value);
                        if (selectedPatient) setSelectedPatient(null);
                      }}
                      placeholder="Buscar por nombre o teléfono..."
                      className="w-full h-[44px] pl-10 pr-3 border border-border rounded-lg text-[14px] focus:border-primary focus:outline-none"
                    />
                    {/* Search dropdown */}
                    {patientSearch.trim() &&
                      !selectedPatient &&
                      searchResults.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 rounded-lg border border-border bg-background shadow-lg z-10 max-h-[200px] overflow-y-auto">
                          {searchResults.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleSelectPatient(p)}
                              className="flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-surface transition-colors"
                            >
                              <div className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full bg-primary-light">
                                <span className="text-[11px] font-medium text-primary">
                                  {p.name
                                    .split(" ")
                                    .map((w) => w[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="text-[13px] font-medium text-text-primary">
                                  {p.name}
                                </p>
                                <p className="text-[11px] text-text-secondary flex items-center gap-1">
                                  <Phone size={9} strokeWidth={1.5} />
                                  {p.phone}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[13px] font-medium text-text-secondary mb-1">
                        Nombre completo *
                      </label>
                      <input
                        type="text"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="Ej: María García"
                        className="w-full h-[44px] px-3 border border-border rounded-lg text-[14px] focus:border-primary focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-text-secondary mb-1">
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        placeholder="Ej: 3411234567"
                        className="w-full h-[44px] px-3 border border-border rounded-lg text-[14px] focus:border-primary focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-medium text-text-secondary mb-1">
                        Email (opcional)
                      </label>
                      <input
                        type="email"
                        value={patientEmail}
                        onChange={(e) => setPatientEmail(e.target.value)}
                        placeholder="Ej: maria@gmail.com"
                        className="w-full h-[44px] px-3 border border-border rounded-lg text-[14px] focus:border-primary focus:outline-none"
                      />
                    </div>

                    {/* Toggle: guardar como paciente */}
                    <button
                      type="button"
                      onClick={() => setSaveAsPatient(!saveAsPatient)}
                      className={cn(
                        "w-full flex items-center justify-between rounded-lg border px-3.5 py-3 transition-colors",
                        saveAsPatient
                          ? "border-primary/40 bg-primary-light"
                          : "border-border bg-surface"
                      )}
                    >
                      <div className="text-left">
                        <p className={cn(
                          "text-[13px] font-medium",
                          saveAsPatient ? "text-primary" : "text-text-primary"
                        )}>
                          Guardar en mi listado de pacientes
                        </p>
                        <p className="text-[11px] text-text-secondary mt-0.5">
                          {saveAsPatient
                            ? "Se agregará a Pacientes para futuros turnos"
                            : "Turno esporádico, sin registrar en el listado"}
                        </p>
                      </div>
                      {/* Checkmark visual */}
                      <span className={cn(
                        "ml-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        saveAsPatient
                          ? "border-primary bg-primary"
                          : "border-border bg-background"
                      )}>
                        {saveAsPatient && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="block text-[13px] font-medium text-text-secondary mb-1">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={todayStr}
                  className="w-full h-[48px] px-3 border border-border rounded-lg text-[14px] focus:border-primary focus:outline-none"
                  required
                />
              </div>

              {/* Time slots */}
              {date && (
                <div>
                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2
                        size={24}
                        className="animate-spin text-primary"
                      />
                    </div>
                  ) : slots.length > 0 ? (
                    <TimeSlotGrid
                      slots={slots}
                      selectedTime={selectedTime}
                      onTimeSelect={setSelectedTime}
                    />
                  ) : (
                    <p className="text-[13px] text-text-secondary text-center py-4">
                      No hay horarios disponibles para esta fecha
                    </p>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-[13px] font-medium text-text-secondary mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Motivo de consulta u observaciones..."
                  rows={2}
                  className="w-full px-3 py-2 border border-border rounded-lg text-[14px] resize-none focus:border-primary focus:outline-none"
                />
              </div>

              {/* Email toggle — solo si hay email */}
              {patientEmail.trim() || selectedPatient ? (
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-text-primary">
                    Enviar confirmación por mail
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={sendEmail}
                    onClick={() => setSendEmail(!sendEmail)}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors",
                      sendEmail ? "bg-primary" : "bg-border"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition-transform mt-0.5",
                        sendEmail ? "translate-x-[22px]" : "translate-x-0.5"
                      )}
                    />
                  </button>
                </div>
              ) : null}

              {error && (
                <p className="text-[13px] text-[#E24B4A]">{error}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[52px] rounded-lg bg-primary text-white text-[14px] font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creando turno...
                  </>
                ) : (
                  "Crear turno"
                )}
              </button>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Toast
        message="Turno creado correctamente"
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
    </>
  );
}
