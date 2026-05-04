// Marca a los profesionales que ya existian como beta con 1 ano de acceso,
// onboardingCompletedAt seteado para que no se les muestre /bienvenida.
//
// Correr UNA SOLA VEZ despues de la migration de subscription/beta codes.
//   tsx scripts/backfill-existing-pros.ts

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  // Import dinamico despues de cargar env — sino DATABASE_URL queda undefined
  // cuando lib/db inicializa el PrismaClient.
  const { db } = await import("../lib/db");

  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  const result = await db.professional.updateMany({
    where: { onboardingCompletedAt: null },
    data: {
      subscriptionStatus: "beta",
      subscriptionExpiresAt: oneYearFromNow,
      onboardingCompletedAt: new Date(),
    },
  });

  console.log(`Backfilled ${result.count} profesionales existentes`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
