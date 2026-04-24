import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.professionalId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const professional = await db.professional.findUnique({
    where: { id: session.user.professionalId },
    include: { availability: true },
  });

  return NextResponse.json({ professional });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.professionalId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();

  const allowed = [
    "name",
    "bio",
    "phone",
    "sessionPrice",
    "depositPercent",
    "sessionDuration",
    "transferAlias",
    "mpSurchargePercent",
  ];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) data[key] = body[key];
  }

  const professional = await db.professional.update({
    where: { id: session.user.professionalId },
    data,
  });

  return NextResponse.json({ professional });
}
