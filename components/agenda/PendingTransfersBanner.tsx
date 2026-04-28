"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, ChevronRight } from "lucide-react";
import { formatPeso } from "@/lib/utils";
import type { SerializedAppointment } from "@/lib/types";

export default function PendingTransfersBanner({
  pending,
}: {
  pending: SerializedAppointment[];
}) {
  const router = useRouter();

  if (pending.length === 0) return null;

  function go(appointment: SerializedAppointment) {
    const dateStr = format(new Date(appointment.date), "yyyy-MM-dd");
    router.push(`/agenda?date=${dateStr}&highlight=${appointment.id}`);
  }

  return (
    <div className="mx-3 mb-3 rounded-[14px] border border-warning/40 bg-warning/10 overflow-hidden">
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <Clock size={14} strokeWidth={1.75} className="text-warning" />
        <p className="text-[12px] font-semibold text-text-primary">
          Pendientes de aprobación
        </p>
        <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-warning px-1.5 text-[11px] font-bold text-white">
          {pending.length}
        </span>
      </div>

      <div className="divide-y divide-warning/20">
        {pending.map((a) => {
          const date = new Date(a.date);
          const fecha = format(date, "EEE d 'de' MMM", { locale: es });
          const time = format(date, "HH:mm");

          return (
            <button
              key={a.id}
              type="button"
              onClick={() => go(a)}
              className="flex w-full items-center gap-3 bg-white/60 px-4 py-2.5 text-left transition-colors hover:bg-white/80"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-text-primary truncate">
                  {a.patientName}
                </p>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  {fecha} · {time} hs
                  {a.depositAmount ? ` · ${formatPeso(a.depositAmount)}` : ""}
                </p>
              </div>
              <ChevronRight
                size={14}
                strokeWidth={1.75}
                className="shrink-0 text-text-secondary"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
