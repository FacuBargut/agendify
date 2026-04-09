"use client";

import { useState, useMemo, useCallback } from "react";
import { signOut } from "next-auth/react";
import { Link2, LogOut, Loader2, Check, Copy } from "lucide-react";
import { cn, formatPeso } from "@/lib/utils";
import Toast from "@/components/ui/Toast";

// ── Types ──────────────────────────────────────────────

interface AvailabilityData {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  active: boolean;
}

interface ProfessionalData {
  id: string;
  name: string;
  email: string;
  slug: string;
  specialty: string;
  bio: string | null;
  phone: string | null;
  sessionPrice: number;
  depositPercent: number;
  sessionDuration: number;
  plan: string;
  availability: AvailabilityData[];
}

const SPECIALTY_LABELS: Record<string, string> = {
  psychology: "Psicología",
  kinesiology: "Kinesiología",
  nutrition: "Nutrición",
};

const PLAN_CONFIG: Record<string, { label: string; bg: string; text: string }> =
  {
    basic: { label: "Plan Básico", bg: "bg-surface", text: "text-text-secondary" },
    pro: { label: "Plan Pro", bg: "bg-primary-light", text: "text-primary" },
    consultorio: {
      label: "Plan Consultorio",
      bg: "bg-[#EEF2FF]",
      text: "text-[#4F46E5]",
    },
  };

const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const DEFAULT_AVAILABILITY: AvailabilityData[] = [1, 2, 3, 4, 5].map(
  (day) => ({
    dayOfWeek: day,
    startTime: "09:00",
    endTime: "18:00",
    slotDuration: 50,
    active: true,
  })
);

const DURATION_OPTIONS = [30, 45, 50, 60, 90];
const DEPOSIT_OPTIONS = [0, 20, 30, 50, 100];

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter((w) => w.length > 0)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ── Main Component ─────────────────────────────────────

export default function PerfilScreen({
  professional: initialData,
}: {
  professional: ProfessionalData;
}) {
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
  }, []);

  return (
    <main className="flex-1 pb-[72px]">
      {/* Header section */}
      <ProfileHeader professional={initialData} onCopy={() => showToast("Link copiado")} />

      {/* Datos personales */}
      <DatosPersonales professional={initialData} onSaved={() => showToast("Cambios guardados")} />

      {/* Configuración de sesión */}
      <SesionConfig professional={initialData} onSaved={() => showToast("Configuración guardada")} />

      {/* Disponibilidad */}
      <DisponibilidadSection
        professional={initialData}
        onSaved={() => showToast("Disponibilidad actualizada")}
      />

      {/* Cuenta */}
      <CuentaSection professional={initialData} onCopy={() => showToast("Link copiado")} />

      <Toast
        message={toastMessage}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
    </main>
  );
}

// ── Profile Header ─────────────────────────────────────

function ProfileHeader({
  professional,
  onCopy,
}: {
  professional: ProfessionalData;
  onCopy: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const plan = PLAN_CONFIG[professional.plan] || PLAN_CONFIG.basic;
  const publicUrl = `agendify.com.ar/${professional.slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://${publicUrl}`).then(() => {
      setCopied(true);
      onCopy();
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col items-center px-4 pt-6 pb-5">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary mb-3">
        <span className="text-[20px] font-medium text-white">
          {getInitials(professional.name)}
        </span>
      </div>
      <h1 className="text-[20px] font-medium text-text-primary">
        {professional.name}
      </h1>
      <p className="text-[13px] text-text-secondary mt-0.5">
        {SPECIALTY_LABELS[professional.specialty] || professional.specialty}
      </p>
      <span
        className={cn(
          "mt-2 inline-flex items-center rounded-full px-3 py-0.5 text-[12px] font-medium",
          plan.bg,
          plan.text
        )}
      >
        {plan.label}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="mt-3 flex items-center gap-1.5 text-[13px] text-primary hover:underline"
      >
        <Link2 size={12} strokeWidth={1.5} />
        {copied ? "Link copiado ✓" : publicUrl}
      </button>
    </div>
  );
}

// ── Datos Personales ───────────────────────────────────

function DatosPersonales({
  professional,
  onSaved,
}: {
  professional: ProfessionalData;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(professional.name);
  const [phone, setPhone] = useState(professional.phone || "");
  const [bio, setBio] = useState(professional.bio || "");

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          bio: bio.trim() || null,
        }),
      });
      setEditing(false);
      onSaved();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(professional.name);
    setPhone(professional.phone || "");
    setBio(professional.bio || "");
    setEditing(false);
  };

  return (
    <section className="border-t border-border px-4 pt-5 pb-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-medium text-text-primary">Mis datos</h2>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-[13px] font-medium text-primary"
          >
            Editar
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] text-text-secondary mb-1">
              Nombre completo
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-[48px] px-3 border border-border rounded-lg text-[14px] focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] text-text-secondary mb-1">
              Especialidad
            </label>
            <input
              type="text"
              value={SPECIALTY_LABELS[professional.specialty] || professional.specialty}
              disabled
              className="w-full h-[48px] px-3 border border-border rounded-lg text-[14px] bg-surface text-text-secondary cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-[11px] text-text-secondary mb-1">
              Teléfono WhatsApp
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="341 555 1234"
              className="w-full h-[48px] px-3 border border-border rounded-lg text-[14px] focus:border-primary focus:outline-none"
            />
            <p className="text-[12px] text-text-secondary mt-1">
              Los pacientes recibirán notificaciones en este número
            </p>
          </div>
          <div>
            <label className="block text-[11px] text-text-secondary mb-1">
              Bio / descripción
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Contá brevemente sobre tu práctica..."
              className="w-full px-3 py-2 border border-border rounded-lg text-[14px] resize-none focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 h-[44px] rounded-lg border border-border text-[14px] font-medium text-text-secondary hover:bg-surface transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 h-[44px] rounded-lg bg-primary text-white text-[14px] font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar cambios"
              )}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <DataRow label="Nombre completo" value={name} />
          <DataRow
            label="Especialidad"
            value={SPECIALTY_LABELS[professional.specialty] || professional.specialty}
          />
          <DataRow label="Teléfono WhatsApp" value={phone || "—"} />
          <DataRow label="Bio / descripción" value={bio || "—"} last />
        </div>
      )}
    </section>
  );
}

function DataRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div className={cn("py-3", !last && "border-b border-border")}>
      <p className="text-[11px] text-text-secondary">{label}</p>
      <p className="text-[14px] text-text-primary mt-0.5">{value}</p>
    </div>
  );
}

// ── Sesion Config ──────────────────────────────────────

function SesionConfig({
  professional,
  onSaved,
}: {
  professional: ProfessionalData;
  onSaved: () => void;
}) {
  const [sessionPrice, setSessionPrice] = useState(professional.sessionPrice);
  const [depositPercent, setDepositPercent] = useState(
    professional.depositPercent
  );
  const [sessionDuration, setSessionDuration] = useState(
    professional.sessionDuration
  );
  const [saving, setSaving] = useState(false);

  const depositPreview = Math.round((sessionPrice * depositPercent) / 100);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionPrice, depositPercent, sessionDuration }),
      });
      onSaved();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="border-t border-border px-4 pt-5 pb-2">
      <h2 className="text-[15px] font-medium text-text-primary mb-4">
        Mis sesiones
      </h2>

      {/* Precio */}
      <div className="mb-5">
        <label className="block text-[11px] text-text-secondary mb-1">
          Precio de la sesión
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-text-secondary">
            $
          </span>
          <input
            type="number"
            value={sessionPrice}
            onChange={(e) => setSessionPrice(Number(e.target.value))}
            min={1000}
            step={500}
            className="w-full h-[48px] pl-7 pr-3 border border-border rounded-lg text-[14px] focus:border-primary focus:outline-none"
          />
        </div>
        <p className="text-[12px] text-text-secondary mt-1">
          Los pacientes verán este precio al reservar
        </p>
      </div>

      {/* Seña */}
      <div className="mb-5">
        <label className="block text-[11px] text-text-secondary mb-1">
          Seña requerida para reservar
        </label>
        <div className="flex items-center gap-3 mb-2">
          <input
            type="range"
            min={0}
            max={100}
            step={10}
            value={depositPercent}
            onChange={(e) => setDepositPercent(Number(e.target.value))}
            className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-primary"
          />
          <span className="shrink-0 text-[14px] font-medium text-text-primary w-10 text-right">
            {depositPercent}%
          </span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {DEPOSIT_OPTIONS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setDepositPercent(v)}
              className={cn(
                "rounded-full px-3 py-1 text-[12px] font-medium border transition-colors",
                depositPercent === v
                  ? "bg-primary text-white border-primary"
                  : "bg-background text-text-secondary border-border"
              )}
            >
              {v}%
            </button>
          ))}
        </div>
      </div>

      {/* Duración */}
      <div className="mb-4">
        <label className="block text-[11px] text-text-secondary mb-2">
          Duración de cada sesión
        </label>
        <div className="flex gap-1.5 flex-wrap">
          {DURATION_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setSessionDuration(d)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-[13px] font-medium border transition-colors",
                sessionDuration === d
                  ? "bg-primary text-white border-primary"
                  : "bg-background text-text-secondary border-border"
              )}
            >
              {d} min
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-[10px] bg-primary-light p-3 mb-4">
        <p className="text-[12px] text-text-secondary">
          Con estos valores, la seña a cobrar sería:
        </p>
        <p className="text-[20px] font-semibold text-primary mt-1">
          {formatPeso(depositPreview)}
        </p>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full h-[48px] rounded-lg bg-primary text-white text-[14px] font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Guardando...
          </>
        ) : (
          "Guardar configuración"
        )}
      </button>
    </section>
  );
}

// ── Disponibilidad ─────────────────────────────────────

function DisponibilidadSection({
  professional,
  onSaved,
}: {
  professional: ProfessionalData;
  onSaved: () => void;
}) {
  // Build initial state: fill all 7 days, using defaults for missing ones
  const buildInitialDays = () => {
    const days: AvailabilityData[] = [];
    for (let i = 0; i < 7; i++) {
      const existing = professional.availability.find(
        (a) => a.dayOfWeek === i
      );
      if (existing) {
        days.push({ ...existing });
      } else {
        const defaultDay = DEFAULT_AVAILABILITY.find(
          (a) => a.dayOfWeek === i
        );
        days.push(
          defaultDay
            ? { ...defaultDay }
            : {
                dayOfWeek: i,
                startTime: "09:00",
                endTime: "18:00",
                slotDuration: 50,
                active: false,
              }
        );
      }
    }
    return days;
  };

  const [days, setDays] = useState<AvailabilityData[]>(buildInitialDays);
  const [slotDuration, setSlotDuration] = useState(() => {
    const first = professional.availability.find((a) => a.active);
    return first?.slotDuration || 50;
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<number, string>>({});

  // Total weekly slots
  const totalSlots = useMemo(() => {
    let total = 0;
    for (const day of days) {
      if (!day.active) continue;
      const [sh, sm] = day.startTime.split(":").map(Number);
      const [eh, em] = day.endTime.split(":").map(Number);
      const mins = (eh * 60 + em) - (sh * 60 + sm);
      if (mins > 0) total += Math.floor(mins / slotDuration);
    }
    return total;
  }, [days, slotDuration]);

  const updateDay = (index: number, updates: Partial<AvailabilityData>) => {
    setDays((prev) =>
      prev.map((d, i) => (i === index ? { ...d, ...updates } : d))
    );
    // Clear error for this day
    if (errors[index]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }
  };

  const handleSave = async () => {
    // Validate
    const newErrors: Record<number, string> = {};
    for (const day of days) {
      if (!day.active) continue;
      const [sh, sm] = day.startTime.split(":").map(Number);
      const [eh, em] = day.endTime.split(":").map(Number);
      if (sh * 60 + sm >= eh * 60 + em) {
        newErrors[day.dayOfWeek] =
          "El horario de inicio debe ser menor al de fin";
      }
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      const availability = days
        .filter((d) => d.active)
        .map((d) => ({
          dayOfWeek: d.dayOfWeek,
          startTime: d.startTime,
          endTime: d.endTime,
          slotDuration,
          active: true,
        }));

      await fetch("/api/perfil/disponibilidad", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability }),
      });

      onSaved();
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  // Reorder: show Mon-Sun (1,2,3,4,5,6,0)
  const orderedDays = useMemo(() => {
    const ordered = [...days];
    const sunday = ordered.shift()!; // remove index 0 (Sunday)
    ordered.push(sunday); // add to end
    return ordered;
  }, [days]);

  return (
    <section className="border-t border-border px-4 pt-5 pb-2">
      <h2 className="text-[15px] font-medium text-text-primary mb-4">
        Mi disponibilidad
      </h2>

      <div className="space-y-3 mb-5">
        {orderedDays.map((day) => (
          <div key={day.dayOfWeek}>
            <div className="flex items-center gap-3">
              {/* Toggle */}
              <button
                type="button"
                role="switch"
                aria-checked={day.active}
                onClick={() =>
                  updateDay(day.dayOfWeek, { active: !day.active })
                }
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors",
                  day.active ? "bg-primary" : "bg-border"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition-transform mt-0.5",
                    day.active ? "translate-x-[22px]" : "translate-x-0.5"
                  )}
                />
              </button>

              {/* Day name */}
              <span
                className={cn(
                  "text-[14px] font-medium w-24 shrink-0",
                  day.active ? "text-text-primary" : "text-text-secondary"
                )}
              >
                {DAY_NAMES[day.dayOfWeek]}
              </span>

              {/* Time inputs */}
              {day.active ? (
                <div className="flex items-center gap-1.5 flex-1">
                  <input
                    type="time"
                    value={day.startTime}
                    onChange={(e) =>
                      updateDay(day.dayOfWeek, { startTime: e.target.value })
                    }
                    className="h-9 w-[90px] px-2 border border-border rounded-md text-[13px] focus:border-primary focus:outline-none"
                  />
                  <span className="text-[12px] text-text-secondary">a</span>
                  <input
                    type="time"
                    value={day.endTime}
                    onChange={(e) =>
                      updateDay(day.dayOfWeek, { endTime: e.target.value })
                    }
                    className="h-9 w-[90px] px-2 border border-border rounded-md text-[13px] focus:border-primary focus:outline-none"
                  />
                </div>
              ) : (
                <span className="text-[12px] text-text-secondary">
                  No atiende
                </span>
              )}
            </div>
            {errors[day.dayOfWeek] && (
              <p className="text-[12px] text-[#E24B4A] mt-1 ml-14">
                {errors[day.dayOfWeek]}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Slot duration */}
      <div className="mb-4">
        <label className="block text-[11px] text-text-secondary mb-2">
          Duración de cada turno
        </label>
        <div className="flex gap-1.5 flex-wrap">
          {DURATION_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setSlotDuration(d)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-[13px] font-medium border transition-colors",
                slotDuration === d
                  ? "bg-primary text-white border-primary"
                  : "bg-background text-text-secondary border-border"
              )}
            >
              {d} min
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-[10px] bg-primary-light p-3 mb-4">
        <p className="text-[13px] text-text-secondary">
          Con esta configuración tenés{" "}
          <span className="font-semibold text-primary">{totalSlots} turnos</span>{" "}
          disponibles por semana
        </p>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full h-[48px] rounded-lg bg-primary text-white text-[14px] font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Guardando...
          </>
        ) : (
          "Guardar disponibilidad"
        )}
      </button>
    </section>
  );
}

// ── Cuenta ─────────────────────────────────────────────

function CuentaSection({
  professional,
  onCopy,
}: {
  professional: ProfessionalData;
  onCopy: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const plan = PLAN_CONFIG[professional.plan] || PLAN_CONFIG.basic;
  const publicUrl = `agendify.com.ar/${professional.slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://${publicUrl}`).then(() => {
      setCopied(true);
      onCopy();
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleLogout = () => {
    if (
      confirm(
        "¿Cerrar sesión? Tendrás que volver a ingresar con Google."
      )
    ) {
      signOut({ callbackUrl: "/login" });
    }
  };

  const handleUpgrade = () => {
    alert(
      "Próximamente podrás mejorar tu plan desde acá. Por ahora contactanos por WhatsApp."
    );
  };

  return (
    <section className="border-t border-border px-4 pt-5 pb-6 mt-2">
      <h2 className="text-[15px] font-medium text-text-primary mb-4">
        Cuenta
      </h2>

      {/* Email */}
      <div className="py-3 border-b border-border">
        <p className="text-[11px] text-text-secondary">Email de la cuenta</p>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-[14px] text-text-primary">{professional.email}</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-text-secondary">
            <svg width="12" height="12" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </span>
        </div>
      </div>

      {/* Plan */}
      <div className="py-3 border-b border-border">
        <p className="text-[11px] text-text-secondary">Plan activo</p>
        <div className="flex items-center justify-between mt-0.5">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium",
              plan.bg,
              plan.text
            )}
          >
            {plan.label}
          </span>
          <button
            type="button"
            onClick={handleUpgrade}
            className="text-[13px] font-medium text-primary"
          >
            Mejorar plan →
          </button>
        </div>
      </div>

      {/* Public link */}
      <div className="py-3 border-b border-border">
        <p className="text-[11px] text-text-secondary">
          Tu link de reservas
        </p>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-[14px] text-primary">{publicUrl}</p>
          <button
            type="button"
            onClick={handleCopy}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface transition-colors"
            aria-label="Copiar link"
          >
            {copied ? (
              <Check size={14} className="text-success" />
            ) : (
              <Copy size={14} className="text-text-secondary" />
            )}
          </button>
        </div>
      </div>

      {/* Logout */}
      <button
        type="button"
        onClick={handleLogout}
        className="mt-6 flex w-full h-[48px] items-center justify-center gap-2 rounded-lg border border-[#E24B4A] text-[15px] font-medium text-[#E24B4A] transition-colors hover:bg-[#FEF0EF]"
      >
        <LogOut size={16} strokeWidth={1.5} />
        Cerrar sesión
      </button>
    </section>
  );
}
