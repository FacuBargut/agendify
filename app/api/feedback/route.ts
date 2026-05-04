import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST /api/feedback
// Body: { message: string, rating?: number (1-5) }
//
// Guarda feedback in-app del profesional. Sin moderacion ni rate-limit por
// ahora — durante la beta el volumen es chico y conocemos a los users.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.professionalId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const message =
    typeof body?.message === "string" ? body.message.trim() : "";
  const rating =
    typeof body?.rating === "number" && body.rating >= 1 && body.rating <= 5
      ? Math.round(body.rating)
      : null;

  if (message.length < 3) {
    return NextResponse.json(
      { error: "El mensaje es muy corto" },
      { status: 400 }
    );
  }
  if (message.length > 2000) {
    return NextResponse.json(
      { error: "El mensaje es muy largo" },
      { status: 400 }
    );
  }

  await db.feedback.create({
    data: {
      professionalId: session.user.professionalId,
      message,
      rating,
    },
  });

  return NextResponse.json({ ok: true });
}
