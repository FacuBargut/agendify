import { CheckCircle2, XCircle, Clock, MessageCircle } from "lucide-react";
import { db } from "@/lib/db";
import { formatPeso } from "@/lib/utils";

interface ConfirmarPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    status?: string;
    payment_id?: string;
    external_reference?: string;
  }>;
}

interface ExternalReference {
  professionalSlug: string;
  patientName: string;
  patientPhone: string;
  date: string;
  time: string;
  notes: string;
  totalAmount: number;
  depositAmount: number;
}

export default async function ConfirmarPage({
  params,
  searchParams,
}: ConfirmarPageProps) {
  const { slug } = await params;
  const { status, payment_id, external_reference } = await searchParams;

  const professional = await db.professional.findUnique({
    where: { slug },
  });

  const proName = professional?.name ?? "Profesional";
  const proSpecialty = professional?.specialty ?? "";

  function getInitials(name: string): string {
    return name
      .split(" ")
      .filter((w) => w.length > 0)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  let ref: ExternalReference | null = null;
  if (external_reference) {
    try {
      ref = JSON.parse(decodeURIComponent(external_reference));
    } catch {
      // external_reference might not be valid JSON
    }
  }

  return (
    <div className="min-h-dvh bg-surface">
      <div className="mx-auto max-w-[480px]">
        {/* Header */}
        <div className="bg-background px-4 pb-4 pt-5">
          <span className="text-base font-semibold text-primary">Agendify</span>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-primary">
              <span className="text-base font-medium text-white">
                {getInitials(proName)}
              </span>
            </div>
            <div>
              <h1 className="text-lg font-medium text-text-primary">
                {proName}
              </h1>
              <p className="text-[13px] text-text-secondary">
                {proSpecialty}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-border" />

        {/* Content */}
        <div className="bg-background px-6 py-8">
          {status === "success" && (
            <SuccessView ref={ref} paymentId={payment_id} professionalName={proName} />
          )}

          {status === "failure" && <FailureView slug={slug} />}

          {status === "pending" && <PendingView />}

          {!status && <FailureView slug={slug} />}
        </div>
      </div>
    </div>
  );
}

function SuccessView({
  ref,
  paymentId,
  professionalName,
}: {
  ref: ExternalReference | null;
  paymentId?: string;
  professionalName: string;
}) {
  return (
    <div className="flex flex-col items-center">
      {/* Success icon */}
      <div className="mb-4 flex h-[88px] w-[88px] items-center justify-center rounded-full bg-[#F0FDF4]">
        <CheckCircle2 size={56} strokeWidth={1.5} className="text-success" />
      </div>

      <h2 className="text-xl font-semibold text-text-primary">
        ¡Turno confirmado!
      </h2>
      <p className="mt-1 text-center text-sm text-text-secondary">
        {ref
          ? `Hola ${ref.patientName}, tu turno está reservado.`
          : "Tu turno está reservado."}
      </p>

      {/* Booking summary */}
      {ref && (
        <div className="mt-6 w-full rounded-lg border border-border bg-surface p-4">
          <SummaryRow label="Profesional" value={professionalName} />
          <SummaryRow label="Fecha" value={ref.date} />
          <SummaryRow label="Horario" value={`${ref.time} hs`} />
          <SummaryRow label="Paciente" value={ref.patientName} />
          <div className="my-2 border-t border-border" />
          <SummaryRow
            label="Seña abonada"
            value={formatPeso(ref.depositAmount)}
            highlight
          />
        </div>
      )}

      {/* Payment confirmation card */}
      <div className="mt-4 w-full rounded-lg border border-success/30 bg-[#F0FDF4] p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-success" />
          <div>
            <p className="text-[13px] font-medium text-success">
              Pago procesado correctamente
            </p>
            {paymentId && (
              <p className="mt-1 text-[13px] text-text-secondary">
                ID de pago: #{paymentId}
              </p>
            )}
            <p className="mt-1 text-[12px] text-text-secondary">
              Guardá este número como comprobante.
            </p>
          </div>
        </div>
      </div>

      {/* WhatsApp notice */}
      <div className="mt-4 w-full rounded-lg border border-border border-l-4 border-l-[#25D366] bg-background p-4">
        <div className="flex items-start gap-3">
          <MessageCircle size={20} className="mt-0.5 shrink-0 text-[#25D366]" />
          <p className="text-[13px] text-text-primary">
            Recibirás una confirmación por WhatsApp en los próximos minutos
          </p>
        </div>
      </div>
    </div>
  );
}

function FailureView({ slug }: { slug: string }) {
  return (
    <div className="flex flex-col items-center">
      {/* Error icon */}
      <div className="mb-4 flex h-[88px] w-[88px] items-center justify-center rounded-full bg-[#FEF0EF]">
        <XCircle size={48} strokeWidth={1.5} className="text-[#E24B4A]" />
      </div>

      <h2 className="text-xl font-semibold text-text-primary">
        No pudimos procesar el pago
      </h2>
      <p className="mt-2 text-center text-sm text-text-secondary">
        Tu turno no fue confirmado. Podés intentarlo de nuevo.
      </p>

      <a
        href={`/${slug}`}
        className="mt-6 flex h-12 w-full items-center justify-center rounded-lg bg-primary text-[15px] font-medium text-white transition-opacity hover:opacity-90"
      >
        Volver a intentar
      </a>
    </div>
  );
}

function PendingView() {
  return (
    <div className="flex flex-col items-center">
      {/* Pending icon */}
      <div className="mb-4 flex h-[88px] w-[88px] items-center justify-center rounded-full bg-[#FFFBEB]">
        <Clock size={48} strokeWidth={1.5} className="text-[#D97706]" />
      </div>

      <h2 className="text-xl font-semibold text-text-primary">
        Pago en proceso
      </h2>
      <p className="mt-2 text-center text-sm text-text-secondary">
        Tu pago está siendo procesado.
        <br />
        Te avisaremos por WhatsApp cuando se confirme.
      </p>

      {/* Info card */}
      <div className="mt-6 w-full rounded-lg border border-[#D97706]/30 bg-[#FFFBEB] p-4">
        <div className="flex items-start gap-3">
          <Clock size={20} className="mt-0.5 shrink-0 text-[#D97706]" />
          <p className="text-[13px] text-text-primary">
            Algunos medios de pago pueden demorar hasta 48 horas en acreditarse.
            No es necesario que vuelvas a pagar.
          </p>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span
        className={`text-[13px] ${highlight ? "font-semibold text-primary" : "text-text-secondary"}`}
      >
        {label}
      </span>
      <span
        className={`text-[13px] font-medium ${highlight ? "font-semibold text-primary" : "text-text-primary"}`}
      >
        {value}
      </span>
    </div>
  );
}
