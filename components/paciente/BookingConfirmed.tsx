import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2, MessageCircle } from "lucide-react";

interface BookingConfirmedProps {
  patientName: string;
  selectedDate: Date;
  selectedTime: string;
  professionalName: string;
}

export default function BookingConfirmed({
  patientName,
  selectedDate,
  selectedTime,
  professionalName,
}: BookingConfirmedProps) {
  const dateStr = format(selectedDate, "EEEE d 'de' MMMM", { locale: es });

  return (
    <div className="flex flex-col items-center px-4 pt-8">
      {/* Success icon */}
      <div className="mb-4 flex h-[88px] w-[88px] items-center justify-center rounded-full bg-[#F0FDF4]">
        <CheckCircle2 size={56} strokeWidth={1.5} className="text-success" />
      </div>

      <h2 className="text-xl font-semibold text-text-primary">
        ¡Turno confirmado!
      </h2>
      <p className="mt-1 text-sm text-text-secondary">
        Hola {patientName}, tu turno está reservado.
      </p>

      {/* Summary card */}
      <div className="mt-6 w-full rounded-lg border border-border bg-surface p-4">
        <div className="flex items-center justify-between py-1.5">
          <span className="text-[13px] text-text-secondary">Profesional</span>
          <span className="text-[13px] font-medium text-text-primary">
            {professionalName}
          </span>
        </div>
        <div className="flex items-center justify-between py-1.5">
          <span className="text-[13px] text-text-secondary">Fecha</span>
          <span className="text-[13px] font-medium capitalize text-text-primary">
            {dateStr}
          </span>
        </div>
        <div className="flex items-center justify-between py-1.5">
          <span className="text-[13px] text-text-secondary">Horario</span>
          <span className="text-[13px] font-medium text-text-primary">
            {selectedTime} hs
          </span>
        </div>
      </div>

      {/* WhatsApp notice */}
      <div className="mt-4 w-full rounded-lg border border-border border-l-4 border-l-[#25D366] bg-background p-4">
        <div className="flex items-start gap-3">
          <MessageCircle size={20} className="mt-0.5 shrink-0 text-[#25D366]" />
          <p className="text-[13px] text-text-primary">
            Recibirás una confirmación por WhatsApp en los próximos minutos
          </p>
        </div>
      </div>
    </div>
  );
}
