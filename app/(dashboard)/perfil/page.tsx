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

  const professionalId = session.user.professionalId;

  const professional = await db.professional.findUnique({
    where: { id: professionalId },
    include: { availability: { orderBy: { dayOfWeek: "asc" } } },
  });

  if (!professional) {
    redirect("/login");
  }

  // Auto-create default availability (Lun-Vie 09-18) if none exists
  let availability = professional.availability;
  if (availability.length === 0) {
    const defaultDays = [1, 2, 3, 4, 5];
    await db.availability.createMany({
      data: defaultDays.map((day) => ({
        professionalId: professional.id,
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "18:00",
        slotDuration: professional.sessionDuration,
        active: true,
      })),
    });
    availability = await db.availability.findMany({
      where: { professionalId: professional.id },
      orderBy: { dayOfWeek: "asc" },
    });
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
    availability: availability.map((a) => ({
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
