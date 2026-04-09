import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import BottomNav from "@/components/layout/BottomNav";
import PerfilScreen from "@/components/perfil/PerfilScreen";

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user?.professionalId) {
    redirect("/login");
  }

  const professional = await db.professional.findUnique({
    where: { id: session.user.professionalId },
    include: { availability: { orderBy: { dayOfWeek: "asc" } } },
  });

  if (!professional) {
    redirect("/login");
  }

  const serialized = {
    id: professional.id,
    name: professional.name,
    email: professional.email,
    slug: professional.slug,
    specialty: professional.specialty,
    bio: professional.bio,
    phone: professional.phone,
    sessionPrice: professional.sessionPrice,
    depositPercent: professional.depositPercent,
    sessionDuration: professional.sessionDuration,
    plan: professional.plan,
    availability: professional.availability.map((a) => ({
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime,
      endTime: a.endTime,
      slotDuration: a.slotDuration,
      active: a.active,
    })),
  };

  return (
    <>
      <PerfilScreen professional={serialized} />
      <BottomNav />
    </>
  );
}
