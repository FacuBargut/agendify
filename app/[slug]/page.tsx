import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import BookingFlow from "@/components/paciente/BookingFlow";
import type { ProfessionalPublic } from "@/lib/types";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const professional = await db.professional.findUnique({
    where: { slug },
  });

  if (!professional) {
    notFound();
  }

  const pro: ProfessionalPublic = {
    id: professional.id,
    name: professional.name,
    slug: professional.slug,
    specialty: professional.specialty,
    bio: professional.bio,
    sessionPrice: professional.sessionPrice,
    depositPercent: professional.depositPercent,
    sessionDuration: professional.sessionDuration,
    transferAlias: professional.transferAlias,
    mpSurchargePercent: professional.mpSurchargePercent,
    phone: professional.phone,
  };

  return <BookingFlow professional={pro} />;
}
