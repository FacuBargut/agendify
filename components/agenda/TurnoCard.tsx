import { format } from "date-fns";
import { Phone, ChevronRight } from "lucide-react";
import { cn, formatPeso } from "@/lib/utils";
import { StatusBadge, PaymentBadge } from "@/components/ui/Badge";
import type { Appointment, AppointmentStatus } from "@/lib/types";

const BORDER_COLOR: Record<AppointmentStatus, string> = {
  confirmed: "border-l-primary",
  pending: "border-l-warning",
  cancelled: "border-l-border",
  completed: "border-l-success",
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
}

export default function TurnoCard({ appointment, onPress }: TurnoCardProps) {
  const {
    patientName,
    patientPhone,
    date,
    durationMin,
    status,
    paymentStatus,
    depositAmount,
    totalAmount,
  } = appointment;

  const isCancelled = status === "cancelled";
  const time = format(date, "HH:mm");

  function renderAmount() {
    if (!totalAmount) return null;

    if (paymentStatus === "paid") {
      return (
        <span className="text-xs font-medium text-success">
          {formatPeso(totalAmount)}
        </span>
      );
    }
    if (paymentStatus === "deposit_paid" && depositAmount) {
      return (
        <span className="text-xs font-medium text-warning">
          Seña: {formatPeso(depositAmount)}
        </span>
      );
    }
    return (
      <span className="text-xs font-medium text-text-secondary">
        {formatPeso(totalAmount)}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onPress}
      className={cn(
        "mb-2.5 w-full rounded-lg border border-border bg-background p-3.5 shadow-sm text-left transition-shadow hover:shadow-md",
        "border-l-4",
        BORDER_COLOR[status],
        isCancelled && "border-dashed opacity-60"
      )}
    >
      {/* Top row */}
      <div className="flex items-start gap-3">
        {/* Time */}
        <div className="flex shrink-0 flex-col items-center pt-0.5">
          <span className="text-lg font-semibold leading-tight text-text-primary">
            {time}
          </span>
          <span className="text-[11px] text-text-secondary">
            {durationMin} min
          </span>
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

        {/* Status + chevron */}
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <StatusBadge status={status} />
          <ChevronRight size={16} className="text-text-secondary" />
        </div>
      </div>

      {/* Bottom row — payment info */}
      {!isCancelled && (
        <div className="mt-2.5 flex items-center justify-between border-t border-border pt-2.5">
          <PaymentBadge status={paymentStatus} />
          {renderAmount()}
        </div>
      )}
    </button>
  );
}
