import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

// Layout para todas las rutas autenticadas. Garantiza que el profesional
// haya pasado por /bienvenida (canje de codigo o skip) antes de poder usar
// la app. Sin esto, podria entrar directo a /agenda y saltearse el flujo.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.professionalId) {
    redirect("/login");
  }

  const pro = await db.professional.findUnique({
    where: { id: session.user.professionalId },
    select: { onboardingCompletedAt: true },
  });

  if (!pro?.onboardingCompletedAt) {
    redirect("/bienvenida");
  }

  return <>{children}</>;
}
