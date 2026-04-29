import { NextResponse } from "next/server";
import { mp, calculateDeposit } from "@/lib/mercadopago";

interface CreateBookingBody {
  professionalSlug: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  date: string;
  time: string;
  notes?: string;
  totalAmount: number;
  depositPercent: number;
  mpSurchargePercent?: number; // recargo adicional configurado por el profesional
}

export async function POST(request: Request) {
  try {
    // ── Validación temprana de env vars críticas ──────────────────
    if (!process.env.MP_ACCESS_TOKEN) {
      console.error("[MP] FATAL: MP_ACCESS_TOKEN no está configurado en las variables de entorno.");
      return NextResponse.json(
        { error: "Configuración de pagos incompleta en el servidor." },
        { status: 500 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      console.error("[MP] FATAL: NEXT_PUBLIC_APP_URL no está configurado en las variables de entorno.");
      return NextResponse.json(
        { error: "Configuración de URL incompleta en el servidor." },
        { status: 500 }
      );
    }

    // ── Parseo y validación del body ─────────────────────────────
    const body = (await request.json()) as Partial<CreateBookingBody>;

    const required: (keyof CreateBookingBody)[] = [
      "professionalSlug",
      "patientName",
      "patientPhone",
      "patientEmail",
      "date",
      "time",
      "totalAmount",
      "depositPercent",
    ];

    for (const field of required) {
      if (!body[field] && body[field] !== 0) {
        return NextResponse.json(
          { error: `Campo requerido: ${field}` },
          { status: 400 }
        );
      }
    }

    const {
      professionalSlug,
      patientName,
      patientPhone,
      patientEmail,
      date,
      time,
      notes,
      totalAmount,
      depositPercent,
      mpSurchargePercent,
    } = body as CreateBookingBody;

    const baseDeposit = calculateDeposit(totalAmount, depositPercent);
    const surcharge = mpSurchargePercent ?? 0;
    // El paciente paga la seña base + el recargo de MP si aplica
    const depositAmount = surcharge > 0
      ? Math.round(baseDeposit * (1 + surcharge / 100))
      : baseDeposit;

    // MP rechaza unit_price <= 0
    if (depositAmount <= 0) {
      console.error(`[MP] depositAmount inválido: ${depositAmount} (totalAmount=${totalAmount}, depositPercent=${depositPercent})`);
      return NextResponse.json(
        { error: "El monto de la seña debe ser mayor a cero." },
        { status: 400 }
      );
    }

    console.log(`[MP] Creando preferencia para ${patientName} — seña: $${depositAmount}`);

    // ── Creación de preferencia en MP ────────────────────────────
    // Nota: se omiten expires/expiration_date_* ya que MP es sensible
    // al formato de fecha con timezone y no son críticos para el flujo.
    const preference = await mp.create({
      body: {
        items: [
          {
            id: crypto.randomUUID(),
            title: `Seña - Sesión ${time}`,
            description: `Reserva de turno con ${professionalSlug}`,
            quantity: 1,
            unit_price: depositAmount,
            currency_id: "ARS",
          },
        ],
        payer: {
          name: patientName,
          phone: {
            area_code: "",
            // MP espera solo dígitos en el número de teléfono
            number: patientPhone.replace(/\D/g, ""),
          },
        },
        back_urls: {
          success: `${appUrl}/${professionalSlug}/confirmar?status=success`,
          failure: `${appUrl}/${professionalSlug}/confirmar?status=failure`,
          pending: `${appUrl}/${professionalSlug}/confirmar?status=pending`,
        },
        auto_return: "approved",
        external_reference: JSON.stringify({
          professionalSlug,
          patientName,
          patientPhone,
          patientEmail,
          date,
          time,
          notes: notes || "",
          totalAmount,
          depositAmount,
        }),
        notification_url: `${appUrl}/api/webhooks/mercadopago`,
        statement_descriptor: "AGENDIFY",
      },
    });

    console.log(`[MP] Preferencia creada: ${preference.id}`);

    return NextResponse.json({
      preferenceId: preference.id,
      initPoint: preference.init_point,
      depositAmount,
    });

  } catch (error) {
    // ── Logging detallado del error real de MP ───────────────────
    // El SDK de MP lanza ApiError con `cause` que contiene el response HTTP.
    if (error instanceof Error) {
      console.error("[MP] Error creando preferencia:");
      console.error("  message:", error.message);
      if (error.cause) {
        console.error("  cause:", JSON.stringify(error.cause, null, 2));
      }
      // Algunos errores del SDK de MP tienen `status` y `body` en la causa
      const cause = error.cause as Record<string, unknown> | undefined;
      if (cause?.status) {
        console.error("  HTTP status:", cause.status);
      }
      if (cause?.body) {
        console.error("  MP response body:", JSON.stringify(cause.body, null, 2));
      }
    } else {
      // Fallback para errores que no son instancias de Error
      try {
        console.error("[MP] Error no-Error:", JSON.stringify(error, null, 2));
      } catch {
        console.error("[MP] Error no serializable:", String(error));
      }
    }

    return NextResponse.json(
      { error: "Error al crear preferencia de pago. Revisá los logs del servidor." },
      { status: 500 }
    );
  }
}
