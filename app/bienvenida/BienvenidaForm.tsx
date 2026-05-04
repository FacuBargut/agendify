"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  name: string;
}

export default function BienvenidaForm({ name }: Props) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Nombre corto para saludo: solo el primer nombre, capitalizado.
  const firstName = name.split(" ")[0] || name;

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/beta-codes/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo canjear el codigo");
        setLoading(false);
        return;
      }
      router.replace("/agenda");
    } catch {
      setError("Error de red. Intentalo de nuevo.");
      setLoading(false);
    }
  }

  async function handleSkip() {
    setSkipping(true);
    try {
      const res = await fetch("/api/beta-codes/skip", { method: "POST" });
      if (!res.ok) {
        setSkipping(false);
        setError("No se pudo continuar. Intentalo de nuevo.");
        return;
      }
      router.replace("/agenda");
    } catch {
      setSkipping(false);
      setError("Error de red. Intentalo de nuevo.");
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-surface px-5 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-7 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          Bienvenido, {firstName} 👋
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          Estamos en beta cerrada. Si te invitamos con un codigo, ingresalo aca
          para activar 90 dias gratis.
        </p>

        <form onSubmit={handleRedeem} className="mt-6 space-y-3">
          <label htmlFor="code" className="block text-sm font-medium text-text-primary">
            Codigo de invitacion
          </label>
          <input
            id="code"
            type="text"
            placeholder="AGND-XXXX"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 font-mono text-base tracking-wider text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />

          {error && (
            <p className="text-sm text-warning" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !code.trim() || skipping}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Canjeando..." : "Canjear codigo"}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase tracking-wider text-text-secondary">
            o
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          onClick={handleSkip}
          disabled={loading || skipping}
          className="mt-6 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium text-text-primary transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
        >
          {skipping ? "Continuando..." : "Probar 7 dias gratis sin codigo"}
        </button>

        <p className="mt-4 text-xs leading-relaxed text-text-secondary">
          Despues del periodo gratis, vas a poder seguir usando Agendify por
          $15.000/mes. No te pedimos tarjeta hasta que decidas activar la
          suscripcion.
        </p>
      </div>
    </div>
  );
}
