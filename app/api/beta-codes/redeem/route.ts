import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/beta-codes/redeem
// Body: { code: string }
//
// Valida y canjea un codigo beta. Si todo ok:
//   - crea BetaCodeRedemption
//   - incrementa redemptionsCount del codigo
//   - actualiza al pro: subscriptionStatus="beta", subscriptionExpiresAt=now+validForDays,
//     onboardingCompletedAt=now
//
// Errores devuelven { error: string } con 4xx.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.professionalId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const codeRaw = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";
  if (!codeRaw) {
    return NextResponse.json({ error: "Falta el codigo" }, { status: 400 });
  }

  const code = await db.betaCode.findUnique({
    where: { code: codeRaw },
  });
  if (!code) {
    return NextResponse.json({ error: "Codigo invalido" }, { status: 404 });
  }

  // Codigo expirado (no se canjeo a tiempo)
  if (code.expiresAt && code.expiresAt < new Date()) {
    return NextResponse.json({ error: "Codigo expirado" }, { status: 410 });
  }

  // Codigo agotado (ya se uso el maximo de veces)
  if (code.redemptionsCount >= code.maxRedemptions) {
    return NextResponse.json({ error: "Codigo agotado" }, { status: 410 });
  }

  // El pro ya canjeo otro codigo antes (un solo canje por profesional)
  const existing = await db.betaCodeRedemption.findUnique({
    where: { professionalId: session.user.professionalId },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Ya canjeaste un codigo antes" },
      { status: 409 }
    );
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + code.validForDays);

  // Transaccion: redemption + incremento + update del pro. Si algo falla,
  // todo se revierte (no quedamos con un canje sin actualizar el contador).
  await db.$transaction([
    db.betaCodeRedemption.create({
      data: {
        codeId: code.id,
        professionalId: session.user.professionalId,
      },
    }),
    db.betaCode.update({
      where: { id: code.id },
      data: { redemptionsCount: { increment: 1 } },
    }),
    db.professional.update({
      where: { id: session.user.professionalId },
      data: {
        subscriptionStatus: "beta",
        subscriptionExpiresAt: expiresAt,
        onboardingCompletedAt: new Date(),
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    expiresAt: expiresAt.toISOString(),
    validForDays: code.validForDays,
  });
}
