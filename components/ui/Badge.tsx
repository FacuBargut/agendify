import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppointmentStatus, PaymentStatus } from "@/lib/types";

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; bg: string; text: string }
> = {
  confirmed: { label: "Confirmado", bg: "bg-primary-light", text: "text-primary" },
  pending: { label: "Pendiente", bg: "bg-[#FEF9EE]", text: "text-warning" },
  cancelled: { label: "Cancelado", bg: "bg-[#FEF0EF]", text: "text-[#E24B4A]" },
  completed: { label: "Completado", bg: "bg-[#F0FDF4]", text: "text-success" },
  pending_transfer: { label: "Verificar pago", bg: "bg-[#FEF9EE]", text: "text-warning" },
};

const PAYMENT_CONFIG: Record<
  PaymentStatus,
  { label: string; bg: string; text: string; icon: typeof CheckCircle2 }
> = {
  paid: { label: "Pagado", bg: "bg-[#F0FDF4]", text: "text-success", icon: CheckCircle2 },
  deposit_paid: { label: "Seña pagada", bg: "bg-[#FEF9EE]", text: "text-warning", icon: Clock },
  unpaid: { label: "Sin pagar", bg: "bg-surface", text: "text-text-secondary", icon: AlertCircle },
};

interface StatusBadgeProps {
  status: AppointmentStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        config.bg,
        config.text,
        className
      )}
    >
      {config.label}
    </span>
  );
}

interface PaymentBadgeProps {
  status: PaymentStatus;
  className?: string;
}

export function PaymentBadge({ status, className }: PaymentBadgeProps) {
  const config = PAYMENT_CONFIG[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        config.bg,
        config.text,
        className
      )}
    >
      <Icon size={14} strokeWidth={1.5} />
      {config.label}
    </span>
  );
}
