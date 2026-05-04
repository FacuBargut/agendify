"use client";

import { useState } from "react";
import { MessageSquarePlus, X } from "lucide-react";

// Boton flotante para que pros en beta nos manden feedback. Aparece en la
// esquina inferior derecha por arriba del bottom nav.
export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setMessage("");
    setRating(null);
    setError(null);
    setSent(false);
  }

  function close() {
    setOpen(false);
    setTimeout(reset, 300);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 3) {
      setError("Escribi un poco mas para mandarlo");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim(), rating }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "No se pudo enviar");
        setSending(false);
        return;
      }
      setSent(true);
      setSending(false);
      setTimeout(close, 1500);
    } catch {
      setError("Error de red");
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Enviar feedback"
        className="fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform active:scale-95"
      >
        <MessageSquarePlus size={22} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-t-2xl bg-background p-5 shadow-xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  Contanos como te va
                </h2>
                <p className="mt-1 text-xs text-text-secondary">
                  Estamos en beta — tu feedback nos ayuda a mejorar.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="text-text-secondary"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            {sent ? (
              <p className="mt-6 text-center text-sm text-success">
                ¡Gracias! Lo recibimos.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(rating === n ? null : n)}
                      className={`h-9 w-9 rounded-md border text-sm font-medium transition-colors ${
                        rating === n
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-background text-text-secondary hover:border-primary/50"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="¿Que esta funcionando? ¿Que te falta?"
                  rows={4}
                  maxLength={2000}
                  className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />

                {error && (
                  <p className="text-sm text-warning" role="alert">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={sending || message.trim().length < 3}
                  className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? "Enviando..." : "Enviar"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
