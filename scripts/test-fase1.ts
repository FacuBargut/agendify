// Test exhaustivo de Fase 1: schema, codigos beta, canje, skip, feedback.
// Crea datos de test con prefijo claro (test-fase1-...) y limpia al final.
//
// Uso: npx tsx scripts/test-fase1.ts

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const TEST_PREFIX = "test-fase1";
let passed = 0;
let failed = 0;

function ok(msg: string) {
  console.log(`  ✓ ${msg}`);
  passed++;
}
function fail(msg: string, details?: unknown) {
  console.log(`  ✗ ${msg}`);
  if (details !== undefined) console.log(`    ${JSON.stringify(details)}`);
  failed++;
}
function section(title: string) {
  console.log(`\n${title}`);
}

async function main() {
  const { db } = await import("../lib/db");

  // ─── Limpieza inicial (por si quedo basura de runs anteriores) ────────────
  await db.feedback.deleteMany({ where: { professional: { email: { startsWith: TEST_PREFIX } } } });
  await db.betaCodeRedemption.deleteMany({ where: { professional: { email: { startsWith: TEST_PREFIX } } } });
  await db.professional.deleteMany({ where: { email: { startsWith: TEST_PREFIX } } });
  await db.betaCode.deleteMany({ where: { code: { startsWith: "TEST-" } } });

  // ─── Helpers ──────────────────────────────────────────────────────────────
  async function createPro(suffix: string) {
    const trialExpires = new Date();
    trialExpires.setDate(trialExpires.getDate() + 7);
    return db.professional.create({
      data: {
        name: `Test ${suffix}`,
        email: `${TEST_PREFIX}-${suffix}@example.com`,
        slug: `${TEST_PREFIX}-${suffix}-${Date.now()}`,
        subscriptionStatus: "trial",
        subscriptionExpiresAt: trialExpires,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  section("[1] Schema y constraints");
  // ═══════════════════════════════════════════════════════════════════════════

  // Pro nuevo arranca en trial con 7 dias
  const pro1 = await createPro("pro1");
  if (pro1.subscriptionStatus === "trial") ok("Pro nuevo arranca en 'trial'");
  else fail("subscriptionStatus inicial", pro1.subscriptionStatus);

  if (pro1.subscriptionExpiresAt && pro1.subscriptionExpiresAt > new Date()) {
    ok("Pro nuevo tiene subscriptionExpiresAt en el futuro");
  } else {
    fail("subscriptionExpiresAt no seteado");
  }

  if (pro1.onboardingCompletedAt === null) ok("onboardingCompletedAt arranca en null");
  else fail("onboardingCompletedAt deberia ser null", pro1.onboardingCompletedAt);

  // ═══════════════════════════════════════════════════════════════════════════
  section("[2] Generacion de codigos");
  // ═══════════════════════════════════════════════════════════════════════════

  const codeSingle = await db.betaCode.create({
    data: { code: "TEST-SINGLE", validForDays: 90, maxRedemptions: 1 },
  });
  ok("Crea codigo single-use 90d");

  const codeMulti = await db.betaCode.create({
    data: { code: "TEST-MULTI", validForDays: 30, maxRedemptions: 3 },
  });
  ok("Crea codigo multi-use (3 canjes)");

  const codeExpired = await db.betaCode.create({
    data: {
      code: "TEST-EXPIRED",
      validForDays: 90,
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // ayer
    },
  });
  ok("Crea codigo ya expirado");

  // Unique constraint en code
  try {
    await db.betaCode.create({
      data: { code: "TEST-SINGLE", validForDays: 90 },
    });
    fail("Deberia rechazar codigo duplicado");
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") ok("Codigo duplicado: rechazado por unique");
    else fail("Error inesperado en codigo duplicado", err);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  section("[3] Canje de codigo (logica)");
  // ═══════════════════════════════════════════════════════════════════════════

  // Simulamos lo que hace POST /api/beta-codes/redeem
  async function redeem(professionalId: string, codeStr: string) {
    const code = await db.betaCode.findUnique({ where: { code: codeStr } });
    if (!code) return { status: 404, error: "Codigo invalido" };
    if (code.expiresAt && code.expiresAt < new Date()) return { status: 410, error: "Codigo expirado" };
    if (code.redemptionsCount >= code.maxRedemptions) return { status: 410, error: "Codigo agotado" };
    const existing = await db.betaCodeRedemption.findUnique({ where: { professionalId } });
    if (existing) return { status: 409, error: "Ya canjeaste un codigo antes" };

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + code.validForDays);

    await db.$transaction([
      db.betaCodeRedemption.create({ data: { codeId: code.id, professionalId } }),
      db.betaCode.update({ where: { id: code.id }, data: { redemptionsCount: { increment: 1 } } }),
      db.professional.update({
        where: { id: professionalId },
        data: {
          subscriptionStatus: "beta",
          subscriptionExpiresAt: expiresAt,
          onboardingCompletedAt: new Date(),
        },
      }),
    ]);
    return { status: 200, expiresAt };
  }

  // Happy path
  const r1 = await redeem(pro1.id, "TEST-SINGLE");
  if (r1.status === 200) ok("Canje exitoso (happy path)");
  else fail("Canje deberia ser 200", r1);

  const pro1After = await db.professional.findUnique({ where: { id: pro1.id } });
  if (pro1After?.subscriptionStatus === "beta") ok("subscriptionStatus paso a 'beta'");
  else fail("subscriptionStatus no cambio", pro1After?.subscriptionStatus);

  if (pro1After?.onboardingCompletedAt) ok("onboardingCompletedAt seteado tras canje");
  else fail("onboardingCompletedAt no seteado");

  // 90 dias desde ahora (margen de tolerancia 1 hora por el tiempo del test)
  const expectedExpiry = Date.now() + 90 * 24 * 60 * 60 * 1000;
  const actualExpiry = pro1After?.subscriptionExpiresAt?.getTime() ?? 0;
  if (Math.abs(actualExpiry - expectedExpiry) < 60 * 60 * 1000) {
    ok("subscriptionExpiresAt = ~90 dias en el futuro");
  } else {
    fail("Expiracion incorrecta", { expected: new Date(expectedExpiry), actual: pro1After?.subscriptionExpiresAt });
  }

  const codeSingleAfter = await db.betaCode.findUnique({ where: { id: codeSingle.id } });
  if (codeSingleAfter?.redemptionsCount === 1) ok("redemptionsCount incrementado a 1");
  else fail("redemptionsCount no incremento", codeSingleAfter?.redemptionsCount);

  // Codigo invalido
  const pro2 = await createPro("pro2");
  const r2 = await redeem(pro2.id, "TEST-NOEXISTE");
  if (r2.status === 404) ok("Codigo inexistente: 404");
  else fail("Deberia ser 404", r2);

  // Codigo expirado
  const r3 = await redeem(pro2.id, "TEST-EXPIRED");
  if (r3.status === 410) ok("Codigo expirado: 410");
  else fail("Deberia ser 410", r3);

  // Codigo agotado (single-use ya canjeado por pro1)
  const r4 = await redeem(pro2.id, "TEST-SINGLE");
  if (r4.status === 410) ok("Codigo single-use agotado: 410");
  else fail("Deberia ser 410", r4);

  // Pro ya canjeo otro codigo (pro1 ya canjeo TEST-SINGLE)
  const r5 = await redeem(pro1.id, "TEST-MULTI");
  if (r5.status === 409) ok("Pro re-canjeando: 409 (un solo canje por pro)");
  else fail("Deberia ser 409", r5);

  // ═══════════════════════════════════════════════════════════════════════════
  section("[4] Codigo multi-use");
  // ═══════════════════════════════════════════════════════════════════════════

  const proA = await createPro("multi-a");
  const proB = await createPro("multi-b");
  const proC = await createPro("multi-c");
  const proD = await createPro("multi-d");

  const ra = await redeem(proA.id, "TEST-MULTI");
  const rb = await redeem(proB.id, "TEST-MULTI");
  const rc = await redeem(proC.id, "TEST-MULTI");
  if (ra.status === 200 && rb.status === 200 && rc.status === 200) {
    ok("3 canjes exitosos en codigo multi-use");
  } else {
    fail("Algun canje fallo", { ra, rb, rc });
  }

  const rd = await redeem(proD.id, "TEST-MULTI");
  if (rd.status === 410) ok("4to canje rechazado (max 3)");
  else fail("Deberia ser 410 al superar max", rd);

  const codeMultiAfter = await db.betaCode.findUnique({ where: { id: codeMulti.id } });
  if (codeMultiAfter?.redemptionsCount === 3) ok("redemptionsCount llego a 3");
  else fail("redemptionsCount esperado 3", codeMultiAfter?.redemptionsCount);

  // ═══════════════════════════════════════════════════════════════════════════
  section("[5] Skip (continuar sin codigo)");
  // ═══════════════════════════════════════════════════════════════════════════

  const proSkip = await createPro("skip");
  await db.professional.update({
    where: { id: proSkip.id },
    data: { onboardingCompletedAt: new Date() },
  });
  const proSkipAfter = await db.professional.findUnique({ where: { id: proSkip.id } });
  if (proSkipAfter?.onboardingCompletedAt) ok("Skip marca onboardingCompletedAt");
  else fail("onboardingCompletedAt no se seteo");

  if (proSkipAfter?.subscriptionStatus === "trial") ok("Skip mantiene trial (no pasa a beta)");
  else fail("Status no deberia cambiar en skip", proSkipAfter?.subscriptionStatus);

  // ═══════════════════════════════════════════════════════════════════════════
  section("[6] Feedback");
  // ═══════════════════════════════════════════════════════════════════════════

  const proFb = await createPro("feedback");

  await db.feedback.create({
    data: { professionalId: proFb.id, message: "Funciona genial", rating: 5 },
  });
  ok("Feedback con rating creado");

  await db.feedback.create({
    data: { professionalId: proFb.id, message: "Sin rating", rating: null },
  });
  ok("Feedback sin rating creado");

  const fbCount = await db.feedback.count({ where: { professionalId: proFb.id } });
  if (fbCount === 2) ok("Feedback se persiste correctamente");
  else fail("Esperaba 2 feedback", fbCount);

  // ═══════════════════════════════════════════════════════════════════════════
  section("[7] Cascade delete");
  // ═══════════════════════════════════════════════════════════════════════════

  // Borrar pro deberia borrar feedback y redemption (onDelete: Cascade)
  const proCascade = await createPro("cascade");
  await redeem(proCascade.id, "TEST-MULTI"); // este ya esta agotado, no funciona
  // Forzar redemption manualmente con un codigo nuevo
  const codeC = await db.betaCode.create({
    data: { code: "TEST-CASCADE", validForDays: 90, maxRedemptions: 1 },
  });
  await redeem(proCascade.id, "TEST-CASCADE");

  await db.feedback.create({
    data: { professionalId: proCascade.id, message: "test cascade" },
  });

  await db.professional.delete({ where: { id: proCascade.id } });

  const orphanRedemption = await db.betaCodeRedemption.findFirst({
    where: { professionalId: proCascade.id },
  });
  if (!orphanRedemption) ok("Cascade: redemption borrada al borrar pro");
  else fail("Quedo redemption huerfana");

  const orphanFb = await db.feedback.findFirst({
    where: { professionalId: proCascade.id },
  });
  if (!orphanFb) ok("Cascade: feedback borrado al borrar pro");
  else fail("Quedo feedback huerfano");

  // ═══════════════════════════════════════════════════════════════════════════
  section("[8] Limpieza");
  // ═══════════════════════════════════════════════════════════════════════════

  await db.feedback.deleteMany({ where: { professional: { email: { startsWith: TEST_PREFIX } } } });
  await db.betaCodeRedemption.deleteMany({ where: { professional: { email: { startsWith: TEST_PREFIX } } } });
  await db.professional.deleteMany({ where: { email: { startsWith: TEST_PREFIX } } });
  await db.betaCode.deleteMany({ where: { code: { startsWith: "TEST-" } } });
  ok("Datos de test limpiados");

  // ═══════════════════════════════════════════════════════════════════════════
  console.log(`\nResultado: ${passed} pasados, ${failed} fallados`);
  await db.$disconnect();
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
