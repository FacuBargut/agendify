import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.professionalId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { endpoint } = await request.json();

  if (endpoint) {
    await db.pushSubscription.deleteMany({
      where: {
        professionalId: session.user.professionalId,
        endpoint,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
