import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/beta-codes/skip
//
// El pro elige NO canjear codigo y continuar con el trial de 7 dias que ya
// quedo seteado al crear la cuenta. Solo marca onboardingCompletedAt para
// que no vuelva a ver /bienvenida.
export async function POST() {
  const session = await auth();
  if (!session?.user?.professionalId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  await db.professional.update({
    where: { id: session.user.professionalId },
    data: { onboardingCompletedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
