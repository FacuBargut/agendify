"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCheck, X, Loader2 } from "lucide-react";
import type { SerializedAppointment } from "@/lib/types";

export default function AwaitingReviewBanner({
  pending,
}: {
  pending: SerializedAppointment[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  if (pending.length === 0) return null;

  async function mark(id: string, attendance: "attended" | "no_show") {
    setBusy(id);
    try {
      await fetch(`/api/turnos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendance }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-3 mb-3 rounded-[14px] border border-primary/30 bg-primary-light/40 overflow-hidden">
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <CheckCheck size={14} strokeWidth={1.75} className="text-primary" />
        <p className="text-[12px] font-semibold text-text-primary">
          Para revisar
        </p>
        <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white">
          {pending.length}
        </span>
      </div>
      <p className="px-4 pb-2 text-[11px] text-text-secondary">
        ¿El paciente asistió a la sesión?
      </p>

      <div className="divide-y divide-primary/20">
        {pending.map((a) => {
          const date = new Date(a.date);
          const fecha = format(date, "EEE d 'de' MMM", { locale: es });
          const time = format(date, "HH:mm");
          const isBusy = busy === a.id;

          return (
            <div
              key={a.id}
              className="flex items-center gap-2 bg-white/70 px-4 py-2.5"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-text-primary truncate">
                  {a.patientName}
                </p>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  {fecha} · {time} hs
                </p>
              </div>
              <button
                type="button"
                onClick={() => mark(a.id, "attended")}
                disabled={isBusy}
                className="flex shrink-0 items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-[11px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {isBusy ? <Loader2 size={11} className="animate-spin" /> : null}
                Asistió
              </button>
              <button
                type="button"
                onClick={() => mark(a.id, "no_show")}
                disabled={isBusy}
                className="flex shrink-0 items-center gap-1 rounded-md border border-[#E24B4A]/40 bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#E24B4A] transition-colors hover:bg-[#FEF0EF] disabled:opacity-60"
              >
                <X size={11} />
                No vino
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
