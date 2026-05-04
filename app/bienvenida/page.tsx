import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import BienvenidaForm from "./BienvenidaForm";

// Si el pro ya completo onboarding, no tiene sentido mostrar esta pantalla
// — lo mandamos a /agenda. Tampoco entra si no esta logueado.
export default async function BienvenidaPage() {
  const session = await auth();
  if (!session?.user?.professionalId) {
    redirect("/login");
  }

  const pro = await db.professional.findUnique({
    where: { id: session.user.professionalId },
    select: { name: true, onboardingCompletedAt: true },
  });

  if (!pro) redirect("/login");
  if (pro.onboardingCompletedAt) redirect("/agenda");

  // Suspense necesario porque BienvenidaForm usa useSearchParams para leer
  // el ?invite=XXXX de los magic links.
  return (
    <Suspense fallback={null}>
      <BienvenidaForm name={pro.name} />
    </Suspense>
  );
}
