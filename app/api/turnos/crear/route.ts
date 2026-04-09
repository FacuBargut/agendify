import { NextResponse } from "next/server";
import { mp, calculateDeposit } from "@/lib/mercadopago";

interface CreateBookingBody {
  professionalSlug: string;
  patientName: string;
  patientPhone: string;
  date: string;
  time: string;
  notes?: string;
  totalAmount: number;
  depositPercent: number;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<CreateBookingBody>;

    // Validate required fields
    const required: (keyof CreateBookingBody)[] = [
      "professionalSlug",
      "patientName",
      "patientPhone",
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
      date,
      time,
      notes,
      totalAmount,
      depositPercent,
    } = body as CreateBookingBody;

    const depositAmount = calculateDeposit(totalAmount, depositPercent);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const preference = await mp.create({
      body: {
        items: [
          {
            id: crypto.randomUUID(),
            title: `Seña - Sesión ${time} del ${date}`,
            description: `Reserva con ${professionalSlug}`,
            quantity: 1,
            unit_price: depositAmount,
            currency_id: "ARS",
          },
        ],
        payer: {
          name: patientName,
          phone: { number: patientPhone },
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
          date,
          time,
          notes: notes || "",
          totalAmount,
          depositAmount,
        }),
        notification_url: `${appUrl}/api/webhooks/mercadopago`,
        statement_descriptor: "AGENDIFY",
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: new Date(
          Date.now() + 30 * 60 * 1000
        ).toISOString(),
      },
    });

    return NextResponse.json({
      preferenceId: preference.id,
      initPoint: preference.init_point,
      depositAmount,
    });
  } catch (error) {
    console.error("[MP] Error creando preferencia:", error);
    return NextResponse.json(
      { error: "Error al crear preferencia de pago" },
      { status: 500 }
    );
  }
}
