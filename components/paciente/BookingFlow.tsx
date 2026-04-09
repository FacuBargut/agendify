"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, CalendarDays, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import BookingCalendar from "@/components/paciente/BookingCalendar";
import TimeSlotGrid from "@/components/paciente/TimeSlotGrid";
import BookingForm from "@/components/paciente/BookingForm";
import PaymentSummary from "@/components/paciente/PaymentSummary";
import type { BookingStep, BookingFormData, TimeSlot, ProfessionalPublic } from "@/lib/types";

const STEPS: BookingStep[] = ["select-date", "select-time", "fill-form", "payment"];

const SPECIALTY_LABELS: Record<string, string> = {
  psychology: "Psicóloga Clínica",
};

function StepIndicator({ current }: { current: BookingStep }) {
  const currentIdx = STEPS.indexOf(current);

  return (
    <div className="mb-6 flex items-center justify-center gap-0">
      {STEPS.map((s, i) => {
        const completed = i < currentIdx;
        const active = i === currentIdx;

        return (
          <div key={s} className="flex items-center">
            {i > 0 && (
              <div
                className={cn(
                  "h-px w-6",
                  i <= currentIdx ? "bg-primary" : "bg-border"
                )}
              />
            )}
            <div
              className={cn(
                "flex h-2 w-2 items-center justify-center rounded-full",
                completed
                  ? "bg-primary"
                  : active
                    ? "bg-primary"
                    : "bg-border"
              )}
            >
              {completed && <Check size={6} strokeWidth={3} className="text-white" />}
            </div>
          </div>
        );
      })}
    </div>
  );
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

interface BookingFlowProps {
  professional: ProfessionalPublic;
}

export default function BookingFlow({ professional }: BookingFlowProps) {
  const [step, setStep] = useState<BookingStep>("select-date");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [formData, setFormData] = useState<BookingFormData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Slots fetched from API per day
  const [slotsCache, setSlotsCache] = useState<Record<string, TimeSlot[]>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);

  const pro = professional;
  const specialtyLabel = SPECIALTY_LABELS[pro.specialty] || pro.specialty;

  // Fetch slots for a given date
  const fetchSlots = useCallback(
    async (date: Date) => {
      const key = format(date, "yyyy-MM-dd");
      if (slotsCache[key]) return;

      setLoadingSlots(true);
      try {
        const res = await fetch(
          `/api/slots?slug=${pro.slug}&date=${key}`
        );
        if (res.ok) {
          const data = await res.json();
          setSlotsCache((prev) => ({ ...prev, [key]: data.slots }));
        }
      } catch {
        // Silently fail — calendar will show no slots
      } finally {
        setLoadingSlots(false);
      }
    },
    [pro.slug, slotsCache]
  );

  // Pre-fetch slots for the visible month range (14 days)
  useEffect(() => {
    async function prefetch() {
      const today = new Date();
      for (let i = 0; i < 14; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        const key = format(d, "yyyy-MM-dd");
        if (!slotsCache[key]) {
          try {
            const res = await fetch(
              `/api/slots?slug=${pro.slug}&date=${key}`
            );
            if (res.ok) {
              const data = await res.json();
              setSlotsCache((prev) => ({ ...prev, [key]: data.slots }));
            }
          } catch {
            // ignore
          }
        }
      }
    }
    prefetch();
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDateSelect(date: Date) {
    setSelectedDate(date);
    setSelectedTime(null);
    fetchSlots(date);
    setStep("select-time");
  }

  function handleTimeSelect(time: string) {
    setSelectedTime(time);
    setStep("fill-form");
  }

  function handleFormSubmit(data: BookingFormData) {
    setFormData(data);
    setStep("payment");
  }

  function handlePaymentReady(initPoint: string) {
    console.log("[Agendify] Redirecting to MP checkout:", initPoint);
  }

  function goBack() {
    if (step === "select-time") setStep("select-date");
    else if (step === "fill-form") setStep("select-time");
    else if (step === "payment") setStep("fill-form");
  }

  const slotsForDay: TimeSlot[] = selectedDate
    ? slotsCache[format(selectedDate, "yyyy-MM-dd")] ?? []
    : [];

  const dateLabel = selectedDate
    ? format(selectedDate, "EEEE d 'de' MMMM", { locale: es })
    : "";

  // Build a professional-like object for PaymentSummary
  const proForPayment = {
    ...pro,
    sessionDurationMin: pro.sessionDuration,
    avatarInitials: getInitials(pro.name),
    specialty: specialtyLabel,
  };

  return (
    <div className="min-h-dvh bg-surface">
      <div className="mx-auto max-w-[480px]">
        {/* Header */}
        <div className="bg-background px-4 pb-4 pt-5">
          <span className="text-base font-semibold text-primary">Agendify</span>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-primary">
              <span className="text-base font-medium text-white">
                {getInitials(pro.name)}
              </span>
            </div>
            <div>
              <h1 className="text-lg font-medium text-text-primary">
                {pro.name}
              </h1>
              <p className="text-[13px] text-text-secondary">
                {specialtyLabel}
              </p>
            </div>
          </div>

          {pro.bio && (
            <p className="mt-3 text-[13px] leading-relaxed text-text-secondary">
              {pro.bio}
            </p>
          )}
        </div>

        <div className="border-t border-border" />

        {/* Content */}
        <div className="bg-background px-4 py-5">
          {step !== "confirmed" && <StepIndicator current={step} />}

          {/* Back button */}
          {step !== "select-date" && step !== "confirmed" && (
            <button
              type="button"
              onClick={goBack}
              className="mb-4 flex items-center gap-1 text-[13px] text-text-secondary hover:text-text-primary"
            >
              <ArrowLeft size={14} />
              Volver
            </button>
          )}

          {/* Step: Select date */}
          {step === "select-date" && (
            <>
              <h2 className="mb-4 text-[15px] font-medium text-text-primary">
                Elegí una fecha
              </h2>
              <BookingCalendar
                availableSlots={slotsCache}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
              />
            </>
          )}

          {/* Step: Select time */}
          {step === "select-time" && selectedDate && (
            <>
              <h2 className="mb-1 text-[15px] font-medium text-text-primary">
                Elegí un horario
              </h2>
              <p className="mb-4 text-[13px] capitalize text-text-secondary">
                {dateLabel}
              </p>
              {loadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-primary" />
                </div>
              ) : (
                <TimeSlotGrid
                  slots={slotsForDay}
                  selectedTime={selectedTime}
                  onTimeSelect={handleTimeSelect}
                />
              )}
            </>
          )}

          {/* Step: Fill form */}
          {step === "fill-form" && selectedDate && selectedTime && (
            <>
              <h2 className="mb-3 text-[15px] font-medium text-text-primary">
                Tus datos
              </h2>
              <div className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1.5">
                <CalendarDays size={14} className="text-primary" />
                <span className="text-[13px] font-medium capitalize text-primary">
                  {dateLabel} · {selectedTime} hs
                </span>
              </div>
              <BookingForm onSubmit={handleFormSubmit} isLoading={false} />
            </>
          )}

          {/* Step: Payment */}
          {step === "payment" && selectedDate && selectedTime && formData && (
            <>
              <h2 className="mb-4 text-[15px] font-medium text-text-primary">
                Resumen y pago
              </h2>
              <PaymentSummary
                professional={proForPayment}
                professionalSlug={pro.slug}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                patientName={formData.patientName}
                patientPhone={formData.patientPhone}
                notes={formData.notes}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                onPaymentReady={handlePaymentReady}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
