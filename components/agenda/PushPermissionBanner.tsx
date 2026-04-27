"use client";

import { useState } from "react";
import { Bell, BellOff, X, Loader2 } from "lucide-react";
import { usePush } from "@/components/providers/PushProvider";

const DISMISSED_KEY = "agendify_push_banner_dismissed";

/**
 * Muestra un banner sutil invitando a activar notificaciones push.
 * Solo aparece si:
 *  - El navegador soporta push
 *  - El permiso no fue concedido ni denegado aún
 *  - El usuario no lo cerró antes
 *
 * El botón "Activar" llama a subscribe() desde el click handler,
 * lo que satisface el requisito de user gesture de iOS Safari.
 */
export default function PushPermissionBanner() {
  const { permission, subscribe } = usePush();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(DISMISSED_KEY);
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<"ok" | "denied" | null>(null);

  // No mostrar si ya está concedido, denegado, no soportado, o fue cerrado
  if (
    permission === "unsupported" ||
    permission === "granted" ||
    permission === "denied" ||
    dismissed
  ) {
    return null;
  }

  if (result === "ok") return null; // activado en esta sesión

  if (result === "denied") {
    return (
      <div className="mx-3 mb-3 flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 py-2.5">
        <BellOff size={15} strokeWidth={1.5} className="text-text-secondary shrink-0" />
        <p className="flex-1 text-[12px] text-text-secondary">
          Permiso denegado. Activalo en Ajustes → Safari → Notificaciones.
        </p>
        <button type="button" onClick={() => setDismissed(true)}>
          <X size={14} strokeWidth={1.5} className="text-text-secondary" />
        </button>
      </div>
    );
  }

  async function handleActivate() {
    setLoading(true);
    const ok = await subscribe();
    setLoading(false);
    setResult(ok ? "ok" : "denied");
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="mx-3 mb-3 flex items-center gap-3 rounded-xl border border-border bg-surface px-3.5 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-light">
        <Bell size={15} strokeWidth={1.5} className="text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-text-primary leading-snug">
          Activar notificaciones
        </p>
        <p className="text-[10px] text-text-secondary mt-0.5">
          Recibí un aviso cuando llegue un turno nuevo
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleActivate}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading && <Loader2 size={11} className="animate-spin" />}
          Activar
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-border/40 transition-colors"
          aria-label="Cerrar"
        >
          <X size={13} strokeWidth={1.5} className="text-text-secondary" />
        </button>
      </div>
    </div>
  );
}
