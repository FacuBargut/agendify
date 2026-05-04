"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

/* ─── Íconos inline ──────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66 2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const CalendarLogo = ({
  size = 36,
  dark = false,
}: {
  size?: number;
  dark?: boolean;
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.28,
      backgroundColor: dark ? "#0D6E6E" : "rgba(255,255,255,0.18)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 20 20" fill="none">
      <rect x="2" y="4" width="16" height="13" rx="2" stroke="white" strokeWidth="1.6" />
      <path
        d="M6 2v3M14 2v3M2 9h16"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <rect x="5" y="12" width="2.5" height="2.5" rx="0.5" fill="white" opacity="0.9" />
      <rect x="8.75" y="12" width="2.5" height="2.5" rx="0.5" fill="white" opacity="0.5" />
      <rect x="12.5" y="12" width="2.5" height="2.5" rx="0.5" fill="white" opacity="0.3" />
    </svg>
  </div>
);

const LockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
    <rect x="1" y="5.5" width="11" height="7" rx="1.5" stroke="#718096" strokeWidth="1.2" />
    <path
      d="M3.5 5.5V4a3 3 0 016 0v1.5"
      stroke="#718096"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
);

/* ─── Features panel izquierdo ───────────────────────────────── */
const features = [
  "Agenda semanal con disponibilidad personalizada",
  "Recordatorios automáticos por mail con sync a Google Calendar",
  "Cobro de seña online via Mercado Pago",
  "Ficha e historial completo de cada paciente",
];

/* ─── Mini tarjeta de turno (preview decorativo) ─────────────── */
type AppointmentStatus = "confirmed" | "pending";

const TurnoCard = ({
  time,
  name,
  status,
}: {
  time: string;
  name: string;
  status: AppointmentStatus;
}) => {
  const statusConfig = {
    confirmed: {
      label: "Confirmado",
      bg: "rgba(56,161,105,0.2)",
      color: "#86efac",
    },
    pending: {
      label: "Pendiente",
      bg: "rgba(217,119,6,0.2)",
      color: "#fcd34d",
    },
  };
  const s = statusConfig[status];
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 12px",
        borderRadius: 10,
        backgroundColor: "rgba(255,255,255,0.07)",
      }}
    >
      <span
        style={{
          width: 36,
          fontSize: 12,
          fontWeight: 500,
          color: "rgba(255,255,255,0.6)",
          flexShrink: 0,
        }}
      >
        {time}
      </span>
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          backgroundColor: "rgba(255,255,255,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 700,
          color: "white",
          flexShrink: 0,
        }}
      >
        {initials}
      </div>
      <p
        style={{
          flex: 1,
          fontSize: 13,
          fontWeight: 500,
          color: "white",
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
        }}
      >
        {name}
      </p>
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          padding: "2px 8px",
          borderRadius: 20,
          backgroundColor: s.bg,
          color: s.color,
          flexShrink: 0,
        }}
      >
        {s.label}
      </span>
    </div>
  );
};

/* ─── Contenido principal ─────────────────────────────────────── */
function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/agenda";

  return (
    <div style={{ display: "flex", height: "100dvh", overflow: "hidden" }}>

      {/* ══════════════════════════════════════════
          PANEL IZQUIERDO — branding + preview
          (solo visible en pantallas lg+)
      ══════════════════════════════════════════ */}
      <div
        className="hidden lg:flex"
        style={{
          width: "56%",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
          backgroundColor: "#0D6E6E",
          height: "100%",
        }}
      >
        {/* Dot-grid background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.10) 1.5px, transparent 1.5px)",
            backgroundSize: "22px 22px",
          }}
        />
        {/* Círculos decorativos */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 320,
            height: 320,
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.06)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 60,
            left: -60,
            width: 220,
            height: 220,
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.05)",
          }}
        />
        {/* Fade inferior */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 160,
            background:
              "linear-gradient(to top, rgba(7,68,68,0.65) 0%, transparent 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Contenido del panel */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            padding: "32px 44px",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CalendarLogo size={36} />
            <span
              style={{
                color: "white",
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: "-0.02em",
              }}
            >
              Agendify
            </span>
          </div>

          {/* Hero */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              marginTop: 24,
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(230,244,244,0.65)",
                marginBottom: 10,
              }}
            >
              Para profesionales de salud
            </p>
            <h1
              style={{
                fontSize: 38,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.12,
                color: "white",
                marginBottom: 12,
              }}
            >
              Tu agenda,
              <br />
              tu consulta,
              <br />
              en orden.
            </h1>
            <p
              style={{
                fontSize: 16,
                lineHeight: 1.6,
                color: "rgba(230,244,244,0.75)",
                marginBottom: 20,
                maxWidth: 340,
              }}
            >
              Automatizá turnos, recordatorios y cobros.
              <br />
              Enfocate en lo que importa: tus pacientes.
            </p>

            {/* Features */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginBottom: 20,
              }}
            >
              {features.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      backgroundColor: "rgba(255,255,255,0.18)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 5.5l2 2 4-4"
                        stroke="white"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.82)" }}>
                    {f}
                  </span>
                </div>
              ))}
            </div>

            {/* Mini app preview */}
            <div
              style={{
                borderRadius: 16,
                padding: 16,
                backgroundColor: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.13)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "white",
                      marginBottom: 2,
                    }}
                  >
                    Hoy · Jueves 23
                  </p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                    Vista del día
                  </p>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: 20,
                    backgroundColor: "rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.9)",
                  }}
                >
                  4 turnos
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <TurnoCard time="09:00" name="María González" status="confirmed" />
                <TurnoCard time="10:00" name="Carlos Medina" status="pending" />
                <TurnoCard time="11:00" name="Ana Rodríguez" status="confirmed" />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div
            style={{
              display: "flex",
              gap: 32,
              paddingTop: 16,
              borderTop: "1px solid rgba(255,255,255,0.14)",
            }}
          >
            <div>
              <p style={{ fontSize: 22, fontWeight: 700, color: "white", lineHeight: 1.2 }}>
                3 meses
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>
                gratis para beta testers
              </p>
            </div>
            <div>
              <p style={{ fontSize: 22, fontWeight: 700, color: "white", lineHeight: 1.2 }}>
                0 llamadas
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>
                para confirmar un turno
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          PANEL DERECHO — formulario de login
      ══════════════════════════════════════════ */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 28px",
          backgroundColor: "#FFFFFF",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Logo mobile */}
        <div
          className="lg:hidden"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: 40,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 6,
            }}
          >
            <CalendarLogo size={36} dark />
            <span
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: "#1A202C",
                letterSpacing: "-0.02em",
              }}
            >
              Agendify
            </span>
          </div>
          <p style={{ fontSize: 13, color: "#718096" }}>
            Gestión de turnos para profesionales de salud
          </p>
        </div>

        {/* Formulario */}
        <div style={{ width: "100%", maxWidth: 360 }}>
          <div style={{ marginBottom: 32 }}>
            <h2
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: "#1A202C",
                letterSpacing: "-0.025em",
                marginBottom: 8,
              }}
            >
              Ingresá a tu cuenta
            </h2>
            <p style={{ fontSize: 15, color: "#718096", lineHeight: 1.5 }}>
              Accedé a tu agenda y gestioná tus turnos y pacientes.
            </p>
          </div>

          {/* Botón Google */}
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl })}
            style={{
              display: "flex",
              height: 48,
              width: "100%",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              borderRadius: 12,
              border: "1.5px solid #E2E8F0",
              backgroundColor: "#FFFFFF",
              fontSize: 15,
              fontWeight: 500,
              color: "#1A202C",
              cursor: "pointer",
              transition: "all 0.15s ease",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#F8FAFB";
              e.currentTarget.style.borderColor = "#CBD5E0";
              e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#FFFFFF";
              e.currentTarget.style.borderColor = "#E2E8F0";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
            }}
            onMouseDown={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.985)";
            }}
            onMouseUp={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
            }}
          >
            <GoogleIcon />
            Continuar con Google
          </button>

          {/* Separador */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              margin: "24px 0",
            }}
          >
            <div style={{ flex: 1, height: 1, backgroundColor: "#E2E8F0" }} />
            <span style={{ fontSize: 12, color: "#A0AEC0", whiteSpace: "nowrap" }}>
              acceso seguro
            </span>
            <div style={{ flex: 1, height: 1, backgroundColor: "#E2E8F0" }} />
          </div>

          {/* Badge de seguridad */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "10px 16px",
              borderRadius: 10,
              backgroundColor: "#F8FAFB",
              border: "1px solid #E2E8F0",
            }}
          >
            <LockIcon />
            <p style={{ fontSize: 12, color: "#718096" }}>
              Protegido con Google OAuth 2.0 · Sin contraseñas
            </p>
          </div>

          {/* Términos */}
          <p
            style={{
              marginTop: 24,
              textAlign: "center",
              fontSize: 11,
              color: "#A0AEC0",
              lineHeight: 1.6,
            }}
          >
            Al continuar, aceptás los{" "}
            <a
              href="/terminos"
              style={{
                color: "#718096",
                textDecoration: "underline",
                textUnderlineOffset: 2,
              }}
            >
              términos de uso
            </a>{" "}
            y la{" "}
            <a
              href="/privacidad"
              style={{
                color: "#718096",
                textDecoration: "underline",
                textUnderlineOffset: 2,
              }}
            >
              política de privacidad
            </a>
            .
          </p>
        </div>

        {/* Footer */}
        <p
          style={{
            position: "absolute",
            bottom: 24,
            fontSize: 11,
            color: "#CBD5E0",
          }}
        >
          © 2025 Agendify · Rosario, Argentina
        </p>
      </div>
    </div>
  );
}

/* ─── Export ──────────────────────────────────────────────────── */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            minHeight: "100dvh",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#F8FAFB",
          }}
        >
          <div style={{ color: "#718096", fontSize: 14 }}>Cargando…</div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
