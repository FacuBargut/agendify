"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, X, Loader2, RefreshCw } from "lucide-react";
import { usePush } from "@/components/providers/PushProvider";

const DISMISSED_KEY = "agendify_push_banner_dismissed";
const ENDPOINT_KEY  = "agendify_push_endpoint";

export default function PushPermissionBanner() {
  const { permission, subscribe } = usePush();
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);
  const [errorMsg, setErrorMsg]   = useState<string | null>(null);
  // true = permiso concedido pero suscripción no registrada en servidor
  const [needsReconnect, setNeedsReconnect] = useState(false);

  useEffect(() => {
    setDismissed(!!localStorage.getItem(DISMISSED_KEY));

    // Si el permiso ya estaba concedido, verificar si la suscripción
    // llegó al servidor comprobando si hay endpoint guardado
    if (Notification.permission === "granted") {
      const stored = localStorage.getItem(ENDPOINT_KEY);
      if (!stored) setNeedsReconnect(true);
    }
  }, []);

  // Nada que mostrar
  if (permission === "unsupported") return null;
  if (done) return null;
  if (dismissed && !needsReconnect) return null;
  if (permission === "denied") {
    return (
      <div className="mx-3 mb-3 flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3.5 py-2.5">
        <BellOff size={15} strokeWidth={1.5} className="text-text-secondary shrink-0" />
        <p className="flex-1 text-[12px] text-text-secondary">
          Notificaciones bloqueadas. Activalas en Ajustes → Agendify → Notificaciones.
        </p>
        <button type="button" onClick={() => setDismissed(true)}>
          <X size={14} strokeWidth={1.5} className="text-text-secondary" />
        </button>
      </div>
    );
  }

  async function handleActivate() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const ok = await subscribe();
      if (ok) {
        setDone(true);
        setNeedsReconnect(false);
      } else {
        setErrorMsg("No se pudo activar. Verificá los permisos en Ajustes → Agendify.");
      }
    } catch (err) {
      setErrorMsg(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
    setLoading(false);
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  }

  // ── Banner: permiso concedido pero suscripción perdida ──
  if (needsReconnect) {
    return (
      <div className="mx-3 mb-3 rounded-xl border border-warning/40 bg-warning/10 px-3.5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning/20">
            <RefreshCw size={14} strokeWidth={1.5} className="text-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-text-primary">
              Reconectar notificaciones
            </p>
            <p className="text-[10px] text-text-secondary mt-0.5">
              El permiso está activo pero la conexión se perdió
            </p>
          </div>
          <button
            type="button"
            onClick={handleActivate}
            disabled={loading}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-warning px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-60"
          >
            {loading ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
            Reconectar
          </button>
        </div>
        {errorMsg && (
          <p className="mt-2 text-[11px] text-warning font-medium">{errorMsg}</p>
        )}
      </div>
    );
  }

  // ── Banner: pedir permiso por primera vez ──
  if (permission === "default") {
    return (
      <div className="mx-3 mb-3 rounded-xl border border-border bg-surface px-3.5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-light">
            <Bell size={15} strokeWidth={1.5} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-text-primary">
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
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-60"
            >
              {loading && <Loader2 size={11} className="animate-spin" />}
              Activar
            </button>
            <button type="button" onClick={handleDismiss} aria-label="Cerrar"
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-border/40">
              <X size={13} strokeWidth={1.5} className="text-text-secondary" />
            </button>
          </div>
        </div>
        {errorMsg && (
          <p className="mt-2 text-[11px] text-[#E24B4A]">{errorMsg}</p>
        )}
      </div>
    );
  }

  return null;
}
