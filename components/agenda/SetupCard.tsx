"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Lock, ChevronRight, X, Copy, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OnboardingSteps {
  profileDone: boolean;     // phone configurado
  availabilityDone: boolean; // siempre true (hay defaults)
  cobroDone: boolean;       // transferAlias seteado
  slug: string;
  appUrl: string;
}

const DISMISS_KEY = "agendify_setup_dismissed";
// Persistente entre sesiones — una vez que copiaste o cerraste el banner
// de "perfil completo", no volves a verlo. Si lo necesitas, el link sigue
// disponible desde /perfil.
const SHARE_DISMISS_KEY = "agendify_share_link_dismissed";

export default function SetupCard({ steps }: { steps: OnboardingSteps }) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const allDone = steps.profileDone && steps.availabilityDone && steps.cobroDone;
  const bookingUrl = `${steps.appUrl}/${steps.slug}`;

  const doneCount =
    1 + // cuenta siempre done
    (steps.profileDone ? 1 : 0) +
    (steps.availabilityDone ? 1 : 0) +
    (steps.cobroDone ? 1 : 0);

  const totalSteps = 4;

  useEffect(() => {
    if (allDone) {
      try {
        const dismissed = localStorage.getItem(SHARE_DISMISS_KEY);
        if (!dismissed) setShareVisible(true);
      } catch {
        setShareVisible(true);
      }
      return;
    }
    // No mostrar si el usuario eligió "recordarme más tarde" en esta sesión
    try {
      const dismissed = sessionStorage.getItem(DISMISS_KEY);
      if (!dismissed) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, [allDone]);

  function dismiss() {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch { /* ignore */ }
    setVisible(false);
  }

  function dismissShare() {
    try {
      localStorage.setItem(SHARE_DISMISS_KEY, "1");
    } catch { /* ignore */ }
    setShareVisible(false);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      // Mostrar feedback "Copiado" un instante y despues cerrar el banner.
      setTimeout(() => {
        dismissShare();
      }, 1500);
    } catch {
      /* fallback: noop */
    }
  }

  if (allDone && !shareVisible) return null;
  if (!allDone && !visible) return null;

  // ── Vista: todo completo → banner de éxito con link ──
  if (allDone) {
    return (
      <div className="mx-3 mb-3 rounded-[14px] border border-[#C0DD97] bg-[#EAF3DE] overflow-hidden page-enter">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#639922]">
              <Check size={16} strokeWidth={2.5} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-[#3B6D11]">
                ¡Perfil completo! Ya podés compartir tu link
              </p>
              <p className="text-[11px] text-[#639922] mt-0.5">
                Tus pacientes pueden reservar turnos desde ahora
              </p>
            </div>
            <button
              type="button"
              onClick={dismissShare}
              className="flex shrink-0 h-6 w-6 items-center justify-center rounded-full hover:bg-[#C0DD97]/60 transition-colors"
              aria-label="Cerrar"
            >
              <X size={13} strokeWidth={2} className="text-[#3B6D11]" />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#C0DD97] bg-white/70 px-3 py-2.5">
            <span className="flex-1 truncate text-[12px] text-[#3B6D11] font-mono">
              {bookingUrl}
            </span>
            <button
              type="button"
              onClick={copyLink}
              className="flex shrink-0 items-center gap-1 rounded-md bg-[#639922] px-2.5 py-1 text-[11px] font-medium text-white transition-opacity hover:opacity-90"
            >
              {copied ? (
                <><CheckCheck size={12} /> Copiado</>
              ) : (
                <><Copy size={12} /> Copiar</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Vista: onboarding en progreso ──
  const progressPct = Math.round((doneCount / totalSteps) * 100);

  const stepItems = [
    {
      id: "cuenta",
      label: "Crear cuenta",
      desc: "Listo — ya iniciaste sesión con Google",
      done: true,
      href: null,
    },
    {
      id: "perfil",
      label: "Completar perfil",
      desc: "Agregá tu teléfono de WhatsApp y bio",
      done: steps.profileDone,
      href: "/perfil",
    },
    {
      id: "disponibilidad",
      label: "Configurar disponibilidad",
      desc: "Días y horarios de atención",
      done: steps.availabilityDone,
      href: "/perfil",
    },
    {
      id: "cobro",
      label: "Métodos de cobro",
      desc: "Alias de transferencia o MercadoPago",
      done: steps.cobroDone,
      href: "/perfil",
    },
  ] as const;

  return (
    <div className="mx-3 mb-3 rounded-[14px] border border-[#B5D4F4] bg-[#E6F1FB] overflow-hidden page-enter">
      {/* Header */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#185FA5]">
          {/* Rocket icon */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
            <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
            <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
            <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-[#0C447C]">
            Configurá tu perfil profesional
          </p>
          <p className="text-[11px] text-[#185FA5] mt-0.5">
            Completá estos pasos antes de compartir tu link
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="flex shrink-0 h-6 w-6 items-center justify-center rounded-full hover:bg-[#B5D4F4]/60 transition-colors"
          aria-label="Cerrar"
        >
          <X size={13} strokeWidth={2} className="text-[#185FA5]" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-3">
        <div className="h-1.5 w-full rounded-full bg-[#B5D4F4] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#185FA5] transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="mt-1.5 text-[10px] text-[#185FA5]">
          {doneCount} de {totalSteps} pasos completados
        </p>
      </div>

      {/* Steps */}
      <div className="border-t border-[#B5D4F4]">
        {stepItems.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={item.done || !item.href}
            onClick={() => item.href && router.push(item.href)}
            className={cn(
              "flex w-full items-center gap-3 border-b border-[#B5D4F4]/60 px-4 py-3 text-left last:border-b-0 transition-colors",
              item.done
                ? "bg-white/40 cursor-default"
                : item.href
                  ? "bg-white/70 hover:bg-white/90 cursor-pointer"
                  : "bg-white/40 cursor-default"
            )}
          >
            {/* Circle check */}
            <span className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors",
              item.done
                ? "border-[#185FA5] bg-[#185FA5]"
                : "border-[#B5D4F4] bg-transparent"
            )}>
              {item.done && <Check size={10} strokeWidth={3} className="text-white" />}
            </span>

            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-[12px] font-medium",
                item.done ? "text-[#378ADD] line-through" : "text-[#0C447C]"
              )}>
                {item.label}
              </p>
              <p className="text-[10px] text-[#185FA5]/70 mt-0.5 truncate">
                {item.desc}
              </p>
            </div>

            {!item.done && item.href && (
              <ChevronRight size={14} strokeWidth={1.5} className="text-[#B5D4F4] shrink-0" />
            )}
          </button>
        ))}

        {/* Share link — bloqueado */}
        <div className="flex items-center gap-3 bg-[#F1EFE8]/80 px-4 py-3">
          <Lock size={14} strokeWidth={1.5} className="text-[#888780] shrink-0 opacity-60" />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-[#5F5E5A]">
              Compartir tu link con pacientes
            </p>
            <p className="text-[10px] text-[#888780] mt-0.5">
              Disponible al completar los pasos anteriores
            </p>
          </div>
        </div>
      </div>

      {/* Dismiss */}
      <div className="flex justify-end px-4 py-2 bg-white/30">
        <button
          type="button"
          onClick={dismiss}
          className="text-[11px] text-[#185FA5] hover:underline transition-colors"
        >
          Recordarme más tarde
        </button>
      </div>
    </div>
  );
}
